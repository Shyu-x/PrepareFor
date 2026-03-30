# FastDocument 状态机文档

本文档详细描述了 FastDocument 项目中各个功能模块的状态机设计，包括状态定义、状态转换和转换条件。

## 目录

1. [文档状态机](#1-文档状态机)
2. [块编辑状态机](#2-块编辑状态机)
3. [评论状态机](#3-评论状态机)
4. [批注状态机](#4-批注状态机)
5. [项目任务状态机](#5-项目任务状态机)
6. [会议状态机](#6-会议状态机)
7. [知识库状态机](#7-知识库状态机)

---

## 1. 文档状态机

### 1.1 文档生命周期状态

文档从创建到销毁经历完整生命周期。

#### PlantUML 状态图

```plantuml
@startuml Document_Lifecycle_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<deleted>> #FFEBEE
    BackgroundColor<<archived>> #E3F2FD
    BackgroundColor<<published>> #FFF3E0
    BorderColor #333333
    FontName Consolas
}

[*] --> Draft : 创建新文档
Draft --> Published : 发布文档
Draft --> Archived : 归档文档
Draft --> Trash : 移至回收站
Published --> Published : 更新内容
Published --> Archived : 归档文档
Published --> Trash : 移至回收站
Archived --> Published : 取消归档
Archived --> Trash : 移至回收站
Trash --> Draft : 从回收站恢复
Trash --> [*] : 永久删除

note right of Draft
    草稿状态：文档正在编辑中
    可进行所有编辑操作
end note

note right of Published
    已发布状态：文档已公开
    支持只读或协作编辑
end note

note right of Archived
    归档状态：文档不再活跃
    可恢复或永久删除
end note

note right of Trash
    回收站状态：临时删除
    可恢复或永久删除
end note
@enduml
```

#### ASCII 状态图

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|     DRAFT      | --> |   PUBLISHED    | --> |   ARCHIVED     |
|                |     |                |     |                |
|  (草稿状态)     |     |  (已发布状态)   |     |  (归档状态)     |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
       |                      |                      |
       |                      |                      |
       v                      v                      v
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|     TRASH      | --> |     [*]        |     |     TRASH      |
|                |     |                |     |                |
|  (回收站状态)   |     |  (永久删除)    |     |  (回收站状态)   |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
       |
       |
       v
+----------------+
|                |
|  恢复 -> Draft |
|                |
+----------------+
```

### 1.2 文档状态详细定义

| 状态 | 描述 | 可执行操作 |
|------|------|------------|
| `draft` | 草稿状态，文档正在编辑 | 读取、编辑、删除、发布、归档 |
| `published` | 已发布状态，文档已公开 | 读取、编辑、归档、删除 |
| `archived` | 归档状态，文档不再活跃 | 恢复、删除 |
| `trash` | 回收站状态，已被软删除 | 恢复、永久删除 |

### 1.3 文档属性状态

```plantuml
@startuml Document_Attributes_State
skinparam state {
    BackgroundColor #FFF8E1
    BorderColor #333333
    FontName Consolas
}

[*] --> Unstarred
Unstarred --> Starred : 收藏文档
Starred --> Unstarred : 取消收藏

[*] --> Private
Private --> Shared : 开启分享
Shared --> Private : 关闭分享

note right of Unstarred
    isStarred: false
    未收藏状态
end note

note right of Starred
    isStarred: true
    已收藏状态
end note
@enduml
```

---

## 2. 块编辑状态机

### 2.1 块锁状态

用于实时协作时的并发控制，防止多人同时编辑同一块。

#### PlantUML 状态图

```plantuml
@startuml Block_Lock_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<locked>> #FFEBEE
    BackgroundColor<<unlocked>> #E8F5E9
    BorderColor #333333
    FontName Consolas
}

[*] --> Unlocked

Unlocked --> Locked : 用户开始编辑块
Locked --> Unlocked : 用户停止编辑 / 锁超时
Locked --> Locked : 续期锁 / 用户切换

note right of Locked
    lockType: 'edit'
    记录: userId, userName
    expiresAt: lockedAt + 30s
end note

note right of Unlocked
    可被任何用户锁定编辑
    同时支持多个 cursor 跟踪
end note
@enduml
```

#### ASCII 状态图

```
+------------------------+        +------------------------+
|                        |        |                        |
|      LOCKED            | <----> |      UNLOCKED          |
|                        |        |                        |
|  (编辑锁占用状态)       |        |  (未锁定状态)          |
|                        |        |                        |
|  lockType: 'edit'      |        |  可被任意用户锁定       |
|  userId: xxx           |        |                        |
|  expiresAt: xxx        |        |                        |
|                        |        |                        |
+------------------------+        +------------------------+
              ^
              |
              | 用户开始编辑
              |
              v
              |
    +------------------------+
    |    锁自动续期           |
    |    (每10秒)            |
    +------------------------+
              ^
              |
              | 锁超时(30s) / 用户离开
              |
              v
```

### 2.2 块编辑状态

块内容的保存和同步状态。

```plantuml
@startuml Block_Edit_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<syncing>> #FFF8E1
    BackgroundColor<<saved>> #E8F5E9
    BorderColor #333333
    FontName Consolas
}

[*] --> Saved

Saved --> Editing : 用户聚焦块
Editing --> Syncing : 内容发生变化
Syncing --> Saved : 同步成功
Syncing --> Syncing : 重试同步
Syncing --> Saved : 降级本地保存

note right of Editing
    用户正在编辑
    本地状态: dirty
end note

note right of Syncing
    正在与后端同步
    本地缓存待提交
end note

note right of Saved
    内容已保存
    本地与远程一致
end note
@enduml
```

### 2.3 块类型状态

```
+----------------------------------------------------------+
|                                                          |
|  文本块状态:                                             |
|  text <-> h1 <-> h2 <-> h3                              |
|    |        |        |                                  |
|    v        v        v                                  |
|  callout  codeblock  divider                           |
|                                                          |
+----------------------------------------------------------+
```

---

## 3. 评论状态机

### 3.1 评论生命周期状态

#### PlantUML 状态图

```plantuml
@startuml Comment_Lifecycle_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<resolved>> #E3F2FD
    BackgroundColor<<archived>> #F3E5F5
    BorderColor #333333
    FontName Consolas
}

[*] --> Open

Open --> Resolved : 解决评论
Resolved --> Open : 重新打开
Resolved --> Archived : 归档已解决评论
Archived --> Open : 恢复评论

Open --> Open : 添加回复
Open --> Open : 添加反应
Open --> Open : 编辑内容

note right of Open
    状态: resolved = false
    可进行回复、解决、删除
end note

note right of Resolved
    状态: resolved = true
    问题已处理完成
end note

note right of Archived
    已归档的评论
    不再显示在主视图
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  评论生命周期:                                           |
|                                                          |
|      +---------+                                        |
|      |         |                                        |
|      |   OPEN  | <------------------+                  |
|      |         |                    |                  |
|      +---------+                    |                  |
|            |                        |                  |
|            | 解决评论                | 重新打开         |
|            v                        |                  |
|      +---------+                    |                  |
|      |         |                    |                  |
|      |RESOLVED | -------------------+                  |
|      |         |                                        |
|      +---------+                    |                  |
|            |                        | 恢复评论        |
|            | 归档评论                |                  |
|            v                        |                  |
|      +---------+                                    |
|      |         |                                    |
|      |ARCHIVED |                                    |
|      |         |                                    |
|      +---------+                                    |
|                                                          |
+----------------------------------------------------------+
```

### 3.2 评论反应状态

```plantuml
@startuml Comment_Reaction_State
skinparam state {
    BackgroundColor #FFF8E1
    BorderColor #333333
}

[*] --> NoReaction
NoReaction --> Reacted : 添加反应
Reacted --> NoReaction : 移除反应
Reacted --> Reacted : 切换反应

note right of NoReaction
    用户未对此评论添加反应
end note

note right of Reacted
    reactions: [{ emoji: '👍', users: ['user1', 'user2'] }]
    支持多个用户对同一emoji反应
end note
@enduml
```

---

## 4. 批注状态机

### 4.1 批注状态

#### PlantUML 状态图

```plantuml
@startuml Annotation_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<resolved>> #E3F2FD
    BackgroundColor<<archived>> #F3E5F5
    BorderColor #333333
    FontName Consolas
}

[*] --> Active

Active --> Resolved : 解决批注
Resolved --> Active : 重新打开
Resolved --> Archived : 归档批注
Archived --> Active : 恢复批注

Active --> Active : 编辑内容
Active --> Active : 指派给用户

note right of Active
    status: 'open' | 'active'
    批注待处理
end note

note right of Resolved
    status: 'resolved'
    批注已解决
    assigneeId 可选
end note

note right of Archived
    status: 'archived'
    批注已归档
    不显示在主视图
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  批注状态转换:                                           |
|                                                          |
|    +----------+                                         |
|    |          |                                         |
|    |  ACTIVE  | <------------------+                    |
|    |          |                    |                    |
|    +----------+                    |                    |
|          |                         |                    |
|          | 解决批注                 | 重新打开           |
|          v                         |                    |
|    +----------+                   |                    |
|    |          |                   |                    |
|    | RESOLVED | -------------------+                    |
|    |          |                                        |
|    +----------+                    |                    |
|          |                         | 恢复批注           |
|          | 归档批注                |                    |
|          v                         |                    |
|    +----------+                                        |
|    |          |                                        |
|    | ARCHIVED |                                        |
|    |          |                                        |
|    +----------+                                        |
|                                                          |
+----------------------------------------------------------+
```

### 4.2 批注类型状态

```
+----------------------------------------------------------+
|                                                          |
|  批注类型:                                               |
|                                                          |
|  +-------------+  +-------------+  +-----------------+   |
|  | highlight   |  | underline   |  | strikethrough   |   |
|  | (高亮)      |  | (下划线)    |  | (删除线)        |   |
|  +-------------+  +-------------+  +-----------------+   |
|                                                          |
|  +-------------+  +-------------+                       |
|  | suggestion  |  |  comment    |                       |
|  | (建议修改)   |  | (评论锚点)   |                       |
|  +-------------+  +-------------+                       |
|                                                          |
+----------------------------------------------------------+
```

### 4.3 批注指派状态

```plantuml
@startuml Annotation_Assignee_State
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<assigned>> #E3F2FD
    BorderColor #333333
}

[*] --> Unassigned
Unassigned --> Assigned : 指派给用户
Assigned --> Assigned : 重新指派
Assigned --> Unassigned : 取消指派

note right of Unassigned
    assigneeId: undefined
    未指派给任何人
end note

note right of Assigned
    assigneeId: 'user-uuid'
    已指派给特定用户
end note
@enduml
```

---

## 5. 项目任务状态机

### 5.1 任务状态

#### PlantUML 状态图

```plantuml
@startuml Task_Status_State_Machine
skinparam state {
    BackgroundColor #FFF8E1
    BackgroundColor<<in_progress>> #E3F2FD
    BackgroundColor<<done>> #E8F5E9
    BackgroundColor<<blocked>> #FFEBEE
    BorderColor #333333
    FontName Consolas
}

[*] --> Todo

Todo --> InProgress : 开始任务
InProgress --> Done : 完成任务
InProgress --> Todo : 退回任务
InProgress --> Blocked : 阻塞任务
Blocked --> InProgress : 解除阻塞
Blocked --> Todo : 取消阻塞
Done --> Todo : 重新打开

note right of Todo
    status: 'todo'
    任务待处理
end note

note right of InProgress
    status: 'in_progress'
    任务进行中
end note

note right of Done
    status: 'done'
    任务已完成
end note

note right of Blocked
    status: 'blocked'
    任务被阻塞
    需要手动解除
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  任务状态转换:                                           |
|                                                          |
|    +-------+                                            |
|    |  TODO |                                            |
|    +-------+                                            |
|       |                                                  |
|       | 开始任务                                         |
|       v                                                  |
|    +----------------+                                    |
|    |                |                                    |
|    |  IN_PROGRESS   |                                   |
|    |                |                                    |
|    +----------------+                                    |
|       |                |                 |                |
|       | 完成任务       | 退回任务         | 阻塞任务       |
|       v                v                 v                |
|    +-------+      +-------+       +--------+            |
|    |  DONE |      |  TODO |       |BLOCKED |            |
|    +-------+      +-------+       +--------+            |
|       |                                    |             |
|       | 重新打开                           | 解除阻塞     |
|       +-----------------------------------+             |
|                                                          |
+----------------------------------------------------------+
```

### 5.2 任务优先级状态

```plantuml
@startuml Task_Priority_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<high>> #FFF8E1
    BackgroundColor<<urgent>> #FFEBEE
    BorderColor #333333
    FontName Consolas
}

[*] --> Low
Low --> Medium : 提高优先级
Medium --> Low : 降低优先级
Medium --> High : 提高优先级
High --> Medium : 降低优先级
High --> Urgent : 紧急提升
Urgent --> High : 降低优先级

note right of Low
    priority: 'low'
    绿色标记
end note

note right of Medium
    priority: 'medium'
    黄色标记
end note

note right of High
    priority: 'high'
    橙色标记
end note

note right of Urgent
    priority: 'urgent'
    红色标记，最高级别
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  优先级状态:      颜色编码:                               |
|                                                          |
|      +------+                                            |
|      | LOW  |  绿色                                       |
|      +------+                                            |
|        ^  |                                              |
|        |  v                                              |
|      +------+                                            |
|      |MEDIUM|  黄色                                       |
|      +------+                                            |
|        ^  |                                              |
|        |  v                                              |
|      +------+                                            |
|      | HIGH |  橙色                                       |
|      +------+                                            |
|        ^  |                                              |
|        |  v                                              |
|      +------+                                            |
|      |URGENT|  红色 (最高)                                |
|      +------+                                            |
|                                                          |
+----------------------------------------------------------+
```

### 5.3 项目成员角色状态

```plantuml
@startuml Project_Member_Role_State
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<owner>> #FFF8E1
    BackgroundColor<<admin>> #E3F2FD
    BorderColor #333333
}

[*] --> Member

Member --> Admin : 提升为管理员
Admin --> Member : 降级为成员
Admin --> Viewer : 降级为查看者
Viewer --> Member : 提升为成员

note right of Owner
    角色: 'owner'
    所有者，拥有所有权限
end note

note right of Admin
    角色: 'admin'
    管理员，管理项目和成员
end note

note right of Member
    角色: 'member'
    成员，可编辑任务
end note

note right of Viewer
    角色: 'viewer'
    查看者，只读权限
end note
@enduml
```

---

## 6. 会议状态机

### 6.1 会议生命周期状态

#### PlantUML 状态图

```plantuml
@startuml Meeting_Lifecycle_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<active>> #E3F2FD
    BackgroundColor<<ended>> #F3E5F5
    BackgroundColor<<cancelled>> #FFEBEE
    BorderColor #333333
    FontName Consolas
}

[*] --> Scheduled

Scheduled --> Active : 会议开始
Scheduled --> Cancelled : 会议取消
Active --> Ended : 会议结束
Cancelled --> [*]
Ended --> [*]

note right of Scheduled
    status: 'scheduled' | 'waiting'
    预约会议，等待开始
end note

note right of Active
    status: 'active'
    会议进行中
    参与者可加入/离开
end note

note right of Ended
    status: 'ended'
    会议已结束
    录制可回放
end note

note right of Cancelled
    status: 'cancelled'
    会议已取消
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  会议生命周期:                                           |
|                                                          |
|    +-------------+                                      |
|    |             |                                      |
|    |  SCHEDULED |                                      |
|    |             |                                      |
|    +-------------+                                      |
|          |                                              |
|          | 会议开始                                      |
|          v                                              |
|    +-------------+      +-------------+                 |
|    |             |      |             |                 |
|    |   ACTIVE   | ---> |   ENDED     |                 |
|    |             |      |             |                 |
|    +-------------+      +-------------+                 |
|          |                   |                          |
|          | 会议取消           |                          |
|          v                   |                          |
|    +-------------+           |                          |
|    |             |           |                          |
|    | CANCELLED  | ----------+                          |
|    |             |                                      |
|    +-------------+                                      |
|                                                          |
+----------------------------------------------------------+
```

### 6.2 会议类型状态

```plantuml
@startuml Meeting_Type_State
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<instant>> #E3F2FD
    BorderColor #333333
}

[*] --> Instant
Instant --> Instant : 创建即时会议

[*] --> Scheduled
Scheduled --> Scheduled : 预约会议

note right of Instant
    type: 'instant'
    即时会议，立即开始
end note

note right of Scheduled
    type: 'scheduled'
    预约会议，指定时间开始
    scheduledAt: timestamp
end note
@enduml
```

### 6.3 会议参与者状态

```plantuml
@startuml Meeting_Participant_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<joined>> #E3F2FD
    BackgroundColor<<left>> #F3E5F5
    BorderColor #333333
}

[*] --> Invited

Invited --> Joined : 加入会议
Joined --> Left : 离开会议
Left --> [*]

Joined --> Joined : 切换音视频
Joined --> Joined : 静音/取消静音

note right of Invited
    收到会议邀请
    等待加入
end note

note right of Joined
    已加入会议
    isInMeeting: true
end note

note right of Left
    已离开会议
    isInMeeting: false
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  参与者状态:                                             |
|                                                          |
|    +-------------+                                      |
|    |             |                                      |
|    |   INVITED   |                                      |
|    |             |                                      |
|    +-------------+                                      |
|          |                                              |
|          | 加入会议                                     |
|          v                                              |
|    +-------------+                                      |
|    |             |                                      |
|    |   JOINED   | <----------------------+              |
|    |             |                       |              |
|    +-------------+                       |              |
|          |                               | 离开会议     |
|          | 静音/取消静音                   |              |
|          | 开关摄像头                     |              |
|          | 屏幕共享                       |              |
|          v                               |              |
|    +-------------+                       |              |
|    |             |                       |              |
|    |    LEFT    | -----------------------+              |
|    |             |                                      |
|    +-------------+                                      |
|                                                          |
+----------------------------------------------------------+
```

### 6.4 参与者设备状态

```plantuml
@startuml Participant_Device_State
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<muted>> #FFEBEE
    BorderColor #333333
}

[*] --> Unmuted
Unmuted --> Muted : 静音
Muted --> Unmuted : 取消静音

[*] --> VideoOff
VideoOff --> VideoOn : 开启摄像头
VideoOn --> VideoOff : 关闭摄像头

note right of Muted
    isMuted: true
    麦克风关闭
end note

note right of VideoOn
    isVideoOn: true
    摄像头开启
end note
@enduml
```

---

## 7. 知识库状态机

### 7.1 空间状态

#### PlantUML 状态图

```plantuml
@startuml Space_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<archived>> #F3E5F5
    BorderColor #333333
    FontName Consolas
}

[*] --> Active
Active --> Archived : 归档空间
Archived --> Active : 恢复空间

note right of Active
    空间活跃
    可创建知识库
end note

note right of Archived
    空间已归档
    只读状态
end note
@enduml
```

### 7.2 知识库状态

```plantuml
@startuml KnowledgeBase_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<archived>> #F3E5F5
    BorderColor #333333
    FontName Consolas
}

[*] --> Active
Active --> Archived : 归档知识库
Archived --> Active : 恢复知识库

note right of Active
    知识库活跃
    可编辑内容
end note
@enduml
```

### 7.3 节点类型状态

```plantuml
@startuml KnowledgeNode_Type_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<document>> #E3F2FD
    BackgroundColor<<folder>> #FFF8E1
    BorderColor #333333
    FontName Consolas
}

[*] --> Space

Space --> Base : 创建知识库
Base --> Folder : 创建文件夹
Folder --> Document : 创建文档
Folder --> Folder : 嵌套文件夹

note right of Space
    type: 'space'
    顶级组织单元（团队/部门）
end note

note right of Base
    type: 'base'
    知识库（二级组织）
end note

note right of Folder
    type: 'folder'
    文件夹（容器）
end note

note right of Document
    type: 'document'
    具体文档（内容）
end note
@enduml
```

#### ASCII 状态图

```
+----------------------------------------------------------+
|                                                          |
|  知识库层级结构:                                         |
|                                                          |
|    +----------+                                         |
|    |  SPACE   |  (空间 - 顶级组织单元)                   |
|    |          |                                         |
|    +----------+                                         |
|        |                                                 |
|        | 创建知识库                                      |
|        v                                                 |
|    +----------+                                         |
|    |   BASE   |  (知识库 - 二级组织)                     |
|    |          |                                         |
|    +----------+                                         |
|        |                                                 |
|        | 创建节点                                        |
|        v                                                 |
|    +----------+     +----------+                        |
|    |  FOLDER  | --> |  FOLDER  | (嵌套文件夹)           |
|    +----------+     +----------+                        |
|        |                                                 |
|        | 创建文档                                        |
|        v                                                 |
|    +----------+                                         |
|    | DOCUMENT |  (文档 - 具体内容)                        |
|    +----------+                                         |
|                                                          |
+----------------------------------------------------------+
```

### 7.4 知识库成员权限状态

```plantuml
@startuml Knowledge_Member_Role_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<owner>> #FFF8E1
    BackgroundColor<<admin>> #E3F2FD
    BorderColor #333333
    FontName Consolas
}

[*] --> Owner

Owner --> Admin : 转让所有权
Admin --> Owner : 接受转让

Member --> Editor : 提升权限
Editor --> Member : 降低权限

Admin --> Member : 降级
Member --> Admin : 提升

note right of Owner
    角色: 'owner'
    所有者，完全控制权
end note

note right of Admin
    角色: 'admin'
    管理员，管理成员和设置
end note

note right of Editor
    角色: 'editor'
    编辑者，可编辑内容
end note

note right of Member
    角色: 'reader'
    成员，只读权限
end note
@enduml
```

#### ASCII 权限对比表

```
+----------------------------------------------------------+
|                                                          |
|  权限层级 (从高到低):                                     |
|                                                          |
|  +-------------+--------+--------+--------+--------+    |
|  |    角色     |  空间  | 知识库 |  成员  |  内容  |    |
|  +-------------+--------+--------+--------+--------+    |
|  |   owner     |   √    |   √    |   √    |   √    |    |
|  +-------------+--------+--------+--------+--------+    |
|  |   admin     |   -    |   √    |   √    |   √    |    |
|  +-------------+--------+--------+--------+--------+    |
|  |   editor    |   -    |   -    |   -    |   √    |    |
|  +-------------+--------+--------+--------+--------+    |
|  |   reader    |   -    |   -    |   -    |   r    |    |
|  +-------------+--------+--------+--------+--------+    |
|                                                          |
|  √ = 完全权限  - = 无权限  r = 只读                      |
+----------------------------------------------------------+
```

### 7.5 分享状态

```plantuml
@startuml Share_State_Machine
skinparam state {
    BackgroundColor #E8F5E9
    BackgroundColor<<shared>> #E3F2FD
    BorderColor #333333
    FontName Consolas
}

[*] --> Private
Private --> Shared : 开启分享
Shared --> Private : 关闭分享
Shared --> Shared : 更新分享设置

note right of Private
    isPublic: false
    未分享
end note

note right of Shared
    isPublic: true
    已分享
    可设置密码保护
end note
@enduml
```

---

## 附录

### A. 状态机实现参考

所有状态机均在以下位置实现:

- **前端状态管理**: `frontend/src/store/`
  - `documentStore.ts` - 文档状态
  - `commentStore.ts` - 评论与批注状态
  - `projectStore.ts` - 项目任务状态
  - `meetingStore.ts` - 会议状态
  - `knowledgeStore.ts` - 知识库状态

- **后端实体**: `backend/src/`
  - `documents/document.entity.ts` - 文档实体
  - `documents/block-lock.entity.ts` - 块锁实体
  - `comments/comment.entity.ts` - 评论实体
  - `comments/annotation.entity.ts` - 批注实体
  - `projects/project.entity.ts` - 项目实体
  - `meetings/meeting.entity.ts` - 会议实体
  - `knowledge/knowledge.entity.ts` - 知识库实体

### B. 状态转换事件汇总

| 模块 | 事件 | 触发条件 |
|------|------|----------|
| 文档 | publish | 发布文档 |
| 文档 | archive | 归档文档 |
| 文档 | restore | 恢复文档 |
| 文档 | delete | 移至回收站 |
| 块锁 | lock | 开始编辑块 |
| 块锁 | unlock | 停止编辑/超时 |
| 评论 | resolve | 解决评论 |
| 评论 | archive | 归档评论 |
| 批注 | resolve | 解决批注 |
| 批注 | assign | 指派批注 |
| 任务 | start | 开始任务 |
| 任务 | complete | 完成任务 |
| 任务 | block | 阻塞任务 |
| 任务 | unblock | 解除阻塞 |
| 会议 | start | 会议开始 |
| 会议 | end | 会议结束 |
| 会议 | cancel | 取消会议 |
| 知识库 | share | 开启分享 |
