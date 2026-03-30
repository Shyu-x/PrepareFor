# HTTP/HTTPS协议深入

## 目录

1. [HTTP协议基础](#1-http协议基础)
2. [HTTP请求与响应](#2-http请求与响应)
3. [HTTPS与SSL/TLS](#3-https与ssltls)
4. [HTTP缓存机制](#4-http缓存机制)
5. [HTTP/2与HTTP/3](#5-http2与http3)
6. [面试高频问题](#6-面试高频问题)

---

## 1. HTTP协议基础

### 1.1 HTTP协议概述

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP协议特点                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 无状态协议                                              │
│     - 服务器不保存客户端状态                                │
│     - 每次请求独立                                          │
│     - 通过Cookie/Session实现状态管理                        │
│                                                             │
│  2. 基于请求-响应模型                                       │
│     - 客户端发起请求                                        │
│     - 服务器返回响应                                        │
│                                                             │
│  3. 应用层协议                                              │
│     - 基于TCP/IP                                            │
│     - 默认端口80（HTTP）/ 443（HTTPS）                      │
│                                                             │
│  4. 支持多种请求方法                                        │
│     - GET、POST、PUT、DELETE、PATCH等                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 HTTP请求方法

```typescript
// HTTP请求方法详解

interface HTTPMethod {
  method: string;
  description: string;
  idempotent: boolean;  // 幂等性：多次执行结果相同
  safe: boolean;        // 安全性：不修改资源
  body: boolean;        // 是否支持请求体
}

const httpMethods: HTTPMethod[] = [
  {
    method: 'GET',
    description: '获取资源',
    idempotent: true,
    safe: true,
    body: false,
  },
  {
    method: 'POST',
    description: '创建资源',
    idempotent: false,
    safe: false,
    body: true,
  },
  {
    method: 'PUT',
    description: '完整更新资源',
    idempotent: true,
    safe: false,
    body: true,
  },
  {
    method: 'PATCH',
    description: '部分更新资源',
    idempotent: true,
    safe: false,
    body: true,
  },
  {
    method: 'DELETE',
    description: '删除资源',
    idempotent: true,
    safe: false,
    body: false,
  },
  {
    method: 'HEAD',
    description: '获取资源头信息',
    idempotent: true,
    safe: true,
    body: false,
  },
  {
    method: 'OPTIONS',
    description: '获取支持的HTTP方法',
    idempotent: true,
    safe: true,
    body: false,
  },
  {
    method: 'TRACE',
    description: '追踪请求路径',
    idempotent: true,
    safe: true,
    body: false,
  },
  {
    method: 'CONNECT',
    description: '建立隧道连接',
    idempotent: false,
    safe: false,
    body: false,
  },
];

// 幂等性示例
// GET: 多次请求同一资源，结果相同 ✅
// POST: 多次请求可能创建多个资源 ❌
// PUT: 多次更新同一资源，结果相同 ✅
// DELETE: 多次删除同一资源，结果相同 ✅
```

### 1.3 HTTP状态码

```typescript
// HTTP状态码详解

// 1xx 信息响应
const informationalCodes = {
  100: 'Continue - 继续发送请求体',
  101: 'Switching Protocols - 协议切换',
  102: 'Processing - 处理中',
};

// 2xx 成功
const successCodes = {
  200: 'OK - 请求成功',
  201: 'Created - 资源创建成功',
  202: 'Accepted - 请求已接受，处理中',
  204: 'No Content - 成功但无返回内容',
  206: 'Partial Content - 部分内容（断点续传）',
};

// 3xx 重定向
const redirectCodes = {
  301: 'Moved Permanently - 永久重定向',
  302: 'Found - 临时重定向',
  303: 'See Other - 查看其他位置',
  304: 'Not Modified - 资源未修改（缓存）',
  307: 'Temporary Redirect - 临时重定向（保持方法）',
  308: 'Permanent Redirect - 永久重定向（保持方法）',
};

// 4xx 客户端错误
const clientErrorCodes = {
  400: 'Bad Request - 请求格式错误',
  401: 'Unauthorized - 未认证',
  403: 'Forbidden - 无权限',
  404: 'Not Found - 资源不存在',
  405: 'Method Not Allowed - 方法不允许',
  406: 'Not Acceptable - 无法满足Accept头',
  408: 'Request Timeout - 请求超时',
  409: 'Conflict - 资源冲突',
  410: 'Gone - 资源已删除',
  413: 'Payload Too Large - 请求体过大',
  414: 'URI Too Long - URI过长',
  415: 'Unsupported Media Type - 不支持的媒体类型',
  422: 'Unprocessable Entity - 语义错误',
  429: 'Too Many Requests - 请求过多',
  431: 'Request Header Fields Too Large - 请求头过大',
};

// 5xx 服务器错误
const serverErrorCodes = {
  500: 'Internal Server Error - 服务器内部错误',
  501: 'Not Implemented - 功能未实现',
  502: 'Bad Gateway - 网关错误',
  503: 'Service Unavailable - 服务不可用',
  504: 'Gateway Timeout - 网关超时',
  505: 'HTTP Version Not Supported - HTTP版本不支持',
};

// Express状态码使用示例
import express from 'express';

const app = express();

app.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user); // 默认200
});

app.post('/users', async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json(user); // 创建成功返回201
});

app.delete('/users/:id', async (req, res) => {
  await deleteUser(req.params.id);
  res.status(204).send(); // 删除成功返回204
});
```

---

## 2. HTTP请求与响应

### 2.1 HTTP请求结构

```typescript
// HTTP请求结构详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    HTTP请求结构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/users HTTP/1.1          ← 请求行                 │
│  Host: example.com                 ← 请求头                 │
│  Content-Type: application/json                              │
│  Authorization: Bearer token                                  │
│  User-Agent: Mozilla/5.0                                     │
│  Accept: application/json                                    │
│  Content-Length: 42                                          │
│                                                              │
│  {                                 ← 请求体                  │
│    "name": "张三",                                           │
│    "email": "zhangsan@example.com"                           │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
*/

// 常见请求头
const commonRequestHeaders = {
  // 请求目标
  Host: 'example.com',           // 目标主机
  Origin: 'https://client.com',  // 请求来源

  // 内容协商
  Accept: 'application/json',                    // 接受的响应类型
  'Accept-Encoding': 'gzip, deflate, br',        // 接受的编码
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',  // 接受的语言

  // 内容类型
  'Content-Type': 'application/json',   // 请求体类型
  'Content-Length': '42',               // 请求体长度
  'Content-Encoding': 'gzip',           // 请求体编码

  // 认证
  Authorization: 'Bearer <token>',      // 认证信息
  Cookie: 'sessionId=abc123',           // Cookie

  // 缓存
  'Cache-Control': 'no-cache',         // 缓存控制
  'If-Modified-Since': 'Wed, 21 Oct 2025 07:28:00 GMT',  // 条件请求
  'If-None-Match': '"etag-value"',     // 条件请求

  // 用户代理
  'User-Agent': 'Mozilla/5.0...',      // 用户代理

  // 连接
  Connection: 'keep-alive',            // 连接控制
  'Keep-Alive': 'timeout=5, max=100',  // 保持连接

  // CORS
  'Access-Control-Request-Method': 'POST',  // 预检请求方法
  'Access-Control-Request-Headers': 'X-Custom-Header',  // 预检请求头
};

// Content-Type常见类型
const contentTypes = {
  // 文本类型
  'text/plain': '纯文本',
  'text/html': 'HTML文档',
  'text/css': 'CSS样式表',
  'text/javascript': 'JavaScript代码',

  // JSON
  'application/json': 'JSON数据',
  'application/ld+json': 'JSON-LD数据',

  // 表单
  'application/x-www-form-urlencoded': 'URL编码表单',
  'multipart/form-data': '多部分表单（文件上传）',

  // 二进制
  'application/octet-stream': '二进制流',
  'application/pdf': 'PDF文档',
  'application/zip': 'ZIP压缩包',

  // 图片
  'image/jpeg': 'JPEG图片',
  'image/png': 'PNG图片',
  'image/gif': 'GIF图片',
  'image/webp': 'WebP图片',
  'image/svg+xml': 'SVG图片',

  // 音视频
  'audio/mpeg': 'MP3音频',
  'video/mp4': 'MP4视频',
};
```

### 2.2 HTTP响应结构

```typescript
// HTTP响应结构详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    HTTP响应结构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP/1.1 200 OK                   ← 状态行                 │
│  Date: Wed, 21 Oct 2025 07:28:00 GMT ← 响应头               │
│  Content-Type: application/json                              │
│  Content-Length: 42                                          │
│  Cache-Control: max-age=3600                                 │
│  ETag: "etag-value"                                          │
│  Set-Cookie: sessionId=abc123; HttpOnly; Secure              │
│                                                              │
│  {                                 ← 响应体                  │
│    "id": 1,                                                  │
│    "name": "张三"                                            │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
*/

// 常见响应头
const commonResponseHeaders = {
  // 基本信息
  Date: 'Wed, 21 Oct 2025 07:28:00 GMT',  // 响应时间
  Server: 'nginx/1.18.0',                  // 服务器信息

  // 内容信息
  'Content-Type': 'application/json; charset=utf-8',  // 响应类型
  'Content-Length': '42',              // 响应体长度
  'Content-Encoding': 'gzip',          // 响应编码
  'Content-Language': 'zh-CN',         // 响应语言

  // 缓存控制
  'Cache-Control': 'max-age=3600, public',  // 缓存策略
  ETag: '"etag-value"',                      // 资源版本标识
  'Last-Modified': 'Wed, 21 Oct 2025 07:28:00 GMT',  // 最后修改时间
  Expires: 'Wed, 21 Oct 2025 08:28:00 GMT',  // 过期时间

  // Cookie
  'Set-Cookie': [
    'sessionId=abc123; HttpOnly; Secure; SameSite=Strict',
    'userId=1; Max-Age=86400; Path=/',
  ],

  // 安全
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',  // HSTS
  'X-Content-Type-Options': 'nosniff',      // 禁止MIME嗅探
  'X-Frame-Options': 'DENY',                // 禁止iframe嵌入
  'X-XSS-Protection': '1; mode=block',      // XSS保护
  'Content-Security-Policy': "default-src 'self'",  // CSP

  // CORS
  'Access-Control-Allow-Origin': 'https://client.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',

  // 重定向
  Location: 'https://example.com/new-location',  // 重定向地址

  // 范围请求
  'Accept-Ranges': 'bytes',
  'Content-Range': 'bytes 0-1023/2048',
};

// Express设置响应头
app.get('/api/data', (req, res) => {
  // 设置单个响应头
  res.setHeader('Content-Type', 'application/json');

  // 设置多个响应头
  res.set({
    'Cache-Control': 'max-age=3600',
    'ETag': '"abc123"',
  });

  // 设置Cookie
  res.cookie('sessionId', 'abc123', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1天
  });

  // 清除Cookie
  res.clearCookie('sessionId');

  res.json({ data: 'value' });
});
```

---

## 3. HTTPS与SSL/TLS

### 3.1 HTTPS工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                   HTTPS握手过程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  客户端                                    服务器            │
│    │                                        │               │
│    │  1. Client Hello                       │               │
│    │  (支持的加密套件、随机数)              │               │
│    │ ─────────────────────────────────────► │               │
│    │                                        │               │
│    │  2. Server Hello                       │               │
│    │  (选择的加密套件、随机数)              │               │
│    │ ◄───────────────────────────────────── │               │
│    │                                        │               │
│    │  3. Certificate                        │               │
│    │  (服务器证书)                          │               │
│    │ ◄───────────────────────────────────── │               │
│    │                                        │               │
│    │  4. 验证证书                           │               │
│    │                                        │               │
│    │  5. Client Key Exchange                │               │
│    │  (预主密钥，用服务器公钥加密)          │               │
│    │ ─────────────────────────────────────► │               │
│    │                                        │               │
│    │  6. 双方生成会话密钥                   │               │
│    │                                        │               │
│    │  7. Change Cipher Spec                 │               │
│    │  (切换到加密通信)                      │               │
│    │ ◄─────────────────────────────────────►│               │
│    │                                        │               │
│    │  8. 加密数据传输                       │               │
│    │ ◄─────────────────────────────────────►│               │
│    │                                        │               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 SSL/TLS证书

```typescript
// SSL/TLS证书详解

// 证书类型
const certificateTypes = {
  DV: {
    name: '域名验证证书',
    validation: '验证域名所有权',
    cost: '免费或低价',
    useCase: '个人网站、博客',
  },
  OV: {
    name: '组织验证证书',
    validation: '验证组织身份',
    cost: '中等价格',
    useCase: '企业网站',
  },
  EV: {
    name: '扩展验证证书',
    validation: '严格验证组织身份',
    cost: '高价',
    useCase: '金融、电商',
  },
};

// 证书链
/*
┌─────────────────────────────────────────────────────────────┐
│                     证书链结构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  根证书 (Root CA)                                           │
│  ├── 颁发者: 自己                                           │
│  ├── 用途: 签发中间证书                                      │
│  └── 信任: 预装在操作系统/浏览器中                           │
│                                                             │
│  中间证书 (Intermediate CA)                                  │
│  ├── 颁发者: 根证书                                         │
│  ├── 用途: 签发终端证书                                      │
│  └── 信任: 由根证书背书                                      │
│                                                             │
│  终端证书 (End-entity Certificate)                          │
│  ├── 颁发者: 中间证书                                       │
│  ├── 用途: 服务器身份验证                                    │
│  └── 信任: 由证书链背书                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// Nginx配置HTTPS
/*
server {
    listen 443 ssl http2;
    server_name example.com;

    # 证书配置
    ssl_certificate /etc/ssl/certs/example.com.crt;      # 终端证书
    ssl_certificate_key /etc/ssl/private/example.com.key; # 私钥

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # SSL会话配置
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
*/

// Node.js HTTPS服务器
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt'),
  ca: fs.readFileSync('ca_bundle.crt'), // 证书链
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('Hello HTTPS!');
});

server.listen(443);
```

---

## 4. HTTP缓存机制

### 4.1 缓存类型

```typescript
// HTTP缓存机制详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    HTTP缓存类型                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  强缓存 (不需要向服务器验证)                                 │
│  ├── Expires: 绝对过期时间                                  │
│  └── Cache-Control: max-age=xxx                             │
│                                                             │
│  协商缓存 (需要向服务器验证)                                 │
│  ├── Last-Modified / If-Modified-Since                      │
│  └── ETag / If-None-Match                                   │
│                                                             │
│  缓存位置                                                   │
│  ├── Service Worker Cache                                   │
│  ├── Memory Cache (内存缓存)                                │
│  ├── Disk Cache (磁盘缓存)                                  │
│  └── Push Cache (HTTP/2推送缓存)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// Cache-Control指令
const cacheControlDirectives = {
  // 可缓存性
  'public': '响应可被任何缓存存储',
  'private': '响应只能被浏览器缓存',
  'no-cache': '使用前必须验证',
  'no-store': '不缓存任何内容',
  'no-transform': '不允许转换响应内容',

  // 过期时间
  'max-age=<seconds>': '缓存最大有效期',
  's-maxage=<seconds>': '共享缓存最大有效期',
  'max-stale[=<seconds>]': '接受过期缓存',
  'min-fresh=<seconds>': '要求缓存至少新鲜指定时间',
  'stale-while-revalidate=<seconds>': '后台重新验证时使用过期缓存',
  'stale-if-error=<seconds>': '错误时使用过期缓存',

  // 重新验证
  'must-revalidate': '过期后必须验证',
  'proxy-revalidate': '共享缓存过期后必须验证',
  'immutable': '资源永不变化',
};

// Express缓存配置
import express from 'express';

const app = express();

// 静态文件缓存
app.use(express.static('public', {
  maxAge: '1y',           // 强缓存1年
  immutable: true,        // 资源不变
  etag: true,             // 生成ETag
  lastModified: true,     // 生成Last-Modified
}));

// API缓存控制
app.get('/api/data', (req, res) => {
  // 不缓存
  res.set('Cache-Control', 'no-store');

  // 短时间缓存
  res.set('Cache-Control', 'public, max-age=60');

  // 长时间缓存 + 后台更新
  res.set('Cache-Control', 'public, max-age=31536000, stale-while-revalidate=86400');

  res.json({ data: 'value' });
});

// 协商缓存实现
app.get('/api/data', async (req, res) => {
  const data = await getData();
  const etag = generateETag(data);
  const lastModified = new Date(data.updatedAt).toUTCString();

  // 设置响应头
  res.set('ETag', etag);
  res.set('Last-Modified', lastModified);

  // 检查ETag
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  // 检查Last-Modified
  if (req.headers['if-modified-since'] === lastModified) {
    return res.status(304).end();
  }

  res.json(data);
});

// 生成ETag
import crypto from 'crypto';

function generateETag(data: any): string {
  const content = JSON.stringify(data);
  return '"' + crypto.createHash('md5').update(content).digest('hex') + '"';
}
```

### 4.2 缓存策略

```typescript
// 缓存策略选择

// 1. 静态资源（JS、CSS、图片）
// 使用内容哈希 + 长期缓存
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// 2. HTML页面
// 不缓存或短期缓存
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile('index.html');
});

// 3. API响应
// 根据数据更新频率决定
const apiCacheStrategies = {
  // 实时数据：不缓存
  realtime: 'no-store',

  // 频繁更新：短期缓存
  frequent: 'public, max-age=60',

  // 定期更新：中期缓存 + 后台更新
  periodic: 'public, max-age=3600, stale-while-revalidate=300',

  // 很少更新：长期缓存 + 协商缓存
  stable: 'public, max-age=86400, must-revalidate',
};

// 4. 用户特定数据
// 私有缓存
app.get('/api/user/profile', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  res.json(userProfile);
});

// 5. CDN缓存配置
/*
# CloudFlare页面规则
*example.com/api/*
- Cache Level: Bypass

*example.com/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year
*/
```

---

## 5. HTTP/2与HTTP/3

### 5.1 HTTP/2特性

```typescript
// HTTP/2特性详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    HTTP/2新特性                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 二进制分帧                                              │
│     - 将请求/响应分解为帧                                   │
│     - 更高效解析                                            │
│                                                             │
│  2. 多路复用                                                │
│     - 单个TCP连接并行多个请求                               │
│     - 解决队头阻塞                                          │
│                                                             │
│  3. 头部压缩                                                │
│     - HPACK算法压缩请求头                                   │
│     - 减少传输数据量                                        │
│                                                             │
│  4. 服务器推送                                              │
│     - 服务器主动推送资源                                    │
│     - 减少请求延迟                                          │
│                                                             │
│  5. 请求优先级                                              │
│     - 设置请求优先级                                        │
│     - 关键资源优先加载                                      │
│                                                             │
│  6. 流量控制                                                │
│     - 控制数据传输速度                                      │
│     - 防止缓冲区溢出                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// Nginx启用HTTP/2
/*
server {
    listen 443 ssl http2;
    server_name example.com;

    # HTTP/2推送
    http2_push /static/style.css;
    http2_push /static/main.js;

    # 或使用Link头推送
    add_header Link "</static/style.css>; rel=preload; as=style";
    add_header Link "</static/main.js>; rel=preload; as=script";
}
*/

// Node.js HTTP/2服务器
import http2 from 'http2';
import fs from 'fs';

const server = http2.createSecureServer({
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt'),
});

server.on('stream', (stream, headers) => {
  // 服务器推送
  stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
    if (err) throw err;
    pushStream.respond({
      'content-type': 'text/css',
      ':status': 200,
    });
    pushStream.end('body { color: red; }');
  });

  // 响应请求
  stream.respond({
    'content-type': 'text/html',
    ':status': 200,
  });
  stream.end('<h1>Hello HTTP/2</h1>');
});

server.listen(443);
```

### 5.2 HTTP/3与QUIC

```typescript
// HTTP/3特性详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    HTTP/3特性                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 基于QUIC协议                                            │
│     - 使用UDP替代TCP                                        │
│     - 减少连接建立延迟                                      │
│                                                             │
│  2. 0-RTT连接                                               │
│     - 首次连接后可快速重连                                  │
│     - 减少握手时间                                          │
│                                                             │
│  3. 解决队头阻塞                                            │
│     - 单个丢包不影响其他流                                  │
│     - 多路复用更高效                                        │
│                                                             │
│  4. 连接迁移                                                │
│     - 网络切换不断开连接                                    │
│     - 使用Connection ID                                     │
│                                                             │
│  5. 改进的拥塞控制                                          │
│     - 更精确的RTT测量                                       │
│     - 更好的网络利用率                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// Nginx启用HTTP/3
/*
server {
    listen 443 quic reuseport;
    listen 443 ssl;
    server_name example.com;

    ssl_protocols TLSv1.3;

    # 启用HTTP/3
    add_header Alt-Svc 'h3=":443"; ma=86400';

    # 其他配置...
}
*/
```

### 5.3 现代实时通信：WebTransport 与 SSE

```typescript
// 现代实时通信协议详解

/*
┌─────────────────────────────────────────────────────────────┐
│                    Server-Sent Events (SSE)                  │
├─────────────────────────────────────────────────────────────┤
│  特性：                                                     │
│  1. 单向通信 (Server -> Client)                             │
│  2. 基于 HTTP 协议，无需复杂的握手升级                      │
│  3. 浏览器原生支持断线自动重连                              │
│  4. 适用场景：ChatGPT 打字机效果、股票行情、新闻推送          │
└─────────────────────────────────────────────────────────────┘
*/

// SSE 前端实现
const evtSource = new EventSource("/api/updates", {
  withCredentials: true
});

evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("收到新消息:", data);
};

evtSource.addEventListener("custom_event", (event) => {
  console.log("自定义事件:", event.data);
});

/*
┌─────────────────────────────────────────────────────────────┐
│                    WebTransport (基于 QUIC)                  │
├─────────────────────────────────────────────────────────────┤
│  特性：                                                     │
│  1. WebSocket 的继任者，专为低延迟设计                      │
│  2. 支持双向可靠传输 (Streams) 和不可靠传输 (Datagrams)     │
│  3. 彻底解决 TCP 队头阻塞问题                               │
│  4. 适用场景：云游戏、高频实时对战游戏、低延迟音视频          │
└─────────────────────────────────────────────────────────────┘
*/

// WebTransport 前端基础实现
async function initWebTransport(url) {
  const transport = new WebTransport(url);
  
  await transport.ready; // 等待连接建立

  // 1. 发送不可靠数据报 (类似 UDP，丢包不重传，极低延迟)
  const writer = transport.datagrams.writable.getWriter();
  const data = new TextEncoder().encode("Player Position: x=10,y=20");
  await writer.write(data);

  // 2. 接收单向可靠流 (类似 TCP，保证顺序)
  const reader = transport.incomingUnidirectionalStreams.getReader();
  while (true) {
    const { value: stream, done } = await reader.read();
    if (done) break;
    // 处理独立的数据流...
  }
}
```

---

## 6. 面试高频问题

### 问题1：HTTP和HTTPS的区别？

**答案：**
| 方面 | HTTP | HTTPS |
|------|------|-------|
| 端口 | 80 | 443 |
| 安全性 | 明文传输 | 加密传输 |
| 证书 | 不需要 | 需要SSL证书 |
| 性能 | 较快 | 略慢（握手开销） |
| SEO | 无优势 | 有优势 |

### 问题2：GET和POST的区别？

**答案：**
| 方面 | GET | POST |
|------|-----|------|
| 参数位置 | URL | 请求体 |
| 参数长度 | 有限制 | 无限制 |
| 缓存 | 可缓存 | 默认不缓存 |
| 安全性 | 参数暴露 | 相对安全 |
| 幂等性 | 幂等 | 非幂等 |

### 问题3：HTTP缓存机制？

**答案：**
1. **强缓存**：Expires、Cache-Control
2. **协商缓存**：Last-Modified/If-Modified-Since、ETag/If-None-Match
3. **缓存位置**：Service Worker、Memory Cache、Disk Cache

### 问题4：HTTP/2相比HTTP/1.1的改进？

**答案：**
1. 二进制分帧
2. 多路复用
3. 头部压缩
4. 服务器推送
5. 请求优先级

### 问题5：什么是跨域？如何解决？

**答案：**
跨域是浏览器同源策略限制，解决方案：
1. CORS（推荐）
2. JSONP
3. 代理服务器
4. postMessage

---

## 7. 最佳实践总结

### 7.1 HTTP优化清单

- [ ] 启用HTTPS
- [ ] 启用HTTP/2
- [ ] 配置缓存策略
- [ ] 压缩响应内容
- [ ] 使用CDN
- [ ] 减少HTTP请求
- [ ] 配置安全头

### 7.2 安全配置清单

- [ ] 使用HTTPS
- [ ] 配置HSTS
- [ ] 配置CSP
- [ ] 配置X-Frame-Options
- [ ] 配置X-Content-Type-Options
- [ ] 使用安全的Cookie属性

---

*本文档最后更新于 2026年3月*