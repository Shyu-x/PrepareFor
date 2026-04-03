# Spring Boot企业级开发完全指南

> 本文将带你深入理解Spring Boot的核心技术，包括IoC/DI容器、AOP原理、事务管理、自动配置机制、starter原理、监控actuator等。通过大量生活类比和源码解析，让你成为Spring Boot开发高手。

---

## 一、Spring Boot概述

### 1.1 为什么需要Spring Boot？

想象一下，**传统Spring开发就像自己开餐厅**：需要自己搭建厨房（配置Tomcat）、购买厨具（配置各种框架）、聘请厨师（编写业务代码）。而**Spring Boot就像去美食城租摊位**：厨房、厨具都给你准备好了，直接做菜就行。

```
┌────────────────────────────────────────────────────────────────────┐
│                        Spring Boot vs 传统Spring                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  传统Spring开发：                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  web.xml 配置 DispatcherServlet                            │  │
│  │  applicationContext.xml 配置 Bean                         │  │
│  │  配置数据源 DataSource                                     │  │
│  │  配置事务管理器 TransactionManager                         │  │
│  │  配置视图解析器 ViewResolver                               │  │
│  │  配置过滤器 Filter                                          │  │
│  │  配置监听器 Listener                                        │  │
│  │  ...（各种XML配置）                                         │  │
│  │                                                             │  │
│  │  实际业务代码可能只占20%，配置占了80%！                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Spring Boot开发：                                                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  pom.xml 引入 starter                                      │  │
│  │  application.yml 几行配置                                   │  │
│  │  @SpringBootApplication                                    │  │
│  │  public static void main(String[] args) {                  │  │
│  │      SpringApplication.run(MyApp.class, args);             │  │
│  │  }                                                         │  │
│  │                                                             │  │
│  │  业务代码：@RestController @Service @Repository             │  │
│  │                                                             │  │
│  │  配置几乎为0，开箱即用！                                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Spring Boot核心优势

```java
/**
 * Spring Boot核心优势总结
 */
public class SpringBootAdvantages {

    /**
     * 优势一：自动配置（Auto Configuration）
     * 之前：手动配置100行XML
     * 现在：引入starter，自动配置好
     */
    public void autoConfig() {
        // 只需引入spring-boot-starter-web
        // 以下自动配置好：
        // - DispatcherServlet
        // - InternalResourceViewResolver
        // - DataSource（如果配置了数据库）
        // - TransactionManager
    }

    /**
     * 优势二： starters（依赖starter）
     * 一个依赖包含所有相关类库
     */
    public void starters() {
        // web开发：spring-boot-starter-web
        // 数据访问：spring-boot-starter-data-jpa
        // 安全性：spring-boot-starter-security
        // 测试：spring-boot-starter-test
    }

    /**
     * 优势三：嵌入式服务器
     * 内嵌Tomcat/Jetty/Undertow，无需部署WAR
     */
    public void embeddedServer() {
        // java -jar xxx.jar 直接运行
    }

    /**
     * 优势四：actuator监控
     * 运行时查看应用健康状态
     */
    public void actuator() {
        // /actuator/health 健康检查
        // /actuator/info 应用信息
        // /actuator/metrics 指标监控
    }
}
```

---

## 二、IoC/DI容器原理

### 2.1 IoC是什么？

**IoC（控制反转）** 就像**点外卖**：以前你要自己去买菜、洗菜、做菜（自己创建对象），现在你只需要下单，外卖小哥会把做好的菜送到你手上（容器创建对象并注入）。

```
┌────────────────────────────────────────────────────────────────────┐
│                           IoC控制反转示意                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  传统方式（主动）：自己创建对象                                      │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   程序员     │───→│  new UserService() │───→│ UserService │  │
│  │  （主动）   │    │    对象      │    │   实例      │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  IoC方式（被动）：容器创建并注入对象                                  │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │    IoC容器   │───→│ 创建UserService│───→│ 注入到Controller│     │
│  │  （控制）   │    │  注入依赖   │    │  （被动接收）│              │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 DI（依赖注入）详解

**DI（依赖注入）** 是IoC的实现方式：容器主动把依赖的对象注入到组件中。

```java
/**
 * DI依赖注入示例：用户服务依赖仓库
 */
public class DIDemo {

    /**
     * 场景：用户服务需要保存用户到数据库
     *
     * 传统方式：在UserService内部自己创建UserRepository
     * 问题：紧耦合，难以测试
     */
    static class BadUserService {
        private UserRepository userRepository = new UserRepositoryImpl();

        public void save(User user) {
            userRepository.save(user);
        }
    }

    /**
     * 依赖注入方式：构造函数注入
     * 优点：松耦合，易测试
     */
    static class GoodUserService {
        // 依赖通过构造函数注入
        private final UserRepository userRepository;

        // 构造函数注入
        public GoodUserService(UserRepository userRepository) {
            this.userRepository = userRepository;
        }

        public void save(User user) {
            userRepository.save(user);
        }
    }

    /**
     * 依赖注入方式：Setter注入
     */
    static class SetterInjectionService {
        private UserRepository userRepository;

        // setter方法注入
        public void setUserRepository(UserRepository userRepository) {
            this.userRepository = userRepository;
        }
    }

    /**
     * 依赖注入方式：字段注入（不推荐）
     */
    static class FieldInjectionService {
        @Autowired
        private UserRepository userRepository; // 不推荐，难以测试
    }

    // 测试
    public static void main(String[] args) {
        // 手动创建并注入
        UserRepository repo = new UserRepositoryImpl();
        GoodUserService service = new GoodUserService(repo);
        service.save(new User());
    }
}

/*
 * 三种注入方式对比：
 *
 * ┌──────────────┬─────────────────────────────────────────────────────┐
 * │   方式        │                     说明                          │
 * ├──────────────┼─────────────────────────────────────────────────────┤
 * │  构造函数注入  │  依赖必须提供，强制实现                              │
> │              │  优点：明确哪些依赖是必需的                            │
> │              │  缺点：构造函数参数多时不方便                          │
> ├──────────────┼─────────────────────────────────────────────────────┤
> │  Setter注入   │  依赖可选                                            │
> │              │  优点：灵活，可选依赖                                 │
> │              │  缺点：依赖可能在某处未被注入而不报错                  │
> ├──────────────┼─────────────────────────────────────────────────────┤
> │  字段注入     │  最简洁但最不推荐                                    │
> │              │  优点：代码简洁                                      │
> │              │  缺点：违背单一职责，难以单元测试，缺乏透明性          │
> └──────────────┴─────────────────────────────────────────────────────┘
 *
 * 推荐：构造函数注入 + @ConfigurationProperties
 *
 * Spring推荐构造函数注入的原因：
 * 1. 依赖不可变（final）
 * 2. 强制要求依赖，不容易遗漏
 * 3. 容易测试
 * 4. 明确组件的初始化顺序
 */
```

### 2.3 Bean作用域

```java
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/**
 * Bean作用域示例
 */
public class BeanScopeDemo {

    /**
     * Singleton（默认）：整个容器只有一个实例
     * 就像公司只有一个前台
     */
    @Component
    @Scope("singleton")
    static class SingletonBean {
        private String id = java.util.UUID.randomUUID().toString();

        public String getId() {
            return id;
        }
    }

    /**
     * Prototype：每次获取都创建新实例
     * 就像每次挂号都分配新窗口
     */
    @Component
    @Scope("prototype")
    static class PrototypeBean {
        private String id = java.util.UUID.randomUUID().toString();

        public String getId() {
            return id;
        }
    }

    /**
     * Request：每个HTTP请求一个实例
     * 就像每个客户的咨询单
     */
    @Component
    @Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
    static class RequestBean {
        // 用于Web应用
    }

    /**
     * Session：每个HTTP会话一个实例
     * 就像每个用户的购物车
     */
    @Component
    @Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
    static class SessionBean {
        // 用于Web应用
    }
}

/*
 * 作用域对比：
 *
 * ┌──────────────┬────────────────────────────────────────────────────┐
 * │   作用域       │                     说明                        │
 * ├──────────────┼────────────────────────────────────────────────────┤
> │ singleton    │ (默认) 容器中只有一个实例                          │
> │              │ 适合无状态的Bean                                   │
> ├──────────────┼────────────────────────────────────────────────────┤
> │ prototype   │ 每次获取创建新实例                                 │
> │              │ 适合有状态的Bean                                   │
> │              │ 注意：Spring不会管理原型Bean的完整生命周期          │
> ├──────────────┼────────────────────────────────────────────────────┤
> │ request     │ 每个HTTP请求一个实例                               │
> │              │ Web应用有效                                       │
> ├──────────────┼────────────────────────────────────────────────────┤
> │ session     │ 每个HTTP会话一个实例                               │
> │              │ Web应用有效                                       │
> ├──────────────┼────────────────────────────────────────────────────┤
> │ application │ ServletContext生命周期内只有一个实例                │
> ├──────────────┼────────────────────────────────────────────────────┤
> │ websocket   │ WebSocket生命周期内只有一个实例                    │
> └──────────────┴────────────────────────────────────────────────────┘
 *
 * 生命周期示意：
 *
 * Singleton Bean：
 * ┌──────────────────────────────────────────────────────────────┐
 * │  容器创建 ──> 初始化 ──> 使用 ──> 容器关闭 ──> 销毁           │
 * │    1次      1次        多次         1次         1次           │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Prototype Bean：
 * ┌──────────────────────────────────────────────────────────────┐
 * │  getBean() ──> 创建 ──> 初始化 ──> 返回 ──> 使用 ──> GC回收  │
 * │     每次      每次       1次                       无销毁    │
 * │                                                           │
 * │  重要：容器只负责创建和初始化，不负责销毁！                   │
 * └──────────────────────────────────────────────────────────────┘
 */
```

### 2.4 Bean生命周期

```java
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

/**
 * Bean生命周期完整流程
 */
@Component
public class BeanLifecycleDemo implements InitializingBean, DisposableBean, BeanNameAware {

    private String beanName;

    // 1. 设置Bean名称（如果实现了BeanNameAware）
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("1. BeanNameAware: Bean名称 = " + name);
    }

    // 2. Bean属性填充（@Autowired等在这里处理）
    // 此时Bean的属性已经被注入

    // 3. 初始化前回调（BeanPostProcessor.beforeInitialization）
    // 可以在这里修改Bean

    // 4. @PostConstruct初始化方法
    @PostConstruct
    public void postConstruct() {
        System.out.println("5. @PostConstruct: 初始化方法执行");
    }

    // 5. InitializingBean.afterPropertiesSet
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("6. InitializingBean.afterPropertiesSet: 属性设置完成");
    }

    // 6. 自定义init-method
    public void customInit() {
        System.out.println("7. 自定义init-method: 初始化完成");
    }

    // ===== Bean使用中 =====

    // 8. 销毁阶段
    // 9. @PreDestroy销毁前回调
    @PreDestroy
    public void preDestroy() {
        System.out.println("9. @PreDestroy: 销毁前清理");
    }

    // 10. DisposableBean.destroy()
    @Override
    public void destroy() throws Exception {
        System.out.println("10. DisposableBean.destroy: 销毁");
    }

    // 11. 自定义destroy-method
    public void customDestroy() {
        System.out.println("11. 自定义destroy-method: 销毁完成");
    }
}

/*
 * Bean生命周期完整流程图：
 *
 * ┌─────────────────────────────────────────────────────────────┐
 *                    Bean生命周期回调流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   1. 实例化Bean                           │ │
│  │           new UserServiceImpl()                          │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   2. 属性填充                             │ │
│  │        @Autowired, @Value 等注解处理                      │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              3. BeanNameAware回调                        │ │
│  │              setBeanName(beanName)                       │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              4. BeanFactoryAware回调                      │ │
│  │              setBeanFactory(beanFactory)                  │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            5. ApplicationContextAware回调                 │ │
│  │            setApplicationContext(ctx)                   │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        6. BeanPostProcessor.postProcessBeforeInit       │ │
│  │              初始化前增强                                 │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │             7. @PostConstruct初始化方法                  │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        8. InitializingBean.afterPropertiesSet            │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              9. 自定义init-method                        │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        10. BeanPostProcessor.postProcessAfterInit        │ │
│  │              初始化后增强                                 │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   ===== Bean使用中 =====                  │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              11. @PreDestroy销毁前回调                    │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              12. DisposableBean.destroy                 │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              13. 自定义destroy-method                    │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│                      ===== 销毁完成 =====                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
*/
```

---

## 三、AOP面向切面编程

### 3.1 AOP是什么？

**AOP（面向切面编程）** 就像**餐厅的服务员机制**：厨师只管做菜，点餐、上菜、收桌这些"切面"工作由服务员统一处理。

```
┌────────────────────────────────────────────────────────────────────┐
│                         AOP概念类比                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  传统方式：每个方法都要手动处理横切关注点                              │
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │方法A    │    │方法B    │    │方法C    │    │方法D    │          │
│  │┌───────┐│    │┌───────┐│    │┌───────┐│    │┌───────┐│          │
│  ││日志   ││    ││日志   ││    ││日志   ││    ││日志   ││          │
│  ││ 核心  ││    ││ 核心  ││    ││ 核心  ││    ││ 核心  ││          │
│  ││事务   ││    ││事务   ││    ││事务   ││    ││事务   ││          │
│  ││安全   ││    ││安全   ││    ││安全   ││    ││安全   ││          │
│  ││性能   ││    ││性能   ││    ││性能   ││    ││性能   ││          │
│  │└───────┘│    │└───────┘│    │└───────┘│    │└───────┘│          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│                                                                      │
│  AOP方式：切面统一处理                                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────┐          │
│  │                  横切关注点（切面）                    │          │
│  │    ┌────────────────────────────────────────────┐   │          │
│  │    │  日志切面  │  事务切面  │  安全切面  │ 性能切面 │   │          │
│  │    └────────────────────────────────────────────┘   │          │
│  └──────────────────────────┬──────────────────────────┘          │
│                             │                                       │
│         ┌───────────────────┼───────────────────┐                   │
│         ▼                   ▼                   ▼                   │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐              │
│  │  方法A   │          │  方法B   │          │  方法C   │              │
│  │  核心逻辑 │          │  核心逻辑 │          │  核心逻辑 │              │
│  └─────────┘          └─────────┘          └─────────┘              │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 AOP核心概念

```java
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

/**
 * AOP核心概念示例
 */
public class AOPConceptsDemo {

    /**
     * 切面（Aspect）
     * 定义：横切关注点的模块化
     * 就像：餐厅的服务员团队（统一处理点餐、上菜、收桌）
     */
    @Aspect
    @Component
    static class LoggingAspect {

        /**
         * 切入点（Pointcut）
         * 定义：哪些地方需要织入通知
         * 表达式：execution(* com.example..*.*(..))
         * 解释：com.example包下所有类的所有方法
         */
        @Pointcut("execution(* com.example..*.*(..))")
        public void pointcut() {
        }

        /**
         * 通知（Advice）
         * 定义：切面要执行的动作
         *
         * @Before 前置通知：方法执行前
         * @After 后置通知：方法执行后（无论是否异常）
         * @AfterReturning 返回通知：方法正常返回后
         * @AfterThrowing 异常通知：方法抛出异常后
         * @Around 环绕通知：包围方法，可控制何时执行
         */
        @Before("pointcut()")
        public void beforeAdvice() {
            System.out.println("前置通知：方法执行前");
        }

        @AfterReturning(pointcut = "pointcut()", returning = "result")
        public void afterReturningAdvice(Object result) {
            System.out.println("返回通知：方法返回值为 " + result);
        }

        @AfterThrowing(pointcut = "pointcut()", throwing = "exception")
        public void afterThrowingAdvice(Exception exception) {
            System.out.println("异常通知：抛出异常 " + exception.getMessage());
        }

        @Around("pointcut()")
        public Object aroundAdvice(ProceedingJoinPoint joinPoint) throws Throwable {
            System.out.println("环绕通知-前置：准备执行");

            long startTime = System.currentTimeMillis();

            // 执行目标方法
            Object result = joinPoint.proceed();

            long endTime = System.currentTimeMillis();
            System.out.println("环绕通知-后置：执行完成，耗时：" + (endTime - startTime) + "ms");

            return result;
        }
    }
}

/*
 * AOP术语详解：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 *                        AOP术语图解                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  目标对象（Target）                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      UserServiceImpl                          │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │              saveUser() 方法                           │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐│  │ │
│  │  │  │ 核心业务逻辑                                        ││  │ │
│  │  │  └─────────────────────────────────────────────────────┘│  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                       │
│         ┌──────────────────┼──────────────────┐                    │
│         ▼                  ▼                  ▼                    │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐              │
│  │  前置通知   │     │ 返回通知   │     │ 异常通知    │              │
│  │ @Before   │     │@AfterReturning│  │@AfterThrowing│            │
│  └────────────┘     └────────────┘     └────────────┘              │
│         │                  │                  │                    │
│         └──────────────────┴──────────────────┘                    │
│                            │                                       │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                        切面（Aspect）                          │ │
│  │   切入点 + 通知 = 切面                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
 *
 * 通知执行顺序：
 *
 * 正常执行：
 * @Around前置 → @Before → 核心逻辑 → @Around后置 → @AfterReturning → @After
 *
 * 异常执行：
 * @Around前置 → @Before → 核心逻辑 → @Around后置 → @AfterThrowing → @After
 *
 *
 * 切入点表达式：
 *
 * 语法：execution([权限修饰符] 返回类型 [类名.]方法名(参数) [异常])
 *
 * 示例：
 * execution(public void com.example.UserService.saveUser(..))
 *   - 匹配UserService的saveUser方法，任意参数
 *
 * execution(* com.example..*.*(..))
 *   - com.example包及子包下任意类的任意方法
 *
 * execution(* com.example.service.*.*(..))
 *   - com.example.service包下任意类的任意方法
 *
 * execution(* save*(..))
 *   - 任意类中以save开头的方法
 *
 * within(com.example.service.*)
 *   - com.example.service包下任意类（所有方法）
 *
 * @target(org.springframework.stereotype.Service)
 *   - 带有@Service注解的类的所有方法
 *
 * @annotation(org.springframework.transaction.annotation.Transactional)
 *   - 带有@Transactional注解的方法
 *
 * args(String, int)
 *   - 第一个参数为String，第二个参数为int的方法
 */
```

### 3.3 AOP实战：性能监控与日志

```java
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AOP实战：性能监控与日志
 */
@Aspect
@Component
public class PerformanceMonitorAspect {

    private static final Logger log = LoggerFactory.getLogger(PerformanceMonitorAspect.class);

    /**
     * 监控所有Controller方法
     * 切入点表达式：controller包下所有类的所有方法
     */
    @Pointcut("execution(* com.example.controller..*.*(..))")
    public void controllerPointcut() {
    }

    /**
     * 监控所有Service方法
     */
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void servicePointcut() {
    }

    /**
     * 组合切入点：同时监控Controller和Service
     */
    @Pointcut("controllerPointcut() || servicePointcut()")
    public void monitorPointcut() {
    }

    /**
     * 性能监控通知
     */
    @Around("monitorPointcut()")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取目标类和方法
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        // 获取请求参数
        Object[] args = joinPoint.getArgs();

        // 记录开始时间
        long startTime = System.currentTimeMillis();

        // 记录日志
        log.info("==> {}.{} 开始执行，参数: {}", className, methodName, args);

        try {
            // 执行目标方法
            Object result = joinPoint.proceed();

            // 计算执行时间
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            // 记录返回结果
            log.info("<== {}.{} 执行完成，耗时: {}ms，返回: {}",
                className, methodName, duration, result);

            // 如果执行时间超过1秒，记录警告
            if (duration > 1000) {
                log.warn("!!! {}.{} 执行时间超过1秒，请关注！", className, methodName);
            }

            return result;

        } catch (Exception e) {
            // 记录异常
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            log.error("<XX {}.{} 执行异常，耗时: {}ms，异常: {}",
                className, methodName, duration, e.getMessage());

            throw e;
        }
    }

    /**
     * 监控所有带@Transactional注解的方法
     */
    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object monitorTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        log.info("开启事务: {}.{}", className, methodName);

        try {
            Object result = joinPoint.proceed();
            log.info("提交事务: {}.{}", className, methodName);
            return result;
        } catch (Exception e) {
            log.error("回滚事务: {}.{}，原因: {}", className, methodName, e.getMessage());
            throw e;
        }
    }
}

/*
 * AOP应用场景总结：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                      AOP典型应用场景                             │█
> ├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> │  1. 日志记录（Logging）                                          │
> │     - 方法调用日志                                                │
> │     - 参数日志                                                    │
> │     - 返回值日志                                                  │
> │                                                                  │
> │  2. 性能监控（Performance Monitoring）                            │
> │     - 方法执行时间统计                                            │
> │     - 接口响应时间监控                                            │
> │     - 慢查询告警                                                  │
> │                                                                  │
> │  3. 事务管理（Transaction Management）                            │
> │     - 自动开启事务                                                │
> │     - 自动提交/回滚                                               │
> │     - 事务传播行为                                                │
> │                                                                  │
> │  4. 安全控制（Security）                                          │
> │     - 权限检查                                                    │
> │     - 认证检查                                                    │
> │     - 防止SQL注入                                                 │
> │                                                                  │
> │  5. 异常处理（Exception Handling）                                │
> │     - 统一异常转换                                                │
> │     - 异常日志记录                                                │
> │     - 异常通知                                                    │
> │                                                                  │
> │  6. 缓存管理（Cache）                                            │
> │     - 自动缓存                                                    │
> │     - 缓存失效                                                    │
> │     - 缓存更新                                                    │
> │                                                                  │
> │  7. 参数校验（Validation）                                       │
> │     - 方法参数校验                                                │
> │     - 自动校验提示                                                │
> │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
 */
```

---

## 四、事务管理

### 4.1 事务核心概念

**事务**就像**餐厅的点餐-做菜-上菜流程**：要么全套完成（提交），要么全套取消（回滚）。

```
┌────────────────────────────────────────────────────────────────────┐
│                           ACID特性                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Atomic（原子性）                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  点餐系统：                                                   │  │
│  │  - 下单 ──> 扣款 ──> 通知厨房 ──> 完成                        │  │
│  │  如果扣款成功但通知厨房失败，整个流程回滚！                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Consistency（一致性）                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  点餐前后：                                                   │  │
│  │  - 用户余额 + 餐厅余额 = 总资产（不变）                        │  │
│  │  - 库存数量 = 原库存 - 卖出数量                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Isolation（隔离性）                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  多个用户同时下单：                                           │  │
>  │  - 用户A下单 ──> 用户B下单 ──> 库存并发控制                    │  │
>  │  - 最终库存 = 正确结果（不受并发影响）                          │  │
> └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Durability（持久性）                                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  订单完成后：                                                 │  │
│  │  - 订单数据必须持久化到数据库                                  │  │
│  │  - 即使系统崩溃，订单也不能丢失                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 Spring事务管理

```java
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring事务管理示例
 */
public class TransactionDemo {

    /**
     * Spring声明式事务
     * 只需在方法或类上添加@Transactional注解
     */
    @Transactional(rollbackFor = Exception.class)
    public void transferMoney(String from, String to, double amount) {
        // 1. 检查转出账户余额
        Account fromAccount = accountRepository.findByAccountNo(from);
        if (fromAccount.getBalance() < amount) {
            throw new RuntimeException("余额不足");
        }

        // 2. 扣款
        fromAccount.setBalance(fromAccount.getBalance() - amount);
        accountRepository.save(fromAccount);

        // 3. 存款
        Account toAccount = accountRepository.findByAccountNo(to);
        toAccount.setBalance(toAccount.getBalance() + amount);
        accountRepository.save(toAccount);

        // 4. 记录日志
        transactionLogService.log(from, to, amount);

        // 如果发生异常，Spring会自动回滚
    }

    /**
     * 事务属性详解
     */
    @Transactional(
        // 事务传播行为：当前方法如何在事务中执行
        propagation = Propagation.REQUIRED,

        // 隔离级别：并发控制级别
        isolation = Isolation.DEFAULT,

        // 超时时间（秒）
        timeout = 30,

        // 是否只读
        readOnly = false,

        // 回滚条件：哪些异常触发回滚
        rollbackFor = {RuntimeException.class, Exception.class},

        // 不回滚条件：哪些异常不触发回滚
        noRollbackFor = {BusinessException.class}
    )
    public void businessMethod() {
        // 业务逻辑
    }
}

/*
 * 事务传播行为（Propagation）：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 *                      7种事务传播行为                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REQUIRED（默认）                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  有事务 → 加入事务                                          │ │
│  │  无事务 → 创建新事务                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  REQUIRES_NEW                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
>  │  总是创建新事务                                             │
>  │  外层事务挂起，内层事务独立                                   │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
>  SUPPORTS                                                        │
>  ┌────────────────────────────────────────────────────────────┐ │
>  │  有事务 → 加入事务                                         │
>  │  无事务 → 以非事务执行                                      │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
>  NOT_SUPPORTED                                                   │
>  ┌────────────────────────────────────────────────────────────┐ │
>  │  有事务 → 挂起，以非事务执行                                │
>  │  无事务 → 以非事务执行                                      │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
>  MANDATORY                                                       │
>  ┌────────────────────────────────────────────────────────────┐ │
>  │  有事务 → 加入事务                                         │
>  │  无事务 → 抛出异常                                          │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
>  NEVER                                                           │
>  ┌────────────────────────────────────────────────────────────┐ │
>  │  有事务 → 抛出异常                                         │
>  │  无事务 → 以非事务执行                                      │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
>  NESTED                                                          │
>  ┌────────────────────────────────────────────────────────────┐ │
>  │  有事务 → 创建嵌套事务（保存点）                            │
>  │  无事务 → 创建新事务（等同于REQUIRED）                      │
>  └────────────────────────────────────────────────────────────┘ │
>                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 *
 * 隔离级别（Isolation）：
 *
 * ┌────────────┬────────────────────────────────────────────────────┐
> > │  隔离级别    │                     说明                         │█
> ├────────────┼────────────────────────────────────────────────────┤
> │ DEFAULT    │ 使用数据库默认隔离级别                               │█
> ├────────────┼────────────────────────────────────────────────────┤
> │ READ_UNCOMMITTED │ 最低隔离级别，允许脏读                        │█
> ├────────────┼────────────────────────────────────────────────────┤
> │ READ_COMMITTED │ 防止脏读，允许不可重复读                         │█
> ├────────────┼────────────────────────────────────────────────────┤
> │ REPEATABLE_READ │ 防止脏读、不可重复读，允许幻读                 │█
> ├────────────┼────────────────────────────────────────────────────┤
> │ SERIALIZABLE │ 最高隔离级别，串行执行，完全避免幻读              │█
> └────────────┴────────────────────────────────────────────────────┘
 *
 * 常见问题：
 * 脏读：一个事务读取了另一个事务未提交的数据
 * 不可重复读：一个事务两次读取同一行数据，结果不同
 * 幻读：一个事务两次查询，结果集数量不同（insert/delete）
 */
```

### 4.3 事务原理：手写事务管理器

```java
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

/**
 * 手动事务管理示例
 * 了解Spring事务底层的实现原理
 */
public class ManualTransactionDemo {

    // 注入事务管理器（也可以直接注入PlatformTransactionManager）
    private DataSourceTransactionManager transactionManager;

    public void setTransactionManager(DataSourceTransactionManager transactionManager) {
        this.transactionManager = transactionManager;
    }

    /**
     * 手动编程式事务
     */
    public void manualTransaction() {
        // 1. 创建事务定义
        TransactionDefinition definition = new DefaultTransactionDefinition();

        // 2. 获取事务状态
        TransactionStatus status = transactionManager.getTransaction(definition);

        try {
            // 3. 执行业务逻辑
            doBusinessLogic();

            // 4. 提交事务
            transactionManager.commit(status);

        } catch (Exception e) {
            // 5. 回滚事务
            transactionManager.rollback(status);
            throw e;
        }
    }

    /**
     * 嵌套事务（保存点）
     */
    public void nestedTransaction() {
        TransactionDefinition definition = new DefaultTransactionDefinition(
            TransactionDefinition.PROPAGATION_NESTED
        );
        TransactionStatus status = transactionManager.getTransaction(definition);

        try {
            // 外层事务逻辑
            outerLogic();

            // 创建保存点
            Object savepoint = status.createSavepoint();

            try {
                // 内层嵌套事务
                innerLogic();

            } catch (Exception e) {
                // 回滚到保存点
                status.rollbackToSavepoint(savepoint);
                // 继续执行（外层事务不会回滚）
            }

            // 提交外层事务
            transactionManager.commit(status);

        } catch (Exception e) {
            transactionManager.rollback(status);
        }
    }

    private void doBusinessLogic() {
        // 业务逻辑
    }

    private void outerLogic() {
        // 外层逻辑
    }

    private void innerLogic() {
        // 内层逻辑
    }
}

/*
 * 事务管理器架构：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> │                    Spring事务管理架构                              │
├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> │                    PlatformTransactionManager                    │
> │                    （事务管理器接口）                              │
> │                              │                                   │
> │           ┌──────────────────┼──────────────────┐                  │
> │           ▼                  ▼                  ▼                  │
> │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
> │  │DataSource   │    │ Hibernate  │    │ JPA        │          │
> │  │Transaction  │    │ Transaction │    │Transaction │          │
> │  │Manager      │    │ Manager     │    │ Manager    │          │
> │  │(JDBC)       │    │             │    │            │          │
> │  └─────────────┘    └─────────────┘    └─────────────┘          │
> │                                                                  │
> │  ┌─────────────────────────────────────────────────────────────┐ │
> │  │                      事务同步管理器                          │ │
> │  │            TransactionSynchronizationManager                 │ │
> │  │  - 事务资源绑定（DataSource -> Connection）                  │ │
> │  │  - 事务同步回调                                              │ │
> │  └─────────────────────────────────────────────────────────────┘ │
> │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 *
 * ThreadLocal在事务中的作用：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> │                   ThreadLocal事务资源管理                         │
├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  ThreadLocal<Map<Object, Object>> resources                    │
> > │                                                                  │
> > │  key: DataSource                                               │
> > │  value: Connection (以及相关事务状态)                           │
> > │                                                                  │
> > │  ┌─────────────────────────────────────────────────────────┐  │
> > │  │  线程1                                                    │  │
> > │  │  resources: {                                           │  │
> > │  │    ds1 -> Connection1,                                  │  │
> > │  │    ds2 -> Connection2                                   │  │
> > │  │  }                                                      │  │
> > │  └─────────────────────────────────────────────────────────┘  │
> > │                         │                                     │
> > │                         │ 事务同步                             │
> > │                         ▼                                     │
> > │  ┌─────────────────────────────────────────────────────────┐  │
> > │  │  线程2                                                    │  │
> > │  │  resources: {                                           │  │
> > > │  │    ds1 -> Connection3,  // 独立连接                   │  │
> > │  │  }                                                      │  │
> > │  └─────────────────────────────────────────────────────────┘  │
> > │                                                                  │
> > │  线程1和线程2的事务互不影响，靠ThreadLocal隔离                   │
> > │                                                                  │
>  └─────────────────────────────────────────────────────────────────┘
 */
```

---

## 五、自动配置原理

### 5.1 自动配置核心机制

Spring Boot的**自动配置**就像**智能家居**：你只需要通电（引入starter），各种设备自动连接并工作，无需手动配置。

```
┌────────────────────────────────────────────────────────────────────┐
│                        Spring Boot自动配置流程                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  @SpringBootApplication = @SpringBootConfiguration                  │
│                        + @EnableAutoConfiguration                   │
│                        + @ComponentScan                             │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  @EnableAutoConfiguration                      │  │
│  │                         │                                     │  │
│  │                         ▼                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  AutoConfigurationImportSelector                         │  │  │
│  │  │  1. 从 META-INF/spring.factories 加载配置                │  │  │
│  │  │  2. 从 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports  │
│  │  │  3. 根据条件筛选生效的配置                               │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                         │                                     │  │
│  │                         ▼                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  所有自动配置类：                                        │  │  │
│  │  │  - RedisAutoConfiguration                              │  │  │
│  │  │  - DataSourceAutoConfiguration                         │  │  │
│  │  │  - WebMvcAutoConfiguration                             │  │  │
│  │  │  - ...（约140+个配置类）                                │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                         │                                     │  │
│  │                         ▼                                     │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  @Conditional注解过滤                                   │  │  │
│  │  │  - @ConditionalOnClass：类存在才生效                    │  │  │
│  │  │  - @ConditionalOnBean：Bean存在才生效                  │  │  │
│  │  │  - @ConditionalOnProperty：配置存在才生效              │  │  │
│  │  │  - @ConditionalOnMissingClass：类不存在才生效           │  │  │
│  │  │  - @ConditionalOnMissingBean：Bean不存在才生效         │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 自定义starter

```java
/**
 * 自定义Starter完整示例：短信服务
 *
 * 命名规范：
 * - 官方starter: spring-boot-starter-xxx
 * - 自定义starter: xxx-spring-boot-starter
 */

/**
 * 1. 自动配置类
 */
@Configuration
// 当classpath下存在指定类时才生效
@ConditionalOnClass(SmsService.class)
// 当不存在SmsService Bean时才生效
@ConditionalOnMissingBean
// 当配置了 sms.enabled=true 时生效（默认true）
@ConditionalOnProperty(prefix = "sms", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(SmsProperties.class)
public class SmsAutoConfiguration {

    // 注入配置属性
    private final SmsProperties properties;

    public SmsAutoConfiguration(SmsProperties properties) {
        this.properties = properties;
    }

    /**
     * 创建SmsService Bean
     */
    @Bean
    @Primary // 如果已存在同类型Bean，优先使用这个
    public SmsService smsService() {
        SmsService smsService = new SmsService();
        smsService.setAccessKey(properties.getAccessKey());
        smsService.setSecretKey(properties.getSecretKey());
        smsService.setRegion(properties.getRegion());
        smsService.setTemplateCode(properties.getTemplateCode());
        return smsService;
    }
}

/**
 * 2. 配置属性类
 */
@ConfigurationProperties(prefix = "sms")
public class SmsProperties {

    private String accessKey;
    private String secretKey;
    private String region = "cn-hangzhou";
    private String templateCode;

    // getters and setters
    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }
}

/**
 * 3. 核心服务类
 */
public class SmsService {

    private String accessKey;
    private String secretKey;
    private String region;
    private String templateCode;

    /**
     * 发送短信
     */
    public void send(String phone, String code) {
        // 实际发送短信逻辑
        System.out.println("发送短信到 " + phone + "，验证码：" + code);
    }
}

/**
 * 4. spring.factories配置
 *
 * 文件位置：src/main/resources/META-INF/spring.factories
 *
 * 内容：
 * org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
 *   com.example.sms.config.SmsAutoConfiguration
 */

/**
 * 5. Spring Boot 3.x 使用 imports
 *
 * 文件位置：src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
 *
 * 内容：
 * com.example.sms.config.SmsAutoConfiguration
 */

/*
 * Starter使用示例：
 *
 * 1. 引入依赖：
 * <dependency>
 *     <groupId>com.example</groupId>
 *     <artifactId>sms-spring-boot-starter</artifactId>
 *     <version>1.0.0</version>
 * </dependency>
 *
 * 2. 配置application.yml：
 * sms:
 *   access-key: your-access-key
 *   secret-key: your-secret-key
 *   template-code: SMS_xxx
 *
 * 3. 直接使用：
 * @Autowired
 * private SmsService smsService;
 *
 * smsService.send("13800138000", "123456");
 */
```

### 5.3 条件注解详解

```java
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;

/**
 * 条件注解详解
 */
@Configuration
public class ConditionalDemo {

    /**
     * @ConditionalOnClass：类路径下存在指定类才注册Bean
     *
     * 场景：只有引入Redis相关类时才配置RedisTemplate
     */
    @ConditionalOnClass(name = "redis.clients.jedis.Jedis")
    @Bean
    public Jedis jedis() {
        return new Jedis();
    }

    /**
     * @ConditionalOnBean：容器中存在指定Bean才注册
     *
     * 场景：只有配置了某个DataSource才注册相关服务
     */
    @ConditionalOnBean(DataSource.class)
    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    /**
     * @ConditionalOnMissingBean：容器中不存在指定Bean才注册
     *
     * 场景：允许用户自定义Bean覆盖默认配置
     */
    @ConditionalOnMissingBean
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    /**
     * @ConditionalOnProperty：配置属性满足条件才注册
     *
     * 场景：可以通过配置开关启用/禁用功能
     */
    @ConditionalOnProperty(
        prefix = "feature",
        name = "cache-enabled",
        havingValue = "true",
        matchIfMissing = false
    )
    @Bean
    public CacheService cacheService() {
        return new CacheService();
    }

    /**
     * @ConditionalOnExpression：SpEL表达式条件
     *
     * 场景：复杂的条件判断
     */
    @ConditionalOnExpression(
        "${server.port} > 8000 && '${spring.profiles.active}'.equals('prod')"
    )
    @Bean
    public AlertService alertService() {
        return new AlertService();
    }

    /**
     * @ConditionalOnWebApplication：必须是Web应用才注册
     *
     * 场景：只有Web应用才需要配置WebMvc相关
     */
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                // 添加拦截器
            }
        };
    }

    /**
     * @ConditionalOnResource：指定资源存在才注册
     *
     * 场景：配置文件存在才加载
     */
    @ConditionalOnResource(resources = "classpath:init.sql")
    @Bean
    public DataSourceInitializer dataSourceInitializer() {
        return new DataSourceInitializer();
    }

    /**
     * 组合条件：同时满足多个条件
     */
    @Conditional({ // 注意：这里是组合条件
        @ConditionalOnBean(DataSource.class),
        @ConditionalOnProperty(name = "db.init-enabled", havingValue = "true"),
        @ConditionalOnClass(JdbcTemplate.class)
    })
    @Bean
    public DatabaseInitializer databaseInitializer() {
        return new DatabaseInitializer();
    }
}

/*
 * 条件注解执行顺序：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                   条件判断流程                                   │
├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  自动配置类加载                                                   │
> > > │                                                                  │
> > │         │                                                       │
> > > │         ▼                                                       │
> > │  ┌─────────────────────────────────────────────────────────┐     │
> > │  │  @ConditionalOnClass                                   │     │
> > │  │  - 检查类路径是否存在                                   │     │
> > │  │  - 不存在 → 跳过该配置类                                │     │
> > │  │  - 存在 → 继续                                          │     │
> > │  └─────────────────────────────────────────────────────────┘     │
> > > │                                                                  │
> > > │         │                                                       │
> > > │         ▼                                                       │
> > │  ┌─────────────────────────────────────────────────────────┐     │
> > │  │  @ConditionalOnBean                                    │     │
> > │  │  - 检查容器中是否存在指定Bean                           │     │
> > > │  │  - 不存在 → 继续                                      │     │
> > │  │  - 存在 → 跳过该Bean定义                               │     │
> > │  └─────────────────────────────────────────────────────────┘     │
> > > │                                                                  │
> > > │         │                                                       │
> > > │         ▼                                                       │
> > │  ┌─────────────────────────────────────────────────────────┐     │
> > │  │  @ConditionalOnProperty                               │     │
> > │  │  - 检查配置属性                                        │     │
> > │  │  - 不满足 → 跳过                                       │     │
> > │  │  - 满足 → 注册Bean                                     │     │
> > │  └─────────────────────────────────────────────────────────┘     │
> > > │                                                                  │
> > > │         │                                                       │
> > > │         ▼                                                       │
> > │       注册Bean                                                    │
> > │                                                                  │
>  └─────────────────────────────────────────────────────────────────┘
 */
```

---

## 六、监控Actuator

### 6.1 Actuator核心端点

Actuator就像**汽车仪表盘**：实时显示车速、油量、发动机状态等各项指标。

```
┌────────────────────────────────────────────────────────────────────┐
│                          Spring Boot Actuator                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  引入依赖：                                                          │
│  <dependency>                                                       │
│      <groupId>org.springframework.boot</groupId>                     │
│      <artifactId>spring-boot-starter-actuator</artifactId>           │
│  </dependency>                                                      │
│                                                                      │
│  配置：                                                              │
│  management:                                                        │
│    endpoints:                                                       │
│      web:                                                           │
│        exposure:                                                   │
│          include: "*"  # 暴露所有端点                               │
│    endpoint:                                                       │
│      health:                                                       │
│        show-details: always  # 显示详细信息                         │
│                                                                      │
├────────────────────────────────────────────────────────────────────┤
│                         常用端点一览                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  端点                      │ 路径                  │ 说明            │
│  ─────────────────────────┼──────────────────────┼───────────────  │
│  health                   │ /actuator/health      │ 健康检查        │
│  info                     │ /actuator/info        │ 应用信息        │
│  metrics                  │ /actuator/metrics     │ 指标监控        │
│  env                      │ /actuator/env         │ 环境变量        │
│  beans                    │ /actuator/beans       │ 所有Bean        │
│  conditions               │ /actuator/conditions  │ 配置条件        │
│  configprops              │ /actuator/configprops │ 配置属性        │
│  mappings                 │ /actuator/mappings    │ 请求映射        │
│  threaddump               │ /actuator/threaddump  │ 线程快照        │
│  heapdump                 │ /actuator/heapdump    │ 堆内存快照      │
│  httptrace               │ /actuator/httptrace   │ HTTP轨迹        │
│  scheduledtasks          │ /actuator/scheduledtasks │ 定时任务      │
│  loggers                  │ /actuator/loggers     │ 日志级别        │
│  prometheus              │ /actuator/prometheus   │ Prometheus指标  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 自定义健康指标与端点

```java
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.metrics.Metric;
import org.springframework.stereotype.Component;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 自定义监控指标示例
 */
public class CustomHealthDemo {

    /**
     * 自定义健康检查器
     * 实现HealthIndicator接口
     */
    @Component
    public static class DatabaseHealthIndicator implements HealthIndicator {

        @Override
        public Health health() {
            try {
                // 检查数据库连接
                // boolean connected = checkDatabaseConnection();

                // 模拟检查
                boolean connected = true;

                if (connected) {
                    return Health.up()
                        .withDetail("database", "MySQL")
                        .withDetail("version", "8.0.33")
                        .withDetail("maxConnections", 100)
                        .withDetail("activeConnections", 15)
                        .build();
                } else {
                    return Health.down()
                        .withDetail("error", "Connection timeout")
                        .build();
                }
            } catch (Exception e) {
                return Health.down()
                    .withException(e)
                    .build();
            }
        }
    }

    /**
     * Redis健康检查
     */
    @Component
    public static class RedisHealthIndicator implements HealthIndicator {

        @Override
        public Health health() {
            try {
                // 检查Redis
                // Jedis jedis = jedisPool.getResource();
                // jedis.ping();
                boolean connected = true;

                if (connected) {
                    return Health.up()
                        .withDetail("redis", "Connected")
                        .withDetail("mode", "standalone")
                        .withDetail("used_memory", "1.5MB")
                        .build();
                } else {
                    return Health.down()
                        .withDetail("error", "Redis unavailable")
                        .build();
                }
            } catch (Exception e) {
                return Health.down()
                    .withException(e)
                    .build();
            }
        }
    }

    /**
     * 自定义业务健康检查：订单系统
     */
    @Component("orderHealth")
    public static class OrderHealthIndicator implements HealthIndicator {

        // 模拟订单统计
        private final AtomicLong pendingOrders = new AtomicLong(0);
        private final AtomicLong completedOrders = new AtomicLong(0);

        @Override
        public Health health() {
            long pending = pendingOrders.get();
            long completed = completedOrders.get();

            // 业务规则：待处理订单超过1000算警告
            Health.Builder builder = Health.up();

            if (pending > 1000) {
                builder = Health.unknown()
                    .withDetail("warning", "Pending orders too high");
            }

            if (pending > 5000) {
                builder = Health.down()
                    .withDetail("critical", "System overloaded");
            }

            return builder
                .withDetail("pendingOrders", pending)
                .withDetail("completedOrders", completed)
                .withDetail("successRate", calculateSuccessRate())
                .build();
        }

        private double calculateSuccessRate() {
            long pending = pendingOrders.get();
            long completed = completedOrders.get();
            long total = pending + completed;
            return total > 0 ? (double) completed / total * 100 : 0;
        }
    }

    /**
     * 自定义Micrometer指标
     */
    @Component
    public static class CustomMetrics {

        // 计数器：请求总数
        private final AtomicLong requestCount = new AtomicLong(0);

        // 计数器：错误总数
        private final AtomicLong errorCount = new AtomicLong(0);

        // Gauge：当前在线人数
        private final AtomicLong onlineUsers = new AtomicLong(0);

        // 模拟在线用户
        private final ConcurrentHashMap<String, Long> sessions = new ConcurrentHashMap<>();

        /**
         * 记录请求
         */
        public void recordRequest(String endpoint, long durationMs) {
            requestCount.incrementAndGet();

            if (durationMs > 1000) {
                // 慢请求
                recordSlowRequest(endpoint, durationMs);
            }
        }

        /**
         * 记录错误
         */
        public void recordError(String endpoint, Throwable error) {
            errorCount.incrementAndGet();
        }

        /**
         * 记录慢请求
         */
        private void recordSlowRequest(String endpoint, long durationMs) {
            System.out.println("慢请求告警: " + endpoint + " 耗时 " + durationMs + "ms");
        }

        /**
         * 用户登录
         */
        public void userLogin(String userId) {
            sessions.put(userId, System.currentTimeMillis());
            onlineUsers.set(sessions.size());
        }

        /**
         * 用户登出
         */
        public void userLogout(String userId) {
            sessions.remove(userId);
            onlineUsers.set(sessions.size());
        }

        public long getRequestCount() {
            return requestCount.get();
        }

        public long getErrorCount() {
            return errorCount.get();
        }

        public long getOnlineUsers() {
            return onlineUsers.get();
        }
    }
}

/*
 * Actuator与Prometheus集成：
 *
 * 1. 添加依赖：
 * <dependency>
 *     <groupId>io.micrometer</groupId>
 *     <artifactId>micrometer-registry-prometheus</artifactId>
 * </dependency>
 *
 * 2. 暴露prometheus端点：
 * management:
 *   endpoints:
 *     web:
 *       exposure:
 *         include: prometheus,health,metrics
 *
 * 3. 访问：GET /actuator/prometheus
 *
 * 输出格式（Prometheus格式）：
 * # HELP http_server_requests_seconds HTTP请求耗时
 * # TYPE http_server_requests_seconds summary
 * http_server_requests_seconds_sum{uri="/api/users",method="GET"} 1234.567
 * http_server_requests_seconds_count{uri="/api/users",method="GET"} 5678
 *
 * # HELP jvm_memory_used_bytes JVM内存使用
 * # TYPE jvm_memory_used_bytes gauge
 * jvm_memory_used_bytes{area="heap",id="Eden Space"} 1.23E8
 */
```

---

## 七、实战：构建Spring Boot应用

### 7.1 完整项目结构

```
┌────────────────────────────────────────────────────────────────────┐
│                        Spring Boot项目结构                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  my-spring-boot-app/                                                │
│  │                                                                  │
│  ├─ pom.xml                                                         │
│  │                                                                  │
│  ├─ src/main/java/com/example/myapp/                              │
│  │   │                                                              │
│  │   ├─ MyApplication.java          # 主启动类                      │
│  │   │                                                              │
│  │   ├─ config/                      # 配置类                        │
│  │   │   ├─ AppConfig.java                                          │
│  │   │   ├─ WebMvcConfig.java                                       │
│  │   │   └─ SecurityConfig.java                                     │
│  │   │                                                              │
│  │   ├─ controller/                 # 控制器层                       │
│  │   │   ├─ UserController.java                                    │
│  │   │   └─ OrderController.java                                    │
│  │   │                                                              │
│  │   ├─ service/                    # 服务层                        │
│  │   │   ├─ UserService.java                                       │
│  │   │   └─ OrderService.java                                      │
│  │   │                                                              │
│  │   ├─ repository/                 # 数据访问层                    │
│  │   │   ├─ UserRepository.java                                    │
│  │   │   └─ OrderRepository.java                                    │
│  │   │                                                              │
│  │   ├─ entity/                     # 实体类                         │
│  │   │   ├─ User.java                                              │
│  │   │   └─ Order.java                                              │
│  │   │                                                              │
│  │   ├─ dto/                       # 数据传输对象                    │
│  │   │   ├─ UserDTO.java                                           │
│  │   │   └─ OrderDTO.java                                           │
│  │   │                                                              │
│  │   ├─ exception/                  # 异常处理                       │
│  │   │   ├─ GlobalExceptionHandler.java                            │
│  │   │   └─ BusinessException.java                                  │
│  │   │                                                              │
│  │   └─ util/                       # 工具类                        │
│  │       └─ JsonUtil.java                                           │
│  │                                                                  │
│  ├─ src/main/resources/              # 资源文件                     │
│  │   │                                                              │
│  │   ├─ application.yml              # 主配置文件                   │
│  │   ├─ application-dev.yml           # 开发环境配置                 │
│  │   ├─ application-prod.yml          # 生产环境配置                │
│  │   │                                                              │
│  │   ├─ mapper/                      # MyBatis映射文件             │
│  │   │   ├─ UserMapper.xml                                            │
│  │   │   └─ OrderMapper.xml                                           │
│  │   │                                                              │
│  │   └─ static/                      # 静态资源                     │
│  │       └─ css/, js/, images/                                       │
│  │                                                                  │
│  └─ src/test/java/                   # 测试代码                     │
│      └─ com/example/myapp/                                          │
│          ├─ service/                                                  │
│          └─ controller/                                               │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 主启动类

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Spring Boot主启动类
 *
 * @SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan
 *
 * - @Configuration: 标记为配置类
 * - @EnableAutoConfiguration: 启用自动配置
 * - @ComponentScan: 扫描当前包及子包的组件
 */
@SpringBootApplication
// 启用配置属性（用于@ConfigurationProperties）
@EnableConfigurationProperties
// 启用事务管理
@EnableTransactionManagement
// 启用缓存
@EnableCaching
// 启用异步
@EnableAsync
// 启用定时任务
@EnableScheduling
public class MyApplication {

    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(MyApplication.class, args);
    }

    /**
     * SpringApplication.run() 执行流程：
     *
     * 1. 创建SpringApplication对象
     *    - 判断应用类型（Servlet/Reactive/None）
     *    - 初始化BootstrapContext
     *    - 加载spring.factories中的ApplicationContextInitializer
     *
     * 2. 执行run()方法
     *    - 获取并启动监听器
     *    - 创建并配置Environment
     *    - 创建ApplicationContext
     *    - 准备ApplicationContext（加载Bean定义）
     *    - 刷新ApplicationContext（执行BeanFactory后处理器）
     *    - 结束
     *
     * ┌─────────────────────────────────────────────────────────────┐
     * │                  SpringApplication.run()流程                  │
     * ├─────────────────────────────────────────────────────────────┤
     * │                                                              │
     * │  SpringApplication.run()                                     │
     * │       │                                                      │
     * │       ▼                                                      │
     * │  ┌─────────────────────────────────────────────────────────┐ │
     * │  │ 1. 创建SpringApplication对象                           │ │
     * │  │    - 判断应用类型                                       │ │
     * │  │    - 加载initializers                                  │ │
     * │  │    - 加载listeners                                     │ │
     * │  └─────────────────────────────────────────────────────────┘ │
     * │       │                                                      │
     * │       ▼                                                      │
     * │  ┌─────────────────────────────────────────────────────────┐ │
     * │  │ 2. 执行run()方法                                        │ │
     * │  │    ┌───────────────────────────────────────────────────┐ │ │
     * │  │    │ 2.1 启动StopWatch                                 │ │ │
     * │  │    │ 2.2 获取ConfigurableBootstrapContext             │ │ │
     * │  │    │ 2.3 加载SpringApplicationRunListeners            │ │ │
     * │  │    │ 2.4 准备Environment                              │ │ │
     * │  │    │ 2.5 打印Banner                                   │ │ │
     * │  │    │ 2.6 创建ApplicationContext                      │ │ │
     * │  │    │ 2.7 准备ApplicationContext                       │ │ │
     * │  │    │ 2.8 刷新ApplicationContext                       │ │ │
     * │  │    │ 2.9 执行Runners                                  │ │ │
     * │  │    │ 2.10 返回ApplicationContext                      │ │ │
     * │  │    └───────────────────────────────────────────────────┘ │ │
     * │  └─────────────────────────────────────────────────────────┘ │
     * │                                                              │
     * └─────────────────────────────────────────────────────────────┘
     */
}
```

### 7.3 全局异常处理

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 *
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 * - @ControllerAdvice: 作用于所有@Controller
 * - @ResponseBody: 返回JSON而非视图
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBusinessException(BusinessException e) {
        log.warn("业务异常：{}", e.getMessage());

        Map<String, Object> result = new HashMap<>();
        result.put("code", e.getCode());
        result.put("message", e.getMessage());
        result.put("timestamp", System.currentTimeMillis());

        return result;
    }

    /**
     * 处理参数校验异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();

        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("参数校验失败：{}", errors);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);
        result.put("message", "参数校验失败");
        result.put("errors", errors);
        result.put("timestamp", System.currentTimeMillis());

        return result;
    }

    /**
     * 处理绑定异常
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBindException(BindException e) {
        Map<String, String> errors = new HashMap<>();

        e.getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);
        result.put("message", "参数绑定失败");
        result.put("errors", errors);

        return result;
    }

    /**
     * 处理空指针异常
     */
    @ExceptionHandler(NullPointerException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleNullPointerException(NullPointerException e) {
        log.error("空指针异常", e);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("message", "服务器内部错误");
        result.put("timestamp", System.currentTimeMillis());

        return result;
    }

    /**
     * 处理所有未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleException(Exception e) {
        log.error("未知异常", e);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("message", "系统繁忙，请稍后再试");
        result.put("timestamp", System.currentTimeMillis());

        return result;
    }
}

/**
 * 自定义业务异常
 */
class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}

/*
 * 异常处理流程：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 *                      Spring MVC异常处理流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  请求 ──→ DispatcherServlet ──→ HandlerMapping找到Controller    │
│                              │                                    │
│                              ▼                                    │
│                       HandlerAdapter执行                          │
│                              │                                    │
│                    ┌────────┴────────┐                            │
│                    ▼                 ▼                            │
│               正常返回            抛出异常                          │
│                    │                 │                            │
│                    ▼                 ▼                            │
│           返回ModelAndView    ExceptionHandler处理                  │
│                              │                                    │
│                              ▼                                    │
│                    ┌─────────────────┐                            │
│                    │ 异常遍历匹配     │                            │
│                    │ @ExceptionHandler│                           │
│                    └─────────────────┘                            │
│                              │                                    │
│                              ▼                                    │
│                    返回错误响应（JSON）                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
*/
```

---

## 八、总结

### 8.1 Spring Boot核心要点

```
┌────────────────────────────────────────────────────────────────────┐
│                      Spring Boot知识图谱                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     IoC/DI容器                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ 控制反转  │  │ 依赖注入  │  │ Bean作用域│ │ Bean生命周期│      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                         AOP                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ 切面     │  │ 切入点    │  │ 通知     │  │ 连接点    │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                       事务管理                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ ACID特性 │  │ 传播行为  │  │ 隔离级别  │  │ 声明式事务│      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      自动配置                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ @Conditional│ │ @EnableAuto│ │ @Configuration│ │ starters │      │ │
│  │  │          │  │ Configuration│ │ Properties │ │          │      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      监控运维                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │ Actuator │  │ Endpoints │ │ 自定义指标 │ │ Prometheus│      │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 面试高频问题

| 问题 | 核心回答要点 |
|------|-------------|
| Spring Boot自动配置原理？ | @EnableAutoConfiguration + META-INF/spring.factories + @Conditional |
| IoC和DI的区别？ | IoC是思想，DI是实现方式 |
| Bean的生命周期？ | 实例化→属性填充→初始化→销毁 |
| AOP的应用场景？ | 日志、事务、安全、缓存、性能监控 |
| Spring事务传播行为？ | REQUIRED、REQUIRES_NEW、SUPPORTS等7种 |
| @Transactional失效场景？ | 非public方法、同一个类内部调用、异常被catch |
| 如何自定义Starter？ | 自动配置类 + spring.factories + @Conditional |
| Actuator有哪些端点？ | health、metrics、beans、env、mappings等 |

---

> 希望本文能帮助你深入理解Spring Boot企业级开发的核心技术！如果觉得有帮助，欢迎收藏和转发！
