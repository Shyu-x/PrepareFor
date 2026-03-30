# PostgreSQL 数据库详解

## 目录

1. [PostgreSQL 基础](#1-postgresql-基础)
2. [SQL 基础查询](#2-sql-基础查询)
3. [高级查询](#3-高级查询)
4. [事务与锁](#4-事务与锁)
5. [Prisma ORM](#5-prisma-orm)

---

## 1. PostgreSQL 基础

### 1.1 PostgreSQL 简介

PostgreSQL 是一个功能强大的开源对象关系型数据库系统，以其可靠性、健壮性和性能而闻名。它支持 SQL 标准的大部分特性，并提供了许多高级功能。

**PostgreSQL 核心特性：**

- ACID 事务支持
- 外键约束
- 触发器和存储过程
- 视图
- JSON 支持
- 全文搜索
- 地理空间数据支持（PostGIS）
- 复制和高可用

### 1.2 连接 PostgreSQL

```javascript
// 使用 pg 库连接
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'password',
  max: 20,  // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 查询
const result = await pool.query('SELECT $1 as text', ['Hello World']);
console.log(result.rows);

// 释放连接
await pool.end();

// 使用连接池
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);
  console.log(result.rows[0]);
} finally {
  client.release();
}
```

---

## 2. SQL 基础查询

### 2.1 数据类型

```sql
-- 数值类型
INT, INTEGER      -- 4 字节整数
BIGINT            -- 8 字节整数
SMALLINT          -- 2 字节整数
DECIMAL(p, s)    -- 精确数值
REAL              -- 4 字节浮点
DOUBLE PRECISION  -- 8 字节浮点

-- 字符串类型
CHAR(n)           -- 固定长度
VARCHAR(n)        -- 可变长度
TEXT              -- 无限长度

-- 日期时间类型
DATE             -- 日期
TIME             -- 时间
TIMESTAMP        -- 日期时间
TIMESTAMPTZ      -- 带时区日期时间
INTERVAL         -- 时间间隔

-- 布尔类型
BOOLEAN          -- true/false/null

-- JSON 类型
JSON             -- JSON 数据
JSONB            -- 二进制 JSON

-- 数组类型
INT[]            -- 整数数组
TEXT[]           -- 字符串数组
```

### 2.2 表操作

```sql
-- 创建表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建带外键的表
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修改表结构
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(150);
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- 删除表
DROP TABLE IF EXISTS users CASCADE;

-- 表重命名
ALTER TABLE users RENAME TO app_users;
```

### 2.3 增删改查

```sql
-- 插入数据
INSERT INTO users (name, email, age) VALUES ('张三', 'zhangsan@example.com', 25);
INSERT INTO users (name, email) VALUES ('李四', 'lisi@example.com'), ('王五', 'wangwu@example.com');

-- 查询数据
SELECT * FROM users;
SELECT name, email FROM users WHERE age >= 25 ORDER BY created_at DESC LIMIT 10;
SELECT DISTINCT status FROM users;

-- 更新数据
UPDATE users SET age = 26, status = 'inactive' WHERE id = 1;
UPDATE users SET age = age + 1 WHERE status = 'active';

-- 删除数据
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE status = 'inactive' AND created_at < '2024-01-01';
```

### 2.4 条件查询

```sql
-- WHERE 条件
SELECT * FROM users WHERE age = 25;
SELECT * FROM users WHERE age != 25;
SELECT * FROM users WHERE age > 25 AND age < 30;
SELECT * FROM users WHERE age IN (20, 25, 30);
SELECT * FROM users WHERE age BETWEEN 20 AND 30;
SELECT * FROM users WHERE name LIKE '张%';    -- 百分号匹配任意字符
SELECT * FROM users WHERE name LIKE '张_';    -- 下划线匹配单个字符

-- NULL 处理
SELECT * FROM users WHERE age IS NULL;
SELECT * FROM users WHERE age IS NOT NULL;
SELECT COALESCE(age, 0) FROM users;  -- NULL 时返回默认值

-- 逻辑运算
SELECT * FROM users WHERE age > 20 AND status = 'active';
SELECT * FROM users WHERE age < 20 OR status = 'admin';
SELECT * FROM users WHERE NOT status = 'inactive';
```

---

## 3. 高级查询

### 3.1 连接查询

```sql
-- 内连接
SELECT users.name, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;

-- 左外连接
SELECT users.name, posts.title
FROM users
LEFT JOIN posts ON users.id = posts.user_id;

-- 右外连接
SELECT users.name, posts.title
FROM users
RIGHT JOIN posts ON users.id = posts.user_id;

-- 全外连接
SELECT users.name, posts.title
FROM users
FULL OUTER JOIN posts ON users.id = posts.user_id;

-- 多个表连接
SELECT u.name, p.title, c.content
FROM users u
JOIN posts p ON u.id = p.user_id
JOIN comments c ON p.id = c.post_id;
```

### 3.2 聚合查询

```sql
-- 计数
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT status) FROM users;

-- 求和、平均、最大、最小
SELECT SUM(amount) FROM orders;
SELECT AVG(age) FROM users;
SELECT MAX(price) FROM products;
SELECT MIN(created_at) FROM orders;

-- 分组
SELECT status, COUNT(*) FROM users GROUP BY status;
SELECT user_id, SUM(amount) FROM orders GROUP BY user_id;

-- 分组过滤
SELECT user_id, SUM(amount) as total
FROM orders
GROUP BY user_id
HAVING SUM(amount) > 1000;

-- 窗口函数
SELECT name, department, salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg
FROM employees;

SELECT name, salary,
  RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;

SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num
FROM employees;
```

### 3.3 子查询

```sql
-- 在 WHERE 中使用子查询
SELECT * FROM users
WHERE age > (SELECT AVG(age) FROM users);

SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- 在 FROM 中使用子查询
SELECT dept, avg_salary
FROM (
  SELECT department as dept, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
) as dept_avg
WHERE avg_salary > 5000;

-- 在 SELECT 中使用标量子查询
SELECT name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
FROM users;

-- IN/EXISTS 子查询
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.amount > 100);
```

### 3.4 常用函数

```sql
-- 字符串函数
SELECT CONCAT(name, ' - ', email) FROM users;
SELECT UPPER(name), LOWER(email) FROM users;
SELECT TRIM('  hello  ');
SELECT SUBSTRING('Hello World', 1, 5);  -- Hello
SELECT LENGTH(name) FROM users;
SELECT REPLACE(name, '张', '李') FROM users;

-- 数值函数
SELECT ABS(-5);           -- 5
SELECT ROUND(3.14159, 2); -- 3.14
SELECT CEIL(3.14);        -- 4
SELECT FLOOR(3.14);       -- 3
SELECT MOD(10, 3);        -- 1

-- 日期函数
SELECT CURRENT_DATE;
SELECT CURRENT_TIMESTAMP;
SELECT NOW();
SELECT EXTRACT(YEAR FROM created_at) FROM users;
SELECT DATE_TRUNC('month', created_at) FROM users;
SELECT age(created_at) FROM users;
SELECT created_at + INTERVAL '7 days' FROM users;

-- 条件函数
SELECT CASE
  WHEN age < 18 THEN '未成年'
  WHEN age < 30 THEN '青年'
  ELSE '中年'
END as age_group
FROM users;

SELECT COALESCE(phone, '未设置') FROM users;
SELECT NULLIF(age, 0) FROM users;
```

---

## 4. 事务与锁

### 4.1 事务

```sql
-- 开始事务
BEGIN;

-- 或者
START TRANSACTION;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;

-- 保存点
BEGIN;
INSERT INTO users (name) VALUES ('张三');
SAVEPOINT sp1;
INSERT INTO users (name) VALUES ('李四');
ROLLBACK TO SAVEPOINT sp1;
COMMIT;
```

### 4.2 Node.js 中的事务

```javascript
const { Pool } = require('pg');
const pool = new Pool();

// 事务示例
async function transfer(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 扣款
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );

    // 收款
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 4.3 行级锁

```sql
-- 悲观锁（FOR UPDATE）
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- 乐观锁（通过版本号）
-- 表需要有一个 version 字段
UPDATE accounts
SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 1;
-- 检查是否更新成功，如果没有记录说明版本冲突
```

### 4.4 隔离级别

```sql
-- 查看当前隔离级别
SHOW transaction isolation_level;

-- 设置隔离级别
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- PostgreSQL 隔离级别说明：
-- READ COMMITTED (默认): 读取已提交的数据
-- REPEATABLE READ: 重复读，保证事务期间看到的数据一致
-- SERIALIZABLE: 最高级别，强制事务顺序执行
```

---

## 5. Prisma ORM

### 5.1 Prisma 基础

```bash
# 安装 Prisma
npm install prisma --save-dev
npm install @prisma/client

# 初始化
npx prisma init
```

```typescript
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  age       Int?
  status    String    @default("active")
  posts     Post[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

### 5.2 Prisma CRUD 操作

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 创建
const user = await prisma.user.create({
  data: {
    email: 'zhangsan@example.com',
    name: '张三',
    age: 25
  }
});

// 批量创建
const users = await prisma.user.createMany({
  data: [
    { email: 'lisi@example.com', name: '李四' },
    { email: 'wangwu@example.com', name: '王五' }
  ]
});

// 查询单个
const user = await prisma.user.findUnique({
  where: { id: 1 }
});

const user = await prisma.user.findUnique({
  where: { email: 'zhangsan@example.com' }
});

// 查询多个
const users = await prisma.user.findMany({
  where: {
    age: { gte: 20 },
    status: 'active'
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
});

// 分页
const { data, total } = await prisma.$transaction(async (tx) => {
  const data = await tx.user.findMany({
    take: 10,
    skip: (page - 1) * 10
  });
  const total = await tx.user.count();
  return { data, total };
});

// 关联查询
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: { published: true }
    }
  }
});

// 更新
const user = await prisma.user.update({
  where: { id: 1 },
  data: { age: 26 }
});

await prisma.user.updateMany({
  where: { status: 'inactive' },
  data: { status: 'archived' }
});

// 删除
await prisma.user.delete({
  where: { id: 1 }
});

await prisma.user.deleteMany({
  where: { createdAt: { lt: new Date('2024-01-01') } }
});
```

### 5.3 高级查询

```typescript
// 过滤条件
const users = await prisma.user.findMany({
  where: {
    age: { gt: 20, lt: 30 },
    name: { contains: '张', startsWith: '张', endsWith: '三' },
    email: { in: ['a@example.com', 'b@example.com'] },
    status: { not: 'banned' },
    posts: { some: { published: true } }
  }
});

// 聚合
const count = await prisma.user.count();
const avgAge = await prisma.user.aggregate({
  _avg: { age: true }
});

const groupResult = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true },
  _avg: { age: true }
});

// 原生 SQL
const result = await prisma.$queryRaw`SELECT * FROM users WHERE age > ${minAge}`;

// 事务
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'new@example.com', name: '新用户' }
  });
  await tx.post.create({
    data: { title: '首篇文章', authorId: user.id }
  });
  return user;
});
```

---

## 常见面试问题

### 问题 1：PostgreSQL 和 MySQL 的区别？

**答案：** PostgreSQL 是对象关系型数据库，功能更丰富（支持视图、触发器、存储过程等）；MySQL 是纯关系型数据库，性能更快。PostgreSQL 对 SQL 标准支持更好，MySQL 更加轻量。

### 问题 2：事务的 ACID 特性？

**答案：** Atomic（原子性）：事务要么全部成功，要么全部失败；Consistency（一致性）：事务执行前后数据库状态一致；Isolation（隔离性）：并发事务互不干扰；Durability（持久性）：事务提交后数据持久保存。

---

## 6. 高级特性

### 6.1 JSON 操作

```sql
-- 创建带 JSON 列的表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  attributes JSONB,
  tags JSONB
);

-- 插入 JSON 数据
INSERT INTO products (name, attributes, tags) VALUES (
  '笔记本电脑',
  '{"brand": "Apple", "ram": 16, "storage": 512}',
  '["电子", "办公", "便携"]'
);

-- 查询 JSON 字段
SELECT name, attributes->>'brand' as brand FROM products;
SELECT name, attributes->'ram' as ram FROM products;

-- JSON 条件查询
SELECT * FROM products WHERE attributes->>'brand' = 'Apple';
SELECT * FROM products WHERE (attributes->>'ram')::int > 8;

-- JSON 包含查询
SELECT * FROM products WHERE attributes @> '{"brand": "Apple"}';
SELECT * FROM products WHERE tags @> '["电子"]';

-- 更新 JSON 字段
UPDATE products 
SET attributes = attributes || '{"color": "银色"}'::jsonb
WHERE id = 1;

-- 删除 JSON 字段
UPDATE products 
SET attributes = attributes - 'color'
WHERE id = 1;

-- JSON 数组操作
UPDATE products 
SET tags = tags || '["新品"]'::jsonb
WHERE id = 1;
```

### 6.2 全文搜索

```sql
-- 创建全文搜索索引
CREATE INDEX idx_articles_search ON articles 
USING GIN(to_tsvector('english', title || ' ' || content));

-- 全文搜索查询
SELECT title, ts_headline(content, query) as highlight
FROM articles, to_tsquery('english', 'PostgreSQL & tutorial') query
WHERE to_tsvector('english', title || ' ' || content) @@ query
ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), query) DESC;

-- 中文全文搜索（需要安装 zhparser 扩展）
-- CREATE EXTENSION zhparser;
-- CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);
```

### 6.3 存储过程和函数

```sql
-- 创建函数
CREATE OR REPLACE FUNCTION get_user_by_id(user_id INT)
RETURNS TABLE(id INT, name VARCHAR, email VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 调用函数
SELECT * FROM get_user_by_id(1);

-- 创建存储过程（PostgreSQL 11+）
CREATE OR REPLACE PROCEDURE transfer_money(
  from_account INT,
  to_account INT,
  amount DECIMAL
) AS $$
BEGIN
  -- 扣款
  UPDATE accounts SET balance = balance - amount WHERE id = from_account;
  
  -- 收款
  UPDATE accounts SET balance = balance + amount WHERE id = to_account;
  
  -- 记录日志
  INSERT INTO transfer_logs (from_account, to_account, amount, created_at)
  VALUES (from_account, to_account, amount, NOW());
  
  COMMIT;
END;
$$ LANGUAGE plpgsql;

-- 调用存储过程
CALL transfer_money(1, 2, 100.00);
```

### 6.4 触发器

```sql
-- 创建审计日志表
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50),
  operation VARCHAR(10),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data)
    VALUES (TG_TABLE_NAME, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, new_data)
    VALUES (TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, operation, new_data)
    VALUES (TG_TABLE_NAME, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## 7. 性能优化

### 7.1 查询计划分析

```sql
-- 使用 EXPLAIN 分析查询计划
EXPLAIN SELECT * FROM users WHERE age > 25;

-- 使用 EXPLAIN ANALYZE 实际执行查询
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25;

-- 分析结果解读：
-- Seq Scan: 顺序扫描（全表扫描，通常需要优化）
-- Index Scan: 索引扫描（使用了索引）
-- Bitmap Index Scan: 位图索引扫描（多条件查询）
-- Hash Join: 哈希连接
-- Nested Loop: 嵌套循环连接

-- 查看详细统计信息
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM users WHERE age > 25;
```

### 7.2 索引优化

```sql
-- 创建 B-Tree 索引（默认，适合等值和范围查询）
CREATE INDEX idx_users_age ON users(age);
CREATE INDEX idx_users_name_email ON users(name, email);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 创建部分索引
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- 创建表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 创建覆盖索引（包含查询所需的所有列）
CREATE INDEX idx_users_covering ON users(age) INCLUDE (name, email);

-- 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 查找未使用的索引
SELECT 
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT i.indisunique 
  AND idx_scan < 50 
  AND pg_relation_size(i.indexrelid) > 1024 * 1024
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### 7.3 连接池配置

```javascript
// 使用 pg 连接池
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // 连接池配置
  max: 20,                    // 最大连接数
  min: 5,                     // 最小连接数
  idleTimeoutMillis: 30000,   // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
  
  // 性能优化
  statement_timeout: 30000,   // 语句超时
  query_timeout: 30000,       // 查询超时
  
  // SSL 配置（生产环境）
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT,
  }
});

// 监控连接池状态
pool.on('connect', () => console.log('新连接建立'));
pool.on('acquire', () => console.log('连接被获取'));
pool.on('release', () => console.log('连接被释放'));
pool.on('remove', () => console.log('连接被移除'));

// 获取连接池统计
console.log({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
});
```

---

## 8. 与 Node.js 集成实战

### 8.1 完整的数据访问层

```typescript
// repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';

export abstract class BaseRepository<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string
  ) {}

  // 查询所有
  async findAll(options?: {
    where?: string;
    params?: any[];
    orderBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.where) {
      query += ` WHERE ${options.where}`;
      params.push(...(options.params || []));
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // 根据 ID 查询
  async findById(id: number): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // 创建
  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // 更新
  async update(id: number, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    const result = await this.pool.query(query, [...values, id]);
    return result.rows[0] || null;
  }

  // 删除
  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // 分页查询
  async paginate(options: {
    page: number;
    limit: number;
    where?: string;
    params?: any[];
    orderBy?: string;
  }): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const { page, limit, where, params = [], orderBy = 'id DESC' } = options;
    const offset = (page - 1) * limit;

    // 查询数据
    let dataQuery = `SELECT * FROM ${this.tableName}`;
    let countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;

    if (where) {
      dataQuery += ` WHERE ${where}`;
      countQuery += ` WHERE ${where}`;
    }

    dataQuery += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(dataQuery, [...params, limit, offset]),
      this.pool.query(countQuery, params),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }
}
```

### 8.2 用户仓库实现

```typescript
// repositories/user.repository.ts
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  // 根据邮箱查询
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // 搜索用户
  async search(query: string, limit: number = 10): Promise<User[]> {
    const result = await this.pool.query(
      `SELECT * FROM users 
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  // 更新密码
  async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // 更新状态
  async updateStatus(id: number, status: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // 统计用户
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byRole: Record<string, number>;
  }> {
    const [totalResult, activeResult, roleResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM users'),
      this.pool.query("SELECT COUNT(*) FROM users WHERE status = 'active'"),
      this.pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
    ]);

    const byRole: Record<string, number> = {};
    roleResult.rows.forEach(row => {
      byRole[row.role] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      byRole,
    };
  }
}
```

---

## 9. 常见面试问题

### 问题 1：PostgreSQL 和 MySQL 如何选择？

**答案：** 
- 选择 PostgreSQL：需要复杂查询、JSON 支持、GIS 功能、严格的数据完整性
- 选择 MySQL：读多写少、简单查询、需要高性能、团队熟悉

### 问题 2：什么是 VACUUM？为什么需要它？

**答案：** PostgreSQL 使用 MVCC 实现并发控制，UPDATE 和 DELETE 操作不会立即删除旧数据，而是标记为"死亡"。VACUUM 清理这些死亡元组，回收空间，更新统计信息。建议配置 autovacuum 自动执行。

### 问题 3：如何优化慢查询？

**答案：**
1. 使用 EXPLAIN ANALYZE 分析查询计划
2. 为常用查询条件创建索引
3. 避免使用 SELECT *
4. 使用连接池减少连接开销
5. 分区大表
6. 定期执行 VACUUM 和 ANALYZE

### 问题 4：PostgreSQL 如何实现高可用？

**答案：**
1. 主从复制：流复制实现数据同步
2. 逻辑复制：选择性复制数据
3. PgBouncer：连接池管理
4. Patroni：自动故障转移
5. PgPool-II：负载均衡和故障转移

### 问题 5：什么是 MVCC？

**答案：** MVCC（多版本并发控制）是 PostgreSQL 实现并发控制的核心机制。每个事务看到的是数据在某个时间点的快照，读写互不阻塞，提高了并发性能。

---

## 10. 最佳实践总结

### 10.1 表设计原则

1. **选择合适的数据类型**：使用最小的满足需求的类型
2. **合理使用约束**：NOT NULL、CHECK、FOREIGN KEY
3. **避免过度范式化**：适度冗余提高查询性能
4. **使用合适的索引**：根据查询模式创建索引

### 10.2 查询优化清单

- [ ] 使用 EXPLAIN ANALYZE 分析查询
- [ ] 为常用查询创建索引
- [ ] 避免使用 SELECT *
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 批量操作使用事务
- [ ] 大表考虑分区

### 10.3 运维清单

- [ ] 配置 autovacuum
- [ ] 定期备份（pg_dump）
- [ ] 监控连接数和慢查询
- [ ] 配置合适的连接池大小
- [ ] 设置合理的 statement_timeout

---

*本文档最后更新于 2026年3月*
