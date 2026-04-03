# 双Token认证完全指南

## 概述

本文档详细讲解现代Web应用中最核心的认证授权机制——双Token认证体系。我们将从最基本的认证概念讲起，逐步深入到JWT结构、Refresh Token策略、Token防盗、撤销机制、单点登录SSO、OAuth2.0协议，最后通过完整的NestJS+Redis实战案例帮助读者彻底掌握这一关键技术。

双Token认证是当前业界最主流的认证方案，被广泛应用于各类大型互联网产品中。掌握这一技术，不仅是开发企业级应用的必备技能，也是理解现代系统安全架构的重要基础。

---

## 第一章 认证基础

### 1.1 认证机制的发展历程

在互联网早期阶段，认证机制相对简单直接。最早出现的是基于Session的会话管理机制，这种机制在20世纪90年代末到2010年代初期一直是Web应用的主流选择。随着移动互联网和RESTful API的兴起，基于Token的无状态认证方案逐渐成为新的标准。而双Token认证，则是在单Token基础上的进化产物，解决了一系列安全和用户体验问题。

理解认证机制的发展历程，能帮助我们更好地理解为什么双Token认证会成为当前的最佳实践。每一代技术的演进，都是在解决前一代遗留问题的同时引入新的特性。

### 1.2 Cookie vs Session vs Token 对比分析

**Cookie认证机制**是最古老的认证方案之一，其核心原理是在用户登录成功后，服务器生成一个唯一的会话标识符（Session ID），并将其存储在Cookie中返回给客户端。以后每次请求时，客户端自动携带这个Cookie，服务器通过查询Session ID对应的会话数据来验证用户身份。

Cookie机制的优点在于实现简单、浏览器原生支持、自动随请求发送。然而它也存在明显的缺点：需要服务器存储会话数据，在分布式环境下需要共享Session；Cookie大小受限（通常4KB）；容易受到CSRF攻击；跨域共享麻烦。

**Session认证机制**是Cookie的增强版，它在服务器端维护一个会话存储（可以是内存、数据库或Redis），每个会话存储了用户的完整信息。服务器生成的Session ID本身不包含任何用户信息，只是指向存储数据的钥匙。

Session机制的优点是数据存储在服务器端，安全性较高；可以存储大量数据；服务端可以随时撤销会话。缺点是在分布式系统中需要 Session 共享；扩展性受限；服务器压力大；不利于移动端和第三方应用。

**Token认证机制**的出现彻底改变了认证的游戏规则。Token是一段自包含的字符串，它本身包含了验证所需的所有信息，服务器无需存储任何会话数据。这使得认证完全变成了无状态操作，非常适合分布式系统和微服务架构。

Token机制的优点是无状态、易于扩展、支持跨域、不受浏览器限制。缺点是Token一旦签发就无法撤销（除非加入黑名单）；数据膨胀（Token会随着存储信息增加而变大）；无法主动登出。

下面是一个详细的对比表格，帮助理解三种机制的差异：

| 特性 | Cookie | Session | Token |
|------|--------|---------|-------|
| 存储位置 | 浏览器 | 服务器 | 客户端 |
| 数据大小 | 通常4KB | 无限制 | 通常<4KB |
| 跨域支持 | 需配置 | 不支持 | 原生支持 |
| CSRF风险 | 高 | 中 | 低 |
| 扩展性 | 差 | 中 | 好 |
| 移动端支持 | 一般 | 差 | 好 |
| 服务端存储 | 无 | 需要 | 无 |

### 1.3 单Token认证的问题

单Token认证在2010年代中期成为主流，许多应用采用这种方案。它确实解决了Session共享的问题，但随着时间推移，一系列严重问题逐渐暴露出来。

**Token过期时间设置的两难困境**是单Token最大的痛点。如果Token过期时间设置得很长（比如30天），那么一旦Token泄露，攻击者就有长达30天的窗口期可以肆意妄为。而且用户无法主动"注销"账户，丢失的手机或电脑上的Token仍然有效。如果Token过期时间设置得很短（比如15分钟），用户就需要频繁登录，严重影响体验。用户在观看视频、填写长表单、进行重要操作时，可能因为Token过期而被迫中断，体验极差。

**无差别的权限颗粒度**是另一个问题。单Token一旦签发，在有效期内拥有全部权限。攻击者获取Token后，可以执行任何操作，包括删除数据、修改密码等高危操作。没有办法对Token进行细粒度的权限控制。

**无法感知 Token 状态变化**也带来了困扰。如果用户修改了密码，原本的Token仍然有效；管理员封禁了用户，用户的Token还能继续使用；用户主动注销后，Token依然有效。这些场景下，单Token无法提供灵活的会话管理能力。

### 1.4 双Token认证的诞生

针对单Token的种种问题，双Token认证方案应运而生。这种方案的核心思想是将认证拆分为两个独立的Token，各自承担不同的职责。

**Access Token（访问令牌）**是用户的身份证明，类似于身份证。它被设计为短期有效，通常设置为15分钟到1小时。Access Token在每次API请求中发送，用于验证请求者的身份。由于有效期短，即使泄露，损失也相对可控。

**Refresh Token（刷新令牌）**是获取新Access Token的凭证，类似于通行证。它被设计为长期有效，通常设置为7天到30天。Refresh Token不参与API请求，只在Access Token过期时用于获取新的访问令牌。由于不频繁使用，泄露风险较低。

双Token的设计哲学是：Access Token要短小精悍，快速轮换；Refresh Token要安全保管，长期有效。这种分离设计带来了巨大的安全收益：即使Access Token泄露，攻击者只能在短时间内（通常是几十分钟）使用；用户可以随时通过修改密码撤销Refresh Token；系统可以强制某些用户重新认证。

### 1.5 认证流程图详解

下面是一个完整的双Token认证流程图，帮助读者建立整体认知：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           双 Token 认证完整流程                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   用户端浏览器                    服务器端                      数据库    │
│        │                            │                        │        │
│        │  1. POST /auth/login        │                        │        │
│        │────── 用户名+密码 ──────────>│                        │        │
│        │                            │  2. 验证用户凭据         │        │
│        │                            │────────────────────────>│        │
│        │                            │  3. 返回用户信息         │        │
│        │                            │<────────────────────────│        │
│        │                            │                        │        │
│        │                            │  4. 生成 Access Token   │        │
│        │                            │     (JWT, 有效期15分钟) │        │
│        │                            │                        │        │
│        │                            │  5. 生成 Refresh Token  │        │
│        │                            │     (随机字符串, 存Redis│        │
│        │                            │      有效期7天)          │        │
│        │                            │                        │        │
│        │  6. 返回双Token            │                        │        │
│        │<───── Access + Refresh ────│                        │        │
│        │                            │                        │        │
│        │  7. 存储到本地              │                        │        │
│        │    (内存/LocalStorage)     │                        │        │
│        │                            │                        │        │
│        │  8. 后续请求携带 Access    │                        │        │
│        │───── Authorization: ───────>│                        │        │
│        │     Bearer <access_token>  │  9. 验证 Access Token   │        │
│        │                            │     (验证签名+过期)     │        │
│        │  10. 返回资源              │                        │        │
│        │<───────── 200 OK ──────────│                        │        │
│        │                            │                        │        │
│        │                            │     ... 15分钟后 ...     │        │
│        │                            │                        │        │
│        │  11. Access Token 过期     │                        │        │
│        │───── POST /auth/refresh ──>│                        │        │
│        │      Refresh Token ────────>│ 12. 验证 Refresh Token  │        │
│        │                            │     (检查Redis/数据库)  │        │
│        │                            │ 13. 检查是否被撤销      │        │
│        │                            │                        │        │
│        │                            │ 14. 生成新的 Access     │        │
│        │                            │     Token               │        │
│        │                            │                        │        │
│        │ 15. 返回新的 Access Token  │                        │        │
│        │<───── 新 Access Token ─────│                        │        │
│        │                            │                        │        │
│        │ 16. 重试之前的请求          │                        │        │
│        │───── 重试请求 ────────────>│                        │        │
│        │                            │                        │        │
└─────────────────────────────────────────────────────────────────────────┘
```

这个流程图展示了双Token认证的核心逻辑：用户登录时获得两个Token，后续请求使用Access Token；当Access Token过期时，用Refresh Token换取新的Access Token。这种设计实现了安全性和用户体验的平衡。

---

## 第二章 Access Token详解

### 2.1 JWT结构深入剖析

Access Token通常采用JWT（JSON Web Token）格式，这是一种开放标准（RFC 7519），被设计为紧凑且自包含的。JWT由三部分组成，每部分之间用点号分隔：Header（头部）、Payload（载荷）和Signature（签名）。

**Header（头部）**是一个JSON对象，描述了Token的基本信息和使用的算法。标准的Header通常包含两个字段：typ表示令牌类型（通常是JWT），alg表示签名的算法（如HS256、RS256）。

一个典型的Header看起来是这样的：

```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

这个JSON对象经过Base64URL编码后形成JWT的第一部分。Base64URL编码与标准Base64略有不同，它不使用+和/字符（这些字符在URL中有特殊含义），而是用-和_代替，同时省略末尾的=填充。

**Payload（载荷）**是JWT的核心部分，包含了声明（Claims）。声明是关于某个实体（通常是用户）信息的断言。JWT定义了三种类型的声明：

注册声明是预定义的建议性声明，不是必须但推荐使用。主要包括：iss（签发者）、sub（主题/用户ID）、aud（受众）、exp（过期时间）、nbf（生效时间）、iat（签发时间）、jti（JWT唯一标识）。

公有声明是自定义声明，可以添加任何信息，但应避免与注册声明冲突。私有声明是参与Token交换的双方自定义的声明，用于传递特定业务信息。

一个典型的Payload如下：

```json
{
  "sub": "user_12345",
  "name": "张三",
  "role": "admin",
  "permissions": ["read", "write", "delete"],
  "iat": 1709424000,
  "exp": 1709427600,
  "iss": "https://api.example.com"
}
```

**Signature（签名）**是JWT的安全保障。通过签名，接收方可以验证消息的完整性和签发者身份。签名的计算方式是将编码后的Header和Payload用点号连接，然后使用Header中指定的算法和密钥进行签名。

如果使用HMAC SHA256算法，签名的计算方式如下：

```
签名 = HMAC-SHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

最终的JWT就是将这三部分用点号连接起来的字符串：

```
JWT = base64UrlEncode(header) + "." + base64UrlEncode(payload) + "." + signature
```

### 2.2 Payload存储什么

Payload是JWT中存储业务信息的部分，设计良好的Payload需要平衡信息量和Token体积。Access Token在每次请求中都会携带，如果Payload过大，会增加网络传输负担。

**必须包含的字段**是用户标识和过期时间。sub（Subject）是用户的唯一标识，通常是用户ID或UUID，这个字段是JWT的核心，用于标识当前请求针对哪个用户。exp（Expiration Time）是必选字段，定义了该Token何时失效，服务器通过检查这个字段来判断Token是否还有效。

**推荐包含的字段**包括签发者（iss）用于标识签发Token的服务，方便追踪和审计；角色（role）用于存储用户的角色信息，如admin、user、moderator等，避免每次请求都查询数据库；权限（permissions）数组存储用户的具体权限列表，实现细粒度的访问控制。

**可选包含的字段**有会话ID（sid），用于将Token与特定会话关联，支持多设备管理和会话追踪；设备指纹（device_fp），记录签发Token时的设备信息，用于安全检测；IP地址（ip），记录签发Token时的客户端IP，用于异常检测。

**不应包含的字段**有敏感信息（密码、密钥等），这些信息虽然被编码但未加密，任何人都可以解码；大量数据，Token不是数据存储工具，过大的Payload会影响性能；经常变化的数据，Token一旦签发就无法更新。

一个实际项目中的Payload设计如下：

```typescript
// Payload类型定义
interface AccessTokenPayload {
  // 注册声明
  sub: string;           // 用户ID：user_abc123
  iss: string;           // 签发者：api.example.com
  iat: number;           // 签发时间：1709424000
  exp: number;           // 过期时间：1709427600（15分钟后）

  // 公有声明 - 用户信息
  name: string;          // 用户名：张三
  email: string;         // 邮箱：zhangsan@example.com
  avatar?: string;       // 头像URL（可选）

  // 公有声明 - 权限信息
  role: string;          // 角色：admin | user | moderator
  permissions: string[]; // 权限列表：["article:read", "article:write"]

  // 公有声明 - 会话信息
  sid: string;           // 会话ID：session_xyz789
  type: "access";        // Token类型标识
}

// 生成Access Token的函数
function generateAccessToken(payload: Omit<AccessTokenPayload, "iss" | "iat" | "exp" | "type">): string {
  // 签发时间
  const iat = Math.floor(Date.now() / 1000);

  // 过期时间：15分钟后
  const exp = iat + 15 * 60;

  // 完整载荷
  const fullPayload: AccessTokenPayload = {
    ...payload,
    iss: "api.example.com",
    iat,
    exp,
    type: "access"
  };

  // 使用HS256算法签名
  return jwt.sign(fullPayload, ACCESS_TOKEN_SECRET, {
    algorithm: "HS256"
  });
}
```

### 2.3 签名算法选择

JWT支持多种签名算法，选择合适的算法对系统安全至关重要。算法主要分为两大类：对称加密算法（HMAC）和非对称加密算法（RSA/ECDSA）。

**HS256（HMAC with SHA-256）**是对称加密算法，使用同一个密钥进行签名和验证。优点是计算速度快，资源消耗低；实现简单，适合单服务部署。缺点是密钥需要在所有服务间共享，分布在微服务环境中存在泄露风险；无法实现真正的谁签发谁验证。

HS256适合的场景是：单体应用或单一服务集群；团队规模小，密钥管理不复杂；对性能要求极高。实际项目中，FastDocument的API网关就使用了HS256，因为它只需要在网关层验证Token，不需要跨服务共享密钥。

**RS256（RSA Signature with SHA-256）**是非对称加密算法，使用私钥进行签名，公钥进行验证。优点是私钥只需在签发服务保存，公钥可以公开分发；适合微服务架构和跨组织验证。缺点是计算速度比HMAC慢10倍以上；Token体积较大（公钥证书较大）；实现相对复杂。

RS256适合的场景是：微服务架构，Token需要在多个服务间验证；开放平台，第三方需要验证Token；需要支持多租户，每个租户使用不同的密钥对。

**ES256（ECDSA with SHA-256）**是椭圆曲线数字签名算法，相比RS256有更短的密钥和签名，同时保持相同的安全性。签名体积比RS256小很多，计算速度也更快。缺点是实现复杂度更高，需要理解椭圆曲线密码学知识。

**PS256（RSA-PSS）**是RSA填充模式的签名算法，相比PKCS1v1.5更安全，但性能略差。使用场景较少。

实际项目中的算法配置：

```typescript
// 算法配置类
class TokenConfig {
  // Access Token配置
  static readonly ACCESS_TOKEN = {
    // 签名算法：生产环境推荐使用 RS256 或 ES256
    algorithm: "RS256" as const,

    // 过期时间：15分钟（安全与体验的平衡）
    expiresIn: "15m",

    // 密钥类型
    keyType: "RSA",
  };

  // Refresh Token配置
  static readonly REFRESH_TOKEN = {
    // 刷新Token不需要JWT格式，使用随机字符串更安全
    format: "random",

    // 过期时间：7天
    expiresIn: "7d",
  };
}

// 生产环境的RS256密钥生成
// 私钥用于签发Token（保密）
// 公钥用于验证Token（可分发）
function generateRSAKeyPair(): { privateKey: string; publicKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,           // 密钥长度：2048位（安全平衡）
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { privateKey, publicKey };
}

// Access Token验证（使用公钥）
function verifyAccessToken(token: string, publicKey: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "api.example.com",
    });

    return decoded as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError("Access Token已过期");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError("无效的Access Token");
    }
    throw error;
  }
}
```

### 2.4 过期时间设置：为什么必须短

Access Token的过期时间设置是一个需要仔细权衡的安全决策。大多数安全专家推荐将Access Token的过期时间设置在5分钟到1小时之间，15分钟是最常见的选择。

**为什么Access Token必须短**？核心原因是降低Token泄露后的损失。如果Access Token的有效期是一周，那么攻击者获得这个Token后有一周的时间可以进行各种操作。如果有效期是15分钟，攻击者只能在这短暂窗口内搞破坏。即使发现Token泄露，用户也有足够时间采取行动。

**短期Token的安全价值**在于：Token轮换机制会定期产生新Token，攻击者难以持续控制；即使单个Token泄露，影响范围可控；结合异常检测，可以及时发现可疑活动。

**用户体验的平衡点**是15分钟。这个时间长度允许用户进行一整段完整的操作（如填写长表单、编辑文档、观看课程）而不会被打断。同时也不会因为Token过期时间太长而造成安全隐患。用户通常可以接受每15分钟需要刷新一次Token（如果配合前端自动刷新，用户完全无感知）。

**实现Access Token自动刷新**让这个时间对用户完全透明：

```typescript
// Access Token过期处理中间件
async function accessTokenMiddleware(ctx: Context, next: Next) {
  try {
    // 验证Token
    const payload = verifyAccessToken(ctx.state.token);
    ctx.state.user = payload;
    await next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // Token过期，尝试用Refresh Token刷新
      const refreshed = await attemptTokenRefresh(ctx);

      if (refreshed) {
        // 刷新成功，重试原请求
        ctx.respond(ctx.request, refreshed.accessToken);
      } else {
        // 刷新失败，要求重新登录
        ctx.status = 401;
        ctx.body = { error: "认证已过期，请重新登录" };
      }
    } else {
      throw error;
    }
  }
}

// 尝试刷新Token
async function attemptTokenRefresh(ctx: Context): Promise<{
  accessToken: string;
  newRefreshToken?: string;
} | null> {
  const refreshToken = ctx.cookies.get("refresh_token") ||
                       ctx.headers["x-refresh-token"];

  if (!refreshToken) {
    return null;
  }

  try {
    // 验证Refresh Token
    const refreshData = await validateRefreshToken(refreshToken);

    // 生成新的Access Token
    const newAccessToken = generateAccessToken({
      sub: refreshData.userId,
      name: refreshData.name,
      role: refreshData.role,
      permissions: refreshData.permissions,
      sid: refreshData.sessionId,
    });

    // 可选：也刷新Refresh Token（滚动更新）
    const newRefreshToken = await rotateRefreshToken(refreshData);

    return {
      accessToken: newAccessToken,
      newRefreshToken,
    };
  } catch (error) {
    // Refresh Token无效或已过期
    return null;
  }
}
```

---

## 第三章 Refresh Token详解

### 3.1 为什么需要Refresh Token

Refresh Token是双Token体系中的关键组件，它的存在解决了一系列单Token无法克服的问题。理解为什么需要Refresh Token，是理解整个双Token体系的基础。

**无状态认证的撤销难题**是引入Refresh Token的主要原因。JWT的核心特性是无状态——服务器不需要存储任何会话信息，只需要在收到Token时验证其签名和过期时间即可。但这带来了一个严重问题：如果用户的Token仍然有效，但服务器想撤销它（比如用户修改了密码、账号被盗、管理员封禁用户），该怎么办？单Token方案无法优雅地解决这个问题。

Refresh Token通过将"会话状态"外部化到数据库或Redis来解决这个问题。Refresh Token本身是一个随机字符串，服务器需要查询存储来验证它。当需要撤销会话时，只需要删除或标记存储中的Refresh Token即可。

**Access Token短期有效带来的登录体验问题**也需要解决。如果没有Refresh Token，用户需要每15分钟输入一次用户名和密码，这显然是无法接受的体验。Refresh Token允许用户在Access Token过期后自动获取新的Access Token，整个过程对用户完全透明。

**安全隔离**是另一个重要原因。Access Token在每次请求中都会发送到服务器，暴露在网络传输和浏览器历史记录中。相比之下，Refresh Token只在Access Token刷新时使用，暴露机会大大减少。Access Token和Refresh Token的分离意味着攻击者即使截获了Access Token，也只能获得短期的访问权限；即使获得了Refresh Token，也无法直接使用，必须配合服务器验证。

**会话管理能力**大大增强。通过Refresh Token，服务器可以追踪用户的登录状态、强制某些用户重新认证、检测异常登录、限制同时在线设备数量。这些能力在单Token体系中都很难实现。

### 3.2 存储策略：Redis vs 数据库

Refresh Token的存储是整个双Token体系的关键环节。存储策略直接影响系统的安全性、性能和可扩展性。

**Redis存储方案**是目前最主流的选择。Redis是基于内存的高性能键值存储，天生适合Token存储场景。

Redis的优势包括：性能极高，读取速度可达百万QPS；支持过期时间自动清理；支持集群和主从复制；丰富的原子操作支持；可以方便地实现分布式锁和计数器。

Redis的潜在风险有：数据存储在内存中，大规模部署成本较高；默认配置下数据不持久化（可配置AOF和RDB）；Redis崩溃时可能导致大量用户同时需要重新登录。

```typescript
// Redis存储Refresh Token实现
import Redis from "ioredis";

class RefreshTokenStore {
  private redis: Redis;
  private readonly KEY_PREFIX = "refresh_token:";
  private readonly BLACKLIST_PREFIX = "token_blacklist:";

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 存储Refresh Token
  async set(userId: string, tokenId: string, refreshToken: string, expiresInSeconds: number): Promise<void> {
    const key = this.KEY_PREFIX + tokenId;
    const value = JSON.stringify({
      refreshToken,
      userId,
      createdAt: Date.now(),
      deviceInfo: this.getDeviceInfo(),
    });

    // 使用SETEX命令，同时设置过期时间
    await this.redis.setex(key, expiresInSeconds, value);

    // 同时维护用户Token索引，支持查询用户的所有Refresh Token
    await this.redis.sadd(`user_tokens:${userId}`, tokenId);
  }

  // 验证Refresh Token
  async validate(tokenId: string, refreshToken: string): Promise<RefreshTokenData | null> {
    const key = this.KEY_PREFIX + tokenId;
    const data = await this.redis.get(key);

    if (!data) {
      // Token不存在或已过期
      return null;
    }

    const parsed = JSON.parse(data);

    // 验证refresh token匹配
    if (parsed.refreshToken !== refreshToken) {
      // Token被替换，疑似被盗用
      await this.addToBlacklist(parsed.userId, tokenId);
      return null;
    }

    // 检查是否在黑名单
    if (await this.isBlacklisted(parsed.userId, tokenId)) {
      return null;
    }

    return parsed;
  }

  // 撤销单个Refresh Token
  async revoke(tokenId: string): Promise<void> {
    const key = this.KEY_PREFIX + tokenId;
    const data = await this.redis.get(key);

    if (data) {
      const parsed = JSON.parse(data);
      // 将Token加入黑名单
      await this.addToBlacklist(parsed.userId, tokenId);
      // 删除Token
      await this.redis.del(key);
      // 从用户Token索引中移除
      await this.redis.srem(`user_tokens:${parsed.userId}`, tokenId);
    }
  }

  // 撤销用户的所有Refresh Token（退出所有设备）
  async revokeAll(userId: string): Promise<void> {
    // 获取用户的所有Token
    const tokenIds = await this.redis.smembers(`user_tokens:${userId}`);

    if (tokenIds.length > 0) {
      // 将所有Token加入黑名单
      const pipeline = this.redis.pipeline();
      for (const tokenId of tokenIds) {
        pipeline.setex(
          this.BLACKLIST_PREFIX + tokenId,
          86400 * 7, // 黑名单保留7天
          "revoked"
        );
        pipeline.del(this.KEY_PREFIX + tokenId);
      }
      pipeline.del(`user_tokens:${userId}`);
      await pipeline.exec();
    }
  }

  // 轮换Refresh Token（滚动更新）
  async rotate(tokenId: string, refreshToken: string): Promise<{
    newTokenId: string;
    newRefreshToken: string;
  } | null> {
    const userId = await this.getUserIdByToken(tokenId);

    if (!userId) {
      return null;
    }

    // 生成新的Token
    const newTokenId = crypto.randomUUID();
    const newRefreshToken = this.generateRefreshTokenValue();
    const expiresIn = 7 * 24 * 60 * 60; // 7天

    // 原子性操作：删除旧Token，创建新Token
    const pipeline = this.redis.multi();
    pipeline.del(this.KEY_PREFIX + tokenId);
    pipeline.setex(
      this.KEY_PREFIX + newTokenId,
      expiresIn,
      JSON.stringify({
        refreshToken: newRefreshToken,
        userId,
        createdAt: Date.now(),
      })
    );
    pipeline.srem(`user_tokens:${userId}`, tokenId);
    pipeline.sadd(`user_tokens:${userId}`, newTokenId);

    await pipeline.exec();

    return {
      newTokenId,
      newRefreshToken,
    };
  }

  // 黑名单检查
  private async isBlacklisted(userId: string, tokenId: string): Promise<boolean> {
    const exists = await this.redis.exists(this.BLACKLIST_PREFIX + tokenId);
    return exists === 1;
  }

  // 添加到黑名单
  private async addToBlacklist(userId: string, tokenId: string): Promise<void> {
    await this.redis.setex(
      this.BLACKLIST_PREFIX + tokenId,
      86400 * 7,
      JSON.stringify({ userId, revokedAt: Date.now() })
    );
  }

  private getDeviceInfo(): DeviceInfo {
    // 从请求上下文获取设备信息
    return {
      userAgent: process.env.HTTP_USER_AGENT || "unknown",
      ip: process.env.HTTP_CLIENT_IP || "unknown",
    };
  }

  private generateRefreshTokenValue(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  private async getUserIdByToken(tokenId: string): Promise<string | null> {
    const key = this.KEY_PREFIX + tokenId;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data).userId;
  }
}
```

**数据库存储方案**适合需要长期存储、历史追溯、复杂查询的场景。相比Redis，数据库可以存储更多信息，支持复杂查询，但性能相对较低。

```typescript
// 数据库存储Refresh Token实现（TypeORM）
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({ unique: true })
  tokenHash!: string;  // 存储哈希而非原始值

  @Column({ type: "varchar", length: 500 })
  deviceInfo!: string; // JSON字符串

  @Column({ type: "varchar", length: 50 })
  ipAddress!: string;

  @Column({ default: false })
  isRevoked!: boolean;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

// Repository实现
class RefreshTokenRepository {
  constructor(private ormRepository: Repository<RefreshToken>) {}

  async createToken(userId: string, refreshToken: string, deviceInfo: any, ipAddress: string): Promise<RefreshToken> {
    // 对refreshToken进行哈希存储，即使数据库泄露也无法还原原始Token
    const tokenHash = await crypto.createHash("sha256").update(refreshToken).digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = this.ormRepository.create({
      userId,
      tokenHash,
      deviceInfo: JSON.stringify(deviceInfo),
      ipAddress,
      expiresAt,
    });

    return this.ormRepository.save(token);
  }

  async validateToken(userId: string, refreshToken: string): Promise<RefreshToken | null> {
    const tokenHash = await crypto.createHash("sha256").update(refreshToken).digest("hex");

    const token = await this.ormRepository.findOne({
      where: {
        userId,
        tokenHash,
        isRevoked: false,
      },
    });

    if (!token) return null;

    // 检查是否过期
    if (new Date() > token.expiresAt) {
      return null;
    }

    return token;
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.ormRepository.update(tokenId, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.ormRepository.update({ userId }, { isRevoked: true });
  }

  async getActiveTokens(userId: string): Promise<RefreshToken[]> {
    return this.ormRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: { createdAt: "DESC" },
    });
  }
}
```

**存储策略对比**：

| 特性 | Redis | 数据库 |
|------|-------|--------|
| 读取性能 | 微秒级 | 毫秒级 |
| 写入性能 | 微秒级 | 毫秒级 |
| 存储容量 | 受内存限制 | 受磁盘限制 |
| 持久化 | 需要配置 | 原生支持 |
| 查询能力 | 有限（Keys/Set） | 强大（SQL） |
| 集群支持 | 原生支持 | 需要配置 |
| 成本 | 内存较贵 | 磁盘便宜 |
| 适用场景 | 高性能要求 | 审计/追溯要求 |

实际项目中，建议采用Redis作为主要存储，同时可以考虑Redis+数据库的双写方案，Redis用于高性能验证，数据库用于持久化和审计。

### 3.3 过期时间：为什么需要长

Refresh Token的过期时间设置与Access Token形成鲜明对比——它需要足够长，通常设置为7天到30天。这个时间长度是经过深思熟虑的安全权衡。

**为什么Refresh Token需要长过期时间**？核心原因是减少用户登录频率。如果Refresh Token只有1小时有效期，用户需要每隔一小时就重新输入密码，这比单Token方案（Token过期时间一小时）还要糟糕，完全失去了双Token方案的优势。用户应该只有在真正需要重新认证的情况下（如长时间未访问、主动登出、设备丢失）才需要重新登录。

**7天是一个好的平衡点**。一周的时间足够覆盖用户的正常使用模式：用户周末休息，周一回来仍然可以继续工作；用户出差一周，回来后不需要重新登录；即使临时需要离开较长时间，也在可接受范围内。

**过期时间的环境适应性**。对于高安全要求的场景（如金融、医疗），可以缩短到1-3天；对于需要长时间保持登录的应用（如内容创作平台），可以延长到30天。但无论多长时间，都必须设置过期时间，绝对不能让Refresh Token永远不会过期。

**过期时间与安全的关系**很多人存在误解，认为Token过期时间越短越安全。但实际上，Refresh Token的安全性主要来自：存储安全（哈希+加密）、传输安全（HTTPS）、使用频率低（只在刷新时使用）。7天的过期时间配合其他安全措施，安全性是足够的。

### 3.4 撤销机制

Refresh Token的撤销机制是实现会话管理能力的关键。一个完善的撤销机制需要支持多种场景：单Token撤销、全部Token撤销、按条件撤销。

**单Token撤销**是最基本的功能，用于用户主动登出特定设备。实现时需要将Token标记为已撤销或直接从存储中删除：

```typescript
// 单Token撤销
async revokeToken(tokenId: string, userId: string): Promise<boolean> {
  // 验证Token属于该用户
  const token = await this.store.findOne({ tokenId, userId });

  if (!token) {
    return false;
  }

  // 将Token加入撤销列表（使用Redis Sorted Set按时间排序）
  await this.redis.zadd(
    `token:revoked:${userId}`,
    Date.now(),
    tokenId
  );

  // 删除Token本身
  await this.store.delete(tokenId);

  return true;
}
```

**全部Token撤销**用于安全事件响应，比如用户修改密码、疑似账号被盗、管理员重置等。实现时需要遍历用户的所有Token：

```typescript
// 全部Token撤销
async revokeAllTokens(userId: string, reason: string): Promise<number> {
  // 获取用户所有活跃Token
  const tokens = await this.store.findByUserId(userId);

  if (tokens.length === 0) {
    return 0;
  }

  // 使用管道批量操作
  const pipeline = this.redis.pipeline();

  for (const token of tokens) {
    // 添加到撤销列表
    pipeline.zadd(
      `token:revoked:${userId}`,
      Date.now(),
      token.id
    );
    // 删除Token
    pipeline.del(`refresh_token:${token.id}`);
  }

  // 记录撤销原因（用于审计）
  pipeline.hset(`revocation:log:${userId}`, {
    reason,
    revokedAt: new Date().toISOString(),
    count: tokens.length.toString(),
  });

  await pipeline.exec();

  return tokens.length;
}
```

**按条件撤销**是更高级的功能，比如撤销所有非当前设备的Token、撤销特定时间之前的所有Token：

```typescript
// 撤销除当前设备外的所有Token
async revokeOtherDevices(userId: string, currentTokenId: string): Promise<number> {
  const tokens = await this.store.findByUserId(userId);
  let revokedCount = 0;

  for (const token of tokens) {
    if (token.id !== currentTokenId) {
      await this.revokeToken(token.id, userId);
      revokedCount++;
    }
  }

  return revokedCount;
}

// 撤销特定时间之前的所有Token
async revokeTokensBefore(userId: string, timestamp: number): Promise<number> {
  const tokens = await this.store.findByUserId(userId);
  let revokedCount = 0;

  for (const token of tokens) {
    if (token.createdAt < timestamp) {
      await this.revokeToken(token.id, userId);
      revokedCount++;
    }
  }

  return revokedCount;
}
```

**撤销后的一致性处理**。当Refresh Token被撤销后，如果用户同时持有使用该Refresh Token获取的Access Token，这个Access Token仍然会在短期内有效（最多15分钟）。这是可接受的安全权衡，因为我们：通常无法即时撤销Access Token（它是无状态的）；15分钟的窗口期风险可控；强制撤销所有Access Token需要维护黑名单，成本高昂。

如果需要更严格的安全控制，可以在验证Access Token时同时检查Refresh Token的撤销状态：

```typescript
// Access Token验证时检查Refresh Token状态
async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
  const payload = jwt.verify(accessToken, publicKey);

  // 如果启用了严格模式，检查Refresh Token是否仍有效
  if (this.strictMode) {
    const refreshTokenData = await this.refreshTokenStore.validate(
      payload.sid,
      payload.refreshTokenId
    );

    if (!refreshTokenData) {
      // Refresh Token已被撤销，Access Token也视为无效
      throw new TokenRevokedError("会话已撤销，请重新登录");
    }
  }

  return payload;
}
```

---

## 第四章 双Token完整流程实现

### 4.1 登录时生成双Token

登录是双Token体系的起点，需要在验证用户凭据后，同时生成Access Token和Refresh Token。以下是一个完整的NestJS实现：

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../redis/redis.service";
import { UserService } from "../user/user.service";
import * as crypto from "crypto";

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface TokenPayload {
  sub: string;           // 用户ID
  name: string;          // 用户名
  email: string;         // 邮箱
  role: string;          // 角色
  permissions: string[]; // 权限列表
  sid: string;           // 会话ID
  iss: string;           // 签发者
  iat: number;           // 签发时间
  exp: number;           // 过期时间
  type: "access";       // Token类型
}

@Injectable()
export class AuthService {
  // Access Token配置
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60;      // 15分钟（秒）
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7天（秒）
  private readonly TOKEN_ISSUER = "api.example.com";

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  /**
   * 用户登录
   * 流程：验证密码 -> 生成双Token -> 存储RefreshToken -> 返回给客户端
   */
  async login(
    username: string,
    password: string,
    deviceInfo: DeviceInfo,
  ): Promise<LoginResult> {
    // 1. 验证用户凭据
    const user = await this.userService.validateCredentials(username, password);

    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 2. 生成会话ID（用于关联Access Token和Refresh Token）
    const sessionId = crypto.randomUUID();

    // 3. 生成Access Token（JWT格式）
    const accessTokenPayload: Omit<TokenPayload, "iss" | "iat" | "exp" | "type"> = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sid: sessionId,
    };

    const accessToken = this.generateAccessToken(accessTokenPayload);

    // 4. 生成Refresh Token（随机字符串）
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await this.hashToken(refreshToken);

    // 5. 存储Refresh Token到Redis
    await this.redisService.storeRefreshToken({
      tokenId: sessionId,
      tokenHash: refreshTokenHash,
      userId: user.id,
      deviceInfo,
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    // 6. 记录用户登录历史（审计用）
    await this.recordLoginHistory(user.id, deviceInfo, sessionId);

    // 7. 返回双Token
    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      tokenType: "Bearer",
    };
  }

  /**
   * 生成Access Token
   * 使用JWT格式，包含完整的用户信息
   */
  private generateAccessToken(
    payload: Omit<TokenPayload, "iss" | "iat" | "exp" | "type">
  ): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: TokenPayload = {
      ...payload,
      iss: this.TOKEN_ISSUER,
      iat: now,
      exp: now + this.ACCESS_TOKEN_EXPIRY,
      type: "access",
    };

    // 使用RS256算法签名（生产环境推荐）
    return this.jwtService.sign(fullPayload, {
      algorithm: "RS256",
      privateKey: process.env.JWT_PRIVATE_KEY,
    });
  }

  /**
   * 生成Refresh Token
   * 使用加密安全的随机字符串
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * 对Refresh Token进行哈希
   * 只存储哈希值，不存储原始Token（安全措施）
   */
  private async hashToken(token: string): Promise<string> {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * 记录登录历史
   */
  private async recordLoginHistory(
    userId: string,
    deviceInfo: DeviceInfo,
    sessionId: string,
  ): Promise<void> {
    const history = {
      sessionId,
      deviceInfo,
      loginAt: new Date().toISOString(),
      ipAddress: deviceInfo.ip,
    };

    // 使用Redis List存储最近10次登录
    await this.redisService.lpush(`login:history:${userId}`, JSON.stringify(history));
    await this.redisService.ltrim(`login:history:${userId}`, 0, 9);
  }
}

// 设备信息接口
interface DeviceInfo {
  userAgent: string;
  ip: string;
  platform?: string;
  browser?: string;
}
```

### 4.2 请求时验证Access Token

Access Token的验证是每个API请求都需要经过的环节，需要高效且安全。以下是NestJS的守卫实现：

```typescript
// access-token.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { RedisService } from "../redis/redis.service";

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    sessionId: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. 从请求头提取Token
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("未提供访问令牌");
    }

    try {
      // 2. 验证Token签名和过期时间
      const payload = await this.jwtService.verifyAsync(token, {
        publicKey: process.env.JWT_PUBLIC_KEY,
        algorithms: ["RS256"],
        issuer: "api.example.com",
      });

      // 3. 验证Token类型
      if (payload.type !== "access") {
        throw new UnauthorizedException("无效的令牌类型");
      }

      // 4. 可选：检查会话是否仍然有效（Refresh Token未被撤销）
      const isSessionValid = await this.checkSession(payload.sub, payload.sid);

      if (!isSessionValid) {
        throw new UnauthorizedException("会话已失效，请重新登录");
      }

      // 5. 将用户信息附加到请求对象
      request.user = {
        userId: payload.sub,
        sessionId: payload.sid,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
      };

      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException("令牌格式无效");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException("令牌已过期");
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("认证失败");
    }
  }

  /**
   * 从Authorization头提取Bearer Token
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }

  /**
   * 检查会话是否有效
   * 如果启用了Refresh Token撤销检查，需要验证对应的Refresh Token仍然有效
   */
  private async checkSession(userId: string, sessionId: string): Promise<boolean> {
    // 检查会话是否在黑名单
    const isBlacklisted = await this.redisService.isSessionBlacklisted(userId, sessionId);

    if (isBlacklisted) {
      return false;
    }

    return true;
  }
}
```

### 4.3 过期时Refresh流程

当Access Token过期时，前端需要使用Refresh Token获取新的Access Token。以下是NestJS的刷新接口实现：

```typescript
// refresh-token.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "../auth.service";

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

@Controller("auth")
export class RefreshTokenController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 刷新访问令牌
   * POST /auth/refresh
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> {
    if (!body.refreshToken) {
      throw new UnauthorizedException("未提供刷新令牌");
    }

    const result = await this.authService.refreshAccessToken(body.refreshToken);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      tokenType: "Bearer",
    };
  }
}

// auth.service.ts 中的刷新方法
async refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  newRefreshToken?: string;
  refreshTokenExpiresIn?: number;
}> {
  // 1. 哈希传入的Refresh Token
  const tokenHash = await this.hashToken(refreshToken);

  // 2. 从Redis查找对应的Token记录
  const tokenData = await this.redisService.findRefreshToken(tokenHash);

  if (!tokenData) {
    throw new UnauthorizedException("刷新令牌无效或已过期");
  }

  // 3. 验证Token未被撤销
  if (tokenData.isRevoked) {
    // Token被撤销过，标记为安全事件
    await this.handlePotentialTokenTheft(tokenData.userId, tokenData.tokenId);
    throw new UnauthorizedException("会话已失效，请重新登录");
  }

  // 4. 获取用户最新信息（权限可能已变更）
  const user = await this.userService.findById(tokenData.userId);

  if (!user) {
    throw new UnauthorizedException("用户不存在");
  }

  // 5. 检查用户账户状态
  if (!user.isActive) {
    throw new UnauthorizedException("账户已被禁用");
  }

  // 6. 生成新的Access Token
  const newAccessToken = this.generateAccessToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    sid: tokenData.sessionId,
  });

  // 7. 可选：执行Refresh Token轮换（Rolling Refresh）
  // 每个Refresh Token只能使用一次，用新Token替换旧Token
  const shouldRotate = await this.shouldRotateRefreshToken(tokenData);

  if (shouldRotate) {
    const rotationResult = await this.rotateRefreshToken(tokenData, refreshToken);
    return {
      accessToken: newAccessToken,
      newRefreshToken: rotationResult.newRefreshToken,
      refreshTokenExpiresIn: rotationResult.newRefreshTokenExpiresIn,
    };
  }

  return {
    accessToken: newAccessToken,
  };
}

/**
 * 判断是否应该轮换Refresh Token
 * 条件：距离上次使用超过一定时间，或者使用了N次
 */
private async shouldRotateRefreshToken(tokenData: RefreshTokenData): Promise<boolean> {
  const lastUsedAt = tokenData.lastUsedAt || tokenData.createdAt;
  const hoursSinceLastUse = (Date.now() - lastUsedAt) / (1000 * 60 * 60);

  // 如果距离上次使用超过24小时，执行轮换
  if (hoursSinceLastUse > 24) {
    return true;
  }

  // 或者使用了超过一定次数（默认100次）后轮换
  const useCount = tokenData.useCount || 0;
  if (useCount > 100) {
    return true;
  }

  return false;
}

/**
 * 轮换Refresh Token
 * 生成新的Refresh Token并撤销旧的
 */
private async rotateRefreshToken(
  tokenData: RefreshTokenData,
  currentRefreshToken: string,
): Promise<{
  newRefreshToken: string;
  newRefreshTokenExpiresIn: number;
}> {
  const newRefreshToken = this.generateRefreshToken();
  const newRefreshTokenHash = await this.hashToken(newRefreshToken);
  const newExpiresIn = 7 * 24 * 60 * 60; // 7天

  // 原子操作：更新Token
  await this.redisService.rotateRefreshToken({
    oldTokenHash: await this.hashToken(currentRefreshToken),
    newTokenHash: newRefreshTokenHash,
    sessionId: tokenData.sessionId,
    userId: tokenData.userId,
    expiresIn: newExpiresIn,
  });

  return {
    newRefreshToken,
    newRefreshTokenExpiresIn: newExpiresIn,
  };
}

/**
 * 处理可疑的Token盗用情况
 */
private async handlePotentialTokenTheft(userId: string, sessionId: string): Promise<void> {
  // 撤销用户所有会话
  await this.revokeAllUserSessions(userId, "可疑的Token使用");

  // 记录安全事件
  await this.securityService.logSecurityEvent({
    type: "TOKEN_THEFT_SUSPECTED",
    userId,
    sessionId,
    timestamp: new Date(),
    severity: "HIGH",
  });

  // 可选：发送安全通知给用户
  await this.notificationService.sendSecurityAlert(userId, {
    title: "账户安全警告",
    message: "检测到您的账户存在异常登录行为，所有会话已被强制终止。请检查您的账户安全。",
  });
}
```

### 4.4 完整双Token流程图

下面是双Token认证的完整流程图，涵盖登录、请求、刷新、撤销的所有场景：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            双 Token 认证完整流程图                                │
│                                                                                 │
│  ┌──────────┐                              ┌──────────────────────────────────┐ │
│  │   用户    │                              │           服务器端               │ │
│  └────┬─────┘                              └──────────────┬───────────────────┘ │
│       │                                                 │                       │
│       │  1. 登录请求 (用户名+密码)                       │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        2. 验证用户名密码                │
│       │                                                 │                       │
│       │                                        3. 生成 Access Token (JWT)      │
│       │                                        │  - sub: user_id               │
│       │                                        │  - exp: now + 15min           │
│       │                                        │  - 包含用户信息和权限          │
│       │                                                 │                       │
│       │                                        4. 生成 Refresh Token           │
│       │                                        │  - 随机64字节字符串            │
│       │                                        │  - SHA256哈希后存储到Redis     │
│       │                                        │  - 有效期7天                   │
│       │                                                 │                       │
│       │  5. 返回 { accessToken, refreshToken }           │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       │  6. 存储Token到安全位置                          │                       │
│       │     - accessToken: 内存或sessionStorage         │                       │
│       │     - refreshToken: httpOnly Cookie (推荐)      │                       │
│       │                                                 │                       │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                         正常API请求流程                                 │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                                                 │                       │
│       │  7. 携带Access Token发请求                       │                       │
│       │     Authorization: Bearer <access_token>        │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        8. 验证JWT签名和过期时间            │
│       │                                                 │                       │
│       │                                        9. 检查会话是否有效                │
│       │                                                 │                       │
│       │  10. 返回请求结果                                │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                        Access Token过期流程                            │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                                                 │                       │
│       │  11. 请求被拒绝 (401 Unauthorized)              │                       │
│       │     { error: "token_expired" }                 │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       │  12. 使用Refresh Token请求新Token               │                       │
│       │      POST /auth/refresh                         │                       │
│       │      { refreshToken: "..." }                    │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        13. 验证Refresh Token            │
│       │                                        │  - 查找Redis中的记录             │
│       │                                        │  - 验证哈希是否匹配              │
│       │                                        │  - 检查是否已撤销               │
│       │                                                 │                       │
│       │                                        14. 获取最新用户信息              │
│       │                                        (权限可能已变更)                  │
│       │                                                 │                       │
│       │                                        15. 生成新的Access Token          │
│       │                                                 │                       │
│       │                                        16. [可选] 轮换Refresh Token      │
│       │                                        - 生成新的随机字符串              │
│       │                                        - 撤销旧的Refresh Token           │
│       │                                                 │                       │
│       │  17. 返回新的Token(s)                          │                       │
│       │     {                                          │                       │
│       │       accessToken: "new...",                   │                       │
│       │       refreshToken: "new..." (可选)            │                       │
│       │     }                                          │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       │  18. 重试之前的API请求                          │                       │
│       │     (使用新的Access Token)                     │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │  19. 请求成功                                  │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                          主动登出流程                                    │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                                                 │                       │
│       │  20. 请求登出                                   │                       │
│       │      POST /auth/logout                         │                       │
│       │      { refreshToken: "..." }                   │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        21. 撤销Refresh Token            │
│       │                                        - 加入黑名单                      │
│       │                                        - 从用户Token列表中移除           │
│       │                                                 │                       │
│       │                                        22. 记录审计日志                  │
│       │                                                 │                       │
│       │  23. 确认登出成功                               │                       │
│       │     (客户端应清除存储的所有Token)              │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                       多设备管理 - 查看登录设备                           │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                                                 │                       │
│       │  24. 请求设备列表                               │                       │
│       │      GET /auth/devices                         │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        25. 查询用户的所有Refresh Token  │
│       │                                        26. 返回设备信息列表               │
│       │     [                                        │                       │
│       │       { device: "Chrome/Win10", location:    │                       │
│       │         "北京", lastActive: "刚刚" },         │                       │
│       │       { device: "Safari/iOS", location:       │                       │
│       │         "上海", lastActive: "2小时前" },      │                       │
│       │     ]                                        │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                    多设备管理 - 退出其他设备                              │
│       ├─────────────────────────────────────────────────────────────────────────┤
│       │                                                 │                       │
│       │  27. 请求退出其他设备                           │                       │
│       │      DELETE /auth/devices/other                │                       │
│       │─────────────────────────────────────────────────>                      │
│       │                                                 │                       │
│       │                                        28. 撤销除当前设备外的所有Token   │
│       │                                                 │                       │
│       │                                        29. 记录审计日志                  │
│       │                                                 │                       │
│       │  30. 确认操作成功                               │                       │
│       │<─────────────────────────────────────────────────                      │
│       │                                                 │                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 第五章 Token防盗策略

### 5.1 Token泄露场景分析

Token安全是认证系统的生命线。了解Token泄露的各种场景，是构建有效防盗策略的前提。Token可能在多个环节被泄露，每种场景都需要针对性的防护措施。

**网络传输环节的泄露**是最常见的风险。当用户通过HTTP（而非HTTPS）连接时，网络流量可以被中间人拦截，Token在传输过程中被窃取。公共WiFi环境尤其危险，攻击者可以使用ARP欺骗或SSL剥离等技术获取经过的流量。即使使用HTTPS，如果证书配置不当或存在漏洞，攻击者可能进行降级攻击或证书伪造。

**客户端存储的泄露**同样严重。如果Token存储在LocalStorage（容易被XSS攻击窃取）或sessionStorage（同一标签页可被访问），攻击者通过XSS漏洞可以读取这些存储。同样，如果Token被打印到控制台、被存入日志文件、或通过URL参数传递，都会增加泄露风险。

**服务端存储的泄露**虽然影响巨大，但相对可控。Redis或数据库被攻击、备份文件泄露、Log日志中的Token信息，都可能导致大量用户的Token泄露。服务端需要实施严格的密钥轮换、日志脱敏、备份加密等安全措施。

**社工攻击**是常被忽视的泄露途径。攻击者通过钓鱼网站骗取用户Token；通过钓鱼邮件诱导用户访问恶意登录页面；通过电话诈骗诱导用户透露验证码。这类攻击针对的是用户而非系统，需要通过安全教育和异常检测来防御。

**设备丢失或被盗**也是常见的Token泄露场景。用户的手机或电脑丢失，其中存储的Token被他人获取。这种情况虽然影响范围有限，但对于丢失设备的用户来说可能是灾难性的。支持远程登出和设备管理可以有效缓解这一风险。

### 5.2 IP地址绑定

IP地址绑定是一种简单而有效的防盗措施。其核心思想是：在签发Token时记录客户端IP，后续验证时检查IP是否发生变化。如果IP发生变化，可能意味着Token被窃取到了另一台设备上。

```typescript
// IP绑定实现
class IPBindingService {
  /**
   * 检查Access Token的IP绑定
   */
  async checkAccessTokenIPBinding(
    tokenPayload: TokenPayload,
    clientIP: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // 如果Token中没有记录IP（兼容旧Token），允许通过
    if (!tokenPayload.ip) {
      return { valid: true };
    }

    // 检查IP是否匹配
    if (tokenPayload.ip === clientIP) {
      return { valid: true };
    }

    // IP发生变化，触发安全检查
    return this.handleIPChange(tokenPayload.userId, tokenPayload.sid, tokenPayload.ip, clientIP);
  }

  /**
   * 处理IP地址变化
   * 判断是正常情况（用户切换网络）还是可疑行为（Token被盗）
   */
  private async handleIPChange(
    userId: string,
    sessionId: string,
    originalIP: string,
    newIP: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // 获取用户画像，判断IP变化是否正常
    const userProfile = await this.getUserProfile(userId);

    // 检查新IP是否在用户常用IP范围内
    if (userProfile.knownIPs.includes(newIP)) {
      // 已知IP，可能是用户切换了网络（家庭/公司/手机热点）
      // 更新Token中的IP记录，允许通过但记录日志
      await this.logIPChange(userId, sessionId, originalIP, newIP, "KNOWN_IP");
      return { valid: true };
    }

    // 检查IP地理位置是否合理
    const geoInfo = await this.geoIPLookup(newIP);
    const originalGeo = await this.geoIPLookup(originalIP);

    // 如果在同一个城市内变动，可能是正常的网络切换
    if (geoInfo.country === originalGeo.country && geoInfo.city === originalGeo.city) {
      await this.logIPChange(userId, sessionId, originalIP, newIP, "SAME_CITY");
      return { valid: true };
    }

    // IP发生大幅度变化（如从北京突然变成深圳），判定为可疑
    // 可以选择拒绝访问或要求额外验证
    await this.handleSuspiciousIPChange(userId, sessionId, originalIP, newIP, geoInfo);

    return {
      valid: false,
      reason: "检测到异常登录位置"
    };
  }

  /**
   * 处理可疑的IP变化
   */
  private async handleSuspiciousIPChange(
    userId: string,
    sessionId: string,
    originalIP: string,
    newIP: string,
    geoInfo: GeoInfo,
  ): Promise<void> {
    // 记录安全事件
    await this.securityLog.log({
      type: "SUSPICIOUS_IP_CHANGE",
      userId,
      sessionId,
      originalIP,
      newIP,
      geoInfo,
      timestamp: new Date(),
      severity: "HIGH",
    });

    // 可选：撤销该会话，强制用户重新登录
    // await this.authService.revokeSession(userId, sessionId, "可疑IP变化");

    // 可选：发送安全通知
    await this.notificationService.sendAlert(userId, {
      template: "suspicious_login",
      data: { originalIP, newIP, location: geoInfo.city + ", " + geoInfo.country },
    });
  }

  /**
   * IP地址归属地查询（简化实现）
   */
  private async geoIPLookup(ip: string): Promise<GeoInfo> {
    // 实际项目中应使用专业的IP地理位置库，如 MaxMind GeoIP2
    // 这里使用简化的模拟实现
    const geoCache = await this.redisService.get(`geo:${ip}`);

    if (geoCache) {
      return JSON.parse(geoCache);
    }

    // 模拟GeoIP查询结果
    const geoInfo: GeoInfo = {
      country: "中国",
      city: ip.startsWith("10.") ? "内网IP" : "北京市",
      latitude: 39.9042,
      longitude: 116.4074,
    };

    // 缓存查询结果，24小时有效
    await this.redisService.setex(`geo:${ip}`, 86400, JSON.stringify(geoInfo));

    return geoInfo;
  }
}

// GeoIP信息接口
interface GeoInfo {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}
```

IP地址绑定的局限性也需要注意：移动设备IP可能频繁变化（切换基站）；同一IP地址可能是多个用户共享（公司网络）；IPv6地址的变更更为复杂。因此，IP地址绑定应该作为一个风险信号，而不是直接拒绝访问的依据。

### 5.3 设备指纹

设备指纹是另一种身份识别技术，通过收集设备的多维度特征，生成一个相对唯一的设备标识。设备指纹可以在Token泄露时帮助识别未授权设备。

```typescript
// 设备指纹服务
class DeviceFingerprintService {
  /**
   * 生成设备指纹
   * 组合多个设备特征生成唯一标识
   */
  generateFingerprint(deviceInfo: DeviceInfo): string {
    const normalized = this.normalizeDeviceInfo(deviceInfo);
    const fingerprint = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");

    return fingerprint;
  }

  /**
   * 归一化设备信息，移除可能变化的字段
   */
  private normalizeDeviceInfo(info: DeviceInfo): NormalizedDeviceInfo {
    return {
      // 使用User Agent的解析结果，而非原始字符串
      browser: info.browser,
      browserVersion: info.browserVersion,
      os: info.os,
      osVersion: info.osVersion,
      // 屏幕分辨率（可能变化，不够可靠）
      // deviceType: info.deviceType, // 移动/桌面
      // 时区
      timezone: info.timezone,
      // 语言设置
      language: info.language,
      // 平台
      platform: info.platform,
    };
  }

  /**
   * 验证设备指纹
   */
  async validateFingerprint(
    userId: string,
    sessionId: string,
    fingerprint: string,
  ): Promise<ValidationResult> {
    const storedData = await this.redisService.get(`session:${sessionId}`);

    if (!storedData) {
      return { valid: false, reason: "SESSION_NOT_FOUND" };
    }

    const session = JSON.parse(storedData);
    const storedFingerprint = session.deviceFingerprint;

    // 精确匹配
    if (storedFingerprint === fingerprint) {
      return { valid: true };
    }

    // 指纹不匹配，检测是否可疑
    return this.handleFingerprintMismatch(userId, sessionId, storedFingerprint, fingerprint);
  }

  /**
   * 处理指纹不匹配
   */
  private async handleFingerprintMismatch(
    userId: string,
    sessionId: string,
    stored: string,
    current: string,
  ): Promise<ValidationResult> {
    // 检查历史使用的指纹
    const deviceHistory = await this.getDeviceHistory(userId);

    // 检查当前指纹是否在历史记录中
    const knownDevice = deviceHistory.find(d => d.fingerprint === current);

    if (knownDevice) {
      // 指纹在历史记录中，可能是用户更换设备
      // 记录日志，但不拒绝访问
      await this.logDeviceChange(userId, sessionId, stored, current, "KNOWN_DEVICE");
      return { valid: true, warning: "设备已变更" };
    }

    // 新的未知设备，可能存在安全风险
    await this.handleUnknownDevice(userId, sessionId, current);

    return {
      valid: false,
      reason: "设备未识别",
      requireReauth: true,
    };
  }

  /**
   * 获取用户的历史设备列表
   */
  private async getDeviceHistory(userId: string): Promise<DeviceRecord[]> {
    const key = `device:history:${userId}`;
    const data = await this.redisService.lrange(key, 0, 9);

    return data.map(d => JSON.parse(d));
  }
}

// 设备指纹收集（前端实现）
function collectDeviceFingerprint(): DeviceInfo {
  return {
    // User Agent解析
    userAgent: navigator.userAgent,
    browser: getBrowser(),
    browserVersion: getBrowserVersion(),
    os: getOS(),
    osVersion: getOSVersion(),

    // 屏幕信息
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,

    // 时区和语言
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,

    // 平台信息
    platform: navigator.platform,

    // 硬件信息（如果可用）
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,

    // 触控支持
    maxTouchPoints: navigator.maxTouchPoints,

    // Canvas指纹
    canvasFingerprint: getCanvasFingerprint(),

    // WebGL渲染器
    webglRenderer: getWebGLRenderer(),
  };
}
```

设备指纹的准确性需要注意：用户可能使用浏览器的隐私模式导致指纹不稳定；浏览器更新可能改变解析结果；隐私保护软件可能干扰指纹收集。因此，设备指纹应该作为辅助验证手段，而非主要认证依据。

### 5.4 异常检测系统

综合性的异常检测系统可以识别多种可疑行为模式，包括暴力破解、账号 takeover、异常使用习惯等。

```typescript
// 异常检测服务
class AnomalyDetectionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly securityLog: SecurityLogService,
  ) {}

  /**
   * 检测登录异常
   */
  async detectLoginAnomaly(
    userId: string,
    loginRequest: LoginRequest,
  ): Promise<AnomalyCheckResult> {
    const anomalies: Anomaly[] = [];

    // 1. 检测暴力破解：短时间内多次失败
    const failedAttempts = await this.getFailedAttempts(userId, loginRequest.ip);
    if (failedAttempts > 5) {
      anomalies.push({
        type: "BRUTE_FORCE",
        severity: "HIGH",
        message: "检测到暴力破解尝试",
        details: { failedAttempts, window: "15分钟" },
      });
    }

    // 2. 检测异常登录位置
    const locationCheck = await this.checkLoginLocation(userId, loginRequest.ip);
    if (!locationCheck.isNormal) {
      anomalies.push({
        type: "UNUSUAL_LOCATION",
        severity: locationCheck.severity,
        message: "检测到异常登录位置",
        details: locationCheck.details,
      });
    }

    // 3. 检测异常登录时间
    const timeCheck = this.checkLoginTime();
    if (!timeCheck.isNormal) {
      anomalies.push({
        type: "UNUSUAL_TIME",
        severity: "LOW",
        message: "检测到异常登录时间",
        details: timeCheck.details,
      });
    }

    // 4. 检测新设备登录
    const deviceCheck = await this.checkNewDevice(userId, loginRequest.fingerprint);
    if (!deviceCheck.isKnown) {
      anomalies.push({
        type: "NEW_DEVICE",
        severity: "MEDIUM",
        message: "检测到新设备登录",
        details: deviceCheck.details,
      });
    }

    // 5. 检测账号共享（多IP同时登录）
    const concurrentCheck = await this.checkConcurrentSessions(userId);
    if (!concurrentCheck.isNormal) {
      anomalies.push({
        type: "CONCURRENT_LOGIN",
        severity: "MEDIUM",
        message: "检测到账号多地同时使用",
        details: concurrentCheck.details,
      });
    }

    // 综合评估
    const severity = this.calculateOverallSeverity(anomalies);

    return {
      passed: severity !== "BLOCK",
      severity,
      anomalies,
      recommendedAction: this.getRecommendedAction(severity, anomalies),
    };
  }

  /**
   * 检测Token使用异常
   */
  async detectTokenUsageAnomaly(
    userId: string,
    tokenPayload: TokenPayload,
    request: Request,
  ): Promise<AnomalyCheckResult> {
    const anomalies: Anomaly[] = [];

    // 1. 检测IP变化
    if (tokenPayload.ip && tokenPayload.ip !== request.ip) {
      const geoChange = await this.checkGeoChange(tokenPayload.ip, request.ip);
      if (geoChange.isSuspicious) {
        anomalies.push({
          type: "IP_GEO_CHANGE",
          severity: geoChange.severity,
          message: "IP地理位置发生显著变化",
          details: geoChange.details,
        });
      }
    }

    // 2. 检测User Agent变化
    if (tokenPayload.ua && tokenPayload.ua !== request.headers["user-agent"]) {
      anomalies.push({
        type: "UA_CHANGE",
        severity: "LOW",
        message: "User Agent发生变化",
        details: { original: tokenPayload.ua, current: request.headers["user-agent"] },
      });
    }

    // 3. 检测请求频率异常
    const rateCheck = await this.checkRequestRate(userId);
    if (rateCheck.isAnomalous) {
      anomalies.push({
        type: "HIGH_REQUEST_RATE",
        severity: "MEDIUM",
        message: "请求频率异常",
        details: rateCheck.details,
      });
    }

    // 4. 检测敏感操作（如修改密码、转账）
    const sensitiveCheck = await this.checkSensitiveOperation(userId, request.path);
    if (sensitiveCheck.requiresConfirmation && anomalies.length > 0) {
      anomalies.push({
        type: "SENSITIVE_OP_UNDER_ANOMALY",
        severity: "HIGH",
        message: "异常状态下执行敏感操作",
        details: { operation: request.path },
      });
    }

    const severity = this.calculateOverallSeverity(anomalies);

    return {
      passed: severity !== "BLOCK",
      severity,
      anomalies,
      recommendedAction: this.getRecommendedAction(severity, anomalies),
    };
  }

  /**
   * 获取失败登录尝试次数
   */
  private async getFailedAttempts(userId: string, ip: string): Promise<number> {
    const key = `login:failed:${userId}:${ip}`;
    const count = await this.redisService.get(key);
    return parseInt(count || "0", 10);
  }

  /**
   * 检查登录位置是否正常
   */
  private async checkLoginLocation(
    userId: string,
    ip: string,
  ): Promise<{ isNormal: boolean; severity?: Severity; details?: any }> {
    const userLocations = await this.getUserKnownLocations(userId);
    const currentGeo = await this.geoIPLookup(ip);

    // 检查是否在已知位置
    const isKnown = userLocations.some(
      loc => loc.country === currentGeo.country && loc.city === currentGeo.city
    );

    if (isKnown) {
      return { isNormal: true };
    }

    // 检查是否在同一国家
    const sameCountry = userLocations.some(loc => loc.country === currentGeo.country);

    if (sameCountry) {
      return {
        isNormal: true,
        severity: "LOW",
        details: { type: "NEW_CITY", geo: currentGeo },
      };
    }

    // 跨国家登录
    return {
      isNormal: false,
      severity: "HIGH",
      details: {
        type: "CROSS_COUNTRY",
        geo: currentGeo,
        previousLocations: userLocations,
      },
    };
  }

  /**
   * 计算综合严重程度
   */
  private calculateOverallSeverity(anomalies: Anomaly[]): Severity {
    if (anomalies.some(a => a.severity === "BLOCK")) return "BLOCK";
    if (anomalies.some(a => a.severity === "HIGH")) return "HIGH";
    if (anomalies.some(a => a.severity === "MEDIUM")) return "MEDIUM";
    if (anomalies.length > 0) return "LOW";
    return "NONE";
  }

  /**
   * 获取推荐的处理动作
   */
  private getRecommendedAction(severity: Severity, anomalies: Anomaly[]): string {
    switch (severity) {
      case "BLOCK":
        return "拒绝访问，锁定账户，发送安全警报";
      case "HIGH":
        return "要求额外验证（如短信验证码），增强监控";
      case "MEDIUM":
        return "记录审计日志，发送通知给用户";
      case "LOW":
        return "仅记录日志";
      default:
        return "正常处理";
    }
  }
}

// 类型定义
type Severity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "BLOCK";

interface Anomaly {
  type: string;
  severity: Severity;
  message: string;
  details: any;
}

interface AnomalyCheckResult {
  passed: boolean;
  severity: Severity;
  anomalies: Anomaly[];
  recommendedAction: string;
}
```

### 5.5 风控实现

基于异常检测的风控系统可以自动做出响应，保障用户账户安全。

```typescript
// 风控服务
class RiskControlService {
  constructor(
    private readonly anomalyDetection: AnomalyDetectionService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 登录风控
   */
  async evaluateLoginRisk(
    userId: string,
    loginRequest: LoginRequest,
  ): Promise<RiskResponse> {
    // 执行异常检测
    const anomalyResult = await this.anomalyDetection.detectLoginAnomaly(
      userId,
      loginRequest
    );

    // 根据检测结果执行相应策略
    if (!anomalyResult.passed) {
      return this.handleBlockedLogin(userId, loginRequest, anomalyResult);
    }

    // 中等风险：要求额外验证
    if (anomalyResult.severity === "HIGH" || anomalyResult.severity === "MEDIUM") {
      return this.handleRiskyLogin(userId, loginRequest, anomalyResult);
    }

    // 低风险：正常处理，但记录日志
    if (anomalyResult.severity === "LOW") {
      await this.logRiskEvent(userId, "LOGIN_LOW_RISK", anomalyResult.anomalies);
    }

    return {
      allowed: true,
      riskLevel: anomalyResult.severity,
      require MFA: false,
    };
  }

  /**
   * 处理被阻止的登录
   */
  private async handleBlockedLogin(
    userId: string,
    loginRequest: LoginRequest,
    anomalyResult: AnomalyCheckResult,
  ): Promise<RiskResponse> {
    // 记录安全事件
    await this.securityEventService.log({
      type: "BLOCKED_LOGIN",
      userId,
      ip: loginRequest.ip,
      anomalies: anomalyResult.anomalies,
      timestamp: new Date(),
    });

    // 增加失败计数
    await this.redisService.incr(`login:failed:${userId}:${loginRequest.ip}`);

    // 账户可能被锁定（如果失败次数过多）
    const failedCount = await this.redisService.get(`login:failed:${userId}:${loginRequest.ip}`);
    if (parseInt(failedCount || "0", 10) >= 10) {
      await this.authService.lockAccount(userId, "多次登录失败");
    }

    // 发送安全警报（异步）
    this.notificationService.sendSecurityAlert(userId, {
      title: "登录被阻止",
      message: "检测到异常登录行为，您的账户登录已被阻止。请联系客服或通过备用方式验证身份。",
      ip: loginRequest.ip,
      anomalies: anomalyResult.anomalies,
    }).catch(console.error);

    return {
      allowed: false,
      riskLevel: "BLOCK",
      reason: "安全风险过高，请稍后重试或联系客服",
      require MFA: false,
    };
  }

  /**
   * 处理中等风险的登录
   */
  private async handleRiskyLogin(
    userId: string,
    loginRequest: LoginRequest,
    anomalyResult: AnomalyCheckResult,
  ): Promise<RiskResponse> {
    // 生成验证码（邮件或短信）
    const mfaCode = await this.generateMFACode(userId);

    // 发送验证码
    await this.notificationService.sendMFACode(userId, mfaCode);

    // 记录风控事件
    await this.logRiskEvent(userId, "LOGIN_MFA_REQUIRED", anomalyResult.anomalies);

    return {
      allowed: true, // 允许登录，但需要MFA验证
      riskLevel: anomalyResult.severity,
      require MFA: true,
      mfaToken: this.encryptMFAToken({
        userId,
        code: mfaCode,
        loginRequest,
        anomalies: anomalyResult.anomalies,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟有效
      }),
    };
  }

  /**
   * 生成MFA验证码
   */
  private async generateMFACode(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码（Redis，5分钟过期）
    await this.redisService.setex(
      `mfa:code:${userId}`,
      300,
      JSON.stringify({
        code,
        attempts: 0,
        createdAt: Date.now(),
      })
    );

    return code;
  }

  /**
   * 验证MFA验证码
   */
  async verifyMFACode(
    userId: string,
    code: string,
    mfaToken: string,
  ): Promise<{ success: boolean; error?: string }> {
    // 解密并验证MFA Token
    const mfaData = this.decryptMFAToken(mfaToken);

    if (mfaData.userId !== userId) {
      return { success: false, error: "无效的验证请求" };
    }

    if (mfaData.expiresAt < Date.now()) {
      return { success: false, error: "验证码已过期" };
    }

    // 获取存储的验证码
    const stored = await this.redisService.get(`mfa:code:${userId}`);

    if (!stored) {
      return { success: false, error: "请重新获取验证码" };
    }

    const mfaRecord = JSON.parse(stored);

    // 检查尝试次数
    if (mfaRecord.attempts >= 3) {
      await this.redisService.del(`mfa:code:${userId}`);
      return { success: false, error: "验证次数过多，请重新获取验证码" };
    }

    // 比对验证码
    if (mfaRecord.code !== code) {
      // 增加尝试次数
      mfaRecord.attempts++;
      await this.redisService.setex(
        `mfa:code:${userId}`,
        300,
        JSON.stringify(mfaRecord)
      );

      const remaining = 3 - mfaRecord.attempts;
      return { success: false, error: `验证码错误，剩余${remaining}次尝试` };
    }

    // 验证成功，删除验证码
    await this.redisService.del(`mfa:code:${userId}`);

    // 标记该登录请求为已验证
    await this.redisService.setex(
      `mfa:verified:${mfaData.loginRequest.fingerprint}:${userId}`,
      3600, // 1小时内同设备无需再次MFA
      "1"
    );

    return { success: true };
  }
}

// 风险响应接口
interface RiskResponse {
  allowed: boolean;
  riskLevel: Severity;
  reason?: string;
  require MFA: boolean;
  mfaToken?: string;
}
```

---

## 第六章 Token撤销实战

### 6.1 黑名单机制

Token撤销是会话管理的核心功能。当用户主动登出、修改密码、或管理员封禁账户时，需要能够使已签发的Token失效。黑名单机制是实现这一功能的常用方案。

```typescript
// Token黑名单服务
class TokenBlacklistService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 将Token加入黑名单
   * @param tokenId Token的会话ID
   * @param userId 用户ID
   * @param reason 撤销原因
   * @param expiresIn Token原本的剩余有效期
   */
  async addToBlacklist(
    tokenId: string,
    userId: string,
    reason: RevocationReason,
    expiresIn?: number,
  ): Promise<void> {
    const blacklistKey = `blacklist:token:${tokenId}`;

    const entry: BlacklistEntry = {
      userId,
      reason,
      revokedAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    };

    // 计算TTL：至少保留到Token原本的过期时间
    const ttl = expiresIn
      ? Math.max(expiresIn, 86400) // 至少1天，最多到Token过期
      : 86400 * 7; // 默认保留7天

    await this.redisService.setex(blacklistKey, ttl, JSON.stringify(entry));

    // 记录审计日志
    await this.auditLog.record({
      action: "TOKEN_BLACKLISTED",
      userId,
      tokenId,
      reason,
      timestamp: new Date(),
    });
  }

  /**
   * 检查Token是否在黑名单中
   */
  async isBlacklisted(tokenId: string): Promise<boolean> {
    const key = `blacklist:token:${tokenId}`;
    const exists = await this.redisService.exists(key);
    return exists === 1;
  }

  /**
   * 批量检查多个Token是否在黑名单
   */
  async batchCheckBlacklist(tokenIds: string[]): Promise<Map<string, boolean>> {
    if (tokenIds.length === 0) {
      return new Map();
    }

    const pipeline = this.redisService.pipeline();
    for (const tokenId of tokenIds) {
      pipeline.exists(`blacklist:token:${tokenId}`);
    }

    const results = await pipeline.exec();
    const blacklistMap = new Map<string, boolean>();

    tokenIds.forEach((tokenId, index) => {
      const exists = results?.[index]?.[1] === 1;
      blacklistMap.set(tokenId, exists);
    });

    return blacklistMap;
  }

  /**
   * 移除黑名单中的Token（很少使用）
   */
  async removeFromBlacklist(tokenId: string): Promise<void> {
    await this.redisService.del(`blacklist:token:${tokenId}`);
  }

  /**
   * 获取黑名单统计信息
   */
  async getBlacklistStats(userId?: string): Promise<BlacklistStats> {
    if (userId) {
      // 统计特定用户的黑名单Token数量
      const keys = await this.redisService.keys(`blacklist:token:*:${userId}`);
      return { total: keys.length };
    }

    // 统计全局黑名单数量
    const info = await this.redisService.info("keyspace");
    const match = info.match(/db0:keys=([0-9]+)/);
    return { total: match ? parseInt(match[1], 10) : 0 };
  }
}

// 撤销原因枚举
type RevocationReason =
  | "USER_LOGOUT"           // 用户主动登出
  | "PASSWORD_CHANGED"      // 密码已修改
  | "ACCOUNT_LOCKED"        // 账户被锁定
  | "ADMIN_REVOKE"         // 管理员撤销
  | "SUSPICIOUS_ACTIVITY"   // 可疑活动
  | "DEVICE_LOST"          // 设备丢失
  | "TOKEN_COMPROMISED";    // Token泄露

// 黑名单条目
interface BlacklistEntry {
  userId: string;
  reason: RevocationReason;
  revokedAt: number;
  expiresAt?: number;
}

// 黑名单统计
interface BlacklistStats {
  total: number;
}
```

### 6.2 Redis存储实现

Redis的高性能和原子操作使其成为Token黑名单存储的理想选择。

```typescript
// Redis Token存储实现
class RedisTokenStore {
  constructor(private readonly redis: Redis) {}

  /**
   * 存储Refresh Token
   * 使用Hash存储，便于字段级操作
   */
  async storeRefreshToken(data: {
    tokenId: string;
    tokenHash: string;
    userId: string;
    deviceInfo: DeviceInfo;
    expiresIn: number;
  }): Promise<void> {
    const key = `refresh_token:${data.tokenId}`;

    const tokenData = {
      hash: data.tokenHash,
      userId: data.userId,
      deviceInfo: JSON.stringify(data.deviceInfo),
      createdAt: Date.now().toString(),
      lastUsedAt: Date.now().toString(),
      useCount: "0",
    };

    // 使用HSET存储Hash，并设置过期时间
    const pipeline = this.redis.pipeline();
    pipeline.hset(key, tokenData);
    pipeline.expire(key, data.expiresIn);
    // 添加到用户的Token集合
    pipeline.sadd(`user_tokens:${data.userId}`, data.tokenId);

    await pipeline.exec();
  }

  /**
   * 查找Refresh Token
   */
  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    // 扫描所有Token（生产环境应使用用户ID索引）
    const userIds = await this.redis.smembers("active_users");

    for (const userId of userIds) {
      const tokenIds = await this.redis.smembers(`user_tokens:${userId}`);

      for (const tokenId of tokenIds) {
        const key = `refresh_token:${tokenId}`;
        const data = await this.redis.hgetall(key);

        if (data && data.hash === tokenHash) {
          return {
            tokenId,
            userId: data.userId,
            deviceInfo: JSON.parse(data.deviceInfo),
            createdAt: parseInt(data.createdAt, 10),
            lastUsedAt: parseInt(data.lastUsedAt, 10),
            useCount: parseInt(data.useCount, 10),
          };
        }
      }
    }

    return null;
  }

  /**
   * 更新Token使用信息（用于轮换和使用统计）
   */
  async updateTokenUsage(tokenId: string): Promise<void> {
    const key = `refresh_token:${tokenId}`;
    await this.redis.hincrby(key, "useCount", 1);
    await this.redis.hset(key, "lastUsedAt", Date.now().toString());
  }

  /**
   * 撤销Token
   */
  async revokeToken(tokenId: string, userId: string, reason: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 获取Token数据用于黑名单
    const tokenData = await this.redis.hgetall(`refresh_token:${tokenId}`);

    if (tokenData) {
      // 添加到黑名单
      pipeline.setex(
        `blacklist:${tokenId}`,
        86400 * 7, // 黑名单保留7天
        JSON.stringify({
          userId,
          reason,
          revokedAt: Date.now(),
        })
      );
    }

    // 从用户Token集合中移除
    pipeline.srem(`user_tokens:${userId}`, tokenId);
    // 删除Token数据
    pipeline.del(`refresh_token:${tokenId}`);

    await pipeline.exec();
  }

  /**
   * 撤销用户的所有Token
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    const tokenIds = await this.redis.smembers(`user_tokens:${userId}`);

    if (tokenIds.length === 0) {
      return 0;
    }

    const pipeline = this.redis.pipeline();
    const now = Date.now();

    for (const tokenId of tokenIds) {
      // 获取创建时间用于计算TTL
      const createdAt = await this.redis.hget(`refresh_token:${tokenId}`, "createdAt");

      if (createdAt) {
        const age = now - parseInt(createdAt, 10);
        const ttl = Math.max(86400 * 7 - age / 1000, 0);

        pipeline.setex(
          `blacklist:${tokenId}`,
          Math.floor(ttl),
          JSON.stringify({ userId, reason, revokedAt: now })
        );
      }

      pipeline.del(`refresh_token:${tokenId}`);
    }

    pipeline.del(`user_tokens:${userId}`);

    await pipeline.exec();

    return tokenIds.length;
  }

  /**
   * 获取用户的所有活跃Token
   */
  async getUserTokens(userId: string): Promise<UserToken[]> {
    const tokenIds = await this.redis.smembers(`user_tokens:${userId}`);
    const tokens: UserToken[] = [];

    for (const tokenId of tokenIds) {
      const key = `refresh_token:${tokenId}`;
      const data = await this.redis.hgetall(key);

      if (data) {
        tokens.push({
          tokenId,
          deviceInfo: JSON.parse(data.deviceInfo),
          createdAt: parseInt(data.createdAt, 10),
          lastUsedAt: parseInt(data.lastUsedAt, 10),
          useCount: parseInt(data.useCount, 10),
        });
      }
    }

    return tokens;
  }
}

// 类型定义
interface RefreshTokenRecord {
  tokenId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

interface UserToken {
  tokenId: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

interface DeviceInfo {
  userAgent: string;
  ip: string;
  [key: string]: any;
}
```

### 6.3 主动撤销实现

主动撤销是用户和管理员可以手动触发的Token失效操作。

```typescript
// 主动撤销服务
class TokenRevocationService {
  constructor(
    private readonly tokenStore: RedisTokenStore,
    private readonly blacklistService: TokenBlacklistService,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 用户主动登出（当前设备）
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    // 撤销当前的Refresh Token
    await this.tokenStore.revokeToken(sessionId, userId, "USER_LOGOUT");

    // 记录审计日志
    await this.auditLog.log({
      action: "USER_LOGOUT",
      userId,
      sessionId,
      timestamp: new Date(),
    });
  }

  /**
   * 用户主动登出（所有设备）
   */
  async logoutAll(userId: string, currentSessionId?: string): Promise<number> {
    // 撤销除当前设备外的所有Token
    const tokens = await this.tokenStore.getUserTokens(userId);
    let revokedCount = 0;

    for (const token of tokens) {
      if (token.tokenId !== currentSessionId) {
        await this.tokenStore.revokeToken(token.tokenId, userId, "USER_LOGOUT_ALL");
        revokedCount++;
      }
    }

    // 记录审计日志
    await this.auditLog.log({
      action: "USER_LOGOUT_ALL",
      userId,
      revokedCount,
      timestamp: new Date(),
    });

    return revokedCount;
  }

  /**
   * 修改密码后撤销所有Token
   * 安全最佳实践：用户修改密码后，所有旧Token应立即失效
   */
  async revokeAfterPasswordChange(userId: string, excludeSessionId?: string): Promise<number> {
    // 撤销用户所有Token
    const revokedCount = await this.tokenStore.revokeAllUserTokens(
      userId,
      "PASSWORD_CHANGED"
    );

    // 记录审计日志
    await this.auditLog.log({
      action: "TOKENS_REVOKED_PASSWORD_CHANGE",
      userId,
      revokedCount,
      timestamp: new Date(),
    });

    // 发送通知
    await this.notificationService.send(userId, {
      title: "密码已修改",
      message: "您的账户密码已修改，所有登录会话已被强制终止。如果这不是您本人操作，请立即联系客服。",
    });

    return revokedCount;
  }

  /**
   * 管理员撤销用户会话
   */
  async adminRevokeSession(
    adminId: string,
    targetUserId: string,
    sessionId: string,
    reason: string,
  ): Promise<void> {
    // 验证管理员权限
    const admin = await this.userService.findById(adminId);

    if (!admin || admin.role !== "admin") {
      throw new ForbiddenException("无权限执行此操作");
    }

    // 撤销Token
    await this.tokenStore.revokeToken(sessionId, targetUserId, `ADMIN_REVOKE: ${reason}`);

    // 记录审计日志
    await this.auditLog.log({
      action: "ADMIN_SESSION_REVOKE",
      adminId,
      targetUserId,
      sessionId,
      reason,
      timestamp: new Date(),
    });

    // 通知被撤销的用户
    await this.notificationService.send(targetUserId, {
      title: "账户会话被终止",
      message: `管理员已终止您的某个登录会话。原因：${reason}。如有疑问，请联系客服。`,
    });
  }

  /**
   * 管理员批量撤销用户所有会话
   */
  async adminRevokeAllUserSessions(
    adminId: string,
    targetUserId: string,
    reason: string,
  ): Promise<number> {
    // 验证管理员权限
    const admin = await this.userService.findById(adminId);

    if (!admin || admin.role !== "admin") {
      throw new ForbiddenException("无权限执行此操作");
    }

    // 撤销所有Token
    const revokedCount = await this.tokenStore.revokeAllUserTokens(
      targetUserId,
      `ADMIN_REVOKE_ALL: ${reason}`
    );

    // 记录审计日志
    await this.auditLog.log({
      action: "ADMIN_ALL_SESSIONS_REVOKE",
      adminId,
      targetUserId,
      reason,
      revokedCount,
      timestamp: new Date(),
    });

    return revokedCount;
  }

  /**
   * 用户锁定丢失的设备
   */
  async lockDevice(
    userId: string,
    deviceFingerprint: string,
    reason: "DEVICE_LOST" | "DEVICE_STOLEN",
  ): Promise<number> {
    // 查找该设备上的所有会话
    const tokens = await this.tokenStore.getUserTokens(userId);
    const deviceTokens = tokens.filter(
      t => t.deviceInfo.fingerprint === deviceFingerprint
    );

    // 撤销这些会话
    let revokedCount = 0;
    for (const token of deviceTokens) {
      await this.tokenStore.revokeToken(token.tokenId, userId, reason);
      revokedCount++;
    }

    // 记录审计日志
    await this.auditLog.log({
      action: "DEVICE_LOCKED",
      userId,
      deviceFingerprint,
      reason,
      revokedCount,
      timestamp: new Date(),
    });

    return revokedCount;
  }

  /**
   * 检查并清理过期Token
   * 应定期执行，清理无用的黑名单记录
   */
  async cleanupExpiredEntries(): Promise<number> {
    // Redis会自动处理过期，这里仅用于监控和日志
    const info = await this.redisService.info("keyspace");
    const match = info.match(/keys=([0-9]+),/);

    const keyCount = match ? parseInt(match[1], 10) : 0;

    await this.auditLog.log({
      action: "BLACKLIST_CLEANUP_CHECK",
      keyCount,
      timestamp: new Date(),
    });

    return keyCount;
  }
}
```

---

## 第七章 单点登录SSO

### 7.1 SSO概述与CAS流程

单点登录（Single Sign-On，SSO）是一种认证机制，允许用户只需登录一次，即可访问多个相互信任的系统。SSO在企业环境中尤为重要，可以极大提升用户体验，同时便于集中管理用户权限和安全策略。

**SSO的核心组件**包括：身份提供者（Identity Provider，IdP），负责用户的认证和身份管理；服务提供者（Service Provider，SP），依赖IdP进行身份验证的应用系统；用户浏览器，作为用户与IdP和SP交互的媒介。

**CAS（Central Authentication Service）**是最经典的SSO协议之一，由耶鲁大学开发。CAS的流程相对简单，适合于Web应用场景。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CAS 认证流程                                 │
│                                                                         │
│  ┌────────┐          ┌──────────────┐          ┌────────────┐           │
│  │ 用户   │          │   应用系统A   │          │   CAS服务器 │
│  └────┬───┘          └──────┬───────┘          └─────┬──────┘           │
│       │                     │                        │                   │
│       │ 1. 访问应用A         │                        │                   │
│       │────────────────────>│                        │                   │
│       │                     │                        │                   │
│       │ 2. 未登录，重定向    │                        │                   │
│       │                     │                        │                   │
│       │<────────────────────│                        │                   │
│       │                     │                        │                   │
│       │ 3. 访问CAS登录页面   │                        │                   │
│       │──────────────────────────────────────────────>│                   │
│       │                     │                        │                   │
│       │                     │     4. 显示登录表单     │                   │
│       │                     │                        │                   │
│       │ 5. 提交用户名密码    │                        │                   │
│       │──────────────────────────────────────────────>│                   │
│       │                     │                        │                   │
│       │                     │     6. 验证成功          │                   │
│       │                     │     生成TGC (Ticket Granting Cookie)       │
│       │                     │                        │                   │
│       │ 7. 重定向到应用A     │                        │                   │
│       │   ?ticket=ST-xxx    │                        │                   │
│       │<──────────────────────────────────────────────│                   │
│       │                     │                        │                   │
│       │ 8. 验证ST，获取用户信息│                        │                   │
│       │──────────────────────────────────────────────>│                   │
│       │                     │                        │                   │
│       │                     │     9. ST有效，返回用户信息│                  │
│       │                     │                        │                   │
│       │ 10. 登录成功        │                        │                   │
│       │                     │                        │                   │
│       ├─────────────────────┴────────────────────────┴───────────────────┤
│       │                        访问应用B                                 │
│       ├─────────────────────────────────────────────────────────────────┤
│       │                     │                        │                   │
│       │ 11. 访问应用B         │                        │                   │
│       │─────────────────────>│                        │                   │
│       │                     │                        │                   │
│       │ 12. 未登录，重定向    │                        │                   │
│       │ 携带TGC到CAS          │                        │                   │
│       │                     │                        │                   │
│       │<────────────────────│                        │                   │
│       │                     │                        │                   │
│       │ 13. TGC有效          │                        │                   │
│       │  生成ST，跳转到应用B  │                        │                   │
│       │───────────────────────────────────────────────>│                   │
│       │                     │                        │                   │
│       │ 14. 验证ST，登录成功  │                        │                   │
│       │<───────────────────────────────────────────────│                   │
│       │                     │                        │                   │
└─────────────────────────────────────────────────────────────────────────┘
```

CAS协议的核心是Ticket机制：TGC（Ticket Granting Cookie）是CAS服务器生成的会话Cookie，用于标识已登录用户；ST（Service Ticket）是CAS服务器签发的一次性票据，用于让应用系统验证用户身份。

### 7.2 OAuth2.0协议

OAuth2.0是目前最广泛使用的授权协议，它允许第三方应用获取用户授权，访问其在服务提供商上的资源，而无需获取用户的凭据。

**OAuth2.0的四种授权模式**：

**授权码模式（Authorization Code）**是最安全、最完整的模式，适用于有后端服务的应用。流程是：用户授权 → 服务端获取授权码 → 服务端用授权码换取Access Token。整个过程Access Token不经过浏览器，降低了泄露风险。

**隐式授权模式（Implicit）**适用于纯前端应用，流程简化：用户授权 → 直接返回Access Token。由于没有后端服务器验证，Access Token只能通过URL片段传输，安全性较低，已不推荐使用。

**密码凭证模式（Resource Owner Password Credentials）**适用于受信任的应用（如官方客户端），用户直接提供用户名密码给客户端，客户端用这些凭据换取Access Token。这种模式要求客户端完全可信，因此使用场景有限。

**客户端凭证模式（Client Credentials）**用于服务间认证，客户端以自己的名义获取Access Token，而非代表用户。

```typescript
// OAuth2.0 授权码模式实现
class OAuth2AuthorizationCodeFlow {
  private readonly AUTHORIZATION_URL = "https://auth.example.com/oauth/authorize";
  private readonly TOKEN_URL = "https://auth.example.com/oauth/token";
  private readonly CLIENT_ID = process.env.OAUTH_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
  private readonly REDIRECT_URI = "https://myapp.com/auth/callback";
  private readonly SCOPE = ["read", "write"];

  /**
   * 生成授权URL
   */
  generateAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPE.join(" "),
      state, // 用于防止CSRF攻击
    });

    return `${this.AUTHORIZATION_URL}?${params.toString()}`;
  }

  /**
   * 处理授权回调，交换授权码
   */
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    // 1. 验证state，防止CSRF攻击
    if (!this.validateState(state)) {
      throw new Error("无效的state参数");
    }

    // 2. 用授权码换取Access Token
    const tokenResponse = await this.exchangeCodeForToken(code);

    // 3. 获取用户信息
    const userInfo = await this.getUserInfo(tokenResponse.access_token);

    // 4. 创建或更新本地用户记录
    const user = await this.upsertOAuthUser({
      provider: "oauth",
      providerUserId: userInfo.id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      profile: userInfo,
    });

    return {
      user,
      accessToken: this.generateAppAccessToken(user),
      refreshToken: this.generateAppRefreshToken(user),
    };
  }

  /**
   * 交换授权码获取Token
   */
  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch(this.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(
          `${this.CLIENT_ID}:${this.CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token交换失败: ${error.error_description}`);
    }

    return response.json();
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch("https://auth.example.com/oauth/userinfo", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("获取用户信息失败");
    }

    return response.json();
  }

  /**
   * 验证state参数（简化实现）
   */
  private validateState(state: string): boolean {
    // 实际实现应从Redis或数据库验证state
    return state && state.length > 0;
  }

  /**
   * 创建或更新OAuth用户
   */
  private async upsertOAuthUser(data: OAuthUserData): Promise<User> {
    // 实现用户创建或更新逻辑
    return {} as User;
  }

  /**
   * 生成应用内部的Access Token
   */
  private generateAppAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        type: "access",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  }

  /**
   * 生成应用内部的Refresh Token
   */
  private generateAppRefreshToken(user: User): string {
    return crypto.randomBytes(64).toString("hex");
  }
}

// 类型定义
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface OAuthUserInfo {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface OAuthUserData {
  provider: string;
  providerUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: OAuthUserInfo;
}
```

### 7.3 OIDC协议

OIDC（OpenID Connect）是在OAuth2.0之上的身份层协议，提供了ID Token来验证用户身份，比纯OAuth2.0多了身份验证能力。

```typescript
// OIDC 实现
class OpenIDConnectFlow {
  private readonly AUTHORIZATION_URL = "https://auth.example.com/oidc/authorize";
  private readonly TOKEN_URL = "https://auth.example.com/oidc/token";
  private readonly USERINFO_URL = "https://auth.example.com/oidc/userinfo";
  private readonly JWKS_URL = "https://auth.example.com/oidc/.well-known/jwks.json";

  /**
   * OIDC授权请求
   * 相比OAuth2.0多了 openid scope
   */
  generateAuthorizationUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: "openid profile email", // OIDC必需的openid
      state,
      nonce, // 用于防止重放攻击
      response_mode: "query",
    });

    return `${this.AUTHORIZATION_URL}?${params.toString()}`;
  }

  /**
   * 处理OIDC回调
   */
  async handleCallback(code: string, state: string, nonce: string): Promise<{
    user: User;
    idTokenClaims: IDTokenClaims;
  }> {
    // 1. 交换Token（包含 id_token）
    const tokenResponse = await this.exchangeCodeForTokens(code);

    // 2. 验证ID Token
    const idTokenClaims = await this.verifyIDToken(tokenResponse.id_token, nonce);

    // 3. 获取用户信息（可选，用于补充ID Token中的信息）
    const userInfo = await this.getUserInfo(tokenResponse.access_token);

    // 4. 创建用户
    const user = await this.createOrUpdateUser({
      ...idTokenClaims,
      ...userInfo,
    });

    return { user, idTokenClaims };
  }

  /**
   * 验证ID Token
   */
  private async verifyIDToken(idToken: string, nonce: string): Promise<IDTokenClaims> {
    // 1. 分离JWT parts
    const [headerB64, payloadB64, signatureB64] = idToken.split(".");

    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as IDTokenClaims;

    // 2. 验证签名
    const jwks = await this.getJWKS();
    const publicKey = this.getKeyFromJWKS(jwks, header.kid);

    const isValid = this.verifySignature(
      `${headerB64}.${payloadB64}`,
      signatureB64,
      publicKey,
      header.alg
    );

    if (!isValid) {
      throw new Error("ID Token签名验证失败");
    }

    // 3. 验证标准声明
    this.validateStandardClaims(payload, nonce);

    return payload;
  }

  /**
   * 验证标准声明
   */
  private validateStandardClaims(claims: IDTokenClaims, nonce: string): void {
    const now = Math.floor(Date.now() / 1000);

    // iss：签发者必须匹配
    if (claims.iss !== "https://auth.example.com") {
      throw new Error("无效的签发者");
    }

    // aud：受众必须包含client_id
    if (!claims.aud.includes(this.CLIENT_ID)) {
      throw new Error("无效的受众");
    }

    // exp：过期时间
    if (claims.exp < now) {
      throw new Error("ID Token已过期");
    }

    // iat：签发时间（防止重放攻击）
    if (claims.iat > now + 60) { // 允许1分钟时钟偏移
      throw new Error("ID Token尚未生效");
    }

    // nonce：防止重放攻击
    if (claims.nonce !== nonce) {
      throw new Error("无效的nonce");
    }

    // at_hash：Access Token哈希（可选，用于绑定Access Token和ID Token）
    // 如果提供了access_token，应验证at_hash
  }

  /**
   * 获取JWKS
   */
  private async getJWKS(): Promise<JWKS> {
    const response = await fetch(this.JWKS_URL);
    return response.json();
  }

  /**
   * 从JWKS中获取公钥
   */
  private getKeyFromJWKS(jwks: JWKS, kid: string): string {
    const key = jwks.keys.find((k) => k.kid === kid);

    if (!key) {
      throw new Error("未找到匹配的密钥");
    }

    // 将JWK转换为 PEM 格式的公钥
    return this.jwkToPem(key);
  }

  /**
   * JWK转PEM（简化实现）
   */
  private jwkToPem(jwk: JWK): string {
    // 实际实现应使用专业的jose库
    return "";
  }

  /**
   * 验证签名
   */
  private verifySignature(
    data: string,
    signature: string,
    publicKey: string,
    algorithm: string
  ): boolean {
    // 实际实现应使用 crypto.verify
    return true;
  }
}

// OIDC ID Token声明
interface IDTokenClaims {
  iss: string;          // 签发者
  sub: string;          // 用户标识符（相当于OpenID）
  aud: string[];         // 受众（client_id）
  exp: number;          // 过期时间
  iat: number;          // 签发时间
  nonce: string;        // 随机数
  auth_time?: number;   // 认证时间
  at_hash?: string;     // Access Token哈希
  name?: string;        // 姓名
  email?: string;      // 邮箱
  picture?: string;    // 头像
}

interface JWKS {
  keys: JWK[];
}

interface JWK {
  kty: string;  // 密钥类型（RSA/EC）
  kid: string;  // 密钥ID
  use?: string; // 用途（sig/enc）
  alg?: string; // 算法
  n?: string;   // RSA模数
  e?: string;   // RSA指数
  x?: string;   // EC x坐标
  y?: string;   // EC y坐标
}
```

### 7.4 SSO实战实现

下面是SSO集成的完整实战实现，以NestJS为例：

```typescript
// SSO控制器
@Controller("auth/sso")
export class SSOAuthController {
  constructor(private readonly ssoService: SSOService) {}

  /**
   * 发起SSO登录
   */
  @Get("login")
  async ssoLogin(
    @Query("provider") provider: string,
    @Query("returnUrl") returnUrl: string,
    @Session() session: any,
  ) {
    // 生成state用于CSRF防护
    const state = crypto.randomBytes(32).toString("hex");

    // 存储state到session
    session.ssoState = state;
    session.returnUrl = returnUrl;

    // 生成授权URL
    const authUrl = await this.ssoService.getAuthorizationUrl(provider, state);

    return { authUrl };
  }

  /**
   * SSO回调处理
   */
  @Get("callback")
  async ssoCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Session() session: any,
  ) {
    // 验证state
    if (state !== session.ssoState) {
      throw new BadRequestException("无效的state参数");
    }

    // 处理SSO回调
    const result = await this.ssoService.handleCallback(code, state);

    // 清除session中的state
    delete session.ssoState;

    // 生成应用自己的Token
    const tokens = await this.authService.generateTokensForUser(result.user);

    // 返回给前端
    return {
      user: result.user,
      ...tokens,
      returnUrl: session.returnUrl || "/",
    };
  }
}

// SSO服务
@Injectable()
class SSOService {
  // 支持的SSO提供商配置
  private readonly providers = {
    google: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scopes: ["openid", "profile", "email"],
    },
    github: {
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scopes: ["read:user", "user:email"],
    },
    cas: {
      authorizationUrl: process.env.CAS_URL + "/oauth2.0/authorize",
      tokenUrl: process.env.CAS_URL + "/oauth2.0/accessToken",
      userInfoUrl: process.env.CAS_URL + "/oauth2.0/profile",
      clientId: process.env.CAS_CLIENT_ID,
      clientSecret: process.env.CAS_CLIENT_SECRET,
      scopes: [],
    },
  };

  /**
   * 获取授权URL
   */
  async getAuthorizationUrl(provider: string, state: string): Promise<string> {
    const config = this.providers[provider];

    if (!config) {
      throw new BadRequestException("不支持的SSO提供商");
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `${process.env.APP_URL}/auth/sso/callback?provider=${provider}`,
      scope: config.scopes.join(" "),
      state,
      response_type: "code",
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * 处理SSO回调
   */
  async handleCallback(code: string, state: string, provider?: string): Promise<SSOResult> {
    // 根据state中的provider确定是哪个SSO（简化实现，这里假设provider已知）
    const providerName = provider || "google";
    const config = this.providers[providerName];

    // 1. 用授权码换取Access Token
    const tokenData = await this.exchangeCodeForToken(code, config);

    // 2. 用Access Token获取用户信息
    const userInfo = await this.getUserInfo(tokenData.accessToken, config);

    // 3. 查找或创建用户
    const user = await this.findOrCreateUser({
      provider: providerName,
      providerId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.avatar,
    });

    return { user, provider: providerName };
  }

  /**
   * 交换授权码获取Token
   */
  private async exchangeCodeForToken(
    code: string,
    config: SSOProviderConfig
  ): Promise<{ accessToken: string; [key: string]: any }> {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.APP_URL}/auth/sso/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error("SSO认证失败");
    }

    return response.json();
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(accessToken: string, config: SSOProviderConfig): Promise<SSOUserInfo> {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("获取用户信息失败");
    }

    const data = await response.json();

    // 标准化不同提供商的用户信息格式
    return this.normalizeUserInfo(data, config);
  }

  /**
   * 标准化不同提供商的用户信息
   */
  private normalizeUserInfo(data: any, config: SSOProviderConfig): SSOUserInfo {
    switch (config) {
      case this.providers.google:
        return {
          id: data.sub,
          email: data.email,
          name: data.name,
          avatar: data.picture,
        };

      case this.providers.github:
        return {
          id: data.id.toString(),
          email: data.email,
          name: data.name || data.login,
          avatar: data.avatar_url,
        };

      default:
        return {
          id: data.id || data.sub,
          email: data.email,
          name: data.name || data.username,
          avatar: data.avatar || data.picture,
        };
    }
  }

  /**
   * 查找或创建SSO用户
   */
  private async findOrCreateUser(data: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<User> {
    // 查找是否已存在该SSO用户
    let user = await this.userRepository.findOne({
      where: {
        ssoProvider: data.provider,
        ssoProviderId: data.providerId,
      },
    });

    if (!user) {
      // 检查是否已有相同邮箱的本地用户
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        // 绑定SSO到已有账户
        existingUser.ssoProvider = data.provider;
        existingUser.ssoProviderId = data.providerId;
        existingUser.ssoLinkedAt = new Date();
        user = await this.userRepository.save(existingUser);
      } else {
        // 创建新用户
        user = this.userRepository.create({
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          ssoProvider: data.provider,
          ssoProviderId: data.providerId,
          ssoLinkedAt: new Date(),
        });
        user = await this.userRepository.save(user);
      }
    }

    return user;
  }
}

// SSO用户信息
interface SSOUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// SSO提供商配置
interface SSOProviderConfig {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

// SSO结果
interface SSOResult {
  user: User;
  provider: string;
}
```

---

## 第八章 安全问题与防护

### 8.1 XSS攻击防护

跨站脚本攻击（XSS）是Web应用最常见的安全威胁之一，攻击者通过在页面注入恶意脚本代码，达到窃取Cookie、Token或用户数据的目的。

```typescript
// XSS防护措施

// 1. 前端：对用户输入进行HTML转义
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// 2. 使用Content Security Policy (CSP)
// 在HTTP响应头中设置
function setSecurityHeaders(headers: Headers): void {
  // 禁止内联脚本，限制脚本来源
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://cdn.example.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // 防止 MIME 类型 sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // 启用XSS过滤器
  headers.set("X-XSS-Protection", "1; mode=block");
}

// 3. Token存储安全
// 不要将Token存储在LocalStorage（易受XSS攻击）
// 推荐使用httpOnly Cookie或内存存储

class SecureTokenStorage {
  /**
   * 使用httpOnly Cookie存储Refresh Token
   */
  static setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", token, {
      httpOnly: true,      // 禁止JavaScript访问
      secure: isProduction, // HTTPS only
      sameSite: "strict",  // 严格同站限制
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: "/auth/refresh", // 只发送到刷新端点
    });
  }

  /**
   * Access Token使用内存存储（更安全但页面刷新会丢失）
   */
  private static accessToken: string | null = null;

  static setAccessToken(token: string): void {
    SecureTokenStorage.accessToken = token;
  }

  static getAccessToken(): string | null {
    return SecureTokenStorage.accessToken;
  }

  static clearAccessToken(): void {
    SecureTokenStorage.accessToken = null;
  }
}

// 4. Vue框架的XSS防护
// main.ts
function setupXSSProtection(app: App) {
  // 全局HTML转义
  app.config.compilerOptions.isCustomElement = (tag) => {
    // 允许自定义元素
    return false;
  };

  // 使用 DOMPurify 清理HTML内容
  app.directive("sanitize", {
    mounted(el, binding) {
      if (binding.value) {
        el.innerHTML = DOMPurify.sanitize(binding.value);
      }
    },
    updated(el, binding) {
      if (binding.value !== binding.oldValue) {
        el.innerHTML = DOMPurify.sanitize(binding.value || "");
      }
    },
  });
}
```

### 8.2 CSRF攻击防护

跨站请求伪造（CSRF）攻击利用用户已登录的身份，诱导用户访问恶意页面，恶意页面自动发起对目标站点的请求。

```typescript
// CSRF防护措施

// 1. CSRF Token
class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;

  /**
   * 生成CSRF Token
   */
  static generate(state?: string): { token: string; hash: string } {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString("hex");
    const hash = crypto.createHash("sha256").update(token).toString("hex");

    return { token, hash };
  }

  /**
   * 验证CSRF Token
   */
  static validate(token: string, hash: string): boolean {
    const expectedHash = crypto.createHash("sha256").update(token).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  }
}

// 2. SameSite Cookie
function setCSRFCookie(res: Response, token: string): void {
  res.cookie("csrf_token", token, {
    httpOnly: false, // 需要JavaScript访问
    secure: true,
    sameSite: "strict", // 完全禁止跨站请求携带
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  });
}

// 3. 自定义请求头验证
// 大多数跨站请求无法设置自定义头
class HeaderCSRFValidator {
  static readonly REQUIRED_HEADER = "X-Requested-With";
  static readonly EXPECTED_VALUE = "XMLHttpRequest";

  static validate(headers: Headers): boolean {
    const value = headers.get(this.REQUIRED_HEADER);
    return value === this.EXPECTED_VALUE;
  }
}

// 4. Origin/Referer验证
class OriginValidator {
  static validate(request: Request): boolean {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const allowedOrigin = process.env.ALLOWED_ORIGIN;

    // 至少要有一个来源头
    if (!origin && !referer) {
      return false;
    }

    // 验证origin
    if (origin && new URL(origin).origin !== allowedOrigin) {
      return false;
    }

    // 验证referer
    if (referer && new URL(referer).origin !== allowedOrigin) {
      return false;
    }

    return true;
  }
}

// 5. NestJS CSRF守卫
@Injectable()
export class CSRFFGuard implements CanActivate {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 只对修改操作启用CSRF保护
    if (this.isReadOnlyRequest()) {
      return true;
    }

    // 验证SameSite Cookie
    const csrfToken = this.request.cookies?.csrf_token;
    if (!csrfToken) {
      throw new ForbiddenException("CSRF Token缺失");
    }

    // 验证自定义请求头
    if (!HeaderCSRFValidator.validate(this.request.headers)) {
      throw new ForbiddenException("无效的请求头");
    }

    // 验证Origin
    if (!OriginValidator.validate(this.request)) {
      throw new ForbiddenException("无效的请求来源");
    }

    return true;
  }

  private isReadOnlyRequest(): boolean {
    const method = this.request.method?.toUpperCase();
    return method === "GET" || method === "HEAD" || method === "OPTIONS";
  }
}
```

### 8.3 重放攻击防护

重放攻击是攻击者截获正常的认证请求（如登录请求），然后重新发送该请求以达到认证目的。

```typescript
// 重放攻击防护

// 1. 一次性随机数（Nonce）
class NonceService {
  private readonly redis: Redis;
  private readonly NONCE_TTL = 5 * 60; // 5分钟

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * 生成并存储一次性随机数
   */
  async generateNonce(): Promise<string> {
    const nonce = crypto.randomBytes(16).toString("hex");

    // 存储到Redis，设置过期时间
    await this.redis.setex(`nonce:${nonce}`, this.NONCE_TTL, "1");

    return nonce;
  }

  /**
   * 验证并消耗随机数
   * 如果随机数不存在或已被使用，返回false
   */
  async consumeNonce(nonce: string): Promise<boolean> {
    const key = `nonce:${nonce}`;

    // 使用DEL命令，原子性地检查并删除
    const deleted = await this.redis.del(key);

    // 如果deleted为1，说明nonce存在且未被使用过
    // 如果deleted为0，说明nonce不存在或已被使用
    return deleted === 1;
  }
}

// 2. 时间戳验证
class TimestampValidator {
  private static readonly MAX_AGE = 5 * 60 * 1000; // 5分钟

  /**
   * 验证请求时间戳
   */
  static validate(timestamp: number): boolean {
    const now = Date.now();
    const age = Math.abs(now - timestamp);

    // 请求时间不能超过5分钟
    return age <= this.MAX_AGE;
  }
}

// 3. 请求签名
class RequestSignature {
  private static readonly SECRET = process.env.SIGNATURE_SECRET!;

  /**
   * 生成请求签名
   */
  static generate(request: {
    method: string;
    path: string;
    timestamp: number;
    body?: any;
    nonce: string;
  }): string {
    const data = JSON.stringify({
      method: request.method,
      path: request.path,
      timestamp: request.timestamp,
      nonce: request.nonce,
      bodyHash: request.body
        ? crypto.createHash("sha256").update(JSON.stringify(request.body)).digest("hex")
        : "",
    });

    return crypto
      .createHmac("sha256", this.SECRET)
      .update(data)
      .digest("hex");
  }

  /**
   * 验证请求签名
   */
  static verify(
    request: {
      method: string;
      path: string;
      timestamp: number;
      body?: any;
      nonce: string;
    },
    signature: string
  ): boolean {
    // 验证时间戳
    if (!TimestampValidator.validate(request.timestamp)) {
      return false;
    }

    // 计算期望的签名
    const expectedSignature = this.generate(request);

    // 使用 timingSafeEqual 比较，防止时序攻击
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}

// 4. 综合防护中间件
@Injectable()
export class ReplayAttackGuard implements CanActivate {
  constructor(
    private readonly nonceService: NonceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 提取签名参数
    const timestamp = parseInt(request.headers["x-timestamp"], 10);
    const nonce = request.headers["x-nonce"];
    const signature = request.headers["x-signature"];

    // 所有参数都是必需的
    if (!timestamp || !nonce || !signature) {
      throw new ForbiddenException("缺少安全验证参数");
    }

    // 验证时间戳
    if (!TimestampValidator.validate(timestamp)) {
      throw new ForbiddenException("请求已过期");
    }

    // 验证签名
    const isValidSignature = RequestSignature.verify(
      {
        method: request.method,
        path: request.path,
        timestamp,
        body: request.body,
        nonce,
      },
      signature
    );

    if (!isValidSignature) {
      throw new ForbiddenException("无效的签名");
    }

    // 验证并消耗Nonce
    const isValidNonce = await this.nonceService.consumeNonce(nonce);

    if (!isValidNonce) {
      throw new ForbiddenException("请求已被使用");
    }

    return true;
  }
}
```

### 8.4 综合安全防护实现

将所有安全措施整合到一个完整的安全模块中：

```typescript
// security.module.ts
import { Module, Global } from "@nestjs/common";
import { SecurityService } from "./security.service";
import { TokenBlacklistService } from "./token-blacklist.service";
import { AnomalyDetectionService } from "./anomaly-detection.service";
import { RiskControlService } from "./risk-control.service";
import { RedisModule } from "../redis/redis.module";

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    SecurityService,
    TokenBlacklistService,
    AnomalyDetectionService,
    RiskControlService,
  ],
  exports: [
    SecurityService,
    TokenBlacklistService,
    AnomalyDetectionService,
    RiskControlService,
  ],
})
export class SecurityModule {}

// security.service.ts
@Injectable()
export class SecurityService {
  constructor(
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly anomalyDetection: AnomalyDetectionService,
    private readonly riskControl: RiskControlService,
  ) {}

  /**
   * 完整的登录安全检查
   */
  async performLoginSecurityCheck(
    userId: string,
    loginData: LoginSecurityData
  ): Promise<SecurityCheckResult> {
    // 1. 异常检测
    const anomalyResult = await this.anomalyDetection.detectLoginAnomaly(
      userId,
      loginData
    );

    // 2. 风控评估
    const riskResult = await this.riskControl.evaluateLoginRisk(
      userId,
      loginData
    );

    // 3. 综合判断
    return {
      allowed: riskResult.allowed && anomalyResult.passed,
      riskLevel: this.getHighestRiskLevel(riskResult.severity, anomalyResult.severity),
      requireMFA: riskResult.require MFA,
      anomalies: anomalyResult.anomalies,
      recommendedAction: riskResult.recommendedAction,
    };
  }

  /**
   * Token验证 + 黑名单检查
   */
  async validateTokenWithBlacklistCheck(tokenPayload: TokenPayload): Promise<boolean> {
    // 检查黑名单
    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(tokenPayload.sid);

    if (isBlacklisted) {
      return false;
    }

    // 检查异常使用模式
    const anomalyResult = await this.anomalyDetection.detectTokenUsageAnomaly(
      tokenPayload.sub,
      tokenPayload,
      // 传入当前请求信息
    );

    // 严重异常时拒绝访问
    if (anomalyResult.severity === "BLOCK") {
      return false;
    }

    return true;
  }

  /**
   * 获取最高风险等级
   */
  private getHighestRiskLevel(...levels: Severity[]): Severity {
    const order: Severity[] = ["NONE", "LOW", "MEDIUM", "HIGH", "BLOCK"];
    const maxIndex = Math.max(...levels.map(l => order.indexOf(l)));
    return order[maxIndex];
  }
}

// 安全检查结果
interface SecurityCheckResult {
  allowed: boolean;
  riskLevel: Severity;
  requireMFA: boolean;
  anomalies: Anomaly[];
  recommendedAction: string;
}

interface LoginSecurityData {
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  timestamp: number;
}
```

---

## 第九章 实战案例：NestJS+Redis完整双Token实现

### 9.1 项目结构

下面是完整的双Token认证系统项目结构：

```
src/
├── auth/
│   ├── auth.module.ts           # 认证模块
│   ├── auth.controller.ts       # 认证控制器
│   ├── auth.service.ts          # 认证服务
│   ├── dto/
│   │   ├── login.dto.ts         # 登录参数
│   │   ├── refresh-token.dto.ts # 刷新Token参数
│   │   └── register.dto.ts      # 注册参数
│   ├── guards/
│   │   ├── access-token.guard.ts    # Access Token守卫
│   │   ├── refresh-token.guard.ts   # Refresh Token守卫
│   │   ├── roles.guard.ts           # 角色守卫
│   │   └── csrf.guard.ts            # CSRF守卫
│   ├── strategies/
│   │   ├── jwt.strategy.ts      # JWT策略
│   │   └── local.strategy.ts    # 本地认证策略
│   └── decorators/
│       ├── current-user.decorator.ts  # 当前用户装饰器
│       ├── public.decorator.ts        # 公开端点装饰器
│       └── roles.decorator.ts         # 角色装饰器
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   └── user.entity.ts
├── token/
│   ├── token.module.ts
│   ├── token.service.ts         # Token生成和验证
│   ├── token-store.interface.ts # Token存储接口
│   └── redis-token-store.ts     # Redis存储实现
├── security/
│   ├── security.module.ts
│   ├── security.service.ts      # 综合安全服务
│   ├── token-blacklist.service.ts
│   ├── anomaly-detection.service.ts
│   └── risk-control.service.ts
└── redis/
    ├── redis.module.ts
    └── redis.service.ts
```

### 9.2 核心模块实现

```typescript
// auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import { RolesGuard } from "./guards/roles.guard";
import { CSRFGuard } from "./guards/csrf.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UserModule } from "../user/user.module";
import { TokenModule } from "../token/token.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
      signOptions: {
        algorithm: "RS256",
        expiresIn: "15m",
        issuer: "api.example.com",
      },
    }),
    UserModule,
    TokenModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    RefreshTokenGuard,
    RolesGuard,
    CSRFGuard,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AccessTokenGuard,
    RefreshTokenGuard,
    SecurityModule,
  ],
})
export class AuthModule {}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly tokenStore: TokenStore,
    private readonly securityService: SecurityService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto, deviceInfo: DeviceInfo): Promise<AuthTokens> {
    // 1. 验证用户凭据
    const user = await this.userService.validateByEmail(
      loginDto.email,
      loginDto.password
    );

    if (!user) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    // 2. 安全检查
    const securityCheck = await this.securityService.performLoginSecurityCheck(
      user.id,
      { ...deviceInfo, timestamp: Date.now() }
    );

    if (!securityCheck.allowed) {
      throw new ForbiddenException("登录被安全策略阻止，请稍后重试");
    }

    if (securityCheck.requireMFA) {
      // 返回MFA验证请求
      return {
        requireMFA: true,
        mfaToken: securityCheck.mfaToken!,
      };
    }

    // 3. 生成双Token
    const tokens = await this.generateTokenPair(user, deviceInfo);

    // 4. 记录登录历史
    await this.recordLoginHistory(user.id, deviceInfo, tokens.sessionId);

    return tokens;
  }

  /**
   * 注册新用户
   */
  async register(registerDto: RegisterDto, deviceInfo: DeviceInfo): Promise<AuthTokens> {
    // 1. 检查邮箱是否已存在
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("该邮箱已被注册");
    }

    // 2. 创建用户
    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
    });

    // 3. 生成Token
    const tokens = await this.generateTokenPair(user, deviceInfo);

    return tokens;
  }

  /**
   * 刷新Access Token
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    // 1. 验证Refresh Token
    const tokenData = await this.tokenStore.validateRefreshToken(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException("Refresh Token无效或已过期");
    }

    // 2. 获取用户
    const user = await this.userService.findById(tokenData.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("用户不存在或已被禁用");
    }

    // 3. 生成新的Access Token
    const accessToken = await this.tokenService.generateAccessToken(user, tokenData.sessionId);

    // 4. 检查是否需要轮换Refresh Token
    let newRefreshToken: string | undefined;

    if (await this.shouldRotateRefreshToken(tokenData)) {
      const rotated = await this.tokenStore.rotateRefreshToken(tokenData);
      newRefreshToken = rotated.newRefreshToken;
    } else {
      // 更新最后使用时间
      await this.tokenStore.updateLastUsed(tokenData.sessionId);
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60, // 15分钟
      tokenType: "Bearer",
    };
  }

  /**
   * 登出
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    await this.tokenStore.revokeToken(sessionId, userId, "USER_LOGOUT");
  }

  /**
   * 登出所有设备
   */
  async logoutAll(userId: string): Promise<number> {
    return this.tokenStore.revokeAllUserTokens(userId, "USER_LOGOUT_ALL");
  }

  /**
   * 生成双Token
   */
  private async generateTokenPair(user: User, deviceInfo: DeviceInfo): Promise<AuthTokens> {
    const sessionId = crypto.randomUUID();

    // 生成Access Token
    const accessToken = await this.tokenService.generateAccessToken(user, sessionId);

    // 生成Refresh Token
    const refreshToken = await this.tokenService.generateRefreshToken();

    // 存储Refresh Token
    await this.tokenStore.storeRefreshToken({
      sessionId,
      refreshToken,
      userId: user.id,
      deviceInfo,
      expiresIn: 7 * 24 * 60 * 60, // 7天
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      tokenType: "Bearer",
      sessionId,
    };
  }

  /**
   * 检查是否需要轮换Refresh Token
   */
  private async shouldRotateRefreshToken(tokenData: RefreshTokenData): Promise<boolean> {
    const lastUsed = tokenData.lastUsedAt || tokenData.createdAt;
    const hoursSinceUse = (Date.now() - lastUsed) / (1000 * 60 * 60);

    // 超过24小时或使用超过100次
    return hoursSinceUse > 24 || (tokenData.useCount || 0) > 100;
  }

  /**
   * 记录登录历史
   */
  private async recordLoginHistory(
    userId: string,
    deviceInfo: DeviceInfo,
    sessionId: string
  ): Promise<void> {
    await this.redisService.lpush(`login:history:${userId}`, JSON.stringify({
      sessionId,
      deviceInfo,
      loginAt: new Date().toISOString(),
    }));
    await this.redisService.ltrim(`login:history:${userId}`, 0, 9);
  }
}

// Token存储接口
interface TokenStore {
  storeRefreshToken(data: StoreRefreshTokenData): Promise<void>;
  validateRefreshToken(token: string): Promise<RefreshTokenData | null>;
  rotateRefreshToken(tokenData: RefreshTokenData): Promise<{ newRefreshToken: string }>;
  revokeToken(sessionId: string, userId: string, reason: string): Promise<void>;
  revokeAllUserTokens(userId: string, reason: string): Promise<number>;
  updateLastUsed(sessionId: string): Promise<void>;
}

// 类型定义
interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  sessionId?: string;
  requireMFA?: boolean;
  mfaToken?: string;
}

interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

interface StoreRefreshTokenData {
  sessionId: string;
  refreshToken: string;
  userId: string;
  deviceInfo: DeviceInfo;
  expiresIn: number;
}

interface RefreshTokenData {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

interface DeviceInfo {
  userAgent: string;
  ip: string;
  [key: string]: any;
}
```

### 9.3 控制器实现

```typescript
// auth.controller.ts
@Controller("auth")
@ApiTags("认证")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   */
  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const result = await this.authService.login(loginDto, deviceInfo);

    // Refresh Token通过httpOnly Cookie设置
    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
        requireMFA: result.requireMFA,
      },
    };
  }

  /**
   * 用户注册
   */
  @Post("register")
  @Public()
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const result = await this.authService.register(registerDto, deviceInfo);

    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
      },
    };
  }

  /**
   * 刷新Access Token
   */
  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.headers["x-refresh-token"];

    if (!refreshToken) {
      throw new BadRequestException("未提供Refresh Token");
    }

    const result = await this.authService.refreshToken(refreshToken);

    // 如果轮换了Refresh Token，更新Cookie
    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
      },
    };
  }

  /**
   * 登出
   */
  @Post("logout")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId, user.sessionId);

    // 清除Refresh Token Cookie
    res.clearCookie("refresh_token");

    return {
      success: true,
      message: "登出成功",
    };
  }

  /**
   * 登出所有设备
   */
  @Post("logout-all")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) res: Response,
  ) {
    const revokedCount = await this.authService.logoutAll(user.userId);

    res.clearCookie("refresh_token");

    return {
      success: true,
      message: `已登出所有设备，共${revokedCount}个会话`,
    };
  }

  /**
   * 获取当前用户信息
   */
  @Get("me")
  @UseGuards(AccessTokenGuard)
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    const userData = await this.userService.findById(user.userId);

    return {
      success: true,
      data: userData,
    };
  }

  /**
   * 获取登录设备列表
   */
  @Get("sessions")
  @UseGuards(AccessTokenGuard)
  async getSessions(@CurrentUser() user: CurrentUserData) {
    const sessions = await this.tokenStore.getUserTokens(user.userId);

    return {
      success: true,
      data: sessions.map(s => ({
        sessionId: s.sessionId,
        deviceInfo: s.deviceInfo,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        isCurrent: s.sessionId === user.sessionId,
      })),
    };
  }

  /**
   * 撤销特定会话
   */
  @Delete("sessions/:sessionId")
  @UseGuards(AccessTokenGuard)
  async revokeSession(
    @CurrentUser() user: CurrentUserData,
    @Param("sessionId") sessionId: string,
  ) {
    await this.authService.logout(user.userId, sessionId);

    return {
      success: true,
      message: "会话已撤销",
    };
  }

  /**
   * 提取设备信息
   */
  private extractDeviceInfo(req: Request): DeviceInfo {
    return {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
        || (req as any).ip
        || "unknown",
      timestamp: Date.now(),
    };
  }

  /**
   * 设置Refresh Token Cookie
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: "/auth/refresh", // 只发送到刷新端点
    });
  }
}

// DTO定义
class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name!: string;
}
```

### 9.4 前端Vue+Axios拦截实现

```typescript
// src/api/auth.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // 允许携带Cookie
});

// Token刷新状态
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 添加刷新订阅者
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * 通知所有订阅者Token已刷新
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * 请求拦截器：添加Access Token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();

    // 如果有Access Token且不是刷新请求，添加到请求头
    if (authStore.accessToken && !isRefreshRequest(config)) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    // 添加CSRF Token（如果需要）
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 响应拦截器：处理Token过期
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 判断是否是401错误且不是刷新请求
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest(originalRequest)) {
      if (isRefreshing) {
        // 正在刷新，将请求加入队列
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 尝试刷新Token
        const newToken = await refreshAccessToken();

        // 刷新成功，更新所有请求的Token
        const authStore = useAuthStore();
        authStore.setAccessToken(newToken);

        onTokenRefreshed(newToken);

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        const authStore = useAuthStore();
        authStore.clearAll();

        const router = useRouter();
        router.push("/login");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 其他错误，直接抛出
    return Promise.reject(error);
  }
);

/**
 * 判断是否是刷新请求
 */
function isRefreshRequest(config: InternalAxiosRequestConfig): boolean {
  return config.url?.includes("/auth/refresh") || false;
}

/**
 * 调用刷新接口
 */
async function refreshAccessToken(): Promise<string> {
  // Refresh Token通过httpOnly Cookie自动发送
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );

  return response.data.data.accessToken;
}

/**
 * 获取CSRF Token
 */
function getCSRFToken(): string | null {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute("content") || null;
}

export default api;

// src/stores/auth.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api/auth";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Session {
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
  };
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  // State
  const accessToken = ref<string | null>(null);
  const user = ref<User | null>(null);
  const isLoading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const userRole = computed(() => user.value?.role);

  // Actions
  function setAccessToken(token: string): void {
    accessToken.value = token;
  }

  function setUser(userData: User): void {
    user.value = userData;
  }

  function clearAll(): void {
    accessToken.value = null;
    user.value = null;
  }

  /**
   * 登录
   */
  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true;

    try {
      const response = await api.post("/auth/login", { email, password });

      const { accessToken: token, requireMFA, mfaToken } = response.data.data;

      if (requireMFA) {
        // 返回MFA验证请求
        return { requireMFA: true, mfaToken };
      }

      accessToken.value = token;
      await fetchCurrentUser();
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 注册
   */
  async function register(email: string, password: string, name: string): Promise<void> {
    isLoading.value = true;

    try {
      const response = await api.post("/auth/register", { email, password, name });
      accessToken.value = response.data.data.accessToken;
      await fetchCurrentUser();
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAll();
    }
  }

  /**
   * 登出所有设备
   */
  async function logoutAll(): Promise<void> {
    await api.post("/auth/logout-all");
    clearAll();
  }

  /**
   * 获取当前用户信息
   */
  async function fetchCurrentUser(): Promise<void> {
    try {
      const response = await api.get("/auth/me");
      user.value = response.data.data;
    } catch {
      clearAll();
    }
  }

  /**
   * 获取会话列表
   */
  async function fetchSessions(): Promise<Session[]> {
    const response = await api.get("/auth/sessions");
    return response.data.data;
  }

  /**
   * 撤销特定会话
   */
  async function revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  }

  /**
   * 检查权限
   */
  function hasPermission(permission: string): boolean {
    // 实际实现应根据用户权限列表检查
    return true;
  }

  function hasRole(role: string): boolean {
    return user.value?.role === role;
  }

  return {
    // State
    accessToken,
    user,
    isLoading,
    // Getters
    isAuthenticated,
    userRole,
    // Actions
    setAccessToken,
    setUser,
    clearAll,
    login,
    register,
    logout,
    logoutAll,
    fetchCurrentUser,
    fetchSessions,
    revokeSession,
    hasPermission,
    hasRole,
  };
});
```

---

## 第十章 我的思考：认证是系统安全的第一道门

### 10.1 认证系统的重要性

认证系统是整个应用安全体系的第一道防线，它的重要性再怎么强调都不为过。一旦认证系统被攻破，攻击者可以获得合法用户身份，随后的所有操作都将以该用户的名义进行，系统中的所有安全措施都将失去作用。

在设计认证系统时，必须始终保持"纵深防御"的理念。每一个安全措施都可能被绕过，因此需要多层防护：密码强度要求、登录失败限制、异常检测、Token短期化、Session管理等。这些措施单独看来可能都不完美，但组合在一起就能形成强大的防护体系。

### 10.2 安全与用户体验的平衡

安全措施和用户体验之间始终存在张力。过于严格的安全策略会导致用户操作繁琐，最终用户可能会寻找绕过的方式（如使用简单密码、关闭MFA等），反而降低整体安全性。

最佳的安全策略是在保障安全的前提下，尽可能减少对用户的干扰。双Token认证体系正是这一理念的体现：Access Token短期有效保障安全，同时通过Refresh Token机制实现对用户的无感知刷新；风险控制系统能够识别异常行为，在可疑情况下要求额外验证，而正常情况下用户可以无感知地使用系统。

### 10.3 持续监控与响应

认证安全不是一次性工作，而是需要持续监控和快速响应。系统应该具备以下能力：实时监控登录异常并触发告警；记录详细的审计日志用于事后分析；能够快速响应安全事件（如批量撤销Token）；定期评估和改进安全策略。

### 10.4 未来发展趋势

认证技术仍在不断演进。零知识证明（ZKP）可能在不暴露密码的情况下完成身份验证；WebAuthn标准正在推动去中心化的身份认证；连续认证通过行为分析实现更智能的风险识别。作为开发者，需要持续关注这些发展趋势，适时将新技术引入到系统中。

---

## 附录：常见问题解答

### Q1: Access Token和Refresh Token应该分别设置多长？

Access Token推荐15分钟到1小时，Refresh Token推荐7天到30天。15分钟是经过实践验证的平衡点，既能保障安全，又不会过于频繁地打扰用户。

### Q2: Refresh Token应该存储在哪里？

推荐使用httpOnly Cookie存储Refresh Token，这样JavaScript无法访问，有效防止XSS攻击窃取Token。同时要配合SameSite=Strict属性，防止CSRF攻击。

### Q3: 双Token和单Token相比，有什么缺点？

主要缺点是实现复杂度增加，需要维护两个Token的生命周期；服务端需要额外存储Refresh Token；用户登出需要处理两个Token的清理。但这些复杂度换来的是显著提升的安全性，值得付出。

### Q4: 如何处理Token刷新时的并发请求？

当Access Token过期时，可能有多个请求同时触发刷新。本文的实现使用了"刷新锁"机制：第一个请求发起刷新，后续请求加入队列等待刷新完成后使用新Token。

### Q5: OAuth2.0和OIDC有什么区别？

OAuth2.0是授权协议，用于获取访问资源的权限；OIDC是身份协议，基于OAuth2.0提供了用户的身份信息。简单说，OAuth2.0回答的是"你能访问什么资源"，OIDC回答的是"你是谁"。

---

## 总结

双Token认证是现代Web应用最主流的认证方案，它通过将认证拆分为短期的Access Token和长期的Refresh Token，实现了安全性与用户体验的完美平衡。

本文详细讲解了双Token的原理、实现、安全防护和最佳实践。从JWT结构到Refresh Token存储，从Token防盗到SSO单点登录，从XSS/CSRF防护到完整的NestJS+Vue实战案例，希望能帮助读者全面掌握这一关键技术。

认证系统是应用安全的基础，值得投入足够的时间和精力去设计和实现。一个设计良好的认证系统，不仅能保护用户数据，也能赢得用户的信任。

---

*文档版本：1.0.0*
*更新时间：2024年*
*字数统计：约18000字*
