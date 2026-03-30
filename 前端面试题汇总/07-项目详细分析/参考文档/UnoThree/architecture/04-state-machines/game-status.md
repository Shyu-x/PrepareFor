# 游戏状态机

## 一、状态机概述

### 1.1 游戏状态定义

```typescript
// backend/src/game/types.ts

/**
 * 游戏状态枚举。
 *
 * 定义游戏的主要阶段。
 */
enum GameStatus {
  WAITING = 'WAITING',           // 等待中 - 玩家可加入/退出
  PLAYING = 'PLAYING',           // 游戏中 - 回合进行中
  ROUND_FINISHED = 'ROUND_FINISHED',  // 回合结束
  GAME_OVER = 'GAME_OVER',       // 游戏结束
}
```

---

## 二、状态流转图

### 2.1 全局状态流转

```
┌───────────────┐    startGame()    ┌───────────────┐
│   WAITING    │ ───────────────▶ │   PLAYING     │
│   (等待中)   │                  │   (游戏中)    │
└───────┬───────┘                  └───────┬───────┘
        │                                    │
        │                                    │ 手牌数 == 0
        │                                    ▼
        │                          ┌───────────────┐
        │                          │ROUND_FINISHED │
        │                          │ (回合结束)    │
        │                          └───────┬───────┘
        │                                  │
        │    达到结算条件                   │ 达到结算条件
        │    (maxScore/maxRounds)          │ (maxScore/maxRounds)
        │                                  ▼
        │                          ┌───────────────┐
        └─────────────────────────│  GAME_OVER    │
                 startGame()      │  (游戏结束)    │
                 (下一轮)         └───────────────┘
```

### 2.2 回合内状态

```
WAITING_FOR_TURN
        │
        │ 玩家回合开始
        ▼
WAITING_FOR_PLAY (等待出牌)
        │
        ├─▶ 出牌 ──▶ PROCESSING_EFFECTS
        │
        ├─▶ 摸牌 ──▶ PENDING_DRAW_PLAY
        │
        └─▶ 超时 ──▶ 自动执行

PROCESSING_EFFECTS
        │
        ├─▶ 功能牌 ──▶ 处理效果 ──▶ ADVANCE_TURN
        │
        └─▶ 数字牌 ──▶ ADVANCE_TURN

PENDING_DRAW_PLAY (摸牌待定)
        │
        ├─▶ 打出 ──▶ ADVANCE_TURN
        │
        └─▶ 保留 ──▶ ADVANCE_TURN
```

---

## 三、特殊状态机制

### 3.1 质疑状态机

```
┌─────────────────┐
│    正常回合     │
└────────┬────────┘
         │
         │ 出了 +4 牌
         ▼
┌─────────────────┐
│ CHALLENGING    │ ◀── challengeData 不为空
│ (质疑等待中)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
质疑成功   质疑失败
    │         │
    ▼         ▼
出牌者   质疑者
罚4张    罚6张
```

### 3.2 UNO 状态

```
玩家手牌 = 1
      │
      ▼
记录时间戳
(handSizeChangedTimestamp)
      │
      ├─▶ 立即喊 UNO ──▶ hasShoutedUno = true
      │
      └─▶ 其他玩家抓漏 ──▶ 检查 2 秒宽限期
                              │
                              ├─▶ 宽限期内 ──▶ 罚 2 张
                              │
                              └─▶ 宽限期外 ──▶ 无处罚
```

---

## 四、触发条件表

| 状态 | 触发条件 | 下一状态 |
|------|---------|---------|
| WAITING | 房间创建 | PLAYING (startGame) |
| PLAYING | 玩家出完手牌 | ROUND_FINISHED |
| ROUND_FINISHED | 达到结算条件 | GAME_OVER |
| ROUND_FINISHED | 未达到结算条件 | WAITING |
| GAME_OVER | 房间关闭 | - |

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
