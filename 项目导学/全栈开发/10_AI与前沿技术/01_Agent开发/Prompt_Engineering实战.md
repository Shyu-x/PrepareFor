# Prompt Engineering实战

## 一、Prompt核心模块

Prompt（提示词）是与大语言模型交互的核心接口。一个设计良好的Prompt由四个核心模块组成。

### 1.1 Prompt结构解剖

```typescript
/**
 * Prompt模块结构定义
 *
 * 组成元素：
 * 1. System Prompt - 角色定义和行为约束
 * 2. Context - 任务相关的背景信息
 * 3. Examples -Few-shot示例
 * 4. User Input - 用户的具体问题
 * 5. Output Format - 期望的输出格式
 */

/**
 * 完整的Prompt模板接口
 */
interface PromptTemplate {
  // 系统提示：定义AI的角色、能力和行为规范
  systemPrompt: SystemPrompt;

  // 上下文信息：为任务提供必要的背景
  context: Context[];

  // 示例库：Few-shot学习的示例
  examples: Example[];

  // 用户输入：具体的问题或任务
  userInput: string;

  // 输出格式：期望的输出结构
  outputFormat?: OutputFormat;
}

/**
 * 系统提示配置
 */
interface SystemPrompt {
  // 角色定义：AI应该扮演什么角色
  role: string;

  // 能力描述：AI具备哪些能力
  capabilities: string[];

  // 行为约束：AI应该遵循的规则
  constraints: string[];

  // 语气风格：回答时的语言风格
  tone?: 'formal' | 'casual' | 'technical';
}

/**
 * 上下文信息
 */
interface Context {
  // 上下文类型
  type: 'background' | 'knowledge' | 'history' | 'constraints';

  // 内容
  content: string;

  // 来源（用于溯源）
  source?: string;

  // 置信度
  confidence?: number;
}

/**
 * 示例定义
 */
interface Example {
  // 输入示例
  input: string;

  // 期望输出
  output: string;

  // 示例说明（可选）
  explanation?: string;
}

/**
 * 输出格式定义
 */
interface OutputFormat {
  // 格式类型
  type: 'json' | 'markdown' | 'plain' | 'custom';

  // 字段定义（用于JSON格式）
  fields?: FieldDefinition[];

  // 自定义格式模板
  template?: string;
}
```

### 1.2 Prompt构建器

```typescript
/**
 * Prompt构建器 - 链式API设计
 *
 * 设计原理：
 * - 链式调用使Prompt构建更直观
 * - 模块化组合便于复用
 * - 类型安全减少错误
 */
class PromptBuilder {
  private systemPrompt: SystemPrompt;
  private context: Context[] = [];
  private examples: Example[] = [];
  private userInput: string = '';
  private outputFormat?: OutputFormat;

  constructor(role?: string) {
    this.systemPrompt = {
      role: role || 'assistant',
      capabilities: [],
      constraints: []
    };
  }

  /**
   * 设置角色
   */
  role(role: string): this {
    this.systemPrompt.role = role;
    return this;
  }

  /**
   * 添加能力描述
   */
  capability(capability: string): this {
    this.systemPrompt.capabilities.push(capability);
    return this;
  }

  /**
   * 添加行为约束
   */
  constraint(constraint: string): this {
    this.systemPrompt.constraints.push(constraint);
    return this;
  }

  /**
   * 添加上下文
   */
  addContext(context: Context): this {
    this.context.push(context);
    return this;
  }

  /**
   * 添加多个上下文
   */
  addContexts(contexts: Context[]): this {
    this.context.push(...contexts);
    return this;
  }

  /**
   * 添加示例
   */
  addExample(input: string, output: string, explanation?: string): this {
    this.examples.push({ input, output, explanation });
    return this;
  }

  /**
   * 设置用户输入
   */
  userInput(input: string): this {
    this.userInput = input;
    return this;
  }

  /**
   * 设置输出格式
   */
  outputFormat(format: OutputFormat): this {
    this.outputFormat = format;
    return this;
  }

  /**
   * 构建最终Prompt
   */
  build(): string {
    const parts: string[] = [];

    // 1. 系统提示部分
    parts.push(this.buildSystemPrompt());

    // 2. 上下文部分
    if (this.context.length > 0) {
      parts.push(this.buildContext());
    }

    // 3. 示例部分
    if (this.examples.length > 0) {
      parts.push(this.buildExamples());
    }

    // 4. 用户输入部分
    parts.push(this.buildUserInput());

    // 5. 输出格式说明
    if (this.outputFormat) {
      parts.push(this.buildOutputFormat());
    }

    return parts.join('\n\n');
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(): string {
    const parts = [`# 角色：${this.systemPrompt.role}`];

    if (this.systemPrompt.capabilities.length > 0) {
      parts.push('## 能力');
      parts.push(this.systemPrompt.capabilities.map(c => `- ${c}`).join('\n'));
    }

    if (this.systemPrompt.constraints.length > 0) {
      parts.push('## 约束');
      parts.push(this.systemPrompt.constraints.map(c => `- ${c}`).join('\n'));
    }

    if (this.systemPrompt.tone) {
      parts.push(`## 语气：${this.systemPrompt.tone}`);
    }

    return parts.join('\n');
  }

  /**
   * 构建上下文部分
   */
  private buildContext(): string {
    const sections: string[] = ['# 上下文信息'];

    for (const ctx of this.context) {
      sections.push(`## [${ctx.type}] ${ctx.source || ''}`);
      sections.push(ctx.content);
    }

    return sections.join('\n');
  }

  /**
   * 构建示例部分
   */
  private buildExamples(): string {
    const sections: string[] = ['# 示例'];

    for (let i = 0; i < this.examples.length; i++) {
      const ex = this.examples[i];
      sections.push(`## 示例 ${i + 1}`);
      sections.push(`**输入：**\n${ex.input}`);
      sections.push(`**输出：**\n${ex.output}`);
      if (ex.explanation) {
        sections.push(`**说明：**\n${ex.explanation}`);
      }
    }

    return sections.join('\n\n');
  }

  /**
   * 构建用户输入部分
   */
  private buildUserInput(): string {
    return `# 用户问题\n${this.userInput}`;
  }

  /**
   * 构建输出格式说明
   */
  private buildOutputFormat(): string {
    if (!this.outputFormat) return '';

    const sections: string[] = ['# 输出格式要求'];

    switch (this.outputFormat.type) {
      case 'json':
        sections.push('请以JSON格式输出：');
        sections.push('```json');
        sections.push(JSON.stringify(
          this.buildJsonSchema(),
          null,
          2
        ));
        sections.push('```');
        break;

      case 'markdown':
        sections.push('请使用Markdown格式输出');
        break;

      default:
        if (this.outputFormat.template) {
          sections.push(this.outputFormat.template);
        }
    }

    return sections.join('\n');
  }

  /**
   * 构建JSON Schema
   */
  private buildJsonSchema(): object {
    if (!this.outputFormat?.fields) return {};

    const schema: Record<string, any> = {};

    for (const field of this.outputFormat.fields) {
      schema[field.name] = {
        type: field.type,
        description: field.description,
        required: field.required
      };
    }

    return schema;
  }
}
```

## 二、System Prompt设计原则

System Prompt是Prompt的核心，决定了AI的基本行为模式。

### 2.1 角色定义技巧

```typescript
/**
 * 角色定义工厂 - 预定义高质量角色模板
 */
class RoleFactory {
  /**
   * 创建技术专家角色
   */
  static technicalExpert(domain: string): SystemPrompt {
    return {
      role: `资深${domain}技术专家`,
      capabilities: [
        `深入理解${domain}领域的核心概念和原理`,
        `能够分析和解决复杂的技术问题`,
        `擅长用清晰的语言解释技术细节`,
        `能够提供最佳实践和性能优化建议`,
        `熟悉行业标准和最新技术趋势`
      ],
      constraints: [
        '回答必须基于准确的技术知识',
        '代码示例必须完整可运行',
        '避免过度简化的解释导致误解',
        '不确定的问题要明确说明',
        '涉及安全相关的操作必须提醒风险'
      ],
      tone: 'technical'
    };
  }

  /**
   * 创建代码审查员角色
   */
  static codeReviewer(): SystemPrompt {
    return {
      role: '专业代码审查员',
      capabilities: [
        '发现代码中的潜在bug和性能问题',
        '识别代码风格不一致和可维护性问题',
        '提出改进建议和最佳实践',
        '评估代码的测试覆盖度',
        '提供具体的重构方案'
      ],
      constraints: [
        '审查要具体，指出具体行号和问题',
        '批评要建设性，提供解决方案',
        '区分严重问题和风格偏好',
        '认可好的代码实践',
        '优先关注安全性、性能、可维护性'
      ],
      tone: 'technical'
    };
  }

  /**
   * 创建教学导师角色
   */
  static mentor(level: 'beginner' | 'intermediate' | 'advanced'): SystemPrompt {
    const levelConfig = {
      beginner: {
        role: '耐心的编程导师',
        constraints: [
          '使用简单易懂的语言',
          '多举例，少用术语',
          '分解复杂概念为小步骤',
          '鼓励学习者尝试和探索',
          '允许犯错，将错误作为学习机会'
        ]
      },
      intermediate: {
        role: '进阶学习辅导员',
        constraints: [
          '在巩固基础的同时引入新概念',
          '提供对比和联系，帮助建立知识网络',
          '鼓励深入理解原理',
          '适当挑战，推动进步',
          '推荐进阶学习资源'
        ]
      },
      advanced: {
        role: '技术顾问',
        constraints: [
          '讨论最前沿的技术和最佳实践',
          '深入探讨原理和底层机制',
          '提供架构层面的建议',
          '分享行业趋势和洞见',
          '挑战固有思维，鼓励创新'
        ]
      }
    };

    return {
      ...levelConfig[level],
      capabilities: [
        '根据学习者水平调整解释深度',
        '识别知识缺口并填补',
        '设计实践练习巩固学习',
        '提供即时反馈和纠正',
        '激发学习兴趣和动力'
      ],
      tone: 'supportive'
    };
  }
}
```

### 2.2 约束设计模式

```typescript
/**
 * 约束设计模式库
 */
class ConstraintPatterns {
  /**
   * 安全约束模式 - 防止有害输出
   */
  static safety(): string[] {
    return [
      '如果问题涉及违法内容，拒绝回答并说明原因',
      '不生成可能造成伤害的指令',
      '涉及敏感操作时要求用户确认',
      '不传播虚假信息或谣言'
    ];
  }

  /**
   * 准确性约束模式 - 确保回答质量
   */
  static accuracy(): string[] {
    return [
      '不确定的问题，明确说明不确定的范围',
      '提供答案时标注置信度',
      '区分事实和推测',
      '引用可靠的信息来源',
      '当信息可能过时，说明时间限制'
    ];
  }

  /**
   * 格式约束模式 - 统一输出格式
   */
  static formatting(): string[] {
    return [
      '代码块必须指定语言类型',
      '使用Markdown标题层级',
      '列表项保持一致的格式',
      '关键信息使用加粗标注',
      '长回答使用适当的分段'
    ];
  }

  /**
   * 交互约束模式 - 改善对话体验
   */
  static interaction(): string[] {
    return [
      '主动询问不清晰的地方',
      '总结复杂内容确认理解',
      '提供选项让用户选择',
      '在复杂任务前先确认计划',
      '完成任务后询问是否需要进一步帮助'
    ];
  }
}
```

## 三、子Agent Prompt模板

在多Agent系统中，每个子Agent需要定制化的Prompt模板。

### 3.1 Agent Prompt模板定义

```typescript
/**
 * 子Agent Prompt模板配置
 */
interface AgentPromptTemplate {
  // Agent标识
  name: string;
  description: string;

  // 核心角色定义
  role: string;
  personality?: string;

  // 任务范围
  scope: {
    // 该Agent负责的任务类型
    taskTypes: string[];
    // 该Agent不能处理的任务
    exclusions: string[];
  };

  // 行为规范
  behavior: {
    // 工作模式
    mode: 'autonomous' | 'collaborative' | 'supervised';
    // 决策权限
    decisionLevel: 'low' | 'medium' | 'high';
    // 何时需要上报
    escalationTriggers: string[];
  };

  // 与其他Agent的协作
  collaboration: {
    // 可能需要协作的Agent
    potentialPartners: string[];
    // 协作时的行为规范
    collaborationProtocol: string;
  };

  // 输出规范
  output: {
    // 输出格式规范
    format: string;
    // 详细程度
    verbosity: 'brief' | 'standard' | 'detailed';
    // 是否需要附带理由
    includeReasoning: boolean;
  };
}

/**
 * 预定义的Agent模板
 */
const AGENT_TEMPLATES = {
  // 研究Agent模板
  researcher: {
    name: '研究Agent',
    description: '负责信息检索、收集和整理',
    role: '专业研究员',
    personality: '严谨、客观、注重证据',
    scope: {
      taskTypes: ['search', 'analyze', 'summarize', 'compare'],
      exclusions: ['代码执行', '系统操作', '决策建议']
    },
    behavior: {
      mode: 'autonomous',
      decisionLevel: 'medium',
      escalationTriggers: [
        '发现矛盾信息',
        '无法找到相关信息',
        '信息可能过时'
      ]
    },
    collaboration: {
      potentialPartners: ['analyst', 'writer'],
      collaborationProtocol: '提供结构化的研究发现，支持后续分析'
    },
    output: {
      format: '结构化报告',
      verbosity: 'detailed',
      includeReasoning: true
    }
  } as AgentPromptTemplate,

  // 分析师Agent模板
  analyst: {
    name: '分析Agent',
    description: '负责深度分析和提取洞见',
    role: '高级数据分析师',
    personality: '批判、逻辑、追求深度',
    scope: {
      taskTypes: ['analyze', 'evaluate', 'compare', 'predict'],
      exclusions: ['信息检索', '内容创作', '直接执行操作']
    },
    behavior: {
      mode: 'collaborative',
      decisionLevel: 'high',
      escalationTriggers: [
        '分析结果可能被重大未知因素影响',
        '需要业务决策层判断',
        '发现潜在风险'
      ]
    },
    collaboration: {
      potentialPartners: ['researcher', 'advisor'],
      collaborationProtocol: '基于研究结果进行深度分析，提供多角度观点'
    },
    output: {
      format: '分析报告+建议',
      verbosity: 'standard',
      includeReasoning: true
    }
  } as AgentPromptTemplate,

  // 写作者Agent模板
  writer: {
    name: '写作Agent',
    description: '负责内容创作和文档生成',
    role: '专业技术作家',
    personality: '清晰、准确、有条理',
    scope: {
      taskTypes: ['write', 'rewrite', 'summarize', 'translate'],
      exclusions: ['数据分析', '代码调试', '系统操作']
    },
    behavior: {
      mode: 'supervised',
      decisionLevel: 'low',
      escalationTriggers: [
        '对写作方向不确定',
        '需要引用准确性确认',
        '涉及敏感内容'
      ]
    },
    collaboration: {
      potentialPartners: ['researcher', 'analyst'],
      collaborationProtocol: '基于研究和分析结果创作内容，确保事实准确'
    },
    output: {
      format: '最终文档',
      verbosity: 'standard',
      includeReasoning: false
    }
  } as AgentPromptTemplate
};
```

### 3.2 动态Prompt生成

```typescript
/**
 * 动态Prompt生成器 - 根据上下文生成最优Prompt
 */
class DynamicPromptGenerator {
  /**
   * 根据任务生成完整的Agent Prompt
   */
  generateForTask(
    agentType: string,
    task: Task,
    context: TaskContext
  ): string {
    // 获取Agent模板
    const template = AGENT_TEMPLATES[agentType];
    if (!template) {
      throw new Error(`未知的Agent类型: ${agentType}`);
    }

    // 构建Prompt各部分
    const sections: string[] = [];

    // 1. 角色定义
    sections.push(this.buildRoleSection(template));

    // 2. 任务说明
    sections.push(this.buildTaskSection(task));

    // 3. 上下文信息
    if (context.relevantInfo.length > 0) {
      sections.push(this.buildContextSection(context));
    }

    // 4. 约束和规范
    sections.push(this.buildConstraintSection(template, task));

    // 5. 输出格式
    sections.push(this.buildOutputSection(template));

    // 6. 协作说明（如果有）
    if (task.collaborative) {
      sections.push(this.buildCollaborationSection(template));
    }

    return sections.join('\n\n');
  }

  private buildRoleSection(template: AgentPromptTemplate): string {
    const parts: string[] = [];

    parts.push(`# 角色：${template.role}`);
    parts.push(template.description);

    if (template.personality) {
      parts.push(`性格特点：${template.personality}`);
    }

    return parts.join('\n');
  }

  private buildTaskSection(task: Task): string {
    const parts: string[] = [];

    parts.push('# 当前任务');
    parts.push(`任务类型：${task.type}`);
    parts.push(`任务描述：${task.description}`);

    if (task.goal) {
      parts.push(`任务目标：${task.goal}`);
    }

    if (task.constraints) {
      parts.push('任务约束：');
      task.constraints.forEach(c => parts.push(`- ${c}`));
    }

    return parts.join('\n');
  }

  private buildContextSection(context: TaskContext): string {
    const parts: string[] = ['# 相关上下文'];

    if (context.background) {
      parts.push('## 背景信息');
      parts.push(context.background);
    }

    if (context.previousResults) {
      parts.push('## 前序结果');
      context.previousResults.forEach((r, i) => {
        parts.push(`${i + 1}. ${r.summary}`);
        if (r.details) {
          parts.push(`   详情：${r.details}`);
        }
      });
    }

    if (context.relevantInfo) {
      parts.push('## 参考信息');
      context.relevantInfo.forEach((info, i) => {
        parts.push(`[${i + 1}] ${info}`);
      });
    }

    return parts.join('\n');
  }

  private buildConstraintSection(
    template: AgentPromptTemplate,
    task: Task
  ): string {
    const parts: string[] = ['# 行为规范'];

    // 从模板添加通用约束
    parts.push('## 必须遵守');
    parts.push('- 提供准确、有据可查的信息');
    parts.push('- 遇到不确定情况，明确说明不确定性');

    // 根据详细程度添加约束
    if (template.output.verbosity === 'detailed') {
      parts.push('- 提供详细、全面的回答');
      parts.push('- 包含所有相关的考量和分析过程');
    } else if (template.output.verbosity === 'brief') {
      parts.push('- 回答简洁、直接');
      parts.push('- 聚焦于关键信息');
    }

    // 根据决策级别添加约束
    if (template.behavior.decisionLevel === 'low') {
      parts.push('- 避免自作主张，有疑问时询问');
    }

    return parts.join('\n');
  }

  private buildOutputSection(template: AgentPromptTemplate): string {
    const parts: string[] = ['# 输出要求'];

    parts.push(`格式：${template.output.format}`);
    parts.push(`详细程度：${template.output.verbosity}`);

    if (template.output.includeReasoning) {
      parts.push('要求：除了最终输出，包含你的分析推理过程');
    }

    return parts.join('\n');
  }

  private buildCollaborationSection(template: AgentPromptTemplate): string {
    const parts: string[] = ['# 协作说明'];

    parts.push(`潜在协作伙伴：${template.collaboration.potentialPartners.join(', ')}`);
    parts.push(`协作规范：${template.collaboration.collaborationProtocol}`);

    return parts.join('\n');
  }
}
```

## 四、Chain of Thought引导

Chain of Thought（思维链）是一种让AI展示推理过程的技术。

### 4.1 CoT Prompt设计

```typescript
/**
 * Chain of Thought引导策略
 */

/**
 * 基础CoT Prompt模板
 *
 * 原理：
 * - 要求AI先思考再回答
 * - 分解复杂问题为步骤
 * - 让推理过程可见
 */
const COT_PROMPT_TEMPLATE = `
# 任务：{task}

## 思考指引
请按以下步骤思考和回答：

1. **理解问题**
   - 我需要解决什么问题？
   - 关键信息是什么？
   - 有哪些限制条件？

2. **制定计划**
   - 我将如何解决这个问题？
   - 需要哪些步骤？
   - 优先处理什么？

3. **执行分析**
   - 逐步展示分析过程
   - 每个结论基于什么？
   - 有哪些可能的备选方案？

4. **验证检查**
   - 我的答案是否完整？
   - 是否有遗漏的方面？
   - 结论是否合理？

## 输出格式
请先写出你的思考过程，然后给出最终答案。

思考过程：
[在这里展示你的推理步骤]

最终答案：
[在这里给出最终结果]
`;

/**
 * Zero-shot CoT - 无需示例的思维链
 */
const ZERO_SHOT_COT = `
请仔细思考这个问题，并一步步展示你的推理过程。
最后给出答案。

问题：{question}

思考过程：
1.
2.
3.

答案：
`;

/**
 * Few-shot CoT - 带示例的思维链
 */
const FEW_SHOT_COT = `
请像示例一样，逐步推理并回答问题。

## 示例1
问题：如果一个苹果2元，一个香蕉1元，小明买了3个苹果和2个香蕉，他花了多少钱？

思考过程：
1. 先算出买苹果花了多少钱：3 × 2 = 6元
2. 再算出买香蕉花了多少钱：2 × 1 = 2元
3. 最后把两部分加起来：6 + 2 = 8元

答案：8元

## 示例2
问题：一列火车长100米，以每秒20米的速度通过一座500米长的桥，需要多少秒？

思考过程：
1. 火车要完全通过桥，需要走的距离 = 桥长 + 火车长 = 500 + 100 = 600米
2. 速度是每秒20米
3. 时间 = 距离 ÷ 速度 = 600 ÷ 20 = 30秒

答案：30秒

## 现在请回答：
问题：{question}

思考过程：
`;

/**
 * Tree of Thought - 树状思维（探索多种可能）
 */
const TREE_OF_THOUGHT = `
# 复杂问题分析

对于复杂问题，我会探索多个可能的解决路径，然后比较它们的优劣。

## 当前问题
{question}

## 思维分支

### 分支A：方法A
1. 第一步...
2. 第二步...
3. 结论...

### 分支B：方法B
1. 第一步...
2. 第二步...
3. 结论...

### 分支C：方法C
1. 第一步...
2. 第二步...
3. 结论...

## 分支比较
- 各分支的优势...
- 各分支的风险...
- 适用场景...

## 最终选择
基于以上分析，选择最优方案并说明理由。
`;
```

### 4.2 主动引导策略

```typescript
/**
 * CoT主动引导器 - 通过Prompt工程引导更好的推理
 */
class COTGuide {
  /**
   * 检查推理完整性
   */
  checkReasoningCompleteness(reasoning: string): CompletenessReport {
    const checks = {
      hasUnderstanding: reasoning.includes('理解') || reasoning.includes('问题'),
      hasPlan: reasoning.includes('计划') || reasoning.includes('步骤') || reasoning.includes('方法'),
      hasExecution: reasoning.includes('计算') || reasoning.includes('分析') || reasoning.includes('比较'),
      hasVerification: reasoning.includes('验证') || reasoning.includes('检查') || reasoning.includes('确认'),
      hasConclusion: reasoning.includes('答案') || reasoning.includes('结论') || reasoning.includes('因此')
    };

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

    return {
      score,
      checks,
      missing: Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check),
      suggestion: this.generateSuggestion(checks)
    };
  }

  /**
   * 生成改进建议
   */
  private generateSuggestion(checks: Record<string, boolean>): string {
    const suggestions: string[] = [];

    if (!checks.hasUnderstanding) {
      suggestions.push('请先明确理解问题的各个要素');
    }
    if (!checks.hasPlan) {
      suggestions.push('在执行前，先制定一个清晰的计划');
    }
    if (!checks.hasExecution) {
      suggestions.push('需要展示具体的分析或计算过程');
    }
    if (!checks.hasVerification) {
      suggestions.push('在得出结论前，进行验证和检查');
    }
    if (!checks.hasConclusion) {
      suggestions.push('最后需要给出明确的结论');
    }

    return suggestions.join('；');
  }

  /**
   * 反思引导Prompt
   */
  static reflection(): string {
    return `
请反思你的回答：

1. **准确性**：我的答案是否正确？有没有可能遗漏或错误的地方？

2. **完整性**：是否回答了问题的所有方面？还有哪些可以补充的？

3. **清晰度**：解释是否清晰易懂？是否有歧义或混淆的地方？

4. **深度**：分析是否足够深入？还是过于表面？

5. **改进**：如果重新回答，我会做出什么改变？

请基于以上反思，更新你的回答（如有必要）。
`;
  }
}
```

## 五、Few-shot示例设计

Few-shot learning通过提供示例来引导模型理解任务要求。

### 5.1 示例选择策略

```typescript
/**
 * Few-shot示例管理器
 */
class FewShotManager {
  private examplePool: Map<string, Example[]> = new Map();

  /**
   * 筛选最佳示例
   *
   * 选择策略：
   * 1. 相似度优先 - 选择与当前任务最相似的示例
   * 2. 多样性覆盖 - 示例覆盖不同的任务变体
   * 3. 难度递进 - 从简单到复杂排序
   */
  selectBestExamples(
    task: Task,
    count: number = 3
  ): Example[] {
    const candidates = this.examplePool.get(task.type) || [];

    // 计算每个示例与当前任务的相似度
    const scored = candidates.map(example => ({
      example,
      similarity: this.calculateSimilarity(task, example),
      diversity: this.calculateDiversity(example, candidates)
    }));

    // 综合评分：相似度 × 0.7 + 多样性 × 0.3
    const ranked = scored
      .map(s => ({
        ...s,
        score: s.similarity * 0.7 + s.diversity * 0.3
      }))
      .sort((a, b) => b.score - a.score);

    return ranked.slice(0, count).map(s => s.example);
  }

  /**
   * 计算任务与示例的相似度
   */
  private calculateSimilarity(task: Task, example: Example): number {
    // 基于关键词重叠度
    const taskKeywords = this.extractKeywords(task.description);
    const exampleKeywords = this.extractKeywords(example.input);

    const overlap = taskKeywords.filter(k =>
      exampleKeywords.includes(k)
    ).length;

    return overlap / Math.max(taskKeywords.length, exampleKeywords.length);
  }

  /**
   * 计算示例的多样性
   */
  private calculateDiversity(
    target: Example,
    pool: Example[]
  ): number {
    // 选择与目标示例不太相似的示例
    const otherExamples = pool.filter(e => e !== target);

    if (otherExamples.length === 0) return 0;

    const dissimilarities = otherExamples.map(e =>
      1 - this.calculateSimilarity(
        { description: target.input } as Task,
        e
      )
    );

    return dissimilarities.reduce((a, b) => a + b, 0) / dissimilarities.length;
  }

  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '一个', '如何', '怎么']);
    return text
      .split(/[\s,，。、]/)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }
}
```

### 5.2 示例格式设计

```typescript
/**
 * 示例格式工厂
 */

/**
 * 标准格式示例
 *
 * 适用场景：通用任务
 */
const STANDARD_FORMAT = `示例：

输入：{input}

输出：{output}`;

/**
 * 详细格式示例 - 带说明
 *
 * 适用场景：复杂任务，需要理解特定模式
 */
const DETAILED_FORMAT = `示例 ${number}：

## 任务
输入：{input}

## 期望输出
{output}

## 解释
为什么要这样输出：
{explanation}

## 关键要点
- {keyPoint1}
- {keyPoint2}
`;

/**
 * 对比格式示例 - 正确vs错误
 *
 * 适用场景：需要避免常见错误
 */
const COMPARISON_FORMAT = `示例 ${number}：

### 正确示例
输入：{correctInput}
输出：{correctOutput}
原因：{whyCorrect}

### 错误示例（避免这样做）
输入：{wrongInput}
错误输出：{wrongOutput}
错误原因：{whyWrong}`;

/**
 * 渐进格式示例 - 从简单到复杂
 *
 * 适用场景：分步骤任务
 */
const PROGRESSIVE_FORMAT = `示例 ${number}（{difficultyLevel}）：

### 基础情况
输入：{simpleInput}
输出：{simpleOutput}

### 扩展情况
输入：{extendedInput}
输出：{extendedOutput}
注意：{note}
`;
```

### 5.3 示例自动生成

```typescript
/**
 * 示例自动生成器 - 从成功案例中提取示例
 */
class ExampleGenerator {
  private llm: LLM;

  /**
   * 从历史交互中生成示例
   */
  async generateFromHistory(
    interactions: Interaction[],
    count: number
  ): Promise<Example[]> {
    const examples: Example[] = [];

    // 筛选高质量交互
    const qualityInteractions = interactions
      .filter(i => i.rating >= 4)  // 评分4星以上
      .filter(i => i.feedback === 'positive')  // 用户反馈正面
      .slice(0, count * 2);  // 取更多候选

    for (const interaction of qualityInteractions) {
      const example = await this.extractExample(interaction);
      if (example) {
        examples.push(example);
      }

      if (examples.length >= count) break;
    }

    return examples;
  }

  /**
   * 从单个交互中提取示例
   */
  private async extractExample(interaction: Interaction): Promise<Example | null> {
    try {
      // 使用LLM分析交互，提炼示例
      const analysis = await this.llm.complete(`
从以下交互中提取一个可复用的示例：

用户输入：${interaction.userInput}
AI响应：${interaction.aiResponse}

请提取：
1. 输入的核心要素（去掉个人信息）
2. 期望的输出模式
3. 关键的处理逻辑

以JSON格式输出：
{
  "input": "提取后的输入",
  "output": "提取后的输出",
  "pattern": "处理模式描述"
}
      `);

      const parsed = JSON.parse(analysis);

      return {
        input: parsed.input,
        output: parsed.output,
        explanation: parsed.pattern
      };
    } catch (error) {
      console.error('提取示例失败:', error);
      return null;
    }
  }

  /**
   * 生成对抗性示例 - 帮助模型理解边界情况
   */
  async generateAdversarialExamples(
    task: Task,
    count: number
  ): Promise<Example[]> {
    const prompts = [
      // 边界情况
      '生成一个边界值的示例',
      // 错误输入
      '生成一个包含错误输入的示例，展示如何处理',
      // 歧义情况
      '生成一个可能产生歧义的示例，展示如何澄清'
    ];

    const examples: Example[] = [];

    for (const prompt of prompts) {
      const result = await this.llm.complete(`
任务：${task.description}

${prompt}

请生成一个具体的示例，包含输入和正确的处理方式。
`);

      examples.push({
        input: this.extractInput(result),
        output: this.extractOutput(result)
      });

      if (examples.length >= count) break;
    }

    return examples;
  }
}
```

## 六、实战：构建完整的Prompt系统

```typescript
/**
 * 完整Prompt系统示例
 */
class PromptSystem {
  private builder: PromptBuilder;
  private fewShotManager: FewShotManager;
  private cotGuide: COTGuide;

  constructor(config: PromptSystemConfig) {
    this.builder = new PromptBuilder();
    this.fewShotManager = new FewShotManager(config.examples);
    this.cotGuide = new COTGuide();
  }

  /**
   * 为研究任务构建Prompt
   */
  buildResearchPrompt(task: ResearchTask): string {
    // 获取相关示例
    const examples = this.fewShotManager.selectBestExamples(
      { type: 'research', description: task.topic } as Task,
      3
    );

    // 构建Prompt
    return this.builder
      .role('专业研究员')
      .capability('能够进行深入的信息检索和分析')
      .capability('识别信息的关键点和趋势')
      .capability('提供结构化的研究报告')
      .constraint('只引用可靠的来源')
      .constraint('区分事实和推测')
      .constraint('不确认未经核实的信息')
      .addContexts([
        { type: 'background', content: task.background },
        { type: 'constraints', content: `研究范围：${task.scope}` }
      ])
      .addExamples(...examples)
      .userInput(`研究主题：${task.topic}\n\n具体问题：${task.questions.join('\n')}`)
      .outputFormat({
        type: 'markdown',
        template: `
# 研究报告格式要求

## 摘要
[简短总结核心发现]

## 详细信息
[按主题组织的研究结果]

## 来源
[列出引用的信息源]

## 局限性
[说明研究的局限和不确定因素]
`
      })
      .build();
  }

  /**
   * 为分析任务构建Prompt（带CoT）
   */
  buildAnalysisPrompt(task: AnalysisTask): string {
    return `
# 角色：高级数据分析师

## 能力
- 深入分析数据，发现隐藏的模式和趋势
- 批判性评估信息的准确性和相关性
- 提供基于证据的分析和建议

## 约束
- 所有结论必须有数据或证据支持
- 明确标注不确定性和假设
- 考虑多个角度和可能的替代解释

## 任务
分析主题：${task.topic}
分析维度：${task.dimensions.join('、')}

## Chain of Thought 分析指引

请按以下步骤进行分析：

### 第一步：理解问题
- 明确分析的核心问题
- 识别关键变量和关系
- 确定分析的范围和限制

### 第二步：构建分析框架
- 选择适当的分析模型
- 确定评估标准
- 制定假设

### 第三步：执行分析
[在这里展示你的分析过程]

### 第四步：验证发现
- 检查逻辑一致性
- 考虑替代解释
- 评估证据强度

### 第五步：得出结论
[在这里给出基于证据的结论]

## 输出格式
请提供：
1. 关键发现（3-5个核心结论）
2. 支持证据（每个结论的证据）
3. 置信度评估（高/中/低）
4. 建议（基于分析的可行建议）
`;
  }
}
```

## 七、总结

Prompt Engineering是AI应用的核心技能，需要掌握以下要点：

| 模块 | 核心原则 | 实践技巧 |
|------|----------|----------|
| **System Prompt** | 明确角色、约束、格式 | 使用预定义模板、层次化组织 |
| **Context** | 相关性、简洁性 | 只提供必要信息、标注来源 |
| **Examples** | 相似性、多样性 | 选择代表性示例、展示边界 |
| **CoT** | 可见性、结构性 | 分步骤引导、验证推理完整性 |
| **Output Format** | 明确性、一致性 | 使用Schema、提供模板 |

优秀的Prompt设计需要：
1. **迭代优化** - 基于实际效果持续调整
2. **系统性思维** - 考虑完整的使用场景
3. **用户视角** - 思考用户的真实需求
4. **技术理解** - 理解LLM的工作原理和限制
