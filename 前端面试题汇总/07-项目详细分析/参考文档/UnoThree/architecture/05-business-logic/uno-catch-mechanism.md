# UNO 抓漏机制

## 一、抓漏规则

### 1.1 规则说明

- 玩家手牌剩 1 张时必须喊 UNO
- 其他玩家可在 2 秒内抓漏
- 抓漏成功：未喊者罚 2 张

### 1.2 时间戳记录

```typescript
// 手牌变化时记录时间戳
if (player.hand.length === 1) {
  player.handSizeChangedTimestamp = Date.now();
}
```

---

## 二、流程实现

### 2.1 抓漏检查

```typescript
// backend/src/game/game/game.service.ts

/**
 * 处理抓漏。
 */
catchUnoFailure(roomId: string, targetId: string) {
  const game = this.games.get(roomId);
  const target = game.players.find(p => p.id === targetId);

  // 检查条件
  if (target.hand.length === 1 && !target.hasShoutedUno) {
    const gracePeriodPassed = Date.now() - target.handSizeChangedTimestamp > 2000;

    if (gracePeriodPassed) {
      // 抓漏成功，罚 2 张
      target.hand.push(...this.drawFromDeck(game, 2));
    }
  }
}
```

---

## 三、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
