# 评论批注流程业务逻辑

本文档详细描述 FastDocument 项目中评论和批注的业务流程。

## 1. 评论创建和回复流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户阅读文档时需要提出问题、发表意见，或与团队成员讨论特定内容 |
| **任务 (T)** | 实现文档级和块级评论，支持回复、表情反应、@提及等功能 |
| **行动 (A)** | 前端 Zustand 状态管理，后端 REST API 持久化，支持实时同步 |
| **结果 (R)** | 用户可以添加评论、回复讨论、使用表情表达态度 |

### 1.2 详细流程步骤

#### 1.2.1 评论创建

```
用户点击"添加评论"
    ↓
输入评论内容
    ↓
(可选) 关联特定块 (blockId)
    ↓
POST /documents/:id/comments { content, blockId?, parentId? }
    ↓
后端创建评论实体
    ↓
返回评论数据
    ↓
前端更新评论列表
    ↓
(可选) 通知被@提及的用户
```

#### 1.2.2 评论回复

```
用户点击评论的"回复"按钮
    ↓
输入回复内容
    ↓
POST /comments/:id/reply { content, documentId }
    ↓
后端创建回复 (设置 parentId)
    ↓
返回回复数据
    ↓
前端更新评论树
```

#### 1.2.3 评论反应

```
用户点击评论的"表情"按钮
    ↓
选择表情 (点赞、爱心、笑哭等)
    ↓
POST /comments/:id/react { emoji, userId }
    ↓
后端更新反应列表
    ↓
广播给房间内所有用户
```

#### 1.2.4 评论解决

```
用户点击"解决"按钮
    ↓
POST /comments/:id/resolve
    ↓
后端标记评论为已解决
    ↓
返回更新后的评论
    ↓
前端更新评论状态
```

### 1.3 数据模型

#### 1.3.1 评论实体 (CommentEntity)

```typescript
// backend/src/comments/comment.entity.ts
@Entity("comments")
export class CommentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  documentId!: string;  // 关联文档 ID

  @Column({ nullable: true })
  blockId?: string;     // 关联块 ID (可选，用于块级评论)

  @Column()
  userId!: string;      // 评论者 ID

  @Column()
  userName!: string;    // 评论者名称

  @Column("text")
  content!: string;    // 评论内容

  @Column({ nullable: true })
  parentId?: string;   // 父评论 ID (用于回复)

  @Column({ default: false })
  resolved!: boolean;  // 是否已解决

  @Column("jsonb", { nullable: true })
  reactions?: { emoji: string; users: string[] }[];  // 表情反应

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### 1.3.2 前端评论接口

```typescript
// frontend/src/store/commentStore.ts
export interface Comment {
  id: string;
  documentId: string;
  blockId?: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;
  resolved?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: number;
  updatedAt: number;
}
```

### 1.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/documents/:id/comments` | 获取文档所有评论 |
| POST | `/documents/:id/comments` | 创建评论 |
| GET | `/comments/:id` | 获取单条评论 |
| PUT | `/comments/:id` | 更新评论 |
| DELETE | `/comments/:id` | 删除评论 |
| POST | `/comments/:id/reply` | 回复评论 |
| POST | `/comments/:id/react` | 评论反应 |
| POST | `/comments/:id/resolve` | 解决/重新打开评论 |

### 1.5 状态转换

```
评论状态:
  open → resolved → reopened

评论类型:
  document-level (文档级) ↔ block-level (块级)

评论层级:
  parent (父评论)
    ↓
  child-replies (子回复)
```

### 1.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 评论为空 | 验证必填，返回 400 错误 |
| 文档不存在 | 返回 404 错误 |
| 回复不存在的评论 | 返回 404 错误 |
| 删除有回复的评论 | 级联删除所有回复 |
| 表情反应重复点击 | 切换添加/移除状态 |

---

## 2. 批注创建和解决流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户在阅读文档时需要对特定文本进行标注，如高亮、划线、建议修改等 |
| **任务 (T)** | 实现多种批注类型，支持批注状态管理和指派功能 |
| **行动 (A)** | 选中文本后创建批注，批注与文档块关联，支持解决和归档 |
| **结果 (R)** | 批注显示为侧边栏浮层，可追踪处理状态 |

### 2.2 详细流程步骤

#### 2.2.1 批注创建

```
用户选中文档中的文本
    ↓
弹出批注工具栏 (高亮、下划线、删除线、建议、评论)
    ↓
用户选择批注类型
    ↓
(可选) 选择颜色
    ↓
输入批注内容
    ↓
POST /documents/:id/annotations { type, blockId, startOffset, endOffset, content, color }
    ↓
后端创建批注实体
    ↓
返回批注数据
    ↓
前端渲染批注标记
```

#### 2.2.2 批注查看

```
用户点击批注标记
    ↓
显示批注详情浮层
    ↓
显示: 批注内容、创建者、创建时间、状态
    ↓
(可选) 显示指派信息
```

#### 2.2.3 批注解决

```
用户点击"解决"按钮
    ↓
POST /annotations/:id/resolve
    ↓
后端更新批注状态为 resolved
    ↓
返回更新后的批注
    ↓
前端更新批注显示状态
```

#### 2.2.4 批注指派

```
用户点击"指派"按钮
    ↓
选择团队成员
    ↓
PUT /annotations/:id/assign { assigneeId }
    ↓
后端更新指派信息
    ↓
通知被指派人
```

### 2.3 数据模型

#### 2.3.1 批注实体 (AnnotationEntity)

```typescript
// backend/src/comments/annotation.entity.ts
@Entity("annotations")
export class AnnotationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  documentId!: string;  // 关联文档 ID

  @Column({ nullable: true })
  blockId?: string;    // 关联块 ID

  @Column()
  userId!: string;      // 创建者 ID

  @Column()
  userName!: string;    // 创建者名称

  @Column()
  type!: "highlight" | "underline" | "strikethrough" | "suggestion" | "comment";
  // 批注类型:
  // - highlight: 高亮
  // - underline: 下划线
  // - strikethrough: 删除线
  // - suggestion: 建议修改
  // - comment: 纯评论

  @Column({ nullable: true })
  color?: string;       // 颜色

  @Column()
  startOffset!: number;  // 起始偏移量

  @Column()
  endOffset!: number;    // 结束偏移量

  @Column("text", { nullable: true })
  content?: string;      // 批注内容

  @Column({ nullable: true })
  originalContent?: string;  // 原文内容 (用于建议)

  @Column({ default: "open" })
  status!: "open" | "resolved" | "archived";
  // 批注状态:
  // - open: 待处理
  // - resolved: 已解决
  // - archived: 已归档

  @Column({ nullable: true })
  assigneeId?: string;  // 被指派人 ID

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### 2.3.2 前端批注接口

```typescript
// frontend/src/store/commentStore.ts
export interface Annotation {
  id: string;
  documentId: string;
  blockId?: string;
  userId: string;
  userName: string;
  type: "highlight" | "underline" | "strikethrough" | "suggestion" | "comment";
  color?: string;
  startOffset: number;
  endOffset: number;
  content: string;
  originalContent?: string;
  status: "open" | "resolved" | "archived";
  assigneeId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 2.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/documents/:id/annotations` | 获取文档所有批注 |
| POST | `/documents/:id/annotations` | 创建批注 |
| PUT | `/annotations/:id` | 更新批注 |
| DELETE | `/annotations/:id` | 删除批注 |
| POST | `/annotations/:id/resolve` | 解决批注 |
| PUT | `/annotations/:id/assign` | 指派批注 |

### 2.5 状态转换

```
批注状态:
  open → resolved → reopened
         ↓
       archived

批注生命周期:
  created → viewed → (resolved | assigned | archived)

批注显示状态:
  active (显示中) ↔ hidden (已隐藏)
```

### 2.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 选区跨越块 | 不允许，提示选择单个块内的文本 |
| 批注位置文本已删除 | 标记为"孤立批注"，保留但不高亮 |
| 重复解决批注 | 返回当前状态，不报错 |
| 批量解决同一块的所有批注 | 逐个处理，失败回滚 |

---

## 3. 评论与批注对比

| 特性 | 评论 | 批注 |
|------|------|------|
| 定位 | 文档级或块级讨论 | 文本级标注 |
| 关联 | 文档或块 | 文本选区 |
| 类型 | 文字讨论 | 高亮、下划线、删除线、建议、评论 |
| 状态 | open/resolved | open/resolved/archived |
| 指派 | 不支持 | 支持 |
| 表情 | 支持 | 不支持 |

---

## 4. 前端实现 (Zustand Store)

```typescript
// frontend/src/store/commentStore.ts
interface CommentState {
  comments: Comment[];
  annotations: Annotation[];
  activeCommentId: string | null;
  activeAnnotationId: string | null;

  // 评论操作
  fetchComments: (documentId: string) => Promise<void>;
  addComment: (documentId: string, content: string, blockId?: string, parentId?: string) => Promise<Comment>;
  replyComment: (parentId: string, content: string) => Promise<Comment>;
  reactComment: (id: string, emoji: string) => Promise<void>;
  resolveComment: (id: string) => Promise<void>;

  // 批注操作
  fetchAnnotations: (documentId: string) => Promise<void>;
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => Promise<Annotation>;
  resolveAnnotation: (id: string) => Promise<void>;
  assignAnnotation: (id: string, assigneeId: string) => Promise<void>;
}
```

---

## 5. 总结

评论批注系统的核心设计要点:

1. **双轨制设计**: 评论用于讨论，批注用于标注
2. **灵活的关联性**: 支持文档级、块级、文本级多层次关联
3. **完整的状态管理**: 从创建到解决的全流程追踪
4. **协作友好**: 支持@提及、表情反应、指派等人性化功能
5. **实时同步**: 基于 Socket.io 的即时状态更新
