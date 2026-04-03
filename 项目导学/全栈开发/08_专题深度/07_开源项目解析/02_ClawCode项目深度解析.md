# ClawCode 项目深度解析

## 一、项目概述

### 1.1 项目基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | ClawCode (ultraworkers/claw-code) |
| **编程语言** | Rust (主分支)、Python (过渡层) |
| **Star数量** | 142,960+ |
| **Fork数量** | 101,505+ |
| **创建时间** | 2026年3月31日 |
| **项目定位** | AI代码生成工具的Harness框架 |
| **核心目标** | Better Harness Tools，让AI真正完成实际工作 |

### 1.2 项目起源与背景

ClawCode起源于一场开源界的轰动事件。2026年3月31日凌晨4点，项目创始人instructkr醒来发现Claw Code源码被泄露，整个开发者社区陷入狂热。他在短时间内使用Python从头开始重写了核心功能，并在发布后仅2小时内成为了历史上最快突破50K stars的项目。

项目的开发过程完全由AI驱动：
- **主要工具**: oh-my-codex (OmX) - 用于脚手架、编排和架构指导
- **辅助工具**: oh-my-opencode (OmO) - 用于实现加速和验证支持

### 1.3 核心技术定位

ClawCode本质上是一个**AI Agent Harness框架**，其核心价值在于：

1. **工具编排引擎**: 高效地将用户prompt路由到合适的工具/命令
2. **会话状态管理**: 支持多轮对话、上下文压缩和会话持久化
3. **插件系统**: 灵活扩展工具和命令的能力
4. **多Provider支持**: 同时支持Claw API、Xai和OpenAI等多种AI Provider

---

## 二、技术架构解析

### 2.1 整体架构图

```
claw-code/
├── src/                          # Python移植工作区（过渡层）
│   ├── runtime.py               # 运行时核心
│   ├── tools.py                 # 工具定义
│   ├── commands.py              # 命令定义
│   ├── query_engine.py          # 查询引擎
│   ├── models.py                # 数据模型
│   └── context.py               # 上下文管理
│
├── rust/                         # Rust实现（主分支）
│   ├── crates/
│   │   ├── api/                # API客户端 + 流式处理
│   │   ├── runtime/            # 运行时核心（会话、工具、MCP）
│   │   ├── tools/              # 工具规格定义
│   │   ├── commands/           # 命令系统
│   │   ├── plugins/            # 插件模型
│   │   ├── server/             # HTTP/SSE服务器 (axum)
│   │   ├── lsp/                # LSP客户端集成
│   │   └── claw-cli/           # 交互式CLI程序
│   └── Cargo.toml
│
└── tests/                       # Python验证测试
```

### 2.2 Rust Workspace结构

Rust版本采用**Cargo Workspace**组织，包含以下Crate：

| Crate | 职责 | 关键模块 |
|-------|------|----------|
| **api** | AI Provider抽象、OAuth、流式支持 | client, providers, sse, types |
| **runtime** | 会话状态、工具执行、MCP编排、Prompt构建 | session, tools, mcp, hooks |
| **tools** | 工具清单定义和执行框架 | tool_manifest, execution |
| **commands** | 斜杠命令、技能发现、配置检查 | slash_commands |
| **plugins** | 插件模型、钩子管道、捆绑插件 | plugin_model |
| **server** | HTTP/SSE服务器（基于axum） | router, session_store |
| **lsp** | LSP客户端集成、符号定位 | lsp_client |
| **claw-cli** | 交互式REPL、Markdown渲染、项目初始化 | repl, bootstrap |

### 2.3 核心技术特性

#### 2.3.1 多Provider支持架构

ClawCode支持多种AI Provider，采用统一的抽象层：

```rust
// 来自 api/src/client.rs
#[derive(Debug, Clone)]
pub enum ProviderClient {
    ClawApi(ClawApiClient),           // Claw官方API
    Xai(OpenAiCompatClient),          // Xai兼容模式
    OpenAi(OpenAiCompatClient),      // OpenAI兼容模式
}

impl ProviderClient {
    // 根据模型名称自动检测Provider类型
    pub fn from_model(model: &str) -> Result<Self, ApiError> {
        let resolved_model = providers::resolve_model_alias(model)?;
        match providers::detect_provider_kind(&resolved_model) {
            ProviderKind::ClawApi => Ok(Self::ClawApi(ClawApiClient::from_env()?)),
            ProviderKind::Xai => Ok(Self::Xai(OpenAiCompatClient::from_env(...)?)),
            ProviderKind::OpenAi => Ok(Self::OpenAi(OpenAiCompatClient::from_env(...)?)),
        }
    }
}
```

这种设计的优势：
- **解耦Provider实现**: 新增Provider只需实现Provider Trait
- **灵活切换**: 用户可通过配置无缝切换不同AI后端
- **统一接口**: 对上层屏蔽 Provider 差异

#### 2.3.2 Provider Trait抽象

```rust
// 伪代码展示Provider抽象
trait Provider {
    type Stream;  // 流式响应类型

    fn send_message(&self, request: &MessageRequest) -> impl Future<Output = Result<MessageResponse, ApiError>>;

    fn stream_message(&self, request: &MessageRequest) -> impl Future<Output = Result<Self::Stream, ApiError>>;

    fn detect_provider_kind(model: &str) -> ProviderKind;
}
```

#### 2.3.3 流式响应处理 (SSE)

ClawCode使用Server-Sent Events实现流式响应：

```rust
// 来自 api/src/sse.rs
pub struct SseParser;

// 解析SSE帧格式
pub fn parse_frame(data: &[u8]) -> Result<Option<StreamEvent>, ApiError> {
    // SSE格式: data: {...}\n\n
    // 支持多种事件类型: content_block_delta, message_stop, etc.
}
```

---

## 三、核心模块深度解析

### 3.1 Runtime运行时核心

#### 3.1.1 会话管理 (session.rs)

会话管理是ClawCode的核心模块，负责维护对话状态：

```rust
// 来自 runtime/src/session.rs
pub struct Session {
    pub id: SessionId,
    pub created_at: u64,
    pub conversation: RuntimeSession,
    events: broadcast::Sender<SessionEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
enum SessionEvent {
    Snapshot { session_id: SessionId, session: RuntimeSession },
    Message { session_id: SessionId, message: ConversationMessage },
}
```

**会话生命周期管理**：

```rust
impl Session {
    // 创建新会话
    fn new(id: SessionId) -> Self {
        let (events, _) = broadcast::channel(BROADCAST_CAPACITY);
        Self {
            id,
            created_at: unix_timestamp_millis(),
            conversation: RuntimeSession::new(),
            events,
        }
    }

    // 订阅会话事件（用于SSE实时推送）
    fn subscribe(&self) -> broadcast::Receiver<SessionEvent> {
        self.events.subscribe()
    }
}
```

#### 3.1.2 对话运行时 (conversation.rs)

```rust
// 核心类型导出
pub use conversation::{
    ApiClient, ApiRequest, AssistantEvent, ConversationRuntime, RuntimeError,
    StaticToolExecutor, ToolError, ToolExecutor, TurnSummary,
};
```

**ConversationRuntime** 是处理单轮对话的核心：

```rust
// 伪代码展示对话流程
struct ConversationRuntime {
    session: Session,
    tool_registry: ToolRegistry,
    permission_policy: PermissionPolicy,
}

impl ConversationRuntime {
    // 执行单轮对话
    async fn run_turn(&mut self, prompt: &str) -> Result<TurnSummary, RuntimeError> {
        // 1. 路由prompt到相关工具/命令
        let matches = self.route_prompt(prompt);

        // 2. 执行工具（需权限检查）
        for tool in matches.tools {
            self.check_permission(tool)?;
            self.execute_tool(tool).await?;
        }

        // 3. 调用AI生成响应
        let response = self.call_model(prompt).await?;

        // 4. 更新会话状态
        self.update_session(response);

        Ok(TurnSummary { ... })
    }
}
```

#### 3.1.3 工具注册表 (tools.rs)

```rust
// 来自 runtime/src/tools/lib.rs (153KB输出文件)
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ToolSpec {
    pub name: &'static str,           // 工具名称
    pub description: &'static str,    // 工具描述
    pub input_schema: Value,          // 输入JSON Schema
    pub required_permission: PermissionMode,  // 所需权限
}

pub struct GlobalToolRegistry {
    plugin_tools: Vec<PluginTool>,    // 插件工具
}

// 工具来源枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolSource {
    Base,        // 内置工具
    Conditional, // 条件工具
}
```

#### 3.1.4 权限系统 (permissions.rs)

```rust
// 权限模式定义
pub enum PermissionMode {
    Read,         // 只读
    Write,        // 写入
    Execute,      // 执行
    Elevated,     // 提升权限
}

// 权限策略
pub enum PermissionPolicy {
    AllowAll,           // 允许所有
    DenyAll,            // 拒绝所有
    PromptUser,         // 提示用户
    Configurable,       // 可配置
}

// 权限请求结果
pub enum PermissionOutcome {
    Granted,
    Denied { reason: String },
    Prompted { decision: PermissionPromptDecision },
}
```

### 3.2 MCP(Model Context Protocol)支持

#### 3.2.1 MCP模块架构

MCP是ClawCode连接外部工具的关键协议：

```rust
// 来自 runtime/src/mcp.rs
pub mod mcp {
    pub fn mcp_server_signature(config: &McpConfig) -> String;
    pub fn mcp_tool_name(tool: &McpTool) -> String;
    pub fn mcp_tool_prefix() -> &'static str;
    pub fn normalize_name_for_mcp(name: &str) -> String;
    pub fn scoped_mcp_config_hash(config: &ScopedMcpServerConfig) -> String;
}
```

#### 3.2.2 MCP传输类型

```rust
// 来自 runtime/src/mcp_stdio.rs
pub enum McpTransport {
    Stdio,      // 标准输入输出
    WebSocket,  // WebSocket
}

// MCP服务器配置
pub enum McpServerConfig {
    Stdio(McpStdioServerConfig),      // STDIO传输
    WebSocket(McpWebSocketServerConfig),  // WebSocket传输
    Remote(McpRemoteServerConfig),    // 远程服务器
    Sdk(McpSdkServerConfig),          // SDK模式
}

// OAuth配置
pub struct McpOAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
}
```

#### 3.2.3 MCP客户端实现

```rust
// MCP客户端传输抽象
pub enum McpClientTransport {
    McpStdioTransport(McpStdioTransport),
    McpRemoteTransport(McpRemoteTransport),
    McpSdkTransport(McpSdkTransport),
    McpManagedProxyTransport(McpManagedProxyTransport),
}

// 托管代理传输（用于云端MCP服务）
pub struct McpManagedProxyTransport {
    pub server_url: String,
    pub auth: McpClientAuth,
}
```

### 3.3 工具执行框架

#### 3.3.1 文件操作 (file_ops.rs)

```rust
// 文件读取
pub async fn read_file(path: &Path) -> Result<String, RuntimeError> {
    tokio::fs::read_to_string(path).await?
}

// 文件写入
pub async fn write_file(path: &Path, content: &str) -> Result<(), RuntimeError> {
    tokio::fs::write(path, content).await?
}

// 文件编辑（支持结构化Patch）
pub struct StructuredPatchHunk {
    pub old_start: u32,
    pub old_lines: u32,
    pub new_lines: Vec<String>,
}

pub async fn edit_file(
    path: &Path,
    hunks: Vec<StructuredPatchHunk>
) -> Result<EditFileOutput, RuntimeError> {
    // 读取原文件
    let content = read_file(path).await?;
    // 应用hunks
    let modified = apply_patches(&content, hunks)?;
    // 写回文件
    write_file(path, &modified).await?;
    Ok(EditFileOutput { success: true })
}
```

#### 3.3.2 Bash命令执行 (bash.rs)

```rust
// Bash命令输入
pub struct BashCommandInput {
    pub command: String,
    pub working_dir: Option<PathBuf>,
    pub timeout_secs: Option<u64>,
    pub environment: HashMap<String, String>,
}

// Bash命令输出
pub struct BashCommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
}

// 安全执行Bash
pub async fn execute_bash(input: BashCommandInput) -> Result<BashCommandOutput, RuntimeError> {
    // 1. 权限检查
    check_permission(PermissionMode::Execute)?;

    // 2. 构建命令
    let mut cmd = Command::new("bash");
    cmd.arg("-c").arg(&input.command);

    // 3. 设置工作目录
    if let Some(dir) = input.working_dir {
        cmd.current_dir(dir);
    }

    // 4. 执行（带超时）
    let output = tokio::process::Command::from(cmd)
        .output()
        .await?;

    Ok(BashCommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
        duration_ms: elapsed_ms,
    })
}
```

#### 3.3.3 搜索功能 (grep/glob)

```rust
// Grep搜索
pub struct GrepSearchInput {
    pub pattern: String,
    pub path: PathBuf,
    pub case_sensitive: bool,
    pub max_results: usize,
}

pub struct GrepSearchOutput {
    pub matches: Vec<GrepMatch>,
}

pub struct GrepMatch {
    pub file: PathBuf,
    pub line_number: u32,
    pub content: String,
    pub context: String,
}

// Glob搜索
pub struct GlobSearchOutput {
    pub paths: Vec<PathBuf>,
}

pub async fn glob_search(pattern: &str, root: &Path) -> Result<GlobSearchOutput, RuntimeError> {
    let paths = glob::glob_with(&pattern, &GlobOptions::new())
        .map_err(|e| RuntimeError::GlobError(e.to_string()))?
        .filter_map(Result::ok)
        .collect();
    Ok(GlobSearchOutput { paths })
}
```

### 3.4 Prompt构建系统

#### 3.4.1 系统提示词管理

```rust
// 来自 runtime/src/prompt.rs
pub struct SystemPromptBuilder {
    base_prompt: String,
    context_files: Vec<ContextFile>,
    project_context: Option<ProjectContext>,
    hooks: Vec<String>,
}

impl SystemPromptBuilder {
    // 加载系统提示词
    pub fn load_system_prompt(template_name: &str) -> Result<String, PromptBuildError>;

    // 添加上下文文件
    pub fn add_context_file(&mut self, file: ContextFile) -> &mut Self;

    // 添加项目上下文
    pub fn set_project_context(&mut self, ctx: ProjectContext) -> &mut Self;

    // 构建最终提示词
    pub fn build(&self) -> String {
        let mut parts = vec![self.base_prompt.clone()];

        // 添加项目上下文
        if let Some(ctx) = &self.project_context {
            parts.push(ctx.to_string());
        }

        // 添加上下文文件
        for file in &self.context_files {
            parts.push(file.format());
        }

        parts.join("\n\n")
    }
}
```

#### 3.4.2 项目上下文

```rust
pub struct ProjectContext {
    pub project_name: String,
    pub project_type: ProjectType,
    pub file_structure: Vec<PathBuf>,
    pub key_files: Vec<ContextFile>,
    pub detected_frameworks: Vec<String>,
}

pub enum ProjectType {
    NextJs,
    React,
    Node,
    Python,
    Rust,
    Go,
    Unknown,
}
```

### 3.5 会话压缩与上下文管理

#### 3.5.1 压缩机制 (compact.rs)

为了控制Token使用，ClawCode实现了智能会话压缩：

```rust
pub struct CompactionConfig {
    pub max_tokens: usize,           // 最大Token数
    pub compact_after_turns: usize, // 多少轮后压缩
    pub compression_ratio: f32,     // 压缩比
}

pub struct CompactionResult {
    pub original_tokens: usize,
    pub compressed_tokens: usize,
    pub removed_messages: usize,
    pub preserved_summaries: Vec<String>,
}

// 判断是否需要压缩
pub fn should_compact(config: &CompactionConfig, session: &Session) -> bool {
    let tokens = estimate_session_tokens(session);
    tokens > config.max_tokens || session.turn_count() > config.compact_after_turns
}

// 压缩会话
pub fn compact_session(
    session: &mut Session,
    config: &CompactionConfig,
) -> Result<CompactionResult, RuntimeError> {
    let original_tokens = estimate_session_tokens(session)?;

    // 1. 识别重要消息（工具调用、错误、关键决策）
    let important_messages = session.filter_important();

    // 2. 生成摘要
    let summaries = generate_summaries(&session.messages)?;

    // 3. 替换为摘要
    session.replace_with_summaries(summaries, important_messages);

    Ok(CompactionResult {
        original_tokens,
        compressed_tokens: estimate_session_tokens(session)?,
        removed_messages: session.messages.len(),
        preserved_summaries: summaries,
    })
}
```

#### 3.5.2 Token估算

```rust
// 粗略Token估算（实际应使用 tiktoken 等库）
pub fn estimate_session_tokens(session: &Session) -> Result<usize, RuntimeError> {
    let mut total = 0;
    for msg in &session.messages {
        // 简单估算：每4个字符约等于1个Token
        total += msg.content.len() / 4;
    }
    Ok(total)
}
```

---

## 四、Python移植层解析

### 4.1 移植架构设计

Python层作为过渡层，保持与Rust版本的结构对应：

```
src/
├── runtime.py          ← 对应 rust/crates/runtime
├── tools.py            ← 对应 rust/crates/tools
├── commands.py         ← 对应 rust/crates/commands
├── query_engine.py     ← 对应 Rust QueryEngine
├── models.py           ← 数据模型
└── context.py          ← 上下文管理
```

### 4.2 运行时核心 (runtime.py)

```python
# 路由匹配结果
@dataclass(frozen=True)
class RoutedMatch:
    kind: str           # 'command' 或 'tool'
    name: str           # 匹配名称
    source_hint: str    # 来源提示
    score: int          # 匹配分数

# 运行时会话
@dataclass
class RuntimeSession:
    prompt: str
    context: PortContext
    setup: WorkspaceSetup
    setup_report: SetupReport
    system_init_message: str
    history: HistoryLog
    routed_matches: list[RoutedMatch]
    turn_result: TurnResult
    command_execution_messages: tuple[str, ...]
    tool_execution_messages: tuple[str, ...]
    stream_events: tuple[dict[str, object], ...]
    persisted_session_path: str
```

### 4.3 工具系统 (tools.py)

```python
# 工具快照加载
SNAPSHOT_PATH = Path(__file__).resolve().parent / 'reference_data' / 'tools_snapshot.json'

@lru_cache(maxsize=1)
def load_tool_snapshot() -> tuple[PortingModule, ...]:
    """从JSON快照加载工具定义"""
    raw_entries = json.loads(SNAPSHOT_PATH.read_text())
    return tuple(
        PortingModule(
            name=entry['name'],
            responsibility=entry['responsibility'],
            source_hint=entry['source_hint'],
            status='mirrored',
        )
        for entry in raw_entries
    )

PORTED_TOOLS = load_tool_snapshot()

def get_tools(
    simple_mode: bool = False,
    include_mcp: bool = True,
    permission_context: ToolPermissionContext | None = None,
) -> tuple[PortingModule, ...]:
    """获取工具列表，支持过滤"""
    tools = list(PORTED_TOOLS)

    # 简单模式只包含核心工具
    if simple_mode:
        tools = [module for module in tools
                 if module.name in {'BashTool', 'FileReadTool', 'FileEditTool'}]

    # 排除MCP工具
    if not include_mcp:
        tools = [module for module in tools
                 if 'mcp' not in module.name.lower()]

    return filter_tools_by_permission_context(tuple(tools), permission_context)
```

### 4.4 命令系统 (commands.py)

```python
SNAPSHOT_PATH = Path(__file__).resolve().parent / 'reference_data' / 'commands_snapshot.json'

@lru_cache(maxsize=1)
def load_command_snapshot() -> tuple[PortingModule, ...]:
    """从JSON快照加载命令定义"""
    raw_entries = json.loads(SNAPSHOT_PATH.read_text())
    return tuple(
        PortingModule(
            name=entry['name'],
            responsibility=entry['responsibility'],
            source_hint=entry['source_hint'],
            status='mirrored',
        )
        for entry in raw_entries
    )

PORTED_COMMANDS = load_command_snapshot()

def get_commands(
    cwd: str | None = None,
    include_plugin_commands: bool = True,
    include_skill_commands: bool = True,
) -> tuple[PortingModule, ...]:
    """获取命令列表，支持按类型过滤"""
    commands = list(PORTED_COMMANDS)

    if not include_plugin_commands:
        commands = [module for module in commands
                    if 'plugin' not in module.source_hint.lower()]

    if not include_skill_commands:
        commands = [module for module in commands
                    if 'skills' not in module.source_hint.lower()]

    return tuple(commands)
```

### 4.5 查询引擎 (query_engine.py)

```python
@dataclass(frozen=True)
class QueryEngineConfig:
    max_turns: int = 8                  # 最大轮次
    max_budget_tokens: int = 2000       # 最大Token预算
    compact_after_turns: int = 12       # 压缩阈值
    structured_output: bool = False     # 结构化输出
    structured_retry_limit: int = 2    # 重试次数

@dataclass(frozen=True)
class TurnResult:
    prompt: str
    output: str
    matched_commands: tuple[str, ...]
    matched_tools: tuple[str, ...]
    permission_denials: tuple[PermissionDenial, ...]
    usage: UsageSummary
    stop_reason: str                    # 'completed', 'max_turns_reached', 'max_budget_reached'

@dataclass
class QueryEnginePort:
    manifest: PortManifest
    config: QueryEngineConfig = field(default_factory=QueryEngineConfig)
    session_id: str = field(default_factory=lambda: uuid4().hex)
    mutable_messages: list[str] = field(default_factory=list)
    permission_denials: list[PermissionDenial] = field(default_factory=list)
    total_usage: UsageSummary = field(default_factory=UsageSummary)
    transcript_store: TranscriptStore = field(default_factory=TranscriptStore)

    def submit_message(
        self,
        prompt: str,
        matched_commands: tuple[str, ...] = (),
        matched_tools: tuple[str, ...] = (),
        denied_tools: tuple[PermissionDenial, ...] = (),
    ) -> TurnResult:
        # 1. 检查轮次限制
        if len(self.mutable_messages) >= self.config.max_turns:
            return TurnResult(
                prompt=prompt,
                output=f'Max turns reached before processing prompt: {prompt}',
                matched_commands=matched_commands,
                matched_tools=matched_tools,
                permission_denials=denied_tools,
                usage=self.total_usage,
                stop_reason='max_turns_reached',
            )

        # 2. 格式化输出
        summary_lines = [
            f'Prompt: {prompt}',
            f'Matched commands: {", ".join(matched_commands) or "none"}',
            f'Matched tools: {", ".join(matched_tools) or "none"}',
            f'Permission denials: {len(denied_tools)}',
        ]
        output = self._format_output(summary_lines)

        # 3. Token预算检查
        projected_usage = self.total_usage.add_turn(prompt, output)
        stop_reason = 'completed'
        if projected_usage.input_tokens + projected_usage.output_tokens > self.config.max_budget_tokens:
            stop_reason = 'max_budget_reached'

        # 4. 更新状态
        self.mutable_messages.append(prompt)
        self.transcript_store.append(prompt)
        self.permission_denials.extend(denied_tools)
        self.total_usage = projected_usage

        # 5. 检查是否需要压缩
        self.compact_messages_if_needed()

        return TurnResult(...)
```

---

## 五、插件系统

### 5.1 插件架构

```rust
// 来自 crates/plugins/src/lib.rs
pub struct PluginRegistry {
    plugins: Vec<Plugin>,
}

pub trait Plugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn tools(&self) -> Vec<PluginTool>;
    fn hooks(&self) -> Vec<Hook>;
}

// 插件工具定义
pub struct PluginTool {
    pub name: String,
    pub definition: ToolDefinition,
    pub handler: PluginToolHandler,
}

pub type PluginToolHandler = Box<dyn Fn(ToolInput) -> Result<ToolOutput, PluginError> + Send + Sync>;
```

### 5.2 钩子系统

```rust
// 钩子事件类型
pub enum HookEvent {
    BeforeToolExecution(ToolExecutionContext),
    AfterToolExecution(ToolExecutionResult),
    BeforeMessage(MessageContext),
    AfterMessage(MessageResult),
    OnError(ErrorContext),
}

// 钩子运行器
pub struct HookRunner {
    hooks: Vec<Hook>,
}

impl HookRunner {
    pub async fn run_pre_tool_hooks(&self, ctx: &ToolExecutionContext) -> Result<(), HookError> {
        for hook in &self.hooks {
            if hook.applies_to(HookPhase::PreTool) {
                hook.execute(ctx).await?;
            }
        }
        Ok(())
    }
}
```

---

## 六、服务器架构 (axum)

### 6.1 HTTP服务器设计

```rust
// 来自 crates/server/src/lib.rs
#[derive(Clone)]
pub struct AppState {
    sessions: SessionStore,                    // 会话存储
    next_session_id: Arc<AtomicU64>,           // 会话ID生成器
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            next_session_id: Arc::new(AtomicU64::new(1)),
        }
    }

    fn allocate_session_id(&self) -> SessionId {
        let id = self.next_session_id.fetch_add(1, Ordering::Relaxed);
        format!("session-{id}")
    }
}
```

### 6.2 SSE实时推送

```rust
// 会话事件类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
enum SessionEvent {
    Snapshot { session_id: SessionId, session: RuntimeSession },
    Message { session_id: SessionId, message: ConversationMessage },
}

impl SessionEvent {
    fn event_name(&self) -> &'static str {
        match self {
            Self::Snapshot { .. } => "snapshot",
            Self::Message { .. } => "message",
        }
    }

    fn to_sse_event(&self) -> Result<Event, serde_json::Error> {
        Ok(Event::default()
            .event(self.event_name())
            .data(serde_json::to_string(self)?))
    }
}

// SSE端点处理
async fn sse_handler(
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let session = state.get_session(&session_id).await;
    let stream = stream! {
        // 发送初始快照
        yield session.to_sse_event().map_err(Infallible::new);

        // 订阅后续消息
        let mut receiver = session.subscribe().await;
        while let Ok(event) = receiver.recv().await {
            yield event.to_sse_event().map_err(Infallible::new);
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::default())
}
```

### 6.3 路由定义

```rust
async fn create_session(state: State<AppState>) -> impl IntoResponse {
    let session_id = state.allocate_session_id();
    let session = Session::new(session_id.clone());
    state.sessions.write().await.insert(session_id.clone(), session);
    (StatusCode::CREATED, Json(json!({ "session_id": session_id })))
}

async fn get_session(
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    match state.sessions.read().await.get(&session_id) {
        Some(session) => (StatusCode::OK, Json(session)),
        None => (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))),
    }
}

async fn send_message(
    Path(session_id): Path<String>,
    Json(request): Json<MessageRequest>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let session = state.sessions.read().await.get(&session_id);
    // 处理消息...
}

fn create_router() -> Router {
    Router::new()
        .route("/sessions", post(create_session))
        .route("/sessions/:id", get(get_session))
        .route("/sessions/:id/messages", post(send_message))
        .route("/sessions/:id/events", get(sse_handler))
}
```

---

## 七、OAuth认证系统

### 7.1 PKCE OAuth流程

```rust
// 来自 runtime/src/oauth.rs
pub struct PkceCodePair {
    pub verifier: String,      // PKCE verifier
    pub challenge: String,     // PKCE challenge
    pub method: PkceChallengeMethod,
}

pub enum PkceChallengeMethod {
    S256,  // 推荐：SHA256
    Plain, // 仅供测试
}

// 生成PKCE对
pub fn generate_pkce_pair(method: PkceChallengeMethod) -> PkceCodePair {
    let verifier = generate_random_string(64);
    let challenge = match method {
        PkceChallengeMethod::S256 => {
            // S256: BASE64URL(SHA256(verifier))
            let hash = sha2::Sha256::digest(verifier.as_bytes());
            base64url_encode(hash.as_slice())
        }
        PkceChallengeMethod::Plain => verifier.clone(),
    };
    PkceCodePair { verifier, challenge, method }
}

// OAuth令牌刷新
pub struct OAuthRefreshRequest {
    pub grant_type: String,
    pub refresh_token: String,
    pub client_id: String,
}

pub struct OAuthTokenSet {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
}
```

### 7.2 MCP OAuth配置

```rust
pub struct McpOAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub scopes: Vec<String>,
    pub redirect_uris: Vec<String>,
}

// 循环回调URI（用于本地开发）
pub fn loopback_redirect_uri(port: u16) -> String {
    format!("http://127.0.0.1:{}/callback", port)
}
```

---

## 八、与传统AI代码生成工具的对比

### 8.1 架构差异

| 特性 | 传统AI IDE插件 | ClawCode |
|------|---------------|----------|
| **交互模式** | 同步请求-响应 | 异步流式 + 多轮会话 |
| **上下文管理** | 简单追加 | 智能压缩 + 重要性排序 |
| **工具调用** | 单一工具 | 工具编排 + 并行执行 |
| **状态持久化** | 无 | 完整会话状态 |
| **扩展方式** | 插件系统 | 插件 + MCP协议 |
| **Provider支持** | 单一 | 多Provider抽象 |

### 8.2 核心创新点

1. **Harness框架设计**: 不是简单调用AI，而是构建完整的工具编排引擎
2. **多轮会话管理**: 支持复杂的多步骤任务，而非单次问答
3. **权限与安全**: 细粒度的权限控制，防止恶意操作
4. **MCP协议支持**: 标准化外部工具集成
5. **会话压缩**: 智能管理上下文长度，控制成本

---

## 九、技术栈总结

### 9.1 Rust技术栈

| 领域 | 技术选型 | 说明 |
|------|----------|------|
| **异步运行时** | tokio | 多线程RT，支持io-util, process, rt-multi-thread |
| **HTTP框架** | axum | 轻量、高性能、类型安全 |
| **序列化** | serde + serde_json | 全特性序列化 |
| **密码学** | sha2 | Token哈希、PKCE |
| **HTTP客户端** | reqwest | 同步/异步HTTP |
| **路径匹配** | glob + walkdir | 文件系统操作 |
| **LSP** | lsp-types | 完整的LSP类型定义 |

### 9.2 项目依赖关系图

```
claw-cli
    ↓
runtime ─────────────────→ tools
    ↓                       ↑
session, prompt, hooks     api
    ↓                       ↓
plugins ←── mcp ───────────┘
    ↑
server (axum)
```

---

## 十、学习建议与进阶方向

### 10.1 核心学习路径

1. **Rust基础**: 掌握所有权、生命周期、异步编程
2. **tokio异步**: 理解Future、await、任务调度
3. **axum框架**: 路由、中间件、SSE
4. **AI Provider抽象**: 理解Provider模式
5. **MCP协议**: 外部工具集成
6. **会话管理**: 状态持久化、压缩算法

### 10.2 推荐阅读顺序

1. 从 `rust/crates/runtime/src/lib.rs` 了解整体模块划分
2. 阅读 `session.rs` 理解会话管理
3. 阅读 `tools.rs` 理解工具注册
4. 阅读 `mcp.rs` 和 `mcp_stdio.rs` 理解MCP
5. 阅读 `conversation.rs` 理解对话流程
6. 阅读 `server/src/lib.rs` 理解HTTP服务

### 10.3 实践建议

1. 尝试运行Rust版本的 `cargo build --release`
2. 使用Python层理解核心概念
3. 尝试添加新的Provider支持
4. 实现自定义MCP服务器

---

## 附录：关键文件索引

| 文件 | 行数 | 功能描述 |
|------|------|----------|
| `rust/crates/runtime/src/lib.rs` | ~500 | 运行时模块导出 |
| `rust/crates/runtime/src/session.rs` | ~300 | 会话管理 |
| `rust/crates/runtime/src/conversation.rs` | ~400 | 对话运行时 |
| `rust/crates/runtime/src/tools.rs` | ~5000+ | 工具系统（核心） |
| `rust/crates/runtime/src/mcp.rs` | ~200 | MCP协议封装 |
| `rust/crates/runtime/src/mcp_stdio.rs` | ~500 | MCP STDIO传输 |
| `rust/crates/runtime/src/permissions.rs` | ~200 | 权限系统 |
| `rust/crates/runtime/src/prompt.rs` | ~200 | Prompt构建 |
| `rust/crates/server/src/lib.rs` | ~300 | HTTP服务器 |
| `src/runtime.py` | ~200 | Python运行时 |
| `src/tools.py` | ~200 | Python工具定义 |
| `src/query_engine.py` | ~300 | Python查询引擎 |

---

*文档版本: 1.0*
*最后更新: 2026-04-02*
*项目仓库: https://github.com/ultraworkers/claw-code*
