# RAG 技术完全指南

## 一、RAG 原理与核心概念

### 1.1 什么是 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合信息检索与文本生成的技术架构。RAG 的核心思想是：当大语言模型（LLM）需要回答问题时，先从外部知识库中检索相关信息，然后将这些信息作为上下文提供给 LLM，辅助生成更准确、更可靠的答案。

RAG 技术解决了大语言模型的三大核心局限：

| 局限性 | 说明 | RAG 如何解决 |
|--------|------|-------------|
| **知识非实时** | LLM 的知识有截止日期，无法获取最新信息 | 通过检索实时从外部知识库获取最新数据 |
| **私有知识缺失** | LLM 不了解企业的私有业务知识 | 将私有文档导入知识库，检索后供 LLM 使用 |
| **幻觉问题** | LLM 可能生成看似合理但错误的内容 | 提供真实来源作为参考，减少胡说八道 |

### 1.2 RAG 工作流程

一个经典的 RAG 系统（Naive RAG）工作流程分为两个阶段：

```
┌─────────────────────────────────────────────────────────────────┐
│                        离线阶段（索引）                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 数据加载 │ -> │ 文本切块 │ -> │  向量嵌入 │ -> │ 向量存储 │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        在线阶段（检索+生成）                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 用户查询 │ -> │  相似检索 │ -> │  上下文组装 │ -> │ LLM 生成 │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**离线阶段（Indexing）**：
1. **数据加载**：从各种数据源（PDF、Word、数据库、网页等）加载文档
2. **文本切块**：将长文档分割成较小的文本块（chunks）
3. **向量嵌入**：使用 Embedding 模型将文本块转换为向量
4. **向量存储**：将向量存储到向量数据库中

**在线阶段（Retrieval & Generation）**：
1. **用户查询**：接收用户的问题
2. **相似检索**：将用户问题转换为向量，在向量数据库中检索最相似的文本块
3. **上下文组装**：将检索到的文本块与用户问题组装成 prompt
4. **LLM 生成**：将组装好的 prompt 发送给 LLM，生成最终答案

### 1.3 RAG 的核心价值

```
                    ┌──────────────────┐
                    │   大语言模型 LLM   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌────────────┐     ┌────────────┐     ┌────────────┐
   │ 知识检索   │     │ 实时知识   │     │ 可溯源答案 │
   │ External   │     │ Up-to-date │     │ Traceable  │
   │ Knowledge  │     │ Knowledge  │     │ Answers    │
   └────────────┘     └────────────┘     └────────────┘
```

RAG 的核心价值在于：

1. **知识可控**：企业知识不需训练即可被 LLM 使用
2. **成本效益**：无需为每个知识领域单独微调模型
3. **可追溯性**：答案有据可查，便于人工审核
4. **实时更新**：知识库更新后立即生效，无需重新训练

---

## 二、RAG 架构演进

RAG 技术从 2020 年提出以来，经历了三个主要阶段的演进：

### 2.1 Naive RAG（朴素 RAG）

Naive RAG 是最早期的 RAG 架构，也是当前最广泛使用的基本范式。它遵循经典的"检索-读取-生成"三步流程：

```
用户查询 → 向量检索 → Top-k 选取 → 上下文组装 → LLM 生成 → 答案输出
```

**Naive RAG 的局限性**：

| 问题 | 描述 |
|------|------|
| **索引质量差** | 文本切块方式不合理导致关键信息丢失 |
| **检索精度低** | 单一向量检索无法准确捕捉查询意图 |
| **上下文混淆** | 检索结果与问题相关性不高，引入干扰信息 |
| **生成质量不稳定** | 噪声上下文导致 LLM 产生幻觉 |

### 2.2 Advanced RAG（高级 RAG）

Advanced RAG 在 Naive RAG 基础上引入了多种优化策略，主要集中在预检索和后检索两个阶段：

**预检索优化（Pre-retrieval）**：
- **块优化（Chunk Optimization）**：调整切块大小和策略
- **查询扩展（Query Expansion）**：将单一查询扩展为多个相关查询
- **查询重写（Query Rewriting）**：将自然语言查询转换为检索友好的表达

**后检索优化（Post-retrieval）**：
- **重排序（Reranking）**：对初步检索结果进行二次排序
- **上下文压缩（Context Compression）**：压缩冗余信息，保留关键内容
- **混合检索（Hybrid Search）**：结合向量检索与关键词检索

```
                    Advanced RAG 流程图

用户查询 → 查询重写 → 向量检索 → 重排序 → 上下文压缩 → LLM 生成
                    ↑                              │
                    └──────── 块优化 ◄─────────────┘
```

### 2.3 Modular RAG（模块化 RAG）

Modular RAG 是当前最新的 RAG 范式，它将 RAG 系统分解为多个独立的功能模块，可以灵活组合和替换：

**核心模块**：

| 模块 | 功能 | 可选方案 |
|------|------|----------|
| **检索器模块** | 从知识库中检索相关信息 | 密集检索、稀疏检索、混合检索 |
| **重排序模块** | 对检索结果进行排序 | BM25、Reranker 模型 |
| **生成器模块** | 基于上下文生成答案 | GPT-4、Claude、本地 LLM |
| **记忆模块** | 存储对话历史 | 向量数据库、图数据库 |
| **评估模块** | 评估检索和生成质量 | RAGAS、Trulens |

**Modular RAG 的优势**：
- 模块可独立替换，无需修改整体架构
- 支持多跳推理（Multi-hop Reasoning）
- 支持自适应检索（Self-RAG）
- 支持迭代优化

### 2.4 Agentic RAG（智能体 RAG）

Agentic RAG 是将 RAG 与 Agent 技术结合的新一代架构，LLM 作为 Agent 自主决定检索策略：

```
┌─────────────────────────────────────────────────────────────┐
│                      Agentic RAG 架构                       │
│                                                             │
│   ┌─────────┐                                              │
│   │  Agent   │◄─────────┐                                  │
│   │ (LLM)   │          │                                  │
│   └────┬────┘          │                                  │
│        │               │ 决定                              │
│        ▼               │ 行动                              │
│   ┌─────────┐    ┌─────────────┐                         │
│   │  规划   │───►│   工具调用   │                         │
│   └─────────┘    └──────┬──────┘                         │
│                         │                                  │
│        ┌────────────────┼────────────────┐                │
│        │                │                │                │
│        ▼                ▼                ▼                │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐            │
│   │ 知识库  │     │  Web    │     │  工具   │            │
│   │ 检索   │     │  搜索   │     │   API  │            │
│   └─────────┘     └─────────┘     └─────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Agentic RAG 的特点**：
- LLM 自主判断是否需要检索
- 支持多步推理和工具调用
- 动态选择最优检索策略
- 能够处理复杂的多跳问题

---

## 三、RAG 关键技术

### 3.1 Embedding（向量嵌入）

#### 3.1.1 Embedding 原理

Embedding 是将文本转换为稠密向量的技术，使得语义相似的文本在向量空间中距离更近。

**Embedding 的核心作用**：

```python
# Embedding 核心原理示意
# 将文本映射到向量空间，语义相似的文本向量距离更近

文本: "如何学习 Python 编程？"
向量: [0.23, -0.45, 0.78, ..., 0.12]  # 512 维或更高维度

文本: "Python 入门教程"
向量: [0.25, -0.43, 0.80, ..., 0.15]  # 与上一条向量距离较近

文本: "今天天气怎么样？"
向量: [-0.65, 0.21, -0.33, ..., 0.88]  # 与前两条距离很远
```

#### 3.1.2 主流 Embedding 模型

| 模型 | 维度 | 特点 | 适用场景 |
|------|------|------|----------|
| **BGE-M3** | 1024 | 国产旗舰，支持多语言和混合检索 | 通用场景，中文优化 |
| **Text2Vec** | 1024 | 中文语义匹配效果好 | 中文问答系统 |
| **M3E** | 768 | 高效，支持中英文 | 轻量级部署 |
| **Jina AI** | 1024 | 支持 30+ 语言 | 多语言场景 |
| **OpenAI Ada-002** | 1536 | 通用可靠 | 快速原型 |

#### 3.1.3 Embedding 实战

```python
# 使用 BGE-M3 进行文本嵌入
from sentence_transformers import SentenceTransformer

# 加载模型
model = SentenceTransformer('BAAI/bge-m3')

# 对文档进行嵌入
documents = [
    "Python 是一种高级编程语言",
    "JavaScript 主要用于 Web 开发",
    "机器学习是人工智能的分支"
]

# 生成文档向量
doc_embeddings = model.encode(documents)

# 对查询进行嵌入
query = "Python 编程入门"
query_embedding = model.encode([query])

# 计算相似度
from sklearn.metrics.pairwise import cosine_similarity
similarity = cosine_similarity(query_embedding, doc_embeddings)
# 结果: [0.89, 0.34, 0.21]  - Python 相关性最高
```

### 3.2 文本分块（Chunking）

#### 3.2.1 分块策略

文本分块是将长文档分割成较小片段的过程，分块策略直接影响检索效果：

| 分块策略 | 块大小 | 优点 | 缺点 |
|----------|--------|------|------|
| **固定大小分块** | 500-1000 tokens | 简单快速 | 可能切断语义 |
| **句子级分块** | 1-3 句话 | 语义完整 | 块数量过多 |
| **段落级分块** | 1-3 段落 | 语义连贯 | 块大小不一 |
| **递归分块** | 可变大小 | 自适应边界 | 实现复杂 |
| **语义分块** | 基于 embedding | 语义完整 | 计算成本高 |

#### 3.2.2 分块优化策略

```python
# 分块优化策略实现

# 1. 带重叠的分块 - 减少边界信息丢失
def chunk_with_overlap(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap  # 重叠部分
    return chunks

# 2. 语义分块 - 基于句子边界
def semantic_chunking(text, max_tokens=500):
    sentences = text.split('。')  # 按句子分割
    chunks = []
    current_chunk = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = len(sentence) // 2  # 粗略估算
        if current_tokens + sentence_tokens > max_tokens:
            chunks.append(''.join(current_chunk))
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    if current_chunk:
        chunks.append(''.join(current_chunk))
    return chunks

# 3. 结构感知分块 - 保留文档结构
def structured_chunking(document):
    """
    假设 document 是包含标题和内容的结构化文档
    """
    chunks = []
    for section in document:
        title = section['title']
        content = section['content']
        # 按标题-内容作为一个块
        chunks.append({
            'title': title,
            'content': f"{title}\n\n{content}",
            'metadata': section.get('metadata', {})
        })
    return chunks
```

#### 3.2.3 分块大小选择

选择合适的块大小需要考虑以下因素：

```python
# 块大小选择指南

CHUNK_SIZE_GUIDE = {
    # 块大小 -> 适用场景
    "100-300 tokens": [
        "细粒度检索，适合精确匹配",
        "代码检索",
        "FAQ 问答系统"
    ],
    "500-800 tokens": [
        "平衡粒度和完整性",
        "通用文档问答",
        "技术文档理解"
    ],
    "1000+ tokens": [
        "需要更多上下文",
        "复杂推理任务",
        "长文档摘要生成"
    ]
}
```

### 3.3 向量检索

#### 3.3.1 检索算法类型

| 检索类型 | 算法 | 特点 | 适用场景 |
|----------|------|------|----------|
| **稀疏检索** | BM25, TF-IDF | 基于关键词匹配 | 精确术语匹配 |
| **稠密检索** | ANN, HNSW | 基于语义向量 | 语义相似匹配 |
| **混合检索** | BM25 + ANN | 结合两者优点 | 通用场景 |

#### 3.3.2 HNSW 算法原理

HNSW（Hierarchical Navigable Small World）是一种高效的近似最近邻搜索算法：

```python
# HNSW 算法核心概念

"""
HNSW 是一种分层索引结构：

Layer 3:    ○ ────────── ○          (最上层，跨度大)
           /               \
Layer 2:  ○ ─── ○ ─── ○ ─── ○       (中层)
         /      \     /      \
Layer 1: ○ ───── ○ ── ○ ───── ○     (底层，跨度小)

特点：
- 分层结构：上层跨度大用于快速定位，下层精确搜索
- 复杂度：O(log n) 时间复杂度
- 内存占用较高，但查询速度快
"""

# 使用示例
import hnswlib

# 创建索引
dim = 128  # 向量维度
max_elements = 10000  # 最大元素数

index = hnswlib.Index(space='cosine', dim=dim)
index.init_index(max_elements=max_elements, ef_construction=200, M=16)

# 添加向量
vectors = [[...], [...], ...]  # your vectors
index.add_items(vectors)

# 设置搜索参数
index.set_ef(50)  # 搜索范围，越大越精确但越慢

# 检索
query_vector = [...]
labels, distances = index.knn_query(query_vector, k=5)
```

#### 3.3.3 混合检索实现

```python
# 混合检索：结合 BM25 和向量检索

from rank_bm25 import BM25Okapi
import numpy as np

class HybridRetriever:
    def __init__(self, chunks, embedding_model):
        self.chunks = chunks
        self.embedding_model = embedding_model
        self.vector_store = None

        # 1. 构建 BM25 索引
        tokenized_chunks = [chunk.split() for chunk in chunks]
        self.bm25 = BM25Okapi(tokenized_chunks)

        # 2. 构建向量索引
        self._build_vector_index()

    def _build_vector_index(self):
        """构建向量索引"""
        embeddings = self.embedding_model.encode(self.chunks)
        # 使用 FAISS 或 Milvus 等向量数据库
        import faiss
        self.vector_store = faiss.IndexFlatIP(embeddings.shape[1])
        self.vector_store.add(embeddings)

    def search(self, query, top_k=5, alpha=0.5):
        """
        混合检索

        Args:
            query: 查询文本
            top_k: 返回数量
            alpha: 向量检索权重 (1-alpha 给 BM25)
        """
        # 1. BM25 检索
        tokenized_query = query.split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        bm25_scores = bm25_scores / (np.max(bm25_scores) + 1e-8)

        # 2. 向量检索
        query_embedding = self.embedding_model.encode([query])
        vector_scores, indices = self.vector_store.search(query_embedding, top_k)
        vector_scores = vector_scores[0] / (np.max(vector_scores) + 1e-8)

        # 3. 分数融合
        final_scores = alpha * vector_scores + (1 - alpha) * bm25_scores

        # 4. 返回 Top-k 结果
        top_indices = np.argsort(final_scores)[::-1][:top_k]
        return [(self.chunks[i], final_scores[i]) for i in top_indices]
```

#### 3.3.4 Rerank（重排序）

Rerank 模型对初步检索结果进行精细排序，显著提升相关性：

```python
# 使用 BGE-Reranker 进行重排序

from sentence_transformers import CrossEncoder

# 加载 reranker 模型
reranker = CrossEncoder('BAAI/bge-reranker-base')

def rerank_documents(query, documents, top_k=5):
    """
    对检索结果进行重排序

    Args:
        query: 查询文本
        documents: 初步检索到的文档列表
        top_k: 返回数量
    """
    # 构造查询-文档对
    pairs = [[query, doc] for doc in documents]

    # 计算相关性分数
    scores = reranker.predict(pairs)

    # 按分数排序
    ranked_indices = np.argsort(scores)[::-1][:top_k]

    return [(documents[i], scores[i]) for i in ranked_indices]

# 使用示例
initial_results = retriever.search("Python 异步编程", top_k=20)
final_results = rerank_documents("Python 异步编程", initial_results, top_k=5)
```

---

## 四、主流 RAG 框架对比

### 4.1 框架概览

| 框架 | 开发方 | 定位 | 上手难度 | 适用场景 |
|------|--------|------|----------|----------|
| **LangChain** | LangChain Inc. | 全能型开发框架 | 中等 | 快速原型、企业应用 |
| **LlamaIndex** | Jerry Liu | 数据连接框架 | 中等 | 数据密集型应用 |
| **Dify** | Dify.AI | 可视化平台 | 简单 | 低代码、快速部署 |
| **RAGFlow** | Infiniflow | 深度文档理解 | 中等 | 复杂文档处理 |
| **UltraRAG** | OpenBMB | 自动化 RAG | 简单 | 自动优化、微调 |

### 4.2 LangChain

**LangChain** 是目前最流行的 LLM 应用开发框架，提供了完整的 RAG 支持：

```python
# LangChain RAG 示例

from langchain.document_loaders import PDFPlumberLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# 1. 加载文档
loader = PDFPlumberLoader("document.pdf")
documents = loader.load()

# 2. 文本分割
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(documents)

# 3. 创建向量存储
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 4. 创建检索链
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5})
)

# 5. 查询
result = qa_chain({"query": "Python 异步编程的原理是什么？"})
print(result["result"])
```

**LangChain 特点**：
- 生态完善，集成丰富
- 灵活的 Prompt 模板
- 支持多种数据源
- 学习曲线中等

### 4.3 LlamaIndex

**LlamaIndex** 专注于数据连接和检索优化，更适合数据密集型应用：

```python
# LlamaIndex RAG 示例

from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index.node_parser import SimpleNodeParser
from llama_index.embeddings import HuggingFaceEmbedding
from llama_index.llms import OpenAI

# 1. 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 2. 解析节点
parser = SimpleNodeParser.from_defaults(chunk_size=500)
nodes = parser.get_nodes_from_documents(documents)

# 3. 创建嵌入
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-m3")

# 4. 构建索引
index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)

# 5. 创建查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=5,
    llm=OpenAI(model="gpt-4")
)

# 6. 查询
response = query_engine.query("Python 异步编程的原理是什么？")
print(response)
```

**LlamaIndex 特点**：
- 数据连接能力强
- 索引类型丰富
- 查询引擎优化
- 适合复杂检索场景

### 4.4 Dify

**Dify** 是一个开源的 LLM 应用开发平台，提供可视化的工作流编排：

**Dify 核心特点**：
- 低代码/无代码开发
- 可视化 Prompt 编排
- 支持多种模型
- 一键部署

**适用场景**：
- 快速构建 MVP
- 非技术团队
- 生产环境部署

### 4.5 RAGFlow

**RAGFlow** 是 Infiniflow 开发的开源 RAG 引擎，专注于深度文档理解：

**RAGFlow 核心特点**：

| 特性 | 说明 |
|------|------|
| **深度文档理解** | 支持 PDF、Word、Excel、PPT、图片等多种格式 |
| **模板化分块** | 提供多种智能分块模板 |
| **混合检索** | 结合向量检索和关键词检索 |
| **可解释性** | 分块可视化，支持人工干预 |
| **低幻觉** | 引用追溯，减少胡说八道 |

**RAGFlow 架构**：

```
┌─────────────────────────────────────────────────────────────┐
│                      RAGFlow 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│  数据输入层                                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ PDF │ │Word │ │Excel│ │PPT  │ │图片 │ │网页 │            │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │
├─────────────────────────────────────────────────────────────┤
│  文档理解层                                                   │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   OCR 识别      │  │   表格解析      │                   │
│  └─────────────────┘  └─────────────────┘                   │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   布局分析      │  │   语义分块      │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  检索层                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │向量检索  │  │BM25检索  │  │  重排序  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  生成层                                                       │
│  ┌─────────────────────────────────────────┐                │
│  │         LLM 生成 + 引用追溯             │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 框架对比总结

| 维度 | LangChain | LlamaIndex | Dify | RAGFlow | UltraRAG |
|------|-----------|-------------|------|---------|----------|
| **定位** | 全能框架 | 数据连接 | 可视化平台 | 文档理解 | 自动优化 |
| **上手难度** | 中等 | 中等 | 简单 | 中等 | 简单 |
| **文档理解** | 一般 | 良好 | 一般 | 优秀 | 良好 |
| **灵活性** | 高 | 高 | 中 | 中 | 高 |
| **可视化** | 一般 | 一般 | 优秀 | 优秀 | 优秀 |
| **微调支持** | 一般 | 一般 | 弱 | 弱 | 强大 |
| **适用对象** | 开发者 | 开发者 | 团队/产品 | 文档密集型 | 追求效果 |

---

## 五、RAG 实战搭建步骤

### 5.1 环境准备

```bash
# 创建虚拟环境
conda create -n rag_env python=3.11
conda activate rag_env

# 安装核心依赖
pip install langchain langchain-community
pip install llama-index
pip install sentence-transformers
pip install faiss-cpu  # 或 faiss-gpu
pip install rank-bm25
pip install chromadb  # 向量数据库
pip install openai
pip install python-dotenv
```

### 5.2 完整 RAG 系统搭建

```python
"""
RAG 系统完整实现
"""

import os
from typing import List, Dict
from dataclasses import dataclass
from abc import ABC, abstractmethod
import numpy as np

# ==================== 1. 数据模型 ====================

@dataclass
class Document:
    """文档数据模型"""
    content: str
    metadata: Dict[str, any]

@dataclass
class Chunk:
    """文本块数据模型"""
    content: str
    metadata: Dict[str, any]
    embedding: np.ndarray = None

# ==================== 2. 文本分割器 ====================

class TextSplitter:
    """文本分割器"""

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def split(self, text: str, metadata: Dict = None) -> List[Chunk]:
        """分割文本为块"""
        chunks = []
        start = 0
        metadata = metadata or {}

        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            chunks.append(Chunk(
                content=chunk_text,
                metadata={**metadata, "start": start, "end": end}
            ))

            start = end - self.overlap

        return chunks

# ==================== 3. 嵌入模型 ====================

class EmbeddingModel:
    """嵌入模型封装"""

    def __init__(self, model_name: str = "BAAI/bge-m3"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: List[str]) -> np.ndarray:
        """生成文本嵌入"""
        return self.model.encode(texts, normalize_embeddings=True)

    def similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """计算余弦相似度"""
        return np.dot(vec1, vec2)

# ==================== 4. 向量存储 ====================

class VectorStore:
    """向量存储封装"""

    def __init__(self, dimension: int, index_type: str = "flat"):
        import faiss
        self.dimension = dimension

        if index_type == "flat":
            self.index = faiss.IndexFlatIP(dimension)
        elif index_type == "hnsw":
            self.index = faiss.IndexHNSWFlat(dimension, 16)

        self.documents = []

    def add(self, chunks: List[Chunk], embeddings: np.ndarray):
        """添加文档和向量"""
        for i, chunk in enumerate(chunks):
            self.index.add(embeddings[i:i+1])
            self.documents.append(chunk)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict]:
        """向量相似度检索"""
        scores, indices = self.index.search(
            query_embedding.reshape(1, -1),
            min(top_k, len(self.documents))
        )

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
                results.append({
                    "chunk": self.documents[idx],
                    "score": float(score)
                })

        return results

# ==================== 5. BM25 检索 ====================

class BM25Retriever:
    """BM25 关键词检索"""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        from rank_bm25 import BM25Okapi
        self.k1 = k1
        self.b = b
        self.bm25 = None
        self.tokenized_corpus = []
        self.documents = []

    def index(self, chunks: List[Chunk]):
        """构建 BM25 索引"""
        self.documents = chunks
        self.tokenized_corpus = [chunk.content.split() for chunk in chunks]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """关键词检索"""
        tokenized_query = query.split()
        scores = self.bm25.get_scores(tokenized_query)

        # 获取 top-k
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "chunk": self.documents[idx],
                "score": float(scores[idx])
            })

        return results

# ==================== 6. 混合检索器 ====================

class HybridRetriever:
    """混合检索器：结合向量检索和 BM25"""

    def __init__(self, vector_store: VectorStore, bm25_retriever: BM25Retriever):
        self.vector_store = vector_store
        self.bm25_retriever = bm25_retriever
        self.embedder = EmbeddingModel()

    def search(self, query: str, top_k: int = 5, alpha: float = 0.5) -> List[Dict]:
        """
        混合检索

        Args:
            query: 查询文本
            top_k: 返回数量
            alpha: 向量检索权重
        """
        # 1. 向量检索
        query_embedding = self.embedder.embed([query])
        vector_results = self.vector_store.search(query_embedding, top_k * 2)

        # 2. BM25 检索
        bm25_results = self.bm25_retriever.search(query, top_k * 2)

        # 3. 分数归一化并融合
        # 构建分数映射
        scores_map = {}

        for result in vector_results:
            chunk_id = result["chunk"].content[:50]  # 用前50字符作为ID
            scores_map[chunk_id] = {"vector": result["score"], "chunk": result["chunk"]}

        for result in bm25_results:
            chunk_id = result["chunk"].content[:50]
            if chunk_id in scores_map:
                scores_map[chunk_id]["bm25"] = result["score"]
            else:
                scores_map[chunk_id] = {"bm25": result["score"], "chunk": result["chunk"]}

        # 归一化并融合
        vector_scores = [v["vector"] for v in scores_map.values() if "vector" in v]
        bm25_scores = [v["bm25"] for v in scores_map.values() if "bm25" in v]

        max_vector = max(vector_scores) if vector_scores else 1
        max_bm25 = max(bm25_scores) if bm25_scores else 1

        final_results = []
        for chunk_id, scores in scores_map.items():
            vector_norm = scores.get("vector", 0) / max_vector
            bm25_norm = scores.get("bm25", 0) / max_bm25
            final_score = alpha * vector_norm + (1 - alpha) * bm25_norm

            final_results.append({
                "chunk": scores["chunk"],
                "score": final_score,
                "vector_score": scores.get("vector", 0),
                "bm25_score": scores.get("bm25", 0)
            })

        # 排序并返回
        final_results.sort(key=lambda x: x["score"], reverse=True)
        return final_results[:top_k]

# ==================== 7. RAG 系统 ====================

class RAGSystem:
    """RAG 系统主类"""

    def __init__(self, embedding_model: str = "BAAI/bge-m3"):
        self.embedding_model = EmbeddingModel(embedding_model)
        self.vector_store = None
        self.bm25_retriever = BM25Retriever()
        self.hybrid_retriever = None
        self.chunks = []
        self.llm = None

    def load_documents(self, documents: List[Document]):
        """加载并索引文档"""
        # 1. 文本分割
        splitter = TextSplitter(chunk_size=500, overlap=50)
        self.chunks = []

        for doc in documents:
            doc_chunks = splitter.split(doc.content, doc.metadata)
            self.chunks.extend(doc_chunks)

        # 2. 生成嵌入
        embeddings = self.embedding_model.embed(
            [chunk.content for chunk in self.chunks]
        )

        # 3. 存储到向量数据库
        self.vector_store = VectorStore(
            dimension=embeddings.shape[1],
            index_type="hnsw"
        )
        self.vector_store.add(self.chunks, embeddings)

        # 4. 构建 BM25 索引
        self.bm25_retriever.index(self.chunks)

        # 5. 创建混合检索器
        self.hybrid_retriever = HybridRetriever(
            self.vector_store,
            self.bm25_retriever
        )

        print(f"已索引 {len(self.chunks)} 个文本块")

    def set_llm(self, api_key: str, model: str = "gpt-4"):
        """设置 LLM"""
        from openai import OpenAI
        self.llm = OpenAI(api_key=api_key)
        self.llm_model = model

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """检索相关文档"""
        if not self.hybrid_retriever:
            raise ValueError("请先加载文档")
        return self.hybrid_retriever.search(query, top_k=top_k)

    def generate(self, query: str, context: str) -> str:
        """生成答案"""
        if not self.llm:
            raise ValueError("请先设置 LLM")

        prompt = f"""基于以下参考资料回答问题。如果资料不足以回答，请如实说明。

参考资料：
{context}

问题：{query}

回答："""

        response = self.llm.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "你是一个有帮助的AI助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content

    def answer(self, query: str, top_k: int = 5) -> Dict:
        """完整的 RAG 问答流程"""
        # 1. 检索
        results = self.retrieve(query, top_k)

        # 2. 组装上下文
        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"【文档 {i}】(相关性: {result['score']:.3f})\n{result['chunk'].content}"
            )
        context = "\n\n".join(context_parts)

        # 3. 生成
        answer = self.generate(query, context)

        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "content": r["chunk"].content[:200] + "...",
                    "score": r["score"],
                    "metadata": r["chunk"].metadata
                }
                for r in results
            ]
        }

# ==================== 8. 使用示例 ====================

if __name__ == "__main__":
    # 初始化 RAG 系统
    rag = RAGSystem(embedding_model="BAAI/bge-m3")

    # 加载文档
    documents = [
        Document(
            content="""
            Python 是一种高级编程语言，由 Guido van Rossum 于 1991 年创建。
            Python 设计哲学强调代码的可读性和简洁的语法。
            与其他语言相比，Python 的代码行数更少。

            异步编程是 Python 的一项重要特性。Python 的异步编程主要使用
            asyncio 库来实现。异步编程允许程序在等待 I/O 操作时执行其他任务，
            从而提高程序的效率和响应性。

            Python 的数据类型包括整数、浮点数、字符串、列表、元组、字典等。
            Python 还是一门面向对象的语言，支持类、继承、多态等特性。
            """,
            metadata={"source": "python_intro.txt", "category": "编程语言"}
        )
    ]

    rag.load_documents(documents)

    # 设置 LLM（需要 OpenAI API Key）
    # rag.set_llm(api_key="your-api-key")

    # 检索测试
    results = rag.retrieve("Python 异步编程的原理是什么？")
    print("检索结果：")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. 得分: {result['score']:.3f}")
        print(f"   内容: {result['chunk'].content[:100]}...")
```

### 5.3 添加 Rerank 优化

```python
# 添加 Rerank 模块进一步提升效果

from sentence_transformers import CrossEncoder

class Reranker:
    """重排序模型"""

    def __init__(self, model_name: str = "BAAI/bge-reranker-base"):
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: List[str], top_k: int = 5) -> List[Dict]:
        """
        对文档进行重排序

        Args:
            query: 查询文本
            documents: 文档列表
            top_k: 返回数量
        """
        pairs = [[query, doc] for doc in documents]
        scores = self.model.predict(pairs)

        # 按分数排序
        results = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]

        return [{"document": doc, "score": float(score)} for doc, score in results]

# 在 RAG 系统中集成 Rerank
class RAGRerankSystem(RAGSystem):
    """带重排序的 RAG 系统"""

    def __init__(self, embedding_model: str = "BAAI/bge-m3"):
        super().__init__(embedding_model)
        self.reranker = Reranker()
        self.use_rerank = False

    def enable_rerank(self, model_name: str = "BAAI/bge-reranker-base"):
        """启用重排序"""
        self.reranker = Reranker(model_name)
        self.use_rerank = True

    def answer(self, query: str, top_k: int = 5) -> Dict:
        """使用重排序的问答流程"""
        # 1. 初步检索（多召回一些）
        initial_results = self.retrieve(query, top_k * 3)

        # 2. 重排序
        if self.use_rerank:
            doc_texts = [r["chunk"].content for r in initial_results]
            reranked = self.reranker.rerank(query, doc_texts, top_k)

            # 合并结果
            results = []
            for rerank_result in reranked:
                doc_content = rerank_result["document"]
                for init_result in initial_results:
                    if init_result["chunk"].content == doc_content:
                        results.append({
                            "chunk": init_result["chunk"],
                            "score": rerank_result["score"],
                            "vector_score": init_result["score"]
                        })
                        break
        else:
            results = initial_results[:top_k]

        # 3. 组装上下文
        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"【文档 {i}】(相关性: {result['score']:.3f})\n{result['chunk'].content}"
            )
        context = "\n\n".join(context_parts)

        # 4. 生成
        answer = self.generate(query, context)

        return {
            "query": query,
            "answer": answer,
            "sources": [
                {
                    "content": r["chunk"].content[:200] + "...",
                    "score": r["score"],
                    "vector_score": r.get("vector_score", 0),
                    "metadata": r["chunk"].metadata
                }
                for r in results
            ]
        }
```

---

## 六、UltraRAG 框架特点分析

### 6.1 UltraRAG 概述

UltraRAG 是由 OpenBMB（面壁智能）开发的新一代 RAG 框架，GitHub 地址：https://github.com/OpenBMB/UltraRAG

**UltraRAG 的核心理念**：将 RAG 系统打造成"单反相机"，既支持专业用户的高级配置，也提供"卡片机"的一键式操作。

### 6.2 UltraRAG 核心特点

| 特点 | 说明 |
|------|------|
| **零代码 WebUI** | 无需编程，通过 Web 界面完成模型构建、训练、评测 |
| **一键式数据构建** | 自研 KBAlign、DDR 等方法，自动生成训练数据 |
| **自动化模型适配** | 自动将模型适配到用户提供的知识库 |
| **模块化设计** | 支持灵活的功能组合，满足科研需求 |
| **全流程覆盖** | 从数据构造到模型微调，提供完整解决方案 |
| **MCP 支持** | UltraRAG 2.0 首个基于 MCP 架构的 RAG 框架 |

### 6.3 UltraRAG 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      UltraRAG 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  WebUI (零代码界面)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  工作流编排层                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ 检索   │ │ 重排序  │ │ 生成   │ │ 评估   │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  核心方法层                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ KBAlign │ │  DDR   │ │ CoAI    │ │ RAGAS   │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  模型适配层                          │   │
│  │  ┌─────────────┐        ┌─────────────┐              │   │
│  │  │ Embedding   │        │    LLM     │              │   │
│  │  │ 微调        │        │   微调     │              │   │
│  │  └─────────────┘        └─────────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 UltraRAG 核心技术

#### 6.4.1 KBAlign（知识库对齐）

KBAlign 是 UltraRAG 自研的检索模型对齐方法：

```python
# KBAlign 核心原理

"""
KBAlign 解决的问题：
- 通用 Embedding 模型在特定知识库上效果不佳
- 需要大量标注数据来微调模型，成本高

KBAlign 的方案：
1. 利用 LLM 自动生成高质量的 Query-Chunk 对
2. 通过对比学习对齐检索模型
3. 无需人工标注，大幅降低成本
"""

# 使用示例（伪代码）
from ultrarag import KBAlign

# 初始化
aligner = KBAlign(
    embedding_model="BAAI/bge-m3",
    llm_model="gpt-4"
)

# 对齐到知识库
aligned_model = aligner.align(
    knowledge_base=knowledge_docs,  # 知识库文档
    num_generated_pairs=1000,       # 生成多少对训练数据
    iterations=3                    # 对齐迭代次数
)

# 使用对齐后的模型
results = aligned_model.search("Python 异步编程")
```

#### 6.4.2 DDR（Document Description Retrieval）

DDR 是一种文档级别的检索优化方法：

```python
# DDR 核心原理

"""
DDR 解决的问题：
- 传统 RAG 只关注块级别检索，忽略文档整体结构
- 多跳问题需要跨文档理解

DDR 的方案：
1. 为每个文档生成描述（Document Description）
2. 先在文档级别检索，再在块级别检索
3. 保留更多上下文信息
"""

# DDR 工作流程
"""
用户查询 → 文档级别检索 → 选取Top-k文档 → 文档内块检索 → 返回结果

文档描述生成：
输入：一篇完整文档
LLM 生成：
- 文档摘要
- 文档主题
- 关键问题（FAQ）
- 文档间关系
"""
```

#### 6.4.3 CoAI（协作式 AI）

CoAI 是 UltraRAG 的协作式知识增强方法：

```python
# CoAI 核心原理

"""
CoAI 解决的问题：
- 单一 LLM 在专业领域知识上不足
- 需要结合多个 AI Agent 的能力

CoAI 的方案：
1. 多个专业 AI Agent 协作
2. 知识共享与融合
3. 集体决策生成答案
"""
```

### 6.5 UltraRAG 2.0 MCP 架构

UltraRAG 2.0 是首个基于 MCP（Model Context Protocol）架构设计的 RAG 框架：

**MCP 架构优势**：

| 传统 RAG | MCP-RAG (UltraRAG 2.0) |
|----------|------------------------|
| 硬编码组件调用 | 标准化的 MCP Server 接口 |
| 定制化开发 | 组件可插拔 |
| 扩展困难 | 灵活扩展 |
| 学习成本高 | 函数级 Tool 接口 |

```python
# UltraRAG 2.0 MCP 使用示例

"""
使用 MCP 架构，UltraRAG 2.0 将 RAG 核心组件封装为独立的 MCP Server：

┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (用户代码)                    │
│                                                             │
│   from mcp_client import MCPClient                          │
│   client = MCPClient("ultra_rag_server")                   │
│                                                             │
│   # 调用检索组件                                            │
│   results = client.call_tool("retrieve", {                  │
│       "query": "Python 异步编程",                            │
│       "top_k": 5                                            │
│   })                                                        │
│                                                             │
│   # 调用生成组件                                            │
│   answer = client.call_tool("generate", {                   │
│       "query": "Python 异步编程",                           │
│       "context": results["context"]                          │
│   })                                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (UltraRAG)                    │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  检索组件   │  │  重排组件   │  │  生成组件   │        │
│   │   Server   │  │   Server   │  │   Server   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
"""
```

### 6.6 UltraRAG 与其他框架对比

| 维度 | LangChain | LlamaIndex | RAGFlow | UltraRAG |
|------|-----------|-------------|---------|----------|
| **定位** | 全能框架 | 数据连接 | 文档理解 | 自动优化 |
| **零代码** | 否 | 否 | 是 | 是 |
| **模型微调** | 支持但复杂 | 支持但复杂 | 弱 | 强大、一键 |
| **自动适配** | 否 | 否 | 部分 | 是 |
| **MCP 支持** | 否 | 否 | 否 | 是 |
| **多模态** | 支持 | 支持 | 部分 | 待发展 |

### 6.7 UltraRAG 使用建议

**适合使用 UltraRAG 的场景**：

1. **追求效果优化**：需要在特定知识库上达到最佳效果
2. **无算法团队**：希望快速获得高质量 RAG 系统
3. **模型适配难**：通用模型效果不佳，需要针对性优化
4. **科研需求**：需要灵活组合多种方法进行实验

**使用注意事项**：

1. **资源需求**：微调需要 GPU 资源
2. **学习曲线**：高级功能需要一定理论基础
3. **版本迭代**：UltraRAG 仍在快速迭代中

---

## 七、总结

### 7.1 RAG 技术全景图

```
┌─────────────────────────────────────────────────────────────┐
│                        RAG 技术全景                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  发展阶段：                                                  │
│  Naive RAG → Advanced RAG → Modular RAG → Agentic RAG        │
│                                                             │
│  核心模块：                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Embedding│  │  分块   │   │ 向量检索│   │  重排序 │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                             │
│  技术选型：                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │LangChain│  │LlamaIndex│  │ RAGFlow │  │ UltraRAG│    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                             │
│  应用场景：                                                  │
│  智能问答 │ 知识库检索 │ 文档分析 │ 客服系统 │ 教育辅导   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 RAG 系统质量评估

评估 RAG 系统常用的指标：

| 指标 | 说明 | 评估方法 |
|------|------|----------|
| **召回率 (Recall)** | 检索结果覆盖正确答案的比例 | Hit Rate @ k |
| **精确率 (Precision)** | 检索结果中相关文档的比例 | MRR, NDCG |
| **答案质量** | 生成答案的准确性和完整性 | RAGAS, Trulens |
| **幻觉率** | 生成错误信息的比例 | 人工评估 |

### 7.3 RAG 优化最佳实践

1. **数据准备阶段**
   - 使用高质量的文档解析工具
   - 选择合适的分块策略（通常 500 tokens 左右）
   - 保留必要的元数据

2. **检索阶段**
   - 使用混合检索（向量 + BM25）
   - 添加重排序层
   - 考虑查询扩展和重写

3. **生成阶段**
   - 设计有效的 Prompt 模板
   - 控制上下文长度，避免引入噪声
   - 添加引用和溯源信息

4. **迭代优化**
   - 定期评估系统效果
   - 分析失败案例，针对性优化
   - 考虑微调 Embedding 和 LLM

### 7.4 参考资源

- **RAG 论文**：Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (2020)
- **LangChain 文档**：https://python.langchain.com
- **LlamaIndex 文档**：https://docs.llamaindex.ai
- **RAGFlow 文档**：https://ragflow.io/docs
- **UltraRAG GitHub**：https://github.com/OpenBMB/UltraRAG
- **BGE 模型**：https://github.com/FlagOpen/FlagEmbedding
