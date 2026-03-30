# 后端架构与 API 安全防御体系深度解析 (2026版)

## 目录

1. [概述](#1-概述)
2. [注入类攻击的底层防御](#2-注入类攻击的底层防御)
3. [SSRF服务端请求伪造](#3-ssrf服务端请求伪造)
4. [越权访问BOLA](#4-越权访问bola)
5. [JWT安全的高级对抗](#5-jwt安全的高级对抗)
6. [Rate Limiting与防爬虫](#6-rate-limiting与防爬虫)
7. [敏感数据保护](#7-敏感数据保护)
8. [供应链安全](#8-供应链安全)
9. [安全配置清单](#9-安全配置清单)

---

## 1. 概述

相比于前端安全主要防范对客户端用户的攻击（XSS, CSRF），后端安全防御的核心是**保护服务器基础设施、数据库核心资产以及防范越权访问**。

本指南深入探讨现代 Node.js / Go / Java 后端架构中的高级安全威胁及防御策略，包括 SQL 注入的底层机制、SSRF (服务端请求伪造)、越权漏洞 (IDOR/BOLA) 以及基于 JWT 的高级身份伪造攻击。

---

## 2. 注入类攻击的底层防御

### 2.1 SQL 注入的真相与防范
SQL 注入的本质是将外部输入的字符串，直接拼接到 SQL 语句中，导致数据库引擎将其解析为**执行指令**而非**数据参数**。

**防御的核心：预编译语句 (Prepared Statements)**
无论你使用 TypeORM、Prisma 还是原生的 `pg` 库，预编译是唯一的绝对防御手段。
**底层原理：**
1. 客户端首先将带有占位符（如 `SELECT * FROM users WHERE id = $1`）的 SQL 模板发送给数据库服务器。
2. 数据库服务器对模板进行**语法解析和预编译**，确定了查询树（Query Tree）。
3. 客户端再将参数发送给数据库。此时，无论参数里包含多少个 `' OR 1=1`，数据库引擎只会把它当作一个**纯文本字符串字面量**放入执行计划，绝不会改变原有的语法树结构。

### 2.2 NoSQL 注入
很多人误以为 MongoDB 等 NoSQL 没有 SQL 语法，所以不存在注入。这是极其危险的错觉。

**攻击示例 (MongoDB)：**
```javascript
// 假设后端的登录查询如下，且 req.body.password 没有经过类型校验
db.users.find({ username: req.body.username, password: req.body.password });

// 攻击者发送如下 JSON：
// {"username": "admin", "password": {"$gt": ""}}
```
**结果**：`$gt` (大于) 操作符使得无论密码是什么，条件都为真，从而绕过认证。
**防御**：在进入 ORM/ODM 查询前，**必须使用 Zod/Joi 等 Schema 验证库**，严格校验所有的输入类型必须为 String，拦截恶意的 Object 或 Array 输入。

---

## 3. SSRF (服务端请求伪造)

SSRF 是近年来危害最大的漏洞之一（曾导致 Capital One 数据大规模泄露）。攻击者利用服务器发起网络请求的特性，让服务器去访问它本不该访问的内网资源。

**场景**：比如你的应用有一个“通过 URL 获取远程图片作为头像”的功能。
**攻击手段**：攻击者传入 `http://169.254.169.254/latest/meta-data/` （AWS 实例元数据 API）或 `http://localhost:6379` （内网 Redis 端口）。

**防御矩阵：**
1. **禁用内网 IP 解析**：在发起 HTTP 请求前，将域名解析为 IP，检查是否属于内网 IP 段（如 `10.x.x.x`, `127.0.0.x`, `192.168.x.x`）。
2. **防范 DNS Rebinding**：攻击者可以在你校验 IP 时返回外网 IP，但在实际发起请求的瞬间，DNS 记录更改为内网 IP。必须在解析并校验通过后，直接使用该 IP 发起请求，而不是重新通过域名发起。
3. **网络隔离 (Zero Trust)**：将应用服务器放入特定的 VPC 子网，通过防火墙或安全组彻底阻断其访问内网其他敏感基础设施（如数据库、元数据服务）的 80/443 端口。

---

## 4. 越权访问：BOLA (Broken Object Level Authorization)

BOLA（过去被称为 IDOR）常年霸榜 OWASP API 安全 Top 1。

**表现**：用户 A 登录后获得了合法的 Token，但他将 API 请求 `/api/orders/1001` 修改为 `/api/orders/1002`，成功窃取了用户 B 的订单。

**防御架构原则：**
1. **摒弃自增 ID**：在对外暴露的 API 中，绝对不要使用数据库自增的主键 ID（如 `1001`, `1002`）。必须使用 UUID v4 或 NanoID，让攻击者无法通过枚举遍历对象。
2. **强制水平权限校验**：在后端的 Controller/Service 层，查询数据库时**必须永远带上当前登录用户的标识**。
   ```typescript
   // ❌ 错误：只通过 URL 参数查询
   const order = await db.orders.findById(req.params.orderId);
   
   // ✅ 正确：复合查询，确保该订单归属当前上下文用户
   const order = await db.orders.findOne({ 
     id: req.params.orderId, 
     userId: req.user.id // 从强验证的 JWT 中提取
   });
   ```

---

## 5. JWT 安全的高级对抗

JSON Web Token (JWT) 是无状态认证的基础，但错误的使用会导致毁灭性打击。

### 5.1 算法混淆攻击 (Algorithm Confusion)
JWT 头部有一个 `alg` 字段，标识使用的签名算法（如 `HS256` 意味着对称加密，`RS256` 意味着非对称加密）。
**漏洞机制**：如果后端库没有严格限制允许的算法，攻击者可以将 `alg` 修改为 `HS256`，然后用服务器公开的**公钥**作为对称加密的密钥重新签名 Token。后端库会误用该公钥去进行对称解密校验，从而被绕过。
**防御**：在验证 JWT 时，**必须硬编码指定 `algorithms: ['RS256']`**，绝不盲目信任头部传来的 `alg` 字段。

### 5.2 敏感信息暴露
JWT 默认只是经过 Base64Url 编码，**没有加密**。任何人都可以解码 payload。
**防御**：永远不要在 JWT 的 payload 中放置明文密码、内部系统 IP、敏感的 PII（个人身份信息）。只放置不敏感的 `userId`、`role` 和 `exp`。如果非要放，必须使用 JWE (JSON Web Encryption) 进行彻底加密。

---

## 6. Rate Limiting与防爬虫

### 6.1 多维度限流策略

```javascript
// 多维度限流实现
class MultiDimensionalRateLimiter {
  constructor(redis) {
    this.redis = redis;
    this.limiters = {
      ip: new IPRateLimiter(redis, 100, 60),        // IP维度: 100次/分钟
      user: new UserRateLimiter(redis, 1000, 60),   // 用户维度: 1000次/分钟
      endpoint: new EndpointRateLimiter(redis, 50, 60),  // 端点维度: 50次/分钟
      global: new GlobalRateLimiter(redis, 10000, 60)  // 全局维度: 10000次/分钟
    };
  }

  async check(req) {
    const clientIp = req.ip;
    const userId = req.user?.id;
    const endpoint = req.path;

    const checks = [
      { name: 'ip', key: `rl:ip:${clientIp}`, limiter: this.limiters.ip },
      { name: 'global', key: 'rl:global', limiter: this.limiters.global },
      { name: 'endpoint', key: `rl:endpoint:${endpoint}`, limiter: this.limiters.endpoint }
    ];

    if (userId) {
      checks.push({ name: 'user', key: `rl:user:${userId}`, limiter: this.limiters.user });
    }

    for (const check of checks) {
      const result = await check.limiter.check(check.key);

      if (!result.allowed) {
        return {
          allowed: false,
          limitType: check.name,
          retryAfter: result.retryAfter,
          limit: result.limit
        };
      }
    }

    return { allowed: true };
  }
}

// 滑动窗口限流器
class SlidingWindowRateLimiter {
  constructor(redis, limit, windowSeconds) {
    this.redis = redis;
    this.limit = limit;
    this.window = windowSeconds * 1000;
  }

  async check(key) {
    const now = Date.now();
    const windowStart = now - this.window;

    const multi = this.redis.multi();

    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}:${Math.random()}`);
    multi.zcard(key);
    multi.pexpire(key, this.window);

    const results = await multi.exec();
    const count = results[2][1];

    if (count > this.limit) {
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        retryAfter: Math.ceil(this.window / 1000)
      };
    }

    return {
      allowed: true,
      limit: this.limit,
      remaining: this.limit - count
    };
  }
}
```

### 6.2 爬虫识别与防御

```javascript
// 爬虫识别与防御
class BotDetector {
  analyze(req) {
    const signals = [];

    // 1. 检查User-Agent
    const userAgent = req.get('user-agent') || '';
    if (!userAgent || this.isKnownBot(userAgent)) {
      signals.push({ type: 'user-agent', score: 0.9 });
    }

    // 2. 检查请求头完整性
    const requiredHeaders = ['user-agent', 'accept', 'accept-language'];
    const missingHeaders = requiredHeaders.filter(h => !req.get(h));
    if (missingHeaders.length > 2) {
      signals.push({ type: 'missing-headers', score: 0.8 });
    }

    return {
      isSuspicious: signals.length >= 3,
      signals,
      riskScore: signals.reduce((sum, s) => sum + s.score, 0)
    };
  }

  isKnownBot(ua) {
    const knownBots = ['googlebot', 'bingbot', 'yandexbot', 'baiduspider'];
    return knownBots.some(bot => ua.toLowerCase().includes(bot));
  }
}
```

---

## 7. 敏感数据保护

### 7.1 数据脱敏策略

```javascript
// 数据脱敏中间件
const sensitiveFields = [
  'password', 'ssn', 'socialSecurityNumber', 'creditCard',
  'cvv', 'apiKey', 'secretKey', 'token', 'accessToken', 'refreshToken'
];

function redactSensitiveData(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redactSensitiveData(value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// 信用卡号脱敏
function maskCreditCard(cardNumber) {
  if (!cardNumber || cardNumber.length < 4) {
    return '[INVALID]';
  }
  return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
}

// 手机号脱敏
function maskPhoneNumber(phone) {
  if (!phone || phone.length < 7) {
    return '[INVALID]';
  }
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}
```

---

## 8. 安全配置清单

### 8.1 Express安全配置清单

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// 1. 安全头
app.use(helmet());

// 2. CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// 3. 输入清理
app.use(mongoSanitize());  // NoSQL注入防护
app.use(xss());             // XSS防护

// 4. 参数污染防护
app.use(hpp());

// 5. 请求体大小限制
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. 限流
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁'
}));
```

### 8.2 安全响应头配置

| 响应头 | 推荐值 | 说明 |
|--------|--------|------|
| X-Frame-Options | DENY | 防止点击劫持 |
| X-Content-Type-Options | nosniff | 防止MIME类型嗅探 |
| Strict-Transport-Security | max-age=31536000 | 强制HTTPS |
| Content-Security-Policy | 严格配置 | 限制资源加载 |
| Referrer-Policy | strict-origin-when-cross-origin | 控制Referer头 |

---

## 9. 面试高频问题

**Q1：如何防止SQL注入？**
**A：** 使用参数化查询或ORM，永远不要拼接用户输入到SQL语句中。

**Q2：什么是SSRF？如何防御？**
**A：** 服务端请求伪造，攻击者利用服务器访问内网资源。防御方法：禁用内网IP解析、验证URL、使用网络隔离。

**Q3：如何防止越权访问？**
**A：** 使用UUID替代自增ID、查询时始终带上用户标识、进行权限校验。

**Q4：JWT的安全注意事项？**
**A：** 使用强密钥、设置短过期时间、验证算法、敏感信息不要放在payload中、考虑使用黑名单。

---

*本文档持续更新，最后更新于 2026 年 3 月*