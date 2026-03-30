# 组件树状图

## 一、组件目录结构

### 1.1 前端组件完整树

```
frontend/src/
├── app/
│   ├── layout.tsx                          # 根布局
│   └── page.tsx                           # 主页面 (GameContent)
│
├── components/
│   ├── Card.tsx                          # 基础卡牌组件
│   └── game/
│       ├── Scene3D.tsx                   # 3D 游戏场景
│       ├── Card3D.tsx                   # 3D 卡牌组件
│       ├── HUD.tsx                       # 头部信息栏
│       ├── CameraControl.tsx             # 相机控制
│       ├── GameOverlay.tsx               # 游戏覆盖层
│       ├── NotificationLayer.tsx         # 通知层
│       │
│       ├── 2d/                          # 2D 渲染模式
│       │   ├── Scene2D.tsx             # 2D 场景
│       │   ├── Table2D.tsx             # 2D 桌面
│       │   ├── Card2D.tsx              # 2D 卡牌
│       │   ├── CardBack2D.tsx          # 卡牌背面
│       │   ├── Hand2D.tsx              # 玩家手牌
│       │   ├── Deck2D.tsx               # 牌堆
│       │   ├── DiscardPile2D.tsx       # 弃牌堆
│       │   ├── PlayerArea2D.tsx         # 玩家区域
│       │   ├── ColorPicker2D.tsx       # 颜色选择器
│       │   ├── UnoButton2D.tsx          # UNO 按钮
│       │   ├── ScoreBoard2D.tsx         # 计分板
│       │   └── DirectionIndicator2D.tsx # 方向指示器
│       │
│       └── classic/                      # Canvas 经典模式
│           ├── ClassicGame.tsx           # 经典游戏主组件
│           ├── ClassicModals.tsx        # 经典模式弹窗
│           ├── CardRenderer.ts          # 卡牌渲染器
│           └── AnimatedCard.ts          # 动画卡牌类
│
├── context/
│   └── GameSocketContext.tsx            # Socket 连接上下文
│
├── store/
│   └── useGameStore.ts                  # Zustand 状态仓库
│
├── hooks/
│   ├── useResponsive.ts                 # 响应式检测
│   ├── useSoundEffects.ts              # 音效反馈
│   └── useVoiceChat.ts                 # 语音聊天
│
├── types/
│   └── game.ts                          # 游戏类型定义
│
└── utils/
    ├── audioManager.ts                   # 音效管理器
    ├── nicknameGenerator.ts             # 昵称生成器
    └── unoSound.ts                      # UNO 音效
```

---

## 二、组件层级关系

### 2.1 页面级组件

```
page.tsx (根组件)
│
└── GameContent (游戏内容容器)
    │
    ├── [视图模式切换]
    │   ├── Scene3D (3D 模式)
    │   ├── Scene2D (2D 模式)
    │   └── ClassicGame (Canvas 模式 - 懒加载)
    │
    ├── HUD (信息栏 - 始终显示)
    │
    ├── CameraControl (相机控制 - 仅 3D)
    │
    ├── NotificationLayer (通知层)
    │
    └── GameOverlay (游戏弹窗)
```

### 2.2 3D 模式组件树

```
Scene3D
├── Canvas (@react-three/fiber)
│   ├── Lights (光照)
│   │   ├── ambientLight
│   │   └── directionalLight
│   │
│   ├── Camera (相机)
│   │   └── OrbitControls
│   │
│   ├── Environment (环境)
│   │   └── Environment preset
│   │
│   ├── Cards (卡牌渲染)
│   │   ├── Card3D (玩家手牌)
│   │   ├── Card3D (弃牌堆)
│   │   └── Card3D (牌堆)
│   │
│   └── Effects (特效)
│       └── ParticleSystem
│
└── HUD (3D 模式下的 HUD)
```

### 2.3 2D 模式组件树

```
Scene2D
├── Table2D (桌面背景)
├── PlayerArea2D (对手区域)
│   ├── CardBack2D × N (对手手牌)
│   └── PlayerInfo (对手信息)
│
├── DiscardPile2D (弃牌堆)
│   └── Card2D × N
│
├── Deck2D (牌堆)
│   └── CardBack2D
│
├── Hand2D (玩家手牌)
│   └── Card2D × N
│
├── DirectionIndicator2D (方向指示)
├── ColorPicker2D (颜色选择器 - 条件渲染)
├── UnoButton2D (UNO 按钮)
└── ScoreBoard2D (计分板)
```

### 2.4 Canvas 经典模式组件树

```
ClassicGame
├── Canvas Layer (Canvas 渲染)
│   ├── drawEnvironment() (桌面绘制)
│   ├── drawDiscardPile() (弃牌堆)
│   ├── drawDeck() (牌堆)
│   ├── drawOpponentHands() (对手手牌)
│   ├── drawPlayerHand() (玩家手牌)
│   └── drawDirectionRing() (方向环)
│
└── HTML Overlay (DOM 覆盖层)
    ├── ClassicSidebar (侧边栏)
    ├── ClassicUnoButton (UNO 按钮)
    ├── ColorPickerModal (选色器弹窗)
    ├── ChallengeModal (质疑弹窗)
    ├── ScoreBoardModal (计分板弹窗)
    └── DrawDecisionModal (摸牌决策弹窗)
```

---

## 三、ASCII 组件依赖图

### 3.1 完整依赖关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              page.tsx                                       │
│                         (游戏主页面协调器)                                  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                        useGameSocket()                              │   │
│  │                     (获取 socket 连接)                             │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │     Scene3D      │  │     Scene2D      │  │   ClassicGame    │       │
│  │   (3D 渲染)     │  │   (2D 渲染)     │  │  (Canvas 渲染)   │       │
│  │                  │  │                  │  │                  │       │
│  │ ┌──────────────┐│  │ ┌──────────────┐│  │ ┌──────────────┐│       │
│  │ │   Card3D     ││  │ │    Card2D    ││  │ │AnimatedCard  ││       │
│  │ └──────────────┘│  │ └──────────────┘│  │ └──────────────┘│       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                      │                      │                  │
│           └──────────────────────┼──────────────────────┘                  │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌────────────────────────┐                              │
│                    │     useGameStore       │                              │
│                    │    (Zustand 状态)     │                              │
│                    └────────────────────────┘                              │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │       HUD        │  │ NotificationLayer│  │   GameOverlay    │       │
│  │   (信息栏)      │  │    (通知层)      │  │   (游戏弹窗)     │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ useResponsive    │  │ useVoiceChat     │  │ useSoundEffects  │       │
│  │  (响应式检测)   │  │   (语音聊天)    │  │   (音效反馈)     │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流向

```
用户操作
    │
    ▼
┌─────────────────┐
│  组件事件处理   │  ← page.tsx / Scene3D / Hand2D
└────────┬────────┘
         │ onPlayCard(cardId)
         ▼
┌─────────────────┐
│ GameSocketContext│  ← socket.emit('playCard')
└────────┬────────┘
         │
         │ Socket.IO
         ▼
┌─────────────────┐
│   后端服务      │  ← GameGateway → GameService
└────────┬────────┘
         │ broadcastState()
         │
         │ Socket.IO
         ▼
┌─────────────────┐
│ GameSocketContext│  ← socket.on('gameStateUpdate')
└────────┬────────┘
         │ setGameState()
         ▼
┌─────────────────┐
│  useGameStore   │  ← zustand store 更新
└────────┬────────┘
         │ useGameStore()
         ▼
┌─────────────────┐
│   组件重新渲染   │  ← Scene3D / HUD / Hand2D
└─────────────────┘
```

---

## 四、组件职责表

### 4.1 核心组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| page.tsx | `app/page.tsx` | 主页面协调器，管理视图切换、房间逻辑 |
| Scene3D | `components/game/Scene3D.tsx` | 3D 场景渲染、Three.js 集成 |
| Scene2D | `components/game/2d/Scene2D.tsx` | 2D 场景协调、响应式布局 |
| ClassicGame | `components/game/classic/ClassicGame.tsx` | Canvas 渲染循环、动画引擎 |
| HUD | `components/game/HUD.tsx` | 显示游戏信息、音频控制 |

### 4.2 卡牌组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| Card3D | `components/game/Card3D.tsx` | 3D 卡牌渲染、动画 |
| Card2D | `components/game/2d/Card2D.tsx` | SVG 卡牌渲染 |
| CardBack2D | `components/game/2d/CardBack2D.tsx` | 卡牌背面渲染 |
| Hand2D | `components/game/2d/Hand2D.tsx` | 玩家手牌管理 |

### 4.3 状态管理组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| GameSocketContext | `context/GameSocketContext.tsx` | Socket 连接、事件收发 |
| useGameStore | `store/useGameStore.ts` | Zustand 全局状态 |

### 4.4 Hooks

| Hook | 文件路径 | 职责 |
|------|---------|------|
| useResponsive | `hooks/useResponsive.ts` | 响应式检测 |
| useSoundEffects | `hooks/useSoundEffects.ts` | 音效播放 |
| useVoiceChat | `hooks/useVoiceChat.ts` | 语音聊天 |

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
