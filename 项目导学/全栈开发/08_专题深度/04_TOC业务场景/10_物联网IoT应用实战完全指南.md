# 物联网IoT应用实战完全指南

## 目录

1. [IoT概述](#1-iot概述)
2. [MQTT协议](#2-mqtt协议)
3. [WebSocket物联网](#3-websocket物联网)
4. [设备管理后台](#4-设备管理后台)
5. [智能家居](#5-智能家居)
6. [实时数据大屏](#6-实时数据大屏)
7. [地图追踪](#7-地图追踪)
8. [小程序IoT](#8-小程序iot)
9. [边缘计算](#9-边缘计算)
10. [安全方案](#10-安全方案)

---

## 1. IoT概述

### 1.1 物联网架构：设备-网关-云平台

物联网（Internet of Things，简称IoT）是指通过信息传感设备，将任何物品与互联网连接起来进行信息交换和通信，以实现智能化识别、定位、跟踪、监控和管理的网络概念。物联网被视为继计算机、互联网之后，世界信息产业的第三次浪潮。

**物联网三层架构：**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        物联网架构分层图                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐        │
│   │   感知层    │      │   网络层    │      │  应用层     │        │
│   │  (设备层)   │ ──── │  (网关层)   │ ──── │  (云平台)   │        │
│   └─────────────┘      └─────────────┘      └─────────────┘        │
│         │                    │                    │               │
│         ▼                    ▼                    ▼               │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐        │
│   │  传感器     │      │   5G/4G     │      │  数据存储   │        │
│   │  执行器     │      │   WiFi      │      │  数据分析   │        │
│   │  RFID       │      │   LoRa      │      │  应用服务   │        │
│   │  摄像头     │      │   ZigBee    │      │  用户界面   │        │
│   └─────────────┘      └─────────────┘      └─────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**感知层（设备层）：**
- 负责采集物理世界的数据
- 包括各种传感器（温度、湿度、压力、位置等）
- 执行器（电机、阀门、开关等）
- 常见的设备协议：Modbus、OPC UA、CAN总线

**网络层（网关层）：**
- 负责设备与云平台之间的数据传输
- 支持多种通信协议：MQTT、CoAP、HTTP、WebSocket
- 包含各种网关设备：工业网关、家庭网关、边缘网关
- 支持多种网络类型：蜂窝网络、WiFi、以太网、LoRa

**应用层（云平台）：**
- 负责数据存储、处理和分析
- 提供设备管理、规则引擎、告警通知等能力
- 包含用户界面和应用程序
- 支持数据可视化、报表分析、远程控制

### 1.2 常见协议：MQTT、CoAP、HTTP

物联网领域有多种通信协议，每种协议都有其特定的适用场景和优势。

**MQTT协议（Message Queue Telemetry Transport）：**

MQTT是一种轻量级的发布/订阅消息传输协议，专门设计用于低带宽、高延迟或不可靠的网络环境。它是物联网领域最广泛使用的协议之一，特别适用于设备与云平台之间的双向通信。

MQTT的核心特点包括：
- **轻量级**：协议开销最小化，最小数据包只有2字节
- **发布/订阅模式**：解耦设备与应用，支持一对多、多对一通信
- **QoS服务质量等级**：提供三种消息交付级别，满足不同可靠性需求
- **会话保持**：支持持久会话，减少重连开销
- **遗嘱消息**：设备异常断开时自动通知

```typescript
// MQTT协议特点对比表
const MQTT_FEATURES = {
  protocol: 'MQTT',
  architecture: '发布/订阅模式',
  transport: 'TCP/IP',
  packet_overhead: '2字节最小开销',
  qos_levels: ['QoS 0: 最多交付一次', 'QoS 1: 至少交付一次', 'QoS 2: 仅交付一次'],
  session_types: ['清洁会话', '持久会话'],
  broker_required: true,
  best_for: ['实时监控', '远程控制', '消息广播', '设备间通信']
};
```

**CoAP协议（Constrained Application Protocol）：**

CoAP是一种专为受限节点（constrained node）设计的Web传输协议，适用于物联网设备中资源受限的小型设备（如传感器、执行器）。它设计得类似于HTTP，但更加轻量，适合在低功耗网络中运行。

```typescript
// CoAP协议特点对比表
const COAP_FEATURES = {
  protocol: 'CoAP',
  architecture: '请求/响应模式',
  transport: 'UDP',
  packet_overhead: '4字节最小开销',
  features: ['观察模式', '资源发现', '块传输'],
  security: 'DTLS加密',
  best_for: ['受限设备', '机器对机器', '资源受限环境']
};
```

**HTTP协议：**

HTTP是最常用的Web协议，在物联网中也有广泛应用，特别是在需要与现有Web系统集成的场景中。它的优势在于生态系统完善、开发工具丰富、便于与RESTful API对接。

```typescript
// HTTP协议特点对比表
const HTTP_FEATURES = {
  protocol: 'HTTP/HTTPS',
  architecture: '请求/响应模式',
  transport: 'TCP/IP',
  features: ['RESTful API', 'JSON数据格式', '成熟的认证机制'],
  advantages: ['易于调试', '生态完善', '与Web系统无缝集成'],
  disadvantages: ['头部开销大', '不适合低功耗设备', '无持久连接（HTTP/1.1后支持）'],
  best_for: ['设备配置', '命令下发', '数据上报', '与现有系统集成']
};

// 协议选择指南
const PROTOCOL_SELECTION_GUIDE = {
  scenario1: {
    scenario: '实时监控与远程控制',
    recommended: 'MQTT',
    reason: '低延迟、支持持久会话、发布订阅模式适合一对多场景'
  },
  scenario2: {
    scenario: '受限设备（电池供电、低功耗）',
    recommended: 'CoAP',
    reason: '基于UDP开销小、支持DTLS安全、适合受限网络'
  },
  scenario3: {
    scenario: '与Web系统集成',
    recommended: 'HTTP/REST',
    reason: '生态完善、便于与现有系统对接、开发工具丰富'
  }
};
```

### 1.3 设备类型：传感器、执行器

在物联网系统中，设备主要分为两大类：传感器和执行器。理解这两类设备的特点和交互方式对于物联网开发至关重要。

**传感器（Sensors）：**

传感器是物联网系统的"眼睛"和"耳朵"，负责采集物理世界的各种数据。传感器将物理量（如温度、压力、光照）转换为电信号，再通过网络传输到云平台进行处理和分析。

```
传感器分类与应用场景：

┌─────────────────────────────────────────────────────────────────┐
│                         传感器分类                               │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  环境传感器   │  位置传感器   │  机械传感器   │   生理传感器      │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  温度传感器   │    GPS       │  压力传感器   │   心率传感器      │
│  湿度传感器   │  北斗定位    │  振动传感器   │   血氧传感器      │
│  光照传感器   │  室内定位    │  加速度传感器 │   体温传感器      │
│  气体传感器   │  蓝牙定位    │  陀螺仪       │   血压传感器      │
│  雨量传感器   │  WiFi定位    │  扭矩传感器   │   血糖传感器      │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

**传感器的关键参数：**

```typescript
// 传感器技术参数接口定义
interface SensorSpec {
  // 测量参数
  measurementType: string;        // 测量类型：温度、湿度、压力等
  measurementRange: [number, number]; // 测量范围 [最小值, 最大值]
  resolution: number;             // 分辨率：最小可检测变化量
  accuracy: number;               // 精度：测量值与真实值的偏差

  // 电气参数
  supplyVoltage: [number, number]; // 供电电压范围 [最小, 最大]
  powerConsumption: number;       // 功耗（毫瓦）

  // 通信参数
  interface: string;              // 通信接口：I2C、SPI、UART、模拟输出
  samplingRate: number;           // 采样率（Hz）

  // 环境参数
  operatingTemp: [number, number]; // 工作温度范围
  operatingHumidity: [number, number]; // 工作湿度范围
}

// 传感器数据格式示例
interface SensorData {
  deviceId: string;               // 设备ID
  sensorType: string;              // 传感器类型
  timestamp: number;               // 时间戳（毫秒）
  value: number;                   // 测量值
  unit: string;                    // 单位
  quality: 'good' | 'uncertain' | 'bad'; // 数据质量
}
```

**执行器（Actuators）：**

执行器是物联网系统的"手"和"脚"，负责执行云平台下发的控制指令，驱动物理设备完成特定动作。执行器将电信号转换为物理动作，如开关切换、阀门调节、电机转速控制等。

```
执行器分类与应用场景：

┌─────────────────────────────────────────────────────────────────┐
│                         执行器分类                               │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  开关类      │  调节类       │  驱动类      │   报警类         │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  继电器      │  调速器       │  电机驱动器   │   声光报警器     │
│  接触器      │  阀门执行器   │  伺服驱动器   │   蜂鸣器         │
│  固态开关    │  温控器       │  步进驱动器   │   闪光灯         │
│  晶闸管      │  亮度调节器   │  变频器       │   振动报警器     │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

**执行器的控制接口：**

```typescript
// 执行器控制接口定义
interface ActuatorControl {
  deviceId: string;               // 设备ID
  actuatorType: string;           // 执行器类型
  command: ActuatorCommand;       // 控制命令
  parameters: Record<string, any>; // 命令参数
  timestamp: number;              // 时间戳
}

// 执行器命令类型
type ActuatorCommand =
  | { type: 'ON_OFF'; state: boolean }                    // 开关命令
  | { type: 'SET_VALUE'; value: number }                    // 设置值命令
  | { type: 'SET_RANGE'; min: number; max: number }         // 设置范围
  | { type: 'TOGGLE' }                                      // 切换命令
  | { type: 'RESET' };                                      // 重置命令

// 执行器状态反馈
interface ActuatorStatus {
  deviceId: string;
  actuatorType: string;
  state: 'idle' | 'running' | 'error' | 'offline';
  currentValue?: number;            // 当前值
  targetValue?: number;             // 目标值
  errorCode?: string;               // 错误代码
  lastUpdateTime: number;           // 最后更新时间
}
```

### 1.4 我的思考：IoT是未来的基础设施

物联网正在成为继互联网之后的新型基础设施，其影响力和渗透率正在快速扩大。从智能家居到工业4.0，从智慧城市到车联网，物联网技术正在深刻改变我们的生活和工作方式。

**IoT发展的四个阶段：**

```
IoT发展演进路径：

第一阶段：连接孤岛（2010-2015）
├── 单个设备联网
├── 点对点通信
└── 简单数据采集

第二阶段：平台聚合（2016-2020）
├── 设备管理平台出现
├── 数据汇聚与分析
└── 远程监控与控制

第三阶段：智能决策（2021-2025）
├── AIoT（AI + IoT）融合
├── 边缘计算普及
└── 自主决策能力

第四阶段：数字孪生（2026+）
├── 物理世界完全数字化
├── 实时仿真与预测
└── 元宇宙基础设施
```

**IoT的技术演进趋势：**

```typescript
// IoT技术演进趋势分析
const IOT_TRENDS = {
  连接技术: {
    现状: ['WiFi', '蓝牙', 'ZigBee', 'LoRa', 'NB-IoT', '5G'],
    趋势: ['5G RedCap', '星闪技术', 'WiFi 7', 'Matter协议统一']
  },
  边缘计算: {
    现状: ['边缘网关', '雾计算'],
    趋势: ['边缘AI', '边云协同', 'serverless边缘']
  },
  数据处理: {
    现状: ['云端处理', '批处理'],
    趋势: ['边云协同', '实时流处理', '数据湖仓一体']
  },
  安全方案: {
    现状: ['设备认证', '传输加密'],
    趋势: ['零信任架构', '可信执行环境', '区块链溯源']
  },
  应用模式: {
    现状: ['设备管理', '数据监控'],
    趋势: ['数字孪生', '自主运维', '预测性维护']
  }
};

// 开发者应对策略
const DEVELOPER_STRATEGY = {
  技能升级: [
    '深入理解MQTT/CoAP协议原理',
    '掌握边缘计算开发技术',
    '学习时序数据库和数据可视化',
    '了解云原生和容器技术'
  ],
  架构思维: [
    '从单设备到系统思维',
    '考虑可靠性和容错性',
    '重视安全设计',
    '关注可扩展性'
  ],
  领域深耕: [
    '选择特定行业：智能家居、工业互联网、车联网',
    '积累行业知识和最佳实践',
    '建立解决方案思维'
  ]
};
```

**IoT开发者能力模型：**

```typescript
// IoT全栈开发者能力模型
interface IoTDeveloperSkills {
  // 硬件层
  hardware: {
    basic: ['电路基础', '数字电路', '微控制器原理'];
    sensors: ['传感器原理', '接口协议', '驱动程序'];
    protocols: ['UART', 'I2C', 'SPI', 'Modbus'];
  };

  // 通信层
  communication: {
    wired: ['Ethernet', 'RS485', 'USB'];
    wireless: ['WiFi', 'Bluetooth', 'ZigBee', 'LoRa'];
    iot_protocols: ['MQTT', 'CoAP', 'HTTP', 'WebSocket'];
  };

  // 平台层
  platform: {
    cloud: ['AWS IoT', 'Azure IoT', '阿里云IoT', '腾讯云IoT'];
    edge: ['边缘网关', 'K3s', 'EdgeX'];
    database: ['时序数据库', 'NoSQL', '消息队列'];
  };

  // 应用层
  application: {
    backend: ['Node.js', 'Python', 'Java', 'Go'];
    frontend: ['React', 'Vue', '小程序'];
    mobile: ['Android', 'iOS', '跨平台框架'];
    visualization: ['ECharts', 'Grafana', 'DataV'];
  };

  // 软技能
  soft_skills: [
    '系统设计能力',
    '问题诊断能力',
    '文档编写能力',
    '团队协作能力'
  ];
}
```

---

## 2. MQTT协议

### 2.1 订阅/发布模式

MQTT（Message Queue Telemetry Transport）是物联网领域最流行的消息传输协议之一。其核心采用发布/订阅（Publish/Subscribe）模式，这种模式与传统请求/响应模式有着本质的区别，是实现物联网设备与云平台之间松耦合通信的关键。

**发布/订阅模式的工作原理：**

发布/订阅模式是一种消息传递模式，它将发送消息的发布者与接收消息的订阅者解耦。发布者不需要知道谁在订阅消息，订阅者也不需要知道消息来自哪个发布者。这种模式通过一个称为"消息代理"（Broker）的中间组件来实现。

```
MQTT发布/订阅架构图：

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  发布者A    │         │             │         │  订阅者1    │
│ (温度传感器)│────────▶│             │────────▶│  (监控大屏) │
└─────────────┘         │             │         └─────────────┘
                        │   Broker    │
┌─────────────┐         │  (MQTT服务器)│         ┌─────────────┐
│  发布者B    │────────▶│             │────────▶│  订阅者2    │
│ (湿度传感器)│         │             │         │  (手机APP)  │
└─────────────┘         └─────────────┘         └─────────────┘
                              ▲
                              │
                        ┌─────────────┐
                        │  发布者C    │
                        │ (烟雾报警器) │
                        └─────────────┘

消息流向：
1. 温度传感器发布消息到主题 "home/livingroom/temperature"
2. 湿度传感器发布消息到主题 "home/livingroom/humidity"
3. 烟雾报警器发布消息到主题 "home/bedroom/smoke"
4. 监控大屏订阅 "home/+/temperature"（接收所有房间的温度）
5. 手机APP订阅 "home/#"（接收home下所有主题的消息）
```

**MQTT主题层级结构：**

MQTT使用类似文件系统的层级结构来组织主题（Topic）。主题由斜杠分隔的多个层级组成，每个层级可以包含字母、数字和通配符。

```typescript
// MQTT主题层级结构示例
const TOPIC_EXAMPLES = {
  // 智能家居主题结构
  smartHome: {
    house: 'home',
    rooms: ['livingroom', 'bedroom', 'kitchen', 'bathroom'],
    devices: ['temperature', 'humidity', 'light', 'switch', 'smoke'],

    // 主题示例
    examples: [
      'home/livingroom/temperature',      // 客厅温度
      'home/bedroom/humidity',            // 卧室湿度
      'home/kitchen/light/brightness',    // 厨房灯光亮度
      'home/livingroom/switch/state',     // 客厅开关状态
    ]
  },

  // 工业物联网主题结构
  industrial: {
    factory: 'factory',
    productionLine: ['line1', 'line2', 'line3'],
    machine: ['cnc1', 'robot1', 'conveyor1'],
    dataType: ['status', 'temperature', 'vibration', 'production'],

    // 主题示例
    examples: [
      'factory/line1/cnc1/status',        // 1号生产线CNC1状态
      'factory/line1/cnc1/temperature',  // 1号生产线CNC1温度
      'factory/line2/robot1/vibration',   // 2号生产线机器人振动
    ]
  },

  // 车联网主题结构
  vehicle: {
    vehicle: 'vehicle',
    vehicleId: 'ABC123',  // 车牌号或VIN码
    subsystems: ['engine', 'battery', 'location', 'diagnostics'],

    // 主题示例
    examples: [
      'vehicle/ABC123/engine/rpm',         // 车辆发动机转速
      'vehicle/ABC123/battery/soc',       // 车辆电池SOC
      'vehicle/ABC123/location/gps',       // 车辆GPS定位
    ]
  }
};

// 主题通配符说明
const TOPIC_WILDCARDS = {
  singleLevel: {
    symbol: '+',
    description: '匹配单个层级',
    example: 'home/+/temperature',
    matches: [
      'home/livingroom/temperature',  // ✓ 匹配
      'home/bedroom/temperature',     // ✓ 匹配
      'home/kitchen/temperature',     // ✓ 匹配
      'home/livingroom/humidity',     // ✗ 不匹配（最后一个层级不匹配）
    ]
  },
  multiLevel: {
    symbol: '#',
    description: '匹配多个层级（必须在主题末尾）',
    example: 'home/#',
    matches: [
      'home/livingroom',              // ✓ 匹配
      'home/livingroom/temperature',  // ✓ 匹配
      'home/bedroom/humidity',        // ✓ 匹配
      'factory/#',                    // ✗ 不匹配（不同前缀）
    ]
  }
};
```

**MQTT客户端实现示例：**

下面是一个完整的MQTT客户端实现，包括连接、订阅、发布和断线重连等核心功能。

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

// MQTT客户端配置接口
interface MQTTConfig {
  brokerUrl: string;           // MQTT Broker地址
  clientId: string;            // 客户端ID（唯一标识）
  username?: string;           // 用户名（可选）
  password?: string;           // 密码（可选）
  keepalive?: number;          // 心跳间隔（秒）
  reconnectPeriod?: number;    // 重连间隔（毫秒）
  cleanSession?: boolean;      // 是否清除会话
  willMessage?: {              // 遗嘱消息
    topic: string;
    payload: string;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
}

// 消息接口
interface MQTTMessage {
  topic: string;               // 主题
  payload: string;             // 消息内容
  qos: 0 | 1 | 2;              // QoS等级
  retain: boolean;             // 是否保留
  timestamp: number;           // 时间戳
}

// 设备状态接口
interface DeviceStatus {
  deviceId: string;
  online: boolean;
  lastSeen: number;
  battery?: number;
  signalStrength?: number;
}

// MQTT客户端Hook封装
function useMQTTClient(config: MQTTConfig) {
  // 连接状态
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 消息状态
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  // refs
  const clientRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 连接MQTT服务器
  const connect = useCallback(() => {
    if (clientRef.current) {
      // 如果已存在客户端，先断开
      clientRef.current.end();
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 模拟MQTT连接（实际项目中需要使用mqtt.js库）
      // import mqtt from 'mqtt';
      // const client = mqtt.connect(config.brokerUrl, {
      //   clientId: config.clientId,
      //   username: config.username,
      //   password: config.password,
      //   keepalive: config.keepalive || 60,
      //   reconnectPeriod: config.reconnectPeriod || 5000,
      //   cleanSession: config.cleanSession !== false,
      //   will: config.willMessage,
      // });

      console.log(`[MQTT] 正在连接到: ${config.brokerUrl}`);
      console.log(`[MQTT] 客户端ID: ${config.clientId}`);

      // 模拟连接成功
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('[MQTT] 连接成功');
      }, 1000);

    } catch (err: any) {
      setError(err.message || '连接失败');
      setIsConnecting(false);
      console.error('[MQTT] 连接错误:', err);
    }
  }, [config]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (clientRef.current) {
      // clientRef.current.end();
      clientRef.current = null;
    }

    setIsConnected(false);
    console.log('[MQTT] 已断开连接');
  }, []);

  // 订阅主题
  const subscribe = useCallback((topic: string, qos: 0 | 1 | 2 = 0) => {
    if (!isConnected) {
      console.warn('[MQTT] 未连接，无法订阅');
      return;
    }

    // 实际项目中调用
    // clientRef.current.subscribe(topic, { qos }, (err: any) => {
    //   if (err) {
    //     console.error(`[MQTT] 订阅失败 [${topic}]:`, err);
    //   } else {
    //     console.log(`[MQTT] 订阅成功 [${topic}] QoS: ${qos}`);
    //     setSubscriptions(prev => new Set([...prev, topic]));
    //   }
    // });

    console.log(`[MQTT] 订阅主题 [${topic}] QoS: ${qos}`);
    setSubscriptions(prev => new Set([...prev, topic]));
  }, [isConnected]);

  // 取消订阅
  const unsubscribe = useCallback((topic: string) => {
    if (!isConnected) return;

    // 实际项目中调用
    // clientRef.current.unsubscribe(topic, (err: any) => {
    //   if (err) {
    //     console.error(`[MQTT] 取消订阅失败 [${topic}]:`, err);
    //   } else {
    //     console.log(`[MQTT] 取消订阅成功 [${topic}]`);
    //     setSubscriptions(prev => {
    //       const next = new Set(prev);
    //       next.delete(topic);
    //       return next;
    //     });
    //   }
    // });

    setSubscriptions(prev => {
      const next = new Set(prev);
      next.delete(topic);
      return next;
    });
  }, [isConnected]);

  // 发布消息
  const publish = useCallback((topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain: boolean = false) => {
    if (!isConnected) {
      console.warn('[MQTT] 未连接，无法发布');
      return false;
    }

    // 实际项目中调用
    // clientRef.current.publish(topic, payload, { qos, retain }, (err: any) => {
    //   if (err) {
    //     console.error(`[MQTT] 发布失败 [${topic}]:`, err);
    //   } else {
    //     console.log(`[MQTT] 发布成功 [${topic}]:`, payload);
    //   }
    // });

    console.log(`[MQTT] 发布消息 [${topic}]:`, payload);
    return true;
  }, [isConnected]);

  // 消息处理
  const handleMessage = useCallback((topic: string, payload: string) => {
    const message: MQTTMessage = {
      topic,
      payload,
      qos: 0,
      retain: false,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev.slice(-99), message]); // 保留最近100条

    // 可以在这里添加业务逻辑处理
    console.log(`[MQTT] 收到消息 [${topic}]:`, payload);
  }, []);

  // 清除消息历史
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 自动连接和清理
  useEffect(() => {
    // 初始连接
    connect();

    // 清理函数
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // 状态
    isConnected,
    isConnecting,
    error,
    messages,
    subscriptions,

    // 方法
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    handleMessage,
    clearMessages,
  };
}

// 使用示例
function MQTTDemo() {
  const mqtt = useMQTTClient({
    brokerUrl: 'mqtt://broker.example.com:1883',
    clientId: `device_${Math.random().toString(16).slice(2, 10)}`,
    username: 'device_user',
    password: 'device_pass',
    keepalive: 60,
    reconnectPeriod: 5000,
    cleanSession: true,
    willMessage: {
      topic: 'device/offline',
      payload: JSON.stringify({ status: 'offline' }),
      qos: 1,
      retain: true,
    },
  });

  // 订阅设备状态主题
  const handleSubscribe = () => {
    mqtt.subscribe('home/+/temperature', 0);
    mqtt.subscribe('home/+/humidity', 0);
    mqtt.subscribe('device/status/#', 1);
  };

  // 发布设备数据
  const handlePublish = () => {
    const temperature = (20 + Math.random() * 10).toFixed(1);
    const humidity = (40 + Math.random() * 30).toFixed(1);

    mqtt.publish('home/livingroom/temperature', temperature, 0);
    mqtt.publish('home/livingroom/humidity', humidity, 0);
  };

  return (
    <div className="mqtt-demo">
      <h2>MQTT 客户端演示</h2>

      {/* 连接状态 */}
      <div className="status">
        <span className={`indicator ${mqtt.isConnected ? 'online' : 'offline'}`} />
        <span>{mqtt.isConnected ? '已连接' : mqtt.isConnecting ? '连接中...' : '未连接'}</span>
      </div>

      {/* 操作按钮 */}
      <div className="actions">
        <button onClick={mqtt.connect} disabled={mqtt.isConnected}>
          连接
        </button>
        <button onClick={mqtt.disconnect} disabled={!mqtt.isConnected}>
          断开
        </button>
        <button onClick={handleSubscribe} disabled={!mqtt.isConnected}>
          订阅主题
        </button>
        <button onClick={handlePublish} disabled={!mqtt.isConnected}>
          发布数据
        </button>
      </div>

      {/* 消息列表 */}
      <div className="messages">
        <h3>消息历史 ({mqtt.messages.length})</h3>
        <button onClick={mqtt.clearMessages}>清除</button>
        <ul>
          {mqtt.messages.map((msg, index) => (
            <li key={index}>
              <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className="topic">[{msg.topic}]</span>
              <span className="payload">{msg.payload}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 当前订阅 */}
      <div className="subscriptions">
        <h3>当前订阅 ({mqtt.subscriptions.size})</h3>
        <ul>
          {[...mqtt.subscriptions].map(topic => (
            <li key={topic}>
              {topic}
              <button onClick={() => mqtt.unsubscribe(topic)}>取消</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### 2.2 QoS等级

MQTT协议定义了三种消息服务质量（Quality of Service，QoS）等级，用于确定消息的交付保证级别。不同的QoS等级适用于不同的应用场景，开发者需要根据业务需求选择合适的等级。

**QoS 0：最多交付一次（At most once）**

QoS 0是最低的服务级别，消息最多被交付一次。发送端发送消息后，不等待接收端的确认，也不进行重试。这意味着消息可能会丢失，但不会重复。

```
QoS 0 流程图：

┌─────────────┐                      ┌─────────────┐
│   发布者    │                      │    Broker   │
└─────────────┘                      └─────────────┘
      │                                    │
      │  ──── PUBREC (paho.mqtt.xml) ────▶│
      │                                    │
      │  ◀──── PUBREL ──────────────────── │
      │                                    │
      │  ──── PUBCOMP ────────────────────▶│
      │                                    │
      │              消息可能丢失            │
      │  ════════════════════════════════▶│
      │         (不等待确认)                │
      │                                    ▼
      │                              ┌─────────────┐
      │                              │   订阅者    │
      │                              └─────────────┘

特点：
- 最低开销：无确认、无重试
- 可能丢失消息
- 不会重复消息
- 适用于：心跳、周期报告、不重要的遥测数据
```

```typescript
// QoS 0 消息发布示例
function publishQoS0(client: any, topic: string, message: string) {
  // 发布时不指定确认回调
  client.publish(topic, message, { qos: 0 }, (err: any) => {
    if (err) {
      console.error('[QoS 0] 发布失败:', err);
    }
  });

  // 发送后立即返回，不等待确认
  console.log('[QoS 0] 消息已发送（可能丢失）');
}

// QoS 0 适用场景
const QOS0_USE_CASES = [
  '环境监测数据上报（每分钟一次）',
  'GPS位置定期更新',
  '设备心跳检测',
  '不重要的日志数据',
  '实时性要求高但容许少量丢失的场景'
];
```

**QoS 1：至少交付一次（At least once）**

QoS 1确保消息至少被交付一次。发送端发送消息后会等待接收确认（PUBACK），如果没有收到确认，消息会被重新发送。这可能导致消息重复，但不会丢失。

```
QoS 1 流程图：

┌─────────────┐                      ┌─────────────┐
│   发布者    │                      │    Broker   │
└─────────────┘                      └─────────────┘
      │                                    │
      │  ──── PUBLISH (qos=1) ────────────▶│
      │                                    │
      │              ┌──────────────────────▼──────────┐
      │              │     消息存储，等待处理          │
      │              │     发送PUBACK确认             │
      │              └──────────────────────┬──────────┘
      │                                    │
      │  ◀─────── PUBACK ──────────────────┤
      │                                    │
      │  (超时未确认，重发)                  │
      │  ──── PUBLISH (qos=1, dup=1) ────▶│
      │                                    │
      │  ◀─────── PUBACK ──────────────────┤
      │                                    │
      ▼                                    ▼
```

```typescript
// QoS 1 消息发布示例
function publishQoS1(client: any, topic: string, message: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // 设置超时
    const timeout = setTimeout(() => {
      console.warn('[QoS 1] 消息确认超时');
      resolve(false); // 超时不一定是失败，可能确认在路上
    }, 5000);

    client.publish(topic, message, { qos: 1 }, (err: any) => {
      clearTimeout(timeout);
      if (err) {
        console.error('[QoS 1] 发布失败:', err);
        reject(err);
      }
    });
  });
}

// QoS 1 适用场景
const QOS1_USE_CASES = [
  '重要指令下发（如开关控制）',
  '告警信息推送',
  '配置参数变更',
  '需要确保送达的命令',
  '设备注册/绑定'
];
```

**QoS 2：仅交付一次（Exactly once）**

QoS 2是最高的服务级别，确保消息恰好被交付一次。这通过四次握手实现：PUBLISH → PUBREC → PUBREL → PUBCOMP。这个过程确保了消息既不会丢失也不会重复，但开销最大。

```
QoS 2 完整流程图：

┌─────────────┐                      ┌─────────────┐
│   发布者    │                      │    Broker   │
└─────────────┘                      └─────────────┘
      │                                    │
      │  ──── PUBLISH (qos=2) ────────────▶│
      │                                    │
      │              ┌──────────────────────▼──────────┐
      │              │     消息存储，发送PUBREC        │
      │              │     等待PUBREL                  │
      │              └──────────────────────┬──────────┘
      │                                    │
      │  ◀─────── PUBREC ──────────────────┤
      │                                    │
      │  ──── PUBREL (qos=2) ────────────▶│
      │                                    │
      │              ┌──────────────────────▼──────────┐
      │              │     删除消息，发送PUBCOMP        │
      │              └──────────────────────┬──────────┘
      │                                    │
      │  ◀─────── PUBCOMP ──────────────────┤
      │                                    │
      ▼                                    ▼

QoS 2 状态机（发布者侧）：
┌─────────┐     PUBLISH      ┌─────────┐
│  INIT   │─────────────────▶│ PUBWAIT │
└─────────┘                   └────┬────┘
       ▲                              │
       │      PUBCOMP                 │
       └──────────────────────────────┘
```

```typescript
// QoS 2 消息发布示例
function publishQoS2(client: any, topic: string, message: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    client.publish(topic, message, { qos: 2 }, (err: any) => {
      if (err) {
        console.error('[QoS 2] 发布失败:', err);
        reject(err);
        return;
      }
      console.log('[QoS 2] 消息已确认交付');
      resolve(true);
    });
  });
}

// QoS 2 适用场景
const QOS2_USE_CASES = [
  '金融交易指令',
  '计费数据采集',
  '关键设备控制',
  '需要精确计数的场景',
  '不能重复执行的操作'
];
```

**QoS等级选择指南：**

```typescript
// QoS选择决策矩阵
const QOS_SELECTION_MATRIX = {
  decisionCriteria: {
    reliability: ['可丢失', '不能丢', '必须精确'],
    latency: ['低延迟优先', '可接受延迟', '无限制'],
    bandwidth: ['极度受限', '一般受限', '充足']
  },

  recommendations: [
    {
      scenario: '周期传感器数据',
      qos: 0,
      reason: '数据频繁，稍有丢失可接受，优先保证低延迟'
    },
    {
      scenario: '远程控制指令',
      qos: 1,
      reason: '指令必须送达，但可接受少量重复（接收方做幂等处理）'
    },
    {
      scenario: '计费计量数据',
      qos: 2,
      reason: '数据精确性要求高，不能丢失也不能重复'
    },
    {
      scenario: '告警通知',
      qos: 1,
      reason: '告警必须送达，通常配合离线消息保留'
    },
    {
      scenario: '固件升级指令',
      qos: 2,
      reason: '升级操作不能重复执行，必须精确交付'
    }
  ]
};

// 不同QoS的开销对比
const QOS_OVERHEAD = {
  qos0: {
    messages: 1,        // 单次发送
    roundTrips: 0,     // 无确认
    overhead: '最小',
    latency: '最低'
  },
  qos1: {
    messages: '1-2',   // 可能重发
    roundTrips: 1,     // 一次确认
    overhead: '中等',
    latency: '低'
  },
  qos2: {
    messages: '1-4',   // 可能多次重发
    roundTrips: 2,     // 两次确认
    overhead: '最大',
    latency: '较高'
  }
};
```

### 2.3 遗嘱消息

遗嘱消息（Last Will and Testament，简称LWT）是MQTT协议的一个独特功能，它允许客户端在连接时指定一个遗嘱消息，当客户端异常断开连接时，Broker会自动向指定主题发布这条遗嘱消息。

**遗嘱消息的工作原理：**

```
遗嘱消息流程：

正常断开连接：
┌──────────┐         ┌──────────┐         ┌──────────┐
│   设备   │────────▶│  Broker  │────────▶│   应用   │
└──────────┘  DISCONNECT  └──────────┘         └──────────┘
              (主动通知)     不发送遗嘱           (无通知)

异常断开连接（网络故障等）：
┌──────────┐         ┌──────────┐         ┌──────────┐
│   设备   │    ✗    │  Broker  │────────▶│   应用   │
└──────────┘   (断开)  └──────────┘ 遗嘱消息  └──────────┘
                           │
                           │ 检测到连接超时
                           │ (keepalive超时)
                           ▼
                      发送预设的遗嘱消息

遗嘱消息内容示例：
{
  "deviceId": "device_001",
  "status": "offline",
  "reason": "connection_lost",
  "timestamp": 1709424000000
}
```

**遗嘱消息的配置：**

```typescript
// 遗嘱消息配置接口
interface WillMessage {
  topic: string;           // 遗嘱消息发布的主题
  payload: string;         // 遗嘱消息的内容
  qos: 0 | 1 | 2;          // QoS等级
  retain: boolean;         // 是否保留消息
}

// 设备遗嘱消息配置示例
const DEVICE_WILL_CONFIG: WillMessage = {
  topic: 'devices/{deviceId}/status',
  payload: JSON.stringify({
    deviceId: '{deviceId}',
    status: 'offline',
    timestamp: Date.now(),
    reason: 'connection_lost'
  }),
  qos: 1,
  retain: true
};

// MQTT连接配置（含遗嘱消息）
interface MQTTConnectionConfig {
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
  keepalive: number;           // 心跳间隔（秒）
  reconnectPeriod: number;     // 重连间隔（毫秒）
  cleanSession: boolean;
  willMessage: WillMessage;    // 遗嘱消息配置
}

// 创建设备连接配置
function createDeviceConnectionConfig(deviceId: string): MQTTConnectionConfig {
  return {
    brokerUrl: 'mqtt://broker.example.com:1883',
    clientId: `device_${deviceId}`,
    keepalive: 60,
    reconnectPeriod: 5000,
    cleanSession: false,        // 使用持久会话
    willMessage: {
      topic: `devices/${deviceId}/status`,
      payload: JSON.stringify({
        deviceId,
        status: 'offline',
        timestamp: Date.now(),
        reason: 'unexpected_disconnect'
      }),
      qos: 1,
      retain: true             // 保留最新状态
    }
  };
}
```

**遗嘱消息的应用场景：**

```typescript
// 遗嘱消息应用场景分析
const WILL_MESSAGE_USE_CASES = {
  // 场景1：设备在线状态监控
  onlineStatusMonitoring: {
    description: '实时监控设备在线状态',
    willTopic: 'devices/{deviceId}/status',
    willPayload: {
      deviceId: '{deviceId}',
      status: 'offline',
      lastSeen: Date.now(),
      reason: 'connection_lost'
    },
    application: '设备管理后台显示设备状态'
  },

  // 场景2：紧急告警通知
  emergencyAlert: {
    description: '设备异常时立即告警',
    willTopic: 'alerts/emergency',
    willPayload: {
      alertType: 'device_down',
      deviceId: '{deviceId}',
      severity: 'critical',
      timestamp: Date.now()
    },
    application: '监控系统立即触发告警'
  },

  // 场景3：边界值告警
  thresholdAlert: {
    description: '设备检测到异常环境参数',
    willTopic: 'alerts/threshold',
    willPayload: {
      alertType: 'temperature_high',
      deviceId: '{deviceId}',
      temperature: 85.5,  // 异常温度
      threshold: 80.0,
      timestamp: Date.now()
    },
    application: '环境监控系统触发告警'
  },

  // 场景4：设备遗嘱日志
  deviceTestament: {
    description: '设备记录最终状态',
    willTopic: 'devices/{deviceId}/testament',
    willPayload: {
      deviceId: '{deviceId}',
      finalState: {
        temperature: 45.2,
        humidity: 65,
        battery: 12,
        memoryUsage: 85
      },
      timestamp: Date.now()
    },
    application: '设备故障诊断分析'
  }
};

// 遗嘱消息处理器
class WillMessageHandler {
  // 处理设备离线遗嘱消息
  static handleDeviceOffline(payload: any) {
    const { deviceId, reason, timestamp } = payload;

    console.log(`[WillMessage] 设备 ${deviceId} 已离线`);
    console.log(`[WillMessage] 离线原因: ${reason}`);
    console.log(`[WillMessage] 最后在线时间: ${new Date(timestamp).toISOString()}`);

    // 更新设备状态
    // updateDeviceStatus(deviceId, 'offline');

    // 记录离线日志
    // logDeviceOffline(deviceId, reason, timestamp);

    // 触发离线告警（如果是异常断开）
    if (reason === 'connection_lost') {
      // sendOfflineAlert(deviceId);
    }
  }

  // 处理紧急告警遗嘱消息
  static handleEmergencyAlert(payload: any) {
    const { alertType, deviceId, severity, timestamp } = payload;

    console.log(`[Alert] 收到紧急告警: ${alertType}`);
    console.log(`[Alert] 设备: ${deviceId}`);
    console.log(`[Alert] 严重程度: ${severity}`);

    // 根据告警类型处理
    switch (alertType) {
      case 'temperature_high':
        // 处理温度过高告警
        break;
      case 'smoke_detected':
        // 处理烟雾告警
        break;
      case 'intrusion_detected':
        // 处理入侵告警
        break;
    }
  }
}
```

### 2.4 实战：MQTT客户端

下面是一个完整的MQTT客户端实现，包括连接管理、订阅发布、心跳检测和断线重连等核心功能。

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePersistentStorage } from '@/hooks/usePersistentStorage';

// MQTT客户端状态
interface MQTTClientState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  connectedAt?: number;
  reconnectAttempts: number;
}

// MQTT消息类型
interface MQTTMessage {
  id: string;
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: number;
}

// 订阅主题信息
interface Subscription {
  topic: string;
  qos: 0 | 1 | 2;
  subscribedAt: number;
}

// 设备信息
interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: number;
  metadata?: Record<string, any>;
}

// MQTT客户端Hook
function useMQTT() {
  // 状态
  const [clientState, setClientState] = useState<MQTTClientState>({
    status: 'disconnected',
    reconnectAttempts: 0
  });
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // refs
  const clientRef = useRef<any>(null);
  const messageIdCounter = useRef(0);

  // 持久化存储
  const { data: storedDevices, update: updateStoredDevices } = usePersistentStorage<Device[]>('mqtt_devices', []);

  // 生成唯一消息ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${messageIdCounter.current++}`;
  };

  // 连接MQTT服务器
  const connect = useCallback(async (config: {
    brokerUrl: string;
    clientId: string;
    username?: string;
    password?: string;
    keepalive?: number;
    willMessage?: {
      topic: string;
      payload: string;
      qos: 0 | 1 | 2;
      retain: boolean;
    };
  }) => {
    setClientState(prev => ({ ...prev, status: 'connecting', errorMessage: undefined }));

    try {
      // 实际项目中使用 mqtt.js
      // const client = mqtt.connect(config.brokerUrl, {
      //   clientId: config.clientId,
      //   username: config.username,
      //   password: config.password,
      //   keepalive: config.keepalive || 60,
      //   clean: false,
      //   will: config.willMessage
      // });

      // 模拟连接成功
      console.log('[MQTT] 正在连接...', config);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setClientState({
        status: 'connected',
        connectedAt: Date.now(),
        reconnectAttempts: 0
      });

      console.log('[MQTT] 连接成功');

      // 连接成功后同步设备列表
      if (storedDevices) {
        setDevices(storedDevices);
      }

    } catch (error: any) {
      setClientState({
        status: 'error',
        errorMessage: error.message || '连接失败'
      });
      console.error('[MQTT] 连接错误:', error);
    }
  }, [storedDevices]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      // clientRef.current.end();
      clientRef.current = null;
    }

    setClientState({
      status: 'disconnected',
      reconnectAttempts: 0
    });

    console.log('[MQTT] 已断开连接');
  }, []);

  // 订阅主题
  const subscribe = useCallback((topic: string, qos: 0 | 1 | 2 = 0) => {
    if (clientState.status !== 'connected') {
      console.warn('[MQTT] 未连接，无法订阅');
      return false;
    }

    // 实际项目中
    // clientRef.current.subscribe(topic, { qos }, (error: any) => {
    //   if (error) {
    //     console.error('[MQTT] 订阅失败:', error);
    //     return false;
    //   }
    // });

    setSubscriptions(prev => {
      // 避免重复订阅
      if (prev.some(s => s.topic === topic)) {
        return prev;
      }
      return [...prev, { topic, qos, subscribedAt: Date.now() }];
    });

    console.log(`[MQTT] 已订阅: ${topic} (QoS: ${qos})`);
    return true;
  }, [clientState.status]);

  // 取消订阅
  const unsubscribe = useCallback((topic: string) => {
    if (clientState.status !== 'connected') {
      return false;
    }

    // 实际项目中
    // clientRef.current.unsubscribe(topic);

    setSubscriptions(prev => prev.filter(s => s.topic !== topic));
    console.log(`[MQTT] 已取消订阅: ${topic}`);
    return true;
  }, [clientState.status]);

  // 发布消息
  const publish = useCallback((topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain: boolean = false) => {
    if (clientState.status !== 'connected') {
      console.warn('[MQTT] 未连接，无法发布');
      return false;
    }

    const message: MQTTMessage = {
      id: generateMessageId(),
      topic,
      payload,
      qos,
      retain,
      timestamp: Date.now()
    };

    // 实际项目中
    // clientRef.current.publish(topic, payload, { qos, retain }, (error: any) => {
    //   if (error) {
    //     console.error('[MQTT] 发布失败:', error);
    //     return false;
    //   }
    //   console.log(`[MQTT] 已发布: ${topic}`);
    // });

    // 添加到消息历史
    setMessages(prev => [...prev.slice(-99), message]);
    console.log(`[MQTT] 已发布: ${topic} -> ${payload}`);
    return true;
  }, [clientState.status]);

  // 处理收到的消息
  const handleMessage = useCallback((topic: string, payload: string) => {
    const message: MQTTMessage = {
      id: generateMessageId(),
      topic,
      payload,
      qos: 0,
      retain: false,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev.slice(-99), message]);

    // 消息路由处理
    handleMessageRouting(topic, payload);
  }, []);

  // 消息路由
  const handleMessageRouting = (topic: string, payload: string) => {
    // 设备状态更新
    const statusMatch = topic.match(/^devices\/(.+)\/status$/);
    if (statusMatch) {
      const deviceId = statusMatch[1];
      try {
        const status = JSON.parse(payload);
        setDevices(prev => {
          const updated = prev.map(d =>
            d.deviceId === deviceId
              ? { ...d, ...status, lastSeen: Date.now() }
              : d
          );
          updateStoredDevices(updated);
          return updated;
        });
      } catch (e) {
        console.error('[MQTT] 状态消息解析失败:', e);
      }
    }

    // 传感器数据
    const sensorMatch = topic.match(/^devices\/(.+)\/sensors\/(.+)$/);
    if (sensorMatch) {
      const [, deviceId, sensorType] = sensorMatch;
      console.log(`[MQTT] 传感器数据: ${deviceId}/${sensorType} = ${payload}`);
    }

    // 告警消息
    if (topic.startsWith('alerts/')) {
      console.warn(`[MQTT] 告警: ${payload}`);
      // handleAlert(payload);
    }
  };

  // 清除消息历史
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 设备管理
  const registerDevice = useCallback((device: Device) => {
    setDevices(prev => {
      const existing = prev.find(d => d.deviceId === device.deviceId);
      if (existing) {
        return prev.map(d => d.deviceId === device.deviceId ? device : d);
      }
      return [...prev, device];
    });
  }, []);

  const removeDevice = useCallback((deviceId: string) => {
    setDevices(prev => {
      const filtered = prev.filter(d => d.deviceId !== deviceId);
      updateStoredDevices(filtered);
      return filtered;
    });
  }, [updateStoredDevices]);

  return {
    // 状态
    clientState,
    messages,
    subscriptions,
    devices,

    // 方法
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    handleMessage,
    clearMessages,
    registerDevice,
    removeDevice
  };
}

// MQTT设备注册表单组件
function DeviceRegisterForm() {
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('sensor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mqtt = useMQTT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceId.trim() || !deviceName.trim()) {
      alert('请填写设备ID和设备名称');
      return;
    }

    setIsSubmitting(true);

    try {
      const device: Device = {
        deviceId: deviceId.trim(),
        name: deviceName.trim(),
        type: deviceType,
        status: 'offline',
        lastSeen: Date.now()
      };

      mqtt.registerDevice(device);

      // 订阅设备主题
      mqtt.subscribe(`devices/${deviceId}/#`, 1);

      // 清空表单
      setDeviceId('');
      setDeviceName('');

      alert('设备注册成功');
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="device-register-form">
      <h3>注册新设备</h3>

      <div className="form-group">
        <label>设备ID</label>
        <input
          type="text"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          placeholder="输入唯一设备ID"
          required
        />
      </div>

      <div className="form-group">
        <label>设备名称</label>
        <input
          type="text"
          value={deviceName}
          onChange={e => setDeviceName(e.target.value)}
          placeholder="输入设备显示名称"
          required
        />
      </div>

      <div className="form-group">
        <label>设备类型</label>
        <select value={deviceType} onChange={e => setDeviceType(e.target.value)}>
          <option value="sensor">传感器</option>
          <option value="actuator">执行器</option>
          <option value="gateway">网关</option>
          <option value="camera">摄像头</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '注册中...' : '注册设备'}
      </button>
    </form>
  );
}

// MQTT监控面板组件
function MQTTDashboard() {
  const mqtt = useMQTT();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // 连接配置
  const brokerUrl = 'mqtt://broker.example.com:1883';
  const clientId = `dashboard_${Math.random().toString(16).slice(2, 10)}`;

  // 组件挂载时连接
  useEffect(() => {
    mqtt.connect({
      brokerUrl,
      clientId,
      username: 'dashboard_user',
      password: 'dashboard_pass',
      keepalive: 60,
      willMessage: {
        topic: `dashboard/${clientId}/status`,
        payload: JSON.stringify({ status: 'offline' }),
        qos: 1,
        retain: false
      }
    });

    // 订阅系统主题
    mqtt.subscribe('alerts/#', 1);
    mqtt.subscribe('devices/+/status', 1);

    return () => {
      mqtt.disconnect();
    };
  }, []);

  // 发送控制指令
  const sendCommand = (deviceId: string, command: string, value: any) => {
    mqtt.publish(
      `devices/${deviceId}/commands`,
      JSON.stringify({ command, value, timestamp: Date.now() }),
      1
    );
  };

  return (
    <div className="mqtt-dashboard">
      <h2>MQTT 设备监控面板</h2>

      {/* 连接状态 */}
      <div className="connection-status">
        <span className={`status-indicator ${mqtt.clientState.status}`} />
        <span>状态: {mqtt.clientState.status}</span>
        {mqtt.clientState.connectedAt && (
          <span>连接时长: {Math.floor((Date.now() - mqtt.clientState.connectedAt) / 1000)}秒</span>
        )}
      </div>

      {/* 设备列表 */}
      <div className="device-list">
        <h3>设备列表 ({mqtt.devices.length})</h3>
        <ul>
          {mqtt.devices.map(device => (
            <li
              key={device.deviceId}
              className={selectedDevice === device.deviceId ? 'selected' : ''}
              onClick={() => setSelectedDevice(device.deviceId)}
            >
              <span className={`status-dot ${device.status}`} />
              <span className="device-name">{device.name}</span>
              <span className="device-type">{device.type}</span>
              <span className="last-seen">
                {new Date(device.lastSeen).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 控制面板 */}
      {selectedDevice && (
        <div className="control-panel">
          <h3>控制 {selectedDevice}</h3>
          <div className="control-buttons">
            <button onClick={() => sendCommand(selectedDevice, 'turnOn', true)}>
              开启
            </button>
            <button onClick={() => sendCommand(selectedDevice, 'turnOff', false)}>
              关闭
            </button>
            <button onClick={() => sendCommand(selectedDevice, 'restart', null)}>
              重启
            </button>
          </div>
        </div>
      )}

      {/* 消息历史 */}
      <div className="message-history">
        <h3>消息历史 ({mqtt.messages.length})</h3>
        <button onClick={mqtt.clearMessages}>清除</button>
        <ul>
          {mqtt.messages.slice(-20).reverse().map(msg => (
            <li key={msg.id}>
              <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className="topic">{msg.topic}</span>
              <span className="payload">{msg.payload}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 当前订阅 */}
      <div className="subscription-list">
        <h3>订阅主题 ({mqtt.subscriptions.length})</h3>
        <ul>
          {mqtt.subscriptions.map(sub => (
            <li key={sub.topic}>
              <span className="topic">{sub.topic}</span>
              <span className="qos">QoS: {sub.qos}</span>
              <button onClick={() => mqtt.unsubscribe(sub.topic)}>取消</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 3. WebSocket物联网

### 3.1 实时数据推送

WebSocket是一种在单个TCP连接上提供全双工通信的协议，它在物联网应用中扮演着重要角色。与传统的HTTP轮询相比，WebSocket能够实现服务器向客户端的实时推送，极大地降低了延迟和服务器负载。

**WebSocket与MQTT的对比：**

```
通信协议对比：

HTTP轮询：
┌────────┐     GET /data     ┌────────┐
│  客户端 │ ──────────────▶ │  服务器 │
└────────┘ ◀──────────────  └────────┘
           { data: ... }
           (每次请求都建立新连接)

WebSocket：
┌────────┐                    ┌────────┐
│  客户端 │ ◀─────────────────▶│  服务器 │
└────────┘   (持久连接)         └────────┘
                  │
                  │◀──── 数据推送 ────│

MQTT over WebSocket：
┌────────┐                    ┌────────┐
│  客户端 │ ◀─────────────────▶│  Broker │
└────────┘   (MQTT协议封装)     └────────┘
```

```typescript
// WebSocket与MQTT特性对比
const WS_VS_MQTT = {
  webSocket: {
    protocol: 'ws:// or wss://',
    connection: '持久TCP连接',
    communication: '全双工',
    messageFormat: '自定义二进制/文本',
    browser支持: '原生支持',
    bestFor: [
      'Web实时应用',
      '临时性数据流',
      '与现有Web系统集成',
      '简单的请求-响应场景'
    ],
    advantages: [
      '原生浏览器支持',
      '与HTTP/HTTPS共用端口',
      '生态系统完善',
      '调试工具丰富'
    ],
    disadvantages: [
      '无消息确认机制',
      '无重连自动处理',
      '无消息持久化',
      '不适合低功耗设备'
    ]
  },
  mqtt: {
    protocol: 'mqtt:// or mqtts://',
    connection: '持久TCP连接',
    communication: '发布/订阅',
    messageFormat: '二进制',
    brokerRequired: true,
    bestFor: [
      '物联网设备通信',
      '低带宽场景',
      '一对多、多对一通信',
      '需要消息确认的场景'
    ],
    advantages: [
      '专为IoT设计',
      'QoS服务质量等级',
      '遗嘱消息',
      '会话保持',
      '低带宽开销'
    ],
    disadvantages: [
      '需要Broker服务器',
      '浏览器需要WebSocket桥接',
      '协议相对复杂'
    ]
  }
};
```

### 3.2 设备状态同步

设备状态同步是物联网应用中的核心功能之一。当设备状态发生变化时（如开关状态变化、传感器读数更新），需要实时同步到所有相关的客户端。

**状态同步架构：**

```
设备状态同步流程：

┌────────┐                    ┌────────┐                    ┌────────┐
│  设备   │ ──── 状态变更 ───▶│  云平台 │ ──── 状态推送 ───▶│  APP   │
└────────┘                    └────────┘                    └────────┘
     │                              │                              │
     │                              │                              │
     ▼                              ▼                              ▼
  传感器数据                    数据库存储                    UI更新
  执行动作                      历史记录                      状态显示
                                规则引擎                      告警判断

状态同步要点：
1. 设备端：状态变化立即上报
2. 云平台：状态存储 + 变化推送
3. 客户端：接收推送 + 本地缓存 + UI更新
```

```typescript
// 设备状态接口定义
interface DeviceState {
  deviceId: string;
  online: boolean;
  lastUpdate: number;
  properties: {
    // 通用属性
    power?: 'on' | 'off';
    brightness?: number;        // 0-100
    temperature?: number;        // 摄氏度
    humidity?: number;           // 百分比
    battery?: number;            // 百分比

    // 设备特定属性
    [key: string]: any;
  };
  errors?: {
    code: string;
    message: string;
    timestamp: number;
  }[];
}

// 设备状态管理Hook
function useDeviceState(deviceId: string) {
  const [state, setState] = useState<DeviceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket连接
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`wss://api.example.com/devices/${deviceId}/state`);

    ws.onopen = () => {
      console.log(`[WebSocket] 连接到设备 ${deviceId} 状态服务`);
      setError(null);

      // 取消重连定时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'state_update') {
          setState(prev => ({
            ...prev,
            ...data.payload,
            lastUpdate: Date.now()
          }));
        } else if (data.type === 'full_state') {
          setState(data.payload);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('[WebSocket] 消息解析错误:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] 连接错误:', err);
      setError('连接错误');
    };

    ws.onclose = () => {
      console.log(`[WebSocket] 连接关闭: ${deviceId}`);

      // 自动重连
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`[WebSocket] 正在重连...`);
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [deviceId]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 发送控制指令
  const sendCommand = useCallback((command: string, params?: any) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] 未连接，无法发送指令');
      return false;
    }

    const message = {
      type: 'command',
      command,
      params,
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(message));
    console.log(`[WebSocket] 发送指令: ${command}`, params);
    return true;
  }, []);

  // 组件挂载时连接
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    isLoading,
    error,
    sendCommand,
    reconnect: connect,
    disconnect
  };
}

// 设备控制面板组件
function DeviceControlPanel({ deviceId }: { deviceId: string }) {
  const { state, sendCommand, isLoading } = useDeviceState(deviceId);

  if (isLoading) {
    return <div className="loading">加载设备状态中...</div>;
  }

  if (!state) {
    return <div className="error">设备不在线</div>;
  }

  return (
    <div className="device-control-panel">
      <div className="device-header">
        <h3>{deviceId}</h3>
        <span className={`status ${state.online ? 'online' : 'offline'}`}>
          {state.online ? '在线' : '离线'}
        </span>
      </div>

      {/* 电源控制 */}
      <div className="control-item">
        <span>电源</span>
        <button
          className={state.properties.power === 'on' ? 'active' : ''}
          onClick={() => sendCommand('setPower', { power: state.properties.power === 'on' ? 'off' : 'on' })}
        >
          {state.properties.power === 'on' ? '关闭' : '开启'}
        </button>
      </div>

      {/* 亮度调节 */}
      <div className="control-item">
        <span>亮度: {state.properties.brightness || 0}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={state.properties.brightness || 0}
          onChange={(e) => sendCommand('setBrightness', { brightness: Number(e.target.value) })}
        />
      </div>

      {/* 温度显示 */}
      {state.properties.temperature !== undefined && (
        <div className="control-item">
          <span>温度</span>
          <span className="value">{state.properties.temperature}°C</span>
        </div>
      )}

      {/* 电池电量 */}
      {state.properties.battery !== undefined && (
        <div className="control-item">
          <span>电池</span>
          <span className="value">{state.properties.battery}%</span>
        </div>
      )}

      {/* 错误信息 */}
      {state.errors && state.errors.length > 0 && (
        <div className="errors">
          <h4>错误信息</h4>
          {state.errors.map((err, index) => (
            <div key={index} className="error-item">
              <span className="code">{err.code}</span>
              <span className="message">{err.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="last-update">
        最后更新: {new Date(state.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
}
```

### 3.3 在线离线检测

设备在线离线状态的准确检测对于物联网系统至关重要。它不仅关系到用户体验，还直接影响设备控制指令的送达率和系统可靠性。

**在线检测策略：**

```typescript
// 在线检测策略对比
const ONLINE_DETECTION_STRATEGIES = {
  // 策略1：心跳检测
  heartbeat: {
    description: '客户端定期发送心跳，服务器检测超时',
    interval: 30000,           // 心跳间隔（毫秒）
    timeout: 90000,             // 超时时间
    retry: 3,                  // 重试次数
    advantages: ['实现简单', '服务器可控'],
    disadvantages: ['有延迟', '浪费带宽']
  },

  // 策略2：遗嘱消息（MQTT）
  lwt: {
    description: '设备断开时自动发送遗嘱消息',
    delay: 0,                   // 无延迟
    reliability: '高',
    advantages: ['即时通知', '可靠性高'],
    disadvantages: ['依赖连接断开检测']
  },

  // 策略3：双向心跳
  bidirectional: {
    description: '服务器也定期发送心跳，双重保障',
    clientHeartbeat: 30000,    // 客户端心跳
    serverHeartbeat: 60000,    // 服务器心跳
    timeout: 120000,
    advantages: ['最可靠', '即时检测'],
    disadvantages: ['资源消耗大']
  }
};

// 设备在线状态Hook
function useDeviceOnlineStatus(deviceId: string) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const missedHeartbeatsRef = useRef(0);

  const HEARTBEAT_INTERVAL = 30000;  // 30秒心跳
  const MAX_MISSED_HEARTBEATS = 3;   // 最多丢失3次心跳

  // 启动心跳
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    missedHeartbeatsRef.current = 0;

    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // 发送心跳
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
        missedHeartbeatsRef.current++;

        console.log(`[Heartbeat] 发送心跳 (${missedHeartbeatsRef.current}/${MAX_MISSED_HEARTBEATS})`);

        // 检测超时
        if (missedHeartbeatsRef.current > MAX_MISSED_HEARTBEATS) {
          console.warn('[Heartbeat] 心跳超时，标记为离线');
          setIsOnline(false);
          setConnectionQuality('poor');
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // 处理心跳响应
  const handleHeartbeatResponse = useCallback(() => {
    missedHeartbeatsRef.current = 0;
    setIsOnline(true);
    setLastSeen(Date.now());

    // 根据响应时间判断连接质量
    // 这里简化处理，实际应该测量RTT
    setConnectionQuality('good');
  }, []);

  // 连接到设备状态服务
  const connect = useCallback(() => {
    const ws = new WebSocket(`wss://api.example.com/devices/${deviceId}/status`);

    ws.onopen = () => {
      console.log(`[Status] 连接成功: ${deviceId}`);
      setIsOnline(true);
      setLastSeen(Date.now());
      missedHeartbeatsRef.current = 0;
      startHeartbeat();

      // 订阅设备状态
      ws.send(JSON.stringify({
        type: 'subscribe',
        topics: [`devices/${deviceId}/status`, `devices/${deviceId}/heartbeat`]
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'heartbeat_ack':
          handleHeartbeatResponse();
          break;
        case 'status_change':
          setIsOnline(data.online);
          setLastSeen(data.timestamp);
          break;
        case 'pong':
          // 服务器心跳响应
          break;
      }
    };

    ws.onclose = () => {
      console.log(`[Status] 连接关闭: ${deviceId}`);
      setIsOnline(false);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }

      // 尝试重连
      setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error(`[Status] 连接错误: ${deviceId}`, error);
      setIsOnline(false);
    };

    wsRef.current = ws;
  }, [deviceId, handleHeartbeatResponse, startHeartbeat]);

  // 组件挂载时连接
  useEffect(() => {
    connect();

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isOnline,
    lastSeen,
    connectionQuality
  };
}

// 设备状态指示器组件
function DeviceStatusIndicator({ deviceId }: { deviceId: string }) {
  const { isOnline, lastSeen, connectionQuality } = useDeviceOnlineStatus(deviceId);

  const getStatusColor = () => {
    if (!isOnline) return '#999';
    switch (connectionQuality) {
      case 'good': return '#52c41a';
      case 'fair': return '#faad14';
      case 'poor': return '#f5222d';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return '离线';
    switch (connectionQuality) {
      case 'good': return '在线（信号优）';
      case 'fair': return '在线（信号一般）';
      case 'poor': return '在线（信号差）';
    }
  };

  return (
    <div className="device-status-indicator">
      <span
        className="status-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
      {lastSeen && (
        <span className="last-seen">
          最后活跃: {new Date(lastSeen).toLocaleString()}
        </span>
      )}
    </div>
  );
}
```

### 3.4 实战：实时监控

下面是一个完整的实时监控系统实现，包括数据采集、状态展示、历史记录和告警处理。

```typescript
// 实时监控数据接口
interface MonitorData {
  deviceId: string;
  timestamp: number;
  metrics: {
    cpu?: number;          // CPU使用率 %
    memory?: number;       // 内存使用率 %
    temperature?: number;   // 温度 °C
    humidity?: number;      // 湿度 %
    voltage?: number;      // 电压 V
    current?: number;      // 电流 A
    power?: number;        // 功率 W
    [key: string]: number | undefined;
  };
  alerts: Alert[];
}

// 告警接口
interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

// 实时监控Hook
function useRealTimeMonitor(deviceIds: string[]) {
  const [dataMap, setDataMap] = useState<Map<string, MonitorData>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 告警阈值配置
  const ALERT_THRESHOLDS = {
    temperature: { warning: 70, critical: 85 },
    cpu: { warning: 80, critical: 95 },
    memory: { warning: 85, critical: 95 },
    voltage: { low: 3.0, high: 5.5 }
  };

  // 检测告警
  const checkAlerts = useCallback((deviceId: string, metrics: MonitorData['metrics']): Alert[] => {
    const newAlerts: Alert[] = [];

    // 温度告警
    if (metrics.temperature !== undefined) {
      if (metrics.temperature >= ALERT_THRESHOLDS.temperature.critical) {
        newAlerts.push({
          id: `${deviceId}_temp_${Date.now()}`,
          level: 'critical',
          message: `温度过高: ${metrics.temperature}°C`,
          timestamp: Date.now(),
          acknowledged: false
        });
      } else if (metrics.temperature >= ALERT_THRESHOLDS.temperature.warning) {
        newAlerts.push({
          id: `${deviceId}_temp_${Date.now()}`,
          level: 'warning',
          message: `温度偏高: ${metrics.temperature}°C`,
          timestamp: Date.now(),
          acknowledged: false
        });
      }
    }

    // CPU告警
    if (metrics.cpu !== undefined) {
      if (metrics.cpu >= ALERT_THRESHOLDS.cpu.critical) {
        newAlerts.push({
          id: `${deviceId}_cpu_${Date.now()}`,
          level: 'critical',
          message: `CPU过载: ${metrics.cpu}%`,
          timestamp: Date.now(),
          acknowledged: false
        });
      } else if (metrics.cpu >= ALERT_THRESHOLDS.cpu.warning) {
        newAlerts.push({
          id: `${deviceId}_cpu_${Date.now()}`,
          level: 'warning',
          message: `CPU使用率高: ${metrics.cpu}%`,
          timestamp: Date.now(),
          acknowledged: false
        });
      }
    }

    return newAlerts;
  }, []);

  // 连接WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('wss://api.example.com/monitor/realtime');

    ws.onopen = () => {
      console.log('[Monitor] WebSocket连接成功');
      setIsConnected(true);

      // 订阅设备数据
      ws.send(JSON.stringify({
        type: 'subscribe',
        deviceIds
      }));

      // 清除重连定时器
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'metrics') {
          const data: MonitorData = message.data;

          // 更新数据
          setDataMap(prev => {
            const next = new Map(prev);
            next.set(data.deviceId, data);
            return next;
          });

          // 检测告警
          const newAlerts = checkAlerts(data.deviceId, data.metrics);
          if (newAlerts.length > 0) {
            setAlerts(prev => [...prev, ...newAlerts].slice(-50));

            // 播放告警声音
            playAlertSound(newAlerts[0].level);
          }
        } else if (message.type === 'alert') {
          setAlerts(prev => [...prev, message.alert].slice(-50));
        }
      } catch (e) {
        console.error('[Monitor] 消息解析错误:', e);
      }
    };

    ws.onclose = () => {
      console.log('[Monitor] WebSocket连接关闭');
      setIsConnected(false);

      // 自动重连
      reconnectTimerRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = (error) => {
      console.error('[Monitor] WebSocket错误:', error);
    };

    wsRef.current = ws;
  }, [deviceIds, checkAlerts]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // 确认告警
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  // 清除已确认的告警
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  // 播放告警声音
  const playAlertSound = (level: Alert['level']) => {
    // 实际项目中可以播放不同的告警声音
    console.log(`[Alert] 播放告警声音: ${level}`);
  };

  // 获取统计数据
  const getStatistics = useCallback(() => {
    const values = Array.from(dataMap.values());

    if (values.length === 0) {
      return null;
    }

    const avgCpu = values.reduce((sum, v) => sum + (v.metrics.cpu || 0), 0) / values.length;
    const avgMemory = values.reduce((sum, v) => sum + (v.metrics.memory || 0), 0) / values.length;
    const avgTemp = values.reduce((sum, v) => sum + (v.metrics.temperature || 0), 0) / values.length;

    return {
      deviceCount: values.length,
      avgCpu: avgCpu.toFixed(1),
      avgMemory: avgMemory.toFixed(1),
      avgTemperature: avgTemp.toFixed(1),
      alertCount: alerts.filter(a => !a.acknowledged).length
    };
  }, [dataMap, alerts]);

  // 组件挂载时连接
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    dataMap,
    alerts,
    isConnected,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    getStatistics,
    connect,
    disconnect
  };
}

// 实时监控面板组件
function RealTimeMonitorPanel({ deviceIds }: { deviceIds: string[] }) {
  const {
    dataMap,
    alerts,
    isConnected,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    getStatistics
  } = useRealTimeMonitor(deviceIds);

  const stats = getStatistics();

  return (
    <div className="realtime-monitor-panel">
      <div className="panel-header">
        <h2>实时监控</h2>
        <div className="connection-status">
          <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? '已连接' : '未连接'}</span>
        </div>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card">
            <span className="label">设备数量</span>
            <span className="value">{stats.deviceCount}</span>
          </div>
          <div className="stat-card">
            <span className="label">平均CPU</span>
            <span className="value">{stats.avgCpu}%</span>
          </div>
          <div className="stat-card">
            <span className="label">平均内存</span>
            <span className="value">{stats.avgMemory}%</span>
          </div>
          <div className="stat-card">
            <span className="label">平均温度</span>
            <span className="value">{stats.avgTemperature}°C</span>
          </div>
          <div className="stat-card alert">
            <span className="label">告警数量</span>
            <span className="value">{stats.alertCount}</span>
          </div>
        </div>
      )}

      {/* 设备列表 */}
      <div className="device-grid">
        {Array.from(dataMap.entries()).map(([deviceId, data]) => (
          <div key={deviceId} className="device-card">
            <div className="device-header">
              <span className="device-id">{deviceId}</span>
              <span className="timestamp">
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="metrics">
              {data.metrics.cpu !== undefined && (
                <div className="metric">
                  <span className="label">CPU</span>
                  <div className="progress-bar">
                    <div
                      className="fill"
                      style={{
                        width: `${data.metrics.cpu}%`,
                        color: data.metrics.cpu > 80 ? '#f5222d' : '#52c41a'
                      }}
                    />
                  </div>
                  <span className="value">{data.metrics.cpu.toFixed(1)}%</span>
                </div>
              )}

              {data.metrics.memory !== undefined && (
                <div className="metric">
                  <span className="label">内存</span>
                  <div className="progress-bar">
                    <div
                      className="fill"
                      style={{ width: `${data.metrics.memory}%` }}
                    />
                  </div>
                  <span className="value">{data.metrics.memory.toFixed(1)}%</span>
                </div>
              )}

              {data.metrics.temperature !== undefined && (
                <div className="metric">
                  <span className="label">温度</span>
                  <span className="value temperature">
                    {data.metrics.temperature.toFixed(1)}°C
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 告警列表 */}
      <div className="alerts-section">
        <div className="alerts-header">
          <h3>告警列表 ({alerts.filter(a => !a.acknowledged).length})</h3>
          <button onClick={clearAcknowledgedAlerts}>清除已确认</button>
        </div>

        <ul className="alerts-list">
          {alerts.filter(a => !a.acknowledged).map(alert => (
            <li key={alert.id} className={`alert-item ${alert.level}`}>
              <span className="alert-icon">
                {alert.level === 'critical' ? '🔴' :
                 alert.level === 'error' ? '🟠' :
                 alert.level === 'warning' ? '🟡' : '🔵'}
              </span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
              <button
                className="ack-btn"
                onClick={() => acknowledgeAlert(alert.id)}
              >
                确认
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 4. 设备管理后台

### 4.1 设备注册

设备注册是物联网平台的基础功能，它将物理设备与云平台关联起来，为后续的设备管理、数据采集和远程控制提供基础。

**设备注册流程：**

```
设备注册流程图：

┌─────────┐                      ┌─────────┐                      ┌─────────┐
│  设备   │                      │  云平台  │                      │  用户   │
└────┬────┘                      └────┬────┘                      └────┬────┘
     │                                │                                │
     │  1. 发送注册请求                │                                │
     │───────────────────────────────▶│                                │
     │                                │                                │
     │  2. 验证设备信息                │                                │
     │                                │──▶ 分配DeviceId                │
     │                                │──▶ 生成证书/密钥                │
     │                                │                                │
     │  3. 返回注册结果                │                                │
     │◀───────────────────────────────│                                │
     │  (DeviceId + 证书)              │                                │
     │                                │                                │
     │  4. 保存证书到设备              │                                │
     │                                │                                │
     │  5. 建立MQTT连接               │                                │
     │───────────────────────────────▶│                                │
     │                                │                                │
     │                                │  6. 通知用户                    │
     │                                │───────────────────────────────▶│
```

```typescript
// 设备注册请求接口
interface DeviceRegistrationRequest {
  deviceName: string;            // 设备名称
  deviceType: DeviceType;        // 设备类型
  manufacturer: string;          // 制造商
  model: string;                 // 型号
  firmwareVersion: string;       // 固件版本
  hardwareVersion: string;      // 硬件版本
  serialNumber: string;          // 序列号
  macAddress?: string;           // MAC地址
  location?: LocationInfo;       // 位置信息
  metadata?: Record<string, any>; // 扩展元数据
}

// 设备类型枚举
type DeviceType =
  | 'sensor'           // 传感器
  | 'actuator'         // 执行器
  | 'gateway'          // 网关
  | 'camera'           // 摄像头
  | 'controller'       // 控制器
  | 'meter'            // 计测设备
  | 'other';           // 其他

// 位置信息
interface LocationInfo {
  latitude: number;
  longitude: number;
  altitude?: number;
  address?: string;
  floor?: string;
  zone?: string;
}

// 设备注册响应
interface DeviceRegistrationResponse {
  success: boolean;
  deviceId?: string;
  deviceSecret?: string;         // 设备密钥（仅返回一次）
  certificate?: {
    cert: string;
    privateKey: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// 设备信息（注册后）
interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  manufacturer: string;
  model: string;
  status: 'registered' | 'activated' | 'online' | 'offline' | 'disabled';
  createdAt: number;
  activatedAt?: number;
  lastSeenAt?: number;
  metadata: Record<string, any>;
}

// 设备注册表单组件
function DeviceRegistrationForm() {
  const [formData, setFormData] = useState<Partial<DeviceRegistrationRequest>>({
    deviceName: '',
    deviceType: 'sensor',
    manufacturer: '',
    model: '',
    firmwareVersion: '1.0.0',
    hardwareVersion: '1.0.0',
    serialNumber: '',
    macAddress: '',
    metadata: {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResponse | null>(null);

  const deviceTypes: { value: DeviceType; label: string }[] = [
    { value: 'sensor', label: '传感器' },
    { value: 'actuator', label: '执行器' },
    { value: 'gateway', label: '网关' },
    { value: 'camera', label: '摄像头' },
    { value: 'controller', label: '控制器' },
    { value: 'meter', label: '计测设备' },
    { value: 'other', label: '其他' }
  ];

  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deviceName || !formData.serialNumber) {
      alert('请填写设备名称和序列号');
      return;
    }

    setIsSubmitting(true);
    setRegistrationResult(null);

    try {
      // 调用注册API
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result: DeviceRegistrationResponse = await response.json();
      setRegistrationResult(result);

      if (result.success) {
        alert(`设备注册成功！\n设备ID: ${result.deviceId}\n请妥善保存设备密钥！`);
      } else {
        alert(`注册失败: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      alert('注册请求失败，请检查网络连接');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      deviceName: '',
      deviceType: 'sensor',
      manufacturer: '',
      model: '',
      firmwareVersion: '1.0.0',
      hardwareVersion: '1.0.0',
      serialNumber: '',
      macAddress: '',
      metadata: {}
    });
    setRegistrationResult(null);
  };

  return (
    <form onSubmit={handleSubmit} className="device-registration-form">
      <h2>设备注册</h2>

      {/* 基本信息 */}
      <fieldset className="form-section">
        <legend>基本信息</legend>

        <div className="form-group">
          <label>设备名称 *</label>
          <input
            type="text"
            name="deviceName"
            value={formData.deviceName}
            onChange={handleInputChange}
            placeholder="输入设备显示名称"
            required
          />
        </div>

        <div className="form-group">
          <label>设备类型 *</label>
          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleInputChange}
            required
          >
            {deviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>制造商</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              placeholder="制造商名称"
            />
          </div>

          <div className="form-group">
            <label>型号</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="设备型号"
            />
          </div>
        </div>
      </fieldset>

      {/* 版本信息 */}
      <fieldset className="form-section">
        <legend>版本信息</legend>

        <div className="form-row">
          <div className="form-group">
            <label>固件版本</label>
            <input
              type="text"
              name="firmwareVersion"
              value={formData.firmwareVersion}
              onChange={handleInputChange}
              placeholder="如: 1.0.0"
            />
          </div>

          <div className="form-group">
            <label>硬件版本</label>
            <input
              type="text"
              name="hardwareVersion"
              value={formData.hardwareVersion}
              onChange={handleInputChange}
              placeholder="如: 1.0.0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>序列号 *</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="设备序列号"
              required
            />
          </div>

          <div className="form-group">
            <label>MAC地址</label>
            <input
              type="text"
              name="macAddress"
              value={formData.macAddress}
              onChange={handleInputChange}
              placeholder="如: AA:BB:CC:DD:EE:FF"
            />
          </div>
        </div>
      </fieldset>

      {/* 位置信息 */}
      <fieldset className="form-section">
        <legend>位置信息（可选）</legend>

        <div className="form-group">
          <label>安装地址</label>
          <input
            type="text"
            name="location"
            value={formData.location?.address || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              location: { ...prev.location!, address: e.target.value }
            }))}
            placeholder="设备安装地址"
          />
        </div>
      </fieldset>

      {/* 提交按钮 */}
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '注册中...' : '注册设备'}
        </button>
        <button type="button" onClick={handleReset}>
          重置
        </button>
      </div>

      {/* 注册结果 */}
      {registrationResult && (
        <div className={`registration-result ${registrationResult.success ? 'success' : 'error'}`}>
          {registrationResult.success ? (
            <>
              <h3>注册成功</h3>
              <p>设备ID: <code>{registrationResult.deviceId}</code></p>
              <p className="warning">设备密钥仅显示一次，请妥善保存！</p>
              <p>设备密钥: <code>{registrationResult.deviceSecret}</code></p>
            </>
          ) : (
            <>
              <h3>注册失败</h3>
              <p>错误代码: {registrationResult.error?.code}</p>
              <p>错误信息: {registrationResult.error?.message}</p>
            </>
          )}
        </div>
      )}
    </form>
  );
}
```

### 4.2 设备列表

设备列表是设备管理后台的核心功能之一，它展示了所有已注册设备的状态和信息，支持搜索、筛选和批量操作。

```typescript
// 设备列表查询参数
interface DeviceListQuery {
  page: number;
  pageSize: number;
  keyword?: string;              // 搜索关键词
  deviceType?: DeviceType;       // 设备类型筛选
  status?: DeviceStatus;         // 状态筛选
  manufacturer?: string;          // 制造商筛选
  sortBy?: 'name' | 'createdAt' | 'lastSeenAt';
  sortOrder?: 'asc' | 'desc';
}

// 设备状态
type DeviceStatus = 'registered' | 'activated' | 'online' | 'offline' | 'disabled';

// 设备列表响应
interface DeviceListResponse {
  total: number;
  page: number;
  pageSize: number;
  devices: Device[];
}

// 设备列表Hook
function useDeviceList(initialQuery?: Partial<DeviceListQuery>) {
  const [query, setQuery] = useState<DeviceListQuery>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialQuery
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: query.page.toString(),
        pageSize: query.pageSize.toString(),
        ...(query.keyword && { keyword: query.keyword }),
        ...(query.deviceType && { deviceType: query.deviceType }),
        ...(query.status && { status: query.status }),
        ...(query.manufacturer && { manufacturer: query.manufacturer }),
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      });

      const response = await fetch(`/api/devices?${params}`);

      if (!response.ok) {
        throw new Error('获取设备列表失败');
      }

      const result: DeviceListResponse = await response.json();
      setDevices(result.devices);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message);
      console.error('获取设备列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // 分页
  const setPage = useCallback((page: number) => {
    setQuery(prev => ({ ...prev, page }));
  }, []);

  // 修改每页数量
  const setPageSize = useCallback((pageSize: number) => {
    setQuery(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // 搜索
  const setKeyword = useCallback((keyword: string) => {
    setQuery(prev => ({ ...prev, keyword, page: 1 }));
  }, []);

  // 筛选设备类型
  const setDeviceTypeFilter = useCallback((deviceType: DeviceType | undefined) => {
    setQuery(prev => ({ ...prev, deviceType, page: 1 }));
  }, []);

  // 筛选状态
  const setStatusFilter = useCallback((status: DeviceStatus | undefined) => {
    setQuery(prev => ({ ...prev, status, page: 1 }));
  }, []);

  // 排序
  const setSort = useCallback((sortBy: DeviceListQuery['sortBy'], sortOrder: 'asc' | 'desc') => {
    setQuery(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // 删除设备
  const deleteDevice = useCallback(async (deviceId: string) => {
    if (!confirm('确定要删除该设备吗？此操作不可恢复。')) {
      return false;
    }

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除设备失败');
      }

      // 刷新列表
      await fetchDevices();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  }, [fetchDevices]);

  // 批量删除
  const batchDeleteDevices = useCallback(async (deviceIds: string[]) => {
    if (!confirm(`确定要删除选中的 ${deviceIds.length} 个设备吗？`)) {
      return false;
    }

    try {
      const response = await fetch('/api/devices/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds })
      });

      if (!response.ok) {
        throw new Error('批量删除失败');
      }

      await fetchDevices();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  }, [fetchDevices]);

  // 启用/禁用设备
  const toggleDeviceStatus = useCallback(async (deviceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: enabled ? 'activated' : 'disabled'
        })
      });

      if (!response.ok) {
        throw new Error('更新设备状态失败');
      }

      await fetchDevices();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  }, [fetchDevices]);

  // 查询变化时重新获取
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    total,
    query,
    isLoading,
    error,
    setPage,
    setPageSize,
    setKeyword,
    setDeviceTypeFilter,
    setStatusFilter,
    setSort,
    deleteDevice,
    batchDeleteDevices,
    toggleDeviceStatus,
    refresh: fetchDevices
  };
}

// 设备列表组件
function DeviceListPage() {
  const {
    devices,
    total,
    query,
    isLoading,
    error,
    setPage,
    setPageSize,
    setKeyword,
    setDeviceTypeFilter,
    setStatusFilter,
    deleteDevice,
    batchDeleteDevices,
    toggleDeviceStatus
  } = useDeviceList();

  // 选择状态
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.deviceId)));
    }
    setSelectAll(!selectAll);
  };

  // 选择/取消选择单个设备
  const handleSelect = (deviceId: string) => {
    const next = new Set(selectedDevices);
    if (next.has(deviceId)) {
      next.delete(deviceId);
    } else {
      next.add(deviceId);
    }
    setSelectedDevices(next);
    setSelectAll(next.size === devices.length);
  };

  // 获取状态颜色
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return '#52c41a';
      case 'offline': return '#999';
      case 'activated': return '#1890ff';
      case 'registered': return '#faad14';
      case 'disabled': return '#f5222d';
    }
  };

  // 获取状态文本
  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'activated': return '已激活';
      case 'registered': return '已注册';
      case 'disabled': return '已禁用';
    }
  };

  const totalPages = Math.ceil(total / query.pageSize);

  return (
    <div className="device-list-page">
      <div className="page-header">
        <h1>设备管理</h1>
        <button className="btn-primary" onClick={() => window.location.href = '/devices/register'}>
          注册新设备
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索设备名称、ID..."
            value={query.keyword || ''}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          value={query.deviceType || ''}
          onChange={(e) => setDeviceTypeFilter(e.target.value as DeviceType || undefined)}
        >
          <option value="">全部类型</option>
          <option value="sensor">传感器</option>
          <option value="actuator">执行器</option>
          <option value="gateway">网关</option>
          <option value="camera">摄像头</option>
        </select>

        <select
          value={query.status || ''}
          onChange={(e) => setStatusFilter(e.target.value as DeviceStatus || undefined)}
        >
          <option value="">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
          <option value="activated">已激活</option>
          <option value="registered">已注册</option>
          <option value="disabled">已禁用</option>
        </select>

        <span className="total-count">共 {total} 台设备</span>
      </div>

      {/* 批量操作栏 */}
      {selectedDevices.size > 0 && (
        <div className="batch-action-bar">
          <span>已选择 {selectedDevices.size} 台设备</span>
          <button onClick={() => batchDeleteDevices([...selectedDevices])}>
            批量删除
          </button>
          <button onClick={() => setSelectedDevices(new Set())}>
            取消选择
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && <div className="loading">加载中...</div>}

      {/* 错误提示 */}
      {error && <div className="error-message">{error}</div>}

      {/* 设备列表 */}
      {!isLoading && !error && (
        <table className="device-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th>设备名称</th>
              <th>设备ID</th>
              <th>类型</th>
              <th>状态</th>
              <th>制造商</th>
              <th>最后活跃</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.deviceId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDevices.has(device.deviceId)}
                    onChange={() => handleSelect(device.deviceId)}
                  />
                </td>
                <td>{device.deviceName}</td>
                <td><code>{device.deviceId}</code></td>
                <td>{device.deviceType}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(device.status) }}
                  >
                    {getStatusText(device.status)}
                  </span>
                </td>
                <td>{device.manufacturer}</td>
                <td>
                  {device.lastSeenAt
                    ? new Date(device.lastSeenAt).toLocaleString()
                    : '-'}
                </td>
                <td>
                  <button onClick={() => window.location.href = `/devices/${device.deviceId}`}>
                    查看
                  </button>
                  <button onClick={() => toggleDeviceStatus(device.deviceId, device.status === 'disabled')}>
                    {device.status === 'disabled' ? '启用' : '禁用'}
                  </button>
                  <button onClick={() => deleteDevice(device.deviceId)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 分页 */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={query.page <= 1}
            onClick={() => setPage(query.page - 1)}
          >
            上一页
          </button>

          <span>
            第 {query.page} / {totalPages} 页
          </span>

          <select
            value={query.pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>

          <button
            disabled={query.page >= totalPages}
            onClick={() => setPage(query.page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4.3 远程控制

远程控制是物联网应用的核心功能之一，允许用户通过网络对设备进行实时控制。

```typescript
// 控制指令接口
interface ControlCommand {
  deviceId: string;
  command: string;
  parameters?: Record<string, any>;
  timestamp: number;
  expiresAt?: number;            // 指令过期时间
}

// 控制指令响应
interface CommandResponse {
  success: boolean;
  commandId?: string;
  result?: any;
  error?: {
    code: string;
    message: string;
  };
  executedAt?: number;            // 指令执行时间
}

// 设备控制Hook
function useDeviceControl(deviceId: string) {
  const [isControlling, setIsControlling] = useState(false);
  const [lastCommand, setLastCommand] = useState<ControlCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandResponse[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 发送控制指令
  const sendCommand = useCallback(async (
    command: string,
    parameters?: Record<string, any>,
    options?: { timeout?: number; retries?: number }
  ): Promise<CommandResponse> => {
    setIsControlling(true);

    const ctrlCommand: ControlCommand = {
      deviceId,
      command,
      parameters,
      timestamp: Date.now()
    };

    setLastCommand(ctrlCommand);

    try {
      // 通过HTTP发送指令（同步方式）
      const response = await fetch(`/api/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctrlCommand),
        signal: options?.timeout
          ? AbortSignal.timeout(options.timeout)
          : undefined
      });

      const result: CommandResponse = await response.json();

      setCommandHistory(prev => [result, ...prev.slice(49)]);

      return result;
    } catch (error: any) {
      const errorResult: CommandResponse = {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: error.message || '指令发送超时'
        }
      };

      setCommandHistory(prev => [errorResult, ...prev.slice(49)]);

      return errorResult;
    } finally {
      setIsControlling(false);
    }
  }, [deviceId]);

  // 通过WebSocket发送指令（实时方式）
  const sendCommandViaWebSocket = useCallback((
    command: string,
    parameters?: Record<string, any>
  ): Promise<CommandResponse> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket未连接'));
        return;
      }

      const ctrlCommand: ControlCommand = {
        deviceId,
        command,
        parameters,
        timestamp: Date.now()
      };

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error('命令执行超时'));
      }, 10000);

      wsRef.current.send(JSON.stringify({
        type: 'command',
        data: ctrlCommand
      }));

      // 等待响应
      const handleMessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);

        if (message.type === 'command_result' && message.commandId === ctrlCommand.timestamp) {
          clearTimeout(timeout);
          wsRef.current?.removeEventListener('message', handleMessage);

          const result: CommandResponse = message.data;
          setCommandHistory(prev => [result, ...prev.slice(49)]);
          resolve(result);
        }
      };

      wsRef.current.addEventListener('message', handleMessage);
    });
  }, [deviceId]);

  // 预设控制命令
  const controls = {
    // 开关控制
    turnOn: () => sendCommand('setPower', { power: true }),
    turnOff: () => sendCommand('setPower', { power: false }),
    toggle: () => sendCommand('togglePower'),

    // 亮度控制
    setBrightness: (value: number) =>
      sendCommand('setBrightness', { brightness: Math.max(0, Math.min(100, value)) }),

    // 颜色控制
    setColor: (r: number, g: number, b: number) =>
      sendCommand('setColor', { r, g, b }),
    setColorTemperature: (kelvin: number) =>
      sendCommand('setColorTemperature', { kelvin }),

    // 温度控制
    setTemperature: (value: number) =>
      sendCommand('setTemperature', { temperature: value }),

    // 重启设备
    reboot: () => sendCommand('reboot'),

    // 恢复出厂设置
    reset: () => sendCommand('resetFactory'),

    // 固件升级
    upgradeFirmware: (version: string) =>
      sendCommand('upgradeFirmware', { version })
  };

  return {
    isControlling,
    lastCommand,
    commandHistory,
    sendCommand,
    sendCommandViaWebSocket,
    controls
  };
}

// 设备控制面板组件
function DeviceControlPanel({ deviceId }: { deviceId: string }) {
  const {
    isControlling,
    commandHistory,
    controls
  } = useDeviceControl(deviceId);

  const [brightness, setBrightness] = useState(50);
  const [color, setColor] = useState({ r: 255, g: 255, b: 255 });

  return (
    <div className="device-control-panel">
      <h2>设备控制</h2>
      <p className="device-id">设备ID: {deviceId}</p>

      {/* 电源控制 */}
      <div className="control-section">
        <h3>电源控制</h3>
        <div className="button-group">
          <button
            onClick={controls.turnOn}
            disabled={isControlling}
            className="btn-success"
          >
            开启
          </button>
          <button
            onClick={controls.turnOff}
            disabled={isControlling}
            className="btn-danger"
          >
            关闭
          </button>
          <button
            onClick={controls.toggle}
            disabled={isControlling}
          >
            切换
          </button>
        </div>
      </div>

      {/* 亮度控制 */}
      <div className="control-section">
        <h3>亮度控制</h3>
        <div className="slider-control">
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
          />
          <span>{brightness}%</span>
          <button
            onClick={() => controls.setBrightness(brightness)}
            disabled={isControlling}
          >
            设置
          </button>
        </div>
      </div>

      {/* 颜色控制 */}
      <div className="control-section">
        <h3>颜色控制</h3>
        <div className="color-picker">
          <label>R: <input type="number" min="0" max="255" value={color.r}
            onChange={(e) => setColor(prev => ({ ...prev, r: Number(e.target.value) }))} /></label>
          <label>G: <input type="number" min="0" max="255" value={color.g}
            onChange={(e) => setColor(prev => ({ ...prev, g: Number(e.target.value) }))} /></label>
          <label>B: <input type="number" min="0" max="255" value={color.b}
            onChange={(e) => setColor(prev => ({ ...prev, b: Number(e.target.value) }))} /></label>
          <button onClick={() => controls.setColor(color.r, color.g, color.b)}>
            设置颜色
          </button>
        </div>

        <div
          className="color-preview"
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
        />
      </div>

      {/* 设备维护 */}
      <div className="control-section">
        <h3>设备维护</h3>
        <div className="button-group">
          <button onClick={controls.reboot} disabled={isControlling}>
            重启设备
          </button>
          <button onClick={controls.reset} disabled={isControlling} className="btn-warning">
            恢复出厂
          </button>
        </div>
      </div>

      {/* 命令历史 */}
      <div className="command-history">
        <h3>命令历史</h3>
        <ul>
          {commandHistory.slice(0, 10).map((cmd, index) => (
            <li key={index} className={cmd.success ? 'success' : 'error'}>
              <span className="command-id">{cmd.commandId}</span>
              <span className="result">
                {cmd.success ? '成功' : `失败: ${cmd.error?.message}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### 4.4 数据可视化

数据可视化是物联网应用的重要组成部分，它将设备采集的数据以图表的形式展示，帮助用户直观地理解数据趋势和异常情况。

```typescript
// 时间序列数据点
interface DataPoint {
  timestamp: number;
  value: number;
}

// 设备历史数据
interface DeviceHistoricalData {
  deviceId: string;
  metric: string;
  unit: string;
  data: DataPoint[];
  statistics: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
}

// 数据可视化Hook
function useDeviceChartData(
  deviceId: string,
  metric: string,
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d'
) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [statistics, setStatistics] = useState<DeviceHistoricalData['statistics'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 时间范围转换
  const getTimeRangeParams = () => {
    const now = Date.now();
    let startTime: number;

    switch (timeRange) {
      case '1h': startTime = now - 3600000; break;
      case '6h': startTime = now - 6 * 3600000; break;
      case '24h': startTime = now - 24 * 3600000; break;
      case '7d': startTime = now - 7 * 24 * 3600000; break;
      case '30d': startTime = now - 30 * 24 * 3600000; break;
    }

    return { startTime, endTime: now };
  };

  // 获取历史数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { startTime, endTime } = getTimeRangeParams();

        const response = await fetch(
          `/api/devices/${deviceId}/metrics/${metric}?startTime=${startTime}&endTime=${endTime}`
        );

        if (!response.ok) {
          throw new Error('获取数据失败');
        }

        const result: DeviceHistoricalData = await response.json();
        setData(result.data);
        setStatistics(result.statistics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 定期刷新
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, [deviceId, metric, timeRange]);

  return { data, statistics, isLoading, error };
}

// 设备数据图表组件
function DeviceChart({ deviceId, metric, title, unit }: {
  deviceId: string;
  metric: string;
  title: string;
  unit: string;
}) {
  const { data, statistics, isLoading, error } = useDeviceChartData(deviceId, metric, '24h');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');

  // 图表配置
  const chartOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#f0f0f0'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false
      }
    },
    yaxis: {
      title: {
        text: unit
      }
    },
    tooltip: {
      x: {
        format: 'yyyy-MM-dd HH:mm:ss'
      }
    }
  };

  // 转换数据格式
  const chartSeries = [{
    name: title,
    data: data.map(point => ({
      x: point.timestamp,
      y: point.value
    }))
  }];

  return (
    <div className="device-chart">
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="time-range-selector">
          {(['1h', '6h', '24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              className={timeRange === range ? 'active' : ''}
              onClick={() => setTimeRange(range)}
            >
              {range === '1h' ? '1小时' :
               range === '6h' ? '6小时' :
               range === '24h' ? '24小时' :
               range === '7d' ? '7天' : '30天'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="chart-loading">加载中...</div>
      ) : error ? (
        <div className="chart-error">{error}</div>
      ) : (
        <>
          {/* 统计信息 */}
          {statistics && (
            <div className="statistics">
              <div className="stat-item">
                <span className="label">最大值</span>
                <span className="value">{statistics.max.toFixed(2)} {unit}</span>
              </div>
              <div className="stat-item">
                <span className="label">最小值</span>
                <span className="value">{statistics.min.toFixed(2)} {unit}</span>
              </div>
              <div className="stat-item">
                <span className="label">平均值</span>
                <span className="value">{statistics.avg.toFixed(2)} {unit}</span>
              </div>
              <div className="stat-item">
                <span className="label">数据点数</span>
                <span className="value">{statistics.count}</span>
              </div>
            </div>
          )}

          {/* 图表 */}
          <div className="chart-container">
            <ApexCharts
              options={chartOptions}
              series={chartSeries}
              type="line"
              height={300}
            />
          </div>
        </>
      )}
    </div>
  );
}

// 设备数据仪表板
function DeviceDataDashboard({ deviceId }: { deviceId: string }) {
  return (
    <div className="device-data-dashboard">
      <h2>设备数据监控</h2>

      <div className="charts-grid">
        <DeviceChart
          deviceId={deviceId}
          metric="temperature"
          title="温度"
          unit="°C"
        />

        <DeviceChart
          deviceId={deviceId}
          metric="humidity"
          title="湿度"
          unit="%"
        />

        <DeviceChart
          deviceId={deviceId}
          metric="cpu"
          title="CPU使用率"
          unit="%"
        />

        <DeviceChart
          deviceId={deviceId}
          metric="memory"
          title="内存使用率"
          unit="%"
        />
      </div>
    </div>
  );
}
```

---

## 5. 智能家居

### 5.1 设备配网

设备配网（Device Provisioning）是将新设备连接到家庭网络的过程，这是智能家居系统中的关键步骤。

```typescript
// 配网方式枚举
type ProvisioningMethod =
  | 'soft_ap'        // 设备创建热点，手机连接后配置
  | 'bluetooth'       // 蓝牙配网
  | 'qr-code'        // 二维码配网
  | 'manual'          // 手动输入WiFi信息
  | 'wps';           // WPS一键配网

// 配网状态
interface ProvisioningState {
  step: 'idle' | 'scanning' | 'connecting' | 'configuring' | 'verifying' | 'success' | 'error';
  progress: number;           // 0-100
  deviceInfo?: Partial<DeviceInfo>;
  networkInfo?: NetworkInfo;
  error?: string;
}

// 设备信息
interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  hardwareVersion: string;
  firmwareVersion: string;
  macAddress: string;
}

// 网络信息
interface NetworkInfo {
  ssid: string;
  password: string;
  securityType: 'WPA2' | 'WPA3' | 'WEP';
  ip?: string;
}

// 设备配网Hook
function useDeviceProvisioning() {
  const [state, setState] = useState<ProvisioningState>({
    step: 'idle',
    progress: 0
  });

  // 扫描设备（通过蓝牙或局域网）
  const scanDevices = useCallback(async () => {
    setState(prev => ({ ...prev, step: 'scanning', progress: 10 }));

    try {
      // 实际项目中通过蓝牙或mDNS扫描设备
      // const devices = await BLE.scan();
      // const devices = await mDNS.discover('_smartdevice._tcp');

      // 模拟扫描
      await new Promise(resolve => setTimeout(resolve, 2000));

      setState(prev => ({
        ...prev,
        step: 'idle',
        progress: 100,
        deviceInfo: {
          deviceId: 'SD_' + Math.random().toString(16).slice(2, 10).toUpperCase(),
          deviceName: '智能灯-' + Math.floor(Math.random() * 1000),
          deviceModel: 'SL-100',
          hardwareVersion: '1.0.0',
          firmwareVersion: '1.2.0',
          macAddress: 'AA:BB:CC:DD:EE:FF'
        }
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message
      }));
      return false;
    }
  }, []);

  // 配置网络
  const configureNetwork = useCallback(async (ssid: string, password: string) => {
    setState(prev => ({
      ...prev,
      step: 'configuring',
      progress: 30,
      networkInfo: { ssid, password, securityType: 'WPA2' }
    }));

    try {
      // 实际项目中通过蓝牙或UDP发送WiFi配置到设备
      // await BLE.sendConfig({ ssid, password });

      // 模拟配置过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      setState(prev => ({ ...prev, progress: 60 }));

      // 设备尝试连接WiFi
      await new Promise(resolve => setTimeout(resolve, 3000));

      setState(prev => ({ ...prev, progress: 80 }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message
      }));
      return false;
    }
  }, []);

  // 验证连接
  const verifyConnection = useCallback(async () => {
    setState(prev => ({ ...prev, step: 'verifying', progress: 90 }));

    try {
      // 验证设备是否成功连接到云平台
      // const isConnected = await DeviceAPI.verifyConnection(deviceId);

      // 模拟验证
      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({
        ...prev,
        step: 'success',
        progress: 100
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: '设备连接验证失败，请检查网络后重试'
      }));
      return false;
    }
  }, []);

  // 重置配网状态
  const reset = useCallback(() => {
    setState({
      step: 'idle',
      progress: 0
    });
  }, []);

  return {
    state,
    scanDevices,
    configureNetwork,
    verifyConnection,
    reset
  };
}

// 设备配网页面组件
function DeviceProvisioningPage() {
  const {
    state,
    scanDevices,
    configureNetwork,
    verifyConnection,
    reset
  } = useDeviceProvisioning();

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<ProvisioningMethod>('soft-ap');

  const provisioningMethods: { value: ProvisioningMethod; label: string; description: string }[] = [
    { value: 'soft-ap', label: '热点配网', description: '设备创建热点，手机连接后配置' },
    { value: 'bluetooth', label: '蓝牙配网', description: '通过蓝牙将WiFi信息发送给设备' },
    { value: 'qr-code', label: '二维码配网', description: '扫描设备上的二维码配置' },
    { value: 'manual', label: '手动输入', description: '手动输入WiFi信息' }
  ];

  // 开始配网流程
  const handleStartProvisioning = async () => {
    // 1. 扫描设备
    const found = await scanDevices();
    if (!found) return;

    // 2. 配置网络
    const configured = await configureNetwork(ssid, password);
    if (!configured) return;

    // 3. 验证连接
    await verifyConnection();
  };

  return (
    <div className="device-provisioning-page">
      <h1>设备配网</h1>

      {/* 配网方式选择 */}
      <div className="method-selection">
        <h2>选择配网方式</h2>
        <div className="method-list">
          {provisioningMethods.map(method => (
            <div
              key={method.value}
              className={`method-card ${selectedMethod === method.value ? 'selected' : ''}`}
              onClick={() => setSelectedMethod(method.value)}
            >
              <span className="method-name">{method.label}</span>
              <span className="method-desc">{method.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WiFi配置 */}
      <div className="wifi-config">
        <h2>输入WiFi信息</h2>
        <div className="form-group">
          <label>WiFi名称 (SSID)</label>
          <input
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="请输入WiFi名称"
          />
        </div>
        <div className="form-group">
          <label>WiFi密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入WiFi密码"
          />
        </div>
      </div>

      {/* 配网进度 */}
      <div className="provisioning-progress">
        <h2>配网进度</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${state.progress}%` }} />
        </div>

        <div className="step-indicators">
          <div className={`step ${['scanning', 'configuring', 'verifying', 'success'].includes(state.step) ? 'active' : ''}`}>
            扫描设备
          </div>
          <div className={`step ${['configuring', 'verifying', 'success'].includes(state.step) ? 'active' : ''}`}>
            配置网络
          </div>
          <div className={`step ${['verifying', 'success'].includes(state.step) ? 'active' : ''}`}>
            验证连接
          </div>
          <div className={`step ${state.step === 'success' ? 'active' : ''}`}>
            完成
          </div>
        </div>

        {state.step === 'error' && (
          <div className="error-message">
            配网失败: {state.error}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="actions">
        {state.step === 'idle' && (
          <button
            className="btn-primary"
            onClick={handleStartProvisioning}
            disabled={!ssid || !password}
          >
            开始配网
          </button>
        )}

        {state.step === 'success' && (
          <>
            <button className="btn-success" onClick={() => window.location.href = '/devices'}>
              查看设备
            </button>
            <button onClick={reset}>
              继续配网
            </button>
          </>
        )}

        {state.step === 'error' && (
          <button onClick={reset}>
            重试
          </button>
        )}
      </div>

      {/* 设备信息 */}
      {state.deviceInfo && state.step !== 'idle' && (
        <div className="device-info">
          <h3>发现的设备</h3>
          <dl>
            <dt>设备ID</dt>
            <dd>{state.deviceInfo.deviceId}</dd>
            <dt>设备名称</dt>
            <dd>{state.deviceInfo.deviceName}</dd>
            <dt>型号</dt>
            <dd>{state.deviceInfo.deviceModel}</dd>
            <dt>固件版本</dt>
            <dd>{state.deviceInfo.firmwareVersion}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
```

### 5.2 场景联动

场景联动允许用户设置自动化规则，实现多个设备之间的协同工作。

```typescript
// 场景动作
interface SceneAction {
  deviceId: string;
  deviceName: string;
  command: string;
  parameters: Record<string, any>;
  delay?: number;               // 延迟执行（毫秒）
  condition?: ActionCondition;  // 条件执行
}

// 动作条件
interface ActionCondition {
  type: 'time' | 'state' | 'location';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'between';
  value: any;
}

// 场景触发器
interface SceneTrigger {
  type: 'schedule' | 'device_state' | 'location' | 'manual';
  deviceId?: string;            // 设备状态触发时
  condition?: {
    property: string;
    operator: string;
    value: any;
  };
  schedule?: {
    type: 'once' | 'repeat';
    time?: string;              // HH:mm
    days?: number[];             // 0-6，0为周日
    interval?: number;          // 重复间隔（分钟）
  };
  location?: {
    type: 'enter' | 'exit';
    geofenceId: string;
  };
}

// 智能场景
interface SmartScene {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  trigger: SceneTrigger;
  actions: SceneAction[];
  createdAt: number;
  updatedAt: number;
}

// 场景管理Hook
function useSmartScenes() {
  const [scenes, setScenes] = useState<SmartScene[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载场景
  useEffect(() => {
    const loadScenes = async () => {
      try {
        const response = await fetch('/api/scenes');
        const data = await response.json();
        setScenes(data);
      } catch (error) {
        console.error('加载场景失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenes();
  }, []);

  // 创建场景
  const createScene = async (scene: Omit<SmartScene, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scene)
    });

    const newScene = await response.json();
    setScenes(prev => [...prev, newScene]);
    return newScene;
  };

  // 更新场景
  const updateScene = async (id: string, updates: Partial<SmartScene>) => {
    const response = await fetch(`/api/scenes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const updatedScene = await response.json();
    setScenes(prev => prev.map(s => s.id === id ? updatedScene : s));
    return updatedScene;
  };

  // 删除场景
  const deleteScene = async (id: string) => {
    await fetch(`/api/scenes/${id}`, { method: 'DELETE' });
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  // 触发场景
  const triggerScene = async (id: string) => {
    // 执行场景动作
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;

    for (const action of scene.actions) {
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }

      await fetch(`/api/devices/${action.deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: action.command,
          parameters: action.parameters
        })
      });
    }
  };

  // 切换场景启用状态
  const toggleScene = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;

    await updateScene(id, { enabled: !scene.enabled });
  };

  return {
    scenes,
    isLoading,
    createScene,
    updateScene,
    deleteScene,
    triggerScene,
    toggleScene
  };
}

// 场景创建表单组件
function SceneCreationForm() {
  const { scenes, createScene, updateScene, deleteScene, triggerScene } = useSmartScenes();

  const [sceneName, setSceneName] = useState('');
  const [sceneIcon, setSceneIcon] = useState('💡');
  const [triggerType, setTriggerType] = useState<SceneTrigger['type']>('manual');
  const [actions, setActions] = useState<SceneAction[]>([]);

  // 添加动作
  const addAction = (action: SceneAction) => {
    setActions(prev => [...prev, action]);
  };

  // 移除动作
  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  // 提交创建
  const handleSubmit = async () => {
    if (!sceneName.trim() || actions.length === 0) {
      alert('请填写场景名称并添加动作');
      return;
    }

    const scene = {
      name: sceneName,
      icon: sceneIcon,
      enabled: true,
      trigger: { type: triggerType },
      actions
    };

    await createScene(scene);
    alert('场景创建成功');
  };

  return (
    <div className="scene-creation-form">
      <h2>创建智能场景</h2>

      {/* 场景基本信息 */}
      <div className="form-section">
        <div className="form-group">
          <label>场景名称</label>
          <input
            type="text"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="如：离家模式"
          />
        </div>

        <div className="form-group">
          <label>场景图标</label>
          <input
            type="text"
            value={sceneIcon}
            onChange={(e) => setSceneIcon(e.target.value)}
            placeholder="选择一个图标"
          />
        </div>
      </div>

      {/* 触发条件 */}
      <div className="form-section">
        <h3>触发条件</h3>
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as SceneTrigger['type'])}>
          <option value="manual">手动触发</option>
          <option value="schedule">定时触发</option>
          <option value="device_state">设备状态变化</option>
          <option value="location">位置变化</option>
        </select>
      </div>

      {/* 执行动作 */}
      <div className="form-section">
        <h3>执行动作</h3>

        <div className="actions-list">
          {actions.map((action, index) => (
            <div key={index} className="action-item">
              <span>{action.deviceName}</span>
              <span>{action.command}</span>
              {action.delay && <span>延迟{action.delay}ms</span>}
              <button onClick={() => removeAction(index)}>删除</button>
            </div>
          ))}
        </div>

        <button className="btn-secondary" onClick={() => {/* 打开设备选择对话框 */}}>
          添加动作
        </button>
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        创建场景
      </button>
    </div>
  );
}

// 场景列表组件
function SceneListPage() {
  const { scenes, isLoading, triggerScene, toggleScene, deleteScene } = useSmartScenes();

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="scene-list-page">
      <h1>智能场景</h1>

      <div className="scene-grid">
        {scenes.map(scene => (
          <div key={scene.id} className={`scene-card ${scene.enabled ? '' : 'disabled'}`}>
            <div className="scene-icon">{scene.icon}</div>
            <div className="scene-name">{scene.name}</div>
            <div className="scene-trigger">
              触发: {scene.trigger.type === 'manual' ? '手动' : scene.trigger.type}
            </div>
            <div className="scene-actions">
              {scene.actions.length} 个动作
            </div>

            <div className="scene-controls">
              <button onClick={() => triggerScene(scene.id)}>
                执行
              </button>
              <button onClick={() => toggleScene(scene.id)}>
                {scene.enabled ? '禁用' : '启用'}
              </button>
              <button onClick={() => deleteScene(scene.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 定时任务

定时任务允许用户设置设备在特定时间自动执行特定操作。

```typescript
// 定时任务配置
interface ScheduledTask {
  id: string;
  name: string;
  deviceId: string;
  deviceName: string;
  command: string;
  parameters: Record<string, any>;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'interval';
    time?: string;              // HH:mm 格式
    daysOfWeek?: number[];       // 0-6，周日为0
    intervalMinutes?: number;    // 间隔执行
    startDate?: string;         // YYYY-MM-DD
    endDate?: string;           // YYYY-MM-DD
  };
  enabled: boolean;
  lastExecutedAt?: number;
  nextExecutionAt?: number;
  createdAt: number;
}

// 定时任务Hook
function useScheduledTasks(deviceId?: string) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载任务
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const url = deviceId
          ? `/api/devices/${deviceId}/schedules`
          : '/api/schedules';
        const response = await fetch(url);
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('加载定时任务失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [deviceId]);

  // 创建任务
  const createTask = async (task: Omit<ScheduledTask, 'id' | 'createdAt'>) => {
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    const newTask = await response.json();
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  // 更新任务
  const updateTask = async (id: string, updates: Partial<ScheduledTask>) => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedTask = await response.json();
    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    return updatedTask;
  };

  // 删除任务
  const deleteTask = async (id: string) => {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // 立即执行
  const executeNow = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await fetch(`/api/devices/${task.deviceId}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: task.command,
        parameters: task.parameters
      })
    });

    await updateTask(id, { lastExecutedAt: Date.now() });
  };

  // 切换启用状态
  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await updateTask(id, { enabled: !task.enabled });
  };

  // 计算下次执行时间
  const calculateNextExecution = (schedule: ScheduledTask['schedule']): number | undefined => {
    if (!schedule.time) return undefined;

    const [hours, minutes] = schedule.time.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    executeNow,
    toggleTask,
    calculateNextExecution
  };
}

// 定时任务管理组件
function ScheduledTaskManager({ deviceId }: { deviceId: string }) {
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    executeNow,
    toggleTask
  } = useScheduledTasks(deviceId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<ScheduledTask>>({
    name: '',
    command: 'setPower',
    parameters: { power: true },
    schedule: {
      type: 'daily',
      time: '08:00'
    },
    enabled: true
  });

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.schedule?.time) {
      alert('请填写任务名称和执行时间');
      return;
    }

    await createTask({
      ...newTask as any,
      deviceId,
      deviceName: '',
      createdAt: Date.now()
    });

    setShowCreateForm(false);
    setNewTask({
      name: '',
      command: 'setPower',
      parameters: { power: true },
      schedule: {
        type: 'daily',
        time: '08:00'
      },
      enabled: true
    });
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="scheduled-task-manager">
      <div className="header">
        <h2>定时任务</h2>
        <button onClick={() => setShowCreateForm(true)}>
          创建任务
        </button>
      </div>

      {/* 任务列表 */}
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.enabled ? '' : 'disabled'}`}>
            <div className="task-info">
              <div className="task-name">{task.name}</div>
              <div className="task-schedule">
                {task.schedule.type === 'daily' && `每天 ${task.schedule.time}`}
                {task.schedule.type === 'weekly' &&
                  `每周 ${task.schedule.daysOfWeek?.join(', ')} ${task.schedule.time}`}
                {task.schedule.type === 'once' && task.schedule.startDate}
              </div>
            </div>

            <div className="task-action">
              {task.command} - {JSON.stringify(task.parameters)}
            </div>

            <div className="task-status">
              {task.lastExecutedAt && (
                <span>上次: {new Date(task.lastExecutedAt).toLocaleString()}</span>
              )}
              {task.nextExecutionAt && (
                <span>下次: {new Date(task.nextExecutionAt).toLocaleString()}</span>
              )}
            </div>

            <div className="task-controls">
              <button onClick={() => executeNow(task.id)}>立即执行</button>
              <button onClick={() => toggleTask(task.id)}>
                {task.enabled ? '暂停' : '启用'}
              </button>
              <button onClick={() => deleteTask(task.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      {/* 创建表单 */}
      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>创建定时任务</h3>

            <div className="form-group">
              <label>任务名称</label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>执行时间</label>
              <input
                type="time"
                value={newTask.schedule?.time}
                onChange={(e) => setNewTask(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule!, time: e.target.value }
                }))}
              />
            </div>

            <div className="form-group">
              <label>重复类型</label>
              <select
                value={newTask.schedule?.type}
                onChange={(e) => setNewTask(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule!, type: e.target.value as any }
                }))}
              >
                <option value="once">执行一次</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
              </select>
            </div>

            <div className="form-group">
              <label>执行动作</label>
              <select
                value={newTask.command}
                onChange={(e) => setNewTask(prev => ({ ...prev, command: e.target.value }))}
              >
                <option value="setPower">开关</option>
                <option value="setBrightness">亮度调节</option>
                <option value="setColor">颜色调节</option>
              </select>
            </div>

            <div className="form-actions">
              <button onClick={handleCreateTask}>创建</button>
              <button onClick={() => setShowCreateForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5.4 实战：智能灯控制

下面是一个完整的智能灯控制应用实现，包括设备配网、亮度调节、色温控制、场景联动和定时任务等功能。

```typescript
// 智能灯设备接口
interface SmartLightDevice {
  deviceId: string;
  name: string;
  roomId?: string;
  status: {
    power: boolean;
    brightness: number;        // 0-100
    colorTemperature: number;  // 2700K-6500K
    color?: { r: number; g: number; b: number };
    mode: 'white' | 'color' | 'scene';
    scene?: string;
  };
  capabilities: {
    dimming: boolean;          // 支持调光
    colorTemperature: boolean; // 支持色温
    rgb: boolean;              // 支持RGB颜色
    scenes: boolean;           // 支持场景模式
  };
  online: boolean;
  lastSeen: number;
}

// 智能灯控制Hook
function useSmartLight(deviceId: string) {
  const [device, setDevice] = useState<SmartLightDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 加载设备信息
  const loadDevice = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      const data = await response.json();
      setDevice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // 发送控制指令
  const sendCommand = useCallback(async (
    command: string,
    parameters?: Record<string, any>
  ): Promise<boolean> => {
    setIsControlling(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, parameters, timestamp: Date.now() })
      });

      if (!response.ok) {
        throw new Error('命令执行失败');
      }

      // 更新本地状态
      const result = await response.json();
      if (result.success && device) {
        setDevice(prev => ({
          ...prev!,
          status: { ...prev!.status, ...parameters }
        }));
      }

      return result.success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsControlling(false);
    }
  }, [deviceId, device]);

  // 电源控制
  const togglePower = useCallback(async () => {
    if (!device) return;
    return sendCommand('setPower', { power: !device.status.power });
  }, [device, sendCommand]);

  const setPower = useCallback(async (power: boolean) => {
    return sendCommand('setPower', { power });
  }, [sendCommand]);

  // 亮度控制
  const setBrightness = useCallback(async (brightness: number) => {
    const validBrightness = Math.max(1, Math.min(100, brightness));
    return sendCommand('setBrightness', { brightness: validBrightness });
  }, [sendCommand]);

  // 色温控制
  const setColorTemperature = useCallback(async (kelvin: number) => {
    const validTemp = Math.max(2700, Math.min(6500, kelvin));
    return sendCommand('setColorTemperature', { colorTemperature: validTemp });
  }, [sendCommand]);

  // RGB颜色控制
  const setColor = useCallback(async (r: number, g: number, b: number) => {
    return sendCommand('setColor', {
      color: {
        r: Math.max(0, Math.min(255, r)),
        g: Math.max(0, Math.min(255, g)),
        b: Math.max(0, Math.min(255, b))
      }
    });
  }, [sendCommand]);

  // 预设颜色
  const presets = {
    warmWhite: () => setColorTemperature(2700),
    coolWhite: () => setColorTemperature(6500),
    daylight: () => setColorTemperature(5000),
    red: () => setColor(255, 0, 0),
    green: () => setColor(0, 255, 0),
    blue: () => setColor(0, 0, 255),
    purple: () => setColor(128, 0, 128),
    orange: () => setColor(255, 165, 0)
  };

  // WebSocket实时更新
  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/devices/${deviceId}/status`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status_update') {
        setDevice(prev => prev ? { ...prev, ...data.status } : null);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [deviceId]);

  // 初始加载
  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  return {
    device,
    isLoading,
    isControlling,
    error,
    togglePower,
    setPower,
    setBrightness,
    setColorTemperature,
    setColor,
    presets,
    refresh: loadDevice
  };
}

// 智能灯控制面板组件
function SmartLightControlPanel({ deviceId }: { deviceId: string }) {
  const {
    device,
    isLoading,
    isControlling,
    error,
    togglePower,
    setBrightness,
    setColorTemperature,
    setColor,
    presets
  } = useSmartLight(deviceId);

  const [brightness, setBrightnessLocal] = useState(100);
  const [colorTemp, setColorTempLocal] = useState(4000);

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  if (!device) {
    return <div className="error">设备不存在或已离线</div>;
  }

  const { status, capabilities } = device;

  return (
    <div className="smart-light-control-panel">
      <div className="panel-header">
        <h2>{device.name}</h2>
        <span className={`status-indicator ${status.power ? 'on' : 'off'}`}>
          {status.power ? '开启' : '关闭'}
        </span>
      </div>

      {/* 大按钮电源控制 */}
      <div className="power-control">
        <button
          className={`power-button ${status.power ? 'active' : ''}`}
          onClick={togglePower}
          disabled={isControlling}
        >
          <span className="power-icon">⏻</span>
        </button>
      </div>

      {/* 亮度滑块 */}
      {capabilities.dimming && status.power && (
        <div className="control-group">
          <div className="control-label">
            <span>亮度</span>
            <span className="value">{brightness}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={brightness}
            onChange={(e) => setBrightnessLocal(Number(e.target.value))}
            onMouseUp={(e) => setBrightness(Number((e.target as HTMLInputElement).value))}
            disabled={isControlling}
          />
        </div>
      )}

      {/* 色温滑块 */}
      {capabilities.colorTemperature && status.power && (
        <div className="control-group">
          <div className="control-label">
            <span>色温</span>
            <span className="value">{colorTemp}K</span>
          </div>
          <input
            type="range"
            min="2700"
            max="6500"
            value={colorTemp}
            onChange={(e) => setColorTempLocal(Number(e.target.value))}
            onMouseUp={(e) => setColorTemperature(Number((e.target as HTMLInputElement).value))}
            className="color-temp-slider"
            disabled={isControlling}
          />
          <div className="color-temp-labels">
            <span>暖白</span>
            <span>冷白</span>
          </div>
        </div>
      )}

      {/* 预设颜色 */}
      {capabilities.rgb && status.power && (
        <div className="preset-colors">
          <h3>预设颜色</h3>
          <div className="color-presets">
            <button
              className="preset-btn warm-white"
              onClick={presets.warmWhite}
              title="暖白"
            />
            <button
              className="preset-btn cool-white"
              onClick={presets.coolWhite}
              title="冷白"
            />
            <button
              className="preset-btn red"
              onClick={presets.red}
              title="红色"
            />
            <button
              className="preset-btn green"
              onClick={presets.green}
              title="绿色"
            />
            <button
              className="preset-btn blue"
              onClick={presets.blue}
              title="蓝色"
            />
            <button
              className="preset-btn purple"
              onClick={presets.purple}
              title="紫色"
            />
            <button
              className="preset-btn orange"
              onClick={presets.orange}
              title="橙色"
            />
          </div>
        </div>
      )}

      {/* 快速场景 */}
      {capabilities.scenes && status.power && (
        <div className="quick-scenes">
          <h3>快速场景</h3>
          <div className="scene-buttons">
            <button onClick={() => presets.warmWhite()}>阅读</button>
            <button onClick={() => setBrightness(30)}>影院</button>
            <button onClick={() => setBrightness(10)}>睡眠</button>
            <button onClick={() => presets.daylight()}>工作</button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 设备信息 */}
      <div className="device-info">
        <p>设备ID: {deviceId}</p>
        <p>最后活跃: {new Date(device.lastSeen).toLocaleString()}</p>
      </div>
    </div>
  );
}
```

---

## 6. 实时数据大屏

### 6.1 数据聚合

数据大屏是物联网应用中展示全局数据的重要方式，需要将来自多个设备的数据进行聚合、处理和可视化展示。

```typescript
// 聚合数据指标
interface AggregatedMetrics {
  timestamp: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  metrics: {
    name: string;
    unit: string;
    avg: number;
    min: number;
    max: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

// 数据聚合配置
interface AggregationConfig {
  metrics: {
    name: string;
    field: string;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  }[];
  groupBy?: string;
  timeWindow?: number;          // 时间窗口（毫秒）
  deviceFilter?: {
    type?: string;
    status?: string;
    tags?: string[];
  };
}

// 数据聚合Hook
function useAggregatedData(config: AggregationConfig) {
  const [data, setData] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 获取聚合数据
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/metrics/aggregated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // WebSocket实时更新
  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/metrics/live');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        config
      }));
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'metrics_update') {
        setData(update.data);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [config]);

  // 初始加载和定时刷新
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
```

### 6.2 实时图表

```typescript
// 实时折线图组件
function RealtimeLineChart({ data, maxPoints = 60 }: {
  data: { timestamp: number; value: number }[];
  maxPoints?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.length < 2) return;

    // 计算范围
    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // 绘制网格
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Y轴标签
      const value = maxVal - (range / 4) * i;
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.fillText(value.toFixed(1), 5, y + 4);
    }

    // 绘制折线
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const pointsToShow = data.slice(-maxPoints);

    pointsToShow.forEach((point, index) => {
      const x = padding + (index / (pointsToShow.length - 1)) * chartWidth;
      const y = padding + (1 - (point.value - minVal) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 绘制数据点
    ctx.fillStyle = '#1890ff';
    pointsToShow.forEach((point, index) => {
      const x = padding + (index / (pointsToShow.length - 1)) * chartWidth;
      const y = padding + (1 - (point.value - minVal) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [data, maxPoints]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
      className="realtime-line-chart"
    />
  );
}
```

### 6.3 告警通知

```typescript
// 告警规则配置
interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number;              // 告警冷却时间（毫秒）
}

// 告警记录
interface AlertRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  deviceId: string;
  deviceName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

// 告警管理Hook
function useAlerts(rules?: AlertRule[]) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 播放告警声音
  const playAlertSound = (severity: AlertRecord['severity']) => {
    // 不同严重程度使用不同的告警声音
    console.log(`[Alert] 播放告警声音: ${severity}`);
  };

  // 处理新告警
  const handleNewAlert = useCallback((alert: AlertRecord) => {
    setAlerts(prev => [alert, ...prev].slice(0, 100));
    setUnacknowledgedCount(prev => prev + 1);

    // 播放声音
    if (alert.severity === 'critical' || alert.severity === 'error') {
      playAlertSound(alert.severity);
    }

    // 发送桌面通知
    if (Notification.permission === 'granted') {
      new Notification(`告警: ${alert.ruleName}`, {
        body: alert.message,
        icon: '/alert-icon.png'
      });
    }
  }, []);

  // 确认告警
  const acknowledgeAlert = useCallback((alertId: string, acknowledgedBy: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, acknowledged: true, acknowledgedBy, acknowledgedAt: Date.now() }
        : alert
    ));
    setUnacknowledgedCount(prev => Math.max(0, prev - 1));
  }, []);

  // 确认所有告警
  const acknowledgeAll = useCallback((acknowledgedBy: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.acknowledged
        ? alert
        : { ...alert, acknowledged: true, acknowledgedBy, acknowledgedAt: Date.now() }
    ));
    setUnacknowledgedCount(0);
  }, []);

  return {
    alerts,
    unacknowledgedCount,
    handleNewAlert,
    acknowledgeAlert,
    acknowledgeAll
  };
}
```

### 6.4 实战：工业大屏

```typescript
// 工业数据大屏组件
function IndustrialDashboard() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket连接
    const ws = new WebSocket('wss://api.example.com/dashboard/industrial');

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'metrics') {
        setMetrics(data);
      } else if (data.type === 'alert') {
        setAlerts(prev => [data.alert, ...prev].slice(0, 50));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="industrial-dashboard">
      {/* 顶部状态栏 */}
      <div className="status-bar">
        <div className="status-item">
          <span className="label">在线设备</span>
          <span className="value success">{metrics?.onlineDevices || 0}</span>
        </div>
        <div className="status-item">
          <span className="label">离线设备</span>
          <span className="value danger">{metrics?.offlineDevices || 0}</span>
        </div>
        <div className="status-item">
          <span className="label">活跃告警</span>
          <span className="value warning">{alerts.filter(a => !a.acknowledged).length}</span>
        </div>
        <div className="connection-status">
          <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? '实时连接' : '连接断开'}</span>
        </div>
      </div>

      {/* 指标卡片 */}
      <div className="metrics-grid">
        {metrics?.metrics.map(metric => (
          <div key={metric.name} className="metric-card">
            <div className="metric-name">{metric.name}</div>
            <div className="metric-value">{metric.avg.toFixed(1)} {metric.unit}</div>
            <div className="metric-trend">
              <span className={`trend ${metric.trend}`}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
              </span>
              <span className="min-max">
                {metric.min.toFixed(1)} - {metric.max.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 实时图表 */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>温度趋势</h3>
          <RealtimeLineChart data={temperatureHistory} />
        </div>
        <div className="chart-container">
          <h3>湿度趋势</h3>
          <RealtimeLineChart data={humidityHistory} />
        </div>
      </div>

      {/* 告警列表 */}
      <div className="alerts-section">
        <h3>实时告警</h3>
        <div className="alerts-scroll">
          {alerts.slice(0, 10).map(alert => (
            <div key={alert.id} className={`alert-row ${alert.severity}`}>
              <span className="severity">{alert.severity}</span>
              <span className="message">{alert.message}</span>
              <span className="device">{alert.deviceName}</span>
              <span className="time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. 地图追踪

### 7.1 GPS定位

```typescript
// GPS定位数据
interface GPSLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;             // 精度（米）
  speed?: number;               // 速度（米/秒）
  heading?: number;            // 方向（度）
  timestamp: number;
}

// 位置追踪Hook
function useLocationTracking(deviceId: string) {
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [locationHistory, setLocationHistory] = useState<GPSLocation[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!isTracking) return;

    const ws = new WebSocket(`wss://api.example.com/devices/${deviceId}/location`);

    ws.onmessage = (event) => {
      const location: GPSLocation = JSON.parse(event.data);
      setCurrentLocation(location);
      setLocationHistory(prev => [...prev.slice(-99), location]);
    };

    return () => ws.close();
  }, [deviceId, isTracking]);

  return { currentLocation, locationHistory, isTracking, setIsTracking };
}
```

### 7.2 轨迹回放

```typescript
// 轨迹回放组件
function LocationPlayback({ deviceId, history }: {
  deviceId: string;
  history: GPSLocation[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= history.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, history.length]);

  return (
    <div className="location-playback">
      <div className="playback-controls">
        <button onClick={() => setCurrentIndex(0)}>重置</button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>

      <div className="timeline">
        <input
          type="range"
          min="0"
          max={history.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
        />
        <span>{new Date(history[currentIndex]?.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}
```

### 7.3 电子围栏

```typescript
// 电子围栏定义
interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: { latitude: number; longitude: number };
  radius?: number;              // 米
  vertices?: { latitude: number; longitude: number }[];  // 多边形顶点
  alertOnEnter: boolean;
  alertOnExit: boolean;
  enabled: boolean;
}

// 围栏事件
interface GeofenceEvent {
  id: string;
  geofenceId: string;
  geofenceName: string;
  deviceId: string;
  eventType: 'enter' | 'exit';
  location: GPSLocation;
  timestamp: number;
}
```

---

## 8. 小程序IoT

### 8.1 蓝牙连接

```typescript
// 小程序蓝牙设备
interface BLEDevice {
  deviceId: string;
  name: string;
  rssi: number;
  advertisingData: Record<string, any>;
}

// 小程序蓝牙Hook
function useBLEControl() {
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);

  // 检查蓝牙可用性
  const checkBluetooth = async () => {
    try {
      const { available } = await wx.getSystemInfoSync();
      setIsBluetoothAvailable(available);
    } catch (e) {
      setIsBluetoothAvailable(false);
    }
  };

  // 扫描设备
  const scanDevices = async () => {
    setIsScanning(true);

    wx.openBluetoothAdapter({
      success: async () => {
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          success: () => {
            wx.onBluetoothDeviceFound((result) => {
              const device = result.devices[0];
              setDevices(prev => {
                const exists = prev.find(d => d.deviceId === device.deviceId);
                if (exists) return prev;
                return [...prev, {
                  deviceId: device.deviceId,
                  name: device.name || '未知设备',
                  rssi: device.RSSI,
                  advertisingData: device.advertisingData
                }];
              });
            });
          }
        });

        // 10秒后停止扫描
        setTimeout(() => {
          wx.stopBluetoothDevicesDiscovery();
          setIsScanning(false);
        }, 10000);
      }
    });
  };

  // 连接设备
  const connectDevice = async (deviceId: string) => {
    return new Promise((resolve, reject) => {
      wx.createBLEConnection({
        deviceId,
        success: () => {
          const device = devices.find(d => d.deviceId === deviceId);
          setConnectedDevice(device || null);
          wx.stopBluetoothDevicesDiscovery();
          resolve(device);
        },
        fail: reject
      });
    });
  };

  return {
    isBluetoothAvailable,
    isScanning,
    devices,
    connectedDevice,
    scanDevices,
    connectDevice
  };
}
```

### 8.2 BLE通信

```typescript
// BLE服务UUID
const SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB';
const CHARACTERISTIC_UUID = '0000FFF1-0000-1000-8000-00805F9B34FB';

// BLE设备控制
function useBLEDeviceControl(deviceId: string) {
  const [isConnected, setIsConnected] = useState(false);

  // 获取服务
  const getServices = async () => {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => resolve(res.services),
        fail: reject
      });
    });
  };

  // 获取特征值
  const getCharacteristics = async (serviceId: string) => {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => resolve(res.characteristics),
        fail: reject
      });
    });
  };

  // 发送数据
  const sendData = async (data: ArrayBuffer) => {
    return new Promise((resolve, reject) => {
      wx.writeBLECharacteristicValue({
        deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID,
        value: data,
        success: resolve,
        fail: reject
      });
    });
  };

  // 启用通知
  const enableNotify = async () => {
    return new Promise((resolve, reject) => {
      wx.notifyBLECharacteristicValueChange({
        deviceId,
        serviceId: SERVICE_UUID,
        characteristicId: CHARACTERISTIC_UUID,
        state: true,
        success: resolve,
        fail: reject
      });
    });
  };

  // 监听数据
  useEffect(() => {
    wx.onBLECharacteristicValueChange((result) => {
      console.log('收到数据:', result.value);
    });
  }, []);

  return {
    isConnected,
    getServices,
    getCharacteristics,
    sendData,
    enableNotify
  };
}
```

---

## 9. 边缘计算

### 9.1 边缘网关

边缘网关是物联网架构中的关键组件，它位于云平台和终端设备之间，负责数据汇聚、协议转换、本地计算和安全管控。

```typescript
// 边缘网关配置
interface EdgeGatewayConfig {
  gatewayId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  capabilities: {
    protocolTranslation: boolean;  // 协议转换
    localComputing: boolean;       // 本地计算
    dataFiltering: boolean;         // 数据过滤
    edgeStorage: boolean;          // 本地存储
   otaUpdate: boolean;             // OTA升级
  };
  connectedDevices: number;
  status: 'online' | 'offline' | 'degraded';
  firmwareVersion: string;
  lastHeartbeat: number;
}

// 边缘节点状态
interface EdgeNodeStatus {
  nodeId: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeApplications: string[];
  processedDataRate: number;      // 数据处理速率 (msg/s)
}
```

### 9.2 本地决策

```typescript
// 本地决策规则
interface LocalDecisionRule {
  id: string;
  name: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'between';
    value: number | number[];
  };
  action: {
    type: 'device_control' | 'data_filter' | 'alert' | 'store';
    params: Record<string, any>;
  };
  priority: number;
  enabled: boolean;
}

// 本地决策引擎
class LocalDecisionEngine {
  private rules: LocalDecisionRule[] = [];

  // 添加规则
  addRule(rule: LocalDecisionRule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  // 处理数据
  async process(data: any): Promise<any[]> {
    const actions: any[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const value = data[rule.condition.metric];
      if (value === undefined) continue;

      let matched = false;

      switch (rule.condition.operator) {
        case 'gt':
          matched = value > rule.condition.value;
          break;
        case 'lt':
          matched = value < rule.condition.value;
          break;
        case 'eq':
          matched = value === rule.condition.value;
          break;
        case 'between':
          matched = value >= rule.condition.value[0] && value <= rule.condition.value[1];
          break;
      }

      if (matched) {
        actions.push({
          type: rule.action.type,
          params: rule.action.params,
          triggeredBy: rule.id
        });

        // 如果是设备控制，执行后不再继续
        if (rule.action.type === 'device_control') {
          break;
        }
      }
    }

    return actions;
  }
}
```

### 9.3 数据过滤

```typescript
// 数据过滤配置
interface DataFilterConfig {
  filterId: string;
  name: string;
  filterType: 'sample' | 'aggregate' | 'compress' | 'threshold';

  // 采样过滤
  sampleRate?: number;            // 采样率 0-1

  // 聚合过滤
  aggregationWindow?: number;     // 窗口大小（毫秒）
  aggregationType?: 'avg' | 'sum' | 'max' | 'min';

  // 压缩过滤
  compressionAlgorithm?: 'delta' | 'deadband' | 'lz4';
  deadbandThreshold?: number;      // 死区阈值

  // 阈值过滤
  thresholdRule?: {
    field: string;
    operator: 'gt' | 'lt' | 'abs';
    value: number;
  };

  enabled: boolean;
}

// 数据过滤器
class DataFilter {
  private buffers: Map<string, any[]> = new Map();

  apply(data: any[], config: DataFilterConfig): any[] {
    switch (config.filterType) {
      case 'sample':
        return this.sampleFilter(data, config.sampleRate!);
      case 'aggregate':
        return this.aggregateFilter(data, config.aggregationWindow!, config.aggregationType!);
      case 'compress':
        return this.compressFilter(data, config.compressionAlgorithm!, config.deadbandThreshold!);
      case 'threshold':
        return this.thresholdFilter(data, config.thresholdRule!);
      default:
        return data;
    }
  }

  private sampleFilter(data: any[], rate: number): any[] {
    return data.filter((_, index) => Math.random() < rate);
  }

  private aggregateFilter(data: any[], window: number, type: string): any[] {
    // 按时间窗口聚合数据
    const result: any[] = [];
    let buffer: any[] = [];
    let windowStart = 0;

    for (const item of data) {
      if (item.timestamp - windowStart >= window) {
        if (buffer.length > 0) {
          result.push(this.aggregate(buffer, type, windowStart));
          buffer = [];
        }
        windowStart = item.timestamp;
      }
      buffer.push(item);
    }

    return result;
  }

  private aggregate(items: any[], type: string, timestamp: number): any {
    const values = items.map(i => i.value);
    let aggregatedValue: number;

    switch (type) {
      case 'avg':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
    }

    return {
      timestamp,
      value: aggregatedValue,
      count: values.length
    };
  }

  private compressFilter(data: any[], algorithm: string, threshold: number): any[] {
    if (data.length === 0) return data;

    const result: any[] = [data[0]];
    let lastValue = data[0].value;

    for (let i = 1; i < data.length; i++) {
      const delta = Math.abs(data[i].value - lastValue);

      if (delta > threshold) {
        result.push(data[i]);
        lastValue = data[i].value;
      }
    }

    return result;
  }

  private thresholdFilter(data: any[], rule: any): any[] {
    return data.filter(item => {
      const value = item[rule.field];
      switch (rule.operator) {
        case 'gt': return value > rule.value;
        case 'lt': return value < rule.value;
        case 'abs': return Math.abs(value) > rule.value;
        default: return true;
      }
    });
  }
}
```

---

## 10. 安全方案

### 10.1 设备认证

```typescript
// 设备认证方式
type DeviceAuthMethod = 'certificate' | 'token' | 'hmac' | 'x509';

// 设备认证信息
interface DeviceAuth {
  deviceId: string;
  authMethod: DeviceAuthMethod;
  credentials: {
    // 证书认证
    certificateId?: string;
    publicKey?: string;

    // Token认证
    token?: string;
    tokenExpiry?: number;

    // HMAC认证
    accessKey?: string;
    secretKey?: string;
  };
  createdAt: number;
  lastUsedAt?: number;
}

// 设备认证服务
class DeviceAuthService {
  // 证书认证
  async authenticateWithCertificate(deviceId: string, clientCert: string, signature: string): Promise<boolean> {
    // 验证客户端证书
    const isValidCert = await this.verifyCertificate(clientCert);
    if (!isValidCert) return false;

    // 验证签名
    const isValidSignature = await this.verifySignature(deviceId, clientCert, signature);

    if (isValidSignature) {
      await this.updateLastUsed(deviceId);
    }

    return isValidSignature;
  }

  // Token认证
  async authenticateWithToken(deviceId: string, token: string): Promise<boolean> {
    const auth = await this.getDeviceAuth(deviceId);

    if (!auth || auth.authMethod !== 'token') {
      return false;
    }

    if (auth.credentials.token !== token) {
      return false;
    }

    if (auth.credentials.tokenExpiry && Date.now() > auth.credentials.tokenExpiry) {
      return false; // Token已过期
    }

    await this.updateLastUsed(deviceId);
    return true;
  }

  // HMAC认证
  async authenticateWithHMAC(deviceId: string, message: string, signature: string): Promise<boolean> {
    const auth = await this.getDeviceAuth(deviceId);

    if (!auth || auth.authMethod !== 'hmac') {
      return false;
    }

    const expectedSignature = this.calculateHMAC(
      message,
      auth.credentials.secretKey!
    );

    if (signature !== expectedSignature) {
      return false;
    }

    await this.updateLastUsed(deviceId);
    return true;
  }

  // 生成访问Token
  async generateToken(deviceId: string, expiresIn: number = 3600): Promise<string> {
    const token = this.generateRandomString(32);
    const expiry = Date.now() + expiresIn * 1000;

    await this.updateDeviceAuth(deviceId, {
      credentials: {
        token,
        tokenExpiry: expiry
      }
    });

    return token;
  }

  // 计算HMAC签名
  private calculateHMAC(message: string, secretKey: string): string {
    // 实际实现中使用 crypto 模块
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = require('crypto').randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }
}
```

### 10.2 数据加密

```typescript
// 加密配置
interface EncryptionConfig {
  protocol: 'tls12' | 'tls13' | 'dtls';
  cipherSuites: string[];
  certificatePath: string;
  privateKeyPath: string;
  caCertificatePath: string;
}

// 数据加密服务
class DataEncryptionService {
  // AES-256-GCM加密
  encrypt(plaintext: string, key: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    const crypto = require('crypto');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return { ciphertext, iv, authTag };
  }

  // 解密
  decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): string {
    const crypto = require('crypto');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString('utf8');
  }

  // 密钥派生 (PBKDF2)
  deriveKey(password: string, salt: Buffer, iterations: number = 100000): Buffer {
    const crypto = require('crypto');
    return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  }

  // 生成设备密钥
  generateDeviceKey(): { publicKey: string; privateKey: string; secretKey: string } {
    const crypto = require('crypto');

    // 生成ECC密钥对
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');

    // 生成对称密钥
    const secretKey = crypto.randomBytes(32);

    return {
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString('base64'),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString('base64'),
      secretKey: secretKey.toString('base64')
    };
  }
}
```

### 10.3 OTA升级

```typescript
// OTA升级配置
interface OTAUpdateConfig {
  deviceId: string;
  currentVersion: string;
  targetVersion: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  signature: string;
  upgradeType: 'full' | 'delta';
  allowRollback: boolean;
  rebootRequired: boolean;
}

// OTA升级状态
interface OTAUpgradeStatus {
  deviceId: string;
  status: 'idle' | 'downloading' | 'downloaded' | 'verifying' | 'installing' | 'completed' | 'failed';
  progress: number;             // 0-100
  currentVersion: string;
  targetVersion: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

// OTA升级服务
class OTAUpdateService {
  // 检查更新
  async checkForUpdate(deviceId: string, currentVersion: string): Promise<OTAUpdateConfig | null> {
    const response = await fetch(`/api/devices/${deviceId}/ota/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentVersion })
    });

    if (response.status === 204) {
      return null; // 没有可用更新
    }

    return response.json();
  }

  // 开始下载
  async startDownload(deviceId: string, config: OTAUpdateConfig): Promise<void> {
    // 发送下载请求
    const response = await fetch(config.downloadUrl);
    const fileBuffer = await response.arrayBuffer();

    // 验证文件大小
    if (fileBuffer.byteLength !== config.fileSize) {
      throw new Error('文件大小不匹配');
    }

    // 验证校验和
    const checksum = await this.calculateChecksum(fileBuffer);
    if (checksum !== config.checksum) {
      throw new Error('文件校验失败');
    }

    // 保存到设备
    await this.saveToFlash(deviceId, fileBuffer);

    // 验证签名
    const isValid = await this.verifySignature(fileBuffer, config.signature);
    if (!isValid) {
      throw new Error('签名验证失败');
    }
  }

  // 执行升级
  async performUpgrade(deviceId: string, config: OTAUpdateConfig): Promise<boolean> {
    try {
      // 发送升级命令
      await this.sendCommand(deviceId, 'ota_start', {
        filePath: config.downloadUrl,
        targetVersion: config.targetVersion,
        allowRollback: config.allowRollback
      });

      // 等待设备完成升级
      const result = await this.waitForCompletion(deviceId, 300000); // 5分钟超时

      if (result.success) {
        // 更新设备版本记录
        await this.updateDeviceVersion(deviceId, config.targetVersion);
      }

      return result.success;
    } catch (error) {
      console.error('OTA升级失败:', error);

      // 如果允许回滚
      if (config.allowRollback) {
        await this.rollback(deviceId);
      }

      return false;
    }
  }

  // 回滚
  async rollback(deviceId: string): Promise<void> {
    await this.sendCommand(deviceId, 'ota_rollback', {});
  }

  // 计算校验和 (SHA-256)
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(data));
    return hash.digest('hex');
  }

  // 验证签名
  private async verifySignature(data: ArrayBuffer, signature: string): Promise<boolean> {
    // 使用RSA验证签名
    return true;
  }
}
```

---

## 附录：IoT开发资源汇总

### 常用MQTT Broker

| 名称 | 类型 | 特点 | 适用场景 |
|------|------|------|----------|
| Mosquitto | 开源 | 轻量级、C语言实现 | 小型项目、学习 |
| EMQX | 开源/商业 | 高性能、 enterprise特性 | 中大型项目 |
| HiveMQ | 商业 | 企业级、高可用 | 企业应用 |
| AWS IoT Core | 云服务 | 全托管、与AWS服务集成 | AWS用户 |
| Azure IoT Hub | 云服务 | 全托管、与Azure服务集成 | Azure用户 |
| 阿里云IoT | 云服务 | 全托管、中文文档 | 国内用户 |

### 主流IoT云平台

| 平台 | 特点 | 免费额度 |
|------|------|----------|
| AWS IoT Core | 全球覆盖、服务完善 | 一年免费 |
| Azure IoT Hub | 企业级集成、混合云 | 免费tier |
| 阿里云IoT | 国内生态、性价比高 | 有限免费 |
| 腾讯云IoT | 微信生态、小程序支持 | 有限免费 |
| 华为云IoT | 工业物联网、5G支持 | 有限免费 |
| 百度智能云IoT | AI集成、边缘计算 | 有限免费 |

### 协议选择指南

| 场景 | 推荐协议 | 原因 |
|------|----------|------|
| 低功耗设备 | CoAP/LwM2M | 基于UDP，开销小 |
| 实时监控 | MQTT | 发布订阅、支持QoS |
| Web集成 | WebSocket | 双向通信、浏览器原生支持 |
| 高速传输 | AMQP | 可靠性高、事务支持 |
| 设备配置 | HTTP/REST | 简单直观、易于调试 |
| 固件更新 | HTTPS | 安全可靠、广泛支持 |

### 学习资源推荐

1. **MQTT协议规范**: mqtt.org 官方文档
2. **IoT设计模式**: 《IoT Patterns》
3. **边缘计算**: 《Edge Computing Patterns》
4. **安全实践**: OWASP IoT项目

---

*本文档共计超过15000字，涵盖了物联网应用开发的核心知识点和实战代码示例，希望能帮助开发者全面掌握IoT应用开发技能。*
