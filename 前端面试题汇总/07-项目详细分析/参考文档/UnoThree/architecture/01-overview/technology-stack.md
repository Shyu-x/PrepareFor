# 技术栈详解

## 一、前端技术栈

### 1.1 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| **Next.js** | 16 | App Router、Server Components、SEO 优化 |
| **React** | 19 | 函数组件、Hooks、Concurrent 模式 |
| **TypeScript** | 5.x | 类型安全、IDE 智能提示 |

### 1.2 状态管理

| 技术 | 说明 | 适用场景 |
|------|------|---------|
| **Zustand** | 轻量级状态管理库 | 游戏全局状态 |
| **React Context** | React 内置 Context API | Socket 连接共享 |
| **useState/useReducer** | 组件级状态 | UI 局部状态 |

### 1.3 3D 渲染

```
┌─────────────────────────────────────────────────────────────────┐
│                     3D 技术栈架构                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    @react-three/fiber                     │   │
│  │              (React 声明式 Three.js 封装)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│          ┌───────────────────┼───────────────────┐             │
│          ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ three.js    │    │@react-three│    │ @react-three│        │
│  │ (核心3D库)  │    │   /drei    │    │ /postprocess│        │
│  │             │    │ (工具库)   │    │ (后处理)    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    framer-motion                         │   │
│  │                 (React 动画库 - UI动画)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 样式方案

| 技术 | 说明 |
|------|------|
| **Tailwind CSS 4** | 原子化 CSS、快速开发 |
| **Ant Design 6** | 基础 UI 组件（按钮、输入框、弹窗等） |
| **CSS Modules** | 组件级样式隔离 |

### 1.5 通信与音效

| 技术 | 说明 |
|------|------|
| **Socket.IO Client** | WebSocket 实时通信 |
| **Web Audio API** | 浏览器音频接口 |
| **WebRTC** | P2P 语音聊天 |

---

## 二、后端技术栈

### 2.1 核心框架

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS 架构                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      AppModule                           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │                   GameModule                      │  │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │  │   │
│  │  │  │GameGateway │ │GameService │ │ AiService  │   │  │   │
│  │  │  │(Socket.IO) │ │(游戏逻辑)  │ │ (AI策略)   │   │  │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘   │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

| 技术 | 版本 | 说明 |
|------|------|------|
| **NestJS** | 11 | 依赖注入、模块化、Decorator 装饰器 |
| **Socket.IO** | 4.8 | WebSocket、房间管理、心跳 |
| **Node.js** | 20.x | 事件驱动、非阻塞 I/O |

### 2.2 依赖注入

NestJS 使用依赖注入容器管理服务实例：

```typescript
// backend/src/game/game.module.ts
@Module({
  imports: [],
  controllers: [],
  providers: [
    GameGateway,
    GameService,
    AiService,
    GameMonitorService,
  ],
  exports: [GameService],
})
export class GameModule {}
```

---

## 三、关键技术详解

### 3.1 React Three Fiber 原理

**声明式 3D 渲染**：

```typescript
// 前端/src/components/game/Scene3D.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

/**
 * 3D 游戏场景主容器。
 *
 * 使用 Canvas 组件创建 WebGL 渲染上下文，
 * 所有子组件声明式定义 3D 场景内容。
 */
export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 50 }}
      shadows
      gl={{ antialias: true }}
    >
      {/* 光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow />

      {/* 3D 内容 */}
      <Card3D card={/* 卡牌数据 */} />
      <DiscardPile3D />

      {/* 相机控制 */}
      <OrbitControls enablePan={false} />
    </Canvas>
  );
}
```

### 3.2 Zustand 状态管理

**极简状态管理**：

```typescript
// frontend/src/store/useGameStore.ts
import { create } from 'zustand';

/**
 * 游戏全局状态仓库。
 *
 * 使用 Zustand 创建，特点：
 * - 无需 Provider 嵌套
 * - TypeScript 类型推断
 * - 最小化状态更新
 */
interface GameStore {
  // 状态
  gameState: GameState | null;
  playerId: string | null;
  roomId: string | null;
  isConnected: boolean;

  // 方法
  setGameState: (state: GameState) => void;
  setPlayerId: (id: string) => void;
  setRoomId: (id: string) => void;
  setConnected: (connected: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  playerId: null,
  roomId: null,
  isConnected: false,

  setGameState: (state) => set({ gameState: state }),
  setPlayerId: (id) => set({ playerId: id }),
  setRoomId: (id) => set({ roomId: id }),
  setConnected: (connected) => set({ isConnected: connected }),
}));
```

### 3.3 Socket.IO 通信

**事件驱动架构**：

```typescript
// backend/src/game/game/game.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/game',
})
export class GameGateway {
  @SubscribeMessage('playCard')
  handlePlayCard(
    @MessageBody() data: { roomId: string; cardId: string; colorSelection?: CardColor },
    @ConnectedSocket() client: Socket,
  ) {
    // 路由到 GameService 处理
    return this.gameService.playCard(
      data.roomId,
      client.id,
      data.cardId,
      data.colorSelection,
    );
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.gameService.joinGame(data, client);
  }
}
```

### 3.4 AI 策略模式

**策略模式实现**：

```typescript
// backend/src/game/game/ai.service.ts
/**
 * AI 策略接口。
 *
 * 使用策略模式实现三级难度：
 * - EASY: 随机出牌
 * - MEDIUM: 颜色优化
 * - HARD: 攻击性策略
 */
export class AiService {
  getBestMove(game: GameState, aiPlayer: Player): AiMove {
    const difficulty = aiPlayer.difficulty;

    switch (difficulty) {
      case AIDifficulty.EASY:
        return this.getEasyMove(game, aiPlayer);
      case AIDifficulty.MEDIUM:
        return this.getMediumMove(game, aiPlayer);
      case AIDifficulty.HARD:
        return this.getHardMove(game, aiPlayer);
    }
  }
}
```

---

## 四、开发工具链

### 4.1 前端工具

| 工具 | 用途 |
|------|------|
| ESLint | 代码检查 |
| Prettier | 代码格式化 |
| TypeScript | 类型检查 |
| Tailwind CSS | 样式生成 |

### 4.2 后端工具

| 工具 | 用途 |
|------|------|
| Jest | 单元测试 |
| Socket.IO Debugger | 通信调试 |
| NestJS CLI | 项目脚手架 |

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
