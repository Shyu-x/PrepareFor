# LangChain 实战完全指南

## 一、LangChain 核心概念

LangChain 是一个用于构建 LLM 应用的开源框架，提供了6大核心模块来简化和增强 AI 应用的开发流程。

### 1.1 LangChain 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        LangChain 架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Model I/O   │  │  Retrieval  │  │   Chains    │            │
│  │ 模型输入输出│  │    检索     │  │    链式调用  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agents    │  │   Memory    │  │ Callbacks   │            │
│  │    代理    │  │    记忆     │  │   回调     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 二、Model I/O 模块

Model I/O 是 LangChain 的核心模块，负责与 LLM 模型的交互。

### 2.1 模型初始化与配置

```python
# langchain_model_io.py
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage

# 初始化 ChatGPT 模型
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,              # 控制随机性，0-2之间
    max_tokens=2000,             # 最大生成的 token 数量
    streaming=True,               # 启用流式输出
    api_key="your-api-key"
)

# 初始化 Claude 模型
from langchain_anthropic import ChatAnthropic

claude = ChatAnthropic(
    model="claude-3-5-sonnet-20241022",
    temperature=0.7,
    max_tokens=1024
)
```

### 2.2 消息构建与对话

```python
# langchain_messages.py
from langchain.schema import HumanMessage, SystemMessage, AIMessage

# 构建对话消息
messages = [
    # 系统消息：定义 AI 的角色和行为
    SystemMessage(content="""
        你是一位资深的技术架构师，专注于微服务架构设计。
        你的职责是：
        1. 分析业务需求
        2. 设计可扩展的系统架构
        3. 提供最佳实践建议
    """),

    # 用户消息：实际的对话内容
    HumanMessage(content="如何设计一个高可用的微服务架构？"),

    # AI 消息：可以包含历史上下文
    AIMessage(content="""
        设计高可用微服务架构需要考虑以下核心要素：
        1. 服务注册与发现
        2. 负载均衡策略
        3. 熔断和限流机制
        4. 分布式链路追踪
    """),

    # 新的用户消息
    HumanMessage(content="能否详细解释熔断机制的实现？")
]

# 调用模型
response = llm.invoke(messages)
print(response.content)
```

### 2.3 提示词模板

```python
# langchain_prompt_template.py
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.prompts.chat import SystemMessagePromptTemplate, HumanMessagePromptTemplate

# 简单的提示词模板
template = PromptTemplate(
    input_variables=["product", "audience"],
    template="""
    为{audience}写一个关于{product}的产品介绍。

    要求：
    1. 突出核心价值
    2. 使用简洁易懂的语言
    3. 包含具体的使用场景
    """
)

# 渲染后的实际提示词
prompt = template.format(
    product="智能文档处理系统",
    audience="企业级客户"
)
print(prompt)

# Chat 提示词模板（更结构化的方式）
chat_template = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(
        "你是一位专业的{domain}专家。"
    ),
    HumanMessagePromptTemplate.from_template(
        "{question}"
    )
])

# 使用结构化模板
formatted_prompt = chat_template.format(
    domain="金融科技",
    question="区块链在供应链金融中的应用有哪些？"
)
```

### 2.4 输出解析器

```python
# langchain_output_parser.py
from langchain.output_parsers import PydanticOutputParser, CommaSeparatedListOutputParser
from langchain.pydantic_v1 import BaseModel, Field
from typing import List

# 定义输出结构
class ProductInfo(BaseModel):
    """产品信息结构化输出"""
    product_name: str = Field(description="产品名称")
    features: List[str] = Field(description="产品特性列表")
    price: float = Field(description="产品价格")
    target_audience: str = Field(description="目标用户群体")

# 创建输出解析器
parser = PydanticOutputParser(pydantic_object=ProductInfo)

# 使用解析器处理输出
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
chain = prompt | llm | parser

result = chain.invoke({
    "domain": "在线教育",
    "question": "介绍一款适合K12教育的AI辅导产品"
})
print(result)
# 输出: ProductInfo(product_name='...', features=['...'], price=..., target_audience='...')
```

## 三、Retrieval 检索模块

Retrieval 模块提供了 RAG（检索增强生成）所需的各种组件。

### 3.1 文档加载与处理

```python
# langchain_document_loaders.py
from langchain_community.document_loaders import (
    PyPDFLoader,          # PDF 加载器
    UnstructuredHTMLLoader, # HTML 加载器
    CSVLoader,            # CSV 加载器
    Docx2txtLoader,       # Word 文档加载器
    TextLoader            # 文本文件加载器
)

# PDF 文档加载
pdf_loader = PyPDFLoader("document.pdf")
pdf_documents = pdf_loader.load()

# HTML 文档加载
html_loader = UnstructuredHTMLLoader("article.html")
html_documents = html_loader.load()

# 批量处理多个文档
from langchain_community.document_loaders import DirectoryLoader

directory_loader = DirectoryLoader(
    path="./docs",
    glob="**/*.pdf",      # 匹配所有 PDF 文件
    loader_cls=PyPDFLoader
)
documents = directory_loader.load()
print(f"加载了 {len(documents)} 个文档")
```

### 3.2 文档分块策略

```python
# langchain_text_splitters.py
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter
)

# 按字符分割（简单但可能破坏语义）
char_splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=1000,      # 每个块的最大字符数
    chunk_overlap=200     # 块之间的重叠（保持上下文连续性）
)

# 递归字符分割（更智能，优先保持段落完整）
recursive_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", "。", "！", "？", " ", ""],
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

# 按 Token 分割（最准确，需要 tiktoken）
token_splitter = TokenTextSplitter(
    chunk_size=500,       # 每个块的 token 数
    chunk_overlap=50
)

# 分割文档
chunks = recursive_splitter.split_documents(documents)
print(f"分割成了 {len(chunks)} 个块")

# 直接分割文本
text = "这是一段很长的文本..."
text_chunks = recursive_splitter.split_text(text)
```

### 3.3 向量化与嵌入

```python
# langchain_embeddings.py
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# OpenAI 嵌入
openai_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key="your-api-key"
)

# HuggingFace 本地嵌入（免费，无需 API key）
huggingface_embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)

# 嵌入单个文本
query_embedding = openai_embeddings.embed_query("什么是 RAG？")
print(f"嵌入维度: {len(query_embedding)}")

# 批量嵌入多个文本
texts = ["文本1", "文本2", "文本3"]
embeddings = openai_embeddings.embed_documents(texts)
print(f"嵌入数量: {len(embeddings)}")
```

### 3.4 向量存储

```python
# langchain_vectorstore.py
from langchain_community.vectorstores import Chroma, FAISS, Milvus
from langchain_openai import OpenAIEmbeddings

# 初始化嵌入模型
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Chroma 向量数据库（轻量级，适合本地开发）
vectorstore = Chroma.from_documents(
    documents=chunks,           # 分割后的文档块
    embedding=embeddings,       # 嵌入模型
    persist_directory="./chroma_db"  # 持久化目录
)

# FAISS 向量数据库（Facebook 开源，适合大规模数据）
faiss_store = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings
)

# 保存和加载
faiss_store.save_local("faiss_index")
loaded_store = FAISS.load_local("faiss_index", embeddings)

# 持久化 Chroma
vectorstore.persist()
```

### 3.5 相似性检索

```python
# langchain_retriever.py

# 基本的相似性检索
results = vectorstore.similarity_search(
    query="RAG 技术的工作原理是什么？",
    k=3  # 返回最相关的 3 个文档块
)

for doc in results:
    print(f"内容: {doc.page_content[:200]}...")
    print(f"来源: {doc.metadata}")

# 带分数的相似性检索
results_with_scores = vectorstore.similarity_search_with_score(
    query="LangChain 的使用方法",
    k=5
)

for doc, score in results_with_scores:
    print(f"相似度分数: {score:.4f}")
    print(f"内容: {doc.page_content[:100]}...")

# MMR（最大边际相关性）检索 - 增加多样性
mmr_results = vectorstore.max_marginal_relevance_search(
    query="微服务架构设计",
    k=5,
    fetch_k=20  # 从更多候选中选择
)
```

## 四、Chains 链式调用模块

Chains 模块允许我们将多个组件串联起来，形成复杂的工作流程。

### 4.1 LLMChain 基础链

```python
# langchain_llm_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# 定义提示词模板
template = """
你是一位产品经理。请根据以下信息创建产品需求文档：

产品名称：{product_name}
目标用户：{target_audience}
核心功能：{core_features}

请包含以下章节：
1. 产品概述
2. 用户故事
3. 功能需求
4. 非功能需求
"""

prompt = PromptTemplate(
    input_variables=["product_name", "target_audience", "core_features"],
    template=template
)

# 创建 LLMChain
llm = ChatOpenAI(model="gpt-4", temperature=0.7)
chain = LLMChain(llm=llm, prompt=prompt)

# 执行链
result = chain.invoke({
    "product_name": "智能客服系统",
    "target_audience": "电商平台商家",
    "core_features": "多轮对话、意图识别、知识库问答"
})

print(result["text"])
```

### 4.2 简单顺序链 SequentialChain

```python
# langchain_sequential_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SimpleSequentialChain

# 第一个链：生成故事大纲
outline_template = """为一部{genre}题材的电影创作故事大纲。

要求：
1. 设定时代背景
2. 塑造主要人物（至少3个）
3. 设计起承转合
"""
outline_prompt = PromptTemplate.from_template(outline_template)
outline_chain = LLMChain(llm=llm, prompt=outline_prompt, output_key="outline")

# 第二个链：基于大纲生成剧本
script_template = """基于以下故事大纲，创作电影剧本：

{outline}

要求：
1. 使用标准剧本格式
2. 包含对白和场景描述
3. 保持故事的完整性
"""
script_prompt = PromptTemplate.from_template(script_template)
script_chain = LLMChain(llm=llm, prompt=script_prompt, output_key="script")

# 组合成顺序链
sequential_chain = SimpleSequentialChain(
    chains=[outline_chain, script_chain],
    verbose=True
)

# 执行链
result = sequential_chain.invoke("科幻")
print(result["output"])
```

### 4.3 复杂顺序链

```python
# langchain_conversational_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chains import SequentialChain

# 链1：需求分析
analysis_template = """分析以下产品需求，输出技术可行性评估：

需求：{requirement}

请从以下维度分析：
1. 技术复杂度
2. 开发周期估算
3. 潜在技术风险
"""
analysis_prompt = PromptTemplate.from_template(analysis_template)
analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt, output_key="analysis")

# 链2：架构设计
architecture_template = """基于以下需求分析和可行性评估，设计系统架构：

需求分析：{analysis}

请提供：
1. 系统架构图（文字描述）
2. 核心模块划分
3. 技术选型建议
"""
architecture_prompt = PromptTemplate.from_template(architecture_template)
architecture_chain = LLMChain(llm=llm, prompt=architecture_prompt, output_key="architecture")

# 链3：项目计划
planning_template = """基于以下架构设计，制定开发计划：

架构设计：{architecture}

请提供：
1. 里程碑计划
2. 团队分工建议
3. 关键风险应对策略
"""
planning_prompt = PromptTemplate.from_template(planning_template)
planning_chain = LLMChain(llm=llm, prompt=planning_prompt, output_key="planning")

# 组合复杂顺序链
overall_chain = SequentialChain(
    chains=[analysis_chain, architecture_chain, planning_chain],
    input_variables=["requirement"],
    output_variables=["analysis", "architecture", "planning"],
    verbose=True
)

# 执行链
result = overall_chain.invoke({
    "requirement": "构建一个支持日活100万用户的实时协作编辑平台"
})

print("=== 需求分析 ===")
print(result["analysis"])
print("\n=== 架构设计 ===")
print(result["architecture"])
print("\n=== 开发计划 ===")
print(result["planning"])
```

### 4.4 RouterChain 路由链

```python
# langchain_router_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

# 定义不同类型的处理链
general_template = """你是一个通用助手。请回答以下问题：

{question}
"""
general_chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(general_template))

technical_template = """你是一个技术专家。请用专业的视角分析以下技术问题：

{question}

请包含：
1. 技术原理
2. 实现方案
3. 最佳实践
"""
technical_chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(technical_template))

creative_template = """你是一个创意顾问。请以创意的方式回应：

{question}
"""
creative_chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(creative_template))

# 路由决策
router_template = """分析以下用户问题，决定最合适的处理方式：

问题：{question}

选项：
- general：通用问题，闲聊或简单问答
- technical：技术问题，需要专业分析
- creative：创意问题，需要创新思维

只输出一个词：general、technical 或 creative。
"""
router_prompt = PromptTemplate.from_template(router_template)
router_chain = LLMChain(llm=llm, prompt=router_prompt)

# 根据路由选择链
def route_chain(question: str) -> str:
    """路由函数"""
    route = router_chain.invoke({"question": question})
    route_type = route["text"].strip().lower()

    if "technical" in route_type:
        return technical_chain.invoke({"question": question})["text"]
    elif "creative" in route_type:
        return creative_chain.invoke({"question": question})["text"]
    else:
        return general_chain.invoke({"question": question})["text"]

# 使用路由
result = route_chain("如何设计一个高可用的数据库架构？")
print(result)
```

## 五、Agents 代理模块

Agents 是 LangChain 的核心特性，允许 LLM 自主决策和执行操作。

### 5.1 Agent 架构原理

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent 执行流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  用户输入 │ ─▶ │ LLM 决策 │ ─▶ │ 执行工具 │ ─▶ │ 返回结果 │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                        │                │                       │
│                        ▼                ▼                       │
│                   ┌──────────┐    ┌──────────┐                  │
│                   │ 选择工具 │    │ 观察结果 │                  │
│                   └──────────┘    └──────────┘                  │
│                        │                │                       │
│                        └───────┬────────┘                       │
│                                │                                │
│                         循环直到完成                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 工具定义

```python
# langchain_tools.py
from langchain.agents import tool
from langchain_core.tools import Tool
from langchain.utilities import SerpAPIWrapper, WikipediaAPIWrapper
from langchain_community.tools import DuckDuckGoSearchRun

# 使用 @tool 装饰器定义工具
@tool
def calculate_roi(investment: str, return_value: str) -> str:
    """计算投资回报率。

    参数:
        investment: 投资金额（数字）
        return_value: 回报金额（数字）

    返回:
        ROI 百分比和投资分析
    """
    try:
        inv = float(investment)
        ret = float(return_value)
        roi = ((ret - inv) / inv) * 100
        return f"ROI: {roi:.2f}%。投资{'盈利' if roi > 0 else '亏损'}。"
    except Exception as e:
        return f"计算错误: {str(e)}"

@tool
def get_weather(location: str) -> str:
    """获取指定位置的天气预报。

    参数:
        location: 城市名称，如"北京"、"上海"

    返回:
        天气预报信息
    """
    # 模拟天气查询
    weather_data = {
        "北京": "晴，25°C，适宜外出",
        "上海": "多云，28°C，有阵雨",
        "深圳": "大雨，30°C，台风预警"
    }
    return weather_data.get(location, f"未找到 {location} 的天气信息")

# 使用 SerpAPI 进行搜索
search = SerpAPIWrapper(serpapi_api_key="your-api-key")

# 使用 DuckDuckGo 搜索（免费）
duckduckgo_search = DuckDuckGoSearchRun()

# 将搜索功能封装成 Tool
search_tool = Tool(
    name="web_search",
    func=duckduckgo_search.run,
    description="""用于搜索最新资讯、新闻和实时信息。
    当需要查询当前事件、新闻或不确定的信息时使用。
    输入应该是完整的搜索查询语句。"""
)

# Wikipedia 搜索
wikipedia = WikipediaAPIWrapper()
wiki_tool = Tool(
    name="wikipedia",
    func=wikipedia.run,
    description="""用于查询 Wikipedia 上的百科知识。
    适合查询历史人物、概念定义、科学术语等。
    输入应该是要查询的主题词。"""
)

# 自定义搜索工具
@tool
def vector_search(query: str) -> str:
    """在知识库中搜索相关信息。

    参数:
        query: 搜索查询语句

    返回:
        最相关的 3 条知识库内容
    """
    from langchain_community.vectorstores import Chroma
    from langchain_openai import OpenAIEmbeddings

    embeddings = OpenAIEmbeddings()
    db = Chroma(persist_directory="./knowledge_base", embedding_function=embeddings)

    docs = db.similarity_search(query, k=3)
    return "\n\n".join([f"来源: {d.metadata}\n内容: {d.page_content}" for d in docs])
```

### 5.3 Agent 类型与实现

```python
# langchain_agents.py
from langchain.agents import (
    AgentExecutor,
    create_openai_functions_agent,
    create_react_agent,
    create_self_ask_agent
)
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4", temperature=0)

# 定义工具列表
tools = [calculate_roi, get_weather, search_tool, wiki_tool]

# 创建 ReAct Agent（推理+行动）
react_prompt = PromptTemplate.from_template("""你是一个智能助手，可以帮助你解决复杂问题。

你有权使用以下工具：
{tools}

使用以下格式：
Thought: 思考需要做什么
Action: 工具名称
Action Input: 工具输入
Observation: 观察结果
... (可以重复 Thought/Action/Action Input/Observation)
Thought: 我现在知道最终答案
Final Answer: 最终答案

用户问题：{input}

{agent_scratchpad}
""")

react_agent = create_react_agent(llm, tools, react_prompt)
react_executor = AgentExecutor.from_agent_and_tools(
    agent=react_agent,
    tools=tools,
    verbose=True,
    max_iterations=10
)

# 执行 ReAct Agent
result = react_executor.invoke({
    "input": "北京今天的天气如何？如果我投资100万，到年底能获得150万回报，ROI是多少？"
})
print(result["output"])

# 创建 OpenAI Functions Agent（更现代的方式）
functions_prompt = PromptTemplate.from_template("""你是一个专业的投资顾问助手。

你可以使用的工具：
{tools}

用户：{input}

请专业地回答用户的问题，如有需要请使用工具进行计算或查询。
""")

functions_agent = create_openai_functions_agent(llm, tools, functions_prompt)
functions_executor = AgentExecutor.from_agent_and_tools(
    agent=functions_agent,
    tools=tools,
    verbose=True
)

result = functions_executor.invoke({
    "input": "我的投资组合包括：股票投资50万，回报30万；债券投资30万，回报8万。计算每项投资的ROI。"
})
```

### 5.4 ConversationalRetrievalChain 对话检索

```python
# langchain_conversational_rag.py
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

# 初始化向量数据库
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./docs_vectorstore", embedding_function=embeddings)

# 初始化 LLM
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 创建对话记忆
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"  # 指定输出中哪个键的值存入记忆
)

# 创建对话检索链
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    memory=memory,
    combine_docs_chain_kwargs={
        "prompt": PromptTemplate.from_template("""基于以下参考文档回答用户问题。

参考文档：
{context}

用户问题：{question}

请用简洁专业的语言回答，如果文档中没有相关信息，请说明。
""")
    },
    verbose=True
)

# 对话循环
while True:
    query = input("你: ")
    if query.lower() in ["exit", "quit", "退出"]:
        break

    result = qa_chain.invoke({"question": query})
    print(f"助手: {result['answer']}")
```

## 六、Memory 记忆模块

Memory 模块为 Agent 和 Chain 提供持久化对话历史的能力。

### 6.1 记忆类型对比

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory 类型对比                             │
├───────────────┬─────────────────────────────────────────────────┤
│   Memory 类型  │                    特点                         │
├───────────────┼─────────────────────────────────────────────────┤
│ BufferMemory  │ 简单缓冲区，存储所有历史消息                      │
│ BufferWindow  │ 只保留最近 N 条对话，超出则丢弃                    │
│ TokenBuffer   │ 按 Token 数量限制，超出则丢弃最早的                │
│ Conversation  │ 对话摘要，节省 Token，支持摘要压缩                │
│   VectorStore │ 使用向量检索，只召回相关记忆                      │
│   Entity      │ 提取并存储实体信息，构建知识图谱                   │
└───────────────┴─────────────────────────────────────────────────┘
```

### 6.2 各种 Memory 实现

```python
# langchain_memory.py
from langchain.memory import (
    ConversationBufferMemory,
    ConversationBufferWindowMemory,
    ConversationTokenBufferMemory,
    ConversationSummaryMemory,
    VectorStoreRetrieverMemory
)
from langchain_openai import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings

llm = ChatOpenAI(model="gpt-4")

# 1. 简单缓冲区 - 保存所有历史
buffer_memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

# 2. 窗口缓冲区 - 只保留最近 3 轮对话
window_memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    k=3,  # 只保留最近 3 轮
    return_messages=True
)

# 3. Token 缓冲区 - 限制 Token 数量
token_memory = ConversationTokenBufferMemory(
    llm=llm,
    max_token_limit=2000,  # 超过 2000 token 则清除最早的
    memory_key="chat_history",
    return_messages=True
)

# 4. 摘要记忆 - 自动生成对话摘要
summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="chat_history",
    return_messages=True,
    output_key="summary"  # 摘要输出键
)

# 5. 向量存储记忆 - 语义检索相关记忆
vectorstore_memory = VectorStoreRetrieverMemory(
    vectorstore=Chroma(persist_directory="./memory_store",
                       embedding=OpenAIEmbeddings()),
    memory_key="chat_history",
    return_messages=True,
    k=5  # 返回 5 条最相关的记忆
)

# 在 Chain 中使用 Memory
from langchain.chains import ConversationChain

conversation = ConversationChain(
    llm=llm,
    memory=ConversationBufferWindowMemory(k=2),
    verbose=True
)

# 对话示例
conversation.invoke("我想学习 Python 编程")
conversation.invoke("有什么推荐的学习资源吗？")
conversation.invoke("Python 和 JavaScript 有什么区别？")

# 查看记忆内容
print(conversation.memory.load_memory_variables({}))
```

### 6.3 自定义 Memory 存储

```python
# langchain_custom_memory.py
from langchain.memory import BaseMemory
from langchain.schema import BaseMessage
from typing import List, Dict, Any
import json
from datetime import datetime

class CustomFileMemory(BaseMemory):
    """自定义文件记忆实现"""

    def __init__(self, file_path: str = "./chat_history.json"):
        self.file_path = file_path
        self.chat_history = self._load_history()

    def _load_history(self) -> List[Dict]:
        """从文件加载历史"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def _save_history(self):
        """保存历史到文件"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.chat_history, f, ensure_ascii=False, indent=2)

    @property
    def memory_variables(self) -> List[str]:
        return ["chat_history"]

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        return {"chat_history": self.chat_history}

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, Any]) -> None:
        """保存对话上下文"""
        self.chat_history.append({
            "timestamp": datetime.now().isoformat(),
            "user": inputs.get("input", ""),
            "assistant": outputs.get("output", ""),
        })
        self._save_history()

    def clear(self) -> None:
        """清空记忆"""
        self.chat_history = []
        self._save_history()
```

## 七、Callbacks 回调模块

Callbacks 用于监控和记录 LangChain 执行的各个阶段。

### 7.1 内置 Callback 处理器

```python
# langchain_callbacks.py
from langchain.callbacks import (
    StdOutCallbackHandler,      # 控制台输出
    FileCallbackHandler,        # 文件记录
    TraculationCallbackHandler, # LangSmith 追踪
    TokenCountingCallbackHandler # Token 计数
)
from langchain_openai import ChatOpenAI
from langchain.callbacks.manager import CallbackManager

# 1. 控制台输出回调
stdout_callback = StdOutCallbackHandler()

llm = ChatOpenAI(callbacks=[stdout_callback])
response = llm.invoke("介绍一下人工智能的发展历程")

# 2. 带文件输出的回调
import logging

# 设置文件日志
file_handler = logging.FileHandler("./langchain.log")
file_handler.setLevel(logging.INFO)
file_callback = FileCallbackHandler(file_handler)

# 3. Token 计数回调
token_counter = TokenCountingCallbackHandler()
llm_with_counting = ChatOpenAI(callbacks=[token_counter])

# 4. 组合多个 Callback
callback_manager = CallbackManager(handlers=[stdout_callback, token_counter])

llm = ChatOpenAI(callbacks=callback_manager)
response = llm.invoke("解释一下什么是机器学习")

# 打印 Token 使用统计
print(f"输入 Token: {token_counter.input_tokens}")
print(f"输出 Token: {token_counter.output_tokens}")
print(f"总计: {token_counter.total_tokens}")
```

### 7.2 自定义 Callback

```python
# langchain_custom_callback.py
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import AgentAction, AgentFinish, LLMResult
from typing import Any, Dict, List
from datetime import datetime

class CustomCallbackHandler(BaseCallbackHandler):
    """自定义回调处理器"""

    def __init__(self, log_file: str = "./custom_log.txt"):
        self.log_file = log_file
        self.agent_actions: List[Dict] = []

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs
    ) -> None:
        """LLM 开始调用时触发"""
        self._log(f"[LLM Start] 提示词数量: {len(prompts)}")
        self._log(f"[LLM Start] 第一个提示词: {prompts[0][:100]}...")

    def on_llm_end(self, response: LLMResult, **kwargs) -> None:
        """LLM 调用结束时触发"""
        if response.generations:
            self._log(f"[LLM End] 生成了 {len(response.generations[0])} 个响应")

    def on_agent_action(
        self, action: AgentAction, **kwargs
    ) -> None:
        """Agent 执行动作时触发"""
        self.agent_actions.append({
            "tool": action.tool,
            "tool_input": action.tool_input,
            "log": action.log
        })
        self._log(f"[Agent Action] 使用工具: {action.tool}")
        self._log(f"[Agent Action] 输入: {action.tool_input}")

    def on_agent_finish(
        self, finish: AgentFinish, **kwargs
    ) -> None:
        """Agent 完成时触发"""
        self._log(f"[Agent Finish] 最终输出: {finish.return_values['output'][:200]}")
        self._log(f"[Agent Finish] 总共执行了 {len(self.agent_actions)} 个动作")

    def _log(self, message: str):
        """写入日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {message}\n")

# 使用自定义回调
custom_handler = CustomCallbackHandler(log_file="./agent_execution.log")

agent_executor = AgentExecutor.from_agent_and_tools(
    agent=functions_agent,
    tools=tools,
    callbacks=[custom_handler],
    verbose=True
)

result = agent_executor.invoke({
    "input": "帮我计算：如果投资100万，年化收益率是15%，5年后的总收益是多少？"
})

print(f"\n执行摘要：共执行 {len(custom_handler.agent_actions)} 个动作")
```

## 八、LangChain Expression Language (LCEL)

LCEL 是 LangChain 现代化的语法，允许用 | 操作符串联组件。

### 8.1 LCEL 基础语法

```python
# langchain_lcel_basics.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

llm = ChatOpenAI(model="gpt-4")
prompt = PromptTemplate.from_template("用一句话解释{concept}：")
output_parser = StrOutputParser()

# 使用 LCEL | 操作符串联
chain = prompt | llm | output_parser

# 执行链
result = chain.invoke({"concept": "什么是区块链？"})
print(result)

# LCEL 等价于：
# step1 = prompt.format_prompt(concept="什么是区块链？")
# step2 = llm.invoke(step1)
# step3 = output_parser.invoke(step2)
```

### 8.2 LCEL 高级特性

```python
# langchain_lcel_advanced.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain_core.runnables import (
    RunnablePassthrough,
    RunnableBranch,
    RunnableParallel
)

llm = ChatOpenAI(model="gpt-4", temperature=0)

# 1. 并行执行 - RunnableParallel
chain_parallel = RunnableParallel(
    summary=PromptTemplate.from_template("用50字概括：{text}") | llm | StrOutputParser(),
    keywords=PromptTemplate.from_template("提取5个关键词：{text}") | llm | StrOutputParser(),
    questions=PromptTemplate.from_template("提出3个思考问题：{text}") | llm | StrOutputParser()
)

result = chain_parallel.invoke({"text": "人工智能正在改变各行各业的运作方式..."})
print("摘要:", result["summary"])
print("关键词:", result["keywords"])
print("问题:", result["questions"])

# 2. 条件分支 - RunnableBranch
branch = RunnableBranch(
    # 条件1：主题是技术类
    (
        lambda x: "技术" in x.get("topic", ""),
        PromptTemplate.from_template("详细解释技术趋势：{topic}") | llm | StrOutputParser()
    ),
    # 条件2：主题是商业类
    (
        lambda x: "商业" in x.get("topic", ""),
        PromptTemplate.from_template("分析商业模式：{topic}") | llm | StrOutputParser()
    ),
    # 默认分支
    PromptTemplate.from_template("一般介绍：{topic}") | llm | StrOutputParser()
)

chain_with_branch = {"topic": RunnablePassthrough()} | branch

result1 = chain_with_branch.invoke({"topic": "人工智能技术"})
result2 = chain_with_branch.invoke({"topic": "电子商务商业"})

# 3. 动态输入 - RunnablePassthrough
dynamic_chain = (
    {"topic": RunnablePassthrough(), "style": lambda x: x.get("style", "专业")}
    | PromptTemplate.from_template("用{style}风格解释{topic}")
    | llm
    | StrOutputParser()
)

result = dynamic_chain.invoke({"topic": "量子计算", "style": "通俗易懂"})
```

### 8.3 RAG 完整 LCEL 实现

```python
# langchain_lcel_rag.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain_core.runnables import RunnableParallel

# 初始化组件
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./knowledge_base", embedding_function=embeddings)
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 创建检索器
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)

# RAG 提示词模板
rag_prompt = PromptTemplate.from_template("""基于以下参考文档回答问题。如果文档中没有相关信息，请说明。

参考文档：
{context}

问题：{question}

回答：""")

# 完整的 RAG 链
rag_chain = (
    RunnableParallel(
        # 并行执行：检索上下文 + 传递问题
        {"context": retriever, "question": RunnablePassthrough()}
    )
    | rag_prompt
    | llm
    | StrOutputParser()
)

# 执行 RAG 查询
result = rag_chain.invoke("LangChain 的主要特性有哪些？")
print(result)

# 带来源追踪的 RAG 链
class DebugRAGChain:
    def __init__(self, retriever, llm):
        self.retriever = retriever
        self.llm = llm

    def invoke(self, question):
        # 检索阶段
        docs = self.retriever.get_relevant_documents(question)

        # 构建上下文
        context = "\n\n".join([d.page_content for d in docs])

        # 生成答案
        prompt = f"基于以下文档回答：\n\n{context}\n\n问题：{question}"
        answer = self.llm.invoke(prompt)

        return {
            "question": question,
            "context": context,
            "docs": docs,
            "answer": answer,
            "sources": [d.metadata for d in docs]
        }

debug_rag = DebugRAGChain(retriever, llm)
result = debug_rag.invoke("LangChain 支持哪些 LLM 提供商？")
print(f"答案：{result['answer']}")
print(f"来源：{result['sources']}")
```

## 九、综合实战项目

### 9.1 智能客服系统

```python
# langchain_customer_service.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import tool
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 定义工具
@tool
def get_order_status(order_id: str) -> str:
    """查询订单状态。

    参数:
        order_id: 订单号

    返回:
        订单状态信息
    """
    # 模拟数据库查询
    orders = {
        "ORD001": {"status": "已发货", "delivery": "顺丰 SF123456"},
        "ORD002": {"status": "处理中", "delivery": "预计3天后发货"},
        "ORD003": {"status": "已完成", "delivery": "2024-01-15 签收"}
    }
    return str(orders.get(order_id, "未找到订单"))

@tool
def get_product_info(product_name: str) -> str:
    """查询产品信息。

    参数:
        product_name: 产品名称

    返回:
        产品详细信息
    """
    products = {
        "iPhone 15": "苹果旗舰手机，A17芯片，6.1英寸屏幕，起售价5999元",
        "MacBook Pro": "苹果专业笔记本，M3 Pro芯片，14英寸Liquid视网膜XDR屏幕",
        "AirPods Pro": "苹果无线耳机，主动降噪，空间音频"
    }
    return products.get(product_name, "未找到该产品")

# 初始化
llm = ChatOpenAI(model="gpt-4", temperature=0.7)
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(persist_directory="./faq_vectorstore", embedding_function=embeddings)
retriever = vectorstore.as_retriever(k=3)

# 工具列表
tools = [get_order_status, get_product_info]

# 创建 Agent
agent_prompt = PromptTemplate.from_template("""你是一个热情专业的电商客服助手。

你可以使用的工具：
{tools}

请根据用户的问题，选择合适的工具来回答。
如果有多个相关信息，请综合整理后回答。

用户问题：{input}

记住：保持友好专业的态度，及时准确地回答用户问题。
""")

agent = create_openai_functions_agent(llm, tools, agent_prompt)
agent_executor = AgentExecutor.from_agent_and_tools(
    agent=agent,
    tools=tools,
    verbose=True
)

# 运行客服
queries = [
    "我的订单 ORD001 什么时候能到？",
    "iPhone 15 和 MacBook Pro 一起买有优惠吗？",
    "你们的退货政策是什么？"
]

for query in queries:
    print(f"\n用户: {query}")
    result = agent_executor.invoke({"input": query})
    print(f"助手: {result['output']}")
```

### 9.2 文档分析助手

```python
# langchain_document_analyst.py
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.runnables import RunnableParallel

class DocumentAnalyst:
    """文档分析助手"""

    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)
        self.embeddings = OpenAIEmbeddings()
        self._load_and_index()

    def _load_and_index(self):
        """加载并索引文档"""
        # 加载 PDF
        loader = PyPDFLoader(self.pdf_path)
        documents = loader.load()

        # 分割文档
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = splitter.split_documents(documents)

        # 创建向量存储
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory="./doc_index"
        )

        self.chunks_count = len(chunks)
        print(f"已索引 {self.chunks_count} 个文档块")

    def summarize(self, query: str = "文章主要讲述了什么？") -> str:
        """文档摘要"""
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 5}
        )

        # 获取相关上下文
        docs = retriever.get_relevant_documents(query)
        context = "\n\n".join([d.page_content for d in docs])

        # 生成摘要
        summary_prompt = PromptTemplate.from_template("""请对以下文档内容进行摘要：

{context}

请提取：
1. 核心主题
2. 主要论点
3. 关键结论

摘要：""")

        summary_chain = summary_prompt | self.llm | StrOutputParser()
        return summary_chain.invoke({"context": context})

    def ask_question(self, question: str) -> str:
        """文档问答"""
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 5}
        )

        rag_prompt = PromptTemplate.from_template("""基于以下文档内容回答问题。如果文档中没有相关信息，请说明。

文档内容：
{context}

问题：{question}

请给出准确、详细的回答，并注明信息来源。
""")

        rag_chain = (
            RunnableParallel(
                {"context": retriever, "question": RunnablePassthrough()}
            )
            | rag_prompt
            | self.llm
            | StrOutputParser()
        )

        return rag_chain.invoke(question)

    def extract_key_points(self) -> list:
        """提取关键要点"""
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 10}
        )

        # 获取所有文档块
        all_docs = self.vectorstore.similarity_search("", k=self.chunks_count)
        context = "\n\n".join([d.page_content for d in all_docs[:10]])  # 取前10块

        key_points_prompt = PromptTemplate.from_template("""从以下文档中提取10个关键要点：

{context}

关键要点（格式：1. ... 2. ...）：""")

        key_points_chain = key_points_prompt | self.llm | StrOutputParser()
        result = key_points_chain.invoke({"context": context})

        return result.strip().split("\n")

# 使用示例
from langchain_core.runnables import RunnablePassthrough

analyst = DocumentAnalyst("technical_document.pdf")

print("=== 文档摘要 ===")
print(analyst.summarize())

print("\n=== 关键要点 ===")
for point in analyst.extract_key_points():
    print(point)

print("\n=== 问答 ===")
answer = analyst.ask_question("文档中提到的核心技术方案是什么？")
print(answer)
```

## 十、最佳实践与性能优化

### 10.1 性能优化策略

```python
# langchain_optimization.py

# 1. 批量处理 - 减少 API 调用次数
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# 批量嵌入（比逐个嵌入快 10 倍）
texts = [f"文档内容 {i}" for i in range(1000)]
# 一次性嵌入所有文本
doc_embeddings = embeddings.embed_documents(texts)

# 2. 缓存结果
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

# 启用 LLM 缓存
set_llm_cache(InMemoryCache())

# 3. 异步执行
import asyncio
from langchain_openai import ChatOpenAI

async def async_invoke(chain, queries):
    """异步批量调用"""
    tasks = [chain.ainvoke(q) for q in queries]
    return await asyncio.gather(*tasks)

llm = ChatOpenAI(model="gpt-4")
chain = prompt | llm | StrOutputParser()

# 执行异步批量调用
results = asyncio.run(async_invoke(chain, ["问题1", "问题2", "问题3"]))
```

### 10.2 错误处理与重试

```python
# langchain_error_handling.py
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain_openai import ChatOpenAI

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def robust_llm_call(prompt: str) -> str:
    """带重试的 LLM 调用"""
    try:
        llm = ChatOpenAI(model="gpt-4")
        return llm.invoke(prompt)
    except Exception as e:
        print(f"调用失败: {e}")
        raise

# 自定义回调处理错误
from langchain.callbacks.base import BaseCallbackHandler

class ErrorHandlingCallback(BaseCallbackHandler):
    """错误处理回调"""

    def on_llm_error(self, error, **kwargs) -> None:
        print(f"LLM 调用错误: {error}")
        # 发送告警通知
        # notify_admin(f"LLM Error: {error}")
```

## 十一、总结

LangChain 提供了构建 LLM 应用的完整工具链：

| 模块 | 功能 | 典型场景 |
|------|------|----------|
| **Model I/O** | 模型调用、提示词管理、输出解析 | 所有 LLM 应用 |
| **Retrieval** | 文档加载、分块、嵌入、向量检索 | RAG 系统 |
| **Chains** | 组件串联、工作流编排 | 多步骤处理 |
| **Agents** | 自主决策、工具调用 | 智能助手 |
| **Memory** | 对话历史、上下文管理 | 对话系统 |
| **Callbacks** | 监控、日志、性能追踪 | 生产环境 |

### 学习路径建议

1. **入门阶段**：掌握 Model I/O 和 Prompt Template
2. **进阶阶段**：学习 Chains 和基本 Agent
3. **实战阶段**：深入 RAG 实现和自定义 Agent
4. **生产阶段**：优化性能、错误处理、监控告警
