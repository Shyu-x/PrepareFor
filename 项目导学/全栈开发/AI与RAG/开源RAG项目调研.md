# 开源 RAG 项目调研

> 调研日期：2026年3月22日

## 一、项目概览

| 项目 | 描述 | Stars | URL |
|------|------|-------|-----|
| **Dify** | 生产级 Agentic Workflow 开发平台 | 133,932 | https://github.com/langgenius/dify |
| **RAGFlow** | 深度文档理解 RAG 引擎，融合 RAG 与 Agent 能力 | 75,781 | https://github.com/infiniflow/ragflow |

---

## 二、Dify 深度分析

### 2.1 项目基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | dify |
| **描述** | Production-ready platform for agentic workflow development |
| **Star 数** | 133,932 |
| **主要语言** | Python (占比最高)、TypeScript、JavaScript、PHP、Shell |

### 2.2 技术栈分析

**主要语言分布：**
- Python: 23,242,924 bytes
- TypeScript: 26,351,962 bytes
- JavaScript: 1,571,333 bytes
- Shell: 67,546 bytes
- CSS/HTML/MDX 等: 约 1,000,000 bytes

**技术主题标签：**
```
ai, gpt, llm, openai, rag, orchestration, gpt-4, agent, nextjs,
workflow, genai, gemini, automation, low-code, no-code, mcp,
agentic-ai, agentic-framework, agentic-workflow
```

### 2.3 核心特性

1. **Agentic Workflow** - 支持构建智能体工作流
2. **RAG 能力** - 完整的检索增强生成能力
3. **多模型支持** - OpenAI、GPT-4、Gemini 等
4. **低代码/无代码** - 可视化编排
5. **MCP 协议** - 支持 Model Context Protocol
6. **Next.js 前端** - 现代化 Web 界面

---

## 三、RAGFlow 深度分析

### 3.1 项目基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | ragflow |
| **描述** | RAG engine that fuses cutting-edge RAG with Agent capabilities |
| **Star 数** | 75,781 |
| **主要语言** | Python (占比最高)、TypeScript、Go、C++、C |

### 3.2 技术栈分析

**主要语言分布：**
- Python: 7,807,077 bytes
- TypeScript: 5,458,107 bytes
- Go: 1,025,667 bytes
- C++: 1,576,808 bytes
- C: 161,144 bytes
- JavaScript/Less/Shell/CSS 等: 约 100,000 bytes

**技术主题标签：**
```
document-understanding, llm, rag, document-parser,
retrieval-augmented-generation, agent, graphrag, ai-search,
deepseek, deepseek-r1, ollama, ai, agentic-ai, mcp,
agentic, deep-research, agentic-workflow, context-engineering,
context-retrieval
```

### 3.3 核心特性

1. **深度文档理解** - 不仅仅是文字提取，支持复杂文档结构
2. **RAG + Agent 融合** - 将 RAG 与智能体能力结合
3. **GraphRAG** - 支持图谱增强检索
4. **多后端支持** - DeepSeek、Ollama、OpenAI 等
5. **MCP 协议** - 支持 Model Context Protocol
6. **Agentic Workflow** - 智能体工作流编排

---

## 四、相关项目搜索结果

### 4.1 搜索 "knowledge base agent" 相关项目（按 Stars 排序）

| 排名 | 项目 | 描述 | Stars |
|------|------|------|-------|
| 1 | **AntSK** | 基于 .Net 9、AntBlazor、Semantic Kernel、Kernel Memory 构建的 AI 知识库/Agent，支持本地离线运行 | - |
| 2 | **vercel-labs/knowledge-agent-template** | 开源的文件系统和知识库 Agent 模板 | - |
| 3 | **Gauntlet-HQ/prod-evals-cookbook** | 构建生产级 AI 评估的教程，使用知识库 Agent 作为教学示例 | - |
| 4 | **riceball** | 面向团队和企业的私有 AI 知识库与 Agent 平台 | - |
| 5 | **inquisitour/Knowledge-Based-Agent** | 结合 RAG 和知识库的自主 AI Agent | - |

---

## 五、对比分析

### 5.1 功能对比

| 功能 | Dify | RAGFlow |
|------|------|---------|
| **定位** | Agentic Workflow 开发平台 | 深度文档理解 RAG 引擎 |
| **文档理解** | 基础 | 深度（支持复杂文档结构） |
| **工作流编排** | 完善的可视化编排 | 支持 Agentic Workflow |
| **多模型支持** | OpenAI、Gemini 等 | DeepSeek、Ollama、OpenAI 等 |
| **GraphRAG** | - | 支持 |
| **低代码** | 是 | 部分 |
| **前端框架** | Next.js | TypeScript (自研) |

### 5.2 技术选型对比

| 方面 | Dify | RAGFlow |
|------|------|---------|
| **后端语言** | Python 为主 | Python + Go |
| **前端语言** | TypeScript | TypeScript |
| **数据库支持** | 多种 | 多种 |
| **向量数据库** | 集成多种 | Infinity (自研) |

---

## 六、总结与建议

### 6.1 项目特点

**Dify 优势：**
- 极高的社区活跃度（133k+ Stars）
- 完善的低代码工作流编排
- 丰富的模型支持和集成
- 适合快速构建 AI 应用

**RAGFlow 优势：**
- 专注于深度文档理解
- GraphRAG 支持
- Infinity 向量数据库自研
- 适合需要高精度文档处理的场景

### 6.2 学习价值

两个项目都是当前 AI + RAG 领域的优秀开源实践：

1. **Dify** - 适合学习：工作流编排、低代码设计、多模型集成
2. **RAGFlow** - 适合学习：深度文档处理、RAG 优化、GraphRAG 实现

### 6.3 相关技术标签汇总

```
// 核心技术标签
RAG: 检索增强生成
Agent: 智能体
Agentic AI: 智能体AI
Agentic Workflow: 智能体工作流
LLM: 大语言模型
GraphRAG: 图谱增强检索
Knowledge Base: 知识库
Document Understanding: 文档理解
MCP: Model Context Protocol
Low-code/No-code: 低代码/无代码
```

---

## 七、参考资料

- Dify 官方仓库：https://github.com/langgenius/dify
- RAGFlow 官方仓库：https://github.com/infiniflow/ragflow
