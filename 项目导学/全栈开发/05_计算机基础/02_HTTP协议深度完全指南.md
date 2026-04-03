# HTTP 协议深度完全指南

> 前言：如果把互联网比作一个大型餐厅，HTTP 就是这个餐厅的"服务员"。你（浏览器）告诉服务员想要什么菜（发送请求），服务员去厨房（服务器）帮你取来（返回响应）。理解 HTTP，就是理解这个"点餐-取餐"的全过程。

## 一、HTTP 的前世今生

### 1.1 HTTP 的诞生

1990 年，蒂姆·伯纳斯·李（Tim Berners-Lee）在 CERN（欧洲核子研究中心）工作时，发明了 HTTP（HyperText Transfer Protocol，超文本传输协议）。

**最初的设计目标很简单**：
- 在互联网上传输 HTML 页面
- 客户端发起请求，服务器返回响应
- 无状态、无连接

**类比理解**：

```
最初版 HTTP = 餐厅的一次性纸杯
- 用完就扔，不重复使用
- 每次点餐都要重新认识服务员
- 服务员不记得你上次点了什么
```

### 1.2 HTTP 版本演进

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP 时间线                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP/0.9    1991      仅有 GET 方法，HTML 文件传输               │
│     │                                                              │
│     ▼                                                              │
│  HTTP/1.0    1996      增加了POST、HEAD，响应不再局限于HTML        │
│     │                                                              │
│     ▼                                                              │
│  HTTP/1.1    1999      默认 Keep-Alive、缓存、断点续传            │
│     │                                                              │
│     ▼                                                              │
│  HTTP/2      2015      多路复用、头部压缩、服务器推送              │
│     │                                                              │
│     ▼                                                              │
│  HTTP/3      2022      基于 QUIC 协议，解决队头阻塞                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 二、HTTP/1.1 详解

### 2.1 消息结构

HTTP 有两种消息类型：**请求消息**和**响应消息**。

#### 请求消息结构

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP 请求格式                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  请求行                                                            │
│  ┌──────────┬──────────────────────┬─────────────┐              │
│  │  方法    │        URL           │   版本      │              │
│  │  GET    │     /index.html       │  HTTP/1.1   │              │
│  └──────────┴──────────────────────┴─────────────┘              │
│                                                                  │
│  请求头部（一个或多个）                                            │
│  ┌─────────────────┬──────────────────────────────┐             │
│  │     Host        │      www.example.com         │             │
│  ├─────────────────┼──────────────────────────────┤             │
│  │  User-Agent     │      Mozilla/5.0...           │             │
│  ├─────────────────┼──────────────────────────────┤             │
│  │  Accept         │      text/html,...           │             │
│  └─────────────────┴──────────────────────────────┘             │
│                                                                  │
│  空行（CRLF）                                                     │
│                                                                  │
│  请求体（可选，某些方法有）                                        │
│  ┌──────────────────────────────────────────────┐                │
│  │  username=john&password=123456              │                │
│  └──────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码示例**：

```javascript
/**
 * HTTP 请求消息解析
 */

// 模拟一个完整的 HTTP 请求
const httpRequest = `
GET /index.html HTTP/1.1\r\n
Host: www.example.com\r\n
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8\r\n
Accept-Encoding: gzip, deflate, br\r\n
Connection: keep-alive\r\n
\r\n
`;

/**
 * 解析请求行
 */
function parseRequestLine(request) {
  const lines = request.split('\r\n');
  const [method, url, version] = lines[0].split(' ');

  console.log(`方法: ${method}`);
  console.log(`URL: ${url}`);
  console.log(`版本: ${version}`);

  return { method, url, version };
}

/**
 * 解析请求头
 */
function parseHeaders(request) {
  const lines = request.split('\r\n');
  const headers = {};

  // 从第二行开始，到空行之前
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '') break;  // 遇到空行结束

    const [key, value] = lines[i].split(': ');
    headers[key] = value;
  }

  console.log('请求头:', headers);
  return headers;
}

/**
 * 解析请求体
 */
function parseBody(request) {
  const parts = request.split('\r\n\r\n');
  if (parts.length > 1) {
    return parts[1];
  }
  return null;
}

// 测试解析
const parsed = {
  requestLine: parseRequestLine(httpRequest),
  headers: parseHeaders(httpRequest),
  body: parseBody(httpRequest),
};
```

#### 响应消息结构

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP 响应格式                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  状态行                                                            │
│  ┌─────────┬────────────────────────┬─────────────┐            │
│  │  版本   │         状态码          │   状态文本  │            │
│  │HTTP/1.1 │         200            │    OK       │            │
│  └─────────┴────────────────────────┴─────────────┘            │
│                                                                  │
│  响应头部（一个或多个）                                            │
│  ┌─────────────────┬──────────────────────────────┐             │
│  │    Date         │    Wed, 01 Jan 2025 00:00:00 GMT            │
│  ├─────────────────┼──────────────────────────────┤             │
│  │  Content-Type   │    text/html; charset=utf-8   │             │
│  ├─────────────────┼──────────────────────────────┤             │
│  │  Content-Length │    1234                       │             │
│  ├─────────────────┼──────────────────────────────┤             │
│  │  Connection     │    keep-alive                 │             │
│  └─────────────────┴──────────────────────────────┘             │
│                                                                  │
│  空行（CRLF）                                                     │
│                                                                  │
│  响应体（HTML、JSON、图片等）                                      │
│  ┌──────────────────────────────────────────────┐                │
│  │  <!DOCTYPE html>                             │                │
│  │  <html>                                      │                │
│  │    <head>...</head>                          │                │
│  │    <body>...</body>                          │                │
│  │  </html>                                    │                │
│  └──────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 请求方法详解

| 方法 | 含义 | 幂等性 | 安全性 | 请求体 | 典型用途 |
|------|------|--------|--------|--------|----------|
| GET | 获取资源 | 是 | 是 | 无 | 浏览页面 |
| POST | 提交数据 | 否 | 否 | 有 | 登录、注册 |
| PUT | 更新资源 | 是 | 否 | 有 | 更新用户信息 |
| DELETE | 删除资源 | 是 | 否 | 无 | 删除帖子 |
| HEAD | 获取头部 | 是 | 是 | 无 | 检查资源是否存在 |
| OPTIONS | 查询支持的方法 | 是 | 是 | 无 | CORS 预检 |
| PATCH | 部分更新 | 否 | 否 | 有 | 更新部分字段 |

**概念解释**：

- **幂等性**：多次执行与一次执行的结果相同吗？
- **安全性**：是否会修改服务器资源？

```javascript
/**
 * 各请求方法的详细说明
 */

// GET 方法
const getMethod = {
  description: '从服务器获取资源，不会修改服务器数据',

  example: `
    GET /users/123 HTTP/1.1
    Host: api.example.com

    响应: 返回用户 123 的信息
  `,

  features: [
    '请求参数通过 URL 传递',
    '参数有长度限制（约 2KB）',
    '参数暴露在 URL 中，不适合敏感数据',
    '可以缓存',
  ],
};

// POST 方法
const postMethod = {
  description: '向服务器提交数据，会创建新资源',

  example: `
    POST /users HTTP/1.1
    Host: api.example.com
    Content-Type: application/json

    {"name": "张三", "email": "zhangsan@example.com"}

    响应: 201 Created
    Location: /users/456
  `,

  features: [
    '请求体可以发送任意类型数据',
    '没有长度限制（或限制很大）',
    '参数不会出现在 URL 中',
    '通常用于创建资源',
  ],

  // GET vs POST 区别
  getVsPost: {
    purpose: 'GET 获取，POST 创建',
    location: 'GET 在 URL，POST 在 Body',
    size: 'GET 小，POST 大',
    cache: 'GET 可缓存，POST 通常不缓存',
    idempotent: 'GET 幂等，POST 不幂等',
  },
};

// PUT vs PATCH
const putVsPatch = {
  put: `
    PUT 是完整更新，替换整个资源

    PUT /users/123
    {"name": "李四", "email": "lisi@example.com"}

    如果原来 user 123 是 {"name": "张三", "age": 20}
    执行 PUT 后变成 {"name": "李四", "email": "lisi@example.com"}
    age 字段丢失了！
  `,

  patch: `
    PATCH 是部分更新，只修改指定字段

    PATCH /users/123
    {"name": "李四"}

    执行 PATCH 后 user 123 变成 {"name": "李四", "age": 20}
    只有 name 被修改了
  `,

  // 实际项目中的选择
  whenToUse: `
    1. 明确知道资源的完整结构 → PUT
    2. 只修改部分字段 → PATCH
    3. 不确定结构或数据较大 → PATCH
  `,
};
```

### 2.3 状态码详解

HTTP 状态码是服务器返回给客户端的"执行结果"，分为五大类：

| 类别 | 范围 | 含义 |
|------|------|------|
| 1xx | 100-199 | 信息性状态码，连接处理中 |
| 2xx | 200-299 | 成功状态码 |
| 3xx | 300-399 | 重定向状态码 |
| 4xx | 400-499 | 客户端错误状态码 |
| 5xx | 500-599 | 服务端错误状态码 |

```javascript
/**
 * 常见状态码详解
 */

// 1xx 信息性状态码
const informational = {
  100: `
    Continue（继续）
    客户端发送大型请求体之前，服务器告诉客户端可以继续

    场景：
    1. 客户端发送 PUT /users/123
    2. 服务器返回 100 Continue
    3. 客户端发送请求体
    4. 服务器返回最终响应
  `,

  101: `
    Switching Protocols（切换协议）
    服务器同意切换到更高版本的协议

    场景：WebSocket 升级
    Upgrade: websocket
    Connection: Upgrade
  `,
};

// 2xx 成功状态码
const success = {
  200: 'OK - 请求成功，默认状态',

  201: `
    Created - 资源创建成功
    通常用于 POST 请求成功

    响应头通常包含：
    Location: /users/456
  `,

  204: `
    No Content - 没有内容
    请求成功，但响应没有body

    场景：DELETE 成功后
  `,

  206: `
    Partial Content - 部分内容
    用于断点续传或多范围下载

    响应头：
    Content-Range: bytes 0-999/12345
  `,
};

// 3xx 重定向状态码
const redirection = {
  301: `
    Moved Permanently - 永久重定向
    浏览器会缓存这个重定向
    SEO 权重会传递到新地址
  `,

  302: `
    Found - 临时重定向
    浏览器不缓存（但实际很多会缓存）
    可能导致 SEO 问题

    重要：POST 请求会变成 GET
  `,

  303: `
    See Other - 强制使用 GET
    解决 POST 重定向的问题

    POST /login → 303 → GET /dashboard
  `,

  304: `
    Not Modified - 未修改
    使用缓存，不需要传输内容

    触发条件：
    - 客户端有缓存
    - 服务器验证后，发现缓存仍然有效
  `,

  307: `
    Temporary Redirect - 临时重定向
    与 302 的区别：保持请求方法不变

    POST /login → 307 → POST /new-login
  `,

  308: `
    Permanent Redirect - 永久重定向
    与 301 的区别：保持请求方法不变
  `,

  // 301 vs 302 vs 303 vs 307 vs 308
  comparison: `
    | 状态码 | 永久/临时 | 方法是否改变 | 缓存 |
    |--------|----------|-------------|------|
    | 301    | 永久     | GET         | 是   |
    | 302    | 临时     | 通常变 GET  | 不确定|
    | 303    | 临时     | 强制变 GET  | 否   |
    | 307    | 临时     | 保持不变    | 否   |
    | 308    | 永久     | 保持不变    | 是   |
  `,
};

// 4xx 客户端错误状态码
const clientError = {
  400: `
    Bad Request - 坏请求
    请求语法错误或参数错误

    场景：JSON 格式错误，缺少必填字段
  `,

  401: `
    Unauthorized - 未认证
    需要登录或提供认证信息

    响应头通常包含：
    WWW-Authenticate: Bearer realm="API"
  `,

  403: `
    Forbidden - 禁止访问
    已认证，但无权访问

    与 401 的区别：
    - 401：不知道你是谁
    - 403：知道你是谁，但你没有权限
  `,

  404: `
    Not Found - 资源不存在

    注意：也用于隐藏资源存在的事实
    比如：不知道用户是否存在，返回 404
  `,

  405: `
    Method Not Allowed - 方法不允许
    资源不支持该 HTTP 方法

    响应头包含：
    Allow: GET, POST, HEAD
  `,

  408: `
    Request Timeout - 请求超时
    服务器等待请求超时
  `,

  409: `
    Conflict - 冲突
    请求与服务器状态冲突

    场景：更新文章，但文章已被其他人修改
  `,

  413: `
    Payload Too Large - 请求体太大
    通常有配置限制
  `,

  422: `
    Unprocessable Entity - 无法处理
    请求格式正确，但语义错误

    场景：验证失败
  `,

  429: `
    Too Many Requests - 请求过多
    限流触发

    响应头包含：
    Retry-After: 3600
  `,

  // 401 vs 403 深入理解
  authVsForbidden: `
    401 Unauthorized:
    - 你去医院看病
    - 保安说"请出示您的身份证"
    - 你还没有证明你的身份

    403 Forbidden:
    - 你去医院看病
    - 刷卡后显示"您的会员资格已被取消"
    - 医院知道你是谁，但不让你进
  `,
};

// 5xx 服务器错误状态码
const serverError = {
  500: `
    Internal Server Error - 服务器内部错误
    最常见的服务器错误状态码
    通常是代码 bug 或配置问题
  `,

  502: `
    Bad Gateway - 网关错误
    作为网关的服务器收到了无效响应

    场景：Nginx + uwsgi/php-fpm
    Nginx 收不到后端的有效响应
  `,

  503: `
    Service Unavailable - 服务不可用
    服务器暂时无法处理请求

    场景：
    - 维护中
    - 过载保护
    - 启动中
  `,

  504: `
    Gateway Timeout - 网关超时
    作为网关的服务器等待响应超时
  `,

  // 502 vs 504 区别
  bad502vs504: `
    502 Bad Gateway:
    - 后端直接返回了错误响应
    - 后端服务器"醒了但回答的是胡话"

    504 Gateway Timeout:
    - 后端服务器没有及时响应
    - 后端服务器"睡着了没回答"
  `,
};
```

### 2.4 Keep-Alive 连接复用

**什么是 Keep-Alive？**

在 HTTP/1.0 中，每个请求都要建立一个新的 TCP 连接，用完就关闭。这就像每次去餐厅都要重新找一个服务员，点完菜就让他离开，下次再找一个新服务员。

HTTP/1.1 引入了 Keep-Alive（持久连接），可以在一个 TCP 连接上发送多个请求。

```javascript
/**
 * Keep-Alive 详解
 */

// 无 Keep-Alive（HTTP/1.0 默认）
const withoutKeepAlive = {
  problem: `
    1. 每次请求都要建立 TCP 连接（三次握手）
    2. 每次响应后关闭连接（四次挥手）
    3. 页面有 10 个资源，就要建立 10 次连接
    4. 每次握手/挥手都需要时间
  `,

  timeline: `
    连接1: SYN → SYN+ACK → ACK → HTTP请求 → HTTP响应 → FIN → ACK → FIN → ACK
    连接2: SYN → SYN+ACK → ACK → HTTP请求 → HTTP响应 → FIN → ACK → FIN → ACK
    连接3: SYN → SYN+ACK → ACK → HTTP请求 → HTTP响应 → FIN → ACK → FIN → ACK
    ...
  `,

  cost: `
    每次建立连接的成本：
    - 3 次握手（1.5 RTT）
    - 如果是 HTTPS，还要加 TLS 握手（1-2 RTT）

    10 个资源 × 1.5 RTT = 15 RTT 额外开销
  `,
};

// 有 Keep-Alive（HTTP/1.1 默认）
const withKeepAlive = {
  solution: `
    1. TCP 连接建立后不关闭
    2. 可以发送多个 HTTP 请求
    3. 用 Connection: close 告诉对方关闭连接
  `,

  timeline: `
    连接1（复用）:
    SYN → SYN+ACK → ACK → HTTP请求1 → HTTP响应1
                                  → HTTP请求2 → HTTP响应2
                                  → HTTP请求3 → HTTP响应3
                              FIN → ACK → FIN → ACK
  `,

  config: `
    HTTP/1.1 中 Keep-Alive 是默认开启的

    可以通过请求头控制：
    Connection: keep-alive  // 保持连接（默认）
    Connection: close      // 请求后关闭连接

    服务端配置：
    KeepAlive On
    MaxKeepAliveRequests 100      // 最大请求数
    KeepAliveTimeout 5            // 空闲超时（秒）
  `,
};

// Keep-Alive 的问题：队头阻塞
const headOfLineBlocking = {
  problem: `
    虽然连接可以复用，但同一时刻只能有一个请求在传输

    场景：
    1. 请求1（HTML）发出
    2. 请求2（CSS）发出
    3. 响应1 还没回来
    4. 请求3（JS）必须等待

    就像：
    - 餐厅只有一个厨师
    - 点3道菜，但只能等第一道上完才能上下一个
  `,

  workaround: `
    为了绕过这个问题，浏览器通常：
    1. 打开 6-8 个并发连接
    2. 把资源分布到不同域名（域名分片）
    3. 合并小文件（CSS/JS 打包）
    4. 内联小资源（base64 in CSS）
  `,
};
```

### 2.5 分块传输编码

当服务器无法预先知道响应体大小时（比如动态内容），可以使用分块传输（Chunked Transfer Encoding）。

```javascript
/**
 * 分块传输编码详解
 */

// 普通传输 vs 分块传输
const transferComparison = {
  normal: `
    普通传输需要知道 Content-Length

    HTTP/1.1 200 OK
    Content-Type: text/html
    Content-Length: 1234

    <html>...</html>

    缺点：必须等内容全部生成才能发送
  `,

  chunked: `
    分块传输不需要预知长度

    HTTP/1.1 200 OK
    Content-Type: text/html
    Transfer-Encoding: chunked

    12\r\n              ← 第一个分块：16 字节（十六进制）
    <html><body>\r\n     ← 内容

    9\r\n               ← 第二个分块：9 字节
    你好世界\r\n        ← 内容

    0\r\n               ← 最后一个分块：0，表示结束
    \r\n
  `,

  benefit: `
    分块传输的优势：
    1. 不需要预先计算 Content-Length
    2. 可以边生成边发送，减少延迟
    3. 可以使用" trailer" 头在所有内容后添加
  `,
};

// 分块传输代码示例
const chunkedExample = {
  // 模拟 Node.js 分块响应
  nodejs: `
    const http = require('http');

    http.createServer((req, res) => {
      // 设置分块传输
      res.writeHead(200, {'Transfer-Encoding': 'chunked'});

      // 分多次发送
      res.write('第一块数据');
      setTimeout(() => res.write('第二块数据'), 1000);
      setTimeout(() => res.write('第三块数据'), 2000);
      setTimeout(() => res.end(), 3000);
    }).listen(8080);
  `,

  // 解析分块响应
  parseChunked: `
    // 分块响应的格式
    const parseChunked = (buffer) => {
      const chunks = [];
      let i = 0;

      while (i < buffer.length) {
        // 读取分块大小（直到 \r\n）
        let chunkSize = 0;
        while (i < buffer.length && buffer[i] !== 0x0D) { // 不是 '\r'
          chunkSize = chunkSize * 16 + parseInt(String.fromCharCode(buffer[i]), 16);
          i++;
        }
        i += 2; // 跳过 \r\n

        // 读取分块内容
        const chunk = buffer.slice(i, i + chunkSize);
        chunks.push(chunk);
        i += chunkSize + 2; // 跳过内容和 \r\n

        if (chunkSize === 0) break; // 结束
      }

      return Buffer.concat(chunks);
    };
  `,
};
```

### 2.6 缓存机制详解

HTTP 缓存是提升 Web 性能的关键技术。

#### 缓存相关头部

```javascript
/**
 * HTTP 缓存相关的头部字段
 */

// 1. Cache-Control（HTTP/1.1）
const cacheControl = {
  // 请求指令
  requestDirectives: `
    Cache-Control: max-age=3600        // 缓存有效期
    Cache-Control: no-cache             // 强制验证
    Cache-Control: no-store             // 不缓存
    Cache-Control: only-if-cached       // 只用缓存
  `,

  // 响应指令
  responseDirectives: `
    Cache-Control: public               // 可被任何缓存存储
    Cache-Control: private               // 只能被浏览器缓存
    Cache-Control: max-age=3600          // 缓存有效期
    Cache-Control: no-cache             // 需重新验证
    Cache-Control: no-store              // 不缓存
    Cache-Control: must-revalidate       // 过期后必须验证
    Cache-Control: stale-while-revalidate=60  // 过期后仍可用，后台验证
  `,

  // 常见配置示例
  examples: `
    // 缓存 1 小时
    Cache-Control: max-age=3600

    // 不缓存（敏感数据）
    Cache-Control: no-store

    // 验证后使用（电商页面库存）
    Cache-Control: no-cache

    // 浏览器独享
    Cache-Control: private, max-age=3600

    // 公共缓存，CDN 使用
    Cache-Control: public, max-age=86400
  `,
};

// 2. Expires（HTTP/1.0）
const expires = {
  description: '指定缓存过期的绝对时间',

  example: `
    Expires: Wed, 01 Jan 2025 00:00:00 GMT
  `,

  problem: `
    缺点：
    - 时间是绝对时间，依赖客户端时钟
    - 如果服务器和客户端时间不一致，可能出问题
    - HTTP/1.1 用 max-age 代替
  `,
};

// 3. ETag / If-None-Match
const etag = {
  description: '资源的唯一标识符，类似于文件的指纹',

  workflow: `
    首次请求：
    GET /index.html
    响应：
    200 OK
    ETag: "abc123"

    后续请求：
    GET /index.html
    If-None-Match: "abc123"

    服务器检查 ETag：
    - 如果匹配（资源没变）→ 304 Not Modified
    - 如果不匹配（资源变了）→ 200 OK + 新内容
  `,

  strongVsWeak: `
    强 ETag：完全精确匹配
    ETag: "abc123"

    弱 ETag：语义相同即可
    ETag: W/"abc123"

    弱 ETag 用于：
    - HTML 内容一样，但注释不同
    - 生成时间不同
  `,
};

// 4. Last-Modified / If-Modified-Since
const lastModified = {
  description: '资源最后一次修改的时间',

  workflow: `
    首次请求：
    GET /index.html
    响应：
    200 OK
    Last-Modified: Wed, 01 Jan 2025 12:00:00 GMT

    后续请求：
    GET /index.html
    If-Modified-Since: Wed, 01 Jan 2025 12:00:00 GMT

    服务器检查时间：
    - 如果未修改 → 304 Not Modified
    - 如果已修改 → 200 OK + 新内容
  `,

  disadvantage: `
    缺点：
    - 时间精度是秒级
    - 如果修改在 1 秒内完成，可能检测不到
    - 建议配合 ETag 使用
  `,
};

// 5. Vary - 缓存的变体
const varyHeader = {
  description: '指定哪些请求头影响缓存',

  example: `
    // 响应
    Vary: Accept-Encoding
    Vary: Accept-Language
    Vary: User-Agent

    // 场景
    请求1: Accept-Encoding: gzip  → 缓存 gzip 版本
    请求2: Accept-Encoding: br    → 不能用 gzip 缓存，需新请求
  `,
};
```

#### 缓存决策流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       缓存决策流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      请求到达                                    │
│                         │                                        │
│                         ▼                                        │
│               ┌─────────────────┐                               │
│               │  缓存是否新鲜？   │                               │
│               │ max-age / Expires│                               │
│               └────────┬────────┘                               │
│                        │                                         │
│           ┌───────────┴───────────┐                            │
│           ▼                       ▼                             │
│        新鲜                       不新鲜                         │
│           │                       │                             │
│           ▼                       ▼                             │
│    ┌────────────┐          ┌────────────────┐                   │
│    │ 直接使用   │          │  发送验证请求   │                   │
│    │  缓存      │          │ ETag/Last-Mod  │                   │
│    └────────────┘          └───────┬────────┘                   │
│                                    │                             │
│                           ┌────────┴────────┐                   │
│                           ▼                 ▼                   │
│                        304 (有效)        200 (过期)              │
│                           │                 │                   │
│                           ▼                 ▼                   │
│                    ┌───────────┐    ┌───────────┐               │
│                    │ 更新缓存   │    │  使用新响应│              │
│                    │ 使用旧缓存 │    │ 更新缓存   │              │
│                    └───────────┘    └───────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 实际应用中的缓存策略

```javascript
/**
 * 实际项目中的缓存策略
 */

// 1. 静态资源（JS/CSS/图片）
const staticAssets = {
  recommendation: `
    Cache-Control: public, max-age=31536000, immutable

    或

    Cache-Control: public, max-age=31536000
    ETag: "xxx"
  `,

  strategy: `
    1. 长期缓存（1 年）
    2. 资源变更时改变 URL（哈希）
       - app.js → app.a1b2c3.js
       - style.css → style.d4e5f6.css
    3. 优点：
       - 用户首次访问后，第二次访问直接使用缓存
       - 几乎没有请求
  `,

  // webpack 打包时的哈希
  webpackExample: `
    // webpack.config.js
    output: {
      filename: '[name].[contenthash].js',
    }

    打包结果：
    main.a1b2c3d4.js
    vendor.e5f6g7h8.js
  `,
};

// 2. HTML 页面
const htmlPages = {
  recommendation: `
    Cache-Control: no-cache, must-revalidate
    或
    Cache-Control: no-cache
    ETag: "xxx"
  `,

  strategy: `
    1. 不长期缓存
    2. 每次访问都验证资源是否更新
    3. 如果未更新，返回 304
    4. 如果有更新，返回新内容

    优点：用户总能看到最新内容
  `,
};

// 3. API 响应
const apiResponses = {
  recommendation: `
    读操作：Cache-Control: no-cache
    写操作：Cache-Control: no-store
  `,

  reason: `
    API 数据经常变化：
    - 用户信息可能随时更新
    - 商品库存随时变化
    - 需要确保获取最新数据
  `,

  // 特殊情况
  specialCases: `
    1. 用户头像：不经常变化
       Cache-Control: public, max-age=86400

    2. 列表数据：可能变化较快
       Cache-Control: no-cache

    3. 个别资源详情：不经常变化
       Cache-Control: max-age=3600
  `,
};

// 4. CDN 缓存
const cdnCaching = {
  recommendation: `
    Cache-Control: public, max-age=3600
    或
    Cache-Control: public, s-maxage=86400
  `,

  // s-maxage 与 max-age 的区别
  difference: `
    max-age: 客户端和 CDN 都生效
    s-maxage: 只对 CDN 生效，客户端用 max-age

    场景：
    Cache-Control: public, max-age=60, s-maxage=86400

    - 浏览器：60 秒后需验证
    - CDN：86400 秒后需验证
  `,

  // 实际配置示例（Nginx）
  nginxConfig: `
    location ~* \\.(jpg|png|gif|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
  `,
};

// 5. Service Worker 缓存策略
const serviceWorkerCache = {
  // 缓存优先
  cacheFirst: `
    // 静态资源使用缓存优先
    self.addEventListener('fetch', (event) => {
      if (event.request.destination === 'image') {
        event.respondWith(
          caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
              caches.open('image-cache').then(cache => {
                cache.put(event.request, response);
              });
              return response;
            });
          })
        );
      }
    });
  `,

  // 网络优先
  networkFirst: `
    // API 使用网络优先
    self.addEventListener('fetch', (event) => {
      if (event.request.url.includes('/api/')) {
        event.respondWith(
          fetch(event.request).catch(() => {
            return caches.match(event.request);
          })
        );
      }
    });
  `,
};
```

## 三、HTTP/2 深度解析

### 3.1 HTTP/1.1 的问题

```javascript
/**
 * HTTP/1.1 的三大痛点
 */

// 问题1：队头阻塞
const headOfLineBlocking = {
  problem: `
    在一个 TCP 连接上，同一时刻只能有一个请求

    请求1: ──────────────────────▶
    请求2:           ──────────────────────▶
    请求3:                       ──────────────────────▶

    如果请求1 很大/很慢，后面的请求都得等着
  `,

  analogy: `
    就像在奶茶店点单：
    - 你点了杯超复杂的奶茶（需要 5 分钟）
    - 后面的人只是想买瓶水
    - 但必须等你的做完
  `,
};

// 问题2：重复发送头部
const redundantHeaders = {
  problem: `
    每个请求都要携带完整的头部
    很多头部在所有请求中都是相同的

    例如：
    GET /api/users HTTP/1.1
    Host: api.example.com                    ← 重复
    User-Agent: Mozilla/5.0...               ← 重复
    Accept: application/json                 ← 重复
    Authorization: Bearer xxx                 ← 重复

    这些重复的头部浪费了大量带宽
  `,

  stat: `
    典型请求头大小：
    - Host: 15 字节
    - User-Agent: 100+ 字节
    - Cookie: 200+ 字节
    - Total: 400-800 字节重复

    如果一个页面 100 个请求，浪费 40-80KB
  `,
};

// 问题3：明文传输
const plaintextProblem = {
  problem: `
    HTTP/1.1 是明文传输
    - 请求内容可以被中间人查看
    - Cookie 容易被盗
    - 请求内容可能被篡改
  `,

  solution: `
    HTTPS = HTTP + TLS
    HTTP/2 可以在 TLS 上运行
  `,
};
```

### 3.2 HTTP/2 核心特性

```javascript
/**
 * HTTP/2 的四大改进
 */

// 改进1：多路复用
const multiplexing = {
  description: `
    在一个 TCP 连接上，可以同时发送多个请求和响应
    不再有队头阻塞问题
  `,

  diagram: `
    HTTP/1.1:
    连接1: GET /html ─────────────────────▶
    连接2: GET /css ─────────▶
    连接3: GET /js ───▶

    HTTP/2:
    连接1: GET /html ─────────────────────▶
           GET /css ─────────▶
           GET /js ───▶
           ◀────────────────────────────
           (同一连接，并行传输)
  `,

  mechanism: `
    1. 每个请求/响应称为一个 Stream（流）
    2. 每个 Stream 有唯一 ID
    3. 请求被分成多个 Frame（帧）
    4. 不同 Stream 的帧可以交错传输
    5. 接收方通过 Stream ID 重组

    Stream 1: [HEADERS] ─ [DATA] ─ [DATA]
    Stream 2:     [HEADERS] ─ [DATA]
    Stream 3:         [HEADERS] ─ [DATA] ─ [DATA]

    实际传输（交织）:
    [Stream1-HEADERS][Stream2-HEADERS][Stream1-DATA][Stream3-HEADERS]...
  `,
};

// 改进2：头部压缩
const headerCompression = {
  description: `
    使用 HPACK 算法压缩头部
    减少重复头部传输
  `,

  mechanism: `
    HPACK 包含两部分：
    1. 静态表：常见头部名称和值的列表
    2. 动态表：维护之前出现的头部值

    压缩示例：
    第一次请求：
    :method: GET
    :path: /api/users
    :scheme: https
    → 完整发送（使用静态表编码）

    第二次请求：
    :method: GET
    :path: /api/posts
    :scheme: https
    → 只发送变化的部分
    → 静态表索引 + 新路径
  `,

  statistic: `
    Google 统计：
    - 压缩后头部大小减少 80-90%
    - 请求头从 ~800 字节 → ~50 字节
  `,
};

// 改进3：服务器推送
const serverPush = {
  description: `
    服务器可以主动向客户端推送资源
    不需要客户端先请求
  `,

  scenario: `
    传统模式：
    1. 客户端请求 HTML
    2. 服务器返回 HTML
    3. 客户端解析 HTML，发现需要 CSS
    4. 客户端请求 CSS
    5. 服务器返回 CSS

    HTTP/2 推送模式：
    1. 客户端请求 HTML
    2. 服务器返回 HTML + 推送 CSS（一起）
    3. 客户端直接使用 CSS
  `,

  // 服务器推送实现
  implementation: `
    // 服务器配置（Nginx）
    location / {
        http2_push /style.css;
        http2_push /app.js;
    }

    // 或者通过响应头
    // Link: </style.css>; rel=preload; as=style
  `,
};

// 改进4：流控制
const streamControl = {
  description: `
    类似于 TCP 的滑动窗口
    但作用在 HTTP/2 的 Stream 级别
  `,

  feature: `
    - 接收方可以控制发送方的发送速率
    - 可以设置每个 Stream 的窗口大小
    - 可以暂停/恢复数据接收
  `,

  useCase: `
    场景：浏览器可以告诉服务器：
    "我现在窗口满了，请暂停发送"

    这样可以防止服务器发送太多数据
    导致客户端内存溢出
  `,
};
```

### 3.3 HTTP/2 帧结构

```javascript
/**
 * HTTP/2 帧格式
 */

const http2Frame = {
  format: `
     0                   1                   2                   3
     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    |  长度（前3字节）   |  类型   | 标志 |        Stream ID       |
    +---------------+-------------------+---+---------------------+
    |                        帧内容                                |
    +---------------------------------------------------------------+
  `,

  // 帧类型
  frameTypes: `
    0x0: DATA          - 传输数据
    0x1: HEADERS        - 发送头部
    0x2: PRIORITY       - 指定优先级
    0x3: RST_STREAM     - 取消流
    0x4: SETTINGS       - 连接配置
    0x5: PUSH_PROMISE   - 服务器推送
    0x6: PING           - 心跳检测
    0x7: GOAWAY         - 关闭连接
    0x8: WINDOW_UPDATE  - 窗口更新
    0x9: CONTINUATION   - 继续头部
  `,

  // DATA 帧结构
  dataFrame: `
    +---------------+
    |  Length (24)  |  数据长度（最大 16MB）
    +---------------+-------------------+
    |  Type (0x0)   |  Flags            |
    +---------------+-------------------+
    |        Stream ID (31 bits)       |
    +-------------------------------+---+
    |           Data                |
    +-------------------------------+

    Flags:
    - END_STREAM (0x1): 这是该流的最后一帧
    - PADDED (0x8): 包含填充数据
  `,

  // HEADERS 帧结构
  headersFrame: `
    +---------------+
    |  Length (24)  |
    +---------------+-------------------+
    |  Type (0x1)   |  Flags            |
    +---------------+-------------------+
    |        Stream ID (31 bits)       |
    +-------------------------------+---+
    |        HPACK Encoded Headers    |
    +-------------------------------+

    Flags:
    - END_HEADERS (0x4): 头部完整，不再有 CONTINUATION
    - END_STREAM (0x1): 请求/响应结束
    - PADDED (0x8): 包含填充
    - PRIORITY (0x20): 包含优先级信息
  `,
};

// 实际抓包示例
const packetExample = {
  // Wireshark 显示的 HTTP/2 帧
  wiresharkView: `
    // 帧 1: HEADERS (Stream 1) - GET 请求
    Stream ID: 1
    GET /api/users
    :method: GET
    :path: /api/users
    :scheme: https

    // 帧 2: HEADERS (Stream 3) - 服务器推送
    Stream ID: 3
    :status: 200
    content-type: application/json

    // 帧 3: DATA (Stream 3)
    Stream ID: 3
    [{"id": 1, "name": "张三"}]

    // 帧 4: DATA (Stream 1)
    Stream ID: 1
    [{"id": 2, "name": "李四"}]

    // 可以看到不同 Stream 的帧交错传输
  `,
};
```

## 四、HTTP/3 与 QUIC 协议

### 4.1 HTTP/2 的问题

```javascript
/**
 * HTTP/2 虽然解决了应用层的队头阻塞
 * 但 TCP 本身仍有队头阻塞问题
 */

// TCP 的队头阻塞
const tcpBlocking = {
  problem: `
    TCP 保证数据按序到达

    Stream 1: ────[A]──────────────[E]───▶  (A到了，E在等B)
    Stream 2:         ──[B][C][D]───▶      (B被丢弃，全部重传)

    如果 Stream 2 的数据包 B 丢了
    虽然 Stream 1 的 A、E 已经到达
    但 TCP 必须等 B 重传后，才能把 A、E 交给应用层

    这就是 TCP 层面的队头阻塞！
  `,

  reason: `
    原因：TCP 不区分 Stream，只是一条字节流
    所有 Stream 的数据混在一起，一个丢包影响全部
  `,
};

// HTTP/2 的另一个问题
const http2OtherProblems = {
  connectionEstablishment: `
    HTTP/2 通常需要 TLS 1.3

    TLS 握手需要 1-2 RTT
    TCP 握手需要 1 RTT
    总共需要 2-3 RTT 才能开始传输数据
  `,

  migration: `
    TCP 连接基于四元组（源IP, 源端口, 目标IP, 目标端口）
    如果 IP 变了（比如手机切换网络），连接必须重建
  `,
};
```

### 4.2 QUIC 协议详解

QUIC（Quick UDP Internet Connections）是 Google 发明的协议，后来成为 HTTP/3 的基础。

```javascript
/**
 * QUIC 核心特性
 */

// 特性1：基于 UDP
const quicUdp = {
  reason: `
    选择 UDP 而不是 TCP 的原因：
    1. UDP 没有连接建立过程，可以直接开始传输
    2. UDP 不保证按序到达，不会有 TCP 的队头阻塞
    3. QUIC 在用户空间实现，不需要内核修改
    4. 可以快速迭代和改进
  `,

  reliability: `
    QUIC 在 UDP 基础上实现了：
    - 数据包编号（独立于 UDP）
    - 丢包检测
    - 重传机制
    - 按序交付

    但与 TCP 不同的是：
    - 丢包只影响该数据包所在的 Stream
    - 其他 Stream 不受影响
  `,
};

// 特性2：连接建立快
const fastConnection = {
  tcpTls: `
    TCP + TLS 1.3 握手：

    TCP 握手: SYN → SYN+ACK → ACK         (1 RTT)
    TLS 握手: ClientHello → ServerHello    (1 RTT)
    ───────────────────────────────────────
    总共: 2 RTT 才能开始传输数据
  `,

  quic: `
    QUIC 0-RTT 或 1-RTT：

    首次连接（1-RTT）:
    ClientHello + 加密数据 → ServerHello + 加密响应
    ───────────────────────────────────────
    总共: 1 RTT

    再次连接（0-RTT）:
    使用之前缓存的密钥，直接发送加密数据
    ───────────────────────────────────────
    总共: 0 RTT
  `,

  improvement: `
    从 2-3 RTT → 0-1 RTT
    对于已经访问过的网站，速度提升明显
  `,
};

// 特性3：Stream 级别的流控制
const streamControl = {
  difference: `
    TCP（HTTP/1.1, HTTP/2）:
    丢包影响所有 Stream

    QUIC (HTTP/3):
    每个 Stream 独立控制流量
    丢包只影响当前 Stream
    其他 Stream 不受影响
  `,

  diagram: `
    QUIC Stream 1: ────[A]────────────────[E]───▶  (A, E 正常交付)
    QUIC Stream 2:         ──[B]───▶          (B 丢包，只重传 B)

    A 和 E 可以立即交给应用层
    不需要等 B 重传完成
  `,
};

// 特性4：连接迁移
const connectionMigration = {
  problem: `
    场景：手机从 WiFi 切换到 4G

    TCP: IP 变了，连接必须断开重连
    所有数据都要重新传输
  `,

  solution: `
    QUIC: 使用 Connection ID 而不是 IP

    1. 连接建立时，服务器给客户端一个 Connection ID
    2. 切换网络时，IP 变了，但 Connection ID 不变
    3. 客户端继续使用这个 Connection ID 发送数据
    4. QUIC 层自动处理路径变化

    体感：视频通话不中断，下载不中断
  `,
};
```

### 4.3 HTTP/3 详解

```javascript
/**
 * HTTP/3 与 QUIC 的关系
 */

// 协议栈对比
const protocolStack = {
  http11: `
    HTTP/1.1
    ─────
    TCP
    ─────
    IP
  `,

  http2: `
    HTTP/2
    ─────
    TLS 1.2+
    ─────
    TCP
    ─────
    IP
  `,

  http3: `
    HTTP/3
    ─────
    QUIC (内置 TLS 1.3)
    ─────
    UDP
    ─────
    IP
  `,
};

// HTTP/3 的改进
const http3Improvements = {
  multiplexing: `
    真正的多路复用
    丢包只影响单个 Stream
    不再有队头阻塞
  `,

  speed: `
    1. 0-RTT 快速恢复（再次访问）
    2. 1-RTT 首次连接（比 TLS+TCP 快）
  `,

  congestion: `
    QUIC 内置了更精细的拥塞控制
    - 每个 Stream 独立拥塞控制
    - 丢包检测更准确
    - 更快地利用可用带宽
  `,
};

// HTTP/3 头部
const http3Headers = {
  format: `
    HTTP/3 使用跟 HTTP/2 类似的头部结构
    但使用 QPACK 而不是 HPACK 进行压缩

    主要变化：
    1. :method、:path、:scheme 等伪头部保留
    2. HPACK → QPACK（更好的压缩率）
    3. 动态表更大了
  `,

  // HTTP/3 请求示例
  request: `
    HEADERS (Stream ID: 0)
    :method: GET
    :scheme: https
    :path: /api/users
    :authority: api.example.com

    0\r\n
    (QPACK 编码后)
  `,
};
```

### 4.4 HTTP 版本对比

```javascript
/**
 * HTTP/1.1 vs HTTP/2 vs HTTP/3 对比
 */

const httpComparison = {
  // 队头阻塞问题
  headOfLineBlocking: {
    http11: 'HTTP 层队头阻塞，同一连接只能有一个请求',
    http2: '解决了 HTTP 层队头阻塞，但 TCP 仍有队头阻塞',
    http3: '彻底解决队头阻塞，Stream 级别独立传输',
  },

  // 连接复用
  connectionReuse: {
    http11: 'Keep-Alive，但同一时刻只有一个请求',
    http2: '多路复用，多个请求并行',
    http3: '多路复用 + 无 TCP 队头阻塞',
  },

  // 头部压缩
  headerCompression: {
    http11: '无压缩，重复发送所有头部',
    http2: 'HPACK 压缩，减少 80-90%',
    http3: 'QPACK 压缩，更好的压缩率',
  },

  // 握手延迟
  handshakeLatency: {
    http11: 'TCP 1 RTT（无 TLS）',
    http12: 'TCP + TLS 1.2 = 2-3 RTT',
    http3: 'QUIC 1-RTT 或 0-RTT',
  },

  // 服务器推送
  serverPush: {
    http11: '不支持',
    http2: '支持',
    http3: '支持（但不是主要优化点）',
  },

  // 传输协议
  transport: {
    http11: 'TCP',
    http2: 'TCP + TLS',
    http3: 'QUIC (UDP)',
  },

  // 浏览器支持
  browserSupport: {
    http11: '100% 支持',
    http2: '96%+ 支持',
    http3: '80%+ 支持（2024年）',
  },
};

// 实际项目中的选择
const versionSelection = {
  recommendation: `
    当前阶段推荐策略：

    1. 静态资源 CDN：HTTP/2 或 HTTP/3
       - 多路复用提升并行加载
       - 头部压缩节省带宽

    2. API 调用：HTTP/2 over TLS
       - 不是特别在意那几十毫秒
       - HTTP/3 在高延迟网络优势更明显

    3. 高延迟场景：HTTP/3
       - 移动网络、国际访问
       - QUIC 在丢包场景表现更好

    4. 兼容优先：HTTP/1.1
       - 老旧浏览器
       - 简单场景
  `,

  // Nginx 配置示例
  nginxConfig: `
    # 启用 HTTP/2
    server {
        listen 443 ssl http2;
        ssl_certificate cert.pem;
        ssl_certificate_key cert.key;
    }

    # 启用 HTTP/3（需要 nginx-quic）
    server {
        listen 443 quic;
        ssl_certificate cert.pem;
        ssl_certificate_key cert.key;

        # HTTP/3 相关配置
        add_header Alt-Svc 'h3=":443"; ma=86400';
    }
  `,
};
```

## 五、CORS 跨域详解

### 5.1 为什么需要 CORS？

```javascript
/**
 * 同源策略与跨域限制
 */

// 同源的定义
const sameOrigin = {
  definition: `
    同源 = 协议 + 域名 + 端口 完全相同

    示例：
    https://example.com:443
    ├─ 协议: https
    ├─ 域名: example.com
    └─ 端口: 443 (默认)
  `,

  // 不同源示例
  differentOrigin: `
    https://example.com          ← 源
    http://example.com           ← 不同源（协议不同）
    https://api.example.com      ← 不同源（域名不同）
    https://example.com:8080     ← 不同源（端口不同）
  `,

  // 为什么要限制？
  reason: `
    假设没有同源策略：
    1. 用户登录了银行网站 bank.com
    2. 用户打开了恶意网站 evil.com
    3. evil.com 的 JS 可以向 bank.com 发送请求
    4. 因为用户已登录，请求会携带 Cookie
    5. evil.com 可以获取用户的银行信息！

    同源策略就是用来防止这种攻击的
  `,
};

// 跨域的场景
const crossDomainScenario = {
  need: `
    现代 Web 开发经常需要跨域请求：

    1. 前端和后端在不同域名
       - 前端: https://front.example.com
       - 后端: https://api.example.com

    2. 调用第三方 API
       - 调用地图 API
       - 调用支付 API

    3. 微服务架构
       - user.example.com
       - order.example.com
       - 页面 example.com 需要调用两者
  `,
};
```

### 5.2 CORS 详解

```javascript
/**
 * CORS（Cross-Origin Resource Sharing）
 * 跨域资源共享
 */

// 简单请求
const simpleRequest = {
  definition: `
    简单请求 = 以下条件全部满足：
    1. HTTP 方法是 GET、POST、HEAD 之一
    2. Content-Type 是以下之一：
       - application/x-www-form-urlencoded
       - multipart/form-data
       - text/plain
    3. 没有自定义头部
  `,

  flow: `
    浏览器自动发送 Origin 头：

    GET /api/users HTTP/1.1
    Origin: https://front.example.com
    Host: api.example.com

    服务器检查 Origin：

    如果允许：
    HTTP/1.1 200 OK
    Access-Control-Allow-Origin: https://front.example.com

    如果不允许：
    HTTP/1.1 403 Forbidden
    （没有 Access-Control-Allow-Origin）

    浏览器发现响应头没有对应的 Access-Control-Allow-Origin
    拒绝 JS 获取响应内容
  `,
};

// 预检请求（Preflight）
const preflightRequest = {
  definition: `
    非简单请求会触发预检：

    1. PUT、DELETE 方法
    2. Content-Type 不是简单类型
    3. 添加了自定义头部（如 Authorization）
  `,

  flow: `
    预检请求是 OPTIONS 方法：

    OPTIONS /api/users HTTP/1.1
    Origin: https://front.example.com
    Access-Control-Request-Method: PUT
    Access-Control-Request-Headers: Content-Type, Authorization

    服务器响应：

    HTTP/1.1 204 No Content
    Access-Control-Allow-Origin: https://front.example.com
    Access-Control-Allow-Methods: GET, POST, PUT, DELETE
    Access-Control-Allow-Headers: Content-Type, Authorization
    Access-Control-Max-Age: 86400

    预检结果会被缓存（86400 秒内不再预检）

    之后的实际请求：

    PUT /api/users HTTP/1.1
    Origin: https://front.example.com
    Authorization: Bearer xxx
    Content-Type: application/json
  `,

  // 实际例子
  example: `
    // 简单请求
    fetch('/api/users')           // 可以跨域
    fetch('/api/users', {
      method: 'POST',
      body: 'name=test'           // application/x-www-form-urlencoded
    })

    // 非简单请求（会预检）
    fetch('/api/users', {
      method: 'PUT',
      body: JSON.stringify({name: 'test'}),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  `,
};

// 携带凭证
const withCredentials = {
  definition: `
    Cookie、Authorization 头等凭证

    默认情况下：
    跨域请求不会携带 Cookie
  `,

  frontend: `
    // 前端必须设置 withCredentials
    fetch('/api/users', {
      credentials: 'include'
    })

    // 或者 axios
    axios.get('/api/users', {
      withCredentials: true
    })
  `,

  backend: {
    requirement: `
      服务器必须设置：
      Access-Control-Allow-Credentials: true
      Access-Control-Allow-Origin: 不能是 *
    `,

    example: `
      // 错误配置
      Access-Control-Allow-Origin: *
      Access-Control-Allow-Credentials: true

      // 正确配置
      Access-Control-Allow-Origin: https://front.example.com
      Access-Control-Allow-Credentials: true
    `,
  },
};
```

### 5.3 CORS 响应头详解

```javascript
/**
 * CORS 相关的 HTTP 响应头
 */

const corsHeaders = {
  // 必须的响应头
  required: {
    'Access-Control-Allow-Origin': `
      允许的源地址
      - 具体地址: https://example.com
      - 全部地址: *（不能与 credentials 同时使用）
    `,

    'Access-Control-Allow-Methods': `
      允许的 HTTP 方法
      Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
    `,

    'Access-Control-Allow-Headers': `
      允许的请求头
      Access-Control-Allow-Headers: Content-Type, Authorization
    `,
  },

  // 可选的响应头
  optional: {
    'Access-Control-Allow-Credentials': `
      是否允许携带凭证
      Access-Control-Allow-Credentials: true
    `,

    'Access-Control-Max-Age': `
      预检结果缓存时间（秒）
      Access-Control-Max-Age: 86400  # 24小时
    `,

    'Access-Control-Expose-Headers': `
      允许 JS 访问的响应头
      默认只有简单响应头可以被 JS 访问
      Access-Control-Expose-Headers: X-Total-Count
    `,
  },
};

// 实际配置
const corsConfig = {
  // Express.js CORS 中间件
  express: `
    const cors = require('cors');

    // 简单配置
    app.use(cors());

    // 指定源
    app.use(cors({
      origin: 'https://example.com',
      credentials: true
    }));

    // 动态源
    app.use(cors({
      origin: (req, callback) => {
        const allowed = ['https://a.com', 'https://b.com'];
        const origin = req.header('Origin');
        if (allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed'));
        }
      }
    }));
  `,

  // NestJS CORS
  nestjs: `
    // main.ts
    app.enableCors({
      origin: ['https://example.com'],
      credentials: true
    });

    // 或者在控制器上
    @Controller()
    @Header('Access-Control-Allow-Origin', '*')
    export class UsersController {}
  `,

  // Nginx 配置
  nginx: `
    location /api/ {
        # 添加 CORS 头
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
        add_header Access-Control-Allow-Credentials 'true';

        # 处理预检请求
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
  `,
};
```

## 六、实战应用场景

### 6.1 RESTful API 设计

```javascript
/**
 * RESTful API 设计最佳实践
 */

// HTTP 方法与资源的对应关系
const restMapping = {
  endpoints: `
    资源：users（用户）

    GET    /users        - 获取所有用户
    GET    /users/:id    - 获取单个用户
    POST   /users        - 创建用户
    PUT    /users/:id    - 更新用户（完整）
    PATCH  /users/:id    - 更新用户（部分）
    DELETE /users/:id    - 删除用户
  `,

  // 嵌套资源
  nestedResources: `
    资源：用户的订单

    GET    /users/:userId/orders         - 获取用户的所有订单
    GET    /users/:userId/orders/:id      - 获取用户的单个订单
    POST   /users/:userId/orders          - 为用户创建订单
    PUT    /users/:userId/orders/:id     - 更新订单
    DELETE /users/:userId/orders/:id      - 删除订单
  `,

  // 实际代码示例
  example: `
    // Express.js 实现
    const express = require('express');
    const router = express.Router();

    // 获取所有用户
    router.get('/users', (req, res) => {
      const users = await User.findAll();
      res.json(users);
    });

    // 获取单个用户
    router.get('/users/:id', async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(user);
    });

    // 创建用户
    router.post('/users', async (req, res) => {
      const { name, email } = req.body;
      const user = await User.create({ name, email });
      res.status(201).json(user);
    });

    // 更新用户
    router.patch('/users/:id', async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      await user.update(req.body);
      res.json(user);
    });

    // 删除用户
    router.delete('/users/:id', async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      await user.destroy();
      res.status(204).send();
    });
  `,
};

// 状态码选择
const statusCodeSelection = {
  // 成功响应
  success: `
    200 OK           - 成功获取/更新资源
    201 Created      - 成功创建资源
    204 No Content   - 成功删除，无返回内容
  `,

  // 错误响应
  error: `
    400 Bad Request  - 请求参数错误
    401 Unauthorized  - 未登录
    403 Forbidden     - 无权限
    404 Not Found     - 资源不存在
    409 Conflict      - 资源冲突
    422 Unprocessable - 验证失败
    500 Server Error  - 服务器内部错误
  `,
};

// 响应格式
const responseFormat = {
  // 成功格式
  success: `
    {
      "data": {
        "id": 1,
        "name": "张三",
        "email": "zhangsan@example.com"
      },
      "meta": {
        "timestamp": "2025-01-01T00:00:00Z"
      }
    }
  `,

  // 列表格式
  list: `
    {
      "data": [
        {"id": 1, "name": "张三"},
        {"id": 2, "name": "李四"}
      ],
      "meta": {
        "total": 100,
        "page": 1,
        "pageSize": 10
      }
    }
  `,

  // 错误格式
  error: `
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "邮箱格式不正确",
        "details": [
          {"field": "email", "message": "邮箱格式不正确"}
        ]
      }
    }
  `,
};
```

### 6.2 HTTP 请求库封装

```javascript
/**
 * 实际项目中的 HTTP 请求封装
 */

// 基于 fetch 的封装
const httpClient = `
  class HttpClient {
    constructor(baseURL) {
      this.baseURL = baseURL;
      this.defaults = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    /**
     * 发送请求
     */
    async request(method, path, options = {}) {
      const url = this.baseURL + path;
      const config = {
        method,
        ...this.defaults,
        ...options,
      };

      // 添加认证头
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = \`Bearer \${token}\`;
      }

      try {
        const response = await fetch(url, config);

        // 处理 401
        if (response.status === 401) {
          // 跳转登录
          window.location.href = '/login';
          throw new Error('未登录');
        }

        // 处理 204
        if (response.status === 204) {
          return null;
        }

        // 解析 JSON
        const data = await response.json();

        // 处理业务错误
        if (!response.ok) {
          throw new Error(data.error?.message || '请求失败');
        }

        return data;
      } catch (error) {
        console.error('请求错误:', error);
        throw error;
      }
    }

    // 快捷方法
    get(path, options) {
      return this.request('GET', path, options);
    }

    post(path, data, options) {
      return this.request('POST', path, {
        body: JSON.stringify(data),
        ...options,
      });
    }

    put(path, data, options) {
      return this.request('PUT', path, {
        body: JSON.stringify(data),
        ...options,
      });
    }

    patch(path, data, options) {
      return this.request('PATCH', path, {
        body: JSON.stringify(data),
        ...options,
      });
    }

    delete(path, options) {
      return this.request('DELETE', path, options);
    }
  }

  // 使用示例
  const api = new HttpClient('https://api.example.com');

  // 获取用户列表
  const users = await api.get('/users');

  // 创建用户
  const newUser = await api.post('/users', {
    name: '张三',
    email: 'zhangsan@example.com',
  });

  // 更新用户
  const updatedUser = await api.patch('/users/1', {
    name: '张三（已更新）',
  });

  // 删除用户
  await api.delete('/users/1');
`;

// 基于 Axios 的封装
const axiosWrapper = `
  import axios from 'axios';

  // 创建 axios 实例
  const http = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL,
    timeout: 10000,
  });

  // 请求拦截器
  http.interceptors.request.use(
    (config) => {
      // 添加 token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = \`Bearer \${token}\`;
      }

      // 添加时间戳防止缓存
      config.params = {
        ...config.params,
        _t: Date.now(),
      };

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  http.interceptors.response.use(
    (response) => {
      // 业务错误处理
      const { data } = response;
      if (data.code !== 0) {
        // 错误提示
        Message.error(data.message);
        return Promise.reject(new Error(data.message));
      }
      return data;
    },
    (error) => {
      // HTTP 错误处理
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // 跳转登录
            router.push('/login');
            break;
          case 403:
            Message.error('没有权限');
            break;
          case 404:
            Message.error('资源不存在');
            break;
          case 500:
            Message.error('服务器错误');
            break;
        }
      }
      return Promise.reject(error);
    }
  );

  export default http;
`;
```

### 6.3 Web 性能优化

```javascript
/**
 * 基于 HTTP 特性的性能优化
 */

// 1. 减少请求数量
const reduceRequests = {
  strategy: `
    1. 资源合并
       - 多个 JS 文件合并为一个
       - 多个 CSS 文件合并为一个
       - 图片雪碧图

    2. 内联资源
       - 小图片转 base64
       - 关键 CSS 内联到 HTML
  `,

  example: `
    <!-- 不推荐：多个小请求 -->
    <link rel="stylesheet" href="a.css">
    <link rel="stylesheet" href="b.css">
    <link rel="stylesheet" href="c.css">

    <!-- 推荐：合并为一个 -->
    <link rel="stylesheet" href="all.css">

    <!-- 小图片内联 -->
    <img src="data:image/png;base64,iVBORw0KGgo...">
  `,
};

// 2. 利用缓存
const useCaching = {
  strategy: `
    1. 长期缓存静态资源
       - JS/CSS/图片 设置 max-age=31536000
       - 使用内容哈希命名

    2. 不缓存 HTML
       - 确保用户能看到最新内容

    3. CDN 缓存
       - 静态资源放 CDN
  `,

  webpackConfig: `
    // webpack 输出文件名带哈希
    output: {
      filename: '[name].[contenthash].js',
    }

    // 结果
    main.a1b2c3d4.js  // 1年后过期也没问题，内容变就换哈希
  `,
};

// 3. 压缩传输
const compressTransfer = {
  strategy: `
    1. 开启 GZIP/Brotli 压缩
    2. 压缩 HTML/CSS/JS
    3. 不压缩图片（已有压缩）
  `,

  nginxConfig: `
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    gzip_comp_level 6;
  `,

  effect: `
    GZIP 压缩效果：
    - HTML/CSS/JS: 减少 60-70%
    - JSON: 减少 60-80%
    - 图片/PDF: 效果有限
  `,
};

// 4. 预连接和预加载
const preloadHints = {
  preconnect: `
    <!-- 预连接，减少 DNS/TLS 时间 -->
    <link rel="preconnect" href="https://api.example.com">
    <link rel="dns-prefetch" href="https://api.example.com">
  `,

  preload: `
    <!-- 预加载关键资源 -->
    <link rel="preload" href="/font.woff2" as="font" crossorigin>
    <link rel="preload" href="/main.js" as="script">
  `,

  prefetch: `
    <!-- 预取下一个页面需要的资源 -->
    <link rel="prefetch" href="/next-page.js">
  `,
};

// 5. 域名分片（HTTP/1.1 优化）
const domainSharding = {
  problem: `
    HTTP/1.1 浏览器对每个域名只能并发 6-8 个连接
  `,

  solution: `
    将资源分布到多个子域名：
    - static1.example.com (JS)
    - static2.example.com (CSS)
    - static3.example.com (图片)

    但 HTTP/2 之后不再需要，因为多路复用
  `,

  modernApproach: `
    HTTP/2 环境下：
    - 不需要域名分片
    - 多个域名反而增加 DNS 查询和连接建立时间
    - 建议：使用单一域名 + HTTP/2
  `,
};
```

## 七、常见问题与调试

### 7.1 Chrome DevTools 网络分析

```javascript
/**
 * Chrome DevTools Network 面板详解
 */

// 面板功能
const networkPanel = {
  // 概览
  overview: `
    1. 请求列表
       - Name: 文件名/URL
       - Status: 状态码
       - Type: 类型（document, script, stylesheet, img...）
       - Initiator: 谁发起的（Parser, JS, redirect）
       - Size: 响应大小
       - Time: 耗时

    2. 瀑布图（Waterfall）
       - 显示请求的时间线
       - Queued: 等待时间
       - Started: 开始时间
       - Content Download: 下载时间
  `,

  // 时间分析
  timingBreakdown: `
    某个请求的详细时间：

    - Queueing: 等待时间
      · 浏览器并发限制
      · 等待可用的 TCP 连接

    - Stalled: 请求开始前的等待
      · DNS 查询
      · 建立连接
      · TLS 握手

    - DNS Lookup: DNS 解析
    - Initial connection: TCP 连接建立
    - SSL: TLS 握手

    - Request sent: 请求发送
    - Waiting (TTFB): 首字节时间
      · 服务器处理时间
      · 网络传输时间

    - Content Download: 内容下载
  `,

  // 查看请求详情
  requestDetails: `
    Headers:
    - General: 请求行
    - Response Headers: 响应头
    - Request Headers: 请求头
    - Query String: URL 参数

    Payload:
    - Form Data: POST 数据
    - JSON: 请求体

    Preview:
    - 响应的预览（通常 JSON 或 HTML）

    Response:
    - 原始响应内容

    Cookies:
    - 请求/响应的 Cookie

    Timing:
    - 详细的时间分解
  `,
};

// 常见问题识别
const issueIdentification = {
  // 1. 请求阻塞
  queuedRequests: {
    symptom: '多个请求排队等待',
    cause: 'HTTP/1.1 并发限制',
    solution: '升级 HTTP/2 或增加域名',
  },

  // 2. DNS 查询慢
  slowDns: {
    symptom: 'DNS Lookup 时间很长',
    cause: 'DNS 服务器慢',
    solution: '使用 dns-prefetch 预解析',
  },

  // 3. TTFB 高
  highTTFB: {
    symptom: 'Waiting (TTFB) 时间很长',
    cause: '服务器处理慢或网络延迟',
    solution: '优化服务器，CDN 加速',
  },

  // 4. 下载慢
  slowDownload: {
    symptom: 'Content Download 时间很长',
    cause: '带宽不足或文件太大',
    solution: '开启压缩，减小文件大小',
  },
};
```

### 7.2 常用抓包工具

```javascript
/**
 * 网络抓包工具对比
 */

const packetCaptureTools = {
  // 1. Chrome DevTools
  chrome: `
    优点：
    - 方便，不需要额外工具
    - 界面友好
    - 可以查看 WebSocket

    缺点：
    - 不能抓取 HTTPS 加密内容（除非解密）
    - 不能抓取 HTTP/2 多路复用的单个 Stream
  `,

  // 2. Wireshark
  wireshark: `
    优点：
    - 功能强大，可以抓取所有协议
    - 支持过滤器
    - 可以分析 TCP 重传等底层问题

    缺点：
    - 界面复杂
    - 需要解密才能看 HTTPS
  `,

  // 3. Charles
  charles: `
    优点：
    - HTTPS 解密
    - 请求重写
    - 弱网模拟
    - 移动端抓包

    缺点：
    - 收费
    - 需要配置证书
  `,

  // 4. mitmproxy
  mitmproxy: `
    优点：
    - 命令行工具
    - 脚本化能力强
    - 免费开源

    缺点：
    - 界面不友好
    - 需要一定技术门槛
  `,
};

// HTTPS 解密配置
const httpsDecryption = {
  // Chrome 配置（操作系统级代理）
  chromeProxy: `
    1. 启动 Chrome 时加参数：
    chrome --proxy-server=http://localhost:8888

    2. 在 Charles 中启用 HTTPS 解密：
    Proxy -> SSL Proxying Settings -> Enable SSL Proxying

    3. 添加需要解密的域名：
    *example.com
  `,

  // Wireshark 解密 HTTPS
  wiresharkHttps: `
    1. 设置 SSLKEYLOGFILE 环境变量：
    export SSLKEYLOGFILE=~/ssl_keys.log

    2. Wireshark 配置：
    Edit -> Preferences -> Protocols -> TLS
    (Pre)-Master-Secret log filename: ~/ssl_keys.log

    3. 现在可以看到 HTTPS 明文内容
  `,
};
```

## 八、总结

### 8.1 HTTP 各版本对比

```
┌─────────────────────────────────────────────────────────────────┐
│                   HTTP 版本特性对比                              │
├──────────────────┬────────────┬────────────┬────────────────────┤
│      特性        │  HTTP/1.1  │  HTTP/2    │      HTTP/3        │
├──────────────────┼────────────┼────────────┼────────────────────┤
│ 多路复用         │     ✗      │     ✓      │        ✓           │
│ 头部压缩         │     ✗      │   HPACK    │      QPACK         │
│ 服务器推送       │     ✗      │     ✓      │        ✓           │
│ 流控制           │     ✗      │     ✓      │      Stream级别    │
│ 队头阻塞         │    HTTP层  │   TCP层    │       无          │
│ 握手延迟         │   1 RTT    │   2-3 RTT  │      1 RTT        │
│ 传输层           │    TCP     │    TCP     │      QUIC/UDP      │
│     -           │     -      │     -      │        -           │
└──────────────────┴────────────┴────────────┴────────────────────┘
```

### 8.2 核心概念回顾

```
HTTP 请求包含：
┌─────────────────────────────────────────────────────┐
│  请求行：方法 + URL + 版本                            │
│  请求头：Host, User-Agent, Content-Type, Cookie...   │
│  空行                                               │
│  请求体：POST/PUT/PATCH 的数据                        │
└─────────────────────────────────────────────────────┘

HTTP 响应包含：
┌─────────────────────────────────────────────────────┐
│  状态行：版本 + 状态码 + 状态文本                      │
│  响应头：Content-Type, Cache-Control, ETag...        │
│  空行                                               │
│  响应体：HTML, JSON, 图片等数据                       │
└─────────────────────────────────────────────────────┘

缓存机制：
┌─────────────────────────────────────────────────────┐
│  Cache-Control: 缓存指令（max-age, no-cache...）     │
│  ETag: 资源指纹（精确验证）                            │
│  Last-Modified: 修改时间（粗略验证）                   │
│  Vary: 缓存变体（Accept-Encoding, Accept-Language）  │
└─────────────────────────────────────────────────────┘

CORS 跨域：
┌─────────────────────────────────────────────────────┐
│  简单请求：浏览器自动带 Origin                         │
│  非简单请求：先 OPTIONS 预检，再正式请求                │
│  关键头：Access-Control-Allow-Origin                 │
│  凭证：Access-Control-Allow-Credentials              │
└─────────────────────────────────────────────────────┘
```

### 8.3 学习建议

1. **理解协议演进**：每个版本都是为了解决前一个版本的问题

2. **动手实验**：
   - 用 Chrome DevTools 查看请求/响应头
   - 用 telnet 发送原始 HTTP 请求
   - 搭建本地服务器测试各种场景

3. **结合实际**：
   - 思考项目中的 HTTP 优化点
   - 分析网站加载慢的原因
   - 设计 RESTful API

4. **关注新标准**：
   - HTTP/3 已经发布，关注浏览器支持情况
   - QUIC 协议是未来方向

---

> 下篇预告：《TLS/SSL 加密握手原理》—— 深入理解对称加密、非对称加密、数字证书、CA 机构，以及 HTTPS 的完整加密握手过程。