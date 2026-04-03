# WebSocket心跳机制与自动重连完全指南

## 概述

WebSocket作为一种全双工通信协议，在现代实时应用开发中扮演着核心角色。从在线游戏、即时通讯到金融交易系统，WebSocket无处不在。然而，网络的不可靠性决定了我们必须为WebSocket连接实现健壮的心跳检测和自动重连机制。本文将深入剖析WebSocket的断开原因、心跳检测原理、自动重连策略设计，以及Socket.io等主流库的实现方案，帮助开发者构建生产级别的实时通信系统。

---

## 一、WebSocket错误类型详解

### 1.1 错误分类表格

理解WebSocket错误类型是实现健壮重连机制的基础。根据WebSocket规范的定义，错误可以分为以下几个主要类别：

| 错误类别 | 错误码 | 描述 | 触发场景 | 是否应重连 |
|---------|--------|------|---------|-----------|
| **正常关闭** | 1000 | 端点正常关闭连接 | 业务逻辑主动关闭 | 否 |
| **端点离开** | 1001 | 服务器或客户端即将关闭 | 服务端维护升级 | 是 |
| **协议错误** | 1002 | WebSocket协议错误 | 协议版本不兼容 | 否 |
| **数据类型错误** | 1003 | 不支持的数据类型 | 收到二进制数据但只处理文本 | 否 |
| **异常断开** | 1006 | 连接异常关闭 | 网络中断、服务器崩溃 | 是 |
| **数据格式错误** | 1007 | 收到的消息格式错误 | JSON解析失败 | 否 |
| **违反策略** | 1008 | 策略违规 | 消息过大、超出窗口 | 否 |
| **消息过大** | 1009 | 消息过大无法处理 | 单条消息超过限制 | 否 |
| **扩展缺失** | 1010 | 缺少必要的扩展 | 服务端不支持必需的扩展 | 否 |
| **服务器错误** | 1011 | 服务器遇到意外状况 | 服务端内部错误 | 是 |
| **服务重启** | 1012 | 服务器正在重启 | 服务端维护中 | 是 |
| **缓冲溢出** | 1013 | 服务器缓冲溢出 | 请求速率过高 | 是 |
| **TLS错误** | 1015 | TLS握手失败 | 证书问题 | 否 |

### 1.2 错误识别代码实现

在实际项目中，我们需要编写完善的错误处理代码来识别和处理各种错误类型。以下是一个生产级别的错误处理示例：

```javascript
/**
 * WebSocket错误处理器
 * 负责统一管理WebSocket连接过程中的各种错误
 */
class WebSocketErrorHandler {
  constructor() {
    // 定义不可恢复的错误码列表
    this.unrecoverableCodes = new Set([
      1000,  // 正常关闭
      1002,  // 协议错误
      1003,  // 数据类型错误
      1007,  // 数据格式错误
      1008,  // 策略违规
      1009,  // 消息过大
      1010,  // 扩展缺失
      1015   // TLS错误
    ]);

    // 定义可恢复的错误码列表
    this.recoverableCodes = new Set([
      1001,  // 端点离开
      1006,  // 异常断开
      1011,  // 服务器错误
      1012,  // 服务重启
      1013   // 缓冲溢出
    ]);
  }

  /**
   * 创建WebSocket连接并设置错误处理
   * @param {string} url - WebSocket服务器地址
   * @param {Function} onReconnect - 重连回调函数
   * @returns {WebSocket} WebSocket实例
   */
  createConnection(url, onReconnect) {
    const socket = new WebSocket(url);

    // 连接打开时的处理
    socket.addEventListener('open', (event) => {
      console.log('WebSocket连接已建立', {
       时间戳: new Date().toISOString(),
        URL: url,
        readyState: this.getReadyStateLabel(socket.readyState)
      });
    });

    // 错误处理 - onerror
    // 注意：onerror事件不提供详细的错误信息，仅表示发生了错误
    socket.addEventListener('error', (errorEvent) => {
      console.error('WebSocket发生错误:', {
        错误类型: 'ErrorEvent',
        错误详情: errorEvent,
        目标URL: url,
        时间戳: new Date().toISOString()
      });

      // 触发重连逻辑
      if (onReconnect) {
        onReconnect({ type: 'error', url });
      }
    });

    // 连接关闭处理 - onclose
    // 这是最重要的错误处理入口，包含了关闭码和关闭原因
    socket.addEventListener('close', (closeEvent) => {
      const { code, reason, wasClean } = closeEvent;

      console.log('WebSocket连接已关闭', {
        关闭码: code,
        关闭原因: reason || '无',
        是否正常关闭: wasClean,
        是否应重连: this.shouldReconnect(code),
        时间戳: new Date().toISOString()
      });

      // 记录错误日志用于监控
      this.logCloseEvent(code, reason, url);

      // 判断是否需要重连
      if (this.shouldReconnect(code) && onReconnect) {
        onReconnect({ type: 'close', code, reason, url });
      }
    });

    // 消息接收处理
    socket.addEventListener('message', (event) => {
      try {
        // 尝试解析JSON数据
        const data = JSON.parse(event.data);
        this.handleMessage(socket, data);
      } catch (parseError) {
        // 处理非JSON格式的消息
        if (event.data === 'pong') {
          // 处理心跳响应
          this.handlePong();
        } else {
          // 处理普通文本消息
          this.handleMessage(socket, event.data);
        }
      }
    });

    return socket;
  }

  /**
   * 判断是否应该重连
   * @param {number} code - 关闭码
   * @returns {boolean} 是否应该重连
   */
  shouldReconnect(code) {
    // 未知错误码默认重连
    if (!this.unrecoverableCodes.has(code) && !this.recoverableCodes.has(code)) {
      return true;
    }
    return this.recoverableCodes.has(code);
  }

  /**
   * 获取连接状态的文字描述
   * @param {number} readyState - WebSocket的readyState值
   * @returns {string} 状态描述
   */
  getReadyStateLabel(readyState) {
    const states = {
      0: 'CONNECTING - 连接中',
      1: 'OPEN - 已连接',
      2: 'CLOSING - 关闭中',
      3: 'CLOSED - 已关闭'
    };
    return states[readyState] || 'UNKNOWN';
  }

  /**
   * 处理接收到的消息
   * @param {WebSocket} socket - WebSocket实例
   * @param {any} data - 消息数据
   */
  handleMessage(socket, data) {
    console.log('收到消息:', data);
    // 子类可以重写此方法来处理具体业务逻辑
  }

  /**
   * 处理心跳Pong响应
   */
  handlePong() {
    // 子类可以重写此方法来处理心跳响应
  }

  /**
   * 记录关闭事件用于监控和分析
   * @param {number} code - 关闭码
   * @param {string} reason - 关闭原因
   * @param {string} url - 连接的URL
   */
  logCloseEvent(code, reason, url) {
    // 在生产环境中，这里应该发送到监控系统
    const logEntry = {
      关闭码: code,
      关闭原因: reason,
      URL: url,
      时间戳: new Date().toISOString(),
      用户代理: navigator.userAgent,
      网络状态: navigator.onLine ? '在线' : '离线'
    };

    // 发送到监控系统
    if (typeof reportEvent === 'function') {
      reportEvent('websocket_close', logEntry);
    }
  }
}
```

### 1.3 消息处理错误

消息处理是WebSocket应用中另一个重要的错误来源。服务端可能发送格式错误的数据，客户端需要具备健壮的消息解析能力：

```javascript
/**
 * WebSocket消息解析器
 * 提供安全的JSON解析和类型转换
 */
class MessageParser {
  constructor() {
    // 消息类型注册表
    this.typeHandlers = new Map();
  }

  /**
   * 注册消息类型处理器
   * @param {string} type - 消息类型
   * @param {Function} handler - 处理函数
   */
  registerHandler(type, handler) {
    this.typeHandlers.set(type, handler);
  }

  /**
   * 解析并处理消息
   * @param {string} rawData - 原始消息字符串
   * @returns {Object} 解析结果
   */
  parse(rawData) {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(rawData);

      // 验证消息结构
      if (!this.validateMessage(parsed)) {
        return {
          success: false,
          error: 'INVALID_MESSAGE_STRUCTURE',
          raw: rawData
        };
      }

      // 调用对应的处理器
      const handler = this.typeHandlers.get(parsed.type);
      if (handler) {
        return {
          success: true,
          data: handler(parsed.payload),
          type: parsed.type
        };
      } else {
        return {
          success: true,
          data: parsed.payload,
          type: parsed.type,
          warning: 'NO_HANDLER_REGISTERED'
        };
      }
    } catch (error) {
      // 区分JSON解析错误和其他错误
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: 'JSON_PARSE_ERROR',
          message: error.message,
          raw: rawData
        };
      } else {
        return {
          success: false,
          error: 'UNKNOWN_ERROR',
          message: error.message,
          raw: rawData
        };
      }
    }
  }

  /**
   * 验证消息结构
   * @param {Object} message - 解析后的消息对象
   * @returns {boolean} 是否有效
   */
  validateMessage(message) {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message
    );
  }
}
```

---

## 二、自动重连机制详解

### 2.1 重连策略设计原则

自动重连机制是WebSocket应用稳定性的关键保障。一个优秀的重连策略需要考虑多个维度：

**触发条件设计**：重连应该在合适的时机触发，既不能过于频繁导致资源浪费，也不能过于迟钝影响用户体验。常见的触发条件包括：网络错误、连接超时、服务器主动关闭（关闭码非1000）、心跳超时等。

**退避策略选择**：退避策略决定了重连间隔的增长方式，直接影响系统稳定性和用户体验：

| 退避策略 | 描述 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| **立即重连** | 断开后立即重连 | 恢复快 | 可能加剧服务器负担 | 瞬时网络波动 |
| **固定延迟** | 每次等待相同时间 | 实现简单 | 恢复慢，不够智能 | 简单场景 |
| **线性递增** | 每次增加固定时间 | 渐进式 | 恢复仍然较慢 | 过渡方案 |
| **指数退避** | 间隔时间指数增长 | 平衡性好 | 初始恢复较慢 | 生产环境首选 |
| **随机抖动** | 在基础值上加随机偏移 | 避免雷群效应 | 恢复时间不确定 | 大规模系统 |

**最大重试次数与时间窗口**：无限重连会导致资源浪费和用户体验问题。建议设置合理的上限，可以是重试次数限制（如5次）、时间窗口限制（如5分钟内）、或两者结合。

### 2.2 基础重连实现

以下是一个生产级别的WebSocket重连管理器实现：

```javascript
/**
 * WebSocket重连管理器
 * 实现了指数退避策略和多种重连策略
 */
class WebSocketReconnectManager {
  /**
   * 创建重连管理器
   * @param {string} url - WebSocket服务器地址
   * @param {Object} options - 配置选项
   */
  constructor(url, options = {}) {
    // 服务器地址
    this.url = url;

    // 重连配置参数
    this.config = {
      // 最大重连次数，Infinity表示不限制
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,

      // 初始重连延迟（毫秒）
      initialDelay: options.initialDelay ?? 1000,

      // 最大重连延迟（毫秒）
      maxDelay: options.maxDelay ?? 30000,

      // 指数基数
      exponentialBase: options.exponentialBase ?? 2,

      // 随机抖动因子（0-1之间）
      jitter: options.jitter ?? 0.3,

      // 是否在连接成功后重置重连计数
      resetAttemptsOnSuccess: options.resetAttemptsOnSuccess ?? true,

      // 重连尝试之间是否等待
      waitBetweenAttempts: options.waitBetweenAttempts ?? true,

      // 连接超时时间（毫秒）
      connectionTimeout: options.connectionTimeout ?? 10000
    };

    // 重连状态
    this.reconnectAttempts = 0;
    this.isManualClose = false;
    this.reconnectTimer = null;
    this.connectionTimer = null;
    this.socket = null;

    // 事件回调
    this.eventHandlers = new Map();

    // 初始化连接
    this.connect();
  }

  /**
   * 建立WebSocket连接
   */
  connect() {
    // 清除之前的连接超时计时器
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
    }

    console.log(`[WebSocket] 正在连接... (尝试 ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);

    try {
      this.socket = new WebSocket(this.url);

      // 设置连接超时
      this.connectionTimer = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.warn('[WebSocket] 连接超时，关闭连接');
          this.socket.close(1006, 'Connection timeout');
        }
      }, this.config.connectionTimeout);

      // 绑定事件处理器
      this.bindEventHandlers();

    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 绑定WebSocket事件处理器
   */
  bindEventHandlers() {
    const socket = this.socket;

    // 连接打开事件
    socket.onopen = (event) => {
      console.log('[WebSocket] 连接已建立', {
        URL: this.url,
        时间戳: new Date().toISOString()
      });

      // 清除连接超时计时器
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }

      // 成功后重置重连计数
      if (this.config.resetAttemptsOnSuccess) {
        this.reconnectAttempts = 0;
      }

      // 触发连接成功回调
      this.emit('open', event);
    };

    // 错误事件
    socket.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error);
      this.emit('error', error);
    };

    // 关闭事件
    socket.onclose = (event) => {
      console.log('[WebSocket] 连接已关闭', {
        关闭码: event.code,
        关闭原因: event.reason || '无',
        是否正常关闭: event.wasClean
      });

      // 清除连接超时计时器
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }

      // 触发关闭回调
      this.emit('close', event);

      // 如果不是手动关闭，则调度重连
      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    // 消息事件
    socket.onmessage = (event) => {
      this.emit('message', event);
    };
  }

  /**
   * 调度重连
   * 根据指数退避策略计算下一次重连的延迟时间
   */
  scheduleReconnect() {
    // 检查是否已达到最大重连次数
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] 已达到最大重连次数，停止重连');
      this.emit('reconnect_failed', {
        attempts: this.reconnectAttempts,
        url: this.url
      });
      return;
    }

    // 计算重连延迟时间
    const delay = this.calculateDelay();

    console.log(`[WebSocket] ${delay}ms后进行第${this.reconnectAttempts + 1}次重连`);

    // 触发重连开始事件
    this.emit('reconnect_attempt', {
      attempt: this.reconnectAttempts + 1,
      delay,
      maxAttempts: this.config.maxReconnectAttempts
    });

    // 增加重连计数
    this.reconnectAttempts++;

    // 清除之前的重连计时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // 设置新的重连计时器
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 计算重连延迟时间
   * 使用指数退避算法，并添加随机抖动以避免雷群效应
   * @returns {number} 延迟时间（毫秒）
   */
  calculateDelay() {
    // 基础延迟：初始延迟 * 指数基数 ^ 重连次数
    let delay = this.config.initialDelay *
      Math.pow(this.config.exponentialBase, this.reconnectAttempts);

    // 应用最大延迟限制
    delay = Math.min(delay, this.config.maxDelay);

    // 添加随机抖动以避免多客户端同时重连
    if (this.config.jitter > 0) {
      const jitterAmount = delay * this.config.jitter;
      const randomOffset = (Math.random() * 2 - 1) * jitterAmount;
      delay = Math.max(0, delay + randomOffset);
    }

    return Math.round(delay);
  }

  /**
   * 手动发送数据
   * @param {any} data - 要发送的数据
   * @returns {boolean} 是否发送成功
   */
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      return true;
    } else {
      console.warn('[WebSocket] 连接未打开，无法发送消息');
      return false;
    }
  }

  /**
   * 手动关闭连接
   * @param {number} code - 关闭码
   * @param {string} reason - 关闭原因
   */
  close(code = 1000, reason = 'Manual close') {
    console.log('[WebSocket] 手动关闭连接');

    // 标记为手动关闭，避免触发自动重连
    this.isManualClose = true;

    // 清除所有计时器
    this.clearTimers();

    // 关闭WebSocket连接
    if (this.socket) {
      this.socket.close(code, reason);
    }

    // 触发关闭事件
    this.emit('manual_close', { code, reason });
  }

  /**
   * 清除所有计时器
   */
  clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * 注册事件处理器
   * @param {string} event - 事件名称
   * @param {Function} handler - 处理函数
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] 事件处理器执行出错 (${event}):`, error);
      }
    });
  }

  /**
   * 获取当前连接状态
   * @returns {string} 连接状态描述
   */
  getState() {
    if (!this.socket) return 'DISCONNECTED';

    const states = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };

    return states[this.socket.readyState] || 'UNKNOWN';
  }
}
```

### 2.3 使用示例

以下是WebSocketReconnectManager的使用示例：

```javascript
// 创建WebSocket连接管理器
const wsManager = new WebSocketReconnectManager('wss://api.example.com/ws', {
  maxReconnectAttempts: 10,      // 最多重连10次
  initialDelay: 1000,            // 初始延迟1秒
  maxDelay: 30000,              // 最大延迟30秒
  exponentialBase: 2,            // 指数基数为2
  jitter: 0.3                    // 添加30%的随机抖动
});

// 注册事件处理器
wsManager.on('open', () => {
  console.log('连接成功，可以开始通信');
  updateConnectionStatus('connected');
});

wsManager.on('close', (event) => {
  console.log('连接关闭', event);
  updateConnectionStatus('disconnected');
});

wsManager.on('error', (error) => {
  console.error('连接错误', error);
  updateConnectionStatus('error');
});

wsManager.on('reconnect_attempt', ({ attempt, delay }) => {
  console.log(`准备第${attempt}次重连，延迟${delay}ms`);
  updateConnectionStatus('reconnecting');
});

wsManager.on('reconnect_failed', () => {
  console.error('重连失败，请检查网络');
  showReconnectFailedAlert();
});

wsManager.on('message', (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
});

// 发送消息
function sendMessage(type, payload) {
  wsManager.send({ type, payload, timestamp: Date.now() });
}

// 手动关闭连接（退出应用时）
function cleanup() {
  wsManager.close(1000, 'User logged out');
}
```

---

## 三、心跳检测机制

### 3.1 心跳检测原理

心跳机制是保持WebSocket连接健康的重要手段。其核心原理是通过定时发送探测消息来检测连接的存活状态，从而及时发现断线并触发重连。

**为什么需要心跳检测？** 网络环境复杂多变，WebSocket连接可能因多种原因中断：网络波动、路由器超时、NAT会话超时、服务器维护等。这些中断往往不会被立即检测到，因为TCP协议的存活机制默认关闭，而且即使开启，其超时时间通常很长（通常为2小时）。心跳机制通过应用层的主动探测，能够在更短的时间内发现连接问题。

**Ping/Pong帧机制**：WebSocket协议原生支持Ping和Pong控制帧。Ping帧由一端发送，另一端必须响应Pong帧。这个机制非常适合实现心跳检测。注意，浏览器不直接暴露Ping/Pong API，但可以使用WebSocket的`ping()`方法（在某些实现中可用）或通过发送普通消息来实现心跳。

### 3.2 客户端心跳实现

以下是完整的心跳检测WebSocket类实现：

```javascript
/**
 * 带心跳检测的WebSocket客户端
 * 实现了心跳发送、超时检测、自动重连功能
 */
class HeartbeatWebSocket extends WebSocketReconnectManager {
  /**
   * 创建带心跳的WebSocket客户端
   * @param {string} url - WebSocket服务器地址
   * @param {Object} options - 配置选项
   */
  constructor(url, options = {}) {
    super(url, options);

    // 心跳配置
    this.heartbeatConfig = {
      // 心跳发送间隔（毫秒）
      interval: options.heartbeatInterval ?? 30000,

      // 心跳响应超时时间（毫秒）
      timeout: options.heartbeatTimeout ?? 5000,

      // 是否启用心跳
      enabled: options.enableHeartbeat ?? true,

      // 心跳消息类型
      pingType: options.pingType ?? 'ping',
      pongType: options.pongType ?? 'pong'
    };

    // 心跳状态
    this.heartbeatState = {
      intervalTimer: null,      // 定时器
      timeoutTimer: null,       // 超时定时器
      lastPingTime: null,       // 上次发送心跳时间
      consecutiveFailures: 0,   // 连续失败次数
      maxConsecutiveFailures: options.maxConsecutiveFailures ?? 3
    };

    // 注册心跳消息处理器
    this.on('message', (event) => {
      this.handleIncomingMessage(event);
    });

    // 覆盖父类的连接成功处理
    this.on('open', (event) => {
      // 启动心跳
      if (this.heartbeatConfig.enabled) {
        this.startHeartbeat();
      }
    });

    this.on('close', () => {
      // 停止心跳
      this.stopHeartbeat();
    });
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    // 如果已经启动，先停止
    this.stopHeartbeat();

    console.log(`[Heartbeat] 启动心跳检测，间隔: ${this.heartbeatConfig.interval}ms`);

    const { interval } = this.heartbeatConfig;

    // 立即发送第一次心跳
    this.sendPing();

    // 设置定时心跳
    this.heartbeatState.intervalTimer = setInterval(() => {
      this.sendPing();
    }, interval);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatState.intervalTimer) {
      clearInterval(this.heartbeatState.intervalTimer);
      this.heartbeatState.intervalTimer = null;
    }

    if (this.heartbeatState.timeoutTimer) {
      clearTimeout(this.heartbeatState.timeoutTimer);
      this.heartbeatState.timeoutTimer = null;
    }

    console.log('[Heartbeat] 心跳检测已停止');
  }

  /**
   * 发送Ping消息
   */
  sendPing() {
    // 检查连接状态
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[Heartbeat] 连接未打开，跳过心跳');
      return;
    }

    const pingMessage = {
      type: this.heartbeatConfig.pingType,
      timestamp: Date.now(),
      clientId: this.generateClientId()
    };

    // 清除之前的超时定时器
    if (this.heartbeatState.timeoutTimer) {
      clearTimeout(this.heartbeatState.timeoutTimer);
    }

    try {
      // 发送心跳消息
      this.socket.send(JSON.stringify(pingMessage));

      // 记录发送时间
      this.heartbeatState.lastPingTime = Date.now();

      console.log('[Heartbeat] 发送心跳', pingMessage);

      // 设置响应超时定时器
      this.heartbeatState.timeoutTimer = setTimeout(() => {
        this.handleHeartbeatTimeout();
      }, this.heartbeatConfig.timeout);

    } catch (error) {
      console.error('[Heartbeat] 发送心跳失败:', error);
      this.handleHeartbeatFailure();
    }
  }

  /**
   * 处理心跳响应
   * @param {MessageEvent} event - 消息事件
   */
  handleIncomingMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // 检查是否是Pong响应
      if (data.type === this.heartbeatConfig.pongType) {
        this.handlePong(data);
      }
    } catch (error) {
      // 非JSON消息，忽略
    }
  }

  /**
   * 处理Pong响应
   * @param {Object} data - Pong消息数据
   */
  handlePong(data) {
    // 清除超时定时器
    if (this.heartbeatState.timeoutTimer) {
      clearTimeout(this.heartbeatState.timeoutTimer);
      this.heartbeatState.timeoutTimer = null;
    }

    // 计算往返时间
    const rtt = Date.now() - (data.timestamp || this.heartbeatState.lastPingTime);

    console.log(`[Heartbeat] 收到Pong响应，往返时间: ${rtt}ms`);

    // 重置连续失败计数
    this.heartbeatState.consecutiveFailures = 0;

    // 触发心跳成功事件
    this.emit('heartbeat_success', { rtt, timestamp: data.timestamp });
  }

  /**
   * 处理心跳超时
   */
  handleHeartbeatTimeout() {
    console.warn('[Heartbeat] 心跳响应超时');
    this.handleHeartbeatFailure();
  }

  /**
   * 处理心跳失败
   */
  handleHeartbeatFailure() {
    this.heartbeatState.consecutiveFailures++;

    console.warn(`[Heartbeat] 心跳失败 (${this.heartbeatState.consecutiveFailures}/${this.heartbeatState.maxConsecutiveFailures})`);

    // 触发心跳失败事件
    this.emit('heartbeat_failure', {
      consecutiveFailures: this.heartbeatState.consecutiveFailures
    });

    // 连续失败超过阈值，强制关闭连接触发重连
    if (this.heartbeatState.consecutiveFailures >= this.heartbeatState.maxConsecutiveFailures) {
      console.error('[Heartbeat] 连续心跳失败次数过多，强制关闭连接');

      // 停止心跳
      this.stopHeartbeat();

      // 强制关闭连接，触发重连
      if (this.socket) {
        this.socket.close(1006, 'Heartbeat timeout');
      }
    }
  }

  /**
   * 生成客户端ID
   * @returns {string} 客户端唯一标识
   */
  generateClientId() {
    if (!this.clientId) {
      this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.clientId;
  }

  /**
   * 获取心跳状态
   * @returns {Object} 心跳状态信息
   */
  getHeartbeatStatus() {
    return {
      enabled: this.heartbeatConfig.enabled,
      interval: this.heartbeatConfig.interval,
      timeout: this.heartbeatConfig.timeout,
      lastPingTime: this.heartbeatState.lastPingTime,
      consecutiveFailures: this.heartbeatState.consecutiveFailures,
      isRunning: this.heartbeatState.intervalTimer !== null
    };
  }
}
```

### 3.3 服务端心跳处理

服务端同样需要实现心跳检测来发现不活跃的连接。以下是Node.js环境下的服务端心跳实现：

```javascript
/**
 * WebSocket服务端心跳管理器
 * 使用Node.js原生的WebSocket Server实现
 */
class ServerHeartbeatManager {
  /**
   * 创建心跳管理器
   * @param {WebSocketServer} wss - WebSocket服务器实例
   * @param {Object} options - 配置选项
   */
  constructor(wss, options = {}) {
    this.wss = wss;
    this.config = {
      // 心跳间隔（毫秒）
      interval: options.interval ?? 30000,

      // Ping超时（毫秒）
      pingTimeout: options.pingTimeout ?? 10000,

      // 连接超时（毫秒）
      connectionTimeout: options.connectionTimeout ?? 60000
    };

    // 存储连接元数据
    this.clients = new Map();

    // 启动心跳检查定时器
    this.startHeartbeatCheck();
  }

  /**
   * 处理新连接
   * @param {WebSocket} ws - WebSocket连接
   * @param {Object} request - HTTP请求对象
   */
  handleConnection(ws, request) {
    // 生成客户端ID
    const clientId = this.generateClientId();

    // 存储客户端元数据
    this.clients.set(ws, {
      clientId,
      connectedAt: Date.now(),
      lastPingTime: null,
      lastPongTime: null,
      isAlive: true,
      metadata: { request }
    });

    console.log(`[Server] 新连接: ${clientId}`);

    // 绑定pong事件处理器
    ws.on('pong', () => {
      const client = this.clients.get(ws);
      if (client) {
        client.lastPongTime = Date.now();
        client.isAlive = true;
        console.log(`[Server] 收到Pong: ${clientId}`);
      }
    });

    // 绑定关闭事件
    ws.on('close', (code, reason) => {
      console.log(`[Server] 连接关闭: ${clientId}, 码: ${code}, 原因: ${reason}`);
      this.clients.delete(ws);
    });

    // 绑定错误事件
    ws.on('error', (error) => {
      console.error(`[Server] 连接错误: ${clientId}`, error);
    });
  }

  /**
   * 启动心跳检查定时器
   */
  startHeartbeatCheck() {
    // 定时发送Ping
    setInterval(() => {
      this.pingAllClients();
    }, this.config.interval);

    // 定时检查超时连接
    setInterval(() => {
      this.checkTimeoutConnections();
    }, this.config.interval / 2);

    console.log(`[Server] 心跳检查已启动 (间隔: ${this.config.interval}ms)`);
  }

  /**
   * 向所有活跃连接发送Ping
   */
  pingAllClients() {
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        const client = this.clients.get(ws);
        if (client) {
          client.lastPingTime = Date.now();
          client.isAlive = false; // 等待pong响应

          try {
            // 使用WebSocket Server原生的ping方法
            ws.ping();

            // 设置Ping超时检测
            setTimeout(() => {
              if (client && !client.isAlive) {
                console.warn(`[Server] Ping超时: ${client.clientId}`);
                // 终止不响应的连接
                ws.terminate();
              }
            }, this.config.pingTimeout);

          } catch (error) {
            console.error(`[Server] 发送Ping失败: ${client.clientId}`, error);
            ws.terminate();
          }
        }
      }
    });
  }

  /**
   * 检查超时连接
   */
  checkTimeoutConnections() {
    const now = Date.now();

    this.wss.clients.forEach((ws) => {
      const client = this.clients.get(ws);
      if (client) {
        const connectionDuration = now - client.connectedAt;

        // 检查连接是否超时
        if (connectionDuration > this.config.connectionTimeout) {
          console.log(`[Server] 连接超时，关闭: ${client.clientId}`);
          ws.close(1001, 'Connection timeout');
        }
      }
    });
  }

  /**
   * 生成客户端ID
   * @returns {string} 唯一ID
   */
  generateClientId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取连接统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    let aliveCount = 0;
    let deadCount = 0;

    this.clients.forEach((client) => {
      if (client.isAlive) {
        aliveCount++;
      } else {
        deadCount++;
      }
    });

    return {
      totalConnections: this.wss.clients.size,
      aliveConnections: aliveCount,
      deadConnections: deadCount,
      uptime: process.uptime()
    };
  }
}
```

---

## 四、高级重连策略

### 4.1 网络状态检测

现代浏览器提供了`navigator.onLine`属性和`online/offline`事件，可以帮助我们更智能地处理网络状态变化：

```javascript
/**
 * 高级WebSocket客户端
 * 集成了网络状态检测、智能重连、消息缓存等功能
 */
class AdvancedWebSocketClient extends HeartbeatWebSocket {
  constructor(url, options = {}) {
    super(url, options);

    // 网络状态检测配置
    this.networkConfig = {
      // 是否监听网络状态变化
      monitorNetwork: options.monitorNetwork ?? true,

      // 网络恢复后延迟重连时间
      reconnectDelay: options.reconnectDelay ?? 1000,

      // 最大重连延迟
      maxReconnectDelay: options.maxReconnectDelay ?? 10000
    };

    // 当前网络状态
    this.networkState = {
      isOnline: navigator.onLine,
      wasOffline: false
    };

    // 初始化网络状态监听
    if (this.networkConfig.monitorNetwork) {
      this.initNetworkListeners();
    }

    // 连接状态
    this.connectionState = {
      isReconnecting: false,
      lastConnectedAt: null,
      totalReconnections: 0
    };
  }

  /**
   * 初始化网络状态监听
   */
  initNetworkListeners() {
    // 网络恢复事件
    window.addEventListener('online', () => {
      console.log('[Network] 网络已恢复');

      const wasOffline = this.networkState.wasOffline;
      this.networkState.isOnline = true;

      // 触发网络恢复事件
      this.emit('network_online');

      // 如果之前是离线状态，触发重连
      if (wasOffline) {
        console.log('[Network] 尝试恢复WebSocket连接');
        this.networkReconnect();
      }
    });

    // 网络断开事件
    window.addEventListener('offline', () => {
      console.warn('[Network] 网络已断开');

      this.networkState.isOnline = false;
      this.networkState.wasOffline = true;

      // 触发网络断开事件
      this.emit('network_offline');

      // 停止心跳
      this.stopHeartbeat();

      // 清除重连计时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    console.log('[Network] 网络状态监听已启动');
  }

  /**
   * 网络恢复后的智能重连
   */
  networkReconnect() {
    // 如果当前连接正常，不需要重连
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[Network] 连接仍然正常，无需重连');
      return;
    }

    // 使用智能延迟重连
    const delay = Math.min(
      this.networkConfig.reconnectDelay * (this.connectionState.totalReconnections + 1),
      this.networkConfig.maxReconnectDelay
    );

    console.log(`[Network] ${delay}ms后尝试重连`);

    setTimeout(() => {
      this.connectionState.isReconnecting = true;
      this.connectionState.totalReconnections++;
      this.connect();
    }, delay);
  }

  /**
   * 覆盖父类的连接成功处理
   */
  connect() {
    this.connectionState.lastConnectedAt = Date.now();
    this.connectionState.isReconnecting = false;
    super.connect();
  }
}
```

### 4.2 消息缓存与重发

在断线期间，用户可能尝试发送消息，这些消息需要被缓存并在重连后发送：

```javascript
/**
 * 可靠消息传输的WebSocket客户端
 * 支持消息缓存、重发、去重
 */
class ReliableWebSocketClient extends AdvancedWebSocketClient {
  constructor(url, options = {}) {
    super(url, options);

    // 消息可靠性配置
    this.reliabilityConfig = {
      // 是否缓存离线消息
      cacheOfflineMessages: options.cacheOfflineMessages ?? true,

      // 最大缓存消息数
      maxCachedMessages: options.maxCachedMessages ?? 100,

      // 消息过期时间（毫秒）
      messageExpiration: options.messageExpiration ?? 60000,

      // 是否启用消息确认
      enableAcknowledgment: options.enableAcknowledgment ?? true
    };

    // 消息队列
    this.messageQueue = {
      pending: new Map(),     // 待确认的消息
      cached: [],             // 离线缓存的消息
      failed: []              // 发送失败的消息
    };

    // 消息ID生成器
    this.messageIdCounter = 0;

    // 消息重试定时器
    this.retryTimer = null;
    this.retryInterval = options.retryInterval ?? 5000;

    // 初始化消息处理器
    this.initMessageHandlers();
  }

  /**
   * 初始化消息处理器
   */
  initMessageHandlers() {
    // 处理收到的消息
    this.on('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        // 处理消息确认
        if (data.type === 'ack' && this.reliabilityConfig.enableAcknowledgment) {
          this.handleMessageAck(data);
        }
      } catch (error) {
        // 非JSON消息
      }
    });

    // 处理连接成功
    this.on('open', () => {
      // 重发待确认的消息
      this.retryPendingMessages();

      // 发送缓存的消息
      this.flushCachedMessages();
    });

    // 启动消息重试定时器
    this.startMessageRetry();
  }

  /**
   * 发送消息（支持可靠传输）
   * @param {string} type - 消息类型
   * @param {any} payload - 消息内容
   * @param {Object} options - 发送选项
   * @returns {string} 消息ID
   */
  send(type, payload, options = {}) {
    // 生成消息ID
    const messageId = this.generateMessageId();

    // 构建消息
    const message = {
      id: messageId,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      requireAck: options.requireAck ?? this.reliabilityConfig.enableAcknowledgment,
      expiresAt: Date.now() + this.reliabilityConfig.messageExpiration
    };

    // 检查连接状态
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 立即发送
      this.socket.send(JSON.stringify(message));

      // 如果需要确认，加入待确认队列
      if (message.requireAck) {
        this.messageQueue.pending.set(messageId, {
          ...message,
          sentAt: Date.now()
        });
      }

      console.log(`[Message] 发送消息: ${type} (ID: ${messageId})`);
    } else {
      // 连接断开，缓存消息
      if (this.reliabilityConfig.cacheOfflineMessages) {
        this.cacheMessage(message);
      } else {
        console.warn('[Message] 连接未打开且未启用缓存，消息被丢弃');
      }
    }

    return messageId;
  }

  /**
   * 缓存离线消息
   * @param {Object} message - 消息对象
   */
  cacheMessage(message) {
    // 检查是否已存在
    const exists = this.messageQueue.cached.some(m => m.id === message.id);
    if (exists) {
      return;
    }

    // 添加到缓存
    this.messageQueue.cached.push(message);

    // 限制缓存大小
    while (this.messageQueue.cached.length > this.reliabilityConfig.maxCachedMessages) {
      this.messageQueue.cached.shift();
    }

    console.log(`[Message] 消息已缓存: ${message.type} (ID: ${message.id})`);
  }

  /**
   * 发送缓存的消息
   */
  flushCachedMessages() {
    if (this.messageQueue.cached.length === 0) {
      return;
    }

    console.log(`[Message] 发送${this.messageQueue.cached.length}条缓存消息`);

    // 按时间顺序发送
    const messages = this.messageQueue.cached.splice(0);

    messages.forEach(message => {
      // 检查消息是否过期
      if (Date.now() > message.expiresAt) {
        console.log(`[Message] 消息已过期: ${message.id}`);
        this.messageQueue.failed.push({
          ...message,
          failedReason: 'EXPIRED'
        });
        return;
      }

      // 重新发送
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));

        if (message.requireAck) {
          this.messageQueue.pending.set(message.id, {
            ...message,
            sentAt: Date.now()
          });
        }
      }
    });
  }

  /**
   * 重试未确认的消息
   */
  retryPendingMessages() {
    if (this.messageQueue.pending.size === 0) {
      return;
    }

    const now = Date.now();
    const maxRetries = 3;

    this.messageQueue.pending.forEach((message, messageId) => {
      // 检查重试次数
      if (message.retryCount >= maxRetries) {
        console.warn(`[Message] 消息重试次数超限: ${messageId}`);
        this.messageQueue.pending.delete(messageId);
        this.messageQueue.failed.push({
          ...message,
          failedReason: 'MAX_RETRIES'
        });
        return;
      }

      // 检查是否超时（30秒未确认）
      if (now - message.sentAt > 30000) {
        console.log(`[Message] 重试消息: ${message.type} (ID: ${messageId})`);

        message.retryCount++;
        this.socket.send(JSON.stringify(message));
        message.sentAt = now;
      }
    });
  }

  /**
   * 处理消息确认
   * @param {Object} data - 确认数据
   */
  handleMessageAck(data) {
    const { messageId, status } = data;

    if (status === 'success') {
      // 消息发送成功
      this.messageQueue.pending.delete(messageId);
      console.log(`[Message] 消息确认成功: ${messageId}`);
    } else {
      // 消息发送失败
      const message = this.messageQueue.pending.get(messageId);
      this.messageQueue.pending.delete(messageId);

      if (message) {
        this.messageQueue.failed.push({
          ...message,
          failedReason: status,
          failedAt: Date.now()
        });
      }

      console.warn(`[Message] 消息发送失败: ${messageId}, 原因: ${status}`);
    }
  }

  /**
   * 启动消息重试定时器
   */
  startMessageRetry() {
    this.retryTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.retryPendingMessages();
      }
    }, this.retryInterval);
  }

  /**
   * 生成唯一消息ID
   * @returns {string} 消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${++this.messageIdCounter}`;
  }

  /**
   * 获取消息队列状态
   * @returns {Object} 队列状态
   */
  getQueueStatus() {
    return {
      pending: this.messageQueue.pending.size,
      cached: this.messageQueue.cached.length,
      failed: this.messageQueue.failed.length
    };
  }

  /**
   * 清理过期消息
   */
  cleanupExpiredMessages() {
    const now = Date.now();

    // 清理缓存中的过期消息
    this.messageQueue.cached = this.messageQueue.cached.filter(
      message => now <= message.expiresAt
    );

    // 清理失败消息（保留最近100条）
    if (this.messageQueue.failed.length > 100) {
      this.messageQueue.failed = this.messageQueue.failed.slice(-100);
    }
  }
}
```

### 4.3 断线智能判断

根据关闭码智能判断是否应该重连：

```javascript
/**
 * WebSocket关闭码判断工具
 */
class CloseCodeAnalyzer {
  /**
   * 分析关闭码，判断是否应重连
   * @param {number} code - WebSocket关闭码
   * @param {string} reason - 关闭原因
   * @returns {Object} 分析结果
   */
  static analyze(code, reason = '') {
    const analysis = {
      code,
      reason,
      shouldReconnect: false,
      reconnectStrategy: 'none',
      priority: 0,
      details: ''
    };

    switch (code) {
      case 1000:
        // 正常关闭
        analysis.shouldReconnect = false;
        analysis.details = '连接正常关闭';
        analysis.reconnectStrategy = 'none';
        break;

      case 1001:
        // 端点离开
        analysis.shouldReconnect = true;
        analysis.details = '服务器即将关闭，可能正在进行维护或升级';
        analysis.reconnectStrategy = 'delayed';
        analysis.priority = 2;
        break;

      case 1006:
        // 异常断开
        analysis.shouldReconnect = true;
        analysis.details = '连接异常断开，可能是网络问题或服务器崩溃';
        analysis.reconnectStrategy = 'exponential_backoff';
        analysis.priority = 1;
        break;

      case 1001:
        // 协议错误
        analysis.shouldReconnect = false;
        analysis.details = '协议错误，请检查客户端和服务端协议版本';
        analysis.reconnectStrategy = 'none';
        break;

      case 1011:
        // 服务器错误
        analysis.shouldReconnect = true;
        analysis.details = '服务器遇到内部错误';
        analysis.reconnectStrategy = 'exponential_backoff';
        analysis.priority = 2;
        break;

      case 1012:
        // 服务重启
        analysis.shouldReconnect = true;
        analysis.details = '服务器正在重启';
        analysis.reconnectStrategy = 'polling';
        analysis.priority = 3;
        break;

      default:
        // 未知错误码，根据原因判断
        if (reason.includes('timeout')) {
          analysis.shouldReconnect = true;
          analysis.details = '连接超时';
          analysis.reconnectStrategy = 'exponential_backoff';
          analysis.priority = 1;
        } else if (reason.includes('maintenance')) {
          analysis.shouldReconnect = true;
          analysis.details = '服务器维护中';
          analysis.reconnectStrategy = 'polling';
          analysis.priority = 3;
        } else {
          // 默认尝试重连
          analysis.shouldReconnect = true;
          analysis.details = '未知错误，尝试重连';
          analysis.reconnectStrategy = 'exponential_backoff';
          analysis.priority = 1;
        }
    }

    return analysis;
  }

  /**
   * 判断是否是用户主动关闭
   * @param {CloseEvent} event - 关闭事件
   * @returns {boolean} 是否主动关闭
   */
  static isManualClose(event) {
    // 1000 正常关闭且wasClean为true通常表示主动关闭
    return event.code === 1000 && event.wasClean;
  }
}
```

---

## 五、Socket.io重连机制

### 5.1 Socket.io内置重连配置

Socket.io是WebSocket应用中最流行的库之一，它内置了强大的重连机制。以下是完整的Socket.io重连配置：

```javascript
/**
 * Socket.io客户端配置
 * 使用Socket.io官方推荐的重连配置
 */
class SocketIOClient {
  constructor(url, options = {}) {
    // Socket.io重连配置
    this.socketConfig = {
      // 是否自动重连
      reconnection: true,

      // 重连延迟（毫秒）
      reconnectionDelay: 1000,

      // 最大重连延迟（毫秒）
      reconnectionDelayMax: 5000,

      // 重连尝试次数
      reconnectionAttempts: Infinity,

      // 随机延迟因子
      randomizationFactor: 0.5,

      // 连接超时（毫秒）
      timeout: 20000,

      // 自动连接
      autoConnect: true,

      // 传输方式
      transports: ['websocket', 'polling'],

      // 升级传输
      upgrade: true
    };

    // 创建Socket.io连接
    this.socket = io(url, { ...this.socketConfig, ...options });

    // 初始化事件监听
    this.initEventListeners();
  }

  /**
   * 初始化Socket.io事件监听
   */
  initEventListeners() {
    const socket = this.socket;

    // 连接成功
    socket.on('connect', () => {
      console.log('[Socket.io] 连接成功', {
        socketId: socket.id,
        transport: socket.io.engine.transport.name
      });
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('[Socket.io] 连接错误:', error.message);
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] 断开连接:', reason);

      // 详细记录断开原因
      const disconnectReasons = {
        'io server disconnect': '服务器主动断开，需要手动重连',
        'io client disconnect': '客户端主动断开',
        'ping timeout': '心跳超时',
        'transport close': '传输层关闭',
        'transport error': '传输层错误'
      };

      console.log('[Socket.io] 断开原因:', disconnectReasons[reason] || reason);
    });

    // 重连尝试
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket.io] 第${attemptNumber}次重连尝试`);
    });

    // 重连中
    socket.on('reconnecting', (attemptNumber) => {
      console.log(`[Socket.io] 正在重连 (尝试 ${attemptNumber})`);
    });

    // 重连错误
    socket.on('reconnect_error', (error) => {
      console.error('[Socket.io] 重连错误:', error.message);
    });

    // 重连失败
    socket.on('reconnect_failed', () => {
      console.error('[Socket.io] 重连失败');
      // 可以在这里显示用户提示或切换到降级方案
    });

    // 重连成功
    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket.io] 重连成功 (尝试 ${attemptNumber} 次)`);
    });
  }

  /**
   * 发送消息
   * @param {string} event - 事件名
   * @param {any} data - 数据
   * @param {Function} callback - 回调函数
   */
  emit(event, data, callback) {
    this.socket.emit(event, data, callback);
  }

  /**
   * 监听消息
   * @param {string} event - 事件名
   * @param {Function} handler - 处理函数
   */
  on(event, handler) {
    this.socket.on(event, handler);
  }

  /**
   * 手动断开连接
   */
  disconnect() {
    this.socket.disconnect();
  }

  /**
   * 手动连接
   */
  connect() {
    this.socket.connect();
  }

  /**
   * 获取连接状态
   * @returns {string} 连接状态
   */
  getConnectionState() {
    const states = {
      0: 'DISCONNECTED',
      1: 'CONNECTING',
      2: 'CONNECTED',
      3: 'RECONNECTING'
    };
    return states[this.socket.io.readyState] || 'UNKNOWN';
  }
}
```

### 5.2 手动重连控制

在某些场景下，我们需要手动控制重连逻辑：

```javascript
/**
 * Socket.io手动重连管理器
 * 提供精细化的重连控制
 */
class SocketIOReconnectManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;

    this.init();
  }

  init() {
    // 创建Socket.io连接，禁用自动重连
    this.socket = io(this.url, {
      reconnection: false,  // 禁用自动重连
      ...this.options
    });

    this.bindEvents();
  }

  bindEvents() {
    this.socket.on('connect', () => {
      console.log('[Socket.io] 连接成功');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket.io] 断开:', reason);

      // 根据断开原因决定是否重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.io] 连接错误:', error);
      this.scheduleReconnect();
    });
  }

  /**
   * 调度重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Socket.io] 达到最大重连次数');
      return;
    }

    this.reconnectAttempts++;

    // 计算延迟（指数退避）
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[Socket.io] ${delay}ms后进行第${this.reconnectAttempts}次重连`);

    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  /**
   * 执行重连
   */
  reconnect() {
    console.log('[Socket.io] 执行重连...');

    // 断开当前连接
    this.socket.disconnect();

    // 重新连接
    this.socket.connect();
  }

  /**
   * 手动触发重连
   */
  manualReconnect() {
    console.log('[Socket.io] 手动触发重连');
    this.reconnectAttempts = 0;
    this.reconnect();
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.socket.disconnect();
  }
}
```

### 5.3 Socket.io心跳配置

Socket.io内置了心跳机制，可以方便地配置：

```javascript
/**
 * Socket.io心跳配置
 */
const socket = io('http://localhost:3000', {
  // 心跳间隔（毫秒）
  pingInterval: 25000,

  // 心跳超时（毫秒）
  pingTimeout: 20000,

  // 重连配置
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// 自定义心跳监测
socket.on('ping', () => {
  console.log('[Socket.io] 发送Ping');
});

socket.on('pong', (latency) => {
  console.log(`[Socket.io] 收到Pong，延迟: ${latency}ms`);
});
```

---

## 六、面试高频问题详解

### 问题一：WebSocket断开后如何实现自动重连？

**考察点**：WebSocket重连机制的理解和实现能力

**参考答案**：

自动重连的核心是监听`onclose`事件，并根据关闭码判断是否需要重连。实现要点包括：

1. **错误分类**：区分正常关闭（1000）和异常断开（1006）
2. **退避策略**：采用指数退避避免重连风暴
3. **最大次数限制**：防止无限重连消耗资源
4. **状态管理**：追踪重连状态和次数

```javascript
// 核心重连逻辑
socket.onclose = (event) => {
  // 非正常关闭码需要重连
  if (event.code !== 1000) {
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    setTimeout(() => connect(), delay);
    attempts++;
  }
};
```

### 问题二：为什么要做心跳检测？原理是什么？

**考察点**：心跳机制的理解深度

**参考答案**：

心跳检测解决的是"沉默的连接假活"问题。TCP keepalive默认关闭且超时时间长（约2小时），无法满足实时应用需求。

**心跳原理**：
1. 客户端定时发送`ping`消息
2. 服务端收到后响应`pong`
3. 客户端在超时时间内未收到`pong`，则认为连接已断开
4. 触发重连逻辑

```javascript
// 客户端心跳
setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'ping' }));
    // 设置超时
    setTimeout(() => {
      console.log('心跳超时');
      socket.close();
    }, 5000);
  }
}, 30000);
```

### 问题三：如何判断网络断开还是服务器关闭？

**考察点**：错误类型识别和区分处理能力

**参考答案**：

可以通过以下方式区分：

1. **关闭码判断**：
   - 1006（异常断开）通常是网络问题
   - 1011（服务器错误）表示服务器端问题
   - 1001（端点离开）表示服务器主动关闭

2. **navigator.onLine**：检测客户端网络状态

3. **心跳响应**：心跳超时说明网络或服务器有问题

4. **代码分析**：

```javascript
socket.onclose = (event) => {
  if (!navigator.onLine) {
    console.log('客户端网络断开');
  } else if (event.code === 1006) {
    console.log('服务器无响应或网络中断');
  } else if (event.code === 1011) {
    console.log('服务器内部错误');
  }
};
```

### 问题四：指数退避算法如何实现？

**考察点**：算法实现和问题解决能力

**参考答案**：

指数退避算法通过增加等待时间来减轻服务器压力：

```javascript
// 指数退避实现
function getBackoffDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
  // 计算基础延迟
  let delay = baseDelay * Math.pow(2, attempt);

  // 添加随机抖动避免雷群效应
  const jitter = delay * 0.3 * Math.random();

  // 应用最大延迟限制
  delay = Math.min(delay + jitter, maxDelay);

  return Math.round(delay);
}

// 使用示例
for (let i = 0; i < 10; i++) {
  console.log(`尝试${i + 1}: 延迟${getBackoffDelay(i)}ms`);
}
```

### 问题五：断线期间的消息如何处理？

**考察点**：消息可靠性和用户体验设计

**参考答案**：

断线期间的消息处理策略：

1. **消息缓存**：将待发送消息存入队列
2. **自动重发**：重连后按顺序发送缓存消息
3. **消息确认**：使用消息ID和确认机制确保消息到达
4. **过期处理**：设置消息过期时间，超时丢弃

```javascript
// 消息队列管理
class MessageQueue {
  constructor() {
    this.queue = [];
  }

  // 离线时缓存消息
  add(message) {
    this.queue.push({
      ...message,
      timestamp: Date.now()
    });
  }

  // 重连后发送缓存消息
  flush(socket) {
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      socket.send(JSON.stringify(msg));
    }
  }
}
```

### 问题六：重连风暴如何避免？

**考察点**：系统稳定性设计和大规模场景考虑

**参考答案**：

重连风暴指大量客户端同时重连导致服务器过载。解决方案：

1. **随机抖动**：在退避时间上添加随机偏移
2. **集中式退避**：服务端指导客户端的退避时间
3. **分桶重连**：将客户端分散到不同时间窗口重连
4. **限流熔断**：当服务器压力大时暂停接收新连接

```javascript
// 随机抖动实现
function getJitteredDelay(baseDelay, jitterFactor = 0.3) {
  const jitter = baseDelay * jitterFactor * (Math.random() * 2 - 1);
  return Math.round(baseDelay + jitter);
}

// 服务端可下发退避策略
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'reconnect_policy') {
    // 应用服务端指定的退避策略
    serverRecommendedDelay = data.delay;
  }
};
```

---

## 七、生产环境最佳实践

### 7.1 完整的生产级WebSocket客户端

```javascript
/**
 * 生产级WebSocket客户端
 * 集成了所有最佳实践
 */
class ProductionWebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.config = {
      // 重连配置
      maxReconnectAttempts: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      jitter: 0.3,

      // 心跳配置
      heartbeatEnabled: true,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,

      // 网络检测
      monitorNetwork: true,

      // 消息可靠性
      enableMessageQueue: true,
      messageExpiration: 60000,

      // 日志级别
      logLevel: 'warn',

      // 监控上报
      enableMetrics: true,

      ...options
    };

    this.state = {
      isConnected: false,
      isManualClose: false,
      reconnectAttempts: 0,
      totalReconnections: 0,
      lastConnectedAt: null,
      lastError: null
    };

    this.socket = null;
    this.heartbeatManager = null;
    this.messageQueue = null;

    this.init();
  }

  init() {
    // 初始化各组件
    this.initWebSocket();
    this.initNetworkMonitor();
    this.initMetrics();

    // 连接
    this.connect();
  }

  initWebSocket() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => this.handleOpen();
    this.socket.onerror = (e) => this.handleError(e);
    this.socket.onclose = (e) => this.handleClose(e);
    this.socket.onmessage = (e) => this.handleMessage(e);
  }

  handleOpen() {
    this.state.isConnected = true;
    this.state.reconnectAttempts = 0;
    this.state.lastConnectedAt = Date.now();

    this.reportMetric('connection', 'success');

    // 启动心跳
    if (this.config.heartbeatEnabled) {
      this.startHeartbeat();
    }

    // 发送缓存消息
    if (this.messageQueue) {
      this.messageQueue.flush(this.socket);
    }
  }

  handleError(error) {
    this.state.lastError = error;
    this.reportMetric('error', 'occurred');
  }

  handleClose(event) {
    this.state.isConnected = false;
    this.stopHeartbeat();

    this.reportMetric('close', event.code);

    if (!this.state.isManualClose && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.reportMetric('reconnect', 'failed');
      return;
    }

    const delay = this.calculateDelay();
    this.state.reconnectAttempts++;
    this.state.totalReconnections++;

    setTimeout(() => this.connect(), delay);
  }

  calculateDelay() {
    let delay = this.config.initialDelay *
      Math.pow(this.config.exponentialBase, this.state.reconnectAttempts);
    delay = Math.min(delay, this.config.maxDelay);
    delay += delay * this.config.jitter * (Math.random() - 0.5);
    return Math.round(delay);
  }

  startHeartbeat() { /* ... */ }
  stopHeartbeat() { /* ... */ }
  initNetworkMonitor() { /* ... */ }
  initMetrics() { /* ... */ }
  reportMetric(type, value) { /* ... */ }
  handleMessage(event) { /* ... */ }
  send(type, data) { /* ... */ }
  close() { /* ... */ }
  getStatus() { /* ... */ }
}
```

### 7.2 监控与告警建议

生产环境中的WebSocket需要完善的监控：

```javascript
/**
 * WebSocket监控系统
 */
class WebSocketMonitor {
  constructor() {
    this.metrics = {
      connectionAttempts: 0,
      connectionSuccesses: 0,
      connectionFailures: 0,
      reconnections: 0,
      reconnectFailures: 0,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      lastConnectedAt: null
    };
  }

  recordConnection(attempt, success) {
    this.metrics.connectionAttempts++;
    if (success) {
      this.metrics.connectionSuccesses++;
      this.metrics.lastConnectedAt = Date.now();
    } else {
      this.metrics.connectionFailures++;
    }
  }

  recordReconnection(success) {
    this.metrics.reconnections++;
    if (!success) {
      this.metrics.reconnectFailures++;
    }
  }

  recordLatency(latency) {
    // 计算移动平均
    const alpha = 0.3;
    this.metrics.averageLatency =
      alpha * latency + (1 - alpha) * this.metrics.averageLatency;
  }

  getHealthScore() {
    const { connectionAttempts, connectionSuccesses, reconnections } = this.metrics;

    if (connectionAttempts === 0) return 100;

    const successRate = connectionSuccesses / connectionAttempts;
    const reconnectRate = reconnections / connectionAttempts;

    return Math.round((successRate * 0.7 + (1 - reconnectRate) * 0.3) * 100);
  }

  getReport() {
    return {
      ...this.metrics,
      healthScore: this.getHealthScore(),
      uptime: this.metrics.lastConnectedAt
        ? (Date.now() - this.metrics.lastConnectedAt) / 1000
        : 0
    };
  }
}
```

---

## 总结

WebSocket心跳机制与自动重连是构建高可用实时应用的关键技术。本文详细介绍了：

1. **错误类型识别**：通过关闭码准确判断断开原因
2. **指数退避策略**：智能控制重连频率，避免服务器压力
3. **心跳检测机制**：及时发现"假死"连接
4. **网络状态感知**：结合浏览器网络API实现智能重连
5. **消息可靠性保证**：缓存与重发确保消息不丢失
6. **Socket.io方案**：使用成熟库简化开发

在实际项目中，建议根据业务需求选择合适的方案，对于关键应用场景，可以结合多种策略构建多层保障机制。同时，完善的监控和告警系统也是生产环境不可或缺的部分。
