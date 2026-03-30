# 摸牌决策机制

## 一、机制说明

### 1.1 触发条件

玩家摸牌后，如果摸到的牌可以立即打出，需要让玩家选择是否打出。

### 1.2 决策选项

- **打出**：打出刚摸到的牌
- **保留**：保留这张牌，过牌

---

## 二、实现

### 2.1 摸牌时检查

```typescript
// backend/src/game/game/game.service.ts

drawCard(roomId: string, playerId: string) {
  const game = this.games.get(roomId);
  const card = this.drawFromDeck(game, 1)[0];
  const player = game.players.find(p => p.id === playerId);

  // 摸到的牌加入手牌
  player.hand.push(card);

  // 检查是否可以打出
  if (this.validateMove(game, playerId, card.id)) {
    // 进入待定状态
    game.pendingDrawPlay = {
      playerId,
      card: card,
    };
  }

  this.broadcastState(roomId);
}
```

---

## 三、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
