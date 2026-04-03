# 边缘计算与 CDN 实战完全指南

## 前言：什么是边缘计算？

想象一下，你是外卖平台的老板。用户下单后，骑手要从 10 公里外的餐厅取餐送给你。即使餐厅就在你隔壁，也要等骑手跑一大圈。

**边缘计算**就像是在你小区里开了个微型厨房。用户下单后，直接从隔壁做，这样 5 分钟就能送到，而不是 30 分钟。

简单来说，边缘计算就是**把计算能力放到离用户更近的地方**，而不是集中在遥远的数据中心。

### 传统架构 vs 边缘计算

```
传统架构：
用户 → 互联网 → 数据中心（美国） → 处理请求 → 返回结果
       ↓
    延迟 200-300ms

边缘计算：
用户 → 最近的边缘节点（就在本地） → 处理请求 → 返回结果
       ↓
    延迟 5-20ms
```

## 一、CDN 核心概念深度解析

### 1.1 CDN 工作原理

CDN（Content Delivery Network，内容分发网络）本质上是一个全球分布的服务器网络，用于缓存和分发静态内容。

**CDN 的核心组件：**

| 组件 | 作用 | 类比 |
|------|------|------|
| 边缘服务器 | 离用户最近的节点 | 社区便利店 |
| 源站服务器 | 存储原始内容 | 工厂仓库 |
| DNS 系统 | 智能解析用户位置 | 导航系统 |
| 缓存系统 | 存储热点内容 | 冰箱 |
| 负载均衡 | 分配请求 | 交通指挥 |

**CDN 请求流程：**

```
1. 用户请求 https://example.com/image.jpg
2. DNS 解析到最近的 CDN 边缘节点（如广州节点）
3. 边缘节点检查缓存：
   - 命中 → 直接返回（缓存命中）
   - 未命中 → 向源站请求，缓存后返回（缓存未命中）
4. 后续请求直接命中缓存
```

### 1.2 CDN 缓存策略

```nginx
# Nginx CDN 配置示例
server {
    listen 80;
    server_name cdn.example.com;

    # 设置缓存路径和大小
    proxy_cache_path /data/nginx/cache
        levels=1:2
        keys_zone=my_cache:10m
        max_size=10g
        inactive=60m;  # 60分钟未访问则失效

    location /static/ {
        # 使用缓存
        proxy_cache my_cache;

        # 缓存状态头
        add_header X-Cache-Status $upstream_cache_status;

        # 缓存有效期（根据内容类型）
        # 图片：1年不过期（通过版本化实现更新）
        expires 1y;

        # 可缓存的请求方法
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }

    location /api/ {
        # API 不缓存
        proxy_cache_bypass 1;
        add_header Cache-Control no-store;
    }
}
```

### 1.3 缓存失效策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| TTL 过期 | 固定时间后失效 | 新闻、博客 |
| LRU | 最近最少使用淘汰 | 通用缓存 |
| 主动失效 | 手动触发失效 | 版本更新 |
| 分层缓存 | 多级缓存 | 大型 CDN |

**主动失效（Purge）：**

```bash
# Cloudflare API 清除缓存
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/{zone_id}/cache/purge" \
    -H "Authorization: Bearer {api_token}" \
    -H "Content-Type: application/json" \
    -d '{
        "files": [
            "https://example.com/image.jpg"
        ],
        "prefixes": [
            "https://example.com/static/*"
        ]
    }'
```

## 二、Edge Runtime（边缘运行时）

### 2.1 什么是 Edge Runtime？

Edge Runtime 是运行在边缘节点的 JavaScript/TypeScript 运行时环境，让开发者可以在边缘执行自定义逻辑。

**主流边缘运行时对比：**

| 运行时 | 厂商 | 语言 | 特点 |
|--------|------|------|------|
| Vercel Edge Functions | Vercel | JS/TS | 集成 Next.js |
| Cloudflare Workers | Cloudflare | JS/TS | 全球网络 |
| Deno Deploy | Deno | JS/TS | Deno 运行时 |
| AWS Lambda@Edge | AWS | JS/TS | 配合 CloudFront |
| Fastly Compute | Fastly | JS/WASM | WASM 优先 |

### 2.2 Cloudflare Workers 实战

Cloudflare Workers 是目前最流行的边缘计算平台之一，它让你可以在 Cloudflare 的全球网络上运行 JavaScript 代码。

**Workers 核心概念：**

```
Cloudflare 全球网络
├── 200+ 边缘数据中心
├── 每个数据中心运行 V8 引擎
├── Workers 代码在每个节点运行
└── 延迟极低（通常 < 50ms）
```

**第一个 Cloudflare Worker：**

```javascript
// index.js - Cloudflare Worker 入口

// 导出 fetch 事件处理器
// 每个到达边缘节点的请求都会触发这个处理器
export default {
    async fetch(request, env, ctx) {
        // request: FetchEvent 请求对象
        // env: 环境变量和 KV/DO 绑定
        // ctx: 上下文（用于缓存等）

        // 获取请求信息
        const url = new URL(request.url);
        const pathname = url.pathname;

        // 简单的路由处理
        if (pathname === '/') {
            return new Response('Hello from the Edge!', {
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Edge-Location': request.cf?.colo || 'unknown'
                }
            });
        }

        if (pathname === '/api/time') {
            // 返回边缘节点时间（可以用来做时钟同步）
            return new Response(JSON.stringify({
                edgeTime: new Date().toISOString(),
                timezone: 'UTC',
                colo: request.cf?.colo
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (pathname === '/api/whoami') {
            // 返回请求的地理位置信息
            return new Response(JSON.stringify({
                country: request.cf?.country,
                city: request.cf?.city,
                latitude: request.cf?.latitude,
                longitude: request.cf?.longitude,
                timezone: request.cf?.timezone,
                asn: request.cf?.asn
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 404
        return new Response('Not Found', { status: 404 });
    }
};

// 或者使用 addEventListener 方式
/*
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    return new Response('Hello World!');
}
*/
```

**wrangler.toml 配置：**

```toml
# wrangler.toml - Cloudflare Workers 配置文件

name = "my-edge-worker"
main = "index.js"
compatibility_date = "2024-01-01"

# 环境
[env.production]
zone_id = "your_zone_id"

# KV 命名空间绑定（键值存储）
[[kv_namespaces]]
binding = "MY_KV"
id = "your_kv_namespace_id"

# D1 数据库绑定（SQLite at edge）
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your_d1_id"

# R2 存储绑定（对象存储）
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "my-assets"
```

**使用 KV 存储：**

```javascript
// index.js - KV 存储示例

// KV 是分布式键值存储，类似于 Redis
// 数据会自动复制到全球所有边缘节点

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname === '/set') {
            // 写入 KV
            // key: "my_key", value: "my_value"
            await env.MY_KV.put('my_key', 'my_value', {
                expirationTtl: 3600  // 1小时后过期
            });

            return new Response('Value set!');
        }

        if (pathname === '/get') {
            // 读取 KV
            const value = await env.MY_KV.get('my_key');

            if (value === null) {
                return new Response('Key not found', { status: 404 });
            }

            return new Response(value);
        }

        if (pathname === '/delete') {
            // 删除 KV
            await env.MY_KV.delete('my_key');
            return new Response('Key deleted');
        }

        if (pathname === '/list') {
            // 列出所有键
            const list = await env.MY_KV.list({ prefix: 'user_' });

            return new Response(JSON.stringify({
                keys: list.keys.map(k => ({
                    name: k.name,
                    expiration: k.expiration
                })),
                cursor: list.cursor
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 存储复杂数据（序列化）
        if (pathname === '/set-user') {
            const user = {
                id: '123',
                name: '张三',
                email: 'zhang@example.com',
                preferences: { theme: 'dark' }
            };

            // JSON.stringify 存储
            await env.MY_KV.put('user_123', JSON.stringify(user));

            return new Response('User stored!');
        }

        if (pathname === '/get-user') {
            const data = await env.MY_KV.get('user_123');
            if (!data) {
                return new Response('User not found', { status: 404 });
            }

            const user = JSON.parse(data);
            return new Response(JSON.stringify(user), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Try /set, /get, /delete, /list');
    }
};
```

**使用 D1 数据库（边缘 SQLite）：**

```javascript
// index.js - D1 数据库示例

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // 初始化数据库（执行建表等初始化操作）
        if (pathname === '/init') {
            // 执行 DDL
            await env.DB.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 插入初始数据
            await env.DB.exec(`
                INSERT INTO users (name, email) VALUES
                ('张三', 'zhang@example.com'),
                ('李四', 'li@example.com')
            `);

            return new Response('Database initialized!');
        }

        // 查询所有用户
        if (pathname === '/users') {
            const result = await env.DB
                .prepare('SELECT * FROM users ORDER BY created_at DESC')
                .all();

            return new Response(JSON.stringify({
                count: result.results.length,
                users: result.results
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 查询单个用户
        if (pathname.startsWith('/user/')) {
            const id = pathname.split('/').pop();

            const result = await env.DB
                .prepare('SELECT * FROM users WHERE id = ?')
                .bind(id)
                .first();

            if (!result) {
                return new Response('User not found', { status: 404 });
            }

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 创建用户
        if (pathname === '/create-user' && request.method === 'POST') {
            const body = await request.json();
            const { name, email } = body;

            if (!name || !email) {
                return new Response('Name and email required', { status: 400 });
            }

            const result = await env.DB
                .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
                .bind(name, email)
                .run();

            return new Response(JSON.stringify({
                success: true,
                id: result.meta?.last_row_id
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新用户
        if (pathname.startsWith('/update-user/') && request.method === 'PUT') {
            const id = pathname.split('/').pop();
            const body = await request.json();

            const result = await env.DB
                .prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
                .bind(body.name, body.email, id)
                .run();

            return new Response(JSON.stringify({
                success: result.success,
                changes: result.meta?.changes
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 删除用户
        if (pathname.startsWith('/delete-user/')) {
            const id = pathname.split('/').pop();

            await env.DB
                .prepare('DELETE FROM users WHERE id = ?')
                .bind(id)
                .run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response('Try /init, /users, /user/:id, /create-user');
    }
};
```

### 2.3 Vercel Edge Functions 实战

Vercel Edge Functions 使用 Next.js 的边缘运行时，支持 React 服务端组件。

```javascript
// pages/api/edge-user.ts
// Vercel Edge Function（使用 TypeScript）

import type { NextRequest } from 'next/server';

// Edge Function 导出 config 指定运行时
export const config = {
    runtime: 'edge',  // 关键：指定使用边缘运行时
};

// 导出默认异步函数处理请求
export default async function handler(req: NextRequest) {
    // 获取用户地理位置（Vercel 会自动注入）
    const country = req.geo?.country;
    const city = req.geo?.city;
    const region = req.geo?.region;

    // 创建响应
    const response = new Response(
        JSON.stringify({
            message: 'Hello from Vercel Edge!',
            location: {
                country,
                city,
                region
            },
            timestamp: new Date().toISOString()
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    // 添加缓存头（边缘节点会缓存响应）
    response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
    );

    return response;
}
```

**使用 KV（Vercel）：**

```typescript
// pages/api/kv-demo.ts
import type { NextRequest } from 'next/server';
import { get, set, del } from '@vercel/edge-config';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: NextRequest) {
    const url = new URL(req.url);

    if (url.pathname === '/config/get') {
        const key = url.searchParams.get('key');
        if (!key) {
            return new Response('Key required', { status: 400 });
        }

        const value = await get(key);
        return new Response(JSON.stringify({ key, value }));
    }

    if (url.pathname === '/config/set') {
        const key = url.searchParams.get('key');
        const value = url.searchParams.get('value');

        if (!key || !value) {
            return new Response('Key and value required', { status: 400 });
        }

        await set(key, value);
        return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Try /config/get?key=xxx or /config/set?key=xxx&value=xxx');
}
```

## 三、边缘存储解决方案

### 3.1 Cloudflare R2 对象存储

R2 是 S3 兼容的对象存储，没有 egress 费用（数据传输免费）。

```javascript
// index.js - R2 对象存储示例

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 上传文件到 R2
        if (url.pathname === '/upload' && request.method === 'POST') {
            const formData = await request.formData();
            const file = formData.get('file');

            if (!file || !(file instanceof File)) {
                return new Response('File required', { status: 400 });
            }

            // 生成唯一文件名
            const key = `uploads/${Date.now()}-${file.name}`;

            // 读取文件内容
            const arrayBuffer = await file.arrayBuffer();

            // 上传到 R2
            await env.ASSETS.put(key, arrayBuffer, {
                httpMetadata: {
                    contentType: file.type
                }
            });

            return new Response(JSON.stringify({
                success: true,
                key,
                url: `/file/${key}`
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 列出文件
        if (url.pathname === '/files') {
            const listed = await env.ASSETS.list({
                prefix: 'uploads/',
                limit: 100
            });

            return new Response(JSON.stringify({
                count: listed.objects.length,
                files: listed.objects.map(obj => ({
                    key: obj.key,
                    size: obj.size,
                    uploaded: obj.uploaded
                }))
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 下载/查看文件
        if (url.pathname.startsWith('/file/')) {
            const key = url.pathname.replace('/file/', '');

            const object = await env.ASSETS.get(key);

            if (!object) {
                return new Response('File not found', { status: 404 });
            }

            // 返回文件内容
            const data = await object.arrayBuffer();

            return new Response(data, {
                headers: {
                    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream'
                }
            });
        }

        // 删除文件
        if (url.pathname.startsWith('/delete/')) {
            const key = url.pathname.replace('/delete/', '');

            await env.ASSETS.delete(key);

            return new Response(JSON.stringify({ success: true }));
        }

        return new Response(`
            <html>
                <body>
                    <h1>R2 Upload Demo</h1>
                    <form action="/upload" method="post" enctype="multipart/form-data">
                        <input type="file" name="file" />
                        <button type="submit">Upload</button>
                    </form>
                    <p><a href="/files">View Files</a></p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
```

### 3.2 边缘数据库对比

| 数据库 | 类型 | 特点 | 适用场景 |
|--------|------|------|----------|
| Cloudflare D1 | SQLite | 边缘原生、全球复制 | 轻量关系数据 |
| PlanetScale | MySQL | Serverless、分支 | 中大型应用 |
| Turso | SQLite | 分库、多租户 | 边缘优先 |
| Neon | PostgreSQL | Serverless 分支 | 复杂查询 |
| Upstash | Redis | Serverless、HTTP API | 缓存、会话 |
| MongoDB Atlas | MongoDB | 文档数据库 | 内容管理 |

**Turso 多租户示例：**

```typescript
// lib/turso.ts
// Turso 数据库客户端

import { createClient } from '@libsql/client';

// 创建 Turso 客户端
function createTursoClient(databaseUrl: string) {
    return createClient({
        url: databaseUrl,
        // Turso 使用 HTTP 协议访问边缘数据库
        authToken: process.env.TURSO_AUTH_TOKEN
    });
}

// 为每个租户创建独立的数据库连接
export function getTenantDatabase(tenantId: string) {
    // 假设每个租户有独立的数据库
    const dbUrl = `libsql://${tenantId}-db.example.com`;
    return createTursoClient(dbUrl);
}

// 通用查询示例
export async function queryUser(userId: string, dbUrl: string) {
    const db = createTursoClient(dbUrl);

    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [userId]
    });

    return result.rows[0];
}

// 事务示例
export async function transferCredits(
    fromUser: string,
    toUser: string,
    amount: number,
    dbUrl: string
) {
    const db = createTursoClient(dbUrl);

    // 开启事务
    await db.execute('BEGIN TRANSACTION');

    try {
        // 扣除发送者余额
        await db.execute({
            sql: 'UPDATE users SET credits = credits - ? WHERE id = ?',
            args: [amount, fromUser]
        });

        // 增加接收者余额
        await db.execute({
            sql: 'UPDATE users SET credits = credits + ? WHERE id = ?',
            args: [amount, toUser]
        });

        // 提交事务
        await db.execute('COMMIT');
        return { success: true };
    } catch (error) {
        // 回滚事务
        await db.execute('ROLLBACK');
        return { success: false, error: error.message };
    }
}
```

## 四、CDN 高级配置

### 4.1 缓存策略配置

```nginx
# nginx.conf - CDN 高级缓存配置

http {
    # 缓存配置
    proxy_cache_path /data/nginx/cache
        levels=1:2
        keys_zone=cdn_cache:100m    # 100MB 缓存元数据
        max_size=10g                # 最大缓存 10GB
        inactive=7d                  # 7天未访问则删除
        use_temp_path=off           # 直接写入缓存目录
        loader_threshold=300        # 缓存加载器配置
        loader_files=200;

    # 合并相同请求（防止缓存击穿）
    proxy_cache_lock on;
    proxy_cache_lock_timeout=5s;
    proxy_cache_lock_age=5s;

    # 忽略请求头（防止 Vary 问题）
    proxy_ignore_headers Vary;

    server {
        listen 80;
        server_name cdn.example.com;

        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            # 源站地址
            proxy_pass http://origin.example.com;

            # 启用缓存
            proxy_cache cdn_cache;

            # 缓存状态
            add_header X-Cache-Status $upstream_cache_status;

            # 静态资源缓存 30 天
            expires 30d;
            add_header Cache-Control "public, immutable";

            # 跨域头
            add_header Access-Control-Allow-Origin "*";
        }

        # HTML 页面（短缓存 + 验证）
        location ~* \.html$ {
            proxy_pass http://origin.example.com;
            proxy_cache cdn_cache;

            # 缓存 5 分钟，但后台验证更新
            expires 5m;
            add_header Cache-Control "public, must-revalidate";

            # 始终向后验证
            proxy_cache_use_stale error timeout updating;
        }

        # API 请求（不缓存或短缓存）
        location /api/ {
            proxy_pass http://api.example.com;
            proxy_cache_bypass 1;
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }

        # 用户个性化内容（不缓存）
        location /user/ {
            proxy_pass http://api.example.com;
            proxy_cache_bypass 1;
            add_header Cache-Control "private";
        }
    }
}
```

### 4.2 负载均衡配置

```nginx
# nginx.conf - 负载均衡配置

http {
    # 上游服务器组
    upstream origin_servers {
        # 方式1：轮询（默认）
        server 192.168.1.10:8080;
        server 192.168.1.11:8080;
        server 192.168.1.12:8080;

        # 方式2：加权轮询
        # server 192.168.1.10:8080 weight=5;
        # server 192.168.1.11:8080 weight=3;
        # server 192.168.1.12:8080 weight=2;

        # 方式3：IP Hash（同一 IP 访问同一服务器）
        # ip_hash;

        # 方式4：最少连接
        # least_conn;

        # 健康检查
        keepalive 32;  # 保持连接数
    }

    # 动态健康检查（商业版 nginx_plus）
    upstream origin_servers_healthcheck {
        server 192.168.1.10:8080;
        server 192.168.1.11:8080;
        server 192.168.1.12:8080;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://origin_servers;

            # 连接复用
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时配置
            proxy_connect_timeout 5s;
            proxy_read_timeout 30s;
            proxy_send_timeout 30s;

            # 重试配置
            proxy_next_upstream error timeout http_502;
        }
    }
}
```

### 4.3 Cloudflare 页面规则

```yaml
# Cloudflare Page Rules 配置示例
# 在 Cloudflare Dashboard 中设置或使用 API

rules:
  # 规则1：缓存 HTML 静态页面
  - name: "Cache HTML"
    url: "*.example.com/*.html"
    actions:
      - key: "cache_level"
        value: "cache_everything"
      - key: "edge_cache_ttl"
        value: 7200  # 2小时
      - key: "browser_cache_ttl"
        value: 3600  # 1小时

  # 规则2：绕过 API 的缓存
  - name: "Bypass API Cache"
    url: "api.example.com/*"
    actions:
      - key: "cache_level"
        value: "bypass"
      - key: "disable_security"
        value: true  # 根据需要

  # 规则3：边缘缓存 HTML
  - name: "Edge Cache HTML"
    url: "www.example.com/*.html"
    actions:
      - key: "cache_level"
        value: "cache_everything"
      - key: "edge_cache_ttl"
        value: 14400  # 4小时
      - key: "origin_cache_control"
        value: true  # 尊重源站的 Cache-Control

  # 规则4：图片优化
  - name: "Image Optimization"
    url: "*.example.com/images/*"
    actions:
      - key: "cache_level"
        value: "cache_everything"
      - key: "image_resizing"
        value: true
      - key: "strip_html"
        value: false

  # 规则5：移动端重定向
  - name: "Mobile Redirect"
    url: "www.example.com/*"
    conditions:
      - key: "mobile"
        operator: "mobile"
    actions:
      - key: "forwarding_url"
        value:
          url: "https://m.example.com/{ URI }"
          status_code: 301
```

## 五、CDN 与边缘计算实战项目

### 5.1 项目：全球图片处理 CDN

**需求：**
- 上传图片，自动压缩和转换格式
- 在边缘节点缓存和处理
- 支持按需调整尺寸

```javascript
// cloudflare-worker/image-processor.js
// 图片处理边缘 Worker

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 路径格式：/process/image.jpg?width=800&format=webp&quality=85
        if (url.pathname.startsWith('/process/')) {
            // 获取图片路径
            const imagePath = url.pathname.replace('/process/', '');
            const width = parseInt(url.searchParams.get('width')) || null;
            const height = parseInt(url.searchParams.get('height')) || null;
            const format = url.searchParams.get('format') || 'webp';
            const quality = parseInt(url.searchParams.get('quality')) || 85;

            // 构建缓存 key
            const cacheKey = `image:${imagePath}:${width || 'auto'}:${height || 'auto'}:${format}:${quality}`;

            // 检查缓存
            const cached = await env.ASSETS.get(cacheKey);
            if (cached) {
                return new Response(cached.body, {
                    headers: {
                        'Content-Type': `image/${format}`,
                        'X-Cache': 'HIT',
                        'Cache-Control': 'public, max-age=31536000'
                    }
                });
            }

            // 获取原始图片
            const originalImage = await env.ASSETS.get(imagePath);
            if (!originalImage) {
                return new Response('Image not found', { status: 404 });
            }

            // 注意：Cloudflare Workers 不支持直接图片处理
            // 这里需要调用 Cloudflare Image Resizing 服务
            // 或者使用 wasm-image-magick 等库

            // 简化示例：直接返回原始图片
            // 实际项目中需要集成图片处理库
            const imageBuffer = await originalImage.arrayBuffer();

            // 缓存处理后的图片
            await env.ASSETS.put(cacheKey, imageBuffer, {
                httpMetadata: {
                    contentType: `image/${format}`
                }
            });

            return new Response(imageBuffer, {
                headers: {
                    'Content-Type': `image/${format}`,
                    'X-Cache': 'MISS',
                    'Cache-Control': 'public, max-age=31536000'
                }
            });
        }

        // 上传图片
        if (url.pathname === '/upload' && request.method === 'POST') {
            const formData = await request.formData();
            const file = formData.get('file');
            const folder = formData.get('folder') || 'uploads';

            if (!file || !(file instanceof File)) {
                return new Response('File required', { status: 400 });
            }

            // 生成唯一文件名
            const ext = file.name.split('.').pop();
            const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

            // 上传到 R2
            await env.ASSETS.put(key, file.stream(), {
                httpMetadata: {
                    contentType: file.type
                }
            });

            return new Response(JSON.stringify({
                success: true,
                key,
                url: `/cdn/${key}`,
                processed: `/process/${key}`
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 列出图片
        if (url.pathname === '/images') {
            const prefix = url.searchParams.get('prefix') || 'uploads/';
            const limit = parseInt(url.searchParams.get('limit')) || 50;

            const result = await env.ASSETS.list({
                prefix,
                limit
            });

            return new Response(JSON.stringify({
                count: result.objects.length,
                images: result.objects.map(obj => ({
                    key: obj.key,
                    size: obj.size,
                    uploaded: obj.uploaded,
                    url: `/cdn/${obj.key}`
                }))
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 提供静态文件
        if (url.pathname.startsWith('/cdn/')) {
            const key = url.pathname.replace('/cdn/', '');

            const object = await env.ASSETS.get(key);
            if (!object) {
                return new Response('Not found', { status: 404 });
            }

            return new Response(object.body, {
                headers: {
                    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
                    'Cache-Control': 'public, max-age=31536000'
                }
            });
        }

        return new Response(`
            <html>
                <head>
                    <title>CDN Image Service</title>
                    <style>
                        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
                        form { margin: 20px 0; }
                        input, select { padding: 8px; margin: 5px; }
                        pre { background: #f4f4f4; padding: 15px; overflow-x: auto; }
                    </style>
                </head>
                <body>
                    <h1>Image CDN Service</h1>

                    <h2>Upload Image</h2>
                    <form action="/upload" method="post" enctype="multipart/form-data">
                        <input type="file" name="file" accept="image/*" required />
                        <input type="text" name="folder" placeholder="Folder (default: uploads)" />
                        <button type="submit">Upload</button>
                    </form>

                    <h2>Image URL Examples</h2>
                    <pre>
/upload - Upload image
/images - List images
/cdn/{key} - View original
/process/{key}?width=800 - Resize
/process/{key}?format=webp - Convert format
/process/{key}?width=800&format=webp&quality=85 - Full processing
                    </pre>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
```

### 5.2 项目：边缘认证中间件

```javascript
// cloudflare-worker/auth-middleware.js
// 边缘 JWT 认证中间件

// 简单的 JWT 验证（实际项目中应该使用 jose 库）
async function verifyJWT(token, secret) {
    // 分离 header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 解码 payload
    const payload = JSON.parse(atob(payloadB64));

    // 检查过期
    if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
    }

    // 实际项目中需要验证签名
    // 这里简化处理
    return payload;
}

// 验证并提取用户信息
async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);

    try {
        const payload = await verifyJWT(token, env.JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 公开路由
        const publicPaths = ['/login', '/register', '/health'];
        if (publicPaths.some(p => url.pathname.startsWith(p))) {
            return fetch(request);
        }

        // 验证认证
        const user = await authenticate(request, env);

        if (!user) {
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                message: 'Valid authentication required'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 将用户信息添加到请求头（传递给上游）
        const headers = new Headers(request.headers);
        headers.set('X-User-Id', user.sub || user.userId || '');
        headers.set('X-User-Email', user.email || '');
        headers.set('X-User-Role', user.role || 'user');

        // 创建新的请求（带用户信息）
        const newRequest = new Request(request, {
            headers
        });

        // 代理到上游
        const upstreamResponse = await fetch(newRequest);

        // 添加用户信息到响应头
        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.set('X-User-Id', user.sub || '');
        responseHeaders.set('X-Authenticated', 'true');

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers: responseHeaders
        });
    }
};
```

## 六、性能优化与监控

### 6.1 CDN 性能指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| TTFB | Time To First Byte，首字节时间 | < 100ms |
| TTLB | Time To Last Byte，末字节时间 | < 500ms |
| 缓存命中率 | Cache Hit Rate | > 95% |
| 边缘延迟 | Edge Latency | < 50ms |
| 源站延迟 | Origin Latency | < 200ms |

### 6.2 性能监控配置

```javascript
// cloudflare-worker/monitoring.js
// 边缘性能监控

// 上报指标到监控系统
async function reportMetrics(metrics, env) {
    // 使用 Cloudflare Analytics API
    // 或发送到外部监控系统

    // 示例：发送到 DataDog
    await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': env.DD_API_KEY
        },
        body: JSON.stringify({
            series: metrics.map(m => ({
                metric: m.name,
                points: [[Date.now() / 1000, m.value]],
                tags: m.tags
            }))
        })
    });
}

export default {
    async fetch(request, env, ctx) {
        const startTime = Date.now();

        // 添加性能监控响应头
        const response = await fetch(request);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // 计算指标
        const metrics = {
            // 响应时间
            responseTime: duration,

            // 缓存状态
            cacheStatus: response.headers.get('CF-Cache-Status') || 'MISS',

            // 边缘位置
            colo: request.cf?.colo,
            country: request.cf?.country
        };

        // 添加到响应头
        const newHeaders = new Headers(response.headers);
        newHeaders.set('X-Response-Time', `${duration}ms`);
        newHeaders.set('X-Cache-Status', metrics.cacheStatus);
        newHeaders.set('X-Edge-Location', metrics.colo || '');

        // 上报指标（异步，不阻塞响应）
        ctx.waitUntil(reportMetrics([
            { name: 'edge.response.time', value: duration, tags: [`colo:${metrics.colo}`] },
            { name: 'edge.cache.hit', value: metrics.cacheStatus === 'HIT' ? 1 : 0, tags: [] }
        ], env));

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });
    }
};
```

## 七、最佳实践

### 7.1 边缘计算最佳实践

1. **最小化冷启动**
   - 保持函数轻量
   - 避免不必要的依赖
   - 使用预热机制

2. **减少数据传输**
   - 压缩响应
   - 只返回必要数据
   - 使用流式处理

3. **合理使用缓存**
   - 设置合适的 TTL
   - 实现缓存失效机制
   - 避免缓存碎片化

4. **安全性**
   - 验证所有输入
   - 使用 HTTPS
   - 实现速率限制

### 7.2 CDN 配置清单

- [ ] 启用 gzip/brotli 压缩
- [ ] 配置合适的缓存策略
- [ ] 设置 CORS 头
- [ ] 启用 HTTP/2
- [ ] 配置 CDN 日志
- [ ] 设置监控和告警
- [ ] 实现缓存失效机制
- [ ] 测试缓存命中率

## 八、总结

边缘计算和 CDN 是现代 Web 架构的重要组成部分，它们能够：

1. **降低延迟**：把内容和服务放到离用户更近的地方
2. **减轻源站压力**：边缘节点承担大部分请求
3. **提高可用性**：分布式架构减少单点故障
4. **优化成本**：减少带宽费用和服务器负载

### 学习路线建议

```
第一阶段：CDN 基础（1周）
├── CDN 工作原理
├── 缓存策略配置
├── 常见 CDN 服务商
└── DNS 解析优化

第二阶段：边缘计算（2周）
├── Edge Runtime 概念
├── Cloudflare Workers
├── Vercel Edge Functions
└── 边缘存储（KV/D1）

第三阶段：高级应用（2周）
├── 边缘数据库集成
├── 认证和授权
├── 图片/媒体处理
└── 监控和日志
```

### 推荐资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Vercel Edge Functions 文档](https://vercel.com/docs/edge-functions)
- [MDN CDN 指南](https://developer.mozilla.org/zh-CN/docs/Glossary/CDN)
- [Web 性能优化指南](https://web.dev/fast/)
