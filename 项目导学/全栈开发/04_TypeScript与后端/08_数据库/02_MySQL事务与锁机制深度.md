# MySQL 事务与锁机制深度解析

> 前言：想象你正在网购下单，流程是：扣减库存 → 创建订单 → 扣减余额。这三个操作必须全部成功才算完成，如果库存扣了但订单创建失败了，你的钱会不会丢？如果库存扣了两次怎么办？这就是事务要解决的问题——保证一组操作要么全部成功，要么全部失败，绝不让你的数据处于"半吊子"状态。

## 一、事务基础：ACID 四个字的奥秘

### 1.1 什么是事务？

**事务（Transaction）**：数据库事务是逻辑上的一组操作，这组操作要么全部执行成功，要么全部不执行。

```
转账场景：
A 账户转给 B 账户 100 元

操作分解：
1. 从 A 账户扣减 100 元
2. 向 B 账户增加 100 元

❌ 没有事务：A 扣了 100，但系统崩了，B 没收到
✅ 有事务：要么 A 扣 100 + B 加 100 都完成，要么都不做
```

### 1.2 ACID 四大特性

```
ACID = 事务的四个保护神

A - Atomicity（原子性）：
├── 事务是最小执行单位，不可再分
├── 要么全部成功，要么全部失败
└── 回滚机制保证原子性

C - Consistency（一致性）：
├── 事务执行前后，数据保持一致
├── 比如转账前后，双方总金额不变
└── 由应用层保证逻辑正确性

I - Isolation（隔离性）：
├── 并发执行的事务相互隔离
├── 每个事务感觉不到其他事务的存在
└── 由锁机制和 MVCC 实现

D - Durability（持久性）：
├── 事务提交后，数据永久保存
├── 即使系统崩溃也不会丢失
└── 由 Redo Log 保证
```

**通俗解释：**

```
A（原子性）  → 事务就像原子一样，不可拆分。要么全做，要么全不做。
C（一致性）  → 事务前后，数据都是"合理"的状态，不会出现"负余额"这种事。
I（隔离性）  → 多个事务并发执行时，就像在独立执行，不会互相干扰。
D（持久性）  → 事务一旦提交，就算天塌了，数据也不会丢失。
```

### 1.3 事务的开启和提交

```sql
-- 显式开启事务
START TRANSACTION;  -- 或者 BEGIN;

-- 或者
BEGIN;

-- 执行一系列操作
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;

-- 提交事务
COMMIT;

-- 如果出错，回滚事务
ROLLBACK;

-- 设置保存点（事务内的回滚点）
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
SAVEPOINT sp1;  -- 创建保存点
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;
ROLLBACK TO sp1;  -- 回滚到保存点，只保留第一个 UPDATE
COMMIT;
```

### 1.4 自动提交模式

```sql
-- MySQL 默认自动提交（每条语句自动成为一个事务）
SET AUTOCOMMIT = 1;  -- 默认开启

-- 关闭自动提交（需要手动 COMMIT 或 ROLLBACK）
SET AUTOCOMMIT = 0;

-- 查看当前自动提交状态
SHOW VARIABLES LIKE 'autocommit';

-- 实用技巧：在需要事务的操作前关闭自动提交
SET AUTOCOMMIT = 0;
START TRANSACTION;
-- 执行一系列操作
COMMIT;
SET AUTOCOMMIT = 1;  -- 恢复默认
```

## 二、MySQL 的隔离级别：多事务并发控制

### 2.1 为什么需要隔离级别？

```
并发问题场景：

时间点：T1                      T2
       │                        │
       ▼                        ▼
  事务A：读取商品库存=10          │
                              事务B：读取商品库存=10
       ▼                        │
  事务A：库存-1，库存=9           │
       │                        ▼
       │                   事务B：库存-1，库存=9
       │                        │
       ▼                        ▼
  事务A：提交，库存=9         事务B：提交，库存=9

结果：商品被购买了2次，但只扣了1次库存！
这就是经典的"并发问题"——丢失更新
```

### 2.2 四种隔离级别

```
隔离级别从低到高：

READ UNCOMMITTED（读未提交）：
├── 最低级别，存在脏读
├── 事务可以看到其他事务未提交的数据
└── 性能最高，安全性最差

READ COMMITTED（读已提交）：
├── 只能看到其他事务已提交的数据
├── 解决了脏读问题
├── 但存在不可重复读（同一事务两次读取结果不同）
└── 大多数数据库的默认级别（Oracle、SQL Server）

REPEATABLE READ（可重复读）：
├── MySQL InnoDB 的默认级别
├── 保证同一事务中多次读取同一数据结果相同
├── 解决了不可重复读
├── 但存在幻读（同一事务两次查询，结果数量不同）
└── 通过 MVCC + Next-Key Lock 解决幻读

SERIALIZABLE（串行化）：
├── 最高级别，完全串行执行
├── 彻底解决所有并发问题
└── 性能最差，几乎不用
```

### 2.3 并发问题详解

```sql
-- 创建测试表
CREATE TABLE accounts (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  balance DECIMAL(10,2)
);

INSERT INTO accounts VALUES (1, '张三', 1000.00);

-- 脏读（Dirty Read）：读取到其他事务未提交的数据
-- 设置隔离级别为 READ UNCOMMITTED
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

START TRANSACTION;
-- 事务A：读取张三的余额
SELECT balance FROM accounts WHERE id = 1;  -- 结果：1000.00
                                             -- 此时事务B还没提交
-- 事务B（在另一个会话）：
-- START TRANSACTION;
-- UPDATE accounts SET balance = 500 WHERE id = 1;
-- （事务B还没提交）

-- 如果能读到事务B未提交的数据，就是脏读

-- 不可重复读（Non-Repeatable Read）：同一事务两次读取结果不同
-- 设置隔离级别为 READ COMMITTED
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

START TRANSACTION;
-- 第一次读取
SELECT balance FROM accounts WHERE id = 1;  -- 1000.00

-- 事务B提交了：UPDATE accounts SET balance = 500 WHERE id = 1;

-- 第二次读取（同一事务内）
SELECT balance FROM accounts WHERE id = 1;  -- 500.00！和第一次不同
-- 这就是不可重复读：同一个事务中两次读取同一行，结果不同

-- 幻读（Phantom Read）：同一事务两次查询，结果数量不同
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

START TRANSACTION;
-- 第一次查询：有多少笔订单
SELECT COUNT(*) FROM orders WHERE user_id = 1;  -- 10 条

-- 事务B插入了一条新订单
-- INSERT INTO orders VALUES (11, 1, '新订单');

-- 第二次查询：有多少笔订单
SELECT COUNT(*) FROM orders WHERE user_id = 1;  -- 11 条！数量变了
-- 这就是幻读：同一事务中两次查询，结果集大小不同
```

### 2.4 MySQL 的隔离级别设置

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 设置全局隔离级别（影响所有新连接）
SET GLOBAL transaction_isolation = 'REPEATABLE-READ';

-- 设置会话隔离级别（只影响当前会话）
SET SESSION transaction_isolation = 'READ-COMMITTED';

-- 开启事务时指定隔离级别
START TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 不同隔离级别的演示
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT * FROM accounts;
-- 在另一个会话修改数据并提交
SELECT * FROM accounts;  -- 结果和第一次相同（可重复读）
COMMIT;
```

## 三、MVCC：多版本并发控制的秘密

### 3.1 什么是 MVCC？

**MVCC（Multi-Version Concurrency Control，多版本并发控制）**：一种并发控制机制，通过保存数据的多个版本来实现读写并发，让读操作不阻塞写操作，写操作不阻塞读操作。

```
MVCC 核心思想：

传统锁机制（读操作）：
├── 读数据时加锁，其他事务无法修改
└── 问题：并发能力差

MVCC（读操作）：
├── 读数据时读取"快照"版本
├── 写操作创建新版本，不影响读操作
└── 优点：读写不冲突，并发能力强

类比：
├── 传统锁：图书馆只有一个副本，想借必须排队
└── MVCC：图书馆有多个副本，大家可以同时借阅
```

### 3.2 InnoDB 的 MVCC 实现

**InnoDB 为每一行数据添加了两个隐藏字段：**

```sql
-- InnoDB 表的行结构（隐藏字段）
|-- DB_TRX_ID --|-- DB_ROLL_PTR --|-- 其他数据列 --|
   事务ID           回滚指针          用户数据

DB_TRX_ID（事务ID）：
├── 最近修改该行的事务ID
├── 事务ID是自增的全局计数器
└── 用于判断该行对当前事务是否可见

DB_ROLL_PTR（回滚指针）：
├── 指向该行前一个版本的指针
├── 形成版本链表（undo log）
└── 用于读取历史版本数据
```

**Read View（读视图）机制：**

```sql
-- Read View 是事务在快照读时创建的一个"视图"
-- 用于判断当前事务能看到哪些版本的数据

Read View 结构：
┌─────────────────────────────────────────────────┐
│ m_ids      → 活跃事务ID列表（未提交的事务）        │
│ min_trx_id → 活跃事务中的最小ID                   │
│ max_trx_id → 创建ReadView时最大事务ID+1          │
│ creator_trx_id → 创建该ReadView的事务ID          │
└─────────────────────────────────────────────────┘

可见性判断规则：
1. 如果数据行的 trx_id < min_trx_id → 可见（已提交）
2. 如果数据行的 trx_id = creator_trx_id → 可见（自己修改的）
3. 如果数据行的 trx_id ∈ m_ids → 不可见（未提交事务修改的）
4. 否则 → 可见（已提交事务修改的）
```

### 3.3 MVCC 工作流程图解

```
假设时间线上发生了这些事：

T1: 事务A（ID=10）创建ReadView，开始快照读
T2: 事务B（ID=11）修改了某行数据 balance=500（未提交）
T3: 事务C（ID=12）修改了同一行数据 balance=600（未提交）
T4: 事务D（ID=13）修改了同一行数据 balance=700（已提交）
T5: 事务A（ID=10）再次读取该行数据

事务A的ReadView：
- m_ids = [11, 12]（B和C未提交）
- min_trx_id = 11
- max_trx_id = 14

判断过程：
1. 查看数据行，当前版本 trx_id = 13
2. 13 < 11（min_trx_id）？否
3. 13 = 10（creator_trx_id）？否
4. 13 ∈ [11, 12]？否（13不在活跃事务列表中）
5. 因此 trx_id=13 的数据可见

事务A读到的数据：balance=700（事务D提交的版本）
```

### 3.4 快照读 vs 当前读

```sql
-- 快照读（Snapshot Read）：读取历史版本，不加锁
-- MVCC 主要影响这类读操作
SELECT * FROM accounts WHERE id = 1;  -- 普通 SELECT

-- 当前读（Current Read）：读取最新版本，加锁
-- 读取时确保没有其他事务在修改
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- 加行锁
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;  -- 共享锁

-- 插入、更新、删除操作也是当前读
INSERT INTO accounts VALUES(...);  -- 加排他锁
UPDATE accounts SET balance = 500 WHERE id = 1;  -- 加排他锁
DELETE FROM accounts WHERE id = 1;  -- 加排他锁

-- 为什么要区分？
-- 快照读可能被其他事务修改，导致幻读问题
-- 当前读通过加锁保证读取的是最新数据
```

### 3.5 MVCC 与隔离级别的关系

```
MySQL InnoDB 的 MVCC 实现：

READ COMMITTED：
├── 每次读取都生成新的 ReadView
├── 能读到其他事务已提交的数据
└── 不可重复读问题存在

REPEATABLE READ（MySQL 默认）：
├── 第一次读取生成 ReadView，之后复用
├── 整个事务期间看到的都是同一快照
├── 通过 Next-Key Lock 解决幻读
└── MySQL 特有的实现

READ UNCOMMITTED：
├── 不使用 MVCC，直接读取最新数据
└── 存在脏读

SERIALIZABLE：
├── MVCC 被禁用
├── 快照读也会加锁
└── 完全串行化执行
```

## 四、锁机制：InnoDB 的锁家族

### 4.1 锁的分类概览

```
MySQL InnoDB 锁的家族：

┌─────────────────────────────────────────────────────────┐
│                        锁类型                            │
├────────────────────────┬────────────────────────────────┤
│      按锁粒度分         │           按锁属性分            │
├────────────────────────┼────────────────────────────────┤
│ 表锁                   │ 共享锁（S锁）                   │
│ 行锁                   │ 排他锁（X锁）                   │
│ 记录锁                 │                                │
│ 间隙锁                 │                                │
│ Next-Key 锁            │                                │
│ 意向锁                 │                                │
└────────────────────────┴────────────────────────────────┘
```

### 4.2 共享锁与排他锁

```sql
-- 共享锁（S锁，Shared Lock）：
-- 允许事务读取数据，多个事务可以同时持有同一数据的共享锁
-- 类比：图书馆的书可以多人同时阅读

-- 排他锁（X锁，Exclusive Lock）：
-- 允许事务修改数据，只能有一个事务持有，且不能与其他锁共存
-- 类比：图书馆的书被人借走修改时，别人不能借也不能读

-- 加共享锁
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;

-- 加排他锁
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- INSERT/UPDATE/DELETE 默认加排他锁
UPDATE accounts SET balance = 500 WHERE id = 1;  -- 排他锁

-- 锁的兼容性矩阵：
┌──────────┬────────┬────────┐
│          │   S锁   │   X锁   │
├──────────┼────────┼────────┤
│   S锁    │  兼容   │ 不兼容  │
│   X锁    │ 不兼容  │ 不兼容  │
└──────────┴────────┴────────┘
```

### 4.3 行锁、记录锁、间隙锁

```sql
-- 行锁（Record Lock）：锁住某一行数据
-- 当使用主键或唯一索引精确查询时，InnoDB 锁定单行
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- 只锁定 id=1 这一行

-- 间隙锁（Gap Lock）：锁定一个范围内的间隙
-- 当使用范围查询时，InnoDB 锁定查询范围内的间隙
SELECT * FROM accounts WHERE id > 10 AND id < 20 FOR UPDATE;
-- 锁定 (10, 20) 这个间隙，新插入 id=15 的操作会被阻塞

-- Next-Key Lock：行锁 + 间隙锁的组合
-- 当使用范围查询时，InnoDB 锁定"索引记录 + 间隙"
SELECT * FROM accounts WHERE id >= 10 AND id <= 20 FOR UPDATE;
-- 锁定 [10, 20] 这个范围，包括 10 和 20 这两行，以及它们之间的间隙

-- 间隙锁的场景：
-- 事务A：
START TRANSACTION;
SELECT * FROM accounts WHERE id > 10 AND id < 20 FOR UPDATE;
-- 锁定间隙 (10, 20)，阻止其他事务插入 id=15 的记录

-- 事务B：
START TRANSACTION;
INSERT INTO accounts VALUES (15, '李四', 500);  -- 被阻塞！
-- 因为 id=15 落在间隙 (10, 20) 内

-- 间隙锁的意义：
-- 防止幻读——确保在事务A执行期间，不会有新记录插入到 id > 10 AND id < 20 的范围内
```

### 4.4 意向锁：表锁和行锁的桥梁

```sql
-- 为什么要意图锁？
-- 因为 InnoDB 是行锁，当你想加表锁时，需要知道表里哪些行被锁了
-- 意向锁就是用来"告诉"表锁"哪些行被锁了"的机制

-- 意向共享锁（IS锁）：
-- 事务打算给某行加共享锁
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;
-- 系统会在表级别加 IS 锁

-- 意向排他锁（IX锁）：
-- 事务打算给某行加排他锁
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- 系统会在表级别加 IX 锁

-- 意向锁的兼容性：
┌──────────┬────────┬────────┬────────┬────────┐
│          │   S锁   │   X锁   │  IS锁  │  IX锁  │
├──────────┼────────┼────────┼────────┼────────┤
│   S锁    │  兼容   │ 不兼容  │  兼容  │ 不兼容 │
│   X锁    │ 不兼容  │ 不兼容  │ 不兼容 │ 不兼容 │
│   IS锁   │  兼容   │ 不兼容  │  兼容  │  兼容  │
│   IX锁   │ 不兼容  │ 不兼容  │  兼容  │  兼容  │
└──────────┴────────┴────────┴────────┴────────┘

-- 意向锁的意义：
-- 当事务A锁定了表的一行时（IX锁），事务B想锁整个表（LOCK TABLE）
-- 事务B检查到表已经有IX锁，知道某些行被锁定，不会傻等
```

### 4.5 自增锁：解决 auto_increment 的并发问题

```sql
-- 自增锁是表锁的一种特殊形式
-- 用于保证自增列的唯一性和顺序性

-- 场景：多个事务同时插入数据
-- 事务A：插入用户，返回 id=1
-- 事务B：插入用户，返回 id=2
-- 事务C：插入用户，返回 id=3

-- 自增锁的三种模式：
-- innodb_autoinc_lock_mode = 0（传统锁）：
-- 插入语句执行期间持有自增锁，保证顺序性

-- innodb_autoinc_lock_mode = 1（默认）：
-- 批量插入（INSERT ... SELECT）仍用自增锁
-- 简单插入（单行）提前释放锁，并发性能更好

-- innodb_autoinc_lock_mode = 2：
-- 完全不用自增锁，并发最高，但可能导致 id 不连续
-- 适用于主从复制场景（基于语句的复制）

-- 查看当前自增锁模式
SHOW VARIABLES LIKE 'innodb_autoinc_lock_mode';
```

## 五、MySQL 的死锁与预防

### 5.1 什么是死锁？

```
死锁的本质：两个或多个事务相互等待对方释放锁

经典死锁场景：

事务A：                    事务B：
START TRANSACTION;        START TRANSACTION;
UPDATE t1 SET x=1 WHERE id=1;  -- 锁定 t1.id=1
                         UPDATE t2 SET x=1 WHERE id=1;  -- 锁定 t2.id=1
UPDATE t2 SET x=1 WHERE id=1;  -- 等待 t2.id=1（事务B持有）
                         UPDATE t1 SET x=1 WHERE id=1;  -- 等待 t1.id=1（事务A持有）

结果：死锁！事务A持有t1等待t2，事务B持有t2等待t1，形成循环等待
```

### 5.2 InnoDB 的死锁检测

```sql
-- InnoDB 有自动死锁检测机制
-- 检测到死锁后，会选择一个"受害者"事务回滚

-- InnoDB 死锁检测算法：
-- 1. 构建 wait-for graph（等待图）
-- 2. 检测图中是否存在环
-- 3. 发现环即表示存在死锁

-- 死锁处理策略：
-- 1. 选择 undo log 最小的事务作为受害者（回滚代价最小）
-- 2. 回滚该事务，释放锁
-- 3. 其他事务继续执行

-- 查看死锁日志
SHOW ENGINE INNODB STATUS;

-- LATEST DETECTED DEADLOCK 部分会显示最近的死锁信息
-- 包括：两个事务的等待关系、涉及的表和行、回滚的事务
```

### 5.3 死锁案例分析

```sql
-- 创建测试表
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),
  stock INT DEFAULT 0,
  INDEX idx_name (name)
);

INSERT INTO products VALUES (1, '手机', 100), (2, '电脑', 50);

-- 死锁场景1：批量更新导致的死锁
-- 事务A：
START TRANSACTION;
UPDATE products SET stock = stock - 1 WHERE name = '手机';  -- 锁定 idx_name='手机'
UPDATE products SET stock = stock - 1 WHERE name = '电脑';  -- 锁定 idx_name='电脑'
COMMIT;

-- 事务B（同时执行）：
START TRANSACTION;
UPDATE products SET stock = stock - 1 WHERE name = '电脑';  -- 锁定 idx_name='电脑'
UPDATE products SET stock = stock - 1 WHERE name = '手机';  -- 等待 idx_name='手机'（被A持有）
COMMIT;

-- 结果：死锁！事务A先锁定手机，事务B先锁定电脑，形成循环等待

-- 死锁场景2：主键和二级索引交叉导致的死锁
-- 事务A：
START TRANSACTION;
SELECT * FROM products WHERE id = 1 FOR UPDATE;  -- 行锁：id=1
-- 同时，这个查询也会锁定 name='手机' 对应的索引（如果走覆盖索引）

-- 事务B：
START TRANSACTION;
-- 通过 name 索引更新，锁定 idx_name='手机'
UPDATE products SET stock = 99 WHERE name = '手机';  -- 锁定索引
-- 但实际执行需要锁定 id=1 的行（因为 UPDATE 要更新行数据）
-- 如果A事务已经锁定了 id=1，则B需要等待
```

### 5.4 预防死锁的策略

```sql
-- 策略1：固定顺序访问资源
-- ❌ 错误：两个事务按不同顺序访问资源
-- 事务A：先锁手机，再锁电脑
-- 事务B：先锁电脑，再锁手机
-- ✅ 正确：所有事务都按相同顺序访问

-- 统一顺序：始终先锁 id 小的，再锁 id 大的
START TRANSACTION;
UPDATE products SET stock = stock - 1 WHERE id = 1;  -- 先锁手机
UPDATE products SET stock = stock - 1 WHERE id = 2;  -- 再锁电脑
COMMIT;

-- 策略2：减少锁的持有时间
-- ❌ 错误：在事务中混合使用锁和非锁操作
START TRANSACTION;
SELECT * FROM products WHERE id = 1 FOR UPDATE;  -- 加锁
--做一些业务逻辑（很耗时）--
UPDATE products SET stock = 99 WHERE id = 1;  -- 解锁
COMMIT;

-- ✅ 正确：使用乐观锁，减少锁的持有时间
START TRANSACTION;
SELECT * FROM products WHERE id = 1;  -- 不加锁
-- 业务逻辑
UPDATE products SET stock = 99, version = version + 1
WHERE id = 1 AND version = 0;  -- 乐观锁
COMMIT;

-- 策略3：降低隔离级别
-- 将 REPEATABLE READ 降为 READ COMMITTED
-- 可以减少 Gap Lock 的使用，降低死锁概率
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 策略4：添加合理的索引
-- 索引可以减少锁的范围
-- 无索引查询会锁住大量行（甚至全表）
CREATE INDEX idx_stock ON products(stock);
```

### 5.5 处理死锁的代码实践

```sql
-- 业务代码中处理死锁
-- 伪代码示例

function updateProductStock(productId, quantity) {
    maxRetries = 3;
    retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // 开启事务
            START TRANSACTION;

            // 查询并更新库存
            UPDATE products
            SET stock = stock - quantity
            WHERE id = productId AND stock >= quantity;

            if (affected_rows == 0) {
                // 库存不足，回滚
                ROLLBACK;
                return "库存不足";
            }

            // 创建订单记录
            INSERT INTO orders (product_id, quantity) VALUES (productId, quantity);

            // 提交
            COMMIT;
            return "下单成功";

        } catch (DeadlockException e) {
            // 死锁异常，重试
            ROLLBACK;
            retryCount++;
            sleep(random(10, 100));  // 随机等待，避免再次死锁
        } catch (Exception e) {
            ROLLBACK;
            throw e;
        }
    }

    return "系统繁忙，请稍后重试";
}

-- 死锁重试的最佳实践：
-- 1. 设置最大重试次数，避免无限循环
-- 2. 每次重试前随机等待，打破死锁循环
-- 3. 记录死锁日志，分析死锁原因
-- 4. 如果重试次数用完仍然失败，返回友好错误给用户
```

## 六、事务与锁的实战应用

### 6.1 事务使用场景

```sql
-- 场景1：转账业务（必须用事务）
START TRANSACTION;

-- 扣除转账人余额
UPDATE accounts
SET balance = balance - 1000
WHERE user_id = 1 AND balance >= 1000;

-- 增加收款人余额
UPDATE accounts
SET balance = balance + 1000
WHERE user_id = 2;

-- 检查是否成功
IF ROW_COUNT() = 0 THEN
    ROLLBACK;
ELSE
    COMMIT;
END IF;

-- 场景2：订单创建（必须用事务）
START TRANSACTION;

-- 创建订单主表
INSERT INTO orders (order_no, user_id, total_amount)
VALUES ('ORD20240101', 1, 999.00);

SET @order_id = LAST_INSERT_ID();

-- 创建订单商品表
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
    (@order_id, 101, 1, 499.00),
    (@order_id, 102, 2, 250.00);

-- 扣减库存
UPDATE products SET stock = stock - 1 WHERE id = 101;
UPDATE products SET stock = stock - 2 WHERE id = 102;

-- 记录操作日志
INSERT INTO operation_logs (operation, target_id, operator)
VALUES ('CREATE_ORDER', @order_id, 1);

COMMIT;

-- 场景3：报表统计（可以用只读事务）
START TRANSACTION READ ONLY;

SELECT
    DATE(created_at) AS date,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
GROUP BY DATE(created_at);

-- 只读事务性能更好，因为不需要记录 undo log
```

### 6.2 锁的使用场景

```sql
-- 场景1：悲观锁（明确需要锁定数据）
-- 用户下单减库存场景

-- ❌ 乐观锁方式（可能导致超卖）
UPDATE products SET stock = stock - 1
WHERE id = 1 AND stock >= 1;
-- 如果并发高，可能100个人都读到stock=1，都执行成功，超卖

-- ✅ 悲观锁方式（SELECT ... FOR UPDATE）
START TRANSACTION;

-- 先锁定要购买的商品
SELECT * FROM products WHERE id = 1 FOR UPDATE;
-- 此时其他事务无法修改这条记录

-- 检查库存
SET @stock = 100;

IF @stock >= 1 THEN
    UPDATE products SET stock = stock - 1 WHERE id = 1;
    INSERT INTO orders (product_id, quantity) VALUES (1, 1);
    COMMIT;
ELSE
    ROLLBACK;
END IF;

-- 场景2：防止重复提交
-- 用户点击多次"提交订单"

-- 方法：使用 INSERT ... ON DUPLICATE KEY UPDATE
-- 或者使用分布式锁

START TRANSACTION;

-- 检查订单是否已存在（防止重复）
SELECT * FROM orders WHERE order_no = 'ORD20240101' FOR UPDATE;

IF EXISTS(...) THEN
    ROLLBACK;  -- 订单已存在，取消
ELSE
    INSERT INTO orders ...;  -- 创建订单
    COMMIT;
END IF;

-- 场景3：资金对账（需要精确计算）
START TRANSACTION;

-- 锁定用户账户
SELECT * FROM accounts WHERE user_id = 1 FOR UPDATE;

-- 读取最新余额
SET @balance = (SELECT balance FROM accounts WHERE user_id = 1);

-- 业务计算
SET @new_balance = @balance + @interest - @fee;

-- 更新余额
UPDATE accounts SET balance = @new_balance WHERE user_id = 1;

COMMIT;
```

### 6.3 长事务的监控与处理

```sql
-- 查看当前运行中的事务
SELECT
    trx_id,
    trx_state,
    trx_started,
    trx_rows_locked,
    trx_tables_locked,
    trx_query,
    TIME_TO_SEC(TIMEDIFF(NOW(), trx_started)) AS duration_seconds
FROM information_schema.INNODB_TRX
WHERE trx_state = 'RUNNING'
ORDER BY trx_started;

-- 查看当前锁等待
SELECT
    lock_id,
    lock_trx_id,
    lock_mode,
    lock_type,
    lock_table,
    lock_index,
    lock_space,
    lock_page,
    lock_rec,
    lock_data
FROM information_schema.INNODB_LOCKS;

-- 查看锁等待关系
SELECT
    requesting_trx_id AS wait_trx,
    requested_lock_id AS wait_lock,
    blocking_trx_id AS block_trx,
    blocking_lock_id AS block_lock
FROM information_schema.INNODB_LOCK_WAITS;

-- 查看长时间运行的事务
SELECT
    r.trx_id,
    r.trx_started,
    r.trx_query,
    r.trx_rows_locked,
    r.trx_tables_locked,
    UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(r.trx_started) AS running_seconds
FROM information_schema.INNODB_TRX r
WHERE r.trx_state = 'RUNNING'
  AND r.trx_rows_locked > 0;

-- 杀掉长事务（谨慎使用）
KILL 12345;  -- 杀掉 trx_id = 12345 的事务
```

### 6.4 事务隔离级别选择指南

```
选择隔离级别的决策树：

┌─────────────────────────────────────────────────────────┐
│                需要最高性能吗？                           │
├────────────────────────┬────────────────────────────────┤
│         是             │              否                 │
│         ▼             │              ▼                 │
│    业务能接受脏读？     │      需要可重复读？              │
│         │             │              │                 │
│    ┌────┴────┐       │     ┌────────┴────────┐          │
│    │ 是      │ 否     │     │ 是              │ 否       │
│    ▼         ▼        │     ▼                 ▼          │
│ READ UNCOMMITTED  其他  │  REPEATABLE READ  READ COMMITTED│
└─────────────────────────────────────────────────────────┘

实际推荐：

MySQL 默认 REPEATABLE READ：
├── 适合绝大多数业务场景
├── 通过 MVCC + Gap Lock 保证一致性
└── 性能和安全性的平衡

金融、账务系统：
├── 使用 REPEATABLE READ 或 SERIALIZABLE
├── 配合悲观锁（SELECT ... FOR UPDATE）
└── 绝对不能接受幻读

报表、数据分析：
├── 使用 READ COMMITTED
├── 可以使用快照读提高并发
└── 注意不可重复读问题

高并发抢票、秒杀：
├── 使用 READ COMMITTED + 乐观锁
├── 减少锁冲突，提高吞吐量
└── 接受一定程度的并发问题（乐观锁控制）
```

## 七、总结：事务与锁的黄金法则

```
核心概念速记：

事务的 ACID：
├── A（原子性）：一组操作要么全做，要么全不做
├── C（一致性）：事务前后数据保持一致状态
├── I（隔离性）：并发事务相互隔离
└── D（持久性）：提交后数据永久保存

隔离级别（低到高，性能差到好）：
├── READ UNCOMMITTED → 读未提交（脏读）
├── READ COMMITTED → 读已提交（不可重复读）
├── REPEATABLE READ → 可重复读（MySQL默认，幻读由Gap Lock解决）
└── SERIALIZABLE → 串行化（完全串行）

MVCC 的关键：
├── 隐藏列：trx_id（事务ID）、roll_ptr（回滚指针）
├── ReadView：活跃事务ID列表，决定可见性
├── 快照读 vs 当前读
└── RR级别下ReadView在整个事务期间不变

InnoDB 锁类型：
├── S锁（共享锁）：读取时加，多个可以共存
├── X锁（排他锁）：修改时加，排斥其他锁
├── Record Lock：锁单行
├── Gap Lock：锁间隙，防止幻读
├── Next-Key Lock：行锁+间隙锁
└── 意向锁：表锁和行锁的桥梁

死锁预防策略：
├── 按固定顺序访问资源
├── 减少锁持有时间
├── 使用合理索引减少锁范围
├── 降低隔离级别（必要时）
└── 乐观锁替代悲观锁
```

> **最后叮嘱：** 事务和锁是数据库最核心的知识点，也是面试中最常问的内容。理解事务的 ACID 特性、MVCC 的实现原理、各种锁的适用场景，是每个后端开发者的必备技能。实际工作中，优先使用短事务，避免长事务占用锁资源；在并发场景下，优先考虑乐观锁，减少锁冲突带来的性能损耗。
