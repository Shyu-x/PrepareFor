# KnowledgeBaseView 组件

## 概述

KnowledgeBaseView(知识库视图)组件是知识库模块的主容器,负责管理空间(Space)和知识库(Knowledge Base)的层级结构,提供空间创建、知识库管理、成员权限等功能。

## 核心特性

- **空间管理**: 创建、编辑、删除知识空间
- **知识库管理**: 创建、编辑、删除知识库
- **成员权限**: 空间和知识库级别的成员管理
- **搜索功能**: 搜索知识库和文档

## Props 接口

```typescript
interface KnowledgeBaseViewProps {
  // 回调
  onDocumentSelect?: (docId: string) => void;
  onSpaceCreate?: (name: string) => Promise<Space>;
  onBaseCreate?: (spaceId: string, name: string) => Promise<KnowledgeBase>;
  onBaseUpdate?: (baseId: string, data: Partial<KnowledgeBase>) => Promise<void>;
  onBaseDelete?: (baseId: string) => Promise<void>;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface KnowledgeBaseViewState {
  // 数据
  spaces: Space[];
  knowledgeBases: KnowledgeBase[];
  currentSpace: Space | null;
  currentBase: KnowledgeBase | null;
  tree: KnowledgeNode[];

  // UI 状态
  isLoading: boolean;
  showCreateSpace: boolean;
  showCreateBase: boolean;
  showShareModal: boolean;
  showSettingsPanel: boolean;

  // 搜索
  searchKeyword: string;
}
```

## 核心逻辑实现

### 1. 空间和知识库导航

```typescript
const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  onDocumentSelect,
}) => {
  const {
    spaces,
    knowledgeBases,
    currentSpace,
    currentBase,
    fetchSpaces,
    fetchKnowledgeBases,
    fetchKnowledgeBase,
    createSpace,
    createKnowledgeBase,
    setCurrentSpace,
    setCurrentBase,
  } = useKnowledgeStore();

  const [selectedDocument, setSelectedDocument] = useState<KnowledgeNode | null>(null);

  // 加载空间列表
  useEffect(() => {
    fetchSpaces();
  }, []);

  // 加载知识库列表
  useEffect(() => {
    if (currentSpace) {
      fetchKnowledgeBases(currentSpace.id);
    }
  }, [currentSpace]);

  // 加载知识库树
  useEffect(() => {
    if (currentBase) {
      fetchKnowledgeBase(currentBase.id);
    }
  }, [currentBase]);

  // 视图渲染逻辑
  // 1. 未选择空间 - 显示空间列表
  // 2. 已选择空间但未选择知识库 - 显示知识库列表
  // 3. 已选择知识库 - 显示知识库树和文档内容
  const renderView = () => {
    if (!currentSpace) {
      return <SpaceList onSpaceSelect={setCurrentSpace} />;
    }

    if (!currentBase) {
      return (
        <BaseList
          space={currentSpace}
          bases={knowledgeBases}
          onBaseSelect={setCurrentBase}
        />
      );
    }

    return (
      <KnowledgeTree
        tree={tree}
        onSelectDocument={handleSelectDocument}
      />
    );
  };

  return (
    <div className="knowledge-base-view">
      {/* 左侧栏 */}
      <div className="kb-sidebar">
        {currentSpace ? (
          <SpaceHeader
            space={currentSpace}
            onBack={() => setCurrentSpace(null)}
          />
        ) : (
          <div className="kb-title">知识库</div>
        )}

        {currentSpace && (
          <BaseList
            space={currentSpace}
            bases={knowledgeBases}
            currentBaseId={currentBase?.id}
            onBaseSelect={setCurrentBase}
            onBaseCreate={() => setShowCreateBase(true)}
          />
        )}
      </div>

      {/* 主内容区 */}
      <div className="kb-content">
        {renderView()}
      </div>

      {/* 创建空间弹窗 */}
      <Modal
        open={showCreateSpace}
        onOk={handleCreateSpace}
        onCancel={() => setShowCreateSpace(false)}
      >
        <Input
          placeholder="输入空间名称"
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
        />
      </Modal>

      {/* 创建知识库弹窗 */}
      <Modal
        open={showCreateBase}
        onOk={handleCreateBase}
        onCancel={() => setShowCreateBase(false)}
      >
        <Input
          placeholder="输入知识库名称"
          value={newBaseName}
          onChange={(e) => setNewBaseName(e.target.value)}
        />
      </Modal>
    </div>
  );
};
```

### 2. 空间选择视图

```typescript
const SpaceList: React.FC<{
  onSpaceSelect: (space: Space) => void;
}> = ({ onSpaceSelect }) => {
  const { spaces, isLoading, createSpace } = useKnowledgeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <div className="space-list">
      <div className="list-header">
        <h2>知识库</h2>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowCreate(true)}
        >
          创建空间
        </Button>
      </div>

      {isLoading ? (
        <Spin />
      ) : (
        <div className="space-grid">
          {spaces.map(space => (
            <Card
              key={space.id}
              hoverable
              onClick={() => onSpaceSelect(space)}
            >
              <div className="space-card">
                <div className="space-icon">
                  <Folder size={24} />
                </div>
                <div className="space-info">
                  <h3>{space.name}</h3>
                  <p>{space.members?.length || 1} 位成员</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

# KnowledgeTree 组件

## 概述

KnowledgeTree(知识树)组件以树形结构展示知识库中的文档和文件夹,支持展开/折叠、拖拽排序、快速操作等功能。

## Props 接口

```typescript
interface KnowledgeTreeProps {
  // 数据
  tree?: KnowledgeNode[];

  // 配置
  selectedId?: string;
  onSelectDocument?: (node: KnowledgeNode) => void;

  // 操作回调
  onNodeCreate?: (parentId: string | null, type: 'folder' | 'document', name: string) => void;
  onNodeRename?: (nodeId: string, newName: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null, newIndex: number) => void;

  // 搜索
  showSearch?: boolean;
  searchPlaceholder?: string;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface KnowledgeTreeState {
  expandedNodes: Set<string>;
  selectedId: string | null;
  editingNodeId: string | null;
  searchKeyword: string;
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
}
```

## 核心逻辑实现

### 1. 树节点渲染

```typescript
const TreeNode: React.FC<{
  node: KnowledgeNode;
  level: number;
  selectedId?: string;
  expandedNodes: Set<string>;
  onSelect: (node: KnowledgeNode) => void;
  onToggle: (nodeId: string) => void;
  onRename: (nodeId: string, name: string) => void;
  onDelete: (nodeId: string) => void;
  onDragStart: (e: React.DragEvent, node: KnowledgeNode) => void;
  onDragOver: (e: React.DragEvent, node: KnowledgeNode) => void;
  onDrop: (e: React.DragEvent, targetNode: KnowledgeNode) => void;
}> = ({
  node,
  level,
  selectedId,
  expandedNodes,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = () => {
    if (node.type === 'folder' && hasChildren) {
      onToggle(node.id);
    }
    if (node.type === 'document') {
      onSelect(node);
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`node-content ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDrop={(e) => onDrop(e, node)}
        onClick={handleSelect}
      >
        {/* 展开/折叠图标 */}
        <span className="expand-icon">
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>

        {/* 节点图标 */}
        <span className="node-icon">
          {node.type === 'folder' ? (
            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <FileText size={16} />
          )}
        </span>

        {/* 节点名称 */}
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              onRename(node.id, editName);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(node.id, editName);
                setIsEditing(false);
              }
            }}
            autoFocus
            size="small"
          />
        ) : (
          <span className="node-name">{node.name}</span>
        )}

        {/* 操作按钮 */}
        <Dropdown
          menu={{
            items: [
              { key: 'rename', label: '重命名', icon: <Edit3 size={14} /> },
              { key: 'new-folder', label: '新建文件夹', icon: <Folder size={14} /> },
              { key: 'new-doc', label: '新建文档', icon: <FileText size={14} /> },
              { type: 'divider' },
              { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true },
            ],
          }}
          trigger={['click']}
        >
          <button className="more-btn">
            <MoreHorizontal size={14} />
          </button>
        </Dropdown>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="child-nodes">
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedNodes={expandedNodes}
              onSelect={onSelect}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2. 拖拽排序

```typescript
// 拖拽处理
const handleDragStart = (e: React.DragEvent, node: KnowledgeNode) => {
  e.dataTransfer.setData('text/plain', node.id);
  e.dataTransfer.effectAllowed = 'move';
  setDraggedNodeId(node.id);
};

const handleDragOver = (e: React.DragEvent, node: KnowledgeNode) => {
  e.preventDefault();
  if (draggedNodeId && draggedNodeId !== node.id) {
    setDragOverNodeId(node.id);
  }
};

const handleDrop = async (e: React.DragEvent, targetNode: KnowledgeNode) => {
  e.preventDefault();
  const sourceId = e.dataTransfer.getData('text/plain');

  if (!sourceId || sourceId === targetNode.id) return;

  // 检查是否是将父节点拖到子节点
  if (isDescendant(sourceId, targetNode.id)) {
    message.error('不能将父节点拖到子节点下');
    return;
  }

  // 执行移动
  const newParentId = targetNode.type === 'folder' ? targetNode.id : targetNode.parentId;
  await onNodeMove?.(sourceId, newParentId, 0);

  setDraggedNodeId(null);
  setDragOverNodeId(null);
};
```

### 3. 搜索过滤

```typescript
// 过滤树节点
const filterTree = (nodes: KnowledgeNode[], keyword: string): KnowledgeNode[] => {
  if (!keyword.trim()) return nodes;

  return nodes.reduce((acc: KnowledgeNode[], node) => {
    const matches = node.name.toLowerCase().includes(keyword.toLowerCase());
    const filteredChildren = node.children ? filterTree(node.children, keyword) : [];

    if (matches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }

    return acc;
  }, []);
};
```

---

# KnowledgeDocumentPage 组件

## 概述

KnowledgeDocumentPage(知识库文档页面)组件展示知识库中的单个文档,提供文档编辑、批注、分享等功能。

## 使用示例

```tsx
<KnowledgeDocumentPage
  node={selectedNode}
  onBack={() => setSelectedNode(null)}
  onSave={async (content) => {
    await updateDocument(node.id, { content });
  }}
/>
```

---

# VideoConference 组件

## 概述

VideoConference(视频会议)组件基于 LiveKit 实现 WebRTC 视频会议功能,支持创建会议、加入会议、屏幕共享、音视频控制等。

## 核心特性

- **会议创建**: 即时会议和预约会议
- **音视频控制**: 麦克风、摄像头开关
- **屏幕共享**: 共享整个屏幕或特定窗口
- **参会者管理**: 查看参会者、移除、静音
- **会议录制**: 可选的会议录制功能
- **网络状态**: 显示网络质量指示

## Props 接口

```typescript
interface VideoConferenceProps {
  // 会议配置
  meetingId?: string;
  mode?: 'create' | 'join';

  // 用户信息
  userName: string;
  userAvatar?: string;

  // 回调
  onLeave?: () => void;
  onParticipantJoin?: (participant: MeetingParticipant) => void;
  onParticipantLeave?: (participantId: string) => void;
}
```

## 核心逻辑实现

```typescript
const VideoConference: React.FC<VideoConferenceProps> = ({
  meetingId,
  mode = 'join',
  userName,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [layout, setLayout] = useState<'grid' | 'speaker'>('grid');

  // 连接 LiveKit
  useEffect(() => {
    const connect = async () => {
      // 获取会议令牌
      const token = await fetch(`/api/meetings/${meetingId}/token`)
        .then(res => res.json());

      // 连接到 LiveKit
      await livekitClient.connect({
        url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
        token: token.token,
        name: meetingId,
        audio: isAudioEnabled,
        video: isVideoEnabled,
      });

      setIsConnected(true);
    };

    if (meetingId) {
      connect();
    }

    return () => {
      livekitClient.disconnect();
    };
  }, [meetingId]);

  // 监听参与者
  useEffect(() => {
    if (!isConnected) return;

    const room = livekitClient.getRoom();

    room.on('participantConnected', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    room.on('participantDisconnected', (participant) => {
      setParticipants(prev => prev.filter(p => p.id !== participant.id));
    });

    room.on('trackSubscribed', (track, publication, participant) => {
      // 处理音视频轨道
    });
  }, [isConnected]);

  // 切换音频
  const toggleAudio = () => {
    if (isAudioEnabled) {
      livekitClient.muteAudio();
    } else {
      livekitClient.unmuteAudio();
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  // 切换视频
  const toggleVideo = () => {
    if (isVideoEnabled) {
      livekitClient.muteVideo();
    } else {
      livekitClient.unmuteVideo();
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  // 屏幕共享
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await livekitClient.stopScreenShare();
    } else {
      await livekitClient.startScreenShare();
    }
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <div className="video-conference">
      {/* 视频网格 */}
      <div className={`video-grid layout-${layout}`}>
        {participants.map(participant => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isLocal={participant.id === localParticipant.id}
          />
        ))}
      </div>

      {/* 控制栏 */}
      <div className="control-bar">
        <button
          className={`control-btn ${!isAudioEnabled ? 'off' : ''}`}
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          className={`control-btn ${!isVideoEnabled ? 'off' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
        >
          <Monitor size={20} />
        </button>

        <button className="control-btn leave" onClick={() => onLeave?.()}>
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
};
```
