# TCP/IP 协议栈深度解析

> 前言：想象你正在寄一封重要的信件，从写好信纸、装入信封、填写地址、交给邮递员、经过一个个中转站、最终送达收件人手中——计算机网络的数据传输，其实就是这个过程的数字化版本。TCP/IP 协议栈，就是定义这整套"寄信流程"的规则手册。

## 一、协议栈分层架构：邮局的部门分工

### 1.1 为什么需要分层？

在讲 TCP/IP 之前，我们先理解一个根本问题：为什么网络协议要分层？

**类比理解**：

假设你要寄一封信给远在美国的朋友。想象如果只有一个"寄信部门"，它要负责：
- 把信翻译成英语
- 选择运输方式（海运还是航空）
- 规划路线（经过哪些城市）
- 包装防潮、防震
- 处理海关报关

这个人肯定会疯掉！

现实中，邮局有清晰的分工：
- **营业厅**：接收你的信件
- **分拣中心**：决定走哪条路线
- **运输部门**：负责具体运输（飞机/轮船）
- **海关**：处理国际通关

TCP/IP 协议栈也是如此——每一层只专注于自己的任务，层与层之间通过标准接口通信。

### 1.2 TCP/IP 四层模型详解

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层 (Application)                     │
│         HTTP、WebSocket、SMTP、FTP、DNS、SSH                 │
├─────────────────────────────────────────────────────────────┤
│                      传输层 (Transport)                       │
│                    TCP、UDP、SCTP                            │
├─────────────────────────────────────────────────────────────┤
│                      网络层 (Internet)                        │
│                   IP、ICMP、ARP、RARP                        │
├─────────────────────────────────────────────────────────────┤
│                   链路层 (Link) / 网络接口层                  │
│              Ethernet、Wi-Fi、PPP、帧封装/解封装              │
└─────────────────────────────────────────────────────────────┘
```

**每层职责通俗解释**：

| 层级 | 类比 | 职责 | 常见协议 |
|------|------|------|----------|
| 应用层 | 信的内容 | 决定传输什么数据 | HTTP、FTP、SMTP |
| 传输层 | 信封上的收件人 | 确保数据可靠/高效送达 | TCP、UDP |
| 网络层 | 邮政编码+地址 | 规划从哪到哪的路线 | IP |
| 链路层 | 快递公司的运输车 | 实际搬运数据 | Ethernet |

### 1.3 数据封装过程：层层嵌套的信封

当你发送一条"Hello"消息时，数据在各层的表现是这样的：

```
应用层：        "Hello" (纯数据)
                ↓ 添加应用层头
传输层：        [TCP头 | "Hello"]  (数据段/Segment)
                ↓ 添加IP头
网络层：        [IP头 | TCP头 | "Hello"]  (数据包/Packet)
                ↓ 添加帧头/帧尾
链路层：        [帧头 | IP头 | TCP头 | "Hello" | 帧尾]  (帧/Frame)
                ↓ 转换为电信号/光信号
物理层：        101100101101... (比特流)
```

**类比理解**：

这就像你把一封信放进信封，信封放进快递箱，快递箱装进集装箱，集装箱装进货船。每层都加了自己的"包装"和"标签"，到达目的地后，再一层层拆开。

### 1.4 各层数据单位名称

| 层级 | 数据单位 | 典型设备 | 寻址方式 |
|------|----------|----------|----------|
| 应用层 | 消息 (Message) | - | 端口号 |
| 传输层 | 段 (Segment) | 四层交换机 | 端口号 |
| 网络层 | 包 (Packet) | 路由器、三层交换机 | IP地址 |
| 链路层 | 帧 (Frame) | 网卡、交换机 | MAC地址 |

## 二、TCP 协议详解：可靠的快递公司

### 2.1 TCP 的核心特性

TCP（Transmission Control Protocol，传输控制协议）是互联网最核心的协议之一。它的设计目标是**可靠、有序、双向传输**。

**TCP 的四大特性**：

1. **面向连接**：像打电话一样，先建立连接，再传输数据
2. **可靠传输**：发送的数据必须确保对方收到
3. **字节流服务**：数据像水流一样连续传输，不保留消息边界
4. **全双工通信**：可以同时发送和接收数据

**类比理解**：

TCP 就像一个高级快递公司：
- 寄件前要打电话确认对方能收（连接建立）
- 每个包裹都有编号，签收后才算完成（确认机制）
- 如果包裹丢了，免费重寄（重传机制）
- 包裹按顺序到达，不会乱序（排序机制）
- 双方可以同时寄件和收件（全双工）

### 2.2 TCP 头部结构

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          源端口 (16位)         |       目的端口 (16位)         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       序列号 (32位)                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       确认号 (32位)                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| 数据偏移 | 保留 |控制位|            窗口大小                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            校验和 (16位)        |         紧急指针 (16位)       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    选项 (可变长度)                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**各字段解释**：

```javascript
/**
 * TCP 头部字段详解
 *
 * 源端口 (Source Port): 16位，发送方的端口号，像是寄件人的电话号码
 *   - 范围：0-65535
 *   - 客户端通常随机生成，服务器通常是知名端口（80、443等）
 *
 * 目的端口 (Destination Port): 16位，接收方的端口号，像是收件人的电话号码
 *   - HTTP: 80
 *   - HTTPS: 443
 *   - SSH: 22
 *
 * 序列号 (Sequence Number): 32位，数据字节流中的位置编号
 *   - 第一个数据字节的序列号在 SYN 包中指定
 *   - 用于跟踪发送的数据量，确保按序到达
 *
 * 确认号 (Acknowledgment Number): 32位，期望收到的下一个字节的序列号
 *   - 表示"我已经收到了所有序列号小于这个值的字节"
 *
 * 数据偏移 (Data Offset): 4位，TCP 头部的长度
 *   - 以4字节为单位，值范围 5-15
 *   - 标准头部20字节，选项字段可增加长度
 *
 * 控制位 (Control Flags): 6位，各种控制标志
 *   - URG: 紧急指针有效
 *   - ACK: 确认号有效
 *   - PSH: 推送数据给应用层
 *   - RST: 重置连接
 *   - SYN: 同步序列号（建立连接时使用）
 *   - FIN: 结束连接
 *
 * 窗口大小 (Window Size): 16位，接收方缓冲区大小
 *   - 用于流量控制
 *   - 通告本端能接收的数据量
 *
 * 校验和 (Checksum): 16位，头部和数据的校验
 *   - 确保数据在传输过程中没有损坏
 *
 * 紧急指针 (Urgent Pointer): 16位，指向紧急数据的位置
 *   - 只有 URG 标志置1时才有效
 *
 * 选项 (Options): 可变长度，用于各种扩展功能
 *   - MSS（最大报文段长度）
 *   - 时间戳
 *   - 窗口扩大因子
 *   - SACK（选择性确认）
 */

// 常见的控制位组合
const TCP_FLAGS = {
  // SYN: 建立连接请求
  SYN: 0b000010,

  // ACK: 确认应答
  ACK: 0b010000,

  // FIN: 关闭连接请求
  FIN: 0b000001,

  // RST: 重置连接（异常关闭）
  RST: 0b000100,

  // PSH: 推送数据（尽快交付给应用层）
  PSH: 0b001000,

  // 常见组合
  SYN_ACK: 0b010010,  // 同步+确认
  FIN_ACK: 0b010001,  // 结束+确认
};
```

### 2.3 三次握手：像约会一样的建立过程

#### 为什么需要三次握手？

想象这个场景：

你想邀请小红明天一起去看电影：

- **第一次**：你打电话给小红："明天一起去看电影好吗？"
- **第二次**：小红回复："好啊！几点？在哪见面？"
- **第三次**：你回答："下午两点，电影院门口见。"

这样，小红确认了你的邀请，你确认了她的回应，双方达成了共识。

**如果只握两次手会怎样？**

- **第一次**：你发出连接请求，但可能请求超时了
- **第二次**：服务器收到请求，同意连接
- **问题**：如果你的超时请求实际上是"死信"，服务器却在等你的数据，白白浪费资源

**三次握手解决的问题**：

1. 确认双方的发送和接收能力都正常
2. 协商初始序列号
3. 避免历史连接初始化混乱

#### 三次握手详细过程

```
客户端                                    服务器
   │                                        │
   │  ────────── [1] SYN, seq=x ──────────► │  客户端：我要建立连接！
   │                                        │
   │         此时客户端进入 SYN_SENT        │
   │                                        │
   │  ◄──────── [2] SYN+ACK, seq=y,        │  服务器：我同意！这是我的初始序列号
   │              ack=x+1  ──────────────── │
   │                                        │
   │         服务器进入 SYN_RECEIVED         │
   │                                        │
   │  ────────── [3] ACK, seq=x+1, ───────► │  客户端：收到！确认号有效
   │              ack=y+1                   │
   │                                        │
   │         双方进入 ESTABLISHED            │
   │                                        │
   │  ◄═════════ 数据传输 ═══════════════► │
   │                                        │
```

**代码层面的理解**：

```javascript
/**
 * 三次握手过程解析
 *
 * 关键点：
 * 1. 客户端随机生成初始序列号 x
 * 2. 服务器确认收到 x，并发送自己的初始序列号 y
 * 3. 客户端确认收到服务器的序列号
 *
 * 为什么是"x+1"和"y+1"？
 * - 因为 SYN 占用一个序列号
 * - ACK 确认号表示"期望收到的下一个字节"
 */

// 客户端伪代码
const tcpClient = {
  // 客户端维护的状态
  state: 'CLOSED',
  isn: 0,        // 初始序列号（随机生成）

  // 第一次握手：发送 SYN
  sendSYN() {
    this.isn = generateRandomISN();  // 生成随机初始序列号
    this.state = 'SYN_SENT';

    // 构造 SYN 包
    const synPacket = {
      flags: 'SYN',
      seq: this.isn,
      ack: 0,
    };

    sendToServer(synPacket);  // 发送 SYN 包
    console.log(`[客户端] 发送 SYN，序列号=${this.isn}`);
  },

  // 第三次握手：发送 ACK
  receiveSYN_ACK(packet) {
    // 验证确认号是否正确（期望收到我的序列号+1）
    if (packet.ack !== this.isn + 1) {
      throw new Error('确认号错误！');
    }

    this.state = 'ESTABLISHED';

    // 发送 ACK 确认
    const ackPacket = {
      flags: 'ACK',
      seq: this.isn + 1,
      ack: packet.seq + 1,
    };

    sendToServer(ackPacket);
    console.log(`[客户端] 发送 ACK，连接建立成功！`);
  },
};

// 服务器伪代码
const tcpServer = {
  state: 'LISTEN',
  isn: 0,           // 服务器的初始序列号

  // 第二次握手：接收 SYN，发送 SYN+ACK
  receiveSYN(packet) {
    this.isn = generateRandomISN();  // 生成服务器自己的序列号
    this.state = 'SYN_RECEIVED';

    // 确认收到客户端的序列号
    const expectedAck = packet.seq + 1;

    // 构造 SYN+ACK 包
    const synAckPacket = {
      flags: 'SYN+ACK',
      seq: this.isn,
      ack: expectedAck,
    };

    sendToClient(synAckPacket);
    console.log(`[服务器] 发送 SYN+ACK，序列号=${this.isn}`);
  },

  // 完成连接建立
  receiveACK(packet) {
    // 验证 ACK 是否有效
    if (packet.ack === this.isn + 1) {
      this.state = 'ESTABLISHED';
      console.log(`[服务器] 收到有效 ACK，连接建立成功！`);
    }
  },
};

/**
 * 实际浏览器中的 TCP 连接建立（简化）
 *
 * 当你在浏览器中访问 https://example.com 时：
 */

// 1. 浏览器生成随机端口和初始序列号
const clientPort = Math.floor(Math.random() * 65535) + 1024;
const clientISN = Math.floor(Math.random() * 4294967296);

// 2. 构造 HTTP 请求（实际是 TLS 握手先进行）
// GET / HTTP/1.1
// Host: example.com

// 3. TCP 层添加 SYN 标志
// SYN seq=clientISN

// 4. 服务器响应 SYN+ACK
// SYN+ACK seq=serverISN, ack=clientISN+1

// 5. 客户端发送最终 ACK
// ACK seq=clientISN+1, ack=serverISN+1

// 6. 此时双方进入 ESTABLISHED 状态
console.log('TCP 三次握手完成！可以开始传输数据了');
```

#### 序列号的作用

序列号是 TCP 最核心的设计之一，它解决了几个关键问题：

**1. 数据按序到达**：

```
发送方序列号:  100  101  102  103  104  105  106  107  108  109
               |    |    |    |    |    |    |    |    |    |
接收方收到:    ✓    ✓    ✗    ✓    ✓    ✗    ✓    ✓    ✓    ✓
               |    |    |    |    |    |    |    |    |    |
接收方期望:       101  102  103  104  105  106  107  108  109  110
                  ↑    ↑                   ↑
               ACK  ACK  (102-103丢失，发送重复ACK请求重传)
```

**2. 区分新旧数据**：

```
场景：网络延迟导致旧数据"复活"
1. 客户端发送 seq=100, 101, 102, 103
2. 服务器收到并确认
3. 客户端再次发送 seq=100, 101, 102, 103（新数据）
4. 服务器通过序列号知道这是新数据还是旧数据的重传
```

### 2.4 四次挥手：优雅的告别

#### 为什么是四次挥手？

四次挥手比三次握手多一步，原因是**TCP 的全双工特性**。

**类比理解**：

就像两个人打电话：
- **第一次**：你说"我说完了"（发送 FIN）
- **第二次**：小红回应"知道了"（发送 ACK）
- **这时候你还是可以听小红说话**，因为连接还没有完全关闭
- **第三次**：小红说"我也说完了"（发送 FIN）
- **第四次**：你说"好的，再见"（发送 ACK）

这就是为什么需要四次挥手——**每个方向都要单独关闭**。

#### 四次挥手详细过程

```
客户端                                    服务器
   │                                        │
   │  ────────── [1] FIN, seq=u ─────────► │  客户端：我没有数据要发了
   │                                        │
   │         客户端进入 FIN_WAIT_1          │
   │                                        │
   │  ◄──────── [2] ACK, ack=u+1 ───────── │  服务器：我收到你的消息了
   │                                        │
   │         客户端进入 FIN_WAIT_2          │
   │         （等待服务器关闭）              │
   │                                        │
   │              ... ... ...               │
   │         （服务器可能还在发送数据）       │
   │                                        │
   │  ◄──────── [3] FIN, seq=w ──────────── │  服务器：我也说完了
   │                                        │
   │         服务器进入 LAST_ACK           │
   │                                        │
   │  ────────── [4] ACK, ack=w+1 ────────► │  客户端：收到，再见！
   │                                        │
   │         客户端进入 TIME_WAIT          │
   │         （等待 2MSL 后关闭）           │
   │                                        │
   │         服务器进入 CLOSED             │
   │                                        │
```

#### TIME_WAIT 状态的必要性

客户端在发送最后一个 ACK 后，会进入 TIME_WAIT 状态，等待 2MSL（Maximum Segment Lifetime，通常是 60 秒）才关闭连接。

**为什么要等待？**

```javascript
/**
 * TIME_WAIT 的两个重要作用
 */

// 作用1：确保对方能收到最后的 ACK
// 场景：如果最后一个 ACK 丢失了
const scenario1 = () => {
  // 服务器没有收到 ACK，会重发 FIN
  // 如果客户端立即关闭，就无法重发 ACK 了
  // 等待 2MSL 就是为了处理这种情况

  console.log('如果 ACK 丢失，服务器会重发 FIN');
  console.log('客户端在 TIME_WAIT 状态下可以重发 ACK');
};

// 作用2：避免旧连接的延迟数据影响新连接
const scenario2 = () => {
  // 如果不等待，旧连接的延迟数据包可能在新连接中出现
  // 这会造成数据混乱

  console.log('等待旧数据包在网络中自然消失');
  console.log('确保新连接不受旧数据干扰');

  // MSL 通常是 60 秒
  // 2MSL = 120 秒（约2分钟）
};

/**
 * 2MSL 的计算
 *
 * MSL (Maximum Segment Lifetime)：报文段最大生存时间
 * - 网络中报文存活的最长时间
 * - 超过这个时间，报文会被丢弃
 * - 通常设置为 60 秒
 *
 * 为什么是 2MSL？
 * - 1 MSL：等待服务器发送的 FIN 到达
 * - 1 MSL：等待客户端的 ACK 到达服务器
 */

// 实际项目中的问题
const commonIssue = {
  problem: '高并发服务器频繁关闭连接会占用大量 TIME_WAIT 状态的端口',

  solution: '可以通过设置 SO_REUSEADDR 来复用 TIME_WAIT 状态的端口',

  // 在 Node.js 中
  nodejsExample: `
    const server = net.createServer();
    server.on('connection', (socket) => {
      // 设置 SO_REUSEADDR
      socket.setKeepAlive(true);
    });
  `,
};
```

### 2.5 TCP 状态机：连接的一生

```
                    ┌─────────┐
                    │ CLOSED  │
                    └────┬────┘
                         │
         被动打开         │ 主动打开
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
    ┌─────────┐                     ┌──────────┐
    │ LISTEN  │                     │ SYN_SENT │
    └────┬────┘                     └─────┬────┘
         │                               │
   收到SYN │                               │ 收到SYN+ACK
         ▼                               ▼
    ┌──────────┐                     ┌──────────┐
    │SYN_RECEIV│◄────────────────────│ESTABLISHED│
    └────┬─────┘    发送ACK+数据      └─────┬─────┘
         │                                 │
    收到ACK │                                 │ 发送/接收数据
         ▼                                 │
    ┌──────────┐                            │
    │ESTABLISHED│◄───────────────────────────┘
    └────┬─────┘
         │
    主动关闭 │ 被动关闭
         │       │
         ▼       ▼
    ┌────────┐ ┌─────────┐
    │FIN_WAIT│ │ CLOSE_  │
    │_1      │ │WAIT     │
    └────┬───┘ └────┬────┘
         │          │
   收到ACK│     发送 │
         │   FIN    │
         ▼          ▼
    ┌────────┐ ┌─────────┐
    │FIN_WAIT│ │ LAST_   │
    │_2      │ │ACK      │
    └────┬───┘ └────┬────┘
         │          │
   收到  │      收到 │
   FIN   │      ACK  │
         ▼          ▼
    ┌────────┐ ┌─────────┐
    │TIME_   │ │ CLOSED  │
    │WAIT    │ │         │
    │(2MSL)  │ └─────────┘
    └────┬───┘
         │
   超时  │
         ▼
    ┌─────────┐
    │ CLOSED  │
    └─────────┘
```

**各状态说明**：

```javascript
/**
 * TCP 连接状态详解
 */

// 状态转换表
const TCP_STATES = {
  // 初始状态，关闭状态
  CLOSED: {
    description: '连接处于关闭状态，没有活跃的连接',
    transition: '主动打开 → SYN_SENT，被动打开 → LISTEN',
  },

  // 服务器等待连接进入
  LISTEN: {
    description: '服务器正在监听端口，等待客户端连接',
    transition: '收到SYN → SYN_RECEIVED',
  },

  // 主动建立连接，发送SYN后
  SYN_SENT: {
    description: '已发送连接请求，等待对方确认',
    transition: '收到ACK → ESTABLISHED，收到SYN+ACK → ESTABLISHED',
  },

  // 收到SYN，等待确认
  SYN_RECEIVED: {
    description: '收到对方的同步请求，并已发送确认',
    transition: '收到ACK → ESTABLISHED',
  },

  // 连接已建立，可以传输数据
  ESTABLISHED: {
    description: '双方可以正常收发数据，这是最常见的状态',
    transition: '主动关闭 → FIN_WAIT_1，被动关闭 → CLOSE_WAIT',
  },

  // 主动关闭，等待对方的确认
  FIN_WAIT_1: {
    description: '已发送FIN，等待对方确认',
    transition: '收到ACK → FIN_WAIT_2，收到FIN+ACK → TIME_WAIT',
  },

  // 主动关闭，收到对方确认，等待对方关闭
  FIN_WAIT_2: {
    description: '对方已确认关闭，但还在等待对方的关闭请求',
    transition: '收到FIN → TIME_WAIT',
  },

  // 被动关闭，等待本地用户关闭
  CLOSE_WAIT: {
    description: '收到对方的关闭请求，但本地还没有关闭',
    transition: '本地关闭 → LAST_ACK',
  },

  // 被动关闭，已发送FIN，等待最后的确认
  LAST_ACK: {
    description: '已发送FIN，等待对方的最后确认',
    transition: '收到ACK → CLOSED',
  },

  // 等待足够的时间确保对方收到最后的ACK
  TIME_WAIT: {
    description: '主动关闭方等待2MSL，确保连接完全关闭',
    transition: '超时后 → CLOSED',
  },
};

// 常见问题分析
const troubleshooting = {
  // 问题1：连接无法建立
  connectionRefused: {
    cause: '服务器端口未监听，或防火墙阻止',
    solution: '检查服务器进程、防火墙规则',
    debugCommand: 'netstat -an | grep 端口号',
  },

  // 问题2：连接停留在 FIN_WAIT 状态
  finWaitStuck: {
    cause: '对方没有正确关闭连接，或网络问题',
    solution: '检查对方应用程序，设置 TCP 参数',
    debugCommand: 'netstat -an | grep FIN_WAIT',
  },

  // 问题3：端口被占用
  portInUse: {
    cause: 'TIME_WAIT 状态的连接太多，或进程未正确关闭',
    solution: '设置 SO_REUSEADDR，等待连接超时',
    debugCommand: 'netstat -an | grep 端口号',
  },
};
```

### 2.6 滑动窗口：控制流量的"红绿灯"

#### 滑动窗口解决的问题

如果我们一次只发送一个数据包，然后等确认，再发下一个——效率会非常低。就像点外卖，如果每送一份餐就要等顾客吃完再送下一份，外卖小哥要跑很多趟。

滑动窗口允许**一次发送多个数据包**，而不需要等待每个数据包的确认。

#### 滑动窗口工作原理

```
发送方窗口示意：
┌─────────────────────────────────────────────────────────────────┐
│ 已发送并确认 │  已发送未确认  │   可发送   │  不能发送（窗口外）  │
│    1001-2000    2001-3000    3001-4000      4001-5000+           │
└─────────────────────────────────────────────────────────────────┘
      │              │            │                │
      └──────────────┴────────────┴────────────────┘
                   窗口大小 = 3000字节

随着 ACK 到来，窗口向右滑动：
┌─────────────────────────────────────────────────────────────────┐
│ 已发送并确认 │  已发送未确认  │   可发送   │  不能发送（窗口外）  │
│   1001-2000   2001-3000    3001-4000    4001-5000+               │
└─────────────────────────────────────────────────────────────────┘
                   ↑
              收到 ACK 2001，窗口右移
```

**代码实现**：

```javascript
/**
 * 滑动窗口协议实现
 *
 * 核心概念：
 * 1. 发送窗口：允许发送但未确认的数据范围
 * 2. 序列号空间：数据的唯一编号
 * 3. ACK 确认：告诉发送方已经收到多少数据
 */

// 发送方滑动窗口实现
class SendWindow {
  constructor(size) {
    this.size = size;           // 窗口大小
    this.base = 0;              // 窗口起始序列号
    this.nextSeq = 0;          // 下一个可发送的序列号
    this.packets = new Map();   // 已发送但未确认的数据包
    this.timer = null;          // 重传定时器
  }

  /**
   * 发送数据
   * @param {number} seq - 起始序列号
   * @param {Buffer} data - 要发送的数据
   */
  send(seq, data) {
    // 检查窗口是否已满
    if (seq - this.base >= this.size) {
      console.log('窗口已满，等待确认...');
      return false;
    }

    // 构造数据包
    const packet = {
      seq,
      data,
      sentTime: Date.now(),
      ack: false,  // 是否已确认
    };

    // 存入窗口
    this.packets.set(seq, packet);
    this.nextSeq = seq + data.length;

    console.log(`发送数据: seq=${seq}, length=${data.length}`);
    return true;
  }

  /**
   * 处理收到的 ACK
   * @param {number} ackNum - 确认号
   */
  receiveAck(ackNum) {
    // 移动窗口基点
    if (ackNum > this.base) {
      console.log(`收到 ACK: ${ackNum}，移动窗口`);

      // 删除已确认的数据包
      for (const [seq, packet] of this.packets) {
        if (seq < ackNum) {
          this.packets.delete(seq);
        }
      }

      this.base = ackNum;
    }
  }

  /**
   * 超时重传
   * 如果数据包在一定时间内没有收到 ACK，重新发送
   */
  retransmit() {
    const now = Date.now();
    const timeout = 5000; // 5秒超时

    for (const [seq, packet] of this.packets) {
      if (!packet.ack && now - packet.sentTime > timeout) {
        console.log(`数据包 seq=${seq} 超时，重传`);
        // 重新发送数据包
        this.resend(seq, packet.data);
        packet.sentTime = now; // 重置发送时间
      }
    }
  }

  /**
   * 重发指定序列号的数据包
   */
  resend(seq, data) {
    console.log(`重传数据: seq=${seq}`);
    // 实际的网络发送逻辑
  }
}

// 接收方滑动窗口实现
class RecvWindow {
  constructor(size) {
    this.size = size;           // 窗口大小
    this.base = 0;              // 期望收到的下一个序列号
    this.buffer = new Map();    // 接收到的数据缓冲
    this.recvAddr = null;       // 发送方地址
  }

  /**
   * 接收数据
   * @param {number} seq - 数据包的序列号
   * @param {Buffer} data - 数据内容
   */
  receive(seq, data) {
    // 如果是期望的序列号，直接交付
    if (seq === this.base) {
      console.log(`按序收到数据: seq=${seq}, length=${data.length}`);
      this.base += data.length;

      // 检查缓冲区是否有连续的数据可以交付
      this.deliverBuffered();
    }
    // 如果在窗口范围内但不是期望的序列号，缓冲
    else if (seq > this.base && seq < this.base + this.size) {
      console.log(`乱序收到数据，缓冲: seq=${seq}`);
      this.buffer.set(seq, data);
    }
    // 如果在窗口外，忽略
    else {
      console.log(`数据包 seq=${seq} 在窗口外，忽略`);
    }

    // 发送 ACK（累计确认）
    this.sendAck(this.base);
  }

  /**
   * 交付缓冲区中连续的数据
   */
  deliverBuffered() {
    while (this.buffer.has(this.base)) {
      const data = this.buffer.get(this.base);
      console.log(`交付缓冲数据: seq=${this.base}`);

      // 将数据交付给应用层
      this.deliverToApp(data);

      this.buffer.delete(this.base);
      this.base += data.length;
    }
  }

  /**
   * 发送 ACK
   */
  sendAck(ackNum) {
    console.log(`发送 ACK: ${ackNum}`);
  }

  /**
   * 将数据交付给应用层
   */
  deliverToApp(data) {
    // 实际应用中调用回调函数
  }
}

// 使用示例
const sender = new SendWindow(3000);
const receiver = new RecvWindow(3000);

// 模拟发送过程
sender.send(0, Buffer.from('Hello'));      // seq=0, length=5
sender.send(5, Buffer.from(' World'));     // seq=5, length=6
sender.send(11, Buffer.from('!'));          // seq=11, length=1

// 模拟 ACK 到来
console.log('\n--- 模拟 ACK 到来 ---');
receiver.receive(0, Buffer.from('Hello'));
receiver.receive(5, Buffer.from(' World'));
sender.receiveAck(11);  // 确认到 seq=11 之前的数据

console.log('\n--- 模拟丢包和重传 ---');
sender.send(11, Buffer.from('!'));  // 重传
receiver.receive(11, Buffer.from('!'));
sender.receiveAck(12);  // 确认所有数据
```

#### 窗口大小动态调整

```javascript
/**
 * TCP 窗口扩大因子
 *
 * 实际窗口大小 = TCP 头部中的窗口字段 × 扩大因子
 *
 * 场景：如果窗口字段最大只能表示 65535 字节，但网络条件很好
 *       我们想要更大的窗口来提高吞吐量，怎么办？
 */

// 窗口扩大选项
const windowScale = {
  // TCP 头部的窗口字段是 16 位，最大值 65535 字节
  // 但在高带宽网络中，这远远不够

  // 解决方案：协商扩大因子
  // 在三次握手时交换扩大因子

  /**
   * 扩大因子计算
   *
   * 如果扩大因子是 3（2^3 = 8）
   * 那么实际窗口大小 = 窗口字段值 × 8
   *
   * 例如：窗口字段 = 10000，实际窗口 = 80000 字节
   */

  // Node.js 中设置窗口扩大因子
  setWindowScaling: `
    const net = require('net');

    const server = net.createServer((socket) => {
      // 获取当前窗口扩大因子
      const scale = socket['httpSocket']?.npnProtocol === 'http/1.1' ? 1 : 0;

      // 设置 socket 缓冲区大小（间接影响窗口大小）
      socket.setNoDelay(true);
      socket.setKeepAlive(true);
    });
  `,
};
```

### 2.7 拥塞控制：防止网络"堵车"

#### 什么是拥塞控制？

想象一个节日期间的高速公路：
- 平时：100辆车/分钟，畅通无阻
- 节假日：突然涌入10000辆车/分钟，全部堵死

拥塞控制就是用来防止这种"网络堵车"的机制。

#### 拥塞控制的四大算法

```
慢启动 ──────────────────► 拥塞避免
  │                            │
  │  cwnd 达到阈值              │
  ▼                            ▼
┌─────────────────────────────────────┐
│           快速恢复                   │
│   （丢包后，快速重传并恢复）          │
└─────────────────────────────────────┘
```

**1. 慢启动（Slow Start）**：

```javascript
/**
 * 慢启动算法
 *
 * 核心思想：一开始发送少量数据，探测网络容量
 *
 * 就像开车上高速：
 * - 一开始慢慢开，试试刹车灵不灵
 * - 发现没问题，慢慢加速
 * - 达到一定速度后保持匀速行驶
 */

// cwnd: 拥塞窗口大小
// ssthresh: 慢启动阈值

let cwnd = 1;        // 初始拥塞窗口（1个MSS）
let ssthresh = 65535; // 初始阈值（较大值）

/**
 * 发送数据时检查拥塞窗口
 */
function canSend(dataSize) {
  // 实际能发送的大小受限于拥塞窗口和接收方窗口
  return dataSize <= Math.min(cwnd, receiverWindow);
}

/**
 * 收到 ACK 时的处理
 */
function onAck(ackNum) {
  if (cwnd < ssthresh) {
    // 慢启动阶段：每个 ACK 加倍 cwnd
    cwnd *= 2;
    console.log(`慢启动: cwnd = ${cwnd} (加倍)`);
  } else {
    // 拥塞避免阶段：每个 ACK 加 1 个 MSS
    cwnd += 1;
    console.log(`拥塞避免: cwnd = ${cwnd} (加1)`);
  }
}

/**
 * 丢包后的处理
 */
function onLoss() {
  // 触发重传
  retransmit();

  // 调整参数
  ssthresh = cwnd / 2;  // 阈值减半
  cwnd = ssthresh;      // cwnd 回到较小值

  console.log(`丢包: ssthresh = ${ssthresh}, cwnd = ${cwnd}`);
}

/**
 * 模拟慢启动过程
 */
function simulateSlowStart() {
  cwnd = 1;
  ssthresh = 16;

  console.log('慢启动过程模拟:');
  console.log('轮次 | cwnd | 说明');
  console.log('-----|------|------');

  for (let round = 1; round <= 10; round++) {
    console.log(`  ${round}  |  ${cwnd}  | ${cwnd < ssthresh ? '慢启动' : '拥塞避免'}`);

    // 每轮发送 cwnd 大小的数据
    sendData(cwnd);

    // 等待所有数据被确认
    waitForAcks();

    if (cwnd < ssthresh) {
      cwnd *= 2;
    } else {
      cwnd += 1;
    }
  }
}

/**
 * 输出结果示例：
 * 轮次 | cwnd | 说明
 * -----|------|------
 *   1  |  1   | 慢启动
 *   2  |  2   | 慢启动
 *   3  |  4   | 慢启动
 *   4  |  8   | 慢启动
 *   5  |  16  | 慢启动
 *   6  |  17  | 拥塞避免
 *   7  |  18  | 拥塞避免
 *  ...
 */
```

**2. 拥塞避免（Congestion Avoidance）**：

```javascript
/**
 * 拥塞避免算法
 *
 * 核心思想：当 cwnd 达到 ssthresh 后，进入拥塞避免
 *         不再指数增长，而是线性增长，缓慢探测瓶颈
 *
 * 为什么需要拥塞避免？
 * - 慢启动阶段增长太快，可能导致网络拥塞
 * - 接近网络容量时，应该谨慎增加
 */

// 拥塞避免伪代码
function congestionAvoidance() {
  // cwnd 已经超过 ssthresh
  // 每个 RTT（往返时间）增加 cwnd 一个 MSS

  /**
   * 线性增长 vs 指数增长
   *
   * 慢启动（指数）: 1 → 2 → 4 → 8 → 16 → 32
   * 拥塞避免（线性）: 16 → 17 → 18 → 19 → 20 → 21
   *
   * 可以看到，拥塞避免的增长要缓慢得多
   * 这样可以更平稳地接近网络容量
   */
}
```

**3. 快速重传（Fast Retransmit）**：

```javascript
/**
 * 快速重传算法
 *
 * 核心思想：当收到 3 个重复的 ACK 时，不需要等超时，直接重传
 *
 * 为什么是 3 个？
 * - 1 个可能是乱序导致的
 * - 2 个可能是轻微乱序
 * - 3 个基本可以确定是丢包了
 */

function onDuplicateAck(ackNum) {
  dupAckCount++;  // 重复 ACK 计数

  if (dupAckCount >= 3) {
    // 快速重传：立即重传丢失的数据包
    console.log(`收到 3 个重复 ACK，重传 seq=${ackNum}`);
    fastRetransmit(ackNum);

    // 进入快速恢复
    enterFastRecovery();
  }
}

/**
 * 快速重传 vs 超时重传
 *
 * 超时重传：
 * - 需要等很久（超时计时器通常 1-2 秒）
 * - 说明网络可能出了大问题
 * - cwnd 重置为 1
 *
 * 快速重传：
 * - 立即重传，延迟小
 * - 说明网络只是轻微拥塞
 * - cwnd 不用重置为 1
 */
```

**4. 快速恢复（Fast Recovery）**：

```javascript
/**
 * 快速恢复算法
 *
 * 快速重传后，不进入慢启动，而是进入快速恢复
 *
 * 传统快速恢复：
 * ssthresh = cwnd / 2
 * cwnd = ssthresh + 3 * MSS
 *
 * 为什么加 3 个 MSS？
 * - 已经收到 3 个重复 ACK，说明有 3 个数据包在网络中
 * - 这些数据包占用了网络资源
 */

// 现代 TCP 的快速恢复（Reno/NewReno）
function fastRecovery() {
  // 调整阈值和窗口
  ssthresh = cwnd / 2;
  cwnd = ssthresh + 3 * MSS;  // 加 3 个 MSS

  // 重传丢失的包
  retransmitLostPacket();

  // 如果收到新的 ACK，退出快速恢复
  if (receiveNewAck()) {
    cwnd = ssthresh;  // 回到正常大小
    exitFastRecovery();
  }
}

/**
 * 拥塞控制完整流程图
 *
 *         初始状态
 *             │
 *             ▼
 *     ┌───────────────┐
 *     │   慢启动       │
 *     │ cwnd=1        │
 *     └───────┬───────┘
 *             │
 *        cwnd >= ssthresh?
 *           /         \
 *         否           是
 *          \         /
 *           ▼       ▼
 *     ┌───────────────┐
 *     │   拥塞避免     │
 *     │ cwnd += 1     │
 *     └───────┬───────┘
 *             │
 *       检测到丢包?
 *          /     \
 *        超时    3个Dup ACK
 *         │        │
 *         ▼        ▼
 *   ┌──────────┐ ┌──────────┐
 *   │ cwnd=1   │ │快速恢复   │
 *   │ssthresh/2│ │cwnd=ssthresh+3│
 *   └────┬─────┘ └────┬─────┘
 *        │           │
 *        └─────┬─────┘
 *              ▼
 *         返回慢启动/拥塞避免
 */
```

### 2.8 TCP 与 UDP 对比

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接方式 | 面向连接（三次握手） | 无连接 |
| 可靠性 | 可靠传输（确认、重传） | 不可靠，不保证到达 |
| 有序性 | 保证数据按序到达 | 不保证顺序 |
| 流量控制 | 滑动窗口 | 无 |
| 拥塞控制 | 慢启动、拥塞避免等 | 无 |
| 传输速度 | 相对较慢 | 快 |
| 数据边界 | 字节流，无边界 | 保留消息边界 |
| 头部大小 | 20-60 字节 | 8 字节 |
| 适用场景 | HTTP、邮件、文件传输 | 视频通话、DNS、游戏 |

```javascript
/**
 * 实际项目中的选择
 */

// 需要可靠传输 - 使用 TCP
const tcpUseCases = [
  'HTTP/HTTPS 请求',
  'SMTP 邮件发送',
  'FTP 文件传输',
  'SSH 远程连接',
  'WebSocket 通信',
];

// 速度优先、偶尔丢包可接受 - 使用 UDP
const udpUseCases = [
  '视频/音频流媒体',
  '在线游戏（对延迟敏感）',
  'DNS 查询',
  'VoIP 电话',
  '直播推流',
];

// 示例：为什么 DNS 使用 UDP？
const dnsExample = {
  question: 'DNS 为什么不使用 TCP？',

  answer: `
    1. 速度：DNS 查询频繁且通常很小
       - UDP 无需建立连接，速度更快
       - TCP 三次握手会增加延迟

    2. 资源：DNS 服务器要处理大量查询
       - TCP 维护连接消耗更多资源
       - UDP 更轻量级

    3. 简单查询通常很小
       - DNS 查询通常 < 512 字节
       - 适合 UDP 的单数据包模式

    4. 可靠性也有一定保证
       - DNS 客户端会重试
       - 大的 zone transfer 才用 TCP
  `,
};

// 示例：为什么视频通话使用 UDP？
const videoCallExample = {
  question: '视频通话为什么用 UDP 而不是 TCP？',

  reason: `
    1. 实时性比可靠性更重要
       - 视频通话丢一两帧没关系
       - 但如果等 TCP 重传，卡顿会很严重

    2. TCP 的重传会造成延迟累积
       - 每次重传增加几百毫秒延迟
       - 视频通话需要 < 150ms 的延迟

    3. UDP 更灵活
       - 可以在应用层实现自己的纠错机制
       - FEC（前向纠错）可以在丢包时恢复
  `,
};
```

## 三、IP 协议详解：邮政编码系统

### 3.1 IP 地址的作用

IP 地址就像是网络世界的"家庭住址"。有了它，路由器才能知道把数据包送到哪里。

**类比理解**：

```
邮政编码: 100001          IP地址: 192.168.1.100
   │                        │
   │                        │
   ├──省/市                 ├──网络号（标识具体网络）
   │                        │
   └──区/街道               └──主机号（标识具体设备）
```

### 3.2 IPv4 头部结构

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|版本|  头部长度  |    TOS        |         总长度                |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        标识符          |标志|         片偏移                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   生存时间(TTL)  |      协议        |        头部校验和          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         源 IP 地址                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         目的 IP 地址                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         选项 (可选)                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

```javascript
/**
 * IP 头部关键字段解释
 */

// 版本 (Version): 4 位
// IPv4: 0100 (值为 4)
// IPv6: 0110 (值为 6)
const IP_VERSION = {
  IPv4: 4,
  IPv6: 6,
};

// 头部长度 (IHL): 4 位
// 以 4 字节为单位，典型值 5（表示 20 字节头部）
const DEFAULT_HEADER_LENGTH = 5; // 20 字节

// 服务类型 (TOS): 8 位
// 用于 QoS（服务质量）控制
const TOS = {
  // 最小延迟
  Minimize_Delay: 0x10,
  // 最大吞吐量
  Maximize_Throughput: 0x08,
  // 最高可靠性
  Maximize_Reliability: 0x04,
  // 最小成本
  Minimize_Cost: 0x02,
};

// 协议 (Protocol): 8 位
// 标识上层协议
const IP_PROTOCOL = {
  ICMP: 1,    // 互联网控制消息协议
  TCP: 6,     // 传输控制协议
  UDP: 17,    // 用户数据报协议
  IPv6: 41,   // IPv6 封装
  GRE: 47,    // 通用路由封装
  ESP: 50,    // IPSec 加密
  AH: 51,     // IPSec 认证
  OSPF: 89,   // 路由协议
  PIM: 103,   // 组播路由协议
};

// 生存时间 (TTL): 8 位
// 每经过一个路由器减 1，为 0 时数据包被丢弃
// 防止数据包在网络中无限循环
const ttlMechanism = {
  initial: 64,  // Linux 初始值
  windows: 128, // Windows 初始值
  cisco: 255,   // 思科设备初始值

  // 作用：防止路由环路
  mechanism: `
    1. 数据包每经过一个路由器，TTL 减 1
    2. TTL 为 0 时，路由器丢弃数据包
    3. 丢弃时会发送 ICMP 超时消息给源地址
    4. 源主机可以根据这个消息检测到路由问题
  `,
};
```

### 3.3 IPv4 vs IPv6

| 特性 | IPv4 | IPv6 |
|------|------|------|
| 地址长度 | 32 位（4 字节） | 128 位（16 字节） |
| 地址格式 | 192.168.1.1 | 2001:0db8:85a3::8a2e:0370:7334 |
| 地址数量 | ~42 亿 | 340 润（340 × 10^36） |
| 头部大小 | 可变（20-60 字节） | 固定 40 字节 |
| 分片 | 路由器分片 | 仅发送方分片 |
| 安全 | 可选（IPSec） | 内置（IPSec） |
| 配置 | 手动或 DHCP | 自动配置（SLAAC） |
| 广播 | 支持 | 不支持，用组播替代 |

```javascript
/**
 * IPv6 的优势详解
 */

// 1. 超大地址空间
const ipv6Advantage1 = {
  ipv4: '2^32 ≈ 43 亿地址',
  ipv6: '2^128 ≈ 340 润地址',

  analogy: `
    IPv4：能给地球上的每粒沙子分配一个地址
    IPv6：能给宇宙中的每个原子分配一个地址，还有剩余
  `,
};

// 2. 更简单的头部
const ipv6Advantage2 = {
  ipv4Header: '12 个字段，可变长度',
  ipv6Header: '8 个字段，固定长度',

  benefit: `
    路由器处理更快
    硬件转发更简单
  `,
};

// 3. 内置安全
const ipv6Advantage3 = {
  ipsec: 'IPv6 原生支持 IPSec',
  benefit: '端到端加密认证',
};

// 4. 自动配置
const ipv6Advantage4 = {
  slaac: '无状态地址自动配置',
  example: `
    电脑连接到网络
    自动生成 IPv6 地址
    不需要 DHCP 服务器
  `,
};

// IPv6 地址表示法
const ipv6Notation = {
  full: '2001:0db8:0000:0000:0000:0000:0000:0001',

  // 规则1：每组的前导零可以省略
  abbreviated: '2001:db8:0:0:0:0:0:1',

  // 规则2：连续的全零组可以用 :: 替换（只能使用一次）
  final: '2001:db8::1',

  // IPv6 地址类型
  types: {
    unicast: '单播 - 一对一',
    multicast: '组播 - 一对多',
    anycast: '任播 - 一对最近的一个',
  },
};
```

## 四、实战应用场景

### 4.1 HTTP 传输优化

```javascript
/**
 * 理解 TCP 如何影响 HTTP 性能
 */

// 场景1：HTTP/1.1 的队头阻塞问题
const http1Problem = {
  problem: `
    HTTP/1.1 规定一个 TCP 连接只能发送一个请求
    虽然可以用 Keep-Alive 复用连接
    但同一时刻只能有一个请求在传输
  `,

  analogy: `
    就像只有一个车道的高速公路
    前面的车不动，后面的车都得等着
  `,

  solution: `
    - 浏览器通常打开 6-8 个 TCP 连接
    - 资源分域（domain sharding）
    - 雪碧图、文件合并
  `,
};

// 场景2：HTTP/2 的多路复用
const http2Advantage = {
  solution: `
    HTTP/2 在一个 TCP 连接上可以并行发送多个请求
    解决了 HTTP/1.1 的队头阻塞问题
  `,

  mechanism: `
    1. 所有请求都通过一个 TCP 连接传输
    2. 每个请求被分成多个帧
    3. 帧可以交错传输
    4. 接收方通过 Stream ID 重组请求
  `,
};

// 场景3：TCP 握手延迟
const tcpHandshakeLatency = {
  http: `
    HTTP 请求（无 Keep-Alive）:
    TCP 三次握手 → HTTP 请求 → HTTP 响应
    总共 1.5 个 RTT（往返时间）
  `,

  https: `
    HTTPS 请求:
    TCP 三次握手 → TLS 握手 → HTTP 请求 → HTTP 响应
    总共 3 个 RTT 左右
  `,

  optimization: `
    优化方法:
    1. TCP Fast Open (TFO) - 在 SYN 包中携带数据
    2. Session Resumption - 重用 TLS 会话
    3. HTTP Keep-Alive - 复用 TCP 连接
    4. SPDY/HTTP2 - 多路复用
    5. 预连接 (preconnect) - 提前建立连接
  `,
};

// 实际应用：预连接优化
const preconnectExample = {
  html: `
    <!-- 在 <head> 中添加预连接 -->
    <link rel="preconnect" href="https://cdn.example.com">
    <link rel="dns-prefetch" href="https://cdn.example.com">
  `,

  effect: `
    DNS 预取：提前解析域名
    预连接：提前建立 TCP 连接和 TLS 握手
    用户访问时直接发送请求，省去 DNS/TCP/TLS 时间
  `,
};
```

### 4.2 WebSocket 实时通信

```javascript
/**
 * WebSocket 与 TCP 的关系
 */

// WebSocket 建立过程
const websocketEstablish = {
  step1: 'HTTP 请求（携带 Upgrade 头）',
  step2: '服务器返回 101 状态码',
  step3: 'TCP 连接升级为 WebSocket',
  step4: '双方开始双向通信',

  httpHandshake: `
    GET /ws HTTP/1.1
    Host: example.com
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
    Sec-WebSocket-Version: 13
  `,

  serverResponse: `
    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  `,

  explanation: `
    WebSocket 实际上是利用了 HTTP 的 Upgrade 机制
    成功升级后，就不再遵循 HTTP 协议
    而是在 TCP 连接上使用 WebSocket 自己的帧格式
  `,
};

// WebSocket 帧格式
const websocketFrame = {
  opcode: {
    0x0: '继续帧（continuation）',
    0x1: '文本帧',
    0x2: '二进制帧',
    0x8: '关闭帧',
    0x9: 'ping 帧',
    0xA: 'pong 帧',
  },

  benefit: `
    与 TCP 相比的优势:
    1. 有帧边界，不需要自己解析字节流
    2. 内置心跳机制（ping/pong）
    3. 自动关闭处理
    4. 浏览器原生支持
  `,
};
```

### 4.3 文件上传与断点续传

```javascript
/**
 * TCP 在文件传输中的应用
 */

// 断点续传原理
const resumableUpload = {
  concept: `
    1. 文件分片：将大文件分成小块
    2. 记录进度：每片上传成功记录
    3. 中断恢复：从断点继续上传
    4. 合并文件：服务端合并所有分片
  `,

  // 客户端实现
  clientCode: `
    // 1. 检查上传状态
    const status = await checkUploadStatus(fileId);

    // 2. 获取已上传的分片
    const uploadedChunks = status.uploadedChunks; // [0, 1, 2]

    // 3. 从断点继续上传
    for (let i = 0; i < totalChunks; i++) {
      if (!uploadedChunks.includes(i)) {
        await uploadChunk(fileId, i, chunk);
      }
    }

    // 4. 合并分片
    await mergeChunks(fileId);
  `,

  // 服务端实现
  serverCode: `
    // 保存分片到临时文件
    const tempPath = \`/uploads/temp/\${fileId}/chunk_\${chunkIndex}\`;

    // 合并时按顺序读取
    for (let i = 0; i < totalChunks; i++) {
      const chunk = fs.readFileSync(\`/uploads/temp/\${fileId}/chunk_\${i}\`);
      fs.appendFileSync(\`/uploads/completed/\${fileId}\`, chunk);
    }
  `,

  tcpConsideration: `
    TCP 的特性保证了断点续传的可行性:
    1. 可靠传输 - 分片不会丢失或损坏
    2. 顺序传输 - 分片按顺序到达
    3. 流量控制 - 不会因为太快而丢包

    但也需要考虑:
    - 网络波动可能导致分片需要重新上传
    - 使用 MD5/SHA1 校验分片完整性
  `,
};
```

### 4.4 游戏网络同步

```javascript
/**
 * 游戏中的 TCP vs UDP 选择
 */

// 实时对战游戏
const gameNetwork = {
  movement: {
    // 角色移动：适合 UDP
    reason: `
      - 移动数据更新频繁（每秒 10-60 次）
      - 偶尔丢一帧不影响游戏体验
      - TCP 的重传会造成卡顿
    `,
    approach: `
      - 客户端预测移动
      - 服务端校验
      - 客户端应用服务端校正
    `,
  },

  action: {
    // 技能释放/战斗数据：需要 TCP 或自己的可靠 UDP
    reason: `
      - 战斗结果必须准确
      - 丢包会导致游戏逻辑错误
    `,
    approach: `
      - 使用可靠的 UDP 实现（如 ENet、RakNet）
      - 或者直接使用 TCP
    `,
  },

  chat: {
    // 聊天消息：必须 TCP
    reason: '聊天内容必须完整到达，不能丢失',
  },
};

// 帧同步 vs 状态同步
const syncType = {
  frameSync: `
    帧同步（Lockstep）:
    - 所有客户端按照相同的帧序列执行
    - 每个客户端输入相同，结果就相同
    - 典型应用：RTS 游戏（星际争霸）

    优点：省流量，逻辑一致
    缺点：需要等待所有玩家输入
  `,

  stateSync: `
    状态同步（State Synchronization）:
    - 客户端只发送操作，服务端计算结果
    - 服务端广播最新状态
    - 典型应用：MMORPG、MOBA

    优点：防作弊，断线重连快
    缺点：流量大，需要平滑处理
  `,
};
```

## 五、常见问题与调试

### 5.1 TCP 连接排查

```javascript
/**
 * 常用网络诊断命令
 */

// 1. netstat - 查看 TCP 连接状态
const netstatCmd = {
  basic: 'netstat -an | grep TCP',

  // Windows
  windows: `
    netstat -ano | findstr 8080
    // 查看端口 8080 的连接
  `,

  // Linux/Mac
  unix: `
    netstat -an | grep 8080
    lsof -i:8080
  `,

  // 常见状态
  states: `
    LISTEN: 服务端监听中
    ESTABLISHED: 已建立连接
    TIME_WAIT: 等待关闭
    CLOSE_WAIT: 被动关闭等待
    SYN_SENT: 发送连接请求
  `,
};

// 2. telnet/nc - 测试端口连通性
const telnetCmd = {
  test: `
    telnet example.com 80
    // 测试 80 端口是否可达

    nc -zv example.com 80
    // 更简洁的测试方式
  `,
};

// 3. wireshark - 抓包分析
const wiresharkUse = {
  filter: `
    tcp.port == 8080      // 过滤 8080 端口
    tcp.flags.syn == 1    // 过滤 SYN 包
    tcp.flags.fin == 1    // 过滤 FIN 包
    tcp.analysis.retransmission  // 过滤重传包
  `,

  analyze: `
    1. 三次握手：SYN → SYN+ACK → ACK
    2. 数据传输：PSH+ACK → ACK
    3. 四次挥手：FIN → ACK → FIN → ACK
    4. 丢包：ACK 未收到，触发重传
  `,
};

// 4. curl - 测试 HTTP
const curlCmd = {
  basic: 'curl -v https://example.com',

  withHeader: `
    curl -I https://example.com
    // 只看响应头
  `,

  withTiming: `
    curl -w "@curl-format.txt" -o /dev/null -s https://example.com
    // 查看详细时间信息
  `,
};
```

### 5.2 连接性能问题

```javascript
/**
 * 常见 TCP 性能问题及解决方案
 */

// 问题1：高延迟
const highLatency = {
  symptom: 'RTT 过高，打开网页慢',
  cause: ['物理距离远', '路由跳数多', '网络拥塞'],
  solution: ['使用 CDN', '选择优质线路', '就近接入'],
};

// 问题2：带宽受限
const bandwidthLimit = {
  symptom: '下载速度远低于带宽',
  cause: ['拥塞窗口太小', '丢包率高', 'TCP 版本老旧'],
  solution: ['启用 BBR 拥塞控制', '使用 HTTP/2', '升级内核'],
};

// 问题3：连接数限制
const connectionLimit = {
  symptom: '无法建立更多连接',
  cause: ['端口号耗尽', '文件描述符限制', '连接池配置不当'],
  solution: ['复用连接', '调整 ulimit', '使用长连接'],
};

// 问题4：TIME_WAIT 堆积
const timewaitIssue = {
  symptom: '端口被占用，无法监听',
  cause: ['频繁短连接', '高并发关闭'],
  solution: ['启用 SO_REUSEADDR', '使用连接池', '调整 tcp_tw_reuse'],
};

// Linux TCP 参数调优
const tcpTuning = {
  sysctl: `
    # 开启端口复用
    echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse

    # 调整最大连接数
    echo 65535 > /proc/sys/net/core/somaxconn

    # 开启高速缓存
    echo 1 > /proc/sys/net/ipv4/tcp_timestamps

    # 开启窗口扩大
    echo 1 > /proc/sys/net/ipv4/tcp_window_scaling
  `,
};
```

## 六、总结

### 6.1 核心概念回顾

```
TCP/IP 四层模型:
┌──────────────────┐  ← HTTP, WebSocket, DNS
│     应用层       │
├──────────────────┤  ← TCP, UDP
│     传输层       │
├──────────────────┤  ← IP
│     网络层       │
├──────────────────┤  ← Ethernet, Wi-Fi
│     链路层       │
└──────────────────┘

TCP 三次握手:
客户端 ── SYN(seq=x) ──→ 服务器
客户端 ←─ SYN+ACK(seq=y, ack=x+1) ── 服务器
客户端 ── ACK(seq=x+1, ack=y+1) ──→ 服务器
        ↓
    ESTABLISHED

TCP 四次挥手:
客户端 ── FIN ──→ 服务器
客户端 ←─ ACK ── 服务器
客户端 ←─ FIN ── 服务器
客户端 ── ACK ──→ 服务器
        ↓
    TIME_WAIT (2MSL) → CLOSED

滑动窗口:
- 发送窗口：已发送未确认 + 可发送
- 窗口滑动：收到 ACK 后向右移动
- 流量控制：接收方通过窗口大小控制发送方

拥塞控制:
- 慢启动：指数增长 cwnd
- 拥塞避免：线性增长 cwnd
- 快速重传：3 个 Dup ACK 时重传
- 快速恢复：调整 cwnd 后继续传输
```

### 6.2 学习建议

1. **理解分层思想**：每一层只关注自己的职责，层与层之间通过标准接口通信

2. **抓住核心矛盾**：
   - 传输层：可靠 vs 高效
   - 网络层：寻址 vs 路由
   - 链路层：帧封装 vs 透明传输

3. **多做实验**：
   - 使用 Wireshark 抓包观察三次握手/四次挥手
   - 用 netstat 观察连接状态变化
   - 用 curl 测试不同 HTTP 场景

4. **结合实际**：思考每个知识点在项目中的应用，如 HTTP 优化、WebSocket 实时通信等

---

> 下篇预告：《HTTP 协议深度完全指南》—— 从 HTTP/1.1 到 HTTP/3，详解请求方法、状态码、头部字段、缓存机制、CORS 等核心知识。