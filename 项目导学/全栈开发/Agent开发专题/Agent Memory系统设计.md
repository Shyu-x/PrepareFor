# Agent Memory 系统设计

## 概述

Memory（记忆）系统是Agent的核心组件之一，它使Agent能够跨越多个交互保持上下文一致性，并从历史经验中学习和改进。

## 短期记忆：Token 窗口管理

### 1. Token窗口概念

Token窗口是模型处理的上下文长度限制，超出部分会被截断。有效管理Token窗口是构建高效Agent的关键。

```
┌────────────────────────────────────────────────────────┐
│                    Token窗口 (128K)                     │
├──────────┬─────────────────────────────┬───────────────┤
│ 历史记忆  │        当前上下文             │   可用空间    │
│ (压缩)   │     (最近的对话/任务)         │   (新内容)   │
└──────────┴─────────────────────────────┴───────────────┘
```

### 2. 滑动窗口实现

```typescript
// 滑动窗口记忆管理
interface MemorySlice {
  content: string;
  tokenCount: number;
  timestamp: number;
  importance: number;  // 重要性评分
}

class SlidingWindowMemory {
  private maxTokens: number;
  private slices: MemorySlice[] = [];
  private reservedTokens: number;  // 为系统Prompt保留的空间

  constructor(options: {
    maxTokens: number;
    reservedTokens?: number;
  }) {
    this.maxTokens = maxTokens;
    this.reservedTokens = options.reservedTokens || 4000;
  }

  // 添加记忆片段
  add(content: string, importance: number = 1): void {
    const tokenCount = this.countTokens(content);

    this.slices.push({
      content,
      tokenCount,
      timestamp: Date.now(),
      importance
    });

    // 触发窗口调整
    this.prune();
  }

  // 修剪低重要性内容
  private prune(): void {
    const availableTokens = this.maxTokens - this.reservedTokens;
    let currentTokens = this.slices.reduce(
      (sum, s) => sum + s.tokenCount, 0
    );

    if (currentTokens <= availableTokens) return;

    // 按重要性+时间排序
    this.slices.sort((a, b) => {
      const scoreA = a.importance * this.timeDecay(a.timestamp);
      const scoreB = b.importance * this.timeDecay(b.timestamp);
      return scoreB - scoreA;
    });

    // 移除最低优先级内容
    while (currentTokens > availableTokens && this.slices.length > 0) {
      const removed = this.slices.pop();
      currentTokens -= removed!.tokenCount;
    }
  }

  // 时间衰减函数
  private timeDecay(timestamp: number): number {
    const age = Date.now() - timestamp;
    const hours = age / (1000 * 60 * 60);
    return Math.exp(-hours / 24);  // 24小时半衰期
  }

  // 获取当前窗口内容
  getContext(): string {
    return this.slices
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(s => s.content)
      .join('\n');
  }
}
```

### 3. 摘要压缩

当需要保留更多信息时，使用摘要压缩：

```typescript
// 摘要压缩记忆
class SummarizingMemory {
  private rawSlices: MemorySlice[] = [];
  private summarized: MemorySlice[] = [];
  private llm: LLM;
  private compressionThreshold = 0.8;  // 80%满时触发压缩

  async compress(): Promise<void> {
    if (this.rawSlices.length === 0) return;

    // 生成摘要
    const summary = await this.llm.complete({
      prompt: `请总结以下对话的要点，保留关键信息和决策:

      ${this.rawSlices.map(s => s.content).join('\n')}

      摘要要求:
      1. 保留关键事实和决策
      2. 提取重要教训和模式
      3. 控制在200字以内
      `
    });

    this.summarized.push({
      content: summary,
      tokenCount: this.countTokens(summary),
      timestamp: Date.now(),
      importance: 1.0  // 摘要保留完整重要性
    });

    this.rawSlices = [];
  }

  // 混合检索：摘要 + 近期记忆
  getRelevantContext(query: string): string {
    const relevantSummaries = this.summarized
      .filter(s => this.isRelevant(s.content, query));

    const recentRaw = this.rawSlices
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    return [...relevantSummaries, ...recentRaw]
      .map(s => s.content)
      .join('\n');
  }
}
```

## 长期记忆：向量存储、RAG

### 1. 向量数据库选型

| 数据库 | 特点 | 适用场景 |
|--------|------|---------|
| Pinecone | 全托管、高可用 | 企业级应用 |
| Weaviate | 混合搜索支持 | 多模态数据 |
| Chroma | 轻量、本地优先 | 原型开发 |
| Qdrant | 高性能、 Rust实现 | 低延迟需求 |
| Milvus | 超大规模 | 海量向量 |

### 2. 长期记忆存储

```typescript
// 长期记忆接口
interface LongTermMemory {
  // 存储记忆
  store(memory: MemoryEntry): Promise<void>;

  // 语义检索
  search(query: string, topK?: number): Promise<MemoryEntry[]>;

  // 更新记忆
  update(id: string, memory: Partial<MemoryEntry>): Promise<void>;

  // 删除记忆
  delete(id: string): Promise<void>;
}

interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'fact' | 'experience' | 'preference' | 'skill';
    tags: string[];
    source: 'interaction' | 'task' | 'feedback';
    agentId?: string;
  };
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  importance: number;  // 持久重要性
}

// 向量存储实现
class VectorMemory implements LongTermMemory {
  private vectorStore: VectorStore;
  private embeddingModel: EmbeddingModel;

  async store(memory: MemoryEntry): Promise<void> {
    // 生成向量嵌入
    memory.embedding = await this.embeddingModel.embed(memory.content);

    // 存储到向量数据库
    await this.vectorStore.insert(memory);

    // 同步到关系数据库存储元信息
    await this.metadataStore.save(memory);
  }

  async search(query: string, topK: number = 5): Promise<MemoryEntry[]> {
    // 查询向量
    const queryEmbedding = await this.embeddingModel.embed(query);

    // 向量相似度搜索
    const results = await this.vectorStore.search(
      queryEmbedding,
      topK * 2  // 获取更多以便后续过滤
    );

    // 更新访问统计
    for (const result of results) {
      await this.updateAccessStats(result.id);
    }

    return results.slice(0, topK);
  }

  // 语义搜索 + 关键词搜索混合
  async hybridSearch(
    query: string,
    topK: number = 5
  ): Promise<MemoryEntry[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.search(query, topK * 2),
      this.keywordSearch(query, topK * 2)
    ]);

    // 加权融合
    return this.rerank(
      query,
      [...vectorResults, ...keywordResults],
      { vectorWeight: 0.7, keywordWeight: 0.3 }
    );
  }
}
```

### 3. RAG（检索增强生成）

```typescript
// RAG系统实现
class RAGSystem {
  private memory: LongTermMemory;
  private llm: LLM;

  async query(
    question: string,
    context?: string
  ): Promise<string> {
    // 1. 检索相关记忆
    const relevantMemories = await this.memory.search(question, 5);

    // 2. 构建增强上下文
    const enhancedContext = relevantMemories.length > 0
      ? `相关记忆:\n${relevantMemories.map(m => `- ${m.content}`).join('\n')}\n\n${context || ''}`
      : context;

    // 3. 生成回答
    const response = await this.llm.complete({
      prompt: `基于以下上下文回答问题。如果没有相关信息，请说明不知道。

      上下文:
      ${enhancedContext}

      问题: ${question}

      回答:`,
      temperature: 0.7
    });

    // 4. 存储这次交互
    await this.memory.store({
      id: generateId(),
      content: `问题: ${question}\n回答: ${response}`,
      metadata: { type: 'experience', tags: ['Q&A'] }
    });

    return response;
  }
}
```

### 4. 记忆索引结构

```typescript
// 分层记忆索引
class HierarchicalMemoryIndex {
  // 一级索引：主题分类
  private topicIndex = new Map<string, Set<string>>();

  // 二级索引：时间线
  private timelineIndex: MemoryEntry[] = [];

  // 三级索引：向量
  private vectorIndex: VectorStore;

  // 多维索引插入
  async index(memory: MemoryEntry): Promise<void> {
    // 更新主题索引
    const topics = this.extractTopics(memory.content);
    for (const topic of topics) {
      const existing = this.topicIndex.get(topic) || new Set();
      existing.add(memory.id);
      this.topicIndex.set(topic, existing);
    }

    // 更新时间线索引
    this.timelineIndex.push(memory);
    this.timelineIndex.sort((a, b) => a.createdAt - b.createdAt);

    // 更新向量索引
    await this.vectorIndex.insert(memory);
  }

  // 多路召回
  async multiIndexSearch(
    query: string,
    options: {
      topics?: string[];
      timeRange?: { start: number; end: number };
      topK?: number;
    }
  ): Promise<MemoryEntry[]> {
    const candidates = new Set<string>();

    // 主题过滤
    if (options.topics) {
      for (const topic of options.topics) {
        const ids = this.topicIndex.get(topic);
        if (ids) ids.forEach(id => candidates.add(id));
      }
    }

    // 时间过滤
    let timeFiltered = this.timelineIndex;
    if (options.timeRange) {
      timeFiltered = timeFiltered.filter(
        m => m.createdAt >= options.timeRange!.start &&
             m.createdAt <= options.timeRange!.end
      );
      timeFiltered.forEach(m => candidates.add(m.id));
    }

    // 向量搜索
    const vectorResults = await this.vectorIndex.search(
      query,
      options.topK || 10
    );
    vectorResults.forEach(m => candidates.add(m.id));

    // 取交集返回
    return Array.from(candidates)
      .map(id => this.getMemoryById(id))
      .filter(Boolean)
      .slice(0, options.topK || 10);
  }
}
```

## 记忆检索策略

### 1. 检索评估

```typescript
// 检索质量评估
interface RetrievalMetrics {
  precision: number;    // 检索结果相关性
  recall: number;       // 相关记忆被召回比例
  ndcg: number;         // 排名质量
  latency: number;      // 检索延迟
}

class MemoryRetriever {
  async retrieve(
    query: string,
    topK: number
  ): Promise<{ results: MemoryEntry[]; metrics: RetrievalMetrics }> {
    const start = Date.now();

    // 执行检索
    const results = await this.executeRetrieval(query, topK * 3);

    // 重排序
    const reranked = await this.rerankResults(query, results);

    const end = Date.now();

    return {
      results: reranked.slice(0, topK),
      metrics: {
        precision: this.calculatePrecision(query, reranked.slice(0, topK)),
        recall: this.calculateRecall(query, reranked.slice(0, topK)),
        ndcg: this.calculateNDCG(query, reranked),
        latency: end - start
      }
    };
  }

  // 重排序模型
  private async rerankResults(
    query: string,
    results: MemoryEntry[]
  ): Promise<MemoryEntry[]> {
    // 使用交叉编码器重排序
    const scores = await Promise.all(
      results.map(r => this.crossEncoder.score(query, r.content))
    );

    return results
      .map((r, i) => ({ entry: r, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.entry);
  }
}
```

### 2. 自适应检索

```typescript
// 自适应检索策略
class AdaptiveRetriever {
  async retrieveWithStrategy(
    query: string,
    context: RetrievalContext
  ): Promise<MemoryEntry[]> {
    const strategies = [
      // 策略1: 精确关键词匹配
      () => this.exactMatch(query),

      // 策略2: 语义向量搜索
      () => this.semanticSearch(query, 10),

      // 策略3: 上下文扩展搜索
      () => this.contextualExpand(query, context, 5),

      // 策略4: 时间衰减搜索
      () => this.timeDecaySearch(query)
    ];

    // 尝试每个策略直到获得足够结果
    for (const strategy of strategies) {
      const results = await strategy();

      if (results.length >= 3 && this.isQualitySufficient(results)) {
        return results;
      }
    }

    // 如果都不够好，返回所有结果的合并
    return this.mergeResults(await Promise.all(strategies.map(s => s())));
  }

  // 根据对话历史选择检索策略
  selectStrategy(conversationHistory: Message[]): RetrievalStrategy {
    const lastMessage = conversationHistory[conversationHistory.length - 1];

    if (lastMessage.content.includes('之前') ||
        lastMessage.content.includes('记得')) {
      return 'long_term_recall';
    }

    if (lastMessage.content.includes('为什么')) {
      return 'causal_chain';
    }

    return 'recent_relevant';
  }
}
```

### 3. 记忆更新策略

```typescript
// 记忆生命周期管理
class MemoryLifeCycleManager {
  // 记忆老化
  async age Memories(): Promise<void> {
    const memories = await this.getAllMemories();

    for (const memory of memories) {
      // 计算记忆强度
      const strength = this.calculateStrength(memory);

      if (strength < this.forgettingThreshold) {
        await this.markForDeletion(memory.id);
      }
    }
  }

  // 记忆强化
  async reinforceMemory(access: MemoryAccess): Promise<void> {
    const memory = await this.getMemory(access.memoryId);

    // 访问时强化
    memory.strength = Math.min(
      1.0,
      memory.strength + this.reinforcementRate
    );

    // 一致性强化
    if (access.result?.confirmed) {
      memory.strength *= 1.1;
    }

    await this.updateMemory(memory);
  }

  // 记忆整合
  async consolidate(): Promise<void> {
    // 找到可以整合的记忆群组
    const groups = await this.findIntegratableGroups();

    for (const group of groups) {
      // 生成整合记忆
      const consolidated = await this.generateConsolidatedMemory(group);

      // 删除原记忆
      await Promise.all(group.map(m => this.delete(m.id)));

      // 存储整合后的记忆
      await this.store(consolidated);
    }
  }
}
```

## 记忆系统实战

### 1. Agent对话记忆

```typescript
// Agent对话记忆实现
class ConversationMemory {
  private shortTerm: SlidingWindowMemory;
  private longTerm: VectorMemory;
  private profile: UserProfileMemory;

  async getContextForResponse(
    userId: string,
    currentQuery: string
  ): Promise<string> {
    // 1. 获取用户画像
    const profile = await this.profile.get(userId);

    // 2. 获取短期记忆
    const shortTermContext = this.shortTerm.getContext();

    // 3. 检索长期记忆
    const longTermMemories = await this.longTerm.hybridSearch(
      currentQuery,
      3
    );

    // 4. 构建完整上下文
    return this.buildContext(profile, shortTermContext, longTermMemories);
  }

  async recordInteraction(interaction: Interaction): Promise<void> {
    // 记录到短期记忆
    this.shortTerm.add(
      `${interaction.user}: ${interaction.query}`,
      interaction.importance
    );

    this.shortTerm.add(
      `${interaction.agent}: ${interaction.response}`,
      interaction.importance
    );

    // 如果是关键信息，记录到长期记忆
    if (interaction.isKeyInformation) {
      await this.longTerm.store({
        content: `${interaction.user}对${interaction.topic}的态度: ${interaction.response}`,
        metadata: {
          type: 'preference',
          tags: [interaction.topic, 'attitude']
        }
      });
    }
  }
}
```

### 2. 经验学习系统

```typescript
// 经验学习记忆
class ExperienceLearningMemory {
  // 从任务执行中学习
  async learnFromTask(
    task: Task,
    execution: Execution,
    result: Result
  ): Promise<void> {
    // 提取成功模式
    if (result.success) {
      await this.extractSuccessPatterns(task, execution);
    }

    // 提取失败教训
    if (!result.success) {
      await this.extractFailureLessons(task, execution, result.error);
    }

    // 提取技巧和诀窍
    const tips = await this.extractTips(task, execution);
    for (const tip of tips) {
      await this.storeTip(tip);
    }
  }

  // 查询相关经验
  async queryExperience(task: Task): Promise<Experience[]> {
    const experiences = await this.longTerm.search(
      task.description,
      5
    );

    // 过滤相关经验
    return experiences.filter(e =>
      this.calculateRelevance(task, e) > 0.7
    );
  }
}
```

## 总结

Agent Memory系统设计的核心要点：

1. **短期记忆** - 滑动窗口管理Token消耗，摘要压缩保留关键信息
2. **长期记忆** - 向量存储支持语义检索，RAG增强生成质量
3. **记忆检索** - 多策略自适应检索，重排序提升精度
4. **记忆更新** - 生命周期管理，动态强化和遗忘

一个设计良好的Memory系统能让Agent具备持续学习和改进的能力。
