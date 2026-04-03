# Spring Cloud微服务架构实战

> 本文将带你深入理解Spring Cloud微服务架构的核心组件，包括Nacos、Eureka服务注册与发现、Ribbon负载均衡、Feign声明式HTTP客户端、Sentinel流量控制、Gateway网关、Seata分布式事务等。通过外卖订单系统的业务场景，让你掌握微服务开发的完整技能。

---

## 一、微服务架构概述

### 1.1 为什么需要微服务？

想象一下**传统单体应用就像一家大型餐厅**：所有厨师在一个厨房工作，所有菜品在一个出餐口。问题是：一旦厨房忙不过来，整个餐厅就瘫痪了。

**微服务架构就像美食广场**：每个小摊位专注做一种菜品（火锅、烧烤、奶茶），顾客可以同时从多个摊位点餐，某个摊位出问题不影响其他摊位。

```
┌────────────────────────────────────────────────────────────────────┐
│                    单体架构 vs 微服务架构                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  单体架构：                                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     电商系统                                   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │ │
│  │  │ 用户模块 │ │ 订单模块 │ │ 支付模块 │ │ 库存模块 │            │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │ │
│  │        ↓           ↓           ↓           ↓                │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              共享数据库                              │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  微服务架构：                                                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    服务网格（Service Mesh）                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │ │
│  │  │ 用户服务  │  │ 订单服务  │  │ 支付服务  │  │ 库存服务  │     │ │
│  │  │  :8001   │  │  :8002   │  │  :8003   │  │  :8004   │     │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │ │
│  │       │             │             │             │            │ │
│  │       ▼             ▼             ▼             ▼            │ │
│  │  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐         │ │
│  │  │用户数据库│   │订单数据库│   │支付数据库│   │库存数据库│         │ │
│  │  └────────┘    └────────┘    └────────┘    └────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Spring Cloud技术栈

```
┌────────────────────────────────────────────────────────────────────┐
│                       Spring Cloud技术全景图                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     服务治理                                   │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │ │
│  │  │Nacos   │  │Eureka   │  │Consul  │  │Zookeeper│           │ │
│  │  │阿里的  │  │Netflix │  │HashiCorp│ │Apache   │           │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     负载均衡                                   │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │ │
│  │  │Ribbon   │  │LoadBalancer│ │Nginx   │                       │ │
│  │  └─────────┘  └─────────┘  └─────────┘                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     服务调用                                   │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │ │
│  │  │Feign    │  │OpenFeign│  │RestTemplate│                     │ │
│  │  │声明式   │  │        │  │          │                       │ │
│  │  └─────────┘  └─────────┘  └─────────┘                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     流量控制                                   │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │ │
│  │  │Sentinel │  │Hystrix  │  │Resilience4j│                    │ │
│  │  │        │  │        │  │          │                       │ │
│  │  └─────────┘  └─────────┘  └─────────┘                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     网关路由                                   │ │
│  │  ┌─────────┐  ┌─────────┐                                    │ │
│  │  │Gateway  │  │Zuul     │                                    │ │
│  │  │Spring自研│ │Netflix │                                    │ │
│  │  └─────────┘  └─────────┘                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     分布式事务                                 │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │ │
│  │  │Seata    │  │ShardingSphere│ │LCN     │                    │ │
│  │  └─────────┘  └─────────┘  └─────────┘                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 二、Nacos服务注册与配置中心

### 2.1 Nacos概述

**Nacos**（Naming and Configuration Service）是阿里巴巴开源的项目，提供**服务注册发现**和**分布式配置管理**功能。就像餐厅的**前台登记系统**：新厨师到岗要登记（注册），顾客点餐要知道哪个厨师有空（发现），菜单更新要通知所有厨师（配置管理）。

### 2.2 服务注册与发现

```java
/**
 * Nacos服务注册示例
 *
 * 依赖：
 * <dependency>
 *     <groupId>com.alibaba.cloud</groupId>
 *     <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
 * </dependency>
 */

/**
 * 用户服务模块
 * 端口：8001
 */
@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现，自动注册到Nacos
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

    /**
     * 用户Controller
     */
    @RestController
    @RequestMapping("/user")
    public static class UserController {

        @GetMapping("/{id}")
        public User getUser(@PathVariable Long id) {
            return new User(id, "用户" + id, 20 + id % 30);
        }

        @GetMapping("/list")
        public List<User> listUsers() {
            return Arrays.asList(
                new User(1L, "张三", 25),
                new User(2L, "李四", 30)
            );
        }
    }
}

/**
 * 订单服务模块 - 消费用户服务
 * 端口：8002
 */
@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }

    @RestController
    @RequestMapping("/order")
    public static class OrderController {

        /**
         * 使用RestTemplate + Ribbon调用用户服务
         */
        @Autowired
        private RestTemplate restTemplate;

        @GetMapping("/create")
        public Order createOrder(@RequestParam Long userId, @RequestParam String product) {
            // 通过服务名调用用户服务
            // Ribbon会自动从Nacos获取用户服务实例列表并进行负载均衡
            User user = restTemplate.getForObject(
                "http://user-service/user/" + userId,
                User.class
            );

            Order order = new Order();
            order.setId(System.currentTimeMillis());
            order.setUserId(userId);
            order.setUserName(user != null ? user.getName() : "未知");
            order.setProduct(product);
            order.setStatus("CREATED");
            return order;
        }
    }

    /**
     * 配置RestTemplate
     */
    @Configuration
    public class RestTemplateConfig {

        @Bean
        @LoadBalanced  // 启用Ribbon负载均衡
        public RestTemplate restTemplate() {
            return new RestTemplate();
        }
    }
}

/**
 * 配置application.yml
 *
 * user-service的application.yml：
 * spring:
 *   application:
 *     name: user-service  # 服务名，用于服务发现
 *   cloud:
 *     nacos:
 *       discovery:
 *         server-addr: 127.0.0.1:8848  # Nacos地址
 *         namespace: dev  # 命名空间
 *         group: DEFAULT_GROUP  # 分组
 * server:
 *   port: 8001
 *
 * order-service的application.yml类似，端口改为8002
 */
```

### 2.3 Nacos配置中心

```java
/**
 * Nacos分布式配置中心示例
 *
 * 场景：多个服务共享配置，如数据库连接、Redis配置等
 */

/**
 * 订单服务的配置：共享配置 + 本地配置
 */
@SpringBootApplication
@EnableConfigServer  // 如果是配置中心服务端
@EnableDiscoveryClient
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

/**
 * 方式一：使用@Value注解获取配置
 */
@RestController
public class ConfigController {

    // 获取共享配置
    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    // 获取应用自定义配置
    @Value("${order.timeout:5000}")
    private long orderTimeout;

    // 获取配置，支持自动刷新
    @Value("${order.max-count:100}")
    private int maxOrderCount;

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        Map<String, Object> result = new HashMap<>();
        result.put("datasourceUrl", datasourceUrl);
        result.put("orderTimeout", orderTimeout);
        result.put("maxOrderCount", maxOrderCount);
        return result;
    }
}

/**
 * 方式二：使用@ConfigurationProperties获取配置（推荐）
 */
@Configuration
@ConfigurationProperties(prefix = "order")
public class OrderProperties {

    private long timeout = 5000;
    private int maxCount = 100;
    private String payUrl;
    private Map<String, String> extra = new HashMap<>();

    // getters and setters
    public long getTimeout() {
        return timeout;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }

    public int getMaxCount() {
        return maxCount;
    }

    public void setMaxCount(int maxCount) {
        this.maxCount = maxCount;
    }

    public String getPayUrl() {
        return payUrl;
    }

    public void setPayUrl(String payUrl) {
        this.payUrl = payUrl;
    }

    public Map<String, String> getExtra() {
        return extra;
    }

    public void setExtra(Map<String, String> extra) {
        this.extra = extra;
    }
}

/**
 * 方式三：使用@RefreshScope实现配置自动刷新
 *
 * 当Nacos配置更新后，无需重启服务，配置自动生效
 */
@RestController
@RefreshScope  // 启用配置刷新
public class RefreshConfigController {

    @Value("${order.notify-url:}")
    private String notifyUrl;

    @GetMapping("/notify-url")
    public String getNotifyUrl() {
        return notifyUrl;
    }
}

/**
 * Nacos配置示例（Data ID: order-service.yml）
 *
 * spring:
 *   application:
 *     name: order-service
 *   cloud:
 *     nacos:
 *       config:
 *         server-addr: 127.0.0.1:8848
 *         file-extension: yml
 *         namespace: dev
 *         group: DEFAULT_GROUP
 *         refresh-enabled: true  # 开启自动刷新
 *         shared-configs:  # 共享配置列表
 *           - data-id: common.yml
 *             group: DEFAULT_GROUP
 *             refresh: true
 *         extension-configs:  # 扩展配置列表
 *           - data-id: datasource.yml
 *             group: DEFAULT_GROUP
 *             refresh: true
 *
 * order:
 *   timeout: 30000
 *   max-count: 200
 *   pay-url: http://payment-service/pay
 *   extra:
 *     region: us-east-1
 *     currency: USD
 */
```

### 2.4 Nacos集群架构

```
┌────────────────────────────────────────────────────────────────────┐
│                        Nacos集群架构                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                          ┌─────────┐                                │
│                          │  用户   │                                │
│                          └────┬────┘                                │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      服务注册/发现                            │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │               Nacos Client SDK                          │  │ │
│  │  │   - 服务注册                                            │  │ │
│  │  │   - 服务发现                                            │  │ │
│  │  │   - 配置订阅                                            │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Nacos Server集群                            │ │
│  │                                                              │ │
│  │   ┌──────────┐     ┌──────────┐     ┌──────────┐           │ │
│  │   │ nacos-1  │◄───►│ nacos-2  │◄───►│ nacos-3  │           │ │
│  │   │ :8848    │     │ :8849    │     │ :8850    │           │ │
│  │   └────┬─────┘     └────┬─────┘     └────┬─────┘           │ │
│  │        │                │                │                 │ │
│  │        └────────────────┼────────────────┘                 │ │
│  │                         │                                  │ │
│  │                         ▼                                  │ │
│  │               ┌─────────────────┐                         │ │
│  │               │   MySQL Cluster │                         │ │
│  │               │   (共享存储)    │                         │ │
│  │               └─────────────────┘                         │ │
│  │                                                              │ │
│  │               ┌─────────────────┐                         │ │
│  │               │   VIP/Nginx    │                         │ │
│  │               │  (负载均衡)     │                         │ │
│  │               └─────────────────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 三、Ribbon负载均衡

### 3.1 Ribbon是什么？

**Ribbon**就像**餐厅的叫号系统**：有多个厨师（服务实例），顾客点餐时叫号系统分配空闲的厨师，避免某个厨师太忙而其他厨师空闲。

Ribbon是Netflix开源的负载均衡器，集成在Spring Cloud中，提供多种负载均衡策略。

### 3.2 负载均衡策略

```java
/**
 * Ribbon负载均衡策略示例
 */

// Ribbon内置负载均衡策略

/*
 * 1. RoundRobinRule（轮询，默认）
 *    顺序循环选择每个服务器
 *
 *    ┌──────────────────────────────────────────────────────────┐
 *    │  请求1 ──→ 服务A                                         │
 *    │  请求2 ──→ 服务B                                         │
 *    │  请求3 ──→ 服务C                                         │
 *    │  请求4 ──→ 服务A                                         │
 *    │  请求5 ──→ 服务B                                         │
 *    │  ...                                                     │
 *    └──────────────────────────────────────────────────────────┘
 */

/*
 * 2. RandomRule（随机）
 *    随机选择一个服务器
 *
 *    ┌──────────────────────────────────────────────────────────┐
 *    │  请求1 ──→ 随机选择（可能是A/B/C）                        │
 *    │  请求2 ──→ 随机选择（可能是A/B/C）                        │
 *    │  ...                                                     │
 *    └──────────────────────────────────────────────────────────┘
 */

/*
 * 3. WeightedResponseTimeRule（加权响应时间）
 *    根据服务器响应时间分配权重，响应越快权重越大
 *
 *    ┌──────────────────────────────────────────────────────────┐
>    │  服务A响应快 ───→ 权重高 ───→ 被选中概率大                │
>    │  服务C响应慢 ───→ 权重低 ───→ 被选中概率小                │
>    └──────────────────────────────────────────────────────────┘
 */

/*
 * 4. BestAvailableRule（最低并发）
 *    选择并发数最低的服务器
 *
 *    ┌──────────────────────────────────────────────────────────┐
>    │  服务A：10个并发                                           │
>    │  服务B：5个并发  ←─── 选择这个（并发最低）                  │
>    │  服务C：8个并发                                           │
>    └──────────────────────────────────────────────────────────┘
 */

/*
 * 5. AvailabilityFilteringRule（可用性过滤）
 *    过滤掉熔断的或并发过高的服务器
 */

/*
 * 6. ZoneAvoidanceRule（区域权衡，默认扩展版）
 *    根据服务器所在区域和可用性综合选择
 */

/**
 * 配置Ribbon负载均衡策略
 */
@Configuration
public class RibbonConfig {

    /**
     * 全局配置：对所有服务生效
     */
    @Bean
    public IRule ribbonRule() {
        // 随机策略
        return new RandomRule();
    }
}

/**
 * 局部配置：对指定服务生效
 */
@Configuration
@RibbonClients(defaultConfiguration = DefaultRibbonConfig.class)
public class RibbonClientConfig {

    /**
     * 指定服务的配置
     */
    @Configuration
    @RibbonClient(name = "user-service", configuration = UserServiceRibbonConfig.class)
    public static class UserServiceRibbonConfig {

        @Bean
        public IRule userServiceRule() {
            // 用户服务使用轮询策略
            return new RoundRobinRule();
        }
    }

    /**
     * 默认配置
     */
    @Configuration
    public static class DefaultRibbonConfig {
        @Bean
        public IRule defaultRule() {
            return new RoundRobinRule();
        }
    }
}

/**
 * application.yml配置方式
 *
 * user-service:
 *   ribbon:
 *     NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule
 *     # 或
 *     Rule: com.alibaba.cloud.nacos.ribbon.NacosRule  # Nacos加权规则
 *     ConnectTimeout: 3000
 *     ReadTimeout: 5000
 *     MaxAutoRetries: 3  # 最大重试次数
 *     MaxAutoRetriesNextServer: 1
 */
```

### 3.3 Ribbon核心原理

```java
/**
 * Ribbon核心组件和工作流程
 */

/*
 * Ribbon核心组件：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> │                        Ribbon架构图                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │   RibbonClient  │ ← 入口，所有请求通过它发起                    │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │  LoadBalancer   │ ← 负载均衡器入口                             │
│  │  (ILoadBalancer)│                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│    ┌──────┴──────┐                                              │
│    │             │                                              │
│    ▼             ▼                                              │
│ ┌────────┐  ┌────────┐                                         │
│ │ Server │  │ Server │  ← 服务实例列表                         │
│ │ List   │  │ List   │                                         │
│ └────────┘  └────────┘                                         │
│                                                                  │
│  关键组件：                                                      │
│  - ServerList: 获取服务列表                                      │
│  - ServerListFilter: 过滤服务列表                                │
│  - ServerComparator: 比较服务器                                  │
│  - LoadBalancerRule: 负载均衡规则                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
 *
 * 工作流程：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> │                    Ribbon请求处理流程                              │
├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> │  1. 拦截请求                                                    │
> │     LoadBalancerInterceptor 拦截请求                            │
> │                                                                  │
> │  2. 获取服务名                                                   │
> │     从URL中解析服务名：http://user-service/user/1               │
> │                                                                  │
> │  3. 获取负载均衡器                                               │
> │     LoadBalancerBuilder 根据服务名创建/获取LoadBalancer         │
> │                                                                  │
> │  4. 选择服务器                                                   │
> │     LoadBalancer 根据规则从服务列表中选择一个服务器              │
> │                                                                  │
> │  5. 重写URL                                                      │
> │     RibbonLoadBalancerClient 将服务名替换为实际IP:Port          │
> │                                                                  │
> │  6. 发起请求                                                     │
> │     使用RestTemplate发起真正的HTTP请求                          │
> │                                                                  │
 │  ┌─────────────────────────────────────────────────────────────┐ │
 │  │  http://user-service/user/1                                 │ │
 │  │        │                                                    │ │
 │  │        ▼                                                    │ │
 │  │  ┌─────────────────────────────────────────────────────────┐ │ │
 │  │  │  RibbonLoadBalancerClient                              │ │ │
 │  │  │  1. 解析服务名：user-service                             │ │ │
 │  │  │  2. 获取ILoadBalancer                                   │ │ │
 │  │  │  3. ILoadBalancer.chooseServer() 选择服务器            │ │ │
 >  │  │  4. 得到实际地址：192.168.1.101:8001                     │ │ │
 >  │  │  5. 替换URL：http://192.168.1.101:8001/user/1            │ │ │
 >  │  └─────────────────────────────────────────────────────────┘ │ │
 >  └─────────────────────────────────────────────────────────────┘ │
 > │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 */
```

---

## 四、Feign声明式HTTP客户端

### 4.1 Feign是什么？

**Feign**就像**餐厅的智能点餐机**：你只需说出要什么（接口定义），点餐机自动帮你完成点餐流程（HTTP请求），无需关心厨房是怎么沟通的（隐藏HTTP细节）。

### 4.2 OpenFeign使用

```java
/**
 * OpenFeign声明式HTTP客户端示例
 *
 * 依赖：
 * <dependency>
 *     <groupId>org.springframework.cloud</groupId>
 *     <artifactId>spring-cloud-starter-openfeign</artifactId>
 * </dependency>
 */

/**
 * 启用Feign客户端
 */
@SpringBootApplication
@EnableFeignClients  // 启用Feign客户端扫描
@EnableDiscoveryClient
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

/**
 * 定义Feign客户端接口
 */
@FeignClient(
    name = "user-service",  // 服务名，对应Nacos/Eureka中的服务名
    url = "${user.service.url:}",  // 可选，指定URL
    fallback = UserFeignClientFallback.class,  // 失败回退
    configuration = FeignConfig.class  // Feign配置
)
public interface UserFeignClient {

    /**
     * 调用用户服务的获取用户接口
     * 完整URL：GET http://user-service/user/{id}
     */
    @GetMapping("/user/{id}")
    User getUser(@PathVariable("id") Long id);

    /**
     * 调用用户服务的用户列表接口
     * 完整URL：GET http://user-service/user/list
     */
    @GetMapping("/user/list")
    List<User> listUsers();

    /**
     * 发送POST请求
     * 完整URL：POST http://user-service/user/create
     */
    @PostMapping("/user/create")
    User createUser(@RequestBody UserCreateRequest request);

    /**
     * 带参数请求
     */
    @GetMapping("/user/search")
    List<User> searchUsers(
        @RequestParam("name") String name,
        @RequestParam(value = "age", required = false) Integer age
    );
}

/**
 * Feign客户端的fallback实现
 * 当调用失败时（如服务不可用），返回兜底数据
 */
@Component
public class UserFeignClientFallback implements UserFeignClient {

    @Override
    public User getUser(Long id) {
        // 返回默认用户
        return new User(id, "默认用户", 0);
    }

    @Override
    public List<User> listUsers() {
        // 返回空列表
        return Collections.emptyList();
    }

    @Override
    public User createUser(UserCreateRequest request) {
        return new User(0L, "创建失败", 0);
    }

    @Override
    public List<User> searchUsers(String name, Integer age) {
        return Collections.emptyList();
    }
}

/**
 * 在Controller中使用Feign客户端
 */
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private UserFeignClient userFeignClient;

    @GetMapping("/create-with-user")
    public Order createOrderWithUser(@RequestParam Long userId) {
        // 通过Feign调用用户服务获取用户信息
        User user = userFeignClient.getUser(userId);

        // 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setUserName(user.getName());
        order.setProduct("外卖套餐");
        return order;
    }

    @GetMapping("/search-user")
    public List<User> searchUsers(@RequestParam String name) {
        return userFeignClient.searchUsers(name, null);
    }
}

/**
 * Feign配置类
 */
@Configuration
public class FeignConfig {

    /**
     * 配置日志级别
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        // NONE: 不记录（默认）
        // BASIC: 仅记录请求方法、URL、响应状态码
        // HEADERS: 记录请求和响应Headers
        // FULL: 记录全部
        return Logger.Level.FULL;
    }

    /**
     * 配置超时时间
     */
    @Bean
    public Request.Options feignOptions() {
        return new Request.Options(
            5000,  // 连接超时：5秒
            10000  // 读取超时：10秒
        );
    }

    /**
     * 配置编码器/解码器
     */
    @Bean
    public Encoder feignEncoder() {
        return new GsonEncoder();
    }

    @Bean
    public Decoder feignDecoder() {
        return new GsonDecoder();
    }
}

/**
 * application.yml配置Feign
 *
 * spring:
 *   cloud:
 *     openfeign:
 *       client:
 *         config:
 *           default:  # 默认配置
 *             logger-level: basic
 *             connect-timeout: 5000
 *             read-timeout: 10000
 *           user-service:  # 指定服务配置
 *             logger-level: full
 *       circuitbreaker:  # 启用Sentinel熔断
 *         enabled: true
 *       compression:  # 请求压缩
 *         request:
 *           enabled: true
 *         response:
 *           enabled: true
 */
```

### 4.3 Feign vs RestTemplate

```java
/**
 * Feign与RestTemplate对比
 */

/**
 * RestTemplate方式（传统）
 */
@Service
public class RestTemplateOrderService {

    @Autowired
    private RestTemplate restTemplate;

    public User getUserByRestTemplate(Long userId) {
        // 拼接URL
        String url = "http://user-service/user/" + userId;

        // 调用
        return restTemplate.getForObject(url, User.class);
    }

    // 问题：
    // 1. URL需要手动拼接，容易出错
    // 2. 没有类型检查，参数错误只能在运行时发现
    // 3. 代码冗长
}

/**
 * Feign方式（推荐）
 */
@Service
public class FeignOrderService {

    @Autowired
    private UserFeignClient userFeignClient;

    public User getUserByFeign(Long userId) {
        // 就像调用本地方法
        return userFeignClient.getUser(userId);
    }

    // 优点：
    // 1. 声明式API，代码简洁
    // 2. 编译时类型检查
    // 3. 支持负载均衡、熔断
    // 4. 支持日志、拦截器
}

/*
 * 对比表格：
 *
 * ┌─────────────┬────────────────────────────────────────────────────┐
> > │    方式      │                     特点                         │█
> > ├─────────────┼────────────────────────────────────────────────────┤
> > │ RestTemplate │ URL拼接，容易出错                                 │█
> > │             │ 需要配合Ribbon使用                                │█
> > │             │ 代码冗长                                         │█
> > ├─────────────┼────────────────────────────────────────────────────┤
> > │ OpenFeign   │ 声明式API，简洁                                   │█
> > │             │ 编译时类型检查                                    │█
> > │             │ 内置负载均衡、熔断支持                            │█
> > │             │ 可扩展日志、拦截器                                │█
> > └─────────────┴────────────────────────────────────────────────────┘
 */
```

---

## 五、Sentinel流量控制

### 5.1 Sentinel是什么？

**Sentinel**就像**餐厅的限流机制**：当客流太大时，门口保安限制进入人数，保证服务质量。Sentinel是阿里巴巴开源的流量控制组件，提供流量控制、熔断降级、系统自适应保护等功能。

### 5.2 Sentinel使用

```java
/**
 * Sentinel使用示例
 *
 * 依赖：
 * <dependency>
 *     <groupId>com.alibaba.cloud</groupId>
 *     <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
 * </dependency>
 */

/**
 * 方式一：使用@SentinelResource注解（推荐）
 */
@RestController
@RequestMapping("/product")
public class ProductController {

    /**
     * 配置限流规则和熔断规则
     *
     * @SentinelResource属性：
     * - value: 资源名
     * - blockHandler: 限流处理方法
     * - fallback: 降级处理方法
     * - exceptionsToIgnore: 忽略的异常
     */
    @GetMapping("/{id}")
    @SentinelResource(
        value = "getProduct",
        blockHandler = "getProductBlockHandler",
        fallback = "getProductFallback"
    )
    public Product getProduct(@PathVariable Long id) {
        // 模拟查询商品
        if (id < 0) {
            throw new IllegalArgumentException("商品ID不能为负数");
        }

        return new Product(id, "商品" + id, 99.99);
    }

    /**
     * 限流处理方法
     * 必须是public，返回类型与原方法一致
     * 参数最后需要加BlockException
     */
    public Product getProductBlockHandler(Long id, BlockException ex) {
        Product product = new Product();
        product.setId(id);
        product.setName("系统繁忙，请稍后再试");
        product.setPrice(0);
        return product;
    }

    /**
     * 降级处理方法
     * 当方法抛出异常或被限流时调用
     */
    public Product getProductFallback(Long id, Throwable ex) {
        Product product = new Product();
        product.setId(id);
        product.setName("商品信息暂时不可用");
        product.setPrice(0);
        return product;
    }

    /**
     * 热点参数限流
     * 第一个参数为热点参数，会根据参数值分别限流
     */
    @GetMapping("/detail")
    @SentinelResource(
        value = "getProductDetail",
        blockHandler = "getProductDetailBlockHandler"
    )
    public Product getProductDetail(
            @RequestParam Long id,
            @RequestParam(required = false) String category) {
        return new Product(id, "商品" + id, 99.99);
    }

    public Product getProductDetailBlockHandler(Long id, String category, BlockException ex) {
        throw new RuntimeException("热点限流触发");
    }
}

/**
 * 方式二：使用Sentinel API手动限流
 */
@Service
public class SentinelApiDemo {

    public void manualSentinel() {
        // 创建一个限流 entry
        try (Entry entry = SphU.entry("manualApi")) {
            // 被保护的业务逻辑
            doBusiness();

        } catch (BlockException ex) {
            // 被限流了
            handleBlock();
        }
    }

    /**
     * 使用try-with-resources自动释放entry
     */
    public void autoReleaseEntry() {
        try {
            // 定义资源
            Entry entry = SphU.entry("autoReleaseApi");

            // 业务逻辑
            doBusiness();

        } catch (BlockException ex) {
            // 限流处理
            handleBlock();
        }
        // entry会自动释放
    }

    private void doBusiness() {
        System.out.println("执行业务逻辑...");
    }

    private void handleBlock() {
        System.out.println("被限流了，执行降级逻辑");
    }
}

/**
 * 方式三：基于配置文件的限流规则
 *
 * application.yml配置：
 *
 * spring:
 *   cloud:
 *     sentinel:
 *       transport:
 *         dashboard: localhost:8080  # Sentinel控制台地址
 *         port: 8719  # 客户端端口
 *       eager: true  # 取消延迟加载
 *
 * # 或者通过代码定义规则
 */

/**
 * 配置限流规则（代码方式）
 */
@Configuration
public class SentinelConfig {

    @PostConstruct
    public void initSentinelRules() {
        // 定义限流规则
        List<FlowRule> rules = new ArrayList<>();

        FlowRule rule = new FlowRule();
        rule.setResource("getProduct");  // 资源名
        rule.setGrade(RuleConstant.FLOW_GRADE_QPS);  // 按QPS限流
        rule.setCount(10);  // 阈值：每秒最多10个请求
        rule.setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_DEFAULT);
        // 控制行为：
        // - CONTROL_BEHAVIOR_DEFAULT: 直接拒绝
        // - CONTROL_BEHAVIOR_WARM_UP: 冷启动（预热）
        // - CONTROL_BEHAVIOR_QUEUEING: 排队等待

        rules.add(rule);

        // 加载规则
        FlowRuleManager.loadRules(rules);
    }
}
```

### 5.3 Sentinel流量控制策略

```java
/**
 * Sentinel流量控制策略详解
 */

/*
 * Sentinel流量控制（Flow Control）：
 *
 * 1. QPS流控
 *    当QPS超过阈值时，进行限流
 *
 *    ┌──────────────────────────────────────────────────────────┐
>    >    │  QPS > 100 ──→ 直接拒绝 ──→ 返回BlockedException      │
>    >    │  QPS <= 100 ──→ 通过                                   │
>    >    └──────────────────────────────────────────────────────────┘
 *
 * 2. 并发线程数流控
 *    当线程数超过阈值时，进行限流
 *
 *    ┌──────────────────────────────────────────────────────────┐
>    >    │  线程数 > 10 ──→ 直接拒绝 ──→ 返回BlockedException    │
>    >    │  线程数 <= 10 ──→ 通过                               │
>    >    └──────────────────────────────────────────────────────────┘
 *
 * 3. 冷启动（Warm Up）
 *    令牌桶算法，请求阈值从minRate逐渐增加到maxRate
 *
 *    ┌──────────────────────────────────────────────────────────┐
>    >    │  时间 ──→ 0 ──→ 10 ──→ 30秒                        │
>    >    │  QPS  ──→ 0 ──→ 0 ──→ 100（逐步增加）                │
>    >    └──────────────────────────────────────────────────────────┘
>    >    场景：秒杀开始时，防止系统被压垮
>
>    4. 匀速排队
>    >    按固定间隔放行请求
>
>    >    ┌──────────────────────────────────────────────────────────┐
>    >    │  请求1 ──→ 立即通过                                   │
>    >    │  请求2 ──→ 等待100ms ──→ 通过                        │
>    >    │  请求3 ──→ 等待200ms ──→ 通过                        │
>    >    └──────────────────────────────────────────────────────────┘
>    >    场景：削峰填谷
>    >    │
>    >    └──────────────────────────────────────────────────────────┘
>
>    > Sentinel熔断降级策略：
>
>    > 1. 慢调用比例
>    >    当平均响应时间超过阈值时，熔断
>
>    >    ┌──────────────────────────────────────────────────────────┐
>    >    │  统计时间窗口：10秒                                     │
>    >    │  慢调用比例阈值：50%                                    │
>    >    │  最小请求数：5                                         │
>    >    │                                                         │
>    >    │  如果10秒内请求>=5，且50%以上超过500ms                 │
>    >    │  ──→ 触发熔断，接下来5秒内拒绝所有请求                 │
>    >    └──────────────────────────────────────────────────────────┘
>
>    > 2. 异常比例
>    >    当异常比例超过阈值时，熔断
>
>    >    ┌──────────────────────────────────────────────────────────┐
>    >    │  统计时间窗口：10秒                                     │
>    >    │  异常比例阈值：50%                                      │
>    >    │  最小请求数：5                                         │
>    >    │                                                         │
>    >    │  如果10秒内请求>=5，且50%以上抛出异常                   │
>    >    │  ──→ 触发熔断                                          │
>    >    └──────────────────────────────────────────────────────────┘
>
>    > 3. 异常数
>    >    当异常数超过阈值时，熔断
>
>    >    ┌──────────────────────────────────────────────────────────┐
>    >    │  统计时间窗口：1分钟                                    │
>    >    │  异常数阈值：20                                        │
>    >    │                                                         │
>    >    │  如果1分钟内异常数>=20                                  │
>    >    │  ──→ 触发熔断                                          │
>    >    └──────────────────────────────────────────────────────────┘
>    >    |
>    >    └──────────────────────────────────────────────────────────┘
>    >    |
>    >    熔断器状态转换：
>    >
>    >    ┌──────────────────────────────────────────────────────────┐
>    >    │                                                         │
>    >    │  CLOSED（关闭）──正常请求通过──→[触发熔断条件]            │
>    >    │     ↑                              ↓                     │
>    >    │     │                         ┌────────┐                 │
>    >    │     │                         │ OPEN   │                 │
>    >    │     │                         │ 熔断中 │                 │
>    >    │     │                         └────────┘                 │
>    >    │     │                              │                     │
>    >    │     │                    [过了熔断时长]                   │
>    >    │     │                              ↓                     │
>    >    │     │                       ┌────────┐                 │
>    >    │     │                       │HALF_OPEN│                 │
>    >    │     │                       │ 半开状态 │                 │
>    >    │     │                       └────────┘                 │
>    >    │     │                              │                    │
>    >    └──────┘                        [请求成功]                 │
>    >                                     ↓                        │
>    >                               [请求失败]                     │
>    >                                     ↓                        │
>    >                               ┌────────┐                    │
>    >                               │ OPEN   │                    │
>    >                               │ 熔断中 │                    │
>    >                               └────────┘                    │
>    >                                                         │
>    └──────────────────────────────────────────────────────────┘
>    */
```

---

## 六、Gateway网关

### 6.1 Gateway是什么？

**Gateway**就像**餐厅的总台**：顾客进门先到总台，总台负责接待（路由）、检查穿着（安全）、记录来访（监控）等。

Gateway是Spring Cloud官方网关，替代了Netflix的Zuul，提供路由转发、权限校验、限流熔断等功能。

### 6.2 Gateway路由配置

```java
/**
 * Gateway网关配置示例
 *
 * 依赖：
 * <dependency>
 *     <groupId>org.springframework.cloud</groupId>
 *     <artifactId>spring-cloud-starter-gateway</artifactId>
 * </dependency>
 */

/**
 * 方式一：配置文件方式
 */
@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}

/*
 * application.yml配置：
 *
 * spring:
 *   application:
 *     name: gateway-service
 *   cloud:
 *     nacos:
 *       discovery:
 *         server-addr: 127.0.0.1:8848
 *     gateway:
 *       discovery:
 *         locator:
 *           enabled: true  # 启用服务发现路由
 *           lower-case-service-id: true  # 服务ID小写
 *       routes:
 *         - id: user-service-route
 *           uri: lb://user-service  # lb表示负载均衡
 *           predicates:
 *             - Path=/user/**
 *           filters:
 *             - StripPrefix=1  # 去掉第一层路径
 *
 *         - id: order-service-route
 *           uri: lb://order-service
 *           predicates:
 *             - Path=/order/**
 *           filters:
 *             - StripPrefix=1
 *
 *         - id: product-service-route
 *           uri: lb://product-service
 *           predicates:
 *             - Path=/product/**
 *             - After=2024-01-01T00:00:00+08:00[Asia/Shanghai]  # 条件路由
 *
 *         - id: internal-api-route
 *           uri: http://internal-api:8080
 *           predicates:
 *             - Path=/internal/**
 *           filters:
 *             - Deny=internal  # 拒绝访问
 */

/**
 * 方式二：Java代码配置方式
 */
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // 用户服务路由
            .route("user-service", r -> r
                .path("/user/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "gateway")
                    .addResponseHeader("X-Response-Gateway", "gateway")
                    .prefixPath("/api/v1")
                )
                .uri("lb://user-service")
            )
            // 订单服务路由
            .route("order-service", r -> r
                .path("/order/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .rateLimiter()  // 限流
                        .configure(c -> c
                            .setRateLimiter(redisRateLimiter())
                        )
                )
                .uri("lb://order-service")
            )
            // 带着参数路由
            .route("search-service", r -> r
                .path("/search/**")
                .filters(f -> f
                    .rewritePath("/search/(?<segment>.*)", "/$\\{segment}")
                )
                .uri("lb://search-service")
            )
            .build();
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        // QPS=100
        return new RedisRateLimiter(100, 100);
    }
}

/**
 * 动态路由示例
 * 从数据库或配置中心加载路由
 */
@Service
public class DynamicRouteService {

    @Autowired
    private RouteDefinitionWriter routeDefinitionWriter;

    @Autowired
    private ApplicationEventPublisher publisher;

    /**
     * 添加路由
     */
    public void addRoute(RouteDefinition definition) {
        routeDefinitionWriter.save(Mono.just(definition));
        publisher.publishEvent(new RefreshRoutesEvent(this));
    }

    /**
     * 更新路由
     */
    public void updateRoute(RouteDefinition definition) {
        deleteRoute(definition.getId());
        addRoute(definition);
    }

    /**
     * 删除路由
     */
    public Mono<ResponseEntity<Object>> deleteRoute(String id) {
        return routeDefinitionWriter.delete(Mono.just(id))
            .then(Mono.defer(() -> Mono.just(ResponseEntity.ok().build())))
            .onErrorResume(e -> Mono.just(ResponseEntity.notFound().build()));
    }
}
```

### 6.3 Gateway过滤器

```java
/**
 * Gateway过滤器示例
 */

/**
 * 1. 全局过滤器（GlobalFilter）
 *    对所有路由生效
 */
@Component
@Order(1)  // 过滤器顺序，数字越小越先执行
public class AuthGlobalFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getQueryParams().getFirst("token");

        // 检查token
        if (token == null || !isValidToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 继续传递，添加用户信息到header
        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
            .header("X-User-Id", getUserIdFromToken(token))
            .build();

        return chain.filter(
            exchange.mutate().request(modifiedRequest).build()
        );
    }

    private boolean isValidToken(String token) {
        // 验证token逻辑
        return token != null && token.length() > 0;
    }

    private String getUserIdFromToken(String token) {
        // 从token解析用户ID
        return "user123";
    }
}

/**
 * 2. 自定义GatewayFilter
 *    只对特定路由生效
 */
@Component
public class RequestTimeGatewayFilter implements GatewayFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();

        return chain.filter(exchange).then(
            Mono.fromRunnable(() -> {
                long endTime = System.currentTimeMillis();
                String uri = exchange.getRequest().getURI().getPath();
                long duration = endTime - startTime;

                System.out.println("请求 " + uri + " 耗时：" + duration + "ms");
            })
        );
    }
}

/**
 * 3. 使用内置过滤器
 *
 * application.yml配置：
 *
 * spring:
 *   cloud:
 *     gateway:
 *       default-filters:
 *         - name: RequestSize
 *           args:
 *             maxSize: 10MB
 *         - name: Retry
 *           args:
 *             retries: 3
 *             statuses: INTERNAL_SERVER_ERROR
 */

/**
 * 4. 过滤器工厂配置
 */
@Configuration
public class FilterFactoryConfig {

    /**
     * 自定义Headers过滤器工厂
     */
    @Bean
    public FactoryGatewayFilterFactory<HeadersGatewayFilterFactory.Config> customHeadersFilter() {
        return new FactoryGatewayFilterFactory<>(HeadersGatewayFilterFactory.Config.class) {
            @Override
            public GatewayFilter apply(Config config) {
                return (exchange, chain) -> {
                    ServerHttpRequest.Builder builder = exchange.getRequest().mutate();

                    config.getHeaders().forEach(builder::header);

                    return chain.filter(
                        exchange.mutate().request(builder.build()).build()
                    );
                };
            }
        };
    }
}

/*
 * Gateway过滤器执行顺序：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> │                    Gateway过滤器执行链                             │
├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  请求进入                                                      │
> > │      │                                                        │
> > │      ▼                                                        │
> > │  ┌─────────────────────────────────────────────────────────┐   │
> > │  │  1. GlobalFilter A (@Order(1))                         │   │
> > │  └─────────────────────────────────────────────────────────┘   │
> > │      │                                                        │
> > │      ▼                                                        │
> > │  ┌─────────────────────────────────────────────────────────┐   │
> > │  │  2. GlobalFilter B (@Order(2))                         │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  3. GatewayFilter 1 (路由级别)                          │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  4. GatewayFilter 2 (路由级别)                          │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  5. 目标服务                                              │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  6. GatewayFilter 2 (路由级别) - 响应处理                │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  7. GatewayFilter 1 (路由级别) - 响应处理                │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  8. GlobalFilter B - 响应处理                           │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │  ┌─────────────────────────────────────────────────────────┐   │
> > > │  │  9. GlobalFilter A - 响应处理                           │   │
> > > │  └─────────────────────────────────────────────────────────┘   │
> > > │      │                                                        │
> > > │      ▼                                                        │
> > > │   响应返回                                                    │
> > > │                                                                  │
> >  └─────────────────────────────────────────────────────────────────┘
>    */
```

---

## 七、Seata分布式事务

### 7.1 分布式事务问题

**分布式事务**就像**跨店铺点外卖**：用户在店铺A点了主食，在店铺B点了饮料，需要保证要么都成功，要么都失败。

```
┌────────────────────────────────────────────────────────────────────┐
│                      分布式事务问题                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  本地事务（单体应用）：                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  BEGIN TRANSACTION                                          │ │
│  │      UPDATE 用户表 SET 余额 = 余额 - 100 WHERE user_id=1   │ │
│  │      INSERT INTO 订单表 VALUES (...)                        │ │
│  │      UPDATE 库存表 SET 数量 = 数量 - 1 WHERE product_id=1   │ │
│  │  COMMIT                                                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  分布式事务（多服务）：                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  服务A：用户服务                                              │ │
│  │      UPDATE 用户表 SET 余额 = 余额 - 100                   │ │
│  │                                                              │ │
│  │  服务B：订单服务                                              │ │
│  │      INSERT INTO 订单表 VALUES (...)                        │ │
│  │                                                              │ │
│  │  服务C：库存服务                                              │ │
│  │      UPDATE 库存表 SET 数量 = 数量 - 1                      │ │
│  │                                                              │ │
│  │  问题：如何保证这三个操作要么都成功，要么都失败？             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 Seata AT模式

```java
/**
 * Seata分布式事务示例
 *
 * Seata三种模式：AT、TCC、Saga
 * AT模式是最简单的，自动处理回滚
 *
 * 依赖：
 * <dependency>
 *     <groupId>com.alibaba.cloud</groupId>
 *     <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
 * </dependency>
 *
 * 需要启动Seata Server
 */

/**
 * 订单服务 - 使用Seata AT模式
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableGlobalTransaction  // 启用全局事务
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

/**
 * 订单服务 - 业务实现
 */
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AccountFeignClient accountFeignClient;

    @Autowired
    private StorageFeignClient storageFeignClient;

    /**
     * 创建订单 - 分布式事务
     *
     * @GlobalTransactional 注解开启全局事务
     * seata-group 是事务分组
     */
    @GlobalTransactional(rollbackFor = Exception.class, name = "create-order")
    public Order createOrder(Long userId, Long productId, Integer count) {
        // 1. 调用账户服务扣减余额
        // 需要配置seata的undo_log表
        accountFeignClient.deductBalance(userId, count * 100);

        // 2. 调用库存服务扣减库存
        storageFeignClient.deductStorage(productId, count);

        // 3. 创建本地订单
        Order order = new Order();
        order.setUserId(userId);
        order.setProductId(productId);
        order.setCount(count);
        order.setStatus("CREATED");

        return orderRepository.save(order);
    }

    /**
     * 如果任何一步失败，Seata会自动回滚所有操作
     */
}

/**
 * 账户服务 - 模拟扣减余额
 */
@Service
public class AccountService {

    @GlobalTransactional(rollbackFor = Exception.class)
    public void deductBalance(Long userId, BigDecimal amount) {
        // 1. 扣减余额
        accountRepository.updateBalance(userId, amount);

        // 2. Seata会自动记录前后镜像
        // 如果全局事务失败，Seata会自动回滚
    }
}

/**
 * Seata配置
 *
 * application.yml：
 *
 * spring:
 *   cloud:
 *     alibaba:
 *       seata:
 *         tx-service-group: my-tx-group  # 事务分组
 *         enabled: true
 *
 * seata:
 *   config:
 *     type: nacos
 *     nacos:
 *       server-addr: 127.0.0.1:8848
 *       namespace: dev
 *       group: SEATA_GROUP
 *   registry:
 *     type: nacos
 *     nacos:
 *       server-addr: 127.0.0.1:8848
 *       namespace: dev
 *       group: SEATA_GROUP
 *
 * 需要在数据库中创建undo_log表：
 * CREATE TABLE `undo_log` (
 *   `id` bigint NOT NULL AUTO_INCREMENT,
 *   `branch_id` bigint NOT NULL,
 *   `xid` varchar(100) NOT NULL,
 *   `context` varchar(128) NOT NULL,
 *   `rollback_info` longblob NOT NULL,
 *   `log_status` int NOT NULL,
 *   `log_created` datetime NOT NULL,
 *   `log_modified` datetime NOT NULL,
 *   UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`)
 * ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
 */
```

### 7.3 Seata工作原理

```
┌────────────────────────────────────────────────────────────────────┐
│                         Seata AT模式工作原理                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      TC (Transaction Coordinator)             │ │
│  │                         事务协调器                            │ │
│  │                      （Seata Server）                        │ │
│  │                                                              │ │
│  │  - 管理全局事务（开启、提交、回滚）                            │ │
│  │  - 协调分支事务的提交/回滚                                    │ │
│  │  - 管理全局锁                                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↑                                    │
│         ┌────────────────────┼────────────────────┐               │
│         │                    │                    │                │
│         ↓                    ↓                    ↓                │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│  │ TM (事务管理器) │     │ TM          │      │ TM          │       │
│  │  - 订单服务  │      │ - 账户服务  │      │ - 库存服务  │       │
│  │  - 开启事务  │      │ - 注册分支  │      │ - 注册分支  │       │
│  │  - 提交/回滚│      │ - 提交/回滚 │      │ - 提交/回滚 │       │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘       │
│         │                   │                    │                │
│         │ Branch Transaction │ Branch Transaction │                │
│         ↓                   ↓                    ↓                │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│  │ DB(订单)   │      │ DB(账户)    │      │ DB(库存)    │       │
│  │ + undo_log │      │ + undo_log  │      │ + undo_log  │       │
│  └─────────────┘      └─────────────┘      └─────────────┘       │
│                                                                      │
├────────────────────────────────────────────────────────────────────┤
│                         事务流程                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. TM（订单服务）向TC申请开启全局事务                               │
│     TC生成XID（全局事务ID）                                         │
│                                                                      │
│  2. TM调用各微服务，各微服务注册分支事务                             │
│     分支事务与全局事务关联                                          │
│                                                                      │
│  3. 各微服务执行SQL，Seata自动记录前后镜像（undo_log）               │
│                                                                      │
│  4. TM向TC申请提交/回滚全局事务                                      │
│                                                                      │
│  5. TC协调各分支：                                                   │
│     - 如果提交：异步删除undo_log                                    │
│     - 如果回滚：根据undo_log自动补偿，恢复到之前状态                  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 八、综合实战：外卖订单系统

### 8.1 系统架构设计

```
┌────────────────────────────────────────────────────────────────────┐
│                        外卖订单系统架构                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                           用户端 / 商户端 / 骑手端                    │
│                                   │                                  │
│                                   ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Spring Cloud Gateway                       │ │
│  │                    (统一入口 + 鉴权 + 限流)                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                   │                                  │
│           ┌───────────────────────┼───────────────────────┐        │
│           │                       │                       │        │
│           ▼                       ▼                       ▼        │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │ 用户服务     │      │ 订单服务     │      │ 商品服务     │     │
│  │ :8001        │      │ :8002        │      │ :8003        │     │
│  │ - 注册/登录  │      │ - 创建订单   │      │ - 商品列表   │     │
│  │ - 地址管理   │      │ - 订单查询   │      │ - 库存管理   │     │
│  │ - 会员信息   │      │ - 状态流转   │      │ - 分类管理   │     │
│  └──────────────┘      └──────┬───────┘      └──────────────┘     │
│                               │                                      │
│           ┌───────────────────┼───────────────────┐                │
│           │                   │                   │                 │
│           ▼                   ▼                   ▼                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │ 支付服务     │      │ 配送服务     │      │ 评价服务     │     │
│  │ :8004        │      │ :8005        │      │ :8006        │     │
│  │ - 支付下单   │      │ - 派单       │      │ - 评价       │     │
│  │ - 支付回调   │      │ - 骑手位置   │      │ - 评分       │     │
│  └──────────────┘      └──────────────┘      └──────────────┘     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      Nacos (注册中心 + 配置中心)                │ │
│  │                      Seata (分布式事务)                         │ │
│  │                      Sentinel (限流熔断)                       │ │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 核心代码实现

```java
/**
 * 订单服务核心实现
 */

/**
 * 订单Controller
 */
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderFeignClient orderFeignClient;

    /**
     * 创建订单（分布式事务）
     *
     * 流程：
     * 1. 验证用户信息
     * 2. 验证商品信息
     * 3. 扣减库存
     * 4. 扣减余额
     * 5. 创建订单
     * 6. 发送消息通知商家
     *
     * 使用@GlobalTransactional保证事务
     */
    @PostMapping("/create")
    @GlobalTransactional(rollbackFor = Exception.class)
    public Result<OrderCreateResponse> createOrder(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody @Valid OrderCreateRequest request) {

        // 1. 获取用户信息
        UserDTO user = orderFeignClient.getUser(userId);

        // 2. 获取商品信息
        ProductDTO product = orderFeignClient.getProduct(request.getProductId());

        // 3. 验证库存
        if (product.getStock() < request.getCount()) {
            return Result.error("库存不足");
        }

        // 4. 计算总价
        BigDecimal totalAmount = product.getPrice()
            .multiply(BigDecimal.valueOf(request.getCount()));

        // 5. 验证余额
        if (user.getBalance().compareTo(totalAmount) < 0) {
            return Result.error("余额不足");
        }

        // 6. 扣减余额
        orderFeignClient.deductBalance(userId, totalAmount);

        // 7. 扣减库存
        orderFeignClient.deductStock(request.getProductId(), request.getCount());

        // 8. 创建订单
        Order order = orderService.createOrder(userId, request, totalAmount);

        // 9. 返回响应
        OrderCreateResponse response = new OrderCreateResponse();
        response.setOrderId(order.getId());
        response.setOrderNo(order.getOrderNo());
        response.setTotalAmount(totalAmount);
        response.setStatus(order.getStatus());

        return Result.success(response);
    }

    /**
     * 查询订单详情
     */
    @GetMapping("/{orderId}")
    public Result<OrderDetailResponse> getOrderDetail(
            @PathVariable Long orderId) {
        return Result.success(orderService.getOrderDetail(orderId));
    }

    /**
     * 订单状态流转
     */
    @PostMapping("/{orderId}/status")
    @GlobalTransactional
    public Result<Void> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {

        orderService.updateOrderStatus(orderId, status);
        return Result.success();
    }
}

/**
 * 订单服务实现
 */
@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusLogRepository statusLogRepository;

    /**
     * 创建订单
     */
    @Transactional  // 本地事务
    public Order createOrder(Long userId, OrderCreateRequest request,
                            BigDecimal totalAmount) {
        // 1. 创建订单
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setProductId(request.getProductId());
        order.setCount(request.getCount());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setCreatedAt(new Date());

        order = orderRepository.save(order);

        // 2. 记录状态日志
        logOrderStatus(order.getId(), null, OrderStatus.PENDING_PAYMENT);

        return order;
    }

    /**
     * 更新订单状态
     */
    @Transactional
    public void updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId);
        String oldStatus = order.getStatus();

        order.setStatus(newStatus);
        orderRepository.save(order);

        // 记录状态变更
        logOrderStatus(orderId, oldStatus, newStatus);

        // 发送状态变更事件（用于通知其他服务）
        publishStatusChangeEvent(orderId, oldStatus, newStatus);
    }

    /**
     * 生成订单号
     * 格式：20240101 + 时间戳 + 随机数
     */
    private String generateOrderNo() {
        return new SimpleDateFormat("yyyyMMddHHmmss")
            .format(new Date())
            + String.format("%04d", new Random().nextInt(10000));
    }
}

/**
 * 订单实体
 */
@Entity
@Table(name = "t_order")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String orderNo;  // 订单号

    private Long userId;
    private Long productId;
    private Integer count;
    private BigDecimal totalAmount;
    private String status;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    // getters and setters
}

/**
 * Feign客户端定义
 */
@FeignClient(name = "user-service", fallback = UserFeignClientFallback.class)
public interface OrderFeignClient {

    @GetMapping("/user/{id}")
    UserDTO getUser(@PathVariable("id") Long id);

    @GetMapping("/product/{id}")
    ProductDTO getProduct(@PathVariable("id") Long id);

    @PostMapping("/user/{id}/balance/deduct")
    Void deductBalance(@PathVariable("id") Long id, @RequestParam BigDecimal amount);

    @PostMapping("/product/{id}/stock/deduct")
    Void deductStock(@PathVariable("id") Long id, @RequestParam Integer count);
}
```

---

## 九、总结

### 9.1 Spring Cloud组件对比

```
┌────────────────────────────────────────────────────────────────────┐
│                      Spring Cloud组件对比                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     服务注册与发现                              │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┐              │ │
│  │  │ Nacos   │ Eureka   │ Consul   │ Zookeeper│              │ │
│  │  ├──────────┼──────────┼──────────┼──────────┤              │ │
│  │  │ 阿里的   │ Netflix │ HashiCorp│ Apache   │              │ │
│  │  │ 功能全面  │ 已停止更新│ 功能完整  │ 通用      │              │ │
│  │  │ 推荐使用  │ 不推荐    │ 推荐使用  │ 不推荐    │              │ │
│  │  └──────────┴──────────┴──────────┴──────────┘              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       负载均衡                                  │ │
│  │  ┌──────────┬──────────┬──────────┐                         │ │
│  │  │ Ribbon   │ LoadBalancer│ Nginx │                         │ │
│  │  ├──────────┼──────────┼──────────┤                         │ │
│  │  │ Netflix  │ Spring    │ L7负载均衡│                        │ │
│  │  │ 客户端负载│ 官方客户端  │ 软件    │                         │ │
│  │  │ 已停止更新│ 推荐使用    │ 集成复杂 │                         │ │
│  │  └──────────┴──────────┴──────────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       服务调用                                  │ │
│  │  ┌──────────┬──────────┬──────────┐                         │ │
│  │  │ Feign    │ OpenFeign│ RestTemplate│                      │ │
│  │  ├──────────┼──────────┼──────────┤                         │ │
│  │  │ 已停止    │ 官方推荐   │ 传统方式  │                         │ │
│  │  │          │ 声明式    │ 需要配合Ribbon│                     │ │
│  │  │          │ 使用简单   │          │                         │ │
│  │  └──────────┴──────────┴──────────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       流量控制                                  │ │
│  │  ┌──────────┬──────────┬──────────┐                         │ │
│  │  │ Sentinel │ Hystrix  │ Resilience4j│                     │ │
│  │  ├──────────┼──────────┼──────────┤                         │ │
│  │  │ 阿里巴巴  │ Netflix  │ 社区     │                         │ │
│  │  │ 功能完善  │ 已停止更新│ 响应式    │                         │ │
│  │  │ 推荐使用  │ 不推荐    │ 推荐使用  │                         │ │
│  │  └──────────┴──────────┴──────────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       网关路由                                  │ │
│  │  ┌──────────┬──────────┐                                    │ │
│  │  │ Gateway  │ Zuul     │                                    │ │
│  │  ├──────────┼──────────┤                                    │ │
│  │  │ Spring   │ Netflix │                                    │ │
│  │  │ 官方     │ 已停止更新│                                    │ │
│  │  │ WebFlux  │ Servlet │                                    │ │
│  │  │ 推荐使用  │ 不推荐    │                                    │ │
│  │  └──────────┴──────────┘                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       分布式事务                               │ │
│  │  ┌──────────┬──────────┬──────────┐                         │ │
│  │  │ Seata    │ ShardingSphere│ LCN │                         │ │
│  │  ├──────────┼──────────┼──────────┤                         │ │
│  │  │ 阿里     │ Apache   │ TX-LCN │                         │ │
│  │  │ AT/TCC/Saga│ 代理模式 │ 协调者模式│                        │ │
│  │  │ 推荐使用  │ 功能全面  │ 不推荐   │                         │ │
│  │  └──────────┴──────────┴──────────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 9.2 面试高频问题

| 问题 | 核心回答要点 |
|------|-------------|
| Nacos和Eureka的区别？ | Nacos支持CP和AP，Eureka只支持AP；Nacos有配置中心，Eureka没有 |
| Ribbon负载均衡策略？ | RoundRobin、Random、WeightedResponseTime等 |
| Feign的原理？ | 动态代理+JDK InvokerHandler，通过Ribbon实现负载均衡 |
| Sentinel的限流算法？ | 直接拒绝、冷启动、匀速排队 |
| Gateway的工作流程？ | 请求→Predicates→Filters→目标服务 |
| Seata AT模式原理？ | TC协调+TM管理+分支事务+undo_log回滚 |
| 分布式事务解决方案？ | 2PC、3PC、TCC、本地消息表、Saga、Seata |
| 如何保证微服务高可用？ | 集群部署、限流熔断、降级、超时重试、隔离 |

---

> 希望本文能帮助你全面掌握Spring Cloud微服务架构的核心技术！如有疑问，欢迎交流！
