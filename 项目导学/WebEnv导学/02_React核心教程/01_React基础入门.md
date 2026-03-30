# React 基础入门

## 目录
- [React 是什么？为什么需要它？](#1-react-是什么为什么需要它)
- [JSX 语法详解](#2-jsx-语法详解)
- [组件化思想](#3-组件化思想)
- [Props 和 State 的区别和使用](#4-props-和-state-的区别和使用)
- [事件处理](#5-事件处理)
- [条件渲染和列表渲染](#6-条件渲染和列表渲染)
- [表单处理](#7-表单处理)

---

## 1. React 是什么？为什么需要它？

### 1.1 React 的定义

**React** 是 Facebook（现 Meta）开发的一个用于构建用户界面的 JavaScript 库。它的核心目标是**让构建交互式用户界面变得简单高效**。

### 1.2 为什么需要 React？

在 React 出现之前，传统的 DOM 操作方式是这样的：

```javascript
// 传统方式：手动操作 DOM
const title = document.createElement('h1');
title.textContent = 'Hello World';
title.style.color = 'blue';
document.body.appendChild(title);

// 当数据变化时，需要手动更新 DOM
title.textContent = 'Hello React';
```

**问题**：
- 代码冗长繁琐
- 数据和视图分离，难以维护
- 性能问题（每次更新都可能重新渲染整个页面）
- 状态管理困难

### 1.3 React 的核心思想

React 提出了**声明式**和**组件化**的开发理念：

```
┌─────────────────────────────────────────────────────────────┐
│                     React 核心思想                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐ │
│   │    数据     │────▶│    组件     │────▶│    视图     │ │
│   │  (State)   │     │  (Component)│     │   (Render)  │ │
│   └─────────────┘     └─────────────┘     └─────────────┘ │
│        ▲                                            │       │
│        │                                            ▼       │
│        │              ┌─────────────┐     ┌─────────────┐ │
│        └─────────────│    更新     │◀────│   用户交互   │ │
│                      │  (Re-render)│     │  (Interaction)│ │
│                      └─────────────┘     └─────────────┘ │
│                                                             │
│   声明式：告诉"做什么"，而不是"怎么做"                       │
│   组件化：把 UI 拆分成独立可复用的部件                       │
│   单向数据流：数据自上而下流动                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 第一个 React 组件

让我们从一个最简单的例子开始：

```jsx
// HelloWorld.jsx
function HelloWorld() {
  return <h1>Hello, World!</h1>;
}

export default HelloWorld;
```

```jsx
// App.jsx - 使用组件
import HelloWorld from './HelloWorld';

function App() {
  return (
    <div>
      <HelloWorld />
      <HelloWorld />
      <HelloWorld />
    </div>
  );
}
```

**效果**：页面上会显示三个 "Hello, World!" 标题。

---

## 2. JSX 语法详解

### 2.1 什么是 JSX？

**JSX** 是 JavaScript XML 的缩写，它是一种 JavaScript 的语法扩展，让我们可以在 JavaScript 中编写类似 HTML 的代码。

```jsx
// 这就是 JSX - 看起来像 HTML 的 JavaScript
const element = <h1>Hello, React!</h1>;
```

### 2.2 为什么使用 JSX？

React 认为把 UI 相关的逻辑放在一起会更清晰：
- 模板和逻辑分离 → 问题更多
- 模板和逻辑耦合 → 更容易维护

### 2.3 JSX 基础语法

#### 2.3.1 嵌入 JavaScript 表达式

使用 `{}` 在 JSX 中嵌入 JavaScript 表达式：

```jsx
function App() {
  const name = '张三';
  const age = 25;
  const isStudent = false;

  return (
    <div>
      <h1>姓名：{name}</h1>
      <p>年龄：{age}</p>
      <p>是学生吗？{isStudent ? '是' : '否'}</p>
      {/* 可以执行任何 JavaScript 表达式 */}
      <p>两年后年龄：{age + 2}</p>
      <p>首字母大写：{name.toUpperCase()}</p>
    </div>
  );
}
```

#### 2.3.2 JSX 也是表达式

JSX 本身也是 JavaScript 表达式，可以在条件语句、循环中使用：

```jsx
function getGreeting(user) {
  if (user) {
    return <h1>你好，{user.name}！</h1>;
  }
  return <h1>你好，陌生人！</h1>;
}
```

### 2.4 JSX 属性

#### 2.4.1 字符串属性

```jsx
// 字符串字面量
const element = <div tabIndex="0">内容</div>;
const element2 = <img src="https://example.com/image.png" />;
```

#### 2.4.2 JavaScript 表达式作为属性

```jsx
const imgUrl = 'https://example.com/image.png';
const element = <img src={imgUrl} alt="示例图片" />;
```

#### 2.4.3 布尔属性

```jsx
// true 可以省略属性值
<input type="checkbox" checked />  // 等同于 checked={true}

// false 需要显式写
<input type="checkbox" checked={false} />
```

### 2.5 JSX 样式

#### 2.5.1 内联样式（行内样式）

```jsx
function App() {
  const style = {
    color: 'blue',
    fontSize: '20px',
    backgroundColor: '#f0f0f0',
    padding: '10px',
    borderRadius: '5px'
  };

  return <div style={style}>这是一个带样式的 div</div>;
}
```

**注意**：
- CSS 属性使用 camelCase（如 `backgroundColor`）
- 值必须是字符串

#### 2.5.2 使用 CSS 类（推荐）

```css
/* styles.css */
.container {
  padding: 20px;
  background-color: #f5f5f5;
}

.title {
  color: #333;
  font-size: 24px;
}
```

```jsx
import './styles.css';

function App() {
  return (
    <div className="container">
      <h1 className="title">标题</h1>
      <p>内容</p>
    </div>
  );
}
```

**注意**：React 中使用 `className` 而不是 `class`，因为 `class` 是 JavaScript 的保留字。

#### 2.5.3 使用 Tailwind CSS（本项目使用）

```jsx
// 本项目使用 Tailwind CSS
function App() {
  return (
    <div className="p-5 bg-gray-100">
      <h1 className="text-2xl text-gray-800 font-bold">标题</h1>
      <p className="text-gray-600">内容段落</p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        点击我
      </button>
    </div>
  );
}
```

### 2.6 JSX 数组渲染

JSX 数组可以直接渲染：

```jsx
const fruits = ['苹果', '香蕉', '橙子'];

function App() {
  return (
    <ul>
      {fruits.map((fruit, index) => (
        <li key={index}>{fruit}</li>
      ))}
    </ul>
  );
}
```

### 2.7 完整示例：个人简介卡片

```jsx
function ProfileCard() {
  const person = {
    name: '李明',
    avatar: 'https://example.com/avatar.jpg',
    bio: '前端开发工程师',
    skills: ['React', 'TypeScript', 'Node.js']
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white p-4">
      <img
        className="w-24 h-24 rounded-full mx-auto"
        src={person.avatar}
        alt={person.name}
      />
      <div className="px-6 py-4 text-center">
        <div className="font-bold text-xl mb-2">{person.name}</div>
        <p className="text-gray-700 text-base">{person.bio}</p>
      </div>
      <div className="px-6 py-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {person.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2.8 JSX 常见错误

```jsx
// ❌ 错误：不能使用 if/for 语句在 {} 中
// 正确做法：使用三元表达式或提前定义
function ErrorExample() {
  const show = true;

  return (
    <div>
      {/* 错误 ❌ */}
      {/* {if (show) { return <p>显示</p> }} */}

      {/* 正确 ✅ 使用三元表达式 */}
      {show ? <p>显示</p> : <p>隐藏</p>}

      {/* 正确 ✅ 使用 && 运算符 */}
      {show && <p>显示</p>}
    </div>
  );
}

// ❌ 错误：必须闭合标签
// <div>未闭合</div>

// ❌ 错误：class 应该是 className
// <div class="container">...</div>
```

---

## 3. 组件化思想

### 3.1 什么是组件？

**组件**是 React 的核心概念，它是一个可复用的 UI 片段，每个组件维护自己的逻辑和数据。

```
┌─────────────────────────────────────────────────────────────┐
│                        页面                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Header      │ │  Content     │ │  Footer      │        │
│  │  组件        │ │  组件        │ │  组件        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│         │                │                │                 │
│    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐           │
│    │ Logo    │      │ Article │      │ Copyright│           │
│    │ Nav     │      │ Sidebar │      └──────────┘           │
│    └─────────┘      └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 函数组件 vs 类组件

#### 3.2.1 函数组件（推荐，现代 React 开发使用）

```jsx
// 函数组件 - 现代写法
function Welcome(props) {
  return <h1>你好，{props.name}！</h1>;
}

// 也可以使用箭头函数
const Welcome = (props) => {
  return <h1>你好，{props.name}！</h1>;
};

// 使用
function App() {
  return <Welcome name="张三" />;
}
```

#### 3.2.2 类组件（传统写法，了解即可）

```jsx
// 类组件 - 传统写法
class Welcome extends React.Component {
  render() {
    return <h1>你好，{this.props.name}！</h1>;
  }
}
```

#### 3.2.3 对比

| 特性 | 函数组件 | 类组件 |
|------|---------|--------|
| 语法 | 更简洁 | 较繁琐 |
| this | 无需处理 | 需要 bind |
| 状态 | Hooks | setState |
| 生命周期 | useEffect | 生命周期方法 |
| 性能 | 更轻量 | 较重 |
| 推荐 | 是 | 了解即可 |

### 3.3 组件的组合

组件可以嵌套使用，形成组件树：

```jsx
// Button.jsx
function Button({ children, onClick }) {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Card.jsx
function Card({ title, children }) {
  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

// App.jsx - 组合组件
function App() {
  return (
    <div className="p-4">
      <Card title="欢迎">
        <p>欢迎来到 React 世界！</p>
        <Button onClick={() => alert('点击了!')}>
          点击我
        </Button>
      </Card>
    </div>
  );
}
```

### 3.4 组件的文件组织

推荐的文件组织结构：

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.jsx      # 组件实现
│   │   ├── Button.css      # 样式
│   │   └── index.js        # 导出入口
│   ├── Card/
│   │   ├── Card.jsx
│   │   └── index.js
│   └── index.js            # 组件统一导出
├── pages/
│   ├── Home.jsx
│   └── About.jsx
└── App.jsx
```

```jsx
// components/Button/index.js
export { default as Button } from './Button';
export { default as Card } from './Card';
```

---

## 4. Props 和 State 的区别和使用

### 4.1 Props（属性）

**Props** 是组件的输入参数，用于从父组件向子组件传递数据。

```
┌─────────────────────────────────────────────────────────────┐
│                        Props 流向                            │
│                                                             │
│    ┌─────────────────┐                                     │
│    │    父组件       │                                     │
│    │                 │  name="张三"  age={25}              │
│    │  name: "张三"   │ ──────────────────▶                │
│    │  age: 25        │      Props                         │
│    └─────────────────┘                                     │
│                              ▼                              │
│                    ┌─────────────────┐                      │
│                    │    子组件       │                      │
│                    │                 │                      │
│                    │  props.name     │                      │
│                    │  props.age      │                      │
│                    └─────────────────┘                      │
│                                                             │
│    Props 是只读的（只读属性）                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.1 基本使用

```jsx
// 父组件
function Parent() {
  return (
    <Child
      name="张三"
      age={25}
      isStudent={true}
    />
  );
}

// 子组件 - 接收 props
function Child(props) {
  return (
    <div>
      <p>姓名：{props.name}</p>
      <p>年龄：{props.age}</p>
      <p>是学生：{props.isStudent ? '是' : '否'}</p>
    </div>
  );
}
```

#### 4.1.2 解构 props（推荐）

```jsx
// 使用解构赋值
function Child({ name, age, isStudent }) {
  return (
    <div>
      <p>姓名：{name}</p>
      <p>年龄：{age}</p>
      <p>是学生：{isStudent ? '是' : '否'}</p>
    </div>
  );
}
```

#### 4.1.3 默认 props

```jsx
// 默认值设置
function Button({ text = '按钮', color = 'blue', onClick }) {
  return (
    <button
      className={`bg-${color}-500 px-4 py-2 rounded`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// 使用
<Button />  {/* 使用默认文字 "按钮" */}
<Button text="提交" />  {/* 使用传入的 "提交" */}
```

#### 4.1.4 Props .children

`children` 是一个特殊的 prop，表示组件的子元素：

```jsx
// Card 组件
function Card({ title, children }) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-bold mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

// 使用
<Card title="卡片标题">
  <p>这是卡片内容</p>
  <p>可以放任何元素</p>
</Card>
```

#### 4.1.5 Props 传递函数（回调函数）

```jsx
// 父组件
function Parent() {
  const handleChildClick = (message) => {
    console.log('收到子组件消息:', message);
  };

  return <Child onClick={handleChildClick} />;
}

// 子组件
function Child({ onClick }) {
  return (
    <button onClick={() => onClick('你好！')}>
      点击发送消息
    </button>
  );
}
```

### 4.2 State（状态）

**State** 是组件内部的数据，用于存储组件自己的可变数据。

```
┌─────────────────────────────────────────────────────────────┐
│                        State 生命周期                        │
│                                                             │
│    ┌──────────────────────────────────────────────┐        │
│    │              组件实例                         │        │
│    │                                              │        │
│    │   ┌────────────┐                             │        │
│    │   │   State   │  { count: 0 }               │        │
│    │   │  内部状态  │                             │        │
│    │   └────────────┘                             │        │
│    │         │                                      │        │
│    │         ▼                                      │        │
│    │   ┌────────────┐                             │        │
│    │   │  setState  │  setCount(count + 1)       │        │
│    │   │  更新状态  │                             │        │
│    │   └────────────┘                             │        │
│    │         │                                      │        │
│    │         ▼                                      │        │
│    │   ┌────────────┐                             │        │
│    │   │ Re-render  │  重新渲染组件                 │        │
│    │   │  重新渲染  │                             │        │
│    │   └────────────┘                             │        │
│    │                                              │        │
│    └──────────────────────────────────────────────┘        │
│                                                             │
│    State 是组件私有的，只能在组件内部修改                    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.1 useState Hook

```jsx
import { useState } from 'react';

function Counter() {
  // useState 返回一个数组：
  // [当前状态值, 更新状态的函数]
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
      <button onClick={() => setCount(count - 1)}>
        -1
      </button>
      <button onClick={() => setCount(0)}>
        重置
      </button>
    </div>
  );
}
```

#### 4.2.2 多个 state

```jsx
function UserForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState('');

  return (
    <form>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="年龄"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
    </form>
  );
}
```

#### 4.2.3 对象 state

```jsx
function UserForm() {
  const [user, setUser] = useState({
    name: '',
    age: 0,
    email: ''
  });

  const updateName = (name) => {
    // 展开运算符保留其他字段
    setUser({ ...user, name });
  };

  // 或者使用函数式更新
  const updateAge = (age) => {
    setUser(prev => ({ ...prev, age }));
  };

  return (
    <div>
      <p>姓名：{user.name}</p>
      <p>年龄：{user.age}</p>
      <p>邮箱：{user.email}</p>
    </div>
  );
}
```

### 4.3 Props vs State 对比

| 特性 | Props | State |
|------|-------|-------|
| 定义位置 | 父组件定义 | 组件内部定义 |
| 数据的拥有者 | 父组件 | 组件自己 |
| 是否可修改 | 只读 | 可以修改（通过 setState） |
| 作用 | 组件间通信 | 管理组件内部数据 |
| 变化时 | 接收新值 | 触发重新渲染 |

### 4.4 完整示例：待办事项列表

```jsx
import { useState } from 'react';

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: '学习 React', completed: false },
    { id: 2, text: '完成作业', completed: true },
    { id: 3, text: '锻炼身体', completed: false }
  ]);

  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo = {
      id: Date.now(),
      text: newTodo,
      completed: false
    };

    setTodos([...todos, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">待办事项</h1>

      {/* 输入框 */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="添加新事项..."
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          添加
        </button>
      </div>

      {/* 列表 */}
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 bg-gray-100 rounded"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500"
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-gray-600">
        共 {todos.length} 项，已完成 {todos.filter(t => t.completed).length} 项
      </p>
    </div>
  );
}

export default TodoList;
```

---

## 5. 事件处理

### 5.1 事件处理基础

在 React 中，事件处理与 DOM 事件类似，但有一些区别：

```jsx
function EventExample() {
  const handleClick = () => {
    console.log('按钮被点击了！');
  };

  return (
    <button onClick={handleClick}>
      点击我
    </button>
  );
}
```

**主要区别**：
- 事件名使用 camelCase（如 `onClick` 而不是 `onclick`）
- 传入的是函数引用，而不是字符串

### 5.2 事件对象

事件处理函数会接收一个事件对象：

```jsx
function EventExample() {
  const handleClick = (event) => {
    console.log('事件对象:', event);
    console.log('事件类型:', event.type);
    console.log('触发元素:', event.target);
    console.log('当前元素:', event.currentTarget);
  };

  return (
    <button onClick={handleClick}>
      点击我
    </button>
  );
}
```

### 5.3 传递额外参数

```jsx
function EventExample() {
  const handleClick = (id, name, event) => {
    console.log(`ID: ${id}, Name: ${name}`);
    console.log('事件对象:', event);
  };

  return (
    <div>
      {/* 方式一：使用箭头函数 */}
      <button onClick={(e) => handleClick(1, '张三', e)}>
        方式一
      </button>

      {/* 方式二：使用 bind */}
      <button onClick={handleClick.bind(null, 2, '李四')}>
        方式二
      </button>
    </div>
  );
}
```

### 5.4 常见事件类型

```jsx
function EventsExample() {
  // 点击事件
  const handleClick = () => console.log('clicked');

  // 输入事件
  const handleChange = (e) => console.log('value:', e.target.value);

  // 提交事件
  const handleSubmit = (e) => {
    e.preventDefault();  // 阻止默认行为
    console.log('form submitted');
  };

  // 失去焦点事件
  const handleBlur = (e) => {
    console.log('blur:', e.target.value);
  };

  // 鼠标事件
  const handleMouseEnter = () => console.log('mouse enter');
  const handleMouseLeave = () => console.log('mouse leave');

  // 键盘事件
  const handleKeyDown = (e) => console.log('key:', e.key);

  return (
    <div>
      <button onClick={handleClick}>点击</button>

      <input onChange={handleChange} />

      <form onSubmit={handleSubmit}>
        <button type="submit">提交</button>
      </form>

      <input onBlur={handleBlur} />

      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        鼠标悬停
      </div>

      <input onKeyDown={handleKeyDown} />
    </div>
  );
}
```

### 5.5 阻止默认行为

```jsx
function LinkExample() {
  const handleClick = (e) => {
    e.preventDefault();  // 阻止链接跳转
    console.log('链接被阻止了');
  };

  return (
    <a href="https://google.com" onClick={handleClick}>
      不会跳转的链接
    </a>
  );
}
```

### 5.6 表单事件处理

```jsx
function FormExample() {
  const [value, setValue] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('提交的值:', value);
    }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 5.7 事件处理常见错误

```jsx
function CommonMistakes() {
  // ❌ 错误：传入函数调用结果
  // <button onClick={handleClick()}>  // 这会立即执行

  // ✅ 正确：传入函数引用
  // <button onClick={handleClick}>

  // ❌ 错误：事件处理函数不是纯函数
  // const handleClick = () => {
  //   console.log(state);  // 使用外部变量
  //   setState(x + 1);    // 可能产生副作用
  // };

  // ✅ 正确：使用 setState 的函数形式
  // const handleClick = () => {
  //   setState(prev => prev + 1);  // 使用前一个状态
  // };

  return <div>查看代码注释</div>;
}
```

---

## 6. 条件渲染和列表渲染

### 6.1 条件渲染

#### 6.1.1 if 语句

```jsx
function Greeting({ user }) {
  if (user) {
    return <h1>你好，{user.name}！</h1>;
  }
  return <h1>你好，陌生人！</h1>;
}
```

#### 6.1.2 三元运算符

```jsx
function LoginButton({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? (
        <button>注销</button>
      ) : (
        <button>登录</button>
      )}
    </div>
  );
}
```

#### 6.1.3 && 运算符（短路求值）

```jsx
function Notification({ unreadCount }) {
  return (
    <div>
      <h1>你好！</h1>
      {unreadCount > 0 && (
        <p>你有 {unreadCount} 条未读消息</p>
      )}
    </div>
  );
}
```

**注意**：0 会被渲染，所以需要确保条件是布尔值：

```jsx
// ❌ 错误：0 会被渲染
{unreadCount && <p>{unreadCount} 条消息</p>}

// ✅ 正确
{unreadCount > 0 && <p>{unreadCount} 条消息</p>}

// ✅ 或者用三元表达式
{unreadCount ? <p>{unreadCount} 条消息</p> : null}
```

#### 6.1.4 switch 语句（使用组件）

```jsx
function StatusBadge({ status }) {
  switch (status) {
    case 'success':
      return <span className="text-green-500">成功</span>;
    case 'error':
      return <span className="text-red-500">错误</span>;
    case 'warning':
      return <span className="text-yellow-500">警告</span>;
    default:
      return <span className="text-gray-500">未知</span>;
  }
}
```

### 6.2 列表渲染

#### 6.2.1 使用 map

```jsx
function TodoList() {
  const todos = ['学习 React', '写代码', '喝茶'];

  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo}</li>
      ))}
    </ul>
  );
}
```

**重要**：每个列表项需要唯一的 `key` 属性！

#### 6.2.2 使用唯一 ID 作为 key

```jsx
function TodoList() {
  const todos = [
    { id: 1, text: '学习 React' },
    { id: 2, text: '写代码' },
    { id: 3, text: '喝茶' }
  ];

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

#### 6.2.3 复杂列表渲染

```jsx
function ProductList() {
  const products = [
    {
      id: 1,
      name: 'iPhone 15',
      price: 5999,
      category: '手机'
    },
    {
      id: 2,
      name: 'MacBook Pro',
      price: 14999,
      category: '电脑'
    },
    {
      id: 3,
      name: 'AirPods Pro',
      price: 1999,
      category: '耳机'
    }
  ];

  return (
    <div className="space-y-4">
      {products.map(product => (
        <div
          key={product.id}
          className="border p-4 rounded"
        >
          <h3 className="font-bold">{product.name}</h3>
          <p className="text-gray-600">分类：{product.category}</p>
          <p className="text-green-600">¥{product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

#### 6.2.4 列表过滤

```jsx
function FilteredList() {
  const allItems = [
    { id: 1, name: '苹果', category: '水果' },
    { id: 2, name: '香蕉', category: '水果' },
    { id: 3, name: '白菜', category: '蔬菜' },
    { id: 4, name: '胡萝卜', category: '蔬菜' }
  ];

  const [filter, setFilter] = useState('全部');

  const filteredItems = filter === '全部'
    ? allItems
    : allItems.filter(item => item.category === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('全部')}>全部</button>
        <button onClick={() => setFilter('水果')}>水果</button>
        <button onClick={() => setFilter('蔬菜')}>蔬菜</button>
      </div>

      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>
            {item.name} - {item.category}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 6.3 条件渲染 + 列表渲染组合

```jsx
function UserList({ users, showOnlineOnly }) {
  // 先过滤
  const filteredUsers = showOnlineOnly
    ? users.filter(user => user.isOnline)
    : users;

  return (
    <div>
      {filteredUsers.length === 0 ? (
        <p>没有找到用户</p>
      ) : (
        <ul>
          {filteredUsers.map(user => (
            <li key={user.id}>
              <span>{user.name}</span>
              {user.isOnline && <span className="text-green-500">在线</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 7. 表单处理

### 7.1 受控组件

**受控组件**：表单元素的值由 React state 控制的组件。

```jsx
function SimpleForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交的数据:', { name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>姓名：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>邮箱：</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit">提交</button>
    </form>
  );
}
```

### 7.2 多输入表单

```jsx
function MultiInputForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bio: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value  // 使用计算属性名
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('表单数据:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="用户名"
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="邮箱"
      />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="密码"
      />
      <textarea
        name="bio"
        value={formData.bio}
        onChange={handleChange}
        placeholder="个人简介"
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 7.3 下拉菜单

```jsx
function SelectForm() {
  const [country, setCountry] = useState('china');

  return (
    <select
      value={country}
      onChange={(e) => setCountry(e.target.value)}
    >
      <option value="china">中国</option>
      <option value="usa">美国</option>
      <option value="japan">日本</option>
    </select>
  );
}
```

### 7.4 复选框

```jsx
function CheckboxForm() {
  const [agree, setAgree] = useState(false);
  const [hobbies, setHobbies] = useState({
    reading: false,
    sports: false,
    music: false
  });

  const handleHobbyChange = (e) => {
    const { name, checked } = e.target;
    setHobbies(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <form>
      <div>
        <label>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          我同意服务条款
        </label>
      </div>

      <div>
        <p>爱好：</p>
        <label>
          <input
            name="reading"
            type="checkbox"
            checked={hobbies.reading}
            onChange={handleHobbyChange}
          />
          阅读
        </label>
        <label>
          <input
            name="sports"
            type="checkbox"
            checked={hobbies.sports}
            onChange={handleHobbyChange}
          />
          运动
        </label>
        <label>
          <input
            name="music"
            type="checkbox"
            checked={hobbies.music}
            onChange={handleHobbyChange}
          />
          音乐
        </label>
      </div>
    </form>
  );
}
```

### 7.5 单选按钮

```jsx
function RadioForm() {
  const [gender, setGender] = useState('male');

  return (
    <form>
      <p>性别：</p>
      <label>
        <input
          type="radio"
          name="gender"
          value="male"
          checked={gender === 'male'}
          onChange={(e) => setGender(e.target.value)}
        />
        男
      </label>
      <label>
        <input
          type="radio"
          name="gender"
          value="female"
          checked={gender === 'female'}
          onChange={(e) => setGender(e.target.value)}
        />
        女
      </label>
    </form>
  );
}
```

### 7.6 表单验证

```jsx
function ValidatedForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('表单提交成功:', formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        {errors.email && <span className="text-red-500">{errors.email}</span>}
      </div>
      <div>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        {errors.password && <span className="text-red-500">{errors.password}</span>}
      </div>
      <button type="submit">提交</button>
    </form>
  );
}
```

### 7.7 完整示例：用户注册表单

```jsx
function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!formData.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    if (!formData.agree) {
      newErrors.agree = '请同意服务条款';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      console.log('注册信息:', formData);
      alert('注册成功！');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">用户注册</h2>

      <div>
        <label className="block mb-1">用户名</label>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        {errors.username && <span className="text-red-500 text-sm">{errors.username}</span>}
      </div>

      <div>
        <label className="block mb-1">邮箱</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
      </div>

      <div>
        <label className="block mb-1">密码</label>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
      </div>

      <div>
        <label className="block mb-1">确认密码</label>
        <input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            name="agree"
            type="checkbox"
            checked={formData.agree}
            onChange={handleChange}
          />
          <span>我同意服务条款</span>
        </label>
        {errors.agree && <span className="text-red-500 text-sm">{errors.agree}</span>}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        注册
      </button>
    </form>
  );
}
```

---

## 总结

本教程涵盖了 React 基础的核心概念：

1. **React 是什么**：声明式、组件化的 UI 库
2. **JSX 语法**：JavaScript + HTML 的语法扩展
3. **组件化思想**：函数组件是现代 React 开发的主流方式
4. **Props vs State**：Props 是只读的外部数据，State 是可变的内部状态
5. **事件处理**：React 使用 camelCase 事件名，传入函数引用
6. **条件渲染**：if/else、三元运算符、&& 运算符
7. **列表渲染**：map 方法 + key 属性
8. **表单处理**：受控组件 + 表单验证

下一章节我们将学习 React Hooks，这是现代 React 开发的核心武器！

---

## 下一步学习

- [02_React Hooks完全指南](./02_React_Hooks完全指南.md) - 深入学习 React Hooks
- [03_Zustand状态管理](./03_Zustand状态管理.md) - 学习状态管理
- [04_SWR数据获取](./04_SWR数据获取.md) - 学习数据获取
