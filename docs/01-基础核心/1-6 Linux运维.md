# Linux 运维与 Shell 脚本编程完全指南

> Linux 是后端开发和 DevOps 工程师的必备技能，也是大厂面试中经常考察的内容。本文涵盖 Linux 基础、文件操作、进程管理、网络配置、常用服务等核心知识点。

---

## 一、Linux 基础入门

### 1.1 Linux 目录结构

| 目录 | 说明 |
|------|------|
| `/bin` | 存放基本命令的二进制文件 |
| `/sbin` | 存放系统管理命令 |
| `/etc` | 存放系统配置文件 |
| `/home` | 普通用户主目录 |
| `/root` | root 用户主目录 |
| `/usr` | 用户程序和数据 |
| `/var` | 存放可变数据（日志、缓存等） |
| `/tmp` | 临时文件存放目录 |
| `/proc` | 虚拟文件系统，反映系统状态 |
| `/dev` | 设备文件 |
| `/opt` | 可选软件安装目录 |
| `/boot` | 启动文件 |

### 1.2 Linux 常用命令

**文件操作命令：**

```bash
# 列出目录内容
ls -la        # 详细列表
ls -lh        # 人性化大小
ls -a         # 显示隐藏文件

# 切换目录
cd /path/to/dir
cd ..         # 上级目录
cd ~          # 用户主目录
cd -          # 上一次目录

# 查看当前目录
pwd

# 创建目录
mkdir -p dir1/dir2/dir3    # 递归创建
mkdir -m 755 dir            # 指定权限

# 删除文件/目录
rm file.txt                 # 删除文件
rm -rf dir                 # 强制递归删除
rm -i file                 # 交互式确认

# 复制文件/目录
cp source dest              # 复制
cp -r source dest           # 递归复制
cp -p source dest           # 保留属性

# 移动/重命名
mv oldname newname
mv file /path/to/dest

# 查看文件内容
cat file.txt                # 全部显示
head -n 20 file.txt        # 前20行
tail -n 20 file.txt        # 后20行
tail -f file.txt           # 实时监控
less file.txt              # 分页显示

# 创建链接
ln -s source link          # 软链接
ln source link             # 硬链接
```

**文本处理命令：**

```bash
# 搜索内容
grep "pattern" file.txt                # 基本搜索
grep -r "pattern" /path                # 递归搜索
grep -i "pattern" file.txt            # 忽略大小写
grep -n "pattern" file.txt            # 显示行号
grep -v "pattern" file.txt            # 反向匹配

# 统计行数/字数
wc -l file.txt        # 行数
wc -w file.txt        # 单词数
wc -c file.txt        # 字符数

# 文本处理
sort file.txt                 # 排序
uniq file.txt                 # 去重
awk '{print $1}' file.txt     # 提取字段
sed 's/old/new/g' file.txt    # 替换
cut -d',' -f1 file.txt        # 分割字段
```

**打包压缩命令：**

```bash
# tar 打包
tar -cvf archive.tar dir/           # 打包
tar -xvf archive.tar                # 解包
tar -czvf archive.tar.gz dir/       # gzip 压缩
tar -xzvf archive.tar.gz            # gzip 解压
tar -cjvf archive.tar.bz2 dir/      # bzip2 压缩
tar -xjvf archive.tar.bz2           # bzip2 解压

# zip 压缩
zip -r archive.zip dir/
unzip archive.zip
```

---

## 二、用户与权限管理

### 2.1 用户管理

```bash
# 添加用户
useradd -m -s /bin/bash username
useradd -e 2026-12-31 username     # 设置过期时间

# 设置密码
passwd username

# 修改用户信息
usermod -l newname oldname          # 重命名
usermod -g groupname username       # 修改主组
usermod -G group1,group2 username  # 添加附加组
usermod -L username                # 锁定账户
usermod -U username                # 解锁账户

# 删除用户
userdel -r username                 # 同时删除主目录

# 查看用户
id username
whoami
who
```

### 2.2 用户组管理

```bash
# 创建组
groupadd groupname

# 修改组
groupmod -n newname oldname

# 删除组
groupdel groupname

# 查看组
groups username
getent group groupname
```

### 2.3 权限管理

**权限说明：**

| 权限 | 符号 | 数值 |
|------|------|------|
| 读 | r | 4 |
| 写 | w | 2 |
| 执行 | x | 1 |

**文件类型：**

| 类型 | 说明 |
|------|------|
| `-` | 普通文件 |
| `d` | 目录 |
| `l` | 符号链接 |
| `c` | 字符设备 |
| `b` | 块设备 |

**权限命令：**

```bash
# 修改权限
chmod 755 file.txt              # 数字方式
chmod +x script.sh              # 添加执行权限
chmod -w file.txt               # 移除写权限
chmod u+w file.txt              # 所有者添加写权限
chmod g+r file.txt              # 组添加读权限
chmod o=r file.txt              # 其他用户设置只读

# 修改所有者
chown user:group file.txt
chown -R user:group dir/        # 递归修改

# 修改组
chgrp groupname file.txt
```

---

## 三、进程管理

### 3.1 进程查看

```bash
# 查看进程
ps                          # 当前终端进程
ps -ef                      # 完整格式
ps aux                      # 详细列表
ps -ef | grep nginx         # 查找特定进程

# 动态查看进程
top                         # 实时监控
htop                        # 交互式（需安装）
top -u username             # 查看特定用户进程

# 进程树
pstree
pstree -p username
```

### 3.2 进程控制

```bash
# 终止进程
kill PID                    # 正常终止
kill -9 PID                 # 强制终止
killall processname         # 按名称终止
pkill processname           # 按名称终止（更灵活）

# 进程信号
kill -l                     # 查看所有信号
kill -TERM PID              # 优雅终止（默认）
kill -INT PID               # 中断（Ctrl+C）
kill -HUP PID               # 重载配置
kill -STOP PID              # 暂停
kill -CONT PID              # 继续
```

### 3.3 进程管理进阶

```bash
# 后台进程
./script.sh &               # 后台运行
Ctrl+Z                      # 暂停并放入后台
jobs                        # 查看后台任务
fg %1                       # 切换到前台
bg %1                       # 继续在后台运行

# nohup - 持久运行
nohup ./script.sh &         # 关闭终端后继续运行

# supervisor 进程管理
# /etc/supervisor/supervisord.conf
[program:myapp]
command=/usr/bin/myapp
directory=/opt/myapp
autostart=true
autorestart=true
```

---

## 四、网络配置与管理

### 4.1 网络查看

```bash
# IP 地址
ip addr
ifconfig                    # 传统方式
hostname -I                # 仅显示 IP

# 网络连接状态
netstat -tulnp             # 查看监听端口
netstat -an                # 查看所有连接
ss -tulnp                  # 更高效的 netstat 替代

# 网络连通性
ping -c 4 google.com
traceroute google.com      # 路由追踪
mtr google.com             # 实时路由追踪

# DNS 查询
nslookup google.com
dig google.com
host google.com
```

### 4.2 网络配置

```bash
# 临时配置 IP（命令重启失效）
ip addr add 192.168.1.100/24 dev eth0
ip link set eth0 up/down

# 查看网络接口
ip link show
ethtool eth0               # 网卡详细信息

# 路由表
ip route
route -n
```

### 4.3 防火墙配置

```bash
# firewalld (CentOS/RHEL)
firewall-cmd --list-all                    # 查看规则
firewall-cmd --add-port=80/tcp             # 开放端口
firewall-cmd --remove-port=80/tcp          # 关闭端口
firewall-cmd --reload                      # 重载配置
firewall-cmd --permanent                   # 永久生效

# iptables (Ubuntu/Debian)
iptables -L -n                             # 查看规则
iptables -A INPUT -p tcp --dport 80 -j ACCEPT  # 开放端口
iptables -A INPUT -j DROP                  # 默认拒绝
iptables-save > /etc/iptables.rules        # 保存规则
```

---

## 五、磁盘与存储管理

### 5.1 磁盘查看

```bash
# 磁盘使用情况
df -h                        # 人性化显示
df -i                        # inode 使用情况
du -sh dir/                  # 目录大小
du -h --max-depth=1          # 深度1

# 分区管理
fdisk -l                     # 查看分区
lsblk                        # 块设备列表
parted /dev/sdb              # 交互式分区
```

### 5.2 磁盘挂载

```bash
# 挂载
mount /dev/sdb1 /mnt/data
mount -o remount,rw /        # 重新挂载

# 卸载
umount /mnt/data
umount -l /mnt/data          # 强制卸载（lazy）

# 自动挂载 /etc/fstab
# /dev/sdb1 /mnt/data ext4 defaults 0 0
```

---

## 六、软件包管理

### 6.1 RPM/YUM (CentOS/RHEL)

```bash
# 查询
yum search nginx
yum list installed
yum info nginx

# 安装/卸载
yum install nginx
yum remove nginx
yum update nginx

# 升级
yum update
yum upgrade
```

### 6.2 APT (Ubuntu/Debian)

```bash
# 查询
apt search nginx
apt list --installed
apt show nginx

# 安装/卸载
apt install nginx
apt remove nginx
apt purge nginx              # 完全删除

# 更新
apt update                   # 更新软件源
apt upgrade                 # 升级软件包
apt dist-upgrade            # 发行版升级
```

---

## 七、服务管理

### 7.1 Systemd

```bash
# 服务管理
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl reload nginx

# 服务状态
systemctl status nginx
systemctl is-active nginx
systemctl is-enabled nginx

# 开机自启
systemctl enable nginx
systemctl disable nginx

# 查看服务日志
journalctl -u nginx
journalctl -u nginx -f      # 实时日志
journalctl --since "1 hour ago"
```

### 7.2 服务配置示例

**Nginx 配置：**

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $;
    }

   uri/ =404 location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
```

---

## 八、Shell 脚本编程

### 8.1 基础语法

```bash
#!/bin/bash

# 变量
name="张三"
age=25
echo "姓名: $name, 年龄: $age"

# 数组
arr=(1 2 3 4 5)
echo ${arr[0]}
echo ${arr[@]}           # 全部元素

# 字符串
str="hello world"
echo ${#str}             # 长度
echo ${str:0:5}          # 切片
echo ${str/world/Shell}  # 替换
```

### 8.2 条件判断

```bash
# 数值比较
if [ $a -eq $b ]; then
    echo "相等"
fi

if [ $a -ne $b ]; then
    echo "不相等"
fi

if [ $a -gt $b ]; then
    echo "大于"
fi

# 字符串比较
if [ "$str1" = "$str2" ]; then
    echo "相等"
fi

if [ -z "$str" ]; then
    echo "空字符串"
fi

if [ -n "$str" ]; then
    echo "非空"
fi

# 文件测试
if [ -f "$file" ]; then
    echo "普通文件"
fi

if [ -d "$dir" ]; then
    echo "目录"
fi

if [ -r "$file" ]; then
    echo "可读"
fi
```

### 8.3 循环

```bash
# for 循环
for i in {1..5}; do
    echo $i
done

for file in *.txt; do
    echo $file
done

# while 循环
count=0
while [ $count -lt 5 ]; do
    echo $count
    count=$((count + 1))
done

# 读取文件
while read line; do
    echo $line
done < file.txt
```

### 8.4 函数

```bash
# 函数定义
function greet() {
    local name=$1
    echo "你好, $name"
}

greet "张三"

# 返回值
function add() {
    return $(($1 + $2))
}

add 3 5
result=$?
echo $result
```

### 8.5 实战脚本

**备份脚本：**

```bash
#!/bin/bash
# 备份脚本

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/var/www/html"
DB_NAME="myapp"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $SOURCE_DIR

# 备份数据库
mysqldump -u root -p123456 $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 清理7天前的备份
find $BACKUP_DIR -mtime +7 -delete

echo "备份完成: $DATE"
```

**监控脚本：**

```bash
#!/bin/bash
# 监控 Nginx 进程

PROCESS_NAME="nginx"
EMAIL="admin@example.com"

if ! pgrep -x $PROCESS_NAME > /dev/null; then
    echo "$(date): $PROCESS_NAME 已停止，正在重启..." | tee -a /var/log/monitor.log
    systemctl restart $PROCESS_NAME

    if ! pgrep -x $PROCESS_NAME > /dev/null; then
        echo "$(date): $PROCESS_NAME 重启失败" | mail -s "警告: $PROCESS_NAME 异常" $EMAIL
    fi
fi
```

---

## 九、Docker 容器管理

### 9.1 基础命令

```bash
# 镜像管理
docker images                          # 查看镜像
docker pull nginx:latest               # 拉取镜像
docker rmi image_id                    # 删除镜像
docker build -t myapp .                # 构建镜像

# 容器管理
docker ps                              # 运行中的容器
docker ps -a                           # 所有容器
docker run -d -p 8080:80 nginx        # 运行容器
docker run -it ubuntu /bin/bash       # 交互式运行
docker stop container_id              # 停止容器
docker rm container_id                # 删除容器
docker logs -f container_id            # 查看日志

# 容器操作
docker exec -it container_id bash     # 进入容器
docker cp container_id:/path ./local   # 复制文件
docker inspect container_id           # 查看详情
```

### 9.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - ./data:/app/data

  db:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

---

## 十、常用服务部署

### 10.1 Node.js 服务部署

```bash
# 使用 PM2 管理
npm install -g pm2
pm2 start app.js --name myapp
pm2 list
pm2 logs myapp
pm2 restart myapp
pm2 stop myapp
pm2 delete myapp

# 开机自启
pm2 startup
pm2 save
```

### 10.2 Nginx 配置优化

```nginx
# 基础优化
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # 基础优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 十一、面试常见问题

### 11.1 Linux 基础问题

**问题：Linux 启动流程？**

参考答案：
1. BIOS/UEFI 自检
2. 加载 Bootloader (GRUB)
3. 加载内核 (vmlinuz)
4. 启动 systemd (init)
5. 启动各类服务
6. 进入登录界面

**问题：如何查看系统负载？**

参考答案：
```bash
# 方法1: uptime
uptime
# 16:30:00 up 10 days, 3:22, 2 users, load average: 0.52, 0.58, 0.59

# 方法2: top
top

# 方法3: /proc/loadavg
cat /proc/loadavg
```

### 11.2 网络问题

**问题：如何排查网络连接问题？**

参考答案：
1. 检查本机网络配置：`ip addr`、`ifconfig`
2. 测试本机到网关：`ping 网关IP`
3. 测试 DNS 解析：`nslookup 域名`
4. 测试目标主机：`ping 目标IP`
5. 追踪路由：`traceroute 目标`
6. 检查端口：`netstat -tulnp`、`ss -tulnp`

---

## 十二、2026 Linux 面试趋势

### 12.1 考察重点

- 基础命令熟练度
- 进程管理和资源监控
- 网络配置和故障排查
- Shell 脚本编写能力
- Docker 容器化技术

### 12.2 准备建议

- 熟练使用常用命令
- 掌握 Shell 脚本编程
- 理解系统启动流程
- 学习 Docker 容器技术
- 了解 Nginx/Apache 配置

---

> 持续更新中... 最后更新：2026-02-24
