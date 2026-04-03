# 实时通信与WebSocket完全指南

## 目录

1. [什么是实时通信？](#1-什么是实时通信)
2. [为什么HTTP不行？](#2-为什么http不行)
3. [WebSocket是什么？](#3-websocket是什么)
4. [Socket.io框架详解](#4-socketio框架详解)
5. [即时聊天功能实现](#5-即时聊天功能实现)
6. [在线状态管理](#6-在线状态管理)
7. [消息推送系统](#7-消息推送系统)
8. [房间隔离机制](#8-房间隔离机制)
9. [心跳检测与断线重连](#9-心跳检测与断线重连)
10. [实战：在线客服聊天系统](#10-实战在线客服聊天系统)

---

## 1. 什么是实时通信？

### 1.1 通俗理解实时通信

**实时通信**就像是打电话——你说一句话，对方立刻就能听到，双方可以随时自由交流，不需要等待。

对比传统的**写信**模式（HTTP请求-响应），实时通信实现了**对话式交流**：

| 传统模式（写信） | 实时通信（打电话） |
|----------------|------------------|
| 你发一个请求，对方才能回复 | 双方随时可以发送消息 |
| 你问一句，对方答一句 | 双方同时可以说话 |
| 需要不断去邮箱检查有没有回信 | 有新消息自动通知你 |
| 延迟高，体验差 | 延迟低，即时响应 |

### 1.2 实时通信的典型应用场景

```
实时通信应用场景

├── 即时通讯（IM）
│   ├── 微信、QQ、钉钉
│   ├── 在线客服聊天
│   └── 社区论坛私信
│
├── 实时协作
│   ├── 在线文档协作（Google Docs）
│   ├── 代码协作平台
│   └── 白板协作
│
├── 实时数据展示
│   ├── 股票行情推送
│   ├── 体育比赛比分
│   └── 物联网传感器数据
│
├── 在线游戏
│   ├── 多人联网游戏
│   └── 实时对战平台
│
└── 视频会议/直播
    ├── 视频通话
    ├── 直播弹幕
    └── 在线课堂
```

### 1.3 实时通信技术对比

| 技术方案 | 通信方向 | 延迟 | 带宽消耗 | 实现复杂度 | 适用场景 |
|----------|----------|------|----------|------------|----------|
| **HTTP轮询** | 单向 | 高 | 高 | 低 | 简单通知更新 |
| **长轮询** | 单向 | 中 | 中 | 中 | 即时通讯 |
| **SSE** | 单向 | 低 | 低 | 中 | 服务器推送 |
| **WebSocket** | 双向 | 极低 | 低 | 中 | 即时通讯、游戏 |
| **Socket.io** | 双向 | 极低 | 低 | 中 | 综合应用 |
| **WebRTC** | P2P | 极低 | 低 | 高 | 音视频通话 |

---

## 2. 为什么HTTP不行？

### 2.1 HTTP的工作模式：请求-响应

HTTP协议的设计就像**餐厅服务员**：
- 你（客户端）向服务员（服务器）点餐（发送请求）
- 服务员去厨房准备，然后端菜回来（返回响应）
- 一次交易完成，服务员离开（HTTP连接关闭）

```
HTTP请求-响应流程

客户端                              服务器
  │                                   │
  │ ──────── TCP三次握手 ────────────>│ 建立连接
  │                                   │
  │ ──────── HTTP请求 ───────────────>│ "我要数据"
  │                                   │
  │ <──────── HTTP响应 ──────────────│ "给你数据"
  │                                   │
  │ ══════════ TCP四次挥手 ═══════════│ 关闭连接
  │                                   │


问题：连接每次都要重建！
```

### 2.2 HTTP的三大致命问题

#### 问题一：每次请求都要重新建立连接

每次发送HTTP请求，都需要：
1. TCP三次握手（建立连接）
2. 发送HTTP请求
3. 等待服务器处理
4. 接收HTTP响应
5. TCP四次挥手（关闭连接）

这就像**每次说话都要重新拨号打电话**，效率极低。

```javascript
// HTTP模式下获取最新消息 - 低效的实现方式
async function getMessages() {
  // 每次都需要重新建立连接
  const response = await fetch('/api/messages');
  const messages = await response.json();
  return messages;
}

// 轮询方式：每隔几秒问一次"有新消息吗？"
setInterval(async () => {
  const messages = await getMessages();  // 每次都是新建连接
  updateUI(messages);
}, 3000);  // 3秒轮询一次
```

#### 问题二：服务器不能主动推送消息

HTTP的核心特点是**客户端主动请求，服务器被动响应**。服务器想给客户端发消息？对不起，做不到！

```
HTTP无法实现服务器主动推送

场景：客服回复了用户的消息

HTTP模式下：
用户 ────── "请问问题" ──────────────────> 客服
         （等待...等待...等待...）
用户 <────────────────── "好的，我来帮你"  客服
         （用户不知道客服回复了，除非再问一次）

用户心里想：我要一直刷新页面吗？？
```

#### 问题三：header开销巨大

每次HTTP请求都要携带完整的请求头，通常有几百字节到几KB。如果是小数据量的频繁通信，绝大部分带宽都浪费在header上了。

```
HTTP请求头示例（实际可能更大）

GET /api/messages HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0...
Accept: application/json
Accept-Language: zh-CN,zh;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session_id=xxx; user_id=xxx...
Authorization: Bearer eyJhbGc...

// 请求体可能只有几个字节
{"lastMessageId": 12345}

// 响应头同样巨大
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 256
Date: Wed, 01 Jan 2025 12:00:00 GMT
Server: nginx/1.20.1
X-Request-ID: abc123
...等几十行

// 响应体
{"messages":[...]}
```

### 2.3 实时通信需求与HTTP的矛盾

| 实时通信需求 | HTTP能否满足 | 原因 |
|-------------|-------------|------|
| 服务器主动推送 | ❌ 不能 | HTTP只有请求-响应模式 |
| 低延迟 | ❌ 延迟高 | 每次都要重建连接 |
| 频繁消息交换 | ❌ 效率低 | header开销太大 |
| 保持连接状态 | ❌ 不支持 | 连接随响应结束而关闭 |
| 双向同时通信 | ❌ 不支持 | 只能客户端发起请求 |

---

## 3. WebSocket是什么？

### 3.1 WebSocket的工作原理

WebSocket是一种**全双工通信协议**，就像在客户端和服务器之间建立了一条**永久的电话线**。一旦连接建立，双方可以随时互相发送消息，不需要重新拨号。

```
WebSocket连接建立过程（握手）

客户端                              服务器
  │                                   │
  │ ──────── HTTP请求（升级）────────>│
  │   GET /chat HTTP/1.1             │
  │   Upgrade: websocket             │  "我想升级成WebSocket连接"
  │   Connection: Upgrade            │
  │   Sec-WebSocket-Key: dGhl...     │  握手密钥
  │                                   │
  │ <──────── HTTP响应（101状态码）────│
  │   HTTP/1.1 101 Switching Protocols│  "好的，协议升级"
  │   Upgrade: websocket             │
  │   Sec-WebSocket-Accept: s3pP...  │  握手验证
  │                                   │
  │══════════ WebSocket连接 ══════════│  永久连接建立！
  │                                   │
  │ <──────── 服务器发消息 ───────────│
  │ ──────── 客户端发消息 ───────────>│
  │           ...自由通信...          │
```

### 3.2 为什么需要握手？

WebSocket使用HTTP协议来进行"升级请求"，这是一种优雅的方案：
- 利用HTTP的端口（80/443）和防火墙友好的特点
- 通过`Upgrade`头协商切换到WebSocket协议
- 服务器返回101状态码表示协议切换成功

### 3.3 WebSocket的独特优势

| 优势 | 说明 | 对比HTTP |
|------|------|----------|
| **永久连接** | 连接建立后保持打开 | 每次请求都要重建 |
| **服务器推送** | 服务器可以主动发消息 | 服务器无法主动发 |
| **全双工通信** | 双方同时可以发送 | 只能客户端发起 |
| **低延迟** | 消息即时到达 | 有轮询延迟 |
| **轻量header** | 首部只有2-14字节 | 几百字节到几KB |

### 3.4 WebSocket使用示例

#### 浏览器原生WebSocket API

```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:8080/chat');

// 连接成功时触发
ws.onopen = () => {
  console.log('WebSocket连接已建立');

  // 发送消息给服务器
  ws.send(JSON.stringify({
    type: 'hello',
    content: '你好，服务器！'
  }));
};

// 收到服务器消息时触发
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);

  if (data.type === 'message') {
    addMessageToUI(data.content);
  }
};

// 连接出错时触发
ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
};

// 连接关闭时触发
ws.onclose = (event) => {
  console.log('WebSocket连接已关闭', event.code, event.reason);
};

// 关闭连接
ws.close();
```

#### Node.js服务端WebSocket实现

```javascript
// 使用ws库创建WebSocket服务器
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// 存储所有连接的客户端
const clients = new Map();

wss.on('connection', (ws, request) => {
  // 为每个连接分配唯一ID
  const clientId = generateId();
  clients.set(clientId, { ws, username: null });

  console.log(`客户端 ${clientId} 连接成功`);

  // 监听客户端消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 处理登录
      if (data.type === 'login') {
        clients.get(clientId).username = data.username;
        console.log(`用户 ${data.username} 已登录`);
        broadcast({
          type: 'system',
          content: `${data.username} 加入了聊天`
        });
      }

      // 处理聊天消息
      if (data.type === 'message') {
        const client = clients.get(clientId);
        console.log(`${client.username}: ${data.content}`);

        // 广播消息给所有客户端
        broadcast({
          type: 'message',
          username: client.username,
          content: data.content,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      console.error('消息解析失败:', e);
    }
  });

  // 监听连接关闭
  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client && client.username) {
      console.log(`用户 ${client.username} 离开`);
      broadcast({
        type: 'system',
        content: `${client.username} 离开了聊天`
      });
    }
    clients.delete(clientId);
  });
});

// 广播消息给所有客户端
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

console.log('WebSocket服务器启动在 ws://localhost:8080');
```

---

## 4. Socket.io框架详解

### 4.1 什么是Socket.io？

Socket.io是一个**封装了WebSocket的实时通信库**，它比原生WebSocket更强大、更易用。

```
Socket.io vs 原生WebSocket

原生WebSocket：        Socket.io：
├── 需要手动处理兼容    ├── 自动降级（WebSocket不可用时用轮询）
├── 没有房间概念        ├── 内置房间（Room）功能
├── 没有自动重连        ├── 自动重连机制
├── 手动管理连接状态    ├── 连接状态管理
└── 事件名称要自己约定  └── 命名空间（Namespace）隔离
```

### 4.2 Socket.io的自动降级机制

Socket.io会智能选择最佳的通信方式：

```
Socket.io通信方式优先级

1. WebSocket（最佳）
   ↓ 如果浏览器不支持
2. WebSocket over XHR
   ↓ 如果仍然不行
3. Long Polling（HTTP长轮询）
   ↓ 最后保底
4. JSONP Polling

开发者无需关心，Socket.io自动处理！
```

### 4.3 Socket.io核心概念

#### 概念一：事件驱动

Socket.io使用事件机制进行通信，就像电视遥控器：
- 按下某个按钮（发送事件），电视执行对应操作
- 电视也可以主动发出信号（服务器事件）

```javascript
// 客户端：发送事件
socket.emit('chatMessage', { content: '你好' });

// 客户端：监听事件
socket.on('chatMessage', (data) => {
  console.log('收到消息:', data.content);
});

// 服务器：监听事件
socket.on('chatMessage', (data) => {
  console.log('收到消息:', data.content);
});

// 服务器：发送事件
io.emit('chatMessage', { content: '服务器发来的消息' });
```

#### 概念二：房间（Room）

房间是Socket.io的核心功能，用于**隔离不同组的客户端**。

```
房间隔离示意

                    服务器
                      │
         ┌─────────────┼─────────────┐
         │            │            │
      房间A         房间B        房间C
    （文档1）      （文档2）    （客服1）
         │            │            │
      用户1         用户3        客服2
      用户2         用户4        访客1
         │                         │
      消息只在房间内广播           │
                                   │
消息A --只发送给--> 用户1, 用户2    │
消息B --只发送给--> 用户3, 用户4    │
消息C --只发送给--> 客服2, 访客1   │
```

#### 概念三：命名空间（Namespace）

命名空间用于**更大范围的逻辑隔离**，不同的命名空间可以有独立的中间件、认证逻辑。

```
命名空间示例

/
├── /chat        - 聊天相关连接
│   └── chatMessage事件
│
├── /game        - 游戏相关连接
│   └── gameAction事件
│
└── /admin       - 管理后台连接
    └── adminAction事件

每个命名空间独立管理自己的连接和事件
```

### 4.4 FastDocument项目中的Socket.io实际应用

以下是FastDocument项目中的Socket.io客户端实现（来源：`D:\Develeping\FastDocument\frontend\src\lib\socket.ts`）：

```typescript
import { io, Socket } from "socket.io-client";
import { logError, logWarn } from './logger';
import { appEnv } from './env';

/**
 * 后端服务地址，优先使用环境变量
 */
const SOCKET_URL = appEnv.backendUrl;

/**
 * Socket.io 客户端包装类
 * 用于管理连接、房间加入及消息收发
 */
class SocketClient {
  private socket: Socket | null = null;
  // 消息监听器列表，支持多个监听者
  private messageListeners: Function[] = [];
  // 用户列表监听器列表
  private usersListeners: Function[] = [];

  /**
   * 建立连接并绑定基础状态监听
   */
  connect(onStatusChange?: (online: boolean) => void) {
    if (!this.socket) {
      // 创建Socket.io连接，配置重连和超时参数
      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,  // 最多重连5次
        timeout: 10000,           // 10秒超时
      });

      // 连接成功
      this.socket.on("connect", () => {
        console.log("成功连接至 WebSocket 服务器");
        if (onStatusChange) onStatusChange(true);
      });

      // 连接断开
      this.socket.on("disconnect", () => {
        logWarn("与 WebSocket 服务器断开连接");
        if (onStatusChange) onStatusChange(false);
      });

      // 监听聊天消息
      this.socket.on("chatMessage", (data) => {
        this.messageListeners.forEach(listener => listener(data));
      });

      // 监听在线用户更新
      this.socket.on("onlineUsersUpdate", (data) => {
        this.usersListeners.forEach(listener => listener(data));
      });
    }
    return this.socket;
  }

  /**
   * 加入特定的文档协作房间
   */
  joinDocument(docId: string, userName: string) {
    if (this.socket) {
      // 向服务器发送加入房间事件
      this.socket.emit("joinDocument", { docId, userName });
    }
  }

  /**
   * 监听在线用户列表更新
   */
  onOnlineUsersUpdate(callback: (users: { id: string; name: string }[]) => void) {
    if (this.socket) {
      this.socket.on("onlineUsersUpdate", callback);
    }
  }

  /**
   * 监听聊天消息
   */
  onChatMessage(callback: (data: any) => void) {
    this.messageListeners.push(callback);
    // 返回取消监听函数，方便组件卸载时清理
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  /**
   * 发送聊天消息
   */
  sendChat(docId: string, userId: string, userName: string, content: string, mentions?: string[]) {
    if (this.socket) {
      this.socket.emit("chatMessage", {
        docId,
        userId,
        userName,
        content,
        timestamp: Date.now(),
        mentions: mentions || []
      });
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// 导出单例，供全应用共享
export const socketClient = new SocketClient();
```

### 4.5 NestJS后端Socket.io网关

以下是FastDocument项目中的NestJS WebSocket网关实现（来源：`D:\Develeping\FastDocument\backend\src\documents\documents.gateway.ts`）：

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DocumentsService } from './documents.service';

/**
 * 实时协作网关
 * 集成多端内容同步、光标状态追踪
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],  // 允许的跨域来源
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class DocumentsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // 房间用户列表，记录每个房间有哪些用户
  private roomUsers: Record<string, { id: string; name: string }[]> = {};

  afterInit(server: Server) {
    console.log('协作网关已初始化');
  }

  // 客户端连接时调用
  handleConnection(client: Socket) {
    console.log(`用户连接: ${client.id}`);
  }

  // 客户端断开连接时调用
  async handleDisconnect(client: Socket) {
    const userId = client.id;

    // 从所有房间中移除该用户
    for (const docId in this.roomUsers) {
      this.roomUsers[docId] = this.roomUsers[docId].filter(
        (u) => u.id !== userId,
      );

      // 通知房间内其他用户在线用户列表更新
      this.server.to(docId).emit('onlineUsersUpdate', this.roomUsers[docId]);
    }

    console.log(`用户断开: ${userId}`);
  }

  /**
   * 处理加入房间
   */
  @SubscribeMessage('joinDocument')
  async handleJoinRoom(
    @MessageBody() data: { docId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { docId, userName } = data;

    // 将客户端加入房间
    client.join(docId);

    // 初始化房间用户列表
    if (!this.roomUsers[docId]) {
      this.roomUsers[docId] = [];
    }

    // 添加用户到房间
    const existingUserIndex = this.roomUsers[docId].findIndex((u) => u.id === client.id);
    if (existingUserIndex >= 0) {
      this.roomUsers[docId][existingUserIndex].name = userName;
    } else {
      this.roomUsers[docId].push({
        id: client.id,
        name: userName,
      });
    }

    // 向房间内所有人广播当前在线用户列表
    this.server.to(docId).emit('onlineUsersUpdate', this.roomUsers[docId]);
    console.log(`用户 ${userName} (${client.id}) 加入房间 ${docId}`);
  }

  /**
   * 处理聊天消息
   */
  @SubscribeMessage('chatMessage')
  handleChatMessage(
    @MessageBody()
    data: {
      docId: string;
      userId: string;
      userName: string;
      content: string;
      timestamp: number;
      mentions?: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    // 广播消息给同一文档房间的所有用户
    this.server.to(data.docId).emit('chatMessage', data);
  }
}
```

### 4.6 Socket.io常用API速查

```javascript
// ========== 客户端API ==========

// 连接服务器
const socket = io('http://localhost:3000');

// 发送事件
socket.emit('eventName', { data: 'hello' });

// 监听事件
socket.on('eventName', (data) => {
  console.log('收到:', data);
});

// 加入房间
socket.emit('joinRoom', { roomId: 'room1' });

// 离开房间
socket.emit('leaveRoom', { roomId: 'room1' });

// 获取连接状态
console.log(socket.connected);  // true 或 false

// 断开连接
socket.disconnect();


// ========== 服务端API ==========

// 发送事件给所有客户端（包括发送者）
io.emit('eventName', { data: 'hello' });

// 发送事件给房间内所有客户端（包括发送者）
io.to('room1').emit('eventName', { data: 'hello' });

// 发送给除发送者外的房间内其他客户端
client.to('room1').emit('eventName', { data: 'hello' });

// 发送给特定客户端
io.to(socketId).emit('eventName', { data: 'hello' });

// 获取房间内的客户端列表
const clients = await io.in('room1').fetchSockets();
clients.forEach(socket => console.log(socket.id));
```

---

## 5. 即时聊天功能实现

### 5.1 即时聊天的核心要素

```
即时聊天系统组成

┌─────────────────────────────────────────────────────┐
│                    即时聊天系统                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ 消息发送 │    │ 消息接收 │    │ 历史记录 │         │
│  │  组件    │    │  组件    │    │  组件    │         │
│  └────┬────┘    └────┬────┘    └────┬────┘         │
│       │              │              │              │
│       ▼              ▼              ▼              │
│  ┌─────────────────────────────────────┐           │
│  │           Socket.io 服务             │           │
│  │  • 消息路由   • 房间管理   • 用户追踪 │           │
│  └─────────────────────────────────────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 聊天消息的数据结构

```typescript
/**
 * 聊天消息的数据结构
 */
interface ChatMessage {
  id: string;              // 消息唯一ID
  roomId: string;          // 所属房间ID
  userId: string;          // 发送者用户ID
  userName: string;         // 发送者用户名
  content: string;         // 消息内容
  timestamp: number;        // 发送时间戳
  type: 'text' | 'image' | 'file';  // 消息类型
  status: 'sending' | 'sent' | 'error';  // 发送状态
  mentions?: string[];      // 提及的用户名列表
  reactions?: {             // 表情反应
    emoji: string;
    users: string[];
  }[];
}

/**
 * 房间信息的数据结构
 */
interface ChatRoom {
  id: string;               // 房间ID
  name: string;             // 房间名称
  type: 'private' | 'group'; // 房间类型
  members: string[];         // 成员用户ID列表
  createdAt: number;         // 创建时间
  lastMessage?: ChatMessage; // 最后一条消息
  unreadCount: number;      // 未读消息数
}
```

### 5.3 聊天界面组件实现

```typescript
// ChatRoom.tsx - 聊天房间组件
import React, { useState, useEffect, useRef } from 'react';
import { socketClient } from '@/lib/socket';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
}

interface ChatRoomProps {
  roomId: string;
  currentUser: { id: string; name: string };
}

export default function ChatRoom({ roomId, currentUser }: ChatRoomProps) {
  // 消息列表状态
  const [messages, setMessages] = useState<Message[]>([]);
  // 输入框内容
  const [inputValue, setInputValue] = useState('');
  // 在线用户列表
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);
  // 消息列表底部引用（用于自动滚动）
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加入房间并监听消息
  useEffect(() => {
    // 加入房间
    socketClient.joinDocument(roomId, currentUser.name);

    // 监听新消息
    const unsubscribeMessage = socketClient.onChatMessage((data: any) => {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        userId: data.userId,
        userName: data.userName,
        content: data.content,
        timestamp: data.timestamp,
        status: 'sent'
      }]);
    });

    // 监听在线用户更新
    const unsubscribeUsers = socketClient.onOnlineUsersUpdate((users: any[]) => {
      setOnlineUsers(users);
    });

    // 清理监听器
    return () => {
      unsubscribeMessage();
      unsubscribeUsers();
    };
  }, [roomId, currentUser]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const sendMessage = () => {
    if (!inputValue.trim()) return;

    // 添加消息到列表（乐观更新）
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      userId: currentUser.id,
      userName: currentUser.name,
      content: inputValue,
      timestamp: Date.now(),
      status: 'sending'
    }]);

    // 发送消息到服务器
    socketClient.sendChat(roomId, currentUser.id, currentUser.name, inputValue);

    // 清空输入框
    setInputValue('');
  };

  // 按Enter键发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* 消息区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.userId === currentUser.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {/* 消息头：用户名和发送时间 */}
                {message.userId !== currentUser.id && (
                  <div className="text-xs text-gray-500 mb-1">
                    {message.userName}
                  </div>
                )}

                {/* 消息内容 */}
                <div className="break-words">{message.content}</div>

                {/* 消息状态和时间 */}
                <div className={`text-xs mt-1 ${
                  message.userId === currentUser.id ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {message.userId === currentUser.id && message.status === 'sending' && ' · 发送中...'}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              className="flex-1 border rounded-lg px-3 py-2 resize-none"
              rows={2}
              placeholder="输入消息..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={sendMessage}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* 在线用户列表 */}
      <div className="w-48 border-l p-4 hidden lg:block">
        <h3 className="font-bold mb-2">在线用户 ({onlineUsers.length})</h3>
        <ul className="space-y-2">
          {onlineUsers.map(user => (
            <li key={user.id} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">{user.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 6. 在线状态管理

### 6.1 什么是在线状态？

在线状态指的是用户是"在线"还是"离线"。这是一个看似简单但实现起来有诸多细节的问题。

```
在线状态的三种状态

┌────────────────────────────────────┐
│           用户状态                   │
├────────────────────────────────────┤
│                                    │
│  ● 在线（Online）                   │
│    - 用户已连接WebSocket            │
│    - 可以实时接收消息               │
│                                    │
│  ○ 离线（Offline）                  │
│    - 用户已断开WebSocket            │
│    - 无法接收实时消息               │
│                                    │
│  ◐ 离开（Away）                     │
│    - 用户保持连接但不活跃           │
│    - 通常由心跳超时触发              │
│                                    │
└────────────────────────────────────┘
```

### 6.2 在线状态追踪实现

```typescript
// onlineStatus.ts - 在线状态追踪模块

/**
 * 在线状态追踪器
 * 用于管理所有用户的在线状态
 */
class OnlineStatusTracker {
  // 用户状态映射：userId -> status
  private userStatus: Map<string, 'online' | 'offline' | 'away'> = new Map();

  // 用户最后活跃时间：userId -> timestamp
  private lastActivity: Map<string, number> = new Map();

  // 离开超时时间（毫秒），5分钟不活跃视为离开
  private readonly AWAY_TIMEOUT = 5 * 60 * 1000;

  // 状态变化监听器
  private listeners: Set<(userId: string, status: string) => void> = new Set();

  /**
   * 用户上线
   */
  userOnline(userId: string): void {
    const previousStatus = this.userStatus.get(userId);
    this.userStatus.set(userId, 'online');
    this.lastActivity.set(userId, Date.now());

    // 通知状态变化
    if (previousStatus !== 'online') {
      this.notifyStatusChange(userId, 'online');
    }
  }

  /**
   * 用户离线
   */
  userOffline(userId: string): void {
    const previousStatus = this.userStatus.get(userId);
    this.userStatus.set(userId, 'offline');

    if (previousStatus !== 'offline') {
      this.notifyStatusChange(userId, 'offline');
    }
  }

  /**
   * 用户活跃（心跳）
   */
  userActive(userId: string): void {
    const previousStatus = this.userStatus.get(userId);
    this.lastActivity.set(userId, Date.now());

    // 如果之前是离开状态，恢复在线
    if (previousStatus === 'away') {
      this.userStatus.set(userId, 'online');
      this.notifyStatusChange(userId, 'online');
    }
  }

  /**
   * 获取用户状态
   */
  getUserStatus(userId: string): 'online' | 'offline' | 'away' {
    // 检查是否需要转为离开状态
    const lastActive = this.lastActivity.get(userId);
    if (lastActive && Date.now() - lastActive > this.AWAY_TIMEOUT) {
      if (this.userStatus.get(userId) === 'online') {
        this.userStatus.set(userId, 'away');
        this.notifyStatusChange(userId, 'away');
      }
    }

    return this.userStatus.get(userId) || 'offline';
  }

  /**
   * 获取所有在线用户
   */
  getOnlineUsers(): string[] {
    const onlineUsers: string[] = [];

    this.userStatus.forEach((status, userId) => {
      if (status === 'online' || status === 'away') {
        onlineUsers.push(userId);
      }
    });

    return onlineUsers;
  }

  /**
   * 订阅状态变化
   */
  subscribe(callback: (userId: string, status: string) => void): () => void {
    this.listeners.add(callback);
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 通知所有监听器状态变化
   */
  private notifyStatusChange(userId: string, status: string): void {
    this.listeners.forEach(listener => {
      listener(userId, status);
    });
  }

  /**
   * 清理离线用户（定期调用）
   */
  cleanupOfflineUsers(): void {
    const offlineThreshold = Date.now() - this.AWAY_TIMEOUT * 2;

    this.userStatus.forEach((status, userId) => {
      if (status === 'offline') {
        const lastActive = this.lastActivity.get(userId);
        if (lastActive && lastActive < offlineThreshold) {
          // 彻底清理长时间离线的用户
          this.userStatus.delete(userId);
          this.lastActivity.delete(userId);
        }
      }
    });
  }
}

// 导出单例
export const onlineStatusTracker = new OnlineStatusTracker();

// 定期清理离线用户（每10分钟）
setInterval(() => {
  onlineStatusTracker.cleanupOfflineUsers();
}, 10 * 60 * 1000);
```

### 6.3 NestJS后端实现用户上下线广播

```typescript
// 在DocumentsGateway中添加用户上下线通知
@SubscribeMessage('joinDocument')
async handleJoinRoom(
  @MessageBody() data: { docId: string; userName: string },
  @ConnectedSocket() client: Socket,
) {
  const { docId, userName } = data;

  // 加入房间
  client.join(docId);

  // 记录用户
  if (!this.roomUsers[docId]) {
    this.roomUsers[docId] = [];
  }

  this.roomUsers[docId].push({
    id: client.id,
    name: userName,
  });

  // 【关键】向房间内所有人广播用户列表更新
  // 这会触发所有客户端更新在线用户列表
  this.server.to(docId).emit('onlineUsersUpdate', this.roomUsers[docId]);

  // 【可选】向该用户单独发送欢迎消息
  client.emit('systemMessage', {
    content: `欢迎 ${userName} 加入！当前在线 ${this.roomUsers[docId].length} 人`
  });

  console.log(`用户 ${userName} 加入房间 ${docId}`);
}

async handleDisconnect(client: Socket) {
  // 从所有房间移除该用户
  for (const docId in this.roomUsers) {
    const initialLength = this.roomUsers[docId].length;
    this.roomUsers[docId] = this.roomUsers[docId].filter(
      (u) => u.id !== client.id,
    );

    // 【关键】如果房间人数变化，广播更新
    if (this.roomUsers[docId].length !== initialLength) {
      this.server.to(docId).emit('onlineUsersUpdate', this.roomUsers[docId]);
    }
  }

  console.log(`用户 ${client.id} 断开连接`);
}
```

---

## 7. 消息推送系统

### 7.1 消息推送的应用场景

```
消息推送典型场景

┌─────────────────────────────────────┐
│           消息推送场景               │
├─────────────────────────────────────┤
│                                     │
│  📢 系统通知                         │
│     - 管理员广播                     │
│     - 系统公告                       │
│     - 版本更新提示                   │
│                                     │
│  💬 互动消息                         │
│     - 有人@了你                      │
│     - 有人评论了你的内容             │
│     - 有人点赞了你的帖子             │
│                                     │
│  🔔 事务提醒                         │
│     - 待办任务提醒                   │
│     - 会议开始提醒                   │
│     - 订单状态更新                   │
│                                     │
│  📱 即时通讯                         │
│     - 私信消息                       │
│     - 群聊消息                       │
│                                     │
└─────────────────────────────────────┘
```

### 7.2 消息推送的核心实现

```typescript
// notificationService.ts - 消息推送服务

/**
 * 消息推送服务
 * 处理各类消息的推送逻辑
 */
class NotificationService {
  private io: Server;
  private redis: Redis;

  constructor(io: Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
  }

  /**
   * 推送系统公告
   * @param title 公告标题
   * @param content 公告内容
   * @param priority 优先级 low | normal | high
   */
  async pushAnnouncement(title: string, content: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const announcement = {
      id: `ann_${Date.now()}`,
      type: 'announcement',
      title,
      content,
      priority,
      timestamp: Date.now(),
    };

    // 广播给所有连接的客户端
    this.io.emit('notification', announcement);

    // 如果是高优先级，存入Redis以便离线用户稍后获取
    if (priority === 'high') {
      await this.redis.lpush('announcements:high', JSON.stringify(announcement));
      await this.redis.ltrim('announcements:high', 0, 99); // 只保留最近100条
    }

    console.log(`[推送] 系统公告: ${title}`);
  }

  /**
   * 推送个性化通知给指定用户
   * @param userId 用户ID
   * @param notification 通知内容
   */
  async pushToUser(userId: string, notification: any) {
    // 为用户构建专属事件
    const eventName = `notification:${userId}`;

    // 通过用户的专属房间发送
    this.io.to(`user:${userId}`).emit(eventName, {
      ...notification,
      timestamp: Date.now(),
    });

    // 同时存入用户的通知列表（Redis）
    await this.redis.lpush(`notifications:${userId}`, JSON.stringify(notification));
    await this.redis.ltrim(`notifications:${userId}`, 0, 49); // 只保留最近50条

    console.log(`[推送] 发送给用户 ${userId}:`, notification);
  }

  /**
   * 推送@提及通知
   * @param mentionedUserId 被@的用户ID
   * @param fromUser 发起@的用户
   * @param context 上下文（如所在的文档/消息）
   */
  async pushMention(mentionedUserId: string, fromUser: { id: string; name: string }, context: any) {
    await this.pushToUser(mentionedUserId, {
      type: 'mention',
      title: `${fromUser.name} 在文档中提到了你`,
      from: fromUser,
      context: {
        documentId: context.documentId,
        documentTitle: context.documentTitle,
        messagePreview: context.messageContent?.slice(0, 50),
      },
    });
  }

  /**
   * 广播消息给所有房间成员
   * @param roomId 房间ID
   * @param message 消息内容
   */
  broadcastToRoom(roomId: string, message: any) {
    // 发送给房间内所有人，包括发送者
    this.io.to(roomId).emit('roomMessage', {
      ...message,
      timestamp: Date.now(),
    });
  }
}
```

### 7.3 前端接收推送通知

```typescript
// useNotification.ts - 通知订阅Hook
import { useEffect } from 'react';
import { socketClient } from '@/lib/socket';

/**
 * 通知订阅Hook
 * 自动订阅全局通知和用户专属通知
 */
export function useNotification(
  userId: string,
  onNotification: (notification: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    // 监听全局通知（系统公告等）
    const unsubscribeGlobal = socketClient.onGlobalNotification((notification) => {
      // 添加到通知列表
      addToNotificationList(notification);
      // 触发回调
      onNotification(notification);

      // 如果是重要通知，显示浏览器通知
      if (notification.priority === 'high') {
        showBrowserNotification(notification);
      }
    });

    // 监听用户专属通知
    const unsubscribePersonal = socketClient.onPersonalNotification(userId, (notification) => {
      addToNotificationList(notification);
      onNotification(notification);

      // 显示通知弹窗
      showToast(notification);
    });

    return () => {
      unsubscribeGlobal();
      unsubscribePersonal();
    };
  }, [userId, onNotification]);
}

/**
 * 添加通知到列表（存储在本地）
 */
function addToNotificationList(notification: any) {
  const list = JSON.parse(localStorage.getItem('notifications') || '[]');
  list.unshift({
    ...notification,
    read: false,
    id: notification.id || `notif_${Date.now()}`,
  });
  // 最多保存100条
  if (list.length > 100) list.pop();
  localStorage.setItem('notifications', JSON.stringify(list));
}

/**
 * 显示浏览器通知
 */
function showBrowserNotification(notification: any) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title || '新通知', {
      body: notification.content || notification.title,
      icon: '/icon.png',
    });
  }
}

/**
 * 显示Toast提示
 */
function showToast(notification: any) {
  // 使用项目中的Toast组件
  console.log('[Toast]', notification);
}
```

---

## 8. 房间隔离机制

### 8.1 为什么需要房间隔离？

想象一个场景：有两个在线文档同时在编辑，如果消息没有隔离：
- 用户A在文档1编辑的内容，错误地出现在文档2
- 用户B在文档2的聊天消息，被文档1的用户收到

房间隔离就是为了防止这种**消息串台**的问题。

```
房间隔离示意图

房间A（文档1）                    房间B（文档2）
┌──────────────┐               ┌──────────────┐
│ 用户A        │               │ 用户C        │
│ 用户B        │               │ 用户D        │
└──────────────┘               └──────────────┘
     │                              │
     │ 文档A的更新 ──────────────> 只发给A、B
     │ 文档B的更新 ─────────────────> 只发给C、D
     │                              │
     ▼                              ▼
消息不会交叉污染               消息不会交叉污染
```

### 8.2 房间隔离的实现原理

Socket.io的房间功能是通过**内存中的Set数据结构**实现的：

```typescript
// Socket.io房间管理内部结构（简化示意）

class Socket {
  id: string;
  rooms: Set<string>;  // 该socket加入的房间列表
  server: Server;

  // 加入房间
  join(room: string) {
    // 1. 将room添加到自己的rooms Set中
    this.rooms.add(room);

    // 2. 通知server将该socket加入到room的成员列表
    this.server rooms.get(room).add(this);

    // 3. 广播room人数变化事件
    this.server.emit('roomEvent', {
      room,
      count: this.server.rooms.get(room).size,
      type: 'join'
    });
  }

  // 离开房间
  leave(room: string) {
    this.rooms.delete(room);
    this.server.rooms.get(room).delete(this);
  }

  // 向房间内其他人发送（不包括自己）
  to(room: string).emit(event, data) {
    // 遍历room中的所有socket
    for (const socket of this.server.rooms.get(room)) {
      // 排除自己
      if (socket.id !== this.id) {
        socket.send(event, data);
      }
    }
  }
}
```

### 8.3 房间隔离的多种模式

```typescript
// 模式一：按文档ID隔离（文档协作场景）

// 用户加入文档A的房间
socket.emit('joinDocument', { docId: 'doc_A' });

// 服务器端处理
@SubscribeMessage('joinDocument')
handleJoinDocument(@MessageBody() data: { docId: string }, @ConnectedSocket() client: Socket) {
  // 将用户加入文档专属房间
  client.join(`doc:${data.docId}`);
}

// 之后所有该文档的消息都发送到doc:doc_A房间
socket.to('doc:doc_A').emit('blockUpdated', blockData);


// 模式二：按客服会话隔离（在线客服场景）

// 每个客服和用户创建一个1:1会话房间
function createSupportRoom(supportId: string, userId: string): string {
  return `support:${supportId}:${userId}`;
}

// 客服加入会话
socket.emit('joinSupportRoom', {
  supportId: 'support_001',
  userId: 'user_123'
});

// 房间名示例：support:support_001:user_123
// 只有客服和该用户能收到消息


// 模式三：按群组隔离（群聊场景）

// 用户加入群聊房间
socket.emit('joinGroup', { groupId: 'group_001' });

// 发送群消息
@SubscribeMessage('groupMessage')
handleGroupMessage(@MessageBody() data, @ConnectedSocket() client: Socket) {
  // 发送给整个群组，包括发送者
  io.to(`group:${data.groupId}`).emit('groupMessage', {
    ...data,
    from: client.data.user,
    timestamp: Date.now()
  });
}


// 模式四：临时房间隔离（视频会议场景）

// 创建一个临时会议房间
function createMeetingRoom(): string {
  return `meeting:${generateRoomId()}`;
}

// 会议结束后房间自动销毁
@SubscribeMessage('endMeeting')
handleEndMeeting(@MessageBody() data: { roomId: string }) {
  // 获取房间内所有socket
  const sockets = await io.in(data.roomId).fetchSockets();

  // 将所有用户移出房间
  for (const socket of sockets) {
    socket.leave(data.roomId);
  }

  // 广播会议结束
  io.to(data.roomId).emit('meetingEnded');
}
```

### 8.4 房间状态管理

```typescript
// roomManager.ts - 房间状态管理器

interface RoomInfo {
  id: string;
  name: string;
  type: 'document' | 'support' | 'group' | 'meeting';
  members: Map<string, MemberInfo>;
  createdAt: Date;
  metadata: any;
}

interface MemberInfo {
  id: string;
  name: string;
  role: 'owner' | 'member' | 'guest';
  joinedAt: Date;
  lastActive: Date;
}

/**
 * 房间状态管理器
 * 维护所有房间的实时状态
 */
class RoomManager {
  // 房间信息映射
  private rooms: Map<string, RoomInfo> = new Map();

  // 用户所在房间映射（便于快速查找用户所在的房间）
  private userRooms: Map<string, Set<string>> = new Map();

  /**
   * 创建房间
   */
  createRoom(room: Omit<RoomInfo, 'members' | 'createdAt'>): RoomInfo {
    const roomInfo: RoomInfo = {
      ...room,
      members: new Map(),
      createdAt: new Date(),
    };
    this.rooms.set(room.id, roomInfo);
    return roomInfo;
  }

  /**
   * 用户加入房间
   */
  joinRoom(roomId: string, member: MemberInfo): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`房间 ${roomId} 不存在`);
    }

    // 添加成员
    room.members.set(member.id, member);

    // 更新用户房间映射
    if (!this.userRooms.has(member.id)) {
      this.userRooms.set(member.id, new Set());
    }
    this.userRooms.get(member.id)!.add(roomId);

    console.log(`用户 ${member.name} 加入房间 ${room.name}`);
  }

  /**
   * 用户离开房间
   */
  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.members.delete(userId);

      // 如果房间空了，可以选择删除房间或保留
      if (room.members.size === 0) {
        console.log(`房间 ${room.name} 已空`);
      }
    }

    // 更新用户房间映射
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(roomId);
    }
  }

  /**
   * 获取用户所在的所有房间
   */
  getUserRooms(userId: string): RoomInfo[] {
    const roomIds = this.userRooms.get(userId);
    if (!roomIds) return [];

    return Array.from(roomIds)
      .map(id => this.rooms.get(id))
      .filter((room): room is RoomInfo => room !== undefined);
  }

  /**
   * 获取房间信息
   */
  getRoom(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 获取房间成员数
   */
  getMemberCount(roomId: string): number {
    return this.rooms.get(roomId)?.members.size || 0;
  }

  /**
   * 获取所有房间（管理员用）
   */
  getAllRooms(): RoomInfo[] {
    return Array.from(this.rooms.values());
  }
}

export const roomManager = new RoomManager();
```

---

## 9. 心跳检测与断线重连

### 9.1 为什么需要心跳检测？

网络环境复杂多变，WebSocket连接可能因为以下原因"静默死亡"：
- 网络波动（短暂断网又恢复）
- 路由器NAT会话超时
- 服务器重启但客户端认为还连着
- 网络中间设备（如企业防火墙）主动断开长连接

**心跳检测**就像定期给对方打电话问"你还在线吗？"，确保连接真的还活着。

```
心跳检测原理

客户端                              服务器
  │                                   │
  │ ──────── Ping ───────────────────>│ "你还活着吗？"
  │                                   │
  │ <──────── Pong ──────────────────│ "活着呢！"
  │                                   │
  │     （每30秒重复一次）             │
  │                                   │


如果没有响应：
  - 说明连接已断开
  - 触发断线重连流程
```

### 9.2 Socket.io内置心跳机制

Socket.io已经内置了心跳检测，你也可以配置参数：

```typescript
// 配置心跳参数
const socket = io('http://localhost:3000', {
  // 心跳间隔（毫秒），默认25秒
  pingInterval: 25000,

  // 心跳超时（毫秒），默认20秒
  // 如果这么久没收到响应，认为连接已断开
  pingTimeout: 20000,

  // 重连尝试次数
  reconnectionAttempts: 5,

  // 重连延迟（毫秒），会指数增长
  reconnectionDelay: 1000,

  // 最大重连延迟
  reconnectionDelayMax: 5000,
});

// 监听重连事件
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`正在尝试第 ${attemptNumber} 次重连...`);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`重连成功！总共尝试了 ${attemptNumber} 次`);
});

socket.on('reconnect_error', (error) => {
  console.error('重连失败:', error);
});

socket.on('reconnect_failed', () => {
  console.error('重连次数用尽，无法恢复连接');
});
```

### 9.3 自定义心跳检测实现

```typescript
// heartbeatSocket.ts - 带心跳检测的Socket客户端

import { io, Socket } from 'socket.io-client';

/**
 * 带心跳检测的Socket客户端
 * 用于需要更精细控制心跳的场景
 */
class HeartbeatSocket {
  private socket: Socket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  // 心跳配置
  private readonly HEARTBEAT_INTERVAL = 30000;  // 30秒发一次心跳
  private readonly HEARTBEAT_TIMEOUT = 10000;   // 10秒没响应认为断开
  private heartbeatResponseTimer: NodeJS.Timeout | null = null;

  // 连接状态
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  /**
   * 建立连接
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        reconnection: false,  // 我们自己处理重连
        timeout: 10000,
      });

      // 连接成功
      this.socket.on('connect', () => {
        console.log('连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      });

      // 断开连接
      this.socket.on('disconnect', (reason) => {
        console.log('断开连接:', reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // 根据断开原因决定是否重连
        if (this.shouldReconnect(reason)) {
          this.attemptReconnect();
        }
      });

      // 收到心跳响应
      this.socket.on('pong', () => {
        console.log('收到心跳响应');
        this.clearHeartbeatTimeout();
      });

      // 连接超时
      this.socket.on('connect_timeout', () => {
        reject(new Error('连接超时'));
      });

      // 连接错误
      this.socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    // 清除旧的心跳定时器
    this.stopHeartbeat();

    // 设置新的心跳定时器
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket) {
        console.log('发送心跳...');

        // 发送ping事件
        this.socket.emit('ping');

        // 设置心跳响应超时
        this.heartbeatResponseTimer = setTimeout(() => {
          console.warn('心跳响应超时，连接可能已断开');
          // 强制断开，触发重连
          this.socket?.disconnect();
        }, this.HEARTBEAT_TIMEOUT);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  /**
   * 清除心跳响应超时
   */
  private clearHeartbeatTimeout(): void {
    if (this.heartbeatResponseTimer) {
      clearTimeout(this.heartbeatResponseTimer);
      this.heartbeatResponseTimer = null;
    }
  }

  /**
   * 判断是否应该重连
   */
  private shouldReconnect(reason: string): boolean {
    // 这些原因不适合自动重连
    const noReconnectReasons = [
      'io server disconnect',  // 服务器主动断开
      'io client disconnect',  // 客户端主动断开
    ];

    return !noReconnectReasons.includes(reason);
  }

  /**
   * 尝试重连
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('达到最大重连次数，放弃重连');
      return;
    }

    this.reconnectAttempts++;

    // 指数退避延迟
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`${delay/1000}秒后进行第${this.reconnectAttempts}次重连...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // 重新获取服务器地址（可能已变更）
      await this.connect(this.socket?.io.uri || '');
    } catch (error) {
      console.error('重连失败:', error);
      // 会触发disconnect事件，进入下一次重连尝试
    }
  }

  /**
   * 发送消息
   */
  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket未连接，消息无法发送');
    }
  }

  /**
   * 监听事件
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 主动断开连接
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const heartbeatSocket = new HeartbeatSocket();
```

### 9.4 服务端心跳检测

```typescript
// 服务端心跳检测实现
@WebSocketGateway()
export class HeartbeatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // 客户端最后活跃时间映射
  private clientLastActivity: Map<string, number> = new Map();

  // 心跳配置
  private readonly HEARTBEAT_INTERVAL = 30000;  // 30秒检查一次
  private readonly CLIENT_TIMEOUT = 60000;       // 60秒无活动视为超时

  // 定时器
  private cleanupTimer: NodeJS.Timeout | null = null;

  afterInit() {
    // 启动定时清理
    this.cleanupTimer = setInterval(() => {
      this.checkClientActivity();
    }, this.HEARTBEAT_INTERVAL);
  }

  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);

    // 记录连接时间
    this.clientLastActivity.set(client.id, Date.now());

    // 发送欢迎消息（包含心跳说明）
    client.emit('welcome', {
      message: '连接成功，心跳间隔30秒',
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`客户端断开: ${client.id}`);

    // 清理记录
    this.clientLastActivity.delete(client.id);
  }

  /**
   * 处理客户端心跳
   */
  @SubscribeMessage('pong')
  handlePong(@ConnectedSocket() client: Socket) {
    // 更新最后活跃时间
    this.clientLastActivity.set(client.id, Date.now());
    console.log(`收到客户端 ${client.id} 的心跳响应`);
  }

  /**
   * 处理任何客户端消息（都视为活跃）
   */
  @SubscribeMessage('any')
  handleAnyMessage(@ConnectedSocket() client: Socket) {
    this.clientLastActivity.set(client.id, Date.now());
  }

  /**
   * 检查客户端活跃状态
   */
  private checkClientActivity(): void {
    const now = Date.now();
    const timeoutClients: string[] = [];

    this.clientLastActivity.forEach((lastActivity, clientId) => {
      if (now - lastActivity > this.CLIENT_TIMEOUT) {
        timeoutClients.push(clientId);
      }
    });

    // 断开超时的客户端
    timeoutClients.forEach(clientId => {
      console.log(`客户端 ${clientId} 超时断开`);
      // 通过server获取socket并断开
      const socket = this.server.sockets.sockets.get(clientId);
      if (socket) {
        socket.disconnect();
      }
      this.clientLastActivity.delete(clientId);
    });
  }
}
```

### 9.5 断线重连的最佳实践

```typescript
/**
 * 完整的重连策略配置
 */
const reconnectConfig = {
  // 基础重连配置
  attempts: {
    maxAttempts: 10,           // 最大重试次数
    initialDelay: 1000,        // 初始延迟（毫秒）
    maxDelay: 30000,           // 最大延迟（毫秒）
    growthFactor: 2,            // 延迟增长因子
  },

  // 心跳配置
  heartbeat: {
    interval: 25000,           // 心跳间隔
    timeout: 20000,            // 心跳超时
  },

  // 离线处理
  offline: {
    enableQueue: true,         // 离线时是否队列消息
    maxQueueSize: 100,         // 队列最大消息数
    persistQueue: true,        // 是否持久化队列
  },

  // 状态恢复
  recovery: {
    enabled: true,             // 是否启用状态恢复
    restoreSession: true,      // 是否恢复会话
    restoreHistory: false,     // 是否恢复消息历史
  }
};

/**
 * 使用指数退避计算重连延迟
 */
function calculateReconnectDelay(attempt: number, config: typeof reconnectConfig): number {
  const { initialDelay, maxDelay, growthFactor } = config.attempts;

  // 指数退避：1秒、2秒、4秒、8秒...
  const delay = Math.min(initialDelay * Math.pow(growthFactor, attempt - 1), maxDelay);

  // 添加随机抖动（±25%），避免大量客户端同时重连
  const jitter = delay * 0.25 * (Math.random() - 0.5);

  return Math.round(delay + jitter);
}

// 示例：计算前5次重连的延迟
for (let i = 1; i <= 5; i++) {
  const delay = calculateReconnectDelay(i, reconnectConfig);
  console.log(`第${i}次重连，延迟: ${delay}ms`);
}

// 输出：
// 第1次重连，延迟: 1000ms
// 第2次重连，延迟: 2000ms
// 第3次重连，延迟: 4000ms
// 第4次重连，延迟: 8000ms
// 第5次重连，延迟: 16000ms
```

---

## 10. 实战：在线客服聊天系统

### 10.1 系统架构

```
在线客服聊天系统架构

┌─────────────────────────────────────────────────────────────────┐
│                         客户端                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  访客界面   │  │  客服界面   │  │  管理员界面  │              │
│  │  (前端)    │  │  (前端)    │  │  (前端)     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                        │
│                    Socket.io 连接                                │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS 服务端                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   CustomerServiceGateway                     │ │
│  │                   (WebSocket网关)                            │ │
│  │  • 处理连接/断开    • 消息路由    • 房间管理    • 心跳检测    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│  │ Redis       │      │ PostgreSQL  │      │ 消息队列    │       │
│  │ 会话缓存    │      │ 消息存储    │      │ (可选)      │       │
│  └─────────────┘      └─────────────┘      └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 数据库模型

```typescript
// customer-support.entity.ts - 客服系统数据模型

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 会话类型：visitor-访客 | customer-客服
  @Column({ type: 'enum', enum: ['visitor', 'customer'] })
  type: 'visitor' | 'customer';

  // 访客信息
  @Column({ nullable: true })
  visitorId: string;           // 访客ID（可匿名）

  @Column({ nullable: true })
  visitorName: string;         // 访客名称

  @Column({ nullable: true })
  visitorEmail: string;        // 访客邮箱

  // 分配的客服
  @Column({ nullable: true })
  assignedAgentId: string;     // 分配的客服ID

  // 会话状态
  @Column({ type: 'enum', enum: ['waiting', 'active', 'closed'], default: 'waiting' })
  status: 'waiting' | 'active' | 'closed';

  // 会话优先级
  @Column({ type: 'enum', enum: ['low', 'normal', 'high'], default: 'normal' })
  priority: 'low' | 'normal' | 'high';

  // 关联消息
  @Column('json', { nullable: true })
  metadata: any;               // 附加信息（来源页面等）

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 所属会话
  @Column()
  conversationId: string;

  // 发送者类型
  @Column({ type: 'enum', enum: ['visitor', 'agent', 'system'] })
  senderType: 'visitor' | 'agent' | 'system';

  // 发送者ID
  @Column()
  senderId: string;

  // 消息内容
  @Column('text')
  content: string;

  // 消息类型
  @Column({ type: 'enum', enum: ['text', 'image', 'file', 'system'], default: 'text' })
  messageType: 'text' | 'image' | 'file' | 'system';

  // 是否已读
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  // 客服状态：online-在线 | busy-忙碌 | offline-离线
  @Column({ type: 'enum', enum: ['online', 'busy', 'offline'], default: 'offline' })
  status: 'online' | 'busy' | 'offline';

  // 当前接待会话数
  @Column({ default: 0 })
  currentChats: number;

  // 最大接待数
  @Column({ default: 5 })
  maxChats: number;

  @Column({ nullable: true })
  specialties: string;         // 专长领域（JSON字符串）
}
```

### 10.3 WebSocket网关实现

```typescript
// customer-service.gateway.ts - 客服系统WebSocket网关

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface VisitorInfo {
  id: string;
  name: string;
  email?: string;
  conversationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',  // 生产环境应配置具体域名
    methods: ['GET', 'POST'],
  },
  namespace: '/customer-service',  // 独立的命名空间
})
@Injectable()
export class CustomerServiceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // 访客信息映射
  private visitors: Map<string, VisitorInfo> = new Map();

  // 在线客服列表
  private onlineAgents: Map<string, { id: string; name: string; status: string }> = new Map();

  // 会话映射：conversationId -> socketIds
  private conversationSockets: Map<string, Set<string>> = new Map();

  // Redis客户端
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  /**
   * 客户端连接
   */
  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);
  }

  /**
   * 客户端断开
   */
  async handleDisconnect(client: Socket) {
    const visitor = this.visitors.get(client.id);

    if (visitor) {
      // 如果有进行中的会话，通知客服
      if (visitor.conversationId) {
        await this.handleVisitorLeave(visitor);
      }

      this.visitors.delete(client.id);
    }

    // 如果是客服断开
    this.onlineAgents.forEach((agent, id) => {
      if (agent.id === client.id) {
        this.onlineAgents.delete(id);
        // 广播客服下线
        this.server.emit('agent:offline', { agentId: id });
      }
    });

    console.log(`客户端断开: ${client.id}`);
  }

  /**
   * 访客发起会话
   */
  @SubscribeMessage('visitor:start')
  async handleVisitorStart(
    @MessageBody() data: { name: string; email?: string; message?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 创建访客信息
    const visitorId = `visitor_${Date.now()}`;
    const visitor: VisitorInfo = {
      id: visitorId,
      name: data.name,
      email: data.email,
    };

    this.visitors.set(client.id, visitor);

    // 查找可用的客服
    const availableAgent = await this.findAvailableAgent();

    if (availableAgent) {
      // 创建会话
      const conversationId = await this.createConversation(visitor, availableAgent);
      visitor.conversationId = conversationId;

      // 将访客加入会话房间
      client.join(`conversation:${conversationId}`);

      // 将客服加入会话房间
      const agentSocket = this.findSocketByAgentId(availableAgent.id);
      if (agentSocket) {
        agentSocket.join(`conversation:${conversationId}`);
      }

      // 映射会话到socket
      this.conversationSockets.set(conversationId, new Set([client.id, agentSocket?.id].filter(Boolean)));

      // 通知访客会话已开始
      client.emit('conversation:started', {
        conversationId,
        agentId: availableAgent.id,
        agentName: availableAgent.name,
        message: `已为您分配客服 ${availableAgent.name}，请稍候...`,
      });

      // 通知客服有新访客
      this.server.to(`agent:${availableAgent.id}`).emit('visitor:new', {
        conversationId,
        visitor: visitor,
        initialMessage: data.message,
      });

    } else {
      // 没有可用客服，加入排队
      client.emit('conversation:waiting', {
        position: await this.getQueuePosition(),
        message: '当前无客服在线，请排队等待...',
      });

      // 广播给所有在线客服有新访客排队
      this.broadcastToAgents('queue:update', {
        waitingCount: await this.getWaitingCount(),
      });
    }
  }

  /**
   * 客服上线
   */
  @SubscribeMessage('agent:login')
  async handleAgentLogin(
    @MessageBody() data: { agentId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 记录客服信息
    const agentInfo = {
      id: data.agentId,
      name: data.name,
      status: 'online',
      socketId: client.id,
    };

    this.onlineAgents.set(data.agentId, agentInfo);

    // 加入客服专属房间（用于接收指定消息）
    client.join(`agent:${data.agentId}`);

    // 检查是否有排队访客
    const waitingVisitor = await this.getFirstWaitingVisitor();

    if (waitingVisitor) {
      // 自动分配给刚上线的客服
      client.emit('visitor:auto-assign', {
        visitor: waitingVisitor,
        message: '系统自动为您分配了一个排队访客',
      });
    }

    // 广播客服上线
    this.server.emit('agent:online', {
      agentId: data.agentId,
      agentName: data.name,
    });

    console.log(`客服 ${data.name} 上线`);
  }

  /**
   * 发送消息
   */
  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { conversationId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const visitor = this.visitors.get(client.id);
    const senderType = visitor ? 'visitor' : 'agent';
    const senderId = visitor?.id || this.findAgentIdBySocketId(client.id);

    // 保存消息到数据库
    const message = await this.saveMessage({
      conversationId: data.conversationId,
      senderType,
      senderId,
      content: data.content,
      messageType: data.type || 'text',
    });

    // 广播消息给会话中的所有人
    this.server.to(`conversation:${data.conversationId}`).emit('message:received', message);

    // 如果是客服发送，更新会话最后活跃时间
    if (senderType === 'agent') {
      await this.redis.setex(`conversation:${data.conversationId}:lastActivity`, 3600, Date.now().toString());
    }
  }

  /**
   * 访客结束会话
   */
  @SubscribeMessage('conversation:end')
  async handleConversationEnd(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.closeConversation(data.conversationId);

    // 广播会话结束
    this.server.to(`conversation:${data.conversationId}`).emit('conversation:ended', {
      conversationId: data.conversationId,
      reason: 'visitor_left',
    });

    // 清理会话映射
    this.conversationSockets.delete(data.conversationId);
  }

  /**
   * 获取在线客服列表
   */
  @SubscribeMessage('agents:list')
  handleGetAgents(@ConnectedSocket() client: Socket) {
    const agents = Array.from(this.onlineAgents.values());
    client.emit('agents:list', agents);
  }

  /**
   * 查找可用的客服
   */
  private async findAvailableAgent(): Promise<{ id: string; name: string } | null> {
    for (const agent of this.onlineAgents.values()) {
      if (agent.status === 'online') {
        return { id: agent.id, name: agent.name };
      }
    }
    return null;
  }

  /**
   * 根据客服ID找到其socket
   */
  private findSocketByAgentId(agentId: string): Socket | undefined {
    // 遍历所有socket找到对应的
    const sockets = this.server.sockets.sockets;
    for (const [id, socket] of sockets) {
      if (socket.handshake.auth.agentId === agentId) {
        return socket;
      }
    }
    return undefined;
  }

  /**
   * 根据socketId找到客服ID
   */
  private findAgentIdBySocketId(socketId: string): string | null {
    for (const [agentId, agent] of this.onlineAgents) {
      if (agent.socketId === socketId) {
        return agentId;
      }
    }
    return null;
  }

  /**
   * 创建会话
   */
  private async createConversation(visitor: VisitorInfo, agent: any): Promise<string> {
    const conversationId = `conv_${Date.now()}`;

    // 存储到Redis（生产环境应存数据库）
    await this.redis.hset(`conversation:${conversationId}`, {
      visitorId: visitor.id,
      visitorName: visitor.name,
      agentId: agent.id,
      agentName: agent.name,
      status: 'active',
      createdAt: Date.now().toString(),
    });

    return conversationId;
  }

  /**
   * 保存消息
   */
  private async saveMessage(data: any): Promise<any> {
    const message = {
      id: `msg_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    // 存储到Redis列表
    await this.redis.lpush(`messages:${data.conversationId}`, JSON.stringify(message));

    return message;
  }

  /**
   * 关闭会话
   */
  private async closeConversation(conversationId: string): Promise<void> {
    await this.redis.hset(`conversation:${conversationId}`, 'status', 'closed');
    await this.redis.hset(`conversation:${conversationId}`, 'closedAt', Date.now().toString());
  }

  /**
   * 访客离开处理
   */
  private async handleVisitorLeave(visitor: VisitorInfo): Promise<void> {
    if (visitor.conversationId) {
      // 通知客服访客离开了
      this.server.to(`conversation:${visitor.conversationId}`).emit('visitor:left', {
        conversationId: visitor.conversationId,
        visitorId: visitor.id,
      });

      // 关闭会话
      await this.closeConversation(visitor.conversationId);
    }
  }

  /**
   * 获取排队位置
   */
  private async getQueuePosition(): Promise<number> {
    return 1; // 简化实现
  }

  /**
   * 获取等待中的访客数
   */
  private async getWaitingCount(): Promise<number> {
    return 0; // 简化实现
  }

  /**
   * 获取第一个排队的访客
   */
  private async getFirstWaitingVisitor(): Promise<VisitorInfo | null> {
    return null; // 简化实现
  }

  /**
   * 广播给所有客服
   */
  private broadcastToAgents(event: string, data: any): void {
    this.onlineAgents.forEach((agent) => {
      this.server.to(`agent:${agent.id}`).emit(event, data);
    });
  }
}
```

### 10.4 客户端实现

```typescript
// customer-chat.tsx - 客服聊天界面组件
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'visitor' | 'agent' | 'system';
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  agentId?: string;
  agentName?: string;
  status: 'waiting' | 'active' | 'closed';
}

export default function CustomerChat() {
  // 连接状态
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 访客信息
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');

  // 会话状态
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  // 消息列表底部引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 连接服务器
   */
  const connect = () => {
    const newSocket = io('http://localhost:3000/customer-service', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // 连接成功
    newSocket.on('connect', () => {
      console.log('连接成功');
      setIsConnected(true);
    });

    // 连接断开
    newSocket.on('disconnect', () => {
      console.log('连接断开');
      setIsConnected(false);
    });

    // 会话已开始（已分配客服）
    newSocket.on('conversation:started', (data: any) => {
      setConversation({
        conversationId: data.conversationId,
        agentId: data.agentId,
        agentName: data.agentName,
        status: 'active',
      });
      addSystemMessage(data.message);
    });

    // 等待客服中
    newSocket.on('conversation:waiting', (data: any) => {
      setConversation({
        conversationId: '',
        status: 'waiting',
      });
      addSystemMessage(data.message);
    });

    // 收到消息
    newSocket.on('message:received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // 会话结束
    newSocket.on('conversation:ended', (data: any) => {
      setConversation(prev => prev ? { ...prev, status: 'closed' } : null);
      addSystemMessage('会话已结束，感谢您的咨询！');
    });

    // 客服有新消息（自动分配）
    newSocket.on('visitor:new', (data: any) => {
      console.log('有新访客:', data);
    });

    setSocket(newSocket);
  };

  /**
   * 添加系统消息
   */
  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `sys_${Date.now()}`,
      senderType: 'system',
      senderId: 'system',
      senderName: '系统',
      content,
      messageType: 'system',
      createdAt: new Date().toISOString(),
    }]);
  };

  /**
   * 开始咨询
   */
  const startChat = () => {
    if (!socket || !visitorName.trim()) return;

    socket.emit('visitor:start', {
      name: visitorName,
      email: visitorEmail,
    });
  };

  /**
   * 发送消息
   */
  const sendMessage = () => {
    if (!socket || !inputValue.trim() || !conversation?.conversationId) return;

    socket.emit('message:send', {
      conversationId: conversation.conversationId,
      content: inputValue,
      type: 'text',
    });

    // 添加自己的消息到列表
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      senderType: 'visitor',
      senderId: 'visitor',
      senderName: visitorName,
      content: inputValue,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    }]);

    setInputValue('');
  };

  /**
   * 结束会话
   */
  const endChat = () => {
    if (!socket || !conversation?.conversationId) return;

    socket.emit('conversation:end', {
      conversationId: conversation.conversationId,
    });
  };

  /**
   * 按Enter发送
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 组件挂载时连接
  useEffect(() => {
    connect();

    return () => {
      socket?.disconnect();
    };
  }, []);

  // 渲染：未连接状态
  if (!isConnected) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">正在连接客服系统...</p>
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          重新连接
        </button>
      </div>
    );
  }

  // 渲染：未开始会话
  if (!conversation) {
    return (
      <div className="max-w-md mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">在线客服</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">您的姓名 *</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="请输入您的姓名"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">邮箱（选填）</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="用于接收后续服务通知"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
            />
          </div>

          <button
            onClick={startChat}
            disabled={!visitorName.trim()}
            className="w-full py-3 bg-blue-500 text-white rounded font-medium disabled:bg-gray-300"
          >
            开始咨询
          </button>
        </div>
      </div>
    );
  }

  // 渲染：等待中
  if (conversation.status === 'waiting') {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">⏳</span>
          </div>
        </div>
        <h2 className="text-xl font-medium mb-2">正在为您分配客服</h2>
        <p className="text-gray-500">当前排队人数较多，请稍候...</p>
      </div>
    );
  }

  // 渲染：会话已结束
  if (conversation.status === 'closed') {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-medium mb-2">会话已结束</h2>
        <p className="text-gray-500 mb-6">感谢您的咨询，欢迎下次光临！</p>
        <button
          onClick={() => {
            setConversation(null);
            setMessages([]);
          }}
          className="px-6 py-2 bg-blue-500 text-white rounded"
        >
          发起新会话
        </button>
      </div>
    );
  }

  // 渲染：进行中的会话
  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* 头部 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-medium">客服：{conversation.agentName}</h2>
          <p className="text-sm text-green-500">在线</p>
        </div>
        <button
          onClick={endChat}
          className="text-sm text-red-500 hover:underline"
        >
          结束会话
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div key={message.id}>
            {/* 系统消息 */}
            {message.senderType === 'system' && (
              <div className="text-center text-sm text-gray-500 py-2">
                {message.content}
              </div>
            )}

            {/* 访客消息 */}
            {message.senderType === 'visitor' && (
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs">
                  <p>{message.content}</p>
                  <p className="text-xs text-blue-100 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* 客服消息 */}
            {message.senderType === 'agent' && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm text-gray-500">{conversation.agentName}</p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="输入消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:bg-gray-300"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 附录：常用Socket.io配置选项

```typescript
// 客户端配置
const socketOptions = {
  // 连接地址
  url: 'http://localhost:3000',

  // 传输方式（默认所有方式都尝试）
  transports: ['websocket', 'polling'],

  // 自动重连
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  // 超时设置
  timeout: 20000,

  // 心跳设置
  pingInterval: 25000,
  pingTimeout: 20000,

  // 认证信息
  auth: {
    token: 'your-token',
  },

  // 查询参数
  query: {
    userId: 'user-123',
  },

  // 命名空间
  namespace: '/chat',

  // 是否自动连接
  autoConnect: true,

  // 离线时是否缓存事件
  offineQueue: true,
};

// 服务器配置
const serverOptions = {
  // CORS配置
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },

  // 命名空间路径
  namespace: '/',

  // 单个数据包最大大小
  maxHttpBufferSize: 1e6,  // 1MB

  // 连接超时
  connectTimeout: 45000,

  // 关闭超时
  serveClient: false,
};
```

---

## 总结

本文详细介绍了实时通信与WebSocket的核心概念，并结合FastDocument项目中的实际代码进行了讲解。主要内容包括：

1. **实时通信基础**：解释了什么叫实时通信，以及为什么HTTP不适合实时场景

2. **WebSocket协议**：介绍了WebSocket的工作原理、握手过程，以及与HTTP的区别

3. **Socket.io框架**：详细讲解了Socket.io相比原生WebSocket的优势，以及事件、房间、命名空间等核心概念

4. **即时聊天功能**：展示了如何实现消息发送、接收、历史记录等核心功能

5. **在线状态管理**：介绍了如何追踪和管理用户的在线状态

6. **消息推送系统**：讲解了系统通知、个性化推送等功能的实现

7. **房间隔离机制**：说明了如何通过房间实现消息的逻辑隔离

8. **心跳检测与断线重连**：介绍了保持连接健康的技术，以及断线重连的最佳实践

9. **实战项目**：通过一个完整的在线客服聊天系统，将所有知识点串联起来

实时通信是现代Web应用的核心技术之一，掌握这些知识能够帮助你构建更好的用户体验。
