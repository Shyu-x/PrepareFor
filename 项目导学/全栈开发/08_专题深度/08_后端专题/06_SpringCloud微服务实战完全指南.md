# Spring Cloud微服务实战完全指南

> 如果把微服务架构比作一个交响乐团，那么Spring Cloud就是那位经验丰富的指挥家。它协调着Nacos（乐谱架）、Ribbon（分配演奏者）、Feign（指挥棒）、Sentinel（安全带）和Hystrix（急救医生）等各位乐手，让这首复杂的软件交响曲能够和谐演奏。本文档将带你深入Spring Cloud生态，掌握微服务治理的核心技能。

## 一、Spring Cloud生态概述

### 1.1 为什么选择Spring Cloud

Spring Cloud是目前Java生态中最成熟的微服务解决方案，它提供了一站式微服务治理能力。

**Spring Cloud核心组件矩阵：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Spring Cloud 组件全景                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  服务注册与发现          ┌─────────────────────────────────────┐│
│  ┌─────────────────┐    │  Nacos          - 阿里的成熟方案     ││
│  │ Eureka           │    │  Consul         - HashiCorp出品     ││
│  │ (已停止维护)      │    │  Zookeeper      - 老牌选择          ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
│  负载均衡与调用         ┌─────────────────────────────────────┐│
│  ┌─────────────────┐    │  Ribbon          - 进程内负载均衡    ││
│  │ Feign           │    │  LoadBalancer    - Spring原生方案   ││
│  │ (声明式HTTP)     │    │                  (已取代Ribbon)    ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
│  熔断与限流             ┌─────────────────────────────────────┐│
│  ┌─────────────────┐    │  Sentinel       - 阿里流量防卫兵    ││
│  │ Hystrix          │    │  Resilience4j   - 轻量级熔断器     ││
│  │ (已停止维护)      │    │  (Hystrix替代品)                   ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
│  网关与路由             ┌─────────────────────────────────────┐│
│  ┌─────────────────┐    │  Spring Cloud Gateway - 官方网关      ││
│  │ Zuul            │    │  (已取代Zuul)                        ││
│  │ (已停止维护)      │    │                                     ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
│  配置中心               ┌─────────────────────────────────────┐│
│  ┌─────────────────┐    │  Spring Cloud Config - 官方方案      ││
│  │ Nacos Config    │    │  Nacos             - 功能更全面      ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**版本选择建议：**

| Spring Boot | Spring Cloud | 推荐场景 |
|-------------|--------------|----------|
| 3.2.x | 2023.0 (Leyton) | Spring Boot 3.x，推荐使用 |
| 2.7.x | 2021.0 (Jupiter) | Spring Boot 2.7.x，稳定版 |
| 2.6.x | 2021.0 | 快速上手推荐 |

### 1.2 技术选型对比

**注册中心选型：**

| 特性 | Nacos | Eureka | Consul |
|------|-------|--------|--------|
| **一致性模型** | CP/AP可选 | AP | CP |
| **多语言支持** | HTTP/DNS | HTTP | HTTP/DNS/gRPC |
| **配置中心** | 内置 | 需配合 | 需配合 |
| **管理界面** | 完善 | 简陋 | 一般 |
| **活跃度** | 活跃 | 已停止维护 | 活跃 |
| **国内生态** | 好 | 一般 | 一般 |

## 二、Nacos深度实战

### 2.1 Nacos核心概念

**类比：** Nacos就像一个大型停车场的管理系统。它不仅记录每辆车（服务实例）的位置（IP、端口），还管理着停车场的各种规则（配置）。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nacos 工作模型                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     服务注册中心                            │ │
│  │                                                           │ │
│  │  服务A实例1 ──┐                                           │ │
│  │  服务A实例2 ──┼──► 服务A ──► 实例列表：[1, 2, 3]           │ │
│  │  服务A实例3 ──┘                                           │ │
│  │                                                           │ │
│  │  服务B实例1 ──────► 服务B ──► 实例列表：[1, 2]             │ │
│  │  服务B实例2 ──────►                                        │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     配置中心                               │ │
│  │                                                           │ │
│  │  命名空间: dev ──► 分组: DEFAULT ──► DataId: app.yml       │ │
│  │                                    └──► 配置内容: {..}     │ │
│  │                                                           │ │
│  │  命名空间: prod ──► 分组: order ──► DataId: order.yml      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Nacos服务端部署

**Docker快速部署：**

```bash
# 单机模式快速启动（开发测试用）
# 数据存储在嵌入式数据库，重启后会丢失
docker run --name nacos-quick \
    --env MODE=standalone \
    --p 8848:8848 \
    --p 9848:9848 \
    nacos/nacos-server:v2.2.3

# 持久化模式启动（生产用）
# 使用MySQL存储数据，支持高可用部署
docker run --name nacos-cluster \
    --env MODE=cluster \
    --env JVM_XMS=512m \
    --env JVM_XMX=1024m \
    --env SPRING_DATASOURCE_PLATFORM=mysql \
    --env MYSQL_SERVICE_HOST=localhost \
    --env MYSQL_SERVICE_PORT=3306 \
    --env MYSQL_SERVICE_DB_NAME=nacos \
    --env MYSQL_SERVICE_USER=nacos \
    --env MYSQL_SERVICE_PASSWORD=nacos \
    --p 8848:8848 \
    --p 9848:9848 \
    nacos/nacos-server:v2.3.2
```

**集群模式部署架构：**

```
                            ┌─────────────────────────────────────┐
                            │              Nginx                 │
                            │         (负载均衡入口)              │
                            └─────────────────┬───────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
            │  Nacos Node 1  │◄───────►│  Nacos Node 2  │◄───────►│  Nacos Node 3  │
            │   192.168.1.1  │         │   192.168.1.2  │         │   192.168.1.3  │
            │    :8848       │         │    :8848       │         │    :8848       │
            └───────┬────────┘         └───────┬────────┘         └───────┬────────┘
                    │                           │                           │
                    └───────────────────────────┼───────────────────────────┘
                                                │
                                                ▼
                                        ┌───────────────┐
                                        │    MySQL      │
                                        │  (主从复制)    │
                                        └───────────────┘
```

### 2.3 Spring Cloud集成Nacos

**父pom依赖管理：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
    Spring Cloud 2023.0 (代号 Leyton) 依赖管理
    使用Spring Boot 3.2.x版本
    Bill of Materials (BOM) 方式管理版本，避免依赖冲突
-->
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>microservice-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <name>Microservice Parent</name>
    <description>微服务父工程，统一管理依赖版本</description>

    <!-- Spring Boot 3.2.x 是目前推荐的稳定版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
        <relativePath/>
    </parent>

    <!-- Spring Cloud 2023.0 基于 Spring Boot 3.2 -->
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
        <!-- Alibaba Cloud Spring Boot 3.x 版本 -->
        <spring-cloud-alibaba.version>2022.0.0.0</spring-cloud-alibaba.version>
        <!-- Nacos版本 -->
        <nacos.version>2.3.2</nacos.version>
    </properties>

    <!-- 依赖管理：使用dependencyManagement统一管理版本 -->
    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud 依赖版本管理 -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Spring Cloud Alibaba 依赖版本管理 -->
            <!-- 包含Nacos、Sentinel、Seata等组件 -->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- 公共依赖：所有子模块都需要的 -->
    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot Actuator - 监控端点 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Lombok - 简化代码 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Micrometer - 指标采集（配合Prometheus使用） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
</project>
```

**服务提供者配置：**

```yaml
# 用户服务 application.yml
# 演示Nacos服务注册与发现的完整配置

server:
  port: 8081  # 服务端口

spring:
  application:
    name: user-service  # 服务名，用于注册到Nacos

  # Nacos 配置中心
  cloud:
    nacos:
      # Nacos服务器地址，支持集群多个地址逗号分隔
      server-addr: 127.0.0.1:8848,127.0.0.1:8849,127.0.0.1:8850

      # 服务注册配置
      discovery:
        # 服务实例ID，格式：服务名:IP:Port
        # 支持自定义格式：${spring.application.name}:${random.value}
        instance-id: ${spring.application.name}-${server.port}
        # 是否开启注册（生产环境false用于只订阅配置）
        enabled: true
        # 是否为临时实例
        # true: 不再心跳后会被删除（适合无状态服务）
        # false: 永久实例，不会被删除（适合有状态服务）
        ephemeral: true
        # 元数据，存放额外信息用于路由、灰度等
        metadata:
          version: v1.0              # 版本号
          env: prod                   # 环境
          region:华东                 # 地域
          cluster: default           # 集群
        # 命名空间，用于环境隔离
        # dev/test/staging/prod
        namespace: prod
        # 分组，用于业务线隔离
        group: DEFAULT_GROUP
        # 注册时使用的IP，可以是内网IP或外网IP
        # 多网卡时指定使用哪个网卡
        # network-interface: eth0
        # 优先注册为的IP类型
        # IPv6支持
        # ip: 192.168.1.100

      # 配置中心
      config:
        # 是否启用配置中心
        enabled: true
        # 配置文件后缀
        file-extension: yaml
        # 命名空间
        namespace: prod
        # 分组
        group: DEFAULT_GROUP
        # 共享配置列表，用于多服务共享配置
        shared-configs:
          - data-id: common.yml
            group: SHARED_GROUP
            refresh: true  # 开启动态刷新
        # 配置内容的编码
        encoding: UTF-8
        # 超时时间
        timeout: 3000
        # 最大重试次数
        max-retry: 3

# Spring Boot Actuator 配置
# 用于健康检查和监控
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,nacos-discovery
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}

# 日志配置
logging:
  level:
    com.alibaba.nacos: INFO
    org.springframework.cloud.alibaba: DEBUG
```

**服务消费者Feign配置：**

```java
// 订单服务 - 演示Feign + Nacos + Sentinel的完整集成

import com.alibaba.cloud.sentinel.annotation.SentinelApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.cloud.loadbalancer.annotation.LoadBalancerClient;
import org.springframework.cloud.loadbalancer.core.RandomLoadBalancer;
import org.springframework.cloud.loadbalancer.core.RoundRobinLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ReactorLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import feign.Logger;
import feign.Request;
import feign.Retryer;
import feign.codec.Decoder;
import feign.codec.Encoder;
import feign.gson.GsonDecoder;
import feign.gson.GsonEncoder;

@SpringBootApplication
@EnableDiscoveryClient  // 启用服务发现
@EnableFeignClients      // 启用Feign客户端扫描
@EnableFeignClients(basePackages = "com.example.order.feign")
// 指定Feign客户端接口所在的包
// Spring会扫描这些包下的@FeignClient注解并创建代理实现
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// Feign全局配置类
// 所有Feign客户端都会使用这里的配置
@Configuration
public class FeignConfig {

    // 日志级别配置
    // Feign的日志级别与Spring Boot的不同，需要单独配置
    @Bean
    public Logger.Level feignLoggerLevel() {
        // FULL: 记录请求和响应的所有信息
        // HEADERS: 只记录header
        // BASIC: 只记录请求方法和URL
        // NONE: 不记录
        return Logger.Level.FULL;
    }

    // 超时时间配置
    // 设置连接超时和读取超时，避免请求无限等待
    @Bean
    public Request.Options feignOptions() {
        return new Request.Options(
            5000,   // connectTimeout: 建立连接的超时时间（毫秒）
            10000   // readTimeout: 读取响应超时时间（毫秒）
        );
    }

    // 重试配置
    // 每次重试之间的间隔会递增（backoff）
    @Bean
    public Retryer feignRetryer() {
        // period: 重试间隔（毫秒）
        // maxPeriod: 最大重试间隔
        // maxAttempts: 最大尝试次数
        return new Retryer.Default(100, 1000, 3);
    }

    // JSON编解码器配置
    // 使用Gson进行JSON序列化/反序列化
    @Bean
    public Encoder feignEncoder() {
        return new GsonEncoder();
    }

    @Bean
    public Decoder feignDecoder() {
        return new GsonDecoder();
    }

    // 自定义请求拦截器
    // 场景：在所有请求中添加认证信息
    @Bean
    public feign.RequestInterceptor authenticationInterceptor() {
        return new feign.RequestInterceptor() {
            @Override
            public void apply(feign.RequestTemplate template) {
                // 从ThreadLocal获取当前用户的token
                String token = UserContext.getToken();
                if (token != null) {
                    template.header("Authorization", "Bearer " + token);
                }
                // 添加追踪ID，方便调用链分析
                template.header("X-Trace-Id", TraceIdGenerator.generate());
            }
        };
    }

    // 错误码处理
    @Bean
    public ErrorDecoder feignErrorDecoder() {
        return new ErrorDecoder() {
            @Override
            public Exception decode(String methodKey, Response response) {
                try {
                    // 读取响应体
                    String body = Util.toString(response.body().asReader());
                    // 根据状态码构建异常
                    if (response.status() == 401) {
                        return new UnauthorizedException("认证失败: " + body);
                    } else if (response.status() == 403) {
                        return new ForbiddenException("无权限: " + body);
                    } else if (response.status() == 404) {
                        return new NotFoundException("资源不存在: " + body);
                    } else if (response.status() >= 500) {
                        return new ServiceException("服务内部错误: " + body);
                    }
                } catch (Exception e) {
                    // ignore
                }
                return feign.FeignException.errorStatus(methodKey, response);
            }
        };
    }
}

// Feign客户端接口定义
// 声明式定义对用户服务的HTTP调用
// 只需要定义接口，Feign会自动创建代理实现
@FeignClient(
    name = "user-service",  // 服务名，Nacos会根据此名获取实例列表
    // url = "http://localhost:8081",  // 直接指定URL（用于测试）
    // path = "/api/users",  // 所有方法的路径前缀
    fallback = UserServiceFallback.class,  // 降级处理类
    fallbackFactory = UserServiceFallbackFactory.class,  // 降级工厂
    configuration = FeignConfig.class,  // 使用自定义配置
    primary = true  // 使用primary Bean，冲突时优先
)
public interface UserServiceClient {

    // 路径参数：@PathVariable必须指定value
    @GetMapping("/api/users/{id}")
    // Spring Cloud会通过Nacos发现user-service的实例
    // 然后通过Ribbon进行负载均衡
    // 最后发送HTTP请求获取用户信息
    User getUser(@PathVariable("id") Long id);

    // 查询参数：多个参数使用@RequestParam
    @GetMapping("/api/users")
    PageResult<User> listUsers(
        @RequestParam("page") int page,
        @RequestParam("size") int size,
        @RequestParam(value = "status", required = false) String status
    );

    // 请求体：POST请求
    @PostMapping("/api/users")
    User createUser(@RequestBody CreateUserRequest request);

    // 请求头：@RequestHeader
    @GetMapping("/api/users/{id}/profile")
    UserProfile getProfile(
        @PathVariable("id") Long id,
        @RequestHeader("X-Language") String language
    );

    // 复杂返回值：Map用于接收任意结构
    @GetMapping("/api/users/{id}/extra")
    Map<String, Object> getUserExtra(@PathVariable("id") Long id);

    // 文件上传：使用Spring的MultipartFile
    @PostMapping(value = "/api/users/{id}/avatar", consumes = "multipart/form-data")
    String uploadAvatar(
        @PathVariable("id") Long id,
        @RequestPart("file") MultipartFile file
    );
}

// 降级处理：服务调用失败时的兜底逻辑
@Component
public class UserServiceFallback implements UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceFallback.class);

    @Override
    public User getUser(Long id) {
        // 返回降级数据
        log.warn("获取用户降级，id={}", id);
        return User.builder()
            .id(id)
            .name("降级用户")
            .build();
    }

    @Override
    public PageResult<User> listUsers(int page, int size, String status) {
        return PageResult.empty();
    }

    @Override
    public User createUser(CreateUserRequest request) {
        throw new ServiceUnavailableException("用户服务不可用");
    }

    @Override
    public UserProfile getProfile(Long id, String language) {
        return UserProfile.builder()
            .userId(id)
            .nickname("降级用户")
            .build();
    }

    @Override
    public Map<String, Object> getUserExtra(Long id) {
        return Collections.emptyMap();
    }

    @Override
    public String uploadAvatar(Long id, MultipartFile file) {
        return null;
    }
}

// 降级工厂：可以获取失败原因
@Component
public class UserServiceFallbackFactory implements FallbackFactory<UserServiceFallback> {

    @Override
    public UserServiceFallback create(Throwable cause) {
        log.error("用户服务调用失败", cause);
        UserServiceFallback fallback = new UserServiceFallback();
        // 可以根据失败原因做不同处理
        if (cause instanceof TimeoutException) {
            log.error("调用超时");
        } else if (cause instanceof ServiceUnavailableException) {
            log.error("服务不可用");
        }
        return fallback;
    }
}
```

## 三、Ribbon负载均衡

### 3.1 Ribbon核心概念

**类比：** Ribbon就像餐厅的服务员分配系统。当有10桌客人需要服务时，合理的服务员分配能提高效率、避免疲劳。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ribbon 负载均衡策略                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 负载均衡器 (LoadBalancer)                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│    ┌──────────────────────────┼──────────────────────────┐     │
│    │                          │                          │     │
│    ▼                          ▼                          ▼     │
│  ┌──────┐                  ┌──────┐                  ┌──────┐    │
│  │Round │                  │Weight│                  │Best │    │
│  │Robin │                  │Load  │                  │Avail│    │
│  │      │                  │Balanc│                  │Load │    │
│  │轮询  │                  │加权轮│                  │最小 │    │
│  │      │                  │询  │                  │连接 │    │
│  └──────┘                  └──────┘                  └──────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    可用实例列表                                ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ Instance:192.168.1.101:8081  Weight:5 Healthy:true   │   ││
│  │  │ Instance:192.168.1.102:8081  Weight:3 Healthy:true   │   ││
│  │  │ Instance:192.168.1.103:8081  Weight:2 Healthy:false  │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Ribbon负载均衡策略

| 策略 | 类 | 说明 | 适用场景 |
|------|-----|------|----------|
| **轮询** | RoundRobinRule | 依次分配给每个实例 | 默认策略，适合实例性能一致 |
| **随机** | RandomRule | 随机选择一个实例 | 适合实例性能差异不大 |
| **加权响应时间** | WeightedResponseTimeRule | 响应时间越短权重越高 | 适合实例性能不一致 |
| **最少连接** | BestAvailableRule | 选择连接数最少的 | 适合长连接场景 |
| **重试** | RetryRule | 轮询+重试机制 | 适合短暂故障恢复 |
| **可用性过滤** | AvailabilityFilteringRule | 过滤掉故障实例 | 适合有故障实例的场景 |
| **Zone感知** | ZoneAvoidanceRule | 优先选择同区域的实例 | 适合多区域部署 |

### 3.3 自定义负载均衡策略

```java
// 自定义负载均衡策略 - 基于权重的灰度发布
// 根据请求头中的版本号选择对应版本的服务实例

import com.netflix.client.config.IClientConfig;
import com.netflix.loadbalancer.AbstractLoadBalancerRule;
import com.netflix.loadbalancer.ILoadBalancer;
import com.netflix.loadbalancer.Server;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.netflix.ribbon.ServerInstanceInfo;
import org.springframework.stereotype.Component;

import java.util.List;

// 灰度负载均衡策略
// 场景：新版本服务上线时，先将少量流量引导到新版本
// 根据请求中的X-Version头匹配服务实例的版本标签
public class GrayLoadBalancerRule extends AbstractLoadBalancerRule {

    // 版本权重配置
    // 生产环境应该从配置中心动态获取
    private static final Map<String, Integer> VERSION_WEIGHTS = new HashMap<>();

    static {
        // 默认权重配置：v1=80%, v2=20%
        VERSION_WEIGHTS.put("v1", 80);
        VERSION_WEIGHTS.put("v2", 20);
    }

    @Override
    public void initWithNiwsConfig(IClientConfig clientConfig) {
        // 初始化配置
        // 可以从配置中读取权重设置
    }

    @Override
    public Server choose(Object key) {
        // key通常是请求对象，可以从中提取信息
        ILoadBalancer loadBalancer = getLoadBalancer();
        if (loadBalancer == null) {
            return null;
        }

        // 获取所有可用的服务器实例
        List<Server> servers = loadBalancer.getReachableServers();
        if (servers.isEmpty()) {
            return null;
        }

        // 获取请求上下文中的版本信息
        String targetVersion = getTargetVersion(key);

        // 筛选目标版本的实例
        List<Server> targetServers = servers.stream()
            .filter(s -> isVersionMatch(s, targetVersion))
            .collect(Collectors.toList());

        // 如果没有匹配版本，回退到所有实例
        if (targetServers.isEmpty()) {
            targetServers = servers;
        }

        // 使用加权随机算法选择实例
        return weightedRandomSelect(targetServers);
    }

    private String getTargetVersion(Object key) {
        // 从请求中提取版本信息
        // 实际实现可能需要从ThreadLocal或请求上下文获取
        if (key instanceof Request) {
            Request request = (Request) key;
            return request.getHeaders().getFirst("X-Version");
        }
        return null;
    }

    private boolean isVersionMatch(Server server, String targetVersion) {
        if (targetVersion == null) {
            return true;  // 没有指定版本，匹配所有
        }

        // 从服务实例的元数据中获取版本
        ServerInstanceInfo info = server.getInstanceInfo();
        if (info != null) {
            String serverVersion = info.getMetadata().get("version");
            return targetVersion.equals(serverVersion);
        }
        return true;
    }

    private Server weightedRandomSelect(List<Server> servers) {
        // 构建权重区间
        // 例如：[v1,v1,v1,v1,v1,v1,v1,v1,v2,v2] 代表 80%:20%
        List<Server> weightedList = new ArrayList<>();
        for (Server server : servers) {
            String version = server.getInstanceInfo().getMetadata().get("version");
            int weight = VERSION_WEIGHTS.getOrDefault(version, 50);
            for (int i = 0; i < weight; i++) {
                weightedList.add(server);
            }
        }
        // 随机选择
        int index = ThreadLocalRandom.current().nextInt(weightedList.size());
        return weightedList.get(index);
    }
}

// 使用@Configuration + @Primary覆盖默认策略
@Configuration
public class RibbonConfig {

    @Bean
    public IRule ribbonRule() {
        // 使用我们自定义的灰度策略
        return new GrayLoadBalancerRule();
    }

    // 全局限制：设置所有服务的负载均衡策略
    // @Bean
    // public ILoadBalancer feignLoadBalancer(IClientConfig config) {
    //     return new GrayLoadBalancerRule();
    // }
}

// Spring Cloud LoadBalancer 配置（新版，推荐）
// Spring Cloud 2020.x开始推荐使用Spring Cloud LoadBalancer替代Ribbon
@Configuration
public class CustomLoadBalancerConfig {

    @Bean
    public ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(
            ServiceInstanceListSupplier supplier) {
        // 随机策略
        return new RandomLoadBalancer(supplier);
    }

    // 注解方式指定服务使用特定策略
    // @LoadBalancerClient(name = "user-service", configuration = CustomLoadBalancerConfig.class)
}
```

## 四、Feign声明式HTTP客户端

### 4.1 Feign高级特性

**请求/响应拦截器：**

```java
// 全局拦截器 - 所有Feign请求都会经过
@Component
public class GlobalFeignInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        // 添加通用请求头
        template.header("X-Application-Name", "order-service");
        template.header("X-Request-Time", String.valueOf(System.currentTimeMillis()));

        // 传递用户上下文
        SecurityContext context = SecurityContextHolder.getContext();
        if (context.getUser() != null) {
            template.header("X-User-Id", String.valueOf(context.getUser().getId()));
            template.header("X-Tenant-Id", context.getUser().getTenantId());
        }

        // 请求签名（用于接口安全）
        signRequest(template);
    }

    private void signRequest(RequestTemplate template) {
        // 生成请求签名
        // 1. 排序所有header（除signature外）
        // 2. 拼接为字符串
        // 3. 使用密钥加密生成签名
        // 4. 添加到X-Signature header
    }
}

// 日志拦截器 - 记录请求和响应详情
@Component
public class FeignLoggingInterceptor extends feign.Logger {

    @Override
    protected void logRequest(String configKey, Level logLevel, Request request) {
        // 记录请求信息
        System.out.println("==> Feign Request: " + configKey);
        System.out.println("    Method: " + request.httpMethod());
        System.out.println("    URL: " + request.url());
        System.out.println("    Headers: " + request.headers());
        if (logLevel == Level.FULL && request.body() != null) {
            System.out.println("    Body: " + new String(request.body()));
        }
    }

    @Override
    protected <T> void logRetry(String configKey, Level logLevel, RetryableException e) {
        // 记录重试信息
        System.out.println("<== Feign Retry: " + configKey);
        System.out.println("    Retry after: " + e.getRetryAfter() + "ms");
    }

    @Override
    protected void logAndRebufferResponse(
            String configKey, Level logLevel,
            Response response, byte[] responseBody) throws IOException {
        // 记录响应信息
        System.out.println("<== Feign Response: " + configKey);
        System.out.println("    Status: " + response.status());
        System.out.println("    Headers: " + response.headers());
        if (logLevel == Level.FULL && responseBody != null) {
            System.out.println("    Body: " + new String(responseBody));
        }
    }
}
```

**文件上传下载：**

```java
// 文件服务Feign客户端
@FeignClient(name = "file-service")
public interface FileServiceClient {

    // 文件上传 - 使用multipart/form-data
    // Spring Cloud Feign支持对multipart的封装
    @PostMapping(value = "/api/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FileUploadResponse upload(@RequestPart("file") MultipartFile file);

    // 批量上传
    @PostMapping(value = "/api/files/batch-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    List<FileUploadResponse> batchUpload(@RequestPart("files") List<MultipartFile> files);

    // 文件下载 - 返回byte[]
    @GetMapping("/api/files/{fileId}/download")
    byte[] download(@PathVariable("fileId") String fileId);

    // 流式下载 - 使用Response
    // 适合大文件下载，避免内存溢出
    @GetMapping("/api/files/{fileId}/stream")
    Response<Resource> streamDownload(@PathVariable("fileId") String fileId);

    // 带进度回调的下载
    @GetMapping("/api/files/{fileId}/download-progress")
    Response<Resource> downloadWithProgress(
        @PathVariable("fileId") String fileId,
        @RequestHeader("Range") String range  // 支持断点续传
    );
}
```

### 4.2 Feign与Sentinel集成

```java
// Feign + Sentinel 集成配置

@Configuration
public class FeignSentinelConfig {

    @Bean
    @Scope("prototype")
    public Feign.Builder sentinelFeignBuilder() {
        // 使用Sentinel拦截Feign调用，实现熔断降级
        return SentinelFeign.builder()
            // 失败解码器 - 定义如何处理降级
            .decoder(new SentinelDecoder())
            // 降级工厂
            .fallbackFactory(new SentinelFallbackFactory())
            // 请求拦截器 - 可以在这里添加Sentinel资源标记
            .requestInterceptor(new SentinelRequestInterceptor());
    }
}

// Sentinel请求拦截器 - 为Feign调用添加资源标记
public class SentinelRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        // 资源名格式：HTTP_METHOD:service:path
        String resourceName = template.method() + ":" +
            template.feignTarget().name() + ":" +
            template.path();
        template.attr("Sentinel.resource", resourceName);
    }
}

// 自定义Sentinel降级处理
public class SentinelFallbackFactory implements FallbackFactory {

    @Override
    public Fallback create(Throwable cause) {
        return new Fallback() {
            @Override
            public User getUser(Long id) {
                // 限流降级
                if (cause instanceof FlowException) {
                    return getDefaultUser(id);
                }
                // 熔断降级
                if (cause instanceof DegradeException) {
                    return getCachedUser(id);
                }
                // 超时降级
                return getGuestUser(id);
            }

            private User getDefaultUser(Long id) {
                return User.builder()
                    .id(id)
                    .name("[限流]请稍后再试")
                    .build();
            }

            private User getCachedUser(Long id) {
                // 从本地缓存获取
                return localCache.get(id);
            }

            private User getGuestUser(Long id) {
                return User.builder()
                    .id(id)
                    .name("游客用户")
                    .build();
            }
        };
    }
}
```

## 五、Sentinel流量控制

### 5.1 Sentinel核心概念

**类比：** Sentinel就像交通枢纽的智能信号灯系统。它实时监控着每个路口（资源）的车流量（QPS），当某条路过于拥堵时，自动调节信号灯（限流），当某条路发生事故完全瘫痪时，禁止车辆驶入并引导绕行（熔断）。

```
┌─────────────────────────────────────────────────────────────────┐
│                     Sentinel 工作流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    请求     ┌─────────────┐                        │
│  │  客户端  │ ────────► │   Sentinel   │                        │
│  └─────────┘            │    拦截      │                        │
│                         └──────┬──────┘                        │
│                                │                               │
│         ┌──────────────────────┼──────────────────────┐        │
│         │                      │                      │        │
│         ▼                      ▼                      ▼        │
│   ┌───────────┐          ┌───────────┐         ┌───────────┐  │
│   │ 统计请求  │          │  检查规则  │         │ 执行限流  │  │
│   │  计算RT   │          │  熔断规则  │         │  降级处理  │  │
│   └─────┬─────┘          └─────┬─────┘         └─────┬─────┘  │
│         │                      │                      │        │
│         ▼                      ▼                      ▼        │
│   ┌───────────┐          ┌───────────┐         ┌───────────┐  │
│   │  滑动窗口 │          │  状态机    │         │ BlockEx   │  │
│   │  计数器   │          │  熔断器    │         │  异常处理  │  │
│   └───────────┘          └───────────┘         └───────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Sentinel规则类型

| 规则类型 | 说明 | 作用 |
|----------|------|------|
| **流量控制** | 控制实时请求速率 | 保护系统不过载 |
| **熔断降级** | 异常比例/响应时间触发熔断 | 防止故障扩散 |
| **热点参数限流** | 对特定参数值限流 | 防护恶意刷接口 |
| **系统自适应** | 根据系统负载自适应限流 | 系统级保护 |
| **授权规则** | 黑白名单控制 | 访问控制 |

### 5.3 Sentinel实战配置

**Spring Boot集成Sentinel：**

```yaml
# application.yml - Sentinel配置
spring:
  cloud:
    sentinel:
      # Sentinel控制台地址
      # 生产环境应该配置高可用的Sentinel集群
      dashboard: 127.0.0.1:8080

      # 关闭Sentinel控制台，false表示使用dashboard进行控制
      enabled: true

      # 增量配置：首次加载的规则配置
      # 当控制台没有规则时使用这里的配置
      scg:
        fallback:
          # 路由熔断后的响应
          # 可以是redirect（重定向）或response（返回固定响应）
          mode: response
          # 重定向URL或响应内容
          url: /default/fallback
          # 响应体（当mode为response时）
          body: '{"code":429,"message":"请求过于频繁，请稍后再试"}'

      # 日志配置
      log:
        # 日志文件位置
        dir: /var/log/sentinel
        # 日志级别
        level: info

      # Eager Initialization：启动时即初始化Sentinel
      # false表示首次调用时才初始化（懒加载）
      eager: false

      # 传输层配置：控制台和SDK之间的通信方式
      # 支持HTTP和Netty两种方式
      transport:
        # HTTP方式的心跳端口
        port: 8719
        # 控制台地址
        dashboard: 127.0.0.1:8080
        # 心跳间隔（毫秒）
        heartbeat-interval-ms: 5000

# Actuator端点暴露
management:
  endpoints:
    web:
      exposure:
        include: '*'
  endpoint:
    health:
      show-details: always
```

**Java代码定义规则：**

```java
// Sentinel规则配置类
// 演示如何通过代码方式配置Sentinel规则
// 实际项目中通常使用控制台或Nacos配置

import com.alibaba.csp.sentinel.SphU;
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockHandler;
import com.alibaba.csp.sentinel.slots.block.Rule;
import com.alibaba.csp.sentinel.slots.block.RuleConstant;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRule;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRuleManager;
import com.alibaba.csp.sentinel.slots.system.SystemRule;
import com.alibaba.csp.sentinel.slots.system.SystemRuleManager;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class SentinelRuleConfig {

    // 资源名定义
    // 资源是Sentinel控制请求量的单位
    private static final String USER_SERVICE = "user-service";
    private static final String ORDER_SERVICE = "order-service";
    private static final String GET_USER_RESOURCE = "getUser";
    private static final String CREATE_ORDER_RESOURCE = "createOrder";

    // Spring Bean初始化后配置规则
    @PostConstruct
    public void initRules() {
        // 初始化流控规则
        initFlowRules();
        // 初始化熔断规则
        initDegradeRules();
        // 初始化热点参数规则
        initParamFlowRules();
        // 初始化系统规则
        initSystemRules();
    }

    // 流控规则配置
    // 流控的目的是保护系统不被瞬时高峰冲垮
    private void initFlowRules() {
        // 创建流控规则列表
        List<FlowRule> rules = Arrays.asList(
            // 用户服务流控规则
            // 限制user-service资源的QPS为100
            // 当QPS超过100时，新的请求会被拒绝
            createFlowRule(USER_SERVICE, 100, FlowGrade.QPS),

            // 订单创建流控规则
            // 限制为每秒10次，热点参数限流
            createFlowRule(CREATE_ORDER_RESOURCE, 10, FlowGrade.QPS),

            // 获取用户信息流控规则
            // 限制为每秒1000次
            createFlowRule(GET_USER_RESOURCE, 1000, FlowGrade.QPS),

            // 线程数限流 - 限制并发执行线程数为50
            // 这种方式更适合处理慢查询场景
            // 因为它统计的是正在执行的线程数，而不是请求数
            createFlowRule(USER_SERVICE, 50, FlowGrade.THREAD)
        );

        // 加载规则到Sentinel
        FlowRuleManager.loadRules(rules);
    }

    // 创建流控规则
    private FlowRule createFlowRule(String resource, int count, FlowGrade grade) {
        FlowRule rule = new FlowRule();
        // 资源名 - 限流作用的资源对象
        rule.setResource(resource);
        // 限流阈值 - 超过这个阈值就会触发限流
        rule.setCount(count);
        // 限流阈值类型
        // QPS: 每秒请求数
        // THREAD: 并发线程数
        rule.setGrade(grade.getValue());
        // 流控模式
        // DIRECT: 直接限流（请求打在资源上就限流）
        // RELATED: 关联限流（关联资源超限时限流本资源）
        // IMPORTED: 链路限流（只统计指定入口的流量）
        rule.setStrategy(FlowStrategy.DIRECT.getValue());
        // 流控效果
        // REJECT: 拒绝请求（默认，快速失败）
        // THROWING: 抛出BlockException
        // PASSED: 匀速排队（让请求匀速通过）
        rule.setControlBehavior(FlowControlBehavior.REJECT.getValue());
        // 排队等待超时时间（当使用匀速排队时）
        rule.setMaxQueueingTimeMs(500);
        // 关联资源名（当流控模式为RELATED时）
        // rule.setRefResource("关联资源");
        return rule;
    }

    // 熔断降级规则配置
    // 熔断的目的是防止级联故障，避免故障扩散
    private void initDegradeRules() {
        List<DegradeRule> rules = Arrays.asList(
            // 慢调用比例熔断规则
            // 当资源的平均响应时间超过阈值时触发熔断
            // 熔断后的一段时间内，所有请求都会被直接拒绝
            // 熔断结束后，会放行一个请求试探，如果成功则恢复正常，否则继续熔断
            createSlowRatioDegradeRule(ORDER_SERVICE, 1000, 0.5, 10, 60),

            // 异常比例熔断规则
            // 当资源的异常比例超过阈值时触发熔断
            // 例如：异常比例0.3表示30%的请求异常
            createExceptionRatioDegradeRule(USER_SERVICE, 0.3, 5, 60),

            // 异常数熔断规则
            // 当资源的异常数量超过阈值时触发熔断
            createExceptionCountDegradeRule("file-upload", 100, 60)
        );

        DegradeRuleManager.loadRules(rules);
    }

    // 慢调用比例熔断规则
    private DegradeRule createSlowRatioDegradeRule(
            String resource,
            long maxRt,        // 最大响应时间（毫秒），超过此时间视为慢调用
            double ratio,      // 慢调用比例阈值
            int minRequestCount, // 最小请求数，只有达到这个请求数后才进行熔断判断
            int statIntervalMs   // 统计时间窗口（秒）
    ) {
        DegradeRule rule = new DegradeRule();
        rule.setResource(resource);
        // 熔断策略
        // SLOW_REQUEST_RATIO: 慢调用比例
        // ERROR_RATIO: 异常比例
        // ERROR_COUNT: 异常数量
        rule.setGrade(CircuitBreakerGrade.SLOW_REQUEST_RATIO.getValue());
        // 慢调用最大响应时间
        rule.setCount(maxRt);
        // 最小请求数
        rule.setMinRequestAmount(minRequestCount);
        // 统计时间窗口
        rule.setStatIntervalMs(statIntervalMs * 1000);
        // 熔断持续时间（秒）
        // 熔断开启后，经过这段时间后进入半开状态
        rule.setTimeWindow(10);
        // 慢调用比例阈值
        // 当慢调用比例达到这个值时触发熔断
        rule.setSlowRatioThreshold(ratio);
        return rule;
    }

    // 异常比例熔断规则
    private DegradeRule createExceptionRatioDegradeRule(
            String resource,
            double ratio,
            int minRequestCount,
            int timeWindow
    ) {
        DegradeRule rule = new DegradeRule();
        rule.setResource(resource);
        rule.setGrade(CircuitBreakerGrade.ERROR_RATIO.getValue());
        rule.setCount(ratio);        // 异常比例
        rule.setMinRequestAmount(minRequestCount);
        rule.setTimeWindow(timeWindow);
        return rule;
    }

    // 热点参数限流规则
    // 热点是指访问频率非常高的数据
    // 例如：商品详情页的商品ID，热门商品的ID
    private void initParamFlowRules() {
        // 获取商品详情的参数索引
        // 假设第一个参数是商品ID
        ParamFlowRule rule = new ParamFlowRule("getItem")
            // 参数索引，0表示第一个参数
            .setParamIdx(0)
            // 参数值限流阈值
            // 只有指定的参数值才会限流
            .setParamFlowItemList(Arrays.asList(
                // 热门商品ID限流：每秒100次
                new ParamFlowItem().setObject("10001").setCount(100),
                new ParamFlowItem().setObject("10002").setCount(100),
                // 其他商品ID限流：每秒1000次
                new ParamFlowItem().setObject("default").setCount(1000)
            ))
            // 全局阈值
            .setCount(5000)
            // 参数类型
            .setClassType(String.class);

        ParamFlowRuleManager.loadRules(Collections.singletonList(rule));
    }

    // 系统自适应规则
    // 系统级保护，根据系统负载自动调节入口流量
    private void initSystemRules() {
        List<SystemRule> rules = Arrays.asList(
            // CPU使用率超过80%时开启限流
            createSystemRule(SystemGrade.CPU_LOAD, 0.8),
            // 入口QPS超过2000时开启限流
            createSystemRule(SystemGrade.QPS, 2000.0),
            // 并发线程数超过100时开启限流
            createSystemRule(SystemGrade.THREAD, 100)
        );

        SystemRuleManager.loadRules(rules);
    }

    private SystemRule createSystemRule(SystemGrade grade, double threshold) {
        SystemRule rule = new SystemRule();
        rule.setGrade(grade.getValue());
        rule.setAvgLoad(threshold);
        rule.setHighestSystemLoad(threshold);
        rule.setQps(threshold);
        rule.setThread(threshold);
        return rule;
    }

    // 使用@SentinelResource注解定义资源
    // 这种方式比SphU编程式调用更简洁
    @Service
    public class OrderServiceImpl {

        // 定义资源并指定降级处理方法
        @SentinelResource(
            value = "createOrder",                    // 资源名
            blockHandler = "createOrderBlockHandler",  // 限流/熔断时的处理方法
            blockHandlerClass = OrderBlockHandler.class,
            fallback = "createOrderFallback",         // 调用异常时的处理方法
            fallbackClass = OrderFallback.class,
            exceptionsToIgnore = {BusinessException.class}  // 忽略的异常，不触发fallback
        )
        public Order createOrder(CreateOrderRequest request) {
            // 业务逻辑
            return orderRepository.save(request);
        }
    }

    // 限流/熔断处理类
    public static class OrderBlockHandler {

        // 必须是public static方法
        // 参数必须包含BlockException
        // 返回类型必须与原方法一致
        public static Order createOrderBlockHandler(
                CreateOrderRequest request,
                BlockException ex) {
            // 限流时返回友好提示
            return Order.builder()
                .code("LIMITED")
                .message("系统繁忙，请稍后再试")
                .build();
        }
    }

    // Fallback处理类
    public static class OrderFallback {

        public static Order createOrderFallback(
                CreateOrderRequest request,
                Throwable throwable) {
            // 记录异常
            log.error("创建订单失败", throwable);
            // 返回降级订单
            return Order.builder()
                .code("FALLBACK")
                .message("服务降级，请稍后再试")
                .build();
        }
    }
}
```

## 六、Hystrix熔断器

### 6.1 Hystrix工作原理

**类比：** Hystrix就像电路中的保险丝。当电流过大（请求过多）时，保险丝会熔断，切断电路，保护电器不被烧坏。等故障排除后，再重新接通。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hystrix 熔断器状态机                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│        ┌──────────────────────────────────────────┐              │
│        │              CLOSED（关闭）               │              │
│        │                                          │              │
│        │   正常请求 ──► 执行成功 ──► 计数器+1       │              │
│        │        │                                │              │
│        │        │ 失败/超时                       │              │
│        │        ▼                                │              │
│        │   失败计数器+1                           │              │
│        │        │                                │              │
│        │        ▼                                │              │
│        │   失败数 > 阈值? ──► 否 ──► 保持关闭      │              │
│        │        │                                │              │
│        │        │ 是                             │              │
│        │        ▼                                │              │
│        └──────────────────────────────────────────┘              │
│                         │ OPEN                                  │
│                         │ 熔断                                  │
│                         ▼                                       │
│        ┌──────────────────────────────────────────┐              │
│        │              OPEN（打开）                 │              │
│        │                                          │              │
│        │   所有请求直接降级，不执行实际逻辑         │              │
│        │                                          │              │
│        │   熔断时间 > timeWindow? ──► 半开         │              │
│        │        │                                │              │
│        │        │ 是                             │              │
│        │        ▼                                │              │
│        └──────────────────────────────────────────┘              │
│                         │                                        │
│                         │ 放行一个试探请求                         │
│                         ▼                                        │
│        ┌──────────────────────────────────────────┐              │
│        │           HALF_OPEN（半开）              │              │
│        │                                          │              │
│        │   试探请求成功 ──► 关闭                   │              │
│        │        │                                │              │
│        │        │ 失败                           │              │
│        │        ▼                                │              │
│        └──────────────────────────────────────────┘              │
│                         │                                        │
│                         │ 重新熔断                                │
│                         ▼                                        │
│                      (OPEN)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Spring Cloud Hystrix配置

**注意：** Hystrix已停止维护，Spring Cloud 2020.x已移除Hystrix支持。生产环境推荐使用Resilience4j或Sentinel。

```java
// Hystrix配置（仅供学习参考，生产环境请使用Resilience4j）

/*
 * Hystrix配置类
 * 包含超时配置、线程池配置、熔断器配置等
 */
@Configuration
public class HystrixConfig {

    // 全局默认超时时间
    // 如果在Feign客户端配置了超时，以Feign配置为准
    @Bean
    public HystrixCommandAspect hystrixCommandAspect() {
        HystrixCommandAspect aspect = new HystrixCommandAspect();
        // 配置超时时间（毫秒）
        // 默认1000ms
        return aspect;
    }

    // Hystrix超时时间配置
    // 设置为比实际业务超时时间稍长
    // 避免误判
    @ConfigurationProperties(prefix = "hystrix")
    @Bean
    public HystrixProperties hysProperties() {
        return new HystrixProperties();
    }
}

// Feign客户端使用Hystrix
@Configuration
@EnableCircuitBreaker  // 启用Hystrix
class FeignHystrixConfig {

    @Bean
    public HystrixFeignTarget<UserServiceClient> userServiceHystrix() {
        return HystrixFeign.builder()
            // 设置超时时间
            .setClientFactory(...) // 省略
            .build();
    }
}

// HystrixCommand使用示例
@Service
public class UserService {

    // 使用@HystrixCommand注解定义熔断逻辑
    // fallbackMethod指定降级处理方法
    @HystrixCommand(
        fallbackMethod = "getUserFallback",
        commandProperties = {
            // 熔断器开启阈值：10秒内至少20个请求
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "20"),
            // 熔断器开启时间窗口：10秒
            @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "10000"),
            // 失败率阈值：50%
            @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50"),
            // 强制开启熔断器
            @HystrixProperty(name = "circuitBreaker.forceOpen", value = "false"),
            // 强制关闭熔断器
            @HystrixProperty(name = "circuitBreaker.forceClosed", value = "false"),
            // 是否开启超时
            @HystrixProperty(name = "execution.timeout.enabled", value = "true"),
            // 超时时间
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")
        },
        threadPoolProperties = {
            // 线程池大小
            @HystrixProperty(name = "coreSize", value = "10"),
            // 线程池最大大小
            @HystrixProperty(name = "maxQueueSize", value = "100"),
            // 队列拒绝阈值
            @HystrixProperty(name = "queueSizeRejectionThreshold", value = "80"),
            // 线程存活时间
            @HystrixProperty(name = "keepAliveTimeMinutes", value = "1"),
            // 统计窗口大小
            @HystrixProperty(name = "metrics.rollingStats.timeInMilliseconds", value = "10000"),
            // 统计窗口内最小请求数
            @HystrixProperty(name = "metrics.rollingStats.numBuckets", value = "10")
        }
    )
    public User getUser(Long id) {
        return userClient.getUser(id);
    }

    // 降级处理方法
    // 参数必须与原方法一致，并添加Throwable参数接收异常
    public User getUserFallback(Long id, Throwable e) {
        // 记录异常日志
        log.error("获取用户失败，id={}", id, e);
        // 返回降级数据
        return User.builder()
            .id(id)
            .name("降级用户")
            .build();
    }
}
```

## 七、综合实战案例

### 7.1 订单服务完整实现

```java
// 订单服务完整实现
// 集成Nacos、Ribbon、Feign、Sentinel

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableAsync
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}

// 订单服务配置
@Configuration
@RefreshScope
class OrderConfiguration {

    @Value("${order.timeout:5000}")
    private int orderTimeout;

    @Bean
    public OrderProperties orderProperties() {
        OrderProperties props = new OrderProperties();
        props.setTimeout(orderTimeout);
        return props;
    }
}

// 订单服务接口
@FeignClient(
    name = "order-service",
    fallback = OrderServiceFallback.class,
    configuration = {FeignConfig.class, SentinelConfig.class}
)
interface OrderServiceClient {

    @PostMapping("/api/orders")
    @SentinelResource(value = "createOrder",
        blockHandler = "createOrderBlockHandler",
        fallback = "createOrderFallback")
    Order createOrder(@RequestBody CreateOrderRequest request);

    @GetMapping("/api/orders/{id}")
    Order getOrder(@PathVariable("id") Long id);

    @PutMapping("/api/orders/{id}/cancel")
    @SentinelResource(value = "cancelOrder",
        blockHandler = "cancelOrderBlockHandler")
    Order cancelOrder(@PathVariable("id") Long id);
}

// 订单控制器
@RestController
@RequestMapping("/api/orders")
class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderServiceClient orderClient;  // 远程调用

    @PostMapping
    @SentinelResource(value = "createOrder",
        blockHandler = "createOrderBlockHandler")
    public Result<Order> create(@RequestBody CreateOrderRequest request) {
        // 业务校验
        validateRequest(request);

        // 获取用户信息（远程调用）
        User user = orderClient.getUser(request.getUserId());

        // 创建订单
        Order order = orderService.createOrder(user, request);

        return Result.success(order);
    }

    @GetMapping("/{id}")
    public Result<Order> get(@PathVariable Long id) {
        Order order = orderService.getOrder(id);
        return Result.success(order);
    }

    @PutMapping("/{id}/pay")
    @SentinelResource(value = "payOrder")
    public Result<Order> pay(@PathVariable Long id, @RequestParam String paymentMethod) {
        // 远程调用支付服务
        PaymentResult payment = paymentClient.pay(id, paymentMethod);

        // 更新订单状态
        Order order = orderService.updatePaymentStatus(id, payment);

        return Result.success(order);
    }

    // 限流处理
    public Result<Order> createOrderBlockHandler(
            CreateOrderRequest request,
            BlockException ex) {
        return Result.error("系统繁忙，请稍后再试");
    }

    // 降级处理
    public Result<Order> createOrderFallback(
            CreateOrderRequest request,
            Throwable ex) {
        log.error("创建订单失败", ex);
        return Result.error("服务暂时不可用");
    }
}

// 订单服务实现
@Service
class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductServiceClient productClient;

    @Autowired
    private InventoryServiceClient inventoryClient;

    @Transactional
    public Order createOrder(User user, CreateOrderRequest request) {
        // 校验商品库存（远程调用）
        Inventory inventory = inventoryClient.check(request.getProductId(), request.getQuantity());
        if (!inventory.isAvailable()) {
            throw new BusinessException("商品库存不足");
        }

        // 锁定库存（远程调用，可能触发熔断）
        boolean locked = inventoryClient.lock(request.getProductId(), request.getQuantity());
        if (!locked) {
            throw new BusinessException("库存锁定失败");
        }

        // 计算价格
        BigDecimal price = productClient.getPrice(request.getProductId());
        BigDecimal totalAmount = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        // 创建订单
        Order order = Order.builder()
            .userId(user.getId())
            .productId(request.getProductId())
            .quantity(request.getQuantity())
            .price(price)
            .totalAmount(totalAmount)
            .status(OrderStatus.CREATED)
            .build();

        return orderRepository.save(order);
    }

    public Order getOrder(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("订单不存在"));
    }

    @Transactional
    public Order updatePaymentStatus(Long id, PaymentResult payment) {
        Order order = getOrder(id);
        order.setPaymentStatus(payment.getStatus());
        order.setPaymentId(payment.getPaymentId());
        return orderRepository.save(order);
    }
}

// Sentinel降级处理
class OrderBlockHandler {

    public static Result<Order> createOrderBlockHandler(
            CreateOrderRequest request,
            BlockException ex) {
        // 限流降级
        if (ex instanceof FlowException) {
            return Result.error("请求过于频繁，请稍后重试");
        }
        // 熔断降级
        if (ex instanceof DegradeException) {
            return Result.error("服务暂时不可用，请稍后重试");
        }
        // 热点参数降级
        if (ex instanceof ParamFlowException) {
            return Result.error("操作过于频繁，请稍后重试");
        }
        return Result.error("系统繁忙");
    }

    public static Result<Order> cancelOrderBlockHandler(
            Long id,
            BlockException ex) {
        return Result.error("取消订单失败，请稍后重试");
    }
}
```

## 八、踩坑经验总结

### 8.1 常见配置错误

**坑1：Feign超时时间设置过短**

```
❌ 错误配置：
feign.client.config.default.connectTimeout=1000
feign.client.config.default.readTimeout=1000

问题：业务逻辑耗时超过1秒时，会误判为超时

✅ 正确配置：
# 根据业务实际耗时设置超时
feign.client.config.default.connectTimeout=5000
feign.client.config.default.readTimeout=10000
```

**坑2：Sentinel规则未生效**

```
❌ 错误：直接在Nacos配置，但Sentinel未拉取

原因：Sentinel需要额外依赖spring-cloud-alibaba-sentinel-data-nacos

✅ 解决：
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-alibaba-sentinel-data-nacos</artifactId>
</dependency>
```

**坑3：Nacos注册的服务名大小写问题**

```
问题：Windows下服务名大小写可能不一致

✅ 解决：
# 保持服务名全小写
spring.application.name=user-service

# 或者配置Nacos忽略大小写
spring.cloud.nacos.discovery.cluster-reade-to-strategy=AllAvailable
```

### 8.2 性能优化建议

1. **合理设置超时时间**
   - 连接超时：略高于网络RTT
   - 读取超时：略高于业务平均耗时 + 网络RTT

2. **启用连接池**
   - HTTP/2连接复用
   - 合理设置连接池大小

3. **使用异步调用**
   - CompletableFuture替代同步调用
   - @Async注解启用异步

4. **缓存热点数据**
   - 本地缓存+分布式缓存
   - 控制缓存大小和TTL

5. **批量接口优先**
   - 一次请求获取多个数据
   - 减少网络开销

---

*文档版本：v1.0*
*更新日期：2024年*
*适用技术栈：Spring Cloud 2023.0 / Spring Boot 3.2.x / Java 17+ / Nacos 2.3.x / Sentinel 1.8.x*
