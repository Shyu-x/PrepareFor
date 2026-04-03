# Nginx生产配置完全指南

> Nginx就像是办公大楼的门卫。想象一下，一栋大楼有很多公司（后端服务），访客（用户请求）来来往往。门卫的工作就是：
> - 帮访客找到要去的公司（路由分发）
> - 验证访客的身份（身份验证）
> - 检查访客是否带了危险品（安全检查）
> - 让熟悉的人快速进入（缓存）
> - 人多时维持秩序（负载均衡）
> - 记录每个访客的信息（日志）

## 一、Nginx核心概念详解

### 1.1 Nginx是什么？

Nginx（读作"engine-x"）是一款高性能的HTTP服务器和反向代理服务器。它的特点是：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Nginx核心特点                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  高性能                                                            │
│  ├── 基于事件驱动架构                                              │
│  ├── 单机可处理10万+并发连接                                       │
│  └── 内存占用低                                                    │
│                                                                     │
│  功能丰富                                                          │
│  ├── HTTP服务器                                                    │
│  ├── 反向代理                                                      │
│  ├── 负载均衡                                                      │
│  ├── SSL/TLS终止                                                   │
│  ├── 静态文件服务                                                  │
│  └── 动态内容（通过FastCGI等）                                      │
│                                                                     │
│  高可靠性                                                          │
│  ├── 热部署（不停机更新配置）                                      │
│  ├── 7x24小时运行                                                  │
│  └── 低资源消耗                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 正向代理 vs 反向代理

```
┌─────────────────────────────────────────────────────────────────────┐
│                     正向代理 vs 反向代理                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  正向代理 = 代替客户端发起请求                                      │
│  ═══════════════════════════                                        │
│                                                                     │
│     用户 ──► 代理服务器 ──► 目标网站                                 │
│                                                                     │
│  场景：翻墙、科学上网                                               │
│  用户不知道访问的是哪个网站（隐藏客户端）                           │
│  代理服务器知道用户访问的一切                                       │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  反向代理 = 代替服务端接收请求                                      │
│  ═══════════════════════════                                        │
│                                                                     │
│     用户 ──► 反向代理 ──► 后端服务器A                               │
│                         ├──► 后端服务器B                            │
│                         └──► 后端服务器C                            │
│                                                                     │
│  场景：负载均衡、安全防护                                           │
│  后端服务器不知道真正的用户是谁（隐藏服务端）                       │
│  用户不知道访问的是哪台服务器（负载均衡）                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Nginx配置结构

```nginx
# ============================================
# Nginx配置文件结构
# ============================================

# 全局块（影响Nginx整体运行）
user www-data;                    # 运行Nginx的用户
worker_processes auto;            # 自动使用所有CPU核心
error_log /var/log/nginx/error.log warn;  # 错误日志
pid /var/run/nginx.pid;           # PID文件位置

# events块（影响nginx服务器与用户的网络连接）
events {
    worker_connections 1024;      # 每个worker的最大连接数
    use epoll;                    # Linux使用epoll高效模式
    multi_accept on;              # 一次接受多个连接
}

# http块（HTTP服务器相关配置）
http {
    # 引入MIME类型
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;

    # server块（虚拟主机配置）
    server {
        listen 80;
        server_name example.com www.example.com;

        # location块（URL匹配规则）
        location / {
            root /var/www/html;
            index index.html index.htm;
        }

        location /api/ {
            proxy_pass http://backend;
        }
    }
}
```

## 二、反向代理配置

### 2.1 基础反向代理

反向代理是Nginx最常用的功能之一。它可以把你后端的多个服务统一暴露给外部：

```nginx
# ============================================
# 基础反向代理配置
# ============================================

# 定义后端服务器组
upstream backend_api {
    # 负载均衡到多个后端服务器
    server 127.0.0.1:3000 weight=5;  # weight表示权重
    server 127.0.0.1:3001 weight=3;
    server 127.0.0.1:3002 weight=2;

    # 保持长连接数量
    keepalive 32;
}

upstream backend_ws {
    server 127.0.0.1:4000;
}

# 主网站服务器块
server {
    listen 80;
    server_name example.com www.example.com;

    # 将所有HTTP请求重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器块
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # SSL证书配置
    ssl_certificate /etc/ssl/certs/example.com.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # 安全头配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 静态文件服务
    location / {
        root /var/www/frontend;
        index index.html;
        # 尝试查找文件，如果找不到则返回index.html（SPA应用需要）
        try_files $uri $uri/ /index.html;
    }

    # API请求转发到后端
    location /api/ {
        # 代理到后端服务
        proxy_pass http://backend_api;

        # 代理头部设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 升级WebSocket连接
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # WebSocket服务
    location /ws/ {
        proxy_pass http://backend_ws;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # WebSocket超时设置（较长）
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 静态资源（开启缓存）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/frontend;
        expires 30d;
        add_header Cache-Control "public, immutable";
        # 开启gzip压缩
        gzip_static on;
    }

    # 健康检查端点
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

### 2.2 代理配置详解

```nginx
# ============================================
# proxy_set_header 详解
# ============================================

# 这些头部信息告诉后端服务器：
# - 原始请求的主机名
# - 客户端的真实IP地址（而非代理IP）
# - 原始协议（HTTP还是HTTPS）
# - 客户端的原始IP（通过代理链）

location /api/ {
    proxy_pass http://backend;

    # 关键头部配置
    # ========================

    # Host：原始请求的主机名
    # 后端可以通过 req.host 获取原始域名
    proxy_set_header Host $host;

    # X-Real-IP：客户端真实IP
    # 注意：如果有多层代理，这个只能获取到上一层代理的IP
    proxy_set_header X-Real-IP $remote_addr;

    # X-Forwarded-For：代理链上的所有IP
    # 格式：client, proxy1, proxy2
    # 后端可以解析这个头部获取真实客户端IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # X-Forwarded-Proto：原始协议
    # 用于后端判断用户是通过HTTP还是HTTPS访问
    proxy_set_header X-Forwarded-Proto $scheme;

    # X-Forwarded-Host：原始主机名
    proxy_set_header X-Forwarded-Host $host;

    # Connection：处理连接方式
    # 保持连接或者关闭
    proxy_set_header Connection "";
}
```

### 2.3 WebSocket代理配置

```nginx
# ============================================
# WebSocket代理配置
# ============================================

upstream websocket_backend {
    server 127.0.0.1:8080;
    # WebSocket需要长连接
    keepalive 64;
}

server {
    listen 80;
    server_name ws.example.com;

    location /ws {
        # 代理到WebSocket服务器
        proxy_pass http://websocket_backend;

        # 关键：升级HTTP协议到WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 设置真实IP头部
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;

        # WebSocket超时时间要设置得很长
        # 因为WebSocket可能长时间没有数据传输
        proxy_read_timeout 86400;  # 24小时
        proxy_send_timeout 86400;

        # 关闭代理缓冲
        # WebSocket需要实时传输，不能缓冲
        proxy_buffering off;

        # 错误处理
        proxy_intercept_errors off;
    }
}
```

## 三、HTTPS配置详解

### 3.1 SSL证书获取

```bash
# ============================================
# 使用Let's Encrypt免费证书（推荐）
# ============================================

# 安装certbot（Let's Encrypt的官方客户端）
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx

# ============================================
# 方式1：自动配置Nginx（最简单）
# ============================================

# 一键配置，会自动修改Nginx配置
sudo certbot --nginx -d example.com -d www.example.com

# 按提示输入：
# 1. 邮箱地址（接收证书到期通知）
# 2. 是否同意服务条款
# 3. 是否分享邮箱（可选）
# 4. 是否自动重定向HTTP到HTTPS（建议选1或2）

# ============================================
# 方式2：仅获取证书（手动配置）
# ============================================

# 只获取证书，不修改Nginx配置
sudo certbot certonly --nginx -d example.com -d www.example.com

# 证书会保存在：
# /etc/letsencrypt/live/example.com/fullchain.pem  (公钥+中间证书)
# /etc/letsencrypt/live/example.com/privkey.pem    (私钥)

# ============================================
# 方式3：使用DNS验证（适合通配符证书）
# ============================================

# 安装DNS插件（以阿里云为例）
sudo certbot-dns-aliyun

# 创建配置文件
cat > /etc/certbot/dns_aliyun.ini << 'EOF'
# 阿里云AccessKey ID
dns_aliyun_access_key = YOUR_ACCESS_KEY_ID
# 阿里云AccessKey Secret
dns_aliyun_access_key_secret = YOUR_ACCESS_KEY_SECRET
EOF

chmod 600 /etc/certbot/dns_aliyun.ini

# 获取通配符证书（验证DNS）
sudo certbot certonly \
  --dns-aliyun \
  --dns-aliyun-credentials /etc/certbot/dns_aliyun.ini \
  -d "*.example.com" \
  -d example.com

# ============================================
# 证书续期
# ============================================

# Let's Encrypt证书有效期90天，需要自动续期

# 测试自动续期（dry-run）
sudo certbot renew --dry-run

# 设置定时任务（每天检查，到期前自动续期）
sudo crontab -e

# 添加以下行（在证书到期前30天自动续期）
0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"

# ============================================
# 使用ACME.sh（另一个免费证书工具）
# ============================================

# 安装acme.sh
curl https://get.acme.sh | sh

# 重新加载shell配置
source ~/.bashrc

# 获取证书（使用DNS方式）
acme.sh --issue --dns dns_aliyun \
  -d example.com \
  -d "*.example.com" \
  --dns-aliyun-key YOUR_ACCESS_KEY_ID \
  --dns-aliyun-secret YOUR_ACCESS_KEY_SECRET

# 安装证书到Nginx
acme.sh --install-cert -d example.com \
  --key-file /etc/ssl/private/example.com.key \
  --fullchain-file /etc/ssl/certs/example.com.fullchain.pem \
  --reloadcmd "systemctl reload nginx"
```

### 3.2 生产级HTTPS配置

```nginx
# ============================================
# 生产级HTTPS配置（安全+性能）
# ============================================

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # ============================================
    # SSL证书
    # ============================================
    ssl_certificate /etc/ssl/certs/example.com.fullchain.pem;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    # ============================================
    # SSL安全协议版本
    # ============================================
    # 只允许TLSv1.2和TLSv1.3（禁用SSLv3、TLSv1.0、TLSv1.1）
    ssl_protocols TLSv1.2 TLSv1.3;

    # ============================================
    # SSL加密套件
    # ============================================
    # 优先使用ECDHE系列（提供前向保密）
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # 让服务器选择加密套件（而非客户端）
    ssl_prefer_server_ciphers off;

    # ============================================
    # SSL会话缓存
    # ============================================
    # 共享会话缓存，多个worker共享
    ssl_session_cache shared:SSL:10m;
    # 会话超时时间
    ssl_session_timeout 1d;
    # 会话票据（支持会话恢复）
    ssl_session_tickets off;

    # ============================================
    # OCSP stapling（在线证书状态协议）
    # ============================================
    # 加速证书验证，避免客户端查询CA
    ssl_stapling on;
    ssl_stapling_verify on;

    # 验证证书链
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # ============================================
    # 安全响应头
    # ============================================
    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;

    # 防止MIME类型嗅探
    add_header X-Content-Type-Options "nosniff" always;

    # XSS防护
    add_header X-XSS-Protection "1; mode=block" always;

    # 引用来源策略
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # HSTS（HTTP严格传输安全）
    # 强制使用HTTPS，减少中间人攻击
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 权限策略
    add_header Permissions-Policy "geolocation=self" always;

    # ============================================
    # 内容安全策略（CSP）
    # ============================================
    # 控制页面可以加载哪些资源
    # 需要根据实际业务调整
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://trusted-cdn.com; style-src 'self' 'unsafe-inline' https://trusted-cdn.com; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.example.com wss://ws.example.com; frame-ancestors 'self';" always;

    # ============================================
    # 其他安全设置
    # ============================================
    # 禁止暴露敏感文件
    location ~ /\. {
        deny all;
    }

    # 禁止访问敏感文件
    location ~* \.(env|git|htaccess|htpasswd|ini|log|sh|sql|conf|bak)$ {
        deny all;
    }

    # 实际应用配置
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }
}

# HTTP到HTTPS的重定向
server {
    listen 80;
    server_name example.com www.example.com;

    # 永久重定向
    return 301 https://$server_name$request_uri;
}
```

## 四、缓存策略配置

### 4.1 浏览器缓存配置

```nginx
# ============================================
# 缓存策略配置
# ============================================

server {
    listen 80;
    server_name example.com;
    root /var/www/frontend;

    # ============================================
    # 静态资源缓存（永不变化的）
    # ============================================
    # 包括：编译后的JS/CSS文件（带hash命名）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        # 开启缓存
        expires 1y;              # 缓存1年
        add_header Cache-Control "public, immutable";  # 不可变，即使URL参数变了也不重新请求

        # 关闭access日志，减少磁盘IO
        access_log off;

        # 开启gzip压缩
        gzip_static on;
    }

    # ============================================
    # HTML文件（不缓存或短缓存）
    # ============================================
    location ~* \.html$ {
        # 不缓存HTML，确保用户获取最新版本
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # ============================================
    # API响应（不缓存）
    # ============================================
    location /api/ {
        proxy_pass http://backend;

        # 不缓存API响应
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        proxy_no_cache 1;
        proxy_cache_bypass 1;

        # 允许跨域
        add_header Access-Control-Allow-Origin *;
    }

    # ============================================
    # 用户私有数据（不缓存）
    # ============================================
    location /user/ {
        proxy_pass http://backend;

        # 私有数据不能被代理缓存
        add_header Cache-Control "private, no-cache";
        proxy_cache off;
    }
}
```

### 4.2 代理缓存配置

```nginx
# ============================================
# 代理缓存配置（缓存后端响应）
# ============================================

# 定义缓存区域
# 缓存文件存储位置和大小
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name api.example.com;

    # ============================================
    # 公开API（可缓存）
    # ============================================
    location /api/public/ {
        proxy_pass http://backend;

        # 使用缓存区域
        proxy_cache api_cache;

        # 缓存KEY（基于这个生成唯一标识）
        proxy_cache_key "$scheme$request_method$host$request_uri";

        # 缓存有效期
        proxy_cache_valid 200 60m;      # 200响应缓存60分钟
        proxy_cache_valid 404 5m;       # 404响应缓存5分钟

        # 缓存最小使用次数后才缓存（减少缓存冷数据）
        proxy_cache_min_uses 3;

        # 使用X-Accel-Expires或Cache-Control控制缓存
        proxy_ignore_headers X-Accel-Expires Expires Cache-Control Set-Cookie;

        # 缓存穿透保护：如果后端返回"Cache-Control: no-cache"则不缓存
        proxy_cache_bypass $cookie_nocache $arg_nocache;

        # 添加缓存状态头部（便于调试）
        add_header X-Cache-Status $upstream_cache_status;

        # 后端错误时不使用缓存
        proxy_intercept_errors off;
    }

    # ============================================
    # 私有API（不缓存）
    # ============================================
    location /api/private/ {
        proxy_pass http://backend;

        # 不使用缓存
        proxy_cache off;
    }
}

# X-Cache-Status头部值说明：
# MISS    - 缓存未命中，请求转发到后端
# HIT     - 缓存命中
# EXPIRED - 缓存已过期，但响应了旧数据同时发起异步刷新
# STALE   - 使用了过期缓存（后端挂了）
# BYPASS  - 被指令强制绕过缓存
```

## 五、负载均衡配置

### 5.1 负载均衡算法

```nginx
# ============================================
# 负载均衡配置
# ============================================

# 定义后端服务器组
upstream backend_servers {
    # 方式1：轮询（默认）
    # 每个请求依次分发到不同服务器
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;

    # 方式2：加权轮询
    # weight越大，分到的请求越多
    server 10.0.0.1:3000 weight=5;
    server 10.0.0.2:3000 weight=3;
    server 10.0.0.3:3000 weight=2;

    # 方式3：最少连接
    # 优先分发给连接数最少的服务器
    least_conn;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;

    # 方式4：IP哈希
    # 同一IP的请求始终分发给同一服务器（会话保持）
    ip_hash;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
    # 注意：服务器宕机时，hash会重新分配，可能影响现有连接

    # 方式5：普通哈希
    # 按请求参数哈希（不只是IP）
    hash $request_uri consistent;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

# 带健康检查的负载均衡
upstream backend_with_health {
    server 10.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:3000 max_fails=3 fail_timeout=30s;
    # max_fails：连续失败次数达到这个值就认为服务器不可用
    # fail_timeout：服务器不可用后，多久再尝试一次
}
```

### 5.2 完整负载均衡配置

```nginx
# ============================================
# 生产级负载均衡配置
# ============================================

# 定义多个后端服务器组
# ============================================
upstream api_backend {
    server 10.0.0.1:3000 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:3000 weight=3 max_fails=3 fail_timeout=30s;

    # 保持长连接
    keepalive 32;
}

upstream static_backend {
    server 10.0.0.10:80 weight=5;
    server 10.0.0.11:80 weight=5;

    # 备用服务器（主服务器全部宕机时启用）
    server 10.0.0.100:80 backup;
}

upstream websocket_backend {
    # WebSocket不支持长连接，需要单独处理
    server 10.0.0.20:8080;
    server 10.0.0.21:8080;
}

# 主服务器块
# ============================================
server {
    listen 80;
    server_name example.com *.example.com;

    # 静态文件（负载均衡到静态文件服务器）
    location /static/ {
        proxy_pass http://static_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API请求
    location /api/ {
        proxy_pass http://api_backend;

        # 请求头部
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;

        # 连接管理
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # 错误处理：当后端都不可用时显示错误页面
        error_page 502 503 504 /50x.html;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 错误页面
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
```

## 六、安全头配置

### 6.1 完整安全头配置

```nginx
# ============================================
# 生产级安全头配置
# ============================================

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL证书配置（略）...

    # ============================================
    # 安全响应头
    # ============================================

    # 1. X-Frame-Options
    # 防止页面被iframe嵌入（防止点击劫持）
    # SAMEORIGIN：只允许同源iframe
    # DENY：完全禁止
    add_header X-Frame-Options "SAMEORIGIN" always;

    # 2. X-Content-Type-Options
    # 禁止浏览器MIME类型嗅探
    # nosniff：不允许猜测内容类型
    add_header X-Content-Type-Options "nosniff" always;

    # 3. X-XSS-Protection
    # 启用浏览器XSS过滤器
    # 1; mode=block：检测到XSS时阻止页面渲染
    add_header X-XSS-Protection "1; mode=block" always;

    # 4. Referrer-Policy
    # 控制引用来源信息的发送
    # strict-origin-when-cross-origin：跨域时只发送来源域名
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 5. Permissions-Policy
    # 控制页面可以使用的浏览器功能
    add_header Permissions-Policy "accelerometer=(),camera=(),geolocation=(),gyroscope=(),magnetometer=(),microphone=(),payment=(),usb=()" always;

    # 6. Strict-Transport-Security (HSTS)
    # 强制使用HTTPS访问
    # max-age：HSTS有效期（31536000秒 = 1年）
    # includeSubDomains：包含子域名
    # preload：加入浏览器预加载列表
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 7. Content-Security-Policy (CSP)
    # 内容安全策略，控制资源加载来源
    # 这是最严格的安全配置之一，需要根据实际业务调整
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline' https://cdn.example.com; img-src 'self' data: https: blob:; font-src 'self' https://cdn.example.com; connect-src 'self' https://api.example.com wss://ws.example.com; frame-ancestors 'self';" always;

    # ============================================
    # 禁止访问的文件
    # ============================================

    # 隐藏版本号
    server_tokens off;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问敏感文件
    location ~* \.(env|git|htaccess|htpasswd|ini|log|sh|sql|conf|bak|config|private|secret)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问备份目录
    location ~* /(backup|sql|backup_db)/ {
        deny all;
    }

    # 禁止访问旧文件扩展名
    location ~* \.(bak|old|mov)$ {
        deny all;
    }

    # ============================================
    # 限流配置
    # ============================================

    # 定义限流区域（基于IP）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    # 10MB空间，10请求/秒

    # 定义连接数限制
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    # 限制单个IP最多50个连接
    limit_conn conn_limit 50;

    location /api/ {
        # 使用限流区域，burst=20表示允许突发20个请求
        # nodelay：不延迟处理突发请求
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        # 其他代理配置...
    }

    # ============================================
    # 防止常见攻击
    # ============================================

    # 防止SQL注入
    location ~* \.(php|jsp|cgi|aspx|asp)$ {
        # 只允许已知的请求方法
        limit_except GET POST PUT DELETE OPTIONS {
            deny all;
        }

        proxy_pass http://backend;
    }

    # 防止常见的路径遍历
    location ~* \.\.(?:htaccess|htpasswd|git|svn|DS_Store|icloud)$ {
        deny all;
    }
}
```

### 6.2 Rate Limiting（限流）详解

```nginx
# ============================================
# 限流配置详解
# ============================================

# 1. 定义限流区域（放在http块中）
# ============================================

http {
    # 基于IP的限流
    # 使用binary_remote_addr（比remote_addr更省内存）
    limit_req_zone $binary_remote_addr zone=ip_limit:10m rate=10r/s;

    # 基于server的限流（防止单个服务器被刷）
    limit_req_zone $server_name zone=server_limit:10m rate=1000r/s;

    # 基于变量的限流（如API key）
    limit_req_zone $http_authorization zone=api_limit:10m rate=5r/s;

    # 连接数限制
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
}

# 2. 应用限流规则
# ============================================

server {
    # 全局限流
    limit_req zone=ip_limit burst=50 nodelay;

    location /api/ {
        # 额外的API限流
        # burst：允许的突发请求数
        # nodelay：不延迟处理突发请求
        limit_req zone=ip_limit burst=20 nodelay;

        # 连接数限制
        limit_conn conn_limit 10;
        limit_conn_status 429;
    }

    location /login/ {
        # 登录接口更严格的限流
        # 5秒内最多10次尝试
        limit_req zone=ip_limit burst=10 delay=5;
        limit_req_status 429;
    }

    location /upload/ {
        # 上传接口限制更严格
        limit_req zone=ip_limit burst=5;
        limit_req_status 413;
    }
}

# 3. 限流返回值配置
# ============================================

# 自定义限流提示页面
limit_req_status 429;  # 默认返回状态码
limit_conn_status 429;
limit_req_status 429;

# 返回JSON提示
error_page 429 = @rate_limit_exceeded;

location @rate_limit_exceeded {
    return 429 '{"error": "请求过于频繁，请稍后重试", "code": "RATE_LIMIT_EXCEEDED"}';
    add_header Content-Type application/json;
}
```

## 七、实用配置示例

### 7.1 Next.js + NestJS完整配置

```nginx
# ============================================
# Next.js + NestJS 完整Nginx配置
# ============================================

# 定义日志格式
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';

# 定义后端服务
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream nestjs_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

upstream yjs_backend {
    server 127.0.0.1:3002;
    keepalive 16;
}

# 主服务器配置
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 日志
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # ============================================
    # 静态资源（Next.js构建产物）
    # ============================================
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 静态资源文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://nextjs_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ============================================
    # Next.js SSR页面
    # ============================================
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;

        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # HTTP升级
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # ============================================
    # NestJS API
    # ============================================
    location /api/ {
        proxy_pass http://nestjs_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API不启用WebSocket
        proxy_set_header Connection "";

        # 较长的超时（API可能处理复杂请求）
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # 缓冲
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 16 8k;
    }

    # ============================================
    # Yjs WebSocket协作服务
    # ============================================
    location /collaboration/ {
        proxy_pass http://yjs_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket必须
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # WebSocket长超时
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        # 关闭缓冲
        proxy_buffering off;
    }

    # ============================================
    # 健康检查
    # ============================================
    location /health {
        proxy_pass http://nestjs_backend;
        access_log off;
    }
}
```

### 7.2 生产环境常用命令

```bash
# ============================================
# Nginx常用命令
# ============================================

# 测试配置文件语法
nginx -t

# 测试并显示配置
nginx -T

# 重新加载配置（不中断服务）
nginx -s reload

# 优雅停止（处理完当前请求再停止）
nginx -s quit

# 强制停止（立即停止）
nginx -s stop

# 重新打开日志文件（用于日志切割）
nginx -s reopen

# 查看Nginx进程
ps aux | grep nginx

# 显示版本信息
nginx -v

# 显示编译信息
nginx -V
```

### 7.3 日志切割脚本

```bash
#!/bin/bash
# ============================================
# Nginx日志切割脚本
# ============================================

# 日志目录
LOG_DIR=/var/log/nginx
BACKUP_DIR=/var/log/nginx/backup

# 日期格式
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 重新打开日志文件（生成新的日志文件）
kill -USR1 $(cat /var/run/nginx.pid)

# 压缩旧日志
if [ -f $LOG_DIR/access.log ]; then
    mv $LOG_DIR/access.log $BACKUP_DIR/access_${DATE}.log
    gzip -9 $BACKUP_DIR/access_${DATE}.log
fi

if [ -f $LOG_DIR/error.log ]; then
    mv $LOG_DIR/error.log $BACKUP_DIR/error_${DATE}.log
    gzip -9 $BACKUP_DIR/error_${DATE}.log
fi

# 删除超过30天的日志
find $BACKUP_DIR -name "*.log.gz" -mtime +30 -delete

# 发送通知
echo "Nginx日志已切割，保留最近30天"
```

```bash
# 设置定时任务（每天凌晨执行）
sudo crontab -e

# 添加以下行
0 0 * * * /path/to/nginx_logrotate.sh
```

## 八、踩坑经验总结

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Nginx踩坑笔记                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  坑1：proxy_set_header Host $host vs $proxy_host                    │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：后端获取到的Host不正确                                        │
│  解决：                                                             │
│  - $host：不带端口的主机名                                           │
│  - $proxy_host：proxy_pass中的主机名（可能包含端口）                 │
│  建议：大多数情况下用$host                                           │
│                                                                     │
│  坑2：location匹配顺序                                              │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：配置的location没有生效                                        │
│  解决：Nginx按以下顺序匹配：                                         │
│  1. 精确匹配（=）                                                   │
│  2. 前缀匹配（^~）                                                  │
│  3. 正则匹配（~）按顺序，第一个匹配为准                             │
│  4. 普通匹配（无前缀）最长前缀匹配                                  │
│                                                                     │
│  坑3：try_files导致循环重定向                                       │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：SPA应用刷新404                                               │
│  解决：try_files $uri $uri/ /index.html;                           │
│                                                                     │
│  坑4：SSL证书路径权限                                               │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：SSL握手失败                                                   │
│  解决：                                                             │
│  - 私钥文件权限必须是600                                            │
│  - 证书文件权限必须是644                                            │
│  - 用户nginx/nginx或www-data/www-data必须能读取                     │
│                                                                     │
│  坑5：upstream长连接未配置                                          │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：QPS上不去，后端连接数爆炸                                      │
│  解决：                                                             │
│  - upstream中加keepalive connections;                               │
│  - location中加proxy_http_version 1.1;                             │
│  - location中加proxy_set_header Connection "";                      │
│                                                                     │
│  坑6：proxy_buffering影响响应时效                                   │
│  ═══════════════════════════════════════════════════════════════   │
│  问题：后端返回数据大时客户端很久才收到                              │
│  解决：proxy_buffering off;  # 关闭代理缓冲                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 九、总结

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Nginx核心配置要点                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 反向代理                                                        │
│     ├── proxy_pass设置转发目标                                      │
│     ├── proxy_set_header传递正确头部                                │
│     └── WebSocket需要特殊配置                                       │
│                                                                     │
│  2. HTTPS安全                                                       │
│     ├── 使用TLSv1.2/1.3                                            │
│     ├── 配置安全响应头                                              │
│     ├── 使用Let's Encrypt免费证书                                  │
│     └── 定期续期证书                                                │
│                                                                     │
│  3. 缓存策略                                                        │
│     ├── 静态资源长期缓存                                            │
│     ├── HTML/API不缓存                                              │
│     └── 使用代理缓存减少后端压力                                     │
│                                                                     │
│  4. 负载均衡                                                        │
│     ├── 轮询/加权/最少连接/IP哈希                                   │
│     ├── 健康检查自动剔除故障节点                                    │
│     └── 合理设置权重                                               │
│                                                                     │
│  5. 安全配置                                                        │
│     ├── 隐藏版本号                                                  │
│     ├── 防止常见攻击                                                │
│     ├── 配置限流防止滥用                                           │
│     └── 禁止访问敏感文件                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**下一篇预告**：《云服务器部署运维完全指南》将详细介绍阿里云、腾讯云、Vercel等平台的部署方法。