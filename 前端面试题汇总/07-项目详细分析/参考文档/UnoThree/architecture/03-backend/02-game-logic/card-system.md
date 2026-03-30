# 卡牌系统

## 一、卡牌类型

### 1.1 卡牌枚举

```typescript
enum CardType {
  NUMBER,      // 数字牌 0-9
  SKIP,        // 跳过
  REVERSE,     // 反转
  DRAW_TWO,    // +2
  WILD,        // 万能牌
  WILD_DRAW_FOUR, // +4
}
```

---

## 二、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
