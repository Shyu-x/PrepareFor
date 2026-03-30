# 文档协作流程业务逻辑

本文档详细描述 FastDocument 项目中文档创建、编辑、实时协作和版本历史管理的业务流程。

## 1. 文档创建和编辑流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户需要创建新文档、编辑现有文档，或在离线状态下继续编辑 |
| **任务 (T)** | 实现文档的创建、加载、编辑、保存全流程，支持原子化块结构和离线优先 |
| **行动 (A)** | 前端通过 Zustand 状态管理，后端通过 REST API 和 Socket.io 实现实时同步 |
| **结果 (R)** | 用户可以流畅创建和编辑文档，支持多人实时协作，数据自动持久化 |

### 1.2 详细流程步骤

#### 1.2.1 文档创建流程

```
用户点击"新建文档"
    ↓
前端创建新文档 (documentStore.createDocument)
    ↓
POST /api/documents { title, parentId?, type? }
    ↓
后端创建文档实体和初始块
    ↓
返回文档 ID 和初始数据
    ↓
前端加载文档到编辑器
```

**前端实现** (`frontend/src/store/documentStore.ts`):
```typescript
createDocument: async (title: string, parentId?: string, type: string = "document", blocks?: Block[]) => {
  const res = await api.post(API_URL, { title, parentId, type, blocks });
  return res.data.id;
}
```

**后端实现** (`backend/src/documents/documents.service.ts`):
```typescript
async create(title: string, parentId: string, type: string, blocks: any[], userId: string) {
  const document = await this.documentsRepository.save({
    title,
    type,
    ownerId: userId,
    parent: parentId ? { id: parentId } : null,
  });
  // 创建初始块
  // ...
  return document;
}
```

#### 1.2.2 文档编辑流程

```
用户编辑块内容
    ↓
前端立即更新本地状态 (乐观更新)
    ↓
通过 Socket.io 广播变更
    ↓
异步持久化到数据库
    ↓
其他客户端接收更新
```

### 1.3 数据模型

#### 1.3.1 文档实体 (DocumentEntity)

```typescript
// backend/src/documents/document.entity.ts
@Entity('documents')
@Tree("closure-table")
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', default: 'document' })
  type: string; // 'document' | 'folder' | 'workspace'

  @Column({ type: 'text', nullable: true })
  summary: string; // 智能摘要

  @Column({ type: 'boolean', default: false })
  isStarred: boolean; // 收藏

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean; // 软删除

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @OneToMany(() => BlockEntity, (block) => block.document, { cascade: true })
  blocks: BlockEntity[];

  @TreeChildren()
  children: DocumentEntity[];

  @TreeParent()
  parent: DocumentEntity;
}
```

#### 1.3.2 块实体 (BlockEntity)

```typescript
@Entity('blocks')
export class BlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'callout' | 'divider' | 'code' | 'image' | 'table'

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: any; // { checked?: boolean, language?: string, url?: string }

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => DocumentEntity, (doc) => doc.blocks, { onDelete: 'CASCADE' })
  document: DocumentEntity;
}
```

### 1.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/documents` | 获取文档列表 |
| GET | `/documents/tree` | 获取文档树结构 |
| GET | `/documents/:id` | 获取单个文档 |
| POST | `/documents` | 创建文档 |
| PATCH | `/documents/:id` | 更新文档标题 |
| POST | `/documents/:id/toggle-star` | 收藏/取消收藏 |
| POST | `/documents/:id/trash` | 移至回收站 |
| POST | `/documents/:id/restore` | 从回收站恢复 |
| DELETE | `/documents/:id` | 永久删除 |
| POST | `/documents/:id/analyze` | 智能分析文档 |

### 1.5 状态转换

```
文档状态:
  active (正常) ←→ trash (回收站)
                    ↓
              deleted (已永久删除)

块操作:
  created → modified → saved → synced

文档加载状态:
  loading → loaded → editing
           ↓ (offline)
        offline-mode
```

### 1.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 网络断开 | 使用 localStorage 缓存，支持离线编辑 |
| 大文档加载 | 分块加载 (chunked loading)，每次 50 个块 |
| 并发编辑冲突 | 乐观锁 + 最后写入胜出策略 |
| 文档不存在 | 返回 404，前端显示错误提示 |
| 权限不足 | 返回 403，提示用户权限不足 |

---

## 2. 实时协作同步流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 多个用户同时编辑同一文档，需要实时同步变更 |
| **任务 (T)** | 实现毫秒级同步、光标追踪、输入状态显示 |
| **行动 (A)** | 基于 Socket.io 实现 WebSocket 双向通信，使用 Redis 缓存实时状态 |
| **结果 (R)** | 用户可以看到其他人的编辑、光标位置和输入状态 |

### 2.2 详细流程步骤

#### 2.2.1 加入文档房间

```
用户打开文档
    ↓
Socket 连接 (socketClient.connect)
    ↓
emit 'joinDocument' { docId, userName }
    ↓
服务器将用户加入文档房间
    ↓
服务器返回文档完整数据 (documentLoaded)
    ↓
服务器广播在线用户列表 (onlineUsersUpdate)
```

#### 2.2.2 块更新同步

```
用户编辑块内容
    ↓
emit 'updateBlock' { docId, blockId, content, type?, properties? }
    ↓
服务器立即广播给房间内其他用户 (blockUpdated)
    ↓
服务器异步持久化到数据库
    ↓
其他客户端接收并更新本地状态
```

#### 2.2.3 光标追踪

```
用户移动光标
    ↓
emit 'cursorMove' { docId, userId, position: { x, y } }
    ↓
服务器广播给房间内其他用户 (cursorMoved)
    ↓
其他客户端显示用户光标位置
```

#### 2.2.4 输入状态

```
用户开始输入
    ↓
emit 'typing' { docId, userId, userName }
    ↓
服务器广播 (userTyping)
    ↓
显示 "XXX 正在输入..."
    ↓
超时自动清除 (3秒)
```

### 2.3 数据模型

#### 2.3.1 编辑操作记录 (EditOperationEntity)

```typescript
// backend/src/documents/edit-operation.entity.ts
@Entity('edit_operations')
export class EditOperationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid', nullable: true })
  blockId: string;

  @Column({ type: 'varchar', length: 20 })
  operationType: 'insert' | 'delete' | 'update' | 'move' | 'add' | 'remove' | 'transform';

  @Column({ type: 'jsonb' })
  operationData: {
    oldValue?: any;
    newValue?: any;
    position?: number;
    fromPosition?: number;
    toPosition?: number;
  };

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  userName: string;

  @Column({ type: 'int' })
  versionNumber: number; // 操作发生时的版本号

  @Column({ type: 'bigint' })
  timestamp: number; // 毫秒时间戳

  @Column({ type: 'int', default: 0 })
  vectorClock: number; // 简单版本向量
}
```

### 2.4 Socket.io 事件

#### 2.4.1 客户端发送事件

| 事件名 | 载荷 | 描述 |
|--------|------|------|
| `joinDocument` | `{ docId, userName }` | 加入文档房间 |
| `updateBlock` | `{ docId, blockId, content, type?, properties? }` | 更新块 |
| `updateBlocksBatch` | `{ docId, blocks: [] }` | 批量更新块 |
| `loadBlocksChunked` | `{ docId, offset, limit }` | 分块加载 |
| `syncBlocks` | `{ docId, since }` | 增量同步 |
| `typing` | `{ docId, userId, userName }` | 输入状态 |
| `cursorMove` | `{ docId, userId, position: { x, y } }` | 光标移动 |
| `chatMessage` | `{ docId, userId, userName, content, timestamp, mentions? }` | 聊天消息 |
| `messageReaction` | `{ docId, messageIndex, emoji, userName, action }` | 消息反应 |

#### 2.4.2 服务器发送事件

| 事件名 | 载荷 | 描述 |
|--------|------|------|
| `documentLoaded` | `Document` | 文档加载完成 |
| `onlineUsersUpdate` | `User[]` | 在线用户列表更新 |
| `blockUpdated` | `{ docId, blockId, content, type?, properties? }` | 块更新 |
| `blocksUpdated` | `{ docId, blocks: [] }` | 批量块更新 |
| `blocksChunked` | `{ docId, blocks, total }` | 分块数据 |
| `blocksSynced` | `{ docId, updated, created, deleted }` | 增量同步结果 |
| `userTyping` | `{ docId, userId, userName }` | 用户输入状态 |
| `cursorMoved` | `{ docId, userId, position }` | 光标移动 |
| `chatMessage` | `ChatMessage` | 新聊天消息 |
| `messageReaction` | `MessageReaction` | 消息反应 |

### 2.5 状态转换

```
Socket 连接状态:
  disconnected → connecting → connected
                              ↓
                           error
                              ↓
                           reconnecting

文档协作状态:
  alone → editing-with-others → conflict-detected → resolved

用户在线状态:
  offline → online → away → offline
```

### 2.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 用户意外断开 | 服务器自动清理 Redis 光标缓存，更新在线列表 |
| 高频输入 | 使用 Redis 缓存输入状态，3秒超时自动清除 |
| 网络延迟 | 乐观更新本地状态，失败回滚 |
| 大文件同步 | 分块加载 + 增量同步 |
| 块锁定 | 使用 Redis 实现块级锁，防止并发冲突 |

---

## 3. 版本历史管理流程

### 3.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户需要查看文档历史版本、恢复到某个版本、或对比不同版本 |
| **任务 (T)** | 实现完整的版本历史系统，支持自动保存和手动保存 |
| **行动 (A)** | 每次保存创建文档快照，存储完整块数据，支持版本对比和回退 |
| **结果 (R)** | 用户可以随时查看历史、恢复到任意版本 |

### 3.2 详细流程步骤

#### 3.2.1 版本保存

```
用户编辑完成 (自动保存 / 手动保存)
    ↓
检查版本变更 (与上次保存对比)
    ↓
创建版本快照 (DocumentVersionEntity)
    ↓
存储版本元数据 (版本号、字数、块数)
    ↓
版本创建成功通知
```

#### 3.2.2 版本查看

```
用户打开版本历史面板
    ↓
GET /documents/:id/versions
    ↓
返回版本列表 (分页)
    ↓
用户选择查看某个版本
    ↓
GET /documents/:id/versions/:versionId
    ↓
返回版本快照数据
```

#### 3.2.3 版本恢复

```
用户选择恢复到某个版本
    ↓
确认恢复操作
    ↓
将版本快照的块数据覆盖当前文档
    ↓
创建新版本 (标记为"从版本X恢复")
    ↓
同步给所有在线用户
```

### 3.3 数据模型

#### 3.3.1 版本实体 (DocumentVersionEntity)

```typescript
// backend/src/documents/version.entity.ts
@Entity('document_versions')
export class DocumentVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'int' })
  versionNumber: number; // 版本号: 1, 2, 3...

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'jsonb' })
  blocks: {
    id: string;
    type: string;
    content: string;
    properties?: any;
    order: number;
  }[];

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'varchar', length: 100 })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  description: string; // '自动保存' | '手动保存' | '从版本X恢复'

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    autoSave: boolean;
    wordCount: number;
    blockCount: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}
```

### 3.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/documents/:id/versions` | 获取版本列表 |
| GET | `/documents/:id/versions/:versionId` | 获取单个版本详情 |
| POST | `/documents/:id/versions` | 创建新版本 (手动保存) |
| POST | `/documents/:id/versions/:versionId/restore` | 恢复到指定版本 |
| DELETE | `/documents/:id/versions/:versionId` | 删除指定版本 |

### 3.5 状态转换

```
版本状态:
  created → active → restored
              ↓
         archived (旧版本自动归档)

版本类型:
  auto-save (自动保存) ←→ manual-save (手动保存)
         ↓
    restored (恢复版本)
```

### 3.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 版本数量限制 | 最多保留 100 个版本，超出自动归档旧版本 |
| 大文档版本存储 | 仅存储差异数据，定期压缩 |
| 并发保存冲突 | 最后保存优先，保留冲突版本供选择 |
| 版本恢复中断 | 使用事务确保原子性，失败回滚 |

---

## 4. 总结

文档协作流程的核心设计要点:

1. **原子化块结构**: 所有内容都是块，支持多种类型
2. **离线优先**: 使用 localStorage 缓存，支持离线编辑
3. **实时同步**: 基于 Socket.io 的毫秒级同步
4. **版本管理**: 完整的历史版本系统，支持任意回退
5. **冲突处理**: 乐观锁 + 最后写入胜出策略
