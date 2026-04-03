# Claude Code 架构解析

## 概述

Claude Code是Anthropic推出的命令行编程助手，基于Claude模型构建，专门用于辅助开发者完成编程任务。本文档深入解析其架构设计，为Agent开发提供参考。

## Claude Code 架构分析

### 1. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                      │
│                   (命令行入口层)                          │
├─────────────────────────────────────────────────────────┤
│                      Core Engine                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Planner   │  │   Executor  │  │   Tool Manager  │  │
│  │   (规划器)  │  │   (执行器)  │  │    (工具管理)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                      MCP Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Read    │  │  Write   │  │  Bash    │  │  Grep   │  │
│  │  Tool    │  │  Tool    │  │  Tool    │  │  Tool   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
├─────────────────────────────────────────────────────────┤
│                   Anthropic API                          │
│              (Claude 模型通信层)                          │
└─────────────────────────────────────────────────────────┘
```

### 2. 核心组件

Claude Code采用模块化设计，主要组件包括：

| 组件 | 职责 |
|------|------|
| **CLI入口** | 命令行参数解析、用户交互 |
| **Planner** | 任务分解、步骤规划 |
| **Executor** | 工具调用协调、执行流程控制 |
| **Tool Manager** | 工具注册、调用、结果处理 |
| **MCP Server** | 外部工具协议支持 |

### 3. 消息流程

```typescript
// Claude Code 消息处理流程
class ClaudeCodeCore {
  async processMessage(userInput: string): Promise<void> {
    // 1. 解析用户意图
    const intent = this.parseIntent(userInput);

    // 2. 构建系统Prompt
    const systemPrompt = this.buildSystemPrompt();

    // 3. 构建消息历史
    const messages = await this.buildMessageHistory(
      systemPrompt,
      intent
    );

    // 4. 调用Claude模型
    const response = await this.callClaude(messages);

    // 5. 处理响应（可能包含工具调用）
    await this.handleResponse(response);

    // 6. 格式化输出
    this.formatOutput(response);
  }

  private async handleResponse(
    response: ClaudeResponse
  ): Promise<void> {
    // 检查是否有工具调用
    if (response.content?.type === 'tool_use') {
      // 执行工具调用
      for (const tool of response.content.tool_use) {
        const result = await this.toolManager.execute(tool);
        // 将结果添加回消息历史
        await this.addToolResult(tool.id, result);
      }

      // 递归处理直到没有工具调用
      await this.processMessage('');  // 继续处理
    }
  }
}
```

## Tool Use 机制

### 1. 工具调用接口

Claude Code通过Tool Use机制扩展模型能力：

```typescript
// 工具定义格式
interface ToolDefinition {
  name: string;              // 工具唯一标识
  description: string;       // 工具功能描述
  input_schema: {           // 参数JSON Schema
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

// Claude Code 内置工具
const builtinTools: ToolDefinition[] = [
  {
    name: 'Read',
    description: '读取文件内容',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: '要读取的文件路径' },
        limit: { type: 'number', description: '限制读取行数' },
        offset: { type: 'number', description: '从指定行开始读取' }
      },
      required: ['file_path']
    }
  },
  {
    name: 'Write',
    description: '写入内容到文件',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: '目标文件路径' },
        content: { type: 'string', description: '要写入的内容' }
      },
      required: ['file_path', 'content']
    }
  },
  {
    name: 'Bash',
    description: '执行命令行',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        timeout: { type: 'number', description: '超时时间(毫秒)' },
        working_directory: { type: 'string', description: '工作目录' }
      },
      required: ['command']
    }
  },
  {
    name: 'Grep',
    description: '搜索文件内容',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '正则表达式模式' },
        path: { type: 'string', description: '搜索路径' },
        glob: { type: 'string', description: '文件过滤模式' },
        case_sensitive: { type: 'boolean', description: '是否大小写敏感' }
      },
      required: ['pattern', 'path']
    }
  },
  {
    name: 'Glob',
    description: '查找匹配模式的文件',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'glob模式' },
        cwd: { type: 'string', description: '搜索根目录' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'Edit',
    description: '对文件进行修改',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: '要编辑的文件' },
        old_string: { type: 'string', description: '要替换的原字符串' },
        new_string: { type: 'string', description: '替换后的新字符串' }
      },
      required: ['file_path', 'old_string', 'new_string']
    }
  }
];
```

### 2. 工具调用循环

```typescript
// 工具调用循环实现
class ToolCallingLoop {
  private maxIterations: number = 100;

  async run(initialTask: string): Promise<string> {
    let messages = await this.buildInitialMessages(initialTask);

    for (let i = 0; i < this.maxIterations; i++) {
      // 调用模型
      const response = await this.claude.complete(messages);

      // 添加模型响应到消息历史
      messages.push(response);

      // 检查是否需要调用工具
      const toolCalls = this.extractToolCalls(response);

      if (toolCalls.length === 0) {
        // 没有工具调用，任务完成
        return this.extractFinalAnswer(response);
      }

      // 执行工具调用
      const toolResults = await this.executeTools(toolCalls);

      // 将工具结果添加到消息历史
      messages.push(...toolResults);
    }

    throw new Error('达到最大迭代次数');
  }

  private async executeTools(
    toolCalls: ToolCall[]
  ): Promise<Message[]> {
    const results = [];

    for (const toolCall of toolCalls) {
      const result = await this.toolManager.execute(toolCall);

      results.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: result.isError
            ? `Error: ${result.error}`
            : result.content
        }]
      });
    }

    return results;
  }
}
```

### 3. 安全边界控制

```typescript
// 工具安全检查
class SecurityChecker {
  // 命令执行安全检查
  checkBashCommand(command: string): SecurityResult {
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,                    // 递归删除根目录
      /:\(\)\{.*:\|.*&.*\};:/,             // Fork炸弹
      /curl.*\|.*sh/,                      // 管道执行远程脚本
      /wget.*\|.*sh/,                      // wget执行远程脚本
      /^\s*shutdown/,                       // 关机命令
      /^\s*reboot/,                         // 重启命令
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `危险命令: ${pattern}`
        };
      }
    }

    return { allowed: true };
  }

  // 路径安全检查
  checkPath(path: string): SecurityResult {
    const resolved = path.resolve(path);

    // 检查路径遍历攻击
    if (path.includes('..')) {
      return {
        allowed: false,
        reason: '禁止路径遍历'
      };
    }

    // 检查系统目录
    const systemPaths = ['/etc', '/usr', '/bin', '/sbin', '/boot'];
    if (systemPaths.some(p => resolved.startsWith(p))) {
      return {
        allowed: false,
        reason: '禁止访问系统目录'
      };
    }

    return { allowed: true };
  }
}
```

## 安全沙箱设计

### 1. 沙箱架构

Claude Code采用多层沙箱隔离：

```
┌─────────────────────────────────────────┐
│            Claude Code 进程              │
├─────────────────────────────────────────┤
│              权限控制器                   │
├─────────────────────────────────────────┤
│  ┌─────────────┐      ┌─────────────┐   │
│  │  进程沙箱   │      │   网络沙箱   │   │
│  │  (Bash)    │      │   (HTTP)    │   │
│  └─────────────┘      └─────────────┘   │
├─────────────────────────────────────────┤
│              文件系统限制                  │
│  ┌─────────────────────────────────────┐ │
│  │     只允许访问项目目录和临时目录      │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. 进程级沙箱

```typescript
// Bash命令执行沙箱
class BashSandbox {
  private allowedCommands = new Set([
    'git', 'npm', 'node', 'python', 'pip',
    'cargo', 'go', 'docker', 'ls', 'cat',
    'grep', 'find', 'awk', 'sed', 'curl'
  ]);

  async execute(
    command: string,
    options: { cwd?: string; timeout?: number }
  ): Promise<ExecutionResult> {
    // 解析命令
    const parsed = this.parseCommand(command);

    // 安全检查
    if (!this.isCommandAllowed(parsed.command)) {
      return {
        success: false,
        error: `命令不允许: ${parsed.command}`,
        stdout: '',
        stderr: 'Security: command not in whitelist'
      };
    }

    // 构建受限环境
    const env = this.buildRestrictedEnv();

    // 执行命令
    try {
      const result = await Deno.run({
        cmd: parsed.fullCommand,
        cwd: options.cwd || Deno.cwd(),
        env,
        stdout: 'piped',
        stderr: 'piped'
      }).output();

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 构建受限环境变量
  private buildRestrictedEnv(): Record<string, string> {
    return {
      PATH: '/usr/bin:/bin:/usr/local/bin',  // 限制PATH
      HOME: Deno.env.get('HOME') || '/tmp',
      TMPDIR: '/tmp'
    };
  }
}
```

### 3. 网络隔离

```typescript
// 网络访问控制
class NetworkSandbox {
  private allowedDomains = new Set([
    'api.github.com',
    'registry.npmjs.org',
    'pypi.org'
  ]);

  checkUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.allowedDomains.has(parsed.hostname);
    } catch {
      return false;
    }
  }

  // HTTP请求拦截
  async interceptHttpRequest(
    request: Request
  ): Promise<Response | null> {
    if (!this.checkUrl(request.url)) {
      return new Response('Forbidden', { status: 403 });
    }

    // 添加请求日志
    await this.logRequest(request);

    return null;  // 继续执行原始请求
  }
}
```

### 4. 资源限制

```typescript
// 资源限制配置
interface ResourceLimits {
  maxMemoryMB: number;         // 最大内存(MB)
  maxCpuPercent: number;        // 最大CPU使用率
  maxExecutionTimeMs: number;  // 最大执行时间
  maxFileSizeMB: number;       // 最大文件大小
  maxTempStorageMB: number;    // 最大临时存储
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxMemoryMB: 512,
  maxCpuPercent: 80,
  maxExecutionTimeMs: 30000,
  maxFileSizeMB: 10,
  maxTempStorageMB: 100
};

// 资源监控
class ResourceMonitor {
  checkLimits(usage: ResourceUsage): LimitCheck {
    if (usage.memoryMB > DEFAULT_LIMITS.maxMemoryMB) {
      return { exceeded: true, resource: 'memory' };
    }

    if (usage.cpuPercent > DEFAULT_LIMITS.maxCpuPercent) {
      return { exceeded: true, resource: 'cpu' };
    }

    return { exceeded: false };
  }
}
```

## Agent 开发参考价值

### 1. 设计要点

Claude Code的架构为Agent开发提供了以下参考：

| 设计点 | 实践 |
|--------|------|
| **模块化** | Planner、Executor、ToolManager分离 |
| **工具标准化** | 统一的工具接口定义 |
| **安全优先** | 多层沙箱隔离 |
| **迭代控制** | 最大迭代次数防止无限循环 |
| **状态管理** | 消息历史驱动 |

### 2. 核心实现参考

```typescript
// Agent开发模板 - 基于Claude Code架构
class BaseAgent {
  protected tools: Map<string, Tool> = new Map();
  protected messageHistory: Message[] = [];
  protected maxIterations = 100;

  // 注册工具
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // 核心执行循环
  async run(task: string): Promise<string> {
    this.messageHistory = await this.buildSystemContext(task);

    for (let i = 0; i < this.maxIterations; i++) {
      // 思考
      const response = await this.think();

      // 检查完成条件
      if (this.isComplete(response)) {
        return this.extractAnswer(response);
      }

      // 执行工具
      if (response.requiresAction) {
        await this.executeActions(response.actions);
      }
    }

    return this.giveUp();
  }

  protected async think(): Promise<思考结果> {
    // 子类实现
    throw new Error('需要实现think方法');
  }

  protected async executeActions(
    actions: Action[]
  ): Promise<void> {
    // 执行工具调用
    for (const action of actions) {
      const tool = this.tools.get(action.name);
      if (!tool) throw new Error(`Tool not found: ${action.name}`);

      const result = await tool.execute(action.params);
      this.messageHistory.push(this.formatToolResult(action, result));
    }
  }
}
```

### 3. 与Claude Code的差异点

| 方面 | Claude Code | 通用Agent框架 |
|------|-------------|--------------|
| 目标场景 | 编程辅助 | 多场景 |
| 工具集 | 内置固定 | 可扩展 |
| 交互模式 | CLI | 多接口 |
| 安全模型 | 严格沙箱 | 可配置 |

## 总结

Claude Code的架构设计提供了宝贵的参考：

1. **Tool Use机制** - 标准化的工具调用接口
2. **迭代控制** - 防止无限循环
3. **安全沙箱** - 多层隔离保护
4. **模块化设计** - 易于扩展和维护

这些设计原则可以直接应用于构建可靠的Agent系统。
