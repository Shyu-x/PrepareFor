# Socket Context

## 一、Context 概述

### 1.1 什么是 React Context

React Context 是 React 提供的状态共享机制，允许数据在组件树中全局共享，无需逐层传递 props。

### 1.2 为什么需要 GameSocketContext

在 UNO 游戏中，Socket 连接需要在多个组件间共享：
- page.tsx（主页面）
- Scene3D/Scene2D（游戏场景）
- HUD（信息栏）
- GameOverlay（弹窗）

使用 Context 可以避免"Props 穿透"问题。

---

## 二、Context 结构详解

### 2.1 Provider 结构

```typescript
// frontend/src/context/GameSocketContext.tsx

/**
 * Socket 连接上下文。
 *
 * 提供：
 * - socket: Socket.IO 连接实例
 * - 连接状态管理
 * - 游戏操作方法（出牌、摸牌等）
 *
 * 使用方式：
 * const { socket, playCard } = useGameSocket();
 */
interface GameSocketContextType {
  // Socket 实例
  socket: Socket | null;

  // 连接状态
  isConnected: boolean;
  isReconnecting: boolean;

  // 房间操作
  joinRoom: (roomId: string, playerName: string, config?, inviteToken?) => void;
  leaveRoom: () => void;

  // 游戏操作
  addAi: (roomId: string, difficulty?: AIDifficulty) => void;
  startGame: (roomId: string) => void;
  playCard: (roomId: string, cardId: string, colorSelection?: CardColor) => void;
  drawCard: (roomId: string) => void;
  shoutUno: (roomId: string) => void;
  catchUnoFailure: (roomId: string, targetId: string) => void;
  challenge: (roomId: string, accept: boolean) => void;
  handlePendingDrawPlay: (roomId: string, play: boolean) => void;
}
```

### 2.2 核心实现

```typescript
// frontend/src/context/GameSocketContext.tsx

const GameSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ============ 状态 ============
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 获取 Store 方法
  const {
    gameState,
    roomId,
    setGameState,
    setPlayerInfo,
    setRoomId,
    setInviteToken,
    setConnected,
    setReconnecting,
    addNotification,
    resetGame,
  } = useGameStore();

  // ============ Socket 初始化 ============
  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['polling'],  // 使用 HTTP 长轮询
      forceNew: true,
    });

    socketRef.current = socket;

    // 连接事件
    socket.on('connect', () => {
      setIsConnected(true);
      setConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnected(false);
    });

    socket.on('reconnect_attempt', () => {
      setIsReconnecting(true);
      setReconnecting(true);
    });

    socket.on('reconnect', () => {
      setIsReconnecting(false);
      setReconnecting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ============ 游戏状态监听 ============
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // 游戏状态更新
    socket.on('gameStateUpdate', (state: GameState) => {
      setGameState(state);
    });

    // 重连凭据
    socket.on('reconnectCredentials', (data) => {
      const { sessionId, reconnectToken, inviteToken } = data;
      setPlayerInfo(socket.id!, '');  // 后续会从 gameState 获取名称
      if (inviteToken) setInviteToken(inviteToken);

      // 保存到 localStorage
      saveRoomReconnectCredential(roomId!, {
        sessionId,
        reconnectToken,
      });
    });

    // 错误处理
    socket.on('error', (error) => {
      addNotification({
        type: 'error',
        message: error.message || '操作失败',
      });
    });

    // 房间关闭
    socket.on('roomClosed', ({ reason }) => {
      addNotification({
        type: 'warning',
        message: reason || '房间已关闭',
      });
      resetGame();
    });

    // 玩家状态更新
    socket.on('playerStatusUpdate', (data) => {
      // 更新玩家在线状态
    });

    // UNO 喊叫广播
    socket.on('playerShoutedUno', ({ playerId }) => {
      addNotification({
        type: 'info',
        message: '玩家已喊 UNO！',
      });
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('reconnectCredentials');
      socket.off('error');
      socket.off('roomClosed');
      socket.off('playerStatusUpdate');
      socket.off('playerShoutedUno');
    };
  }, [roomId]);

  // ============ 方法定义 ============
  const joinRoom = useCallback((roomId: string, playerName: string, config?, inviteToken?) => {
    const socket = socketRef.current;
    if (!socket) return;

    // 检查本地存储的重连凭据
    const credential = getRoomReconnectCredential(roomId);

    socket.emit('joinRoom', {
      roomId,
      playerName,
      config,
      inviteToken,
      isReconnect: !!credential,
      ...credential,
    });

    setRoomId(roomId);
  }, [setRoomId]);

  const playCard = useCallback((roomId: string, cardId: string, colorSelection?: CardColor) => {
    const socket = socketRef.current;
    if (!socket || !roomId) return;

    socket.emit('playCard', { roomId, cardId, colorSelection });
  }, []);

  const drawCard = useCallback((roomId: string) => {
    const socket = socketRef.current;
    if (!socket || !roomId) return;

    socket.emit('drawCard', { roomId });
  }, []);

  // ... 其他方法类似

  // ============ 提供 Context ============
  const value: GameSocketContextType = {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    joinRoom,
    // ... 其他方法
  };

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
};
```

---

## 三、Socket 事件映射

### 3.1 客户端 → 服务器事件

| 事件名 | Context 方法 | 用途 |
|--------|-------------|------|
| `joinRoom` | joinRoom() | 加入房间 |
| `addAi` | addAi() | 添加 AI |
| `startGame` | startGame() | 开始游戏 |
| `playCard` | playCard() | 出牌 |
| `drawCard` | drawCard() | 摸牌 |
| `shoutUno` | shoutUno() | 喊 UNO |
| `catchUnoFailure` | catchUnoFailure() | 抓漏 |
| `challenge` | challenge() | 质疑 |
| `handlePendingDrawPlay` | handlePendingDrawPlay() | 摸牌决策 |

### 3.2 服务器 → 客户端事件

| 事件名 | 处理方式 | 用途 |
|--------|---------|------|
| `gameStateUpdate` | setGameState() | 游戏状态同步 |
| `reconnectCredentials` | 保存凭据 | 重连凭据 |
| `error` | addNotification() | 错误提示 |
| `roomClosed` | resetGame() | 房间关闭 |
| `playerStatusUpdate` | 更新状态 | 玩家在线状态 |
| `playerShoutedUno` | addNotification() | UNO 喊叫 |

---

## 四、重连机制

### 4.1 重连凭据流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      重连凭据流程                                 │
│                                                                  │
│  1. 首次加入                                                     │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│     │ 用户加入  │───▶│ 后端验证  │───▶│ 返回凭据  │            │
│     └──────────┘    └──────────┘    └────┬─────┘            │
│                                          │                    │
│                                          ▼                    │
│                                    ┌────────────┐             │
│                                    │ 保存到      │             │
│                                    │ localStorage            │
│                                    └────────────┘             │
│                                                                  │
│  2. 断线重连                                                     │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│     │ 读取凭据  │───▶│ 发送凭据  │───▶│ 恢复状态  │            │
│     └──────────┘    └──────────┘    └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 凭据存储

```typescript
// localStorage 存储结构
{
  "uno_room_reconnect_credentials_v1": {
    "room123": {
      "sessionId": "abc123",
      "reconnectToken": "xyz789"
    }
  }
}
```

---

## 五、心跳机制

### 5.1 心跳流程

```typescript
// 每 30 秒发送一次心跳
useEffect(() => {
  const interval = setInterval(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, 30000);

  return () => clearInterval(interval);
}, []);

// 接收 pong
socket.on('pong', () => {
  // 心跳响应
});
```

---

## 六、使用示例

### 6.1 在组件中使用

```typescript
// 在任意组件中获取 Socket Context
function GameControls() {
  const { playCard, drawCard, shoutUno, isConnected } = useGameSocket();

  if (!isConnected) {
    return <div>连接中...</div>;
  }

  return (
    <div>
      <button onClick={() => drawCard(roomId)}>摸牌</button>
      <button onClick={() => shoutUno(roomId)}>喊 UNO</button>
    </div>
  );
}
```

---

## 七、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
