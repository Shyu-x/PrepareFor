# 游戏服务

## 一、GameService 概述

### 1.1 服务职责

GameService 是游戏的核心服务，负责：
- 房间管理
- 游戏规则
- 状态管理
- AI 调度

### 1.2 核心方法

| 方法 | 说明 |
|------|------|
| createGame | 创建房间 |
| joinGame | 加入房间 |
| startGame | 开始游戏 |
| playCard | 出牌 |
| drawCard | 摸牌 |
| shoutUno | 喊 UNO |
| catchUnoFailure | 抓漏 |
| handleChallenge | 质疑处理 |
| advanceTurn | 回合推进 |

---

## 二、核心代码结构

### 2.1 服务定义

```typescript
// backend/src/game/game/game.service.ts

@Injectable()
export class GameService {
  // 房间存储
  private games: Map<string, GameState> = new Map();

  /**
   * 创建游戏房间。
   */
  createGame(roomId: string, config?: GameConfig): GameState {
    const game: GameState = {
      roomId,
      status: GameStatus.WAITING,
      players: [],
      deck: [],
      discardPile: [],
      // ...
    };

    this.games.set(roomId, game);
    return game;
  }

  /**
   * 验证并执行出牌。
   */
  async playCard(roomId, playerId, cardId, colorSelection) {
    const game = this.games.get(roomId);

    // 验证
    if (!this.validateMove(game, playerId, cardId)) {
      throw new Error('非法出牌');
    }

    // 执行
    // ...

    // 广播
    this.broadcastState(roomId);
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
