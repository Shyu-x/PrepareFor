# Linux 运维面试题汇总

> 想要玩转 Linux 运维岗位？那么这份面试题汇总将是你的最佳指南。本文档涵盖 Linux 基础、Shell 脚本、Docker 容器、运维工具以及 CI/CD 等核心知识点，帮助你全面准备 Linux 运维面试。

---

## 第一章 Linux 基础

### 1.1 Linux 目录结构详解

**面试重点：**

Linux 采用树形目录结构，理解各目录的作用是运维的基础。以下是主要目录的详细说明：

| 目录 | 说明 |
|------|------|
| `/bin` | 存放系统最基本的用户命令，普通用户和 root 都可以使用 |
| `/sbin` | 存放系统管理员使用的管理命令 |
| `/etc` | 存放系统和应用的配置文件 |
| `/home` | 普通用户的主目录所在地 |
| `/root` | root 用户的主目录 |
| `/usr` | 存放用户安装的程序和库文件 |
| `/var` | 存放经常变化的数据，如日志、邮件等 |
| `/tmp` | 存放临时文件 |
| `/proc` | 虚拟文件系统，提供系统进程信息 |
| `/dev` | 存放设备文件 |
| `/opt` | 可选应用程序安装目录 |
| `/boot` | 启动文件，包括内核和引导程序 |

**详细目录说明：**

```bash
# /bin 目录详解
# 包含基本命令：ls, cp, mv, rm, cat, chown, chmod 等
# 这些命令在单用户模式下也可用

# /sbin 目录详解
# 包含系统管理命令：fdisk, mkfs, ifconfig, reboot 等
# 通常需要 root 权限执行

# /etc 目录详解
# 系统配置的核心目录
# 常见子目录：
#   /etc/sysconfig/ - 系统网络配置
#   /etc/init.d/ - 服务启动脚本
#   /etc/profile.d/ - 环境变量配置
#   /etc/nginx/ - Nginx 配置
#   /etc/mysql/ - MySQL 配置

# /var 目录详解
# 存放经常变化的数据
# 常见子目录：
#   /var/log/ - 系统和应用程序日志
#   /var/cache/ - 应用程序缓存
#   /var/spool/ - 打印机、邮件队列
#   /var/lib/ - 应用程序数据

# /proc 目录详解
# 虚拟文件系统，不占用磁盘空间
# 重要文件：
#   /proc/cpuinfo - CPU 信息
#   /proc/meminfo - 内存信息
#   /proc/loadavg - 系统负载
#   /proc/uptime - 运行时间
```

---

### 1.2 文件权限管理

**面试重点：**

文件权限是 Linux 安全的核心，需要熟练掌握权限的表示方法和修改方法。

**权限表示方法：**

```
drwxr-xr-x 10 user group 4096 Feb 23 10:00 directory
- rw-r--r--  1 user group  1234 Feb 23 10:00 file
```

**权限含义：**

- `r` (read): 读取权限
- `w` (write): 写入权限
- `x` (execute): 执行权限

**权限数字表示：**

- `7` = rwx 所有者拥有所有权限
- `5` = r-x 所有者可读可执行
- `4` = r-- 只读权限

**权限修改命令详解：**

```bash
# 基本权限修改
chmod 755 file       # 所有者 rwx，组用户 rx，其他用户 rx
chmod 644 file       # 所有者 rw，组用户和其他用户 r
chmod 600 file       # 只有所有者可以读写
chmod 777 file       # 所有用户拥有所有权限（不安全！）

# 使用符号修改权限
chmod u+x file       # 给所有者添加执行权限
chmod g+w file       # 给组用户添加写权限
chmod o-r file       # 移除其他用户的读权限
chmod a+x file       # 给所有用户添加执行权限
chmod u=rwx,g=rx,o=r file  # 精确设置权限

# 递归修改目录权限
chmod -R 755 /path/to/directory

# 修改文件所有者
chown user:group file
chown -R user:group /path/to/directory

# 仅修改用户组
chgrp group file

# 查看文件权限
ls -l file
ls -ld directory
stat file
```

**特殊权限：**

```bash
# SUID (4) - 执行时以所有者身份运行
chmod 4755 file     # 设置 SUID
ls -l /usr/bin/passwd  # passwd 命令有 SUID

# SGID (2) - 执行时以组身份运行
chmod 2755 directory  # 设置 SGID

# Sticky Bit (1) - 只允许所有者删除文件
chmod 1777 /tmp     # /tmp 目录有 sticky bit
```

---

### 1.3 用户和用户组管理

**面试重点：**

用户管理是系统管理的基础，需要掌握用户创建、修改、删除等操作。

```bash
# ========== 用户创建 ==========
useradd username                    # 创建基本用户
useradd -m username                 # 创建用户并创建主目录
useradd -s /bin/bash username      # 指定登录 shell
useradd -G group1,group2 username  # 创建用户并添加到多个组
useradd -u 1000 username           # 指定用户 UID
useradd -c "User Comment" username # 添加用户注释
useradd -e 2024-12-31 username     # 设置账户过期日期
useradd -M username                 # 不创建主目录

# 设置密码
passwd username
echo "password" | passwd --stdin username  # 非交互式设置密码

# ========== 用户修改 ==========
usermod -l newname oldname         # 修改用户名
usermod -g groupname username       # 修改用户主组
usermod -G groupname username       # 修改用户附加组
usermod -aG groupname username      # 追加用户到组（不删除原有组）
usermod -s /bin/zsh username       # 修改用户登录 shell
usermod -u 1001 username           # 修改用户 UID
usermod -L username                # 锁定用户账户
usermod -U username                # 解锁用户账户
usermod -e "" username             # 取消账户过期

# ========== 用户删除 ==========
userdel username                   # 删除用户（保留主目录）
userdel -r username                # 删除用户及其主目录

# ========== 用户组管理 ==========
groupadd groupname                 # 创建用户组
groupdel groupname                 # 删除用户组
groupmod -n newname oldname        # 修改组名
gpasswd -a user groupname          # 添加用户到组
gpasswd -d user groupname          # 从组中移除用户
gpasswd -A user groupname         # 设置组管理员

# ========== 用户查询 ==========
whoami                             # 显示当前用户名
id username                        # 显示用户详细信息
who                                # 显示当前登录用户
w                                  # 显示登录用户及他们正在执行的命令
last                               # 显示用户登录历史
lastlog                            # 显示所有用户最后登录时间
```

---

### 1.4 系统信息查看

**面试重点：**

系统信息查看是排查问题的基础，需要掌握各种系统监控命令。

```bash
# ========== 系统基本信息 ==========
uname -a               # 显示所有系统信息
uname -r               # 显示内核版本
uname -m               # 显示硬件架构
uname -n               # 显示主机名
cat /etc/os-release    # 显示操作系统详细信息
lsb_release -a        # 显示发行版详细信息
cat /etc/centos-release   # CentOS 版本
cat /etc/ubuntu-release   # Ubuntu 版本

# ========== 系统运行状态 ==========
top                    # 实时显示系统进程和资源使用
uptime                 # 显示系统运行时间和负载
free -h                # 显示内存使用情况
df -h                  # 显示磁盘使用情况
du -sh directory      # 显示目录大小
du -h --max-depth=1   # 显示当前目录各子目录大小

# ========== CPU 信息 ==========
cat /proc/cpuinfo      # CPU 详细信息
lscpu                  # CPU 概要信息
nproc                  # CPU 核心数

# ========== 进程信息 ==========
ps aux                 # 显示所有进程详细信息
ps -ef                 # 显示进程详细信息
pstree                 # 显示进程树
top                    # 实时显示进程状态

# ========== 内存详细信息 ==========
cat /proc/meminfo      # 内存详细信息
free -t                # 显示内存和交换空间
vmstat 1               # 虚拟内存统计

# ========== 磁盘信息 ==========
lsblk                  # 列出块设备
fdisk -l               # 显示磁盘分区
parted -l              # 显示磁盘分区表
blkid                  # 显示块设备 UUID
```

---

## 第二章 文件和目录操作

### 2.1 文件和目录基本操作

**面试重点：**

文件操作是 Linux 最基本的技能，需要熟练掌握各种文件操作命令。

```bash
# ========== 目录操作 ==========
ls -la                 # 列出所有文件（包括隐藏文件）及详细信息
ls -lh                 # 人性化显示文件大小
ls -lt                 # 按修改时间排序
ls -lS                 # 按文件大小排序
ls -R                  # 递归列出所有子目录
ls -1                  # 每行只显示一个文件
tree                   # 树形显示目录结构
tree -L 2              # 只显示两层目录

cd ~                   # 切换到用户主目录
cd -                   # 切换到上一次访问的目录
cd ..                  # 切换到上级目录
pwd                    # 显示当前工作目录

mkdir directory        # 创建目录
mkdir -p dir1/dir2/dir3    # 递归创建目录
mkdir -m 755 directory # 指定目录权限
rmdir directory        # 删除空目录
rm -rf directory       # 强制删除目录及其内容

# ========== 文件操作 ==========
touch file             # 创建空文件
touch -t 202401011200 file  # 修改文件时间戳
cp file1 file2         # 复制文件
cp -r dir1 dir2        # 复制目录
cp -p file1 file2      # 保留文件属性
cp -i file1 file2      # 交互式复制（覆盖前询问）
cp -v file1 file2      # 显示复制过程
mv file1 file2         # 移动/重命名文件
mv -i file1 file2      # 交互式移动
mv -v file1 file2      # 显示移动过程
rm file                # 删除文件
rm -f file             # 强制删除文件
rm -i file             # 交互式删除

# ========== 文件查看 ==========
cat file               # 查看文件全部内容
cat -n file            # 显示行号
tac file               # 倒序显示文件内容
nl file                # 显示行号（带空行）
head -n 10 file        # 查看文件前 10 行
head -n -10 file       # 查看除最后 10 行外的所有内容
tail -n 10 file        # 查看文件后 10 行
tail -f file           # 实时查看文件变化
tail -F file           # 实时查看文件变化（即使文件被删除）
less file              # 分页查看文件
more file              # 分页查看文件（只能向下）

# ========== 文件统计 ==========
wc -l file             # 统计行数
wc -w file             # 统计单词数
wc -c file             # 统计字符数
wc file                # 统计行数、单词数、字符数
```

---

### 2.2 文件查找和文本处理

**面试重点：**

文件查找和文本处理是运维工作的核心技能，需要重点掌握。

**文件查找：**

```bash
# ========== find 命令详解 ==========
find /path -name "*.txt"           # 按文件名查找
find /path -type f -size +10M      # 按文件大小查找（大于 10M）
find /path -type f -size -10M      # 按文件大小查找（小于 10M）
find /path -type d                 # 查找目录
find /path -type f                 # 查找文件
find /path -type l                 # 查找符号链接
find /path -mtime -7               # 查找 7 天内修改的文件
find /path -mtime +7               # 查找 7 天前修改的文件
find /path -atime -1               # 查找 1 天内访问的文件
find /path -ctime -1               # 查找 1 天内属性改变的文件
find /path -newer file             # 查找比 file 新的文件
find /path -perm 644              # 按权限查找
find /path -user username          # 按所有者查找
find /path -group groupname        # 按组查找
find /path -empty                  # 查找空文件
find /path -maxdepth 1             # 限制搜索深度
find /path -mindepth 2             # 最小搜索深度

# 组合查找条件
find /path -name "*.log" -mtime -7    # 7 天内修改的 log 文件
find /path -name "*.txt" -o -name "*.md"  # txt 或 md 文件
find /path -type f ! -name "*.bak"   # 排除 bak 文件

# 对找到的文件执行操作
find /path -name "*.log" -delete     # 删除找到的文件
find /path -name "*.log" -exec rm {} \;   # 删除找到的文件
find /path -name "*.log" -exec ls -l {} \;  # 列出找到的文件
find /path -name "*.log" -exec rm {} +     # 批量删除（更高效）

# ========== locate 命令 ==========
# 需要先运行 updatedb 更新数据库
locate file                    # 快速查找文件
locate -i file                 # 忽略大小写查找
updatedb                       # 更新文件数据库

# ========== which 和 whereis ==========
which command                  # 查找命令的完整路径
whereis command                # 查找命令的二进制、源码和手册位置
type command                   # 显示命令类型
```

**文本搜索：**

```bash
# ========== grep 命令详解 ==========
grep "keyword" file                 # 在文件中搜索关键词
grep -r "keyword" /path            # 递归搜索目录
grep -i "keyword" file              # 忽略大小写搜索
grep -n "keyword" file              # 显示行号
grep -v "keyword" file              # 反向匹配（显示不包含关键词的行）
grep -w "keyword" file              # 单词匹配
grep -c "keyword" file              # 统计匹配行数
grep -l "keyword" file1 file2       # 只显示文件名
grep -L "keyword" file1 file2       # 显示不匹配的文件名
grep -A 3 "keyword" file            # 显示匹配行及后 3 行
grep -B 3 "keyword" file            # 显示匹配行及前 3 行
grep -C 3 "keyword" file            # 显示匹配行及前后各 3 行

# 使用正则表达式
grep -E "pattern" file              # 扩展正则表达式
grep "^keyword" file                # 匹配行首
grep "keyword$" file                # 匹配行尾
grep "k.w" file                    # 匹配任意单字符
grep "k*" file                      # 匹配 0 或多个前驱字符
grep "k\{2,4\}" file               # 匹配 2-4 个前驱字符

# 管道组合使用
ps aux | grep nginx                # 查找 nginx 进程
cat log.txt | grep -i error        # 查找错误日志

# ========== egrep 命令 ==========
# 等同于 grep -E
egrep "pattern1|pattern2" file      # 多个模式匹配
egrep "(error|warning)" log.txt    # 匹配 error 或 warning
```

**文本处理工具：**

```bash
# ========== awk 命令详解 ==========
awk '{print $1}' file               # 打印第一列
awk -F',' '{print $2}' file        # 指定分隔符为逗号
awk '{print NR, $0}' file           # 打印行号和整行
awk '{print NF}' file               # 打印每行字段数
awk 'NR==5' file                   # 打印第 5 行
awk 'NR>=5 && NR<=10' file         # 打印第 5-10 行

# 条件过滤
awk '/error/' file                 # 包含 error 的行
awk '$1 > 100' file                # 第一列大于 100 的行
awk '$2 == "active"' file          # 第二列等于 active 的行

# 字符串函数
awk '{print length($0)}' file      # 打印每行长度
awk '{print toupper($1)}' file     # 打印第一列的大写
awk '{print substr($1,1,5)}' file  # 打印第一列的前 5 个字符

# 数组操作
awk '{count[$1]++} END {for (item in count) print item, count[item]}' file

# 计算统计
awk '{sum+=$1} END {print sum}' file
awk '{sum+=$1; count++} END {print sum/count}' file
awk 'BEGIN {max=0} {if ($1>max) max=$1} END {print max}' file

# ========== sed 命令详解 ==========
sed 's/old/new/g' file              # 替换所有 old 为 new
sed 's/old/new/1' file             # 替换每行第一个 old
sed 's/old/new/2' file             # 替换每行第二个 old
sed -n '1,5p' file                 # 打印第 1-5 行
sed -n '5p' file                   # 打印第 5 行
sed '1d' file                      # 删除第 1 行
sed '1,5d' file                   # 删除第 1-5 行
sed '/pattern/d' file              # 删除匹配的行
sed '1i\text' file                # 在第 1 行前插入文本
sed '1a\text' file                # 在第 1 行后追加文本

# 原地编辑
sed -i 's/old/new/g' file         # 原地替换
sed -i.bak 's/old/new/g' file     # 备份后原地替换

# 多重编辑
sed -e 's/old1/new1/g' -e 's/old2/new2/g' file

# ========== sort 命令 ==========
sort file                           # 按默认顺序排序
sort -r file                       # 反向排序
sort -n file                       # 数字排序
sort -k2 file                      # 按第二列排序
sort -t',' -k2 file                # 指定分隔符
sort -u file                       # 去重排序

# ========== uniq 命令 ==========
uniq file                           # 去除相邻重复行
uniq -c file                       # 统计每行出现次数
uniq -d file                       # 只显示重复行
uniq -u file                       # 只显示不重复的行

# ========== cut 命令 ==========
cut -d',' -f1 file                 # 提取第一列（逗号分隔）
cut -c1-10 file                   # 提取第 1-10 个字符
cut -f1,3 file                    # 提取第 1 和 3 列

# ========== tr 命令 ==========
tr 'a-z' 'A-Z' < file              # 转换为大写
tr -d 'a' < file                  # 删除字符 a
tr -s ' ' < file                   # 压缩空格
```

---

### 2.3 硬链接和软链接

**面试重点：**

理解硬链接和软链接的区别是文件系统操作的重点。

**硬链接：**

- 多个文件指向同一个 inode
- 不能跨文件系统
- 不能对目录创建硬链接
- 删除源文件不影响硬链接

**软链接（符号链接）：**

- 类似于 Windows 快捷方式
- 可以跨文件系统
- 可以对目录创建软链接
- 删除源文件软链接失效

```bash
# 创建硬链接
ln source_file link_name

# 创建软链接
ln -s source_file link_name

# 查看链接
ls -l file

# 删除链接
rm link_name

# 修改链接
ln -sf new_source link_name
```

---

### 2.4 文件打包和压缩

```bash
# ========== tar 命令 ==========
tar -cvf archive.tar directory/    # 创建 tar 包
tar -xvf archive.tar              # 解压 tar 包
tar -xvf archive.tar -C /path/   # 解压到指定目录
tar -tvf archive.tar             # 查看 tar 包内容

# 压缩选项
tar -czvf archive.tar.gz directory/   # gzip 压缩
tar -cjvf archive.tar.bz2 directory/ # bzip2 压缩
tar -cJvf archive.tar.xz directory/ # xz 压缩

# 解压选项
tar -xzvf archive.tar.gz
tar -xjvf archive.tar.bz2
tar -xJvf archive.tar.xz

# ========== zip 命令 ==========
zip archive.zip file1 file2       # 压缩文件
zip -r archive.zip directory/    # 压缩目录
unzip archive.zip                 # 解压
unzip -l archive.zip             # 查看内容
unzip -o archive.zip             # 覆盖解压

# ========== gzip 命令 ==========
gzip file                         # 压缩文件
gzip -d file.gz                  # 解压文件
gzip -k file                     # 保留原文件
gunzip file.gz                   # 解压

# ========== 其他压缩命令 ==========
xz file                          # xz 压缩
xz -d file.xz                    # xz 解压
bzip2 file                      # bzip2 压缩
bunzip2 file.bz2                # bzip2 解压
```

---

## 第三章 进程和服务管理

### 3.1 进程查看和管理

**面试重点：**

进程管理是系统运维的核心技能，需要熟练掌握进程查看和控制命令。

```bash
# ========== 进程查看 ==========
ps                      # 显示当前终端的进程
ps aux                  # 显示所有进程详细信息
ps -ef                  # 显示进程详细信息（更详细）
ps -u username          # 显示指定用户的进程
ps -ef | grep process   # 查找特定进程
pgrep process           # 查找进程 PID
pkill process           # 终止进程
pkill -9 process        # 强制终止进程

# 进程排序
ps aux --sort=-%cpu     # 按 CPU 使用排序
ps aux --sort=-%mem    # 按内存使用排序

# 进程树
pstree                 # 显示进程树
pstree -p              # 显示进程树及 PID

# ========== top 命令详解 ==========
top                    # 实时显示进程状态
top -u username        # 只显示指定用户的进程
top -p PID             # 监控指定进程
top -d 1               # 刷新间隔为 1 秒

# top 交互命令
# h: 显示帮助
# q: 退出
# k: 终止进程
# r: 调整进程优先级
# M: 按内存排序
# P: 按 CPU 排序
# 1: 显示所有 CPU 核心
# l: 显示/隐藏负载信息
# t: 显示/隐藏任务和 CPU 信息
# m: 显示/隐藏内存信息

# top 输出说明
# PID: 进程 ID
# USER: 用户
# PR: 优先级
# NI: Nice 值
# VIRT: 虚拟内存
# RES: 物理内存
# SHR: 共享内存
# S: 状态（S=睡眠，R=运行，Z=僵尸）
# %CPU: CPU 使用率
# %MEM: 内存使用率
# TIME+: CPU 时间
# COMMAND: 命令

# ========== htop 命令 ==========
# top 的增强版，需要单独安装
htop                    # 交互式进程查看
htop -u username        # 只显示指定用户
htop -d 1               # 刷新间隔

# ========== iotop 命令 ==========
# 查看进程 I/O 使用情况（需要 root 权限）
iotop                   # 查看 I/O 使用情况
iotop -o               # 只显示正在使用 I/O 的进程
```

---

### 3.2 进程控制

```bash
# ========== 进程终止 ==========
kill PID                # 正常终止进程（发送 SIGTERM）
kill -9 PID             # 强制终止进程（发送 SIGKILL）
kill -15 PID           # 发送 SIGTERM 信号（默认）
kill -1 PID            # 重新加载配置（发送 SIGHUP）
kill -2 PID            # 相当于 Ctrl+C（发送 SIGINT）
kill -19 PID           # 暂停进程（发送 SIGSTOP）
kill -18 PID           # 恢复进程（发送 SIGCONT）

# 按进程名终止进程
pkill process_name
pkill -9 process_name
pkill -f "pattern"     # 按命令模式匹配

# ========== 进程前后台切换 ==========
command &               # 后台运行命令
Ctrl + Z                # 暂停前台进程并放入后台
bg                      # 后台继续运行暂停的进程
fg                      # 将后台进程恢复到前台
jobs                    # 列出所有后台作业

# ========== nohup 命令 ==========
nohup command &        # 后台运行命令，忽略 SIGHUP 信号
nohup command > output.log 2>&1 &   # 重定向输出

# ========== screen 命令 ==========
screen -S name          # 创建命名会话
screen -ls              # 列出所有会话
screen -r name          # 重新连接会话
screen -d name          # 分离会话
screen -d -r name       # 分离并重新连接
Ctrl + a + d           # 分离当前会话

# ========== tmux 命令 ==========
tmux new -s name        # 创建命名会话
tmux ls                # 列出所有会话
tmux attach -t name    # 连接会话
tmux detach            # 分离会话（Ctrl+b d）
tmux kill-session -t name  # 终止会话
```

---

### 3.3 服务管理

**面试重点：**

服务管理是 Linux 运维的核心工作，需要掌握 systemd 和 service 命令。

**systemd (CentOS 7+/Ubuntu 16.04+)：**

```bash
# 服务管理
systemctl start nginx       # 启动服务
systemctl stop nginx        # 停止服务
systemctl restart nginx     # 重启服务
systemctl reload nginx      # 重新加载配置
systemctl status nginx      # 查看服务状态
systemctl is-active nginx   # 检查服务是否运行
systemctl is-enabled nginx # 检查服务是否开机自启

# 开机自启管理
systemctl enable nginx      # 设置开机自启
systemctl disable nginx     # 禁用开机自启
systemctl daemon-reload     # 重新加载 systemd 配置

# 服务列表
systemctl list-units       # 列出所有单元
systemctl list-unit-files  # 列出所有单元文件
systemctl list-dependencies nginx  # 列出服务依赖

# 查看日志
journalctl -u nginx        # 查看服务日志
journalctl -u nginx -f    # 实时查看服务日志
journalctl --since today  # 查看今天日志

# 服务详细信息
systemctl show nginx      # 显示服务详细信息
systemctl cat nginx       # 查看服务单元文件
```

**service 命令（传统）：**

```bash
service nginx start
service nginx stop
service nginx restart
service nginx status
```

**systemd 单元文件示例：**

```ini
[Unit]
Description=My Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/usr/bin/node /var/www/myapp/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 第四章 网络管理

### 4.1 网络配置和查看

**面试重点：**

网络配置是运维必备技能，需要掌握各种网络查看和配置命令。

```bash
# ========== 网络接口查看 ==========
ifconfig                 # 查看网络接口配置
ip addr                 # 查看 IP 地址信息（新版命令）
ip link                 # 查看网络接口
ip route                # 查看路由表
ip neigh                # 查看 ARP 表

# 启用/禁用网络接口
ifconfig eth0 up
ifconfig eth0 down
ip link set eth0 up
ip link set eth0 down

# 配置 IP 地址
ifconfig eth0 192.168.1.100/24
ip addr add 192.168.1.100/24 dev eth0
ip addr del 192.168.1.100/24 dev eth0

# ========== 网络连通性测试 ==========
ping -c 4 example.com   # 测试网络连通性
ping -c 4 192.168.1.1   # 测试 IP 连通性
ping -i 0.2 example.com # 每 0.2 秒发送一次
ping -s 1000 example.com # 发送大数据包

# ========== 网络请求 ==========
curl -I url            # 发送 HEAD 请求
curl -v url            # 显示详细信息
curl -X POST url       # 发送 POST 请求
curl -d "data" url     # 发送 POST 数据
curl -o file url       # 下载文件
curl -O url            # 下载文件（保留原名）
wget url                # 下载文件
wget -O file url       # 指定输出文件名
wget -c url            # 断点续传
wget -r url            # 递归下载

# ========== 路由追踪 ==========
traceroute example.com  # 追踪路由（UDP）
traceroute -I example.com   # 追踪路由（ICMP）
tracert example.com    # Windows 追踪路由
mtr example.com        # 实时路由追踪

# ========== DNS 查询 ==========
nslookup example.com   # DNS 查询
dig example.com        # 详细 DNS 查询
dig +short example.com # 简短结果
host example.com       # 简单 DNS 查询
```

---

### 4.2 端口和网络连接

**面试重点：**

端口管理是服务运维的基础，需要掌握端口查看和防火墙配置。

```bash
# ========== 端口监听查看 ==========
netstat -tlnp          # 查看监听端口
ss -tlnp               # 查看监听端口（更高效）
lsof -i :80            # 查看端口 80 被谁占用
lsof -i                # 查看所有网络连接
fuser 80/tcp           # 查看端口 80 被谁占用

# 网络连接查看
netstat -an            # 查看所有连接
netstat -tn            # 查看 TCP 连接
netstat -un            # 查看 UDP 连接
netstat -p             # 显示进程信息

# ========== 防火墙配置 ==========

# firewalld (CentOS 7+)
firewall-cmd --list-ports                    # 列出开放的端口
firewall-cmd --add-port=80/tcp --permanent   # 开放 80 端口
firewall-cmd --remove-port=80/tcp --permanent  # 关闭 80 端口
firewall-cmd --reload                        # 重新加载配置
firewall-cmd --list-services                  # 列出开放的服务
firewall-cmd --add-service=http --permanent   # 开放 HTTP 服务
firewall-cmd --add-source=192.168.1.0/24     # 允许 IP 段
firewall-cmd --list-all                       # 列出所有配置

# iptables (传统)
iptables -L                          # 查看规则
iptables -A INPUT -p tcp --dport 80 -j ACCEPT   # 开放 80 端口
iptables -A INPUT -j DROP            # 默认拒绝所有
iptables -A INPUT -p icmp -j ACCEPT  # 允许 ping
iptables -D INPUT 1                  # 删除第一条规则
iptables -I INPUT 1 -j ACCEPT        # 插入规则到第一条
iptables -F                         # 清空所有规则
iptables-save > /etc/iptables.rules # 保存规则
iptables-restore < /etc/iptables.rules  # 恢复规则

# ufw (Ubuntu)
ufw status               # 查看状态
ufw allow 80/tcp        # 开放 80 端口
ufw deny 80/tcp         # 禁止 80 端口
ufw enable              # 启用防火墙
ufw disable             # 禁用防火墙
ufw delete allow 80/tcp # 删除规则
ufw allow from 192.168.1.0/24  # 允许 IP 段
```

---

## 第五章 SSH 远程连接

### 5.1 SSH 基础命令

**面试重点：**

SSH 是 Linux 远程管理的核心工具，需要熟练掌握连接和文件传输命令。

```bash
# ========== SSH 连接 ==========
ssh user@hostname           # 连接到远程主机
ssh -p 22 user@hostname     # 指定端口连接
ssh -i ~/.ssh/key user@hostname  # 指定私钥文件
ssh -v user@hostname        # 详细模式连接
ssh -o StrictHostKeyChecking=no user@hostname  # 跳过主机密钥检查
ssh -t user@hostname "command"  # 执行远程命令

# ========== SSH 密钥管理 ==========
ssh-keygen -t rsa          # 生成 RSA 密钥对
ssh-keygen -t ed25519      # 生成 Ed25519 密钥对（推荐）
ssh-keygen -t rsa -b 4096  # 生成 4096 位 RSA 密钥
ssh-keygen -f ~/.ssh/key   # 指定密钥文件路径
ssh-keygen -p              # 修改密钥密码
ssh-keygen -R hostname     # 移除主机密钥

# 复制公钥到远程主机
ssh-copy-id user@hostname
# 或者手动复制
cat ~/.ssh/id_rsa.pub | ssh user@hostname "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# ========== SSH 配置 ~/.ssh/config ==========
Host alias
    HostName 192.168.1.100
    User username
    Port 22
    IdentityFile ~/.ssh/key

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3

# ========== 文件传输 ==========
scp file.txt user@host:/path/       # 上传文件
scp user@host:/path/file.txt ./      # 下载文件
scp -r dir/ user@host:/path/         # 上传目录
scp -P 2222 file user@host:/path/    # 指定端口
scp -C file user@host:/path/         # 启用压缩
scp -p file user@host:/path/         # 保留文件属性

sftp user@hostname                    # 交互式文件传输
# sftp 命令：
# ls/cd/pwd - 目录操作
# get file - 下载文件
# put file - 上传文件
# mget/mput - 批量传输
# bye/exit - 退出
```

---

### 5.2 SSH 安全加固

**面试重点：**

SSH 安全是服务器安全的重要环节，需要了解常见的安全加固措施。

**SSH 配置文件：** `/etc/ssh/sshd_config`

```bash
# 端口和地址绑定
Port 2222                   # 修改默认端口
ListenAddress 0.0.0.0      # 监听地址

# 禁用 root 登录
PermitRootLogin no          # 禁用 root 登录
PermitRootLogin prohibit-password  # 只允许密钥登录

# 禁用密码认证
PasswordAuthentication no   # 禁用密码认证
PubkeyAuthentication yes    # 启用公钥认证

# 限制失败尝试次数
MaxAuthTries 3              # 最大尝试次数

# 空闲超时设置
ClientAliveInterval 300     # 空闲检测间隔（秒）
ClientAliveCountMax 2      # 空闲检测次数

# 允许的用户/组
AllowUsers user1 user2
AllowGroup groupname

# 禁用空密码
PermitEmptyPasswords no

# 启用日志记录
LogLevel VERBOSE

# 重启 SSH 服务
systemctl restart sshd
```

---

## 第六章 软件包管理

### 6.1 包管理器概述

**面试重点：**

不同 Linux 发行版使用不同的包管理器，需要掌握主流发行版的包管理命令。

**Ubuntu/Debian (apt)：**

```bash
# 更新软件包列表
apt update                  # 更新软件包列表
apt upgrade                # 升级所有软件包
apt full-upgrade           # 完整升级（处理依赖变化）

# 安装和卸载
apt install nginx          # 安装软件包
apt install nginx=1.18.0   # 安装指定版本
apt remove nginx           # 卸载软件包（保留配置）
apt purge nginx            # 彻底卸载
apt autoremove             # 自动清理不需要的包

# 搜索和查看
apt search nginx           # 搜索软件包
apt show nginx             # 查看软件包信息
apt list --installed       # 列出已安装的软件包

# 清理
apt clean                  # 清理本地仓库
apt autoclean              # 清理旧版本的软件包
apt autoremove             # 删除不再需要的依赖
```

**CentOS/RHEL (yum/dnf)：**

```bash
# 基础操作
yum update                 # 更新所有软件包
yum install nginx         # 安装软件包
yum remove nginx          # 卸载软件包
yum search nginx          # 搜索软件包
yum list installed        # 列出已安装的软件包

# DNF (CentOS 8+) - yum 的替代品
dnf update
dnf install nginx
dnf search nginx

# 查看包信息
yum info nginx            # 查看包信息
yum provides nginx        # 查找包含指定文件的包
yum groupinstall "Development Tools"  # 安装开发工具组

# 清理
yum clean all             # 清理缓存
yum makecache             # 生成缓存
```

**Arch Linux (pacman)：**

```bash
pacman -Syu               # 同步并更新系统
pacman -S nginx           # 安装软件包
pacman -R nginx           # 卸载软件包
pacman -Ss nginx          # 搜索软件包
pacman -Si nginx          # 查看包信息
pacman -Q                 # 列出已安装的包
pacman -Qs nginx          # 搜索已安装的包
```

---

### 6.2 Node.js 环境管理

**面试重点：**

前端开发者需要掌握 Node.js 环境管理，包括 nvm、npm、pnpm 等工具。

**nvm (Node Version Manager)：**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 使用 nvm
nvm list-remote           # 列出所有可用版本
nvm install 18            # 安装 Node.js 18
nvm install 18.12.1      # 安装指定版本
nvm use 18                # 切换到 Node.js 18
nvm alias default 18     # 设置默认版本
nvm list                 # 列出已安装的版本
nvm current              # 显示当前版本
nvm uninstall 16          # 卸载指定版本

# 安装 LTS 版本
nvm install --lts
nvm install --lts=hydrogen
```

**npm (Node Package Manager)：**

```bash
# npm 基础命令
npm install -g npm        # 更新 npm
npm install -g node       # 安装最新版本 node
npm init -y               # 初始化项目
npm install               # 安装项目依赖
npm install package      # 安装本地包
npm install -g package   # 安装全局包
npm install package@1.0.0  # 安装指定版本

# package.json 管理
npm install --save package   # 安装并添加到 dependencies
npm install --save-dev package  # 安装并添加到 devDependencies
npm install --save-optional package  # 添加到 optionalDependencies

# 包管理
npm update               # 更新所有包
npm update package       # 更新指定包
npm outdated             # 检查过期包
npm uninstall package    # 卸载包

# 运行脚本
npm run dev              # 运行 package.json 中的 dev 脚本
npm run build            # 运行 build 脚本
npm start                # 运行 start 脚本
npm test                 # 运行 test 脚本

# 查看和搜索
npm list                 # 查看已安装的包
npm list -g              # 查看全局安装的包
npm search package       # 搜索包
npm info package         # 查看包信息

# npm 配置
npm config list          # 查看配置
npm config set registry https://registry.npmmirror.com  # 设置镜像
npm config get registry  # 查看当前镜像
```

**pnpm (Performant npm)：**

```bash
# 安装 pnpm
npm install -g pnpm

# 基础命令
pnpm install             # 安装依赖
pnpm add package         # 添加依赖
pnpm add -D package     # 添加开发依赖
pnpm remove package     # 移除依赖
pnpm update              # 更新依赖
```

---

## 第七章 常用服务部署

### 7.1 Nginx 部署和配置

**面试重点：**

Nginx 是最常用的 Web 服务器，需要熟练掌握其安装、配置和使用。

**安装 Nginx：**

```bash
# Ubuntu
apt install nginx

# CentOS
yum install nginx
```

**Nginx 主配置文件：** `/etc/nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 引入其他配置文件
    include /etc/nginx/conf.d/*.conf;
}
```

**站点配置文件：** `/etc/nginx/conf.d/example.conf`

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/html;
    index index.html index.htm index.php;

    # 日志配置
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 主页面配置
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理配置
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # PHP-FPM 配置
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问特定目录
    location /uploads {
        internal;
    }
}
```

**HTTPS 配置：**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    ssl_stapling on;
    ssl_stapling_verify on;

    # 其他配置...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}
```

**Nginx 命令：**

```bash
nginx -t                 # 测试配置文件
nginx                    # 启动 Nginx
nginx -s reload          # 重新加载配置
nginx -s stop           # 停止 Nginx
nginx -s reopen         # 重新打开日志文件
nginx -s quit           # 优雅停止
nginx -v                # 查看版本
nginx -V                # 查看详细版本信息
```

---

### 7.2 PM2 进程管理

**面试重点：**

PM2 是 Node.js 应用的常用进程管理器，用于生产环境部署。

**安装 PM2：**

```bash
npm install -g pm2
```

**基本命令：**

```bash
# 启动应用
pm2 start app.js                 # 启动应用
pm2 start app.js --name my-app   # 指定应用名称
pm2 start app.js -i 4           # 启动 4 个实例（负载均衡）
pm2 start app.js --max-memory-restart 500M  # 内存超过 500M 自动重启

# 管理应用
pm2 list                         # 列出所有应用
pm2 status                       # 查看状态
pm2 logs                         # 查看日志
pm2 logs --lines 100             # 查看最近 100 行日志
pm2 logs my-app --err            # 只查看错误日志
pm2 restart my-app               # 重启应用
pm2 stop my-app                  # 停止应用
pm2 delete my-app               # 删除应用

# 监控
pm2 monit                        # 实时监控面板
pm2 plus                         # 在线监控面板（需要注册）

# 开机自启
pm2 startup                      # 生成启动命令
pm2 save                         # 保存当前进程列表
pm2 resurrect                   # 恢复保存的进程列表
pm2 generate                    # 生成 systemd 配置
```

**ecosystem.config.js 配置文件：**

```javascript
module.exports = {
  apps: [{
    name: 'my-app',
    script: './app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 8000,
    kill_timeout: 5000,
    instances: 4,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    force: true
  }, {
    name: 'worker',
    script: './worker.js',
    watch: true,
    ignore_watch: ['node_modules', 'logs'],
    env: {
      NODE_ENV: 'development'
    }
  }]
};
```

**使用配置文件启动：**

```bash
pm2 start ecosystem.config.js
pm2 start ecosystem.config.js --env production
pm2 delete all
```

---

## 第八章 日志管理

### 8.1 系统日志详解

**面试重点：**

日志是排查问题的重要依据，需要了解常见日志的位置和作用。

| 日志类型 | 位置 | 说明 |
|----------|------|------|
| 系统日志 | /var/log/messages | 系统和应用程序通用日志 |
| 安全日志 | /var/log/secure | 用户登录和认证日志 |
| 计划任务日志 | /var/log/cron | 定时任务执行日志 |
| 邮件日志 | /var/log/maillog | 邮件收发日志 |
| 启动日志 | /var/log/dmesg | 系统启动时的硬件检测日志 |
| Nginx 访问日志 | /var/log/nginx/access.log | HTTP 请求访问日志 |
| Nginx 错误日志 | /var/log/nginx/error.log | HTTP 请求错误日志 |
| 应用日志 | /var/log/myapp/ | 应用程序自定义日志 |
| 系统日志 | /var/log/syslog | 完整系统日志（Debian/Ubuntu） |
| Docker 日志 | /var/lib/docker/containers/ | Docker 容器日志 |

**常用日志命令：**

```bash
# 实时查看日志
tail -f /var/log/nginx/access.log

# 查看最近 100 行
tail -n 100 /var/log/nginx/access.log

# 搜索日志内容
grep "error" /var/log/nginx/error.log
grep -i "error" /var/log/nginx/access.log

# 统计日志
wc -l /var/log/nginx/access.log     # 统计总请求数
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn  # 统计 IP

# 日志轮转
logrotate -f /etc/logrotate.conf   # 强制执行日志轮转

# 磁盘使用分析
du -sh /var/log/*                  # 日志目录大小分析
du -sh /var/log/nginx/
```

---

### 8.2 日志分析工具

```bash
# ========== awk 分析日志 ==========
# 统计 IP 访问次数
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计最常访问的页面
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计 HTTP 状态码
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 统计访问量最大的时间段
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f1 | sort | uniq -c | sort -rn

# 统计请求大小
awk '{print $10}' /var/log/nginx/access.log | awk '{sum+=$1} END {print sum/1024/1024 " MB"}'

# ========== GoAccess 日志分析工具 ==========
# 安装
apt install goaccess

# 使用
goaccess /var/log/nginx/access.log -o report.html --log-format=COMBINED

# 实时监控
goaccess /var/log/nginx/access.log -o report.html --real-time-html --log-format=COMBINED
```

---

## 第九章 Shell 脚本编程

### 9.1 Shell 脚本基础

**面试重点：**

Shell 脚本是自动化运维的基础，需要掌握变量、条件判断、循环等基本语法。

**变量定义和使用：**

```bash
#!/bin/bash

# 变量定义
name="Tom"
age=25

# 变量使用
echo "Name: $name"
echo "Age: $age"

# 只读变量
readonly PI=3.14
# PI=3.15  # 错误：不能修改只读变量

# 删除变量
unset name

# 特殊变量
# $0 - 脚本名
# $1-$9 - 第 1-9 个参数
# $# - 参数个数
# $@ - 所有参数
# $? - 上一个命令的退出状态
# $$ - 当前进程 ID

# 字符串操作
str="Hello World"
echo ${#str}              # 字符串长度
echo ${str:0:5}           # 截取字符串（从第 0 个字符开始，截取 5 个）
echo ${str: -5}           # 截取最后 5 个字符
echo ${str/Hello/Hi}     # 替换（只替换第一个）
echo ${str//o/O}         # 替换（替换所有）
echo ${str#*o}           # 最短匹配删除（从开头）
echo ${str##*o}          # 最长匹配删除（从开头）
echo ${str%o*}           # 最短匹配删除（从结尾）
echo ${str%%o*}          # 最长匹配删除（从结尾）
```

**数组操作：**

```bash
#!/bin/bash

# 数组定义
arr=(1 2 3 4 5)
arr2=(one two three)

# 数组操作
echo ${arr[0]}           # 访问元素
echo ${arr[@]}           # 访问所有元素
echo ${#arr[@]}          # 数组长度
arr[0]=10                # 修改元素
arr+=(6 7 8)            # 追加元素

# 数组切片
echo ${arr[@]:1:3}       # 从索引 1 开始，截取 3 个元素
```

**运算符：**

```bash
#!/bin/bash

# 算术运算符
a=10
b=20
echo $((a + b))          # 加法
echo $((a - b))          # 减法
echo $((a * b))          # 乘法
echo $((a / b))          # 除法
echo $((a % b))          # 取模

# 关系运算符
# -eq 等于
# -ne 不等于
# -gt 大于
# -lt 小于
# -ge 大于等于
# -le 小于等于

if [ $a -eq $b ]; then
    echo "相等"
fi

# 布尔运算符
# ! 非
# -o 或
# -a 与

# 字符串运算符
# = 等于
# != 不等于
# -z 长度为 0
# -n 长度不为 0
# str 为空

if [ -z "$str" ]; then
    echo "字符串为空"
fi

# 文件测试运算符
# -d 文件是目录
# -f 文件是普通文件
# -e 文件存在
# -r 文件可读
# -w 文件可写
# -x 文件可执行
# -s 文件大小不为 0

if [ -f /path/to/file ]; then
    echo "文件存在"
fi
```

**条件判断：**

```bash
#!/bin/bash

# if-elif-else
if [ $age -ge 18 ]; then
    echo "成年人"
elif [ $age -ge 6 ]; then
    echo "未成年人"
else
    echo "儿童"
fi

# 文件类型判断
if [ -f /path/to/file ]; then
    echo "普通文件"
fi

if [ -d /path/to/dir ]; then
    echo "目录"
fi

if [ -e /path/to/file ]; then
    echo "存在"
fi

# 多条件判断
if [ $a -gt 10 ] && [ $a -lt 20 ]; then
    echo "在 10-20 之间"
fi

# case 语句
case $1 in
    start)
        echo "启动服务"
        ;;
    stop)
        echo "停止服务"
        ;;
    restart)
        echo "重启服务"
        ;;
    *)
        echo "未知命令"
        ;;
esac
```

**循环：**

```bash
#!/bin/bash

# for 循环 - 列表
for i in {1..5}; do
    echo "Number: $i"
done

# for 循环 - 数组
for item in ${array[@]}; do
    echo "Item: $item"
done

# for 循环 - 命令输出
for file in $(ls); do
    echo "File: $file"
done

# C 风格 for 循环
for ((i=0; i<10; i++)); do
    echo "i = $i"
done

# while 循环
count=0
while [ $count -lt 5 ]; do
    echo $count
    count=$((count + 1))
done

# until 循环
count=0
until [ $count -ge 5 ]; do
    echo $count
    count=$((count + 1))
done

# 循环控制
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        continue    # 跳过本次循环
    fi
    if [ $i -eq 8 ]; then
        break       # 退出循环
    fi
    echo $i
done

# 无限循环
while true; do
    echo "无限循环"
    sleep 1
done
```

---

### 9.2 函数

```bash
#!/bin/bash

# 函数定义
function hello {
    echo "Hello, World!"
}

# 带参数的函数
function greet {
    local name=$1    # 使用 local 定义局部变量
    echo "Hello, $name!"
}

# 返回值
function get_sum {
    local a=$1
    local b=$2
    return $((a + b))
}

# 调用函数
hello
greet "Tom"
get_sum 10 20
echo $?    # 获取返回值

# 函数中使用数组
function print_array {
    local arr=("$@")
    for item in "${arr[@]}"; do
        echo $item
    done
}

my_array=(1 2 3 4 5)
print_array "${my_array[@]}"

# 递归函数
function factorial {
    local n=$1
    if [ $n -le 1 ]; then
        echo 1
    else
        local prev=$(factorial $((n-1)))
        echo $((n * prev))
    fi
}

echo $(factorial 5)
```

---

### 9.3 实用脚本示例

**备份脚本：**

```bash
#!/bin/bash
# 自动备份脚本

BACKUP_DIR="/backup"
SOURCE_DIR="/var/www/html"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/backup.log"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 执行备份
log "开始备份 $SOURCE_DIR"
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $SOURCE_DIR 2>&1 | tee -a $LOG_FILE

if [ $? -eq 0 ]; then
    log "备份成功: backup_$DATE.tar.gz"
else
    log "备份失败"
    exit 1
fi

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

# 保留最近 30 天的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

log "备份完成"
```

**系统监控脚本：**

```bash
#!/bin/bash
# 系统监控告警脚本

# 获取 CPU 使用率
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# 获取内存使用率
MEMORY=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100)}')

# 获取磁盘使用率
DISK=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

# 获取负载
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

echo "CPU: $CPU%"
echo "Memory: $MEMORY%"
echo "Disk: $DISK%"
echo "Load: $LOAD"

# 告警阈值
CPU_THRESHOLD=80
MEMORY_THRESHOLD=90
DISK_THRESHOLD=90
LOAD_THRESHOLD=2

# 发送告警
ALERT=false
ALERT_MSG=""

if (( $(echo "$CPU > $CPU_THRESHOLD" | bc -l) )); then
    ALERT=true
    ALERT_MSG="${ALERT_MSG}High CPU: ${CPU}%\n"
fi

if [ $(echo "$MEMORY > $MEMORY_THRESHOLD" | bc -l) -eq 1 ]; then
    ALERT=true
    ALERT_MSG="${ALERT_MSG}High Memory: ${MEMORY}%\n"
fi

if [ $DISK -gt $DISK_THRESHOLD ]; then
    ALERT=true
    ALERT_MSG="${ALERT_MSG}High Disk: ${DISK}%\n"
fi

if [ $(echo "$LOAD > $LOAD_THRESHOLD" | bc -l) -eq 1 ]; then
    ALERT=true
    ALERT_MSG="${ALERT_MSG}High Load: ${LOAD}\n"
fi

if [ "$ALERT" = true ]; then
    echo -e "$ALERT_MSG" | mail -s "System Alert" admin@example.com
    # 或者发送企业微信/钉钉告警
fi
```

**日志清理脚本：**

```bash
#!/bin/bash
# 日志清理脚本

LOG_DIR="/var/log/myapp"
MAX_SIZE=100M
MAX_DAYS=30

# 清理大日志文件
for logfile in $(find $LOG_DIR -name "*.log" -type f); do
    size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile")
    max_size_bytes=$((MAX_SIZE * 1024 * 1024))

    if [ $size -gt $max_size_bytes ]; then
        echo "Truncating $logfile (size: $size)"
        > "$logfile"
    fi
done

# 清理过期日志
find $LOG_DIR -name "*.log" -type f -mtime +$MAX_DAYS -delete

# 压缩旧日志
find $LOG_DIR -name "*.log" -type f -mtime +7 ! -name "*.gz" -exec gzip {} \;

echo "日志清理完成"
```

**批量操作脚本：**

```bash
#!/bin/bash
# 批量部署脚本

SERVERS=(
    "192.168.1.10"
    "192.168.1.11"
    "192.168.1.12"
)

USER="deploy"
DEPLOY_DIR="/var/www/myapp"

for server in "${SERVERS[@]}"; do
    echo "Deploying to $server..."

    # 同步代码
    rsync -avz --delete -e ssh \
        --exclude='node_modules' \
        --exclude='.git' \
        ./ $USER@$server:$DEPLOY_DIR/

    # 重启服务
    ssh $USER@$server "cd $DEPLOY_DIR && pm2 restart all"

    echo "Deployed to $server successfully"
done

echo "Deployment completed!"
```

---

## 第十章 问题排查

### 10.1 常见问题排查方法

**面试重点：**

问题排查是运维的核心能力，需要掌握系统资源和网络故障的排查方法。

**端口占用排查：**

```bash
# 查看端口被谁占用
lsof -i :80
netstat -tlnp | grep 80

# 查看进程详细信息
ps aux | grep nginx
```

**磁盘空间问题：**

```bash
# 查看磁盘使用情况
df -h

# 查看目录大小
du -sh /*
du -sh /var/*
du -sh /var/log/*

# 查找大文件
find / -type f -size +100M
```

**进程异常排查：**

```bash
# 查看系统日志
journalctl -xe
tail -f /var/log/messages

# 查看进程状态
ps auxf
pstree -p

# 查看进程打开的文件
lsof -p PID
lsof -c nginx
```

**网络问题排查：**

```bash
# 测试网络连通性
ping -c 4 8.8.8.8

# DNS 解析测试
nslookup example.com
dig example.com

# 路由追踪
traceroute example.com
mtr example.com

# 网络延迟测试
curl -w "@curl-format.txt" -o /dev/null -s http://example.com
```

---

### 10.2 性能分析工具

```bash
# CPU 性能分析
top                           # 查看 CPU 使用
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head

# 内存性能分析
free -h                       # 查看内存使用
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head

# I/O 性能分析
iostat -x 1 5                # I/O 统计
iotop                        # 实时 I/O 监控

# 网络性能分析
iftop                        # 网络流量监控
nethogs                     # 按进程查看网络使用
tcpdump                     # 网络抓包
```

---

## 第十一章 CI/CD

### 11.1 Git 基础命令

**面试重点：**

Git 是现代开发的核心工具，需要熟练掌握常用命令和工作流程。

```bash
# ========== 仓库操作 ==========
git init                     # 初始化仓库
git clone url                # 克隆仓库
git add .                    # 添加所有文件到暂存区
git commit -m "message"      # 提交更改
git push origin main         # 推送到远程仓库
git pull                     # 拉取并合并

# ========== 分支操作 ==========
git branch                   # 查看分支
git branch -a                # 查看所有分支
git checkout -b feature      # 创建并切换到新分支
git checkout main            # 切换分支
git merge feature            # 合并分支
git branch -d feature        # 删除分支

# ========== 版本回退 ==========
git log --oneline            # 简洁日志
git reset --hard HEAD~1      # 回退到上一个版本
git stash                    # 暂存更改
git stash pop                # 恢复暂存
```

---

### 11.1.1 Git 高级操作

```bash
# ========== 版本比较 ==========
git diff                     # 工作区 vs 暂存区
git diff --staged            # 暂存区 vs 最新提交
git diff HEAD~1 HEAD         # 比较两个提交

# ========== 撤销操作 ==========
git checkout -- file         # 撤销工作区修改
git reset HEAD file          # 撤销暂存区修改
git revert commit            # 撤销指定提交（创建新提交）
git reset --soft HEAD~1      # 撤销提交，保留修改在暂存区
git reset --hard HEAD~1      # 撤销提交，丢弃所有修改

# ========== 远程仓库操作 ==========
git remote -v                # 查看远程仓库
git remote add origin url    # 添加远程仓库
git fetch origin             # 获取远程更新
git pull origin main         # 拉取并合并
git push -u origin main      # 推送到远程（-u 设置上游）

# ========== 标签操作 ==========
git tag v1.0.0              # 创建标签
git tag                      # 查看标签
git push origin v1.0.0      # 推送标签
git tag -d v1.0.0           # 删除本地标签

# ========== 子模块操作 ==========
git submodule add url path   # 添加子模块
git submodule init           # 初始化子模块
git submodule update         # 更新子模块
git submodule update --init  # 初始化并更新
```

---

### 11.1.2 Git 工作流程

**面试重点：**

需要了解 Git Flow、GitHub Flow 等常见工作流程。

**Git Flow 工作流程：**

```bash
# 1. 创建开发分支
git checkout -b develop main

# 2. 开发功能
git checkout -b feature/xxx develop
# ... 开发代码 ...
git checkout develop
git merge feature/xxx

# 3. 准备发布
git checkout -b release/xxx develop
# ... 修复 bug ...
git checkout develop
git merge release/xxx

# 4. 紧急修复
git checkout -b hotfix/xxx main
# ... 修复 bug ...
git checkout main
git merge hotfix/xxx
git checkout develop
git merge hotfix/xxx

# 5. 删除不需要的分支
git branch -d feature/xxx
git branch -d release/xxx
git branch -d hotfix/xxx
```

**GitHub Flow 工作流程：**

```bash
# 1. 从 main 创建特性分支
git checkout -b feature/xxx

# 2. 开发并提交
git commit -m "Add feature"

# 3. 推送分支
git push origin feature/xxx

# 4. 创建 Pull Request
# 在 GitHub 上创建 PR

# 5. 代码审查和合并
# 合并后自动部署

# 6. 删除特性分支
git checkout main
git pull
git branch -d feature/xxx
```

**解决冲突：**

```bash
# 1. 查看冲突文件
git status

# 2. 编辑冲突文件
# 手动解决冲突

# 3. 标记冲突已解决
git add conflict_file

# 4. 提交更改
git commit -m "resolve conflict"
```

---

### 11.1.3 Git 常见面试题

**Q1: git fetch 和 git pull 的区别？**

- `git fetch`：从远程仓库下载最新版本到本地，但不合并到当前分支
- `git pull`：从远程仓库下载最新版本并合并到当前分支

**Q2: 如何撤销 Git 提交的修改？**

- 撤销工作区修改：`git checkout -- file`
- 撤销暂存区修改：`git reset HEAD file`
- 撤销提交（保留修改）：`git reset --soft HEAD~1`
- 撤销提交（丢弃修改）：`git reset --hard HEAD~1`

**Q3: 如何解决 Git 冲突？**

1. 使用 `git status` 查看冲突文件
2. 编辑冲突文件，手动解决冲突
3. 使用 `git add` 标记为已解决
4. 使用 `git commit` 提交

**Q4: git rebase 和 git merge 的区别？**

- `git merge`：合并分支，保留分支结构，历史记录为分叉状
- `git rebase`：将分支的基点移动到另一个分支，历史记录为线性，更整洁

**Q5: 如何恢复误删的 commit？**

```bash
git reflog                        # 查看操作历史
git reset --hard HEAD@{n}        # 恢复到指定状态
```

---

### 11.2 简单 CI/CD 流程

**手动部署流程示例：**

```bash
# 1. 构建项目
npm run build

# 2. 连接到服务器
ssh user@server

# 3. 进入部署目录
cd /var/www/myapp

# 4. 拉取最新代码
git pull origin main

# 5. 安装依赖
npm install

# 6. 重新构建
npm run build

# 7. 重启应用
pm2 restart myapp

# 8. 检查状态
pm2 status
```

---

## 第十二章 Docker 容器

### 12.1 Docker 基础

**面试重点：**

Docker 是现代应用部署的核心技术，需要掌握 Docker 基础操作和镜像构建。

**Docker 概述：**

Docker 是一个开源的容器化平台，用于开发、部署和运行应用程序。容器允许开发者将应用程序及其依赖打包到一个轻量级的容器中，确保应用在任何环境中都能一致运行。

**Docker 与虚拟机的区别：**

| 特性 | Docker 容器 | 虚拟机 |
|------|-------------|--------|
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | 轻量级 | 较重 |
| 操作系统 | 共享宿主机内核 | 独立操作系统 |
| 隔离性 | 进程级隔离 | 完整隔离 |

---

### 12.2 Docker 基本命令

```bash
# ========== 镜像操作 ==========
docker images                 # 列出本地镜像
docker pull nginx:latest      # 拉取镜像
docker rmi image_id           # 删除本地镜像
docker image prune            # 清理未使用的镜像
docker build -t my-app .      # 构建镜像
docker tag image_id my-app:v1 # 为镜像打标签

# ========== 容器操作 ==========
docker ps                     # 查看运行中的容器
docker ps -a                 # 查看所有容器
docker ps -l                 # 查看最后创建的容器
docker run -d -p 80:80 nginx # 运行容器（后台）
docker run -it nginx /bin/bash  # 交互式运行
docker run --name my-nginx -d nginx  # 指定容器名称

# 常用运行选项：
# -d: 后台运行
# -p: 端口映射（宿主机端口:容器端口）
# -v: 卷挂载（宿主机路径:容器路径）
# --name: 容器名称
# --env: 环境变量
# --link: 链接到其他容器
# --network: 加入网络
# --restart: 重启策略
# -e: 设置环境变量
# --rm: 退出时自动删除

# 容器管理
docker start container_id     # 启动容器
docker stop container_id     # 停止容器
docker restart container_id  # 重启容器
docker rm container_id       # 删除容器
docker rm -f container_id    # 强制删除容器
docker logs -f container_id  # 查看容器日志
docker logs --tail 100 container_id  # 查看最近 100 行日志
docker exec -it container_id /bin/bash  # 进入容器

# 容器信息
docker inspect container_id   # 查看容器详细信息
docker port container_id      # 查看端口映射
docker top container_id       # 查看容器进程
docker stats container_id     # 查看容器资源使用
```

---

### 12.3 Dockerfile 最佳实践

**Dockerfile 基础指令：**

```dockerfile
# 选择基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件（利用 Docker 缓存）
COPY package*.json ./

# 安装依赖（生产环境使用 npm ci）
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
```

**Dockerfile 最佳实践：**

```dockerfile
# 1. 使用特定版本的基础镜像，不使用 latest
FROM node:18.17.0-alpine3.18

# 2. 使用多阶段构建减小镜像体积
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]

# 3. 使用 .dockerignore 排除不需要的文件
# .dockerignore 示例：
# node_modules
# npm-debug.log
# .git
# .env
# dist
# coverage

# 4. 合理安排层顺序，利用缓存
# 先复制依赖文件，安装依赖，再复制代码

# 5. 使用非 root 用户运行容器
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 6. 清理不必要的文件
RUN apk add --no-cache python3 make g++ \
    && npm ci \
    && apk del python3 make g++

# 7. 使用 RUN 指令合并命令减少层数
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*
```

---

### 12.4 Docker Compose

**docker-compose.yml 示例：**

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
    volumes:
      - ./logs:/app/logs
      - /app/node_modules
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass secret
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

**Docker Compose 命令：**

```bash
# 启动所有服务
docker-compose up -d

# 启动并重新构建
docker-compose up -d --build

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f web

# 重启单个服务
docker-compose restart web

# 进入服务容器
docker-compose exec web bash

# 构建镜像
docker-compose build

# 查看服务资源使用
docker-compose top
```

---

### 12.5 Docker 网络和存储

**Docker 网络模式：**

```bash
# 查看网络
docker network ls
docker network inspect bridge

# 创建网络
docker network create my-network

# 容器加入网络
docker run -d --network my-network --name web nginx

# 容器间通信
# 在同一网络下的容器可以通过容器名进行通信
# web 容器可以访问 db 容器：ping db
```

**Docker 存储卷：**

```bash
# 创建卷
docker volume create my-volume

# 查看卷
docker volume ls
docker volume inspect my-volume

# 使用卷
docker run -d -v my-volume:/data nginx
docker run -d -v /host/path:/container/path nginx

# 匿名卷和命名卷
# -v /data 匿名卷
# -v my-volume:/data 命名卷
# -v /host/path:/container/path 绑定挂载
```

---

## 第十三章 监控工具

### 13.1 常用监控工具

**面试重点：**

监控系统是保障服务稳定运行的重要工具，需要了解常用监控工具。

```bash
# ========== 系统监控 ==========
# top - 实时系统监控
top
top -u username        # 查看指定用户的进程

# htop - top 的增强版
htop

# iotop - I/O 监控
iotop

# iftop - 网络流量监控
iftop

# nethogs - 按进程的网络流量
nethogs

# glances - 全方位监控工具
pip install glances
glances

# ========== 应用监控 ==========
# Node.js 应用监控
pm2 monit              # PM2 内置监控
pm2 plus               # PM2 在线监控

# Web 服务监控
curl -I http://localhost/health  # 健康检查

# 数据库监控
# MySQL: SHOW PROCESSLIST
# PostgreSQL: SELECT * FROM pg_stat_activity
```

---

### 13.2 Prometheus + Grafana 监控

**Prometheus 配置示例：**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:3000']
```

**Grafana 数据源配置：**

1. 登录 Grafana
2. Configuration -> Data Sources -> Add data source
3. 选择 Prometheus
4. 输入 URL: http://localhost:9090
5. 点击 Save & Test

**常用 Grafana 仪表板：**

- Node Exporter Full：系统监控
- Prometheus Stats：Prometheus 自身监控
- Nginx Ingress Controller：Nginx 监控

---

## 第十四章 安全加固

### 14.1 系统安全加固

```bash
# ========== 用户安全 ==========
# 禁用不必要的用户
userdel -r lp
userdel -r news
userdel -r uucp

# 设置密码策略
# /etc/login.defs
PASS_MAX_DAYS 90    # 密码有效期
PASS_MIN_DAYS 1     # 密码最小修改间隔
PASS_MIN_LEN 12     # 密码最小长度
PASS_WARN_AGE 7     # 密码过期警告

# ========== SSH 安全 ==========
# 修改 SSH 配置文件 /etc/ssh/sshd_config
Port 2222                   # 更换端口
PermitRootLogin no          # 禁止 root 登录
PasswordAuthentication no   # 禁用密码认证
PubkeyAuthentication yes    # 启用公钥认证
MaxAuthTries 3              # 最大尝试次数
ClientAliveInterval 300     # 空闲超时

# ========== 防火墙配置 ==========
# 只开放必要的端口
firewall-cmd --list-ports
firewall-cmd --add-port=22/tcp --permanent
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --add-port=443/tcp --permanent
firewall-cmd --reload

# ========== 文件权限 ==========
# 设置合理的文件权限
chmod 600 /etc/ssh/sshd_config
chmod 644 /etc/passwd
chmod 000 /etc/shadow
```

---

### 14.2 应用安全

**Nginx 安全配置：**

```nginx
# 隐藏版本号
server_tokens off;

# 禁止访问隐藏文件
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# 限制请求速率
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;

# 防止点击劫持
add_header X-Frame-Options "SAMEORIGIN";

# 防止 XSS
add_header X-XSS-Protection "1; mode=block";

# 防止 MIME 类型嗅探
add_header X-Content-Type-Options "nosniff";

# HTTPS 安全头
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

---

## 第十五章 自动化运维工具

### 15.1 Ansible 基础

**Ansible 简介：**

Ansible 是一个简单的自动化工具，用于配置管理、应用部署和任务自动化。

**Inventory 文件：**

```ini
# hosts.ini
[webservers]
192.168.1.10 ansible_user=deploy
192.168.1.11 ansible_user=deploy

[dbservers]
192.168.1.20 ansible_user=deploy

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

**Playbook 示例：**

```yaml
# deploy.yml
---
- name: Deploy Node.js Application
  hosts: webservers
  become: yes
  vars:
    app_dir: /var/www/myapp
    app_user: www-data

  tasks:
    - name: Install Node.js
      apt:
        name: nodejs
        state: present
      when: ansible_os_family == "Debian"

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"
        mode: '0755'

    - name: Copy application files
      synchronize:
        src: ./
        dest: "{{ app_dir }}/"
        delete: yes
        recursive: yes

    - name: Install dependencies
      npm:
        path: "{{ app_dir }}"
      become_user: "{{ app_user }}"

    - name: Build application
      npm:
        path: "{{ app_dir }}"
        run: build
      become_user: "{{ app_user }}"

    - name: Restart PM2
      shell: pm2 restart all
      become_user: "{{ app_user }}"
```

**运行 Playbook：**

```bash
# 运行 playbook
ansible-playbook -i hosts.ini deploy.yml

# 运行并检查（不执行）
ansible-playbook -i hosts.ini deploy.yml --check

# 运行并查看差异
ansible-playbook -i hosts.ini deploy.yml --diff
```

---

### 15.2 CI/CD 工具

**Jenkins Pipeline 示例：**

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'my-app'
        DOCKER_REGISTRY = 'registry.example.com'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${env.BUILD_NUMBER}")
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    ssh deploy@server "
                        cd /var/www/myapp &&
                        docker-compose pull &&
                        docker-compose up -d
                    "
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
```

---

## 第十六章 常见面试题汇总

### 16.1 Linux 基础面试题

**Q1: Linux 启动过程？**

1. BIOS/UEFI 自检
2. 加载引导程序（GRUB）
3. 加载内核
4. 启动 systemd 进程
5. 运行系统服务

**Q2: 如何查看系统负载？**

```bash
uptime
top
cat /proc/loadavg
```

**Q3: 什么是 inode？**

inode 是文件系统中用于存储文件元数据的数据结构，包含文件权限、时间戳、数据块位置等信息。每个文件都有一个唯一的 inode 编号。

**Q4: 硬链接和软链接的区别？**

- 硬链接：多个文件指向同一个 inode，不能跨文件系统，不能链接目录
- 软链接：类似快捷方式，可以跨文件系统，可以链接目录

**Q5: 如何查看端口被哪个进程占用？**

```bash
lsof -i :port
netstat -tlnp | grep port
```

---

### 16.2 Shell 脚本面试题

**Q1: 如何实现脚本日志记录？**

```bash
#!/bin/bash
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a /var/log/script.log
}

log "Starting script..."
```

**Q2: 如何实现脚本参数解析？**

```bash
#!/bin/bash
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            help
            shift
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done
```

---

### 16.3 Docker 面试题

**Q1: Docker 容器和虚拟机的区别？**

- 容器共享宿主机内核，轻量级，启动快
- 虚拟机独立操作系统，资源占用大，启动慢

**Q2: 如何优化 Docker 镜像大小？**

1. 使用多阶段构建
2. 使用较小的基础镜像（alpine）
3. 合理安排层顺序利用缓存
4. 清理不必要的文件

**Q3: Dockerfile 中的 CMD 和 ENTRYPOINT 区别？**

- CMD：提供默认命令，可被 docker run 参数覆盖
- ENTRYPOINT：定义容器入口，通常与 CMD 配合使用

---

### 16.4 网络和安全面试题

**Q1: HTTP 和 HTTPS 的区别？**

- HTTP：明文传输，端口 80
- HTTPS：加密传输，端口 443，使用 SSL/TLS

**Q2: 如何防止 SSH 暴力破解？**

1. 禁用密码认证，使用公钥认证
2. 修改默认端口
3. 限制允许的用户
4. 使用 fail2ban 工具

**Q3: 什么是 XSS 攻击？如何防护？**

跨站脚本攻击，攻击者在网页中注入恶意脚本。防护：对用户输入进行过滤和转义，使用 CSP 头。

---

> 想要玩转 Linux 运维岗位？本面试题汇总涵盖了 Linux 基础、Shell 脚本、Docker 容器、运维工具以及 CI/CD 等核心知识点。建议在理解的基础上进行实践操作，这样才能在面试中游刃有余。祝你面试顺利，早日拿到理想的 offer！

---

## 附录：常用命令速查表

### 文件操作

```bash
ls -la          # 列出文件
cd              # 切换目录
pwd             # 显示当前目录
mkdir           # 创建目录
rm -rf          # 强制删除
cp -r           # 复制目录
mv              # 移动/重命名
cat             # 查看文件内容
head/tail       # 查看文件头部/尾部
grep            # 搜索文本
find            # 查找文件
```

### 进程管理

```bash
ps aux          # 查看进程
top             # 实时监控
kill            # 终止进程
systemctl       # 服务管理
```

### 网络操作

```bash
ifconfig/ip     # 网络配置
ping            # 测试连通性
netstat/ss      # 查看端口
curl/wget       # 网络请求
```

### Docker

```bash
docker ps       # 查看容器
docker images   # 查看镜像
docker run      # 运行容器
docker exec     # 进入容器
docker logs     # 查看日志
docker-compose  # 编排容器
```

### Git

```bash
git status      # 查看状态
git add         # 添加文件
git commit      # 提交
git push/pull   # 推送/拉取
git branch      # 分支操作
```

---

本文档会持续更新和完善，如果有任何建议或发现错误，请提交 Issue 或 Pull Request。

---

**更新日志：**

- 2024-02-26: 初始版本，涵盖 Linux 基础、Shell 脚本、Docker 容器、运维工具和 CI/CD 等内容
