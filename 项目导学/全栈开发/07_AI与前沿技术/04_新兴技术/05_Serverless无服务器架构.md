# Serverless 无服务器架构完全指南

## 前言：什么是 Serverless？

想象一下，你要用电。你需要自己建一个发电厂吗？大多数人的答案是不需要——你只需要接入电网，按需使用，按月付费。

**Serverless（无服务器）** 就是云计算的"电网"：你不需要管理服务器，只需要编写代码，然后按代码执行时间或请求次数付费。

### Serverless vs 传统服务器

```
传统服务器：
├── 租用/购买物理服务器
├── 安装操作系统
├── 配置运行环境
├── 部署应用代码
├── 监控和维护
└── 扩展需要手动操作

Serverless：
├── 编写函数代码
├── 上传到云平台
├── 配置触发器
└── 自动扩展，按需收费
```

## 一、Serverless 核心概念

### 1.1 Function as a Service (FaaS)

FaaS 是 Serverless 的核心，让你可以运行函数而无需管理服务器。

| 平台 | 服务 | 语言支持 |
|------|------|----------|
| AWS | Lambda | Node.js, Python, Go, Java, Ruby, .NET |
| Vercel | Functions | JavaScript, TypeScript |
| Netlify | Functions | JavaScript, Go |
| Cloudflare | Workers | JavaScript, Rust, C++ (WASM) |
| Google | Cloud Functions | Node.js, Python, Go, Java |
| Azure | Azure Functions | C#, JavaScript, Python, Java |

### 1.2 Backend as a Service (BaaS)

BaaS 提供完整的后端服务，如数据库、认证、存储等。

| 服务类型 | AWS | Google Cloud | Azure | 其他 |
|----------|-----|---------------|-------|------|
| 数据库 | DynamoDB, Aurora | Firestore, Cloud SQL | Cosmos DB, SQL | Supabase, PlanetScale |
| 认证 | Cognito | Firebase Auth | AD B2C | Auth0, Clerk |
| 存储 | S3 | Cloud Storage | Blob Storage | R2, Cloudflare |
| 缓存 | ElastiCache | Memorystore | Cache | Upstash, Redis Cloud |
| 消息队列 | SQS, SNS | Pub/Sub | Service Bus | Kafka, RabbitMQ |

### 1.3 冷启动与热启动

Serverless 函数在空闲一段时间后会"休眠"，再次调用时需要"唤醒"——这就是冷启动。

```python
# Python Lambda 函数示例
import json
import time

# 全局变量（冷启动时初始化）
def initialize():
    """模拟耗时的初始化操作"""
    # 加载模型
    # 建立连接
    # 读取配置
    print("初始化完成（这只在冷启动时执行）")
    return True

initialized = initialize()

def lambda_handler(event, context):
    """
    Lambda 处理函数
    event: 触发事件
    context: 运行环境信息
    """
    global initialized

    # 检查是否已初始化（热启动）
    if not initialized:
        initialized = initialize()

    # 处理请求
    start = time.time()

    result = {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'cold_start': context.aws_request_id is None,  # 判断是否冷启动
            'processing_time': time.time() - start
        })
    }

    return result
```

**冷启动时间对比（示例）：**

| 语言 | 冷启动时间 | 热启动时间 |
|------|-----------|-----------|
| Node.js | 50-200ms | < 10ms |
| Python | 100-500ms | < 10ms |
| Go | 5-50ms | < 5ms |
| Java | 1-5s | < 100ms |
| Rust | 5-50ms | < 5ms |

## 二、Vercel Functions 深度解析

### 2.1 Vercel Functions 概述

Vercel Functions 是 Vercel 平台的核心功能，与 Next.js 深度集成，支持 SSR、API Routes 和 Edge Functions。

**Vercel Functions 类型：**

| 类型 | 运行环境 | 特点 |
|------|----------|------|
| Serverless Functions | Node.js | 标准 Lambda 风格 |
| Edge Functions | V8（边缘） | 全球分布，超低延迟 |
| Image Optimization | 托管服务 | 自动优化图片 |

### 2.2 Serverless Functions

```typescript
// pages/api/users.ts
// 标准 Serverless Function

import type { NextApiRequest, NextApiResponse } from 'next';

// 定义数据类型
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
}

// 模拟数据库
const users: User[] = [
    { id: 1, name: '张三', email: 'zhang@example.com', role: 'admin' },
    { id: 2, name: '李四', email: 'li@example.com', role: 'user' },
    { id: 3, name: '王五', email: 'wang@example.com', role: 'user' },
    { id: 4, name: '赵六', email: 'zhao@example.com', role: 'guest' },
];

// 限制 API 请求方法
export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<User[] | { error: string }>
) {
    // 获取请求方法
    const { method } = req;

    // 处理不同的 HTTP 方法
    switch (method) {
        case 'GET':
            // 获取所有用户或单个用户
            const { id } = req.query;

            if (id) {
                const user = users.find(u => u.id === Number(id));
                if (!user) {
                    return res.status(404).json({ error: '用户不存在' });
                }
                return res.status(200).json(user);
            }

            // 支持过滤
            const { role } = req.query;
            let filteredUsers = users;

            if (role && ['admin', 'user', 'guest'].includes(role as string)) {
                filteredUsers = users.filter(u => u.role === role);
            }

            return res.status(200).json(filteredUsers);

        case 'POST':
            // 创建新用户
            const { name, email, userRole = 'user' } = req.body;

            if (!name || !email) {
                return res.status(400).json({ error: '姓名和邮箱是必填的' });
            }

            const newUser: User = {
                id: users.length + 1,
                name,
                email,
                role: userRole as 'admin' | 'user' | 'guest'
            };

            users.push(newUser);

            return res.status(201).json(newUser);

        case 'PUT':
            // 更新用户
            const updateId = Number(req.query.id);

            if (!updateId) {
                return res.status(400).json({ error: '用户ID是必填的' });
            }

            const userIndex = users.findIndex(u => u.id === updateId);

            if (userIndex === -1) {
                return res.status(404).json({ error: '用户不存在' });
            }

            // 更新用户信息
            const { name: newName, email: newEmail, userRole: newRole } = req.body;
            users[userIndex] = {
                ...users[userIndex],
                ...(newName && { name: newName }),
                ...(newEmail && { email: newEmail }),
                ...(newRole && { role: newRole as 'admin' | 'user' | 'guest' })
            };

            return res.status(200).json(users[userIndex]);

        case 'DELETE':
            // 删除用户
            const deleteId = Number(req.query.id);

            if (!deleteId) {
                return res.status(400).json({ error: '用户ID是必填的' });
            }

            const deleteIndex = users.findIndex(u => u.id === deleteId);

            if (deleteIndex === -1) {
                return res.status(404).json({ error: '用户不存在' });
            }

            const deletedUser = users.splice(deleteIndex, 1)[0];

            return res.status(200).json(deletedUser);

        default:
            // 不支持的方法
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).json({ error: `不支持 ${method} 方法` });
    }
}

// 配置函数限制
export const config = {
    api: {
        // 禁用 body 解析（如果需要原始 body）
        bodyParser: true,
        // 配置文件上传大小限制
        sizeLimit: '1mb'
    }
};
```

### 2.3 Edge Functions

Edge Functions 运行在全球分布的边缘节点上，延迟极低（通常 < 50ms）。

```typescript
// pages/api/geo.ts
// Edge Function 示例

import type { NextRequest } from 'next/server';

// Edge Functions 使用边缘运行时
export const runtime = 'edge';

// 导出默认异步函数
export default async function handler(req: NextRequest) {
    // 获取地理位置信息（Vercel 自动注入）
    const country = req.geo?.country;
    const city = req.geo?.city;
    const region = req.geo?.region;
    const latitude = req.geo?.latitude;
    const longitude = req.geo?.longitude;

    // 根据用户地区返回不同内容
    const locale = country === 'CN' ? 'zh-CN' :
                    country === 'JP' ? 'ja-JP' :
                    country === 'KR' ? 'ko-KR' : 'en-US';

    // 构建响应
    const response = {
        message: 'Hello from the Edge!',
        location: {
            country,
            city,
            region,
            latitude,
            longitude,
            locale
        },
        timestamp: new Date().toISOString(),
        // 显示使用的是边缘运行时
        runtime: 'edge'
    };

    // 返回 JSON 响应
    return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            // 设置缓存（边缘节点缓存）
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
    });
}

// Edge Functions 不支持 Node.js 特定的 API
// 不能使用：fs, path, Buffer（在边缘运行时）
// 只能使用：Web API（fetch, Request, Response 等）
```

### 2.4 流式响应

```typescript
// pages/api/stream.ts
// Server-Sent Events (SSE) 示例

import type { NextApiRequest, NextApiResponse } from 'next';

// 禁用默认的 body 解析，因为我们需要流式传输
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 刷新响应头
    res.flushHeaders();

    // 模拟数据流（每秒钟发送一条消息）
    let count = 0;
    const interval = setInterval(() => {
        count++;

        // 发送 SSE 格式的数据
        const data = {
            id: count,
            message: `消息 #${count}`,
            timestamp: new Date().toISOString(),
            random: Math.random()
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);

        // 10 秒后结束
        if (count >= 10) {
            clearInterval(interval);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }, 1000);

    // 如果客户端断开连接
    req.on('close', () => {
        clearInterval(interval);
    });
}
```

## 三、AWS Lambda 实战

### 3.1 Lambda 函数结构

```python
# lambda_function.py
# AWS Lambda Python 函数

import json
import os
from typing import Dict, Any, Optional

# ============ 全局初始化（冷启动时执行）============
# 在这里初始化重型组件（如数据库连接、ML 模型等）
# 这些在函数调用之间会被保留（热启动时复用）

# 获取环境变量
DATABASE_URL = os.environ.get('DATABASE_URL')
S3_BUCKET = os.environ.get('S3_BUCKET')

# 初始化数据库连接（示例）
# db_connection = create_db_connection(DATABASE_URL)  # 冷启动时执行一次

# ============ Lambda 处理函数 ============

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda 函数入口

    参数:
        event: 触发事件（API Gateway、S3、DynamoDB 等）
        context: 运行时信息（请求 ID、超时时间等）

    返回:
        API Gateway 响应格式
    """
    # 记录请求
    request_id = context.aws_request_id
    function_name = context.function_name
    remaining_time = context.get_remaining_time_in_millis()

    print(f"请求ID: {request_id}")
    print(f"函数名: {function_name}")
    print(f"剩余时间: {remaining_time}ms")
    print(f"事件: {json.dumps(event)}")

    try:
        # 根据触发源处理不同类型的请求
        source = event.get('source', 'unknown')

        if source == 'api_gateway':
            return handle_api_gateway(event)
        elif source == 's3':
            return handle_s3_event(event)
        elif source == 'dynamodb':
            return handle_dynamodb_event(event)
        elif source == 'schedule':
            return handle_scheduled_event(event)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'未知事件源: {source}'})
            }

    except Exception as e:
        print(f"错误: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': '内部服务器错误'})
        }


def handle_api_gateway(event: Dict[str, Any]) -> Dict[str, Any]:
    """处理 API Gateway 请求"""
    # 获取 HTTP 方法和路径
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # 获取查询参数
    query_params = event.get('queryStringParameters', {}) or {}

    # 获取请求体
    body = event.get('body', '')

    # CORS 头
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

    # 路由处理
    if path == '/users' and http_method == 'GET':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(get_users(query_params))
        }

    elif path == '/users' and http_method == 'POST':
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(create_user(json.loads(body) if body else {}))
        }

    elif path.startswith('/users/') and http_method == 'GET':
        user_id = path.split('/')[-1]
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(get_user(user_id))
        }

    elif path == '/health':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'status': 'healthy',
                'service': 'lambda-api'
            })
        }

    else:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': '未找到'})
        }


def handle_s3_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """处理 S3 事件（如文件上传）"""
    records = event.get('Records', [])

    processed = []
    for record in records:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']

        print(f"处理文件: s3://{bucket}/{key} ({size} bytes)")

        # 在这里处理文件，如：
        # - 图片压缩
        # - 视频转码
        # - 生成缩略图

        processed.append({
            'bucket': bucket,
            'key': key,
            'size': size,
            'status': 'processed'
        })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed_count': len(processed),
            'items': processed
        })
    }


def handle_dynamodb_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """处理 DynamoDB 流事件"""
    records = event.get('Records', [])

    for record in records:
        event_name = record['eventName']  # INSERT, MODIFY, REMOVE
        table_name = record['eventSourceARN'].split('/')[-1]

        if event_name in ['INSERT', 'MODIFY']:
            new_image = record['dynamodb']['NewImage']
            print(f"{event_name} on {table_name}: {new_image}")
        elif event_name == 'REMOVE':
            old_image = record['dynamodb']['OldImage']
            print(f"REMOVE on {table_name}: {old_image}")

    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(records)})
    }


def handle_scheduled_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """处理定时事件（CloudWatch Events）"""
    print(f"定时任务执行: {event}")

    # 执行定时任务，如：
    # - 数据库清理
    # - 生成报表
    # - 发送邮件

    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'completed'})
    }


# ============ 辅助函数 ============

def get_users(params: Dict[str, Any]) -> Dict[str, Any]:
    """获取用户列表"""
    # 模拟数据库查询
    users = [
        {'id': 1, 'name': '张三', 'email': 'zhang@example.com'},
        {'id': 2, 'name': '李四', 'email': 'li@example.com'},
        {'id': 3, 'name': '王五', 'email': 'wang@example.com'},
    ]

    # 过滤
    role = params.get('role')
    if role:
        users = [u for u in users if u.get('role') == role]

    return {'users': users, 'count': len(users)}


def get_user(user_id: str) -> Dict[str, Any]:
    """获取单个用户"""
    users = {
        '1': {'id': 1, 'name': '张三', 'email': 'zhang@example.com'},
        '2': {'id': 2, 'name': '李四', 'email': 'li@example.com'},
        '3': {'id': 3, 'name': '王五', 'email': 'wang@example.com'},
    }

    user = users.get(user_id)
    if not user:
        return {'error': '用户不存在'}

    return user


def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """创建用户"""
    name = data.get('name')
    email = data.get('email')

    if not name or not email:
        return {'error': '姓名和邮箱是必填的'}

    # 模拟创建
    return {
        'id': 999,  # 模拟生成的 ID
        'name': name,
        'email': email,
        'created': True
    }
```

### 3.2 Lambda Layer

Lambda Layer 允许你共享代码和依赖，在多个函数之间复用。

```bash
# 目录结构
my-lambda-layers/
├── nodejs/
│   └── node_modules/
│       ├── axios/       # HTTP 客户端
│       ├── lodash/      # 工具库
│       └── utils.js     # 共享工具函数
└── python/
    ├── pandas/          # 数据处理
    ├── numpy/           # 数值计算
    └── utils.py         # 共享工具函数

# 使用 Python Layer
# layer-utils.zip 内容：
# python/
#   └── utils.py

# utils.py 内容
def format_response(data, status_code=200):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }

def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
```

### 3.3 Lambda 与 API Gateway 集成

```yaml
# serverless.yml - Serverless Framework 配置
# 使用 Serverless Framework 部署 Lambda + API Gateway

service: my-serverless-api
frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  # 环境变量
  environment:
    DATABASE_URL: ${self:custom.dbUrl.${self:provider.stage}}
    LOG_LEVEL: ${self:custom.logLevel.${self:provider.stage}}
  # IAM 角色权限
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource: 'arn:aws:s3:::${self:custom.bucket}'
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
          Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:custom.table}'

custom:
  # 根据环境配置不同值
  dbUrl:
    dev: 'postgres://localhost:5432/mydb_dev'
    prod: 'postgres://prod-db:5432/mydb_prod'
  logLevel:
    dev: 'debug'
    prod: 'error'
  bucket: my-app-bucket-${self:provider.stage}
  table: users-${self:provider.stage}

functions:
  # 用户相关 API
  getUsers:
    handler: handlers/users.getUsers
    events:
      - http:
          path: /users
          method: get
          cors: true

  getUser:
    handler: handlers/users.getUser
    memorySize: 256
    timeout: 10
    events:
      - http:
          path: /users/{id}
          method: get
          cors: true

  createUser:
    handler: handlers/users.createUser
    memorySize: 512
    timeout: 30
    events:
      - http:
          path: /users
          method: post
          cors: true

  # S3 触发器
  processUpload:
    handler: handlers/s3.processUpload
    events:
      - s3:
          bucket: ${self:custom.bucket}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
          existing: true

  # 定时任务（每天凌晨执行）
  dailyCleanup:
    handler: handlers/maintenance.dailyCleanup
    events:
      - schedule: cron(0 0 * * *)  # 每天 00:00 UTC
```

## 四、冷启动优化与性能调优

### 4.1 冷启动问题分析

冷启动延迟会影响用户体验，特别是对延迟敏感的应用。

**冷启动的组成：**

```
冷启动总时间 = 加载时间 + 初始化时间 + 执行时间

加载时间：下载和解压函数代码
         ↓
初始化时间：启动运行时、加载依赖、执行全局代码
            ↓
执行时间：执行业务逻辑
```

### 4.2 优化策略

**1. 减少代码包大小**

```python
# ❌ 包含大型依赖（增加冷启动）
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# ✅ 按需导入（减少包大小）
from some_lib import specific_function
```

**2. 懒加载重型依赖**

```python
# ❌ 在全局加载（每次冷启动都加载）
import heavy_ml_model
model = heavy_ml_model.load()

def lambda_handler(event, context):
    result = model.predict(event['data'])
    return result

# ✅ 延迟加载（只在需要时才加载）
_model = None

def get_model():
    global _model
    if _model is None:
        import heavy_ml_model
        _model = heavy_ml_model.load()
    return _model

def lambda_handler(event, context):
    model = get_model()  # 首次调用时加载
    result = model.predict(event['data'])
    return result
```

**3. 使用连接池复用**

```python
# ❌ 每次调用创建新连接
import pymysql

def lambda_handler(event, context):
    conn = pymysql.connect(
        host=os.environ['DB_HOST'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        database=os.environ['DB_NAME']
    )
    # 使用连接
    conn.close()

# ✅ 复用连接（热启动时复用）
import pymysql

_connection = None

def get_connection():
    global _connection
    if _connection is None or not _connection.open:
        _connection = pymysql.connect(
            host=os.environ['DB_HOST'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD'],
            database=os.environ['DB_NAME']
        )
    return _connection

def lambda_handler(event, context):
    conn = get_connection()
    # 使用连接（不关闭！）
```

**4. 预配置内存和超时**

```yaml
# serverless.yml - 优化资源配置

functions:
  criticalApi:
    handler: handler.critical
    memorySize: 512      # 内存越大，冷启动越快（更多 CPU）
    timeout: 30          # 足够的超时时间
    ephemeralStorage: 1024  # 临时存储（无限制）

  backgroundTask:
    handler: handler.background
    memorySize: 128      # 后台任务不需要高内存
    timeout: 300          # 长时间运行
```

### 4.3 预配置并发（Provisioned Concurrency）

对于需要稳定延迟的应用，可以启用预配置并发：

```yaml
# serverless.yml - 启用预配置并发

functions:
  api:
    handler: handler.api
    # 预配置并发（始终保持 5 个实例运行）
    provisionedConcurrency: 5
    # 自动扩展
    scaling:
      # 最小实例数
      minConcurrency: 5
      # 最大实例数
      maxConcurrency: 100
      # 目标并发数
      targetConcurrency: 50
```

**AWS CLI 命令：**

```bash
# 为 Lambda 函数配置预配置并发
aws lambda put-provisioned-concurrency-config \
    --function-name my-function \
    --qualifier 1 \
    --provisioned-concurrent-executions 10

# 查看配置状态
aws lambda get-provisioned-concurrency-config \
    --function-name my-function \
    --qualifier 1
```

## 五、Serverless 数据库集成

### 5.1 连接池管理

Serverless 环境中的数据库连接需要特别管理：

```typescript
// lib/database.ts
// Serverless 环境下的数据库连接池管理

import { Pool } from 'pg';

// 全局变量用于缓存连接池（跨 Lambda 调用复用）
let pool: Pool | null = null;

// 获取或创建连接池
function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            // 从环境变量读取配置
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            // 最大连接数（Serverless 中应该较小）
            max: 10,
            // 空闲超时
            idleTimeoutMillis: 30000,
            // 连接超时
            connectionTimeoutMillis: 2000,
        });

        // 错误处理
        pool.on('error', (err) => {
            console.error('Unexpected database error:', err);
        });
    }
    return pool;
}

// 查询函数
async function query<T>(text: string, params?: any[]): Promise<T[]> {
    const pool = getPool();
    const start = Date.now();

    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        console.log('查询执行', { text, duration, rows: result.rowCount });

        return result.rows as T[];
    } catch (error) {
        console.error('查询错误:', error);
        throw error;
    }
}

// 事务支持
async function transaction<T>(
    callback: (client: any) => Promise<T>
): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();  // 释放回连接池
    }
}

// 关闭连接池（应用关闭时调用）
async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

export { query, transaction, closePool, getPool };
```

### 5.2 PlanetScale（Serverless MySQL）

PlanetScale 是一个为 Serverless 优化的 MySQL 兼容数据库：

```typescript
// lib/planetscale.ts
// PlanetScale 数据库客户端

import { Client } from '@planetscale/database';

// 创建全局客户端（跨调用复用）
let db: Client | null = null;

function getDb(): Client {
    if (!db) {
        db = new Client({
            url: process.env.DATABASE_URL,
        });
    }
    return db;
}

// 用户相关操作
interface User {
    id: number;
    name: string;
    email: string;
    created_at: Date;
}

async function getUsers(limit = 10): Promise<User[]> {
    const db = getDb();

    const results = await db.execute(
        'SELECT id, name, email, created_at FROM users LIMIT ?',
        [limit]
    );

    return results.rows as User[];
}

async function getUser(id: number): Promise<User | null> {
    const db = getDb();

    const results = await db.execute(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [id]
    );

    return results.rows[0] as User | null;
}

async function createUser(
    name: string,
    email: string
): Promise<{ id: number }> {
    const db = getDb();

    const result = await db.execute(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [name, email]
    );

    return { id: result.insertId };
}

async function updateUser(
    id: number,
    data: Partial<Pick<User, 'name' | 'email'>>
): Promise<void> {
    const db = getDb();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }

    if (data.email !== undefined) {
        updates.push('email = ?');
        values.push(data.email);
    }

    if (updates.length === 0) return;

    values.push(id);

    await db.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
    );
}

async function deleteUser(id: number): Promise<void> {
    const db = getDb();
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
}

export {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
};
```

### 5.3 Upstash Redis（Serverless 缓存）

Upstash 是专为 Serverless 设计的 Redis，提供 HTTP API：

```typescript
// lib/upstash.ts
// Upstash Redis 客户端

import { Redis } from '@upstash/redis';

// 创建全局 Redis 客户端
let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }
    return redis;
}

// ============ 基本操作 ============

// 设置值（带过期时间）
async function setWithExpiry(
    key: string,
    value: any,
    expireInSeconds: number = 3600
): Promise<void> {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), { ex: expireInSeconds });
}

// 获取值
async function get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    const value = await redis.get(key);

    if (!value) return null;

    try {
        return JSON.parse(value as string) as T;
    } catch {
        return value as T;
    }
}

// 删除
async function del(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(key);
}

// ============ 计数器 ============

async function incr(key: string): Promise<number> {
    const redis = getRedis();
    return await redis.incr(key);
}

async function decr(key: string): Promise<number> {
    const redis = getRedis();
    return await redis.decr(key);
}

// ============ 限流 ============

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;
}

async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const redis = getRedis();
    const current = await redis.incr(key);

    if (current === 1) {
        // 第一次请求，设置过期时间
        await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        reset: Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000)
    };
}

// ============ 缓存模式（Cache-Aside）============

async function getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expireInSeconds: number = 3600
): Promise<T> {
    const cached = await get<T>(key);

    if (cached !== null) {
        return cached;
    }

    const fresh = await fetchFn();
    await setWithExpiry(key, fresh, expireInSeconds);

    return fresh;
}

// ============ 分布式锁 ============

async function acquireLock(
    key: string,
    ttlSeconds: number = 30
): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.set(key, 'locked', { nx: true, ex: ttlSeconds });
    return result === 'OK';
}

async function releaseLock(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(key);
}

export {
    setWithExpiry,
    get,
    del,
    incr,
    decr,
    rateLimit,
    getOrSet,
    acquireLock,
    releaseLock
};
```

## 六、监控与调试

### 6.1 结构化日志

```typescript
// lib/logger.ts
// Serverless 友好的结构化日志

enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

interface LogContext {
    [key: string]: any;
}

class Logger {
    private context: LogContext;
    private functionName: string;
    private requestId: string;

    constructor(functionName: string, requestId: string = '') {
        this.functionName = functionName;
        this.requestId = requestId;
        this.context = {};
    }

    // 添加上下文信息
    withContext(ctx: LogContext): Logger {
        const logger = new Logger(this.functionName, this.requestId);
        logger.context = { ...this.context, ...ctx };
        return logger;
    }

    // 格式化日志
    private format(level: LogLevel, message: string, data?: any): string {
        const log = {
            timestamp: new Date().toISOString(),
            level,
            function: this.functionName,
            requestId: this.requestId,
            message,
            ...this.context,
            ...(data && { data })
        };

        return JSON.stringify(log);
    }

    debug(message: string, data?: any) {
        console.log(this.format(LogLevel.DEBUG, message, data));
    }

    info(message: string, data?: any) {
        console.log(this.format(LogLevel.INFO, message, data));
    }

    warn(message: string, data?: any) {
        console.warn(this.format(LogLevel.WARN, message, data));
    }

    error(message: string, error?: any) {
        console.error(this.format(LogLevel.ERROR, message, {
            error: error?.message || error,
            stack: error?.stack
        }));
    }
}

// 创建日志实例
function createLogger(functionName: string, requestId?: string): Logger {
    return new Logger(functionName, requestId);
}

export { createLogger, Logger };
```

### 6.2 Lambda 监控配置

```yaml
# serverless.yml - 监控配置

service: my-api

provider:
  name: aws
  runtime: nodejs18.x

# CloudWatch 监控
functions:
  api:
    handler: handler.api
    # 详细日志
    loggingConfig:
      level: DEBUG
      includeColors: false
    # 订阅 CloudWatch Logs
    events:
      - cloudwatchLog:
          logGroup: /aws/lambda/${self:provider.stage}-api
          filter: ERROR

# 自定义插件配置
plugins:
  - serverless-plugin-aws-alerts

custom:
  alerts:
    stages:
      - production
    patterns:
      - ERROR
      - CRITICAL
    topics:
      alarm:
        notification: arn:aws:sns:region:account:alerts-topic
    dashboards: true
```

## 七、最佳实践与架构模式

### 7.1 Serverless 架构原则

1. **函数单一职责**
   - 每个函数只做一件事
   - 便于测试和维护

2. **无状态设计**
   - 函数不依赖本地状态
   - 使用外部存储（Redis、DynamoDB）管理状态

3. **超时设置**
   - 根据实际执行时间设置
   - 避免无限等待

4. **错误处理**
   - 实现重试机制
   - 使用死信队列处理失败消息

### 7.2 常见架构模式

**1. API 代理模式**

```
Client → API Gateway → Lambda → DynamoDB
                    ↓
              S3 (静态资源)
```

**2. 事件驱动模式**

```
S3 Upload → Lambda → SNS → Lambda → DynamoDB
                              ↓
                         Elasticsearch
```

**3. CRUD 操作模式**

```
API Gateway → Lambda → ORM → Database
                    ↓
              DynamoDB
```

### 7.3 成本优化

| 策略 | 说明 | 节省比例 |
|------|------|----------|
| 缩短执行时间 | 优化代码减少执行时间 | ~50% |
| 选择合适内存 | 根据实际需求配置内存 | ~30% |
| 使用 Edge Functions | 减少数据传输成本 | ~20% |
| 批量处理 | 合并小请求 | ~40% |
| 预配置并发 | 避免冷启动 | 根据场景 |

## 八、总结

Serverless 架构是现代云原生应用的重要组成部分，它提供了：

1. **零服务器管理**：无需运维
2. **自动扩展**：按需扩展
3. **按使用付费**：成本优化
4. **快速部署**：提高效率

### 学习路线建议

```
第一阶段：基础入门（1周）
├── 了解 FaaS 概念
├── Lambda/Cloudflare Workers 入门
├── 编写第一个 Serverless 函数
└── 了解触发器和事件

第二阶段：数据库集成（1-2周）
├── Serverless 数据库选型
├── 连接池管理
├── 缓存策略
└── 数据安全

第三阶段：高级主题（2-3周）
├── 冷启动优化
├── 分布式系统模式
├── 监控和调试
└── CI/CD 部署

第四阶段：架构设计（2-3周）
├── 微服务拆分
├── 事件驱动架构
├── 安全最佳实践
└── 成本优化策略
```

### 推荐资源

- [AWS Lambda 文档](https://docs.aws.amazon.com/lambda/)
- [Vercel Functions 文档](https://vercel.com/docs/functions)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Serverless Framework 文档](https://www.serverless.com/framework/docs/)
- [Martin Fowler Serverless 指南](https://martinfowler.com/articles/serverless.html)
