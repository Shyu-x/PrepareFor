# WebSocket实时通信完全指南

## 目录

1. [WebSocket基础](#1-websocket基础)
2. [WebSocket API](#2-websocket-api)
3. [Socket.io实战](#3-socketio实战)
4. [实时应用架构](#4-实时应用架构)
5. [性能优化](#5-性能优化)
6. [面试高频问题](#6-面试高频问题)

---

## 1. WebSocket基础

### 1.1 WebSocket协议概述

```
┌─────────────────────────────────────────────────────────────┐
│                  WebSocket vs HTTP                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP:                                                      │
│  ┌───────┐  请求   ┌───────┐                               │
│  │客户端│ ───────► │服务器│  单向通信                       │
│  └───────┘  响应   └───────┘                               │
│            ◄───────                                        │
│                                                             │
│  WebSocket:                                                 │
│  ┌───────┐         ┌───────┐                               │
│  │客户端│ ◄──────► │服务器│  双向通信                       │
│  └───────┘         └───────┘                               │
│                                                             │
│  特点:                                                      │
│  1. 全双工通信 - 双向实时数据传输                          │
│  2. 低延迟 - 无需频繁建立连接                              │
│  3. 低开销 - 握手后无需HTTP头                              │
│  4. 持久连接 - 一次握手持续通信                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 WebSocket握手过程

```typescript
// WebSocket握手过程

/*
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket握手                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  客户端请求:                                                │
│  GET /chat HTTP/1.1                                         │
│  Host: example.com                                          │
│  Upgrade: websocket                                         │
│  Connection: Upgrade                                        │
│  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==               │
│  Sec-WebSocket-Version: 13                                  │
│  Origin: https://client.com                                │
│                                                             │
│  服务器响应:                                                │
│  HTTP/1.1 101 Switching Protocols                          │
│  Upgrade: websocket                                         │
│  Connection: Upgrade                                        │
│  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=        │
│                                                             │
│  Sec-WebSocket-Accept计算:                                  │
│  key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"              │
│  → SHA-1哈希 → Base64编码                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// Node.js原生WebSocket服务器
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, request) => {
  console.log('客户端已连接');

  // 接收消息
  ws.on('message', (data: Buffer) => {
    console.log('收到消息:', data.toString());

    // 回显消息
    ws.send(`服务器收到: ${data.toString()}`);
  });

  // 连接关闭
  ws.on('close', () => {
    console.log('客户端已断开');
  });

  // 错误处理
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });

  // 发送欢迎消息
  ws.send('欢迎连接WebSocket服务器');
});

server.listen(8080, () => {
  console.log('WebSocket服务器运行在 ws://localhost:8080');
});
```

### 1.3 WebSocket帧结构

```typescript
// WebSocket帧结构

/*
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket帧结构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  0                   1                   2                   │
│  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8  │
│  +-+-+-+-+-------+-+-------------+---------------------------+│
│  |F|R|R|R| opcode|M| Payload len |    Extended payload      ││
│  |I|S|S|S|  (4)  |A|     (7)     |        length            ││
│  |N|V|V|V|       |S|             |   (16/64 bits)           ││
│  | |1|2|3|       |K|             |                           ││
│  +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - +│
│  |     Extended payload length continued, if payload len == 127│
│  + - - - - - - - - - - - - - - - +---------------------------+│
│  |                               |Masking-key, if MASK set  ││
│  |                               |   (32 bits)               ││
│  +-------------------------------+---------------------------+│
│  | Masking-key (continued)       |          Payload Data     ││
│  +-------------------------------- - - - - - - - - - - - - - +│
│  :                     Payload Data continued ...            ││
│  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +│
│                                                             │
│  FIN: 是否为最后一帧                                        │
│  RSV1-3: 保留位                                             │
│  Opcode: 操作码                                             │
│    - 0x0: 继续帧                                            │
│    - 0x1: 文本帧                                            │
│    - 0x2: 二进制帧                                          │
│    - 0x8: 关闭帧                                            │
│    - 0x9: Ping帧                                            │
│    - 0xA: Pong帧                                            │
│  MASK: 是否掩码                                             │
│  Payload length: 负载长度                                   │
│  Masking-key: 掩码密钥                                      │
│  Payload Data: 负载数据                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/
```

---

## 2. WebSocket API

### 2.1 浏览器WebSocket API

```typescript
// 浏览器WebSocket API详解

// 基本使用
const ws = new WebSocket('wss://example.com/ws');

// 连接状态
console.log(ws.readyState);
// WebSocket.CONNECTING (0) - 连接中
// WebSocket.OPEN (1) - 已连接
// WebSocket.CLOSING (2) - 关闭中
// WebSocket.CLOSED (3) - 已关闭

// 事件监听
ws.onopen = (event) => {
  console.log('连接已建立');
  // 发送消息
  ws.send('Hello Server!');
};

ws.onmessage = (event) => {
  console.log('收到消息:', event.data);

  // 处理不同类型数据
  if (typeof event.data === 'string') {
    // 文本消息
    const text = event.data;
  } else if (event.data instanceof Blob) {
    // Blob数据
    event.data.text().then((text) => console.log(text));
  } else if (event.data instanceof ArrayBuffer) {
    // 二进制数据
    const buffer = event.data;
  }
};

ws.onerror = (event) => {
  console.error('WebSocket错误:', event);
};

ws.onclose = (event) => {
  console.log('连接已关闭');
  console.log('关闭码:', event.code);
  console.log('关闭原因:', event.reason);
  console.log('是否干净关闭:', event.wasClean);
};

// 发送数据
ws.send('文本消息'); // 发送文本
ws.send(new ArrayBuffer(10)); // 发送二进制
ws.send(new Blob(['blob数据'])); // 发送Blob

// 关闭连接
ws.close(1000, '正常关闭');
// 关闭码:
// 1000 - 正常关闭
// 1001 - 端点离开
// 1002 - 协议错误
// 1003 - 不支持的数据类型
// 1006 - 异常关闭
// 1007 - 无效数据
// 1008 - 策略违规
// 1009 - 消息过大
// 1010 - 扩展协商失败
// 1011 - 内部错误
// 1012 - 服务重启
// 1013 - 稍后重试
// 1015 - TLS握手失败
```

### 2.2 封装WebSocket客户端

```typescript
// 封装WebSocket客户端

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onReconnect?: (attempt: number) => void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectCount = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      reconnectAttempts: 5,
      heartbeat: true,
      heartbeatInterval: 30000,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      onMessage: () => {},
      onReconnect: () => {},
      protocols: undefined,
      ...options,
    };

    this.connect();
  }

  // 建立连接
  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.options.url, this.options.protocols);

    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.reconnectCount = 0;

      // 发送队列中的消息
      this.flushMessageQueue();

      // 启动心跳
      if (this.options.heartbeat) {
        this.startHeartbeat();
      }

      this.options.onOpen();
    };

    this.ws.onmessage = (event) => {
      // 处理心跳响应
      if (event.data === 'pong') {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        this.options.onMessage(data);
      } catch {
        this.options.onMessage(event.data);
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket错误:', event);
      this.options.onError(event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket连接已关闭');
      this.stopHeartbeat();
      this.options.onClose(event);

      // 尝试重连
      if (this.options.reconnect && this.reconnectCount < this.options.reconnectAttempts) {
        this.reconnect();
      }
    };
  }

  // 重连
  private reconnect(): void {
    this.reconnectCount++;
    console.log(`尝试重连 (${this.reconnectCount}/${this.options.reconnectAttempts})`);
    this.options.onReconnect(this.reconnectCount);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  // 发送消息
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    } else {
      // 连接未建立，加入队列
      this.messageQueue.push(data);
    }
  }

  // 发送队列消息
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      this.send(data);
    }
  }

  // 启动心跳
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, this.options.heartbeatInterval);
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 关闭连接
  close(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close(1000, '客户端主动关闭');
  }

  // 获取连接状态
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // 是否已连接
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 使用示例
const client = new WebSocketClient({
  url: 'wss://example.com/ws',
  reconnect: true,
  reconnectAttempts: 10,
  heartbeat: true,
  onOpen: () => {
    console.log('连接成功');
    client.send({ type: 'auth', token: 'xxx' });
  },
  onMessage: (data) => {
    console.log('收到消息:', data);
  },
  onClose: (event) => {
    console.log('连接关闭:', event.code, event.reason);
  },
  onReconnect: (attempt) => {
    console.log(`第${attempt}次重连`);
  },
});
```

---

## 3. Socket.io实战

### 3.1 Socket.io服务器

```typescript
// Socket.io服务器实现

import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

interface User {
  id: string;
  name: string;
  room: string;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

// 创建服务器
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // 传输方式
  transports: ['websocket', 'polling'],
  // 心跳配置
  pingInterval: 25000,
  pingTimeout: 60000,
});

// 用户管理
const users = new Map<string, User>();
const rooms = new Map<string, Set<string>>();

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('认证失败'));
  }

  try {
    // 验证token
    const user = verifyToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
});

// 连接处理
io.on('connection', (socket: Socket) => {
  console.log('用户连接:', socket.id);
  const user = socket.data.user as User;

  // 用户上线
  users.set(socket.id, user);

  // 加入房间
  socket.on('joinRoom', (roomName: string) => {
    socket.join(roomName);
    user.room = roomName;

    // 记录房间用户
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName)!.add(socket.id);

    // 通知房间其他用户
    socket.to(roomName).emit('userJoined', {
      userId: socket.id,
      userName: user.name,
      timestamp: new Date(),
    });

    // 发送房间用户列表
    const roomUsers = Array.from(rooms.get(roomName) || []).map((id) => users.get(id));
    io.to(roomName).emit('roomUsers', roomUsers);

    console.log(`${user.name} 加入房间 ${roomName}`);
  });

  // 离开房间
  socket.on('leaveRoom', (roomName: string) => {
    socket.leave(roomName);
    rooms.get(roomName)?.delete(socket.id);

    socket.to(roomName).emit('userLeft', {
      userId: socket.id,
      userName: user.name,
      timestamp: new Date(),
    });
  });

  // 发送消息
  socket.on('sendMessage', (content: string) => {
    const message: Message = {
      id: generateId(),
      userId: socket.id,
      content,
      timestamp: new Date(),
    };

    // 发送给房间所有用户
    io.to(user.room).emit('newMessage', message);
  });

  // 私聊
  socket.on('privateMessage', (data: { to: string; content: string }) => {
    const message: Message = {
      id: generateId(),
      userId: socket.id,
      content: data.content,
      timestamp: new Date(),
    };

    // 发送给目标用户
    socket.to(data.to).emit('privateMessage', {
      ...message,
      from: socket.id,
    });
  });

  // 正在输入
  socket.on('typing', () => {
    socket.to(user.room).emit('userTyping', {
      userId: socket.id,
      userName: user.name,
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);

    // 从房间移除
    if (user.room) {
      rooms.get(user.room)?.delete(socket.id);
      socket.to(user.room).emit('userLeft', {
        userId: socket.id,
        userName: user.name,
        timestamp: new Date(),
      });
    }

    // 移除用户
    users.delete(socket.id);
  });
});

// 房间管理
io.of('/').adapter.on('create-room', (room) => {
  console.log(`房间创建: ${room}`);
});

io.of('/').adapter.on('join-room', (room, id) => {
  console.log(`用户 ${id} 加入房间 ${room}`);
});

io.of('/').adapter.on('leave-room', (room, id) => {
  console.log(`用户 ${id} 离开房间 ${room}`);
});

io.of('/').adapter.on('delete-room', (room) => {
  console.log(`房间删除: ${room}`);
});

httpServer.listen(3001, () => {
  console.log('Socket.io服务器运行在 http://localhost:3001');
});

// 辅助函数
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function verifyToken(token: string): User {
  // 实际项目中验证JWT
  return { id: '1', name: '用户', room: '' };
}
```

### 3.2 Socket.io客户端

```typescript
// Socket.io客户端实现

import { io, Socket } from 'socket.io-client';

interface SocketOptions {
  url: string;
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

class SocketClient {
  private socket: Socket;

  constructor(options: SocketOptions) {
    this.socket = io(options.url, {
      auth: {
        token: options.token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventHandlers(options);
  }

  private setupEventHandlers(options: SocketOptions): void {
    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      options.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('与服务器断开连接:', reason);
      options.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      options.onError?.(error);
    });
  }

  // 加入房间
  joinRoom(room: string): void {
    this.socket.emit('joinRoom', room);
  }

  // 离开房间
  leaveRoom(room: string): void {
    this.socket.emit('leaveRoom', room);
  }

  // 发送消息
  sendMessage(content: string): void {
    this.socket.emit('sendMessage', content);
  }

  // 私聊
  sendPrivateMessage(to: string, content: string): void {
    this.socket.emit('privateMessage', { to, content });
  }

  // 监听新消息
  onNewMessage(callback: (message: any) => void): void {
    this.socket.on('newMessage', callback);
  }

  // 监听用户加入
  onUserJoined(callback: (data: any) => void): void {
    this.socket.on('userJoined', callback);
  }

  // 监听用户离开
  onUserLeft(callback: (data: any) => void): void {
    this.socket.on('userLeft', callback);
  }

  // 监听正在输入
  onUserTyping(callback: (data: any) => void): void {
    this.socket.on('userTyping', callback);
  }

  // 发送正在输入
  emitTyping(): void {
    this.socket.emit('typing');
  }

  // 断开连接
  disconnect(): void {
    this.socket.disconnect();
  }

  // 重新连接
  connect(): void {
    this.socket.connect();
  }

  // 获取Socket实例
  getSocket(): Socket {
    return this.socket;
  }
}

// React Hook封装
import { useEffect, useState, useCallback } from 'react';

interface UseSocketOptions {
  url: string;
  token?: string;
}

function useSocket(options: UseSocketOptions) {
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const client = new SocketClient({
      url: options.url,
      token: options.token,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });

    // 监听消息
    client.onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // 监听用户列表
    client.getSocket().on('roomUsers', (userList: any[]) => {
      setUsers(userList);
    });

    // 监听用户加入
    client.onUserJoined((data) => {
      console.log(`${data.userName} 加入了房间`);
    });

    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, [options.url, options.token]);

  const joinRoom = useCallback((room: string) => {
    socket?.joinRoom(room);
  }, [socket]);

  const sendMessage = useCallback((content: string) => {
    socket?.sendMessage(content);
  }, [socket]);

  const emitTyping = useCallback(() => {
    socket?.emitTyping();
  }, [socket]);

  return {
    socket,
    isConnected,
    messages,
    users,
    joinRoom,
    sendMessage,
    emitTyping,
  };
}

// 使用示例
function ChatRoom() {
  const { isConnected, messages, users, joinRoom, sendMessage, emitTyping } = useSocket({
    url: 'http://localhost:3001',
    token: 'your-jwt-token',
  });

  const [input, setInput] = useState('');

  useEffect(() => {
    joinRoom('general');
  }, [joinRoom]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      <div>状态: {isConnected ? '已连接' : '未连接'}</div>
      <div>
        在线用户: {users.map((u) => u.name).join(', ')}
      </div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          emitTyping();
        }}
      />
      <button onClick={handleSend}>发送</button>
    </div>
  );
}
```

---

## 4. 实时应用架构

### 4.1 聊天应用架构

```typescript
// 实时聊天应用架构

/*
┌─────────────────────────────────────────────────────────────┐
│                   聊天应用架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  客户端层                                                   │
│  ├── React/Vue前端应用                                     │
│  ├── WebSocket客户端                                       │
│  ├── 状态管理 (Zustand/Redux)                              │
│  └── 本地缓存 (IndexedDB)                                  │
│                                                             │
│  网关层                                                     │
│  ├── Nginx反向代理                                         │
│  ├── 负载均衡                                              │
│  └── SSL终止                                               │
│                                                             │
│  服务层                                                     │
│  ├── WebSocket服务器 (Socket.io)                           │
│  ├── 认证服务 (JWT)                                        │
│  ├── 消息服务                                              │
│  └── 用户服务                                               │
│                                                             │
│  数据层                                                     │
│  ├── PostgreSQL (用户、消息持久化)                         │
│  ├── Redis (在线状态、消息队列)                            │
│  └── MongoDB (消息历史)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 消息存储设计
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  type: 'private' | 'group' | 'channel';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Redis存储在线状态
import { createClient } from 'redis';

const redisClient = createClient();

class PresenceService {
  // 用户上线
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    await redisClient.hSet('online_users', userId, socketId);
    await redisClient.expire('online_users', 86400); // 24小时过期
  }

  // 用户离线
  async setUserOffline(userId: string): Promise<void> {
    await redisClient.hDel('online_users', userId);
  }

  // 检查用户在线状态
  async isUserOnline(userId: string): Promise<boolean> {
    const socketId = await redisClient.hGet('online_users', userId);
    return !!socketId;
  }

  // 获取所有在线用户
  async getOnlineUsers(): Promise<string[]> {
    const users = await redisClient.hKeys('online_users');
    return users;
  }

  // 设置用户状态（在线/离开/忙碌）
  async setUserStatus(userId: string, status: 'online' | 'away' | 'busy'): Promise<void> {
    await redisClient.hSet('user_status', userId, status);
  }

  // 获取用户状态
  async getUserStatus(userId: string): Promise<string | null> {
    return await redisClient.hGet('user_status', userId);
  }
}

// 消息队列（处理离线消息）
class MessageQueue {
  // 添加离线消息
  async addOfflineMessage(userId: string, message: Message): Promise<void> {
    await redisClient.rPush(`offline_messages:${userId}`, JSON.stringify(message));
  }

  // 获取离线消息
  async getOfflineMessages(userId: string): Promise<Message[]> {
    const messages = await redisClient.lRange(`offline_messages:${userId}`, 0, -1);
    await redisClient.del(`offline_messages:${userId}`);
    return messages.map((m) => JSON.parse(m));
  }

  // 消息确认
  async acknowledgeMessage(messageId: string, userId: string): Promise<void> {
    await redisClient.sAdd(`message_ack:${messageId}`, userId);
  }
}
```

### 4.2 协作编辑架构

```typescript
// 实时协作编辑架构

/*
┌─────────────────────────────────────────────────────────────┐
│                   协作编辑架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  核心概念:                                                  │
│  1. 操作转换 (OT) - 解决并发冲突                           │
│  2. CRDT - 无冲突复制数据类型                              │
│  3. 版本向量 - 追踪操作历史                                │
│                                                             │
│  数据流:                                                    │
│  客户端A ──► 操作 ──► 服务器 ──► 转换 ──► 广播 ──► 客户端B│
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 操作定义
interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position?: number;
  content?: string;
  length?: number;
  userId: string;
  version: number;
  timestamp: number;
}

// 文档状态
interface Document {
  id: string;
  content: string;
  version: number;
  operations: Operation[];
  collaborators: string[];
}

// 操作转换引擎
class OTEngine {
  // 转换操作
  transform(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position! <= op2.position!) {
        return { ...op2, position: op2.position! + op1.content!.length };
      }
      return op2;
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position! <= op2.position!) {
        return { ...op2, position: op2.position! + op1.content!.length };
      }
      return op2;
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position! + op1.length! <= op2.position!) {
        return { ...op2, position: op2.position! - op1.length! };
      }
      if (op1.position! >= op2.position!) {
        return op2;
      }
      return { ...op2, position: op1.position! };
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position! + op1.length! <= op2.position!) {
        return { ...op2, position: op2.position! - op1.length! };
      }
      if (op1.position! >= op2.position! + op2.length!) {
        return op2;
      }
      // 重叠删除
      return { ...op2, length: Math.max(0, op2.length! - op1.length!) };
    }

    return op2;
  }

  // 应用操作
  apply(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          operation.content +
          content.slice(operation.position)
        );
      case 'delete':
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position! + operation.length!)
        );
      default:
        return content;
    }
  }
}

// 协作服务器
class CollaborationServer {
  private documents = new Map<string, Document>();
  private otEngine = new OTEngine();

  // 处理操作
  handleOperation(
    documentId: string,
    operation: Operation,
    socket: Socket
  ): void {
    const doc = this.documents.get(documentId);
    if (!doc) return;

    // 转换操作
    let transformedOp = operation;
    for (let i = operation.version; i < doc.operations.length; i++) {
      transformedOp = this.otEngine.transform(doc.operations[i], transformedOp);
    }

    // 应用操作
    doc.content = this.otEngine.apply(doc.content, transformedOp);
    doc.operations.push(transformedOp);
    doc.version++;

    // 广播给其他用户
    socket.to(documentId).emit('operation', transformedOp);

    // 确认给发送者
    socket.emit('operationAck', {
      operationId: operation.timestamp,
      version: doc.version,
    });
  }
}
```

---

## 5. 性能优化

### 5.1 连接优化

```typescript
// WebSocket性能优化

// 1. 连接池管理
class ConnectionPool {
  private connections = new Map<string, WebSocket>();
  private maxConnections = 100;

  addConnection(id: string, ws: WebSocket): boolean {
    if (this.connections.size >= this.maxConnections) {
      return false;
    }
    this.connections.set(id, ws);
    return true;
  }

  removeConnection(id: string): void {
    this.connections.delete(id);
  }

  getConnection(id: string): WebSocket | undefined {
    return this.connections.get(id);
  }

  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}

// 2. 消息压缩
import { createDeflate, createInflate } from 'zlib';

class CompressedWebSocket {
  private ws: WebSocket;
  private deflate = createDeflate();
  private inflate = createInflate();

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  send(data: any): void {
    const json = JSON.stringify(data);
    this.deflate.write(json);
    this.deflate.end();
    this.deflate.on('data', (compressed) => {
      this.ws.send(compressed);
    });
  }
}

// 3. 消息批处理
class MessageBatcher {
  private queue: any[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize = 50;
  private batchInterval = 100; // ms

  add(message: any, callback: (batch: any[]) => void): void {
    this.queue.push(message);

    if (this.queue.length >= this.batchSize) {
      this.flush(callback);
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(callback), this.batchInterval);
    }
  }

  private flush(callback: (batch: any[]) => void): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length > 0) {
      callback(this.queue);
      this.queue = [];
    }
  }
}

// 4. 心跳优化
class OptimizedHeartbeat {
  private ws: WebSocket;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPong: number = Date.now();
  private pingIntervalMs = 30000;
  private pongTimeoutMs = 5000;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.setupHeartbeat();
  }

  private setupHeartbeat(): void {
    this.ws.on('pong', () => {
      this.lastPong = Date.now();
      if (this.pongTimeout) {
        clearTimeout(this.pongTimeout);
        this.pongTimeout = null;
      }
    });

    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        this.pongTimeout = setTimeout(() => {
          console.log('心跳超时，断开连接');
          this.ws.terminate();
        }, this.pongTimeoutMs);
      }
    }, this.pingIntervalMs);
  }

  stop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
  }
}
```

### 5.2 水平扩展

```typescript
// WebSocket水平扩展方案

/*
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket集群架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  客户端1 ──┐                                                │
│  客户端2 ──┼──► 负载均衡 ──► WebSocket服务器1 ──┐          │
│  客户端3 ──┘                WebSocket服务器2 ──┼──► Redis  │
│                             WebSocket服务器3 ──┘            │
│                                                             │
│  关键点:                                                    │
│  1. 粘性会话 (Sticky Session)                              │
│  2. Redis Pub/Sub 消息广播                                  │
│  3. 共享会话存储                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Socket.io Redis适配器
const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// 自定义Redis适配器
class RedisAdapter {
  private pubClient: ReturnType<typeof createClient>;
  private subClient: ReturnType<typeof createClient>;

  constructor() {
    this.pubClient = createClient();
    this.subClient = this.pubClient.duplicate();
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);

    // 订阅消息频道
    await this.subClient.subscribe('websocket:broadcast', (message) => {
      this.handleBroadcast(JSON.parse(message));
    });
  }

  // 发布消息到所有服务器
  async broadcast(event: string, data: any): Promise<void> {
    await this.pubClient.publish(
      'websocket:broadcast',
      JSON.stringify({ event, data })
    );
  }

  // 处理广播消息
  private handleBroadcast(message: { event: string; data: any }): void {
    // 发送给本地连接的客户端
    this.emitToLocalClients(message.event, message.data);
  }

  private emitToLocalClients(event: string, data: any): void {
    // 实现发送给本地客户端
  }
}

// Nginx配置WebSocket负载均衡
/*
upstream websocket {
    ip_hash;  # 粘性会话
    server ws1.example.com:3000;
    server ws2.example.com:3000;
    server ws3.example.com:3000;
}

server {
    listen 80;
    server_name example.com;

    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
*/
```

---

## 6. 面试高频问题

### 问题1：WebSocket与HTTP长轮询的区别？

**答案：**
| 方面 | WebSocket | HTTP长轮询 |
|------|-----------|------------|
| 连接 | 持久连接 | 频繁建立连接 |
| 延迟 | 低延迟 | 高延迟 |
| 开销 | 低（无HTTP头） | 高（每次请求都有HTTP头） |
| 双向 | 原生支持 | 需要模拟 |
| 兼容性 | 现代浏览器 | 所有浏览器 |

### 问题2：WebSocket如何处理断线重连？

**答案：**
1. 监听`onclose`事件
2. 使用指数退避算法延迟重连
3. 设置最大重连次数
4. 重连成功后恢复状态

### 问题3：如何实现WebSocket认证？

**答案：**
1. 连接时在URL参数传递token
2. 在握手时验证token
3. 使用中间件拦截未认证连接
4. 定期刷新token

### 问题4：WebSocket如何实现心跳机制？

**答案：**
1. 客户端定期发送Ping消息
2. 服务器响应Pong消息
3. 超时未响应则断开连接
4. 自动重连

### 问题5：如何实现WebSocket集群？

**答案：**
1. 使用Redis Pub/Sub广播消息
2. 使用粘性会话保证连接稳定
3. 共享会话存储
4. 使用Socket.io Redis适配器

---

## 7. 最佳实践总结

### 7.1 连接管理清单

- [ ] 实现断线重连
- [ ] 实现心跳机制
- [ ] 设置连接超时
- [ ] 处理网络切换
- [ ] 实现消息队列

### 7.2 安全配置清单

- [ ] 使用WSS（加密）
- [ ] 实现认证机制
- [ ] 验证消息格式
- [ ] 限制消息大小
- [ ] 防止DDoS攻击

### 7.3 性能优化清单

- [ ] 消息压缩
- [ ] 消息批处理
- [ ] 连接池管理
- [ ] 水平扩展
- [ ] 监控告警

---

*本文档最后更新于 2026年3月*