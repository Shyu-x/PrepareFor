# 电商系统Java后端实战完全指南

## 前言：为什么选择电商项目作为实战入口

大家好，我是你们的讲师老王。今天咱们来聊聊为什么电商项目是Java后端学习过程中最经典的实战方向。

你们可能听说过"Java学好了能做什么"这个问题，答案有很多：可以做企业级应用、可以做微服务架构、可以做大数据平台。但是在这么多选择中，**电商系统**始终是初学者和进阶开发者最青睐的方向。为什么呢？因为电商系统涵盖了后端开发的方方面面——用户管理、商品展示、订单处理、支付对接、库存管理、缓存优化、分布式架构……这些东西你在电商项目里全都能学到。

而且电商项目的业务逻辑非常清晰，不像一些企业级项目那样充满了各种奇怪的业务规则。买过东西吧？下单、付款、发货、收货、评价，这套流程谁都能理解。**业务理解成本低，你就能把更多精力放在技术实现上**。

更重要的是，电商系统的并发量是非常大的。特别是在秒杀场景下，瞬间涌入的流量能轻松压垮一个没有优化过的系统。所以你能在电商项目里学到性能优化、缓存策略、分布式锁这些面试必问的高频考点。

好了，废话说完了，咱们正式开始。

---

## 第一章：电商系统整体架构设计

### 1.1 为什么需要微服务架构

在正式开始写代码之前，咱们先来聊聊架构问题。很多人学Java都是从一个单体应用开始的——一个Spring Boot项目，所有代码都堆在一起，用一个数据库。这种架构对于学习来说没问题，但是放到生产环境就不行了。

想象一下，如果你的电商系统用的是单体架构，当用户在下单的时候，商品服务、库存服务、支付服务、用户服务全都耦合在一起。一旦支付服务出了问题，整个下单流程都会崩溃。而且随着业务增长，所有功能都挤在一个应用里，部署和扩展都会成为噩梦。

所以现代电商系统普遍采用**微服务架构**。把一个巨大的单体应用拆分成多个独立的服务，每个服务负责一块具体的业务功能。用户服务负责用户注册登录，商品服务负责商品展示和搜索，订单服务负责处理订单，支付服务负责对接第三方支付……这样一来，每个服务都可以独立开发、独立部署、独立扩展。

**用一个生活化的例子来解释**：你点外卖的时候，商家、骑手、平台其实是三个独立的角色。商家只管做饭，骑手只管送餐，平台只管调度和匹配。他们之间通过手机通信，不需要了解对方的工作细节。微服务也是这个道理——每个服务只做好自己的事，通过API或者消息队列进行通信。

### 1.2 电商系统技术栈选型

既然选择了微服务架构，那每个微服务用什么技术呢？这里给大家一个主流的技术选型方案：

**核心框架**：Spring Boot 3.x + Spring Cloud Alibaba

为什么是这个组合？Spring Boot大家应该都很熟悉了，它简化了Spring应用的初始搭建和开发过程。而Spring Cloud Alibaba是阿里巴巴开源的一套微服务解决方案，它在Spring Cloud标准基础上集成了一系列组件，包括服务注册发现（Nacos）、配置管理、服务调用（OpenFeign）、熔断器（Sentinel）等。特别是国内的项目，用Spring Cloud Alibaba的特别多，因为它的文档中文友好，社区活跃度高。

**服务网关**：Spring Cloud Gateway

网关是系统的统一入口，所有外部请求都要经过网关。它负责路由转发、权限校验、限流熔断等功能。你可以把它想象成公司前台，所有访客都要先经过前台登记，才能见到具体的业务人员。

**消息队列**：RocketMQ

双十一的时候，订单量能在一秒内冲到几十万笔。如果这些请求全部直接打到后端数据库，数据库绝对会当场去世。消息队列的作用就是削峰填谷——把大量请求暂存在消息队列里，让后端系统按照自己的节奏慢慢处理。RocketMQ是阿里巴巴开源的分布式消息中间件，在国内电商领域用得非常多。

**数据库**：MySQL + ShardingSphere

MySQL大家都熟悉，是最流行的开源关系型数据库。但是单个MySQL实例的并发能力是有限的，当数据量超过几千万的时候，查询性能会明显下降。这时候就需要分库分表，把数据分散到多个数据库实例中。ShardingSphere就是做这个事情的，它提供数据分片、读写分离等功能。

**缓存**：Redis Cluster

Redis我们之前提过，它是基于内存的KV数据库，读写性能极高。在电商系统中，Redis主要用来缓存热点数据，比如商品信息、用户Session、库存数量等。特别是在秒杀场景下，库存数据必须放在Redis里，绝不能用数据库直接扣减库存。

**搜索引擎**：Elasticsearch

电商系统里商品搜索是核心功能之一。用户在搜索框里输入"手机"，系统要能快速返回所有包含"手机"的商品，而且还要支持品牌、价格区间、销量等多种过滤条件。Elasticsearch就是干这个的，它基于Lucene构建，能在毫秒级返回搜索结果。

**分布式事务**：Seata

在微服务架构下，一个业务操作往往涉及多个服务。比如下单操作，需要扣减库存、创建订单、扣减余额这三个步骤分别调用三个不同的服务。这三个步骤要么全部成功，要么全部失败，不能出现库存扣了但订单没创建的情况。Seata就是解决分布式事务问题的，它提供了AT、TCC、Saga等多种模式。

### 1.3 电商项目数据库设计

数据库设计是电商系统的根基。一个好的数据库设计能让你后续的开发事半功倍，反之则会让你在开发过程中不断踩坑。

#### 1.3.1 用户模块数据库设计

用户模块看起来简单，其实门道不少。首先看用户表：

```sql
-- 用户表：存储用户基本信息
CREATE TABLE `sys_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键自增',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名，唯一索引，用于登录',
    `password` VARCHAR(100) NOT NULL COMMENT '密码，使用BCrypt加密存储',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称，展示用',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱，可用于找回密码',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号，用于短信验证',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知，1男，2女',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '账号状态：1正常，0禁用',
    `login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除标记：0未删除，1已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**设计要点解析**：

1. **为什么密码要用BCrypt加密？** 这是业界标准。BCrypt是一种自适应哈希函数，它内置了盐值，能抵御彩虹表攻击，而且可以通过增加计算成本来适应硬件性能的提升。你不需要手动生成盐值，BCrypt会自己处理。

2. **为什么要逻辑删除而不是物理删除？** 这是为了数据安全。用户数据可能涉及到订单、优惠券等关联数据，如果物理删除（直接用DELETE语句），这些关联数据就会变成孤儿数据。而且有些业务场景需要查询用户的历史操作记录，逻辑删除可以保留这些数据。

3. **为什么要存储login_time和login_ip？** 这两个字段主要用于安全审计。当用户的账号出现异常登录时，可以通过这些信息判断是否是本人操作。

再看地址表：

```sql
-- 用户地址表：存储用户的收货地址
CREATE TABLE `user_address` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
    `user_id` BIGINT NOT NULL COMMENT '所属用户ID，外键关联sys_user',
    `consignee` VARCHAR(50) NOT NULL COMMENT '收货人姓名',
    `phone` VARCHAR(20) NOT NULL COMMENT '收货人手机号',
    `province` VARCHAR(50) NOT NULL COMMENT '省份',
    `city` VARCHAR(50) NOT NULL COMMENT '城市',
    `district` VARCHAR(50) NOT NULL COMMENT '区县',
    `detail_address` VARCHAR(255) NOT NULL COMMENT '详细地址（街道门牌号等）',
    `postal_code` VARCHAR(10) DEFAULT NULL COMMENT '邮政编码',
    `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否为默认地址：1默认，0非默认',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户地址表';
```

**设计要点解析**：

一个用户可以有多个收货地址，比如家里一个、公司一个。`is_default`字段用来标记哪个是默认地址，下单时会默认使用默认地址。

#### 1.3.2 商品模块数据库设计

商品模块是电商系统的核心。先看分类表：

```sql
-- 商品分类表：支持多级分类（如：服装 -> 男装 -> T恤）
CREATE TABLE `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `parent_id` BIGINT NOT NULL DEFAULT 0 COMMENT '父分类ID，0表示顶级分类',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标URL',
    `sort` INT NOT NULL DEFAULT 0 COMMENT '排序号，数字越小越靠前',
    `depth` INT NOT NULL DEFAULT 1 COMMENT '分类层级深度，从1开始',
    `path` VARCHAR(255) NOT NULL COMMENT '分类路径，格式：/1/3/5/，便于查询所有子孙分类',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_path` (`path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';
```

**设计要点解析**：

电商平台的商品分类通常是多级的，比如"服装"下面是"男装"和"女装"，"男装"下面又有"T恤"、"衬衫"等。`parent_id`字段表示上级分类，0表示顶级分类。

`path`字段是精华设计。它存储的是从根分类到当前分类的完整路径，格式类似"/1/3/5/"。这个字段有什么用呢？当你想要查询"男装"分类下的所有商品（包括男装及其子分类T恤、衬衫等）时，只需要用`LIKE '/1/3/%'`就可以一次性查出所有子孙分类，非常高效。

再看商品表：

```sql
-- 商品表：存储商品主信息
CREATE TABLE `sku` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '商品SKU ID',
    `spu_id` BIGINT NOT NULL COMMENT '所属SPU ID，外键关联商品SPU表',
    `code` VARCHAR(50) NOT NULL COMMENT '商品编码，唯一，用于库存管理',
    `name` VARCHAR(200) NOT NULL COMMENT '商品名称（SKU维度，如：iPhone15 Pro 256GB 深空黑色）',
    `price` DECIMAL(10,2) NOT NULL COMMENT '售价，单位元',
    `cost_price` DECIMAL(10,2) NOT NULL COMMENT '成本价，用于利润计算',
    `market_price` DECIMAL(10,2) NOT NULL COMMENT '市场价，用于展示划线价格',
    `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    `stock_alarm` INT NOT NULL DEFAULT 10 COMMENT '库存预警值，低于此值提醒补货',
    `weight` DECIMAL(10,2) DEFAULT NULL COMMENT '重量，单位kg，用于物流计算',
    `image` VARCHAR(255) NOT NULL COMMENT '商品主图URL',
    `images` TEXT DEFAULT NULL COMMENT '商品图片列表，JSON数组格式',
    `specs` JSON DEFAULT NULL COMMENT '规格属性JSON，如：{"颜色":"黑色","内存":"256GB"}',
    `sales` INT NOT NULL DEFAULT 0 COMMENT '销量，累计已售出数量',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '商品状态：1上架，0下架',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_spu_id` (`spu_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SKU表';

-- 商品SPU表：存储商品公共信息（不涉及具体规格）
CREATE TABLE `spu` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '商品SPU ID',
    `name` VARCHAR(200) NOT NULL COMMENT '商品SPU名称（如：iPhone 15 Pro）',
    `sub_name` VARCHAR(255) DEFAULT NULL COMMENT '商品副标题/宣传语',
    `category_id` BIGINT NOT NULL COMMENT '所属分类ID，外键',
    `brand_id` BIGINT DEFAULT NULL COMMENT '所属品牌ID，外键',
    `description` TEXT DEFAULT NULL COMMENT '商品详细描述（富文本）',
    `spec_template` JSON DEFAULT NULL COMMENT '规格模板，定义该类商品有哪些规格项',
    `after_sale` TEXT DEFAULT NULL COMMENT '售后服务说明',
    `tags` VARCHAR(500) DEFAULT NULL COMMENT '商品标签，逗号分隔，如：正品保证,极速发货',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_brand_id` (`brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SPU表';
```

**设计要点解析**：

这里引入了SPU和SKU的概念，这是电商系统特有的设计。

**SPU（Standard Product Unit）** 是"标准产品单位"，它是商品公共信息的聚合。比如iPhone 15 Pro是一个SPU，它包含品牌、分类、描述等公共信息。

**SKU（Stock Keeping Unit）** 是"库存量单位"，它是具体可售卖的商品。比如"iPhone 15 Pro 256GB 深空黑色"是一个SKU，它有具体的库存、价格、规格属性。

为什么要这么设计？考虑一个场景：iPhone 15 Pro有4种颜色（黑色、白色、蓝色、钛金属）、3种存储（128GB、256GB、512GB），组合起来就是12个SKU。如果不区分SPU和SKU，你就得创建12条冗余的公共信息（品牌、分类、描述等）。而现在，公共信息存在SPU表里，每个SKU只存储自己特有的规格和价格。

`specs`字段是JSON类型，存储这个SKU的具体规格。比如`{"颜色":"深空黑色","内存":"256GB"}`。前端可以根据这个渲染SKU的选择器。

`spec_template`字段定义了这类商品有哪些规格项可选。比如手机类目的规格模板可能是`["颜色","内存","套餐"]`，每个SKU再从这些规格项中选择具体的值。

#### 1.3.3 订单模块数据库设计

订单是电商系统的命脉，订单表的设计要特别谨慎：

```sql
-- 订单主表：存储订单基本信息和状态
CREATE TABLE `order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单ID',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单号，唯一，用于外部查询',
    `user_id` BIGINT NOT NULL COMMENT '下单用户ID',
    `order_status` TINYINT NOT NULL DEFAULT 1 COMMENT '订单状态：1待付款，2待发货，3配送中，4已完成，5已取消，6退款中，7已退款',
    `pay_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0未支付，1已支付，2已退款',
    `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总金额（商品原价合计）',
    `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '优惠金额',
    `pay_amount` DECIMAL(10,2) NOT NULL COMMENT '实付金额（总金额-优惠+运费）',
    `freight_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '运费',
    `coupon_id` BIGINT DEFAULT NULL COMMENT '使用的优惠券ID',
    `coupon_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '优惠券抵扣金额',
    `address_id` BIGINT NOT NULL COMMENT '收货地址ID',
    `consignee` VARCHAR(50) NOT NULL COMMENT '收货人姓名（下单快照）',
    `phone` VARCHAR(20) NOT NULL COMMENT '收货人电话（下单快照）',
    `province` VARCHAR(50) NOT NULL COMMENT '省份（下单快照）',
    `city` VARCHAR(50) NOT NULL COMMENT '城市（下单快照）',
    `district` VARCHAR(50) NOT NULL COMMENT '区县（下单快照）',
    `detail_address` VARCHAR(255) NOT NULL COMMENT '详细地址（下单快照）',
    `buyer_message` VARCHAR(500) DEFAULT NULL COMMENT '买家留言',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `delivery_time` DATETIME DEFAULT NULL COMMENT '发货时间',
    `receive_time` DATETIME DEFAULT NULL COMMENT '收货时间',
    `cancel_time` DATETIME DEFAULT NULL COMMENT '取消时间',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '取消原因',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_order_status` (`order_status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- 订单商品表：存储订单中包含的商品明细
CREATE TABLE `order_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单项ID',
    `order_id` BIGINT NOT NULL COMMENT '所属订单ID',
    `sku_id` BIGINT NOT NULL COMMENT '商品SKU ID',
    `sku_name` VARCHAR(200) NOT NULL COMMENT '商品名称（下单快照）',
    `sku_image` VARCHAR(255) NOT NULL COMMENT '商品图片（下单快照）',
    `sku_specs` JSON DEFAULT NULL COMMENT '商品规格（下单快照）',
    `price` DECIMAL(10,2) NOT NULL COMMENT '商品单价（下单时的价格）',
    `quantity` INT NOT NULL COMMENT '购买数量',
    `total_amount` DECIMAL(10,2) NOT NULL COMMENT '该项总金额（price * quantity）',
    `refund_status` TINYINT NOT NULL DEFAULT 0 COMMENT '退款状态：0未退款，1退款中，2已退款，3拒绝退款',
    `refund_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '已退款金额',
    `refund_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款原因',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_sku_id` (`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细表';
```

**设计要点解析**：

1. **为什么要存储收货信息的快照？**
   这是一个非常重要的设计原则——**订单快照**。用户的收货地址可能会变化，但是如果订单已经生成，我们希望订单的收货信息保持不变。比如用户下单时用的是家里的地址，后来搬家改了地址，但是这笔历史订单的收货地址应该还是"旧地址"而不是"新地址"。所以订单表里直接存储了收货人、电话、地址这些信息，而不是存一个地址表的外键。

2. **为什么要存储商品信息的快照？**
   同理，商品的信息也可能会变化。iPhone 15 Pro的价格可能明天就降了，但是如果用户是在今天下单的，那这笔订单的价格就应该是"下单时的价格"而不是"现在的价格"。所以订单项表里存储了商品名称、图片、规格、价格这些字段的快照。

3. **订单号为什么用字符串而不是自增ID？**
   自增ID有一个问题：别人可以通过订单ID推算出你的订单总量，这是不安全的。而且自增ID没有业务含义，订单号通常需要包含时间信息、商户信息等。所以实际项目中订单号通常是20-32位的字符串，格式类似"2026040215000012345678"，前14位是时间戳，后面是序列号。

4. **为什么订单状态和支付状态要分开？**
   这是因为订单状态和支付状态是两个独立的维度。订单支付了不代表订单能正常发货（比如库存不足需要退款），退款了也不代表订单要被取消。分开设计能让业务逻辑更清晰。

#### 1.3.4 库存模块数据库设计

库存是电商系统最核心的数据之一，直接关系到能否正确完成下单：

```sql
-- 仓库表：存储仓库信息
CREATE TABLE `warehouse` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '仓库ID',
    `name` VARCHAR(100) NOT NULL COMMENT '仓库名称',
    `code` VARCHAR(50) NOT NULL COMMENT '仓库编码，唯一',
    `type` TINYINT NOT NULL DEFAULT 1 COMMENT '仓库类型：1本地仓，2中心仓，3海外仓',
    `province` VARCHAR(50) NOT NULL COMMENT '所在省份',
    `city` VARCHAR(50) NOT NULL COMMENT '所在城市',
    `district` VARCHAR(50) NOT NULL COMMENT '所在区县',
    `address` VARCHAR(255) NOT NULL COMMENT '详细地址',
    `contact` VARCHAR(50) DEFAULT NULL COMMENT '联系人',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库表';

-- 库存表：存储每个SKU在每个仓库的库存
CREATE TABLE `stock` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '库存记录ID',
    `warehouse_id` BIGINT NOT NULL COMMENT '仓库ID',
    `sku_id` BIGINT NOT NULL COMMENT '商品SKU ID',
    `total_stock` INT NOT NULL DEFAULT 0 COMMENT '总库存数量',
    `locked_stock` INT NOT NULL DEFAULT 0 COMMENT '锁定库存数量（下单锁定）',
    `available_stock` INT NOT NULL DEFAULT 0 COMMENT '可用库存数量（total - locked）',
    `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号，用于并发控制',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_warehouse_sku` (`warehouse_id`, `sku_id`),
    KEY `idx_sku_id` (`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- 库存流水表：记录每次库存变动，用于追溯和对账
CREATE TABLE `stock_flow` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '流水ID',
    `sku_id` BIGINT NOT NULL COMMENT '商品SKU ID',
    `warehouse_id` BIGINT NOT NULL COMMENT '仓库ID',
    `order_no` VARCHAR(32) DEFAULT NULL COMMENT '关联订单号（如果有）',
    `flow_type` TINYINT NOT NULL COMMENT '流水类型：1采购入库，2销售出库，3订单锁定，4订单释放，5退款返还，6盘点调整',
    `flow_direction` TINYINT NOT NULL COMMENT '流动方向：1入库（增加），2出库（减少）',
    `quantity` INT NOT NULL COMMENT '变动数量',
    `before_stock` INT NOT NULL COMMENT '变动前库存',
    `after_stock` INT NOT NULL COMMENT '变动后库存',
    `reason` VARCHAR(255) DEFAULT NULL COMMENT '变动原因',
    `operator` VARCHAR(50) DEFAULT NULL COMMENT '操作人',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_sku_id` (`sku_id`),
    KEY `idx_order_no` (`order_no`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存流水表';
```

**设计要点解析**：

1. **为什么要按仓库存储库存？**
   大型电商平台会有多个仓库，不同仓库的库存是分开管理的。用户下单时，系统需要根据用户的收货地址匹配最近的仓库来发货。同时，某个仓库库存不足时，可能需要从其他仓库调拨。

2. **为什么要区分总库存、锁定库存、可用库存？**
   这是库存管理的核心三要素：
   - **总库存**：仓库里一共有多少货
   - **锁定库存**：已经被下单锁定但还没发货的货，这些货不能卖给别人
   - **可用库存**：可以正常售卖的货，总库存减去锁定库存

3. **库存流水表有什么用？**
   库存流水表是审计和追溯的基础。每一次库存变动都要记录流水，包括入库、出库、锁定、释放等。通过库存流水可以还原任何一个时间点的库存状态，也可以排查库存异常（比如库存对不上）。

4. **为什么用乐观锁而不是悲观锁？**
   乐观锁是通过版本号控制的，每次更新时检查版本号是否变化。这种方式在高并发场景下性能更好，因为不会阻塞。悲观锁是直接加行锁，虽然安全但是会严重影响并发性能。对于库存这种"读多写多"的场景，乐观锁是更好的选择。

#### 1.3.5 支付模块数据库设计

```sql
-- 支付渠道表：存储支持的支付方式
CREATE TABLE `pay_channel` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '渠道ID',
    `code` VARCHAR(50) NOT NULL COMMENT '渠道编码：alipay, wechat, unionpay',
    `name` VARCHAR(100) NOT NULL COMMENT '渠道名称：支付宝，微信支付，银联云闪付',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '渠道图标URL',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用，0禁用',
    `sort` INT NOT NULL DEFAULT 0 COMMENT '排序号',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付渠道表';

-- 支付记录表：存储每一笔支付请求
CREATE TABLE `payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
    `payment_no` VARCHAR(32) NOT NULL COMMENT '支付流水号（我们生成的）',
    `order_no` VARCHAR(32) NOT NULL COMMENT '关联订单号',
    `user_id` BIGINT NOT NULL COMMENT '支付用户ID',
    `channel_id` BIGINT NOT NULL COMMENT '支付渠道ID',
    `channel_code` VARCHAR(50) NOT NULL COMMENT '支付渠道编码',
    `channel_trade_no` VARCHAR(128) DEFAULT NULL COMMENT '渠道返回的交易流水号（微信订单号、支付宝交易号等）',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    `fee_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '手续费',
    `pay_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0待支付，1支付成功，2支付失败，3已取消，4已退款',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付成功时间',
    `notify_time` DATETIME DEFAULT NULL COMMENT '渠道通知时间',
    `notify_data` TEXT DEFAULT NULL COMMENT '渠道通知的原始数据JSON',
    `client_ip` VARCHAR(50) DEFAULT NULL COMMENT '客户端IP',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_payment_no` (`payment_no`),
    KEY `idx_order_no` (`order_no`),
    KEY `idx_channel_trade_no` (`channel_trade_no`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 退款记录表：存储退款申请和退款流水
CREATE TABLE `refund` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '退款记录ID',
    `refund_no` VARCHAR(32) NOT NULL COMMENT '退款单号',
    `payment_no` VARCHAR(32) NOT NULL COMMENT '关联支付流水号',
    `order_no` VARCHAR(32) NOT NULL COMMENT '关联订单号',
    `user_id` BIGINT NOT NULL COMMENT '退款申请人ID',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '退款金额',
    `refund_type` TINYINT NOT NULL DEFAULT 1 COMMENT '退款类型：1仅退款，2退货退款',
    `refund_reason` VARCHAR(500) NOT NULL COMMENT '退款原因',
    `refund_desc` VARCHAR(500) DEFAULT NULL COMMENT '退款说明',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '退款状态：1待审核，2退款中，3已完成，4已拒绝',
    `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `channel_refund_no` VARCHAR(128) DEFAULT NULL COMMENT '渠道退款流水号',
    `refund_time` DATETIME DEFAULT NULL COMMENT '退款完成时间',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_refund_no` (`refund_no`),
    KEY `idx_payment_no` (`payment_no`),
    KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录表';
```

---

## 第二章：商品模块核心功能实现

### 2.1 商品CRUD基本功能

先从最简单的商品增删改查开始。虽然听起来简单，但是商品模块的CRUD有很多需要注意的地方。

#### 2.1.1 商品实体类设计

```java
package com.example.ecommerce.product.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 商品SPU实体类
 * SPU是商品的公共信息集合，比如"iPhone 15 Pro"是一个SPU
 * 同一个SPU下可以有多个SKU（具体可售卖的规格）
 */
@Data
@TableName("spu")
public class SpuEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 商品名称（SPU维度）
     * 比如"iPhone 15 Pro"，不包含具体规格
     */
    private String name;

    /**
     * 商品副标题/宣传语
     * 用于商品列表页展示，吸引用户点击
     */
    private String subName;

    /**
     * 所属分类ID
     * 注意：这里只存叶子节点分类ID（前端的分类筛选是按照这个来的）
     */
    private Long categoryId;

    /**
     * 所属品牌ID
     * 允许为空，比如一些小店没有品牌概念
     */
    private Long brandId;

    /**
     * 商品详细描述（富文本）
     * 使用HTML格式，支持图片、视频等多媒体内容
     */
    private String description;

    /**
     * 规格模板
     * JSON格式，定义该类商品有哪些规格项
     * 比如手机类目可能是：[{"name":"颜色","values":["黑色","白色","蓝色"]}, {"name":"内存","values":["128GB","256GB","512GB"]}]
     * 这个模板用于指导SKU的规格录入
     */
    private String specTemplate;

    /**
     * 售后服务说明
     * 比如"7天无理由退换"、"终身质保"等
     */
    private String afterSale;

    /**
     * 商品标签
     * 逗号分隔的字符串，如"正品保证,极速发货,新人特惠"
     * 用于商品列表页的标签展示
     */
    private String tags;

    /**
     * 创建时间
     * 使用MybatisPlus的自动填充功能，不需要手动设置
     */
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    /**
     * 更新时间
     * 在每次更新操作时自动填充
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
```

为什么要用MybatisPlus的自动填充？因为创建时间和更新时间几乎每个表都有，如果每个Service都要手动设置，会非常繁琐。而且手动设置容易遗漏或者出错。自动填充配置好之后，每次插入会自动设置createTime，每次更新会自动设置updateTime。

#### 2.1.2 商品查询功能

商品查询是最高频的操作，需要支持多种筛选条件：

```java
package com.example.ecommerce.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.ecommerce.product.entity.SkuEntity;
import com.example.ecommerce.product.entity.SpuEntity;
import com.example.ecommerce.product.mapper.SpuMapper;
import com.example.ecommerce.product.query.SpuQuery;
import com.example.ecommerce.product.service.ISpuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 商品SPU服务实现类
 * 负责商品的核心业务逻辑
 */
@Service
@RequiredArgsConstructor
public class SpuServiceImpl extends ServiceImpl<SpuMapper, SpuEntity> implements ISpuService {

    private final SpuMapper spuMapper;

    /**
     * 分页查询商品列表
     * 支持多条件组合筛选
     *
     * @param query 查询条件封装对象
     * @return 分页结果
     */
    @Override
    public IPage<SpuEntity> queryPage(SpuQuery query) {
        // 构建动态查询条件
        LambdaQueryWrapper<SpuEntity> wrapper = new LambdaQueryWrapper<>();

        // 按分类查询 - 支持查询该分类及其所有子分类的商品
        if (query.getCategoryId() != null) {
            // 如果前端传了分类ID，通常也需要查询该分类下所有子分类的商品
            // 这里简化处理，实际项目中可能需要先查询分类的所有子孙ID
            wrapper.eq(SpuEntity::getCategoryId, query.getCategoryId());
        }

        // 按品牌查询
        if (query.getBrandId() != null) {
            wrapper.eq(SpuEntity::getBrandId, query.getBrandId());
        }

        // 按关键词搜索（商品名称或副标题）
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w
                    .like(SpuEntity::getName, query.getKeyword())
                    .or()
                    .like(SpuEntity::getSubName, query.getKeyword())
            );
        }

        // 按价格区间筛选
        if (query.getMinPrice() != null) {
            // 价格筛选需要关联SKU表，这里简化处理
            // 实际项目中可能需要子查询或者ES来完成
        }

        // 按状态筛选（上下架状态）
        // 如果不传，默认查询上架商品
        if (query.getStatus() != null) {
            wrapper.eq(SpuEntity::getStatus, query.getStatus());
        }

        // 按创建时间排序
        // 如果不传排序字段，默认按创建时间倒序（ newest first）
        if (!StringUtils.hasText(query.getSortField())) {
            wrapper.orderByDesc(SpuEntity::getCreateTime);
        } else {
            // 支持自定义排序字段和排序方式
            if ("sales".equals(query.getSortField())) {
                // 如果按销量排序，需要关联SKU表聚合
                // 简化处理，实际项目用ES或专门的销量字段
            } else if ("price".equals(query.getSortField())) {
                // 按价格排序，同样需要关联SKU
            } else {
                wrapper.orderByDesc(SpuEntity::getCreateTime);
            }
        }

        // 执行分页查询
        Page<SpuEntity> page = new Page<>(query.getPageNum(), query.getPageSize());
        return baseMapper.selectPage(page, wrapper);
    }

    /**
     * 获取商品详情
     * 包括SPU信息、SKU列表、规格信息等
     *
     * @param id SPU ID
     * @return 商品详情VO
     */
    @Override
    public SpuDetailVO getDetail(Long id) {
        // 查询SPU基本信息
        SpuEntity spu = baseMapper.selectById(id);
        if (spu == null) {
            throw new BusinessException("商品不存在");
        }

        // 查询该SPU下的所有SKU
        List<SkuEntity> skuList = skuService.list(
                new LambdaQueryWrapper<SkuEntity>()
                        .eq(SkuEntity::getSpuId, id)
                        .orderByAsc(SkuEntity::getPrice)
        );

        // 封装返回VO
        SpuDetailVO vo = new SpuDetailVO();
        vo.setSpu(spu);
        vo.setSkuList(skuList);
        // 可以继续添加规格组合、评价统计等信息

        return vo;
    }
}
```

**查询优化的关键点**：

1. **为什么要用LambdaQueryWrapper而不是字符串形式的QueryWrapper？**
   LambdaQueryWrapper可以用类的方法引用（如`SpuEntity::getName`）来指定字段，而不是写字符串" name "。这样在重构（比如改字段名）的时候，编译器会帮你检查有没有写错。而且IDE的自动补全也更准确。

2. **为什么要用Page对象而不是Limit？**
   Page对象不仅包含分页信息（pageNum、pageSize），还包含总记录数、总页数等分页信息。用Limit的话这些信息需要手动计算。

3. **keyword搜索为什么要用like而不是=？**
   用户搜索"手机"，可能搜到"小米手机"、"华为手机"、"手机配件"等。如果用等于，就只能精确匹配"手机"这两个字，这显然不是用户期望的。

### 2.2 商品搜索功能

当商品数量达到几十万甚至几百万的时候，数据库查询就力不从心了。这时候需要用到搜索引擎。电商系统主流的选择是Elasticsearch（简称ES）。

#### 2.2.1 为什么要用Elasticsearch

MySQL的LIKE查询在大数据量下性能很差，而且无法实现复杂的搜索功能（比如同义词搜索、拼音搜索、相关性排序等）。

ES是专门为全文搜索设计的，它的特点：
1. **倒排索引**：不是按文档ID查词，而是按词查文档ID，类似书的索引
2. **分布式**：数据分散存储在多个节点，支持水平扩展
3. **实时性**：新增数据可以近实时地被搜索到
4. **相关性评分**：可以根据关键词的相关性排序

#### 2.2.2 商品索引设计

```java
package com.example.ecommerce.search.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 商品ES文档实体
 * 用于在Elasticsearch中存储和搜索商品
 */
@Data
@Document(indexName = "product")  // ES索引名
@Setting(shards = 3, replicas = 1)  // 分片数3，副本数1
public class ProductDocument {

    @Id
    private Long id;

    /**
     * 商品名称
     * 使用text类型，支持全文搜索
     * analyzer指定分词器：ik_max_word是最细粒度的中文分词
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String name;

    /**
     * 商品副标题
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String subName;

    /**
     * 商品编码
     * 使用keyword类型，不分词，精确匹配
     */
    @Field(type = FieldType.Keyword)
    private String code;

    /**
     * 分类ID
     */
    @Field(type = FieldType.Long)
    private Long categoryId;

    /**
     * 分类名称
     * 用于展示，不参与搜索
     */
    @Field(type = FieldType.Keyword)
    private String categoryName;

    /**
     * 品牌ID
     */
    @Field(type = FieldType.Long)
    private Long brandId;

    /**
     * 品牌名称
     */
    @Field(type = FieldType.Keyword)
    private String brandName;

    /**
     * 价格区间
     * 使用nested类型，因为SKU有多个规格，每个规格有自己的价格
     * 实际上对于商品列表，我们关心的是最低价
     */
    @Field(type = FieldType.Double)
    private BigDecimal minPrice;

    /**
     * 最高价
     */
    @Field(type = FieldType.Double)
    private BigDecimal maxPrice;

    /**
     * 销量
     * 用于排序
     */
    @Field(type = FieldType.Integer)
    private Integer sales;

    /**
     * 商品图片
     */
    @Field(type = FieldType.Keyword)
    private String image;

    /**
     * 商品标签
     * 支持多个标签，用keyword数组存储
     */
    @Field(type = FieldType.Keyword)
    private List<String> tags;

    /**
     * 规格属性
     * 使用nested类型，因为规格是对象数组
     * 比如颜色、内存等
     */
    @Field(type = FieldType.Nested)
    private List<SpecEntity> specs;

    /**
     * 上架状态
     * 0下架 1上架
     */
    @Field(type = FieldType.Integer)
    private Integer status;

    /**
     * 创建时间
     */
    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second)
    private LocalDateTime createTime;

    /**
     * SKU列表
     * 用于商品详情页展示
     */
    @Field(type = FieldType.Nested)
    private List<SkuDocument> skus;

    /**
     * 规格属性内部类
     */
    @Data
    public static class SpecEntity {
        @Field(type = FieldType.Keyword)
        private String name;  // 规格名，如"颜色"

        @Field(type = FieldType.Keyword)
        private String value;  // 规格值，如"黑色"
    }

    /**
     * SKU文档内部类
     */
    @Data
    public static class SkuDocument {
        @Field(type = FieldType.Long)
        private Long id;

        @Field(type = FieldType.Keyword)
        private String specs;  // JSON格式的规格

        @Field(type = FieldType.Double)
        private BigDecimal price;

        @Field(type = FieldType.Integer)
        private Integer stock;

        @Field(type = FieldType.Keyword)
        private String image;
    }
}
```

**索引设计的要点**：

1. **为什么名称要用text而不是keyword？**
   `text`类型会分词，适合全文搜索。比如"iPhone 15 Pro"会被分成"iphone"、"15"、"pro"三个词，用户搜"iphone"或"pro"都能匹配到。`keyword`类型不会分词，必须完全匹配"iPhone 15 Pro"才能查到。

2. **为什么要指定分词器？**
   英文分词很简单，按空格和标点分割就行。中文分词就复杂了，"苹果"可以是一个词也可以是"苹"+"果"。IK是国内常用的中文分词器，`ik_max_word`会穷尽各种分词可能（比如"中华人民共和国"会分成"中华人民共和国"、"中华人民"、"华人"、"共和国"等），`ik_smart`会分成最合理的几个词。

3. **为什么要用nested类型？**
   因为规格属性是一个数组，每个元素是{name, value}的结构。如果用普通的object类型，ES会扁平化存储，导致跨元素的查询出错。nested类型可以保持数组元素之间的独立性。

#### 2.2.3 商品搜索实现

```java
package com.example.ecommerce.search.service.impl;

import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import com.example.ecommerce.search.document.ProductDocument;
import com.example.ecommerce.search.dto.ProductSearchDTO;
import com.example.ecommerce.search.service.IProductSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 商品搜索服务实现类
 * 封装ES搜索的各种复杂查询逻辑
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductSearchServiceImpl implements IProductSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    /**
     * 复杂商品搜索
     * 支持关键词搜索、分类筛选、品牌筛选、价格区间、规格筛选、排序分页
     *
     * @param dto 搜索条件
     * @return 搜索结果
     */
    @Override
    public SearchResultDTO search(ProductSearchDTO dto) {
        // 构建查询条件
        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();

        // 1. 必须上架的商品
        boolQueryBuilder.filter(TermQuery.of(t -> t.field("status").value(1))._toQuery());

        // 2. 关键词搜索（搜索名称和副标题）
        if (StringUtils.hasText(dto.getKeyword())) {
            boolQueryBuilder.must(MultiMatchQuery.of(m -> m
                    .query(dto.getKeyword())
                    .fields("name^3", "subName^2")  // name字段权重更高
                    .type(TextQueryType.BestFields)
                    .fuzziness("AUTO")  // 模糊匹配，允许错别字
            )._toQuery());
        }

        // 3. 分类筛选
        if (dto.getCategoryId() != null) {
            boolQueryBuilder.filter(TermQuery.of(t -> t
                    .field("categoryId")
                    .value(dto.getCategoryId())
            )._toQuery());
        }

        // 4. 品牌筛选（支持多选）
        if (dto.getBrandIds() != null && !dto.getBrandIds().isEmpty()) {
            boolQueryBuilder.filter(TermsQuery.of(t -> t
                    .field("brandId")
                    .terms(terms -> terms.value(
                            dto.getBrandIds().stream()
                                    .map(id -> co.elastic.clients.elasticsearch._types.FieldValue.of(id))
                                    .collect(Collectors.toList())
                    ))
            )._toQuery());
        }

        // 5. 价格区间筛选
        if (dto.getMinPrice() != null || dto.getMaxPrice() != null) {
            boolQueryBuilder.filter(RangeQuery.of(r -> {
                var rangeBuilder = r.field("minPrice");
                if (dto.getMinPrice() != null) {
                    rangeBuilder.gte(co.elastic.clients.json.JsonData.of(dto.getMinPrice()));
                }
                if (dto.getMaxPrice() != null) {
                    rangeBuilder.lte(co.elastic.clients.json.JsonData.of(dto.getMaxPrice()));
                }
                return rangeBuilder;
            })._toQuery());
        }

        // 6. 标签筛选
        if (StringUtils.hasText(dto.getTag())) {
            boolQueryBuilder.filter(TermQuery.of(t -> t
                    .field("tags")
                    .value(dto.getTag())
            )._toQuery());
        }

        // 7. 规格筛选（比如筛选"颜色:黑色"）
        if (dto.getSpecs() != null && !dto.getSpecs().isEmpty()) {
            for (var spec : dto.getSpecs().entrySet()) {
                String specName = spec.getKey();
                String specValue = spec.getValue();
                // 使用nested查询，因为规格是nested类型
                boolQueryBuilder.filter(NestedQuery.of(n -> n
                        .path("specs")
                        .query(q -> q.bool(b -> b
                                .must(TermQuery.of(t -> t.field("specs.name").value(specName))._toQuery())
                                .must(TermQuery.of(t -> t.field("specs.value").value(specValue))._toQuery())
                        ))
                )._toQuery());
            }
        }

        // 构建排序规则
        List<co.elastic.clients.elasticsearch._types.SortOptions> sortOptions = new ArrayList<>();
        if (StringUtils.hasText(dto.getSortField())) {
            SortOrder sortOrder = "asc".equalsIgnoreCase(dto.getSortOrder())
                    ? SortOrder.Asc : SortOrder.Desc;

            switch (dto.getSortField()) {
                case "sales":
                    sortOptions.add(co.elastic.clients.elasticsearch._types.SortOptions.of(s -> s
                            .field(f -> f.field("sales").order(sortOrder))));
                    break;
                case "price":
                    sortOptions.add(co.elastic.clients.elasticsearch._types.SortOptions.of(s -> s
                            .field(f -> f.field("minPrice").order(sortOrder))));
                    break;
                case "createTime":
                    sortOptions.add(co.elastic.clients.elasticsearch._types.SortOptions.of(s -> s
                            .field(f -> f.field("createTime").order(sortOrder))));
                    break;
                default:
                    // 默认按相关性评分排序
                    sortOptions.add(co.elastic.clients.elasticsearch._types.SortOptions.of(s -> s
                            .score(sc -> sc.order(SortOrder.Desc))));
            }
        } else {
            // 默认按相关性评分排序，没有关键词时按销量排序
            sortOptions.add(co.elastic.clients.elasticsearch._types.SortOptions.of(s -> s
                    .score(sc -> sc.order(SortOrder.Desc))));
        }

        // 构建ES查询
        NativeQuery query = NativeQuery.builder()
                .withQuery(boolQueryBuilder.build()._toQuery())
                .withSort(sortOptions)
                .withPageable(PageRequest.of(dto.getPageNum() - 1, dto.getPageSize()))  // ES分页从0开始
                .build();

        // 执行搜索
        SearchHits<ProductDocument> searchHits = elasticsearchOperations.search(query, ProductDocument.class);

        // 封装结果
        SearchResultDTO result = new SearchResultDTO();
        result.setTotal(searchHits.getTotalHits());
        result.setProducts(searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList()));

        return result;
    }
}
```

---

## 第三章：订单模块核心功能实现

### 3.1 下单流程设计

下单是电商系统最复杂的业务流程之一。它涉及多个系统之间的协调：

1. **验库存**：检查商品库存是否充足
2. **锁库存**：预占库存，防止超卖
3. **创建订单**：在订单数据库创建订单记录
4. **扣减库存**：实际扣减库存
5. **发送消息**：发送订单创建消息，触发后续流程（比如发送MQ消息给物流系统）

而且这些步骤必须保证原子性，要么全部成功，要么全部失败。

#### 3.1.1 下单接口实现

```java
package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.exception.BusinessException;
import com.example.ecommerce.order.dto.OrderCreateDTO;
import com.example.ecommerce.order.dto.OrderItemDTO;
import com.example.ecommerce.order.entity.OrderEntity;
import com.example.ecommerce.order.entity.OrderItemEntity;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.product.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 订单服务实现类
 * 核心业务：创建订单
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final StockService stockService;

    /**
     * 创建订单
     * 这是一个事务方法，保证订单创建的原子性
     *
     * @param userId 用户ID
     * @param dto 下单参数
     * @return 订单号
     */
    @Override
    @Transactional(rollbackFor = Exception.class)  // 任何异常都回滚事务
    public String createOrder(Long userId, OrderCreateDTO dto) {
        log.info("开始创建订单，用户ID：{}，商品数量：{}", userId, dto.getItems().size());

        // 第一步：获取用户信息
        UserEntity user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 获取收货地址（省略校验）
        AddressEntity address = addressService.getById(dto.getAddressId());

        // 第二步：获取商品信息和价格（省略商品查询细节）
        // 实际项目中，商品信息应该从缓存获取
        Map<Long, SkuEntity> skuMap = skuService.listByIds(
                dto.getItems().stream()
                        .map(OrderItemDTO::getSkuId)
                        .collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(SkuEntity::getId, s -> s));

        // 第三步：计算订单金额
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        List<OrderItemEntity> orderItems = new ArrayList<>();

        for (OrderItemDTO itemDTO : dto.getItems()) {
            SkuEntity sku = skuMap.get(itemDTO.getSkuId());
            if (sku == null) {
                throw new BusinessException("商品不存在：" + itemDTO.getSkuId());
            }

            if (sku.getStock() < itemDTO.getQuantity()) {
                throw new BusinessException("商品库存不足：" + sku.getName());
            }

            // 计算商品小计
            BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));

            // 构建订单项实体
            OrderItemEntity item = new OrderItemEntity();
            item.setSkuId(sku.getId());
            item.setSkuName(sku.getName());
            item.setSkuImage(sku.getImage());
            item.setSkuSpecs(sku.getSpecs());
            item.setPrice(sku.getPrice());
            item.setQuantity(itemDTO.getQuantity());
            item.setTotalAmount(itemTotal);

            orderItems.add(item);
            totalAmount = totalAmount.add(itemTotal);
        }

        // 计算优惠（省略优惠计算逻辑）
        BigDecimal payAmount = totalAmount.subtract(discountAmount);

        // 第四步：锁定库存（重要！）
        // 为什么要先锁定而不是直接扣减？
        // 因为下单和支付之间有时间差，如果直接扣减库存，用户还没付款库存就没了
        // 先锁定，支付成功后真正扣减，超时未支付就释放锁定
        for (OrderItemDTO itemDTO : dto.getItems()) {
            boolean locked = stockService.lockStock(itemDTO.getSkuId(), itemDTO.getQuantity());
            if (!locked) {
                throw new BusinessException("库存锁定失败：" + skuMap.get(itemDTO.getSkuId()).getName());
            }
        }

        // 第五步：创建订单
        String orderNo = generateOrderNo();  // 生成订单号
        OrderEntity order = new OrderEntity();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setOrderStatus(1);  // 待付款
        order.setPayStatus(0);     // 未支付
        order.setTotalAmount(totalAmount);
        order.setDiscountAmount(discountAmount);
        order.setPayAmount(payAmount);
        // 收货信息快照
        order.setConsignee(address.getConsignee());
        order.setPhone(address.getPhone());
        order.setProvince(address.getProvince());
        order.setCity(address.getCity());
        order.setDistrict(address.getDistrict());
        order.setDetailAddress(address.getDetailAddress());

        orderMapper.insert(order);

        // 第六步：保存订单项
        for (OrderItemEntity item : orderItems) {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
        }

        // 第七步：发送订单创建消息（异步，不影响主流程）
        // 使用MQ通知其他系统：库存系统、物流系统、会员系统等
        orderMessageSender.sendOrderCreatedMessage(order);

        log.info("订单创建成功，订单号：{}", orderNo);
        return orderNo;
    }

    /**
     * 生成订单号
     * 格式：时间戳(14位) + 序列号(6位) + 随机数(4位)
     * 共24位，保证全局唯一且有意义
     */
    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String sequence = String.format("%06d", new Random().nextInt(999999));
        String random = String.format("%04d", new Random().nextInt(9999));
        return timestamp + sequence + random;
    }
}
```

**下单流程的关键设计点**：

1. **为什么要先锁定库存再创建订单？**
   这是一个反向的设计。正常思维应该是"先创建订单，再扣库存"。但实际业务中，用户下单后不会立即付款，可能要去比对价格、跟家人商量、看看其他平台。这个过程可能持续几分钟甚至几小时。如果一开始就扣库存，这段时间内库存就被占用了，其他想买的人买不了。

   所以正确的做法是：**先锁定库存**，用户付款后**真正扣减**，超时未支付就**释放锁定**。

2. **为什么要用事务？**
   创建订单涉及多个操作：锁定库存、创建订单主记录、创建订单明细记录。如果其中任何一个步骤失败，之前已经执行的操作都要回滚。比如锁定库存成功，但是创建订单失败了，锁定的库存要释放。

3. **为什么要发送MQ消息？**
   订单创建后，有很多后续流程需要处理：物流系统要知道订单创建了、会员系统要更新用户的订单统计、库存系统要准备发货……这些操作不应该阻塞主流程，所以通过消息队列异步处理。

### 3.2 库存扣减实现

库存扣减是电商系统的难点之一，因为它要处理高并发下的库存超卖问题。

#### 3.2.1 乐观锁方案

```java
package com.example.ecommerce.stock.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.ecommerce.common.exception.BusinessException;
import com.example.ecommerce.stock.entity.StockEntity;
import com.example.ecommerce.stock.mapper.StockMapper;
import com.example.ecommerce.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 库存服务实现类
 * 使用乐观锁实现库存扣减
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final StockMapper stockMapper;

    /**
     * 锁定库存
     * 使用乐观锁，在高并发下性能更好
     *
     * @param skuId SKU ID
     * @param quantity 锁定数量
     * @return 是否锁定成功
     */
    @Override
    public boolean lockStock(Long skuId, Integer quantity) {
        // 乐观锁的核心：通过版本号控制并发更新
        // UPDATE stock SET locked_stock = locked_stock + ?, version = version + 1
        // WHERE sku_id = ? AND available_stock >= ? AND version = ?

        // 先查询当前库存
        StockEntity stock = stockMapper.selectOne(
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getSkuId, skuId)
        );

        if (stock == null) {
            log.warn("库存记录不存在，SKU ID：{}", skuId);
            return false;
        }

        // 检查可用库存是否足够
        if (stock.getAvailableStock() < quantity) {
            log.warn("库存不足，SKU ID：{}，可用库存：{}，需要：{}",
                    skuId, stock.getAvailableStock(), quantity);
            return false;
        }

        // 执行乐观锁更新
        // MybatisPlus的update方法会自动使用版本号进行条件更新
        StockEntity update = new StockEntity();
        update.setId(stock.getId());
        update.setLockedStock(stock.getLockedStock() + quantity);
        update.setAvailableStock(stock.getAvailableStock() - quantity);

        int rows = stockMapper.update(null,
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getId, stock.getId())
                        .eq(StockEntity::getVersion, stock.getVersion())  // 乐观锁条件
        );

        if (rows == 0) {
            // 更新失败，说明有并发更新，重新尝试
            log.warn("库存锁定失败（版本冲突），SKU ID：{}", skuId);
            return false;
        }

        // 记录库存流水（异步，不阻塞主流程）
        stockFlowService.recordFlow(skuId, stock.getWarehouseId(),
                StockFlowType.LOCK, quantity, stock.getAvailableStock(),
                stock.getAvailableStock() - quantity, "订单锁定");

        return true;
    }

    /**
     * 扣减库存（真正出库）
     * 支付成功后调用，把锁定的库存变成真正减少的库存
     *
     * @param skuId SKU ID
     * @param quantity 扣减数量
     * @param orderNo 订单号（用于关联）
     */
    @Override
    @Transactional
    public void deductStock(Long skuId, Integer quantity, String orderNo) {
        // 查询当前库存
        StockEntity stock = stockMapper.selectOne(
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getSkuId, skuId)
        );

        // 把锁定库存转成实际出库
        // 锁定库存减少，总库存也减少
        StockEntity update = new StockEntity();
        update.setId(stock.getId());
        update.setTotalStock(stock.getTotalStock() - quantity);
        update.setLockedStock(stock.getLockedStock() - quantity);
        // available_stock不变，因为之前锁定时已经扣过了

        int rows = stockMapper.update(null,
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getId, stock.getId())
                        .eq(StockEntity::getVersion, stock.getVersion())
        );

        if (rows == 0) {
            throw new BusinessException("库存扣减失败（版本冲突）");
        }

        // 记录库存流水
        stockFlowService.recordFlow(skuId, stock.getWarehouseId(),
                StockFlowType.DEDUCT, quantity, stock.getTotalStock(),
                stock.getTotalStock() - quantity, "订单出库", orderNo);
    }

    /**
     * 释放锁定库存
     * 订单取消或超时未支付时调用
     *
     * @param skuId SKU ID
     * @param quantity 释放数量
     * @param orderNo 订单号
     * @param reason 释放原因
     */
    @Override
    @Transactional
    public void releaseStock(Long skuId, Integer quantity, String orderNo, String reason) {
        StockEntity stock = stockMapper.selectOne(
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getSkuId, skuId)
        );

        // 释放锁定：锁定库存减少，可用库存增加
        StockEntity update = new StockEntity();
        update.setId(stock.getId());
        update.setLockedStock(stock.getLockedStock() - quantity);
        update.setAvailableStock(stock.getAvailableStock() + quantity);

        int rows = stockMapper.update(null,
                new LambdaQueryWrapper<StockEntity>()
                        .eq(StockEntity::getId, stock.getId())
                        .eq(StockEntity::getVersion, stock.getVersion())
        );

        if (rows == 0) {
            throw new BusinessException("库存释放失败（版本冲突）");
        }

        // 记录库存流水
        stockFlowService.recordFlow(skuId, stock.getWarehouseId(),
                StockFlowType.RELEASE, quantity, stock.getAvailableStock(),
                stock.getAvailableStock() + quantity, reason, orderNo);
    }
}
```

**乐观锁的工作原理**：

1. 每个库存记录有一个`version`字段，初始值为0
2. 更新库存时，同时更新`version = version + 1`
3. 更新条件必须包含`WHERE version = ?`（传入的是查询时的版本号）
4. 如果并发更新，只有一个能成功（因为第一个更新后version就变了）
5. 失败的请求重试，最终总有一个能成功

**为什么乐观锁比悲观锁性能好？**
悲观锁是`SELECT ... FOR UPDATE`，直接加行锁。其他事务想读这行数据，必须等待。并发高的时候，大量事务排队，性能很差。

乐观锁不阻塞，先执行，更新时检查版本。如果版本不对，说明有冲突，返回失败让业务层重试。在库存扣减这种冲突概率不高的场景下，乐观锁的性能好很多。

#### 3.2.2 Redis方案（秒杀场景）

在秒杀场景下，乐观锁还是太慢了，因为要操作数据库。秒杀的核心要求是**不超卖**和**高并发**，这时候就要用Redis了。

```java
package com.example.ecommerce.stock.service.impl;

import com.example.ecommerce.stock.service.SecKillStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * 秒杀库存服务
 * 使用Redis实现高性能库存扣减
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecKillStockServiceImpl implements SecKillStockService {

    private final StringRedisTemplate redisTemplate;

    /**
     * Redis Lua脚本，用于原子性扣减库存
     * 为什么用Lua脚本？因为库存扣减需要先检查后更新
     * 如果分成两步，在并发下可能出问题
     * Lua脚本可以保证原子性执行
     */
    private static final String STOCK_DEDUCT_SCRIPT =
            "local stock = redis.call('get', KEYS[1]) " +  -- 获取当前库存
            "if tonumber(stock) < tonumber(ARGV[1]) then " +  -- 库存不足
            "    return -1 " +  -- 返回-1表示库存不足
            "end " +
            "redis.call('decrby', KEYS[1], ARGV[1]) " +  -- 扣减库存
            "return 1";  -- 返回1表示成功

    /**
     * 预热秒杀商品库存到Redis
     * 在秒杀开始前，把库存从数据库加载到Redis
     */
    @Override
    public void preloadStock(Long skuId, Integer stock) {
        String key = "seckill:stock:" + skuId;
        redisTemplate.opsForValue().set(key, String.valueOf(stock));
        log.info("秒杀库存预热完成，SKU ID：{}，库存：{}", skuId, stock);
    }

    /**
     * 扣减秒杀库存
     * 使用Redis保证原子性，高并发下性能远超数据库
     *
     * @param skuId SKU ID
     * @param quantity 扣减数量
     * @return 是否扣减成功
     */
    @Override
    public boolean deductStock(Long skuId, Integer quantity) {
        String key = "seckill:stock:" + skuId;

        // 执行Lua脚本，原子性地扣减库存
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(STOCK_DEDUCT_SCRIPT);
        script.setResultType(Long.class);

        Long result = redisTemplate.execute(script,
                Collections.singletonList(key),
                String.valueOf(quantity));

        if (result == null || result == -1) {
            log.warn("秒杀库存不足或系统异常，SKU ID：{}", skuId);
            return false;
        }

        log.info("秒杀库存扣减成功，SKU ID：{}，扣减数量：{}，剩余库存：{}",
                skuId, quantity, result);
        return true;
    }

    /**
     * 释放秒杀库存
     * 订单取消或支付失败时回补库存
     */
    @Override
    public void releaseStock(Long skuId, Integer quantity) {
        String key = "seckill:stock:" + skuId;
        redisTemplate.opsForValue().increment(key, quantity);
        log.info("秒杀库存释放，SKU ID：{}，释放数量：{}", skuId, quantity);
    }

    /**
     * 获取秒杀库存
     */
    @Override
    public Integer getStock(Long skuId) {
        String key = "seckill:stock:" + skuId;
        String stock = redisTemplate.opsForValue().get(key);
        return stock == null ? null : Integer.parseInt(stock);
    }
}
```

**Redis扣减库存的核心**：

1. **为什么要用Lua脚本？**
   Redis的每个命令都是原子的，但是如果要执行"先检查库存，再扣减"这种逻辑，单条命令就不够了。Lua脚本是Redis内置的脚本执行器，整段脚本执行过程中不会被其他命令插入，实现了真正的原子性。

2. **Lua脚本的逻辑**：
   ```lua
   local stock = redis.call('get', KEYS[1])  -- 获取库存
   if tonumber(stock) < tonumber(ARGV[1]) then  -- 判断库存是否充足
       return -1  -- 不足返回-1
   end
   redis.call('decrby', KEYS[1], ARGV[1])  -- 扣减库存
   return 1  -- 成功返回1
   ```

3. **Redis库存和数据库库存的同步**：
   Redis库存是缓存，最终还是要落库到MySQL。通常的做法是：
   - 秒杀前：预热库存到Redis
   - 秒杀中：Redis扣减
   - 秒杀后：异步同步到MySQL（通过MQ）

---

## 第四章：支付模块核心功能实现

### 4.1 支付流程概述

支付是电商系统最复杂的模块之一，涉及第三方支付渠道的对接。以微信支付为例，整个支付流程是：

1. **用户发起支付**：前端调起支付（JSAPI支付/APP支付等）
2. **后端创建支付订单**：在数据库创建支付记录
3. **统一下单**：调用微信支付API，获取预支付会话标识（prepay_id）
4. **返回支付参数**：前端用这些参数调起微信支付
5. **用户付款**：用户在微信客户端完成付款
6. **微信异步通知**：微信支付成功后会回调我们的接口
7. **处理回调**：验证签名、更新订单状态、发送MQ消息

### 4.2 微信支付接入

```java
package com.example.ecommerce.pay.service.impl;

import com.example.ecommerce.common.exception.BusinessException;
import com.example.ecommerce.order.entity.OrderEntity;
import com.example.ecommerce.pay.config.WxPayConfig;
import com.example.ecommerce.pay.entity.PaymentEntity;
import com.example.ecommerce.pay.entity.RefundEntity;
import com.example.ecommerce.pay.mapper.PaymentMapper;
import com.example.ecommerce.pay.service.WxPayService;
import com.example.ecommerce.pay.util.WxPaySignatureUtil;
import com.wechat.pay.java.core.util.NonceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信支付服务实现类
 * 封装微信支付的各种API调用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WxPayServiceImpl implements WxPayService {

    private final WxPayConfig wxPayConfig;
    private final PaymentMapper paymentMapper;
    private final WxPayClient wxPayClient;  // 微信支付HTTP客户端

    /**
     * 调用统一下单API，创建预支付订单
     *
     * @param order 订单信息
     * @param payChannel 支付渠道（公众号/小程序/APP等）
     * @return 调起支付的必要参数
     */
    @Override
    @Transactional
    public Map<String, String> createPrepay(OrderEntity order, String payChannel) {
        // 1. 创建本地支付记录
        String paymentNo = generatePaymentNo();  // 生成支付流水号
        PaymentEntity payment = new PaymentEntity();
        payment.setPaymentNo(paymentNo);
        payment.setOrderNo(order.getOrderNo());
        payment.setUserId(order.getUserId());
        payment.setAmount(order.getPayAmount());
        payment.setPayStatus(0);  // 待支付
        payment.setChannelCode(payChannel);
        paymentMapper.insert(payment);

        // 2. 构建统一下单请求
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("mchid", wxPayConfig.getMchId());  // 商户号
        requestBody.put("out_trade_no", paymentNo);  // 商户订单号（我们生成的）
        requestBody.put("appid", wxPayConfig.getAppId());  // 应用ID
        requestBody.put("description", "商品订单：" + order.getOrderNo());  // 商品描述
        requestBody.put("notify_url", wxPayConfig.getNotifyUrl());  // 回调地址
        requestBody.put("amount", Map.of(
                "total", order.getPayAmount().multiply(new java.math.BigDecimal("100")).intValue(),  // 金额，单位分
                "currency", "CNY"  // 币种
        ));

        // 3. 根据不同支付场景，设置不同的openid
        // JSAPI支付需要用户的openid
        if ("JSAPI".equals(payChannel)) {
            requestBody.put("payer", Map.of("openid", order.getUserId()));  // 实际应该是用户的openid
        }

        // 4. 调用微信支付统一下单API
        String response = wxPayClient.post(
                "https://api.mch.weixin.qq.com/v3/pay/transactions/" + getPayMethod(payChannel),
                requestBody
        );

        // 5. 解析响应，获取预支付会话标识
        Map<String, Object> responseMap = parseJson(response);
        String prepayId = (String) responseMap.get("prepay_id");
        if (StringUtils.isEmpty(prepayId)) {
            throw new BusinessException("创建预支付订单失败");
        }

        // 6. 更新支付记录的预支付ID
        payment.setPrepayId(prepayId);
        paymentMapper.updateById(payment);

        // 7. 返回调起支付的参数
        return buildPayParams(prepayId, payChannel);
    }

    /**
     * 构建调起支付的参数
     * 不同支付方式的参数不同，这里以JSAPI为例
     */
    private Map<String, String> buildPayParams(String prepayId, String payChannel) {
        Map<String, String> params = new HashMap<>();
        long timestamp = System.currentTimeMillis() / 1000;  // 时间戳（秒）
        String nonceStr = NonceUtil.createNonce(16);  // 随机字符串

        if ("JSAPI".equals(payChannel)) {
            params.put("appId", wxPayConfig.getAppId());
            params.put("timeStamp", String.valueOf(timestamp));
            params.put("nonceStr", nonceStr);
            params.put("package", "prepay_id=" + prepayId);
            params.put("signType", "RSA");  // 签名算法
            // 调起支付的签名
            params.put("paySign", WxPaySignatureUtil.sign(
                    params.get("appId") + "\n" +
                            params.get("timeStamp") + "\n" +
                            params.get("nonceStr") + "\n" +
                            params.get("package") + "\n",
                    wxPayConfig.getPrivateKey()
            ));
        }

        return params;
    }

    /**
     * 微信支付回调处理
     * 这是微信支付最核心的接口，需要特别注意安全性
     */
    @Override
    @Transactional
    public void handlePayNotify(String requestBody, String signature, String serialNo) {
        log.info("收到微信支付回调，请求体：{}", requestBody);

        // 1. 验证签名
        // 微信支付使用RSA签名，必须验证签名确保回调是微信发的
        if (!verifySignature(requestBody, signature, serialNo)) {
            log.error("微信支付回调签名验证失败");
            throw new BusinessException("签名验证失败");
        }

        // 2. 解析回调数据
        Map<String, Object> notifyData = parseJson(requestBody);
        String tradeStatus = (String) notifyData.get("trade_state");  // 支付状态
        String orderNo = (String) notifyData.get("out_trade_no");  // 商户订单号（我们的支付流水号）
        String transactionId = (String) notifyData.get("transaction_id");  // 微信订单号

        // 3. 查询支付记录
        PaymentEntity payment = paymentMapper.selectOne(
                new LambdaQueryWrapper<PaymentEntity>()
                        .eq(PaymentEntity::getPaymentNo, orderNo)
        );
        if (payment == null) {
            log.error("支付记录不存在，支付流水号：{}", orderNo);
            throw new BusinessException("支付记录不存在");
        }

        // 4. 判断支付状态，防止重复处理
        if (payment.getPayStatus() == 1) {
            log.info("支付已处理，支付流水号：{}", orderNo);
            return;
        }

        // 5. 根据交易状态处理
        if ("SUCCESS".equals(tradeStatus)) {
            // 支付成功
            payment.setPayStatus(1);
            payment.setPayTime(LocalDateTime.now());
            payment.setChannelTradeNo(transactionId);
            payment.setNotifyData(requestBody);
            paymentMapper.updateById(payment);

            // 6. 更新订单状态
            orderService.updatePayStatus(payment.getOrderNo(), 1);  // 1表示已支付

            // 7. 发送MQ消息，触发后续流程（发货、物流等）
            mqSender.sendPaySuccessMessage(payment.getOrderNo());

            log.info("支付成功处理完成，订单号：{}，微信订单号：{}", payment.getOrderNo(), transactionId);

        } else if ("CLOSED".equals(tradeStatus)) {
            // 支付关闭（用户取消或超时）
            payment.setPayStatus(3);  // 已取消
            paymentMapper.updateById(payment);

            // 释放库存
            orderService.releaseStockOnPayFail(payment.getOrderNo());

            log.info("支付关闭处理完成，订单号：{}", payment.getOrderNo());
        }
    }

    /**
     * 验证微信支付回调签名
     */
    private boolean verifySignature(String body, String signature, String serialNo) {
        try {
            // 获取微信支付平台的公钥
            String publicKey = wxPayConfig.getPublicKey(serialNo);

            // 使用微信支付SDK的验签方法
            // 签名内容 = HTTP_METHOD + "\n" + URL + "\n" + body
            // 但微信回调的签名通常只需要验证body
            return WxPaySignatureUtil.verify(body, signature, publicKey);

        } catch (Exception e) {
            log.error("验签异常", e);
            return false;
        }
    }
}
```

**支付回调的关键点**：

1. **为什么要验证签名？**
   微信支付回调是外部系统调用我们的接口，如果不验证签名，攻击者可以伪造回调请求，欺骗我们的系统"支付成功"。

2. **为什么要幂等处理？**
   微信支付可能会对同一个订单多次发送回调（网络原因、重试等）。如果每次回调都处理，会导致重复发货、重复发货等问题。所以要检查支付记录的状态，已经处理过的直接返回。

3. **为什么要存储原始回调数据？**
   微信回调的数据可能包含很多信息，后续可能需要查询。而且存储原始数据也方便对账和问题排查。

---

## 第五章：秒杀模块核心功能实现

### 5.1 秒杀场景的特点

秒杀是电商系统中最考验技术的场景。它有三个特点：

1. **瞬时流量大**：秒杀开始时，大量用户同时涌入，流量是平时的几十甚至上百倍
2. **库存有限**：秒杀的商品数量有限，大部分人抢不到
3. **业务简单**：秒杀的业务逻辑比普通下单简单，不需要复杂的优惠计算

秒杀的核心问题是如何在高并发下保证不超卖、不崩溃。

### 5.2 秒杀系统架构

```
                        ┌─────────────────┐
                        │     用户请求     │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   接入层（网关）  │
                        │  限流、熔断、分流 │
                        └────────┬────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
   ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
   │  秒杀活动    │        │  秒杀活动    │        │  秒杀活动    │
   │  服务实例1   │        │  服务实例2   │        │  服务实例3   │
   └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │      Redis      │
                        │   库存预扣减    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   消息队列       │
                        │   异步下单       │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │     MySQL       │
                        │   最终落库      │
                        └─────────────────┘
```

秒杀的核心思路是**分层过滤**：

1. **CDN层**：静态资源走CDN，减少服务器压力
2. **网关层**：限流、熔断，把恶意请求拦截
3. **Redis层**：库存预扣减，大部分请求在这一层就被拦截
4. **MQ层**：异步下单，削峰填谷
5. **数据库层**：最终落库，只有真正抢到的请求才会落库

### 5.3 秒杀Redis方案

```java
package com.example.ecommerce.seckill.service.impl;

import com.example.ecommerce.common.exception.BusinessException;
import com.example.ecommerce.seckill.dto.SecKillRequestDTO;
import com.example.ecommerce.seckill.service.SecKillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 秒杀服务实现类
 * 核心：Redis库存扣减 + 消息队列异步下单
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecKillServiceImpl implements SecKillService {

    private final StringRedisTemplate redisTemplate;
    private final SecKillStockService secKillStockService;

    /**
     * 秒杀请求 Lua脚本
     * 原子性执行：
     * 1. 检查是否已经抢购过（每人限购）
     * 2. 检查库存是否足够
     * 3. 扣减库存
     * 4. 记录用户抢购标记
     */
    private static final String SECKILL_SCRIPT =
            "-- 检查用户是否已经抢购过（每人限购1件）\n" +
            "local userKey = KEYS[1]\n" +
            "if redis.call('exists', userKey) == 1 then\n" +
            "    return -1  -- 已抢购过\n" +
            "end\n" +
            "\n" +
            "-- 检查库存\n" +
            "local stock = redis.call('get', KEYS[2])\n" +
            "if tonumber(stock) < tonumber(ARGV[1]) then\n" +
            "    return -2  -- 库存不足\n" +
            "end\n" +
            "\n" +
            "-- 扣减库存\n" +
            "redis.call('decrby', KEYS[2], ARGV[1])\n" +
            "\n" +
            "-- 标记用户已抢购（设置过期时间，10分钟内有效）\n" +
            "redis.call('setex', userKey, 600, ARGV[2])\n" +
            "\n" +
            "return 1";  -- 成功

    /**
     * 执行秒杀
     *
     * @param dto 秒杀请求
     * @return 秒杀结果
     */
    @Override
    public SecKillResultDTO doSecKill(SecKillRequestDTO dto) {
        Long userId = dto.getUserId();
        Long skuId = dto.getSkuId();
        Integer quantity = dto.getQuantity() != null ? dto.getQuantity() : 1;

        log.info("开始秒杀，用户ID：{}，商品ID：{}", userId, skuId);

        // 1. 检查秒杀活动是否开始
        SecKillActivityDTO activity = getActivityBySku(skuId);
        if (activity == null) {
            throw new BusinessException("秒杀活动不存在");
        }
        if (System.currentTimeMillis() < activity.getStartTime().getTime()) {
            throw new BusinessException("秒杀尚未开始");
        }
        if (System.currentTimeMillis() > activity.getEndTime().getTime()) {
            throw new BusinessException("秒杀已结束");
        }

        // 2. 执行秒杀（Redis原子操作）
        String userKey = "seckill:user:" + activity.getId() + ":" + userId;
        String stockKey = "seckill:stock:" + skuId;

        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(SECKILL_SCRIPT);
        script.setResultType(Long.class);

        String token = UUID.randomUUID().toString();  // 抢购凭证
        Long result = redisTemplate.execute(script,
                Arrays.asList(userKey, stockKey),
                String.valueOf(quantity), token);

        if (result == null || result == -1) {
            return SecKillResultDTO.fail("您已参与过本次秒杀，每人限购1件");
        }
        if (result == -2) {
            return SecKillResultDTO.fail("商品已售罄");
        }

        log.info("秒杀成功，用户ID：{}，商品ID：{}，抢购凭证：{}", userId, skuId, token);

        // 3. 秒杀成功后，发送消息到MQ，异步创建订单
        // 为什么不直接创建订单？因为创建订单涉及多个表的写操作，太慢了
        // 异步处理可以快速响应用户，同时保证最终一致性
        SecKillOrderMessage message = new SecKillOrderMessage();
        message.setUserId(userId);
        message.setSkuId(skuId);
        message.setQuantity(quantity);
        message.setActivityId(activity.getId());
        message.setToken(token);
        message.setPrice(activity.getPrice());
        mqSender.sendSecKillOrderMessage(message);

        // 4. 返回秒杀结果
        return SecKillResultDTO.success("秒杀成功，请在10分钟内完成支付", token);
    }

    /**
     * 支付成功后，确认订单
     * 只有支付成功的订单才会真正落库
     */
    @Override
    @Transactional
    public void confirmOrder(String token) {
        // 从Redis获取订单信息
        String orderKey = "seckill:order:" + token;
        String orderData = redisTemplate.opsForValue().get(orderKey);
        if (orderData == null) {
            throw new BusinessException("订单已过期，请重新下单");
        }

        SecKillOrderData data = parseOrderData(orderData);

        // 创建真实订单（下单逻辑省略）
        String orderNo = orderService.createSecKillOrder(data);

        // 删除Redis中的订单标记
        redisTemplate.delete(orderKey);

        log.info("秒杀订单确认成功，订单号：{}", orderNo);
    }
}
```

**秒杀Lua脚本的关键点**：

1. **为什么要用Lua脚本？**
   秒杀的核心问题是并发安全。检查用户是否抢购过、库存是否足够、扣减库存、标记用户这四步必须原子执行。如果分成四步Redis命令，在并发下会出现问题：

   ```
   时间线1：请求A检查库存（通过）→ 请求B检查库存（通过）→ A扣减库存 → B扣减库存（超卖！）
   ```

   Lua脚本在Redis中是原子执行的，不会被其他命令插入。

2. **为什么要设置用户抢购标记的过期时间？**
   防止用户抢购成功后不付款。如果10分钟内没付款，标记自动失效，用户可以重新抢购。

3. **为什么要异步创建订单？**
   创建订单涉及插入订单主表、订单明细表、扣减库存表等多个操作，耗时较长。如果同步创建，会拖慢响应时间，影响用户体验。异步处理可以先快速响应用户"秒杀成功"，然后后台慢慢处理订单创建。

---

## 第六章：分布式事务与一致性

### 6.1 什么是分布式事务

在单体应用中，所有操作都在同一个数据库里，用本地事务（ACID）就能保证一致性。但是在微服务架构下，一个业务操作可能涉及多个服务、多个数据库：

- 下单操作：调用库存服务扣库存、调用订单服务创订单、调用用户服务扣余额
- 这些服务可能连不同的数据库
- 网络调用可能失败

如何保证这些操作要么全部成功，要么全部失败？这就是分布式事务要解决的问题。

### 6.2 Seata AT模式

Seata是阿里开源的分布式事务解决方案，最常用的是AT模式。

```java
package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.order.entity.OrderEntity;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.pay.service.PaymentService;
import com.example.ecommerce.stock.service.StockService;
import io.seata.rm.tcc.api.BusinessActionContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 订单服务实现类
 * 使用Seata AT模式处理分布式事务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final StockService stockService;
    private final PaymentService paymentService;

    /**
     * 创建订单（Seata分布式事务）
     * @GlobalTransactional 注解标记这是一个分布式事务
     * Seata会自动管理这个事务的提交和回滚
     */
    @Override
    @GlobalTransactional(rollbackFor = Exception.class)
    public String createOrderWithTransaction(OrderCreateDTO dto) {
        log.info("开始创建订单（分布式事务），用户ID：{}", dto.getUserId());

        // 1. 扣减库存（远程调用库存服务）
        // Seata会拦截这个RPC调用，开启一个分支事务
        boolean stockDeducted = stockService.deductStockWithTcc(dto.getSkuId(), dto.getQuantity());
        if (!stockDeducted) {
            throw new BusinessException("库存扣减失败");
        }

        // 2. 创建订单（本地数据库操作）
        OrderEntity order = new OrderEntity();
        // ... 填充订单信息
        orderMapper.insert(order);

        // 3. 发起支付（远程调用支付服务）
        // 这里只是创建支付订单，不是真正的支付
        paymentService.createPayment(order);

        log.info("订单创建成功（分布式事务），订单号：{}", order.getOrderNo());
        return order.getOrderNo();

        // 如果任何一步抛出异常，Seata会自动回滚所有已执行的分支事务
    }
}
```

**Seata AT模式的工作原理**：

1. **全局事务ID**：每个分布式事务有一个唯一的XID
2. **分支事务**：每个参与的微服务有一个分支事务ID
3. **undolog表**：每个参与事务的数据库表都有一个undolog记录
4. **自动回滚**：事务失败时，Seata根据undolog自动回滚

### 6.3 最终一致性方案（MQ）

除了Seata，还有一种更轻量的方案：**基于MQ的最终一致性**。

核心思想是：**不做强一致性，而是保证最终一致性**。

```
1. 先执行本地事务（创建订单）
2. 发送消息到MQ（扣减库存）
3. MQ消费者执行远程操作
4. 如果失败，发送补偿消息回滚
```

```java
/**
 * MQ最终一致性方案
 */
@Service
@RequiredArgsConstructor
public class OrderServiceImpl {

    private final OrderMapper orderMapper;
    private final RocketMQTemplate rocketMQTemplate;

    @Transactional
    public String createOrder(OrderCreateDTO dto) {
        // 1. 创建订单（本地事务）
        OrderEntity order = buildOrder(dto);
        orderMapper.insert(order);

        // 2. 发送MQ消息（扣减库存）
        // 注意：这里用事务消息，不是普通消息
        // 普通消息可能在本地事务提交之前就发出去了，如果后续事务回滚，消息已经发出去了
        // 事务消息会等本地事务提交后才真正发送
        OrderCreatedMessage message = new OrderCreatedMessage();
        message.setOrderId(order.getId());
        message.setSkuId(dto.getSkuId());
        message.setQuantity(dto.getQuantity());

        // 发送事务消息
        rocketMQTemplate.sendMessageInTransaction("order_topic", "create_order",
                MessageBuilder.withPayload(message).build(), order);

        return order.getOrderNo();
    }
}

/**
 * MQ消费者：扣减库存
 */
@Service
@RocketMQMessageListener(topic = "order_topic", selectorExpression = "deduct_stock")
public class StockConsumer {

    @Autowired
    private StockService stockService;

    /**
     * 扣减库存
     */
    public void deductStock(Message message) {
        OrderCreatedMessage msg = (OrderCreatedMessage) message.getPayload();

        try {
            // 执行业务操作
            stockService.deductStock(msg.getSkuId(), msg.getQuantity());
        } catch (Exception e) {
            // 扣减失败，发送补偿消息
            // 这里简单重试，实际项目中应该有更复杂的重试策略
            rocketMQTemplate.send("order_topic", "compensate_stock", msg);
        }
    }
}
```

**为什么MQ方案更轻量？**

1. **Seata的缺点**：需要引入额外的事务协调服务，所有服务都要接入Seata，侵入性较大
2. **MQ方案**：只需要MQ和业务服务，业务代码改动小

**MQ方案的适用场景**：业务允许短暂的不一致（最终一致性），比如库存扣减延迟几秒用户感知不到。

**Seata方案的适用场景**：业务要求强一致性，比如转账、扣款等。

---

## 第七章：系统优化与面试要点

### 7.1 电商系统常见面试问题

**问题一：如何解决超卖问题？**

回答思路：
1. 数据库层面：使用乐观锁（version字段）或者悲观锁（SELECT FOR UPDATE）
2. Redis层面：使用Lua脚本保证原子性扣减
3. 业务层面：下单时先锁定库存，支付成功后才真正扣减

**问题二：如何设计秒杀系统？**

回答思路：
1. 前端：验证码、按钮置灰、倒计时
2. 限流：网关限流、令牌桶算法
3. 缓存：活动信息缓存、库存预热到Redis
4. 异步：MQ削峰、异步创建订单
5. 限流：一人一单、库存扣减原子操作

**问题三：分布式事务如何处理？**

回答思路：
1. Seata AT模式：强一致性，适合对数据敏感的场景
2. MQ最终一致性：性能高，允许短暂不一致
3. TCC模式：业务侵入性大，但性能好

### 7.2 性能优化建议

1. **热点数据缓存**：商品信息、用户信息、分类信息等
2. **库存预扣减**：秒杀开始前把库存加载到Redis
3. **异步处理**：非核心流程（发送通知、记录日志等）异步执行
4. **数据库优化**：分库分表、读写分离、索引优化
5. **CDN加速**：静态资源、页面缓存

---

## 结语

好了，今天的电商系统Java后端实战就讲到这里。这篇文章涵盖了电商系统最核心的模块：商品、订单、支付、秒杀，以及分布式事务处理。

电商系统是Java后端最好的实战项目之一，因为它涵盖了几乎所有后端开发需要掌握的技术点：数据库设计、缓存、消息队列、分布式事务、微服务架构、性能优化……

希望大家在学习的过程中，不要只看文档，一定要动手实践。可以参考GitHub上的开源电商项目，自己写一遍核心功能，这样才能真正掌握。

如果有任何问题，欢迎在评论区留言，我会尽量解答。
