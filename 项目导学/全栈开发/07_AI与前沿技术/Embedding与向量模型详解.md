# Embedding 与向量模型详解

## 一、文本向量化的基本原理

### 1.1 什么是 Embedding

Embedding（嵌入）是将高维离散数据（如文本、图像、音频）映射到低维连续向量空间的技术。在自然语言处理中，Embedding 将单词、句子或文档转换为固定长度的数值向量，使计算机能够理解和处理语义信息。

**核心思想**：语义相似的文本在向量空间中距离相近。

```typescript
// 文本到向量的映射示意
const text = "人工智能正在改变世界";
// 经过 Embedding 模型后，转换为：
// [-0.023, 0.045, -0.012, 0.087, ..., 0.034]  // 1536 维向量
```

### 1.2 Embedding 的发展历程

| 阶段 | 技术 | 特点 |
|------|------|------|
| **词袋模型** | One-Hot、TF-IDF | 稀疏、高维、无语义 |
| **分布式表示** | Word2Vec、GloVe | 密集、低维、有语义 |
| **上下文嵌入** | BERT、GPT | 动态向量、上下文感知 |
| **大语言模型** | GPT-4、Claude | 超大规模、通用理解 |

### 1.3 Transformer 与 Self-Attention

现代 Embedding 模型大多基于 Transformer 架构，其核心是 Self-Attention（自注意力）机制：

```python
# Self-Attention 计算过程（伪代码）
def self_attention(query, key, value):
    """
    Q: 查询向量 - 当前词想要查找的信息
    K: 键向量 - 每个词提供的信息标识
    V: 值向量 - 每个词的实际内容
    """
    # 计算注意力分数：Q 与 K 的点积
    scores = torch.matmul(query, key.transpose(-2, -1))
    # 缩放处理，防止梯度消失
    scores = scores / math.sqrt(key.size(-1))
    # Softmax 归一化
    attention_weights = F.softmax(scores, dim=-1)
    # 加权求和
    output = torch.matmul(attention_weights, value)
    return output, attention_weights
```

**Self-Attention 的核心优势**：

1. **并行计算**：摆脱了 RNN 的顺序依赖限制
2. **长距离依赖**：任意位置之间直接交互，无信息衰减
3. **可解释性**：注意力权重可视化展示词语关联

### 1.4 句子 Embedding vs 词 Embedding

```python
# 词 Embedding：每个词一个向量
word_emb = {
    "人工智能": [0.12, -0.34, 0.56, ...],
    "正在": [0.01, 0.23, -0.45, ...],
    "改变": [-0.78, 0.12, 0.34, ...],
    "世界": [0.56, -0.23, 0.89, ...]
}

# 句子 Embedding：整个句子一个向量（通过池化或 CLS token）
sentence_emb = {
    "人工智能正在改变世界": [0.34, -0.12, 0.67, ...]  # 1536 维
}
```

---

## 二、主流 Embedding 模型详解

### 2.1 OpenAI text-embedding 系列

OpenAI 提供的 Embedding 服务，是业界最广泛使用的方案之一。

#### 模型版本对比

| 模型 | 维度 | MTEB 得分 | 输入上限 | 特点 |
|------|------|-----------|----------|------|
| text-embedding-3-large | 3072 | 64.6% | 8191 tokens | 最新最强 |
| text-embedding-3-small | 1536 | 62.3% | 8191 tokens | 高性价比 |
| text-embedding-ada-002 | 1536 | 60.1% | 8191 tokens | 已弃用 |

#### API 使用示例

```typescript
// TypeScript 调用 OpenAI Embedding API
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 获取文本的 Embedding 向量
 * @param text - 输入文本（自动进行预处理和分词）
 * @param model - 使用的模型
 * @returns 1536 维浮点数向量
 */
async function getEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[]> {
  const response = await client.embeddings.create({
    model: model,
    input: text,
    // 编码格式：base64 或 float
    encoding_format: 'float'
  });

  // 返回向量数组
  return response.data[0].embedding;
}

// 批量处理示例
async function batchEmbeddings(texts: string[]) {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts  // 最多支持 2048 个文本
  });

  return response.data.map(item => ({
    index: item.index,
    embedding: item.embedding
  }));
}

// 使用示例
const texts = [
  "人工智能正在改变世界",
  "深度学习是机器学习的一个分支",
  "自然语言处理用于处理文本数据"
];

const results = await batchEmbeddings(texts);
console.log(`生成了 ${results.length} 个向量，每个向量 ${results[0].embedding.length} 维`);
```

#### 优势与局限

**优势**：
- 品质稳定，迭代持续
- 与 GPT 系列模型高度适配
- 完善的云端服务

**局限**：
- 需要 API 调用，有成本
- 数据需上传到 OpenAI 服务器
- 网络延迟影响实时性

### 2.2 BGE 模型（BAAI General Embedding）

BGE 是北京人工智能研究院（BAAI）开源的中英文通用 Embedding 模型。

#### 模型列表

| 模型 | 维度 | 语言 | MTEB 得分 | 备注 |
|------|------|------|-----------|------|
| bge-large-zh-v1.5 | 1024 | 中英 | 65.4% | 中文最强开源 |
| bge-base-zh-v1.5 | 768 | 中英 | 63.1% | 均衡之选 |
| bge-small-zh-v1.5 | 384 | 中英 | 58.6% | 轻量快速 |
| bge-m3 | 1024 | 多语言 | 63.2% | 100+语言 |

#### 本地部署示例

```python
# Python 使用 BGE 模型
from FlagEmbedding import FlagModel
import numpy as np

# 初始化模型（首次自动下载）
model = FlagModel('BAAI/bge-large-zh-v1.5',
                  use_fp16=True,  # 使用半精度加速
                  device='cuda')  # GPU 加速

def compute_embeddings(texts: list[str]) -> np.ndarray:
    """
    批量计算文本 Embedding

    Args:
        texts: 文本列表
    Returns:
        numpy 数组，shape: (n, 1024)
    """
    embeddings = model.encode(texts,
                              batch_size=32,
                              max_length=512,
                              normalize=True)  # L2 归一化
    return embeddings

# 单文本查询
query = "如何学习深度学习？"
query_embedding = model.encode(query)

# 文档库
documents = [
    "深度学习是机器学习的一个分支",
    "神经网络是深度学习的基础",
    "Python 是深度学习最常用的编程语言"
]

doc_embeddings = compute_embeddings(documents)

# 计算相似度
similarities = np.matmul(doc_embeddings, query_embedding)
print(f"相似度得分: {similarities}")
# 输出: [0.7823, 0.8567, 0.6234]
```

#### TypeScript 前端调用封装

```typescript
// 前端调用自建 BGE 服务的封装
interface EmbeddingRequest {
  model?: string;
  input: string | string[];
}

interface EmbeddingResponse {
  model: string;
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
}

/**
 * BGE Embedding 服务调用封装
 */
class BGEClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * 获取文本 Embedding 向量
   */
  async embed(input: string | string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseURL}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'bge-large-zh-v1.5',
        input
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding 请求失败: ${response.statusText}`);
    }

    const data: EmbeddingResponse = await response.json();
    return data.data.sort((a, b) => a.index - b.index)
                     .map(item => item.embedding);
  }
}

// 使用示例
const client = new BGEClient('http://localhost:8000', 'your-api-key');
const embeddings = await client.embed("这是一个测试文本");
console.log(`向量维度: ${embeddings[0].length}`);
```

### 2.3 M3E 模型（Massive Mixed Embedding）

M3E 是有赞团队开源的多语言、多功能 Embedding 模型，专注于中文场景。

#### 核心特性

```python
# M3E 模型特点
m3e_features = {
    "训练数据": "2800万条中文对话数据",
    "支持语言": "中文、英文、日文、韩文等",
    "维度": 1536,
    "适用场景": "对话检索、情感分析、文本分类",
    "开源协议": "Apache-2.0"
}
```

#### 使用示例

```python
from m3e import M3EModel
import numpy as np

# 加载模型
model = M3EModel(model_name='m3e-base', device='cuda')

# 计算文本相似度
def calculate_similarity(text1: str, text2: str) -> float:
    """计算两个文本的余弦相似度"""
    emb1 = model.encode(text1)
    emb2 = model.encode(text2)

    # 余弦相似度
    similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    return similarity

# 示例
score = calculate_similarity(
    "这个手机拍照效果很好",
    "这款手机的相机表现优秀"
)
print(f"相似度: {score:.4f}")  # 输出: 相似度: 0.8923
```

### 2.4 Jina Embedding 模型

Jina AI 提供的 Embedding 服务，以出色的多语言支持和可解释性著称。

#### 模型对比

| 模型 | 维度 | 上下文 | MTEB 得分 | 特点 |
|------|------|--------|-----------|------|
| jina-embeddings-v3 | 1024 | 8192 | 66.4% | 特性提取最强 |
| jina-embeddings-v2-base | 768 | 8192 | 64.6% | 均衡表现 |

#### 多语言能力展示

```typescript
// Jina Embedding 多语言示例
interface MultilingualEmbedding {
  language: string;
  text: string;
  embedding: number[];
}

// 初始化 Jina 客户端
const jinaClient = {
  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.JINA_API_KEY
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: texts,
        task: 'retrieval.passage'  // 可选: retrieval.query, retrieval.passage, classification
      })
    });

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
};

// 多语言语义搜索示例
async function multilingualSearch() {
  const documents = [
    { lang: 'zh', text: '人工智能技术快速发展' },
    { lang: 'en', text: 'AI technology is developing rapidly' },
    { lang: 'ja', text: 'AI技術は急速に発展しています' }
  ];

  const query = 'AI技术的进步';

  // 获取查询向量
  const queryEmbedding = await jinaClient.embed([query]);

  // 获取文档向量
  const docTexts = documents.map(d => d.text);
  const docEmbeddings = await jinaClient.embed(docTexts);

  // 计算相似度
  const scores = docEmbeddings[0].map((docVec: number[], i: number) => ({
    lang: documents[i].lang,
    text: documents[i].text,
    score: cosineSimilarity(queryEmbedding[0], docVec)
  }));

  // 排序输出
  scores.sort((a, b) => b.score - a.score);

  return scores;
  // 输出:
  // 1. { lang: 'en', text: 'AI technology...', score: 0.9123 }
  // 2. { lang: 'zh', text: '人工智能技术...', score: 0.8856 }
  // 3. { lang: 'ja', text: 'AI技術は...', score: 0.8234 }
}
```

---

## 三、Embedding 模型选择指南

### 3.1 选型决策树

```
                    ┌─────────────────────┐
                    │   开始选择模型       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  是否需要中文支持？ │
                    └──────────┬──────────┘
                         │            │
                        是            否
                         │            │
          ┌──────────────▼─────────────┐
          │   是否有隐私合规要求？     │
          └──────────────┬─────────────┘
                   │            │
                  是            否
                   │            │
      ┌────────────▼┐     ┌─────▼─────────┐
      │  开源模型   │     │  OpenAI/Jina  │
      │  BGE/M3E   │     │   云端服务     │
      └────────────┘     └───────────────┘
```

### 3.2 关键考量因素

| 因素 | 说明 | 推荐选择 |
|------|------|----------|
| **语言支持** | 中文/英文/多语言 | 中文: BGE/M3E；多语言: Jina/BGE-m3 |
| **部署方式** | 本地/云端/混合 | 隐私敏感: 本地部署；成本敏感: 云端 |
| **向量维度** | 影响存储和计算 | 存储受限: 小维度模型；精度优先: 大维度 |
| **响应延迟** | 实时性要求 | 实时: 本地小模型；离线: 云端大模型 |
| **成本** | API费用/硬件成本 | 调用量小: 云端；调用量大: 本地 |

### 3.3 场景化推荐

```typescript
// 场景化模型选择配置
const EMBEDDING_CONFIG = {
  // 场景1：企业内部知识库（隐私优先）
  enterpriseKnowledgeBase: {
    model: 'BAAI/bge-large-zh-v1.5',
    dimension: 1024,
    deployType: 'local',
    reason: '数据不出本地，支持中文，精度高'
  },

  // 场景2：SaaS 产品（成本优先）
  saasProduct: {
    model: 'text-embedding-3-small',
    dimension: 1536,
    deployType: 'cloud',
    reason: '维护成本低，稳定可靠'
  },

  // 场景3：多语言应用
  multilingualApp: {
    model: 'jina-embeddings-v3',
    dimension: 1024,
    deployType: 'cloud',
    reason: '100+语言支持，开箱即用'
  },

  // 场景4：实时对话系统
  realTimeChat: {
    model: 'bge-small-zh-v1.5',
    dimension: 384,
    deployType: 'local',
    reason: '低延迟，高并发支持'
  }
} as const;
```

### 3.4 性能基准对比

```python
# 各模型在中文 benchmark 上的表现
BENCHMARK_RESULTS = {
    "MTEB": {
        "description": "Massive Text Embedding Benchmark",
        "tasks": ["检索", "分类", "聚类", "排序"],
        "models": {
            "text-embedding-3-large": {"score": 64.6, "rank": 1},
            "jina-embeddings-v3": {"score": 66.4, "rank": 2},
            "bge-large-zh-v1.5": {"score": 65.4, "rank": 3},
            "m3e-base": {"score": 62.8, "rank": 4},
            "text-embedding-3-small": {"score": 62.3, "rank": 5}
        }
    },
    "CMTEB": {
        "description": "中文 MTEB",
        "tasks": ["中文检索", "中文分类", "中文语义相似度"],
        "models": {
            "bge-large-zh-v1.5": {"score": 65.4, "rank": 1},
            "m3e-large": {"score": 64.2, "rank": 2},
            "text-embedding-3-large": {"score": 63.8, "rank": 3}
        }
    }
}
```

---

## 四、向量相似度计算详解

### 4.1 余弦相似度（Cosine Similarity）

余弦相似度衡量两个向量方向的相似程度，取值范围 [-1, 1]。

```
余弦相似度 = (A · B) / (|A| × |B|)
           = Σ(Ai × Bi) / √(ΣAi²) × √(ΣBi²)
```

```typescript
/**
 * 计算余弦相似度
 *
 * 原理：计算两个向量夹角的余弦值
 * - 夹角为 0°（完全相同）：相似度 = 1
 * - 夹角为 90°（正交）：相似度 = 0
 * - 夹角为 180°（完全相反）：相似度 = -1
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('向量维度不一致');
    }

    // 计算点积：Σ(Ai × Bi)
    let dotProduct = 0;
    // 计算模长：√(ΣAi²)
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    // 避免除零错误
    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 示例
const vector1 = [0.1, 0.2, 0.3, 0.4];
const vector2 = [0.1, 0.2, 0.3, 0.4];
const vector3 = [-0.1, -0.2, -0.3, -0.4];

console.log(cosineSimilarity(vector1, vector2)); // 输出: 1.0（完全相同）
console.log(cosineSimilarity(vector1, vector3)); // 输出: -1.0（完全相反）
```

### 4.2 点积（Dot Product）

点积是元素对应相乘后求和，直接反映向量投影关系。

```typescript
/**
 * 计算点积
 *
 * 特点：
 * - 未归一化，受向量长度影响
 * - 值域: (-∞, +∞)
 * - 适合比较来自同一模型的向量（已归一化）
 */
function dotProduct(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('向量维度不一致');
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
        sum += vecA[i] * vecB[i];
    }
    return sum;
}

/**
 * 带归一化的点积（等价于余弦相似度）
 */
function normalizedDotProduct(vecA: number[], vecB: number[]): number {
    const normA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct(vecA, vecB) / (normA * normB);
}
```

### 4.3 欧氏距离（Euclidean Distance）

欧氏距离是直线距离，衡量向量在空间中的绝对距离。

```
欧氏距离 = √(Σ(Ai - Bi)²)
```

```typescript
/**
 * 计算欧氏距离
 *
 * 特点：
 * - 有物理含义：向量点在空间中的直线距离
 * - 值域: [0, +∞)
 * - 受向量幅度影响大
 */
function euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('向量维度不一致');
    }

    let sumSquaredDiff = 0;
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquaredDiff += diff * diff;
    }

    return Math.sqrt(sumSquaredDiff);
}

/**
 * 欧氏距离转相似度（归一化到 [0, 1]）
 *
 * 公式: similarity = 1 / (1 + distance)
 */
function euclideanToSimilarity(distance: number): number {
    return 1 / (1 + distance);
}
```

### 4.4 相似度算法对比与选择

```typescript
/**
 * 相似度算法对比总结
 */
const SIMILARITY_COMPARISON = {
    cosine: {
        name: '余弦相似度',
        range: [-1, 1],
        // 取值越大表示越相似
        // 1 = 完全相同, 0 = 正交, -1 = 完全相反
        suitable: '文本语义相似度（不关心长度）',
        sensitivity: '只关心方向，不关心幅度'
    },

    dot: {
        name: '点积',
        range: (-∞, +∞),
        // 值越大表示越相似
        // 需要向量已经过 L2 归一化才能直接比较
        suitable: '已归一化向量的快速相似度计算',
        sensitivity: '同时关心方向和幅度'
    },

    euclidean: {
        name: '欧氏距离',
        range: [0, +∞),
        // 取值越小表示越相似
        // 0 = 完全相同
        suitable: '聚类分析、推荐系统',
        sensitivity: '同时受方向和幅度影响'
    }
} as const;

/**
 * 向量数据库查询性能对比
 */
const DB_QUERY_EXAMPLE = {
    pgvector: {
        operators: ['<->', '<=>', '<#>', '<+>'],
        default: '<->',  // 欧氏距离
        note: '<=> 表示余弦距离'
    },
    milvus: {
        metrics: ['COSINE', 'IP', 'L2'],
        default: 'COSINE',
        note: 'IP 为内积，L2 为欧氏距离'
    },
    pinecone: {
        metrics: ['cosine', 'euclidean', 'dotproduct'],
        default: 'cosine',
        note: '建议使用与训练时相同的度量'
    }
};
```

---

## 五、Embedding 在 RAG 中的应用

### 5.1 RAG 架构概述

```
┌──────────────────────────────────────────────────────────────┐
│                       RAG 系统架构                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌──────────┐    ┌─────────────────────┐   │
│   │  用户   │───▶│  Query    │───▶│  Embedding 模型      │   │
│   │  输入   │    │  预处理   │    │  (文本 → 向量)       │   │
│   └─────────┘    └──────────┘    └──────────┬──────────┘   │
│                                               │               │
│                                               ▼               │
│                                    ┌─────────────────────┐   │
│                                    │   向量数据库         │   │
│                                    │   (相似度检索)       │   │
│                                    └──────────┬──────────┘   │
│                                               │               │
│                                               ▼               │
│   ┌─────────┐    ┌──────────┐    ┌─────────────────────┐   │
│   │  用户   │◀───│  生成    │◀───│  LLM (答案生成)      │   │
│   │  答案   │    │  整合    │    │  (Context + Query)   │   │
│   └─────────┘    └──────────┘    └─────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 文档处理与索引构建

```typescript
/**
 * RAG 文档处理流程
 *
 * 1. 文档加载与解析
 * 2. 文本分块（Chunking）
 * 3. Embedding 向量化
 * 4. 存入向量数据库
 */

// 文档分块策略
interface ChunkConfig {
    chunkSize: number;       // 块大小（字符数）
    chunkOverlap: number;    // 块重叠数
    separator: string;       // 分隔符
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
    chunkSize: 500,           // 每个块约 500 字符
    chunkOverlap: 50,         // 块之间重叠 50 字符，保证上下文连续
    separator: '\n\n'         // 按段落分隔
};

/**
 * 文本分块函数
 */
function chunkText(text: string, config: ChunkConfig): string[] {
    const { chunkSize, chunkOverlap, separator } = config;

    // 按分隔符拆分
    const paragraphs = text.split(separator).filter(p => p.trim());

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // 如果当前块加上段落超过限制，则保存当前块并开始新块
        if (currentChunk.length + paragraph.length > chunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            // 开始新块，保留重叠部分
            currentChunk = currentChunk.slice(-chunkOverlap) + paragraph;
        } else {
            currentChunk += separator + paragraph;
        }
    }

    // 添加最后一个块
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * 文档索引构建
 */
interface DocumentIndex {
    id: string;
    content: string;
    metadata: {
        source: string;
        page?: number;
        createdAt: Date;
    };
    embedding: number[];
}

class RAGIndexer {
    private embeddingClient: any;
    private vectorDB: any;

    constructor(embeddingClient: any, vectorDB: any) {
        this.embeddingClient = embeddingClient;
        this.vectorDB = vectorDB;
    }

    /**
     * 构建文档索引
     */
    async indexDocument(
        documentId: string,
        text: string,
        metadata: Record<string, any>
    ): Promise<void> {
        // 1. 文本分块
        const chunks = chunkText(text, DEFAULT_CHUNK_CONFIG);
        console.log(`文档 ${documentId} 被分成 ${chunks.length} 个块`);

        // 2. 批量计算 Embedding
        const embeddings = await this.embeddingClient.embed(chunks);

        // 3. 构建索引数据
        const indexData: DocumentIndex[] = chunks.map((content, index) => ({
            id: `${documentId}-chunk-${index}`,
            content,
            metadata: {
                source: documentId,
                chunkIndex: index,
                ...metadata
            },
            embedding: embeddings[index]
        }));

        // 4. 存入向量数据库
        await this.vectorDB.insert(indexData);

        console.log(`索引构建完成: ${indexData.length} 个向量已存入`);
    }
}
```

### 5.3 语义检索流程

```typescript
/**
 * RAG 语义检索流程
 */

// 检索配置
interface RetrievalConfig {
    topK: number;              // 返回最相似的 K 个块
    minScore: number;         // 最低相似度阈值
    rerank: boolean;          // 是否启用重排序
}

const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
    topK: 5,
    minScore: 0.7,
    rerank: true
};

/**
 * 语义检索函数
 */
async function semanticSearch(
    query: string,
    config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG
): Promise<Array<{
    content: string;
    score: number;
    metadata: Record<string, any>;
}>> {
    // 1. 将用户问题转换为向量
    const queryEmbedding = await embeddingClient.embed([query]);

    // 2. 在向量数据库中进行相似度检索
    const searchResults = await vectorDB.search({
        vector: queryEmbedding[0],
        topK: config.topK * 2,  // 多检索一些，后续过滤
        includeMetadata: true
    });

    // 3. 过滤低分结果
    let filteredResults = searchResults.filter(
        result => result.score >= config.minScore
    );

    // 4. 可选：重排序（使用更精确的模型）
    if (config.rerank) {
        filteredResults = await rerankResults(query, filteredResults);
    }

    // 5. 返回 topK 结果
    return filteredResults.slice(0, config.topK).map(result => ({
        content: result.metadata.content,
        score: result.score,
        metadata: result.metadata
    }));
}

/**
 * 完整 RAG 查询流程
 */
interface RAGAnswer {
    answer: string;
    sources: Array<{
        content: string;
        score: number;
    }>;
    query: string;
}

async function ragQuery(userQuery: string): Promise<RAGAnswer> {
    // 1. 语义检索相关文档
    const retrievedDocs = await semanticSearch(userQuery);

    // 2. 构建 Prompt
    const context = retrievedDocs
        .map((doc, i) => `[文档${i + 1}] ${doc.content}`)
        .join('\n\n');

    const prompt = `
请根据以下参考文档回答用户问题。如果文档中没有相关信息，请如实说明。

【用户问题】
${userQuery}

【参考文档】
${context}

【回答要求】
1. 基于参考文档准确回答
2. 标注参考来源
3. 如果信息不足，说明情况
`;

    // 3. 调用 LLM 生成答案
    const llmResponse = await llmClient.chat({
        messages: [{ role: 'user', content: prompt }]
    });

    return {
        answer: llmResponse.content,
        sources: retrievedDocs.map(doc => ({
            content: doc.content.slice(0, 100) + '...',
            score: doc.score
        })),
        query: userQuery
    };
}
```

### 5.4 混合检索策略

```typescript
/**
 * 混合检索：向量检索 + 关键词检索
 */

// BM25 关键词检索（传统稀疏检索）
import { BM25 } from 'bm25';

class HybridRetriever {
    private vectorDB: any;
    private bm25: BM25;
    private alpha: number;  // 向量权重

    constructor(vectorDB: any, alpha: number = 0.7) {
        this.vectorDB = vectorDB;
        this.alpha = alpha;
        this.bm25 = new BM25();
    }

    /**
     * 混合检索
     *
     * @param query - 用户查询
     * @param topK - 返回数量
     * @returns 融合后的结果
     */
    async hybridSearch(query: string, topK: number = 5) {
        // 1. 向量检索
        const queryEmbedding = await this.embeddingClient.embed([query]);
        const vectorResults = await this.vectorDB.search({
            vector: queryEmbedding[0],
            topK: topK * 2
        });

        // 2. BM25 关键词检索
        const bm25Results = await this.bm25.search(query, topK * 2);

        // 3. Reciprocal Rank Fusion (RRF) 融合
        const fusedResults = this.reciprocalRankFusion(
            vectorResults,
            bm25Results,
            topK
        );

        return fusedResults;
    }

    /**
     * 倒数排序融合 (RRF)
     *
     * 公式: RRF(d) = Σ 1/(k + rank_i(d))
     * k: 平滑参数（通常为 60）
     */
    private reciprocalRankFusion(
        vectorResults: any[],
        bm25Results: any[],
        topK: number
    ) {
        const k = 60;  // RRF 平滑参数
        const scores = new Map<string, { doc: any; score: number }>();

        // 向量检索得分
        vectorResults.forEach((result, rank) => {
            const rrfScore = 1 / (k + rank + 1);
            scores.set(result.id, {
                doc: result,
                score: this.alpha * rrfScore
            });
        });

        // BM25 检索得分
        bm25Results.forEach((result, rank) => {
            const rrfScore = 1 / (k + rank + 1);
            const existing = scores.get(result.id);
            if (existing) {
                existing.score += (1 - this.alpha) * rrfScore;
            } else {
                scores.set(result.id, {
                    doc: result,
                    score: (1 - this.alpha) * rrfScore
                });
            }
        });

        // 排序返回
        return Array.from(scores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.doc);
    }
}
```

---

## 六、向量维度与质量的权衡

### 6.1 维度的重要性

```typescript
/**
 * 向量维度的影响分析
 */

const DIMENSION_ANALYSIS = {
    low_dimension: {
        range: '128-384',
        pros: [
            '存储空间小（节省 60-80%）',
            '检索速度快（10x 加速）',
            '适合实时场景'
        ],
        cons: [
            '表达能力有限',
            '语义区分度降低',
            '复杂语义可能丢失'
        ],
        useCases: ['实时对话', '推荐系统', '轻量级应用']
    },

    medium_dimension: {
        range: '512-768',
        pros: [
            '性价比最佳',
            '平衡精度与性能',
            '适配大多数场景'
        ],
        cons: [
            '比低维度占用更多存储'
        ],
        useCases: ['通用检索', '知识库', '文档搜索']
    },

    high_dimension: {
        range: '1024-3072',
        pros: [
            '表达最丰富',
            '语义区分度高',
            '适合高精度场景'
        ],
        cons: [
            '存储成本高',
            '检索延迟增加',
            '可能过拟合'
        ],
        useCases: ['高精度检索', '语义相似度', '聚类分析']
    }
};
```

### 6.2 维度压缩技术

```typescript
/**
 * 维度压缩方法
 */

// 1. PCA（主成分分析）
import { PCA } from 'ml-pca';

/**
 * 使用 PCA 降维
 */
function compressWithPCA(
    vectors: number[][],
    targetDimension: number
): number[][] {
    const pca = new PCA(vectors);
    // 保留前 targetDimension 个主成分
    return pca.predict(vectors, { nComponents: targetDimension });
}

// 2. SVD（奇异值分解）
/**
 * 使用 SVD 降维
 */
function compressWithSVD(
    vectors: number[][],
    targetDimension: number
): number[][] {
    // SVD 分解
    const { U, S, V } = svd(vectors);
    // 取前 targetDimension 个奇异值对应的向量
    return vectors.map(row => {
        let result = new Array(targetDimension).fill(0);
        for (let i = 0; i < targetDimension; i++) {
            for (let j = 0; j < row.length; j++) {
                result[i] += row[j] * V[j][i];
            }
        }
        return result;
    });
}

// 3. 乘积量化（Product Quantization）
/**
 * 乘积量化压缩
 *
 * 将高维向量分割成多个子向量，每个子向量独立量化
 * 大幅降低存储需求
 */
class ProductQuantizer {
    private subVectors: number;  // 子向量数量
    private bitsPerVector: number;  // 每个子向量的位数
    private codebooks: number[][][];

    constructor(dimension: number, subVectors: number = 8) {
        this.subVectors = subVectors;
        this.bitsPerVector = 8;  // 每个子向量用 8 位编码
        this.codebooks = [];
    }

    /**
     * 训练码书
     */
    fit(vectors: number[][]) {
        const subDimension = vectors[0].length / this.subVectors;

        for (let i = 0; i < this.subVectors; i++) {
            // 提取子向量
            const subVectors_i = vectors.map(v =>
                v.slice(i * subDimension, (i + 1) * subDimension)
            );
            // K-Means 聚类生成码书
            const codebook = this.kMeans(subVectors_i, 2 ** this.bitsPerVector);
            this.codebooks.push(codebook);
        }
    }

    /**
     * 向量编码
     */
    encode(vector: number[]): number[] {
        const subDimension = vector.length / this.subVectors;
        const codes = [];

        for (let i = 0; i < this.subVectors; i++) {
            const subVector = vector.slice(i * subDimension, (i + 1) * subDimension);
            // 找最近的码字
            const code = this.findNearestCode(this.codebooks[i], subVector);
            codes.push(code);
        }

        return codes;
    }

    /**
     * 向量解码
     */
    decode(codes: number[]): number[] {
        const result = [];

        for (let i = 0; i < this.subVectors; i++) {
            result.push(...this.codebooks[i][codes[i]]);
        }

        return result;
    }

    // K-Means 实现（简化版）
    private kMeans(vectors: number[][], k: number): number[][] {
        // ... K-Means 聚类实现
        return [];  // 返回 k 个聚类中心
    }

    private findNearestCode(codebook: number[][], vector: number[]): number {
        let minDist = Infinity;
        let nearest = 0;
        for (let i = 0; i < codebook.length; i++) {
            const dist = euclideanDistance(vector, codebook[i]);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        }
        return nearest;
    }
}
```

### 6.3 维度选择决策指南

```typescript
/**
 * 根据场景选择向量维度
 */

interface DimensionRecommendation {
    scenario: string;
    recommendedDimension: number;
    model: string;
    reasoning: string;
}

const RECOMMENDATIONS: DimensionRecommendation[] = [
    {
        scenario: '实时对话机器人',
        recommendedDimension: 384,
        model: 'bge-small-zh-v1.5',
        reasoning: '延迟敏感，需要快速响应'
    },
    {
        scenario: '企业知识库问答',
        recommendedDimension: 1024,
        model: 'bge-large-zh-v1.5',
        reasoning: '精度要求高，数据量适中'
    },
    {
        scenario: '长文档语义搜索',
        recommendedDimension: 1536,
        model: 'text-embedding-3-large',
        reasoning: '上下文丰富，需要大维度捕获细节'
    },
    {
        scenario: '多语言跨境电商',
        recommendedDimension: 1024,
        model: 'jina-embeddings-v3',
        reasoning: '多语言支持优先'
    },
    {
        scenario: '海量文档归档检索（亿级）',
        recommendedDimension: 768,
        model: 'bge-base-zh-v1.5 + PQ压缩',
        reasoning: '存储成本敏感，需要量化压缩'
    }
];

/**
 * 存储成本计算
 */
function calculateStorageCost(
    documentCount: number,
    avgChunksPerDoc: number,
    dimension: number,
    bytesPerFloat: number = 4  // float32
): {
    rawSizeGB: number;
    compressedSizeGB: number;
    pqCompressedSizeGB: number;
} {
    const totalVectors = documentCount * avgChunksPerDoc;

    // 原始大小
    const rawSizeBytes = totalVectors * dimension * bytesPerFloat;

    // 假设使用 4 位量化（乘积量化）
    const pqBitsPerSubVector = 4;
    const subVectors = 8;
    const pqCompressedBytes = totalVectors * subVectors * (pqBitsPerSubVector / 8);

    return {
        rawSizeGB: rawSizeBytes / (1024 ** 3),
        compressedSizeGB: (rawSizeBytes * 0.5) / (1024 ** 3),  // PCA 压缩 50%
        pqCompressedSizeGB: pqCompressedBytes / (1024 ** 3)    // PQ 压缩约 90%
    };
}

// 示例计算
const costs = calculateStorageCost(
    documentCount: 1000000,      // 100 万文档
    avgChunksPerDoc: 10,         // 每文档 10 个块
    dimension: 1024              // 1024 维
);

console.log(`
文档数量: 1,000,000
每文档块数: 10
总向量数: 10,000,000

存储成本估算:
- 原始向量: ${costs.rawSizeGB.toFixed(2)} GB
- PCA 压缩: ${costs.compressedSizeGB.toFixed(2)} GB
- PQ 压缩: ${costs.pqCompressedSizeGB.toFixed(2)} GB
`);
```

### 6.4 质量监控与调优

```typescript
/**
 * Embedding 质量评估与监控
 */

interface QualityMetrics {
    // 检索评估
    recall@K: number;      // 召回率
    precision@K: number;  // 精确率
    mrr: number;           // 平均倒数排名
    ndcg: number;          // 归一化折扣累积增益

    // 质量分布
    avgScore: number;      // 平均相似度得分
    scoreStdDev: number;   // 得分标准差
    lowScoreRatio: number; // 低分检索结果比例
}

class EmbeddingQualityMonitor {
    private metrics: QualityMetrics[] = [];

    /**
     * 评估检索质量
     */
    async evaluateRetrieval(
        testSet: Array<{
            query: string;
            relevantDocs: string[];
            retrievedDocs: string[];
        }>
    ): Promise<QualityMetrics> {
        let totalRecall = 0;
        let totalPrecision = 0;
        let totalMRR = 0;
        let totalNDCG = 0;
        let avgScore = 0;
        let scoreStdDev = 0;
        let lowScoreCount = 0;
        let totalCount = 0;

        for (const testCase of testSet) {
            // 计算各指标
            const recall = this.calculateRecall(
                testCase.relevantDocs,
                testCase.retrievedDocs
            );
            const precision = this.calculatePrecision(
                testCase.relevantDocs,
                testCase.retrievedDocs
            );
            const mrr = this.calculateMRR(
                testCase.relevantDocs,
                testCase.retrievedDocs
            );
            const ndcg = this.calculateNDCG(
                testCase.relevantDocs,
                testCase.retrievedDocs
            );

            totalRecall += recall;
            totalPrecision += precision;
            totalMRR += mrr;
            totalNDCG += ndcg;
            totalCount++;
        }

        return {
            recall@K: totalRecall / totalCount,
            precision@K: totalPrecision / totalCount,
            mrr: totalMRR / totalCount,
            ndcg: totalNDCG / totalCount,
            avgScore,
            scoreStdDev,
            lowScoreRatio: lowScoreCount / totalCount
        };
    }

    private calculateRecall(relevant: string[], retrieved: string[]): number {
        const relevantSet = new Set(relevant);
        const retrievedSet = new Set(retrieved.slice(0, 10));  // Top-10
        let hitCount = 0;
        for (const doc of retrievedSet) {
            if (relevantSet.has(doc)) hitCount++;
        }
        return hitCount / relevantSet.size;
    }

    private calculatePrecision(relevant: string[], retrieved: string[]): number {
        const retrievedTopK = retrieved.slice(0, 10);
        const relevantSet = new Set(relevant);
        let hitCount = 0;
        for (const doc of retrievedTopK) {
            if (relevantSet.has(doc)) hitCount++;
        }
        return hitCount / retrievedTopK.length;
    }

    private calculateMRR(relevant: string[], retrieved: string[]): number {
        const relevantSet = new Set(relevant);
        for (let i = 0; i < retrieved.length; i++) {
            if (relevantSet.has(retrieved[i])) {
                return 1 / (i + 1);
            }
        }
        return 0;
    }

    private calculateNDCG(relevant: string[], retrieved: string[]): number {
        // NDCG 计算实现
        let dcg = 0;
        for (let i = 0; i < retrieved.length; i++) {
            if (relevant.includes(retrieved[i])) {
                dcg += 1 / Math.log2(i + 2);  // i+2 因为从 1 开始计
            }
        }
        // 理想 DCG
        let idealDcg = 0;
        for (let i = 0; i < relevant.length; i++) {
            idealDcg += 1 / Math.log2(i + 2);
        }
        return idealDcg === 0 ? 0 : dcg / idealDcg;
    }
}
```

---

## 总结

### 核心要点回顾

| 模块 | 关键知识点 |
|------|------------|
| **文本向量化原理** | Transformer → Self-Attention → 上下文感知向量 |
| **主流模型** | OpenAI text-embedding、BGE、M3E、Jina |
| **相似度计算** | 余弦相似度（方向）、点积（已归一化）、欧氏距离（绝对距离） |
| **RAG 应用** | 文档分块 → 向量化 → 索引 → 检索 → 生成 |
| **维度权衡** | 低维快但精度低，高维慢但精度高，需根据场景选择 |

### 实践建议

1. **模型选择**：优先测试 BGE-large-zh-v1.5（中文场景）或 text-embedding-3-large（英文/多语言）

2. **相似度度量**：使用余弦相似度作为默认选择，兼容性好

3. **向量维度**：768-1024 是性价比最佳区间，存储敏感场景可考虑 PQ 压缩

4. **RAG 优化**：分块大小 500 字符、重叠 50 字符、topK=5 是不错的默认配置

5. **质量监控**：定期使用测试集评估检索指标，及时发现模型退化
