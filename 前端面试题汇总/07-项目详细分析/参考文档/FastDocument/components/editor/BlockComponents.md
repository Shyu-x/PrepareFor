# TableBlock 组件

## 概述

TableBlock(表格块)组件用于在文档中展示和编辑表格数据。支持单元格编辑、行/列添加删除、单元格合并、排序、筛选等功能。

## Props 接口

```typescript
interface TableBlockProps {
  // 表格数据
  data: TableData;
  caption?: string;

  // 编辑配置
  editable?: boolean;
  onChange?: (data: TableData) => void;

  // 显示配置
  showHeaders?: boolean;
  showRowNumbers?: boolean;
  fixedHeader?: boolean;
  minColumnWidth?: number;
  maxColumnWidth?: number;

  // 样式
  className?: string;
}

interface TableData {
  columns: Column[];
  rows: Row[];
}

interface Column {
  id: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

interface Row {
  id: string;
  cells: Cell[];
}

interface Cell {
  id: string;
  content: string;
  colspan?: number;
  rowspan?: number;
}
```

## 内部状态

```typescript
interface TableBlockState {
  data: TableData;
  selectedCell: { row: number; col: number } | null;
  editingCell: { row: number; col: number } | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filterColumn: string | null;
  filterValue: string;
  columnWidths: Map<string, number>;
  resizingColumn: string | null;
}
```

## 核心逻辑实现

### 1. 表格渲染

```typescript
const TableBlock: React.FC<TableBlockProps> = ({
  data,
  editable = true,
  onChange,
  fixedHeader = true,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const { columns, rows } = data;

  // 处理单元格点击
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
  };

  // 处理单元格编辑
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    if (editable) {
      setEditingCell({ row: rowIndex, col: colIndex });
    }
  };

  // 处理单元格内容变化
  const handleCellChange = (rowIndex: number, colIndex: number, content: string) => {
    const newRows = [...rows];
    newRows[rowIndex].cells[colIndex].content = content;
    onChange?.({ ...data, rows: newRows });
  };

  return (
    <div className="table-block" ref={tableRef}>
      <table>
        {fixedHeader && (
          <thead>
            <tr>
              {columns.map((col, colIndex) => (
                <th
                  key={col.id}
                  style={{ width: col.width }}
                  className={selectedCell?.col === colIndex ? 'selected' : ''}
                >
                  <CellEditor
                    content={rows[0].cells[colIndex]?.content || ''}
                    isEditing={editingCell?.row === 0 && editingCell?.col === colIndex}
                    onChange={(content) => handleCellChange(0, colIndex, content)}
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.slice(fixedHeader ? 1 : 0).map((row, rowIndex) => (
            <tr key={row.id} className={selectedCell?.row === rowIndex + 1 ? 'selected' : ''}>
              {row.cells.map((cell, colIndex) => (
                <td
                  key={cell.id}
                  colSpan={cell.colspan}
                  rowSpan={cell.rowspan}
                  onClick={() => handleCellClick(rowIndex + 1, colIndex)}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex + 1, colIndex)}
                  className={`
                    ${selectedCell?.row === rowIndex + 1 && selectedCell?.col === colIndex ? 'selected' : ''}
                    ${columns[colIndex]?.align === 'center' ? 'text-center' : ''}
                    ${columns[colIndex]?.align === 'right' ? 'text-right' : ''}
                  `}
                >
                  {editingCell?.row === rowIndex + 1 && editingCell?.col === colIndex ? (
                    <input
                      value={cell.content}
                      onChange={(e) => handleCellChange(rowIndex + 1, colIndex, e.target.value)}
                      autoFocus
                      onBlur={() => setEditingCell(null)}
                    />
                  ) : (
                    cell.content
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 2. 行/列操作

```typescript
// 添加行
const addRow = (afterRowIndex?: number) => {
  const newRow: Row = {
    id: generateId(),
    cells: columns.map(col => ({
      id: generateId(),
      content: '',
    })),
  };

  const newRows = afterRowIndex
    ? [...rows.slice(0, afterRowIndex + 1), newRow, ...rows.slice(afterRowIndex + 1)]
    : [...rows, newRow];

  onChange?.({ ...data, rows: newRows });
};

// 添加列
const addColumn = (afterColIndex?: number) => {
  const newColumn: Column = {
    id: generateId(),
    width: 150,
  };

  const newColumns = afterColIndex
    ? [...columns.slice(0, afterColIndex + 1), newColumn, ...columns.slice(afterColIndex + 1)]
    : [...columns, newColumn];

  const newRows = rows.map(row => ({
    ...row,
    cells: [...row.cells.slice(0, afterColIndex + 1), { id: generateId(), content: '' }, ...row.cells.slice(afterColIndex + 1)],
  }));

  onChange?.({ columns: newColumns, rows: newRows });
};

// 删除行
const deleteRow = (rowIndex: number) => {
  if (rows.length <= 1) return; // 至少保留一行
  const newRows = rows.filter((_, index) => index !== rowIndex);
  onChange?.({ ...data, rows: newRows });
};

// 删除列
const deleteColumn = (colIndex: number) => {
  if (columns.length <= 1) return; // 至少保留一列
  const newColumns = columns.filter((_, index) => index !== colIndex);
  const newRows = rows.map(row => ({
    ...row,
    cells: row.cells.filter((_, index) => index !== colIndex),
  }));
  onChange?.({ columns: newColumns, rows: newRows });
};
```

### 3. 列宽调整

```typescript
const handleColumnResize = (colId: string, newWidth: number) => {
  const newColumns = columns.map(col =>
    col.id === colId ? { ...col, width: Math.max(50, Math.min(400, newWidth)) } : col
  );
  onChange?.({ ...data, columns: newColumns });
};

// 使用 ResizeObserver 监听列宽变化
useEffect(() => {
  const table = tableRef.current;
  if (!table) return;

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const colId = entry.target.getAttribute('data-col-id');
      if (colId) {
        handleColumnResize(colId, entry.contentRect.width);
      }
    }
  });

  table.querySelectorAll('th').forEach(th => observer.observe(th));

  return () => observer.disconnect();
}, [columns]);
```

## 使用示例

```tsx
const initialData: TableData = {
  columns: [
    { id: 'col1', width: 150 },
    { id: 'col2', width: 200 },
    { id: 'col3', width: 100 },
  ],
  rows: [
    { id: 'row1', cells: [{ id: 'c1', content: '姓名' }, { id: 'c2', content: '年龄' }, { id: 'c3', content: '城市' }] },
    { id: 'row2', cells: [{ id: 'c4', content: '张三' }, { id: 'c5', content: '25' }, { id: 'c6', content: '北京' }] },
    { id: 'row3', cells: [{ id: 'c7', content: '李四' }, { id: 'c8', content: '30' }, { id: 'c9', content: '上海' }] },
  ],
};

<TableBlock
  data={initialData}
  editable={true}
  fixedHeader={true}
  onChange={(newData) => console.log(newData)}
/>
```

---

# ImageBlock 组件

## 概述

ImageBlock(图片块)组件用于在文档中展示图片,支持图片上传、裁剪、滤镜、图注等功能。

## Props 接口

```typescript
interface ImageBlockProps {
  src: string;
  alt?: string;
  caption?: string;

  // 配置
  editable?: boolean;
  onChange?: (props: ImageBlockProps) => void;

  // 显示
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  rounded?: boolean;

  // 样式
  className?: string;
}
```

## 核心功能

- **图片上传**: 支持拖拽上传和点击选择
- **图片裁剪**: 内置裁剪工具
- **滤镜效果**: 提供多种滤镜选项
- **图注编辑**: 支持添加和编辑图片说明

## 使用示例

```tsx
<ImageBlock
  src="https://example.com/image.jpg"
  alt="示例图片"
  caption="这是一张示例图片"
  width={600}
  align="center"
  editable={true}
  onChange={(props) => console.log(props)}
/>
```

---

# TodoBlock 组件

## 概述

TodoBlock(待办事项块)组件用于创建和管理任务列表,支持勾选、优先级、截止日期、任务分配等功能。

## Props 接口

```typescript
interface TodoBlockProps {
  todos: TodoItem[];
  editable?: boolean;
  onChange?: (todos: TodoItem[]) => void;
}

interface TodoItem {
  id: string;
  content: string;
  checked: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: number;
  assignee?: string;
  tags?: string[];
}
```

## 核心功能

- 勾选完成状态
- 优先级标记
- 截止日期设置
- 任务分配
- 标签管理
- 拖拽排序

## 使用示例

```tsx
const initialTodos: TodoItem[] = [
  { id: '1', content: '完成需求文档', checked: true, priority: 'high' },
  { id: '2', content: '设计系统架构', checked: false, priority: 'urgent', dueDate: Date.now() + 86400000 },
  { id: '3', content: '编写测试用例', checked: false, priority: 'medium' },
];

<TodoBlock
  todos={initialTodos}
  editable={true}
  onChange={(todos) => console.log(todos)}
/>
```

---

# CalloutBlock 组件

## 概述

CalloutBlock(提示块)组件用于在文档中突出显示重要信息,支持多种类型如信息、警告、错误、成功等。

## Props 接口

```typescript
interface CalloutBlockProps {
  type: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'note';
  title?: string;
  content: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  editable?: boolean;
  onChange?: (props: CalloutBlockProps) => void;
}
```

## 提示块类型

| 类型 | 颜色 | 用途 |
|------|------|------|
| info | 蓝色 | 一般信息 |
| warning | 黄色 | 警告信息 |
| error | 红色 | 错误信息 |
| success | 绿色 | 成功信息 |
| tip | 紫色 | 技巧提示 |
| note | 灰色 | 备注说明 |

## 使用示例

```tsx
<CalloutBlock
  type="warning"
  title="注意事项"
  content="请在操作前备份重要数据,以防数据丢失。"
  collapsible={true}
  defaultExpanded={true}
/>

<CalloutBlock
  type="tip"
  content="使用快捷键 Ctrl+S 可以快速保存文档。"
/>
```
