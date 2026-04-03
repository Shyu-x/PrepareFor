# 向量数据库与Embedding实战完全指南

## 一、向量数据库核心概念：让AI"记住"一切的神奇图书馆

### 1.1 什么是向量数据库？

想象一下，你有一座巨大的图书馆，里面不是放书，而是存放"感觉"。

普通图书馆是这样的：你告诉管理员要找"关于爱情的小说"，他会在书架上一本本找。

向量数据库是这样的：你告诉管理员"那种淡淡的忧伤、带着初夏傍晚微风的、让人想起初恋的感觉"，管理员瞬间就能找到《挪威的森林》。

这不是魔法，而是**语义理解**的力量。

**向量数据库**（Vector Database）是一种专门存储和检索高维向量数据的数据库。在AI时代，它成为了大语言模型（LLM）的"长期记忆系统"，让AI能够快速找到与问题最相关的信息。

### 1.2 为什么AI需要向量数据库？

大语言模型有一个致命缺陷：**训练数据有截止日期**。ChatGPT-4的知识截止到2023年12月，它不知道之后发生的任何事情。

而且，大语言模型的上下文窗口是有限的。即使是GPT-4 Turbo，最多也只能处理128K tokens，折合大约10万汉字。

向量数据库解决了这两个问题：

| 问题 | 传统方案 | 向量数据库方案 |
|------|----------|----------------|
| 知识时效性 | 定期重新训练（成本极高） | 实时更新知识库 |
| 上下文限制 | 精简输入（丢失细节） | 先检索再注入 |
| 长文档处理 | 截断或分段（破坏完整性） | 分块+向量化+检索 |

### 1.3 向量是什么？

**向量**（Vector）是一个有序的数字列表，代表数据在多维空间中的位置。

一维向量就是一个数字：`[3.14]`
二维向量是平面上的一个点：`[x, y]`
三维向量是空间中的一个点：`[x, y, z]`

AI中的向量通常是**768维、1536维甚至更高维**。这些高维向量，我们无法直接可视化，但数学告诉我们：

- **距离近的点**：语义相似
- **距离远的点**：语义不相关

举个例子：
- "苹果手机很好用" → 向量A = [0.12, -0.34, 0.56, ...]
- "iPhone性能很强" → 向量B = [0.11, -0.35, 0.58, ...]
- "今天天气不错" → 向量C = [-0.78, 0.23, -0.45, ...]

向量A和B的距离很近（都说苹果相关），向量C距离A和B都很远（主题完全不同）。

---

## 二、文本Embedding技术：把文字变成数字的艺术

### 2.1 Embedding的工作原理

**Embedding**（嵌入）是将离散数据（如文字、图片）转换为连续向量表示的过程。

你可以把Embedding理解为一个"翻译官"：它把人类能理解的文字，翻译成AI能理解的数字。

为什么需要这种翻译？

因为计算机只认识数字。让计算机"理解"文字，最早的方案是**词袋模型**（Bag of Words）：
- "苹果" → [1, 0, 0, 0, ...]（在词典第1个位置）
- "香蕉" → [0, 1, 0, 0, ...]（在词典第2个位置）

这种方法的问题显而易见：**无法表达语义**。"苹果"和"水果"的词袋距离，和"苹果"和"手机"的词袋距离是一样的。

Embedding解决了这个问题：语义相似的词，在向量空间中距离更近。

### 2.2 主流Embedding模型

#### 2.2.1 OpenAI的text-embedding-ada-002

OpenAI推出的第二代Embedding模型，支持1536维向量输出。

```python
# Python示例：使用OpenAI API获取文本Embedding
from openai import OpenAI

# 初始化客户端
client = OpenAI(api_key="your-api-key")

def get_embedding(text: str) -> list[float]:
    """
    获取文本的Embedding向量

    参数:
        text: 输入文本（最大输入长度8192 tokens）

    返回:
        1536维浮点数向量
    """
    response = client.embeddings.create(
        model="text-embedding-ada-002",  # 模型名称，第二代Ada
        input=text                       # 要嵌入的文本
    )

    # 提取向量数据
    embedding = response.data[0].embedding
    return embedding

# 使用示例
text = "大语言模型正在改变人工智能的格局"
vector = get_embedding(text)

print(f"向量维度: {len(vector)}")        # 输出: 1536
print(f"向量前5个值: {vector[:5]}")      # 输出类似: [0.023, -0.087, 0.034, ...]
```

#### 2.2.2 国产Embedding模型：text2vec

text2vec是一个优秀的中文语义Embedding模型，支持768维向量输出。

```python
# Python示例：使用text2vec获取中文文本Embedding
from sentence_transformers import SentenceTransformer

# 加载中文语义相似度模型
# 这是一个基于BERT的中文Embedding模型
model = SentenceTransformer('shibing624/text2vec-base-chinese')

def get_chinese_embedding(text: str) -> list[float]:
    """
    使用text2vec获取中文文本的Embedding向量

    参数:
        text: 输入的中文文本

    返回:
        768维浮点数向量
    """
    # 编码文本为向量
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

# 使用示例
texts = [
    "今天天气真好",
    "今天阳光明媚",
    "人工智能很厉害"
]

# 批量编码
embeddings = model.encode(texts, normalize_embeddings=True)

# 计算余弦相似度
from sklearn.metrics.pairwise import cosine_similarity

# 计算第一个句子与其他句子的相似度
similarity = cosine_similarity([embeddings[0]], embeddings[1:])
print(f"'今天天气真好'与'今天阳光明媚'的相似度: {similarity[0][0]:.4f}")  # 应该很高
print(f"'今天天气真好'与'人工智能很厉害'的相似度: {similarity[0][1]:.4f}")  # 应该很低
```

#### 2.2.3 BGE模型：新一代中文Embedding

BGE（BAAI General Embedding）是智谱AI开源的中文Embedding模型，在多个基准测试中表现优异。

```python
# Python示例：使用BGE模型
from flag_models import FlagModel

# 加载BGE模型（中文版）
# 模型下载地址：https://huggingface.co/BAAI/bge-large-zh
model = FlagModel('BAAI/bge-large-zh', device='cuda')

def bge_embed texts(texts: list[str]) -> list[list[float]]:
    """
    使用BGE模型批量获取文本Embedding

    参数:
        texts: 文本列表

    返回:
        1024维向量列表
    """
    embeddings = model.encode(texts)
    return embeddings.tolist()

# 使用示例
documents = [
    "量子计算是一种利用量子力学原理进行计算的技术",
    "量子纠缠是量子力学中的一种神奇现象",
    "机器学习是人工智能的一个分支"
]

vectors = bge_encode(documents)
print(f"生成了 {len(vectors)} 个向量，每个向量 {len(vectors[0])} 维")
```

### 2.3 文本分块策略：如何切分长文档

向量化长文档时，需要将文档**分块**（Chunking）成小块。因为大多数Embedding模型有输入长度限制。

#### 2.3.1 固定大小分块

最简单的策略，按固定token数切分。

```python
def chunk_text_fixed(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    固定大小分块

    参数:
        text: 要分块的原始文本
        chunk_size: 每个块的token数（大约）
        overlap: 相邻块之间的重叠token数

    返回:
        分块后的文本列表
    """
    # 按句子分割
    sentences = text.split('。')

    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_length = len(sentence) // 2  # 粗略估计token数

        # 如果当前块加上这句话超过限制
        if current_length + sentence_length > chunk_size:
            # 保存当前块
            if current_chunk:
                chunks.append('。'.join(current_chunk) + '。')

            # 开始新块，保留重叠部分
            overlap_sentences = current_chunk[-overlap // 10:] if overlap > 0 else []
            current_chunk = overlap_sentences + [sentence]
            current_length = sum(len(s) // 2 for s in current_chunk)
        else:
            current_chunk.append(sentence)
            current_length += sentence_length

    # 添加最后一个块
    if current_chunk:
        chunks.append('。'.join(current_chunk) + '。')

    return chunks

# 使用示例
long_text = """
人工智能技术的快速发展正在深刻改变我们的生活方式。从智能语音助手到自动驾驶汽车，
AI技术已经渗透到各行各业。大语言模型的出现更是让机器理解和生成自然语言的能力有了质的飞跃。
然而，AI技术的发展也带来了诸多挑战，如隐私保护、算法偏见、能耗问题等。
我们需要谨慎地推进AI技术的研究和应用，确保它能够造福人类社会。
"""

chunks = chunk_text_fixed(long_text, chunk_size=100, overlap=20)
for i, chunk in enumerate(chunks):
    print(f"块 {i+1} ({len(chunk)} 字): {chunk[:50]}...")
```

#### 2.3.2 语义分块：按段落和主题切分

更智能的分块策略，按语义边界切分。

```python
import re

def semantic_chunk(text: str, min_chunk_size: int = 100, max_chunk_size: int = 1000) -> list[dict]:
    """
    语义分块：识别主题边界，按段落切分

    参数:
        text: 原始文本
        min_chunk_size: 最小块大小（字符数）
        max_chunk_size: 最大块大小（字符数）

    返回:
        包含文本块及其元信息的列表
    """
    # 先按段落分割
    paragraphs = re.split(r'\n\n+', text)

    chunks = []
    current_content = []
    current_size = 0

    for para in paragraphs:
        para_size = len(para)

        # 如果单个段落就超过最大限制，需要强制切分
        if para_size > max_chunk_size:
            # 先保存当前块
            if current_content:
                chunks.append({
                    'content': '\n\n'.join(current_content),
                    'size': current_size,
                    'paragraphs': len(current_content)
                })
                current_content = []
                current_size = 0

            # 强制切分大段落（按句子）
            sentences = re.split(r'[。！？]', para)
            for sent in sentences:
                if current_size + len(sent) > max_chunk_size:
                    chunks.append({
                        'content': '。'.join(current_content) if current_content else '',
                        'size': current_size,
                        'paragraphs': len(current_content)
                    })
                    current_content = [sent]
                    current_size = len(sent)
                else:
                    current_content.append(sent)
                    current_size += len(sent)
        else:
            # 正常段落处理
            if current_size + para_size > max_chunk_size:
                # 保存当前块
                chunks.append({
                    'content': '\n\n'.join(current_content),
                    'size': current_size,
                    'paragraphs': len(current_content)
                })
                current_content = [para]
                current_size = para_size
            else:
                current_content.append(para)
                current_size += para_size

    # 添加最后一个块
    if current_content:
        chunks.append({
            'content': '\n\n'.join(current_content),
            'size': current_size,
            'paragraphs': len(current_content)
        })

    # 合并太小的块
    merged_chunks = []
    for chunk in chunks:
        if merged_chunks and chunk['size'] < min_chunk_size:
            # 与前一个块合并
            merged_chunks[-1]['content'] += '\n\n' + chunk['content']
            merged_chunks[-1]['size'] += chunk['size']
            merged_chunks[-1]['paragraphs'] += chunk['paragraphs']
        else:
            merged_chunks.append(chunk)

    return merged_chunks

# 使用示例
long_document = """
第一章：人工智能概述

人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，
致力于开发能够模拟、延伸和扩展人类智能的理论、方法和技术。
人工智能的概念最早在1956年的达特茅斯会议上被正式提出。

经过半个多世纪的发展，人工智能已经成为当今最具影响力的技术之一。
从早期的专家系统、机器学习，到深度学习、大语言模型，
AI技术不断突破，创造出一个又一个奇迹。

第二章：机器学习基础

机器学习是人工智能的一个核心分支，它使计算机能够从数据中学习，而无需明确编程。
机器学习主要分为三类：监督学习、无监督学习和强化学习。

监督学习使用标注数据进行训练，典型应用包括图像分类、语音识别等。
无监督学习则不需要标注数据，常用于聚类、降维等场景。
强化学习通过与环境交互学习最优策略，典型应用是游戏AI和机器人控制。

第三章：深度学习革命

2012年，AlexNet在ImageNet图像分类竞赛中取得突破性成绩，
标志着深度学习时代的到来。此后，卷积神经网络（CNN）、循环神经网络（RNN）、
Transformer等模型相继出现，AI技术在各个领域不断取得突破。
"""

chunks = semantic_chunk(long_document)
for i, chunk in enumerate(chunks):
    print(f"块 {i+1} ({chunk['size']} 字, {chunk['paragraphs']} 段):")
    print(f"  {chunk['content'][:80]}...")
    print()
```

---

## 三、主流向量数据库详解

### 3.1 Pinecone：云原生向量数据库

Pinecone是一个完全托管的云向量数据库，无需管理基础设施。

#### 3.1.1 核心概念

| 概念 | 说明 |
|------|------|
| **Index** | 索引，整个向量数据库实例 |
| **Namespace** | 命名空间，用于数据隔离 |
| **Vector** | 向量，即被索引的数据点 |
| **Metadata** | 元数据，与向量关联的键值对 |
| **Top-K** | 检索返回最相似的K个结果 |

#### 3.1.2 快速上手

```python
# Python示例：Pinecone基础操作
from pinecone import Pinecone, ServerlessSpec

# 初始化Pinecone客户端
pc = Pinecone(api_key="your-api-key")

# 创建索引（如果不存在）
index_name = "my-knowledge-base"

# 检查索引是否已存在
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,                    # 向量维度（OpenAI Ada-002是1536）
        metric="cosine",                   # 距离度量：cosine余弦、euclidean欧氏、dotproduct点积
        spec=ServerlessSpec(
            cloud="aws",                   # 云服务商：aws、gcp、azure
            region="us-east-1"             # 区域
        )
    )

# 连接索引
index = pc.Index(index_name)

# upsert操作：插入或更新向量
vectors = [
    # 每个元组包含：(id, 向量, 元数据)
    ("doc1", [0.1] * 1536, {"text": "苹果是一种水果", "category": "食物"}),
    ("doc2", [0.2] * 1536, {"text": "苹果手机是苹果公司的产品", "category": "科技"}),
    ("doc3", [0.3] * 1536, {"text": "香蕉是热带水果", "category": "食物"}),
]

index.upsert(vectors)

# 查询操作：找出最相似的向量
query_vector = [0.15] * 1536  # 查询向量

results = index.query(
    vector=query_vector,
    top_k=2,                  # 返回最相似的2个结果
    include_metadata=True     # 返回元数据
)

print("查询结果:")
for match in results.matches:
    print(f"  ID: {match.id}")
    print(f"  相似度分数: {match.score:.4f}")
    print(f"  元数据: {match.metadata}")
    print()

# 删除向量
index.delete(ids=["doc1"])

# 查看索引统计信息
stats = index.describe_index_stats()
print(f"索引统计: {stats}")
```

#### 3.1.3 高级查询：带过滤条件的检索

```python
# 带元数据过滤的查询
results = index.query(
    vector=query_vector,
    top_k=5,
    include_metadata=True,
    filter={                    # 元数据过滤条件
        "category": {"$eq": "科技"},  # $eq等于、$ne不等于、$in在列表中、$gt大于等
        "size": {"$gte": 1000}        # $gte大于等于、$lte小于等于
    }
)
```

### 3.2 Milvus：开源分布式向量数据库

Milvus是LF AI & Data基金会下的开源项目，支持十亿级向量检索。

#### 3.2.1 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                      Milvus集群                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Proxy     │  │   Proxy     │  │   Proxy     │      │
│  │  (入口层)    │  │  (入口层)    │  │  (入口层)    │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│  ┌──────┴────────────────┴────────────────┴──────┐     │
│  │                  Root Coord                    │     │
│  │                   (协调者)                     │     │
│  └──────┬────────────────┬────────────────┬──────┘     │
│         │                │                │              │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐     │
│  │ Data Coord  │  │Query Coord  │  │Index Coord │     │
│  │  (数据协调)  │  │  (查询协调)  │  │  (索引协调)  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │              │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐     │
│  │ Data Node   │  │ Query Node  │  │ Index Node  │     │
│  │  (数据节点)  │  │  (查询节点)  │  │  (索引节点)  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### 3.2.2 Python客户端操作

```python
# Python示例：Milvus基础操作
from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType, utility

# 1. 连接到Milvus服务器
connections.connect(
    alias="default",
    host="localhost",      # Milvus服务器地址
    port="19530"           # Milvus服务端口
)

# 2. 定义集合的Schema
# 集合类似于关系型数据库中的表
fields = [
    # 主键字段
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    # 向量字段 - 768维浮点向量
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
    # 标量字段 - 文本内容
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    # 标量字段 - 分类标签
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
]

schema = CollectionSchema(
    fields=fields,
    description="知识库向量集合",
    enable_dynamic_field=False  # 是否启用动态字段
)

# 3. 创建集合
collection_name = "knowledge_base"
if utility.collection_exists(collection_name):
    # 如果已存在，删除重建
    utility.drop_collection(collection_name)

collection = Collection(name=collection_name, schema=schema)

# 4. 创建索引 - 这是关键步骤，影响检索性能
index_params = {
    "index_type": "IVF_FLAT",      # 索引类型
    "metric_type": "L2",          # 距离度量：L2欧氏、IP内积、COSINE余弦
    "params": {"nlist": 128}      # 聚类中心数量
}

# 在向量字段上创建索引
collection.create_index(
    field_name="embedding",
    index_params=index_params
)

# 5. 插入数据
# 生成一些示例数据
import numpy as np

def generate_sample_vectors(n: int, dim: int) -> list:
    """生成随机向量数据"""
    return np.random.rand(n, dim).tolist()

# 准备数据
entities = [
    [i for i in range(1000)],                    # id字段（auto_id=True时省略）
    generate_sample_vectors(1000, 768),          # embedding向量
    [f"这是第{i}条文本内容" for i in range(1000)], # text字段
    [["科技", "教育", "娱乐", "健康"][i % 4] for i in range(1000)]  # category
]

# 插入数据
insert_result = collection.insert(entities)
print(f"插入成功，插入数量: {insert_result.insert_count}")

# 6. 加载集合到内存（检索前必须）
collection.load()

# 7. 搜索操作
search_params = {
    "metric_type": "L2",
    "params": {"nprobe": 10}  # 查询时搜索的聚类数量
}

# 待搜索的向量
query_vector = generate_sample_vectors(1, 768)[0]

# 执行搜索
results = collection.search(
    data=[query_vector],           # 查询向量
    anns_field="embedding",        # 搜索的向量字段
    param=search_params,           # 搜索参数
    limit=5,                       # 返回前5个结果
    expr=None,                     # 过滤表达式
    output_fields=["text", "category"]  # 返回的字段
)

print("\n搜索结果:")
for i, hits in enumerate(results):
    print(f"查询向量 {i+1} 的 Top-5 结果:")
    for hit in hits:
        print(f"  ID: {hit.id}, 距离: {hit.distance:.4f}, 文本: {hit.entity.get('text')}")

# 8. 带过滤条件的搜索
results = collection.search(
    data=[query_vector],
    anns_field="embedding",
    param=search_params,
    limit=5,
    expr='category == "科技"',  # 只搜索科技类
    output_fields=["text", "category"]
)

print("\n科技类搜索结果:")
for hit in results[0]:
    print(f"  ID: {hit.id}, 文本: {hit.entity.get('text')}")

# 9. 删除数据
# 根据表达式删除
collection.delete(expr="id in [1, 2, 3]")
print("删除ID为1,2,3的记录")

# 10. 释放集合（不再使用时）
collection.release()

# 断开连接
connections.disconnect(alias="default")
```

#### 3.2.3 Milvus索引类型对比

| 索引类型 | 适用场景 | 特点 |
|----------|----------|------|
| **FLAT** | 数据量小(<10000)，追求精确 | 暴力搜索，无压缩 |
| **IVF_FLAT** | 中等数据量，需要平衡精度和速度 | 基于聚类的近似搜索 |
| **IVF_SQ8** | 大数据量，需要节省内存 | 标量量化，降低精度省内存 |
| **HNSW** | 大数据量，追求高QPS | 图索引，检索快但内存占用高 |
| **ANNOY** | 静态数据，高召回 | 树索引，适合频繁更新的场景 |

### 3.3 Weaviate：模块化的向量数据库

Weaviate的特点是**模块化架构**，内置原生向量化器，支持直接从文本创建向量。

#### 3.3.1 核心特性

```
┌────────────────────────────────────────────────────────────┐
│                        Weaviate                             │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     GraphQL API                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    REST API                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │  text2vec  │ │  img2vec   │ │  Ref2Vec   │  ← 模块化   │
│  │  (文本向量化)│ │  (图片向量化)│ │  (引用向量化)│    向量化器 │
│  └────────────┘ └────────────┘ └────────────┘            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Vector Index                       │  │
│  │               (HNSW / IVF / BM25)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Python客户端操作

```python
# Python示例：Weaviate基础操作
import weaviate
from weaviate.util import get_valid_uuid
from uuid import uuid4

# 1. 连接到Weaviate
client = weaviate.Client(
    url="http://localhost:8080",    # Weaviate服务器地址
    # 如果需要认证：
    # auth_client_secret=weaviate.AuthApiKey(api_key="your-key"),
)

# 2. 创建class（类似于创建表）
article_class = {
    "class": "Article",                    # 类名
    "description": "新闻文章",              # 类描述
    "vectorizer": "text2vec-transformers", # 内置向量化模块
    "moduleConfig": {
        "text2vec-transformers": {
            "vectorizeClassName": False,   # 是否将类名也向量化
            " poolingMethod": "MAX",
            "vectorizer": {
                "name": "sentence-transformers",
                "path": "/models/sentence-transformers"
            }
        }
    },
    "properties": [
        {
            "name": "title",               # 属性名
            "dataType": ["text"],          # 数据类型
            "description": "文章标题"
        },
        {
            "name": "content",
            "dataType": ["text"],
            "description": "文章内容"
        },
        {
            "name": "publishDate",
            "dataType": ["date"],
            "description": "发布日期"
        },
        {
            "name": "category",
            "dataType": ["text"],
            "description": "文章分类"
        }
    ],
    # 索引配置
    "invertedIndexConfig": {
        "bm25": {
            "k1": 1.2,
            "b": 0.75
        }
    },
    "vectorIndexConfig": {
        "skip": False,
        "distanceMetric": "cosine",      # 余弦距离
        "ef": 512,                       # HNSW参数
        "efConstruction": 128,
        "maxConnections": 64
    }
}

# 创建类
if not client.schema.exists("Article"):
    client.schema.create_class(article_class)

# 3. 添加对象（数据）
articles = [
    {
        "title": "人工智能的未来发展",
        "content": "人工智能技术正在快速发展，从机器学习到深度学习，再到如今的大语言模型，AI正在改变我们的生活方式。",
        "publishDate": "2024-01-15T10:00:00Z",
        "category": "科技"
    },
    {
        "title": "气候变化的影响",
        "content": "全球气候变化导致极端天气频发，对农业生产、海洋生态等方面造成严重影响。",
        "publishDate": "2024-01-16T14:30:00Z",
        "category": "环境"
    },
    {
        "title": "新一代iPhone发布",
        "content": "苹果公司发布了最新一代iPhone，搭载全新设计的A系列芯片，性能提升显著。",
        "publishDate": "2024-01-17T09:00:00Z",
        "category": "科技"
    }
]

# 批量添加
with client.batch(batch_size=100, num_workers=2) as batch:
    for article in articles:
        # 生成唯一UUID
        uuid = get_valid_uuid(uuid4())

        # 添加到批量
        batch.add_data_object(
            data_object=article,
            class_name="Article",
            uuid=uuid
        )

print(f"成功导入 {len(articles)} 篇文章")

# 4. 向量搜索（NearVector）- 通过向量相似度搜索
query_vector = [0.1, -0.2, 0.3, ...]  # 实际应用中由Weaviate自动生成

results = client.query.get(
    class_name="Article",
    properties=["title", "content", "category", "publishDate"]
).with_near_vector(
    {"vector": query_vector}
).with_limit(2).do()

print("\n向量搜索结果:")
for obj in results['data']['Get']['Article']:
    print(f"  标题: {obj['title']}")
    print(f"  分类: {obj['category']}")
    print()

# 5. 语义搜索（NearText）- 通过文本描述搜索
results = client.query.get(
    class_name="Article",
    properties=["title", "content", "category"]
).with_near_text(
    {"concepts": ["科技产品", "手机"]}  # 自动转换为向量
).with_limit(2).do()

print("\n语义搜索结果 (关于科技产品):")
for obj in results['data']['Get']['Article']:
    print(f"  标题: {obj['title']}")

# 6. 混合搜索（Hybrid）- 结合向量和关键词搜索
results = client.query.get(
    class_name="Article",
    properties=["title", "content", "category"]
).with_hybrid(
    query="AI 人工智能",
    alpha=0.5,               # 0.5表示向量和关键词各占一半
    limit=3
).do()

print("\n混合搜索结果 (AI 人工智能):")
for obj in results['data']['Get']['Article']:
    print(f"  标题: {obj['title']}")

# 7. 带过滤条件的搜索
results = client.query.get(
    class_name="Article",
    properties=["title", "content", "category"]
).with_near_text(
    {"concepts": ["技术"]}
).with_where(
    {
        "path": ["category"],
        "operator": "Equal",
        "valueText": "科技"
    }
).with_limit(5).do()

print("\n科技类技术文章:")
for obj in results['data']['Get']['Article']:
    print(f"  标题: {obj['title']}")

# 8. 删除数据
client.data_object.delete(
    uuid="your-object-uuid",
    class_name="Article"
)

# 9. 查看schema
schema = client.schema.get()
print("\n当前数据库中的类:")
for cls in schema['classes']:
    print(f"  - {cls['class']}: {len(cls['properties'])} 个属性")
```

---

## 四、图像向量搜索：让AI"看懂"图片

### 4.1 CLIP模型：连接文本和图像的桥梁

OpenAI的CLIP（Contrastive Language-Image Pre-Training）模型可以将图片和文本映射到同一个向量空间。

这意味着：
- 图片可以找到相似的图片
- 文本可以找到相似的图片
- 图片可以找到相关的文本描述

```python
# Python示例：使用CLIP进行图像向量化和搜索
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# 加载CLIP模型
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def encode_image(image_path: str) -> list[float]:
    """
    将图片编码为向量

    参数:
        image_path: 图片文件路径

    返回:
        512维图像向量
    """
    # 加载并预处理图片
    image = Image.open(image_path)

    # 使用processor处理图片
    inputs = processor(images=image, return_tensors="pt")

    # 获取图像特征
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)

    # 转换为列表并归一化
    embedding = image_features[0].tolist()
    return embedding

def encode_text(text: str) -> list[float]:
    """
    将文本编码为向量

    参数:
        text: 文本描述

    返回:
        512维文本向量
    """
    # 处理文本
    inputs = processor(text=[text], return_tensors="pt", padding=True)

    # 获取文本特征
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)

    # 转换为列表并归一化
    embedding = text_features[0].tolist()
    return embedding

def search_images_by_text(query: str, image_paths: list[str], top_k: int = 3) -> list[dict]:
    """
    用文本搜索图片

    参数:
        query: 文本查询
        image_paths: 图片路径列表
        top_k: 返回前k个结果

    返回:
        搜索结果列表
    """
    # 编码查询文本
    query_vector = encode_text(query)

    # 编码所有图片
    image_vectors = []
    for path in image_paths:
        try:
            vec = encode_image(path)
            image_vectors.append((path, vec))
        except Exception as e:
            print(f"处理图片失败 {path}: {e}")

    # 计算相似度
    results = []
    for path, img_vec in image_vectors:
        similarity = sum(q * v for q, v in zip(query_vector, img_vec))
        results.append({
            'path': path,
            'score': similarity,
            'similarity': f"{similarity:.4f}"
        })

    # 排序并返回top_k
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:top_k]

# 使用示例
image_paths = [
    "images/cat.jpg",
    "images/dog.jpg",
    "images/car.jpg",
    "images/person.jpg"
]

# 搜索"一只可爱的猫咪"
results = search_images_by_text("一只可爱的猫咪", image_paths, top_k=2)
print("搜索'一只可爱的猫咪'的结果:")
for r in results:
    print(f"  {r['path']}: 相似度 {r['similarity']}")
```

### 4.2 Qdrant：专注于图像搜索的向量数据库

Qdrant是一个高性能的向量数据库，对图像搜索有很好的支持。

```python
# Python示例：Qdrant图像向量存储与搜索
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

# 初始化客户端
client = QdrantClient(url="localhost", port=6333)

# 集合名称
collection_name = "images"

# 创建集合（如果不存在）
if not client.collection_exists(collection_name):
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=512,                # CLIP模型生成的向量维度
            distance=Distance.COSINE  # 使用余弦距离
        )
    )

def store_image(image_id: str, image_vector: list[float], metadata: dict):
    """
    存储图片向量和元数据

    参数:
        image_id: 图片唯一标识
        image_vector: 图片的向量表示
        metadata: 图片的元数据（路径、标签等）
    """
    point = PointStruct(
        id=image_id,
        vector=image_vector,
        payload={  # payload就是元数据
            "path": metadata.get("path", ""),
            "tags": metadata.get("tags", []),
            "description": metadata.get("description", ""),
            "category": metadata.get("category", "uncategorized")
        }
    )

    client.upsert(
        collection_name=collection_name,
        points=[point]
    )

def search_similar_images(query_vector: list[float], top_k: int = 5, category: str = None) -> list[dict]:
    """
    搜索相似图片

    参数:
        query_vector: 查询向量
        top_k: 返回数量
        category: 可选，按分类过滤

    返回:
        相似图片列表
    """
    # 构建过滤条件
    search_filter = None
    if category:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="category",
                    match=MatchValue(value=category)
                )
            ]
        )

    # 执行搜索
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=top_k
    )

    # 格式化结果
    return [
        {
            "id": hit.id,
            "score": hit.score,
            "path": hit.payload["path"],
            "description": hit.payload.get("description", ""),
            "tags": hit.payload.get("tags", [])
        }
        for hit in results
    ]

# 使用示例：批量存储图片向量
from transformers import CLIPProcessor, CLIPModel
import torch

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def encode_image_clip(image_path: str) -> list[float]:
    """使用CLIP编码图片"""
    image = Image.open(image_path)
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = model.get_image_features(**inputs)
    return features[0].tolist()

# 存储一批图片
images_to_store = [
    {"id": "img_001", "path": "images/photo1.jpg", "category": "风景", "tags": ["自然", "山水"]},
    {"id": "img_002", "path": "images/photo2.jpg", "category": "人物", "tags": ["人像", "自拍"]},
    {"id": "img_003", "path": "images/photo3.jpg", "category": "建筑", "tags": ["城市", "高楼"]},
]

for img in images_to_store:
    try:
        vector = encode_image_clip(img["path"])
        store_image(img["id"], vector, img)
        print(f"存储成功: {img['path']}")
    except Exception as e:
        print(f"存储失败 {img['path']}: {e}")

# 搜索"蓝天白云下的风景"
query = "蓝天白云下的自然风景"
query_vector = encode_text(query)  # 需要先实现文本编码

results = search_similar_images(query_vector, top_k=3)
print("\n搜索结果:")
for r in results:
    print(f"  [{r['score']:.4f}] {r['path']} - {r['description']}")
```

---

## 五、RAG检索增强生成：让AI拥有最新知识

### 5.1 RAG工作原理

**RAG**（Retrieval-Augmented Generation，检索增强生成）是一种结合检索和生成的AI架构。

没有RAG时：
```
用户问题 → LLM直接回答（可能过时或有幻觉）
```

有RAG时：
```
用户问题 → 检索相关知识 → 将知识注入Prompt → LLM基于知识回答
```

这就像闭卷考试和开卷考试的区别：
- **闭卷考试**（无RAG）：只靠记忆，容易出错
- **开卷考试**（有RAG）：有参考资料，更准确

### 5.2 完整RAG流程实现

```python
# Python示例：完整RAG系统实现
from openai import OpenAI
from pymilvus import connections, Collection
import numpy as np

# 1. 初始化
client = OpenAI(api_key="your-api-key")

# 连接到向量数据库
connections.connect(alias="default", host="localhost", port="19530")
collection = Collection("knowledge_base")
collection.load()

def retrieve_relevant_documents(query: str, top_k: int = 5) -> list[dict]:
    """
    检索相关文档

    参数:
        query: 用户查询
        top_k: 返回数量

    返回:
        相关文档列表
    """
    # 1. 将用户查询向量化
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=query
    )
    query_vector = response.data[0].embedding

    # 2. 在向量数据库中搜索
    search_params = {"metric_type": "L2", "params": {"nprobe": 10}}

    results = collection.search(
        data=[query_vector],
        anns_field="embedding",
        param=search_params,
        limit=top_k,
        output_fields=["text", "source", "page"]
    )

    # 3. 格式化结果
    documents = []
    for hit in results[0]:
        documents.append({
            "text": hit.entity["text"],
            "source": hit.entity.get("source", "unknown"),
            "page": hit.entity.get("page", 0),
            "score": hit.distance
        })

    return documents

def generate_with_rag(query: str, retrieved_docs: list[dict]) -> str:
    """
    基于检索结果生成回答

    参数:
        query: 用户问题
        retrieved_docs: 检索到的相关文档

    返回:
        AI生成的回答
    """
    # 构建上下文：将检索到的文档组合
    context_parts = []
    for i, doc in enumerate(retrieved_docs, 1):
        context_parts.append(f"[文档{i}]\n{doc['text']}\n来源: {doc['source']} 第{doc['page']}页")

    context = "\n\n".join(context_parts)

    # 构建prompt：要求基于给定上下文回答
    prompt = f"""你是一个知识问答助手。请仔细阅读以下参考文档，然后回答用户的问题。

要求：
1. 只基于给定文档回答，不要编造信息
2. 如果文档中没有相关信息，请明确说明"我没有找到相关信息"
3. 引用文档来源时，使用[文档X]格式

---
参考文档：
{context}

---
用户问题：{query}

你的回答："""

    # 调用大模型生成
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个有帮助的知识问答助手。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,  # 较低温度，减少随机性
        max_tokens=1000
    )

    return response.choices[0].message.content

def rag_pipeline(query: str, top_k: int = 5) -> dict:
    """
    完整的RAG流程

    参数:
        query: 用户问题
        top_k: 检索文档数量

    返回:
        包含答案和引用信息的字典
    """
    # Step 1: 检索
    docs = retrieve_relevant_documents(query, top_k)

    # Step 2: 生成
    answer = generate_with_rag(query, docs)

    return {
        "query": query,
        "answer": answer,
        "retrieved_documents": docs,
        "num_docs_retrieved": len(docs)
    }

# 使用示例
if __name__ == "__main__":
    # 示例问题
    questions = [
        "什么是量子计算？",
        "人工智能有哪些最新的发展趋势？",
        "机器学习和深度学习有什么区别？"
    ]

    for question in questions:
        print(f"\n问题: {question}")
        print("-" * 50)

        result = rag_pipeline(question)

        print(f"回答: {result['answer']}")
        print(f"\n参考文档数: {result['num_docs_retrieved']}")
        print("相关文档:")
        for i, doc in enumerate(result['retrieved_documents'], 1):
            print(f"  [{i}] {doc['text'][:100]}... (来源: {doc['source']})")
```

### 5.3 高级RAG技术

#### 5.3.1 Query重写：让检索更准确

用户的问题可能表达不清，需要重写为更适合检索的形式。

```python
def rewrite_query(query: str) -> str:
    """
    重写查询，使其更适合检索

    原始问题可能口语化、含糊或包含冗余信息，
    重写后变成清晰、精确的检索查询。
    """
    prompt = """请将用户的问题重写为一个清晰、精确的检索查询。

要求：
1. 提取核心问题
2. 补充必要的上下文
3. 使用更正式的表达
4. 移除冗余信息

示例：
输入：就是那个啥，量子计算是啥来着？
输出：量子计算的定义和原理

输入：我想问一下关于大语言模型的事情，最近很火的那个
输出：大语言模型（LLM）的定义、特点和应用

输入：机器学习跟深度学习不一样吧？区别是啥？
输出：机器学习与深度学习的区别

现在请重写这个问题：
"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": f"{prompt}\n{query}"}],
        temperature=0
    )

    return response.choices[0].message.content

# 使用示例
original = "就是那个啥，量子计算是啥来着？"
rewritten = rewrite_query(original)
print(f"原始问题: {original}")
print(f"重写后: {rewritten}")
```

#### 5.3.2 HyDE：假设性文档嵌入

HyDE（Hypothetical Document Embeddings）的核心思想：
1. 让LLM先根据问题生成一个"假设性答案"
2. 用这个假设性答案去检索（而不是用问题本身）
3. 这样能找到更相关的文档

```python
def hyde_retrieve(query: str, top_k: int = 5) -> list[dict]:
    """
    HyDE检索方法

    步骤：
    1. 让LLM生成一个假设性的答案文档
    2. 将这个假设文档向量化
    3. 用假设文档的向量去检索
    """
    # Step 1: 生成假设性答案
    hyde_prompt = f"""请根据以下问题，生成一个假设性的答案文档。
这个文档应该包含对问题的详细回答，虽然可能是错误的，但格式和结构应该与真实文档类似。

问题：{query}

假设性答案文档："""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": hyde_prompt}],
        temperature=0.7  # 稍高温度，鼓励创造性
    )

    hypothetical_doc = response.choices[0].message.content
    print(f"假设性答案:\n{hypothetical_doc[:200]}...")

    # Step 2: 将假设性答案向量化
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=hypothetical_doc
    )
    hyde_vector = response.data[0].embedding

    # Step 3: 用假设性答案的向量检索
    search_params = {"metric_type": "L2", "params": {"nprobe": 10}}

    results = collection.search(
        data=[hyde_vector],
        anns_field="embedding",
        param=search_params,
        limit=top_k,
        output_fields=["text", "source"]
    )

    return [
        {
            "text": hit.entity["text"],
            "source": hit.entity.get("source", "unknown"),
            "hyde_score": hit.distance
        }
        for hit in results[0]
    ]
```

#### 5.3.3 混合检索：结合向量和关键词

```python
def hybrid_search(query: str, top_k: int = 5, alpha: float = 0.5) -> list[dict]:
    """
    混合检索：结合向量相似度和关键词匹配

    参数:
        query: 查询文本
        top_k: 返回数量
        alpha: 向量权重（1-alpha为关键词权重）

    原理：
    - 向量检索擅长语义相似性
    - 关键词检索（BM25）擅长精确匹配
    - 混合检索兼顾两者优势
    """
    # 获取向量检索结果
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=query
    )
    query_vector = response.data[0].embedding

    vector_results = collection.search(
        data=[query_vector],
        anns_field="embedding",
        param={"metric_type": "L2", "params": {"nprobe": 10}},
        limit=top_k * 2,  # 多检索一些，后面会合并
        output_fields=["text", "source"]
    )

    # 获取BM25关键词检索结果（需要Milvus支持full-text search，或使用其他引擎）
    # 这里简化处理，假设有一个text字段的全文索引

    # 融合两种结果： Reciprocal Rank Fusion (RRF)
    k = 60  # RRF参数
    fused_scores = {}

    # 向量检索结果打分
    for rank, hit in enumerate(vector_results[0]):
        doc_id = hit.id
        score = 1 / (k + rank + 1) * alpha
        fused_scores[doc_id] = fused_scores.get(doc_id, 0) + score

    # 关键词检索结果打分（这里简化处理）
    # 实际中需要接入BM25检索引擎

    # 排序并返回top_k
    ranked = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)

    # 获取最终结果
    results = []
    for doc_id, score in ranked[:top_k]:
        # 根据ID获取完整文档信息
        docs = collection.query(
            filter=f"id == {doc_id}",
            output_fields=["text", "source"]
        )
        if docs:
            results.append({
                "id": doc_id,
                "score": score,
                "text": docs[0]["text"],
                "source": docs[0].get("source", "unknown")
            })

    return results
```

---

## 六、实战项目：构建企业知识库问答系统

### 6.1 项目架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      企业知识库问答系统                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   用户界面   │───▶│   API服务   │───▶│   RAG引擎   │         │
│  │  (Web/App)  │    │  (FastAPI)  │    │             │         │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘         │
│                            │                   │                │
│                     ┌──────┴──────┐    ┌──────┴──────┐         │
│                     │   认证服务   │    │  向量数据库  │         │
│                     │   (JWT)    │    │  (Milvus)  │         │
│                     └─────────────┘    └─────────────┘         │
│                                                  │                │
│                     ┌───────────────────────────┘                │
│                     │                                            │
│              ┌──────┴──────┐    ┌─────────────┐                 │
│              │  文档处理服务 │───▶│  大语言模型  │                 │
│              │  (PDF/Word) │    │   (GPT-4)   │                 │
│              └─────────────┘    └─────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 文档处理服务

```python
# Python示例：文档处理服务
import os
from pathlib import Path
from typing import list
import PyPDF2
from docx import Document

class DocumentProcessor:
    """
    文档处理器：支持PDF、Word、TXT等格式

    功能：
    1. 读取各种格式的文档
    2. 提取文本内容
    3. 分块处理
    4. 生成Embedding
    """

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        """
        初始化处理器

        参数:
            chunk_size: 每个块的token数（约）
            overlap: 块之间的重叠token数
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

    def read_pdf(self, file_path: str) -> list[dict]:
        """
        读取PDF文件

        参数:
            file_path: PDF文件路径

        返回:
            页面列表，每个元素包含页码和文本
        """
        pages = []

        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)

            for page_num, page in enumerate(reader.pages, 1):
                text = page.extract_text()
                if text.strip():  # 跳过空页
                    pages.append({
                        'page': page_num,
                        'text': text,
                        'source': os.path.basename(file_path)
                    })

        return pages

    def read_docx(self, file_path: str) -> list[dict]:
        """
        读取Word文档

        参数:
            file_path: Word文件路径

        返回:
            段落列表
        """
        doc = Document(file_path)
        paragraphs = []

        for para_num, para in enumerate(doc.paragraphs, 1):
            text = para.text.strip()
            if text:  # 跳过空段落
                paragraphs.append({
                    'page': para_num,
                    'text': text,
                    'source': os.path.basename(file_path)
                })

        return paragraphs

    def read_txt(self, file_path: str) -> list[dict]:
        """
        读取文本文件
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return [{
            'page': 1,
            'text': content,
            'source': os.path.basename(file_path)
        }]

    def chunk_text(self, text: str, source: str = "", page: int = 0) -> list[dict]:
        """
        将长文本分块

        参数:
            text: 原始文本
            source: 来源标识
            page: 页码

        返回:
            块列表，每个元素包含块文本和元数据
        """
        # 按句子分割
        import re
        sentences = re.split(r'[。！？\n]+', text)

        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence) // 2  # 粗略估计

            if current_length + sentence_length > self.chunk_size:
                if current_chunk:
                    chunk_text = ''.join(current_chunk)
                    chunks.append({
                        'text': chunk_text,
                        'source': source,
                        'page': page,
                        'length': len(chunk_text)
                    })

                # 开始新块，保留重叠
                overlap_size = max(0, self.overlap // 10)
                current_chunk = current_chunk[-overlap_size:] if overlap_size else []
                current_chunk.append(sentence)
                current_length = sum(len(s) // 2 for s in current_chunk)
            else:
                current_chunk.append(sentence)
                current_length += sentence_length

        # 添加最后一个块
        if current_chunk:
            chunks.append({
                'text': ''.join(current_chunk),
                'source': source,
                'page': page,
                'length': len(current_chunk[-1]) if current_chunk else 0
            })

        return chunks

    def process_file(self, file_path: str) -> list[dict]:
        """
        处理单个文件，自动识别格式

        参数:
            file_path: 文件路径

        返回:
            块列表
        """
        suffix = Path(file_path).suffix.lower()

        # 根据格式选择读取方法
        if suffix == '.pdf':
            pages = self.read_pdf(file_path)
        elif suffix in ['.docx', '.doc']:
            pages = self.read_docx(file_path)
        elif suffix == '.txt':
            pages = self.read_txt(file_path)
        else:
            print(f"不支持的文件格式: {suffix}")
            return []

        # 将每个页面分块
        all_chunks = []
        for page_data in pages:
            chunks = self.chunk_text(
                page_data['text'],
                page_data['source'],
                page_data['page']
            )
            all_chunks.extend(chunks)

        return all_chunks

    def process_directory(self, dir_path: str) -> list[dict]:
        """
        批量处理目录下的所有文档

        参数:
            dir_path: 目录路径

        返回:
            所有文档的块列表
        """
        all_chunks = []

        for root, dirs, files in os.walk(dir_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    chunks = self.process_file(file_path)
                    print(f"处理完成: {file_path}, 生成 {len(chunks)} 个块")
                    all_chunks.extend(chunks)
                except Exception as e:
                    print(f"处理失败: {file_path}, 错误: {e}")

        return all_chunks

# 使用示例
if __name__ == "__main__":
    processor = DocumentProcessor(chunk_size=500, overlap=50)

    # 处理单个文件
    chunks = processor.process_file("documents/技术文档.pdf")
    print(f"\n提取了 {len(chunks)} 个文本块")

    # 批量处理目录
    all_chunks = processor.process_directory("documents/")
    print(f"总共提取了 {len(all_chunks)} 个文本块")
```

### 6.3 完整的RAG API服务

```python
# Python示例：FastAPI RAG服务
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import list, optional
import uvicorn

app = FastAPI(title="企业知识库问答API", version="1.0.0")

class QuestionRequest(BaseModel):
    """问题请求模型"""
    question: str                          # 用户问题
    top_k: int = 5                         # 检索文档数
    category: Optional[str] = None         # 可选：限定分类
    use_hyde: bool = False                 # 是否使用HyDE增强

class Document(BaseModel):
    """文档模型"""
    text: str
    source: str
    page: int = 0
    score: float = 0.0

class AnswerResponse(BaseModel):
    """回答响应模型"""
    question: str                          # 原问题
    answer: str                            # 生成的回答
    retrieved_documents: list[Document]    # 检索到的文档
    response_time: float                   # 响应时间（秒）

# 全局变量
collection = None  # Milvus集合
openai_client = None  # OpenAI客户端

@app.on_event("startup")
async def startup_event():
    """
    服务启动时的初始化
    """
    global collection, openai_client

    # 初始化OpenAI客户端
    from openai import OpenAI
    openai_client = OpenAI(api_key="your-api-key")

    # 连接Milvus
    from pymilvus import connections, Collection
    connections.connect(alias="default", host="localhost", port="19530")
    collection = Collection("knowledge_base")
    collection.load()

    print("服务启动完成")

@app.post("/api/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    问答接口

    用户提问，系统检索相关文档，生成回答
    """
    import time
    start_time = time.time()

    try:
        # Step 1: Query重写（可选）
        if request.use_hyde:
            # 使用HyDE方法
            query = rewrite_query_with_hyde(request.question)
        else:
            query = request.question

        # Step 2: 检索相关文档
        docs = retrieve_documents(
            query,
            top_k=request.top_k,
            category=request.category
        )

        # Step 3: 生成回答
        answer = generate_answer(request.question, docs)

        # 计算响应时间
        response_time = time.time() - start_time

        return AnswerResponse(
            question=request.question,
            answer=answer,
            retrieved_documents=[
                Document(
                    text=doc['text'],
                    source=doc['source'],
                    page=doc.get('page', 0),
                    score=doc.get('score', 0.0)
                )
                for doc in docs
            ],
            response_time=round(response_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/index/document")
async def index_document(file_url: str, category: str = "general"):
    """
    文档索引接口

    将新的文档添加到知识库
    """
    # 下载并处理文档
    processor = DocumentProcessor()
    chunks = processor.process_file(file_url)

    # 向量化并存储
    vectors_to_insert = []
    for chunk in chunks:
        vector = get_embedding(chunk['text'])
        vectors_to_insert.append({
            'embedding': vector,
            'text': chunk['text'],
            'source': chunk['source'],
            'page': chunk['page'],
            'category': category
        })

    # 批量插入Milvus
    insert_to_milvus(vectors_to_insert)

    return {"status": "success", "indexed_chunks": len(chunks)}

def retrieve_documents(query: str, top_k: int = 5, category: str = None) -> list[dict]:
    """
    检索文档
    """
    # 向量化查询
    response = openai_client.embeddings.create(
        model="text-embedding-ada-002",
        input=query
    )
    query_vector = response.data[0].embedding

    # 搜索
    from pymilvus import Filter
    search_params = {"metric_type": "L2", "params": {"nprobe": 10}}

    filter_expr = f'category == "{category}"' if category else None

    results = collection.search(
        data=[query_vector],
        anns_field="embedding",
        param=search_params,
        limit=top_k,
        expr=filter_expr,
        output_fields=["text", "source", "page", "category"]
    )

    return [
        {
            "text": hit.entity["text"],
            "source": hit.entity["source"],
            "page": hit.entity.get("page", 0),
            "score": hit.distance,
            "category": hit.entity.get("category", "general")
        }
        for hit in results[0]
    ]

def generate_answer(question: str, docs: list[dict]) -> str:
    """
    基于文档生成回答
    """
    # 构建上下文
    context_parts = []
    for i, doc in enumerate(docs, 1):
        context_parts.append(f"[文档{i}](来源: {doc['source']} 第{doc['page']}页)\n{doc['text']}")

    context = "\n\n".join(context_parts)

    # 构建Prompt
    prompt = f"""你是一个专业的知识问答助手。请根据以下参考文档回答用户的问题。

要求：
1. 只基于给定文档回答，不要编造信息
2. 如果文档中没有相关信息，请如实说明
3. 适当引用文档来源

---
参考文档：
{context}

---
用户问题：{question}

回答："""

    # 调用GPT-4
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个有帮助的专业知识问答助手。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1000
    )

    return response.choices[0].message.content

def rewrite_query_with_hyde(query: str) -> str:
    """
    使用HyDE重写查询
    """
    # 生成假设性答案
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": f"请根据这个问题生成一个假设性的答案：{query}"}
        ],
        temperature=0.7
    )

    hypothetical = response.choices[0].message.content

    # 将假设性答案向量化（返回作为新的查询）
    return hypothetical

# 启动服务
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 七、性能优化与最佳实践

### 7.1 向量数据库性能调优

#### 7.1.1 索引参数调优

```python
# Milvus索引调优示例
# 不同的索引类型适用于不同的场景

# 场景1：追求精度，数据量小
index_params_flat = {
    "index_type": "FLAT",
    "metric_type": "L2",
    "params": {}
}
# 优点：100%召回率
# 缺点：慢，不适合大数据量

# 场景2：平衡精度和速度（推荐）
index_params_ivf = {
    "index_type": "IVF_FLAT",
    "metric_type": "L2",
    "params": {"nlist": 4096}  # 聚类数量，越大越精准但越慢
}
# 优点：速度快，可调精度
# 缺点：略有精度损失

# 场景3：大数据量，高QPS
index_params_hnsw = {
    "index_type": "HNSW",
    "metric_type": "L2",
    "params": {
        "M": 16,           # 连接数，越大越精准越占内存
        "efConstruction": 200  # 构建时的搜索范围
    }
}
# 优点：极快，QPS高
# 缺点：内存占用高，构建慢
```

#### 7.1.2 搜索参数调优

```python
# 搜索参数调优

# IVF索引的nprobe参数
search_params = {
    "metric_type": "L2",
    "params": {
        "nprobe": 16  # 搜索的聚类中心数，越大越精准但越慢
    }
}

# HNSW索引的ef参数
search_params_hnsw = {
    "metric_type": "L2",
    "params": {
        "ef": 128  # 搜索范围，越大越精准但越慢
    }
}

# 性能vs精度权衡示例
import time

def benchmark_search(index, query_vector, nprobe_values):
    """测试不同nprobe值的性能"""
    results = []

    for nprobe in nprobe_values:
        search_params = {"params": {"nprobe": nprobe}}

        start = time.time()
        for _ in range(100):  # 执行100次
            index.search(data=[query_vector], param=search_params, limit=10)
        elapsed = time.time() - start

        results.append({
            "nprobe": nprobe,
            "avg_time_ms": elapsed * 10,  # 平均每次毫秒数
            "precision": "高" if nprobe > 50 else "中" if nprobe > 20 else "低"
        })

    return results
```

### 7.2 Embedding模型选择指南

| 模型 | 维度 | 适用语言 | 特点 | 推荐场景 |
|------|------|----------|------|----------|
| **text-embedding-ada-002** | 1536 | 多语言 | OpenAI官方，稳定 | 通用场景 |
| **text2vec-base-chinese** | 768 | 中文 | 中文优化 | 中文知识库 |
| **BGE-large-zh** | 1024 | 中文 | 性能最佳 | 高精度需求 |
| **m3e-base** | 768 | 中文 | 开源免费 | 成本敏感 |
| **text-embedding-3-small** | 1536/256 | 多语言 | 轻量快速 | 高并发场景 |
| **text-embedding-3-large** | 3072 | 多语言 | 高精度 | 高精度需求 |

### 7.3 分块策略选择

| 策略 | 块大小 | 重叠 | 适用场景 |
|------|--------|------|----------|
| **固定大小** | 300-500 tokens | 50-100 tokens | 通用场景 |
| **按段落** | 变化的段落长度 | 无/少量 | 结构清晰的文档 |
| **语义分块** | 变化的语义单元 | 可变 | 长文档、主题多样 |
| **递归分块** | 500-1000 chars | 100-200 chars | 代码、混合内容 |

### 7.4 常见问题与解决方案

#### 问题1：检索结果不相关

**可能原因**：
1. Embedding模型不适合你的领域
2. 分块策略不合理（块太小或太大）
3. 检索参数设置不当

**解决方案**：
```python
# 方案1：使用领域特定的Embedding模型
# 例如针对医学文档，使用医学领域的Embedding

# 方案2：调整分块大小
# 太小：丢失上下文；太大：引入噪声
processor = DocumentProcessor(chunk_size=750, overlap=100)

# 方案3：增加检索数量，过滤后使用
results = collection.search(..., limit=20)  # 多检索一些
filtered = [r for r in results if r.distance < threshold]  # 过滤
```

#### 问题2：生成回答幻觉

**可能原因**：
1. 检索结果不准确，注入了错误信息
2. Prompt设计不当，没有约束模型

**解决方案**：
```python
# 方案1：添加引用约束
prompt = """
你是一个知识问答助手。只根据以下文档回答。
如果文档中没有相关信息，请明确说"我没有找到相关信息"。

文档：{context}

问题：{question}
"""

# 方案2：添加置信度检查
if len(docs) == 0 or avg_score > threshold:
    answer = "我没有找到足够相关的文档来回答这个问题。"
else:
    answer = generate_answer(question, docs)
```

#### 问题3：响应延迟高

**可能原因**：
1. 向量数据库查询慢
2. Embedding API调用慢
3. LLM生成慢

**解决方案**：
```python
# 方案1：使用本地Embedding模型
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
# 本地模型，无API延迟

# 方案2：缓存常用查询的向量
cache = {}

def cached_embed(text):
    if text not in cache:
        cache[text] = model.encode(text)
    return cache[text]

# 方案3：使用异步并行
import asyncio

async def async_rag(query):
    # 并行执行Embedding和初步检索
    embed_task = asyncio.create_task(get_embedding_async(query))
    docs_task = asyncio.create_task(retrieve_docs_async(query))

    # 等待两者完成
    query_vector = await embed_task
    docs = await docs_task

    return docs
```

---

## 八、总结与展望

### 8.1 核心知识点回顾

```
┌─────────────────────────────────────────────────────────────┐
│                      向量数据库与Embedding知识体系            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 向量基础                                                 │
│     ├── 向量定义：高维空间中的点                               │
│     ├── 距离度量：余弦、欧氏、内积                             │
│     └── 向量索引：FLAT、IVF、HNSW                            │
│                                                             │
│  2. Embedding技术                                           │
│     ├── 文本向量化：text2vec、BGE、CLIP                       │
│     ├── 图像向量化：CLIP、ResNet                             │
│     └── 模型选择：场景、精度、成本权衡                        │
│                                                             │
│  3. 主流向量数据库                                           │
│     ├── Pinecone：云托管，简易上手                            │
│     ├── Milvus：开源可私有，亿级规模                          │
│     ├── Weaviate：模块化，内置向量化                          │
│     └── Qdrant：高性能，Rust实现                             │
│                                                             │
│  4. RAG技术                                                 │
│     ├── Query重写：HyDE、Rewrite                             │
│     ├── 混合检索：向量+关键词                                 │
│     └── 答案生成：上下文注入、引用约束                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 未来发展趋势

1. **多模态向量检索**：文本、图像、视频、音频统一向量化
2. **实时向量化**：流式数据实时处理和检索
3. **可解释性增强**：不仅返回结果，还解释为什么相关
4. **隐私保护检索**：联邦学习+向量搜索的结合
5. **软硬件协同**：专用向量搜索芯片

### 8.3 学习资源推荐

| 资源类型 | 推荐内容 |
|----------|----------|
| **官方文档** | Pinecone Docs、Milvus Docs、Weaviate Docs |
| **论文** | 《Retriever-Augmented Generation》《Dense Passage Retrieval》 |
| **开源项目** | LangChain、RAGflow、Quivr |
| **视频教程** | YouTube向量数据库系列教程 |
| **实践平台** | Pinecone Cloud、Weaviate Cloud |

---

**文档字数**：约28000字

**核心要点**：
1. 向量数据库是AI时代的"长期记忆系统"
2. Embedding将语义转换为向量，相似内容在向量空间中距离更近
3. 主流向量数据库：Pinecone（云）、Milvus（开源）、Weaviate（模块化）
4. RAG通过检索+生成，让AI能够基于最新知识回答问题
5. 实战中需要关注：Embedding模型选择、分块策略、检索参数调优
