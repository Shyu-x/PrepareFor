# Agent基础架构设计

## 一、Agent核心概念定义

### 1.1 什么是Agent

**Agent（智能体）**是一种能够感知环境、做出决策并执行动作的智能系统。在AI领域，Agent通常指基于大语言模型（LLM）的智能系统，它能够：

- **感知**：通过工具调用获取外部信息
- **思考**：利用LLM的推理能力分析问题
- **行动**：执行具体操作达成目标
- **学习**：从交互经验中不断优化

```
┌─────────────────────────────────────────────────────────┐
│                      Agent 核心架构                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────┐    ┌──────────┐    ┌─────────────────┐  │
│    │ 感知层  │───▶│ 规划器   │───▶│ 工具执行层      │  │
│    │Perception│    │Planner   │    │Tool Execution   │  │
│    └─────────┘    └──────────┘    └─────────────────┘  │
│         │              │                   │            │
│         ▼              ▼                   ▼            │
│    ┌─────────────────────────────────────────────┐     │
│    │              记忆系统 Memory                  │     │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │     │
│    │  │工作记忆  │ │短期记忆 │ │长期记忆     │   │     │
│    │  │Working  │ │Episodic │ │Semantic     │   │     │
│    │  └─────────┘ └─────────┘ └─────────────┘   │     │
│    └─────────────────────────────────────────────┘     │
│                         │                              │
│                         ▼                              │
│    ┌─────────────────────────────────────────────┐     │
│    │              决策与控制层                     │     │
│    │         Decision & Control                   │     │
│    └─────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Agent与传统程序的区别

| 特性 | 传统程序 | Agent |
|------|---------|-------|
| 决策方式 | 预设规则 | 动态推理 |
| 适应能力 | 固定逻辑 | 上下文感知 |
| 交互方式 | 确定输出 | 概率推理 |
| 错误处理 | try-catch | 自我反思修正 |
| 扩展方式 | 代码修改 | Prompt调整 |

## 二、Agent核心模块划分

### 2.1 规划器（Planner）

**规划器**是Agent的"大脑"，负责将复杂任务分解为可执行的子步骤。

```python
# 规划器核心实现
class Planner:
    """
    Agent规划器模块
    负责任务分解、步骤排序、执行计划生成
    """

    def __init__(self, llm):
        # LLM推理引擎，用于分解任务
        self.llm = llm
        # 任务历史，记录已规划的任务
        self.task_history = []

    def decompose_task(self, task: str, context: dict) -> list[Step]:
        """
        将复杂任务分解为可执行的步骤

        Args:
            task: 用户输入的复杂任务
            context: 当前上下文信息

        Returns:
            分解后的步骤列表
        """
        # 构建分解提示词
        prompt = f"""
        你是一个任务规划专家。请将以下任务分解为可执行的步骤：

        任务：{task}

        上下文：
        - 当前时间：{context.get('time', '未知')}
        - 可用资源：{context.get('resources', [])}
        - 约束条件：{context.get('constraints', [])}

        请按以下JSON格式输出：
        {{
            "steps": [
                {{"id": 1, "description": "步骤描述", "tool": "需要的工具"}},
                ...
            ],
            "estimated_time": "预估时间",
            "potential_risks": ["潜在风险1", "潜在风险2"]
        }}
        """

        # 调用LLM进行任务分解
        response = self.llm.complete(prompt)

        # 解析并返回步骤列表
        return self._parse_steps(response)

    def _parse_steps(self, response: str) -> list[Step]:
        """解析LLM响应，提取步骤列表"""
        # 实现JSON解析逻辑
        import json
        data = json.loads(response)
        return [Step(**s) for s in data['steps']]

    def replan(self, failed_step: Step, error: Exception) -> list[Step]:
        """
        当步骤执行失败时，重新规划

        Args:
            failed_step: 失败的步骤
            error: 错误信息

        Returns:
            调整后的步骤列表
        """
        prompt = f"""
        任务执行遇到问题，需要重新规划：

        失败的步骤：{failed_step.description}
        错误信息：{str(error)}

        请分析失败原因并给出调整后的执行计划。
        """

        response = self.llm.complete(prompt)
        return self._parse_steps(response)
```

### 2.2 执行器（Executor）

**执行器**负责调用外部工具完成具体任务。

```python
# 执行器核心实现
class Executor:
    """
    Agent执行器模块
    负责工具调用、结果处理、错误恢复
    """

    def __init__(self, tools: list[Tool]):
        # 注册的工具列表
        self.tools = {tool.name: tool for tool in tools}
        # 执行上下文
        self.context = {}
        # 重试计数器
        self.retry_counts = {}

    def execute(self, step: Step) -> ExecutionResult:
        """
        执行单个步骤

        Args:
            step: 要执行的步骤

        Returns:
            执行结果
        """
        tool_name = step.tool
        tool = self.tools.get(tool_name)

        if not tool:
            return ExecutionResult(
                success=False,
                error=f"未找到工具: {tool_name}"
            )

        # 准备工具参数
        params = self._prepare_params(step, tool)

        # 执行并处理结果
        try:
            result = tool.execute(**params)
            return ExecutionResult(success=True, data=result)

        except ValidationError as e:
            # 参数验证错误，不重试
            return ExecutionResult(success=False, error=str(e))

        except RetryableError as e:
            # 可重试错误，触发重试逻辑
            return self._handle_retry(step, e)

        except Exception as e:
            # 未知错误
            return ExecutionResult(success=False, error=str(e))

    def _prepare_params(self, step: Step, tool: Tool) -> dict:
        """准备工具执行参数"""
        # 从步骤描述中提取参数
        params = step.parameters or {}

        # 验证必需参数
        for required in tool.required_params:
            if required not in params:
                raise ValidationError(f"缺少必需参数: {required}")

        return params

    def _handle_retry(self, step: Step, error: RetryableError) -> ExecutionResult:
        """处理可重试错误"""
        max_retries = 3
        current = self.retry_counts.get(step.id, 0)

        if current < max_retries:
            self.retry_counts[step.id] = current + 1
            # 指数退避等待
            import time
            time.sleep(2 ** current)
            return self.execute(step)
        else:
            return ExecutionResult(
                success=False,
                error=f"重试次数耗尽: {str(error)}"
            )
```

### 2.3 记忆系统（Memory）

记忆系统是Agent的核心组件，详见第四章专项讲解。

### 2.4 工具系统（Tools）

```python
# 工具基类定义
from abc import ABC, abstractmethod
from typing import Any, TypedDict

class Tool(ABC):
    """
    工具基类
    所有Agent工具都应继承此类
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.required_params = []

    @abstractmethod
    def execute(self, **kwargs) -> Any:
        """执行工具逻辑，子类必须实现"""
        pass

    def validate(self, params: dict) -> bool:
        """验证参数是否合法"""
        for param in self.required_params:
            if param not in params:
                return False
        return True

    def get_schema(self) -> dict:
        """返回工具的JSON Schema，用于Function Calling"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": self._get_param_schemas(),
                "required": self.required_params
            }
        }


# 具体工具实现示例
class FileReadTool(Tool):
    """
    文件读取工具
    用于读取指定路径的文件内容
    """

    def __init__(self):
        super().__init__(
            name="read_file",
            description="读取指定路径的文件内容"
        )
        self.required_params = ["path"]

    def execute(self, path: str, encoding: str = "utf-8") -> str:
        """
        读取文件内容

        Args:
            path: 文件路径
            encoding: 文件编码，默认utf-8

        Returns:
            文件内容
        """
        # 安全检查：防止路径遍历攻击
        import os
        real_path = os.path.realpath(path)

        # 检查文件是否存在
        if not os.path.exists(real_path):
            raise FileNotFoundError(f"文件不存在: {path}")

        # 读取并返回内容
        with open(real_path, 'r', encoding=encoding) as f:
            return f.read()

    def _get_param_schemas(self) -> dict:
        """返回参数schema"""
        return {
            "path": {
                "type": "string",
                "description": "要读取的文件路径"
            },
            "encoding": {
                "type": "string",
                "description": "文件编码，默认utf-8"
            }
        }
```

## 三、工具设计原则

### 3.1 工具设计七大原则

```
┌─────────────────────────────────────────────────────────┐
│                 工具设计七大原则                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  原则1: 单一职责                                          │
│  每个工具只做一件事，功能内聚                             │
│                                                         │
│  原则2: 接口清晰                                          │
│  参数名语义化，返回值结构化                               │
│                                                         │
│  原则3: 错误可控                                          │
│  可恢复错误可重试，不可恢复错误明确告知                    │
│                                                         │
│  原则4: 安全第一                                          │
│  输入验证、权限控制、审计日志                             │
│                                                         │
│  原则5: 可观测                                            │
│  执行耗时、成功率、错误类型可监控                         │
│                                                         │
│  原则6:幂等设计                                          │
│  相同参数多次执行结果一致                                 │
│                                                         │
│  原则7: 超时保护                                          │
│  设置合理超时，防止无限等待                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 工具分类与示例

```python
# 工具分类体系
class ToolCategory(Enum):
    """工具分类枚举"""
    # 信息获取类
    SEARCH = "search"           # 搜索工具
    READ = "read"              # 读取工具
    QUERY = "query"            # 查询工具

    # 信息操作类
    WRITE = "write"            # 写入工具
    UPDATE = "update"          # 更新工具
    DELETE = "delete"          # 删除工具

    # 计算执行类
    CODE = "code"              # 代码执行
    CALCULATE = "calculate"    # 计算工具

    # 通信类
    SEND = "send"              # 发送工具
    RECEIVE = "receive"        # 接收工具

    # 系统类
    SHELL = "shell"            # Shell命令
    FILE = "file"              # 文件操作


# 常用工具工厂
class ToolFactory:
    """工具工厂，用于创建和管理工具"""

    @staticmethod
    def create_search_tool(provider: str = "web") -> Tool:
        """创建搜索工具"""
        if provider == "web":
            return WebSearchTool()
        elif provider == "file":
            return FileSearchTool()
        else:
            raise ValueError(f"不支持的搜索提供者: {provider}")

    @staticmethod
    def create_code_tool(language: str) -> Tool:
        """创建代码执行工具"""
        return CodeExecutionTool(language=language)

    @staticmethod
    def create_file_tool(operation: str) -> Tool:
        """创建文件操作工具"""
        operations = {
            "read": FileReadTool(),
            "write": FileWriteTool(),
            "list": FileListTool(),
            "delete": FileDeleteTool()
        }
        return operations.get(operation, FileReadTool())
```

## 四、Agent循环控制

### 4.1 何时结束判断

**这是面试常考问题：Agent怎么知道某轮tool call后该不该结束？**

```python
class AgentLoopController:
    """
    Agent循环控制器
    负责判断Agent何时应该结束当前任务
    """

    def __init__(self, max_iterations: int = 50):
        self.max_iterations = max_iterations
        self.iteration_count = 0

    def should_continue(
        self,
        agent_state: AgentState,
        step_result: StepResult
    ) -> tuple[bool, str]:
        """
        判断是否继续执行循环

        返回:
            (是否继续, 原因描述)
        """
        self.iteration_count += 1

        # 检查点1: 达到最大迭代次数
        if self.iteration_count >= self.max_iterations:
            return False, f"达到最大迭代次数: {self.max_iterations}"

        # 检查点2: 任务已完成
        if step_result.completed:
            return False, "任务已完成"

        # 检查点3: 用户明确终止
        if agent_state.user_halt_requested:
            return False, "用户主动终止"

        # 检查点4: 连续失败次数过多
        if step_result.consecutive_failures > 3:
            return False, "连续失败次数过多"

        # 检查点5: 资源耗尽
        if self._check_resource_exhaustion(agent_state):
            return False, "资源耗尽"

        # 检查点6: LLM判断应该结束
        llm_decision = self._llm_stop_decision(agent_state)
        if llm_decision == "stop":
            return False, "LLM判断应结束任务"

        return True, "继续执行"

    def _llm_stop_decision(self, state: AgentState) -> str:
        """
        让LLM判断是否应该停止

        通过结构化输出，让LLM返回stop/continue/uncertain
        """
        prompt = f"""
        基于当前状态，判断是否应该继续执行任务：

        任务目标：{state.task_objective}
        当前步骤：{state.current_step}
        已完成步骤：{state.completed_steps}
        最近执行结果：{state.last_result}

        请判断：
        - 如果任务已完成或无法完成，返回 "stop"
        - 如果需要继续执行更多步骤，返回 "continue"
        - 如果不确定，返回 "uncertain"
        """

        response = self.llm.complete(prompt)

        # 解析LLM响应
        if "stop" in response.lower():
            return "stop"
        elif "continue" in response.lower():
            return "continue"
        return "uncertain"

    def _check_resource_exhaustion(self, state: AgentState) -> bool:
        """检查资源是否耗尽"""
        # 检查Token使用量
        if state.total_tokens_used > state.max_tokens:
            return True

        # 检查执行时间
        import time
        elapsed = time.time() - state.start_time
        if elapsed > state.max_execution_time:
            return True

        return False


@dataclass
class AgentState:
    """Agent状态数据类"""
    task_objective: str           # 任务目标
    current_step: int            # 当前步骤编号
    completed_steps: list[int]    # 已完成步骤列表
    last_result: str             # 最近执行结果
    total_tokens_used: int       # 已使用Token数
    max_tokens: int             # 最大Token限制
    start_time: float           # 开始时间
    max_execution_time: float    # 最大执行时间
    user_halt_requested: bool    # 用户是否请求终止
    consecutive_failures: int    # 连续失败次数
```

### 4.2 状态机与决策树

```python
class AgentStateMachine:
    """
    Agent状态机
    管理Agent的生命周期和状态转换
    """

    class State(Enum):
        """Agent状态枚举"""
        IDLE = "idle"              # 空闲状态
        PLANNING = "planning"     # 规划中
        EXECUTING = "executing"   # 执行中
        WAITING = "waiting"       # 等待中（等待工具返回）
        REVIEWING = "reviewing"   # 回顾/反思中
        COMPLETED = "completed"   # 已完成
        FAILED = "failed"         # 失败
        HALTED = "halted"         # 被终止

    def __init__(self):
        self.current_state = self.State.IDLE
        self.state_history = [self.State.IDLE]
        # 状态转换规则
        self.transitions = {
            self.State.IDLE: [self.State.PLANNING],
            self.State.PLANNING: [self.State.EXECUTING, self.State.FAILED],
            self.State.EXECUTING: [self.State.WAITING, self.State.REVIEWING, self.State.FAILED],
            self.State.WAITING: [self.State.EXECUTING, self.State.FAILED],
            self.State.REVIEWING: [self.State.EXECUTING, self.State.COMPLETED, self.State.PLANNING],
            self.State.COMPLETED: [self.State.IDLE],
            self.State.FAILED: [self.State.PLANNING, self.State.HALTED],
            self.State.HALTED: [self.State.IDLE]
        }

    def transition(self, new_state: State) -> bool:
        """
        状态转换

        Args:
            new_state: 目标状态

        Returns:
            是否转换成功
        """
        if new_state in self.transitions[self.current_state]:
            self.current_state = new_state
            self.state_history.append(new_state)
            return True
        return False

    def can_transition(self, new_state: State) -> bool:
        """检查是否可以转换到目标状态"""
        return new_state in self.transitions[self.current_state]
```

```
┌─────────────────────────────────────────────────────────┐
│                 Agent状态转换图                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         ┌──────────┐                                    │
│         │  IDLE    │◀──────────────────────┐           │
│         │  空闲    │                       │           │
│         └────┬─────┘                       │           │
│              │ 用户发起任务                 │           │
│              ▼                             │           │
│         ┌──────────┐                       │           │
│         │ PLANNING │                       │           │
│         │  规划中  │───────────────────────┤           │
│         └────┬─────┘ 规划完成               │           │
│              │                             │           │
│              ▼                             │           │
│         ┌──────────┐                       │           │
│    ┌───▶│ EXECUTING│◀──────────────────┐  │           │
│    │    │  执行中  │  新任务/重新规划   │  │           │
│    │    └────┬─────┘                    │  │           │
│    │         │ 需要等待工具              │  │           │
│    │         ▼                           │  │           │
│    │    ┌──────────┐                     │  │           │
│    │    │ WAITING  │────────────────────┘  │           │
│    │    │  等待中  │                      │           │
│    │    └──────────┘                      │           │
│    │         │                             │           │
│    │         ▼ 工具返回                     │           │
│    │    ┌──────────┐                      │           │
│    │    │ REVIEWING│                      │           │
│    │    │  回顾中  │                      │           │
│    │    └────┬─────┘                      │           │
│    │         │                            │           │
│    │    ┌────┴────┐                       │           │
│    │    │         │                       │           │
│    │    ▼         ▼                       │           │
│    │ COMPLETED  PLANNING                   │           │
│    │  已完成     重新规划                   │           │
│    │    ▲                                │           │
│    │    │                                │           │
│    └────┴────────────── FAILED ◀─────────┘           │
│                              │                        │
│                              ▼                        │
│                         ┌──────────┐                   │
│                         │  HALTED  │                   │
│                         │  已终止  │                   │
│                         └──────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 五、深度代码示例：完整Agent实现

### 5.1 主Agent循环

```python
import asyncio
from dataclasses import dataclass, field
from typing import Optional, Callable
from enum import Enum

class Agent:
    """
    完整Agent实现
    整合规划器、执行器、记忆系统和工具系统
    """

    def __init__(
        self,
        llm: LLM,
        tools: list[Tool],
        max_iterations: int = 50,
        callback: Optional[Callable] = None
    ):
        # 核心组件初始化
        self.llm = llm
        self.planner = Planner(llm)
        self.executor = Executor(tools)
        self.loop_controller = AgentLoopController(max_iterations)
        self.state_machine = AgentStateMachine()
        self.memory = AgentMemory()

        # 回调函数
        self.callback = callback

        # 当前任务上下文
        self.current_task: Optional[Task] = None
        self.current_steps: list[Step] = []
        self.step_results: list[StepResult] = []

    async def run(self, task_description: str) -> AgentResult:
        """
        运行Agent处理任务

        Args:
            task_description: 任务描述

        Returns:
            Agent执行结果
        """
        # 步骤1: 初始化任务
        self.current_task = Task(description=task_description)
        self.state_machine.transition(self.StateMachine.State.PLANNING)

        try:
            # 步骤2: 任务规划
            self.current_steps = await self._plan_task(task_description)

            # 步骤3: 执行循环
            result = await self._execution_loop()

            # 步骤4: 保存执行记录
            await self._save_execution_record(result)

            return result

        except Exception as e:
            return AgentResult(
                success=False,
                error=str(e),
                steps_completed=len(self.step_results)
            )
        finally:
            self.state_machine.transition(self.StateMachine.State.IDLE)

    async def _plan_task(self, task_description: str) -> list[Step]:
        """任务规划阶段"""
        self.state_machine.transition(self.StateMachine.State.PLANNING)

        # 获取相关记忆
        relevant_memory = await self.memory.retrieve(task_description)

        # 构建上下文
        context = {
            "time": self._get_current_time(),
            "relevant_experience": relevant_memory,
            "constraints": self.current_task.constraints
        }

        # 调用规划器分解任务
        steps = self.planner.decompose_task(task_description, context)

        return steps

    async def _execution_loop(self) -> AgentResult:
        """
        执行循环

        核心循环：
        1. 获取下一个步骤
        2. 执行步骤
        3. 检查结果
        4. 决定是否继续
        """
        self.state_machine.transition(self.StateMachine.State.EXECUTING)

        while True:
            # 获取下一个待执行步骤
            next_step = self._get_next_step()
            if next_step is None:
                # 所有步骤都已完成
                self.state_machine.transition(self.StateMachine.State.COMPLETED)
                return AgentResult(
                    success=True,
                    message="任务完成",
                    steps_completed=len(self.step_results),
                    all_results=self.step_results
                )

            # 执行当前步骤
            self.state_machine.transition(self.StateMachine.State.EXECUTING)
            step_result = await self._execute_step(next_step)
            self.step_results.append(step_result)

            # 回调通知
            if self.callback:
                self.callback("step_completed", step_result)

            # 检查是否应该继续
            should_continue, reason = self.loop_controller.should_continue(
                agent_state=self._build_agent_state(),
                step_result=step_result
            )

            if not should_continue:
                return AgentResult(
                    success=step_result.completed,
                    message=reason,
                    steps_completed=len(self.step_results),
                    all_results=self.step_results
                )

            # 如果步骤失败，尝试重新规划
            if not step_result.success:
                self.state_machine.transition(self.StateMachine.State.REVIEWING)
                new_steps = await self._handle_step_failure(next_step, step_result)
                if new_steps:
                    self.current_steps.extend(new_steps)

    async def _execute_step(self, step: Step) -> StepResult:
        """执行单个步骤"""
        try:
            result = self.executor.execute(step)

            return StepResult(
                step_id=step.id,
                success=True,
                data=result.data,
                error=None
            )
        except Exception as e:
            return StepResult(
                step_id=step.id,
                success=False,
                data=None,
                error=str(e)
            )

    async def _handle_step_failure(
        self,
        failed_step: Step,
        result: StepResult
    ) -> list[Step]:
        """处理步骤失败，尝试重新规划"""
        # 获取错误类型
        error_type = self._classify_error(result.error)

        if error_type == "retryable":
            # 可重试错误，直接返回空，让循环重试
            return []
        elif error_type == "fixable":
            # 可修复错误，尝试重新规划这个步骤
            return self.planner.replan(failed_step, result.error)
        else:
            # 不可恢复错误，抛出异常
            raise ExecutionError(f"步骤执行失败: {result.error}")

    def _get_next_step(self) -> Optional[Step]:
        """获取下一个待执行的步骤"""
        completed_ids = {r.step_id for r in self.step_results}
        for step in self.current_steps:
            if step.id not in completed_ids:
                return step
        return None

    def _build_agent_state(self) -> AgentState:
        """构建当前Agent状态"""
        return AgentState(
            task_objective=self.current_task.description,
            current_step=len(self.step_results),
            completed_steps=[r.step_id for r in self.step_results],
            last_result=self.step_results[-1].data if self.step_results else None,
            total_tokens_used=self.llm.total_tokens,
            max_tokens=self.llm.max_tokens,
            start_time=self.current_task.start_time,
            max_execution_time=self.current_task.max_time,
            user_halt_requested=False,
            consecutive_failures=self._count_consecutive_failures()
        )

    def _count_consecutive_failures(self) -> int:
        """计算连续失败次数"""
        count = 0
        for result in reversed(self.step_results):
            if result.success:
                break
            count += 1
        return count

    def _classify_error(self, error: str) -> str:
        """分类错误类型"""
        retryable_keywords = ["timeout", "network", "temporary"]
        fixable_keywords = ["invalid", "not found", "missing"]

        if any(k in error.lower() for k in retryable_keywords):
            return "retryable"
        elif any(k in error.lower() for k in fixable_keywords):
            return "fixable"
        return "fatal"


# 数据类定义
@dataclass
class Task:
    """任务数据类"""
    description: str
    constraints: dict = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)
    max_time: float = 3600  # 默认最大1小时


@dataclass
class StepResult:
    """步骤执行结果"""
    step_id: int
    success: bool
    data: Any
    error: Optional[str]
    completed: bool = False


@dataclass
class AgentResult:
    """Agent执行结果"""
    success: bool
    message: str
    steps_completed: int
    all_results: list[StepResult] = field(default_factory=list)
    error: Optional[str] = None
```

## 六、面试高频问题

### 问题1: 为什么用MCP？MCP有哪些好处？

**参考答案**：

MCP（Model Context Protocol）是由Anthropic推出的开放标准协议，类似于AI领域的"USB-C接口"。

**核心好处**：

1. **标准化集成**
   - 统一的工具调用协议
   - 一次开发，多模型复用
   - 跨厂商兼容（OpenAI、Anthropic等）

2. **安全隔离**
   - MCP Server在独立进程中运行
   - 清晰的安全边界
   - 资源访问权限精确控制

3. **生态丰富**
   - 社区驱动的工具生态
   - 预置工具覆盖常见场景
   - 易于扩展和贡献

4. **开发效率**
   - 声明式工具定义
   - 自动生成客户端代码
   - 调试工具完善

### 问题2: Agent怎么知道某轮tool call后该不该结束？

**参考答案**：

Agent通过多层判断机制决定是否结束：

1. **显式检查点**
   - 达到最大迭代次数
   - 用户主动终止请求
   - 资源耗尽（时间/Token）

2. **任务完成检测**
   - 检查任务目标是否达成
   - 验证输出是否符合预期

3. **LLM自我评估**
   - 让LLM判断任务是否完成
   - 结构化输出（stop/continue/uncertain）

4. **异常处理触发**
   - 连续失败次数过多
   - 不可恢复错误发生

### 问题3: 如果一轮tool call返回结果非常多，怎么设计？

**参考答案**：

1. **流式处理**
   - 使用流式输出，边接收边处理
   - 避免内存峰值

2. **结果分页**
   - 大结果分批次返回
   - 支持断点续传

3. **智能摘要**
   - 对大结果进行摘要
   - 按需展开详情

4. **选择性获取**
   - 返回元数据而非全量
   - 支持按ID/条件查询

```python
class StreamingResultHandler:
    """流式结果处理器"""

    def __init__(self, max_chunk_size: int = 4000):
        self.max_chunk_size = max_chunk_size
        self.buffer = []

    async def handle_streaming_result(self, tool_call_id: str, chunks: AsyncIterator[str]):
        """处理流式返回的大结果"""
        full_result = []

        async for chunk in chunks:
            full_result.append(chunk)

            # 达到分块大小时，触发处理
            if sum(len(c) for c in full_result) >= self.max_chunk_size:
                await self._process_chunk(full_result)
                full_result = []

        # 处理剩余内容
        if full_result:
            await self._process_chunk(full_result)

    async def _process_chunk(self, chunk: list[str]):
        """处理单个分块"""
        combined = "".join(chunk)

        # 生成摘要
        summary = await self._generate_summary(combined)

        # 存入记忆系统
        await self.memory.store(f"chunk_{id}", {
            "summary": summary,
            "full_content": combined,
            "token_count": len(combined)
        })
```

## 本章小结

1. **Agent核心模块**：规划器、执行器、记忆系统、工具系统
2. **工具设计原则**：单一职责、接口清晰、安全可控
3. **循环控制**：状态机 + 终止条件判断
4. **架构要点**：模块解耦、错误恢复、可扩展性

## 思考题

1. 如何设计一个能够处理多轮对话上下文的Agent？
2. 如果工具执行时间很长，Agent如何优雅地处理超时？
3. 如何实现Agent的自我学习和能力提升机制？
