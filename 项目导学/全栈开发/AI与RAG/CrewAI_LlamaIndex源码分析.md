# CrewAI 与 LlamaIndex 源码分析

## 一、项目概览

### 1.1 CrewAI

| 属性 | 值 |
|------|-----|
| **仓库** | crewAIInc/crewAI |
| **Star** | 46,828 |
| **描述** | Framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks. |
| **主语言** | Python (7.4 MB) |
| **其他语言** | JavaScript (83 KB), Jinja, CSS |
| **地址** | https://github.com/crewAIInc/crewAI |

### 1.2 LlamaIndex

| 属性 | 值 |
|------|-----|
| **仓库** | run-llama/llama_index |
| **Star** | 47,862 |
| **描述** | LlamaIndex is the leading document agent and OCR platform |
| **主语言** | Python (16.4 MB) |
| **其他语言** | Jupyter Notebook (9.8 MB), JavaScript, Makefile |
| **地址** | https://github.com/run-llama/llama_index |

---

## 二、架构对比

### 2.1 CrewAI 架构

```
crewAIInc/crewAI/
├── lib/crewai/              # 主代码库
│   └── src/crewai/
│       ├── agent.py         # Agent 主类
│       ├── crew.py          # Crew 编排类
│       ├── task.py          # Task 定义
│       ├── agents/         # Agent 执行器
│       │   ├── agent_builder/
│       │   │   └── base_agent.py      # BaseAgent 抽象类
│       │   ├── crew_agent_executor.py  # Agent 执行器
│       │   ├── step_executor.py        # 单步执行器
│       │   ├── parser.py               # 动作解析
│       │   └── cache/                  # 缓存处理
│       ├── crews/           # Crew 管理
│       ├── knowledge/       # 知识管理
│       ├── memory/          # 记忆管理
│       ├── tools/           # 工具系统
│       ├── llms/            # LLM 集成
│       ├── events/          # 事件系统
│       ├── rdf/             # RDF 处理
│       └── utilities/       # 工具函数
```

### 2.2 LlamaIndex 架构

```
run-llama/llama_index/
├── llama-index-core/llama_index/core/
│   ├── __init__.py
│   ├── agent/               # Agent 系统
│   │   ├── workflow/
│   │   │   ├── base_agent.py           # BaseWorkflowAgent
│   │   │   ├── multi_agent_workflow.py # 多Agent工作流
│   │   │   ├── function_agent.py       # 函数Agent
│   │   │   ├── react_agent.py           # ReAct Agent
│   │   │   ├── codeact_agent.py         # CodeAct Agent
│   │   │   └── workflow_events.py        # 工作流事件
│   │   ├── react/
│   │   │   ├── formatter.py             # ReAct格式化器
│   │   │   └── output_parser.py         # ReAct输出解析
│   │   └── workflow/
│   ├── indices/             # 索引系统
│   │   ├── base.py                      # BaseIndex
│   │   ├── vector_store/
│   │   │   └── base.py                  # VectorStoreIndex
│   │   ├── list/                       # ListIndex
│   │   ├── tree/                        # TreeIndex
│   │   └── knowledge_graph/             # KnowledgeGraphIndex
│   ├── chat_engine/          # 聊天引擎
│   ├── response_synthesizers/ # 响应合成器
│   ├── storage/               # 存储系统
│   ├── llms/                 # LLM 集成
│   └── tools/                # 工具系统
├── llama-index-integrations/  # 第三方集成
├── llama-index-packs/        # 预构建包
└── docs/                     # 文档
```

---

## 三、核心类设计对比

### 3.1 CrewAI Agent 体系

#### BaseAgent 抽象类

```python
# lib/crewai/src/crewai/agents/agent_builder/base_agent.py
class BaseAgent(BaseModel, ABC, metaclass=AgentMeta):
    """所有第三方Agent的抽象基类"""

    id: UUID4                              # Agent唯一标识
    role: str                              # Agent角色
    goal: str                              # Agent目标
    backstory: str                         # Agent背景故事
    cache: bool                            # 是否使用缓存
    verbose: bool                          # 详细输出模式
    max_rpm: int | None                   # 每分钟最大请求数
    allow_delegation: bool                # 允许委托任务
    tools: list[Any] | None              # 可用工具列表
    max_iter: int                         # 最大迭代次数
    llm: Any                              # 语言模型
    crew: Any                             # 所属Crew
    i18n: I18N                            # 国际化设置
    cache_handler: CacheHandler          # 缓存处理器
    tools_handler: ToolsHandler          # 工具处理器
    max_tokens: int                       # 最大生成token数
    knowledge_sources: list[BaseKnowledgeSource]  # 知识源
    security_config: SecurityConfig      # 安全配置
    apps: list[PlatformApp]              # 企业应用列表

    @abstractmethod
    def execute_task(
        task: Any,
        context: str | None = None,
        tools: list[BaseTool] | None = None
    ) -> str:
        """执行任务的抽象方法"""
```

#### CrewAgentExecutor 执行器

```python
# lib/crewai/src/crewai/agents/crew_agent_executor.py
class CrewAgentExecutor:
    """处理Agent执行流程，包括LLM交互、工具执行和记忆管理"""

    # 核心执行流程：
    # 1. 构建提示词
    # 2. 调用LLM
    # 3. 解析LLM响应
    # 4. 执行工具调用
    # 5. 处理结果并决定下一步
```

#### StepExecutor 单步执行器

```python
# lib/crewai/src/crewai/agents/step_executor.py
class StepExecutor:
    """执行单个计划步骤，实现Plan-and-Act模式"""

    # 执行模式（Plan-and-Act, arxiv 2503.09572）：
    # 1. 从todo + context构建消息
    # 2. 调用LLM一次（带或不带原生工具）
    # 3. 如果有工具调用 → 执行并返回工具结果
    # 4. 如果是文本答案 → 直接返回
    # 无内部循环 - 恢复由PlannerObserver负责
```

### 3.2 LlamaIndex Agent 体系

#### BaseWorkflowAgent 抽象类

```python
# llama-index-core/llama_index/core/agent/workflow/base_agent.py
class BaseWorkflowAgent(BaseModel):
    """基于工作流的Agent基类"""

    name: str = DEFAULT_AGENT_NAME
    description: str = DEFAULT_AGENT_DESCRIPTION
    max_iterations: int = DEFAULT_MAX_ITERATIONS
    llm: LLM                              # 语言模型
    memory: BaseMemory                    # 记忆
    tools: list[BaseTool]                # 可用工具
    prompt_mixin: PromptMixin            # 提示词混合

    # 核心方法
    @abstractmethod
    async def run(self, ctx: Context, ...): ...

    @abstractmethod
    async def stream(self, ctx: Context, ...): ...
```

#### 多Agent工作流

```python
# llama-index-core/llama_index/core/agent/workflow/multi_agent_workflow.py
class MultiAgentWorkflow:
    """支持多Agent协作和转交的工作流"""

    # 支持Agent之间的转交（handoff）
    # 使用事件驱动的工作流机制
```

#### Agent 类型

```python
# llama-index-core/llama_index/core/agent/__init__.py
from llama_index.core.agent.workflow.function_agent import FunctionAgent
from llama_index.core.agent.workflow.multi_agent_workflow import AgentWorkflow
from llama_index.core.agent.workflow.react_agent import ReActAgent
from llama_index.core.agent.workflow.codeact_agent import CodeActAgent
from llama_index.core.agent.workflow.base_agent import BaseWorkflowAgent

# FunctionAgent: 函数调用Agent
# ReActAgent: ReAct (Reasoning + Acting) Agent
# CodeActAgent: 代码执行Agent
# AgentWorkflow: 多Agent工作流
```

---

## 四、任务与索引体系

### 4.1 CrewAI Task 体系

```python
# lib/crewai/src/crewai/task.py
class Task(BaseModel):
    """任务定义类"""

    description: str                      # 任务描述
    expected_output: str                  # 期望输出
    agent: Agent | None                   # 分配的Agent
    tools: list[BaseTool] | None         # 任务专用工具
    async_execute: bool                  # 异步执行
    context: list[Task] | None           # 上下文任务
    config: dict[str, Any] | None        # 任务配置
    output_format: OutputFormat          # 输出格式
```

### 4.2 LlamaIndex Index 体系

```python
# llama-index-core/llama_index/core/indices/base.py
class BaseIndex(Generic[IS], ABC):
    """所有索引的基类"""

    index_struct_cls: Type[IS]

    def __init__(
        self,
        nodes: Optional[Sequence[BaseNode]] = None,
        objects: Optional[Sequence[IndexNode]] = None,
        index_struct: Optional[IS] = None,
        storage_context: Optional[StorageContext] = None,
        callback_manager: Optional[CallbackManager] = None,
        transformations: Optional[List[TransformComponent]] = None,
        show_progress: bool = False,
    ):

# 索引类型
class VectorStoreIndex(BaseIndex[IndexDict]):    # 向量索引
class ListIndex(BaseIndex):                      # 列表索引
class TreeIndex(BaseIndex):                      # 树形索引
class KnowledgeGraphIndex(BaseIndex):            # 知识图谱索引
```

---

## 五、设计模式对比

### 5.1 CrewAI 设计模式

| 模式 | 实现 |
|------|------|
| **角色扮演** | Agent.role + Agent.backstory |
| **层级编排** | Crew → Agent → Task |
| **工具执行** | CrewAgentExecutor + ToolsHandler |
| **记忆管理** | Memory + UnifiedMemory |
| **缓存机制** | CacheHandler |
| **事件驱动** | EventBus + EventListener |

### 5.2 LlamaIndex 设计模式

| 模式 | 实现 |
|------|------|
| **工作流驱动** | Workflow + Context + Step |
| **索引抽象** | BaseIndex + VectorStoreIndex |
| **检索器模式** | BaseRetriever |
| **响应合成** | ResponseSynthesizer |
| **记忆管理** | ChatMemoryBuffer |
| **工具适配** | FunctionTool + ToolOutput |

---

## 六、关键差异

| 维度 | CrewAI | LlamaIndex |
|------|--------|------------|
| **核心定位** | 多Agent协作框架 | 文档检索与Agent平台 |
| **Agent设计** | 角色+目标+背景 | 工作流+状态 |
| **编排方式** | Crew层级编排 | 事件驱动工作流 |
| **索引系统** | 无内置索引 | 多种索引类型 |
| **工具集成** | 工具注册机制 | FunctionTool |
| **记忆系统** | UnifiedMemory | ChatMemoryBuffer |
| **生态重点** | Agent协作 | 文档处理+RAG |

---

## 七、核心执行流程

### 7.1 CrewAI 执行流程

```
Crew.kickoff()
  ↓
CrewOutput = 收集所有Agent结果
  ↓
对于每个Agent:
  Agent.execute_task()
    ↓
    CrewAgentExecutor.run()
      ↓
      1. 构建Prompt (role + goal + backstory + tools)
      ↓
      2. LLM.chat() 调用
      ↓
      3. 解析响应 (AgentAction / AgentFinish)
      ↓
      4. 如果是工具调用 → ToolsHandler.execute()
      ↓
      5. 检查是否完成或达到最大迭代
```

### 7.2 LlamaIndex 执行流程

```
AgentWorkflow.run()
  ↓
Context 创建 + 初始事件
  ↓
@step 装饰的异步方法循环
  ↓
对于每个step:
  1. 获取当前状态
  ↓
  2. 调用 LLM
  ↓
  3. 解析工具调用
  ↓
  4. 执行工具
  ↓
  5. 更新Context状态
  ↓
  6. 发送StopEvent结束
```

---

## 八、代码规模对比

| 指标 | CrewAI | LlamaIndex |
|------|--------|------------|
| **Python代码** | ~7.4 MB | ~16.4 MB |
| **核心模块数** | ~15个主要模块 | ~20个核心模块 |
| **集成数量** | 较少 | 丰富（200+集成） |
| **文档规模** | 中等 | 大量（9.8 MB notebooks） |

---

## 九、总结

### CrewAI 特点

1. **Agent中心设计**：以Agent角色和协作 为核心
2. **Crew编排**：通过Crew类实现多Agent层级编排
3. **工具驱动**：丰富的工具系统和执行器
4. **记忆共享**：支持Agent间的统一记忆
5. **安全配置**：内置安全指纹和配置

### LlamaIndex 特点

1. **索引优先**：强大的向量索引和检索能力
2. **工作流引擎**：基于事件的异步工作流
3. **模块化设计**：清晰的抽象层次和接口
4. **丰富集成**：支持200+第三方集成
5. **文档智能**：专业的文档处理和RAG支持

---

## 十、参考资料

- CrewAI 仓库: https://github.com/crewAIInc/crewAI
- LlamaIndex 仓库: https://github.com/run-llama/llama_index
- CrewAI 文档: https://docs.crewai.com
- LlamaIndex 文档: https://docs.llamaindex.ai