# 第3卷-工程实战

## 第4章 AI与大模型实战

### 4.1 机器学习基础

#### 4.1.1 机器学习概述

机器学习（Machine Learning）是人工智能的一个分支，通过算法让计算机从数据中学习并改进。

#### 4.1.2 前端中的机器学习应用

```javascript
// 简单的线性回归示例
class LinearRegression {
  constructor() {
    this.weights = 0;
    this.bias = 0;
    this.learningRate = 0.01;
  }

  train(X, y, epochs = 1000) {
    const n = X.length;

    for (let i = 0; i < epochs; i++) {
      let sumW = 0;
      let sumB = 0;

      for (let j = 0; j < n; j++) {
        const prediction = this.weights * X[j] + this.bias;
        const error = prediction - y[j];
        sumW += error * X[j];
        sumB += error;
      }

      this.weights -= (this.learningRate / n) * sumW;
      this.bias -= (this.learningRate / n) * sumB;
    }
  }

  predict(x) {
    return this.weights * x + this.bias;
  }
}
```

---

### 4.2 深度学习入门

#### 4.2.1 神经网络基础

```javascript
// 简单的神经网络实现
class NeuralNetwork {
  constructor(layers) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];

    // 初始化权重
    for (let i = 0; i < layers.length - 1; i++) {
      const weightMatrix = [];
      for (let j = 0; j < layers[i]; j++) {
        weightMatrix.push(
          Array(layers[i + 1]).fill(0).map(() => Math.random() - 0.5)
        );
      }
      this.weights.push(weightMatrix);
      this.biases.push(Array(layers[i + 1]).fill(0));
    }
  }

  forward(input) {
    let current = input;

    for (let i = 0; i < this.weights.length; i++) {
      current = this.multiply(current, this.weights[i]);
      current = current.map((val, j) => val + this.biases[i][j]);
      current = current.map(val => this.relu(val));
    }

    return current;
  }

  multiply(vector, matrix) {
    return matrix[0].map((_, colIndex) =>
      vector.reduce((sum, val, rowIndex) =>
        sum + val * matrix[rowIndex][colIndex], 0
      )
    );
  }

  relu(x) {
    return Math.max(0, x);
  }
}
```

---

### 4.3 大语言模型

#### 4.3.1 LLM 概述

大语言模型（Large Language Model）是一种基于深度学习的自然语言处理模型。

#### 4.3.2 前端集成 LLM

```javascript
// 使用 OpenAI API
class LLMService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async generate(prompt, options = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      })
    });

    return response.json();
  }
}
```

---

### 4.4 AI集成方案

#### 4.4.1 前端 AI 架构

```javascript
// AI 服务架构
const AIServiceArchitecture = {
  // 本地模型
  local: {
        tensorflow: '浏览器端 TF.js 模型',
        onnx: 'ONNX Runtime Web'
  },

  // 云端 API
  cloud: {
    openai: 'GPT 系列模型',
    anthropic: 'Claude 系列模型',
    google: 'PaLM/Bard'
  },

  // 混合方案
  hybrid: {
    lightTask: '本地处理',
    heavyTask: '云端处理'
  }
};
```

#### 4.4.2 模型加载

```javascript
// TensorFlow.js 模型加载
async function loadModel() {
  // 加载预训练模型
  const model = await tf.loadLayersModel('/models/classification/model.json');

  return {
    model,

    // 预测
    predict: async (input) => {
      const tensor = tf.tensor2d(input, [1, input.length]);
      const prediction = model.predict(tensor);
      return prediction.dataSync();
    },

    // 释放内存
    dispose: () => {
      model.dispose();
    }
  };
}
```

---

### 4.5 Prompt工程

#### 4.5.1 Prompt 设计原则

```javascript
// Prompt 模板
const promptTemplates = {
  codeReview: `
请审查以下代码并提供改进建议：

代码：
\`\`\`
{code}
\`\`\`

请从以下方面进行审查：
1. 代码质量
2. 性能优化
3. 安全性
4. 可维护性
`,

  generateTest: `
为以下函数生成单元测试：

function {functionName}({params}) {
  {implementation}
}

请使用 Jest 框架生成测试用例。
`,

  explainError: `
解释以下错误并提供解决方案：

错误信息：{errorMessage}
相关代码：
\`\`\`
{code}
\`\`\`
`
};

function generatePrompt(template, variables) {
  let prompt = template;
  Object.keys(variables).forEach(key => {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  });
  return prompt;
}
```

#### 4.5.2 few-shot 学习

```javascript
// Few-shot 示例
const fewShotPrompt = `
请判断以下文本的情感是正面、负面还是中性。

示例：
"这个产品太棒了，我强烈推荐！" -> 正面
"体验很差，非常失望" -> 负面

请判断：
"{text}" ->
`;

async function classifySentiment(text, llm) {
  const prompt = generatePrompt(fewShotPrompt, { text });
  const result = await llm.generate(prompt);
  return result.choices[0].message.content;
}
```

---

### 4.6 代码生成

#### 4.6.1 自动代码生成

```javascript
// 代码生成服务
class CodeGenerator {
  constructor(llm) {
    this.llm = llm;
  }

  // 生成组件
  async generateComponent(description) {
    const prompt = `
生成一个 React 函数组件，满足以下需求：
${description}

请包含：
1. Props 类型定义
2. 组件实现
3. 样式（使用 CSS Modules）
`;

    const result = await this.llm.generate(prompt);
    return result.choices[0].message.content;
  }

  // 生成 Hook
  async generateHook(name, logic) {
    const prompt = `
生成一个名为 ${name} 的 React Hook，实现以下功能：
${logic}
`;

    const result = await this.llm.generate(prompt);
    return result.choices[0].message.content;
  }

  // 生成工具函数
  async generateUtility(type, description) {
    const prompt = `
生成一个 ${type} 工具函数：
${description}

请包含 JSDoc 注释和类型定义。
`;

    const result = await this.llm.generate(prompt);
    return result.choices[0].message.content;
  }
}
```

#### 4.6.2 代码补全

```javascript
// 代码补全功能
class CodeCompletion {
  constructor(llm) {
    this.llm = llm;
    this.debounceTimer = null;
  }

  // 获取补全建议
  async getCompletion(context) {
    const prompt = `
根据以下代码上下文，预测可能的代码补全：

\`\`\`
${context}
\`\`\`

请提供最可能的补全代码（不超过 3 行）。
`;

    const result = await this.llm.generate(prompt, {
      temperature: 0.3,
      max_tokens: 100
    });

    return result.choices[0].message.content;
  }

  // 监听编辑器输入
  onEditorChange(editor) {
    editor.onDidChangeContent(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        const context = this.getContext(editor);
        const completion = await this.getCompletion(context);
        this.showCompletion(editor, completion);
      }, 300);
    });
  }
}
```

---

### 4.7 智能助手

#### 4.7.1 AI 编程助手

```javascript
// AI 编程助手
class AIAssistant {
  constructor(llm) {
    this.llm = llm;
    this.conversationHistory = [];
  }

  // 提问
  async ask(question, context = {}) {
    const prompt = this.buildPrompt(question, context);
    const result = await this.llm.generate(prompt);

    const answer = result.choices[0].message.content;
    this.conversationHistory.push({ question, answer });

    return answer;
  }

  // 解释代码
  async explainCode(code) {
    const prompt = `
请详细解释以下代码的功能和工作原理：

\`\`\`
${code}
\`\`\`

请包含：
1. 代码功能概述
2. 关键逻辑解释
3. 可能的改进建议
`;

    return this.llm.generate(prompt);
  }

  // 重构建议
  async refactor(code, goal) {
    const prompt = `
请重构以下代码，实现目标：${goal}

原代码：
\`\`\`
${code}
\`\`\`

请提供重构后的代码和解释。
`;

    return this.llm.generate(prompt);
  }

  buildPrompt(question, context) {
    let prompt = question;

    if (context.code) {
      prompt += `\n\n相关代码：\n\`\`\`\n${context.code}\n\`\`\``;
    }

    if (context.error) {
      prompt += `\n\n错误信息：${context.error}`;
    }

    if (context.language) {
      prompt += `\n\n编程语言：${context.language}`;
    }

    return prompt;
  }
}
```

#### 4.7.2 自然语言编程

```javascript
// 自然语言转代码
class NaturalLanguageProgrammer {
  constructor(llm) {
    this.llm = llm;
  }

  // 将自然语言转换为代码
  async toCode(intent, targetLanguage = 'javascript') {
    const prompt = `
将以下自然语言描述转换为 ${targetLanguage} 代码：

"${intent}"

请只输出代码，不要包含解释。
`;

    const result = await this.llm.generate(prompt);
    return result.choices[0].message.content;
  }

  // 代码转换为自然语言
  async toNaturalLanguage(code) {
    const prompt = `
用自然语言描述以下代码的功能：

\`\`\`
${code}
\`\`\`
`;

    const result = await this.llm.generate(prompt);
    return result.choices[0].message.content;
  }
}
```

---

*本章节完*
