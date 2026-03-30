# 源码深度分析 - UnoThree后端游戏逻辑系统

## 一、文档概述

本文档深入分析 UnoThree 项目的后端游戏逻辑系统，涵盖游戏状态机、AI 决策引擎、卡片验证逻辑、特殊牌处理、质疑机制、UNO 抓漏、计分结算等核心实现。

---

## 二、游戏状态机系统

### 2.1 游戏状态定义

```typescript
/**
 * 游戏状态枚举
 * backend/src/game/types.ts
 */
export enum GameStatus {
  WAITING = 'WAITING',           // 等待中 - 玩家可加入/退出
  PLAYING = 'PLAYING',           // 游戏中 - 回合进行中
  ROUND_FINISHED = 'ROUND_FINISHED',  // 回合结束
  GAME_OVER = 'GAME_OVER',       // 游戏结束
}

/**
 * 卡牌颜色枚举
 */
export enum CardColor {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  WILD = 'WILD',
}

/**
 * 卡牌类型枚举
 */
export enum CardType {
  NUMBER = 'NUMBER',            // 数字牌
  SKIP = 'SKIP',                // 跳过
  REVERSE = 'REVERSE',          // 反转
  DRAW_TWO = 'DRAW_TWO',        // +2
  WILD = 'WILD',                // 万能牌
  WILD_DRAW_FOUR = 'WILD_DRAW_FOUR',  // +4
}

/**
 * 玩家类型枚举
 */
export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI',
}

/**
 * AI 难度枚举
 */
export enum AIDifficulty {
  EASY = 'E',
  MEDIUM = 'M',
  HARD = 'H',
}

/**
 * 游戏状态接口
 */
export interface GameState {
  // 基本信息
  roomId: string;                    // 房间 ID
  inviteToken?: string;              // 邀请码

  // 玩家信息
  players: Player[];                 // 玩家列表
  spectators: Player[];              // 观众列表

  // 牌堆信息
  deck: Card[];                      // 牌堆（仅服务端，广播时为 undefined）
  discardPile: Card[];               // 弃牌堆

  // 游戏进程
  currentPlayerIndex: number;         // 当前玩家索引
  direction: 1 | -1;                // 方向（1:顺时针, -1:逆时针）
  status: GameStatus;                // 游戏状态

  // 胜利者
  winner?: string;                   // 回合胜利者 ID
  gameWinner?: string;               // 游戏胜利者 ID

  // 当前有效颜色/类型/数值
  currentColor: CardColor;           // 当前颜色（Wild 用）
  currentType?: CardType;           // 当前卡牌类型
  currentValue?: number;            // 当前卡牌数值

  // 时间戳
  lastActionTimestamp: number;       // 最后操作时间戳
  pendingDissolveAt?: number;        // 房间待解散时间戳
  currentRound: number;              // 当前回合数

  // 特殊状态
  challengeData?: ChallengeData;     // 质疑数据
  pendingDrawPlay?: PendingDrawPlay; // 摸牌待定数据

  // 配置
  config: GameConfig;                // 游戏配置
}

/**
 * 玩家接口
 */
export interface Player {
  id: string;                        // Socket ID 或 AI UUID
  name: string;                      // 玩家名称
  sessionId?: string;                 // 会话 ID（仅服务端）
  reconnectToken?: string;           // 重连凭据（仅服务端）
  type: PlayerType;                  // HUMAN | AI
  difficulty?: AIDifficulty;          // AI 难度（E/M/H）
  hand: Card[];                      // 手牌（仅服务端）
  handCount: number;                 // 手牌数（脱敏后广播）
  score: number;                     // 累计得分
  isReady: boolean;                  // 是否准备
  hasShoutedUno: boolean;             // 是否已喊 UNO
  isMuted: boolean;                  // 静音状态
  isConnected: boolean;               // 在线状态
  lastHeartbeat: number;             // 最后心跳时间
  disconnectedAt?: number;           // 断开时间
  handSizeChangedTimestamp?: number; // 手牌变化时间戳（用于 UNO 抓漏）
  achievements: Achievement[];       // 成就
  isSpectator: boolean;              // 是否观众
}

/**
 * 卡牌接口
 */
export interface Card {
  id: string;                        // 卡牌唯一 ID（UUID v4）
  color: CardColor;                  // 卡牌颜色
  type: CardType;                    // 卡牌类型
  value?: number;                    // 数字牌数值（0-9）
}

/**
 * 质疑数据接口
 */
export interface ChallengeData {
  challengerId: string;              // 质疑者 ID
  challengedId: string;               // 被质疑者 ID
  cardId: string;                    // 被质疑的卡牌 ID
  cardColor: CardColor;              // 被质疑时选择的颜色
  timestamp: number;                 // 质疑时间戳
}

/**
 * 摸牌待定数据接口
 */
export interface PendingDrawPlay {
  playerId: string;                  // 摸牌玩家 ID
  cardId: string;                    // 摸到的牌 ID
  cardColor: CardColor;              // 摸到的牌颜色
  cardType: CardType;                // 摸到的牌类型
  timestamp: number;                 // 摸牌时间戳
}

/**
 * 游戏配置接口
 */
export interface GameConfig {
  // 房间设置
  playerLimit: number;               // 玩家上限
  deckCount: number;                 // 牌组数量
  maxRounds: number;                // 最大回合数
  maxScore: number;                  // 最大分数

  // 超时设置
  turnTimeout: number;              // 回合超时（秒）
  disconnectGraceSeconds: number;   // 离线保留窗口（秒）
  unoGracePeriod: number;           // UNO 抓漏宽限期（毫秒）
  heartbeatInterval: number;        // 心跳间隔（毫秒）

  // AI 设置
  aiThinkDelay: number;             // AI 思考延迟（毫秒）
  aiEasyChance: number;              // Easy AI 出牌概率
  aiMediumChance: number;            // Medium AI 出牌概率
}

/**
 * 成就接口
 */
export interface Achievement {
  id: string;                        // 成就 ID
  title: string;                     // 成就标题
  description: string;               // 成就描述
  unlockedAt?: number;               // 解锁时间戳
}
```

### 2.2 游戏服务实现

```typescript
/**
 * 游戏服务
 * backend/src/game/game/game.service.ts
 */
@Injectable()
export class GameService {
  // 游戏实例存储（内存 Map）
  private games: Map<string, GameState> = new Map();

  // 默认配置
  private readonly defaultConfig: GameConfig = {
    playerLimit: 4,
    deckCount: 1,
    maxRounds: 6,
    maxScore: 500,
    turnTimeout: 15000,
    disconnectGraceSeconds: 60,
    unoGracePeriod: 2000,
    heartbeatInterval: 30000,
    aiThinkDelay: 1500,
    aiEasyChance: 0.3,
    aiMediumChance: 0.6,
  };

  constructor(
    private gameGateway: GameGateway,
    private gameMonitorService: GameMonitorService,
  ) {
    // 启动全局定时器
    this.startGlobalTimer();
  }

  /**
   * 创建/加入游戏
   */
  async joinGame(
    roomId: string,
    playerId: string,
    playerName: string,
    config?: Partial<GameConfig>,
  ): Promise<GameState> {
    let game = this.games.get(roomId);

    if (!game) {
      // 创建新游戏
      game = this.createGame(roomId, config);
      this.games.set(roomId, game);
    }

    // 检查是否已存在同名玩家
    const existingPlayer = game.players.find((p) => p.name === playerName);
    if (existingPlayer) {
      // 重连逻辑
      existingPlayer.id = playerId;
      existingPlayer.isConnected = true;
      existingPlayer.lastHeartbeat = Date.now();

      this.gameMonitorService.logEvent(roomId, 'PLAYER_RECONNECT', {
        playerId,
        playerName,
      });

      return game;
    }

    // 检查人数限制
    if (game.players.length >= game.config.playerLimit) {
      throw new Error('房间已满');
    }

    // 添加玩家
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      sessionId: this.generateSessionId(),
      reconnectToken: this.generateReconnectToken(),
      type: PlayerType.HUMAN,
      hand: [],
      handCount: 0,
      score: 0,
      isReady: false,
      hasShoutedUno: false,
      isMuted: false,
      isConnected: true,
      lastHeartbeat: Date.now(),
      achievements: [],
      isSpectator: false,
    };

    game.players.push(newPlayer);

    this.gameMonitorService.logEvent(roomId, 'PLAYER_JOIN', {
      playerId,
      playerName,
      playerCount: game.players.length,
    });

    // 广播游戏状态
    await this.broadcastState(roomId);

    return game;
  }

  /**
   * 创建游戏实例
   */
  private createGame(roomId: string, config?: Partial<GameConfig>): GameState {
    const finalConfig = { ...this.defaultConfig, ...config };

    const gameState: GameState = {
      roomId,
      inviteToken: this.generateInviteToken(),
      players: [],
      spectators: [],
      deck: this.generateUnoDeck(finalConfig.deckCount),
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      status: GameStatus.WAITING,
      currentColor: CardColor.RED,
      config: finalConfig,
      lastActionTimestamp: Date.now(),
      currentRound: 1,
    };

    this.gameMonitorService.logEvent(roomId, 'GAME_CREATED', {
      config: finalConfig,
    });

    return gameState;
  }

  /**
   * 生成 UNO 牌组
   */
  private generateUnoDeck(deckCount: number): Card[] {
    const deck: Card[] = [];
    const colors: CardColor[] = [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE];

    for (let i = 0; i < deckCount; i++) {
      // 数字牌（每种颜色 0-9，0 两张，1-9 各一张）
      for (const color of colors) {
        // 0 号牌（每种颜色一张）
        deck.push({
          id: this.generateCardId(),
          color,
          type: CardType.NUMBER,
          value: 0,
        });

        // 1-9 号牌（每种颜色两张）
        for (let value = 1; value <= 9; value++) {
          deck.push({
            id: this.generateCardId(),
            color,
            type: CardType.NUMBER,
            value,
          });
          deck.push({
            id: this.generateCardId(),
            color,
            type: CardType.NUMBER,
            value,
          });
        }

        // 功能牌（每种颜色两张）
        const functionTypes: CardType[] = [CardType.SKIP, CardType.REVERSE, CardType.DRAW_TWO];
        for (const type of functionTypes) {
          deck.push({
            id: this.generateCardId(),
            color,
            type,
          });
          deck.push({
            id: this.generateCardId(),
            color,
            type,
          });
        }
      }

      // 万能牌（每种 4 张）
      for (let i = 0; i < 4; i++) {
        deck.push({
          id: this.generateCardId(),
          color: CardColor.WILD,
          type: CardType.WILD,
        });
        deck.push({
          id: this.generateCardId(),
          color: CardColor.WILD,
          type: CardType.WILD_DRAW_FOUR,
        });
      }
    }

    // 洗牌
    this.shuffleDeck(deck);

    return deck;
  }

  /**
   * 洗牌
   */
  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  /**
   * 开始游戏
   */
  async startGame(roomId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new Error('游戏已开始');
    }

    // 检查是否所有玩家都准备好了
    const allReady = game.players.every((p) => p.isReady);
    if (!allReady && game.players.length > 1) {
      throw new Error('请等待所有玩家准备');
    }

    // 重置牌堆和弃牌堆
    game.deck = this.generateUnoDeck(game.config.deckCount);
    game.discardPile = [];

    // 发牌（每人 7 张）
    for (const player of game.players) {
      const cards = this.drawFromDeck(game, 7);
      player.hand = cards;
      player.handCount = cards.length;
    }

    // 翻开第一张牌（必须是数字牌）
    let firstCard = this.drawFromDeck(game, 1)[0];
    while (firstCard.type !== CardType.NUMBER) {
      game.deck.push(firstCard);
      this.shuffleDeck(game.deck);
      firstCard = this.drawFromDeck(game, 1)[0];
    }

    game.discardPile.push(firstCard);
    game.currentColor = firstCard.color;
    game.currentType = firstCard.type;
    game.currentValue = firstCard.value;

    // 设置游戏状态
    game.status = GameStatus.PLAYING;
    game.lastActionTimestamp = Date.now();
    game.currentPlayerIndex = Math.floor(Math.random() * game.players.length);

    // 记录游戏开始
    this.gameMonitorService.logEvent(roomId, 'GAME_STARTED', {
      playerCount: game.players.length,
      deckCount: game.config.deckCount,
    });

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 出牌
   */
  async playCard(
    roomId: string,
    playerId: string,
    cardId: string,
    colorSelection?: CardColor,
  ): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    if (game.status !== GameStatus.PLAYING) {
      throw new Error('游戏未开始');
    }

    // 验证当前玩家
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('不是你的回合');
    }

    // 验证卡牌是否存在
    const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('未持有该牌');
    }

    const card = currentPlayer.hand[cardIndex];

    // 验证出牌合法性
    if (!this.validateMove(game, card)) {
      throw new Error('出牌非法');
    }

    // WILD 牌需要选择颜色
    if (card.color === CardColor.WILD && !colorSelection) {
      throw new Error('WILD 牌需要选择颜色');
    }

    // 从手牌中移除
    currentPlayer.hand.splice(cardIndex, 1);
    currentPlayer.handCount = currentPlayer.hand.length;

    // 记录手牌变化时间戳
    if (currentPlayer.handCount === 1) {
      currentPlayer.handSizeChangedTimestamp = Date.now();
    }

    // 检查是否需要喊 UNO
    if (currentPlayer.handCount === 1 && !currentPlayer.hasShoutedUno) {
      // 此时玩家可能会被其他玩家抓漏
    }

    // 添加到弃牌堆
    game.discardPile.push(card);

    // 更新当前颜色/类型/数值
    game.currentColor = colorSelection || card.color;
    game.currentType = card.type;
    game.currentValue = card.value;

    // 重置 UNO 标记
    currentPlayer.hasShoutedUno = false;

    // 记录出牌操作
    this.gameMonitorService.logEvent(roomId, 'CARD_PLAYED', {
      playerId,
      cardId,
      cardColor: card.color,
      cardType: card.type,
      colorSelection,
    });

    // 处理卡牌效果
    await this.processCardEffects(roomId, card);

    // 更新最后操作时间
    game.lastActionTimestamp = Date.now();

    // 检查是否获胜
    if (currentPlayer.handCount === 0) {
      await this.settleRound(roomId, playerId);
      return;
    }

    // 推进回合
    this.advanceTurn(game);

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 验证出牌合法性
   */
  private validateMove(game: GameState, card: Card): boolean {
    const top = game.discardPile[game.discardPile.length - 1];

    // WILD 牌总是可出
    if (card.color === CardColor.WILD) {
      return true;
    }

    // 颜色匹配
    if (card.color === game.currentColor) {
      return true;
    }

    // 数字牌数值匹配
    if (card.type === CardType.NUMBER && top.type === CardType.NUMBER) {
      if (card.value === top.value) {
        return true;
      }
    }

    // 功能牌类型匹配
    if (card.type !== CardType.NUMBER && card.type === top.type) {
      return true;
    }

    return false;
  }

  /**
   * 处理卡牌效果
   */
  private async processCardEffects(roomId: string, card: Card): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) return;

    switch (card.type) {
      case CardType.SKIP:
        // 跳过下一位玩家
        this.advanceTurn(game, 2);
        this.gameMonitorService.logEvent(roomId, 'SKIP_EFFECT', {
          currentPlayerIndex: game.currentPlayerIndex,
        });
        break;

      case CardType.REVERSE:
        // 反转方向
        game.direction *= -1;
        // 如果只有两个玩家，反转相当于跳过
        if (game.players.length === 2) {
          this.advanceTurn(game, 2);
        }
        this.gameMonitorService.logEvent(roomId, 'REVERSE_EFFECT', {
          direction: game.direction,
        });
        break;

      case CardType.DRAW_TWO:
        // 下一位玩家摸 2 张
        const nextPlayerIndex = this.getNextPlayerIndex(game, 1);
        const nextPlayer = game.players[nextPlayerIndex];
        const cards = this.drawFromDeck(game, 2);
        nextPlayer.hand.push(...cards);
        nextPlayer.handCount = nextPlayer.hand.length;
        // 跳过下一位玩家
        this.advanceTurn(game, 2);
        this.gameMonitorService.logEvent(roomId, 'DRAW_TWO_EFFECT', {
          targetPlayerId: nextPlayer.id,
        });
        break;

      case CardType.WILD_DRAW_FOUR:
        // 设置质疑数据
        game.challengeData = {
          challengerId: game.players[game.currentPlayerIndex].id,
          challengedId: game.players[this.getNextPlayerIndex(game, 1)].id,
          cardId: card.id,
          cardColor: game.currentColor,
          timestamp: Date.now(),
        };
        // 质疑阶段不推进回合，等待挑战结果
        this.gameMonitorService.logEvent(roomId, 'WILD_DRAW_FOUR_PLAYED', {
          playerId: game.players[game.currentPlayerIndex].id,
          colorSelection: game.currentColor,
        });
        return;

      case CardType.WILD:
        // WILD 牌正常处理
        break;

      case CardType.NUMBER:
      default:
        // 数字牌无特殊效果
        break;
    }
  }

  /**
   * 摸牌
   */
  async drawCard(roomId: string, playerId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    if (game.status !== GameStatus.PLAYING) {
      throw new Error('游戏未开始');
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('不是你的回合');
    }

    // 摸一张牌
    const card = this.drawFromDeck(game, 1)[0];
    currentPlayer.hand.push(card);
    currentPlayer.handCount = currentPlayer.hand.length;

    // 记录手牌变化时间戳
    if (currentPlayer.handCount === 1) {
      currentPlayer.handSizeChangedTimestamp = Date.now();
    }

    // 检查摸到的牌是否可出
    if (this.validateMove(game, card)) {
      // 设置摸牌待定数据
      game.pendingDrawPlay = {
        playerId,
        cardId: card.id,
        cardColor: card.color,
        cardType: card.type,
        timestamp: Date.now(),
      };
    } else {
      // 不可出，推进回合
      this.advanceTurn(game);
    }

    // 更新最后操作时间
    game.lastActionTimestamp = Date.now();

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 从牌堆摸牌
   */
  private drawFromDeck(game: GameState, count: number): Card[] {
    // 检查牌堆是否足够
    if (game.deck.length < count) {
      this.reshuffleDiscardPile(game);
    }

    return game.deck.splice(0, count);
  }

  /**
   * 重新洗牌（弃牌堆转牌堆）
   */
  private reshuffleDiscardPile(game: GameState): void {
    const topCard = game.discardPile.pop()!;
    game.deck = [...game.discardPile];
    game.discardPile = [topCard];

    this.shuffleDeck(game.deck);

    this.gameMonitorService.logEvent(game.roomId, 'RESHUFFLE', {
      deckSize: game.deck.length,
    });
  }

  /**
   * 推进回合
   */
  private advanceTurn(game: GameState, step: number = 1): void {
    const playerCount = game.players.length;
    const nextIndex = (game.currentPlayerIndex + (step * game.direction)) % playerCount;

    game.currentPlayerIndex = nextIndex;
  }

  /**
   * 获取下一个玩家索引
   */
  private getNextPlayerIndex(game: GameState, step: number = 1): number {
    const playerCount = game.players.length;
    return (game.currentPlayerIndex + (step * game.direction)) % playerCount;
  }

  /**
   * 喊 UNO
   */
  async shoutUno(roomId: string, playerId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    player.hasShoutedUno = true;

    this.gameMonitorService.logEvent(roomId, 'UNO_SHOUTED', {
      playerId,
    });

    // 广播 UNO 喊叫
    this.gameGateway.server.to(roomId).emit('playerShoutedUno', playerId);

    // 更新最后操作时间
    game.lastActionTimestamp = Date.now();

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 抓漏 UNO
   */
  async catchUnoFailure(roomId: string, targetId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    const target = game.players.find((p) => p.id === targetId);
    if (!target) {
      throw new Error('目标玩家不存在');
    }

    const now = Date.now();
    const gracePeriodPassed = target.handSizeChangedTimestamp
      ? now - target.handSizeChangedTimestamp > game.config.unoGracePeriod
      : true;

    if (target.hand.length === 1 && !target.hasShoutedUno && gracePeriodPassed) {
      // 抓漏成功，罚摸 2 张
      const cards = this.drawFromDeck(game, 2);
      target.hand.push(...cards);
      target.handCount = target.hand.length;
      target.hasShoutedUno = false;
      target.handSizeChangedTimestamp = undefined;

      this.gameMonitorService.logEvent(roomId, 'UNO_CAUGHT', {
        targetId,
        penalty: 2,
      });

      this.gameGateway.server.to(roomId).emit('unoPenalty', {
        targetId,
        penalty: 2,
      });
    }

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 质疑 +4
   */
  async challenge(
    roomId: string,
    playerId: string,
    accept: boolean,
  ): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    const challengeData = game.challengeData;
    if (!challengeData) {
      throw new Error('没有可质疑的操作');
    }

    const challenger = game.players.find((p) => p.id === playerId);
    const challenged = game.players.find((p) => p.id === challengeData.challengedId);

    if (!challenger || !challenged) {
      throw new Error('玩家不存在');
    }

    if (accept) {
      // 执行质疑
      const hadSameColor = challenged.hand.some(
        (card) => card.color === challengeData.cardColor && card.id !== challengeData.cardId
      );

      if (hadSameColor) {
        // 质疑成功，被质疑者罚摸 6 张
        const cards = this.drawFromDeck(game, 6);
        challenged.hand.push(...cards);
        challenged.handCount = challenged.hand.length;

        this.gameMonitorService.logEvent(roomId, 'CHALLENGE_SUCCESS', {
          challengerId: playerId,
          challengedId,
          penalty: 6,
        });
      } else {
        // 质疑失败，质疑者罚摸 6 张
        const cards = this.drawFromDeck(game, 6);
        challenger.hand.push(...cards);
        challenger.handCount = challenger.hand.length;

        this.gameMonitorService.logEvent(roomId, 'CHALLENGE_FAILED', {
          challengerId: playerId,
          challengedId,
          penalty: 6,
        });
      }
    } else {
      // 接受 +4，质疑者罚摸 4 张
      const cards = this.drawFromDeck(game, 4);
      challenger.hand.push(...cards);
      challenger.handCount = challenger.hand.length;

      this.gameMonitorService.logEvent(roomId, 'CHALLENGE_ACCEPTED', {
        challengerId: playerId,
        penalty: 4,
      });
    }

    // 被质疑者实际摸 4 张
    const challengeTarget = game.players.find((p) => p.id === challengeData.challengedId);
    if (challengeTarget) {
      const drawCards = this.drawFromDeck(game, 4);
      challengeTarget.hand.push(...drawCards);
      challengeTarget.handCount = challengeTarget.hand.length;
    }

    // 清除质疑数据
    game.challengeData = undefined;

    // 推进回合
    this.advanceTurn(game, 2);

    // 更新最后操作时间
    game.lastActionTimestamp = Date.now();

    // 广播游戏状态
    await this.broadcastState(roomId);
  }

  /**
   * 处理摸牌后决策
   */
  async handlePendingDrawPlay(roomId: string, playerId: string, play: boolean): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('游戏不存在');
    }

    const pendingDrawPlay = game.pendingDrawPlay;
    if (!pendingDrawPlay || pendingDrawPlay.playerId !== playerId) {
      throw new Error('没有待处理的摸牌决策');
    }

    if (play) {
      // 打出摸到的牌
      await this.playCard(
        roomId,
        playerId,
        pendingDrawPlay.cardId,
        pendingDrawPlay.cardColor,
      );
    } else {
      // 保留摸到的牌，推进回合
      this.advanceTurn(game);
      game.lastActionTimestamp = Date.now();
      await this.broadcastState(roomId);
    }

    // 清除待定数据
    game.pendingDrawPlay = undefined;
  }

  /**
   * 结算回合
   */
  private async settleRound(roomId: string, winnerId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) return;

    const winner = game.players.find((p) => p.id === winnerId);
    if (!winner) return;

    game.winner = winnerId;
    game.status = GameStatus.ROUND_FINISHED;

    // 计算分数
    let score = 0;
    game.players.forEach((player) => {
      if (player.id !== winnerId) {
        player.hand.forEach((card) => {
          if (card.type === CardType.NUMBER) {
            score += card.value || 0;
          } else if (
            [CardType.SKIP, CardType.REVERSE, CardType.DRAW_TWO].includes(card.type)
          ) {
            score += 20;
          } else if (
            [CardType.WILD, CardType.WILD_DRAW_FOUR].includes(card.type)
          ) {
            score += 50;
          }
        });
      }
    });

    winner.score += score;

    this.gameMonitorService.logEvent(roomId, 'ROUND_FINISHED', {
      winnerId,
      score,
      roundNumber: game.currentRound,
    });

    // 广播游戏状态
    await this.broadcastState(roomId);

    // 检查是否游戏结束
    const maxScore = game.config.maxScore;
    const maxRounds = game.config.maxRounds;

    const anyPlayerMaxScore = game.players.some((p) => p.score >= maxScore);
    const currentRound = game.currentRound;

    if (anyPlayerMaxScore || currentRound >= maxRounds) {
      // 游戏结束
      this.endGame(roomId);
    }
  }

  /**
   * 结束游戏
   */
  private async endGame(roomId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) return;

    game.status = GameStatus.GAME_OVER;

    // 找出游戏胜利者
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    game.gameWinner = sortedPlayers[0].id;

    this.gameMonitorService.logEvent(roomId, 'GAME_OVER', {
      winnerId: game.gameWinner,
      finalScores: game.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
    });

    // 广播游戏状态
    await this.broadcastState(roomId);

    // 延迟删除房间
    setTimeout(() => {
      this.closeRoom(roomId);
    }, 30000); // 30 秒后删除
  }

  /**
   * 广播游戏状态（脱敏）
   */
  private async broadcastState(roomId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) return;

    // 脱敏处理
    const publicState: Partial<GameState> = {
      ...game,
      deck: undefined, // 隐藏牌堆
      players: game.players.map((player) => ({
        ...player,
        hand: undefined, // 隐藏手牌
        sessionId: undefined, // 隐藏会话 ID
        reconnectToken: undefined, // 隐藏重连凭据
      })),
      spectators: game.spectators.map((spectator) => ({
        ...spectator,
        sessionId: undefined,
        reconnectToken: undefined,
      })),
    };

    this.gameGateway.server.to(roomId).emit('gameStateUpdate', publicState);
  }

  /**
   * 全局定时器
   */
  private startGlobalTimer(): void {
    setInterval(async () => {
      const now = Date.now();

      for (const [roomId, game] of this.games.entries()) {
        if (game.status === GameStatus.PLAYING) {
          const currentPlayer = game.players[game.currentPlayerIndex];

          // AI 决策
          if (
            currentPlayer.type === PlayerType.AI &&
            now - game.lastActionTimestamp > game.config.aiThinkDelay
          ) {
            this.gameMonitorService.logEvent(roomId, 'AI_TURN', {
              playerId: currentPlayer.id,
            });
            await this.executeAiTurn(roomId, currentPlayer);
          }

          // 超时代打
          if (now - game.lastActionTimestamp > game.config.turnTimeout) {
            this.gameMonitorService.logEvent(roomId, 'AUTO_PLAY', {
              playerId: currentPlayer.id,
            });
            await this.autoPlay(roomId);
          }
        }

        // 检查心跳
        this.checkHeartbeats(game, roomId, now);

        // 清理僵尸房间
        this.checkDissolveRoom(game, roomId, now);
      }
    }, 1000);
  }

  /**
   * 执行 AI 回合
   */
  private async executeAiTurn(roomId: string, aiPlayer: Player): Promise<void> {
    const game = this.games.get(roomId);
    if (!game || !aiPlayer.difficulty) return;

    // 获取 AI 决策
    const move = this.aiService.getBestMove(game, aiPlayer, aiPlayer.difficulty);

    if (move.type === 'play') {
      await this.playCard(
        roomId,
        aiPlayer.id,
        move.cardId,
        move.colorSelection,
      );
    } else if (move.type === 'shoutUno') {
      await this.shoutUno(roomId, aiPlayer.id);
      await this.playCard(
        roomId,
        aiPlayer.id,
        move.cardId,
        move.colorSelection,
      );
    } else {
      await this.drawCard(roomId, aiPlayer.id);

      // 检查是否有摸牌待定
      if (game.pendingDrawPlay && game.pendingDrawPlay.playerId === aiPlayer.id) {
        // AI 总是打出可出的牌
        await this.handlePendingDrawPlay(roomId, aiPlayer.id, true);
      }
    }
  }

  /**
   * 自动出牌
   */
  private async autoPlay(roomId: string): Promise<void> {
    const game = this.games.get(roomId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayerIndex];

    // 尝试找到可出的牌
    const playableCards = currentPlayer.hand.filter((card) => this.validateMove(game, card));

    if (playableCards.length > 0) {
      // 随机选择一张可出的牌
      const card = playableCards[Math.floor(Math.random() * playableCards.length)];
      const colorSelection =
        card.color === CardColor.WILD
          ? [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE][
              Math.floor(Math.random() * 4)
            ]
          : undefined;

      await this.playCard(roomId, currentPlayer.id, card.id, colorSelection);
    } else {
      // 摸牌
      await this.drawCard(roomId, currentPlayer.id);
    }
  }

  /**
   * 检查心跳
   */
  private checkHeartbeats(game: GameState, roomId: string, now: number): void {
    for (const player of [...game.players, ...game.spectators]) {
      if (player.type === PlayerType.HUMAN) {
        const heartbeatTimeout = now - player.lastHeartbeat > game.config.heartbeatInterval;

        if (heartbeatTimeout && player.isConnected) {
          player.isConnected = false;
          player.disconnectedAt = now;

          this.gameGateway.server.to(roomId).emit('playerStatusUpdate', {
            playerId: player.id,
            isConnected: false,
          });

          this.gameMonitorService.logEvent(roomId, 'PLAYER_DISCONNECTED', {
            playerId: player.id,
            playerName: player.name,
          });

          // 检查是否所有人类玩家都离线
          const allHumanPlayersOffline = game.players.every(
            (p) => p.type === PlayerType.AI || !p.isConnected
          );

          if (allHumanPlayersOffline) {
            game.pendingDissolveAt = now + game.config.disconnectGraceSeconds * 1000;
          }
        }
      }
    }
  }

  /**
   * 检查是否需要解散房间
   */
  private async checkDissolveRoom(game: GameState, roomId: string, now: number): Promise<void> {
    if (game.pendingDissolveAt && now >= game.pendingDissolveAt) {
      this.closeRoom(roomId);
    }
  }

  /**
   * 关闭房间
   */
  private async closeRoom(roomId: string): Promise<void> {
    this.games.delete(roomId);

    this.gameMonitorService.logEvent(roomId, 'ROOM_CLOSED', {});

    this.gameGateway.server.to(roomId).emit('roomClosed', {
      roomId,
      reason: '游戏结束',
    });
  }

  // 工具方法
  private generateCardId(): string {
    return uuidv4();
  }

  private generateSessionId(): string {
    return uuidv4();
  }

  private generateReconnectToken(): string {
    return randomBytes(16).toString('hex');
  }

  private generateInviteToken(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }
}
```

---

## 三、AI 决策引擎

### 3.1 AI 服务

```typescript
/**
 * AI 服务
 * backend/src/game/game/ai.service.ts
 */
@Injectable()
export class AiService {
  /**
   * 获取最佳移动
   */
  getBestMove(
    game: GameState,
    aiPlayer: Player,
    difficulty: AIDifficulty,
  ): {
    type: 'play' | 'draw' | 'shoutUno';
    cardId?: string;
    colorSelection?: CardColor;
  } {
    const playableCards = this.getPlayableCards(game, aiPlayer);

    // 检查是否需要喊 UNO
    if (aiPlayer.handCount <= 2 && !aiPlayer.hasShoutedUno) {
      return {
        type: 'shoutUno',
        cardId: playableCards[0]?.id,
        colorSelection: this.selectBestColor(game, playableCards[0]),
      };
    }

    // 没有可出的牌，必须摸牌
    if (playableCards.length === 0) {
      return { type: 'draw' };
    }

    // 根据难度选择策略
    switch (difficulty) {
      case AIDifficulty.EASY:
        return this.easyStrategy(game, aiPlayer, playableCards);
      case AIDifficulty.MEDIUM:
        return this.mediumStrategy(game, aiPlayer, playableCards);
      case AIDifficulty.HARD:
        return this.hardStrategy(game, aiPlayer, playableCards);
      default:
        return this.easyStrategy(game, aiPlayer, playableCards);
    }
  }

  /**
   * 获取可出的牌
   */
  private getPlayableCards(game: GameState, player: Player): Card[] {
    return player.hand.filter((card) => this.validateMove(game, card));
  }

  /**
   * 验证出牌合法性
   */
  private validateMove(game: GameState, card: Card): boolean {
    const top = game.discardPile[game.discardPile.length - 1];

    if (card.color === CardColor.WILD) {
      return true;
    }

    if (card.color === game.currentColor) {
      return true;
    }

    if (card.type === CardType.NUMBER && top.type === CardType.NUMBER) {
      if (card.value === top.value) {
        return true;
      }
    }

    if (card.type !== CardType.NUMBER && card.type === top.type) {
      return true;
    }

    return false;
  }

  /**
   * Easy 策略（随机）
   */
  private easyStrategy(
    game: GameState,
    player: Player,
    playableCards: Card[],
  ): { type: 'play'; cardId: string; colorSelection?: CardColor } {
    // 随机选择一张可出的牌
    const card = playableCards[Math.floor(Math.random() * playableCards.length)];
    const colorSelection = this.selectBestColor(game, card);

    return {
      type: 'play',
      cardId: card.id,
      colorSelection,
    };
  }

  /**
   * Medium 策略（优先出数字牌）
   */
  private mediumStrategy(
    game: GameState,
    player: Player,
    playableCards: Card[],
  ): { type: 'play'; cardId: string; colorSelection?: CardColor } {
    // 优先出数字牌
    const numberCards = playableCards.filter((c) => c.type === CardType.NUMBER);
    if (numberCards.length > 0) {
      const card = numberCards[Math.floor(Math.random() * numberCards.length)];
      const colorSelection = this.selectBestColor(game, card);

      return {
        type: 'play',
        cardId: card.id,
        colorSelection,
      };
    }

    // 其次出功能牌
    const functionCards = playableCards.filter((c) =>
      [CardType.SKIP, CardType.REVERSE, CardType.DRAW_TWO].includes(c.type)
    );
    if (functionCards.length > 0) {
      const card = functionCards[Math.floor(Math.random() * functionCards.length)];
      const colorSelection = this.selectBestColor(game, card);

      return {
        type: 'play',
        cardId: card.id,
        colorSelection,
      };
    }

    // 最后出 WILD 牌
    const wildCards = playableCards.filter((c) =>
      [CardType.WILD, CardType.WILD_DRAW_FOUR].includes(c.type)
    );
    const card = wildCards[Math.floor(Math.random() * wildCards.length)];
    const colorSelection = this.selectBestColor(game, card);

    return {
      type: 'play',
      cardId: card.id,
      colorSelection,
    };
  }

  /**
   * Hard 策略（考虑剩余牌数）
   */
  private hardStrategy(
    game: GameState,
    player: Player,
    playableCards: Card[],
  ): { type: 'play'; cardId: string; colorSelection?: CardColor } {
    // 计算每张牌的优先级
    const scoredCards = playableCards.map((card) => ({
      card,
      score: this.calculateCardScore(game, player, card),
    }));

    // 按优先级排序
    scoredCards.sort((a, b) => b.score - a.score);

    // 选择优先级最高的牌
    const card = scoredCards[0].card;
    const colorSelection = this.selectBestColor(game, card);

    return {
      type: 'play',
      cardId: card.id,
      colorSelection,
    };
  }

  /**
   * 计算卡牌优先级
   */
  private calculateCardScore(
    game: GameState,
    player: Player,
    card: Card,
  ): number {
    let score = 0;

    // 优先出数字牌
    if (card.type === CardType.NUMBER) {
      score += 50;
      // 优先出数字小的牌
      score += (9 - (card.value || 0)) * 5;
    }

    // 功能牌中等优先级
    if ([CardType.SKIP, CardType.REVERSE].includes(card.type)) {
      score += 30;
    }

    // DRAW_TWO 较低优先级（避免触发对手）
    if (card.type === CardType.DRAW_TWO) {
      score += 20;
    }

    // WILD 牌优先级最低
    if (card.type === CardType.WILD) {
      score += 10;
    }

    // WILD_DRAW_FOUR 优先级最低（避免被质疑）
    if (card.type === CardType.WILD_DRAW_FOUR) {
      score += 5;
    }

    // 检查是否可以改变颜色到对手手牌少的颜色
    const opponentHandColors = this.getOpponentHandColors(game, player);
    const bestColor = this.selectBestColor(game, card, opponentHandColors);

    if (card.color === CardColor.WILD && bestColor) {
      // 如果可以改变到对手手牌少的颜色，增加优先级
      const opponentCardsInColor = opponentHandColors.get(bestColor) || 0;
      score += opponentCardsInColor;
    }

    return score;
  }

  /**
   * 获取对手手牌颜色分布
   */
  private getOpponentHandColors(
    game: GameState,
    currentPlayer: Player,
  ): Map<CardColor, number> {
    const colorCount = new Map<CardColor, number>();

    for (const player of game.players) {
      if (player.id === currentPlayer.id) continue;

      // 估算对手手牌颜色（基于已出的牌）
      for (const card of game.discardPile) {
        if (card.color !== CardColor.WILD) {
          colorCount.set(
            card.color,
            (colorCount.get(card.color) || 0) + 1
          );
        }
      }
    }

    return colorCount;
  }

  /**
   * 选择最佳颜色
   */
  private selectBestColor(
    game: GameState,
    card: Card,
    opponentHandColors?: Map<CardColor, number>,
  ): CardColor {
    if (card.color !== CardColor.WILD) {
      return card.color;
    }

    const colors: CardColor[] = [CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE];

    // 如果没有对手信息，随机选择
    if (!opponentHandColors) {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    // 选择对手手牌最少的颜色
    let bestColor = colors[0];
    let minCount = Infinity;

    for (const color of colors) {
      const count = opponentHandColors.get(color) || 0;
      if (count < minCount) {
        minCount = count;
        bestColor = color;
      }
    }

    return bestColor;
  }
}
```

---

## 四、游戏网关

### 4.1 Socket Gateway

```typescript
/**
 * 游戏 Gateway
 * backend/src/game/game/game.gateway.ts
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  /**
   * Gateway 初始化
   */
  afterInit(server: Server): void {
    console.log('[GameGateway] Initialized');
  }

  /**
   * 客户端连接
   */
  async handleConnection(client: Socket) {
    console.log('[GameGateway] Client connected:', client.id);
  }

  /**
   * 客户端断开
   */
  async handleDisconnect(client: Socket) {
    console.log('[GameGateway] Client disconnected:', client.id);
  }

  /**
   * 加入房间
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody()
    data: {
      roomId: string;
      playerName: string;
      config?: Partial<GameConfig>;
      inviteToken?: string;
      sessionId?: string;
      reconnectToken?: string;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<GameState> {
    const { roomId, playerName, config, inviteToken, sessionId, reconnectToken } = data;

    // 加入游戏
    const gameState = await this.gameService.joinGame(
      roomId,
      client.id,
      playerName,
      config
    );

    // 发送重连凭据
    const player = gameState.players.find((p) => p.id === client.id);
    if (player) {
      client.emit('reconnectCredentials', {
        sessionId: player.sessionId,
        reconnectToken: player.reconnectToken,
      });
    }

    return gameState;
  }

  /**
   * 添加 AI
   */
  @SubscribeMessage('addAi')
  async handleAddAi(
    @MessageBody() data: { roomId: string; difficulty: AIDifficulty },
    @ConnectedSocket() client: Socket,
  ): Promise<GameState> {
    const { roomId, difficulty } = data;

    // 添加 AI 玩家
    const aiId = `ai-${uuidv4()}`;
    const aiName = `AI (${difficulty})`;

    const gameState = await this.gameService.joinGame(
      roomId,
      aiId,
      aiName,
      {}
    );

    // 设置 AI 属性
    const aiPlayer = gameState.players.find((p) => p.id === aiId);
    if (aiPlayer) {
      aiPlayer.type = PlayerType.AI;
      aiPlayer.difficulty = difficulty;
      aiPlayer.isReady = true;
    }

    return gameState;
  }

  /**
   * 开始游戏
   */
  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    await this.gameService.startGame(data.roomId);
  }

  /**
   * 出牌
   */
  @SubscribeMessage('playCard')
  async handlePlayCard(
    @MessageBody() data: {
      roomId: string;
      cardId: string;
      colorSelection?: CardColor;
    },
  ): Promise<void> {
    await this.gameService.playCard(
      data.roomId,
      this.getClientId(data),
      data.cardId,
      data.colorSelection,
    );
  }

  /**
   * 摸牌
   */
  @SubscribeMessage('drawCard')
  async handleDrawCard(
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    await this.gameService.drawCard(
      data.roomId,
      this.getClientId(data),
    );
  }

  /**
   * 喊 UNO
   */
  @SubscribeMessage('shoutUno')
  async handleShoutUno(
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    await this.gameService.shoutUno(
      data.roomId,
      this.getClientId(data),
    );
  }

  /**
   * 抓漏 UNO
   */
  @SubscribeMessage('catchUnoFailure')
  async handleCatchUnoFailure(
    @MessageBody() data: { roomId: string; targetId: string },
  ): Promise<void> {
    await this.gameService.catchUnoFailure(
      data.roomId,
      data.targetId,
    );
  }

  /**
   * 质疑 +4
   */
  @SubscribeMessage('challenge')
  async handleChallenge(
    @MessageBody() data: { roomId: string; accept: boolean },
  ): Promise<void> {
    await this.gameService.challenge(
      data.roomId,
      this.getClientId(data),
      data.accept,
    );
  }

  /**
   * 摸牌后决策
   */
  @SubscribeMessage('handlePendingDrawPlay')
  async handlePendingDrawPlay(
    @MessageBody() data: { roomId: string; play: boolean },
  ): Promise<void> {
    await this.gameService.handlePendingDrawPlay(
      data.roomId,
      this.getClientId(data),
      data.play,
    );
  }

  /**
   * 心跳
   */
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<void> {
    // 心跳处理在 GameService 中通过定时器完成
    return;
  }

  /**
   * 离开房间
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.gameService.leaveRoom(data.roomId, client.id);
  }

  private getClientId(data: any): string {
    // 在实际实现中，从 Socket 连接中获取客户端 ID
    return data.clientId || 'unknown';
  }
}
```

---

## 五、总结

UnoThree 后端游戏逻辑系统是一个功能完整的 UNO 游戏服务器，具有以下特点：

1. **游戏状态机**：完整的游戏状态管理，支持等待中、游戏中、回合结束、游戏结束四种状态
2. **卡片验证**：严格的出牌合法性验证，支持颜色匹配、数值匹配、类型匹配
3. **特殊牌处理**：完整实现 SKIP、REVERSE、DRAW_TWO、WILD、WILD_DRAW_FOUR 五种特殊牌效果
4. **质疑机制**：完整的 +4 质疑机制，包括质疑成功/失败的判定和惩罚
5. **UNO 抓漏**：2 秒宽限期的 UNO 抓漏机制，支持手牌变化时间戳记录
6. **AI 决策引擎**：Easy、Medium、Hard 三种难度的 AI 策略，基于优先级计算和对手手牌分析
7. **全局定时器**：每秒执行的定时器，处理 AI 决策、超时代打、心跳检测、房间清理
8. **实时通信**：基于 Socket.io 的实时双向通信，支持游戏状态广播和事件通知

---

*文档版本: 1.0*
*最后更新: 2026-03-11*