# Hooks 使用详解

## 一、React Hooks 概述

### 1.1 什么是 Hooks

Hooks 是 React 16.8 引入的特性，允许在函数组件中使用 state 和其他 React 特性。

### 1.2 本项目使用的 Hooks

| Hook | 使用场景 |
|------|---------|
| useState | 组件局部状态 |
| useEffect | 副作用处理 |
| useCallback | 回调函数缓存 |
| useMemo | 计算结果缓存 |
| useRef | DOM 引用/可变值 |
| useContext | Context 消费 |
| useReducer | 复杂状态逻辑 |

---

## 二、各 Hook 详细使用

### 2.1 useState

```typescript
// 基础使用
const [viewMode, setViewMode] = useState<'2d' | '3d' | 'classic'>('3d');

// 函数式初始化（惰性初始化）
const [tempName, setTempName] = useState(() => generateRandomNickname());
```

### 2.2 useEffect

```typescript
// Socket 事件监听
useEffect(() => {
  const socket = socketRef.current;
  if (!socket) return;

  socket.on('gameStateUpdate', (state) => {
    setGameState(state);
  });

  return () => {
    socket.off('gameStateUpdate');  // 清理函数
  };
}, [roomId]);  // 依赖数组

// 定时器
useEffect(() => {
  const interval = setInterval(() => {
    // 定时逻辑
  }, 30000);

  return () => clearInterval(interval);  // 清理定时器
}, []);
```

### 2.3 useCallback

```typescript
/**
 * 缓存回调函数，避免子组件不必要渲染。
 *
 * 当依赖变化时，会返回新的函数引用。
 */
const handlePlayCard = useCallback((cardId: string) => {
  socket?.emit('playCard', { roomId, cardId });
}, [socket, roomId]);
```

### 2.4 useMemo

```typescript
/**
 * 缓存计算结果，避免重复计算。
 *
 * 只有依赖变化时才会重新计算。
 */

// 筛选可出牌
const playableCards = useMemo(() => {
  if (!gameState) return [];
  const me = gameState.players.find(p => p.id === playerId);
  if (!me) return [];

  return me.hand.filter(card => {
    // 出牌逻辑判断
    return isPlayable(card, gameState);
  });
}, [gameState, playerId]);

// 派生状态计算
const currentPlayer = useMemo(() => {
  if (!gameState) return null;
  return gameState.players[gameState.currentPlayerIndex];
}, [gameState]);
```

### 2.5 useRef

```typescript
/**
 * useRef 用于：
 * 1. 访问 DOM 元素
 * 2. 存储可变值（不触发渲染）
 * 3. 保存上一次的值的引用
 */

// 1. 访问 DOM
const canvasRef = useRef<HTMLCanvasElement>(null);

// 2. 存储可变值（用于需要保持引用但不需要渲染的场景）
const socketRef = useRef<Socket | null>(null);

// 3. 保存上一次的值
const prevStatusRef = useRef<GameStatus | null>(null);
useEffect(() => {
  if (gameState?.status !== prevStatusRef.current) {
    // 状态变化处理
    prevStatusRef.current = gameState?.status || null;
  }
}, [gameState?.status]);
```

### 2.6 useContext

```typescript
// 消费 Context
const { socket, playCard, drawCard } = useGameSocket();

// 底层原理
const context = useContext(GameSocketContext);
// 相当于：
// GameSocketContext 内部维护了一个 value，
// 当 value 变化时，使用 useContext 的组件会重新渲染
```

---

## 三、自定义 Hooks

### 3.1 useResponsive

```typescript
// frontend/src/hooks/useResponsive.ts

/**
 * 响应式检测 Hook。
 *
 * 功能：
 * - 监听窗口大小变化
 * - 检测设备类型 (mobile/tablet/desktop)
 * - 检测屏幕方向 (portrait/landscape)
 *
 * Returns:
 *   deviceType: 设备类型
 *   orientation: 屏幕方向
 *
 * Side Effects:
 *   - 添加 window resize 监听器
 */
export function useResponsive() {
  const setLayout = useGameStore((state) => state.setLayout);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 设备类型判断
      let deviceType: DeviceType = 'desktop';
      if (width < 768) {
        deviceType = 'mobile';
      } else if (width < 1024) {
        deviceType = 'tablet';
      }

      // 屏幕方向判断
      const orientation: Orientation = height > width ? 'portrait' : 'landscape';

      setLayout(deviceType, orientation);
    };

    // 初始化
    handleResize();

    // 监听
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [setLayout]);
}
```

### 3.2 useSoundEffects

```typescript
// frontend/src/hooks/useSoundEffects.ts

/**
 * 音效反馈 Hook。
 *
 * 功能：
 * - 监听游戏状态变化
 * - 播放对应音效
 * - 震动反馈（移动端）
 *
 * Side Effects:
 * - 播放音效
 * - 调用 navigator.vibrate()
 */
export function useSoundEffects() {
  const gameState = useGameStore((state) => state.gameState);
  const masterVolume = useGameStore((state) => state.masterVolume);

  // 监听游戏状态变化
  useEffect(() => {
    if (!gameState) return;

    // 游戏开始音效
    if (gameState.status === GameStatus.PLAYING) {
      playSound('gameStart', masterVolume);
    }

    // 游戏结束音效
    if (gameState.status === GameStatus.GAME_OVER) {
      playSound('gameOver', masterVolume);
    }
  }, [gameState, masterVolume]);
}
```

---

## 四、性能优化模式

### 4.1 避免不必要渲染

```typescript
// ❌ 不推荐：每次渲染都创建新函数
function BadExample({ onPlayCard }) {
  return <Card onClick={(id) => onPlayCard(id)} />;
}

// ✅ 推荐：使用 useCallback 缓存
const handlePlayCard = useCallback((id: string) => {
  onPlayCard(id);
}, [onPlayCard]);

return <Card onClick={handlePlayCard} />;
```

### 4.2 避免重复计算

```typescript
// ❌ 不推荐：每次渲染都重新计算
function BadExample({ cards, gameState }) {
  const playableCards = cards.filter(card => isPlayable(card, gameState));
  return <div>{playableCards.length} 张可出牌</div>;
}

// ✅ 推荐：使用 useMemo 缓存
function GoodExample({ cards, gameState }) {
  const playableCards = useMemo(() => {
    return cards.filter(card => isPlayable(card, gameState));
  }, [cards, gameState]);

  return <div>{playableCards.length} 张可出牌</div>;
}
```

### 4.3 细粒度订阅

```typescript
// ❌ 不推荐：订阅整个 Store
const { gameState, playerId, roomId } = useGameStore();

// ✅ 推荐：只订阅需要的片段
const gameState = useGameStore((state) => state.gameState);
const playerId = useGameStore((state) => state.playerId);
// gameState 变化时，只有使用了 gameState 的部分会重新渲染
```

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
