# NotificationPanel 组件

## 概述

NotificationPanel(通知中心)组件提供应用内的通知管理功能,支持通知列表、筛选、标记已读、删除等操作。通知类型包括提及、评论、分享、指派、任务、会议、系统通知等。

## 核心特性

- **多类型通知**: 支持多种通知类型
- **实时推送**: 基于 Socket.io 实时接收通知
- **筛选功能**: 按类型筛选通知
- **批量操作**: 标记全部已读、批量删除
- **状态管理**: 未读数量 Badge 显示

## Props 接口

```typescript
interface NotificationPanelProps {
  // 触发器
  trigger?: React.ReactNode;

  // 配置
  maxHeight?: number;
  pageSize?: number;

  // 用户信息
  currentUserId: string;

  // 回调
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
}
```

## 内部状态

```typescript
interface NotificationPanelState {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  filterType: NotificationType | 'all';
  selectedNotification: Notification | null;
}
```

## 核心逻辑实现

### 1. 通知列表渲染

```typescript
const NotificationPanel: React.FC<NotificationPanelProps> = ({
  currentUserId,
  onNotificationClick,
}) => {
  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  // 加载通知
  useEffect(() => {
    if (panelOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [panelOpen]);

  // 实时监听新通知
  useEffect(() => {
    const socket = socketClient.getInstance();

    socket.on('notification:new', (notification: Notification) => {
      // 添加新通知到列表
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('notification:new');
    };
  }, []);

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 标记为已读
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }

    // 导航到相关页面
    if (notification.link) {
      router.push(notification.link);
    }

    onNotificationClick?.(notification);
  };

  // 过滤通知
  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  return (
    <Popover
      content={
        <div className="notification-panel" style={{ width: 380, maxHeight: 500 }}>
          {/* 头部 */}
          <div className="panel-header">
            <div className="header-title">
              <Bell size={18} />
              <span>通知中心</span>
              {unreadCount > 0 && <Badge count={unreadCount} />}
            </div>
            <div className="header-actions">
              <Button
                type="text"
                size="small"
                icon={<CheckCheck size={16} />}
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
              >
                全部已读
              </Button>
            </div>
          </div>

          {/* 筛选标签 */}
          <div className="filter-tabs">
            {(['all', 'mention', 'comment', 'task', 'system'] as const).map(type => (
              <Button
                key={type}
                type={filterType === type ? 'primary' : 'text'}
                size="small"
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? '全部' :
                 type === 'mention' ? '提及' :
                 type === 'comment' ? '评论' :
                 type === 'task' ? '任务' : '系统'}
              </Button>
            ))}
          </div>

          {/* 通知列表 */}
          <div className="notification-list">
            {isLoading ? (
              <Spin />
            ) : filteredNotifications.length === 0 ? (
              <Empty description="暂无通知" />
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isUnread={notification.status === 'unread'}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      }
      trigger="click"
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <div className="notification-trigger">
          <Bell size={20} />
        </div>
      </Badge>
    </Popover>
  );
};
```

### 2. 通知项组件

```typescript
const NotificationItem: React.FC<{
  notification: Notification;
  isUnread: boolean;
  onClick: () => void;
  onDelete: () => void;
}> = ({ notification, isUnread, onClick, onDelete }) => {
  // 通知类型图标
  const getIcon = () => {
    switch (notification.type) {
      case 'mention':
        return <AtSign size={16} className="icon-mention" />;
      case 'comment':
        return <MessageSquare size={16} className="icon-comment" />;
      case 'task':
        return <CheckSquare size={16} className="icon-task" />;
      case 'meeting':
        return <Video size={16} className="icon-meeting" />;
      default:
        return <Bell size={16} className="icon-system" />;
    }
  };

  return (
    <div
      className={`notification-item ${isUnread ? 'unread' : ''}`}
      onClick={onClick}
    >
      {/* 通知图标/头像 */}
      <div className="notification-icon">
        {notification.senderAvatar ? (
          <Avatar src={notification.senderAvatar} size={40} />
        ) : (
          <div className="icon-wrapper">{getIcon()}</div>
        )}
      </div>

      {/* 通知内容 */}
      <div className="notification-content">
        <div className="notification-title">
          {notification.title}
        </div>
        <div className="notification-body">
          {notification.content}
        </div>
        <div className="notification-time">
          {formatTime(notification.createdAt)}
        </div>
      </div>

      {/* 未读标记 */}
      {isUnread && <div className="unread-dot" />}

      {/* 删除按钮 */}
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
```

---

# ShareDialog 组件

## 概述

ShareDialog(分享对话框)组件提供文档、知识库等资源的分享功能,支持创建分享链接、设置权限、密码保护、过期时间、查看次数限制等。

## 核心特性

- **分享链接创建**: 生成可分享的链接
- **权限设置**: 查看、编辑、管理员权限
- **密码保护**: 可选的访问密码
- **过期时间**: 可选的链接过期时间
- **访问次数限制**: 可选的查看次数上限
- **链接管理**: 编辑、删除已创建的分享

## Props 接口

```typescript
interface ShareDialogProps {
  // 对话框配置
  open: boolean;
  onClose: () => void;

  // 分享目标
  targetType: 'document' | 'knowledge' | 'project';
  targetId: string;
  targetTitle: string;

  // 回调
  onShareCreate?: (share: Share) => void;
  onShareUpdate?: (id: string, data: Partial<Share>) => void;
  onShareDelete?: (id: string) => void;
}
```

## 核心逻辑实现

```typescript
const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const {
    shares,
    loading,
    fetchSharesByTarget,
    createShare,
    updateShare,
    deleteShare,
  } = useShareStore();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingShare, setEditingShare] = useState<Share | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    permission: 'view' as 'view' | 'edit' | 'admin',
    expiresAt: undefined as dayjs.Dayjs | undefined,
    maxViews: 0,
    requirePassword: false,
    password: '',
  });

  // 加载分享列表
  useEffect(() => {
    if (open && targetId) {
      fetchSharesByTarget(targetType, targetId);
    }
  }, [open, targetId, targetType]);

  // 创建分享
  const handleCreate = async () => {
    await createShare({
      type: targetType,
      targetId,
      targetTitle,
      permission: formData.permission,
      expiresAt: formData.expiresAt?.toISOString(),
      maxViews: formData.maxViews || undefined,
      requirePassword: formData.requirePassword,
      password: formData.requirePassword ? formData.password : undefined,
    });
    setMode('list');
    resetForm();
  };

  // 复制链接
  const copyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制到剪贴板');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      title={null}
    >
      {mode === 'list' ? (
        // 列表模式
        <div className="share-list">
          <div className="list-header">
            <h3>分享 "{targetTitle}"</h3>
            <Button
              type="primary"
              icon={<Share2 size={14} />}
              onClick={() => setMode('create')}
            >
              创建分享链接
            </Button>
          </div>

          {shares.length === 0 ? (
            <Empty description="暂无分享链接" />
          ) : (
            <List
              dataSource={shares}
              renderItem={share => (
                <List.Item
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<Edit size={14} />}
                      onClick={() => {
                        setEditingShare(share);
                        setFormData({
                          permission: share.permission,
                          expiresAt: share.expiresAt ? dayjs(share.expiresAt) : undefined,
                          maxViews: share.maxViews,
                          requirePassword: share.requirePassword,
                          password: '',
                        });
                        setMode('edit');
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确定删除此分享链接?"
                      onConfirm={() => deleteShare(share.id)}
                    >
                      <Button type="text" danger icon={<Trash2 size={14} />} />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<LinkIcon />}
                    title={
                      <Space>
                        <code>{share.shareCode}</code>
                        <Tag color={share.permission === 'view' ? 'blue' : share.permission === 'edit' ? 'green' : 'purple'}>
                          {share.permission === 'view' ? '可查看' : share.permission === 'edit' ? '可编辑' : '管理员'}
                        </Tag>
                        {share.requirePassword && <Tag icon={<Lock size={10} />} color="orange">密码</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{share.viewCount} / {share.maxViews || '∞'} 次</span>
                        {share.expiresAt && <span>过期: {dayjs(share.expiresAt).format('YYYY-MM-DD')}</span>}
                        <Button
                          type="link"
                          size="small"
                          icon={<Copy size={12} />}
                          onClick={() => copyLink(share.shareUrl)}
                        >
                          {share.shareUrl}
                        </Button>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      ) : (
        // 创建/编辑模式
        <div className="share-form">
          <div className="form-header">
            <h3>{mode === 'create' ? '创建分享链接' : '编辑分享链接'}</h3>
            <Button type="text" icon={<X size={18} />} onClick={() => { setMode('list'); resetForm(); }} />
          </div>

          {/* 权限设置 */}
          <Form.Item label="访问权限">
            <Select
              value={formData.permission}
              onChange={(value) => setFormData({ ...formData, permission: value })}
            >
              <Option value="view">仅查看</Option>
              <Option value="edit">可编辑</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          {/* 过期时间 */}
          <Form.Item label="过期时间">
            <DatePicker
              showTime
              value={formData.expiresAt}
              onChange={(value) => setFormData({ ...formData, expiresAt: value || undefined })}
              placeholder="永不过期"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 查看次数限制 */}
          <Form.Item label="查看次数">
            <InputNumber
              min={0}
              value={formData.maxViews}
              onChange={(value) => setFormData({ ...formData, maxViews: value || 0 })}
              style={{ width: '100%' }}
              addonAfter="次"
            />
          </Form.Item>

          {/* 密码保护 */}
          <Form.Item>
            <Space>
              <Switch
                checked={formData.requirePassword}
                onChange={(checked) => setFormData({ ...formData, requirePassword: checked })}
              />
              <span>密码保护</span>
            </Space>
          </Form.Item>

          {formData.requirePassword && (
            <Form.Item label="访问密码">
              <Input.Password
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入访问密码"
              />
            </Form.Item>
          )}

          <div className="form-actions">
            <Button onClick={() => setMode('list')}>取消</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              disabled={formData.requirePassword && !formData.password}
            >
              {mode === 'create' ? '创建链接' : '保存设置'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

---

# VisualNodeMap 组件

## 概述

VisualNodeMap(可视化节点图)组件使用 Three.js 和 React Three Fiber 实现 3D 知识图谱可视化,将文档和知识库以 3D 节点网络的形式展示,支持交互式探索。

## 核心特性

- **3D 可视化**: 使用 WebGL 渲染 3D 节点网络
- **交互探索**: 拖拽旋转、缩放、点击节点
- **节点类型区分**: 不同形状和颜色区分文件夹/文档
- **连接线显示**: 显示节点之间的关联关系
- **动态效果**: 节点浮动动画、光晕效果

## 核心实现

```typescript
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Line } from '@react-three/drei';
import * as THREE from 'three';

interface NodeData {
  id: string;
  title: string;
  type: 'folder' | 'document';
  position: [number, number, number];
  connections: string[];
}

// 节点组件
const NodeObj: React.FC<{
  node: NodeData;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: NodeData) => void;
}> = ({ node, isHovered, onHover, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 旋转动画
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  // 节点样式
  const isRoot = node.id === 'root-0';
  const color = isRoot ? '#8B5CF6' : node.type === 'folder' ? '#3B82F6' : '#14B8A6';
  const size = isRoot ? 1.5 : node.type === 'folder' ? 1 : 0.6;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <group position={node.position}>
        {/* 节点几何体 */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(node.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            onHover(null);
            document.body.style.cursor = 'auto';
          }}
        >
          {node.type === 'folder' || isRoot ? (
            <icosahedronGeometry args={[size, 1]} />
          ) : (
            <octahedronGeometry args={[size, 0]} />
          )}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isHovered ? 1.5 : 0.5}
            wireframe={isHovered}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* 悬停光晕 */}
        {isHovered && (
          <mesh>
            <sphereGeometry args={[size * 1.5, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} />
          </mesh>
        )}

        {/* 节点标签 */}
        <Html distanceFactor={15} center position={[0, size + 0.5, 0]}>
          <div className={`node-label ${isHovered ? 'hovered' : ''}`}>
            {node.type === 'folder' ? <FolderIcon /> : <FileTextIcon />}
            <span>{node.title}</span>
          </div>
        </Html>
      </group>
    </Float>
  );
};

// 连接线组件
const Edges: React.FC<{ nodes: NodeData[] }> = ({ nodes }) => {
  const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
  const drawn = new Set<string>();

  nodes.forEach(node => {
    node.connections.forEach(targetId => {
      const pairId = [node.id, targetId].sort().join('-');
      if (!drawn.has(pairId)) {
        drawn.add(pairId);
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) {
          lines.push({ start: node.position, end: targetNode.position });
        }
      }
    });
  });

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color="#374151"
          lineWidth={1.5}
          transparent
          opacity={0.4}
        />
      ))}
    </>
  );
};

// 主组件
const VisualNodeMap: React.FC = () => {
  const nodes = useMemo(() => generateNodes(), []);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <div className="visual-node-map">
      {/* HUD 界面 */}
      <div className="map-hud">
        <h2>知识图谱孪生网络</h2>
        <p>借助 WebGL 与 Three.js 实时渲染的 3D 数据拓扑</p>
      </div>

      <Canvas camera={{ position: [0, 15, 25], fov: 45 }}>
        <color attach="background" args={['#050505']} />

        {/* 灯光 */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />

        {/* 星空背景 */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* 节点和连接 */}
        <group position={[0, -2, 0]}>
          <Edges nodes={nodes} />
          {nodes.map(node => (
            <NodeObj
              key={node.id}
              node={node}
              isHovered={hoveredNodeId === node.id}
              onHover={setHoveredNodeId}
              onClick={(node) => {
                if (node.type === 'document') {
                  router.push(`/editor?id=${node.id}`);
                }
              }}
            />
          ))}
        </group>

        {/* 轨道控制 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={!hoveredNodeId}
          autoRotateSpeed={0.5}
          maxDistance={50}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
};
```

## 使用示例

```tsx
<VisualNodeMap />

// 或带自定义数据
<VisualNodeMap
  nodes={[
    { id: 'root', title: '工作空间', type: 'folder', position: [0, 0, 0], connections: ['doc1'] },
    { id: 'doc1', title: '设计文档', type: 'document', position: [5, 2, 3], connections: ['root'] },
  ]}
/>
```
