# RAGFlow 源码架构分析

## 一、项目概览

| 属性 | 值 |
|------|-----|
| **项目名称** | RAGFlow |
| **GitHub** | https://github.com/infiniflow/ragflow |
| **Star数** | 75,781 |
| **描述** | RAGFlow is a leading open-source Retrieval-Augmented Generation (RAG) engine that fuses cutting-edge RAG with Agent capabilities to create a superior context layer for LLMs |
| **主要语言** | Python (7.8MB), TypeScript (5.5MB), Go (1MB) |

## 二、技术栈分析

### 2.1 语言分布

| 语言 | 代码量 | 占比 |
|------|--------|------|
| Python | 7.8MB | ~42% |
| TypeScript | 5.5MB | ~29% |
| Go | 1MB | ~5.5% |
| C++ | 1.6MB | ~8.5% |
| Shell/Dockerfile | 500KB | ~2.7% |
| 其他 | 600KB | ~3.2% |

### 2.2 核心技术栈

```
RAGFlow
├── 前端 (web/)         - React + TypeScript + UmiJS
├── Python后端 (api/)   - Flask/Quart ASGI
├── Go后端 (internal/)  - Go微服务
├── 核心RAG (rag/)      - Python RAG引擎
├── 文档解析 (deepdoc/)  - Python 文档解析/OCR
├── Agent (agent/)      - Python Agent框架
└── 向量引擎 (internal/) - Go + Elasticsearch/Infinity
```

## 三、目录结构详解

### 3.1 根目录结构

```
ragflow/
├── .agents              # Agent配置文件
├── agent/               # Agent核心模块
├── api/                 # Python REST API服务
├── conf/                # 配置文件
├── deepdoc/             # 文档解析模块
├── docker/              # Docker部署配置
├── internal/            # Go微服务（核心引擎）
├── mcp/                 # MCP协议支持
├── memory/              # 记忆模块
├── rag/                 # 核心RAG逻辑
├── sdk/                 # Python SDK
├── web/                 # React前端
├── Dockerfile           # 主镜像构建
├── docker-compose.yml   # 编排配置
└── AGENTS.md            # Agent说明文档
```

### 3.2 前端模块 (web/)

```
web/
├── src/
│   ├── app.tsx              # 主应用入口
│   ├── assets/              # 静态资源
│   ├── components/          # React组件
│   │   ├── api-service/      # API服务组件
│   │   ├── canvas/          # 画布组件
│   │   ├── chunk-method-dialog/
│   │   └── ...
│   ├── conf.json            # 配置文件
│   ├── constants/           # 常量定义
│   ├── hooks/              # 自定义Hooks
│   ├── interfaces/         # TypeScript接口
│   ├── layouts/            # 布局组件
│   ├── lib/                # 工具库
│   ├── locales/            # 国际化
│   └── pages/              # 页面组件
├── package.json
└── .env.production
```

**技术栈**: React 18+, TypeScript, UmiJS, Ant Design

### 3.3 Python API服务 (api/)

```
api/
├── apps/                      # API蓝图模块
│   ├── api_app.py            # API主入口
│   ├── auth/                 # 认证模块
│   ├── canvas_app.py         # 画布API
│   ├── chunk_app.py          # 分块API
│   ├── conversation_app.py   # 会话API
│   ├── dialog_app.py         # 对话API
│   ├── document_app.py       # 文档API
│   ├── file_app.py           # 文件API
│   ├── kb_app.py             # 知识库API
│   ├── llm_app.py            # LLM配置API
│   ├── search_app.py         # 搜索API
│   ├── restful_apis/         # RESTful API定义
│   └── ...
├── db/                       # 数据库层
│   ├── db_models.py         # SQLAlchemy模型
│   ├── db_utils.py          # 数据库工具
│   ├── init_data.py         # 初始化数据
│   ├── services/            # 业务服务层
│   │   ├── llm_service.py
│   │   ├── knowledgebase_service.py
│   │   └── ...
│   └── joint_services/      # 跨服务业务
│       ├── tenant_model_service.py
│       └── ...
└── ragflow_server.py        # 服务器入口
```

**框架**: Flask/Quart (ASGI), SQLAlchemy, Redis

### 3.4 核心RAG模块 (rag/)

```
rag/
├── app/                      # RAG应用实现
│   ├── base.py              # 基础类
│   ├── naive.py             # 朴素RAG
│   ├── one.py               # One RAG
│   ├── audio.py             # 音频解析
│   ├── book.py              # 图书解析
│   ├── email.py             # 邮件解析
│   ├── laws.py              # 法律文档
│   ├── manual.py            # 手册解析
│   ├── paper.py             # 论文解析
│   ├── picture.py           # 图片解析
│   ├── presentation.py      # PPT解析
│   ├── qa.py                # QA解析
│   ├── resume.py            # 简历解析
│   ├── table.py             # 表格解析
│   └── tag.py               # 标签解析
├── llm/                      # LLM模型抽象
│   ├── chat_model.py        # 聊天模型
│   ├── embedding_model.py   # 嵌入模型
│   ├── rerank_model.py      # 重排模型
│   ├── ocr_model.py         # OCR模型
│   ├── cv_model.py          # CV模型
│   └── tts_model.py         # TTS模型
├── nlp/                      # NLP工具
│   ├── query.py             # 查询处理
│   ├── rag_tokenizer.py     # 分词器
│   ├── search.py            # 搜索
│   ├── synonym.py           # 同义词
│   └── term_weight.py       # 词权重
├── flow/                     # RAG流程
│   ├── base.py
│   ├── pipeline.py
│   └── ...
├── graphrag/                 # 图RAG
│   ├── entity_resolution.py
│   ├── general/
│   └── light/
├── advanced_rag/             # 高级RAG
│   └── tree_structured_query_decomposition_retrieval.py
├── prompts/                  # 提示词模板
├── res/                      # 资源文件
│   └── deepdoc/            # 深度文档模型
└── utils/                    # 工具函数
```

### 3.5 Agent模块 (agent/)

```
agent/
├── component/                # Agent组件
│   ├── __init__.py
│   ├── agent_with_tools.py   # 工具Agent
│   ├── base.py              # 组件基类
│   ├── begin.py             # 开始节点
│   ├── categorize.py        # 分类组件
│   ├── data_operations.py   # 数据操作
│   ├── docs_generator.py    # 文档生成
│   ├── exit_loop.py         # 循环退出
│   ├── fillup.py            # 填充组件
│   ├── invoke.py            # 调用组件
│   ├── iteration.py         # 迭代组件
│   ├── iterationitem.py
│   ├── llm.py              # LLM组件
│   ├── loop.py             # 循环组件
│   ├── message.py          # 消息组件
│   ├── string_transform.py  # 字符串转换
│   ├── switch.py           # 条件切换
│   └── ...
├── sandbox/                  # 沙箱执行
│   ├── client.py           # 沙箱客户端
│   ├── executor_manager.py  # 执行器管理
│   ├── providers/          # 沙箱提供商
│   └── ...
├── plugin/                   # 插件系统
│   ├── common.py
│   ├── embedded_plugins/
│   ├── llm_tool_plugin.py
│   └── plugin_manager.py
├── canvas.py                # 画布
├── settings.py              # 设置
└── templates/               # 模板
```

**Agent组件架构**:

```python
# agent/component/base.py - 组件基类
class ComponentParamBase(ABC):
    def __init__(self):
        self.message_history_window_size = 13
        self.inputs = {}
        self.outputs = {}
        self.description = ""
        self.max_retries = 0
        self.delay_after_error = 2.0

class ComponentBase(ABC):
    # 组件基类，定义run方法
    async def run(self, data, context):
        raise NotImplementedError
```

### 3.6 Go后端引擎 (internal/)

```
internal/
├── admin/                    # 管理接口
├── binding/                  # 绑定
├── cache/                    # 缓存服务
├── cli/                      # 命令行
├── common/                   # 公共定义
├── cpp/                      # C++扩展
├── dao/                      # 数据访问层
│   ├── chat.go
│   ├── chat_session.go
│   ├── document.go
│   ├── kb.go
│   └── ...
├── engine/                    # 搜索引擎引擎
│   ├── elasticsearch/        # ES实现
│   │   ├── client.go
│   │   ├── document.go
│   │   ├── index.go
│   │   └── search.go
│   ├── infinity/            # Infinity实现
│   │   ├── client.go
│   │   ├── document.go
│   │   ├── index.go
│   │   └── search.go
│   └── engine.go            # 引擎抽象
├── handler/                  # HTTP处理器
│   ├── chat.go
│   ├── document.go
│   ├── kb.go
│   ├── llm.go
│   └── search.go
├── model/                    # 数据模型
│   └── models/
├── router/                   # 路由
├── server/                   # 服务器
├── service/                  # 业务服务
│   ├── chat.go
│   ├── document.go
│   ├── knowledgebase.go
│   └── ...
└── storage/                  # 存储
```

**引擎架构**:

```go
// internal/engine/engine.go
type Engine interface {
    Search(ctx context.Context, req *SearchRequest) (*SearchResponse, error)
    Index(ctx context.Context, doc *Document) error
    Delete(ctx context.Context, id string) error
}
```

### 3.7 文档解析模块 (deepdoc/)

```
deepdoc/
├── parser/                    # 解析器
│   ├── __init__.py
│   ├── DocxParser.py         # Word解析
│   ├── EpubParser.py         # EPUB解析
│   ├── ExcelParser.py        # Excel解析
│   ├── HtmlParser.py         # HTML解析
│   ├── JsonParser.py         # JSON解析
│   ├── MarkdownParser.py     # Markdown解析
│   ├── PdfParser.py          # PDF解析
│   ├── TxtParser.py          # 文本解析
│   ├── DoclingParser.py      # Docling解析
│   ├── TCADPParser.py        # TCADP解析
│   ├── figure_parser.py      # 图表解析
│   └── pdf_parser.py         # PDF底层解析
├── vision/                    # 视觉模型
│   └── ...
└── README.md
```

### 3.8 MCP模块 (mcp/)

```
mcp/
├── python/                    # Python MCP实现
│   ├── client/
│   ├── server/
│   └── services/
└── README.md
```

### 3.9 SDK模块 (sdk/)

```
sdk/
├── python/                    # Python SDK
│   └── ragflow/
│       └── ...
└── README.md
```

## 四、核心架构设计

### 4.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web UI (React)                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Python/Flask)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Chat    │ │ Document │ │  Search  │ │  Knowledge Base  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────────────┐
│  RAG Pipeline   │                    │   Go Engine (internal/)  │
│  ┌───────────┐  │                    │  ┌─────────────────┐   │
│  │ rag/app/  │  │                    │  │  Elasticsearch  │   │
│  │ rag/llm/  │  │                    │  │    or Infinity  │   │
│  │ rag/nlp/  │  │                    │  └─────────────────┘   │
│  └───────────┘  │                    │  ┌─────────────────┐   │
└─────────────────┘                    │  │     Redis       │   │
         │                              │  └─────────────────┘   │
         ▼                              │  ┌─────────────────┐   │
┌─────────────────┐                     │  │  PostgreSQL     │   │
│  Agent System   │                     │  └─────────────────┘   │
│  ┌───────────┐  │                    └─────────────────────────┘
│  │ agent/    │  │
│  │ component/│  │
│  └───────────┘  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  DeepDoc Parser │
│  ┌───────────┐  │
│  │ PDF/OCR   │  │
│  │ Table/Img│  │
│  └───────────┘  │
└─────────────────┘
```

### 4.2 RAG流程

```
文档上传
    │
    ▼
┌──────────────────────────────────────┐
│         Document Parsing             │
│   (deepdoc/parser/)                  │
│   - PDF解析                          │
│   - OCR识别                          │
│   - 表格解析                         │
│   - 布局识别                         │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│         Chunking                     │
│   (rag/app/*/tokenize_chunks)        │
│   - 语义分块                         │
│   - 滑动窗口                         │
│   - 表格分块                         │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│       Embedding & Indexing           │
│   (rag/llm/embedding_model.py)       │
│   - 向量化                           │
│   - 向量索引                         │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│         Storage                      │
│   (internal/engine/)                 │
│   - Elasticsearch                   │
│   - Infinity                        │
│   - PostgreSQL                      │
└──────────────────────────────────────┘
```

### 4.3 Agent执行流程

```python
# Agent执行流程
class AgentWithTools:
    async def run(self, user_input, context):
        # 1. 理解用户意图
        intent = await self.understand(user_input)

        # 2. 规划行动
        plan = await self.plan(intent, context)

        # 3. 执行工具
        for step in plan.steps:
            result = await self.execute_tool(step)
            context.update(result)

        # 4. 生成回复
        response = await self.generate_response(context)
        return response
```

### 4.4 向量检索引擎

**支持双引擎**:

```go
// internal/engine/engine.go
type Engine interface {
    // 搜索接口
    Search(ctx context.Context, req *SearchRequest) (*SearchResponse, error)
    // 索引接口
    Index(ctx context.Context, doc *Document) error
    // 删除接口
    Delete(ctx context.Context, id string) error
}

// Elasticsearch实现
type ElasticsearchEngine struct {
    client *elasticsearch.Client
}

// Infinity实现
type InfinityEngine struct {
    client *infinity.Client
}
```

## 五、数据流分析

### 5.1 文档处理数据流

```
文件上传 (PDF/DOCX/PPT/TXT)
    │
    ▼
deepdoc.parser.XXXParser.parse()
    │
    ├──► 文本提取
    ├──► 表格提取
    ├──► 图片OCR
    └──► 布局分析
    │
    ▼
rag/app/naive.tokenize_chunks()
    │
    ├──► 语义分块
    ├──► 重叠窗口
    └──► 元数据附加
    │
    ▼
rag/llm/embedding_model.encode()
    │
    ├──► 单句向量化
    └──► 文档向量化
    │
    ▼
internal/engine.(*Engine).Index()
    │
    ├──► ES bulk index
    └──► Infinity insert
```

### 5.2 检索数据流

```
用户查询
    │
    ▼
rag/nlp/query.py.query_analyze()
    │
    ├──► 关键词提取
    ├──► 同义词扩展
    └──► 查询改写
    │
    ▼
rag/llm/embedding_model.encode()
    │
    └──► 查询向量化
    │
    ▼
internal/engine.(*Engine).Search()
    │
    ├──► 向量相似度检索
    ├──► BM25混合检索
    └──► 重排序
    │
    ▼
rag/llm/rerank_model.rerank()
    │
    └──► 交叉编码重排
    │
    ▼
生成最终结果
```

### 5.3 Agent对话数据流

```
用户消息
    │
    ▼
api/apps/dialog_app.py
    │
    ▼
agent.component.message.Message
    │
    ▼
agent.component.llm.LLM
    │
    ├──► 历史上下文
    ├──► 工具调用规划
    └──► LLM推理
    │
    ▼
agent.sandbox.executor
    │
    └──► 工具执行
    │
    ▼
生成回复
```

## 六、部署架构

### 6.1 Docker Compose结构

```yaml
# docker/docker-compose.yml 主要服务
services:
  # API服务 (Python)
  api:
    build: .
    ports:
      - "9380:9380"

  # Go引擎服务
  infinity:
    image: infiniflow/infinity
    ports:
      - "8087:8087"

  # 消息队列
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  # 数据库
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"

  # MinIO对象存储
  minio:
    image: minio/minio
    ports:
      - "9000:9000"

  # 前端
  web:
    build: ./web
    ports:
      - "8000:8000"
```

### 6.2 环境变量配置

```bash
# conf/.env
# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ragflow
POSTGRES_PASSWORD=ragflow

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 向量引擎配置
INFINITY_HOST=localhost
INFINITY_PORT=8087

# 对象存储配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## 七、API设计

### 7.1 主要API端点

| 模块 | 端点 | 说明 |
|------|------|------|
| 知识库 | `POST /api/v1/kbs` | 创建知识库 |
| 知识库 | `GET /api/v1/kbs/{id}` | 获取知识库 |
| 文档 | `POST /api/v1/documents` | 上传文档 |
| 文档 | `GET /api/v1/documents/{id}` | 获取文档 |
| 分块 | `GET /api/v1/chunks` | 获取文档分块 |
| 聊天 | `POST /api/v1/chat` | 创建对话 |
| 聊天 | `POST /api/v1/chat/{id}` | 发送消息 |
| 搜索 | `POST /api/v1/retrieval` | 检索 |

### 7.2 API服务结构

```python
# api/apps/api_app.py
from flask import Blueprint

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# 注册子蓝图
from api.apps import kb_app, document_app, chat_app
api_bp.register_blueprint(kb_app.bp)
api_bp.register_blueprint(document_app.bp)
api_bp.register_blueprint(chat_app.bp)
```

## 八、Agent组件详解

### 8.1 组件类型

| 组件 | 文件 | 功能 |
|------|------|------|
| LLM | `llm.py` | 调用大语言模型 |
| Begin | `begin.py` | 工作流起始节点 |
| Categorize | `categorize.py` | 意图分类 |
| Fillup | `fillup.py` | 表单填充 |
| Invoke | `invoke.py` | 工具调用 |
| Iteration | `iteration.py` | 循环迭代 |
| Loop | `loop.py` | 条件循环 |
| Switch | `switch.py` | 条件分支 |
| Message | `message.py` | 消息处理 |
| StringTransform | `string_transform.py` | 字符串转换 |
| DocsGenerator | `docs_generator.py` | 文档生成 |
| DataOperations | `data_operations.py` | 数据操作 |

### 8.2 组件基类设计

```python
# agent/component/base.py
class ComponentBase(ABC):
    def __init__(self):
        self.name = None
        self.inputs = {}
        self.outputs = {}

    async def run(self, data, context):
        """执行组件逻辑"""
        raise NotImplementedError

    def add_input(self, key, value):
        self.inputs[key] = value

    def add_output(self, key, value):
        self.outputs[key] = value
```

### 8.3 LLM组件

```python
# agent/component/llm.py
class LLMParam(ComponentParamBase):
    def __init__(self):
        super().__init__()
        self.llm_id = ""
        self.sys_prompt = ""
        self.prompts = [{"role": "user", "content": "{sys.query}"}]
        self.max_tokens = 0
        self.temperature = 0
        self.top_p = 0
        self.cite = True
        self.output_structure = None

class LLM(ComponentBase):
    async def run(self, data, context):
        # 1. 构建提示词
        prompt = self.build_prompt(data, context)
        # 2. 调用LLM
        response = await self.call_llm(prompt)
        # 3. 解析输出
        result = self.parse_response(response)
        return result
```

## 九、配置管理

### 9.1 配置文件

```
conf/
├── service_conf.yaml        # 服务配置
├── system_settings.json      # 系统设置
├── llm_factories.json       # LLM工厂配置
├── mapping.json             # 字段映射
├── os_mapping.json          # 操作系统映射
├── private.pem              # 私钥
└── public.pem              # 公钥
```

### 9.2 LLM工厂配置

```json
// conf/llm_factories.json
{
  "openai": {
    "provider": "openai",
    "models": ["gpt-4", "gpt-3.5-turbo"]
  },
  "anthropic": {
    "provider": "anthropic",
    "models": ["claude-3-opus", "claude-3-sonnet"]
  },
  "ollama": {
    "provider": "ollama",
    "models": ["llama2", "mistral"]
  }
}
```

## 十、技术亮点

### 10.1 深度文档理解

- **多模态解析**: 支持PDF、Word、Excel、PPT等多格式
- **OCR识别**: 内置文字识别能力
- **表格理解**: 表格结构识别与解析
- **布局分析**: 智能布局识别

### 10.2 混合检索

- **向量检索**: 基于语义相似度
- **关键词检索**: BM25/TF-IDF
- **重排序**: 交叉编码器重排
- **混合评分**: 多策略融合

### 10.3 Agent系统

- **组件化设计**: 模块化Agent组件
- **工具生态**: 内置多种工具
- **沙箱执行**: 安全执行环境
- **插件扩展**: 插件机制

### 10.4 双引擎支持

- **Elasticsearch**: 成熟稳定
- **Infinity**: 高性能向量数据库

## 十一、源码文件检查清单

| 源码目录 | 关键文件 | 功能说明 |
|----------|----------|----------|
| `rag/app/` | `naive.py`, `base.py` | RAG应用核心 |
| `rag/llm/` | `chat_model.py`, `embedding_model.py` | LLM抽象层 |
| `rag/nlp/` | `query.py`, `rag_tokenizer.py` | NLP工具 |
| `agent/component/` | `base.py`, `llm.py`, `*.py` | Agent组件 |
| `deepdoc/parser/` | `PdfParser.py`, `DocxParser.py` | 文档解析 |
| `api/apps/` | `kb_app.py`, `chat_app.py` | REST API |
| `api/db/` | `services/`, `joint_services/` | 数据访问 |
| `internal/engine/` | `elasticsearch/`, `infinity/` | 向量引擎 |
| `internal/dao/` | `*.go` | Go数据访问 |
| `web/src/` | `components/`, `pages/` | React前端 |

## 十二、开发指南

### 12.1 环境搭建

```bash
# 1. 克隆仓库
git clone https://github.com/infiniflow/ragflow.git
cd ragflow

# 2. 安装依赖
uv sync --python 3.12 --all-extras
uv run download_deps.py

# 3. 启动基础设施
docker compose -f docker/docker-compose-base.yml up -d

# 4. 启动后端
source .venv/bin/activate
export PYTHONPATH=$(pwd)
bash docker/launch_backend_service.sh

# 5. 启动前端
cd web
npm install
npm run dev
```

### 12.2 代码规范

- **Python**: 使用 `ruff` 进行格式化
- **Go**: 使用 `gofmt` 格式化
- **TypeScript**: 使用 `prettier` 格式化

### 12.3 测试

```bash
# Python测试
uv run pytest

# 前端测试
cd web && npm run test
```

## 十三、总结

RAGFlow是一个功能完整的RAG引擎项目，具有以下特点:

1. **全栈架构**: 前后端分离，Python+Go混合后端
2. **模块化设计**: RAG、Agent、解析器独立模块
3. **多格式支持**: 深度文档理解能力
4. **双引擎**: 支持ES和Infinity两种向量引擎
5. **Agent系统**: 可扩展的Agent组件框架
6. **生产级**: 支持Docker一键部署

项目代码量约18万行，其中Python约7.8万行，TypeScript约5.5万行，Go约1万行。
