# Prompt Engineering 实战

## 概述

Prompt Engineering（提示工程）是指通过精心设计输入提示来引导AI模型产生期望输出的技术栈。在Agent开发中，高质量的Prompt是确保Agent行为符合预期的关键。

## Prompt 设计原则

### 1. 清晰性原则

**问题表述：** 模糊的指令会导致模型理解偏差。

```typescript
// ❌ 模糊的Prompt
const prompt1 = "帮我看看代码";

// ✅ 清晰的Prompt
const prompt2 = `请审查以下JavaScript函数的性能问题：
function findDuplicates(arr) {
  return arr.filter((item, index) => arr.indexOf(item) !== index);
}
重点关注时间复杂度和可能的优化方案。`;
```

### 2. 结构化原则

使用清晰的结构组织Prompt各部分：

```
┌─────────────────────────────────────────────────────┐
│                    系统指令                          │
│  (角色定义、能力边界、输出格式)                       │
├─────────────────────────────────────────────────────┤
│                    上下文信息                        │
│  (相关背景、已有知识、参考资料)                       │
├─────────────────────────────────────────────────────┤
│                    具体任务                          │
│  (明确的目标、具体的问题)                            │
├─────────────────────────────────────────────────────┤
│                    约束条件                          │
│  (格式要求、长度限制、安全边界)                      │
└─────────────────────────────────────────────────────┘
```

### 3. 示例驱动原则

通过示例展示期望的输入输出格式：

```typescript
// 无示例
const prompt1 = "把这句话翻译成英文";

// 有示例（Few-shot）
const prompt2 = `请将以下中文翻译成英文。

示例1:
中文: 你好，很高兴认识你
英文: Hello, nice to meet you

示例2:
中文: 今天天气真不错
英文: The weather is really nice today

请翻译:
中文: 请问图书馆在哪里
英文:`;
```

## Few-shot 与 CoT

### 1. Few-shot Learning

Few-shot通过在Prompt中提供少量示例，使模型能够从示例中学习模式。

```typescript
// Few-shot示例：代码审查
const codeReviewPrompt = `你是一位代码审查专家。请根据以下示例风格审查代码。

示例1:
代码:
function getUser(id) {
  return db.query('SELECT * FROM users WHERE id = ' + id);
}
问题: SQL注入漏洞
建议: 使用参数化查询

示例2:
代码:
async function fetchData() {
  const data = await fetch(url);
  return data;
}
问题: 缺少错误处理
建议: 添加try-catch块

请审查:
代码:
function login(username, password) {
  return db.query('SELECT * FROM users WHERE username = "' + username + '"');
}`;
```

### 2. Chain-of-Thought (CoT) 推理

CoT通过引导模型展示推理过程来提高复杂问题的解答质量。

```typescript
// 基础CoT示例
const cotPrompt = `请解决以下数学问题，并展示推理过程。

问题: 小明有15个苹果，给了小红7个，又买了5个，请问小明现在有多少个苹果？

推理过程:
1. 小明原来有15个苹果
2. 给小红7个: 15 - 7 = 8个
3. 又买了5个: 8 + 5 = 13个
答案: 13个苹果

问题: 一辆汽车3小时行驶了180公里，如果速度保持不变，5小时能行驶多少公里？

推理过程:`;
```

### 3. Zero-shot CoT

在复杂推理场景中，可以先用"让我们思考一下"触发推理：

```typescript
const zeroShotCoTPrompt = `问题：一个商店有72个球，卖出去了三分之一，又进货了12个，现在有多少个球？

让我们一步步思考：

1. 首先计算卖出了多少球
2. 然后计算剩余
3. 最后加上进货数量

推理过程:`;
```

### 4. Few-shot + CoT 组合

最强大的Prompt技术之一是结合Few-shot示例和CoT推理：

```typescript
const fewShotCoTPrompt = `请分析代码并找出性能问题。对于每个问题，请展示分析过程。

示例:
代码片段:
for (i = 0; i < n; i++) {
  for (j = 0; j < n; j++) {
    if (arr[i] < arr[j]) {
      swap(arr[i], arr[j]);
    }
  }
}

分析过程:
1. 这是冒泡排序的实现
2. 时间复杂度: O(n²)
3. 问题: 无论数据是否已有序，都要执行完整遍历
4. 建议: 如果数据大部分有序，可使用提前退出优化

代码片段:
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}

分析过程:`;
```

## 结构化输出

### 1. JSON输出模式

在Agent应用中，结构化输出（如JSON）对于后续程序处理至关重要：

```typescript
// 指定JSON输出格式
const structuredPrompt = `你是一个数据分析助手。请分析以下销售数据并以JSON格式输出。

销售数据:
产品A: 销量120, 增长率15%
产品B: 销量85, 增长率-5%
产品C: 销量200, 增长率22%

请按以下JSON格式输出分析结果:
{
  "summary": "总体概述(不超过50字)",
  "top_performer": "表现最好的产品",
  "needs_attention": "需要关注的产品",
  "recommendations": ["建议1", "建议2", "建议3"]
}

输出:`;

interface AnalysisResult {
  summary: string;
  top_performer: string;
  needs_attention: string;
  recommendations: string[];
}
```

### 2. 带字段说明的Schema

提供详细的字段定义可以提高输出准确性：

```typescript
const schemaPrompt = `请提取文本中的人名和公司信息。

输出格式要求:
{
  "persons": [
    {
      "name": "人名",
      "role": "职位(如有)",
      "mentioned": true/false  // 是否在文本中被明确提及
    }
  ],
  "companies": [
    {
      "name": "公司名",
      "type": "公司类型(可选值: 互联网, 金融, 制造, 咨询, 其他)",
      "context": "提及上下文"
    }
  ]
}

文本: 张伟是腾讯的产品经理，李开复创办了创新工场。`;
```

### 3. Markdown表格输出

对于需要对比分析的场景，表格格式更清晰：

```typescript
const tablePrompt = `请对比分析以下两种技术方案。

方案A:
- 优点: 开发速度快
- 缺点: 性能一般
- 成本: 低
- 适用场景: 快速迭代项目

方案B:
- 优点: 性能优秀
- 缺点: 开发周期长
- 成本: 高
- 适用场景: 大型企业级应用

请用Markdown表格对比:

| 维度 | 方案A | 方案B |
|------|-------|-------|
| 开发速度 | | |
| 性能 | | |
| 成本 | | |
| 适用场景 | | |
| 推荐指数 | | |`;
```

## Prompt 优化技巧

### 1. 角色扮演法

通过定义具体角色来引导模型的回答风格：

```typescript
// 角色扮演Prompt
const rolePrompt = `你是一位拥有15年经验的高级架构师，专精于微服务系统和云原生架构。

你的回答特点:
1. 技术深度: 深入原理，附带权威引用
2. 实践导向: 结合真实项目经验
3. 结构清晰: 使用图表和代码示例
4. 风险提示: 指出潜在坑点和注意事项

现在请分析这个微服务架构是否合理:
[架构描述...]`;
```

### 2. 逐步细化法

对于复杂任务，使用渐进式提问：

```typescript
// 分解复杂问题
const progressivePrompt = `# 复杂任务分解示例

## 第一步：需求理解
请先确认对以下需求的理解是否正确:
[需求描述]

请列出:
1. 核心功能点
2. 非功能性需求
3. 假设和约束条件

## 第二步：方案设计
基于确认的需求，请提出系统架构方案，包括:
1. 技术栈选择
2. 系统组件图
3. 数据流设计

## 第三步：详细设计
请针对以下模块进行详细设计:
[模块列表]`;
```

### 3. 约束强化法

对于需要严格遵守规则的场景：

```typescript
// 强化约束Prompt
const constrainedPrompt = `你是一个代码审查助手。请严格按以下规则审查代码：

【必须遵守的规则】
1. 安全性: 任何用户输入必须验证和清理
2. 错误处理: 所有外部调用必须try-catch
3. 资源管理: 使用完的资源必须释放
4. 命名规范: 变量和函数名必须有意义

【输出格式】
每条问题必须包含:
- 严重程度: [严重/中等/轻微]
- 问题位置: 文件:行号
- 问题描述
- 修复建议

【禁止行为】
- 不要猜测未提供的信息
- 不要提出与安全无关的建议
- 不要忽略任何潜在问题`;
```

### 4. 上下文压缩法

在有限窗口内最大化有效信息：

```typescript
// 上下文压缩示例
const compressedPrompt = `【系统】你是一个代码助手。只会根据提供的代码片段回答。

【当前任务】审查以下代码片段的问题:

【代码片段】(已压缩，只保留关键部分)
function process(data) {
  eval(data);  // 处理用户输入
  fs.writeFile('output.txt', data);
}

【分析要求】
- 只需指出最严重的问题
- 不需要完整代码审查
- 直接给出修复方案`;
```

### 5. 温度和采样控制

除了Prompt本身，生成参数也影响输出质量：

```typescript
// 生成参数配置
const generationConfig = {
  // 温度控制创造性
  // 低温(0.1-0.3): 确定性强，一致性高
  // 中温(0.5-0.7): 平衡创造性和准确性
  // 高温(0.8-1.0): 创造性高，一致性低
  temperature: 0.3,

  // Top-p核采样
  top_p: 0.9,

  // 最大token数
  max_tokens: 2000,

  // 停止符
  stop_sequences: ['---', 'END']
};
```

## 实战案例

### 案例1：代码审查Agent

```typescript
const codeReviewAgentPrompt = `【角色】
你是一位代码审查专家，拥有10年经验，精通代码安全、性能和可维护性。

【输入】
待审查代码：
\`\`\`
${codeToReview}
\`\`\`

【审查维度】
1. 安全性：SQL注入、XSS、权限漏洞等
2. 性能：算法复杂度、内存泄漏、资源浪费
3. 可维护性：命名、注释、代码结构
4. 最佳实践：是否符合语言惯用写法

【输出格式】
\`\`\`json
{
  "overall_score": 1-10,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "security|performance|maintainability|style",
      "location": "file:line",
      "description": "问题描述",
      "suggestion": "修复建议"
    }
  ],
  "summary": "总体评价",
  "recommendations": ["改进建议1", "改进建议2"]
}
\`\`\`

【注意】
- 问题必须按严重程度排序
- critical问题必须详细说明
- 修复建议必须可操作`;
```

### 案例2：SQL生成Agent

```typescript
const sqlGenAgentPrompt = `【任务】
根据用户需求生成SQL查询语句。

【数据库Schema】
表名: orders
- id: INT PRIMARY KEY
- customer_name: VARCHAR(100)
- order_date: DATE
- total_amount: DECIMAL(10,2)
- status: ENUM('pending', 'completed', 'cancelled')

表名: order_items
- id: INT PRIMARY KEY
- order_id: INT FOREIGN KEY
- product_name: VARCHAR(100)
- quantity: INT
- unit_price: DECIMAL(10,2)

【输出要求】
1. 先解释查询思路
2. 然后给出SQL
3. 最后解释关键部分

【示例】
输入: 查找所有已完成的订单及其总金额
输出:
查询思路: 需要连接orders和order_items表，按order_id分组求和，筛选已完成的订单。
SQL:
\`\`\`sql
SELECT
    o.id,
    o.customer_name,
    o.order_date,
    SUM(i.quantity * i.unit_price) as total
FROM orders o
JOIN order_items i ON o.id = i.order_id
WHERE o.status = 'completed'
GROUP BY o.id, o.customer_name, o.order_date
\`\`\`
关键: 使用JOIN连接两表，SUM聚合计算每单总金额，GROUP BY保证正确分组。

【用户需求】
${userRequirement}`;
```

## Prompt 调试与优化

### 1. 版本控制

```typescript
// Prompt版本管理
const promptRegistry = {
  'code-review-v1': {
    prompt: '...',
    success_rate: 0.85,
    avg_rating: 4.2,
    issues: ['偶尔过度批评', '建议不够具体']
  },
  'code-review-v2': {
    prompt: '...', // 优化后的版本
    success_rate: 0.92,
    avg_rating: 4.6,
    issues: []
  }
};
```

### 2. A/B测试

```typescript
// Prompt A/B测试框架
async function testPromptVariant(
  variantA: string,
  variantB: string,
  testCases: TestCase[]
) {
  const results = { variantA: [], variantB: [] };

  for (const testCase of testCases) {
    const [resultA, resultB] = await Promise.all([
      callModel(variantA, testCase.input),
      callModel(variantB, testCase.input)
    ]);

    results.variantA.push(evaluate(resultA, testCase.expected));
    results.variantB.push(evaluate(resultB, testCase.expected));
  }

  return {
    variantA: aggregate(results.variantA),
    variantB: aggregate(results.variantB),
    winner: results.variantA.mean > results.variantB.mean ? 'A' : 'B'
  };
}
```

## 总结

Prompt Engineering是Agent开发中的核心技能：

1. **清晰性** - 明确的任务描述和期望输出
2. **结构化** - 组织良好的Prompt结构
3. **示例驱动** - Few-shot引导模型学习模式
4. **推理增强** - CoT提升复杂任务表现
5. **结构化输出** - JSON/表格确保机器可读
6. **持续优化** - 版本管理和A/B测试改进

掌握这些技巧能够显著提升Agent的任务完成质量和可靠性。
