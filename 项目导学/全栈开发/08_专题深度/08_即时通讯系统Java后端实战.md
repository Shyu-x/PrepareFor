# 即时通讯系统Java后端实战完全指南

## 前言：为什么即时通讯是Java后端进阶必学

各位同学好，我是老王。今天咱们来聊聊即时通讯（Instant Messaging，简称IM）系统的后端开发。

你们有没有想过，为什么微信、钉钉、飞书这些APP能实时收发消息？为什么你发一条消息，对方几乎是瞬间就能收到？这背后用到了什么技术？

IM系统是Java后端学习中非常重要的一环，因为它涉及了很多高级技术：

1. **长连接管理**：HTTP是请求-响应模式，发完请求就断开了。IM需要维持长时间连接，这就用到了WebSocket、Netty等技术。
2. **高并发处理**：微信有几亿用户同时在线，消息并发量极其恐怖。
3. **消息可靠投递**：消息不能丢，不能重复，这需要ACK确认、重试机制、去重机制。
4. **在线状态同步**：用户上线、离线、切换设备，这些状态如何同步给好友？
5. **海量数据存储**：聊天记录、文件、图片如何存储和检索？

学会IM系统的开发，你就能掌握这些高级技术的实际应用，这对面试和实际工作都很有帮助。

好了，废话不多说，开始正文。

---

## 第一章：即时通讯系统架构设计

### 1.1 短轮询 vs 长轮询 vs WebSocket

在IM系统发展的历史中，出现了三种主要的实时通信方案：

**1. 短轮询（Short Polling）**

这是最原始的方案。客户端每隔几秒就向服务器发一个请求，问"有没有新消息？"

```
客户端：有没有新消息？
服务器：没有。
（1秒后）
客户端：有没有新消息？
服务器：没有。
（1秒后）
客户端：有没有新消息？
服务器：有！是一条"在吗"
```

**问题**：浪费资源，99%的时候服务器都回复"没有"。而且延迟取决于轮询间隔，最短也要等1秒。

**2. 长轮询（Long Polling）**

客户端发请求，服务器如果没有新消息，就"hold住"这个请求，等到有新消息才返回。

```
客户端：在吗？（发请求）
服务器：（等待中...）
（5秒后，有人发消息）
服务器：有消息！返回！
客户端：（立即发下一个请求）
服务器：（等待中...）
```

**问题**：比短轮询好一些，但仍然是HTTP请求-响应，有额外的HTTP header开销。而且服务器要同时hold住成千上万个连接，对服务器压力很大。

**3. WebSocket**

这是目前最主流的方案。TCP建立连接后就不断了，服务器可以主动推送消息给客户端。

```
客户端 <-> 服务器（TCP长连接）
         |
    服务器主动推送：收到一条消息
         |
    服务器主动推送：又收到一条消息
```

**优势**：双向通信、低延迟、资源占用少。微信、钉钉等主流IM都用这个方案。

### 1.2 Netty vs WebSocket

说到WebSocket实现，有两个主流选择：原生WebSocket和Netty。

**WebSocket**是HTTP协议升级而来的，浏览器原生支持。它的优点是简单，缺点是：

1. 只能做通信协议，不适合做复杂的业务处理
2. 单机并发连接数有限（几万）
3. 不支持半包处理、粘包处理等底层功能

**Netty**是一个Java NIO网络通信框架，WebSocket只是它支持的协议之一。它的优点是：

1. 高性能：基于NIO，单机可支持百万连接
2. 功能丰富：半包粘包处理、心跳检测、断线重连
3. 生态好： Dubbo、RocketMQ底层都用Netty

**实际选择**：大型IM系统用Netty，中小型系统可以用WebSocket。

### 1.3 IM系统整体架构

```
                                    ┌─────────────────┐
                                    │    消息存储服务   │
                                    │  (MySQL/Redis)  │
                                    └────────┬────────┘
                                             │
┌────────┐    WebSocket    ┌────────┐    RPC     ┌────────┐    MQ     ┌────────┐
│ 客户端  │ <─────────────> │ 网关服务 │ <─────────> │ 消息服务 │ <───────> │ 离线服务 │
└────────┘                 └────────┘             └────────┘           └────────┘
                                  │                      │
                           ┌──────┴──────┐         ┌────┴────┐
                           │ 在线状态服务  │         │ 推送服务  │
                           │  (Redis)    │         │ (APNs)  │
                           └─────────────┘         └─────────┘
```

**架构说明**：

1. **网关服务**：负责维护客户端的长连接，消息收发的入口
2. **消息服务**：处理消息的核心逻辑，消息路由、存储、转发
3. **在线状态服务**：管理用户的在线状态，在线/离线/离开
4. **离线服务**：处理离线消息，用户上线后拉取离线消息
5. **推送服务**：iOS推送（APNs）、Android推送

---

## 第二章：Netty核心组件详解

### 2.1 Netty的工作原理

Netty是基于NIO的通信框架，它的核心理念是"事件驱动"。

```
┌─────────────────────────────────────────────────────────┐
│                      BossGroup（Boss线程池）             │
│  负责接受客户端连接，一个端口一个线程                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                    accept 新连接
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   NioServerSocketChannel                │
│         相当于 TCP 监听 socket，负责accept操作          │
└─────────────────────────┬───────────────────────────────┘
                          │
                    Channel 已建立
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   WorkerGroup（Worker线程池）            │
│  负责处理连接的读写事件，一个NioEventLoop处理多个Channel │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
                   Channel 读写事件
                          │
           ┌──────────────┴──────────────┐
           │                              │
           ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│  ChannelPipeline    │        │   ChannelHandler   │
│   Handler链          │        │    业务处理器       │
│  入站顺序执行        │        │                    │
│  出站逆序执行        │        │                    │
└─────────────────────┘        └─────────────────────┘
```

### 2.2 Netty服务端代码实现

```java
package com.example.im.server;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.timeout.IdleStateHandler;
import lombok.extern.slf4j.Slf4j;

import java.net.InetSocketAddress;

/**
 * Netty WebSocket服务器
 * 负责维护客户端长连接，处理消息收发
 */
@Slf4j
public class NettyWebSocketServer {

    /**
     * boss线程池：负责接受客户端连接
     * 一般设置为CPU核心数
     */
    private final EventLoopGroup bossGroup;

    /**
     * worker线程池：负责处理客户端的读写事件
     * 一般设置为CPU核心数的2倍
     */
    private final EventLoopGroup workerGroup;

    private final ServerBootstrap bootstrap;
    private Channel channel;

    public NettyWebSocketServer(int port) {
        // 初始化线程组
        bossGroup = new NioEventLoopGroup(1);
        workerGroup = new NioEventLoopGroup(Runtime.getRuntime().availableProcessors() * 2);

        // 创建ServerBootstrap，这是Netty服务端的引导类
        bootstrap = new ServerBootstrap();

        // 配置引导类
        bootstrap.group(bossGroup, workerGroup)  // 配置boss和worker线程组
                .channel(NioServerSocketChannel.class)  // 指定NIO类型的Channel
                .option(ChannelOption.SO_BACKLOG, 1024)  // TCP连接队列大小
                .childOption(ChannelOption.SO_KEEPALIVE, true)  // 开启TCP保活
                .childOption(ChannelOption.TCP_NODELAY, true)  // 禁用Nagle算法，降低延迟
                .localAddress(new InetSocketAddress(port))
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    /**
                     * 初始化Channel，配置Handler链
                     */
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        // 获取Channel对应的Pipeline，用于组装Handler
                        ChannelPipeline pipeline = ch.pipeline();

                        // ========== HTTP编解码器 ==========
                        // WebSocket基于HTTP协议，所以需要HTTP编解码器
                        pipeline.addLast("httpCodec", new HttpServerCodec());

                        // HTTP聚合器：将HTTP消息的多个部分聚合成FullHttpRequest/FullHttpResponse
                        // WebSocket握手需要这个
                        pipeline.addLast("aggregator", new HttpObjectAggregator(65536));

                        // ========== WebSocket协议处理器 ==========
                        // 负责WebSocket握手、ping/pong、心跳检测
                        // "/ws" 是WebSocket的URI路径
                        pipeline.addLast("webSocketHandler",
                                new WebSocketServerProtocolHandler("/ws", null, true));

                        // ========== 心跳检测 ==========
                        // IdleStateHandler：检测连接空闲状态
                        // 第一个参数：读空闲时间（秒），表示多久没收到消息就触发
                        // 第二个参数：写空闲时间（秒），表示多久没发送消息就触发
                        // 第三个参数：读写空闲时间（秒）
                        // 0表示不检测
                        pipeline.addLast("idleStateHandler",
                                new IdleStateHandler(60, 0, 0));

                        // ========== 自定义Handler ==========
                        // 业务消息处理
                        pipeline.addLast("webSocketHandler", new WebSocketHandler());

                        // ========== 日志Handler（可选）==========
                        pipeline.addLast("logger", new ChannelInboundHandlerAdapter() {
                            @Override
                            public void channelRead(ChannelHandlerContext ctx, Object msg) {
                                log.debug("收到消息：{}", msg);
                                super.channelRead(ctx, msg);
                            }
                        });
                    }
                });
    }

    /**
     * 启动服务器
     */
    public void start() {
        // bind()是异步操作，sync()会阻塞等待绑定完成
        ChannelFuture future = bootstrap.bind().sync();
        if (future.isSuccess()) {
            channel = future.channel();
            log.info("Netty WebSocket服务器启动成功，端口：{}", channel.localAddress());
        } else {
            log.error("Netty WebSocket服务器启动失败", future.cause());
        }
    }

    /**
     * 优雅关闭
     */
    public void shutdown() {
        if (channel != null) {
            channel.close();
        }
        // 关闭线程组
        bossGroup.shutdownGracefully();
        workerGroup.shutdownGracefully();
        log.info("Netty WebSocket服务器已关闭");
    }
}
```

**代码要点解析**：

1. **EventLoopGroup是什么？**
   EventLoopGroup是Netty的线程池。bossGroup负责接受新连接（相当于公司前台），workerGroup负责处理已建立连接的读写事件（相当于客服）。

2. **ChannelOption配置的意义**：
   - `SO_BACKLOG`：TCP全连接队列大小，当连接数太多来不及处理时，客户端会排队等待
   - `SO_KEEPALIVE`：开启TCP保活探测，防止连接被中间设备（如防火墙）断开
   - `TCP_NODELAY`：禁用Nagle算法，直接发送数据，降低延迟

3. **ChannelPipeline是什么？**
   每个Channel都有一个Pipeline，里面串着一组Handler。数据进来会依次经过每个Handler处理。Handler分两种：
   - Inbound（入站）：处理从客户端收到的数据
   - Outbound（出站）：处理要发送给客户端的数据

### 2.3 WebSocket消息处理Handler

```java
package com.example.im.server.handler;

import io.netty.channel.*;
import io.netty.handler.codec.http.*;
import io.netty.handler.timeout.IdleState;
import io.netty.handler.timeout.IdleStateEvent;
import io.netty.handler.timeout.IdleStateHandler;
import io.netty.util.AttributeKey;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket消息处理器
 * 核心功能：
 * 1. 处理文本消息、图片消息
 * 2. 管理用户Channel映射
 * 3. 心跳检测
 * 4. 断线处理
 */
@Slf4j
@ChannelHandler.Sharable  // 注解表示Handler可以被多个Channel共享复用
public class WebSocketHandler extends ChannelInboundHandlerAdapter {

    /**
     * 用户ID与Channel的映射关系
     * 实际项目中应该用Redis存储，支持分布式
     */
    public static final ConcurrentHashMap<Long, Channel> USER_CHANNEL_MAP =
            new ConcurrentHashMap<>();

    /**
     * Channel对应的用户ID
     * 通过Channel的attr存储，每个Channel独立
     */
    private static final AttributeKey<Long> USER_ID = AttributeKey.valueOf("userId");

    /**
     * 客户端连接建立时触发
     */
    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        log.info("客户端连接建立：{}", ctx.channel().remoteAddress());
    }

    /**
     * 收到消息时触发
     * WebSocket支持TextMessage和BinaryMessage
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof FullHttpRequest) {
            // HTTP请求（WebSocket握手）
            handleHttpRequest(ctx, (FullHttpRequest) msg);
        } else if (msg instanceof TextWebSocketFrame) {
            // 文本消息（聊天消息）
            handleTextMessage(ctx, (TextWebSocketFrame) msg);
        } else if (msg instanceof BinaryWebSocketFrame) {
            // 二进制消息（图片、文件等）
            handleBinaryMessage(ctx, (BinaryWebSocketFrame) msg);
        } else if (msg instanceof PongWebSocketFrame) {
            // Pong消息（心跳响应）
            // 心跳相关后面详解
        } else if (msg instanceof PingWebSocketFrame) {
            // Ping消息
            ctx.writeAndFlush(new PongWebSocketFrame());
        } else {
            log.warn("未知消息类型：{}", msg.getClass());
        }
    }

    /**
     * 处理HTTP请求（WebSocket握手）
     */
    private void handleHttpRequest(ChannelHandlerContext ctx, FullHttpRequest request) {
        // 如果是WebSocket升级请求
        if ("websocket".equals(request.headers().get("Upgrade"))) {
            // 获取用户ID（通常从URL参数或Cookie中获取）
            String uri = request.uri();
            Long userId = extractUserId(uri);

            if (userId == null) {
                // 用户未登录，拒绝连接
                FullHttpResponse response = new DefaultFullHttpResponse(
                        HttpVersion.HTTP_1_1,
                        HttpResponseStatus.UNAUTHORIZED
                );
                ctx.writeAndFlush(response);
                ctx.close();
                return;
            }

            // 保存用户ID到Channel的attr
            ctx.channel().attr(USER_ID).set(userId);

            // 将Channel加入在线列表
            USER_CHANNEL_MAP.put(userId, ctx.channel());

            log.info("WebSocket连接建立成功，用户ID：{}，Channel ID：{}", userId, ctx.channel().id());

            // 更新用户在线状态
            userStatusService.online(userId);

            // 通知好友用户上线（异步，不阻塞）
            friendService.notifyFriendsOnline(userId);

            // 发送未读消息（离线消息）
            messageService.sendUnreadMessages(userId);

        } else {
            // 普通HTTP请求，返回404
            FullHttpResponse response = new DefaultFullHttpResponse(
                    HttpVersion.HTTP_1_1,
                    HttpResponseStatus.NOT_FOUND
            );
            ctx.writeAndFlush(response);
            ctx.close();
        }
    }

    /**
     * 处理文本消息
     * 聊天内容通常用JSON格式
     */
    private void handleTextMessage(ChannelHandlerContext ctx, TextWebSocketFrame frame) {
        String text = frame.text();
        log.info("收到文本消息：{}", text);

        try {
            // 解析JSON消息
            ChatMessageDTO message = JsonUtil.parse(text, ChatMessageDTO.class);

            // 根据消息类型分发处理
            switch (message.getType()) {
                case ChatMessageType.CHAT:
                    handleChatMessage(ctx, message);
                    break;
                case ChatMessageType.READ:
                    handleReadMessage(ctx, message);
                    break;
                case ChatMessageType.TYPING:
                    handleTypingMessage(ctx, message);
                    break;
                case ChatMessageType.PING:
                    // 心跳消息
                    ctx.writeAndFlush(new TextWebSocketFrame("{\"type\":\"pong\"}"));
                    break;
                default:
                    log.warn("未知消息类型：{}", message.getType());
            }

        } catch (Exception e) {
            log.error("消息解析失败：{}", text, e);
        }
    }

    /**
     * 处理聊天消息
     */
    private void handleChatMessage(ChannelHandlerContext ctx, ChatMessageDTO message) {
        Long fromUserId = ctx.channel().attr(USER_ID).get();
        Long toUserId = message.getToUserId();
        String content = message.getContent();

        log.info("处理聊天消息：{} -> {}，内容：{}", fromUserId, toUserId, content);

        // 1. 保存消息到数据库
        MessageEntity savedMessage = messageService.saveMessage(fromUserId, toUserId, content);

        // 2. 获取目标用户的Channel
        Channel toChannel = USER_CHANNEL_MAP.get(toUserId);

        if (toChannel != null && toChannel.isActive()) {
            // 用户在线，直接推送
            ChatMessageDTO pushMessage = buildPushMessage(savedMessage);
            toChannel.writeAndFlush(new TextWebSocketFrame(JsonUtil.toJson(pushMessage)));
            log.info("消息已推送给用户：{}", toUserId);

            // 3. 发送已读回执（可选）
            sendAck(fromUserId, toUserId, savedMessage.getMessageId(), ctx);

        } else {
            // 用户离线，存入离线消息表
            offlineMessageService.saveOfflineMessage(toUserId, savedMessage);
            log.info("用户离线，消息已存入离线消息表：{}", toUserId);
        }

        // 4. 如果是群聊消息，需要推送给所有群成员
        if (message.isGroupMessage()) {
            pushGroupMessage(message.getGroupId(), savedMessage, fromUserId);
        }
    }

    /**
     * 处理心跳消息
     * IdleStateHandler会检测连接是否空闲，如果长时间没收到消息会触发userEventTriggered
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent idleEvent = (IdleStateEvent) evt;
            if (idleEvent.state() == IdleState.READER_IDLE) {
                // 读空闲，说明长时间没收到消息，可能是客户端挂了
                log.warn("检测到读空闲，关闭连接：{}", ctx.channel().id());
                ctx.close();
            }
        }
    }

    /**
     * 客户端断开连接时触发
     */
    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        Long userId = ctx.channel().attr(USER_ID).get();
        if (userId != null) {
            // 从在线列表移除
            USER_CHANNEL_MAP.remove(userId);
            log.info("用户断开连接：{}", userId);

            // 更新用户离线状态
            userStatusService.offline(userId);

            // 通知好友用户离线（异步）
            friendService.notifyFriendsOffline(userId);
        }
    }

    /**
     * 异常处理
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.error("Channel异常：{}", ctx.channel().id(), cause);
        ctx.close();
    }
}
```

---

## 第三章：心跳机制详解

### 3.1 为什么要心跳检测

在TCP连接中，如果两端之间没有任何数据传输，连接可能会被：

1. **NAT超时**：如果客户端在内网，经过NAT设备（如路由器）转换后，长时间没流量的连接会被NAT设备断开。
2. **服务端超时**：服务端为了节省资源，可能会关闭长时间空闲的连接。
3. **网络故障**：网线断了、路由器挂了等情况，服务器不知道客户端已经挂了。

心跳机制就是为了解决这些问题。它通过定期发送"心跳包"来：

1. 检测连接是否还活着
2. 保持连接活跃，防止被NAT设备断开
3. 快速检测网络故障

### 3.2 Netty心跳实现

```java
package com.example.im.server.handler;

import io.netty.channel.*;
import io.netty.handler.timeout.IdleState;
import io.netty.handler.timeout.IdleStateEvent;
import io.netty.handler.timeout.IdleStateHandler;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.TimeUnit;

/**
 * 心跳处理器
 * Netty提供了IdleStateHandler来检测连接空闲状态
 *
 * 工作原理：
 * 1. IdleStateHandler内部有一个定时器
 * 2. 当Channel在一段时间内没有收到/发送数据，触发IdleStateEvent
 * 3. 我们在这个Handler里发送心跳包
 */
@Slf4j
public class HeartBeatHandler extends ChannelInboundHandlerAdapter {

    /**
     * 心跳间隔：30秒
     * 如果30秒内没收到任何消息，就发送心跳探测
     */
    private static final int HEARTBEAT_INTERVAL = 30;

    /**
     * 最大心跳次数：3次
     * 发送3次心跳都没响应，就认为连接断了
     */
    private static final int MAX_HEARTBEAT_COUNT = 3;

    /**
     * 当前未收到响应的心跳次数
     */
    private int heartBeatCount = 0;

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent idleEvent = (IdleStateEvent) evt;

            // 判断是哪种空闲
            if (idleEvent.state() == IdleState.READER_IDLE) {
                // 读空闲：长时间没收到消息
                // 说明客户端还"活着"，因为客户端在发送心跳
                // 但这只是检测，如果长时间没收到任何消息（可能是网络断了）
                log.debug("读空闲，发送心跳探测");
                sendPing(ctx);
            } else if (idleEvent.state() == IdleState.WRITER_IDLE) {
                // 写空闲：长时间没发送消息
                // 主动发送心跳给客户端
                log.debug("写空闲，发送心跳探测");
                sendPing(ctx);
            } else if (idleEvent.state() == IdleState.ALL_IDLE) {
                // 读写空闲：既没读也没写
                log.debug("读写空闲，发送心跳探测");
                sendPing(ctx);
            }
        }

        super.userEventTriggered(ctx, evt);
    }

    /**
     * 发送Ping心跳
     */
    private void sendPing(ChannelHandlerContext ctx) {
        heartBeatCount++;

        if (heartBeatCount > MAX_HEARTBEAT_COUNT) {
            // 多次心跳都没响应，关闭连接
            log.warn("心跳超时，关闭连接：{}", ctx.channel().id());
            ctx.close();
            return;
        }

        // 构建心跳消息
        String pingMessage = "{\"type\":\"ping\",\"timestamp\":" + System.currentTimeMillis() + "}";

        // 发送Ping帧
        // WebSocket协议支持Ping/Pong帧，但Netty封装成了TextWebSocketFrame
        // 实际项目中通常用自定义的JSON心跳格式
        ctx.writeAndFlush(new TextWebSocketFrame(pingMessage));

        log.debug("发送心跳，次数：{}", heartBeatCount);

        // 延迟发送下一个心跳
        // 实际项目中可以用一个定时任务来做
    }

    /**
     * 收到Pong响应时重置计数器
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof TextWebSocketFrame) {
            TextWebSocketFrame frame = (TextWebSocketFrame) msg;
            String text = frame.text();

            // 如果是Pong响应
            if ("{\"type\":\"pong\"}".equals(text) || "pong".equals(text)) {
                // 重置心跳计数
                heartBeatCount = 0;
                log.debug("收到Pong响应，心跳计数重置");
                return;
            }
        }

        // 不是心跳消息，传递给下一个Handler
        super.channelRead(ctx, msg);
    }
}
```

**心跳机制的要点**：

1. **为什么Netty用IdleStateHandler而不是自己写定时器？**
   IdleStateHandler是Netty内置的空闲检测Handler，它和Channel的生命周期绑定，当Channel关闭时它会自动停止。而自己写定时器还要管理定时任务的启动和停止，容易出错。

2. **心跳间隔怎么定？**
   通常设置为30-60秒。太短了浪费资源，太长了检测不及时。一般要比NAT超时时间短。

3. **为什么要计算心跳次数而不是直接断开？**
   网络可能只是短暂抖动，丢了一个心跳包不代表连接断了。连续3次心跳超时才断开，是比较稳妥的做法。

### 3.3 客户端心跳实现

服务端心跳处理完了，客户端也需要配合：

```java
package com.example.im.client;

import io.netty.channel.*;
import io.netty.handler.timeout.IdleState;
import io.netty.handler.timeout.IdleStateHandler;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 客户端心跳处理器
 * 负责定时发送心跳包，检测服务器是否存活
 */
@Slf4j
public class ClientHeartBeatHandler extends ChannelInboundHandlerAdapter {

    /**
     * 心跳间隔：25秒
     * 比服务端设置的稍短，确保在服务端超时之前发送
     */
    private static final int HEARTBEAT_INTERVAL_SECONDS = 25;

    /**
     * 心跳超时时间：10秒
     * 发送心跳后等待响应的超时时间
     */
    private static final int HEARTBEAT_TIMEOUT_SECONDS = 10;

    /**
     * 最大重连次数
     */
    private static final int MAX_RECONNECT_COUNT = 5;

    private AtomicInteger reconnectCount = new AtomicInteger(0);
    private volatile boolean connected = false;

    /**
     * 连接建立时启动心跳
     */
    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        connected = true;
        reconnectCount.set(0);
        log.info("连接建立，启动心跳");
        startHeartBeat(ctx);
    }

    /**
     * 启动定时心跳
     */
    private void startHeartBeat(ChannelHandlerContext ctx) {
        // 使用一个定时任务，每25秒发送一次心跳
        ctx.executor().scheduleAtFixedRate(() -> {
            if (connected && ctx.channel().isActive()) {
                sendPing(ctx);
            }
        }, HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * 发送心跳
     */
    private void sendPing(ChannelHandlerContext ctx) {
        String pingMessage = "{\"type\":\"ping\"}";
        ctx.writeAndFlush(new TextWebSocketFrame(pingMessage));
        log.debug("发送心跳");
    }

    /**
     * 收到消息时处理
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof TextWebSocketFrame) {
            TextWebSocketFrame frame = (TextWebSocketFrame) msg;
            String text = frame.text();

            // 如果是服务端的心跳探测（Ping）
            if ("{\"type\":\"ping\"}".equals(text) || "ping".equals(text)) {
                // 回复Pong
                ctx.writeAndFlush(new TextWebSocketFrame("{\"type\":\"pong\"}"));
                log.debug("回复Pong");
                return;
            }

            // 如果是Pong响应（服务端对我们心跳的响应）
            if ("{\"type\":\"pong\"}".equals(text) || "pong".equals(text)) {
                log.debug("收到Pong响应，服务器存活");
                return;
            }
        }

        // 业务消息，传递给下一个Handler
        super.channelRead(ctx, msg);
    }

    /**
     * 连接断开时触发
     */
    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        connected = false;
        log.warn("连接断开，尝试重连");

        // 延迟重连
        ctx.executor().schedule(() -> {
            if (reconnectCount.get() < MAX_RECONNECT_COUNT) {
                reconnectCount.incrementAndGet();
                log.info("第{}次重连...", reconnectCount.get());
                // 调用重连逻辑
                reconnect();
            } else {
                log.error("重连次数用尽，连接失败");
            }
        }, 3, TimeUnit.SECONDS);
    }

    private void reconnect() {
        // 实际项目中会重新创建Bootstrap并连接
        // 这里省略具体代码
    }
}
```

---

## 第四章：消息投递与ACK确认

### 4.1 消息可靠投递的挑战

在IM系统中，消息可靠投递是核心问题。想象一下，你给女朋友发了一条"分手吧"，结果消息丢了……这就很严重了。

消息投递面临几个挑战：

1. **网络不可靠**：网络可能中断、丢包、乱序
2. **服务端可能崩溃**：消息可能在处理过程中丢失
3. **客户端可能没收到**：消息发出去了，但客户端没收到

### 4.2 ACK确认机制

解决消息丢失的核心方法是**ACK确认机制**：

```
客户端 -> 服务端：发送消息（msgId: 123）
服务端 -> 客户端：ACK确认（msgId: 123）
（如果没收到ACK，客户端重试发送）
```

```java
package com.example.im.server.handler;

import io.netty.channel.*;
import io.netty.handler.codec.http.websocketx.*;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 消息确认（ACK）处理器
 * 保证消息可靠投递
 *
 * 工作原理：
 * 1. 客户端发送消息，带一个唯一的消息ID
 * 2. 服务端收到后立即回复ACK
 * 3. 如果客户端没收到ACK，会自动重试
 * 4. 服务端根据消息ID做去重，避免重复投递
 */
@Slf4j
public class MessageAckHandler extends ChannelInboundHandlerAdapter {

    /**
     * 消息ID与发送状态的映射
     * 用于追踪消息是否已被对方ACK
     * 实际项目中应该用Redis，设置过期时间
     */
    private final Map<String, MessagePending> pendingMessages = new ConcurrentHashMap<>();

    /**
     * 待确认消息的最大存活时间（毫秒）
     * 超过这个时间没收到ACK，认为消息丢失
     */
    private static final long PENDING_TIMEOUT_MS = 30000;

    /**
     * 最大重试次数
     */
    private static final int MAX_RETRY_COUNT = 3;

    /**
     * 收到消息时发送ACK
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof TextWebSocketFrame) {
            TextWebSocketFrame frame = (TextWebSocketFrame) msg;
            String text = frame.text();

            try {
                ChatMessageDTO message = JsonUtil.parse(text, ChatMessageDTO.class);

                if (message.getType() == ChatMessageType.CHAT) {
                    // 这是聊天消息
                    processChatMessage(ctx, message);
                } else if (message.getType() == ChatMessageType.ACK) {
                    // 这是ACK确认
                    processAck(ctx, message);
                } else {
                    // 其他消息，传递给下一个Handler
                    super.channelRead(ctx, msg);
                }

            } catch (Exception e) {
                log.error("消息处理失败：{}", text, e);
            }
        } else {
            super.channelRead(ctx, msg);
        }
    }

    /**
     * 处理聊天消息
     */
    private void processChatMessage(ChannelHandlerContext ctx, ChatMessageDTO message) {
        String msgId = message.getMsgId();
        Long fromUserId = message.getFromUserId();

        log.info("收到聊天消息，msgId：{}，from：{}", msgId, fromUserId);

        // 1. 发送ACK确认
        ChatMessageDTO ack = new ChatMessageDTO();
        ack.setType(ChatMessageType.ACK);
        ack.setMsgId(msgId);
        ack.setFromUserId(fromUserId);

        ctx.writeAndFlush(new TextWebSocketFrame(JsonUtil.toJson(ack)));
        log.debug("发送ACK，msgId：{}", msgId);

        // 2. 存储消息到数据库
        MessageEntity savedMessage = messageService.saveMessage(message);

        // 3. 投递消息给目标用户
        boolean delivered = deliverMessage(message);

        // 4. 如果投递失败，标记待重试
        if (!delivered) {
            markPending(msgId, message);
        }

        // 5. 更新消息状态
        messageService.updateStatus(msgId, delivered ? MessageStatus.DELIVERED : MessageStatus.PENDING);
    }

    /**
     * 处理ACK确认
     * 说明对方已经收到消息
     */
    private void processAck(ChannelHandlerContext ctx, ChatMessageDTO ack) {
        String msgId = ack.getMsgId();
        MessagePending pending = pendingMessages.remove(msgId);

        if (pending != null) {
            log.info("收到消息ACK，msgId：{}，发送次数：{}", msgId, pending.retryCount);
            // 取消重试任务
            pending.cancelRetry();
        }
    }

    /**
     * 标记消息待重试
     */
    private void markPending(String msgId, ChatMessageDTO message) {
        MessagePending pending = new MessagePending(message, MAX_RETRY_COUNT);
        pendingMessages.put(msgId, pending);

        // 启动重试定时器
        pending.startRetryTimer(() -> {
            if (pending.retryCount > 0) {
                log.warn("消息重试，msgId：{}，剩余次数：{}", msgId, pending.retryCount);
                deliverMessage(message);
                pending.retryCount--;
            } else {
                // 重试次数用尽，标记为发送失败
                log.error("消息发送失败，msgId：{}", msgId);
                messageService.updateStatus(msgId, MessageStatus.FAILED);
                pendingMessages.remove(msgId);
            }
        });
    }

    /**
     * 投递消息给目标用户
     */
    private boolean deliverMessage(ChatMessageDTO message) {
        Long toUserId = message.getToUserId();
        Channel toChannel = WebSocketHandler.USER_CHANNEL_MAP.get(toUserId);

        if (toChannel != null && toChannel.isActive()) {
            toChannel.writeAndFlush(new TextWebSocketFrame(JsonUtil.toJson(message)));
            return true;
        }
        return false;
    }

    /**
     * 待确认消息对象
     */
    private static class MessagePending {
        ChatMessageDTO message;
        int retryCount;
        java.util.concurrent.ScheduledFuture<?> retryFuture;

        MessagePending(ChatMessageDTO message, int retryCount) {
            this.message = message;
            this.retryCount = retryCount;
        }

        void startRetryTimer(Runnable task) {
            // 延迟5秒后执行重试
            retryFuture = ScheduledExecutorServiceHolder.SCHEDULER.schedule(task, 5, TimeUnit.SECONDS);
        }

        void cancelRetry() {
            if (retryFuture != null) {
                retryFuture.cancel(false);
            }
        }
    }
}

/**
 * 定时执行器
 * 实际项目中应该用框架的定时任务组件
 */
class ScheduledExecutorServiceHolder {
    static final java.util.concurrent.ScheduledExecutorService SCHEDULER =
            java.util.concurrent.Executors.newScheduledThreadPool(2);
}
```

### 4.3 消息ID生成策略

消息ID是ACK机制的基础，必须保证全局唯一。常用方案：

**方案一：UUID**

```java
String msgId = UUID.randomUUID().toString().replace("-", "");
```

简单，但UUID是无序的，不利于消息排序和检索。

**方案二：雪花算法（Snowflake）**

```java
package com.example.im.common.util;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 雪花算法ID生成器
 *
 * 雪花算法生成的ID是一个64位的long型整数，结构如下：
 * - 第1位：符号位，固定为0
 * - 第2-42位：时间戳（毫秒），可用69年
 * - 第43-52位：机器ID（10位），支持1024个机器
 * - 第53-64位：序列号（12位），每毫秒最多4096个ID
 *
 * 优点：趋势递增、有业务含义、性能高
 */
public class SnowflakeIdGenerator {

    /**
     * 起始时间戳：2024-01-01 00:00:00
     * 为什么要设一个起始时间？因为时间戳不能为负数
     * 如果用0，所有ID都会很大
     */
    private final long startTimestamp = 1704067200000L;

    /**
     * 机器ID占用的位数：10位
     * 最多支持 2^10 = 1024 个机器
     */
    private final long workerIdBits = 10L;

    /**
     * 序列号占用的位数：12位
     * 每毫秒最多生成 2^12 = 4096 个ID
     */
    private final long sequenceBits = 12L;

    /**
     * 机器ID左移位数
     */
    private final long workerIdShift = sequenceBits;

    /**
     * 时间戳左移位数
     */
    private final long timestampLeftShift = sequenceBits + workerIdBits;

    /**
     * 序列号掩码：2^12 - 1，用于取余
     */
    private final long sequenceMask = ~(-1L << sequenceBits);

    /**
     * 最大机器ID：2^10 - 1 = 1023
     */
    private final long maxWorkerId = ~(-1L << workerIdBits);

    private final long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeIdGenerator(long workerId) {
        if (workerId < 0 || workerId > maxWorkerId) {
            throw new IllegalArgumentException("workerId 超出范围：" + workerId);
        }
        this.workerId = workerId;
    }

    /**
     * 生成下一个ID
     */
    public synchronized long nextId() {
        long timestamp = timeGen();

        // 如果当前时间小于上次生成的时间，说明服务器时间被回调了
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨，不允许生成ID");
        }

        // 如果是同一毫秒内
        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) {
                // 序列号用完，等待下一毫秒
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            // 不同毫秒，序列号重置
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        // 组装ID
        return ((timestamp - startTimestamp) << timestampLeftShift)
                | (workerId << workerIdShift)
                | sequence;
    }

    /**
     * 等待下一毫秒
     */
    private long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }

    /**
     * 获取当前时间戳
     */
    private long timeGen() {
        return System.currentTimeMillis();
    }

    /**
     * 将long型ID转成String
     */
    public String nextIdString() {
        return String.valueOf(nextId());
    }
}
```

---

## 第五章：海量连接管理

### 5.1 连接管理的挑战

微信有上亿用户，钉钉有千万企业用户。这么多用户同时在线，意味着服务器要同时维护海量TCP连接。这带来了几个挑战：

1. **内存压力**：每个连接都要占用内存存储数据（Buffer、Handler等）。一个Netty Channel大约占用2-4KB内存，100万连接就是2-4GB。
2. **CPU压力**：每个连接的事件通知、上下文切换都要消耗CPU。
3. **网络带宽**：海量消息同时推送，带宽是瓶颈。

### 5.2 连接管理优化

```java
package com.example.im.server.session;

import io.netty.channel.Channel;
import io.netty.channel.ChannelId;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Channel会话管理器
 * 负责管理所有客户端连接
 *
 * 核心数据结构：
 * - userId -> Channel：用户ID到Channel的映射，用于查找用户的连接
 * - ChannelId -> UserSession：Channel到会话信息的映射
 */
@Slf4j
public class ChannelSessionManager {

    /**
     * 用户ID到Channel的映射
     * 一个用户可能有多个设备，这里只存储最新的那个
     */
    private final Map<Long, Channel> userChannelMap = new ConcurrentHashMap<>();

    /**
     * ChannelId到会话信息的映射
     */
    private final Map<ChannelId, UserSession> channelSessionMap = new ConcurrentHashMap<>();

    /**
     * 在线用户总数
     */
    private volatile long onlineCount = 0;

    /**
     * 注册Channel
     */
    public void register(Long userId, Channel channel) {
        // 先移除旧连接（如果有）
        Channel oldChannel = userChannelMap.get(userId);
        if (oldChannel != null) {
            // 只移除旧Channel的session，不关闭连接
            // 因为旧连接可能是用户在其他设备上的
            channelSessionMap.remove(oldChannel.id());
            log.info("用户 {} 切换连接，旧的 Channel ID：{}", userId, oldChannel.id());
        }

        // 存储新的映射
        userChannelMap.put(userId, channel);
        channelSessionMap.put(channel.id(), new UserSession(userId, channel));

        onlineCount++;
        log.info("Channel注册完成，用户ID：{}，Channel ID：{}，在线人数：{}",
                userId, channel.id(), onlineCount);
    }

    /**
     * 注销Channel
     */
    public void unregister(Channel channel) {
        UserSession session = channelSessionMap.remove(channel.id());
        if (session != null) {
            userChannelMap.remove(session.getUserId());
            onlineCount--;
            log.info("Channel注销，用户ID：{}，在线人数：{}",
                    session.getUserId(), onlineCount);
        }
    }

    /**
     * 获取用户的Channel
     */
    public Channel getChannel(Long userId) {
        Channel channel = userChannelMap.get(userId);
        if (channel != null && channel.isActive()) {
            return channel;
        }
        // Channel可能已经断开，但map里还有
        // 清理无效映射
        if (channel != null) {
            unregister(channel);
        }
        return null;
    }

    /**
     * 获取在线用户数
     */
    public long getOnlineCount() {
        return onlineCount;
    }

    /**
     * 获取所有在线用户ID
     */
    public Long[] getAllOnlineUsers() {
        return userChannelMap.keySet().toArray(new Long[0]);
    }

    /**
     * 向指定用户发送消息
     */
    public boolean sendToUser(Long userId, Object message) {
        Channel channel = getChannel(userId);
        if (channel != null) {
            channel.writeAndFlush(message);
            return true;
        }
        return false;
    }

    /**
     * 向多个用户发送消息
     */
    public int sendToUsers(Long[] userIds, Object message) {
        int successCount = 0;
        for (Long userId : userIds) {
            if (sendToUser(userId, message)) {
                successCount++;
            }
        }
        return successCount;
    }

    /**
     * 用户会话信息
     */
    @Data
    public static class UserSession {
        /**
         * 用户ID
         */
        private Long userId;

        /**
         * 关联的Channel
         */
        private Channel channel;

        /**
         * 登录时间
         */
        private long loginTime;

        /**
         * 最后活跃时间
         */
        private volatile long lastActiveTime;

        /**
         * 设备类型：1-Android，2-iOS，3-Web，4-PC
         */
        private Integer deviceType;

        /**
         * 设备ID
         */
        private String deviceId;

        public UserSession(Long userId, Channel channel) {
            this.userId = userId;
            this.channel = channel;
            this.loginTime = System.currentTimeMillis();
            this.lastActiveTime = System.currentTimeMillis();
        }

        /**
         * 更新活跃时间
         */
        public void updateActiveTime() {
            this.lastActiveTime = System.currentTimeMillis();
        }
    }
}
```

### 5.3 Redis分布式会话管理

单机版的SessionManager只能管理单机连接。在分布式部署时，需要用Redis来共享会话信息：

```java
package com.example.im.server.session;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 分布式会话管理器
 * 使用Redis存储用户在线状态，支持多实例部署
 *
 * key设计：
 * - im:online:user:{userId} -> Channel所在的网关节点信息
 * - im:channel:{channelId} -> 用户会话信息JSON
 */
@Component
public class DistributedSessionManager {

    private static final String ONLINE_KEY_PREFIX = "im:online:user:";
    private static final String CHANNEL_KEY_PREFIX = "im:channel:";
    private static final long SESSION_EXPIRE_SECONDS = 7 * 24 * 3600;  // 7天

    private final StringRedisTemplate redisTemplate;

    public DistributedSessionManager(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 用户上线
     */
    public void online(Long userId, String gatewayNode, String channelId, UserSession session) {
        // 存储用户所在节点
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(onlineKey, gatewayNode, SESSION_EXPIRE_SECONDS, TimeUnit.SECONDS);

        // 存储会话信息
        String channelKey = CHANNEL_KEY_PREFIX + channelId;
        redisTemplate.opsForValue().set(channelKey, JsonUtil.toJson(session), SESSION_EXPIRE_SECONDS, TimeUnit.SECONDS);

        // 更新在线用户计数
        redisTemplate.opsForZSet().add("im:online:users", userId.toString(), System.currentTimeMillis());

        // 发布上线事件（其他服务可以订阅）
        redisTemplate.convertAndSend("im:event:online", userId.toString());
    }

    /**
     * 用户下线
     */
    public void offline(Long userId, String channelId) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        String channelKey = CHANNEL_KEY_PREFIX + channelId;

        redisTemplate.delete(onlineKey);
        redisTemplate.delete(channelKey);
        redisTemplate.opsForZSet().remove("im:online:users", userId.toString());

        // 发布下线事件
        redisTemplate.convertAndSend("im:event:offline", userId.toString());
    }

    /**
     * 检查用户是否在线
     */
    public boolean isOnline(Long userId) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(onlineKey));
    }

    /**
     * 获取用户所在的网关节点
     */
    public String getUserGateway(Long userId) {
        String onlineKey = ONLINE_KEY_PREFIX + userId;
        return redisTemplate.opsForValue().get(onlineKey);
    }

    /**
     * 获取用户的会话信息
     */
    public UserSession getSession(String channelId) {
        String channelKey = CHANNEL_KEY_PREFIX + channelId;
        String json = redisTemplate.opsForValue().get(channelKey);
        return json == null ? null : JsonUtil.parse(json, UserSession.class);
    }

    /**
     * 获取在线用户数
     */
    public long getOnlineCount() {
        Long count = redisTemplate.opsForZSet().size("im:online:users");
        return count == null ? 0 : count;
    }
}
```

**分布式会话的关键设计**：

1. **为什么要存网关节点信息？**
   用户A在网关节点1上，用户B在网关节点2上。当用户A给用户B发消息时，消息服务需要知道B在哪个节点，才能路由消息。

2. **为什么要用ZSet存储在线用户？**
   ZSet可以按时间戳排序，方便查询最近上线/离线的用户。而且ZSet支持快速计数和范围查询。

3. **为什么要发布订阅事件？**
   其他服务（如消息服务、通知服务）可能需要知道用户的上下线状态。Redis的发布订阅可以解耦这些服务。

---

## 第六章：在线状态同步

### 6.1 在线状态类型

IM系统中的在线状态有很多种：

1. **在线**：TCP连接正常，随时可以接收消息
2. **离线**：TCP连接已断开
3. **离开**：长时间没有操作（如15分钟）
4. **忙碌**：用户手动设置的状态
5. **勿扰**：接收消息但不提醒

### 6.2 状态同步实现

```java
package com.example.im.server.status;

import io.netty.channel.Channel;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 在线状态管理器
 * 管理用户的在线状态，支持多种状态类型
 */
@Slf4j
public class OnlineStatusManager {

    /**
     * 用户ID -> 在线状态
     */
    private final Map<Long, UserStatus> userStatusMap = new ConcurrentHashMap<>();

    /**
     * 用户ID -> 好友ID列表（需要通知这些好友）
     */
    private final Map<Long, Set<Long>> userFriendsMap = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    /**
     * 状态变更监听器列表
     * 实际项目中应该用MQ来通知
     */
    private final Map<String, StatusChangeListener> listeners = new ConcurrentHashMap<>();

    /**
     * 用户状态枚举
     */
    public enum Status {
        ONLINE,    // 在线
        OFFLINE,    // 离线
        AWAY,       // 离开
        BUSY,       // 忙碌
        DND,        // 勿扰
        HIDDEN      // 隐身
    }

    /**
     * 用户状态信息
     */
    @Data
    public static class UserStatus {
        private Long userId;
        private Status status;
        private long lastActiveTime;
        private String clientType;  // 设备类型：Android/iOS/Web/PC
        private String gatewayNode;  // 所在网关节点

        public UserStatus(Long userId) {
            this.userId = userId;
            this.status = Status.OFFLINE;
            this.lastActiveTime = System.currentTimeMillis();
        }

        /**
         * 是否可以接收消息
         */
        public boolean canReceiveMessage() {
            return status == Status.ONLINE || status == Status.AWAY;
        }
    }

    public OnlineStatusManager() {
        // 启动定时任务：检测用户是否离开
        scheduler.scheduleAtFixedRate(this::checkAwayStatus, 1, 1, TimeUnit.MINUTES);
    }

    /**
     * 用户上线
     */
    public void online(Long userId, Channel channel, String clientType) {
        UserStatus status = new UserStatus(userId);
        status.setStatus(Status.ONLINE);
        status.setClientType(clientType);
        status.setLastActiveTime(System.currentTimeMillis());

        UserStatus oldStatus = userStatusMap.put(userId, status);

        // 如果是状态变更（之前在线），通知好友
        if (oldStatus != null && oldStatus.getStatus() != Status.OFFLINE) {
            log.info("用户状态变更：{} -> ONLINE（切换设备）", userId);
            notifyFriends(userId, Status.ONLINE);
        } else {
            log.info("用户上线：{}", userId);
            notifyFriends(userId, Status.ONLINE);
        }
    }

    /**
     * 用户离线
     */
    public void offline(Long userId) {
        UserStatus status = userStatusMap.get(userId);
        if (status != null) {
            Status oldStatus = status.getStatus();
            status.setStatus(Status.OFFLINE);
            status.setLastActiveTime(System.currentTimeMillis());

            log.info("用户离线：{}", userId);
            notifyFriends(userId, Status.OFFLINE);
        }
    }

    /**
     * 更新用户活跃时间
     * 收到消息、发消息、主动ping时调用
     */
    public void updateActiveTime(Long userId) {
        UserStatus status = userStatusMap.get(userId);
        if (status != null) {
            status.setLastActiveTime(System.currentTimeMillis());
            // 如果之前是AWAY状态，恢复为ONLINE
            if (status.getStatus() == Status.AWAY) {
                status.setStatus(Status.ONLINE);
                notifyFriends(userId, Status.ONLINE);
            }
        }
    }

    /**
     * 设置用户状态
     */
    public void setStatus(Long userId, Status status) {
        UserStatus userStatus = userStatusMap.get(userId);
        if (userStatus != null) {
            Status oldStatus = userStatus.getStatus();
            userStatus.setStatus(status);
            userStatus.setLastActiveTime(System.currentTimeMillis());

            log.info("用户 {} 设置状态：{} -> {}", userId, oldStatus, status);
            notifyFriends(userId, status);
        }
    }

    /**
     * 获取用户状态
     */
    public UserStatus getStatus(Long userId) {
        return userStatusMap.get(userId);
    }

    /**
     * 检测离开状态
     * 如果用户15分钟没有操作，自动设为离开状态
     */
    private void checkAwayStatus() {
        long now = System.currentTimeMillis();
        long awayThreshold = 15 * 60 * 1000;  // 15分钟

        for (UserStatus status : userStatusMap.values()) {
            if (status.getStatus() == Status.ONLINE
                    && now - status.getLastActiveTime() > awayThreshold) {
                status.setStatus(Status.AWAY);
                log.info("用户 {} 自动设为离开状态", status.getUserId());
                notifyFriends(status.getUserId(), Status.AWAY);
            }
        }
    }

    /**
     * 通知好友状态变更
     */
    private void notifyFriends(Long userId, Status status) {
        Set<Long> friends = userFriendsMap.get(userId);
        if (friends == null || friends.isEmpty()) {
            return;
        }

        // 构建状态变更通知消息
        StatusNotifyMessage notifyMsg = new StatusNotifyMessage();
        notifyMsg.setUserId(userId);
        notifyMsg.setStatus(status);
        notifyMsg.setTimestamp(System.currentTimeMillis());

        String json = JsonUtil.toJson(notifyMsg);

        // 发送给所有在线的好友
        for (Long friendId : friends) {
            UserStatus friendStatus = userStatusMap.get(friendId);
            if (friendStatus != null && friendStatus.getStatus() != Status.OFFLINE) {
                // 获取好友的Channel并发送
                Channel channel = ChannelSessionManager.getChannel(friendId);
                if (channel != null) {
                    channel.writeAndFlush(new TextWebSocketFrame(json));
                }
            }
        }
    }

    /**
     * 加载用户的好友列表
     */
    public void loadFriends(Long userId, Set<Long> friendIds) {
        userFriendsMap.put(userId, friendIds);
    }

    /**
     * 状态变更监听器接口
     */
    public interface StatusChangeListener {
        void onStatusChange(Long userId, Status oldStatus, Status newStatus);
    }
}
```

---

## 第七章：消息存储设计

### 7.1 聊天记录存储方案

聊天记录是IM系统的重要数据，需要考虑：

1. **查询效率**：用户要能快速搜索历史消息
2. **存储成本**：消息量大，需要节省存储空间
3. **多端同步**：同一账号多个设备要能看到相同的历史消息

### 7.2 消息表设计

```sql
-- 消息主表
CREATE TABLE `im_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `msg_id` VARCHAR(64) NOT NULL COMMENT '消息唯一ID（客户端生成，雪花算法）',
    `conversation_id` VARCHAR(128) NOT NULL COMMENT '会话ID，单聊为 userA_userB，群聊为 group_groupId',
    `msg_type` TINYINT NOT NULL COMMENT '消息类型：1文本，2图片，3语音，4视频，5文件，6表情，7撤回，8引用',
    `content` TEXT DEFAULT NULL COMMENT '消息内容',
    `extra` JSON DEFAULT NULL COMMENT '扩展信息（如图片URL、语音时长等）',
    `from_user_id` BIGINT NOT NULL COMMENT '发送者用户ID',
    `to_user_id` BIGINT DEFAULT NULL COMMENT '接收者用户ID（单聊时）',
    `to_group_id` BIGINT DEFAULT NULL COMMENT '接收群ID（群聊时）',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '消息状态：0发送中，1已发送，2已读，3已撤回，4已删除',
    `send_time` DATETIME NOT NULL COMMENT '发送时间（客户端时间，用于排序）',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '服务器收到时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_msg_id` (`msg_id`),
    KEY `idx_conversation_send_time` (`conversation_id`, `send_time`),
    KEY `idx_from_user` (`from_user_id`),
    KEY `idx_to_user` (`to_user_id`),
    KEY `idx_to_group` (`to_group_id`),
    KEY `idx_send_time` (`send_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 消息索引表（用于加速搜索）
CREATE TABLE `im_message_index` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '索引ID',
    `msg_id` VARCHAR(64) NOT NULL COMMENT '消息ID',
    `content` TEXT DEFAULT NULL COMMENT '消息内容（分词后存储）',
    `created_at` DATETIME NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_msg_id` (`msg_id`),
    FULLTEXT KEY `ft_content` (`content`)  -- 全文索引
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息索引表';

-- 离线消息表
CREATE TABLE `im_offline_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `msg_id` VARCHAR(64) NOT NULL COMMENT '消息ID',
    `conversation_id` VARCHAR(128) NOT NULL COMMENT '会话ID',
    `msg_type` TINYINT NOT NULL COMMENT '消息类型',
    `content` TEXT DEFAULT NULL COMMENT '消息内容',
    `from_user_id` BIGINT NOT NULL COMMENT '发送者ID',
    `send_time` DATETIME NOT NULL COMMENT '发送时间',
    `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_unread` (`user_id`, `is_read`),
    KEY `idx_user_time` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='离线消息表';
```

### 7.3 消息存储策略

```java
package com.example.im.server.message;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.im.server.mapper.ImMessageMapper;
import com.example.im.server.mapper.ImOfflineMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 消息存储服务
 *
 * 存储策略：
 * 1. 普通消息直接存储到消息表
 * 2. 离线消息（用户不在线）存储到离线消息表
 * 3. 历史消息定期归档到冷库（如ES、HBase）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageStoreService {

    private final ImMessageMapper messageMapper;
    private final ImOfflineMessageMapper offlineMessageMapper;

    /**
     * 保存消息
     */
    public MessageEntity saveMessage(MessageDTO dto) {
        MessageEntity entity = new MessageEntity();
        entity.setMsgId(dto.getMsgId());
        entity.setConversationId(dto.getConversationId());
        entity.setMsgType(dto.getMsgType());
        entity.setContent(dto.getContent());
        entity.setFromUserId(dto.getFromUserId());
        entity.setToUserId(dto.getToUserId());
        entity.setToGroupId(dto.getToGroupId());
        entity.setSendTime(dto.getSendTime());
        entity.setStatus(MessageStatus.SENT);

        messageMapper.insert(entity);
        return entity;
    }

    /**
     * 查询会话消息历史
     * 分页查询，按发送时间倒序
     */
    public List<MessageEntity> getConversationHistory(String conversationId, long beforeTime, int limit) {
        return messageMapper.selectList(
                new LambdaQueryWrapper<MessageEntity>()
                        .eq(MessageEntity::getConversationId, conversationId)
                        .lt(beforeTime > 0 ? MessageEntity::getSendTime : null, beforeTime > 0 ? beforeTime : null)
                        .orderByDesc(MessageEntity::getSendTime)
                        .last(beforeTime > 0 ? "" : "")  // 条件省略
                        .last("LIMIT " + limit)
        );
    }

    /**
     * 查询用户的离线消息
     * 用户上线时调用
     */
    public List<MessageEntity> getOfflineMessages(Long userId, long lastReadTime) {
        // 先查离线消息表
        List<ImOfflineMessageEntity> offlineList = offlineMessageMapper.selectList(
                new LambdaQueryWrapper<ImOfflineMessageEntity>()
                        .eq(ImOfflineMessageEntity::getUserId, userId)
                        .eq(ImOfflineMessageEntity::getIsRead, 0)
                        .gt(lastReadTime > 0 ? ImOfflineMessageEntity::getSendTime : null, lastReadTime)
                        .orderByAsc(ImOfflineMessageEntity::getSendTime)
        );

        // 转换为MessageEntity
        // 实际项目中可以合并查询

        // 标记离线消息已发送
        // 实际项目中应该用批量更新
        return offlineList.stream().map(this::convertToMessage).collect(Collectors.toList());
    }

    /**
     * 存储离线消息
     * 用户不在线时调用
     */
    public void saveOfflineMessage(Long userId, MessageEntity message) {
        ImOfflineMessageEntity offline = new ImOfflineMessageEntity();
        offline.setUserId(userId);
        offline.setMsgId(message.getMsgId());
        offline.setConversationId(message.getConversationId());
        offline.setMsgType(message.getMsgType());
        offline.setContent(message.getContent());
        offline.setFromUserId(message.getFromUserId());
        offline.setSendTime(message.getSendTime());

        offlineMessageMapper.insert(offline);
    }

    /**
     * 删除离线消息
     * 用户上线拉取后删除
     */
    public void deleteOfflineMessage(Long userId, List<String> msgIds) {
        offlineMessageMapper.delete(
                new LambdaQueryWrapper<ImOfflineMessageEntity>()
                        .eq(ImOfflineMessageEntity::getUserId, userId)
                        .in(ImOfflineMessageEntity::getMsgId, msgIds)
        );
    }
}
```

---

## 第八章：面试高频问题

### 8.1 WebSocket和HTTP的区别

| 维度 | HTTP | WebSocket |
|------|------|-----------|
| 连接方式 | 短连接，每次请求建立新连接 | 长连接，建立后不断开 |
| 通信方向 | 客户端发请求，服务端响应 | 双向通信 |
| 服务端推送 | 需要轮询或长轮询 | 原生支持 |
| 数据格式 | 请求-响应模型 | 帧（Frame） |
| 适用场景 | 请求-响应类接口 | 实时通信 |

### 8.2 如何保证消息不丢失

1. **客户端**：发送消息后等待ACK，超时重试
2. **服务端**：消息落库后再发ACK
3. **存储**：消息持久化到数据库
4. **离线处理**：用户离线时存储离线消息

### 8.3 如何实现消息顺序

1. **相同会话内按sendTime排序**：服务器给每条消息一个序号
2. **全局顺序号**：对所有消息按序号排序（性能差，一般不用）
3. **因果顺序**：保证有因果关系的消息有序（如回复必须在原消息之后）

### 8.4 如何实现消息去重

1. **客户端**：消息ID去重，收到重复消息忽略
2. **服务端**：根据消息ID唯一索引去重

---

## 结语

好了，即时通讯系统Java后端实战就讲到这里。

IM系统是后端开发中最复杂的系统之一，涉及的技术点非常多：Netty网络编程、WebSocket协议、心跳机制、消息可靠投递、分布式会话、海量连接管理、消息存储……

希望大家在学习的过程中，多动手实践。可以先从简单的聊天功能开始，逐步完善心跳、ACK、离线消息等功能。

如果有任何问题，欢迎在评论区留言交流。
