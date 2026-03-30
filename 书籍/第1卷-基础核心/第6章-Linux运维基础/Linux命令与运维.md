# 第1卷-基础核心

## 第6章 Linux运维基础

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

---

### 1.2 文件权限管理

**面试重点：**

文件权限是 Linux 安全的核心，需要熟练掌握权限的表示方法和修改方法。

**权限表示方法：**

```
drwxr-xr-x 10 user group 4096 Feb 23 10:00 directory
- rw-r--r--  1 user group  1234 Feb 23 10:00 file

# 第1位：文件类型
# 第2-4位：所有者权限（owner）
# 第5-7位：组用户权限（group）
# 第8-10位：其他用户权限（others）
```

**权限含义：**

- `r` (read): 读取权限
- `w` (write): 写入权限
- `x` (execute): 执行权限

**权限数字表示：**

```
r = 4 (二进制 100)
w = 2 (二进制 010)
x = 1 (二进制 001)

常见权限组合：
777 = rwxrwxrwx 所有用户拥有所有权限
755 = rwxr-xr-x 所有者 rwx，组用户和其他用户 rx
644 = rw-r--r-- 所有者 rw，组用户和其他用户 r
600 = rw------- 只有所有者可以读写
```

**权限修改命令：**

```bash
# 基本权限修改
chmod 755 file
chmod 644 file
chmod 600 file

# 符号修改
chmod u+x file
chmod g+w file
chmod a+r file

# 修改所有者
chown user:group file
chown -R user:group /path/to/directory
```

---

### 1.3 用户和用户组管理

**面试重点：**

用户管理是系统管理的基础。

```bash
# 创建用户
useradd -m username
useradd -s /bin/bash username
useradd -G group1,group2 username

# 修改用户
usermod -l newname oldname
usermod -g groupname username
usermod -aG groupname username

# 删除用户
userdel -r username

# 用户组管理
groupadd groupname
groupdel groupname
gpasswd -a user groupname
gpasswd -d user groupname

# 查询用户
whoami
id username
groups username
```

---

### 1.4 系统信息查看

**面试重点：**

系统信息查看是排查问题的基础。

```bash
# 系统基本信息
uname -a
uname -r
cat /etc/os-release

# 系统运行状态
top
uptime
free -h
df -h

# CPU 信息
cat /proc/cpuinfo
lscpu

# 内存信息
cat /proc/meminfo
free -h

# 磁盘信息
lsblk
df -h

# 进程信息
ps aux
ps -ef
top
pstree

# 系统时间
date
timedatectl
```

---

## 第2章 文件和目录操作

### 2.1 文件和目录基本操作

```bash
# 目录操作
ls -la
ls -lh
ls -lt
cd ~
cd -
pwd

mkdir directory
mkdir -p dir1/dir2/dir3
rmdir directory
rm -rf directory

# 文件操作
touch file
cp file1 file2
cp -r dir1 dir2
mv file1 file2
rm file
rm -rf *

# 文件查看
cat file
head -n 10 file
tail -n 10 file
tail -f file
less file
```

### 2.2 文件查找和文本处理

```bash
# 文件查找
find /path -name "*.txt"
find /path -type f
find /path -type d
find /path -mtime -7

# 文本处理
grep "pattern" file
grep -r "pattern" /path
sed -i 's/old/new/g' file
awk '{print $1}' file
```

---

## 第3章 网络管理

### 3.1 网络配置

```bash
# 查看网络配置
ifconfig
ip addr
ip link

# 网络测试
ping -c 4 example.com
traceroute example.com
nslookup example.com
dig example.com

# 网络连接
netstat -tuln
ss -tuln
curl -v url
wget url
```

### 3.2 SSH 管理

```bash
# SSH 连接
ssh user@host
ssh -p 2222 user@host

# SSH 密钥
ssh-keygen
ssh-copy-id user@host

# SCP 文件传输
scp file user@host:/path
scp -r directory user@host:/path
```

---

## 第4章 进程和服务管理

### 4.1 进程管理

```bash
# 进程查看
ps aux
ps -ef
top
htop

# 进程控制
kill pid
kill -9 pid
pkill process_name

# 后台进程
nohup command &
bg
fg
jobs
```

### 4.2 服务管理

```bash
# systemctl (systemd)
systemctl start service
systemctl stop service
systemctl restart service
systemctl status service
systemctl enable service
systemctl disable service

# service (SysV init)
service service_name start
service service_name stop
service service_name status
```

---

## 第5章 软件包管理

### 5.1 apt (Debian/Ubuntu)

```bash
# 包管理
apt update
apt upgrade
apt install package
apt remove package
apt search package

# 查看已安装
dpkg -l
dpkg -L package
```

### 5.2 yum/dnf (RHEL/CentOS)

```bash
# 包管理
yum update
yum install package
yum remove package
yum search package
yum list installed

# dnf (新一代)
dnf install package
```

---

## 第6章 日志管理

### 6.1 系统日志

```bash
# 查看日志
tail -f /var/log/syslog
tail -f /var/log/messages
tail -f /var/log/auth.log

# 日志分析
grep "error" /var/log/syslog
journalctl -u service_name
```

### 6.2 日志轮转

```bash
# logrotate 配置
/etc/logrotate.conf
/etc/logrotate.d/
```

---

## 第7章 性能监控

### 7.1 CPU 和内存

```bash
# 实时监控
top
htop
glances

# 详细信息
vmstat 1
mpstat -P ALL 1
```

### 7.2 磁盘 I/O

```bash
# 磁盘使用
df -h
du -sh directory
du -h --max-depth=1

# I/O 监控
iostat -x 1
iotop
```

---

## 第8章 安全和防火墙

### 8.1 防火墙

```bash
# ufw (Ubuntu)
ufw enable
ufw disable
ufw allow 22/tcp
ufw deny 80/tcp
ufw status

# firewalld (RHEL/CentOS)
firewall-cmd --state
firewall-cmd --list-all
firewall-cmd --add-port=22/tcp
firewall-cmd --reload
```

### 8.2 SELinux

```bash
# SELinux 状态
getenforce
sestatus

# 临时设置
setenforce 0  #  permissive
setenforce 1  #  enforcing
```
