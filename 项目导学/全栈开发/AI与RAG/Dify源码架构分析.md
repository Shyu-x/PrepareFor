# Dify 源码架构分析

## 项目概览

| 属性 | 值 |
|------|-----|
| **仓库名称** | dify |
| **星标数** | 133,933 |
| **URL** | https://github.com/langgenius/dify |
| **描述** | Production-ready platform for agentic workflow development |

### 主要编程语言

| 语言 | 代码量 |
|------|--------|
| Python | 23.2 MB |
| TypeScript | 26.4 MB |
| JavaScript | 1.6 MB |
| Shell | 67.9 KB |
| CSS | 189 KB |
| HTML | 158 KB |

---

## 目录结构

```
dify/
├── api/                 # Python 后端 API
├── web/                 # Next.js 前端
├── sdks/                # 多语言客户端 SDK
│   ├── nodejs-client/
│   └── php-client/
├── docker/              # Docker 部署配置
├── docs/                 # 多语言文档
└── scripts/             # 脚本工具
```

---

## 核心模块架构

### 1. API 后端模块 (`api/`)

#### 1.1 核心目录结构

```
api/
├── app.py               # 应用入口
├── app_factory.py       # 应用工厂
├── commands/            # CLI 命令
├── configs/             # 配置文件
├── core/                # 核心模块 ★
├── services/            # 业务服务层 ★
├── models/              # 数据模型
├── controllers/         # 控制器层
├── repositories/        # 数据仓库层
├── tasks/               # 异步任务
└── migrations/          # 数据库迁移
```

#### 1.2 核心模块详解

**core/ 目录结构：**

```
core/
├── agent/              # Agent 执行器
│   ├── base_agent_runner.py
│   ├── cot_agent_runner.py      # CoT 思维链 Agent
│   ├── cot_chat_agent_runner.py
│   ├── cot_completion_agent_runner.py
│   ├── fc_agent_runner.py       # Function Calling Agent
│   ├── prompt/                  # Agent 提示词模板
│   └── strategy/                # Agent 策略
│
├── app/                # 应用核心
│   ├── app_config/     # 应用配置
│   ├── apps/           # 应用类型（chat/completion/agent）
│   ├── task_pipeline/  # 任务管道
│   └── workflow/       # 工作流
│
├── rag/                # RAG 检索增强生成 ★
│   ├── retrieval/      # 检索模块
│   │   ├── dataset_retrieval.py  # 数据集检索
│   │   ├── retrieval_methods.py  # 检索方法
│   │   └── router/               # 检索路由
│   ├── embedding/      # 向量化
│   ├── rerank/         # 重排序
│   ├── splitter/       # 文档分块
│   ├── extractor/      # 内容抽取
│   ├── cleaner/        # 文档清洗
│   ├── pipeline/       # RAG 管道
│   └── docstore/       # 文档存储
│
├── workflow/          # 工作流引擎 ★
│   ├── node_factory.py # 节点工厂
│   ├── nodes/         # 节点实现
│   │   ├── agent/             # Agent 节点
│   │   ├── knowledge_retrieval/# 知识检索节点
│   │   ├── datasource/        # 数据源节点
│   │   ├── trigger_plugin/    # 插件触发节点
│   │   └── ...
│   └── workflow_entry.py
│
├── llm_generator/     # LLM 生成器
├── model_manager/     # 模型管理器
├── memory/           # 记忆模块
├── tools/           # 工具集
├── datasource/      # 数据源
├── indexing_runner/ # 索引运行器
└── ...
```

**services/ 目录结构（主要服务）：**

```
services/
├── app_service.py              # 应用服务
├── app_dsl_service.py          # 应用 DSL 服务
├── app_model_config_service.py # 应用模型配置
├── app_generate_service.py     # 应用生成服务
├── app_task_service.py         # 应用任务服务
│
├── agent_service.py           # Agent 服务
├── dataset_service.py         # 数据集服务
├── document_indexing_proxy/   # 文档索引代理
├── vector_service.py          # 向量服务
│
├── workflow_service.py        # 工作流服务
├── workflow_app_service.py    # 工作流应用服务
├── async_workflow_service.py  # 异步工作流服务
├── workflow_run_service.py    # 工作流运行服务
│
├── conversation_service.py    # 对话服务
├── message_service.py         # 消息服务
├── account_service.py        # 账户服务
├── api_token_service.py      # API Token 服务
│
└── ...（共 80+ 个服务文件）
```

---

### 2. RAG 模块深度解析

#### 2.1 RAG 检索流程

```
用户查询
    ↓
Query Rewrite（查询重写）
    ↓
Embedding（向量化）
    ↓
Vector Retrieval（向量检索）
    ↓
Rerank（重排序）
    ↓
Retrieval Results（检索结果）
    ↓
Context Integration（上下文整合）
    ↓
LLM Generation（LLM 生成）
```

#### 2.2 核心文件

| 文件 | 功能 |
|------|------|
| `core/rag/retrieval/dataset_retrieval.py` | 数据集检索实现 |
| `core/rag/retrieval/retrieval_methods.py` | 多种检索方法 |
| `core/rag/embedding/` | 向量化处理 |
| `core/rag/rerank/` | 重排序模块 |
| `core/rag/splitter/` | 文档分块策略 |
| `core/rag/pipeline/` | RAG 处理管道 |

---

### 3. Agent 模块深度解析

#### 3.1 Agent 类型

| Agent 类型 | 文件 | 说明 |
|------------|------|------|
| **CoT Agent** | `cot_agent_runner.py` | 思维链 Agent |
| **CoT Chat Agent** | `cot_chat_agent_runner.py` | 思维链对话 Agent |
| **CoT Completion Agent** | `cot_completion_agent_runner.py` | 思维链补全 Agent |
| **FC Agent** | `fc_agent_runner.py` | 函数调用 Agent |

#### 3.2 Agent 策略

```
core/agent/strategy/
├── base.py
├── plugin.py
└── ...
```

#### 3.3 Agent 执行流程

```
用户输入
    ↓
意图识别 (Intent Detection)
    ↓
策略选择 (Strategy Selection)
    ↓
Tool Selection（工具选择）
    ↓
LLM Reasoning（LLM 推理）
    ↓
Action Execution（动作执行）
    ↓
Response Generation（响应生成）
```

---

### 4. Workflow 工作流引擎

#### 4.1 工作流节点类型

```
core/workflow/nodes/
├── agent/             # Agent 节点
├── knowledge_retrieval/# 知识检索节点
├── datasource/        # 数据源节点
├── knowledge_index/   # 知识索引节点
├── trigger_plugin/    # 插件触发节点
├── trigger_schedule/  # 定时触发节点
├── trigger_webhook/   # Webhook 触发节点
└── ...
```

#### 4.2 工作流执行流程

```
Workflow Start
    ↓
Node 1 (开始节点)
    ↓
Node 2 (执行节点)
    ↓
┌── Node 3a (条件分支 A)
│       ↓
│   Node 4
│       ↓
└── Node 3b (条件分支 B)
        ↓
    Node 5
        ↓
Workflow End
```

---

### 5. Web 前端模块 (`web/`)

#### 5.1 技术栈

- **框架**: Next.js (App Router)
- **语言**: TypeScript
- **包管理**: pnpm
- **开发工具**: vinext (Vite+)

#### 5.2 目录结构

```
web/
├── app/                # Next.js App Router
│   ├── (commonLayout)/ # 通用布局
│   ├── (shareLayout)/  # 分享布局
│   ├── account/         # 账户页面
│   ├── signin/          # 登录
│   ├── signup/          # 注册
│   ├── install/         # 安装向导
│   └── ...
├── components/          # React 组件
├── public/             # 静态资源
└── package.json
```

---

### 6. SDK 客户端 (`sdks/`)

```
sdks/
├── nodejs-client/   # Node.js/JavaScript 客户端
└── php-client/      # PHP 客户端
```

---

## 部署架构

### Docker 部署

```
docker/
├── docker-compose.yaml           # 主部署配置
├── docker-compose.middleware.yaml # 中间件配置
├── docker-compose-template.yaml  # 模板配置
├── nginx/                        # Nginx 配置
├── certbot/                      # SSL 证书
├── postgres/                     # PostgreSQL 配置
├── pgvector/                     # 向量数据库
├── weaviate/                     # Weaviate 向量库
├── elasticsearch/                # ES 配置
└── ...
```

### 中间件依赖

| 中间件 | 用途 |
|--------|------|
| PostgreSQL | 主数据库 |
| Redis | 缓存/会话 |
| Weaviate/PgVector | 向量存储 |
| Nginx | 反向代理 |
| Celery | 异步任务 |

---

## 开发环境启动

```bash
# 1. 环境设置
./dev/setup

# 2. 启动中间件
./dev/start-docker-compose

# 3. 启动后端
./dev/start-api

# 4. 启动前端
./dev/start-web

# 5. 启动 Worker
./dev/start-worker

# 6. 启动定时任务（可选）
./dev/start-beat
```

---

## 技术栈总结

### 后端 (API)

| 技术 | 说明 |
|------|------|
| Python | 主语言 |
| FastAPI | Web 框架 |
| Celery | 异步任务 |
| SQLAlchemy | ORM |
| PostgreSQL | 关系数据库 |
| Redis | 缓存 |
| Weaviate/PgVector | 向量数据库 |

### 前端 (Web)

| 技术 | 说明 |
|------|------|
| Next.js | React 框架 |
| TypeScript | 类型安全 |
| pnpm | 包管理 |
| Ant Design | UI 组件库 |

---

## 关键设计模式

### 1. 分层架构

```
Controllers (控制器层)
    ↓
Services (服务层)
    ↓
Repositories (仓库层)
    ↓
Models (模型层)
```

### 2. RAG 设计

```
Query → Embedding → Vector Search → Rerank → LLM
```

### 3. Agent 设计

```
Intent → Strategy → Tools → Reasoning → Action
```

### 4. Workflow 设计

```
Node Factory → Node Execution → State Management → Routing
```

---

## 相关文档

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify GitHub](https://github.com/langgenius/dify)
