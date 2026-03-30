# ReAct框架与任务规划

## 概述

ReAct（Reasoning + Acting）是一种将推理和行动相结合的AI Agent框架。它让模型能够交替进行"思考"和"执行"，从而解决需要多步骤推理和工具使用的复杂问题。

## ReAct 原理：推理 + 行动

### 1. 核心思想

传统的纯推理方法（如CoT）只生成文本思考，而ReAct在此基础上增加了**行动能力**，使Agent能够：

- 思考：分析当前状态，决定下一步行动
- 行动：调用工具，执行实际操作
- 观察：获取行动结果，更新理解
- 循环：重复直到任务完成

```
┌─────────────┐     思考      ┌─────────────┐
│   思考      │◄──────────────│   当前状态   │
│   (Reason)  │               │   (State)   │
└──────┬──────┘               └─────────────┘
       │                              ▲
       │ 行动                          │
       ▼ (Act)                        │
┌─────────────┐     观察      ┌─────────────┐
│   工具调用  │──────────────│   执行结果   │
│   (Action) │               │  (Result)   │
└─────────────┘               └─────────────┘
```

### 2. ReAct循环

```typescript
// ReAct执行循环
interface ReActState {
  task: string;                 // 原始任务
  thought: string;              // 当前思考
  action: string;               // 当前行动
  observations: string[];       // 观察结果
  history: Array<{               // 执行历史
    thought: string;
    action: string;
    observation: string;
  }>;
}

class ReActAgent {
  maxIterations: number = 10;

  async run(task: string): Promise<string> {
    const state: ReActState = {
      task,
      thought: '',
      action: '',
      observations: [],
      history: []
    };

    for (let i = 0; i < this.maxIterations; i++) {
      // 1. 思考阶段
      state.thought = await this.reason(task, state);

      // 2. 检查是否完成
      if (this.isComplete(state.thought)) {
        return this.extractAnswer(state.thought);
      }

      // 3. 选择行动
      state.action = await this.selectAction(state);

      // 4. 执行行动
      const observation = await this.executeAction(state.action);
      state.observations.push(observation);

      // 5. 记录历史
      state.history.push({
        thought: state.thought,
        action: state.action,
        observation
      });

      // 6. 检查是否超时
      if (this.isFinished(state)) {
        break;
      }
    }

    return this.extractFinalAnswer(state);
  }
}
```

### 3. Prompt模板

ReAct使用特定的Prompt模板来引导模型生成结构化的思考-行动-观察序列：

```typescript
// ReAct Prompt模板
const reactPromptTemplate = `请通过思考-行动-观察循环完成任务。

任务: ${task}

请按以下格式回答:

思考: 你对当前情况的分析，要做什么，为什么
行动: ${toolNames.join(' | ')}格式: action_name({"param": "value"})
观察: 行动的结果

开始!

思考:`;

// 包含工具描述的完整模板
const reactPromptWithTools = `你是一个任务规划助手，可以通过以下工具完成任务:

## 可用工具
${toolDescriptions}

## 任务
${task}

## 输出格式
请严格按以下格式输出:

思考: [你的分析]
行动: [选择一个工具，格式: tool_name({"param": "value"})]
观察: [结果]

如果任务完成:
思考: [总结答案]
最终答案: [简洁答案]

## 历史记录
${history.map(h => `${h.thought}\n行动: ${h.action}\n观察: ${h.observation}`).join('\n\n')}

当前状态: ${currentObservation}

思考:`;
```

## 任务分解与子目标生成

### 1. 任务分解策略

对于复杂任务，ReAct首先进行任务分解：

```typescript
// 任务分解接口
interface TaskDecomposer {
  decompose(task: string): Promise<SubTask[]>;
}

interface SubTask {
  id: string;
  description: string;
  dependencies: string[];  // 依赖的其他子任务
  status: 'pending' | 'in_progress' | 'completed';
  result?: unknown;
}

// 任务分解实现
class LLMTaskDecomposer implements TaskDecomposer {
  async decompose(task: string): Promise<SubTask[]> {
    const prompt = `将以下任务分解为可执行的子任务。

任务: ${task}

请列出子任务，标注依赖关系。格式:
1. [任务描述] (依赖: 无)
2. [任务描述] (依赖: 1)

输出:`;

    const response = await this.llm.complete(prompt);
    return this.parseSubTasks(response);
  }
}
```

### 2. 分层任务规划

复杂任务采用分层规划策略：

```
┌─────────────────────────────────────────┐
│           顶层规划 (L0)                  │
│    目标: 构建一个博客系统                │
│    子目标: 前端、后端、数据库            │
└──────────────────┬──────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ L1规划  │   │ L1规划  │   │ L1规划  │
│ 前端    │   │ 后端    │   │ 数据库  │
│ 页面    │   │ API    │   │ Schema │
│ 组件    │   │ 路由    │   │ 迁移   │
└─────────┘   └─────────┘   └─────────┘
```

### 3. 子目标执行

```typescript
// 子目标执行器
class SubGoalExecutor {
  async executeSubGoal(
    subGoal: SubTask,
    context: ExecutionContext
  ): Promise<Result> {
    // 检查依赖是否满足
    for (const depId of subGoal.dependencies) {
      const depResult = context.getResult(depId);
      if (!depResult) {
        throw new Error(`依赖未满足: ${depId}`);
      }
    }

    // 使用ReAct循环执行子目标
    const agent = new ReActAgent({
      tools: this.getToolsForSubGoal(subGoal)
    });

    return await agent.run(subGoal.description);
  }
}

// 执行所有子目标
async function executeAllSubGoals(
  subGoals: SubTask[],
  executor: SubGoalExecutor
): Promise<Map<string, Result>> {
  const results = new Map();

  // 按依赖顺序排序
  const sorted = topologicalSort(subGoals);

  for (const subGoal of sorted) {
    console.log(`执行子任务: ${subGoal.description}`);
    const result = await executor.executeSubGoal(subGoal, {
      getResult: (id) => results.get(id)
    });
    results.set(subGoal.id, result);
  }

  return results;
}
```

### 4. 动态重规划

当执行过程中遇到意外情况时，需要动态调整计划：

```typescript
// 动态重规划机制
class DynamicRePlanner {
  async replan(
    originalPlan: Plan,
    unexpectedEvent: Event,
    executionState: State
  ): Promise<Plan> {
    const prompt = `原计划:
${originalPlan.describe()}

执行状态:
${executionState.describe()}

遇到意外事件:
${unexpectedEvent.describe()}

请分析原因并提出新的执行计划:`;

    const newPlan = await this.llm.complete(prompt);

    // 验证新计划
    if (!this.validatePlan(newPlan)) {
      throw new Error('重规划失败');
    }

    return newPlan;
  }
}
```

## 实战示例

### 示例1：代码调试Agent

```typescript
// ReAct代码调试Agent
const debugAgentPrompt = `你是一个代码调试专家。

任务: 找到并修复以下代码中的bug

代码:
\`\`\`
function findMissingNumber(nums) {
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;
  let actualSum = 0;

  for (let i = 0; i <= n; i++) {
    actualSum += nums[i];
  }

  return expectedSum - actualSum;
}
\`\`\`

已知输入: [3, 0, 1]，期望输出: 2

请通过思考-行动-观察循环调试。

思考:`;

// 完整ReAct循环示例
async function debugCode(code: string, testCase: string) {
  const expected = extractExpected(testCase);
  let state = {
    thought: '',
    action: '',
    observation: ''
  };

  for (let step = 0; step < 5; step++) {
    // 思考
    state.thought = await llm.complete(`
      任务: 调试代码
      代码: ${code}
      测试用例: ${testCase}, 期望: ${expected}
      历史: ${JSON.stringify(state)}

      分析可能的问题:
    `);

    console.log(`步骤${step + 1} - 思考:`, state.thought);

    // 检查是否找到答案
    if (state.thought.includes('答案:')) {
      return extractAnswer(state.thought);
    }

    // 选择行动
    state.action = await selectTool(state.thought);
    console.log(`步骤${step + 1} - 行动:`, state.action);

    // 执行
    state.observation = await executeTool(state.action, {
      code,
      testCase
    });
    console.log(`步骤${step + 1} - 观察:`, state.observation);
  }
}

// 工具选择
async function selectTool(thought: string): Promise<string> {
  if (thought.includes('运行代码')) {
    return 'execute({"code": "...", "input": "..."})';
  }
  if (thought.includes('分析')) {
    return 'analyze({"code": "..."})';
  }
  if (thought.includes('修改')) {
    return 'modify({"code": "...", "fix": "..."})';
  }
  return 'done({"answer": "..."})';
}
```

### 示例2：研究任务Agent

```typescript
// ReAct研究Agent
class ResearchAgent {
  tools = {
    webSearch: async (query: string) => { /* 搜索 */ },
    readPage: async (url: string) => { /* 读取页面 */ },
    summarize: async (text: string) => { /* 总结 */ },
    storeNote: async (note: string) => { /* 存储笔记 */ }
  };

  async research(topic: string) {
    const notes: string[] = [];

    // 步骤1: 搜索相关论文
    let thought = await this.reasonAbout(topic);

    // ReAct循环
    for (let i = 0; i < 10; i++) {
      const action = await this.decideAction(thought, notes);

      if (action.type === 'search') {
        const results = await this.tools.webSearch(action.query);
        thought = `搜索到${results.length}篇论文，关键论文: ${results[0].title}`;
      }
      else if (action.type === 'read') {
        const content = await this.tools.readPage(action.url);
        thought = `已阅读${action.url}，核心发现: ${await this.tools.summarize(content)}`;
      }
      else if (action.type === 'note') {
        notes.push(action.content);
        thought = `已记录笔记，当前共${notes.length}条`;
      }
      else if (action.type === 'done') {
        return this.synthesizeResults(notes);
      }

      await this.tools.storeNote(thought);
    }

    return this.synthesizeResults(notes);
  }
}
```

### 示例3：自动化测试生成

```typescript
// ReAct测试生成Agent
async function generateTests(code: string, spec: string) {
  let testCode = '';
  let state = '';

  for (let iteration = 0; iteration < 5; iteration++) {
    // 思考
    const thought = await llm.complete(`
      目标: 为以下代码生成测试

      代码:
      ${code}

      规格说明:
      ${spec}

      当前测试代码:
      ${testCode}

      分析需要添加什么测试:
    `);

    // 如果测试完整则结束
    if (thought.includes('测试完成')) {
      break;
    }

    // 执行代码生成
    const newCode = await generateTestCode(thought, code, testCode);
    testCode = newCode;

    // 运行测试验证
    const result = await runTests(testCode);

    if (result.fails > 0) {
      state = `测试运行失败: ${result.errors.join(', ')}`;
    } else {
      state = `测试通过，覆盖率: ${result.coverage}%`;
    }
  }

  return testCode;
}
```

## ReAct 与其他框架对比

| 框架 | 特点 | 适用场景 |
|------|------|---------|
| ReAct | 推理+行动交替 | 需要工具使用的任务 |
| CoT | 仅推理 | 数学、逻辑问题 |
| ToT (Tree-of-Thought) | 多路径探索 | 需要回溯的复杂问题 |
| Plan-and-Execute | 先规划后执行 | 长期任务 |
| HuggingGPT | 任务规划+模型调度 | 多模态任务 |

## ReAct 最佳实践

### 1. 迭代限制

```typescript
// 设置合理的迭代限制
const config = {
  maxIterations: 10,     // 防止无限循环
  timeoutMs: 30000,      // 单次操作超时
  earlyStop: (state) => { // 提前停止条件
    return state.observations.length >= 3 &&
           state.observations.every(o => o.includes('成功'));
  }
};
```

### 2. 记忆管理

```typescript
// 压缩历史记录
function compressHistory(history: HistoryItem[], maxLength: number): HistoryItem[] {
  if (history.length <= maxLength) return history;

  // 保留最近的记忆
  const recent = history.slice(-maxLength);

  // 压缩早期记忆
  const compressed = compress(recent);

  return [...compressed];
}
```

### 3. 错误恢复

```typescript
// 错误恢复策略
async function executeWithRetry(
  action: string,
  maxRetries: number = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await execute(action);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`执行失败，重试 ${i + 1}/${maxRetries}`);
    }
  }
  throw new Error('最大重试次数');
}
```

## 总结

ReAct框架的核心价值在于：

1. **交替推理** - 通过思考明确当前状态和目标
2. **工具行动** - 实际执行操作获取结果
3. **观察反馈** - 基于结果更新理解
4. **循环迭代** - 持续改进直到任务完成

ReAct特别适合需要**多步骤推理**和**工具使用**的复杂任务，是现代Agent系统的基础架构之一。
