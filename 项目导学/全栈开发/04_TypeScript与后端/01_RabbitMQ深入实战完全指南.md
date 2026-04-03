# RabbitMQ 深入实战完全指南

## 前言：消息队列是什么？

想象一下你是餐厅的厨师长，餐厅里有好多道菜需要同时准备。如果每个顾客都直接站在厨房门口催菜，你肯定会手忙脚乱、应接不暇。但如果你有一个传菜员，把顾客的点单收集起来，按照顺序传递给厨房，厨房就能有条不紊地出菜了。

**消息队列就是这个"传菜员"的角色**。它接收来自各个"顾客"（服务）的"点单"（消息），然后按照规则传递给"厨房"（消费者）处理。整个系统因此变得松耦合、高可用。

RabbitMQ 就是这个消息队列中的"明星员工"，它功能强大、配置灵活，被广泛应用于各类分布式系统中。接下来，让我们深入了解这位"传菜员"的工作方式。

---

## 第一章：RabbitMQ 核心概念详解

### 1.1 消息队列的"三房一厅"：Exchange、Queue、Binding

如果你第一次听说 RabbitMQ，可能会被这些名词搞晕。让我用一个生活中的类比来解释：

**Queue（队列）** - 想象成一个**餐厅的候餐区**，顾客在这里排队等候。消息就存储在这里，等待被消费。

**Exchange（交换机）** - 想象成**餐厅的前台接待员**，负责接收来自顾客的点单（消息），然后根据规则决定把这个点单送到哪个候餐区（队列）。

**Binding（绑定）** - 想象成**前台接待员和候餐区之间的登记表**，上面写着"川菜点单应该送到川菜候餐区"、"粤菜点单应该送到粤菜候餐区"。Exchange 根据 Binding 的规则来决定消息的路由。

**Routing Key（路由键）** - 想象成**点单上的菜品类型标注"，前台接待员根据这个标注结合 Binding 规则，决定把点单送到哪个候餐区。

```python
# Python 示例：创建一个 RabbitMQ 消息发送的基本流程
# ==========================================

import pika

# 1. 建立连接 - 想象成和餐厅前台取得电话联系
# ---------------------------------------------------------
# connection 是我们与 RabbitMQ 服务器之间的网络连接
# 这就像你拨通了餐厅的预订电话
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')  # 餐厅地址
)
channel = connection.channel()  # channel 是通信channel，比connection更轻量

# 2. 声明交换机 - 告诉前台我们要用什么方式接收点单
# ---------------------------------------------------------
# exchange='orders' 是交换机的名字，可以理解为一个柜台的名称
# exchange_type='direct' 是交换机类型，决定了路由规则
#   - direct：精确匹配，路由键必须完全相同
#   - topic：模糊匹配，支持 * 和 # 通配符
#   - fanout：广播，把消息发给所有绑定的队列
#   - headers：根据消息头的属性来匹配
channel.exchange_declare(
    exchange='orders',          # 交换机名称
    exchange_type='direct',     # 交换机类型：直接匹配
    durable=True                # durable=True 表示持久化，重启后队列还在
)

# 3. 声明队列 - 开设一个新的候餐区
# ---------------------------------------------------------
# queue='food_queue' 是队列的名字，就是候餐区的名称
# durable=True 持久化，这个候餐区不会因为断电而消失
channel.queue_declare(
    queue='food_queue',          # 队列名称
    durable=True                 # 持久化存储
)

# 4. 建立绑定 - 把前台和候餐区连接起来
# ---------------------------------------------------------
# 这里的 binding 就相当于登记"川菜点单 -> 川菜候餐区"这条规则
# routing_key=' Sichuan ' 是我们要匹配的关键字
channel.queue_bind(
    exchange='orders',           # 交换机名称（前台）
    queue='food_queue',          # 队列名称（候餐区）
    routing_key='Sichuan'        # 路由键（菜品类型）
)

# 5. 发送消息 - 把点单交给前台
# ---------------------------------------------------------
# body='宫保鸡丁' 是消息内容，就是顾客点的菜
# properties 是消息的附加属性，比如优先级、过期时间等
channel.basic_publish(
    exchange='orders',            # 发送到哪个交换机（前台）
    routing_key='Sichuan',       # 路由键（菜品类型标签）
    body='宫保鸡丁',              # 消息内容（菜品）
    properties=pika.BasicProperties(
        delivery_mode=2,         # 持久化，消息不会因为服务器重启而丢失
        content_type='text/plain'  # 内容类型，纯文本
    )
)

print("消息发送成功！宫保鸡丁已交给川菜前台")
connection.close()  # 挂断电话
```

### 1.2 交换机类型详解：四种路由策略

RabbitMQ 提供了四种不同类型的交换机，就像餐厅有四种不同的接待方式：

#### 1.2.1 Direct Exchange（直接交换机）：精准定位

**工作原理**：就像一个精准的分类员，只会把消息送到**路由键完全匹配**的队列。

**适用场景**：需要按照明确规则分类的消息，比如订单类型、用户等级、地区编码等。

```
交换机 (orders)
     |
     | routing_key = "vip_user"
     v
只发送到绑定表中 routing_key = "vip_user" 的队列
```

```python
# Direct Exchange 完整示例：用户等级消息分发系统
# ==================================================

# 场景：电商系统需要根据用户等级发送不同的促销信息
# - VIP 用户：发送高端商品促销
# - 普通用户：发送日常商品促销
# - 新用户：发送新手指南

import pika

# 建立连接
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明交换机类型为 direct
# direct 类型的交换机在做匹配时，会精确检查 routing_key 是否等于 binding_key
channel.exchange_declare(
    exchange='user_promotion',
    exchange_type='direct',
    durable=True
)

# 为不同用户等级创建不同的队列
# 每个队列对应一个用户等级，就像不同的服务窗口
channel.queue_declare(queue='vip_user_queue', durable=True)      # VIP用户队列
channel.queue_declare(queue='normal_user_queue', durable=True)   # 普通用户队列
channel.queue_declare(queue='new_user_queue', durable=True)       # 新用户队列

# 绑定交换机和队列，建立精确的路由规则
# 这里的 routing_key 就是用户等级标签，交换机根据这个标签来路由消息
channel.queue_bind(
    exchange='user_promotion',
    queue='vip_user_queue',
    routing_key='vip'  # 只有 routing_key = 'vip' 的消息才会送到这个队列
)

channel.queue_bind(
    exchange='user_promotion',
    queue='normal_user_queue',
    routing_key='normal'  # 只有 routing_key = 'normal' 的消息才会送到这个队列
)

channel.queue_bind(
    exchange='user_promotion',
    queue='new_user_queue',
    routing_key='new'  # 只有 routing_key = 'new' 的消息才会送到这个队列
)

# 模拟发送不同用户等级的消息
# 发送 VIP 用户促销
channel.basic_publish(
    exchange='user_promotion',
    routing_key='vip',  # 这条消息会被路由到 vip_user_queue
    body='【VIP专属】限量奢侈品促销，仅限钻石会员'
)

# 发送普通用户促销
channel.basic_publish(
    exchange='user_promotion',
    routing_key='normal',  # 这条消息会被路由到 normal_user_queue
    body='【今日特惠】全场合8折，爆款商品秒杀中'
)

# 发送新用户促销
channel.basic_publish(
    exchange='user_promotion',
    routing_key='new',  # 这条消息会被路由到 new_user_queue
    body='【新手指南】欢迎加入，完成首单立减50元'
)

print("消息已按照用户等级精确路由到对应队列")
connection.close()
```

#### 1.2.2 Topic Exchange（主题交换机）：模糊匹配

**工作原理**：支持通配符匹配，适合有层级结构的路由规则。

- `*`（星号）：匹配**一个**任意单词
- `#`（井号）：匹配**零个或多个**任意单词

**适用场景**：多层分类的消息，比如"商品.品类.规格"、"地区.业务.操作类型"等。

```
路由键格式：<前缀>.<品类>.<操作>
例如：user.login.success

绑定规则：
- binding_key = "user.*.*"   → 匹配所有 user.*.* 的消息（login、logout 等）
- binding_key = "*.login.*"  → 匹配所有 *.login.* 的消息
- binding_key = "#.success"   → 匹配所有以 .success 结尾的消息
```

```python
# Topic Exchange 完整示例：日志收集系统
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明 topic 类型交换机，适合处理有层级结构的日志分类
channel.exchange_declare(
    exchange='logs',
    exchange_type='topic',
    durable=True
)

# 定义不同的日志处理队列
# 1. 错误日志队列 - 处理所有错误日志
channel.queue_declare(queue='error_logs', durable=True)

# 2. 业务日志队列 - 处理所有业务操作日志
channel.queue_declare(queue='business_logs', durable=True)

# 3. 性能日志队列 - 处理所有性能相关日志
channel.queue_declare(queue='performance_logs', durable=True)

# 4. 完整日志队列 - 收集所有日志（用于备份或审计）
channel.queue_declare(queue='all_logs', durable=True)

# 绑定规则 - 使用 topic 通配符
# -------------------------------------------
# routing_key 格式：<服务>.<级别>.<操作>
# 例如：order.service.error、payment.service.warning

# 绑定错误日志：所有 .error 结尾的日志
# # 表示匹配零个或多个单词，所以 order.service.error 和 user.auth.error 都能匹配
channel.queue_bind(
    exchange='logs',
    queue='error_logs',
    routing_key='#.error'  # 以 .error 结尾的所有日志
)

# 绑定业务日志：所有服务发起的业务操作（login, logout, create, update 等）
# * 匹配一个单词，所以 user.auth.login 和 order.payment.create 都能匹配
channel.queue_bind(
    exchange='logs',
    queue='business_logs',
    routing_key='*.auth.#'  # 所有 auth 相关日志
)

channel.queue_bind(
    exchange='logs',
    queue='business_logs',
    routing_key='*.order.#'  # 所有订单相关日志
)

# 绑定性能日志：所有性能监控日志
channel.queue_bind(
    exchange='logs',
    queue='performance_logs',
    routing_key='*.performance.#'  # 所有 performance 相关日志
)

# 绑定全量日志：收集所有日志，不遗漏任何一条
channel.queue_bind(
    exchange='logs',
    queue='all_logs',
    routing_key='#'  # # 匹配所有，和不绑定效果一样，但更明确
)

# 模拟发送各类日志消息
# 发送错误日志
channel.basic_publish(
    exchange='logs',
    routing_key='order.service.error',
    body='[ERROR] 订单服务异常：数据库连接超时'
)

channel.basic_publish(
    exchange='logs',
    routing_key='user.auth.error',
    body='[ERROR] 用户认证失败：密码错误次数超过限制'
)

# 发送业务日志
channel.basic_publish(
    exchange='logs',
    routing_key='user.auth.login',
    body='[INFO] 用户登录：user_12345 成功登录系统'
)

channel.basic_publish(
    exchange='logs',
    routing_key='order.payment.create',
    body='[INFO] 订单创建：订单号 order_98765，金额 299.00'
)

# 发送性能日志
channel.basic_publish(
    exchange='logs',
    routing_key='api.performance.slow',
    body='[WARN] API 性能告警：/api/reports 接口响应时间超过 3 秒'
)

print("日志已按照 Topic 规则路由到对应队列")
connection.close()
```

#### 1.2.3 Fanout Exchange（广播交换机）：消息群发

**工作原理**：像广播电台一样，把消息**广播给所有绑定的队列**，忽略路由键。

**适用场景**：需要通知多个系统的场景，比如系统公告、配置更新同步、事件广播等。

```
交换机 (announcements)
     |
     | 广播（无视 routing_key）
     v
+-----------+-----------+-----------+
|           |           |           |
v           v           v           v
队列A      队列B       队列C       队列D
(邮件服务)  (短信服务)  (推送服务)  (站内信)
```

```python
# Fanout Exchange 完整示例：系统通知广播
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明 fanout 类型交换机 - 广播模式
channel.exchange_declare(
    exchange='system_announcements',
    exchange_type='fanout',  # 广播类型，无视 routing_key
    durable=True
)

# 创建多个队列，每个服务对应一个
# 邮件通知队列
channel.queue_declare(queue='email_notification_queue', durable=True)

# 短信通知队列
channel.queue_declare(queue='sms_notification_queue', durable=True)

# App 推送队列
channel.queue_declare(queue='app_push_queue', durable=True)

# 站内信队列
channel.queue_declare(queue='inbox_message_queue', durable=True)

# 将所有队列绑定到广播交换机
# fanout 模式下，routing_key 被忽略，所有消息会同时投递给所有队列
channel.queue_bind(exchange='system_announcements', queue='email_notification_queue')
channel.queue_bind(exchange='system_announcements', queue='sms_notification_queue')
channel.queue_bind(exchange='system_announcements', queue='app_push_queue')
channel.queue_bind(exchange='system_announcements', queue='inbox_message_queue')

# 发送系统公告 - 所有服务都会收到
announcement = '【系统公告】今晚 22:00-24:00 进行系统升级，届时服务将暂时中断'

# 只需要发送一次，所有订阅者都能收到
channel.basic_publish(
    exchange='system_announcements',
    routing_key='',  # fanout 模式下 routing_key 被忽略，可以留空
    body=announcement
)

print("系统公告已广播给所有订阅服务")
connection.close()
```

#### 1.2.4 Headers Exchange（头部交换机）：按属性匹配

**工作原理**：根据消息头部的属性（而不是路由键）来决定路由。适合复杂条件的消息分发。

**适用场景**：需要根据多个属性组合判断的消息路由，比如根据内容类型和语言同时判断。

```python
# Headers Exchange 完整示例：多条件消息路由
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明 headers 类型交换机
channel.exchange_declare(
    exchange='content_distribution',
    exchange_type='headers',
    durable=True
)

# 创建队列
channel.queue_declare(queue='video_queue', durable=True)      # 视频内容队列
channel.queue_declare(queue='image_queue', durable=True)       # 图片内容队列
channel.queue_declare(queue='chinese_queue', durable=True)     # 中文内容队列
channel.queue_declare(queue='english_queue', durable=True)     # 英文内容队列

# 绑定队列，指定 header 匹配规则
# x-match 有两个值：
# - 'all'：所有属性都必须匹配（默认）
# - 'any'：任意一个属性匹配即可

# 视频 + 任意语言
channel.queue_bind(
    exchange='content_distribution',
    queue='video_queue',
    arguments={'content-type': 'video', 'x-match': 'any'}
)

# 图片 + 任意语言
channel.queue_bind(
    exchange='content_distribution',
    queue='image_queue',
    arguments={'content-type': 'image', 'x-match': 'any'}
)

# 中文内容（任意类型）
channel.queue_bind(
    exchange='content_distribution',
    queue='chinese_queue',
    arguments={'language': 'zh', 'x-match': 'any'}
)

# 英文内容（任意类型）
channel.queue_bind(
    exchange='content_distribution',
    queue='english_queue',
    arguments={'language': 'en', 'x-match': 'any'}
)

# 发送消息时通过 properties 指定 header
channel.basic_publish(
    exchange='content_distribution',
    routing_key='',  # headers 模式下 routing_key 被忽略
    body='中文视频内容：Spring Boot 教程',
    properties=pika.BasicProperties(
        headers={  # 通过 headers 指定属性
            'content-type': 'video',
            'language': 'zh'
        }
    )
)

print("内容已根据 headers 属性路由到对应队列")
connection.close()
```

### 1.3 消息消费的两种模式

RabbitMQ 支持两种消息消费模式，理解它们的区别对于设计系统至关重要。

#### 1.3.1 推（Push）模式：basic_consume

**工作原理**：RabbitMQ 主动**推送**消息给消费者，消费者被动接收。

**适用场景**：实时性要求高的场景，比如聊天消息、实时监控等。

```python
# Push 模式示例：实时聊天消息接收
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 确保队列存在
channel.queue_declare(queue='chat_messages', durable=True)

# 设置 QoS（Quality of Service）
# prefetch_count 表示消费者一次能预取的消息数量
# 设为 1 表示消费完一条才能接收下一条，保证顺序处理
# 如果设为 10，则可以预取 10 条，批处理提高效率
channel.basic_qos(prefetch_count=1)

# 定义消息处理函数
# ch 是 channel，method 包含投递信息，properties 是消息属性，body 是消息内容
def callback(ch, method, properties, body):
    """
    消费者回调函数，每收到一条消息就会调用一次

    参数说明：
    - ch: 频道对象，可以用来确认消息、拒绝消息等
    - method: 包含 delivery_tag（投递标签，用于 ACK）、exchange、routing_key 等
    - properties: 消息属性，如 content_type、delivery_mode、headers 等
    - body: 消息体，就是发送的实际数据
    """
    print(f"收到消息: {body.decode()}")

    # 模拟处理消息需要的时间
    import time
    time.sleep(1)

    # 确认消息已处理
    # delivery_tag 是消息的唯一标识，通过它来告诉 RabbitMQ 这条消息处理完了
    ch.basic_ack(delivery_tag=method.delivery_tag)

# 开始消费 - 使用 basic_consume 推模式
# queue='chat_messages'：要消费的队列名
# on_message_callback=callback：收到消息时的回调函数
# no_ack=False：手动确认模式（处理完再确认）
channel.basic_consume(
    queue='chat_messages',
    on_message_callback=callback,
    no_ack=False  # 必须手动确认，确保消息被正确处理
)

print("开始监听聊天消息队列，按 Ctrl+C 退出...")
channel.start_consuming()  # 开始无限循环接收消息
```

#### 1.3.2 拉（Pull）模式：basic_get

**工作原理**：消费者主动**拉取**消息，像点外卖一样，需要自己去取。

**适用场景**：需要批量处理消息、或者消息处理节奏由消费者控制的场景，比如定时任务、数据同步等。

```python
# Pull 模式示例：定时批量处理订单
# ================================================

import pika
import schedule  # 假设使用 schedule 库做定时任务

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 确保队列存在
channel.queue_declare(queue='pending_orders', durable=True)

def process_batch_orders():
    """
    批量处理待处理订单的函数
    每天早上 9 点执行一次，处理前一天积累的订单
    """
    print("开始批量拉取待处理订单...")

    count = 0
    while True:
        # basic_get 是拉模式，每次只获取一条消息
        # no_ack=False 表示需要手动确认
        method, properties, body = channel.basic_get(
            queue='pending_orders',
            no_ack=False  # 必须手动确认
        )

        # method 为 None 表示队列已经空了
        if method is None:
            break

        # 处理订单
        print(f"处理订单: {body.decode()}")
        count += 1

        # 手动确认消息已被处理
        # 使用 delivery_tag 确认特定消息
        channel.basic_ack(delivery_tag=method.delivery_tag)

    print(f"本次共处理 {count} 条订单")

# 设置定时任务：每天早上 9 点执行
schedule.every().day.at("09:00").do(process_batch_orders)

# 持续运行定时任务
while True:
    schedule.run_pending()
```

---

## 第二章：消息确认机制（ACK）深度解析

### 2.1 为什么要确认消息？

想象一下这个场景：外卖小哥把外卖放在了你家门口的快递柜里，然后给你发了一条消息"外卖已送达"。但实际上，你打开快递柜的时候发现外卖被偷了，或者快递柜故障打不开了。

如果你没有及时发现这个问题，外卖平台还以为你已经收到外卖了，不会再做任何补偿。但如果你收到外卖后点一下"确认收货"，平台就知道这次配送成功了。

**RabbitMQ 的 ACK 机制就是"确认收货"的机制**，它确保消息被正确处理后才从队列中删除，防止消息丢失。

### 2.2 三种确认模式详解

#### 2.2.1 自动确认（auto_ack=True）：闪电送达，有风险

**工作原理**：消息一投递给消费者，就立即标记为"已确认"，不管消费者是否真的处理完成。

**优点**：性能最高，适合对消息丢失不敏感的场景。

**缺点**：如果消费者在处理消息时崩溃，消息就会永久丢失。

```python
# 自动确认模式示例：实时性优先的场景
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='realtime_data', durable=True)

# 自动确认模式
# on_message_callback 收到消息后立即执行，不需要手动调用 ack
# 适用于：日志收集、监控数据等允许少量丢失的场景
channel.basic_consume(
    queue='realtime_data',
    on_message_callback=lambda ch, method, props, body: print(f"收到: {body.decode()}"),
    auto_ack=True  # 自动确认，消息投递给消费者后立即标记为已确认
)

# ⚠️ 警告：这种模式下，如果消费者崩溃，消息会丢失
# 场景：日志收集 - 丢几条日志问题不大，但实时性要求高
# ⚠️ 绝对不推荐用于：订单处理、资金交易等关键业务
```

#### 2.2.2 手动确认（auto_ack=False）：安全第一

**工作原理**：消息投递给消费者后，**必须等到消费者明确调用 `basic_ack`** 才会标记为已消费。

**优点**：消息不会丢失，即使消费者崩溃，消息也会重新投递给其他消费者。

**缺点**：需要写更多的确认代码，如果忘记确认会导致消息堆积。

```python
# 手动确认模式示例：订单处理系统
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='order_processing', durable=True)

# 设置预取数量为 10
# 这样可以一次性获取 10 条消息，批处理提高效率
# 但要注意：如果处理到一半崩溃了，只有已 ack 的消息不会重复投递
channel.basic_qos(prefetch_count=10)

def process_order(ch, method, properties, body):
    """
    订单处理函数

    这里演示了正确的手动确认流程：
    1. 接收消息
    2. 执行业务逻辑
    3. 成功则确认，失败则拒绝或重新入队
    """
    try:
        order_id = body.decode()
        print(f"开始处理订单: {order_id}")

        # 模拟订单处理逻辑
        # 这里可能会成功，也可能会失败
        result = process_payment(order_id)  # 假设这是支付处理函数

        if result == 'success':
            # ✅ 支付成功，确认消息
            # basic_ack 告诉 RabbitMQ："这条消息我处理完了，可以删掉了"
            ch.basic_ack(delivery_tag=method.delivery_tag)
            print(f"订单 {order_id} 处理成功，已确认")
        else:
            # ❌ 支付失败，拒绝消息
            # requeue=True 表示把消息重新放回队列，稍后重试
            # 注意：如果反复失败又重新入队，可能导致无限循环
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            print(f"订单 {order_id} 处理失败，消息重新入队")

    except Exception as e:
        # 发生异常，拒绝消息但不重新入队（避免无限循环）
        # 把消息送到死信队列或者记录下来人工处理
        print(f"订单处理异常: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def process_payment(order_id):
    """模拟支付处理"""
    import random
    results = ['success', 'fail', 'retry']
    return random.choice(results)

channel.basic_consume(
    queue='order_processing',
    on_message_callback=process_order,
    auto_ack=False  # 手动确认模式
)

channel.start_consuming()
```

#### 2.2.3 否定确认（NACK）与重传机制

**basic_nack** vs **basic_reject**：
- `basic_nack`可以拒绝多条消息（通过delivery_tag范围）
- `basic_reject`只能拒绝单条消息
- 两者都有requeue参数，决定是否重新入队

```python
# NACK 与 Reject 详解
# ================================================

# 场景：批量消息处理，失败策略

# 1. basic_reject - 拒绝单条消息
# delivery_tag 是消息的唯一标签
# requeue=True 表示重新放回队列尾部，稍后重试
channel.basic_reject(delivery_tag=5, requeue=True)

# 2. basic_nack - 拒绝单条消息（效果同 reject，但是不同方法）
channel.basic_nack(delivery_tag=5, requeue=True)

# 3. basic_nack 批量拒绝 - 拒绝多条消息
# multiple=True 表示拒绝 delivery_tag 及之前的所有消息
# 例如：delivery_tag=5, multiple=True，会拒绝 [1,2,3,4,5] 所有消息
channel.basic_nack(delivery_tag=5, multiple=True, requeue=False)

# ⚠️ 重新入队（requeue=True）的注意事项：
# - 消息会回到队列头部，会被重新投递给同一个或其他消费者
# - 如果反复失败又重新入队，可能导致消息积压和无限循环
# - 建议：设置最大重试次数，超过后送到死信队列
```

### 2.3 预取机制（QoS）深度解析

**预取（prefetch）**就像是自助餐厅的取餐规则：
- 如果 prefetch_count = 1：每人每次只能拿一盘菜，吃完才能拿下一盘
- 如果 prefetch_count = 10：每人每次可以拿10盘菜，批处理更高效

**为什么需要预取？**
1. **控制消费者的处理节奏**：避免消费者处理不过来
2. **实现负载均衡**：多消费者时，合理分配消息
3. **批量处理优化**：prefetch_count > 1 时可以攒批处理

```python
# 预取机制示例：消费者负载均衡
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)

# 设置预取数量为 1
# 效果：消费者 A 和消费者 B 会轮流处理任务
# A 拿一条，处理完才能拿下一条
# 这样可以保证任务被公平分配
channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    """
    任务处理函数

    假设处理一个任务需要 3 秒
    如果 prefetch_count = 1，两个消费者可以做到：
    - 消费者 A: 任务1(3秒) -> 任务3(3秒) -> 任务5(3秒) ...
    - 消费者 B: 任务2(3秒) -> 任务4(3秒) -> 任务6(3秒) ...
    """
    print(f"处理任务: {body.decode()}")
    import time
    time.sleep(3)  # 模拟处理时间
    ch.basic_ack(delivery_tag=method.delivery_tag)

# 开启两个消费者进程即可实现负载均衡
channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False
)

channel.start_consuming()

# 注意：在实际项目中，需要运行两个 consumer 实例
# 如果在同一进程中，可以用 threading 或 multiprocessing
```

---

## 第三章：死信队列（Dead Letter Queue）深度解析

### 3.1 什么是死信队列？

在生活中，有些包裹因为地址不详、收件人拒收等原因无法送达，就会被放到**异常包裹区**等待处理，而不是直接扔掉。

RabbitMQ 的**死信队列（DLQ）**就是这个"异常包裹区"：

- 无法被消费的消息（队列达到最大长度、消息TTL过期等）会被送到这里
- 程序员可以检查死信队列，分析失败原因，修复问题后重新处理

### 3.2 消息进入死信队列的三种情况

| 原因 | 说明 |
|------|------|
| **消息被消费者拒绝** | 消费者调用 `basic_nack` 或 `basic_reject`，且 `requeue=False` |
| **消息超过TTL** | 消息在队列中存活超过TTL（Time To Live）时间 |
| **队列达到最大长度** | 队列已满，新消息无法入队 |

### 3.3 死信队列配置详解

```python
# 死信队列完整配置示例：订单超时处理系统
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 1. 声明死信交换机和死信队列
# ---------------------------------------------------------
# 这些命名规范帮助区分正常队列和死信队列
channel.exchange_declare(
    exchange='dlx_exchange',      # 死信交换机
    exchange_type='direct',
    durable=True
)

channel.queue_declare(
    queue='dlq_orders',           # 死信队列，存放超时订单
    durable=True
)

# 绑定死信队列
channel.queue_bind(
    exchange='dlx_exchange',
    queue='dlq_orders',
    routing_key='dead_order'     # 死信路由键
)

# 2. 声明带有死信配置的主队列
# ---------------------------------------------------------
# 关键配置：
# - x-dead-letter-exchange: 指定死信交换机
# - x-dead-letter-routing-key: 指定死信路由键
# - x-message-ttl: 消息默认 TTL（这里设为 30 秒）

# 场景：订单超时处理
# - 用户下单后，如果 30 秒内未支付，订单被自动取消
# - 被取消的订单消息进入死信队列，等待后续处理（如发送通知）

channel.queue_declare(
    queue='order_queue',
    durable=True,
    arguments={
        'x-dead-letter-exchange': 'dlx_exchange',      # 死信交换机
        'x-dead-letter-routing-key': 'dead_order',    # 死信路由键
        'x-message-ttl': 30000,                        # 30秒 TTL
        'x-max-length': 10000                          # 队列最大长度
    }
)

# 3. 正常消费者处理订单
# ---------------------------------------------------------

def order_consumer(ch, method, properties, body):
    """
    订单消费者

    正常流程：
    1. 收到订单消息
    2. 处理支付
    3. 如果超时前未支付，消息进入死信队列
    """
    order_id = body.decode()
    print(f"收到订单: {order_id}")

    # 假设这里检测到订单已超时
    if is_order_timeout(order_id):
        # 拒绝消息，不重新入队 -> 消息进入死信队列
        print(f"订单 {order_id} 已超时，拒绝并送入死信队列")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    else:
        # 处理正常订单
        print(f"订单 {order_id} 处理成功")
        ch.basic_ack(delivery_tag=method.delivery_tag)

def is_order_timeout(order_id):
    """检查订单是否超时"""
    return False  # 简化示例

channel.basic_consume(
    queue='order_queue',
    on_message_callback=order_consumer,
    auto_ack=False
)

# 4. 死信消费者处理超时订单
# ---------------------------------------------------------

def dead_order_consumer(ch, method, properties, body):
    """
    死信消费者

    处理超时订单的逻辑：
    1. 记录日志
    2. 发送通知
    3. 释放库存
    4. 确认消息
    """
    order_id = body.decode()
    print(f"处理超时死信订单: {order_id}")

    # 记录日志
    log_timeout_order(order_id)

    # 发送通知给用户
    send_timeout_notification(order_id)

    # 释放库存
    release_inventory(order_id)

    # 确认处理完成
    ch.basic_ack(delivery_tag=method.delivery_tag)

def log_timeout_order(order_id):
    """记录超时订单"""
    pass

def send_timeout_notification(order_id):
    """发送超时通知"""
    pass

def release_inventory(order_id):
    """释放库存"""
    pass

# 消费死信队列
channel.basic_consume(
    queue='dlq_orders',
    on_message_callback=dead_order_consumer,
    auto_ack=False
)

print("订单队列和死信队列已启动")
channel.start_consuming()
```

---

## 第四章：延迟队列（Delayed Message）深度解析

### 4.1 延迟队列的使用场景

延迟队列就像是**定时闹钟**，让你可以在指定时间后才收到消息。

常见使用场景：
- **订单超时取消**：下单 30 分钟未支付，自动取消订单
- **预约提醒**：用户预约成功后，24 小时前发送提醒
- **重试机制**：接口调用失败后，等待一段时间再重试
- **定时任务**：每天早上 9 点发送日报

### 4.2 RabbitMQ 实现延迟队列的三种方式

#### 4.2.1 方式一：TTL + 死信队列（推荐用于简单场景）

**原理**：利用消息的 TTL 特性，让消息在队列中"睡"够时间后自动进入死信队列。

```python
# 延迟队列实现方式一：TTL + 死信队列
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 1. 声明死信队列（接收延迟到达的消息）
channel.exchange_declare(exchange='delay_exchange', exchange_type='direct', durable=True)
channel.queue_declare(queue='delay_queue', durable=True)
channel.queue_bind(exchange='delay_exchange', queue='delay_queue', routing_key='delay_key')

# 2. 声明延迟队列（设置 TTL，死信会转到死信队列）
# 延迟队列配置了 10 秒 TTL，10 秒后消息会自动进入死信交换机
delay_seconds = 10000  # 10 秒

channel.queue_declare(
    queue='waiting_orders',
    durable=True,
    arguments={
        'x-dead-letter-exchange': 'delay_exchange',
        'x-dead-letter-routing-key': 'delay_key',
        'x-message-ttl': delay_seconds  # TTL：10 秒
    }
)

# 3. 发送延迟消息
channel.basic_publish(
    exchange='',
    routing_key='waiting_orders',  # 先发到延迟队列
    body='订单超时提醒',
    properties=pika.BasicProperties(
        delivery_mode=2,
        expiration=str(delay_seconds)  # 消息本身的 TTL
    )
)

print("延迟消息已发送，10 秒后将送达")

# 4. 消费者接收延迟消息
def delay_consumer(ch, method, properties, body):
    print(f"收到延迟消息: {body.decode()}，这是 10 秒前发送的消息")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(
    queue='delay_queue',
    on_message_callback=delay_consumer,
    auto_ack=False
)

channel.start_consuming()
```

#### 4.2.2 方式二：rabbitmq-delayed-message-exchange 插件

**原理**：使用官方插件，消息会按照指定的延迟时间等待后才投递。

```python
# 延迟队列实现方式二：使用延迟消息插件
# ================================================

# 注意：这种方式需要先安装插件
# rabbitmq-plugins enable rabbitmq_delayed_message_exchange

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明延迟交换机（需要插件支持）
# x-delayed-type 指定交换机的基础类型（direct/topic/fanout）
channel.exchange_declare(
    exchange='delayed_exchange',
    exchange_type='x-delayed-message',  # 特殊类型，需要插件
    durable=True,
    arguments={
        'x-delayed-type': 'direct'  # 基于 direct 类型
    }
)

channel.queue_declare(queue='delayed_queue', durable=True)
channel.queue_bind(exchange='delayed_exchange', queue='delayed_queue', routing_key='delay_key')

# 发送延迟消息
# x-delay 头指定延迟毫秒数
delay_ms = 5000  # 5 秒后投递

channel.basic_publish(
    exchange='delayed_exchange',
    routing_key='delay_key',
    body='延迟 5 秒的消息',
    properties=pika.BasicProperties(
        headers={'x-delay': delay_ms}  # 关键：延迟时间配置
    )
)

print("消息已发送，5 秒后将送达")
channel.start_consuming()
```

#### 4.2.3 方式三：Redis + RabbitMQ 混合方案

**原理**：使用 Redis 的有序集合（ZSET）存储定时任务，Redis 定时检查到期任务并投递给 RabbitMQ。

```python
# 延迟队列实现方式三：Redis ZSET 定时器
# ================================================

import redis
import json
import time
import threading
import pika

# Redis 客户端
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# RabbitMQ 连接
rabbit_connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
rabbit_channel = rabbit_connection.channel()

channel.queue_declare(queue='delayed_tasks', durable=True)

def add_delayed_task(task_id, task_data, delay_seconds):
    """
    添加延迟任务

    使用 Redis ZSET 存储任务
    score 设置为到期时间戳
    """
    execute_time = time.time() + delay_seconds  # 到期时间戳

    # ZADD key score member
    # score 是执行时间戳，member 是任务数据（JSON 格式）
    redis_client.zadd(
        'delayed_tasks:pending',
        {json.dumps({'id': task_id, 'data': task_data, 'execute_time': execute_time}): execute_time}
    )

    print(f"延迟任务已添加，{delay_seconds} 秒后执行")

def check_and_execute_delayed_tasks():
    """
    定时检查并执行到期的延迟任务

    这个函数应该定期执行，比如每秒一次
    """
    while True:
        now = time.time()

        # ZRANGEBYSCORE 获取所有到期任务
        # min=-inf, max=now 表示获取 score <= now 的所有任务
        tasks = redis_client.zrangebyscore('delayed_tasks:pending', '-inf', now)

        for task_json in tasks:
            task = json.loads(task_json)

            print(f"执行延迟任务: {task['id']}")

            # 发送到 RabbitMQ
            rabbit_channel.basic_publish(
                exchange='',
                routing_key='delayed_tasks',
                body=task['data'],
                properties=pika.BasicProperties(delivery_mode=2)
            )

            # 从 ZSET 中删除已执行的任务
            redis_client.zrem('delayed_tasks:pending', task_json)

        time.sleep(1)  # 每秒检查一次

# 启动定时检查线程
check_thread = threading.Thread(target=check_and_execute_delayed_tasks, daemon=True)
check_thread.start()

# 测试：添加延迟任务
add_delayed_task('task_001', '发送验证码', 5)   # 5 秒后执行
add_delayed_task('task_002', '订单超时检查', 10)  # 10 秒后执行

# 保持主线程运行
time.sleep(30)
```

---

## 第五章：RabbitMQ 集群与高可用

### 5.1 为什么要搭建集群？

想象一下快递站点：
- **单节点**：只有一个快递站点，如果它关闭了，所有快递都发不了
- **集群**：有多个快递站点，一个关闭了，其他站点还能继续工作

RabbitMQ 集群就是让多个 RabbitMQ 节点一起工作，提供**高可用**和**负载均衡**能力。

### 5.2 集群架构类型

#### 5.2.1 主备模式（Classic Cluster）

最简单的集群模式，所有节点地位平等，队列会在节点间同步。

**特点**：
- 队列默认只在声明它的节点上存在
- 其他节点只保存队列的元数据（名称、配置等）
- 如果主节点挂了，需要手动切换

```
集群架构：
[Node A] ─── [Node B] ─── [Node C]
  │                        │
  └── 队列元数据同步 ────────┘
  └── 消息只在主节点存储
```

```erlang
-- Erlang/Elixir 配置示例：rabbitmq.conf
-- ============================================

# 集群节点配置
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config

cluster_formation.classic_config.nodes.1 = rabbit@node1
cluster_formation.classic_config.nodes.2 = rabbit@node2
cluster_formation.classic_config.nodes.3 = rabbit@node3

# 镜像队列策略（重要！）
# ha-mode 表示镜像模式：all 表示所有节点都是镜像
# ha-sync-mode 表示同步模式：automatic 表示自动同步
ha-mode = all
ha-sync-mode = automatic

# 自动故障转移
failover_autocluster = on
```

#### 5.2.2 镜像队列模式（Mirrored Queue）

队列内容会在多个节点上同步镜像，类似主从复制。

**配置方式**：

```python
# 镜像队列策略配置
# ================================================

# 通过 rabbitmqctl 设置镜像策略

# 方式一：命令行配置
# 将所有以 "ha." 开头的队列设为镜像队列，镜像到所有节点
# rabbitmqctl set_policy ha-all "^ha\." '{"ha-mode":"all","ha-sync-mode":"automatic"}'

# 方式二：HTTP API 配置
import requests

# 设置镜像策略
requests.post(
    'http://localhost:15672/api/policies/%2F/ha-mirror',
    auth=('guest', 'guest'),
    json={
        "pattern": "^mirror_",          # 匹配以 mirror_ 开头的队列
        "definition": {               # 镜像配置
            "ha-mode": "exactly",      # 精确数量模式
            "ha-params": 2,            # 保持 2 个镜像
            "ha-sync-mode": "automatic"
        },
        "priority": 0,
        "vhost": "/"
    }
)

# ha-mode 三种模式：
# - all: 镜像到所有节点
# - exactly: 镜像到指定数量的节点
# - nodes: 镜像到指定的节点列表
```

#### 5.2.3 仲裁队列（Quorum Queue）- 推荐用于新项目

RabbitMQ 3.8+ 引入的新特性，基于 Raft 共识算法，提供更强的一致性保证。

**优势**：
- 数据自动同步，无需手动配置
- 支持选举 leader
- 网络分区时自动恢复

```python
# 仲裁队列配置
# ================================================

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明仲裁队列
# 关键参数：
# - x-queue-type = 'quorum': 指定队列类型为仲裁队列
# - quorum.initial_group_size: 初始副本数

channel.queue_declare(
    queue='quorum_queue',
    durable=True,
    arguments={
        'x-queue-type': 'quorum',           # 仲裁队列类型
        'quorum.initial_group_size': 3,    # 3 个副本
        'x-max-length': 10000,              # 最大消息数
        'x-message-ttl': 86400000           # 24 小时 TTL
    }
)

# 发送消息
channel.basic_publish(
    exchange='',
    routing_key='quorum_queue',
    body='这是一条发送到仲裁队列的消息'
)

print("消息已发送到仲裁队列，数据会在 3 个节点间同步")
```

### 5.3 负载均衡配置

```nginx
# Nginx 配置 RabbitMQ 负载均衡
# ================================================

upstream rabbitmq_cluster {
    least_conn;  # 最少连接数策略

    server node1:5672 weight=3;   # 权重 3，流量更大
    server node2:5672 weight=2;
    server node3:5672 weight=1;
}

server {
    listen 5672;
    proxy_pass rabbitmq_cluster;
}
```

---

## 第六章：实战项目架构设计

### 6.1 电商订单系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        电商订单消息系统架构                           │
└─────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────┐
                           │   用户下单请求    │
                           └────────┬─────────┘
                                    │
                           ┌────────▼─────────┐
                           │  订单服务 (Producer) │
                           └────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
           ┌────────▼────────┐     │     ┌────────▼────────┐
           │  同步库存扣减    │     │     │   发送延迟消息   │
           │   (直接队列)     │     │     │  (30分钟超时)    │
           └────────┬────────┘     │     └────────┬────────┘
                    │               │              │
                    │        ┌──────▼──────┐       │
                    │        │  RabbitMQ   │       │
                    │        │  集群节点    │       │
                    │        └──────┬──────┘       │
                    │               │              │
                    │    ┌──────────┼──────────┐   │
                    │    │          │          │   │
                    │ ┌──▼──┐   ┌──▼──┐   ┌──▼──┐ │
                    │ │Queue│   │Queue│   │Queue│ │
                    │ └──┬──┘   └──┬──┘   └──┬──┘ │
                    │    │         │         │    │
                    │ ┌──▼──┐   ┌──▼──┐   ┌──▼──┐ │
                    │ │支付 │   │库存 │   │超时 │ │
                    │ │服务 │   │服务 │   │检测 │ │
                    │ └─────┘   └─────┘   └──┬──┘ │
                    │                        │    │
                    │                        └──┬─┘
                    │                         │ │
                    │                    ┌────▼────┐
                    │                    │  死信   │
                    │                    │  队列   │
                    │                    └─────────┘
                    │
           ┌────────▼────────┐
           │    订单完成      │
           └─────────────────┘
```

### 6.2 完整订单处理代码示例

```python
# 电商订单系统完整实现
# ================================================

import pika
import json
import threading
import time
from datetime import datetime

class OrderMessageSystem:
    """
    订单消息系统

    功能：
    1. 订单创建 -> 扣减库存 -> 发送延迟超时检查
    2. 支付成功 -> 确认订单 -> 完成订单
    3. 超时未支付 -> 取消订单 -> 释放库存
    """

    def __init__(self):
        # 建立连接
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters('localhost')
        )
        self.channel = self.connection.channel()

        # 声明交换机
        self._declare_exchanges()

        # 声明队列
        self._declare_queues()

        # 绑定队列
        self._bind_queues()

        print("订单消息系统初始化完成")

    def _declare_exchanges(self):
        """声明所有交换机"""
        # 订单交换机
        self.channel.exchange_declare(
            exchange='order_exchange',
            exchange_type='direct',
            durable=True
        )

        # 死信交换机
        self.channel.exchange_declare(
            exchange='order_dlx_exchange',
            exchange_type='direct',
            durable=True
        )

    def _declare_queues(self):
        """声明所有队列"""
        # 库存扣减队列
        self.channel.queue_declare(
            queue='inventory_queue',
            durable=True
        )

        # 订单状态更新队列
        self.channel.queue_declare(
            queue='order_status_queue',
            durable=True
        )

        # 延迟超时检测队列（TTL 30秒）
        self.channel.queue_declare(
            queue='order_timeout_queue',
            durable=True,
            arguments={
                'x-dead-letter-exchange': 'order_dlx_exchange',
                'x-dead-letter-routing-key': 'order_timeout',
                'x-message-ttl': 30000  # 30 秒超时
            }
        )

        # 死信队列（超时订单）
        self.channel.queue_declare(
            queue='order_dlx_queue',
            durable=True
        )

    def _bind_queues(self):
        """绑定队列"""
        # 库存队列绑定
        self.channel.queue_bind(
            exchange='order_exchange',
            queue='inventory_queue',
            routing_key='inventory'
        )

        # 订单状态队列绑定
        self.channel.queue_bind(
            exchange='order_exchange',
            queue='order_status_queue',
            routing_key='order_status'
        )

        # 超时检测队列绑定
        self.channel.queue_bind(
            exchange='order_exchange',
            queue='order_timeout_queue',
            routing_key='order_timeout'
        )

        # 死信队列绑定
        self.channel.queue_bind(
            exchange='order_dlx_exchange',
            queue='order_dlx_queue',
            routing_key='order_timeout'
        )

    def create_order(self, order_id, user_id, items, amount):
        """
        创建订单

        流程：
        1. 发送库存扣减消息
        2. 发送延迟超时检测消息
        """
        order_data = {
            'order_id': order_id,
            'user_id': user_id,
            'items': items,
            'amount': amount,
            'status': 'pending',
            'create_time': datetime.now().isoformat()
        }

        # 1. 发送库存扣减消息
        self.channel.basic_publish(
            exchange='order_exchange',
            routing_key='inventory',
            body=json.dumps(order_data),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        # 2. 发送延迟超时检测消息
        self.channel.basic_publish(
            exchange='order_exchange',
            routing_key='order_timeout',
            body=json.dumps(order_data),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        print(f"订单已创建: {order_id}，金额: {amount}，等待支付...")

    def process_payment(self, order_id):
        """
        处理支付成功
        """
        status_data = {
            'order_id': order_id,
            'status': 'paid',
            'update_time': datetime.now().isoformat()
        }

        self.channel.basic_publish(
            exchange='order_exchange',
            routing_key='order_status',
            body=json.dumps(status_data),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )

        print(f"订单已支付: {order_id}")

    def start_consumers(self):
        """启动所有消费者"""
        # 库存服务消费者
        self.channel.basic_consume(
            queue='inventory_queue',
            on_message_callback=self._inventory_consumer,
            auto_ack=False
        )

        # 订单状态消费者
        self.channel.basic_consume(
            queue='order_status_queue',
            on_message_callback=self._status_consumer,
            auto_ack=False
        )

        # 死信队列消费者（超时订单处理）
        self.channel.basic_consume(
            queue='order_dlx_queue',
            on_message_callback=self._timeout_consumer,
            auto_ack=False
        )

        print("所有消费者已启动")
        self.channel.start_consuming()

    def _inventory_consumer(self, ch, method, properties, body):
        """库存服务消费者"""
        order_data = json.loads(body)
        order_id = order_data['order_id']

        print(f"[库存服务] 正在扣减订单 {order_id} 的库存...")

        # 模拟库存扣减逻辑
        # 实际项目中会调用库存服务 API
        inventory_result = deduct_inventory(order_data['items'])

        if inventory_result:
            print(f"[库存服务] 订单 {order_id} 库存扣减成功")
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            print(f"[库存服务] 订单 {order_id} 库存扣减失败，拒绝消息")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def _status_consumer(self, ch, method, properties, body):
        """订单状态消费者"""
        status_data = json.loads(body)
        order_id = status_data['order_id']
        status = status_data['status']

        print(f"[订单状态] 订单 {order_id} 状态更新为: {status}")

        # 更新数据库中的订单状态
        update_order_status(order_id, status)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def _timeout_consumer(self, ch, method, properties, body):
        """
        超时订单处理（死信消费者）

        这是关键流程：
        1. 收到死信消息（超时未支付的订单）
        2. 检查订单状态
        3. 如果仍未支付，则取消订单并释放库存
        """
        order_data = json.loads(body)
        order_id = order_data['order_id']

        print(f"[超时检测] 订单 {order_id} 支付超时，正在处理...")

        # 检查订单状态
        current_status = get_order_status(order_id)

        if current_status == 'pending':
            # 仍未支付，取消订单
            print(f"[超时检测] 订单 {order_id} 超时未支付，执行取消...")

            # 更新订单状态为已取消
            update_order_status(order_id, 'cancelled')

            # 释放库存
            release_inventory(order_data['items'])

            print(f"[超时检测] 订单 {order_id} 已取消，库存已释放")
        else:
            # 已支付，无需处理
            print(f"[超时检测] 订单 {order_id} 已支付，忽略超时消息")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def close(self):
        """关闭连接"""
        self.connection.close()


# 模拟数据库操作
def get_order_status(order_id):
    """获取订单状态"""
    return 'pending'  # 模拟返回 pending

def update_order_status(order_id, status):
    """更新订单状态"""
    print(f"  [DB] 订单 {order_id} 状态更新为: {status}")

def deduct_inventory(items):
    """扣减库存"""
    return True  # 模拟成功

def release_inventory(items):
    """释放库存"""
    print(f"  [DB] 已释放订单库存: {items}")


# 测试运行
if __name__ == '__main__':
    system = OrderMessageSystem()

    # 创建测试订单
    system.create_order(
        order_id='ORDER_001',
        user_id='USER_123',
        items=['item_a', 'item_b'],
        amount=299.00
    )

    # 模拟支付（5 秒后支付成功）
    def simulate_payment():
        time.sleep(5)
        system.process_payment('ORDER_001')

    payment_thread = threading.Thread(target=simulate_payment)
    payment_thread.start()

    # 启动消费者
    system.start_consumers()
```

---

## 第七章：常见问题与最佳实践

### 7.1 消息丢失的七种原因及解决方案

| 原因 | 解决方案 |
|------|----------|
| 消费者自动 ACK 后崩溃 | 改用手动 ACK |
| 队列未持久化 | 声明队列时设置 `durable=True` |
| 消息未持久化 | 发送时设置 `delivery_mode=2` |
| RabbitMQ 节点宕机 | 使用镜像队列或仲裁队列 |
| 磁盘满了 | 监控磁盘使用，及时清理 |
| 网络分区 | 配置集群策略，使用仲裁队列 |
| 交换机路由失败 | 使用备份交换机 |

### 7.2 消息重复消费的幂等处理

```python
# 幂等性处理：防止消息重复消费
# ================================================

import redis

# 使用 Redis 作为幂等性检查
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def process_message_with_idempotency(order_id, message):
    """
    带幂等性检查的消息处理

    思路：
    1. 处理前检查 Redis 中是否已存在该订单的处理记录
    2. 如果存在，说明已处理过，直接返回
    3. 如果不存在，处理消息并写入 Redis
    4. 设置过期时间，避免无限存储
    """
    # Redis key 格式：idempotent:order:{order_id}
    idempotent_key = f'idempotent:order:{order_id}'

    # 检查是否已处理
    if redis_client.exists(idempotent_key):
        print(f"订单 {order_id} 已处理过，忽略重复消息")
        return True

    # 模拟消息处理
    result = process_order(order_id, message)

    if result:
        # 处理成功，记录幂等性标记
        # 设置 24 小时过期，防止无限积累
        redis_client.setex(idempotent_key, 86400, 'processed')
        print(f"订单 {order_id} 处理成功，已记录幂等性标记")

    return result

def process_order(order_id, message):
    """处理订单"""
    return True
```

### 7.3 消息堆积的应急处理

```python
# 消息堆积应急处理方案
# ================================================

# 场景：消费者挂了，消息在队列中堆积

# 方案一：临时增加消费者数量
# 直接启动多个消费者进程，平行消费堆积的消息

# 方案二：将队列中的消息转移到慢消费队列
# 通过 rabbitmqctl 移动消息

# 方案三：配置消费者预取，提高消费速度
channel.basic_qos(prefetch_count=100)  # 批处理提高效率

# 方案四：使用 Shovel 插件将消息迁移到其他节点

# 监控命令：
# 查看队列消息数量
# rabbitmqctl list_queues name messages

# 查看消费者数量
# rabbitmqctl list_queues name consumers

# 查看消息堆积情况
# rabbitmqctl status | grep -A 10 "rabbit_queue"
```

### 7.4 性能优化建议

1. **批量确认**：累积多条消息后一起确认，减少网络开销
2. **合理设置预取数**：根据消费者处理能力调整
3. **使用持久化消息**：对重要消息开启持久化，对不重要消息关闭以提升性能
4. **交换机和队列正确命名**：使用有意义的命名便于管理
5. **定期清理过期消息**：使用惰性队列或将 TTL 设置为较短时间
6. **监控队列深度**：队列过深时及时报警和处理

---

## 附录：常用命令速查表

### RabbitMQ 管理命令

```bash
# 启动服务
rabbitmq-server -detached

# 停止服务
rabbitmqctl stop

# 查看状态
rabbitmqctl status

# 列出所有队列
rabbitmqctl list_queues name messages consumers

# 列出所有交换机
rabbitmqctl list_exchanges name type

# 列出所有绑定
rabbitmqctl list_bindings

# 创建用户
rabbitmqctl add_user username password

# 设置权限
rabbitmqctl set_permissions -p / username ".*" ".*" ".*"

# 设置镜像策略
rabbitmqctl set_policy ha-all "^ha\." '{"ha-mode":"all"}'

# 启用插件
rabbitmq-plugins enable rabbitmq_delayed_message_exchange

# 查看队列详情
rabbitmqctl list_queues name messages consumers memory
```

---

## 总结

RabbitMQ 是功能最全面的消息队列之一，通过 Exchange 的灵活路由、ACK 机制的可靠保证、死信队列的异常处理、延迟队列的定时能力，可以构建出满足各种业务场景的消息系统。

**核心要点回顾**：
1. **交换机类型**：Direct、Topic、Fanout、Headers，决定消息路由方式
2. **队列绑定**：Binding 连接交换机和队列，是路由规则的载体
3. **ACK 机制**：手动确认最可靠，自动确认有风险
4. **死信队列**：处理失败消息的"安全网"
5. **延迟队列**：实现定时任务的利器
6. **集群高可用**：镜像队列和仲裁队列保证服务稳定性

掌握这些核心概念和实战技巧，你就能用 RabbitMQ 构建出生产级别的高可靠消息系统了！
