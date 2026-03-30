# NestJS 后端基础

## 目录

1. NestJS 概述
2. 模块系统
3. 控制器（Controller）
4. 服务（Service）
5. 依赖注入
6. 数据库集成
7. 认证授权
8. WebSocket
9. 实际项目示例

---

## 1. NestJS 概述

### 1.1 什么是 NestJS？

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用的框架。

**核心特性**：
- 基于 TypeScript
- 模块化架构
- 依赖注入
- 类似 Angular 的装饰器语法
- 强大的生态系统

### 1.2 项目结构

```
backend/src/
├── app.module.ts          # 根模块
├── main.ts               # 入口文件
├── auth/                 # 认证模块
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── user.entity.ts
├── documents/            # 文档模块
│   ├── documents.module.ts
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   ├── document.entity.ts
│   └── documents.gateway.ts
└── common/               # 公共模块
    ├── cache.service.ts
    └── performance-monitor.service.ts
```

---

## 2. 模块系统

### 2.1 模块定义

```typescript
// documents/documents.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { DocumentEntity } from './document.entity'
import { BlockEntity } from './block.entity'
import { DocumentsGateway } from './documents.gateway'

@Module({
  // 导入其他模块
  imports: [
    // 注册实体
    TypeOrmModule.forFeature([DocumentEntity, BlockEntity]),
  ],
  // 控制器
  controllers: [DocumentsController],
  // 服务提供者
  providers: [DocumentsService, DocumentsGateway],
  // 导出服务供其他模块使用
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

### 2.2 根模块

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { DocumentsModule } from './documents/documents.module'
import { CommentsModule } from './comments/comments.module'
import { ProjectsModule } from './projects/projects.module'
import { KnowledgeModule } from './knowledge/knowledge.module'
import { MeetingsModule } from './meetings/meetings.module'
import { NotificationsModule } from './notifications/notifications.module'
import { ShareModule } from './share/share.module'
import { UploadsModule } from './uploads/uploads.module'
import { CommonModule } from './common/common.module'

@Module({
  imports: [
    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '15432'),
      username: process.env.DB_USER || 'fastdoc',
      password: process.env.DB_PASSWORD || 'fastdoc',
      database: process.env.DB_NAME || 'fastdoc',
      // 自动同步实体（开发环境）
      synchronize: process.env.NODE_ENV !== 'production',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      logging: process.env.NODE_ENV === 'development',
    }),
    // 业务模块
    AuthModule,
    DocumentsModule,
    CommentsModule,
    ProjectsModule,
    KnowledgeModule,
    MeetingsModule,
    NotificationsModule,
    ShareModule,
    UploadsModule,
    CommonModule,
  ],
})
export class AppModule {}
```

---

## 3. 控制器（Controller）

### 3.1 基本控制器

```typescript
// documents/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { DocumentsService } from './documents.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('documents')
// 全局认证守卫
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // GET /documents
  @Get()
  async findAll(@Request() req: any) {
    return this.documentsService.findAll(req.user.id)
  }

  // GET /documents/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id)
  }

  // POST /documents
  @Post()
  async create(@Body() createDto: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.create(createDto, req.user.id)
  }

  // PATCH /documents/:id
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDto)
  }

  // DELETE /documents/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id)
  }

  // GET /documents/tree - 获取文档树
  @Get('tree')
  async getTree(@Request() req: any) {
    return this.documentsService.getTree(req.user.id)
  }

  // POST /documents/:id/toggle-star - 收藏/取消收藏
  @Post(':id/toggle-star')
  async toggleStar(@Param('id') id: string) {
    return this.documentsService.toggleStar(id)
  }

  // POST /documents/:id/trash - 移至回收站
  @Post(':id/trash')
  async trash(@Param('id') id: string) {
    return this.documentsService.trash(id)
  }

  // POST /documents/:id/restore - 从回收站恢复
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.documentsService.restore(id)
  }
}
```

### 3.2 DTO（数据传输对象）

```typescript
// documents/dto/create-document.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator'

export class CreateDocumentDto {
  @IsString()
  title: string

  @IsEnum(['document', 'folder', 'workspace'])
  type: 'document' | 'folder' | 'workspace'

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsString()
  content?: string
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsBoolean()
  isStarred?: boolean
}
```

---

## 4. 服务（Service）

### 4.1 基本服务

```typescript
// documents/documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DocumentEntity } from './document.entity'
import { BlockEntity } from './block.entity'
import { CreateDocumentDto, UpdateDocumentDto } from './dto'

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>,
    @InjectRepository(BlockEntity)
    private blockRepository: Repository<BlockEntity>,
  ) {}

  // 获取用户所有文档
  async findAll(userId: string): Promise<DocumentEntity[]> {
    return this.documentRepository.find({
      where: { ownerId: userId, isDeleted: false },
      order: { updatedAt: 'DESC' },
    })
  }

  // 获取单个文档
  async findOne(id: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['blocks'],
    })
    if (!document) {
      throw new NotFoundException(`Document ${id} not found`)
    }
    return document
  }

  // 创建文档
  async create(dto: CreateDocumentDto, ownerId: string): Promise<DocumentEntity> {
    const document = this.documentRepository.create({
      ...dto,
      ownerId,
    })
    return this.documentRepository.save(document)
  }

  // 更新文档
  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentEntity> {
    const document = await this.findOne(id)
    Object.assign(document, dto)
    return this.documentRepository.save(document)
  }

  // 删除文档
  async remove(id: string): Promise<void> {
    const document = await this.findOne(id)
    await this.documentRepository.remove(document)
  }

  // 收藏/取消收藏
  async toggleStar(id: string): Promise<DocumentEntity> {
    const document = await this.findOne(id)
    document.isStarred = !document.isStarred
    return this.documentRepository.save(document)
  }

  // 移至回收站
  async trash(id: string): Promise<DocumentEntity> {
    const document = await this.findOne(id)
    document.isDeleted = true
    return this.documentRepository.save(document)
  }

  // 从回收站恢复
  async restore(id: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findOne({
      where: { id, isDeleted: true },
    })
    if (!document) {
      throw new NotFoundException(`Document ${id} not found in trash`)
    }
    document.isDeleted = false
    return this.documentRepository.save(document)
  }

  // 获取文档树
  async getTree(userId: string): Promise<DocumentEntity[]> {
    return this.documentRepository.find({
      where: { ownerId: userId },
      order: { order: 'ASC' },
      // 树形结构查询
      treeRelations: ['children'],
    })
  }
}
```

---

## 5. 依赖注入

### 5.1 构造函数注入

```typescript
// 推荐方式
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
}
```

### 5.2 属性注入

```typescript
// 不推荐
@Controller('documents')
export class DocumentsController {
  @Inject(DocumentsService)
  private readonly documentsService: DocumentsService
}
```

### 5.3 可选注入

```typescript
import { Optional } from '@nestjs/common'

@Injectable()
export class CacheService {
  constructor(
    private redis: Redis,
    @Optional() @Inject('CACHE_CONFIG') private config: any,
  ) {}
}
```

---

## 6. 数据库集成

### 6.1 实体定义

```typescript
// documents/document.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm'
import { BlockEntity } from './block.entity'

@Entity('documents')
@Tree('closure-table') // 树形结构
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({
    type: 'enum',
    enum: ['document', 'folder', 'workspace'],
    default: 'document',
  })
  type: 'document' | 'folder' | 'workspace'

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ type: 'text', nullable: true })
  summary: string

  @Column({ default: false })
  isStarred: boolean

  @Column({ default: false })
  isDeleted: boolean

  @Column()
  ownerId: string

  @Column({ default: 0 })
  currentVersion: number

  @Column({ default: 0 })
  editCount: number

  // 块关系
  @OneToMany(() => BlockEntity, (block) => block.document)
  blocks: BlockEntity[]

  // 树形关系
  @TreeChildren()
  children: DocumentEntity[]

  @TreeParent()
  parent: DocumentEntity

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

### 6.2 块实体

```typescript
// documents/block.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { DocumentEntity } from './document.entity'

@Entity('blocks')
export class BlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    type: 'enum',
    enum: [
      'text',
      'h1',
      'h2',
      'h3',
      'todo',
      'code',
      'image',
      'table',
      'callout',
      'divider',
    ],
    default: 'text',
  })
  type: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>

  @Column({ default: 0 })
  order: number

  @Column()
  documentId: string

  @ManyToOne(() => DocumentEntity, (doc) => doc.blocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

---

## 7. 认证授权

### 7.1 JWT 守卫

```typescript
// auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context)
  }
}
```

### 7.2 JWT 策略

```typescript
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    })
  }

  async validate(payload: any) {
    return { id: payload.sub, username: payload.username, role: payload.role }
  }
}
```

### 7.3 认证模块

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { UserEntity } from './user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 8. WebSocket

### 8.1 WebSocket 网关

```typescript
// documents/documents.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DocumentsService } from './documents.service'

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/documents',
})
export class DocumentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(private readonly documentsService: DocumentsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }

  // 加入文档房间
  @SubscribeMessage('joinDocument')
  handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; userId: string; userName: string },
  ) {
    client.join(payload.docId)
    console.log(`User ${payload.userName} joined document ${payload.docId}`)

    // 广播给房间内其他用户
    client.to(payload.docId).emit('userJoined', {
      userId: payload.userId,
      userName: payload.userName,
    })
  }

  // 块更新
  @SubscribeMessage('updateBlock')
  async handleBlockUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; blockId: string; content: string },
  ) {
    // 广播给房间内其他用户（低延迟）
    client.to(payload.docId).emit('blockUpdated', payload)

    // 异步持久化到数据库
    await this.documentsService.updateBlock(payload.blockId, payload.content)
  }

  // 批量块更新
  @SubscribeMessage('updateBlocksBatch')
  async handleBlocksBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; blocks: any[] },
  ) {
    client.to(payload.docId).emit('blocksUpdated', payload.blocks)
    await this.documentsService.updateBlocksBatch(payload.blocks)
  }

  // 聊天消息
  @SubscribeMessage('chatMessage')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; message: string; userId: string; userName: string },
  ) {
    client.to(payload.docId).emit('newChatMessage', {
      ...payload,
      timestamp: new Date(),
    })
  }

  // 光标移动
  @SubscribeMessage('cursorMove')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; userId: string; position: any },
  ) {
    client.to(payload.docId).emit('cursorMoved', payload)
  }
}
```

---

## 9. 实际项目示例

### 9.1 认证服务

```typescript
// auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserEntity } from './user.entity'
import { LoginDto, RegisterDto } from './dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  // 用户注册
  async register(dto: RegisterDto): Promise<{ user: any; access_token: string }> {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username: dto.username },
    })
    if (existingUser) {
      throw new ConflictException('Username already exists')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 创建用户
    const user = this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      email: dto.email,
    })
    await this.userRepository.save(user)

    // 生成 token
    const token = this.generateToken(user)

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    }
  }

  // 用户名密码登录
  async loginWithPassword(dto: LoginDto): Promise<{ user: any; access_token: string }> {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const token = this.generateToken(user)

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    }
  }

  // 生成 JWT Token
  private generateToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    }
    return this.jwtService.sign(payload)
  }

  // 移除敏感信息
  private sanitizeUser(user: UserEntity) {
    const { password, ...result } = user
    return result
  }
}
```

---

## 总结

NestJS 提供了完整的服务器端应用开发框架：

- **模块化**：清晰的模块系统
- **依赖注入**：松耦合设计
- **TypeORM**：便捷的数据库操作
- **JWT 认证**：安全的用户认证
- **WebSocket**：实时通信支持

在 FastDocument 项目中，NestJS 负责处理所有后端业务，包括文档管理、用户认证、实时协作等。
