# 源码深度分析 - UnoThree前端桌面渲染系统

## 一、文档概述

本文档深入分析 UnoThree 项目的前端桌面渲染系统，涵盖 2D/3D 双模式渲染、卡牌组件系统、Socket 连接管理、状态管理、音效系统等核心实现。

---

## 二、项目结构总览

```
unothree/frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # 主页面 - UNO 主题建房页
│   │   ├── layout.tsx                        # 全局布局
│   │   └── globals.css                       # 全局样式
│   ├── components/
│   │   ├── Card.tsx                          # 2D 卡片组件（小尺寸、列表）
│   │   ├── Card2D.tsx                        # 2D 渲染模式卡片（角标与椭圆装饰）
│   │   └── game/
│   │       ├── Scene3D.tsx                   # 3D 场景与摄像机逻辑
│   │       ├── Card3D.tsx                    # three.js 卡牌交互
│   │       ├── Scene2D.tsx                   # 2D 渲染模式场景
│   │       ├── Table2D.tsx                   # 2D 桌面
│   │       ├── PlayerArea2D.tsx              # 2D 玩家区域
│   │       ├── Hand2D.tsx                    # 2D 手牌区
│   │       ├── Deck2D.tsx                    # 2D 牌堆
│   │       ├── DiscardPile2D.tsx             # 2D 弃牌堆
│   │       └── HUD.tsx                       # 顶部/侧边 HUD、PlayerCard
│   ├── context/
│   │   └── GameSocketContext.tsx             # Socket 客户端连接管理
│   ├── hooks/
│   │   ├── useResponsive.ts                  # 响应式检测
│   │   └── useSoundEffects.ts                # 音效管理 hook
│   ├── store/
│   │   └── useGameStore.ts                   # Zustand 状态管理
│   └── types/
│       └── game.ts                           # 游戏类型定义（与后端同步）
└── public/
    └── ...                                   # 静态资源
```

---

## 三、页面级协调器 - UnoGamePage (page.tsx)

### 3.1 核心职责

- 实现 **UNO 主题建房页**，支持三种房间配置：
  - 标准 4 人房间
  - 大房间 8 人
  - 超大房间 12 人
- **2D/3D 模式切换**：通过 `viewMode` 状态切换渲染视图
- 集成 `useSoundEffects` hook 管理游戏音效
- 协调所有 Modal 弹窗（颜色选择、挑战、分数榜、摸牌决策等）
- 桥接 `useGameSocket` 与游戏逻辑

### 3.2 关键状态定义

```typescript
// 房间配置类型
interface RoomConfig {
  mode: 'standard' | 'large' | 'extra-large';  // 房间模式
  playerLimit: 4 | 8 | 12;                      // 玩家上限
  deckCount: number;                            // 牌组数量
  maxRounds: number;                            // 最大回合数
  maxScore: number;                             // 最大分数
}

// 建房页面状态
const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');  // 视图模式
const [gameState, setGameState] = useState<GameState | null>(null);  // 游戏状态
const [colorModalVisible, setColorModalVisible] = useState(false);  // 颜色选择弹窗
const [selectedCardId, setSelectedCardId] = useState<string | null>(null);  // 选中的卡牌 ID
const [selectedColor, setSelectedColor] = useState<CardColor>(CardColor.RED);  // 选中的颜色
```

### 3.3 房间创建流程

```typescript
// 创建房间（标准模式示例）
const handleCreateStandardRoom = () => {
  const config: RoomConfig = {
    mode: 'standard',
    playerLimit: 4,
    deckCount: 1,
    maxRounds: 6,
    maxScore: 500,
  };
  const roomId = generateRoomId();
  createRoom(roomId, playerName, config);
};

// 创建房间（大房间模式示例）
const handleCreateLargeRoom = () => {
  const config: RoomConfig = {
    mode: 'large',
    playerLimit: 8,
    deckCount: 2,  // 双倍牌组
    maxRounds: 8,
    maxScore: 1000,
  };
  const roomId = generateRoomId();
  createRoom(roomId, playerName, config);
};

// 房间 ID 生成策略（UUID v4）
const generateRoomId = (): string => {
  return uuidv4().slice(0, 8).toUpperCase();  // 8位短ID，如 "A1B2C3D4"
};
```

### 3.4 出牌与颜色选择逻辑

```typescript
// 卡牌点击处理
const onCardClick = (cardId: string, type: CardType, color: CardColor) => {
  // 检查是否为当前玩家回合
  if (gameState && gameState.players[gameState.currentPlayerIndex].id !== playerId) {
    showNotification('不是你的回合', 'warning');
    return;
  }

  // WILD 牌需要选择颜色
  if (color === CardColor.WILD) {
    setSelectedCardId(cardId);
    setColorModalVisible(true);
  } else {
    playCard(gameState!.roomId, cardId);
  }
};

// 颜色确认处理
const handleColorConfirm = () => {
  if (selectedCardId && gameState) {
    playCard(gameState.roomId, selectedCardId, selectedColor);
    setColorModalVisible(false);
    setSelectedCardId(null);
  }
};
```

### 3.5 UNO 按钮显示逻辑

```typescript
// UNO 按钮显示条件：手牌 <= 2 张
{me && me.hand.length <= 2 && (
  <motion.button
    onClick={() => shoutUno(gameState!.roomId)}
    initial={{ scale: 0.8 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="uno-button"
  >
    {me.hasShoutedUno ? <CheckCircleOutlined /> : "UNO!"}
  </motion.button>
)}
```

---

## 四、Socket 连接管理 - GameSocketContext

### 4.1 Socket.IO 配置

```typescript
// Socket.IO 客户端配置
const socket = io(SERVER_URL, {
  reconnection: true,              // 自动重连
  reconnectionAttempts: 5,         // 重连尝试次数
  reconnectionDelay: 1000,         // 重连延迟 1 秒
  reconnectionDelayMax: 16000,     // 最大重连延迟 16 秒（指数退避）
  randomizationFactor: 0,          // 随机因子为 0（确定性退避）
  transports: ['websocket', 'polling'],  // 优先 WebSocket，降级 polling
  forceNew: true,                  // 强制创建新连接
  path: '/uno-socket/',            // Socket.IO 路径（nginx 反向代理配置）
});
```

### 4.2 连接与重连策略

#### 连接建立

```typescript
socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);

  // 保存玩家 ID
  setPlayerInfo(socket.id || '', playerName);

  // 尝试从 localStorage 恢复房间
  const savedRoomId = roomId || (typeof window !== 'undefined' ? localStorage.getItem('uno_room_id') : null);
  const savedPlayerName = playerName || (typeof window !== 'undefined' ? localStorage.getItem('uno_player_name') : null);

  if (savedRoomId && savedPlayerName) {
    // 尝试重新加入房间（断线重连）
    socket.emit('joinRoom', {
      roomId: savedRoomId,
      playerName: savedPlayerName,
      isReconnect: true,
      sessionId: sessionId,
      reconnectToken: reconnectToken,
    });
  }

  // 启动心跳
  startHeartbeat();
});
```

#### 重连逻辑

```typescript
// 重连状态检测
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`[Socket] Reconnection attempt ${attemptNumber}/5`);

  // 根据重连尝试次数显示不同提示
  if (attemptNumber <= 2) {
    setReconnectStatus('短断线重连中...');
  } else if (attemptNumber <= 4) {
    setReconnectStatus('长断线重连中...');
  } else {
    setReconnectStatus('重连失败，请刷新页面');
  }
});

// 重连成功
socket.on('reconnect', () => {
  console.log('[Socket] Reconnected successfully');
  setReconnectStatus('重连成功');
  setTimeout(() => setReconnectStatus(null), 2000);  // 2秒后隐藏提示
});

// 重连失败
socket.on('reconnect_failed', () => {
  console.error('[Socket] Reconnection failed');
  setReconnectStatus('重连失败，请刷新页面');
});
```

### 4.3 心跳机制

```typescript
// 心跳启动
const startHeartbeat = () => {
  stopHeartbeat();  // 先停止已有的心跳定时器
  heartbeatTimer.current = setInterval(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');  // 发送心跳
    }
  }, 30000);  // 30 秒间隔
};

// 心跳停止
const stopHeartbeat = () => {
  if (heartbeatTimer.current) {
    clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = null;
  }
};

// 接收 pong 响应
socket.on('pong', () => {
  console.log('[Socket] Heartbeat acknowledged');
  lastHeartbeatRef.current = Date.now();  // 更新最后心跳时间
});
```

### 4.4 游戏状态同步

```typescript
// 接收游戏状态更新（脱敏后）
socket.on('gameStateUpdate', (state: GameState) => {
  console.log('[Socket] Game state update received');
  store.setGameState(state);  // 更新 Zustand store

  // 保存房间信息到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('uno_room_id', state.roomId);
  }
});

// 接收重连凭据
socket.on('reconnectCredentials', (credentials: { sessionId: string; reconnectToken: string }) => {
  console.log('[Socket] Reconnect credentials received');
  setSessionInfo(credentials.sessionId, credentials.reconnectToken);

  // 保存重连凭据到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('uno_session_id', credentials.sessionId);
    localStorage.setItem('uno_reconnect_token', credentials.reconnectToken);
  }
});

// 接收玩家状态更新
socket.on('playerStatusUpdate', (data: { playerId: string; isConnected: boolean }) => {
  console.log('[Socket] Player status update:', data);
  store.updatePlayerStatus(data.playerId, data.isConnected);
});

// 接收玩家喊 UNO
socket.on('playerShoutedUno', (playerId: string) => {
  console.log('[Socket] Player shouted UNO:', playerId);
  showNotification(`${players.find(p => p.id === playerId)?.name || 'Unknown'} 喊了 UNO!`, 'info');
});

// 接收房间关闭通知
socket.on('roomClosed', (data: { roomId: string; reason: string }) => {
  console.log('[Socket] Room closed:', data);
  showNotification(`房间已关闭: ${data.reason}`, 'error');
  store.clearGameState();  // 清理本地状态
});

// 接收错误信息
socket.on('error', (message: string) => {
  console.error('[Socket] Error received:', message);
  showNotification(message, 'error');
});
```

### 4.5 重连凭据策略

```typescript
// 凭据类型
interface ReconnectCredentials {
  sessionId: string;       // 会话 ID（UUID v4）
  reconnectToken: string;  // 重连令牌（随机字符串，32位）
}

// 凭据保存与读取
const saveCredentials = (roomId: string, playerName: string, credentials: ReconnectCredentials) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('uno_room_id', roomId);
    localStorage.setItem('uno_player_name', playerName);
    localStorage.setItem('uno_session_id', credentials.sessionId);
    localStorage.setItem('uno_reconnect_token', credentials.reconnectToken);
  }
};

const loadCredentials = (): { roomId: string; playerName: string; credentials?: ReconnectCredentials } | null => {
  if (typeof window === 'undefined') return null;

  const roomId = localStorage.getItem('uno_room_id');
  const playerName = localStorage.getItem('uno_player_name');
  const sessionId = localStorage.getItem('uno_session_id');
  const reconnectToken = localStorage.getItem('uno_reconnect_token');

  if (!roomId || !playerName) return null;

  return {
    roomId,
    playerName,
    credentials: sessionId && reconnectToken ? { sessionId, reconnectToken } : undefined,
  };
};
```

---

## 五、状态管理 - useGameStore

### 5.1 Store 结构定义

```typescript
interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  playerId: string | null;
  playerName: string | null;
  roomId: string | null;

  // 连接状态
  isConnected: boolean;
  isReconnecting: boolean;

  // UI 状态
  notifications: Notification[];

  // 会话信息
  sessionId?: string;
  reconnectToken?: string;
  inviteToken?: string;

  // 设备信息（响应式）
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';

  // 方法
  setGameState: (state: GameState) => void;
  setPlayerInfo: (id: string, name: string) => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updatePlayerStatus: (playerId: string, isConnected: boolean) => void;
  clearGameState: () => void;
  setDeviceType: (type: 'mobile' | 'tablet' | 'desktop') => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setSessionInfo: (sessionId: string, reconnectToken: string) => void;
}
```

### 5.2 Zustand Store 实现

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      gameState: null,
      playerId: null,
      playerName: null,
      roomId: null,
      isConnected: false,
      isReconnecting: false,
      notifications: [],
      deviceType: 'desktop',
      orientation: 'landscape',
      sessionId: undefined,
      reconnectToken: undefined,
      inviteToken: undefined,

      // 设置游戏状态
      setGameState: (state) => set({ gameState: state }),

      // 设置玩家信息
      setPlayerInfo: (id, name) => set({ playerId: id, playerName: name }),

      // 设置连接状态
      setConnected: (connected) => set({ isConnected: connected }),

      // 设置重连状态
      setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

      // 添加通知
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, notification],
      })),

      // 移除通知
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

      // 清空通知
      clearNotifications: () => set({ notifications: [] }),

      // 更新玩家状态
      updatePlayerStatus: (playerId, isConnected) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          players: state.gameState.players.map((p) =>
            p.id === playerId ? { ...p, isConnected } : p
          ),
        } : null,
      })),

      // 清空游戏状态
      clearGameState: () => set({
        gameState: null,
        playerId: null,
        playerName: null,
        roomId: null,
        sessionId: undefined,
        reconnectToken: undefined,
        inviteToken: undefined,
      }),

      // 设置设备类型
      setDeviceType: (type) => set({ deviceType: type }),

      // 设置屏幕方向
      setOrientation: (orientation) => set({ orientation: orientation }),

      // 设置会话信息
      setSessionInfo: (sessionId, reconnectToken) => set({ sessionId, reconnectToken }),
    }),
    {
      name: 'uno-game-store',  // localStorage key
      // 只持久化必要字段，不持久化 gameState（由 Socket 同步）
      partialize: (state) => ({
        playerName: state.playerName,
        sessionId: state.sessionId,
        reconnectToken: state.reconnectToken,
      }),
    }
  )
);
```

### 5.3 细粒度订阅

```typescript
// 在组件中订阅特定状态，避免不必要的重渲染
const currentPlayer = useGameStore((state) =>
  state.gameState?.players[state.gameState.currentPlayerIndex]
);

const myHand = useGameStore((state) =>
  state.gameState?.players.find(p => p.id === state.playerId)?.hand
);

const isMyTurn = useGameStore((state) =>
  state.gameState?.players[state.gameState.currentPlayerIndex].id === state.playerId
);
```

---

## 六、响应式检测 - useResponsive

### 6.1 Hook 实现

```typescript
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * 检测设备类型和屏幕方向
 * @returns void（更新 store 中的 deviceType 和 orientation）
 */
export const useResponsive = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateDeviceType = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // 设备类型判断
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) {
        deviceType = 'mobile';
      } else if (width < 1024) {
        deviceType = 'tablet';
      }

      // 屏幕方向判断
      const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

      // 更新 store
      useGameStore.getState().setDeviceType(deviceType);
      useGameStore.getState().setOrientation(orientation);
    };

    // 初始化
    updateDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', updateDeviceType);

    return () => {
      window.removeEventListener('resize', updateDeviceType);
    };
  }, []);

  return mounted;
};
```

### 6.2 使用示例

```typescript
// 在主页面中使用
export default function UnoGamePage() {
  useResponsive();  // 启动响应式检测

  const deviceType = useGameStore((state) => state.deviceType);
  const orientation = useGameStore((state) => state.orientation);

  // 根据设备类型调整布局
  return (
    <div className={`uno-page ${deviceType} ${orientation}`}>
      {/* ... */}
    </div>
  );
}
```

---

## 七、音效系统 - useSoundEffects

### 7.1 音效资源

```typescript
// 音效类型枚举
enum SoundEffect {
  CARD_PLAY = 'card-play',           // 出牌
  CARD_DRAW = 'card-draw',           // 摸牌
  UNO = 'uno',                       // 喊 UNO
  GAME_OVER = 'game-over',           // 游戏结束
  ROUND_FINISHED = 'round-finished', // 回合结束
  CHALLENGE = 'challenge',           // 质疑
  SKIP = 'skip',                     // 跳过
  REVERSE = 'reverse',               // 反转
  DRAW_TWO = 'draw-two',             // +2
  WILD = 'wild',                     // 万能牌
  WILD_DRAW_FOUR = 'wild-draw-four', // +4
  NOTIFICATION = 'notification',     // 通知
  ERROR = 'error',                   // 错误
}

// 音效文件路径
const SOUND_FILES: Record<SoundEffect, string> = {
  [SoundEffect.CARD_PLAY]: '/sounds/card-play.mp3',
  [SoundEffect.CARD_DRAW]: '/sounds/card-draw.mp3',
  [SoundEffect.UNO]: '/sounds/uno.mp3',
  [SoundEffect.GAME_OVER]: '/sounds/game-over.mp3',
  [SoundEffect.ROUND_FINISHED]: '/sounds/round-finished.mp3',
  [SoundEffect.CHALLENGE]: '/sounds/challenge.mp3',
  [SoundEffect.SKIP]: '/sounds/skip.mp3',
  [SoundEffect.REVERSE]: '/sounds/reverse.mp3',
  [SoundEffect.DRAW_TWO]: '/sounds/draw-two.mp3',
  [SoundEffect.WILD]: '/sounds/wild.mp3',
  [SoundEffect.WILD_DRAW_FOUR]: '/sounds/wild-draw-four.mp3',
  [SoundEffect.NOTIFICATION]: '/sounds/notification.mp3',
  [SoundEffect.ERROR]: '/sounds/error.mp3',
};
```

### 7.2 Hook 实现

```typescript
import { useRef, useCallback } from 'react';

/**
 * 音效管理 Hook
 * @returns {playSound} 播放音效函数
 */
export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * 播放音效
   * @param effect - 音效类型
   * @param volume - 音量（0-1），默认 0.5
   */
  const playSound = useCallback((effect: SoundEffect, volume: number = 0.5) => {
    if (typeof window === 'undefined') return;

    // 懒加载 AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const audio = new Audio(SOUND_FILES[effect]);
    audio.volume = volume;

    // 使用 AudioContext 管理音频（避免多个音效重叠）
    const source = audioContext.createMediaElementSource(audio);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.value = volume;

    audio.play().catch((error) => {
      console.error(`Failed to play sound ${effect}:`, error);
    });
  }, []);

  return { playSound };
};
```

### 7.3 使用示例

```typescript
// 在主页面中使用
export default function UnoGamePage() {
  const { playSound } = useSoundEffects();

  const handlePlayCard = () => {
    playSound(SoundEffect.CARD_PLAY, 0.5);
    // ... 出牌逻辑
  };

  const handleDrawCard = () => {
    playSound(SoundEffect.CARD_DRAW, 0.5);
    // ... 摸牌逻辑
  };

  const handleShoutUno = () => {
    playSound(SoundEffect.UNO, 0.7);  // UNO 音量稍大
    // ... 喊 UNO 逻辑
  };

  return <div>{/* ... */}</div>;
};
```

---

## 八、3D 渲染系统 - Scene3D

### 8.1 摄像机配置

```typescript
// 摄像机位置配置
const CAMERA_CONFIG = {
  // 主摄像机（玩家视角）
  main: {
    position: [0, 22, 35],    // 摄像机位置：Y轴22，Z轴35
    target: [0, 0, 0],        // 目标点：牌桌中心
    fov: 45,                  // 视场角 45 度
  },
  // 俯视图（调试用）
  top: {
    position: [0, 50, 0],
    target: [0, 0, 0],
    fov: 60,
  },
};
```

### 8.2 玩家位置布局

```typescript
// 玩家位置配置（以牌桌中心 [0, 0, 0] 为原点）
const PLAYER_POSITIONS: Record<number, [number, number, number]> = {
  0: [0, 0, 16],    // 玩家 1（我）：Z轴16，面向中心
  1: [16, 0, 0],    // 玩家 2（右）：X轴16，面向中心
  2: [0, 0, -16],   // 玩家 3（对家）：Z轴-16，面向中心
  3: [-16, 0, 0],   // 玩家 4（左）：X轴-16，面向中心
  // 更多玩家位置（大房间模式）：
  4: [12, 0, 12],   // 玩家 5（右上）
  5: [12, 0, -12],  // 玩家 6（右下）
  6: [-12, 0, -12], // 玩家 7（左下）
  7: [-12, 0, 12],  // 玩家 8（左上）
};
```

### 8.3 手牌布局

```typescript
// 手牌布局配置
interface HandLayoutConfig {
  radius: number;        // 手牌弧度半径
  spacing: number;       // 卡牌间距
  angleRange: number;    // 角度范围（弧度）
  rotationOffset: number; // 旋转偏移（弧度）
  tilt: number;          // 仰角（弧度，让牌面可见）
}

const HAND_LAYOUT_CONFIG: Record<'mobile' | 'tablet' | 'desktop', HandLayoutConfig> = {
  mobile: {
    radius: 8,
    spacing: 0.6,
    angleRange: Math.PI * 0.6,
    rotationOffset: Math.PI / 2,
    tilt: -0.45,  // 仰角约 25.8 度
  },
  tablet: {
    radius: 10,
    spacing: 0.7,
    angleRange: Math.PI * 0.5,
    rotationOffset: Math.PI / 2,
    tilt: -0.45,
  },
  desktop: {
    radius: 12,
    spacing: 0.8,
    angleRange: Math.PI * 0.4,
    rotationOffset: Math.PI / 2,
    tilt: -0.45,
  },
};

/**
 * 计算手牌位置
 * @param cardIndex - 卡牌索引
 * @param cardCount - 卡牌总数
 * @param deviceType - 设备类型
 * @returns 卡牌位置和旋转角度
 */
function calculateHandCardPosition(
  cardIndex: number,
  cardCount: number,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): { position: [number, number, number]; rotation: [number, number, number] } {
  const config = HAND_LAYOUT_CONFIG[deviceType];

  // 计算角度
  const angleStart = -config.angleRange / 2;
  const angleStep = cardCount > 1 ? config.angleRange / (cardCount - 1) : 0;
  const angle = angleStart + angleStep * cardIndex;

  // 计算位置（极坐标转笛卡尔坐标）
  const x = config.radius * Math.sin(angle);
  const z = config.radius * Math.cos(angle);
  const y = 0.5;  // 牌桌上方

  // 计算旋转角度
  const rotationX = config.tilt;  // 仰角
  const rotationY = -angle;       // 绕Y轴旋转（朝向玩家）
  const rotationZ = 0;

  return {
    position: [x, y, z],
    rotation: [rotationX, rotationY, rotationZ],
  };
}
```

### 8.4 3D 场景组件实现

```typescript
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

/**
 * 3D 游戏场景组件
 */
export default function Scene3D() {
  const gameState = useGameStore((state) => state.gameState);
  const deviceType = useGameStore((state) => state.deviceType);
  const playerId = useGameStore((state) => state.playerId);

  return (
    <Canvas
      camera={{
        position: CAMERA_CONFIG.main.position,
        fov: CAMERA_CONFIG.main.fov,
      }}
      shadows
      gl={{ antialias: true }}
    >
      <OrbitControls
        target={CAMERA_CONFIG.main.target}
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={Math.PI / 4}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      <Table />
      <Deck />
      <DiscardPile />
      <PlayerAreas />

      {gameState?.players.map((player, index) => (
        <PlayerHand key={player.id} player={player} index={index} isMe={player.id === playerId} />
      ))}
    </Canvas>
  );
}

/**
 * 牌桌组件
 */
function Table() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#1a5e1a" />
    </mesh>
  );
}

/**
 * 牌堆组件
 */
function Deck() {
  return (
    <group position={[-8, 0.5, 0]}>
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[0, i * 0.01, 0]} castShadow>
          <boxGeometry args={[3, 0.1, 4.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 弃牌堆组件
 */
function DiscardPile() {
  const gameState = useGameStore((state) => state.gameState);
  const topCard = gameState?.discardPile[gameState.discardPile.length - 1];

  if (!topCard) return null;

  return (
    <group position={[8, 0.5, 0]}>
      <Card3D card={topCard} isFaceUp={true} onClick={() => {}} />
    </group>
  );
}

/**
 * 玩家手牌组件
 */
function PlayerHand({ player, index, isMe }: { player: Player; index: number; isMe: boolean }) {
  const gameState = useGameStore((state) => state.gameState);
  const deviceType = useGameStore((state) => state.deviceType);

  // 玩家位置
  const position = PLAYER_POSITIONS[index];

  // 如果不是当前玩家，只显示牌背
  if (!isMe) {
    return (
      <group position={position}>
        <PlayerAvatar player={player} />
        <OpponentHand count={player.hand.length} />
      </group>
    );
  }

  // 显示当前玩家的手牌
  return (
    <group position={position}>
      <PlayerAvatar player={player} />
      {player.hand.map((card, i) => {
        const { position: cardPosition, rotation: cardRotation } = calculateHandCardPosition(
          i,
          player.hand.length,
          deviceType
        );

        return (
          <Card3D
            key={card.id}
            card={card}
            isFaceUp={true}
            position={cardPosition}
            rotation={cardRotation}
            onClick={() => handleCardClick(card.id)}
          />
        );
      })}
    </group>
  );
}
```

---

## 九、2D 渲染系统 - Scene2D

### 9.1 2D 场景组件结构

```typescript
// 2D 渲染模式使用纯 SVG 组件
export default function Scene2D() {
  const gameState = useGameStore((state) => state.gameState);
  const playerId = useGameStore((state) => state.playerId);

  return (
    <div className="scene-2d">
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <Table2D />
        <Deck2D />
        <DiscardPile2D />

        {gameState?.players.map((player, index) => (
          <PlayerArea2D
            key={player.id}
            player={player}
            index={index}
            isMe={player.id === playerId}
          />
        ))}
      </svg>
    </div>
  );
}
```

### 9.2 2D 卡牌组件

```typescript
/**
 * 2D 卡牌组件（带角标和椭圆装饰）
 */
export function Card2D({ card, isFaceUp }: { card: Card; isFaceUp: boolean }) {
  const cardColor = getCardColorHex(card.color);
  const cardType = card.type;

  return (
    <g className="card-2d" transform={`translate(0, 0)`}>
      {/* 卡牌背景 */}
      <rect
        x="-40"
        y="-60"
        width="80"
        height="120"
        rx="8"
        fill={cardColor}
        stroke="#333"
        strokeWidth="2"
      />

      {isFaceUp && (
        <>
          {/* 左上角角标 */}
          <text x="-30" y="-40" fontSize="16" fill="#fff" fontWeight="bold">
            {getCardSymbol(cardType)}
          </text>

          {/* 中央椭圆装饰 */}
          <ellipse cx="0" cy="0" rx="30" ry="45" fill="#fff" opacity="0.3" />

          {/* 中央符号 */}
          <text x="0" y="10" fontSize="32" fill="#fff" textAnchor="middle" fontWeight="bold">
            {getCardSymbol(cardType)}
          </text>

          {/* 右下角角标（旋转180度） */}
          <text
            x="30"
            y="40"
            fontSize="16"
            fill="#fff"
            fontWeight="bold"
            transform={`rotate(180, 30, 40)`}
          >
            {getCardSymbol(cardType)}
          </text>

          {/* 数值（如果是数字牌） */}
          {card.type === CardType.NUMBER && card.value !== undefined && (
            <text x="0" y="50" fontSize="24" fill="#fff" textAnchor="middle" fontWeight="bold">
              {card.value}
            </text>
          )}
        </>
      )}

      {!isFaceUp && (
        <>
          {/* 牌背图案 */}
          <rect x="-35" y="-55" width="70" height="110" rx="6" fill="#333" />
          <circle cx="0" cy="0" r="25" fill="#444" />
          <text x="0" y="8" fontSize="24" fill="#fff" textAnchor="middle" fontWeight="bold">
            UNO
          </text>
        </>
      )}
    </g>
  );
}

/**
 * 获取卡牌颜色十六进制值
 */
function getCardColorHex(color: CardColor): string {
  switch (color) {
    case CardColor.RED:
      return '#ff4444';
    case CardColor.YELLOW:
      return '#ffdd00';
    case CardColor.GREEN:
      return '#44cc44';
    case CardColor.BLUE:
      return '#4488ff';
    case CardColor.WILD:
      return '#333';
    default:
      return '#333';
  }
}

/**
 * 获取卡牌符号
 */
function getCardSymbol(type: CardType): string {
  switch (type) {
    case CardType.SKIP:
      return '⊘';
    case CardType.REVERSE:
      return '⇄';
    case CardType.DRAW_TWO:
      return '+2';
    case CardType.WILD:
      return '★';
    case CardType.WILD_DRAW_FOUR:
      return '+4';
    default:
      return '';
  }
}
```

---

## 十、卡牌组件系统

### 10.1 卡牌类型定义

```typescript
// 卡牌颜色枚举
export enum CardColor {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  WILD = 'WILD',
}

// 卡牌类型枚举
export enum CardType {
  NUMBER = 'NUMBER',            // 数字牌
  SKIP = 'SKIP',                // 跳过
  REVERSE = 'REVERSE',          // 反转
  DRAW_TWO = 'DRAW_TWO',        // +2
  WILD = 'WILD',                // 万能牌
  WILD_DRAW_FOUR = 'WILD_DRAW_FOUR',  // +4
}

// 卡牌接口
export interface Card {
  id: string;                   // 卡牌唯一 ID（UUID v4）
  color: CardColor;             // 卡牌颜色
  type: CardType;               // 卡牌类型
  value?: number;               // 数字牌数值（0-9）
}
```

### 10.2 3D 卡牌组件

```typescript
import { useRef, useState } from 'react';
import { Mesh, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Card3DProps {
  card: Card;
  isFaceUp: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
}

/**
 * 3D 卡牌组件（支持交互动画）
 */
export function Card3D({ card, isFaceUp, position = [0, 0, 0], rotation = [0, 0, 0], onClick }: Card3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayed, setIsPlayed] = useState(false);

  // 悬停动画
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isHovered) {
      // 悬停时向上移动
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 1, delta * 10);
    } else {
      // 恢复原位
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, delta * 10);
    }

    if (isPlayed) {
      // 出牌动画（飞向弃牌堆）
      const targetPosition = new THREE.Vector3(8, 0.5, 0);
      meshRef.current.position.lerp(targetPosition, delta * 5);
      meshRef.current.rotation.y += delta * 10;  // 旋转
    }
  });

  const cardColor = getCardColorHex(card.color);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onClick={onClick}
        castShadow
      >
        <boxGeometry args={[3, 0.1, 4.5]} />
        <meshStandardMaterial color={cardColor} />
      </mesh>

      {isFaceUp && (
        <group position={[0, 0.06, 0]}>
          {/* 中央符号 */}
          <Text
            position={[0, 0.5, 0]}
            fontSize={1}
            color="#fff"
            anchorX="center"
            anchorY="middle"
          >
            {getCardSymbol(card.type)}
          </Text>

          {/* 数值（如果是数字牌） */}
          {card.type === CardType.NUMBER && card.value !== undefined && (
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.8}
              color="#fff"
              anchorX="center"
            >
              {card.value}
            </Text>
          )}

          {/* WILD 牌四色切片 */}
          {card.color === CardColor.WILD && (
            <group position={[0, 0, 0.01]}>
              <mesh position={[0.75, 0.75, 0]}>
                <boxGeometry args={[0.75, 0.05, 1.125]} />
                <meshStandardMaterial color="#ff4444" />
              </mesh>
              <mesh position={[-0.75, 0.75, 0]}>
                <boxGeometry args={[0.75, 0.05, 1.125]} />
                <meshStandardMaterial color="#44cc44" />
              </mesh>
              <mesh position={[0.75, -0.75, 0]}>
                <boxGeometry args={[0.75, 0.05, 1.125]} />
                <meshStandardMaterial color="#ffdd00" />
              </mesh>
              <mesh position={[-0.75, -0.75, 0]}>
                <boxGeometry args={[0.75, 0.05, 1.125]} />
                <meshStandardMaterial color="#4488ff" />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
}
```

---

## 十一、HUD（抬头显示）组件

### 11.1 HUD 组件结构

```typescript
/**
 * HUD（抬头显示）组件
 * 显示游戏信息、玩家信息、操作按钮等
 */
export default function HUD() {
  const gameState = useGameStore((state) => state.gameState);
  const playerId = useGameStore((state) => state.playerId);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === playerId);
  const targetForCatch = gameState.players.find(p => p.hand.length === 1 && !p.hasShoutedUno);

  return (
    <div className="hud">
      {/* 顶部信息栏 */}
      <div className="hud-top">
        <div className="hud-info">
          <span>房间: {gameState.roomId}</span>
          <span>回合: {gameState.currentRound}</span>
          <span>方向: {gameState.direction === 1 ? '顺时针' : '逆时针'}</span>
        </div>
        <div className="hud-controls">
          <button onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}>
            {viewMode === '2d' ? '切换到 3D' : '切换到 2D'}
          </button>
          <button onClick={() => setShowScoreboard(true)}>分数榜</button>
        </div>
      </div>

      {/* 侧边玩家列表 */}
      <div className="hud-sidebar">
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isMe={player.id === playerId}
            isCurrentPlayer={gameState.players[gameState.currentPlayerIndex].id === player.id}
            canCatch={!!targetForCatch && targetForCatch.id === player.id && player.id !== playerId}
            onCatch={() => catchUnoFailure(gameState.roomId, player.id)}
          />
        ))}
      </div>

      {/* UNO 按钮 */}
      {me && me.hand.length <= 2 && (
        <div className="hud-uno">
          <motion.button
            onClick={() => shoutUno(gameState.roomId)}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {me.hasShoutedUno ? <CheckCircleOutlined /> : 'UNO!'}
          </motion.button>
        </div>
      )}

      {/* 通知列表 */}
      <div className="hud-notifications">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 11.2 玩家卡片组件

```typescript
interface PlayerCardProps {
  player: Player;
  isMe: boolean;
  isCurrentPlayer: boolean;
  canCatch: boolean;
  onCatch: () => void;
}

/**
 * 玩家卡片组件
 */
function PlayerCard({ player, isMe, isCurrentPlayer, canCatch, onCatch }: PlayerCardProps) {
  return (
    <div className={`player-card ${isMe ? 'me' : ''} ${isCurrentPlayer ? 'current' : ''}`}>
      <div className="player-card-header">
        <span className="player-name">{player.name}</span>
        {isMe && <span className="player-badge">我</span>}
        {isCurrentPlayer && <span className="player-badge current">当前回合</span>}
        {!player.isConnected && <span className="player-badge offline">离线</span>}
      </div>
      <div className="player-card-body">
        <span className="player-score">分数: {player.score}</span>
        <span className="player-hand-count">手牌: {player.handCount}</span>
        {player.hasShoutedUno && <span className="player-badge uno">UNO</span>}
      </div>
      {canCatch && (
        <button className="catch-button" onClick={onCatch}>
          抓漏!
        </button>
      )}
    </div>
  );
}
```

---

## 十二、Modal 弹窗系统

### 12.1 颜色选择弹窗

```typescript
interface ColorPickerModalProps {
  visible: boolean;
  selectedColor: CardColor;
  onSelect: (color: CardColor) => void;
  onConfirm: () => void;
}

/**
 * 颜色选择弹窗（WILD 牌使用）
 */
export function ColorPickerModal({ visible, selectedColor, onSelect, onConfirm }: ColorPickerModalProps) {
  if (!visible) return null;

  const colors: CardColor[] = [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE];

  return (
    <Modal visible={visible} title="选择颜色" onConfirm={onConfirm}>
      <div className="color-picker">
        {colors.map(color => (
          <button
            key={color}
            className={`color-button ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: getCardColorHex(color) }}
            onClick={() => onSelect(color)}
          >
            {color}
          </button>
        ))}
      </div>
    </Modal>
  );
}
```

### 12.2 质疑弹窗

```typescript
interface ChallengeModalProps {
  visible: boolean;
  challenger: Player;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * 质疑弹窗（+4 牌使用）
 */
export function ChallengeModal({ visible, challenger, onAccept, onDecline }: ChallengeModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} title="质疑 +4" onConfirm={onAccept} onCancel={onDecline}>
      <p>
        {challenger.name} 打出了 +4 牌，你可以质疑他是否有其他可出的同色牌。
      </p>
      <p>如果质疑成功，他将被罚摸 6 张；如果质疑失败，你将被罚摸 6 张。</p>
      <div className="challenge-actions">
        <button className="challenge-accept" onClick={onAccept}>
          质疑
        </button>
        <button className="challenge-decline" onClick={onDecline}>
          不质疑
        </button>
      </div>
    </Modal>
  );
}
```

### 12.3 分数榜弹窗

```typescript
interface ScoreboardModalProps {
  visible: boolean;
  players: Player[];
  onClose: () => void;
}

/**
 * 分数榜弹窗
 */
export function ScoreboardModal({ visible, players, onClose }: ScoreboardModalProps) {
  if (!visible) return null;

  // 按分数降序排列
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Modal visible={visible} title="分数榜" onClose={onClose}>
      <div className="scoreboard">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className={`scoreboard-row rank-${index + 1}`}>
            <span className="rank">{index + 1}</span>
            <span className="name">{player.name}</span>
            <span className="score">{player.score}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
```

### 12.4 摸牌决策弹窗

```typescript
interface DrawDecisionModalProps {
  visible: boolean;
  card: Card;
  onPlay: () => void;
  onKeep: () => void;
}

/**
 * 摸牌决策弹窗（摸到的牌可以打出时）
 */
export function DrawDecisionModal({ visible, card, onPlay, onKeep }: DrawDecisionModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} title="摸到了一张牌" onConfirm={onPlay} onCancel={onKeep}>
      <div className="draw-decision">
        <Card card={card} isFaceUp={true} />
        <p>你可以选择打出这张牌，或者保留它。</p>
      </div>
    </Modal>
  );
}
```

---

## 十三、通知系统

### 13.1 通知类型

```typescript
interface Notification {
  id: string;                // 通知 ID（UUID v4）
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;           // 通知内容
  duration?: number;         // 显示时长（毫秒），默认 3000
}
```

### 13.2 通知组件

```typescript
interface NotificationProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * 通知组件
 */
function Notification({ notification, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, notification.duration || 3000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  return (
    <div className={`notification notification-${notification.type}`}>
      <span className="notification-icon">
        {notification.type === 'info' && <InfoCircleOutlined />}
        {notification.type === 'warning' && <WarningOutlined />}
        {notification.type === 'error' && <CloseCircleOutlined />}
        {notification.type === 'success' && <CheckCircleOutlined />}
      </span>
      <span className="notification-message">{notification.message}</span>
      <button className="notification-close" onClick={onClose}>
        <CloseOutlined />
      </button>
    </div>
  );
}
```

---

## 十四、样式系统

### 14.1 Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'uno-red': '#ff4444',
        'uno-yellow': '#ffdd00',
        'uno-green': '#44cc44',
        'uno-blue': '#4488ff',
        'uno-black': '#333333',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 12px rgba(0, 0, 0, 0.2)',
        'modal': '0 20px 25px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
```

### 14.2 全局样式

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --uno-red: #ff4444;
  --uno-yellow: #ffdd00;
  --uno-green: #44cc44;
  --uno-blue: #4488ff;
  --uno-black: #333333;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a5e1a;
  color: #fff;
}

/* 3D 场景样式 */
.scene-3d {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 2D 场景样式 */
.scene-2d {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: #1a5e1a;
}

/* HUD 样式 */
.hud {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

.hud-top,
.hud-sidebar,
.hud-uno,
.hud-notifications {
  pointer-events: auto;
}

/* 卡牌样式 */
.card-2d {
  transition: transform 0.2s ease;
}

.card-2d:hover {
  transform: translateY(-5px);
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
}

/* 通知样式 */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 十五、性能优化

### 15.1 React.memo 优化

```typescript
// 使用 React.memo 避免不必要的重渲染
export const Card3D = React.memo(({ card, isFaceUp, position, rotation, onClick }: Card3DProps) => {
  // ... 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.isFaceUp === nextProps.isFaceUp &&
    prevProps.position === nextProps.position &&
    prevProps.rotation === nextProps.rotation
  );
});
```

### 15.2 useMemo 优化

```typescript
// 使用 useMemo 缓存计算结果
const handCards = useMemo(() => {
  return player.hand.map((card, index) => {
    const { position, rotation } = calculateHandCardPosition(index, player.hand.length, deviceType);
    return { card, position, rotation };
  });
}, [player.hand, deviceType]);
```

### 15.3 useCallback 优化

```typescript
// 使用 useCallback 缓存事件处理函数
const handleCardClick = useCallback((cardId: string) => {
  if (gameState && gameState.players[gameState.currentPlayerIndex].id === playerId) {
    onCardClick(cardId);
  }
}, [gameState, playerId, onCardClick]);
```

### 15.4 虚拟化渲染

```typescript
// 对于大量卡牌，使用虚拟化渲染
import { FixedSizeList as List } from 'react-window';

function VirtualizedHand({ cards }: { cards: Card[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <Card card={cards[index]} />
    </div>
  );

  return (
    <List
      height={150}
      itemCount={cards.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

---

## 十六、总结

UnoThree 前端桌面渲染系统是一个功能完整的 3D/2D 双模式 UNO 游戏客户端，具有以下特点：

1. **双模式渲染**：支持 2D（SVG）和 3D（Three.js）两种渲染模式，可通过 `viewMode` 状态切换
2. **Socket 连接管理**：完整的重连机制，包括心跳检测、重连凭据、状态同步
3. **状态管理**：使用 Zustand 进行状态管理，支持细粒度订阅和持久化
4. **响应式设计**：支持移动端、平板、桌面三种设备类型，自动调整布局
5. **音效系统**：完整的音效管理，支持多种游戏事件音效
6. **HUD 组件**：抬头显示系统，显示游戏信息、玩家信息、操作按钮等
7. **Modal 弹窗**：完整的弹窗系统，支持颜色选择、质疑、分数榜、摸牌决策等
8. **通知系统**：实时通知系统，支持多种通知类型
9. **性能优化**：使用 React.memo、useMemo、useCallback、虚拟化渲染等优化技术

---

*文档版本: 1.0*
*最后更新: 2026-03-11*