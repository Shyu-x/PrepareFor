# Agent Memory系统设计

## 为什么AI Agent需要Memory系统

人类智能的核心优势之一是拥有完善的记忆系统——能够记住过去的经验、积累知识，并在需要时快速检索。传统的AI模型每次对话都是从零开始，无法真正"记住"用户偏好、历史交互或领域知识。而AI Agent的Memory系统，正是赋予Agent持久智能的关键基础设施。

### Memory系统的核心价值

1. **持久上下文**：跨越会话保持状态和偏好
2. **经验积累**：从历史交互中学习和改进
3. **个性化**：为每个用户提供定制化服务
4. **效率提升**：避免重复询问已知信息

## Memory类型体系

### 三层记忆架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Long-Term Memory（长期记忆）               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   知识库    │  │   用户画像  │  │  世界知识   │        │
│  │ Knowledge   │  │   Profile   │  │   World     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ▪ 持久存储  ▪ 结构化/非结构化  ▪ 需要向量检索  ▪ 容量大   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Working Memory（工作记忆）                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   当前任务  │  │  任务进度   │  │  上下文窗口 │        │
│  │  Task State │  │  Progress   │  │    Window   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ▪ 会话级  ▪ 高频读写  ▪ LLM直接访问  ▪ 容量有限         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Short-Term Memory（短期记忆）              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  最近对话   │  │   临时变量  │  │  缓冲数据   │        │
│  │  Recent     │  │   Temp Vars │  │   Buffer    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ▪ 请求级  ▪ 快速过期  ▪ 自动清理  ▪ 容量极小           │
└─────────────────────────────────────────────────────────────┘
```

### 短期记忆（Short-Term Memory）

短期记忆存储当前请求的即时信息，具有极短的生命周期：

```typescript
// 短期记忆实现
interface ShortTermMemory {
  // 存储空间
  buffer: Map<string, any>;

  // TTL配置（毫秒）
  ttl: number;

  // 存储条目
  set(key: string, value: any, ttl?: number): void;

  // 获取条目（自动过期检查）
  get(key: string): any | null;

  // 删除条目
  delete(key: string): boolean;

  // 清理过期条目
  cleanup(): void;
}

// 短期记忆管理器实现
class ShortTermMemoryManager implements ShortTermMemory {
  private buffer: Map<string, { value: any; expiresAt: number }>;
  private defaultTtl: number;

  constructor(defaultTtlMs: number = 60000) {
    // 使用Map存储键值对及其过期时间
    this.buffer = new Map();
    // 默认TTL为60秒
    this.defaultTtl = defaultTtlMs;

    // 定期清理过期数据
    setInterval(() => this.cleanup(), 10000);
  }

  // 存储数据
  set(key: string, value: any, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTtl);
    this.buffer.set(key, { value, expiresAt });
  }

  // 获取数据
  get(key: string): any | null {
    const entry = this.buffer.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.buffer.delete(key);
      return null;
    }

    return entry.value;
  }

  // 删除数据
  delete(key: string): boolean {
    return this.buffer.delete(key);
  }

  // 清理过期数据
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.buffer.entries()) {
      if (now > entry.expiresAt) {
        this.buffer.delete(key);
      }
    }
  }

  // 批量获取（用于上下文组装）
  getRecent(limit: number = 10): Array<{ key: string; value: any }> {
    const entries: Array<{ key: string; value: any }> = [];
    for (const [key, entry] of this.buffer.entries()) {
      if (Date.now() <= entry.expiresAt) {
        entries.push({ key, value: entry.value });
      }
    }
    // 按最近访问排序
    return entries.slice(-limit);
  }
}

// 使用示例
const shortMemory = new ShortTermMemoryManager(30000); // 30秒TTL

// 存储当前请求的临时数据
shortMemory.set('current_user_input', '帮我分析这份报告');
shortMemory.set('uploaded_file_ref', { id: 'file_123', name: 'report.pdf' });

// 获取临时数据
const userInput = shortMemory.get('current_user_input');
```

### 工作记忆（Working Memory）

工作记忆是Agent在任务执行过程中的核心存储区域：

```typescript
// 工作记忆状态
interface WorkingMemoryState {
  // 当前任务
  currentTask: Task | null;

  // 任务执行步骤
  steps: ExecutionStep[];

  // 中间结果
  intermediateResults: Map<string, any>;

  // 工具调用历史
  toolCalls: ToolCall[];

  // 计划栈（子任务）
  planStack: Plan[];
}

// 步骤记录
interface ExecutionStep {
  stepId: string;
  timestamp: number;
  action: 'thought' | 'observe' | 'act' | 'reflect';
  content: string;
  metadata?: Record<string, any>;
}

// 工作记忆管理器
class WorkingMemoryManager {
  private state: WorkingMemoryState;
  private maxSteps: number;

  constructor(maxSteps: number = 50) {
    this.state = {
      currentTask: null,
      steps: [],
      intermediateResults: new Map(),
      toolCalls: [],
      planStack: [],
    };
    this.maxSteps = maxSteps;
  }

  // 开始新任务
  startTask(task: Task): void {
    this.state.currentTask = task;
    this.state.steps = [];
    this.state.intermediateResults.clear();
    this.state.toolCalls = [];
    this.state.planStack = [];

    this.addStep('thought', `开始执行任务: ${task.description}`);
  }

  // 添加执行步骤
  addStep(
    action: ExecutionStep['action'],
    content: string,
    metadata?: Record<string, any>
  ): ExecutionStep {
    const step: ExecutionStep = {
      stepId: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      content,
      metadata,
    };

    this.state.steps.push(step);

    // 限制步骤数量，防止内存溢出
    if (this.state.steps.length > this.maxSteps) {
      // 保留关键步骤，压缩中间步骤
      this.compressSteps();
    }

    return step;
  }

  // 压缩步骤历史
  private compressSteps(): void {
    const criticalSteps = this.state.steps.filter((s) =>
      ['thought', 'reflect'].includes(s.action)
    );
    const lastActSteps = this.state.steps
      .filter((s) => s.action === 'act')
      .slice(-5); // 保留最近5个操作

    this.state.steps = [
      ...criticalSteps,
      ...lastActSteps,
    ].sort((a, b) => a.timestamp - b.timestamp);
  }

  // 存储中间结果
  setResult(key: string, value: any): void {
    this.state.intermediateResults.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  // 获取中间结果
  getResult(key: string): any | null {
    return this.state.intermediateResults.get(key)?.value ?? null;
  }

  // 记录工具调用
  recordToolCall(tool: string, args: any, result: any): void {
    this.state.toolCalls.push({
      tool,
      args,
      result,
      timestamp: Date.now(),
    });

    this.addStep('act', `调用工具: ${tool}`, {
      args,
      success: !result.isError,
    });
  }

  // 压入子计划
  pushPlan(plan: Plan): void {
    this.state.planStack.push(plan);
    this.addStep('thought', `创建子计划: ${plan.description}`);
  }

  // 弹出子计划
  popPlan(): Plan | null {
    return this.state.planStack.pop() ?? null;
  }

  // 获取当前上下文（用于LLM调用）
  getContext(): string {
    const parts: string[] = [];

    // 当前任务
    if (this.state.currentTask) {
      parts.push(`当前任务: ${this.state.currentTask.description}`);
    }

    // 最近步骤（最后10个）
    const recentSteps = this.state.steps.slice(-10);
    if (recentSteps.length > 0) {
      parts.push('最近操作:');
      recentSteps.forEach((s) => {
        parts.push(`  [${s.action}] ${s.content}`);
      });
    }

    // 中间结果摘要
    if (this.state.intermediateResults.size > 0) {
      parts.push('中间结果:');
      for (const [key, entry] of this.state.intermediateResults.entries()) {
        parts.push(`  ${key}: ${JSON.stringify(entry.value).slice(0, 100)}`);
      }
    }

    return parts.join('\n');
  }

  // 完成当前任务
  finishTask(): TaskResult {
    const result: TaskResult = {
      task: this.state.currentTask!,
      steps: [...this.state.steps],
      toolCalls: [...this.state.toolCalls],
      results: Object.fromEntries(this.state.intermediateResults),
      completedAt: Date.now(),
    };

    // 保存到长期记忆（关键结果）
    this.persistToLongTerm(result);

    // 重置状态
    this.state.currentTask = null;

    return result;
  }

  // 持久化关键结果（供长期记忆使用）
  private persistToLongTerm(result: TaskResult): void {
    // 此方法由外部长期记忆管理器实现
    eventEmitter.emit('memory:persist', result);
  }
}
```

### 长期记忆（Long-Term Memory）

长期记忆存储持久化知识，需要高效的检索机制：

```typescript
// 长期记忆条目
interface MemoryEntry {
  id: string;
  type: 'knowledge' | 'preference' | 'experience' | 'fact';
  content: string;
  embedding: number[]; // 向量表示
  metadata: {
    createdAt: number;
    updatedAt: number;
    accessCount: number;
    lastAccessedAt: number;
    source: string;
    tags: string[];
    confidence: number; // 置信度
  };
}

// 长期记忆存储
interface LongTermMemory {
  // 存储记忆
  store(entry: Omit<MemoryEntry, 'id' | 'metadata'>): Promise<MemoryEntry>;

  // 向量检索
  search(query: string, limit?: number): Promise<MemoryEntry[]>;

  // 关键词检索
  searchByKeywords(
    keywords: string[],
    limit?: number
  ): Promise<MemoryEntry[]>;

  // 更新记忆
  update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry>;

  // 删除记忆
  delete(id: string): Promise<boolean>;

  // 获取记忆统计
  getStats(): Promise<MemoryStats>;
}

// Pinecone/Weaviate风格的向量存储实现
class VectorLongTermMemory implements LongTermMemory {
  private entries: Map<string, MemoryEntry>;
  private embeddingModel: EmbeddingModel;
  private vectorIndex: VectorIndex;

  constructor(embeddingModel: EmbeddingModel) {
    this.entries = new Map();
    this.embeddingModel = embeddingModel;
    // 使用简单的内存向量索引（生产环境应使用专门的向量数据库）
    this.vectorIndex = new InMemoryVectorIndex(384); // 嵌入维度
  }

  // 存储新记忆
  async store(input: {
    type: MemoryEntry['type'];
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
  }): Promise<MemoryEntry> {
    // 生成嵌入向量
    const embedding = await this.embeddingModel.embed(input.content);

    // 创建记忆条目
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: input.type,
      content: input.content,
      embedding,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        accessCount: 0,
        lastAccessedAt: Date.now(),
        source: 'user_interaction',
        tags: [],
        confidence: 0.8,
        ...input.metadata,
      },
    };

    // 存储到内存
    this.entries.set(entry.id, entry);

    // 添加到向量索引
    this.vectorIndex.add(entry.id, embedding);

    return entry;
  }

  // 向量相似度搜索
  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.embeddingModel.embed(query);

    // 在向量索引中搜索最相似的条目
    const ids = this.vectorIndex.search(queryEmbedding, limit);

    // 获取完整记忆条目
    const results: MemoryEntry[] = [];
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (entry) {
        // 更新访问统计
        entry.metadata.accessCount++;
        entry.metadata.lastAccessedAt = Date.now();
        results.push(entry);
      }
    }

    return results;
  }

  // 关键词搜索
  async searchByKeywords(
    keywords: string[],
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    const results: Array<{ entry: MemoryEntry; score: number }> = [];

    for (const entry of this.entries.values()) {
      let score = 0;

      // 检查标题/内容匹配
      for (const keyword of keywords) {
        if (entry.content.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // 检查标签匹配
      for (const keyword of keywords) {
        if (entry.metadata.tags.some((tag) =>
          tag.toLowerCase().includes(keyword.toLowerCase())
        )) {
          score += 2; // 标签匹配权重更高
        }
      }

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit).map((r) => r.entry);
  }

  // 更新记忆
  async update(
    id: string,
    updates: Partial<MemoryEntry>
  ): Promise<MemoryEntry> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`记忆不存在: ${id}`);
    }

    // 如果更新了内容，需要重新生成嵌入
    if (updates.content) {
      updates.embedding = await this.embeddingModel.embed(updates.content);
      this.vectorIndex.update(id, updates.embedding);
    }

    // 合并更新
    const updated: MemoryEntry = {
      ...entry,
      ...updates,
      metadata: {
        ...entry.metadata,
        ...updates.metadata,
        updatedAt: Date.now(),
      },
    };

    this.entries.set(id, updated);
    return updated;
  }

  // 删除记忆
  async delete(id: string): Promise<boolean> {
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.vectorIndex.remove(id);
    }
    return deleted;
  }

  // 获取统计信息
  async getStats(): Promise<MemoryStats> {
    const entries = Array.from(this.entries.values());

    return {
      totalCount: entries.length,
      byType: entries.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgConfidence:
        entries.reduce((sum, e) => sum + e.metadata.confidence, 0) /
        entries.length || 0,
      oldestEntry: entries.length > 0
        ? Math.min(...entries.map((e) => e.metadata.createdAt))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map((e) => e.metadata.createdAt))
        : null,
    };
  }
}

// 简单的内存向量索引（用于演示）
class InMemoryVectorIndex {
  private vectors: Map<string, number[]>;
  private dimension: number;

  constructor(dimension: number) {
    this.vectors = new Map();
    this.dimension = dimension;
  }

  // 添加向量
  add(id: string, vector: number[]): void {
    if (vector.length !== this.dimension) {
      throw new Error(`向量维度错误: 期望${this.dimension}，实际${vector.length}`);
    }
    this.vectors.set(id, vector);
  }

  // 更新向量
  update(id: string, vector: number[]): void {
    this.add(id, vector);
  }

  // 删除向量
  remove(id: string): void {
    this.vectors.delete(id);
  }

  // 余弦相似度搜索
  search(queryVector: number[], topK: number): string[] {
    const similarities: Array<{ id: string; similarity: number }> = [];

    for (const [id, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      similarities.push({ id, similarity });
    }

    // 按相似度降序排序
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK).map((s) => s.id);
  }

  // 余弦相似度计算
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}
```

## 记忆检索与向量搜索

### 混合检索策略

```typescript
// 混合检索引擎
class HybridMemorySearch {
  private vectorSearch: VectorLongTermMemory;
  private keywordSearch: LongTermMemory;

  constructor(memory: VectorLongTermMemory) {
    this.vectorSearch = memory;
    this.keywordSearch = memory;
  }

  // 混合搜索：结合向量和关键词
  async search(
    query: string,
    options: {
      limit?: number;
      types?: MemoryEntry['type'][];
      minConfidence?: number;
      dateRange?: { start: number; end: number };
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, types, minConfidence, dateRange } = options;

    // 并行执行向量搜索和关键词搜索
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch.search(query, limit * 2),
      this.vectorSearch.searchByKeywords(
        this.extractKeywords(query),
        limit * 2
      ),
    ]);

    // 合并结果，计算综合分数
    const scoreMap = new Map<string, SearchResult>();

    // 向量搜索结果（权重0.7）
    vectorResults.forEach((entry, index) => {
      const score = (1 - index / vectorResults.length) * 0.7;
      scoreMap.set(entry.id, {
        entry,
        vectorScore: score,
        keywordScore: 0,
        combinedScore: score,
      });
    });

    // 关键词搜索结果（权重0.3）
    keywordResults.forEach((entry, index) => {
      const score = (1 - index / keywordResults.length) * 0.3;
      const existing = scoreMap.get(entry.id);

      if (existing) {
        existing.keywordScore = score;
        existing.combinedScore = existing.vectorScore + score;
      } else {
        scoreMap.set(entry.id, {
          entry,
          vectorScore: 0,
          keywordScore: score,
          combinedScore: score,
        });
      }
    });

    // 转换为数组并排序
    let results = Array.from(scoreMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore);

    // 应用过滤器
    if (types && types.length > 0) {
      results = results.filter((r) => types.includes(r.entry.type));
    }

    if (minConfidence !== undefined) {
      results = results.filter(
        (r) => r.entry.metadata.confidence >= minConfidence
      );
    }

    if (dateRange) {
      results = results.filter(
        (r) =>
          r.entry.metadata.createdAt >= dateRange.start &&
          r.entry.metadata.createdAt <= dateRange.end
      );
    }

    return results.slice(0, limit);
  }

  // 从查询中提取关键词
  private extractKeywords(query: string): string[] {
    // 简单实现：去除停用词
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '有', '和', '就',
      '不', '人', '都', '一', '一个', '上', '也', '很',
      '到', '说', '要', '去', '你', '会', '着', '没有',
      '看', '好', '自己', '这', '那', '它', '他', '她',
    ]);

    return query
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));
  }
}

// 搜索结果
interface SearchResult {
  entry: MemoryEntry;
  vectorScore: number;
  keywordScore: number;
  combinedScore: number;
}
```

## 上下文窗口管理

### 智能上下文压缩

```typescript
// 上下文管理器
class ContextWindowManager {
  private maxTokens: number;
  private embeddingModel: EmbeddingModel;

  constructor(maxTokens: number = 128000, embeddingModel: EmbeddingModel) {
    this.maxTokens = maxTokens;
    this.embeddingModel = embeddingModel;
  }

  // 估算token数量（简单实现）
  private estimateTokens(text: string): number {
    // 中英文混合估算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return chineseChars + englishWords;
  }

  // 压缩上下文
  async compress(
    context: ContextItem[],
    targetTokens: number
  ): Promise<ContextItem[]> {
    const currentTokens = context.reduce(
      (sum, item) => sum + this.estimateTokens(item.content),
      0
    );

    if (currentTokens <= targetTokens) {
      return context;
    }

    // 按重要性排序
    const sorted = this.sortByImportance(context);

    // 贪心选择最重要的内容
    const selected: ContextItem[] = [];
    let usedTokens = 0;

    for (const item of sorted) {
      const itemTokens = this.estimateTokens(item.content);

      if (usedTokens + itemTokens <= targetTokens) {
        selected.push(item);
        usedTokens += itemTokens;
      } else if (selected.length > 0) {
        // 尝试压缩最后一个条目
        const lastItem = selected[selected.length - 1];
        const compressed = await this.compressItem(lastItem, targetTokens - usedTokens);

        if (compressed) {
          selected[selected.length - 1] = compressed;
          break;
        }
      }
    }

    return selected;
  }

  // 按重要性排序
  private sortByImportance(context: ContextItem[]): ContextItem[] {
    return context.sort((a, b) => {
      // 优先级：系统提示 > 用户偏好 > 最近对话 > 历史知识
      const priority = {
        system: 100,
        preference: 80,
        recent: 60,
        historical: 40,
      };

      const scoreA = priority[a.type as keyof typeof priority] || 0;
      const scoreB = priority[b.type as keyof typeof priority] || 0;

      // 时间衰减
      const ageA = Date.now() - a.timestamp;
      const ageB = Date.now() - b.timestamp;
      const decayA = Math.exp(-ageA / (24 * 60 * 60 * 1000)); // 24小时半衰期
      const decayB = Math.exp(-ageB / (24 * 60 * 60 * 1000));

      return scoreA * decayA - scoreB * decayB;
    });
  }

  // 压缩单个条目
  private async compressItem(
    item: ContextItem,
    maxTokens: number
  ): Promise<ContextItem | null> {
    // 使用LLM进行智能压缩
    const prompt = `
请将以下内容压缩到约${maxTokens}个token，保留核心信息：

${item.content}
`;

    try {
      const response = await callLLM(prompt);
      const compressedContent = extractTextFromResponse(response);

      if (this.estimateTokens(compressedContent) <= maxTokens) {
        return {
          ...item,
          content: compressedContent,
          compressed: true,
        };
      }
    } catch (error) {
      console.error('压缩失败:', error);
    }

    return null;
  }
}

// 上下文条目
interface ContextItem {
  id: string;
  type: 'system' | 'preference' | 'recent' | 'historical' | 'knowledge';
  content: string;
  timestamp: number;
  importance?: number;
  compressed?: boolean;
}
```

## 记忆压缩与遗忘机制

### 自适应遗忘策略

```typescript
// 遗忘策略配置
interface ForgettingPolicy {
  // 基础保留时间（毫秒）
  baseRetention: number;

  // 访问频率权重
  accessFrequencyDecay: number;

  // 置信度阈值
  minConfidence: number;

  // 定期检查间隔
  checkInterval: number;
}

// 记忆衰减管理器
class MemoryForgettingManager {
  private policy: ForgettingPolicy;
  private memory: LongTermMemory;

  constructor(memory: LongTermMemory, policy?: Partial<ForgettingPolicy>) {
    this.policy = {
      baseRetention: 7 * 24 * 60 * 60 * 1000, // 7天
      accessFrequencyDecay: 0.1,
      minConfidence: 0.3,
      checkInterval: 24 * 60 * 60 * 1000, // 24小时
      ...policy,
    };

    this.memory = memory;
    this.startPeriodicCheck();
  }

  // 计算单条记忆的保留分数
  private calculateRetentionScore(entry: MemoryEntry): number {
    const age = Date.now() - entry.metadata.createdAt;
    const baseRetentionMs = this.policy.baseRetention;

    // 基础分数：随时间衰减
    const ageScore = Math.exp(-age / baseRetentionMs);

    // 访问频率加成
    const accessScore = Math.min(
      1,
      entry.metadata.accessCount * this.policy.accessFrequencyDecay
    );

    // 置信度加权
    const confidenceScore = entry.metadata.confidence;

    // 综合分数
    return ageScore * 0.3 + accessScore * 0.4 + confidenceScore * 0.3;
  }

  // 检查是否应该遗忘
  shouldForget(entry: MemoryEntry): boolean {
    // 低于置信度阈值的直接遗忘
    if (entry.metadata.confidence < this.policy.minConfidence) {
      return true;
    }

    // 保留分数过低的遗忘
    const retentionScore = this.calculateRetentionScore(entry);
    if (retentionScore < 0.2) {
      return true;
    }

    return false;
  }

  // 执行遗忘检查
  async performForgettingCheck(): Promise<{
    checked: number;
    forgotten: number;
  }> {
    const stats = await this.memory.getStats();
    const entries = await this.memory.search('', { limit: stats.totalCount });

    let forgotten = 0;

    for (const entry of entries) {
      if (this.shouldForget(entry)) {
        // 根据遗忘程度决定处理方式
        const retentionScore = this.calculateRetentionScore(entry);

        if (retentionScore < 0.1) {
          // 完全遗忘：删除记忆
          await this.memory.delete(entry.id);
          forgotten++;
        } else {
          // 部分遗忘：降低置信度或压缩内容
          await this.memory.update(entry.id, {
            metadata: {
              confidence: entry.metadata.confidence * 0.8,
            },
          });
        }
      }
    }

    return { checked: stats.totalCount, forgotten };
  }

  // 启动定期检查
  private startPeriodicCheck(): void {
    setInterval(
      () => this.performForgettingCheck(),
      this.policy.checkInterval
    );
  }
}

// 记忆巩固：将短期记忆转入长期记忆
class MemoryConsolidation {
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;
  private embeddingModel: EmbeddingModel;

  constructor(
    shortTerm: ShortTermMemory,
    longTerm: LongTermMemory,
    embeddingModel: EmbeddingModel
  ) {
    this.shortTerm = shortTerm;
    this.longTerm = longTerm;
    this.embeddingModel = embeddingModel;
  }

  // 巩固候选判断
  async consolidate(): Promise<number> {
    // 获取短期记忆中的所有条目
    const candidates = this.shortTerm.getRecent(100);

    let consolidated = 0;

    for (const candidate of candidates) {
      // 评估是否值得巩固
      const shouldConsolidate = await this.evaluateForConsolidation(
        candidate.value
      );

      if (shouldConsolidate) {
        await this.longTerm.store({
          type: 'experience',
          content: JSON.stringify(candidate.value),
          metadata: {
            source: 'session_consolidation',
            tags: this.extractTags(candidate.value),
          },
        });
        consolidated++;
      }
    }

    return consolidated;
  }

  // 评估巩固价值
  private async evaluateForConsolidation(value: any): Promise<boolean> {
    // 简单策略：检查内容长度和唯一性
    const content = JSON.stringify(value);
    if (content.length < 50) return false; // 太短，不值得存储

    // 检查是否与现有记忆重复
    const similar = await this.longTerm.search(content, 1);
    if (similar.length > 0) {
      const existingContent = similar[0].content;
      const similarity = this.calculateStringSimilarity(content, existingContent);
      if (similarity > 0.8) return false; // 过于相似，不重复存储
    }

    return true;
  }

  // 简单字符串相似度
  private calculateStringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // 提取标签
  private extractTags(value: any): string[] {
    const tags: string[] = [];

    // 从内容中提取关键词作为标签
    const content = JSON.stringify(value);
    const keywords = ['用户', '项目', '任务', '问题', '解决方案'];

    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags;
  }
}
```

## OpenClaw soul.md深度解析

### Soul.md的本质与设计哲学

OpenClaw的`soul.md`是Agent Memory系统中最具创新性的设计之一。与传统AI系统中硬编码的系统提示词或结构化的JSON/YAML配置文件不同，soul.md采用纯Markdown格式的自然语言文档，允许用户以完全自由的方式定义Agent的价值观、沟通风格和行为边界。

**核心创新点**：
- **从"配置"到"灵魂"的范式转变**：soul.md不是技术参数的简单罗列，而是一份真正意义上的"灵魂文档"。Agent通过阅读它来"理解自己是谁"——这句话确立了整个文件的基调：这不是一份技术规格说明书，而是一份身份建构的宣言。
- **配置即代码的超越**：传统配置是机器友好的，而soul.md是人类友好的。用自然语言表达Agent的身份认同，机器通过解析这份文档来生成对应的系统提示。
- **持久化与透明性**：文件形式的配置具有天然的可审计性和可修改性，用户可以随时用文本编辑器查看、修改Agent的"灵魂"。

**来源**：[CSDN - OpenClaw soul.md深度研究:技术架构、哲学内核与安全风险](https://blog.csdn.net/weixin_36829761/article/details/158207761)

### Soul.md的标准结构

```markdown
# Soul.md - Agent灵魂定义标准模板

## 身份定义
- **名称**: [Agent名称]
- **角色**: [核心角色定位]
- **专长**: [精通的技术领域]
- **语言**: [默认语言、备用语言]

## 核心原则
1. [第一原则 - 通常是安全性或质量相关]
2. [第二原则 - 通常是用户体验相关]
3. [第三原则 - 通常是效率或协作相关]
4. [第四原则 - 通常是持续改进相关]

## 知识边界
- **精通**: [能够独立完成的专业领域]
- **熟悉**: [需要辅助但能处理的技术]
- **了解**: [仅能提供基础信息的领域]

## 行为模式
- **沟通风格**: [如：简洁专业、主动建议]
- **代码风格**: [如：函数式、类型安全、详细注释]
- **错误处理**: [如：防御性编程、明确错误提示]

## 记忆策略
- 短期记忆：当前会话的上下文（自动管理）
- 长期记忆：用户偏好、项目配置（持久化）
- 遗忘策略：[具体的遗忘时间窗口]
```

### OpenClaw记忆系统的三层架构

OpenClaw的MEMORY.md系统采用分层设计，这与传统的向量数据库方案形成鲜明对比：

**第一层：每日日志（Daily Notes）**
- 存储位置：`memory/YYYY-MM-DD.md`
- 内容：原始交互记录、临时信息、任务执行结果
- 特点：追加模式、自动归档、成本低

**第二层：长期记忆（MEMORY.md）**
- 存储位置：项目根目录的MEMORY.md
- 内容：经筛选的重要决策、用户偏好、知识总结
- 特点：Agent主动整理、人工可干预、持久有效

**第三层：灵魂记忆（SOUL.md）**
- 存储位置：项目根目录的SOUL.md
- 内容：Agent身份定义、核心原则、行为边界
- 特点：定义即生效、不受压缩影响、最优先加载

**关键设计洞察**：OpenClaw选择"Memory as Documentation"而非"Memory as Database"。这一选择体现了对状态透明性的极致追求——使用纯文本/Markdown文件使Agent的状态完全可视化，人类可以随时用文本编辑器查看Agent正在"想"什么。如果Agent跑偏了，人类可以直接手动修改Markdown文件来纠正状态，这比去数据库里改JSON字段要高效得多。

**来源**：[CSDN - 基于MEMORY.md的Agent任务栈架构实践](https://blog.csdn.net/wang_walfred/article/details/158317889)

### OpenClaw记忆系统的安全机制

2026年3月，Meta对齐总监Summer Yue在测试OpenClaw时发生了一起著名的"删邮件事故"：她告诉Agent"检查收件箱，提供归档或删除建议，但在她发话之前不要做任何事"。当Agent面对真实收件箱的数千条信息时，上下文窗口被填满，Agent执行了压缩操作，而那句关键的"不要做任何事"的指令——因为是在对话中给出、从未保存到文件中——从压缩摘要中消失了。Agent恢复了自主模式，开始删除邮件。

这个事件揭示了OpenClaw记忆系统的核心安全原则：

1. **持久有效的规则必须放在文件中，而不是在聊天中提供**：MEMORY.md和AGENTS.md文件不受压缩操作影响，但在对话中输入的指令无法保证持久性。

2. **检查记忆刷新是否启用**：OpenClaw有一个内置的安全网，用于在进行压缩操作之前保存上下文，但需要确保有足够的缓冲区空间触发。

3. **强制检索记忆**：在AGENTS.md中添加规则"在行动前搜索记忆"，避免Agent基于过时或不完整的信息做出决策。

**来源**：[腾讯新闻 - Meta删邮件事故背后：OpenClaw为什么会"失忆"](https://new.qq.com/rain/a/20260316A07AJE00)

### Soul.md的加载与使用

```typescript
// Soul配置加载器 - 增强版
class SoulLoader {
  private soulPath: string;
  private cache: SoulConfig | null = null;
  private lastModified: number = 0;

  constructor(soulPath: string = './soul.md') {
    this.soulPath = soulPath;
  }

  // 智能加载：检查文件变化，避免重复解析
  async load(forceReload: boolean = false): Promise<SoulConfig> {
    const stats = await fs.stat(this.soulPath);
    const currentModified = stats.mtimeMs;

    // 文件未变化且有缓存，直接返回
    if (!forceReload && this.cache && currentModified === this.lastModified) {
      return this.cache;
    }

    const content = await fs.readFile(this.soulPath, 'utf-8');
    this.cache = this.parseSoulMarkdown(content);
    this.lastModified = currentModified;

    return this.cache;
  }

  // Markdown解析器
  private parseSoulMarkdown(content: string): SoulConfig {
    const config: SoulConfig = {
      identity: {},
      principles: [],
      knowledgeBoundary: {
        '精通': [],
        '熟悉': [],
        '了解': []
      },
      behaviorPatterns: {},
      memoryStrategy: {},
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // 匹配二级标题
      const headingMatch = trimmed.match(/^##\s+(.+)$/);
      if (headingMatch) {
        currentSection = headingMatch[1];
        continue;
      }

      // 跳过其他级别的标题和空行
      if (trimmed.startsWith('#') || !trimmed) continue;

      // 解析各章节内容
      switch (currentSection) {
        case '身份定义':
          const identityMatch = trimmed.match(/^\*\*([^:]+)\*\*:\s*(.+)$/);
          if (identityMatch) {
            config.identity[identityMatch[1]] = identityMatch[2];
          }
          break;

        case '核心原则':
          const principleMatch = trimmed.match(/^\d+\.\s+(.+)$/);
          if (principleMatch) {
            config.principles.push(principleMatch[1]);
          }
          break;

        case '知识边界':
          const boundaryMatch = trimmed.match(/^\*\*([^:]+)\*\*:\s*(.+)$/);
          if (boundaryMatch) {
            const level = boundaryMatch[1] as keyof typeof config.knowledgeBoundary;
            const items = boundaryMatch[2].split(/[、,]/).map(s => s.trim());
            if (level in config.knowledgeBoundary) {
              config.knowledgeBoundary[level] = items;
            }
          }
          break;

        case '行为模式':
          const behaviorMatch = trimmed.match(/^\*\*([^:]+)\*\*:\s*(.+)$/);
          if (behaviorMatch) {
            config.behaviorPatterns[behaviorMatch[1]] = behaviorMatch[2];
          }
          break;

        case '记忆策略':
          const memoryMatch = trimmed.match(/^-([^：:]+)[：:]\s*(.+)$/);
          if (memoryMatch) {
            const type = memoryMatch[1].trim();
            config.memoryStrategy[type] = memoryMatch[2];
          }
          break;
      }
    }

    return config;
  }

  // 生成系统提示
  generateSystemPrompt(soul: SoulConfig, userContext?: UserContext): string {
    const parts: string[] = [];

    // 身份部分
    if (soul.identity['名称']) {
      parts.push(`你是一个${soul.identity['名称']}。`);
    }
    if (soul.identity['角色']) {
      parts.push(`你的核心角色是：${soul.identity['角色']}。`);
    }
    if (soul.identity['专长']) {
      parts.push(`你的专长领域包括：${soul.identity['专长']}。`);
    }

    // 核心原则
    if (soul.principles.length > 0) {
      parts.push('\n请始终遵循以下核心原则：');
      soul.principles.forEach((p, i) => {
        parts.push(`${i + 1}. ${p}`);
      });
    }

    // 知识边界
    const boundaryParts: string[] = [];
    if (soul.knowledgeBoundary['精通']?.length > 0) {
      boundaryParts.push(`精通：${soul.knowledgeBoundary['精通'].join('、')}`);
    }
    if (soul.knowledgeBoundary['熟悉']?.length > 0) {
      boundaryParts.push(`熟悉：${soul.knowledgeBoundary['熟悉'].join('、')}`);
    }
    if (soul.knowledgeBoundary['了解']?.length > 0) {
      boundaryParts.push(`了解：${soul.knowledgeBoundary['了解'].join('、')}`);
    }
    if (boundaryParts.length > 0) {
      parts.push('\n你的知识边界：');
      parts.push(boundaryParts.join('；') + '。');
    }

    // 行为模式
    if (Object.keys(soul.behaviorPatterns).length > 0) {
      parts.push('\n行为规范：');
      for (const [key, value] of Object.entries(soul.behaviorPatterns)) {
        parts.push(`- ${key}：${value}`);
      }
    }

    // 记忆策略（安全提示）
    parts.push('\n记忆管理：');
    parts.push('- 重要指令必须保存到文件（MEMORY.md）中，而非仅在对话中提及');
    parts.push('- 在执行可能不可逆的操作前，必须检索记忆确认上下文');

    return parts.join('\n');
  }
}

// Soul配置类型
interface SoulConfig {
  identity: Record<string, string>;
  principles: string[];
  knowledgeBoundary: {
    '精通': string[];
    '熟悉': string[];
    '了解': string[];
  };
  behaviorPatterns: Record<string, string>;
  memoryStrategy: Record<string, string>;
}

interface UserContext {
  userId: string;
  preferences?: Record<string, any>;
  recentTasks?: string[];
}
```

## 向量检索方案对比（Pinecone vs Milvus vs Chroma）

### 三大向量数据库核心特性对比

在构建Agent Memory系统时，选择合适的向量数据库是关键决策。以下是2025-2026年主流向量数据库的深度对比：

| 特性维度 | **Pinecone** | **Milvus** | **Chroma** |
|---------|-------------|------------|------------|
| **部署模式** | 全托管云服务 | 自部署/云原生 | 轻量嵌入式 |
| **适用场景** | 企业级大规模生产 | 超大规模、自托管需求 | 原型开发、轻量应用 |
| **向量规模** | 十亿级 | 十亿级以上 | 百万级 |
| **延迟** | <100ms | <50ms（本地） | <10ms（本地） |
| **成本** | 按量付费（较贵） | 基础设施成本 | 免费开源 |
| **维护成本** | 极低 | 中高 | 极低 |
| **生态集成** | 丰富（OpenAI、LangChain） | 丰富 | 专注于LangChain |

**来源**：[CSDN - 向量数据库选型指南：Milvus与FAISS/Pinecone/Weaviate对比](https://blog.csdn.net/zengzizi/article/details/146003305)

### Pinecone：企业级云原生方案

**核心优势**：
- **零运维**：Pinecone是全托管服务，无需关心索引构建、碎片管理、副本同步等底层细节
- **一致性保证**：强一致性的索引更新，确保检索结果的可预期性
- **Serverless架构**：自动扩缩容，按实际查询量计费

**索引类型选择**：
- **批量导入场景**：推荐使用`cosine`相似度，配合HNSW索引
- **实时更新场景**：支持增量索引更新，但需要注意批量大小控制

```typescript
// Pinecone集成示例
import { Pinecone } from '@pinecone-database/pinecone';

class PineconeMemoryStore implements LongTermMemory {
  private client: Pinecone;
  private indexName: string;
  private index: any;

  constructor(apiKey: string, environment: string, indexName: string) {
    this.client = new Pinecone({ apiKey, environment });
    this.indexName = indexName;
  }

  async initialize(dimension: number = 1536): Promise<void> {
    // 创建索引（如果不存在）
    try {
      await this.client.createIndex({
        name: this.indexName,
        dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
    } catch (e) {
      // 索引可能已存在
    }
    this.index = this.client.Index(this.indexName);
  }

  async store(input: {
    type: MemoryEntry['type'];
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
  }): Promise<MemoryEntry> {
    const embedding = await this.embeddingModel.embed(input.content);
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.index.upsert([{
      id,
      values: embedding,
      metadata: {
        type: input.type,
        content: input.content,
        createdAt: Date.now(),
        ...input.metadata
      }
    }]);

    return {
      id,
      type: input.type,
      content: input.content,
      embedding,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        accessCount: 0,
        lastAccessedAt: Date.now(),
        source: 'pinecone',
        tags: [],
        confidence: 0.8,
        ...input.metadata
      }
    };
  }

  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.embeddingModel.embed(query);

    const results = await this.index.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true
    });

    return results.matches.map((match: any) => ({
      id: match.id,
      type: match.metadata.type,
      content: match.metadata.content,
      embedding: match.values,
      metadata: match.metadata
    }));
  }
}
```

### Milvus：超大规模自托管方案

**核心优势**：
- **支持十亿级向量**：分布式架构支持水平扩展
- **多种索引类型**：IVF、HNSW、ANNOY、DiskANN等
- **丰富的SDK支持**：Python、Go、Java、Node.js等

**索引参数优化建议**（来源：[CSDN - Milvus向量数据库索引参数优化](https://blog.csdn.net/m0_70647377/article/details/147811909)）：

```typescript
// Milvus集成示例
import { MilvusClient } from '@zilliz/milvus2-sdk-node';

class MilvusMemoryStore implements LongTermMemory {
  private client: MilvusClient;
  private collectionName: string;

  constructor(uri: string, collectionName: string = 'agent_memory') {
    this.client = new MilvusClient(uri);
    this.collectionName = collectionName;
  }

  async initialize(dimension: number = 1536): Promise<void> {
    // 创建Collection
    await this.client.createCollection({
      collection_name: this.collectionName,
      fields: [
        {
          name: 'id',
          data_type: 'VarChar',
          max_length: 256
        },
        {
          name: 'embedding',
          data_type: 'FloatVector',
          dim: dimension
        },
        {
          name: 'content',
          data_type: 'VarChar',
          max_length: 65535
        },
        {
          name: 'type',
          data_type: 'VarChar',
          max_length: 64
        },
        {
          name: 'metadata',
          data_type: 'JSON'
        }
      ]
    });

    // 创建索引（HNSW，适合快速召回）
    await this.client.createIndex({
      collection_name: this.collectionName,
      field_name: 'embedding',
      index_type: 'HNSW',
      params: {
        M: 16,              // 节点连接数，12-48之间，越大越精确但越占内存
        efConstruction: 200 // 构建质量，越大构建越慢但索引越好
      }
    });
  }

  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.embeddingModel.embed(query);

    const results = await this.client.search({
      collection_name: this.collectionName,
      vector: queryEmbedding,
      limit,
      output_fields: ['id', 'content', 'type', 'metadata'],
      params: {
        ef: 128  // 搜索时的动态候选集，越大搜索越精确
      }
    });

    return results.results.map((hit: any) => ({
      id: hit.id,
      type: hit.type,
      content: hit.content,
      metadata: hit.metadata
    }));
  }
}
```

### Chroma：轻量嵌入式方案

**核心优势**：
- **零配置**：开箱即用，无需额外部署
- **LangChain原生**：最佳开发体验
- **本地优先**：数据完全存储在本地，隐私友好

**适用场景**：
- 原型开发和MVP阶段
- 个人项目和个人Agent（如OpenClaw）
- 数据量在百万级以下的场景

```typescript
// Chroma集成示例
import { ChromaClient } from 'chromadb';

class ChromaMemoryStore implements LongTermMemory {
  private client: ChromaClient;
  private collection: any;

  constructor(persistDirectory?: string) {
    this.client = new ChromaClient({
      path: persistDirectory || './chroma_data'
    });
  }

  async initialize(collectionName: string = 'agent_memory'): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: collectionName,
      metadata: { 'description': 'Agent Long-term Memory Store' }
    });
  }

  async store(input: {
    type: MemoryEntry['type'];
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
  }): Promise<MemoryEntry> {
    const embedding = await this.embeddingModel.embed(input.content);
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [input.content],
      metadatas: [{
        type: input.type,
        createdAt: Date.now(),
        ...input.metadata
      }]
    });

    return {
      id,
      type: input.type,
      content: input.content,
      embedding,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        accessCount: 0,
        lastAccessedAt: Date.now(),
        source: 'chroma',
        tags: [],
        confidence: 0.8,
        ...input.metadata
      }
    };
  }

  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.embeddingModel.embed(query);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: ['documents', 'metadatas', 'distances']
    });

    return results.ids[0].map((id: string, index: number) => ({
      id,
      type: results.metadatas[0][index].type,
      content: results.documents[0][index],
      metadata: results.metadatas[0][index],
      distance: results.distances[0][index]
    }));
  }
}
```

### 向量数据库选型决策树

```
开始选择
  │
  ├─→ 数据量 < 100万？
  │     │
  │     ├─ 是 → Chroma（免费、轻量、本地优先）
  │     │
  │     └─ 否 → 继续判断
  │
  ├─→ 需要自托管？
  │     │
  │     ├─ 是 → Milvus（支持十亿级、分布式）
  │     │
  │     └─ 否 → 继续判断
  │
  └─→ 企业级应用？预算充足？
          │
          ├─ 是 → Pinecone（零运维、强一致性）
          │
          └─ 否 → Milvus或Chroma
```

## 上下文窗口管理策略

### 上下文工程（Context Engineering）的崛起

在2025-2026年的AI Agent开发领域，一个重要的范式转变正在发生：从业界最初关注的"Prompt Engineering"转向"Context Engineering"。

**核心区别**：
- **Prompt Engineering**：专注于编写指令的技巧
- **Context Engineering**：专注于如何动态构建和管理上下文

这一转变的驱动因素是：随着AI应用从简单的单次交互发展到复杂的、有状态的智能体系统，优化静态指令已经无法满足需求。Agent的核心挑战从"说什么"变成"上下文里应该放什么"。

**上下文窗口的限制**：就像人类的工作记忆容量有限一样，LLM也有一个"注意力预算"。每个新token都会消耗这个预算，上下文越长，模型对早期信息的注意力就越分散。这被称为"上下文腐败（Context Rot）"。

**来源**：[Agent Design Patterns - Context Engineering](https://rlancemartin.github.io/2026/01/09/agent_design/)

### 分层上下文管理

```typescript
// 分层上下文管理器
class HierarchicalContextManager {
  private maxTokens: number;
  private embeddingModel: EmbeddingModel;

  // 各层优先级和权重配置
  private layerConfig: Record<string, { priority: number; maxRatio: number }> = {
    soul: { priority: 100, maxRatio: 0.15 },      // Soul配置，15%空间
    system: { priority: 90, maxRatio: 0.10 },     // 系统提示，10%空间
    memory: { priority: 70, maxRatio: 0.25 },    // 长期记忆，25%空间
    recent: { priority: 60, maxRatio: 0.30 },     // 最近对话，30%空间
    current: { priority: 80, maxRatio: 0.20 },    // 当前任务，20%空间
  };

  constructor(maxTokens: number, embeddingModel: EmbeddingModel) {
    this.maxTokens = maxTokens;
    this.embeddingModel = embeddingModel;
  }

  // 构建完整上下文
  async buildContext(request: AgentRequest): Promise<Context> {
    const context: Context = {
      sections: [],
      totalTokens: 0,
      truncated: false
    };

    // 1. Soul配置（最高优先级）
    const soulSection = await this.buildSoulSection(request.agentId);
    context.sections.push(soulSection);

    // 2. 当前任务（高优先级）
    const currentSection = this.buildCurrentTaskSection(request.task);
    context.sections.push(currentSection);

    // 3. 长期记忆检索
    const memorySection = await this.buildMemorySection(request.query);
    context.sections.push(memorySection);

    // 4. 最近对话
    const recentSection = await this.buildRecentSection(request.sessionId);
    context.sections.push(recentSection);

    // 5. 验证并压缩
    context.totalTokens = this.countTokens(context);
    if (context.totalTokens > this.maxTokens) {
      context.truncated = true;
      await this.compressContext(context);
    }

    return context;
  }

  // 构建Soul配置段
  private async buildSoulSection(agentId: string): Promise<ContextSection> {
    const soul = await this.loadSoul(agentId);
    const loader = new SoulLoader();
    const content = loader.generateSystemPrompt(soul);

    return {
      type: 'soul',
      content,
      tokens: this.countTokens(content),
      priority: 100
    };
  }

  // 构建当前任务段
  private buildCurrentTaskSection(task: Task): ContextSection {
    const content = `当前任务：${task.description}\n` +
      `任务类型：${task.type}\n` +
      `预期目标：${task.goal}`;

    return {
      type: 'current',
      content,
      tokens: this.countTokens(content),
      priority: 80
    };
  }

  // 构建记忆检索段
  private async buildMemorySection(query: string): Promise<ContextSection> {
    const memories = await this.memoryStore.search(query, { limit: 10 });
    const maxTokens = Math.floor(this.maxTokens * 0.25);

    let content = '相关记忆：\n';
    let usedTokens = 0;

    for (const memory of memories) {
      const memoryTokens = this.countTokens(memory.content);
      if (usedTokens + memoryTokens > maxTokens) {
        // 截断处理
        const remainingTokens = maxTokens - usedTokens;
        content += memory.content.slice(0, remainingTokens * 2) + '...\n';
        break;
      }
      content += `- ${memory.content}\n`;
      usedTokens += memoryTokens;
    }

    return {
      type: 'memory',
      content,
      tokens: this.countTokens(content),
      priority: 70
    };
  }

  // 智能压缩上下文
  private async compressContext(context: Context): Promise<void> {
    const targetTokens = Math.floor(this.maxTokens * 0.9); // 压缩到90%

    // 按优先级排序sections
    const sortedSections = [...context.sections].sort(
      (a, b) => b.priority - a.priority
    );

    let usedTokens = sortedSections.reduce((sum, s) => sum + s.tokens, 0);
    const compressed: ContextSection[] = [];

    for (const section of sortedSections) {
      const sectionRatio = section.tokens / usedTokens;
      const targetSectionTokens = Math.floor(targetTokens * sectionRatio);

      if (section.tokens <= targetSectionTokens) {
        compressed.push(section);
        usedTokens -= section.tokens;
      } else if (section.type === 'soul') {
        // Soul配置不能压缩，只允许截断
        const truncated = this.truncateSection(section, targetSectionTokens);
        compressed.push(truncated);
        usedTokens -= section.tokens;
      } else {
        // 其他section可以使用LLM压缩
        const compressedSection = await this.compressSection(section, targetSectionTokens);
        compressed.push(compressedSection);
        usedTokens -= section.tokens;
      }
    }

    // 按原始优先级顺序重组
    context.sections = compressed.sort((a, b) => b.priority - a.priority);
    context.totalTokens = context.sections.reduce((sum, s) => sum + s.tokens, 0);
  }

  // 使用LLM压缩section
  private async compressSection(
    section: ContextSection,
    targetTokens: number
  ): Promise<ContextSection> {
    const prompt = `请将以下内容压缩到约${targetTokens}个token，保留核心信息和关键细节：

${section.content}

压缩要求：
1. 保留关键人物、事件、数字
2. 保留因果关系和逻辑链
3. 删除重复表述和冗余修饰`;

    try {
      const response = await callLLM(prompt);
      const compressedContent = extractTextFromResponse(response);

      return {
        ...section,
        content: compressedContent,
        tokens: this.countTokens(compressedContent),
        compressed: true
      };
    } catch (error) {
      // 降级：直接截断
      return this.truncateSection(section, targetTokens);
    }
  }

  // Token计数
  private countTokens(text: string): number {
    // 简化实现：中文按字符计，英文按单词计
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return chineseChars + englishWords;
  }
}

// 上下文段
interface ContextSection {
  type: string;
  content: string;
  tokens: number;
  priority: number;
  compressed?: boolean;
}

// 完整上下文
interface Context {
  sections: ContextSection[];
  totalTokens: number;
  truncated: boolean;
}
```

### 上下文窗口管理最佳实践

**基于Anthropic官方建议的上下文工程原则**：

1. **将最重要的信息放在开头**：模型对开头的注意力最强，越靠后的信息越容易被忽略。

2. **使用清晰的结构标记**：使用XML标签、Markdown标题等标记来组织上下文，帮助模型理解信息结构。

3. **定期总结而非无限累积**：与其让对话历史无限增长，不如定期生成摘要，保留关键信息。

4. **分离关注点**：不同的信息类型（系统指令、用户偏好、任务上下文、工具结果）应该明确分离。

5. **显式检索而非隐式依赖**：不要假设模型会"记住"之前的对话内容，应该主动检索并注入相关记忆。

## 记忆压缩与遗忘机制

### 上下文腐败（Context Rot）与压缩策略

当Agent进行长时对话时，上下文窗口会逐渐被历史消息填满。研究表明，模型在长上下文中的性能会显著下降，这被称为"上下文腐败"现象。

**压缩触发条件**：
- 上下文使用率超过80%
- 对话轮次超过特定阈值（如50轮）
- 单次请求的输入token接近限制

**压缩策略层次**：

```typescript
// 多层次压缩策略管理器
class CompressionManager {
  private strategies: CompressionStrategy[];
  private currentStrategy: CompressionStrategy;

  constructor() {
    // 注册多种压缩策略
    this.strategies = [
      new SimpleTruncationStrategy(),      // 简单截断
      new SummaryStrategy(),               // 生成摘要
      new SelectiveRetentionStrategy(),     // 选择性保留
      new SemanticCompressionStrategy(),   // 语义压缩
    ];
    this.currentStrategy = this.strategies[0];
  }

  // 选择合适的压缩策略
  selectStrategy(context: Context, reason: CompressionReason): CompressionStrategy {
    switch (reason) {
      case 'token_limit':
        // 接近token限制，使用保守策略
        this.currentStrategy = this.strategies[0];
        break;

      case 'quality_degradation':
        // 检测到质量下降，使用摘要策略
        this.currentStrategy = this.strategies[1];
        break;

      case 'memory_pressure':
        // 内存压力，使用语义压缩
        this.currentStrategy = this.strategies[3];
        break;

      default:
        this.currentStrategy = this.strategies[2];
    }

    return this.currentStrategy;
  }

  // 执行压缩
  async compress(
    context: ConversationContext,
    targetTokens: number
  ): Promise<CompressedContext> {
    const reason = this.analyzeCompressionNeed(context);
    const strategy = this.selectStrategy(context, reason);

    return strategy.compress(context, targetTokens);
  }

  // 分析压缩需求
  private analyzeCompressionNeed(context: ConversationContext): CompressionReason {
    const usageRatio = context.usedTokens / context.maxTokens;
    const qualityScore = this.estimateQuality(context);

    if (usageRatio > 0.95) return 'token_limit';
    if (qualityScore < 0.7) return 'quality_degradation';
    if (usageRatio > 0.8) return 'memory_pressure';

    return 'routine';
  }

  // 估算对话质量
  private estimateQuality(context: ConversationContext): number {
    // 简单实现：基于最近的交互成功率估算
    const recentInteractions = context.messages.slice(-10);
    const successCount = recentInteractions.filter(m => m.successful).length;
    return successCount / recentInteractions.length;
  }
}

// 压缩策略接口
interface CompressionStrategy {
  compress(
    context: ConversationContext,
    targetTokens: number
  ): Promise<CompressedContext>;
}

// 选择性保留策略
class SelectiveRetentionStrategy implements CompressionStrategy {
  async compress(
    context: ConversationContext,
    targetTokens: number
  ): Promise<CompressedContext> {
    const messages = context.messages;
    const targetMessageCount = Math.floor(
      (targetTokens / this.avgTokensPerMessage) * 1.5
    );

    // 保留策略：系统消息 > 关键指令 > 最近对话 > 早期对话
    const prioritized: Message[] = [];
    const ignored: Message[] = [];

    for (const msg of messages) {
      if (msg.type === 'system' || msg.type === 'instruction') {
        prioritized.unshift(msg); // 插入到前面
      } else if (this.isRecent(msg, 10)) {
        prioritized.push(msg); // 最近的放后面
      } else if (this.isSignificant(msg)) {
        // 重要但较旧的：生成摘要后保留
        const summary = await this.summarize(msg);
        prioritized.push({ ...msg, content: summary, summarized: true });
      } else {
        ignored.push(msg);
      }

      if (prioritized.length >= targetMessageCount) break;
    }

    return {
      messages: prioritized,
      originalCount: messages.length,
      compressedCount: prioritized.length,
      ignoredMessages: ignored.length,
      method: 'selective_retention'
    };
  }

  private avgTokensPerMessage = 200; // 估算平均值

  private isRecent(msg: Message, threshold: number): boolean {
    const age = Date.now() - msg.timestamp;
    return age < threshold * 60 * 60 * 1000; // threshold小时
  }

  private isSignificant(msg: Message): boolean {
    // 简单判断：包含关键动作、决策或结果的对话
    const keywords = ['决定', '完成', '创建', '修改', '删除', '发现', '问题', '错误'];
    return keywords.some(k => msg.content.includes(k));
  }

  private async summarize(msg: Message): Promise<string> {
    const prompt = `将以下对话内容压缩为50字以内的摘要，保留关键信息和结论：

${msg.content}`;

    try {
      const response = await callLLM(prompt);
      return `[摘要] ${extractTextFromResponse(response)}`;
    } catch {
      return msg.content.slice(0, 200) + '...';
    }
  }
}

// 语义压缩策略
class SemanticCompressionStrategy implements CompressionStrategy {
  async compress(
    context: ConversationContext,
    targetTokens: number
  ): Promise<CompressedContext> {
    // 将对话按主题分段，每个主题生成一个摘要
    const topics = await this.segmentByTopics(context.messages);

    const compressed: Message[] = [];
    let usedTokens = 0;

    for (const topic of topics) {
      if (topic.tokens + usedTokens > targetTokens) {
        // 最后的主题截断
        compressed.push({
          ...topic.summary,
          content: topic.summary.content.slice(
            0,
            (targetTokens - usedTokens) * 2
          ) + '...'
        });
        break;
      }

      compressed.push(topic.summary);
      usedTokens += topic.tokens;
    }

    return {
      messages: compressed,
      originalCount: context.messages.length,
      compressedCount: compressed.length,
      method: 'semantic_compression',
      topicsCount: topics.length
    };
  }

  private async segmentByTopics(messages: Message[]): Promise<Topic[]> {
    // 使用LLM识别主题边界并生成摘要
    const prompt = `分析以下对话流，识别主题分段，并为每个分段生成摘要：

${messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n')}

请按以下JSON格式返回：
{
  "topics": [
    {
      "start": 0,
      "end": 10,
      "summary": "主题摘要...",
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}`;

    try {
      const response = await callLLM(prompt);
      return JSON.parse(extractTextFromResponse(response)).topics;
    } catch {
      // 降级：按时间简单分段
      return this.simpleSegmentation(messages);
    }
  }

  private simpleSegmentation(messages: Message[]): Topic[] {
    const segmentSize = 10;
    const topics: Topic[] = [];

    for (let i = 0; i < messages.length; i += segmentSize) {
      const segment = messages.slice(i, i + segmentSize);
      topics.push({
        start: i,
        end: Math.min(i + segmentSize, messages.length),
        summary: {
          role: 'system',
          content: `[对话段${topics.length + 1}] ${segment.length}条消息`,
          timestamp: segment[0].timestamp
        },
        keywords: []
      });
    }

    return topics;
  }
}

interface Topic {
  start: number;
  end: number;
  summary: Message;
  keywords: string[];
}
```

### 自适应遗忘机制

遗忘是智能系统的必要功能——不是为了"删除"，而是为了管理信息的生命周期：

```typescript
// 自适应遗忘管理器
class AdaptiveForgettingManager {
  private policy: ForgettingPolicy;
  private memory: LongTermMemory;

  constructor(memory: LongTermMemory, policy?: Partial<ForgettingPolicy>) {
    this.policy = {
      baseRetentionDays: 30,         // 基础保留30天
      accessFrequencyBoost: 0.1,     // 每次访问增加10%寿命
      minConfidence: 0.3,            // 低于此置信度直接删除
      retentionScoreThreshold: 0.2,  // 保留分数阈值
      checkIntervalHours: 24,        // 每24小时检查一次
      importanceBoost: {
        preference: 2.0,    // 偏好信息寿命翻倍
        knowledge: 1.5,    // 知识信息寿命+50%
        experience: 1.0,   // 经验信息正常寿命
        fact: 0.5          // 事实信息寿命减半
      },
      ...policy
    };

    this.memory = memory;
    this.startPeriodicCheck();
  }

  // 计算单条记忆的动态保留期
  calculateRetentionPeriod(entry: MemoryEntry): number {
    const baseMs = this.policy.baseRetentionDays * 24 * 60 * 60 * 1000;

    // 访问频率加成
    const accessBoost = Math.min(
      entry.metadata.accessCount * this.policy.accessFrequencyBoost,
      1.0 // 最多加成100%
    );

    // 重要性加成
    const importanceBoost = this.policy.importanceBoost[entry.type] || 1.0;

    // 置信度调整
    const confidenceMultiplier = entry.metadata.confidence;

    return baseMs * (1 + accessBoost) * importanceBoost * confidenceMultiplier;
  }

  // 计算保留分数
  calculateRetentionScore(entry: MemoryEntry): number {
    const age = Date.now() - entry.metadata.createdAt;
    const retentionPeriod = this.calculateRetentionPeriod(entry);

    // 年龄分数：越老越低
    const ageScore = Math.max(0, 1 - age / retentionPeriod);

    // 访问频率分数：越常访问越高
    const accessScore = Math.min(1, entry.metadata.accessCount / 10);

    // 置信度分数
    const confidenceScore = entry.metadata.confidence;

    // 重要性分数
    const importanceMultiplier = this.policy.importanceBoost[entry.type] || 1.0;

    return (
      ageScore * 0.3 +
      accessScore * 0.3 +
      confidenceScore * 0.2 +
      importanceMultiplier * 0.2
    );
  }

  // 执行遗忘检查
  async performForgettingCycle(): Promise<ForgettingResult> {
    const stats = await this.memory.getStats();
    const entries = await this.memory.search('', { limit: stats.totalCount });

    const decisions: ForgettingDecision[] = [];
    let processed = 0;

    for (const entry of entries) {
      processed++;
      const score = this.calculateRetentionScore(entry);

      if (entry.metadata.confidence < this.policy.minConfidence) {
        decisions.push({
          entryId: entry.id,
          action: 'delete',
          reason: 'confidence_too_low',
          score
        });
      } else if (score < this.policy.retentionScoreThreshold) {
        decisions.push({
          entryId: entry.id,
          action: 'archive',
          reason: 'retention_score_low',
          score
        });
      } else if (this.shouldCompress(entry)) {
        decisions.push({
          entryId: entry.id,
          action: 'compress',
          reason: 'storage_optimization',
          score
        });
      }
    }

    // 执行遗忘操作
    const results = await this.executeDecisions(decisions);

    return {
      processed,
      decisions,
      results,
      timestamp: Date.now()
    };
  }

  // 判断是否需要压缩
  private shouldCompress(entry: MemoryEntry): boolean {
    // 内容过长且访问频率低
    const contentLength = entry.content.length;
    const accessFrequency = entry.metadata.accessCount;

    return contentLength > 5000 && accessFrequency < 3;
  }

  // 执行遗忘决策
  private async executeDecisions(decisions: ForgettingDecision[]): Promise<ForgettingResults> {
    const results: ForgettingResults = { deleted: 0, archived: 0, compressed: 0 };

    for (const decision of decisions) {
      switch (decision.action) {
        case 'delete':
          await this.memory.delete(decision.entryId);
          results.deleted++;
          break;

        case 'archive':
          await this.archiveEntry(decision.entryId);
          results.archived++;
          break;

        case 'compress':
          await this.compressEntry(decision.entryId);
          results.compressed++;
          break;
      }
    }

    return results;
  }

  // 归档条目到冷存储
  private async archiveEntry(entryId: string): Promise<void> {
    const entry = await this.memory.get(entryId);
    if (entry) {
      // 移动到归档存储
      await this.archiveStore.store(entry);
      await this.memory.delete(entryId);
    }
  }

  // 压缩条目内容
  private async compressEntry(entryId: string): Promise<void> {
    const entry = await this.memory.get(entryId);
    if (entry) {
      const summary = await this.summarizeContent(entry.content);
      await this.memory.update(entryId, {
        content: summary,
        metadata: {
          ...entry.metadata,
          compressed: true,
          originalLength: entry.content.length
        }
      });
    }
  }

  private async summarizeContent(content: string): Promise<string> {
    const prompt = `将以下内容压缩为500字以内的摘要，保留核心信息和关键细节：

${content}`;

    try {
      const response = await callLLM(prompt);
      return `[压缩摘要] ${extractTextFromResponse(response)}`;
    } catch {
      return content.slice(0, 1000) + '...';
    }
  }

  private startPeriodicCheck(): void {
    const interval = this.policy.checkIntervalHours * 60 * 60 * 1000;
    setInterval(() => this.performForgettingCycle(), interval);
  }
}

// 遗忘策略配置
interface ForgettingPolicy {
  baseRetentionDays: number;
  accessFrequencyBoost: number;
  minConfidence: number;
  retentionScoreThreshold: number;
  checkIntervalHours: number;
  importanceBoost: Record<string, number>;
}

// 遗忘决策
interface ForgettingDecision {
  entryId: string;
  action: 'delete' | 'archive' | 'compress';
  reason: string;
  score: number;
}

// 遗忘结果
interface ForgettingResult {
  processed: number;
  decisions: ForgettingDecision[];
  results: ForgettingResults;
  timestamp: number;
}

interface ForgettingResults {
  deleted: number;
  archived: number;
  compressed: number;
}
```

### 记忆巩固：从短期到长期的转化

记忆巩固是连接工作记忆和长期记忆的关键桥梁：

```typescript
// 记忆巩固管理器
class MemoryConsolidationManager {
  private shortTerm: ShortTermMemory;
  private workingMemory: WorkingMemoryManager;
  private longTerm: LongTermMemory;
  private consolidationPolicy: ConsolidationPolicy;

  constructor(
    shortTerm: ShortTermMemory,
    workingMemory: WorkingMemoryManager,
    longTerm: LongTermMemory,
    policy?: Partial<ConsolidationPolicy>
  ) {
    this.shortTerm = shortTerm;
    this.workingMemory = workingMemory;
    this.longTerm = longTerm;

    this.consolidationPolicy = {
      triggerThreshold: 10,           // 10条以上短期记忆时触发
      importanceThreshold: 0.7,       // 重要性高于0.7才巩固
      maxConsolidationsPerCycle: 50, // 每周期最多巩固50条
      deduplicationThreshold: 0.8,   // 相似度超过0.8视为重复
      ...policy
    };
  }

  // 评估巩固价值
  async evaluateConsolidationValue(item: ShortTermItem): Promise<ConsolidationValue> {
    const factors: ConsolidationFactor[] = [];

    // 1. 内容独特性
    const uniqueness = await this.checkUniqueness(item.content);
    factors.push({ name: 'uniqueness', value: uniqueness, weight: 0.3 });

    // 2. 任务关联性
    const taskRelevance = this.assessTaskRelevance(item);
    factors.push({ name: 'task_relevance', value: taskRelevance, weight: 0.3 });

    // 3. 用户显式指示
    const explicitIndicator = this.hasExplicitSaveIndicator(item);
    factors.push({ name: 'explicit_indicator', value: explicitIndicator, weight: 0.2 });

    // 4. 信息完整性
    const completeness = this.assessCompleteness(item);
    factors.push({ name: 'completeness', value: completeness, weight: 0.2 });

    const totalScore = factors.reduce(
      (sum, f) => sum + f.value * f.weight,
      0
    );

    return {
      score: totalScore,
      factors,
      shouldConsolidate: totalScore >= this.consolidationPolicy.importanceThreshold,
      recommendedType: this.determineMemoryType(item)
    };
  }

  // 执行巩固循环
  async runConsolidationCycle(): Promise<ConsolidationResult> {
    const candidates = this.shortTerm.getRecent(
      this.consolidationPolicy.maxConsolidationsPerCycle * 2
    );

    const results: ConsolidationResult = {
      evaluated: 0,
      consolidated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    let consolidated = 0;

    for (const candidate of candidates) {
      if (consolidated >= this.consolidationPolicy.maxConsolidationsPerCycle) {
        break;
      }

      results.evaluated++;

      try {
        const value = await this.evaluateConsolidationValue(candidate.value);

        if (value.shouldConsolidate) {
          // 检查是否重复
          const isDuplicate = await this.checkDuplicate(value);
          if (isDuplicate) {
            results.skipped++;
            results.details.push({
              id: candidate.key,
              action: 'skipped',
              reason: 'duplicate'
            });
            continue;
          }

          // 执行巩固
          await this.consolidateItem(candidate, value);
          consolidated++;
          results.consolidated++;

          results.details.push({
            id: candidate.key,
            action: 'consolidated',
            reason: value.recommendedType,
            score: value.score
          });
        } else {
          results.skipped++;
          results.details.push({
            id: candidate.key,
            action: 'skipped',
            reason: `score_too_low:${value.score.toFixed(2)}`
          });
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          id: candidate.key,
          action: 'error',
          reason: String(error)
        });
      }
    }

    return results;
  }

  // 巩固单个条目
  private async consolidateItem(
    item: ShortTermItem,
    value: ConsolidationValue
  ): Promise<void> {
    const content = this.extractKeyContent(item.value);

    await this.longTerm.store({
      type: value.recommendedType,
      content,
      metadata: {
        source: 'consolidation',
        originalTimestamp: item.value.timestamp,
        consolidationScore: value.score,
        tags: this.extractTags(content)
      }
    });

    // 从短期记忆中标记为已巩固
    this.shortTerm.markAsConsolidated(item.key);
  }

  // 检查内容唯一性
  private async checkUniqueness(content: string): Promise<number> {
    const similar = await this.longTerm.search(content, { limit: 5 });

    if (similar.length === 0) return 1.0;

    const maxSimilarity = Math.max(
      ...similar.map(s => this.calculateSimilarity(content, s.content))
    );

    return 1 - maxSimilarity;
  }

  // 简单字符串相似度
  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // 提取关键内容
  private extractKeyContent(value: any): string {
    if (typeof value === 'string') return value;
    if (value.content) return value.content;
    if (value.result) return JSON.stringify(value.result);
    return JSON.stringify(value).slice(0, 5000);
  }

  // 确定记忆类型
  private determineMemoryType(item: ShortTermItem): MemoryEntry['type'] {
    const content = this.extractKeyContent(item.value);

    if (content.includes('偏好') || content.includes('喜欢') || content.includes('不喜欢')) {
      return 'preference';
    }
    if (content.includes('知识') || content.includes('概念') || content.includes('定义')) {
      return 'knowledge';
    }
    if (content.includes('任务') || content.includes('项目') || content.includes('工作')) {
      return 'experience';
    }

    return 'fact';
  }

  // 提取标签
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const patterns = [
      /#(\w+)/g,           // Markdown标签
      /\[([^\]]+)\]/g,     // 方括号内容
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        tags.push(...matches.map(m => m.slice(1, -1)));
      }
    }

    return [...new Set(tags)].slice(0, 10);
  }

  // 检查任务关联性
  private assessTaskRelevance(item: ShortTermItem): number {
    const currentTask = this.workingMemory.getCurrentTask();
    if (!currentTask) return 0.5;

    const taskKeywords = this.extractKeywords(currentTask.description);
    const itemKeywords = this.extractKeywords(this.extractKeyContent(item.value));

    const overlap = taskKeywords.filter(k => itemKeywords.includes(k)).length;
    const union = new Set([...taskKeywords, ...itemKeywords]).size;

    return union > 0 ? overlap / union : 0;
  }

  // 检查显式保存指示
  private hasExplicitSaveIndicator(item: ShortTermItem): number {
    const content = this.extractKeyContent(item.value);
    const indicators = ['记住', '保存', '存储', '重要', '以后用到'];

    const found = indicators.filter(i => content.includes(i)).length;
    return Math.min(1, found * 0.3);
  }

  // 评估内容完整性
  private assessCompleteness(item: ShortTermItem): number {
    const content = this.extractKeyContent(item.value);

    // 有结论
    if (content.includes('结论') || content.includes('所以') || content.includes('总结')) {
      return 0.9;
    }

    // 有过程无结论
    if (content.length > 500) {
      return 0.6;
    }

    // 简短片段
    return 0.3;
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人',
      '都', '一', '上', '也', '很', '到', '说', '要', '去', '你'
    ]);

    return text
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w))
      .slice(0, 20);
  }
}

// 巩固策略配置
interface ConsolidationPolicy {
  triggerThreshold: number;
  importanceThreshold: number;
  maxConsolidationsPerCycle: number;
  deduplicationThreshold: number;
}

// 巩固价值评估
interface ConsolidationValue {
  score: number;
  factors: ConsolidationFactor[];
  shouldConsolidate: boolean;
  recommendedType: MemoryEntry['type'];
}

interface ConsolidationFactor {
  name: string;
  value: number;
  weight: number;
}

// 巩固结果
interface ConsolidationResult {
  evaluated: number;
  consolidated: number;
  skipped: number;
  errors: number;
  details: Array<{
    id: string;
    action: string;
    reason: string;
    score?: number;
  }>;
}
```

## 总结

Agent的Memory系统是实现真正智能的关键基础设施。通过对OpenClaw soul.md的深度解析，我们看到了从"配置"到"灵魂"的范式转变；通过对Pinecone、Milvus、Chroma的对比，我们理解了不同场景下的向量数据库选型策略；通过上下文窗口管理策略，我们掌握了如何对抗"上下文腐败"；通过记忆压缩与遗忘机制，我们建立了信息的生命周期管理能力。

配合向量检索、智能压缩和自适应遗忘机制，构建了一个高效、可持续演进的记忆系统，为AI Agent提供了持续学习和个性化服务的能力。

**来源汇总**：
- [CSDN - OpenClaw soul.md深度研究](https://blog.csdn.net/weixin_36829761/article/details/158207761)
- [腾讯新闻 - Meta删邮件事故背后：OpenClaw为什么会"失忆"](https://new.qq.com/rain/a/20260316A07AJE00)
- [CSDN - 基于MEMORY.md的Agent任务栈架构实践](https://blog.csdn.net/wang_walfred/article/details/158317889)
- [CSDN - 向量数据库选型指南](https://blog.csdn.net/zengzizi/article/details/146003305)
- [CSDN - Milvus向量数据库索引参数优化](https://blog.csdn.net/m0_70647377/article/details/147811909)
- [Agent Design Patterns](https://rlancemartin.github.io/2026/01/09/agent_design/)
- [What If Your AI Never Forgot? The Claude 4 Memory Experiment](https://www.gptfrontier.com/what-if-your-ai-never-forgot-the-claude-4-memory-experiment/)
- [Claude-Mem](https://claude-mem.ai/)

## 完整Memory系统集成

### Agent Memory Manager

```typescript
// Agent记忆管理器 - 整合三层记忆
class AgentMemoryManager {
  private shortTerm: ShortTermMemoryManager;
  private workingMemory: WorkingMemoryManager;
  private longTerm: VectorLongTermMemory;
  private search: HybridMemorySearch;
  private forgetting: MemoryForgettingManager;
  private consolidation: MemoryConsolidation;
  private soul: SoulConfig | null = null;

  constructor(options: {
    shortTermTtl?: number;
    maxWorkingSteps?: number;
    embeddingModel: EmbeddingModel;
  }) {
    // 初始化各层记忆
    this.shortTerm = new ShortTermMemoryManager(options.shortTermTtl);
    this.workingMemory = new WorkingMemoryManager(options.maxWorkingSteps);
    this.longTerm = new VectorLongTermMemory(options.embeddingModel);
    this.search = new HybridMemorySearch(this.longTerm);
    this.forgetting = new MemoryForgettingManager(this.longTerm);
    this.consolidation = new MemoryConsolidation(
      this.shortTerm,
      this.longTerm,
      options.embeddingModel
    );
  }

  // 加载Soul配置
  async loadSoul(soulPath: string): Promise<void> {
    const loader = new SoulLoader(soulPath);
    this.soul = await loader.load();
  }

  // 获取当前完整上下文
  async getFullContext(query: string): Promise<string> {
    const parts: string[] = [];

    // 1. Soul系统提示
    if (this.soul) {
      const loader = new SoulLoader();
      parts.push(loader.generateSystemPrompt(this.soul));
    }

    // 2. 长期记忆检索
    const relevantMemories = await this.search.search(query, { limit: 5 });
    if (relevantMemories.length > 0) {
      parts.push('\n相关记忆：');
      for (const result of relevantMemories) {
        parts.push(`- ${result.entry.content}`);
      }
    }

    // 3. 工作记忆上下文
    parts.push('\n当前任务状态：');
    parts.push(this.workingMemory.getContext());

    // 4. 短期记忆（最近交互）
    const recentShort = this.shortTerm.getRecent(5);
    if (recentShort.length > 0) {
      parts.push('\n最近操作：');
      for (const item of recentShort) {
        parts.push(`- ${item.key}: ${JSON.stringify(item.value)}`);
      }
    }

    return parts.join('\n');
  }

  // 记录新交互
  async recordInteraction(interaction: {
    type: 'task' | 'query' | 'feedback';
    content: string;
    result?: any;
  }): Promise<void> {
    // 1. 存入短期记忆
    this.shortTerm.set(
      `interaction_${Date.now()}`,
      { ...interaction, timestamp: Date.now() },
      60000 // 1分钟TTL
    );

    // 2. 存入长期记忆（如果是重要交互）
    if (interaction.type === 'task' || interaction.result) {
      await this.longTerm.store({
        type: interaction.type === 'task' ? 'experience' : 'knowledge',
        content: JSON.stringify(interaction),
        metadata: {
          source: 'interaction_record',
        },
      });
    }
  }

  // 获取记忆统计
  async getMemoryStats(): Promise<{
    shortTerm: number;
    longTerm: LongTermMemory['getStats'] extends () => Promise<infer T> ? T : never;
  }> {
    return {
      shortTerm: this.shortTerm.getRecent(1000).length,
      longTerm: await this.longTerm.getStats(),
    };
  }
}
```

## 总结

Agent的Memory系统是实现真正智能的关键基础设施，通过多层次的架构设计实现了：

- **三层记忆架构**：短期记忆（快速、易失的即时缓存）、工作记忆（任务执行中的动态上下文）、长期记忆（持久、可检索的知识存储）
- **OpenClaw soul.md设计哲学**：从"配置"到"灵魂"的范式转变，文件驱动的透明性设计
- **向量检索方案对比**：Pinecone（企业级云原生）、Milvus（超大规模自托管）、Chroma（轻量嵌入式）
- **上下文窗口管理策略**：分层上下文、智能压缩、对抗"上下文腐败"
- **记忆压缩与遗忘机制**：自适应遗忘策略、记忆巩固循环、生命周期管理

**核心技术要点**：

| 技术领域 | 核心实现 |
|---------|---------|
| **三层记忆** | ShortTermMemory（TTL）→ WorkingMemory（任务状态）→ LongTermMemory（向量存储） |
| **Soul.md** | Markdown格式身份定义，不受压缩影响，持久有效 |
| **向量检索** | Pinecone/Milvus/Chroma对比选型，HNSW/IVF索引优化 |
| **上下文工程** | 分层管理（soul > current > memory > recent），智能压缩 |
| **遗忘机制** | 保留分数计算、自适应阈值、归档/压缩/删除三档处理 |
| **记忆巩固** | 价值评估、去重检测、类型自动分类 |

**安全实践**：重要指令必须写入文件而非对话中；AGENTS.md中强制"行动前检索记忆"；定期检查记忆刷新配置。

**来源汇总**：
- [CSDN - OpenClaw soul.md深度研究](https://blog.csdn.net/weixin_36829761/article/details/158207761)
- [腾讯新闻 - Meta删邮件事故背后：OpenClaw为什么会"失忆"](https://new.qq.com/rain/a/20260316A07AJE00)
- [CSDN - 基于MEMORY.md的Agent任务栈架构实践](https://blog.csdn.net/wang_walfred/article/details/158317889)
- [CSDN - 向量数据库选型指南](https://blog.csdn.net/zengzizi/article/details/146003305)
- [CSDN - Milvus向量数据库索引参数优化](https://blog.csdn.net/m0_70647377/article/details/147811909)
- [Agent Design Patterns](https://rlancemartin.github.io/2026/01/09/agent_design/)
- [What If Your AI Never Forgot? The Claude 4 Memory Experiment](https://www.gptfrontier.com/what-if-your-ai-never-forgot-the-claude-4-memory-experiment/)
- [Claude-Mem](https://claude-mem.ai/)
