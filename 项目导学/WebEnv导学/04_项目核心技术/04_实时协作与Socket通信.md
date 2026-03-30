# 实时协作与 Socket 通信教程

## 目录

1. [WebSocket 基础](#1-websocket-基础)
2. [Socket.io Client 使用](#2-socketio-client-使用)
3. [Yjs CRDT 实时协作原理](#3-yjs-crdt-实时协作原理)
4. [y-websocket 使用](#4-y-websocket-使用)
5. [项目中的协作实现](#5-项目中的协作实现)

---

## 1. WebSocket 基础

### 1.1 什么是 WebSocket？

**WebSocket** 是一种在单个 TCP 连接上进行全双工通信的协议。与传统的 HTTP 请求-响应模式不同，WebSocket 允许服务器主动向客户端推送数据，非常适合实时通信场景。

```javascript
// ===== 客户端 WebSocket =====
const ws = new WebSocket('ws://localhost:8080');

// 连接打开
ws.onopen = () => {
    console.log('WebSocket 连接已建立');
    ws.send('Hello Server!');
};

// 接收消息
ws.onmessage = (event) => {
    console.log('收到消息:', event.data);
};

// 发生错误
ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
};

// 连接关闭
ws.onclose = (event) => {
    console.log('连接关闭:', event.code, event.reason);
};

// 发送消息
ws.send(JSON.stringify({ type: 'message', data: 'hello' }));

// 关闭连接
ws.close(1000, 'Normal closure');
```

### 1.2 WebSocket 与 HTTP 对比

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 连接方式 | 请求-响应 | 全双工 |
| 头部开销 | 较大 | 较小 |
| 实时性 | 轮询/长轮询 | 实时推送 |
| 断开连接 | 每个请求断开 | 保持连接 |
| 适用场景 | REST API | 实时通信 |

### 1.3 Node.js WebSocket 服务器

```javascript
// 使用 ws 库创建 WebSocket 服务器
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// 广播消息给所有客户端
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws, req) => {
    console.log('新客户端连接:', req.socket.remoteAddress);

    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'welcome',
        message: '欢迎连接到 WebSocket 服务器'
    }));

    // 处理客户端消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                case 'chat':
                    // 广播聊天消息给所有客户端
                    broadcast({
                        type: 'chat',
                        message: data.message,
                        sender: req.socket.remoteAddress,
                        timestamp: Date.now()
                    });
                    break;

                case 'broadcast':
                    broadcast(data);
                    break;

                default:
                    console.log('未知消息类型:', data.type);
            }
        } catch (e) {
            console.error('消息解析错误:', e);
        }
    });

    // 处理关闭
    ws.on('close', () => {
        console.log('客户端断开连接');
    });

    // 心跳检测
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// 心跳检测定时器
const interval = setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

console.log('WebSocket 服务器运行在 ws://localhost:8080');
```

### 1.4 实际应用场景

```javascript
// ===== 实时聊天 =====
class ChatClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.handlers = [];

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                this.handlers.forEach(handler => handler(data));
            }
        };
    }

    send(message) {
        this.ws.send(JSON.stringify({
            type: 'message',
            content: message,
            timestamp: Date.now()
        }));
    }

    onMessage(handler) {
        this.handlers.push(handler);
    }
}

// ===== 实时协作编辑 =====
class CollaborativeEditor {
    constructor(url, documentId) {
        this.ws = new WebSocket(url);
        this.documentId = documentId;
        this.pendingOps = [];
        this.revision = 0;

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleOperation(data);
        };
    }

    sendOperation(op) {
        this.ws.send(JSON.stringify({
            type: 'operation',
            documentId: this.documentId,
            operation: op,
            revision: this.revision
        }));
    }

    handleOperation(data) {
        // 应用远程操作
        this.revision = data.revision;
    }
}

// ===== 游戏实时同步 =====
class GameSync {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.state = {};

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'state_update') {
                this.state = data.state;
                this.onStateUpdate?.(this.state);
            }
        };
    }

    sendPlayerAction(action) {
        this.ws.send(JSON.stringify({
            type: 'player_action',
            action: action,
            timestamp: Date.now()
        }));
    }

    onStateUpdate(callback) {
        this.onStateUpdate = callback;
    }
}
```

---

## 2. Socket.io Client 使用

### 2.1 简介

**Socket.io** 是一个功能强大的 WebSocket 库，提供了自动重连、房间管理、广播等高级功能。

```bash
# 安装 Socket.io Client
npm install socket.io-client@4.8.3
```

### 2.2 基础使用

```javascript
import { io } from 'socket.io-client';

// 连接到服务器
const socket = io('http://localhost:3000', {
    // 连接选项
    transports: ['websocket'],          // 传输方式
    reconnection: true,                  // 自动重连
    reconnectionAttempts: 5,             // 重连次数
    reconnectionDelay: 1000,             // 重连延迟
    reconnectionDelayMax: 5000,          // 最大重连延迟
    timeout: 20000,                       // 连接超时
    autoConnect: true,                    // 自动连接
    query: {                             // 查询参数
        userId: 'user123'
    },
    auth: {                              // 认证信息
        token: 'your-token'
    }
});

// 连接成功
socket.on('connect', () => {
    console.log('连接 ID:', socket.id);
    console.log('已连接到服务器');
});

// 连接错误
socket.on('connect_error', (error) => {
    console.error('连接错误:', error.message);
});

// 断开连接
socket.on('disconnect', (reason) => {
    console.log('断开连接:', reason);
});

// 重新连接
socket.on('reconnect', (attemptNumber) => {
    console.log('重新连接成功, 尝试次数:', attemptNumber);
});

// 监听事件
socket.on('message', (data) => {
    console.log('收到消息:', data);
});

// 发送事件
socket.emit('message', 'Hello Server!');

// 断开连接
socket.disconnect();
```

### 2.3 事件处理

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// ===== 一次性事件 =====
socket.once('initial_data', (data) => {
    console.log('只接收一次:', data);
});

// ===== 自定义事件 =====
socket.on('chat_message', (data) => {
    const { message, sender, timestamp } = data;
    console.log(`[${timestamp}] ${sender}: ${message}`);
});

// 发送聊天消息
function sendMessage(message) {
    socket.emit('chat_message', {
        message,
        sender: 'user123',
        timestamp: Date.now()
    });
}

// ===== 确认回调 =====
socket.emit('request_data', { id: 1 }, (response) => {
    console.log('服务器响应:', response);
});

// 服务器端
// socket.on('request_data', (data, callback) => {
//     callback({ status: 'ok', result: ... });
// });

// ===== 错误处理 =====
socket.on('error', (error) => {
    console.error('Socket 错误:', error);
});

// ===== 房间管理 =====
socket.emit('join_room', 'room_1');
socket.emit('leave_room', 'room_1');

// 房间消息
socket.on('room_message', (data) => {
    console.log('房间消息:', data);
});

// ===== 广播消息 =====
socket.on('broadcast', (data) => {
    console.log('广播消息:', data);
});
```

### 2.4 命名空间和房间

```javascript
// ===== 命名空间 =====
const adminSocket = io('http://localhost:3000/admin');
const chatSocket = io('http://localhost:3000/chat');
const gameSocket = io('http://localhost:3000/game');

// ===== 房间 =====
socket.emit('join', { room: 'room_123' });
socket.emit('leave', { room: 'room_123' });

// 发送到房间
// 服务器端: socket.to('room_123').emit('message', data)
// 或者: io.to('room_123').emit('message', data)

// ===== 私聊 =====
socket.emit('private_message', {
    to: 'user_id_456',
    message: 'Hello!'
});

socket.on('private_message', (data) => {
    console.log('私聊消息:', data);
});
```

### 2.5 React 中使用 Socket.io

```jsx
import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { message } from 'antd';

// 创建 Context
const SocketContext = createContext(null);

// Socket 提供者组件
export const SocketProvider = ({ children, serverUrl }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            message.error('连接服务器失败');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [serverUrl]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// 使用 Hook
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

// 示例组件
const ChatComponent = () => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat_message', (data) => {
            setMessages(prev => [...prev, data]);
        });

        return () => {
            socket.off('chat_message');
        };
    }, [socket]);

    const sendMessage = (text) => {
        if (socket && isConnected) {
            socket.emit('chat_message', {
                text,
                timestamp: Date.now()
            });
        }
    };

    return (
        <div>
            <div>状态: {isConnected ? '已连接' : '未连接'}</div>
            <div>
                {messages.map((msg, i) => (
                    <div key={i}>{msg.text}</div>
                ))}
            </div>
        </div>
    );
};

// 主应用
const App = () => {
    return (
        <SocketProvider serverUrl="http://localhost:3000">
            <ChatComponent />
        </SocketProvider>
    );
};
```

---

## 3. Yjs CRDT 实时协作原理

### 3.1 什么是 CRDT？

**CRDT** (Conflict-free Replicated Data Type) 是一种无冲突复制数据类型，它是一种特殊的数据结构，可以在多个副本之间同步，即使在网络延迟或离线的情况下，也能自动解决冲突并保持最终一致性。

```bash
# 安装 Yjs
npm install yjs@13.6.29
```

### 3.2 Yjs 核心概念

```javascript
import * as Y from 'yjs';

// ===== 创建文档 =====
const ydoc = new Y.Doc();

// ===== 创建共享类型 =====

// 1. Y.Text - 共享文本 (用于代码编辑器)
const ytext = ydoc.getText('content');
ytext.insert(0, 'Hello World!');
console.log(ytext.toString()); // "Hello World!"

// 2. Y.Array - 共享数组
const yarray = ydoc.getArray('items');
yarray.push(['item1', 'item2']);
console.log(yarray.toArray()); // ["item1", "item2"]

// 3. Y.Map - 共享 Map
const ymap = ydoc.getMap('user');
ymap.set('name', 'John');
ymap.set('age', 30);
console.log(ymap.toJSON()); // { name: "John", age: 30 }

// 4. Y.XmlFragment - 共享 XML/HTML
const yxml = ydoc.getXmlFragment('html');
```

### 3.3 观察者模式

```javascript
import * as Y from 'yjs';

// ===== 文本观察者 =====
const ytext = ydoc.getText('content');

// 监听文本变化
ytext.observe((event) => {
    console.log('文本变化:', event.delta);

    // delta 包含操作类型:
    // - { insert: "text" }  插入文本
    // - { delete: number } 删除文本
    // - { retain: number } 保留/跳过字符
});

// 观察特定区间
ytext.observeDeep((events) => {
    events.forEach(event => {
        console.log('深度变化:', event.changes.delta);
    });
});

// ===== 数组观察者 =====
const yarray = ydoc.getArray('items');

yarray.observe((event) => {
    console.log('数组变化:', event.changes.delta);

    // event.changes.delta 包含:
    // - { insert: [...] }  插入元素
    // - { delete: ... }    删除元素
});

// ===== Map 观察者 =====
const ymap = ydoc.getMap('user');

ymap.observe((event) => {
    event.keysChanged.forEach(key => {
        console.log(`键 ${key} 变化:`, ymap.get(key));
    });
});
```

### 3.4 事务处理

```javascript
import * as Y from 'yjs';

const ytext = ydoc.getText('content');

// ===== 事务 =====
ydoc.transact(() => {
    ytext.insert(0, 'Hello ');
    ytext.insert(6, 'World');
}, 'origin'); // origin 可用于标识事务来源

// ===== 撤销/重做 =====
const undoManager = new Y.UndoManager(ytext);

// 监听撤销/重做
undoManager.on('stack-item-added', (item) => {
    console.log('添加撤销栈:', item);
});

undoManager.on('stack-item-popped', (item) => {
    console.log('撤销:', item);
});

// 撤销
function undo() {
    undoManager.undo();
}

// 重做
function redo() {
    undoManager.redo();
}

// ===== 原子操作 =====
ydoc.transact(() => {
    // 这些操作会作为一个原子操作
    ytext.insert(0, 'Start');
    ytext.insert(100, 'End');
});

// 只有所有操作都成功才会提交
```

### 3.5 编码和解码

```javascript
import * as Y from 'yjs';

// ===== 编码状态向量 =====
const stateVector = Y.encodeStateVector(ydoc);
console.log('状态向量:', stateVector);

// ===== 编码文档状态 =====
const state = Y.encodeStateAsUpdate(ydoc);
console.log('编码状态大小:', state.byteLength);

// ===== 应用更新 =====
const ydoc2 = new Y.Doc();
Y.applyUpdate(ydoc2, state);

// ===== 合并更新 =====
const update1 = Y.encodeStateAsUpdate(ydoc);
const update2 = Y.encodeStateAsUpdate(ydoc2);

// 合并更新
const mergedUpdate = Y.mergeUpdates([update1, update2]);

// ===== 增量更新 =====
const ytext = ydoc.getText('content');
ytext.insert(0, 'Hello');

// 获取从某个版本之后的增量更新
const incrementalUpdate = Y.encodeStateAsUpdate(ydoc, stateVector);
```

---

## 4. y-websocket 使用

### 4.1 y-websocket 简介

**y-websocket** 是 Yjs 的 WebSocket 提供者，用于在多个客户端之间同步 Yjs 文档。

```bash
# 安装 y-websocket
npm install y-websocket@2.0.4
npm install ws@8.18.0
```

### 4.2 服务端

```javascript
// 服务器端 y-websocket
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Y-WebSocket Server');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // 解析 URL 参数
    const url = new URL(req.url, `http://${req.headers.host}`);
    const docName = url.pathname.slice(1); // 去掉前导 /

    console.log(`客户端连接: ${docName}`);

    // 设置 WebSocket 连接
    setupWSConnection(ws, req, { docName });
});

server.listen(1234, () => {
    console.log('Y-WebSocket 服务器运行在 http://localhost:1234');
});
```

### 4.3 客户端

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();

// 连接到 WebSocket 服务器
const provider = new WebsocketProvider(
    'ws://localhost:1234',  // 服务器地址
    'my-document',          // 文档名称 (房间名)
    ydoc                    // Yjs 文档
);

// 连接状态
provider.on('status', (event) => {
    console.log('连接状态:', event.status);
    // event.status: 'connected' 或 'disconnected'
});

// 同步状态
provider.on('sync', (isSynced) => {
    console.log('同步状态:', isSynced);
});

// 获取共享文本
const ytext = ydoc.getText('content');

// 监听变化
ytext.observe((event) => {
    console.log('远程变化:', event.delta);
});

// 修改文本 (本地)
ytext.insert(0, 'Hello Yjs!');

// 断开连接
function disconnect() {
    provider.disconnect();
}

// 销毁
function destroy() {
    provider.destroy();
    ydoc.destroy();
}
```

### 4.4 高级配置

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();

const provider = new WebsocketProvider(
    'ws://localhost:1234',
    'my-document',
    ydoc,
    {
        // 连接选项
        connect: true,                    // 自动连接
        params: { token: 'xxx' },         // URL 参数
        headers: { 'X-Header': 'value' }, // HTTP 头

        // WebSocket 选项
        maxBackoffTime: 10000,            // 最大重连延迟
        resyncInterval: 30000,            // 重新同步间隔

        // 持久化
        persist: true,                    // 持久化到 IndexedDB
        storage: new IndexedDBPersistence('my-document'),

        // 广播 (本地客户端同步)
        broadcast: true,

        // 过滤器
        filter: (event) => true,

        // 源
        source: 'xxx'
    }
);

// ===== Awareness (用户感知) =====
const awareness = provider.awareness;

// 设置本地用户状态
awareness.setLocalState({
    user: {
        name: 'User 1',
        color: '#ff0000'
    }
});

// 监听状态变化
awareness.on('change', () => {
    const states = awareness.getStates();
    states.forEach((state, clientID) => {
        console.log(`Client ${clientID}:`, state);
    });
});

// 获取所有用户
function getOnlineUsers() {
    const states = awareness.getStates();
    return Array.from(states.values()).filter(s => s.user);
}
```

### 4.5 y-monaco (编辑器集成)

```bash
# 安装 y-monaco
npm install y-monaco@0.1.6
```

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';

// 1. 创建 Yjs 文档
const ydoc = new Y.Doc();

// 2. 连接 WebSocket
const provider = new WebsocketProvider(
    'ws://localhost:1234',
    'my-document',
    ydoc
);

// 3. 获取共享文本
const ytext = ydoc.getText('monaco');

// 4. 创建 Monaco 编辑器
const editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'javascript',
    theme: 'vs-dark'
});

// 5. 创建绑定
const binding = new MonacoBinding(
    ytext,
    editor.getModel(),
    new Set([editor]),
    provider.awareness
);

// 6. 清理
function cleanup() {
    binding.destroy();
    provider.destroy();
    ydoc.destroy();
}
```

---

## 5. 项目中的协作实现

### 5.1 实时协作编辑器

```jsx
// 项目中的实时协作代码编辑器
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import Editor from '@monaco-editor/react';
import { Button, Space, Tag, Avatar, Tooltip, message } from 'antd';
import './CollaborativeEditor.css';

const CollaborativeEditor = ({
    documentId,
    language = 'javascript',
    serverUrl = 'ws://localhost:1234',
    userInfo = { name: 'Anonymous', color: '#' + Math.floor(Math.random()*16777215).toString(16) }
}) => {
    const [editor, setEditor] = useState(null);
    const [monaco, setMonaco] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState([]);
    const [isSynced, setIsSynced] = useState(false);

    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const bindingRef = useRef(null);

    useEffect(() => {
        // 创建 Yjs 文档
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // 连接 WebSocket
        const provider = new WebsocketProvider(
            serverUrl,
            documentId,
            ydoc
        );
        providerRef.current = provider;

        // 连接状态
        provider.on('status', ({ status }) => {
            setIsConnected(status === 'connected');
        });

        // 同步状态
        provider.on('sync', (synced) => {
            setIsSynced(synced);
            if (synced) {
                message.success('文档已同步');
            }
        });

        // 设置用户感知
        provider.awareness.setLocalState({
            user: userInfo,
            cursor: null
        });

        // 监听用户变化
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const userList = [];
            states.forEach((state, clientId) => {
                if (state.user) {
                    userList.push({
                        ...state.user,
                        clientId,
                        isLocal: clientId === provider.awareness.clientID
                    });
                }
            });
            setUsers(userList);
        });

        return () => {
            bindingRef.current?.destroy();
            provider.disconnect();
            ydoc.destroy();
        };
    }, [documentId, serverUrl]);

    // 编辑器挂载
    const handleEditorDidMount = useCallback((editorInstance, monacoInstance) => {
        setEditor(editorInstance);
        setMonaco(monacoInstance);

        if (!ydocRef.current || !providerRef.current) return;

        // 获取共享文本
        const ytext = ydocRef.current.getText('content');

        // 创建 Monaco 绑定
        const binding = new MonacoBinding(
            ytext,
            editorInstance.getModel(),
            new Set([editorInstance]),
            providerRef.current.awareness
        );
        bindingRef.current = binding;

        // 自定义光标样式
        monacoInstance.editor.defineTheme('collab-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#2a2a2a'
            }
        });
        monacoInstance.editor.setTheme('collab-theme');
    }, []);

    // 获取用户头像颜色
    const getUserColor = (color) => color || '#1890ff';

    return (
        <div className="collaborative-editor">
            <div className="editor-header">
                <Space>
                    {/* 连接状态 */}
                    <Tag color={isConnected ? 'success' : 'error'}>
                        {isConnected ? '已连接' : '未连接'}
                    </Tag>

                    {/* 同步状态 */}
                    {isConnected && (
                        <Tag color={isSynced ? 'blue' : 'orange'}>
                            {isSynced ? '已同步' : '同步中...'}
                        </Tag>
                    )}

                    {/* 在线用户 */}
                    <div className="online-users">
                        <Tooltip title="在线用户">
                            <Avatar.Group maxCount={5}>
                                {users.map(user => (
                                    <Tooltip key={user.clientId} title={user.name}>
                                        <Avatar
                                            style={{
                                                backgroundColor: getUserColor(user.color),
                                                cursor: user.isLocal ? 'default' : 'pointer'
                                            }}
                                            size="small"
                                        >
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                            </Avatar.Group>
                        </Tooltip>
                    </div>
                </Space>
            </div>

            <div className="editor-content">
                <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        fontFamily: "'Fira Code', monospace",
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        folding: true
                    }}
                />
            </div>
        </div>
    );
};

export default CollaborativeEditor;
```

### 5.2 实时协作白板

```jsx
// 项目中的实时协作白板
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from 'uuid';
import { Canvas, useStore } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const CollaborativeWhiteboard = ({ documentId, userInfo }) => {
    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const [elements, setElements] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        const provider = new WebsocketProvider(
            'ws://localhost:1234',
            `whiteboard-${documentId}`,
            ydoc
        );
        providerRef.current = provider;

        provider.on('status', ({ status }) => {
            setIsConnected(status === 'connected');
        });

        // 监听图形变化
        const yelements = ydoc.getArray('elements');
        yelements.observe((event) => {
            setElements(yelements.toArray());
        });

        return () => {
            provider.disconnect();
            ydoc.destroy();
        };
    }, [documentId]);

    // 添加图形
    const addElement = useCallback((element) => {
        const yelements = ydocRef.current?.getArray('elements');
        if (yelements) {
            yelements.push([{
                ...element,
                id: uuidv4(),
                userId: userInfo.id,
                timestamp: Date.now()
            }]);
        }
    }, [userInfo]);

    // 更新图形
    const updateElement = useCallback((id, updates) => {
        const yelements = ydocRef.current?.getArray('elements');
        if (yelements) {
            const elements = yelements.toArray();
            const index = elements.findIndex(el => el.id === id);
            if (index !== -1) {
                yelements.delete(index, 1);
                yelements.insert(index, [{ ...elements[index], ...updates }]);
            }
        }
    }, []);

    return (
        <div className="whiteboard">
            <div className="toolbar">
                <button onClick={() => addElement({ type: 'rect', x: 100, y: 100, width: 100, height: 100, color: '#ff0000' })}>
                    添加矩形
                </button>
                <button onClick={() => addElement({ type: 'circle', x: 200, y: 200, radius: 50, color: '#00ff00' })}>
                    添加圆形
                </button>
                <span>状态: {isConnected ? '已连接' : '未连接'}</span>
            </div>
            <Canvas>
                {elements.map(element => (
                    <WhiteboardElement
                        key={element.id}
                        element={element}
                        onUpdate={(updates) => updateElement(element.id, updates)}
                    />
                ))}
            </Canvas>
        </div>
    );
};

const WhiteboardElement = ({ element, onUpdate }) => {
    // 根据类型渲染不同图形
    if (element.type === 'rect') {
        return (
            <mesh position={[element.x, element.y, 0]}>
                <planeGeometry args={[element.width, element.height]} />
                <meshBasicMaterial color={element.color} />
            </mesh>
        );
    }
    return null;
};

export default CollaborativeWhiteboard;
```

### 5.3 实时状态同步

```jsx
// 项目中的实时状态同步组件
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 状态管理 Hook
export const useRealtimeState = (serverUrl, roomId, initialState = {}) => {
    const [state, setState] = useState(initialState);
    const [isConnected, setIsConnected] = useState(false);
    const ydocRef = useRef(null);
    const providerRef = useRef(null);

    useEffect(() => {
        // Yjs 文档
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // 共享 Map
        const ymap = ydoc.getMap('state');

        // WebSocket 提供者
        const provider = new WebsocketProvider(serverUrl, roomId, ydoc);
        providerRef.current = provider;

        // 连接状态
        provider.on('status', ({ status }) => {
            setIsConnected(status === 'connected');
        });

        // 监听变化
        ymap.observe((event) => {
            const newState = {};
            event.keysChanged.forEach(key => {
                newState[key] = ymap.get(key);
            });
            setState(prev => ({ ...prev, ...newState }));
        });

        // 初始化本地状态
        setState(ymap.toJSON());

        return () => {
            provider.disconnect();
            ydoc.destroy();
        };
    }, [serverUrl, roomId]);

    // 更新状态
    const updateState = useCallback((updates) => {
        const ymap = ydocRef.current?.getMap('state');
        if (ymap) {
            ydocRef.current.transact(() => {
                Object.entries(updates).forEach(([key, value]) => {
                    ymap.set(key, value);
                });
            });
        }
    }, []);

    return { state, updateState, isConnected };
};

// 使用示例
const GameState = ({ gameId, userId }) => {
    const { state, updateState, isConnected } = useRealtimeState(
        'ws://localhost:1234',
        `game-${gameId}`,
        { players: [], scores: {}, status: 'waiting' }
    );

    // 加入游戏
    const joinGame = () => {
        updateState({
            [`players.${userId}`]: { id: userId, score: 0 },
            status: state.players.length >= 2 ? 'playing' : 'waiting'
        });
    };

    // 更新分数
    const updateScore = (score) => {
        updateState({ [`scores.${userId}`]: score });
    };

    return (
        <div>
            <div>状态: {isConnected ? '已连接' : '未连接'}</div>
            <div>游戏状态: {state.status}</div>
            <div>玩家: {JSON.stringify(state.players)}</div>
            <div>分数: {JSON.stringify(state.scores)}</div>
            <button onClick={joinGame}>加入游戏</button>
        </div>
    );
};
```

### 5.4 实时通信组件

```jsx
// 项目中的实时聊天组件
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Input, Button, List, Avatar, Badge, Space } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import './Chat.css';

const ChatRoom = ({ roomId, userInfo, serverUrl = 'http://localhost:3001' }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const socket = io(serverUrl, {
            transports: ['websocket'],
            query: { roomId, userId: userInfo.id, userName: userInfo.name }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('连接成功');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('断开连接');
        });

        socket.on('message', (message) => {
            setMessages(prev => [...prev, message]);
            // 如果不是当前窗口，标记未读
            if (!document.hasFocus()) {
                setUnreadCount(prev => prev + 1);
            }
        });

        socket.on('users', (userList) => {
            setUsers(userList);
        });

        socket.on('history', (history) => {
            setMessages(history);
        });

        // 请求历史消息
        socket.emit('get_history', { roomId });

        return () => {
            socket.disconnect();
        };
    }, [roomId, serverUrl, userInfo]);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 发送消息
    const sendMessage = useCallback(() => {
        if (!inputValue.trim() || !socketRef.current) return;

        socketRef.current.emit('message', {
            roomId,
            content: inputValue,
            sender: userInfo,
            timestamp: Date.now()
        });

        setInputValue('');
    }, [inputValue, roomId, userInfo]);

    // 按回车发送
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-room">
            <div className="chat-header">
                <Badge status={isConnected ? 'success' : 'error'} />
                <span>房间: {roomId}</span>
                <span>在线: {users.length} 人</span>
            </div>

            <div className="chat-content">
                <List
                    dataSource={messages}
                    renderItem={(msg) => (
                        <List.Item
                            className={msg.sender.id === userInfo.id ? 'my-message' : ''}
                        >
                            <Space>
                                <Avatar icon={<UserOutlined />} />
                                <div className="message-content">
                                    <div className="message-sender">
                                        {msg.sender.name}
                                    </div>
                                    <div className="message-text">
                                        {msg.content}
                                    </div>
                                    <div className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </Space>
                        </List.Item>
                    )}
                />
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <Input.TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                >
                    发送
                </Button>
            </div>
        </div>
    );
};

export default ChatRoom;
```

---

## 6. Yjs CRDT 核心数据结构源码解析

### 6.1 Y.Text 内部数据结构

```javascript
// ===== Y.Text 内部实现源码原理 =====

class YText extends YAbstractType {
    constructor() {
        super();

        // ===== 内部数据结构 =====
        this._start = null;      // YText 的起始节点
        this._length = 0;       // 文本长度

        // ===== Undo/Undo 管理器 =====
        this._item = null;       // 当前编辑位置
        this._map = new Map();    // 属性映射
    }

    // ===== 核心插入操作 =====
    insert(index, content) {
        // 1. 转换内容为块列表
        const contentBlocks = this._toContentChunks(content);

        // 2. 验证索引位置
        if (index < 0 || index > this._length) {
            throw new RangeError(`Index out of bounds: ${index}`);
        }

        // 3. 查找插入位置
        let left = this._findNode(index);
        let right = left.right;

        // 4. 创建新节点
        let newItems = [];
        let newId = this._doc.generateNextId();

        for (const chunk of contentBlocks) {
            const item = new Item(
                newId++,                           // 唯一 ID
                this._doc.clientID,                 // 客户端 ID
                left,                              // 左节点
                right,                             // 右节点
                this._doc,                          // 文档引用
                {
                    content: chunk,                 // 内容
                    type: 'text',                   // 类型
                    deleted: false,                 // 删除标记
                }
            );

            newItems.push(item);

            // 5. 链接节点
            if (left) left.right = item;
            if (right) right.left = item;

            // 6. 更新指针
            left = item;
        }

        // 7. 发送操作到其他客户端
        this._doc.transact(() => {
            for (const item of newItems) {
                item.integrate(this);
            }
        });

        // 8. 更新长度
        this._length += content.length;
    }

    // ===== 核心删除操作 =====
    delete(index, length) {
        // 1. 验证索引
        if (index < 0 || index + length > this._length) {
            throw new RangeError(`Invalid delete range`);
        }

        // 2. 查找要删除的节点
        const nodesToDelete = this._findNodesInRange(index, length);

        // 3. 标记删除 (软删除)
        this._doc.transact(() => {
            for (const node of nodesToDelete) {
                node.markDeleted();
            }
        });

        // 4. 发送删除操作
        this._doc.updateClients();

        // 5. 更新长度
        this._length -= length;
    }

    // ===== 转换文本为块 =====
    _toContentChunks(content) {
        // 将字符串分割为小块 (优化同步效率)
        const MAX_BLOCK_SIZE = 32;
        const chunks = [];

        for (let i = 0; i < content.length; i += MAX_BLOCK_SIZE) {
            chunks.push(content.slice(i, i + MAX_BLOCK_SIZE));
        }

        return chunks;
    }

    // ===== 查找指定索引位置的节点 =====
    _findNode(index) {
        // 从头部遍历
        let current = this._start;
        let currentIndex = 0;

        while (current && !current.deleted) {
            const currentLength = current.content.length;

            // 检查索引是否在当前节点内
            if (currentIndex + currentLength > index) {
                return { node: current, offset: index - currentIndex };
            }

            currentIndex += currentLength;
            current = current.right;
        }

        return { node: null, offset: 0 };
    }

    // ===== 合并相邻节点 (优化压缩) =====
    _mergeAdjacentNodes() {
        let current = this._start;

        while (current && current.right) {
            // 如果两个节点都属于同一客户端且都未被删除
            if (current.right.clientID === this._doc.clientID &&
                !current.deleted && !current.right.deleted) {

                // 合并内容
                current.content += current.right.content;

                // 调整指针
                current.right = current.right.right;
                if (current.right) {
                    current.right.left = current;
                }
            } else {
                current = current.right;
            }
        }
    }

    // ===== 转换为字符串 =====
    toString() {
        let result = '';
        let current = this._start;

        while (current) {
            if (!current.deleted) {
                result += current.content;
            }
            current = current.right;
        }

        return result;
    }
}
```

### 6.2 Item 节点数据结构

```javascript
// ===== Item 节点源码原理 =====

class Item {
    constructor(id, clientID, left, right, doc, content) {
        // ===== 唯一标识 =====
        this.id = id;                     // Lamport 时钟 + clientID
        this.clientID = clientID;           // 创建者客户端 ID
        this.clock = id[0];               // Lamport 时钟值

        // ===== 双向链表指针 =====
        this.left = left;                 // 左兄弟节点
        this.right = right;               // 右兄弟节点

        // ===== 内容 =====
        this.content = content;            // 实际内容 (字符串/对象)
        this.type = content.type;          // 节点类型
        this.deleted = false;              // 删除标记

        // ===== 文档引用 =====
        this._doc = doc;

        // ===== 集成状态 =====
        this.integrated = false;           // 是否已集成到文档
        this.missing = false;             // 是否缺失依赖
    }

    // ===== 集成节点到文档 =====
    integrate(parent) {
        if (this.integrated) return;

        // 1. 检查依赖是否满足
        if (this.missing) {
            // 等待缺失节点到达
            return;
        }

        // 2. 找到插入位置
        let current = parent._start;

        while (current && current !== this) {
            // 使用 Lamport 时钟比较
            if (this._shouldPlaceAfter(current)) {
                break;
            }
            current = current.right;
        }

        // 3. 插入到链表
        this.left = current ? current.left : null;
        this.right = current;

        if (this.left) {
            this.left.right = this;
        } else {
            parent._start = this;
        }

        if (this.right) {
            this.right.left = this;
        }

        // 4. 标记已集成
        this.integrated = true;

        // 5. 触发观察者
        parent._doc.emit('change', {
            type: 'insert',
            content: this.content
        });
    }

    // ===== 判断节点顺序 (CRDT 核心算法) =====
    _shouldPlaceAfter(other) {
        // 1. 比较 Lamport 时钟 (时间顺序)
        if (this.clock !== other.clock) {
            return this.clock > other.clock;
        }

        // 2. 时钟相同，比较客户端 ID (解决冲突)
        if (this.clientID !== other.clientID) {
            return this.clientID > other.clientID;
        }

        // 3. 相同节点
        return false;
    }

    // ===== 标记为已删除 =====
    markDeleted() {
        if (this.deleted) return;

        this.deleted = true;

        // 触发删除事件
        this._doc.emit('change', {
            type: 'delete',
            length: this.content.length
        });
    }

    // ===== 编码为二进制格式 (用于网络传输) =====
    encode(encoder) {
        // 写入 Lamport 时钟
        encoder.writeUint32(this.clock);

        // 写入客户端 ID
        encoder.writeVarUint(this.clientID);

        // 写入节点类型
        encoder.writeUint8(this.type);

        // 写入内容
        encoder.writeString(this.content);

        // 写入删除标记
        encoder.writeBoolean(this.deleted);
    }

    // ===== 从二进制解码 =====
    static decode(decoder) {
        const clock = decoder.readUint32();
        const clientID = decoder.readVarUint();
        const type = decoder.readUint8();
        const content = decoder.readString();
        const deleted = decoder.readBoolean();

        const id = [clock, clientID];

        return new Item(id, clientID, null, null, null, {
            content,
            type,
            deleted
        });
    }
}
```

### 6.3 Y.Doc 文档结构

```javascript
// ===== Y.Doc 核心文档源码原理 =====

class YDoc {
    constructor() {
        // ===== 客户端 ID =====
        this.clientID = Math.random() * 2**32;  // 随机生成

        // ===== Lamport 时钟 =====
        this.clock = 0;                         // 逻辑时钟

        // ===== 状态向量 (用于增量同步) =====
        this.stateVector = new Map();

        // ===== 共享数据类型存储 =====
        this.share = new Map();

        // ===== 观察者 =====
        this._observers = new Map();

        // ===== 待应用的操作队列 =====
        this._pendingUpdates = [];

        // ===== 事务栈 =====
        this._transactionStack = [];

        // ===== 客户端集合 =====
        this._clients = new Set();
    }

    // ===== 生成唯一 ID =====
    generateNextId() {
        this.clock++;
        return [this.clock, this.clientID];
    }

    // ===== 创建共享类型 =====
    getText(name) {
        if (!this.share.has(name)) {
            const text = new YText();
            this.share.set(name, text);
        }
        return this.share.get(name);
    }

    getArray(name) {
        if (!this.share.has(name)) {
            const array = new YArray();
            this.share.set(name, array);
        }
        return this.share.get(name);
    }

    getMap(name) {
        if (!this.share.has(name)) {
            const map = new YMap();
            this.share.set(name, map);
        }
        return this.share.get(name);
    }

    // ===== 事务处理 (原子操作) =====
    transact(transaction, origin = null) {
        // 1. 检查是否在事务中
        const currentTransaction = this._transactionStack[this._transactionStack.length - 1];

        if (currentTransaction) {
            // 嵌套事务: 直接执行
            transaction();
            return;
        }

        // 2. 开始新事务
        this._beginTransaction(origin);

        try {
            // 3. 执行事务操作
            transaction();

            // 4. 提交事务
            this._commitTransaction();
        } catch (error) {
            // 5. 回滚事务
            this._rollbackTransaction();
            throw error;
        }
    }

    _beginTransaction(origin) {
        this._transactionStack.push({
            origin,
            beforeState: new Map(this.stateVector),
            changes: []
        });
    }

    _commitTransaction() {
        const transaction = this._transactionStack.pop();

        // 更新状态向量
        this.stateVector.set(this.clientID, this.clock);

        // 触发所有变更
        for (const change of transaction.changes) {
            this._emitChange(change);
        }
    }

    _rollbackTransaction() {
        this._transactionStack.pop();
    }

    // ===== 应用远程更新 =====
    applyUpdate(update) {
        // 1. 解码更新
        const decoder = new UpdateDecoderV1(update);
        const updateType = decoder.readUint8();

        if (updateType === 1) {  // 同步更新
            // 2. 读取客户端 ID 和时钟
            const clientID = decoder.readVarUint();
            const clock = decoder.readVarUint();

            // 3. 读取并应用操作
            while (decoder.hasNext()) {
                const item = Item.decode(decoder);
                const parent = this.share.get(item.parentName);

                if (parent) {
                    item.integrate(parent);
                } else {
                    // 节点缺失，等待父节点
                    this._missingNodes.add(item.id);
                }
            }

            // 4. 更新状态向量
            this.stateVector.set(clientID, Math.max(
                this.stateVector.get(clientID) || 0,
                clock
            ));

        } else if (updateType === 0) {  // 增量更新
            // 处理增量更新
            this._applyIncrementalUpdate(decoder);
        }
    }

    // ===== 编码状态向量 =====
    encodeStateVector() {
        const encoder = new Encoder();

        for (const [clientID, clock] of this.stateVector) {
            encoder.writeVarUint(clientID);
            encoder.writeVarUint(clock);
        }

        return encoder.toUint8Array();
    }

    // ===== 编码文档状态 =====
    encodeStateAsUpdate(stateVector = this.encodeStateVector()) {
        const encoder = new Encoder();
        encoder.writeUint8(1);  // 完整更新类型

        // 写入时钟信息
        encoder.writeVarUint(this.clientID);
        encoder.writeVarUint(this.clock);

        // 遍历所有共享类型
        for (const [name, type] of this.share) {
            // 写入类型名称
            encoder.writeString(name);

            // 写入类型标识
            if (type instanceof YText) {
                encoder.writeUint8(0);  // YText
            } else if (type instanceof YArray) {
                encoder.writeUint8(1);  // YArray
            } else if (type instanceof YMap) {
                encoder.writeUint8(2);  // YMap
            }

            // 写入内容
            this._encodeType(type, encoder, stateVector);
        }

        return encoder.toUint8Array();
    }

    _encodeType(type, encoder, stateVector) {
        if (type instanceof YText) {
            // 遍历文本节点
            let current = type._start;
            while (current) {
                // 只编码新内容 (不在状态向量中)
                const clientClock = stateVector.get(current.clientID) || 0;
                if (current.clock > clientClock) {
                    current.encode(encoder);
                }
                current = current.right;
            }
        } else if (type instanceof YArray) {
            // 遍历数组元素
            for (let i = 0; i < type._array.length; i++) {
                const item = type._array[i];
                item.encode(encoder);
            }
        }
    }

    // ===== 合并更新 =====
    static mergeUpdates(updates) {
        // 创建解码器数组
        const decoders = updates.map(u => new UpdateDecoderV1(u));

        // 创建编码器
        const encoder = new Encoder();
        encoder.writeUint8(2);  // 合并更新类型

        // 合并客户端 ID
        const clientIDs = new Set();
        decoders.forEach(d => {
            d.clientID = d.readVarUint();
            clientIDs.add(d.clientID);
        });

        encoder.writeVarUint(clientIDs.size);
        for (const clientID of clientIDs) {
            encoder.writeVarUint(clientID);
        }

        return encoder.toUint8Array();
    }

    // ===== 销毁文档 =====
    destroy() {
        // 清理所有共享类型
        for (const type of this.share.values()) {
            type.destroy();
        }

        // 清理观察者
        this._observers.clear();

        // 清理事务栈
        this._transactionStack = [];
    }
}
```

### 6.4 Y.Array 数组类型实现

```javascript
// ===== Y.Array 内部实现源码原理 =====

class YArray extends YAbstractType {
    constructor() {
        super();
        this._array = [];           // 内部数组
        this._length = 0;          // 数组长度
    }

    // ===== 插入元素 =====
    insert(index, elements) {
        // 1. 验证索引
        if (index < 0 || index > this._length) {
            throw new RangeError(`Index out of bounds: ${index}`);
        }

        // 2. 在事务中执行
        this._doc.transact(() => {
            // 3. 创建 Item 节点
            const newItems = elements.map((element) => {
                const id = this._doc.generateNextId();
                return new Item(
                    id,
                    this._doc.clientID,
                    null,           // array 没有顺序
                    null,
                    this._doc,
                    {
                        content: element,
                        type: 'array-element',
                        deleted: false
                    }
                );
            });

            // 4. 插入到数组
            this._array.splice(index, 0, ...newItems);

            // 5. 集成节点
            for (const item of newItems) {
                item.integrate(this);
            }

            // 6. 更新长度
            this._length += elements.length;
        });

        return this;
    }

    // ===== 删除元素 =====
    delete(index, length) {
        // 1. 验证范围
        if (index < 0 || index + length > this._length) {
            throw new RangeError(`Invalid delete range`);
        }

        // 2. 在事务中执行
        this._doc.transact(() => {
            // 3. 获取要删除的元素
            const deletedItems = this._array.splice(index, length);

            // 4. 标记删除
            for (const item of deletedItems) {
                item.markDeleted();
            }

            // 5. 更新长度
            this._length -= length;
        });

        return this;
    }

    // ===== 获取元素 =====
    get(index) {
        if (index < 0 || index >= this._length) {
            return undefined;
        }

        const item = this._array[index];
        return item.content;
    }

    // ===== 转换为普通数组 =====
    toArray() {
        return this._array
            .filter(item => !item.deleted)
            .map(item => item.content);
    }

    // ===== 推入元素 =====
    push(...elements) {
        return this.insert(this._length, elements);
    }

    // ===== 弹出元素 =====
    pop() {
        const last = this.get(this._length - 1);
        this.delete(this._length - 1, 1);
        return last;
    }

    // ===== 遍历数组 =====
    forEach(callback) {
        for (let i = 0; i < this._length; i++) {
            const item = this.get(i);
            if (item !== undefined) {
                callback(item, i, this);
            }
        }
    }
}
```

### 6.5 Y.Map 映射类型实现

```javascript
// ===== Y.Map 内部实现源码原理 =====

class YMap extends YAbstractType {
    constructor() {
        super();
        this._map = new Map();        // 内部 Map
    }

    // ===== 设置值 =====
    set(key, value) {
        const oldValue = this._map.get(key);

        this._doc.transact(() => {
            // 1. 创建 Item 节点
            const id = this._doc.generateNextId();
            const item = new Item(
                id,
                this._doc.clientID,
                null,
                null,
                this._doc,
                {
                    key,
                    content: value,
                    type: 'map-entry',
                    deleted: false
                }
            );

            // 2. 设置新值
            this._map.set(key, item);

            // 3. 标记旧值为已删除 (如果存在)
            if (oldValue) {
                oldValue.markDeleted();
            }

            // 4. 集成新节点
            item.integrate(this);
        });

        return this;
    }

    // ===== 获取值 =====
    get(key) {
        const item = this._map.get(key);
        return item (item && !item.deleted) ? item.content : undefined;
    }

    // ===== 删除键 =====
    delete(key) {
        const item = this._map.get(key);
        if (!item) return false;

        this._doc.transact(() => {
            item.markDeleted();
            this._map.delete(key);
        });

        return true;
    }

    // ===== 检查键是否存在 =====
    has(key) {
        const item = this._map.get(key);
        return item && !item.deleted;
    }

    // ===== 获取所有键 =====
    keys() {
        return Array.from(this._map.keys()).filter(key => {
            const item = this._map.get(key);
            return item && !item.deleted;
        });
    }

    // ===== 转换为普通对象 =====
    toJSON() {
        const result = {};
        for (const key of this.keys()) {
            result[key] = this.get(key);
        }
        return result;
    }
}
```

### 6.6 状态向量与增量同步

```javascript
// ===== 状态向量管理源码原理 =====

class StateVector {
    constructor() {
        // 存储 [clientID => clock]
        this.vector = new Map();
    }

    // ===== 更新状态 =====
    update(clientID, clock) {
        const currentClock = this.vector.get(clientID) || 0;
        this.vector.set(clientID, Math.max(currentClock, clock));
    }

    // ===== 获取时钟 =====
    getClock(clientID) {
        return this.vector.get(clientID) || 0;
    }

    // ===== 比较状态向量 =====
    compare(otherVector) {
        // 检查当前向量是否 >= otherVector
        for (const [clientID, clock] of otherVector.vector) {
            const currentClock = this.vector.get(clientID) || 0;
            if (currentClock < clock) {
                return false;  // 当前向量落后
            }
        }
        return true;  // 当前向量 >= otherVector
    }

    // ===== 编码为二进制 =====
    encode() {
        const encoder = new Encoder();
        encoder.writeVarUint(this.vector.size);

        for (const [clientID, clock] of this.vector) {
            encoder.writeVarUint(clientID);
            encoder.writeVarUint(clock);
        }

        return encoder.toUint8Array();
    }

    // ===== 从二进制解码 =====
    static decode(data) {
        const decoder = new Decoder(data);
        const vector = new StateVector();
        const size = decoder.readVarUint();

        for (let i = 0; i < size; i++) {
            const clientID = decoder.readVarUint();
            const clock = decoder.readVarUint();
            vector.update(clientID, clock);
        }

        return vector;
    }

    // ===== 计算差异 (增量更新) =====
    diff(otherVector) {
        // 返回其他向量中比当前向量新的操作
        const updates = [];

        for (const [clientID, clock] of otherVector.vector) {
            const currentClock = this.vector.get(clientID) || 0;
            if (clock > currentClock) {
                updates.push({
                    clientID,
                    from: currentClock,
                    to: clock
                });
            }
        }

        return updates;
    }

    // ===== 合并状态向量 =====
    merge(otherVector) {
        const merged = new StateVector();

        // 合并两个向量的最大值
        for (const vector of [this, otherVector]) {
            for (const [clientID, clock] of vector.vector) {
                merged.update(clientID, clock);
            }
        }

        return merged;
    }
}

// ===== 增量同步协议 =====

class IncrementalSync {
    constructor(doc) {
        this.doc = doc;
        this.pendingUpdates = new Map();
    }

    // ===== 请求增量更新 =====
    requestIncrementalUpdates(stateVector) {
        // 1. 解码状态向量
        const remoteVector = StateVector.decode(stateVector);
        const localVector = new StateVector(this.doc.stateVector);

        // 2. 计算差异
        const diffs = localVector.diff(remoteVector);

        // 3. 收集增量更新
        const incrementalUpdates = [];
        for (const diff of diffs) {
            // 收集客户端从 from 到 to 的所有操作
            const updates = this._collectUpdates(diff.clientID, diff.from, diff.to);
            incrementalUpdates.push(...updates);
        }

        // 4. 编码并发送
        return this._encodeIncrementalUpdates(incrementalUpdates);
    }

    // ===== 收集操作 =====
    _collectUpdates(clientID, from, to) {
        const updates = [];

        // 遍历所有共享类型
        for (const [name, type] of this.doc.share) {
            // 遍历类型中的 Item
            if (type instanceof YText) {
                let current = type._start;
                while (current) {
                    if (current.clientID === clientID &&
                        current.clock > from &&
                        current.clock <= to) {
                        updates.push(current);
                    }
                    current = current.right;
                }
            }
        }

        return updates;
    }

    // ===== 应用增量更新 =====
    applyIncrementalUpdates(updates) {
        // 1. 解码更新
        const decoder = new UpdateDecoderV1(updates);

        // 2. 应用每个更新
        while (decoder.hasNext()) {
            const item = Item.decode(decoder);
            const parent = this.doc.share.get(item.parentName);

            if (parent) {
                item.integrate(parent);
            } else {
                // 父节点不存在，延迟处理
                this.pendingUpdates.set(item.id, item);
            }
        }
    }
}
```

---

## 总结

实时协作与 Socket 通信是现代 Web 应用的核心技术。通过本教程，你应该能够：

1. **WebSocket 基础**：理解 WebSocket 协议和使用方法
2. **Socket.io Client**：掌握 Socket.io 的高级特性和 React 集成
3. **Yjs CRDT 原理**：理解 CRDT 数据结构和冲突解决算法
4. **y-websocket**：实现多客户端实时同步
5. **项目实践**：构建实际的协作编辑器、白板、状态同步等组件
6. **Yjs 源码架构**：理解 Item 节点、Y.Doc 文档、Lamport 时钟等核心数据结构
7. **状态向量同步**：掌握增量同步和冲突解决机制
8. **CRDT 算法实现**：理解 YText、YArray、YMap 的内部实现

在 WebEnv 项目中，Socket.io.io 用于实现实时通信功能，Yjs 用于实现代码协作编辑、实时状态同步等特性，为用户提供流畅的多人协作体验。

---

## 参考资源

- [WebSocket MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.io 官方文档](https://socket.io/docs/)
- [Yjs 官方文档](https://docs.yjs.dev/)
- [y-websocket GitHub](https://github.com/yjs/y-websocket)
- [y-monaco GitHub](https://github.com/yjs/y-monaco)
