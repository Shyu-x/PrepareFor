# 开源 RAG 框架调研

> 调研日期：2026年3月22日
> 数据来源：GitHub API

---

## 一、主流 RAG 框架对比

### 1.1 LangChain

| 属性 | 详情 |
|------|------|
| **GitHub** | https://github.com/langchain-ai/langchain |
| **Star 数** | 130,572 |
| **语言** | Python (主)、Makefile、HTML、Dockerfile、JavaScript、Shell |
| **标签** | ai, anthropic, gemini, langchain, llm, openai, agents, ai-agents, chatgpt, enterprise, framework, generative-ai, multiagent, open-source, pydantic, rag, deepagents, langgraph |

**描述**：企业级 Agent 工程平台（The agent engineering platform）

**主要功能**：
- LLM 集成（OpenAI、Anthropic、Google Gemini 等）
- RAG（检索增强生成）完整实现
- Agent 框架，支持多 Agent 协作
- LangGraph：构建有状态的多 Actor 应用
- 企业级支持与生态

**架构特点**：
- LangChain Core：核心抽象与接口
- LangGraph：用于构建有状态的工作流和 Agent 系统
- LangServe：部署 LLM 应用为 REST API
- LangSmith：监控与调试平台

---

### 1.2 LlamaIndex

| 属性 | 详情 |
|------|------|
| **GitHub** | https://github.com/run-llama/llama_index |
| **Star 数** | 47,862 |
| **语言** | Python (主)、Jupyter Notebook、JavaScript、Tree-sitter Query、EdgeQL、HTML |
| **标签** | agents, application, data, fine-tuning, framework, llamaindex, llm, rag, vector-database, multi-agents |

**描述**：领先的文档 Agent 与 OCR 平台（The leading document agent and OCR platform）

**主要功能**：
- 文档理解与索引构建
- RAG 完整流水线
- 多模态文档处理（PDF、Word、图片 OCR）
- Agent 框架
- 数据连接器生态（支持 100+ 数据源）
- 向量数据库集成

**架构特点**：
- Data Framework：统一的数据抽象与连接
- Query Pipeline：灵活的查询工作流
- Agent Framework：构建文档理解 Agent
- Storage：向量索引与文档存储抽象

---

## 二、热门 RAG 相关仓库

### 2.1 RAG 框架搜索结果

| 排名 | 仓库 | 描述 | Star 数 |
|------|------|------|----------|
| 1 | HKUDS/RAG-Anything | All-in-One RAG Framework，多功能 RAG 框架 | - |
| 2 | OSU-NLP-Group/HippoRAG | NeurIPS'24 论文实现，受人类长期记忆启发的 RAG 框架，结合知识图谱与个性化 PageRank | - |
| 3 | gomate-community/TrustRAG | 强调可信输入、可信输出的 RAG 框架 | - |
| 4 | pinecone-io/canopy | Pinecone 提供商的 RAG 框架与上下文引擎（已归档） | - |
| 5 | SensAI-PT/RAGMeUp | 通用 RAG 框架，可将 LLM 能力应用于任意数据集 | - |

### 2.2 向量数据库搜索结果

| 排名 | 仓库 | 描述 | Star 数 |
|------|------|------|----------|
| 1 | milvus-io/milvus | 高性能、云原生的向量数据库，支持大规模向量 ANN 搜索 | - |
| 2 | qdrant/qdrant | 高性能、大规模向量数据库与搜索引擎，支持下一代 AI 应用 | - |
| 3 | weaviate/weaviate | 开源向量数据库，存储对象与向量，支持结构化过滤与云原生容错 | - |
| 4 | langchain4j/langchain4j | Java 语言的 LangChain 封装，简化 LLM 集成，支持 RAG、工具调用、Agent | - |
| 5 | alibaba/zvec | 轻量级、进程内高速向量数据库 | - |

---

## 三、技术栈分析

### 3.1 编程语言分布

| 框架 | 主要语言 | 配套语言 |
|------|----------|----------|
| LangChain | Python | JavaScript, Shell, HTML |
| LlamaIndex | Python | Jupyter Notebook, JavaScript, HTML |

> 两个框架均以 Python 为核心，这反映了 LLM/AI 生态中 Python 的主导地位。

### 3.2 核心功能对比

| 功能 | LangChain | LlamaIndex |
|------|-----------|------------|
| LLM 集成 | ✅ 全面 | ✅ 全面 |
| RAG 实现 | ✅ | ✅ 更专注于文档索引 |
| Agent 框架 | ✅ LangGraph 强大 | ✅ 文档 Agent 专长 |
| 多模态 | ✅ | ✅ OCR 能力强 |
| 数据源连接 | ✅ | ✅ 100+ 连接器 |
| 企业级支持 | ✅ LangSmith | 社区为主 |

---

## 四、选型建议

### 4.1 选择 LangChain 当：

- 需要构建复杂的 Agent 工作流
- 需要企业级支持与监控
- 需要多 Agent 协作系统
- 已有 LangGraph 相关经验

### 4.2 选择 LlamaIndex 当:

- 专注于文档理解与索引
- 需要强大的 OCR 能力
- 需要连接多种数据源
- 更喜欢 Jupyter 友好的开发方式

### 4.3 向量数据库选型:

| 场景 | 推荐 |
|------|------|
| 生产级大规模向量搜索 | Milvus |
| 高性能、易用性平衡 | Qdrant |
| 需要结合结构化数据 | Weaviate |
| Java 技术栈 | langchain4j |

---

## 五、参考链接

- LangChain: https://github.com/langchain-ai/langchain
- LlamaIndex: https://github.com/run-llama/llama_index
- Milvus: https://github.com/milvus-io/milvus
- Qdrant: https://github.com/qdrant/qdrant
- Weaviate: https://github.com/weaviate/weaviate
