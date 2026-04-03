# MySQL 索引设计深度完全指南

> 前言：想象你有一本书，书里有 100 万字，如果你想找"MySQL 索引"这个关键词，你会怎么做？是从第一页翻到最后一页吗？当然不会！你会先翻到目录，找到"索引"两个字对应的页码，然后直接跳过去。索引就是数据库的"目录"，它能让你在海量数据中快速定位到目标，而不用一行一行地扫描。

## 一、索引到底是什么？

### 1.1 生活化类比：索引就是书的目录

你有没有遇到过这种情况：你想在字典里查一个汉字，比如"索引"的"索"字。你会怎么查？

**方法一（不用索引）：** 从字典第一页开始，一个字一个字地找，找到"索"字可能已经翻了几百页。

**方法二（用索引）：** 先翻到拼音索引表，找到"suo"对应的页码，然后直接跳到那一页。

数据库索引的原理跟这个一模一样！索引就是数据库为了加速查询，专门建立的一种"目录结构"。

### 1.2 MySQL 索引的本质

MySQL 索引是存储引擎层实现的一种数据结构，本质上是为了加速数据查找效率。不同的存储引擎对索引的实现方式不同：

| 存储引擎 | 索引实现 | 特点 |
|---------|---------|------|
| InnoDB | B+ 树 | 默认，最常用，支持事务 |
| MyISAM | B+ 树 | 不支持事务，适合读多写少 |
| Memory | Hash | 内存表使用，极快查询 |

**划重点：** 在 MySQL 5.5 以后，InnoDB 已经成为默认存储引擎，所以我们后面讨论的内容都基于 InnoDB 的 B+ 树索引。

### 1.3 索引的优缺点

```
索引的优点：
├── 大幅提升查询速度（有时是几百上千倍）
├── 减少服务器扫描的数据量
├── 减少服务器排序的开销
└── 优化随机 IO 变为顺序 IO

索引的缺点：
├── 占用磁盘空间（索引可能比数据还大）
├── 降低写入速度（插入、更新需要维护索引）
├── 索引需要维护成本
└── 过多索引会导致优化器选择困难
```

**核心原则：** 索引是为了加速查询，但索引不是越多越好。就像书的目录，目录太详细了反而显得冗余，而且新增内容时要同时更新目录，增加工作量。

## 二、B+ 树索引：MySQL 索引的基石

### 2.1 为什么 MySQL 选择 B+ 树？

在学习 B+ 树之前，我们先聊聊为什么 MySQL 选择了它，而不是其他数据结构？

常见的索引数据结构有：

- **二叉树**：树的高度太高，查询效率不稳定
- **平衡二叉树（AVL）**：树的高度仍然较高，IO 次数多
- **B 树**：相比 AVL 减少了树的高度，但非叶子节点也存储数据
- **B+ 树**：只在叶子节点存储数据，非叶子节点只存储索引

**MySQL 选择 B+ 树的核心原因：**

```
B+ 树 vs 其他树结构：

1. 树高度低：假设每个节点可以存储 100 个子节点指针
   - 3 层 B+ 树可以存储：100 × 100 × 100 = 100万 条数据
   - 而平衡二叉树 3 层只能存储：2^3 = 8 条数据

2. 叶子节点链表：B+ 树的叶子节点通过双向链表连接
   - 非常适合范围查询（比如查 1 月到 3 月的数据）
   - 只需找到起点，然后顺序遍历链表即可

3. 磁盘友好：每个节点默认 16KB（一个页大小）
   - 一次 IO 就能读取整个节点
   - 尽量减少磁盘 IO 次数
```

### 2.2 B+ 树的构造

假设我们有这样一张用户表：

```sql
-- 创建用户表
CREATE TABLE `users` (
  `id` INT PRIMARY KEY,           -- 主键索引，B+ 树自动创建
  `name` VARCHAR(50),             -- 普通索引
  `age` INT,
  `email` VARCHAR(100)
);
```

如果我们为 `name` 字段创建索引，MySQL 会构建一颗 B+ 树：

```
                    [name='M']
                   /          \
        [name='D']              [name='W']
        /      \                /        \
   数据页1    数据页2        数据页3      数据页4
   (id=1)    (id=5)         (id=8)      (id=12)
   (id=3)    (id=6)         (id=9)      (id=15)
   (id=4)    (id=7)         (id=11)     (id=16)
```

**结构说明：**

- **非叶子节点**：只存储索引值（如 'D', 'M', 'W'）和子节点指针
- **叶子节点**：存储实际的数据行（或数据指针，取决于是否聚簇索引）
- **链表连接**：叶子节点之间通过双向链表连接，支持范围查询

### 2.3 聚簇索引 vs 非聚簇索引

这是 MySQL 索引中最重要的概念之一，必须彻底理解！

```
聚簇索引（Clustered Index）：
├── 叶子节点存储完整的行数据
├── 一个表只能有一个聚簇索引（因为数据行只能排序一次）
├── InnoDB 中，主键索引就是聚簇索引
└── 如果没有主键，会选择唯一键或生成隐藏主键

非聚簇索引（Secondary Index / 二级索引）：
├── 叶子节点存储索引值 + 主键值
├── 查询时需要"回表"：先查到主键，再查聚簇索引获取完整数据
├── 一个表可以有多个非聚簇索引
└── 也叫二级索引或辅助索引
```

**通俗解释：**

- **聚簇索引**就像是把书的内容按章节顺序排布，每一页就是一条完整的数据
- **非聚簇索引**就像书末尾的"关键词索引"，它只告诉你关键词在哪些页，但具体内容还要翻到那些页去看

**回表查询示意图：**

```sql
-- 假设我们执行这条查询
SELECT * FROM users WHERE name = '张三';

-- 1. 先在 name 索引的 B+ 树中查找 '张三'
--    找到叶子节点：[name='张三', id=5]

-- 2. 发现 name 索引是非聚簇索引，只存储了 id=5
--    拿着 id=5 回到主键索引（聚簇索引）查找完整数据

-- 3. 在主键索引中找到 id=5 的完整行数据

-- 4. 返回完整数据给用户
```

### 2.4 InnoDB 聚簇索引的特殊性

```sql
-- 创建一张表，观察主键和索引的关系
CREATE TABLE `orders` (
  `order_id` BIGINT PRIMARY KEY,     -- 主键，聚簇索引
  `user_id` BIGINT NOT NULL,         -- 用户ID
  `order_time` DATETIME NOT NULL,   -- 下单时间
  `amount` DECIMAL(10,2),           -- 金额
  INDEX idx_user_id (user_id),      -- 普通索引，非聚簇
  INDEX idx_order_time (order_time)  -- 普通索引，非聚簇
) ENGINE=InnoDB;
```

**存储结构示意：**

```
主键索引（聚簇索引）B+ 树：
┌─────────────────────────────────────────────┐
│  order_id=1001 → [完整行数据: user_id=5, ...] │
│  order_id=1002 → [完整行数据: user_id=8, ...] │
│  order_id=1003 → [完整行数据: user_id=3, ...] │
│  ...                                          │
└─────────────────────────────────────────────┘

idx_user_id（非聚簇索引）B+ 树：
┌─────────────────────────────────────────────┐
│  user_id=3  → [user_id=3, order_id=1003]       │
│  user_id=5  → [user_id=5, order_id=1001]       │
│  user_id=8  → [user_id=8, order_id=1002]       │
│  user_id=8  → [user_id=8, order_id=1020]       │  -- 一个用户多个订单
│  ...                                          │
└─────────────────────────────────────────────┘
```

**为什么二级索引叶子节点存主键而不是完整数据？**

1. **一致性**：避免数据冗余和同步问题
2. **节省空间**：如果存完整数据，每个二级索引都会膨胀
3. **主键唯一性**：用主键关联保证数据准确性

## 三、复合索引：多字段的联合索引

### 3.1 什么是复合索引？

复合索引是包含多个列的索引，比如 `INDEX idx_a_b_c (a, b, c)`。

**类比：** 想象一本电话本，它是按"姓氏 + 名字 + 电话号码"排序的。你可以用姓氏快速找人，也可以用"姓氏 + 名字"更快地找人，但你单独用"名字"找人就不行了——因为电话本不是按名字排序的。

### 3.2 复合索引的存储结构

```sql
-- 创建用户表，包含复合索引
CREATE TABLE `products` (
  `id` BIGINT PRIMARY KEY,
  `category` VARCHAR(50),         -- 分类
  `brand` VARCHAR(50),            -- 品牌
  `price` DECIMAL(10,2),          -- 价格
  `sales_count` INT DEFAULT 0,    -- 销量
  INDEX idx_category_brand_price (category, brand, price)
);
```

**复合索引的 B+ 树结构（按字典序排列）：**

```
复合索引 idx_category_brand_price 的 B+ 树，按 (category, brand, price) 排序：

    ['电子产品', '苹果', 7999.00]  ─┐
    ['电子产品', '苹果', 8999.00]   │── 叶子节点链表
    ['电子产品', '小米', 2999.00]  ─┤
    ['服装', '耐克', 599.00]       ─┤
    ['服装', '阿迪达斯', 799.00]  ─┤
    ['食品', '可口可乐', 3.50]     ─┘

排序逻辑：
1. 先按 category 排序
2. category 相同的情况下，按 brand 排序
3. brand 也相同的情况下，按 price 排序
```

### 3.3 最左前缀原则：复合索引的核心规则

**最左前缀原则：** 复合索引从最左边开始，可以被连续使用的列。

```sql
-- 复合索引：INDEX idx_a_b_c (a, b, c)

-- ✅ 可以命中索引的查询
SELECT * FROM products WHERE a = 'xxx';              -- 用了 a
SELECT * FROM products WHERE a = 'xxx' AND b = 'yyy'; -- 用了 a, b
SELECT * FROM products WHERE a = 'xxx' AND b = 'yyy' AND c = 'zzz'; -- 用了 a, b, c

-- ⚠️ 部分命中（用了 a 和 b，但 c 用不上）
SELECT * FROM products WHERE a = 'xxx' AND b = 'yyy';

-- ❌ 无法命中索引（跳过 a，直接用 b）
SELECT * FROM products WHERE b = 'yyy';
SELECT * FROM products WHERE c = 'zzz';
SELECT * FROM products WHERE b = 'yyy' AND c = 'zzz';
```

**为什么叫"最左前缀"？**

因为索引就像一个字符串 "category#brand#price"，我们只有从左到右按顺序使用，才能利用索引的排序优势。就像：

```
"电子产品#苹果#7999" 是一个完整的值
"电子产品#苹果"     是它的前缀
"电子产品"          也是前缀
"苹果"               不是前缀（跳过了 category）
```

### 3.4 索引列顺序的选择

在创建复合索引时，列的顺序非常重要，应该遵循以下原则：

```
选择原则：
1. 区分度高的列放前面（能快速缩小查询范围）
2. 常用于 WHERE 条件的列放前面
3. 查询频率高的列放前面
4. 考虑是否会使用索引的所有列
```

**实战案例：订单表索引设计**

```sql
-- 分析常见查询
-- Q1: SELECT * FROM orders WHERE user_id = ? AND status = ?;
-- Q2: SELECT * FROM orders WHERE user_id = ?;
-- Q3: SELECT * FROM orders WHERE status = ?; -- 很少使用

-- 分析：
-- 1. user_id 几乎所有查询都会用到，必须放最前面
-- 2. status 是第二常见条件，但不是所有查询都用
-- 3. status 区分度可能较低（大部分订单状态是"已完成"）

-- ❌ 错误设计：把 status 放前面
INDEX idx_status_user (status, user_id)

-- ✅ 正确设计：区分度高的放前面
INDEX idx_user_status (user_id, status)

-- 针对这个场景，最佳设计：
INDEX idx_user_id (user_id)           -- 单列索引，覆盖 Q2
INDEX idx_user_status (user_id, status) -- 复合索引，覆盖 Q1
```

### 3.5 复合索引跳跃扫描

在某些情况下，即使查询不满足最左前缀，MySQL 优化器也可能使用索引，这叫"索引跳跃扫描"（Index Skip Scan）。

```sql
-- 复合索引 idx_a_b_c (a, b, c)
SELECT * FROM t WHERE b = 'yyy';

-- 如果 a 的枚举值很少（如只有 10 个），MySQL 可能：
-- 1. 先扫描 a 的所有值（10 次索引扫描）
-- 2. 对每个 a 值，查找 b = 'yyy' 的记录

-- 但这种优化效果有限，不要依赖它
```

**什么时候 MySQL 会选择跳跃扫描？**

1. 复合索引的第一个列不出现在 WHERE 条件中
2. 索引第一个列的枚举值非常少
3. 查询的选择性很高（返回数据量少）

## 四、覆盖索引：查询性能优化的利器

### 4.1 什么是覆盖索引？

**覆盖索引：** 如果一个索引包含了查询所需的所有字段，那么就不需要回表查询，这个索引就叫覆盖索引。

```
覆盖索引的工作流程：

普通索引查询（需要回表）：
┌─────────────────────────────────────────────────────┐
│ SELECT name FROM users WHERE name = '张三';           │
│                                                      │
│ 1. 在 name 索引树找到 name='张三'                     │
│ 2. 发现索引只存储了 (name, id)，缺少需要的字段         │
│ 3. 用 id 回表查询主键索引                             │
│ 4. 拿到完整数据                                       │
└─────────────────────────────────────────────────────┘

覆盖索引查询（无需回表）：
┌─────────────────────────────────────────────────────┐
│ SELECT id, name FROM users WHERE name = '张三';       │
│                                                      │
│ 1. 在 name 索引树找到 name='张三'                     │
│ 2. 索引已经包含 id 和 name，不需要回表！               │
│ 3. 直接返回数据                                       │
└─────────────────────────────────────────────────────┘
```

### 4.2 覆盖索引的实战应用

```sql
-- 创建订单表
CREATE TABLE `orders` (
  `id` BIGINT PRIMARY KEY,
  `order_no` VARCHAR(64) NOT NULL UNIQUE,  -- 订单号
  `user_id` BIGINT NOT NULL,
  `total_amount` DECIMAL(10,2),
  `status` TINYINT DEFAULT 1,
  `created_at` DATETIME,
  INDEX idx_order_no (order_no),
  INDEX idx_user_id (user_id)
);

-- 场景1：查询用户最近 10 笔订单（高频查询）
-- ❌ 普通写法，需要回表
EXPLAIN SELECT * FROM orders
WHERE user_id = 12345
ORDER BY created_at DESC
LIMIT 10;

-- ✅ 使用覆盖索引，避免回表
-- 创建复合索引：(user_id, created_at, id) 包含所有需要的字段
ALTER TABLE orders ADD INDEX idx_user_time (user_id, created_at, id);

EXPLAIN SELECT id, order_no, total_amount, created_at FROM orders
WHERE user_id = 12345
ORDER BY created_at DESC
LIMIT 10;
```

### 4.3 EXPLAIN 分析覆盖索引

```sql
EXPLAIN SELECT id, order_no, total_amount FROM orders
WHERE order_no = 'ORDER20240101001';

-- 输出分析：
-- +----+-------------+--------+------+---------------+------------+---------+---------------+------+--------------------------+
-- | id | select_type | table  | type | possible_keys | key        | key_len | ref           | rows | Extra                   |
-- +----+-------------+--------+------+---------------+------------+---------+---------------+------+--------------------------+
-- |  1 | SIMPLE      | orders | ref  | idx_order_no  | idx_order_no | 194   | const         |    1 | Using where; Using index |
-- +----+-------------+--------+------+---------------+------------+---------+---------------+------+--------------------------+

-- 关键字段解读：
-- key: idx_order_no     - 使用了 idx_order_no 索引
-- key_len: 194         - 使用了索引的长度（order_no 是 VARCHAR(64)）
-- Using index: 覆盖索引！不需要回表
-- Using where: 需要在服务层过滤数据
```

**Extra 字段说明：**

| Extra 值 | 含义 |
|---------|------|
| Using index | 使用覆盖索引，无需回表 |
| Using index condition | 使用索引下推，需要回表获取数据 |
| Using where | 在服务层过滤数据 |
| Using filesort | 需要额外排序，无法利用索引顺序 |
| Using temporary | 使用临时表 |
| Using join buffer | 使用连接缓存 |

### 4.4 索引下推：覆盖索引的增强

**索引下推（Index Condition Pushdown，ICP）：** MySQL 5.6+ 的优化，在索引遍历过程中就进行 WHERE 条件的过滤，减少回表次数。

```sql
-- 复合索引：(user_id, status, created_at)

-- 旧版本执行流程：
-- 1. 根据 user_id = 123 找到所有匹配的索引项
-- 2. 回表获取完整数据
-- 3. 在服务层过滤 status = 1 的记录

-- ICP 执行流程：
-- 1. 根据 user_id = 123 找到所有匹配的索引项
-- 2. 在索引层面过滤 status = 1（利用索引中的 status 列）
-- 3. 只对过滤后的记录回表

EXPLAIN SELECT * FROM orders
WHERE user_id = 123 AND status = 1;

-- Extra 显示 Using index condition（使用了索引下推）
```

## 五、索引失效分析：那些年踩过的坑

### 5.1 导致索引失效的常见原因

```sql
-- 创建测试表
CREATE TABLE `employees` (
  `id` BIGINT PRIMARY KEY,
  `emp_no` VARCHAR(20) NOT NULL,
  `name` VARCHAR(50),
  `age` INT,
  `department` VARCHAR(50),
  `salary` DECIMAL(10,2),
  `hire_date` DATE,
  INDEX idx_dept_age (department, age),
  INDEX idx_salary (salary)
);
```

#### 坑1：使用函数或运算

```sql
-- ❌ 索引失效：使用函数
SELECT * FROM employees WHERE YEAR(hire_date) = 2024;
-- 原因：hire_date 列被函数包裹，无法利用索引的有序性

-- ✅ 正确写法：使用日期范围
SELECT * FROM employees
WHERE hire_date >= '2024-01-01' AND hire_date < '2025-01-01';

-- ❌ 索引失效：列上做运算
SELECT * FROM employees WHERE salary * 1.1 > 10000;
-- 原因：salary 列参与了运算

-- ✅ 正确写法：计算放到右边
SELECT * FROM employees WHERE salary > 10000 / 1.1;
```

#### 坑2：使用 OR 导致索引失效

```sql
-- ❌ OR 导致索引失效
SELECT * FROM employees WHERE emp_no = 'E001' OR age = 30;
-- 原因：emp_no 有索引，age 没有索引，OR 会导致全表扫描

-- ✅ 正确写法：分开查询然后 UNION
SELECT * FROM employees WHERE emp_no = 'E001'
UNION ALL
SELECT * FROM employees WHERE age = 30 AND emp_no <> 'E001';

-- ✅ 如果 age 也有索引
ALTER TABLE employees ADD INDEX idx_age (age);
SELECT * FROM employees WHERE emp_no = 'E001' OR age = 30;
-- 现在 OR 可以使用索引并自动合并
```

#### 坑3：类型转换导致索引失效

```sql
-- ❌ 隐式类型转换导致索引失效
-- salary 是 DECIMAL 类型，但传入字符串
SELECT * FROM employees WHERE salary = '5000';
-- 原因：MySQL 会把 salary 转为数字，与字符串比较

-- ✅ 正确写法：保持类型一致
SELECT * FROM employees WHERE salary = 5000;

-- ❌ 字符串类型不匹配
-- emp_no 是 VARCHAR，但传入数字
SELECT * FROM employees WHERE emp_no = 12345;
-- 原因：emp_no = '12345' 可以使用索引
--       但 MySQL 会尝试转换，可能导致全表扫描
```

#### 坑4：LIKE 前面使用通配符

```sql
-- ❌ 索引失效：前面使用通配符
SELECT * FROM employees WHERE name LIKE '%三%';
SELECT * FROM employees WHERE name LIKE '%三';
-- 原因：索引按字典序排列，前缀是模糊的无法利用有序性

-- ✅ 正确写法：后缀通配符可以使用索引
SELECT * FROM employees WHERE name LIKE '张%';
-- 原因：'张%' 可以确定索引的起始范围

-- 💡 解决方案：使用全文索引
ALTER TABLE employees ADD FULLTEXT(name);
SELECT * FROM employees WHERE MATCH(name) AGAINST('三');
```

#### 坑5：NOT NULL 和 IS NOT NULL

```sql
-- ⚠️ 可能导致索引失效
SELECT * FROM employees WHERE age IS NOT NULL;
-- 原因：MySQL 优化器认为 NOT NULL 过滤数据太少，不如全表扫描

-- 💡 解决方案：给 age 添加默认值，避免 IS NOT NULL
ALTER TABLE employees MODIFY age INT DEFAULT 0;
SELECT * FROM employees WHERE age <> 0;
```

### 5.2 索引失效诊断流程

```
遇到慢查询时，按以下步骤诊断：

Step 1: 查看执行计划
┌─────────────────────────────────────────────────────┐
│ EXPLAIN SELECT ...                                  │
│ EXPLAIN ANALYZE SELECT ... (MySQL 8.0+)             │
└─────────────────────────────────────────────────────┘
          │
          ▼
Step 2: 检查 type 字段
┌─────────────────────────────────────────────────────┐
│ type = ALL        → 全表扫描，需要优化！             │
│ type = index      → 全索引扫描，需要优化             │
│ type = range      → 范围查询，正常                   │
│ type = ref        → 索引等值查询，正常               │
│ type = eq_ref     → 多表连接，唯一索引，正常         │
│ type = const      → 单表，主键/唯一键查询，最优       │
└─────────────────────────────────────────────────────┘
          │
          ▼
Step 3: 检查 key 和 possible_keys
┌─────────────────────────────────────────────────────┐
│ key = NULL      → 没有使用索引                       │
│ possible_keys 有索引但 key 没有 → 优化器选择了全表扫描│
└─────────────────────────────────────────────────────┘
          │
          ▼
Step 4: 检查 Extra 字段
┌─────────────────────────────────────────────────────┐
│ Using filesort      → 需要额外排序                   │
│ Using temporary     → 使用临时表                     │
│ Using where         → 服务层过滤                    │
│ Using index         → 覆盖索引，最优                  │
│ Using index condition → 索引下推                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 经典索引失效案例

```sql
-- 案例1：字符串引号丢失导致全表扫描
-- ❌ 错误
SELECT * FROM users WHERE phone = 13800138000;
-- MySQL 会把 phone 转成数字比较

-- ✅ 正确
SELECT * FROM users WHERE phone = '13800138000';

-- 案例2：负向查询
-- ❌ 负向 IN 可能导致索引失效
SELECT * FROM orders WHERE status NOT IN (1, 2, 3);

-- ✅ 正确：拆分为范围查询
SELECT * FROM orders WHERE status < 1 OR status > 3;

-- 案例3：混合使用索引列
-- 复合索引：(a, b, c)
-- ❌ b 和 c 用不上
SELECT * FROM t WHERE a = 1 AND c = 3;

-- ✅ 正确：确保 a 在条件中
SELECT * FROM t WHERE a = 1 AND b = 2 AND c = 3;

-- 案例4：统计数据类型的精度问题
-- ❌ 全表扫描
SELECT * FROM orders WHERE amount = 99.99;

-- ✅ 正确：使用 DECIMAL 字符串
SELECT * FROM orders WHERE amount = '99.99';
```

## 六、索引设计最佳实践

### 6.1 索引设计原则

```
索引设计的"三高"原则：

高选择性：选择区分度高的列创建索引
├── 选择性 = 不同值数量 / 总行数
├── 越接近 1 选择性越好
├── 如：主键 id 选择性 = 1（最优）
└── 如：性别 sex 选择性 ≈ 0.5（很差）

高频使用：优先为 WHERE 条件中的列创建索引
├── 经常出现在 WHERE 子句的列
├── 经常用于 JOIN 的列（ON 条件）
├── 经常用于 ORDER BY 和 GROUP BY 的列
└── 区分度高的列优先

高效维护：考虑索引的维护成本
├── 频繁更新的列不适合建索引
├── 写多读少的表少建索引
├── 复合索引控制列的数量（一般不超过 5 个）
└── 定期分析表和重建索引
```

### 6.2 索引设计步骤

**Step 1：分析查询模式**

```sql
-- 分析最常用的查询
SELECT
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
  AND TABLE_NAME = 'orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 找出热点查询
SELECT
  COUNT(*) AS query_count,
  SUBSTRING(QUERY, 1, 100) AS query_pattern
FROM mysql.slow_log
GROUP BY query_pattern
ORDER BY query_count DESC
LIMIT 10;
```

**Step 2：识别高频列**

```sql
-- 分析 WHERE 条件中的列使用频率
-- 假设有以下查询：
-- Q1: WHERE user_id = ? AND status = ?
-- Q2: WHERE user_id = ?
-- Q3: WHERE status = ? AND payment_time > ?
-- Q4: WHERE user_id = ? AND status = ? AND payment_time > ?

-- 统计列的出现频率：
-- user_id: 3 次（Q1, Q2, Q4）
-- status:  3 次（Q1, Q3, Q4）
-- payment_time: 2 次（Q3, Q4）

-- 设计索引：
-- 必选：idx_user_id (user_id)
-- 可选：idx_user_status (user_id, status) 覆盖 Q1
-- 可选：idx_status_paytime (status, payment_time) 覆盖 Q3
-- 最优：idx_user_status_pay (user_id, status, payment_time) 覆盖 Q4
```

**Step 3：创建索引**

```sql
-- 创建单列索引
CREATE INDEX idx_user_id ON orders(user_id);

-- 创建复合索引（考虑列顺序）
CREATE INDEX idx_user_status ON orders(user_id, status);

-- 创建唯一索引（自动具备唯一性约束）
CREATE UNIQUE INDEX uk_order_no ON orders(order_no);

-- 创建前缀索引（适用于 VARCHAR 前 N 个字符区分度好的场景）
CREATE INDEX idx_phone ON users(phone(11));  -- 取前 11 位

-- 创建覆盖索引（包含查询所需的所有列）
CREATE INDEX idx_user_order_cover ON orders(
  user_id,
  status,
  id,
  order_no,
  total_amount
);
```

### 6.3 索引优化实战案例

**案例：电商订单表索引优化**

```sql
-- 原始表结构（存在性能问题）
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  order_no VARCHAR(64),
  user_id BIGINT,
  merchant_id BIGINT,
  status TINYINT,
  pay_status TINYINT,
  ship_status TINYINT,
  total_amount DECIMAL(10,2),
  pay_time DATETIME,
  ship_time DATETIME,
  receive_time DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);

-- 问题分析：
-- 1. 常见查询：用户订单列表（按时间排序）
-- 2. 常见查询：商家订单管理（按状态筛选）
-- 3. 常见查询：超时订单处理（时间范围）

-- 优化后的索引设计：
-- 1. 用户订单列表
CREATE INDEX idx_user_created ON orders(user_id, created_at DESC);

-- 2. 商家订单管理（状态筛选）
CREATE INDEX idx_merchant_status ON orders(merchant_id, status, created_at DESC);

-- 3. 超时订单处理
CREATE INDEX idx_pay_timeout ON orders(pay_status, created_at)
WHERE pay_status = 0;  -- MySQL 8.0 支持条件索引

-- 4. 覆盖索引优化（用户订单详情）
CREATE INDEX idx_user_cover ON orders(
  user_id,
  created_at DESC,
  id,
  order_no,
  status,
  total_amount
);
```

### 6.4 索引维护策略

```sql
-- 检查索引使用情况
SELECT
  OBJECT_SCHEMA AS database_name,
  OBJECT_NAME AS table_name,
  INDEX_NAME,
  COUNT_FETCH,
  COUNT_INSERT,
  COUNT_UPDATE,
  COUNT_DELETE
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA = 'your_database'
ORDER BY COUNT_FETCH DESC;

-- 查找未使用的索引（小心删除）
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  INDEX_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
  AND INDEX_NAME != 'PRIMARY'
  AND SEQ_IN_INDEX = 1
  AND NOT EXISTS (
    SELECT 1 FROM performance_schema.table_io_waits_summary_by_index_usage i
    WHERE i.INDEX_NAME = STATISTICS.INDEX_NAME
      AND i.OBJECT_NAME = STATISTICS.TABLE_NAME
      AND i.COUNT_FETCH > 0
  );

-- 重建碎片化的索引
ALTER TABLE orders ENGINE = InnoDB;  -- 重建表，重建所有索引

-- 重新统计索引信息
ANALYZE TABLE orders;  -- 让优化器选择正确的执行计划
```

## 七、总结：索引设计检查清单

```
创建索引前的检查清单：

基础检查：
□ 分析查询模式和频率
□ 识别高频 WHERE 条件列
□ 计算列的选择性
□ 考虑是否会使用覆盖索引

复合索引设计：
□ 遵循最左前缀原则
□ 区分度高的列放前面
□ 考虑列的固定性和查询频率
□ 控制在 5 列以内

覆盖索引优化：
□ 识别高频查询的所有字段
□ 在复合索引中包含这些字段
□ 避免不必要的回表

索引维护：
□ 定期检查索引使用率
□ 删除未使用的索引
□ 监控索引碎片
□ 及时更新统计信息

性能验证：
□ 使用 EXPLAIN 分析执行计划
□ 验证索引是否被使用
□ 确认没有索引失效情况
□ 测试查询性能提升
```

> **终极提醒：** 索引是工具，不是越多越好。好的索引设计应该像精心设计的图书馆目录系统——准确、快速、不多余。在动手创建索引之前，先用 EXPLAIN 看看当前的查询计划，理解瓶颈在哪里，再针对性地设计索引。
