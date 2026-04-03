# 时序数据库与 OLAP 实战指南

> 前言：你有没有想过，股票行情、传感器数据、服务器监控指标，这些数据有一个共同特点——都是按时间顺序源源不断地产生的。每秒可能产生几千甚至几万条记录，而且基本上只有插入操作，很少更新或删除。传统的 MySQL 在这种场景下就像用大炮打蚊子，不仅浪费资源，还可能根本扛不住。这就该时序数据库（TSDB）和 OLAP 数据库登场了。

## 一、时序数据：为什么需要专用数据库？

### 1.1 什么是时序数据？

**时序数据（Time Series Data）**：按时间顺序记录的一系列数据点，每个数据点包含时间戳和若干测量值。

```
时序数据示例：股票每秒行情

时间戳              股票代码   开盘价   最高价   最低价   收盘价    成交量
2024-01-02 09:30:00  600519   1850.00  1860.00  1845.00  1855.00   12345
2024-01-02 09:30:01  600519   1855.00  1858.00  1852.00  1853.00   23456
2024-01-02 09:30:02  600519   1853.00  1865.00  1850.00  1862.00   34567
... (每秒一条，持续 4 小时交易日 = 14400 条/股票)
```

**时序数据的特点：**

```
时序数据 vs 普通业务数据：

时序数据特点：
├── 按时间顺序写入，持续不断
├── 数据量大，压缩存储
├── 很少更新或删除
├── 按时间范围查询为主
├── 通常需要聚合计算（求平均、最大值等）
└── 多维度分析

普通业务数据特点：
├── CRUD 操作平衡
├── 单条数据可能频繁更新
├── 需要事务支持
├── 随机查询为主
└── 关联查询复杂
```

### 1.2 时序数据的典型场景

```sql
-- 场景1：物联网传感器数据
-- 每个传感器每秒上报多条数据
-- 10万个传感器 × 10个测量指标 × 1秒 = 100万数据点/秒

-- 场景2：监控系统指标
-- 服务器 CPU、内存、网络、磁盘等
-- 每台服务器采集 50 个指标，10秒采集一次
-- 1000台服务器 × 50指标 × 0.1次/秒 = 5000数据点/秒

-- 场景3：金融行情数据
-- 股票、期货、数字货币等
-- 高频交易每秒数千笔成交记录

-- 场景4：用户行为数据
-- App 点击流、页面访问
-- 日活 1000万 × 平均 100 次操作 = 10亿条/天
```

### 1.3 为什么 MySQL 不够用？

```sql
-- MySQL 处理时序数据的瓶颈：

-- 瓶颈1：写入性能
-- MySQL 每条数据都需要写索引
-- 10万条/秒的写入，索引维护成为瓶颈
INSERT INTO metrics (ts, device_id, cpu, memory)
VALUES ('2024-01-02 10:00:00', 'device_001', 75.5, 60.2);
-- 需要同时更新 ts 索引、device_id 索引
-- 写入 TPS 受限于索引维护能力

-- 瓶颈2：存储成本
-- 监控数据保留 30 天，1亿条数据
-- 每条数据 100 字节 + 索引开销
-- 占用空间可能超过 100GB

-- 瓶颈3：查询性能
-- 按时间范围查询最近 1 天的数据
SELECT * FROM metrics
WHERE ts >= '2024-01-01 00:00:00'
  AND ts < '2024-01-02 00:00:00'
ORDER BY ts DESC;
-- 如果没有合适的时间索引，可能要扫描大量数据

-- 瓶颈4：聚合查询
-- 计算每台设备每小时的平均 CPU 使用率
SELECT device_id,
       DATE_FORMAT(ts, '%Y-%m-%d %H:00:00') AS hour,
       AVG(cpu) AS avg_cpu
FROM metrics
WHERE ts >= '2024-01-01 00:00:00'
  AND ts < '2024-01-02 00:00:00'
GROUP BY device_id, hour;
-- 全表扫描 + 文件排序，大数据量下几乎无法执行
```

## 二、InfluxDB：时序数据库的标杆

### 2.1 InfluxDB 核心概念

```sql
-- InfluxDB 的数据模型（与 MySQL 对比）

MySQL 模型：Database -> Table -> Row
InfluxDB 模型：Database -> Measurement -> Tag/Field -> Point

-- Measurement（测量）≈ Table
-- Tag（标签）：可索引的元数据，适合作为查询条件
-- Field（字段）：存储的实际测量值
-- Point（数据点）：一条时序数据，类似 MySQL 的一行

-- 示例：服务器监控数据

-- MySQL 写法：
CREATE TABLE server_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ts DATETIME,
    server_id VARCHAR(50),
    region VARCHAR(50),
    cpu DOUBLE,
    memory DOUBLE
);
CREATE INDEX idx_ts ON server_metrics(ts);
CREATE INDEX idx_server ON server_metrics(server_id);

-- InfluxDB 行协议：
-- server_metrics,server_id=127.0.0.1,region=beijing cpu=75.5,memory=60.2 1704067200000000000
--           ↑Measurement       ↑Tags           ↑Fields                        ↑Timestamp(纳秒)

-- InfluxDB 写入：
--measurement,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp

-- measurement：测量名称，如 "cpu_metrics"
-- tag：标签，索引，支持多维度查询
-- field：字段，存储的值，不建立索引
-- timestamp：时间戳，纳秒级精度
```

### 2.2 InfluxDB 的存储结构

```sql
-- InfluxDB 内部存储原理：

-- 1. TSM（Time-Structured Merge Tree）文件
--    专门为时序数据优化的存储引擎
--    类似 LSM Tree，但针对时间序列做了优化

-- TSM 结构：
┌─────────────────────────────────────────────────────┐
│                    InfluxDB Storage                 │
├─────────────────────────────────────────────────────┤
│  WAL (Write Ahead Log)                              │
│  - 先写入 WAL，保证数据不丢失                        │
│  - 定期 flush到 TSM 文件                             │
├─────────────────────────────────────────────────────┤
│  TSM Files (Time-Structured Merge Tree)             │
│  - 按时间分段存储                                    │
│  - 自动压缩和合并                                    │
│  - 支持时间范围快速定位                              │
├─────────────────────────────────────────────────────┤
│  In-Memory Index                                    │
│  - 索引常驻内存                                      │
│  - 支持 Tag 的快速查询                               │
└─────────────────────────────────────────────────────┘

-- 2. 按时间分片（Retention Policy）

-- 示例：创建不同保留策略
CREATE RETENTION POLICY "one_day"
ON monitoring
DURATION 1d
REPLICATION 1;

CREATE RETENTION POLICY "one_month"
ON monitoring
DURATION 30d
REPLICATION 1;

CREATE RETENTION POLICY "forever"
ON monitoring
DURATION INF
REPLICATION 1;

-- one_day 表：只保留最近 1 天
-- one_month 表：只保留最近 30 天
-- forever 表：永久保留

-- 查询时可以指定保留策略
SELECT * FROM "one_month".cpu_metrics
WHERE time >= now() - 7d;
```

### 2.3 InfluxDB 的查询语言：InfluxQL

```sql
-- InfluxQL 与 SQL 类似，但专门用于时序数据

-- 基础查询
SELECT * FROM cpu_metrics
WHERE time >= '2024-01-01' AND time < '2024-01-02';

-- 选择特定字段
SELECT server_id, cpu, memory FROM cpu_metrics;

-- 使用 Tag 过滤（Tag 有索引，效率高）
SELECT * FROM cpu_metrics
WHERE server_id = '127.0.0.1'
  AND region = 'beijing';

-- 使用 Field 过滤（Field 没有索引，效率低）
SELECT * FROM cpu_metrics
WHERE cpu > 80;  -- 全表扫描，不推荐

-- 时间范围函数
SELECT MEAN(cpu) FROM cpu_metrics
WHERE time >= '2024-01-01' AND time < '2024-01-02'
GROUP BY time(1h);  -- 按小时聚合

-- 多个维度聚合
SELECT MEAN(cpu) FROM cpu_metrics
WHERE time >= '2024-01-01' AND time < '2024-01-02'
GROUP BY time(1h), server_id, region;  -- 按时间、服务器、地区分组

-- 连续查询（Continuous Query）
-- 自动执行查询并写入结果表，用于预计算

-- 每分钟计算一次过去 5 分钟的平均 CPU
CREATE CONTINUOUS QUERY "cpu_avg_5m"
ON monitoring
BEGIN
    SELECT MEAN(cpu) AS cpu_avg
    INTO cpu_avg_5m
    FROM cpu_metrics
    GROUP BY time(5m), server_id
END;
```

### 2.4 InfluxDB 的写入性能优化

```sql
-- InfluxDB 写入优化技巧：

-- 1. 批量写入（Batch Size）
-- 单次请求写入多条数据，减少网络开销

-- ❌ 低效：逐条写入
curl -i -XPOST "http://localhost:8086/write?db=mydb" \
  --data-binary "cpu,host=server01 cpu=12.0 1434055562000000000"

-- ✅ 高效：批量写入
curl -i -XPOST "http://localhost:8086/write?db=mydb" \
  --data-binary "cpu,host=server01 cpu=12.0 1434055562000000000
cpu,host=server02 cpu=11.5 1434055562000000001
cpu,host=server03 cpu=13.0 1434055562000000002"

-- 2. 合理设计 Tag 和 Field

-- ✅ Tag 用于：查询条件、分组、基数高的字段
-- server_id、region、user_id 等

-- ✅ Field 用于：需要聚合计算的数值
-- cpu、memory、bytes_sent 等

-- ❌ 不要把高基数字符串放在 Field 中
-- 写入时每条数据都要存储完整的字符串

-- 3. 禁用时间戳自动补全
-- 如果客户端时间不准，可以用服务端时间

-- 4. 使用 Line Protocol 直接写入
-- 最快速的写入方式

-- Line Protocol 格式：
-- measurement,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp

-- 示例：
cpu,host=server01,region=beijing cpu=75.5,memory=60.2 1704067200000000000
```

## 三、TimescaleDB：PostgreSQL 的时序扩展

### 3.1 TimescaleDB 简介

```sql
-- TimescaleDB 是 PostgreSQL 的扩展
-- 结合了关系数据库和时序数据库的优点

-- TimescaleDB 核心概念：

-- Hypertable（超表）：
--  TimescaleDB 的核心，一张逻辑上的表，实际分散存储在多个 Chunk 中

-- Chunk（数据块）：
--  按时间范围或空间分区的小表
--  每个 Chunk 是一个独立的 PostgreSQL 表

-- 创建超表：
CREATE TABLE conditions (
    time        TIMESTAMP NOT NULL,
    location    TEXT NOT NULL,
    temp        DOUBLE PRECISION,
    humidity    DOUBLE PRECISION
);

-- 将表转换为超表（按时间分块，每块 1 天）
SELECT create_hypertable('conditions', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- 创建索引（会自动应用到所有 Chunk）
CREATE INDEX ON conditions (location, time);

-- 插入数据（和普通表一样）
INSERT INTO conditions VALUES
    ('2024-01-01 00:00:00', 'beijing', 22.5, 65.0),
    ('2024-01-01 00:00:00', 'shanghai', 25.0, 70.0);
```

### 3.2 TimescaleDB 的 Hypertable 结构

```
TimescaleDB 存储结构：

┌─────────────────────────────────────────────────────────────┐
│                   conditions 超表（逻辑视图）                │
├─────────────────────────────────────────────────────────────┤
│  Chunk 1: 2024-01-01 ~ 2024-01-07  (7 天的数据)             │
│  Chunk 2: 2024-01-08 ~ 2024-01-14  (7 天的数据)             │
│  Chunk 3: 2024-01-15 ~ 2024-01-21  (7 天的数据)             │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘

查询流程：
1. 定位数据属于哪个 Chunk
2. 只扫描相关 Chunk，避免全表扫描
3. 结果自动合并返回

Hypertable 查询示意：
SELECT * FROM conditions WHERE time >= '2024-01-05' AND time < '2024-01-10';

定位 Chunk：
- Chunk 1 (2024-01-01 ~ 2024-01-07) → 部分命中
- Chunk 2 (2024-01-08 ~ 2024-01-14) → 部分命中
- Chunk 3+ → 不扫描
```

### 3.3 TimescaleDB 的连续聚合

```sql
-- 连续聚合（Continuous Aggregate）
-- 自动维护预计算的聚合表

-- 创建原始超表
CREATE TABLE metrics (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    cpu         DOUBLE PRECISION,
    memory      DOUBLE PRECISION
);

SELECT create_hypertable('metrics', 'time');

-- 创建连续聚合（每分钟聚合一次）
CREATE MATERIALIZED VIEW metrics_minute
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', time) AS bucket,
       device_id,
       AVG(cpu) AS avg_cpu,
       AVG(memory) AS avg_memory,
       MAX(cpu) AS max_cpu,
       MIN(cpu) AS min_cpu
FROM metrics
GROUP BY time_bucket('1 minute', time), device_id;

-- 创建策略：自动刷新
-- 每分钟刷新一次过去 5 分钟的数据
SELECT add_continuous_aggregate_policy('metrics_minute',
    start_offset => INTERVAL '20 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

-- 查询聚合数据（非常快）
SELECT * FROM metrics_minute
WHERE bucket >= '2024-01-01 00:00:00'
  AND bucket < '2024-01-02 00:00:00'
  AND device_id = 'server_001';

-- 物化视图 vs 连续聚合：
-- 物化视图：需要手动刷新
-- 连续聚合：自动按策略刷新，后台维护
```

### 3.4 TimescaleDB 的压缩

```sql
-- TimescaleDB 支持压缩，大幅减少存储空间

-- 启用压缩
ALTER TABLE metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id'
);

-- 创建压缩策略（自动压缩 7 天前的数据）
SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- 压缩效果示例：
-- 原始数据：1 亿条，100GB
-- 压缩后：约 10GB（压缩比约 10:1）

-- 压缩原理：
-- 1. 按时间块压缩
-- 2. 使用列式存储（列存）进行压缩
-- 3. 保持索引但减少空间

-- 查看压缩信息
SELECT show_chunks('metrics', older_than => INTERVAL '7 days');
```

## 四、ClickHouse：OLAP 数据库的瑞士军刀

### 4.1 ClickHouse 是什么？

```sql
-- ClickHouse 是 Yandex（俄罗斯搜索引擎）开源的列式数据库
-- 专为 OLAP（在线分析处理）场景设计

-- ClickHouse 的特点：

-- 1. 列式存储
--    同一列的数据连续存储
--    查询时只读取需要的列

-- 2. 向量化执行
--    CPU SIMD 指令一次处理多个值
--    比逐行处理快 10-100 倍

-- 3. 分布式架构
--    支持水平扩展，多节点并行查询

-- 4. 丰富的数据类型
--    Array、Tuple、JSON、UUID、IP 等

-- ClickHouse 性能基准：
-- 100 亿条数据聚合查询 < 1 秒
-- 单机每秒写入 100 万行
-- 压缩比 10:1（比原始数据小 10 倍）
```

### 4.2 ClickHouse 表引擎

```sql
-- ClickHouse 表引擎决定数据的存储和查询方式

-- 常用表引擎：

-- 1. MergeTree 系列（最常用）
--    适用于大多数场景

CREATE TABLE t_order (
    order_id     UInt64,
    order_no     String,
    user_id      UInt64,
    total_amount Decimal(10,2),
    created_at   DateTime
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)      -- 按月分区
ORDER BY (user_id, created_at)         -- 主键排序
SETTINGS index_granularity = 8192;     -- 索引粒度

-- 2. ReplacingMergeTree
--    用于去重（保留最新或最早的一条）

CREATE TABLE t_user_action (
    user_id    UInt64,
    action     String,
    timestamp  DateTime,
    version    UInt32
)
ENGINE = ReplacingMergeTree(version)
ORDER BY (user_id, action, timestamp);

-- 3. SummingMergeTree
--    用于自动聚合（同类数据求和）

CREATE TABLE t_metrics (
    device_id  String,
    metric     String,
    value      Float64,
    timestamp  DateTime
)
ENGINE = SummingMergeTree()
ORDER BY (device_id, metric, timestamp);

-- 4. CollapsingMergeTree
--    用于需要删除的场景（用 sign 标记增删）

CREATE TABLE t_sessions (
    user_id    UInt64,
    session_id String,
    duration   UInt64,
    sign       Int8    -- +1 表示开始，-1 表示结束
)
ENGINE = CollapsingMergeTree(sign)
ORDER BY (user_id, session_id);
```

### 4.3 ClickHouse 的 MergeTree 结构

```sql
-- ClickHouse MergeTree 表结构解析

CREATE TABLE t_analytics (
    event_date   Date,
    event_time   DateTime,
    user_id      UInt64,
    event_type   String,
    page_url     String,
    device_type  Enum8('mobile' = 1, 'desktop' = 2, 'tablet' = 3),
    country_code FixedString(2),
    revenue      Decimal(10,2)
)
ENGINE = MergeTree()
-- 1. 分区键：数据按月分区存储
PARTITION BY toYYYYMM(event_date)

-- 2. 主键：用于稀疏索引（不是唯一约束）
--    稀疏索引：每 8192 行建一个索引项
ORDER BY (user_id, event_time, event_type)

-- 3. 采样键（可选）：用于数据采样
--    SAMPLE BY user_id

-- 4. 索引粒度：每 8192 行数据创建一个索引条目
SETTINGS index_granularity = 8192;

-- MergeTree 的数据组织：
-- Table
--   └── Partition: toYYYYMM(event_date)
--         └── Part（数据文件）
--               ├── PRIMARY.idx（稀疏索引文件）
--               ├── [Column].bin（列数据文件）
--               ├── [Column].mrk（列标记文件）
--               └── ...

-- 查询流程：
-- 1. 根据 WHERE 条件确定分区
-- 2. 根据主键索引定位到数据块
-- 3. 只读取需要的数据块和列
```

### 4.4 ClickHouse 的物化视图

```sql
-- ClickHouse 物化视图：预计算查询结果并存储

-- 场景：实时统计 DAU（日活跃用户）

-- 1. 创建原始事件表
CREATE TABLE t_events (
    event_time DateTime,
    user_id    UInt64,
    event_type String
)
ENGINE = MergeTree()
ORDER BY (event_type, event_time);

-- 2. 创建物化视图（自动聚合每天的用户）
CREATE MATERIALIZED VIEW mv_daily_users
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (day, event_type)
AS
SELECT
    toDate(event_time) AS day,
    event_type,
    countState() AS user_cnt  -- 状态函数，用于去重
FROM t_events
GROUP BY day, event_type;

-- 3. 写入数据（物化视图自动更新）
INSERT INTO t_events VALUES
    ('2024-01-01 10:00:00', 1001, 'click'),
    ('2024-01-01 10:01:00', 1002, 'click'),
    ('2024-01-01 10:02:00', 1001, 'scroll');  -- user 1001 重复

-- 4. 查询聚合结果
SELECT
    day,
    event_type,
    countMerge(user_cnt) AS dau
FROM mv_daily_users
WHERE day >= '2024-01-01' AND day < '2024-01-31'
GROUP BY day, event_type;

-- 物化视图 vs 普通视图：
-- 普通视图：每次查询时执行 SQL，性能差
-- 物化视图：预先计算并存储结果，查询快但占用空间
```

### 4.5 ClickHouse SQL 示例

```sql
-- ClickHouse SQL 与标准 SQL 略有不同

-- 1. 时间函数
SELECT
    toDate(created_at) AS day,
    toHour(created_at) AS hour,
    toStartOfWeek(created_at) AS week_start,
    toStartOfMonth(created_at) AS month_start,
    dateDiff('day', created_at, now()) AS days_ago
FROM orders;

-- 2. 聚合函数
SELECT
    user_id,
    COUNT(*) AS order_count,           -- 计数
    SUM(total_amount) AS total_spend,  -- 求和
    AVG(total_amount) AS avg_amount,   -- 平均
    MAX(total_amount) AS max_amount,   -- 最大
    MIN(total_amount) AS min_amount,   -- 最小
    countDistinct(user_id) AS unique_users  -- 去重计数
FROM orders
GROUP BY user_id;

-- 3. 窗口函数（ClickHouse 支持）
SELECT
    user_id,
    order_time,
    total_amount,
    SUM(total_amount) OVER (           -- 累计金额
        PARTITION BY user_id
        ORDER BY order_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    ROW_NUMBER() OVER (                 -- 行号
        PARTITION BY user_id
        ORDER BY order_time
    ) AS order_seq
FROM orders;

-- 4. 数组函数
SELECT
    user_id,
    groupArray(product_id) AS products,  -- 收集为数组
    arraySort(arrayDistinct(products)) AS unique_products,
    arrayFilter(x -> x > 100, products) AS expensive_products
FROM orders
GROUP BY user_id;

-- 5. 条件聚合
SELECT
    countIf(event_type = 'purchase') AS purchase_count,
    countIf(event_type = 'cart') AS cart_count,
    sumIf(revenue, event_type = 'purchase') AS total_revenue
FROM events
WHERE event_date = today();
```

## 五、StarRocks：新一代 OLAP 引擎

### 5.1 StarRocks 简介

```sql
-- StarRocks 是阿里巴巴开源的MPP分析型数据库
-- 主要用于替换 ClickHouse、Druid、Presto 等

-- StarRocks 的优势：

-- 1. 全面向量化执行
--    CPU 指令一次处理多个值
--    比行式处理快 5-10 倍

-- 2. 新一代 Materialized View
--    自动路由到最优的物化视图
--    查询完全透明，不需要手动选择

-- 3. 高并发点查
--    支持高并发精确点查（每秒10万QPS）
--    通过主键直接定位数据

-- 4. 统一 ETL 和 OLAP
--    支持实时数据导入和预计算
--    一站式完成数据分析和 ETL
```

### 5.2 StarRocks 表设计

```sql
-- StarRocks 支持三种表类型：

-- 1. Duplicate 表（明细表）
--    保留完整明细数据

CREATE TABLE order_detail (
    order_id     BIGINT NOT NULL,
    order_no     VARCHAR(64) NOT NULL,
    user_id      BIGINT NOT NULL,
    product_id   BIGINT NOT NULL,
    quantity     INT,
    price        DECIMAL(10,2),
    created_at   DATETIME
)
DUPLICATE KEY (order_id, order_no)  -- 主键，决定数据分布
DISTRIBUTED BY HASH(order_id) BUCKETS 8  -- 分桶
PROPERTIES (
    "replication_num" = "3"  -- 副本数
);

-- 2. Aggregate 表（聚合表）
--    自动聚合相同 key 的数据

CREATE TABLE metrics_agg (
    dt          DATE,
    device_id   VARCHAR(20),
    cpu         DOUBLE DEFAULT '0',
    memory      DOUBLE DEFAULT '0',
    requests    BIGINT DEFAULT '0'
)
AGGREGATE KEY (dt, device_id)
DISTRIBUTED BY HASH(device_id) BUCKETS 8;

-- 导入数据时自动聚合
-- 相同 (dt, device_id) 的数据会合并
INSERT INTO metrics_agg VALUES
    ('2024-01-01', 'server_1', 75.5, 60.2, 1000),
    ('2024-01-01', 'server_1', 80.0, 65.0, 1500);  -- 自动聚合

-- 结果：cpu=155.5, memory=125.2, requests=2500

-- 3. Unique 表（主键表）
--    保证主键唯一，后写入覆盖先写入

CREATE TABLE user_status (
    user_id     BIGINT PRIMARY KEY,
    last_login  DATETIME,
    status      INT
)
UNIQUE KEY (user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8;

-- 写入时自动更新（Presto 类似 upsert）
INSERT INTO user_status VALUES
    (1, '2024-01-01 10:00:00', 1),
    (1, '2024-01-01 12:00:00', 2);  -- user_id=1 的记录被更新
```

### 5.3 StarRocks 物化视图

```sql
-- StarRocks 的异步物化视图是最强大的特性之一

-- 场景：订单数据需要多维度分析

-- 1. 创建基础表
CREATE TABLE orders (
    order_id     BIGINT,
    order_no     VARCHAR(64),
    user_id      BIGINT,
    merchant_id  BIGINT,
    category     VARCHAR(50),
    brand        VARCHAR(50),
    amount       DECIMAL(10,2),
    status       INT,
    created_at   DATETIME
)
DUPLICATE KEY (order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8;

-- 2. 创建异步物化视图（按用户维度）
CREATE MATERIALIZED VIEW mv_orders_by_user
AS
SELECT
    user_id,
    DATE_TRUNC('day', created_at) AS day,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- 3. 创建异步物化视图（按商家维度）
CREATE MATERIALIZED VIEW mv_orders_by_merchant
AS
SELECT
    merchant_id,
    category,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY merchant_id, category, DATE_TRUNC('month', created_at);

-- 4. 查询时自动选择最优物化视图
-- 查询用户维度的订单统计
SELECT user_id, day, order_count, total_amount
FROM mv_orders_by_user
WHERE user_id = 123;

-- StarRocks 自动选择 mv_orders_by_user 物化视图

-- 查询商家维度的订单统计
SELECT merchant_id, category, month, order_count, total_amount
FROM mv_orders_by_merchant
WHERE merchant_id = 456;

-- StarRocks 自动选择 mv_orders_by_merchant 物化视图
```

## 六、实战案例：监控数据存储方案

### 6.1 需求分析

```
场景：服务器监控系统

数据量估算：
- 1000 台服务器
- 每台服务器采集 50 个指标
- 每 10 秒采集一次
- 保留 30 天

计算：
- 采集频率：1000 × 50 × 0.1 = 5000 数据点/秒
- 每天数据量：5000 × 86400 = 4.32 亿数据点/天
- 30 天数据量：4.32 亿 × 30 = 129.6 亿数据点

存储需求：
- 每数据点约 50 字节（时间戳 + 指标名 + 值 + 标签）
- 压缩后约 5 字节
- 总存储：129.6 亿 × 5 字节 = 648 GB
```

### 6.2 方案选型

```
方案对比：

1. MySQL + 分库分表
   优点：团队熟悉，维护成本低
   缺点：写入性能差，聚合查询慢，存储成本高
   不推荐

2. InfluxDB
   优点：专为时序数据优化，压缩比高
   缺点：集群版本收费，生态不如 ClickHouse
   推荐度：★★★★☆

3. TimescaleDB
   优点：基于 PostgreSQL，SQL 兼容性好
   缺点：单节点性能不如 ClickHouse
   推荐度：★★★★☆

4. ClickHouse
   优点：OLAP 性能极佳，压缩比高（15:1+）
   缺点：UPDATE/DELETE 效率低，不适合实时写入
   推荐度：★★★★★

5. StarRocks
   优点：支持实时更新，物化视图强大
   缺点：相对较新，生态还在发展中
   推荐度：★★★★☆

最终选择：ClickHouse（单机版起步，后续可集群）
```

### 6.3 ClickHouse 表设计

```sql
-- ClickHouse 监控数据表设计

-- 1. 创建指标原始表
CREATE TABLE metrics (
    timestamp   DateTime,
    device_id   String,
    region      String,
    zone        String,
    metric_name String,
    value       Float64
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (device_id, metric_name, timestamp)
SETTINGS index_granularity = 8192;

-- 2. 创建预聚合表（每分钟聚合）
CREATE TABLE metrics_minute (
    timestamp   DateTime,
    device_id   String,
    region      String,
    zone        String,
    metric_name String,
    value_avg   Float64,
    value_max   Float64,
    value_min   Float64,
    value_sum   Float64,
    count       UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (device_id, metric_name, timestamp)
SETTINGS index_granularity = 8192;

-- 3. 创建物化视图（自动聚合到分钟）
CREATE MATERIALIZED VIEW metrics_minute_mv
TO metrics_minute
AS
SELECT
    toStartOfMinute(timestamp) AS timestamp,
    device_id,
    region,
    zone,
    metric_name,
    AVG(value) AS value_avg,
    MAX(value) AS value_max,
    MIN(value) AS value_min,
    SUM(value) AS value_sum,
    COUNT(*) AS count
FROM metrics
GROUP BY
    toStartOfMinute(timestamp),
    device_id,
    region,
    zone,
    metric_name;

-- 4. 模拟写入数据
INSERT INTO metrics VALUES
    ('2024-01-01 10:00:00', 'server_001', 'beijing', 'zone_a', 'cpu_usage', 75.5),
    ('2024-01-01 10:00:00', 'server_001', 'beijing', 'zone_a', 'memory_usage', 60.2),
    ('2024-01-01 10:00:00', 'server_002', 'shanghai', 'zone_b', 'cpu_usage', 80.0);

-- 5. 查询最近 1 小时的 CPU 使用率
SELECT
    device_id,
    toStartOfInterval(timestamp, INTERVAL 5 minute) AS t,
    AVG(value_avg) AS avg_cpu,
    MAX(value_max) AS max_cpu
FROM metrics_minute
WHERE metric_name = 'cpu_usage'
  AND timestamp >= now() - INTERVAL 1 hour
GROUP BY device_id, t
ORDER BY device_id, t;

-- 6. 查询各 region 的 CPU 平均使用率
SELECT
    region,
    AVG(value_avg) AS avg_cpu
FROM metrics_minute
WHERE metric_name = 'cpu_usage'
  AND timestamp >= today()
GROUP BY region;
```

### 6.4 数据保留策略

```sql
-- ClickHouse 数据保留策略

-- 1. 分区裁剪（自动清理旧分区）
-- 只保留最近 30 天的原始数据

ALTER TABLE metrics DELETE
WHERE timestamp < now() - INTERVAL 30 day;

-- 2. 使用 TTL（数据生命周期）
-- 表级别 TTL
ALTER TABLE metrics MODIFY TTL timestamp + INTERVAL 30 day;

-- 列级别 TTL
ALTER TABLE metrics MODIFY COLUMN value Float TTL timestamp + INTERVAL 7 day;

-- 3. 物化视图数据保留
-- 分钟表保留 7 天
ALTER TABLE metrics_minute DELETE
WHERE timestamp < now() - INTERVAL 7 day;

-- 小时表保留 90 天
CREATE TABLE metrics_hour (...) ENGINE = SummingMergeTree();

CREATE MATERIALIZED VIEW metrics_hour_mv
TO metrics_hour
AS
SELECT
    toStartOfHour(timestamp) AS timestamp,
    device_id,
    region,
    zone,
    metric_name,
    AVG(value_avg) AS value_avg,
    MAX(value_max) AS value_max,
    MIN(value_min) AS value_min,
    SUM(value_sum) AS value_sum,
    SUM(count) AS count
FROM metrics_minute
GROUP BY
    toStartOfHour(timestamp),
    device_id,
    region,
    zone,
    metric_name;

-- 4. 查看分区信息
SELECT
    partition,
    table,
    rows,
    bytes_on_disk,
    database
FROM system.parts
WHERE table LIKE 'metrics%'
ORDER BY partition DESC;

-- 5. 手动合并和清理
OPTIMIZE TABLE metrics FINAL;  -- 合并小分区
```

## 七、时序数据库选型指南

```
选型决策树：

┌─────────────────────────────────────────────────────────────┐
│                    场景特征判断                              │
├─────────────────────────────────────────────────────────────┤
│ 数据量级 < 1000 万/天？                                      │
│   ↓ 是                                                         │
│ MySQL + 优化即可                                              │
├─────────────────────────────────────────────────────────────┤
│ 数据量级 1000 万 ~ 10 亿/天？                                 │
│   ↓ 是                                                         │
│ 需要实时写入 + 实时查询？                                      │
│   ↓ 是                                                         │
│ InfluxDB / TimescaleDB                                        │
├─────────────────────────────────────────────────────────────┤
│ 数据量级 > 10 亿/天？                                         │
│   ↓ 是                                                         │
│ 主要用于分析聚合？                                            │
│   ↓ 是                                                         │
│ ClickHouse / StarRocks                                        │
├─────────────────────────────────────────────────────────────┤
│ 需要实时更新？                                                │
│   ↓ 是                                                         │
│ StarRocks（支持实时更新）                                     │
│   ↓ 否                                                         │
│ ClickHouse（大批量写入为主）                                  │
└─────────────────────────────────────────────────────────────┘

存储成本对比（估算）：

假设：10 亿数据点/天，保留 30 天，压缩后每数据点 5 字节

InfluxDB：  300 GB（高压缩）
ClickHouse：150 GB（列式压缩）
TimescaleDB：200 GB（列式压缩 + 分区）
StarRocks：  180 GB（列式压缩）

查询性能对比（100 亿数据聚合）：

ClickHouse：< 1 秒（分布式查询）
StarRocks：  < 1 秒（向量化执行）
InfluxDB：   1-5 秒（取决于查询复杂度）
TimescaleDB：5-10 秒（单节点限制）
```

> **总结：** 时序数据库和 OLAP 数据库的出现，是为了解决 MySQL 在特定场景下的不足。选择哪种数据库，要根据数据量、查询模式、实时性要求、团队技术栈等因素综合考虑。对于大多数中小型项目，TimescaleDB 是很好的选择，因为它基于熟悉的 PostgreSQL，学习成本低。对于大规模数据分析，ClickHouse 和 StarRocks 是更好的选择，性能强大但运维复杂度也相对较高。
