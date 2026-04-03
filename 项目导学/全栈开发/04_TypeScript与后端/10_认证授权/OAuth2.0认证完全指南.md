# OAuth2.0认证完全指南

## 目录

1. [OAuth2.0基础概念](#1-oauth20基础概念)
2. [授权流程详解](#2-授权流程详解)
3. [JWT深入](#3-jwt深入)
4. [实战实现](#4-实战实现)
5. [安全最佳实践](#5-安全最佳实践)
6. [面试高频问题](#6-面试高频问题)

---

## 1. OAuth2.0基础概念

### 1.1 OAuth2.0概述

```
┌─────────────────────────────────────────────────────────────┐
│                   OAuth2.0核心概念                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  角色:                                                      │
│  ├── Resource Owner (资源所有者) - 用户                    │
│  ├── Resource Server (资源服务器) - 存储用户数据            │
│  ├── Client (客户端) - 第三方应用                          │
│  └── Authorization Server (授权服务器) - 颁发令牌          │
│                                                             │
│  令牌类型:                                                  │
│  ├── Access Token - 访问令牌（访问资源）                   │
│  ├── Refresh Token - 刷新令牌（获取新Access Token）        │
│  └── ID Token - 身份令牌（OpenID Connect）                 │
│                                                             │
│  授权类型:                                                  │
│  ├── Authorization Code - 授权码模式（推荐）               │
│  ├── Implicit - 隐式模式（已废弃）                         │
│  ├── Resource Owner Password - 密码模式（不推荐）          │
│  └── Client Credentials - 客户端凭证模式                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 授权类型对比

```typescript
// OAuth2.0授权类型详解

interface GrantType {
  name: string;
  description: string;
  useCase: string;
  security: 'high' | 'medium' | 'low';
  recommended: boolean;
}

const grantTypes: GrantType[] = [
  {
    name: 'Authorization Code',
    description: '用户授权后获取授权码，再用授权码换取令牌',
    useCase: 'Web应用、移动应用',
    security: 'high',
    recommended: true,
  },
  {
    name: 'Authorization Code + PKCE',
    description: '授权码模式 + 代码验证器，防止授权码截获',
    useCase: '移动应用、SPA',
    security: 'high',
    recommended: true,
  },
  {
    name: 'Implicit',
    description: '直接返回令牌，无授权码中间步骤',
    useCase: '纯前端应用（已废弃）',
    security: 'low',
    recommended: false,
  },
  {
    name: 'Resource Owner Password',
    description: '直接使用用户名密码获取令牌',
    useCase: '遗留系统迁移',
    security: 'low',
    recommended: false,
  },
  {
    name: 'Client Credentials',
    description: '使用客户端ID和密钥获取令牌',
    useCase: '服务间通信、后台任务',
    security: 'medium',
    recommended: true,
  },
  {
    name: 'Device Code',
    description: '设备码模式，用于无浏览器设备',
    useCase: '智能电视、CLI工具',
    security: 'medium',
    recommended: true,
  },
  {
    name: 'Refresh Token',
    description: '使用刷新令牌获取新的访问令牌',
    useCase: '所有需要长期访问的场景',
    security: 'high',
    recommended: true,
  },
];
```

---

## 2. 授权流程详解

### 2.1 授权码模式

```
┌─────────────────────────────────────────────────────────────┐
│                  授权码模式流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户        客户端        授权服务器       资源服务器       │
│   │           │              │               │              │
│   │  1.点击登录              │               │              │
│   │ ─────────► │             │               │              │
│   │           │             │               │              │
│   │           │  2.重定向到授权页面         │              │
│   │           │ ───────────► │               │              │
│   │           │              │               │              │
│   │  3.用户授权              │               │              │
│   │ ───────────────────────► │               │              │
│   │           │              │               │              │
│   │           │  4.返回授权码 (code)        │              │
│   │           │ ◄─────────── │               │              │
│   │           │              │               │              │
│   │           │  5.用授权码换取令牌         │              │
│   │           │ ───────────► │               │              │
│   │           │              │               │              │
│   │           │  6.返回Access Token        │              │
│   │           │ ◄─────────── │               │              │
│   │           │              │               │              │
│   │           │  7.请求资源  │               │              │
│   │           │ ───────────────────────────►│              │
│   │           │              │               │              │
│   │           │  8.返回资源  │               │              │
│   │           │ ◄───────────────────────────│              │
│   │           │              │               │              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 授权码模式实现

```typescript
// 授权码模式完整实现

import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();

// 配置
const config = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  authorizationEndpoint: 'https://auth.example.com/authorize',
  tokenEndpoint: 'https://auth.example.com/token',
  userInfoEndpoint: 'https://auth.example.com/userinfo',
  jwtSecret: 'your-jwt-secret',
};

// 存储（生产环境使用Redis）
const authCodes = new Map<string, { userId: string; expiresAt: number }>();
const accessTokens = new Map<string, { userId: string; expiresAt: number }>();
const refreshTokens = new Map<string, { userId: string }>();
const pkceVerifiers = new Map<string, string>();

// ============ 授权服务器端 ============

// 步骤1: 授权端点 - 重定向到授权页面
app.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;

  // 验证客户端
  if (client_id !== config.clientId) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // 验证redirect_uri
  if (redirect_uri !== config.redirectUri) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // 验证response_type
  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  // 存储PKCE验证器
  if (code_challenge) {
    const stateKey = state as string;
    pkceVerifiers.set(stateKey, code_challenge as string);
  }

  // 重定向到登录页面
  res.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&scope=${scope}`);
});

// 步骤2: 用户登录和授权
app.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password, client_id, redirect_uri, state, scope } = req.body;

  // 验证用户凭据
  const user = await verifyUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  // 生成授权码
  const code = crypto.randomBytes(32).toString('hex');
  authCodes.set(code, {
    userId: user.id,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10分钟有效
  });

  // 重定向回客户端
  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
});

// 步骤3: 令牌端点 - 用授权码换取令牌
app.post('/token', express.urlencoded({ extended: true }), async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = req.body;

  // 验证客户端
  if (client_id !== config.clientId || client_secret !== config.clientSecret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  // 验证授权码
  const authCode = authCodes.get(code);
  if (!authCode || authCode.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 删除已使用的授权码
  authCodes.delete(code);

  // 生成令牌
  const accessToken = generateAccessToken(authCode.userId);
  const refreshToken = generateRefreshToken(authCode.userId);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: 'read write',
  });
});

// 步骤4: 刷新令牌
app.post('/refresh', express.urlencoded({ extended: true }), (req, res) => {
  const { grant_type, refresh_token, client_id, client_secret } = req.body;

  // 验证客户端
  if (client_id !== config.clientId || client_secret !== config.clientSecret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  // 验证刷新令牌
  const tokenData = refreshTokens.get(refresh_token);
  if (!tokenData) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 生成新的访问令牌
  const newAccessToken = generateAccessToken(tokenData.userId);
  const newRefreshToken = generateRefreshToken(tokenData.userId);

  // 删除旧的刷新令牌
  refreshTokens.delete(refresh_token);

  res.json({
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: newRefreshToken,
  });
});

// ============ 客户端实现 ============

// 客户端: 发起授权请求
function getAuthorizationUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'read write',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

// 客户端: PKCE生成
function generatePKCE(): { verifier: string; challenge: string } {
  // 生成验证器
  const verifier = crypto.randomBytes(32).toString('base64url');

  // 生成挑战码
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

// 客户端: 用授权码换取令牌
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier,
    }).toString(),
  });

  return response.json();
}

// 客户端: 回调处理
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // 验证state防止CSRF
  const savedState = getSavedState();
  if (state !== savedState) {
    return res.status(400).json({ error: 'invalid_state' });
  }

  // 获取保存的PKCE验证器
  const codeVerifier = getSavedCodeVerifier();

  // 用授权码换取令牌
  const tokens = await exchangeCodeForToken(code as string, codeVerifier);

  // 存储令牌
  storeTokens(tokens);

  res.redirect('/');
});

// 辅助函数
function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  refreshTokens.set(token, { userId });
  return token;
}

async function verifyUser(username: string, password: string) {
  // 实际项目中查询数据库
  return { id: '1', username };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}
```

### 2.3 PKCE扩展

```typescript
// PKCE (Proof Key for Code Exchange) 实现

/*
┌─────────────────────────────────────────────────────────────┐
│                     PKCE流程                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 客户端生成:                                             │
│     - code_verifier: 随机字符串 (43-128字符)               │
│     - code_challenge: SHA256(code_verifier) 的Base64URL    │
│                                                             │
│  2. 授权请求:                                               │
│     - 发送code_challenge                                   │
│     - 指定code_challenge_method = S256                     │
│                                                             │
│  3. 令牌请求:                                               │
│     - 发送code_verifier                                    │
│     - 服务器验证: SHA256(code_verifier) == code_challenge  │
│                                                             │
│  安全性:                                                    │
│     - 防止授权码被截获后使用                               │
│     - 攻击者没有code_verifier无法换取令牌                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 生成PKCE参数
function generatePKCEChallenge(): { verifier: string; challenge: string } {
  // 生成随机验证器 (43-128字符)
  const verifier = crypto.randomBytes(32).toString('base64url');

  // 生成挑战码 (SHA256哈希)
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

// 服务器端验证PKCE
function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const computedChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return computedChallenge === codeChallenge;
}

// 完整的PKCE授权流程
class OAuthClient {
  private config: OAuthConfig;
  private pkceStore = new Map<string, { verifier: string; state: string }>();

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // 发起授权请求
  initiateAuthorization(): string {
    const state = crypto.randomBytes(16).toString('hex');
    const { verifier, challenge } = generatePKCEChallenge();

    // 存储PKCE参数
    this.pkceStore.set(state, { verifier, state });

    // 构建授权URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      state: state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  // 处理回调
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    // 验证state
    const pkceData = this.pkceStore.get(state);
    if (!pkceData) {
      throw new Error('Invalid state');
    }

    // 清理已使用的PKCE数据
    this.pkceStore.delete(state);

    // 用授权码换取令牌
    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: pkceData.verifier,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return response.json();
  }
}

interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
}
```

---

## 3. JWT深入

### 3.1 JWT结构

```typescript
// JWT结构详解

/*
┌─────────────────────────────────────────────────────────────┐
│                     JWT结构                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Header.Payload.Signature                                   │
│                                                             │
│  Header (头部):                                             │
│  {                                                          │
│    "alg": "RS256",      // 签名算法                         │
│    "typ": "JWT"         // 令牌类型                         │
│  }                                                          │
│                                                             │
│  Payload (载荷):                                            │
│  {                                                          │
│    "iss": "auth.example.com",  // 签发者                    │
│    "sub": "user123",           // 主题(用户ID)              │
│    "aud": "api.example.com",   // 受众                      │
│    "exp": 1735689600,          // 过期时间                  │
│    "nbf": 1735686000,          // 生效时间                  │
│    "iat": 1735686000,          // 签发时间                  │
│    "jti": "unique-id",         // JWT ID                   │
│    // 自定义声明                                            │
│    "name": "张三",                                          │
│    "role": "admin"                                          │
│  }                                                          │
│                                                             │
│  Signature (签名):                                          │
│  HMACSHA256(                                                │
│    base64UrlEncode(header) + "." + base64UrlEncode(payload),│
│    secret                                                   │
│  )                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// JWT签名算法
const jwtAlgorithms = {
  // 对称加密（共享密钥）
  HS256: 'HMAC SHA-256',
  HS384: 'HMAC SHA-384',
  HS512: 'HMAC SHA-512',

  // 非对称加密（公钥/私钥）
  RS256: 'RSA SHA-256',
  RS384: 'RSA SHA-384',
  RS512: 'RSA SHA-512',
  ES256: 'ECDSA P-256 SHA-256',
  ES384: 'ECDSA P-384 SHA-384',
  ES512: 'ECDSA P-521 SHA-512',
  PS256: 'RSA-PSS SHA-256',
};

// JWT生成和验证
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class JWTService {
  private secret: string;
  private publicKey: string;
  private privateKey: string;
  private algorithm: jwt.Algorithm;

  constructor(config: JWTConfig) {
    this.secret = config.secret;
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.algorithm = config.algorithm || 'RS256';
  }

  // 生成访问令牌
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.privateKey || this.secret, {
      algorithm: this.algorithm,
      expiresIn: '1h',
      issuer: 'auth.example.com',
      audience: 'api.example.com',
      subject: payload.userId,
      jwtid: crypto.randomBytes(16).toString('hex'),
    });
  }

  // 生成刷新令牌
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { type: 'refresh', userId },
      this.secret,
      { expiresIn: '7d' }
    );
  }

  // 验证令牌
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicKey || this.secret, {
        algorithms: [this.algorithm],
        issuer: 'auth.example.com',
        audience: 'api.example.com',
      }) as TokenPayload & jwt.JwtPayload;

      // 检查是否过期
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // 解码令牌（不验证）
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  // 刷新令牌
  refreshAccessToken(refreshToken: string): string | null {
    try {
      const decoded = jwt.verify(refreshToken, this.secret) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        return null;
      }

      // 获取用户信息并生成新的访问令牌
      const user = getUserById(decoded.userId);
      if (!user) {
        return null;
      }

      return this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      return null;
    }
  }
}

interface JWTConfig {
  secret: string;
  publicKey?: string;
  privateKey?: string;
  algorithm?: jwt.Algorithm;
}
```

### 3.2 JWT安全实践

```typescript
// JWT安全最佳实践

// 1. 使用短期令牌
const tokenConfig = {
  accessToken: {
    expiresIn: '15m', // 15分钟
  },
  refreshToken: {
    expiresIn: '7d', // 7天
  },
};

// 2. 实现令牌黑名单
class TokenBlacklist {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  // 添加到黑名单
  async addToBlacklist(tokenId: string, expiresAt: number): Promise<void> {
    const ttl = expiresAt - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.setex(`blacklist:${tokenId}`, ttl, '1');
    }
  }

  // 检查是否在黑名单
  async isBlacklisted(tokenId: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${tokenId}`);
    return result !== null;
  }
}

// 3. 令牌轮换
class TokenRotation {
  private jwtService: JWTService;
  private blacklist: TokenBlacklist;

  // 刷新令牌时轮换
  async rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair> {
    const decoded = this.jwtService.verifyToken(oldRefreshToken);

    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // 将旧令牌加入黑名单
    await this.blacklist.addToBlacklist(decoded.jti, decoded.exp);

    // 生成新的令牌对
    const newAccessToken = this.jwtService.generateAccessToken(decoded);
    const newRefreshToken = this.jwtService.generateRefreshToken(decoded.userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

// 4. 安全存储
// 浏览器端
const secureStorage = {
  // 不要存储在localStorage（XSS风险）
  // 使用HttpOnly Cookie

  // 如果必须存储在客户端
  setToken(token: string): void {
    // 使用sessionStorage（关闭标签页清除）
    sessionStorage.setItem('token', token);
  },

  getToken(): string | null {
    return sessionStorage.getItem('token');
  },

  clearToken(): void {
    sessionStorage.removeItem('token');
  },
};

// 5. 传输安全
// 使用HttpOnly、Secure、SameSite Cookie
app.use(session({
  name: 'sessionId',
  secret: 'your-secret',
  cookie: {
    httpOnly: true,  // 防止XSS
    secure: true,    // 仅HTTPS
    sameSite: 'strict', // 防止CSRF
    maxAge: 24 * 60 * 60 * 1000, // 1天
  },
}));

// 6. 令牌验证中间件
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);

  // 验证令牌
  const payload = jwtService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: '无效或过期的令牌' });
  }

  // 检查黑名单
  if (await blacklist.isBlacklisted(payload.jti)) {
    return res.status(401).json({ error: '令牌已被撤销' });
  }

  // 将用户信息附加到请求
  req.user = payload;
  next();
}
```

---

## 4. 实战实现

### 4.1 第三方登录集成

```typescript
// 第三方OAuth登录实现

// Google OAuth
class GoogleOAuth {
  private config = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/auth/google/callback',
    scope: 'openid email profile',
  };

  // 获取授权URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // 用授权码换取令牌
  async getTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    return response.json();
  }

  // 获取用户信息
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.json();
  }
}

// GitHub OAuth
class GitHubOAuth {
  private config = {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/auth/github/callback',
    scope: 'user:email',
  };

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getTokens(code: string): Promise<GitHubTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    return response.json();
  }

  async getUserInfo(accessToken: string): Promise<GitHubUserInfo> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.json();
  }
}

// 统一OAuth路由
app.get('/auth/:provider', (req, res) => {
  const provider = req.params.provider;
  const state = crypto.randomBytes(16).toString('hex');

  // 存储state
  req.session.oauthState = state;

  let authUrl: string;

  switch (provider) {
    case 'google':
      authUrl = googleOAuth.getAuthorizationUrl(state);
      break;
    case 'github':
      authUrl = githubOAuth.getAuthorizationUrl(state);
      break;
    default:
      return res.status(400).json({ error: '不支持的登录方式' });
  }

  res.redirect(authUrl);
});

app.get('/auth/:provider/callback', async (req, res) => {
  const { code, state } = req.query;
  const provider = req.params.provider;

  // 验证state
  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: '无效的state参数' });
  }

  try {
    let userInfo: any;

    switch (provider) {
      case 'google': {
        const tokens = await googleOAuth.getTokens(code as string);
        userInfo = await googleOAuth.getUserInfo(tokens.access_token);
        break;
      }
      case 'github': {
        const tokens = await githubOAuth.getTokens(code as string);
        userInfo = await githubOAuth.getUserInfo(tokens.access_token);
        break;
      }
    }

    // 查找或创建用户
    const user = await findOrCreateUser(provider, userInfo);

    // 生成本地令牌
    const accessToken = jwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 重定向到前端
    res.redirect(`/auth/success?token=${accessToken}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/auth/error');
  }
});
```

### 4.2 完整认证系统

```typescript
// 完整认证系统实现

import bcrypt from 'bcrypt';
import { Router } from 'express';

const authRouter = Router();

// 注册
authRouter.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // 验证输入
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }

  // 检查用户是否存在
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: '邮箱已被注册' });
  }

  // 哈希密码
  const hashedPassword = await bcrypt.hash(password, 12);

  // 创建用户
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    emailVerified: false,
  });

  // 发送验证邮件
  await sendVerificationEmail(user.id, email);

  res.status(201).json({
    message: '注册成功，请查收验证邮件',
    userId: user.id,
  });
});

// 登录
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  // 检查邮箱验证
  if (!user.emailVerified) {
    return res.status(403).json({ error: '请先验证邮箱' });
  }

  // 生成令牌
  const accessToken = jwtService.generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = jwtService.generateRefreshToken(user.id);

  // 存储刷新令牌
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // 设置Cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// 刷新令牌
authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: '未提供刷新令牌' });
  }

  // 检查令牌是否存在
  const storedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return res.status(401).json({ error: '无效或过期的刷新令牌' });
  }

  // 获取用户
  const user = await User.findById(storedToken.userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  // 删除旧的刷新令牌
  await RefreshToken.deleteOne({ token: refreshToken });

  // 生成新的令牌对
  const newAccessToken = jwtService.generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = jwtService.generateRefreshToken(user.id);

  // 存储新的刷新令牌
  await RefreshToken.create({
    token: newRefreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // 设置Cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
});

// 登出
authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // 删除刷新令牌
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  // 清除Cookie
  res.clearCookie('refreshToken');

  res.json({ message: '登出成功' });
});

// 邮箱验证
authRouter.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  const verification = await EmailVerification.findOne({ token });
  if (!verification || verification.expiresAt < new Date()) {
    return res.status(400).json({ error: '无效或过期的验证链接' });
  }

  // 更新用户
  await User.updateOne(
    { _id: verification.userId },
    { emailVerified: true }
  );

  // 删除验证记录
  await EmailVerification.deleteOne({ token });

  res.json({ message: '邮箱验证成功' });
});

// 忘记密码
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // 不透露用户是否存在
    return res.json({ message: '如果邮箱存在，将收到重置密码邮件' });
  }

  // 生成重置令牌
  const resetToken = crypto.randomBytes(32).toString('hex');
  await PasswordReset.create({
    token: resetToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1小时
  });

  // 发送重置邮件
  await sendPasswordResetEmail(email, resetToken);

  res.json({ message: '如果邮箱存在，将收到重置密码邮件' });
});

// 重置密码
authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  const reset = await PasswordReset.findOne({ token });
  if (!reset || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: '无效或过期的重置令牌' });
  }

  // 哈希新密码
  const hashedPassword = await bcrypt.hash(password, 12);

  // 更新密码
  await User.updateOne({ _id: reset.userId }, { password: hashedPassword });

  // 删除重置令牌
  await PasswordReset.deleteOne({ token });

  // 删除所有刷新令牌（强制重新登录）
  await RefreshToken.deleteMany({ userId: reset.userId });

  res.json({ message: '密码重置成功' });
});
```

---

## 5. 安全最佳实践

### 5.1 安全清单

```typescript
// OAuth2.0安全最佳实践

const securityChecklist = {
  // 令牌安全
  tokens: [
    '✅ 使用短期访问令牌（15-30分钟）',
    '✅ 使用刷新令牌轮换',
    '✅ 实现令牌黑名单',
    '✅ 使用强加密算法（RS256/ES256）',
    '❌ 不要在URL中传递令牌',
    '❌ 不要在localStorage存储令牌',
  ],

  // 授权码安全
  authorizationCode: [
    '✅ 使用PKCE扩展',
    '✅ 验证state参数',
    '✅ 授权码一次性使用',
    '✅ 授权码短期有效（10分钟）',
    '❌ 不要在授权码中包含敏感信息',
  ],

  // 重定向安全
  redirect: [
    '✅ 严格验证redirect_uri',
    '✅ 使用白名单验证',
    '✅ 禁止通配符匹配',
    '❌ 不要允许开放重定向',
  ],

  // 客户端安全
  client: [
    '✅ 验证client_id',
    '✅ 公共客户端使用PKCE',
    '✅ 机密客户端验证client_secret',
    '❌ 不要在前端暴露client_secret',
  ],

  // 会话安全
  session: [
    '✅ 使用HttpOnly Cookie',
    '✅ 使用Secure标志',
    '✅ 使用SameSite=Strict',
    '✅ 实现会话过期',
    '✅ 登出时清除所有会话',
  ],
};

// 安全配置示例
const secureConfig = {
  // JWT配置
  jwt: {
    algorithm: 'RS256',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: 'auth.example.com',
    audience: 'api.example.com',
  },

  // Cookie配置
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  // 密码配置
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    bcryptRounds: 12,
  },

  // 速率限制
  rateLimit: {
    login: { max: 5, window: '15m' },
    register: { max: 3, window: '1h' },
    passwordReset: { max: 3, window: '1h' },
  },
};
```

---

## 6. 面试高频问题

### 问题1：OAuth2.0授权码模式流程？

**答案：**
1. 客户端重定向用户到授权服务器
2. 用户登录并授权
3. 授权服务器返回授权码
4. 客户端用授权码换取令牌
5. 客户端使用令牌访问资源

### 问题2：为什么需要PKCE？

**答案：**
- 防止授权码被截获
- 攻击者没有code_verifier无法换取令牌
- 适用于无法安全存储client_secret的客户端

### 问题3：JWT vs Session的区别？

**答案：**
| 方面 | JWT | Session |
|------|-----|---------|
| 存储 | 客户端 | 服务器 |
| 扩展性 | 无状态，易扩展 | 需要共享存储 |
| 安全性 | 无法主动失效 | 可立即失效 |
| 大小 | 较大 | Cookie较小 |

### 问题4：如何实现JWT撤销？

**答案：**
1. 短期令牌 + 刷新令牌
2. 令牌黑名单（Redis）
3. 版本号机制
4. 密钥轮换

### 问题5：OAuth2.0常见安全漏洞？

**答案：**
1. 开放重定向
2. CSRF攻击（缺少state验证）
3. 授权码泄露
4. 令牌存储不当
5. 宽松的redirect_uri验证

---

## 7. 最佳实践总结

### 7.1 实现清单

- [ ] 使用授权码模式 + PKCE
- [ ] 实现刷新令牌轮换
- [ ] 验证state参数
- [ ] 严格验证redirect_uri
- [ ] 使用短期访问令牌
- [ ] 实现令牌黑名单
- [ ] 使用HttpOnly Cookie
- [ ] 实现速率限制

### 7.2 安全清单

- [ ] 使用HTTPS
- [ ] 不在前端存储敏感信息
- [ ] 实现CSRF保护
- [ ] 实现输入验证
- [ ] 记录安全日志
- [ ] 定期审计

---

*本文档最后更新于 2026年3月*