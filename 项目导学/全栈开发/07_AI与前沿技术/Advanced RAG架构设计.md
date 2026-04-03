# Advanced RAG 架构设计完全指南 (2026版)

## 1. 概述：为什么需要 Advanced RAG？

### 1.1 基础 RAG 的局限性

传统的 Naive RAG（检索-生成）架构存在三个核心问题：

```
┌─────────────────────────────────────────────────────────────────┐
│                      Naive RAG 流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   用户 Query ──► 检索 ──► 上下文 ──► 生成回答                     │
│       │              │                                          │
│       │              ▼                                          │
│       │         问题1：检索质量差                                │
│       │              │                                          │
│       │         问题2：上下文过多/过少                           │
│       │              │                                          │
│       │         问题3：没有迭代优化                              │
│       │                                                         │
│       ▼                                                         │
│   最终答案往往不准确/不完整                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Naive RAG 的三大痛点：**

| 痛点 | 描述 | 后果 |
|------|------|------|
| **检索质量差** | 用户 query 与文档语义不匹配 | 返回无关上下文 |
| **上下文噪声** | 无关内容稀释关键信息 | LLM 被噪声误导 |
| **缺乏迭代** | 一次性检索，无法优化 | 复杂问题答非所问 |

### 1.2 Advanced RAG 架构全景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Advanced RAG 完整架构                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Query 优化层                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │  Query 改写   │→│  Query 扩展   │→│  Query 压缩   │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        检索增强层                                      │  │
│  │  ┌────────────────────┐    ┌────────────────────┐                   │  │
│  │  │   向量检索 (Dense)  │ +  │  关键词检索 (Sparse) │ = 混合检索       │  │
│  │  └────────────────────┘    └────────────────────┘                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        上下文压缩层                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │LLMChainExtractor│ │EmbeddingsFilter│ │ContextualCompression│     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        重排序层 (Rerank)                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ Cohere Rerank │  │ BGE Rerank   │  │  CrossEncoder │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        迭代检索层                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │  迭代检索    │  │  自洽性校验  │  │  反思机制    │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        图结构检索层                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐      │  │
│  │  │              Knowledge Graph RAG                            │      │  │
│  │  │  实体识别 → 关系抽取 → 子图检索 → 图展开 → 路径遍历          │      │  │
│  │  └────────────────────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│                              LLM 生成层                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Query 优化：让检索更精准

### 2.1 Query 改写 (Query Rewriting)

**核心思想**：用户输入往往是口语化、不完整或存在歧义的，需要转换为更适合检索的形式。

```python
from openai import OpenAI

client = OpenAI()

class QueryRewriter:
    """Query 改写：将用户 query 转换为检索友好的形式"""

    def __init__(self, model="gpt-4"):
        self.model = model

    def rewrite(self, query, style="formal"):
        """
        将口语化 query 改写为正式检索语句

        参数:
            query: 用户原始输入
            style: 改写风格 (formal/detailed/concise)
        """
        prompts = {
            "formal": """将以下口语化问题改写为适合检索的正式语句。
保持原意，但使用更准确的技术术语。

口语化问题：{query}

改写后（仅输出改写后的句子）：""",

            "detailed": """将问题改写为更详细的形式，补充必要的上下文。
原问题可能缺少主语、宾语或技术细节。

原问题：{query}

改写后（补充细节但保持核心意图）：""",

            "concise": """将问题压缩为核心检索词，去除冗余修饰。
输出应该是一组关键词或短句。

原问题：{query}

核心检索词："""
        }

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompts[style].format(query=query)}],
            temperature=0.3
        )

        return response.choices[0].message.content.strip()

    def rewrite_with_history(self, query, conversation_history):
        """
        结合对话历史改写 query

        参数:
            query: 当前问题
            conversation_history: [{"role": "user/assistant", "content": ...}]
        """
        history_text = "\n".join([
            f"{'用户' if msg['role'] == 'user' else '助手'}：{msg['content']}"
            for msg in conversation_history[-3:]  # 最近3轮
        ])

        prompt = f"""基于对话历史，改写当前问题以消除指代歧义。

对话历史：
{history_text}

当前问题：{query}

改写后（消除歧义，完整表达意图）："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )

        return response.choices[0].message.content.strip()


# 使用示例
rewriter = QueryRewriter()

# 口语化改正式
query1 = "那个关于机器学习的"
result1 = rewriter.rewrite(query1, style="formal")
print(result1)  # "机器学习的基本概念和应用场景"

# 补全细节
query2 = "怎么解决？"
result2 = rewriter.rewrite(query2, style="detailed")
print(result2)  # "在分布式系统中，数据一致性问题有哪些解决方案？"

# 带历史改写
history = [
    {"role": "user", "content": "介绍下 React 的 useEffect"},
    {"role": "assistant", "content": "useEffect 是 React 的副作用钩子..."},
    {"role": "user", "content": "那和 useMemo 有什么区别？"}
]
result3 = rewriter.rewrite_with_history("那和 useMemo 有什么区别？", history)
print(result3)  # "React 中 useEffect 和 useMemo 的区别是什么？"
```

### 2.2 Query 扩展 (Query Expansion)

**核心思想**：单次检索可能遗漏重要信息，通过生成多个子查询来扩大检索覆盖面。

```python
class QueryExpander:
    """Query 扩展：生成多个子查询以提高召回率"""

    def __init__(self, model="gpt-4"):
        self.model = model

    def expand(self, query, num_variations=5):
        """
        生成多个 query 变体，覆盖不同角度

        返回:
            List[str]: 扩展后的 query 列表
        """
        prompt = f"""针对以下问题，生成 {num_variations} 个不同的检索变体。
每个变体应该：
1. 使用不同的表述方式
2. 覆盖问题的不同角度
3. 包含相关技术术语的变体

原问题：{query}

输出格式（仅输出变体，每行一个）：
1. [变体1]
2. [变体2]
...
{num_variations}. [变体{num_variations}]"""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8  # 高温度保证多样性
        )

        variations = response.choices[0].message.content.strip().split('\n')
        return [v.split('. ', 1)[-1].strip() for v in variations if v.strip()]

    def expand_with_aspect(self, query):
        """
        多角度扩展：从定义、原理、用法、对比等角度扩展

        返回:
            Dict[str, str]: 各角度的 query
        """
        prompt = f"""从多个技术角度为以下问题生成检索变体。

原问题：{query}

角度变体：
1. 定义/概念：
2. 原理/机制：
3. 使用方法/示例：
4. 对比/区别：
5. 最佳实践/注意事项：
6. 常见问题/故障排查："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )

        content = response.choices[0].message.content
        # 解析输出
        aspects = {}
        for line in content.split('\n'):
            if ':' in line and line[0].isdigit():
                parts = line.split(':', 1)
                aspects[parts[0].strip()] = parts[1].strip()

        return aspects

    def hyde_expansion(self, query):
        """
        HyDE (Hypothetical Document Embeddings) 扩展
        先让 LLM 生成一个假设性答案，再检索这个答案

        这是 2023 年提出的创新方法，发表在 ACL 会议
        """
        # Step 1: 生成假设性答案
        prompt = f"""假设你是领域专家，请针对以下问题生成一个假设性答案。
这个答案可能不完全准确，但可以帮助我们找到相关文档。

问题：{query}

假设性答案："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        hypothetical_answer = response.choices[0].message.content

        return {
            "original_query": query,
            "hypothetical_answer": hypothetical_answer,
            # 两个都用于检索
            "retrieval_queries": [query, hypothetical_answer]
        }


# 使用示例
expander = QueryExpander()

# 标准扩展
query = "React useEffect 性能优化"
variations = expander.expand(query, num_variations=5)
print("扩展变体:", variations)

# 多角度扩展
aspects = expander.expand_with_aspect("TypeScript 泛型")
for aspect, q in aspects.items():
    print(f"{aspect}: {q}")

# HyDE 扩展
hyde_result = expander.hyde_expansion("分布式事务解决方案")
print(f"原问题: {hyde_result['original_query']}")
print(f"假设答案: {hyde_result['hypothetical_answer'][:100]}...")
```

### 2.3 Query 压缩 (Query Compression)

**核心思想**：过长的 query 可能包含冗余信息，压缩后可以提高检索效率和精度。

```python
class QueryCompressor:
    """Query 压缩：提取核心检索意图"""

    def __init__(self, model="gpt-4"):
        self.model = model

    def compress(self, query, preserve_terms=None):
        """
        压缩 query，保留核心术语

        参数:
            query: 原始长 query
            preserve_terms: 必须保留的术语列表
        """
        preserve_str = ", ".join(preserve_terms) if preserve_terms else "无"

        prompt = f"""从以下长 query 中提取核心检索意图。

要求：
1. 保留必须保留的术语：{preserve_str}
2. 去除冗余修饰词和重复表达
3. 用最简洁的方式表达核心问题

原始 Query：{query}

压缩后（仅输出一句话）："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        return response.choices[0].message.content.strip()

    def extract_keywords(self, query, top_k=5):
        """
        提取关键词用于增强检索

        返回:
            List[str]: 关键词列表
        """
        prompt = f"""从以下 query 中提取 {top_k} 个最重要的检索关键词。
按重要性排序，技术术语优先。

Query：{query}

关键词（每行一个）："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        keywords = [k.strip() for k in response.choices[0].message.content.split('\n') if k.strip()]
        return keywords[:top_k]

    def boolean_query(self, query):
        """
        转换为布尔查询表达式

        用于支持 AND/OR/NOT 的向量数据库
        """
        prompt = f"""将自然语言 query 转换为布尔检索表达式。

规则：
- AND: 两个词必须同时出现
- OR: 任一词出现即可
- NOT: 排除包含某词的结果

自然语言：{query}

布尔表达式："""

        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        return response.choices[0].message.content.strip()


# 使用示例
compressor = QueryCompressor()

# 压缩长 query
long_query = "我想了解一下关于在 React 应用中如何使用 useEffect 钩子来进行性能优化方面的最佳实践和注意事项，特别是在处理大型应用的时候"
compressed = compressor.compress(long_query, preserve_terms=["React", "useEffect", "性能优化"])
print(f"压缩后: {compressed}")

# 提取关键词
keywords = compressor.extract_keywords("React useEffect 闭包陷阱与依赖数组详解", top_k=5)
print(f"关键词: {keywords}")

# 布尔查询
bool_query = compressor.boolean_query("React 或者 Vue 框架的状态管理对比")
print(f"布尔查询: {bool_query}")
```

---

## 3. 上下文压缩：精炼检索结果

### 3.1 LLMChainExtractor：智能内容提取

**核心思想**：从检索到的文档中，只提取与 query 最相关的部分。

```python
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.callbacks import get_openai_callback

class LLMChainExtractor:
    """
    使用 LLM 从文档中提取与 query 相关的内容

    这是 LangChain 的 ContextualCompression Retriever 的一种实现
    """

    def __init__(self, model="gpt-3.5-turbo"):
        self.llm = ChatOpenAI(model=model, temperature=0)

    def extract_relevant(self, query, document, max_chars=1000):
        """
        从文档中提取与 query 相关的内容

        参数:
            query: 用户问题
            document: 检索到的完整文档
            max_chars: 提取内容的最大字符数

        返回:
            str: 提取后的相关片段
        """
        prompt = PromptTemplate.from_template("""你是一个精准的内容提取器。
给定一个用户问题和一个文档片段，提取文档中与问题最相关的部分。

要求：
1. 提取内容必须与问题高度相关
2. 保留关键上下文信息
3. 控制在 {max_chars} 字符以内
4. 如果文档与问题无关，返回"不相关"

问题：{query}

文档内容：
{document}

提取结果：""")

        chain = LLMChain(llm=self.llm, prompt=prompt)

        with get_openai_callback() as cb:
            result = chain.run(query=query, document=document, max_chars=max_chars)
            print(f"LLM 调用成本: ${cb.total_cost:.4f}")

        return result.strip()

    def extract_batch(self, query, documents, max_chars_per_doc=500):
        """
        批量提取多个文档的相关内容

        参数:
            query: 用户问题
            documents: List[str] 文档列表
            max_chars_per_doc: 每个文档提取的最大字符数

        返回:
            List[str]: 提取后的片段列表
        """
        results = []

        for doc in documents:
            extracted = self.extract_relevant(query, doc, max_chars=max_chars_per_doc)

            if extracted != "不相关":
                results.append(extracted)

        return results


# 使用示例
extractor = LLMChainExtractor()

# 原始长文档
doc = """
React 的 useEffect 是用于处理副作用的 Hook。

基础语法：
const [count, setCount] = useState(0);

useEffect(() => {
  document.title = `You clicked ${count} times`;

  // 这是 cleanup 函数
  return () => {
    document.title = 'React App';
  };
}, [count]); // 依赖数组

依赖数组的规则：
1. 如果不使用依赖数组，effect 会在每次渲染后执行
2. 依赖数组为空，effect 只在挂载时执行一次
3. 依赖数组非空，effect 在依赖变化时重新执行

闭包陷阱：
由于 JavaScript 闭包特性，effect 中访问的 state 可能是旧值。
解决方法：
1. 使用 useRef 保存最新值
2. 将依赖加入依赖数组
3. 使用 useEffectEvent (React 19 新特性)
"""

query = "useEffect 的依赖数组规则"

extracted = extractor.extract_relevant(query, doc)
print("提取结果:", extracted)
# 输出：依赖数组的规则：1. 如果不使用依赖数组...（只提取相关部分）
```

### 3.2 EmbeddingsFilter：向量层面的过滤

**核心思想**：基于 embedding 相似度，过滤掉与 query 不相关的文档。

```python
import numpy as np
from openai import OpenAI

client = OpenAI()

class EmbeddingsFilter:
    """
    基于 Embedding 的文档过滤器

    在向量空间中计算文档与 query 的相似度，
    过滤掉相似度低于阈值的文档
    """

    def __init__(self, threshold=0.7, model="text-embedding-3-small"):
        self.threshold = threshold
        self.model = model

    def embed(self, texts):
        """批量生成 embedding"""
        if isinstance(texts, str):
            texts = [texts]

        response = client.embeddings.create(
            model=self.model,
            input=texts
        )

        return [item.embedding for item in response.data]

    def cosine_similarity(self, vec1, vec2):
        """计算余弦相似度"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)

        dot_product = np.dot(vec1, vec2)
        norm_product = np.linalg.norm(vec1) * np.linalg.norm(vec2)

        return dot_product / (norm_product + 1e-10)

    def filter_documents(self, query, documents, top_k=None):
        """
        过滤文档，返回高相关文档

        参数:
            query: 用户问题
            documents: List[str] 文档列表
            top_k: 返回前 k 个（按相似度排序），None 则返回所有

        返回:
            List[Tuple[str, float]]: (文档内容, 相似度分数)
        """
        # 生成 query embedding
        query_embedding = self.embed(query)[0]

        # 计算每个文档的相似度
        scored_docs = []

        for doc in documents:
            doc_embedding = self.embed(doc)[0]
            similarity = self.cosine_similarity(query_embedding, doc_embedding)

            if similarity >= self.threshold:
                scored_docs.append((doc, similarity))

        # 按相似度排序
        scored_docs.sort(key=lambda x: x[1], reverse=True)

        if top_k:
            return scored_docs[:top_k]

        return scored_docs

    def filter_with_scores(self, query, documents):
        """
        返回所有文档及其相似度分数（不进行阈值过滤）

        用于后续的加权融合
        """
        query_embedding = self.embed(query)[0]
        results = []

        for doc in documents:
            doc_embedding = self.embed(doc)[0]
            similarity = self.cosine_similarity(query_embedding, doc_embedding)
            results.append((doc, similarity))

        results.sort(key=lambda x: x[1], reverse=True)
        return results


# 使用示例
filter_tool = EmbeddingsFilter(threshold=0.6)

documents = [
    "React useEffect 用于处理副作用，如数据获取、订阅、定时器等。",
    "Python 的 Django 是一个 Web 框架，遵循 MVC 模式。",
    "TypeScript 是 JavaScript 的超集，提供了类型系统。",
    "useEffect 的依赖数组控制了 effect 的执行时机。",
    "Docker 是一个容器化平台，用于应用容器化部署。"
]

query = "React useEffect 的工作原理"

filtered = filter_tool.filter_documents(query, documents, top_k=3)

print("过滤后的文档:")
for doc, score in filtered:
    print(f"  [{score:.3f}] {doc}")
```

### 3.3 ContextualCompression：综合上下文压缩

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor, EmbeddingsFilter
from langchain.vectorstores import Chroma

class AdvancedCompressionPipeline:
    """
    高级上下文压缩管道

    结合 LLMChainExtractor 和 EmbeddingsFilter 的优点：
    1. 先用 EmbeddingsFilter 快速过滤低相关文档
    2. 再用 LLMChainExtractor 精提取关键段落
    """

    def __init__(self, vectorstore, model="gpt-3.5-turbo"):
        self.vectorstore = vectorstore
        self.model = model

        # 初始化压缩器
        self.llm_extractor = LLMChainExtractor(
            model=model,
            prompt=self._get_extractor_prompt()
        )

        self.embeddings_filter = EmbeddingsFilter(
            threshold=0.5,
            model="text-embedding-3-small"
        )

    def _get_extractor_prompt(self):
        """自定义提取提示词"""
        from langchain.prompts import PromptTemplate

        return PromptTemplate.from_template("""从文档中提取与问题最相关的片段。

问题：{question}

文档：
{context}

要求：
1. 只提取与问题直接相关的内容
2. 保留关键上下文
3. 控制在 500 字符以内
4. 如果完全不相关，输出"不相关"

提取结果：""")

    def compress_documents(self, query, documents, max_chars=2000):
        """
        完整的压缩流程

        1. EmbeddingsFilter 粗筛
        2. LLMChainExtractor 精提
        3. 合并结果
        """
        # Step 1: EmbeddingsFilter 粗筛
        print("Step 1: EmbeddingsFilter 粗筛...")
        filtered = self.embeddings_filter.filter_documents(
            query, documents, top_k=10
        )

        if not filtered:
            print("没有通过初步过滤的文档")
            return []

        print(f"  保留 {len(filtered)}/{len(documents)} 个文档")

        # Step 2: LLMChainExtractor 精提
        print("Step 2: LLMChainExtractor 精提...")
        extracted = []

        for doc, initial_score in filtered:
            llm_extracted = self.llm_extractor.extract_relevant(
                query=query,
                document=doc,
                max_chars=max_chars // len(filtered)  # 分配配额
            )

            if llm_extracted != "不相关":
                extracted.append(llm_extracted)

        print(f"  精提后保留 {len(extracted)} 个片段")

        # Step 3: 合并为一个上下文
        combined_context = "\n\n---\n\n".join(extracted)

        # 截断到最大长度
        if len(combined_context) > max_chars:
            combined_context = combined_context[:max_chars] + "..."

        return {
            "compressed_context": combined_context,
            "num_segments": len(extracted),
            "original_count": len(documents)
        }


# 使用示例
# 假设已有向量数据库
# vectorstore = Chroma(persist_directory="./chroma_db")

compression_pipeline = AdvancedCompressionPipeline(vectorstore=None)  # 传入实际的 vectorstore

documents = [
    "React useEffect 基础用法...",
    "Python Django 框架...",
    "TypeScript 类型系统...",
    "React useEffect 依赖数组详解...",
    "Docker 容器化部署..."
] * 10  # 模拟大量文档

result = compression_pipeline.compress_documents(
    query="React useEffect 的工作原理",
    documents=documents,
    max_chars=1500
)

print(f"\n压缩结果:")
print(f"  原始文档数: {result['original_count']}")
print(f"  压缩后片段: {result['num_segments']}")
print(f"  上下文长度: {len(result['compressed_context'])} 字符")
print(f"\n压缩后上下文:\n{result['compressed_context'][:500]}...")
```

---

## 4. 混合检索：向量 + 关键词

### 4.1 混合检索架构

```
┌────────────────────────────────────────────────────────────────────────┐
│                          混合检索架构                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   用户 Query ──┬──► 稀疏检索 (Sparse) ──► BM25 / TF-IDF ──► 结果A        │
│                │                                                        │
│                │                                                        │
│                └──► 密集检索 (Dense) ──► Embedding ──► 向量相似度 ──► 结果B│
│                                                                         │
│                            │                                           │
│                            ▼                                           │
│                   ┌─────────────────┐                                  │
│                   │   RRF 融合      │                                  │
│                   │ (Reciprocal     │                                  │
│                   │  Rank Fusion)   │                                  │
│                   └────────┬────────┘                                  │
│                            │                                           │
│                            ▼                                           │
│                      融合排序结果                                       │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 稀疏检索与密集检索对比

| 维度 | 稀疏检索 (Sparse) | 密集检索 (Dense) |
|------|-------------------|------------------|
| **表示方式** | 词频矩阵 (BM25/TF-IDF) | 神经网络嵌入 (Embedding) |
| **语义理解** | 词汇匹配，字面意思 | 深层语义，理解同义词 |
| **罕见词汇** | 擅长（精确匹配） | 弱（依赖训练数据） |
| **长尾知识** | 准确 | 可能遗漏 |
| **计算成本** | 低 | 中-高 |
| **可解释性** | 高（词权重） | 低（向量运算） |

### 4.3 混合检索实现

```python
from rank_bm25 import BM25Okapi
import numpy as np
from openai import OpenAI

client = OpenAI()

class HybridSearch:
    """
    混合检索器：结合稀疏检索和密集检索

    使用 RRF (Reciprocal Rank Fusion) 算法融合两种检索结果
    """

    def __init__(self, vectorstore, alpha=0.5):
        """
        初始化混合检索器

        参数:
            vectorstore: 向量数据库 (支持 Milvus/Pinecone/Chroma 等)
            alpha: 融合权重，alpha=0.5 表示两种检索同等重要
                   alpha>0.5 偏向稀疏检索，alpha<0.5 偏向密集检索
        """
        self.vectorstore = vectorstore
        self.alpha = alpha  # alpha=0.5 表示平衡，alpha=0.7 偏向稀疏
        self.bm25 = None
        self.documents = []  # 原始文档列表

    def index_documents(self, documents, tokenize_fn=None):
        """
        为文档建立索引

        参数:
            documents: List[str] 文档列表
            tokenize_fn: 分词函数，默认按空格分词
        """
        self.documents = documents

        # BM25 索引
        if tokenize_fn:
            tokenized_docs = [tokenize_fn(doc) for doc in documents]
        else:
            # 默认按空格和标点分词
            import re
            tokenized_docs = [
                re.findall(r'\w+', doc.lower())
                for doc in documents
            ]

        self.bm25 = BM25Okapi(tokenized_docs)
        print(f"已索引 {len(documents)} 个文档")

    def sparse_search(self, query, top_k=20):
        """
        稀疏检索 (BM25)

        返回:
            List[Tuple[int, float]]: (文档索引, BM25分数)
        """
        import re
        query_tokens = re.findall(r'\w+', query.lower())

        # 获取 BM25 分数
        scores = self.bm25.get_scores(query_tokens)
        doc_scores = list(enumerate(scores))

        # 按分数排序
        doc_scores.sort(key=lambda x: x[1], reverse=True)

        return doc_scores[:top_k]

    def dense_search(self, query, top_k=20):
        """
        密集检索 (向量相似度)

        返回:
            List[Tuple[int, float]]: (文档索引, 向量相似度)
        """
        # 生成 query embedding
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding

        # 搜索向量数据库
        results = self.vectorstore.similarity_search_with_score(
            query=query_embedding,
            k=top_k
        )

        # 转换为 (索引, 分数) 格式
        # 假设结果包含 doc_id 和 score
        doc_scores = []
        for i, (doc, score) in enumerate(results):
            doc_scores.append((i, score))

        return doc_scores

    def rrf_fusion(self, sparse_results, dense_results, k=60):
        """
        RRF 融合算法

        RRF 的核心思想：对不同检索来源的结果进行加权融合，
        结果的排名越靠前，最终得分越高

        公式: RRF_score(d) = Σ 1/(k + rank(d))

        参数:
            sparse_results: 稀疏检索结果 [(doc_idx, score), ...]
            dense_results: 密集检索结果 [(doc_idx, score), ...]
            k: RRF 参数，默认 60，越小越偏向靠前的结果

        返回:
            List[Tuple[int, float]]: (文档索引, RRF融合分数)
        """
        rrf_scores = {}

        # 稀疏检索结果贡献
        for rank, (doc_idx, _) in enumerate(sparse_results):
            rrf_scores[doc_idx] = rrf_scores.get(doc_idx, 0) + 1 / (k + rank + 1)

        # 密集检索结果贡献
        for rank, (doc_idx, _) in enumerate(dense_results):
            rrf_scores[doc_idx] = rrf_scores.get(doc_idx, 0) + 1 / (k + rank + 1)

        # 按 RRF 分数排序
        sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        return sorted_results

    def hybrid_search(self, query, top_k=10):
        """
        完整的混合检索流程

        返回:
            List[Dict]: 检索结果列表
        """
        # 1. 稀疏检索
        sparse_results = self.sparse_search(query, top_k=top_k * 2)

        # 2. 密集检索
        dense_results = self.dense_search(query, top_k=top_k * 2)

        # 3. RRF 融合
        fused_results = self.rrf_fusion(sparse_results, dense_results)

        # 4. 构建返回结果
        final_results = []
        for doc_idx, rrf_score in fused_results[:top_k]:
            final_results.append({
                "document": self.documents[doc_idx],
                "doc_id": doc_idx,
                "rrf_score": rrf_score,
                "sparse_rank": next(
                    (i for i, (idx, _) in enumerate(sparse_results) if idx == doc_idx),
                    None
                ),
                "dense_rank": next(
                    (i for i, (idx, _) in enumerate(dense_results) if idx == doc_idx),
                    None
                )
            })

        return final_results


# 使用示例
# 假设已有向量数据库
# vectorstore = Milvus(...)
# hybrid = HybridSearch(vectorstore, alpha=0.5)

# # 建立 BM25 索引
# documents = ["文档1内容...", "文档2内容...", ...]
# hybrid.index_documents(documents)

# # 混合检索
# results = hybrid.hybrid_search("React useEffect 性能优化", top_k=5)

# for i, result in enumerate(results):
#     print(f"{i+1}. [RRF:{result['rrf_score']:.3f}] 稀疏排名:{result['sparse_rank']} 密集排名:{result['dense_rank']}")
#     print(f"   {result['document'][:100]}...")
```

---

## 5. 重排序 (Reranking)：优化检索顺序

### 5.1 为什么需要 Rerank？

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Rerank 的作用                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  检索阶段 (Recall-Oriented)          重排阶段 (Precision-Oriented)      │
│  ─────────────────────────────      ───────────────────────────────   │
│                                                                         │
│  目标：找到所有相关文档           目标：排序最相关文档                    │
│  方法：快速向量相似度             方法：精确语义匹配                      │
│  数量：返回 top 50-100            数量：返回 top 10                     │
│                                                                         │
│  ┌─────────────────────┐           ┌─────────────────────┐            │
│  │ 向量检索结果         │           │ Cross-Encoder       │            │
│  │ 1. 文档A (0.92)      │    ──►    │ 1. 文档C (0.95)     │            │
│  │ 2. 文档B (0.89)     │           │ 2. 文档A (0.91)     │            │
│  │ 3. 文档C (0.85)     │           │ 3. 文档B (0.88)     │            │
│  │ ...                 │           │ ...                 │            │
│  └─────────────────────┘           └─────────────────────┘            │
│                                                                         │
│  问题：向量相似度 ≠ 查询相关度                                            │
│  解决：使用更精确的模型重新评估                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cohere Rerank

```python
import cohere

class CohereReranker:
    """
    Cohere Rerank 模型

    Cohere 提供了业界领先的 Rerank 模型，支持 100+ 语言
    """

    def __init__(self, api_key):
        self.cohere = cohere.Client(api_key)

    def rerank(self, query, documents, top_n=10, model="rerank-multilingual-v3.0"):
        """
        使用 Cohere Rerank 对文档重新排序

        参数:
            query: 用户查询
            documents: List[str] 文档列表
            top_n: 返回前 n 个
            model: Rerank 模型

        返回:
            List[Dict]: 排序后的结果，包含 relevance_score
        """
        # Cohere Rerank 接受最大 1000 个文档
        if len(documents) > 1000:
            # 分批处理
            results = []
            for i in range(0, len(documents), 1000):
                batch = documents[i:i+1000]
                batch_results = self.cohere.rerank(
                    query=query,
                    documents=batch,
                    top_n=min(top_n, len(batch)),
                    model=model
                )
                results.extend(batch_results)
        else:
            results = self.cohere.rerank(
                query=query,
                documents=documents,
                top_n=top_n,
                model=model
            )

        # 解析结果
        reranked = []
        for idx, result in enumerate(results):
            reranked.append({
                "index": result.index,
                "document": result.document,
                "relevance_score": result.relevance_score,
                "rank": idx + 1
            })

        return reranked


# 使用示例
co = CohereReranker(api_key="your-api-key")

documents = [
    "React useEffect 是用于处理副作用的 Hook",
    "Python Django 是一个 Web 框架",
    "useEffect 的依赖数组控制执行时机",
    "TypeScript 提供了静态类型检查",
    "React useEffect 可以返回一个 cleanup 函数"
]

query = "React useEffect 的使用方法和注意事项"

results = co.rerank(query, documents, top_n=5)

print("Cohere Rerank 结果:")
for r in results:
    print(f"  {r['rank']}. [Score:{r['relevance_score']:.3f}] {r['document']}")
```

### 5.3 BGE Rerank

```python
from sentence_transformers import CrossEncoder

class BGEReranker:
    """
    BGE Rerank 模型

    北京智源人工智能研究院开源的 Rerank 模型
    支持中文和英文，在多个基准测试上表现优异
    """

    def __init__(self, model_name="BAAI/bge-reranker-v2-m3"):
        """
        初始化 BGE Reranker

        模型选择：
        - bge-reranker-v2-m3: 最新最强，支持多语言
        - bge-reranker-large: 大模型，效果更好但更慢
        """
        self.model = CrossEncoder(model_name, max_length=512)

    def rerank(self, query, documents, top_k=10, batch_size=32):
        """
        BGE Rerank

        参数:
            query: 用户查询
            documents: List[str] 文档列表
            top_k: 返回前 k 个
            batch_size: 批处理大小

        返回:
            List[Dict]: 排序后的结果
        """
        # 构建 query-document 对
        pairs = [(query, doc) for doc in documents]

        # 批量计算 relevance scores
        scores = self.model.predict(pairs, batch_size=batch_size)

        # 组合文档和分数
        doc_scores = list(zip(documents, scores))

        # 按分数降序排序
        doc_scores.sort(key=lambda x: x[1], reverse=True)

        # 返回 top_k
        results = []
        for rank, (doc, score) in enumerate(doc_scores[:top_k]):
            results.append({
                "document": doc,
                "rerank_score": float(score),
                "rank": rank + 1
            })

        return results

    def compute_similarity(self, query, documents):
        """
        计算 query 与每个文档的相关性分数（不排序）

        用于需要保留原始顺序的场景
        """
        pairs = [(query, doc) for doc in documents]
        scores = self.model.predict(pairs)

        return [float(s) for s in scores]


# 使用示例
reranker = BGEReranker(model_name="BAAI/bge-reranker-v2-m3")

documents = [
    "React useEffect 是用于处理副作用的 Hook",
    "Python Django 是一个 Web 框架",
    "useEffect 的依赖数组控制执行时机",
    "TypeScript 提供了静态类型检查",
    "React useEffect 可以返回一个 cleanup 函数"
]

query = "React useEffect 的使用方法和注意事项"

results = reranker.rerank(query, documents, top_k=5)

print("BGE Rerank 结果:")
for r in results:
    print(f"  {r['rank']}. [Score:{r['rerank_score']:.4f}] {r['document']}")
```

### 5.4 Cross-Encoder 原理与实现

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

class SimpleCrossEncoder:
    """
    从零实现 Cross-Encoder 理解其原理

    Cross-Encoder 的核心思想：
    - 输入：(query, document) 对
    - 输出：相关性分数
    - 优势：query 和 document 在同一模型中交互，能捕获更精细的语义关系
    """

    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        初始化 Cross-Encoder

        ms-marco-MiniLM-L-6-v2: 微软开源的 MS MARCO 比赛冠军模型
        在搜索问答任务上表现优异
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()

    def predict(self, query, documents, batch_size=8):
        """
        预测 query 与每个文档的相关性分数

        参数:
            query: 用户查询
            documents: List[str] 文档列表
            batch_size: 批处理大小

        返回:
            List[float]: 每个文档的 relevance score
        """
        all_scores = []

        with torch.no_grad():
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]

                # tokenize
                inputs = self.tokenizer(
                    [query] * len(batch_docs),
                    batch_docs,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                )

                # 前向传播
                outputs = self.model(**inputs)

                # 获取 logits（未归一化的分数）
                logits = outputs.logits

                # 如果是二分类，取正类的概率
                if logits.shape[-1] == 2:
                    scores = F.softmax(logits, dim=-1)[:, 1]
                else:
                    # 如果是回归任务，直接用 logits
                    scores = logits.squeeze(-1)

                all_scores.extend(scores.tolist())

        return all_scores

    def rerank(self, query, documents, top_k=10):
        """
        完整的 Rerank 流程
        """
        # 1. 计算所有文档的分数
        scores = self.predict(query, documents)

        # 2. 按分数排序
        doc_scores = list(zip(documents, scores))
        doc_scores.sort(key=lambda x: x[1], reverse=True)

        # 3. 返回 top_k
        return [
            {"document": doc, "score": score, "rank": i+1}
            for i, (doc, score) in enumerate(doc_scores[:top_k])
        ]


# 使用示例
cross_encoder = SimpleCrossEncoder()

documents = [
    "React useEffect 是用于处理副作用的 Hook",
    "Python Django 是一个 Web 框架",
    "useEffect 的依赖数组控制执行时机",
    "TypeScript 提供了静态类型检查",
    "React useEffect 可以返回一个 cleanup 函数"
]

query = "React useEffect 的使用方法和注意事项"

results = cross_encoder.rerank(query, documents, top_k=5)

print("Cross-Encoder Rerank 结果:")
for r in results:
    print(f"  {r['rank']}. [Score:{r['score']:.4f}] {r['document']}")
```

### 5.5 重排序策略对比

| 方案 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| **Cohere Rerank** | 效果好，支持多语言，API 简单 | 需要 API Key，有调用成本 | 生产环境，多语言场景 |
| **BGE Rerank** | 开源可本地部署，效果好 | 需要 GPU 资源 | 企业内网，中文场景 |
| **Cross-Encoder** | 可自定义训练，灵活 | 需要训练数据，部署复杂 | 有特定领域数据 |
| **基于 LLM 的 Rerank** | 理解能力强，可解释 | 延迟高，成本高 | 复杂语义场景 |

---

## 6. 迭代检索与自洽性

### 6.1 迭代检索 (Iterative Retrieval)

**核心思想**：复杂问题往往无法通过单次检索解决，需要多轮迭代优化。

```python
class IterativeRetrieval:
    """
    迭代检索：多轮检索逐步完善答案

    迭代策略：
    1. 初始检索 → 获取基本信息
    2. 分析差距 → 识别缺失的知识
    3. 补充检索 → 获取遗漏的信息
    4. 重复直到满意
    """

    def __init__(self, retriever, max_iterations=3):
        self.retriever = retriever  # 基础检索器
        self.max_iterations = max_iterations
        self.llm = ChatOpenAI(model="gpt-4", temperature=0)

    def analyze_gaps(self, query, current_context, required_aspects):
        """
        分析当前上下文的差距

        返回:
            List[str]: 需要补充的方面
        """
        prompt = f"""分析当前上下文是否回答了用户问题的所有方面。

用户问题：{query}

当前已获取的上下文：
{current_context}

问题要求覆盖的方面：
{required_aspects}

分析：
1. 哪些方面已经充分覆盖？
2. 哪些方面还需要补充？
3. 差距是什么？

输出格式（JSON）：
{{
  "covered": ["方面1", "方面2"],
  "missing": ["方面3"],
  "gap_description": "差距描述"
}}"""

        response = self.llm.invoke([{"role": "user", "content": prompt}])
        # 解析 JSON 响应
        import json
        content = response.content
        # 提取 JSON 部分
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0]
        else:
            json_str = content

        return json.loads(json_str)

    def generate_follow_up_query(self, original_query, gaps):
        """
        根据差距生成补充检索的 query
        """
        prompt = f"""基于原始问题和已知差距，生成补充检索的 query。

原始问题：{original_query}

已知差距：{gaps['gap_description']}
缺失方面：{', '.join(gaps['missing'])}

生成 1-2 个补充检索 query，每个 query 应该：
1. 针对一个具体的缺失方面
2. 使用正式的技术表述
3. 与原始问题有区别

输出格式（每行一个 query）：
1. [query1]
2. [query2]"""

        response = self.llm.invoke([{"role": "user", "content": prompt}])
        queries = [q.strip() for q in response.content.split('\n') if q.strip()]
        return queries

    def iterative_retrieve(self, query, required_aspects=None, top_k=5):
        """
        迭代检索主流程

        参数:
            query: 用户问题
            required_aspects: 问题应该覆盖的方面列表
            top_k: 每轮检索返回的数量

        返回:
            Dict: 检索结果和元信息
        """
        if required_aspects is None:
            required_aspects = ["定义", "原理", "使用方法", "注意事项"]

        all_contexts = []
        iteration_history = []

        # 第一轮：初始检索
        print(f"第 1 轮：初始检索")
        initial_results = self.retriever.retrieve(query, top_k=top_k)
        all_contexts.extend(initial_results)
        iteration_history.append({
            "iteration": 1,
            "query": query,
            "num_results": len(initial_results)
        })

        # 后续轮次：迭代优化
        for i in range(2, self.max_iterations + 1):
            # 构建当前上下文
            current_context = "\n\n".join(all_contexts)

            # 分析差距
            gaps = self.analyze_gaps(query, current_context, required_aspects)
            print(f"第 {i} 轮：发现 {len(gaps['missing'])} 个缺失方面")

            if not gaps['missing']:
                print("  所有方面已覆盖，停止迭代")
                break

            # 生成补充 query
            follow_up_queries = self.generate_follow_up_query(query, gaps)
            print(f"  补充查询: {follow_up_queries}")

            # 执行补充检索
            new_contexts = []
            for fuq in follow_up_queries:
                results = self.retriever.retrieve(fuq, top_k=top_k)
                new_contexts.extend(results)

            all_contexts.extend(new_contexts)
            iteration_history.append({
                "iteration": i,
                "queries": follow_up_queries,
                "new_contexts": len(new_contexts),
                "missing": gaps['missing']
            })

            # 防止无限循环
            if i >= self.max_iterations:
                break

        return {
            "contexts": all_contexts,
            "iteration_history": iteration_history,
            "total_contexts": len(all_contexts)
        }


# 使用示例
# retriever = YourRetriever()
# iterative = IterativeRetrieval(retriever, max_iterations=3)

# result = iterative.iterative_retrieve(
#     query="React useEffect 的完整指南",
#     required_aspects=["基础用法", "依赖数组", "cleanup 函数", "性能优化", "常见陷阱"]
# )

# print(f"共检索到 {result['total_contexts']} 个上下文")
# for history in result['iteration_history']:
#     print(f"  第 {history['iteration']} 轮: {history}")
```

### 6.2 自洽性校验 (Self-Consistency)

**核心思想**：通过多条推理路径的一致性来验证答案的正确性。

```python
class SelfConsistencyChecker:
    """
    自洽性校验：多条推理路径的一致性验证

    核心思想：
    1. 对同一个问题，生成多条不同的推理路径
    2. 检查这些路径的结论是否一致
    3. 一致性越高，答案越可信
    """

    def __init__(self, model="gpt-4"):
        self.llm = ChatOpenAI(model=model, temperature=0.7)  # 高温度保证多样性

    def generate_reasoning_paths(self, query, contexts, num_paths=5):
        """
        生成多条推理路径

        参数:
            query: 用户问题
            contexts: 检索到的上下文
            num_paths: 生成路径数量

        返回:
            List[Dict]: 每条推理路径
        """
        context_text = "\n\n".join(contexts)

        prompt = f"""基于以下上下文，从不同角度分析并回答问题。
请生成 {num_paths} 条不同的推理路径。

上下文：
{context_text}

问题：{query}

要求：
1. 每条路径使用不同的推理策略
2. 路径之间可以有交叉验证
3. 每条路径给出完整的推理过程和结论

输出格式：
路径1：[推理策略描述]
  推理：...
  结论：...

路径2：...

以此类推"""

        response = self.llm.invoke([{"role": "user", "content": prompt}])

        # 解析多条路径
        paths = []
        current_path = None

        for line in response.content.split('\n'):
            if line.startswith('路径'):
                if current_path:
                    paths.append(current_path)
                parts = line.split('：', 1)
                current_path = {
                    "strategy": parts[1] if len(parts) > 1 else "",
                    "reasoning": "",
                    "conclusion": ""
                }
            elif current_path:
                if line.startswith('推理：'):
                    current_path["reasoning"] = line[3:].strip()
                elif line.startswith('结论：'):
                    current_path["conclusion"] = line[3:].strip()

        if current_path:
            paths.append(current_path)

        return paths

    def check_consistency(self, reasoning_paths):
        """
        检查多条推理路径的一致性

        返回:
            Dict: 一致性分析结果
        """
        conclusions = [p["conclusion"] for p in reasoning_paths]

        prompt = f"""分析以下结论的一致性。

结论列表：
{chr(10).join([f"{i+1}. {c}" for i, c in enumerate(conclusions)])}

分析：
1. 这些结论在核心观点上是否一致？
2. 不一致的点在哪里？
3. 给出最终的综合结论

输出格式：
{{
  "consistent": true/false,
  "agreement_level": "高/中/低",
  "disagreements": ["不一致点1", "不一致点2"],
  "final_conclusion": "综合结论"
}}"""

        response = self.llm.invoke([{"role": "user", "content": prompt}])

        # 解析 JSON
        import json
        content = response.content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0]
        else:
            json_str = content

        return json.loads(json_str)

    def self_consistent_rag(self, query, contexts, num_paths=5):
        """
        完整的自洽性 RAG 流程

        返回:
            Dict: 最终答案和置信度
        """
        # 1. 生成多条推理路径
        print("生成多条推理路径...")
        paths = self.generate_reasoning_paths(query, contexts, num_paths)
        print(f"  生成了 {len(paths)} 条路径")

        # 2. 检查一致性
        print("检查推理一致性...")
        consistency = self.check_consistency(paths)
        print(f"  一致性: {consistency['agreement_level']}")

        # 3. 生成最终答案
        if consistency["consistent"] or consistency["agreement_level"] == "高":
            final_answer = consistency["final_conclusion"]
            confidence = "高"
        else:
            # 不一致时，给出多个可能答案并说明不确定性
            final_answer = self._handle_inconsistency(query, paths, consistency)
            confidence = "中/低"

        return {
            "answer": final_answer,
            "confidence": confidence,
            "reasoning_paths": paths,
            "consistency_analysis": consistency
        }

    def _handle_inconsistency(self, query, paths, consistency):
        """处理不一致的情况"""
        prompt = f"""当存在多个可能的答案时，给出最合理的解释。

原始问题：{query}

推理路径的结论：
{chr(10).join([p['conclusion'] for p in paths])}

不一致点：{', '.join(consistency['disagreements'])}

请给出：
1. 最可能正确的答案
2. 为什么这个答案比其他更可能正确
3. 需要进一步验证的问题"""

        response = self.llm.invoke([{"role": "user", "content": prompt}])
        return response.content


# 使用示例
checker = SelfConsistencyChecker()

contexts = [
    "React useEffect 在组件挂载时执行一次...",
    "依赖数组为空时，effect 只执行一次...",
    "useEffect 返回的函数是 cleanup 函数，在组件卸载时执行..."
]

query = "React useEffect 的执行时机是什么？"

result = checker.self_consistent_rag(query, contexts, num_paths=3)

print(f"\n最终答案 (置信度: {result['confidence']}):")
print(result['answer'])
```

---

## 7. 图结构检索：Knowledge Graph RAG

### 7.1 知识图谱 RAG 架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Knowledge Graph RAG 架构                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户 Query                                                                  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     实体识别 (NER)                                    │  │
│  │  • 人名、地点、组织                                                  │  │
│  │  • 技术术语、概念                                                    │  │
│  │  • 关系描述词                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     关系抽取 (Relation Extraction)                    │  │
│  │  • 实体之间的关系类型                                                │  │
│  │  • 关系的方向性                                                      │  │
│  │  • 关系的置信度                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     子图检索 (Subgraph Retrieval)                     │  │
│  │  • 根据实体定位图中的节点                                            │  │
│  │  • 提取多跳范围内的子图                                              │  │
│  │  • 剪枝不相关的边                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     图展开 (Graph Expansion)                          │  │
│  │  • 添加相关概念节点                                                  │  │
│  │  • 补充隐含关系                                                      │  │
│  │  • 路径推理                                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     文本检索增强                                      │  │
│  │  • 将子图转换为文本描述                                              │  │
│  │  • 与向量检索结果融合                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│      │                                                                      │
│      ▼                                                                      │
│  LLM 生成                                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 实体识别与关系抽取

```python
from transformers import pipeline, AutoModelForTokenClassification, AutoTokenizer
import networkx as nx

class KnowledgeGraphExtractor:
    """
    知识图谱抽取器

    从文本中抽取实体和关系，构建知识图谱
    """

    def __init__(self, model_name="dslim/bert-base-NER"):
        """
        初始化 NER 模型

        可选模型：
        - dslim/bert-base-NER: 英文 NER
        - bert-base-chinese: 中文 NER
        """
        self.ner_pipe = pipeline(
            "ner",
            model=model_name,
            aggregation_strategy="simple"
        )

    def extract_entities(self, text):
        """
        抽取实体

        返回:
            List[Dict]: 实体列表
        """
        entities = self.ner_pipe(text)

        # 过滤和标准化
        filtered_entities = []
        for ent in entities:
            if ent["score"] > 0.7:  # 置信度阈值
                filtered_entities.append({
                    "text": ent["text"],
                    "type": ent["entity_group"],
                    "start": ent["start"],
                    "end": ent["end"],
                    "confidence": ent["score"]
                })

        return filtered_entities

    def extract_relations(self, text, entities):
        """
        抽取实体之间的关系

        这是一个简化版本的生产者-消费者关系抽取
        """
        # 预定义关系类型
        relation_types = [
            "WORKS_FOR", "LOCATED_IN", "PART_OF",
            "KNOWS", "CREATED", "USES", "DEPENDS_ON"
        ]

        # 简单的基于模式的抽取
        # 实际应用中应使用专门的 Relation Extraction 模型
        relations = []

        # 按出现顺序排序实体
        sorted_entities = sorted(entities, key=lambda x: x["start"])

        for i, ent1 in enumerate(sorted_entities):
            for ent2 in sorted_entities[i+1:i+3]:  # 只看相邻实体
                # 简单的启发式规则
                if ent1["type"] == "PER" and ent2["type"] == "ORG":
                    relations.append({
                        "source": ent1["text"],
                        "target": ent2["text"],
                        "relation": "WORKS_FOR",
                        "direction": "PER->ORG"
                    })
                elif ent1["type"] == "ORG" and ent2["type"] == "LOC":
                    relations.append({
                        "source": ent1["text"],
                        "target": ent2["text"],
                        "relation": "LOCATED_IN",
                        "direction": "ORG->LOC"
                    })

        return relations

    def build_graph(self, texts):
        """
        从多个文本构建知识图谱

        返回:
            networkx.DiGraph: 有向图
        """
        G = nx.DiGraph()

        for text in texts:
            # 抽取实体
            entities = self.extract_entities(text)
            # 抽取关系
            relations = self.extract_relations(text, entities)

            # 添加节点
            for ent in entities:
                G.add_node(
                    ent["text"],
                    type=ent["type"],
                    confidence=ent["confidence"]
                )

            # 添加边
            for rel in relations:
                G.add_edge(
                    rel["source"],
                    rel["target"],
                    relation=rel["relation"],
                    direction=rel["direction"]
                )

        return G


# 关系抽取模型示例（更复杂的实现）
class AdvancedRelationExtractor:
    """
    使用专门模型进行关系抽取

    基于 SanforduNLP 的高性能关系抽取
    """

    def __init__(self):
        # 实际应用中加载专门的关系抽取模型
        self.relation_types = [
            "CAUSES", "TREATS", "DIAGNOSES",
            "SYMPTOM_OF", "COMPLICATES", "PREVENTS"
        ]

    def extract_with_model(self, text, head_entity, tail_entity):
        """
        使用模型判断两个实体之间的关系

        返回:
            str: 预测的关系类型
        """
        # 这是一个简化实现
        # 实际应使用专门的 Relation Classification 模型
        prompt = f"""分析以下句子中两个实体之间的关系。

句子：{text}

头实体：{head_entity}
尾实体：{tail_entity}

关系类型：{', '.join(self.relation_types)}

如果存在上述关系类型之一，输出关系名称；否则输出"无关系"。"""

        response = ChatOpenAI(model="gpt-4").invoke([{"role": "user", "content": prompt}])
        relation = response.content.strip()

        if relation in self.relation_types:
            return relation
        return "无关系"
```

### 7.3 图检索与路径遍历

```python
class GraphRetriever:
    """
    基于知识图谱的检索器

    支持：
    1. 实体定位
    2. 子图提取
    3. 路径推理
    """

    def __init__(self, graph: nx.DiGraph):
        self.graph = graph

    def find_relevant_subgraph(self, query_entities, max_hops=2):
        """
        根据查询实体找到相关子图

        参数:
            query_entities: List[str] 查询实体列表
            max_hops: 最大跳数

        返回:
            networkx.DiGraph: 子图
        """
        # BFS 扩展找到相关节点
        relevant_nodes = set()

        for entity in query_entities:
            if entity in self.graph:
                relevant_nodes.add(entity)

                # 多跳扩展
                for hop in range(max_hops):
                    current_nodes = list(relevant_nodes)
                    for node in current_nodes:
                        # 出边
                        successors = list(self.graph.successors(node))
                        relevant_nodes.update(successors)
                        # 入边
                        predecessors = list(self.graph.predecessors(node))
                        relevant_nodes.update(predecessors)

        # 提取子图
        subgraph = self.graph.subgraph(relevant_nodes).copy()
        return subgraph

    def find_paths(self, source, target, max_length=4):
        """
        找到两个实体之间的所有路径

        用于多跳推理
        """
        try:
            paths = list(nx.all_simple_paths(
                self.graph,
                source=source,
                target=target,
                cutoff=max_length
            ))
            return paths
        except nx.NetworkXNoPath:
            return []

    def path_to_text(self, path, include_relation=True):
        """
        将路径转换为可读的文本描述
        """
        descriptions = []

        for i in range(len(path) - 1):
            node = path[i]
            next_node = path[i + 1]

            if include_relation and self.graph.has_edge(node, next_node):
                relation = self.graph[node][next_node].get("relation", "相关")
                descriptions.append(f"{node} {relation} {next_node}")
            else:
                descriptions.append(f"{node} 连接到 {next_node}")

        return " → ".join(descriptions)

    def subgraph_to_context(self, subgraph, query_focus=None):
        """
        将子图转换为文本上下文
        """
        context_parts = []

        # 节点信息
        context_parts.append("### 实体信息\n")
        for node, data in subgraph.nodes(data=True):
            node_type = data.get("type", "未知")
            context_parts.append(f"- {node}（{node_type}）")

        # 关系信息
        context_parts.append("\n### 关系信息\n")
        for source, target, data in subgraph.edges(data=True):
            relation = data.get("relation", "相关")
            direction = data.get("direction", "")
            context_parts.append(f"- {source} → {target}（{relation}）")

        return "\n".join(context_parts)


# 使用示例
# 构建图
G = nx.DiGraph()

# 添加节点和边（知识图谱）
G.add_node("React", type="技术", description="Facebook 开发的 UI 框架")
G.add_node("useEffect", type="API", description="React Hook 用于处理副作用")
G.add_node("依赖数组", type="概念", description="控制 useEffect 执行时机的数组")
G.add_node("cleanup", type="概念", description="useEffect 返回的清理函数")

G.add_edge("useEffect", "依赖数组", relation="使用", description="依赖数组控制执行时机")
G.add_edge("useEffect", "cleanup", relation="返回", description="返回 cleanup 函数")
G.add_edge("依赖数组", "React", relation="属于", description="React 的核心概念")
G.add_edge("cleanup", "React", relation="属于", description="React 的清理机制")

# 图检索
retriever = GraphRetriever(G)

# 查询
query_entities = ["useEffect"]
subgraph = retriever.find_relevant_subgraph(query_entities, max_hops=2)

print("相关子图：")
print(subgraph_to_text(subgraph))
```

### 7.4 Graph RAG 完整实现

```python
class GraphRAGPipeline:
    """
    完整的 Graph RAG 流程

    整合：
    1. 实体识别
    2. 图检索
    3. 向量检索
    4. 结果融合
    """

    def __init__(self, vectorstore, kg_graph: nx.DiGraph):
        self.vectorstore = vectorstore
        self.kg_graph = kg_graph
        self.entity_extractor = KnowledgeGraphExtractor()
        self.graph_retriever = GraphRetriever(kg_graph)

    def extract_query_entities(self, query):
        """
        从查询中提取实体
        """
        entities = self.entity_extractor.extract_entities(query)
        return [e["text"] for e in entities]

    def graph_retrieve(self, query, max_hops=2):
        """
        图检索
        """
        # 提取查询实体
        entities = self.extract_query_entities(query)

        if not entities:
            return None

        # 找到相关子图
        subgraph = self.graph_retriever.find_relevant_subgraph(entities, max_hops)

        # 转换为文本
        context = self.graph_retriever.subgraph_to_context(subgraph, query)

        return {
            "type": "graph",
            "context": context,
            "entities": entities,
            "num_nodes": subgraph.number_of_nodes(),
            "num_edges": subgraph.number_of_edges()
        }

    def vector_retrieve(self, query, top_k=5):
        """
        向量检索
        """
        results = self.vectorstore.similarity_search(query, k=top_k)

        return {
            "type": "vector",
            "documents": [r.page_content for r in results],
            "scores": [r.score for r in results]
        }

    def fuse_results(self, graph_result, vector_result, weights=None):
        """
        融合图检索和向量检索的结果

        融合策略：
        1. 图结果提供结构化的关系信息
        2. 向量结果提供详细的文本内容
        """
        if weights is None:
            weights = {"graph": 0.4, "vector": 0.6}

        fused_context = []

        # 添加图检索结果
        if graph_result:
            fused_context.append(f"【图谱知识】\n{graph_result['context']}")

        # 添加向量检索结果
        if vector_result:
            docs_text = "\n\n".join(vector_result["documents"])
            fused_context.append(f"【文档知识】\n{docs_text}")

        return "\n\n".join(fused_context)

    def retrieve(self, query, top_k=5, max_hops=2):
        """
        完整的 Graph RAG 检索流程
        """
        # 1. 图检索
        graph_result = self.graph_retrieve(query, max_hops)

        # 2. 向量检索
        vector_result = self.vector_retrieve(query, top_k)

        # 3. 融合结果
        fused_context = self.fuse_results(graph_result, vector_result)

        return {
            "query": query,
            "graph_result": graph_result,
            "vector_result": vector_result,
            "fused_context": fused_context
        }


# 使用示例
# vectorstore = Chroma(persist_directory="./chroma_db")
# kg_graph = ...  # 知识图谱
# graph_rag = GraphRAGPipeline(vectorstore, kg_graph)

# result = graph_rag.retrieve(
#     query="React useEffect 的依赖数组和 cleanup 函数有什么关系？",
#     top_k=5
# )

# print("融合后的检索上下文：")
# print(result['fused_context'])
```

---

## 8. UltraRAG 的 Advanced RAG 实践

### 8.1 UltraRAG 框架概述

UltraRAG 是 2025-2026 年提出的下一代 RAG 框架，核心特点是**自适应检索**和**多维度优化**。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UltraRAG 框架架构                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      UltraRAG Core                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ 自适应检索  │  │ 动态上下文  │  │  多模态融合 │                  │   │
│  │  │  (Adaptive) │  │  (Dynamic)  │  │  (Multi-modal)│                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    UltraRAG Workflow                                 │   │
│  │                                                                       │   │
│  │   Query ──► 意图分类 ──► 检索策略选择 ──► 执行检索 ──► 结果评估       │   │
│  │                │                │               │           │        │   │
│  │                ▼                ▼               ▼           ▼        │   │
│  │           简单问题      复杂问题        混合检索    质量评估    反馈   │   │
│  │           单次检索      迭代检索        重排序      通过?      优化    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 UltraRAG 核心组件实现

```python
from enum import Enum
from typing import List, Dict, Callable

class QueryIntent(Enum):
    """查询意图分类"""
    SIMPLE_FACT = "simple_fact"           # 简单事实查询
    COMPLEX_REASONING = "complex_reasoning" # 复杂推理
    COMPARISON = "comparison"             # 对比查询
    SUMMARY = "summary"                   # 总结查询
    PROCEDURAL = "procedural"             # 步骤/流程查询

class RetrievalStrategy(Enum):
    """检索策略"""
    DIRECT = "direct"                     # 直接检索
    EXPANDED = "expanded"                 # 扩展检索
    ITERATIVE = "iterative"               # 迭代检索
    GRAPH = "graph"                       # 图检索
    HYBRID = "hybrid"                     # 混合检索

class UltraRAGPipeline:
    """
    UltraRAG 核心实现

    核心思想：根据查询类型自适应选择检索策略
    """

    def __init__(self, components: Dict):
        """
        初始化 UltraRAG

        参数:
            components: 包含各种检索组件的字典
                - vector_retriever: 向量检索器
                - bm25_retriever: BM25 检索器
                - graph_retriever: 图检索器
                - reranker: 重排序器
                - compressor: 上下文压缩器
                - llm: LLM 模型
        """
        self.components = components
        self.intent_classifier = self._build_intent_classifier()
        self.strategy_selector = self._build_strategy_selector()

    def _build_intent_classifier(self):
        """
        构建意图分类器

        实际应用中可使用专门的分类模型
        """
        def classify(query: str) -> QueryIntent:
            # 简化的规则分类
            if any(kw in query for kw in ["是什么", "定义", "什么是"]):
                return QueryIntent.SIMPLE_FACT
            elif any(kw in query for kw in ["比较", "对比", "区别", "差异"]):
                return QueryIntent.COMPARISON
            elif any(kw in query for kw in ["步骤", "流程", "如何", "怎么"]):
                return QueryIntent.PROCEDURAL
            elif any(kw in query for kw in ["总结", "概括", "概述"]):
                return QueryIntent.SUMMARY
            else:
                return QueryIntent.COMPLEX_REASONING

        return classify

    def _build_strategy_selector(self):
        """
        构建策略选择器

        根据意图选择最优检索策略
        """
        strategy_map = {
            QueryIntent.SIMPLE_FACT: RetrievalStrategy.DIRECT,
            QueryIntent.COMPARISON: RetrievalStrategy.HYBRID,
            QueryIntent.SUMMARY: RetrievalStrategy.EXPANDED,
            QueryIntent.PROCEDURAL: RetrievalStrategy.EXPANDED,
            QueryIntent.COMPLEX_REASONING: RetrievalStrategy.ITERATIVE,
        }

        def select(intent: QueryIntent, query: str) -> List[RetrievalStrategy]:
            base_strategy = strategy_map.get(intent, RetrievalStrategy.HYBRID)

            # 特殊规则
            if "图" in query or "关系" in query:
                return [RetrievalStrategy.GRAPH, RetrievalStrategy.HYBRID]

            return [base_strategy]

        return select

    def classify_and_route(self, query: str) -> Dict:
        """
        分类查询意图并选择检索策略
        """
        # 1. 意图分类
        intent = self.intent_classifier(query)

        # 2. 策略选择
        strategies = self.strategy_selector(intent, query)

        return {
            "query": query,
            "intent": intent,
            "strategies": strategies
        }

    def execute_strategy(self, strategy: RetrievalStrategy, query: str, **kwargs):
        """
        执行指定的检索策略
        """
        if strategy == RetrievalStrategy.DIRECT:
            # 直接检索
            return self.components["vector_retriever"].retrieve(query, top_k=5)

        elif strategy == RetrievalStrategy.EXPANDED:
            # 扩展检索（多 query）
            queries = self._expand_query(query)
            results = []
            for q in queries:
                r = self.components["vector_retriever"].retrieve(q, top_k=3)
                results.extend(r)
            return self._deduplicate_and_rank(results, top_k=5)

        elif strategy == RetrievalStrategy.ITERATIVE:
            # 迭代检索
            return self._iterative_retrieve(query, max_iterations=3)

        elif strategy == RetrievalStrategy.GRAPH:
            # 图检索
            return self.components["graph_retriever"].retrieve(query)

        elif strategy == RetrievalStrategy.HYBRID:
            # 混合检索
            return self._hybrid_retrieve(query, top_k=10)

    def _expand_query(self, query: str) -> List[str]:
        """Query 扩展"""
        # 使用 LLM 生成多个 query 变体
        prompt = f"""为以下查询生成 3 个不同的检索变体：

查询：{query}

变体应：
1. 使用不同的表述方式
2. 覆盖不同的角度
3. 保持核心语义

输出格式（每行一个）：
1. [变体1]
2. [变体2]
3. [变体3]"""

        response = self.components["llm"].invoke([{"role": "user", "content": prompt}])
        queries = [q.strip() for q in response.content.split('\n') if q.strip()]
        return queries

    def _hybrid_retrieve(self, query: str, top_k: int):
        """混合检索"""
        # 向量检索
        vector_results = self.components["vector_retriever"].retrieve(query, top_k=top_k)

        # BM25 检索
        bm25_results = self.components["bm25_retriever"].retrieve(query, top_k=top_k)

        # RRF 融合
        fused = self._rrf_fuse(vector_results, bm25_results, k=60)

        return fused

    def _rrf_fuse(self, results1, results2, k=60):
        """RRF 融合"""
        scores = {}

        for rank, item in enumerate(results1):
            doc_id = item["id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        for rank, item in enumerate(results2):
            doc_id = item["id"]
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)

        sorted_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [{"id": doc_id, "rrf_score": score} for doc_id, score in sorted_ids]

    def _iterative_retrieve(self, query: str, max_iterations: int):
        """迭代检索"""
        all_results = []
        current_query = query

        for i in range(max_iterations):
            # 检索
            results = self.components["vector_retriever"].retrieve(current_query, top_k=5)
            all_results.extend(results)

            # 分析是否需要继续
            if i < max_iterations - 1:
                new_query = self._analyze_and_refine(query, all_results)
                if new_query == current_query:
                    break
                current_query = new_query

        # 去重和排序
        return self._deduplicate_and_rank(all_results, top_k=5)

    def _analyze_and_refine(self, original_query: str, current_results: List) -> str:
        """分析当前结果，决定是否需要进一步检索"""
        # 简化实现，实际应分析结果覆盖度
        return original_query + " 相关"

    def _deduplicate_and_rank(self, results: List, top_k: int):
        """去重和排序"""
        seen = set()
        unique_results = []

        for item in results:
            if item["id"] not in seen:
                seen.add(item["id"])
                unique_results.append(item)

        return unique_results[:top_k]

    def rerank_and_compress(self, query: str, results: List[Dict]) -> str:
        """
        重排序和上下文压缩
        """
        if not results:
            return ""

        # 1. 重排序
        documents = [r["content"] for r in results]
        reranked = self.components["reranker"].rerank(query, documents, top_k=10)

        # 2. 上下文压缩
        compressed = self.components["compressor"].compress(query, reranked)

        return compressed

    def generate(self, query: str, context: str) -> str:
        """
        使用 LLM 生成最终答案
        """
        prompt = f"""基于以下上下文回答问题。如果上下文中没有相关信息，请如实说明。

上下文：
{context}

问题：{query}

回答："""

        response = self.components["llm"].invoke([{"role": "user", "content": prompt}])
        return response.content

    def run(self, query: str) -> Dict:
        """
        完整的 UltraRAG 流程
        """
        # 1. 分类和路由
        routing = self.classify_and_route(query)

        # 2. 执行检索策略
        all_results = []
        for strategy in routing["strategies"]:
            results = self.execute_strategy(strategy, query)
            all_results.extend(results)

        # 3. 去重
        unique_results = self._deduplicate_and_rank(all_results, top_k=10)

        # 4. 重排序和压缩
        compressed_context = self.rerank_and_compress(query, unique_results)

        # 5. 生成
        answer = self.generate(query, compressed_context)

        return {
            "query": query,
            "intent": routing["intent"].value,
            "strategy": [s.value for s in routing["strategies"]],
            "context": compressed_context,
            "answer": answer,
            "num_retrieved": len(unique_results)
        }


# 使用示例
# components = {
#     "vector_retriever": VectorRetriever(),
#     "bm25_retriever": BM25Retriever(),
#     "graph_retriever": GraphRetriever(),
#     "reranker": BGEReranker(),
#     "compressor": ContextCompressor(),
#     "llm": ChatOpenAI(model="gpt-4")
# }
# ultra_rag = UltraRAGPipeline(components)

# result = ultra_rag.run("React useEffect 和 Vue3 watchEffect 有什么区别？")

# print(f"意图: {result['intent']}")
# print(f"策略: {result['strategy']}")
# print(f"答案:\n{result['answer']}")
```

---

## 9. 实战：完整的 Advanced RAG 系统

### 9.1 系统架构

```python
class AdvancedRAGSystem:
    """
    完整的 Advanced RAG 系统

    整合所有优化技术：
    1. Query 优化
    2. 混合检索
    3. 上下文压缩
    4. 重排序
    5. 迭代检索
    6. 图结构检索
    """

    def __init__(self, config: Dict):
        self.config = config
        self._initialize_components()

    def _initialize_components(self):
        """初始化所有组件"""
        # Query 优化
        self.query_rewriter = QueryRewriter()
        self.query_expander = QueryExpander()
        self.query_compressor = QueryCompressor()

        # 检索器
        self.vectorstore = self.config["vectorstore"]
        self.hybrid_search = HybridSearch(self.vectorstore)

        # 上下文压缩
        self.llm_extractor = LLMChainExtractor()
        self.embeddings_filter = EmbeddingsFilter()

        # 重排序
        if self.config.get("use_cohere_rerank"):
            self.reranker = CohereReranker(self.config["cohere_api_key"])
        else:
            self.reranker = BGEReranker()

        # 图检索（可选）
        if self.config.get("knowledge_graph"):
            self.graph_retriever = GraphRetriever(self.config["knowledge_graph"])

    def optimize_query(self, query: str, mode: str = "full"):
        """
        Query 优化

        参数:
            query: 原始查询
            mode: 优化模式
                - "rewrite": 仅改写
                - "expand": 扩展
                - "full": 完整优化
        """
        if mode == "rewrite":
            return self.query_rewriter.rewrite(query)

        elif mode == "expand":
            # HyDE 扩展
            hyde_result = self.query_expander.hyde_expansion(query)
            return hyde_result["retrieval_queries"]

        elif mode == "full":
            # 完整优化流程
            # 1. 改写
            rewritten = self.query_rewriter.rewrite(query)

            # 2. 多角度扩展
            aspects = self.query_expander.expand_with_aspect(rewritten)

            # 3. 合并所有 query
            all_queries = [rewritten]
            all_queries.extend(aspects.values())

            return all_queries

    def retrieve(self, queries: List[str], top_k_per_query: int = 10):
        """
        执行混合检索
        """
        all_results = []

        for q in queries:
            # 混合检索
            results = self.hybrid_search.hybrid_search(q, top_k=top_k_per_query)
            all_results.extend(results)

        # 去重
        seen = set()
        unique_results = []
        for r in all_results:
            if r["doc_id"] not in seen:
                seen.add(r["doc_id"])
                unique_results.append(r)

        return unique_results

    def rerank(self, query: str, results: List[Dict], top_k: int = 10):
        """
        重排序
        """
        documents = [r["document"] for r in results]
        reranked = self.reranker.rerank(query, documents, top_k=top_k)

        return reranked

    def compress_context(self, query: str, documents: List[str], max_chars: int = 3000):
        """
        上下文压缩
        """
        # 1. EmbeddingsFilter 粗筛
        filtered = self.embeddings_filter.filter_documents(
            query, documents, top_k=20
        )

        if not filtered:
            filtered = [(doc, 0.5) for doc in documents[:10]]

        # 2. LLMChainExtractor 精提
        extracted = []
        for doc, score in filtered:
            relevant = self.llm_extractor.extract_relevant(query, doc, max_chars=300)
            if relevant != "不相关":
                extracted.append(relevant)

        # 3. 合并
        combined = "\n\n".join(extracted)

        # 4. 截断
        if len(combined) > max_chars:
            combined = combined[:max_chars] + "..."

        return combined

    def generate(self, query: str, context: str) -> str:
        """
        生成答案
        """
        prompt = f"""你是一个专业的技术问答助手。基于提供的上下文信息，准确回答用户问题。

要求：
1. 如果上下文中包含相关信息，给出详细答案
2. 如果上下文不完整，补充合理推断并说明
3. 如果上下文中没有相关信息，直接说明"抱歉，知识库中没有找到相关信息"
4. 引用上下文中的具体信息来支撑答案

上下文：
{context}

问题：{query}

回答："""

        response = ChatOpenAI(model="gpt-4")([
            {"role": "user", "content": prompt}
        ])

        return response.content

    def run(self, query: str, mode: str = "full") -> Dict:
        """
        完整的 Advanced RAG 流程

        返回:
            Dict: 包含答案和相关元信息
        """
        # 1. Query 优化
        optimized_queries = self.optimize_query(query, mode=mode)

        # 2. 检索
        results = self.retrieve(optimized_queries, top_k_per_query=10)

        if not results:
            return {
                "query": query,
                "answer": "抱歉，知识库中没有找到相关信息。",
                "num_retrieved": 0
            }

        # 3. 重排序
        reranked = self.rerank(query, results, top_k=10)

        # 4. 提取文档内容
        documents = [r["document"] for r in reranked]

        # 5. 上下文压缩
        context = self.compress_context(query, documents)

        # 6. 生成
        answer = self.generate(query, context)

        return {
            "query": query,
            "optimized_queries": optimized_queries,
            "num_retrieved": len(results),
            "num_reranked": len(reranked),
            "context_length": len(context),
            "answer": answer
        }


# 初始化系统
config = {
    "vectorstore": vectorstore,  # Milvus/Pinecone/Chroma
    "use_cohere_rerank": False,
    "cohere_api_key": None,
    "knowledge_graph": knowledge_graph  # 可选
}

rag_system = AdvancedRAGSystem(config)

# 运行
result = rag_system.run(
    "React useEffect 的依赖数组如何影响性能？有哪些最佳实践？"
)

print(f"原始查询优化为 {len(result['optimized_queries'])} 个查询")
print(f"检索到 {result['num_retrieved']} 个文档，重排后 {result['num_reranked']} 个")
print(f"压缩后上下文：{result['context_length']} 字符")
print(f"\n答案：\n{result['answer']}")
```

### 9.2 性能优化技巧

```python
class RAGPerformanceOptimizer:
    """
    RAG 性能优化工具
    """

    @staticmethod
    def cache_embeddings(cache, query, embedding):
        """缓存 query embedding 避免重复计算"""
        cache[query] = embedding
        return embedding

    @staticmethod
    def batch_retrieve(retriever, queries, batch_size=32):
        """批量检索减少 RPC 调用"""
        results = []
        for i in range(0, len(queries), batch_size):
            batch = queries[i:i+batch_size]
            batch_results = retriever.batch_retrieve(batch)
            results.extend(batch_results)
        return results

    @staticmethod
    def early_stopping(results, threshold=0.9):
        """早停：如果 top 结果已经足够好，跳过后续处理"""
        if not results:
            return False

        # 检查 top 结果的分数
        top_scores = [r["score"] for r in results[:3]]
        avg_top = sum(top_scores) / len(top_scores)

        return avg_top >= threshold
```

---

## 10. 面试高频问题

**Q1：为什么需要 Query 优化？直接检索不行吗？**

**答：** 用户的自然语言 query 往往存在以下问题：
1. **口语化**："那个关于机器学习的"这类表达无法精确匹配
2. **歧义性**："它"指代不明，需要结合上下文
3. **不完整性**：缺少主语、技术术语等

Query 优化通过改写、扩展、压缩等手段，将用户表达转换为更适合检索的形式，是提升检索质量的第一道优化。

---

**Q2：混合检索相比纯向量检索有什么优势？**

**答：** 混合检索结合了稀疏检索（关键词匹配）和密集检索（语义理解）的优势：
- **稀疏检索擅长**：精确匹配专业术语、缩写、长尾知识
- **密集检索擅长**：语义理解、同义词扩展、模糊匹配

两者互补，RRF 融合算法能在不知道最优权重的情况下实现稳健的融合。

---

**Q3：什么时候需要 Rerank？直接在检索时排序不行吗？**

**答：** 检索阶段使用的是轻量级的向量相似度计算，优势是快（毫秒级），但无法捕获精细的语义关系。Rerank 阶段使用 Cross-Encoder 或 LLM 进行更精确的相关性评估，优势是准，但计算量大（通常 100-500ms）。

最佳实践是：
- 检索阶段：快速召回 top 50-100 个候选
- Rerank 阶段：精确排序 top 10-20 个

---

**Q4：知识图谱 RAG 相比向量 RAG 的适用场景？**

**答：** 知识图谱 RAG 擅长：
- **多跳推理**：A→B→C 需要两步推理的关系
- **结构化查询**：需要理解实体关系的复杂查询
- **可解释性要求高**：需要提供因果链路

向量 RAG 擅长：
- **开放域问答**：语义相似即可
- **海量文档**：十亿级向量规模
- **更新频繁**：新文档直接写入

实际系统通常结合两者。

---

**Q5：UltraRAG 的自适应检索是如何实现的？**

**答：** UltraRAG 的核心是"意图驱动的策略选择"：
1. **意图分类**：识别查询是简单事实、复杂推理还是对比分析
2. **策略映射**：不同意图对应不同检索策略
3. **动态调整**：根据中间结果决定是否需要迭代

这避免了"一刀切"的问题，让简单问题快速回答，复杂问题深入检索。

---

*本文档持续更新，最后更新于 2026 年 3 月*
