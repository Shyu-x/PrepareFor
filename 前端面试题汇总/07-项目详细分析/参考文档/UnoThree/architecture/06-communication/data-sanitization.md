# 数据脱敏机制

## 一、脱敏概述

### 1.1 什么是数据脱敏

数据脱敏是指在数据传输过程中，对敏感信息进行隐藏或处理，防止泄露玩家隐私。

### 1.2 本项目的脱敏规则

| 数据 | 脱敏方式 | 说明 |
|------|---------|------|
| deck（牌堆） | 设为 undefined | 隐藏剩余牌 |
| hand（手牌） | 非本人设为 [] | 只显示自己手牌 |
| sessionId | 仅服务端使用 | 不广播 |
| reconnectToken | 仅服务端使用 | 不广播 |

---

## 二、脱敏实现

### 2.1 广播前脱敏

```typescript
// backend/src/game/game/game.gateway.ts

/**
 * 广播游戏状态，对每个玩家进行个性化脱敏。
 *
 * Args:
 *   roomId: 房间 ID。
 *
 * Side Effects:
 *   - 向房间内所有玩家发送个性化状态。
 */
private broadcastState(roomId: string) {
  const game = this.gameService.getGame(roomId);
  const sockets = this.server.in(roomId).sockets;

  sockets.forEach((socket) => {
    // 为每个玩家创建个性化状态
    const personalizedState = this.sanitizeState(game, socket.id);

    socket.emit('gameStateUpdate', personalizedState);
  });
}

/**
 * 脱敏处理。
 */
private sanitizeState(game: GameState, playerId: string): GameState {
  const sanitized = { ...game };

  // 隐藏牌堆
  sanitized.deck = undefined;

  // 非本人手牌隐藏
  sanitized.players = sanitized.players.map((p) => ({
    ...p,
    hand: p.id === playerId ? p.hand : [],
    // 保留手牌数量用于显示
    handCount: p.hand.length,
  }));

  return sanitized;
}
```

---

## 三、数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                       数据脱敏流程                               │
│                                                                  │
│  后端内存状态                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ { players: [{ hand: [红1, 蓝3, 绿5], ... }] }         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              broadcastState(roomId)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│          ┌───────────────────┴───────────────────┐             │
│          ▼                                   ▼             │
│  玩家 A 的状态                          玩家 B 的状态         │
│  ┌───────────────────┐              ┌───────────────────┐    │
│  │ hand: [红1,蓝3,绿5]│              │ hand: []          │    │
│  │ (完整手牌)        │              │ (隐藏)            │    │
│  └───────────────────┘              └───────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
