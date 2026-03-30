# 通知流程业务逻辑

本文档详细描述 FastDocument 项目中通知的业务流程，包括通知生成和推送。

## 1. 通知生成和推送流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户需要在各种业务操作中获得及时通知，如被@提及、收到评论、任务指派等 |
| **任务 (T)** | 实现多渠道通知系统，支持应用内通知、推送通知、邮件通知 |
| **行动 (A)** | 触发业务事件 → 生成通知 → 根据用户设置推送 → 用户查看和处理 |
| **结果 (R)** | 用户及时了解重要事件，不遗漏关键信息 |

### 1.2 详细流程步骤

#### 1.2.1 通知生成

```
业务事件触发 (评论、@提及、任务指派等)
    ↓
判断是否需要生成通知
    ↓
确定通知类型和内容
    ↓
查询接收者设置
    ↓
根据用户偏好选择推送渠道
    ↓
创建通知实体
    ↓
保存到数据库
    ↓
触发推送
```

#### 1.2.2 通知触发场景

**@提及通知**:
```
用户 A 在评论中@用户 B
    ↓
系统检测到@提及
    ↓
创建 mention 类型通知
    ↓
通知用户 B
```

**评论通知**:
```
用户 A 评论了文档
    ↓
文档所有者 B 收到通知
    ↓
创建 comment 类型通知
```

**任务指派通知**:
```
项目负责人 A 指派任务给用户 B
    ↓
创建 assignment 类型通知
    ↓
通知用户 B
```

**会议通知**:
```
用户 A 预约了会议并邀请用户 B
    ↓
创建 meeting 类型通知
    ↓
在会议开始前提醒
```

#### 1.2.3 通知推送

```
通知创建成功
    ↓
检查接收者设置
    ↓
应用内推送:
  - 通过 WebSocket 实时推送
  - 存储到通知列表
    ↓
推送通知 (可选):
  - 浏览器推送
  - 邮件通知
```

#### 1.2.4 通知查看和处理

```
用户点击通知图标
    ↓
GET /notifications
    ↓
返回通知列表 (分页)
    ↓
用户点击通知
    ↓
标记为已读 (PATCH /notifications/:id/read)
    ↓
跳转到相关页面
```

### 1.3 数据模型

#### 1.3.1 通知实体 (NotificationEntity)

```typescript
// backend/src/notifications/notification.entity.ts
// 通知类型枚举
export enum NotificationType {
  MENTION = 'mention',        // @提及
  COMMENT = 'comment',       // 评论
  SHARE = 'share',           // 分享
  ASSIGNMENT = 'assignment',  // 任务指派
  TASK = 'task',             // 任务提醒
  MEETING = 'meeting',       // 会议提醒
  SYSTEM = 'system',         // 系统通知
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 'unread',      // 未读
  READ = 'read',         // 已读
  ARCHIVED = 'archived',  // 已归档
}

// 通知优先级枚举
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;           // 通知标题

  @Column({ type: 'text' })
  content: string;         // 通知内容

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;          // 接收者 ID

  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string;        // 发送者 ID

  @Column({ name: 'sender_name', type: 'varchar', length: 100, nullable: true })
  senderName: string;       // 发送者名称

  @Column({ name: 'sender_avatar', type: 'varchar', length: 500, nullable: true })
  senderAvatar: string;    // 发送者头像

  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string;            // 跳转链接

  @Column({ type: 'varchar', length: 20, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @Column({ type: 'varchar', length: 20, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;  // 扩展元数据

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;            // 阅读时间
}
```

### 1.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/notifications` | 获取通知列表 |
| GET | `/notifications/unread-count` | 获取未读数量 |
| GET | `/notifications/:id` | 获取通知详情 |
| PATCH | `/notifications/:id/read` | 标记已读 |
| PATCH | `/notifications/read-all` | 全部已读 |
| PATCH | `/notifications/:id/archive` | 归档通知 |
| DELETE | `/notifications/:id` | 删除通知 |

### 1.5 通知类型详情

| 类型 | 触发场景 | 优先级 | 示例 |
|------|----------|--------|------|
| mention | @提及 | high | "用户在评论中@了你" |
| comment | 评论 | medium | "用户评论了你的文档" |
| share | 分享 | medium | "用户分享了文档给你" |
| assignment | 任务指派 | high | "你被指派了一个任务" |
| task | 任务提醒 | medium | "任务即将到期" |
| meeting | 会议提醒 | high | "会议将在10分钟后开始" |
| system | 系统通知 | low | "系统维护通知" |

### 1.6 状态转换

```
通知状态:
  unread → read → archived
              ↓
           deleted

通知优先级:
  urgent (紧急) → high (高) → medium (中) → low (低)

处理流程:
  received → viewed → action-taken → archived
```

---

## 2. 通知设置流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户需要自定义接收哪些通知、通过什么渠道接收 |
| **任务 (T)** | 实现通知偏好设置，支持分类型、分渠道的配置 |
| **行动 (A)** | 用户进入设置页面，配置各项通知偏好 |
| **结果 (R)** | 用户只收到感兴趣的通知，避免信息过载 |

### 2.2 详细流程步骤

#### 2.2.1 查看通知设置

```
用户进入设置页面
    ↓
获取当前通知设置
    ↓
显示设置界面
```

#### 2.2.2 修改通知设置

```
用户修改设置
    ↓
实时保存设置
    ↓
PATCH /notifications/settings
    ↓
后端更新设置
    ↓
返回更新后的设置
```

### 2.3 通知设置结构

```typescript
// 前端通知设置接口
interface NotificationSettings {
  email: {
    enabled: boolean;           // 是否启用邮件通知
    mention: boolean;           // @提及
    comment: boolean;           // 评论
    share: boolean;             // 分享
    assignment: boolean;         // 任务指派
    system: boolean;            // 系统通知
  };
  push: {
    enabled: boolean;           // 是否启用推送
    mention: boolean;
    comment: boolean;
    share: boolean;
    assignment: boolean;
    system: boolean;
  };
  inApp: {
    enabled: boolean;           // 是否启用应用内通知
    mention: boolean;
    comment: boolean;
    share: boolean;
    assignment: boolean;
    system: boolean;
    sound: boolean;            // 声音提示
  };
}

// 默认设置
const defaultSettings: NotificationSettings = {
  email: {
    enabled: false,
    mention: true,
    comment: true,
    share: true,
    assignment: true,
    system: false,
  },
  push: {
    enabled: true,
    mention: true,
    comment: true,
    share: true,
    assignment: true,
    system: true,
  },
  inApp: {
    enabled: true,
    mention: true,
    comment: true,
    share: true,
    assignment: true,
    system: true,
    sound: true,
  },
};
```

---

## 3. 实时通知流程

### 3.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 用户在线时需要即时收到通知，不需要刷新页面 |
| **任务 (T)** | 通过 WebSocket 实现实时推送通知 |
| **行动 (A)** | 通知生成后立即通过 Socket.io 推送给在线用户 |
| **结果 (R)** | 用户实时收到通知，提升响应速度 |

### 3.2 详细流程步骤

#### 3.2.1 建立通知连接

```
用户登录系统
    ↓
建立 Socket 连接
    ↓
监听通知事件
```

#### 3.2.2 接收实时通知

```
后端生成通知
    ↓
通过 Socket 推送给对应用户
    ↓
前端接收事件
    ↓
显示通知
    ↓
更新未读计数
```

### 3.3 Socket 事件

```typescript
// 通知相关 Socket 事件
// 客户端监听
socket.on('notification', (notification: Notification) => {
  // 添加到通知列表
  notificationStore.addNotification(notification);
});

// 新通知事件
interface NotificationEvent {
  type: 'new_notification';
  data: Notification;
}
```

---

## 4. 前端实现

### 4.1 Zustand Store

```typescript
// frontend/src/store/notificationStore.ts
interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  filterType: NotificationType | 'all';
  unreadCount: number;
  settings: NotificationSettings;

  // 通知操作
  fetchNotifications: (page?: number, type?: NotificationType | 'all') => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;

  // 设置操作
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;

  // 实时通知
  addNotification: (notification: Notification) => void;

  // 筛选
  setFilterType: (type: NotificationType | 'all') => void;
  getFilteredNotifications: () => Notification[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  link?: string;
  status: NotificationStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  createdAt: number;
  readAt?: number;
}
```

### 4.2 通知工具函数

```typescript
// 通知工具函数
export const notificationUtils = {
  // 获取通知图标
  getNotificationIcon: (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      mention: '@',
      comment: '💬',
      share: '🔗',
      assignment: '📋',
      task: '✅',
      meeting: '📹',
      system: '⚙️',
    };
    return icons[type] || '📢';
  },

  // 获取通知颜色
  getNotificationColor: (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      mention: '#14B8A6',
      comment: '#8B5CF6',
      share: '#F59E0B',
      assignment: '#3B82F6',
      task: '#10B981',
      meeting: '#EC4899',
      system: '#6B7280',
    };
    return colors[type] || '#6B7280';
  },

  // 格式化时间
  formatTime: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return new Date(timestamp).toLocaleDateString('zh-CN');
  },
};
```

---

## 5. 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 用户离线 | 存储到数据库，连接后获取 |
| 通知数量过多 | 分页加载，每页 20 条 |
| 通知链接目标已删除 | 显示"内容已删除" |
| 多次触发同一事件 | 去重，避免重复通知 |
| 推送失败 | 降级到数据库存储 |

---

## 6. 总结

通知系统的核心设计要点:

1. **多类型支持**: 涵盖 @提及、评论、任务、会议等业务场景
2. **多渠道推送**: 应用内、推送、邮件三种渠道
3. **个性化设置**: 用户可自定义接收偏好
4. **实时推送**: 基于 WebSocket 的即时通知
5. **完整的生命周期**: 从生成、推送、查看、处理到归档
