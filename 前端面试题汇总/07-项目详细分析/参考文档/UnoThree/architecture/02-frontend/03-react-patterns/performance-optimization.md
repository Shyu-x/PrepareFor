# 性能优化

## 一、React 性能优化概述

### 1.1 性能问题来源

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 不必要渲染 | 状态/Props 变化 | useMemo/useCallback |
| 重复计算 | 渲染时重复计算 | useMemo |
| Context 穿透 | Context 变化 | 分离 Context |
| 大列表渲染 | 渲染大量元素 | 虚拟列表 |

---

## 二、本项目性能优化实践

### 2.1 useCallback 优化

```typescript
// frontend/src/app/page.tsx

/**
 * 使用 useCallback 缓存回调函数。
 *
 * 避免子组件因函数引用变化而不必要渲染。
 */
const handlePlayCard = useCallback((cardId: string, colorSelection?: CardColor) => {
  if (!socket || !roomId) return;
  socket.emit('playCard', { roomId, cardId, colorSelection });
}, [socket, roomId]);

const handleDrawCard = useCallback(() => {
  if (!socket || !roomId) return;
  socket.emit('drawCard', { roomId });
}, [socket, roomId]);

const handleShoutUno = useCallback(() => {
  if (!socket || !roomId) return;
  socket.emit('shoutUno', { roomId });
}, [socket, roomId]);
```

### 2.2 useMemo 优化

```typescript
// 筛选可出牌 - 只有 gameState 或 playerId 变化时重新计算
const playableCards = useMemo(() => {
  if (!gameState || !playerId) return [];

  const me = gameState.players.find(p => p.id === playerId);
  if (!me) return [];

  return me.hand.filter(card => validateMove(gameState, card));
}, [gameState, playerId]);

// 当前玩家信息
const currentPlayer = useMemo(() => {
  if (!gameState) return null;
  return gameState.players[gameState.currentPlayerIndex];
}, [gameState]);

// 是否轮到我
const isMyTurn = useMemo(() => {
  return currentPlayer?.id === playerId;
}, [currentPlayer, playerId]);
```

### 2.3 组件懒加载

```typescript
// 经典模式使用懒加载
const [ClassicGame, setClassicGame] = useState<React.ComponentType<...> | null>(null);

useEffect(() => {
  if (viewMode === 'classic' && !ClassicGame) {
    import('../components/game/classic/ClassicGame').then((module) => {
      setClassicGame(() => module.ClassicGame);
    });
  }
}, [viewMode, ClassicGame]);

// 渲染时条件挂载
{viewMode === 'classic' && ClassicGame && (
  <ClassicGame ... />
)}
```

### 2.4 选择性订阅

```typescript
// ❌ 不推荐：订阅整个 Store
const { gameState, playerId, roomId } = useGameStore();

// ✅ 推荐：只订阅需要的片段
const gameState = useGameStore((state) => state.gameState);
const playerId = useGameStore((state) => state.playerId);
const roomId = useGameStore((state) => state.roomId);
```

---

## 三、渲染优化技巧

### 3.1 React.memo

```typescript
// 使用 React.memo 包装纯展示组件
const CardDisplay = React.memo(({ card, onClick }) => {
  return <div onClick={onClick}>{card.value}</div>;
});

// 自定义比较函数
const CardDisplay = React.memo(
  ({ card, onClick }) => {
    return <div onClick={onClick}>{card.value}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示相等，不重新渲染
    return prevProps.card.id === nextProps.card.id;
  }
);
```

### 3.2 虚拟列表（如果需要）

```typescript
// 如果手牌数量很大，可以使用虚拟列表
// 本项目手牌数量有限（最多几十张），暂不需要
```

### 3.3 避免内联对象

```typescript
// ❌ 不推荐：内联对象每次渲染都是新引用
return <Card style={{ margin: 10, padding: 5 }} />;

// ✅ 推荐：使用常量
const cardStyle = { margin: 10, padding: 5 };
return <Card style={cardStyle} />;
```

---

## 四、3D 渲染优化

### 4.1 Canvas 渲染优化

```typescript
// 使用 Canvas 时，避免频繁创建对象
const draw = useCallback((ctx: CanvasRenderingContext2D) => {
  // 复用对象，避免 GC 压力
}, []);
```

### 4.2 3D 场景优化

```typescript
// 使用 useFrame 控制渲染
useFrame((state, delta) => {
  // 控制动画帧率
});

// 减少多边形数量
<mesh>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial />
</mesh>
```

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
