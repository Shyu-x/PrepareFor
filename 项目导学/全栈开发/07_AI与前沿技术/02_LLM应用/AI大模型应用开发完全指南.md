# AI大模型应用开发完全指南

## 概述

本文档系统讲解AI大语言模型（LLM）的应用开发技术栈，涵盖从基础概念到企业级架构的完整知识体系。文档包含大量实战代码示例，帮助开发者快速掌握AI应用的核心技能。

**前置知识**：JavaScript/TypeScript基础、Node.js环境、基本的REST API概念

**学习目标**：
- 理解AI大模型的核心原理与能力边界
- 掌握主流LLM API的调用方法
- 精通Prompt工程与RAG检索增强技术
- 能够开发基于Agent的智能应用
- 理解AI应用的安全合规与成本控制

---

## 目录

1. [AI大模型概述](#1-ai大模型概述)
2. [LLM API调用](#2-llm-api调用)
3. [Prompt工程](#3-prompt工程)
4. [RAG检索增强](#4-rag检索增强)
5. [Agent开发](#5-agent开发)
6. [对话系统](#6-对话系统)
7. [代码生成](#7-代码生成)
8. [AI应用架构](#8-ai应用架构)
9. [安全与合规](#9-安全与合规)
10. [案例：智能客服](#10-案例智能客服)

---

## 1. AI大模型概述

### 1.1 GPT、BERT、Claude三大架构对比

当前最主流的大语言模型主要分为三种架构范式：

| 特性 | GPT系列（自回归） | BERT（双向编码） | Claude（自回归+安全） |
|------|-------------------|------------------|------------------------|
| **架构类型** | Decoder-only | Encoder-only | Decoder-only |
| **训练方式** | Next Token Prediction | Masked Language Model | Next Token Prediction |
| **擅长任务** | 文本生成、对话、代码 | 分类、NER、语义匹配 | 对话、推理、安全 |
| **代表模型** | GPT-4、GPT-4o、o1 | BERT、RoBERTa | Claude 3.5、Claude 3 |
| **上下文长度** | 128K+ | 512 | 200K |
| **多模态** | 原生支持 | 需扩展 | 原生支持 |

**GPT系列（Generative Pre-trained Transformer）**：
- 采用Decoder-only的自回归架构
- 从左到右逐token生成，适合连贯文本创作
- GPT-4支持128K上下文窗口，具备强大的长程依赖理解能力
- GPT-4o原生支持多模态输入（文本、图像、音频）

**BERT（Bidirectional Encoder Representations from Transformers）**：
- 采用Encoder-only的双向架构
- 上下文全局感知，适合理解任务
- 参数量相对较小，适合边缘部署
- 催生了Sentence-BERT等向量编码器

**Claude系列**：
- 由Anthropic开发，强调AI安全性与有益性
- 采用Constitutional AI训练方法
- 支持超长上下文（200K tokens）
- 擅长代码生成、复杂推理、长文档分析

### 1.2 GPT-4能力边界分析

GPT-4作为当前最强大的商用大模型之一，其能力边界值得深入理解：

**强项领域**：
- 代码生成与调试：HumanEval基准测试通过率达90%以上
- 复杂推理：数学奥林匹克级别问题准确率显著提升
- 长文档理解：可处理长达128K tokens的文档
- 多语言任务：中文、英文等主流语言理解准确
- 创意写作：文章、故事、诗歌等多种文体

**弱项领域**：
- 实时信息获取：知识截止日期限制（GPT-4 Turbo: 2024年6月）
- 精确数学计算：需要计算器的场景可能出错
- 长序列任务：超过128K后可能遗忘开头内容
- 时效性判断：无法主动验证信息的时效性
- 物理世界交互：不具备感知和操控物理世界的能力

```typescript
// GPT-4能力边界示例：理解模型的能力与限制
interface ModelCapability {
  // 强项
  codeGeneration: boolean;      // 代码生成
  complexReasoning: boolean;     // 复杂推理
  longContext: boolean;          // 长上下文理解
  multilingual: boolean;        // 多语言
  creativeWriting: boolean;      // 创意写作

  // 弱项
  realTimeInfo: boolean;        // 实时信息
  preciseCalculation: boolean;  // 精确计算
  longSequence: boolean;        // 超长序列
  timeSensitivity: boolean;     // 时效性判断
  physicalWorld: boolean;       // 物理世界交互
}

// GPT-4 Turbo的能力评估
const gpt4TurboCapability: ModelCapability = {
  // 强项 - 表现优秀
  codeGeneration: true,
  complexReasoning: true,
  longContext: true,     // 128K tokens
  multilingual: true,
  creativeWriting: true,

  // 弱项 - 需要外部工具辅助
  realTimeInfo: false,   // 需要结合实时搜索
  preciseCalculation: false, // 需要计算器工具
  longSequence: false,   // 超过128K会遗忘
  timeSensitivity: false, // 无法判断时效性
  physicalWorld: false   // 无法直接交互
};
```

### 1.3 Token计算详解

Token是大模型处理文本的基本单位，理解Token计算对于控制成本至关重要：

**Token计算规则**：
- 英文：1 token ≈ 0.75个单词，或约4个字符
- 中文：1 token ≈ 0.5-1.5个汉字（取决于模型）
- 代码：通常比自然语言更密集

**常见Token数量估算**：
| 文本类型 | 单词/汉字数 | 约等于Token数 |
|----------|-------------|---------------|
| 一个短句 | 5-10词 | 10-30 tokens |
| 一段话 | 50-100词 | 75-150 tokens |
| 一页纸 | 250-300词 | 300-400 tokens |
| 一篇文章 | 1000词 | 1300-1500 tokens |
| 一本书 | 50,000词 | 65,000-75,000 tokens |

```typescript
/**
 * Token计算工具类
 * 提供中英文Token的估算与计算功能
 */
class TokenCalculator {
  // 英文单词Token估算比率
  private static readonly ENGLISH_RATIO = 1.0; // 1词 ≈ 1.3 tokens
  // 中文字符Token估算比率
  private static readonly CHINESE_RATIO = 2.0; // 1字 ≈ 1.5-2.0 tokens

  /**
   * 估算英文文本的Token数量
   * @param text 英文文本
   * @returns 估算的Token数量
   */
  static estimateEnglish(text: string): number {
    // 分割单词（简单按空格分割）
    const words = text.trim().split(/\s+/).length;
    // 每个单词约1.3个tokens
    return Math.ceil(words * 1.3);
  }

  /**
   * 估算中文文本的Token数量
   * @param text 中文文本
   * @returns 估算的Token数量
   */
  static estimateChinese(text: string): number {
    // 中文字符数
    const chars = text.length;
    // 每个中文字符约1.5个tokens
    return Math.ceil(chars * 1.5);
  }

  /**
   * 估算混合文本的Token数量
   * @param text 混合语言文本
   * @returns 估算的Token数量
   */
  static estimateMixed(text: string): number {
    // 分离中英文
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    // 中文部分 + 英文部分
    const chineseTokens = chineseChars * 1.5;
    const englishTokens = englishWords * 1.3;

    return Math.ceil(chineseTokens + englishTokens);
  }

  /**
   * 根据Token预算计算最大输入长度
   * @param totalBudget  总Token预算
   * @param reserveForOutput  保留给输出的Token数
   * @returns 最大输入Token数
   */
  static maxInputTokens(
    totalBudget: number,
    reserveForOutput: number = 500
  ): number {
    return totalBudget - reserveForOutput;
  }

  /**
   * 估算API调用成本
   * @param inputTokens  输入Token数
   * @param outputTokens 输出Token数
   * @param model  模型名称
   * @returns 估算成本（美元）
   */
  static estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet'
  ): number {
    // 各模型的定价（美元/百万tokens）
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10.0 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },
      'claude-3-5-sonnet': { input: 3.0, output: 15.0 }
    };

    const rates = pricing[model];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }
}

// 使用示例
const englishSample = "The quick brown fox jumps over the lazy dog";
const chineseSample = "人工智能正在深刻改变我们的生活方式";
const mixedSample = "AI is revolutionizing how we interact with technology人工智能正在革新我们的交互方式";

console.log(`英文Token估算: ${TokenCalculator.estimateEnglish(englishSample)}`);
// 输出: 英文Token估算: 45

console.log(`中文Token估算: ${TokenCalculator.estimateChinese(chineseSample)}`);
// 输出: 中文Token估算: 12

console.log(`混合Token估算: ${TokenCalculator.estimateMixed(mixedSample)}`);
// 输出: 混合Token估算: 28

// 计算成本示例
const cost = TokenCalculator.estimateCost(1000, 500, 'gpt-4o');
console.log(`API调用成本: $${cost.toFixed(6)}`);
// 输出: API调用成本: $0.007500
```

### 1.4 我的思考：AI是新的基础设施

**从工具到基础设施的范式转变**

互联网经历了从"工具"到"基础设施"的演变。如今，AI大模型正在走同样的道路。当电力成为基础设施时，我们不会问"这个公司用电力做什么生意"，因为电力已经成为所有生意的底座。同样，AI正在成为新的基础设施——不是某个行业的专属工具，而是所有行业数字化转型的基础能力。

**三层基础设施架构**：

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (AI+行业)                      │
│    AI客服 | AI写作 | AI编程 | AI设计 | AI医疗 | AI教育   │
├─────────────────────────────────────────────────────────┤
│                    平台层 (AI服务)                       │
│     OpenAI | Anthropic | 百度文心 | 阿里通义 | 智谱AI     │
├─────────────────────────────────────────────────────────┤
│                    基础层 (算力+数据)                     │
│            GPU集群 | TPU | 数据中心 | 训练框架           │
└─────────────────────────────────────────────────────────┘
```

**开发者如何定位**：

1. **应用开发者**：基于LLM API构建行业应用
2. **平台开发者**：构建LLM之上的中间件和工具
3. **模型开发者**：训练和优化大模型（门槛极高）

对于大多数前端/全栈开发者来说，应用开发层是最佳切入点。AI能力会像水电一样按需调用，而你的价值在于如何将这些能力组合成解决问题的产品。

**未来的开发模式**：

```typescript
// 传统开发：写代码实现功能
function processOrder(order: Order): Promise<void> {
  // 1000行代码实现订单处理逻辑
}

// AI时代的开发：描述需求，AI实现
async function processOrder(order: Order): Promise<void> {
  // 描述业务规则，AI处理复杂逻辑
  const context = `
    订单信息：${JSON.stringify(order)}
    业务规则：VIP用户优先处理...
  `;

  // AI自动处理异常、生成报告、决策
  const result = await ai.complete({
    prompt: `根据以下订单和业务规则处理：${context}`,
    actions: ['processPayment', 'notifyCustomer', 'updateInventory']
  });

  await executeActions(result.actions);
}
```

---

## 2. LLM API调用

### 2.1 OpenAI API

OpenAI提供了业界最完善的LLM API体系，包括ChatGPT和GPT-4系列模型。

**核心API概览**：

| API端点 | 用途 | 适用场景 |
|---------|------|----------|
| `/v1/chat/completions` | 对话补全 | 聊天机器人、文本生成 |
| `/v1/embeddings` | 向量嵌入 | 语义搜索、RAG |
| `/v1/models` | 模型列表 | 模型选择 |
| `/v1/audio/speech` | 语音合成 | TTS应用 |

**环境配置与依赖安装**：

```bash
# 创建项目目录
mkdir ai-app-demo && cd ai-app-demo

# 初始化Node.js项目
npm init -y

# 安装OpenAI SDK
npm install openai dotenv

# 安装TypeScript相关依赖（可选，用于类型提示）
npm install -D typescript @types/node ts-node
```

**基础调用示例**：

```typescript
// 环境配置
// .env 文件
// OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 简单的文本补全
async function basicCompletion() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',  // 最新多模态模型
    messages: [
      {
        role: 'system',
        content: '你是一位专业的技术文档写作助手'
      },
      {
        role: 'user',
        content: '请用简洁的语言解释什么是API'
      }
    ],
    max_tokens: 500,       // 最大生成token数
    temperature: 0.7,      // 创造性参数（0-2）
    top_p: 1.0,            // 核采样参数
  });

  console.log('回答:', completion.choices[0].message.content);
  console.log('消耗Token:', {
    prompt: completion.usage?.prompt_tokens,
    completion: completion.usage?.completion_tokens,
    total: completion.usage?.total_tokens
  });
}

// 流式输出示例
async function streamingCompletion() {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: '用三句话解释区块链技术'
      }
    ],
    stream: true,
    max_tokens: 300,
  });

  // 流式处理响应
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);  // 实时输出
    }
  }
  console.log('\n');  // 换行
}

// 运行示例
basicCompletion();
// streamingCompletion();
```

**高级功能：JSON Mode与Function Calling**：

```typescript
/**
 * 使用JSON Mode确保输出结构化
 * 适用于需要程序化处理返回结果的场景
 */
async function structuredOutput() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `你是一个数据分析助手。
要求：
1. 分析用户输入的销售数据
2. 以JSON格式返回分析结果
3. JSON必须包含字段：totalRevenue（总销售额）、orderCount（订单数）、averageOrderValue（平均订单额）
4. 如果无法分析，返回 error 字段说明原因`
      },
      {
        role: 'user',
        content: '销售数据：订单1-100元，订单2-250元，订单3-80元'
      }
    ],
    response_format: { type: 'json_object' },  // 强制JSON输出
    max_tokens: 500,
  });

  const result = response.choices[0].message.content;
  console.log('结构化输出:', result);

  // 解析JSON
  const parsed = JSON.parse(result!);
  console.log('解析后:', parsed);
}

/**
 * Function Calling（工具调用）
 * 让AI能够调用外部函数扩展能力
 */
interface WeatherParams {
  city: string;
  unit?: 'celsius' | 'fahrenheit';
}

// 定义可用工具
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的天气信息',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称，如：北京、上海'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: '温度单位'
          }
        },
        required: ['city']
      }
    }
  }
];

// 模拟天气查询函数
async function getWeather(city: string, unit: 'celsius' | 'fahrenheit' = 'celsius') {
  // 实际项目中这里调用天气API
  return {
    city,
    temperature: 22,
    unit,
    condition: '多云',
    humidity: 65
  };
}

// 使用工具调用
async function toolCallingExample() {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: '北京今天天气怎么样？适合出门吗？'
    }
  ];

  // 第一轮：AI决定调用工具
  const response1 = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: 'auto'  // 让AI决定是否调用工具
  });

  const assistantMessage = response1.choices[0].message;
  messages.push(assistantMessage);

  // 如果AI调用了工具
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolCall = assistantMessage.tool_calls[0];
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    console.log(`AI调用工具: ${functionName}`);
    console.log(`参数: ${JSON.stringify(args)}`);

    // 执行工具函数
    let toolResult;
    if (functionName === 'get_weather') {
      toolResult = await getWeather(args.city, args.unit);
    }

    // 将工具结果返回给AI
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult)
    });

    // 第二轮：AI基于工具结果生成最终回答
    const response2 = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools
    });

    console.log('最终回答:', response2.choices[0].message.content);
  }
}

// 运行示例
structuredOutput();
// toolCallingExample();
```

### 2.2 Anthropic API (Claude)

Anthropic的Claude系列模型以安全性高、长上下文著称，适合企业级应用。

**环境配置**：

```bash
# 安装Anthropic SDK
npm install @anthropic-ai/sdk
```

**基础调用示例**：

```typescript
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * 基础对话调用
 * Claude使用不同于OpenAI的消息格式
 */
async function basicClaudeChat() {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',  // 最新模型
    max_tokens: 1024,  // Claude要求指定max_tokens
    messages: [
      {
        role: 'user',
        content: '请用三句话解释什么是机器学习'
      }
    ]
  });

  console.log('回答:', message.content);
  console.log('Token使用:', message.usage);
}

/**
 * 系统提示词（Claude称为System Prompt）
 * 用于设定AI的角色和行为
 */
async function claudeWithSystem() {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: `你是一位经验丰富的前端架构师。
回答要求：
1. 注重代码性能和可维护性
2. 提供实际的代码示例
3. 考虑浏览器兼容性和性能优化
4. 用中文回答`,
    messages: [
      {
        role: 'user',
        content: 'React和Vue有什么区别？应该选择哪个？'
      }
    ]
  });

  console.log('回答:', message.content);
}

/**
 * 多模态输入（图像理解）
 */
async function claudeMultimodal() {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请描述这张图片的内容'
          },
          {
            type: 'image',
            source: {
              type: 'url',
              url: 'https://example.com/image.png'  // 或使用base64
            }
          }
        ]
      }
    ]
  });

  console.log('图片描述:', message.content);
}

/**
 * 流式输出
 */
async function claudeStreaming() {
  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: '写一个快速排序算法'
      }
    ]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      process.stdout.write(event.delta.text);
    }
  }
  console.log('\n');
}

// 运行示例
basicClaudeChat();
// claudeWithSystem();
```

### 2.3 国内API：百度、阿里

国内大模型API在中文场景下表现优秀，且合规性更好。

**百度文心一言API**：

```bash
# 安装百度SDK
npm install wenxinworkshop
```

```typescript
import * as dotenv from 'dotenv';
import { getAccessToken } from 'wenxinworkshop/auth';
import { ChatComplete } from 'wenxinworkshop/api/chat';

dotenv.config();

// 百度文心API配置
const BAIDU_API_KEY = process.env.BAIDU_API_KEY!;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY!;

/**
 * 获取百度Access Token
 * 百度API使用OAuth2.0认证
 */
async function getBaiduAccessToken(): Promise<string> {
  return await getAccessToken(BAIDU_API_KEY, BAIDU_SECRET_KEY);
}

/**
 * 百度文心对话
 */
async function baiduChat() {
  const accessToken = await getBaiduAccessToken();

  const chat = new ChatComplete(accessToken);

  const result = await chat.send({
    messages: [
      {
        role: 'user',
        content: '解释一下什么是RESTful API'
      }
    ],
    model: 'ernie-4.0-8k-latest',  // 文心4.0
    stream: false
  });

  console.log('文心回答:', result.result);
}

/**
 * 百度文心Embedding（向量嵌入）
 * 用于语义相似度计算
 */
async function baiduEmbedding() {
  const accessToken = await getBaiduAccessToken();

  // 百度使用不同的SDK方式，这里展示fetch调用
  const response = await fetch(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: ['今天天气很好', '外面阳光明媚']
      })
    }
  );

  const data = await response.json();
  console.log('Embedding向量维度:', data.data[0].embedding.length);
}
```

**阿里通义千问API**：

```bash
# 安装阿里SDK
npm install @qwenAi/qwen-ai
```

```typescript
import * as dotenv from 'dotenv';
import OpenAI from 'openai';  // 通义支持OpenAI兼容格式

dotenv.config();

/**
 * 阿里通义千问API（OpenAI兼容格式）
 */
const qwen = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',  // 阿里API地址
});

/**
 * 通义千问对话
 */
async function qwenChat() {
  const completion = await qwen.chat.completions.create({
    model: 'qwen-plus',  // 通义plus模型
    messages: [
      {
        role: 'system',
        content: '你是一位专业的Python后端开发工程师'
      },
      {
        role: 'user',
        content: 'Flask和Django有什么区别？'
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  console.log('通义回答:', completion.choices[0].message.content);
}

/**
 * 通义多模态（图像理解）
 */
async function qwenVision() {
  const completion = await qwen.chat.completions.create({
    model: 'qwen-vl-plus',  // 视觉增强模型
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/diagram.png'
            }
          },
          {
            type: 'text',
            text: '这张架构图的核心组件是什么？'
          }
        ]
      }
    ],
    max_tokens: 500
  });

  console.log('图表分析:', completion.choices[0].message.content);
}

/**
 * 通义代码助手
 */
async function qwenCodeAssistant() {
  const completion = await qwen.chat.completions.create({
    model: 'qwen-coder-plus',  // 代码专用模型
    messages: [
      {
        role: 'system',
        content: `你是一位资深全栈工程师，擅长：
1. 代码审查和优化建议
2. Bug定位和修复方案
3. 架构设计和最佳实践
4. 技术方案解释`
      },
      {
        role: 'user',
        content: `请审查以下TypeScript代码的问题：

function processData(data: any) {
  console.log(data.name);
  return data.value * 10;
}

const result = processData({ name: "test", value: "100" });
console.log(result);`
      }
    ],
    max_tokens: 1000
  });

  console.log('代码审查结果:', completion.choices[0].message.content);
}
```

### 2.4 实战：Node.js调用大模型API

以下是一个完整的Node.js集成示例，整合多个LLM供应商：

```typescript
/**
 * AI服务集成器
 * 支持OpenAI、Claude、文心、通义等多种LLM
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

type LLMProvider = 'openai' | 'claude' | 'qwen' | 'ERNIE';

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseURL?: string;  // 用于兼容格式
}

interface LLMRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: LLMProvider;
  model: string;
}

// ==================== LLM客户端类 ====================

class LLMClient {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private defaultModel: string;

  constructor() {
    // 初始化各平台客户端
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.defaultModel = 'gpt-4o';
  }

  /**
   * 统一的LLM调用接口
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const { prompt, system, temperature = 0.7, maxTokens = 2000, stream = false } = request;

    // 根据配置的默认模型选择provider
    return this.openaiComplete({ prompt, system, temperature, maxTokens, stream });
  }

  /**
   * OpenAI GPT调用
   */
  async openaiComplete(request: LLMRequest): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await this.openai.chat.completions.create({
      model: this.defaultModel,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream
    });

    if (request.stream) {
      // 流式处理
      let content = '';
      for await (const chunk of response) {
        content += chunk.choices[0]?.delta?.content || '';
      }
      return { content, provider: 'openai', model: this.defaultModel };
    }

    const result = response.choices[0].message.content!;
    return {
      content: result,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      provider: 'openai',
      model: this.defaultModel
    };
  }

  /**
   * Claude调用
   */
  async claudeComplete(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: request.maxTokens || 1024,
      system: request.system,
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature,
    });

    const content = (response.content[0] as any).text || '';

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      provider: 'claude',
      model: 'claude-3-5-sonnet'
    };
  }

  /**
   * 通义千问调用
   */
  async qwenComplete(request: LLMRequest): Promise<LLMResponse> {
    const qwen = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });

    const response = await qwen.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        ...(request.system ? [{ role: 'system', content: request.system }] : []),
        { role: 'user', content: request.prompt }
      ],
      temperature: request.temperature,
      max_tokens: request.maxTokens
    });

    return {
      content: response.choices[0].message.content!,
      provider: 'qwen',
      model: 'qwen-plus'
    };
  }

  /**
   * 批量处理多个请求
   */
  async batchComplete(requests: LLMRequest[]): Promise<LLMResponse[]> {
    return Promise.all(requests.map(req => this.complete(req)));
  }

  /**
   * 对比多个模型的输出
   */
  async compareModels(
    prompt: string,
    models: { provider: LLMProvider; model: string }[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    const promises = models.map(async ({ provider, model }) => {
      let result: string;
      switch (provider) {
        case 'openai':
          const openaiRes = await this.openaiComplete({ prompt });
          result = openaiRes.content;
          break;
        case 'claude':
          const claudeRes = await this.claudeComplete({ prompt });
          result = claudeRes.content;
          break;
        case 'qwen':
          const qwenRes = await this.qwenComplete({ prompt });
          result = qwenRes.content;
          break;
        default:
          result = '不支持的模型';
      }
      return { model: `${provider}:${model}`, result };
    });

    const resolved = await Promise.all(promises);
    resolved.forEach(({ model, result }) => {
      results[model] = result;
    });

    return results;
  }
}

// ==================== 使用示例 ====================

async function main() {
  const llm = new LLMClient();

  // 1. 基础对话
  console.log('=== 基础对话 ===');
  const response = await llm.complete({
    prompt: '解释一下什么是TypeScript的泛型',
    system: '你是一位TypeScript专家，用简洁的语言解释概念'
  });
  console.log(response.content);

  // 2. Claude对比
  console.log('\n=== 多模型对比 ===');
  const comparisons = await llm.compareModels(
    '什么是依赖注入？请用一句话解释',
    [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'claude', model: 'claude-3-5-sonnet' },
      { provider: 'qwen', model: 'qwen-plus' }
    ]
  );

  Object.entries(comparisons).forEach(([model, result]) => {
    console.log(`\n【${model}】: ${result}`);
  });

  // 3. 批量处理
  console.log('\n=== 批量处理 ===');
  const questions = [
    '什么是闭包？',
    '什么是Promise？',
    '什么是 async/await？'
  ];

  const batchResults = await llm.batchComplete(
    questions.map(prompt => ({ prompt, maxTokens: 200 }))
  );

  batchResults.forEach((result, i) => {
    console.log(`\nQ${i + 1}: ${questions[i]}`);
    console.log(`A: ${result.content}`);
  });
}

// 运行
main().catch(console.error);
```

---

## 3. Prompt工程

### 3.1 角色设定

角色设定是Prompt工程中最基础也最重要的技巧。通过为AI分配特定角色，可以显著提升回答的专业性和针对性。

**角色设定的核心要素**：

```typescript
/**
 * 角色设定的最佳实践
 */

// ❌ 弱角色设定
const weakPrompt = '帮我写一段代码';

// ✅ 强角色设定
const strongPrompt = `你是一位具有10年经验的高级前端架构师。
专长领域：
- React、Vue、Angular等主流框架
- TypeScript类型系统设计
- 前端性能优化
- 微前端架构

请为我的React应用提供代码重构建议。`;
```

**复合角色设定**：

```typescript
/**
 * 复合角色设定
 * 同时指定身份、专业领域、回答风格
 */
interface RoleConfiguration {
  identity: string;        // 身份
  expertise: string[];     // 专业领域
  behavior: string[];      // 行为规范
  outputFormat?: string;   // 输出格式
  constraints?: string[];  // 限制条件
}

const expertRole: RoleConfiguration = {
  identity: '你是一位全栈技术顾问',

  expertise: [
    'Node.js后端架构设计',
    'React前端性能优化',
    '数据库设计与优化',
    '微服务架构'
  ],

  behavior: [
    '提供代码示例时附带详细注释',
    '先分析问题再给出解决方案',
    '指出潜在的坑和最佳实践'
  ],

  outputFormat: `
    回答请包含：
    1. 简要分析（2-3句话）
    2. 解决方案（代码+说明）
    3. 注意事项（如果有问题）
  `,

  constraints: [
    '使用中文回答',
    '代码符合ESLint标准',
    '考虑生产环境可行性'
  ]
};

/**
 * 生成角色设定Prompt
 */
function generateRolePrompt(config: RoleConfiguration): string {
  let prompt = config.identity + '\n\n';

  prompt += '专长领域：\n';
  config.expertise.forEach(e => prompt += `- ${e}\n`);

  prompt += '\n行为规范：\n';
  config.behavior.forEach(b => prompt += `- ${b}\n`);

  if (config.outputFormat) {
    prompt += `\n${config.outputFormat}`;
  }

  if (config.constraints) {
    prompt += '\n限制条件：\n';
    config.constraints.forEach(c => prompt += `- ${c}\n`);
  }

  return prompt;
}

const rolePrompt = generateRolePrompt(expertRole);
console.log(rolePrompt);
```

### 3.2 Few-shot示例

Few-shot learning通过在Prompt中提供少量示例，让AI理解期望的输入输出模式。

**基础Few-shot**：

```typescript
/**
 * Few-shot Learning示例
 * 通过示例让AI理解任务模式
 */

const fewShotPrompt = `你是一个文本情感分类器。

示例：
输入："这个产品太棒了，非常满意！"
输出：正面

输入："质量很差，完全不值这个价"
输出：负面

输入："还行吧，中规中矩"
输出：中性

请分类以下文本：
输入："等了两个月才到，包装也破了"
输出：`;

/**
 * 实际调用
 */
async function fewShotExample() {
  const llm = new LLMClient();

  const response = await llm.complete({
    prompt: fewShotPrompt,
    maxTokens: 50
  });

  console.log('分类结果:', response.content);
  // 输出: 分类结果: 负面
}
```

**多示例Few-shot**：

```typescript
/**
 * 多示例Few-shot
 * 提供更多示例以提高准确性
 */

const multiShotPrompt = `你是一个SQL查询生成器。

根据自然语言描述生成SQL查询。

示例1：
描述：查找所有年龄大于30的员工
SQL：SELECT * FROM employees WHERE age > 30;

示例2：
描述：统计每个部门的员工数量
SQL：SELECT department_id, COUNT(*) as count FROM employees GROUP BY department_id;

示例3：
描述：查找工资最高的前5名员工
SQL：SELECT * FROM employees ORDER BY salary DESC LIMIT 5;

示例4：
描述：查找在2024年入职的工程师
SQL：SELECT * FROM employees WHERE hire_date >= '2024-01-01' AND position = 'Engineer';

请根据以下描述生成SQL：
描述：查找工资高于平均值的女性员工`;

/**
 * Chain-of-Thought + Few-shot
 * 示例中包含推理过程
 */

const cotFewShotPrompt = `你是一个数学解题助手。请展示解题步骤。

示例1：
问题：小明有10个苹果，给了小红3个，又买了5个，现在有多少个？
解题步骤：
1. 初始：10个苹果
2. 给出3个：10 - 3 = 7个
3. 购买5个：7 + 5 = 12个
答案：12个

示例2：
问题：一辆车以60km/h的速度行驶3小时，共行驶多远？
解题步骤：
1. 速度：60km/h
2. 时间：3小时
3. 距离 = 速度 × 时间 = 60 × 3 = 180km
答案：180km

请解题：
问题：一件商品原价200元，打8折后再减50元，最终价格是多少？`;
```

### 3.3 链式思考（Chain-of-Thought）

链式思考（CoT）是一种让AI逐步推理的技术，特别适合复杂问题。

**自洽性增强（Self-Consistency）**：

```typescript
/**
 * Chain-of-Thought推理
 * 让AI展示推理过程
 */

const cotPrompt = `请逐步推理以下问题：

问题：一个商店有15个苹果，卖掉了8个，又进货12个。现在有多少个苹果？

推理步骤：
`;

/**
 * 自洽性增强
 * 生成多个推理路径，选择最一致的答案
 */

interface ReasoningResult {
  reasoning: string;
  answer: string;
}

async function selfConsistencyPrompt(question: string, llm: LLMClient): Promise<string> {
  const prompt = `请用多种方法逐步推理以下问题，每种方法都要展示推理步骤：

问题：${question}

请给出至少3种不同的推理方法，然后总结最可能的答案。`;

  const response = await llm.complete({ prompt, maxTokens: 1500 });

  return response.content;
}

/**
 * 带验证的CoT
 */
async function verifiedCoT(problem: string, llm: LLMClient): Promise<string> {
  const prompt = `
请按以下步骤解决这个数学问题：

步骤1：理解问题 - 明确已知条件和求解目标
步骤2：制定计划 - 确定解题策略
步骤3：执行计算 - 展示每一步的计算过程
步骤4：验证结果 - 检查答案是否合理

问题：${problem}

解答：
`;

  const result = await llm.complete({ prompt, maxTokens: 1000 });

  // 验证步骤
  const verifyPrompt = `
请验证以下解答是否正确。如果错误，请指出错误并给出正确答案。

解答内容：
${result.content}

验证：
`;

  const verified = await llm.complete({ prompt: verifyPrompt, maxTokens: 500 });

  return verified.content;
}
```

### 3.4 实战：优化Prompt

以下是一个完整的Prompt优化框架：

```typescript
/**
 * Prompt优化框架
 * 包含常见的优化策略
 */

interface PromptTemplate {
  // 角色定义
  role?: string;

  // 任务描述
  task: string;

  // 输入格式
  inputFormat?: {
    field: string;
    description: string;
    example?: string;
  }[];

  // 输出格式
  outputFormat?: {
    field: string;
    description: string;
    example?: string;
  }[];

  // 约束条件
  constraints?: string[];

  // Few-shot示例
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];

  // 链式思考指令
  includeReasoning?: boolean;
  reasoningFormat?: 'step_by_step' | 'bullet' | 'numbered';
}

class PromptOptimizer {
  /**
   * 构建完整Prompt
   */
  static build(template: PromptTemplate): string {
    let prompt = '';

    // 1. 角色设定
    if (template.role) {
      prompt += `【角色】${template.role}\n\n`;
    }

    // 2. 任务描述
    prompt += `【任务】${template.task}\n\n`;

    // 3. 输入格式
    if (template.inputFormat && template.inputFormat.length > 0) {
      prompt += '【输入格式】\n';
      template.inputFormat.forEach(f => {
        prompt += `- ${f.field}：${f.description}`;
        if (f.example) {
          prompt += `\n  示例：${f.example}`;
        }
        prompt += '\n';
      });
      prompt += '\n';
    }

    // 4. 输出格式
    if (template.outputFormat && template.outputFormat.length > 0) {
      prompt += '【输出格式】\n';
      template.outputFormat.forEach(f => {
        prompt += `- ${f.field}：${f.description}`;
        if (f.example) {
          prompt += `\n  示例：${f.example}`;
        }
        prompt += '\n';
      });
      prompt += '\n';
    }

    // 5. 约束条件
    if (template.constraints && template.constraints.length > 0) {
      prompt += '【约束条件】\n';
      template.constraints.forEach(c => prompt += `- ${c}\n`);
      prompt += '\n';
    }

    // 6. Few-shot示例
    if (template.examples && template.examples.length > 0) {
      prompt += '【示例】\n';
      template.examples.forEach((ex, i) => {
        prompt += `示例${i + 1}：\n输入：${ex.input}\n输出：${ex.output}`;
        if (ex.explanation) {
          prompt += `\n解释：${ex.explanation}`;
        }
        prompt += '\n\n';
      });
    }

    // 7. 链式思考指令
    if (template.includeReasoning) {
      prompt += '【推理要求】\n';
      const format = template.reasoningFormat || 'step_by_step';

      switch (format) {
        case 'step_by_step':
          prompt += '请逐步推理，展示完整的思考过程。\n';
          break;
        case 'bullet':
          prompt += '请用要点列表形式展示推理过程。\n';
          break;
        case 'numbered':
          prompt += '请用编号列表形式展示推理步骤。\n';
          break;
      }
    }

    return prompt.trim();
  }

  /**
   * 优化现有Prompt
   */
  static optimize(prompt: string): string {
    // 检测是否缺少关键要素
    const hasRole = prompt.includes('你是') || prompt.includes('你是一个');
    const hasTask = prompt.includes('任务') || prompt.includes('请');

    let optimized = prompt;

    // 建议添加角色设定
    if (!hasRole) {
      console.log('建议：添加角色定义可以提升回答专业性');
    }

    // 建议明确输出格式
    if (!prompt.includes('格式') && !prompt.includes('输出')) {
      console.log('建议：明确输出格式可以让结果更结构化');
    }

    return optimized;
  }

  /**
   * Prompt版本管理
   */
  static createVersion(template: PromptTemplate, version: string): {
    version: string;
    prompt: string;
    metadata: {
      createdAt: string;
      wordCount: number;
      hasRole: boolean;
      hasExamples: boolean;
      hasConstraints: boolean;
    };
  } {
    return {
      version,
      prompt: this.build(template),
      metadata: {
        createdAt: new Date().toISOString(),
        wordCount: this.build(template).length,
        hasRole: !!template.role,
        hasExamples: !!template.examples && template.examples.length > 0,
        hasConstraints: !!template.constraints && template.constraints.length > 0
      }
    };
  }
}

// ==================== 使用示例 ====================

// 1. 创建代码审查Prompt
const codeReviewTemplate: PromptTemplate = {
  role: `你是一位资深代码审查专家，具有以下特点：
- 10年以上编程经验
- 精通多种编程语言
- 擅长发现潜在Bug和性能问题
- 熟悉最佳实践和设计模式`,

  task: '对提供的代码进行全面的代码审查',

  inputFormat: [
    {
      field: 'language',
      description: '编程语言',
      example: 'TypeScript'
    },
    {
      field: 'code',
      description: '待审查的代码',
      example: 'function add(a, b) { return a + b; }'
    }
  ],

  outputFormat: [
    {
      field: 'overall',
      description: '整体评价',
      example: '代码简洁明了，但存在类型安全隐患'
    },
    {
      field: 'issues',
      description: '发现的问题列表',
      example: '- 缺少参数类型注解\n- 未进行边界检查'
    },
    {
      field: 'suggestions',
      description: '改进建议',
      example: '- 添加TypeScript类型注解\n- 增加输入验证'
    }
  ],

  constraints: [
    '只指出问题，不直接修改代码',
    '问题按严重程度排序',
    '用中文回答'
  ],

  includeReasoning: true,
  reasoningFormat: 'numbered'
};

// 构建Prompt
const codeReviewPrompt = PromptOptimizer.build(codeReviewTemplate);
console.log('生成的Prompt:\n', codeReviewPrompt);

// 版本管理
const v1 = PromptOptimizer.createVersion(codeReviewTemplate, '1.0.0');
console.log('Prompt版本:', v1.version);
console.log('元数据:', v1.metadata);
```

---

## 4. RAG检索增强

### 4.1 向量数据库

向量数据库是RAG系统的核心组件，用于存储和检索语义相似的内容。

**主流向量数据库对比**：

| 数据库 | 特点 | 适用场景 | 部署方式 |
|--------|------|----------|----------|
| **Pinecone** | 云原生、性能优秀 | 企业级应用 | 完全托管 |
| **Milvus** | 开源、可私有部署 | 数据敏感型 | 自托管/云 |
| **Weaviate** | 混合搜索强 | 混合检索 | 自托管/云 |
| **Chroma** | 轻量级、易上手 | 原型开发 | 本地/嵌入式 |
| **Qdrant** | 高性能Rust实现 | 实时检索 | 自托管/云 |
| **PGVector** | 基于PostgreSQL | 已有PG栈 | Postgres扩展 |

**向量数据库安装与配置**：

```bash
# 使用Docker安装Milvus（推荐生产环境）
docker pull milvusdb/milvus:v2.4.0
docker run -d \
  --name milvus-etcd \
  -p 2379:2379 \
  -p 2381:2381 \
  quay.io/coreos/etcd:v3.5.5

docker run -d \
  --name milvus-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio:RELEASE.2023-03-20T20-16-18Z

docker run -d \
  --name milvus-standalone \
  -p 19530:19530 \
  -p 9091:9091 \
  --env ETCD_ENDPOINTS="milvus-etcd:2379" \
  --env MINIO_ADDRESS="milvus-minio:9000" \
  milvusdb/milvus:v2.4.0

# 安装Node.js SDK
npm install @zilliz/milvus2-sdk-node
npm install langchain @langchain/community
```

```typescript
/**
 * Milvus向量数据库集成
 */

// ============ Milvus客户端配置 ============

import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

class VectorStore {
  private client: MilvusClient;
  private collectionName: string;

  constructor() {
    this.client = new MilvusClient({
      address: 'localhost:19530'
    });
    this.collectionName = 'documents';
  }

  /**
   * 创建集合（Collection）
   * 类似SQL中的表概念
   */
  async createCollection() {
    // 检查集合是否存在
    const hasCollection = await this.client.hasCollection({
      collection_name: this.collectionName
    });

    if (!hasCollection) {
      // 创建集合并定义Schema
      await this.client.createCollection({
        collection_name: this.collectionName,
        description: '文档向量存储集合',
        fields: [
          {
            name: 'id',                    // 唯一ID
            data_type: DataType.VarChar,    // VarChar类型
            is_primary_key: true,          // 主键
            params: { max_length: 64 }
          },
          {
            name: 'document',               // 文档内容
            data_type: DataType.VarChar,
            params: { max_length: 65535 }   // 64KB
          },
          {
            name: 'embedding',              // 向量嵌入
            data_type: DataType.FloatVector,
            params: { dim: 1536 }           // OpenAI embedding维度
          },
          {
            name: 'metadata',               // 元数据
            data_type: DataType.VarChar,
            params: { max_length: 1000 }
          }
        ]
      });

      // 创建索引加速搜索
      await this.client.createIndex({
        collection_name: this.collectionName,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',            // 倒排索引
        metric_type: 'L2',                // 欧氏距离
        params: { nlist: 128 }
      });
    }
  }

  /**
   * 插入文档向量
   */
  async insertDocument(id: string, document: string, embedding: number[]) {
    const result = await this.client.insert({
      collection_name: this.collectionName,
      data: [{
        id,
        document,
        embedding,
        metadata: JSON.stringify({
          createdAt: new Date().toISOString(),
          source: 'user_input'
        })
      }]
    });

    // 插入后需要加载到内存才能搜索
    await this.client.loadCollection({
      collection_name: this.collectionName
    });

    return result;
  }

  /**
   * 相似度搜索
   */
  async search(queryEmbedding: number[], topK: number = 5) {
    const results = await this.client.search({
      collection_name: this.collectionName,
      vector: queryEmbedding,
      limit: topK,
      output_fields: ['id', 'document', 'metadata']  // 返回的字段
    });

    return results.map(result => ({
      id: result.id,
      document: result.entity.document,
      metadata: JSON.parse(result.entity.metadata),
      score: result.score  // 相似度分数
    }));
  }
}

// ============ 使用示例 ============

async function main() {
  const store = new VectorStore();

  // 创建集合
  await store.createCollection();
  console.log('集合创建成功');

  // 插入文档
  const documents = [
    {
      id: 'doc1',
      text: 'React是一个用于构建用户界面的JavaScript库',
      embedding: [0.1, 0.2, 0.3, ...]  // 实际使用OpenAI embedding生成
    },
    {
      id: 'doc2',
      text: 'Vue是一个渐进式JavaScript框架',
      embedding: [0.15, 0.25, 0.35, ...]
    },
    {
      id: 'doc3',
      text: 'Angular是Google开发的前端框架',
      embedding: [0.2, 0.3, 0.4, ...]
    }
  ];

  for (const doc of documents) {
    await store.insertDocument(doc.id, doc.text, doc.embedding);
  }
  console.log('文档插入成功');

  // 搜索相似文档
  const queryEmbedding = [0.12, 0.22, 0.32, ...];
  const results = await store.search(queryEmbedding, 2);
  console.log('搜索结果:', results);
}
```

### 4.2 Embedding生成

Embedding是将文本转换为向量表示的过程，是语义搜索的基础。

```typescript
/**
 * Embedding生成服务
 * 支持多种Embedding模型
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens: number;
}

class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * 使用OpenAI生成文本Embedding
   * text-embedding-3-small: 1536维度，轻量快速
   * text-embedding-3-large: 3072维度，更精确
   */
  async generate(text: string, model: string = 'text-embedding-3-small'): Promise<EmbeddingResult> {
    // 清理文本
    const cleanedText = text.trim().replace(/\n/g, ' ');

    const response = await this.openai.embeddings.create({
      model,
      input: cleanedText
    });

    return {
      embedding: response.data[0].embedding,
      model,
      tokens: response.usage.total_tokens
    };
  }

  /**
   * 批量生成Embedding
   * 适用于大量文档的处理
   */
  async generateBatch(texts: string[], model: string = 'text-embedding-3-small'): Promise<EmbeddingResult[]> {
    // OpenAI单次最多支持2048个文档
    const batchSize = 100;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const cleanedBatch = batch.map(t => t.trim().replace(/\n/g, ' '));

      const response = await this.openai.embeddings.create({
        model,
        input: cleanedBatch
      });

      response.data.forEach(data => {
        results.push({
          embedding: data.embedding,
          model,
          tokens: response.usage.total_tokens
        });
      });

      console.log(`已处理 ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
    }

    return results;
  }

  /**
   * 计算两个向量的余弦相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('向量维度不一致');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 中文Embedding（使用专门的模型）
   * 中文文本建议使用中文优化模型
   */
  async generateChinese(text: string): Promise<EmbeddingResult> {
    // 可以使用智谱、百度等中文优化模型
    // 这里以调用兼容API为例
    const response = await fetch('https://open.big.cn/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BIG_API_KEY}`
      },
      body: JSON.stringify({
        model: 'embedding-2',
        input: text
      })
    });

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      model: 'embedding-2',
      tokens: data.usage.total_tokens
    };
  }
}

// ==================== 使用示例 ====================

async function main() {
  const embeddingService = new EmbeddingService();

  // 单文本Embedding
  const result = await embeddingService.generate('人工智能正在改变世界');
  console.log('向量维度:', result.embedding.length);
  console.log('使用的模型:', result.model);

  // 批量生成
  const documents = [
    'React是一个用于构建用户界面的JavaScript库',
    'Vue是一个渐进式JavaScript框架',
    'Angular是Google开发的前端框架',
    'TypeScript是JavaScript的超集',
    'Node.js是JavaScript运行时'
  ];

  const batchResults = await embeddingService.generateBatch(documents);
  console.log('批量生成完成，数量:', batchResults.length);

  // 计算相似度
  const similarity = embeddingService.cosineSimilarity(
    batchResults[0].embedding,
    batchResults[1].embedding
  );
  console.log('React vs Vue 相似度:', similarity);
}
```

### 4.3 相似度检索

相似度检索是RAG系统的核心功能，通过向量距离判断语义相似性。

```typescript
/**
 * RAG检索系统
 * 完整的检索-增强-生成流程
 */

import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface Document {
  id: string;
  content: string;
  metadata: {
    title?: string;
    source?: string;
    createdAt?: string;
    category?: string;
  };
}

interface RetrievalResult {
  document: Document;
  score: number;
  highlights: string[];  // 高亮匹配的片段
}

class RAGRetrieval {
  private milvus: MilvusClient;
  private openai: OpenAI;
  private collectionName: string;

  constructor() {
    this.milvus = new MilvusClient({ address: 'localhost:19530' });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.collectionName = 'knowledge_base';
  }

  /**
   * 初始化向量数据库
   */
  async initialize() {
    // 检查集合是否存在
    const hasCollection = await this.milvus.hasCollection({
      collection_name: this.collectionName
    });

    if (!hasCollection) {
      await this.milvus.createCollection({
        collection_name: this.collectionName,
        fields: [
          { name: 'id', data_type: DataType.VarChar, is_primary_key: true, params: { max_length: 64 } },
          { name: 'content', data_type: DataType.VarChar, params: { max_length: 65535 } },
          { name: 'embedding', data_type: DataType.FloatVector, params: { dim: 1536 } },
          { name: 'title', data_type: DataType.VarChar, params: { max_length: 512 } },
          { name: 'source', data_type: DataType.VarChar, params: { max_length: 256 } },
          { name: 'category', data_type: DataType.VarChar, params: { max_length: 64 } }
        ]
      });

      // 创建索引
      await this.milvus.createIndex({
        collection_name: this.collectionName,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'COSINE'  // 余弦相似度
      });
    }
  }

  /**
   * 文本向量化
   */
  private async embedText(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }

  /**
   * 添加文档到知识库
   */
  async addDocument(doc: Document) {
    const embedding = await this.embedText(doc.content);

    await this.milvus.insert({
      collection_name: this.collectionName,
      data: [{
        id: doc.id,
        content: doc.content,
        embedding,
        title: doc.metadata.title || '',
        source: doc.metadata.source || '',
        category: doc.metadata.category || ''
      }]
    });

    await this.milvus.flush({ collection_name: this.collectionName });
    console.log(`文档已添加: ${doc.id}`);
  }

  /**
   * 批量添加文档
   */
  async addDocuments(docs: Document[]) {
    const batchSize = 50;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const vectors = await Promise.all(batch.map(d => this.embedText(d.content)));

      const data = batch.map((doc, index) => ({
        id: doc.id,
        content: doc.content,
        embedding: vectors[index],
        title: doc.metadata.title || '',
        source: doc.metadata.source || '',
        category: doc.metadata.category || ''
      }));

      await this.milvus.insert({ collection_name: this.collectionName, data });

      console.log(`已处理 ${Math.min(i + batchSize, docs.length)}/${docs.length}`);
    }

    await this.milvus.flush({ collection_name: this.collectionName });
  }

  /**
   * 检索相关文档
   */
  async retrieve(query: string, topK: number = 5, category?: string): Promise<RetrievalResult[]> {
    // 将查询向量化
    const queryEmbedding = await this.embedText(query);

    // 构建搜索参数
    const searchParams: any = {
      collection_name: this.collectionName,
      vector: queryEmbedding,
      limit: topK,
      output_fields: ['id', 'content', 'title', 'source', 'category']
    };

    // 如果指定了分类，添加过滤条件
    if (category) {
      searchParams.filter = `category == "${category}"`;
    }

    const results = await this.milvus.search(searchParams);

    return results.map(result => {
      // 简单的关键词高亮
      const content = result.entity.content as string;
      const highlights = this.extractHighlights(content, query);

      return {
        document: {
          id: result.id,
          content,
          metadata: {
            title: result.entity.title,
            source: result.entity.source,
            category: result.entity.category
          }
        },
        score: result.score,
        highlights
      };
    });
  }

  /**
   * 提取高亮片段
   */
  private extractHighlights(content: string, query: string): string[] {
    const keywords = query.split(/\s+/).filter(t => t.length > 2);
    const highlights: string[] = [];

    for (const keyword of keywords) {
      const index = content.indexOf(keyword);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + keyword.length + 30);
        highlights.push('...' + content.slice(start, end) + '...');
      }
    }

    return highlights.slice(0, 3);  // 最多返回3个高亮
  }

  /**
   * RAG完整流程：检索 + 生成
   */
  async ragQuery(userQuery: string, systemContext?: string): Promise<{
    answer: string;
    sources: { id: string; content: string; score: number }[];
  }> {
    // 1. 检索相关文档
    const retrieved = await this.retrieve(userQuery, 5);

    if (retrieved.length === 0) {
      return {
        answer: '抱歉，知识库中没有找到与您问题相关的信息。',
        sources: []
      };
    }

    // 2. 构建增强上下文
    const context = retrieved
      .map(r => `[来源 ${r.document.metadata.source || r.document.id}]: ${r.document.content}`)
      .join('\n\n');

    // 3. 构建Prompt
    const prompt = `基于以下参考资料回答用户问题。如果资料中没有相关信息，请说明不知道。

参考资料：
${context}

用户问题：${userQuery}

回答要求：
1. 先列出参考的资料来源
2. 结合资料给出回答
3. 如果资料不足，说明信息来源有限`;

    // 4. 调用LLM生成回答
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3  // 较低的temperature以保持准确性
    });

    return {
      answer: response.choices[0].message.content!,
      sources: retrieved.map(r => ({
        id: r.document.id,
        content: r.document.content.slice(0, 200) + '...',
        score: r.score
      }))
    };
  }
}

// ==================== 使用示例 ====================

async function main() {
  const rag = new RAGRetrieval();
  await rag.initialize();

  // 添加示例文档
  const documents: Document[] = [
    {
      id: 'react-1',
      content: 'React是由Facebook开发的用于构建用户界面的JavaScript库。它采用组件化开发模式，支持虚拟DOM以提升性能。',
      metadata: { title: 'React简介', source: '官方文档', category: 'frontend' }
    },
    {
      id: 'react-2',
      content: 'React Hooks是React 16.8引入的新特性，允许在函数组件中使用状态和其他React特性。常用的Hook包括useState、useEffect、useContext等。',
      metadata: { title: 'React Hooks', source: '官方文档', category: 'frontend' }
    },
    {
      id: 'vue-1',
      content: 'Vue.js是一个渐进式JavaScript框架，由尤雨溪创建。它的核心库只关注视图层，学习曲线平缓，易于上手。',
      metadata: { title: 'Vue简介', source: '官方文档', category: 'frontend' }
    }
  ];

  await rag.addDocuments(documents);
  console.log('文档添加完成');

  // RAG查询
  const result = await rag.ragQuery('React的Hook是什么？有什么常用Hook？');

  console.log('\n=== 回答 ===');
  console.log(result.answer);

  console.log('\n=== 参考来源 ===');
  result.sources.forEach(s => {
    console.log(`- ${s.id} (相似度: ${s.score.toFixed(4)})`);
  });
}

// main();
```

### 4.4 实战：RAG实现

完整的RAG系统包含文档处理、向量化、存储和检索的全流程：

```typescript
/**
 * 完整RAG系统实现
 * 从文档处理到问答的完整流程
 */

import * as fs from 'fs';
import * as path from 'path';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

interface Chunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    startLine: number;
    endLine: number;
  };
}

interface ProcessedDocument {
  id: string;
  chunks: Chunk[];
}

// ==================== 文档处理器 ====================

class DocumentProcessor {
  /**
   * 文本分块策略
   * 常用方法：固定大小重叠、语义分块
   */

  /**
   * 固定大小分块（带重叠）
   */
  static chunkBySize(
    text: string,
    chunkSize: number = 500,
    overlap: number := 50
  ): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[。！？\n]/);  // 按句子分割

    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // 保持重叠部分
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + sentence;
        currentLength = overlapText.length;
      } else {
        currentChunk += sentence;
        currentLength += sentenceLength;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 语义分块（按段落和主题边界）
   */
  static chunkByParagraph(text: string, maxChunkSize: number = 500): string[] {
    const paragraphs = text.split(/\n\n+/);  // 按双换行分割
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // 如果单个段落过长，再按句子分割
        if (paragraph.length > maxChunkSize) {
          const subChunks = this.chunkBySize(paragraph, maxChunkSize);
          chunks.push(...subChunks.slice(0, -1));
          currentChunk = subChunks[subChunks.length - 1];
        } else {
          currentChunk = paragraph;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 从文件读取并分块
   */
  static async processFile(filePath: string): Promise<Chunk[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = this.chunkByParagraph(content);

    return chunks.map((content, index) => ({
      id: `${path.basename(filePath, path.extname(filePath))}_chunk_${index}`,
      content,
      metadata: {
        source: filePath,
        startLine: 0,
        endLine: 0
      }
    }));
  }
}

// ==================== RAG系统主类 ====================

class RAGSystem {
  private milvus: MilvusClient;
  private openai: OpenAI;
  private collectionName: string;

  constructor() {
    this.milvus = new MilvusClient({ address: 'localhost:19530' });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.collectionName = 'knowledge_base';
  }

  /**
   * 初始化系统
   */
  async initialize() {
    await this.ensureCollection();
    console.log('RAG系统初始化完成');
  }

  /**
   * 确保集合存在
   */
  private async ensureCollection() {
    const exists = await this.milvus.hasCollection({
      collection_name: this.collectionName
    });

    if (!exists) {
      await this.milvus.createCollection({
        collection_name: this.collectionName,
        fields: [
          { name: 'id', data_type: DataType.VarChar, is_primary_key: true, params: { max_length: 128 } },
          { name: 'content', data_type: DataType.VarChar, params: { max_length: 65535 } },
          { name: 'embedding', data_type: DataType.FloatVector, params: { dim: 1536 } },
          { name: 'source', data_type: DataType.VarChar, params: { max_length: 256 } }
        ]
      });

      await this.milvus.createIndex({
        collection_name: this.collectionName,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'COSINE'
      });
    }

    await this.milvus.loadCollection({ collection_name: this.collectionName });
  }

  /**
   * 向量化文本
   */
  private async embed(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts
    });

    return response.data.map(d => d.embedding);
  }

  /**
   * 索引文档
   */
  async indexDocuments(chunks: Chunk[]) {
    console.log(`开始索引 ${chunks.length} 个文档块...`);

    // 批量向量化
    const texts = chunks.map(c => c.content);
    const embeddings = await this.embed(texts);

    // 批量插入
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = embeddings.slice(i, i + batchSize);

      const data = batch.map((chunk, index) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: vectors[index],
        source: chunk.metadata.source
      }));

      await this.milvus.insert({ collection_name: this.collectionName, data });
      console.log(`已索引 ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
    }

    await this.milvus.flush({ collection_name: this.collectionName });
    console.log('索引完成');
  }

  /**
   * 检索
   */
  async retrieve(query: string, topK: number = 5): Promise<{ chunk: Chunk; score: number }[]> {
    const queryEmbedding = await this.embed([query]);
    const results = await this.milvus.search({
      collection_name: this.collectionName,
      vector: queryEmbedding[0],
      limit: topK,
      output_fields: ['id', 'content', 'source']
    });

    return results.map(r => ({
      chunk: {
        id: r.id,
        content: r.entity.content as string,
        metadata: { source: r.entity.source as string }
      },
      score: r.score
    }));
  }

  /**
   * 问答
   */
  async query(
    question: string,
    systemPrompt?: string
  ): Promise<{
    answer: string;
    sources: { id: string; content: string; score: number }[];
  }> {
    // 1. 检索相关块
    const retrieved = await this.retrieve(question, 5);

    if (retrieved.length === 0) {
      return {
        answer: '抱歉，我在知识库中没有找到相关信息。',
        sources: []
      };
    }

    // 2. 构建上下文
    const context = retrieved
      .map(r => `[${r.chunk.metadata.source}] ${r.chunk.content}`)
      .join('\n\n');

    // 3. 构建Prompt
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({
      role: 'user',
      content: `请基于以下参考资料回答问题。回答后请标注参考来源。

参考资料：
${context}

问题：${question}

回答格式：
1. 回答内容...
参考来源：${retrieved.map(r => r.chunk.metadata.source).join('、')}
`
    });

    // 4. 生成回答
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1500,
      temperature: 0.3
    });

    return {
      answer: response.choices[0].message.content!,
      sources: retrieved.map(r => ({
        id: r.chunk.id,
        content: r.chunk.content.slice(0, 150) + '...',
        score: r.score
      }))
    };
  }

  /**
   * 从目录批量导入文档
   */
  async indexDirectory(dirPath: string, fileExtensions: string[] = ['.txt', '.md', '.pdf']) {
    const files: string[] = [];

    // 递归查找文件
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (fileExtensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dirPath);
    console.log(`找到 ${files.length} 个文档`);

    // 处理所有文件
    const allChunks: Chunk[] = [];
    for (const file of files) {
      const chunks = await DocumentProcessor.processFile(file);
      allChunks.push(...chunks);
      console.log(`处理完成: ${file} (${chunks.length} 块)`);
    }

    // 索引
    await this.indexDocuments(allChunks);
  }
}

// ==================== 使用示例 ====================

async function main() {
  const rag = new RAGSystem();
  await rag.initialize();

  // 索引目录（假设有docs目录）
  // await rag.indexDirectory('./docs');
  // console.log('目录索引完成');

  // 问答示例
  const result = await rag.query(
    'React的useEffect Hook有什么用途？',
    '你是一个专业的技术文档助手，擅长从参考资料中提取准确信息。'
  );

  console.log('\n=== 回答 ===');
  console.log(result.answer);

  console.log('\n=== 参考来源 ===');
  result.sources.forEach(s => {
    console.log(`[${s.id}] 相似度: ${s.score.toFixed(4)}`);
    console.log(`内容: ${s.content}\n`);
  });
}

// main();
```

---

## 5. Agent开发

### 5.1 Tool Use（工具调用）

Tool Use是Agent能力的基础，让AI能够调用外部系统执行实际操作。

```typescript
/**
 * 工具调用系统
 * 实现Agent与外部世界的交互
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 工具定义 ====================

/**
 * 工具接口定义
 */
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

interface ToolResult {
  toolCallId: string;
  result: any;
  success: boolean;
  error?: string;
}

/**
 * 工具注册表
 */
class ToolRegistry {
  private tools: Map<string, Tool>;
  private implementations: Map<string, Function>;

  constructor() {
    this.tools = new Map();
    this.implementations = new Map();
  }

  /**
   * 注册工具
   */
  register(
    name: string,
    description: string,
    parameters: Tool['parameters'],
    implementation: Function
  ) {
    this.tools.set(name, { name, description, parameters });
    this.implementations.set(name, implementation);
    console.log(`工具已注册: ${name}`);
  }

  /**
   * 获取所有工具
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 执行工具
   */
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const implementation = this.implementations.get(toolCall.name);

    if (!implementation) {
      return {
        toolCallId: toolCall.id,
        result: null,
        success: false,
        error: `未知工具: ${toolCall.name}`
      };
    }

    try {
      const result = await implementation(toolCall.arguments);
      return {
        toolCallId: toolCall.id,
        result,
        success: true
      };
    } catch (error: any) {
      return {
        toolCallId: toolCall.id,
        result: null,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量执行工具
   */
  async executeAll(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map(call => this.execute(call)));
  }
}

// ==================== 预定义工具 ====================

const registry = new ToolRegistry();

// 1. 搜索工具
registry.register(
  'search',
  '搜索互联网获取最新信息',
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      limit: { type: 'number', description: '返回结果数量', default: 5 }
    },
    required: ['query']
  },
  async (args: { query: string; limit?: number }) => {
    // 实际项目中调用搜索API
    console.log(`搜索: ${args.query}`);
    return {
      results: [
        { title: '示例结果1', url: 'https://example.com/1', snippet: '这是搜索结果示例...' },
        { title: '示例结果2', url: 'https://example.com/2', snippet: '这是另一个结果...' }
      ]
    };
  }
);

// 2. 计算器工具
registry.register(
  'calculate',
  '执行数学计算',
  {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '数学表达式，如 2+2*3' }
    },
    required: ['expression']
  },
  async (args: { expression: string }) => {
    // 安全计算（实际项目应使用专门的计算库或沙箱）
    try {
      // 警告：实际项目不要用eval，应使用数学表达式解析库
      const result = Function(`"use strict"; return (${args.expression})`)();
      return { expression: args.expression, result };
    } catch (e: any) {
      throw new Error(`计算错误: ${e.message}`);
    }
  }
);

// 3. 文件读取工具
registry.register(
  'read_file',
  '读取文件内容',
  {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' },
      lines: { type: 'number', description: '最多读取行数', default: 100 }
    },
    required: ['path']
  },
  async (args: { path: string; lines?: number }) => {
    const fs = require('fs');
    try {
      const content = fs.readFileSync(args.path, 'utf-8');
      const lineArray = content.split('\n');
      return {
        path: args.path,
        totalLines: lineArray.length,
        content: lineArray.slice(0, args.lines || 100).join('\n')
      };
    } catch (e: any) {
      throw new Error(`读取文件失败: ${e.message}`);
    }
  }
);

// 4. 天气查询工具
registry.register(
  'weather',
  '查询指定城市的天气',
  {
    type: 'object',
    properties: {
      city: { type: 'string', description: '城市名称' },
      unit: { type: 'string', enum: ['celsius', 'fahrenheit'], default: 'celsius' }
    },
    required: ['city']
  },
  async (args: { city: string; unit?: 'celsius' | 'fahrenheit' }) => {
    // 模拟天气数据
    return {
      city: args.city,
      temperature: 22,
      unit: args.unit || 'celsius',
      condition: '多云',
      humidity: 65,
      windSpeed: '12km/h'
    };
  }
);

// 5. 代码执行工具
registry.register(
  'execute_code',
  '执行代码片段（JavaScript）',
  {
    type: 'object',
    properties: {
      code: { type: 'string', description: '要执行的JavaScript代码' },
      timeout: { type: 'number', description: '超时时间(毫秒)', default: 5000 }
    },
    required: ['code']
  },
  async (args: { code: string; timeout?: number }) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`执行超时 (${args.timeout}ms)`));
      }, args.timeout || 5000);

      try {
        // 警告：实际项目应使用沙箱环境
        const result = eval(args.code);
        clearTimeout(timeoutId);
        resolve({ result, type: typeof result });
      } catch (e: any) {
        clearTimeout(timeoutId);
        reject(new Error(`执行错误: ${e.message}`));
      }
    });
  }
);
```

### 5.2 ReAct模式

ReAct（Reasoning + Acting）模式让Agent能够先推理再行动，形成思考-行动-观察的循环。

```typescript
/**
 * ReAct Agent实现
 * 推理-行动-观察的循环模式
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface ReActStep {
  thought: string;      // 思考：分析当前情况
  action: string;       // 行动：决定采取什么行动
  actionInput: any;     // 行动输入：行动需要什么参数
  observation: any;     // 观察：行动的结果
  reflection?: string;  // 反思：结果如何，是否需要调整
}

interface AgentResponse {
  finalAnswer: string;
  steps: ReActStep[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

class ReActAgent {
  private openai: OpenAI;
  private tools: Tool[];
  private toolRegistry: ToolRegistry;
  private maxIterations: number;

  constructor(toolRegistry: ToolRegistry, maxIterations: number = 10) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.toolRegistry = toolRegistry;
    this.tools = toolRegistry.getTools();
    this.maxIterations = maxIterations;
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    const toolDescriptions = this.tools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `你是一个智能助手，使用ReAct模式（推理-行动-观察）来解决问题。

## 可用工具
${toolDescriptions}

## 工作流程
对于每个用户问题，你将按以下步骤循环：

1. **思考（Thought）**：分析当前情况，确定下一步行动
2. **行动（Action）**：选择合适的工具并提供参数
3. **观察（Observation）**：获取工具执行结果
4. **反思（Reflection）**：（可选）根据结果调整策略

## 输出格式
请按以下JSON格式输出每一步：
{
  "thought": "你的思考过程",
  "action": "工具名称",
  "actionInput": { "参数名": "参数值" },
  "observation": "工具执行结果",
  "reflection": "反思（仅在需要时填写）"
}

当问题已经解决时，在最后一步的thought中说明"最终答案"，并在observation中给出完整答案。

## 限制
- 最多执行${this.maxIterations}步
- 如果工具执行失败，尝试其他方法
- 始终基于观察结果做决策`;
  }

  /**
   * 执行ReAct循环
   */
  async run(query: string): Promise<AgentResponse> {
    const steps: ReActStep[] = [];
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    let context = '';
    let iterations = 0;
    let finalAnswer = '';

    while (iterations < this.maxIterations) {
      iterations++;

      // 构建当前上下文
      const currentPrompt = `${this.buildSystemPrompt()}

## 对话历史
${context}

## 当前问题
${query}

请按JSON格式输出你的思考和行动。`;

      // 调用LLM
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: currentPrompt }],
        max_tokens: 2000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content!;

      // 解析JSON（处理可能的markdown代码块）
      let stepJson: any;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const jsonStr = jsonMatch[1] || content;
        stepJson = JSON.parse(jsonStr.trim());
      } catch (e) {
        // 如果解析失败，尝试继续对话
        context += `\n\n【系统】无法解析你的响应，请按正确的JSON格式输出。`;
        continue;
      }

      const step: ReActStep = {
        thought: stepJson.thought,
        action: stepJson.action,
        actionInput: stepJson.actionInput || {},
        observation: stepJson.observation
      };

      // 检查是否达到最终答案
      if (step.thought.includes('最终答案') || step.thought.includes('完成')) {
        finalAnswer = step.observation;
        steps.push(step);
        break;
      }

      // 执行工具
      if (step.action && step.action !== 'none') {
        const toolCall: ToolCall = {
          id: `call_${iterations}`,
          name: step.action,
          arguments: step.actionInput
        };

        const result = await this.toolRegistry.execute(toolCall);
        toolCalls.push(toolCall);
        toolResults.push(result);

        step.observation = result.success
          ? JSON.stringify(result.result)
          : `错误: ${result.error}`;

        // 更新上下文
        context += `\n\n【步骤 ${iterations}】`;
        context += `\n思考: ${step.thought}`;
        context += `\n行动: ${step.action}(${JSON.stringify(step.actionInput)})`;
        context += `\n观察: ${step.observation}`;
      } else {
        context += `\n\n【步骤 ${iterations}】`;
        context += `\n思考: ${step.thought}`;
        context += `\n观察: ${step.observation || '无需行动，继续分析...'}`;
      }

      steps.push(step);
    }

    return {
      finalAnswer: finalAnswer || '在最大迭代次数内未找到答案',
      steps,
      toolCalls,
      toolResults
    };
  }

  /**
   * 格式化输出
   */
  static formatResponse(response: AgentResponse): string {
    let output = '## 执行过程\n\n';

    response.steps.forEach((step, i) => {
      output += `### 步骤 ${i + 1}\n`;
      output += `- **思考**: ${step.thought}\n`;
      output += `- **行动**: ${step.action || '无'}\n`;
      if (step.actionInput && Object.keys(step.actionInput).length > 0) {
        output += `- **参数**: ${JSON.stringify(step.actionInput)}\n`;
      }
      output += `- **观察**: ${step.observation}\n\n`;
    });

    output += `## 最终答案\n${response.finalAnswer}`;

    return output;
  }
}

// ==================== 使用示例 ====================

async function main() {
  const agent = new ReActAgent(registry, 8);

  console.log('=== ReAct Agent Demo ===\n');

  const result = await agent.run(
    '我想知道今天北京的天气如何，并且帮我计算一下如果我以50km/h的速度行驶100公里需要多少时间'
  );

  console.log(ReActAgent.formatResponse(result));

  console.log('\n=== 工具调用统计 ===');
  console.log(`共执行 ${result.toolCalls.length} 次工具调用`);
  result.toolCalls.forEach((call, i) => {
    const result = result.toolResults[i];
    console.log(`- ${call.name}: ${result.success ? '成功' : '失败'}`);
  });
}

// main();
```

### 5.3 规划与执行

规划与执行（Plan-and-Execute）模式是一种更高级的Agent架构，先制定完整计划再逐步执行。

```typescript
/**
 * Plan-and-Execute Agent
 * 先规划后执行的Agent模式
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface PlanStep {
  id: number;
  task: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface ExecutionResult {
  success: boolean;
  steps: PlanStep[];
  finalResult: any;
  totalTime: number;
}

class PlanAndExecuteAgent {
  private openai: OpenAI;
  private toolRegistry: ToolRegistry;
  private maxRetries: number;

  constructor(toolRegistry: ToolRegistry) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.toolRegistry = toolRegistry;
    this.maxRetries = 3;
  }

  /**
   * 规划阶段：将任务分解为可执行的步骤
   */
  async plan(task: string): Promise<PlanStep[]> {
    const tools = this.toolRegistry.getTools();
    const toolDescriptions = tools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    const prompt = `分析以下任务，将其分解为具体的执行步骤。

任务：${task}

可用工具：
${toolDescriptions}

请以JSON数组格式输出执行计划，每个步骤包含：
- task: 步骤任务描述
- tool: 要使用的工具名称
- parameters: 工具参数

确保：
1. 步骤之间有依赖关系，前一步输出作为后一步输入
2. 每个步骤都是具体可执行的
3. 按逻辑顺序排列步骤`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.5
    });

    const content = response.choices[0].message.content!;

    // 解析JSON
    let planData: any[];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      planData = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.log('解析计划失败，尝试直接解析...');
      planData = [{ task, tool: 'none', parameters: {} }];
    }

    return planData.map((item, index) => ({
      id: index + 1,
      task: item.task,
      tool: item.tool,
      parameters: item.parameters || {},
      status: 'pending' as const
    }));
  }

  /**
   * 执行阶段：按照计划执行每个步骤
   */
  async execute(steps: PlanStep[]): Promise<ExecutionResult> {
    const startTime = Date.now();
    let context: Record<string, any> = {};  // 步骤间共享上下文

    for (const step of steps) {
      console.log(`\n[执行步骤 ${step.id}] ${step.task}`);

      step.status = 'executing';

      let retries = 0;
      let success = false;

      while (retries < this.maxRetries && !success) {
        try {
          // 如果步骤需要前面的结果作为输入
          if (step.parameters.dependsOn) {
            step.parameters = { ...step.parameters, ...context };
          }

          const result = await this.toolRegistry.execute({
            id: `plan_step_${step.id}`,
            name: step.tool,
            arguments: step.parameters
          });

          if (result.success) {
            step.result = result.result;
            step.status = 'completed';
            context[`step_${step.id}`] = result.result;  // 保存到共享上下文
            console.log(`  ✓ 完成`);
            success = true;
          } else {
            throw new Error(result.error);
          }
        } catch (error: any) {
          retries++;
          console.log(`  ✗ 失败: ${error.message} (重试 ${retries}/${this.maxRetries})`);

          if (retries >= this.maxRetries) {
            step.status = 'failed';
            step.error = error.message;
            console.log(`  ✗ 步骤失败`);
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const allCompleted = steps.every(s => s.status === 'completed');

    return {
      success: allCompleted,
      steps,
      finalResult: allCompleted ? context : null,
      totalTime
    };
  }

  /**
   * 完整运行：规划 + 执行
   */
  async run(task: string): Promise<ExecutionResult> {
    console.log('='.repeat(50));
    console.log('Plan-and-Execute Agent');
    console.log('='.repeat(50));
    console.log(`\n任务: ${task}\n`);

    // 阶段1: 规划
    console.log('【阶段1: 规划】');
    const steps = await this.plan(task);
    console.log(`生成 ${steps.length} 个执行步骤`);
    steps.forEach(step => {
      console.log(`  ${step.id}. [${step.tool}] ${step.task}`);
    });

    // 阶段2: 执行
    console.log('\n【阶段2: 执行】');
    const result = await this.execute(steps);

    // 输出结果
    console.log('\n' + '='.repeat(50));
    console.log('执行结果');
    console.log('='.repeat(50));
    console.log(`成功: ${result.success}`);
    console.log(`总耗时: ${result.totalTime}ms`);

    if (result.success) {
      console.log('\n最终结果:');
      console.log(JSON.stringify(result.finalResult, null, 2));
    } else {
      console.log('\n失败的步骤:');
      result.steps
        .filter(s => s.status === 'failed')
        .forEach(s => console.log(`  - ${s.task}: ${s.error}`));
    }

    return result;
  }

  /**
   * 重规划：当步骤失败时调整计划
   */
  async replan(failedStep: PlanStep, context: Record<string, any>): Promise<PlanStep[]> {
    const prompt = `前一个执行计划中的步骤 ${failedStep.id} 失败了。

失败步骤：${failedStep.task}
错误原因：${failedStep.error}

当前上下文：
${JSON.stringify(context, null, 2)}

请提出补救计划，以JSON数组格式输出新的步骤。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    });

    // 解析并返回新步骤
    // ...
    return [];
  }
}

// ==================== 使用示例 ====================

async function main() {
  const agent = new PlanAndExecuteAgent(registry);

  const result = await agent.run(
    '帮我查询北京的天气，计算如果下雨我需要带伞的概率，然后计划一下出门时间'
  );
}

// main();
```

### 5.4 实战：AI助手

完整的AI助手实现，整合对话管理、工具调用和上下文记忆：

```typescript
/**
 * AI智能助手
 * 整合对话管理、工具调用、上下文记忆的完整实现
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  timestamp: number;
}

interface ConversationContext {
  messages: Message[];
  toolResults: Map<string, any>;
  metadata: {
    startedAt: number;
    lastActiveAt: number;
    messageCount: number;
  };
}

// ==================== AI助手主类 ====================

class AIAssistant {
  private openai: OpenAI;
  private toolRegistry: ToolRegistry;
  private conversationContext: ConversationContext;
  private systemPrompt: string;

  constructor(toolRegistry: ToolRegistry) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.toolRegistry = toolRegistry;
    this.conversationContext = this.initContext();
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * 初始化对话上下文
   */
  private initContext(): ConversationContext {
    return {
      messages: [],
      toolResults: new Map(),
      metadata: {
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        messageCount: 0
      }
    };
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    const tools = this.toolRegistry.getTools();

    return `你是一个智能AI助手，名为"小助手"。

## 你的能力
- 回答各类问题，提供准确、有用的信息
- 使用工具完成复杂任务
- 进行代码编写和分析
- 提供学习和工作建议

## 可用工具
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## 对话规则
1. 如果用户的问题需要使用工具，明确说明要使用的工具
2. 工具执行完成后，基于结果回答用户
3. 如果工具执行失败，告知用户并尝试解释原因
4. 保持回答简洁、有条理

## 回答风格
- 使用友好的语气
- 复杂问题分点说明
- 代码示例带注释
- 不确定的问题承认不知道`;
  }

  /**
   * 发送消息
   */
  async send(
    userMessage: string,
    options?: {
      stream?: boolean;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
  }> {
    // 添加用户消息
    this.addMessage('user', userMessage);

    // 构建消息历史
    const messages = this.buildMessages();

    // 调用LLM
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: this.buildTools(),
      tool_choice: 'auto',
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      stream: options?.stream || false
    });

    const assistantMessage = response.choices[0].message;

    // 处理工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // 添加助手消息（包含工具调用）
      this.addMessage('assistant', assistantMessage.content || '', {
        toolCalls: assistantMessage.tool_calls.map(c => ({
          id: c.id,
          name: c.function.name,
          arguments: JSON.parse(c.function.arguments)
        }))
      });

      // 执行工具
      const toolCalls = assistantMessage.tool_calls.map(c => ({
        id: c.id,
        name: c.function.name,
        arguments: JSON.parse(c.function.arguments)
      }));

      const toolResults = await this.executeTools(toolCalls);

      // 添加工具结果消息
      for (const result of toolResults) {
        this.addMessage('tool', JSON.stringify(result.result), {
          toolCallId: result.toolCallId,
          toolName: this.getToolNameById(result.toolCallId, toolCalls)
        });
      }

      // 再次调用LLM生成最终回答
      const finalMessages = this.buildMessages();
      const finalResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: finalMessages,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7
      });

      const finalContent = finalResponse.choices[0].message.content!;
      this.addMessage('assistant', finalContent);

      return { content: finalContent, toolCalls, toolResults };
    }

    // 无工具调用，直接返回
    this.addMessage('assistant', assistantMessage.content || '');
    return { content: assistantMessage.content || '' };
  }

  /**
   * 流式发送消息
   */
  async *sendStream(
    userMessage: string,
    options?: { maxTokens?: number; temperature?: number }
  ): AsyncGenerator<string> {
    this.addMessage('user', userMessage);
    const messages = this.buildMessages();

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: this.buildTools(),
      tool_choice: 'auto',
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      stream: true
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        yield content;
      }
    }

    // 工具调用处理...
    // ... (类似send方法中的处理)
  }

  /**
   * 添加消息到上下文
   */
  private addMessage(
    role: Message['role'],
    content: string,
    metadata?: { toolCallId?: string; toolName?: string; toolCalls?: ToolCall[] }
  ) {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    };

    this.conversationContext.messages.push(message);
    this.conversationContext.metadata.lastActiveAt = Date.now();
    this.conversationContext.metadata.messageCount++;
  }

  /**
   * 构建消息历史
   */
  private buildMessages(): any[] {
    const messages: any[] = [{ role: 'system', content: this.systemPrompt }];

    // 限制历史消息长度（节省token）
    const recentMessages = this.conversationContext.messages.slice(-20);

    for (const msg of recentMessages) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: msg.content
        });
      } else if (msg.role === 'assistant' && (msg as any).toolCalls) {
        messages.push({
          role: 'assistant',
          content: msg.content,
          tool_calls: (msg as any).toolCalls.map((c: ToolCall) => ({
            id: c.id,
            type: 'function',
            function: {
              name: c.name,
              arguments: JSON.stringify(c.arguments)
            }
          }))
        });
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    return messages;
  }

  /**
   * 构建工具定义
   */
  private buildTools(): any[] {
    return this.toolRegistry.getTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * 执行工具
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return this.toolRegistry.executeAll(toolCalls);
  }

  /**
   * 获取工具名称
   */
  private getToolNameById(toolCallId: string, toolCalls: ToolCall[]): string {
    return toolCalls.find(c => c.id === toolCallId)?.name || 'unknown';
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return this.conversationContext.messages;
  }

  /**
   * 清除对话历史
   */
  clearHistory() {
    this.conversationContext = this.initContext();
    console.log('对话历史已清除');
  }

  /**
   * 获取会话统计
   */
  getStats() {
    return {
      ...this.conversationContext.metadata,
      duration: Date.now() - this.conversationContext.metadata.startedAt
    };
  }
}

// ==================== 使用示例 ====================

async function demo() {
  console.log('=== AI智能助手演示 ===\n');

  const assistant = new AIAssistant(registry);

  // 对话示例
  const queries = [
    '北京今天的天气怎么样？',
    '帮我计算一下 258 * 369 等于多少',
    '给我写一个快速排序算法',
    '帮我搜索一下最新的AI新闻'
  ];

  for (const query of queries) {
    console.log(`\n用户: ${query}`);
    console.log('助手: ', end='');

    const response = await assistant.send(query);

    // 流式输出效果（实际使用时用sendStream）
    console.log(response.content);
  }

  // 显示统计
  console.log('\n=== 会话统计 ===');
  const stats = assistant.getStats();
  console.log(`消息数: ${stats.messageCount}`);
  console.log(`会话时长: ${Math.round(stats.duration / 1000)}秒`);
}

// demo();
```

---

## 6. 对话系统

### 6.1 会话管理

会话管理是对话系统的基础，负责维护对话状态和处理多轮对话。

```typescript
/**
 * 会话管理系统
 * 支持多会话、状态管理、历史记录
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

interface Session {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  metadata: SessionMetadata;
  status: 'active' | 'ended' | 'waiting';
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  metadata?: {
    tokens?: number;
    model?: string;
    latency?: number;
  };
}

interface SessionMetadata {
  title?: string;
  tags?: string[];
  language?: string;
  contextWindow?: number;
  totalTokens?: number;
}

interface Attachment {
  type: 'image' | 'file' | 'audio';
  url?: string;
  content?: string;
  name?: string;
}

class ConversationManager {
  private sessions: Map<string, Session>;
  private activeSessionId: string | null;
  private openai: OpenAI;

  constructor() {
    this.sessions = new Map();
    this.activeSessionId = null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 创建新会话
   */
  createSession(userId?: string, metadata?: Partial<SessionMetadata>): Session {
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messages: [],
      metadata: {
        title: metadata?.title || '新会话',
        tags: metadata?.tags || [],
        language: metadata?.language || 'zh-CN',
        contextWindow: 128000,  // 默认上下文窗口
        totalTokens: 0,
        ...metadata
      },
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;

    console.log(`创建新会话: ${session.id}`);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 设置激活会话
   */
  setActiveSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      this.activeSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * 获取当前会话
   */
  getActiveSession(): Session | undefined {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : undefined;
  }

  /**
   * 添加消息
   */
  addMessage(
    sessionId: string,
    role: ChatMessage['role'],
    content: string,
    metadata?: ChatMessage['metadata']
  ): ChatMessage | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return undefined;
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      metadata
    };

    session.messages.push(message);
    session.updatedAt = Date.now();

    return message;
  }

  /**
   * 获取会话消息历史
   */
  getMessages(sessionId: string, limit?: number): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (limit) {
      return session.messages.slice(-limit);
    }
    return session.messages;
  }

  /**
   * 截断会话历史（节省token）
   */
  truncateHistory(sessionId: string, keepLast: number = 20): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    const removed = session.messages.length - keepLast;
    if (removed > 0) {
      // 保留系统消息和最近的消息
      const systemMessages = session.messages.filter(m => m.role === 'system');
      const recentMessages = session.messages.slice(-keepLast);
      session.messages = [...systemMessages, ...recentMessages];
      console.log(`截断会话 ${sessionId}，移除 ${removed} 条消息`);
    }

    return removed;
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'ended';
    session.updatedAt = Date.now();

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    return true;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 列出所有会话
   */
  listSessions(filter?: {
    userId?: string;
    status?: Session['status'];
    limit?: number;
  }): Session[] {
    let sessions = Array.from(this.sessions.values());

    if (filter?.userId) {
      sessions = sessions.filter(s => s.userId === filter.userId);
    }
    if (filter?.status) {
      sessions = sessions.filter(s => s.status === filter.status);
    }

    // 按更新时间排序
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    if (filter?.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return sessions;
  }

  /**
   * 更新会话元数据
   */
  updateSessionMetadata(
    sessionId: string,
    metadata: Partial<SessionMetadata>
  ): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.metadata = { ...session.metadata, ...metadata };
    session.updatedAt = Date.now();

    return session;
  }
}

// ==================== 会话管理器使用示例 ====================

async function sessionDemo() {
  const manager = new ConversationManager();

  // 创建会话
  const session = manager.createSession('user123', {
    title: '技术支持会话',
    tags: ['技术支持', '技术问题']
  });

  console.log('会话创建成功:', session.id);

  // 添加用户消息
  manager.addMessage(session.id, 'user', '我的订单支付失败了怎么办？', {
    tokens: 50
  });

  // 添加助手消息
  manager.addMessage(session.id, 'assistant', '很抱歉给您带来困扰。请问您是否看到了具体的错误提示？', {
    tokens: 80
  });

  // 获取消息历史
  const messages = manager.getMessages(session.id);
  console.log('\n消息历史:');
  messages.forEach(m => {
    console.log(`[${m.role}] ${m.content.slice(0, 50)}...`);
  });

  // 截断历史（如果会话过长）
  // manager.truncateHistory(session.id, 10);

  // 结束会话
  manager.endSession(session.id);

  // 列出所有会话
  const allSessions = manager.listSessions({ status: 'ended' });
  console.log(`\n已结束的会话数: ${allSessions.length}`);
}

// sessionDemo();
```

### 6.2 上下文记忆

上下文记忆让AI能够"记住"之前的对话内容，实现真正的多轮对话。

```typescript
/**
 * 上下文记忆系统
 * 实现智能的上下文管理和摘要
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'context' | 'task';
  content: string;
  importance: number;       // 0-10，重要性评分
  lastAccessedAt: number;
  accessCount: number;
  metadata?: Record<string, any>;
}

interface ConversationMemory {
  entries: Map<string, MemoryEntry>;
  summary?: string;
  lastSummaryAt?: number;
}

class ContextMemory {
  private memory: ConversationMemory;
  private maxEntries: number;
  private summaryThreshold: number;  // 触发摘要的消息数
  private openai: OpenAI;

  constructor(
    maxEntries: number = 100,
    summaryThreshold: number = 20
  ) {
    this.memory = {
      entries: new Map()
    };
    this.maxEntries = maxEntries;
    this.summaryThreshold = summaryThreshold;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 添加记忆条目
   */
  addEntry(
    type: MemoryEntry['type'],
    content: string,
    importance: number = 5,
    metadata?: Record<string, any>
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      importance,
      lastAccessedAt: Date.now(),
      accessCount: 0,
      metadata
    };

    this.memory.entries.set(entry.id, entry);

    // 如果超过最大条目数，移除不重要的
    if (this.memory.entries.size > this.maxEntries) {
      this.pruneEntries();
    }

    return entry;
  }

  /**
   * 检索相关记忆
   */
  retrieve(query: string, topK: number = 5): MemoryEntry[] {
    // 简单的关键词匹配，实际项目应使用向量检索
    const queryWords = query.toLowerCase().split(/\s+/);
    const scored: { entry: MemoryEntry; score: number }[] = [];

    for (const entry of this.memory.entries.values()) {
      let score = 0;
      const contentLower = entry.content.toLowerCase();

      // 关键词匹配
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
        }
      }

      // 重要性加权
      score += entry.importance / 10;

      // 最近访问加权
      const hoursSinceAccess = (Date.now() - entry.lastAccessedAt) / (1000 * 60 * 60);
      score += Math.max(0, 1 - hoursSinceAccess / 24);

      // 增加访问计数
      entry.accessCount++;
      entry.lastAccessedAt = Date.now();

      if (score > 0) {
        scored.push({ entry, score });
      }
    }

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(s => s.entry);
  }

  /**
   * 构建上下文提示
   */
  buildContextPrompt(): string {
    const entries = Array.from(this.memory.entries.values());

    if (entries.length === 0) {
      return '';
    }

    // 按类型分组
    const grouped = {
      fact: entries.filter(e => e.type === 'fact'),
      preference: entries.filter(e => e.type === 'preference'),
      context: entries.filter(e => e.type === 'context'),
      task: entries.filter(e => e.type === 'task')
    };

    let prompt = '\n\n【已知信息】\n';

    if (grouped.fact.length > 0) {
      prompt += '\n事实：\n';
      grouped.fact.forEach(e => prompt += `- ${e.content}\n`);
    }

    if (grouped.preference.length > 0) {
      prompt += '\n用户偏好：\n';
      grouped.preference.forEach(e => prompt += `- ${e.content}\n`);
    }

    if (grouped.context.length > 0) {
      prompt += '\n上下文：\n';
      grouped.context.forEach(e => prompt += `- ${e.content}\n`);
    }

    if (grouped.task.length > 0) {
      prompt += '\n待办任务：\n';
      grouped.task.forEach(e => prompt += `- ${e.content}\n`);
    }

    return prompt;
  }

  /**
   * 智能摘要（使用LLM）
   */
  async summarize(conversation: { role: string; content: string }[]): Promise<string> {
    if (conversation.length < this.summaryThreshold) {
      return '';
    }

    const prompt = `请总结以下对话的要点，提取关键信息、用户偏好和待办事项。

对话：
${conversation.map(m => `${m.role}: ${m.content}`).join('\n')}

请用简洁的要点格式输出总结。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });

    const summary = response.choices[0].message.content!;

    // 保存摘要
    this.memory.summary = summary;
    this.memory.lastSummaryAt = Date.now();

    // 从摘要中提取记忆
    this.extractMemoriesFromSummary(summary);

    return summary;
  }

  /**
   * 从摘要中提取记忆
   */
  private async extractMemoriesFromSummary(summary: string) {
    // 解析摘要中的要点，添加到记忆
    // 这里简化处理，实际可以用LLM解析
    const lines = summary.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line.includes('用户') || line.includes('偏好')) {
        this.addEntry('preference', line, 7);
      } else if (line.includes('任务') || line.includes('待办')) {
        this.addEntry('task', line, 8);
      } else {
        this.addEntry('fact', line, 5);
      }
    }
  }

  /**
   * 清理低重要性条目
   */
  private pruneEntries() {
    const entries = Array.from(this.memory.entries.values());

    // 按重要性排序
    entries.sort((a, b) => a.importance - b.importance);

    // 移除最低的条目
    const toRemove = entries.slice(0, Math.floor(this.maxEntries * 0.2));

    for (const entry of toRemove) {
      this.memory.entries.delete(entry.id);
    }

    console.log(`清理了 ${toRemove.length} 个低重要性记忆`);
  }

  /**
   * 清除所有记忆
   */
  clear() {
    this.memory = {
      entries: new Map(),
      summary: undefined,
      lastSummaryAt: undefined
    };
    console.log('上下文记忆已清除');
  }

  /**
   * 获取记忆统计
   */
  getStats() {
    const entries = Array.from(this.memory.entries.values());
    const byType = {
      fact: entries.filter(e => e.type === 'fact').length,
      preference: entries.filter(e => e.type === 'preference').length,
      context: entries.filter(e => e.type === 'context').length,
      task: entries.filter(e => e.type === 'task').length
    };

    return {
      total: entries.length,
      byType,
      hasSummary: !!this.memory.summary,
      lastSummaryAt: this.memory.lastSummaryAt
    };
  }
}

// ==================== 使用示例 ====================

async function memoryDemo() {
  const memory = new ContextMemory(maxEntries: 50, summaryThreshold: 10);

  // 添加记忆
  memory.addEntry('fact', '用户张三，公司ABC，主要使用React技术栈', 8);
  memory.addEntry('preference', '用户喜欢简洁的代码风格，不喜欢过度设计', 7);
  memory.addEntry('task', '帮助用户完成订单支付功能', 9, { orderId: '12345' });

  // 检索相关记忆
  console.log('检索"React"相关记忆:');
  const related = memory.retrieve('React');
  related.forEach(m => console.log(`- [${m.type}] ${m.content}`));

  // 构建上下文提示
  console.log('\n构建的上下文提示:');
  console.log(memory.buildContextPrompt());

  // 获取统计
  console.log('\n记忆统计:');
  console.log(memory.getStats());
}

// memoryDemo();
```

### 6.3 多轮对话

多轮对话实现复杂的交互流程，支持意图识别、槽位填充和对话状态管理。

```typescript
/**
 * 多轮对话系统
 * 支持意图识别、槽位填充、对话状态管理
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

type Intent =
  | 'greeting'
  | 'goodbye'
  | 'order_inquiry'
  | 'order_cancel'
  | 'order_modify'
  | 'complaint'
  | 'refund'
  | 'transfer_human'
  | 'unknown';

interface Slot {
  name: string;
  value: any;
  required: boolean;
  filled: boolean;
  prompt?: string;  // 未填充时的提示语
}

interface DialogueState {
  currentIntent: Intent | null;
  slots: Map<string, Slot>;
  context: Record<string, any>;
  history: DialogueTurn[];
  status: 'started' | 'in_progress' | 'completed' | 'failed';
}

interface DialogueTurn {
  userMessage: string;
  assistantMessage: string;
  intent: Intent;
  slots: Record<string, any>;
  timestamp: number;
}

class MultiTurnDialogue {
  private openai: OpenAI;
  private state: DialogueState;
  private sessionId: string;

  // 槽位定义
  private slotDefinitions: Record<string, Slot> = {
    orderId: {
      name: 'orderId',
      value: null,
      required: true,
      filled: false,
      prompt: '请问您的订单号是多少？'
    },
    phone: {
      name: 'phone',
      value: null,
      required: false,
      filled: false,
      prompt: '请问您的联系电话是？'
    },
    reason: {
      name: 'reason',
      value: null,
      required: true,
      filled: false,
      prompt: '请问您想取消订单的原因是什么？'
    },
    productName: {
      name: 'productName',
      value: null,
      required: false,
      filled: false,
      prompt: '请问您想咨询的产品名称是？'
    }
  };

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.sessionId = `dialogue_${Date.now()}`;
    this.state = this.initState();
  }

  /**
   * 初始化对话状态
   */
  private initState(): DialogueState {
    const slots = new Map<string, Slot>();
    Object.values(this.slotDefinitions).forEach(slot => {
      slots.set(slot.name, { ...slot });
    });

    return {
      currentIntent: null,
      slots,
      context: {},
      history: [],
      status: 'started'
    };
  }

  /**
   * 意图识别
   */
  private async recognizeIntent(message: string): Promise<Intent> {
    const prompt = `识别用户消息的意图，只输出意图名称。

可用意图：
- greeting: 问候
- goodbye: 告别
- order_inquiry: 订单查询
- order_cancel: 订单取消
- order_modify: 订单修改
- complaint: 投诉
- refund: 退款
- transfer_human: 转人工
- unknown: 未知

用户消息：${message}

意图：`; // 结尾添加意图标签让模型输出

    // 使用更精确的prompt
    const messages: any[] = [
      {
        role: 'system',
        content: `你是一个意图识别器。根据用户消息，输出最匹配的意图名称。

意图列表：
- greeting: 用户问候或打招呼
- goodbye: 用户告别
- order_inquiry: 用户查询订单状态、信息
- order_cancel: 用户要取消订单
- order_modify: 用户要修改订单
- complaint: 用户投诉
- refund: 用户要求退款
- transfer_human: 用户要求转人工客服
- unknown: 无法确定意图

只输出一个词，不要其他内容。`
      },
      { role: 'user', content: message }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 20,
      temperature: 0
    });

    const intentStr = response.choices[0].message.content!.trim().toLowerCase();

    // 解析意图
    const intentMap: Record<string, Intent> = {
      'greeting': 'greeting',
      'goodbye': 'goodbye',
      'order_inquiry': 'order_inquiry',
      'order_cancel': 'order_cancel',
      'order_modify': 'order_modify',
      'complaint': 'complaint',
      'refund': 'refund',
      'transfer_human': 'transfer_human'
    };

    return intentMap[intentStr] || 'unknown';
  }

  /**
   * 槽位填充
   */
  private async fillSlots(message: string): Promise<{ filled: Slot[]; unfilled: Slot[] }> {
    const intent = this.state.currentIntent;
    if (!intent) return { filled: [], unfilled: [] };

    // 根据意图确定需要的槽位
    const requiredSlots = this.getRequiredSlotsForIntent(intent);

    const filled: Slot[] = [];
    const unfilled: Slot[] = [];

    for (const slotName of requiredSlots) {
      const slot = this.state.slots.get(slotName)!;

      if (slot.filled && slot.value) {
        unfilled.push(slot);
        continue;
      }

      // 使用LLM从消息中提取槽位值
      if (slotName === 'orderId') {
        // 提取订单号（常见格式）
        const orderIdMatch = message.match(/[A-Z0-9]{8,}/i);
        if (orderIdMatch) {
          slot.value = orderIdMatch[0];
          slot.filled = true;
          filled.push(slot);
        } else {
          unfilled.push(slot);
        }
      } else if (slotName === 'phone') {
        // 提取电话号码
        const phoneMatch = message.match(/1[3-9]\d{9}/);
        if (phoneMatch) {
          slot.value = phoneMatch[0];
          slot.filled = true;
          filled.push(slot);
        } else {
          unfilled.push(slot);
        }
      } else if (slotName === 'reason') {
        // 提取取消原因
        if (message.length > 10) {
          slot.value = message;
          slot.filled = true;
          filled.push(slot);
        } else {
          unfilled.push(slot);
        }
      }
    }

    return { filled, unfilled };
  }

  /**
   * 获取意图需要的槽位
   */
  private getRequiredSlotsForIntent(intent: Intent): string[] {
    const slotMap: Record<Intent, string[]> = {
      'order_inquiry': ['orderId'],
      'order_cancel': ['orderId', 'reason'],
      'order_modify': ['orderId'],
      'complaint': ['phone', 'reason'],
      'refund': ['orderId', 'reason'],
      'greeting': [],
      'goodbye': [],
      'transfer_human': ['phone'],
      'unknown': []
    };

    return slotMap[intent] || [];
  }

  /**
   * 生成响应
   */
  private async generateResponse(
    intent: Intent,
    unfilledSlots: Slot[]
  ): Promise<string> {
    // 如果有未填充的必填槽位，询问
    if (unfilledSlots.length > 0) {
      const slot = unfilledSlots[0];
      return slot.prompt || `请提供您的${slot.name}`;
    }

    // 槽位已填充，生成最终响应
    const slots = Object.fromEntries(this.state.slots);

    const prompt = `你是一个客服对话助手。根据以下信息生成友好的回复。

意图：${intent}
槽位信息：${JSON.stringify(slots)}
对话历史：${JSON.stringify(this.state.history.slice(-3))}

回复要求：
1. 确认已理解用户意图
2. 如果是查询，提供具体信息
3. 如果是取消/退款/投诉，确认收到并说明后续流程
4. 保持专业和友好`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });

    return response.choices[0].message.content!;
  }

  /**
   * 处理用户消息
   */
  async process(message: string): Promise<{
    response: string;
    intent: Intent;
    isCompleted: boolean;
    needsHuman: boolean;
  }> {
    // 1. 识别意图
    const intent = await this.recognizeIntent(message);
    this.state.currentIntent = intent;

    console.log(`识别的意图: ${intent}`);

    // 2. 处理特殊意图
    if (intent === 'greeting') {
      const response = '您好！我是智能客服小助手，请问有什么可以帮助您的？';
      this.addTurn(message, response, intent);
      return { response, intent, isCompleted: false, needsHuman: false };
    }

    if (intent === 'goodbye') {
      const response = '感谢您的咨询，祝您生活愉快！如有需要随时联系我。';
      this.addTurn(message, response, intent);
      this.state.status = 'completed';
      return { response, intent, isCompleted: true, needsHuman: false };
    }

    if (intent === 'transfer_human') {
      const response = '好的，我将为您转接人工客服，请稍候...';
      this.addTurn(message, response, intent);
      this.state.status = 'completed';
      return { response, intent, isCompleted: true, needsHuman: true };
    }

    // 3. 槽位填充
    const { filled, unfilled } = await this.fillSlots(message);

    console.log(`填充的槽位: ${filled.map(s => s.name).join(', ')}`);
    console.log(`未填充的槽位: ${unfilled.map(s => s.name).join(', ')}`);

    // 4. 生成响应
    const response = await this.generateResponse(intent, unfilled);
    this.addTurn(message, response, intent);

    // 5. 检查是否完成
    const isCompleted = unfilled.length === 0;

    return {
      response,
      intent,
      isCompleted,
      needsHuman: false
    };
  }

  /**
   * 添加对话轮次
   */
  private addTurn(userMessage: string, assistantMessage: string, intent: Intent) {
    this.state.history.push({
      userMessage,
      assistantMessage,
      intent,
      slots: Object.fromEntries(
        Array.from(this.state.slots.entries())
          .filter(([_, s]) => s.filled)
          .map(([k, v]) => [k, v.value])
      ),
      timestamp: Date.now()
    });
  }

  /**
   * 获取对话状态
   */
  getState(): DialogueState {
    return {
      ...this.state,
      slots: new Map(this.state.slots)
    };
  }

  /**
   * 重置对话
   */
  reset() {
    this.state = this.initState();
    console.log('对话已重置');
  }
}

// ==================== 使用示例 ====================

async function dialogueDemo() {
  const dialogue = new MultiTurnDialogue();

  console.log('=== 多轮对话演示 ===\n');

  const queries = [
    '你好',
    '我的订单ABC12345678想取消',
    '太贵了',
    '谢谢，再见'
  ];

  for (const query of queries) {
    console.log(`\n用户: ${query}`);

    const result = await dialogue.process(query);

    console.log(`助手: ${result.response}`);
    console.log(`意图: ${result.intent}`);
    console.log(`完成: ${result.isCompleted}`);
    console.log(`转人工: ${result.needsHuman}`);
  }
}

// dialogueDemo();
```

### 6.4 实战：客服机器人

完整的客服机器人实现，整合会话管理、上下文记忆和多轮对话：

```typescript
/**
 * 智能客服机器人
 * 完整的企业级客服机器人实现
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 核心组件 ====================

// 知识库条目
interface KnowledgeBaseEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  confidence: number;  // 匹配置信度阈值
}

// 对话配置
interface BotConfig {
  maxHistoryLength: number;    // 最大历史长度
  maxTokensPerRequest: number;  // 单次最大token
  fallbackToHuman: boolean;     // 无法回答时转人工
  confidenceThreshold: number; // 置信度阈值
  enableKnowledgeBase: boolean; // 启用知识库
  enableCRM: boolean;          // 启用CRM集成
}

// ==================== 知识库类 ====================

class KnowledgeBase {
  private entries: KnowledgeBaseEntry[];

  constructor() {
    // 初始化示例知识库
    this.entries = [
      {
        id: 'kb001',
        question: '如何重置密码',
        answer: '您可以通过以下步骤重置密码：\n1. 点击登录页的"忘记密码"链接\n2. 输入您的注册邮箱\n3. 查收邮件并点击重置链接\n4. 设置新密码（至少8位，包含字母和数字）',
        category: '账户',
        keywords: ['密码', '重置', '忘记', '账户'],
        confidence: 0.8
      },
      {
        id: 'kb002',
        question: '如何查看订单状态',
        answer: '查看订单状态的方法：\n1. 登录您的账户\n2. 进入"我的订单"页面\n3. 点击您想查看的订单\n4. 订单状态包括：待付款、待发货、已发货、已完成、已取消',
        category: '订单',
        keywords: ['订单', '状态', '查看', '物流'],
        confidence: 0.8
      },
      {
        id: 'kb003',
        question: '如何申请退款',
        answer: '退款申请流程：\n1. 进入"我的订单"\n2. 找到需要退款的订单\n3. 点击"申请退款"\n4. 选择退款原因\n5. 提交后预计1-3个工作日处理',
        category: '退款',
        keywords: ['退款', '退货', '钱', '返还'],
        confidence: 0.8
      }
    ];
  }

  /**
   * 搜索知识库
   */
  search(query: string): { entry: KnowledgeBaseEntry; score: number }[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: { entry: KnowledgeBaseEntry; score: number }[] = [];

    for (const entry of this.entries) {
      let score = 0;

      // 关键词匹配
      for (const word of queryWords) {
        for (const keyword of entry.keywords) {
          if (keyword.toLowerCase().includes(word)) {
            score += 0.3;
          }
        }
        // 问题匹配
        if (entry.question.toLowerCase().includes(word)) {
          score += 0.2;
        }
      }

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 3);
  }

  /**
   * 添加知识库条目
   */
  add(entry: Omit<KnowledgeBaseEntry, 'id'>) {
    this.entries.push({
      ...entry,
      id: `kb_${Date.now()}`
    });
  }
}

// ==================== 客服机器人主类 ====================

class CustomerServiceBot {
  private openai: OpenAI;
  private knowledgeBase: KnowledgeBase;
  private conversationManager: ConversationManager;
  private contextMemory: ContextMemory;
  private config: BotConfig;
  private open: OpenAI;

  constructor(config: Partial<BotConfig> = {}) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.knowledgeBase = new KnowledgeBase();
    this.conversationManager = new ConversationManager();
    this.contextMemory = new ContextMemory();
    this.open = this.openai;

    this.config = {
      maxHistoryLength: 20,
      maxTokensPerRequest: 4000,
      fallbackToHuman: true,
      confidenceThreshold: 0.6,
      enableKnowledgeBase: true,
      enableCRM: true,
      ...config
    };
  }

  /**
   * 处理用户消息
   */
  async process(
    userId: string,
    message: string,
    sessionId?: string
  ): Promise<{
    response: string;
    sources?: string[];
    needsHuman: boolean;
    sessionId: string;
  }> {
    // 获取或创建会话
    let session: Session | undefined;
    if (sessionId) {
      session = this.conversationManager.getSession(sessionId);
    }

    if (!session) {
      session = this.conversationManager.createSession(userId, {
        title: '客服会话',
        tags: ['客服']
      });
    }

    // 1. 知识库检索
    let knowledgeContext = '';
    const sources: string[] = [];

    if (this.config.enableKnowledgeBase) {
      const kbResults = this.knowledgeBase.search(message);

      if (kbResults.length > 0 && kbResults[0].score >= this.config.confidenceThreshold) {
        const bestMatch = kbResults[0].entry;
        knowledgeContext = `\n\n【知识库参考】\n问题：${bestMatch.question}\n答案：${bestMatch.answer}`;
        sources.push(`知识库: ${bestMatch.question}`);
      }
    }

    // 2. 上下文记忆
    const memoryContext = this.contextMemory.buildContextPrompt();

    // 3. 获取对话历史
    const history = this.conversationManager.getMessages(session.id, 10);
    const historyText = history
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
      .join('\n');

    // 4. 构建Prompt
    const systemPrompt = `你是一个专业、友好的在线客服助手。

回复要求：
1. 保持专业、耐心、友好的语气
2. 站在用户角度考虑问题
3. 回答简洁有条理
4. 如需多步骤操作，分点说明
5. 无法回答时诚实说明并转人工

当前用户ID: ${userId}`;

    const fullPrompt = `${systemPrompt}

${knowledgeContext}
${memoryContext}

【最近对话历史】
${historyText}

用户: ${message}
助手:`;

    // 5. 调用LLM
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: this.config.maxTokensPerRequest,
      temperature: 0.7
    });

    const botResponse = response.choices[0].message.content!;

    // 6. 保存对话
    this.conversationManager.addMessage(session.id, 'user', message);
    this.conversationManager.addMessage(session.id, 'assistant', botResponse);

    // 7. 更新上下文记忆
    this.updateMemory(message, botResponse);

    // 8. 检查是否需要转人工
    const needsHuman = this.shouldTransferToHuman(message, botResponse);

    if (needsHuman && this.config.fallbackToHuman) {
      return {
        response: botResponse + '\n\n【系统】当前问题我将转接人工客服为您服务，请稍候...',
        sources,
        needsHuman: true,
        sessionId: session.id
      };
    }

    return {
      response: botResponse,
      sources,
      needsHuman: false,
      sessionId: session.id
    };
  }

  /**
   * 更新上下文记忆
   */
  private updateMemory(userMessage: string, botResponse: string) {
    // 提取关键信息
    if (userMessage.includes('订单')) {
      const orderMatch = userMessage.match(/[A-Z0-9]{8,}/i);
      if (orderMatch) {
        this.contextMemory.addEntry('context', `用户咨询订单: ${orderMatch[0]}`, 7);
      }
    }

    if (userMessage.includes('电话') || userMessage.includes('手机')) {
      const phoneMatch = userMessage.match(/1[3-9]\d{9}/);
      if (phoneMatch) {
        this.contextMemory.addEntry('fact', `用户电话: ${phoneMatch[0]}`, 8);
      }
    }
  }

  /**
   * 判断是否需要转人工
   */
  private shouldTransferToHuman(userMessage: string, botResponse: string): boolean {
    // 明确的转人工请求
    const humanKeywords = ['转人工', '人工客服', '真人', '客服电话', '投诉'];
    for (const keyword of humanKeywords) {
      if (userMessage.includes(keyword)) {
        return true;
      }
    }

    // 无法回答的标识
    if (botResponse.includes('无法') || botResponse.includes('不清楚')) {
      return true;
    }

    return false;
  }

  /**
   * 获取会话历史
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.conversationManager.getMessages(sessionId);
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string) {
    this.conversationManager.endSession(sessionId);
  }
}

// ==================== 使用示例 ====================

async function botDemo() {
  console.log('=== 智能客服机器人演示 ===\n');

  const bot = new CustomerServiceBot({
    fallbackToHuman: true,
    confidenceThreshold: 0.5
  });

  // 创建新会话
  const sessionId = `session_${Date.now()}`;
  console.log(`会话ID: ${sessionId}\n`);

  // 模拟对话
  const queries = [
    '你好，我想咨询一下',
    '我的订单号是 ABC12345678，想知道现在到哪了',
    '能帮我重置一下密码吗',
    '我要投诉你们的服务'
  ];

  let currentSessionId: string | undefined;

  for (const query of queries) {
    console.log('='.repeat(40));
    console.log(`用户: ${query}`);

    const result = await bot.process('user001', query, currentSessionId);

    console.log(`\n助手: ${result.response}`);
    console.log(`\n会话ID: ${result.sessionId}`);

    if (result.needsHuman) {
      console.log('【提示】已触发转人工');
    }

    if (result.sources && result.sources.length > 0) {
      console.log(`【来源】${result.sources.join(', ')}`);
    }

    console.log('');

    currentSessionId = result.sessionId;
  }
}

// botDemo();
```

---

## 7. 代码生成

### 7.1 代码补全

代码补全是LLM最实用的应用场景之一，可用于IDE插件和代码提示系统。

```typescript
/**
 * 代码补全系统
 * 支持多语言、上下文感知、类型推断
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface CompletionOptions {
  language: string;
  framework?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface CompletionResult {
  code: string;
  language: string;
  imports: string[];
  explanation?: string;
}

class CodeCompletion {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 代码补全
   */
  async complete(
    prefix: string,
    suffix: string = '',
    options: CompletionOptions
  ): Promise<CompletionResult> {
    const {
      language,
      framework,
      maxTokens = 500,
      temperature = 0.5
    } = options;

    // 构建上下文提示
    const contextPrompt = this.buildContext(language, framework);

    // 构建完整prompt
    const prompt = `${contextPrompt}

请补全以下${language}代码。只输出代码，不要其他解释。

【代码前缀】
${prefix}

【代码后缀】
${suffix}

【补全代码】
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    });

    const code = response.choices[0].message.content!
      .replace(/^```[\w]*\n?/, '')  // 移除代码块标记
      .replace(/```$/, '');

    return {
      code: code.trim(),
      language,
      imports: this.extractImports(code, language)
    };
  }

  /**
   * 流式代码补全
   */
  async *completeStream(
    prefix: string,
    suffix: string = '',
    options: CompletionOptions
  ): AsyncGenerator<string> {
    const {
      language,
      framework,
      maxTokens = 500,
      temperature = 0.5
    } = options;

    const contextPrompt = this.buildContext(language, framework);

    const prompt = `${contextPrompt}

请补全以下${language}代码。只输出代码，不要其他解释。

【代码前缀】
${prefix}

【代码后缀】
${suffix}

【补全代码】
`;

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * 构建上下文
   */
  private buildContext(language: string, framework?: string): string {
    let context = `你是一个专业的${language}程序员。`;

    if (framework) {
      context += `\n使用的框架/库：${framework}`;
    }

    context += `
要求：
1. 输出完整、可运行的代码
2. 遵循最佳实践和代码规范
3. 包含必要的类型注解（TypeScript等）
4. 错误处理完善`;

    return context;
  }

  /**
   * 提取导入语句
   */
  private extractImports(code: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'TypeScript' || language === 'JavaScript') {
      const importRegex = /import\s+.*?from\s+['"][^'"]+['"]/g;
      const matches = code.match(importRegex);
      if (matches) {
        imports.push(...matches);
      }
    } else if (language === 'Python') {
      const importRegex = /(?:import\s+.+|from\s+.+import\s+.+)/g;
      const matches = code.match(importRegex);
      if (matches) {
        imports.push(...matches);
      }
    }

    return imports;
  }

  /**
   * 多行代码补全
   */
  async completeMultiLine(
    prompt: string,
    options: CompletionOptions
  ): Promise<CompletionResult> {
    const { language, framework, maxTokens = 800, temperature = 0.5 } = options;

    const fullPrompt = `${this.buildContext(language, framework)}

请根据以下需求生成${language}代码：

需求：${prompt}

要求：
1. 输出完整代码
2. 包含详细注释
3. 考虑边界情况
4. 输出格式：先解释思路，再输出代码`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: maxTokens,
      temperature
    });

    const content = response.choices[0].message.content!;

    // 分离解释和代码
    const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
    const explanation = content.split('```')[0].trim();
    const code = codeMatch ? codeMatch[1].trim() : content;

    return {
      code,
      language,
      imports: this.extractImports(code, language),
      explanation
    };
  }
}

// ==================== 使用示例 ====================

async function completionDemo() {
  const completer = new CodeCompletion();

  console.log('=== 代码补全演示 ===\n');

  // 1. 简单代码补全
  console.log('【示例1：TypeScript函数补全】');
  const result1 = await completer.complete(
    `function fibonacci(n: number): number {
  if (n <= 1) return n;
  // 补全这里`,
    '',
    { language: 'TypeScript' }
  );
  console.log('补全结果:');
  console.log(result1.code);

  // 2. React组件补全
  console.log('\n【示例2：React组件】');
  const result2 = await completer.complete(
    `import React, { useState } from 'react';

interface UserCardProps {
  name: string;
  email: string;
}

const UserCard: React.FC<UserCardProps> = ({ name, email }) => {
  const [isEditing, setIsEditing] = useState(false);`,
    `

  return (
    <div className="user-card">
      {/* 补全组件内容 */}
    </div>
  );
};

export default UserCard;`,
    { language: 'TypeScript', framework: 'React' }
  );
  console.log('补全结果:');
  console.log(result2.code);

  // 3. 完整函数生成
  console.log('\n【示例3：完整函数生成】');
  const result3 = await completer.completeMultiLine(
    '实现一个防抖函数（debounce），接受函数和延迟时间参数，返回防抖后的函数',
    { language: 'TypeScript' }
  );
  console.log('解释:', result3.explanation);
  console.log('代码:', result3.code);
}

// completionDemo();
```

### 7.2 代码审查

代码审查是AI在开发流程中的重要应用，可以自动发现Bug和提出优化建议。

```typescript
/**
 * 代码审查系统
 * 自动审查代码质量、Bug、性能问题
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 类型定义 ====================

interface ReviewIssue {
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  line?: number;
  message: string;
  suggestion?: string;
  category: 'bug' | 'performance' | 'security' | 'style' | 'best-practice';
}

interface CodeReview {
  fileName: string;
  language: string;
  overallScore: number;  // 0-10
  summary: string;
  issues: ReviewIssue[];
  strengths: string[];
  suggestions: string[];
}

// ==================== 代码审查类 ====================

class CodeReviewer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 审查代码
   */
  async review(
    code: string,
    fileName: string,
    language: string
  ): Promise<CodeReview> {
    const prompt = `请审查以下${language}代码，发现问题并提供改进建议。

文件名：${fileName}

代码：
\`\`\`${language}
${code}
\`\`\`

请按以下JSON格式输出审查结果：
{
  "overallScore": "0-10的评分",
  "summary": "总体评价",
  "issues": [
    {
      "severity": "critical|major|minor|suggestion",
      "line": "行号（如果适用）",
      "message": "问题描述",
      "suggestion": "修改建议",
      "category": "bug|performance|security|style|best-practice"
    }
  ],
  "strengths": ["代码优点列表"],
  "suggestions": ["整体改进建议列表"]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    });

    const content = response.choices[0].message.content!;

    // 解析JSON
    let reviewData: any;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      reviewData = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      // 解析失败，返回原始内容
      return {
        fileName,
        language,
        overallScore: 5,
        summary: content,
        issues: [],
        strengths: [],
        suggestions: []
      };
    }

    return {
      fileName,
      language,
      overallScore: reviewData.overallScore || 5,
      summary: reviewData.summary || '',
      issues: reviewData.issues || [],
      strengths: reviewData.strengths || [],
      suggestions: reviewData.suggestions || []
    };
  }

  /**
   * 格式化审查报告
   */
  static formatReport(review: CodeReview): string {
    let report = '';

    report += '='.repeat(50) + '\n';
    report += `代码审查报告: ${review.fileName}\n`;
    report += '='.repeat(50) + '\n\n';

    report += `总体评分: ${review.overallScore}/10\n`;
    report += `\n总体评价: ${review.summary}\n\n`;

    if (review.strengths.length > 0) {
      report += '【优点】\n';
      review.strengths.forEach(s => report += `- ${s}\n`);
      report += '\n';
    }

    if (review.issues.length > 0) {
      report += '【问题】\n';
      const severityOrder = ['critical', 'major', 'minor', 'suggestion'];
      review.issues.sort((a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      );

      review.issues.forEach(issue => {
        const icon = {
          critical: '🔴',
          major: '🟠',
          minor: '🟡',
          suggestion: '🟢'
        }[issue.severity];

        report += `${icon} [${issue.severity.toUpperCase()}]`;
        if (issue.line) {
          report += ` 第${issue.line}行`;
        }
        report += `\n   ${issue.message}\n`;
        if (issue.suggestion) {
          report += `   建议: ${issue.suggestion}\n`;
        }
        report += '\n';
      });
    }

    if (review.suggestions.length > 0) {
      report += '【改进建议】\n';
      review.suggestions.forEach(s => report += `- ${s}\n`);
    }

    return report;
  }

  /**
   * 批量审查
   */
  async reviewBatch(
    files: { code: string; fileName: string; language: string }[]
  ): Promise<CodeReview[]> {
    const reviews = await Promise.all(
      files.map(f => this.review(f.code, f.fileName, f.language))
    );

    // 按评分排序
    return reviews.sort((a, b) => a.overallScore - b.overallScore);
  }
}

// ==================== 使用示例 ====================

async function reviewDemo() {
  const reviewer = new CodeReviewer();

  console.log('=== 代码审查演示 ===\n');

  // 示例代码（包含一些问题）
  const code = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

function getUserData(userId) {
  const response = fetch('/api/users/' + userId);
  return response.json();
}`;

  const review = await reviewer.review(code, 'orders.js', 'JavaScript');

  console.log(CodeReviewer.formatReport(review));
}

// reviewDemo();
```

### 7.3 代码解释

代码解释功能帮助开发者理解陌生代码，是学习和代码维护的好帮手。

```typescript
/**
 * 代码解释系统
 * 为代码提供详细的中文解释
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

interface ExplanationResult {
  summary: string;           // 整体概述
  functionality: string;     // 功能说明
  lineByLine: {
    line: number;
    code: string;
    explanation: string;
  }[];
  keyConcepts: string[];    // 关键概念
  usage: string;             // 使用示例
  timeComplexity?: string;  // 时间复杂度
  spaceComplexity?: string;  // 空间复杂度
}

class CodeExplainer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 解释代码
   */
  async explain(code: string, language: string): Promise<ExplanationResult> {
    const prompt = `请详细解释以下${language}代码，用中文输出。

代码：
\`\`\`${language}
${code}
\`\`\`

请按以下JSON格式输出：
{
  "summary": "一句话概述代码功能",
  "functionality": "详细的功能说明",
  "lineByLine": [
    {"line": 1, "code": "代码", "explanation": "解释"}
  ],
  "keyConcepts": ["关键概念列表"],
  "usage": "使用示例",
  "timeComplexity": "时间复杂度（如果适用）",
  "spaceComplexity": "空间复杂度（如果适用）"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3
    });

    const content = response.choices[0].message.content!;

    // 解析JSON
    let result: any;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      result = { summary: content, functionality: content, lineByLine: [], keyConcepts: [], usage: '' };
    }

    return {
      summary: result.summary || '',
      functionality: result.functionality || '',
      lineByLine: result.lineByLine || [],
      keyConcepts: result.keyConcepts || [],
      usage: result.usage || '',
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity
    };
  }

  /**
   * 格式化解释结果
   */
  static formatExplanation(explanation: ExplanationResult): string {
    let output = '';

    output += '【概述】\n';
    output += explanation.summary + '\n\n';

    output += '【功能说明】\n';
    output += explanation.functionality + '\n\n';

    if (explanation.lineByLine.length > 0) {
      output += '【逐行解释】\n';
      explanation.lineByLine.forEach(item => {
        output += `${item.line}. \`${item.code}\`\n`;
        output += `   ${item.explanation}\n`;
      });
      output += '\n';
    }

    if (explanation.keyConcepts.length > 0) {
      output += '【关键概念】\n';
      explanation.keyConcepts.forEach(c => output += `- ${c}\n`);
      output += '\n';
    }

    if (explanation.usage) {
      output += '【使用示例】\n';
      output += explanation.usage + '\n\n';
    }

    if (explanation.timeComplexity) {
      output += `【时间复杂度】${explanation.timeComplexity}\n`;
    }
    if (explanation.spaceComplexity) {
      output += `【空间复杂度】${explanation.spaceComplexity}\n`;
    }

    return output;
  }

  /**
   * 生成代码文档
   */
  async generateDocs(code: string, language: string): Promise<string> {
    const prompt = `请为以下${language}代码生成完整的文档注释。

代码：
\`\`\`${language}
${code}
\`\`\`

请生成符合${language}标准文档注释规范的注释。
如果${language}支持JSDoc、DocString等文档注释格式，请使用相应格式。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });

    return response.choices[0].message.content!;
  }
}

// ==================== 使用示例 ====================

async function explainDemo() {
  const explainer = new CodeExplainer();

  console.log('=== 代码解释演示 ===\n');

  const code = `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`;

  const explanation = await explainer.explain(code, 'JavaScript');
  console.log(CodeExplainer.formatExplanation(explanation));
}

// explainDemo();
```

### 7.4 实战：AI编程助手

完整的AI编程助手实现，支持代码补全、审查、解释和优化：

```typescript
/**
 * AI编程助手
 * 集代码补全、审查、解释、优化于一体的智能助手
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

type TaskType = 'completion' | 'review' | 'explanation' | 'optimization' | 'debug';

interface AssistantConfig {
  defaultLanguage: string;
  maxTokens: number;
  temperature: number;
}

class AIProgrammingAssistant {
  private openai: OpenAI;
  private config: AssistantConfig;

  constructor(config: Partial<AssistantConfig> = {}) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.config = {
      defaultLanguage: 'TypeScript',
      maxTokens: 2000,
      temperature: 0.5,
      ...config
    };
  }

  /**
   * 代码补全
   */
  async complete(
    prefix: string,
    suffix: string = '',
    language?: string
  ): Promise<string> {
    const lang = language || this.config.defaultLanguage;

    const prompt = `你是一个${lang}代码助手。请根据代码前缀和后缀补全代码，只输出代码，不需要解释。

前缀：
${prefix}

后缀：
${suffix}

补全代码：`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    return this.cleanCode(response.choices[0].message.content!, lang);
  }

  /**
   * 代码审查
   */
  async review(code: string, language?: string): Promise<string> {
    const lang = language || this.config.defaultLanguage;

    const prompt = `请审查以下${lang}代码，发现问题并给出改进建议。

代码：
\`\`\`${lang}
${code}
\`\`\`

请按以下格式输出：
1. 总体评价
2. 发现的问题（列出具体位置和修改建议）
3. 代码优点
4. 改进后的代码（如果有）`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens * 2
    });

    return response.choices[0].message.content!;
  }

  /**
   * 代码解释
   */
  async explain(code: string, language?: string): Promise<string> {
    const lang = language || this.config.defaultLanguage;

    const prompt = `请详细解释以下${lang}代码，用中文回答。

代码：
\`\`\`${lang}
${code}
\`\`\`

请说明：
1. 代码的整体功能
2. 关键逻辑和算法
3. 重要的数据结构和函数
4. 代码的执行流程`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens
    });

    return response.choices[0].message.content!;
  }

  /**
   * 代码优化
   */
  async optimize(code: string, language?: string): Promise<string> {
    const lang = language || this.config.defaultLanguage;

    const prompt = `请优化以下${lang}代码，提升性能、可读性或最佳实践。

代码：
\`\`\`${lang}
${code}
\`\`\`

请输出：
1. 优化的方面
2. 优化后的代码
3. 优化说明`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens
    });

    return response.choices[0].message.content!;
  }

  /**
   * 调试助手
   */
  async debug(code: string, error?: string, language?: string): Promise<string> {
    const lang = language || this.config.defaultLanguage;

    let prompt = `请帮助调试以下${lang}代码。`;

    if (error) {
      prompt += `\n\n错误信息：\n${error}`;
    }

    prompt += `\n\n代码：
\`\`\`${lang}
${code}
\`\`\`

请分析可能的问题并给出修复方案。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens
    });

    return response.choices[0].message.content!;
  }

  /**
   * 统一入口
   */
  async process(
    task: TaskType,
    code: string,
    options?: {
      prefix?: string;
      suffix?: string;
      error?: string;
      language?: string;
    }
  ): Promise<string> {
    switch (task) {
      case 'completion':
        return this.complete(options?.prefix || '', options?.suffix || '', options?.language);

      case 'review':
        return this.review(code, options?.language);

      case 'explanation':
        return this.explain(code, options?.language);

      case 'optimization':
        return this.optimize(code, options?.language);

      case 'debug':
        return this.debug(code, options?.error, options?.language);

      default:
        return '不支持的任务类型';
    }
  }

  /**
   * 清理代码输出
   */
  private cleanCode(code: string, language: string): string {
    return code
      .replace(/^```[\w]*\n/, '')
      .replace(/\n```$/, '')
      .trim();
  }
}

// ==================== 使用示例 ====================

async function assistantDemo() {
  const assistant = new AIProgrammingAssistant({
    defaultLanguage: 'TypeScript'
  });

  console.log('=== AI编程助手演示 ===\n');

  // 代码补全
  console.log('【代码补全】');
  const completion = await assistant.process('completion', '', {
    prefix: `function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {`,
    suffix: '}'
  });
  console.log(completion);

  // 代码解释
  console.log('\n【代码解释】');
  const explanation = await assistant.process('explanation', `
    const cache = new Map();
    function fibonacci(n) {
      if (cache.has(n)) return cache.get(n);
      if (n <= 1) return n;
      const result = fibonacci(n - 1) + fibonacci(n - 2);
      cache.set(n, result);
      return result;
    }
  `);
  console.log(explanation);

  // 代码审查
  console.log('\n【代码审查】');
  const review = await assistant.process('review', `
    function getUserById(id) {
      return fetch('/api/users/' + id)
        .then(res => res.json());
    }
  `);
  console.log(review);

  // 调试
  console.log('\n【调试】');
  const debug = await assistant.process('debug', `
    function addNumbers(a, b) {
      return a + b;
    }
    console.log(addNumbers("1", "2"));
  `, { error: '输出结果是"12"而不是3' });
  console.log(debug);
}

// assistantDemo();
```

---

## 8. AI应用架构

### 8.1 LangChain

LangChain是当前最流行的LLM应用开发框架，提供了丰富的组件和抽象。

```typescript
/**
 * LangChain集成指南
 * 使用LangChain构建LLM应用
 */

import { OpenAI } from 'langchain/openai';
import { PromptTemplate, ChainValues } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { SerpAPI } from 'langchain/tools';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 基础使用 ====================

/**
 * 简单的LLM调用
 */
async function basicLangChain() {
  // 初始化模型
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7
  });

  // 调用模型
  const res = await model.invoke('用一句话解释什么是量子计算');
  console.log('回答:', res);
}

/**
 * 使用Prompt模板
 */
async function promptTemplateDemo() {
  const model = new OpenAI({ temperature: 0.7 });

  // 创建模板
  const template = PromptTemplate.fromTemplate(`
你是一个{language}程序员。
请用{language}写一个{task}的函数。

要求：
1. 代码简洁高效
2. 包含适当的注释
3. 考虑边界情况
`);

  // 创建链
  const chain = new LLMChain({ llm: model, prompt: template });

  // 执行链
  const result = await chain.call({
    language: 'TypeScript',
    task: '数组去重'
  });

  console.log('生成的代码:', result.text);
}

/**
 * 序列链
 */
async function sequentialChainDemo() {
  const model = new OpenAI({ temperature: 0.7 });

  // 第一个链：生成主题
  const topicPrompt = PromptTemplate.fromTemplate(
    '为以下文章生成3个关键词：{input}'
  );
  const topicChain = new LLMChain({
    llm: model,
    prompt: topicPrompt,
    outputKey: 'topics'
  });

  // 第二个链：生成摘要
  const summaryPrompt = PromptTemplate.fromTemplate(
    '基于这些关键词写一篇50字的短文：{topics}'
  );
  const summaryChain = new LLMChain({
    llm: model,
    prompt: summaryPrompt,
    outputKey: 'summary'
  });

  // 组合链
  // 注意：实际使用需要用LangChain的SequentialChain
  const topicResult = await topicChain.call({ input: '人工智能在医疗领域的应用' });
  console.log('生成的关键词:', topicResult.topics);

  const summaryResult = await summaryChain.call({ topics: topicResult.topics });
  console.log('生成的摘要:', summaryResult.summary);
}

/**
 * 工具调用Agent
 */
async function toolAgentDemo() {
  const model = new OpenAI({ temperature: 0 });

  // 定义工具
  const tools = [
    new SerpAPI(process.env.SERPAPI_API_KEY, {
      location: 'Beijing,China',
      num: 5
    })
  ];

  // 初始化Agent
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'zero-shot-react-description',
    verbose: true
  });

  // 执行
  const result = await executor.invoke({
    input: '搜索一下今天北京的天气，并告诉我是否适合出门'
  });

  console.log('Agent结果:', result);
}

/**
 * 带记忆的对话
 */
async function memoryChatDemo() {
  const { ConversationChain } = await import('langchain/chains');
  const { BufferMemory } = await import('langchain/memory');
  const model = new OpenAI({ temperature: 0.7 });

  // 创建记忆
  const memory = new BufferMemory();

  // 创建对话链
  const chain = new ConversationChain({ llm: model, memory });

  // 对话
  const res1 = await chain.call({ input: '我叫张三，是一名前端工程师' });
  console.log('AI:', res1.response);

  const res2 = await chain.call({ input: '我叫什么名字？' });
  console.log('AI:', res2.response);
}

// ==================== 运行示例 ====================

// basicLangChain();
// promptTemplateDemo();
// sequentialChainDemo();
// toolAgentDemo();
// memoryChatDemo();
```

### 8.2 LlamaIndex

LlamaIndex专注于构建知识增强的LLM应用，是RAG系统的理想选择。

```typescript
/**
 * LlamaIndex集成指南
 * 构建知识增强的LLM应用
 */

import { Document } from 'llamaindex';
import { VectorStoreIndex, SimpleDirectoryReader } from 'llamaindex';
import { OpenAI } from 'llamaindex';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 基础RAG ====================

/**
 * 简单的RAG实现
 */
async function simpleRAGDemo() {
  // 1. 创建文档
  const documents = [
    new Document({
      text: 'React是由Facebook开发的JavaScript库，用于构建用户界面。',
      metadata: { source: 'React文档', category: 'frontend' }
    }),
    new Document({
      text: 'Vue是一个渐进式JavaScript框架，易于学习和使用。',
      metadata: { source: 'Vue文档', category: 'frontend' }
    }),
    new Document({
      text: 'Angular是Google开发的前端框架，提供了完整的解决方案。',
      metadata: { source: 'Angular文档', category: 'frontend' }
    })
  ];

  // 2. 创建索引
  const index = await VectorStoreIndex.fromDocuments(documents);

  // 3. 创建查询引擎
  const queryEngine = index.asQueryEngine();

  // 4. 查询
  const response = await queryEngine.query('React有什么特点？');

  console.log('回答:', response.toString());
}

/**
 * 从目录加载文档
 */
async function loadDocumentsDemo() {
  // 使用SimpleDirectoryReader加载目录中的所有文档
  const reader = new SimpleDirectoryReader();
  const documents = await reader.loadData('./docs');  // 文档目录

  console.log(`加载了 ${documents.length} 个文档`);

  // 创建索引
  const index = await VectorStoreIndex.fromDocuments(documents);

  // 查询引擎
  const queryEngine = index.asQueryEngine({
    similarityTopK: 3  // 返回前3个最相关的文档
  });

  const response = await queryEngine.query('文档中关于什么内容？');
  console.log('回答:', response.toString());
}

/**
 * 带有聊天记忆的RAG
 */
async function chatRAGDemo() {
  const { Document } = await import('llamaindex');
  const { VectorStoreIndex } = await import('llamaindex');
  const { ChatEngine, SimpleChatEngine } = await import('llamaindex');

  // 文档
  const documents = [
    new Document({
      text: 'TypeScript是JavaScript的超集，添加了类型系统。',
      metadata: { source: 'TS文档' }
    }),
    new Document({
      text: 'JavaScript是一种脚本语言，用于Web开发。',
      metadata: { source: 'JS文档' }
    })
  ];

  // 创建索引
  const index = await VectorStoreIndex.fromDocuments(documents);

  // 创建聊天引擎
  const chatEngine = index.asChatEngine({
    chatModel: new OpenAI({ model: 'gpt-4o' }),
    systemPrompt: '你是一个技术文档助手，基于提供的文档回答问题。'
  });

  // 多轮对话
  const res1 = await chatEngine.chat('TypeScript是什么？');
  console.log('AI:', res1.toString());

  const res2 = await chatEngine.chat('它和JavaScript有什么关系？');
  console.log('AI:', res2.toString());
}

/**
 * 自定义检索器
 */
async function customRetrieverDemo() {
  const { Document } = await import('llamaindex');
  const { VectorStoreIndex, VectorRetriever } = await import('llamaindex');

  const documents = [
    new Document({ text: '苹果是一种水果', metadata: { category: 'food' } }),
    new Document({ text: '苹果公司生产iPhone', metadata: { category: 'tech' } }),
    new Document({ text: '香蕉是黄色的水果', metadata: { category: 'food' } })
  ];

  const index = await VectorStoreIndex.fromDocuments(documents);

  // 自定义检索器
  const retriever = new VectorRetriever(index, {
    similarityTopK: 2,
    filters: { category: 'tech' }  // 只检索tech类别
  });

  const nodes = await retriever.retrieve('苹果');

  console.log('检索结果:');
  nodes.forEach(node => {
    console.log(`- ${node.node.getContent()} (分数: ${node.score})`);
  });
}

// ==================== 运行示例 ====================

// simpleRAGDemo();
// loadDocumentsDemo();
// chatRAGDemo();
// customRetrieverDemo();
```

### 8.3 向量数据库

向量数据库是AI应用的存储层，用于高效的相似度检索。

```typescript
/**
 * 向量数据库集成
 * 支持Pinecone、Milvus、Weaviate等
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== Pinecone ====================

/**
 * Pinecone向量数据库操作
 */
class PineconeVectorStore {
  private pinecone: Pinecone;
  private indexName: string;

  constructor(apiKey: string, indexName: string) {
    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
  }

  /**
   * 创建索引
   */
  async createIndex(dimension: number = 1536) {
    await this.pinecone.createIndex({
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
    console.log(`索引 ${this.indexName} 创建成功`);
  }

  /**
   * 插入向量
   */
  async upsert(
    vectors: { id: string; values: number[]; metadata?: Record<string, any> }[]
  ) {
    const index = this.pinecone.Index(this.indexName);

    await index.upsert(vectors);
    console.log(`成功插入 ${vectors.length} 个向量`);
  }

  /**
   * 查询相似向量
   */
  async query(
    queryVector: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ) {
    const index = this.pinecone.Index(this.indexName);

    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter
    });

    return results.matches?.map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata
    }));
  }

  /**
   * 删除向量
   */
  async delete(ids: string[]) {
    const index = this.pinecone.Index(this.indexName);
    await index.deleteMany(ids);
    console.log(`成功删除 ${ids.length} 个向量`);
  }
}

/**
 * 使用示例
 */
async function pineconeDemo() {
  const vectorStore = new PineconeVectorStore(
    process.env.PINECONE_API_KEY!,
    'my-knowledge-base'
  );

  // 创建索引（如果不存在）
  // await vectorStore.createIndex(1536);

  // 插入文档向量
  await vectorStore.upsert([
    {
      id: 'doc1',
      values: [0.1, 0.2, 0.3, /* ... 1536维度 */],
      metadata: { source: 'React文档', content: 'React是一个UI库' }
    },
    {
      id: 'doc2',
      values: [0.15, 0.25, 0.35, /* ... */],
      metadata: { source: 'Vue文档', content: 'Vue是一个渐进式框架' }
    }
  ]);

  // 查询
  const results = await vectorStore.query(
    [0.12, 0.22, 0.32, /* ... */],
    5
  );

  console.log('查询结果:', results);
}

/**
 * Milvus连接
 */
async function milvusDemo() {
  // Milvus的连接方式
  // const { MilvusClient } = require('@zilliz/milvus2-sdk-node');

  // const client = new MilvusClient('localhost:19530');

  // // 创建集合
  // await client.createCollection({
  //   collection_name: 'my_collection',
  //   fields: [
  //     { name: 'id', data_type: 'VarChar', params: { max_length: 64 }, is_primary_key: true },
  //     { name: 'embedding', data_type: 'FloatVector', params: { dim: 1536 } },
  //     { name: 'content', data_type: 'VarChar', params: { max_length: 65535 } }
  //   ]
  // });

  console.log('Milvus示例（需要本地Milvus服务）');
}

// ==================== 运行 ====================

// pineconeDemo();
// milvusDemo();
```

### 8.4 实战：完整架构

以下是一个完整的AI应用架构，包含多个组件的协作：

```typescript
/**
 * 完整AI应用架构
 * 集成LangChain、向量数据库、Agent的完整示例
 */

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 组件定义 ====================

/**
 * 文档处理器
 */
class DocumentProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 500, chunkOverlap: number = 50) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * 文本分块
   */
  chunk(text: string): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[。！？\n]/);

    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = currentChunk.slice(-this.chunkOverlap) + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

/**
 * Embedding服务
 */
class EmbeddingService {
  private openai: OpenAI;
  private model: string;

  constructor(model: string = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts
    });

    return response.data.map(d => d.embedding);
  }

  async embedOne(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text
    });

    return response.data[0].embedding;
  }
}

/**
 * 向量存储
 */
class VectorStore {
  private pinecone: Pinecone;
  private indexName: string;

  constructor(indexName: string) {
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    this.indexName = indexName;
  }

  async upsert(
    vectors: { id: string; values: number[]; metadata: Record<string, any> }[]
  ) {
    const index = this.pinecone.Index(this.indexName);
    await index.upsert(vectors);
  }

  async query(
    queryVector: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ) {
    const index = this.pinecone.Index(this.indexName);
    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter
    });

    return results.matches?.map(m => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata
    }));
  }
}

// ==================== 主应用类 ====================

class AIApplication {
  private llm: OpenAI;
  private embeddings: EmbeddingService;
  private vectorStore: VectorStore;
  private documentProcessor: DocumentProcessor;

  constructor() {
    this.llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.embeddings = new EmbeddingService();
    this.vectorStore = new VectorStore('knowledge-base');
    this.documentProcessor = new DocumentProcessor();
  }

  /**
   * 索引文档
   */
  async indexDocument(
    id: string,
    text: string,
    metadata: Record<string, any> = {}
  ) {
    // 1. 分块
    const chunks = this.documentProcessor.chunk(text);
    console.log(`文档分块: ${chunks.length} 块`);

    // 2. 向量化
    const vectors = await this.embeddings.embed(chunks);
    console.log('向量化完成');

    // 3. 存储
    const vectorsWithMeta = chunks.map((chunk, i) => ({
      id: `${id}_chunk_${i}`,
      values: vectors[i],
      metadata: { ...metadata, chunk: chunk.slice(0, 200) }
    }));

    await this.vectorStore.upsert(vectorsWithMeta);
    console.log('存储完成');
  }

  /**
   * 问答
   */
  async query(
    question: string,
    filter?: Record<string, any>
  ): Promise<{
    answer: string;
    sources: { id: string; content: string; score: number }[];
  }> {
    // 1. 向量化问题
    const queryVector = await this.embeddings.embedOne(question);

    // 2. 检索相关文档
    const results = await this.vectorStore.query(queryVector, 5, filter);

    if (!results || results.length === 0) {
      return {
        answer: '抱歉，知识库中没有找到相关信息。',
        sources: []
      };
    }

    // 3. 构建上下文
    const context = results
      .map(r => `[来源]: ${r.metadata?.chunk || ''}`)
      .join('\n\n');

    // 4. 生成回答
    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是问答助手，基于提供的参考资料回答问题。
如果资料中没有相关信息，请说明不知道。

参考资料：
${context}`
        },
        { role: 'user', content: question }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return {
      answer: response.choices[0].message.content!,
      sources: results.map(r => ({
        id: r.id,
        content: r.metadata?.chunk || '',
        score: r.score
      }))
    };
  }

  /**
   * 带引用的回答
   */
  async queryWithCitations(question: string) {
    const result = await this.query(question);

    const citationPrompt = `
基于以下回答，添加引用标注。

回答：
${result.answer}

来源：
${result.sources.map((s, i) => `[${i + 1}] ${s.content}`).join('\n')}

请在回答中适当位置添加引用标注，如：[1]
`;

    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: citationPrompt }],
      max_tokens: 1200
    });

    return {
      answer: response.choices[0].message.content!,
      sources: result.sources
    };
  }
}

// ==================== 使用示例 ====================

async function main() {
  const app = new AIApplication();

  // 索引文档
  await app.indexDocument('react_guide', `
    React是Facebook开发的用于构建用户界面的JavaScript库。
    它采用组件化开发模式，支持虚拟DOM以提升性能。
    React的核心概念包括：组件、Props、State、Hooks。
    常用的Hooks有useState、useEffect、useContext等。
    React 18引入了并发模式和Suspense。
  `, { category: 'frontend', source: 'React指南' });

  // 问答
  console.log('\n=== 问答结果 ===');
  const result = await app.queryWithCitations('React的Hooks是什么？');

  console.log('回答:', result.answer);
  console.log('\n参考来源:');
  result.sources.forEach((s, i) => {
    console.log(`${i + 1}. ${s.content} (相似度: ${s.score.toFixed(4)})`);
  });
}

// main();
```

---

## 9. 安全与合规

### 9.1 内容审核

内容审核是AI应用的重要环节，防止有害内容传播。

```typescript
/**
 * 内容审核系统
 * 检测和过滤有害内容
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 有害内容类型 ====================

type HarmCategory =
  | 'violence'
  | 'sexual'
  | 'hate_speech'
  | 'harassment'
  | 'dangerous_content'
  | 'self_harm'
  | 'political';

interface ModerationResult {
  flagged: boolean;
  categories: HarmCategory[];
  scores: Record<HarmCategory, number>;
  approved: boolean;
  message?: string;
}

interface FilterRule {
  pattern: RegExp;
  category: HarmCategory;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// ==================== 规则引擎 ====================

class ContentModerator {
  private openai: OpenAI;
  private customRules: FilterRule[];
  private threshold: number;

  constructor(threshold: number = 0.5) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.customRules = [];
    this.threshold = threshold;
  }

  /**
   * 使用OpenAI审核API
   */
  async moderate(text: string): Promise<ModerationResult> {
    const response = await this.openai.moderations.create({
      input: text,
      model: 'omni-moderation-latest'  // 最新审核模型
    });

    const result = response.results[0];

    // 提取被标记的类别
    const categories: HarmCategory[] = [];
    const scores: Record<HarmCategory, number> = {} as any;

    const categoryMap: Record<string, HarmCategory> = {
      violence: 'violence',
      sexual: 'sexual',
      hate: 'hate_speech',
      harassment: 'harassment',
      'dangerous-content': 'dangerous_content',
      'self-harm': 'self_harm'
    };

    for (const [key, value] of Object.entries(result.categories)) {
      if (value) {
        const category = categoryMap[key] || key as HarmCategory;
        categories.push(category);
        scores[category] = (result.category_scores as any)[key];
      }
    }

    return {
      flagged: result.flagged,
      categories,
      scores,
      approved: !result.flagged,
      message: result.flagged
        ? `检测到有害内容: ${categories.join(', ')}`
        : '内容审核通过'
    };
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: Omit<FilterRule, 'pattern'> & { pattern: string }) {
    this.customRules.push({
      ...rule,
      pattern: new RegExp(rule.pattern, 'gi')
    });
  }

  /**
   * 应用自定义规则
   */
  applyCustomRules(text: string): {
    violations: { rule: FilterRule; match: string }[];
  } {
    const violations: { rule: FilterRule; match: string }[] = [];

    for (const rule of this.customRules) {
      const matches = text.match(rule.pattern);
      if (matches) {
        violations.push({ rule, match: matches[0] });
      }
    }

    return { violations };
  }

  /**
   * 综合审核
   */
  async fullModeration(text: string): Promise<ModerationResult> {
    // 1. OpenAI审核
    const aiResult = await this.moderate(text);

    // 2. 自定义规则
    const { violations } = this.applyCustomRules(text);

    // 3. 综合判断
    if (violations.length > 0) {
      const highSeverity = violations.some(v => v.rule.severity === 'high');
      if (highSeverity) {
        return {
          flagged: true,
          categories: ['dangerous_content'],
          scores: { dangerous_content: 1.0 },
          approved: false,
          message: `检测到违规内容: ${violations.map(v => v.rule.message).join(', ')}`
        };
      }
    }

    return aiResult;
  }

  /**
   * 批量审核
   */
  async moderateBatch(texts: string[]): Promise<ModerationResult[]> {
    return Promise.all(texts.map(text => this.moderate(text)));
  }
}

/**
 * 输入过滤器
 */
class InputFilter {
  private patterns: {
    pattern: RegExp;
    replacement: string;
    description: string;
  }[];

  constructor() {
    this.patterns = [
      // 移除多余的空白
      { pattern: /\s+/g, replacement: ' ', description: '多余空白' },
      // 移除HTML标签
      { pattern: /<[^>]+>/g, replacement: '', description: 'HTML标签' },
      // 移除特殊控制字符
      { pattern: /[\x00-\x1F\x7F]/g, replacement: '', description: '控制字符' }
    ];
  }

  /**
   * 过滤输入
   */
  filter(input: string): { cleaned: string; removed: string[] } {
    const removed: string[] = [];
    let cleaned = input;

    for (const { pattern, replacement, description } of this.patterns) {
      const matches = cleaned.match(pattern);
      if (matches && matches.length > 0) {
        removed.push(`${description}: ${matches.length}处`);
        cleaned = cleaned.replace(pattern, replacement);
      }
    }

    return { cleaned: cleaned.trim(), removed };
  }

  /**
   * 长度限制
   */
  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }
}

// ==================== 使用示例 ====================

async function moderationDemo() {
  const moderator = new ContentModerator(0.5);
  const inputFilter = new InputFilter();

  console.log('=== 内容审核演示 ===\n');

  // 测试文本
  const testTexts = [
    '今天天气真好，我们去公园玩吧！',
    '这个产品的质量太差了，完全是垃圾',
    '如何制作炸弹'  // 危险内容
  ];

  for (const text of testTexts) {
    // 输入过滤
    const { cleaned, removed } = inputFilter.filter(text);
    const truncated = inputFilter.truncate(cleaned, 1000);

    console.log(`原文: ${text}`);
    console.log(`清理后: ${truncated}`);

    // 内容审核
    const result = await moderator.fullModeration(truncated);
    console.log(`审核结果: ${result.approved ? '通过' : '拒绝'}`);
    if (result.message) {
      console.log(`原因: ${result.message}`);
    }
    console.log('');
  }

  // 添加自定义规则
  moderator.addRule({
    pattern: '垃圾|废物|智障',
    category: 'harassment',
    severity: 'medium',
    message: '包含侮辱性词汇'
  });
}

// moderationDemo();
```

### 9.2 数据隐私

数据隐私保护是AI应用必须考虑的重要问题。

```typescript
/**
 * 数据隐私保护系统
 * 实现数据脱敏、加密、访问控制
 */

import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 敏感数据检测 ====================

type SensitiveType = 'phone' | 'email' | 'id_card' | 'bank_card' | 'address' | 'name';

interface SensitiveData {
  type: SensitiveType;
  value: string;
  startIndex: number;
  endIndex: number;
}

class SensitiveDataDetector {
  private patterns: Record<SensitiveType, RegExp>;

  constructor() {
    this.patterns = {
      phone: /1[3-9]\d{9}/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      id_card: /\d{17}[\dXx]/g,
      bank_card: /\d{16,19}/g,
      address: /\d{1,5}[省市 区街道][^\s]{5,50}/g,
      name: /[张李王刘陈杨黄赵吴周徐孙马朱胡郭何高林郑]/[三四五六七八九十百千万亿]/g
    };
  }

  /**
   * 检测敏感数据
   */
  detect(text: string): SensitiveData[] {
    const results: SensitiveData[] = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const regex = new RegExp(pattern.source, 'g');
      let match;

      while ((match = regex.exec(text)) !== null) {
        results.push({
          type: type as SensitiveType,
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    // 按位置排序
    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * 脱敏处理
   */
  mask(text: string): { masked: string; count: number } {
    const sensitiveData = this.detect(text);
    let masked = text;
    let count = 0;

    // 从后向前替换，避免索引偏移
    for (const data of sensitiveData.reverse()) {
      const maskedValue = this.maskValue(data.value, data.type);
      masked = masked.slice(0, data.startIndex) + maskedValue + masked.slice(data.endIndex);
      count++;
    }

    return { masked, count };
  }

  /**
   * 脱敏值
   */
  private maskValue(value: string, type: SensitiveType): string {
    switch (type) {
      case 'phone':
        return value.slice(0, 3) + '****' + value.slice(-4);
      case 'email':
        const [name, domain] = value.split('@');
        return name.slice(0, 2) + '***@' + domain;
      case 'id_card':
        return value.slice(0, 6) + '********' + value.slice(-4);
      case 'bank_card':
        return value.slice(0, 4) + ' **** **** ' + value.slice(-4);
      case 'address':
        return value.slice(0, 2) + '***';
      case 'name':
        return value[0] + '**';
      default:
        return '***';
    }
  }
}

// ==================== 数据加密 ====================

class DataEncryption {
  private algorithm: string;
  private key: Buffer;

  constructor() {
    // 从环境变量获取密钥（实际应使用安全的密钥管理）
    const secret = process.env.ENCRYPTION_KEY || 'default-secret-key-32bytes!!';
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  /**
   * 加密数据
   */
  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 返回 iv:authTag:encrypted 格式
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 生成哈希
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 生成随机Token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// ==================== 访问控制 ====================

interface AccessControl {
  userId: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  expiresAt?: number;
}

class AccessControlList {
  private acl: Map<string, AccessControl[]>;

  constructor() {
    this.acl = new Map();
  }

  /**
   * 添加权限
   */
  grant(userId: string, resource: string, action: AccessControl['action'], ttl?: number) {
    const key = `${userId}:${resource}`;
    const permissions = this.acl.get(key) || [];

    permissions.push({
      userId,
      resource,
      action,
      expiresAt: ttl ? Date.now() + ttl : undefined
    });

    this.acl.set(key, permissions);
  }

  /**
   * 检查权限
   */
  check(userId: string, resource: string, action: AccessControl['action']): boolean {
    const key = `${userId}:${resource}`;
    const permissions = this.acl.get(key) || [];

    for (const perm of permissions) {
      if (perm.action === 'admin' || perm.action === action) {
        if (!perm.expiresAt || perm.expiresAt > Date.now()) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 撤销权限
   */
  revoke(userId: string, resource: string) {
    const key = `${userId}:${resource}`;
    this.acl.delete(key);
  }
}

// ==================== 使用示例 ====================

function privacyDemo() {
  const detector = new SensitiveDataDetector();
  const encryption = new DataEncryption();
  const acl = new AccessControlList();

  console.log('=== 数据隐私保护演示 ===\n');

  // 1. 敏感数据检测
  const text = '联系电话：13812345678，邮箱：user@example.com，身份证：110101199001011234';
  const sensitiveData = detector.detect(text);
  console.log('检测到的敏感数据:');
  sensitiveData.forEach(d => console.log(`- ${d.type}: ${d.value}`));

  // 2. 数据脱敏
  const { masked, count } = detector.mask(text);
  console.log(`\n脱敏后 (${count}处): ${masked}`);

  // 3. 数据加密
  const original = '这是一个秘密消息';
  const encrypted = encryption.encrypt(original);
  const decrypted = encryption.decrypt(encrypted);
  console.log(`\n加密: ${encrypted.slice(0, 50)}...`);
  console.log(`解密: ${decrypted}`);

  // 4. 访问控制
  acl.grant('user1', 'document:123', 'read', 3600000);  // 1小时有效
  acl.grant('user1', 'document:123', 'write');

  console.log(`\n权限检查:`);
  console.log(`user1 读取 document:123: ${acl.check('user1', 'document:123', 'read')}`);
  console.log(`user1 删除 document:123: ${acl.check('user1', 'document:123', 'delete')}`);
}

// privacyDemo();
```

### 9.3 成本控制

AI应用的成本控制至关重要，需要监控和优化API使用。

```typescript
/**
 * 成本控制系统
 * 监控和优化API使用成本
 */

import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 成本统计 ====================

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
}

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

class CostTracker {
  private usage: TokenUsage[];
  private pricing: Record<string, ModelPricing>;

  constructor() {
    this.usage = [];

    // 最新定价（2024年）
    this.pricing = {
      'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10.0 },
      'gpt-4-turbo': { inputPerMillion: 10.0, outputPerMillion: 30.0 },
      'gpt-3.5-turbo': { inputPerMillion: 0.5, outputPerMillion: 1.5 },
      'claude-3-5-sonnet': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
      'claude-3-opus': { inputPerMillion: 15.0, outputPerMillion: 75.0 }
    };
  }

  /**
   * 记录使用
   */
  recordUsage(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): TokenUsage {
    const pricing = this.pricing[model] || { inputPerMillion: 5, outputPerMillion: 15 };

    const cost =
      (promptTokens / 1_000_000) * pricing.inputPerMillion +
      (completionTokens / 1_000_000) * pricing.outputPerMillion;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      timestamp: Date.now()
    };

    this.usage.push(usage);
    return usage;
  }

  /**
   * 获取总成本
   */
  getTotalCost(startDate?: number, endDate?: number): number {
    return this.usage
      .filter(u => {
        if (startDate && u.timestamp < startDate) return false;
        if (endDate && u.timestamp > endDate) return false;
        return true;
      })
      .reduce((sum, u) => sum + u.cost, 0);
  }

  /**
   * 获取使用统计
   */
  getStats(): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageCostPerRequest: number;
    byDay: Record<string, { requests: number; cost: number }>;
  } {
    const totalRequests = this.usage.length;
    const totalTokens = this.usage.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = this.getTotalCost();

    // 按天统计
    const byDay: Record<string, { requests: number; cost: number }> = {};
    for (const u of this.usage) {
      const day = new Date(u.timestamp).toISOString().slice(0, 10);
      if (!byDay[day]) {
        byDay[day] = { requests: 0, cost: 0 };
      }
      byDay[day].requests++;
      byDay[day].cost += u.cost;
    }

    return {
      totalRequests,
      totalTokens,
      totalCost,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      byDay
    };
  }

  /**
   * 设置预算警告
   */
  setBudgetWarning(
    dailyLimit: number,
    callback: (day: string, cost: number, limit: number) => void
  ) {
    // 简化实现，实际应使用定时任务
    setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      const todayUsage = this.usage.filter(
        u => new Date(u.timestamp).toISOString().slice(0, 10) === today
      );
      const todayCost = todayUsage.reduce((sum, u) => sum + u.cost, 0);

      if (todayCost > dailyLimit) {
        callback(today, todayCost, dailyLimit);
      }
    }, 60 * 60 * 1000);  // 每小时检查一次
  }
}

/**
 * Token优化器
 */
class TokenOptimizer {
  /**
   * 估算Token数量
   */
  static estimateTokens(text: string): number {
    // 简单估算：中文约1.5 tokens/字符，英文约1.3 tokens/词
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
  }

  /**
   * 压缩Prompt
   */
  static compressPrompt(prompt: string, targetTokens?: number): string {
    // 简单实现，实际应使用更智能的压缩算法
    const currentTokens = this.estimateTokens(prompt);

    if (!targetTokens || currentTokens <= targetTokens) {
      return prompt;
    }

    // 移除空白字符
    let compressed = prompt.replace(/\s+/g, ' ');

    // 如果还不够，截断
    const ratio = targetTokens / currentTokens;
    const targetLength = Math.floor(prompt.length * ratio);
    compressed = compressed.slice(0, targetLength);

    return compressed + '...';
  }

  /**
   * 优化消息历史
   */
  static optimizeHistory(
    messages: { role: string; content: string }[],
    maxTokens: number
  ): { role: string; content: string }[] {
    let totalTokens = 0;
    const optimized: { role: string; content: string }[] = [];

    // 从最新的消息开始，保留重要的
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const tokens = this.estimateTokens(msg.content);

      if (totalTokens + tokens <= maxTokens) {
        optimized.unshift(msg);
        totalTokens += tokens;
      } else {
        break;
      }
    }

    return optimized;
  }
}

// ==================== 使用示例 ====================

function costDemo() {
  const tracker = new CostTracker();

  console.log('=== 成本控制演示 ===\n');

  // 模拟API调用
  tracker.recordUsage('gpt-4o', 1000, 500);
  tracker.recordUsage('gpt-4o', 800, 300);
  tracker.recordUsage('claude-3-5-sonnet', 1200, 600);

  // 获取统计
  const stats = tracker.getStats();

  console.log('使用统计:');
  console.log(`- 总请求数: ${stats.totalRequests}`);
  console.log(`- 总Token数: ${stats.totalTokens}`);
  console.log(`- 总成本: $${stats.totalCost.toFixed(4)}`);
  console.log(`- 平均请求成本: $${stats.averageCostPerRequest.toFixed(4)}`);

  console.log('\n每日成本:');
  Object.entries(stats.byDay).forEach(([day, data]) => {
    console.log(`  ${day}: $${data.cost.toFixed(4)} (${data.requests}请求)`);
  });

  // Token优化
  console.log('\nToken优化:');
  const longText = '这是一段很长的文本...' + 'x'.repeat(1000);
  const estimated = TokenOptimizer.estimateTokens(longText);
  console.log(`原文Token估算: ${estimated}`);

  const compressed = TokenOptimizer.compressPrompt(longText, 100);
  console.log(`压缩后Token估算: ${TokenOptimizer.estimateTokens(compressed)}`);
}

// costDemo();
```

### 9.4 我的思考：AI应用的挑战

AI应用开发面临多方面的挑战，需要开发者全面考虑：

**技术层面的挑战**：

1. **延迟与性能**
   - LLM推理延迟高，影响用户体验
   - 流式输出是改善体验的关键
   - 缓存和批处理可以优化成本

2. **上下文窗口限制**
   - 128K-200K的窗口看似很大，但处理长文档时仍会遇到瓶颈
   - RAG是解决长文档问题的标准方案
   - 需要精心设计知识库的分块策略

3. **可靠性与一致性**
   - LLM输出不稳定，同样的Prompt可能产生不同结果
   - 结构化输出（JSON Mode）可以提高可预测性
   - Chain-of-Thought可以提高推理准确性

**业务层面的挑战**：

```typescript
// 可靠性保障的工程实践
class ReliableAIApplication {
  private maxRetries: number;
  private timeout: number;
  private fallbackResponses: string[];

  constructor() {
    this.maxRetries = 3;
    this.timeout = 30000;  // 30秒
    this.fallbackResponses = [
      '抱歉，我现在无法回答这个问题，请稍后再试。',
      '这个问题比较复杂，能否换个方式提问？',
      '我需要更多信息来帮助您，请详细描述一下。'
    ];
  }

  /**
   * 带重试的LLM调用
   */
  async callWithRetry(
    prompt: string,
    options?: { retries?: number; timeout?: number }
  ): Promise<string> {
    const retries = options?.retries ?? this.maxRetries;
    const timeout = options?.timeout ?? this.timeout;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 带超时的调用
        const result = await this.callWithTimeout(prompt, timeout);
        return result;
      } catch (error: any) {
        console.log(`尝试 ${attempt}/${retries} 失败: ${error.message}`);

        if (attempt === retries) {
          // 最后一次尝试失败，使用兜底回复
          return this.getFallbackResponse();
        }

        // 指数退避
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return this.getFallbackResponse();
  }

  private async callWithTimeout(prompt: string, timeout: number): Promise<string> {
    return Promise.race([
      this.callLLM(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), timeout)
      )
    ]);
  }

  private async callLLM(prompt: string): Promise<string> {
    // 实际LLM调用
    // ...
    return 'LLM响应';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFallbackResponse(): string {
    return this.fallbackResponses[
      Math.floor(Math.random() * this.fallbackResponses.length)
    ];
  }
}
```

**道德与法律层面的挑战**：

1. **内容安全**
   - 防止生成有害内容
   - 建立完善的内容审核机制
   - 记录审计日志

2. **隐私保护**
   - 用户数据的收集和使用需要明确告知
   - 敏感信息需要脱敏处理
   - 考虑数据本地化要求

3. **版权与归属**
   - AI生成内容的版权归属问题
   - 训练数据的合规性
   - 原创性与抄袭的边界

**组织层面的挑战**：

1. **技能缺口**
   - Prompt工程成为新技能
   - AI与传统开发流程的结合
   - 持续学习和适应

2. **成本管理**
   - API调用的成本控制
   - ROI评估
   - 优化与降本

3. **风险管理**
   - AI误判的后果
   - 建立人工审核机制
   - 应急预案

---

## 10. 案例：智能客服

### 10.1 完整对话流程

以下是一个完整的智能客服系统实现：

```typescript
/**
 * 智能客服系统
 * 完整的生产级客服机器人实现
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 核心组件 ====================

/**
 * 意图识别器
 */
class IntentClassifier {
  private intents: Map<string, {
    keywords: string[];
    response: string;
    requiresSlot?: string[];
  }>;

  constructor() {
    this.intents = new Map([
      ['greeting', {
        keywords: ['你好', '您好', 'hi', 'hello', '在吗'],
        response: '您好！我是智能客服小助手，很高兴为您服务。请问有什么可以帮助您的？'
      }],
      ['order_inquiry', {
        keywords: ['订单', '查单', '发货', '物流', '到了吗'],
        response: '好的，我来帮您查询订单。请问能提供一下订单号吗？',
        requiresSlot: ['orderId']
      }],
      ['order_cancel', {
        keywords: ['取消订单', '退货', '退款', '不想要了'],
        response: '理解，我帮您处理取消订单。请问订单号是多少？取消的原因是什么呢？',
        requiresSlot: ['orderId', 'reason']
      }],
      ['complaint', {
        keywords: ['投诉', '差评', '不满', '垃圾', '问题'],
        response: '非常抱歉给您带来不好的体验，请您详细描述一下遇到的问题，我会尽快为您处理。',
        requiresSlot: ['description']
      }],
      ['transfer_human', {
        keywords: ['人工', '真人', '客服', '投诉'],
        response: '好的，我将为您转接人工客服，请稍等...'
      }],
      ['goodbye', {
        keywords: ['谢谢', '再见', '拜拜', '好的'],
        response: '感谢您的咨询，祝您生活愉快！如有需要随时联系我，再见！'
      }]
    ]);
  }

  /**
   * 识别意图
   */
  recognize(message: string): {
    intent: string;
    confidence: number;
    response: string;
    requiresSlot?: string[];
  } {
    const normalized = message.toLowerCase();

    for (const [intent, config] of this.intents.entries()) {
      for (const keyword of config.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          return {
            intent,
            confidence: 0.9,
            response: config.response,
            requiresSlot: config.requiresSlot
          };
        }
      }
    }

    return {
      intent: 'unknown',
      confidence: 0,
      response: '抱歉，我没有理解您的问题。您可以：\n1. 询问订单相关问题\n2. 申请取消订单或退款\n3. 反馈投诉或建议\n4. 转人工客服'
    };
  }
}

/**
 * 槽位填充器
 */
class SlotFiller {
  private slots: Map<string, any>;
  private requiredSlots: string[];

  constructor(requiredSlots: string[] = []) {
    this.slots = new Map();
    this.requiredSlots = requiredSlots;
  }

  /**
   * 提取槽位
   */
  extract(message: string) {
    // 提取订单号
    const orderIdMatch = message.match(/[A-Z0-9]{8,}/i);
    if (orderIdMatch) {
      this.slots.set('orderId', orderIdMatch[0]);
    }

    // 提取电话号码
    const phoneMatch = message.match(/1[3-9]\d{9}/);
    if (phoneMatch) {
      this.slots.set('phone', phoneMatch[0]);
    }

    // 如果消息较长，设为描述
    if (message.length > 10 && !this.slots.has('description')) {
      this.slots.set('description', message);
    }
  }

  /**
   * 获取缺失的必填槽位
   */
  getMissingSlots(): string[] {
    return this.requiredSlots.filter(s => !this.slots.has(s));
  }

  /**
   * 获取槽位值
   */
  get(slotName: string): any {
    return this.slots.get(slotName);
  }

  /**
   * 获取所有槽位
   */
  getAll(): Record<string, any> {
    return Object.fromEntries(this.slots);
  }

  /**
   * 清空槽位
   */
  clear() {
    this.slots.clear();
  }
}

/**
 * 对话状态机
 */
class DialogueStateMachine {
  private state: 'idle' | 'intent_confirmed' | 'slots_filling' | 'handling' | 'completed';
  private currentIntent: string | null;
  private filler: SlotFiller;

  constructor() {
    this.state = 'idle';
    this.currentIntent = null;
    this.filler = new SlotFiller();
  }

  /**
   * 处理意图识别结果
   */
  handleIntent(intent: string, requiresSlot?: string[]): {
    state: string;
    response: string;
    nextAction: 'wait_for_slot' | 'process' | 'end';
  } {
    this.currentIntent = intent;

    if (intent === 'greeting' || intent === 'goodbye') {
      this.state = 'completed';
      return {
        state: this.state,
        response: '再见',
        nextAction: 'end'
      };
    }

    if (requiresSlot && requiresSlot.length > 0) {
      this.filler = new SlotFiller(requiresSlot);
      this.state = 'slots_filling';
      return {
        state: this.state,
        response: '好的，请提供相关信息',
        nextAction: 'wait_for_slot'
      };
    }

    this.state = 'handling';
    return {
      state: this.state,
      response: '好的，我来帮您处理',
      nextAction: 'process'
    };
  }

  /**
   * 处理槽位填充
   */
  handleSlotExtraction(message: string): {
    filled: string[];
    missing: string[];
    isComplete: boolean;
  } {
    this.filler.extract(message);

    const filled = this.filler.getAll();
    const missing = this.filler.getMissingSlots();

    return {
      filled: Object.keys(filled),
      missing,
      isComplete: missing.length === 0
    };
  }

  /**
   * 获取槽位
   */
  getSlots(): Record<string, any> {
    return this.filler.getAll();
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = 'idle';
    this.currentIntent = null;
    this.filler.clear();
  }
}

// ==================== 主客服类 ====================

class SmartCustomerService {
  private intentClassifier: IntentClassifier;
  private stateMachine: DialogueStateMachine;
  private openai: OpenAI;
  private conversationHistory: Map<string, any[]>;

  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.stateMachine = new DialogueStateMachine();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.conversationHistory = new Map();
  }

  /**
   * 处理用户消息
   */
  async process(
    sessionId: string,
    message: string
  ): Promise<{
    response: string;
    shouldEnd: boolean;
    needsHuman: boolean;
  }> {
    // 获取历史
    const history = this.conversationHistory.get(sessionId) || [];

    // 1. 意图识别
    const intentResult = this.intentClassifier.recognize(message);

    // 如果是转人工
    if (intentResult.intent === 'transfer_human') {
      return {
        response: intentResult.response,
        shouldEnd: false,
        needsHuman: true
      };
    }

    // 2. 状态转换
    const stateResult = this.stateMachine.handleIntent(
      intentResult.intent,
      intentResult.requiresSlot
    );

    // 3. 槽位填充
    const slotResult = this.stateMachine.handleSlotExtraction(message);

    let response: string;

    if (stateResult.nextAction === 'wait_for_slot' && !slotResult.isComplete) {
      const missing = slotResult.missing.join('和');
      response = `好的，请提供您的${missing}`;
    } else if (stateResult.nextAction === 'process' || slotResult.isComplete) {
      // 4. 处理业务逻辑
      response = await this.handleBusiness(
        this.stateMachine.getSlots(),
        intentResult.intent
      );
    } else {
      response = intentResult.response;
    }

    // 5. 更新历史
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
    this.conversationHistory.set(sessionId, history);

    // 检查是否结束
    const shouldEnd =
      intentResult.intent === 'goodbye' ||
      stateResult.nextAction === 'end';

    return {
      response,
      shouldEnd,
      needsHuman: false
    };
  }

  /**
   * 处理业务逻辑
   */
  private async handleBusiness(
    slots: Record<string, any>,
    intent: string
  ): Promise<string> {
    switch (intent) {
      case 'order_inquiry':
        return this.handleOrderInquiry(slots.orderId);

      case 'order_cancel':
        return this.handleOrderCancel(slots.orderId, slots.reason);

      case 'complaint':
        return this.handleComplaint(slots.description);

      default:
        return '好的，我明白了，我会帮您处理。';
    }
  }

  private async handleOrderInquiry(orderId?: string): Promise<string> {
    if (!orderId) {
      return '请问您的订单号是多少？';
    }

    // 模拟查询
    return `正在为您查询订单 ${orderId}...
查询结果：
- 订单状态：已发货
- 物流公司：顺丰速运
- 预计送达：2-3天

感谢您的耐心等待！`;
  }

  private async handleOrderCancel(orderId?: string, reason?: string): Promise<string> {
    if (!orderId) {
      return '请问您的订单号是多少？';
    }

    if (!reason) {
      return '请问您取消订单的原因是什么呢？';
    }

    // 模拟取消
    return `已为您提交订单 ${orderId} 的取消申请。
取消原因：${reason}
退款将在1-3个工作日内原路返回。

感谢您的理解！`;
  }

  private async handleComplaint(description?: string): Promise<string> {
    if (!description) {
      return '请您详细描述一下遇到的问题，我们会尽快处理。';
    }

    // 模拟投诉处理
    return `感谢您反馈问题。
我们已经记录了您的问题：
"${description}"

我们的工作人员将在24小时内联系您解决。
给您带来的不便深表歉意！`;
  }

  /**
   * 获取会话历史
   */
  getHistory(sessionId: string): any[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  /**
   * 清除会话
   */
  clearSession(sessionId: string) {
    this.conversationHistory.delete(sessionId);
    this.stateMachine.reset();
  }
}

// ==================== 使用示例 ====================

async function customerServiceDemo() {
  console.log('=== 智能客服演示 ===\n');

  const service = new SmartCustomerService();
  const sessionId = 'session_' + Date.now();

  const conversations = [
    '你好',
    '我想查一下我的订单',
    '订单号是 ABC12345678',
    '我的货什么时候能到',
    '太慢了，我要投诉',
    '货物破损了，很不满意',
    '谢谢，再见'
  ];

  for (const message of conversations) {
    console.log('─'.repeat(40));
    console.log(`用户: ${message}`);

    const result = await service.process(sessionId, message);

    console.log(`客服: ${result.response}`);
    console.log(`结束会话: ${result.shouldEnd}`);
    console.log(`转人工: ${result.needsHuman}`);

    if (result.shouldEnd) {
      break;
    }
  }
}

// customerServiceDemo();
```

### 10.2 知识库集成

智能客服需要与知识库集成，提供准确的答案：

```typescript
/**
 * 知识库集成的客服系统
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 知识库条目 ====================

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  examples: string[];
  confidence: number;
  lastUpdated: string;
}

class KnowledgeBase {
  private entries: KnowledgeEntry[];

  constructor() {
    // 初始化知识库
    this.entries = [
      {
        id: 'faq001',
        question: '如何重置密码',
        answer: '重置密码步骤：\n1. 点击登录页的"忘记密码"\n2. 输入注册邮箱\n3. 查收邮件点击链接\n4. 设置新密码（至少8位）',
        category: '账户',
        tags: ['密码', '重置', '账户'],
        examples: ['密码忘了', '无法登录', '修改密码'],
        confidence: 0.9,
        lastUpdated: '2024-01-01'
      },
      {
        id: 'faq002',
        question: '订单如何取消',
        answer: '取消订单：\n1. 进入"我的订单"\n2. 选择要取消的订单\n3. 点击"取消订单"\n4. 选择原因并确认\n注意：已发货的订单无法取消，需申请退款',
        category: '订单',
        tags: ['订单', '取消', '退款'],
        examples: ['不要了', '取消订单', '退货'],
        confidence: 0.9,
        lastUpdated: '2024-01-01'
      },
      {
        id: 'faq003',
        question: '如何申请退款',
        answer: '申请退款：\n1. 进入订单详情\n2. 点击"申请退款"\n3. 选择退款原因\n4. 提交后1-3个工作日处理\n退款将原路返回',
        category: '退款',
        tags: ['退款', '钱', '返还'],
        examples: ['钱什么时候到', '退款查询', '货款'],
        confidence: 0.9,
        lastUpdated: '2024-01-01'
      },
      {
        id: 'faq004',
        question: '快递一直没到',
        answer: '快递延迟处理：\n1. 物流显示在途请耐心等待\n2. 超过5天未更新可联系客服核查\n3. 如超过预计时间可申请退款\n我们会给您妥善处理',
        category: '物流',
        tags: ['快递', '物流', '到了吗'],
        examples: ['还没到', '物流不动', '什么时候到'],
        confidence: 0.8,
        lastUpdated: '2024-01-01'
      }
    ];
  }

  /**
   * 搜索知识库
   */
  search(query: string, topK: number = 3): {
    entry: KnowledgeEntry;
    score: number;
    matchedOn: string[];
  }[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const results: {
      entry: KnowledgeEntry;
      score: number;
      matchedOn: string[];
    }[] = [];

    for (const entry of this.entries) {
      let score = 0;
      const matchedOn: string[] = [];

      // 匹配问题
      const questionWords = entry.question.toLowerCase();
      for (const word of queryWords) {
        if (questionWords.includes(word)) {
          score += 3;
          matchedOn.push('question');
        }
      }

      // 匹配标签
      for (const tag of entry.tags) {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 2;
          matchedOn.push('tag');
        }
      }

      // 匹配示例
      for (const example of entry.examples) {
        if (queryLower.includes(example.toLowerCase())) {
          score += 4;
          matchedOn.push('example');
        }
      }

      if (score > 0) {
        results.push({
          entry,
          score: score * entry.confidence,
          matchedOn: [...new Set(matchedOn)]
        });
      }
    }

    // 排序并返回topK
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * 按分类搜索
   */
  searchByCategory(category: string): KnowledgeEntry[] {
    return this.entries.filter(e => e.category === category);
  }

  /**
   * 添加知识条目
   */
  add(entry: Omit<KnowledgeEntry, 'id' | 'lastUpdated'>) {
    this.entries.push({
      ...entry,
      id: `faq_${Date.now()}`,
      lastUpdated: new Date().toISOString().slice(0, 10)
    });
  }
}

/**
 * 知识库增强的客服
 */
class KnowledgeBaseCustomerService {
  private knowledgeBase: KnowledgeBase;
  private llm: OpenAI;

  constructor() {
    this.knowledgeBase = new KnowledgeBase();
    this.llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * 处理查询
   */
  async process(query: string): Promise<{
    response: string;
    source?: string;
    needsHuman: boolean;
  }> {
    // 1. 搜索知识库
    const results = this.knowledgeBase.search(query, 3);

    if (results.length > 0 && results[0].score >= 3) {
      // 找到匹配的知识
      const bestMatch = results[0];

      // 增强回答
      const enhancedResponse = await this.enhanceResponse(
        bestMatch.entry.answer,
        query
      );

      return {
        response: enhancedResponse,
        source: bestMatch.entry.question,
        needsHuman: false
      };
    }

    // 2. 使用LLM生成回答
    return this.generateWithLLM(query, results.map(r => r.entry));
  }

  /**
   * 增强知识库回答
   */
  private async enhanceResponse(baseAnswer: string, query: string): Promise<string> {
    const prompt = `基于以下知识库答案，用友好方式回答用户问题。

知识库答案：
${baseAnswer}

用户问题：${query}

请用自然的对话方式重述答案，不要直接说"根据知识库"。`;

    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });

    return response.choices[0].message.content!;
  }

  /**
   * 使用LLM生成回答
   */
  private async generateWithLLM(
    query: string,
    contextEntries: KnowledgeEntry[]
  ): Promise<{ response: string; needsHuman: boolean }> {
    let context = '';

    if (contextEntries.length > 0) {
      context = '\n\n相关知识库条目：\n' +
        contextEntries.map(e => `- ${e.question}: ${e.answer}`).join('\n');
    }

    const prompt = `你是客服助手。用户问题：${query}${context}

如果知识库有相关信息请基于知识库回答。
如果无法回答，礼貌地说需要转人工。`;

    const response = await this.llm.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300
    });

    const answer = response.choices[0].message.content!;

    // 检查是否需要转人工
    const needsHuman = answer.includes('无法') ||
      answer.includes('不清楚') ||
      answer.includes('转人工');

    return { response: answer, needsHuman };
  }
}

// ==================== 使用示例 ====================

async function kbDemo() {
  const service = new KnowledgeBaseCustomerService();

  console.log('=== 知识库客服演示 ===\n');

  const queries = [
    '密码忘了怎么办',
    '我的订单还没到',
    '退款要等多久',
    '你们公司在哪里'
  ];

  for (const query of queries) {
    console.log('─'.repeat(40));
    console.log(`用户: ${query}`);

    const result = await service.process(query);

    console.log(`客服: ${result.response}`);
    if (result.source) {
      console.log(`[参考: ${result.source}]`);
    }
    console.log(`转人工: ${result.needsHuman}`);
  }
}

// kbDemo();
```

### 10.3 人工接管

人工接管机制确保复杂问题得到妥善处理：

```typescript
/**
 * 人工接管系统
 * 处理AI无法解决的复杂问题
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== 工单类型 ====================

type TicketStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Ticket {
  id: string;
  sessionId: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

interface TicketMessage {
  id: string;
  sender: 'customer' | 'agent';
  senderId: string;
  content: string;
  timestamp: number;
}

interface Agent {
  id: string;
  name: string;
  skills: string[];
  status: 'online' | 'busy' | 'offline';
  currentTickets: number;
}

// ==================== 工单系统 ====================

class TicketSystem {
  private tickets: Map<string, Ticket>;
  private agents: Map<string, Agent>;
  private openai: OpenAI;

  constructor() {
    this.tickets = new Map();
    this.agents = new Map();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    this.initializeAgents();
  }

  /**
   * 初始化客服
   */
  private initializeAgents() {
    const defaultAgents: Agent[] = [
      { id: 'agent1', name: '张三', skills: ['订单', '物流'], status: 'online', currentTickets: 0 },
      { id: 'agent2', name: '李四', skills: ['退款', '投诉'], status: 'online', currentTickets: 0 },
      { id: 'agent3', name: '王五', skills: ['技术', '账户'], status: 'busy', currentTickets: 2 }
    ];

    defaultAgents.forEach(a => this.agents.set(a.id, a));
  }

  /**
   * 创建工单
   */
  async createTicket(
    sessionId: string,
    userId: string,
    subject: string,
    description: string,
    category: string
  ): Promise<Ticket> {
    // 使用AI判断优先级
    const priority = await this.assessPriority(category, description);

    // 分配客服
    const agent = this.assignAgent(category);

    const ticket: Ticket = {
      id: `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      sessionId,
      userId,
      subject,
      description,
      category,
      priority,
      status: agent ? 'assigned' : 'pending',
      assignedTo: agent?.id,
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'customer',
          senderId: userId,
          content: description,
          timestamp: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tickets.set(ticket.id, ticket);

    if (agent) {
      agent.currentTickets++;
      this.agents.set(agent.id, agent);
    }

    return ticket;
  }

  /**
   * 评估优先级
   */
  private async assessPriority(category: string, description: string): Promise<TicketPriority> {
    const prompt = `根据以下信息判断工单优先级（low/medium/high/urgent）。

类别：${category}
描述：${description}

判断规则：
- urgent: 涉及资金安全、账户被盗、重大投诉
- high: 退款、取消、长时间未解决的物流问题
- medium: 一般咨询、常规问题
- low: 简单问题、建议

只输出一个词：`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0
    });

    const priority = response.choices[0].message.content!.trim().toLowerCase();

    return ['low', 'medium', 'high', 'urgent'].includes(priority)
      ? priority as TicketPriority
      : 'medium';
  }

  /**
   * 分配客服
   */
  private assignAgent(category: string): Agent | undefined {
    // 找在线且有相关技能的客服
    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'online' && a.currentTickets < 5)
      .filter(a => a.skills.some(s => category.includes(s) || s.includes(category)));

    if (availableAgents.length === 0) {
      // 找任何在线客服
      return Array.from(this.agents.values())
        .filter(a => a.status === 'online' && a.currentTickets < 5)[0];
    }

    // 按当前工单数排序，选择最闲的
    availableAgents.sort((a, b) => a.currentTickets - b.currentTickets);
    return availableAgents[0];
  }

  /**
   * 添加工单消息
   */
  addMessage(
    ticketId: string,
    sender: 'customer' | 'agent',
    senderId: string,
    content: string
  ): TicketMessage | undefined {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const message: TicketMessage = {
      id: `msg_${Date.now()}`,
      sender,
      senderId,
      content,
      timestamp: Date.now()
    };

    ticket.messages.push(message);
    ticket.updatedAt = Date.now();

    if (sender === 'agent') {
      ticket.status = 'in_progress';
    }

    return message;
  }

  /**
   * 解决工单
   */
  resolveTicket(ticketId: string, resolution: string): boolean {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.status = 'resolved';
    ticket.resolvedAt = Date.now();
    ticket.updatedAt = Date.now();

    // 释放客服
    if (ticket.assignedTo) {
      const agent = this.agents.get(ticket.assignedTo);
      if (agent) {
        agent.currentTickets = Math.max(0, agent.currentTickets - 1);
        this.agents.set(agent.id, agent);
      }
    }

    return true;
  }

  /**
   * 获取工单
   */
  getTicket(ticketId: string): Ticket | undefined {
    return this.tickets.get(ticketId);
  }

  /**
   * 获取用户的工单
   */
  getUserTickets(userId: string): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// ==================== 人工接管控制器 ====================

class HumanHandoffController {
  private ticketSystem: TicketSystem;
  private pendingHandoffs: Map<string, {
    sessionId: string;
    reason: string;
    context: any;
    queuedAt: number;
  }>;

  constructor() {
    this.ticketSystem = new TicketSystem();
    this.pendingHandoffs = new Map();
  }

  /**
   * 请求人工接管
   */
  async requestHandoff(
    sessionId: string,
    userId: string,
    reason: string,
    context: any
  ): Promise<{
    ticketId: string;
    estimatedWait?: number;
    position?: number;
  }> {
    // 创建工单
    const ticket = await this.ticketSystem.createTicket(
      sessionId,
      userId,
      `人工请求：${reason}`,
      JSON.stringify(context, null, 2),
      '人工接管'
    );

    // 记录待处理
    this.pendingHandoffs.set(sessionId, {
      sessionId,
      reason,
      context,
      queuedAt: Date.now()
    });

    // 估算等待时间
    const position = this.calculateQueuePosition();
    const estimatedWait = position ? position * 5 : undefined;  // 假设每5分钟处理一个

    return {
      ticketId: ticket.id,
      estimatedWait,
      position: position || undefined
    };
  }

  /**
   * 计算队列位置
   */
  private calculateQueuePosition(): number {
    return this.pendingHandoffs.size;
  }

  /**
   * 获取会话的工单
   */
  getSessionTicket(sessionId: string): Ticket | undefined {
    const pending = this.pendingHandoffs.get(sessionId);
    if (!pending) return undefined;

    return this.ticketSystem.getUserTickets(pending.context.userId)
      .find(t => t.sessionId === sessionId);
  }

  /**
   * 转回AI
   */
  returnToAI(sessionId: string): {
    success: boolean;
    summary: string;
  } {
    const pending = this.pendingHandoffs.get(sessionId);
    if (!pending) {
      return { success: false, summary: '会话不在人工接管中' };
    }

    // 生成会话摘要
    const summary = this.generateSummary(pending.context);

    // 删除待处理记录
    this.pendingHandoffs.delete(sessionId);

    return {
      success: true,
      summary
    };
  }

  /**
   * 生成会话摘要
   */
  private generateSummary(context: any): string {
    // 简化的摘要生成
    return `会话摘要：
- 用户问题：${context.lastMessage || '未知'}
- 已提供信息：${JSON.stringify(context.collectedSlots || {})}
- 处理阶段：${context.stage || '未知'}`;
  }
}

// ==================== 使用示例 ====================

async function handoffDemo() {
  const controller = new HumanHandoffController();

  console.log('=== 人工接管演示 ===\n');

  // 请求人工接管
  const handoff = await controller.requestHandoff(
    'session123',
    'user456',
    'AI无法解决的问题',
    {
      userId: 'user456',
      lastMessage: '我的订单丢失了，金额被扣但没有订单',
      collectedSlots: { orderId: null },
      stage: 'order_inquiry'
    }
  );

  console.log('人工接管请求已创建:');
  console.log(`- 工单号: ${handoff.ticketId}`);
  console.log(`- 队列位置: ${handoff.position || '无'}`);
  console.log(`- 预计等待: ${handoff.estimatedWait ? handoff.estimatedWait + '分钟' : '立即'}`);

  // 获取工单详情
  const ticket = controller.getSessionTicket('session123');
  if (ticket) {
    console.log(`\n工单详情:`);
    console.log(`- 状态: ${ticket.status}`);
    console.log(`- 分配给: ${ticket.assignedTo || '待分配'}`);
    console.log(`- 优先级: ${ticket.priority}`);
  }

  // 返回AI
  const result = controller.returnToAI('session123');
  console.log(`\n返回AI: ${result.success}`);
  console.log(`摘要: ${result.summary}`);
}

// handoffDemo();
```

### 10.4 我的思考：AI改变服务行业

AI客服正在深刻改变客户服务行业，但这种改变是渐进式的，而非革命性的。

**AI客服的优势**：

1. **7x24小时可用**
   - 人工客服有工作时长限制，AI可以全天候服务
   - 响应速度快，减少用户等待时间
   - 可以同时处理多个会话

2. **成本效益**
   - 标准化问题由AI处理，大幅降低人力成本
   - 人工客服专注于复杂问题，提升效率
   - 规模效应明显，增加用户不增加太多成本

3. **一致性**
   - 每次回答都保持一致的质量
   - 不会出现疲劳导致的错误
   - 品牌调性统一

**AI客服的局限性**：

```typescript
// AI客服难以处理的场景
const difficultScenarios = [
  {
    scenario: '情绪激动的用户',
    challenge: 'AI无法真正理解情绪，可能加剧冲突',
    solution: '设置情绪检测，及时转人工'
  },
  {
    scenario: '复杂投诉',
    challenge: '涉及多部门协调，需要同理心',
    solution: '人工接管+工单系统协同'
  },
  {
    scenario: '新型问题',
    challenge: '知识库无法覆盖，AI可能胡说八道',
    solution: '置信度阈值控制，模糊问题转人工'
  },
  {
    scenario: '敏感事务',
    challenge: '退款、账户问题涉及资金安全',
    solution: '高风险操作需人工确认'
  }
];

console.log('AI客服局限性分析:', difficultScenarios);
```

**最佳实践：人机协作**：

```
┌─────────────────────────────────────────────────────┐
│                    用户请求                          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  AI客服处理                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ 1. 意图识别                                  │   │
│  │ 2. 槽位填充                                  │   │
│  │ 3. 知识库检索                                │   │
│  │ 4. 简单问题直接回答                          │   │
│  └─────────────────────────────────────────────┘   │
                      │                             │
            ┌─────────┴─────────┐                   │
            │                   │                    │
      简单问题              复杂问题                 │
            │                   │                    │
            ▼                   ▼                   │
┌─────────────────┐   ┌─────────────────────────────┐ │
│   直接回答      │   │    人工接管                  │ │
│   关闭会话      │   │  ┌───────────────────────┐  │ │
│                │   │  │ 创建工单               │  │ │
│                │   │  │ 分配客服               │  │ │
│                │   │  │ 处理中...              │  │ │
│                │   │  │ 解决后生成摘要         │  │ │
│                │   │  └───────────────────────┘  │ │
│                │   │           │                  │ │
│                │   │           ▼                  │ │
│                │   │    返回AI（带上下文）         │ │
└─────────────────┘   └─────────────────────────────┘ │
```

**未来趋势**：

1. **情感智能**：AI将更好地识别和回应用户情绪
2. **主动服务**：基于用户行为预测需求，主动提供服务
3. **全渠道统一**：电话、聊天、邮件、社交媒体统一管理
4. **实时培训**：从每次人工交互中学习，不断优化AI

**对从业者的建议**：

对于客服从业者：
- 培养AI无法替代的软技能：同理心、创造力、复杂问题解决
- 学会与AI协作，提升整体服务效率
- 转型为知识库管理员或AI训练师

对于企业：
- 不要期待AI解决所有问题，合理分配人机职责
- 投资于AI和人工的协同工作流程
- 持续优化知识库，提升AI能力边界

---

## 总结

本文档系统讲解了AI大模型应用开发的完整知识体系，涵盖：

1. **AI大模型概述**：理解了GPT、BERT、Claude等主流模型的架构差异和能力边界
2. **LLM API调用**：掌握了OpenAI、Claude、百度、阿里等平台API的使用方法
3. **Prompt工程**：学会了角色设定、Few-shot、链式思考等核心技术
4. **RAG检索增强**：理解了向量数据库、Embedding和相似度检索的原理
5. **Agent开发**：掌握了Tool Use、ReAct、规划执行等Agent开发模式
6. **对话系统**：学会了会话管理、上下文记忆、多轮对话的实现
7. **代码生成**：能够构建代码补全、审查、解释的AI工具
8. **AI应用架构**：理解了LangChain、LlamaIndex等框架的使用
9. **安全与合规**：掌握了内容审核、数据隐私、成本控制的方法
10. **案例：智能客服**：完整实现了一个生产级的智能客服系统

AI应用开发是一个快速发展的领域，建议开发者：
- 持续关注技术更新，保持学习
- 多实践，在项目中积累经验
- 重视安全与伦理，做负责任的AI开发

---

**附录：推荐学习资源**

| 资源类型 | 推荐内容 |
|----------|----------|
| 官方文档 | OpenAI API Docs, Anthropic Docs, LangChain Docs |
| 书籍 | 《Building LLM Applications》《LangChain in Action》 |
| 社区 | GitHub, Hugging Face, Reddit r/MachineLearning |
| 课程 | Coursera AI courses, Fast.ai |

---

*文档版本：1.0.0*
*最后更新：2024年*
