# Nginx 配置

## 一、配置概述

### 1.1 反向代理配置

Nginx 配置用于：
- 前端静态文件服务
- Socket.IO 转发到后端

### 1.2 配置结构

```nginx
location / {
    proxy_pass http://localhost:11451;
    # ...
}

location /socket.io/ {
    proxy_pass http://localhost:19191;
    # ...
}
```

---

## 二、版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-08 | 初始版本 |

---

*本文档使用简体中文，遵循 Google 文档风格。*
