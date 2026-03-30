# Editor 组件

## 概述

Editor 组件是 FastDocument 的核心原子化文档编辑器组件,实现了基于块的文档编辑系统。该组件支持多种块类型,包括文本、标题、待办事项、代码块、表格、图片、引用块等,每个块都作为独立的可编辑单元。

## 核心特性

- **原子化块系统**: 文档内容由独立块组成,支持块级别的增删改查
- **实时协作**: 基于 Socket.io 实现多用户实时同步编辑
- **快捷菜单**: 支持通过 `/` 快捷菜单快速插入各类块
- **拖拽排序**: 支持通过拖拽调整块的顺序
- **批注系统**: 支持块级和行内批注功能

## Props 接口

```typescript
interface EditorProps {
  // 文档相关
  documentId?: string;
  initialContent?: Block[];
  readOnly?: boolean;

  // 回调函数
  onChange?: (blocks: Block[]) => void;
  onSave?: (blocks: Block[]) => Promise<void>;
  onDocumentLoad?: (document: Document) => void;

  // 编辑器配置
  placeholder?: string;
  autoFocus?: boolean;
  enableCollaboration?: boolean;
  enableComments?: boolean;

  // 样式配置
  className?: string;
  editorClassName?: string;
}
```

## 内部状态

```typescript
interface EditorState {
  blocks: Block[];                    // 文档块列表
  activeBlockId: string | null;      // 当前激活的块ID
  activeFormats: string[];            // 当前激活的格式(粗体、斜体等)
  isLoading: boolean;                 // 加载状态
  isSaving: boolean;                  // 保存状态
  showSlashMenu: boolean;             // 是否显示斜杠菜单
  slashMenuPosition: Position;        // 斜杠菜单位置
  selectedBlockIds: string[];         // 选中的块ID列表
  isDragging: boolean;                // 是否正在拖拽
  collaborators: User[];              // 当前协作者
}
```

## 核心逻辑实现

### 1. 块渲染与编辑

编辑器使用 `BlockRenderer` 组件渲染不同类型的块。每个块都有一个唯一的 `id` 和 `type`,根据 `type` 选择对应的渲染组件:

```typescript
// 块类型枚举
type BlockType =
  | 'text'        // 普通文本
  | 'h1'          // 一级标题
  | 'h2'          // 二级标题
  | 'h3'          // 三级标题
  | 'todo'        // 待办事项
  | 'callout'     // 引用/提示块
  | 'divider'     // 分割线
  | 'code'        // 代码块
  | 'image'       // 图片块
  | 'table';      // 表格块
```

### 2. 快捷菜单系统

当用户在空行输入 `/` 时,会触发快捷菜单:

```typescript
const handleKeyDown = (e: KeyboardEvent, blockId: string) => {
  if (e.key === '/' && isBlockEmpty(currentBlock)) {
    setShowSlashMenu(true);
    setSlashMenuPosition(getBlockPosition(blockId));
  }

  // 方向键导航菜单
  if (showSlashMenu) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateMenu(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateMenu(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectMenuItem();
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
  }
};
```

### 3. 实时协作

编辑器通过 Socket.io 与后端同步:

```typescript
// 初始化 Socket 监听
useEffect(() => {
  if (!enableCollaboration || !documentId) return;

  const socket = socketClient.getInstance();

  // 监听块更新
  socket.on('block:update', (data: BlockUpdate) => {
    updateBlock(data.blockId, data.changes);
  });

  // 监听块插入
  socket.on('block:add', (data: BlockAdd) => {
    insertBlock(data.block, data.afterBlockId);
  });

  // 监听块删除
  socket.on('block:delete', (data: { blockId: string }) => {
    removeBlock(data.blockId);
  });

  // 监听用户光标位置
  socket.on('cursor:update', (data: CursorUpdate) => {
    updateCollaboratorCursor(data.userId, data.position);
  });

  return () => {
    socket.off('block:update');
    socket.off('block:add');
    socket.off('block:delete');
    socket.off('cursor:update');
  };
}, [documentId, enableCollaboration]);
```

### 4. 块操作

```typescript
// 添加新块
const addBlock = (type: BlockType, afterBlockId?: string) => {
  const newBlock: Block = {
    id: generateId(),
    type,
    content: '',
    order: getNextOrder(afterBlockId),
  };

  // 本地更新
  setBlocks(prev => {
    const index = blocks.findIndex(b => b.id === afterBlockId);
    const newBlocks = [...prev];
    newBlocks.splice(index + 1, 0, newBlock);
    return newBlocks;
  });

  // 广播给其他用户
  if (enableCollaboration) {
    socketClient.getInstance().emit('block:add', {
      documentId,
      block: newBlock,
      afterBlockId,
    });
  }

  // 触发 onChange
  onChange?.(blocks);
};

// 更新块内容
const updateBlock = (blockId: string, changes: Partial<Block>) => {
  setBlocks(prev =>
    prev.map(b => b.id === blockId ? { ...b, ...changes } : b)
  );

  // 防抖保存
  debouncedSave();

  // 广播更新
  if (enableCollaboration) {
    socketClient.getInstance().emit('block:update', {
      documentId,
      blockId,
      changes,
    });
  }
};

// 删除块
const deleteBlock = (blockId: string) => {
  setBlocks(prev => prev.filter(b => b.id !== blockId));

  if (enableCollaboration) {
    socketClient.getInstance().emit('block:delete', {
      documentId,
      blockId,
    });
  }
};
```

## 性能优化点

### 1. 虚拟化渲染

对于大型文档,使用虚拟滚动只渲染可见区域内的块:

```typescript
const VirtualizedBlockList: React.FC<{
  blocks: Block[];
  containerHeight: number;
}> = ({ blocks, containerHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见块范围
  const { startIndex, endIndex } = useMemo(() => {
    const BLOCK_HEIGHT = 60; // 估计平均块高度
    const start = Math.floor(scrollTop / BLOCK_HEIGHT);
    const count = Math.ceil(containerHeight / BLOCK_HEIGHT);
    return {
      startIndex: Math.max(0, start - 5), // 缓冲区
      endIndex: Math.min(blocks.length, start + count + 5),
    };
  }, [scrollTop, containerHeight]);

  const visibleBlocks = blocks.slice(startIndex, endIndex);

  return (
    <div onScroll={handleScroll}>
      {visibleBlocks.map((block, idx) => (
        <BlockWrapper
          key={block.id}
          index={startIndex + idx}
        >
          <BlockRenderer block={block} />
        </BlockWrapper>
      ))}
    </div>
  );
};
```

### 2. 防抖保存

```typescript
const debouncedSave = useMemo(
  () => debounce((blocks: Block[]) => {
    onSave?.(blocks);
  }, 1000),
  [onSave]
);
```

### 3. 块内容 Diff

使用 diff 算法只同步变更的部分:

```typescript
const syncBlockChanges = (
  oldBlock: Block,
  newBlock: Block
) => {
  const diff = diffMatchPatch.diff_main(
    oldBlock.content,
    newBlock.content
  );
  diffMatchPatch.diff_cleanupSemantic(diff);

  // 只发送 diff 而不是完整内容
  socketClient.getInstance().emit('block:diff', {
    documentId,
    blockId: oldBlock.id,
    diff,
  });
};
```

### 4. 光标位置同步优化

```typescript
// 使用节流减少光标位置同步频率
const throttledCursorUpdate = useMemo(
  () => throttle((position: Position) => {
    socketClient.getInstance().emit('cursor:update', {
      documentId,
      userId,
      position,
    });
  }, 50), // 最多每50ms发送一次
  [documentId, userId]
);
```

## 使用示例

### 基本用法

```tsx
import { Editor } from '@/components/Editor';

function DocumentPage() {
  const handleSave = async (blocks: Block[]) => {
    await fetch(`/api/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({ blocks }),
    });
  };

  return (
    <Editor
      documentId="doc-123"
      onSave={handleSave}
      placeholder="开始输入 '/' 查看可用命令..."
      enableCollaboration={true}
    />
  );
}
```

### 自定义块类型

```tsx
const customBlocks: BlockType[] = [
  { type: 'text', label: '文本', icon: TypeIcon },
  { type: 'code', label: '代码块', icon: CodeIcon },
  { type: 'callout', label: '提示', icon: AlertIcon },
];

<Editor
  documentId="doc-123"
  blockTypes={customBlocks}
  onChange={(blocks) => console.log(blocks)}
/>
```

### 只读模式

```tsx
<Editor
  documentId="doc-123"
  readOnly={true}
  onDocumentLoad={(doc) => console.log(doc)}
/>
```

## 依赖组件

- **BlockRenderer**: 块渲染器,根据块类型渲染不同组件
- **BlockTransformMenu**: 块转换菜单
- **CodeBlock**: 代码块组件
- **TableBlock**: 表格块组件
- **ImageBlock**: 图片块组件
- **TodoBlock**: 待办事项块组件
- **CalloutBlock**: 引用块组件
- **socketClient**: Socket.io 客户端单例

## 相关类型定义

```typescript
// 块接口
interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: BlockProperties;
  order: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  annotations?: Annotation[];
}

// 块属性
interface BlockProperties {
  language?: string;        // 代码块语言
  checked?: boolean;        // 待办事项完成状态
  calloutType?: string;    // 引用块类型
  imageUrl?: string;       // 图片URL
  tableData?: TableData;   // 表格数据
  [key: string]: any;
}

// 文档接口
interface Document {
  id: string;
  title: string;
  blocks: Block[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  collaborators: string[];
  version: number;
}
```
