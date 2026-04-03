# Multi-Agent 协作机制

## 概述

Multi-Agent（多智能体）系统通过多个专门的Agent协同工作来解决复杂问题。每个Agent拥有特定的角色和能力，通过规范的通信协议进行协作。

## 多 Agent 通信协议

### 1. 通信基础

```typescript
// Agent通信消息格式
interface AgentMessage {
  id: string;                    // 消息唯一ID
  sender: string;                // 发送者Agent ID
  recipient?: string;           // 接收者ID (可选，广播时为空)
  type: MessageType;            // 消息类型
  content: unknown;              // 消息内容
  timestamp: number;             // 时间戳
  conversationId?: string;       // 对话线程ID
  replyTo?: string;             // 回复的消息ID
}

type MessageType =
  | 'request'      // 请求
  | 'response'     // 响应
  | 'inform'       // 通知
  | 'query'        // 查询
  | 'propose'      // 提议
  | 'accept'       // 接受
  | 'reject'       // 拒绝
  | 'ack';         // 确认
```

### 2. 消息传输层

```typescript
// 消息传输接口
interface MessageTransport {
  // 发送点对点消息
  send(message: AgentMessage): Promise<void>;

  // 广播消息
  broadcast(message: AgentMessage): Promise<void>;

  // 订阅消息
  subscribe(
    agentId: string,
    handler: (message: AgentMessage) => void
  ): () => void;
}

// WebSocket传输实现
class WebSocketTransport implements MessageTransport {
  private connections = new Map<string, WebSocket>();

  async send(message: AgentMessage): Promise<void> {
    const connection = this.connections.get(message.recipient);
    if (!connection) {
      throw new Error(`Agent ${message.recipient} not connected`);
    }
    connection.send(JSON.stringify(message));
  }

  async broadcast(message: AgentMessage): Promise<void> {
    const payload = JSON.stringify(message);
    await Promise.all(
      Array.from(this.connections.values()).map(
        ws => ws.send(payload)
      )
    );
  }
}
```

### 3. 通信协议定义

```typescript
// 协作协议定义
interface CollaborationProtocol {
  name: string;
  states: ProtocolState[];
  transitions: Transition[];
  handlers: Map<string, (ctx: ProtocolContext) => Promise<void>>;
}

// 示例：代码审查协议
const codeReviewProtocol: CollaborationProtocol = {
  name: 'code-review',
  states: [
    { name: 'init', description: '初始化审查请求' },
    { name: 'assigned', description: '已分配审查者' },
    { name: 'reviewing', description: '正在进行审查' },
    { name: 'feedback', description: '提供反馈' },
    { name: 'resolved', description: '问题已解决' },
    { name: 'completed', description: '审查完成' }
  ],
  transitions: [
    { from: 'init', to: 'assigned', event: 'assign' },
    { from: 'assigned', to: 'reviewing', event: 'start' },
    { from: 'reviewing', to: 'feedback', event: 'find_issues' },
    { from: 'feedback', to: 'resolved', event: 'fix_applied' },
    { from: 'resolved', to: 'completed', event: 'approve' }
  ],
  handlers: new Map([
    ['assign', async (ctx) => {
      const reviewer = await findAvailableReviewer();
      ctx.assign(reviewer);
    }],
    ['find_issues', async (ctx) => {
      const issues = await analyzeCode(ctx.code);
      ctx.reportIssues(issues);
    }]
  ])
};
```

## 协作模式：层次式、平级协作

### 1. 层次式协作 (Hierarchical)

```
                    ┌─────────────────┐
                    │   Orchestrator  │
                    │    (协调者)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Planner    │      │   Executor   │      │  Validator  │
│   Agent      │      │   Agent      │      │   Agent      │
│  (规划器)    │      │   (执行器)   │      │  (验证器)   │
└──────────────┘      └──────────────┘      └──────────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Specialist    │
                    │   Agents        │
                    │ (专家Agent池)   │
                    └─────────────────┘
```

```typescript
// 层次式协调器
class HierarchicalOrchestrator {
  private orchestrator: Agent;       // 顶层协调者
  private planners: Agent[];         // 规划Agent池
  private executors: Agent[];       // 执行Agent池
  private validators: Agent[];      // 验证Agent池

  async coordinate(task: Task): Promise<Result> {
    // 1. 协调者分析任务并分解
    const subtasks = await this.orchestrator.decompose(task);

    // 2. 分配给专门的Planner
    const plans = await Promise.all(
      subtasks.map(st => this.assignToPlanner(st))
    );

    // 3. Executor执行计划
    const executions = await Promise.all(
      plans.map(plan => this.assignToExecutor(plan))
    );

    // 4. Validator验证结果
    const validations = await Promise.all(
      executions.map(ex => this.assignToValidator(ex))
    );

    // 5. 协调者整合结果
    return this.orchestrator.integrate(
      plans, executions, validations
    );
  }
}
```

### 2. 平级协作 (Peer-to-Peer)

```
┌──────────────┐         ┌──────────────┐
│   Agent A    │◄───────►│   Agent B    │
│  (研究员)    │  协商   │   (分析师)   │
└──────┬───────┘         └──────┬───────┘
       │                         │
       │    ┌─────────────────┐  │
       └───►│   共享上下文     │◄─┘
            │   (Shared State)│
            └─────────────────┘
                   ▲     │
                   │     ▼
            ┌──────────────┐
            │   Agent C    │
            │   (程序员)   │
            └──────────────┘
```

```typescript
// 平级协作Agent
class PeerAgent {
  id: string;
  private peers: Map<string, PeerAgent>;
  private sharedState: SharedContext;

  async communicate(
    peerId: string,
    message: AgentMessage
  ): Promise<AgentMessage> {
    // 发送消息给对等方
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found`);

    // 等待响应
    return await peer.receive(message, this.id);
  }

  async broadcast(message: AgentMessage): Promise<void> {
    // 广播给所有对等方
    await Promise.all(
      Array.from(this.peers.values()).map(
        peer => peer.receive(message, this.id)
      )
    );
  }

  // 协作发现问题时的协商机制
  async negotiate(
    topic: string,
    proposals: Proposal[]
  ): Promise<Proposal> {
    // 收集各方提案
    const allProposals = [...proposals];

    // 广播协商请求
    await this.broadcast({
      type: 'propose',
      content: { topic, proposals: allProposals }
    });

    // 收集反馈并选择最优方案
    return this.selectBestProposal(allProposals);
  }
}
```

### 3. 混合协作模式

```typescript
// 混合模式：层次式 + 平级
class HybridMultiAgentSystem {
  // 顶层协调
  orchestrator: OrchestratorAgent;

  // 中间层：专业Agent组
  specialistGroups: Map<string, PeerAgent[]>;

  // 底层：执行Agent池
  executorPool: AgentPool;

  async execute(task: Task): Promise<Result> {
    // 阶段1: 协调者顶层规划
    const plan = await this.orchestrator.plan(task);

    // 阶段2: 按专业分组协作
    const groupResults = await Promise.all(
      plan.groups.map(group =>
        this.executeGroupCollaboration(group)
      )
    );

    // 阶段3: 执行Agent池执行具体任务
    const execResults = await this.executorPool.executeAll(
      plan.tasks
    );

    // 阶段4: 协调者整合结果
    return this.orchestrator.integrate(groupResults, execResults);
  }

  // 组内协作
  async executeGroupCollaboration(
    group: AgentGroup
  ): Promise<GroupResult> {
    // 组内对等通信
    const negotiations = await this.peerNegotiate(group.agents);

    // 达成共识后执行
    return this.groupExecute(group, negotiations);
  }
}
```

## 冲突检测与解决

### 1. 冲突类型

| 冲突类型 | 描述 | 示例 |
|----------|------|------|
| 资源冲突 | 多Agent竞争同一资源 | 同时修改同一文件 |
| 目标冲突 | Agent目标不一致 | A要重构，B要快速修复 |
| 方案冲突 | 对同一问题解决方案不同 | 两种架构设计方案 |
| 依赖冲突 | 循环依赖或死锁 | A等B，B等A |

### 2. 冲突检测

```typescript
// 冲突检测器
class ConflictDetector {
  // 检测资源冲突
  detectResourceConflicts(assignments: Assignment[]): Conflict[] {
    const resourceMap = new Map<string, Assignment[]>();

    for (const assignment of assignments) {
      for (const resource of assignment.resources) {
        const existing = resourceMap.get(resource) || [];
        existing.push(assignment);
        resourceMap.set(resource, existing);
      }
    }

    // 找出冲突的资源
    const conflicts: Conflict[] = [];
    for (const [resource, assignments] of resourceMap) {
      if (assignments.length > 1) {
        conflicts.push({
          type: 'resource',
          resource,
          agents: assignments.map(a => a.agentId),
          severity: this.calculateSeverity(resource, assignments)
        });
      }
    }

    return conflicts;
  }

  // 检测目标冲突
  detectGoalConflicts(goals: Goal[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (let i = 0; i < goals.length; i++) {
      for (let j = i + 1; j < goals.length; j++) {
        if (this.areConflicting(goals[i], goals[j])) {
          conflicts.push({
            type: 'goal',
            goals: [goals[i], goals[j]],
            agents: [goals[i].agentId, goals[j].agentId]
          });
        }
      }
    }

    return conflicts;
  }

  // 检测循环依赖
  detectCircularDependencies(
    dependencies: Map<string, string[]>
  ): Conflict | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of dependencies.keys()) {
      if (this.hasCycle(node, dependencies, visited, recursionStack)) {
        return {
          type: 'dependency',
          description: `循环依赖检测: ${Array.from(recursionStack).join(' → ')}`
        };
      }
    }

    return null;
  }
}
```

### 3. 冲突解决策略

```typescript
// 冲突解决器
class ConflictResolver {
  // 基于优先级的解决
  resolveByPriority(conflict: Conflict): Resolution {
    const sorted = conflict.agents.sort(
      (a, b) => b.priority - a.priority
    );

    return {
      winner: sorted[0],
      loser: sorted.slice(1),
      strategy: 'priority_based'
    };
  }

  // 协商解决
  async resolveByNegotiation(
    conflict: Conflict
  ): Promise<Resolution> {
    const proposals = await Promise.all(
      conflict.agents.map(agent => agent.propose(conflict))
    );

    // 选择最优提案
    const best = this.evaluateProposals(proposals);

    return {
      winner: best.agent,
      proposal: best,
      strategy: 'negotiation'
    };
  }

  // 资源分割解决
  resolveByPartitioning(
    conflict: ResourceConflict
  ): Resolution {
    const resource = conflict.resource;
    const agents = conflict.agents;

    // 时间分割
    const timeSlots = this.partitionTime(agents.length);

    return {
      allocations: agents.map((agent, i) => ({
        agent,
        resource,
        timeSlot: timeSlots[i]
      })),
      strategy: 'time_partitioning'
    };
  }

  // 优先级队列解决资源冲突
  resolveResourceQueue(
    conflict: ResourceConflict
  ): Resolution {
    // 按Agent优先级排队
    const queue = conflict.agents
      .sort((a, b) => a.priority - b.priority);

    return {
      queue,
      strategy: 'priority_queue'
    };
  }
}
```

### 4. 分布式锁机制

```typescript
// 分布式锁实现
class DistributedLock {
  private storage: RedisStorage;
  private lockTimeout: number;

  async acquire(
    resource: string,
    agentId: string,
    ttl: number = 30000
  ): Promise<boolean> {
    const key = `lock:${resource}`;
    const result = await this.storage.set(key, agentId, {
      NX: true,  // 仅当不存在时设置
      PX: ttl    // 毫秒过期时间
    });

    return result === 'OK';
  }

  async release(resource: string, agentId: string): Promise<boolean> {
    const key = `lock:${resource}`;
    const currentHolder = await this.storage.get(key);

    if (currentHolder === agentId) {
      await this.storage.del(key);
      return true;
    }

    return false;
  }

  // 带超时的锁获取
  async acquireWithRetry(
    resource: string,
    agentId: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.acquire(resource, agentId)) {
        return true;
      }
      await this.delay(retryDelay * (i + 1));
    }
    return false;
  }
}

// Agent使用锁访问共享资源
class ResourceAwareAgent {
  private lock: DistributedLock;

  async accessSharedResource(
    resource: string,
    operation: () => Promise<void>
  ): Promise<void> {
    const acquired = await this.lock.acquire(resource, this.id);

    if (!acquired) {
      throw new Error(`Cannot acquire lock for ${resource}`);
    }

    try {
      await operation();
    } finally {
      await this.lock.release(resource, this.id);
    }
  }
}
```

## 协作会话管理

### 1. 会话生命周期

```typescript
// 协作会话
interface CollaborationSession {
  id: string;
  task: Task;
  participants: string[];
  state: SessionState;
  createdAt: number;
  deadline?: number;
}

type SessionState =
  | 'forming'    // 组团中
  | 'active'     // 进行中
  | 'paused'     // 暂停
  | 'completed'  // 完成
  | 'aborted';   // 中止

class SessionManager {
  sessions = new Map<string, CollaborationSession>();

  async createSession(task: Task, participants: string[]): Promise<string> {
    const session: CollaborationSession = {
      id: generateId(),
      task,
      participants,
      state: 'forming',
      createdAt: Date.now()
    };

    this.sessions.set(session.id, session);

    // 通知所有参与者
    await this.notifyParticipants(session, 'session_created');

    return session.id;
  }

  async completeSession(sessionId: string, result: Result): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.state = 'completed';

    // 汇总各方贡献
    const summary = this.summarizeContributions(session);

    // 通知完成
    await this.notifyParticipants(session, 'session_completed', { result, summary });
  }
}
```

### 2. 贡献追踪

```typescript
// Agent贡献追踪
interface Contribution {
  agentId: string;
  type: 'code' | 'review' | 'idea' | 'test' | 'docs';
  description: string;
  timestamp: number;
  linesChanged?: number;
}

class ContributionTracker {
  contributions = new Map<string, Contribution[]>();

  record(contribution: Contribution): void {
    const existing = this.contributions.get(contribution.agentId) || [];
    existing.push(contribution);
    this.contributions.set(contribution.agentId, existing);
  }

  getLeaderboard(): Array<{ agentId: string; score: number }> {
    return Array.from(this.contributions.entries())
      .map(([agentId, contributions]) => ({
        agentId,
        score: this.calculateScore(contributions)
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(contributions: Contribution[]): number {
    return contributions.reduce((sum, c) => {
      switch (c.type) {
        case 'code': return sum + 10;
        case 'test': return sum + 8;
        case 'review': return sum + 5;
        case 'docs': return sum + 3;
        case 'idea': return sum + 2;
        default: return sum + 1;
      }
    }, 0);
  }
}
```

## 实战案例：代码开发团队Agent

```typescript
// 多Agent软件开发团队
class SoftwareDevTeam {
  agents = {
    architect: new ArchitectAgent(),
    frontend: new FrontendAgent(),
    backend: new BackendAgent(),
    tester: new TesterAgent(),
    devops: new DevOpsAgent()
  };

  async developFeature(spec: FeatureSpec): Promise<void> {
    // 1. 架构师设计架构
    const architecture = await this.agents.architect.design(spec);

    // 2. 前端和后端并行开发
    const [frontend, backend] = await Promise.all([
      this.agents.frontend.develop(architecture.frontend),
      this.agents.backend.develop(architecture.backend)
    ]);

    // 3. 测试和质量检查
    const issues = await this.agents.tester.review(frontend, backend);

    // 4. 如有问题，协商解决
    if (issues.length > 0) {
      await this.resolveIssues(issues, [frontend, backend]);
    }

    // 5. DevOps部署
    await this.agents.devops.deploy(frontend, backend);
  }

  // 问题解决协商
  async resolveIssues(
    issues: Issue[],
    agents: Agent[]
  ): Promise<void> {
    for (const issue of issues) {
      // 相关Agent提出解决方案
      const proposals = await Promise.all(
        issue.relatedAgents.map(agentId =>
          agents.find(a => a.id === agentId).proposeSolution(issue)
        )
      );

      // 评估并选择最佳方案
      const best = this.selectBestSolution(proposals);

      // 执行修复
      await best.agent.applySolution(best.solution);
    }
  }
}
```

## 总结

Multi-Agent协作机制的核心要点：

1. **通信协议** - 统一的消息格式和传输机制
2. **协作模式** - 层次式适合复杂任务，平级适合对等协商
3. **冲突解决** - 检测、协商、解决的完整流程
4. **会话管理** - 生命周期控制和贡献追踪

选择合适的协作模式取决于任务复杂度、实时性要求和系统规模。
