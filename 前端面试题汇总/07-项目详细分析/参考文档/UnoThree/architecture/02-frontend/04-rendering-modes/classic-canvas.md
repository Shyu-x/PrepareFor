# Canvas 经典模式

## 一、经典模式概述

### 1.1 设计理念

经典模式采用**纯 Canvas 渲染**的仿真桌面界面，模拟真实纸质卡牌和实体桌游的视觉体验。

### 1.2 核心技术

```
┌─────────────────────────────────────────────────────────────────┐
│                     Canvas 渲染架构                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  ClassicGame.tsx                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              Canvas Rendering Loop               │   │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │   │   │
│  │  │  │drawTable() │ │drawCards() │ │drawUI()    │   │   │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    HTML Overlay                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│  │  │ ColorPicker│ │ Challenge  │ │  ScoreBoard│          │   │
│  │  └────────────┘ └────────────┘ └────────────┘          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、渲染循环

### 2.1 Canvas 设置

```typescript
// frontend/src/components/game/classic/ClassicGame.tsx

/**
 * 经典模式主组件。
 *
 * 使用 Canvas 2D API 渲染游戏界面，
 * 配合 requestAnimationFrame 实现流畅动画。
 */
export function ClassicGame(props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState(props.gameState);

  // 渲染循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = (time: number) => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制环境
      drawEnvironment(ctx, canvas.width, canvas.height);

      // 绘制弃牌堆
      drawDiscardPile(ctx, gameState.discardPile);

      // 绘制牌堆
      drawDeck(ctx, gameState.deck?.length || 0);

      // 绘制玩家手牌
      drawPlayerHand(ctx, myHand, time);

      // 绘制对手手牌
      drawOpponentHands(ctx, opponents);

      // 绘制方向指示
      drawDirectionRing(ctx, gameState.direction);

      // 继续循环
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="classic-game">
      <canvas ref={canvasRef} width={1200} height={800} />
      <HTMLOverlay />
    </div>
  );
}
```

---

## 三、卡牌渲染

### 3.1 CardRenderer

```typescript
// frontend/src/components/game/classic/CardRenderer.ts

/**
 * SVG 卡牌生成器。
 *
 * 生成带纸质阴影效果的 SVG 卡牌图像，
 * 供 Canvas 渲染使用。
 */
export class CardRenderer {
  private cache: Map<string, HTMLImageElement> = new Map();

  /**
   * 生成卡牌图像。
   */
  renderCard(card: Card): HTMLImageElement {
    // 检查缓存
    if (this.cache.has(card.id)) {
      return this.cache.get(card.id)!;
    }

    // 生成 SVG
    const svg = this.generateCardSVG(card);
    const image = this.svgToImage(svg);

    // 缓存
    this.cache.set(card.id, image);

    return image;
  }

  private generateCardSVG(card: Card): string {
    const color = getCardColor(card.color);
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="150">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="100" height="150" rx="8" fill="${color}" filter="url(#shadow)"/>
        <text x="50" y="85" text-anchor="middle" fill="white" font-size="40">
          ${this.getCardSymbol(card)}
        </text>
      </svg>
    `;
  }
}
```

---

## 四、动画系统

### 4.1 AnimatedCard 类

```typescript
// frontend/src/components/game/classic/AnimatedCard.ts

/**
 * 动画卡牌类。
 *
 * 使用 Lerp 物理插值实现平滑动画。
 */
export class AnimatedCard {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  targetRotation: number;
  scale: number;
  targetScale: number;

  // Lerp 系数
  private lerpFactor = 0.12;
  private rotateLerpFactor = 0.08;
  private scaleLerpFactor = 0.15;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.rotation = 0;
    this.targetRotation = 0;
    this.scale = 1;
    this.targetScale = 1;
  }

  /**
   * 设置目标位置。
   */
  setTarget(x: number, y: number, rotation?: number, scale?: number) {
    this.targetX = x;
    this.targetY = y;
    if (rotation !== undefined) this.targetRotation = rotation;
    if (scale !== undefined) this.targetScale = scale;
  }

  /**
   * 更新动画。
   *
   * 使用 Lerp 插值逐步接近目标值。
   */
  update(): boolean {
    // 位置插值
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;

    // 旋转插值
    this.rotation += (this.targetRotation - this.rotation) * this.rotateLerpFactor;

    // 缩放插值
    this.scale += (this.targetScale - this.scale) * this.scaleLerpFactor;

    // 检查是否接近目标
    const dx = Math.abs(this.targetX - this.x);
    const dy = Math.abs(this.targetY - this.y);
    const dr = Math.abs(this.targetRotation - this.rotation);
    const ds = Math.abs(this.targetScale - this.scale);

    return dx < 0.5 && dy < 0.5 && dr < 0.01 && ds < 0.01;
  }
}
```

### 4.2 动画参数

```typescript
// 动画参数配置
const AnimationConfig = {
  lerpFactor: 0.12,        // 位置插值
  rotateLerpFactor: 0.08,  // 旋转插值
  scaleLerpFactor: 0.15,    // 缩放插值

  hoverOffset: 30,         // Hover 弹出距离
  hoverScale: 1.15,         // Hover 缩放

  cardRotation: 25,        // 出牌随机旋转角度

  drawInterval: 200,       // 抽牌间隔
};
```

---

## 五、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
