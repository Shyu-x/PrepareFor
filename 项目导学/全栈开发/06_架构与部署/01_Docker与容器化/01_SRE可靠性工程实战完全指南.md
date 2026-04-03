# SRE可靠性工程实战完全指南

## 前言：什么是SRE？

想象一下，你经营一家外卖店。刚开始只有你一个人接单、做菜、送餐，忙得过来。但随着订单越来越多，你发现一个问题：接单太多导致菜品质量下降，送餐延迟引发用户差评，厨房设备因为超负荷运转开始罢工。

这时候你有两个选择：
1. 雇更多人手，拼命加班
2. 找一个人专门负责"如何让整个外卖店稳定运转"，包括规划厨房产能、监控各环节效率、制定应急方案

SRE（Site Reliability Engineering，网站可靠性工程）就是第二种思路的产物。它不是让你拼命写代码、修bug，而是用工程的思维来确保系统"稳如老狗"。

Google在2003年提出了SRE概念，如今已经成为互联网公司保障服务稳定性的标配方法论。无论你是创业公司的小团队，还是万人规模的大厂，SRE都能帮你用系统化的方式管理系统可靠性。

本章将从最基础的概念讲起，带你理解SLO/SLI/SLA这个铁三角，掌握错误预算的计算方法，学会设计有效的SLI指标，以及如何做好故障复盘避免同样的坑踩两次。

---

## 第一部分：SLO/SLI/SLA铁三角详解

### 1.1 为什么需要这三个"LA"？

让我们用外卖店的例子来理解这三个概念。

**SLI（Service Level Indicator，服务水平指标）**——这是你自己记录的实际数据。比如：
- 今天平均送餐时间：32分钟
- 订单完成率：97.3%
- 用户评分：4.7分

这些数字是你系统运行的实际"成绩单"，是客观存在的事实。

**SLO（Service Level Objective，服务水平目标）**——这是你给自己定的"小目标"。比如：
- 平均送餐时间目标：30分钟内
- 订单完成率目标：99%以上
- 用户评分目标：4.5分以上

SLO就是你要努力达成的目标，是团队对内的承诺。

**SLA（Service Level Agreement，服务水平协议）**——这是你对外公布的"军令状"。比如：
- 对用户承诺：45分钟内送达，否则退款
- 对企业客户承诺：每月99.9%可用时间

SLA是给客户的承诺，通常会写成正式的合同条款，达不到是要赔钱的。

### 1.2 三个"LA"的关系与区别

用一个更形象的比喻：

```
SLI = 你的实际体重
SLO = 你的目标体重（比如要减到70公斤）
SLA = 你跟老婆保证的体重（达不到今晚睡沙发）
```

三者之间的关系可以这样理解：

```typescript
/**
 * SLI、SLO、SLA 的数值关系示例
 *
 * 假设我们是一个视频流媒体服务
 */

// SLI：实际测量值
const currentAvailability = 99.95;  // 当前可用性实测值
const currentLatency = 120;        // 当前延迟（毫秒）
const currentErrorRate = 0.05;      // 当前错误率（百分比）

// SLO：内部目标（比SLA更严格）
const sloAvailabilityTarget = 99.9;     // 目标：99.9%
const sloLatencyTarget = 200;           // 目标：P99延迟不超过200ms
const sloErrorRateTarget = 0.1;         // 目标：错误率不超过0.1%

// SLA：对外承诺（可以比SLO宽松一点）
const slaAvailabilityCommitment = 99.5; // 承诺：99.5%
const slaLatencyCommitment = 500;        // 承诺：P99延迟不超过500ms
const slaErrorRateCommitment = 0.5;      // 承诺：错误率不超过0.5%

/**
 * 重要原则：
 * SLO 内部目标应该比 SLA 对外承诺更严格
 * 这样才能留出buffer，不至于一不小心就违约
 */
```

### 1.3 SLO设置的艺术

设置SLO不是拍脑袋定数字，而是需要综合考虑多个因素。

#### 1.3.1 从业务影响角度出发

先问自己一个问题：如果服务不可用，每分钟损失多少钱？

```typescript
/**
 * 电商网站的SLO计算示例
 *
 * 业务背景：
 * - 每天GMV（成交总额）：1000万
 * - 平均每分钟GMV：约7000元
 * - 如果网站宕机1分钟，损失约7000元
 */

// 业务影响分析
const businessMetrics = {
  dailyGMV: 10_000_000,        // 每天GMV（元）
  minutesPerDay: 1440,         // 每天分钟数
  avgGMVPerMinute: 6944,       // 每分钟GMV

  // 假设宕机1分钟影响50%交易
  lossPerMinuteDowntime: 3472, // 每分钟宕机损失（元）

  // 用户相关
  avgOrderValue: 200,          // 平均订单金额（元）
  ordersPerMinute: 35,         // 每分钟订单数
};

// 基于业务影响设定可用性目标
// 如果每年宕机损失要控制在10万以内
const maxAnnualDowntimeLoss = 100_000;
const maxAllowedDowntimeMinutes = maxAnnualDowntimeLoss / businessMetrics.lossPerMinuteDowntime;
const maxAllowedDowntimeHours = maxAllowedDowntimeMinutes / 60;

console.log(`允许的最大宕机时间: ${maxAllowedDowntimeHours.toFixed(1)} 小时/年`);

// 计算对应的可用性百分比
const secondsPerYear = 365 * 24 * 3600;
const allowedDowntimeSeconds = maxAllowedDowntimeHours * 3600;
const requiredAvailability = (secondsPerYear - allowedDowntimeSeconds) / secondsPerYear * 100;

console.log(`要求的可用性: ${requiredAvailability.toFixed(3)}%`);
console.log(`换算成SLO: ${requiredAvailability.toFixed(1)}%`);
```

#### 1.3.2 参考行业标准

不同行业对可用性的要求不同：

```typescript
/**
 * 行业SLO参考标准
 *
 * 不同行业的可用性要求差异很大
 */

// 行业标准对照表
const industryStandards = {
  // 金融/支付系统：最高要求，5个9都不一定够
  fintech: {
    description: '金融/支付系统',
    typicalSLO: 99.999,  // 五个九，每年宕机不超过5.26分钟
    maxDowntimePerYear: '5.26分钟',
    reason: '任何宕机都可能导致巨额资金损失',
  },

  // 电商平台：高要求，通常4个9
  ecommerce: {
    description: '电商平台',
    typicalSLO: 99.99,   // 四个九，每年宕机不超过52分钟
    maxDowntimePerYear: '52分钟',
    reason: '宕机直接损失订单，影响品牌信誉',
  },

  // 社交媒体：中高要求
  socialMedia: {
    description: '社交媒体',
    typicalSLO: 99.9,     // 三个九，每年宕机不超过8.76小时
    maxDowntimePerYear: '8.76小时',
    reason: '用户容忍度相对较高，但长时间宕机会流失用户',
  },

  //企业内部系统：一般要求
  enterprise: {
    description: '企业内部系统',
    typicalSLO: 99.5,     // 每年宕机不超过43.8小时
    maxDowntimePerYear: '43.8小时',
    reason: '主要影响内部效率，但不直接损失客户',
  },

  // 批处理系统：较低要求
  batchProcessing: {
    description: '批处理/离线计算系统',
    typicalSLO: 99.0,     // 每年宕机不超过87.6小时
    maxDowntimePerYear: '87.6小时',
    reason: '对实时性要求不高，只要最终能完成即可',
  },
};

/**
 * 项目对应的SLO建议
 *
 * WebEnv-OS 作为开发环境类桌面系统：
 * - IDE功能：建议99.9%（允许少量宕机但不频繁）
 * - 文档服务：建议99.95%（用户正在编辑时不能断）
 * - WebSocket连接：建议99.99%（实时协作必须稳定）
 */
```

#### 1.3.3 多维度SLO设计

真实的系统需要从多个维度来定义SLO，不能只看一个"可用性"数字：

```typescript
/**
 * 完整的SLO设计框架
 *
 * 从四个核心维度定义SLO
 */

// 1. 可用性维度
const availabilitySLO = {
  metric: '服务可用时间 / 总时间',
  measurement: '健康检查成功率',
  target: 99.9,  // 99.9%
  warning: 99.5, // 低于这个值要报警
  critical: 99.0, // 低于这个值要紧急处理

  // 允许的宕机时间
  maxDowntimePerYear: '8.76小时',
  maxDowntimePerMonth: '43.8分钟',
  maxDowntimePerWeek: '10.1分钟',
  maxDowntimePerDay: '1.44分钟',
};

// 2. 延迟维度（用户体验的核心）
const latencySLO = {
  // P50延迟：半数用户体验到的延迟
  p50Target: 50,      // 毫秒
  p50Warning: 100,

  // P95延迟：绝大多数用户体验到的延迟
  p95Target: 200,     // 毫秒
  p95Warning: 500,

  // P99延迟：最差的1%用户体验
  p99Target: 500,     // 毫秒
  p99Warning: 1000,

  // 超过这个阈值的请求不算在SLO内
  // （区分异常慢和正常慢）
  excludeThreshold: 2000, // 2秒以上的请求不计入
};

// 3. 错误率维度
const errorRateSLO = {
  // HTTP错误率（4xx、5xx）
  httpErrorRateTarget: 0.1,   // 不超过0.1%
  httpErrorRateWarning: 0.5,

  // 5xx错误率（服务端错误，最严重）
  serverErrorRateTarget: 0.01, // 不超过0.01%
  serverErrorRateWarning: 0.1,

  // 请求超时率
  timeoutRateTarget: 0.05,
  timeoutRateWarning: 0.2,

  // 熔断触发率
  circuitBreakerRateTarget: 0, // 理想情况下不应触发熔断
};

// 4. 吞吐量维度
const throughputSLO = {
  // 最小可用QPS（每秒请求数）
  minAvailableQPS: 1000,

  // 最大响应时间内的QPS
  maxLatencyOkQPS: 5000,

  // 并发用户数上限
  maxConcurrentUsers: 10000,

  // 突发流量处理能力
  burstCapacity: 1.5, // 能处理平时150%的流量
};

/**
 * 总结：一个完善的SLO体系需要覆盖
 *
 * 1. 我承诺了什么（对外的SLA）
 * 2. 我要达成什么（内部的SLO）
 * 3. 我怎么测量（SLI）
 * 4. 现在做得怎么样（当前的实测值）
 */
```

### 1.4 SLI指标设计实战

SLI是SLO的数据来源，设计好SLI才能准确衡量SLO达成情况。

#### 1.4.1 常见SLI类型

```typescript
/**
 * SLI指标类型详解
 *
 * SLI是对系统行为的量化测量
 * 不同类型的服务需要不同的SLI
 */

// 1. 可用性类SLI
const availabilitySLIs = {
  // 传统可用性：成功请求占比
  successRate: {
    formula: '成功请求数 / 总请求数 × 100%',
    measurement: 'HTTP 2xx 视为成功',
    example: '24小时内，99000次成功/100000次总请求 = 99%可用性',
  },

  // 探活成功率
  healthCheckRate: {
    formula: '探活成功次数 / 总探活次数 × 100%',
    measurement: '连续3次失败判定为不可用',
    example: '每分钟探测一次，24小时共1440次，失败10次 = 99.3%',
  },

  // 舱壁模式成功率（隔离舱内的服务）
  cellSuccessRate: {
    formula: '正常舱室数 / 总舱室数 × 100%',
    measurement: '单舱故障不影响整体服务',
    example: '10个舱室中9个正常 = 90%可用性（但整体服务可能仍可用）',
  },
};

// 2. 延迟类SLI
const latencySLIs = {
  // 平均延迟
  avgLatency: {
    formula: '所有请求响应时间之和 / 请求数',
    unit: '毫秒（ms）或秒（s）',
    problem: '容易被极端值拉偏，不够准确',
  },

  // 分位数延迟（推荐）
  percentileLatency: {
    p50: '50%请求的延迟在这个值以下',
    p95: '95%请求的延迟在这个值以下（重要）',
    p99: '99%请求的延迟在这个值以下（关键）',
    p999: '99.9%请求的延迟在这个值以下（极端情况）',

    // 为什么用P99而不是平均值？
    // 假设99个请求10ms，1个请求10000ms
    // 平均值 = (99*10 + 10000)/100 = 109.9ms ← 被极端值严重影响
    // P99 = 10ms ← 更能反映用户真实体验
  },

  // 首字节时间（TTFB）
  timeToFirstByte: {
    description: '从发起请求到收到第一个字节的时间',
    importance: '用户开始看到内容的时间',
    target: '< 100ms',
  },
};

// 3. 错误类SLI
const errorSLIs = {
  // HTTP错误率
  httpErrorRate: {
    formula: '(4xx + 5xx请求数) / 总请求数 × 100%',
    breakdown: {
      '4xx': '客户端错误（通常是用户的问题）',
      '5xx': '服务端错误（是我们的问题）',
    },
    important: '通常只把5xx计入"错误"，4xx不算SLO违约',
  },

  // 请求超时率
  timeoutRate: {
    formula: '超时请求数 / 总请求数 × 100%',
    threshold: '通常定义为超过5秒的请求',
    importance: '超时比返回错误更影响用户体验',
  },

  // 熔断触发率
  circuitBreakerRate: {
    description: '熔断器触发的次数',
    indication: '说明某个下游服务已经不稳定',
    threshold: '应该尽量避免触发',
  },
};

// 4. 吞吐量类SLI
const throughputSLIs = {
  // QPS（每秒请求数）
  queriesPerSecond: {
    measurement: '1秒内处理的请求数量',
    importance: '系统处理能力直接体现',
  },

  // 并发连接数
  concurrentConnections: {
    measurement: '同一时刻的活跃连接数',
    importance: '防止超出系统承载能力',
  },

  // 带宽使用率
  bandwidthUtilization: {
    measurement: '已使用带宽 / 总带宽 × 100%',
    target: '< 70%（保留30%buffer）',
    critical: '> 90%时必须扩容',
  },
};
```

#### 1.4.2 WebEnv-OS的SLI设计

```typescript
/**
 * WebEnv-OS 开发环境系统的SLI设计
 *
 * 针对类桌面开发环境的特点来设计SLI
 */

// 核心服务SLI定义
const webEnvSLIConfig = {
  // 1. IDE核心服务
  ideService: {
    // 可用性：文档编辑服务不能随便挂
    availability: {
      sli: '文档打开成功率',
      measurement: '请求返回2xx且内容完整',
      target: 99.9,  // 99.9%
      // 每年允许宕机时间：8.76小时
    },

    // 延迟：打开文档要快
    latency: {
      sli: '文档打开P99延迟',
      measurement: '点击打开到看到内容的P99时间',
      target: 1000,  // 毫秒
      warning: 2000,
    },

    // 错误：编辑内容不能丢
    error: {
      sli: '文档保存成功率',
      measurement: '保存请求返回2xx',
      target: 99.99, // 几乎不能丢
    },
  },

  // 2. 终端服务
  terminalService: {
    // 可用性：终端启动要能成功
    availability: {
      sli: '终端启动成功率',
      measurement: '终端进程创建成功',
      target: 99.5,
    },

    // 延迟：输入输出要跟得上
    latency: {
      sli: '命令响应P99延迟',
      measurement: '按键到看到字符的P99时间',
      target: 50,  // 毫秒级响应
      warning: 100,
    },
  },

  // 3. 实时协作服务（最重要）
  collaborationService: {
    // 可用性：协作不能断
    availability: {
      sli: 'WebSocket连接保持率',
      measurement: '连接建立后1小时内不主动断开',
      target: 99.99,
    },

    // 延迟：协同编辑要同步
    latency: {
      sli: '操作同步P99延迟',
      measurement: '用户操作到其他用户看到的延迟',
      target: 200,  // 毫秒
      warning: 500,
    },

    // 冲突：协作编辑冲突率
    conflict: {
      sli: '编辑冲突率',
      measurement: '发生冲突的操作数 / 总操作数',
      target: '< 0.1%, // 几乎不应该有可见冲突
    },
  },

  // 4. 视频会议服务（如有）
  videoService: {
    availability: {
      sli: '会议加入成功率',
      target: 99.5,
    },
    latency: {
      sli: '视频延迟P99',
      target: 150,  // 毫秒
    },
    quality: {
      sli: '视频质量达标率',
      measurement: '720p以上画质占比',
      target: 95,  // 百分比
    },
  },
};
```

### 1.5 错误预算：SLO的精髓

错误预算（Error Budget）是SLO体系中最有意思的概念。简单说就是：允许你犯多少错。

#### 1.5.1 错误预算的计算

```typescript
/**
 * 错误预算是SLO的"反向指标"
 *
 * SLO是"我要做到多好"（正向追求）
 * 错误预算是"我还剩多少犯错空间"（反向缓冲）
 */

// 错误预算计算公式
const errorBudgetCalculator = {
  /**
   * 计算月度错误预算
   *
   * 假设SLO是99.9%
   * 那么允许的"不好"时间是0.1%
   *
   * 一个月（30天）的总分钟数：30 × 24 × 60 = 43200分钟
   * 允许的宕机时间：43200 × 0.001 = 43.2分钟
   */

  calculateMonthlyBudget: (sloTarget) => {
    const minutesPerMonth = 30 * 24 * 60;
    const errorRate = 1 - (sloTarget / 100);
    const allowedBadMinutes = minutesPerMonth * errorRate;

    return {
      minutesPerMonth,
      errorRate,
      allowedBadMinutes,
      allowedBadHours: allowedBadMinutes / 60,
    };
  },

  calculateWeeklyBudget: (sloTarget) => {
    const minutesPerWeek = 7 * 24 * 60;
    const errorRate = 1 - (sloTarget / 100);
    const allowedBadMinutes = minutesPerWeek * errorRate;

    return {
      minutesPerWeek,
      errorRate,
      allowedBadMinutes,
      allowedBadHours: allowedBadMinutes / 60,
    };
  },
};

// 不同SLO对应的错误预算
const errorBudgetTable = [
  { slo: 99, annual: '3.65天', monthly: '7.3小时', weekly: '1.68小时', daily: '14.4分钟' },
  { slo: 99.5, annual: '1.83天', monthly: '3.65小时', weekly: '50.4分钟', daily: '7.2分钟' },
  { slo: 99.9, annual: '8.76小时', monthly: '43.8分钟', weekly: '10.1分钟', daily: '1.44分钟' },
  { slo: 99.95, annual: '4.38小时', monthly: '21.9分钟', weekly: '5.04分钟', daily: '43.2秒' },
  { slo: 99.99, annual: '52.6分钟', monthly: '4.38分钟', weekly: '1.01分钟', daily: '8.6秒' },
  { slo: 99.999, annual: '5.26分钟', monthly: '26.3秒', weekly: '6.05秒', daily: '0.86秒' },
];

// 计算99.9% SLO的错误预算
const budget = errorBudgetCalculator.calculateMonthlyBudget(99.9);

console.log(`
SLO: 99.9%
每月允许的错误时间: ${budget.allowedBadMinutes.toFixed(1)} 分钟
每周允许的错误时间: ${(budget.allowedBadMinutes / 4).toFixed(1)} 分钟
每天允许的错误时间: ${(budget.allowedBadMinutes / 30).toFixed(1)} 分钟
`);

/**
 * 错误预算的"余额"概念
 *
 * 想象你的手机流量套餐：
 * - 月流量：100GB（SLO）
 * - 已使用：80GB（已消耗的错误预算）
 * - 剩余：20GB（剩余的错误预算）
 *
 * 当剩余流量多时，可以任性一点
 * 当剩余流量少时，要谨慎使用
 * 流量用完了（错误预算耗尽），就要被"断网"（暂停新功能发布）
 */
```

#### 1.5.2 错误预算的使用策略

```typescript
/**
 * 错误预算策略
 *
 * 核心思想：错误预算是"安全垫"，用完就要收手
 */

// 错误预算状态
const ErrorBudgetStatus = {
  HEALTHY: 'healthy',      // 充足（>50%）
  WARNING: 'warning',      // 警戒（20%-50%）
  DANGER: 'danger',        // 危险（<20%）
  DEPLETED: 'depleted',    // 耗尽（=0%）
};

/**
 * 错误预算余额计算
 */
class ErrorBudgetTracker {
  constructor(sloTarget, windowDays = 30) {
    this.sloTarget = sloTarget;        // SLO目标，如99.9
    this.windowDays = windowDays;      // 统计窗口，如30天
    this.totalMinutes = windowDays * 24 * 60;  // 总分钟数
    this.errorRate = 1 - (sloTarget / 100);    // 允许的错误率
    this.budget = this.totalMinutes * this.errorRate;  // 总错误预算（分钟）
  }

  /**
   * 计算当前错误预算余额
   *
   * @param {number} actualAvailability - 实际可用性
   * @returns {object} 错误预算状态
   */
  calculateRemainingBudget(actualAvailability) {
    // 实际错误率
    const actualErrorRate = 1 - (actualAvailability / 100);

    // 已消耗的错误时间（分钟）
    const consumedBadMinutes = this.totalMinutes * actualErrorRate;

    // 剩余的错误预算（分钟）
    const remainingBadMinutes = this.budget - consumedBadMinutes;

    // 剩余百分比
    const remainingPercent = (remainingBadMinutes / this.budget) * 100;

    // 确定状态
    let status;
    if (remainingPercent > 50) {
      status = ErrorBudgetStatus.HEALTHY;
    } else if (remainingPercent > 20) {
      status = ErrorBudgetStatus.WARNING;
    } else if (remainingPercent > 0) {
      status = ErrorBudgetStatus.DANGER;
    } else {
      status = ErrorBudgetStatus.DEPLETED;
    }

    return {
      totalBudget: this.budget,           // 总预算（分钟）
      consumed: consumedBadMinutes,       // 已消耗（分钟）
      remaining: remainingBadMinutes,      // 剩余（分钟）
      remainingPercent,                   // 剩余百分比
      status,                             // 状态
    };
  }

  /**
   * 评估是否可以发布新功能
   *
   * 规则：
   * - 错误预算充足时：可以发布，但要注意监控
   * - 错误预算警戒时：谨慎发布，需要额外审批
   * - 错误预算危险时：停止发布，专注稳定性
   * - 错误预算耗尽时：禁止发布，必须先修复问题
   */
  canaryReleasePolicy(remainingPercent) {
    if (remainingPercent > 50) {
      return {
        canRelease: true,
        approval: '自动批准',
        monitoring: '标准监控',
        rollbackThreshold: '错误率超过SLO 0.5%',
      };
    } else if (remainingPercent > 20) {
      return {
        canRelease: true,
        approval: '需要SRE批准',
        monitoring: '加强监控（5分钟检查一次）',
        rollbackThreshold: '错误率超过SLO 0.2%',
      };
    } else if (remainingPercent > 0) {
      return {
        canRelease: false,
        reason: '错误预算不足，需要优先稳定系统',
        recovery: '等待错误预算恢复或主动改善SLO',
      };
    } else {
      return {
        canRelease: false,
        reason: '错误预算已耗尽，禁止任何变更',
        emergency: '启动稳定性专项，直至预算恢复25%以上',
      };
    }
  }
}

// 使用示例
const tracker = new ErrorBudgetTracker(99.9, 30);

// 假设当前实际可用性是99.85%（消耗了比预期更多的预算）
const budgetState = tracker.calculateRemainingBudget(99.85);

console.log(`
当前SLO: 99.9%
实际可用性: 99.85%
错误预算状态: ${budgetState.status}
剩余预算: ${budgetState.remaining.toFixed(1)} 分钟（本月底前）
剩余百分比: ${budgetState.remainingPercent.toFixed(1)}%
`);

const releasePolicy = tracker.canaryReleasePolicy(budgetState.remainingPercent);
console.log('发布策略:', releasePolicy);
```

---

## 第二部分：故障复盘与持续改进

### 2.1 为什么故障不可避免？

先接受一个事实：系统一定会出故障。

这听起来很丧气，但这是SRE的基本认知。无论是Google、AWS还是阿里云，没有任何系统能保证100%可用。即使是99.999%的SLO，每年也会有5分钟的宕机时间。

故障的来源多种多样：
- 硬件故障：硬盘损坏、内存出错、网络设备故障
- 软件bug：代码写错了、边界条件没处理
- 人为失误：误删数据、配置改错、发布失误
- 外部攻击：DDoS、恶意爬虫、供应链攻击
- 不可抗力：地震、洪水、停电

所以SRE不追求"不出故障"，而是追求"故障来了怎么办"——如何快速发现、快速恢复、快速改进。

### 2.2 故障复盘的目的

故障复盘（Postmortem）不是追责会，而是学习会。

```typescript
/**
 * 故障复盘的核心目的
 *
 * 记住：复盘是为了改进，不是为了惩罚
 */

// 复盘要回答的五个问题
const postmortemQuestions = {
  // 1. 发生了什么？
  what: '故障的全貌是什么？影响了什么？持续了多久？',

  // 2. 为什么会发生？
  why: '根本原因是什么？（不是表面原因）',

  // 3. 为什么没有早点发现？
  detection: '为什么监控没发现？为什么没报警？',

  // 4. 为什么损失这么大？
  impact: '为什么影响范围这么大？为什么恢复这么慢？',

  // 5. 怎么防止再发生？
  prevention: '要做什么才能避免同类故障？需要多久完成？',
};

/**
 * 复盘的原则
 */
const postmortemPrinciples = {
  // 原则1： blameless（无责）
  // 故障是人导致的，但人的失误往往是系统问题
  // 要改进的是系统，不是惩罚人
  blameless: `
  错误示范：谁干的？给我滚出来！
  正确示范：这个人在什么系统环境下会犯错？如何让系统更安全？`,

  // 原则2： thorough（彻底）
  // 不仅要找到直接原因，还要找根本原因
  // 不仅要解决这次的问题，还要防止类似问题
  thorough: `
  错误示范：服务器挂了，重启一下就好了
  正确示范：服务器为什么挂？是内存泄漏，要修复内存管理逻辑`,

  // 原则3： realistic（实际）
  // 复盘要基于事实，不是猜测
  // 建议要可执行，不是空话
  realistic: `
  错误示范：以后要小心点，别再出错了
  正确示范：在发布流程中加入内存监控，超过80%自动报警`,
};
```

### 2.3 故障复盘模板

```typescript
/**
 * 故障复盘文档模板
 *
 * 每个故障复盘都应该包含以下部分
 */

// 复盘文档结构
const postmortemTemplate = {
  // ===== 基础信息 =====
  metadata: {
    incidentId: 'INC-2024-001',        // 故障编号
    title: '文档协作服务不可用',        // 简洁的故障标题
    severity: 'SEV-1',                  // 严重等级
    startTime: '2024-03-15 14:23:00',  // 故障开始时间
    endTime: '2024-03-15 15:47:00',    // 故障恢复时间
    duration: '1小时24分钟',           // 持续时长
    reportedBy: '监控系统',            // 如何发现的
    affectUsers: '约1200名用户',       // 影响用户数
    author: '张三',                     // 复盘负责人
    date: '2024-03-18',                // 复盘日期
  },

  // ===== 故障摘要 =====
  summary: `
  2024年3月15日14:23，由于协作编辑服务使用的Redis集群发生主从切换，
  导致约1200名用户无法正常使用文档协作功能，故障持续1小时24分钟。
  故障期间，用户无法创建新文档，已打开的文档只能查看无法编辑。
  `,

  // ===== 时间线（关键） =====
  timeline: [
    {
      time: '14:20:00',
      event: '运维团队进行Redis集群版本升级演练',
      note: '这是故障的导火索，但本身是计划内操作',
    },
    {
      time: '14:23:00',
      event: 'Redis主节点开始主从切换',
      note: '切换过程中出现短暂断开',
    },
    {
      time: '14:23:15',
      event: '协作编辑服务开始报连接错误',
      note: 'Yjs WebSocket连接开始大量断开',
    },
    {
      time: '14:25:00',
      event: '监控系统检测到Yjs连接数异常下降',
      note: '触发P2级报警',
    },
    {
      time: '14:31:00',
      event: '值班工程师李四收到报警并确认故障',
      note: '开始排查',
    },
    {
      time: '14:45:00',
      event: '定位到Redis连接问题，开始尝试恢复',
      note: '多次重连失败',
    },
    {
      time: '15:20:00',
      event: '决定重启Redis集群',
      note: '需要业务方确认影响范围',
    },
    {
      time: '15:35:00',
      event: 'Redis集群恢复，协作编辑服务重连成功',
      note: '服务开始自动恢复',
    },
    {
      time: '15:47:00',
      event: '确认所有用户连接恢复正常',
      note: '故障结束',
    },
  ],

  // ===== 根本原因分析 =====
  rootCauseAnalysis: {
    // 直接原因
    directCause: `
    Redis集群主从切换过程中，协作编辑服务未正确处理连接中断，
    导致大量Yjs文档连接丢失，且未能自动恢复。`,

    // 根本原因（5个为什么）
    rootCause: {
      why1: '为什么Redis主从切换导致问题？→ 切换过程中有约30秒的连接中断',
      why2: '为什么30秒的中断会导致故障？→ 协作服务的断线重连逻辑有bug',
      why3: '为什么断线重连有bug？→ 代码在连接断开后没有触发自动重连',
      why4: '为什么没有自动重连？→ 当时为了快速上线临时关闭了这个功能',
      why5: '为什么能关闭重要功能上线？→ 缺少对关键功能的变更检查',
    },

    // 系统性问题
    systemicIssues: [
      '协作服务的断线重连机制未经过充分测试',
      'Redis升级流程没有考虑到对实时协作服务的影响',
      '缺少对协作连接状态的实时监控和报警',
      '故障时的沟通流程不清晰，导致决策延迟',
    ],
  },

  // ===== 影响评估 =====
  impact: {
    // 用户影响
    users: {
      affected: 1200,
      duration: '1小时24分钟',
      operations: ['无法创建文档', '无法编辑文档', '部分用户会议中断'],
    },

    // 业务影响
    business: {
      lostRevenue: '估算约5万元（按平均客单价计算）',
      reputation: '收到3起用户投诉，1起媒体曝光',
      slaBreach: '本月SLO从99.9%降至99.4%，触发SLA赔付条款',
    },
  },

  // ===== 改进措施 =====
  actionItems: [
    {
      id: 'AI-001',
      title: '修复协作服务的断线重连逻辑',
      description: '在网络断开后自动尝试重连，最多尝试5次，间隔2秒',
      owner: '王五',
      dueDate: '2024-03-22',
      priority: 'P0',  // 最高优先级
      status: 'completed',
    },
    {
      id: 'AI-002',
      title: '增加协作连接状态的监控报警',
      description: '当连接数下降超过20%时触发P1报警',
      owner: '赵六',
      dueDate: '2024-03-25',
      priority: 'P1',
      status: 'completed',
    },
    {
      id: 'AI-003',
      title: '制定Redis升级的标准流程',
      description: '要求任何Redis变更必须提前评估对所有依赖服务的影响',
      owner: '运维团队',
      dueDate: '2024-04-01',
      priority: 'P1',
      status: 'in-progress',
    },
    {
      id: 'AI-004',
      title: '增加Redis切换的演练',
      description: '每季度进行一次Redis主从切换的演练，验证所有依赖服务的容错能力',
      owner: '运维团队',
      dueDate: '2024-06-30',
      priority: 'P2',
      status: 'pending',
    },
  ],

  // ===== 经验教训 =====
  lessons: [
    {
      positive: '监控报警及时，从故障发生到工程师确认只用了8分钟',
    },
    {
      positive: '故障期间团队沟通顺畅，没有出现信息混乱',
    },
    {
      negative: '对第三方服务的依赖没有被充分评估',
    },
    {
      negative: '某些"快速上线"的临时方案埋下了隐患',
    },
  ],

  // ===== 后续跟进 =====
  followUp: {
    nextReview: '2024-04-15',
    reviewItems: [
      '验证所有P0、P1改进措施已落实',
      '进行一次Redis故障的演练',
      '重新评估SLO是否需要调整',
    ],
  },
};
```

### 2.4 复盘会议怎么开？

```typescript
/**
 * 故障复盘会议指南
 *
 * 好的复盘会议能让团队学到更多
 */

// 复盘会议前的准备
const preMeetingPreparation = {
  // 会议前需要收集的信息
  dataToCollect: [
    '故障时间线（从监控系统中提取）',
    '相关日志（错误日志、访问日志）',
    '报警记录（何时报警、谁收到、响应时间）',
    '变更记录（故障前后有哪些变更）',
    '用户反馈（投诉工单、用户描述）',
  ],

  // 需要提前阅读的材料
  materialsToRead: [
    '故障报告初稿',
    '相关代码和配置',
    '之前的类似故障复盘（如果有）',
  ],
};

// 会议参与人员
const meetingParticipants = {
  // 必须参加
  required: [
    '故障负责人（主操作的人）',
    '值班工程师（发现/响应的人）',
    'SRE/运维（基础设施相关）',
    '技术负责人（拍板的人）',
  ],

  // 建议参加
  recommended: [
    '产品经理（了解业务影响）',
    '测试工程师（了解测试覆盖）',
    '其他相关研发（学习经验）',
  ],

  // 不需要参加
  notNeeded: [
    '领导（除非是重大故障）',
    'HR（除非涉及安全/合规）',
  ],
};

// 会议流程（约60-90分钟）
const meetingFlow = {
  // 第一阶段：回顾（15分钟）
  // 目的：让所有人了解故障经过
  phase1Review: {
    duration: '15分钟',
    speaker: '故障负责人',
    content: `
    1. 用时间线方式讲述故障经过
    2. 说明故障影响范围
    3. 展示关键数据（持续时间、影响用户、错误率等）
    4. 不要在这个阶段讨论原因或责任
    `,
  },

  // 第二阶段：分析（30分钟）
  // 目的：找到根本原因
  phase2Analysis: {
    duration: '30分钟',
    approach: '5个为什么分析法',
    discussion: `
    1. 一起回顾"5个为什么"的分析结果
    2. 讨论是否有遗漏的系统性问题
    3. 确定哪些是直接原因，哪些是根本原因
    4. 识别出哪些问题是"人"的问题，哪些是"系统"的问题
    `,
  },

  // 第三阶段：行动（20分钟）
  // 目的：制定改进措施
  phase3Actions: {
    duration: '20分钟',
    discussion: `
    1. 头脑风暴：有什么可以防止类似故障？
    2. 评估每个改进措施的可行性和效果
    3. 确定负责人和完成时间
    4. 区分优先级（必须做 vs 应该做 vs 可以做）
    `,
  },

  // 第四阶段：总结（15分钟）
  // 目的：明确后续工作
  phase4Summary: {
    duration: '15分钟',
    content: `
    1. 确认每项改进措施的负责人和截止日期
    2. 约定下次跟进时间
    3. 确认是否需要向其他团队或用户通报
    4. 总结本次故障的经验教训
    `,
  },
};

// 会议中的注意事项
const meetingDosAndDonts = {
  // 应该做的
  dos: [
    '保持开放和非防御性的态度',
    '关注系统问题而不是个人问题',
    '鼓励提出"为什么不"的问题',
    '让数据说话，用证据支持观点',
    '认可好的实践，即使在故障中',
  ],

  // 不应该做的
  donts: [
    '把复盘开成批斗会',
    '急于得出结论，忽视证据',
    '只关注技术细节，忽视流程问题',
    '改进措施没有明确负责人',
    '复盘完就完，没有后续跟进',
  ],
};
```

---

## 第三部分：实战案例分析

### 3.1 WebEnv-OS的SLO体系设计

```typescript
/**
 * WebEnv-OS 开发环境系统的完整SLO设计
 *
 * 这是一个类桌面开发环境，有以下核心服务：
 * - IDE服务：文档编辑、代码高亮
 * - 终端服务：命令行操作
 * - 协作服务：实时多人编辑
 * - 视频服务：屏幕共享、视频会议
 */

// 整体SLO框架
const webEnvOSSLIFramework = {
  // 服务层级（Tier）
  serviceTiers: {
    tier1: {
      // 第一梯队：核心功能，宕机直接影响用户工作
      services: ['IDE服务', '协作服务', '终端服务'],
      slo: 99.9,  // 99.9% SLO
      errorBudget: '每月43.8分钟',
      recoveryObjective: '30分钟内恢复',
    },
    tier2: {
      // 第二梯队：重要功能，宕机影响部分用户体验
      services: ['用户认证', '文件存储', '搜索服务'],
      slo: 99.5,  // 99.5% SLO
      errorBudget: '每月3.65小时',
      recoveryObjective: '4小时内恢复',
    },
    tier3: {
      // 第三梯队：辅助功能，宕机不影响核心工作
      services: ['用户统计', '系统设置', '帮助文档'],
      slo: 99.0,  // 99% SLO
      errorBudget: '每月7.3小时',
      recoveryObjective: '24小时内恢复',
    },
  },

  // 核心SLI定义
  coreSLIs: {
    /**
     * IDE服务SLI
     *
     * 用户最常用的功能：打开文档、编辑、保存
     */
    ideService: {
      // 文档打开成功率
      docOpenSuccessRate: {
        description: '用户请求打开文档并成功获取内容的比例',
        measurement: '统计所有/doc/open请求中返回完整内容的比例',
        target: 99.9,
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 99.5,
          critical: 99.0,
        },
      },

      // 文档保存成功率
      docSaveSuccessRate: {
        description: '用户保存文档成功的比例',
        measurement: '统计所有/doc/save请求中返回成功的比例',
        target: 99.99,  // 编辑内容不能丢，要求极高
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 99.9,
          critical: 99.5,
        },
      },

      // 文档打开延迟
      docOpenLatency: {
        description: '文档打开的P99延迟',
        measurement: '从请求到收到完整内容的P99时间',
        target: 1000,  // 毫秒
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 2000,
          critical: 5000,
        },
      },
    },

    /**
     * 协作服务SLI
     *
     * 实时协作是核心竞争力，必须高可用
     */
    collaborationService: {
      // WebSocket连接保持率
      wsConnectionRate: {
        description: 'WebSocket连接保持稳定的比例',
        measurement: '连接建立后1小时内不主动断开的比例',
        target: 99.99,
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 99.9,
          critical: 99.5,
        },
      },

      // 操作同步延迟
      syncLatency: {
        description: '用户操作同步到其他用户的P99延迟',
        measurement: '从用户A发送操作到用户B看到该操作的P99时间',
        target: 200,  // 毫秒
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 500,
          critical: 1000,
        },
      },

      // 协作冲突率
      conflictRate: {
        description: '编辑操作发生冲突的比例',
        measurement: '发生冲突的操作数 / 总操作数',
        target: '< 0.01%, // Yjs的CRDT应该几乎无冲突
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 0.1,
          critical: 1.0,
        },
      },
    },

    /**
     * 终端服务SLI
     */
    terminalService: {
      // 终端启动成功率
      terminalStartRate: {
        description: '终端进程启动并就绪的比例',
        measurement: '用户请求启动终端后1秒内就绪的比例',
        target: 99.5,
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 99.0,
          critical: 98.0,
        },
      },

      // 终端响应延迟
      terminalLatency: {
        description: '命令执行的端到端延迟',
        measurement: '用户按键到看到回显的P99时间',
        target: 50,  // 毫秒
        window: '5分钟滚动窗口',
        alertThreshold: {
          warning: 100,
          critical: 200,
        },
      },
    },
  },
};

/**
 * SLO实现代码示例
 */

// SLI数据采集器
class SLICollector {
  constructor() {
    // 模拟数据存储
    this.metrics = {
      docOpen: [],
      docSave: [],
      wsConnection: [],
      syncLatency: [],
      terminalLatency: [],
    };
  }

  /**
   * 记录一个文档打开请求
   */
  recordDocOpen(success, latencyMs) {
    this.metrics.docOpen.push({
      timestamp: Date.now(),
      success,
      latencyMs,
    });

    // 只保留最近5分钟的数据
    this.pruneOldData('docOpen');
  }

  /**
   * 记录一个WebSocket连接事件
   */
  recordWSConnection(event) {
    this.metrics.wsConnection.push({
      timestamp: Date.now(),
      ...event,
    });

    this.pruneOldData('wsConnection');
  }

  /**
   * 清理旧数据（保留5分钟窗口）
   */
  pruneOldData(metric) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.metrics[metric] = this.metrics[metric].filter(
      (m) => m.timestamp > fiveMinutesAgo
    );
  }

  /**
   * 计算当前SLI值
   */
  calculateSLI(metric) {
    const data = this.metrics[metric];
    if (!data || data.length === 0) return null;

    switch (metric) {
      case 'docOpen':
      case 'docSave': {
        // 计算成功率
        const successCount = data.filter((d) => d.success).length;
        return (successCount / data.length) * 100;
      }

      case 'wsConnection': {
        // 计算连接保持率
        const disconnected = data.filter((d) => d.event === 'disconnect').length;
        const connected = data.filter((d) => d.event === 'connect').length;
        return (connected / (connected + disconnected)) * 100;
      }

      case 'syncLatency': {
        // 计算P99延迟
        const sorted = [...data].sort((a, b) => a.latency - b.latency);
        const p99Index = Math.floor(sorted.length * 0.99);
        return sorted[p99Index]?.latency || 0;
      }

      default:
        return null;
    }
  }

  /**
   * 检查SLO状态
   */
  checkSLOStatus(metric, target) {
    const current = this.calculateSLI(metric);
    if (current === null) return { status: 'unknown' };

    if (current >= target) {
      return { status: 'healthy', current, target };
    } else if (current >= target * 0.995) {
      return { status: 'warning', current, target };
    } else {
      return { status: 'critical', current, target };
    }
  }
}

// 使用示例
const collector = new SLICollector();

// 模拟记录一些数据
collector.recordDocOpen(true, 150);
collector.recordDocOpen(true, 200);
collector.recordDocOpen(false, 5000); // 一次失败
collector.recordWSConnection({ event: 'connect' });
collector.recordWSConnection({ event: 'disconnect' });

// 检查SLO状态
const docOpenStatus = collector.checkSLOStatus('docOpen', 99.9);
console.log('文档打开SLO状态:', docOpenStatus);
```

### 3.2 真实故障案例：协作编辑服务宕机复盘

```typescript
/**
 * 故障复盘案例：WebEnv-OS 协作编辑服务宕机
 *
 * 这是一个虚构但真实的故障场景
 */

// 故障基本信息
const incidentReport = {
  incidentId: 'INC-2024-0315',
  severity: 'SEV-1',
  startTime: '2024-03-15 14:23:00 CST',
  endTime: '2024-03-15 15:47:00 CST',
  duration: '1小时24分钟',

  // 影响范围
  impact: {
    affectedUsers: 1247,
    failedOperations: [
      '新建文档失败：约500次',
      '文档同步中断：约300用户',
      '会议掉线：约50场会议中断',
    ],
    services: ['IDE服务', '协作服务'],
  },

  // 故障时间线
  timeline: [
    {
      time: '14:20:00',
      event: '运维团队开始Redis集群版本升级',
      actor: '运维工程师-张明',
      note: '计划内的变更操作',
    },
    {
      time: '14:23:00',
      event: 'Redis主节点开始主从切换',
      actor: '系统自动',
      note: '升级过程中的正常步骤',
    },
    {
      time: '14:23:15',
      event: '协作服务开始报告Redis连接错误',
      actor: '协作服务',
      note: '连接超时的错误日志开始出现',
    },
    {
      time: '14:24:00',
      event: 'Yjs WebSocket连接开始大量断开',
      actor: '系统自动',
      note: '约80%的协作连接断开',
    },
    {
      time: '14:25:30',
      event: '监控系统触发P2报警',
      actor: '监控系统',
      note: '报警内容：协作连接数异常下降',
    },
    {
      time: '14:31:00',
      event: '值班工程师王五收到报警，确认故障',
      actor: '值班工程师-王五',
      note: '开始问题排查',
    },
    {
      time: '14:35:00',
      event: '定位到Redis连接问题',
      actor: '值班工程师-王五',
      note: '发现是Redis主从切换导致',
    },
    {
      time: '14:40:00',
      event: '尝试手动重连Redis',
      actor: '运维工程师-张明',
      note: '多次尝试失败',
    },
    {
      time: '14:50:00',
      event: '联系Redis供应商技术支持',
      actor: '运维工程师-张明',
      note: '等待技术支持响应',
    },
    {
      time: '15:10:00',
      event: '技术支持建议重启Redis集群',
      actor: '技术支持',
      note: '开始准备重启操作',
    },
    {
      time: '15:20:00',
      event: '执行Redis集群重启',
      actor: '运维工程师-张明',
      note: '需要业务方确认影响',
    },
    {
      time: '15:35:00',
      event: 'Redis集群恢复',
      actor: '系统自动',
      note: '协作服务开始自动重连',
    },
    {
      time: '15:42:00',
      event: '大部分用户连接恢复',
      actor: '系统自动',
      note: '约95%用户自动恢复',
    },
    {
      time: '15:47:00',
      event: '确认所有用户连接恢复正常',
      actor: '值班工程师-王五',
      note: '故障结束',
    },
  ],

  // 根本原因分析
  rootCauseAnalysis: {
    summary: `
    Redis集群在主从切换过程中，协作编辑服务的断线重连机制未能
    正确工作，导致大量Yjs WebSocket连接丢失且无法自动恢复。
    `,

    whyTree: {
      level1: '为什么协作服务会中断？',
      level2: '→ Redis主从切换导致连接中断',
      level3: '→ 为什么连接中断后没有恢复？',
      level4: '→ 协作服务的Redis重连逻辑存在bug，连接断开后未触发重连',
      level5: '→ 为什么这个bug没有被提前发现？',
      level6: '→ 缺少对重连逻辑的测试，也没有对Redis切换的演练',
    },

    systemicIssues: [
      '协作服务对Redis的依赖没有在架构层面做高可用设计',
      'Redis升级流程没有触发协作服务的可用性测试',
      '协作服务的重连机制代码质量不过关',
      '缺少对关键路径的故障演练',
      '监控指标不够细致，没有提前发现问题',
    ],
  },

  // 改进措施
  actionItems: [
    {
      id: 'AI-001',
      title: '修复协作服务的Redis重连逻辑',
      description: '增加连接断开检测和自动重连机制，使用指数退避算法',
      priority: 'P0',
      owner: '后端团队-李刚',
      dueDate: '2024-03-22',
      status: 'completed',
      verification: '本地测试+预发布环境验证',
    },
    {
      id: 'AI-002',
      title: '增加协作服务对Redis的熔断机制',
      description: '当Redis不可用时，协作服务降级为本地模式',
      priority: 'P0',
      owner: '后端团队-李刚',
      dueDate: '2024-03-25',
      status: 'completed',
      verification: '模拟Redis宕机验证降级逻辑',
    },
    {
      id: 'AI-003',
      title: '完善Redis升级流程',
      description: '要求Redis变更必须包含对所有依赖服务的可用性验证',
      priority: 'P1',
      owner: '运维团队',
      dueDate: '2024-04-01',
      status: 'completed',
      verification: '更新变更管理流程文档',
    },
    {
      id: 'AI-004',
      title: '增加协作连接状态监控',
      description: '实时监控WebSocket连接数，低于阈值自动报警',
      priority: 'P1',
      owner: 'SRE团队-赵七',
      dueDate: '2024-03-28',
      status: 'completed',
      verification: '观察监控面板确认报警正常',
    },
    {
      id: 'AI-005',
      title: '每季度进行Redis故障演练',
      description: '模拟Redis主从切换、网络中断等场景',
      priority: 'P2',
      owner: '运维团队',
      dueDate: '2024-06-30',
      status: 'pending',
      verification: '完成演练并输出报告',
    },
  ],

  // 经验教训
  lessons: [
    {
      positive: '监控报警及时，故障被发现的时间较短',
      evidence: '从故障发生到报警触发仅2.5分钟',
    },
    {
      positive: '团队沟通顺畅，故障期间有专人负责信息同步',
      evidence: '使用飞书群实时同步进展',
    },
    {
      negative: '对Redis升级的风险评估不足',
      evidence: '没有考虑到协作服务对Redis的强依赖',
    },
    {
      negative: '协作服务的重连机制没有经过充分测试',
      evidence: '上线时临时关闭了重连功能以加快速度',
    },
  ],
};

/**
 * 复盘会议纪要
 */
const meetingNotes = {
  date: '2024-03-18 14:00:00',
  duration: '90分钟',
  attendees: ['王五(值班工程师)', '李刚(后端负责人)', '张明(运维)', '赵七(SRE)', '产品经理-刘芳'],

  keyDecisions: [
    '优先修复重连逻辑，确保P0改进措施在本周内完成',
    'Redis升级流程增加协作服务可用性检查步骤',
    '在监控系统中增加协作连接数的实时大屏',
    '下次Redis升级前先进行小规模演练',
  ],

  openQuestions: [
    '协作服务是否应该使用Redis集群模式而非哨兵模式？',
    '是否需要引入多个Redis供应商避免单点故障？',
    '当前SLO是否需要调整以反映真实业务需求？',
  ],
};
```

---

## 第四部分：SRE工具与实践

### 4.1 SRE常用工具链

```typescript
/**
 * SRE工具生态全景图
 *
 * 从监控到告警到自动化，SRE需要一套完整的工具链
 */

// 监控与可观测性
const observabilityTools = {
  metrics: [
    { name: 'Prometheus', desc: '开源监控系统，Kubernetes标配', difficulty: '中' },
    { name: 'Grafana', desc: '可视化仪表盘，通常与Prometheus配合', difficulty: '低' },
    { name: 'DataDog', desc: '商业级监控，功能全面', difficulty: '低' },
    { name: 'CloudWatch', desc: 'AWS云监控', difficulty: '低' },
  ],

  logging: [
    { name: 'ELK Stack', desc: 'Elasticsearch+Logstash+Kibana', difficulty: '高' },
    { name: 'Loki', desc: 'Grafana套件，专注于日志', difficulty: '中' },
    { name: 'Splunk', desc: '商业日志分析平台', difficulty: '中' },
  ],

  tracing: [
    { name: 'Jaeger', desc: 'CNCF项目，分布式追踪', difficulty: '中' },
    { name: 'Zipkin', desc: 'Twitter开源的追踪系统', difficulty: '中' },
    { name: 'OpenTelemetry', desc: '标准化的可观测性规范', difficulty: '高' },
  ],
};

// 告警与事件管理
const alertTools = {
  alertManager: [
    { name: 'AlertManager', desc: 'Prometheus生态的告警管理', difficulty: '中' },
    { name: 'PagerDuty', desc: '商业告警和值班管理平台', difficulty: '低' },
    { name: 'OpsGenie', desc: '告警聚合和升级', difficulty: '低' },
  ],

  incident: [
    { name: 'PagerDuty', desc: '事件管理和值班调度', difficulty: '低' },
    { name: 'StatusPage', desc: '对外状态页面', difficulty: '低' },
    { name: 'C状态页', desc: '国内服务，集成度高', difficulty: '低' },
  ],
};

// 自动化与运维
const automationTools = {
  cicd: [
    { name: 'ArgoCD', desc: 'GitOps风格的持续部署', difficulty: '中' },
    { name: 'Jenkins X', desc: '云原生的CI/CD', difficulty: '中' },
    { name: 'GitHub Actions', desc: '简单易用的CI/CD', difficulty: '低' },
  ],

  infrastructure: [
    { name: 'Terraform', desc: '基础设施即代码', difficulty: '中' },
    { name: 'Ansible', desc: '配置管理和自动化', difficulty: '低' },
    { name: 'Pulumi', desc: '代码化基础设施', difficulty: '中' },
  ],

  kubernetes: [
    { name: 'kubectl', desc: 'K8s命令行工具', difficulty: '中' },
    { name: 'Helm', desc: 'K8s包管理器', difficulty: '低' },
    { name: 'Kustomize', desc: 'K8s配置管理', difficulty: '低' },
  ],
};

// 混沌工程
const chaosTools = [
  { name: 'Chaos Monkey', desc: 'Netflix开源，随机终止实例', difficulty: '中' },
  { name: 'Litmus', desc: 'Kubernetes混沌工程', difficulty: '中' },
  { name: 'Gremlin', desc: '商业混沌工程平台', difficulty: '低' },
  { name: 'PowerKiller', desc: '阿里云开源，混沌测试工具', difficulty: '中' },
];
```

### 4.2 SRE实践检查清单

```typescript
/**
 * SRE实践检查清单
 *
 * 用来自查团队SRE成熟度
 */

// 第一部分：监控与可观测性
const monitoringChecklist = {
  metrics: {
    title: '指标监控',
    items: [
      { check: '是否有覆盖所有核心服务的指标？', weight: 'high' },
      { check: '是否定义了清晰的SLO？', weight: 'high' },
      { check: '是否设置了SLO相关的告警？', weight: 'high' },
      { check: '是否有仪表盘展示关键指标？', weight: 'medium' },
      { check: '是否对关键指标有趋势分析？', weight: 'medium' },
    ],
  },

  logging: {
    title: '日志管理',
    items: [
      { check: '是否结构化日志格式（JSON）？', weight: 'high' },
      { check: '日志是否包含request_id便于链路追踪？', weight: 'high' },
      { check: '日志级别是否合理（INFO/WARN/ERROR）？', weight: 'medium' },
      { check: '日志是否集中存储？', weight: 'high' },
      { check: '日志是否支持快速搜索？', weight: 'medium' },
    ],
  },

  tracing: {
    title: '链路追踪',
    items: [
      { check: '是否实现了分布式追踪？', weight: 'high' },
      { check: '是否能在追踪中看到完整的调用链？', weight: 'high' },
      { check: '是否记录了关键路径的耗时？', weight: 'medium' },
      { check: '是否能快速定位慢请求的瓶颈？', weight: 'medium' },
    ],
  },
};

// 第二部分：事件与变更管理
const incidentChecklist = {
  detection: {
    title: '故障发现',
    items: [
      { check: '监控系统能在1分钟内发现故障？', weight: 'high' },
      { check: '告警是否发送到正确的值班人员？', weight: 'high' },
      { check: '告警内容是否包含足够的上下文？', weight: 'high' },
      { check: '是否有值班制度确保7x24响应？', weight: 'high' },
    ],
  },

  response: {
    title: '故障响应',
    items: [
      { check: '是否有清晰的故障升级流程？', weight: 'high' },
      { check: '是否有故障指挥官角色？', weight: 'medium' },
      { check: '故障期间是否有信息同步渠道？', weight: 'high' },
      { check: '是否有预定义的止血操作手册？', weight: 'medium' },
    ],
  },

  postmortem: {
    title: '故障复盘',
    items: [
      { check: '重大故障是否都有复盘？', weight: 'high' },
      { check: '复盘是否无责（blameless）？', weight: 'high' },
      { check: '复盘是否有明确的改进措施？', weight: 'high' },
      { check: '改进措施是否有负责人和截止日期？', weight: 'high' },
      { check: '改进措施是否被跟踪执行？', weight: 'high' },
    ],
  },
};

// 第三部分：容量与性能
const capacityChecklist = {
  planning: {
    title: '容量规划',
    items: [
      { check: '是否定期评估系统容量？', weight: 'high' },
      { check: '是否知道系统的承载上限？', weight: 'high' },
      { check: '是否有扩容/缩容的自动化机制？', weight: 'medium' },
      { check: '是否考虑了峰值流量的准备？', weight: 'high' },
    ],
  },

  testing: {
    title: '性能测试',
    items: [
      { check: '是否定期进行压力测试？', weight: 'medium' },
      { check: '是否测试过系统在高负载下的表现？', weight: 'medium' },
      { check: '是否知道系统的性能瓶颈在哪里？', weight: 'medium' },
    ],
  },
};

// 第四部分：变更与发布
const changeChecklist = {
  release: {
    title: '发布管理',
    items: [
      { check: '是否有灰度发布机制？', weight: 'high' },
      { check: '发布后是否有监控关注？', weight: 'high' },
      { check: '是否有回滚机制和演练？', weight: 'high' },
      { check: '发布是否在业务低峰期？', weight: 'medium' },
    ],
  },

  change: {
    title: '变更管理',
    items: [
      { check: '重大变更是否有审批流程？', weight: 'medium' },
      { check: '变更是否有回滚方案？', weight: 'high' },
      { check: '是否记录了所有变更历史？', weight: 'medium' },
    ],
  },
};

/**
 * 计算SRE成熟度得分
 */
function calculateSREMaturity() {
  // 简化计算：统计已完成的检查项
  const allChecklists = [
    monitoringChecklist,
    incidentChecklist,
    capacityChecklist,
    changeChecklist,
  ];

  let totalWeight = 0;
  let completedWeight = 0;

  for (const checklist of allChecklists) {
    for (const category of Object.values(checklist)) {
      for (const item of category.items || []) {
        totalWeight += item.weight === 'high' ? 2 : 1;
        // 假设我们只是评估，不需要真正计算
      }
    }
  }

  // 返回框架（实际使用时需要界面配合）
  return {
    summary: '基于以上检查清单评估SRE成熟度',
    recommendation: '优先解决weight为high的检查项',
  };
}
```

---

## 第五部分：SRE与业务平衡

### 5.1 SRE不是万能药

SRE很重要，但它不是银弹。有几件事SRE解决不了：

```typescript
/**
 * SRE的边界
 *
 * 知道什么应该交给SRE，什么不应该
 */

// SRE擅长解决的问题
const sreStrengths = [
  '系统可用性和可靠性',
  '故障检测和响应',
  '容量规划',
  '性能优化',
  '自动化运维',
  '监控和可观测性',
];

// SRE不擅长（或者不应该做）的
const sreWeaknesses = [
  '产品设计和用户体验',
  '业务逻辑和功能需求',
  '代码质量和架构设计（主要靠研发）',
  '人员招聘和管理',
  '商业模式和盈利策略',
  '市场营销和用户增长',
];

/**
 * SRE与研发的关系
 */

// 理想状态
const idealRelationship = {
  // 研发负责
  developerResponsibility: [
    '编写高质量的代码',
    '设计可扩展的架构',
    '修复bug和技术债务',
    '实现新功能和业务逻辑',
    '单元测试和集成测试',
  ],

  // SRE负责
  sreResponsibility: [
    '保障服务稳定性',
    '监控系统建设',
    '容量规划',
    '故障响应',
    '自动化工具',
    '性能优化（基础设施层面）',
  ],

  // 共同负责
  sharedResponsibility: [
    '发布流程和灰度策略',
    '报警阈值设置',
    '故障复盘和改进',
    '架构决策（考虑可运维性）',
    '容量评估',
  ],
};
```

### 5.2 如何向老板解释SRE的价值？

```typescript
/**
 * SRE价值量化
 *
 * 用业务语言解释SRE的价值
 */

// 计算SLO达成的业务价值
const sloBusinessValue = {
  /**
   * 假设我们的电商网站SLO是99.9%
   *
   * 每天的请求量：1000万次
   * 平均每千次请求带来收入：10元
   *
   * 如果SLO从99.9%降到99.0%：
   * - 每天增加 0.9% * 1000万 = 9万次失败请求
   * - 每天损失收入：9万 / 1000 * 10 = 900元
   * - 每月损失：900 * 30 = 27000元
   */

  calculationExample: {
    dailyRequests: 10_000_000,
    revenuePerThousandRequests: 10,  // 元
    slo99_9DailyDowntime: 1.44,      // 分钟
    slo99_0DailyDowntime: 14.4,      // 分钟

    // 99.9% SLO
    slo99_9Loss: (14.4 - 1.44) / 60 * (10_000_000 / 86400) * 10,
    // 99.0% SLO (增加的部分)
    slo99_0ExtraLoss: 13 / 60 * (10_000_000 / 86400) * 10,
  },
};

// 故障成本计算
const downtimeCostCalculator = {
  /**
   * 故障成本 = 直接损失 + 间接损失 + 声誉损失
   *
   * 直接损失：宕机期间无法成交的收入
   * 间接损失：用户流失、口碑影响
   * 声誉损失：品牌价值受损
   */

  calculateDowntimeCost: (minutes, gmvPerMinute, userChurnRate, customerLifetimeValue) => {
    // 直接损失
    const directLoss = minutes * gmvPerMinute;

    // 间接损失（用户流失）
    const userChurnLoss = userChurnRate * customerLifetimeValue;

    // 声誉损失（难以量化，但可以通过客户投诉数量估算）
    const reputationLoss = minutes * 1000; // 估算值

    return {
      directLoss,
      userChurnLoss,
      reputationLoss,
      total: directLoss + userChurnLoss + reputationLoss,
    };
  },

  // WebEnv-OS的故障成本估算
  webEnvCase: {
    users: 10000,
    avgDailyUsageMinutes: 60,
    revenuePerUserMonthly: 99,  // 元
    customerLifetimeMonths: 12,
    customerLifetimeValue: 99 * 12,  // 1188元

    // 假设每次故障导致0.1%的用户流失
    churnRatePerIncident: 0.001,

    // 计算一次故障的成本
    calculate: function (downtimeMinutes) {
      const gmvPerMinute = (10000 * 99 / 30) / 1440;  // 每分钟GMV

      return this.downtimeCostCalculator.calculateDowntimeCost(
        downtimeMinutes,
        gmvPerMinute,
        this.churnRatePerIncident * 10000,  // 流失用户数
        this.customerLifetimeValue
      );
    },
  },
};

/**
 * SRE投入产出比
 *
 * 一个成熟的SRE体系需要投入多少？值不值？
 */

// SRE投入估算
const sreInvestment = {
  // 人员成本（中型团队）
  headcount: {
    sreEngineers: 2,       // 2个SRE工程师
    avgSalary: 40000,     // 月薪4万
    annualCost: 2 * 40000 * 12,  // 96万/年
  },

  // 工具成本
  tools: {
    monitoring: 50000,      // 监控工具年费
    logging: 30000,         // 日志系统年费
    alerting: 20000,        // 告警系统年费
    total: 100000,          // 10万/年
  },

  // 总投入
  totalAnnual: 96 + 10,  // 约106万/年
};

// SRE回报估算
const sreReturn = {
  // 减少的故障损失
  incidentReduction: {
    beforeSRE: 12,    // 引入SRE前每年12次重大故障
    afterSRE: 4,       // 引入SRE后每年4次重大故障
    avgCostPerIncident: 50000,  // 每次故障平均损失5万
    annualSavings: (12 - 4) * 50000,  // 节省40万/年
  },

  // 自动化带来的效率提升
  automation: {
    reducedManualWork: '每周减少20小时人工操作',
    hourlyCost: 200,  // 工程师时薪
    annualSavings: 20 * 52 * 200,  // 约20万/年
  },

  // 总回报
  totalAnnual: 40 + 20,  // 约60万/年
};

// ROI计算
const roiCalculation = {
  investment: sreInvestment.totalAnnual,
  return: sreReturn.totalAnnual,

  // ROI = (回报 - 投入) / 投入 * 100%
  roi: ((sreReturn.totalAnnual - sreInvestment.totalAnnual) / sreInvestment.totalAnnual * 100).toFixed(1) + '%',

  // 回收期
  paybackPeriod: (sreInvestment.totalAnnual / sreReturn.totalAnnual).toFixed(1) + '年',
};
```

---

## 总结：SRE实践指南

### 核心要点回顾

```typescript
/**
 * SRE入门三步走
 */

// 第一步：定义SLO
const step1DefineSLO = {
  action: '为你的核心服务定义SLO',
  tips: [
    '从业务影响出发，不要拍脑袋定数字',
    'SLO要比SLA更严格，留出buffer',
    '覆盖可用性、延迟、错误率等多个维度',
    '定期回顾和调整SLO',
  ],
  output: '一份清晰的SLO文档',
};

// 第二步：建立监控
const step2BuildMonitoring = {
  action: '建立覆盖所有SLO的监控和告警',
  tips: [
    'SLI要能准确反映SLO达成情况',
    '告警阈值要合理，避免告警疲劳',
    '要有仪表盘让所有人能看到当前状态',
    '记录足够的上下文便于排查问题',
  ],
  output: '监控仪表盘和告警规则',
};

// 第三步：故障改进
const step3ImproveReliability = {
  action: '通过故障复盘持续改进',
  tips: [
    '故障无法避免，但要从中学习',
    '复盘是无责的，重点是系统改进',
    '改进措施要有负责人和截止日期',
    '定期回顾改进措施的落实情况',
  ],
  output: '改进措施跟踪表',
};

/**
 * SRE成熟度模型
 */

const sreMaturityLevels = {
  level1: {
    name: '初始级',
    description: '没有SLO，没有监控，出问题再救火',
    characteristics: [
      '不知道系统的实际可用性',
      '故障发现靠用户投诉',
      '没有复盘，有问题就完',
    ],
  },

  level2: {
    name: '基础级',
    description: '有基本的监控和SLO概念',
    characteristics: [
      '定义了SLO但没有严格遵守',
      '有监控但告警混乱',
      '有故障复盘但不系统',
    ],
  },

  level3: {
    name: '规范级',
    description: '有完整的SRE实践',
    characteristics: [
      'SLO被严格执行，错误预算管理',
      '监控覆盖全面，告警精准',
      '故障复盘有闭环，改进措施落实',
    ],
  },

  level4: {
    name: '优化级',
    description: '能够预测和预防问题',
    characteristics: [
      '有容量规划和性能测试',
      '有混沌工程验证系统韧性',
      '能预测SLO达成情况',
    ],
  },

  level5: {
    name: '大师级',
    description: 'SRE文化深入人心',
    characteristics: [
      '每个工程师都有SRE意识',
      '可靠性是需求的一部分',
      '持续改进，系统越来越稳',
    ],
  },
};
```

---

## 附录：常见问题解答

### Q1: SLO设置太高会不会影响业务迭代？

A：这是一个常见的担忧。答案是：合理的SLO不会阻碍业务，反而能帮助业务。

原理：错误预算的概念告诉你"在某个SLO下你还能犯多少错"。如果你的错误预算还剩很多，大可以激进一点快速迭代；如果错误预算快用完了，就应该谨慎一些。

关键是要让团队理解：SLO不是为了绑住手脚，而是为了在追求速度和稳定性之间找到平衡。

### Q2: 如何说服老板投入SRE资源？

A：用老板能听懂的语言。

1. **算清楚故障成本**：一次宕机损失多少？一年多少次故障？
2. **算清楚SRE投入**：需要多少人？什么工具？
3. **算ROI**：投入产出比是多少？

比如："去年我们因为故障损失了约200万，如果投入50万建立SRE体系，预计能减少80%的故障损失，ROI超过200%。"

### Q3: 小团队怎么做SRE？

A：小团队不需要全套的SRE工具，但需要SRE的思维。

1. **先定义SLO**：即使只有你和另一个工程师，也要知道"什么情况下算系统挂了"
2. **基本的监控**：用免费的Prometheus+Grafana就够
3. **简单的告警**：不要贪多，先告警最关键的问题
4. **故障后复盘**：不一定要写正式文档，但一定要讨论学到了什么

记住：SRE是一种思维方式，不是一套工具。

### Q4: SLO达不到怎么办？

A：先不要慌，按以下步骤分析：

1. **分析差距**：现在的SLI是多少？目标是多少？差多少？
2. **找到瓶颈**：是哪个指标拖了后腿？延迟？错误率？
3. **制定改进计划**：
   - 如果是基础设施问题，可能需要扩容或优化
   - 如果是代码问题，可能需要重构或修复bug
   - 如果是架构问题，可能需要改变设计
4. **调整SLO（谨慎）**：如果技术确实达不到，可以暂时降低SLO，但要有明确的改进计划

### Q5: 错误预算怎么管理？

A：把错误预算当成一个银行账户来管理。

1. **可视化**：在仪表盘上显示剩余预算
2. **设置阈值**：剩余多少时报警（比如低于50%报警，低于20%停止发布）
3. **与发布挂钩**：错误预算充足时可以快速迭代，快用完时谨慎发布
4. **定期回顾**：每月回顾错误预算消耗情况，分析原因

---

## 延伸阅读与学习资源

### 必读书籍

1. **《Site Reliability Engineering》** - Google SRE团队出品，最权威的SRE指南
2. **《The Site Reliability Workbook》** - SRE实践手册，包含大量案例
3. **《.seekable》** - 混沌工程入门

### 推荐学习路径

1. 理解SLO/SLI/SLA概念（1天）
2. 设计自己的SLO体系（1周）
3. 建立监控和告警（2周）
4. 进行几次故障复盘（持续）
5. 尝试混沌工程（1个月）
6. 建立完整的SRE流程（持续改进）

---

*本文档由Claude Code辅助编写，基于Google SRE最佳实践和WebEnv-OS项目实战经验。如有问题，欢迎交流讨论。*
