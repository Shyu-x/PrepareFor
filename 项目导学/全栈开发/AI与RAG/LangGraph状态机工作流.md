# LangGraph 状态机工作流

## 一、LangGraph 核心概念

LangGraph 是 LangChain 生态中用于构建有状态、多actor工作流的库，基于图结构实现复杂的 Agent 编排。

### 1.1 为什么需要 LangGraph？

```
┌─────────────────────────────────────────────────────────────────┐
│                      传统 Chain vs LangGraph                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   传统 Chain（线性）              LangGraph（有状态）             │
│   ─────────────────              ──────────────────             │
│                                                                 │
│   A → B → C → D                  ┌─────────────────┐          │
│                                  │       START      │          │
│   问题：                         │         ↓        │          │
│   1. 无法回退                    └────────┬────────┘          │
│   2. 不能循环                     ┌───────▼────────┐          │
│   3. 状态丢失                     │      节点A      │          │
│   4. 条件分支简单                 └───────┬────────┘          │
│                                        ↓         ↓            │
│   LangGraph 优势：                   节点B     节点C            │
│   1. 支持循环                      ↓              ↓            │
│   2. 条件分支                      节点D ←────────┘            │
│   3. 持久化状态                    ↓                        │
│   4. 多 agent 协作                ┌▼────────┐               │
│   5. 中断恢复                     │   END   │                │
│                                  └─────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      LangGraph 核心架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   State（状态）                                                  │
│   ─────────                                                    │
│   • 整个图的共享状态                                            │
│   • 使用 TypedDict 定义                                         │
│   • 可持久化到外部存储                                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────┐      │
│   │                   State Schema                       │      │
│   │  {                                                     │      │
│   │    messages: List[BaseMessage],                       │      │
│   │    current_node: str,                                 │      │
│   │    iteration: int,                                    │      │
│   │    context: Dict[str, Any]                            │      │
│   │  }                                                     │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                 │
│   Node（节点）                                                  │
│   ─────────                                                    │
│   • 图中的计算单元                                              │
│   • 一个 Python 函数                                           │
│   • 接收当前状态，返回更新后的状态                              │
│                                                                 │
│   ┌─────────────┐                                              │
│   │  def node(  │                                              │
│   │    state    │  ──▶  new_state                             │
│   │  ) -> State │                                              │
│   └─────────────┘                                              │
│                                                                 │
│   Edge（边）                                                   │
│   ────────                                                    │
│   • 节点之间的连接                                             │
│   • 普通边：无条件转移                                         │
│   • 条件边：根据状态条件选择下一个节点                          │
│                                                                 │
│   START ──▶ Node_A ──▶ [条件判断] ──▶ Node_B                  │
│                              ↓              ↓                   │
│                           Node_C       Node_D                  │
│                              ↓              ↓                   │
│                           END          END                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 二、State 状态管理

### 2.1 状态定义

```python
# langgraph_state.py
from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import operator

# 方式一：基础 TypedDict
class AgentState(TypedDict):
    """Agent 的状态定义"""
    messages: List[BaseMessage]           # 对话历史
    current_node: str                     # 当前执行节点
    iteration: int                         # 迭代计数器
    context: Dict[str, Any]               # 额外的上下文数据

# 方式二：带注解的状态（用于合并策略）
class EnhancedState(TypedDict):
    """增强型状态定义"""

    # messages 使用 add_messages 合并策略
    # 新消息追加而不是覆盖
    messages: Annotated[List[BaseMessage], operator.add]

    # iteration 使用 max 合并策略
    iteration: Annotated[int, max]

    # context 使用合并策略
    context: Annotated[Dict[str, Any], merge_dicts]

# 合并函数示例
def merge_dicts(left: Dict, right: Dict) -> Dict:
    """深度合并两个字典"""
    result = left.copy()
    for key, value in right.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result

# 方式三：使用 Pydantic 模型（更灵活）
from pydantic import BaseModel, Field
from typing import Optional

class ConversationState(BaseModel):
    """对话状态模型"""
    messages: List[BaseMessage] = Field(default_factory=list)
    current_node: str = "start"
    iteration: int = 0

    # 可选字段
    user_id: Optional[str] = None
    session_id: Optional[str] = None

    # 额外元数据
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True
```

### 2.2 状态转换规则

```python
# langgraph_state_transition.py
from typing import Literal

# 状态更新示例
def update_state_example(state: AgentState) -> AgentState:
    """状态更新示例"""

    # 1. 添加消息
    new_message = AIMessage(content="这是新消息")
    state["messages"].append(new_message)

    # 2. 更新当前节点
    state["current_node"] = "next_node"

    # 3. 增加迭代计数
    state["iteration"] += 1

    # 4. 添加上下文
    state["context"]["last_action"] = "processed"

    return state

# 使用 operator 进行状态合并
from typing import Annotated
from collections import defaultdict

def messages_add(left: List, right: List) -> List:
    """合并消息列表"""
    return left + right

# Annotated 状态使用示例
class TypedState(TypedDict):
    messages: Annotated[List, messages_add]
    count: Annotated[int, lambda a, b: a + b]

# 创建支持状态合并的图
graph = StateGraph(TypedState)
```

## 三、Node 节点定义

### 3.1 节点基础

```python
# langgraph_nodes.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage

class WorkflowState(TypedDict):
    messages: list
    next_action: str
    data: dict

# 节点函数签名：接收当前状态，返回更新后的状态
def process_node(state: WorkflowState) -> WorkflowState:
    """处理节点示例"""

    # 获取输入
    last_message = state["messages"][-1] if state["messages"] else None

    # 处理逻辑
    result = f"处理了: {last_message.content if last_message else '无'}"

    # 更新状态
    return {
        "messages": state["messages"] + [AIMessage(content=result)],
        "next_action": "analyze",
        "data": {**state.get("data", {}), "processed": True}
    }

def analyze_node(state: WorkflowState) -> WorkflowState:
    """分析节点"""

    result = "分析完成"

    return {
        "messages": state["messages"] + [AIMessage(content=result)],
        "next_action": "output",
        "data": {**state.get("data", {}), "analyzed": True}
    }

def output_node(state: WorkflowState) -> WorkflowState:
    """输出节点"""

    return {
        "messages": state["messages"] + [AIMessage(content="流程结束")],
        "next_action": END,
        "data": {**state.get("data", {}), "completed": True}
    }

# 构建图
graph = StateGraph(WorkflowState)

# 注册节点
graph.add_node("process", process_node)
graph.add_node("analyze", analyze_node)
graph.add_node("output", output_node)

# 设置入口点
graph.add_edge(START, "process")

# 设置固定边
graph.add_edge("process", "analyze")
graph.add_edge("analyze", "output")
graph.add_edge("output", END)
```

### 3.2 异步节点

```python
# langgraph_async_nodes.py
import asyncio
from typing import TypedDict
from langgraph.graph import StateGraph, START

class AsyncState(TypedDict):
    messages: list
    results: dict

async def async_fetch_data(state: AsyncState) -> AsyncState:
    """异步获取数据"""

    # 模拟异步 API 调用
    await asyncio.sleep(1)

    return {
        "messages": state["messages"],
        "results": {**state.get("results", {}), "data": "fetched"}
    }

async def async_process_data(state: AsyncState) -> AsyncState:
    """异步处理数据"""

    # 模拟处理
    await asyncio.sleep(0.5)

    return {
        "messages": state["messages"] + ["processed"],
        "results": {**state.get("results", {}), "processed": True}
    }

# 并行执行多个节点
async def parallel_fetch(state: AsyncState) -> AsyncState:
    """并行获取多个数据源"""
    import aiohttp

    async with aiohttp.ClientSession() as session:
        # 并行发起多个请求
        tasks = [
            fetch_api(session, "https://api.example.com/data1"),
            fetch_api(session, "https://api.example.com/data2"),
            fetch_api(session, "https://api.example.com/data3"),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return {
        "messages": state["messages"],
        "results": {**state.get("results", {}), "parallel_results": results}
    }

async def fetch_api(session, url):
    """异步获取单个 API"""
    async with session.get(url) as response:
        return await response.json()
```

### 3.3 节点错误处理

```python
# langgraph_node_error_handling.py
from typing import TypedDict
from langgraph.graph import StateGraph, START
from langgraph.constants import Send

class ErrorHandlingState(TypedDict):
    messages: list
    error_count: int
    should_retry: bool

def node_with_error_handling(state: ErrorHandlingState) -> ErrorHandlingState:
    """带错误处理的节点"""

    try:
        # 可能失败的操作
        result = risky_operation()

        return {
            "messages": state["messages"] + [f"成功: {result}"],
            "error_count": state["error_count"],
            "should_retry": False
        }

    except RetryableError as e:
        # 可重试错误
        return {
            "messages": state["messages"] + [f"错误: {e}"],
            "error_count": state["error_count"] + 1,
            "should_retry": True
        }

    except FatalError as e:
        # 致命错误，直接结束
        return {
            "messages": state["messages"] + [f"致命错误: {e}"],
            "error_count": state["error_count"],
            "should_retry": False
        }

def retry_node(state: ErrorHandlingState) -> ErrorHandlingState:
    """重试节点"""
    return {
        "messages": state["messages"] + ["重试中..."],
        "error_count": state["error_count"],
        "should_retry": True
    }

# 错误处理流程
graph = StateGraph(ErrorHandlingState)

graph.add_node("main", node_with_error_handling)
graph.add_node("retry", retry_node)

graph.add_edge(START, "main")

# 条件边：根据是否应该重试决定下一步
def should_retry(state: ErrorHandlingState) -> bool:
    return state.get("should_retry", False) and state["error_count"] < 3

graph.add_conditional_edges(
    "main",
    should_retry,
    {
        True: "retry",
        False: END
    }
)

graph.add_edge("retry", "main")
```

## 四、Edge 边与条件分支

### 4.1 普通边 vs 条件边

```python
# langgraph_edges.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class EdgeState(TypedDict):
    value: int
    history: list

# 节点定义
def node_a(state: EdgeState) -> EdgeState:
    return {"value": 10, "history": state["history"] + ["A"]}

def node_b(state: EdgeState) -> EdgeState:
    return {"value": state["value"] * 2, "history": state["history"] + ["B"]}

def node_c(state: EdgeState) -> EdgeState:
    return {"value": state["value"] + 100, "history": state["history"] + ["C"]}

def node_d(state: EdgeState) -> EdgeState:
    return {"value": 0, "history": state["history"] + ["D"]}

# 构建图
graph = StateGraph(EdgeState)

# 添加节点
graph.add_node("A", node_a)
graph.add_node("B", node_b)
graph.add_node("C", node_c)
graph.add_node("D", node_d)

# START -> A 是普通边
graph.add_edge(START, "A")

# 普通边：无条件转移
graph.add_edge("A", "B")  # A 完成后一定去 B

# 条件边：根据状态决定下一个节点
def route_after_a(state: EdgeState) -> str:
    """根据 A 的输出决定下一步"""
    if state["value"] > 50:
        return "C"
    else:
        return "D"

graph.add_conditional_edges(
    "B",  # 从 B 开始
    route_after_a,  # 路由函数
    {
        "C": "C",  # 路由到 C
        "D": "D"   # 路由到 D
    }
)

# 普通边
graph.add_edge("C", END)
graph.add_edge("D", END)
```

### 4.2 多条件路由

```python
# langgraph_multi_routing.py
from typing import Literal, Union
from langgraph.graph import StateGraph, START, END

class RoutingState(TypedDict):
    query: str
    category: str
    confidence: float
    route_to: str

def classify_node(state: RoutingState) -> RoutingState:
    """分类节点"""
    query = state["query"].lower()

    if any(word in query for word in ["buy", "price", "cost", "purchase"]):
        category = "sales"
        confidence = 0.9
    elif any(word in query for word in ["bug", "error", "issue", "crash"]):
        category = "support"
        confidence = 0.85
    elif any(word in query for word in ["feature", "suggest", "improve"]):
        category = "feedback"
        confidence = 0.8
    else:
        category = "general"
        confidence = 0.5

    return {
        **state,
        "category": category,
        "confidence": confidence
    }

def route_query(state: RoutingState) -> Literal["sales", "support", "feedback", "general"]:
    """多条件路由"""
    return state["category"]

def sales_handler(state: RoutingState) -> RoutingState:
    return {**state, "route_to": "sales_team"}

def support_handler(state: RoutingState) -> RoutingState:
    return {**state, "route_to": "support_team"}

def feedback_handler(state: RoutingState) -> RoutingState:
    return {**state, "route_to": "feedback_team"}

def general_handler(state: RoutingState) -> RoutingState:
    return {**state, "route_to": "general_team"}

# 构建图
graph = StateGraph(RoutingState)

graph.add_node("classify", classify_node)
graph.add_node("sales", sales_handler)
graph.add_node("support", support_handler)
graph.add_node("feedback", feedback_handler)
graph.add_node("general", general_handler)

graph.add_edge(START, "classify")

# 条件边：4 个分支
graph.add_conditional_edges(
    "classify",
    route_query,
    {
        "sales": "sales",
        "support": "support",
        "feedback": "feedback",
        "general": "general"
    }
)

# 所有分支汇聚到 END
graph.add_edge("sales", END)
graph.add_edge("support", END)
graph.add_edge("feedback", END)
graph.add_edge("general", END)
```

### 4.3 分支与合并

```python
# langgraph_fork_join.py
from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from langgraph.constants import Send

class ParallelState(TypedDict):
    results: List[dict]

def start_node(state: ParallelState) -> dict:
    """分发节点"""
    return {"task_id": "123", "items": ["A", "B", "C"]}

def parallel_task_1(state: dict) -> dict:
    """并行任务 1"""
    return {"result": f"处理 {state['item']} 结果1"}

def parallel_task_2(state: dict) -> dict:
    """并行任务 2"""
    return {"result": f"处理 {state['item']} 结果2"}

def parallel_task_3(state: dict) -> dict:
    """并行任务 3"""
    return {"result": f"处理 {state['item']} 结果3"}

def aggregate_results(state: ParallelState, tasks: List[dict]) -> ParallelState:
    """聚合结果"""
    return {"results": tasks}

# 使用 Send 进行并行分发
def fan_out(state: ParallelState) -> List[dict]:
    """将任务分发给多个并行节点"""
    items = ["数据1", "数据2", "数据3"]
    return [
        Send("task_node", {"item": item, "task_num": i})
        for i, item in enumerate(items)
    ]

# 构建图
graph = StateGraph(ParallelState)

graph.add_node("start", start_node)
graph.add_node("task_node", lambda x: {"result": f"处理完成"})
graph.add_node("aggregate", lambda state, tasks=None: {"results": tasks or []})

graph.add_edge(START, "start")

# 使用条件边进行并行分发
graph.add_conditional_edges(
    "start",
    lambda state: [Send("task_node", {"item": item}) for item in ["A", "B", "C"]]
)

graph.add_edge("task_node", "aggregate")
graph.add_edge("aggregate", END)
```

## 五、循环计算与迭代

### 5.1 While 循环实现

```python
# langgraph_while_loop.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class LoopState(TypedDict):
    counter: int
    max_iterations: int
    accumulated: list
    should_continue: bool

def initialize(state: LoopState) -> LoopState:
    """初始化"""
    return {
        "counter": 0,
        "max_iterations": 5,
        "accumulated": [],
        "should_continue": True
    }

def process_loop(state: LoopState) -> LoopState:
    """循环处理"""
    new_counter = state["counter"] + 1
    new_accumulated = state["accumulated"] + [f"步骤 {new_counter}"]

    return {
        "counter": new_counter,
        "max_iterations": state["max_iterations"],
        "accumulated": new_accumulated,
        "should_continue": new_counter < state["max_iterations"]
    }

def check_continue(state: LoopState) -> str:
    """决定是否继续循环"""
    if state["should_continue"]:
        return "process"
    else:
        return "exit"

def exit_node(state: LoopState) -> LoopState:
    """退出节点"""
    return {**state, "accumulated": state["accumulated"] + ["完成"]}

# 构建图
graph = StateGraph(LoopState)

graph.add_node("initialize", initialize)
graph.add_node("process", process_loop)
graph.add_node("exit", exit_node)

graph.add_edge(START, "initialize")
graph.add_edge("initialize", "process")

# 循环：process -> check -> process 或 exit
graph.add_conditional_edges(
    "process",
    check_continue,
    {
        "process": "process",  # 继续循环
        "exit": "exit"         # 退出循环
    }
)

graph.add_edge("exit", END)
```

### 5.2 Do-While 循环

```python
# langgraph_do_while.py
from typing import TypedDict
from langgraph.graph import StateGraph, START

class DoWhileState(TypedDict):
    attempts: int
    max_attempts: int
    success: bool

def do_something(state: DoWhileState) -> DoWhileState:
    """执行操作"""
    return {
        "attempts": state["attempts"] + 1,
        "max_attempts": state["max_attempts"],
        "success": state["attempts"] >= 2  # 模拟：第3次才成功
    }

def check_success(state: DoWhileState) -> bool:
    """检查是否成功"""
    return not state["success"]

# 构建 Do-While 循环
graph = StateGraph(DoWhileState)

graph.add_node("do_something", do_something)

graph.add_edge(START, "do_something")

# 后置条件检查：先执行，再判断是否继续
graph.add_conditional_edges(
    "do_something",
    check_success,
    {
        True: "do_something",  # 继续循环
        False: END             # 完成
    }
)
```

## 六、Agent 执行流程

### 6.1 ReAct Agent 实现

```python
# langgraph_react_agent.py
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

# 工具定义
from langchain.agents import tool

@tool
def search_knowledge_base(query: str) -> str:
    """在知识库中搜索相关信息"""
    knowledge = {
        "python": "Python 是一种高级编程语言，支持多种编程范式",
        "javascript": "JavaScript 是一种脚本语言，主要用于 Web 开发",
        "rust": "Rust 是一种系统编程语言，注重安全和并发"
    }
    for key, value in knowledge.items():
        if key in query.lower():
            return value
    return "未找到相关信息"

@tool
def calculate(expression: str) -> str:
    """执行数学计算"""
    try:
        result = eval(expression)
        return str(result)
    except:
        return "计算错误"

tools = [search_knowledge_base, calculate]

# 状态定义
class AgentState(TypedDict):
    messages: list
    current_tool: str | None
    tool_result: str | None
    iteration: int

llm = ChatOpenAI(model="gpt-4")

SYSTEM_PROMPT = """你是一个 ReAct Agent。
在每一步中，你需要：
1. Thought：思考需要做什么
2. Action：选择要使用的工具（如果有）
3. Action Input：工具的输入
4. Observation：观察结果
5. 如果任务完成，说 Final Answer

可用工具：
- search_knowledge_base: 在知识库中搜索
- calculate: 执行数学计算
"""

def agent_node(state: AgentState) -> AgentState:
    """Agent 思考节点"""
    messages = state["messages"]

    # 添加系统提示（如果还没有）
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    # 调用 LLM
    response = llm.invoke(messages)

    return {
        **state,
        "messages": messages + [response],
        "iteration": state.get("iteration", 0) + 1
    }

def extract_action(state: AgentState) -> Literal["tool", "response", "max_iter"]:
    """从 LLM 响应中提取动作"""
    last_message = state["messages"][-1]

    # 检查是否超过最大迭代
    if state.get("iteration", 0) >= 10:
        return "max_iter"

    # 简单检查是否包含工具调用
    content = last_message.content.lower()

    if "final answer" in content:
        return "response"
    elif "search" in content or "calculate" in content:
        return "tool"
    else:
        return "response"

def tool_node(state: AgentState) -> AgentState:
    """执行工具"""
    last_message = state["messages"][-1]
    content = last_message.content

    # 解析工具调用
    if "search" in content.lower():
        tool_name = "search_knowledge_base"
        # 简单提取查询词
        query = content.split("search")[-1].split("calculate")[0].strip()
        tool_input = query.strip('"').strip("'")
    elif "calculate" in content.lower():
        tool_name = "calculate"
        import re
        match = re.search(r'\d+[\+\-\*/]\d+', content)
        tool_input = match.group() if match else "0"
    else:
        return {**state, "tool_result": "未识别工具"}

    # 调用工具
    if tool_name == "search_knowledge_base":
        result = search_knowledge_base.invoke(tool_input)
    else:
        result = calculate.invoke(tool_input)

    return {
        **state,
        "current_tool": tool_name,
        "tool_result": result,
        "messages": state["messages"] + [HumanMessage(content=f"工具结果: {result}")]
    }

def response_node(state: AgentState) -> AgentState:
    """最终响应"""
    return state

# 构建图
graph = StateGraph(AgentState)

graph.add_node("agent", agent_node)
graph.add_node("tool", tool_node)
graph.add_node("response", response_node)

graph.add_edge(START, "agent")

# 条件边
graph.add_conditional_edges(
    "agent",
    extract_action,
    {
        "tool": "tool",
        "response": "response",
        "max_iter": "response"
    }
)

# 工具执行后回到 agent
graph.add_edge("tool", "agent")
graph.add_edge("response", END)

# 编译图
react_graph = graph.compile()

# 执行
initial_state = {
    "messages": [HumanMessage(content="Python 是什么编程语言？用它做一个简单的加法计算：2+2")],
    "current_tool": None,
    "tool_result": None,
    "iteration": 0
}

result = react_graph.invoke(initial_state)
print("最终响应:", result["messages"][-1].content)
```

### 6.2 工具调用 Agent

```python
# langgraph_tool_agent.py
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.utils.function_calling import convert_to_openai_function
from langchain_openai import ChatOpenAI
import json

# 工具定义
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称"
                }
            },
            "required": ["city"]
        }
    },
    {
        "name": "get_news",
        "description": "获取最新新闻",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["tech", "business", "sports"]
                }
            }
        }
    }
]

class ToolAgentState(TypedDict):
    messages: Annotated[list, lambda a, b: a + b]
    tool_calls: list | None

llm = ChatOpenAI(model="gpt-4")

def call_llm(state: ToolAgentState) -> ToolAgentState:
    """调用 LLM"""
    response = llm.invoke(
        state["messages"],
        functions=tools
    )

    return {
        "messages": [response],
        "tool_calls": response.additional_kwargs.get("function_call")
    }

def route_tools(state: ToolAgentState) -> str:
    """路由到工具或结束"""
    if state.get("tool_calls"):
        return "execute_tools"
    return "respond"

def execute_tools(state: ToolAgentState) -> ToolAgentState:
    """执行工具"""
    tool_calls = state["tool_calls"]
    results = []

    for call in tool_calls:
        name = call["name"]
        args = json.loads(call["arguments"])

        if name == "get_weather":
            result = f"{args['city']}今天晴天，25度"
        elif name == "get_news":
            result = f"最新{args.get('category', 'general')}新闻：..."
        else:
            result = "未知工具"

        results.append({
            "name": name,
            "result": result
        })

    # 将工具结果添加到消息
    tool_result_msg = HumanMessage(
        content=json.dumps(results),
        name="tool"
    )

    return {
        "messages": [tool_result_msg],
        "tool_calls": None
    }

def respond(state: ToolAgentState) -> ToolAgentState:
    """最终响应"""
    return state

# 构建图
graph = StateGraph(ToolAgentState)

graph.add_node("llm", call_llm)
graph.add_node("execute_tools", execute_tools)
graph.add_node("respond", respond)

graph.add_edge(START, "llm")

graph.add_conditional_edges(
    "llm",
    route_tools,
    {
        "execute_tools": "execute_tools",
        "respond": "respond"
    }
)

graph.add_edge("execute_tools", "llm")  # 工具结果反馈给 LLM
graph.add_edge("respond", END)
```

## 七、多 Agent 协作

### 7.1 并行多 Agent

```python
# langgraph_multi_agent.py
from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from langgraph.constants import Send
from langchain_core.messages import HumanMessage, AIMessage

class MultiAgentState(TypedDict):
    task: str
    results: List[dict]
    final_response: str | None

def orchestrator(state: MultiAgentState) -> List[dict]:
    """编排器：分发任务给多个 Agent"""
    task = state["task"]

    # 将任务分解为多个子任务
    subtasks = [
        {"agent": "researcher", "query": f"{task}的技术细节"},
        {"agent": "analyst", "query": f"{task}的市场分析"},
        {"agent": "writer", "query": f"{task}的总结报告"}
    ]

    # 返回 Send 列表进行并行执行
    return [
        Send("researcher", {"query": s["query"]})
        for s in subtasks
    ] + [
        Send("analyst", {"query": s["query"]})
        for s in subtasks
    ] + [
        Send("writer", {"query": s["query"]})
        for s in subtasks
    ]

def researcher_node(state: dict) -> dict:
    """研究员 Agent"""
    return {
        "agent": "researcher",
        "query": state["query"],
        "result": "研究结果：技术细节分析完成"
    }

def analyst_node(state: dict) -> dict:
    """分析师 Agent"""
    return {
        "agent": "analyst",
        "query": state["query"],
        "result": "分析结果：市场趋势评估完成"
    }

def writer_node(state: dict) -> dict:
    """撰写员 Agent"""
    return {
        "agent": "writer",
        "query": state["query"],
        "result": "撰写结果：报告草稿完成"
    }

def aggregate(state: MultiAgentState, tasks: List[dict]) -> MultiAgentState:
    """聚合多个 Agent 的结果"""
    return {
        "task": state["task"],
        "results": tasks,
        "final_response": f"综合{tasks[0]['result']}、{tasks[1]['result']}和{tasks[2]['result']}"
    }

# 构建图
graph = StateGraph(MultiAgentState)

graph.add_node("orchestrator", orchestrator)
graph.add_node("researcher", researcher_node)
graph.add_node("analyst", analyst_node)
graph.add_node("writer", writer_node)
graph.add_node("aggregate", lambda state, tasks=None: {
    "results": tasks or [],
    "final_response": "报告完成"
})

graph.add_edge(START, "orchestrator")

# 并行分发
graph.add_conditional_edges(
    "orchestrator",
    lambda x: x,  # 返回的是 Send 列表
    ["researcher", "analyst", "writer"]
)

graph.add_edge("researcher", "aggregate")
graph.add_edge("analyst", "aggregate")
graph.add_edge("writer", "aggregate")
graph.add_edge("aggregate", END)
```

### 7.2 顺序多 Agent

```python
# langgraph_sequential_agents.py
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class SequentialAgentState(TypedDict):
    content: str
    stage: str
    output: dict

def writer_node(state: SequentialAgentState) -> SequentialAgentState:
    """写作 Agent"""
    return {
        "content": state["content"],
        "stage": "written",
        "output": {"content": f"初稿完成: {state['content']}"}
    }

def reviewer_node(state: SequentialAgentState) -> SequentialAgentState:
    """审核 Agent"""
    return {
        "content": state["content"],
        "stage": "reviewed",
        "output": {
            **state["output"],
            "review": "审核通过，建议发布"
        }
    }

def publisher_node(state: SequentialAgentState) -> SequentialAgentState:
    """发布 Agent"""
    return {
        "content": state["content"],
        "stage": "published",
        "output": {
            **state["output"],
            "url": "https://example.com/article/123"
        }
    }

# 构建顺序流程
graph = StateGraph(SequentialAgentState)

graph.add_node("writer", writer_node)
graph.add_node("reviewer", reviewer_node)
graph.add_node("publisher", publisher_node)

graph.add_edge(START, "writer")
graph.add_edge("writer", "reviewer")
graph.add_edge("reviewer", "publisher")
graph.add_edge("publisher", END)
```

## 八、状态持久化与恢复

### 8.1 检查点机制

```python
# langgraph_checkpoint.py
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict

class CheckpointState(TypedDict):
    value: int

def node_a(state: CheckpointState) -> CheckpointState:
    return {"value": state["value"] + 10}

def node_b(state: CheckpointState) -> CheckpointState:
    return {"value": state["value"] * 2}

# 创建带检查点的图
checkpointer = MemorySaver()

graph = StateGraph(CheckpointState)
graph.add_node("a", node_a)
graph.add_node("b", node_b)
graph.add_edge(START, "a")
graph.add_edge("a", "b")
graph.add_edge("b", END)

# 编译时添加检查点
compiled_graph = graph.compile(checkpointer=checkpointer)

# 首次执行
config = {"configurable": {"thread_id": "thread-1"}}
result = compiled_graph.invoke({"value": 5}, config)
print(f"第一次执行结果: {result}")  # value = (5 + 10) * 2 = 30

# 从检查点恢复并继续（模拟中断恢复）
# 创建一个新图实例，使用相同的检查点
new_graph = StateGraph(CheckpointState)
new_graph.add_node("a", node_a)
new_graph.add_node("b", node_b)
new_graph.add_edge(START, "a")
new_graph.add_edge("a", "b")
new_graph.add_edge("b", END)
new_compiled = new_graph.compile(checkpointer=checkpointer)

# 从检查点获取当前状态
current_state = new_compiled.get_state(config)
print(f"恢复的状态: {current_state}")  # 显示中断前的状态

# 继续执行
result = new_compiled.invoke(None, config)
print(f"继续执行结果: {result}")
```

### 8.2 外部存储检查点

```python
# langgraph_persistent_checkpoint.py
from langgraph.graph import StateGraph, START
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.postgres import PostgresSaver

# SQLite 检查点（轻量级）
sqlite_checkpointer = SqliteSaver.from_conn_string("./checkpoints.db")

# PostgreSQL 检查点（生产环境）
# postgres_checkpointer = PostgresSaver.from_conn_string(
#     "postgresql://user:pass@localhost:5432/langgraph"
# )

class PersistentState(TypedDict):
    conversation: list
    user_id: str

graph = StateGraph(PersistentState)
graph.add_node("process", lambda state: {
    "conversation": state["conversation"] + ["processed"],
    "user_id": state["user_id"]
})

compiled = graph.compile(checkpointer=sqlite_checkpointer)

# 持久化执行
config = {"configurable": {"thread_id": "session-123"}}
compiled.invoke(
    {"conversation": [], "user_id": "user1"},
    config
)

# 列出所有检查点
checkpoints = list(sqlite_checkpointer.list_keys(config))
print(f"可用检查点: {checkpoints}")
```

## 九、实战项目：客服工作流

```python
# langgraph_customer_service.py
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

# 状态定义
class CustomerServiceState(TypedDict):
    messages: list
    customer_id: str
    intent: str | None
    order_id: str | None
    resolution: str | None
    iteration: int

# LLM 初始化
llm = ChatOpenAI(model="gpt-4")

# 意图分类提示词
INTENT_PROMPT = """分析客户消息的意图，分类为以下之一：
- order_status：查询订单状态
- refund：申请退款
- complaint：投诉
- consultation：产品咨询
- other：其他

只输出分类名称。"""

# 工具函数
def get_order_status(order_id: str) -> str:
    """模拟获取订单状态"""
    orders = {
        "12345": {"status": "已发货", "eta": "2024-01-20"},
        "12346": {"status": "处理中", "eta": "2024-01-25"}
    }
    return str(orders.get(order_id, "未找到订单"))

def process_refund(order_id: str) -> str:
    """模拟处理退款"""
    return f"已为订单 {order_id} 发起退款，预计3-5个工作日到账"

# 节点定义
def classify_intent(state: CustomerServiceState) -> CustomerServiceState:
    """意图分类"""
    last_msg = state["messages"][-1].content

    response = llm.invoke([
        SystemMessage(content=INTENT_PROMPT),
        HumanMessage(content=last_msg)
    ])

    intent = response.content.strip().lower()

    # 尝试提取订单号
    order_id = None
    for msg in state["messages"]:
        if "订单" in msg.content:
            import re
            match = re.search(r"\d{5}", msg.content)
            if match:
                order_id = match.group()

    return {
        **state,
        "intent": intent,
        "order_id": order_id
    }

def handle_order_status(state: CustomerServiceState) -> CustomerServiceState:
    """处理订单查询"""
    if state["order_id"]:
        status = get_order_status(state["order_id"])
        response = f"您的订单 {state['order_id']} 状态：{status}"
    else:
        response = "请提供您的订单号"

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=response)],
        "resolution": "answered"
    }

def handle_refund(state: CustomerServiceState) -> CustomerServiceState:
    """处理退款"""
    if state["order_id"]:
        result = process_refund(state["order_id"])
        response = result
    else:
        response = "请提供需要退款的订单号"

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=response)],
        "resolution": "refund_initiated" if state["order_id"] else "pending_info"
    }

def handle_complaint(state: CustomerServiceState) -> CustomerServiceState:
    """处理投诉"""
    response = """非常抱歉给您带来不好的体验。
您的反馈我们已经记录，会尽快处理并改进。
我们的客服主管稍后会联系您了解详情。"""

    return {
        **state,
        "messages": state["messages"] + [AIMessage(content=response)],
        "resolution": "complaint_logged"
    }

def handle_consultation(state: CustomerServiceState) -> CustomerServiceState:
    """处理咨询"""
    response = llm.invoke(
        state["messages"] + [AIMessage(content="请提供您想咨询的产品问题")]
    )

    return {
        **state,
        "messages": state["messages"] + [response],
        "resolution": "consultation_provided"
    }

def route_intent(state: CustomerServiceState) -> str:
    """根据意图路由"""
    return state.get("intent", "other")

def check_resolved(state: CustomerServiceState) -> bool:
    """检查是否已解决"""
    return state.get("resolution") in ["answered", "refund_initiated", "complaint_logged"]

def escalate(state: CustomerServiceState) -> CustomerServiceState:
    """升级处理"""
    return {
        **state,
        "messages": state["messages"] + [AIMessage(
            content="您的问题需要进一步处理，已转接给专员。"
        )]
    }

# 构建图
graph = StateGraph(CustomerServiceState)

graph.add_node("classify", classify_intent)
graph.add_node("order_status", handle_order_status)
graph.add_node("refund", handle_refund)
graph.add_node("complaint", handle_complaint)
graph.add_node("consultation", handle_consultation)
graph.add_node("escalate", escalate)

graph.add_edge(START, "classify")

# 意图路由
graph.add_conditional_edges(
    "classify",
    route_intent,
    {
        "order_status": "order_status",
        "refund": "refund",
        "complaint": "complaint",
        "consultation": "consultation",
        "other": "escalate"
    }
)

# 完成后检查是否解决
graph.add_conditional_edges(
    "order_status",
    check_resolved,
    {True: END, False: "escalate"}
)

graph.add_conditional_edges(
    "refund",
    check_resolved,
    {True: END, False: "escalate"}
)

graph.add_conditional_edges(
    "complaint",
    check_resolved,
    {True: END, False: "escalate"}
)

graph.add_conditional_edges(
    "consultation",
    check_resolved,
    {True: END, False: "escalate"}
)

graph.add_edge("escalate", END)

# 编译
customer_service = graph.compile()

# 执行示例
initial_state = {
    "messages": [HumanMessage(content="我想查询订单12345的状态")],
    "customer_id": "cust_001",
    "intent": None,
    "order_id": None,
    "resolution": None,
    "iteration": 0
}

result = customer_service.invoke(initial_state)
print("最终消息:", result["messages"][-1].content)
print("意图:", result["intent"])
print("解决状态:", result["resolution"])
```

## 十、总结

LangGraph 核心概念：

| 概念 | 说明 | 关键 API |
|------|------|----------|
| **State** | 图的共享状态，TypedDict 定义 | `StateGraph` |
| **Node** | 状态转换函数，接收状态返回更新 | `add_node()` |
| **Edge** | 节点间的连接，普通边或条件边 | `add_edge()`, `add_conditional_edges()` |
| **Checkpointer** | 状态持久化和恢复 | `MemorySaver`, `SqliteSaver` |

### 高级特性

```
┌─────────────────────────────────────────────────────────────────┐
│                      LangGraph 高级特性                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 循环计算                                                     │
│     - while_loop：前置条件判断                                   │
│     - do_while：后置条件判断                                     │
│                                                                 │
│  2. 条件分支                                                     │
│     - 单一条件：二分支                                           │
│     - 多条件：多分支路由                                         │
│     - 分支合并：parallel + aggregate                            │
│                                                                 │
│  3. 多 Agent 协作                                               │
│     - 顺序：依次执行                                             │
│     - 并行：同时执行                                             │
│     - 层次：编排器 + 子 Agent                                    │
│                                                                 │
│  4. 状态持久化                                                   │
│     - MemorySaver：内存检查点                                    │
│     - SqliteSaver：本地文件存储                                  │
│     - PostgresSaver：数据库存储                                   │
│                                                                 │
│  5. 错误处理                                                     │
│     - 节点级别重试                                               │
│     - 流程级别异常处理                                           │
│     - 中断恢复                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 与 LangChain Chain 的区别

| 特性 | LangChain Chain | LangGraph |
|------|-----------------|-----------|
| **结构** | 线性 | 图结构 |
| **循环** | 不支持 | 支持 |
| **条件分支** | 简单 RouterChain | 丰富的条件边 |
| **状态管理** | 外部 Memory | 内置 State |
| **多步推理** | 有限 | 完全支持 |
| **适用场景** | 简单流程 | 复杂工作流 |
