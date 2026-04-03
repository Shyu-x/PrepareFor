# CPU缓存与并发基础

## 前言：为什么需要缓存？

想象你在一间大公司的仓库工作。仓库非常大，东西存在几十米高的货架上。

如果每次有人要一个螺丝钉，你都要跑到仓库最里面的 C-17 区去找，那效率就太低了。更高效的做法是：

1. 在工作台旁边放一个小盒子（**L1 缓存**）
2. 在仓库入口附近放一个推车（**L2 缓存**）
3. 需要更多东西时再去大仓库（**内存**）
4. 仓库里都没有？那就要去订货（**磁盘/网络**）

这就是 CPU 缓存的层级思想。

---

## 第一章：CPU 缓存架构

### 1.1 缓存层级

现代 CPU 通常有三级缓存：

```
CPU 缓存层级结构：

┌─────────────────────────────────────────────────────────────┐
│                         CPU 核心                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   寄存器 (Registers)                │    │
│  │    几千字节，访问只需 1 个时钟周期                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▲                                 │
│                           │ 极快                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 L1 缓存 (一级缓存)                   │    │
│  │    32-64 KB，访问需要 ~4 个时钟周期                   │    │
│  │    分为指令缓存(I-L1)和数据缓存(D-L1)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▲                                 │
│                           │ 快                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 L2 缓存 (二级缓存)                   │    │
│  │    256KB-1MB，访问需要 ~10-20 个时钟周期              │    │
│  │    通常每核心独立，或两个核心共享                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▲                                 │
│                           │ 中等                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 L3 缓存 (三级缓存)                   │    │
│  │    8MB-64MB，访问需要 ~40-100 个时钟周期              │    │
│  │    所有核心共享                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▲                                 │
│                           │ 慢（相对）                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      内存 (DRAM)                      │    │
│  │    8GB-256GB，访问需要 ~100-300 个时钟周期             │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▲                                 │
│                           │ 极慢                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    磁盘/SSD                          │    │
│  │    几百 GB - 几 TB                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 缓存行（Cache Line）

CPU 缓存的最小管理单位是**缓存行**，通常是 64 字节：

```
缓存行结构（64 字节）：

┌────────────────────────────────────────────────────────────────┐
│                    缓存行（64 字节）                          │
├────────────────────────────────────────────────────────────────┤
│ Tag（标签）│ Valid │ Age │        Data（64-8=56 字节）       │
└────────────────────────────────────────────────────────────────┘

- Tag：用于匹配内存地址
- Valid：标记这行数据是否有效
- Age：用于 LRU 替换算法
- Data：实际数据（但通常存储单元是字节）

地址映射：

内存地址 (64位)：
[............][........][......]
    Tag        Index    Offset

- Offset: 6位 (2^6 = 64字节，一个缓存行的大小)
- Index: 若干位（取决于缓存大小和组数）
- Tag: 剩余位（用于区分同 Index 的不同内存块）
```

### 1.3 缓存映射方式

#### 直接映射（Direct Mapped）

```
直接映射：
每个内存块只能映射到缓存的特定位置

内存地址到缓存的映射：
┌─────────────────────────────────────────────────────────────┐
│  内存块 0 ──► 缓存行 0                                       │
│  内存块 1 ──► 缓存行 1                                       │
│  内存块 2 ──► 缓存行 2                                       │
│  ...                                                        │
│  内存块 N ──► 缓存行 (N mod 行数)                           │
└─────────────────────────────────────────────────────────────┘

优点：查找简单快速
缺点：容易冲突（两个常用块映射到同一行）
```

#### 组相联（Set Associative）

```
4路组相联：
每组有4个缓存行，内存块可以放在组内的任意一行

┌─────────────────────────────────────────────────────────────┐
│  组 0: [行0] [行1] [行2] [行3] ← 4路                         │
│  组 1: [行0] [行1] [行2] [行3]                              │
│  组 2: [行0] [行1] [行2] [行3]                              │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘

查找：首先用 Index 找到组，然后在组内用 Tag 匹配

实际例子：
- L1D 通常是 8路或16路组相联
- L2 通常是 8路或16路组相联
- L3 通常是 12路或16路组相联
```

### 1.4 缓存的读写策略

```c
// 缓存写策略

// 1. 写直达（Write Through）
//    每次写入都同时写缓存和内存
void write_through(cache_t* cache, addr, data) {
    // 查找缓存行
    cache_line* line = find_cache_line(cache, addr);

    if (line && line->valid && line->tag == get_tag(addr)) {
        // 命中，更新缓存
        line->data = data;
    } else {
        // 未命中，更新缓存和内存
        line->data = data;
    }

    // 写入内存（同步）
    write_to_memory(addr, data);

    // 写直达的问题：每次写入都要写内存，速度慢
}

// 2. 写回（Write Back）
//    只写缓存，等到缓存行被替换时才写回内存
void write_back(cache_t* cache, addr, data) {
    cache_line* line = find_cache_line(cache, addr);

    if (line && line->valid && line->tag == get_tag(addr)) {
        // 命中，更新缓存，标记为脏
        line->data = data;
        line->dirty = 1;
    } else {
        // 未命中
        if (line && line->dirty) {
            // 行被占用且是脏的，先写回内存
            write_to_memory(line->addr, line->data);
        }
        // 加载新数据到缓存
        line->data = data;
        line->addr = addr;
        line->tag = get_tag(addr);
        line->dirty = 1;
    }

    // 不需要立即写内存
    // write_to_memory(addr, data);  ← 不执行

    // 写回的优点：减少内存写入，提高性能
}

// 3. 写入分配（Write Allocation）
//    未命中时，先把数据从内存加载到缓存，再更新

// 4. 非写入分配（Write No-Allocation）
//    未命中时，直接写入内存，不加载到缓存
```

---

## 第二章：MESI 缓存一致性协议

### 2.1 缓存一致性问题

在多核处理器中，每个核心有自己的缓存：

```
多核缓存一致性问题：

  核心 0               核心 1
┌─────────┐          ┌─────────┐
│  缓存   │          │  缓存   │
│ [X=1]   │          │ [X=1]   │  ← 两个缓存都认为 X=1
└────┬────┘          └────┬────┘
     │                    │
     └────────┬───────────┘
              ▼
      ┌──────────────┐
      │    内存      │
      │   X=1        │
      └──────────────┘

问题场景：
1. 核心 0 把 X 改成 2
2. 核心 1 的缓存还是 X=1
3. 核心 1 读取 X，得到的是旧值 1！

这就是缓存一致性问题
```

### 2.2 MESI 协议

**MESI** 是一种缓存一致性协议，用四个状态标记缓存行：

```
MESI 状态：

M (Modified) - 已修改
  - 缓存行被修改，与内存不一致
  - 独占此缓存行
  - 写回内存前不允许其他核心读取

E (Exclusive) - 独占
  - 缓存行有效，与内存一致
  - 只有当前核心持有此缓存行
  - 可以直接修改，不需要通知其他核心

S (Shared) - 共享
  - 缓存行有效，与内存一致
  - 多个核心可能同时持有此缓存行
  - 修改前需要先通知其他核心

I (Invalid) - 无效
  - 缓存行无效或不存在
  - 不能读写，需要重新加载
```

### 2.3 MESI 状态转换

```
MESI 协议状态图：

                    收到读请求
              ┌────────────────────────┐
              │                        │
              ▼                        │
        ┌──────────┐                   │
        │ Modified │◄──────────┐       │
        └────┬─────┘           │       │
              │                │       │
              │ CPU写入        │ Bus写回│
              │                │       │
              ▼                │       │
        ┌──────────┐           │       │
        │   (自)   │           │       │
        └────┬─────┘           │       │
              │                │       │
              │ 收到读请求     │       │
              │ (总线嗅探)     │       │
              ▼                │       │
        ┌──────────┐           │       │
        │ Exclusive│───────────┘       │
        └────┬─────┘                   │
              │                        │
              │ CPU写入或收到读请求    │
              ▼                        │
        ┌──────────┐                   │
        │ Modified │───────────────────┘
        └──────────┘    (刷新内存)

        ┌──────────┐
        │Exclusive│
        └────┬─────┘
              │
              │ 收到读请求或无效
              ▼
        ┌──────────┐
        │  Shared  │
        └────┬─────┘
              │
              │ 收到读请求（其他核）
              ▼
        ┌──────────┐
        │  (自)    │
        └──────────┘
        （继续 Shared）

状态转换示例：

场景1：核心 0 读取变量 X（初始 I）
  → 发送读请求到总线
  → 其他核心如果没有副本，返回内存数据
  → 核心 0 缓存变为 E（独占）

场景2：核心 1 也读取变量 X
  → 发送读请求到总线
  → 核心 0 嗅探到请求，响应共享
  → 核心 0 变为 S，核心 1 也是 S

场景3：核心 0 修改 X
  → 核心 0 发现是 S 状态
  → 发送无效化请求到总线
  → 核心 1 收到无效化，把自己的 X 行置为 I
  → 核心 0 变为 M（已修改）

场景4：核心 0 写回 X 到内存
  → 核心 0 把 X 写入内存
  → 状态变为 E
```

### 2.4 MESI 的代码示例

```c
// 模拟 MESI 协议的简化实现

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum {
    MESI_INVALID = 0,
    MESI_SHARED,
    MESI_EXCLUSIVE,
    MESI_MODIFIED
} mesi_state_t;

typedef struct {
    int core_id;
    int cache_line_id;
    mesi_state_t state;
    int data;
} cache_entry_t;

#define NUM_CORES 2
#define CACHE_SIZE 8

// 模拟的缓存
cache_entry_t caches[NUM_CORES][CACHE_SIZE];

// 总线消息类型
typedef enum {
    BUS_READ,
    BUS_READ_INVALIDATE,
    BUS_WRITE
} bus_msg_t;

// 总线（连接所有核心）
typedef struct {
    bus_msg_t msg;
    int addr;
    int requesting_core;
} bus_t;

bus_t bus;

// 初始化
void init_caches() {
    for (int i = 0; i < NUM_CORES; i++) {
        for (int j = 0; j < CACHE_SIZE; j++) {
            caches[i][j].state = MESI_INVALID;
            caches[i][j].core_id = i;
        }
    }
}

// 获取缓存行索引（简化：直接用地址）
int get_cache_index(int addr) {
    return addr % CACHE_SIZE;
}

// 发送总线消息
void send_bus_message(bus_msg_t msg, int addr, int core) {
    bus.msg = msg;
    bus.addr = addr;
    bus.requesting_core = core;

    // 通知所有其他核心（实际是硬件总线广播）
    for (int i = 0; i < NUM_CORES; i++) {
        if (i != core) {
            handle_bus_message(i);
        }
    }
}

// 处理总线消息
void handle_bus_message(int core_id) {
    int index = get_cache_index(bus.addr);
    cache_entry_t* entry = &caches[core_id][index];

    if (entry->state == MESI_INVALID) {
        // 无效行，不需要处理
        return;
    }

    // 检查地址是否匹配
    if (entry->cache_line_id != bus.addr) {
        return;
    }

    switch (bus.msg) {
        case BUS_READ:
            // 读请求：如果是 M 或 E，响应并变为 S
            if (entry->state == MESI_MODIFIED ||
                entry->state == MESI_EXCLUSIVE) {
                // 需要提供数据给请求者
                entry->state = MESI_SHARED;
            }
            break;

        case BUS_READ_INVALIDATE:
            // 读-无效：变为 Invalid
            if (entry->state == MESI_MODIFIED) {
                // 需要先写回内存（模拟）
                printf("核心 %d: 写回脏数据到内存\n", core_id);
            }
            entry->state = MESI_INVALID;
            break;

        case BUS_WRITE:
            // 写请求：变为 Invalid（如果有效）
            if (entry->state == MESI_MODIFIED) {
                printf("核心 %d: 写回脏数据到内存\n", core_id);
            }
            entry->state = MESI_INVALID;
            break;
    }
}

// CPU 读操作
int cpu_read(int core_id, int addr) {
    int index = get_cache_index(addr);
    cache_entry_t* entry = &caches[core_id][index];

    printf("核心 %d: 读地址 %d (行 %d, 状态 %s)\n",
           core_id, addr, index,
           entry->state == MESI_INVALID ? "I" :
           entry->state == MESI_SHARED ? "S" :
           entry->state == MESI_EXCLUSIVE ? "E" : "M");

    if (entry->state == MESI_INVALID) {
        // 缓存未命中，发送读请求
        send_bus_message(BUS_READ, addr, core_id);

        // 加载数据（模拟从内存加载）
        entry->data = addr * 100;  // 模拟数据
        entry->cache_line_id = addr;
        entry->state = MESI_EXCLUSIVE;

        printf("  → 未命中，从内存加载，变为 E\n");
    } else if (entry->state == MESI_SHARED ||
               entry->state == MESI_EXCLUSIVE) {
        printf("  → 命中，直接读取\n");
    } else if (entry->state == MESI_MODIFIED) {
        printf("  → 命中，但需要写回内存后读取\n");
        // 写回并变为 E
        entry->state = MESI_EXCLUSIVE;
    }

    return entry->data;
}

// CPU 写操作
void cpu_write(int core_id, int addr, int data) {
    int index = get_cache_index(addr);
    cache_entry_t* entry = &caches[core_id][index];

    printf("核心 %d: 写地址 %d = %d (行 %d, 状态 %s)\n",
           core_id, addr, data, index,
           entry->state == MESI_INVALID ? "I" :
           entry->state == MESI_SHARED ? "S" :
           entry->state == MESI_EXCLUSIVE ? "E" : "M");

    if (entry->state == MESI_INVALID) {
        // 未命中，需要先获取独占权
        send_bus_message(BUS_READ_INVALIDATE, addr, core_id);
        entry->cache_line_id = addr;
        entry->data = data;
        entry->state = MESI_MODIFIED;
        printf("  → 未命中，获取独占权，变为 M\n");
    } else if (entry->state == MESI_SHARED) {
        // 共享状态，需要使其他核心无效
        send_bus_message(BUS_READ_INVALIDATE, addr, core_id);
        entry->data = data;
        entry->state = MESI_MODIFIED;
        printf("  → S→M，无效其他核心\n");
    } else if (entry->state == MESI_EXCLUSIVE) {
        // 独占状态，直接修改
        entry->data = data;
        entry->state = MESI_MODIFIED;
        printf("  → E→M，直接修改\n");
    } else if (entry->state == MESI_MODIFIED) {
        printf("  → 已是 M，直接修改\n");
        entry->data = data;
    }
}

int main() {
    printf("=== MESI 缓存一致性协议模拟 ===\n\n");

    init_caches();

    // 场景1：核心 0 读取 X
    printf("【场景1】核心0读取地址100\n");
    cpu_read(0, 100);

    // 场景2：核心 1 读取同一个地址
    printf("\n【场景2】核心1读取地址100\n");
    cpu_read(1, 100);

    // 场景3：核心 0 写 X
    printf("\n【场景3】核心0写入地址100=999\n");
    cpu_write(0, 100, 999);

    // 场景4：核心 1 尝试读（应该得到新值或重新加载）
    printf("\n【场景4】核心1读取地址100\n");
    cpu_read(1, 100);

    return 0;
}
```

---

## 第三章：伪共享（False Sharing）

### 3.1 什么是伪共享？

**伪共享**是高性能计算中的一个重要概念。当两个核心访问**同一个缓存行**的不同变量时，即使操作完全独立，也会因为 MESI 协议导致性能下降。

```
伪共享问题：

假设有一个结构体：
struct Data {
    int counter0;  // 核心 0 访问
    int counter1;  // 核心 1 访问
};

问题：
┌─────────────────────────────────────────────────────────────┐
│                    缓存行（64 字节）                        │
├─────────────────────────────────────────────────────────────┤
│ [counter0: 4B] [counter1: 4B] [padding...剩余 56B]          │
└─────────────────────────────────────────────────────────────┘

如果 counter0 和 counter1 在同一缓存行：

1. 核心 0 修改 counter0
   → 缓存行变为 M 状态
   → 核心 1 的对应行变为 I（无效）

2. 核心 1 读取 counter1（自己的行已经无效！）
   → 需要重新从核心 0 或内存加载
   → 触发总线事务

3. 核心 1 修改 counter1
   → 核心 0 的行又变成无效

两个核心互相"干扰"，即使它们访问的是不同变量！
```

### 3.2 伪共享的代码演示

```c
// 伪共享问题演示

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>

// 紧凑结构体（可能导致伪共享）
struct TightData {
    volatile long counter0;  // volatile 防止编译器优化
    volatile long counter1;
};

// 使用缓存行填充避免伪共享
struct PaddedData {
    volatile long counter0;
    char pad[64 - sizeof(long)];  // 填充到缓存行大小
    volatile long counter1;
    char pad2[64 - sizeof(long)];
};

// 测试紧凑结构的性能
void* test_tight(void* arg) {
    struct TightData* data = (struct TightData*)arg;
    for (long i = 0; i < 100000000; i++) {
        data->counter0++;
        data->counter1++;
    }
    return NULL;
}

// 测试填充结构的性能
void* test_padded(void* arg) {
    struct PaddedData* data = (struct PaddedData*)arg;
    for (long i = 0; i < 100000000; i++) {
        data->counter0++;
        data->counter1++;
    }
    return NULL;
}

int main() {
    pthread_t t1, t2;
    struct timespec start, end;

    // 测试1：紧凑结构（可能伪共享）
    struct TightData tight = {0, 0};

    printf("=== 伪共享测试 ===\n\n");

    clock_gettime(CLOCK_MONOTONIC, &start);
    pthread_create(&t1, NULL, test_tight, &tight);
    pthread_create(&t2, NULL, test_tight, &tight);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    clock_gettime(CLOCK_MONOTONIC, &end);

    double tight_time = (end.tv_sec - start.tv_sec) +
                         (end.tv_nsec - start.tv_nsec) / 1e9;

    printf("【紧凑结构】（可能有伪共享）\n");
    printf("  counter0 = %ld, counter1 = %ld\n",
           tight.counter0, tight.counter1);
    printf("  总计数 = %ld\n", tight.counter0 + tight.counter1);
    printf("  耗时: %.2f 秒\n\n", tight_time);

    // 测试2：填充结构（避免伪共享）
    struct PaddedData padded = {0, 0};

    clock_gettime(CLOCK_MONOTONIC, &start);
    pthread_create(&t1, NULL, test_padded, &padded);
    pthread_create(&t2, NULL, test_padded, &padded);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    clock_gettime(CLOCK_MONOTONIC, &end);

    double padded_time = (end.tv_sec - start.tv_sec) +
                         (end.tv_nsec - start.tv_nsec) / 1e9;

    printf("【填充结构】（避免伪共享）\n");
    printf("  counter0 = %ld, counter1 = %ld\n",
           padded.counter0, padded.counter1);
    printf("  总计数 = %ld\n", padded.counter0 + padded.counter1);
    printf("  耗时: %.2f 秒\n\n", padded_time);

    printf("性能提升: %.1f%%\n",
           (tight_time - padded_time) / tight_time * 100);

    return 0;
}
```

### 3.3 Java 中的伪共享

```java
// Java 中避免伪共享

public class FalseSharingDemo {

    // 紧凑结构（可能伪共享）
    static class CounterTight {
        volatile long counter0 = 0;
        volatile long counter1 = 0;
    }

    // 使用 @Contended 注解（JDK 8+）
    // JVM 会自动填充来避免伪共享
    static class CounterPadded {
        @Contended volatile long counter0 = 0;
        @Contended volatile long counter1 = 0;
    }

    // 手动填充
    static class CounterManualPadding {
        volatile long counter0 = 0;
        long p0, p1, p2, p3, p4, p5, p6, p7;  // 填充
        volatile long counter1 = 0;
        long p8, p9, p10, p11, p12, p13, p14, p15;
    }

    public static void main(String[] args) throws InterruptedException {
        int iterations = 100_000_000;

        // 测试紧凑结构
        CounterTight tight = new CounterTight();
        long start = System.nanoTime();

        Thread t1 = new Thread(() -> {
            for (long i = 0; i < iterations; i++) {
                tight.counter0++;
            }
        });
        Thread t2 = new Thread(() -> {
            for (long i = 0; i < iterations; i++) {
                tight.counter1++;
            }
        });

        t1.start(); t2.start();
        t1.join(); t2.join();

        long tightTime = System.nanoTime() - start;

        // 测试手动填充
        CounterManualPadding padded = new CounterManualPadding();
        start = System.nanoTime();

        t1 = new Thread(() -> {
            for (long i = 0; i < iterations; i++) {
                padded.counter0++;
            }
        });
        t2 = new Thread(() -> {
            for (long i = 0; i < iterations; i++) {
                padded.counter1++;
            }
        });

        t1.start(); t2.start();
        t1.join(); t2.join();

        long paddedTime = System.nanoTime() - start;

        System.out.println("=== Java 伪共享测试 ===");
        System.out.println("紧凑结构耗时: " + tightTime / 1e9 + " 秒");
        System.out.println("填充结构耗时: " + paddedTime / 1e9 + " 秒");
        System.out.println("性能提升: " +
            (tightTime - paddedTime) * 100.0 / tightTime + "%");
    }
}
```

---

## 第四章：内存屏障（Memory Barrier）

### 4.1 为什么需要内存屏障？

现代 CPU 和编译器会进行各种优化，这些优化有时候会改变代码的预期行为：

```c
// 编译器和 CPU 重排序问题

volatile int ready = 0;
int data = 0;

// 线程 1
void producer() {
    data = 42;      // 1. 写入数据
    ready = 1;      // 2. 标记 ready
}

// 线程 2
void consumer() {
    if (ready) {    // 3. 检查 ready
        // 问题：data 可能还是 0！
        assert(data == 42);
    }
}

/*
 * 可能发生的重排序：
 *
 * 1. 编译器重排序：
 *    编译器可能认为这两句没有依赖，重新排序
 *    → 先 ready=1，后 data=42
 *
 * 2. CPU 重排序：
 *    即使编译器不重排序，CPU 执行时也可能先执行后一条
 *    → 因为 CPU 可以乱序发射指令
 *
 * 3. 缓存问题：
 *    写入操作可能先到 store buffer
 *    另一线程看到 ready=1 时，data 可能还没写入内存
 */
```

### 4.2 内存屏障的类型

```c
// 内存屏障的四种类型

/*
 * 1. Store Barrier（写屏障）
 *    - 确保屏障前的所有 store 在屏障后的 store 之前完成
 *    - 刷新 store buffer 到内存
 *
 * 2. Load Barrier（读屏障）
 *    - 确保屏障后的所有 load 在屏障前的 load 之后执行
 *    - 失效/invalidate 队列被处理
 *
 * 3. Full Barrier（完全屏障）
 *    - 结合 Store Barrier 和 Load Barrier
 *    - 所有之前的 load/store 都在之后的 load/store 之前完成
 *
 * 4. 方向：
 *    - Compiler Barrier：只阻止编译器重排序
 *    - Hardware Barrier：阻止 CPU 重排序
 */

// Linux 内核中的内存屏障

#define mb()    asm volatile("mfence" ::: "memory")  // x86 Full Barrier
#define rmb()   asm volatile("lfence" ::: "memory") // x86 Read Barrier
#define wmb()   asm volatile("sfence" ::: "memory") // x86 Write Barrier

// 使用示例
volatile int ready = 0;
int data = 0;

// 线程 1（生产者）
void producer() {
    data = 42;      // 写入数据
    wmb();         // 写屏障：确保 data 在 ready 之前写入
    ready = 1;     // 写入 ready 标志
}

// 线程 2（消费者）
void consumer() {
    if (ready) {   // 读取 ready
        rmb();     // 读屏障：确保读取到最新的 data
        assert(data == 42);
    }
}
```

### 4.3 C++11 原子操作与内存序

```c++
// C++11 原子操作和内存序

#include <atomic>

std::atomic<int> ready{0};
int data = 0;

// 线程 1
void producer() {
    data = 42;

    // release 语义：之前的内存操作不会被重排到这个操作之后
    ready.store(1, std::memory_order_release);
}

// 线程 2
void consumer() {
    // acquire 语义：之后的内存操作不会被重排到这个操作之前
    while (ready.load(std::memory_order_acquire) == 0) {
        // 自旋等待
    }

    // 此时一定能读到 data == 42
    assert(data == 42);
}

/*
 * memory_order 的六种选项：
 *
 * 1. memory_order_relaxed - 完全自由
 *    - 只保证原子性，不保证顺序
 *    - 不与任何其他操作同步
 *
 * 2. memory_order_consume - 消费
 *    - 当前线程的依赖于该原子的操作不会被重排
 *    - 较新，不常用
 *
 * 3. memory_order_acquire - 获取
 *    - 之后的读操作不会被重排到之前
 *    - 常用于锁释放后
 *
 * 4. memory_order_release - 释放
 *    - 之前的写操作不会被重排到之后
 *    - 常用于锁获取前
 *
 * 5. memory_order_acq_rel - 获取-释放
 *    - 同时有 acquire 和 release 语义
 *    - 用于 read-modify-write 操作
 *
 * 6. memory_order_seq_cst - 顺序一致
 *    - 默认选项，最强的保证
 *    - 所有线程看到相同的操作顺序
 */
```

### 4.4 Java 的 volatile 和内存屏障

```java
// Java 中的内存语义

public class MemoryBarrierDemo {

    // volatile 保证：
    // 1. 可见性：一个线程的写入对另一个线程可见
    // 2. 有序性：volatile 变量的读写不能被重排序

    volatile boolean ready = false;
    int data = 0;

    public void producer() {
        data = 42;          // 写入 data
        ready = true;       // 写入 ready（volatile 写有屏障）
    }

    public void consumer() {
        if (ready) {        // volatile 读有屏障
            // 此时 data 一定等于 42
            System.out.println(data);
        }
    }

    /*
     * volatile 写的内存屏障（JMM）：
     *
     * 1. 在 volatile 写之前的所有操作
     *    都不能重排到 volatile 写之后
     * 2. volatile 写之后的所有操作
     *    都不能重排到 volatile 写之前
     * 3. volatile 写会刷新 store buffer 到主内存
     */

    /*
     * volatile 读的内存屏障（JMM）：
     *
     * 1. 在 volatile 读之后的所有操作
     *    都不能重排到 volatile 读之前
     * 2. volatile 读会 invalid 化其他核心的缓存
     *    强制从主内存读取最新值
     */
}
```

---

## 第五章：并发基础

### 5.1 并发与并行

```
并发（Concurrency）：
- 同时管理多个任务
- 交替执行
- 一个人同时照顾多台机器

┌─────────────────────────────────────────────────────┐
│  时间线：─────────────────────────────────────────►  │
│                                                     │
│  CPU1: [任务A的1][任务B的1][任务A的2][任务C的1]...   │
│                                                     │
│  看起来同时，但同一时刻只做一件事                      │
└─────────────────────────────────────────────────────┘

并行（Parallelism）：
- 同时执行多个任务
- 真正的同时
- 多个人同时操作多台机器

┌─────────────────────────────────────────────────────┐
│  时间线：─────────────────────────────────────────►  │
│                                                     │
│  CPU1: [任务A的1][任务A的2][任务A的3][任务A的4]...   │
│  CPU2: [任务B的1][任务B的2][任务B的3][任务B的4]...   │
│  CPU3: [任务C的1][任务C的2][任务C的3][任务C的4]...   │
│                                                     │
│  真正的同时执行                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 并发的问题

#### 竞态条件（Race Condition）

```java
// 竞态条件示例

public class RaceCondition {
    private int counter = 0;

    // 这个方法有竞态条件！
    public void increment() {
        // 看似一行代码，但实际有多步：
        // 1. 读取 counter 的值
        // 2. 加 1
        // 3. 写回 counter

        // 如果两个线程同时执行：
        // 线程1: read counter (0) -> inc -> write 1
        // 线程2: read counter (0) -> inc -> write 1  ← 丢失更新！

        // 最终 counter = 1，但应该是 2
        counter++;
    }

    // 解决方案：synchronized
    public synchronized void incrementSafe() {
        counter++;
    }

    // 解决方案：AtomicInteger
    private java.util.concurrent.atomic.AtomicInteger atomicCounter =
        new java.util.concurrent.atomic.AtomicInteger(0);

    public void incrementAtomic() {
        atomicCounter.incrementAndGet();
    }
}
```

#### 死锁（Deadlock）

```java
// 死锁示例

public class Deadlock {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    // 线程 A
    public void methodA() {
        synchronized (lock1) {
            System.out.println("A: 持有 lock1");
            try { Thread.sleep(100); } catch (Exception e) {}

            synchronized (lock2) {
                System.out.println("A: 持有 lock2");
            }
        }
    }

    // 线程 B
    public void methodB() {
        synchronized (lock2) {
            System.out.println("B: 持有 lock2");
            try { Thread.sleep(100); } catch (Exception e) {}

            synchronized (lock1) {
                System.out.println("B: 持有 lock1");
            }
        }
    }

    /*
     * 死锁的四个必要条件：
     * 1. 互斥：资源不能同时被多个线程使用
     * 2. 持有并等待：线程持有资源，同时等待其他资源
     * 3. 不可抢占：资源不能被强制释放
     * 4. 循环等待：形成等待环
     *
     * 避免死锁的方法：
     * - 固定加锁顺序
     * - 使用超时
     * - 检测并恢复
     */
}
```

### 5.3 线程同步原语

```python
# Python 线程同步示例

import threading
import time

# 1. 互斥锁
class MutexDemo:
    def __init__(self):
        self.lock = threading.Lock()
        self.counter = 0

    def increment(self):
        with self.lock:  # 自动获取和释放锁
            self.counter += 1

# 2. 读写锁
class ReadWriteLock:
    def __init__(self):
        self._read_ready = threading.Condition(threading.Lock())
        self._readers = 0

    def acquire_read(self):
        with self._read_ready:
            self._readers += 1

    def release_read(self):
        with self._read_ready:
            self._readers -= 1
            if self._readers == 0:
                self._read_ready.notify_all()

    def acquire_write(self):
        self._read_ready.wait_for(lambda: self._readers == 0)

    def release_write(self):
        pass  # 实际上需要更复杂的实现

# 3. 信号量
class SemaphoreDemo:
    def __init__(self, max_workers):
        self.semaphore = threading.Semaphore(max_workers)

    def do_work(self, task):
        with self.semaphore:  # 最多 max_workers 个并发
            print(f"处理任务: {task}")
            time.sleep(0.1)

# 4. 屏障（让所有线程等待到同一点）
class BarrierDemo:
    def __init__(self, num_threads):
        self.barrier = threading.Barrier(num_threads)

    def phase(self, thread_id):
        print(f"线程 {thread_id} 开始第一阶段")
        time.sleep(0.1)
        print(f"线程 {thread_id} 等待其他线程...")
        self.barrier.wait()  # 所有线程都在这里等待
        print(f"线程 {thread_id} 开始第二阶段")

# 5. 事件
class EventDemo:
    def __init__(self):
        self.event = threading.Event()

    def producer(self):
        print("生产者: 准备数据...")
        time.sleep(1)
        print("生产者: 数据就绪，发送信号")
        self.event.set()

    def consumer(self):
        print("消费者: 等待数据...")
        self.event.wait()  # 阻塞直到 set
        print("消费者: 收到信号，开始处理")
```

### 5.4 无锁编程

```c
// 无锁原子操作

#include <stdatomic.h>

// 原子加法（无需锁）
void atomic_increment(_Atomic int* counter) {
    // fetch_add 返回增加前的值
    // 这是一个原子操作，不需要锁
    atomic_fetch_add(counter, 1);
}

// 比较并交换（CAS）
// 这是实现无锁数据结构的基础
_Bool compare_and_swap(_Atomic int* addr, int expected, int desired) {
    // 如果 addr == expected，把 addr 设为 desired
    // 返回是否成功
    return atomic_compare_exchange_strong(addr, &expected, desired);
}

// 使用 CAS 实现无锁栈
typedef struct Node {
    int value;
    struct Node* next;
} Node;

_Atomic struct Node* top = NULL;  // 栈顶指针

void push(int value) {
    Node* new_node = malloc(sizeof(Node));
    new_node->value = value;

    do {
        new_node->next = top;  // 当前栈顶
    } while (!compare_and_swap(&top, new_node->next, new_node));
    // 如果 top 没有被其他线程改变，new_node 成为新栈顶
    // 否则重试
}

int pop() {
    Node* old_top;
    Node* next;

    do {
        old_top = top;         // 当前栈顶
        if (old_top == NULL) {
            return -1;        // 栈空
        }
        next = old_top->next; // 下一个节点
    } while (!compare_and_swap(&top, old_top, next));

    int value = old_top->value;
    free(old_top);
    return value;
}

/*
 * 无锁编程的优点：
 * - 避免锁的开销
 * - 避免死锁
 * - 更好的并发性能
 *
 * 无锁编程的缺点：
 * - 复杂，难正确
 * - 需要仔细的算法设计
 * - ABA 问题
 */
```

---

## 第六章：实战应用场景

### 6.1 Node.js 中的并发

```javascript
// Node.js 事件循环与并发模型

console.log("=== Node.js 并发模型 ===\n");

// Node.js 是单线程的，但这不意味着不能并发
// 它使用事件循环 + 非阻塞 I/O 来处理并发

// 示例 1：异步 I/O 不阻塞
console.log("1. 异步 I/O 示例：");
console.log("   开始读取文件...");

const fs = require('fs').promises;

async function asyncIO() {
    const start = Date.now();

    // 模拟多个异步操作
    const promises = [
        fs.readFile('/tmp/file1.txt').catch(() => 'file1'),
        fs.readFile('/tmp/file2.txt').catch(() => 'file2'),
        fs.readFile('/tmp/file3.txt').catch(() => 'file3'),
    ];

    // 同时等待所有操作完成
    const results = await Promise.all(promises);

    const elapsed = Date.now() - start;
    console.log(`   完成！耗时: ${elapsed}ms`);
    console.log(`   结果: ${results.join(', ')}`);
}

asyncIO();

// 示例 2：Worker Threads 用于 CPU 密集型任务
console.log("\n2. Worker Threads 示例：");

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    // 主线程
    const worker = new Worker(__filename, {
        workerData: { start: 1, end: 10000000 }
    });

    worker.on('message', (result) => {
        console.log(`   Worker 计算结果: ${result}`);
    });

    worker.on('error', (err) => {
        console.error('Worker 错误:', err);
    });
} else {
    // Worker 线程：执行 CPU 密集型计算
    const { start, end } = workerData;

    let sum = 0;
    for (let i = start; i <= end; i++) {
        sum += Math.sqrt(i);
    }

    parentPort.postMessage(sum);
}

// 示例 3：cluster 模块利用多核
console.log("\n3. Cluster 模块示例：");
console.log("   (使用 cluster 模块让多个进程处理请求)");

const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
    console.log(`   主进程: ${process.pid}`);
    console.log(`   启动 ${os.cpus().length} 个工作进程`);

    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`   工作进程 ${worker.process.pid} 退出`);
    });
} else {
    // 工作进程
    console.log(`   工作进程 ${process.pid} 启动`);

    const http = require('http');
    http.createServer((req, res) => {
        res.end(`由进程 ${process.pid} 处理`);
    }).listen(8000 + cluster.worker.id);

    // 使进程保持运行
    process.stdout.write('');
}
```

### 6.2 Python 中的并发

```python
# Python 并发编程

import threading
import multiprocessing
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

print("=== Python 并发编程 ===\n")

# 1. 线程池：适合 I/O 密集型任务
print("1. ThreadPoolExecutor（I/O 密集型）：")

def io_task(task_id):
    """模拟 I/O 操作（网络请求、文件读写）"""
    time.sleep(0.1)  # 模拟等待
    return f"Task {task_id} 完成"

async def async_io_task(task_id):
    """异步 I/O 任务"""
    await asyncio.sleep(0.1)
    return f"Async Task {task_id} 完成"

def thread_pool_demo():
    start = time.time()

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(io_task, i) for i in range(10)]
        results = [f.result() for f in futures]

    elapsed = time.time() - start
    print(f"   10 个任务，10 个线程池 worker")
    print(f"   耗时: {elapsed:.2f}s（理论上应该是 0.1s，而不是 1s）")
    print(f"   结果: {results[0]}")

thread_pool_demo()

# 2. 进程池：适合 CPU 密集型任务
print("\n2. ProcessPoolExecutor（CPU 密集型）：")

def cpu_task(n):
    """CPU 密集型计算"""
    return sum(i * i for i in range(n))

def process_pool_demo():
    start = time.time()

    with ProcessPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(cpu_task, 1000000) for _ in range(8)]
        results = [f.result() for f in futures]

    elapsed = time.time() - start
    print(f"   8 个任务，4 个进程")
    print(f"   耗时: {elapsed:.2f}s（比单进程快约 4 倍）")

process_pool_demo()

# 3. 异步编程
print("\n3. asyncio（协程）：")

async def main():
    start = time.time()

    # 创建多个协程任务
    tasks = [async_io_task(i) for i in range(10)]

    # 并发执行
    results = await asyncio.gather(*tasks)

    elapsed = time.time() - start
    print(f"   10 个协程并发执行")
    print(f"   耗时: {elapsed:.2f}s（异步 I/O 优势明显）")
    print(f"   结果: {results[0]}")

asyncio.run(main())

# 4. GIL 问题解释
print("\n4. GIL（全局解释器锁）解释：")
print("""
   Python 的 GIL 使得同一时刻只有一个线程执行 Python 字节码
   这意味着多线程不能真正并行执行 CPU 密集型任务

   但对于 I/O 密集型任务，多线程仍然有效
   因为等待 I/O 时会释放 GIL

   CPU 密集型 → 使用 multiprocessing（多进程）
   I/O 密集型 → 使用 threading 或 asyncio
""")
```

### 6.3 Go 的并发模型

```go
// Go 的并发：Goroutine + Channel

package main

import (
    "fmt"
    "time"
    "sync"
)

func main() {
    fmt.Println("=== Go 并发模型 ===\n")

    // 1. Goroutine 基础
    fmt.Println("1. Goroutine 示例：")

    // 启动一个 goroutine（非阻塞）
    go func() {
        fmt.Println("   这是在 goroutine 中执行的")
    }()

    // 主 goroutine 继续执行
    fmt.Println("   这是在主 goroutine 中执行的")

    // 等待 goroutine 完成
    time.Sleep(time.Millisecond)

    // 2. Channel 通信
    fmt.Println("\n2. Channel 示例：")

    ch := make(chan string, 1)  // 带缓冲的 channel

    // 生产者
    go func() {
        for i := 0; i < 3; i++ {
            msg := fmt.Sprintf("消息 %d", i)
            fmt.Printf("   发送: %s\n", msg)
            ch <- msg  // 发送到 channel
            time.Sleep(time.Millisecond)
        }
        close(ch)  // 关闭 channel
    }()

    // 消费者
    for msg := range ch {
        fmt.Printf("   收到: %s\n", msg)
    }

    // 3. WaitGroup 等待多个 goroutine
    fmt.Println("\n3. WaitGroup 示例：")

    var wg sync.WaitGroup

    for i := 0; i < 5; i++ {
        wg.Add(1)  // 增加计数
        go func(id int) {
            defer wg.Done()  // 完成时减少计数
            fmt.Printf("   Goroutine %d 完成\n", id)
            time.Sleep(time.Millisecond)
        }(i)
    }

    wg.Wait()  // 等待所有 goroutine 完成
    fmt.Println("   所有 goroutine 完成")

    // 4. Select 多路复用
    fmt.Println("\n4. Select 示例：")

    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    go func() {
        time.Sleep(50 * time.Millisecond)
        ch1 <- "通道1"
    }()

    go func() {
        time.Sleep(20 * time.Millisecond)
        ch2 <- "通道2"
    }()

    // 等待第一个完成的 channel
    select {
    case msg := <-ch1:
        fmt.Printf("   收到: %s (更快)\n", msg)
    case msg := <-ch2:
        fmt.Printf("   收到: %s\n", msg)
    case <-time.After(100 * time.Millisecond):
        fmt.Println("   超时")
    }

    fmt.Println("\n=== Go 的并发优势 ===")
    fmt.Println("""
    - Goroutine 非常轻量（2KB 栈空间）
    - 可以在单个机器上启动数十万个 goroutine
    - Channel 提供安全的通信
    - Select 多路复用处理多个 channel
    - 内置的同步原语：Mutex、WaitGroup、Cond、Once、Pool
    """)
}
```

---

## 总结：CPU 缓存与并发核心要点

1. **CPU 缓存层级**
   - L1/L2/L3 从快到慢，容量从小到大
   - 缓存行大小通常 64 字节
   - 使用策略：最近最少使用（LRU）

2. **MESI 协议**
   - Modified/Exclusive/Shared/Invalid 四种状态
   - 通过总线广播实现一致性
   - 核心状态相互影响

3. **伪共享**
   - 不同变量在同一缓存行会导致性能问题
   - 使用缓存行填充避免
   - Java 的 @Contended 注解

4. **内存屏障**
   - 防止编译器和 CPU 重排序
   - 写屏障/读屏障/全屏障
   - C++11 的 memory_order

5. **并发基础**
   - 并发是管理，交行是执行
   - 竞态条件、死锁是主要问题
   - 锁、信号量、屏障是同步工具
   - 无锁编程使用 CAS

6. **语言并发模型**
   - Node.js：事件循环 + Worker Threads
   - Python：GIL 限制，但有 asyncio/threading/multiprocessing
   - Go：Goroutine + Channel，轻量且高效
