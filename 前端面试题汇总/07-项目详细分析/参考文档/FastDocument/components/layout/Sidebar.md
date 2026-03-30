# Sidebar 组件

## 概述

Sidebar(侧边栏)组件是 FastDocument 应用的主要导航组件,提供文档树导航、功能模块切换、快捷操作等功能。支持折叠/展开、主题适配、响应式适配。

## 核心特性

- **文档树导航**: 树形结构展示文档层级
- **模块切换**: 快速切换文档、知识库、项目、会议等模块
- **快捷操作**: 搜索、新建文档、设置等快捷入口
- **折叠/展开**: 支持收起为图标模式
- **拖拽排序**: 支持文档拖拽移动

## Props 接口

```typescript
interface SidebarProps {
  // 布局配置
  collapsed?: boolean;
  width?: number;
  onCollapse?: (collapsed: boolean) => void;

  // 内容配置
  currentModule?: 'documents' | 'knowledge' | 'project' | 'meeting';
  onModuleChange?: (module: string) => void;

  // 文档树配置
  documentTree?: DocumentTreeNode[];
  selectedDocumentId?: string;
  onDocumentSelect?: (docId: string) => void;
  onDocumentCreate?: (parentId?: string) => void;
  onDocumentDelete?: (docId: string) => void;

  // 搜索配置
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface SidebarState {
  collapsed: boolean;
  expandedNodes: Set<string>;
  selectedDocumentId: string | null;
  searchQuery: string;
  activeModule: string;
  showCreateMenu: boolean;
  dragOverNodeId: string | null;
}
```

## 核心逻辑实现

### 1. 文档树渲染

```typescript
const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  width = 280,
  documentTree = [],
  selectedDocumentId,
  onDocumentSelect,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 切换节点展开状态
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 过滤文档树
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return documentTree;

    const filterNodes = (nodes: DocumentTreeNode[]): DocumentTreeNode[] => {
      return nodes.reduce((acc: DocumentTreeNode[], node) => {
        const matches = node.title.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }

        return acc;
      }, []);
    };

    return filterNodes(documentTree);
  }, [documentTree, searchQuery]);

  // 递归渲染树节点
  const renderTreeNode = (node: DocumentTreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedDocumentId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="tree-node">
        <div
          className={`tree-node-content ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onDocumentSelect?.(node.id);
          }}
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

          {/* 节点标题 */}
          <span className="node-title">{node.title}</span>

          {/* 更多操作 */}
          <Dropdown
            menu={{
              items: [
                { key: 'new', label: '新建', icon: <Plus size={14} /> },
                { key: 'rename', label: '重命名', icon: <Edit3 size={14} /> },
                { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true },
              ],
            }}
            trigger={['click']}
          >
            <button className="more-btn" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={14} />
            </button>
          </Dropdown>
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 搜索框 */}
      {collapsed ? null : (
        <div className="sidebar-search">
          <Input
            prefix={<Search size={14} />}
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
      )}

      {/* 模块导航 */}
      <nav className="sidebar-nav">
        <NavItem
          icon={<FileText size={20} />}
          label={collapsed ? '' : '文档'}
          active={currentModule === 'documents'}
          onClick={() => onModuleChange?.('documents')}
          collapsed={collapsed}
        />
        <NavItem
          icon={<BookOpen size={20} />}
          label={collapsed ? '' : '知识库'}
          active={currentModule === 'knowledge'}
          onClick={() => onModuleChange?.('knowledge')}
          collapsed={collapsed}
        />
        <NavItem
          icon={<FolderKanban size={20} />}
          label={collapsed ? '' : '项目'}
          active={currentModule === 'project'}
          onClick={() => onModuleChange?.('project')}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Video size={20} />}
          label={collapsed ? '' : '会议'}
          active={currentModule === 'meeting'}
          onClick={() => onModuleChange?.('meeting')}
          collapsed={collapsed}
        />
      </nav>

      {/* 文档树 */}
      {!collapsed && (
        <div className="sidebar-tree">
          <div className="tree-header">
            <span>文档</span>
            <button onClick={() => onDocumentCreate?.()}>
              <Plus size={16} />
            </button>
          </div>
          <div className="tree-content">
            {filteredTree.map(node => renderTreeNode(node))}
          </div>
        </div>
      )}

      {/* 折叠按钮 */}
      <button
        className="collapse-btn"
        onClick={() => onCollapse?.(!collapsed)}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};
```

### 2. 拖拽排序

```typescript
// 文档拖拽处理
const handleDragStart = (e: React.DragEvent, node: DocumentTreeNode) => {
  e.dataTransfer.setData('text/plain', node.id);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e: React.DragEvent, node: DocumentTreeNode) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverNodeId(node.id);
};

const handleDrop = async (e: React.DragEvent, targetNode: DocumentTreeNode) => {
  e.preventDefault();
  const sourceId = e.dataTransfer.getData('text/plain');

  if (sourceId === targetNode.id) return;

  // 移动文档
  await moveDocument(sourceId, targetNode.id, targetNode.type === 'folder' ? targetNode.id : targetNode.parentId);

  setDragOverNodeId(null);
};
```

### 3. 折叠动画

```typescript
// 侧边栏折叠动画
<motion.aside
  initial={false}
  animate={{ width: collapsed ? 64 : width }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  className="sidebar"
>
  {/* 内容 */}
</motion.aside>
```

## 性能优化点

### 1. 虚拟化长列表

```typescript
// 对于大量文档,使用虚拟滚动
import { FixedSizeList } from 'react-window';

const VirtualizedTree = ({ nodes }) => (
  <FixedSizeList
    height={400}
    itemCount={nodes.length}
    itemSize={36}
  >
    {({ index, style }) => (
      <div style={style}>
        {renderTreeNode(nodes[index])}
      </div>
    )}
  </FixedSizeList>
);
```

### 2. 防抖搜索

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    onSearch?.(query);
  }, 300),
  [onSearch]
);
```

## 使用示例

### 基本用法

```tsx
import { Sidebar } from '@/components/Sidebar';

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <Sidebar
      collapsed={collapsed}
      onCollapse={setCollapsed}
      selectedDocumentId={selectedDoc}
      onDocumentSelect={setSelectedDoc}
      documentTree={documentTree}
    />
  );
}
```

### 禁用搜索

```tsx
<Sidebar
  collapsed={false}
  showSearch={false}
  currentModule="documents"
  onModuleChange={(module) => console.log(module)}
/>
```

---

# Header 组件

## 概述

Header(头部导航)组件提供页面顶部的导航、功能按钮、用户信息等功能。

## 核心特性

- **面包屑导航**: 显示当前页面路径
- **搜索框**: 全局搜索入口
- **功能按钮**: 通知、分享、设置等
- **用户信息**: 头像、名称、下拉菜单
- **固定定位**: 可选的固定顶部模式

## Props 接口

```typescript
interface HeaderProps {
  // 布局配置
  fixed?: boolean;
  height?: number;

  // 面包屑
  breadcrumbs?: BreadcrumbItem[];
  onBreadcrumbClick?: (path: string) => void;

  // 标题
  title?: string;
  titleIcon?: React.ReactNode;

  // 操作按钮
  actions?: HeaderAction[];

  // 用户信息
  user?: User;
  onUserMenuClick?: (key: string) => void;

  // 搜索
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  // 样式
  className?: string;
}

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface HeaderAction {
  key: string;
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  badge?: number;
}
```

## 内部状态

```typescript
interface HeaderState {
  searchQuery: string;
  searchFocused: boolean;
  userMenuOpen: boolean;
  actionMenuOpen: boolean;
}
```

## 核心逻辑实现

### 1. 头部渲染

```typescript
const Header: React.FC<HeaderProps> = ({
  fixed = true,
  height = 56,
  breadcrumbs = [],
  title,
  actions = [],
  user,
  showSearch = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className={`header ${fixed ? 'fixed' : ''}`}
      style={{ height }}
    >
      {/* 左侧: 面包屑/标题 */}
      <div className="header-left">
        {breadcrumbs.length > 0 ? (
          <Breadcrumb>
            {breadcrumbs.map((item, index) => (
              <Breadcrumb.Item key={index}>
                <a onClick={() => item.path}>{item.title}</a>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        ) : title ? (
          <h1 className="header-title">{title}</h1>
        ) : null}
      </div>

      {/* 中间: 搜索框 */}
      {showSearch && (
        <div className="header-center">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜索文档、知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="search-shortcut">Ctrl+K</kbd>
          </div>
        </div>
      )}

      {/* 右侧: 操作按钮 */}
      <div className="header-right">
        {actions.map(action => (
          <Tooltip key={action.key} title={action.label}>
            <button className="action-btn" onClick={action.onClick}>
              {action.icon}
              {action.badge && <span className="badge">{action.badge}</span>}
            </button>
          </Tooltip>
        ))}

        {/* 用户菜单 */}
        <Dropdown
          menu={{
            items: [
              { key: 'profile', label: '个人资料' },
              { key: 'settings', label: '设置' },
              { type: 'divider' },
              { key: 'logout', label: '退出登录', danger: true },
            ],
          }}
          trigger={['click']}
        >
          <button className="user-btn">
            <Avatar src={user?.avatar} size={32}>
              {user?.name?.charAt(0)}
            </Avatar>
            <span className="user-name">{user?.name}</span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
};
```

### 2. 快捷键搜索

```typescript
// Ctrl+K 打开搜索
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setSearchFocused(true);
      // 聚焦搜索输入框
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 使用示例

```tsx
import { Header } from '@/components/Header';

function DocumentPage() {
  const user = {
    id: '1',
    name: '张三',
    avatar: '/avatar.jpg',
  };

  const actions = [
    {
      key: 'share',
      icon: <Share2 size={18} />,
      label: '分享',
      onClick: () => handleShare(),
    },
    {
      key: 'history',
      icon: <History size={18} />,
      label: '历史',
      onClick: () => handleHistory(),
    },
    {
      key: 'notification',
      icon: <Bell size={18} />,
      label: '通知',
      badge: 3,
      onClick: () => handleNotification(),
    },
  ];

  return (
    <Header
      fixed={true}
      breadcrumbs={[
        { title: '文档', path: '/documents' },
        { title: '项目A', path: '/documents/project-a' },
      ]}
      title="设计文档"
      actions={actions}
      user={user}
      onSearch={(query) => console.log(query)}
    />
  );
}
```
