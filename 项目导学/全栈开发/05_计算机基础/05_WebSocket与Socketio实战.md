# WebSocket 与 Socket.io 实战

> 前言：想象你正在用微信聊天。传统的 HTTP 就像是你每次想看新消息，都要跑去朋友家门口敲门问"有新消息吗？"——这叫轮询，累不累？但 WebSocket 就像是你和朋友之间建立了一个电话专线。一旦连接建立，你们可以随时互相说话（双向通信），不用每次都重新拨号。Socket.io 就是让这个"电话"更容易使用的一个工具包。

## 一、为什么需要 WebSocket？

### 1.1 HTTP 的局限性

```javascript
/**
 * HTTP 的请求-响应模型的局限性
 */

// 传统轮询
const pollingProblem = {
  // 短轮询：每次请求都建立新连接
  shortPolling: `
    客户端 ── 请求 ──► 服务器
    客户端 ◄─ 响应 ── 服务器（没有新消息）

    客户端 ── 请求 ──► 服务器
    客户端 ◄─ 响应 ── 服务器（没有新消息）

    ... 重复 N 次 ...

    直到某次：
    客户端 ── 请求 ──► 服务器
    客户端 ◄─ 响应 ── 服务器（收到新消息！）

    问题：
    - 大部分请求是无用的
    - 网络开销大
    - 延迟不可控
  `,

  // 长轮询：服务器hold住连接
  longPolling: `
    客户端 ── 请求 ──► 服务器（服务器等待...）
                              ...
    客户端           服务器（有新消息，响应）
    客户端 ◄─ 响应 ── 服务器

    客户端 ── 请求 ──► 服务器（立即建立下一个请求）
                              ...

    问题：
    - 仍然需要频繁建立连接
    - 服务器端需要特殊处理
    - 复杂度和资源消耗都较高
  `,

  // Server-Sent Events (SSE)
  sse: `
    服务器 ──► 客户端（流式响应）
    客户端           服务器（持续发送新数据）

    优点：
    - 单向推送，简化实现
    - 自动重连

    缺点：
    - 只能是服务器→客户端
    - 不能双向通信
  `,
};

// HTTP 通信模式的问题
const httpProblems = {
  // 实时性差
  latency: `
    场景：股票交易应用

    问题：
    - 股票价格变化很快
    - 用户需要实时看到价格
    - 轮询间隔短 → 服务器压力大
    - 轮询间隔长 → 延迟高

    理想：价格变化时，服务器主动推送
  `,

  // 资源浪费
  resourceWaste: `
    场景：聊天应用

    问题：
    - 用户 A 发消息给用户 B
    - 需要通过服务器中转
    - 每次消息都要建立 HTTP 请求
    - 大量头部信息重复传输

    理想：建立一个持久连接，直接传输数据
  `,

  // 单向通信
  oneWay: `
    HTTP 只能客户端主动请求
    服务器无法主动推送

    场景：监控系统

    问题：
    - 监控数据从服务器→客户端
    - 客户端只能轮询
    - 无法实现真正的实时监控

    理想：服务器有数据就主动推送
  `,
};
```

### 1.2 WebSocket 的优势

```javascript
/**
 * WebSocket 的核心优势
 */

// 持久连接
const persistentConnection = `
  HTTP vs WebSocket 对比：

  HTTP：
  连接 ── 请求 ── 响应 ── 关闭连接
  连接 ── 请求 ── 响应 ── 关闭连接
  连接 ── 请求 ── 响应 ── 关闭连接

  WebSocket：
  连接 ── 双向传输 ── 保持连接 ── 双向传输 ── ...
          ←──────────────────────────→
            建立一次，持久通信
`;

// 双向通信
const bidirectionalComm: `
  WebSocket 是全双工通信：

  客户端 ◄═══════════════════════════► 服务器
       ◄────── 推送数据 ────────────
       ──────── 推送数据 ──────────►

  双方都可以随时发送数据
  不需要重新建立连接
`;

// 协议开销
const protocolOverhead: `
  HTTP 请求头部：
  GET /api/messages HTTP/1.1
  Host: api.example.com
  User-Agent: Mozilla/5.0...
  Accept: application/json
  Cookie: session=xxx...

  总计：~500-1000 字节

  WebSocket 帧：
  - 只有 2-14 字节的头部
  - 数据部分直接是应用数据

  优势：大大减少网络开销
`;

// 延迟对比
const latencyComparison: `
  场景：实时聊天

  HTTP 轮询（1秒间隔）：
  - 用户发送消息
  - 对方收到消息的延迟：0-1秒
  - 加上网络延迟

  WebSocket：
  - 用户发送消息
  - 对方收到消息的延迟：~10-50ms
  - 几乎是实时的
`;
```

## 二、WebSocket 协议详解

### 2.1 WebSocket 握手过程

```javascript
/**
 * WebSocket 握手过程
 *
 * WebSocket 握手利用了 HTTP 的 Upgrade 机制
 * 成功升级后就切换到 WebSocket 协议
 */

const handshake = {
  // 完整握手流程
  fullHandshake: `
    ┌─────────────────────────────────────────────────────────────────┐
    │                     WebSocket 握手过程                           │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                  │
    │  客户端                                              服务器        │
    │    │                                                      │       │
    │    │  1. HTTP 请求（携带 Upgrade 头）                        │       │
    │    │────────────────────────────────────────────────────────▶│       │
    │    │                                                      │       │
    │    │  2. HTTP 响应（101 Switching Protocols）                │       │
    │    │◀────────────────────────────────────────────────────────│       │
    │    │                                                      │       │
    │    │  3. 协议切换完成，开始 WebSocket 通信                    │       │
    │    │◄═════════════ 双向传输 ══════════════════════════════▶│       │
    │    │                                                      │       │
    └─────────────────────────────────────────────────────────────────┘
  `,

  // 客户端握手请求
  clientRequest: `
    GET /ws HTTP/1.1
    Host: server.example.com
    Upgrade: websocket                    ← 关键：要求升级协议
    Connection: Upgrade                    ← 关键：保持连接
    Sec-WebSocket-Version: 13              ← WebSocket 版本（必须是 13）
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==   ← 随机密钥
    Origin: http://client.example.com      ← 起源（用于安全检查）

    可选头部：
    Sec-WebSocket-Protocol: chat, superchat  ← 子协议协商
    Sec-WebSocket-Extensions: permessage-deflate  ← 扩展协商
  `,

  // 服务器握手响应
  serverResponse: `
    HTTP/1.1 101 Switching Protocols       ← 101 状态码表示协议切换
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=   ← 验证密钥
    Sec-WebSocket-Protocol: chat           ← 选择的子协议

    可选：
    Sec-WebSocket-Extensions: permessage-deflate
  `,

  // Sec-WebSocket-Key 的验证过程
  keyVerification: `
    客户端生成：
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

    服务器响应：
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

    验证原理：
    1. 服务器将 key 拼接上固定的 GUID
    2. 计算 SHA-1 哈希
    3. Base64 编码

    代码：
    const key = 'dGhlIHNhbXBsZSBub25jZQ==';
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const accept = base64(sha1(key + GUID));

    结果：s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  `,
};

// 握手的代码实现
const handshakeCode = {
  // Node.js 原生握手（简化版）
  nodejsHandshake: `
    const http = require('http');
    const crypto = require('crypto');

    const server = http.createServer();

    server.on('upgrade', (request, socket, head) => {
      // 1. 解析握手请求
      const key = request.headers['sec-websocket-key'];
      const version = request.headers['sec-websocket-version'];

      // 2. 验证版本
      if (version !== '13') {
        socket.destroy();
        return;
      }

      // 3. 计算 Accept 密钥
      const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
      const acceptKey = crypto
        .createHash('sha1')
        .update(key + GUID)
        .digest('base64');

      // 4. 发送握手响应
      const response = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Accept: ' + acceptKey,
        '',
        '',
      ].join('\r\n');

      socket.write(response);

      // 5. 握手完成，可以开始 WebSocket 通信
      socket.on('data', (buffer) => {
        // 处理 WebSocket 数据帧
      });
    });

    server.listen(8080);
  `,

  // 浏览器端握手
  browserHandshake: `
    // 浏览器原生 WebSocket API

    // 创建 WebSocket 连接
    const ws = new WebSocket('wss://server.example.com/ws');

    // 握手自动完成，浏览器帮我们处理

    // 监听连接打开
    ws.onopen = () => {
      console.log('WebSocket 连接已建立');
    };

    // 监听消息
    ws.onmessage = (event) => {
      console.log('收到消息:', event.data);
    };

    // 监听错误
    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    // 监听关闭
    ws.onclose = (event) => {
      console.log('连接关闭:', event.code, event.reason);
    };
  `,
};
```

### 2.2 WebSocket 帧格式

```javascript
/**
 * WebSocket 帧格式详解
 */

const frameFormat = {
  // 帧结构
  structure: `
     0                   1                   2                   3
     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    +-+-+-+-+-------+-+-------------+-------------------------------+
    |F|R|R|R|  opcode |M|     payload len     |    extended payload   |
    |I|S|S|S|  (4)    |A|       (7)          |       length         |
    |N|V|V|V|         |S|                     |       (16/64)       |
    | |1|2|3|         |K|                     |                      |
    +-+---+-----------+---+-------------+-------------------------------+
    |                               masking key (if mask bit is set)    |
    +------------------------------------------------------------------+
    |                  payload data (if payload len is extended)...    |
    +---------------------------------------------------------------------------+
  `,

  // 字段说明
  fields: `
    第一个字节：
    - FIN (1 bit): 是否是最后一帧
    - RSV1-3 (1 bit each): 扩展用，通常为 0
    - opcode (4 bits): 操作码

    第二个字节：
    - MASK (1 bit): 是否掩码（客户端→服务器必须为 1）
    - payload length (7 bits): 数据长度

    后续：
    - Extended payload length (0/8 bytes): 长度扩展
    - Masking key (0/4 bytes): 掩码密钥
    - Payload data: 实际数据
  `,

  // 操作码 (opcode)
  opcodes: `
    0x0: 继续帧（continuation）- 消息分片的后续帧
    0x1: 文本帧（text）
    0x2: 二进制帧（binary）
    0x8: 关闭帧（close）
    0x9: Ping 帧
    0xA: Pong 帧
  `,

  // 帧示例
  examples: `
    文本帧示例：
    0x81 0x05 0x48 0x65 0x6c 0x6c 0x6f
    │    │    │    │    │    │    │
    │    │    └───────────────┤
    │    │    文本数据 "Hello"
    │    │    (5 字节)
    │    │
    │    └── 长度 5
    │
    └── FIN=1 (完整帧), opcode=1 (文本)

    Ping 帧示例：
    0x89 0x00
    │    │
    │    └── 长度 0
    │
    └── FIN=1, opcode=9 (Ping)

    Pong 帧示例：
    0x8A 0x00
    │    │
    │    └── 长度 0
    │
    └── FIN=1, opcode=10 (Pong)
  `,
};

// 数据帧的掩码处理
const masking = {
  // 客户端必须掩码
  clientMustMask: `
    WebSocket 协议规定：
    - 客户端发送到服务器的数据必须掩码
    - 服务器发送到客户端的数据不掩码

    原因：防止代理缓存攻击（proxy cache poisoning attacks）

    掩码算法：
    - 4 字节的掩码密钥
    - 与 payload 逐字节 XOR
  `,

  // 掩码实现
  maskingCode: `
    function mask(payload, maskingKey) {
      const result = Buffer.alloc(payload.length);

      for (let i = 0; i < payload.length; i++) {
        result[i] = payload[i] ^ maskingKey[i % 4];
      }

      return result;
    }

    // 解掩码
    function unmask(payload, maskingKey) {
      return mask(payload, maskingKey);  // XOR 两次等于原值
    }

    // 示例
    const payload = Buffer.from('Hello');
    const key = Buffer.from('abcd');

    const masked = mask(payload, key);
    const unmasked = mask(masked, key);  // 恢复原值
  `,
};

// 消息分片
const fragmentation = {
  // 分片原因
  whyFragmentation: `
    为什么需要分片？

    1. 消息可能很大
       - 超过缓冲区大小
       - 需要分批发送

    2. 不知道消息长度
       - 流式数据
       - 边生成边发送

    3. 混合多个消息
       - 控制消息和数据显示交织
  `,

  // 分片规则
  rules: `
    分片规则：

    1. 首帧的 opcode 非 0
    2. 后续帧的 opcode 为 0
    3. 最后帧的 FIN 为 1
    4. 接收方组装所有帧

    示例：发送 "Hello" 分两片

    帧1：FIN=0, opcode=1, payload="He"
    帧2：FIN=1, opcode=0, payload="llo"
  `,

  // 代码实现
  code: `
    // 发送大消息
    function sendLargeMessage(ws, data) {
      const chunkSize = 1024;
      const totalChunks = Math.ceil(data.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
        const isLast = i === totalChunks - 1;

        ws.send(chunk, {
          fin: isLast,
          opcode: i === 0 ? 1 : 0,  // 首帧用 opcode=1，后续用 0
        });
      }
    }
  `,
};
```

### 2.3 WebSocket 状态码

```javascript
/**
 * WebSocket 状态码
 */

// 连接状态
const readyState = {
  CONNECTING: 0,    // 连接中
  OPEN: 1,          // 已连接
  CLOSING: 2,        // 关闭中
  CLOSED: 3,        // 已关闭
};

// 关闭码 (Close Code)
const closeCodes = {
  // 正常关闭
  1000: `
    正常关闭：
    - 双方协商同意关闭
    - 使命完成，正常退出
  `,

  // 协议相关
  1001: `
    服务器关闭：
    - 服务器即将关闭
    - 比如：服务器维护
  `,

  1002: `
    协议错误：
    - 收到格式错误的数据
    - 协议使用错误
  `,

  1003: `
    不支持的 Data：
    - 收到无法处理的数据类型
    - 比如：服务器只支持文本，但收到二进制
  `,

  1005: `
    无状态码：
    - 关闭时没有携带状态码
    - 用于内部判断
  `,

  1006: `
    异常关闭：
    - 连接意外断开
    - 没有发送 Close 帧
    - 用于异常情况处理
  `,

  1007: `
    消息格式错误：
    - 数据格式不正确
    - 比如：UTF-8 编码错误
  `,

  1008: `
    违反策略：
    - 消息内容违反策略
    - 安全策略限制
  `,

  1009: `
    消息太大：
    - 消息太大无法处理
    - 超过缓冲区大小
  `,

  1010: `
    必要扩展缺失：
    - 客户端要求的扩展服务器不支持
    - 可以重新协商
  `,

  1011: `
    服务器异常：
    - 服务器遇到无法处理的情况
    - 不是客户端的问题
  `,

  1015: `
    TLS 错误：
    - TLS 握手失败
    - 证书问题等
  `,
};

// 使用示例
const closeCodeExample = `
  // 正常关闭连接
  ws.close(1000, '任务完成');

  // 服务器拒绝（协议错误）
  ws.close(1002, 'Invalid message format');

  // 异常关闭（断网等）
  // 状态码为 1006

  // 服务器处理
  ws.on('close', (code, reason) => {
    switch (code) {
      case 1000:
        console.log('正常关闭');
        break;
      case 1006:
        console.log('异常断开，可能需要重连');
        break;
      default:
        console.log('其他错误:', code, reason);
    }
  });
`;
```

## 三、心跳机制详解

### 3.1 为什么要心跳？

```javascript
/**
 * 心跳机制（Heartbeat/Ping-Pong）
 *
 * 为什么需要心跳？
 */

const whyHeartbeat = {
  // 问题1：连接可能"死"了
  deadConnection: `
    连接可能已经失效，但双方不知道：

    1. 网络设备故障
       - 路由器/交换机重启
       - 网络中断

    2. NAT 超时
       - 路由器/防火墙的 NAT 表过期
       - 外面进不来，里面出不去

    3. 服务器进程"僵死"
       - 服务器还在运行
       - 但 WebSocket 处理逻辑卡住

    结果：双方以为连接还活着，但实际上已经断了
  `,

  // 问题2：及时发现问题
  timelyDetection: `
    心跳的作用：

    1. 检测连接是否存活
       - 定期发送 Ping
       - 期望收到 Pong

    2. 保持 NAT 映射活跃
       - 防止 NAT 超时断开

    3. 及时重连
       - 发现断开后立即重连
       - 减少服务中断时间
  `,

  // 心跳 vs Keep-Alive
  vsKeepAlive: `
    TCP Keep-Alive：
    - 内置于 TCP 协议
    - 操作系统默认 2 小时检测
    - 太慢了，不适合应用层

    WebSocket 心跳：
    - 应用层自己实现
    - 可以自定义间隔
    - 更灵活
  `,
};
```

### 3.2 心跳实现方案

```javascript
/**
 * 心跳机制的实现
 */

// 方案1：使用 WebSocket 内置的 Ping/Pong
const wsPingPong = `
  // 浏览器端
  // 浏览器不直接支持发送 Ping，但 WebSocket 服务器可以发送 Ping

  // 服务器发送 Ping
  function sendPing(ws) {
    ws.ping();  // WebSocket API
  }

  // 浏览器自动响应 Pong，并触发 pong 事件
  ws.on('pong', () => {
    console.log('收到 Pong');
    lastPongTime = Date.now();
  });

  // 问题：不是所有浏览器都支持 pong 事件
`;

// 方案2：自定义心跳消息
const customHeartbeat = `
  // 使用文本帧模拟心跳

  // 心跳消息格式
  const HEARTBEAT_MSG = JSON.stringify({ type: 'heartbeat' });

  // 客户端发送心跳
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(HEARTBEAT_MSG);
      lastSendTime = Date.now();
    }
  }, 30000);  // 每 30 秒

  // 服务器响应心跳
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'heartbeat') {
      ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
    }
  });

  // 客户端收到响应
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'heartbeat_ack') {
      lastPongTime = Date.now();
    }
  });
`;

// 方案3：综合方案（推荐）
const comprehensiveHeartbeat = {
  // 完整的心跳实现
  implementation: `
    class HeartbeatManager {
      constructor(ws, options = {}) {
        this.ws = ws;
        this.interval = options.interval || 30000;  // 发送间隔
        this.timeout = options.timeout || 10000;     // 超时时间
        this.timer = null;
        this.lastPongTime = Date.now();
      }

      // 启动心跳
      start() {
        this.timer = setInterval(() => {
          this.sendPing();
        }, this.interval);
      }

      // 停止心跳
      stop() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }

      // 发送 Ping
      sendPing() {
        if (this.ws.readyState !== WebSocket.OPEN) {
          return;
        }

        try {
          // 使用 WebSocket ping()
          this.ws.ping();

          // 设置超时检测
          setTimeout(() => {
            if (Date.now() - this.lastPongTime > this.timeout) {
              console.log('心跳超时，连接可能已断开');
              this.ws.close();
            }
          }, this.timeout);
        } catch (error) {
          console.error('发送心跳失败:', error);
        }
      }

      // 收到 Pong
      onPong() {
        this.lastPongTime = Date.now();
      }
    }
  `,

  // 集成到 WebSocket 客户端
  clientIntegration: `
    class WebSocketClient {
      constructor(url, options = {}) {
        this.url = url;
        this.heartbeatManager = null;
        this.connect();
      }

      connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('连接建立');
          // 启动心跳
          this.heartbeatManager = new HeartbeatManager(this.ws);
          this.heartbeatManager.start();
        };

        this.ws.onpong = () => {
          // 收到 Pong
          this.heartbeatManager.onPong();
        };

        this.ws.onclose = () => {
          // 停止心跳
          if (this.heartbeatManager) {
            this.heartbeatManager.stop();
          }
        };
      }
    }
  `,

  // 服务端心跳处理
  serverImplementation: `
    // Node.js WebSocket 服务器心跳处理

    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ port: 8080 });

    // 心跳间隔（毫秒）
    const HEARTBEAT_INTERVAL = 30000;
    // 心跳超时（毫秒）
    const HEARTBEAT_TIMEOUT = 10000;

    // 为每个连接设置心跳
    wss.on('connection', (ws) => {
      ws.isAlive = true;

      // 收到 Pong 标记为存活
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // 处理消息
      ws.on('message', (message) => {
        // 处理业务消息
      });
    });

    // 定期检查连接
    const heartbeatTimer = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          // 连接已断开
          console.log('心跳超时，断开连接');
          return ws.terminate();
        }

        // 标记为不存活，等待 Pong
        ws.isAlive = false;
        // 发送 Ping
        ws.ping();
      });
    }, HEARTBEAT_INTERVAL);

    // 清理
    wss.on('close', () => {
      clearInterval(heartbeatTimer);
    });
  `,
};
```

## 四、断线重连详解

### 4.1 断线原因分析

```javascript
/**
 * 常见的断线原因
 */

const disconnectReasons = {
  // 网络问题
  networkIssues: `
    1. 网络波动
       - WiFi 信号不稳定
       - 移动网络切换（4G → 隧道/电梯）

    2. 网络设备故障
       - 路由器重启
       - NAT 表过期

    3. 防火墙/代理
       - 企业网络限制
       - 中间代理断开
  `,

  // 服务器问题
  serverIssues: `
    1. 服务器重启
       - 部署更新
       - 服务器崩溃

    2. 服务器负载
       - 连接数过多
       - 服务器过载，主动断开

    3. 网络攻击
       - DDoS 攻击
       - 被安全策略断开
  `,

  // 客户端问题
  clientIssues: `
    1. 浏览器休眠
       - 电脑休眠/锁屏
       - 移动端切后台

    2. 页面刷新/关闭
       - 用户操作导致页面卸载
       - 无感知断开

    3. 客户端异常
       - JavaScript 错误
       - 内存泄漏导致崩溃
  `,
};

// 断线检测
const disconnectDetection = {
  // 方式1：监听事件
  eventListeners: `
    ws.onclose = (event) => {
      // code: 关闭码
      // reason: 关闭原因
      // wasClean: 是否是正常关闭

      if (!event.wasClean) {
        console.log('非正常断开');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  `,

  // 方式2：心跳检测
  heartbeatDetection: `
    // 如果心跳超时，说明连接已断开
    // 参见心跳机制部分
  `,

  // 方式3：定期 ping
  periodicPing: `
    // 定期发送 ping 并等待响应
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // 发送 ping
        ws.send(JSON.stringify({ type: 'ping' }));

        // 设置超时
        setTimeout(() => {
          if (!pingReceived) {
            console.log('未收到响应，断开连接');
            ws.close();
          }
        }, 5000);
      }
    }, 30000);
  `,
};
```

### 4.2 断线重连策略

```javascript
/**
 * 断线重连实现
 */

// 简单的重连实现
const simpleReconnect = `
  // 最基本的重连
  let reconnectAttempts = 0;
  const maxAttempts = 10;
  const baseDelay = 1000;

  ws.onclose = () => {
    if (reconnectAttempts < maxAttempts) {
      const delay = baseDelay * Math.pow(2, reconnectAttempts);

      console.log(\`\${delay}ms 后重连...\`);

      setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, delay);
    }
  };

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      console.log('重连成功');
    };
  }
`;

// 完整的重连管理器
const reconnectManager = `
  class ReconnectManager {
    constructor(options = {}) {
      this.url = options.url;
      this.maxAttempts = options.maxAttempts || 10;
      this.baseDelay = options.baseDelay || 1000;
      this.maxDelay = options.maxDelay || 30000;
      this.jitter = options.jitter || 0.3;  // 随机抖动

      this.attempts = 0;
      this.timer = null;
      this.manualClose = false;
    }

    // 连接
    connect() {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.attempts = 0;
        console.log('连接成功');
        this.onConnected?.();
      };

      this.ws.onclose = (event) => {
        if (this.manualClose) return;

        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        this.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        this.onMessage?.(event);
      };
    }

    // 安排重连
    scheduleReconnect() {
      if (this.attempts >= this.maxAttempts) {
        console.log('达到最大重连次数');
        this.onMaxAttemptsReached?.();
        return;
      }

      // 计算延迟（指数退避 + 抖动）
      let delay = this.baseDelay * Math.pow(2, this.attempts);
      delay = Math.min(delay, this.maxDelay);

      // 添加随机抖动
      const jitterAmount = delay * this.jitter;
      delay += Math.random() * jitterAmount * 2 - jitterAmount;

      this.attempts++;

      console.log(\`\${Math.round(delay)}ms 后重连（第 \${this.attempts} 次）\`);

      this.timer = setTimeout(() => this.connect(), delay);
    }

    // 手动关闭（不再自动重连）
    close() {
      this.manualClose = true;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (this.ws) {
        this.ws.close();
      }
    }
  }

  // 使用
  const manager = new ReconnectManager({
    url: 'wss://server.example.com/ws',
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
  });

  manager.onConnected = () => {
    console.log('已连接');
  };

  manager.onMessage = (event) => {
    console.log('收到消息:', event.data);
  };

  manager.onMaxAttemptsReached = () => {
    console.log('无法重连，显示错误页面');
  };

  manager.connect();
`;

// 重连时的数据同步
const dataSync = {
  // 问题：重连期间可能丢失消息
  problem: `
    场景：
    1. 客户端订阅了某个频道
    2. 连接断开
    3. 服务器推送了新消息
    4. 客户端重连
    5. 客户端没有收到断开期间的消息
  `,

  // 解决方案
  solutions: `
    方案1：服务器存储离线消息
    - 客户端断开时，服务器缓存消息
    - 客户端重连后，主动拉取离线消息
    - 需要维护订阅状态

    方案2：消息队列
    - 使用专业消息队列（RabbitMQ, Kafka）
    - 消息持久化
    - 客户端重连后消费

    方案3：消息序列号
    - 每条消息带序列号
    - 客户端记录最后收到的序列号
    - 重连后请求缺失的消息

    方案4：使用 Socket.io 等框架
    - 内置消息队列和重连机制
    - 自动重连和消息同步
  `,
};
```

### 4.3 重连状态管理

```javascript
/**
 * 重连状态管理
 */

const reconnectState = {
  // 状态定义
  states: {
    DISCONNECTED: 'disconnected',      // 未连接
    CONNECTING: 'connecting',          // 连接中
    CONNECTED: 'connected',            // 已连接
    RECONNECTING: 'reconnecting',      // 重连中
    FAILED: 'failed',                   // 重连失败
  },

  // 状态转换
  transitions: `
    DISCONNECTED
        │
        │ connect()
        ▼
    CONNECTING ──成功──► CONNECTED
        │                     │
        │                     │ disconnect()
        │                     ▼
        │                DISCONNECTED
        │
        │ 失败
        ▼
    RECONNECTING
        │
        │ ──成功──► CONNECTED
        │
        │ ──失败（达到最大次数）──► FAILED
        │
        ▼
    FAILED
        │
        │ manualReconnect()
        ▼
    CONNECTING
  `,
};

// 状态管理实现
const stateManager = `
  class WebSocketStateManager {
    constructor(url) {
      this.url = url;
      this.state = 'disconnected';
      this.listeners = new Set();
    }

    // 状态变更
    setState(newState) {
      const oldState = this.state;
      this.state = newState;

      // 通知所有监听器
      this.listeners.forEach(listener => {
        listener(oldState, newState);
      });
    }

    // 订阅状态变更
    onStateChange(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    // 连接
    connect() {
      if (this.state === 'connected' || this.state === 'connecting') {
        return;
      }

      this.setState('connecting');

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setState('connected');
      };

      this.ws.onclose = () => {
        this.setState('reconnecting');
        this.scheduleReconnect();
      };
    }
  }

  // 使用
  const wsManager = new WebSocketStateManager('wss://server.example.com');

  wsManager.onStateChange((oldState, newState) => {
    console.log(\`状态变更: \${oldState} → \${newState}\`);

    switch (newState) {
      case 'connected':
        showConnectedUI();
        break;
      case 'reconnecting':
        showReconnectingUI();
        break;
      case 'failed':
        showFailedUI();
        break;
    }
  });
`;
```

## 五、Socket.io 实战

### 5.1 Socket.io 简介

```javascript
/**
 * Socket.io 核心特性
 */

const socketioFeatures = {
  // 与原生 WebSocket 对比
  vsNativeWebSocket: `
    ┌────────────────────────────────────────────────────────────────┐
    │                   Socket.io vs 原生 WebSocket                   │
    ├─────────────────────┬──────────────────────────────────────────┤
    │     Socket.io       │           原生 WebSocket                  │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 自动降级            │ 不支持降级                                │
    │ (WebSocket → Long   │                                          │
    │  Polling → Flash)   │                                          │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 心跳机制内置        │ 需要自己实现                              │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 断线重连内置        │ 需要自己实现                              │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 房间/命名空间支持   │ 不支持                                    │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 自动消息队列        │ 不支持                                    │
    ├─────────────────────┼──────────────────────────────────────────┤
    │ 跨浏览器兼容        │ 依赖浏览器支持                            │
    └─────────────────────┴──────────────────────────────────────────┘
  `,

  // 传输方式
  transports: `
    Socket.io 支持多种传输方式，按优先级排序：

    1. WebSocket（首选）
       - 最高效
       - 双向通信

    2. HTTP Long Polling（备选）
       - 传统轮询
       - 作为降级方案

    自动降级：
    如果 WebSocket 连接失败或被阻断
    自动切换到 Long Polling
  `,

  // 消息确认
  acknowledgements: `
    Socket.io 支持消息确认（ACK）：

    // 发送方
    socket.emit('message', 'Hello', (ack) => {
      console.log('收到确认:', ack);
    });

    // 接收方
    socket.on('message', (msg, ack) => {
      console.log('收到消息:', msg);
      ack('已收到');  // 发送确认
    });
  `,

  // 广播和房间
  broadcastRooms: `
    Socket.io 的房间（Room）功能：

    // 加入房间
    socket.join('room1');

    // 离开房间
    socket.leave('room1');

    // 向房间广播
    io.to('room1').emit('message', 'Hello room1');

    // 向多个房间广播
    io.to(['room1', 'room2']).emit('message', 'Hello');

    // 排除发送者
    socket.to('room1').emit('message', 'Hello except sender');
  `,
};
```

### 5.2 Socket.io 服务端实现

```javascript
/**
 * Socket.io 服务端配置
 */

// 基础服务器设置
const basicServer = `
  const { Server } = require('socket.io');
  const http = require('http');

  // 创建 HTTP 服务器
  const httpServer = http.createServer();

  // 创建 Socket.io 服务器
  const io = new Server(httpServer, {
    // CORS 配置
    cors: {
      origin: ['https://client.example.com'],
      methods: ['GET', 'POST'],
      credentials: true,
    },

    // 传输方式
    transports: ['websocket', 'polling'],

    //  ping 超时
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 监听连接
  io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);

    // 监听消息
    socket.on('message', (data) => {
      console.log('收到消息:', data);
    });

    // 监听断开
    socket.on('disconnect', (reason) => {
      console.log('客户端断开:', reason);
    });
  });

  httpServer.listen(3000);
`;

// 连接认证
const authentication = `
  // 方式1：握手时认证
  const io = new Server(httpServer, {
    verifyClient: (info, done) => {
      // info.req: HTTP 请求对象
      // done(true/false): 是否允许连接

      const token = info.req.headers['authorization'];

      if (validateToken(token)) {
        done(true);
      } else {
        done(false, 401, 'Unauthorized');
      }
    },
  });

  // 方式2：连接时认证
  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token;

    if (!validateToken(token)) {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect();
      return;
    }

    // 认证成功
    console.log('用户已认证:', socket.id);
  });

  // 客户端传递认证信息
  const socket = io('https://server.example.com', {
    auth: {
      token: 'user_token_here',
    },
  });
`;

// 房间管理
const roomManagement = `
  // 加入房间
  socket.on('join', (roomId) => {
    socket.join(\`room_\${roomId}\`);
    console.log(\`\${socket.id} 加入房间 \${roomId}\`);
  });

  // 离开房间
  socket.on('leave', (roomId) => {
    socket.leave(\`room_\${roomId}\`);
    console.log(\`\${socket.id} 离开房间 \${roomId}\`);
  });

  // 房间消息
  socket.on('roomMessage', (roomId, message) => {
    // 广播给房间内其他人
    socket.to(\`room_\${roomId}\`).emit('message', {
      from: socket.id,
      message: message,
    });
  });

  // 获取房间成员
  socket.on('getRoomMembers', (roomId, callback) => {
    const room = io.sockets.adapter.rooms.get(\`room_\${roomId}\`);
    const members = room ? Array.from(room) : [];
    callback(members);
  });

  // 私聊
  socket.on('privateMessage', (to, message) => {
    io.to(to).emit('message', {
      from: socket.id,
      type: 'private',
      message: message,
    });
  });
`;

// 事件处理
const eventHandling = `
  // 事件命名规范
  const EVENTS = {
    // 连接相关
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // 业务相关
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',
    CHAT_MESSAGE: 'chatMessage',
    USER_TYPING: 'userTyping',

    // 系统相关
    PING: 'ping',
    PONG: 'pong',
  };

  // 使用规范的事件名
  socket.on(EVENTS.JOIN_ROOM, (roomId) => {
    // 处理加入房间
  });

  socket.on(EVENTS.CHAT_MESSAGE, (data) => {
    // 处理聊天消息
  });

  // 发送事件
  io.emit(EVENTS.CHAT_MESSAGE, {
    id: Date.now(),
    content: 'Hello',
  });
`;

// 错误处理
const errorHandling = `
  // 监听错误
  socket.on('error', (error) => {
    console.error('Socket 错误:', error);
  });

  // 全局错误处理
  io.engine.on('connection_error', (err) => {
    console.log('连接错误:', err.code);
    console.log('错误信息:', err.message);
  });

  // 自定义错误事件
  socket.on('query', (data, callback) => {
    try {
      const result = processQuery(data);
      callback({ success: true, data: result });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
`;

// 完整聊天服务器示例
const chatServerExample = `
  const EVENTS = {
    JOIN: 'join',
    MESSAGE: 'message',
    TYPING: 'typing',
    STOP_TYPING: 'stopTyping',
    DISCONNECT: 'disconnect',
  };

  const rooms = new Map();  // roomId -> Set of socketIds

  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 加入房间
    socket.on(EVENTS.JOIN, ({ roomId, username }) => {
      socket.join(roomId);
      socket.data.username = username;
      socket.data.roomId = roomId;

      // 记录到房间
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);

      // 通知房间内其他人
      socket.to(roomId).emit(EVENTS.MESSAGE, {
        type: 'system',
        content: \`\${username} 加入了房间\`,
      });

      console.log(\`\${username} 加入房间 \${roomId}\`);
    });

    // 发送消息
    socket.on(EVENTS.MESSAGE, ({ content }) => {
      const { username, roomId } = socket.data;

      const message = {
        id: Date.now(),
        username,
        content,
        timestamp: new Date().toISOString(),
      };

      // 广播给房间内所有人
      io.to(roomId).emit(EVENTS.MESSAGE, message);
    });

    // 正在输入
    socket.on(EVENTS.TYPING, () => {
      socket.to(socket.data.roomId).emit(EVENTS.TYPING, {
        username: socket.data.username,
      });
    });

    // 停止输入
    socket.on(EVENTS.STOP_TYPING, () => {
      socket.to(socket.data.roomId).emit(EVENTS.STOP_TYPING, {
        username: socket.data.username,
      });
    });

    // 断开连接
    socket.on(EVENTS.DISCONNECT, () => {
      const { username, roomId } = socket.data;

      if (roomId) {
        // 离开房间
        socket.leave(roomId);
        rooms.get(roomId)?.delete(socket.id);

        // 通知房间内其他人
        socket.to(roomId).emit(EVENTS.MESSAGE, {
          type: 'system',
          content: \`\${username} 离开了房间\`,
        });
      }

      console.log('用户断开:', socket.id);
    });
  });
`;
```

### 5.3 Socket.io 客户端实现

```javascript
/**
 * Socket.io 客户端配置
 */

// 基础连接
const basicClient = `
  import { io } from 'socket.io-client';

  // 连接到服务器
  const socket = io('https://server.example.com', {
    // 传输方式
    transports: ['websocket', 'polling'],

    // 自动重连（Socket.io 默认开启）
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    // 认证信息
    auth: {
      token: 'user_token',
    },

    // 查询参数
    query: {
      userId: '12345',
    },
  });

  // 连接成功
  socket.on('connect', () => {
    console.log('已连接:', socket.id);
  });

  // 连接错误
  socket.on('connect_error', (error) => {
    console.error('连接错误:', error.message);
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log('断开连接:', reason);
  });
`;

// 事件监听
const eventListener = `
  // 方式1：监听事件
  socket.on('message', (data) => {
    console.log('收到消息:', data);
  });

  // 方式2：一次性监听
  socket.once('welcome', (data) => {
    console.log('只触发一次:', data);
  });

  // 方式3：监听所有事件
  socket.onAny((eventName, ...args) => {
    console.log(\`收到事件: \${eventName}\`, args);
  });

  // 移除监听
  const handler = (data) => {
    console.log('消息:', data);
  };

  socket.on('message', handler);
  socket.off('message', handler);

  // 移除所有监听
  socket.offAll();
`;

// 发送消息
const sendingMessages = `
  // 发送事件（不需要确认）
  socket.emit('message', { content: 'Hello' });

  // 发送事件（需要确认/回调）
  socket.emit('message', { content: 'Hello' }, (ack) => {
    console.log('收到服务器确认:', ack);
  });

  // 发送后等待确认（Promise 版本）
  const sendMessageWithAck = (data) => {
    return new Promise((resolve, reject) => {
      socket.emit('message', data, (ack) => {
        if (ack?.success) {
          resolve(ack);
        } else {
          reject(new Error(ack?.error || '发送失败'));
        }
      });
    });
  };

  // 使用
  try {
    const result = await sendMessageWithAck({ content: 'Hello' });
    console.log('发送成功:', result);
  } catch (error) {
    console.error('发送失败:', error);
  }
`;

// React 中使用 Socket.io
const reactUsage = `
  import { useEffect, useState, useCallback } from 'react';
  import { io } from 'socket.io-client';

  // 创建 socket 实例
  const socket = io('https://server.example.com', {
    transports: ['websocket'],
  });

  function ChatRoom({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
      // 加入房间
      socket.emit('join', { roomId });

      // 监听消息
      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // 清理
      return () => {
        socket.emit('leave', { roomId });
        socket.off('message');
      };
    }, [roomId]);

    const sendMessage = useCallback(() => {
      socket.emit('message', { content: input });
      setInput('');
    }, [input]);

    return (
      <div>
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id}>{msg.content}</div>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={sendMessage}
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    );
  }
`;

// Vue 中使用 Socket.io
const vueUsage = `
  import { io } from 'socket.io-client';

  // 创建插件
  export default {
    install(app, options) {
      const socket = io(options.url, {
        transports: ['websocket'],
      });

      app.config.globalProperties.$socket = socket;
    },
  };

  // 组件中使用
  export default {
    data() {
      return {
        messages: [],
      };
    },

    mounted() {
      this.$socket.on('message', (msg) => {
        this.messages.push(msg);
      });
    },

    beforeUnmount() {
      this.$socket.off('message');
    },

    methods: {
      sendMessage(content) {
        this.$socket.emit('message', { content });
      },
    },
  };
`;
```

### 5.4 房间管理实战

```javascript
/**
 * 房间管理详解
 */

// 房间类型
const roomTypes = {
  // 公开房间
  publicRoom: `
    公开房间特点：
    - 用户可以自由加入/离开
    - 可以查看房间列表
    - 适合群聊、公共讨论
  `,

  // 私有房间
  privateRoom: `
    私有房间特点：
    - 需要邀请或密码才能加入
    - 不在房间列表中显示
    - 适合私聊、小组讨论

    实现：
    socket.on('joinPrivate', ({ roomId, password }) => {
      if (verifyPassword(roomId, password)) {
        socket.join(roomId);
      }
    });
  `,

  // 持久房间
  persistentRoom: `
    持久房间特点：
    - 用户断开后保留状态
    - 用户重连后可以恢复
    - 适合游戏、实时协作

    实现：
    - 房间数据存储到数据库/Redis
    - 用户断开时标记为 inactive
    - 用户重连时恢复房间状态
  `,
};

// 房间管理服务
const roomService = `
  class RoomService {
    constructor(io) {
      this.io = io;
      this.rooms = new Map();  // roomId -> roomData
    }

    // 创建房间
    createRoom(roomId, options = {}) {
      const room = {
        id: roomId,
        name: options.name || roomId,
        isPrivate: options.isPrivate || false,
        password: options.password,
        maxMembers: options.maxMembers || 100,
        members: new Set(),
        createdAt: Date.now(),
        createdBy: options.createdBy,
      };

      this.rooms.set(roomId, room);
      return room;
    }

    // 加入房间
    joinRoom(socket, roomId, { password } = {}) {
      const room = this.rooms.get(roomId);

      if (!room) {
        return { success: false, error: '房间不存在' };
      }

      if (room.isPrivate && room.password !== password) {
        return { success: false, error: '密码错误' };
      }

      if (room.members.size >= room.maxMembers) {
        return { success: false, error: '房间已满' };
      }

      socket.join(roomId);
      room.members.add(socket.id);

      return { success: true, room };
    }

    // 离开房间
    leaveRoom(socket, roomId) {
      const room = this.rooms.get(roomId);

      if (room) {
        room.members.delete(socket.id);

        // 如果房间空了，可以选择删除或保留
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
        }
      }

      socket.leave(roomId);
    }

    // 广播到房间
    broadcastToRoom(roomId, event, data, exceptSocket = null) {
      if (exceptSocket) {
        socket.to(roomId).emit(event, data);
      } else {
        this.io.to(roomId).emit(event, data);
      }
    }

    // 获取房间信息
    getRoomInfo(roomId) {
      const room = this.rooms.get(roomId);

      if (!room) return null;

      return {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        memberCount: room.members.size,
        maxMembers: room.maxMembers,
      };
    }

    // 获取所有房间列表
    getRoomList() {
      return Array.from(this.rooms.values()).map((room) => ({
        id: room.id,
        name: room.name,
        memberCount: room.members.size,
      }));
    }
  }

  // 使用
  const roomService = new RoomService(io);

  io.on('connection', (socket) => {
    // 创建房间
    socket.on('createRoom', (options, callback) => {
      const room = roomService.createRoom(
        'room_' + Date.now(),
        { ...options, createdBy: socket.id }
      );
      callback({ success: true, room });
    });

    // 加入房间
    socket.on('joinRoom', ({ roomId, password }, callback) => {
      const result = roomService.joinRoom(socket, roomId, { password });
      callback(result);
    });

    // 离开房间
    socket.on('leaveRoom', ({ roomId }) => {
      roomService.leaveRoom(socket, roomId);
    });

    // 获取房间列表
    socket.on('getRoomList', (callback) => {
      callback(roomService.getRoomList());
    });
  });
`;

// 在线用户管理
const onlineUserManagement = `
  class UserService {
    constructor(io) {
      this.io = io;
      this.users = new Map();  // socketId -> userData
    }

    // 用户上线
    userOnline(socket, userData) {
      this.users.set(socket.id, {
        ...userData,
        socketId: socket.id,
        onlineAt: Date.now(),
      });

      // 广播用户在线状态
      this.io.emit('userOnline', {
        userId: userData.id,
        username: userData.username,
      });
    }

    // 用户离线
    userOffline(socket) {
      const user = this.users.get(socket.id);

      if (user) {
        this.io.emit('userOffline', {
          userId: user.id,
          username: user.username,
        });

        this.users.delete(socket.id);
      }
    }

    // 获取在线用户列表
    getOnlineUsers() {
      return Array.from(this.users.values()).map((u) => ({
        id: u.id,
        username: u.username,
      }));
    }

    // 踢出用户
    kickUser(socketId, reason) {
      const socket = this.io.sockets.sockets.get(socketId);

      if (socket) {
        socket.emit('kicked', { reason });
        socket.disconnect();
      }
    }
  }
`;
```

## 六、实际应用场景

### 6.1 实时聊天系统

```javascript
/**
 * 实时聊天系统实现
 */

// 消息类型
const messageTypes = {
  text: 'text',        // 文本消息
  image: 'image',      // 图片消息
  file: 'file',        // 文件消息
  system: 'system',    // 系统消息
  typing: 'typing',    // 正在输入
}

// 消息格式
const messageFormat = `
  {
    id: 'msg_123',
    type: 'text',
    content: 'Hello!',
    from: {
      id: 'user_1',
      username: '张三',
      avatar: 'https://...',
    },
    to: {
      type: 'room' | 'private',
      id: 'room_1' | 'user_2',
    },
    timestamp: '2025-01-01T12:00:00Z',
    status: 'sent' | 'delivered' | 'read',
  }
`;

// 聊天服务器
const chatServer = `
  const ChatServer = {
    // 处理私聊
    handlePrivateMessage: (io, socket, { to, content }) => {
      const message = {
        id: generateId(),
        type: 'text',
        content,
        from: socket.data.user,
        to: { type: 'private', id: to },
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      // 发送给接收者
      io.to(to).emit('message', message);

      // 发送确认给发送者
      socket.emit('messageSent', { id: message.id });
    },

    // 处理群聊
    handleGroupMessage: (io, socket, { roomId, content }) => {
      const message = {
        id: generateId(),
        type: 'text',
        content,
        from: socket.data.user,
        to: { type: 'room', id: roomId },
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      // 发送给房间内所有人（包括发送者）
      io.to(roomId).emit('message', message);
    },

    // 处理输入状态
    handleTyping: (io, socket, { to, isTyping }) => {
      const event = isTyping ? 'userTyping' : 'userStopTyping';

      if (to.type === 'private') {
        io.to(to.id).emit(event, {
          user: socket.data.user,
        });
      } else {
        socket.to(to.id).emit(event, {
          user: socket.data.user,
        });
      }
    },

    // 消息已读
    handleRead: (io, socket, { messageId, conversationId }) => {
      // 更新消息状态
      // ...

      // 通知对方消息已被阅读
      io.to(conversationId).emit('messageRead', {
        messageId,
        readBy: socket.data.user,
      });
    },
  };
`;

// 聊天客户端
const chatClient = `
  class ChatClient {
    constructor(url, options) {
      this.socket = io(url, options);

      this.socket.on('connect', () => {
        console.log('已连接');
      });

      this.socket.on('message', (message) => {
        this.onMessage?.(message);
      });

      this.socket.on('messageSent', ({ id }) => {
        this.updateMessageStatus?.(id, 'delivered');
      });

      this.socket.on('messageRead', ({ messageId }) => {
        this.updateMessageStatus?.(messageId, 'read');
      });
    }

    // 发送消息
    sendMessage(content, to) {
      const message = {
        id: generateId(),
        type: 'text',
        content,
        to,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      // 先显示在本地
      this.onMessage?.(message);

      // 发送到服务器
      if (to.type === 'private') {
        this.socket.emit('privateMessage', { to: to.id, content });
      } else {
        this.socket.emit('groupMessage', { roomId: to.id, content });
      }
    }

    // 发送输入状态
    sendTyping(to, isTyping) {
      this.socket.emit('typing', { to, isTyping });
    }
  }
`;
```

### 6.2 在线协作编辑

```javascript
/**
 * 在线协作编辑（基于 WebSocket）
 */

// 操作类型
const operationTypes = {
  INSERT: 'insert',
  DELETE: 'delete',
  REPLACE: 'replace',
};

// 操作格式
const operationFormat = `
  {
    type: 'insert',
    position: 5,
    content: 'Hello',
    userId: 'user_1',
    version: 10,
    timestamp: 1704067200000,
  }
`;

// OT 算法实现
const otAlgorithm = `
  class OTDocument {
    constructor() {
      this.content = '';
      this.version = 0;
      this.pendingOps = [];  // 待处理的远程操作
    }

    // 应用本地操作
    applyLocalOp(op) {
      this.content = this.transform(this.content, op);
      this.version++;
      return this.version;
    }

    // 应用远程操作
    applyRemoteOp(op) {
      // 如果有本地待发送的操作
      if (this.pendingOps.length > 0) {
        // 转换远程操作以适应本地状态
        op = this.transformAgainstPending(op, this.pendingOps);
      }

      this.content = this.transform(this.content, op);
      this.version = op.version;

      // 更新待处理操作版本
      this.pendingOps = this.pendingOps.map(p => ({
        ...p,
        version: p.version + 1,
      }));
    }

    // 转换操作
    transform(content, op) {
      switch (op.type) {
        case 'insert':
          return content.slice(0, op.position) + op.content + content.slice(op.position);

        case 'delete':
          return content.slice(0, op.position) + content.slice(op.position + op.length);

        default:
          return content;
      }
    }
  }
`;

// 协作编辑服务器
const collabServer = `
  class CollabServer {
    constructor() {
      this.docs = new Map();  // docId -> OTDocument
      this.docClients = new Map();  // docId -> Set of socketIds
    }

    // 创建或获取文档
    getOrCreateDoc(docId) {
      if (!this.docs.has(docId)) {
        this.docs.set(docId, {
          content: '',
          version: 0,
          clients: new Set(),
        });
      }
      return this.docs.get(docId);
    }

    // 客户端加入文档编辑
    joinDoc(socket, docId) {
      const doc = this.getOrCreateDoc(docId);
      doc.clients.add(socket.id);
      socket.join(\`doc_\${docId}\`);

      // 返回当前文档状态
      return {
        content: doc.content,
        version: doc.version,
      };
    }

    // 处理操作
    handleOp(socket, { docId, op }) {
      const doc = this.docs.get(docId);
      if (!doc) return;

      // 验证操作版本
      if (op.version !== doc.version) {
        // 版本不匹配，需要进行 OT 转换
        // 简化处理：让客户端重试
        socket.emit('opRejected', { version: doc.version });
        return;
      }

      // 应用操作
      doc.content = applyOp(doc.content, op);
      doc.version++;

      // 广播给其他客户端
      socket.to(\`doc_\${docId}\`).emit('remoteOp', {
        op: { ...op, version: doc.version },
        userId: socket.id,
      });
    }

    // 离开文档
    leaveDoc(socket, docId) {
      const doc = this.docs.get(docId);
      if (doc) {
        doc.clients.delete(socket.id);

        // 通知其他客户端
        socket.to(\`doc_\${docId}\`).emit('userLeft', {
          userId: socket.id,
        });
      }
    }
  }
`;
```

### 6.3 实时游戏

```javascript
/**
 * 实时游戏同步
 */

// 游戏状态同步
const gameSync = `
  class GameServer {
    constructor() {
      this.games = new Map();
    }

    // 房间管理
    createRoom(socket, { gameType, maxPlayers }) {
      const roomId = 'game_' + Date.now();
      const room = {
        id: roomId,
        gameType,
        maxPlayers,
        players: [],
        state: null,
        status: 'waiting',
      };

      this.games.set(roomId, room);
      socket.join(roomId);

      return room;
    }

    // 加入房间
    joinRoom(socket, { roomId }) {
      const room = this.games.get(roomId);
      if (!room) return { error: '房间不存在' };
      if (room.players.length >= room.maxPlayers) {
        return { error: '房间已满' };
      }

      const player = {
        id: socket.id,
        username: socket.data.username,
        position: { x: 0, y: 0 },
      };

      room.players.push(player);
      socket.join(roomId);

      // 通知其他玩家
      socket.to(roomId).emit('playerJoined', { player });

      // 返回当前房间状态
      return {
        roomId,
        players: room.players,
        state: room.state,
      };
    }

    // 游戏动作
    handleAction(socket, { roomId, action }) {
      const room = this.games.get(roomId);
      if (!room) return;

      // 处理动作
      const result = this.processAction(room, socket.id, action);

      // 广播结果给所有玩家
      io.to(roomId).emit('gameUpdate', {
        action: result,
        from: socket.id,
      });
    }

    // 房间列表
    getRoomList(gameType) {
      return Array.from(this.games.values())
        .filter(g => g.gameType === gameType && g.status === 'waiting')
        .map(g => ({
          id: g.id,
          players: g.players.length,
          maxPlayers: g.maxPlayers,
        }));
    }
  }
`;

// 帧同步 vs 状态同步
const syncStrategies = {
  // 帧同步（适用于 RTS、格斗游戏）
  frameSync: `
    帧同步原理：
    1. 所有玩家输入相同
    2. 每个玩家本地计算结果
    3. 结果应该一致

    服务器职责：
    - 收集所有玩家的输入
    - 每帧广播所有输入
    - 不负责计算

    客户端职责：
    - 收集本地输入
    - 发送给服务器
    - 等待服务器广播所有输入
    - 本地计算并渲染
  `,

  // 状态同步（适用于 RPG、MMO）
  stateSync: `
    状态同步原理：
    1. 服务器是权威
    2. 客户端发送操作
    3. 服务器计算并广播状态
    4. 客户端直接使用服务器状态

    服务器职责：
    - 维护权威游戏状态
    - 处理所有逻辑
    - 广播完整状态

    客户端职责：
    - 显示服务器传来的状态
    - 发送玩家操作
    - 本地预测以减少延迟
  `,
};
```

## 七、常见问题与总结

### 7.1 常见问题

```javascript
/**
 * WebSocket/Socket.io 常见问题
 */

// 问题1：连接不稳定
const unstableConnection = {
  problem: `
    在移动网络或弱网环境下，WebSocket 容易断开
  `,

  solution: `
    1. 使用 Socket.io 自动重连
    2. 心跳检测网络状态
    3. 本地重试机制
    4. 降级到 HTTP 轮询

    Socket.io 配置：
    const socket = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  `,
};

// 问题2：消息丢失
const messageLoss = {
  problem: `
    断线重连期间，可能丢失一些消息
  `,

  solution: `
    1. 消息确认机制（ACK）
    2. 消息持久化到数据库
    3. 重连后主动拉取离线消息
    4. 消息序列号 + 补发机制

    // 消息确认
    socket.emit('message', data, (ack) => {
      if (!ack) {
        // 重试发送
      }
    });
  `,
};

// 问题3：性能问题
const performanceIssue = {
  problem: `
    连接数太多，服务器压力大
  `,

  solution: `
    1. 使用集群部署
    2. 使用 Redis Adapter 进行跨节点通信
    3. 消息压缩
    4. 限制单个连接的订阅数量

    // Socket.io Redis Adapter
    const { createAdapter } = require('@socket.io/redis-adapter');

    const pubClient = createClient();
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
  `,
};

// 问题4：安全风险
const securityRisks = {
  risks: `
    1. WebSocket 劫持（Cross-Site WebSocket Hijacking）
    2. DoS 攻击
    3. 恶意消息注入
    4. 未授权访问
  `,

  solutions: `
    1. 验证 Origin 头
    2. 认证和授权
    3. 输入验证和清理
    4. 限流

    // 验证 Origin
    io.engine.on('connection', (socket) => {
      const origin = socket.request.headers.origin;

      if (!isAllowedOrigin(origin)) {
        socket.disconnect();
        return;
      }
    });
  `,
};
```

### 7.2 核心概念总结

```
┌─────────────────────────────────────────────────────────────────┐
│                   WebSocket/Socket.io 核心概念                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WebSocket：                                                     │
│  - 建立在 TCP 之上的全双工通信协议                                │
│  - 通过 HTTP Upgrade 机制建立                                    │
│  - 帧格式：FIN + opcode + Mask + payload                         │
│  - 状态码：1000(正常) / 1006(异常) / 1011(服务器错误)             │
│                                                                  │
│  心跳机制：                                                       │
│  - 定期发送 Ping/Pong 检测连接存活                               │
│  - 保持 NAT 映射活跃                                             │
│  - 建议间隔 30 秒，超时 10 秒                                    │
│                                                                  │
│  断线重连：                                                       │
│  - 指数退避算法                                                   │
│  - 随机抖动避免雪崩                                               │
│  - 消息持久化防丢失                                               │
│                                                                  │
│  Socket.io：                                                     │
│  - WebSocket + Long Polling 自动降级                             │
│  - 内置心跳、重连、房间管理                                       │
│  - 支持消息确认（ACK）                                           │
│  - 事件驱动的编程模型                                            │
│                                                                  │
│  房间管理：                                                       │
│  - socket.join(room) / socket.leave(room)                       │
│  - io.to(room).emit() 广播                                      │
│  - socket.to(room).emit() 排除发送者                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 最佳实践

```javascript
/**
 * WebSocket/Socket.io 最佳实践
 */

const bestPractices = {
  // 连接管理
  connection: [
    '使用 SSL/WSS（生产环境必须）',
    '正确处理连接错误',
    '实现心跳检测',
    '实现自动重连',
    '限制最大连接数',
  ],

  // 消息处理
  message: [
    '使用 JSON Schema 验证消息格式',
    '实现消息确认机制',
    '消息持久化防丢失',
    '使用序列号防止重复消息',
    '限制消息大小',
  ],

  // 性能优化
  performance: [
    '使用集群 + Redis Adapter',
    '消息压缩',
    '合并频繁发送的小消息',
    '合理使用房间和命名空间',
    '及时清理断开连接的资源',
  ],

  // 安全
  security: [
    '验证 Origin',
    '实现认证和授权',
    '输入验证和清理',
    '实现限流',
    '日志审计',
  ],

  // 生产环境配置
  production: `
    // Nginx WebSocket 代理配置
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
  `,
};
```

---

> 全系列完结！
>
> 我们完成了计算机网络全链路的 5 个专题：
> 1. TCP/IP 协议栈深度解析
> 2. HTTP 协议深度完全指南
> 3. TLS/SSL 加密握手原理
> 4. DNS/CDN/负载均衡全链路
> 5. WebSocket 与 Socket.io 实战
>
> 这些是现代 Web 开发中最重要的网络知识，掌握它们将帮助你构建更快、更安全、更可靠的分布式系统。