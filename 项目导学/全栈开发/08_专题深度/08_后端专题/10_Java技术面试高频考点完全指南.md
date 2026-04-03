# Java技术面试高频考点完全指南

## 前言：面试不是背答案，是体系化理解

各位同学好，我是老王。今天我们聊聊Java技术面试那些事儿。

很多人觉得面试就是背题目、背答案。这其实是误区。面试官最讨厌的就是背书式回答——你把答案流利地背出来了，但是稍微追问一下就露馅了。

真正的面试是**体系化理解**。你需要对每个知识点有深入的理解，能用自己的话说出来，还能举一反三。

比如问到JVM，很多同学能背出"GC ROOT有哪几种"，但如果你追问"JVM是如何找到所有GC ROOT的"，很多人就答不上来了。这就是理解不深入的表现。

所以这篇文章不只是给你答案，更是要帮你建立对每个知识点的深入理解。

好了，开始正文。

---

## 第一章：JVM虚拟机深度解析

### 1.1 JVM整体架构

Java代码是如何运行的？我们先从整体架构说起：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Java源码 (.java)                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ javac 编译
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       字节码文件 (.class)                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ 类加载器 (ClassLoader)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        运行时数据区 (Runtime Data Area)         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│  │ 方法区    │ │ 堆区      │ │ 虚拟机栈  │ │ 本地方法栈 │        │
│  │ (Method   │ │ (Heap)    │ │ (VM Stack)│ │(Native    │        │
│  │  Area)   │ │           │ │           │ │  Method   │        │
│  │           │ │           │ │           │ │  Stack)  │        │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
│                                                                 │
│  ┌───────────┐ ┌───────────┐                                   │
│  │ 程序计数器│ │  执行引擎  │                                   │
│  │ (PC Reg) │ │(Execution  │                                   │
│  │           │ │  Engine)  │                                   │
│  └───────────┘ └───────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

**运行时数据区详解**：

1. **程序计数器（PC Register）**
   - 每个线程独有，用于记录当前线程执行的字节码行号
   - 如果执行Native方法，值为undefined
   - 这是唯一一个不会出现OutOfMemoryError的区域

2. **虚拟机栈（VM Stack）**
   - 每个线程独有，描述Java方法执行的内存模型
   - 栈帧（Stack Frame）：每个方法调用都会创建一个栈帧
     - 局部变量表：存放方法参数和局部变量
     - 操作数栈：方法执行过程中的临时数据
     - 动态链接：指向常量池中该方法的符号引用
     - 返回地址：方法返回的位置
   - 常见异常：StackOverflowError（栈溢出）、OutOfMemoryError（内存溢出）

3. **本地方法栈（Native Method Stack）**
   - 与虚拟机栈类似，但是为Native方法服务
   - HotSpot虚拟机把虚拟机栈和本地方法栈合二为一

4. **堆（Heap）**
   - 所有线程共享，存储对象实例和数组
   - 是GC的主要管理区域
   - 可以分为新生代和老年代
   - 默认大小：物理内存的1/64

5. **方法区（Method Area）**
   - 所有线程共享，存储类信息（类名、访问修饰符、字段描述、方法描述等）
   - 还存储常量、静态变量、JIT编译后的代码
   - 在HotSpot中，方法区也叫"永久代"（但Java 8已经移除了永久代）

**为什么要移除永久代？**
- 永久代大小难确定，容易OOM
- 垃圾回收困难（类持有引用，难以回收）
- 字符串常量池移到堆中，更合理

**Java 8后的变化**：
- 永久代 → 元空间（Metaspace）
- 元空间使用直接内存，不再受JVM堆大小限制
- 字符串常量池移到堆中

### 1.2 类加载机制

类的生命周期：

```
加载(Loading) → 连接(Linking) → 初始化(Initialization)
                    ↓
              验证(Verification) → 准备(Preparation) → 解析(Resolution)
```

**1. 加载（Loading）**

通过类的全限定名获取定义类的二进制字节流，将字节流转化为方法区的运行时数据结构，在堆中生成Class对象。

**2. 连接（Linking）**

- **验证**：确保Class文件的字节流符合虚拟机要求
  - 文件格式验证
  - 元数据验证
  - 字节码验证
  - 符号引用验证

- **准备**：为类变量分配内存，设置初始值
  ```java
  // 在准备阶段，以下代码中 value 的初始值是 0，而不是 10
  public static int value = 10;

  // 如果是常量（static final），则在编译时就确定值，准备阶段直接赋值
  public static final int VALUE = 10;
  ```

- **解析**：将常量池中的符号引用替换为直接引用
  - 符号引用：用一组符号描述所引用的目标
  - 直接引用：直接指向目标的指针、相对偏移量

**3. 初始化（Initialization）**

执行类构造器`<clinit>()`方法，完成静态变量的赋值和静态代码块的执行。

**类加载器分类**：

1. **Bootstrap ClassLoader（启动类加载器）**
   - 用C++实现，是JVM的一部分
   - 加载`$JAVA_HOME/lib`目录下的核心类库

2. **Extension ClassLoader（扩展类加载器）**
   - Java实现，继承自ClassLoader
   - 加载`$JAVA_HOME/lib/ext`目录下的类

3. **Application ClassLoader（应用类加载器）**
   - Java实现，继承自ClassLoader
   - 加载classpath下的类

4. **自定义类加载器**
   - 用户自定义，继承ClassLoader
   - 用于加载非标准来源的类（如网络、加密文件等）

**双亲委派模型**：

```
用户自定义类加载器
         ↓
Application ClassLoader
         ↓
 Extension ClassLoader
         ↓
 Bootstrap ClassLoader
```

**工作原理**：类加载请求向上传递，直到父类加载器，只有父类加载器无法完成时，才由自己加载。

**为什么要双亲委派？**
1. 防止重复加载：父类已加载的类不需要子类再加载
2. 保证安全：核心类库只能由启动类加载器加载，防止核心API被篡改
3. 保证类的统一性：同一个类只会被加载一次

**破坏双亲委派的情况**：
1. JDBC驱动加载：SPI机制（Service Provider Interface）
2. OSGi模块化框架
3. 热部署/热加载技术

### 1.3 垃圾回收（GC）机制

#### 1.3.1 判断对象是否可回收

**引用计数法**：给对象添加引用计数器，引用+1，引用失效-1，计数器为0则可回收。
- 优点：实现简单，效率高
- 缺点：无法处理循环引用（两个对象互相引用）

**可达性分析**：通过GC ROOT对象向下搜索，形成引用链，不在引用链上的对象可回收。

**GC ROOT对象包括**：
1. 虚拟机栈中引用的对象（栈帧中的本地变量表）
2. 方法区中静态属性引用的对象
3. 方法区中常量引用的对象
4. 本地方法栈中JNI（Native方法）引用的对象
5. JVM内部引用（系统类加载器、垃圾回收器等）
6. 同步锁（synchronized）持有的对象

**引用类型**：
- **强引用**：`Object obj = new Object()`，永远不会回收
- **软引用**：SoftReference，内存不足时回收
- **弱引用**：WeakReference，下次GC时回收
- **虚引用**：PhantomReference，不影响回收，用于跟踪对象被回收

#### 1.3.2 垃圾收集算法

**标记-清除算法（Mark-Sweep）**：

```
标记阶段：找出所有需要回收的对象并标记
清除阶段：统一回收所有被标记的对象
```

- 缺点：效率不高，会产生内存碎片

**复制算法（Copying）**：

将内存分为两块，每次只使用一块。GC时把存活对象复制到另一块，然后清除整块内存。

- 优点：简单高效，没有内存碎片
- 缺点：可用内存减半，浪费空间

**标记-整理算法（Mark-Compact）**：

```
标记阶段：找出所有需要回收的对象并标记
整理阶段：让存活对象向一端移动
清除阶段：清除端边界以外的内容
```

- 优点：没有内存碎片，利用率高
- 缺点：需要移动对象，效率较低

**分代收集算法**：

根据对象存活周期将内存分为新生代和老年代：
- 新生代：对象生命周期短，使用复制算法
- 老年代：对象生命周期长，使用标记-清除或标记-整理算法

```
┌─────────────────────────────────────┐
│               老年代                │
│         (标记-整理/标记-清除)         │
│           Old Generation             │
└───────────────┬─────────────────────┘
                │
┌───────────────┴─────────────────────┐
│             新生代                   │
│  ┌─────────┬─────────┬─────────┐    │
│  │ Eden    │ Survivor│ Survivor│    │
│  │  Eden区  │  From   │   To    │    │
│  │ (8/10)  │ (1/10)  │ (1/10)  │    │
│  └─────────┴─────────┴─────────┘    │
│           (复制算法)                  │
└─────────────────────────────────────┘
```

**新生代GC过程（Minor GC）**：
1. 对象首先在Eden区分配
2. Eden区满时，触发Minor GC
3. 存活的对象复制到Survivor From区
4. 年龄计数器+1
5. 当年龄达到阈值（默认15），对象进入老年代

**老年代GC过程（Major GC/Full GC）**：
- 触发条件：老年代空间不足、大对象直接进入老年代
- 速度比Minor GC慢10倍以上

#### 1.3.3 垃圾收集器

**Serial收集器**：单线程收集，Stop The World，Client模式默认
**ParNew收集器**：Serial的多线程版本，Server模式首选
**Parallel Scavenge收集器**：吞吐量优先，可控制吞吐量

**CMS收集器**：并发标记清除
- 初始标记：Stop The World，标记GC ROOT直接关联的对象
- 并发标记：并发追踪引用链
- 重新标记：Stop The World，修正并发标记期间变动
- 并发清除：并发清除未标记对象

**G1收集器**：Garbage First
- 将堆划分为多个大小相等的Region
- 优先收集价值最大的Region
- 可预测停顿时间
- 整体是标记-整理，局部是复制

**ZGC收集器**：低延迟垃圾收集器
- 通过着色指针实现并发标记和整理
- 停顿时间不超过10ms

### 1.4 性能调优

**JVM常用参数**：

```bash
# 堆设置
-Xms2g        # 初始堆大小
-Xmx2g        # 最大堆大小
-Xmn1g        # 新生代大小
-XX:MetaspaceSize=256m   # 元空间初始大小
-XX:MaxMetaspaceSize=512m # 元空间最大大小

# 垃圾收集器设置
-XX:+UseSerialGC    # Serial收集器
-XX:+UseParallelGC  # Parallel收集器
-XX:+UseConcMarkSweepGC  # CMS收集器
-XX:+UseG1GC        # G1收集器

# GC日志设置
-Xlog:gc*:file=gc.log   # 输出GC日志到文件
-XX:+PrintGCDetails  # 打印GC详细日志
```

**常见问题排查**：
1. **CPU 100%**：找出占用CPU的线程，`jstack`查看线程堆栈
2. **内存溢出（OOM）**：`jmap -heap`查看堆内存，`jmap -dump`导出堆转储文件
3. **频繁Full GC**：分析对象年龄分布，调整内存分配

---

## 第二章：并发编程深度解析

### 2.1 线程基础

**进程与线程**：
- 进程：资源分配的基本单位，有独立的内存空间
- 线程：CPU调度的基本单位，共享进程的内存空间

**线程创建方式**：
```java
// 方式1：继承Thread类
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程执行");
    }
}

// 方式2：实现Runnable接口
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程执行");
    }
}

// 方式3：实现Callable接口（可以返回结果）
class MyCallable implements Callable<String> {
    @Override
    public String call() {
        return "结果";
    }
}

// 使用
Thread t1 = new MyThread();
Thread t2 = new Thread(new MyRunnable());
FutureTask<String> task = new FutureTask<>(new MyCallable());
Thread t3 = new Thread(task);
```

**线程状态转换**：

```
NEW（新建）→ RUNNABLE（就绪）→ RUNNING（运行）→ TERMINATED（终止）
                    ↑              │
                    │              ▼
                WAITING（等待）◀────┘
                    ↑
BLOCKED（阻塞）←────┘
```

- **NEW**：线程创建但未启动
- **RUNNABLE**：调用start()后，等待CPU调度
- **RUNNING**：获得CPU，正在执行
- **BLOCKED**：等待获取锁
- **WAITING**：wait()、join()、park()后
- **TIMED_WAITING**：sleep()、wait(timeout)、join(timeout)等

### 2.2 synchronized关键字

**synchronized实现原理**：

synchronized通过monitorenter和monitorexit指令实现。

```java
public class SyncDemo {
    // 同步代码块 - 锁对象
    public void method1() {
        synchronized (this) {
            // 同步代码
        }
    }

    // 同步方法 - 锁当前实例
    public synchronized void method2() {
        // 同步代码
    }

    // 静态同步方法 - 锁类对象
    public static synchronized void method3() {
        // 同步代码
    }
}
```

**锁的膨胀升级**：

1. **无锁**：无同步
2. **偏向锁**：只有一个线程进入同步代码块，轻量级
3. **轻量级锁**：多个线程交替进入同步代码块，自旋等待
4. **重量级锁**：多个线程同时竞争，阻塞等待

**为什么有锁升级？**
- 目的是为了提升性能
- 偏向锁：在无竞争情况下，消除同步开销
- 轻量级锁：在竞争不激烈时，用自旋代替阻塞
- 重量级锁：竞争激烈时，自旋也会消耗CPU，不如阻塞

### 2.3 volatile关键字

**volatile的作用**：
1. **保证可见性**：一个线程修改了volatile变量，其他线程立即能看到
2. **禁止指令重排序**：防止编译器和CPU重排序

**可见性问题**：

```java
public class VisibilityDemo {
    // 普通变量
    private static boolean running = true;

    // 线程1：写入
    public void start() {
        running = false;  // 写入主内存
    }

    // 线程2：读取
    public void run() {
        while (running) {  // 可能一直读取本地缓存
            // ...
        }
    }
}
```

问题：线程2可能一直读取的是本地缓存中的值，看不到线程1的更新。

**volatile保证可见性的原理**：
- 写操作后，强制刷新到主内存
- 读操作前，强制从主内存读取

**指令重排序问题**：

```java
// Double Check Lock单例模式
public class Singleton {
    private static Singleton instance;

    public static Singleton getInstance() {
        if (instance == null) {  // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) {  // 第二次检查
                    instance = new Singleton();  // 3步：分配内存、调用构造、赋值
                }
            }
        }
        return instance;
    }
}
```

问题：`instance = new Singleton()`可能重排序为：分配内存→赋值→调用构造。如果在赋值后、构造前，另一个线程看到instance!=null，就会使用一个未构造完成的对象。

**volatile禁止重排序的原理**：
- 在volatile写操作前插入StoreStore屏障
- 在volatile写操作后插入StoreLoad屏障
- 在volatile读操作前插入LoadLoad屏障
- 在volatile读操作后插入LoadStore屏障

### 2.4 JUC并发工具类

**CountDownLatch**：倒计时门栓

```java
// 等待多个任务完成
public class Demo {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);

        for (int i = 0; i < 3; i++) {
            new Thread(() -> {
                // 任务执行
                System.out.println("任务完成");
                latch.countDown();  // 计数-1
            }).start();
        }

        latch.await();  // 等待计数为0
        System.out.println("所有任务完成，继续执行");
    }
}
```

**CyclicBarrier**：循环栅栏

```java
// 等待所有线程到达栅栏点
public class Demo {
    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(3, () -> {
            System.out.println("所有线程到达栅栏，执行汇总任务");
        });

        for (int i = 0; i < 3; i++) {
            new Thread(() -> {
                // 任务1
                barrier.await();
                // 任务2（等所有人任务1都完成）
            }).start();
        }
    }
}
```

**Semaphore**：信号量

```java
// 控制并发数量
public class Demo {
    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(3);  // 同时最多3个线程

        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                try {
                    semaphore.acquire();  // 获取许可
                    // 执行业务逻辑
                    System.out.println("处理请求");
                    semaphore.release();  // 释放许可
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

**ReadWriteLock**：读写锁

```java
// 读多写少场景优化
public class Cache {
    private Map<String, Object> cache = new HashMap<>();
    private ReadWriteLock rwLock = new ReentrantReadWriteLock();

    // 读取不加锁，可以并发读
    public Object get(String key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // 写入需要独占锁
    public void put(String key, Object value) {
        rwLock.writeLock().lock();
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

### 2.5 线程池

**为什么要用线程池**：
1. 降低资源消耗：复用线程，避免频繁创建销毁
2. 提高响应速度：请求到达时可以直接复用已有线程
3. 提高线程的可管理性：统一分配、调优、监控

**线程池参数**：

```java
public ThreadPoolExecutor(
    int corePoolSize,      // 核心线程数
    int maximumPoolSize,    // 最大线程数
    long keepAliveTime,    // 空闲线程存活时间
    TimeUnit unit,          // 时间单位
    BlockingQueue<Runnable> workQueue,      // 任务队列
    ThreadFactory threadFactory,             // 线程工厂
    RejectedExecutionHandler handler         // 拒绝策略
)
```

**工作流程**：
1. 线程数 < corePoolSize：创建核心线程
2. 线程数 >= corePoolSize：加入任务队列
3. 队列满 && 线程数 < maximumPoolSize：创建临时线程
4. 队列满 && 线程数 >= maximumPoolSize：执行拒绝策略

**拒绝策略**：
- AbortPolicy：抛出RejectedExecutionException
- CallerRunsPolicy：用调用者线程执行
- DiscardPolicy：丢弃任务，不抛异常
- DiscardOldestPolicy：丢弃队列最旧的任务

**Executors工具类创建线程池的坑**：

```java
// 危险！可能OOM
ExecutorService fixed = Executors.newFixedThreadPool(100);  // 无界队列，可能堆积
ExecutorService cached = Executors.newCachedThreadPool();  // 最大Integer.MAX，可能创建过多线程
ExecutorService single = Executors.newSingleThreadExecutor();  // 单线程+无界队列

// 推荐使用 ThreadPoolExecutor 手动创建
ExecutorService executor = new ThreadPoolExecutor(
    10, 20, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),
    new ThreadFactoryBuilder().setNameFormat("task-%d").build(),
    new ThreadPoolExecutor.AbortPolicy()
);
```

---

## 第三章：Spring源码深度解析

### 3.1 Spring核心概念

**IoC（控制反转）**：
- 把对象的创建和依赖关系的管理从程序代码中移出，交给Spring容器
- 目的：降低耦合度
- 实现：DI（依赖注入）

**DI（依赖注入）**：
- 构造函数注入
- Setter注入
- 字段注入（@Autowired）

```java
@Service
public class UserService {
    // 字段注入（不推荐，难以测试）
    @Autowired
    private UserMapper userMapper;

    // 构造函数注入（推荐）
    private final UserMapper userMapper;

    @Autowired  // Java 16+ 可以省略
    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
}
```

**Bean生命周期**：

```
实例化 → 属性赋值 → 初始化 → 销毁
   ↓         ↓         ↓
BeanNameAware  BeanFactoryAware   DisposableBean
BeanFactoryAware    InitializingBean  init-method
ApplicationContextAware   init-method   destroy-method
```

### 3.2 Spring循环依赖

**什么是循环依赖**：
```java
@Service
public class A {
    @Autowired
    private B b;
}

@Service
public class B {
    @Autowired
    private A a;
}
```

**Spring解决循环依赖的原理**：

三级缓存：
1. singletonObjects：一级缓存，存放完全初始化好的Bean
2. earlySingletonObjects：二级缓存，存放早期暴露的Bean（未完成属性注入）
3. singletonFactories：三级缓存，存放Bean的ObjectFactory

**解决流程**：
1. 创建A，属性注入时发现需要B
2. 去创建B，属性注入时发现需要A
3. 去一级缓存找A，没找到
4. 去三级缓存找到A的ObjectFactory，获取早期A（放入二级缓存）
5. B完成创建，存入一级缓存
6. 回到A的创建，注入B
7. A完成创建

**为什么二级缓存存在**？
- 防止三级缓存中同一个Bean创建多个早期引用
- 三级缓存每次调用ObjectFactory都会创建新对象

**构造器循环依赖无法解决**：
- 构造器注入在实例化阶段就需要注入，无法通过三级缓存解决
- Spring默认不支持，会抛出BeanCurrentlyInCreationException

**解决方案**：
1. 使用Setter注入代替构造器注入
2. 使用@Lazy延迟加载
3. 使用ObjectProvider
4. 重新设计依赖关系

### 3.3 Spring事务

**@Transactional失效场景**：
1. 方法非public：Spring代理无法拦截
2. 自调用：同类内部方法调用，绕过了代理
3. 异常被catch吞掉：事务基于异常回滚，吞掉异常=不回滚
4. 异常类型不匹配：默认只回滚RuntimeException和Error
5. 传播行为问题：PROPAGATION_REQUIRES_NEW等导致事务失效

**事务传播行为**：
```java
// REQUIRED：加入当前事务，如果没有则创建新事务（默认）
// REQUIRES_NEW：创建新事务，挂起当前事务
// NESTED：嵌套事务，在当前事务中嵌套子事务
// SUPPORTS：支持当前事务，如果没有则以非事务执行
// NOT_SUPPORTED：以非事务执行，挂起当前事务
// MANDATORY：必须在事务中执行，否则抛异常
// NEVER：以非事务执行，如果存在事务则抛异常
```

---

## 第四章：MySQL优化深度解析

### 4.1 索引数据结构

**为什么不用Hash表**：
- Hash索引只适合等值查询，不适合范围查询
- 无法利用索引排序
- 可能产生Hash冲突

**为什么用B+Tree**：
- B+Tree是多叉平衡树，查询效率稳定O(log n)
- 叶子节点存储所有数据，非叶子节点只存储索引
- 叶子节点通过指针连接，支持范围查询和顺序遍历
- 更扁平，树层数更少，IO次数更少

**InnoDB索引特点**：
- 主键索引（聚簇索引）：叶子节点存储完整数据
- 非主键索引（二级索引）：叶子节点存储主键值

### 4.2 SQL优化

**EXPLAIN分析**：

```sql
EXPLAIN SELECT * FROM user WHERE name = '张三';
```

关键字段：
- **type**：访问类型
  - system > const > eq_ref > ref > range > index > ALL
  - ref或range以上比较好
- **key**：实际使用的索引
- **Extra**：
  - Using index：覆盖索引
  - Using where：回表查询
  - Using filesort：需要额外排序
  - Using temporary：使用临时表

**SQL优化技巧**：

1. **避免SELECT ***：只查需要的字段，减少网络传输，充分利用覆盖索引

2. **避免函数操作**：
```sql
-- 错误：索引失效
WHERE YEAR(create_time) = 2024

-- 正确：使用范围查询
WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'
```

3. **使用合理的数据类型**：
- 整型比字符串高效
- 定长char比varchar效率高
- 主键使用自增或雪花ID

4. **批量操作**：
```java
// 错误：1000次SQL
for (User user : users) {
    userMapper.insert(user);
}

// 正确：批量插入
userMapper.batchInsert(users);
```

### 4.3 事务隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|---------|-----|----------|-----|
| Read Uncommitted | 可能 | 可能 | 可能 |
| Read Committed | 不可能 | 可能 | 可能 |
| Repeatable Read | 不可能 | 不可能 | 可能 |
| Serializable | 不可能 | 不可能 | 不可能 |

**MySQL默认隔离级别**：Repeatable Read
**MVCC**：多版本并发控制，通过ReadView实现

### 4.4 分库分表

**垂直拆分**：
- 拆表：按业务把字段分到不同表
- 拆库：按业务把表分到不同数据库

**水平拆分**：
- 按某个字段（如user_id）取模分片
- 按时间分片
- 一致性哈希分片

**分片键选择**：
- 选择查询最频繁的字段
- 避免数据倾斜（热点数据）
- 考虑跨分片查询问题

**跨分片查询**：
- 多次查询后在内存聚合
- 使用ES/Hive做聚合查询
- 冗余数据到ES

---

## 第五章：Redis缓存深度解析

### 5.1 Redis数据类型

| 类型 | 底层实现 | 适用场景 |
|------|---------|---------|
| String | SDS（简单动态字符串） | 缓存、计数器、分布式锁 |
| List | QuickList（压缩列表+双向链表） | 队列、消息流、最新列表 |
| Set | IntSet或HashTable | 去重、标签、好友关系 |
| ZSet | 压缩列表或跳表 | 排行榜、延时队列 |
| Hash | 压缩列表或HashTable | 对象缓存、购物车 |

### 5.2 Redis持久化

**RDB（Redis Database）**：
- 定时生成数据快照
- 优点：恢复快，文件紧凑
- 缺点：可能丢失最后一次快照后的数据

**AOF（Append Only File）**：
- 记录每个写命令
- 优点：数据安全性高
- 缺点：文件比RDB大，恢复慢

**混合持久化**（Redis 4.0+）：
- 同时使用RDB和AOF
- RDB做全量，AOF做增量

### 5.3 Redis缓存问题

**缓存穿透**：
- 查询不存在的数据，每次都打到数据库
- 解决方案：布隆过滤器、缓存空值

**缓存击穿**：
- 热点key过期，瞬间大量请求打到数据库
- 解决方案：互斥锁、永不过期+异步更新

**缓存雪崩**：
- 大量key同时过期，请求打到数据库
- 解决方案：过期时间加随机值、热点数据不过期

### 5.4 分布式锁

```java
public class RedisLock {
    private StringRedisTemplate template;

    public boolean tryLock(String key, String value, long timeout) {
        // SET key value NX PX timeout
        Boolean result = template.opsForValue()
            .setIfAbsent(key, value, timeout, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }

    public void unlock(String key, String value) {
        // 释放锁时验证value，防止误删他人的锁
        String currentValue = template.opsForValue().get(key);
        if (value.equals(currentValue)) {
            template.delete(key);
        }
    }
}
```

**注意**：普通Redis分布式锁不是绝对安全的，如果需要高可靠，使用Redisson或RedLock算法。

---

## 第六章：分布式问题深度解析

### 6.1 CAP理论

**一致性（Consistency）**：数据在多个副本之间保持一致
**可用性（Availability）**：每次请求都能获得响应
**分区容错性（Partition tolerance）**：系统容忍网络分区

**三选其二**：在分布式系统中，网络分区不可避免，所以只能在C和A之间权衡。

- **CP系统**：放弃可用性，保证一致性（如Zookeeper、HBase）
- **AP系统**：放弃一致性，保证可用性（如Eureka、Cassandra）

**注意**：CAP不是说三选二，而是在网络分区发生时，只能在C和A之间选择。正常情况下，可以同时保证CA。

### 6.2 BASE理论

**基本可用（Basically Available）**：允许系统暂时降级
**软状态（Soft state）**：允许数据存在中间状态
**最终一致性（Eventually consistent）**：最终达到一致

**BASE是对CAP中一致性和可用性权衡的结果**，是分布式系统追求的目标。

### 6.3 一致性Hash算法

**普通Hash的问题**：
```java
// 按 key.hashCode() % N 取模
// 当N变化时（扩容或缩容），所有数据需要重新分布
```

**一致性Hash环**：
```
                    ┌──────┐
                    │ 节点A │
                    └──┬───┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
    │  节点B │    │  节点C │    │  节点D │
    └───┬────┘    └─────────┘    └─────────┘
        │
        ▼
   一致性Hash环（0 ~ 2^32）
```

**虚拟节点**：为了解决数据倾斜问题，引入虚拟节点
- 每个物理节点对应多个虚拟节点
- 虚拟节点均匀分布在环上

### 6.4 分布式ID生成

**雪花算法**：
```java
// 64位ID结构：
// 1位：符号位（固定0）
// 41位：时间戳（毫秒）
// 10位：机器ID（5位数据中心 + 5位机器ID）
// 12位：序列号（每毫秒递增）

public class SnowflakeIdGenerator {
    private final long twepoch = 1609459200000L;  // 2021-01-01
    private final long workerIdBits = 5L;
    private final long datacenterIdBits = 5L;
    private final long sequenceBits = 12L;

    private final long maxWorkerId = ~(-1L << workerIdBits);
    private final long maxDatacenterId = ~(-1L << datacenterIdBits);
    private final long sequenceMask = ~(-1L << sequenceBits);

    public synchronized long nextId() {
        long timestamp = timeGen();

        if (timestamp < lastTimestamp) {
            throw new RuntimeException("Clock moved backwards");
        }

        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) {
                timestamp = tilNextMillis();
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - twepoch) << 22)
            | (datacenterId << 17)
            | (workerId << 12)
            | sequence;
    }
}
```

### 6.5 分布式事务

**Seata AT模式**：
1. TM（事务管理器）发起全局事务，获取XID
2. RM（资源管理器）注册分支事务
3. 各分支执行SQL，生成undo log
4. TM判断是否提交/回滚
5. 如果提交，删除undo log；如果回滚，根据undo log恢复

**RocketMQ事务消息**：
1. 发送半消息（Half Message）
2. 执行本地事务
3. 发送确认/回滚消息
4. MQ回调确认本地事务结果

---

## 第七章：微服务架构

### 7.1 服务注册与发现

**Eureka**：
- 心跳机制：客户端每30秒发送心跳，服务端90秒没收到则剔除
- 自我保护：网络分区时停止剔除，避免误杀

**Nacos**：
- 支持CP和AP模式切换
- 支持临时实例和永久实例
- 支持配置管理

### 7.2 服务调用

**Feign**：
- 声明式HTTP客户端
- 通过注解定义接口，自动生成代理

**Ribbon**：
- 客户端负载均衡
- 支持多种负载策略：轮询、随机、加权

### 7.3 服务容错

**Sentinel**：
- 流量控制：QPS、并发数控制
- 熔断降级：慢调用比例、异常比例
- 热点参数：参数级别的限流

**Hystrix**（已停止维护）：
- 线程池隔离
- 信号量隔离
- 熔断器模式

### 7.4 配置中心

**Spring Cloud Config**：
- 支持Git存储配置
- 支持配置刷新
- 支持配置加密

**Nacos**：
- 配置管理 + 服务发现
- 配置变更监听
- 配置历史版本

---

## 第八章：设计模式

### 8.1 单例模式

```java
// 双重检查锁
public class Singleton {
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

**为什么要volatile**：
- 防止指令重排序
- 确保instance完全初始化后再赋值

### 8.2 工厂模式

```java
// 简单工厂
public class ProductFactory {
    public static Product create(String type) {
        switch (type) {
            case "A": return new ProductA();
            case "B": return new ProductB();
            default: throw new IllegalArgumentException();
        }
    }
}

// 抽象工厂
public interface AbstractFactory {
    ProductA createA();
    ProductB createB();
}
```

### 8.3 策略模式

```java
public interface SortStrategy {
    void sort(List<Integer> list);
}

public class QuickSort implements SortStrategy {
    @Override
    public void sort(List<Integer> list) {
        // 快速排序实现
    }
}

public class Context {
    private SortStrategy strategy;

    public void setStrategy(SortStrategy strategy) {
        this.strategy = strategy;
    }

    public void sort(List<Integer> list) {
        strategy.sort(list);
    }
}
```

---

## 结语

好了，Java技术面试高频考点就讲到这里。

这篇文章涵盖了Java后端面试中最核心的知识点：JVM、并发、Spring、MySQL、Redis、分布式、微服务、设计模式。

但记住，面试不是背书，而是要真正理解这些技术背后的原理。建议大家在学习的时候：

1. **动手实践**：光看不动手，永远学不会
2. **深入原理**：不要只停留在"会用"的层面
3. **形成体系**：把知识点串联起来，形成自己的知识网络
4. **总结输出**：用自己的话把知识讲出来，这才是真正的理解

祝大家面试顺利，拿下心仪的Offer！

如果觉得有帮助，欢迎转发给需要的朋友。
