# Linux系统调用与IO模型

## 前言：从一次请求说起

想象你去餐厅吃饭。传统的方式是：你坐在座位上等服务员来记下你的点单，然后服务员去厨房告诉你厨师，厨师做完后再由服务员端给你。

服务员就相当于 CPU，你和其他顾客都坐在餐厅里（阻塞状态）等待。如果服务员只有一个，而你有很多顾客，服务员就会忙不过来。

现代餐厅会用更好的方式：你扫二维码点单，厨房看到订单后开始做菜，你可以在手机上干别的事。菜做好了，会有通知告诉你来取或者直接送到你桌上。这就是**异步 I/O** 的思想——不用一直傻等。

Linux 的 I/O 模型就是这个故事的计算机版本。

---

## 第一章：系统调用基础

### 1.1 什么是系统调用？

**系统调用（System Call）**是用户程序请求操作系统内核服务的接口。你可以把它想象成"去柜台办事"——应用程序不能直接操作硬件，必须通过操作系统。

```
用户程序                      内核
┌──────────────┐            ┌──────────────┐
│              │            │              │
│  printf()    │            │   文件系统   │
│  malloc()    │            │   进程管理   │
│  socket()    │ ────►     │   内存管理   │
│  read()      │  系统调用   │   设备驱动   │
│  write()     │            │   网络协议   │
│              │            │              │
└──────────────┘            └──────────────┘
```

### 1.2 系统调用的执行过程

当你执行 `read(fd, buffer, 100)` 时，底层的执行过程如下：

```c
// 系统调用的执行过程（简化版）

// 1. 用户程序调用库函数
ssize_t read(int fd, void* buf, size_t count) {
    // 2. 库函数准备参数
    //    - 系统调用号 (__NR_read) 放入寄存器
    //    - 参数放入其他寄存器

    // 3. 触发软中断（syscall 指令）
    //    在 x86-64 上是 syscall 指令
    //    这会切换到内核态

    // 4. 内核根据系统调用号找到对应的处理函数
    //    sys_read() 被调用

    // 5. 内核执行操作
    //    - 检查文件描述符是否有效
    //    - 复制数据从内核空间到用户空间
    //    - 返回读取的字节数

    // 6. 返回用户空间，继续执行
}

// 内核中的系统调用处理函数
asmlinkage ssize_t sys_read(unsigned int fd, char __user* buf, size_t count) {
    // asmlinkage: 告诉编译器从堆栈获取参数

    struct file* file;      // 文件结构
    ssize_t ret;            // 返回值

    // 根据 fd 找到对应的 file 结构
    file = fget(fd);
    if (!file)
        return -EBADF;  // 无效的文件描述符

    // 调用文件系统的 read 方法
    ret = file->f_op->read(file, buf, count, &file->f_pos);

    // 减少引用计数
    fput(file);

    return ret;
}
```

### 1.3 常用的 I/O 系统调用

```c
// 打开/创建文件
int open(const char* pathname, int flags, mode_t mode);
// flags: O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_NONBLOCK 等
// mode: 文件权限，如 0644

// 关闭文件
int close(int fd);

// 读取数据
ssize_t read(int fd, void* buf, size_t count);

// 写入数据
ssize_t write(int fd, const void* buf, size_t count);

// 文件偏移
off_t lseek(int fd, off_t offset, int whence);
// whence: SEEK_SET(开头), SEEK_CUR(当前位置), SEEK_END(结尾)

// 同步写入
int fsync(int fd);  // 确保数据写入磁盘

// 创建管道
int pipe(int fd[2]);  // fd[0] 读端，fd[1] 写端

// 套接字创建
int socket(int domain, int type, int protocol);
// domain: AF_INET(IPV4), AF_INET6(IPV6), AF_UNIX(本地)
// type: SOCK_STREAM(TCP), SOCK_DGRAM(UDP)

// 绑定地址
int bind(int sockfd, const struct sockaddr* addr, socklen_t addrlen);

// 监听连接
int listen(int sockfd, int backlog);

// 接受连接
int accept(int sockfd, struct sockaddr* addr, socklen_t* addrlen);

// 连接
int connect(int sockfd, const struct sockaddr* addr, socklen_t addrlen);
```

---

## 第二章：同步阻塞 I/O

### 2.1 阻塞 I/O 的含义

**阻塞 I/O** 是最传统的 I/O 模式。当应用程序调用 `read()` 读取数据时：

```
阻塞 I/O 流程：

用户进程                          内核                          硬件
┌─────────┐                     ┌─────────┐                  ┌─────────┐
│ read()  │                     │         │                  │         │
│ 阻塞等待│ ◄────────────────── │ 数据准备中│ ◄────────────── │ 磁盘    │
│         │                     │         │                  │ 网络    │
└─────────┘                     └─────────┘                  └─────────┘
     │                               │                            │
     │                               │ 复制数据到用户空间           │
     │      数据就绪                 │ ─────────────────────────► │
     │ ◄────────────────────────────│                            │
     │   read() 返回                │                            │
     │                               │                            │
```

### 2.2 阻塞 I/O 的代码示例

```c
// 传统的阻塞 I/O 服务器
// 每次只能处理一个客户端

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PORT 8080
#define BUFFER_SIZE 1024

// 处理单个客户端
void handle_client(int client_fd) {
    char buffer[BUFFER_SIZE];

    // 读取客户端数据（阻塞）
    ssize_t n = read(client_fd, buffer, sizeof(buffer) - 1);

    if (n > 0) {
        buffer[n] = '\0';
        printf("收到: %s\n", buffer);

        // 发送响应
        char* response = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello";
        write(client_fd, response, strlen(response));
    }

    // 关闭客户端连接
    close(client_fd);
}

int main() {
    // 创建 socket
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        exit(1);
    }

    // 设置地址复用（快速重启）
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // 绑定地址
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(PORT);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        exit(1);
    }

    // 监听连接
    if (listen(server_fd, 10) < 0) {
        perror("listen");
        exit(1);
    }

    printf("服务器监听端口 %d\n", PORT);

    // 主循环：接受连接并处理
    while (1) {
        // 接受连接（阻塞）
        int client_fd = accept(server_fd, NULL, NULL);

        if (client_fd < 0) {
            perror("accept");
            continue;
        }

        // 处理客户端（阻塞）
        // 重要：在这个简单实现中，处理完一个客户端才能接受下一个
        handle_client(client_fd);
    }

    close(server_fd);
    return 0;
}
```

### 2.3 阻塞 I/O 的问题

```
阻塞 I/O 的问题：

    客户端1 ──► connect() ──► 等待服务器响应（阻塞）

                        客户端2 ──► connect() ──► 被阻塞（无法连接）

                                        客户端3 ──► connect() ──► 被阻塞

问题：
- 单线程只能处理一个客户端
- 其他客户端必须等待
- CPU 空闲浪费在等待 I/O 上
```

---

## 第三章：非阻塞 I/O

### 3.1 非阻塞 I/O 的概念

**非阻塞 I/O** 通过设置 `O_NONBLOCK` 标志，让 I/O 操作立即返回而不是等待：

- 如果数据没准备好，返回 `-1`，`errno` 设置为 `EAGAIN` 或 `EWOULDBLOCK`
- 如果数据准备好了，返回实际数据

```c
// 非阻塞 I/O 的工作方式

// 设置 socket 为非阻塞
int flags = fcntl(fd, F_GETFL, 0);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

while (1) {
    // 尝试读取数据
    ssize_t n = read(fd, buffer, sizeof(buffer));

    if (n > 0) {
        // 读取到数据
        process_data(buffer, n);
    } else if (n < 0 && errno == EAGAIN) {
        // 数据还没准备好，稍后再试
        // 可以做其他工作
        do_other_work();
        usleep(10000);  // 休息 10ms
    } else if (n < 0) {
        // 出错了
        perror("read");
        break;
    } else {
        // n == 0 表示连接关闭
        break;
    }
}
```

### 3.2 非阻塞 I/O 的轮询问题

非阻塞 I/O 需要不断轮询检查数据是否就绪，这会浪费 CPU：

```python
# 非阻塞 I/O 的轮询问题
# Python 示例

import socket
import time

def polling_server():
    """非阻塞轮询服务器的问题"""

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 8080))
    server.listen(5)

    # 设置为非阻塞
    server.setblocking(False)

    clients = []

    print("非阻塞轮询服务器（CPU 忙等待）")
    start_time = time.time()

    while True:
        try:
            # 尝试接受连接（非阻塞）
            client, addr = server.accept()
            print(f"接受连接: {addr}")
            client.setblocking(False)  # 客户端也是非阻塞
            clients.append(client)
        except BlockingIOError:
            # 没有新连接
            pass

        # 轮询所有客户端读取数据
        for client in clients[:]:  # 使用切片避免修改问题
            try:
                data = client.recv(1024)
                if data:
                    print(f"收到数据: {data}")
                    client.send(b"OK")
                else:
                    # 连接关闭
                    clients.remove(client)
                    client.close()
            except BlockingIOError:
                # 这个客户端暂时没数据
                pass
            except ConnectionResetError:
                clients.remove(client)
                client.close()

        # 问题：即使没有事情做，程序也在疯狂轮询
        # 浪费 CPU 资源
        #
        # 更好的做法是使用 select/poll/epoll

        if time.time() - start_time > 10:
            break

    # 清理
    for client in clients:
        client.close()
    server.close()

# polling_server()
```

---

## 第四章：I/O 多路复用

### 4.1 select 的原理

**select** 允许你同时监控多个文件描述符，当其中任何一个"准备好"时就返回。

```
select 工作原理：

    应用程序告诉内核："帮我监控这些 fd，有情况叫我"

    ┌─────────────────────────────────────────────────────┐
    │  fd_set: 文件描述符集合                              │
    │                                                       │
    │  [0] [1] [2] [3] [4] [5] ... [1023]                   │
    │   ✓   ✓   ✗   ✓   ✗   ✓       ✗                    │
    │                                                       │
    │  ✓ = 被监控的文件描述符                               │
    │  ✗ = 不关心的文件描述符                               │
    └─────────────────────────────────────────────────────┘

    内核返回："fd 1 和 fd 3 可读了！"

    应用程序遍历找出具体是哪些 fd
```

### 4.2 select 的实现

```c
// select 的使用

#include <sys/select.h>
#include <sys/time.h>

// fd_set 是文件描述符集合
// FD_SETSIZE 通常是 1024

fd_set read_fds;          // 监控可读的 fd 集合
fd_set write_fds;         // 监控可写的 fd 集合

// 初始化为空
FD_ZERO(&read_fds);
FD_ZERO(&write_fds);

// 添加要监控的 fd
FD_SET(fd1, &read_fds);
FD_SET(fd2, &read_fds);
FD_SET(fd3, &read_fds);

// 设置超时
struct timeval timeout;
timeout.tv_sec = 5;   // 秒
timeout.tv_usec = 0;  // 微秒

// 监控
int nfds = fd3 + 1;  // 最大的 fd + 1
int n = select(nfds, &read_fds, &write_fds, NULL, &timeout);

if (n < 0) {
    perror("select");
} else if (n == 0) {
    printf("超时，没有文件描述符准备好\n");
} else {
    // 检查哪些 fd 准备好了
    if (FD_ISSET(fd1, &read_fds)) {
        // fd1 可读
        read_from_fd1();
    }
    if (FD_ISSET(fd2, &read_fds)) {
        // fd2 可读
        read_from_fd2();
    }
    // ...
}
```

### 4.3 select 的问题

```c
// select 的主要问题：

// 1. fd 数量限制（FD_SETSIZE 通常是 1024）
//    无法监控超过 1024 个 fd

// 2. 每次调用需要：
//    - 从用户态拷贝 fd_set 到内核态
//    - 内核遍历所有 fd 检查状态
//    - 从内核态拷贝 fd_set 回用户态
//    - 然后用户态再遍历找出哪些 fd 准备好了

//    这个过程 O(n) 复杂度，每次都要全部复制

// 3. 需要重建 fd_set
FD_ZERO(&read_fds);
FD_SET(client_fd, &read_fds);
// 因为 select 会修改传入的 fd_set

// select 的时间复杂度：
// select() 调用: O(max_fd) = O(1024) 或更大
// 检查结果: O(max_fd)
```

### 4.4 poll 的改进

**poll** 与 select 类似，但使用链表代替固定大小的数组：

```c
// poll 的使用

#include <poll.h>

// pollfd 结构
struct pollfd {
    int fd;           // 文件描述符
    short events;     // 监控的事件（输入）
    short revents;    // 实际发生的事件（输出）
};

// 监控的事件类型
// POLLIN: 可读
// POLLOUT: 可写
// POLLERR: 错误
// POLLHUP: 挂起
// POLLNVAL: 无效请求

struct pollfd fds[100];
int nfds = 0;

// 添加监控
fds[nfds].fd = fd1;
fds[nfds].events = POLLIN;
nfds++;

fds[nfds].fd = fd2;
fds[nfds].events = POLLIN | POLLOUT;
nfds++;

// 设置超时（毫秒）
int timeout_ms = 5000;

// 监控
int n = poll(fds, nfds, timeout_ms);

if (n < 0) {
    perror("poll");
} else if (n == 0) {
    printf("超时\n");
} else {
    // 检查哪些 fd 准备好了
    for (int i = 0; i < nfds; i++) {
        if (fds[i].revents & POLLIN) {
            // fd 可读
            handle_read(fds[i].fd);
        }
        if (fds[i].revents & POLLOUT) {
            // fd 可写
            handle_write(fds[i].fd);
        }
    }
}
```

### 4.5 poll vs select

| 特性 | select | poll |
|------|--------|------|
| **fd 数量** | 受 FD_SETSIZE 限制（通常1024） | 无限制（受内存） |
| **数据结构** | 固定大小数组 | 链表 |
| **每次调用** | 需要重建 | 复用但需重置 events |
| **效率** | O(n) 遍历所有 fd | O(n) 遍历所有 fd |
| **跨平台** | 更好 | 稍差（但现在都支持） |

---

## 第五章：epoll —— 高效 I/O 多路复用

### 5.1 epoll 的核心思想

**epoll** 是 Linux 特有的 I/O 多路复用机制，它解决了 select/poll 的问题：

```
select/poll 的问题：
- 每次调用都要把 fd 列表从用户态复制到内核态
- 内核要遍历所有 fd 检查状态
- 用户态也要遍历所有 fd 找出就绪的

epoll 的改进：
- 使用红黑树管理 fd，不需要每次重建
- 内核维护就绪列表，只返回已就绪的 fd
- 只需在每次调用时传递少量数据

核心数据结构：
1. eventpoll 对象：包含红黑树和就绪列表
2. 红黑树：存储所有监控的 fd
3. 就绪列表：存储已就绪的 fd
```

### 5.2 epoll 的使用

```c
// epoll 的三个核心函数

// 1. 创建一个 epoll 实例
// 返回一个 epoll 文件描述符
int epoll_create(int size);  // size 是 hint，现在被忽略
// 现代用法：epoll_create1(0)

int epfd = epoll_create1(0);
if (epfd < 0) {
    perror("epoll_create1");
}

// 2. 添加/修改/删除监控的 fd
struct epoll_event {
    uint32_t events;    // 事件类型
    epoll_data_t data;  // 用户数据（通常是 fd）
};

typedef union epoll_data {
    void* ptr;
    int fd;
    uint32_t u32;
    uint64_t u64;
} epoll_data_t;

// 事件类型
// EPOLLIN: 可读
// EPOLLOUT: 可写
// EPOLLET: 边缘触发（Edge Triggered）
// EPOLLONESHOT: 只监控一次

struct epoll_event ev;
ev.events = EPOLLIN;       // 监控可读事件
ev.data.fd = client_fd;    // 记住是谁

// 添加到 epoll 实例
int op = EPOLL_CTL_ADD;    // 还有 MOD 和 DEL
epoll_ctl(epfd, op, client_fd, &ev);

// 3. 等待事件发生
struct epoll_event events[1024];
int maxevents = 1024;
int timeout_ms = 1000;     // 超时，-1 表示永久阻塞

int n = epoll_wait(epfd, events, maxevents, timeout_ms);

if (n < 0) {
    perror("epoll_wait");
} else if (n == 0) {
    // 超时
} else {
    // n 个事件就绪
    for (int i = 0; i < n; i++) {
        int fd = events[i].data.fd;

        if (events[i].events & EPOLLIN) {
            // fd 可读
            handle_read(fd);
        }
        if (events[i].events & EPOLLOUT) {
            // fd 可写
            handle_write(fd);
        }
    }
}
```

### 5.3 水平触发 vs 边缘触发

```
水平触发（Level Triggered，LT）：
- 只要条件满足，就一直通知
- 默认模式
- 如果不处理，每次 epoll_wait 都会返回这个 fd

边缘触发（Edge Triggered，ET）：
- 只在状态变化时通知一次
- 需要非阻塞 fd
- 效率更高，但编程更复杂

示例场景：

客户端发送了 1000 字节数据

水平触发（LT）：
    epoll_wait() 返回 ──► 你只读了 100 字节
    epoll_wait() 再次返回 ──► 还有 900 字节
    你读了 900 字节
    epoll_wait() 再次返回 ──► 数据读完了

边缘触发（ET）：
    epoll_wait() 返回 ──► 有新数据（边缘）
    你必须一次性读完所有数据！
    如果你没读完，数据还在，但不会通知你了
    ──► 饿死（starvation）

ET 的优势：减少系统调用次数
LT 的优势：编程简单，不会遗漏数据
```

```c
// 边缘触发示例（需要非阻塞 fd）

int flags = fcntl(fd, F_GETFL, 0);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

struct epoll_event ev;
ev.events = EPOLLIN | EPOLLET;  // 边缘触发
ev.data.fd = fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &ev);

// 边缘触发下，读取数据要循环直到读完
while (1) {
    char buffer[1024];
    ssize_t n = read(fd, buffer, sizeof(buffer));

    if (n > 0) {
        // 处理数据
        process(buffer, n);
    } else if (n < 0 && errno == EAGAIN) {
        // 数据读完了
        break;
    } else {
        // 出错了或连接关闭
        break;
    }
}
```

### 5.4 epoll 服务器示例

```c
// 高性能 epoll 服务器

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <errno.h>

#define PORT 8080
#define MAX_EVENTS 1024
#define BUFFER_SIZE 4096

// 设置 fd 为非阻塞
int set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags < 0) return -1;
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

int main() {
    // 创建监听 socket
    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) {
        perror("socket");
        exit(1);
    }

    // 设置地址复用
    int opt = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // 绑定
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(PORT);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(listen_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        exit(1);
    }

    // 监听
    if (listen(listen_fd, 128) < 0) {
        perror("listen");
        exit(1);
    }

    // 设置非阻塞
    set_nonblocking(listen_fd);

    // 创建 epoll 实例
    int epfd = epoll_create1(0);
    if (epfd < 0) {
        perror("epoll_create1");
        exit(1);
    }

    // 添加监听 socket 到 epoll
    struct epoll_event ev;
    ev.events = EPOLLIN;         // 监控可读事件（连接请求）
    ev.data.fd = listen_fd;
    if (epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev) < 0) {
        perror("epoll_ctl");
        exit(1);
    }

    printf("epoll 服务器监听端口 %d\n", PORT);

    // 事件数组
    struct epoll_event events[MAX_EVENTS];
    char buffer[BUFFER_SIZE];

    // 主循环
    while (1) {
        // 等待事件
        int n = epoll_wait(epfd, events, MAX_EVENTS, -1);

        if (n < 0) {
            if (errno == EINTR) continue;
            perror("epoll_wait");
            break;
        }

        // 处理所有就绪的事件
        for (int i = 0; i < n; i++) {
            int fd = events[i].data.fd;
            uint32_t event_flags = events[i].events;

            // 处理错误
            if (event_flags & (EPOLLERR | EPOLLHUP)) {
                printf("fd %d 错误或挂起，关闭\n", fd);
                epoll_ctl(epfd, EPOLL_CTL_DEL, fd, NULL);
                close(fd);
                continue;
            }

            // 处理新连接
            if (fd == listen_fd && (event_flags & EPOLLIN)) {
                while (1) {
                    int client_fd = accept(listen_fd, NULL, NULL);
                    if (client_fd < 0) {
                        if (errno == EAGAIN || errno == EWOULDBLOCK) {
                            // 没有更多连接了
                            break;
                        }
                        perror("accept");
                        break;
                    }

                    // 设置非阻塞
                    set_nonblocking(client_fd);

                    // 添加到 epoll
                    struct epoll_event client_ev;
                    client_ev.events = EPOLLIN | EPOLLET;
                    client_ev.data.fd = client_fd;
                    if (epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &client_ev) < 0) {
                        perror("epoll_ctl");
                        close(client_fd);
                    }
                }
                continue;
            }

            // 处理客户端数据（边缘触发）
            if (event_flags & EPOLLIN) {
                // 循环读取所有数据
                while (1) {
                    ssize_t bytes_read = read(fd, buffer, sizeof(buffer));

                    if (bytes_read > 0) {
                        // 处理数据
                        printf("fd %d 收到 %zd 字节\n", fd, bytes_read);

                        // 简单回显
                        write(fd, "OK", 2);
                    } else if (bytes_read < 0 && errno == EAGAIN) {
                        // 数据读完了
                        break;
                    } else {
                        // 连接关闭或出错
                        printf("fd %d 断开\n", fd);
                        epoll_ctl(epfd, EPOLL_CTL_DEL, fd, NULL);
                        close(fd);
                        break;
                    }
                }
            }
        }
    }

    close(listen_fd);
    close(epfd);
    return 0;
}
```

---

## 第六章：异步 I/O

### 6.1 同步 vs 异步

```
同步 I/O：
- 应用程序发起 I/O 操作后，等待操作完成
- 在等待期间不能做其他事情
- read()/write() 都是同步的

异步 I/O：
- 应用程序发起 I/O 操作，立即返回
- 操作系统完成 I/O 后通知应用程序
- 应用程序可以去做其他事情

类比：
同步：打电话订餐，等着厨师做完，直到你挂电话才能做别的
异步：网上下单，做别的事情，外卖到了会通知你
```

### 6.2 Linux 异步 I/O (aio)

```c
// Linux 原生异步 I/O (aio)

#include <aio.h>

// 异步读操作
struct aiocb {
    int aio_fildes;      // 文件描述符
    off_t aio_offset;    // 偏移量
    void* aio_buf;        // 缓冲区
    size_t aio_nbytes;    // 读取字节数
    int aio_reqprio;      // 请求优先级
    struct sigevent aio_sigevent;  // 完成后通知方式
};

// 设置异步读
struct aiocb cb;
memset(&cb, 0, sizeof(cb));
cb.aio_fildes = fd;
cb.aio_offset = 0;
cb.aio_buf = buffer;
cb.aio_nbytes = sizeof(buffer);
cb.aio_sigevent.sigev_notify = SIGEV_THREAD;  // 用线程通知
cb.aio_sigevent.sigev_notify_function = my_callback;
cb.aio_sigevent.sigev_notify_attributes = NULL;

// 发起异步读
if (aio_read(&cb) == -1) {
    perror("aio_read");
}

// 继续做其他事情...

// 检查是否完成
while (aio_error(&cb) == EINPROGRESS) {
    // 还没完成
    do_other_work();
}

// 获取结果
ssize_t ret = aio_return(&cb);
if (ret > 0) {
    printf("读取了 %zd 字节\n", ret);
}
```

### 6.3 io_uring —— 新一代异步 I/O

**io_uring** 是 Linux 5.1 引入的新异步 I/O 接口，比 aio 更强大：

```
io_uring 的核心思想：
- 两个 ring buffer：Submission Queue (SQ) 和 Completion Queue (CQ)
- 应用程序向 SQ 提交请求，内核从 SQ 取走请求
- 内核完成请求后，将结果放入 CQ
- 应用程序从 CQ 读取结果

优势：
- 零拷贝：使用共享内存
- 批处理：一次提交多个请求
- 轮询模式：避免中断
- 支持所有文件类型，不只是磁盘和网络
```

```c
// io_uring 示例

#include <stdio.h>
#include <stdlib.h>
#include <liburing.h>

#define QUEUE_DEPTH 256
#define BUFFER_SIZE 4096

int main() {
    // 创建 io_uring 实例
    struct io_uring ring;
    if (io_uring_queue_init(QUEUE_DEPTH, &ring, 0) < 0) {
        perror("io_uring_queue_init");
        return 1;
    }

    // 准备读请求
    struct io_uring_sqe* sqe = io_uring_get_sqe(&ring);
    if (!sqe) {
        fprintf(stderr, "Could not get SQE\n");
        return 1;
    }

    char buffer[BUFFER_SIZE];

    // 填充 SQE (Submission Queue Entry)
    // 操作的 opcode、参数等
    io_uring_prep_read(sqe, STDIN_FILENO, buffer, sizeof(buffer), 0);

    // 设置用户数据（用于在完成时识别请求）
    io_uring_sqe_set_data(sqe, (void*)0x1);

    // 提交请求
    if (io_uring_submit(&ring) < 0) {
        perror("io_uring_submit");
        return 1;
    }

    printf("异步读请求已提交\n");

    // 等待完成
    struct io_uring_cqe* cqe;
    int ret = io_uring_wait_cqe(&ring, &cqe);

    if (ret < 0) {
        perror("io_uring_wait_cqe");
        return 1;
    }

    // 处理结果
    if (cqe->res < 0) {
        printf("错误: %s\n", strerror(-cqe->res));
    } else {
        printf("读取了 %d 字节\n", cqe->res);
    }

    // 标记 CQE 已处理
    io_uring_cqe_seen(&ring, cqe);

    // 清理
    io_uring_queue_exit(&ring);

    return 0;
}
```

### 6.4 Node.js 中的异步 I/O

Node.js 使用 libuv 实现异步 I/O，底层根据平台选择最优实现：

```javascript
// Node.js 的异步 I/O 模型

// JavaScript 层面：看起来是同步的 Promise
async function fetchData() {
    // 这行代码是同步的，但返回 Promise
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
}

// 底层 libuv 的处理：

/*
 * libuv 的 I/O 循环：
 *
 * 1. Windows: IOCP (I/O Completion Port)
 *    - 内核级异步通知
 *    - 真正的异步 I/O
 *
 * 2. Linux: epoll
 *    - Node.js 默认使用 epoll 进行 I/O 多路复用
 *    - 对于文件 I/O，使用线程池
 *    - 对于网络 I/O，使用 epoll
 *
 * 3. macOS: kqueue
 *    - 类似 epoll 的机制
 */

// 示例：读取文件
const fs = require('fs');

// 这个操作是异步的，不会阻塞事件循环
fs.readFile('./large-file.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('读取错误:', err);
        return;
    }
    console.log('文件读取完成，长度:', data.length);
});

// 事件循环继续处理其他事情
console.log('开始读取文件...');

// 输出：
// 开始读取文件...
// 文件读取完成，长度: xxxxxx
```

### 6.5 Python 的异步 I/O (asyncio)

```python
# Python asyncio 协程与 I/O 模型

import asyncio
import time

# 协程函数
async def fetch_data(url):
    """模拟异步 I/O 操作"""
    print(f"开始获取 {url}")

    # await 等待另一个协程完成
    # 在等待期间，事件循环可以处理其他协程
    await asyncio.sleep(2)  # 模拟网络请求

    print(f"{url} 获取完成")
    return f"数据 from {url}"

async def main():
    """主协程"""
    print("=== asyncio 异步 I/O 演示 ===\n")

    start = time.time()

    # 创建多个协程
    urls = [
        "https://api1.example.com",
        "https://api2.example.com",
        "https://api3.example.com",
    ]

    # gather 并发执行所有协程
    results = await asyncio.gather(
        *[fetch_data(url) for url in urls]
    )

    end = time.time()

    print(f"\n所有请求完成，耗时: {end - start:.2f}秒")
    print(f"结果: {results}")

# 运行
asyncio.run(main())

# 输出：
# === asyncio 异步 I/O 演示 ===
#
# 开始获取 https://api1.example.com
# 开始获取 https://api2.example.com
# 开始获取 https://api3.example.com
# (2秒后)
# https://api1.example.com 获取完成
# https://api2.example.com 获取完成
# https://api3.example.com 获取完成
#
# 所有请求完成，耗时: 2.00秒
# 结果: ['数据 from https://api1.example.com', ...]
```

---

## 第七章：零拷贝技术

### 7.1 什么是零拷贝？

**零拷贝（Zero-Copy）** 是一种减少数据拷贝次数的技术。在传统的数据传输过程中，数据需要多次在用户空间和内核空间之间复制，零拷贝可以避免这些复制。

```
传统的数据传输（4次拷贝，2次上下文切换）：

  磁盘 ──► 内核缓冲区 ──► 用户缓冲区 ──► Socket缓冲区 ──► 网络

  1. 磁盘到内核缓冲区（DMA 拷贝）
  2. 内核缓冲区到用户缓冲区（CPU 拷贝）
  3. 用户缓冲区到 Socket 缓冲区（CPU 拷贝）
  4. Socket 缓冲区到网络（DMA 拷贝）

零拷贝（2次拷贝，0次上下文切换）：

  磁盘 ──► 内核缓冲区 ──► Socket缓冲区 ──► 网络
         (sendfile)

  1. 磁盘到内核缓冲区（DMA 拷贝）
  2. 内核缓冲区到 Socket 缓冲区（CPU 拷贝，在内核内部）
```

### 7.2 sendfile 系统调用

```c
// sendfile 实现零拷贝

#include <sys/sendfile.h>

// sendfile 在内核中完成数据传输
// out_fd 必须是 socket
// in_fd 必须是文件
ssize_t sendfile(int out_fd, int in_fd, off_t* offset, size_t count);

// 示例：将文件内容发送到网络
int file_fd = open("file.txt", O_RDONLY);
int sock_fd = socket(AF_INET, SOCK_STREAM, 0);

// 获取文件大小
struct stat st;
fstat(file_fd, &st);

// 零拷贝发送文件
ssize_t bytes_sent = sendfile(sock_fd, file_fd, 0, st.st_size);

if (bytes_sent < 0) {
    perror("sendfile");
}

// sendfile 的内部实现：
/*
 * 1. 内核读取文件数据到内核缓冲区（DMA）
 * 2. 内核直接发送数据到网络（CPU）
 *
 * 整个过程：
 * - 没有数据到用户空间
 * - 只有 2 次数据拷贝（磁盘→内核，内核→网络）
 * - 上下文切换减少到 0 次
 */
```

### 7.3 mmap + write 零拷贝

```c
// 使用 mmap 减少拷贝

// 传统方式：
// read() → 磁盘 → 内核缓冲区 → 用户缓冲区 → ...

// mmap 方式：
// mmap() → 磁盘 → 内核缓冲区（共享映射）
// write() → 内核缓冲区 → Socket

// 这样就减少了一次用户态到内核态的拷贝

void* addr = mmap(NULL, file_size, PROT_READ, MAP_PRIVATE, fd, 0);
if (addr == MAP_FAILED) {
    perror("mmap");
}

// mmap 后，数据已经在内存中（映射关系）
// write 只需要把数据从内核缓冲区复制到 socket

ssize_t written = write(sock_fd, addr, file_size);

munmap(addr, file_size);
```

### 7.4 Node.js 中的零拷贝

```javascript
// Node.js 中的零拷贝

const fs = require('fs');
const http = require('http');
const path = require('path');

// 传统方式：读取文件再发送（多次拷贝）
function sendFileTraditional(res, filePath) {
    // 1. 内核 → 用户空间（read）
    // 2. 用户空间 → 内核空间（write）
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 500;
            res.end('Error');
            return;
        }
        res.writeHead(200);
        // 3. 用户空间 → 内核空间（write 到 res）
        res.end(data);
    });
}

// 使用 createReadStream（管道实现，优化拷贝）
function sendFileWithStream(res, filePath) {
    res.writeHead(200);
    // 底层使用 sendfile（Linux）或类似的零拷贝技术
    fs.createReadStream(filePath).pipe(res);
}

// Linux: sendfile() 系统调用
// macOS: sendfile() 系统调用
// Windows: TransmitFile() API

// 示例：高效的静态文件服务器
const server = http.createServer((req, res) => {
    const filePath = path.join('/var/www', req.url);

    // 检查文件是否存在
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }

        // 使用高效的文件发送方式
        sendFileWithStream(res, filePath);
    });
});

server.listen(8080, () => {
    console.log('服务器运行在 8080');
});
```

---

## 第八章：实战应用场景

### 8.1 高性能 Web 服务器

```javascript
// Node.js 构建高性能 Web 服务器
// 使用 cluster + epoll（通过 libuv）最大化性能

const cluster = require('cluster');
const http = require('http');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`主进程 PID: ${process.pid}`);
    console.log(`启动 ${numCPUs} 个工作进程\n`);

    // 启动工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 退出`);
        // 重启工作进程
        cluster.fork();
    });
} else {
    // 工作进程：创建 HTTP 服务器
    // libuv 底层使用 epoll 处理连接
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200);
            res.end('OK');
            return;
        }

        // 模拟处理
        let response = 'Hello from ' + process.pid;

        // 模拟 CPU 密集型任务
        if (req.url === '/compute') {
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += i;
            }
            response = `Computed: ${sum}`;
        }

        res.writeHead(200);
        res.end(response);
    });

    server.listen(8000, () => {
        console.log(`工作进程 ${process.pid} 监听 8000`);
    });
}
```

### 8.2 Go 的 I/O 模型

```go
// Go 的 I/O 多路复用与协程

package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    // Go 使用 netpoll（基于 kqueue/epoll/IOCP）
    // 每个 HTTP 连接由一个 goroutine 处理

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // 这个处理函数运行在 goroutine 中
        // Go runtime 负责调度
        fmt.Fprintf(w, "Hello from %d", time.Now().UnixNano())
    })

    http.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
        // 模拟慢请求
        time.Sleep(3 * time.Second)
        fmt.Fprintf(w, "Done")
    })

    fmt.Println("服务器启动在 :8080")

    // 底层使用 epoll（Linux）监听所有连接
    // accept() → 创建 goroutine → 调度到线程

    http.ListenAndServe(":8080", nil)
}
```

### 8.3 Python 异步文件 I/O

```python
# Python 的 asyncio 不支持文件 I/O（因为 GIL）
# 需要使用线程池处理文件 I/O

import asyncio
import concurrent.futures

# 创建一个线程池执行器
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def read_file_sync(filepath):
    """同步读取文件"""
    with open(filepath, 'r') as f:
        return f.read()

async def read_file_async(filepath):
    """异步读取文件（在线程池中执行）"""
    loop = asyncio.get_event_loop()
    # run_in_executor 把同步函数放到线程池执行
    content = await loop.run_in_executor(executor, read_file_sync, filepath)
    return content

async def main():
    """主协程"""
    print("=== 异步文件读取演示 ===\n")

    # 创建多个文件读取任务
    tasks = [
        read_file_async(f'/tmp/file{i}.txt')
        for i in range(5)
    ]

    # 并发执行
    results = await asyncio.gather(*tasks)

    for i, content in enumerate(results):
        print(f"文件 {i}: {len(content)} 字节")

# 运行
asyncio.run(main())
```

---

## 总结：Linux I/O 模型要点

1. **系统调用是用户程序访问内核的唯一方式**
   - read/write/sendfile 等都是系统调用
   - 触发软中断或使用 syscall 指令

2. **阻塞 vs 非阻塞**
   - 阻塞：等待 I/O 完成才返回
   - 非阻塞：立即返回，轮询检查

3. **I/O 多路复用（select/poll/epoll）**
   - select：受 FD_SETSIZE 限制，O(n) 复杂度
   - poll：链表，无数量限制，但仍是 O(n)
   - epoll：红黑树 + 就绪列表，高效

4. **epoll 的两种模式**
   - 水平触发（LT）：默认，简单可靠
   - 边缘触发（ET）：高效，但编程复杂

5. **零拷贝技术**
   - sendfile：内核内部数据传输
   - mmap：共享内存映射
   - io_uring：新一代高性能异步 I/O

6. **语言层面的异步**
   - Node.js：libuv + epoll
   - Go：runtime netpoll
   - Python asyncio：需要线程池处理文件 I/O
