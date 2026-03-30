# 质疑机制

## 一、质疑规则

### 1.1 规则说明

- 只能质疑 WILD_DRAW_FOUR（+4）牌
- 质疑成功：出牌者罚 4 张
- 质疑失败：质疑者罚 6 张

### 1.2 质疑条件

质疑者需要证明：出牌者当时有同色可出牌却出了 +4

---

## 二、流程实现

### 2.1 出牌时设置质疑数据

```typescript
// backend/src/game/game/game.service.ts

if (card.type === CardType.WILD_DRAW_FOUR) {
  game.challengeData = {
    playerId: currentPlayer.id,
    cardId: card.id,
    cardType: card.type,
  };
}
```

### 2.2 质疑处理

```typescript
// backend/src/game/game/game.service.ts

/**
 * 处理质疑。
 *
 * Args:
 *   roomId: 房间 ID。
 *   challengerId: 质疑者 ID。
 *   accept: 是否接受质疑。
 */
handleChallenge(roomId: string, challengerId: string, accept: boolean) {
  const game = this.games.get(roomId);
  const challenger = game.players.find(p => p.id === challengerId);

  if (accept) {
    // 质疑者接受，接受 +4 效果
    const target = game.players.find(p => p.id === game.challengeData.playerId);
    target.hand.push(...this.drawFromDeck(game, 4));
  } else {
    // 质疑者挑战
    const hadLegalColor = this.checkHadLegalColor(
      game,
      game.challengeData.playerId
    );

    if (hadLegalColor) {
      // 质疑成功：出牌者罚 4
      const target = game.players.find(p => p.id === game.challengeData.playerId);
      target.hand.push(...this.drawFromDeck(game, 4));
    } else {
      // 质疑失败：质疑者罚 6
      challenger.hand.push(...this.drawFromDeck(game, 6));
    }
  }

  // 清除质疑数据
  game.challengeData = undefined;
}
```

---

## 三、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
