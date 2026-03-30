# FastDocument 数据库存储服务详细构建笔记

## 目录
1. [数据库概览](#数据库概览)
2. [核心实体表结构](#核心实体表结构)
3. [存储服务详解](#存储服务详解)
4. [索引与性能优化](#索引与性能优化)
5. [数据关系图](#数据关系图)
6. [API 端点汇总](#api-端点汇总)

---

## 数据库概览

### 技术栈
- **主数据库**: PostgreSQL (端口: 15432)
- **缓存数据库**: Redis (端口: 16379)
- **ORM**: TypeORM
- **连接池配置**:
  - 最大连接数: 20
  - 最小连接数: 5
  - 连接超时: 30000ms
  - 空闲超时: 10000ms

### 数据库命名规范
- 表名使用小写字母和下划线
- 主键使用 UUID (uuid)
- 时间戳使用 `createdAt` 和 `updatedAt`
- 软删除使用 `isDeleted` 布尔字段
- JSON 字段使用 `jsonb` 类型

---

## 核心实体表结构

### 1. 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar VARCHAR(500),
  display_name VARCHAR(255),
  phone VARCHAR(50),
  department VARCHAR(255),
  title VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  system_role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'offline',
  last_active_at TIMESTAMP,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**存储服务**: `backend/src/auth/auth.service.ts`
- 用户注册与认证
- JWT Token 生成与验证
- 用户状态管理

---

### 2. 文档表 (documents)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'document',
  summary TEXT,
  is_starred BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  cover VARCHAR(500),
  icon VARCHAR(100),
  color VARCHAR(50),
  sort INT DEFAULT 0,
  owner_id UUID REFERENCES users(id),
  space_id UUID,
  members JSONB DEFAULT '[]',
  permission VARCHAR(50) DEFAULT 'private',
  allow_comment BOOLEAN DEFAULT true,
  allow_copy BOOLEAN DEFAULT true,
  allow_download BOOLEAN DEFAULT true,
  password VARCHAR(255),
  expires_at TIMESTAMP,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  current_version INT DEFAULT 0,
  edit_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_documents_space ON documents(space_id);
CREATE INDEX idx_documents_starred ON documents(is_starred) WHERE is_starred = true;
CREATE INDEX idx_documents_deleted ON documents(is_deleted) WHERE is_deleted = false;
```

**存储服务**: `backend/src/documents/documents.service.ts`
- 文档 CRUD 操作
- 文档树管理
- 收藏/回收站/永久删除
- 智能摘要分析

---

### 3. 文档块表 (blocks)

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT DEFAULT '',
  properties JSONB,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_blocks_document ON blocks(document_id);
CREATE INDEX idx_blocks_order ON blocks(document_id, "order");
```

**存储服务**: 内嵌在 `documents.service.ts`
- 块级 CRUD
- 块类型转换
- 块属性更新

---

### 4. 文档版本表 (document_versions)

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_name VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_versions_document ON document_versions(document_id);
CREATE INDEX idx_versions_number ON document_versions(document_id, version_number);
CREATE INDEX idx_versions_created ON document_versions(created_at);
```

**存储服务**: `backend/src/documents/version.service.ts`
- 版本创建 (手动/自动)
- 版本查询与回退
- 版本比较与差异
- 旧版本清理

---

### 5. 编辑操作表 (edit_operations)

```sql
CREATE TABLE edit_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  block_id UUID,
  operation_type VARCHAR(20) NOT NULL,
  operation_data JSONB NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100) NOT NULL,
  version_number INT DEFAULT 0,
  timestamp BIGINT NOT NULL,
  vector_clock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_operations_document ON edit_operations(document_id);
CREATE INDEX idx_operations_block ON edit_operations(block_id);
CREATE INDEX idx_operations_user ON edit_operations(user_id);
CREATE INDEX idx_operations_timestamp ON edit_operations(timestamp);
```

**存储服务**: `backend/src/documents/edit-operation.service.ts`
- 操作记录与审计
- 冲突检测
- 历史追溯

---

### 6. 块锁表 (block_locks)

```sql
CREATE TABLE block_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  block_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100) NOT NULL,
  lock_type VARCHAR(20) DEFAULT 'edit',
  locked_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_locks_document ON block_locks(document_id);
CREATE INDEX idx_locks_block ON block_locks(block_id);
CREATE INDEX idx_locks_user ON block_locks(user_id);
CREATE INDEX idx_locks_expires ON block_locks(expires_at) WHERE is_active = true;
```

**存储服务**: `backend/src/documents/block-lock.service.ts`
- 块级编辑锁
- 锁获取/释放/刷新
- 过期锁清理

---

### 7. 评论表 (comments)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  block_id UUID,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  resolved BOOLEAN DEFAULT false,
  reactions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_comments_block ON comments(block_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_resolved ON comments(resolved) WHERE resolved = false;
```

**存储服务**: `backend/src/comments/comments.service.ts`
- 评论 CRUD
- 评论回复/线程
- 反应/表情
- 评论解决

---

### 8. 批注表 (annotations)

```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  block_id UUID,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  color VARCHAR(50),
  start_offset INT NOT NULL,
  end_offset INT NOT NULL,
  content TEXT,
  original_content TEXT,
  status VARCHAR(50) DEFAULT 'open',
  assignee_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_annotations_document ON annotations(document_id);
CREATE INDEX idx_annotations_block ON annotations(block_id);
CREATE INDEX idx_annotations_status ON annotations(status) WHERE status = 'open';
```

**存储服务**: `backend/src/comments/annotations.service.ts`
- 批注 CRUD
- 批注类型 (高亮/下划线/删除线/建议等)
- 批注状态管理
- 批注指派

---

### 9. 空间表 (knowledge_spaces)

```sql
CREATE TABLE knowledge_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  owner_name VARCHAR(100) NOT NULL,
  cover VARCHAR(500),
  icon VARCHAR(100),
  color VARCHAR(50),
  members JSONB DEFAULT '[]',
  settings JSONB,
  permission VARCHAR(50) DEFAULT 'private',
  is_active BOOLEAN DEFAULT true,
  document_count INT DEFAULT 0,
  member_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_spaces_owner ON knowledge_spaces(owner_id);
CREATE INDEX idx_spaces_active ON knowledge_spaces(is_active) WHERE is_active = true;
```

---

### 10. 知识库表 (knowledge_bases)

```sql
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES knowledge_spaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(50),
  cover VARCHAR(500),
  owner_id UUID REFERENCES users(id),
  members JSONB DEFAULT '[]',
  permission VARCHAR(50) DEFAULT 'private',
  is_public BOOLEAN DEFAULT false,
  share_link VARCHAR(500),
  share_password VARCHAR(255),
  allow_download BOOLEAN DEFAULT true,
  allow_copy BOOLEAN DEFAULT true,
  share_expires_at TIMESTAMP,
  sort INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_bases_space ON knowledge_bases(space_id);
CREATE INDEX idx_bases_owner ON knowledge_bases(owner_id);
CREATE INDEX idx_bases_public ON knowledge_bases(is_public) WHERE is_public = true;
```

**存储服务**: `backend/src/knowledge/knowledge.service.ts`
- 空间/知识库 CRUD
- 成员权限管理
- 目录树管理

---

### 11. 知识节点表 (knowledge_nodes)

```sql
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  parent_id UUID,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  "order" INT DEFAULT 0,
  content TEXT,
  cover VARCHAR(500),
  icon VARCHAR(100),
  permission VARCHAR(50) DEFAULT 'inherit',
  sort INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_nodes_base ON knowledge_nodes(base_id);
CREATE INDEX idx_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX idx_nodes_order ON knowledge_nodes(base_id, "order");
```

---

### 12. 会议表 (meetings)

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  host_id UUID REFERENCES users(id),
  host_name VARCHAR(100) NOT NULL,
  scheduled_at BIGINT,
  started_at BIGINT,
  ended_at BIGINT,
  participants JSONB DEFAULT '[]',
  recording_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_meetings_host ON meetings(host_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
```

**存储服务**: `backend/src/meetings/meetings.service.ts`
- 会议创建与管理
- 会议加入/离开
- 会议状态管理
- LiveKit 集成

---

### 13. 项目表 (projects)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  owner_name VARCHAR(100) NOT NULL,
  members JSONB DEFAULT '[]',
  columns JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_projects_owner ON projects(owner_id);
```

---

### 14. 任务表 (tasks)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  column_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  assignee_id UUID,
  assignee_name VARCHAR(100),
  due_date BIGINT,
  tags TEXT[],
  subtasks JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  linked_documents TEXT[],
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);
```

**存储服务**: `backend/src/projects/projects.service.ts`
- 项目 CRUD
- 任务 CRUD
- 看板列管理
- 任务排序

---

### 15. 分享表 (shares)

```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  space_id UUID,
  knowledge_base_id UUID,
  knowledge_node_id UUID,
  created_by UUID REFERENCES users(id),
  password VARCHAR(255),
  expires_at TIMESTAMP,
  max_views INT,
  view_count INT DEFAULT 0,
  allow_download BOOLEAN DEFAULT true,
  allow_copy BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_shares_code ON shares(code);
CREATE INDEX idx_shares_document ON shares(document_id);
CREATE INDEX idx_shares_expires ON shares(expires_at) WHERE expires_at IS NOT NULL;
```

**存储服务**: `backend/src/share/share.service.ts`
- 生成分享链接
- 分享访问控制
- 访问统计

---

## 存储服务详解

### 文档存储服务 (DocumentsService)

**文件**: `backend/src/documents/documents.service.ts`

```typescript
// 核心方法
findTree(userId: string)                    // 获取文档树
findByCategory(userId, category)             // 按分类查找
findOne(id, userId?)                         // 获取单个文档
create(title, parentId?, type?, blocks?, ownerId?)  // 创建文档
updateTitle(id, title)                       // 更新标题
updateBlock(docId, blockId, content, type?, properties?)  // 更新块
toggleStar(id, userId)                       // 切换收藏
moveToTrash(id, userId)                      // 移至回收站
restoreFromTrash(id, userId)                 // 从回收站恢复
permanentlyDelete(id, userId)                // 永久删除
analyzeAndSummary(id)                        // 智能摘要
```

### 版本管理服务 (VersionService)

**文件**: `backend/src/documents/version.service.ts`

```typescript
// 核心方法
createVersion(dto)                           // 创建版本
getVersions(documentId)                       // 获取版本列表
getVersion(documentId, versionId)             // 获取版本详情
rollbackToVersion(documentId, versionId, userId, userName)  // 回退
compareVersions(documentId, versionAId, versionBId)  // 比较版本
cleanupOldVersions(documentId)                // 清理旧版本
autoSaveVersion(...)                         // 自动保存
```

### 块锁服务 (BlockLockService)

**文件**: `backend/src/documents/block-lock.service.ts`

```typescript
// 核心方法
acquireLock(dto)                             // 获取锁
releaseLock(lockId)                          // 释放锁
releaseUserLocks(documentId, userId)         // 释放用户所有锁
refreshLock(lockId, userId)                  // 刷新锁
getActiveLocks(documentId)                   // 获取活跃锁
getActiveLock(documentId, blockId)           // 获取块锁
forceReleaseLock(lockId, adminUserId)       // 强制释放
cleanupExpiredLocks(documentId)              // 清理过期锁
isBlockLockedByUser(documentId, blockId, userId)  // 检查锁
```

### 编辑操作服务 (EditOperationService)

**文件**: `backend/src/documents/edit-operation.service.ts`

```typescript
// 核心方法
recordOperation(dto)                         // 记录操作
getOperations(documentId, limit?)            // 获取操作历史
getOperationsByBlock(documentId, blockId, limit?)  // 获取块操作
getOperationsByUser(documentId, userId, limit?)    // 获取用户操作
detectConflict(documentId, blockId, userId, timeWindowMs)  // 检测冲突
recordOperations(operations[])               // 批量记录
cleanupOldOperations(documentId?)            // 清理旧记录
```

### 操作转换服务 (OperationTransformService)

**文件**: `backend/src/documents/operation-transform.service.ts`

```typescript
// 核心方法
transformOperation(incomingOp, concurrentOp) // 转换操作
detectConflict(op1, op2)                    // 检测冲突
mergeOperations(operations[])                // 合并操作
applyOperation(operation, currentState)     // 应用操作
```

### 评论服务 (CommentsService)

**文件**: `backend/src/comments/comments.service.ts`

```typescript
// 核心方法
findByDocument(documentId)                   // 获取文档评论
create(dto)                                  // 创建评论
update(id, content)                         // 更新评论
delete(id)                                  // 删除评论
reply(commentId, dto)                       // 回复评论
react(commentId, emoji, userName, action)   // 反应
resolve(commentId)                          // 解决评论
```

### 批注服务 (AnnotationsService)

**文件**: `backend/src/comments/annotations.service.ts`

```typescript
// 核心方法
findByDocument(documentId)                   // 获取文档批注
create(dto)                                  // 创建批注
update(id, updates)                          // 更新批注
delete(id)                                   // 删除批注
resolve(id, status)                          // 解决批注
assign(id, assigneeId)                      // 指派批注
```

### 知识库服务 (KnowledgeService)

**文件**: `backend/src/knowledge/knowledge.service.ts`

```typescript
// 空间方法
createSpace(dto)                             // 创建空间
getSpaces(userId)                            // 获取空间列表
updateSpace(id, dto)                        // 更新空间
deleteSpace(id)                             // 删除空间

// 知识库方法
createKnowledgeBase(spaceId, dto)           // 创建知识库
getKnowledgeBases(spaceId)                  // 获取知识库列表
updateKnowledgeBase(id, dto)                // 更新知识库
deleteKnowledgeBase(id)                     // 删除知识库

// 节点方法
createNode(baseId, dto)                    // 创建节点
getTree(baseId)                             // 获取目录树
moveNode(id, newParentId)                   // 移动节点
deleteNode(id)                              // 删除节点
```

### 会议服务 (MeetingsService)

**文件**: `backend/src/meetings/meetings.service.ts`

```typescript
// 核心方法
create(dto)                                  // 创建会议
findAll(userId)                             // 获取会议列表
findOne(id)                                 // 获取会议详情
join(id, userId, userName)                  // 加入会议
leave(id, userId)                           // 离开会议
getToken(id, userId, userName)              // 获取 LiveKit Token
updateStatus(id, status)                    // 更新状态
```

### 项目服务 (ProjectsService)

**文件**: `backend/src/projects/projects.service.ts`

```typescript
// 项目方法
create(dto)                                  // 创建项目
findAll(userId)                             // 获取项目列表
findOne(id)                                 // 获取项目详情
update(id, dto)                             // 更新项目
delete(id)                                  // 删除项目

// 任务方法
createTask(projectId, dto)                  // 创建任务
updateTask(id, dto)                         // 更新任务
deleteTask(id)                              // 删除任务
moveTask(id, columnId, order)               // 移动任务
updateTaskOrder(projectId, tasks)           // 更新任务顺序
```

---

## 索引与性能优化

### 核心索引策略

1. **外键索引**: 所有外键字段建立索引
2. **查询频率索引**:
   - `documents.owner_id`
   - `documents.is_starred`
   - `documents.is_deleted`
   - `comments.document_id`
   - `annotations.document_id`
3. **复合索引**:
   - `blocks(document_id, order)`
   - `document_versions(document_id, version_number)`
   - `tasks(project_id, column_id)`

### 查询优化技巧

1. **使用 `SELECT` 限定列**: 避免 `SELECT *`
2. **分页查询**: 使用 `take()` 和 `skip()`
3. **关系预加载**: 使用 `relations: ['field']`
4. **缓存策略**: Redis 缓存热点数据
5. **批处理**: 批量插入/更新使用 `save([])`

---

## 数据关系图

```
users (1) ──────< (N) documents
  │                    │
  │                    ├─< (N) blocks
  │                    ├─< (N) comments
  │                    ├─< (N) annotations
  │                    ├─< (N) document_versions
  │                    ├─< (N) edit_operations
  │                    └─< (N) block_locks

users (1) ──────< (N) meetings
users (1) ──────< (N) projects
                     │
                     └─< (N) tasks

knowledge_spaces (1) ─< (N) knowledge_bases
                                  │
                                  └─< (N) knowledge_nodes
```

---

## API 端点汇总

### 认证 (Auth)
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册

### 文档 (Documents)
- `GET /documents` - 获取文档列表
- `GET /documents/tree` - 获取文档树
- `GET /documents/:id` - 获取文档详情
- `POST /documents` - 创建文档
- `PATCH /documents/:id` - 更新文档
- `DELETE /documents/:id` - 删除文档
- `POST /documents/:id/toggle-star` - 切换收藏
- `POST /documents/:id/trash` - 移至回收站
- `POST /documents/:id/restore` - 恢复文档
- `POST /documents/:id/analyze` - 智能分析
- `GET /documents/:id/versions` - 获取版本列表
- `POST /documents/:id/versions` - 创建版本
- `POST /documents/:id/versions/:vid/rollback` - 回退版本
- `POST /documents/:id/blocks/:bid/lock` - 获取块锁
- `DELETE /documents/:id/blocks/:bid/lock` - 释放块锁

### 评论 (Comments)
- `GET /documents/:id/comments` - 获取评论
- `POST /documents/:id/comments` - 创建评论
- `PUT /comments/:id` - 更新评论
- `DELETE /comments/:id` - 删除评论

### 批注 (Annotations)
- `GET /documents/:id/annotations` - 获取批注
- `POST /documents/:id/annotations` - 创建批注
- `PUT /annotations/:id` - 更新批注
- `DELETE /annotations/:id` - 删除批注

### 知识库 (Knowledge)
- `GET /knowledge/spaces` - 获取空间列表
- `POST /knowledge/spaces` - 创建空间
- `GET /knowledge/spaces/:id/bases` - 获取知识库
- `POST /knowledge/spaces/:id/bases` - 创建知识库

### 会议 (Meetings)
- `GET /meetings` - 获取会议列表
- `POST /meetings` - 创建会议
- `POST /meetings/:id/join` - 加入会议
- `POST /meetings/:id/leave` - 离开会议
- `GET /meetings/:id/token` - 获取令牌

### 项目 (Projects)
- `GET /projects` - 获取项目列表
- `POST /projects` - 创建项目
- `GET /projects/:id/tasks` - 获取任务
- `POST /projects/:id/tasks` - 创建任务
