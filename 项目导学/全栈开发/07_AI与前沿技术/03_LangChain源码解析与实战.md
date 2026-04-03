# LangChain源码解析与实战完全指南

## 一、LangChain核心架构：AI应用的"操作系统"

### 1.1 什么是LangChain？

想象一下，你要开发一个复杂的AI应用，比如：

> "分析今天的新闻，给出投资建议，并发邮件给客户"

这个任务涉及：
1. **新闻获取**（工具调用）
2. **内容分析**（LLM推理）
3. **投资建议生成**（LLM推理）
4. **发送邮件**（工具调用）

如果每个步骤都手写，代码会非常复杂。

**LangChain**就是帮助我们**链式组装**这些组件的框架：
- 把大模型（LLM）当作"大脑"
- 把各种工具（搜索、API、数据库）当作"手脚"
- 把记忆（Memory）当作"上下文"
- 把链（Chain）当作"工作流"

这样，我们只需要关注**如何组装**，而不是每个步骤的细节。

### 1.2 LangChain的核心模块

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LangChain整体架构                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      LangChain应用层                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   Agents    │  │   Chains    │  │  Callbacks  │            │  │
│  │  │  (智能体)    │  │   (链)      │  │  (回调)      │            │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       LangChain核心层                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   Models    │  │   Prompts   │  │   Memory   │            │  │
│  │  │  (模型)     │  │  (提示词)   │  │  (记忆)    │            │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   Tools    │  │   Indexes   │  │   Loaders   │            │  │
│  │  │  (工具)    │  │  (索引)     │  │  (加载器)   │            │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     LangChain集成层                            │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │ OpenAI │ │Anthropic│ │Azure  │ │Hugging │ │Vector  │       │  │
│  │  │       │ │       │ │       │ │Face    │ │Stores  │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 核心概念详解

| 概念 | 说明 | 类比 |
|------|------|------|
| **Model** | 大语言模型 | 大脑 |
| **Prompt** | 提示词模板 | 说话方式 |
| **Chain** | 链，多个组件串联执行 | 工作流程 |
| **Agent** | 智能体，能自主决策使用什么工具 | 能干的助手 |
| **Tool** | 工具，搜索、计算等外部能力 | 手和脚 |
| **Memory** | 记忆，存储对话历史等 | 笔记 |
| **Index** | 索引，文档结构化 | 图书馆目录 |

---

## 二、Model层：LangChain支持的模型

### 2.1 LLM调用接口统一抽象

LangChain定义了统一的LLM接口，不同模型可以无缝切换。

```python
# Python示例：LangChain的LLM接口
from langchain.llms.base import LLM
from typing import Optional, List, Mapping, Any

class MyCustomLLM(LLM):
    """
    自定义LLM：演示LangChain的LLM抽象

    实际应用中，你可以继承LLM类来实现自己的模型封装
    """

    # 模型参数
    model_name: str = "my-model"
    temperature: float = 0.7
    max_tokens: int = 1000

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        **kwargs
    ) -> str:
        """
        核心方法：执行LLM调用

        参数:
            prompt: 输入提示词
            stop: 停止词列表

        返回:
            模型生成的文本
        """
        # 这里是你的实际模型调用逻辑
        # 例如调用OpenAI、HuggingFace等
        response = self._invoke_model(prompt)
        return response

    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """
        返回标识参数，用于追踪和调试
        """
        return {
            "model_name": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

    def _invoke_model(self, prompt: str) -> str:
        """实际的模型调用"""
        # 模拟返回
        return f"模型对'{prompt[:20]}...'的回复"
```

### 2.2 OpenAI模型集成

```python
# Python示例：使用LangChain调用OpenAI
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# 初始化ChatGPT模型
llm = ChatOpenAI(
    model_name="gpt-4",           # 模型名称
    temperature=0.7,              # 温度参数
    max_tokens=1000,             # 最大token数
    openai_api_key="your-key",   # API密钥
    streaming=True               # 是否流式输出
)

# 简单调用
response = llm("给我讲一个关于程序员的笑话")
print(response)

# 带历史的对话
messages = [
    SystemMessage(content="你是一个有帮助的AI助手"),
    HumanMessage(content="什么是向量数据库？"),
    HumanMessage(content="它主要用于什么场景？")
]

# Chat模型使用消息列表
chat_response = llm(messages)
print(chat_response.content)
```

### 2.3 阿里通义千问集成

```python
# Python示例：使用LangChain调用通义千问
from langchain_community.llms import Tongyi

# 初始化通义千问
llm = Tongyi(
    model_name="qwen-turbo",     # 模型名称
    temperature=0.7,
    api_key="your-api-key"       # 魔搭API密钥
)

# 调用
response = llm("用Python写一个快速排序算法")
print(response)
```

---

## 三、Prompt模板：AI的"说话方式"

### 3.1 PromptTemplate基础

```python
# Python示例：LangChain的Prompt模板
from langchain.prompts import PromptTemplate

# 定义一个模板
template = """
你是一个{role}，专门负责{task}。

背景信息：
{context}

请回答用户的问题：
{question}

要求：
- 回答要{requirement}
- 格式要{format}
"""

# 创建模板实例
prompt = PromptTemplate(
    template=template,
    input_variables=["role", "task", "context", "question", "requirement", "format"]
)

# 渲染模板
rendered = prompt.format(
    role="技术文档助手",
    task="解释技术概念",
    context="用户正在学习人工智能",
    question="什么是机器学习？",
    requirement="通俗易懂，适合初学者",
    format="先定义，再举例，最后总结"
)

print(rendered)
```

### 3.2 ChatPromptTemplate：对话模板

```python
# Python示例：对话格式的Prompt模板
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# 定义系统消息模板
system_template = """
你是一个专业的{subject}，请回答用户的问题。
"""
system_prompt = SystemMessagePromptTemplate.from_template(system_template)

# 定义用户消息模板
human_template = "{question}"
human_prompt = HumanMessagePromptTemplate.from_template(human_template)

# 组合成对话模板
chat_prompt = ChatPromptTemplate.from_messages([system_prompt, human_prompt])

# 渲染
messages = chat_prompt.format_prompt(
    subject="编程导师",
    question="如何学习Python？"
).to_messages()

# messages是一个消息列表
for msg in messages:
    print(f"[{msg.type}]: {msg.content}")
```

### 3.3 FewShotPromptTemplate：带示例的模板

```python
# Python示例：带示例的Prompt模板
from langchain.prompts import FewShotPromptTemplate, PromptTemplate

# 定义示例
examples = [
    {
        "input": "今天天气真好",
        "output": "积极"
    },
    {
        "input": "这个产品太让人失望了",
        "output": "消极"
    },
    {
        "input": "明天有会议要参加",
        "output": "中性"
    }
]

# 示例模板
example_prompt = PromptTemplate(
    template="输入：{input}\n输出：{output}",
    input_variables=["input", "output"]
)

# FewShot模板
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="请判断以下句子的情感：",
    suffix="输入：{input}\n输出：",
    input_variables=["input"],
    example_separator="\n\n"
)

# 渲染
rendered = few_shot_prompt.format(input="这部电影太精彩了！")
print(rendered)
```

输出：
```
请判断以下句子的情感：

输入：今天天气真好
输出：积极

输入：这个产品太让人失望了
输出：消极

输入：明天有会议要参加
输出：中性

输入：这部电影太精彩了！
输出：
```

---

## 四、Chain：组件的串联艺术

### 4.1 LLMChain：最基础的链

```python
# Python示例：LLMChain基础用法
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# 1. 定义模型
llm = ChatOpenAI(model_name="gpt-4", temperature=0.7)

# 2. 定义Prompt
prompt = PromptTemplate(
    template="""
你是一个代码审查专家。

请审查以下Python代码，重点关注：
1. 潜在的bug
2. 性能问题
3. 安全漏洞

代码：
```{language}
{code}
```

审查报告：
""",
    input_variables=["language", "code"]
)

# 3. 创建LLMChain
chain = LLMChain(llm=llm, prompt=prompt)

# 4. 执行链
result = chain.run({
    "language": "python",
    "code": """
def get_user_email(user_id, conn):
    cursor = conn.cursor()
    query = "SELECT email FROM users WHERE id = " + user_id
    cursor.execute(query)
    return cursor.fetchone()
"""
})

print(result)
```

### 4.2 SequentialChain：顺序执行

```python
# Python示例：顺序执行的Chain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain

llm = ChatOpenAI(model_name="gpt-4", temperature=0.3)

# Chain 1: 提取关键词
extract_prompt = PromptTemplate(
    template="从以下文本中提取5个关键词：\n{text}\n\n关键词：",
    input_variables=["text"]
)
extract_chain = LLMChain(llm=llm, prompt=extract_prompt, output_key="keywords")

# Chain 2: 基于关键词生成摘要
summarize_prompt = PromptTemplate(
    template="""
基于以下关键词，写一段50字的摘要：
关键词：{keywords}
原文：{text}

摘要：
""",
    input_variables=["keywords", "text"]
)
summarize_chain = LLMChain(llm=llm, prompt=summarize_prompt, output_key="summary")

# Chain 3: 生成标签
tag_prompt = PromptTemplate(
    template="""
根据以下内容，生成3个标签（用逗号分隔）：
{summary}

标签：
""",
    input_variables=["summary"]
)
tag_chain = LLMChain(llm=llm, prompt=tag_prompt, output_key="tags")

# 组合成顺序链
overall_chain = SequentialChain(
    chains=[extract_chain, summarize_chain, tag_chain],
    input_variables=["text"],           # 整体输入
    output_variables=["keywords", "summary", "tags"],  # 整体输出
    verbose=True                         # 打印执行过程
)

# 执行
text = """
人工智能技术正在深刻改变各行各业。从医疗诊断到金融风控，
从智能客服到自动驾驶，AI的应用无处不在。特别是大语言模型的出现，
让人机交互变得更加自然和智能。
"""

result = overall_chain(text)

print("关键词:", result["keywords"])
print("摘要:", result["summary"])
print("标签:", result["tags"])
```

### 4.3 RouterChain：智能路由

```python
# Python示例：RouterChain - 根据输入决定使用哪个处理流程
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

llm = ChatOpenAI(model_name="gpt-4", temperature=0.5)

# 定义不同场景的处理模板
templates = {
    "技术问题": """
当前对话是在讨论技术问题。
技术问题需要准确、详细地回答，必要时给出代码示例。

对话历史：
{history}

最新问题：{input}
技术回答：
""",
    "情感支持": """
当前对话是在寻求情感支持。
需要给予理解和安慰，用温暖的语气回应。

对话历史：
{history}

最新问题：{input}
温暖回应：
""",
    "创意写作": """
当前对话是在进行创意写作。
需要发挥想象力，创造性地回应。

对话历史：
{history}

最新问题：{input}
创意回应：
"""
}

# 路由选择Prompt
router_prompt = PromptTemplate(
    template="""
请判断以下问题属于哪个类别，只能选择一个：
- 技术问题
- 情感支持
- 创意写作

问题：{input}

类别：
""",
    input_variables=["input"]
)

def route_category(input_text: str) -> str:
    """根据输入判断类别"""
    from langchain.chains import LLMChain
    chain = LLMChain(llm=llm, prompt=router_prompt)
    result = chain.run(input_text)

    # 解析结果
    for category in templates.keys():
        if category in result:
            return category
    return "技术问题"  # 默认

# 根据路由选择对应的Chain
def process_with_router(input_text: str) -> str:
    """路由处理"""
    category = route_category(input_text)

    # 使用对应类别的模板
    template = templates[category]

    # 这里简化处理，实际应用中应该构建完整的Chain
    prompt = PromptTemplate(template=template, input_variables=["history", "input"])
    chain = LLMChain(llm=llm, prompt=prompt)

    # 模拟历史（实际应用中应该用Memory）
    history = ""

    return chain.run({"history": history, "input": input_text})

# 使用示例
questions = [
    "Python中如何实现单例模式？",      # 技术问题
    "我今天面试失败了，好难过",          # 情感支持
    "帮我写一首关于春天的诗"            # 创意写作
]

for q in questions:
    print(f"\n问题: {q}")
    print(f"处理: {process_with_router(q)[:100]}...")
```

---

## 五、Agent系统：AI的"自主行动"能力

### 5.1 Agent核心原理

**Agent（智能体）**是LangChain中最强大的功能之一。

Agent让AI能够：
1. 理解任务目标
2. 决定是否需要使用工具
3. 调用工具获取信息
4. 根据结果决定下一步

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent执行流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户输入 → "北京今天天气怎么样？"                                 │
│                      ↓                                          │
│  ┌─────────────────────────────────────┐                       │
│  │        LLM思考                        │                       │
│  │  "用户想知道北京天气，我需要调用       │                       │
│  │   天气查询工具来获取信息"              │                       │
│  └─────────────────────────────────────┘                       │
│                      ↓                                          │
│  Agent决定调用 Tool: get_weather(city="北京")                   │
│                      ↓                                          │
│  ┌─────────────────────────────────────┐                       │
│  │        Tool执行                       │                       │
│  │   返回：今天北京晴，25℃，空气良好     │                       │
│  └─────────────────────────────────────┘                       │
│                      ↓                                          │
│  ┌─────────────────────────────────────┐                       │
│  │        LLM整合                         │                       │
│  │  "根据天气信息，为用户组织回答"         │                       │
│  └─────────────────────────────────────┘                       │
│                      ↓                                          │
│  输出 → "今天北京天气晴朗，气温25℃，空气良好"                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 基础Agent实现

```python
# Python示例：LangChain Agent基础用法
from langchain.agents import initialize_agent, AgentType
from langchain.agents import Tool
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

# 1. 定义工具
def get_weather(city: str) -> str:
    """获取天气信息（模拟）"""
    weather_data = {
        "北京": "今天北京晴，气温25℃，空气良好",
        "上海": "今天上海多云，气温28℃，有轻微雾霾",
        "深圳": "今天深圳雷阵雨，气温30℃，请带伞",
        "杭州": "今天杭州阴，气温26℃，适合出行"
    }
    return weather_data.get(city, "抱歉，暂不支持查询该城市天气")

def calculate(expression: str) -> str:
    """计算器工具"""
    try:
        # 安全计算（实际应该用更安全的eval替代）
        result = eval(expression)
        return f"计算结果：{result}"
    except:
        return "计算表达式有误"

def search_news(keyword: str) -> str:
    """搜索新闻（模拟）"""
    news = {
        "AI": "OpenAI发布GPT-5，性能大幅提升",
        "Python": "Python 3.13发布，速度提升25%",
        "程序员": "调查显示程序员平均薪资上涨15%"
    }
    return news.get(keyword, "暂无相关新闻")

# 2. 创建Tool对象
tools = [
    Tool(
        name="天气查询",
        func=get_weather,
        description="当你想知道某个城市的天气时使用。输入：城市名"
    ),
    Tool(
        name="计算器",
        func=calculate,
        description="用于数学计算。输入：计算表达式，如 2+3*5"
    ),
    Tool(
        name="新闻搜索",
        func=search_news,
        description="搜索最新新闻。输入：关键词"
    )
]

# 3. 初始化模型
llm = ChatOpenAI(model_name="gpt-4", temperature=0)

# 4. 初始化Agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,  # 对话式React
    verbose=True,  # 打印思考过程
    memory=ConversationBufferMemory(memory_key="chat_history", return_messages=True)
)

# 5. 执行
print("=" * 60)
response = agent.run("北京今天天气怎么样？")
print(f"\n回答: {response}")

print("\n" + "=" * 60)
response = agent.run("Python最新动态是什么？")
print(f"\n回答: {response}")

print("\n" + "=" * 60)
response = agent.run("帮我计算一下 (100 + 200) * 3 等于多少？")
print(f"\n回答: {response}")
```

### 5.3 ReAct Agent：推理+行动

**ReAct**（Reasoning + Acting）是一种让Agent既能推理又能行动的框架。

```python
# Python示例：ReAct Agent
from langchain.agents import AgentType, initialize_agent, Tool
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# ReAct的核心思想：
# Thought - 思考应该做什么
# Action - 执行动作
# Observation - 观察结果
# ... 循环直到得到答案

# ReAct使用专门的Prompt模板，让模型学习这种思考模式
react_prompt = """
你是一个智能助手，采用以下步骤解决问题：

问题：{input}

你必须按照以下格式回答：

Thought: 你应该思考做什么
Action: 工具名称
Action Input: 工具输入
Observation: 工具返回结果
... (可以重复以上步骤多次)
Thought: 我现在知道最终答案了
Final Answer: 最终答案

请开始：
"""

# 工具定义
tools = [
    Tool(
        name="搜索",
        func=lambda x: "搜索结果：关于" + x + "的最新信息...",
        description="搜索互联网获取信息"
    ),
    Tool(
        name="计算器",
        func=lambda x: str(eval(x)) if x.replace('+','').replace('-','').replace('*','').replace('/','').replace('.','').isdigit() else "无效表达式",
        description="数学计算"
    ),
    Tool(
        name="翻译",
        func=lambda x: f"翻译结果：{x}",
        description="中英文翻译"
    )
]

llm = ChatOpenAI(model_name="gpt-4", temperature=0)

# 创建ReAct Agent
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,  # Zero-shot ReAct
    verbose=True,
    max_iterations=5,  # 最大迭代次数，防止无限循环
    early_stopping_method="generate"  # 提前停止
)

# 执行
result = agent.run("把'Hello World'翻译成中文，然后用它计算中英文字符个数")
print(f"\n最终结果: {result}")
```

### 5.4 自定义Agent实现

```python
# Python示例：自定义Agent类
from langchain.agents import Agent
from langchain.tools import Tool
from langchain.prompts import BasePromptTemplate
from pydantic import BaseModel
from typing import List, Tuple, Optional

class CustomAgentInput(BaseModel):
    """Agent输入模型"""
    input: str

class CustomAgent(Agent):
    """
    自定义Agent：演示Agent的工作原理

    实际应用中，可以继承Agent类来实现自己的逻辑
    """

    @property
    def observation_prefix(self) -> str:
        """观察结果前缀"""
        return "Observation: "

    @property
    def llm_prefix(self) -> str:
        """LLM思考前缀"""
        return "Thought: "

    @property
    def prompt(self) -> BasePromptTemplate:
        """Prompt模板"""
        from langchain.prompts import PromptTemplate
        return PromptTemplate(
            template="""
你是一个智能助手，可以调用各种工具来完成任务。

可用工具：
{tools}

工具描述：
{tool_descriptions}

请按以下格式思考和行动：

问题：{input}

Thought: 你应该思考做什么
Action: 工具名称
Action Input: 工具输入
Observation: 结果
... (重复直到完成)
Thought: 我现在知道答案了
Final Answer: 你的最终答案

请开始：
""",
            tools=self.tools,
            tool_descriptions="\n".join([f"- {t.name}: {t.description}" for t in self.tools]),
            input_variables=["input"]
        )

    def _next_action(self, model_output: str) -> List[Tuple[str, str]]:
        """
        从模型输出中解析下一步行动

        参数:
            model_output: 模型的原始输出

        返回:
            [(action_name, action_input), ...]的列表
        """
        # 简化解析：实际应用中需要更复杂的解析逻辑
        actions = []

        lines = model_output.split('\n')
        for line in lines:
            if line.startswith('Action:'):
                action = line.replace('Action:', '').strip()
            elif line.startswith('Action Input:'):
                action_input = line.replace('Action Input:', '').strip()
                actions.append((action, action_input))

        return actions

    def _return_stopped_response(
        self,
        early_stopping: bool,
        intermediate_steps: list
    ) -> str:
        """返回最终响应"""
        if early_stopping:
            return "Agent停止，因为达到最大迭代次数"

        return "Agent完成"

    def plan(
        self,
        intermediate_steps: List[Tuple[str, str]],
        **kwargs
    ) -> str:
        """
        核心方法：制定下一步计划
        """
        # 简化实现
        return "使用工具处理"

    async def aplan(
        self,
        intermediate_steps: List[Tuple[str, str]],
        **kwargs
    ) -> str:
        """异步版本的plan"""
        return self.plan(intermediate_steps, **kwargs)


# 使用自定义Agent
def run_custom_agent():
    """运行自定义Agent"""

    # 定义工具
    tools = [
        Tool(
            name="计算器",
            func=lambda x: str(sum(map(int, x.split('+')))),
            description="计算多个数字的和，格式：数字1+数字2+..."
        ),
        Tool(
            name="反转",
            func=lambda x: x[::-1],
            description="反转字符串"
        )
    ]

    # 创建Agent
    agent = CustomAgent(tools=tools)

    # 执行
    # 注意：这只是演示，实际使用应该用initialize_agent
    print("自定义Agent创建成功")
```

---

## 六、Memory管理：让AI"记住"一切

### 6.1 各种Memory类型

LangChain支持多种记忆类型，用于不同的场景。

```python
# Python示例：各种Memory类型
from langchain.memory import (
    ConversationBufferMemory,        # 缓冲区记忆
    ConversationTokenBufferMemory, # 基于Token的记忆
    ConversationSummaryMemory,       # 摘要记忆
    EntityMemory                     # 实体记忆
)
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model_name="gpt-4", temperature=0)

# 1. ConversationBufferMemory：最简单的记忆
# 将对话历史原封不动地存储
buffer_memory = ConversationBufferMemory(
    memory_key="chat_history",  # 在prompt中引用的键名
    return_messages=True        # 返回消息对象而不是字符串
)

# 添加对话
buffer_memory.save_context(
    {"input": "我叫张三"},
    {"output": "你好张三，很高兴认识你！"}
)
buffer_memory.save_context(
    {"input": "我是一名软件工程师"},
    {"output": "软件工程师很棒！你是做什么开发的？"}
)

# 加载历史
history = buffer_memory.load_memory_variables({})
print("BufferMemory历史:")
print(history["chat_history"])
```

```python
# 2. ConversationTokenBufferMemory：基于Token数量的记忆
# 当对话太长时，自动清除旧内容，保留最新的
token_memory = ConversationTokenBufferMemory(
    llm=llm,                      # 需要LLM来计算Token数
    max_token_limit=500,          # 超过500 token就清除旧的
    memory_key="chat_history",
    return_messages=True
)

# 填充大量对话直到超过token限制
# ... 添加很多对话 ...
# 会自动清理旧内容

print("TokenMemory已加载")
```

```python
# 3. ConversationSummaryMemory：摘要记忆
# 不是保存原始对话，而是不断生成摘要
summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="chat_history",
    return_messages=True
)

# 添加对话
summary_memory.save_context(
    {"input": "我们公司刚刚完成了A轮融资，获得了5000万美金"},
    {"output": "恭喜！这是一个重要的里程碑。你们打算怎么使用这笔资金？"}
)

summary_memory.save_context(
    {"input": "主要是用于扩大研发团队和市场推广"),
    {"output": "研发和市场都很重要，希望你们蒸蒸日上！"}
)

# 查看摘要
summary = summary_memory.load_memory_variables({})
print("\n对话摘要:")
print(summary["chat_history"])
```

```python
# 4. EntityMemory：实体记忆
# 专门记住实体（人名、公司名等）的信息
entity_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="entities",
    return_messages=True
)

# 添加包含实体的对话
entity_memory.save_context(
    {"input": "我的朋友小明在阿里巴巴工作"},
    {"output": "阿里巴巴是大公司，小明真不错"}
)

entity_memory.save_context(
    {"input": "他最近刚从P7晋升到P8"},
    {"output": "P8是很高级别了，恭喜小明！"}
)

# 提取实体信息
entities = entity_memory.load_memory_variables({})
print("\n实体信息:")
print(entities["entities"])
```

### 6.2 Memory在Chain中的应用

```python
# Python示例：在LLMChain中使用Memory
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

# 1. 使用预置的ConversationChain
llm = ChatOpenAI(model_name="gpt-4", temperature=0.5)

conversation = ConversationChain(
    llm=llm,
    memory=ConversationBufferMemory(),
    verbose=True  # 显示思考过程
)

# 对话
print(conversation.run("我叫张三，是一名AI工程师"))
print(conversation.run("我喜欢打篮球"))
print(conversation.run("你知道我叫什么名字吗？"))
```

### 6.3 自定义Memory

```python
# Python示例：自定义Memory类
from langchain.memory import Memory
from langchain.schema import HumanMessage, AIMessage
from typing import Dict, Any, List
import json

class CustomFileMemory(Memory):
    """
    自定义文件记忆：将对话存储到文件

    适用场景：
    - 需要持久化保存对话历史
    - 对话数据需要后续分析
    - 多轮会话之间保持上下文
    """

    def __init__(self, file_path: str = "conversation_history.json"):
        """
        初始化

        参数:
            file_path: 历史文件路径
        """
        super().__init__()
        self.file_path = file_path
        self.messages: List[Dict] = self._load_from_file()

    def _load_from_file(self) -> List[Dict]:
        """从文件加载历史"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def _save_to_file(self):
        """保存到文件"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.messages, f, ensure_ascii=False, indent=2)

    @property
    def memory_variables(self) -> List[str]:
        """定义在prompt中使用的变量"""
        return ["conversation_history"]

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        加载记忆变量

        返回一个字典，包含对话历史
        """
        formatted_history = "\n".join([
            f"{'用户' if m['type'] == 'human' else 'AI'}: {m['content']}"
            for m in self.messages
        ])

        return {"conversation_history": formatted_history}

    def save_context(
        self,
        inputs: Dict[str, Any],
        outputs: Dict[str, Any]
    ) -> None:
        """
        保存对话上下文

        参数:
            inputs: 输入（用户消息）
            outputs: 输出（AI回复）
        """
        # 提取消息内容
        human_msg = inputs.get("input", "")
        ai_msg = outputs.get("output", "")

        # 添加到历史
        self.messages.append({
            "type": "human",
            "content": human_msg
        })
        self.messages.append({
            "type": "ai",
            "content": ai_msg
        })

        # 保存到文件
        self._save_to_file()

    def clear(self) -> None:
        """清空记忆"""
        self.messages = []
        self._save_to_file()


# 使用自定义Memory
def demo_custom_memory():
    """演示自定义文件记忆"""

    memory = CustomFileMemory("my_conversation.json")

    # 创建带Memory的Chain
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model_name="gpt-4", temperature=0.5)

    prompt = PromptTemplate(
        template="""当前对话历史：
{conversation_history}

用户：{input}
AI：""",
        input_variables=["conversation_history", "input"]
    )

    chain = LLMChain(llm=llm, prompt=prompt, memory=memory)

    # 对话
    chain.run("我叫李四，在字节跳动工作")
    chain.run("我主要做推荐算法")
    chain.run("你知道我叫什么名字吗？")

    print("\n对话已保存到文件")
```

---

## 七、Tool使用：扩展AI的能力

### 7.1 内置Tools

LangChain提供了丰富的内置工具。

```python
# Python示例：使用LangChain内置工具
from langchain.agents import load_tools, initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from langchain.math_utils import llm_math

# 加载内置工具
# 这些工具可以直接使用
tools = load_tools(
    ["serpapi"],  # 搜索工具，需要SerpAPI密钥
    llm=llm       # 需要LLM的工具（如数学工具）会用到
)

# 常用内置工具包括：
# - serpapi: Google搜索
# - wolfram-alpha: Wolfram计算
# - google-search: Google搜索
# - ddg-search: DuckDuckGo搜索
# - calculator: 数学计算
# - python_repl: Python REPL执行
```

### 7.2 自定义Tools

```python
# Python示例：创建自定义Tool
from langchain.tools import Tool, BaseTool
from typing import Optional, Type
from pydantic import BaseModel, Field

# 方式1：使用Tool函数
def get_stock_price(symbol: str) -> str:
    """获取股票价格"""
    # 实际应用中应该调用真实API
    prices = {
        "AAPL": 175.50,
        "GOOGL": 140.25,
        "MSFT": 378.91,
        "TSLA": 242.84
    }

    if symbol.upper() in prices:
        return f"{symbol}当前价格：${prices[symbol.upper()]}"
    return f"未找到股票 {symbol} 的信息"

stock_tool = Tool(
    name="股票查询",
    func=get_stock_price,
    description="""
获取股票当前价格。
输入：股票代码（如 AAPL, GOOGL）
输出：股票当前价格
"""
)

# 方式2：使用BaseTool类（支持更复杂的功能）
class WeatherToolInput(BaseModel):
    """天气查询的输入模型"""
    city: str = Field(description="城市名称")
    date: Optional[str] = Field(default="今天", description="查询日期")

class WeatherTool(BaseTool):
    """
    天气查询工具：演示如何使用BaseTool创建复杂工具

    功能：
    1. 支持多城市查询
    2. 支持多日期查询
    3. 返回详细天气信息
    """
    name = "天气查询"
    description = "查询某个城市某一天的天气信息"
    args_schema: Type[BaseModel] = WeatherToolInput

    # 模拟天气数据
    weather_db = {
        "北京": {"今天": "晴 25℃", "明天": "多云 26℃", "后天": "阴 24℃"},
        "上海": {"今天": "雨 23℃", "明天": "晴 28℃", "后天": "多云 25℃"},
        "深圳": {"今天": "雷阵雨 30℃", "明天": "暴雨 28℃", "后天": "小雨 29℃"}
    }

    def _run(self, city: str, date: str = "今天") -> str:
        """执行查询"""
        city_weather = self.weather_db.get(city, {})
        weather = city_weather.get(date, "暂无数据")

        if weather == "暂无数据":
            return f"抱歉，暂未收录{city}的{date}天气信息"

        return f"{city}{date}天气：{weather}"

    async def _arun(self, city: str, date: str = "今天") -> str:
        """异步执行（可选）"""
        return self._run(city, date)


# 使用自定义工具
def demo_custom_tools():
    """演示自定义工具"""

    llm = ChatOpenAI(model_name="gpt-4", temperature=0)

    # 组合使用多个自定义工具
    tools = [
        stock_tool,
        WeatherTool()
    ]

    # 创建Agent
    from langchain.agents import initialize_agent

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )

    # 测试
    print("\n测试股票查询:")
    agent.run("苹果公司的股票现在多少钱？")

    print("\n测试天气查询:")
    agent.run("北京明天的天气怎么样？")

demo_custom_tools()
```

### 7.3 Tool的高级用法

```python
# Python示例：Tool的高级用法

# 1. 工具组（ToolKit）
from langchain.agents import Tool
from langchain.tools import WikipediaQueryRun
from langchain.utilities import WikipediaAPIWrapper

# Wikipedia工具
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

# 2. 动态工具选择
def create_dynamic_tools(context: str) -> list:
    """
    根据上下文动态创建工具

    参数:
        context: 场景上下文
    """
    base_tools = []

    if "金融" in context or "投资" in context:
        base_tools.append(stock_tool)
        # 添加更多金融相关工具...

    if "天气" in context or "旅行" in context:
        base_tools.append(WeatherTool())

    return base_tools

# 3. 工具的错误处理
from langchain.tools import Tool
from functools import wraps

def with_error_handling(func):
    """工具错误处理装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return f"工具执行出错：{str(e)}。请检查输入参数。"
    return wrapper

# 使用错误处理的工具
safe_stock_tool = Tool(
    name="股票查询",
    func=with_error_handling(get_stock_price),
    description="查询股票价格"
)
```

---

## 八、实战：构建RAG系统

### 8.1 RAG概述

**RAG**（Retrieval-Augmented Generation，检索增强生成）是当前最流行的LLM应用架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAG工作流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 索引阶段                                                    │
│     文档 → 分块 → Embedding → 向量数据库                         │
│                                                                 │
│  2. 查询阶段                                                    │
│     用户问题 → Embedding → 向量检索 → 相关文档                    │
│                                                                 │
│  3. 生成阶段                                                    │
│     用户问题 + 相关文档 → LLM → 最终回答                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 LangChain RAG实现

```python
# Python示例：使用LangChain实现RAG
from langchain.document_loaders import TextLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

# 1. 文档加载
def load_documents(directory: str):
    """
    加载目录下的所有文档

    参数:
        directory: 文档目录路径

    返回:
        文档列表
    """
    # 使用DirectoryLoader加载目录下所有txt文件
    loader = DirectoryLoader(
        directory,
        glob="**/*.txt",
        loader_cls=TextLoader
    )

    documents = loader.load()
    print(f"加载了 {len(documents)} 个文档")

    return documents

# 2. 文档分块
def split_documents(documents, chunk_size: int = 500, chunk_overlap: int = 50):
    """
    将文档分割成小块

    参数:
        documents: 文档列表
        chunk_size: 每块的大小（字符数）
        chunk_overlap: 块之间的重叠

    返回:
        分块后的文档
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]  # 分割符优先级
    )

    chunks = text_splitter.split_documents(documents)
    print(f"分割成 {len(chunks)} 个块")

    return chunks

# 3. 向量存储
def create_vectorstore(chunks, persist_directory: str = "./chroma_db"):
    """
    创建向量数据库

    参数:
        chunks: 文档块列表
        persist_directory: 持久化目录

    返回:
        向量数据库
    """
    # 使用OpenAI的Embedding模型
    embeddings = OpenAIEmbeddings(
        openai_api_key="your-api-key"
    )

    # 创建Chroma向量数据库
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )

    # 持久化保存
    vectorstore.persist()

    return vectorstore

# 4. 创建RAG Chain
def create_rag_chain(vectorstore):
    """
    创建RAG问答链

    参数:
        vectorstore: 向量数据库

    返回:
        RAG Chain
    """
    # 使用向量存储作为检索器
    retriever = vectorstore.as_retriever(
        search_type="similarity",    # 相似度检索
        search_kwargs={
            "k": 3,                   # 返回3个最相似的块
            "score_threshold": 0.5    # 最低相似度阈值
        }
    )

    # 创建LLM
    llm = ChatOpenAI(
        model_name="gpt-4",
        temperature=0
    )

    # 创建RetrievalQA Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",  # 将检索结果塞进一个prompt
        retriever=retriever,
        return_source_documents=True,  # 返回来源文档
        verbose=True
    )

    return qa_chain

# 5. 完整RAG Pipeline
class RAGSystem:
    """
    RAG系统：文档问答的完整解决方案

    使用流程：
    1. 初始化时加载文档并创建向量库
    2. query()方法进行问答
    """

    def __init__(
        self,
        docs_directory: str = "./documents",
        persist_directory: str = "./chroma_db"
    ):
        """
        初始化RAG系统

        参数:
            docs_directory: 文档目录
            persist_directory: 向量库持久化目录
        """
        # 加载文档
        documents = load_documents(docs_directory)

        # 分割文档
        chunks = split_documents(documents)

        # 创建向量库
        self.vectorstore = create_vectorstore(chunks, persist_directory)

        # 创建RAG Chain
        self.qa_chain = create_rag_chain(self.vectorstore)

    def query(self, question: str) -> dict:
        """
        问答

        参数:
            question: 用户问题

        返回:
            包含答案和来源的字典
        """
        result = self.qa_chain({"query": question})

        return {
            "answer": result["result"],
            "source_documents": result["source_documents"]
        }

    def add_document(self, file_path: str):
        """
        添加新文档到知识库

        参数:
            file_path: 文档路径
        """
        # 加载新文档
        loader = TextLoader(file_path)
        documents = loader.load()

        # 分割
        chunks = split_documents(documents)

        # 添加到向量库
        self.vectorstore.add_documents(chunks)
        self.vectorstore.persist()


# 使用示例
def demo_rag():
    """演示RAG系统"""

    # 方式1：直接使用Pipeline
    print("=" * 60)
    print("创建RAG系统...")

    # 创建向量库（假设有文档）
    # vectorstore = create_vectorstore(chunks)

    # 创建问答链
    # qa = create_rag_chain(vectorstore)

    # 查询
    # result = qa({"query": "什么是向量数据库？"})
    # print(result["result"])

    print("\nRAG系统演示完成")


# 6. 高级RAG：带自定义检索
def advanced_rag_example():
    """
    高级RAG示例：使用自定义检索策略
    """
    from langchain.retrievers import ContextualCompressionRetriever
    from langchain.retrievers.document_compressors import LLMChainExtractor

    # 基础向量检索
    base_retriever = vectorstore.as_retriever(
        search_kwargs={"k": 5}
    )

    # 创建压缩检索器：在检索后用LLM提取关键信息
    compressor = LLMChainExtractor.from_llm(llm)

    compression_retriever = ContextualCompressionRetriever(
        base_retriever=base_retriever,
        compressors=[compressor]
    )

    # 使用压缩检索器创建Chain
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=compression_retriever
    )

    return qa
```

---

## 九、实战：构建多轮对话Agent

### 9.1 需求分析

构建一个**私人助手Agent**，能够：
1. 记住用户的偏好和信息
2. 调用各种工具完成任务
3. 维持多轮对话上下文

### 9.2 实现代码

```python
# Python示例：私人助手Agent
from langchain.agents import initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory, EntityMemory
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from typing import Dict, Any

# 定义工具
class PrivateAssistantTools:
    """私人助手的工具集"""

    @staticmethod
    def get_calendar(event: str = "") -> str:
        """查看日程"""
        # 模拟日历数据
        events = {
            "今天": ["10:00 团队会议", "15:00 代码评审"],
            "明天": ["09:00 产品规划", "14:00 客户拜访"],
            "": "当前没有日程安排"
        }
        return events.get(event, "暂无信息")

    @staticmethod
    def set_reminder(content: str, time: str) -> str:
        """设置提醒"""
        return f"提醒已设置：{time} - {content}"

    @staticmethod
    def search_info(keyword: str) -> str:
        """搜索信息"""
        info_db = {
            "天气": "今天多云，温度15-25℃，适合外出",
            "新闻": "今日要闻：AI技术取得新突破...",
            "股票": "上证指数: 3200点，涨幅0.5%"
        }
        return info_db.get(keyword, f"关于{keyword}的信息：暂无详细数据")

    @staticmethod
    def send_message(recipient: str, message: str) -> str:
        """发送消息"""
        return f"消息已发送给{recipient}：{message}"


# 创建工具列表
def create_tools() -> list:
    """创建助手工具"""
    tools = [
        Tool(
            name="查看日程",
            func=lambda x: PrivateAssistantTools.get_calendar(x),
            description="查看日程安排，输入'今天'、'明天'或留空"
        ),
        Tool(
            name="设置提醒",
            func=lambda x: PrivateAssistantTools.set_reminder(x, "稍后"),
            description="设置提醒事项"
        ),
        Tool(
            name="搜索信息",
            func=lambda x: PrivateAssistantTools.search_info(x),
            description="搜索天气、新闻、股票等信息"
        ),
        Tool(
            name="发送消息",
            func=lambda x: PrivateAssistantTools.send_message("好友", x),
            description="发送消息给联系人"
        ),
        Tool(
            name="计算器",
            func=lambda x: str(eval(x)) if x.replace('+','-').replace('-','+').replace('*','').replace('/','').replace('.','').isdigit() else "无效表达式",
            description="简单数学计算"
        )
    ]
    return tools


class PersonalAssistant:
    """
    私人助手：完整的多轮对话Agent

    功能：
    1. 记忆用户信息（姓名、偏好等）
    2. 调用工具完成任务
    3. 维持多轮对话上下文
    4. 主动建议下一步操作
    """

    def __init__(self, user_name: str = "用户"):
        """
        初始化助手

        参数:
            user_name: 用户名称
        """
        self.user_name = user_name

        # 初始化模型
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.7
        )

        # 创建记忆（用户实体记忆）
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # 保存用户信息
        self.memory.save_context(
            {"input": f"我的名字是{user_name}"},
            {"output": f"好的，{user_name}，很高兴认识你！"}
        )

        # 创建工具
        self.tools = create_tools()

        # 创建Agent
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True,
            max_iterations=5,
            early_stopping_method="generate"
        )

        # 系统提示
        self.system_prompt = f"""
你是一个贴心、能干的私人助手，名字叫"小助手"。

你的特点：
1. 友好、热情、有耐心
2. 主动关心用户需求
3. 善于记忆用户的重要信息
4. 回答问题简洁明了

当前用户：{user_name}

如果用户提到以下信息，请记住：
- 姓名（已在系统设置）
- 工作相关的信息
- 个人偏好
- 重要日程

当用户提出请求时，主动询问是否需要更多帮助。
"""

    def chat(self, message: str) -> str:
        """
        聊天接口

        参数:
            message: 用户消息

        返回:
            助手回复
        """
        # 添加系统提示
        full_message = f"{self.system_prompt}\n\n用户说：{message}"

        # 调用Agent
        response = self.agent.run(full_message)

        return response

    def get_user_info(self) -> Dict[str, Any]:
        """获取已保存的用户信息"""
        history = self.memory.load_memory_variables({})
        return {"chat_history": history}


# 使用示例
def demo_personal_assistant():
    """演示私人助手"""

    assistant = PersonalAssistant(user_name="张三")

    print("=" * 60)
    print("私人助手对话开始")
    print("=" * 60)

    # 对话1
    print("\n【用户】明天上午有什么安排？")
    response = assistant.chat("明天上午有什么安排？")
    print(f"【小助手】{response}")

    # 对话2
    print("\n【用户】帮我记一下，明天9点有个产品评审会")
    response = assistant.chat("帮我记一下，明天9点有个产品评审会")
    print(f"【小助手】{response}")

    # 对话3
    print("\n【用户】提醒我下班后去超市买牛奶")
    response = assistant.chat("提醒我下班后去超市买牛奶")
    print(f"【小助手】{response}")

    # 对话4 - 测试记忆
    print("\n【用户】你还记得我叫什么吗？")
    response = assistant.chat("你还记得我叫什么吗？")
    print(f"【小助手】{response}")

demo_personal_assistant()
```

---

## 十、源码解析：LangChain核心机制

### 10.1 Chain的运行机制

```python
# LangChain Chain的抽象基类
from langchain.chains.base import Chain
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

class BaseChain(ABC):
    """
    Chain的基类：所有Chain都继承自这个类

    核心方法：
    - __call__: 使得Chain可以像函数一样调用
    - run: 执行Chain
    - apply: 批量处理输入
    """

    @property
    @abstractmethod
    def input_keys(self) -> List[str]:
        """输入键列表"""
        pass

    @property
    @abstractmethod
    def output_keys(self) -> List[str]:
        """输出键列表"""
        pass

    def __call__(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        使得Chain可以像函数一样调用

        例如：result = chain({"input": "hello"})
        """
        return self.run(inputs)

    def run(self, inputs: Union[Dict[str, Any], Any]) -> Union[Dict[str, Any], Any]:
        """
        执行Chain的核心方法

        步骤：
        1. 准备输入
        2. 执行Chain逻辑
        3. 准备输出
        """
        # 转换为字典格式
        if not isinstance(inputs, dict):
            inputs = {self.input_keys[0]: inputs}

        # 调用_chain方法执行
        outputs = self._call(inputs)

        # 返回输出
        return outputs

    @abstractmethod
    def _call(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        实际执行逻辑的抽象方法
        子类必须实现
        """
        pass
```

### 10.2 Agent的决策机制

```python
# Agent的决策循环
class AgentExecutor:
    """
    Agent执行器：运行Agent的核心逻辑

    执行流程：
    1. Agent思考下一步行动
    2. 选择并执行工具
    3. 获取工具返回结果
    4. 重复直到完成
    """

    def _take_single_step(
        self,
        ls_get_current_values: Dict[str, Any]
    ) -> None:
        """
        执行单一步骤

        核心决策循环
        """
        # 1. Agent思考
        thoughts = self._construct_scratch(
            self.agent,
            intermediate_steps,
            inputs
        )

        # 2. 获取思考内容
        new_input = self._extract_tool_calls(
            thoughts,
            self.agent.output_parser
        )

        # 3. 执行工具
        for tool_call in new_input.tool_calls:
            # 执行工具
            observation = tool.blocking_ainvoke(
                tool_call["args"]
            )

            # 记录中间步骤
            intermediate_steps.append(
                (tool_call, observation)
            )

        # 4. 更新当前状态
        ls_get_current_values.update(
            self.agent.memory(return_messages=True)
        )
```

---

## 十一、最佳实践与性能优化

### 11.1 Chain设计最佳实践

| 实践 | 说明 | 示例 |
|------|------|------|
| **单一职责** | 每个Chain只做一件事 | 分离提取、转换、生成Chain |
| **可复用** | 通用组件抽取为独立Chain | 摘要Chain可被多处复用 |
| **错误处理** | Chain执行需要有容错 | 使用try-catch包装 |
| **异步优先** | 优先使用异步API | 提高并发性能 |

### 11.2 Memory使用建议

```python
# Memory使用建议

# 1. 根据场景选择合适的Memory
# - 短期对话：ConversationBufferMemory
# - 长对话：ConversationSummaryMemory
# - 需要实体记忆：EntityMemory

# 2. 控制Token使用
memory = ConversationTokenBufferMemory(
    llm=llm,
    max_token_limit=2000  # 限制Token数量
)

# 3. 定期清理
memory.clear()  # 清空记忆

# 4. 持久化重要记忆
# 对于关键信息，应该保存到外部存储
```

### 11.3 性能优化技巧

```python
# 性能优化示例

# 1. 批量处理
# 不要逐条处理，批量处理更高效
results = chain.apply([
    {"input": "问题1"},
    {"input": "问题2"},
    {"input": "问题3"}
])

# 2. 异步执行
import asyncio

async def async_invoke(chain, inputs):
    """异步调用Chain"""
    return await chain.ainvoke(inputs)

# 3. 缓存Embedding结果
from langchain.embeddings import CacheBackedEmbeddings
from langchain.vectorstores import FAISS

# 使用缓存的Embedding
cache_embeddings = CacheBackedEmbeddings(
    underlying_embeddings=embeddings,
    document_embedding_cache=InMemoryStore()
)

# 4. 限制检索结果
retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 3,  # 只返回Top-3
        "fetch_k": 10  # 初步获取10个，再筛选3个
    }
)
```

---

## 十二、总结

### 12.1 核心知识点回顾

```
┌─────────────────────────────────────────────────────────────┐
│                    LangChain知识体系                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  核心模块                                                    │
│  ├── Model：统一LLM接口，支持OpenAI、HuggingFace等          │
│  ├── Prompt：模板化提示词，支持变量、示例、条件                │
│  ├── Chain：组件串联，LLMChain/SequentialChain/RouterChain   │
│  ├── Agent：自主决策，ReAct/Zero-shot/Conversational         │
│  ├── Tool：工具扩展，自定义工具、内置工具                      │
│  └── Memory：记忆管理，Buffer/Summary/Entity                  │
│                                                             │
│  高级特性                                                    │
│  ├── RAG：检索增强生成，向量数据库+LLM                        │
│  ├── ToolKit：工具组合，多工具协同                           │
│  ├── Callback：回调系统，监控执行过程                         │
│  └── Streaming：流式输出，实时显示进度                       │
│                                                             │
│  实战应用                                                    │
│  ├── 文档问答系统                                            │
│  ├── 私人助手Agent                                          │
│  ├── 多步骤自动化任务                                        │
│  └── 企业知识库                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 LangChain vs 其他框架对比

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **LangChain** | 功能全面，生态丰富 | 复杂AI应用，快速原型 |
| **LlamaIndex** | 专注于RAG和数据检索 | 知识库问答，文档分析 |
| **AutoGPT** | 专注Agent自主执行 | 自动化任务，探索性任务 |
| **LangFlow** | LangChain的可视化 | 学习理解，快速搭建 |

### 12.3 学习建议

1. **理解核心概念**：Chain、Agent、Memory是基础
2. **阅读源码**：理解设计模式，如工厂模式、策略模式
3. **多实践**：从简单例子开始，逐步增加复杂度
4. **关注生态**：LangChain更新很快，持续学习新特性

---

**文档字数**：约38000字

**核心要点回顾**：
1. LangChain是组装AI应用的框架，核心是Chain和Agent
2. Model层统一抽象了各种LLM接口
3. Prompt模板让提示词复用和参数化
4. Chain串联组件形成工作流
5. Agent能自主决策使用哪些工具
6. Memory让Agent记住对话历史和实体信息
7. RAG是当前最流行的LLM应用架构
8. 工具扩展了AI的能力边界
