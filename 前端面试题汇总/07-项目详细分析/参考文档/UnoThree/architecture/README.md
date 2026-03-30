# UNO 游戏技术架构文档

## 文档概述

本文档是 UNO 联机对战游戏的技术架构全面指南，从底层原理到顶层架构系统性展示项目的技术细节。

### 核心特性

- **3D 沉浸式体验**：基于 @react-three/fiber 的 WebGL 渲染
- **三模渲染系统**：2D SVG / 3D WebGL / Canvas 经典模式
- **后端权威架构**：NestJS + Socket.IO 实时通信
- **三级 AI 策略**：EASY / MEDIUM / HARD 难度递进
- **完整 UNO 规则**：质疑、抓漏、摸牌决策等高级机制

---

## 文档目录

### 第一章：项目概览

| 文档 | 说明 |
|------|------|
| [项目技术概览](./01-overview/project-summary.md) | 项目简介、核心特性、技术架构总览 |
| [架构原则](./01-overview/architecture-principles.md) | 后端权威、前后端分离、状态同步原则 |
| [技术栈详解](./01-overview/technology-stack.md) | 前端/后端/3D/通信技术选型 |

### 第二章：前端架构

#### 组件层级
| 文档 | 说明 |
|------|------|
| [组件树状图](./02-frontend/01-component-hierarchy/component-tree.md) | 所有组件的层级关系 |
| [依赖关系图](./02-frontend/01-component-hierarchy/dependency-graph.md) | 组件间依赖可视化 |

#### 状态管理
| 文档 | 说明 |
|------|------|
| [Zustand Store](./02-frontend/02-state-management/zustand-store.md) | 全局状态管理 |
| [Socket Context](./02-frontend/02-state-management/socket-context.md) | WebSocket 连接管理 |

#### React 模式
| 文档 | 说明 |
|------|------|
| [Hooks 使用详解](./02-frontend/03-react-patterns/hooks-usage.md) | useState/useEffect/useCallback 等 |
| [Context 模式](./02-frontend/03-react-patterns/context-pattern.md) | Provider/Consumer 模式 |
| [性能优化](./02-frontend/03-react-patterns/performance-optimization.md) | Memo/UseMemo/UseCallback |

#### 渲染模式
| 文档 | 说明 |
|------|------|
| [2D SVG 渲染](./02-frontend/04-rendering-modes/2d-rendering.md) | SVG 卡牌渲染原理 |
| [3D WebGL 渲染](./02-frontend/04-rendering-modes/3d-rendering.md) | Three.js 场景渲染 |
| [Canvas 经典模式](./02-frontend/04-rendering-modes/classic-canvas.md) | 仿真桌面渲染 |

#### 游戏组件详解
| 文档 | 说明 |
|------|------|
| [Scene3D](./02-frontend/05-game-components/scene3d.md) | 3D 游戏场景 |
| [Card3D](./02-frontend/05-game-components/card3d.md) | 3D 卡牌组件 |
| [Scene2D](./02-frontend/05-game-components/scene2d.md) | 2D 游戏场景 |
| [ClassicGame](./02-frontend/05-game-components/classic-game.md) | Canvas 经典模式 |
| [HUD](./02-frontend/05-game-components/hud.md) | 头部信息栏 |

### 第三章：后端架构

#### 服务架构
| 文档 | 说明 |
|------|------|
| [Socket 网关](./03-backend/01-service-architecture/gateway.md) | GameGateway 事件处理 |
| [核心游戏服务](./03-backend/01-service-architecture/game-service.md) | GameService 业务逻辑 |
| [AI 服务](./03-backend/01-service-architecture/ai-service.md) | AiService 策略实现 |

#### 游戏逻辑
| 文档 | 说明 |
|------|------|
| [卡牌系统](./03-backend/02-game-logic/card-system.md) | 卡牌生成与验证 |
| [回合管理](./03-backend/02-game-logic/turn-management.md) | 回合推进机制 |
| [特殊规则](./03-backend/02-game-logic/special-rules.md) | 功能牌效果处理 |

#### 数据流向
| 文档 | 说明 |
|------|------|
| [数据流向](./03-backend/03-data-flow.md) | 前后端数据流转闭环 |

### 第四章：状态机

| 文档 | 说明 |
|------|------|
| [游戏全局状态](./04-state-machines/game-status.md) | GameStatus 状态机 |
| [回合状态](./04-state-machines/turn-state.md) | 回合内状态流转 |
| [质疑状态机](./04-state-machines/challenge-state.md) | +4 质疑机制 |
| [UNO 状态机](./04-state-machines/uno-state.md) | UNO 宣告与抓漏 |
| [摸牌决策状态](./04-state-machines/pending-draw-state.md) | 摸到可出牌决策 |

### 第五章：业务逻辑深度

| 文档 | 说明 |
|------|------|
| [STAR 法则分析](./05-business-logic/star-analysis.md) | 核心业务 STAR 分析 |
| [质疑机制](./05-business-logic/challenge-mechanism.md) | +4 质疑完整流程 |
| [UNO 抓漏机制](./05-business-logic/uno-catch-mechanism.md) | 抓漏 2 秒宽限期 |
| [摸牌决策机制](./05-business-logic/draw-decision.md) | 摸牌后选择逻辑 |
| [AI 策略分析](./05-business-logic/ai-strategy.md) | 三级难度策略 |

### 第六章：通信架构

| 文档 | 说明 |
|------|------|
| [Socket 事件定义](./06-communication/socket-events.md) | 前后端事件表 |
| [数据脱敏机制](./06-communication/data-sanitization.md) | 手牌隐藏/牌堆隐藏 |
| [重连流程](./06-communication/reconnect-flow.md) | 会话保留窗口 |

### 第七章：部署与运维

| 文档 | 说明 |
|------|------|
| [Nginx 配置](./07-deployment/nginx-config.md) | 反向代理配置 |

---

## 架构图索引

### PlantUML 图表

1. **系统架构图** - `01-overview/project-summary.md`
2. **组件依赖图** - `02-frontend/01-component-hierarchy/dependency-graph.md`
3. **状态流向图** - `04-state-machines/game-status.md`
4. **质疑时序图** - `05-business-logic/challenge-mechanism.md`
5. **Socket 通信图** - `06-communication/socket-events.md`

### ASCII 字符图

1. **组件树** - `02-frontend/01-component-hierarchy/component-tree.md`
2. **数据流闭环** - `03-backend/03-data-flow.md`
3. **状态机流转** - `04-state-machines/game-status.md`

---

## 关键文件映射

### 前端核心文件

```
frontend/src/
├── app/
│   └── page.tsx                    # 主页面协调器
├── components/game/
│   ├── Scene3D.tsx                 # 3D 场景
│   ├── Card3D.tsx                  # 3D 卡牌
│   ├── 2d/Scene2D.tsx             # 2D 场景
│   ├── classic/ClassicGame.tsx    # Canvas 游戏
│   └── HUD.tsx                    # 信息栏
├── context/
│   └── GameSocketContext.tsx       # Socket 连接
├── store/
│   └── useGameStore.ts            # Zustand 状态
└── hooks/
    ├── useResponsive.ts           # 响应式
    └── useSoundEffects.ts          # 音效
```

### 后端核心文件

```
backend/src/game/
├── types.ts                        # 类型定义
├── game/
│   ├── game.gateway.ts            # Socket 网关
│   ├── game.service.ts            # 核心服务
│   └── ai.service.ts              # AI 策略
└── monitor/
    └── game.monitor.service.ts    # 监控服务
```

---

## 阅读指南

### 推荐的阅读顺序

1. **初学者**：按文档目录顺序阅读
2. **开发者**：重点阅读后端服务和状态机
3. **前端工程师**：重点阅读前端架构和渲染模式

### 快速定位

- 想了解组件关系 → `02-frontend/01-component-hierarchy/`
- 想了解游戏规则 → `05-business-logic/`
- 想了解状态流转 → `04-state-machines/`
- 想了解通信机制 → `06-communication/`

---

## 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|---------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

> 本文档使用简体中文，遵循 Google 文档风格规范。
