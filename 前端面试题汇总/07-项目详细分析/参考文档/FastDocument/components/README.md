# FastDocument 前端组件技术文档

本目录包含 FastDocument 项目所有前端组件的详细技术文档。

## 目录结构

```
docs/components/
├── editor/                 # 编辑器组件
│   ├── Editor.md           # 主编辑器组件
│   ├── VirtualEditor.md   # 虚拟滚动编辑器
│   ├── BlockTransformMenu.md  # 块转换菜单
│   └── BlockComponents.md # 块组件(CodeBlock, TableBlock, ImageBlock, TodoBlock, CalloutBlock)
│
├── layout/                 # 布局组件
│   ├── UnifiedLayout.md    # 统一布局管理器
│   └── Sidebar.md          # 侧边栏和头部导航
│
├── collaboration/          # 协作组件
│   └── ChatDrawer.md       # 聊天抽屉、评论面板、批注组件等
│
├── project/                # 项目管理组件
│   └── ProjectView.md     # 项目视图、看板、任务卡片、日历、甘特图
│
├── knowledge/              # 知识库组件
│   └── KnowledgeBaseView.md  # 知识库视图、知识树、文档页面
│
└── other/                  # 其他组件
    └── OtherComponents.md  # 视频会议、通知中心、分享对话框、可视化节点图
```

## 组件概览

### 编辑器组件 (Editor Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| Editor | 主编辑器组件 | 原子化块系统、实时协作、快捷菜单 |
| VirtualEditor | 虚拟滚动编辑器 | 大文档性能优化、动态块高度 |
| BlockTransformMenu | 块转换菜单 | 快捷插入块、键盘导航 |
| CodeBlock | 代码块 | 语法高亮、行号、复制 |
| TableBlock | 表格块 | 编辑、行列操作、排序 |
| ImageBlock | 图片块 | 上传、裁剪、滤镜 |
| TodoBlock | 待办块 | 勾选、优先级、截止日期 |
| CalloutBlock | 提示块 | 多类型提示、折叠 |

### 布局组件 (Layout Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| UnifiedLayout | 统一布局管理器 | 响应式适配、主题切换 |
| Sidebar | 侧边栏 | 文档树、模块导航 |
| Header | 头部导航 | 面包屑、搜索、用户菜单 |

### 协作组件 (Collaboration Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| ChatDrawer | 聊天抽屉 | 实时消息、@提及 |
| CommentPanel | 评论面板 | 文档/块级评论、回复 |
| Annotation | 批注组件 | 高亮、下划线、建议 |
| ParticipantPanel | 参与者面板 | 在线状态、编辑位置 |
| VersionHistoryPanel | 版本历史 | 版本预览、对比、恢复 |

### 项目管理组件 (Project Management Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| ProjectView | 项目视图 | 多视图切换 |
| KanbanBoard | 看板 | 列管理、拖拽、WIP |
| TaskCard | 任务卡片 | 优先级、标签、负责人 |
| CalendarView | 日历视图 | 月/周视图、任务日期 |
| GanttChart | 甘特图 | 时间线、依赖、进度 |

### 知识库组件 (Knowledge Base Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| KnowledgeBaseView | 知识库视图 | 空间/知识库管理 |
| KnowledgeTree | 知识树 | 拖拽排序、搜索 |
| KnowledgeDocumentPage | 文档页面 | 文档编辑、批注 |

### 其他组件 (Other Components)

| 组件 | 描述 | 关键特性 |
|------|------|----------|
| VideoConference | 视频会议 | WebRTC、屏幕共享 |
| NotificationPanel | 通知中心 | 多类型、实时推送 |
| ShareDialog | 分享对话框 | 链接创建、权限 |
| VisualNodeMap | 可视化节点图 | 3D 知识图谱 |

## 文档格式

每个组件文档包含以下部分:

1. **概述**: 组件功能和用途简介
2. **Props 接口**: TypeScript 类型定义
3. **内部状态**: 组件内部状态管理
4. **核心逻辑实现**: 主要功能代码示例
5. **性能优化点**: 性能优化策略
6. **使用示例**: 典型使用场景代码

## 相关资源

- [CLAUDE.md](../../CLAUDE.md) - 项目总体规范
- [Store 文档](../store/) - 状态管理文档
- [API 文档](../api/) - 后端接口文档
