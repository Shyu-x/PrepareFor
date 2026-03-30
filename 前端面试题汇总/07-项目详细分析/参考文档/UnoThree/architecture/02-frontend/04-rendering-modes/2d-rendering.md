# 2D SVG 渲染

## 一、2D 渲染概述

### 1.1 渲染技术

| 技术 | 说明 |
|------|------|
| SVG | 可缩放矢量图形 |
| React 组件 | 函数组件渲染 SVG 元素 |
| CSS | 样式和动画 |

### 1.2 组件结构

```
Scene2D
├── Table2D (桌面背景)
├── PlayerArea2D (对手区域)
├── DiscardPile2D (弃牌堆)
├── Deck2D (牌堆)
├── Hand2D (玩家手牌)
├── DirectionIndicator2D (方向指示)
├── ColorPicker2D (颜色选择器)
├── UnoButton2D (UNO 按钮)
└── ScoreBoard2D (计分板)
```

---

## 二、卡牌渲染

### 2.1 Card2D 组件

```typescript
// frontend/src/components/game/2d/Card2D.tsx

/**
 * 2D 卡牌组件。
 *
 * 使用 SVG 渲染卡牌图案：
 * - 数字牌：显示数字和颜色
 * - 功能牌：显示功能图标
 * - 万能牌：显示变色图标
 */
export function Card2D({ card, onClick, isPlayable, isSelected }) {
  return (
    <div
      className={cn('card-2d', { playable: isPlayable, selected: isSelected })}
      onClick={onClick}
    >
      <svg viewBox="0 0 100 150">
        {/* 卡牌背景 */}
        <rect width="100" height="150" rx="8" fill={getCardColor(card)} />

        {/* 卡牌内容 */}
        {card.type === CardType.NUMBER && (
          <>
            <text x="10" y="30" fill="white">{card.value}</text>
            <text x="90" y="135" fill="white">{card.value}</text>
          </>
        )}

        {card.type === CardType.SKIP && (
          <text x="50" y="85" textAnchor="middle" fill="white">⦿</text>
        )}
        {/* ... 其他类型 */}
      </svg>
    </div>
  );
}
```

### 2.2 样式实现

```css
/* 使用 Tailwind CSS */
.card-2d {
  @apply transition-all duration-200;
  @apply cursor-pointer;
}

.card-2d.playable {
  @apply ring-2 ring-yellow-400;
}

.card-2d.selected {
  @apply transform -translate-y-2;
}
```

---

## 三、手牌渲染

### 3.1 Hand2D 组件

```typescript
// frontend/src/components/game/2d/Hand2D.tsx

/**
 * 玩家手牌组件。
 *
 * 水平排列卡牌，支持：
 * - 拖拽出牌
 * - 点击出牌
 * - 可出牌高亮
 */
export function Hand2D({ hand, onPlayCard, isMyTurn, gameState, playerId }) {
  return (
    <div className="hand-2d">
      {hand.map((card, index) => {
        const isPlayable = checkPlayable(card, gameState);
        return (
          <Card2D
            key={card.id}
            card={card}
            isPlayable={isPlayable && isMyTurn}
            onClick={() => isPlayable && isMyTurn && onPlayCard(card.id)}
            style={{ marginLeft: index > 0 ? -30 : 0 }}
          />
        );
      })}
    </div>
  );
}
```

---

## 四、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
