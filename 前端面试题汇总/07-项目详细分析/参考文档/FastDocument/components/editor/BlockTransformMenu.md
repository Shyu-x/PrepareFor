# BlockTransformMenu 组件

## 概述

BlockTransformMenu(块转换菜单)是编辑器中的快捷命令菜单,当用户在空行输入 `/` 字符时触发。该菜单允许用户快速插入各种类型的块,或对现有块进行转换操作。

## 核心特性

- **触发机制**: 在空行输入 `/` 自动触发
- **键盘导航**: 支持上下箭头选择、Enter 确认、Esc 关闭
- **搜索过滤**: 支持输入关键词快速过滤选项
- **块转换**: 支持将现有块转换为其他类型
- **分类显示**: 块类型按功能分类展示

## Props 接口

```typescript
interface BlockTransformMenuProps {
  // 位置配置
  position: {
    top: number;
    left: number;
  };

  // 菜单状态
  isVisible: boolean;

  // 上下文
  blockId?: string;           // 当前操作的块ID(转换模式)
  blockType?: BlockType;     // 当前块的类型(转换模式)

  // 回调
  onSelect: (type: BlockType | SubBlockType) => void;
  onClose: () => void;

  // 可选的块类型列表(用于自定义)
  availableTypes?: MenuItem[];

  // 搜索配置
  searchPlaceholder?: string;

  // 样式
  className?: string;
}
```

## 菜单项类型定义

```typescript
interface MenuItem {
  id: string;
  type: BlockType | 'divider' | 'header' | 'search';
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];       // 用于搜索匹配的关键词
  category: 'basic' | 'media' | 'advanced' | 'layout';
  shortcut?: string;         // 快捷键提示
}
```

## 预定义菜单项

```typescript
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // 基础块
  {
    id: 'text',
    type: 'text',
    label: '文本',
    description: '普通文本段落',
    icon: <TypeIcon />,
    keywords: ['文本', 'paragraph', 'text'],
    category: 'basic',
  },
  {
    id: 'h1',
    type: 'h1',
    label: '标题 1',
    description: '大标题',
    icon: <Heading1Icon />,
    keywords: ['标题', 'heading', 'h1'],
    category: 'basic',
    shortcut: '#',
  },
  {
    id: 'h2',
    type: 'h2',
    label: '标题 2',
    description: '中标题',
    icon: <Heading2Icon />,
    keywords: ['标题', 'heading', 'h2'],
    category: 'basic',
    shortcut: '##',
  },
  {
    id: 'h3',
    type: 'h3',
    label: '标题 3',
    description: '小标题',
    icon: <Heading3Icon />,
    keywords: ['标题', 'heading', 'h3'],
    category: 'basic',
    shortcut: '###',
  },

  // 列表
  {
    id: 'todo',
    type: 'todo',
    label: '待办事项',
    description: '可勾选的任务列表',
    icon: <CheckSquareIcon />,
    keywords: ['待办', 'todo', '任务', 'checkbox'],
    category: 'basic',
    shortcut: '[]',
  },
  {
    id: 'bullet-list',
    type: 'bullet-list',
    label: '无序列表',
    description: '符号列表',
    icon: <ListIcon />,
    keywords: ['列表', 'list', 'bullet'],
    category: 'basic',
    shortcut: '-',
  },
  {
    id: 'numbered-list',
    type: 'numbered-list',
    label: '有序列表',
    description: '编号列表',
    icon: <ListOrderedIcon />,
    keywords: ['列表', 'list', 'numbered', '1.'],
    category: 'basic',
    shortcut: '1.',
  },

  // 媒体
  {
    id: 'code',
    type: 'code',
    label: '代码块',
    description: '代码片段',
    icon: <CodeIcon />,
    keywords: ['代码', 'code', '编程'],
    category: 'media',
    shortcut: '```',
  },
  {
    id: 'image',
    type: 'image',
    label: '图片',
    description: '插入图片',
    icon: <ImageIcon />,
    keywords: ['图片', 'image', '照片'],
    category: 'media',
  },
  {
    id: 'table',
    type: 'table',
    label: '表格',
    description: '插入表格',
    icon: <TableIcon />,
    keywords: ['表格', 'table'],
    category: 'media',
  },

  // 高级
  {
    id: 'callout',
    type: 'callout',
    label: '提示块',
    description: '突出显示的信息',
    icon: <AlertCircleIcon />,
    keywords: ['提示', 'callout', 'info', 'warning'],
    category: 'advanced',
  },
  {
    id: 'divider',
    type: 'divider',
    label: '分割线',
    description: '水平分割线',
    icon: <MinusIcon />,
    keywords: ['分割线', 'divider', 'hr'],
    category: 'advanced',
    shortcut: '---',
  },
  {
    id: 'quote',
    type: 'quote',
    label: '引用',
    description: '引用内容',
    icon: <QuoteIcon />,
    keywords: ['引用', 'quote', 'blockquote'],
    category: 'advanced',
    shortcut: '>',
  },
];
```

## 核心逻辑实现

### 1. 菜单定位与显示

```typescript
const BlockTransformMenu: React.FC<BlockTransformMenuProps> = ({
  position,
  isVisible,
  onSelect,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);

  // 菜单位置计算 - 确保不超出视口
  const getMenuPosition = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = 400; // 估计菜单高度
    const menuWidth = 320;

    let { top, left } = position;

    // 底部超出则向上显示
    if (top + menuHeight > viewportHeight) {
      top = top - menuHeight;
    }

    // 右侧超出则向左显示
    if (left + menuWidth > viewportWidth) {
      left = left - menuWidth;
    }

    return { top: top + 8, left }; // +8px 偏移
  }, [position]);

  // 过滤菜单项
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(DEFAULT_MENU_ITEMS);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = DEFAULT_MENU_ITEMS.filter(item => {
      // 匹配标签
      if (item.label.toLowerCase().includes(query)) return true;
      // 匹配描述
      if (item.description?.toLowerCase().includes(query)) return true;
      // 匹配关键词
      if (item.keywords?.some(kw => kw.toLowerCase().includes(query))) return true;
      // 匹配快捷键
      if (item.shortcut?.includes(query)) return true;

      return false;
    });

    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // 渲染菜单
  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden"
      style={getMenuPosition()}
    >
      {/* 搜索输入 */}
      <div className="p-3 border-b border-gray-200 dark:border-dark-700">
        <input
          type="text"
          placeholder="搜索块类型..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-900 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
          autoFocus
        />
      </div>

      {/* 菜单项列表 */}
      <div className="max-h-80 overflow-y-auto p-2">
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              index === selectedIndex
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                : 'hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
            onClick={() => onSelect(item.type)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="text-gray-500">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              )}
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-dark-900 px-1.5 py-0.5 rounded">
                {item.shortcut}
              </span>
            )}
          </button>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            没有找到匹配的块类型
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-dark-700 text-xs text-gray-500 flex items-center gap-4">
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-900 rounded">↑↓</kbd> 导航</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-900 rounded">Enter</kbd> 确认</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-dark-900 rounded">Esc</kbd> 关闭</span>
      </div>
    </div>
  );
};
```

### 2. 键盘导航

```typescript
// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
      break;
    }

    case 'ArrowUp': {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
      break;
    }

    case 'Enter': {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex].type);
      }
      break;
    }

    case 'Escape': {
      e.preventDefault();
      onClose();
      break;
    }

    case 'Tab': {
      e.preventDefault();
      // 在分类之间切换
      const currentCategory = filteredItems[selectedIndex]?.category;
      const nextInCategory = filteredItems.find(
        (item, idx) => idx > selectedIndex && item.category !== currentCategory
      );
      if (nextInCategory) {
        setSelectedIndex(filteredItems.indexOf(nextInCategory));
      }
      break;
    }
  }
};

// 绑定键盘事件
useEffect(() => {
  if (isVisible) {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
}, [isVisible, selectedIndex, filteredItems]);
```

### 3. 滚动到选中项

```typescript
// 保持选中项在可视区域内
useEffect(() => {
  const menuList = menuRef.current?.querySelector('.menu-list');
  if (!menuList) return;

  const selectedItem = menuList.children[selectedIndex] as HTMLElement;
  if (!selectedItem) return;

  const itemTop = selectedItem.offsetTop;
  const itemHeight = selectedItem.offsetHeight;
  const listScrollTop = menuList.scrollTop;
  const listHeight = menuList.clientHeight;

  // 如果选中项在可视区域上方
  if (itemTop < listScrollTop) {
    menuList.scrollTop = itemTop;
  }
  // 如果选中项在可视区域下方
  else if (itemTop + itemHeight > listScrollTop + listHeight) {
    menuList.scrollTop = itemTop + itemHeight - listHeight;
  }
}, [selectedIndex]);
```

## 性能优化点

### 1. 防抖搜索

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchQuery(query);
  }, 150),
  []
);
```

### 2. 使用 React.memo

```typescript
const MenuItemComponent = React.memo<{
  item: MenuItem;
  isSelected: boolean;
  onSelect: () => void;
}>(({ item, isSelected, onSelect }) => {
  return (
    <button
      className={isSelected ? 'selected' : ''}
      onClick={onSelect}
    >
      {/* ... */}
    </button>
  );
});
```

### 3. CSS transform 动画

```typescript
// 使用 transform 而不是 top/left 进行定位
const menuStyle: React.CSSProperties = {
  transform: `translate(${position.left}px, ${position.top}px)`,
  willChange: 'transform',
};
```

## 使用示例

### 在 Editor 中集成

```tsx
import { BlockTransformMenu } from '@/components/BlockTransformMenu';

const Editor: React.FC<EditorProps> = ({
  blocks,
  onBlocksChange,
}) => {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    position: { top: number; left: number };
  }>({
    visible: false,
    position: { top: 0, left: 0 },
  });

  const handleSlashInput = (blockId: string, position: { top: number; left: number }) => {
    setMenuState({ visible: true, position });
  };

  const handleMenuSelect = (type: BlockType) => {
    insertBlock(type);
    setMenuState(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      {/* 编辑器内容 */}
      <div className="editor-content">
        {blocks.map(block => (
          <BlockRenderer
            key={block.id}
            block={block}
            onSlashInput={handleSlashInput}
          />
        ))}
      </div>

      {/* 块转换菜单 */}
      <BlockTransformMenu
        position={menuState.position}
        isVisible={menuState.visible}
        onSelect={handleMenuSelect}
        onClose={() => setMenuState(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
};
```

### 自定义菜单项

```tsx
const customMenuItems: MenuItem[] = [
  {
    id: 'custom-card',
    type: 'custom-card',
    label: '自定义卡片',
    description: '插入自定义卡片组件',
    icon: <CardIcon />,
    keywords: ['卡片', 'card', '自定义'],
    category: 'advanced',
  },
];

<BlockTransformMenu
  position={position}
  isVisible={visible}
  availableTypes={customMenuItems}
  onSelect={(type) => console.log('Selected:', type)}
  onClose={closeMenu}
/>
```

## 依赖

- **BlockType**: 块类型枚举
- **MenuItem**: 菜单项类型定义
- **lucide-react**: 图标库
