# 实时通信与WebSocket完全指南

## 目录

1. [实时通信基础](#1-实时通信基础)
2. [WebSocket协议深度解析](#2-websocket协议深度解析)
3. [Socket.io实战](#3-socketio实战)
4. [实时协作技术](#4-实时协作技术)
5. [WebRTC音视频通信](#5-webrtc音视频通信)
6. [实时通信最佳实践](#6-实时通信最佳实践)

---

## 1. 实时通信基础

### 1.1 实时通信方案对比

```
实时通信技术演进

传统HTTP轮询（Polling）
└── 定时发送HTTP请求

长轮询（Long Polling）
└── 请求挂起，等待数据

Server-Sent Events（SSE）
└── 服务器单向推送

WebSocket
└── 全双工通信

WebRTC
└── 浏览器端点对点通信
```

| 方案 | 通信方式 | 延迟 | 带宽消耗 | 复杂度 | 适用场景 |
|------|----------|------|----------|--------|----------|
| **HTTP轮询** | 单向 | 高 | 高 | 低 | 简单通知 |
| **长轮询** | 单向 | 中 | 中 | 中 | 即时通讯 |
| **SSE** | 单向 | 低 | 低 | 中 | 服务器推送 |
| **WebSocket** | 双向 | 极低 | 低 | 中 | 即时通讯、游戏 |
| **WebRTC** | P2P | 极低 | 低 | 高 | 音视频通话 |

### 1.2 WebSocket握手过程

```
WebSocket握手流程

客户端                                    服务器
  │                                         │
  │ GET /chat HTTP/1.1                      │
  │ Upgrade: websocket                      │
  │ Connection: Upgrade                     │
  │ Sec-WebSocket-Key: dGhlIHNhbXBsZQ==    │
  │ Sec-WebSocket-Version: 13               │
  │────────────────────────────────────────>│
  │                                         │
  │ HTTP/1.1 101 Switching Protocols        │
  │ Upgrade: websocket                      │
  │ Connection: Upgrade                     │
  │ Sec-WebSocket-Accept: s3pPLMBi...      │
  │<────────────────────────────────────────│
  │                                         │
  │ WebSocket连接建立                        │
  │<───────────────────────────────────────>│
  │                                         │
```

---

## 2. WebSocket协议深度解析

### 2.1 WebSocket帧结构

```
WebSocket数据帧格式

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+

字段说明：
- FIN: 1位，表示是否为最后一帧
- RSV1-3: 3位，保留位
- Opcode: 4位，操作码
  - 0x0: 连续帧
  - 0x1: 文本帧
  - 0x2: 二进制帧
  - 0x8: 关闭帧
  - 0x9: Ping帧
  - 0xA: Pong帧
- MASK: 1位，是否使用掩码
- Payload length: 7位，负载长度
- Masking-key: 32位，掩码密钥
- Payload Data: 负载数据
```

### 2.2 Node.js WebSocket服务器

```javascript
// 1. 原生WebSocket服务器
// server.js
const WebSocket = require('ws');
const http = require('http');

// 创建HTTP服务器
const server = http.createServer();

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 连接处理
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;

  console.log(`客户端连接: ${ip}`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '连接成功',
  }));

  // 接收消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('收到消息:', message);

      // 处理不同类型的消息
      switch (message.type) {
        case 'chat':
          // 广播聊天消息
          broadcast(message);
          break;
        case 'ping':
          // 响应Ping
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('消息解析错误:', error);
    }
  });

  // 关闭连接
  ws.on('close', () => {
    console.log('客户端断开连接');
  });

  // 错误处理
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
});

// 广播消息
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 心跳检测
const heartbeat = () => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
};

// 每30秒检测一次
const interval = setInterval(heartbeat, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// 启动服务器
server.listen(8080, () => {
  console.log('WebSocket服务器启动在端口8080');
});

// 2. WebSocket路由
// router.js
class WebSocketRouter {
  constructor() {
    this.routes = new Map();
  }

  // 注册路由
  on(path, handler) {
    this.routes.set(path, handler);
  }

  // 处理连接
  handle(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    const handler = this.routes.get(path);

    if (handler) {
      handler(ws, req, url.searchParams);
    } else {
      ws.send(JSON.stringify({
        error: '路由不存在',
      }));
      ws.close();
    }
  }
}

const router = new WebSocketRouter();

// 注册路由
router.on('/chat', (ws, req, params) => {
  const roomId = params.get('room');

  ws.on('message', (data) => {
    // 处理聊天消息
  });
});

router.on('/notification', (ws, req, params) => {
  ws.on('message', (data) => {
    // 处理通知消息
  });
});

// 使用路由
wss.on('connection', (ws, req) => {
  router.handle(ws, req);
});

// 3. WebSocket中间件
// middleware.js
class WebSocketMiddleware {
  constructor() {
    this.middlewares = [];
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // 执行中间件
  async execute(ws, req, next) {
    const stack = [...this.middlewares, next];

    let index = 0;

    const dispatch = async () => {
      if (index >= stack.length) return;

      const middleware = stack[index++];

      try {
        await middleware(ws, req, dispatch);
      } catch (error) {
        console.error('中间件错误:', error);
        ws.send(JSON.stringify({ error: error.message }));
        ws.close();
      }
    };

    dispatch();
  }
}

const middleware = new WebSocketMiddleware();

// 认证中间件
middleware.use(async (ws, req, next) => {
  const token = req.headers['sec-websocket-protocol'];

  if (!token) {
    throw new Error('未提供认证令牌');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    await next();
  } catch (error) {
    throw new Error('无效的令牌');
  }
});

// 日志中间件
middleware.use(async (ws, req, next) => {
  console.log(`[${new Date().toISOString()}] ${req.socket.remoteAddress} 连接`);
  await next();
});

// 使用中间件
wss.on('connection', (ws, req) => {
  middleware.execute(ws, req, () => {
    // 处理连接
  });
});
```

---

## 3. Socket.io实战

### 3.1 Socket.io基础配置

```javascript
// 1. 服务器配置
// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  // CORS配置
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },

  // 传输方式
  transports: ['websocket', 'polling'],

  // 心跳配置
  pingInterval: 10000,  // 10秒
  pingTimeout: 5000,  // 5秒
});

// 中间件：认证
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('未认证'));
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
});

// 连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.userId}`);

  // 加入房间
  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    // 通知房间内其他用户
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      timestamp: Date.now(),
    });

    console.log(`用户 ${socket.userId} 加入房间 ${roomId}`);
  });

  // 离开房间
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);

    // 通知房间内其他用户
    socket.to(roomId).emit('user-left', {
      userId: socket.userId,
      timestamp: Date.now(),
    });

    console.log(`用户 ${socket.userId} 离开房间 ${roomId}`);
  });

  // 聊天消息
  socket.on('chat-message', (data) => {
    // 广播到房间
    io.to(data.roomId).emit('chat-message', {
      userId: socket.userId,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`用户断开连接: ${socket.userId}, 原因: ${reason}`);
  });
});

// 命名空间
const chatNamespace = io.of('/chat');

chatNamespace.on('connection', (socket) => {
  console.log('连接到/chat命名空间');

  socket.on('message', (data) => {
    chatNamespace.emit('message', data);
  });
});

// 启动服务器
httpServer.listen(3000, () => {
  console.log('Socket.io服务器启动在端口3000');
});

// 2. 客户端配置
// client.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  // 认证
  auth: {
    token: localStorage.getItem('token'),
  },

  // 传输方式
  transports: ['websocket', 'polling'],

  // 重连配置
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// 连接事件
socket.on('connect', () => {
  console.log('连接成功');
});

// 连接错误
socket.on('connect_error', (error) => {
  console.error('连接错误:', error);
});

// 断开连接
socket.on('disconnect', (reason) => {
  console.log('断开连接:', reason);

  if (reason === 'io server disconnect') {
    // 服务器主动断开，需要手动重连
    socket.connect();
  }
});

// 重连尝试
socket.on('reconnect_attempt', (attempt) => {
  console.log(`重连尝试 ${attempt}`);
});

// 重连成功
socket.on('reconnect', (attempt) => {
  console.log(`重连成功，尝试次数: ${attempt}`);
});

// 加入房间
function joinRoom(roomId) {
  socket.emit('join-room', roomId);
}

// 发送消息
function sendMessage(roomId, message) {
  socket.emit('chat-message', {
    roomId,
    message,
  });
}

// 监听消息
socket.on('chat-message', (data) => {
  console.log('收到消息:', data);
});

// 用户加入
socket.on('user-joined', (data) => {
  console.log('用户加入:', data);
});

// 用户离开
socket.on('user-left', (data) => {
  console.log('用户离开:', data);
});
```

### 3.2 Socket.io高级特性

```javascript
// 1. 房间管理
// 广播到特定房间
io.to('room1').emit('message', 'Hello Room1');

// 广播到多个房间
io.to('room1').to('room2').emit('message', 'Hello Rooms');

// 广播到所有房间（除了发送者）
socket.broadcast.emit('message', 'Hello Everyone');

// 广播到特定房间（除了发送者）
socket.to('room1').emit('message', 'Hello Room1');

// 获取房间内的所有Socket
const sockets = await io.in('room1').fetchSockets();

// 获取Socket加入的所有房间
const rooms = socket.rooms;

// 2. 消息确认
// 客户端
socket.emit('message', data, (response) => {
  console.log('服务器确认:', response);
});

// 服务器
socket.on('message', (data, callback) => {
  console.log('收到消息:', data);

  // 发送确认
  callback({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// 3. 二进制数据
// 客户端
const buffer = new ArrayBuffer(10);
socket.emit('binary', buffer);

// 服务器
socket.on('binary', (buffer) => {
  console.log('收到二进制数据:', buffer);
});

// 4. 消息压缩
const io = new Server(httpServer, {
  httpCompression: true,
  wsEngine: require('eiows').Server,
});

// 5. 流式传输
// 服务器
const { PassThrough } = require('stream');

socket.on('stream', (callback) => {
  const stream = new PassThrough();

  callback(stream);

  stream.on('data', (chunk) => {
    console.log('收到流数据:', chunk);
  });

  stream.on('end', () => {
    console.log('流结束');
  });
});

// 客户端
socket.emit('stream', (stream) => {
  stream.write('数据块1');
  stream.write('数据块2');
  stream.end();
});

// 6. 集群模式
// 使用Redis适配器
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// 7. 状态同步
// 在线用户管理
const users = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;

  // 添加到在线用户
  users.set(userId, {
    socketId: socket.id,
    joinedAt: Date.now(),
  });

  // 广播在线用户列表
  io.emit('online-users', Array.from(users.keys()));

  socket.on('disconnect', () => {
    users.delete(userId);
    io.emit('online-users', Array.from(users.keys()));
  });
});

// 8. 消息队列
const { Queue } = require('bull');

const messageQueue = new Queue('messages');

// 处理消息队列
messageQueue.process(async (job) => {
  const { roomId, message } = job.data;

  io.to(roomId).emit('message', message);
});

// 添加消息到队列
socket.on('message', async (data) => {
  await messageQueue.add({
    roomId: data.roomId,
    message: data.message,
  });
});
```

---

## 4. 实时协作技术

### 4.1 CRDT基础

```javascript
// 1. CRDT（无冲突复制数据类型）
// LWW-Register（最后写入胜出寄存器）
class LWWRegister {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.value = null;
    this.timestamp = 0;
  }

  // 设置值
  set(value) {
    this.value = value;
    this.timestamp = Date.now();
  }

  // 获取值
  get() {
    return this.value;
  }

  // 合并
  merge(other) {
    if (other.timestamp > this.timestamp) {
      this.value = other.value;
      this.timestamp = other.timestamp;
    }
  }
}

// 2. Yjs集成
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 创建文档
const doc = new Y.Doc();

// 连接WebSocket
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-room',
  doc
);

// 创建共享文本
const ytext = doc.getText('content');

// 监听变化
ytext.observe((event) => {
  console.log('文本变化:', ytext.toString());
});

// 插入文本
ytext.insert(0, 'Hello');

// 删除文本
ytext.delete(0, 5);

// 获取文本
const text = ytext.toString();

// 3. Y.js共享状态
// 共享Map
const ymap = doc.getMap('state');

ymap.set('name', '张三');
ymap.set('age', 25);

ymap.observe((event) => {
  console.log('Map变化:', ymap.toJSON());
});

// 共享数组
const yarray = doc.getArray('items');

yarray.push(['item1', 'item2']);

yarray.observe((event) => {
  console.log('数组变化:', yarray.toArray());
});

// 4. Y.js与编辑器集成
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';

const editor = monaco.editor.create(
  document.getElementById('editor'),
  {
    value: '',
    language: 'javascript',
  }
);

const binding = new MonacoBinding(
  ytext,
  editor.getModel(),
  new Set([editor])
);
```

### 4.2 实时协作应用

```javascript
// 1. 协作文档编辑器
// server.js
const Y = require('yjs');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, {
    // 文档持久化
    persistence: {
      bindState: async (docName, ydoc) => {
        // 从数据库加载文档
        const savedDoc = await loadDocument(docName);
        if (savedDoc) {
          Y.applyUpdate(ydoc, savedDoc);
        }
      },
      writeState: async (docName, ydoc) => {
        // 保存文档到数据库
        const update = Y.encodeStateAsUpdate(ydoc);
        await saveDocument(docName, update);
      },
    },
  });
});

// 2. 协作白板
// shared/whiteboard.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

class CollaborativeWhiteboard {
  constructor(roomId) {
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      this.doc
    );

    // 共享画布数据
    this.strokes = this.doc.getArray('strokes');

    // 监听变化
    this.strokes.observe((event) => {
      this.render();
    });
  }

  // 添加笔画
  addStroke(stroke) {
    this.strokes.push([stroke]);
  }

  // 撤销
  undo() {
    this.doc.transact(() => {
      if (this.strokes.length > 0) {
        this.strokes.delete(this.strokes.length - 1, 1);
      }
    });
  }

  // 清空画布
  clear() {
    this.doc.transact(() => {
      this.strokes.delete(0, this.strokes.length);
    });
  }

  // 渲染画布
  render() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.strokes.toArray().forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.stroke();
    });
  }
}

// 3. 实时光标位置
// client.js
const cursors = doc.getMap('cursors');

// 更新光标位置
function updateCursor(position) {
  cursors.set(userId, {
    userId,
    userName,
    position,
    color,
    timestamp: Date.now(),
  });
}

// 监听其他用户光标
cursors.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add' || change.action === 'update') {
      const cursor = cursors.get(key);
      renderCursor(cursor);
    } else if (change.action === 'delete') {
      removeCursor(key);
    }
  });
});
```

---

## 5. WebRTC音视频通信

### 5.1 WebRTC基础

```javascript
// 1. 获取媒体流
// 获取摄像头和麦克风
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
});

// 显示本地视频
const localVideo = document.getElementById('local-video');
localVideo.srcObject = stream;

// 获取屏幕共享
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: true,
});

// 2. 创建PeerConnection
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'username',
      credential: 'password',
    },
  ],
};

const peerConnection = new RTCPeerConnection(configuration);

// 添加本地流
stream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, stream);
});

// 接收远程流
peerConnection.ontrack = (event) => {
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = event.streams[0];
};

// ICE候选
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    // 发送ICE候选到信令服务器
    socket.emit('ice-candidate', event.candidate);
  }
};

// 连接状态变化
peerConnection.onconnectionstatechange = () => {
  console.log('连接状态:', peerConnection.connectionState);

  switch (peerConnection.connectionState) {
    case 'connected':
      console.log('连接成功');
      break;
    case 'disconnected':
      console.log('连接断开');
      break;
    case 'failed':
      console.log('连接失败');
      break;
  }
};

// 3. 信令交换
// 创建Offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// 发送Offer
socket.emit('offer', {
  targetUserId,
  offer: offer,
});

// 接收Offer
socket.on('offer', async (data) => {
  // 设置远程描述
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  // 创建Answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // 发送Answer
  socket.emit('answer', {
    targetUserId: data.fromUserId,
    answer: answer,
  });
});

// 接收Answer
socket.on('answer', async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
});

// 接收ICE候选
socket.on('ice-candidate', async (data) => {
  await peerConnection.addIceCandidate(
    new RTCIceCandidate(data.candidate)
  );
});

// 4. 视频通话应用
class VideoCall {
  constructor(socket) {
    this.socket = socket;
    this.peerConnection = null;
    this.localStream = null;

    this.setupSignaling();
  }

  setupSignaling() {
    this.socket.on('offer', (data) => this.handleOffer(data));
    this.socket.on('answer', (data) => this.handleAnswer(data));
    this.socket.on('ice-candidate', (data) => this.handleIceCandidate(data));
  }

  async startCall(targetUserId) {
    // 获取本地流
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // 显示本地视频
    this.showLocalVideo(this.localStream);

    // 创建PeerConnection
    this.peerConnection = this.createPeerConnection();

    // 添加本地流
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // 创建Offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // 发送Offer
    this.socket.emit('offer', {
      targetUserId,
      offer: offer,
    });
  }

  async handleOffer(data) {
    // 获取本地流
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    this.showLocalVideo(this.localStream);

    // 创建PeerConnection
    this.peerConnection = this.createPeerConnection();

    // 添加本地流
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // 设置远程描述
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );

    // 创建Answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // 发送Answer
    this.socket.emit('answer', {
      targetUserId: data.fromUserId,
      answer: answer,
    });
  }

  async handleAnswer(data) {
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  }

  async handleIceCandidate(data) {
    await this.peerConnection.addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  }

  createPeerConnection() {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      this.showRemoteVideo(event.streams[0]);
    };

    return pc;
  }

  showLocalVideo(stream) {
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = stream;
  }

  showRemoteVideo(stream) {
    const remoteVideo = document.getElementById('remote-video');
    remoteVideo.srcObject = stream;
  }

  endCall() {
    // 停止本地流
    this.localStream?.getTracks().forEach((track) => track.stop());

    // 关闭PeerConnection
    this.peerConnection?.close();

    this.localStream = null;
    this.peerConnection = null;
  }
}
```

---

## 6. 实时通信最佳实践

### 6.1 性能优化

```javascript
// 1. 消息压缩
const zlib = require('zlib');

// 压缩消息
function compressMessage(message) {
  const jsonString = JSON.stringify(message);
  return zlib.gzipSync(jsonString);
}

// 解压缩消息
function decompressMessage(compressed) {
  const jsonString = zlib.gunzipSync(compressed);
  return JSON.parse(jsonString.toString());
}

// 使用
socket.on('message', (compressed) => {
  const message = decompressMessage(compressed);
  console.log('收到消息:', message);
});

// 2. 消息批处理
class MessageBatcher {
  constructor(delay, callback) {
    this.delay = delay;
    this.callback = callback;
    this.messages = [];
    this.timeout = null;
  }

  add(message) {
    this.messages.push(message);

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.delay);
    }
  }

  flush() {
    if (this.messages.length > 0) {
      this.callback(this.messages);
      this.messages = [];
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

// 使用
const batcher = new MessageBatcher(100, (messages) => {
  socket.emit('batch-messages', messages);
});

batcher.add({ type: 'update', data: 1 });
batcher.add({ type: 'update', data: 2 });

// 3. 断线重连
class ReconnectingSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;

    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('连接成功');
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('连接关闭');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(`重连尝试 ${this.reconnectAttempts}`);
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket未连接');
    }
  }
}

// 4. 消息队列
class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  add(message) {
    this.queue.push(message);
    this.process();
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();
      await this.handleMessage(message);
    }

    this.isProcessing = false;
  }

  async handleMessage(message) {
    // 处理消息
    console.log('处理消息:', message);
  }
}

// 5. 负载均衡
// 使用Redis Pub/Sub
const redis = require('redis');
const publisher = redis.createClient();
const subscriber = redis.createClient();

// 发布消息
function broadcastToAll(message) {
  publisher.publish('broadcast', JSON.stringify(message));
}

// 订阅消息
subscriber.subscribe('broadcast');

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);

  // 发送给本服务器的所有客户端
  io.emit('message', data);
});
```

### 6.2 安全最佳实践

```javascript
// 1. 认证与授权
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('未认证'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRoles = decoded.roles;
    next();
  } catch (error) {
    next(new Error('无效的令牌'));
  }
});

// 权限检查
function checkPermission(socket, permission) {
  if (!socket.userRoles.includes(permission)) {
    throw new Error('无权限');
  }
}

// 2. 速率限制
const rateLimit = require('socketio-rate-limiter');

io.use(rateLimit({
  windowMs: 60000,  // 1分钟
  max: 100,  // 最多100个事件
}));

// 3. 输入验证
socket.on('message', (data) => {
  // 验证消息格式
  if (!data.roomId || !data.message) {
    return socket.emit('error', { message: '参数错误' });
  }

  // 验证消息长度
  if (data.message.length > 1000) {
    return socket.emit('error', { message: '消息过长' });
  }

  // 验证房间访问权限
  if (!hasAccessToRoom(socket.userId, data.roomId)) {
    return socket.emit('error', { message: '无权访问房间' });
  }

  // 处理消息
  io.to(data.roomId).emit('message', {
    userId: socket.userId,
    message: data.message,
    timestamp: Date.now(),
  });
});

// 4. 消息加密
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// 加密
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 解密
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 使用
socket.on('message', (encrypted) => {
  const message = decrypt(encrypted);
  console.log('收到加密消息:', message);
});
```

---

## 参考资源

- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Socket.io官方文档](https://socket.io/)
- [Y.js官方文档](https://docs.yjs.dev/)
- [WebRTC官方文档](https://webrtc.org/)

---

*本文档持续更新，最后更新于2026年3月*