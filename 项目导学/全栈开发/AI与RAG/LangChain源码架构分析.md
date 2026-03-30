# LangChain 源码架构分析

## 一、项目概览

| 属性 | 值 |
|------|-----|
| **仓库** | langchain-ai/langchain |
| **Stars** | 130,572 |
| **URL** | https://github.com/langchain-ai/langchain |
| **语言分布** | Python (主语言), JavaScript, Makefile, Shell |
| **最新版本** | langchain==1.2.13 (2026-03-19) |
| **最新核心库** | langchain-core==1.2.20 (2026-03-18) |

## 二、仓库结构

```
langchain/
├── libs/
│   ├── core/               # langchain-core 核心抽象层
│   ├── langchain/          # langchain-classic (遗留版本，无新功能)
│   ├── langchain_v1/       # 活跃维护的 langchain 包
│   ├── partners/           # 第三方集成
│   │   ├── openai/         # OpenAI 模型和嵌入
│   │   ├── anthropic/      # Anthropic (Claude) 集成
│   │   ├── ollama/         # 本地模型支持
│   │   ├── groq/
│   │   ├── mistralai/
│   │   ├── deepseek/
│   │   ├── fireworks/
│   │   ├── huggingface/
│   │   ├── nomic/
│   │   ├── qdrant/
│   │   ├── xai/
│   │   └── ... (更多集成)
│   ├── text-splitters/     # 文档分块工具
│   ├── standard-tests/     # 集成测试套件
│   └── model-profiles/     # 模型配置 profiles
├── .github/                # CI/CD 工作流
├── docs/                   # 文档
└── README.md
```

## 三、核心包详解

### 3.1 langchain-core (核心抽象层)

**位置**: `libs/core/langchain_core/`

**职责**: 定义 LangChain 生态系统的基础抽象，包含核心组件的接口和通用调用协议。

**模块结构**:

```
langchain_core/
├── __init__.py              # 主入口，导出所有公共抽象
├── _api/                    # API 警告和弃用处理
├── _import_utils.py         # 动态导入工具
├── _security.py             # 安全相关
├── agents.py                # Agent 动作和观察结果的 Schema 定义
├── caches.py                # 缓存接口
├── chat_history.py          # 聊天历史接口
├── chat_loaders.py          # 聊天加载器
├── chat_sessions.py         # 聊天会话
├── cross_encoders.py        # 交叉编码器接口
├── document_loaders/        # 文档加载器
├── documents/               # 文档抽象
├── embeddings.py            # 嵌入模型接口
├── env.py                   # 环境变量
├── example_selectors.py     # 示例选择器
├── exceptions.py            # 异常定义
├── globals.py               # 全局变量
├── indexing.py              # 索引相关
├── language_models/         # 语言模型接口
├── load/                    # 序列化加载
├── messages/                # 消息系统
├── output_parsers/          # 输出解析器
├── prompts/                 # 提示词模板
├── rate_limiters.py         # 限流器
├── retrievers.py             # 检索器接口
├── runnables/               # LCEL 核心 (重要!)
├── stores.py                 # 存储接口
├── structured_query.py       # 结构化查询
├── sys_info.py              # 系统信息
├── tools/                   # 工具抽象
├── tracers/                 # 追踪器
├── utils/                   # 工具函数
└── vectorstores/            # 向量存储接口
```

### 3.2 核心模块详解

#### 3.2.1 Messages (消息系统)

**文件**: `langchain_core/messages/`

LangChain 使用标准化消息格式支持各种聊天场景：

```python
# 导出的消息类型
from langchain_core.messages import (
    AIMessage,              # AI 助手消息
    AIMessageChunk,         # AI 消息块（流式）
    HumanMessage,           # 人类消息
    SystemMessage,          # 系统消息
    FunctionMessage,        # 函数调用结果消息
    ToolMessage,            # 工具执行结果消息
    ChatMessage,            # 通用聊天消息
    # 内容块类型
    TextContentBlock,       # 文本内容块
    ImageContentBlock,      # 图片内容块
    AudioContentBlock,      # 音频内容块
    VideoContentBlock,      # 视频内容块
    # 工具相关
    ToolCall,               # 工具调用请求
    ToolMessage,            # 工具执行结果
    # 工具函数
    trim_messages,          # 修剪消息
    filter_messages,        # 过滤消息
    merge_message_runs,     # 合并连续消息
    convert_to_openai_messages,  # 转换为 OpenAI 格式
)
```

**设计原理**:
- 使用内容块 (ContentBlock) 而非单一文本，支持多模态内容
- 标准化工具调用协议 (ToolCall/ToolMessage)
- 支持消息流式传输 (Chunk 后缀)

#### 3.2.2 Output Parsers (输出解析器)

**文件**: `langchain_core/output_parsers/`

```python
from langchain_core.output_parsers import (
    # 基础类
    BaseOutputParser,              # 基础解析器
    BaseGenerationOutputParser,     # 生成输出解析器
    # JSON 解析
    JsonOutputParser,              # JSON 输出解析器
    SimpleJsonOutputParser,        # 简单 JSON 解析
    # 列表解析
    ListOutputParser,             # 列表输出解析器
    CommaSeparatedListOutputParser,
    MarkdownListOutputParser,
    NumberedListOutputParser,
    # 工具输出解析
    JsonOutputToolsParser,         # JSON 工具输出解析
    JsonOutputKeyToolsParser,      # 指定键的 JSON 解析
    PydanticToolsParser,          # Pydantic 模型解析
    # Pydantic
    PydanticOutputParser,         # Pydantic 模型解析
    # 其他
    StrOutputParser,              # 字符串输出解析器
    XMLOutputParser,               # XML 解析器
)
```

#### 3.2.3 Prompts (提示词模板)

**文件**: `langchain_core/prompts/`

```python
from langchain_core.prompts import (
    # 基础类
    BasePromptTemplate,           # 基础提示模板
    # Chat 提示
    ChatPromptTemplate,           # Chat 提示模板
    MessagesPlaceholder,         # 消息占位符
    SystemMessagePromptTemplate,  # 系统消息模板
    HumanMessagePromptTemplate,   # 人类消息模板
    AIMessagePromptTemplate,      # AI 消息模板
    ChatMessagePromptTemplate,    # 通用聊天消息模板
    # Few-shot
    FewShotPromptTemplate,        # Few-shot 提示模板
    FewShotChatMessagePromptTemplate,
    FewShotPromptWithTemplates,
    # String
    StringPromptTemplate,         # 字符串提示模板
    PromptTemplate,               # 提示模板
    # Dict
    DictPromptTemplate,           # 字典提示模板
    # 工具函数
    format_document,              # 格式化文档
    load_prompt,                  # 加载提示模板
    validate_jinja2,              # 验证 Jinja2 模板
    jinja2_formatter,            # Jinja2 格式化
)
```

#### 3.2.4 Tools (工具抽象)

**文件**: `langchain_core/tools/`

```python
from langchain_core.tools import (
    BaseTool,                    # 基础工具类
    StructuredTool,              # 结构化工具
    Tool,                        # 简单工具装饰器
    # 工具相关
    tool_call,                   # 工具调用装饰器
    BaseToolkit,                # 工具包基类
)
```

**BaseTool 核心属性**:
```python
class BaseTool(RunnableSerializable):
    name: str                    # 工具名称
    description: str             # 工具描述
    args_schema: Type[BaseModel] # 参数 Schema
    return_direct: bool          # 是否直接返回结果
    verbose: bool                # 详细模式
    callbacks: Callbacks         # 回调
    tags: list[str]             # 标签
    metadata: dict[str, Any]     # 元数据
```

## 四、LCEL (LangChain Expression Language)

### 4.1 概述

LCEL 是 LangChain 的核心组合协议，允许将 Runnable 对象链接成复杂的处理管道。

**核心原则**:
- **统一接口**: 所有组件实现 Runnable 接口
- **流式支持**: 边处理边输出
- **批处理优化**: 并行处理多个输入
- **异步优先**: 原生异步支持

### 4.2 Runnable 核心接口

**文件**: `libs/core/langchain_core/runnables/base.py`

```python
class Runnable(ABC, Generic[Input, Output]):
    """可执行单元，可调用、批处理、流式、转换和组合"""

    # 核心方法
    def invoke(self, input: Input, config: RunnableConfig | None = None) -> Output:
        """同步调用，转换单个输入为输出"""

    async def ainvoke(self, input: Input, config: RunnableConfig | None = None) -> Output:
        """异步调用"""

    def batch(
        self, inputs: list[Input], config: RunnableConfig | None = None
    ) -> list[Output]:
        """批量同步转换"""

    def stream(
        self, input: Input, config: RunnableConfig | None = None
    ) -> Iterator[Output]:
        """流式输出"""

    async def astream(
        self, input: Input, config: RunnableConfig | None = None
    ) -> AsyncIterator[Output]:
        """异步流式输出"""

    def astream_events(
        self, input: Input, config: RunnableConfig | None = None, **kwargs: Any
    ) -> AsyncIterator[StreamEvent]:
        """流式事件，用于调试和监控"""

    # Schema 属性
    @property
    def input_schema(self) -> type[BaseModel]:
        """输入类型 Schema"""

    @property
    def output_schema(self) -> type[BaseModel]:
        """输出类型 Schema"""

    def config_schema(self, **kwargs: Any) -> type[BaseModel]:
        """配置类型 Schema"""
```

### 4.3 LCEL 模块结构

**位置**: `libs/core/langchain_core/runnables/`

```
runnables/
├── __init__.py          # 主入口
├── base.py              # Runnable 基类 (核心!)
├── config.py            # RunnableConfig 配置
├── schema.py            # 流式事件 Schema
├── utils.py             # 工具函数
├── branch.py            # 条件分支 RunnableBranch
├── router.py            # 路由 RunnableRouter
├── retry.py             # 重试逻辑
├── passthrough.py       # 直通 Runnable
├── fallback.py          # 回退逻辑
├── history.py           # 历史消息处理
├── graph.py             # 图结构
├── graph_ascii.py       # ASCII 图形
├── graph_mermaid.py     # Mermaid 图形
├── graph_png.py         # PNG 图形
├── configurable.py      # 可配置 Runnable
└── base.py              # 基础类
```

### 4.4 LCEL 核心组件

#### 4.4.1 RunnableBranch (条件分支)

**文件**: `libs/core/langchain_core/runnables/branch.py`

```python
class RunnableBranch(RunnableSerializable[Input, Output]):
    """根据条件选择分支"""

    branches: Sequence[tuple[Runnable[Input, bool], Runnable[Input, Output]]]
    """(条件, Runnable) 对列表"""

    default: Runnable[Input, Output]
    """默认分支"""

# 使用示例
branch = RunnableBranch(
    (lambda x: isinstance(x, str), lambda x: x.upper()),
    (lambda x: isinstance(x, int), lambda x: x + 1),
    lambda x: "unknown"
)
branch.invoke("hello")  # "HELLO"
branch.invoke(5)        # 6
```

#### 4.4.2 RouterRunnable (路由)

**文件**: `libs/core/langchain_core/runnables/router.py`

```python
class RouterRunnable(RunnableSerializable[RouterInput, Output]):
    """根据 key 路由到不同的 Runnable"""

    runnables: Mapping[str, Runnable[Any, Output]]

# 使用示例
router = RouterRunnable(runnables={
    "add": add_runnable,
    "square": square_runnable
})
router.invoke({"key": "square", "input": 3})  # 9
```

#### 4.4.3 RunnableConfig (配置)

**文件**: `libs/core/langchain_core/runnables/config.py`

```python
class RunnableConfig(TypedDict, total=False):
    """Runnable 配置"""

    tags: list[str]                    # 调用标签
    metadata: dict[str, Any]           # 元数据
    callbacks: Callbacks               # 回调
    run_name: str                      # 追踪名称
    max_concurrency: int | None       # 最大并发数
    recursion_limit: int               # 递归限制
    configurable: dict[str, Any]       # 可配置字段
    run_id: str                       # 运行 ID
   火炬: str | None                   # 父级运行 ID
```

### 4.5 LCEL 工具函数

**文件**: `libs/core/langchain_core/runnables/utils.py`

```python
# 类型定义
Input = TypeVar("Input", contravariant=True)   # 输入类型
Output = TypeVar("Output", covariant=True)     # 输出类型

# 核心工具函数
def accepts_run_manager(callable: Callable) -> bool:
    """检查函数是否接受 run_manager 参数"""

def accepts_config(callable: Callable) -> bool:
    """检查函数是否接受 config 参数"""

def gather_with_concurrency(n: int | None, *coros: Coroutine) -> list:
    """限制并发数的协程收集"""

def is_async_callable(func: Callable) -> bool:
    """检查是否为异步函数"""

def get_unique_config_specs(runnable: Runnable) -> list[ConfigurableFieldSpec]:
    """获取唯一配置规格"""
```

## 五、VectorStores (向量存储)

**文件**: `libs/core/langchain_core/vectorstores/`

```python
from langchain_core.vectorstores import (
    VectorStore,               # 向量存储基类
    VectorStoreRetriever,       # 向量检索器
    VST,                       # VectorStore 类型变量
    InMemoryVectorStore,        # 内存向量存储
)

# 核心方法
class VectorStore(ABC):
    """向量存储抽象"""

    def add_texts(
        self, texts: list[str], metadatas: list[dict] | None = None, **kwargs: Any
    ) -> list[str]:
        """添加文本到向量存储"""

    def similarity_search(
        self, query: str, k: int = 4, **kwargs: Any
    ) -> list[Document]:
        """相似性搜索"""

    def similarity_search_by_vector(
        self, embedding: list[float], k: int = 4, **kwargs: Any
    ) -> list[Document]:
        """基于向量相似性搜索"""

    def max_marginal_relevance_search(
        self, query: str, k: int = 4, fetch_k: int = 20, **kwargs: Any
    ) -> list[Document]:
        """最大边际相关性搜索"""
```

## 六、Callbacks (回调系统)

**文件**: `libs/core/langchain_core/callbacks/`

```python
from langchain_core.callbacks import (
    # 管理器
    CallbackManager,                # 回调管理器
    AsyncCallbackManager,           # 异步回调管理器
    # 特定管理器
    CallbackManagerForLLMRun,       # LLM 运行回调
    CallbackManagerForChainRun,     # 链运行回调
    CallbackManagerForToolRun,      # 工具运行回调
    CallbackManagerForRetrieverRun,# 检索器回调
    # Handler
    BaseCallbackHandler,            # 基础回调处理器
    AsyncCallbackHandler,           # 异步回调处理器
    StdOutCallbackHandler,         # 标准输出
    FileCallbackHandler,            # 文件输出
    StreamingStdOutCallbackHandler, # 流式输出
    # 工具
    adispatch_custom_event,         # 异步调度自定义事件
    dispatch_custom_event,          # 同步调度自定义事件
)
```

## 七、Agents (代理系统)

**文件**: `libs/core/langchain_core/agents.py`

```python
# Agent 动作
class AgentAction(Serializable):
    """代表 Agent 执行的单个动作"""

    tool: str                      # 工具名称
    tool_input: str | dict         # 工具输入
    log: str                       # 日志信息

class AgentFinish(Serializable):
    """Agent 完成，返回最终结果"""

    return_values: dict            # 返回值
    log: str                       # 日志

class AgentStep(Serializable):
    """Agent 执行步骤"""

    action: AgentAction            # 执行的动作
    observation: str              # 观察结果
```

**Agent 工作流程**:
1. 给定提示词，Agent 使用 LLM 请求要执行的动作
2. Agent 执行动作，获取观察结果
3. 将观察结果返回给 LLM 以生成下一个动作
4. 达到停止条件时，返回最终结果

## 八、Partners (第三方集成)

**位置**: `libs/partners/`

LangChain 团队维护的官方集成：

| 包名 | 描述 |
|------|------|
| `langchain-openai` | OpenAI GPT 模型 |
| `langchain-anthropic` | Anthropic Claude 模型 |
| `langchain-ollama` | 本地 Ollama 模型 |
| `langchain-groq` | Groq 推理平台 |
| `langchain-mistralai` | Mistral AI 模型 |
| `langchain-deepseek` | DeepSeek 模型 |
| `langchain-fireworks` | Fireworks AI |
| `langchain-huggingface` | Hugging Face 模型 |
| `langchain-chroma` | Chroma 向量存储 |
| `langchain-qdrant` | Qdrant 向量存储 |
| `langchain-nomic` | Nomic 嵌入 |
| `langchain-exa` | Exa 搜索 |
| `langchain-openrouter` | OpenRouter 聚合 |
| `langchain-perplexity` | Perplexity AI |
| `langchain-xai` | xAI Grok 模型 |

## 九、版本发布历史

| 版本 | 发布日期 | 描述 |
|------|----------|------|
| langchain==1.2.13 | 2026-03-19 | 最新稳定版 |
| langchain-core==1.2.20 | 2026-03-18 | 核心库更新 |
| langchain-anthropic==1.4.0 | 2026-03-17 | Anthropic 集成更新 |

## 十、架构设计原则

### 10.1 分层设计

```
用户层 (langchain / langchain_v1)
    ↓ 调用
集成层 (partners/*)
    ↓ 实现
核心抽象层 (langchain-core)
    ├── Runnable 接口 (LCEL)
    ├── Messages 消息协议
    ├── Tools 工具协议
    └── VectorStores 向量存储接口
    ↓ 使用
第三方依赖 (OpenAI, Anthropic, etc.)
```

### 10.2 核心设计模式

1. **接口抽象**: 所有核心组件都有抽象基类
2. **动态导入**: 使用 `__getattr__` 实现延迟加载
3. **泛型类型**: 广泛使用 TypeVar 实现类型安全
4. **Pydantic 模型**: 使用 Pydantic 进行数据验证
5. **TypedDict 配置**: 使用 TypedDict 而非 dataclass

### 10.3 LCEL 优势

- **统一接口**: 任何 Runnable 可相互组合
- **透明异步**: sync/async 自动转换
- **流式优先**: 所有组件支持流式输出
- **可观测性**: 内置回调和事件追踪
- **批处理**: 自动并行化优化

## 十一、关键技术点

### 11.1 延迟加载模式

```python
# langchain_core/_import_utils.py
def __getattr__(attr_name: str) -> object:
    """动态导入子模块，减少初始导入时间"""
    module_name = _dynamic_imports.get(attr_name)
    result = import_attr(attr_name, module_name, __spec__.parent)
    globals()[attr_name] = result
    return result
```

### 11.2 流式事件追踪

```python
class StreamEvent(TypedDict):
    """流式事件结构"""
    event: str                    # 事件类型
    name: str                     # Runnable 名称
    data: EventData               # 事件数据
    tags: list[str]               # 标签
    metadata: dict[str, Any]      # 元数据
```

### 11.3 配置合并策略

```python
def merge_configs(*configs: RunnableConfig) -> RunnableConfig:
    """深度合并配置，列表属性追加而非替换"""
    # tags 会合并: ["parent"] + ["child"] = ["parent", "child"]
```

## 十二、相关资源

- **官方文档**: https://docs.langchain.com/oss/python/langchain/overview
- **API 参考**: https://reference.langchain.com/python
- **LangGraph**: https://docs.langchain.com/oss/python/langgraph/overview (Agent 工作流框架)
- **LangSmith**: https://docs.langchain.com/langsmith/home (监控和调试)
- **LangChain Academy**: https://academy.langchain.com/ (官方课程)

## 十三、总结

LangChain 的架构采用**模块化单体仓库 (Monorepo)** 设计，通过 langchain-core 提供核心抽象，langchain-v1 提供高级实现，partners/ 提供第三方集成。LCEL 作为统一调用协议，使得各种组件可以灵活组合，构建复杂的 AI 应用。

**核心优势**:
- 统一接口简化了组件替换
- 流式支持提升用户体验
- 丰富的集成生态
- 活跃的开源社区

**设计亮点**:
- Pydantic 模型验证确保类型安全
- TypedDict 配置支持灵活覆盖
- 延迟加载优化导入性能
- 完善的回调系统支持可观测性