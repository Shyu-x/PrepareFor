# VirtualEditor 组件

## 概述

VirtualEditor 是基于虚拟滚动技术的高性能文档编辑器组件,专为处理大型文档(超过1000个块)而设计。通过只渲染可视区域内的块,显著减少 DOM 节点数量,确保即使在文档规模巨大的情况下也能保持流畅的编辑体验。

## 核心特性

- **虚拟滚动**: 仅渲染可见区域内的块,支持百万级块文档
- **动态块高度**: 根据内容自动计算块高度
- **平滑滚动**: 支持键盘导航和鼠标滚轮
- **块回收机制**: 滚动时重用 DOM 节点减少内存开销

## Props 接口

```typescript
interface VirtualEditorProps {
  // 文档配置
  documentId?: string;
  initialBlocks?: Block[];

  // 性能配置
  overscan?: number;              // 渲染缓冲区大小,默认5
  estimatedBlockHeight?: number; // 估计的块高度,默认60
  containerHeight?: number;      // 容器高度,默认600

  // 编辑配置
  readOnly?: boolean;
  onBlocksChange?: (blocks: Block[]) => void;
  onSave?: (blocks: Block[]) => Promise<void>;

  // 回调
  onBlockSelect?: (blockId: string) => void;
  onBlockFocus?: (blockId: string) => void;

  // 样式
  className?: string;
}
```

## 内部状态

```typescript
interface VirtualEditorState {
  blocks: Block[];
  scrollTop: number;                    // 当前滚动位置
  containerHeight: number;              // 容器高度
  blockHeights: Map<string, number>;  // 块高度缓存
  visibleRange: { start: number; end: number }; // 可见块范围
  focusedBlockId: string | null;       // 聚焦的块ID
  editingBlockId: string | null;       // 正在编辑的块ID
}
```

## 核心逻辑实现

### 1. 虚拟滚动核心算法

```typescript
// 计算可见块范围
const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  blockHeights: Map<string, number>,
  blocks: Block[],
  overscan: number
): { start: number; end: number } => {
  let accumulatedHeight = 0;
  let startIndex = 0;
  let endIndex = blocks.length;

  // 找到起始索引
  for (let i = 0; i < blocks.length; i++) {
    const height = blockHeights.get(blocks[i].id) || ESTIMATED_BLOCK_HEIGHT;
    if (accumulatedHeight + height >= scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
    accumulatedHeight += height;
  }

  // 找到结束索引
  accumulatedHeight = 0;
  const viewportBottom = scrollTop + containerHeight;
  for (let i = 0; i < blocks.length; i++) {
    const height = blockHeights.get(blocks[i].id) || ESTIMATED_BLOCK_HEIGHT;
    accumulatedHeight += height;
    if (accumulatedHeight >= viewportBottom) {
      endIndex = Math.min(blocks.length, i + overscan + 1);
      break;
    }
  }

  return { start: startIndex, end: endIndex };
};

// 计算总高度
const calculateTotalHeight = (
  blockHeights: Map<string, number>,
  blocks: Block[]
): number => {
  let total = 0;
  for (const block of blocks) {
    total += blockHeights.get(block.id) || ESTIMATED_BLOCK_HEIGHT;
  }
  return total;
};
```

### 2. 块高度动态测量

```typescript
// 使用 ResizeObserver 监听块内容变化
const useBlockHeight = (blockId: string, content: string) => {
  const [height, setHeight] = useState(ESTIMATED_BLOCK_HEIGHT);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        setHeight(newHeight);

        // 更新全局高度缓存
        blockHeightsRef.current.set(blockId, newHeight);
        recalculateVisibleRange();
      }
    });

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [blockId, content]);

  return { height, elementRef };
};
```

### 3. 键盘导航

```typescript
// 键盘导航处理
const handleKeyDown = (e: KeyboardEvent) => {
  const { focusedBlockId, blocks } = state;

  switch (e.key) {
    case 'ArrowUp': {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
      if (currentIndex > 0) {
        focusBlock(blocks[currentIndex - 1].id);
        scrollToBlock(currentIndex - 1);
      }
      break;
    }

    case 'ArrowDown': {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
      if (currentIndex < blocks.length - 1) {
        focusBlock(blocks[currentIndex + 1].id);
        scrollToBlock(currentIndex + 1);
      }
      break;
    }

    case 'PageUp': {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
      const targetIndex = Math.max(0, currentIndex - VISIBLE_BLOCK_COUNT);
      focusBlock(blocks[targetIndex].id);
      scrollToBlock(targetIndex);
      break;
    }

    case 'PageDown': {
      e.preventDefault();
      const currentIndex = blocks.findIndex(b => b.id === focusedBlockId);
      const targetIndex = Math.min(blocks.length - 1, currentIndex + VISIBLE_BLOCK_COUNT);
      focusBlock(blocks[targetIndex].id);
      scrollToBlock(targetIndex);
      break;
    }

    case 'Home': {
      if (e.ctrlKey) {
        e.preventDefault();
        focusBlock(blocks[0].id);
        scrollToBlock(0);
      }
      break;
    }

    case 'End': {
      if (e.ctrlKey) {
        e.preventDefault();
        const lastIndex = blocks.length - 1;
        focusBlock(blocks[lastIndex].id);
        scrollToBlock(lastIndex);
      }
      break;
    }
  }
};

// 滚动到指定块
const scrollToBlock = (index: number) => {
  let accumulatedHeight = 0;
  for (let i = 0; i < index; i++) {
    accumulatedHeight += blockHeightsRef.current.get(blocks[i].id) || ESTIMATED_BLOCK_HEIGHT;
  }

  const containerHeight = state.containerHeight;
  const blockHeight = blockHeightsRef.current.get(blocks[index].id) || ESTIMATED_BLOCK_HEIGHT;

  // 确保目标块在可视区域内
  if (accumulatedHeight < state.scrollTop) {
    setScrollTop(accumulatedHeight);
  } else if (accumulatedHeight + blockHeight > state.scrollTop + containerHeight) {
    setScrollTop(accumulatedHeight + blockHeight - containerHeight);
  }
};
```

### 4. 滚动位置管理

```typescript
// 处理滚动事件
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const newScrollTop = e.currentTarget.scrollTop;

  // 使用 RAF 节流滚动处理
  requestAnimationFrame(() => {
    setScrollTop(newScrollTop);
    updateVisibleRange(newScrollTop);
  });
};

// 平滑滚动到指定位置
const smoothScrollTo = (targetScrollTop: number, duration: number = 300) => {
  const startScrollTop = scrollTopRef.current;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 easeOutQuad 缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeProgress;

    setScrollTop(currentScrollTop);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};
```

## 性能优化点

### 1. 块高度缓存

```typescript
// 使用 Map 缓存块高度,O(1) 查找
const blockHeightsRef = useRef<Map<string, number>>(new Map());

// 批量更新高度缓存
const batchUpdateHeights = (updates: Array<{ blockId: string; height: number }>) => {
  for (const { blockId, height } of updates) {
    blockHeightsRef.current.set(blockId, height);
  }
  // 批量更新触发一次重渲染
  setState(prev => ({ ...prev }));
};
```

### 2. React.memo 优化

```typescript
// 使用 React.memo 避免不必要的重渲染
const VirtualBlock = React.memo<{
  block: Block;
  style: React.CSSProperties;
  isFocused: boolean;
}>(({ block, style, isFocused }) => {
  return (
    <div style={style} data-block-id={block.id}>
      <BlockRenderer
        block={block}
        isFocused={isFocused}
        onContentChange={(content) => updateBlock(block.id, { content })}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.style?.top === nextProps.style?.top
  );
});
```

### 3. 虚拟列表与实际 DOM 分离

```typescript
const VirtualizedList: React.FC<{
  blocks: Block[];
  scrollTop: number;
  containerHeight: number;
}> = ({ blocks, scrollTop, containerHeight }) => {
  // 计算偏移量 - 用于定位可见块
  const offsetY = useMemo(() => {
    let offset = 0;
    const { startIndex } = calculateVisibleRange(
      scrollTop,
      containerHeight,
      blockHeightsRef.current,
      blocks,
      OVERSCAN
    );

    for (let i = 0; i < startIndex; i++) {
      offset += blockHeightsRef.current.get(blocks[i].id) || ESTIMATED_BLOCK_HEIGHT;
    }

    return offset;
  }, [scrollTop, containerHeight, blocks]);

  // 渲染可见块
  const visibleBlocks = useMemo(() => {
    const { startIndex, endIndex } = calculateVisibleRange(
      scrollTop,
      containerHeight,
      blockHeightsRef.current,
      blocks,
      OVERSCAN
    );

    let accumulatedHeight = 0;
    const result: Array<{ block: Block; top: number }> = [];

    for (let i = startIndex; i < endIndex; i++) {
      const height = blockHeightsRef.current.get(blocks[i].id) || ESTIMATED_BLOCK_HEIGHT;
      result.push({
        block: blocks[i],
        top: accumulatedHeight,
      });
      accumulatedHeight += height;
    }

    return result;
  }, [scrollTop, containerHeight, blocks]);

  return (
    <div style={{ height: calculateTotalHeight(blockHeightsRef.current, blocks) }}>
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {visibleBlocks.map(({ block, top }) => (
          <VirtualBlock
            key={block.id}
            block={block}
            style={{ position: 'absolute', top, width: '100%' }}
          />
        ))}
      </div>
    </div>
  );
};
```

## 使用示例

### 基本用法

```tsx
import { VirtualEditor } from '@/components/VirtualEditor';

function LargeDocumentPage() {
  const handleSave = async (blocks: Block[]) => {
    await fetch(`/api/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({ blocks }),
    });
  };

  return (
    <VirtualEditor
      documentId="large-doc-123"
      containerHeight={800}
      overscan={10}
      onSave={handleSave}
    />
  );
}
```

### 自定义容器高度

```tsx
<VirtualEditor
  initialBlocks={largeDocument}
  containerHeight="100vh"
  estimatedBlockHeight={80}
  onBlocksChange={(blocks) => {
    console.log('Blocks updated:', blocks.length);
  }}
/>
```

### 与普通 Editor 对比

| 特性 | Editor | VirtualEditor |
|------|--------|---------------|
| 适用场景 | < 500 块 | > 500 块 |
| DOM 节点 | O(n) | O(visible) |
| 内存占用 | 高 | 低 |
| 滚动性能 | 差 | 优 |
| 块高度测量 | 静态 | 动态 |

## 依赖

- **Block**: 块类型定义
- **BlockRenderer**: 块渲染器
- **socketClient**: Socket.io 客户端(用于协作)
