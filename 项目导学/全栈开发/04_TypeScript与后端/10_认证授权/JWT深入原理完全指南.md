# JWT 深入原理完全指南

## 概述

本文档从底层原理层面深度剖析JSON Web Token（JWT），涵盖其内部结构、签名算法、安全机制、攻防实践等核心知识点。通过大量的代码示例和原理分析，帮助读者全面理解JWT的工作机制，为安全实现认证授权系统奠定坚实基础。

**核心要点：**

- JWT的三个组成部分（Header、Payload、Signature）及其编码原理
- 不同签名算法（HMAC、RSA、ECDSA）的底层实现和适用场景
- Payload设计的最佳实践和常见错误
- 安全威胁的攻防博弈（算法 NONE 攻击、签名伪造等）
- Access Token与Refresh Token的刷新策略
- 黑名单机制与主动撤销方案
- 无状态认证的分布式实现
- 常见攻击向量（CSRF、XSS、重放攻击）的防御措施
- 与Session认证的深度对比与选型建议

---

## 一、JWT结构详解

### 1.1 JWT的基本组成

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全传输信息的紧凑、URL安全的方式。它由三部分组成，用点号（`.`）分隔：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

上述Token分解后为：

```
Header.Payload.Signature
```

让我们逐一分析每个部分。

### 1.2 Header（头部）

Header是JWT的第一部分，是一个经过Base64URL编码的JSON对象，包含两个主要字段：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**字段说明：**

| 字段 | 含义 | 说明 |
|------|------|------|
| `alg` | 算法 | 指定签名算法，如HS256、RS256、ES256 |
| `typ` | 类型 | JWT的MIME媒体类型，固定为`JWT` |

**其他可能的Header字段：**

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-123",      // 密钥ID，用于多密钥场景
  "cty": "JWT",              // 内容类型
  "x5t": "thumbprint"        // X.509证书指纹
}
```

**为什么Header需要包含算法信息？**

这实际上是JWT设计的一个争议点。Header中声明的算法可以被伪造，这意味着攻击者可能将算法替换为`none`，从而绕过签名验证。但这个问题我们会在后续的"安全考量"章节详细讨论。

**Base64URL编码原理：**

```typescript
// src/utils/base64url.ts

/**
 * Base64URL编码
 * JWT使用Base64URL编码，与标准Base64有以下区别：
 * 1. '+' 替换为 '-'
 * 2. '/' 替换为 '_'
 * 3. 移除尾部 '=' 填充
 */
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64');

  // 替换特殊字符
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // 移除尾部填充
}

/**
 * Base64URL解码
 */
function base64UrlDecode(str: string): string {
  // 添加尾部填充
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // 计算需要添加的填充数量
  const padding = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padding);

  return Buffer.from(base64, 'base64').toString('utf8');
}

// 完整实现
export function base64url() {
  return {
    encode: base64UrlEncode,
    decode: base64UrlDecode,
  };
}
```

**实战：手动解析JWT Header**

```typescript
// src/examples/jwt-structure.ts

/**
 * 手动解析JWT Header
 */
function parseJwtHeader(token: string): object {
  // 按点号分割，取第一部分
  const [headerBase64] = token.split('.');

  // Base64URL解码
  const headerJson = Buffer.from(headerBase64, 'base64')
    .toString('utf8');

  // 解析JSON
  return JSON.parse(headerJson);
}

// 示例
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const header = parseJwtHeader(token);
console.log('Header:', header);
// 输出: { alg: 'HS256', typ: 'JWT' }
```

### 1.3 Payload（载荷）

Payload是JWT的第二部分，是一个经过Base64URL编码的JSON对象，包含了需要传递的声明（Claims）。

**JWT声明的三种类型：**

1. **注册声明（Registered Claims）**：预定义的声明，非强制但推荐使用
2. **公开声明（Public Claims）**：自定义声明，需要在IANA JSON Web Token Registry注册
3. **私有声明（Private Claims）**：自定义声明，仅在特定上下文中使用

**标准注册声明详解：**

| 声明 | 全称 | 说明 |
|------|------|------|
| `iss` | Issuer | 签发者，标识谁创建了这个Token |
| `sub` | Subject | 主题，标识Token所代表的主体（用户ID） |
| `aud` | Audience | 受众，标识Token的预期接收者 |
| `exp` | Expiration Time | 过期时间，Unix时间戳 |
| `nbf` | Not Before | 生效时间，在此之前Token无效 |
| `iat` | Issued At | 签发时间，Token创建的时间 |
| `jti` | JWT ID | 唯一标识，用于防重放 |

**Payload设计示例：**

```json
{
  "sub": "1234567890",           // 用户ID
  "name": "张三",                 // 用户姓名
  "role": "admin",               // 用户角色
  "iss": "api.example.com",      // 签发者
  "aud": "app.example.com",      // 受众
  "exp": 1516246222,             // 过期时间（1小时后）
  "nbf": 1516242622,             // 生效时间（现在）
  "iat": 1516242622,             // 签发时间
  "jti": "unique-token-id-123"   // Token唯一ID
}
```

**实战：解析JWT Payload**

```typescript
// src/examples/jwt-payload.ts

/**
 * 解析JWT Payload
 */
function parseJwtPayload(token: string): object {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payloadBase64 = parts[1];
  const payloadJson = Buffer.from(payloadBase64, 'base64')
    .toString('utf8');

  return JSON.parse(payloadJson);
}

/**
 * 解析JWT并验证过期时间
 */
function parseJwtWithValidation(token: string): {
  header: object;
  payload: object;
  isExpired: boolean;
  expiresIn: number;
} {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const header = JSON.parse(
    Buffer.from(parts[0], 'base64').toString('utf8')
  );

  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64').toString('utf8')
  );

  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp ? payload.exp < now : false;
  const expiresIn = payload.exp ? payload.exp - now : 0;

  return { header, payload, isExpired, expiresIn };
}

// 示例
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const { header, payload, isExpired, expiresIn } = parseJwtWithValidation(token);

console.log('Header:', header);
console.log('Payload:', payload);
console.log('Is Expired:', isExpired);
console.log('Expires In (seconds):', expiresIn);
```

### 1.4 Signature（签名）

Signature是JWT的第三部分，用于验证消息的完整性和 authenticity（真实性）。

**签名的生成过程：**

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**签名原理深度解析：**

```typescript
// src/examples/signature-creation.ts

import crypto from 'crypto';

/**
 * 创建JWT签名
 *
 * 签名过程：
 * 1. 将Header和Payload分别进行Base64URL编码
 * 2. 用点号连接两个编码后的字符串
 * 3. 使用指定的算法和密钥对连接后的字符串进行签名
 */
function createSignature(
  headerBase64: string,
  payloadBase64: string,
  secret: string,
  algorithm: string = 'sha256'
): string {
  // 1. 构造签名字符串
  const signingInput = `${headerBase64}.${payloadBase64}`;

  // 2. 创建HMAC对象
  const hmac = crypto.createHmac(algorithm, secret);

  // 3. 更新HMAC内容
  hmac.update(signingInput);

  // 4. 生成签名
  const signature = hmac.digest('base64');

  // 5. Base64URL编码
  return signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 完整的JWT生成
 */
function createJWT(
  payload: object,
  secret: string,
  options: {
    algorithm?: string;
    expiresIn?: number;
    issuer?: string;
    subject?: string;
  } = {}
): string {
  const {
    algorithm = 'HS256',
    expiresIn = 3600,      // 默认1小时
    issuer = 'api.example.com',
    subject = '',
  } = options;

  // 1. 创建Header
  const header = {
    alg: algorithm,
    typ: 'JWT',
  };

  // 2. 添加标准声明
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,                    // 签发时间
    exp: now + expiresIn,        // 过期时间
    iss: issuer,                 // 签发者
    ...(subject && { sub: subject }), // 主题
  };

  // 3. Base64URL编码
  const headerBase64 = Buffer.from(JSON.stringify(header))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4. 生成签名
  const signature = createSignature(headerBase64, payloadBase64, secret);

  // 5. 组合完整JWT
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

// 示例
const secret = 'my-super-secret-key';
const payload = {
  userId: '1234567890',
  name: '张三',
  role: 'admin',
};

const token = createJWT(payload, secret, {
  expiresIn: 3600,
  issuer: 'api.example.com',
  subject: '1234567890',
});

console.log('Generated JWT:', token);
```

### 1.5 完整JWT解析实战

```typescript
// src/examples/jwt-parser.ts

/**
 * JWT解析器
 * 完整解析JWT的各个部分
 */
class JWTParser {
  /**
   * 解析JWT为三个部分
   */
  static parse(token: string): {
    header: object;
    payload: object;
    signature: string;
    raw: {
      header: string;
      payload: string;
      signature: string;
    };
  } {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error('JWT格式错误：必须包含三个部分（用点号分隔）');
    }

    const [headerBase64, payloadBase64, signatureBase64] = parts;

    return {
      header: this.decodeJson(headerBase64),
      payload: this.decodeJson(payloadBase64),
      signature: signatureBase64,
      raw: {
        header: headerBase64,
        payload: payloadBase64,
        signature: signatureBase64,
      },
    };
  }

  /**
   * Base64URL解码JSON
   */
  private static decodeJson(base64: string): object {
    // 添加padding
    let padded = base64;
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    padded += '='.repeat(paddingNeeded);

    // 替换回标准Base64字符
    padded = padded.replace(/-/g, '+').replace(/_/g, '/');

    // 解码
    const jsonStr = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  }

  /**
   * 验证JWT结构是否完整
   */
  static validateStructure(token: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!token || typeof token !== 'string') {
      errors.push('Token必须是字符串');
      return { valid: false, errors };
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
      errors.push(`Token必须包含3个部分，当前只有${parts.length}个部分`);
    }

    // 检查每个部分是否为有效的Base64URL
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!/^[A-Za-z0-9_-]+$/.test(part)) {
        errors.push(`第${i + 1}个部分包含无效字符`);
      }
    }

    // 尝试解析
    try {
      this.parse(token);
    } catch (e) {
      errors.push(`解析失败: ${(e as Error).message}`);
    }

    return { valid: errors.length === 0, errors };
  }
}

// 使用示例
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const result = JWTParser.parse(token);
console.log('Header:', JSON.stringify(result.header, null, 2));
console.log('Payload:', JSON.stringify(result.payload, null, 2));
console.log('Signature:', result.signature);

const validation = JWTParser.validateStructure(token);
console.log('Validation:', validation);
```

---

## 二、签名算法详解

### 2.1 算法概述

JWT支持多种签名算法，按类型可分为三大类：

| 类型 | 算法 | 特点 | 适用场景 |
|------|------|------|----------|
| **HMAC** | HS256, HS384, HS512 | 对称加密，速度快，密钥简单 | 单服务、内部系统 |
| **RSA** | RS256, RS384, RS512 | 非对称加密，密钥成对 | 微服务、跨机构 |
| **ECDSA** | ES256, ES384, ES512 | 椭圆曲线，更短签名 | 移动应用、区块链 |

### 2.2 HMAC算法

HMAC（Hash-based Message Authentication Code）是最常用的对称签名算法。

**工作原理：**

```
HMAC(key, message) = H(H(key ⊕ opad) ⊕ H(key ⊕ ipad ⊕ message))
```

其中：
- H是哈希函数（SHA-256、SHA-384、SHA-512）
- key是密钥
- ipad和opad是内部填充常量

**HS256完整实现：**

```typescript
// src/algorithms/hmac.ts

import crypto from 'crypto';

/**
 * HMAC签名算法实现
 *
 * HS256 = HMAC using SHA-256
 * HS384 = HMAC using SHA-384
 * HS512 = HMAC using SHA-512
 */
class HMACAlgorithm {
  /**
   * 生成HMAC签名
   */
  static sign(
    message: string,
    secret: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): string {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(message, 'utf8');

    // Base64URL编码
    return hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * 验证HMAC签名
   */
  static verify(
    message: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): boolean {
    const expectedSignature = this.sign(message, secret, algorithm);

    // 使用定时比较防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 生成强密钥
   */
  static generateSecret(bits: number = 256): string {
    return crypto.randomBytes(bits / 8).toString('hex');
  }
}

/**
 * JWT HS256完整实现
 */
class HS256JWT {
  private secret: string;

  constructor(secret: string) {
    if (secret.length < 32) {
      throw new Error('密钥长度至少需要32字符（256位）');
    }
    this.secret = secret;
  }

  /**
   * 签发JWT
   */
  sign(payload: object, options: {
    expiresIn?: number;
    issuer?: string;
    subject?: string;
  } = {}): string {
    const { expiresIn = 3600, issuer = '', subject = '' } = options;

    // 创建Header
    const header = { alg: 'HS256', typ: 'JWT' };

    // 添加标准声明
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      ...(issuer && { iss: issuer }),
      ...(subject && { sub: subject }),
    };

    // Base64URL编码
    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(fullPayload));

    // 签名字符串
    const signingInput = `${headerEncoded}.${payloadEncoded}`;

    // 生成签名
    const signature = HMACAlgorithm.sign(signingInput, this.secret, 'sha256');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * 验证JWT
   */
  verify(token: string): {
    valid: boolean;
    payload?: object;
    error?: string;
  } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: '无效的JWT格式' };
      }

      const [headerEncoded, payloadEncoded, signature] = parts;
      const signingInput = `${headerEncoded}.${payloadEncoded}`;

      // 验证签名
      if (!HMACAlgorithm.verify(signingInput, signature, this.secret, 'sha256')) {
        return { valid: false, error: '签名验证失败' };
      }

      // 解析Payload
      const payload = JSON.parse(
        this.base64UrlDecode(payloadEncoded)
      );

      // 验证过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token已过期' };
      }

      // 验证生效时间
      if (payload.nbf && payload.nbf > now) {
        return { valid: false, error: 'Token尚未生效' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * 解码JWT（不验证签名）
   */
  decode(token: string): { header: object; payload: object } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerEncoded, payloadEncoded] = parts;

      return {
        header: JSON.parse(this.base64UrlDecode(headerEncoded)),
        payload: JSON.parse(this.base64UrlDecode(payloadEncoded)),
      };
    } catch {
      return null;
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): string {
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    padded += '='.repeat(padding);
    return Buffer.from(padded, 'base64').toString('utf8');
  }
}

// 使用示例
const hs256 = new HS256JWT('my-super-secret-key-at-least-32-chars');

const token = hs256.sign(
  { userId: '123', role: 'admin' },
  { expiresIn: 3600, issuer: 'api.example.com', subject: '123' }
);

console.log('Token:', token);

const result = hs256.verify(token);
console.log('Verify Result:', result);
```

### 2.3 RSA算法

RSA是非对称加密算法，使用一对密钥：公钥和私钥。

**密钥生成原理：**

```
1. 选择两个大素数 p 和 q
2. 计算 n = p * q
3. 计算 φ(n) = (p-1) * (q-1)
4. 选择 e，使得 1 < e < φ(n) 且 gcd(e, φ(n)) = 1
5. 计算 d，使得 d * e ≡ 1 (mod φ(n))
6. 公钥 = (n, e)，私钥 = (n, d)
```

**RS256完整实现：**

```typescript
// src/algorithms/rsa.ts

import crypto from 'crypto';

/**
 * RSA签名算法实现
 *
 * RS256 = RSA Signature with SHA-256
 * RS384 = RSA Signature with SHA-384
 * RS512 = RSA Signature with SHA-512
 */
class RSAAlgorithm {
  /**
   * 生成RSA密钥对
   */
  static generateKeyPair(bits: number = 2048): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: bits,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * 使用私钥签名
   */
  static sign(
    message: string,
    privateKey: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): string {
    const sign = crypto.createSign(algorithm);
    sign.update(message, 'utf8');

    const signature = sign.sign(privateKey, 'base64');

    return signature
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * 使用公钥验证签名
   */
  static verify(
    message: string,
    signature: string,
    publicKey: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): boolean {
    const verify = crypto.createVerify(algorithm);
    verify.update(message, 'utf8');

    // 还原标准Base64
    const normalizedSig = signature
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    return verify.verify(publicKey, normalizedSig, 'base64');
  }
}

/**
 * JWT RS256完整实现
 */
class RS256JWT {
  private publicKey: string;
  private privateKey: string;

  constructor(options: {
    publicKey?: string;
    privateKey?: string;
  } | string) {
    if (typeof options === 'string') {
      // 直接传入PEM格式的公钥或私钥
      this.publicKey = options;
      this.privateKey = options;
    } else {
      this.publicKey = options.publicKey || '';
      this.privateKey = options.privateKey || '';
    }
  }

  /**
   * 使用私钥签发JWT
   */
  sign(payload: object, options: {
    expiresIn?: number;
    issuer?: string;
    subject?: string;
  } = {}): string {
    if (!this.privateKey) {
      throw new Error('未提供私钥');
    }

    const { expiresIn = 3600, issuer = '', subject = '' } = options;

    // 创建Header
    const header = { alg: 'RS256', typ: 'JWT' };

    // 添加标准声明
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      ...(issuer && { iss: issuer }),
      ...(subject && { sub: subject }),
    };

    // Base64URL编码
    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(fullPayload));

    // 签名字符串
    const signingInput = `${headerEncoded}.${payloadEncoded}`;

    // 使用私钥签名
    const signature = RSAAlgorithm.sign(
      signingInput,
      this.privateKey,
      'sha256'
    );

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * 使用公钥验证JWT
   */
  verify(token: string): {
    valid: boolean;
    payload?: object;
    error?: string;
  } {
    try {
      if (!this.publicKey) {
        return { valid: false, error: '未提供公钥' };
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: '无效的JWT格式' };
      }

      const [headerEncoded, payloadEncoded, signature] = parts;
      const signingInput = `${headerEncoded}.${payloadEncoded}`;

      // 验证签名
      if (!RSAAlgorithm.verify(signingInput, signature, this.publicKey, 'sha256')) {
        return { valid: false, error: '签名验证失败' };
      }

      // 解析Payload
      const payload = JSON.parse(
        this.base64UrlDecode(payloadEncoded)
      );

      // 验证过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token已过期' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): string {
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    padded += '='.repeat(padding);
    return Buffer.from(padded, 'base64').toString('utf8');
  }
}

// 使用示例
const { publicKey, privateKey } = RSAAlgorithm.generateKeyPair(2048);

const jwt = new RS256JWT({ publicKey, privateKey });

const token = jwt.sign(
  { userId: '123', role: 'admin' },
  { expiresIn: 3600, issuer: 'api.example.com' }
);

console.log('Token:', token);

const result = jwt.verify(token);
console.log('Verify Result:', result);
```

### 2.4 ECDSA算法

ECDSA（Elliptic Curve Digital Signature Algorithm）是基于椭圆曲线的签名算法，相比RSA具有更短的密钥和签名。

**ECDSA的优势：**

| 对比项 | RSA-2048 | ECDSA-256 |
|--------|----------|-----------|
| 密钥长度 | 2048位 | 256位 |
| 签名长度 | 256字节 | 64字节 |
| 签名速度 | 慢 | 快 |
| 验证速度 | 慢 | 快 |
| 适用场景 | 兼容性要求高 | 移动/IoT设备 |

**ES256完整实现：**

```typescript
// src/algorithms/ecdsa.ts

import crypto from 'crypto';

/**
 * ECDSA签名算法实现
 *
 * ES256 = ECDSA with P-256 and SHA-256
 * ES384 = ECDSA with P-384 and SHA-384
 * ES512 = ECDSA with P-521 and SHA-512
 */
class ECDSAAlgorithm {
  /**
   * 生成ECDSA密钥对
   */
  static generateKeyPair(curve: 'prime256v1' | 'secp384r1' | 'secp521r1' = 'prime256v1'): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: curve,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * 使用私钥签名
   */
  static sign(
    message: string,
    privateKey: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): string {
    const sign = crypto.createSign(algorithm);
    sign.update(message, 'utf8');

    // DER编码的签名转换为P1363格式
    const derSignature = sign.sign(privateKey);
    const signature = this.derToP1363(derSignature, algorithm);

    return signature
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * 使用公钥验证签名
   */
  static verify(
    message: string,
    signature: string,
    publicKey: string,
    algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
  ): boolean {
    const verify = crypto.createVerify(algorithm);
    verify.update(message, 'utf8');

    // P1363格式的签名转换为DER编码
    const derSignature = this.p1363ToDer(signature, algorithm);

    return verify.verify(publicKey, derSignature);
  }

  /**
   * DER编码转换为P1363格式
   */
  private static derToP1363(der: Buffer, algorithm: string): string {
    // 解析DER格式的签名
    const Asn1Schema = require('asn1js');
    const asn1 = Asn1Schema.fromDER(der);

    // 提取r和s值
    const r = asn1.valueBlock.value[0].valueBlock.toHex();
    const s = asn1.valueBlock.value[1].valueBlock.toHex();

    // P1363格式只需要r和s的字节
    const rBytes = Buffer.from(r, 'hex');
    const sBytes = Buffer.from(s, 'hex');

    // 返回组合的字节
    return Buffer.concat([rBytes, sBytes]).toString('base64');
  }

  /**
   * P1363格式转换为DER编码
   */
  private static p1363ToDer(p1363: string, algorithm: string): Buffer {
    // P1363签名是固定长度的字节串
    const bytes = Buffer.from(p1363, 'base64');

    // 对于ES256，r和s各32字节
    const halfLen = algorithm === 'sha256' ? 32 :
                     algorithm === 'sha384' ? 48 : 66;

    const r = bytes.slice(0, halfLen);
    const s = bytes.slice(halfLen);

    // 构建DER编码
    const rSign = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
    const sSign = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;

    const seq = Buffer.alloc(2 + rSign.length + 2 + sSign.length);
    seq[0] = 0x30;
    seq[1] = rSign.length + sSign.length + 4;
    seq[2] = 0x02;
    seq[3] = rSign.length;
    rSign.copy(seq, 4);
    seq[4 + rSign.length] = 0x02;
    seq[5 + rSign.length] = sSign.length;
    sSign.copy(seq, 6 + rSign.length);

    return seq;
  }
}

/**
 * JWT ES256完整实现
 */
class ES256JWT {
  private publicKey: string;
  private privateKey: string;

  constructor(options: {
    publicKey?: string;
    privateKey?: string;
  }) {
    this.publicKey = options.publicKey || '';
    this.privateKey = options.privateKey || '';
  }

  /**
   * 使用私钥签发JWT
   */
  sign(payload: object, options: {
    expiresIn?: number;
    issuer?: string;
    subject?: string;
  } = {}): string {
    const { expiresIn = 3600, issuer = '', subject = '' } = options;

    const header = { alg: 'ES256', typ: 'JWT' };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      ...(issuer && { iss: issuer }),
      ...(subject && { sub: subject }),
    };

    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signingInput = `${headerEncoded}.${payloadEncoded}`;

    const signature = ECDSAAlgorithm.sign(signingInput, this.privateKey, 'sha256');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * 使用公钥验证JWT
   */
  verify(token: string): {
    valid: boolean;
    payload?: object;
    error?: string;
  } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: '无效的JWT格式' };
      }

      const [headerEncoded, payloadEncoded, signature] = parts;
      const signingInput = `${headerEncoded}.${payloadEncoded}`;

      if (!ECDSAAlgorithm.verify(signingInput, signature, this.publicKey, 'sha256')) {
        return { valid: false, error: '签名验证失败' };
      }

      const payload = JSON.parse(this.base64UrlDecode(payloadEncoded));

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token已过期' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): string {
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    padded += '='.repeat(padding);
    return Buffer.from(padded, 'base64').toString('utf8');
  }
}

// 使用示例
const { publicKey, privateKey } = ECDSAAlgorithm.generateKeyPair('prime256v1');

const jwt = new ES256JWT({ publicKey, privateKey });

const token = jwt.sign(
  { userId: '123', role: 'admin' },
  { expiresIn: 3600, issuer: 'api.example.com' }
);

console.log('Token:', token);
console.log('Token Length:', token.length); // 比RS256短很多

const result = jwt.verify(token);
console.log('Verify Result:', result);
```

### 2.5 算法选择指南

**选择算法时需要考虑的因素：**

| 因素 | HMAC (HS256) | RSA (RS256) | ECDSA (ES256) |
|------|--------------|-------------|---------------|
| **密钥长度** | 256位 | 2048位 | 256位 |
| **签名长度** | 256位 | 512位 | 512位 |
| **计算速度** | 快 | 慢 | 中等 |
| **密钥管理** | 简单（共享密钥） | 复杂（公私钥对） | 中等 |
| **适用场景** | 单体应用、内部系统 | 微服务、跨机构 | 移动应用、IoT |

**推荐选择：**

```typescript
// src/config/algorithm-selection.ts

/**
 * 根据场景选择JWT签名算法
 */

// 场景1：单体应用，简单场景
// 推荐：HS256
const simpleAppSecret = 'your-256-bit-secret-key-here-at-least-32-chars';

// 场景2：微服务架构，需要服务间认证
// 推荐：RS256
const microserviceConfig = {
  // 服务A持有私钥，用于签发Token
  serviceA: {
    privateKey: '-----BEGIN PRIVATE KEY-----...',
    publicKey: '-----BEGIN PUBLIC KEY-----...',
  },
  // 服务B持有公钥，用于验证Token
  serviceB: {
    publicKey: '-----BEGIN PUBLIC KEY-----...',
  },
};

// 场景3：移动应用、IoT设备
// 推荐：ES256
const mobileAppConfig = {
  algorithm: 'ES256',
  curve: 'prime256v1', // P-256曲线
};

// 场景4：需要兼容旧系统
// 推荐：RS256
const legacySystemConfig = {
  algorithm: 'RS256',
  publicKey: '-----BEGIN RSA PUBLIC KEY-----...',
};

/**
 * 算法强度对照表
 */
const algorithmStrength = {
  // 推荐用于生产的算法
  production: {
    'HS256': { bits: 256, safe: true, note: '需要强密钥' },
    'HS384': { bits: 384, safe: true, note: '需要强密钥' },
    'HS512': { bits: 512, safe: true, note: '需要强密钥' },
    'RS256': { bits: 2048, safe: true, note: '密钥需定期轮换' },
    'ES256': { bits: 256, safe: true, note: '推荐移动应用使用' },
    'ES384': { bits: 384, safe: true, note: '高安全要求场景' },
  },
  // 不推荐或已废弃的算法
  deprecated: {
    'none': { safe: false, note: '危险！禁用' },
    'HS256': { bits: 256, safe: false, note: '密钥太短' },
  },
};
```

### 2.6 实战：签名验证完整实现

```typescript
// src/services/jwt-verifier.ts

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RSAAlgorithm } from './algorithms/rsa';
import { ECDSAAlgorithm } from './algorithms/ecdsa';

/**
 * JWT签名验证器
 * 支持多种算法，自动检测
 */
class JWTVerifier {
  private algorithms: Record<string, {
    verify: (message: string, signature: string, key: string) => boolean;
    sign: (message: string, key: string) => string;
  }>;

  constructor() {
    this.algorithms = {
      'HS256': {
        sign: (msg, key) => {
          return crypto.createHmac('sha256', key)
            .update(msg).digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        },
        verify: (msg, sig, key) => {
          const expected = crypto.createHmac('sha256', key)
            .update(msg).digest('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          try {
            return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
          } catch {
            return false;
          }
        },
      },
      'RS256': {
        sign: (msg, key) => RSAAlgorithm.sign(msg, key, 'sha256'),
        verify: (msg, sig, key) => RSAAlgorithm.verify(msg, sig, key, 'sha256'),
      },
      'ES256': {
        sign: (msg, key) => ECDSAAlgorithm.sign(msg, key, 'sha256'),
        verify: (msg, sig, key) => ECDSAAlgorithm.verify(msg, sig, key, 'sha256'),
      },
    };
  }

  /**
   * 验证JWT签名
   */
  verify(token: string, key: string, algorithm: string = 'HS256'): {
    valid: boolean;
    error?: string;
    payload?: object;
    header?: object;
  } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'JWT格式错误' };
      }

      const [headerB64, payloadB64, signature] = parts;
      const signingInput = `${headerB64}.${payloadB64}`;

      // 解析Header获取算法声明
      const headerJson = Buffer.from(headerB64, 'base64').toString('utf8');
      const header = JSON.parse(headerJson);

      // 如果Header中声明的算法与指定算法不同，使用Header中的算法
      const alg = header.alg || algorithm;

      // 检查算法是否支持
      if (!this.algorithms[alg]) {
        return { valid: false, error: `不支持的算法: ${alg}` };
      }

      // 验证签名
      const verifier = this.algorithms[alg];
      if (!verifier.verify(signingInput, signature, key)) {
        return { valid: false, error: '签名验证失败' };
      }

      // 解析Payload
      const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);

      // 验证过期时间
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token已过期' };
      }

      // 验证生效时间
      if (payload.nbf && payload.nbf > now) {
        return { valid: false, error: 'Token尚未生效' };
      }

      return { valid: true, payload, header };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * 添加自定义算法
   */
  addAlgorithm(name: string, sign: Function, verify: Function): void {
    this.algorithms[name] = {
      sign: sign as any,
      verify: verify as any,
    };
  }
}

export const jwtVerifier = new JWTVerifier();
```

---

## 三、Payload设计

### 3.1 标准声明详解

JWT定义了一组标准声明（Registered Claims），这些声明是预定义的，可以在Payload中使用。

**iss（Issuer）- 签发者**

```typescript
// 签发者声明示例
const payloadWithIssuer = {
  iss: 'api.example.com',  // 签发者标识
  sub: 'user-123',          // 用户ID
  // ...其他声明
};

// 验证签发者
function verifyIssuer(token: string, expectedIssuer: string): boolean {
  const payload = jwt.decode(token) as any;
  return payload.iss === expectedIssuer;
}
```

**sub（Subject）- 主题**

```typescript
// 主题声明示例 - 通常是用户ID
const payloadWithSubject = {
  sub: 'user-123',          // 用户ID
  name: '张三',
  role: 'admin',
};

// 主题是JWT的核心声明，标识Token代表的主体
```

**aud（Audience）- 受众**

```typescript
// 受众声明示例
const payloadWithAudience = {
  aud: 'app.example.com',   // 预期接收者
  sub: 'user-123',
  // ...
};

// 多受众场景
const payloadWithMultipleAudience = {
  aud: ['app.example.com', 'mobile.example.com'],
  sub: 'user-123',
};

// 验证受众
function verifyAudience(token: string, expectedAudience: string): boolean {
  const payload = jwt.decode(token) as any;
  if (Array.isArray(payload.aud)) {
    return payload.aud.includes(expectedAudience);
  }
  return payload.aud === expectedAudience;
}
```

**exp（Expiration Time）- 过期时间**

```typescript
// 过期时间声明示例
const payloadWithExpiration = {
  exp: Math.floor(Date.now() / 1000) + 3600,  // 1小时后过期
  sub: 'user-123',
  // ...
};

// JWT库会自动处理过期验证
const decoded = jwt.verify(token, secret, {
  clockTolerance: 30,  // 允许30秒的时间误差
});

// 手动检查过期
function isTokenExpired(payload: any): boolean {
  if (!payload.exp) return false;
  return payload.exp < Math.floor(Date.now() / 1000);
}
```

**nbf（Not Before）- 生效时间**

```typescript
// 生效时间声明示例
const payloadWithNotBefore = {
  nbf: Math.floor(Date.now() / 1000) + 60,  // 1分钟后生效
  exp: Math.floor(Date.now() / 1000) + 7200, // 2小时后过期
  sub: 'user-123',
};

// 用于预约生效场景
function verifyNotBefore(payload: any): boolean {
  if (!payload.nbf) return true;
  return payload.nbf <= Math.floor(Date.now() / 1000);
}
```

**iat（Issued At）- 签发时间**

```typescript
// 签发时间声明
const payloadWithIssuedAt = {
  iat: Math.floor(Date.now() / 1000),  // 当前时间戳
  sub: 'user-123',
};

// 计算Token年龄
function getTokenAge(payload: any): number {
  if (!payload.iat) return 0;
  return Math.floor(Date.now() / 1000) - payload.iat;
}
```

**jti（JWT ID）- 唯一标识**

```typescript
// JWT ID声明 - 用于防重放
import crypto from 'crypto';

const payloadWithJTI = {
  jti: crypto.randomUUID(),  // 唯一标识
  sub: 'user-123',
  exp: Math.floor(Date.now() / 1000) + 3600,
};

// Redis存储jti用于防重放
class JTIService {
  async isUsed(jti: string): Promise<boolean> {
    const result = await redis.get(`jti:${jti}`);
    return result !== null;
  }

  async markAsUsed(jti: string, ttl: number): Promise<void> {
    await redis.set(`jti:${jti}`, '1', 'EX', ttl);
  }
}
```

### 3.2 私有声明设计

私有声明是自定义的声明，用于在特定应用场景中传递业务数据。

**良好的私有声明设计：**

```typescript
/**
 * 用户相关私有声明
 */
interface UserClaims {
  // 标准声明
  sub: string;              // 用户ID
  iss: string;               // 签发者
  aud: string;              // 受众
  exp: number;               // 过期时间
  iat: number;               // 签发时间

  // 私有声明 - 用户信息
  name: string;             // 用户姓名
  email: string;            // 用户邮箱
  role: string;             // 用户角色
  permissions: string[];     // 权限列表

  // 私有声明 - 会话信息
  sessionId: string;        // 会话ID
  deviceId: string;         // 设备ID
  ip: string;               // 客户端IP

  // 私有声明 - 应用特定
  organizationId: string;   // 组织ID
  tenantId: string;         // 租户ID（多租户场景）
  plan: 'free' | 'pro' | 'enterprise'; // 订阅计划
}

/**
 * JWT Payload构建器
 */
class JWTPayloadBuilder {
  private payload: Partial<UserClaims> = {};

  setUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  }): this {
    this.payload.sub = user.id;
    this.payload.name = user.name;
    this.payload.email = user.email;
    this.payload.role = user.role;
    this.payload.permissions = user.permissions;
    return this;
  }

  setSession(session: {
    id: string;
    deviceId: string;
    ip: string;
  }): this {
    this.payload.sessionId = session.id;
    this.payload.deviceId = session.deviceId;
    this.payload.ip = session.ip;
    return this;
  }

  setOrganization(orgId: string, tenantId?: string): this {
    this.payload.organizationId = orgId;
    if (tenantId) {
      this.payload.tenantId = tenantId;
    }
    return this;
  }

  setSubscription(plan: 'free' | 'pro' | 'enterprise'): this {
    this.payload.plan = plan;
    return this;
  }

  setIssuer(iss: string): this {
    this.payload.iss = iss;
    return this;
  }

  setAudience(aud: string): this {
    this.payload.aud = aud;
    return this;
  }

  setExpiration(expiresInSeconds: number): this {
    this.payload.iat = Math.floor(Date.now() / 1000);
    this.payload.exp = this.payload.iat + expiresInSeconds;
    return this;
  }

  build(): UserClaims {
    if (!this.payload.sub) {
      throw new Error('必须设置用户ID (sub)');
    }
    if (!this.payload.iss) {
      throw new Error('必须设置签发者 (iss)');
    }
    if (!this.payload.exp) {
      throw new Error('必须设置过期时间 (exp)');
    }
    return this.payload as UserClaims;
  }
}

// 使用示例
const payload = new JWTPayloadBuilder()
  .setUser({
    id: 'user-123',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
  })
  .setSession({
    id: 'session-456',
    deviceId: 'device-789',
    ip: '192.168.1.100',
  })
  .setOrganization('org-001', 'tenant-002')
  .setSubscription('pro')
  .setIssuer('api.example.com')
  .setAudience('app.example.com')
  .setExpiration(3600)
  .build();
```

### 3.3 敏感信息处理

**绝对不能在JWT中存储的敏感信息：**

```typescript
/**
 * JWT敏感信息禁区
 */

// 危险：以下信息绝对不能放入JWT

// 1. 密码
const dangerousPayload1 = {
  password: '123456',  // 绝对禁止！
  sub: 'user-123',
};

// 2. 信用卡信息
const dangerousPayload2 = {
  creditCardNumber: '4111111111111111',  // 绝对禁止！
  cvv: '123',  // 绝对禁止！
  sub: 'user-123',
};

// 3. 身份证号（在中国等需要身份证认证的场景）
const dangerousPayload3 = {
  idCardNumber: '110101199001011234',  // 绝对禁止！
  sub: 'user-123',
};

// 4. 银行账号
const dangerousPayload4 = {
  bankAccountNumber: '6222021234567890',  // 绝对禁止！
  sub: 'user-123',
};

// 5. 医疗健康数据
const dangerousPayload5 = {
  medicalRecords: '...',  // 绝对禁止！
  sub: 'user-123',
};
```

**安全的数据存储策略：**

```typescript
/**
 * 安全的数据存储策略
 */

// 策略1：只存ID，实际数据存数据库
const safePayload1 = {
  sub: 'user-123',  // 只存ID
  // 用户其他信息通过API获取
};

// 策略2：只存必要的摘要信息
const safePayload2 = {
  sub: 'user-123',
  emailHash: 'sha256:abc123...',  // 只存邮箱哈希，用于验证
  // 不存邮箱本身
};

// 策略3：加密敏感字段
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY!;  // 32字节密钥

function encryptField(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptField(encryptedValue: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 加密存储敏感数据
const safePayload3 = {
  sub: 'user-123',
  encryptedPhone: encryptField('13800138000'),  // 加密存储
};

// 策略4：分离Token - 使用参考Token而非数据Token
class TokenReferenceService {
  /**
   * 创建数据引用Token
   * 只存储数据的引用ID，实际数据存在服务端
   */
  async createReference(userId: string, dataKey: string): Promise<string> {
    const referenceId = crypto.randomUUID();

    // 存储引用映射
    await redis.hset(
      `token_ref:${referenceId}`,
      {
        userId,
        dataKey,
        createdAt: Date.now().toString(),
      }
    );

    // 设置过期时间（与JWT同步）
    await redis.expire(`token_ref:${referenceId}`, 3600);

    return referenceId;
  }

  /**
   * 获取引用数据
   */
  async getReferenceData(referenceId: string): Promise<any> {
    const ref = await redis.hgetall(`token_ref:${referenceId}`);
    if (!ref) {
      throw new Error('无效的引用');
    }

    // 根据dataKey获取实际数据
    return await this.getDataByKey(ref.userId, ref.dataKey);
  }
}
```

### 3.4 实战：合理设计Payload

```typescript
// src/examples/payload-design.ts

/**
 * 合理的Payload设计示例
 *
 * 设计原则：
 * 1. 只存储必要信息
 * 2. 不存储敏感信息
 * 3. 控制Payload大小
 * 4. 包含必要的安全声明
 */

/**
 * Access Token Payload - 精简设计
 * 用于API认证，需要快速验证
 */
interface AccessTokenPayload {
  // 标准声明
  sub: string;                    // 用户ID（必须）
  iss: string;                    // 签发者
  aud: string;                   // 受众
  exp: number;                   // 过期时间
  iat: number;                   // 签发时间

  // 认证相关
  jti: string;                   // Token唯一ID
  type: 'access';                // Token类型标识

  // 最小化用户信息
  role: string;                  // 角色
  permissions: string[];         // 权限列表（精简）

  // 会话绑定
  sessionId: string;             // 会话ID
  deviceId: string;              // 设备指纹
}

/**
 * Refresh Token Payload - 可包含更多信息
 * 用于获取新的Access Token
 */
interface RefreshTokenPayload {
  // 标准声明
  sub: string;                    // 用户ID
  iss: string;
  aud: string;
  exp: number;
  iat: number;

  // Token类型标识
  type: 'refresh';

  // 会话信息
  sessionId: string;
  deviceId: string;

  // 版本控制（用于撤销）
  version: number;

  // 令牌族ID（用于刷新令牌旋转）
  family: string;
}

/**
 * Token族管理 - 支持刷新令牌旋转
 */
class TokenFamily {
  private redis: any;

  /**
   * 创建新的令牌族
   */
  async createFamily(): Promise<string> {
    const familyId = crypto.randomUUID();
    await redis.set(`token_family:${familyId}`, '0');
    return familyId;
  }

  /**
   * 获取当前版本
   */
  async getVersion(familyId: string): Promise<number> {
    const version = await redis.get(`token_family:${familyId}`);
    return parseInt(version || '0', 10);
  }

  /**
   * 递增版本（使旧令牌失效）
   */
  async incrementVersion(familyId: string): Promise<number> {
    return await redis.incr(`token_family:${familyId}`);
  }

  /**
   * 验证令牌版本
   */
  async validateVersion(familyId: string, expectedVersion: number): Promise<boolean> {
    const currentVersion = await this.getVersion(familyId);
    return currentVersion === expectedVersion;
  }
}

/**
 * 完整的Payload构建和验证
 */
class TokenPayloadService {
  private tokenFamily: TokenFamily;

  constructor() {
    this.tokenFamily = new TokenFamily();
  }

  /**
   * 构建Access Token Payload
   */
  buildAccessTokenPayload(params: {
    userId: string;
    role: string;
    permissions: string[];
    sessionId: string;
    deviceId: string;
    issuer: string;
    audience: string;
    expiresIn: number;
  }): AccessTokenPayload {
    const now = Math.floor(Date.now() / 1000);

    return {
      sub: params.userId,
      iss: params.issuer,
      aud: params.audience,
      exp: now + params.expiresIn,
      iat: now,
      jti: crypto.randomUUID(),
      type: 'access',
      role: params.role,
      permissions: params.permissions,
      sessionId: params.sessionId,
      deviceId: params.deviceId,
    };
  }

  /**
   * 构建Refresh Token Payload
   */
  async buildRefreshTokenPayload(params: {
    userId: string;
    sessionId: string;
    deviceId: string;
    issuer: string;
    audience: string;
    expiresIn: number;
  }): Promise<RefreshTokenPayload> {
    const now = Math.floor(Date.now() / 1000);
    const familyId = await this.tokenFamily.createFamily();

    return {
      sub: params.userId,
      iss: params.issuer,
      aud: params.audience,
      exp: now + params.expiresIn,
      iat: now,
      type: 'refresh',
      sessionId: params.sessionId,
      deviceId: params.deviceId,
      version: 1,
      family: familyId,
    };
  }

  /**
   * 验证Access Token Payload
   */
  validateAccessTokenPayload(payload: AccessTokenPayload): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证标准声明
    if (!payload.sub) errors.push('缺少用户ID');
    if (!payload.iss) errors.push('缺少签发者');
    if (!payload.exp) errors.push('缺少过期时间');

    // 验证过期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      errors.push('Token已过期');
    }

    // 验证类型
    if (payload.type !== 'access') {
      errors.push('Token类型错误');
    }

    // 验证必要字段
    if (!payload.sessionId) errors.push('缺少会话ID');
    if (!payload.role) errors.push('缺少角色');

    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证Refresh Token Payload
   */
  async validateRefreshTokenPayload(payload: RefreshTokenPayload): Promise<{
    valid: boolean;
    errors: string[];
    shouldRotate: boolean;
  }> {
    const errors: string[] = [];

    // 基本验证
    if (!payload.sub) errors.push('缺少用户ID');
    if (!payload.exp) errors.push('缺少过期时间');
    if (!payload.family) errors.push('缺少令牌族ID');

    // 过期验证
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      errors.push('Refresh Token已过期');
    }

    // 令牌族版本验证
    const isValidVersion = await this.tokenFamily.validateVersion(
      payload.family,
      payload.version
    );

    if (!isValidVersion) {
      // 版本不匹配，说明使用了旧的刷新令牌
      // 这是刷新令牌旋转的正常情况
      return {
        valid: false,
        errors: ['令牌已被旋转'],
        shouldRotate: true,
      };
    }

    return { valid: errors.length === 0, errors, shouldRotate: false };
  }
}
```

---

## 四、安全考量

### 4.1 Token泄露风险

**Token泄露的常见途径：**

```typescript
/**
 * Token泄露的常见场景
 */

// 1. URL中传输Token
// 危险：URL会被记录在浏览器历史、服务器日志、Referer头中
const dangerousUrl = 'https://api.example.com/user?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 2. 存储在LocalStorage
// 危险：容易受到XSS攻击
localStorage.setItem('token', token);

// 3. 存储在SessionStorage
// 危险：同一标签页可访问
sessionStorage.setItem('token', token);

// 4. 打印到控制台
console.log('Token:', token);  // 危险：在生产环境中

// 5. 作为错误信息的一部分发送
res.status(401).json({ error: 'Invalid token: ' + token });  // 危险
```

**安全存储方案：**

```typescript
/**
 * 安全的Token存储方案
 */

// 方案1：HttpOnly Cookie
import cookie from 'cookie';

function setTokenCookie(res: Response, token: string): void {
  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true,      // 防止XSS访问
    secure: process.env.NODE_ENV === 'production',  // 仅HTTPS
    sameSite: 'strict',   // 防止CSRF
    maxAge: 3600,         // 1小时
    path: '/',
  }));
}

// 方案2：内存存储 + 安全Cookie
class SecureTokenStorage {
  private memoryToken: string | null = null;

  /**
   * 设置Token（内存+Cookie）
   */
  set(token: string): void {
    // 存储到内存
    this.memoryToken = token;

    // 同时设置安全的HttpOnly Cookie作为备份
    this.setSecureCookie(token);
  }

  /**
   * 获取Token
   */
  get(): string | null {
    // 优先从内存获取
    if (this.memoryToken) {
      return this.memoryToken;
    }

    // 从Cookie获取
    return this.getCookie('token');
  }

  /**
   * 清除Token
   */
  clear(): void {
    this.memoryToken = null;
    this.clearCookie('token');
  }

  private setSecureCookie(token: string): void {
    // HttpOnly Cookie设置
  }

  private getCookie(name: string): string | null {
    // Cookie读取
    return null;
  }

  private clearCookie(name: string): void {
    // Cookie清除
  }
}

// 方案3：Keychain/Keystore（移动端）
// React Native
import * as Keychain from 'react-native-keychain';

async function storeTokenSecurely(token: string): Promise<void> {
  await Keychain.setGenericPassword('jwt', token, {
    service: 'com.example.app',
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
```

### 4.2 算法NONE攻击

**攻击原理：**

```
攻击者修改JWT Header，将alg改为"none"，然后移除Signature部分：
{
  "alg": "none",      // 被修改为none
  "typ": "JWT"
}
.
{
  "sub": "admin",     // 攻击者想要冒充的用户
}
.
                          // Signature为空
```

**防御措施：**

```typescript
/**
 * 算法NONE攻击防御
 */

// 1. 白名单算法
const ALLOWED_ALGORITHMS = ['HS256', 'RS256', 'ES256'];

function verifyWithAlgorithmWhitelist(token: string, secret: string): boolean {
  // 解析Header
  const headerJson = Buffer.from(token.split('.')[0], 'base64').toString();
  const header = JSON.parse(headerJson);

  // 检查算法是否在白名单中
  if (!ALLOWED_ALGORITHMS.includes(header.alg)) {
    throw new Error(`不支持的算法: ${header.alg}`);
  }

  // 检查是否为空算法
  if (header.alg.toLowerCase() === 'none') {
    throw new Error('空算法已被禁用');
  }

  // 继续验证签名
  return jwt.verify(token, secret);
}

// 2. 强制指定算法
function verifyWithForcedAlgorithm(token: string, secret: string, forcedAlg: string): boolean {
  const decoded = jwt.decode(token);

  // 确保Header中的算法与指定的算法匹配
  if (decoded.header.alg !== forcedAlg) {
    throw new Error('算法不匹配');
  }

  return jwt.verify(token, secret, { algorithms: [forcedAlg] });
}

// 3. 完整的算法验证中间件
class AlgorithmValidator {
  private allowedAlgorithms: string[];

  constructor(allowedAlgorithms: string[]) {
    this.allowedAlgorithms = allowedAlgorithms;
  }

  validate(token: string): void {
    // 提取Header
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('无效的JWT格式');
    }

    const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
    const header = JSON.parse(headerJson);

    // 检查算法
    if (!header.alg) {
      throw new Error('JWT缺少算法声明');
    }

    // 检查是否为空算法
    if (header.alg.toLowerCase() === 'none') {
      throw new Error('空算法已禁用');
    }

    // 检查是否在白名单
    if (!this.allowedAlgorithms.includes(header.alg)) {
      throw new Error(`算法 ${header.alg} 不在允许列表中`);
    }
  }
}

// 使用示例
const validator = new AlgorithmValidator(['HS256', 'RS256', 'ES256']);

function secureVerify(token: string, secret: string): any {
  // 第一步：验证算法
  validator.validate(token);

  // 第二步：验证签名
  return jwt.verify(token, secret);
}
```

### 4.3 签名伪造攻击

**攻击场景1：密钥混淆**

```
攻击者获取公钥后，可能尝试：
1. 使用公钥作为密钥验证HMAC签名
2. 如果服务端没有正确验证算法，会接受HMAC签名
```

**防御措施：**

```typescript
/**
 * 签名伪造攻击防御
 */

// 1. 严格区分HMAC和RSA的密钥
class JWTSecurityConfig {
  private hmacSecret: string;
  private rsaPublicKey: string;
  private rsaPrivateKey: string;

  /**
   * 根据算法使用正确的密钥
   */
  getSecretForAlgorithm(algorithm: string): string | { publicKey: string; privateKey: string } {
    if (algorithm.startsWith('HS')) {
      // HMAC使用对称密钥
      return this.hmacSecret;
    } else if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
      // RSA/ECDSA使用非对称密钥对
      return {
        publicKey: this.rsaPublicKey,
        privateKey: this.rsaPrivateKey,
      };
    }
    throw new Error(`不支持的算法: ${algorithm}`);
  }

  /**
   * 验证时严格检查算法类型
   */
  verifyWithStrictAlgorithmCheck(token: string): any {
    const decoded = jwt.decode(token);
    const algorithm = decoded.header.alg;

    // 验证算法类型与密钥类型匹配
    if (algorithm.startsWith('HS') && this.isAsymmetricKey(this.hmacSecret)) {
      throw new Error('HMAC密钥配置错误');
    }

    if ((algorithm.startsWith('RS') || algorithm.startsWith('ES')) && this.isSymmetricKey(this.rsaPublicKey)) {
      throw new Error('RSA/ECDSA密钥配置错误');
    }

    return jwt.verify(token, this.getSecretForAlgorithm(algorithm));
  }

  private isAsymmetricKey(key: string): boolean {
    return key.includes('BEGIN PUBLIC KEY') || key.includes('BEGIN PRIVATE KEY');
  }

  private isSymmetricKey(key: string): boolean {
    return !key.includes('BEGIN');
  }
}

// 2. 完整的签名验证流程
function rigorousSignatureVerification(token: string, secretOrPublicKey: string, expectedAlgorithm: string): any {
  // 步骤1：解码Header
  const headerJson = Buffer.from(token.split('.')[0], 'base64').toString('utf8');
  const header = JSON.parse(headerJson);

  // 步骤2：验证算法
  const declaredAlgorithm = header.alg;

  if (!declaredAlgorithm) {
    throw new Error('Token缺少算法声明');
  }

  // 步骤3：确保声明的算法与预期算法一致
  if (declaredAlgorithm !== expectedAlgorithm) {
    throw new Error(`算法不匹配：声明的算法是 ${declaredAlgorithm}，预期是 ${expectedAlgorithm}`);
  }

  // 步骤4：确保算法不在危险列表中
  const dangerousAlgorithms = ['none', 'null', 'empty'];
  if (dangerousAlgorithms.includes(declaredAlgorithm.toLowerCase())) {
    throw new Error('检测到危险算法');
  }

  // 步骤5：验证签名
  return jwt.verify(token, secretOrPublicKey, {
    algorithms: [expectedAlgorithm],  // 只允许指定算法
  });
}
```

### 4.4 密钥安全

**密钥生成与存储的最佳实践：**

```typescript
/**
 * 密钥安全最佳实践
 */

// 1. 生成强密钥
function generateStrongKey(bits: number = 256): string {
  return crypto.randomBytes(bits / 8).toString('hex');
}

// 2. 密钥派生（从主密钥派生会话密钥）
import crypto from 'crypto';

function deriveKey(masterKey: string, context: string, length: number = 32): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    context,
    100000,  // 迭代次数
    length,
    'sha256'
  );
}

// 3. 环境变量密钥加载
function loadKeyFromEnv(keyName: string, minLength: number = 32): string {
  const key = process.env[keyName];

  if (!key) {
    throw new Error(`环境变量 ${keyName} 未设置`);
  }

  if (key.length < minLength) {
    throw new Error(`密钥 ${keyName} 长度不足，至少需要 ${minLength} 字符`);
  }

  return key;
}

// 4. 密钥轮换服务
class KeyRotationService {
  private currentKey: string;
  private previousKey: string | null = null;
  private keyVersion: number = 1;

  constructor() {
    this.currentKey = loadKeyFromEnv('JWT_SECRET_KEY');
  }

  /**
   * 获取当前密钥版本
   */
  getKeyVersion(): number {
    return this.keyVersion;
  }

  /**
   * 轮换到新密钥
   */
  async rotate(newKey: string): Promise<void> {
    // 验证新密钥强度
    if (newKey.length < 32) {
      throw new Error('新密钥长度不足');
    }

    // 保存旧密钥
    this.previousKey = this.currentKey;

    // 切换到新密钥
    this.currentKey = newKey;
    this.keyVersion++;

    // 将新密钥写入环境变量或密钥存储
    process.env.JWT_SECRET_KEY = newKey;
    process.env.JWT_PREVIOUS_SECRET_KEY = this.previousKey;

    // 记录密钥轮换日志
    await this.logKeyRotation();
  }

  /**
   * 使用当前或旧密钥验证Token
   * 支持平滑过渡
   */
  verifyWithFallback(token: string): any {
    // 先尝试当前密钥
    try {
      return jwt.verify(token, this.currentKey);
    } catch (e) {
      // 如果当前密钥验证失败，尝试旧密钥
      if (this.previousKey) {
        try {
          return jwt.verify(token, this.previousKey);
        } catch {
          throw e;
        }
      }
      throw e;
    }
  }

  /**
   * 使用当前密钥签发
   */
  sign(payload: object, options?: jwt.SignOptions): string {
    return jwt.sign(payload, this.currentKey, {
      ...options,
      keyid: this.keyVersion.toString(),  // 在Token中包含密钥ID
    });
  }

  private async logKeyRotation(): Promise<void> {
    console.log(`密钥已轮换: 版本 ${this.keyVersion - 1} -> ${this.keyVersion}`);
  }
}

// 5. 密钥存储配置
interface KeyStorageConfig {
  type: 'env' | 'vault' | 'kms' | 'aws-secrets-manager';
  envVarName?: string;
  vaultUrl?: string;
  kmsKeyId?: string;
}

class SecureKeyStorage {
  private config: KeyStorageConfig;

  async getKey(): Promise<string> {
    switch (this.config.type) {
      case 'env':
        return loadKeyFromEnv(this.config.envVarName!);

      case 'vault':
        return await this.getFromVault();

      case 'kms':
        return await this.getFromKMS();

      case 'aws-secrets-manager':
        return await this.getFromAWSSecretsManager();

      default:
        throw new Error('未知的密钥存储类型');
    }
  }

  private async getFromVault(): Promise<string> {
    // 使用HashiCorp Vault获取密钥
    // 实现省略
    return '';
  }

  private async getFromKMS(): Promise<string> {
    // 使用AWS KMS获取密钥
    // 实现省略
    return '';
  }

  private async getFromAWSSecretsManager(): Promise<string> {
    // 使用AWS Secrets Manager获取密钥
    // 实现省略
    return '';
  }
}
```

### 4.5 实战：安全实践总结

```typescript
/**
 * JWT安全实践完整检查清单
 */

// 安全检查类
class JWTSecurityChecker {
  private issues: string[] = [];

  /**
   * 执行完整的安全检查
   */
  check(token: string, secret: string, config: any): {
    passed: boolean;
    issues: string[];
    recommendations: string[];
  } {
    this.issues = [];
    const recommendations: string[] = [];

    // 1. 检查算法
    this.checkAlgorithm(token);

    // 2. 检查过期时间
    this.checkExpiration(token);

    // 3. 检查签名
    this.checkSignature(token, secret);

    // 4. 检查敏感信息
    this.checkSensitiveData(token);

    // 5. 检查密钥强度
    this.checkKeyStrength(secret);

    // 生成建议
    if (this.issues.length > 0) {
      recommendations.push('存在安全隐患，请修复上述问题');
    }

    if (config.expiresIn && config.expiresIn > 3600) {
      recommendations.push('考虑使用更短的过期时间');
    }

    return {
      passed: this.issues.length === 0,
      issues: this.issues,
      recommendations,
    };
  }

  private checkAlgorithm(token: string): void {
    const decoded = jwt.decode(token);

    if (!decoded.header.alg) {
      this.issues.push('Token缺少算法声明');
    }

    if (decoded.header.alg?.toLowerCase() === 'none') {
      this.issues.push('检测到危险算法 NONE');
    }

    const weakAlgorithms = ['HS256'];  // 在非对称场景下
    // 根据使用场景检查
  }

  private checkExpiration(token: string): void {
    const decoded = jwt.decode(token) as any;

    if (!decoded.exp) {
      this.issues.push('Token缺少过期时间');
    }

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      this.issues.push('Token已过期');
    }
  }

  private checkSignature(token: string, secret: string): void {
    try {
      jwt.verify(token, secret);
    } catch (e) {
      this.issues.push(`签名验证失败: ${(e as Error).message}`);
    }
  }

  private checkSensitiveData(token: string): void {
    const dangerousFields = ['password', 'secret', 'token', 'creditCard'];
    const decoded = jwt.decode(token) as any;

    for (const field of dangerousFields) {
      if (decoded && JSON.stringify(decoded).includes(field)) {
        this.issues.push(`检测到敏感字段: ${field}`);
      }
    }
  }

  private checkKeyStrength(secret: string): void {
    if (secret.length < 32) {
      this.issues.push('密钥长度不足（建议至少32字符）');
    }

    if (!/[A-Z]/.test(secret)) {
      this.issues.push('密钥应包含大写字母');
    }

    if (!/[a-z]/.test(secret)) {
      this.issues.push('密钥应包含小写字母');
    }

    if (!/[0-9]/.test(secret)) {
      this.issues.push('密钥应包含数字');
    }
  }
}

/**
 * 完整的安全配置
 */
const JWT_SECURITY_CONFIG = {
  // 算法配置
  algorithms: {
    allowed: ['HS256', 'RS256', 'ES256'],  // 白名单
    preferred: 'RS256',                    // 推荐算法
    forbidden: ['none', 'HS256'],           // 禁用算法（特定场景）
  },

  // 过期时间配置
  expiration: {
    accessToken: 900,       // 15分钟
    refreshToken: 604800,   // 7天
    absoluteMax: 86400,     // 最大不超过1天（安全考虑）
  },

  // 密钥配置
  keyRequirements: {
    minLength: 32,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // 存储配置
  storage: {
    useHttpOnlyCookie: true,
    secureCookie: process.env.NODE_ENV === 'production',
    sameSiteCookie: 'strict',
  },

  // 验证配置
  verification: {
    verifyExpiration: true,
    verifyIssuer: true,
    verifyAudience: true,
    clockTolerance: 30,  // 30秒容差
  },
};
```

---

## 五、过期与刷新机制

### 5.1 Access Token过期处理

**过期检查的时机：**

```typescript
/**
 * Access Token过期处理策略
 */

// 策略1：被动检查 - 请求时验证
class PassiveTokenChecker {
  verifyOnRequest(token: string): boolean {
    try {
      jwt.verify(token, secret);
      return true;  // Token有效
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return false;  // Token已过期
      }
      throw e;  // 其他错误
    }
  }
}

// 策略2：主动检查 - 提前预警
class ProactiveTokenChecker {
  private warningThreshold = 300;  // 5分钟

  /**
   * 检查Token是否即将过期
   */
  isExpiringSoon(token: string): boolean {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    const timeRemaining = expiresAt - now;

    return timeRemaining < this.warningThreshold * 1000;
  }

  /**
   * 获取Token剩余有效时间（秒）
   */
  getTimeRemaining(token: string): number {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  }

  /**
   * 获取过期时间戳
   */
  getExpirationTime(token: string): number | null {
    const decoded = jwt.decode(token) as any;
    return decoded?.exp || null;
  }
}

// 策略3：多层检查
class MultiLayerTokenValidation {
  /**
   * 多层验证
   */
  validate(token: string): {
    valid: boolean;
    stage: string;
    error?: string;
  } {
    // 第一层：格式检查
    if (!this.isValidFormat(token)) {
      return { valid: false, stage: 'format', error: '无效的Token格式' };
    }

    // 第二层：过期检查
    const expirationResult = this.checkExpiration(token);
    if (!expirationResult.valid) {
      return { valid: false, stage: 'expiration', error: expirationResult.error };
    }

    // 第三层：签名检查
    try {
      jwt.verify(token, secret);
    } catch (e) {
      return { valid: false, stage: 'signature', error: (e as Error).message };
    }

    // 第四层：黑名单检查
    if (this.isInBlacklist(token)) {
      return { valid: false, stage: 'blacklist', error: 'Token已被撤销' };
    }

    return { valid: true, stage: 'passed' };
  }

  private isValidFormat(token: string): boolean {
    return token && token.split('.').length === 3;
  }

  private checkExpiration(token: string): { valid: boolean; error?: string } {
    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      return { valid: false, error: '无法解码Token' };
    }

    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      return { valid: false, error: 'Token已过期' };
    }

    if (decoded.nbf && decoded.nbf > now) {
      return { valid: false, error: 'Token尚未生效' };
    }

    return { valid: true };
  }

  private isInBlacklist(token: string): boolean {
    // 检查Redis黑名单
    return false;
  }
}
```

### 5.2 Refresh Token机制

**Refresh Token的核心概念：**

```
┌─────────────────────────────────────────────────────────────┐
│                    Refresh Token 刷新流程                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. 用户登录，获取 Access Token (15分钟)                    │
│                    + Refresh Token (7天)                    │
│                                                              │
│   2. 使用 Access Token 访问API                               │
│                                                              │
│   3. Access Token 过期                                       │
│                                                              │
│   4. 使用 Refresh Token 获取新的 Access Token               │
│                                                              │
│   5. 返回新的 Access Token + 新的 Refresh Token             │
│      (Refresh Token Rotation)                               │
│                                                              │
│   6. 重复步骤2-5                                             │
│                                                              │
│   7. Refresh Token 过期，用户需要重新登录                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Refresh Token实现：**

```typescript
/**
 * Refresh Token服务
 */
class RefreshTokenService {
  private redis: any;
  private accessTokenExpiry = 900;   // 15分钟
  private refreshTokenExpiry = 604800; // 7天

  /**
   * 生成令牌对
   */
  async generateTokenPair(userId: string, deviceId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const familyId = crypto.randomUUID();  // 令牌族ID

    // 创建Refresh Token
    const refreshPayload = {
      sub: userId,
      type: 'refresh',
      deviceId,
      family: familyId,
      version: 1,
      iat: now,
      exp: now + this.refreshTokenExpiry,
    };

    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET!);

    // 创建Access Token
    const accessPayload = {
      sub: userId,
      type: 'access',
      deviceId,
      family: familyId,
      iat: now,
      exp: now + this.accessTokenExpiry,
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_ACCESS_SECRET!);

    // 存储Refresh Token信息
    await this.storeRefreshToken(refreshToken, {
      userId,
      deviceId,
      family: familyId,
      version: 1,
    });

    return { accessToken, refreshToken };
  }

  /**
   * 刷新Access Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    // 验证Refresh Token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (e) {
      return null;  // 无效的Refresh Token
    }

    // 检查Token类型
    if (payload.type !== 'refresh') {
      return null;
    }

    // 获取存储的Token信息
    const storedInfo = await this.getStoredRefreshTokenInfo(refreshToken);
    if (!storedInfo) {
      return null;
    }

    // 检查版本（用于检测令牌旋转）
    if (storedInfo.version !== payload.version) {
      // 检测到令牌旋转，所有旧令牌失效
      await this.invalidateFamily(storedInfo.family);
      return null;
    }

    // 检查用户状态
    const user = await this.getUser(storedInfo.userId);
    if (!user || user.status !== 'active') {
      return null;
    }

    // 生成新的令牌对（实现刷新令牌旋转）
    const now = Math.floor(Date.now() / 1000);
    const newFamilyId = storedInfo.family;
    const newVersion = storedInfo.version + 1;

    // 创建新的Refresh Token
    const newRefreshPayload = {
      sub: storedInfo.userId,
      type: 'refresh',
      deviceId: payload.deviceId,
      family: newFamilyId,
      version: newVersion,
      iat: now,
      exp: now + this.refreshTokenExpiry,
    };

    const newRefreshToken = jwt.sign(
      newRefreshPayload,
      process.env.JWT_REFRESH_SECRET!
    );

    // 创建新的Access Token
    const newAccessPayload = {
      sub: storedInfo.userId,
      type: 'access',
      deviceId: payload.deviceId,
      family: newFamilyId,
      iat: now,
      exp: now + this.accessTokenExpiry,
    };

    const newAccessToken = jwt.sign(
      newAccessPayload,
      process.env.JWT_ACCESS_SECRET!
    );

    // 更新存储的Refresh Token信息
    await this.storeRefreshToken(newRefreshToken, {
      userId: storedInfo.userId,
      deviceId: payload.deviceId,
      family: newFamilyId,
      version: newVersion,
    });

    // 使旧Refresh Token失效
    await this.invalidateRefreshToken(refreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * 存储Refresh Token信息
   */
  private async storeRefreshToken(token: string, info: {
    userId: string;
    deviceId: string;
    family: string;
    version: number;
  }): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `refresh_token:${tokenHash}`;

    await this.redis.set(key, JSON.stringify({
      ...info,
      createdAt: Date.now(),
    }));

    await this.redis.expire(key, this.refreshTokenExpiry);
  }

  /**
   * 获取存储的Refresh Token信息
   */
  private async getStoredRefreshTokenInfo(token: string): Promise<any | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `refresh_token:${tokenHash}`;

    const info = await this.redis.get(key);
    return info ? JSON.parse(info) : null;
  }

  /**
   * 使Refresh Token失效
   */
  private async invalidateRefreshToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.del(`refresh_token:${tokenHash}`);
  }

  /**
   * 使整个令牌族失效
   */
  private async invalidateFamily(familyId: string): Promise<void> {
    // 标记整个家族为已失效
    await this.redis.set(`family_invalidated:${familyId}`, '1');
  }

  /**
   * 获取用户信息（示例）
   */
  private async getUser(userId: string): Promise<any> {
    // 从数据库获取用户
    return { id: userId, status: 'active' };
  }
}
```

### 5.3 滑动过期策略

**滑动过期实现：**

```typescript
/**
 * 滑动过期策略
 *
 * 核心理念：用户每次使用Token，过期时间都向后滑动
 * 这样活跃用户永远不会因为Token过期而中断操作
 */

class SlidingExpirationService {
  private redis: any;
  private accessTokenExpiry = 900;   // 15分钟
  private slidingWindow = 300;        // 滑动窗口：5分钟

  /**
   * 带滑动过期的Token验证
   */
  async verifyWithSlidingExpiration(token: string): Promise<{
    valid: boolean;
    payload?: any;
    shouldRefresh?: boolean;
    newToken?: string;
  }> {
    try {
      const decoded = jwt.decode(token) as any;

      // 检查基本过期
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false };
      }

      // 检查是否需要滑动
      const timeUntilExpiry = decoded.exp * 1000 - Date.now();
      const shouldSlide = timeUntilExpiry < this.slidingWindow * 1000;

      if (shouldSlide) {
        // 生成新的Token
        const newToken = await this.slideToken(token, decoded);
        return {
          valid: true,
          payload: jwt.decode(newToken),
          shouldRefresh: true,
          newToken,
        };
      }

      return { valid: true, payload: decoded };
    } catch {
      return { valid: false };
    }
  }

  /**
   * 滑动Token过期时间
   */
  private async slideToken(oldToken: string, oldPayload: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // 新的过期时间
    const newPayload = {
      ...oldPayload,
      iat: now,
      exp: now + this.accessTokenExpiry,
      sliding: true,  // 标记发生了滑动
    };

    // 移除jti避免重复
    delete newPayload.jti;

    return jwt.sign(newPayload, process.env.JWT_ACCESS_SECRET!);
  }
}

/**
 * 滑动过期的替代方案：钝化策略
 *
 * 钝化策略：Token快过期时，验证通过但返回警告
 * 由前端决定是否刷新Token
 */
class钝化策略 {
  private warningThreshold = 300;  // 5分钟

  verify(token: string): {
    valid: boolean;
    payload?: any;
    warning?: {
      code: string;
      message: string;
      expiresIn: number;
    };
  } {
    try {
      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);

      // 检查过期
      if (decoded.exp < now) {
        return { valid: false };
      }

      // 计算剩余时间
      const expiresIn = decoded.exp - now;

      // 检查是否在警告期
      if (expiresIn < this.warningThreshold) {
        return {
          valid: true,
          payload: decoded,
          warning: {
            code: 'TOKEN_EXPIRING_SOON',
            message: 'Token即将过期，建议刷新',
            expiresIn,
          },
        };
      }

      return { valid: true, payload: decoded };
    } catch {
      return { valid: false };
    }
  }
}
```

### 5.4 实战：刷新实现完整代码

```typescript
/**
 * 完整的Token刷新系统实现
 */

import crypto from 'crypto';

// Token类型
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Refresh Token Payload
interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
  family: string;
  version: number;
  deviceId: string;
  iat: number;
  exp: number;
}

// Access Token Payload
interface AccessTokenPayload {
  sub: string;
  type: 'access';
  jti: string;
  family: string;
  deviceId: string;
  iat: number;
  exp: number;
  role: string;
  permissions: string[];
}

// Token刷新服务
class TokenRefreshService {
  private redis: any;
  private accessSecret: string;
  private refreshSecret: string;

  constructor(redis: any) {
    this.redis = redis;
    this.accessSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
  }

  /**
   * 生成新的令牌对
   */
  async generateTokens(user: {
    id: string;
    role: string;
    permissions: string[];
    deviceId: string;
  }): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const accessExp = now + 900;  // 15分钟
    const refreshExp = now + 604800;  // 7天
    const family = crypto.randomUUID();
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    // Access Token
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      type: 'access',
      jti: accessJti,
      family,
      deviceId: user.deviceId,
      iat: now,
      exp: accessExp,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(accessPayload, this.accessSecret, {
      algorithm: 'HS256',
    });

    // Refresh Token
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      jti: refreshJti,
      family,
      version: 1,
      deviceId: user.deviceId,
      iat: now,
      exp: refreshExp,
    };

    const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
      algorithm: 'HS256',
    });

    // 存储Refresh Token映射
    await this.storeRefreshTokenMapping(refreshJti, family, 1, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  /**
   * 刷新Access Token
   * 使用Refresh Token Rotation机制
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    // 1. 验证Refresh Token
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as RefreshTokenPayload;
    } catch {
      return null;
    }

    // 2. 验证Token类型
    if (payload.type !== 'refresh') {
      return null;
    }

    // 3. 检查令牌族是否已失效
    const isFamilyInvalid = await this.redis.get(`family_invalid:${payload.family}`);
    if (isFamilyInvalid) {
      // 检测到攻击（使用已失效的令牌）
      // 可选：使该用户的所有令牌失效
      return null;
    }

    // 4. 检查Token版本
    const storedVersion = await this.getStoredVersion(payload.jti);
    if (storedVersion === null || storedVersion !== payload.version) {
      // 版本不匹配，检测到令牌重用攻击
      // 使整个令牌族失效
      await this.invalidateFamily(payload.family);
      return null;
    }

    // 5. 获取用户信息
    const user = await this.getUser(payload.sub);
    if (!user || user.status !== 'active') {
      return null;
    }

    // 6. 使旧Refresh Token失效
    await this.invalidateRefreshToken(payload.jti);

    // 7. 生成新令牌对
    const now = Math.floor(Date.now() / 1000);
    const accessExp = now + 900;
    const refreshExp = now + 604800;
    const newFamily = payload.family;  // 保持同一个家族
    const newVersion = payload.version + 1;
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    // 新Access Token
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      type: 'access',
      jti: accessJti,
      family: newFamily,
      deviceId: payload.deviceId,
      iat: now,
      exp: accessExp,
      role: user.role,
      permissions: user.permissions,
    };

    const newAccessToken = jwt.sign(accessPayload, this.accessSecret, {
      algorithm: 'HS256',
    });

    // 新Refresh Token
    const newRefreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      jti: refreshJti,
      family: newFamily,
      version: newVersion,
      deviceId: payload.deviceId,
      iat: now,
      exp: refreshExp,
    };

    const newRefreshToken = jwt.sign(newRefreshPayload, this.refreshSecret, {
      algorithm: 'HS256',
    });

    // 8. 存储新Refresh Token映射
    await this.storeRefreshTokenMapping(refreshJti, newFamily, newVersion, user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  /**
   * 存储Refresh Token映射
   */
  private async storeRefreshTokenMapping(
    jti: string,
    family: string,
    version: number,
    userId: string
  ): Promise<void> {
    const key = `refresh_token:${jti}`;
    const data = JSON.stringify({
      family,
      version,
      userId,
      createdAt: Date.now(),
    });

    // 设置7天过期
    await this.redis.setex(key, 604800, data);
  }

  /**
   * 获取存储的版本
   */
  private async getStoredVersion(jti: string): Promise<number | null> {
    const key = `refresh_token:${jti}`;
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return parsed.version;
    } catch {
      return null;
    }
  }

  /**
   * 使Refresh Token失效
   */
  private async invalidateRefreshToken(jti: string): Promise<void> {
    await this.redis.del(`refresh_token:${jti}`);
  }

  /**
   * 使整个令牌族失效
   */
  private async invalidateFamily(family: string): Promise<void> {
    // 标记家族为已失效
    await this.redis.setex(`family_invalid:${family}`, 604800, '1');
  }

  /**
   * 获取用户信息（示例）
   */
  private async getUser(userId: string): Promise<any> {
    // 实现用户查询
    return { id: userId, role: 'user', permissions: [], status: 'active' };
  }

  /**
   * 撤销所有用户令牌
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // 生成新的家族ID前缀，使用户的所有旧令牌族失效
    const newInvalidFamily = `user_revoked:${userId}:${Date.now()}`;
    await this.redis.setex(newInvalidFamily, 604800, '1');
  }
}
```

---

## 六、黑名单机制

### 6.1 Redis黑名单实现

**黑名单设计原则：**

```
1. Token的jti作为key，过期时间与Token剩余有效期相同
2. 验证时先检查黑名单
3. 使用Redis的EXPIRE自动清理过期数据
```

**完整实现：**

```typescript
/**
 * Token黑名单服务
 */
class TokenBlacklistService {
  private redis: any;
  private prefix = 'blacklist:';

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * 将Token加入黑名单
   */
  async addToBlacklist(token: string, reason?: string): Promise<void> {
    // 解码Token获取jti和过期时间
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.jti) {
      console.warn('无法提取Token的jti，跳过黑名单添加');
      return;
    }

    // 计算剩余有效期
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp > now ? decoded.exp - now : 0;

    if (ttl <= 0) {
      // Token已过期，无需加入黑名单
      return;
    }

    // 存储黑名单记录
    const key = `${this.prefix}${decoded.jti}`;
    const value = JSON.stringify({
      token: this.hashToken(token),  // 只存储哈希，保护原Token
      reason: reason || 'logout',
      blacklistedAt: now,
      expiresAt: decoded.exp,
    });

    // 设置过期时间，与Token剩余有效期一致
    await this.redis.setex(key, ttl, value);

    console.log(`Token ${decoded.jti} 已加入黑名单，${ttl}秒后自动清理`);
  }

  /**
   * 检查Token是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.jti) {
      return false;
    }

    const key = `${this.prefix}${decoded.jti}`;
    const result = await this.redis.get(key);

    return result !== null;
  }

  /**
   * 批量检查多个Token
   */
  async checkMultiple(tokens: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // 使用Redis pipeline提高效率
    const pipeline = this.redis.pipeline();

    for (const token of tokens) {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        pipeline.get(`${this.prefix}${decoded.jti}`);
      }
    }

    const responses = await pipeline.exec();

    let index = 0;
    for (const token of tokens) {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti && responses[index]) {
        results.set(token, responses[index][1] !== null);
      } else {
        results.set(token, false);
      }
      index++;
    }

    return results;
  }

  /**
   * 获取Token的黑名单信息
   */
  async getBlacklistInfo(token: string): Promise<{
    blacklisted: boolean;
    reason?: string;
    blacklistedAt?: number;
  } | null> {
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.jti) {
      return null;
    }

    const key = `${this.prefix}${decoded.jti}`;
    const data = await this.redis.get(key);

    if (!data) {
      return { blacklisted: false };
    }

    try {
      const info = JSON.parse(data);
      return {
        blacklisted: true,
        reason: info.reason,
        blacklistedAt: info.blacklistedAt,
      };
    } catch {
      return { blacklisted: true };
    }
  }

  /**
   * Token哈希（保护原Token安全）
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 清空黑名单（谨慎使用）
   */
  async clearBlacklist(): Promise<number> {
    const keys = await this.redis.keys(`${this.prefix}*`);

    if (keys.length === 0) {
      return 0;
    }

    const deleted = await this.redis.del(...keys);
    return deleted;
  }

  /**
   * 获取黑名单统计
   */
  async getStats(): Promise<{
    totalBlacklisted: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    const keys = await this.redis.keys(`${this.prefix}*`);

    if (keys.length === 0) {
      return { totalBlacklisted: 0, oldestEntry: null, newestEntry: null };
    }

    const values = await this.redis.mget(...keys);
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const value of values) {
      if (value) {
        try {
          const info = JSON.parse(value);
          const timestamp = info.blacklistedAt;

          if (oldest === null || timestamp < oldest) {
            oldest = timestamp;
          }
          if (newest === null || timestamp > newest) {
            newest = timestamp;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    return {
      totalBlacklisted: keys.length,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }
}
```

### 6.2 Token版本控制

**版本控制实现：**

```typescript
/**
 * Token版本控制服务
 *
 * 原理：
 * 1. 每个用户有一个当前有效的Token版本号
 * 2. 签发Token时包含版本号
 * 3. 验证时检查Token版本与当前版本是否匹配
 * 4. 使Token失效时，递增版本号
 */

class TokenVersionService {
  private redis: any;
  private prefix = 'token_version:';
  private defaultVersion = 1;

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * 获取用户的当前Token版本
   */
  async getCurrentVersion(userId: string): Promise<number> {
    const key = `${this.prefix}${userId}`;
    const version = await this.redis.get(key);

    return version ? parseInt(version, 10) : this.defaultVersion;
  }

  /**
   * 递增Token版本
   * 使该用户的所有旧Token失效
   */
  async incrementVersion(userId: string): Promise<number> {
    const key = `${this.prefix}${userId}`;
    const newVersion = await this.redis.incr(key);

    console.log(`用户 ${userId} 的Token版本已递增: ${newVersion - 1} -> ${newVersion}`);

    return newVersion;
  }

  /**
   * 验证Token版本
   */
  async validateVersion(userId: string, tokenVersion: number): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion(userId);
    return currentVersion === tokenVersion;
  }

  /**
   * 重置Token版本
   * 谨慎使用，通常用于密码重置等场景
   */
  async resetVersion(userId: string): Promise<void> {
    const key = `${this.prefix}${userId}`;
    await this.redis.set(key, this.defaultVersion.toString());
  }

  /**
   * 获取版本信息
   */
  async getVersionInfo(userId: string): Promise<{
    currentVersion: number;
    lastIncremented: number | null;
  }> {
    const key = `${this.prefix}${userId}`;
    const metaKey = `${this.prefix}${userId}:meta`;

    const [version, meta] = await Promise.all([
      this.redis.get(key),
      this.redis.hgetall(metaKey),
    ]);

    return {
      currentVersion: version ? parseInt(version, 10) : this.defaultVersion,
      lastIncremented: meta?.lastIncremented
        ? parseInt(meta.lastIncremented, 10)
        : null,
    };
  }

  /**
   * 批量验证Token版本
   */
  async validateMultipleVersions(
    users: Array<{ userId: string; tokenVersion: number }>
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // 并行获取所有版本
    const versionPromises = users.map(async (u) => ({
      userId: u.userId,
      currentVersion: await this.getCurrentVersion(u.userId),
      tokenVersion: u.tokenVersion,
    }));

    const versionResults = await Promise.all(versionPromises);

    for (const result of versionResults) {
      results.set(
        result.userId,
        result.currentVersion === result.tokenVersion
      );
    }

    return results;
  }
}

/**
 * 集成版本控制的JWT验证中间件
 */
class VersionedJWTVerifier {
  private versionService: TokenVersionService;
  private jwtSecret: string;

  constructor(versionService: TokenVersionService, jwtSecret: string) {
    this.versionService = versionService;
    this.jwtSecret = jwtSecret;
  }

  /**
   * 验证带版本检查的Token
   */
  async verify(token: string): Promise<{
    valid: boolean;
    payload?: any;
    error?: string;
  }> {
    try {
      // 1. 基本JWT验证
      const payload = jwt.verify(token, this.jwtSecret) as any;

      // 2. 检查Token类型
      if (!payload.type || !payload.family) {
        return { valid: false, error: '无效的Token结构' };
      }

      // 3. 检查用户状态
      const currentVersion = await this.versionService.getCurrentVersion(
        payload.sub
      );

      // 4. 版本验证
      // 对于Access Token，检查family对应的版本
      // 这里假设payload中包含足够的版本信息
      if (payload.type === 'access') {
        // Access Token验证通过
        return { valid: true, payload };
      }

      // Refresh Token需要更严格的版本检查
      if (payload.type === 'refresh') {
        // 检查令牌族是否被标记为失效
        const isFamilyValid = await this.checkFamilyValidity(payload.family);
        if (!isFamilyValid) {
          return { valid: false, error: 'Token已被撤销' };
        }

        return { valid: true, payload };
      }

      return { valid: false, error: '未知的Token类型' };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }

  private async checkFamilyValidity(family: string): Promise<boolean> {
    // 检查令牌族是否被标记为失效
    // 实现省略
    return true;
  }
}
```

### 6.3 主动撤销机制

```typescript
/**
 * Token主动撤销服务
 * 支持多种撤销策略
 */

class TokenRevocationService {
  private redis: any;
  private blacklistService: TokenBlacklistService;
  private versionService: TokenVersionService;

  constructor(redis: any) {
    this.redis = redis;
    this.blacklistService = new TokenBlacklistService(redis);
    this.versionService = new TokenVersionService(redis);
  }

  /**
   * 撤销单个Token
   */
  async revokeToken(token: string, reason: string = 'user_initiated'): Promise<void> {
    await this.blacklistService.addToBlacklist(token, reason);
  }

  /**
   * 撤销用户的单个会话
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const key = `session:${userId}:${sessionId}`;
    const sessionData = await this.redis.get(key);

    if (sessionData) {
      const { accessToken, refreshToken } = JSON.parse(sessionData);

      // 将该会话的两个Token都加入黑名单
      if (accessToken) {
        await this.blacklistService.addToBlacklist(accessToken, 'session_revoked');
      }
      if (refreshToken) {
        await this.blacklistService.addToBlacklist(refreshToken, 'session_revoked');
      }

      // 删除会话记录
      await this.redis.del(key);
    }
  }

  /**
   * 撤销用户的所有Token（强制登出所有设备）
   */
  async revokeAllUserTokens(userId: string, reason: string = 'force_logout'): Promise<void> {
    // 方法1：递增Token版本
    await this.versionService.incrementVersion(userId);

    // 方法2：标记所有会话为失效
    const sessionKeys = await this.redis.keys(`session:${userId}:*`);

    for (const key of sessionKeys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        const { accessToken, refreshToken } = JSON.parse(sessionData);

        if (accessToken) {
          await this.blacklistService.addToBlacklist(accessToken, reason);
        }
        if (refreshToken) {
          await this.blacklistService.addToBlacklist(refreshToken, reason);
        }
      }
    }

    // 方法3：使用家族标识撤销
    const familyKey = `user_families:${userId}`;
    const families = await this.redis.smembers(familyKey);

    for (const family of families) {
      await this.redis.setex(`family_invalid:${family}`, 604800, '1');
    }

    console.log(`用户 ${userId} 的所有Token已被撤销`);
  }

  /**
   * 撤销特定设备的所有Token
   */
  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const deviceKey = `device:${userId}:${deviceId}`;
    const deviceData = await this.redis.get(deviceKey);

    if (deviceData) {
      const { accessToken, refreshToken } = JSON.parse(deviceData);

      if (accessToken) {
        await this.blacklistService.addToBlacklist(accessToken, 'device_revoked');
      }
      if (refreshToken) {
        await this.blacklistService.addToBlacklist(refreshToken, 'device_revoked');
      }

      await this.redis.del(deviceKey);
    }
  }

  /**
   * 密码修改后撤销所有Token
   */
  async revokeAfterPasswordChange(userId: string): Promise<void> {
    // 1. 记录密码修改时间
    await this.redis.set(
      `password_changed:${userId}`,
      Math.floor(Date.now() / 1000).toString()
    );

    // 2. 撤销所有Token
    await this.revokeAllUserTokens(userId, 'password_changed');

    // 3. 设置宽限期（可选）
    // 如果用户正在使用某个设备，允许短暂继续使用
    // 实现省略
  }

  /**
   * 检查Token是否因密码修改而失效
   */
  async isInvalidatedByPasswordChange(userId: string, tokenIat: number): Promise<boolean> {
    const passwordChangedAt = await this.redis.get(`password_changed:${userId}`);

    if (!passwordChangedAt) {
      return false;
    }

    const changedTimestamp = parseInt(passwordChangedAt, 10);
    return tokenIat < changedTimestamp;
  }

  /**
   * 管理员撤销Token
   */
  async adminRevokeToken(token: string, adminId: string, reason: string): Promise<void> {
    const decoded = jwt.decode(token) as any;

    // 记录管理操作
    await this.redis.lpush('admin_revocations', JSON.stringify({
      adminId,
      targetUserId: decoded?.sub,
      reason,
      tokenJti: decoded?.jti,
      timestamp: Date.now(),
    }));

    // 执行撤销
    await this.blacklistService.addToBlacklist(token, `admin_revoked: ${reason}`);
  }

  /**
   * 获取撤销历史
   */
  async getRevocationHistory(userId?: string, limit: number = 100): Promise<any[]> {
    const history = await this.redis.lrange('admin_revocations', 0, limit - 1);

    const parsed = history.map(h => JSON.parse(h));

    if (userId) {
      return parsed.filter(h => h.targetUserId === userId);
    }

    return parsed;
  }
}
```

### 6.4 实战：完整黑名单实现

```typescript
/**
 * 完整的Token黑名单与撤销系统
 */

// 撤销原因枚举
enum RevocationReason {
  LOGOUT = 'logout',
  SESSION_REVOKED = 'session_revoked',
  FORCE_LOGOUT = 'force_logout',
  PASSWORD_CHANGED = 'password_changed',
  DEVICE_REVOKED = 'device_revoked',
  SECURITY_BREACH = 'security_breach',
  ADMIN_REVOKED = 'admin_revoked',
  TOKEN_EXPIRED = 'token_expired',
}

// 撤销记录
interface RevocationRecord {
  jti: string;
  reason: RevocationReason;
  userId: string;
  revokedAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

// 黑名单检查结果
interface BlacklistCheckResult {
  isBlacklisted: boolean;
  reason?: RevocationReason;
  revokedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * 企业级Token黑名单服务
 */
class EnterpriseTokenBlacklist {
  private redis: any;
  private prefix = 'tk_bl:';
  private historyPrefix = 'tk_hist:';
  private familyPrefix = 'tk_family:';

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * 添加Token到黑名单
   */
  async blacklist(token: string, reason: RevocationReason, metadata?: Record<string, any>): Promise<void> {
    const decoded = jwt.decode(token) as any;

    if (!decoded?.jti || !decoded?.exp) {
      console.warn('无法提取Token的jti或exp，跳过黑名单添加');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl <= 0) {
      // Token已过期，无需黑名单
      return;
    }

    // 构建黑名单记录
    const record: RevocationRecord = {
      jti: decoded.jti,
      reason,
      userId: decoded.sub || '',
      revokedAt: now,
      expiresAt: decoded.exp,
      metadata,
    };

    const key = `${this.prefix}${decoded.jti}`;
    const value = JSON.stringify(record);

    // 存储黑名单记录
    await this.redis.setex(key, ttl, value);

    // 如果有令牌族，也标记家族为失效
    if (decoded.family) {
      await this.blacklistFamily(decoded.family, ttl);
    }

    // 记录到历史（可选，用于审计）
    await this.addToHistory(record);

    console.log(`Token ${decoded.jti} 已加入黑名单 (${reason})`);
  }

  /**
   * 检查Token是否在黑名单
   */
  async isBlacklisted(token: string): Promise<BlacklistCheckResult> {
    const decoded = jwt.decode(token) as any;

    if (!decoded?.jti) {
      return { isBlacklisted: false };
    }

    const key = `${this.prefix}${decoded.jti}`;
    const data = await this.redis.get(key);

    if (!data) {
      // 检查令牌族是否被标记为失效
      if (decoded.family) {
        const familyInvalid = await this.redis.get(`${this.familyPrefix}${decoded.family}`);
        if (familyInvalid) {
          return {
            isBlacklisted: true,
            reason: RevocationReason.SESSION_REVOKED,
          };
        }
      }

      return { isBlacklisted: false };
    }

    try {
      const record: RevocationRecord = JSON.parse(data);
      return {
        isBlacklisted: true,
        reason: record.reason,
        revokedAt: record.revokedAt,
        metadata: record.metadata,
      };
    } catch {
      return { isBlacklisted: true };
    }
  }

  /**
   * 标记令牌族为失效
   */
  private async blacklistFamily(family: string, ttl: number): Promise<void> {
    const key = `${this.familyPrefix}${family}`;
    await this.redis.setex(key, ttl, '1');
  }

  /**
   * 添加到撤销历史
   */
  private async addToHistory(record: RevocationRecord): Promise<void> {
    const key = `${this.historyPrefix}${record.userId}`;
    await this.redis.lpush(key, JSON.stringify(record));
    await this.redis.ltrim(key, 0, 999);  // 只保留最近1000条
  }

  /**
   * 获取用户的撤销历史
   */
  async getUserRevocationHistory(userId: string, limit: number = 50): Promise<RevocationRecord[]> {
    const key = `${this.historyPrefix}${userId}`;
    const history = await this.redis.lrange(key, 0, limit - 1);

    return history.map(h => JSON.parse(h));
  }

  /**
   * 批量检查Token
   */
  async checkMultiple(tokens: string[]): Promise<Map<string, BlacklistCheckResult>> {
    const results = new Map<string, BlacklistCheckResult>();

    if (tokens.length === 0) {
      return results;
    }

    // 使用pipeline提高效率
    const pipeline = this.redis.pipeline();

    for (const token of tokens) {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        pipeline.get(`${this.prefix}${decoded.jti}`);
      }
    }

    const responses = await pipeline.exec();

    let index = 0;
    for (const token of tokens) {
      const decoded = jwt.decode(token) as any;

      if (!decoded?.jti) {
        results.set(token, { isBlacklisted: false });
        continue;
      }

      const response = responses[index];
      if (response && response[1]) {
        try {
          const record: RevocationRecord = JSON.parse(response[1]);
          results.set(token, {
            isBlacklisted: true,
            reason: record.reason,
            revokedAt: record.revokedAt,
          });
        } catch {
          results.set(token, { isBlacklisted: true });
        }
      } else {
        results.set(token, { isBlacklisted: false });
      }

      index++;
    }

    return results;
  }

  /**
   * 获取黑名单统计信息
   */
  async getStatistics(): Promise<{
    totalBlacklisted: number;
    byReason: Record<RevocationReason, number>;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    const keys = await this.redis.keys(`${this.prefix}*`);

    const stats = {
      totalBlacklisted: keys.length,
      byReason: {} as Record<RevocationReason, number>,
      oldestEntry: null as number | null,
      newestEntry: null as number | null,
    };

    // 初始化原因统计
    for (const reason of Object.values(RevocationReason)) {
      stats.byReason[reason] = 0;
    }

    if (keys.length === 0) {
      return stats;
    }

    // 批量获取数据
    const values = await this.redis.mget(...keys);

    for (const value of values) {
      if (value) {
        try {
          const record: RevocationRecord = JSON.parse(value);
          stats.byReason[record.reason]++;

          if (stats.oldestEntry === null || record.revokedAt < stats.oldestEntry) {
            stats.oldestEntry = record.revokedAt;
          }
          if (stats.newestEntry === null || record.revokedAt > stats.newestEntry) {
            stats.newestEntry = record.revokedAt;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    return stats;
  }

  /**
   * 清理过期记录（通常由Redis TTL自动处理）
   */
  async cleanup(): Promise<number> {
    // 由于使用了Redis的TTL，大部分清理是自动的
    // 这个方法主要用于清理历史记录中的过期条目
    const userKeys = await this.redis.keys(`${this.historyPrefix}*`);
    let cleaned = 0;

    for (const key of userKeys) {
      // 获取列表长度，保留最近的记录
      const length = await this.redis.llen(key);
      if (length > 1000) {
        await this.redis.ltrim(key, 0, 999);
        cleaned += length - 1000;
      }
    }

    return cleaned;
  }
}
```

---

## 七、无状态认证

### 7.1 Token验证流程

**无状态认证的核心：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    无状态认证流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   客户端                        服务端                          │
│     │                              │                            │
│     │  1. 发送登录请求             │                            │
│     │────────────────────────────>│                            │
│     │                              │                            │
│     │  2. 验证凭据，生成JWT         │                            │
│     │  （不存储会话）               │                            │
│     │<────────────────────────────│  3. 返回JWT                 │
│     │                              │                            │
│     │  4. 携带JWT访问受保护资源     │                            │
│     │  Authorization: Bearer xxx  │                            │
│     │─────────────────────────────>│                            │
│     │                              │                            │
│     │  5. 验证JWT签名和声明        │                            │
│     │  （无需查询数据库）           │                            │
│     │                              │                            │
│     │  6. 返回受保护的资源         │                            │
│     │<─────────────────────────────│                            │
│     │                              │                            │
└─────────────────────────────────────────────────────────────────┘
```

**无状态验证实现：**

```typescript
/**
 * 无状态JWT认证服务
 */

interface StatelessTokenPayload {
  sub: string;           // 用户ID
  role: string;          // 用户角色
  permissions: string[]; // 权限列表
  sessionId: string;      // 会话ID
  deviceId: string;       // 设备ID
  iat: number;            // 签发时间
  exp: number;            // 过期时间
  jti: string;            // Token唯一ID
  iss: string;            // 签发者
  aud: string;            // 受众
}

class StatelessAuthService {
  private secret: string;
  private issuer: string;
  private audience: string;

  constructor(secret: string, issuer: string, audience: string) {
    this.secret = secret;
    this.issuer = issuer;
    this.audience = audience;
  }

  /**
   * 生成无状态Token
   */
  generateToken(user: {
    id: string;
    role: string;
    permissions: string[];
  }, session: {
    id: string;
    deviceId: string;
  }): string {
    const now = Math.floor(Date.now() / 1000);

    const payload: StatelessTokenPayload = {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      sessionId: session.id,
      deviceId: session.deviceId,
      iat: now,
      exp: now + 900,  // 15分钟
      jti: crypto.randomUUID(),
      iss: this.issuer,
      aud: this.audience,
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
    });
  }

  /**
   * 验证无状态Token
   * 这是无状态认证的核心：只需验证签名和声明，无需查询数据库
   */
  verifyToken(token: string): {
    valid: boolean;
    payload?: StatelessTokenPayload;
    error?: string;
  } {
    try {
      // 验证Token
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      }) as StatelessTokenPayload;

      // 额外检查：确保必要字段存在
      if (!decoded.sub || !decoded.jti || !decoded.sessionId) {
        return { valid: false, error: 'Token缺少必要字段' };
      }

      // 检查过期（jwt.verify已经会检查，但可以手动再次确认）
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return { valid: false, error: 'Token已过期' };
      }

      // 检查生效时间
      if (decoded.iat > now + 60) {  // 允许最多60秒的时间误差
        return { valid: false, error: 'Token尚未生效' };
      }

      return { valid: true, payload: decoded };
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token已过期' };
      }
      if ( e instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: `JWT错误: ${e.message}` };
      }
      return { valid: false, error: (e as Error).message };
    }
  }

  /**
   * 解码Token（不验证）
   * 谨慎使用，仅用于日志记录等场景
   */
  decodeToken(token: string): StatelessTokenPayload | null {
    try {
      return jwt.decode(token) as StatelessTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * 批量验证Token
   */
  verifyMultiple(tokens: string[]): Map<string, {
    valid: boolean;
    payload?: StatelessTokenPayload;
    error?: string;
  }> {
    const results = new Map();

    for (const token of tokens) {
      results.set(token, this.verifyToken(token));
    }

    return results;
  }
}
```

### 7.2 分布式认证

**分布式环境下的无状态认证：**

```typescript
/**
 * 分布式无状态认证服务
 *
 * 设计要点：
 * 1. Token本身包含所有验证所需信息
 * 2. 各服务使用相同的密钥验证Token
 * 3. 无需共享会话存储
 */

class DistributedAuthService {
  private sharedSecret: string;
  private services: string[];

  constructor(sharedSecret: string, services: string[]) {
    this.sharedSecret = sharedSecret;
    this.services = services;
  }

  /**
   * 跨服务生成统一Token
   */
  generateCrossServiceToken(
    userId: string,
    targetService: string,
    permissions: string[]
  ): string {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign({
      sub: userId,
      iss: 'auth-service',
      aud: targetService,  // 指定目标服务
      permissions,
      iat: now,
      exp: now + 3600,    // 1小时
      jti: crypto.randomUUID(),
      type: 'cross-service',
    }, this.sharedSecret, { algorithm: 'HS256' });
  }

  /**
   * 各服务验证Token
   */
  verifyForService(token: string, serviceName: string): {
    valid: boolean;
    userId?: string;
    permissions?: string[];
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, this.sharedSecret, {
        algorithms: ['HS256'],
      }) as any;

      // 验证受众
      if (decoded.aud !== serviceName && decoded.aud !== 'all') {
        return { valid: false, error: 'Token不适用于此服务' };
      }

      // 验证签发者
      if (!this.services.includes(decoded.iss)) {
        return { valid: false, error: '未知的签发者' };
      }

      return {
        valid: true,
        userId: decoded.sub,
        permissions: decoded.permissions,
      };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }

  /**
   * 生成服务间通信Token
   */
  generateServiceToken(
    fromService: string,
    toService: string,
    scope: string[]
  ): string {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign({
      iss: fromService,
      aud: toService,
      scope,
      iat: now,
      exp: now + 300,  // 5分钟
      jti: crypto.randomUUID(),
      type: 'service-to-service',
    }, this.sharedSecret, { algorithm: 'HS256' });
  }

  /**
   * 验证服务间通信Token
   */
  verifyServiceToken(token: string, expectedAudience: string): {
    valid: boolean;
    fromService?: string;
    scope?: string[];
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, this.sharedSecret, {
        algorithms: ['HS256'],
      }) as any;

      // 验证受众
      if (decoded.aud !== expectedAudience) {
        return { valid: false, error: 'Token受众不匹配' };
      }

      // 验证类型
      if (decoded.type !== 'service-to-service') {
        return { valid: false, error: '无效的Token类型' };
      }

      return {
        valid: true,
        fromService: decoded.iss,
        scope: decoded.scope,
      };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }
}

/**
 * API网关无状态认证
 */
class APIGatewayAuth {
  private jwtVerifier: StatelessAuthService;

  constructor(secret: string) {
    this.jwtVerifier = new StatelessAuthService(
      secret,
      'api-gateway',
      'api-services'
    );
  }

  /**
   * 网关中间件：验证所有传入请求
   */
  async gatewayMiddleware(ctx: {
    headers: Record<string, string>;
  }): Promise<{
    authenticated: boolean;
    userId?: string;
    role?: string;
    error?: string;
  }> {
    const authHeader = ctx.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: '缺少认证Token' };
    }

    const token = authHeader.substring(7);
    const result = this.jwtVerifier.verifyToken(token);

    if (!result.valid) {
      return { authenticated: false, error: result.error };
    }

    return {
      authenticated: true,
      userId: result.payload!.sub,
      role: result.payload!.role,
    };
  }

  /**
   * 路由到后端服务时，传递用户信息
   */
  forwardToBackend(ctx: {
    headers: Record<string, string>;
    userId?: string;
    role?: string;
    permissions?: string[];
  }): Record<string, string> {
    // 在请求头中传递用户信息
    return {
      ...ctx.headers,
      'X-User-Id': ctx.userId || '',
      'X-User-Role': ctx.role || '',
      'X-User-Permissions': (ctx.permissions || []).join(','),
      // 可以添加签名防止头信息伪造
      'X-Header-Signature': this.signHeaders(ctx.headers),
    };
  }

  private signHeaders(headers: Record<string, string>): string {
    const headerString = Object.entries(headers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return crypto
      .createHmac('sha256', this.sharedSecret)
      .update(headerString)
      .digest('hex');
  }
}
```

### 7.3 性能考虑

```typescript
/**
 * 无状态认证的性能优化
 */

/**
 * 1. Token验证缓存
 */
class TokenVerificationCache {
  private redis: any;
  private cachePrefix = 'tk_cache:';
  private defaultTTL = 60;  // 缓存60秒

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * 获取缓存的验证结果
   */
  async getCachedResult(token: string): Promise<{
    cached: boolean;
    payload?: any;
  }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `${this.cachePrefix}${tokenHash}`;

    const cached = await this.redis.get(key);

    if (cached) {
      try {
        return { cached: true, payload: JSON.parse(cached) };
      } catch {
        return { cached: false };
      }
    }

    return { cached: false };
  }

  /**
   * 缓存验证结果
   */
  async cacheResult(token: string, payload: any, ttl?: number): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `${this.cachePrefix}${tokenHash}`;

    // TTL不能超过Token的剩余有效期
    const now = Math.floor(Date.now() / 1000);
    const maxTTL = payload.exp - now;
    const cacheTTL = Math.min(ttl || this.defaultTTL, maxTTL);

    if (cacheTTL > 0) {
      await this.redis.setex(key, cacheTTL, JSON.stringify(payload));
    }
  }

  /**
   * 使缓存失效
   */
  async invalidate(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.del(`${this.cachePrefix}${tokenHash}`);
  }
}

/**
 * 2. 优化的验证中间件
 */
class OptimizedAuthMiddleware {
  private cache: TokenVerificationCache;
  private blacklist: EnterpriseTokenBlacklist;
  private verifier: StatelessAuthService;

  constructor(
    redis: any,
    jwtSecret: string,
    issuer: string,
    audience: string
  ) {
    this.cache = new TokenVerificationCache(redis);
    this.blacklist = new EnterpriseTokenBlacklist(redis);
    this.verifier = new StatelessAuthService(jwtSecret, issuer, audience);
  }

  /**
   * 高性能验证
   * 流程：
   * 1. 检查缓存
   * 2. 检查黑名单
   * 3. 验证Token
   * 4. 缓存结果
   */
  async authenticate(token: string): Promise<{
    authenticated: boolean;
    payload?: any;
    error?: string;
  }> {
    // 1. 先检查黑名单（快速失败）
    const blacklistResult = await this.blacklist.isBlacklisted(token);
    if (blacklistResult.isBlacklisted) {
      return {
        authenticated: false,
        error: 'Token已被撤销',
      };
    }

    // 2. 检查缓存
    const { cached, payload: cachedPayload } = await this.cache.getCachedResult(token);
    if (cached && cachedPayload) {
      return {
        authenticated: true,
        payload: cachedPayload,
      };
    }

    // 3. 验证Token
    const verifyResult = this.verifier.verifyToken(token);

    if (!verifyResult.valid) {
      return {
        authenticated: false,
        error: verifyResult.error,
      };
    }

    // 4. 缓存结果
    await this.cache.cacheResult(token, verifyResult.payload);

    return {
      authenticated: true,
      payload: verifyResult.payload,
    };
  }
}

/**
 * 3. 批量认证优化
 */
class BatchAuthService {
  private verifier: StatelessAuthService;

  constructor(secret: string, issuer: string, audience: string) {
    this.verifier = new StatelessAuthService(secret, issuer, audience);
  }

  /**
   * 批量验证Token
   * 使用Promise.all并行验证
   */
  async authenticateBatch(
    tokens: string[]
  ): Promise<Map<string, { valid: boolean; payload?: any; error?: string }>> {
    // 并行验证
    const results = await Promise.all(
      tokens.map(async token => ({
        token,
        result: this.verifier.verifyToken(token),
      }))
    );

    // 转换为Map
    const resultMap = new Map();
    for (const { token, result } of results) {
      resultMap.set(token, result);
    }

    return resultMap;
  }

  /**
   * 批量提取用户ID
   */
  extractUserIds(tokens: string[]): string[] {
    const userIds: string[] = [];

    for (const token of tokens) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.sub && !userIds.includes(decoded.sub)) {
          userIds.push(decoded.sub);
        }
      } catch {
        // 忽略解码错误
      }
    }

    return userIds;
  }
}

/**
 * 4. 连接池配置
 */
class AuthConnectionPool {
  private pool: any;

  constructor() {
    // Redis连接池配置
    this.pool = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),

      // 连接池优化参数
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return new Error('Redis连接重试次数超过限制');
        }
        return Math.min(times * 100, 3000);
      },

      // 性能优化
      connectTimeout: 10000,
      lazyConnect: false,
      keepAlive: 30000,
    };
  }

  getPoolConfig() {
    return this.pool;
  }
}
```

### 7.4 实战：NestJS无状态认证实现

```typescript
/**
 * NestJS无状态JWT认证完整实现
 */

// src/auth/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('缺少认证Token');
    }

    const payload = await this.jwtService.verify(token);

    if (!payload) {
      throw new UnauthorizedException('无效的认证Token');
    }

    // 将用户信息附加到请求对象
    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') || [];
    return type === 'Bearer' ? token : null;
  }
}

// src/auth/roles.guard.ts
import { Injectable, CanActivate, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.role === role);
  }
}

// src/auth/jwt.service.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET!;
  private readonly issuer = 'nestjs-app';
  private readonly audience = 'nestjs-client';

  /**
   * 生成Token
   */
  sign(payload: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
  }): string {
    return jwt.sign(
      {
        ...payload,
        jti: crypto.randomUUID(),
      },
      this.secret,
      {
        algorithm: 'HS256',
        issuer: this.issuer,
        audience: this.audience,
        expiresIn: '15m',
      }
    );
  }

  /**
   * 验证Token
   */
  verify(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.secret,
        {
          algorithms: ['HS256'],
          issuer: this.issuer,
          audience: this.audience,
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
  }

  /**
   * 解码Token
   */
  decode(token: string): any {
    return jwt.decode(token);
  }
}

// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles, RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // 验证用户凭据（示例）
    const user = await this.validateUser(body.email, body.password);

    if (!user) {
      throw new Error('无效的凭据');
    }

    // 生成Token
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminOnly() {
    return { message: '这是管理员专属接口' };
  }

  private async validateUser(email: string, password: string) {
    // 实现用户验证逻辑
    return null;
  }
}

// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [JwtService, JwtAuthGuard, RolesGuard],
  exports: [JwtService],
})
export class AuthModule {}
```

---

## 八、常见攻击与防护

### 8.1 CSRF攻击

**攻击原理：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      CSRF攻击流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   用户已登录example.com，Token存储在Cookie中                      │
│                                                                  │
│   攻击者诱导用户访问恶意网站evil.com                              │
│                                                                  │
│   恶意网站发送请求到example.com:                                 │
│   <form action="https://example.com/api/transfer">              │
│     <input name="to" value="attacker" />                         │
│     <input name="amount" value="10000" />                        │
│   </form>                                                        │
│                                                                  │
│   浏览器自动携带Cookie发送请求                                   │
│   请求被服务器验证为合法（因为Cookie中有有效Token）               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**防护措施：**

```typescript
/**
 * CSRF防护措施
 */

// 1. SameSite Cookie
const csrfPreventionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // 严格模式：完全防止CSRF
  // 或使用'lax'：在顶级导航中使用
};

// 2. CSRF Token
class CSRFProtection {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * 生成CSRF Token
   */
  generateToken(sessionId: string): string {
    const payload = {
      sessionId,
      type: 'csrf',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.secret, { algorithm: 'HS256' });
  }

  /**
   * 验证CSRF Token
   */
  verifyToken(sessionId: string, token: string): boolean {
    try {
      const decoded = jwt.verify(token, this.secret) as any;

      // 验证会话ID匹配
      if (decoded.sessionId !== sessionId) {
        return false;
      }

      // 验证Token类型
      if (decoded.type !== 'csrf') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 双提交Cookie技术
   */
  validateDoubleSubmit(
    cookieToken: string,
    headerToken: string
  ): boolean {
    // 验证Cookie中的Token和请求头中的Token是否匹配
    return cookieToken === headerToken;
  }
}

// 3. 自定义请求头验证
class HeaderBasedCSRFProtection {
  private allowedOrigins = ['https://example.com'];

  /**
   * 验证请求来源
   */
  validateOrigin(request: any): boolean {
    const origin = request.headers.origin;
    const referer = request.headers.referer;

    // 检查Origin或Referer头
    if (origin && this.allowedOrigins.includes(origin)) {
      return true;
    }

    if (referer && this.allowedOrigins.some(o => referer.startsWith(o))) {
      return true;
    }

    return false;
  }

  /**
   * 要求特定的自定义头
   */
  validateCustomHeader(request: any): boolean {
    // 例如：X-Requested-With 或 X-CSRF-Token
    const customHeader = request.headers['x-csrf-token'];
    return !!customHeader && customHeader.length > 0;
  }
}

// 4. NestJS CSRF Guard实现
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  private csrfService: CSRFProtection;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 跳过非POST/PUT/DELETE请求
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // 检查Origin
    const origin = request.headers.origin;
    if (!origin) {
      throw new Error('缺少Origin头');
    }

    // 验证Origin
    if (!this.isAllowedOrigin(origin)) {
      throw new Error('不允许的Origin');
    }

    // 验证CSRF Token
    const csrfToken = request.headers['x-csrf-token'];
    const sessionId = request.session?.id;

    if (!sessionId || !csrfToken) {
      throw new Error('缺少CSRF Token');
    }

    if (!this.csrfService.verifyToken(sessionId, csrfToken)) {
      throw new Error('无效的CSRF Token');
    }

    return true;
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://example.com',
      'https://www.example.com',
    ];
    return allowedOrigins.includes(origin);
  }
}
```

### 8.2 XSS攻击

**攻击原理：**

```
攻击者向目标网站注入恶意JavaScript代码
当其他用户访问该页面时，恶意脚本执行
恶意脚本可以：
1. 读取Cookie中的Token
2. 读取LocalStorage中的Token
3. 读取Token并发送到攻击者服务器
4. 操作用户会话
```

**防护措施：**

```typescript
/**
 * XSS防护措施
 */

// 1. HttpOnly Cookie（防止JavaScript读取）
const secureCookieOptions = {
  httpOnly: true,   // 禁止JavaScript访问
  secure: true,
  sameSite: 'strict',
};

// 2. Content Security Policy
const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",  // 只允许同源脚本
    "style-src 'self' 'unsafe-inline'",  // 限制样式
    "img-src 'self' data:",  // 限制图片源
    "connect-src 'self'",  // 限制AJAX请求目标
    "frame-ancestors 'none'",  // 禁止嵌入iframe
  ].join('; '),
};

// 3. 输入验证和输出编码
class XSSPrevention {
  /**
   * HTML编码
   */
  htmlEncode(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * JavaScript编码
   */
  jsEncode(input: string): string {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/</g, '\\<')
      .replace(/>/g, '\\>');
  }

  /**
   * URL编码
   */
  urlEncode(input: string): string {
    return encodeURIComponent(input);
  }
}

// 4. Token存储策略
class SecureTokenStorage {
  /**
   * 安全的Token存储
   * 方案1：HttpOnly Cookie + CSRF Token
   * 方案2：内存存储 + Worker
   * 方案3：Session Storage + 每次请求验证
   */

  /**
   * 内存存储（最安全但体验较差）
   */
  private memoryToken: string | null = null;

  setMemoryToken(token: string): void {
    this.memoryToken = token;
  }

  getMemoryToken(): string | null {
    return this.memoryToken;
  }

  clearMemoryToken(): void {
    this.memoryToken = null;
  }

  /**
   * 使用Subresource Integrity (SRI)
   */
  generateSRIHash(scriptContent: string): string {
    // 生成脚本的hash值
    const hash = crypto.createHash('sha256')
      .update(scriptContent)
      .digest('base64');

    return `sha256-${hash}`;
  }
}

// 5. XSS Filter中间件
import { Middleware } from './middleware';

class XSSProtectionMiddleware implements Middleware {
  private htmlEncode = new XSSPrevention().htmlEncode;

  process(request: any, response: any, next: Function): void {
    // 清理请求体中的可疑输入
    this.sanitizeRequestBody(request.body);

    // 设置安全响应头
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });

    next();
  }

  private sanitizeRequestBody(body: any): any {
    if (typeof body === 'string') {
      return this.htmlEncode(body);
    }

    if (typeof body === 'object' && body !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        sanitized[key] = this.sanitizeRequestBody(value);
      }
      return sanitized;
    }

    return body;
  }
}
```

### 8.3 重放攻击

**攻击原理：**

```
攻击者截获合法的认证请求
攻击者稍后重新发送相同的请求
服务器无法区分这是重复请求还是新的合法请求
```

**防护措施：**

```typescript
/**
 * 重放攻击防护
 */

// 1. 时间戳验证
class TimestampValidator {
  private maxAge = 300;  // 5分钟

  /**
   * 验证时间戳是否在有效期内
   */
  validateTimestamp(tokenTimestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - tokenTimestamp;

    // 检查是否太旧
    if (age > this.maxAge) {
      return false;
    }

    // 检查是否是未来时间（时钟偏差）
    if (tokenTimestamp > now + 60) {  // 允许最多60秒偏差
      return false;
    }

    return true;
  }

  /**
   * 在Token中包含时间戳
   */
  includeTimestamp(payload: any): any {
    return {
      ...payload,
      ts: Math.floor(Date.now() / 1000),
    };
  }
}

// 2. Nonce机制
class NonceService {
  private redis: any;
  private nonceTTL = 300;  // Nonce有效期5分钟

  /**
   * 生成并存储Nonce
   */
  async generateAndStoreNonce(): Promise<string> {
    const nonce = crypto.randomBytes(16).toString('hex');
    const key = `nonce:${nonce}`;

    await this.redis.set(key, '1', 'EX', this.nonceTTL);

    return nonce;
  }

  /**
   * 验证并消费Nonce（一次性使用）
   */
  async consumeAndValidate(nonce: string): Promise<boolean> {
    const key = `nonce:${nonce}`;

    // 使用DEL而不是GET，原子性地检查和删除
    const deleted = await this.redis.del(key);

    // 如果deleted为1，说明Nonce存在且未被使用
    // 如果deleted为0，说明Nonce不存在（已使用或无效）
    return deleted === 1;
  }

  /**
   * 检查Nonce是否存在（不删除）
   */
  async exists(nonce: string): Promise<boolean> {
    const key = `nonce:${nonce}`;
    return (await this.redis.exists(key)) === 1;
  }
}

// 3. JTI + Redis实现
class JTIReplayProtection {
  private redis: any;

  /**
   * 检查JTI是否已使用
   */
  async isJTIConsumed(jti: string): Promise<boolean> {
    const key = `jti:${jti}`;
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * 标记JTI为已使用
   */
  async markJTIConsumed(jti: string, ttl: number): Promise<void> {
    const key = `jti:${jti}`;
    await this.redis.setex(key, ttl, '1');
  }

  /**
   * 验证Token并标记JTI
   */
  async verifyAndConsume(token: string, secret: string): Promise<{
    valid: boolean;
    payload?: any;
    error?: string;
  }> {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded?.jti) {
        return { valid: false, error: 'Token缺少JTI' };
      }

      // 检查TTL
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) {
        return { valid: false, error: 'Token已过期' };
      }

      // 尝试标记JTI（原子操作）
      const key = `jti:${decoded.jti}`;
      const wasSet = await this.redis.set(key, '1', 'EX', ttl, 'NX');

      // 如果wasSet为null，说明JTI已被使用
      if (!wasSet) {
        return { valid: false, error: '检测到重放攻击' };
      }

      // 验证签名
      const payload = jwt.verify(token, secret);

      return { valid: true, payload };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }
}

// 4. 完整的重放保护中间件
class ReplayProtectionMiddleware {
  private nonceService: NonceService;
  private timestampValidator: TimestampValidator;

  constructor(redis: any) {
    this.nonceService = new NonceService(redis);
    this.timestampValidator = new TimestampValidator();
  }

  /**
   * 生成防重放Token
   */
  async generateProtectedToken(userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const nonce = await this.nonceService.generateAndStoreNonce();

    return jwt.sign({
      sub: userId,
      ts: now,
      nonce,
    }, process.env.JWT_SECRET!, {
      algorithm: 'HS256',
      expiresIn: 300,  // 5分钟
    });
  }

  /**
   * 验证防重放Token
   */
  async verifyProtectedToken(token: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded) {
        return { valid: false, error: '无效的Token' };
      }

      // 验证时间戳
      if (!this.timestampValidator.validateTimestamp(decoded.ts)) {
        return { valid: false, error: 'Token时间戳无效' };
      }

      // 验证并消费Nonce
      const nonceValid = await this.nonceService.consumeAndValidate(decoded.nonce);
      if (!nonceValid) {
        return { valid: false, error: '检测到重放攻击' };
      }

      // 验证签名
      jwt.verify(token, process.env.JWT_SECRET!);

      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }
}
```

### 8.4 密钥爆破攻击

**攻击原理：**

```
攻击者尝试使用大量可能的密钥验证Token签名
如果密钥不够强，可能被暴力破解
```

**防护措施：**

```typescript
/**
 * 密钥爆破防护
 */

// 1. 使用强密钥
class KeyGeneration {
  /**
   * 生成符合JWT要求的强密钥
   */
  static generateSecureKey(bits: number = 256): string {
    if (bits < 256) {
      throw new Error('JWT密钥至少需要256位（32字节）');
    }

    return crypto.randomBytes(bits / 8).toString('hex');
  }

  /**
   * 从主密码派生密钥
   */
  static deriveKey(masterPassword: string, salt: string): string {
    return crypto.pbkdf2Sync(
      masterPassword,
      salt,
      100000,  // 迭代次数
      32,      // 输出长度
      'sha256'
    ).toString('hex');
  }

  /**
   * 验证密钥强度
   */
  static validateKeyStrength(key: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (key.length >= 32) score += 2;
    else feedback.push('密钥长度至少32字符');

    if (/[a-z]/.test(key)) score += 1;
    else feedback.push('应包含小写字母');

    if (/[A-Z]/.test(key)) score += 1;
    else feedback.push('应包含大写字母');

    if (/[0-9]/.test(key)) score += 1;
    else feedback.push('应包含数字');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(key)) score += 1;
    else feedback.push('应包含特殊字符');

    if (/(.)\1{2,}/.test(key)) {
      score = Math.max(0, score - 1);
      feedback.push('不应包含连续重复字符');
    }

    const commonPasswords = [
      'password', 'qwerty', 'admin', 'letmein',
      '123456', 'abcdef', 'monkey', 'dragon'
    ];

    if (commonPasswords.some(p => key.toLowerCase().includes(p))) {
      score = Math.max(0, score - 3);
      feedback.push('不应包含常见密码');
    }

    return {
      valid: score >= 4 && key.length >= 32,
      score,
      feedback,
    };
  }
}

// 2. 密钥哈希存储
class SecureKeyStorage {
  private redis: any;

  /**
   * 哈希密钥后存储
   */
  async storeHashedKey(keyId: string, key: string): Promise<void> {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const salt = crypto.randomBytes(16).toString('hex');

    // 使用Argon2或bcrypt哈希密钥
    const keyer = await this.hashKeyWithArgon2(key, salt);

    // 存储哈希值和盐
    await this.redis.set(`key:${keyId}`, JSON.stringify({
      hash: keyer,
      salt,
      createdAt: Date.now(),
    }));
  }

  /**
   * Argon2哈希
   */
  private async hashKeyWithArgon2(key: string, salt: string): Promise<string> {
    // 使用argon2库
    // const argon2 = require('argon2');
    // return await argon2.hash(key, { salt: Buffer.from(salt, 'hex') });

    // 临时实现：使用PBKDF2
    return crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256').toString('hex');
  }

  /**
   * 验证密钥
   */
  async verifyKey(keyId: string, key: string): Promise<boolean> {
    const stored = await this.redis.get(`key:${keyId}`);

    if (!stored) {
      return false;
    }

    const { hash, salt } = JSON.parse(stored);
    const verifyHash = await this.hashKeyWithArgon2(key, salt);

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  }
}

// 3. 密钥访问限流
class KeyAccessRateLimiter {
  private redis: any;
  private maxAttempts = 5;
  private lockoutDuration = 900;  // 15分钟

  /**
   * 记录密钥访问尝试
   */
  async recordAttempt(identifier: string): Promise<{
    allowed: boolean;
    attemptsRemaining: number;
    lockedUntil: number | null;
  }> {
    const key = `key_attempts:${identifier}`;

    // 获取当前尝试次数
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      // 首次尝试，设置过期时间
      await this.redis.expire(key, this.lockoutDuration);
    }

    if (attempts > this.maxAttempts) {
      // 计算锁定剩余时间
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockedUntil: Date.now() + ttl * 1000,
      };
    }

    return {
      allowed: true,
      attemptsRemaining: this.maxAttempts - attempts,
      lockedUntil: null,
    };
  }

  /**
   * 清除访问记录
   */
  async clearAttempts(identifier: string): Promise<void> {
    await this.redis.del(`key_attempts:${identifier}`);
  }
}

// 4. 多因素验证保护
class MultiFactorProtection {
  /**
   * 敏感操作需要额外验证
   */
  async verifyWithMFA(
    userId: string,
    action: string,
    mfaToken: string
  ): Promise<boolean> {
    // 验证MFA Token
    const isValidMFA = await this.validateMFA(userId, mfaToken);

    if (!isValidMFA) {
      // 记录失败尝试
      await this.recordMFAFailure(userId, action);
      return false;
    }

    return true;
  }

  private async validateMFA(userId: string, token: string): Promise<boolean> {
    // 实现TOTP或HOTP验证
    return true;
  }

  private async recordMFAFailure(userId: string, action: string): Promise<void> {
    // 记录失败用于审计
  }
}
```

### 8.5 实战：完整防护实现

```typescript
/**
 * 完整的JWT安全防护系统
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * JWT安全配置
 */
const JWT_SECURITY_CONFIG = {
  // 算法配置
  algorithm: 'HS256',
  minKeyLength: 32,

  // 时间配置
  accessTokenExpiry: 900,      // 15分钟
  refreshTokenExpiry: 604800,  // 7天
  maxTimestampAge: 300,         // 5分钟
  timestampTolerance: 60,       // 60秒容差

  // 限流配置
  maxAuthAttempts: 5,
  lockoutDuration: 900,        // 15分钟

  // 来源验证
  allowedOrigins: ['https://example.com'],
  requireCSRF: true,
};

/**
 * JWT安全服务
 */
class JWTSecurityService {
  private redis: any;
  private secret: string;

  constructor(redis: any, secret: string) {
    this.redis = redis;
    this.secret = secret;
  }

  /**
   * 生成安全的Token
   */
  async generateSecureToken(user: {
    id: string;
    role: string;
    permissions: string[];
  }, context: {
    deviceId: string;
    ip: string;
    userAgent: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const family = crypto.randomUUID();

    // Access Token
    const accessPayload = {
      sub: user.id,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      family,
      jti: crypto.randomUUID(),
      deviceId: context.deviceId,
      ip: context.ip,
      ts: now,  // 时间戳
      nonce: crypto.randomBytes(16).toString('hex'),  // Nonce
    };

    const accessToken = jwt.sign(accessPayload, this.secret, {
      algorithm: JWT_SECURITY_CONFIG.algorithm,
      expiresIn: JWT_SECURITY_CONFIG.accessTokenExpiry,
    });

    // Refresh Token
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      family,
      jti: crypto.randomUUID(),
      deviceId: context.deviceId,
      version: 1,
      ts: now,
    };

    const refreshToken = jwt.sign(refreshPayload, this.secret, {
      algorithm: JWT_SECURITY_CONFIG.algorithm,
      expiresIn: JWT_SECURITY_CONFIG.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  /**
   * 验证Token（包含所有安全检查）
   */
  async verifySecureToken(token: string, context: {
    ip?: string;
    userAgent?: string;
  }): Promise<{
    valid: boolean;
    payload?: any;
    error?: string;
    errorCode?: string;
  }> {
    try {
      // 1. 基本格式验证
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: '无效的Token格式', errorCode: 'INVALID_FORMAT' };
      }

      // 2. 解码获取头部信息（不验证签名）
      const decoded = jwt.decode(token) as any;
      if (!decoded) {
        return { valid: false, error: '无法解码Token', errorCode: 'DECODE_ERROR' };
      }

      // 3. 算法验证
      if (!decoded.header?.alg) {
        return { valid: false, error: 'Token缺少算法', errorCode: 'MISSING_ALGORITHM' };
      }

      if (decoded.header.alg.toLowerCase() === 'none') {
        return { valid: false, error: '不允许的空算法', errorCode: 'ALGORITHM_NONE' };
      }

      if (decoded.header.alg !== JWT_SECURITY_CONFIG.algorithm) {
        return { valid: false, error: '不支持的算法', errorCode: 'UNSUPPORTED_ALGORITHM' };
      }

      // 4. JTI重放检查
      const jtiUsed = await this.redis.get(`jti:${decoded.jti}`);
      if (jtiUsed) {
        return { valid: false, error: 'Token已被使用', errorCode: 'REPLAY_DETECTED' };
      }

      // 5. 时间戳验证
      if (decoded.ts) {
        const now = Math.floor(Date.now() / 1000);
        const age = now - decoded.ts;

        if (age > JWT_SECURITY_CONFIG.maxTimestampAge) {
          return { valid: false, error: 'Token时间戳太旧', errorCode: 'TIMESTAMP_TOO_OLD' };
        }

        if (decoded.ts > now + JWT_SECURITY_CONFIG.timestampTolerance) {
          return { valid: false, error: 'Token时间戳是未来时间', errorCode: 'TIMESTAMP_FUTURE' };
        }
      }

      // 6. 签名验证
      let payload: any;
      try {
        payload = jwt.verify(token, this.secret, {
          algorithms: [JWT_SECURITY_CONFIG.algorithm],
        });
      } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
          return { valid: false, error: 'Token已过期', errorCode: 'TOKEN_EXPIRED' };
        }
        if (e instanceof jwt.JsonWebTokenError) {
          return { valid: false, error: '签名验证失败', errorCode: 'SIGNATURE_INVALID' };
        }
        throw e;
      }

      // 7. IP绑定验证（可选）
      if (payload.ip && context.ip && payload.ip !== context.ip) {
        // 注意：这里要谨慎，因为用户IP可能变化
        // 建议只在怀疑账户被盗时启用
      }

      // 8. 标记JTI为已使用
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(`jti:${payload.jti}`, ttl, '1');
      }

      return { valid: true, payload };
    } catch (e) {
      return { valid: false, error: (e as Error).message, errorCode: 'UNKNOWN_ERROR' };
    }
  }

  /**
   * 刷新Token
   */
  async refreshSecureTokens(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      // 验证Refresh Token
      const decoded = jwt.verify(refreshToken, this.secret, {
        algorithms: [JWT_SECURITY_CONFIG.algorithm],
      }) as any;

      if (decoded.type !== 'refresh') {
        return { success: false, error: '无效的Token类型' };
      }

      // 检查Token族是否被撤销
      const familyRevoked = await this.redis.get(`family_invalid:${decoded.family}`);
      if (familyRevoked) {
        return { success: false, error: 'Token族已被撤销' };
      }

      // 检查版本
      const storedVersion = await this.redis.get(`refresh_version:${decoded.jti}`);
      if (storedVersion && parseInt(storedVersion, 10) !== decoded.version) {
        // 版本不匹配，检测到令牌重用攻击
        // 撤销整个Token族
        await this.redis.setex(`family_invalid:${decoded.family}`, 604800, '1');
        return { success: false, error: '检测到安全威胁，Token已被撤销' };
      }

      // 获取用户信息
      const user = await this.getUserById(decoded.sub);
      if (!user) {
        return { success: false, error: '用户不存在' };
      }

      // 生成新Token对
      const newTokens = await this.generateSecureToken(
        { id: user.id, role: user.role, permissions: user.permissions },
        { deviceId: decoded.deviceId, ip: '', userAgent: '' }
      );

      // 标记旧Refresh Token为已使用
      await this.redis.setex(`refresh_used:${decoded.jti}`, 604800, '1');

      return { success: true, ...newTokens };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  /**
   * 撤销Token
   */
  async revokeToken(token: string, reason: string): Promise<void> {
    const decoded = jwt.decode(token) as any;

    if (decoded?.jti) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(`revoked:${decoded.jti}`, ttl, reason);

        // 如果有Token族，也撤销整个族
        if (decoded.family) {
          await this.redis.setex(`family_invalid:${decoded.family}`, 604800, reason);
        }
      }
    }
  }

  /**
   * 撤销用户的所有Token
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<void> {
    // 递增用户Token版本
    const newVersion = await this.redis.incr(`user_version:${userId}`);

    // 记录撤销原因和时间
    await this.redis.setex(
      `user_revoked:${userId}`,
      604800,
      JSON.stringify({ reason, version: newVersion, timestamp: Date.now() })
    );
  }

  private async getUserById(userId: string): Promise<any> {
    return { id: userId, role: 'user', permissions: [] };
  }
}
```

---

## 九、最佳实践

### 9.1 密钥管理

```typescript
/**
 * JWT密钥管理最佳实践
 */

// 1. 环境变量密钥加载
interface KeyLoadingConfig {
  envVarName: string;
  minLength: number;
  required: boolean;
}

async function loadKeyFromEnv(config: KeyLoadingConfig): Promise<string> {
  const key = process.env[config.envVarName];

  if (!key && config.required) {
    throw new Error(`环境变量 ${config.envVarName} 未设置`);
  }

  if (key && key.length < config.minLength) {
    throw new Error(`密钥 ${config.envVarName} 长度不足（需要至少${config.minLength}字符）`);
  }

  return key || '';
}

// 2. 多环境密钥配置
const keyConfig = {
  development: {
    secret: 'dev-secret-key-at-least-32-characters-long',
  },
  staging: {
    secret: loadKeyFromEnv({
      envVarName: 'STAGING_JWT_SECRET',
      minLength: 32,
      required: true,
    }),
  },
  production: {
    secret: loadKeyFromEnv({
      envVarName: 'PRODUCTION_JWT_SECRET',
      minLength: 64,  // 生产环境要求更高
      required: true,
    }),
  },
};

// 3. 密钥轮换服务
class KeyRotationManager {
  private currentKeyVersion: number = 1;
  private keys: Map<number, string> = new Map();

  /**
   * 初始化密钥
   */
  initialize(initialKey: string): void {
    this.keys.set(this.currentKeyVersion, initialKey);
  }

  /**
   * 轮换到新密钥
   */
  async rotate(newKey: string): Promise<number> {
    this.currentKeyVersion++;
    this.keys.set(this.currentKeyVersion, newKey);

    // 保存轮换记录
    await this.saveRotationRecord({
      version: this.currentKeyVersion,
      rotatedAt: Date.now(),
    });

    return this.currentKeyVersion;
  }

  /**
   * 使用指定版本验证Token
   */
  verify(token: string, minVersion?: number): any {
    // 获取Token的keyid
    const decoded = jwt.decode(token) as any;
    const keyVersion = decoded?.keyid ? parseInt(decoded.keyid, 10) : 1;

    // 检查最小版本要求
    if (minVersion && keyVersion < minVersion) {
      throw new Error('Token使用已过期的密钥签发');
    }

    // 获取对应版本的密钥
    const key = this.keys.get(keyVersion);
    if (!key) {
      throw new Error('未找到对应的密钥版本');
    }

    // 验证Token
    return jwt.verify(token, key);
  }

  private async saveRotationRecord(record: {
    version: number;
    rotatedAt: number;
  }): Promise<void> {
    // 保存到数据库或配置中心
  }
}

// 4. 密钥分离原则
class KeySeparationService {
  /**
   * 为不同用途使用不同的密钥
   */
  private accessTokenKey: string;
  private refreshTokenKey: string;
  private csrfTokenKey: string;

  constructor() {
    // 从不同环境变量加载
    this.accessTokenKey = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenKey = process.env.JWT_REFRESH_SECRET!;
    this.csrfTokenKey = process.env.JWT_CSRF_SECRET!;
  }

  /**
   * 使用对应的密钥
   */
  signAccessToken(payload: object): string {
    return jwt.sign(payload, this.accessTokenKey, { algorithm: 'HS256' });
  }

  signRefreshToken(payload: object): string {
    return jwt.sign(payload, this.refreshTokenKey, { algorithm: 'HS256' });
  }

  signCSRFToken(payload: object): string {
    return jwt.sign(payload, this.csrfTokenKey, { algorithm: 'HS256' });
  }

  /**
   * 验证对应的Token
   */
  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.accessTokenKey);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshTokenKey);
  }

  verifyCSRFToken(token: string): any {
    return jwt.verify(token, this.csrfTokenKey);
  }
}
```

### 9.2 过期时间设计

```typescript
/**
 * JWT过期时间最佳实践
 */

// 不同场景的过期时间推荐
const EXPIRY_RECOMMENDATIONS = {
  // 访问令牌：15分钟
  // 理由：缩短暴露窗口，如果被盗影响有限
  accessToken: {
    default: 900,      // 15分钟
    min: 60,           // 最小1分钟
    max: 3600,         // 最大1小时
  },

  // 刷新令牌：7天
  // 理由：足够长的使用周期，方便用户
  refreshToken: {
    default: 604800,    // 7天
    min: 86400,         // 最小1天
    max: 2592000,      // 最大30天
  },

  // 邮箱验证令牌：1小时
  emailVerification: {
    default: 3600,     // 1小时
    max: 86400,        // 最大1天
  },

  // 密码重置令牌：15分钟
  passwordReset: {
    default: 900,      // 15分钟
    max: 3600,         // 最大1小时
  },

  // 短信验证码：5分钟
  smsCode: {
    default: 300,      // 5分钟
    max: 600,         // 最大10分钟
  },
};

// 动态过期时间策略
class DynamicExpiryStrategy {
  /**
   * 根据用户风险等级调整过期时间
   */
  static calculateAccessTokenExpiry(user: {
    riskLevel: 'low' | 'medium' | 'high';
    hasMFA: boolean;
    isTrustedDevice: boolean;
  }): number {
    // 默认15分钟
    let expiry = EXPIRY_RECOMMENDATIONS.accessToken.default;

    // 高风险用户：缩短过期时间
    if (user.riskLevel === 'high') {
      expiry = Math.min(expiry, 300);  // 5分钟
    }

    // 有MFA的用户：可以适当延长
    if (user.hasMFA) {
      expiry = Math.min(expiry * 1.5, EXPIRY_RECOMMENDATIONS.accessToken.max);
    }

    // 信任设备：可以延长
    if (user.isTrustedDevice) {
      expiry = Math.min(expiry * 2, EXPIRY_RECOMMENDATIONS.accessToken.max);
    }

    return Math.round(expiry);
  }

  /**
   * 根据设备类型调整刷新令牌过期时间
   */
  static calculateRefreshTokenExpiry(device: {
    type: 'mobile' | 'desktop' | 'web';
    isTrusted: boolean;
  }): number {
    let expiry = EXPIRY_RECOMMENDATIONS.refreshToken.default;

    // 移动端设备可以延长
    if (device.type === 'mobile') {
      expiry = Math.min(expiry * 1.5, EXPIRY_RECOMMENDATIONS.refreshToken.max);
    }

    // 信任设备可以延长
    if (device.isTrusted) {
      expiry = Math.min(expiry * 2, EXPIRY_RECOMMENDATIONS.refreshToken.max);
    }

    return Math.round(expiry);
  }
}
```

### 9.3 Token大小控制

```typescript
/**
 * JWT大小优化
 */

// JWT大小的影响因素
const SIZE_FACTORS = {
  // Header通常约50-60字节
  header: { baseSize: 60 },

  // Payload取决于声明数量
  payload: {
    perClaim: 20,  // 每个声明约20字节
    baseSize: 30, // 基本大小
  },

  // Signature约43字节（Base64URL编码的256位HMAC）
  signature: { size: 43 },
};

/**
 * 计算JWT大小
 */
function calculateTokenSize(payload: object): number {
  const headerSize = SIZE_FACTORS.header.baseSize;
  const payloadSize = SIZE_FACTORS.payload.baseSize +
    Object.keys(payload).length * SIZE_FACTORS.payload.perClaim;
  const signatureSize = SIZE_FACTORS.signature.size;

  // Base64URL编码会增加约33%的大小
  const base64Overhead = 1.33;

  const totalSize = (headerSize + payloadSize + signatureSize) * base64Overhead;

  return Math.ceil(totalSize);
}

/**
 * 精简Payload策略
 */
class PayloadOptimization {
  /**
   * 最小化Payload
   */
  static minimizePayload(user: {
    id: string;
    role: string;
    permissions: string[];
  }): object {
    return {
      sub: user.id,           // 4字符
      rol: user.role,         // 简写：3字符
      pms: user.permissions,  // 简写：3字符
    };
  }

  /**
   * 压缩权限列表
   */
  static compressPermissions(permissions: string[]): string {
    // 使用数字编码代替字符串
    // 权限映射表需要在服务端和客户端共享
    const permissionMap: Record<string, number> = {
      'read': 1,
      'write': 2,
      'delete': 4,
      'admin': 8,
    };

    // 使用位掩码压缩
    let compressed = 0;
    for (const perm of permissions) {
      if (permissionMap[perm]) {
        compressed |= permissionMap[perm];
      }
    }

    return compressed.toString(36);  // 使用36进制进一步压缩
  }

  /**
   * 解压权限列表
   */
  static decompressPermissions(compressed: string): string[] {
    const permissionMap: Record<number, string> = {
      1: 'read',
      2: 'write',
      4: 'delete',
      8: 'admin',
    };

    const compressedValue = parseInt(compressed, 36);
    const permissions: string[] = [];

    for (const [value, name] of Object.entries(permissionMap)) {
      if (compressedValue & parseInt(value)) {
        permissions.push(name);
      }
    }

    return permissions;
  }
}

/**
 * 大小限制检查
 */
class TokenSizeValidator {
  static readonly MAX_SIZE = 8192;  // 8KB，大多数服务器限制
  static readonly RECOMMENDED_MAX = 4096;  // 4KB，推荐最大值

  /**
   * 验证Token大小
   */
  validate(token: string): {
    valid: boolean;
    size: number;
    recommendation: string;
  } {
    const size = Buffer.byteLength(token, 'utf8');

    if (size > this.MAX_SIZE) {
      return {
        valid: false,
        size,
        recommendation: 'Token超过8KB限制，需要精简Payload',
      };
    }

    if (size > this.RECOMMENDED_MAX) {
      return {
        valid: true,
        size,
        recommendation: 'Token接近推荐大小限制，建议精简',
      };
    }

    return {
      valid: true,
      size,
      recommendation: 'Token大小正常',
    };
  }
}
```

### 9.4 存储方式选择

```typescript
/**
 * JWT存储方式最佳实践
 */

// 存储方式对比
const STORAGE_COMPARISON = {
  localStorage: {
    pros: ['简单易用', '跨标签页共享', '容量大'],
    cons: ['易受XSS攻击', '无法设置HttpOnly'],
    recommended: false,
    suitable: '非敏感场景，仅演示用',
  },

  sessionStorage: {
    pros: ['标签页隔离', '页面关闭即清除'],
    cons: ['易受XSS攻击', '无法跨标签页共享'],
    recommended: false,
    suitable: '单标签页应用',
  },

  httpOnlyCookie: {
    pros: ['防止XSS访问', '自动随请求发送', '符合安全标准'],
    cons: ['需要CSRF防护', '设置复杂'],
    recommended: true,
    suitable: '大多数Web应用',
  },

  memoryOnly: {
    pros: ['最高安全性', '不持久化'],
    cons: ['页面刷新丢失', '无法多标签页共享'],
    recommended: true,
    suitable: '高安全场景',
  },
};

/**
 * 推荐的存储实现
 */
class RecommendedTokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * 设置Access Token（内存存储）
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * 获取Access Token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * 设置Refresh Token（HttpOnly Cookie）
   */
  setRefreshTokenCookie(res: any, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7天
      path: '/',
    });
  }

  /**
   * 从Cookie获取Refresh Token
   */
  getRefreshTokenCookie(req: any): string | null {
    return req.cookies?.refresh_token || null;
  }

  /**
   * 清除所有Token
   */
  clear(res?: any): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (res) {
      res.clearCookie('refresh_token', { path: '/' });
    }
  }
}

/**
 * React Native安全存储
 */
class ReactNativeSecureStorage {
  /**
   * 使用Keychain存储
   */
  static async setItem(key: string, value: string): Promise<void> {
    // 使用react-native-keychain
    // await Keychain.setGenericPassword(key, value, {
    //   service: 'com.example.app',
    //   accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // });
  }

  /**
   * 从Keychain获取
   */
  static async getItem(key: string): Promise<string | null> {
    // const result = await Keychain.getGenericPassword({ service: 'com.example.app' });
    // return result ? result.password : null;
    return null;
  }

  /**
   * 删除Keychain中的项
   */
  static async removeItem(key: string): Promise<void> {
    // await Keychain.resetGenericPassword({ service: 'com.example.app' });
  }
}
```

### 9.5 我的思考：JWT不是银弹

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT的优势与局限                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ JWT的优势：                                                   │
│     • 无状态验证，性能好                                          │
│     • 跨域/跨服务友好                                             │
│     • 自包含信息，减少数据库查询                                   │
│     • 实现简单，易于使用                                          │
│     • 移动端友好（Cookie不是唯一选择）                             │
│                                                                  │
│  ❌ JWT的局限：                                                   │
│     • 无法主动撤销（除非配合黑名单）                               │
│     • Token会暴露在客户端（不能存敏感信息）                         │
│     • 大小比Session ID大                                          │
│     • 过期机制需要额外设计                                         │
│     • 不能存储大量数据                                            │
│                                                                  │
│  ⚠️ JWT的适用场景：                                               │
│     • 一次性的API认证                                             │
│     • 短期访问令牌（15分钟内）                                    │
│     • 需要跨域认证                                                │
│     • 微服务架构                                                  │
│     • 移动应用                                                    │
│                                                                  │
│  ⚠️ JWT的不适用场景：                                             │
│     • 需要即时撤销权限（改密码后立即生效）                         │
│     • 存储大量用户数据                                            │
│     • 长时间保持登录状态（超过30天）                              │
│     • 频繁变更的权限（每次改变都要刷新Token）                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**最佳实践总结：**

```typescript
/**
 * JWT使用检查清单
 */

// ✅ 应该做的
const SHOULD_DO = [
  '使用强密钥（至少32字符）',
  '设置合理的过期时间（Access Token不超过1小时）',
  '使用HTTPS传输',
  '敏感信息只存ID，不存具体数据',
  '实现刷新令牌机制',
  '验证签名和所有声明',
  '使用黑名单应对主动撤销',
  '防止XSS和CSRF攻击',
  '记录审计日志',
  '监控异常行为',
];

// ❌ 不应该做的
const SHOULD_NOT_DO = [
  '在Payload中存储密码或敏感信息',
  '在URL中传递Token',
  '使用弱密钥或默认密钥',
  '设置过长的过期时间',
  '跳过签名验证',
  '相信客户端声明的算法',
  '存储大量数据在Token中',
  'Token永不刷新',
  '忽略安全警告',
  '没有撤销机制',
];

/**
 * 决策流程：何时使用JWT
 */
function shouldUseJWT(scenario: {
  needsInstantRevocation: boolean;
  tokenLifetime: 'short' | 'medium' | 'long';
  isMicroservice: boolean;
  hasHighSecurity: boolean;
}): 'recommended' | 'acceptable' | 'not_recommended' {
  // 需要即时撤销？不推荐使用JWT
  if (scenario.needsInstantRevocation) {
    return 'not_recommended';
  }

  // 超长生命周期？不推荐
  if (scenario.tokenLifetime === 'long') {
    return 'not_recommended';
  }

  // 高安全要求？可以使用，但需要额外措施
  if (scenario.hasHighSecurity) {
    return 'acceptable';
  }

  // 微服务架构？强烈推荐
  if (scenario.isMicroservice) {
    return 'recommended';
  }

  return 'acceptable';
}
```

---

## 十、与Session认证对比

### 10.1 无状态 vs 有状态

```
┌─────────────────────────────────────────────────────────────────┐
│                    认证方式对比                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │     JWT (无状态)      │    │   Session (有状态)    │           │
│  ├──────────────────────┤    ├──────────────────────┤           │
│  │                      │    │                      │           │
│  │  客户端存储Token      │    │  服务端存储Session   │           │
│  │                      │    │                      │           │
│  │  每个请求携带Token    │    │  仅SessionID随请求    │           │
│  │                      │    │                      │           │
│  │  服务端验证签名       │    │  服务端查询Session   │           │
│  │  不需要存储           │    │  需要Redis/DB存储     │           │
│  │                      │    │                      │           │
│  └──────────────────────┘    └──────────────────────┘           │
│                                                                  │
│  性能对比：                                                       │
│  • 单次请求：JWT 更快（无需存储查询）                              │
│  • 大量并发：JWT 优势明显（无存储瓶颈）                            │
│  • 扩展场景：JWT 更适合分布式                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 扩展性对比

```typescript
/**
 * 扩展性对比实现
 */

// JWT扩展性实现（水平扩展友好）
class JWTScalabilityService {
  /**
   * 多服务器无状态验证
   * 所有服务器使用相同的密钥
   * 无需共享会话存储
   */
  verify(token: string, secret: string): any {
    // 任何服务器都可以验证
    return jwt.verify(token, secret);
  }

  /**
   * 添加新服务器
   * 只需同步密钥
   */
  addServer(newServer: string): void {
    console.log(`服务器 ${newServer} 已添加，使用共享密钥验证`);
  }
}

// Session扩展性实现（需要共享存储）
class SessionScalabilityService {
  private sharedRedis: any;

  /**
   * 多服务器共享Session
   * 需要Redis等共享存储
   */
  async verify(sessionId: string): Promise<any> {
    // 每次验证都需要查询Redis
    const session = await this.sharedRedis.get(`session:${sessionId}`);

    if (!session) {
      throw new Error('Session不存在或已过期');
    }

    return JSON.parse(session);
  }

  /**
   * 添加新服务器
   * 需要确保都能连接Redis
   */
  async addServer(newServer: string): Promise<void> {
    console.log(`服务器 ${newServer} 已添加，需要确保能连接Redis`);
  }

  /**
   * Redis扩展挑战
   */
  async handleRedisScaling(): Promise<void> {
    // Redis集群增加复杂度
    // 1. Session一致性问题
    // 2. 跨节点查询
    // 3. 数据同步延迟
  }
}

/**
 * 混合方案：结合两者优点
 */
class HybridAuthService {
  /**
   * Access Token用JWT（无状态）
   * Refresh Token用Session（有状态）
   */
  async authenticate(userId: string): Promise<{
    accessToken: string;
    refreshSessionId: string;
  }> {
    // Access Token：无状态，快速验证
    const accessToken = jwt.sign(
      { sub: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Refresh Session：有状态，便于撤销
    const refreshSessionId = crypto.randomUUID();
    await this.redis.setex(
      `refresh:${refreshSessionId}`,
      604800,  // 7天
      JSON.stringify({ userId, createdAt: Date.now() })
    );

    return { accessToken, refreshSessionId };
  }

  /**
   * 刷新Token
   */
  async refresh(refreshSessionId: string): Promise<{
    accessToken: string;
    refreshSessionId: string;
  } | null> {
    // 有状态验证
    const session = await this.redis.get(`refresh:${refreshSessionId}`);
    if (!session) {
      return null;  // 可以立即撤销
    }

    const { userId } = JSON.parse(session);

    // 生成新的Access Token
    const accessToken = jwt.sign(
      { sub: userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return { accessToken, refreshSessionId };
  }

  /**
   * 撤销（通过Session删除实现即时撤销）
   */
  async revoke(refreshSessionId: string): Promise<void> {
    // 即时删除Session
    await this.redis.del(`refresh:${refreshSessionId}`);
  }
}
```

### 10.3 安全性对比

```typescript
/**
 * 安全性对比
 */

// JWT安全特点
const JWT_SECURITY = {
  strengths: [
    '无存储泄露风险（服务端不存储Token）',
    '签名防篡改',
    '可设置短期过期',
    '跨域友好',
  ],
  weaknesses: [
    '无法主动撤销',
    'Token泄露后难以及时止损',
    '敏感信息不能存储',
    '依赖密钥安全',
  ],
  threats: [
    'Token被盗用',
    '密钥泄露',
    '算法NONE攻击',
    '重放攻击',
  ],
};

// Session安全特点
const SESSION_SECURITY = {
  strengths: [
    '可即时撤销',
    '敏感信息可存服务端',
    'SessionID随机生成，难以预测',
    '可实现滑动过期',
  ],
  weaknesses: [
    '依赖Session存储安全',
    '需要防CSRF',
    '存储可能成为瓶颈',
    '分布式部署复杂',
  ],
  threats: [
    'Session fixation',
    'Session hijacking',
    'CSRF攻击',
    'Session存储泄露',
  ],
};

/**
 * 安全特性对比实现
 */

// JWT即时撤销实现困难
class JWTInstantRevocation {
  private redis: any;

  /**
   * JWT撤销需要黑名单
   * 增加了复杂度
   */
  async revoke(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;

    // 需要存储黑名单
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.setex(`blacklist:${decoded.jti}`, ttl, '1');
    }

    // 验证时增加黑名单查询
  }

  /**
   * JWT验证需要额外检查
   */
  async verify(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as any;

    // 黑名单检查
    const blacklisted = await this.redis.get(`blacklist:${decoded.jti}`);
    if (blacklisted) {
      return false;
    }

    // 签名验证
    jwt.verify(token, process.env.JWT_SECRET!);

    return true;
  }
}

// Session即时撤销简单
class SessionInstantRevocation {
  private redis: any;

  /**
   * Session撤销只需删除
   */
  async revoke(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  /**
   * Session验证自动检查存在性
   */
  async verify(sessionId: string): Promise<boolean> {
    const session = await this.redis.get(`session:${sessionId}`);
    return session !== null;
  }
}

/**
 * CSRF防护对比
 */

// JWT的CSRF风险
class JWTCSRFRisk {
  /**
   * JWT通常存储在Authorization头
   * CSRF不能直接获取Token
   * 但某些实现使用Cookie存储
   */
  static analyze(storageMethod: 'header' | 'cookie'): {
    csrfRisk: 'low' | 'medium' | 'high';
    recommendation: string;
  } {
    if (storageMethod === 'header') {
      return {
        csrfRisk: 'low',
        recommendation: 'Token在Header中，CSRF难以获取',
      };
    }

    return {
      csrfRisk: 'high',
      recommendation: '需要额外的CSRF防护措施',
    };
  }
}

// Session的CSRF风险
class SessionCSRFAdvice {
  /**
   * Session Cookie自动发送
   * 必须配合CSRF Token
   */
  static getRecommendation(): string[] {
    return [
      '使用SameSite Cookie属性',
      '实现CSRF Token',
      '验证Origin/Referer头',
      '敏感操作二次验证',
    ];
  }
}
```

### 10.4 选型建议

```typescript
/**
 * 认证方式选型决策树
 */

interface AuthRequirements {
  // 安全需求
  needInstantRevocation: boolean;      // 是否需要即时撤销
  sensitiveLevel: 'low' | 'medium' | 'high';

  // 业务需求
  tokenLifetime: 'short' | 'medium' | 'long';  // Token生命周期
  isMicroservice: boolean;              // 是否微服务架构
  needCrossDomain: boolean;             // 是否需要跨域

  // 技术需求
  expectedTraffic: 'low' | 'medium' | 'high';
  teamExperience: 'jwt' | 'session' | 'mixed';
}

/**
 * 认证方案推荐
 */
function recommendAuth方案(requirements: AuthRequirements): {
  recommended: string;
  alternative?: string;
  reasoning: string[];
} {
  const reasons: string[] = [];
  let recommended = 'JWT';
  let alternative: string | undefined;

  // 即时撤销需求 -> Session
  if (requirements.needInstantRevocation) {
    reasons.push('需要即时撤销，选择Session更合适');
    recommended = 'Session';
    alternative = 'JWT + 黑名单（复杂度增加）';
  }

  // 超长生命周期 -> Session
  if (requirements.tokenLifetime === 'long') {
    reasons.push('超过30天的登录状态，Session更安全');
    recommended = 'Session';
  }

  // 微服务架构 -> JWT
  if (requirements.isMicroservice && recommended !== 'Session') {
    reasons.push('微服务架构推荐JWT，无状态便于扩展');
    recommended = 'JWT';
  }

  // 高流量 -> JWT
  if (requirements.expectedTraffic === 'high' && recommended !== 'Session') {
    reasons.push('高流量场景JWT无存储瓶颈，扩展性好');
    recommended = 'JWT';
  }

  // 跨域需求 -> JWT
  if (requirements.needCrossDomain && recommended !== 'Session') {
    reasons.push('跨域认证推荐JWT');
    recommended = 'JWT';
  }

  // 高安全要求
  if (requirements.sensitiveLevel === 'high' && recommended !== 'Session') {
    reasons.push('高安全要求建议使用Session + 额外验证');
    alternative = 'Session + 额外安全措施';
  }

  return { recommended, alternative, reasoning: reasons };
}

/**
 * 场景化推荐
 */

const SCENARIO_RECOMMENDATIONS = {
  // 场景1：传统Web应用
  traditionalWeb: {
    recommended: 'Session',
    reasons: [
      '用户登录后长时间使用',
      '需要即时撤销（如修改密码）',
      '团队熟悉Session机制',
    ],
    notes: '配合CSRF Token使用',
  },

  // 场景2：移动应用API
  mobileAPI: {
    recommended: 'JWT',
    reasons: [
      '无Cookie策略',
      'Token可安全存储在Keychain',
      '减少服务端存储压力',
    ],
    notes: '使用短期Access Token + 长期Refresh Token',
  },

  // 场景3：微服务API
  microservices: {
    recommended: 'JWT',
    reasons: [
      '无状态验证，扩展简单',
      '服务间可共享Token验证',
      '减少服务间通信',
    ],
    notes: '使用RS256等非对称算法',
  },

  // 场景4：SSO单点登录
  sso: {
    recommended: 'JWT',
    reasons: [
      '跨域认证',
      'Token自包含用户信息',
      '便于分发和验证',
    ],
    notes: '短期Token + 定期刷新',
  },

  // 场景5：高安全要求系统
  highSecurity: {
    recommended: 'Session',
    reasons: [
      '需要即时撤销',
      '敏感操作需要验证',
      '审计日志要求',
    ],
    notes: '配合MFA、强密码策略',
  },

  // 场景6：临时访问/公开API
  temporaryAccess: {
    recommended: 'JWT',
    reasons: [
      '无需用户注册',
      '可设置精确过期时间',
      '不需存储',
    ],
    notes: '短期Token，不存储敏感信息',
  },
};

/**
 * 我的思考：选择看场景
 */

const FINAL_RECOMMENDATION = `
认证方式没有绝对的优劣，只有适合的场景。

选择JWT的场景：
• 微服务架构，需要无状态验证
• 移动应用，不适合Cookie
• 跨域认证/单点登录
• 临时访问令牌
• 追求高性能和水平扩展

选择Session的场景：
• 传统Web应用
• 需要即时撤销权限
• 超长登录周期
• 高安全要求
• 团队更熟悉Session

混合方案也是好方案：
• Access Token用JWT（快速验证）
• Refresh Token用Session（便于撤销）

关键是理解每种方案的优缺点，在具体场景下做出合理选择。
`;
```

---

## 十一、实战：完整认证系统

### 11.1 登录发Token

```typescript
/**
 * 完整的登录发Token实现
 */

import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

/**
 * 登录请求
 */
interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  userAgent?: string;
}

/**
 * 登录响应
 */
interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 完整的登录服务
 */
class CompleteLoginService {
  private redis: any;
  private userRepository: any;
  private passwordService: any;

  /**
   * 用户登录
   */
  async login(request: LoginRequest, context: {
    ip: string;
    userAgent: string;
  }): Promise<LoginResponse> {
    // 1. 验证输入
    if (!request.email || !request.password) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '邮箱和密码不能为空',
        },
      };
    }

    // 2. 检查登录尝试限制
    const loginAttemptKey = `login_attempt:${request.email}`;
    const attempts = await this.redis.get(loginAttemptKey);

    if (attempts && parseInt(attempts, 10) >= 5) {
      const ttl = await this.redis.ttl(loginAttemptKey);
      return {
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `登录尝试次数过多，请在${Math.ceil(ttl / 60)}分钟后重试`,
        },
      };
    }

    // 3. 查找用户
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      // 记录失败的登录尝试
      await this.recordFailedAttempt(request.email);
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      };
    }

    // 4. 验证密码
    const passwordValid = await this.passwordService.verify(
      request.password,
      user.passwordHash
    );

    if (!passwordValid) {
      await this.recordFailedAttempt(request.email);
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误',
        },
      };
    }

    // 5. 检查账户状态
    if (user.status !== 'active') {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: '账户已被禁用',
        },
      };
    }

    // 6. 清除失败的登录尝试
    await this.redis.del(loginAttemptKey);

    // 7. 创建设备记录
    const deviceId = request.deviceId || crypto.randomUUID();
    await this.createDeviceRecord(user.id, deviceId, context);

    // 8. 生成令牌
    const tokens = await this.generateTokenPair(user, deviceId);

    // 9. 记录登录日志
    await this.logSuccessfulLogin(user.id, context);

    // 10. 返回响应
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * 生成令牌对
   */
  private async generateTokenPair(user: any, deviceId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const family = crypto.randomUUID();

    // Access Token
    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      family,
      jti: crypto.randomUUID(),
      deviceId,
      iat: now,
      ts: now,
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_ACCESS_SECRET!, {
      algorithm: 'HS256',
      expiresIn: '15m',
    });

    // Refresh Token
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      family,
      jti: crypto.randomUUID(),
      deviceId,
      version: 1,
      iat: now,
    };

    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET!, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });

    // 存储Refresh Token映射
    await this.storeRefreshToken(refreshPayload.jti, family, 1, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,  // 15分钟
      tokenType: 'Bearer',
    };
  }

  /**
   * 存储Refresh Token映射
   */
  private async storeRefreshToken(
    jti: string,
    family: string,
    version: number,
    userId: string
  ): Promise<void> {
    const key = `refresh_token:${jti}`;
    await this.redis.setex(key, 604800, JSON.stringify({
      family,
      version,
      userId,
      createdAt: Date.now(),
    }));
  }

  /**
   * 记录失败的登录尝试
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    const key = `login_attempt:${email}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.setex(key, 900, '1');  // 15分钟窗口
    }
  }

  /**
   * 创建设备记录
   */
  private async createDeviceRecord(
    userId: string,
    deviceId: string,
    context: { ip: string; userAgent: string }
  ): Promise<void> {
    const key = `device:${userId}:${deviceId}`;
    await this.redis.setex(key, 2592000, JSON.stringify({  // 30天
      ...context,
      lastActive: Date.now(),
    }));
  }

  /**
   * 记录成功登录
   */
  private async logSuccessfulLogin(
    userId: string,
    context: { ip: string; userAgent: string }
  ): Promise<void> {
    const key = `login_history:${userId}`;
    await this.redis.lpush(key, JSON.stringify({
      ...context,
      timestamp: Date.now(),
    }));
    await this.redis.ltrim(key, 0, 99);  // 保留最近100条
  }
}
```

### 11.2 请求带Token

```typescript
/**
 * 请求带Token的完整实现
 */

/**
 * Token提取器
 */
class TokenExtractor {
  /**
   * 从Header提取Token
   */
  static fromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * 从Cookie提取Token
   */
  static fromCookie(cookies: Record<string, string>): string | null {
    return cookies.access_token || null;
  }

  /**
   * 尝试多种方式提取
   */
  static extract(request: {
    headers: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
  }): string | null {
    // 1. 优先从Header
    const headerToken = this.fromHeader(request.headers.authorization as string);
    if (headerToken) return headerToken;

    // 2. 其次从Cookie
    if (request.cookies) {
      const cookieToken = this.fromCookie(request.cookies);
      if (cookieToken) return cookieToken;
    }

    return null;
  }
}

/**
 * 认证中间件
 */
class AuthenticationMiddleware {
  private jwtService: any;
  private blacklistService: any;
  private rateLimiter: any;

  async handle(request: any): Promise<{
    authenticated: boolean;
    user?: any;
    error?: string;
  }> {
    // 1. 提取Token
    const token = TokenExtractor.extract(request);

    if (!token) {
      return {
        authenticated: false,
        error: '缺少认证Token',
      };
    }

    // 2. 限流检查（基于IP）
    const clientIP = this.getClientIP(request);
    const rateLimitResult = await this.rateLimiter.check(clientIP);

    if (!rateLimitResult.allowed) {
      return {
        authenticated: false,
        error: '请求过于频繁',
      };
    }

    // 3. 检查黑名单
    const isBlacklisted = await this.blacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return {
        authenticated: false,
        error: 'Token已被撤销',
      };
    }

    // 4. 验证Token
    try {
      const payload = this.jwtService.verify(token);

      // 5. 附加用户信息到请求
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        deviceId: payload.deviceId,
      };

      return {
        authenticated: true,
        user: request.user,
      };
    } catch (e) {
      return {
        authenticated: false,
        error: (e as Error).message,
      };
    }
  }

  private getClientIP(request: any): string {
    return request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           request.connection?.remoteAddress ||
           'unknown';
  }
}

/**
 * NestJS Auth Guard完整实现
 */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: any,
    private blacklistService: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 提取Token
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('缺少认证Token');
    }

    // 检查黑名单
    const isBlacklisted = await this.blacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token已被撤销');
    }

    // 验证Token
    try {
      const payload = await this.jwtService.verify(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
      };
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token已过期');
      }
      throw new UnauthorizedException('无效的Token');
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.cookies?.access_token || null;
  }
}

/**
 * 权限守卫
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}

/**
 * 使用示例
 */
@Controller('protected')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ProtectedController {
  @Get('resource')
  async getResource(@Request() req) {
    return {
      message: '受保护的资源',
      user: req.user,
    };
  }
}
```

### 11.3 刷新Token

```typescript
/**
 * Token刷新完整实现
 */

/**
 * 刷新请求
 */
interface RefreshRequest {
  refreshToken: string;
}

/**
 * 刷新响应
 */
interface RefreshResponse {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 完整的刷新服务
 */
class TokenRefreshService {
  private redis: any;
  private accessSecret: string;
  private refreshSecret: string;

  /**
   * 刷新Token
   */
  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    const { refreshToken } = request;

    // 1. 验证Refresh Token格式
    if (!refreshToken) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh Token不能为空',
        },
      };
    }

    // 2. 验证Refresh Token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret, {
        algorithms: ['HS256'],
      });
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh Token已过期，请重新登录',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '无效的Refresh Token',
        },
      };
    }

    // 3. 验证Token类型
    if (payload.type !== 'refresh') {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Token类型不正确',
        },
      };
    }

    // 4. 检查Token族是否被撤销
    const familyInvalid = await this.redis.get(`family_invalid:${payload.family}`);
    if (familyInvalid) {
      // 检测到潜在的攻击，撤销所有Token
      return {
        success: false,
        error: {
          code: 'SECURITY_ALERT',
          message: '检测到安全威胁，请重新登录',
        },
      };
    }

    // 5. 检查Token版本（刷新令牌旋转）
    const storedVersion = await this.getStoredVersion(payload.jti);
    if (storedVersion !== null && storedVersion !== payload.version) {
      // 版本不匹配，检测到Token重用
      // 撤销整个Token族
      await this.invalidateFamily(payload.family);
      return {
        success: false,
        error: {
          code: 'TOKEN_REUSED',
          message: '检测到Token重用，账户已锁定，请重新登录',
        },
      };
    }

    // 6. 获取用户信息
    const user = await this.getUser(payload.sub);
    if (!user || user.status !== 'active') {
      return {
        success: false,
        error: {
          code: 'USER_INVALID',
          message: '用户不存在或已被禁用',
        },
      };
    }

    // 7. 使旧Refresh Token失效
    await this.markTokenAsUsed(payload.jti);

    // 8. 生成新令牌对（刷新令牌旋转）
    const newTokens = await this.generateNewTokenPair(user, payload);

    // 9. 返回新Token
    return {
      success: true,
      tokens: newTokens,
    };
  }

  /**
   * 生成新的令牌对
   */
  private async generateNewTokenPair(user: any, oldRefreshPayload: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const newFamily = oldRefreshPayload.family;  // 保持同一个家族
    const newVersion = oldRefreshPayload.version + 1;

    // Access Token
    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      family: newFamily,
      jti: crypto.randomUUID(),
      deviceId: oldRefreshPayload.deviceId,
      iat: now,
      ts: now,
    };

    const accessToken = jwt.sign(accessPayload, this.accessSecret, {
      algorithm: 'HS256',
      expiresIn: '15m',
    });

    // Refresh Token
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      family: newFamily,
      jti: crypto.randomUUID(),
      deviceId: oldRefreshPayload.deviceId,
      version: newVersion,
      iat: now,
    };

    const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });

    // 存储新Refresh Token映射
    await this.storeRefreshToken(refreshPayload.jti, newFamily, newVersion, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  /**
   * 获取存储的版本
   */
  private async getStoredVersion(jti: string): Promise<number | null> {
    const key = `refresh_token:${jti}`;
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return parsed.version;
    } catch {
      return null;
    }
  }

  /**
   * 标记Token为已使用
   */
  private async markTokenAsUsed(jti: string): Promise<void> {
    const key = `refresh_token:${jti}`;
    await this.redis.del(key);
  }

  /**
   * 使Token族失效
   */
  private async invalidateFamily(family: string): Promise<void> {
    await this.redis.setex(`family_invalid:${family}`, 604800, '1');
  }

  /**
   * 获取用户
   */
  private async getUser(userId: string): Promise<any> {
    // 实现用户查询
    return { id: userId, status: 'active', role: 'user', permissions: [] };
  }
}

/**
 * 刷新API端点
 */
@Controller('auth')
export class AuthRefreshController {
  constructor(private tokenRefreshService: TokenRefreshService) {}

  @Post('refresh')
  async refresh(@Body() body: RefreshRequest): Promise<RefreshResponse> {
    return this.tokenRefreshService.refresh(body);
  }
}
```

### 11.4 撤销Token

```typescript
/**
 * Token撤销完整实现
 */

/**
 * 撤销请求
 */
interface RevokeRequest {
  token?: string;          // 可选，不提供则撤销所有
  reason?: string;
}

/**
 * 撤销响应
 */
interface RevokeResponse {
  success: boolean;
  message: string;
  revokedCount?: number;
}

/**
 * 完整的Token撤销服务
 */
class TokenRevocationService {
  private redis: any;
  private accessSecret: string;
  private refreshSecret: string;

  /**
   * 撤销Token
   */
  async revoke(request: RevokeRequest, userId: string): Promise<RevokeResponse> {
    const { reason = 'user_initiated' } = request;

    if (request.token) {
      // 撤销单个Token
      return this.revokeSingleToken(request.token, reason);
    } else {
      // 撤销用户所有Token
      return this.revokeAllUserTokens(userId, reason);
    }
  }

  /**
   * 撤销单个Token
   */
  private async revokeSingleToken(token: string, reason: string): Promise<RevokeResponse> {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.jti) {
        return {
          success: false,
          message: '无效的Token',
        };
      }

      // 计算剩余有效期
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp > now ? decoded.exp - now : 0;

      if (ttl <= 0) {
        return {
          success: false,
          message: 'Token已过期，无需撤销',
        };
      }

      // 添加到黑名单
      const key = `revoked:${decoded.jti}`;
      await this.redis.setex(key, ttl, JSON.stringify({
        reason,
        revokedAt: now,
        userId: decoded.sub,
        tokenType: decoded.type,
      }));

      // 如果有Token族，也撤销整个族
      if (decoded.family) {
        await this.invalidateFamily(decoded.family, ttl, reason);
      }

      // 如果是Refresh Token，也撤销对应的Access Token
      if (decoded.type === 'refresh' && decoded.deviceId) {
        await this.revokeDeviceTokens(decoded.sub, decoded.deviceId, reason);
      }

      return {
        success: true,
        message: 'Token已撤销',
        revokedCount: 1,
      };
    } catch (e) {
      return {
        success: false,
        message: `撤销失败: ${(e as Error).message}`,
      };
    }
  }

  /**
   * 撤销用户所有Token
   */
  private async revokeAllUserTokens(userId: string, reason: string): Promise<RevokeResponse> {
    // 1. 递增用户Token版本
    const newVersion = await this.redis.incr(`user_version:${userId}`);

    // 2. 记录撤销操作
    await this.redis.setex(
      `user_revoked:${userId}`,
      604800,  // 7天
      JSON.stringify({
        reason,
        version: newVersion,
        revokedAt: Date.now(),
      })
    );

    // 3. 查找并撤销该用户的所有设备
    const deviceKeys = await this.redis.keys(`device:${userId}:*`);
    let revokedCount = 0;

    for (const deviceKey of deviceKeys) {
      const deviceData = await this.redis.get(deviceKey);
      if (deviceData) {
        const device = JSON.parse(deviceData);
        // 撤销该设备的所有Token
        // 实现省略
        revokedCount++;
      }
    }

    return {
      success: true,
      message: `已撤销用户的所有Token（${revokedCount}个设备）`,
      revokedCount,
    };
  }

  /**
   * 使Token族失效
   */
  private async invalidateFamily(family: string, ttl: number, reason: string): Promise<void> {
    await this.redis.setex(`family_invalid:${family}`, ttl, JSON.stringify({
      reason,
      invalidatedAt: Date.now(),
    }));
  }

  /**
   * 撤销设备的所有Token
   */
  private async revokeDeviceTokens(userId: string, deviceId: string, reason: string): Promise<void> {
    // 标记设备失效
    await this.redis.setex(
      `device_invalid:${userId}:${deviceId}`,
      604800,
      JSON.stringify({ reason, invalidatedAt: Date.now() })
    );
  }

  /**
   * 撤销所有设备（强制登出所有设备）
   */
  async revokeAllDevices(userId: string, reason: string = 'force_logout'): Promise<RevokeResponse> {
    // 1. 获取用户的所有设备
    const deviceKeys = await this.redis.keys(`device:${userId}:*`);

    // 2. 为每个设备标记失效
    for (const key of deviceKeys) {
      const deviceId = key.split(':')[2];
      await this.redis.setex(
        `device_invalid:${userId}:${deviceId}`,
        604800,
        JSON.stringify({ reason, invalidatedAt: Date.now() })
      );
    }

    // 3. 清除设备列表
    await this.redis.del(...deviceKeys);

    return {
      success: true,
      message: `已撤销所有设备（${deviceKeys.length}个设备）`,
      revokedCount: deviceKeys.length,
    };
  }

  /**
   * 验证Token是否被撤销
   */
  async isRevoked(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.jti) {
      return false;
    }

    // 检查黑名单
    const blacklisted = await this.redis.get(`revoked:${decoded.jti}`);
    if (blacklisted) {
      return true;
    }

    // 检查Token族是否失效
    if (decoded.family) {
      const familyInvalid = await this.redis.get(`family_invalid:${decoded.family}`);
      if (familyInvalid) {
        return true;
      }
    }

    // 检查设备是否失效
    if (decoded.sub && decoded.deviceId) {
      const deviceInvalid = await this.redis.get(
        `device_invalid:${decoded.sub}:${decoded.deviceId}`
      );
      if (deviceInvalid) {
        return true;
      }
    }

    return false;
  }
}

/**
 * 撤销API端点
 */
@Controller('auth')
export class AuthRevokeController {
  constructor(private revocationService: TokenRevocationService) {}

  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  async revoke(
    @Body() body: RevokeRequest,
    @Request() req,
  ): Promise<RevokeResponse> {
    return this.revocationService.revoke(body, req.user.id);
  }

  @Post('revoke-all')
  @UseGuards(JwtAuthGuard)
  async revokeAll(@Request() req): Promise<RevokeResponse> {
    return this.revocationService.revokeAllDevices(req.user.id, 'user_logout');
  }
}
```

### 11.5 我的思考：认证是系统安全的第一环

```
┌─────────────────────────────────────────────────────────────────┐
│                    认证安全的重要性                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  认证是整个应用安全的第一道防线：                                   │
│                                                                  │
│  1. 认证失败 = 所有安全措施形同虚设                               │
│                                                                  │
│  2. 认证漏洞的影响：                                              │
│     • 未授权访问敏感数据                                          │
│     • 账户接管                                                   │
│     • 横向移动（攻击其他用户）                                     │
│     • 数据泄露                                                   │
│                                                                  │
│  3. JWT认证的特殊考量：                                           │
│     • Token是访问凭证，失去它就等于失去账户控制权                  │
│     • Token的泄露往往难以察觉                                     │
│     • 一旦泄露，攻击窗口期长（除非实现了完善的撤销机制）            │
│                                                                  │
│  4. 纵深防御原则：                                                │
│     • 不要依赖单一认证机制                                        │
│     • 结合多因素认证（MFA）                                       │
│     • 实施异常检测                                                │
│     • 保持审计日志                                                │
│                                                                  │
│  5. 实际建议：                                                    │
│     • 使用HTTPS（防止Token在传输中被截获）                        │
│     • 实施登录尝试限制（防止暴力破解）                            │
│     • 监控异常登录行为                                            │
│     • 定期审计Token使用情况                                       │
│     • 提供即时撤销能力                                            │
│     • 敏感操作要求二次验证                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**完整的认证系统架构：**

```typescript
/**
 * 完整认证系统架构图
 */

/*
┌─────────────────────────────────────────────────────────────────┐
│                     认证系统架构                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   客户端     │     │   API网关    │     │  认证服务    │        │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘        │
│         │                   │                   │               │
│         │  1. 登录请求        │                   │               │
│         │───────────────────>│                   │               │
│         │                    │  2. 转发          │               │
│         │                    │─────────────────>│               │
│         │                    │                   │               │
│         │                    │   3. 验证+生成    │               │
│         │                    │   Token           │               │
│         │                    │                   │               │
│         │                    │  4. 返回Tokens   │               │
│         │                    │<─────────────────│               │
│         │  5. 返回Tokens      │                   │               │
│         │<───────────────────│                   │               │
│         │                    │                   │               │
│         │  6. 携带AccessToken │                   │               │
│         │  访问API            │                   │               │
│         │───────────────────>│                   │               │
│         │                    │  7. 验证Token     │               │
│         │                    │      (无状态)     │               │
│         │                    │                   │               │
│         │  8. 返回资源        │                   │               │
│         │<───────────────────│                   │               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                      Redis存储                          │     │
│  │  • Token黑名单     • 用户Session    • 设备记录          │     │
│  │  • 登录尝试限制     • Token版本      • 审计日志          │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
*/

/**
 * 认证系统组件清单
 */

const AUTH_SYSTEM_COMPONENTS = {
  // 1. 认证服务
  authService: {
    responsibilities: [
      '用户注册与登录',
      '密码验证',
      'Token生成',
      '多因素认证',
    ],
  },

  // 2. Token服务
  tokenService: {
    responsibilities: [
      'Access Token生成与验证',
      'Refresh Token生成与刷新',
      'Token撤销',
      'Token版本管理',
    ],
  },

  // 3. 会话服务
  sessionService: {
    responsibilities: [
      '会话存储',
      '会话过期管理',
      '并发会话控制',
      '强制登出',
    ],
  },

  // 4. 设备管理
  deviceService: {
    responsibilities: [
      '设备注册',
      '设备信任管理',
      '设备撤销',
      '登录设备列表',
    ],
  },

  // 5. 安全服务
  securityService: {
    responsibilities: [
      '登录尝试限制',
      '异常行为检测',
      'IP信誉检查',
      '安全警报',
    ],
  },

  // 6. 审计服务
  auditService: {
    responsibilities: [
      '登录日志',
      'Token使用日志',
      '安全事件日志',
      '合规报告',
    ],
  },
};

/**
 * 认证流程状态机
 */

const AUTH_STATES = {
  // 初始状态
  INIT: 'INIT',

  // 登录流程
  LOGGING_IN: 'LOGGING_IN',
  MFA_REQUIRED: 'MFA_REQUIRED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

  // Token状态
  TOKEN_VALID: 'TOKEN_VALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // 会话状态
  SESSION_ACTIVE: 'SESSION_ACTIVE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
};

/**
 * 最终的安全检查清单
 */

const FINAL_SECURITY_CHECKLIST = `
JWT认证安全检查清单：

□ 密钥管理
  □ 使用强密钥（至少32字符）
  □ 密钥存储在环境变量
  □ 实施密钥轮换
  □ 不在代码中硬编码密钥

□ Token生成
  □ 使用安全的随机数生成器
  □ 包含必要的声明（sub, iat, exp, jti）
  □ 不存储敏感信息
  □ 设置合理的过期时间

□ Token传输
  □ 使用HTTPS
  □ 通过Header传递（非URL）
  □ 敏感操作使用POST/PUT

□ Token验证
  □ 验证签名
  □ 验证过期时间
  □ 验证签发者
  □ 检查黑名单
  □ 检查Token版本

□ 刷新机制
  □ 实现Refresh Token Rotation
  □ 验证新旧Token关联
  □ 防止Token重用攻击

□ 撤销机制
  □ 支持单Token撤销
  □ 支持设备撤销
  □ 支持全部撤销
  □ 使用Redis黑名单

□ 监控审计
  □ 记录所有登录尝试
  □ 记录Token使用情况
  □ 监控异常行为
  □ 设置安全警报

□ 防护措施
  □ 防止暴力破解（限流）
  □ 防止CSRF攻击
  □ 防止XSS攻击
  □ 防止重放攻击
`;
```

---

## 总结

本文档从底层原理层面全面剖析了JSON Web Token（JWT）的内部机制、安全特性和最佳实践。通过对JWT结构的深入分析、签名算法的详细讲解、安全威胁的攻防博弈，以及完整的实战代码示例，帮助读者建立起对JWT认证系统的全面理解。

关键要点回顾：

1. **JWT结构**：由Header、Payload、Signature三部分组成，采用Base64URL编码，结构简洁但信息完整

2. **签名算法**：HMAC适合单体应用，RSA适合微服务架构，ECDSA提供更好的性能比

3. **Payload设计**：遵循最小化原则，不存储敏感信息，合理使用标准声明

4. **安全考量**：防范算法NONE攻击、签名伪造、密钥爆破等威胁

5. **过期刷新**：采用Access Token + Refresh Token双Token机制，配合滑动过期策略

6. **黑名单机制**：使用Redis实现高效的Token撤销，支持Token版本控制

7. **无状态认证**：适合分布式系统，但需要权衡即时撤销的需求

8. **安全防护**：综合运用CSRF防护、XSS防护、重放攻击防护等多种措施

9. **最佳实践**：合理选择密钥管理、过期时间、存储方式，认识到JWT不是银弹

10. **选型建议**：根据具体场景选择JWT或Session认证，必要时可采用混合方案

---

*本文档完*

*本文档编写于 2026年4月*
