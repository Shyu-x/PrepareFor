# UltraRAG 源码分析报告

## 项目概述

UltraRAG 是由清华大学 THUNLP、东北大学 NEUIR、OpenBMB 和 AI9Stars 联合推出的基于 MCP (Model Context Protocol) 架构设计的轻量级 RAG 开发框架。当前版本 3.0，主打"Less Code, Lower Barrier, Faster Deployment"理念。

**项目信息：**
- GitHub: https://github.com/OpenBMB/UltraRAG
- 语言: Python (>=3.11, <3.13)
- 当前 Stars: 5485
- Forks: 407
- 创建时间: 2025-01-16
- 最新更新: 2026-03-22

---

## 项目架构

### 核心设计理念

UltraRAG 将核心 RAG 组件（Retriever、Generation 等）标准化为独立的 **MCP Servers**，结合 **MCP Client** 的强大工作流编排能力，开发者只需通过 YAML 配置即可实现条件分支、循环等复杂控制结构的精确编排。

### 技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      UltraRAG Client                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Pipeline   │  │  Pipeline   │  │   UltraRAG  │         │
│  │   Builder   │  │   Executor   │  │      UI     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client                               │
│  - YAML 配置文件解析                                          │
│  - 工具/提示词编排                                           │
│  - 条件分支/循环控制                                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Retriever │   │  Generation  │   │   Reranker  │
│    Server   │   │    Server    │   │    Server   │
└─────────────┘   └─────────────┘   └─────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  FAISS/     │   │   vLLM/     │   │   bge/      │
│  Milvus     │   │   OpenAI    │   │  reranker   │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## 目录结构

```
UltraRAG/
├── src/ultrarag/              # 核心库
│   ├── __init__.py
│   ├── api.py                 # API 接口
│   ├── cli.py                 # 命令行工具
│   ├── client.py              # MCP 客户端
│   ├── server.py              # MCP 服务端基类
│   ├── mcp_exceptions.py      # MCP 异常定义
│   ├── mcp_logging.py         # 日志工具
│   └── utils.py               # 工具函数
│
├── servers/                    # MCP 服务器实现
│   ├── benchmark/              # 基准测试服务器
│   ├── corpus/                # 语料处理服务器
│   ├── custom/                # 自定义服务器
│   ├── evaluation/            # 评估服务器
│   ├── generation/            # 生成服务器
│   │   └── src/
│   │       ├── generation.py  # 核心生成逻辑
│   │       └── local_generation.py  # 本地生成
│   ├── prompt/                # 提示词服务器
│   ├── reranker/              # 重排服务器
│   ├── retriever/             # 检索服务器
│   │   └── src/
│   │       ├── retriever.py   # 核心检索逻辑
│   │       ├── index_backends/  # 索引后端
│   │       │   ├── base.py
│   │       │   ├── faiss_backend.py
│   │       │   └── milvus_backend.py
│   │       └── websearch_backends/  # 网页搜索后端
│   │           ├── base.py
│   │           ├── exa_backend.py
│   │           ├── tavily_backend.py
│   │           └── zhipuai_backend.py
│   ├── router/                # 路由服务器
│   └── sayhello/              # 示例服务器
│
├── ui/                        # 前端界面
│   ├── backend/
│   │   ├── app.py             # Flask 后端应用
│   │   └── pipeline_manager.py  # Pipeline 管理器
│   └── frontend/
│       ├── index.html
│       ├── main.js
│       ├── style.css
│       ├── i18n/              # 国际化
│       └── vendor/            # 第三方库
│
├── examples/                   # 示例配置
│   ├── RAG.yaml               # 基础 RAG 示例
│   ├── vanilla_rag.yaml
│   ├── rag_full.yaml
│   ├── AgentCPM-Report.yaml   # Deep Research 示例
│   ├── IRCoT.yaml             # 迭代检索示例
│   └── parameter/             # 参数配置
│
├── prompt/                     # 提示词模板 (Jinja2)
│   ├── qa_boxed.jinja
│   ├── qa_rag_boxed.jinja
│   ├── gen_subq.jinja
│   ├── evisrag.jinja
│   └── ... (50+ 模板)
│
├── script/                     # 脚本工具
│   ├── api_usage_example.py
│   ├── case_study.py
│   ├── deploy_retriever_server.py
│   └── vllm_serve.sh
│
├── data/                       # 示例数据
│   ├── corpus_example.jsonl
│   └── sample_nq_10.jsonl
│
├── docs/                       # 文档
├── pyproject.toml              # 项目配置
├── Dockerfile                 # 完整版 Docker
├── Dockerfile.base-cpu         # CPU 版
└── Dockerfile.base-gpu        # GPU 版
```

---

## 核心模块分析

### 1. MCP 客户端 (client.py)

UltraRAG 的客户端是整个框架的核心，负责：
- Pipeline 配置解析与执行
- 多个 MCP 服务器的协调调用
- UI 启动与管理

**主要类：**

```python
class UltraRAG_Client:
    """UltraRAG 核心客户端类

    负责：
    - Pipeline 编排执行
    - 多服务器协调
    - 工具调用管理
    """

    def __init__(self, servers_config: List[str]):
        """初始化客户端

        Args:
            servers_config: 服务器配置文件路径列表
        """
        self.servers = []  # 已连接的 MCP 服务器列表
        self.tools = {}    # 可用工具映射
        self.prompts = {}  # 可用提示词映射

    def add_server(self, server_config: str):
        """添加并连接 MCP 服务器

        Args:
            server_config: server.yaml 配置文件路径
        """
        # 加载服务器配置
        # 建立 MCP 连接
        # 注册工具和提示词

    async def run(self, pipeline_config: Dict[str, Any]) -> Any:
        """执行 Pipeline

        Args:
            pipeline_config: Pipeline 配置字典

        Returns:
            Pipeline 执行结果
        """
        # 解析 Pipeline 步骤
        # 按序/循环/条件执行各步骤
        # 处理步骤间的数据流转
```

**关键特性：**
- 支持顺序、循环、条件分支三种控制流
- 工具调用通过 `output` 注解实现数据绑定
- 内置 MockContent/MockResult 用于测试

### 2. MCP 服务端基类 (server.py)

`UltraRAG_MCP_Server` 继承自 FastMCP，扩展了以下功能：

```python
class UltraRAG_MCP_Server(FastMCP):
    """扩展的 FastMCP 服务器

    新增功能：
    - 工具/提示词元数据跟踪
    - 配置文件加载
    - server.yaml 生成
    """

    def __init__(self, name: str = "UltraRAG", ...):
        """初始化服务器"""
        super().__init__(name, instructions)
        self.output = {}           # 工具输出存储
        self.fn_meta = {}         # 工具元数据
        self.prompt_meta = {}     # 提示词元数据

    def tool(self, fn, output: str = None, ...):
        """注册工具

        Args:
            fn: 工具函数
            output: 输出规范，如 "input->output" 指定输入输出映射
        """
        # 解析 output 注解
        # 跟踪参数和返回值信息
        # 注册到 FastMCP

    def build(self, parameter_file: str):
        """生成 server.yaml 配置文件

        Args:
            parameter_file: 参数配置文件路径
        """
        # 加载参数配置
        # 根据 fn_meta 和 prompt_meta 生成 server.yaml
```

**output 注解规范：**
- 格式：`input_spec->output_spec`
- 示例：`"query,top_k->ret_psg"` 表示输入 query 和 top_k，输出 ret_psg
- 支持多输入多输出：`"a,b->c,d"`

### 3. 检索服务器 (servers/retriever/)

检索服务器是 UltraRAG 最核心的组件之一，支持多种检索后端。

**Retriever 类结构：**

```python
class Retriever:
    """检索器核心类

    支持功能：
    - 向量检索 (FAISS, Milvus)
    - BM25 检索
    - 网页搜索 (Exa, Tavily, 智谱)
    - 混合检索
    - 批处理检索
    """

    def __init__(self, mcp_inst: UltraRAG_MCP_Server):
        # 注册工具
        mcp_inst.tool(self.retriever_init, output="...")
        mcp_inst.tool(self.retriever_embed, output="...")
        mcp_inst.tool(self.retriever_index, output="...")
        mcp_inst.tool(self.retriever_search, output="...")
        mcp_inst.tool(self.bm25_index, output="...")
        mcp_inst.tool(self.bm25_search, output="...")
        mcp_inst.tool(self.retriever_websearch, output="...")

    async def retriever_search(
        self,
        q_ls: List[str],
        top_k: int,
        query_instruction: str,
        collection_name: str
    ) -> List[Dict[str, Any]]:
        """向量检索

        Args:
            q_ls: 查询列表
            top_k: 返回数量
            query_instruction: 查询指令（用于重写查询）
            collection_name: 集合名称

        Returns:
            检索结果列表，每项包含检索段落和相关性分数
        """
        # 1. 加载索引后端
        # 2. 执行向量检索
        # 3. 返回 Top-K 结果

    async def bm25_search(
        self,
        q_ls: List[str],
        top_k: int
    ) -> List[Dict[str, Any]]:
        """BM25 稀疏检索

        Args:
            q_ls: 查询列表
            top_k: 返回数量

        Returns:
            BM25 检索结果
        """
        # 使用 bm25s 库进行稀疏检索
```

**索引后端架构：**

```python
# index_backends/base.py
class BaseIndexBackend(ABC):
    """索引后端抽象基类

    定义索引操作的标准接口
    """

    @abstractmethod
    async def add(self, texts: List[str], embeddings: np.ndarray):
        """添加文档到索引"""
        pass

    @abstractmethod
    async def search(
        self,
        queries: np.ndarray,
        top_k: int
    ) -> List[List[Dict[str, Any]]]:
        """检索相似文档"""
        pass

# 具体实现
class FAISSBackend(BaseIndexBackend):
    """FAISS 向量索引后端"""
    # 使用 Facebook FAISS 库

class MilvusBackend(BaseIndexBackend):
    """Milvus 向量数据库后端"""
    # 使用 Milvus 向量数据库
```

**网页搜索后端：**

```python
# websearch_backends/base.py
class BaseWebSearchBackend(ABC):
    """网页搜索抽象基类"""

    @abstractmethod
    async def search(
        self,
        query: str,
        top_k: int,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """执行网页搜索"""
        pass

# 具体实现
class ExaBackend(BaseWebSearchBackend):
    """Exa 搜索引擎后端"""

class TavilyBackend(BaseWebSearchBackend):
    """Tavily 搜索引擎后端"""

class ZhipuaiBackend(BaseWebSearchBackend):
    """智谱 AI 搜索后端"""
```

### 4. 生成服务器 (servers/generation/)

生成服务器负责 LLM 调用，支持多种后端。

**Generation 类结构：**

```python
class Generation:
    """生成器核心类

    支持：
    - OpenAI API
    - vLLM 本地部署
    - 多模态生成
    - 多轮对话
    """

    def __init__(self, mcp_inst: UltraRAG_MCP_Server):
        mcp_inst.tool(self.generation_init, output="...")
        mcp_inst.tool(self.generate, output="...")
        mcp_inst.tool(self.multimodal_generate, output="...")
        mcp_inst.tool(self.multiturn_generate, output="...")

    async def generate(
        self,
        prompt_ls: List[str],
        system_prompt: Optional[str] = None
    ) -> List[str]:
        """文本生成

        Args:
            prompt_ls: 提示词列表
            system_prompt: 系统提示词

        Returns:
            生成结果列表
        """
        # 1. 初始化客户端 (OpenAI/vLLM)
        # 2. 批量生成
        # 3. 返回结果

    async def multimodal_generate(
        self,
        multimodal_path: str,
        prompt_ls: List[str],
        system_prompt: Optional[str] = None,
        image_tag: str = "<image>"
    ) -> List[str]:
        """多模态生成（支持图像输入）

        Args:
            multimodal_path: 图像路径
            prompt_ls: 提示词列表
            system_prompt: 系统提示词
            image_tag: 图像标签

        Returns:
            生成结果
        """
        # 支持 Qwen-VL 等多模态模型
```

**后端配置示例：**

```python
# 支持的后端
BACKENDS = {
    "openai": OpenAI_AsyncClient,      # OpenAI API
    "vllm": VLLM_Client,               # vLLM 本地部署
    "dashscope": DashScope_Client,      # 阿里云通义
    "zhipuai": ZhipuAI_Client,          # 智谱 AI
}
```

### 5. 其他服务器

| 服务器 | 路径 | 功能 |
|--------|------|------|
| **corpus** | servers/corpus/ | 语料处理：分块、清洗、构建索引 |
| **reranker** | servers/reranker/ | 重排：使用 bge-reranker 等模型重排检索结果 |
| **evaluation** | servers/evaluation/ | 评估：RAG 评测指标计算 |
| **benchmark** | servers/benchmark/ | 基准测试：标准评测流程执行 |
| **prompt** | servers/prompt/ | 提示词：提示词模板管理 |
| **router** | servers/router/ | 路由：根据条件路由到不同处理分支 |

---

## Pipeline 编排系统

### YAML 配置示例

UltraRAG 通过 YAML 文件定义 Pipeline，支持三种控制流：

**1. 顺序执行：**

```yaml
name: vanilla_rag
description: 基础 RAG Pipeline

servers:
  - ./servers/retriever/server.yaml
  - ./servers/generation/server.yaml

pipeline:
  - step: retriever_search
    tool: retriever_search
    inputs:
      q_ls: "${query}"
      top_k: 5
      query_instruction: "找相关知识"
      collection_name: "knowledge_base"
    output: ret_psg

  - step: generate
    tool: generate
    inputs:
      prompt_ls: "根据以下知识回答问题：${ret_psg}\n问题：${query}"
      system_prompt: "你是一个有帮助的助手"
    output: answer
```

**2. 条件分支：**

```yaml
pipeline:
  - step: check_relevance
    tool: check_passages
    inputs:
      passages: "${ret_psg}"
      question: "${query}"
    output: is_relevant

  - step: conditional_generate
    if: "${is_relevant} == true"  # 条件判断
    then:
      - step: generate
        tool: generate
        inputs:
          prompt_ls: "基于检索结果回答"
    else:
      - step: websearch
        tool: retriever_websearch
        inputs:
          q_ls: "${query}"
```

**3. 循环执行：**

```yaml
pipeline:
  - step: iterative_search
    loop: 3  # 最多循环 3 次
    steps:
      - step: generate_subqueries
        tool: gen_subq
        output: subqueries

      - step: search_subqueries
        loop_vars: subqueries
        steps:
          - step: search
            tool: retriever_search
            inputs:
              q_ls: "${subquery}"
```

---

## 提示词模板系统

UltraRAG 使用 Jinja2 模板引擎管理提示词，模板位于 `prompt/` 目录：

**常用模板：**

| 模板文件 | 用途 |
|----------|------|
| `qa_boxed.jinja` | 基础问答（boxed 格式） |
| `qa_rag_boxed.jinja` | RAG 问答 |
| `gen_subq.jinja` | 子问题生成 |
| `evisrag.jinja` | VisRAG 多模态问答 |
| `r1_searcher_*.jinja` | R1 风格搜索推理 |

**模板示例 (qa_rag_boxed.jinja)：**

```jinja
请你基于以下参考知识回答问题。如果知识不足以回答，可以说你不知道。

参考知识：
{% for psg in passages %}
[{{ loop.index }}] {{ psg }}
{% endfor %}

问题：{{ question }}

请在回答中引用相关知识的编号，格式为 [1][2]。
```

---

## UltraRAG UI 系统

UI 是一个基于 Flask 的 Web 应用，提供可视化 RAG IDE 功能。

### 后端架构 (ui/backend/app.py)

```python
class UltraRAG_UI:
    """UltraRAG Web UI 核心类

    功能：
    - Pipeline 可视化构建
    - 在线调试
    - 对话界面
    - 知识库管理
    """

    def __init__(self):
        self.app = Flask(__name__)
        self.pipeline_manager = PipelineManager()
        self._setup_routes()

    def _setup_routes(self):
        """设置路由"""
        @self.app.route("/api/chat", methods=["POST"])
        def chat():
            # 处理对话请求
            pass

        @self.app.route("/api/pipeline/save", methods=["POST"])
        def save_pipeline():
            # 保存 Pipeline 配置
            pass

        @self.app.route("/api/knowledge/upload", methods=["POST"])
        def upload_knowledge():
            # 上传知识库文档
            pass
```

### 前端结构

```
ui/frontend/
├── index.html        # 主页面
├── main.js           # 主脚本
├── style.css         # 样式
├── i18n/
│   ├── en.js         # 英文国际化
│   └── zh.js         # 中文国际化
└── vendor/           # 第三方库
    ├── bootstrap/     # Bootstrap CSS
    ├── highlight.js/ # 代码高亮
    └── kaTeX/        # 数学公式
```

---

## 依赖管理

### pyproject.toml 核心依赖

```toml
[project]
name = "ultrarag"
version = "0.3.0"
requires-python = ">=3.11, <3.13"

dependencies = [
    "fastmcp==2.14.5",      # FastMCP 框架
    "mcp",                   # MCP 协议
    "rich",                  # 富文本输出
    "openai",                # OpenAI API
    "PyYAML",                # YAML 解析
    "aiohttp",               # 异步 HTTP
    "pymilvus",              # Milvus 客户端
    "faiss-gpu-cu12",        # FAISS GPU 版
    # ... 更多依赖
]

[project.optional-dependencies]
retriever = [
    "sentence-transformers",  # 向量模型
    "bm25s",                  # BM25 检索
    "faiss-gpu-cu12",        # FAISS
    "pymilvus",              # Milvus
    "exa_py",                # Exa 搜索
    "tavily-python",         # Tavily 搜索
]

generation = [
    "vllm>=0.13.0",          # vLLM 本地推理
    "transformers",          # Transformers
]

evaluation = [
    "rouge-score",           # ROUGE 指标
    "pytrec-eval-terrier",   # TRECVid 指标
]
```

---

## 版本演进

| 版本 | 时间 | 主要特性 |
|------|------|----------|
| **v1.0** | 2025-01 | UltraRAG 初始版本发布 |
| **v2.0** | 2025-08 | 全新升级，YAML 编排，低代码 RAG |
| **v2.1** | 2025-11 | 增强知识摄取，多模态支持，统一评估系统 |
| **v3.0** | 2026-01 | MCP 架构重构，推理逻辑可视化 |

---

## 主要贡献者

| 贡献者 | 提交次数 |
|--------|----------|
| mssssss123 | 116 |
| xhd0728 | 88 |
| gdw439 | 49 |
| Kaguya-19 | 41 |
| ChenYX24 | 37 |
| hm1229 | 9 |

---

## 安装与使用

### 方式一：源码安装（推荐 uv）

```shell
# 安装 uv
pip install uv

# 克隆代码
git clone https://github.com/OpenBMB/UltraRAG.git --depth 1
cd UltraRAG

# 完整安装
uv sync --all-extras

# 激活环境
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate.bat  # Windows

# 运行示例
ultrarag run examples/sayhello.yaml
```

### 方式二：Docker

```shell
# CPU 版本
docker pull hdxin2002/ultrarag:v0.3.0-base-cpu
docker run -it -p 5050:5050 hdxin2002/ultrarag:v0.3.0-base-cpu

# GPU 版本
docker pull hdxin2002/ultrarag:v0.3.0-base-gpu
docker run -it --gpus all -p 5050:5050 hdxin2002/ultrarag:v0.3.0-base-gpu
```

### 方式三：Python 包安装

```shell
# 核心功能
pip install -e .

# 完整功能
pip install -e ".[all]"
```

---

## 技术亮点

### 1. MCP 架构标准化
- 将 RAG 各组件标准化为 MCP Servers
- 工具调用通过 JSON-RPC 协议
- 支持多种传输协议 (stdio, HTTP, SSE)

### 2. 低代码编排
- YAML 配置即可定义复杂 Pipeline
- 支持顺序、循环、条件分支
- 工具间数据流转自动化

### 3. 多后端支持
- 向量检索：FAISS, Milvus
- 稀疏检索：BM25
- 网页搜索：Exa, Tavily, 智谱
- 生成模型：OpenAI, vLLM, 通义

### 4. 可视化开发
- Pipeline Builder 支持拖拽编排
- 双向实时同步（Canvas ↔ YAML）
- 在线调试和参数调整

---

## 适用场景

1. **学术研究**：快速构建 RAG 实验流程，标准化评测
2. **工业原型**：快速验证 RAG 想法，一键部署 Demo
3. **生产部署**：轻量级 RAG 应用开发
4. **多模态 RAG**：VisRAG 等视觉文档检索

---

## 参考资源

- GitHub: https://github.com/OpenBMB/UltraRAG
- 文档: https://ultrarag.openbmb.cn/
- 论文:
  - VisRAG (ICLR 2025)
  - RAG-DDR (ICLR 2025)
  - RAGEval (ACL 2025)
  - DeepNote (EMNLP 2025)

---

*报告生成时间: 2026-03-22*
