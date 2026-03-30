# 项目管理流程业务逻辑

本文档详细描述 FastDocument 项目中项目管理的业务流程，包括看板管理和任务生命周期。

## 1. 看板管理流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 团队需要使用看板（Kanban）方法管理项目进度，列代表工作阶段，任务卡片在列之间流动 |
| **任务 (T)** | 实现可自定义的看板视图，支持 WIP 限制、列折叠、拖拽排序 |
| **行动 (A)** | 用户创建项目、定义看板列、管理任务卡片位置 |
| **结果 (R)** | 清晰的进度可视化，团队成员了解任务状态 |

### 1.2 详细流程步骤

#### 1.2.1 创建项目

```
用户点击"新建项目"
    ↓
输入项目名称、描述
    ↓
POST /projects { name, description }
    ↓
后端创建项目实体
    ↓
创建默认看板列 (待处理、进行中、已完成)
    ↓
返回项目数据
    ↓
前端显示项目看板
```

#### 1.2.2 管理看板列

```
用户点击看板设置
    ↓
添加/删除/重命名列
    ↓
设置 WIP 限制
    ↓
设置折叠状态
    ↓
PUT /projects/:id
    ↓
更新项目配置
    ↓
前端更新看板显示
```

#### 1.2.3 拖拽任务卡片

```
用户拖拽任务卡片到目标列
    ↓
PUT /tasks/:id/move { columnId, order }
    ↓
后端更新任务的列和排序
    ↓
(可选) 检查 WIP 限制
    ↓
返回更新后的任务
    ↓
前端更新看板显示
```

### 1.3 数据模型

#### 1.3.1 项目实体 (ProjectEntity)

```typescript
// backend/src/projects/project.entity.ts
@Entity("projects")
export class ProjectEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;           // 项目名称

  @Column({ nullable: true })
  description?: string;   // 项目描述

  @Column()
  ownerId!: string;        // 所有者 ID

  @Column()
  ownerName!: string;      // 所有者名称

  @Column("jsonb", { default: [] })
  members!: { id: string; name: string; role: string }[];
  // 成员角色:
  // - owner: 所有者
  // - member: 成员

  @Column("jsonb", { default: [] })
  columns!: { id: string; name: string; order: number; wipLimit?: number; collapsed?: boolean }[];
  // 看板列配置:
  // - id: 列 ID
  // - name: 列名称
  // - order: 排序
  // - wipLimit: WIP 限制 (可选)
  // - collapsed: 是否折叠

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### 1.3.2 任务实体 (TaskEntity)

```typescript
@Entity("tasks")
export class TaskEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  projectId!: string;      // 所属项目 ID

  @Column()
  columnId!: string;      // 所在列 ID

  @Column()
  title!: string;        // 任务标题

  @Column({ nullable: true })
  description?: string;   // 任务描述

  @Column({ default: "todo" })
  status!: "todo" | "in_progress" | "done" | "blocked";
  // 任务状态:
  // - todo: 待处理
  // - in_progress: 进行中
  // - done: 已完成
  // - blocked: 阻塞

  @Column({ default: "medium" })
  priority!: "low" | "medium" | "high" | "urgent";
  // 优先级:
  // - low: 低
  // - medium: 中
  // - high: 高
  // - urgent: 紧急

  @Column({ nullable: true })
  assigneeId?: string;    // 负责人 ID

  @Column({ nullable: true })
  assigneeName?: string;  // 负责人名称

  @Column({ type: "bigint", nullable: true })
  dueDate?: number;       // 截止日期 (时间戳)

  @Column("simple-array", { default: "" })
  tags!: string[];       // 标签

  @Column("jsonb", { default: [] })
  subtasks!: { id: string; title: string; completed: boolean }[];
  // 子任务列表

  @Column("jsonb", { default: [] })
  checklist!: { id: string; content: string; checked: boolean }[];
  // 检查清单

  @Column("simple-array", { default: "" })
  linkedDocuments!: string[];  // 关联文档 ID

  @Column({ default: 0 })
  order!: number;         // 在列内的排序

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 1.4 API 调用

#### 1.4.1 项目 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/projects` | 获取项目列表 |
| POST | `/projects` | 创建项目 |
| GET | `/projects/:id` | 获取项目详情 |
| PUT | `/projects/:id` | 更新项目 |
| DELETE | `/projects/:id` | 删除项目 |

#### 1.4.2 任务 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/projects/:projectId/tasks` | 获取项目任务列表 |
| POST | `/projects/:projectId/tasks` | 创建任务 |
| PUT | `/tasks/:id` | 更新任务 |
| DELETE | `/tasks/:id` | 删除任务 |
| PUT | `/tasks/:id/move` | 移动任务 |

#### 1.4.3 列 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/projects/:projectId/columns` | 添加列 |
| PUT | `/columns/:id` | 更新列 |
| DELETE | `/columns/:id` | 删除列 |
| PUT | `/projects/:projectId/columns/reorder` | 重排列序 |

### 1.5 状态转换

```
项目状态:
  active (活跃) → archived (已归档) → deleted (已删除)

看板列状态:
  expanded (展开) ↔ collapsed (折叠)

任务状态:
  todo → in_progress → done
         ↓
       blocked (可从任意状态进入)
```

### 1.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| WIP 限制超出 | 警告提示，但仍允许拖拽 |
| 删除有任务的列 | 提示先移动任务到其他列 |
| 拖拽到已删除的列 | 自动移动到第一列 |
| 成员权限不足 | 返回 403 错误 |

---

## 2. 任务生命周期流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 任务从创建到完成需要经历多个阶段，每个阶段有不同的属性和操作 |
| **任务 (T)** | 实现完整的任务生命周期，支持状态、优先级、截止日期、指派等功能 |
| **行动 (A)** | 用户创建任务、更新属性、移动位置、完成检查清单 |
| **结果 (R)** | 任务清晰追踪，所有信息集中展示 |

### 2.2 详细流程步骤

#### 2.2.1 创建任务

```
用户点击列的"添加任务"
    ↓
输入任务标题
    ↓
(可选) 添加描述、设置优先级、设置截止日期
    ↓
POST /projects/:projectId/tasks { title, columnId, description?, priority?, dueDate? }
    ↓
后端创建任务实体
    ↓
返回任务数据
    ↓
前端添加到看板列
```

#### 2.2.2 任务详情编辑

```
用户点击任务卡片
    ↓
打开任务详情面板
    ↓
编辑任务属性:
  - 标题、描述
  - 优先级
  - 截止日期
  - 负责人
  - 标签
  - 子任务
  - 检查清单
  - 关联文档
    ↓
保存更改
    ↓
PUT /tasks/:id { title?, description?, priority?, dueDate?, assigneeId?, ... }
    ↓
后端更新任务
    ↓
返回更新后的任务
    ↓
前端更新显示
```

#### 2.2.3 任务状态变更

```
用户完成任务检查清单
    ↓
(可选) 手动拖拽到"已完成"列
    ↓
PUT /tasks/:id { status: 'done' }
    ↓
后端更新状态
    ↓
(可选) 发送通知给相关人员
    ↓
更新看板显示
```

#### 2.2.4 任务指派

```
用户点击任务详情中的"指派"
    ↓
弹出团队成员列表
    ↓
选择成员
    ↓
PUT /tasks/:id { assigneeId, assigneeName }
    ↓
后端更新指派信息
    ↓
(可选) 发送通知给被指派人
    ↓
更新任务显示
```

### 2.3 数据模型

任务实体的完整字段已在 1.3.2 节展示，以下是前端使用的接口定义:

```typescript
// frontend/src/store/projectStore.ts
export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: number;
  tags: string[];
  subtasks: { id: string; title: string; completed: boolean }[];
  checklist: { id: string; content: string; checked: boolean }[];
  linkedDocuments: string[];
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  members: { id: string; name: string; role: string }[];
  columns: { id: string; name: string; order: number; wipLimit?: number; collapsed?: boolean }[];
}
```

### 2.4 API 调用

任务相关 API 已在 1.4.2 节展示，以下是完整列表:

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/projects/:projectId/tasks` | 获取所有任务 |
| POST | `/projects/:projectId/tasks` | 创建任务 |
| PUT | `/tasks/:id` | 更新任务 |
| DELETE | `/tasks/:id` | 删除任务 |
| PUT | `/tasks/:id/move` | 移动任务 |

### 2.5 状态转换

```
任务状态机:

                    ┌─────────┐
                    │ blocked │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │  todo   │───▶│in_progress│───▶│  done   │
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
                    (可循环回到 todo)

优先级:
  urgent (紧急) > high (高) > medium (中) > low (低)

截止日期:
  overdue (已逾期) → today (今天) → upcoming (即将到期) → future (未来)
```

### 2.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 任务标题为空 | 验证必填，返回 400 错误 |
| 截止日期已过 | 标记为逾期状态，显示提醒 |
| 负责人已离职 | 保留记录，显示"已离职" |
| 删除有子任务的任务 | 提示先处理子任务 |
| 关联文档已删除 | 显示"文档已删除"链接 |

---

## 3. 前端实现

### 3.1 Zustand Store

```typescript
// frontend/src/store/projectStore.ts
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  isLoading: boolean;

  // 项目操作
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // 任务操作
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (projectId: string, data: CreateTaskDto) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, columnId: string, order: number) => Promise<void>;

  // 看板操作
  addColumn: (projectId: string, column: Column) => Promise<void>;
  updateColumn: (projectId: string, columnId: string, data: Partial<Column>) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  reorderColumns: (projectId: string, columnIds: string[]) => Promise<void>;
}
```

---

## 4. 总结

项目管理系统的核心设计要点:

1. **看板可视化**: 清晰的列式布局，任务卡片直观展示
2. **灵活的列配置**: 支持 WIP 限制、折叠、自定义列名
3. **丰富的任务属性**: 状态、优先级、截止日期、标签、检查清单、子任务
4. **任务关联**: 与文档系统集成，支持关联相关文档
5. **完整的生命周期**: 从创建到完成的全流程管理
