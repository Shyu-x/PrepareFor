# React基础

## 目录

1. [JSX语法与原理](#1-jsx语法与原理)
2. [组件生命周期](#2-组件生命周期)
3. [Props与State](#3-props与state)
4. [事件处理](#4-事件处理)
5. [深入原理分析](#5-深入原理分析)
6. [组件设计模式](#6-组件设计模式)
7. [实战案例](#7-实战案例)
8. [常见面试题](#8-常见面试题)

---

## 1. JSX语法与原理

### 1.1 JSX 基础

JSX（JavaScript XML）是一种 JavaScript 的语法扩展，允许在 JavaScript 中编写类似 HTML 的标记。

```jsx
// JSX 示例
function App() {
    return (
        <div className="container">
            <h1>Hello, World!</h1>
            <p>欢迎学习 React</p>
        </div>
    );
}

// 等价于 React.createElement
function App() {
    return React.createElement(
        'div',
        { className: 'container' },
        React.createElement('h1', null, 'Hello, World!'),
        React.createElement('p', null, '欢迎学习 React')
    );
}
```

### 1.2 JSX 表达式

```jsx
// 嵌入 JavaScript 表达式
function App() {
    const name = '张三';
    const age = 25;
    const styles = { color: 'blue', fontSize: '20px' };

    return (
        <div>
            <h1>姓名：{name}</h1>
            <h2>年龄：{age}</h2>
            <p style={styles}>这是一段文本</p>
        </div>
    );
}

// 条件渲染
function App() {
    const isLoggedIn = true;

    return (
        <div>
            {isLoggedIn ? (
                <h1>欢迎回来！</h1>
            ) : (
                <h1>请登录</h1>
            )}

            {/* 短路运算符 */}
            {isLoggedIn && <button>退出</button>}
        </div>
    );
}

// 列表渲染
function App() {
    const items = ['Apple', 'Banana', 'Orange'];

    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}
```

### 1.3 JSX 属性

```jsx
// 字符串属性
function App() {
    return <div className="container">内容</div>;
}

// JavaScript 表达式属性
function App() {
    const url = 'https://example.com/image.jpg';

    return (
        <div>
            <img src={url} alt="示例图片" />
        </div>
    );
}

// 布尔属性
function App() {
    const isDisabled = true;

    return (
        <button disabled={isDisabled}>点击</button>
    );
}

// 展开属性
function App() {
    const props = {
        className: 'container',
        style: { color: 'red' },
        id: 'myDiv'
    };

    return <div {...props}>内容</div>;
}
```

### 1.4 常见面试问题

---

## 5. 深入原理分析

### 5.1 JSX 编译原理

JSX 并不是直接被浏览器执行的，它需要经过编译过程。React 使用 Babel 等工具将 JSX 编译成 `React.createElement()` 调用。

```jsx
// 源代码 JSX
const element = <div className="container">Hello</div>;

// Babel 编译后
const element = React.createElement(
  'div',
  { className: 'container' },
  'Hello'
);

// React.createElement 返回的对象结构
// 这就是虚拟 DOM 的基本单位
{
  type: 'div',
  key: null,
  ref: null,
  props: {
    className: 'container',
    children: 'Hello'
  }
}
```

### 5.2 JSX 的限制与最佳实践

```jsx
// ❌ 错误：JSX 顶层只能有一个根元素
function BadComponent() {
  return (
    <h1>标题</h1>
    <p>段落</p>  // 编译错误！
  );
}

// ✅ 正确：使用 Fragment 包裹多个元素
function GoodComponent() {
  return (
    <>
      <h1>标题</h1>
      <p>段落</p>
    </>
  );
}

// ✅ 正确：使用 React.Fragment 明确指定 key
function ListComponent({ items }) {
  return (
    <React.Fragment key={item.id}>
      {items.map(item => (
        <React.Fragment key={item.id}>
          <h2>{item.title}</h2>
          <p>{item.content}</p>
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}
```

### 5.3 虚拟 DOM 工作原理

React 的虚拟 DOM 是一种 JavaScript 对象树，用于描述真实 DOM 的结构。它的核心优势在于：

1. **批量更新**：将多次 DOM 操作合并为一次
2. **跨平台**：虚拟 DOM 不仅可以渲染为 DOM，还可以渲染为 Native、PDF 等
3. **抽象化**：开发者不需要直接操作 DOM

```jsx
// 虚拟 DOM 示例：描述一个简单的 UI
const virtualDOM = {
  type: 'div',
  props: {
    className: 'card',
    children: [
      {
        type: 'h1',
        props: { children: '用户信息' }
      },
      {
        type: 'p',
        props: { children: '姓名：张三' }
      }
    ]
  }
};

// 当状态变化时，React 会：
// 1. 创建新的虚拟 DOM 树
// 2. 对比新旧虚拟 DOM（Diff 算法）
// 3. 计算出最小更新
// 4. 批量更新真实 DOM
```

### 5.4 React 的渲染流程

```jsx
// React 17+ 的渲染流程
// 1. 触发渲染（状态变化、props变化、forceUpdate）
// 2. 协调器（Reconciler）遍历组件树
// 3. 创建/更新虚拟 DOM（Fiber 节点）
// 4. 提交阶段（Commit）将变更应用到真实 DOM

// 协调器（Reconciler）的工作
// - 首次渲染：创建所有 Fiber 节点
// - 更新渲染：使用 Diff 算法找出变化
// - 批量更新：将多个更新合并执行

// 提交阶段（Commit）
// - DOM 插入/删除
// - 生命周期调用（componentDidMount 等）
// - 副作用处理（useEffect 回调等）
```

### 5.5 组件实例化过程

```jsx
// 类组件实例化过程（React 16 以前）
class UserCard extends React.Component {
  // 1. 构造函数
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    // 绑定 this
    this.handleClick = this.handleClick.bind(this);
  }

  // 2. 组件挂载前（已废弃）
  componentWillMount() {}

  // 3. 渲染（纯函数）
  render() {
    return <div>{this.props.name}</div>;
  }

  // 4. 组件挂载后
  componentDidMount() {
    // 适合：DOM 操作、数据获取、订阅
  }

  // 5. 组件更新前（已废弃）
  componentWillReceiveProps(nextProps) {}

  // 6. 是否更新（性能优化）
  shouldComponentUpdate(nextProps, nextState) {
    // 返回 false 可阻止更新
    return true;
  }

  // 7. 组件更新前（已废弃）
  componentWillUpdate(nextProps, nextState) {}

  // 8. 组件更新后
  componentDidUpdate(prevProps, prevState) {}

  // 9. 组件卸载前
  componentWillUnmount() {
    // 清理：取消订阅、定时器等
  }
}

// 函数组件实例化过程（React 16.8+ Hooks）
function UserCard({ name }) {
  // 1. 状态初始化（只在首次渲染执行）
  const [count, setCount] = useState(0);

  // 2. 副作用（每次渲染后执行）
  useEffect(() => {
    console.log('组件已挂载');

    // 清理函数（卸载时执行）
    return () => {
      console.log('组件将卸载');
    };
  }, []); // 空依赖数组：只在挂载/卸载时执行

  // 3. 渲染
  return <div>{name}</div>;
}
```

---

## 6. 组件设计模式

### 6.1 复合组件模式

复合组件是一种将组件内部状态逻辑封装在高层级组件中，让子组件通过隐式 API 通信的设计模式。

```jsx
// 复合组件：折叠面板
function Accordion({ children, defaultIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  // 通过 Context 共享状态
  return (
    <AccordionContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

// AccordionContext 提供者和上下文
const AccordionContext = React.createContext();

function AccordionItem({ children, index }) {
  // 从上下文获取状态
  const context = useContext(AccordionContext);
  const isActive = context.activeIndex === index;

  return (
    <div className={`accordion-item ${isActive ? 'active' : ''}`}>
      {children}
    </div>
  );
}

function AccordionHeader({ children }) {
  const { activeIndex, setActiveIndex } = useContext(AccordionContext);
  // 获取当前 item 的 index（通过 DOM 层级关系）
  const index = /* 计算当前索引 */;

  return (
    <div
      className="accordion-header"
      onClick={() => setActiveIndex(index)}
    >
      {children}
    </div>
  );
}

function AccordionContent({ children }) {
  const { activeIndex } = useContext(AccordionContext);
  const index = /* 计算当前索引 */;

  return (
    <div className={`accordion-content ${activeIndex === index ? 'open' : ''}`}>
      {children}
    </div>
  );
}

// 使用方式
function App() {
  return (
    <Accordion defaultIndex={0}>
      <AccordionItem>
        <AccordionHeader>第一项</AccordionHeader>
        <AccordionContent>这是第一项的内容</AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionHeader>第二项</AccordionHeader>
        <AccordionContent>这是第二项的内容</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### 6.2 Render Props 模式

Render Props 是一种通过 prop 传递函数来复用组件逻辑的模式。

```jsx
// Render Props：鼠标追踪器
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e) {
      setPosition({ x: e.clientX, y: e.clientY });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 调用 render prop 并传递数据
  return render(position);
}

// 使用方式
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <div>
          鼠标位置：({x}, {y})
        </div>
      )}
    />
  );

  // 或者使用 children 作为 render prop
  // <MouseTracker>
  //   {({ x, y }) => <div>鼠标位置：({x}, {y})</div>}
  // </MouseTracker>
}

// 进阶：实现数据获取的 Render Props
function DataFetcher({ url, render }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return render({ data, loading, error });
}

// 使用
function UserList() {
  return (
    <DataFetcher
      url="/api/users"
      render={({ data, loading, error }) => {
        if (loading) return <div>加载中...</div>;
        if (error) return <div>错误：{error.message}</div>;
        return (
          <ul>
            {data.map(user => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        );
      }}
    />
  );
}
```

### 6.3 高阶组件（HOC）模式

高阶组件是接受组件并返回新组件的函数，用于复用组件逻辑。

```jsx
// HOC 基础结构
function withAuthentication(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
      return <div>请先登录</div>;
    }

    // 传递额外的 props 给被包装的组件
    return <WrappedComponent {...props} user={user} />;
  };
}

// 使用装饰器语法（需要 babel-plugin-proposal-decorators）
// @withAuthentication
// class ProtectedPage extends React.Component {}

// 或者普通用法
function App() {
  const ProtectedDashboard = withAuthentication(Dashboard);
  return <ProtectedDashboard />;
}

// 进阶 HOC：日志记录
function withLogger(WrappedComponent) {
  return function LoggerWrapper(props) {
    useEffect(() => {
      console.log('组件已挂载:', WrappedComponent.name);
      return () => console.log('组件将卸载:', WrappedComponent.name);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// 进阶 HOC：数据获取
function withDataFetching(WrappedComponent, fetchFn) {
  return function DataFetcher(props) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      async function fetchData() {
        try {
          const result = await fetchFn(props);
          setData(result);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, [props]);

    // 传递额外 props
    return (
      <WrappedComponent
        {...props}
        data={data}
        loading={loading}
        error={error}
      />
    );
  };
}

// 使用数据获取 HOC
function UserProfile({ userId, data, loading, error }) {
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误</div>;

  return <div>{data.name}</div>;
}

// 获取 HOC 包装后的组件
const UserProfileWithData = withDataFetching(
  UserProfile,
  (props) => fetch(`/api/users/${props.userId}`).then(r => r.json())
);

// 使用
function App() {
  return <UserProfileWithData userId={123} />;
}
```

### 6.4 受控组件与非受控组件

```jsx
// 受控组件：表单数据由 React 控制
function ControlledInput() {
  const [value, setValue] = useState('');

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

// 受控组件：选择框
function ControlledSelect() {
  const [selected, setSelected] = useState('apple');

  return (
    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
      <option value="apple">苹果</option>
      <option value="banana">香蕉</option>
      <option value="orange">橙子</option>
    </select>
  );
}

// 受控组件：复选框
function ControlledCheckbox() {
  const [checked, setChecked] = useState(false);

  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      同意条款
    </label>
  );
}

// 非受控组件：使用 ref 直接访问 DOM
function UncontrolledInput() {
  const inputRef = useRef(null);

  function handleSubmit() {
    // 直接获取 DOM 元素的值
    const value = inputRef.current.value;
    console.log('提交的值:', value);
  }

  return (
    <div>
      <input ref={inputRef} type="text" defaultValue="默认值" />
      {/* 使用 defaultValue 设置初始值 */}
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
}

// 非受控组件：文件上传
function UncontrolledFileInput() {
  const fileRef = useRef(null);

  function handleSubmit() {
    const file = fileRef.current.files[0];
    console.log('选择的文件:', file);
  }

  return (
    <div>
      <input ref={fileRef} type="file" />
      <button onClick={handleSubmit}>上传</button>
    </div>
  );
}

// 受控 vs 非受控对比
function Comparison() {
  // 受控组件优点：
  // - 实时验证
  // - 条件禁用提交按钮
  // - 实时格式化输入
  const [name, setName] = useState('');
  const isValid = name.length >= 2;

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button disabled={!isValid}>提交</button>
      {/* 提交按钮根据输入状态禁用 */}
    </div>
  );
}
```

---

## 7. 实战案例

### 7.1 完整计数器组件

```jsx
import React, { useState, useCallback } from 'react';

// 带步进控制的计数器
function StepCounter() {
  // 状态定义
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  // 使用 useCallback 优化回调函数
  const increment = useCallback(() => {
    setCount(prev => prev + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount(prev => prev - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div className="counter">
      {/* 步进控制 */}
      <div className="step-control">
        <label>步进值：</label>
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          min="1"
          max="100"
        />
      </div>

      {/* 数值显示 */}
      <div className="display">
        <button onClick={decrement}>-</button>
        <span className="count">{count}</span>
        <button onClick={increment}>+</button>
      </div>

      {/* 重置按钮 */}
      <button onClick={reset} className="reset">
        重置
      </button>

      {/* 历史记录 */}
      <History currentCount={count} />
    </div>
  );
}

// 历史记录组件（使用 usePrevious 获取上一个值）
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

function History({ currentCount }) {
  const previousCount = usePrevious(currentCount);
  const direction = currentCount > previousCount ? '↑' : currentCount < previousCount ? '↓' : '→';

  return (
    <div className="history">
      <p>当前：{currentCount}</p>
      <p>上次：{previousCount}</p>
      <p>变化：{direction}</p>
    </div>
  );
}
```

### 7.2 表单验证组件

```jsx
import React, { useState, useCallback } from 'react';

// 验证规则类型定义
interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

// 内置验证规则工厂
const validators = {
  required: (message = '此字段必填') => ({
    validate: (value) => value.trim().length > 0,
    message
  }),
  minLength: (length: number) => ({
    validate: (value) => value.length >= length,
    message: `至少需要 ${length} 个字符`
  }),
  maxLength: (length: number) => ({
    validate: (value) => value.length <= length,
    message: `最多 ${length} 个字符`
  }),
  email: () => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: '请输入有效的邮箱地址'
  }),
  pattern: (regex: RegExp, message: string) => ({
    validate: (value) => regex.test(value),
    message
  })
};

// 表单字段组件
function FormField({
  label,
  name,
  value,
  onChange,
  rules = [],
  error
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

// 表单组件
function ValidatedForm() {
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 验证规则配置
  const validationRules = {
    username: [validators.required(), validators.minLength(3), validators.maxLength(20)],
    email: [validators.required(), validators.email()],
    password: [
      validators.required(),
      validators.minLength(8),
      validators.pattern(/[A-Z]/, '密码必须包含大写字母'),
      validators.pattern(/[0-9]/, '密码必须包含数字')
    ]
  };

  // 验证单个字段
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name] || [];
    for (const rule of rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return null;
  }, []);

  // 处理输入变化
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    // 如果字段已被访问过，实时验证
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // 处理字段失焦
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // 验证所有字段
  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(values).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [values, validateField]);

  // 处理表单提交
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (validateAll()) {
      console.log('表单数据:', values);
      // 提交表单...
    }
  }, [values, validateAll]);

  return (
    <form onSubmit={handleSubmit} className="validated-form">
      <FormField
        label="用户名"
        name="username"
        value={values.username}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.username && errors.username}
      />

      <FormField
        label="邮箱"
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email}
      />

      <FormField
        label="密码"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
      />

      <button type="submit">提交</button>
    </form>
  );
}
```

### 7.3 动态列表组件

```jsx
import React, { useState, useCallback, useMemo } from 'react';

// 列表项组件（使用 React.memo 避免不必要的重渲染）
const ListItem = React.memo(function ListItem({ item, onDelete, onToggle }) {
  console.log(`渲染列表项: ${item.id}`);

  return (
    <div className={`list-item ${item.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
      />
      <span className="item-text">{item.text}</span>
      <button onClick={() => onDelete(item.id)}>删除</button>
    </div>
  );
});

// 带分页的动态列表
function PaginatedList() {
  const [items, setItems] = useState([
    { id: 1, text: '学习 React', completed: false },
    { id: 2, text: '学习 TypeScript', completed: true },
    { id: 3, text: '完成项目', completed: false }
  ]);

  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 添加新项
  const addItem = useCallback(() => {
    if (!newItemText.trim()) return;

    const newItem = {
      id: Date.now(),
      text: newItemText.trim(),
      completed: false
    };

    setItems(prev => [...prev, newItem]);
    setNewItemText('');
  }, [newItemText]);

  // 删除项
  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // 切换完成状态
  const toggleItem = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  }, []);

  // 过滤后的列表（使用 useMemo 缓存）
  const filteredItems = useMemo(() => {
    console.log('过滤列表...');
    switch (filter) {
      case 'active':
        return items.filter(item => !item.completed);
      case 'completed':
        return items.filter(item => item.completed);
      default:
        return items;
    }
  }, [items, filter]);

  // 分页计算
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // 重置页码当过滤改变时
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="paginated-list">
      {/* 添加新项 */}
      <div className="add-item">
        <input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="添加新项..."
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem}>添加</button>
      </div>

      {/* 过滤选项 */}
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          进行中
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          已完成
        </button>
      </div>

      {/* 列表统计 */}
      <div className="stats">
        共 {filteredItems.length} 项，
        {filteredItems.filter(i => i.completed).length} 已完成
      </div>

      {/* 列表 */}
      <div className="list">
        {paginatedItems.map(item => (
          <ListItem
            key={item.id}
            item={item}
            onDelete={deleteItem}
            onToggle={toggleItem}
          />
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            上一页
          </button>
          <span>第 {currentPage} / {totalPages} 页</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 8. 常见面试题

### 8.1 JSX 相关面试题

**问题1：JSX 和 HTML 有什么区别？**

答案：
- JSX 是 JavaScript 的语法扩展，HTML 是标记语言
- JSX 中 class 必须写成 className
- JSX 中 style 必须使用对象格式 `{{ color: 'red' }}`
- JSX 中所有标签必须闭合（自闭合或配对闭合）
- JSX 中事件处理使用 camelCase（如 onClick 而非 onclick）
- JSX 中的表达式用 `{}` 包裹，而非引号
- JSX 在编译时会转换为 `React.createElement()` 调用

**问题2：为什么 React 使用 className 而不是 class？**

答案：因为 `class` 是 JavaScript 的保留关键字，JSX 编译成 JavaScript 后会与 JavaScript 的 class 声明混淆。因此 React 使用 `className` 作为替代。

**问题3：JSX 中的 `{}` 和 `{{}}` 有什么区别？**

答案：
- `{}` 用于包裹 JavaScript 表达式：`{variable}`, `{1 + 1}`, `{array.map(...)}`
- `{{}}` 用于内联样式，是对象字面量：`style={{ color: 'red' }}`
- 外层 `{}` 表示 JSX 表达式语法，内层 `{}` 是 JavaScript 对象

---

### 8.2 组件与 Props 相关面试题

**问题1：Props 和 State 的区别是什么？**

答案：
| 特性 | Props | State |
|------|-------|-------|
| 来源 | 父组件传入 | 组件自身管理 |
| 修改方式 | 只读，不能修改 | 通过 setState 修改 |
| 作用 | 传递数据给子组件 | 管理组件内部数据 |
| 更新触发 | 父组件重新渲染 | 调用 setState |
| 作用范围 | 组件间通信 | 单个组件内部 |

**问题2：为什么 props 是只读的？**

答案：React 推崇单向数据流（Unidirectional Data Flow），数据从父组件流向子组件。如果子组件可以直接修改 props，会导致数据流混乱，难以追踪数据变化和调试。保持 props 只读确保了数据流向的可预测性。

**问题3：如何给组件传递函数类型的 props？**

答案：
```jsx
// 父组件定义回调函数
function Parent() {
  const handleClick = (data) => {
    console.log('子组件传来数据:', data);
  };

  return <Child onAction={handleClick} />;
}

// 子组件接收并调用
function Child({ onAction }) {
  return <button onClick={() => onAction('hello')}>点击</button>;
}
```

**问题4：defaultProps 和 propTypes 的作用是什么？**

答案：
- `defaultProps`：为 props 提供默认值
- `propTypes`：声明 props 的类型和必填性，进行运行时类型检查

```jsx
function Button({ text, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled}>{text}</button>;
}

// 设置默认值
Button.defaultProps = {
  text: '默认按钮',
  disabled: false
};

// 类型检查（React 15.5 以前使用 PropTypes）
Button.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

// React 16+ 推荐使用 TypeScript/JSDoc 进行类型检查
```

---

### 8.3 事件处理相关面试题

**问题1：React 中的事件和原生 DOM 事件有什么区别？**

答案：
- React 使用合成事件（SyntheticEvent），是原生事件的跨浏览器包装
- React 17 以前，所有事件都绑定到根节点 document 上（事件委托）
- React 17 开始，事件绑定到渲染的 DOM 根节点上
- `e.stopPropagation()` 和 `e.preventDefault()` 在两者中都有效
- React 事件池可以复用事件对象，提高性能

**问题2：事件处理函数中的 this 指向问题如何解决？**

答案：类组件中有三种方式解决 this 绑定问题：

```jsx
// 方式1：在构造函数中使用 bind
class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log(this);
  }
}

// 方式2：使用类属性箭头函数
class App extends React.Component {
  handleClick = () => {
    console.log(this);
  };
}

// 方式3：在 JSX 中使用箭头函数（不推荐，每次渲染创建新函数）
class App extends React.Component {
  handleClick() {
    console.log(this);
  }
  render() {
    return <button onClick={() => this.handleClick()}>点击</button>;
  }
}

// 函数组件中不存在 this 问题
function App() {
  const handleClick = () => {
    // 无需处理 this
  };
  return <button onClick={handleClick}>点击</button>;
}
```

**问题3：什么是事件委托？React 17 有什么变化？**

答案：
- 事件委托：将子元素的事件监听器绑定到父元素上，减少事件监听器数量
- React 16：所有事件绑定到 `document` 上
- React 17：事件绑定到渲染的根节点 `root` 上
- React 17 的变化使得多个 React 版本可以在同一页面共存

---

### 8.4 组件设计相关面试题

**问题1：什么是纯组件（Pure Component）？**

答案：纯组件是 `React.PureComponent` 的实例，它自动实现了 `shouldComponentUpdate` 方法，对 props 和 state 进行浅比较来决定是否重新渲染。

```jsx
// 普通组件：任何 props 变化都会重新渲染
class RegularComponent extends React.Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// 纯组件：props 没变化时不重新渲染
class PureComponentDemo extends React.PureComponent {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// 函数组件使用 React.memo 实现相同效果
const MemoizedComponent = React.memo(function(props) {
  return <div>{props.name}</div>;
});

// React.memo 支持自定义比较函数
const CustomMemo = React.memo(
  function(props) {
    return <div>{props.name}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示 props 相等，不重新渲染
    return prevProps.name === nextProps.name;
  }
);
```

**问题2：如何在父组件中调用子组件的方法？**

答案：使用 `forwardRef` 和 `useImperativeHandle`：

```jsx
// 子组件暴露方法
const Child = forwardRef((props, ref) => {
  const inputRef = useRef();

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    getValue: () => inputRef.current.value,
    clear: () => { inputRef.current.value = ''; }
  }));

  return <input ref={inputRef} />;
});

// 父组件调用子组件方法
function Parent() {
  const childRef = useRef();

  const handleClick = () => {
    childRef.current.focus();
    console.log(childRef.current.getValue());
  };

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={handleClick}>操作子组件</button>
    </div>
  );
}
```

---

### 8.5 性能优化相关面试题

**问题1：如何避免不必要的组件重渲染？**

答案：
1. 使用 `React.memo` 包装子组件
2. 使用 `useCallback` 缓存回调函数
3. 使用 `useMemo` 缓存计算结果
4. 使用 `useState` 的函数式更新避免依赖
5. 将组件拆分为更小的粒度
6. 使用 `key` 时避免使用数组索引

```jsx
// 问题：每次渲染都创建新函数
function Parent() {
  return <Child onClick={() => console.log('click')} />;
}

// 解决：使用 useCallback 缓存函数
function Parent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return <Child onClick={handleClick} />;
}

// 问题：每次渲染都创建新对象
function Parent() {
  return <Child config={{ method: 'POST' }} />;
}

// 解决：使用 useMemo 缓存对象
function Parent() {
  const config = useMemo(() => ({ method: 'POST' }), []);
  return <Child config={config} />;
}
```

**问题2：React.memo、useMemo、useCallback 的区别？**

答案：
- `React.memo`：高阶组件，包装整个组件，避免相同 props 下的重渲染
- `useMemo`：Hook，缓存计算结果，避免重复计算
- `useCallback`：Hook，缓存函数引用，配合 `React.memo` 使用

---

### 8.6 综合应用面试题

**问题1：实现一个可复用的表单输入组件**

答案：
```jsx
// 设计思路：
// 1. 支持多种输入类型（text, email, password 等）
// 2. 内置验证逻辑
// 3. 支持自定义验证规则
// 4. 提供错误提示
// 5. 支持必填标记

function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  rules = [],
  required = false,
  error
}) {
  return (
    <div className="form-input">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

// 使用示例
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  return (
    <form>
      <FormInput
        label="姓名"
        name="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        error={errors.name}
      />
      <FormInput
        label="邮箱"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        rules={[{ validate: validateEmail, message: '邮箱格式不正确' }]}
        required
        error={errors.email}
      />
    </form>
  );
}
```

**问题2：React 的单向数据流是什么？为什么这样设计？**

答案：
- 单向数据流：数据从父组件通过 props 流向子组件，子组件不能直接修改父组件的数据
- 数据变化必须通过回调函数由父组件处理
- 这种设计使得数据变化可追踪、易调试

```
父组件（状态所有者）
    ↓ props 传递数据
    ↓ 回调函数传递修改方法
子组件（展示数据，触发修改）
```

好处：
1. 数据变化路径清晰，容易调试
2. 组件可复用，相同的组件可以展示不同数据
3. 便于实现时间旅行调试（Redux DevTools）
4. 降低应用复杂度，避免数据同步混乱

---

## 附录：React 18+ 新特性速查

```jsx
// React 18 自动批处理
function handleClick() {
  // 所有 setState 合并为一次渲染
  setCount(c => c + 1);
  setFlag(f => !f);
  setName('new name');
}

// React 18 useId - 生成唯一 ID
function InputWithLabel() {
  const id = useId(); // 生成稳定的唯一 ID
  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// React 18 useTransition - 标记非紧急更新
function Search() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleChange(e) {
    setQuery(e.target.value);
    // 标记为非紧急更新
    startTransition(() => {
      setResults(search(e.target.value));
    });
  }
}

// React 18 useDeferredValue - 延迟值更新
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  // deferredQuery 会延迟更新，允许 UI 先响应
  return <SlowList text={deferredQuery} />;
}

// React 18 StrictMode（开发环境额外检查）
// - 组件会双重渲染
// - 检测不安全的生命周期
// - 检测意外副作用
// - 检测过时的 API 使用
```
