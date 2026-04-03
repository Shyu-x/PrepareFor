# CrewAI 多Agent协作开发

## 一、CrewAI 核心概念

CrewAI 是一个用于构建多 Agent 协作的框架，通过 Role（角色）、Task（任务）、Crew（团队）、Tool（工具）的组合实现复杂的 AI 工作流程。

### 1.1 CrewAI 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     CrewAI 核心架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                         Crew                            │   │
│   │                      （团队）                           │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│   │  │ Agent 1  │  │ Agent 2  │  │ Agent 3  │             │   │
│   │  │  研究员   │  │  分析师   │  │  作家    │             │   │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │   │
│   │       │             │             │                    │   │
│   │       ▼             ▼             ▼                    │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│   │  │  Task 1  │  │  Task 2  │  │  Task 3  │             │   │
│   │  │ 研究任务  │  │ 分析任务  │  │ 写作任务  │             │   │
│   │  └──────────┘  └──────────┘  └──────────┘             │   │
│   │                                                          │   │
│   │  ┌──────────────────────────────────────────────────┐   │   │
│   │  │                     Tools                          │   │   │
│   │  │  搜索  │  读取  │  分析  │  写入  │  代码执行     │   │   │
│   │  └──────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   流程编排：Sequential │ Parallel │ Hierarchical                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念关系

```
Agent ──执行──▶ Task ◀──属于──┐
                               │
                               ▼
         Crew ◀──协调──┌───────┘
                       │
                       ▼
                    Process
                 (Sequential/Parallel/Hierarchical)
```

## 二、Agent 代理

### 2.1 Agent 定义与属性

```python
# crewai_agent.py
from crewai import Agent
from langchain_openai import ChatOpenAI

# 基础 Agent 创建
researcher = Agent(
    role="高级研究分析师",           # 角色：定义 Agent 的身份
    goal="获取最准确、最相关的信息",  # 目标：Agent 追求的最终目标
    backstory="""
        你是一位经验丰富的研究分析师，专注于
        科技行业趋势和新兴技术分析。你曾在
        多家顶级咨询公司工作，善于从海量信息
        中提取关键洞察。
    """,                              # 背景：Agent 的人物设定
    verbose=True,                      # 是否输出详细日志
    allow_delegation=True,            # 是否允许委托任务给他人
)

# 带工具的 Agent
from crewai.tools import BaseTool
from langchain_community.tools import DuckDuckGoSearchRun

# 创建搜索工具
search_tool = DuckDuckGoSearchRun()

coder = Agent(
    role="高级软件工程师",
    goal="编写高质量、可维护的代码",
    backstory="""
        你是一名全栈工程师，精通 Python、JavaScript
        和 TypeScript。你有 10 年以上的开发经验，
        熟悉各种设计模式和最佳实践。
    """,
    tools=[search_tool],              # 为 Agent 分配工具
    verbose=True
)

# 带 LLM 配置的 Agent
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7
)

designer = Agent(
    role="UI/UX 设计师",
    goal="创建直观、美观的用户界面",
    backstory="""
        你是一位获奖无数的 UI/UX 设计师，
        专注于创造极致的用户体验。你善于将
        复杂的功能简化为直观的界面设计。
    """,
    llm=llm,                          # 指定使用的 LLM
    verbose=True
)
```

### 2.2 Agent 角色设计原则

```python
# crewai_agent_design.py

# 好角色 vs 坏角色对比

# ❌ 模糊角色（不好）
vague_agent = Agent(
    role="助手",
    goal="帮助用户",
    backstory="你是一个 AI 助手"
)

# ✅ 具体角色（好）
specific_agent = Agent(
    role="金融数据分析师",
    goal="从财务报告中提取关键指标，提供投资洞察",
    backstory="""
        你是一名持证金融分析师（CFA），专精于
        财务报表分析和技术分析。你能够识别
        财务造假迹象，评估企业内在价值。
    """
)

# 角色设计要点
ROLE_GUIDELINES = """
1. 角色名称要具体明确
   - ❌ "助手" "AI" "Bot"
   - ✅ "金融分析师" "法律顾问" "技术架构师"

2. 目标要可量化
   - ❌ "做好工作"
   - ✅ "在 24 小时内完成报告初稿"

3. 背景故事要丰富
   - 具体行业经验
   - 专业认证
   - 成功案例
   - 工作风格

4. 工具要匹配角色
   - 研究员 → 搜索工具、阅读工具
   - 程序员 → 代码执行工具、Git 工具
   - 设计师 → 设计工具、原型工具
"""
```

### 2.3 Agent 委派机制

```python
# crewai_delegation.py

manager = Agent(
    role="项目经理",
    goal="协调团队高效完成任务",
    backstory="""
        你是一位经验丰富的项目经理（PMP 认证），
        善于协调跨职能团队，推动项目按时交付。
    """,
    allow_delegation=True,  # 允许委派任务
    verbose=True
)

# Agent 之间的委派
# CrewAI 支持 hierarchical 流程，Manager Agent 可以自动委派任务
```

## 三、Task 任务

### 3.1 Task 定义与属性

```python
# crewai_task.py
from crewai import Task, Agent

# 基础 Task 创建
research_task = Task(
    description="""
        研究当前最热门的 AI 应用场景：
        1. 收集 2024 年 AI 领域的重大突破
        2. 分析各行业的 AI 渗透率
        3. 预测 2025 年 AI 发展趋势
    """,
    expected_output="""
        一份包含以下内容的报告：
        - 执行摘要
        - 详细研究发现
        - 数据可视化图表
        - 明确的趋势预测
    """,
    agent=researcher,  # 指定执行者（可选）
    async_execution=False  # 是否异步执行
)

# 带上下文的 Task（依赖其他任务输出）
analysis_task = Task(
    description="""
        基于研究报告，分析 AI 发展趋势
        并提出投资建议
    """,
    expected_output="""
        - SWOT 分析
        - 投资机会矩阵
        - 风险评估报告
    """,
    agent=analyst,
    context=[research_task],  # 依赖的先前任务
    async_execution=False
)

# 简单描述的 Task
simple_task = Task(
    description="写一首关于人工智能的诗",
    expected_output="一首 10 行的诗"
)
```

### 3.2 Task 类型与配置

```python
# crewai_task_types.py

# 1. 标准任务
standard_task = Task(
    description="分析这段文本的情感倾向",
    expected_output="情感分类：正面/负面/中性，以及置信度"
)

# 2. 创意任务
creative_task = Task(
    description="为一个科技创业公司起名字",
    expected_output="5 个富有创意的公司名称及含义解释"
)

# 3. 技术任务
coding_task = Task(
    description="""
        编写一个 Python 函数，实现以下功能：
        - 接收用户输入的文本
        - 统计词频
        - 返回最常见的 5 个词
    """,
    expected_output="""
        完整的 Python 代码，包含：
        - 函数定义
        - 文档字符串
        - 单元测试
    """,
    agent=coder,
    tools=["code_execution"]  # 工具依赖
)

# 4. 决策任务
decision_task = Task(
    description="""
        评估以下两个方案：
        A方案：使用微服务架构，初期投入大但扩展性好
        B方案：使用单体架构，初期投入小但扩展性有限
    """,
    expected_output="""
        决策矩阵，包含：
        - 各方案评分
        - 成本效益分析
        - 最终推荐
    """
)

# 5. 带创建文件输出的任务
writing_task = Task(
    description="撰写产品需求文档",
    expected_output="完整的 PRD 文档",
    output_file="./outputs/prd.md",  # 输出到文件
    create_output_file=True
)
```

### 3.3 Task 上下文与依赖

```python
# crewai_task_dependency.py

# 线性依赖：Task A → Task B → Task C
task_a = Task(description="第一步任务", agent=agent_a)
task_b = Task(
    description="第二步任务",
    agent=agent_b,
    context=[task_a]  # 依赖 task_a 的输出
)
task_c = Task(
    description="第三步任务",
    agent=agent_c,
    context=[task_b]  # 依赖 task_b 的输出
)

# 并行 + 聚合模式
parallel_task_1 = Task(description="分析模块1", agent=agent_1)
parallel_task_2 = Task(description="分析模块2", agent=agent_2)
parallel_task_3 = Task(description="分析模块3", agent=agent_3)

# 聚合任务，收集所有并行任务的结果
aggregation_task = Task(
    description="综合所有分析结果",
    agent=aggregator,
    context=[parallel_task_1, parallel_task_2, parallel_task_3]
)

# Diamond 依赖模式
#      Task A
#     /      \
#  Task B    Task C
#     \      /
#      Task D
task_a = Task(description="顶层任务", agent=manager)
task_b = Task(description="分支任务1", agent=agent_1, context=[task_a])
task_c = Task(description="分支任务2", agent=agent_2, context=[task_a])
task_d = Task(
    description="汇聚任务",
    agent=agent_3,
    context=[task_b, task_c]
)
```

## 四、Crew 团队

### 4.1 Crew 创建与配置

```python
# crewai_crew.py
from crewai import Crew, Agent, Task
from crewai.process import Process

# 创建 Agent
researcher = Agent(
    role="行业研究员",
    goal="提供深入的行业洞察",
    backstory="资深行业分析师"
)

writer = Agent(
    role="内容撰写师",
    goal="将复杂信息转化为易懂内容",
    backstory="专业内容创作者"
)

# 创建 Task
research_task = Task(description="研究 AI 行业趋势")
write_task = Task(description="撰写行业报告", context=[research_task])

# 创建 Crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,  # 顺序执行
    verbose=True
)

# 启动 Crew
result = crew.kickoff()
print(result)
```

### 4.2 流程模式

```python
# crewai_process.py
from crewai import Crew, Process

# 1. 顺序流程（Sequential）
# 按任务顺序依次执行，后续任务可使用前序任务的输出
sequential_crew = Crew(
    agents=agents,
    tasks=[task1, task2, task3],
    process=Process.sequential,
    verbose=True
)

# 执行顺序：task1 → task2 → task3
result = sequential_crew.kickoff()

# 2. 并行流程（Parallel）
# 所有任务同时执行，最后聚合结果
parallel_crew = Crew(
    agents=agents,
    tasks=[task1, task2, task3],
    process=Process.parallel,  # 同时执行
    verbose=True
)

# 执行顺序：task1
#           task2  同时执行
#           task3

# 3. 层次流程（Hierarchical）
# Manager Agent 协调其他 Agent 的工作
manager = Agent(
    role="项目经理",
    goal="协调团队高效完成目标",
    backstory="经验丰富的项目经理",
    allow_delegation=True  # 关键：允许委派
)

hierarchical_crew = Crew(
    agents=[manager, agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.hierarchical,
    manager_agent=manager,  # 指定管理器
    verbose=True
)
```

### 4.3 Crew 高级配置

```python
# crewai_crew_advanced.py

# 带自定义配置的 Crew
advanced_crew = Crew(
    agents=[
        researcher,
        analyst,
        writer,
        reviewer
    ],
    tasks=[research, analyze, write, review],

    # 流程配置
    process=Process.sequential,
    verbose=2,  # 0: 不输出, 1: 关键信息, 2: 全部

    # 记忆配置
    memory=True,  # 启用 Agent 记忆
    embedder={
        "provider": "openai",
        "model": "text-embedding-3-small"
    },

    # 速率限制
    max_rpm=60,  # 每分钟最大请求数

    # 许可证配置
    full_output=True,  # 返回完整输出

    # 任务配置
    task_callback=None,  # 任务级别回调函数
)

# 带回调的 Crew
def on_task_complete(task):
    print(f"任务完成: {task.description}")
    # 发送通知等

def onCrewComplete(crew_output):
    print(f"Crew 执行完成: {crew_output}")
    # 后续处理

crew_with_callbacks = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.sequential,
    task_callback=on_task_complete,
    crew_callback=onCrewComplete,
    verbose=True
)
```

## 五、Tool 工具

### 5.1 内置工具

```python
# crewai_builtin_tools.py
from crewai.tools import BaseTool, Tool
from crewai.tools import (
    SearchTools,       # 搜索工具
    BrowserbaseTool,   # 浏览器工具
    FileWriterTool,   # 文件写入工具
)

# 使用内置搜索工具
search_tools = SearchTools()

researcher = Agent(
    role="研究员",
    goal="获取最新信息",
    tools=[
        search_tools.search_internet,      # 互联网搜索
        search_tools.search_news,          # 新闻搜索
    ]
)

# 文件操作工具
file_writer = Agent(
    role="文档工程师",
    goal="创建完整文档",
    tools=[
        FileWriterTool(
            file_path="./outputs/report.md",
            overwrite=True
        )
    ]
)
```

### 5.2 自定义工具

```python
# crewai_custom_tools.py
from crewai import Agent
from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel

# 方式一：使用 @tool 装饰器
from crewai.tools import tool

@tool
def calculate_roi(investment: str, returns: str) -> str:
    """计算投资回报率。

    参数:
        investment: 投资金额（元）
        returns: 回报金额（元）

    返回:
        ROI 百分比和分析结论
    """
    inv = float(investment)
    ret = float(returns)
    roi = ((ret - inv) / inv) * 100

    if roi > 20:
        analysis = "优秀的投资回报"
    elif roi > 0:
        analysis = "盈利但有提升空间"
    else:
        analysis = "投资亏损"

    return f"ROI: {roi:.2f}%，{analysis}"

@tool
def get_current_weather(location: str) -> str:
    """获取指定位置的天气信息。

    参数:
        location: 城市名称

    返回:
        天气预报信息
    """
    weather_db = {
        "北京": "晴，25°C，空气质量良",
        "上海": "多云，28°C，有阵雨",
        "深圳": "大雨，30°C，台风预警"
    }
    return weather_db.get(location, f"未找到 {location} 的天气数据")


# 方式二：继承 BaseTool
class StockPriceTool(BaseTool):
    name: str = "stock_price"
    description: str = "获取股票当前价格和相关信息"

    class InputSchema(BaseModel):
        symbol: str = "股票代码，如 AAPL, GOOGL"

    def _run(self, symbol: str) -> str:
        """实际执行工具逻辑"""
        # 模拟 API 调用
        stock_data = {
            "AAPL": {"price": 178.50, "change": "+2.3%"},
            "GOOGL": {"price": 141.20, "change": "-0.8%"},
            "MSFT": {"price": 378.90, "change": "+1.5%"}
        }

        if symbol.upper() in stock_data:
            data = stock_data[symbol.upper()]
            return f"{symbol} 当前价格: ${data['price']}，涨跌: {data['change']}"
        return f"未找到股票 {symbol} 的数据"

# 使用自定义工具
financial_analyst = Agent(
    role="金融分析师",
    goal="提供准确的投资分析",
    backstory="CFA认证分析师，10年经验",
    tools=[calculate_roi, StockPriceTool()]
)
```

### 5.3 工具组合使用

```python
# crewai_combined_tools.py
from crewai import Agent
from langchain_community.tools import (
    DuckDuckGoSearchRun,
    WikipediaQueryRun,
    Calculator
)

# 组合多个工具
research_agent = Agent(
    role="高级研究员",
    goal="全面准确地收集信息",
    backstory="专业市场研究员",
    tools=[
        DuckDuckGoSearchRun(),      # 网络搜索
        WikipediaQueryRun(),        # 维基百科
        Calculator(),               # 计算器
    ]
)

# 增量工具创建
from crewai.tools import Tool

def custom_search(query: str) -> str:
    """自定义搜索实现"""
    # 实现搜索逻辑
    return f"搜索结果: {query}"

def custom_analyzer(data: str) -> str:
    """自定义分析实现"""
    # 实现分析逻辑
    return f"分析结果: {data}"

# 创建组合工具
research_tool = Tool(
    name="综合研究",
    description="搜索网络并分析信息",
    func=lambda x: custom_analyzer(custom_search(x))
)

composite_agent = Agent(
    role="综合分析师",
    goal="提供一站式分析",
    tools=[research_tool]
)
```

## 六、实战项目

### 6.1 市场营销自动化

```python
# crewai_marketing.py
from crewai import Agent, Task, Crew
from crewai.process import Process
from crewai.tools import tool

# 定义工具
@tool
def market_research(query: str) -> str:
    """进行市场调研"""
    return f"市场调研结果：{query} 的市场规模、竞争格局、用户画像分析"

@tool
def competitor_analysis(product: str) -> str:
    """竞品分析"""
    return f"竞品分析：{product} 的主要竞争对手、功能对比、差异化策略"

@tool
def generate_content(topic: str, audience: str) -> str:
    """生成营销内容"""
    return f"为 {audience} 生成的 {topic} 营销文案"

# 创建 Agent
market_researcher = Agent(
    role="市场调研员",
    goal="深入了解目标市场和客户",
    backstory="10年市场调研经验，擅长数据分析"
)

competitor_analyst = Agent(
    role="竞品分析师",
    goal="分析竞争环境，制定差异化策略",
    backstory="前咨询公司顾问，精通竞品分析框架"
)

content_strategist = Agent(
    role="内容策略师",
    goal="创建有效的营销内容",
    backstory="资深营销人，擅长内容营销和品牌建设"
)

copywriter = Agent(
    role="文案撰写师",
    goal="创作引人入胜的营销文案",
    backstory="获奖文案撰写人，擅长各种风格"
)

# 创建 Task
research_task = Task(
    description="""
        针对目标客户群体进行深度市场调研：
        1. 确定市场规模和增长趋势
        2. 绘制目标客户画像
        3. 识别关键购买因素
    """,
    agent=market_researcher,
    expected_output="完整的市场调研报告，包含数据和洞察"
)

competitor_task = Task(
    description="""
        进行全面的竞品分析：
        1. 列出主要竞争对手
        2. 对比核心功能
        3. 分析定价策略
        4. 提出差异化建议
    """,
    agent=competitor_analyst,
    context=[research_task],
    expected_output="竞品分析矩阵和差异化策略文档"
)

strategy_task = Task(
    description="""
        基于调研和竞品分析，制定营销策略：
        1. 确定目标受众和核心信息
        2. 选择合适的营销渠道
        3. 制定内容主题计划
    """,
    agent=content_strategist,
    context=[research_task, competitor_task],
    expected_output="营销策略文档和内容计划"
)

content_task = Task(
    description="""
        创建具体的营销内容：
        1. 社交媒体帖子（5条）
        2. 电子邮件营销文案
        3. 落地页文案
    """,
    agent=copywriter,
    context=[strategy_task],
    expected_output="可直接使用的营销内容"
)

# 创建 Crew
marketing_crew = Crew(
    agents=[
        market_researcher,
        competitor_analyst,
        content_strategist,
        copywriter
    ],
    tasks=[
        research_task,
        competitor_task,
        strategy_task,
        content_task
    ],
    process=Process.sequential,
    verbose=True
)

# 启动
result = marketing_crew.kickoff()
print(result)
```

### 6.2 软件开发团队

```python
# crewai_software_development.py
from crewai import Agent, Task, Crew
from crewai.process import Process
from crewai.tools import tool
from typing import List

# 工具定义
@tool
def write_code(specification: str, language: str) -> str:
    """根据规格说明编写代码"""
    return f"已编写 {language} 代码，符合规格: {specification[:50]}..."

@tool
def review_code(code: str, language: str) -> str:
    """代码审查"""
    return f"代码审查结果：{language} 代码符合规范，建议通过"

@tool
def run_tests(code: str) -> str:
    """运行测试"""
    return "测试结果：所有测试通过，覆盖率 85%"

@tool
def write_docs(content: str) -> str:
    """编写文档"""
    return f"文档已编写: {content[:50]}..."

# 创建 Agent
architect = Agent(
    role="系统架构师",
    goal="设计可扩展、高性能的系统架构",
    backstory="架构师，15年经验，精通微服务和云原生"
)

backend_dev = Agent(
    role="后端工程师",
    goal="实现高质量的后端代码",
    backstory="全栈工程师，精通 Python、Go、分布式系统"
)

frontend_dev = Agent(
    role="前端工程师",
    goal="创建优秀的用户体验",
    backstory="前端专家，精通 React、Vue、性能优化"
)

qa_engineer = Agent(
    role="测试工程师",
    goal="确保产品质量",
    backstory="资深 QA，精通自动化测试和质量保障"
)

tech_writer = Agent(
    role="技术文档工程师",
    goal="编写清晰完整的文档",
    backstory="技术写作者，擅长将复杂技术简化为易懂文档"
)

# 创建 Task
architecture_task = Task(
    description="""
        设计一个电商平台的后端架构：
        1. 系统组件图
        2. API 设计
        3. 数据库设计
        4. 技术选型说明
    """,
    agent=architect,
    expected_output="完整的架构设计文档"
)

backend_task = Task(
    description="""
        基于架构设计，实现后端核心功能：
        1. 用户认证模块
        2. 商品管理 API
        3. 订单处理系统
        4. 支付集成接口
    """,
    agent=backend_dev,
    context=[architecture_task],
    expected_output="完整的代码和 README"
)

frontend_task = Task(
    description="""
        实现电商平台前端：
        1. 商品列表页
        2. 商品详情页
        3. 购物车功能
        4. 用户中心
    """,
    agent=frontend_dev,
    context=[architecture_task, backend_task],
    expected_output="可运行的前端应用"
)

testing_task = Task(
    description="""
        进行全面的质量保障：
        1. 单元测试
        2. 集成测试
        3. E2E 测试
        4. 性能测试
    """,
    agent=qa_engineer,
    context=[backend_task, frontend_task],
    expected_output="测试报告和覆盖率报告"
)

docs_task = Task(
    description="""
        编写项目文档：
        1. 开发者指南
        2. API 文档
        3. 部署手册
    """,
    agent=tech_writer,
    context=[architecture_task, backend_task, frontend_task],
    expected_output="完整的项目文档"
)

# 创建 Crew
dev_crew = Crew(
    agents=[
        architect,
        backend_dev,
        frontend_dev,
        qa_engineer,
        tech_writer
    ],
    tasks=[
        architecture_task,
        backend_task,
        frontend_task,
        testing_task,
        docs_task
    ],
    process=Process.sequential,
    verbose=True
)

# 启动开发流程
result = dev_crew.kickoff()
print(result)
```

### 6.3 金融分析团队

```python
# crewai_finance.py
from crewai import Agent, Task, Crew
from crewai.process import Process
from crewai.tools import tool

# 金融分析工具
@tool
def fetch_financial_data(company: str) -> str:
    """获取财务数据"""
    return f"{company} 财务数据：营收、利润、现金流、资产负债"

@tool
def analyze_ratios(data: str) -> str:
    """分析财务比率"""
    return "盈利能力：毛利率 35%，净利率 12%\n偿债能力：流动比率 2.1\n运营效率：存货周转 8 次"

@tool
def compare_companies(companies: List[str]) -> str:
    """比较公司"""
    return f"{' vs '.join(companies)} 的对比分析"

@tool
def generate_report(analysis: str, recommendation: str) -> str:
    """生成报告"""
    return f"投资研究报告：\n{analysis}\n{recommendation}"

# 创建 Agent
data_collector = Agent(
    role="数据采集员",
    goal="收集完整准确的财务数据",
    backstory="数据分析师，擅长金融数据采集和处理"
)

financial_analyst = Agent(
    role="财务分析师",
    goal="进行深入的财务分析",
    backstory="CFA持证人，10年二级市场研究经验"
)

risk_analyst = Agent(
    role="风险分析师",
    goal="识别和评估风险",
    backstory="风险管理专家，精通各类金融风险模型"
)

investment_advisor = Agent(
    role="投资顾问",
    goal="提供投资建议",
    backstory="首席投资官，擅长价值投资和风险管理"
)

# 创建 Task
data_task = Task(
    description="""
        收集目标公司的财务数据：
        1. 近 3 年财务报表
        2. 行业对比数据
        3. 宏观经济数据
    """,
    agent=data_collector,
    expected_output="结构化的数据报告"
)

analysis_task = Task(
    description="""
        进行财务分析：
        1. 盈利能力分析
        2. 成长性分析
        3. 运营效率分析
        4. 估值分析
    """,
    agent=financial_analyst,
    context=[data_task],
    expected_output="详细的财务分析报告"
)

risk_task = Task(
    description="""
        评估投资风险：
        1. 市场风险
        2. 信用风险
        3. 流动性风险
        4. 行业风险
    """,
    agent=risk_analyst,
    context=[data_task, analysis_task],
    expected_output="风险评估矩阵"
)

recommendation_task = Task(
    description="""
        制定投资建议：
        1. 综合分析结论
        2. 投资评级
        3. 目标价位
        4. 风险提示
    """,
    agent=investment_advisor,
    context=[analysis_task, risk_task],
    expected_output="完整的投资建议报告"
)

# 创建 Crew
finance_crew = Crew(
    agents=[
        data_collector,
        financial_analyst,
        risk_analyst,
        investment_advisor
    ],
    tasks=[
        data_task,
        analysis_task,
        risk_task,
        recommendation_task
    ],
    process=Process.sequential,
    verbose=True
)

# 启动分析
result = finance_crew.kickoff()
print(result)
```

## 七、多 Agent 协作模式

### 7.1 顺序协作

```python
# crewai_sequential.py

# 最基本的协作模式：按顺序执行
# Task A → Task B → Task C → Task D

sequential_crew = Crew(
    agents=[agent_a, agent_b, agent_c, agent_d],
    tasks=[task_a, task_b, task_c, task_d],
    process=Process.sequential
)

# agent_b 会自动获得 agent_a 的输出作为上下文
result = sequential_crew.kickoff()
```

### 7.2 并行协作

```python
# crewai_parallel.py

# 所有 Agent 同时工作，最后汇总
parallel_crew = Crew(
    agents=[
        agent_research_1,
        agent_research_2,
        agent_research_3
    ],
    tasks=[
        task_research_market,
        task_research_competitor,
        task_research_user
    ],
    process=Process.parallel
)

# 三个研究任务同时执行
result = parallel_crew.kickoff()

# 结果聚合
print(result.tasks_output)  # 所有任务的输出
```

### 7.3 层次协作

```python
# crewai_hierarchical.py

# Manager Agent 负责协调和委派
manager = Agent(
    role="项目经理",
    goal="确保团队高效协作，按时交付",
    backstory="经验丰富的项目经理，擅长资源调配",
    allow_delegation=True  # 核心：允许委派任务
)

specialist_1 = Agent(role="专员1", goal="完成任务A")
specialist_2 = Agent(role="专员2", goal="完成任务B")
specialist_3 = Agent(role="专员3", goal="完成任务C")

hierarchical_crew = Crew(
    agents=[manager, specialist_1, specialist_2, specialist_3],
    tasks=[task_a, task_b, task_c],
    process=Process.hierarchical,
    manager_agent=manager
)

# Manager 自动决定：
# 1. 哪个 Agent 做什么
# 2. 任务分配顺序
# 3. 结果整合
result = hierarchical_crew.kickoff()
```

### 7.4 动态协作

```python
# crewai_dynamic.py

# 根据情况动态决定协作方式
class DynamicCrew:
    def __init__(self):
        self.researcher = Agent(role="研究员")
        self.analyst = Agent(role="分析师")
        self.writer = Agent(role="作家")

    def decide_process(self, task_complexity: str) -> str:
        """根据任务复杂度决定流程"""
        if task_complexity == "simple":
            return Process.parallel
        elif task_complexity == "moderate":
            return Process.sequential
        else:
            return Process.hierarchical

    def run(self, task_description: str):
        """动态运行"""
        complexity = self.assess_complexity(task_description)
        process = self.decide_process(complexity)

        crew = Crew(
            agents=[self.researcher, self.analyst, self.writer],
            tasks=self.create_tasks(task_description),
            process=process
        )

        return crew.kickoff()

    def assess_complexity(self, task: str) -> str:
        """评估复杂度"""
        # 简化评估
        return "moderate"

    def create_tasks(self, description: str):
        """创建任务"""
        # 根据描述动态创建
        return []

# 使用动态 Crew
dynamic_crew = DynamicCrew()
result = dynamic_crew.run("写一篇关于 AI 的文章")
```

## 八、输出与回调

### 8.1 Crew 输出处理

```python
# crewai_output.py

# 启动 Crew
crew = Crew(agents=agents, tasks=tasks, process=Process.sequential)
result = crew.kickoff()

# 访问输出
print(result.raw)           # 原始输出
print(result.pydantic)     # Pydantic 模型格式
print(result.json_dict)    # JSON 格式

# 访问任务输出
for task_output in result.tasks_output:
    print(f"任务: {task_output.description}")
    print(f"输出: {task_output.raw}")
    print(f"Agent: {task_output.agent}")

# 访问 token 使用
print(result.token_usage)  # Token 统计
```

### 8.2 回调处理

```python
# crewai_callbacks.py
from crewai import Crew, Agent, Task

def on_task_start(task):
    """任务开始回调"""
    print(f"开始执行任务: {task.description}")

def on_task_end(task):
    """任务结束回调"""
    print(f"任务完成: {task.description}")
    print(f"输出: {task.output}")

def on_agent_start(agent, task):
    """Agent 开始回调"""
    print(f"Agent {agent.role} 开始处理 {task.description}")

def on_agent_end(agent, result):
    """Agent 结束回调"""
    print(f"Agent {agent.role} 完成")

def on_crew_start(crew):
    """Crew 开始回调"""
    print(f"Crew {crew.name} 开始执行")

def on_crew_end(crew, result):
    """Crew 结束回调"""
    print(f"Crew 执行完成")
    print(f"最终结果: {result.raw}")

# 创建带回调的 Crew
crew_with_callbacks = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.sequential,
    task_start_callback=on_task_start,
    task_end_callback=on_task_end,
    agent_start_callback=on_agent_start,
    agent_end_callback=on_agent_end,
    crew_start_callback=on_crew_start,
    crew_end_callback=on_crew_end,
    verbose=True
)

result = crew_with_callbacks.kickoff()
```

## 九、最佳实践

### 9.1 Agent 设计最佳实践

```python
# crewai_best_practices.py

# 1. 角色要具体明确
# ❌ 不好
agent = Agent(role="助手")

# ✅ 好
agent = Agent(
    role="电商平台售后客服专员",
    goal="解决客户问题，提升满意度",
    backstory="""
        你是售后客服专员，3年电商平台经验，
        熟悉退换货流程、投诉处理、客户安抚技巧。
        你善于站在客户角度思考问题。
    """
)

# 2. 工具要匹配角色
researcher = Agent(
    role="市场研究员",
    tools=[
        search_internet,
        wikipedia_search,
        web_scraper
    ]
)

# 3. 避免过多 Agent（通常 3-5 个最佳）
# 5 个 Agent 协作已经非常复杂
# 如果需要更多，考虑分层架构

# 4. Task 描述要清晰
task = Task(
    description="""
        请完成以下任务：
        1. 搜索 [具体主题] 的相关信息
        2. 分析找到的数据
        3. 给出 [具体形式] 的输出

        注意：[具体要求或限制]
    """,
    expected_output="""
        输出应包含：
        - [具体项1]
        - [具体项2]
        - [具体项3]
    """
)
```

### 9.2 流程选择指南

```
┌─────────────────────────────────────────────────────────────────┐
│                     流程选择指南                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sequential（顺序）                                             │
│  ────────────────                                               │
│  适用场景：                                                      │
│  ✓ 任务有明确的先后依赖                                         │
│  ✓ 每个任务需要前序任务的输出                                   │
│  ✓ 如：研究 → 分析 → 报告 → 审核                               │
│                                                                 │
│  Parallel（并行）                                               │
│  ──────────────                                                 │
│  适用场景：                                                      │
│  ✓ 任务相互独立                                                 │
│  ✓ 需要多角度分析同一问题                                       │
│  ✓ 如：多个市场调研同时进行                                     │
│                                                                 │
│  Hierarchical（层次）                                           │
│  ──────────────────                                             │
│  适用场景：                                                      │
│  ✓ 复杂任务需要协调管理                                         │
│  ✓ 需要动态分配任务                                             │
│  ✓ 如：大型项目需要项目经理协调                                 │
│                                                                 │
│  选择原则：                                                     │
│  1. 简单线性任务 → Sequential                                  │
│  2. 多角度独立任务 → Parallel                                  │
│  3. 复杂协作任务 → Hierarchical                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 性能优化

```python
# crewai_optimization.py

# 1. 合理设置并发
parallel_crew = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.parallel,
    max_rpm=60  # 限制 API 调用频率
)

# 2. 使用缓存
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

set_llm_cache(InMemoryCache())

# 3. 批量处理
# 拆分大型 Crew 为多个小型 Crew
def batch_process(items: List[str], batch_size: int = 5):
    """批量处理"""
    results = []
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        crew = create_crew_for_batch(batch)
        results.append(crew.kickoff())
    return results

# 4. 异步执行
import asyncio

async def async_kickoff(crew):
    return await asyncio.to_thread(crew.kickoff)

# 并发执行多个 Crew
crews = [crew1, crew2, crew3]
results = asyncio.run(asyncio.gather(*[async_kickoff(c) for c in crews]))
```

## 十、与其他框架对比

```
┌─────────────────────────────────────────────────────────────────┐
│                   CrewAI vs LangChain vs LangGraph              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┬──────────────────────────────────────────────┐  │
│  │   特性     │   CrewAI    │   LangChain   │   LangGraph   │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 定位       │ 多Agent协作 │ LLM应用框架   │ 状态机工作流  │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ Agent 概念 │ ✅ 核心概念 │ ✅ 支持       │ ✅ 支持       │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ Task 概念  │ ✅ 核心概念 │ ⚠️ Chain     │ ⚠️ State     │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 工具支持   │ ✅ 内置     │ ✅ 丰富       │ ⚠️ 需自定义  │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 流程编排   │ ✅ 三种模式 │ ⚠️ Chain     │ ✅ 条件边    │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 状态管理   │ ⚠️ 简单     │ ⚠️ Memory    │ ✅ 强状态    │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 学习曲线   │ 低          │ 中            │ 高            │  │
│  ├────────────┼─────────────┼───────────────┼───────────────┤  │
│  │ 适用场景   │ 多Agent协作 │ 通用LLM应用   │ 复杂工作流    │  │
│  └────────────┴─────────────┴───────────────┴───────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 十一、总结

CrewAI 核心组件：

| 组件 | 说明 | 关键属性 |
|------|------|----------|
| **Agent** | 执行任务的代理 | role, goal, backstory, tools |
| **Task** | 具体任务定义 | description, expected_output, context |
| **Crew** | Agent 团队 | agents, tasks, process |
| **Tool** | Agent 使用的工具 | 自定义或内置工具 |

### CrewAI 工作流程

```
1. 定义 Agent（角色 + 目标 + 背景）
       │
       ▼
2. 定义 Task（描述 + 期望输出 + 依赖）
       │
       ▼
3. 组建 Crew（Agent + Task + 流程）
       │
       ▼
4. 选择流程模式
   - Sequential：顺序执行
   - Parallel：并行执行
   - Hierarchical：层次管理
       │
       ▼
5. 启动 Crew（kickoff）
       │
       ▼
6. 获取结果
```

### 选择建议

- **CrewAI**：需要快速构建多 Agent 协作系统
- **LangChain**：需要丰富的 LLM 工具和链式调用
- **LangGraph**：需要复杂状态机和循环的工作流
