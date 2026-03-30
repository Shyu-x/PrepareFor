# 源码深度分析 - FastDocument业务逻辑系统

## 一、文档概述

本文档深入分析 FastDocument 项目的业务逻辑系统，涵盖文档协作、知识库、项目管理、视频会议、评论批注、通知系统等核心业务功能。

---

## 二、文档协作系统

### 2.1 文档创建流程

#### 2.1.1 前端创建文档

```typescript
/**
 * 文档 Store - 创建文档
 * frontend/src/store/documentStore.ts
 */
export interface DocumentStore {
  // 创建文档
  createDocument: (
    title: string,
    parentId?: string,
    type?: 'document' | 'folder' | 'workspace',
    blocks?: Block[]
  ) => Promise<string>;

  // 加载文档
  loadDocument: (id: string) => Promise<Document>;

  // 更新文档
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;

  // 删除文档
  deleteDocument: (id: string) => Promise<void>;

  // 移至回收站
  trashDocument: (id: string) => Promise<void>;

  // 恢复文档
  restoreDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>()((set, get) => ({
  documents: new Map<string, Document>(),
  currentDocument: null,

  createDocument: async (title, parentId, type = 'document', blocks = []) => {
    try {
      const response = await api.post('/documents', {
        title,
        parentId,
        type,
        blocks,
      });

      const document = response.data;
      set((state) => {
        const newDocuments = new Map(state.documents);
        newDocuments.set(document.id, document);
        return { documents: newDocuments };
      });

      return document.id;
    } catch (error) {
      console.error('[DocumentStore] Create document error:', error);
      throw error;
    }
  },

  loadDocument: async (id) => {
    try {
      const response = await api.get(`/documents/${id}`);
      const document = response.data;

      set((state) => {
        const newDocuments = new Map(state.documents);
        newDocuments.set(document.id, document);
        return { documents: newDocuments, currentDocument: document };
      });

      return document;
    } catch (error) {
      console.error('[DocumentStore] Load document error:', error);
      throw error;
    }
  },

  // ... 其他方法
}));
```

#### 2.1.2 后端创建文档

```typescript
/**
 * 文档服务 - 创建文档
 * backend/src/documents/documents.service.ts
 */
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(BlockEntity)
    private blocksRepository: Repository<BlockEntity>,
    private editOperationService: EditOperationService,
  ) {}

  async create(
    title: string,
    parentId: string | null,
    type: 'document' | 'folder' | 'workspace',
    blocks: Partial<BlockEntity>[],
    userId: string,
  ): Promise<DocumentEntity> {
    // 创建文档实体
    const document = this.documentsRepository.create({
      title,
      type,
      ownerId: userId,
      parent: parentId ? { id: parentId } : null,
    });

    // 保存文档
    const savedDocument = await this.documentsRepository.save(document);

    // 创建初始块（如果有）
    if (blocks.length > 0) {
      const blockEntities = blocks.map((block) =>
        this.blocksRepository.create({
          ...block,
          document: savedDocument,
        })
      );

      await this.blocksRepository.save(blockEntities);
    }

    // 记录编辑操作
    await this.editOperationService.recordOperation({
      documentId: savedDocument.id,
      operationType: 'add',
      operationData: {
        documentId: savedDocument.id,
        title,
      },
      userId,
      userName: 'Unknown', // 从 token 获取
    });

    return savedDocument;
  }

  async findOne(id: string): Promise<DocumentEntity> {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['blocks', 'parent', 'children'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async findTree(userId: string): Promise<DocumentEntity[]> {
    return this.documentsRepository.findTrees({
      where: { ownerId: userId, isDeleted: false },
      relations: ['blocks', 'parent'],
    });
  }

  // ... 其他方法
}
```

### 2.2 实时协作同步

#### 2.2.1 Socket.io 连接

```typescript
/**
 * Socket 客户端
 * frontend/src/lib/socketClient.ts
 */
export class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string, token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const socketClient = new SocketClient();
```

#### 2.2.2 Socket 网关

```typescript
/**
 * 文档协作网关
 * backend/src/documents/documents.gateway.ts
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/documents',
})
export class DocumentsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private documentsService: DocumentsService,
    private blocksService: BlocksService,
    private cacheService: CacheService,
  ) {}

  /**
   * 加入文档房间
   */
  @SubscribeMessage('joinDocument')
  async handleJoinDocument(
    @MessageBody() data: { docId: string; userName: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { docId, userName, userId } = data;

    // 验证文档权限
    const document = await this.documentsService.findOne(docId);
    if (!document) {
      throw new WsException('Document not found');
    }

    // 加入房间
    client.join(`document:${docId}`);

    // 更新在线用户列表（存储到 Redis）
    await this.cacheService.addOnlineUser(docId, {
      userId,
      userName,
      socketId: client.id,
      joinedAt: Date.now(),
    });

    // 获取当前在线用户列表
    const onlineUsers = await this.cacheService.getOnlineUsers(docId);

    // 发送文档数据
    client.emit('documentLoaded', document);

    // 广播在线用户列表更新
    this.server.to(`document:${docId}`).emit('onlineUsersUpdate', onlineUsers);

    return { success: true, onlineUsers };
  }

  /**
   * 更新块内容
   */
  @SubscribeMessage('updateBlock')
  async handleUpdateBlock(
    @MessageBody() data: {
      docId: string;
      blockId: string;
      content: string;
      type?: string;
      properties?: any;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { docId, blockId, content, type, properties } = data;

    // 更新块
    const block = await this.blocksService.update(blockId, {
      content,
      type,
      properties,
    });

    // 广播更新
    this.server.to(`document:${docId}`).emit('blockUpdated', {
      docId,
      blockId,
      content,
      type,
      properties,
    });

    // 记录编辑操作
    await this.editOperationService.recordOperation({
      documentId: docId,
      blockId,
      operationType: 'update',
      operationData: {
        content,
        type,
        properties,
      },
      userId: client.handshake.auth.userId,
      userName: client.handshake.auth.userName,
    });

    return { success: true, block };
  }

  /**
   * 批量更新块
   */
  @SubscribeMessage('updateBlocksBatch')
  async handleUpdateBlocksBatch(
    @MessageBody() data: { docId: string; blocks: Partial<BlockEntity>[] },
  ) {
    const { docId, blocks } = data;

    // 批量更新
    const updatedBlocks = await this.blocksService.updateBatch(blocks);

    // 广播更新
    this.server.to(`document:${docId}`).emit('blocksUpdated', {
      docId,
      blocks: updatedBlocks,
    });

    return { success: true, blocks: updatedBlocks };
  }

  /**
   * 输入状态
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { docId: string; userId: string; userName: string },
  ) {
    const { docId, userId, userName } = data;

    // 缓存输入状态（3秒过期）
    await this.cacheService.setTypingStatus(docId, userId, userName);

    // 广播输入状态
    this.server.to(`document:${docId}`).emit('userTyping', {
      docId,
      userId,
      userName,
    });

    // 3秒后清除
    setTimeout(async () => {
      await this.cacheService.clearTypingStatus(docId, userId);
      this.server.to(`document:${docId}`).emit('typingStopped', {
        docId,
        userId,
      });
    }, 3000);

    return { success: true };
  }

  /**
   * 光标移动
   */
  @SubscribeMessage('cursorMove')
  async handleCursorMove(
    @MessageBody() data: {
      docId: string;
      userId: string;
      userName: string;
      position: { x: number; y: number };
    },
  ) {
    const { docId, userId, userName, position } = data;

    // 缓存光标位置（30秒过期）
    await this.cacheService.setCursorPosition(docId, userId, userName, position);

    // 广播光标移动
    this.server
      .to(`document:${docId}`)
      .emit('cursorMoved', { docId, userId, userName, position });

    return { success: true };
  }

  /**
   * 断开连接处理
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // 查找用户所在的所有房间
    const rooms = client.rooms;

    rooms.forEach(async (room) => {
      if (room.startsWith('document:')) {
        const docId = room.split(':')[1];

        // 从在线用户列表中移除
        await this.cacheService.removeOnlineUser(docId, client.id);

        // 清除光标位置
        await this.cacheService.clearCursorPosition(docId, client.id);

        // 广播在线用户列表更新
        const onlineUsers = await this.cacheService.getOnlineUsers(docId);
        this.server.to(`document:${docId}`).emit('onlineUsersUpdate', onlineUsers);
      }
    });
  }
}
```

### 2.3 版本历史系统

#### 2.3.1 版本服务

```typescript
/**
 * 版本服务
 * backend/src/documents/version.service.ts
 */
@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(DocumentVersionEntity)
    private versionsRepository: Repository<DocumentVersionEntity>,
    @InjectRepository(DocumentEntity)
    private documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(BlockEntity)
    private blocksRepository: Repository<BlockEntity>,
  ) {}

  /**
   * 创建版本
   */
  async create(
    documentId: string,
    userId: string,
    userName: string,
    description: string = '手动保存',
    metadata?: any,
  ): Promise<DocumentVersionEntity> {
    // 获取文档及其所有块
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
      relations: ['blocks'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 获取当前版本号
    const lastVersion = await this.versionsRepository.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // 统计元数据
    const wordCount = document.blocks.reduce((count, block) => {
      return count + (block.content?.split(/\s+/).length || 0);
    }, 0);

    // 创建版本快照
    const version = this.versionsRepository.create({
      documentId,
      versionNumber,
      title: document.title,
      blocks: document.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        properties: block.properties,
        order: block.order,
      })),
      createdBy: userId,
      createdByName: userName,
      description,
      metadata: {
        autoSave: false,
        wordCount,
        blockCount: document.blocks.length,
        ...metadata,
      },
    });

    const savedVersion = await this.versionsRepository.save(version);

    // 检查版本数量限制
    await this.checkVersionLimit(documentId);

    return savedVersion;
  }

  /**
   * 查找文档的所有版本
   */
  async findByDocumentId(
    documentId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ versions: DocumentVersionEntity[]; total: number }> {
    const [versions, total] = await this.versionsRepository.findAndCount({
      where: { documentId },
      order: { versionNumber: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { versions, total };
  }

  /**
   * 恢复到指定版本
   */
  async restore(versionId: string, userId: string, userName: string): Promise<void> {
    // 获取版本快照
    const version = await this.versionsRepository.findOne({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // 获取文档
    const document = await this.documentsRepository.findOne({
      where: { id: version.documentId },
      relations: ['blocks'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 删除现有块
    await this.blocksRepository.delete({ document });

    // 重建块
    const blockEntities = version.blocks.map((blockData) =>
      this.blocksRepository.create({
        ...blockData,
        document,
      })
    );

    await this.blocksRepository.save(blockEntities);

    // 创建恢复版本
    await this.create(
      version.documentId,
      userId,
      userName,
      `从版本 ${version.versionNumber} 恢复`,
    );

    // 广播更新
    this.documentsGateway.server
      .to(`document:${version.documentId}`)
      .emit('documentRestored', {
        documentId: version.documentId,
        versionId: version.id,
      });
  }

  /**
   * 检查版本数量限制
   */
  private async checkVersionLimit(documentId: string) {
    const MAX_VERSIONS = 100;

    const count = await this.versionsRepository.count({ where: { documentId } });

    if (count > MAX_VERSIONS) {
      // 删除最旧的版本
      const oldVersions = await this.versionsRepository.find({
        where: { documentId },
        order: { versionNumber: 'ASC' },
        take: count - MAX_VERSIONS,
      });

      await this.versionsRepository.delete(oldVersions.map((v) => v.id));
    }
  }
}
```

---

## 三、知识库系统

### 3.1 空间管理

#### 3.1.1 空间实体

```typescript
/**
 * 空间实体
 * backend/src/knowledge-base/space.entity.ts
 */
@Entity('spaces')
export class SpaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'private' })
  visibility: 'private' | 'team' | 'public';

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'uuid', nullable: true })
  iconId: string;

  @Column({ type: 'jsonb', default: [] })
  members: {
    userId: string;
    userName: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joinedAt: number;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BaseEntity, (base) => base.space, { cascade: true, onDelete: 'CASCADE' })
  bases: BaseEntity[];
}
```

#### 3.1.2 空间服务

```typescript
/**
 * 空间服务
 * backend/src/knowledge-base/spaces.service.ts
 */
@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(SpaceEntity)
    private spacesRepository: Repository<SpaceEntity>,
  ) {}

  /**
   * 创建空间
   */
  async create(
    name: string,
    description: string,
    visibility: 'private' | 'team' | 'public',
    ownerId: string,
  ): Promise<SpaceEntity> {
    const space = this.spacesRepository.create({
      name,
      description,
      visibility,
      ownerId,
      members: [
        {
          userId: ownerId,
          userName: 'Owner',
          role: 'owner',
          joinedAt: Date.now(),
        },
      ],
    });

    return await this.spacesRepository.save(space);
  }

  /**
   * 添加成员
   */
  async addMember(
    spaceId: string,
    userId: string,
    userName: string,
    role: 'admin' | 'editor' | 'viewer',
  ): Promise<SpaceEntity> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // 检查是否已是成员
    const existingMember = space.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw new ConflictException('User already a member');
    }

    space.members.push({
      userId,
      userName,
      role,
      joinedAt: Date.now(),
    });

    return await this.spacesRepository.save(space);
  }

  /**
   * 移除成员
   */
  async removeMember(spaceId: string, userId: string): Promise<SpaceEntity> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // 不能移除所有者
    const member = space.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove space owner');
    }

    space.members = space.members.filter((m) => m.userId !== userId);

    return await this.spacesRepository.save(space);
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    spaceId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer',
  ): Promise<SpaceEntity> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // 不能修改所有者角色
    const member = space.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new BadRequestException('Cannot modify owner role');
    }

    member.role = role;

    return await this.spacesRepository.save(space);
  }
}
```

### 3.2 Base 管理

#### 3.2.1 Base 实体

```typescript
/**
 * Base 实体
 * backend/src/knowledge-base/base.entity.ts
 */
@Entity('bases')
export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'grid' })
  view: 'grid' | 'kanban' | 'calendar' | 'list';

  @Column({ type: 'uuid', nullable: true })
  iconId: string;

  @Column({ type: 'uuid' })
  spaceId: string;

  @ManyToOne(() => SpaceEntity, (space) => space.bases, { onDelete: 'CASCADE' })
  space: SpaceEntity;

  @Column({ type: 'jsonb', default: [] })
  tables: {
    id: string;
    name: string;
    records: Record<string, any>[];
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 3.2.2 Base 服务

```typescript
/**
 * Base 服务
 * backend/src/knowledge-base/bases.service.ts
 */
@Injectable()
export class BasesService {
  constructor(
    @InjectRepository(BaseEntity)
    private basesRepository: Repository<BaseEntity>,
  ) {}

  /**
   * 创建 Base
   */
  async create(
    spaceId: string,
    name: string,
    description: string,
    view: 'grid' | 'kanban' | 'calendar' | 'list' = 'grid',
  ): Promise<BaseEntity> {
    const base = this.basesRepository.create({
      name,
      description,
      view,
      spaceId,
      tables: [
        {
          id: generateId(),
          name: 'Table 1',
          records: [],
        },
      ],
    });

    return await this.basesRepository.save(base);
  }

  /**
   * 更新 Base 视图
   */
  async updateView(
    baseId: string,
    view: 'grid' | 'kanban' | 'calendar' | 'list',
  ): Promise<BaseEntity> {
    const base = await this.basesRepository.findOne({
      where: { id: baseId },
    });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    base.view = view;

    return await this.basesRepository.save(base);
  }

  /**
   * 添加表格
   */
  async addTable(
    baseId: string,
    name: string,
  ): Promise<BaseEntity> {
    const base = await this.basesRepository.findOne({
      where: { id: baseId },
    });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    base.tables.push({
      id: generateId(),
      name,
      records: [],
    });

    return await this.basesRepository.save(base);
  }

  /**
   * 更新记录
   */
  async updateRecord(
    baseId: string,
    tableId: string,
    recordId: string,
    data: Record<string, any>,
  ): Promise<BaseEntity> {
    const base = await this.basesRepository.findOne({
      where: { id: baseId },
    });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    const table = base.tables.find((t) => t.id === tableId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const recordIndex = table.records.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) {
      throw new NotFoundException('Record not found');
    }

    table.records[recordIndex] = {
      ...table.records[recordIndex],
      ...data,
    };

    return await this.basesRepository.save(base);
  }
}
```

---

## 四、项目管理系统

### 4.1 看板管理

#### 4.1.1 看板实体

```typescript
/**
 * 看板实体
 * backend/src/projects/kanban.entity.ts
 */
@Entity('kanban_boards')
export class KanbanBoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'jsonb', default: [] })
  columns: {
    id: string;
    name: string;
    limit: number | null;
    cards: {
      id: string;
      title: string;
      description: string;
      assignees: string[];
      labels: string[];
      dueDate: number | null;
      priority: 'low' | 'medium' | 'high';
      position: number;
    }[];
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4.1.2 看板服务

```typescript
/**
 * 看板服务
 * backend/src/projects/kanban.service.ts
 */
@Injectable()
export class KanbanService {
  constructor(
    @InjectRepository(KanbanBoardEntity)
    private kanbanRepository: Repository<KanbanBoardEntity>,
  ) {}

  /**
   * 创建看板
   */
  async create(
    projectId: string,
    name: string,
    description: string,
  ): Promise<KanbanBoardEntity> {
    const board = this.kanbanRepository.create({
      name,
      description,
      projectId,
      columns: [
        {
          id: generateId(),
          name: '待处理',
          limit: null,
          cards: [],
        },
        {
          id: generateId(),
          name: '进行中',
          limit: 5,
          cards: [],
        },
        {
          id: generateId(),
          name: '已完成',
          limit: null,
          cards: [],
        },
      ],
    });

    return await this.kanbanRepository.save(board);
  }

  /**
   * 添加卡片
   */
  async addCard(
    boardId: string,
    columnId: string,
    title: string,
    description: string,
    assignees: string[] = [],
    labels: string[] = [],
    priority: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<KanbanBoardEntity> {
    const board = await this.kanbanRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // 检查限制
    if (column.limit && column.cards.length >= column.limit) {
      throw new BadRequestException('Column limit reached');
    }

    const position = column.cards.length + 1;

    column.cards.push({
      id: generateId(),
      title,
      description,
      assignees,
      labels,
      dueDate: null,
      priority,
      position,
    });

    return await this.kanbanRepository.save(board);
  }

  /**
   * 移动卡片
   */
  async moveCard(
    boardId: string,
    cardId: string,
    toColumnId: string,
    toPosition: number,
  ): Promise<KanbanBoardEntity> {
    const board = await this.kanbanRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    let sourceColumn: any = null;
    let sourceCardIndex: number = -1;

    // 查找源卡片
    for (const column of board.columns) {
      const index = column.cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        sourceColumn = column;
        sourceCardIndex = index;
        break;
      }
    }

    if (!sourceColumn) {
      throw new NotFoundException('Card not found');
    }

    const card = sourceColumn.cards[sourceCardIndex];

    // 检查目标列限制
    const targetColumn = board.columns.find((c) => c.id === toColumnId);
    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    if (targetColumn.limit && targetColumn.cards.length >= targetColumn.limit) {
      throw new BadRequestException('Target column limit reached');
    }

    // 从源列移除
    sourceColumn.cards.splice(sourceCardIndex, 1);

    // 更新其他卡片的位置
    sourceColumn.cards.forEach((c, index) => {
      c.position = index + 1;
    });

    // 插入到目标列
    targetColumn.cards.splice(toPosition - 1, 0, {
      ...card,
      position: toPosition,
    });

    // 更新目标列其他卡片的位置
    targetColumn.cards.forEach((c, index) => {
      if (c.position >= toPosition && c.id !== card.id) {
        c.position = index + 1;
      }
    });

    return await this.kanbanRepository.save(board);
  }
}
```

### 4.2 任务管理

#### 4.2.1 任务实体

```typescript
/**
 * 任务实体
 * backend/src/projects/task.entity.ts
 */
@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'todo' })
  status: 'todo' | 'in_progress' | 'done';

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @Column({ type: 'bigint', nullable: true })
  dueDate: number | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'jsonb', default: [] })
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];

  @Column({ type: 'jsonb', default: [] })
  comments: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: number;
  }[];

  @Column({ type: 'jsonb', default: [] })
  attachments: {
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: number;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4.2.2 任务服务

```typescript
/**
 * 任务服务
 * backend/src/projects/tasks.service.ts
 */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private tasksRepository: Repository<TaskEntity>,
  ) {}

  /**
   * 创建任务
   */
  async create(
    projectId: string,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    dueDate: number | null = null,
    assigneeId: string | null = null,
  ): Promise<TaskEntity> {
    const task = this.tasksRepository.create({
      title,
      description,
      status: 'todo',
      priority,
      dueDate,
      assigneeId,
      projectId,
      subtasks: [],
      comments: [],
      attachments: [],
    });

    return await this.tasksRepository.save(task);
  }

  /**
   * 更新任务状态
   */
  async updateStatus(
    taskId: string,
    status: 'todo' | 'in_progress' | 'done',
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.status = status;

    return await this.tasksRepository.save(task);
  }

  /**
   * 添加子任务
   */
  async addSubtask(
    taskId: string,
    title: string,
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.subtasks.push({
      id: generateId(),
      title,
      completed: false,
    });

    return await this.tasksRepository.save(task);
  }

  /**
   * 完成子任务
   */
  async completeSubtask(
    taskId: string,
    subtaskId: string,
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    subtask.completed = true;

    // 检查是否所有子任务都完成了
    const allCompleted = task.subtasks.every((s) => s.completed);
    if (allCompleted) {
      task.status = 'done';
    }

    return await this.tasksRepository.save(task);
  }

  /**
   * 添加评论
   */
  async addComment(
    taskId: string,
    userId: string,
    userName: string,
    content: string,
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.comments.push({
      id: generateId(),
      userId,
      userName,
      content,
      createdAt: Date.now(),
    });

    return await this.tasksRepository.save(task);
  }

  /**
   * 上传附件
   */
  async addAttachment(
    taskId: string,
    name: string,
    url: string,
    size: number,
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.attachments.push({
      id: generateId(),
      name,
      url,
      size,
      uploadedAt: Date.now(),
    });

    return await this.tasksRepository.save(task);
  }
}
```

---

## 五、视频会议系统

### 5.1 LiveKit 集成

#### 5.1.1 LiveKit 配置

```typescript
/**
 * LiveKit 配置
 * backend/src/video-conference/livekit.config.ts
 */
export const livekitConfig = {
  url: process.env.LIVEKIT_URL || 'wss://livekit.example.com',
  apiKey: process.env.LIVEKIT_API_KEY || 'API_KEY',
  apiSecret: process.env.LIVEKIT_API_SECRET || 'API_SECRET',
};

/**
 * LiveKit 服务
 * backend/src/video-conference/livekit.service.ts
 */
@Injectable()
export class LiveKitService {
  constructor(
    @InjectRepository(MeetingEntity)
    private meetingsRepository: Repository<MeetingEntity>,
  ) {}

  /**
   * 创建会议室
   */
  async createRoom(
    meetingId: string,
    name: string,
    maxParticipants: number = 100,
  ): Promise<void> {
    const AccessToken = require('livekit-server-sdk').AccessToken;
    const RoomServiceClient = require('livekit-server-sdk').RoomServiceClient;

    const livekitClient = new RoomServiceClient(
      livekitConfig.url,
      livekitConfig.apiKey,
      livekitConfig.apiSecret,
    );

    try {
      await livekitClient.createRoom({
        name: meetingId,
        emptyTimeout: 300, // 5 分钟
        maxParticipants,
      });
    } catch (error) {
      // 房间可能已存在，忽略错误
      console.error('[LiveKit] Create room error:', error);
    }
  }

  /**
   * 生成访问令牌
   */
  async generateToken(
    meetingId: string,
    participantName: string,
    permissions: {
      canPublish?: boolean;
      canSubscribe?: boolean;
      canPublishData?: boolean;
    } = {},
  ): Promise<string> {
    const AccessToken = require('livekit-server-sdk').AccessToken;
    const VideoGrants = require('livekit-server-sdk').VideoGrants;

    const at = new AccessToken(livekitConfig.apiKey, livekitConfig.apiSecret, {
      identity: participantName,
    });

    at.addGrant(
      new VideoGrants({
        roomJoin: true,
        room: meetingId,
        canPublish: permissions.canPublish ?? true,
        canSubscribe: permissions.canSubscribe ?? true,
        canPublishData: permissions.canPublishData ?? true,
      })
    );

    return at.toJwt();
  }

  /**
   * 列出参与者
   */
  async listParticipants(meetingId: string): Promise<any[]> {
    const RoomServiceClient = require('livekit-server-sdk').RoomServiceClient;

    const livekitClient = new RoomServiceClient(
      livekitConfig.url,
      livekitConfig.apiKey,
      livekitConfig.apiSecret,
    );

    const participants = await livekitClient.listParticipants(meetingId);
    return participants;
  }

  /**
   * 移除参与者
   */
  async removeParticipant(
    meetingId: string,
    participantIdentity: string,
  ): Promise<void> {
    const RoomServiceClient = require('livekit-server-sdk').RoomServiceClient;

    const livekitClient = new RoomServiceClient(
      livekitConfig.url,
      livekitConfig.apiKey,
      livekitConfig.apiSecret,
    );

    await livekitClient.removeParticipant(meetingId, participantIdentity);
  }

  /**
   * 删除房间
   */
  async deleteRoom(meetingId: string): Promise<void> {
    const RoomServiceClient = require('livekit-server-sdk').RoomServiceClient;

    const livekitClient = new RoomServiceClient(
      livekitConfig.url,
      livekitConfig.apiKey,
      livekitConfig.apiSecret,
    );

    await livekitClient.deleteRoom(meetingId);
  }
}
```

### 5.2 会议服务

#### 5.2.1 会议实体

```typescript
/**
 * 会议实体
 * backend/src/video-conference/meeting.entity.ts
 */
@Entity('meetings')
export class MeetingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'instant' })
  type: 'instant' | 'scheduled';

  @Column({ type: 'varchar', length: 20, default: 'waiting' })
  status: 'waiting' | 'active' | 'ended';

  @Column({ type: 'uuid' })
  hostId: string;

  @Column({ type: 'varchar', length: 255 })
  hostName: string;

  @Column({ type: 'bigint', nullable: true })
  scheduledAt: number | null;

  @Column({ type: 'bigint', nullable: true })
  startedAt: number | null;

  @Column({ type: 'bigint', nullable: true })
  endedAt: number | null;

  @Column({ type: 'jsonb', default: [] })
  participants: {
    id: string;
    name: string;
    isHost: boolean;
    isMuted: boolean;
    isVideoOn: boolean;
    joinedAt: number;
  }[];

  @Column({ type: 'boolean', default: false })
  recordingEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 5.2.2 会议服务

```typescript
/**
 * 会议服务
 * backend/src/video-conference/meetings.service.ts
 */
@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(MeetingEntity)
    private meetingsRepository: Repository<MeetingEntity>,
    private livekitService: LiveKitService,
  ) {}

  /**
   * 创建会议
   */
  async create(
    title: string,
    type: 'instant' | 'scheduled',
    hostId: string,
    hostName: string,
    scheduledAt: number | null = null,
  ): Promise<MeetingEntity> {
    const meeting = this.meetingsRepository.create({
      title,
      type,
      status: 'waiting',
      hostId,
      hostName,
      scheduledAt,
      participants: [],
      recordingEnabled: false,
    });

    const savedMeeting = await this.meetingsRepository.save(meeting);

    // 创建 LiveKit 房间
    await this.livekitService.createRoom(savedMeeting.id, title);

    return savedMeeting;
  }

  /**
   * 加入会议
   */
  async join(
    meetingId: string,
    userId: string,
    userName: string,
  ): Promise<{ token: string; meeting: MeetingEntity }> {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status === 'ended') {
      throw new BadRequestException('Meeting has ended');
    }

    // 添加参与者
    const participant = {
      id: userId,
      name: userName,
      isHost: userId === meeting.hostId,
      isMuted: false,
      isVideoOn: false,
      joinedAt: Date.now(),
    };

    meeting.participants.push(participant);

    // 更新会议状态
    if (meeting.status === 'waiting') {
      meeting.status = 'active';
      meeting.startedAt = Date.now();
    }

    await this.meetingsRepository.save(meeting);

    // 生成 LiveKit Token
    const token = await this.livekitService.generateToken(
      meetingId,
      userName,
      {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      }
    );

    return { token, meeting };
  }

  /**
   * 离开会议
   */
  async leave(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 移除参与者
    meeting.participants = meeting.participants.filter((p) => p.id !== userId);

    // 如果所有参与者都离开了，结束会议
    if (meeting.participants.length === 0) {
      meeting.status = 'ended';
      meeting.endedAt = Date.now();
    }

    await this.meetingsRepository.save(meeting);
  }

  /**
   * 结束会议
   */
  async end(meetingId: string): Promise<void> {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    meeting.status = 'ended';
    meeting.endedAt = Date.now();

    await this.meetingsRepository.save(meeting);

    // 删除 LiveKit 房间
    await this.livekitService.deleteRoom(meetingId);
  }
}
```

---

## 六、评论批注系统

### 6.1 评论实体

```typescript
/**
 * 评论实体
 * backend/src/comments/comment.entity.ts
 */
@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid', nullable: true })
  blockId: string | null;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  userName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  selection: {
    start: number;
    end: number;
    text: string;
  } | null;

  @Column({ type: 'jsonb', default: [] })
  mentions: {
    userId: string;
    userName: string;
  }[];

  @Column({ type: 'jsonb', default: [] })
  reactions: {
    emoji: string;
    users: string[];
  }[];

  @Column({ type: 'jsonb', default: [] })
  replies: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: number;
  }[];

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 6.2 评论服务

```typescript
/**
 * 评论服务
 * backend/src/comments/comments.service.ts
 */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentsRepository: Repository<CommentEntity>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 创建评论
   */
  async create(
    documentId: string,
    blockId: string | null,
    userId: string,
    userName: string,
    content: string,
    selection: any = null,
    mentions: any[] = [],
  ): Promise<CommentEntity> {
    const comment = this.commentsRepository.create({
      documentId,
      blockId,
      userId,
      userName,
      content,
      selection,
      mentions,
      reactions: [],
      replies: [],
      isResolved: false,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // 发送通知给被提及的用户
    for (const mention of mentions) {
      await this.notificationService.create({
        type: 'comment_mention',
        userId: mention.userId,
        title: `${userName} 提及了你`,
        message: content,
        data: {
          commentId: savedComment.id,
          documentId,
        },
      });
    }

    // 广播评论创建事件
    this.documentsGateway.server
      .to(`document:${documentId}`)
      .emit('commentCreated', savedComment);

    return savedComment;
  }

  /**
   * 添加回复
   */
  async addReply(
    commentId: string,
    userId: string,
    userName: string,
    content: string,
  ): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.replies.push({
      id: generateId(),
      userId,
      userName,
      content,
      createdAt: Date.now(),
    });

    const savedComment = await this.commentsRepository.save(comment);

    // 通知评论作者
    if (comment.userId !== userId) {
      await this.notificationService.create({
        type: 'comment_reply',
        userId: comment.userId,
        title: `${userName} 回复了你的评论`,
        message: content,
        data: {
          commentId,
          documentId: comment.documentId,
        },
      });
    }

    // 广播回复事件
    this.documentsGateway.server
      .to(`document:${comment.documentId}`)
      .emit('commentReplied', {
        commentId,
        reply: comment.replies[comment.replies.length - 1],
      });

    return savedComment;
  }

  /**
   * 添加反应
   */
  async addReaction(
    commentId: string,
    userId: string,
    emoji: string,
  ): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    let reaction = comment.reactions.find((r) => r.emoji === emoji);

    if (!reaction) {
      reaction = { emoji, users: [] };
      comment.reactions.push(reaction);
    }

    if (!reaction.users.includes(userId)) {
      reaction.users.push(userId);
    }

    const savedComment = await this.commentsRepository.save(comment);

    // 广播反应事件
    this.documentsGateway.server
      .to(`document:${comment.documentId}`)
      .emit('commentReacted', {
        commentId,
        emoji,
        userId,
      });

    return savedComment;
  }

  /**
   * 标记为已解决
   */
  async markResolved(commentId: string): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.isResolved = true;

    const savedComment = await this.commentsRepository.save(comment);

    // 广播解决事件
    this.documentsGateway.server
      .to(`document:${comment.documentId}`)
      .emit('commentResolved', { commentId });

    return savedComment;
  }
}
```

---

## 七、通知系统

### 7.1 通知实体

```typescript
/**
 * 通知实体
 * backend/src/notifications/notification.entity.ts
 */
@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  type:
    | 'comment_mention'
    | 'comment_reply'
    | 'document_update'
    | 'meeting_invitation'
    | 'task_assigned'
    | 'task_due'
    | 'system';

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true })
  readAt: number | null;
}
```

### 7.2 通知服务

```typescript
/**
 * 通知服务
 * backend/src/notifications/notifications.service.ts
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationsRepository: Repository<NotificationEntity>,
  ) {}

  /**
   * 创建通知
   */
  async create(data: {
    userId: string;
    type: NotificationEntity['type'];
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<NotificationEntity> {
    const notification = this.notificationsRepository.create({
      ...data,
      createdAt: Date.now(),
      isRead: false,
      readAt: null,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // 通过 Socket.io 发送实时通知
    this.gateway.server.to(`user:${data.userId}`).emit('notification', savedNotification);

    return savedNotification;
  }

  /**
   * 获取用户通知
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }

  /**
   * 标记为已读
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = Date.now();

    await this.notificationsRepository.save(notification);
  }

  /**
   * 标记全部为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
  }

  /**
   * 删除通知
   */
  async delete(notificationId: string): Promise<void> {
    await this.notificationsRepository.delete(notificationId);
  }

  /**
   * 清除所有通知
   */
  async clearAll(userId: string): Promise<void> {
    await this.notificationsRepository.delete({ userId });
  }
}
```

---

## 八、总结

FastDocument 业务逻辑系统是一个功能完整的文档协作平台，具有以下特点：

1. **文档协作系统**：支持文档创建、编辑、实时同步、版本历史管理
2. **知识库系统**：空间管理、Base 管理、多视图支持
3. **项目管理系统**：看板管理、任务管理、子任务、评论、附件
4. **视频会议系统**：基于 LiveKit 的 WebRTC 视频会议，支持即时会议和预约会议
5. **评论批注系统**：支持文本选择、提及、回复、反应
6. **通知系统**：实时通知推送，支持多种通知类型

---

*文档版本: 1.0*
*最后更新: 2026-03-11*