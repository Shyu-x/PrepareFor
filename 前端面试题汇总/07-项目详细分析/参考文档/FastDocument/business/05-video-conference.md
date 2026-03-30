# 视频会议流程业务逻辑

本文档详细描述 FastDocument 项目中视频会议的业务流程，包括会议创建、加入和屏幕共享。

## 1. 会议创建和加入流程

### 1.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 团队需要进行实时音视频会议，支持即时会议和预约会议 |
| **任务 (T)** | 基于 LiveKit 实现 WebRTC 视频会议，支持多人同时参与 |
| **行动 (A)** | 用户创建会议、获取加入链接、加入会议、离开会议 |
| **结果 (R)** | 流畅的音视频通话体验，支持屏幕共享等功能 |

### 1.2 详细流程步骤

#### 1.2.1 创建即时会议

```
用户点击"发起会议"
    ↓
输入会议标题
    ↓
选择会议类型 (instant / scheduled)
    ↓
POST /meetings { title, type: 'instant' }
    ↓
后端创建会议实体
    ↓
自动加入创建者为主持人
    ↓
返回会议 ID 和信息
    ↓
用户获取会议链接
```

#### 1.2.2 创建预约会议

```
用户点击"预约会议"
    ↓
输入会议标题、选择时间
    ↓
POST /meetings { title, type: 'scheduled', scheduledAt }
    ↓
后端创建会议实体 (状态: waiting)
    ↓
返回会议信息
    ↓
用户分享会议链接给参与者
```

#### 1.2.3 加入会议

```
用户点击会议链接
    ↓
验证用户身份
    ↓
POST /meetings/:id/join { userId, userName }
    ↓
后端验证会议状态
    ↓
获取 LiveKit Token
    ↓
返回 Token 和会议信息
    ↓
前端连接 LiveKit 服务器
    ↓
建立 WebRTC 连接
    ↓
加入成功，显示会议界面
```

#### 1.2.4 离开会议

```
用户点击"离开会议"
    ↓
POST /meetings/:id/leave { userId }
    ↓
后端更新参与者列表
    ↓
断开 WebRTC 连接
    ↓
前端返回会议列表
```

#### 1.2.5 结束会议

```
主持人点击"结束会议"
    ↓
POST /meetings/:id/end
    ↓
后端标记会议状态为 ended
    ↓
广播给所有参与者
    ↓
所有参与者断开连接
```

### 1.3 数据模型

#### 1.3.1 会议实体 (MeetingEntity)

```typescript
// backend/src/meetings/meeting.entity.ts
@Entity("meetings")
export class MeetingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;           // 会议标题

  @Column()
  type!: "instant" | "scheduled";
  // 会议类型:
  // - instant: 即时会议
  // - scheduled: 预约会议

  @Column({ default: "waiting" })
  status!: "waiting" | "active" | "ended";
  // 会议状态:
  // - waiting: 等待中
  // - active: 进行中
  // - ended: 已结束

  @Column()
  hostId!: string;         // 主持人 ID

  @Column()
  hostName!: string;       // 主持人名称

  @Column({ type: "bigint", nullable: true })
  scheduledAt?: number;    // 预约时间 (时间戳)

  @Column({ type: "bigint", nullable: true })
  startedAt?: number;     // 开始时间

  @Column({ type: "bigint", nullable: true })
  endedAt?: number;       // 结束时间

  @Column("jsonb", { default: [] })
  participants!: {
    id: string;
    name: string;
    isHost: boolean;
    isMuted: boolean;
    isVideoOn: boolean;
    joinedAt: number;
  }[];
  // 参与者列表

  @Column({ default: false })
  recordingEnabled!: boolean;  // 是否开启录制

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 1.4 API 调用

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/meetings` | 获取会议列表 |
| POST | `/meetings` | 创建会议 |
| GET | `/meetings/:id` | 获取会议详情 |
| POST | `/meetings/:id/join` | 加入会议 |
| POST | `/meetings/:id/leave` | 离开会议 |
| POST | `/meetings/:id/end` | 结束会议 |

### 1.5 状态转换

```
会议状态:
  waiting → active → ended
               ↓
         (主持人离开后)

用户状态:
  invited → joining → joined → left

会议类型:
  instant (即时) ↔ scheduled (预约)
```

### 1.6 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 加入已结束的会议 | 返回错误，提示会议已结束 |
| 主持人离开 | 指定下一位参与者为主持人 |
| 网络中断 | 自动重连，超时后离开会议 |
| 会议人数超限 | 返回错误提示 |

---

## 2. 屏幕共享流程

### 2.1 概述 (STAR 法则)

| 要素 | 描述 |
|------|------|
| **情境 (S)** | 会议中需要演示屏幕内容给其他参与者观看 |
| **任务 (T)** | 实现屏幕共享功能，支持共享整个屏幕、特定窗口或浏览器标签页 |
| **行动 (A)** | 用户点击共享按钮，选择共享内容，其他参与者看到共享画面 |
| **结果 (R)** | 所有参与者可以看到共享的屏幕内容 |

### 2.2 详细流程步骤

#### 2.2.1 发起屏幕共享

```
用户点击工具栏"共享屏幕"
    ↓
浏览器弹出选择对话框:
  - 共享整个屏幕
  - 共享特定窗口
  - 共享浏览器标签页
    ↓
用户选择要共享的内容
    ↓
LiveKit 开始捕获屏幕内容
    ↓
创建视频轨道
    ↓
广播给所有参与者
    ↓
参与者看到共享画面
```

#### 2.2.2 共享时标注

```
共享者点击"标注"
    ↓
显示标注工具栏:
  - 画笔
  - 箭头
  - 矩形
  - 文字
  - 清除
    ↓
共享者进行标注
    ↓
标注内容通过数据通道传输
    ↓
所有参与者看到标注
```

#### 2.2.3 停止共享

```
用户点击"停止共享"
    ↓
销毁视频轨道
    ↓
广播给所有参与者
    ↓
参与者界面恢复正常
```

### 2.3 技术实现

#### 2.3.1 LiveKit 集成

```typescript
// 前端 LiveKit 客户端封装
// frontend/src/lib/livekit.ts

import { Room, RoomEvent, Track, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';

export class LiveKitClient {
  private room: Room;
  private localParticipant: any;

  constructor() {
    this.room = new Room();
  }

  // 连接会议室
  async connect(url: string, token: string) {
    await this.room.connect(url, token);
    this.localParticipant = this.room.localParticipant;
  }

  // 开启麦克风
  async enableMicrophone() {
    const track = await this.room.localParticipant.enableMicrophone();
    return track;
  }

  // 开启摄像头
  async enableCamera() {
    const track = await this.room.localParticipant.enableCamera();
    return track;
  }

  // 屏幕共享
  async startScreenShare() {
    const track = await this.room.localParticipant.startScreenShare();
    return track;
  }

  // 停止屏幕共享
  async stopScreenShare() {
    await this.room.localParticipant.stopScreenShare();
  }

  // 离开会议室
  async disconnect() {
    this.room.disconnect();
  }

  // 事件监听
  on(event: RoomEvent, callback: Function) {
    this.room.on(event, callback);
  }
}
```

### 2.4 状态转换

```
屏幕共享状态:
  idle → sharing → paused → stopped

标注状态:
  inactive → active → drawing → completed
```

### 2.5 边界条件处理

| 场景 | 处理方式 |
|------|----------|
| 共享被拒绝 | 提示用户授权屏幕共享权限 |
| 共享中断 | 自动尝试重新共享 |
| 浏览器不支持 | 提示浏览器版本过低 |
| 共享窗口关闭 | 自动停止共享 |

---

## 3. 前端实现

### 3.1 Zustand Store

```typescript
// frontend/src/store/meetingStore.ts
interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isInMeeting: boolean;
  isLoading: boolean;

  // 会议操作
  fetchMeetings: () => Promise<void>;
  fetchMeeting: (id: string) => Promise<void>;
  createMeeting: (title: string, type: "instant" | "scheduled", scheduledAt?: number) => Promise<Meeting>;
  joinMeeting: (id: string) => Promise<string>;  // 返回 LiveKit token
  leaveMeeting: (id: string) => Promise<void>;
  endMeeting: (id: string) => Promise<void>;

  // UI 状态
  setCurrentMeeting: (meeting: Meeting | null) => void;
  setIsInMeeting: (isInMeeting: boolean) => void;
}

export interface Meeting {
  id: string;
  title: string;
  type: "instant" | "scheduled";
  status: "waiting" | "active" | "ended";
  hostId: string;
  hostName: string;
  scheduledAt?: number;
  startedAt?: number;
  endedAt?: number;
  participants: MeetingParticipant[];
  recordingEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MeetingParticipant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  joinedAt: number;
}
```

### 3.2 会议组件结构

```
VideoConference 组件
├── MeetingList (会议列表)
│   ├── InstantMeetingButton (发起即时会议)
│   └── ScheduledMeetingCard (预约会议卡片)
├── MeetingRoom (会议室)
│   ├── VideoGrid (视频网格)
│   │   ├── LocalVideo (本地视频)
│   │   └── RemoteVideos (远程视频)
│   ├── Controls (控制栏)
│   │   ├── ToggleMicButton (麦克风)
│   │   ├── ToggleCameraButton (摄像头)
│   │   ├── ShareScreenButton (共享屏幕)
│   │   ├── ChatButton (聊天)
│   │   └── LeaveButton (离开)
│   ├── ParticipantsPanel (参与者面板)
│   └── ChatPanel (聊天面板)
└── ScreenShareView (屏幕共享视图)
    ├── SharedVideo (共享画面)
    └── AnnotationToolbar (标注工具栏)
```

---

## 4. 总结

视频会议系统的核心设计要点:

1. **WebRTC 架构**: 基于 LiveKit 的成熟 WebRTC 解决方案
2. **双会议模式**: 支持即时会议和预约会议
3. **完整的会议管理**: 创建、加入、离开、结束全流程
4. **屏幕共享**: 支持多种共享模式和实时标注
5. **参与者追踪**: 实时显示参与者状态（静音、视频开关）
