# 知识库流程业务逻辑

本文档详细描述 FastDocument 项目中知识库（Knowledge Base）的业务流程，包括空间管理、知识库创建、文档组织等。

## 1. 空间和知识库创建流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 团队需要一个层级化的知识组织结构，顶层是空间（Space），对应团队/部门 |
| **任务 (T)** | 实现空间→知识库→文档的三级层次结构，支持成员权限管理 |
| **行动 (A)** | 管理员创建空间，在空间内创建知识库，设置成员角色和权限 |
| **结果 (R)** | 团队成员可以在各自权限范围内访问和管理知识库内容 |

### 1.2 详细流程步骤

#### 1.2.1 创建空间

```
管理员点击"创建空间"
    ↓
输入空间名称和描述
    ↓
POST /knowledge/spaces { name, description }
    ↓
后端创建空间实体
    ↓
创建者自动成为空间所有者
    ↓
返回空间数据
    ↓
前端更新空间列表
```

#### 1.2.2 创建知识库

```
用户进入空间
    ↓
点击"创建知识库"
    ↓
输入知识库名称、描述、图标、颜色
    ↓
POST /knowledge/spaces/:spaceId/bases { name, description, icon?, color? }
    ↓
后端创建知识库实体
    ↓
创建者自动成为知识库所有者
    ↓
返回知识库数据
    ↓
前端跳转知识库首页
```

#### 1.2.3 知识库分享

```
知识库所有者点击"分享"
    ↓
设置分享权限 (公开/密码保护)
    ↓
可选: 设置下载/复制权限
    ↓
可选: 设置过期时间
    ↓
生成分享链接
    ↓
POST /knowledge/bases/:id/share/link
    ↓
返回分享链接
```

### 1.3 数据模型

#### 1.3.1 空间实体 (SpaceEntity)

```typescript
// backend/src/knowledge/knowledge.entity.ts
@Entity("knowledge_spaces")
export class SpaceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;           // 空间名称

  @Column({ nullable: true })
  description?: string;   // 空间描述

  @Column()
  ownerId!: string;        // 所有者 ID

  @Column()
  ownerName!: string;      // 所有者名称

  @Column("jsonb", { default: [] })
  members!: { id: string; name: string; role: string }[];
  // 成员角色:
  // - owner: 所有者
  // - admin: 管理员
  // - editor: 编辑者
  // - reader: 读者

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

#### 1.3.2 知识库实体 (KnowledgeBaseEntity)

```typescript
@Entity("knowledge_bases")
export class KnowledgeBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  spaceId!: string;        // 所属空间 ID

  @Column()
  name!: string;           // 知识库名称

  @Column({ nullable: true })
  description?: string;   // 知识库描述

  @Column({ nullable: true })
  icon?: string;          // 图标

  @Column({ nullable: true })
  color?: string;         // 主题色

  @Column()
  ownerId!: string;        // 所有者 ID

  @Column("jsonb", { default: [] })
  members!: { id: string; name: string; role: string }[];

  // 分享相关字段
  @Column({ default: false })
  isPublic!: boolean;     // 是否公开

  @Column({ nullable: true })
  shareLink?: string;      // 分享链接

  @Column({ nullable: true })
  sharePassword?: string;  // 分享密码

  @Column({ default: true })
  allowDownload!: boolean; // 允许下载

  @Column({ default: true })
  allowCopy!: boolean;     // 允许复制

  @Column({ nullable: true })
  shareExpiresAt?: Date;   // 分享过期时间

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 1.4 API 调用

#### 1.4.1 空间 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/knowledge/spaces` | 获取空间列表 |
| POST | `/knowledge/spaces` | 创建空间 |
| GET | `/knowledge/spaces/:id` | 获取空间详情 |
| PUT | `/knowledge/spaces/:id` | 更新空间 |
| DELETE | `/knowledge/spaces/:id` | 删除空间 |

#### 1.4.2 知识库 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/knowledge/spaces/:spaceId/bases` | 获取知识库列表 |
| POST | `/knowledge/spaces/:spaceId/bases` | 创建知识库 |
| GET | `/knowledge/bases/:id` | 获取知识库详情 |
| PUT | `/knowledge/bases/:id` | 更新知识库 |
| DELETE | `/knowledge/bases/:id` | 删除知识库 |

#### 1.4.3 分享 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/knowledge/bases/:id/share` | 获取分享设置 |
| PUT | `/knowledge/bases/:id/share` | 更新分享设置 |
| POST | `/knowledge/bases/:id/share/link` | 生成分享链接 |
| DELETE | `/knowledge/bases/:id/share/link` | 撤销分享链接 |

### 1.5 状态转换

```
空间状态:
  active (活跃) → deleted (已删除)

知识库状态:
  active (活跃) → archived (已归档) → deleted (已删除)

分享状态:
  private (私有) ↔ public (公开) ↔ password-protected (密码保护)

成员角色:
  owner → admin → editor → reader
  (权限递减)
```

### 1.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 删除空间 | 确认框提示，级联删除所有知识库 |
| 知识库重名 | 允许重名，显示时使用唯一标识 |
| 成员权限不足 | 返回 403，提示权限不足 |
| 分享链接过期 | 提示链接已失效，需要重新生成 |

---

## 2. 文档组织和管理流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 知识库内的文档需要树状组织，支持文件夹嵌套和拖拽排序 |
| **任务 (T)** | 实现知识库的目录树结构，支持创建、移动、删除、重命名操作 |
| **行动 (A)** | 用户通过树形视图管理文档，后端维护父子层级关系 |
| **结果 (R)** | 清晰的文档组织结构，便于知识沉淀和查找 |

### 2.2 详细流程步骤

#### 2.2.1 创建节点

```
用户点击"新建"按钮
    ↓
选择"新建文件夹"或"新建文档"
    ↓
输入名称
    ↓
POST /knowledge/bases/:baseId/nodes { name, type, parentId? }
    ↓
后端创建节点实体
    ↓
返回节点数据
    ↓
前端更新目录树
```

#### 2.2.2 移动节点

```
用户拖拽节点到目标位置
    ↓
PUT /knowledge/nodes/:id/move { targetParentId, order }
    ↓
后端更新节点的父级和排序
    ↓
返回更新后的树结构
    ↓
前端更新目录树
```

#### 2.2.3 删除节点

```
用户右键点击节点
    ↓
选择"删除"
    ↓
(若是文件夹) 确认删除包含的所有内容
    ↓
DELETE /knowledge/nodes/:id
    ↓
后端检查是否有子节点
    ↓
若有子节点，提示先移动或删除
    ↓
删除节点
    ↓
前端更新目录树
```

### 2.3 数据模型

#### 2.3.1 知识库节点实体 (KnowledgeNodeEntity)

```typescript
@Entity("knowledge_nodes")
export class KnowledgeNodeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  baseId!: string;       // 所属知识库 ID

  @Column()
  parentId!: string;    // 父节点 ID (根节点为知识库 ID)

  @Column()
  name!: string;        // 节点名称

  @Column()
  type!: "folder" | "document";
  // 节点类型:
  // - folder: 文件夹
  // - document: 文档

  @Column({ default: 0 })
  order!: number;       // 排序

  @Column({ nullable: true })
  content?: string;     // 文档内容 (仅 document 类型)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/knowledge/bases/:baseId/tree` | 获取知识库目录树 |
| POST | `/knowledge/bases/:baseId/nodes` | 创建节点 |
| GET | `/knowledge/nodes/:id` | 获取节点详情 |
| PUT | `/knowledge/nodes/:id` | 更新节点 |
| PUT | `/knowledge/nodes/:id/move` | 移动节点 |
| DELETE | `/knowledge/nodes/:id` | 删除节点 |

### 2.5 状态转换

```
节点状态:
  active (活跃) → moving (移动中) → active
                        ↓
                   deleted (已删除)

节点类型:
  folder ↔ document (可相互转换)

层级关系:
  root (根) → level-1 → level-2 → ... (支持无限层级)
```

### 2.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 移动到自身 | 不允许，返回错误 |
| 移动到子节点 | 不允许，防止循环引用 |
| 删除非空文件夹 | 提示包含 X 个项目，确认后级联删除 |
| 节点名称为空 | 验证必填，返回 400 错误 |
| 名称过长 | 限制 100 字符，超出截断 |

---

## 3. 前端实现

### 3.1 Zustand Store

```typescript
// frontend/src/store/knowledgeStore.ts
interface KnowledgeState {
  spaces: Space[];
  currentSpace: Space | null;
  bases: KnowledgeBase[];
  currentBase: KnowledgeBase | null;
  tree: TreeNode[];
  isLoading: boolean;

  // 空间操作
  fetchSpaces: () => Promise<void>;
  createSpace: (data: CreateSpaceDto) => Promise<Space>;

  // 知识库操作
  fetchBases: (spaceId: string) => Promise<void>;
  createBase: (spaceId: string, data: CreateBaseDto) => Promise<KnowledgeBase>;

  // 节点操作
  fetchTree: (baseId: string) => Promise<void>;
  createNode: (baseId: string, data: CreateNodeDto) => Promise<TreeNode>;
  moveNode: (nodeId: string, targetParentId: string, order: number) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
}
```

### 3.2 数据结构

```typescript
interface Space {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  members: { id: string; name: string; role: string }[];
}

interface KnowledgeBase {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  members: { id: string; name: string; role: string }[];
  isPublic: boolean;
  shareLink?: string;
}

interface TreeNode {
  id: string;
  baseId: string;
  parentId: string;
  name: string;
  type: 'folder' | 'document';
  order: number;
  children?: TreeNode[];
}
```

---

## 4. 总结

知识库系统的核心设计要点:

1. **三级层次结构**: 空间 → 知识库 → 文档/文件夹
2. **灵活的权限体系**: owner / admin / editor / reader 四级权限
3. **树形目录管理**: 支持无限层级的文件夹嵌套
4. **分享功能**: 支持公开、密码保护、限时分享
5. **知识沉淀**: 清晰的组织结构便于团队知识积累
