# MySQL 主从复制与分库分表实战

> 前言：想象你是餐厅老板，只有一个厨师，这个厨师既要炒菜又要洗碗，生意好的时候客人等得不耐烦。怎么办？招更多厨师！但新厨师来了后，原来的菜谱（数据）要不要同步给他？厨房的锅碗瓢盆怎么分配？这就是 MySQL 主从复制和分库分表要解决的问题——让数据库能够"分身术"，同时服务更多请求，数据还能保持一致。

## 一、主从复制：数据库的"分身术"

### 1.1 什么是主从复制？

**主从复制（Master-Slave Replication）**：将主库（Master）的数据实时同步到一个或多个从库（Slave），主库负责写操作，从库负责读操作，实现读写分离。

```
主从复制架构：

                    ┌─────────────┐
                    │   客户端     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
      ┌──────────────┐    │    ┌──────────────┐
      │   Master     │    │    │   Slave 1    │
      │  (主库)       │    │    │  (从库1)     │
      │  写操作       │────┼───▶│  读操作      │
      └──────────────┘    │    └──────────────┘
              │           │
              │           │  实时同步
              │           │
              ▼           │
      ┌──────────────┐    │
      │   Binlog     │────┘
      │  (二进制日志)  │
      └──────────────┘
              ▲
              │
      ┌──────────────┐
      │   Slave 2    │
      │  (从库2)      │
      └──────────────┘
```

### 1.2 主从复制的工作原理

```sql
-- MySQL 主从复制核心三步：

-- 1. Master 记录 Binary Log（binlog）
--    主库执行完数据变更后，将操作记录到 binlog
--    binlog 包含：变更的SQL、位置信息、时间戳

-- 2. Master 推送 Binlog 到 Slave
--    主库会启动一个 binlog dump 线程
--    将 binlog 内容发送给从库的 I/O 线程

-- 3. Slave 重放 Relay Log
--    从库接收到 binlog 后写入 relay log（中继日志）
--    从库的 SQL 线程读取 relay log 并执行这些操作

-- 三个核心线程：
-- Master: Binlog Dump Thread
-- Slave: I/O Thread（接收 binlog）
-- Slave: SQL Thread（执行 SQL）
```

### 1.3 主从复制的配置

```sql
-- ========== Master 配置 ==========
-- 1. 启用 binlog
[mysqld]
server-id = 1                    -- 唯一标识，整个复制拓扑中不能重复
log-bin = /var/lib/mysql/mysql-bin  -- binlog 文件路径
sync-binlog = 1                  -- 每执行一次事务就同步到磁盘
binlog-format = ROW             -- binlog 格式：ROW/STATEMENT/MIXED

-- 2. 创建复制用户
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl_password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- 3. 备份主库数据（用于初始化从库）
mysqldump -u root -p --all-databases --master-data=2 > backup.sql

-- ========== Slave 配置 ==========
-- 1. 配置 server-id
[mysqld]
server-id = 2                    -- 必须与主库不同

-- 2. 启用 relay log
relay-log = /var/lib/mysql/relay-bin
relay-log-purge = ON            -- 自动删除已应用的 relay log

-- 3. 设置只读（可选，防止从库写入）
read-only = ON
super-read-only = ON            -- 即使有 SUPER 权限也不能写入

-- 4. 启动复制
CHANGE MASTER TO
    MASTER_HOST = '192.168.1.100',
    MASTER_PORT = 3306,
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'repl_password',
    MASTER_LOG_FILE = 'mysql-bin.000001',
    MASTER_LOG_POS = 154;       -- 从备份中获取的位置

-- 5. 启动 slave 线程
START SLAVE;

-- 6. 查看复制状态
SHOW SLAVE STATUS\G;
```

### 1.4 Binlog 的三种格式

```sql
-- Binlog 格式决定了如何记录数据变更

-- 1. STATEMENT 格式（基于SQL语句）
--    记录修改数据的 SQL 语句
--    优点：binlog 文件小
--    缺点：依赖函数的语句可能结果不一致

SET binlog_format = STATEMENT;

-- 例如：记录这条 SQL
UPDATE orders SET created_at = NOW() WHERE id = 1;
-- binlog 记录：UPDATE orders SET created_at = NOW() WHERE id = 1;
-- 从库执行：同样的 NOW()，但时间是主库执行时的时间

-- 2. ROW 格式（基于行）
--    记录每行数据的实际变更
--    优点：准确记录每一行
--    缺点：binlog 文件较大

SET binlog_format = ROW;

-- 例如：更新 10000 行数据
UPDATE orders SET status = 1 WHERE user_id = 5;
-- binlog 记录：这 10000 行的实际变更内容
-- 可能是几十 MB 的 binlog

-- 3. MIXED 格式（混合）
--    MySQL 默认，会自动选择
--    一般用 STATEMENT，必要时用 ROW

SET binlog_format = MIXED;

-- 推荐：使用 ROW 格式
-- 虽然 binlog 大，但准确性高，不会出现主从数据不一致
-- 现代 SSD 存储成本低，容量不是问题
```

### 1.5 GTID 复制：更现代的复制方式

```sql
-- GTID = Global Transaction Identifier
-- 全局事务ID，MySQL 5.7+ 支持

-- GTID 的优势：
-- 1. 自动定位，无需指定 binlog 文件和位置
-- 2. 更容易搭建主从，切换主库更方便
-- 3. 支持并行复制，提高从库同步速度
-- 4. 更容易监控复制状态

-- GTID 配置
[mysqld]
server-id = 1
gtid-mode = ON                  -- 启用 GTID
enforce-gtid-consistency = ON    -- 强制 GTID 一致性
log-bin = /var/lib/mysql/mysql-bin
binlog-format = ROW

-- 使用 GTID 搭建从库
CHANGE MASTER TO
    MASTER_HOST = '192.168.1.100',
    MASTER_PORT = 3306,
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'repl_password',
    MASTER_AUTO_POSITION = 1;    -- 开启自动定位

START SLAVE;

-- GTID 工作原理：
-- 1. 主库每个事务分配一个 GTID：source_id:transaction_id
--    例如：3E11FA47-1C6B-11E4-9F77-42010AF0D3PD:123
-- 2. 从库记录已执行的事务 GTID
-- 3. 新主库只需读取从库缺失的事务

-- 查看 GTID 信息
SHOW MASTER STATUS\G;
SHOW SLAVE STATUS\G;
```

## 二、读写分离：让数据库"分身"干活

### 2.1 读写分离的原理

```
传统架构：所有请求都打到主库
┌─────────────────────────────────┐
│           应用服务器              │
└───────────────┬─────────────────┘
                │
                ▼
        ┌───────────────┐
        │     主库      │ ← 瓶颈！所有读写都在这里
        └───────────────┘

读写分离架构：
┌─────────────────────────────────┐
│           应用服务器              │
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌───────────────┐   ┌───────────────┐
│     主库      │   │     从库       │
│    (写操作)   │   │    (读操作)    │
└───────────────┘   └───────────────┘
```

### 2.2 读写分离的实现方式

```sql
-- 方式1：应用层实现（最灵活）
-- 在代码中区分读写操作

// 伪代码示例
class DatabaseRouter {
    // 读操作路由到从库
    async function query(sql) {
        // 如果是从库延迟可接受，使用从库
        if (isReadOnly(sql)) {
            return await this.slave.query(sql);
        }
        // 写操作走主库
        return await this.master.query(sql);
    }

    // 写操作路由到主库
    async function execute(sql) {
        return await this.master.execute(sql);
    }
}

// 使用示例
const db = new DatabaseRouter();

// 读操作（走从库）
const users = await db.query('SELECT * FROM users WHERE id = 1');

// 写操作（走主库）
await db.execute('UPDATE users SET name = "张三" WHERE id = 1');

// 方式2：中间件实现（MyCAT / ShardingSphere）
-- 配置读写分离规则
-- 应用只连接中间件，不需要关心读写分离逻辑

-- 方式3：MySQL Proxy / ProxySQL
-- 在代理层配置读写分离
-- 应用无感知
```

### 2.3 主从延迟问题及处理

```sql
-- 主从延迟的原因：
-- 1. 主库写入 binlog
-- 2. 从库 I/O 线程拉取 binlog（网络延迟）
-- 3. 从库 SQL 线程重放日志（如果并发高，SQL 线程可能跟不上）

-- 查看从库延迟
SHOW SLAVE STATUS\G;
-- Seconds_Behind_Master: 0 表示没有延迟
-- Seconds_Behind_Master: 120 表示延迟 2 分钟

-- 解决方案1：延迟读取
-- 读操作延迟一定时间，确保主从同步完成
async function readFromSlave(sql) {
    await sleep(1);  // 延迟 1 秒
    return await slave.query(sql);
}

-- 解决方案2：强制读主库
-- 对于必须读到最新数据的场景，强制走主库
async function readFromMaster(sql) {
    return await master.query(sql);
}

-- 场景判断：
-- 用户头像 → 可以从库（延迟几秒无所谓）
-- 用户下单 → 必须主库（看到的数据必须是最新）
-- 支付结果 → 必须主库（金额必须准确）
-- 朋友圈评论 → 可以从库（延迟 1-2 秒用户感知不强）

-- 解决方案3：配置半同步复制
-- 主库等待至少一个从库确认写入成功后才提交
-- 确保数据至少同步到一个从库
```

### 2.4 主从复制的高级配置

```sql
-- 并行复制：从库 SQL 线程可以并行执行，提高同步速度

-- MySQL 5.7+ 支持并行复制
-- 配置：
[mysqld]
slave-parallel-workers = 8              -- 8 个 worker 线程
slave-parallel-type = LOGICAL_CLOCK     -- 按逻辑时钟并行
slave-preserve-commit-order = ON        -- 保持提交顺序

-- MySQL 8.0+ 支持writeset 并行复制
-- 基于事务的冲突检测，更细粒度的并行
slave-parallel-type = WRITE_SET
slave-parallel-workers = 16

-- 主从切换（Failover）
-- 当主库故障时，需要将一个从库提升为新的主库

-- 步骤：
-- 1. 确认哪个从库数据最新
SHOW SLAVE STATUS\G;
-- 找到 Exec_Master_Log_Pos 最大的那个

-- 2. 停止所有从库复制
STOP SLAVE ALL ON slave1;
STOP SLAVE ALL ON slave2;

-- 3. 在选中的从库上执行切换
STOP SLAVE;
RESET SLAVE ALL;
SET GLOBAL read_only = OFF;  -- 取消只读

-- 4. 其他从库指向新的主库
CHANGE MASTER TO
    MASTER_HOST = '192.168.1.101',  -- 新主库的 IP
    MASTER_USER = 'repl',
    MASTER_PASSWORD = 'repl_password',
    MASTER_AUTO_POSITION = 1;

START SLAVE;

-- 5. 迁移应用服务器的主库连接
-- 更新连接配置指向新的主库
```

## 三、分库分表：突破数据库瓶颈

### 3.1 什么时候需要分库分表？

```
分库分表触发条件（经验值）：

单表数据量超过 1000 万条
   ↓
查询性能急剧下降，索引优化也无法解决
   ↓
分库分表

其他信号：
- 单表容量超过 10GB
- 数据库 CPU 使用率长期超过 80%
- 数据库连接数接近上限
- 磁盘 IO 成为瓶颈
```

### 3.2 垂直拆分：按业务拆分

```
垂直拆分：按业务模块拆分表结构

拆分前（所有表在一个库）：
┌─────────────────────────────┐
│          电商数据库           │
├─────────────────────────────┤
│ users（用户表）              │
│ products（商品表）            │
│ orders（订单表）              │
│ inventory（库存表）           │
│ payments（支付表）            │
└─────────────────────────────┘

拆分后（按业务模块分库）：
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   用户库     │ │   商品库     │ │   订单库     │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ users       │ │ products     │ │ orders       │
│ addresses   │ │ categories   │ │ order_items  │
│ preferences │ │ inventory    │ │ payments     │
└──────────────┘ └──────────────┘ └──────────────┘

垂直拆分原则：
1. 按业务边界拆分，相关表放一起
2. 减少单库容量，提升备份恢复速度
3. 但单表数据量不会减少
```

### 3.3 水平拆分：按数据拆分

```
水平拆分：将表的数据按某种规则分散到多个表/库

拆分前（单表 1 亿条数据）：
┌─────────────────────────────┐
│         orders 表           │
│  1亿条订单数据               │
│  查询一次要 30 秒            │
└─────────────────────────────┘

拆分后（按 user_id 取模拆成 16 张表）：
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│orders_0   │ │orders_1   │ │orders_2   │ │orders_3   │
│ 625万条   │ │ 625万条   │ │ 625万条   │ │ 625万条   │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│orders_4   │ │orders_5   │ │orders_6   │ │orders_7   │
│ 625万条   │ │ 625万条   │ │ 625万条   │ │ 625万条   │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
... 共 16 张表，每张 625 万条
```

### 3.4 分片策略详解

```sql
-- 常见的分片策略：

-- 1. 哈希分片（Hash Sharding）
--    根据分片键的哈希值取模
--    优点：数据分布均匀
--    缺点：扩缩容时需要迁移大量数据

-- user_id 取模分片
user_id % 16 = 0~15，决定存在哪张表

-- 2. 范围分片（Range Sharding）
--    根据分片键的范围进行拆分
--    优点：扩缩容方便，只影响相邻的分片
--    缺点：可能导致热点数据不均匀

-- 按时间分片
orders_202401：2024年1月的订单
orders_202402：2024年2月的订单
orders_202403：2024年3月的订单

-- 3. 列表分片（List Sharding）
--    根据分片键的枚举值进行拆分
--    优点：业务可控制
--    缺点：需要提前规划

-- 按地区分片
orders_beijing：北京地区订单
orders_shanghai：上海地区订单
orders_guangzhou：广州地区订单

-- 4. 复合分片（复合键）
--    组合多个分片键
--    优点：更灵活
--    缺点：路由算法复杂

-- user_id + 时间复合分片
hash(user_id + year) % 16
```

### 3.5 分库分表的 SQL 写法

```sql
-- 分库分表后的查询

-- 假设 orders 表按 user_id % 4 拆分成 4 张表
-- orders_0, orders_1, orders_2, orders_3

-- 场景1：查询用户的所有订单
-- ❌ 错误的写法：无法知道数据在哪张表
SELECT * FROM orders WHERE user_id = 123;

-- ✅ 正确的写法：先计算表名，再查询
function getUserOrders(userId) {
    tableIndex = userId % 4;
    tableName = 'orders_' + tableIndex;
    return query(`SELECT * FROM ${tableName} WHERE user_id = ${userId}`);
}

-- 场景2：查询某时间段的所有订单
-- ❌ 需要扫描所有分片
SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';

-- ✅ 优化：先按时间范围确定分片，再查询
-- 如果按月分表，先确定是哪个月的表
yearMonth = '202401';
tableName = 'orders_' + yearMonth;
return query(`SELECT * FROM ${tableName}
               WHERE created_at >= '2024-01-01'
               AND created_at < '2024-02-01'`);

-- 场景3：跨分片查询（需要汇总）
-- 假设要统计某用户的历史订单总数
function getUserOrderCount(userId) {
    total = 0;
    for i in range(0, 16) {
        // 每个分片都要查询
        result = query(`SELECT COUNT(*) FROM orders_${i}
                       WHERE user_id = ${userId}`);
        total += result;
    }
    return total;
}

-- 场景4：分页查询
-- 假设每页 10 条，要查第 5 页（offset=40）
function getUserOrdersPage(userId, page, pageSize) {
    // 需要从每个分片取前 50 条，再汇总排序取第 41-50 条
    allOrders = [];
    for i in range(0, 16) {
        result = query(`SELECT * FROM orders_${i}
                       WHERE user_id = ${userId}
                       ORDER BY created_at DESC
                       LIMIT ${page * pageSize}`);
        allOrders.concat(result);
    }
    // 汇总后再排序分页
    allOrders.sort((a, b) => b.created_at - a.created_at);
    return allOrders.slice((page-1)*pageSize, page*pageSize);
}
```

### 3.6 分库分表框架

```sql
-- 业界主流分库分表中间件：

-- 1. ShardingSphere-JDBC（Java SDK）
--    轻量级，对应用透明
--    通过算法自动路由到正确的分片

-- Maven 引入
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core</artifactId>
    <version>5.3.0</version>
</dependency>

-- 配置分片规则
spring:
  shardingsphere:
    rules:
      sharding:
        tables:
          orders:
            actualDataNodes: ds_${0..3}.orders_${0..15}
            tableStrategies:
              sharding:
                standard:
                  shardingColumn: user_id
                  shardingAlgorithmName: orders_inline
            keyGenerateStrategy:
              column: order_id
              keyGeneratorName: snowflake
        shardingAlgorithms:
          orders_inline:
            type: INLINE
            props:
              algorithm-expression: orders_${user_id % 16}

-- 2. ShardingSphere-Proxy（中间件）
--    部署为独立服务，支持多语言

-- 3. MyCAT（老牌分库分表中间件）
--    基于阿里的 Cobar 二次开发

-- 4. Vitess（YouTube 开源）
--    支持水平扩展的数据库集群解决方案
```

## 四、分布式 ID：分库分表后的主键问题

### 4.1 分布式 ID 的要求

```
分布式 ID 的特点：

1. 全局唯一：跨所有分片都唯一
2. 趋势递增：最好是趋势递增的（有利于索引）
3. 高性能：能高并发生成
4. 可预测：能够从 ID 反推分片信息
5. 高可用：不能有单点故障

常见的分布式 ID 算法：
- UUID
- Snowflake
- Leaf（美团）
- TinyID（滴滴）
- UidGenerator（百度）
```

### 4.2 UUID：简单但不完美

```sql
-- UUID（通用唯一标识符）
-- 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
-- 例如：550e8400-e29b-41d4-a716-446655440000

-- MySQL 生成 UUID
SELECT UUID();

-- Java 生成 UUID
String uuid = UUID.randomUUID().toString();

-- UUID 的问题：
-- 1. 无序：UUID 是随机的，对索引不友好
-- 2. 存储：36 个字符，比 INT/BIGINT 大
-- 3. 可读性：无法从 ID 看出业务含义
-- 4. 性能：随机 IO vs 顺序 IO

-- 结论：UUID 只适合不在乎性能的场景，如日志追踪
```

### 4.3 Snowflake：主流方案

```
Snowflake 算法原理：

┌──────────────────────────────────────────────────────────────────┐
│                        64 位 ID 结构                            │
├─────────────┬─────────────────────┬──────────────────────────────┤
│ 符号位      │      时间戳         │         序列号                │
│ (1 bit)    │    (41 bits)       │        (12 bits)            │
│  始终为 0   │   相对某个起点       │    每毫递增，溢出归零         │
└─────────────┴─────────────────────┴──────────────────────────────┘
       │              │                        │
       │              │                        │
       ▼              ▼                        ▼
     不用管        可以用 69 年              每毫秒 4096 个 ID

64 位构成：
- 1 位符号位（固定 0）
- 41 位时间戳（毫秒级），可用 69 年
- 10 位机器 ID（5 位数据中心 + 5 位机器）
- 12 位序列号（每毫秒最多 4096 个 ID）

每秒理论并发：4096 * 1000 = 409 万个 ID
```

### 4.4 Snowflake 的实现

```sql
-- MySQL 实现 Snowflake

-- 创建 Snowflake 表
CREATE TABLE IF NOT EXISTS snowflake_node (
    id BIGINT PRIMARY KEY,           -- 节点 ID
    last_timestamp BIGINT NOT NULL,  -- 上次时间戳
    sequence BIGINT DEFAULT 0         -- 当前序列号
) ENGINE=InnoDB;

-- Snowflake 算法实现
DELIMITER //

CREATE FUNCTION generate_snowflake_id(node_id BIGINT)
RETURNS BIGINT
BEGIN
    DECLARE current_timestamp BIGINT;
    DECLARE last_timestamp BIGINT;
    DECLARE sequence BIGINT;
    DECLARE new_id BIGINT;

    -- 机器 ID 占用的位数
    DECLARE MACHINE_ID_BITS INT DEFAULT 10;
    -- 序列号占用的位数
    DECLARE SEQUENCE_BITS INT DEFAULT 12;
    -- 时间戳左移位数
    DECLARE TIMESTAMP_SHIFT INT DEFAULT (MACHINE_ID_BITS + SEQUENCE_BITS);

    -- 时间起点（2024-01-01）
    DECLARE EPOCH BIGINT DEFAULT 1704067200000;

    SET current_timestamp = UNIX_TIMESTAMP(NOW(3)) * 1000;
    SET last_timestamp = (SELECT last_timestamp FROM snowflake_node WHERE id = node_id FOR UPDATE);
    SET sequence = (SELECT sequence FROM snowflake_node WHERE id = node_id FOR UPDATE);

    -- 如果当前时间小于上次时间，说明时钟回拨
    IF current_timestamp < last_timestamp THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Clock moved backwards';
    END IF;

    -- 如果是同一毫秒，序列号递增；否则归零
    IF current_timestamp = last_timestamp THEN
        SET sequence = (sequence + 1) & 4095;  -- 4095 = 2^12 - 1
    ELSE
        SET sequence = 0;
    END IF;

    -- 更新状态
    UPDATE snowflake_node
    SET last_timestamp = current_timestamp,
        sequence = sequence
    WHERE id = node_id;

    -- 生成 ID
    SET new_id = ((current_timestamp - EPOCH) << TIMESTAMP_SHIFT)
                 | (node_id << SEQUENCE_BITS)
                 | sequence;

    RETURN new_id;
END //

DELIMITER ;

-- 使用示例
INSERT INTO snowflake_node (id, last_timestamp, sequence) VALUES (1, 0, 0);
SELECT generate_snowflake_id(1);
```

### 4.5 分片键选择的艺术

```sql
-- 分片键的选择原则：

-- 1. 业务逻辑键：能够代表业务实体的键
--    如：用户相关业务用 user_id，订单相关用 order_id

-- 2. 访问频率键：经常作为查询条件的键
--    因为分片后只能高效查询分片键

-- 3. 分布均匀键：能够使数据均匀分布的键
--    避免热点问题

-- 常见分片键选择：

-- 用户模块：用 user_id 分片
-- 优点：用户查询自己数据很快
-- 缺点：跨用户查询很慢（如：查询所有女性用户）

-- 订单模块：用 user_id 分片 OR 用 order_id 分片

-- 方案 A：用 user_id 分片
-- 适用场景：以用户为中心的查询
-- SELECT * FROM orders WHERE user_id = 123;  -- 高效
-- SELECT * FROM orders WHERE created_at > '2024-01-01';  -- 低效，需扫描所有分片

-- 方案 B：用 order_id 分片（雪花 ID）
-- 适用场景：以订单为中心的查询
-- 优点：order_id 包含时间戳，可以按时间范围分片
-- SELECT * FROM orders WHERE order_id = '...';  -- 高效
-- 缺点：查询某个用户的所有订单，需要跨分片

-- 最佳实践：复合分片键
-- (user_id, created_at) 或 (user_id, order_id)
-- 兼顾用户查询和时间范围查询
```

## 五、分库分表实战案例

### 5.1 订单表分库分表设计

```sql
-- 订单系统分库分表实战

-- 需求分析：
-- 1. 每天 1000 万订单
-- 2. 用户需要查询自己的订单列表
-- 3. 商家需要查询自己店铺的订单
-- 4. 运营需要按时间查询所有订单

-- 方案设计：
-- 1. 分片数量：16 个分片
-- 2. 分片键：user_id % 16（用户维度）
-- 3. 冗余商家 ID 字段，方便商家查询

-- 分片后的表结构
CREATE TABLE orders_0 (
    id BIGINT PRIMARY KEY,              -- 雪花 ID
    order_no VARCHAR(64) NOT NULL,      -- 订单号
    user_id BIGINT NOT NULL,            -- 用户 ID（分片键）
    merchant_id BIGINT NOT NULL,        -- 商家 ID（冗余字段）
    total_amount DECIMAL(10,2),         -- 总金额
    status TINYINT,                     -- 订单状态
    created_at DATETIME,                -- 创建时间
    updated_at DATETIME,                -- 更新时间
    INDEX idx_user_id (user_id),        -- 用户查询
    INDEX idx_merchant_status (merchant_id, status),  -- 商家查询
    INDEX idx_created_at (created_at)   -- 时间查询
) ENGINE=InnoDB;

-- 商家查询（不跨分片）
-- 因为商家 ID 和分片键无关，需要遍历所有分片
function getMerchantOrders(merchantId, page, pageSize) {
    allOrders = [];
    for i in range(0, 16) {
        result = query(`SELECT * FROM orders_${i}
                       WHERE merchant_id = ${merchantId}
                       ORDER BY created_at DESC
                       LIMIT ${page * pageSize}`);
        allOrders.concat(result);
    }
    // 汇总后再排序分页
    allOrders.sort((a, b) => b.created_at - a.created_at);
    return allOrders.slice((page-1)*pageSize, page*pageSize);
}

-- 跨分片 COUNT 查询
function getMerchantOrderCount(merchantId) {
    total = 0;
    for i in range(0, 16) {
        result = query(`SELECT COUNT(*) FROM orders_${i}
                       WHERE merchant_id = ${merchantId}`);
        total += result;
    }
    return total;
}

-- 全局查询（按时间）
function getOrdersByTimeRange(startTime, endTime) {
    allOrders = [];
    for i in range(0, 16) {
        result = query(`SELECT * FROM orders_${i}
                       WHERE created_at >= '${startTime}'
                       AND created_at < '${endTime}'`);
        allOrders.concat(result);
    }
    return allOrders;
}
```

### 5.2 分库分表后的多表 JOIN

```sql
-- 分库分表后，跨分片的 JOIN 是难题

-- 场景：查询订单及用户信息
-- orders 按 user_id 分片
-- users 按 user_id 分片

-- 方案 1：应用层 JOIN（多次查询）
function getOrderWithUser(orderId, userId) {
    // 1. 先查订单（知道在哪张表）
    tableIndex = userId % 16;
    order = query(`SELECT * FROM orders_${tableIndex}
                   WHERE id = ${orderId} AND user_id = ${userId}`);

    // 2. 再查用户（同一分片，高效）
    user = query(`SELECT * FROM users_${tableIndex}
                  WHERE id = ${userId}`);

    return { ...order, user };
}

-- 方案 2：同步冗余字段
-- orders 表冗余用户名字段
ALTER TABLE orders ADD COLUMN user_name VARCHAR(50);

-- 查询时不需要 JOIN
SELECT id, order_no, user_name, total_amount
FROM orders WHERE user_id = 123;

-- 缺点：数据可能不一致
-- 解决：使用触发器或消息队列同步

-- 方案 3：ElasticSearch 搜索引擎
-- 将订单数据同步到 ES
-- ES 支持复杂的 JOIN 查询
-- 应用查询 ES 获取订单 ID 列表
-- 再从 MySQL 分片获取详情

-- 方案 4：使用视图或全局表
-- 某些小表不做分片（如字典表）
-- 作为全局表在每个分片都保留一份
-- 查询时直接查本分片的全局表
```

### 5.3 数据迁移：平滑过渡

```sql
-- 分库分表数据迁移策略

-- 阶段 1：双写阶段
-- 应用同时写旧库和新库

// 伪代码：双写逻辑
async function createOrder(orderData) {
    // 1. 写旧库
    await oldDb.insert('orders', orderData);

    // 2. 写新库
    tableIndex = orderData.user_id % 16;
    tableName = 'orders_' + tableIndex;
    await newDb.insert(tableName, orderData);

    // 3. 返回
    return orderData;
}

-- 阶段 2：数据同步
-- 使用 binlog 或定时任务同步历史数据

// 增量同步脚本（伪代码）
async function syncData(batchSize = 1000) {
    // 1. 从旧库读取未同步的数据
    const oldOrders = await oldDb.query(`
        SELECT * FROM orders
        WHERE id > ${lastSyncedId}
        ORDER BY id
        LIMIT ${batchSize}
    `);

    // 2. 写入新库
    for (const order of oldOrders) {
        tableIndex = order.user_id % 16;
        tableName = 'orders_' + tableIndex;
        await newDb.insert(tableName, order);
    }

    // 3. 记录同步位置
    if (oldOrders.length > 0) {
        lastSyncedId = oldOrders[oldOrders.length - 1].id;
        await redis.set('sync:last_id', lastSyncedId);
    }
}

-- 阶段 3：切换读流量
-- 先切换少量读流量到新库，观察
// 99% 读旧库，1% 读新库
if (Math.random() < 0.01) {
    return await newDb.query(sql);
} else {
    return await oldDb.query(sql);
}

-- 阶段 4：全量切换
// 100% 读写新库，旧库可以保留一段时间后下线
```

## 六、数据库横向扩展总结

```
主从复制总结：

核心原理：
├── Binlog：记录主库所有变更
├── I/O 线程：从库拉取 binlog
└── SQL 线程：重放 relay log

复制方式：
├── 异步复制：主库不等从库确认
├── 半同步复制：至少一个从库确认
└── 全同步复制：所有从库确认

GTID 复制：
├── 自动定位，无需指定 binlog 位置
└── 支持并行复制

读写分离：
├── 读从库，写主库
├── 解决主库并发压力
└── 引入主从延迟问题

分库分表总结：

拆分方式：
├── 垂直拆分：按业务模块
└── 水平拆分：按数据分片

分片策略：
├── 哈希分片：分布均匀
├── 范围分片：适合时间序列
└── 列表分片：按枚举值

分布式 ID：
├── UUID：简单但无序
├── Snowflake：主流方案
└── 复合分片键：兼顾多种查询

数据迁移：
├── 双写：同时写新旧库
├── 增量同步：逐步迁移
└── 灰度切换：流量逐步迁移
```

> **最终提醒：** 数据库横向扩展是解决大数据量、高并发的终极方案，但也会引入系统复杂度。在决定分库分表之前，先尝试优化索引、优化查询、升级硬件、读写分离等方案。分库分表是"核武器"，能不用就不用，如果必须用，就要做好充分的技术准备和运维预案。
