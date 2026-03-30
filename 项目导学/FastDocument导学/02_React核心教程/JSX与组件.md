# JSX 与 React 组件

## 目录

1. JSX 基础语法
2. 组件的定义与使用
3. 函数组件 vs 类组件
4. 组件组合与嵌套
5. 条件渲染
6. 列表渲染
7. 事件处理

---

## 1. JSX 基础语法

### 1.1 什么是 JSX？

JSX（JavaScript XML）是 JavaScript 的语法扩展，允许在 JavaScript 中编写类似 HTML 的标记。它是 React 的核心特性之一。

**为什么使用 JSX？**
- 声明式：代码更直观，描述 UI 是什么样的
- 易于维护：HTML 和 JavaScript 在同一个文件中
- 编译优化：JSX 会被编译成高效的 JavaScript 代码

### 1.2 基本语法规则

```jsx
// 基本 HTML 元素
const element = <h1>Hello, FastDocument!</h1>

// 嵌入 JavaScript 表达式
const name = "Alice"
const greeting = <h1>Hello, {name}!</h1>

// 计算表达式
const a = 10
const b = 20
const sum = <p>{a} + {b} = {a + b}</p>

// 调用函数
function formatName(user) {
  return user.firstName + ' ' + user.lastName
}
const user = { firstName: 'Bob', lastName: 'Chen' }
const element = <h1>Hello, {formatName(user)}!</h1>
```

### 1.3 JSX 属性

```jsx
// 使用引号定义字符串字面量
const element = <div className="container">Content</div>

// 使用大括号嵌入 JavaScript 表达式
const isActive = true
const element = <button disabled={!isActive}>Click</button>

// 自定义属性（使用 data- 前缀）
const element = <div data-user-id="123">Content</div>

// 展开属性
const props = { className: 'title', id: 'main-title' }
const element = <h1 {...props}>Title</h1>
```

### 1.4 子元素渲染

```jsx
// 字符串字面量
const element = <div>Hello World</div>

// 混合内容
const element = (
  <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>
)

// 嵌入数组（会自动展开）
const items = ['Apple', 'Banana', 'Orange']
const element = <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>

// 条件渲染
const isLoggedIn = true
const element = (
  <div>
    {isLoggedIn ? <h1>Welcome!</h1> : <h1>Please login.</h1>}
  </div>
)

// 逻辑与运算符
const hasMessage = true
const element = (
  <div>
    {hasMessage && <span>You have new messages</span>}
  </div>
)
```

---

## 2. 组件的定义与使用

### 2.1 函数组件（推荐）

函数组件是现代 React 开发的标准方式：

```tsx
// 基础函数组件
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>
}

// 使用箭头函数
const Welcome = (props) => {
  return <h1>Hello, {props.name}!</h1>
}

// 使用 TypeScript 类型
interface WelcomeProps {
  name: string
  age?: number
}

const Welcome: React.FC<WelcomeProps> = ({ name, age = 18 }) => {
  return (
    <div className="welcome">
      <h1>Hello, {name}!</h1>
      {age && <p>Age: {age}</p>}
    </div>
  )
}

// 使用组件
const element = <Welcome name="Alice" age={25} />
```

### 2.2 类组件（传统方式）

类组件在旧代码中仍然可见：

```tsx
// 基础类组件
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>
  }
}

// 带状态和生命周期的类组件
class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = { count: 0 }
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Increment
        </button>
      </div>
    )
  }
}
```

### 2.3 组件的 props

Props 是组件的输入参数：

```tsx
// Props 解构
function UserCard({ name, email, avatar }) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}

// 使用
<UserCard
  name="Alice"
  email="alice@example.com"
  avatar="/avatar.png"
/>

// children 属性
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

<Card title="Document">
  <p>This is the card content.</p>
  <button>Action</button>
</Card>
```

---

## 3. 组件组合与嵌套

### 3.1 组件组合

组件可以嵌套组合形成复杂的 UI：

```tsx
// 基础组件
function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      className="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

// 组合组件 - 表单
function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log({ username, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit">Login</Button>
    </form>
  )
}
```

### 3.2 组件树结构

FastDocument 的组件树示例：

```
App
├── ThemeProvider
│   └── ConfigProvider
│       └── HomePage
│           ├── Sidebar
│           │   ├── DocumentTree
│           │   │   └── DocumentTreeItem (递归)
│           │   └── NavigationItems
│           ├── Header
│           │   ├── SearchBar
│           │   ├── UserAvatar
│           │   └── ShareButton
│           └── ContentArea
│               ├── Dashboard
│               │   ├── DocumentList
│               │   └── CreateButton
│               ├── Editor
│               │   ├── Toolbar
│               │   ├── BlockList
│               │   │   ├── TextBlock
│               │   │   ├── HeadingBlock
│               │   │   ├── TodoBlock
│               │   │   └── ... (更多块类型)
│               │   └── BubbleMenu
│               ├── KnowledgeBase
│               │   ├── KnowledgeTree
│               │   └── DocumentPage
│               └── Meeting
│                   ├── VideoGrid
│                   ├── ControlBar
│                   └── ChatPanel
```

---

## 4. 条件渲染

### 4.1 使用 if/else

```tsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>
  }
  return <h1>Please login.</h1>
}
```

### 4.2 使用三元运算符

```tsx
function Greeting({ isLoggedIn, user }) {
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome, {user.name}!</h1>
      ) : (
        <h1>Please login.</h1>
      )}
    </div>
  )
}

// 内联条件
function LoginButton({ isLoading }) {
  return (
    <button disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Login'}
    </button>
  )
}
```

### 4.3 使用逻辑与运算符

```tsx
function Notification({ message }) {
  return (
    <div>
      {message && (
        <div className="notification">
          {message}
        </div>
      )}
    </div>
  )
}

// 多个条件
function UserStatus({ isOnline, hasNewMessage }) {
  return (
    <div className="user-status">
      {isOnline && <span className="status-dot" />}
      {hasNewMessage && <span className="badge">New!</span>}
    </div>
  )
}
```

### 4.4 使用 switch/case（通过函数）

```tsx
function DocumentIcon({ type }) {
  const iconMap = {
    document: <FileText />,
    folder: <Folder />,
    workspace: <Briefcase />,
    image: <Image />,
    code: <Code />,
  }

  return iconMap[type] || <File />
}
```

---

## 5. 列表渲染

### 5.1 使用 map 渲染列表

```tsx
function DocumentList({ documents }) {
  return (
    <ul>
      {documents.map((doc) => (
        <li key={doc.id}>
          <span>{doc.title}</span>
          <span>{doc.updatedAt}</span>
        </li>
      ))}
    </ul>
  )
}
```

### 5.2 使用条件过滤

```tsx
function FilteredList({ items, filter }) {
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    return item.status === filter
  })

  return (
    <ul>
      {filteredItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

### 5.3 分组渲染

```tsx
function GroupedDocuments({ documents }) {
  const grouped = documents.reduce((acc, doc) => {
    const folder = doc.folder || 'Unorganized'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(doc)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(grouped).map(([folder, docs]) => (
        <div key={folder} className="folder-group">
          <h3>{folder}</h3>
          <ul>
            {docs.map((doc) => (
              <li key={doc.id}>{doc.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

---

## 6. 事件处理

### 6.1 基本事件处理

```tsx
function ClickButton() {
  const handleClick = (e) => {
    console.log('Button clicked!')
    console.log(e.target) // 事件目标
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### 6.2 传递参数

```tsx
function ItemList({ items, onDelete }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onDelete(item.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

// 使用 useCallback 优化
function ParentComponent() {
  const handleDelete = useCallback((id) => {
    console.log('Delete item:', id)
  }, [])

  return <ItemList items={items} onDelete={handleDelete} />
}
```

### 6.3 表单事件

```tsx
function SearchForm() {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Search:', query)
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <button type="submit">Search</button>
    </form>
  )
}
```

### 6.4 模拟事件系统（类似 Block 编辑器）

```tsx
// 块编辑器事件处理
function BlockEditor() {
  const [blocks, setBlocks] = useState([])

  // 处理块内容变化
  const handleBlockChange = (blockId, newContent) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? { ...block, content: newContent }
        : block
    ))
  }

  // 处理块类型变化
  const handleBlockTypeChange = (blockId, newType) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? { ...block, type: newType }
        : block
    ))
  }

  // 处理块删除
  const handleBlockDelete = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId))
  }

  // 处理块移动
  const handleBlockMove = (blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < blocks.length) {
      const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
      setBlocks(newBlocks)
    }
  }

  return (
    <div>
      {blocks.map(block => (
        <Block
          key={block.id}
          block={block}
          onChange={(content) => handleBlockChange(block.id, content)}
          onTypeChange={(type) => handleBlockTypeChange(block.id, type)}
          onDelete={() => handleBlockDelete(block.id)}
          onMove={(dir) => handleBlockMove(block.id, dir)}
        />
      ))}
    </div>
  )
}
```

---

## 7. 实际应用示例

### 7.1 FastDocument 编辑器组件结构

```tsx
// 简化版的编辑器组件
function Editor({ documentId }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // 渲染块列表
  const renderBlocks = () => {
    return blocks.map((block, index) => (
      <BlockWrapper
        key={block.id}
        isSelected={selectedBlockId === block.id}
        onSelect={() => setSelectedBlockId(block.id)}
      >
        {renderBlockByType(block)}
      </BlockWrapper>
    ))
  }

  // 根据类型渲染不同块
  const renderBlockByType = (block: Block) => {
    switch (block.type) {
      case 'text':
        return <TextBlock content={block.content} />
      case 'h1':
        return <HeadingBlock level={1} content={block.content} />
      case 'h2':
        return <HeadingBlock level={2} content={block.content} />
      case 'todo':
        return <TodoBlock content={block.content} checked={block.checked} />
      case 'code':
        return <CodeBlock content={block.content} language={block.language} />
      case 'image':
        return <ImageBlock src={block.src} alt={block.alt} />
      case 'table':
        return <TableBlock data={block.data} />
      case 'callout':
        return <CalloutBlock type={block.calloutType} content={block.content} />
      default:
        return <TextBlock content={block.content} />
    }
  }

  return (
    <div className="editor">
      {renderBlocks()}
    </div>
  )
}
```

### 7.2 侧边栏导航组件

```tsx
// 文档树组件
function DocumentTree({ documents, onSelect, onCreate }) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const renderTreeItem = (doc: Document, depth = 0) => {
    const isFolder = doc.type === 'folder'
    const isExpanded = expandedFolders.has(doc.id)

    return (
      <div key={doc.id} style={{ paddingLeft: depth * 16 }}>
        <div
          className="tree-item"
          onClick={() => {
            if (isFolder) {
              toggleFolder(doc.id)
            } else {
              onSelect(doc)
            }
          }}
        >
          {isFolder && (
            <span className="folder-icon">
              {isExpanded ? <FolderOpen /> : <Folder />}
            </span>
          )}
          <span className="doc-icon">
            {getDocumentIcon(doc.type)}
          </span>
          <span className="doc-title">{doc.title}</span>
        </div>

        {isFolder && isExpanded && doc.children && (
          <div className="folder-children">
            {doc.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="document-tree">
      {documents.map(doc => renderTreeItem(doc))}
    </div>
  )
}
```

---

## 练习题

### 练习 1：创建一个文档卡片组件

创建一个 `DocumentCard` 组件，包含：
- 文档标题
- 文档类型图标
- 最后更新时间
- 收藏按钮

### 练习 2：创建块列表渲染

创建一个 `BlockList` 组件：
- 渲染块数组
- 支持添加新块
- 支持删除块
- 支持拖拽排序

### 练习 3：创建文档树组件

创建一个 `DocumentTree` 组件：
- 支持文件夹展开/折叠
- 支持递归渲染子文档
- 支持点击选择文档

---

## 下一步

- 学习 [Props与State](./Props与State.md)
- 学习 [Hooks详解](./Hooks详解.md)
- 实践项目中的实际组件
