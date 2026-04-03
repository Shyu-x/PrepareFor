# MCP 协议深度解析

## 概述

MCP（Model Context Protocol，模型上下文协议）是一种专为AI模型与外部工具、数据源交互设计的开放协议。它由Anthropic在2024年末推出，旨在解决AI Agent与多样化工俱集成时的标准化问题。

## MCP 协议原理

### 1. 核心设计理念

MCP的核心理念是**"一次编写，到处运行"**——工具开发者只需实现一次MCP服务器，任何MCP客户端即可使用该工具。

```
┌─────────────┐     MCP协议      ┌─────────────┐
│  AI Model   │◄───────────────►│ MCP Client  │
│  (Claude)   │                  │  (Host)     │
└─────────────┘                  └──────┬──────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                        ┌───────────┐       ┌───────────┐
                        │MCP Server │       │MCP Server │
                        │ (File)    │       │ (Web)     │
                        └───────────┘       └───────────┘
```

### 2. 协议架构

MCP采用**JSON-RPC 2.0**作为传输层协议，所有消息分为三类：

| 消息类型 | 方向 | 用途 |
|----------|------|------|
| Request | Client → Server | 调用工具、获取资源 |
| Response | Server → Client | 返回工具执行结果 |
| Notification | 双向 | 进度通知、错误警告 |

### 3. 协议消息格式

```typescript
// JSON-RPC 2.0 请求格式
interface MCPRequest {
  jsonrpc: '2.0';           // 协议版本
  id: string | number;      // 请求唯一标识
  method: string;           // 方法名
  params?: {                // 可选参数
    name?: string;          // 工具名
    arguments?: Record<string, unknown>; // 工具参数
  };
}

// JSON-RPC 2.0 响应格式
interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;      // 对应请求的ID
  result?: {                // 成功结果
    content: Array<{        // 内容数组
      type: 'text' | 'image';
      text?: string;
      data?: string;        // base64编码
      mimeType?: string;
    }>;
    isError?: boolean;
  };
  error?: {                 // 错误信息
    code: number;
    message: string;
    data?: unknown;
  };
}
```

## Claude Code / VS Code Agent 中的 MCP 应用

### 1. Claude Code 的 MCP 集成

Claude Code 通过MCP协议连接外部工具，实现文件操作、搜索、版本控制等功能。

**MCP工具调用流程：**

```typescript
// Claude Code MCP客户端简化流程
class ClaudeCodeMCPClient {
  async callTool(toolName: string, args: Record<string, unknown>) {
    const request = {
      jsonrpc: '2.0',
      id: generateId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    const response = await this.transport.send(request);
    return this.parseResponse(response);
  }
}

// Claude Code 可用MCP工具
const availableTools = [
  {
    name: 'Read',
    description: '读取文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      }
    }
  },
  {
    name: 'Write',
    description: '写入文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        content: { type: 'string' }
      }
    }
  },
  {
    name: 'Bash',
    description: '执行命令行',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        timeout: { type: 'number' }
      }
    }
  },
  {
    name: 'Grep',
    description: '搜索文件内容',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        path: { type: 'string' },
        glob?: { type: 'string' }
      }
    }
  }
];
```

### 2. VS Code Agent 模式

VS Code的Agent模式（Copilot Chat）同样采用MCP协议连接开发工具：

```
用户请求 → Claude/AI → MCP Client → MCP Server → VS Code API
                                          ↓
                                    工具执行结果
                                          ↓
              用户界面 ◄────────── MCP Response ◄────
```

**VS Code MCP服务器能力：**

| 能力类别 | 具体功能 |
|----------|---------|
| 文件操作 | 读取、写入、编辑、删除文件 |
| 符号导航 | 查找定义、引用、实现 |
| 代码修改 | 自动修告、重构、生成代码 |
| 终端集成 | 执行命令、读取输出 |
| 调试控制 | 启动调试、断点管理 |

### 3. MCP安全模型

MCP协议内置多层安全机制：

```typescript
// MCP安全配置
interface MCPSecurityConfig {
  // 工具调用权限控制
  allowedTools: string[];

  // 禁止的危险操作
  blockedPatterns: RegExp[];

  // 资源访问限制
  resourceLimits: {
    maxFileSize: number;      // 最大文件大小(MB)
    maxExecutionTime: number; // 最大执行时间(ms)
    maxMemoryMB: number;      // 最大内存(MB)
  };

  // 敏感信息过滤
  sensitivePattern: RegExp[];
}
```

## MCP 服务器开发实践

### 1. 项目结构

```
my-mcp-server/
├── src/
│   ├── index.ts           # 入口文件
│   ├── server.ts          # MCP服务器核心
│   ├── tools/             # 工具实现
│   │   ├── fileTools.ts
│   │   └── searchTools.ts
│   └── resources/        # 资源提供
│       └── fileResources.ts
├── package.json
└── tsconfig.json
```

### 2. 服务器实现

```typescript
// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server-stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';

// 创建服务器实例
const server = new Server(
  'my-mcp-server',
  '1.0.0',
  {
    capabilities: {
      tools: {},       // 声明工具能力
      resources: {}    // 声明资源能力
    }
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: '读取文件内容',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
            limit: { type: 'number', description: '读取行数限制' }
          },
          required: ['path']
        }
      },
      {
        name: 'search_files',
        description: '在文件中搜索内容',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: '正则表达式' },
            path: { type: 'string', description: '搜索目录' }
          },
          required: ['pattern', 'path']
        }
      }
    ]
  };
});

// 注册工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file':
        return await handleReadFile(args.path, args.limit);

      case 'search_files':
        return await handleSearch(args.pattern, args.path);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

main();
```

### 3. 文件操作工具实现

```typescript
// src/tools/fileTools.ts
import * as fs from 'fs/promises';
import * as path from 'path';

export async function handleReadFile(
  filePath: string,
  limit?: number
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // 安全检查：防止路径遍历攻击
  const resolvedPath = path.resolve(filePath);
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed');
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  const lines = content.split('\n');

  return {
    content: [{
      type: 'text',
      text: lines.slice(0, limit).join('\n')
    }]
  };
}

export async function handleWriteFile(
  filePath: string,
  content: string
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const resolvedPath = path.resolve(filePath);

  // 确保目录存在
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, 'utf-8');

  return {
    content: [{
      type: 'text',
      text: `Successfully wrote to ${filePath}`
    }]
  };
}

export async function handleEditFile(
  filePath: string,
  oldString: string,
  newString: string
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const content = await fs.readFile(filePath, 'utf-8');

  if (!content.includes(oldString)) {
    throw new Error(`String not found: ${oldString}`);
  }

  const newContent = content.replace(oldString, newString);
  await fs.writeFile(filePath, newContent, 'utf-8');

  return {
    content: [{
      type: 'text',
      text: `Successfully edited ${filePath}`
    }]
  };
}
```

### 4. 搜索工具实现

```typescript
// src/tools/searchTools.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export async function handleSearch(
  pattern: string,
  searchPath: string
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const regex = new RegExp(pattern);
  const results: string[] = [];

  // 获取所有文件
  const files = await glob('**/*', {
    cwd: searchPath,
    ignore: ['node_modules/**', '.git/**']
  });

  // 搜索每个文件
  for (const file of files) {
    try {
      const filePath = path.join(searchPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  return {
    content: [{
      type: 'text',
      text: results.length > 0
        ? results.join('\n')
        : 'No matches found'
    }]
  };
}
```

### 5. 客户端连接

```typescript
// 客户端使用示例
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client(
  'my-client',
  '1.0.0',
  {
    capabilities: {
      tools: {}
    }
  }
);

// 连接到MCP服务器
await client.connect({
  transport: 'stdio',
  command: 'node',
  args: ['./dist/index.js']
});

// 调用工具
const result = await client.callTool({
  name: 'read_file',
  arguments: { path: '/path/to/file' }
});

console.log(result);
// 输出: { content: [{ type: 'text', text: 'file contents...' }] }
```

## MCP 协议优势

| 特性 | 传统方式 | MCP方式 |
|------|---------|---------|
| 工具注册 | 每个AI平台单独适配 | 一次实现，所有MCP客户端可用 |
| 接口标准化 | 自定义API | 统一的JSON-RPC格式 |
| 安全审计 | 平台各自实现 | 统一的权限控制模型 |
| 版本管理 | 分散管理 | 集中化的版本协商 |

## 总结

MCP协议是AI Agent工具集成的标准化的重要里程碑：

1. **标准化** - 统一的工具描述和调用格式
2. **安全性** - 内置权限控制和审计机制
3. **可扩展性** - 易于添加新工具和服务
4. **互操作性** - 一次实现，多平台使用

掌握MCP协议对于开发AI Agent应用至关重要。
