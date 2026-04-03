# Go并发编程与Runtime深度完全指南

## 概述

Go语言以其简洁而强大的并发模型著称，这也是其在高并发服务器领域大放异彩的根本原因。本文档深入解析Go的并发编程核心：GMP调度器、channel、context、select、sync.WaitGroup、errgroup等，同时探讨并发安全、错误处理、性能优化等实践要点。

---

## 一、GMP调度器深度解析

### 1.1 调度器架构概述

Go的运行时（Runtime）包含一个复杂的调度器，负责将数以千计的goroutine高效调度到少量的操作系统线程上执行。这是Go实现高并发的基础。

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GMP 调度模型                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌─────────────┐                            │
│                         │   GOMAXPROCS│                            │
│                         │    (P数量)  │                            │
│                         └──────┬──────┘                            │
│                                │                                    │
│     ┌──────────────────────────┼──────────────────────────────┐   │
│     │                          │                              │   │
│     ▼                          ▼                              ▼   │
│ ┌───────┐               ┌───────┐                      ┌───────┐ │
│ │   P 1 │               │   P 2 │                      │   P n │ │
│ │ ┌───┐ │               │ ┌───┐ │                      │ ┌───┐ │ │
│ │ │ G │ │               │ │ G │ │                      │ │ G │ │ │
│ │ │ 1 │ │               │ │ 3 │ │                      │ │ 5 │ │ │
│ │ ├───┤ │               │ ├───┤ │                      │ ├───┤ │ │
│ │ │ G │ │               │ │ G │ │                      │ │ G │ │ │
│ │ │ 2 │ │               │ │ 4 │ │                      │ │ 6 │ │ │
│ │ └───┘ │               │ └───┘ │                      │ └───┘ │ │
│ └───┬───┘               └───┬───┘                      └───┬───┘ │
│     │                       │                              │     │
│     └───────────────────────┼──────────────────────────────┘     │
│                             │                                     │
│                    ┌────────▼────────┐                            │
│                    │  Global RunQueue│                            │
│                    │  (全局任务队列)  │                            │
│                    └─────────────────┘                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     OS Threads (M)                          │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐                        │  │
│  │  │   M 1  │  │   M 2  │  │   M n  │                        │  │
│  │  └────────┘  └────────┘  └────────┘                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

图例：
G - Goroutine（轻量级协程）
M - Machine（操作系统线程）
P - Processor（执行上下文）
```

### 1.2 核心数据结构

```go
// Go Runtime 核心数据结构

// goroutine (G) - 轻量级执行单元
type g struct {
    // 栈相关
    stack       stack       // 栈边界
    stackguard0 uintptr     // 栈警戒边界
    stackguard1 uintptr

    // 状态
    // Go定义了多种goroutine状态，用于调度决策
    _        int32
    status   uint32        // 运行状态：idle、runnable、running、waiting等
    sched    gobuf         // 调度信息保存区
    sp       uintptr       // 栈指针
    pc       uintptr       // 程序计数器
    goid     int64         // goroutine ID

    // 等待原因
    waitreason strInfo     // 等待原因，如chan receive、select等

    // 调度相关
    m              *m       // 当前运行的M
    schedlink      guintptr // 链接到下一个G
    preempt        bool     // 是否被抢占
    preemptStop    bool     // 抢占标志停止
    preemptShrink  bool     // 抢占缩小栈

    // Panicking相关
    paniconfault bool
    gcscandone   bool
    throwsplit   bool

    // 运行时信息
    initing     bool
    issystem    bool
    incwaiting   bool
    gens        uint32

    // 跟踪
    trunseq     uint64
    traceseq    uint64
    tracelocp   interface{}
    fup         funcval     // goroutine启动函数
    param       unsafe.Pointer
    args        uintptr
    fnstart     uintptr
    obreg      unsafe.Pointer
}

// machine (M) - 操作系统线程
type m struct {
    // g0 - 每个M的第一个goroutine，用于调度
    g0      *g
    gsignal *g           // 信号处理goroutine

    // TLS - 线程本地存储
    tls [6]uintptr

    // 操作系统线程ID
    tid int64

    // 关联的P
    p       *p
    nextp   *p
    oldp    *p

    // M的状态
    status   mStatus

    // 调度链表
    schedlink guintptr

    // 空闲链表
    freestack uint32

    // 系统栈
    stack [2]stack

    // 认证信息
    creelay [8]int16

    // 各种锁
    locktrace uintptr
    syscalltick uint32
    th SCSpin

    // M的索引
    id int32

    // 内存分配
    mallocing   uint32
    gcing       uint32
    locks       int32
    dying       int32
    profilehz   int32
    helpGC      int32
    spinning    bool     // 是否在自旋
    ncgocall    uint64
    ncgo        int32
    cgoCallers  *cgoCallers
    cgoCallersTime int64
}

// processor (P) - 执行上下文
// P是GMP模型的核心，负责调度goroutine到M
type p struct {
    // 状态
    status uint32 // pidle、prunning、psyscall、pcoexist等

    // ID
    id int32

    // 关联的M
    m muintptr

    // 本地运行队列
    // Go 1.15后使用无锁设计，提高性能
    runqhead uint32
    runqtail uint32
    runq     [256]guintptr  // 环形队列，最多256个goroutine
    runqsize int32

    // 可运行的goroutine数量
    runnablecnt int32
    expiredeadline int64

    // 当前运行的goroutine
    curg *g

    // P本地绑定的G对象池
    gFree struct {
        noвалид int32
        g        [32]guintptr
    }

    // GC相关
    gcBgMarkWorker    guintptr
    gcMarkWorkerMode  gcMarkWorkerMode
    gcw               gcWork

    // 锁
    lock mutex

    // 索引
    id int32
    link guintptr
   理发店
}
```

### 1.3 调度器初始化

```go
// runtime/proc.go

// schedinit 调度器初始化
// 这是Go程序启动后第一个调度的C函数
func schedinit() {
    // 1. 获取CPU核心数
    // 会根据GOMAXPROCS设置或自动检测
    procs := ncpu
    if n, ok := atoi32(gogetenv("GOMAXPROCS")); ok {
        procs = n
    }
    if procs > maxGomaxprocs {
        procs = maxGomaxprocs
    }

    // 2. 调整P数量
    // 确保与CPU核心数匹配
    if procs > 0 {
        // 动态调整P的数量
        procresize(procs)
    } else {
        // 默认使用1个P
        procresize(1)
    }

    // 3. 初始化调度器状态
    sched.lastpoll = uint64(nanotime())
    sched.initTime = nanotime()

    // 4. 创建主goroutine的M
    // 此时还没有M，需要先创建一个
    m0 := &m0
    m0.g0 = newG)

    // 5. 设置M0
    m0.g0.m = m0
    m0.curg = m0.g0

    // 6. 初始化内存分配器
    mallocinit()

    // 7. 初始化栈管理器
   栈卡init()

    // 8. GC初始化
    gcinit()

    // 9. 设置CPU亲和性（如果启用）
    if debug.ctpro > 0 {
        // 设置进程CPU亲和性
    }
}

// newG 创建新的goroutine
func newG) *g {
    // 尝试从P的空闲列表获取
    if gp := malg(_StackMin); gp != nil {
        return gp
    }

    // 分配新的G对象
    gp := new(g)
    return gp
}

// procresize 调整P的数量
// 这是调度器动态调整的核心函数
func procresize(nprocs int32) *p {
    // 调整全局P数组大小
    old := allp

    // 分配新的P数组
    if nprocs == len(allp) {
        // 大小不变，直接使用
    } else {
        // 重新分配
        nallp := make([]*p, nprocs)
        copy(nallp, allp)
        allp = nallp
    }

    // 初始化新的P
    for i := int32(0); i < nprocs; i++ {
        if allp[i] == nil {
            allp[i] = new(p)
        }
        // 初始化P的本地运行队列
        allp[i].id = i
        allp[i].runqhead = 0
        allp[i].runqtail = 0
        allp[i].runqsize = 0
    }

    // 释放多余的P
    for i := nprocs; i < int32(len(allp)); i++ {
        // 将P上的goroutine移到全局队列
        p := allp[i]
        for p.runqhead > 0 {
            gp := p.runq[p.runqhead%uint32(len(p.runq))]
            p.runqhead++
            globrunqput(gp)
        }
    }

    return allp[0]
}
```

### 1.4 Goroutine调度循环

```go
// runtime/proc.go

// goroutine调度循环
// 这是每个M执行的核心函数
func schedule() {
    // 获取当前P
    pp := getg().m.p.ptr()
    if pp == nil {
        // 没有可用的P，尝试获取
        pp = pp = findrunnable()
    }

    // 情况1：从本地队列获取G
    if gp, ok := runqget(pp); ok {
        execute(gp)
        return
    }

    // 情况2：从全局队列获取G
    if sched.runq.len > 0 {
        lock(&sched.lock)
        gp := globrunqget(pp)
        unlock(&sched.lock)
        if gp != nil {
            execute(gp)
            return
        }
    }

    // 情况3：尝试从网络轮询获取
    if netpollinited {
        // 检查是否有IO就绪的G
        list := netpoll(false) // 不会阻塞
        for _, gp := range list {
            goready(gp, 0)
        }
    }

    // 情况4：窃取其他P的G
    // 工作窃取算法：随机选择另一个P，尝试窃取一半的G
    for i := 0; i < 4; i++ {
        steal := uint64(uint32(pp.id) + 1)
        for i := 0; i < int(steal); i++ {
            if i != int(pp.id) && allp[i].runq.len > 0 {
                gp := runqsteal(pp, allp[i])
                if gp != nil {
                    execute(gp)
                    return
                }
            }
        }
    }

    // 再次尝试全局队列
    if sched.runq.len > 0 {
        gp := globrunqget(pp)
        execute(gp)
        return
    }

    // 进入自旋状态，等待新的G
    // 自旋的M会不断尝试获取G
    park(pp)
}

// execute 执行G
func execute(gp *g) {
    // 获取当前M
    mp := getg().m

    // 设置当前运行的G
    mp.curg = gp
    gp.m = mp

    // 更改G状态
    casgstatus(gp, _Grunnable, _Grunning)

    // 调度统计
    runnable := time.Now()
    gp.sched.release = (cgoCallers{0})
    gp.sched.release = (cgoCallersTime{0})

    // 调度信息
    gp.p.ptr().scavengegc.triggertime = 0

    // 切换到G的栈
    gogo(&gp.sched)
}

// gogo 栈切换
// 使用汇编实现，从调度器栈切换到goroutine栈
//go:nosplit
//go:nowritebarrecase
func gogo(buf *gobuf) {
    // 设置TLS
    setg(gp)

    // 恢复寄存器
    if buf.ctxt != nil {
        systemstack(func() {
            savectxt(buf.ctxt)
        })
    }

    // 恢复调度信息
    sp := buf.sp
    pc := buf.pc

    // 如果有ctxt函数，调用它
    if buf.ctxt != nil {
        ctxt := buf.ctxt
        jmpdctxt(ctxt)
    }

    // 跳转到goroutine入口点
    goto return
}
```

### 1.5 工作窃取算法

```go
// work stealing - 提高CPU利用率的核心算法

// runqsteal 窃取其他P的runnable goroutine
// 这是Go调度器保证负载均衡的核心机制
func runqsteal(pp, p *p) *g {
    // 目标P的队列长度
    t := int32(len(p.runq))

    // 最多窃取一半
    n := t / 2

    // 如果目标队列为空，跳过
    if n == 0 {
        return nil
    }

    // 原子操作：从目标P的队列尾部获取G
    for i := int32(0); i < n; i++ {
        // 获取目标队列尾部的G
        g := p.runq[p.runqtail%uint32(len(p.runq))]
        p.runqtail++

        // 将窃取的G放入当前P的队列头部
        pp.runqhead++ // 先增加头部索引
        pp.runq[pp.runqhead%uint32(len(pp.runq))] = g
    }

    // 通知目标P的调度器
    // 让它知道自己的队列被修改了
    if !from.load(relaxed) {
        // 通知
    }

    return p.runq[(p.runqtail-1)%uint32(len(p.runq))]
}

// findrunnable 找到可运行的G
// 用于M空闲时寻找任务
func findrunnable() *g {
    // 尝试本地队列
    if gp, ok := runqget(m.p.ptr()); ok {
        return gp
    }

    // 尝试全局队列
    if gp := globrunqget(m.p.ptr()); gp != nil {
        return gp
    }

    // 从其他P窃取
    // 随机选择，减少竞争
    for i := 0; i < 10; i++ {
        pid := int32(uint32(m.p.ptr().id) + uint32(i) + 1) % int32(ncpu)
        p := allp[pid]
        if p == nil || p.status != pidle {
            continue
        }

        // 窃取
        if gp := runqsteal(m.p.ptr(), p); gp != nil {
            return gp
        }
    }

    // 再次尝试全局队列
    if gp := globrunqget(m.p.ptr()); gp != nil {
        return gp
    }

    // 检查网络IO
    if netpollinited {
        list := netpoll(false)
        for _, gp := range list {
            goready(gp, 0)
        }
    }

    return nil
}
```

---

## 二、Channel深入解析

### 2.1 Channel核心数据结构

```go
// channel是Go并发编程的核心机制
// 提供了goroutine之间的安全通信和同步

// channel的数据结构 - runtime/chan.go
type hchan struct {
    // 通道数据类型的元素大小
    // 用于在缓冲区中正确移动元素
    elemsize uint16

    // 通道类型：
    // 0: 双向通道
    // 1: 只发送通道 (<-chan)
    // 2: 只接收通道 (chan<-)
    typ uint8

    // 通道状态
    // 0: 开放
    // 1: 关闭
    closed uint8

    // 是否需要对齐
    align uint8

    // 元素类型指针（用于反射）
    elem *uint8

    // 发送游标（环形缓冲区）
    sendx uint

    // 接收游标（环形缓冲区）
    recvx uint

    // 缓冲区
    // 使用环形队列实现
    // nil表示无缓冲通道
    // len(buf)表示缓冲大小
    buf unsafe.Pointer

    // 缓冲区容量
    qcount uint

    // 环形缓冲区总大小
    dataqsiz uint

    // 等待发送的goroutine队列
    // 双向链表实现
    sendq hchanQueue

    // 等待接收的goroutine队列
    recvq hchanQueue

    // 锁
    // 保护所有字段的并发访问
    lock mutex
}

// sudog - 等待队列中的goroutine包装器
// 用于在channel的发送/接收队列中存储goroutine
type sudog struct {
    // 指向原始goroutine的指针
    g *g

    // 是否已发布
    isSelect bool

    // 是否有配额
    hasQuota bool

    // 下一个等待者
    next *sudog

    // 前一个等待者
    prev *sudog

    // 关联的channel
    c     *hchan

    // 发送/接收的值
    elem unsafe.Pointer

    // 恢复点（用于重新入队）
    releasetime int64

    // select相关
    n      uintptr
    selectdone uint32

    // 成功发送的标记
    success bool
}

// 创建channel
// make(chan int, 10) 会调用此函数
func makechan(t *chantype, size int64) *hchan {
    // 计算元素大小
    elem := t.elem

    // 检查元素大小是否合理
    if elem.size >= 1<<16 {
        throw("makechan: invalid channel element size")
    }

    // 计算内存布局
    // 包括hchan结构和缓冲区
    var c *hchan
    if size > 0 {
        // 有缓冲通道
        // 分配: hchan + 缓冲区
        totalSize := uint64(sizofHchan) + uint64(size)*uint64(elem.size)
        c = (*hchan)(mallocgc(totalSize, elem, true))
        c.buf = add(unsafe.Pointer(c), sizofHchan, 0, elem.size, false, 0)
    } else {
        // 无缓冲通道
        c = (*hchan)(mallocgc(sizofHchan, elem, true))
    }

    // 初始化字段
    c.elemsize = uint16(elem.size)
    c.elem = unsafe.Pointer(elem)
    c.dataqsiz = uint(size)

    // 初始化锁
    lockInit(&c.lock, lockRankHchan)

    // 验证元素类型
    if !verifyType(chantype{t, size}) {
        throw("makechan: invalid channel element type")
    }

    return c
}
```

### 2.2 发送与接收操作

```go
// channel发送操作
// ch <- value 会调用此函数
func chansend(c *hchan, ep unsafe.Pointer, block bool, callerpc uintptr) bool {
    // 1. 检查channel是否已关闭
    if c.closed != 0 {
        // 向已关闭的channel发送会panic
        unlock(&c.lock)
        panic("send on closed channel")
    }

    // 2. 如果有等待接收者，直接发送（无缓冲通道的快速路径）
    if sg := dequeue(&c.recvq); sg != nil {
        // 找到了等待接收的goroutine
        // 直接发送，不需要放入缓冲区

        // 复制数据到接收者
        send(c, sg, ep, func() {}, 3)

        return true
    }

    // 3. 如果缓冲区有空间，放入缓冲区
    if c.qcount < c.dataqsiz {
        // 获取发送位置
        qp := chanbuf(c, c.sendx)

        // 复制数据
        typedmemmove(c.elem, ep, qp)

        // 移动发送游标
        c.sendx++

        // 环形缓冲区的wrap
        if c.sendx == c.dataqsiz {
            c.sendx = 0
        }

        // 增加计数
        c.qcount++

        return true
    }

    // 4. 无缓冲通道或缓冲区已满
    if !block {
        // 非阻塞模式，直接返回
        return false
    }

    // 5. 阻塞模式：当前goroutine加入发送队列并等待
    // 获取当前goroutine
    gp := getg()

    // 创建sudog
    mysg := acquireSudog()
    mysg.releasetime = 0
    mysg.elem = ep
    mysg.g = gp
    mysg.c = c

    // 设置等待原因
    gp.waitreason = waitReasonChanSend

    // 加入发送队列
    enqueue(&c.sendq, mysg)

    // 释放锁
    unlock(&c.lock)

    // 等待被唤醒（由接收者唤醒）
    // 这个函数会挂起当前goroutine
    gopark(nil, nil, waitReasonChanSend, traceEvGoBlockSend, 2)

    // 被唤醒后清理
    releaseSudog(mysg)

    // 检查是否因关闭而唤醒
    if c.closed != 0 {
        panic("send on closed channel")
    }

    return true
}

// channel接收操作
// value := <-ch 会调用此函数
func chanrecv(c *hchan, ep unsafe.Pointer, block bool) (selected, received bool) {
    // 1. 如果channel已关闭且没有数据
    if c.closed != 0 && c.qcount == 0 {
        // 从已关闭的空channel接收会返回零值
        return true, false
    }

    // 2. 如果有等待发送者，直接接收（有缓冲的快速路径）
    if sg := dequeue(&c.sendq); sg != nil {
        // 接收并唤醒发送者
        recv(c, sg, ep, func() {}, 3)
        return true, true
    }

    // 3. 如果缓冲区有数据，从缓冲区接收
    if c.qcount > 0 {
        // 获取接收位置
        qp := chanbuf(c, c.recvx)

        // 复制数据到接收者
        if ep != nil {
            typedmemmove(c.elem, qp, ep)
        }

        // 清空原位置（帮助GC）
        memclrNoHeapPointers(qp, c.elemsize)

        // 移动接收游标
        c.recvx++

        // 环形缓冲区wrap
        if c.recvx == c.dataqsiz {
            c.recvx = 0
        }

        // 减少计数
        c.qcount--

        return true, true
    }

    // 4. 无缓冲通道或缓冲区为空
    if !block {
        // 非阻塞模式
        return false, false
    }

    // 5. 阻塞模式：加入接收队列并等待
    gp := getg()
    mysg := acquireSudog()
    mysg.releasetime = 0
    mysg.elem = ep
    mysg.g = gp
    mysg.c = c
    gp.waitreason = waitReasonChanReceive

    // 加入接收队列
    enqueue(&c.recvq, mysg)

    // 释放锁并等待
    unlock(&c.lock)
    gopark(nil, nil, waitReasonChanReceive, traceEvGoBlockRecv, 2)

    // 被唤醒
    releaseSudog(mysg)

    // 检查channel状态
    if c.closed != 0 && c.qcount == 0 {
        return true, false
    }

    return true, true
}

// send 直接发送（唤醒等待者）
func send(c *hchan, sg *sudog, ep unsafe.Pointer, fn func(), ctxt uintptr) {
    // 唤醒发送者，告诉它数据已被接收
    // 实际上发送操作已经通过typedmemmove完成
    // 这里只是唤醒等待的goroutine

    // 如果是非nil指针，复制数据
    if sg.elem != nil {
        sendDirect(c.elemtype, sg, ep)
    }

    // 如果是select操作
    if sg.selectdone != nil {
        // 标记select完成
        cas(sg.selectdone, 0, 1)
    }

    // 标记goroutine为runnable
    goready(gp, 0)
}
```

### 2.3 Channel使用模式

```go
// 管道模式 - 链接多个channel
func pipeline_example() {
    // 创建channel
    numbers := make(chan int, 10)
    squared := make(chan int, 10)

    // 生产者：发送数字
    go func() {
        for i := 1; i <= 10; i++ {
            numbers <- i
        }
        close(numbers) // 关闭channel表示没有更多数据
    }()

    // 处理器：计算平方
    go func() {
        for n := range numbers { // 遍历直到channel关闭
            squared <- n * n
        }
        close(squared)
    }()

    // 消费者：打印结果
    for s := range squared {
        fmt.Println(s)
    }
}

// Fan-out / Fan-in 模式
// 多个goroutine处理同一个channel
func fanout_example() {
    // 输入channel
    jobs := make(chan int, 100)

    // 结果channel
    results := make(chan int, 100)

    // 启动3个worker
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // 发送10个任务
    go func() {
        for j := 1; j <= 10; j++ {
            jobs <- j
        }
        close(jobs)
    }()

    // 收集结果
    go func() {
        for a := 1; a <= 10; a++ {
            <-results
        }
    }()
}

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("worker %d processing job %d\n", id, j)
        results <- j * 2
    }
}

// select多路复用
// 同时等待多个channel操作
func select_example() {
    // 创建多个channel
    ch1 := make(chan string)
    ch2 := make(chan string)

    // 启动两个goroutine
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "消息1"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "消息2"
    }()

    // 使用select等待
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("收到:", msg1)
        case msg2 := <-ch2:
            fmt.Println("收到:", msg2)
        case <-time.After(3 * time.Second):
            fmt.Println("超时")
        }
    }
}

// 超时控制
func timeout_example() {
    // 创建带超时的channel
    result := make(chan int, 1)

    go func() {
        // 模拟长时间操作
        time.Sleep(2 * time.Second)
        result <- 42
    }()

    select {
    case v := <-result:
        fmt.Println("结果:", v)
    case <-time.After(1 * time.Second):
        fmt.Println("操作超时")
    }
}

// 关闭信号
// 使用额外的channel发送关闭信号
func graceful_shutdown_example() {
    done := make(chan struct{})
    jobs := make(chan int, 100)

    // 工作goroutine
    go func() {
        for {
            select {
            case <-done:
                // 收到关闭信号
                fmt.Println("正在关闭...")
                return
            case j := <-jobs:
                // 处理任务
                fmt.Println("处理:", j)
            }
        }
    }()

    // 发送任务
    jobs <- 1
    jobs <- 2

    // 发送关闭信号
    close(done)
}
```

---

## 三、Context深度解析

### 3.1 Context核心设计

```go
// Context - Go 1.7引入的请求上下文管理机制
// 用于在goroutine之间传递请求范围的数据、取消信号和超时控制

// Context接口定义
type Context interface {
    // Deadline 返回截止时间
    // 如果没有设置截止时间，ok返回false
    Deadline() (deadline time.Time, ok bool)

    // Done 返回一个channel
    // 当context被取消或超时时，此channel会被关闭
    // 如果context永远不会被取消，返回nil
    Done() <-chan struct{}

    // Err 返回context被取消的原因
    Err() error

    // Value 返回与此context关联的值
    // 如果没有值，返回nil
    Value(key interface{}) interface{}
}

// 取消原因
var Canceled = errors.New("context canceled")
var DeadlineExceeded = errors.New("context deadline exceeded")

// emptyCtx 空context实现
// 用于根context
type emptyCtx int

func (emptyCtx) Deadline() (time.Time, bool) {
    return time.Time{}, false
}

func (emptyCtx) Done() <-chan struct{} {
    return nil
}

func (emptyCtx) Err() error {
    return nil
}

func (emptyCtx) Value(key interface{}) interface{} {
    return nil
}

// 预定义的空context
var (
    background = new(emptyCtx)
    todo       = new(emptyCtx)
)

// Background 返回一个永不取消的根context
func Background() Context {
    return background
}

// TODO 返回一个未知用途的临时context
func TODO() Context {
    return todo
}
```

### 3.2 Context实现

```go
// cancelCtx 可取消的context
type cancelCtx struct {
    Context

    mu       sync.Mutex
    done     chan struct{}
    children map[canceler]struct{}
    err      error
}

func (c *cancelCtx) Done() <-chan struct{} {
    c.mu.Lock()
    if c.done == nil {
        c.done = make(chan struct{})
    }
    d := c.done
    c.mu.Unlock()
    return d
}

func (c *cancelCtx) Err() error {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.err
}

func (c *cancelCtx) cancel(removeFromParent bool, err error) {
    // 1. 设置错误
    c.mu.Lock()
    if c.err != nil {
        c.mu.Unlock()
        return // 已经被取消
    }

    c.err = err

    // 2. 关闭done channel
    if c.done == nil {
        c.done = closedchan
    } else {
        close(c.done)
    }

    // 3. 递归取消所有子context
    for child := range c.children {
        child.cancel(false, err)
    }

    // 4. 清空children
    c.children = nil
    c.mu.Unlock()

    // 5. 从父context移除
    if removeFromParent {
        if parent, ok := c.Context.(canceler); ok {
            parent.removeChild(c)
        }
    }
}

// timerCtx 带超时的context
type timerCtx struct {
    cancelCtx
    timer *time.Timer
    deadline time.Time
}

func (c *timerCtx) Deadline() (time.Time, bool) {
    return c.deadline, true
}

func (c *timerCtx) cancel(removeFromParent bool, err error) {
    // 停止定时器
    c.timer.Stop()

    // 调用父类的cancel
    c.cancelCtx.cancel(removeFromParent, err)
}

// valueCtx 存储值的context
type valueCtx struct {
    Context
    key, val interface{}
}

func (c *valueCtx) Value(key interface{}) interface{} {
    // 向上遍历查找key
    if c.key == key {
        return c.val
    }
    return c.Context.Value(key)
}
```

### 3.3 Context创建函数

```go
// WithCancel 创建可取消的context
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
    // 创建cancelCtx
    c := newCancelCtx(parent)

    // 添加到父context
    propagateCancel(parent, &c)

    return &c, func() {
        c.cancel(true, Canceled)
    }
}

// newCancelCtx 创建cancelCtx
func newCancelCtx(parent Context) *cancelCtx {
    return &cancelCtx{
        Context: parent,
        children: make(map[canceler]struct{}),
    }
}

// propagateCancel 传播取消到子context
func propagateCancel(parent Context, child *cancelCtx) {
    // 获取父context的cancelCtx
    if p, ok := parentCancelCtx(parent); ok {
        p.mu.Lock()
        if p.err != nil {
            // 父context已经被取消
            // 直接取消子context
            child.cancel(false, p.err)
        } else {
            // 添加到父context的children
            if p.children == nil {
                p.children = make(map[canceler]struct{})
            }
            p.children[child] = struct{}{}
        }
        p.mu.Unlock()
    } else {
        // 父context不是cancelCtx，启动一个goroutine监控
        go func() {
            select {
            case <-parent.Done():
                child.cancel(false, parent.Err())
            case <-child.Done():
                // 子context已经取消，什么都不做
            }
        }()
    }
}

// WithTimeout 创建带超时的context
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
    return WithTimeoutDeadline(parent, time.Now().Add(timeout))
}

// WithTimeoutDeadline 创建带截止时间的context
func WithTimeoutDeadline(parent Context, d time.Time) (Context, CancelFunc) {
    // 创建timerCtx
    c := &timerCtx{
        cancelCtx: *newCancelCtx(parent),
        deadline:  d,
    }

    // 添加到父context
    propagateCancel(parent, c)

    // 设置定时器
    duration := d.Sub(time.Now())
    if duration <= 0 {
        // 已经超时
        c.cancel(true, DeadlineExceeded)
        return c, func() {
            c.cancel(true, Canceled)
        }
    }

    c.timer = time.AfterFunc(duration, func() {
        c.cancel(true, DeadlineExceeded)
    })

    return c, func() {
        c.cancel(true, Canceled)
    }
}

// WithValue 创建带值的context
func WithValue(parent Context, key, val interface{}) Context {
    // 检查key有效性
    if key == nil {
        panic("nil key")
    }

    // 不能使用内置类型作为key（避免冲突）
    if !reflect.TypeOf(key).Comparable() {
        panic("key is not comparable")
    }

    return &valueCtx{
        Context: parent,
        key:    key,
        val:    val,
    }
}
```

### 3.4 Context最佳实践

```go
// Context最佳实践示例

// 1. 将Context作为第一个参数传递
func QueryUser(ctx context.Context, id int64) (*User, error) {
    // 查询用户
    return db.QueryContext(ctx, "SELECT * FROM users WHERE id = ?", id)
}

// 2. 不要将Context存储在结构体中
// 错误示例
type BadService struct {
    ctx context.Context // 错误！
}

// 正确示例
type GoodService struct {
    // 不存储context
}

// 方法接收context参数
func (s *GoodService) GetUser(ctx context.Context, id int64) (*User, error) {
    // ...
}

// 3. 使用context控制超时
func fetchDataWithTimeout(ctx context.Context) error {
    // 创建5秒超时
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // 执行请求
    return doRequest(ctx)
}

// 4. 使用context传递请求相关数据
// 定义context key
type key string

const (
    userIDKey key = "user_id"
    requestIDKey key = "request_id"
)

// 设置值
func setValues(ctx context.Context) context.Context {
    ctx = context.WithValue(ctx, userIDKey, 123)
    ctx = context.WithValue(ctx, requestIDKey, "req-001")
    return ctx
}

// 获取值
func getValues(ctx context.Context) {
    userID := ctx.Value(userIDKey).(int)
    requestID := ctx.Value(requestIDKey).(string)
    fmt.Printf("user_id=%d, request_id=%s\n", userID, requestID)
}

// 5. HTTP服务器中使用context
func httpHandler(w http.ResponseWriter, r *http.Request) {
    // 从请求创建context
    ctx := r.Context()

    // 添加追踪信息
    ctx = context.WithValue(ctx, "trace_id", getTraceID(r))

    // 在goroutine中使用
    go func() {
        // 处理长时间操作
        result := longRunningTask(ctx)
        log.Println(result)
    }()

    // 处理请求
    processRequest(ctx, w, r)
}

// 6. 优雅关闭
func serverShutdown(ctx context.Context, server *http.Server) {
    // 收到信号后，给10秒超时关闭
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
}

// 7. 并发取消
func parallelFetch(ctx context.Context, urls []string) ([]string, error) {
    // 创建result channel
    results := make(chan string, len(urls))
    errors := make(chan error, len(urls))

    // 并发请求
    for _, url := range urls {
        go func(u string) {
            resp, err := http.Get(u)
            if err != nil {
                errors <- err
                return
            }
            defer resp.Body.Close()
            body, _ := ioutil.ReadAll(resp.Body)
            results <- string(body)
        }(url)
    }

    // 收集结果
    var outputs []string
    for i := 0; i < len(urls); i++ {
        select {
        case r := <-results:
            outputs = append(outputs, r)
        case err := <-errors:
            return nil, err
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }

    return outputs, nil
}
```

---

## 四、Select深度解析

### 4.1 Select实现原理

```go
// select是Go中处理多channel操作的核心机制
// 类似于Linux的select系统调用，但专为channel设计

// select数据结构
// 编译器生成的结构，用于runtime处理
type scase struct {
    // channel指针
    c    *hchan

    // 元素指针（用于接收操作）
    elem unsafe.Pointer

    // case的偏移量
    kind uint16

    // 索引
    index int
}

// case类型常量
const (
    caseNil = iota  // nil channel
    caseDefault     // default case
    caseRecv        // <-ch
    caseSend        // ch <-
    caseClose       // 已关闭
)

// Select结构
type select struct {
    // 所有case
    tcase []scase

    // 数量
    ncase int

    // 当前运行的pollOrder
    pollorder *uint16

    // 当前运行的lockOrder
    lockorder *uint16
}

// sel睡眠 - 等待channel操作
func selectgo(cas0 *scase) (int, bool) {
    // 1. 确定pollOrder（case随机化顺序）
    // 防止饥饿：随机遍历所有case
    n := int(c.ncase)
    pollorder := (*[1000]uint16)(noescape(unsafe.Pointer(cas0))[:n])
    for i := 1; i < n; i++ {
        j := fastrandn(uint32(i + 1))
        pollorder[i], pollorder[j] = pollorder[j], pollorder[i]
    }

    // 2. 确定lockOrder（防止死锁）
    // 按channel地址顺序加锁
    lockorder := (*[1000]uint16)(noescape(unsafe.Pointer(cas0)))[n : n+n]
    for i := 0; i < n; i++ {
        lockorder[i] = uint16(i)
    }
    sort.Stub(lockorder[:n])

    // 3. 按lockOrder加锁
    for i := 0; i < n; i++ {
        c := cas0[lockorder[i]].c
        if c != nil {
            lock(&c.lock)
        }
    }

    // 4. 检查是否有可立即完成的case
    var dflt *scase
    for i := 0; i < n; i++ {
        cas := &cas0[i]

        switch cas.kind {
        case caseNil:
            // nil channel，跳过
            continue

        case caseDefault:
            // default case
            dflt = cas

        case caseRecv:
            // 检查是否有等待的发送者
            if c := cas.c; c != nil {
                if c.qcount > 0 {
                    // 缓冲区有数据，立即接收
                    return i, true
                }
                if c.sendq.len > 0 {
                    // 有等待的发送者，立即接收
                    return i, true
                }
            }

        case caseSend:
            // 检查是否可以发送
            if c := cas.c; c != nil {
                if c.closed != 0 {
                    // 发送到已关闭的channel
                    panic("send on closed channel")
                }
                if c.qcount < c.dataqsiz {
                    // 缓冲区有空间，立即发送
                    return i, true
                }
            }
        }
    }

    // 5. 没有立即完成的case，需要阻塞
    // 将自己加入所有channel的等待队列

    // 创建sudog
   sg := acquireSudog()
    sg.releasetime = 0
    sg.g = getg()
    sg.isSelect = true

    // 随机顺序添加到所有channel的发送/接收队列
    for i := 0; i < n; i++ {
        cas := &cas0[i]
        c := cas.c
        if c == nil {
            continue
        }

        switch cas.kind {
        case caseRecv:
            c.recvq.enqueue(sg)
        case caseSend:
            c.sendq.enqueue(sg)
        }
    }

    // 释放锁
    for i := 0; i < n; i++ {
        c := cas0[lockorder[i]].c
        if c != nil {
            unlock(&c.lock)
        }
    }

    // 6. 挂起goroutine，等待被唤醒
    gopark(nil, nil, waitReasonSelect, traceEvSelect, 0)

    // 7. 被唤醒（有channel就绪）
    // 重新加锁
    for i := 0; i < n; i++ {
        cas := &cas0[i]
        c := cas.c
        if c != nil {
            lock(&c.lock)
        }
    }

    // 8. 找到哪个case被唤醒
    sel := int(sg.selectdone)
    sg.selectdone = 0

    // 检查是否关闭
    var success bool
    var rrecv uintptr
    var recvOK bool

    for i := 0; i < n; i++ {
        cas := &cas0[i]
        c := cas.c
        if c == nil {
            continue
        }

        if cas.kind == caseRecv && c == sg.c {
            // 被接收操作唤醒
            sel = i
            success = true
            recvOK = sg.success
            if cas.elem != nil && !sg.success {
                // 接收到零值
                memclrNoHeapPointers(cas.elem, c.elemsize)
            }
        } else if cas.kind == caseSend && c == sg.c {
            // 被发送操作唤醒
            sel = i
            success = true
        }
    }

    // 9. 从所有等待队列中移除
    for i := 0; i < n; i++ {
        cas := &cas0[i]
        c := cas.c
        if c != nil {
            switch cas.kind {
            case caseRecv:
                rrecvq.dequeue(sg)
            case caseSend:
                c.sendq.dequeue(sg)
            }
        }
    }

    // 释放锁
    for i := 0; i < n; i++ {
        c := cas0[lockorder[i]].c
        if c != nil {
            unlock(&c.lock)
        }
    }

    // 释放sudog
    releaseSudog(sg)

    return sel, success
}
```

### 4.2 Select使用模式

```go
// select基本用法
func select_basic() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    select {
    case v := <-ch1:
        fmt.Println("收到ch1:", v)
    case v := <-ch2:
        fmt.Println("收到ch2:", v)
    default:
        fmt.Println("两个channel都不可用")
    }
}

// 超时模式
func select_timeout() {
    ch := make(chan int)

    select {
    case v := <-ch:
        fmt.Println("收到:", v)
    case <-time.After(5 * time.Second):
        fmt.Println("超时")
    }
}

// 优雅关闭
func select_close() {
    done := make(chan struct{})
    ch := make(chan int)

    go func() {
        for {
            select {
            case <-done:
                fmt.Println("收到关闭信号")
                return
            case v := <-ch:
                fmt.Println("处理:", v)
            }
        }
    }()

    // 发送数据
    ch <- 1
    ch <- 2

    // 关闭
    close(done)
}

// 防止阻塞
func select_nonblocking() {
    ch := make(chan int, 1)

    select {
    case ch <- 10:
        fmt.Println("发送成功")
    default:
        fmt.Println("channel已满，发送失败")
    }
}

// 遍历channel
func select_range() {
    ch := make(chan int, 10)

    // 填充数据
    for i := 1; i <= 10; i++ {
        ch <- i
    }
    close(ch)

    // 使用for-range会自动处理select
    // 实际上底层使用了select
    for v := range ch {
        fmt.Println("收到:", v)
    }
}
```

---

## 五、sync同步原语

### 5.1 WaitGroup详解

```go
// WaitGroup用于等待一组goroutine完成

// WaitGroup数据结构
type WaitGroup struct {
    noCopy noCopy

    // 状态计数器
    // 高32位是计数器
    // 低32位是等待者数量
    // 使用原子操作，无锁设计
    state uint64

    // 信号量，用于唤醒等待者
    sema uint32
}

func (wg *WaitGroup) Add(delta int) {
    // 原子操作修改状态
    state := atomic.AddUint64(&wg.state, uint64(delta)<<32)

    // 提取计数器和等待者
    v := int32(state >> 32)
    w := uint32(state)

    if v < 0 {
        panic("sync: negative WaitGroup counter")
    }

    // 如果计数器变为0且有等待者，唤醒他们
    if v == 0 && w != 0 {
        for {
            // 减少等待者计数
            if atomic.CompareAndSwapUint32(&wg.state, state, state+1) {
                // 唤醒一个等待者
                runtime_Semrelease(&wg.sema, false, 0)
                break
            }
            state = atomic.LoadUint64(&wg.state)
        }
    }
}

func (wg *WaitGroup) Done() {
    wg.Add(-1)
}

func (wg *WaitGroup) Wait() {
    for {
        state := atomic.LoadUint64(&wg.state)

        // 获取计数器和等待者
        v := int32(state >> 32)
        w := uint32(state)

        if v == 0 {
            // 计数器为0，无需等待
            return
        }

        // 增加等待者计数
        if atomic.CompareAndSwapUint64(&wg.state, state, state+1) {
            // 阻塞等待信号
            runtime_Semacquire(&wg.sema, false, 0)
        }
    }
}

// 使用示例
func waitgroup_example() {
    var wg sync.WaitGroup

    // 添加3个goroutine
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done() // 确保退出时减少计数
            fmt.Printf("Goroutine %d 开始\n", id)
            time.Sleep(time.Duration(id) * 100 * time.Millisecond)
            fmt.Printf("Goroutine %d 完成\n", id)
        }(i)
    }

    // 等待所有goroutine完成
    wg.Wait()
    fmt.Println("所有任务完成")
}
```

### 5.2 Mutex与RWMutex

```go
// Mutex 互斥锁
type Mutex struct {
    state int32
    sema  uint32
}

// Mutex状态
const (
    mutexLocked = 1 << iota // 1: 已锁定
    mutexWoken              // 2: 唤醒
    mutexWaiterShift = iota // 等待者位移
)

// Lock 加锁
func (m *Mutex) Lock() {
    // 快速路径：尝试直接获取锁
    if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
        return
    }

    // 慢速路径
    m.lockSlow()
}

func (m *Mutex) lockSlow() {
    var waitStartTime int64
    starving := false
    awoke := false
    iter := 0
    old := atomic.LoadInt32(&m.state)

    for {
        // 如果已锁定且未饥饿
        if old&(mutexLocked|mutexStarving) == mutexLocked && runtime_canSpin(iter) {
            // 自旋等待
            if !awoke {
                awoke = true
            }
            runtime_doSpin()
            iter++
            old = atomic.LoadInt32(&m.state)
            continue
        }

        new := old

        // 如果不是饥饿状态，尝试获取锁
        if old&mutexStarving == 0 {
            new |= mutexLocked
        }

        // 增加等待者计数
        if old&(mutexLocked|mutexStarving) != 0 {
            new += 1 << mutexWaiterShift
        }

        // 如果处于饥饿状态且已锁定，转为饥饿状态
        if starving && old&mutexLocked != 0 {
            new |= mutexStarving
        }

        // 清除唤醒标记
        if awoke {
            new &^= mutexWoken
        }

        // 尝试更新状态
        if atomic.CompareAndSwapInt32(&m.state, old, new) {
            // 如果之前未锁定且非饥饿，现在获取锁
            if old&(mutexLocked|mutexStarving) == 0 {
                break
            }

            // 计算等待时间
            waitStartTime = runtime_nanotime()
            if old&mutexStarving != 0 {
                runtime_SemacquireMutex(&m.sema, false, 1)
            } else {
                runtime_Semacquire(&m.sema, false, 0)
            }

            // 检查是否应该变为饥饿
            starving = runtime_nanotime()-waitStartTime > starvationThresholdNs
            old = atomic.LoadInt32(&m.state)
            if old&mutexStarving != 0 {
                if atomic.LoadInt32(&m.state)&mutexLocked != 0 {
                    // 饥饿状态下等待者超过1个
                    runtime_Semrelease(&m.sema, false, 1)
                }
            }
        }
    }
}

// RWMutex 读写锁
type RWMutex struct {
    w           Mutex
    writerSem   uint32
    readerSem   uint32
    readerCount atomic.Int32
    readerWait  atomic.Int32
}

func (m *RWMutex) RLock() {
    // 读者计数+1
    if m.readerCount.Add(1) < 0 {
        // 有写者等待，阻塞
        runtime_Semacquire(&m.readerSem, false, 0)
    }
}

func (m *RWMutex) RUnlock() {
    if r := m.readerCount.Add(-1); r < 0 {
        // 最后一个读者，唤醒写者
        if r == -1 {
            runtime_Semrelease(&m.writerSem, false, 1)
        }
    }
}

func (m *RWMutex) Lock() {
    // 阻塞新的读者
    m.w.Lock()
    // 等待所有读者完成
    mr := m.readerCount.Add(-maxReaders) + maxReaders
    if mr != 0 {
        runtime_Semrelease(&m.readerSem, false, mr)
    }
}

func (m *RWMutex) Unlock() {
    // 唤醒所有读者
    m.readerCount.Add(maxReaders)
    runtime_Semrelease(&m.readerSem, false, 0)
    m.w.Unlock()
}
```

### 5.3 errgroup并发错误处理

```go
// golang.org/x/sync/errgroup

// Group 并发任务组
type Group struct {
    cancel    context.CancelFunc
    wg        sync.WaitGroup
    errOnce   sync.Once
    err       error
}

// WithContext 创建带取消的Group
func WithContext(ctx context.Context) (*Group, context.Context) {
    ctx, cancel := context.WithCancel(ctx)
    return &Group{cancel: cancel}, ctx
}

// Wait 等待所有任务完成
func (g *Group) Wait() error {
    g.wg.Wait()
    if g.cancel != nil {
        g.cancel()
    }
    return g.err
}

// Go 启动一个任务
func (g *Group) Go(fn func() error) {
    g.wg.Add(1)
    go func() {
        defer g.wg.Done()

        if err := fn(); err != nil {
            g.errOnce.Do(func() {
                g.err = err
                if g.cancel != nil {
                    g.cancel()
                }
            })
        }
    }()
}

// 使用示例
func errgroup_example() error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    g, ctx := errgroup.WithContext(ctx)

    urls := []string{
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
    }

    for _, url := range urls {
        url := url // 避免闭包问题
        g.Go(func() error {
            resp, err := http.Get(url)
            if err != nil {
                return fmt.Errorf("请求 %s 失败: %w", url, err)
            }
            defer resp.Body.Close()
            return nil
        })
    }

    // 等待所有请求完成
    // 如果任何一个失败，ctx会被取消
    return g.Wait()
}

// 并发限制版本
func errgroup_with_limit() error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    g, ctx := errgroup.WithContext(ctx)

    // 限制并发数为5
    sem := make(chan struct{}, 5)

    urls := []string{/* ... */}

    for _, url := range urls {
        url := url
        g.Go(func() error {
            // 获取信号量
            sem <- struct{}{}
            defer func() { <-sem }()

            resp, err := http.Get(url)
            if err != nil {
                return err
            }
            defer resp.Body.Close()
            return nil
        })
    }

    return g.Wait()
}
```

---

## 六、并发安全与性能优化

### 6.1 并发安全模式

```go
// 竞态条件示例与解决

// 不安全的计数器
type UnsafeCounter struct {
    count int
}

// 安全计数器 - 使用Mutex
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// 原子操作计数器 - 更高效
type AtomicCounter struct {
    count atomic.Int64
}

func (c *AtomicCounter) Inc() {
    c.count.Add(1)
}

func (c *AtomicCounter) Value() int64 {
    return c.count.Load()
}

// 减少锁竞争 - 分片
type ShardedCounter struct {
    shards []*Shard
    num    int
}

type Shard struct {
    mu    sync.Mutex
    count int64
}

func NewShardedCounter(numShards int) *ShardedCounter {
    shards := make([]*Shard, numShards)
    for i := 0; i < numShards; i++ {
        shards[i] = &Shard{}
    }
    return &ShardedCounter{
        shards: shards,
        num:    numShards,
    }
}

func (c *ShardedCounter) Inc() {
    // 只锁一个分片，减少竞争
    shard := c.shards[rand.Intn(c.num)]
    shard.mu.Lock()
    shard.count++
    shard.mu.Unlock()
}

func (c *ShardedCounter) Total() int64 {
    var total int64
    for _, shard := range c.shards {
        shard.mu.Lock()
        total += shard.count
        shard.mu.Unlock()
    }
    return total
}
```

### 6.2 性能优化技巧

```go
// 1. 减少锁竞争
// 错误：每次操作都加全局锁
type BadRateLimiter struct {
    mu  sync.Mutex
    now time.Time
}

func (r *BadRateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()
    // ... 检查 ...
    return true
}

// 正确：使用sync/atomic
type GoodRateLimiter struct {
    tokens    float64
    lastTime  int64
    mu        sync.Mutex
}

func (r *GoodRateLimiter) Allow() bool {
    r.mu.Lock()
    defer r.mu.Unlock()

    now := time.Now().UnixNano()
    elapsed := float64(now - r.lastTime)
    r.lastTime = now

    r.tokens += elapsed * tokensPerSecond / float64(time.Second)
    if r.tokens > maxTokens {
        r.tokens = maxTokens
    }

    if r.tokens >= 1 {
        r.tokens--
        return true
    }
    return false
}

// 2. 使用channel代替mutex共享内存
// 共享内存模式
func sharedMemory() {
    var mu sync.Mutex
    counter := 0

    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++
            mu.Unlock()
        }()
    }
    wg.Wait()
}

// channel通信模式
func channelPattern() {
    counter := make(chan int, 1)
    counter <- 0

    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            count := <-counter
            counter <- count+1
        }()
    }
    wg.Wait()
    fmt.Println(<-counter)
}

// 3. 使用sync.Pool复用对象
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 4096)
    },
}

func usePool() {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)
    // 使用buffer
}

// 4. 避免频繁创建goroutine
// 使用worker pool
func workerPool() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    // 启动固定数量的worker
    const numWorkers = 10
    var wg sync.WaitGroup
    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                // 处理job
                results <- job * 2
            }
        }()
    }

    // 发送任务
    for j := 1; j <= 100; j++ {
        jobs <- j
    }
    close(jobs)

    // 收集结果
    go func() {
        wg.Wait()
        close(results)
    }()

    for result := range results {
        fmt.Println(result)
    }
}

// 5. 批量操作减少系统调用
type BatchProcessor struct {
    batchSize int
    timeout   time.Duration
    ch        chan interface{}
    mu        sync.Mutex
    batch     []interface{}
}

func (p *BatchProcessor) Add(item interface{}) error {
    p.mu.Lock()
    p.batch = append(p.batch, item)
    shouldFlush := len(p.batch) >= p.batchSize
    p.mu.Unlock()

    if shouldFlush {
        return p.flush()
    }

    // 启动超时flush
    go func() {
        time.Sleep(p.timeout)
        p.flush()
    }()

    return nil
}

func (p *BatchProcessor) flush() error {
    p.mu.Lock()
    if len(p.batch) == 0 {
        p.mu.Unlock()
        return nil
    }
    batch := p.batch
    p.batch = nil
    p.mu.Unlock()

    // 批量处理
    return p.processBatch(batch)
}
```

---

## 附录：Go并发编程要点速查

```
┌────────────────────────────────────────────────────────────────┐
│                    Go 并发编程要点速查                          │
├────────────────────────────────────────────────────────────────┤
│  GMP调度模型                                                    │
│  ├── G (Goroutine) - 轻量级执行单元                            │
│  ├── M (Machine) - 操作系统线程                                │
│  ├── P (Processor) - 执行上下文                                │
│  └── 工作窃取 - 提高CPU利用率                                   │
├────────────────────────────────────────────────────────────────┤
│  Channel                                                        │
│  ├── 无缓冲 channel - 同步通信                                  │
│  ├── 有缓冲 channel - 异步通信                                  │
│  ├── 关闭 channel - 发送关闭信号                                │
│  └── select - 多路复用                                          │
├────────────────────────────────────────────────────────────────┤
│  Context                                                        │
│  ├── WithCancel - 可取消                                       │
│  ├── WithTimeout - 超时控制                                    │
│  ├── WithValue - 传递数据                                      │
│  └── 不要存储在结构体中                                         │
├────────────────────────────────────────────────────────────────┤
│  同步原语                                                        │
│  ├── sync.Mutex - 互斥锁                                       │
│  ├── sync.RWMutex - 读写锁                                     │
│  ├── sync.WaitGroup - 等待组                                   │
│  ├── sync.Once - 单次执行                                     │
│  ├── sync.Cond - 条件变量                                      │
│  └── sync.Map - 并发安全Map                                    │
├────────────────────────────────────────────────────────────────┤
│  最佳实践                                                        │
│  ├── 不要使用共享内存来通信                                     │
│  ├── 使用通信来共享内存                                         │
│  ├── 保持channel所有权的清晰划分                                │
│  ├── 使用context传递请求级数据                                  │
│  └── 避免goroutine泄露                                         │
└────────────────────────────────────────────────────────────────┘
```

---

*本文档由AI辅助分析编写，基于对Go Runtime源码的深度分析*
