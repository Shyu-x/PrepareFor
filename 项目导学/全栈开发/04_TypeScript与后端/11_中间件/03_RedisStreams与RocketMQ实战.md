# Redis Streams 与 RocketMQ 实战指南

## 前言：为什么需要 Redis Streams 和 RocketMQ？

在前两篇文章中，我们已经学习了 RabbitMQ 和 Kafka 这两种主流消息队列。但在实际项目中，还有一些场景需要其他方案：

1. **Redis Streams**：当你已经在使用 Redis 作为缓存/存储，不想引入额外的消息队列基础设施时
2. **RocketMQ**：当日志文件、订单系统需要事务消息、顺序消息等企业级特性时

这篇文章将带你深入了解这两种消息方案，掌握它们的使用场景和实战技巧。

---

## 第一章：Redis Streams 深度解析

### 1.1 Redis Streams 是什么？

Redis Streams 是 Redis 5.0 引入的一种**数据结构**，专门用于实现消息队列。它兼具了 Redis 的高性能和消息队列的功能，被很多人称为"Redis 原生的消息队列"。

**为什么选择 Redis Streams？**

想象一下你开了一家小餐厅：
- 用 RabbitMQ/Kafka：需要额外的服务器，运维成本高
- 用 Redis Streams：Redis 已经在用，直接复用，零额外成本

**适用场景**：
- 轻量级消息队列
- 实时数据流处理
- 简单的任务队列
- 需要高性能但不需要 Kafka 全部特性的场景

### 1.2 Redis Streams 核心命令详解

Redis Streams 有自己独特的数据结构和命令，让我们逐个解析：

#### 1.2.1 添加消息：XADD

```python
# Redis Streams 基本命令：XADD（添加消息）
# ================================================

import redis

# 建立 Redis 连接
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# XADD：添加消息到流
# ================================================
# 语法：XADD key ID field value [field value ...]
# - key: 流的名字
# - ID: 消息唯一ID，用 * 表示自动生成
# - field value: 键值对数据

# 示例 1：添加一条简单消息
# XADD mystream * field1 value1 field2 value2
# ID 由 Redis 自动生成，格式是 timestamp-millisecSequence
r.xadd(
    'mystream',               # 流名称
    {'type': 'order_created', 'order_id': 'ORDER_001', 'amount': '299.00'}
)
# 自动生成的 ID 示例：1733123456000-0

# 示例 2：指定 ID 添加消息
# 通常不推荐手动指定 ID，但可以用于特定场景
r.xadd(
    'mystream',
    {'type': 'payment_completed', 'order_id': 'ORDER_001'},
    id='1733123456000-1'  # 手动指定 ID（必须是递增的）
)

# 示例 3：添加多条消息
for i in range(5):
    r.xadd(
        'orders',
        {
            'event': f'order_event_{i}',
            'timestamp': str(int(time.time()))
        }
    )

print("消息添加成功！")
```

#### 1.2.2 读取消息：XRANGE 和 XREAD

```python
# Redis Streams 命令：XRANGE 和 XREAD（读取消息）
# ================================================

# XRANGE：按范围读取消息（适合小批量）
# ================================================
# 语法：XRANGE key start end COUNT count
# - start: 起始 ID，- 表示最小
# - end: 结束 ID，+ 表示最大
# - COUNT: 返回数量限制

# 读取流中的所有消息
messages = r.xrange('orders', '-', '+', count=10)
for msg_id, data in messages:
    print(f"ID: {msg_id}, 数据: {data}")
# 返回格式：[(b'1733123456000-0', {b'field': b'value'}), ...]

# XREAD：实时读取新消息（更适合消费者）
# ================================================
# 语法：XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] ID [ID ...]
# - BLOCK: 阻塞等待模式
# - STREAMS: 要读取的流和起始 ID

# 示例 1：非阻塞读取
# 从 ID 0 开始读取（即从头开始）
# 但更好的方式是记录上次读取到的 ID，实现持久化消费
messages = r.xread(
    {'orders': '0'},  # 从第一条开始
    count=10
)
print(messages)

# 示例 2：阻塞读取最新消息（实时订阅）
# BLOCK 0 表示无限等待，直到有新消息
# $ 表示只读取新消息，不读取历史消息
while True:
    messages = r.xread(
        {'orders': '$'},  # $ 表示最新消息之后
        block=5000  # 阻塞 5 秒，超时返回空
    )
    if messages:
        for stream, msgs in messages.items():
            for msg_id, data in msgs:
                print(f"收到消息: {msg_id} -> {data}")
    else:
        print("5秒内无新消息，继续等待...")
```

#### 1.2.3 消费者组：XGROUP 和 XREADGROUP

这是 Redis Streams 实现**多消费者并行处理**的核心功能！

```python
# Redis Streams 消费者组详解
# ================================================

"""
消费者组概念（类似 Kafka 的 Consumer Group）：

┌─────────────────────────────────────────────────────────────┐
│                      Redis Stream                             │
│  ────────────────────────────────────────────────────────────│
│  ID: 1733123456000-0 → {event: order_1}                      │
│  ID: 1733123456000-1 → {event: order_2}                      │
│  ID: 1733123456000-2 → {event: order_3}                      │
│  ID: 1733123456000-3 → {event: order_4}                      │
│  ID: 1733123456000-4 → {event: order_5}                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────┐   ┌──────────┐   ┌──────────┐
      │ Group A  │   │ Group B  │   │ Group C  │
      │ Consumer1│   │ Consumer1│   │ Consumer1│
      │ [已读: 0-2]│   │ [已读: 0-1]│   │ [已读: 0-0]│
      └──────────┘   └──────────┘   └──────────┘

消费者组特点：
- 同一消费者组内的消费者协同消费消息，不重复
- 不同消费者组独立消费，互不影响
- 每条消息只会被同一组内的一个消费者处理
"""

# 1. 创建消费者组
# ================================================
# 语法：XGROUP CREATE key groupname id-or-$
# - key: 流名称
# - groupname: 消费者组名称
# - id-or-$: 从头开始消费(0) 还是只消费新消息($)

# 创建一个从第一条消息开始消费的消费者组
r.xgroup_create('orders', 'order_processors', id='0', mkstream=True)
# mkstream=True: 如果流不存在，自动创建

# 创建一个只消费新消息的消费者组
r.xgroup_create('orders', 'order_monitors', id='$', mkstream=True)

# 2. 读取消费者组消息：XREADGROUP
# ================================================
# 语法：XREADGROUP GROUP groupname consumername STREAMS key ID [ID ...]
# - GROUP: 消费者组
# - consumername: 消费者名称（通常用 hostname + pid）
# - STREAMS: 要读取的流
# - ID: > 表示读取新消息（未分配的），0 表示从头读取

# 消费者 A 读取消息
messages_a = r.xreadgroup(
    groupname='order_processors',  # 消费者组
    consumername='consumer_A',     # 消费者名称
    streams={'orders': '>'},       # > 表示读取新消息
    count=5                        # 每次最多读取 5 条
)
# 返回：[(stream_name, [(msg_id, data)])]

# 消费者 B 读取消息（会自动分配到不同的消息）
messages_b = r.xreadgroup(
    groupname='order_processors',
    consumername='consumer_B',
    streams={'orders': '>'},
    count=5
)

print(f"消费者A收到: {len(messages_a[0][1]) if messages_a else 0} 条")
print(f"消费者B收到: {len(messages_b[0][1]) if messages_b else 0} 条")

# 3. 确认消息：XACK
# ================================================
# 语法：XACK key groupname ID [ID ...]
# 处理完成后必须确认，否则消息会一直留在 Pending Entries List (PEL)

# 确认已处理的消息
if messages_a:
    for msg_id, _ in messages_a[0][1]:
        r.xack('orders', 'order_processors', msg_id)
        print(f"确认消息: {msg_id}")

# 4. 查看消费者组状态：XINFO GROUPS
# ================================================
# 查看消费者组的详细信息
# pending: 等待确认的消息数
# consumers: 消费者数量
# last_delivered_id: 最后投递的消息 ID

group_info = r.xinfo_groups('orders')
print("消费者组信息:", group_info)
# [
#   {'name': 'order_processors', 'pending': 0, 'consumers': 2, ...},
#   {'name': 'order_monitors', 'pending': 0, 'consumers': 1, ...}
# ]

# 5. 查看待处理消息：XPENDING
# ================================================
# 查看已投递但未确认的消息
pending = r.xpending('orders', 'order_processors')
print("待处理消息:", pending)
# (pel_count, first_msg_id, last_msg_id, [consumers_and_counts])

# 6. 认领消息：XCLAIM
# ================================================
# 当某个消费者挂了，它未确认的消息可以被其他消费者认领
# 语法：XCLAIM key groupname consumername min-idle-time ID [ID ...]

# 认领 10 秒前未被确认的消息（假设原消费者已挂）
claimed = r.xclaim(
    'orders',
    'order_processors',
    'consumer_C',  # 接手的消费者
    min_idle_time=10000,  # 10 秒未活跃
    message_ids=['1733123456000-0', '1733123456000-1']
)
print("认领的消息:", claimed)
```

### 1.3 Redis Streams 完整实战：订单处理系统

```python
# Redis Streams 订单处理系统完整实现
# ================================================

import redis
import json
import time
import threading
from datetime import datetime

class RedisStreamsOrderSystem:
    """
    基于 Redis Streams 的订单处理系统

    功能：
    1. 接收订单创建事件
    2. 异步处理支付、物流、通知
    3. 支持消费者组，多消费者并行处理
    4. 消息确认和重试机制
    """

    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        self.stream_name = 'order_events'
        self.consumer_group = 'order_processors'

        # 初始化消费者组
        self._init_consumer_group()

    def _init_consumer_group(self):
        """初始化消费者组"""
        try:
            # 创建消费者组，从头开始消费
            self.redis.xgroup_create(
                self.stream_name,
                self.consumer_group,
                id='0',
                mkstream=True
            )
            print("消费者组创建成功")
        except redis.ResponseError as e:
            if "BUSYGROUP" in str(e):
                print("消费者组已存在")
            else:
                raise e

    def publish_order_event(self, event_type, order_data):
        """
        发布订单事件

        参数：
        - event_type: 事件类型 (created/paid/shipped/delivered)
        - order_data: 订单数据
        """
        message = {
            'event_type': event_type,
            'order_id': order_data['order_id'],
            'user_id': order_data['user_id'],
            'amount': str(order_data['amount']),
            'items': json.dumps(order_data['items']),
            'timestamp': datetime.now().isoformat()
        }

        msg_id = self.redis.xadd(self.stream_name, message)
        print(f"事件已发布: {event_type} -> {msg_id}")
        return msg_id

    def process_orders(self, consumer_name):
        """
        订单处理器（消费者）

        流程：
        1. 读取消费者组消息
        2. 处理订单逻辑
        3. 确认消息
        """
        print(f"启动订单处理器: {consumer_name}")

        while True:
            try:
                # 读取消息（阻塞模式，5秒超时）
                messages = self.redis.xreadgroup(
                    groupname=self.consumer_group,
                    consumername=consumer_name,
                    streams={self.stream_name: '>'},  # > 表示新消息
                    count=5,
                    block=5000
                )

                if not messages:
                    continue

                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        # 处理订单
                        result = self._handle_order(data)

                        if result:
                            # 处理成功，确认消息
                            self.redis.xack(self.stream_name, self.consumer_group, msg_id)
                            print(f"[{consumer_name}] 已确认: {msg_id}")
                        else:
                            # 处理失败，不确认，稍后会重试
                            print(f"[{consumer_name}] 处理失败: {msg_id}")

            except Exception as e:
                print(f"处理异常: {e}")
                time.sleep(1)

    def _handle_order(self, data):
        """
        处理订单逻辑

        根据事件类型执行不同操作
        """
        event_type = data.get('event_type')
        order_id = data.get('order_id')

        if event_type == 'order_created':
            # 订单创建：验证库存
            print(f"验证订单 {order_id} 的库存...")
            return True

        elif event_type == 'order_paid':
            # 订单支付：确认支付
            print(f"确认订单 {order_id} 支付状态...")
            return True

        elif event_type == 'order_shipped':
            # 订单发货：通知物流
            print(f"通知物流配送订单 {order_id}...")
            return True

        return False

    def start_consumers(self, num_consumers=3):
        """启动多个消费者"""
        threads = []
        for i in range(num_consumers):
            t = threading.Thread(
                target=self.process_orders,
                args=(f'consumer_{i}',)
            )
            t.start()
            threads.append(t)
            print(f"消费者 {i} 已启动")

        return threads

    def get_stream_info(self):
        """获取流信息"""
        info = self.redis.xinfo_stream(self.stream_name)
        print("流信息:", info)

        groups = self.redis.xinfo_groups(self.stream_name)
        print("消费者组:", groups)

    def read_pending_messages(self, consumer_name):
        """读取待处理消息（死信处理）"""
        # 读取未确认的消息
        messages = self.redis.xreadgroup(
            groupname=self.consumer_group,
            consumername=consumer_name,
            streams={self.stream_name: '0'},  # 0 表示读取_pending列表
            count=10
        )

        if messages:
            for stream, msgs in messages:
                for msg_id, data in msgs:
                    print(f"待处理消息: {msg_id} -> {data}")

        return messages

# 使用示例
if __name__ == '__main__':
    system = RedisStreamsOrderSystem()

    # 启动 3 个消费者
    consumer_threads = system.start_consumers(3)

    # 发布一些测试订单
    for i in range(10):
        system.publish_order_event('order_created', {
            'order_id': f'ORDER_{i:04d}',
            'user_id': f'USER_{i % 3}',
            'amount': 100 + i * 10,
            'items': [f'item_{j}' for j in range(i % 3 + 1)]
        })
        time.sleep(0.1)

    # 等待消费者处理
    time.sleep(5)

    # 查看流信息
    system.get_stream_info()

    print("测试完成！")
```

### 1.4 Redis Streams 与 Kafka 对比

| 维度 | Redis Streams | Kafka |
|------|---------------|-------|
| **吞吐量** | 百万级/秒 | 百万级/秒 |
| **消息持久化** | RDB/AOF + Stream | 顺序写入，性能更强 |
| **消息保留** | 基于 PEL，超时删除 | 基于时间/大小，可回溯 |
| **消费者组** | 支持（XPENDING + XCLAIM） | 支持（offset 管理） |
| **分区** | 不支持（单 Stream） | 原生支持 |
| **消息回溯** | 有限（需配合额外存储） | 完全支持 |
| **监控** | Redis 命令 | JMX / 第三方工具 |
| **集群** | Redis Cluster | 原生支持 |
| **适用场景** | 小型系统、简单队列 | 大型系统、复杂流处理 |

---

## 第二章：RocketMQ 深度解析

### 2.1 RocketMQ 是什么？

RocketMQ 是阿里巴巴开源的**分布式消息中间件**，专为应对电商等大规模分布式系统设计。它解决了 Kafka 在事务消息、顺序消息方面的不足，被广泛应用于阿里巴巴和众多企业的生产环境中。

**RocketMQ 的核心优势**：
- **事务消息**：支持本地事务和消息发送的原子性
- **顺序消息**：支持按消息-key 严格排序
- **延迟消息**：支持指定延迟时间投递
- **消息过滤**：支持在 Broker 端过滤，减少无效传输
- **多租户**：支持用户隔离

### 2.2 RocketMQ 核心概念

```
RocketMQ 架构图：

┌─────────────────────────────────────────────────────────────────────────┐
│                           RocketMQ 集群                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│   │   NameServer  │────│   NameServer  │────│   NameServer  │            │
│   │  (注册中心)   │     │  (注册中心)   │     │  (注册中心)   │            │
│   └──────────────┘     └──────────────┘     └──────────────┘            │
│         │                    │                    │                     │
│         └────────────────────┼────────────────────┘                     │
│                              │                                          │
│   ┌──────────────────────────┼──────────────────────────┐               │
│   │                          │                          │               │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│   │ Broker1 │  │ Broker2 │  │ Broker3 │  │ Broker4 │  │ Broker5 │     │
│   │(Master) │  │(Master) │  │(Slave)  │  │(Slave)  │  │(Slave)  │     │
│   │ P-A     │  │ P-B     │  │ P-A     │  │ P-B     │  │ P-C     │     │
│   │ P-C     │  │ P-D     │  │ P-C     │  │ P-D     │  │ P-D     │     │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

核心概念：
- NameServer: 服务注册发现，类似 ZooKeeper
- Broker: 消息存储和转发，是实际工作节点
- Producer: 消息生产者
- Consumer: 消息消费者
- Topic: 消息主题，一级分类
- Tag: 消息标签，二级分类
- Message Queue: 队列，消息存储单元
```

### 2.3 RocketMQ 安装与配置

```bash
# RocketMQ 安装步骤
# ================================================

# 1. 下载 RocketMQ（版本 5.x）
wget https://dlcdn.apache.org/rocketmq/5.3.0/rocketmq-all-5.3.0-bin-release.zip
unzip rocketmq-all-5.3.0-bin-release.zip
cd rocketmq-5.3.0

# 2. 配置环境变量
export ROCKETMQ_HOME="/path/to/rocketmq-5.3.0"
export PATH=$PATH:$ROCKETMQ_HOME/bin

# 3. 修改 Broker 配置（conf/broker.conf）
"""
# Broker 配置示例
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
namesrvAddr = localhost:9876
listenPort = 10911
storePathRootDir = /data/rocketmq/store
autoCreateTopicEnable = true
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
"""

# 4. 启动 NameServer
cd $ROCKETMQ_HOME
nohup ./bin/mqnamesrv &

# 5. 启动 Broker
nohup ./bin/mqbroker -n localhost:9876 -c conf/broker.conf &

# 6. 验证启动
./bin/mqadmin clusterList -n localhost:9876

# 7. 关闭命令
./bin/mqshutdown namesrv
./bin/mqshutdown broker
```

### 2.4 RocketMQ 顺序消息详解

**顺序消息**是指消息按照发送顺序被消费。RocketMQ 通过**Message Queue Selector**实现。

```python
# RocketMQ 顺序消息实现
# ================================================

from rocketmq import Producer, Message
from rocketmq.enums import MessageOrderType

class OrderMessageSystem:
    """
    RocketMQ 顺序消息系统

    场景：订单处理必须按顺序进行
    - 创建订单 → 支付 → 发货 → 签收
    每个订单的消息必须按顺序处理，不能穿插
    """

    def __init__(self):
        # 创建 Producer
        self.producer = Producer(
            group='order_producer_group',  # 生产者组
            order=True  # 开启顺序消息
        )
        self.producer.set_name_server_address('localhost:9876')
        self.producer.start()

    def send_order_message(self, order_id, step, content):
        """
        发送顺序消息

        参数：
        - order_id: 订单ID，作为顺序Key
        - step: 订单步骤（1创建 2支付 3发货 4签收）
        - content: 消息内容
        """
        # 创建消息
        msg = Message('order_topic')  # Topic
        msg.set_keys(order_id)        # 消息key，用于搜索
        msg.set_tags(f'step_{step}')  # 消息tag，二级分类

        # 顺序消息关键：使用 OrderID 作为选择键
        # 相同 OrderID 的消息会被发送到同一个队列
        # 这样保证了同一订单的消息按顺序消费
        msg.set_property('order_id', order_id)

        # 设置消息体
        msg.set_body(f'{order_id} - {step} - {content}')

        # 发送消息（使用 order_id 作为选择键）
        result = self.producer.send(
            msg,
            order_id=order_id  # 顺序选择键
        )

        print(f"发送顺序消息: {order_id} 步骤{step}, 结果: {result.status}")

    def send_order_sequence(self, order_id):
        """发送订单完整流程消息"""
        steps = [
            (1, 'order_created', '订单已创建'),
            (2, 'order_paid', '订单已支付'),
            (3, 'order_shipped', '商品已发货'),
            (4, 'order_delivered', '商品已签收')
        ]

        for step, tag, desc in steps:
            self.send_order_message(order_id, step, desc)
            import time
            time.sleep(0.1)  # 模拟处理时间

    def shutdown(self):
        """关闭 Producer"""
        self.producer.shutdown()


class OrderConsumer:
    """
    顺序消息消费者

    注意：顺序消息的消费必须使用 MessageOrderListener
    """

    def __init__(self):
        self.consumer = Producer(
            group='order_consumer_group',
            order=True  # 开启顺序消费
        )
        self.consumer.set_name_server_address('localhost:9876')

        # 订阅 Topic
        self.consumer.subscribe('order_topic', '*')

        # 注册消息处理函数
        self.consumer.register_message_handler(self._message_handler)

        self.consumer.start()

    async def _message_handler(self, msg):
        """
        顺序消息处理函数

        返回值：
        - ConsumeOrderlyStatus.SUCCESS: 消费成功
        - ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT: 暂停，稍后重试
        """
        order_id = msg.get_property('order_id')
        body = msg.body.decode()

        print(f"处理消息: {body}")

        # 模拟处理逻辑
        if 'step_1' in msg.tags:
            print(f"  -> 验证订单 {order_id}")
        elif 'step_2' in msg.tags:
            print(f"  -> 确认支付 {order_id}")
        elif 'step_3' in msg.tags:
            print(f"  -> 发货 {order_id}")
        elif 'step_4' in msg.tags:
            print(f"  -> 确认签收 {order_id}")

        # 返回成功状态
        return ConsumeOrderlyStatus.SUCCESS

    def shutdown(self):
        self.consumer.shutdown()


# 使用示例
if __name__ == '__main__':
    # 发送顺序消息
    producer = OrderMessageSystem()
    producer.send_order_sequence('ORDER_001')
    producer.send_order_sequence('ORDER_002')
    producer.shutdown()

    # 启动消费者（会按顺序消费消息）
    consumer = OrderConsumer()
    time.sleep(30)  # 等待消费
    consumer.shutdown()
```

### 2.5 RocketMQ 事务消息详解

事务消息是 RocketMQ 最强大的特性之一，解决了"本地事务成功但消息发送失败"的问题。

```python
# RocketMQ 事务消息实现
# ================================================

"""
事务消息原理（半消息机制）：

┌─────────────────────────────────────────────────────────────────┐
│                     事务消息流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Producer 发送半消息（Half Message）                           │
│     ├── 消息进入 RocketMQ，但标记为"不可见"                       │
│     └── Consumer 此时看不到这条消息                               │
│                                                                  │
│  2. 执行本地事务                                                  │
│     ├── 创建订单                                                  │
│     ├── 扣减库存                                                  │
│     └── 数据库操作                                                │
│                                                                  │
│  3. 本地事务结果上传                                              │
│     ├── 成功 → Commit（消息对 Consumer 可见）                      │
│     └── 失败 → Rollback（消息删除）                               │
│                                                                  │
│  4. 如果 Producer 宕机，RocketMQ 回调检查本地事务状态              │
│     └── 未决事务会触发回查                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
"""

from rocketmq import Producer, TransactionMQProducer
from rocketmq.consumer import TransactionListener

class TransactionOrderSystem:
    """
    事务消息订单系统

    确保：订单创建和库存扣减要么同时成功，要么同时失败
    """

    def __init__(self):
        # 创建事务 Producer
        self.producer = TransactionMQProducer(
            group='transaction_order_producer',
            transaction_listener=self._transaction_listener  # 事务监听器
        )
        self.producer.set_name_server_address('localhost:9876')
        self.producer.start()

    def _transaction_listener(self, msg, user_data):
        """
        事务监听器

        参数：
        - msg: RocketMQ 消息
        - user_data: 发送时传入的附加数据

        返回：
        - TransactionStatus.COMMIT: 提交，消息可见
        - TransactionStatus.ROLLBACK: 回滚，消息删除
        - TransactionStatus.UNKNOWN: 未知，稍后回查
        """
        print(f"事务回查: {msg.body.decode()}, user_data: {user_data}")

        # 检查本地事务状态
        # 这里应该查询数据库确认订单是否创建成功
        order_id = user_data.get('order_id')
        order_exists = self._check_order_exists(order_id)

        if order_exists:
            print(f"  -> 订单 {order_id} 存在，提交事务")
            return TransactionStatus.COMMIT
        else:
            print(f"  -> 订单 {order_id} 不存在，回滚事务")
            return TransactionStatus.ROLLBACK

    def _check_order_exists(self, order_id):
        """检查订单是否存在（模拟）"""
        # 实际应该查询数据库
        return True

    def create_order_with_transaction(self, order_id, user_id, items):
        """
        使用事务消息创建订单

        流程：
        1. 发送半消息
        2. 执行本地事务（创建订单 + 扣减库存）
        3. 根据本地事务结果提交或回滚
        """
        # 构造消息
        msg = Message('transaction_order_topic')
        msg.set_keys(order_id)
        msg.set_body(json.dumps({
            'order_id': order_id,
            'user_id': user_id,
            'items': items
        }))

        # 附加数据（回查时会用到）
        user_data = {'order_id': order_id, 'user_id': user_id}

        try:
            # 发送事务消息
            # 这个方法会先发送半消息，然后调用 _transaction_listener
            result = self.producer.send_transaction(msg, user_data)
            print(f"事务消息发送结果: {result.status}")

        except Exception as e:
            print(f"发送失败: {e}")
            # 发送失败，本地事务需要回滚

    def shutdown(self):
        self.producer.shutdown()


# 完整的事务消息示例（包含本地事务执行）
class TransactionOrderService:
    """
    完整的事务消息订单服务
    """

    def __init__(self):
        self.producer = TransactionMQProducer(
            group='transaction_producer',
            transaction_listener=TransactionListenerImpl()
        )
        self.producer.set_name_server_address('localhost:9876')
        self.producer.start()

    def create_order(self, order_id, user_id, items):
        """
        创建订单

        这个方法在一个事务中执行：
        1. 创建订单记录
        2. 扣减库存
        3. 发送消息（半消息）
        """
        msg = Message('order_transaction_topic')
        msg.set_body(json.dumps({
            'order_id': order_id,
            'user_id': user_id,
            'items': items
        }))

        # 发送事务消息（本地事务由 listener 执行）
        self.producer.send_transaction(msg, {'order_id': order_id})

    def shutdown(self):
        self.producer.shutdown()


class TransactionListenerImpl(TransactionListener):
    """
    事务监听器实现

    需要实现两个方法：
    - executeLocalTransaction: 执行本地事务
    - checkLocalTransaction: 回查本地事务
    """

    def execute_local_transaction(self, msg, user_data):
        """
        执行本地事务

        这里应该：
        1. 创建订单
        2. 扣减库存
        3. 返回事务结果
        """
        order_id = user_data.get('order_id')

        try:
            # 1. 创建订单
            self._create_order(order_id, msg.body)

            # 2. 扣减库存
            self._deduct_inventory(order_id)

            # 3. 返回成功，提交消息
            print(f"本地事务执行成功: {order_id}")
            return TransactionStatus.COMMIT

        except Exception as e:
            print(f"本地事务执行失败: {e}")
            return TransactionStatus.ROLLBACK

    def check_local_transaction(self, msg, user_data):
        """
        回查本地事务

        当 RocketMQ 长时间未收到事务结果时，会调用此方法
        """
        order_id = user_data.get('order_id')

        # 查询数据库确认订单状态
        order = self._query_order(order_id)

        if order and order['status'] == 'created':
            return TransactionStatus.COMMIT
        else:
            return TransactionStatus.ROLLBACK

    def _create_order(self, order_id, body):
        """创建订单（模拟数据库操作）"""
        print(f"  创建订单: {order_id}")

    def _deduct_inventory(self, order_id):
        """扣减库存（模拟）"""
        print(f"  扣减库存: {order_id}")

    def _query_order(self, order_id):
        """查询订单（模拟）"""
        return {'order_id': order_id, 'status': 'created'}
```

### 2.6 RocketMQ 延迟消息详解

```python
# RocketMQ 延迟消息实现
# ================================================

"""
RocketMQ 延迟消息支持：

延迟级别（不支持任意时间）：
- 1s 5s 10s 30s
- 1m 2m 3m 4m
- 5m 6m 7m 8m 9m
- 10m 20m 30m 1h 2h

如果需要任意时间，可以使用RocketMQ 5.0的定时消息特性
"""

from rocketmq import Producer, Message

class DelayMessageSystem:
    """
    延迟消息系统

    场景：
    - 订单超时取消：下单后 30 分钟未支付自动取消
    - 重试机制：处理失败后延迟重试
    - 定时通知：预约成功后，定时发送提醒
    """

    def __init__(self):
        self.producer = Producer('delay_producer_group')
        self.producer.set_name_server_address('localhost:9876')
        self.producer.start()

    def send_delay_message(self, order_id, delay_level):
        """
        发送延迟消息

        参数：
        - order_id: 订单ID
        - delay_level: 延迟级别（1=1秒, 2=5秒, 3=10秒...）
        """
        msg = Message('delay_order_topic')
        msg.set_keys(order_id)
        msg.set_body(f'订单超时检查: {order_id}')
        msg.set_delay_time_level(delay_level)  # 设置延迟级别

        result = self.producer.send(msg)
        print(f"延迟消息已发送: {order_id}, 延迟级别: {delay_level}")

        return result

    def send_order_timeout_check(self, order_id):
        """
        发送订单超时检查消息（30分钟后检查）

        delay_level 16 = 1h，但 RocketMQ 4.x 最大只支持 2h
        """
        # 发送延迟消息，30 分钟后再检查
        self.send_delay_message(order_id, delay_level=7)  # 30m

    def send_retry_message(self, task_id, retry_count):
        """
        发送重试消息

        失败后按指数退避重试：
        - 第1次: 10秒
        - 第2次: 30秒
        - 第3次: 1分钟
        """
        delay_levels = {1: 3, 2: 5, 3: 6}  # 10s, 30s, 1m

        level = delay_levels.get(retry_count, 6)
        msg = Message('retry_topic')
        msg.set_keys(task_id)
        msg.set_body(f'重试任务: {task_id}, 第{retry_count}次')
        msg.set_delay_time_level(level)

        self.producer.send(msg)
        print(f"重试消息已发送: {task_id}, 延迟: {level}")

    def shutdown(self):
        self.producer.shutdown()


# 延迟消息消费者
class DelayMessageConsumer:
    """
    延迟消息消费者

    接收延迟消息，执行超时检查等逻辑
    """

    def __init__(self):
        self.consumer = PushConsumer('delay_consumer_group')
        self.consumer.set_name_server_address('localhost:9876')
        self.consumer.subscribe('delay_order_topic', '*')
        self.consumer.register_message_handler(self._handler)
        self.consumer.start()

    def _handler(self, msg):
        """消息处理"""
        order_id = msg.get_keys()
        print(f"收到延迟消息: {order_id}")

        # 检查订单状态
        order_status = self._check_order_status(order_id)

        if order_status == 'pending':
            # 仍未支付，取消订单
            self._cancel_order(order_id)
        else:
            # 已支付，无需处理
            print(f"订单 {order_id} 已支付，忽略")

        return ConsumeStatus.SUCCESS

    def _check_order_status(self, order_id):
        """检查订单状态"""
        return 'pending'

    def _cancel_order(self, order_id):
        """取消订单"""
        print(f"订单 {order_id} 超时，已取消")

    def shutdown(self):
        self.consumer.shutdown()
```

---

## 第三章：消息队列对比与选型实战

### 3.1 四种消息队列终极对比

| 维度 | Redis Streams | RabbitMQ | Kafka | RocketMQ |
|------|---------------|----------|-------|----------|
| **吞吐量** | ~100万/秒 | ~10万/秒 | ~100万/秒 | ~50万/秒 |
| **消息延迟** | 微秒级 | 微秒级 | 毫秒级 | 毫秒级 |
| **消息持久化** | RDB/AOF | 可持久化 | 顺序写入 | 异步/同步 |
| **事务消息** | 不支持 | 不支持 | Exactly-Once | 原生支持 |
| **顺序消息** | 不支持 | 队列内有序 | 分区有序 | 全局有序 |
| **延迟队列** | 支持 | 原生支持 | 需插件 | 原生支持 |
| **死信队列** | 手动实现 | 原生支持 | 需配置 | 原生支持 |
| **消息回溯** | 有限 | 不支持 | 完全支持 | 支持 |
| **消费者组** | 支持 | 支持 | 支持 | 支持 |
| **多租户** | 需 Redis Cluster | 虚拟主机 | 原生支持 | 支持 |
| **运维难度** | 低 | 中 | 高 | 中 |
| **适用规模** | 小型 | 中型 | 大型 | 大型 |
| **事务支持** | 无 | 无 | Exactly-Once | 事务消息 |

### 3.2 选型决策流程图

```
                    ┌─────────────────────────────────┐
                    │      消息队列选型决策流程          │
                    └─────────────────────────────────┘

开始 ──→ 需要处理多少数据？
           │
           ├─ < 1万/秒 ──→ Redis Streams 或 RabbitMQ
           │                 │
           │                 ├─ 已有 Redis ──→ Redis Streams
           │                 └─ 需要丰富路由 ──→ RabbitMQ
           │
           ├─ 1-10万/秒 ──→ RabbitMQ 或 Kafka
           │                 │
           │                 ├─ 需要延迟/死信 ──→ RabbitMQ
           │                 └─ 需要高吞吐/日志 ──→ Kafka
           │
           └─ > 10万/秒 ──→ Kafka 或 RocketMQ
                            │
                            ├─ 需要事务消息 ──→ RocketMQ
                            ├─ 需要顺序消息 ──→ RocketMQ
                            └─ 日志/大数据 ──→ Kafka
```

### 3.3 实际项目选型建议

**选 Redis Streams 的场景**：
- 小型项目，不想额外引入基础设施
- 已有 Redis，需要简单的任务队列
- 消息量不大（<1万/秒），不需要复杂功能

**选 RabbitMQ 的场景**：
- 需要复杂路由（多交换机、多绑定）
- 需要延迟队列、优先级队列
- 需要死信队列处理失败消息
- 中小型项目，团队熟悉 Erlang/OTP

**选 Kafka 的场景**：
- 日志收集、分析系统
- 需要消息回溯和重放
- 与大数据生态集成（Spark、Flink）
- 超高吞吐量（>10万/秒）

**选 RocketMQ 的场景**：
- 电商订单系统（需要事务消息）
- 需要严格顺序消息
- 金融支付系统
- 需要多租户隔离

### 3.4 混合使用最佳实践

```python
# 混合使用架构示例
# ================================================

"""
最佳实践：根据消息类型选择合适的队列

┌─────────────────────────────────────────────────────────────────┐
│                        混合消息架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   用户行为数据 ──────────→ Kafka ──────────→ 实时分析 (Flink)    │
│                            │                                     │
│                            └──→ 数据湖 (HDFS)                     │
│                                                                  │
│   业务消息 ───────────────→ RocketMQ ──────────→ 订单服务        │
│                            │                    ├── 库存服务      │
│                            │                    └── 通知服务       │
│                                                                  │
│   定时任务 ───────────────→ RabbitMQ ──────────→ 延迟队列       │
│                            │                    ├── 超时检测     │
│                            │                    └── 定时清理      │
│                                                                  │
│   缓存同步 ───────────────→ Redis Streams ──→ 缓存更新         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

规则：
1. 日志/分析 → Kafka（高吞吐、可回溯）
2. 订单/支付 → RocketMQ（事务消息、顺序消息）
3. 定时/延迟 → RabbitMQ（延迟队列原生支持）
4. 轻量任务 → Redis Streams（零成本、简单场景）
"""

class MessageQueueStrategy:
    """
    消息队列策略选择器

    根据消息特征选择最合适的消息队列
    """

    @staticmethod
    def choose_queue(message_type, requirements):
        """
        选择消息队列

        参数：
        - message_type: 消息类型
        - requirements: 需求列表

        返回：
        - queue_type: 推荐的队列类型
        - reason: 选择原因
        """
        if message_type == 'log' or message_type == 'analytics':
            return 'Kafka', '高吞吐，支持回溯，适合日志分析'

        elif message_type == 'order':
            if 'transaction' in requirements:
                return 'RocketMQ', '支持事务消息，确保订单和库存一致性'
            elif 'order' in requirements:
                return 'RocketMQ', '支持顺序消息，确保订单处理顺序'
            else:
                return 'Kafka', '高吞吐，适合大量订单'

        elif message_type == 'notification':
            return 'RabbitMQ', '支持多种交换机类型，路由灵活'

        elif message_type == 'task':
            if 'delay' in requirements:
                return 'RabbitMQ', '延迟队列原生支持，实现简单'
            else:
                return 'Redis Streams', '轻量级任务，零额外成本'

        elif message_type == 'cache_sync':
            return 'Redis Streams', '轻量同步，已有 Redis，无需额外基础设施'

        else:
            return 'RabbitMQ', '通用队列，功能全面'
```

---

## 第四章：生产环境配置与最佳实践

### 4.1 Redis Streams 生产配置

```python
# Redis Streams 生产环境配置
# ================================================

import redis

# 生产环境的 Redis 配置
redis_config = {
    'host': 'redis-cluster.internal',
    'port': 6379,
    'db': 0,
    'decode_responses': True,
    'password': 'redis_password',

    # 连接池配置
    'max_connections': 50,

    # 超时配置
    'socket_timeout': 5,
    'socket_connect_timeout': 5,

    # 重试配置
    'socket_keepalive': True,
    'retry_on_timeout': True,
}

# 推荐的生产配置
class RedisStreamsConfig:
    """
    Redis Streams 生产配置
    """

    # 1. 消费者组配置
    @staticmethod
    def create_consumer_group(stream, group, start_id='0'):
        """
        创建消费者组

        参数：
        - stream: 流名称
        - group: 消费者组名称
        - start_id: 起始ID，0表示从头，$表示只消费新消息
        """
        return f'XGROUP CREATE {stream} {group} {start_id} MKSTREAM'

    # 2. 消息持久化配置
    # 确保 Redis 配置了 RDB + AOF 持久化
    # appendonly yes
    # appendfsync everysec
    # rdbcompression yes
    # rdbchecksum yes

    # 3. 内存配置
    # maxmemory 8gb
    # maxmemory-policy allkeys-lru

    # 4. 监控命令
    @staticmethod
    def get_stream_stats(r, stream):
        """获取流统计信息"""
        info = r.xinfo_stream(stream)
        return {
            'length': info.get('length'),
            'first_entry': info.get('first-entry'),
            'last_entry': info.get('last-entry'),
            'groups': r.xinfo_groups(stream)
        }

    # 5. 清理策略
    # XTRIM 或 XADD 时自动限制长度
    @staticmethod
    def trim_stream(r, stream, max_len=10000):
        """裁剪流，保留最近的消息"""
        r.xtrim(stream, max_len, approximate=True)
```

### 4.2 RocketMQ 生产配置

```python
# RocketMQ 生产环境配置
# ================================================

"""
RocketMQ 生产环境配置要点：

1. Broker 配置
   - 多副本部署
   - 同步刷盘保证数据安全
   - 消息压缩

2. NameServer 集群
   - 至少 2 个节点
   - 跨机房部署

3. Producer 配置
   - 消息重试
   - 超时配置
   - 事务消息监听

4. Consumer 配置
   - 并发消费数
   - 消息拉取间隔
   - 消费失败处理
"""

from rocketmq import Producer, PushConsumer
from rocketmq.enums import ConsumeMode, MessageOrderType

# 生产者配置
producer_config = {
    'group': 'my-producer-group',
    'namesrv_address': 'localhost:9876',

    # 发送重试
    'retry_times': 3,
    'retry_time_diff': 1000,  # 重试间隔

    # 发送超时
    'send_timeout': 3000,  # 3 秒

    # 批量发送
    'batch_size': 256,
}

# 消费者配置
consumer_config = {
    'group': 'my-consumer-group',
    'namesrv_address': 'localhost:9876',

    # 消费模式
    'consume_mode': ConsumeMode.CONCURRENTLY,  # 并发消费
    # ConsumeMode.ORDERLY: 顺序消费

    # 订阅
    'subscription': {
        'order_topic': '*',
        'payment_topic': 'TAG_A || TAG_B'
    },

    # 消费线程
    'consume_thread_min': 10,
    'consume_thread_max': 20,

    # 消息拉取
    'pull_batch_size': 32,
    'pull_interval': 0,  # 0 表示持续拉取

    # 消费重试
    'max_retry_times': 3,
    'retry_delay': 1000,  # 重试间隔
}

# 完整配置示例
class RocketMQConfig:
    """RocketMQ 生产配置"""

    @staticmethod
    def get_broker_config():
        """Broker 配置"""
        return {
            'brokerClusterName': 'DefaultCluster',
            'brokerName': 'broker-a',
            'brokerId': 0,
            'namesrvAddr': 'namesrv1:9876;namesrv2:9876',

            # 刷盘策略
            'flushDiskType': 'SYNC_FLUSH',  # 同步刷盘，更安全

            # 副本策略
            'brokerRole': 'ASYNC_MASTER',

            # 消息存储
            'storePathRootDir': '/data/rocketmq/store',
            'storePathCommitLog': '/data/rocketmq/store/commitlog',

            # 消息过滤
            'enablePropertyFilter': True,

            # 延迟消息
            'messageDelayLevel': '1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h',

            # 队列数（默认创建队列数）
            'defaultTopicQueueNums': 8,
        }

    @staticmethod
    def get_consumer_config():
        """Consumer 配置"""
        return {
            'consumeThreadMin': 20,
            'consumeThreadMax': 64,
            'consumeMessageBatchMaxSize': 1,
            'pullBatchSize': 32,
            'postSubscriptionWhenPull': False,

            # 消费进度
            'offsetstore': 'local_offset',

            # 重新平衡
            'brokerSuspendMaxTimeMillis': 10000,
            'consumerTimeoutMillisWhenSuspend': 30000,

            # 消息过滤
            'subscription': {},
        }
```

### 4.3 监控与告警配置

```python
# 消息队列监控配置
# ================================================

class QueueMonitor:
    """
    消息队列监控器

    统一监控 Redis Streams、RocketMQ 等消息队列
    """

    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, decode_responses=True)

    def check_redis_streams(self, stream_name):
        """检查 Redis Streams 健康状态"""
        try:
            # 检查流长度
            length = self.redis.xlen(stream_name)

            # 检查消费者组
            groups = self.redis.xinfo_groups(stream_name)

            # 检查是否有堆积
            pending_count = sum(g['pending'] for g in groups)

            return {
                'healthy': pending_count < 1000,  # 堆积阈值
                'stream_length': length,
                'pending_messages': pending_count,
                'consumer_groups': len(groups),
            }
        except Exception as e:
            return {'healthy': False, 'error': str(e)}

    def check_consumer_lag(self, stream, group):
        """检查消费者延迟"""
        try:
            # 获取流信息
            stream_info = self.redis.xinfo_stream(stream)
            last_id = stream_info.get('last-generated-id')

            # 获取消费者组最后投递的 ID
            group_info = self.redis.xinfo_groups(stream)
            for g in group_info:
                if g['name'] == group:
                    last_delivered = g.get('last-delivered-id', '0-0')
                    # 计算延迟（简化版）
                    lag = self._calculate_lag(last_delivered, last_id)
                    return {'lag': lag, 'healthy': lag < 1000}

            return {'lag': 0, 'healthy': True}
        except Exception as e:
            return {'lag': -1, 'error': str(e)}

    def _calculate_lag(self, last_delivered, last_id):
        """计算延迟消息数"""
        # 简化计算，实际需要解析 ID
        return 0

    def generate_alert(self, issue_type, details):
        """生成告警"""
        alert = {
            'type': issue_type,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        print(f"ALERT: {alert}")
        # 实际项目中，这里应该发送告警通知
        # send_sms_alert(alert)
        # send_email_alert(alert)
```

---

## 总结

**Redis Streams 和 RocketMQ 是消息队列生态中的重要补充**：

**Redis Streams 适用场景**：
- 轻量级任务队列，不想引入额外基础设施
- 已有 Redis，复用现有组件
- 消息量不大，但需要基本的队列功能
- 核心优势：零成本、简单、与 Redis 集成

**RocketMQ 适用场景**：
- 电商订单系统，需要事务消息保证一致性
- 需要严格顺序消息的场景
- 金融支付系统，需要高可靠性
- 核心优势：事务消息、顺序消息、多租户

**选型核心原则**：
1. 根据团队技术栈选型（熟悉 Java 选 RocketMQ）
2. 根据业务需求选型（需要事务选 RocketMQ）
3. 根据数据规模选型（超大规模选 Kafka）
4. 根据基础设施选型（已有 Redis 选 Redis Streams）

掌握这四种消息队列，你就能应对任何消息系统的设计需求了！
