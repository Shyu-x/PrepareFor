# Context 模式

## 一、Context 模式概述

### 1.1 什么是 Context 模式

Context 是 React 提供的一种组件间数据共享机制，避免 props 层层传递。

### 1.2 本项目的 Context 使用

```
┌─────────────────────────────────────────────────────────────────┐
│                     Context 层级关系                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GameSocketContext                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  page.tsx (GameContent)                         │   │  │
│  │  │  ┌────────────────┐  ┌────────────────┐        │   │  │
│  │  │  │   Scene3D     │  │   Scene2D      │        │   │  │
│  │  │  │                │  │                │        │   │  │
│  │  │  │  ┌──────────┐ │  │  ┌──────────┐   │        │   │  │
│  │  │  │  │  Card3D  │ │  │  │  Card2D  │   │        │   │  │
│  │  │  │  └──────────┘ │  │  └──────────┘   │        │   │  │
│  │  │  └────────────────┘  └────────────────┘        │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、Provider 实现

### 2.1 创建 Context

```typescript
// frontend/src/context/GameSocketContext.tsx

/**
 * 创建 Context。
 *
 * 泛型指定 Context 值的类型。
 */
const GameSocketContext = createContext<GameSocketContextType | undefined>(undefined);
```

### 2.2 Provider 组件

```typescript
// frontend/src/context/GameSocketContext.tsx

/**
 * Socket 连接 Provider。
 *
 * 包裹应用，提供 Socket 连接和游戏操作方法。
 */
export function GameSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  // ... 初始化逻辑

  const value = {
    socket,
    isConnected,
    isReconnecting,
    joinRoom,
    playCard,
    drawCard,
    // ...
  };

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
}
```

### 2.3 自定义 Hook 封装

```typescript
// frontend/src/context/GameSocketContext.tsx

/**
 * 使用 Socket Context 的自定义 Hook。
 *
 * 内部调用 useContext 并处理 undefined 情况。
 *
 * Returns:
 *   GameSocketContextType: Socket 连接上下文
 *
 * Throws:
 *   Error: 当在 Provider 外部使用时抛出
 */
export function useGameSocket() {
  const context = useContext(GameSocketContext);

  if (context === undefined) {
    throw new Error('useGameSocket must be used within a GameSocketProvider');
  }

  return context;
}
```

---

## 三、Context 使用模式

### 3.1 在组件中使用

```typescript
// 在任意子组件中使用
function MyComponent() {
  // 获取 Context 值
  const { socket, playCard, isConnected } = useGameSocket();

  const handleClick = () => {
    playCard('card-123');
  };

  return (
    <button onClick={handleClick} disabled={!isConnected}>
      出牌
    </button>
  );
}
```

### 3.2 多 Context 组合

```typescript
// 项目中可能存在的多个 Context
const App = () => {
  return (
    <GameSocketProvider>
      <AudioProvider>
        <UIProvider>
          <YourApp />
        </UIProvider>
      </AudioProvider>
    </GameSocketProvider>
  );
};
```

---

## 四、Context 性能优化

### 4.1 问题

Context 变化会导致所有消费该 Context 的组件重新渲染。

### 4.2 优化方案

```typescript
// ❌ 问题：每次 Provider value 变化，所有消费者都重新渲染
const GameSocketProvider = ({ children }) => {
  const [state, setState] = useState({ count: 0 });

  const value = {
    state,  // 每次渲染都是新对象
    setState,
  };

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
};

// ✅ 优化：使用 useMemo 缓存 value
const GameSocketProvider = ({ children }) => {
  const [state, setState] = useState({ count: 0 });

  const value = useMemo(() => ({
    state,
    setState,
  }), [state]);  // 只有 state 变化时才重新创建

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
};
```

### 4.3 分离 Context

```typescript
// ❌ 不推荐：多个不相关状态放在一起
const AppContext = createContext({
  user: null,
  theme: 'light',
  notifications: [],
});

// ✅ 推荐：分离不同类型的 Context
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const NotificationContext = createContext([]);
```

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
