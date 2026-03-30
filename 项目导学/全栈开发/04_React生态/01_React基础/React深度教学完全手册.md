# React深度教学完全手册（超详细版）

## 目录

1. [React核心原理深度解析](#1-react核心原理深度解析)
2. [React Fiber架构详解](#2-react-fiber架构详解)
3. [React Hooks原理与最佳实践](#3-react-hooks原理与最佳实践)
4. [React并发特性深度解析](#4-react并发特性深度解析)
5. [React性能优化终极指南](#5-react性能优化终极指南)
6. [React设计模式与架构实战](#6-react设计模式与架构实战)

---

## 1. React核心原理深度解析

### 1.1 React设计哲学

#### 声明式编程范式

```
命令式编程 vs 声明式编程

命令式编程（Imperative）：
- 关注"如何做"（How to do）
- 需要手动操作DOM
- 代码更复杂，难以维护

示例：
const button = document.getElementById('myButton');
button.addEventListener('click', function() {
    const counter = document.getElementById('counter');
    const count = parseInt(counter.textContent);
    counter.textContent = count + 1;
});

声明式编程（Declarative）：
- 关注"做什么"（What to do）
- 描述UI应该是什么样子
- React自动处理DOM更新

示例：
function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>
                增加
            </button>
        </div>
    );
}
```

#### 组件化思想

```
组件化开发的核心概念

1. 组件定义
   - UI + 逻辑 + 样式 的封装单元
   - 可复用、可组合、可维护

2. 组件分类

   按职责分类：
   ├── 展示组件（Presentational Components）
   │   ├── 只关心UI外观
   │   ├── 不依赖Redux/Store
   │   ├── 通过props接收数据和回调
   │   └── 示例：Button、Card、List
   │
   └── 容器组件（Container Components）
       ├── 关心数据如何工作
       ├── 提供数据和行为
       ├── 调用Redux actions
       └── 示例：UserListContainer、TodoListContainer

   按状态分类：
   ├── 有状态组件（Stateful Components）
   │   ├── 管理自己的state
   │   ├── 包含业务逻辑
   │   └── 示例：Form、Modal
   │
   └── 无状态组件（Stateless Components）
       ├── 不管理state
       ├── 纯函数组件
       └── 示例：Button、Icon

3. 组件组合原则

   单一职责原则：
   - 每个组件只做一件事
   - 如果组件太大，拆分成更小的组件

   开闭原则：
   - 对扩展开放，对修改关闭
   - 通过props扩展功能

   接口隔离原则：
   - 不应该依赖不需要的props
   - 拆分大的props接口
```

#### Virtual DOM原理

```javascript
/**
 * Virtual DOM深度解析
 *
 * 什么是Virtual DOM？
 * - JavaScript对象表示的DOM树
 * - 轻量级、可快速创建和比较
 * - 平台无关的抽象层
 */

// 1. Virtual DOM对象结构
const virtualDOM = {
    type: 'div',           // 元素类型
    key: null,             // 用于diff的key
    ref: null,             // 引用
    props: {               // 属性对象
        className: 'container',
        id: 'app',
        children: [        // 子元素
            {
                type: 'h1',
                props: {
                    children: 'Hello World'
                }
            },
            {
                type: 'p',
                props: {
                    children: '这是一段文字'
                }
            }
        ]
    }
};

// 2. JSX编译过程
// JSX代码
const element = (
    <div className="container">
        <h1>Hello World</h1>
    </div>
);

// 编译后的代码
const element = React.createElement(
    'div',
    { className: 'container' },
    React.createElement('h1', null, 'Hello World')
);

// 3. createElement函数实现
function createElement(type, config, ...children) {
    const props = {};

    // 处理config
    if (config != null) {
        for (const propName in config) {
            if (propName !== 'key' && propName !== 'ref') {
                props[propName] = config[propName];
            }
        }
    }

    // 处理children
    props.children = children.map(child => {
        // 如果是文本节点，包装成对象
        if (typeof child === 'string' || typeof child === 'number') {
            return {
                type: 'TEXT_ELEMENT',
                props: {
                    nodeValue: child,
                    children: []
                }
            };
        }
        return child;
    });

    return {
        type,
        props,
        key: config?.key ?? null,
        ref: config?.ref ?? null,
    };
}

// 4. Fiber节点结构（React 16+）
function createFiber(element, parent) {
    return {
        type: element.type,           // 元素类型
        key: element.key,             // key
        props: element.props,         // props
        stateNode: null,              // DOM节点或组件实例

        // Fiber树结构
        return: parent,               // 父节点
        child: null,                  // 第一个子节点
        sibling: null,                // 下一个兄弟节点

        // 状态和副作用
        effectTag: null,              // 操作类型（PLACEMENT, UPDATE, DELETION）
        alternate: null,              // 指向另一个fiber（current或workInProgress）

        // Hooks链表（函数组件）
        memoizedState: null,          // hooks链表头
        updateQueue: null,            // 更新队列
    };
}

// 5. Diff算法原理
/**
 * Diff算法的三大策略
 *
 * 1. Tree Diff（树层级比较）
 *    - 只对同一层级节点进行比较
 *    - 不跨层级移动节点
 *    - 时间复杂度 O(n)
 *
 * 2. Component Diff（组件比较）
 *    - 同类型组件：继续比较virtual DOM tree
 *    - 不同类型组件：直接替换整个组件
 *
 * 3. Element Diff（元素比较）
 *    - 使用key标识节点
 *    - INSERT：插入新节点
 *    - MOVE：移动节点位置
 *    - REMOVE：删除节点
 */

// 6. Reconciliation（协调）过程
function reconcileChildren(workInProgress, elements) {
    let index = 0;
    let oldFiber = workInProgress.alternate?.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber = null;

        // 比较oldFiber和element
        const sameType = oldFiber && element && oldFiber.type === element.type;

        if (sameType) {
            // 更新节点
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                stateNode: oldFiber.stateNode,
                return: workInProgress,
                alternate: oldFiber,
                effectTag: 'UPDATE',
            };
        }

        if (element && !sameType) {
            // 新增节点
            newFiber = {
                type: element.type,
                props: element.props,
                stateNode: null,
                return: workInProgress,
                alternate: null,
                effectTag: 'PLACEMENT',
            };
        }

        if (oldFiber && !sameType) {
            // 删除节点
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        // 构建Fiber树
        if (index === 0) {
            workInProgress.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}
```

### 1.2 React渲染流程

```javascript
/**
 * React完整渲染流程解析
 *
 * 渲染流程图：
 *
 * JSX → createElement → Virtual DOM
 *                           ↓
 *                      render阶段
 *                           ↓
 *                      Fiber树构建
 *                           ↓
 *                      diff算法
 *                           ↓
 *                      commit阶段
 *                           ↓
 *                       DOM更新
 */

// 1. Render阶段（可中断）
function performUnitOfWork(fiber) {
    // 1.1 执行当前fiber的工作
    if (fiber.type instanceof Function) {
        // 函数组件：执行函数，获取children
        const Component = fiber.type;
        const props = fiber.props;
        const children = [Component(props)];
        reconcileChildren(fiber, children);
    } else {
        // 原生组件：创建DOM节点，处理children
        if (!fiber.stateNode) {
            fiber.stateNode = createDom(fiber);
        }
        reconcileChildren(fiber, fiber.props.children);
    }

    // 1.2 返回下一个工作单元
    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.return;
    }

    return null;
}

// 2. Commit阶段（不可中断）
function commitRoot() {
    // 2.1 处理删除
    deletions.forEach(commitWork);

    // 2.2 处理更新和插入
    commitWork(workInProgressRoot.child);

    // 2.3 保存当前Fiber树
    currentRoot = workInProgressRoot;
    workInProgressRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    const parentFiber = fiber.return;

    // 找到最近的DOM父节点
    while (!parentFiber.stateNode) {
        parentFiber = parentFiber.return;
    }

    const parentDom = parentFiber.stateNode;

    // 根据effectTag执行操作
    switch (fiber.effectTag) {
        case 'PLACEMENT':
            if (fiber.stateNode) {
                parentDom.appendChild(fiber.stateNode);
            }
            break;

        case 'UPDATE':
            if (fiber.stateNode) {
                updateDom(
                    fiber.stateNode,
                    fiber.alternate.props,
                    fiber.props
                );
            }
            break;

        case 'DELETION':
            if (fiber.stateNode) {
                parentDom.removeChild(fiber.stateNode);
            }
            break;
    }

    // 递归处理子节点和兄弟节点
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

// 3. DOM更新函数
function updateDom(dom, prevProps, nextProps) {
    // 3.1 删除旧属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(name => !(name in nextProps))
        .forEach(name => {
            dom[name] = '';
        });

    // 3.2 设置新属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name];
        });

    // 3.3 删除旧事件
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(name => !(name in nextProps) || isNew(prevProps, nextProps)(name))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.removeEventListener(eventType, prevProps[name]);
        });

    // 3.4 添加新事件
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, nextProps[name]);
        });
}

// 辅助函数
function isEvent(key) {
    return key.startsWith('on');
}

function isProperty(key) {
    return key !== 'children' && !isEvent(key);
}

function isNew(prev, next) {
    return function(key) {
        return prev[key] !== next[key];
    };
}

// 4. Scheduler（调度器）
/**
 * 时间切片（Time Slicing）
 *
 * 问题：
 * - 当组件树很大时，同步渲染会阻塞主线程
 * - 导致动画卡顿、输入无响应
 *
 * 解决方案：
 * - 将大任务拆分成小任务
 * - 使用requestIdleCallback在浏览器空闲时执行
 * - 每个小任务执行完检查是否需要让出主线程
 */

function workLoop(deadline) {
    let shouldYield = false;

    // 执行工作单元，直到时间用完或工作完成
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

        // 检查是否需要让出主线程
        shouldYield = deadline.timeRemaining() < 1;
    }

    // 如果还有工作，继续调度
    if (nextUnitOfWork) {
        requestIdleCallback(workLoop);
    } else if (workInProgressRoot) {
        // 工作完成，提交更新
        commitRoot();
    }
}

requestIdleCallback(workLoop);

// 5. 优先级调度（React并发模式）
/**
 * Lane优先级模型
 *
 * Lanes是React 18引入的优先级模型
 * 使用31位二进制表示优先级
 *
 * 优先级分类：
 * - Discrete事件（点击、输入）：最高优先级
 * - Continuous事件（拖拽、滚动）：高优先级
 * - Default事件（数据获取）：普通优先级
 * - Idle事件（预加载）：最低优先级
 */

const SyncLane = 0b0000000000000000000000000000001;  // 同步优先级
const InputContinuousHydrationLane = 0b0000000000000000000000000000010;
const InputContinuousLane = 0b0000000000000000000000000000100;
const DefaultHydrationLane = 0b0000000000000000000000000001000;
const DefaultLane = 0b0000000000000000000000000010000;
const TransitionHydrationLane = 0b0000000000000000000000000100000;
const TransitionLane = 0b0000000000000000000000001000000;
const RetryLane = 0b0000000000000000000000010000000;
const IdleHydrationLane = 0b0000000000000000000000100000000;
const IdleLane = 0b0000000000000000000001000000000;

// 优先级比较
function includesSomeLane(a, b) {
    return (a & b) !== NoLanes;
}

function mergeLanes(a, b) {
    return a | b;
}
```

### 1.3 React合成事件系统

```javascript
/**
 * React合成事件（SyntheticEvent）系统详解
 *
 * 为什么需要合成事件？
 * 1. 浏览器兼容性：统一不同浏览器的事件对象
 * 2. 性能优化：事件委托到根节点
 * 3. 跨平台：支持不同平台的事件系统
 */

// 1. 事件委托机制
/**
 * React不会为每个元素单独添加事件监听器
 * 而是将所有事件委托到根节点（document或root容器）
 *
 * 优势：
 * - 减少内存占用（不需要为每个元素添加监听器）
 * - 动态元素也能响应事件（新添加的元素自动拥有事件处理）
 * - 统一管理（便于优先级调度和批量更新）
 */

// React 17之前：委托到document
// React 17之后：委托到root容器

// 2. 事件池机制
/**
 * SyntheticEvent对象池
 *
 * 为了性能，React使用对象池复用事件对象
 * 事件处理函数执行完后，事件对象会被回收
 */

class SyntheticEvent {
    constructor(nativeEvent) {
        this.nativeEvent = nativeEvent;
        this.type = nativeEvent.type;
        this.target = nativeEvent.target;
        this.currentTarget = null;

        // 复制原生事件属性
        this.bubbles = nativeEvent.bubbles;
        this.cancelable = nativeEvent.cancelable;
        this.defaultPrevented = nativeEvent.defaultPrevented;
        this.eventPhase = nativeEvent.eventPhase;
        this.isTrusted = nativeEvent.isTrusted;
        this.timeStamp = nativeEvent.timeStamp;
    }

    // 阻止默认行为
    preventDefault() {
        this.defaultPrevented = true;
        this.nativeEvent.preventDefault();
    }

    // 阻止冒泡
    stopPropagation() {
        this.nativeEvent.stopPropagation();
    }

    // 持久化事件对象（避免被回收）
    persist() {
        this.isPersistent = true;
    }

    // 判断是否是持久化
    isPersistent() {
        return this.isPersistent;
    }
}

// 3. 事件批处理
/**
 * React会自动批处理事件处理函数中的多个setState
 *
 * 批处理优势：
 * - 减少不必要的渲染
 * - 提升性能
 * - 避免中间状态闪烁
 */

class Counter extends React.Component {
    state = { count: 0 };

    handleClick = () => {
        // 这三次setState会被批处理，只触发一次渲染
        this.setState({ count: this.state.count + 1 });
        this.setState({ count: this.state.count + 1 });
        this.setState({ count: this.state.count + 1 });

        console.log(this.state.count);  // 输出：3（批处理后的最终结果）
    };

    render() {
        return (
            <button onClick={this.handleClick}>
                Count: {this.state.count}
            </button>
        );
    }
}

// 4. 自动批处理（React 18）
/**
 * React 18的自动批处理（Automatic Batching）
 *
 * 在React 18之前，批处理只在React事件处理函数中生效
 * 在Promise、setTimeout、原生事件中不会批处理
 *
 * React 18使用createRoot，所有更新都会自动批处理
 */

// React 17
const container = document.getElementById('root');
ReactDOM.render(<App />, container);

// 在Promise中，不会批处理
function handleClick() {
    Promise.resolve().then(() => {
        this.setState({ count: this.state.count + 1 });  // 渲染1次
        this.setState({ count: this.state.count + 1 });  // 渲染2次
    });
}

// React 18
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);

// 在Promise中，也会批处理
function handleClick() {
    Promise.resolve().then(() => {
        this.setState({ count: this.state.count + 1 });  // 只渲染1次
        this.setState({ count: this.state.count + 1 });
    });
}

// 5. 事件优先级
/**
 * 不同类型的事件有不同的优先级
 *
 * 离散事件（Discrete Events）：
 * - click、keydown、focusin等
 * - 最高优先级，需要立即响应
 * - 同步执行，不可中断
 *
 * 连续事件（Continuous Events）：
 * - drag、mousemove、scroll等
 * - 较高优先级
 * - 可以被离散事件打断
 *
 * 其他事件（Other Events）：
 * - load、error等
 * - 普通优先级
 */

// 事件优先级示例
function handleClick(e) {
    // 点击事件：高优先级
    console.log('点击事件触发');

    // 启动一个低优先级更新
    startTransition(() => {
        setState({ list: largeList });  // 低优先级更新
    });
}

// 6. 原生事件 vs 合成事件
class MyComponent extends React.Component {
    componentDidMount() {
        // 原生事件监听
        document.addEventListener('click', this.handleNativeClick);

        // 合成事件监听
        // 在JSX中：<button onClick={this.handleSyntheticClick}>
    }

    handleNativeClick = (e) => {
        // 原生事件对象
        console.log(e);  // MouseEvent
        console.log(e.target);  // 触发事件的元素
        console.log(e.currentTarget);  // 绑定事件的元素（document）
    };

    handleSyntheticClick = (e) => {
        // 合成事件对象
        console.log(e);  // SyntheticEvent
        console.log(e.nativeEvent);  // 原生事件对象
        console.log(e.target);  // 触发事件的元素
        console.log(e.currentTarget);  // 绑定事件的元素（button）
    };

    render() {
        return (
            <button onClick={this.handleSyntheticClick}>
                点击我
            </button>
        );
    }
}

// 7. 事件冒泡和捕获
function EventPropagationExample() {
    return (
        <div
            onClick={() => console.log('Div clicked (冒泡)')}
            onClickCapture={() => console.log('Div clicked (捕获)')}
        >
            <button
                onClick={() => console.log('Button clicked (冒泡)')}
                onClickCapture={() => console.log('Button clicked (捕获)')}
            >
                点击我
            </button>
        </div>
    );
}

// 点击按钮，输出顺序：
// 1. Div clicked (捕获)
// 2. Button clicked (捕获)
// 3. Button clicked (冒泡)
// 4. Div clicked (冒泡)
```

---

## 2. React Fiber架构详解

### 2.1 Fiber架构设计理念

```javascript
/**
 * Fiber架构的诞生背景
 *
 * React 15的问题：
 * 1. 同步递归渲染：大组件树会导致主线程长时间阻塞
 * 2. 无法中断：一旦开始渲染，必须完成才能停止
 * 3. 优先级问题：高优先级更新无法打断低优先级更新
 * 4. 动画卡顿：主线程阻塞导致动画丢帧
 *
 * React 16的解决方案：Fiber架构
 * 1. 可中断渲染：将渲染工作拆分成小单元
 * 2. 优先级调度：不同更新有不同优先级
 * 3. 时间切片：利用浏览器空闲时间执行工作
 * 4. 渐进式渲染：可以暂停、恢复、中止渲染
 */

// Fiber节点的完整结构
const fiberNode = {
    // ========== 基础信息 ==========
    tag: WorkTag,                    // Fiber类型
    key: null | string,              // React元素的key
    elementType: any,                // React元素的类型
    type: any,                       // 异步组件resolved后返回的组件类型
    stateNode: any,                  // DOM节点或组件实例

    // ========== Fiber树结构 ==========
    return: Fiber | null,            // 父节点
    child: Fiber | null,             // 第一个子节点
    sibling: Fiber | null,           // 下一个兄弟节点
    index: number,                   // 在父节点children中的索引

    // ========== 引用 ==========
    ref: Ref,                        // ref对象或回调函数

    // ========== Props和State ==========
    pendingProps: any,               // 新的props
    memoizedProps: any,              // 上次渲染的props
    updateQueue: UpdateQueue,        // 更新队列
    memoizedState: any,              // 上次渲染的state
    dependencies: Dependencies | null, // 依赖（context、事件等）

    // ========== 副作用 ==========
    flags: Flags,                    // 副作用标记（原effectTag）
    subtreeFlags: Flags,             // 子树副作用标记
    deletions: Array<Fiber> | null,  // 要删除的子Fiber
    lanes: Lanes,                    // 优先级
    childLanes: Lanes,               // 子树优先级

    // ========== 备用节点 ==========
    alternate: Fiber | null,         // 指向另一个fiber（current或workInProgress）
};

// Fiber类型（WorkTag）
const WorkTag = {
    FunctionComponent: 0,            // 函数组件
    ClassComponent: 1,               // 类组件
    IndeterminateComponent: 2,       // 未确定类型的组件
    HostRoot: 3,                     // 根节点（Fiber树的根）
    HostPortal: 4,                   // Portal
    HostComponent: 5,                // 原生DOM组件
    HostText: 6,                     // 文本节点
    Fragment: 7,                     // Fragment
    Mode: 8,                         // StrictMode等
    ContextConsumer: 9,              // Context消费者
    ContextProvider: 10,             // Context提供者
    ForwardRef: 11,                  // forwardRef
    Profiler: 12,                    // Profiler
    SuspenseComponent: 13,           // Suspense
    MemoComponent: 14,               // React.memo
    SimpleMemoComponent: 15,         // 简单的React.memo
    LazyComponent: 16,               // React.lazy
};

// 副作用标记（Flags）
const Flags = {
    NoFlags: 0b0000000000000000000000000000000,
    PerformedWork: 0b0000000000000000000000000000001,
    Placement: 0b0000000000000000000000000000010,        // 插入
    Update: 0b0000000000000000000000000000100,           // 更新
    Deletion: 0b0000000000000000000000000001000,        // 删除
    ChildDeletion: 0b0000000000000000000000000010000,   // 子节点删除
    ContentReset: 0b0000000000000000000000000100000,
    Callback: 0b0000000000000000000000001000000,
    DidCapture: 0b0000000000000000000000010000000,
    Ref: 0b0000000000000000000000100000000,
    Snapshot: 0b0000000000000000000001000000000,
    Passive: 0b0000000000000000000010000000000,          // useEffect
    Hydrating: 0b0000000000000000000100000000000,
};
```

### 2.2 Fiber树的构建过程

```javascript
/**
 * Fiber树构建完整流程
 *
 * 双缓存技术：
 * - current树：当前屏幕显示的内容
 * - workInProgress树：正在内存中构建的新树
 * - 构建完成后，workInProgress树变成current树
 */

// 1. 创建Fiber根节点
function createFiberRoot(containerInfo, tag, hydrate) {
    const root = new FiberRootNode(containerInfo, tag, hydrate);

    // 创建HostRoot Fiber
    const uninitializedFiber = createHostRootFiber(tag);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;

    // 初始化updateQueue
    initializeUpdateQueue(uninitializedFiber);

    return root;
}

// 2. Fiber根节点结构
const fiberRoot = {
    tag: RootTag,                    // ConcurrentRoot或LegacyRoot
    containerInfo: any,              // DOM容器
    pendingChildren: any,            // 子节点
    current: Fiber,                  // 指向HostRoot Fiber

    pingCache: WeakMap | Map,        // 用于Suspense
    finishedWork: Fiber | null,      // 已完成的工作
    timeoutHandle: number | null,    // setTimeout的ID

    context: Object | null,          // 旧的context API
    pendingContext: Object | null,

    // ========== 优先级相关 ==========
    expiredLanes: Lanes,             // 过期的lanes
    mutableReadLanes: Lanes,         // 可变读取lanes
    writableLanes: Lanes,            // 可写lanes
};

// 3. 开始渲染
function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
    checkForNestedUpdates();

    // 标记root有待处理的更新
    markRootUpdated(root, lane, eventTime);

    // 确保root被调度
    ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root, eventTime) {
    // 获取优先级最高的lane
    const nextLanes = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes);

    if (nextLanes === NoLanes) {
        return;
    }

    // 获取调度优先级
    const schedulerPriorityLevel = lanesToEventPriority(nextLanes);

    // 调度回调函数
    if (newCallbackPriority === SyncLanePriority) {
        // 同步优先级，立即执行
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    } else {
        // 异步优先级，根据优先级调度
        const schedulerPriorityLevel = lanesToEventPriority(nextLanes);

        scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
    }
}

// 4. 并发工作循环
function performConcurrentWorkOnRoot(root, didTimeout) {
    // 设置当前优先级
    const originalCallbackPriority = getCurrentUpdatePriority();
    setCurrentUpdatePriority(nextLanes);

    // 重置全局变量
    workInProgressRoot = root;
    workInProgressRootRenderLanes = nextLanes;

    // 如果root没有workInProgress，创建一个
    if (workInProgress === null) {
        workInProgress = createWorkInProgress(root.current, null);
    }

    // ========== Render阶段开始 ==========
    do {
        try {
            workLoopConcurrent();
            break;
        } catch (thrownValue) {
            handleError(root, thrownValue);
        }
    } while (true);

    // ========== Render阶段结束 ==========

    // 检查是否完成
    if (workInProgressRootExitStatus !== RootInProgress) {
        return workInProgressRootExitStatus;
    }

    // 如果被中断，返回一个继续工作的函数
    if (workInProgress !== null) {
        return performConcurrentWorkOnRoot.bind(null, root);
    }

    // ========== Commit阶段开始 ==========
    const finishedWork = root.finishedWork;
    const finishedLanes = root.finishedLanes;

    if (finishedWork === null) {
        return null;
    }

    // 清空
    root.finishedWork = null;
    root.finishedLanes = NoLanes;

    // 提交
    commitRoot(root, finishedWork, finishedLanes);

    return null;
}

// 5. 并发工作循环（可中断）
function workLoopConcurrent() {
    // 执行工作单元，直到时间用完
    while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
    }
}

// 6. 执行单个工作单元
function performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;

    let next = beginWork(current, unitOfWork, subtreeRenderLanes);

    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
        // 如果没有子节点，完成当前节点
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}

// 7. beginWork（开始工作）
function beginWork(current, workInProgress, renderLanes) {
    const updateLanes = workInProgress.lanes;

    // 如果没有更新，跳过
    if (current !== null) {
        const oldProps = current.memoizedProps;
        const newProps = workInProgress.pendingProps;

        if (oldProps === newProps && !hasLegacyContextChanged()) {
            if (!checkScheduledUpdateDidNotBailout(current, workInProgress)) {
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
            }
        }
    }

    // 根据Fiber类型执行不同的工作
    switch (workInProgress.tag) {
        case FunctionComponent: {
            const Component = workInProgress.type;
            const unresolvedProps = workInProgress.pendingProps;
            const resolvedProps = resolveDefaultProps(Component, unresolvedProps);

            return updateFunctionComponent(
                current,
                workInProgress,
                Component,
                resolvedProps,
                renderLanes
            );
        }

        case ClassComponent: {
            const Component = workInProgress.type;
            const unresolvedProps = workInProgress.pendingProps;
            const resolvedProps = resolveDefaultProps(Component, unresolvedProps);

            return updateClassComponent(
                current,
                workInProgress,
                Component,
                resolvedProps,
                renderLanes
            );
        }

        case HostComponent:
            return updateHostComponent(current, workInProgress, renderLanes);

        case HostText:
            return updateHostText(current, workInProgress);

        case SuspenseComponent:
            return updateSuspenseComponent(current, workInProgress, renderLanes);

        // ... 其他类型
    }
}

// 8. completeUnitOfWork（完成工作单元）
function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;

    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;

        // 完成当前节点的工作
        let next = completeWork(current, completedWork, subtreeRenderLanes);

        if (next !== null) {
            workInProgress = next;
            return;
        }

        // 收集副作用
        if (returnFiber !== null) {
            if (returnFiber.firstEffect === null) {
                returnFiber.firstEffect = completedWork.firstEffect;
            }

            if (completedWork.lastEffect !== null) {
                if (returnFiber.lastEffect !== null) {
                    returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
                }
                returnFiber.lastEffect = completedWork.lastEffect;
            }

            if (completedWork.flags > PerformedWork) {
                if (returnFiber.lastEffect !== null) {
                    returnFiber.lastEffect.nextEffect = completedWork;
                } else {
                    returnFiber.firstEffect = completedWork;
                }
                returnFiber.lastEffect = completedWork;
            }
        }

        // 处理兄弟节点
        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }

        // 返回父节点
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null);

    // 整个工作完成
    if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
    }
}

// 9. completeWork（完成工作）
function completeWork(current, workInProgress, renderLanes) {
    const newProps = workInProgress.pendingProps;

    switch (workInProgress.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
            bubbleProperties(workInProgress);
            return null;

        case ClassComponent: {
            const Component = workInProgress.type;
            if (isLegacyContextProvider(Component)) {
                popLegacyContext(workInProgress);
            }
            bubbleProperties(workInProgress);
            return null;
        }

        case HostComponent: {
            popHostContext(workInProgress);
            const rootContainerInstance = getRootHostContainer();
            const type = workInProgress.type;

            if (current !== null && workInProgress.stateNode != null) {
                // 更新DOM节点
                updateHostComponent(
                    current,
                    workInProgress,
                    type,
                    newProps,
                    rootContainerInstance
                );
            } else {
                // 创建DOM节点
                const instance = createInstance(
                    type,
                    newProps,
                    rootContainerInstance,
                    currentHostContext,
                    workInProgress
                );

                appendAllChildren(instance, workInProgress, false, false);
                workInProgress.stateNode = instance;

                if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance, currentHostContext)) {
                    markUpdate(workInProgress);
                }
            }

            bubbleProperties(workInProgress);
            return null;
        }

        case HostText: {
            const newText = newProps;

            if (current && workInProgress.stateNode != null) {
                const oldText = current.memoizedProps;
                updateHostText(current, workInProgress, oldText, newText);
            } else {
                const instance = createTextInstance(
                    newText,
                    rootContainerInstance,
                    currentHostContext,
                    workInProgress
                );
                workInProgress.stateNode = instance;
            }

            bubbleProperties(workInProgress);
            return null;
        }
    }
}
```

### 2.3 Fiber树的Commit阶段

```javascript
/**
 * Commit阶段详解
 *
 * Commit阶段是不可中断的，分为三个子阶段：
 * 1. Before Mutation阶段：读取DOM之前
 * 2. Mutation阶段：修改DOM
 * 3. Layout阶段：修改DOM之后
 */

function commitRoot(root, finishedWork, lanes) {
    root.finishedWork = null;
    root.finishedLanes = NoLanes;

    // 设置优先级
    const previousPriority = getCurrentUpdatePriority();
    const priorityLevel = lanesToEventPriority(finishedLanes);
    setCurrentUpdatePriority(priorityLevel);

    // ========== Before Mutation阶段 ==========
    commitBeforeMutationEffects(finishedWork);

    // ========== Mutation阶段 ==========
    commitMutationEffects(finishedWork, root, lanes);

    // 切换current指针
    root.current = finishedWork;

    // ========== Layout阶段 ==========
    commitLayoutEffects(finishedWork, root, lanes);

    // 恢复优先级
    setCurrentUpdatePriority(previousPriority);
}

// 1. Before Mutation阶段
function commitBeforeMutationEffects(root, firstChild) {
    nextEffect = firstChild;
    commitBeforeMutationEffects_begin();
}

function commitBeforeMutationEffects_begin() {
    while (nextEffect !== null) {
        const fiber = nextEffect;

        // 递归处理子节点
        const child = fiber.child;
        if (child !== null) {
            commitBeforeMutationEffects_begin();
        }

        // 处理当前节点
        commitBeforeMutationEffects_complete(fiber);
    }
}

function commitBeforeMutationEffects_complete(fiber) {
    const flags = fiber.flags;

    if (flags & Snapshot) {
        // Class组件：执行getSnapshotBeforeUpdate
        const current = fiber.alternate;
        commitBeforeMutationLifeCycles(fiber, current);
    }

    if (flags & Passive) {
        // 调度useEffect
        scheduleCallback(NormalPriority, () => {
            flushPassiveEffects();
            return null;
        });
    }

    nextEffect = fiber.sibling;
}

// 2. Mutation阶段
function commitMutationEffects(root, firstChild, lanes) {
    nextEffect = firstChild;
    commitMutationEffects_begin(root, lanes);
}

function commitMutationEffects_begin(root, lanes) {
    while (nextEffect !== null) {
        const fiber = nextEffect;

        // 递归处理子节点
        const child = fiber.child;
        if (child !== null) {
            commitMutationEffects_begin(root, lanes);
        }

        // 处理当前节点
        commitMutationEffects_complete(fiber, root, lanes);
    }
}

function commitMutationEffects_complete(fiber, root, lanes) {
    const flags = fiber.flags;

    if (flags & ContentReset) {
        commitResetTextContent(fiber);
    }

    if (flags & Ref) {
        const current = fiber.alternate;
        safelyDetachRef(current, fiber);
    }

    if (flags & Placement) {
        // 插入DOM节点
        commitPlacement(fiber);
    }

    if (flags & Update) {
        // 更新DOM节点
        const current = fiber.alternate;
        commitWork(current, fiber);
    }

    if (flags & Deletion) {
        // 删除DOM节点
        commitDeletion(fiber, root, lanes);
    }

    nextEffect = fiber.sibling;
}

// 3. Layout阶段
function commitLayoutEffects(root, firstChild, lanes) {
    nextEffect = firstChild;
    commitLayoutEffects_begin(root, lanes);
}

function commitLayoutEffects_begin(root, lanes) {
    while (nextEffect !== null) {
        const fiber = nextEffect;

        // 递归处理子节点
        const child = fiber.child;
        if (child !== null) {
            commitLayoutEffects_begin(root, lanes);
        }

        // 处理当前节点
        commitLayoutEffects_complete(fiber, root, lanes);
    }
}

function commitLayoutEffects_complete(fiber, root, lanes) {
    const flags = fiber.flags;

    if (flags & Update) {
        const current = fiber.alternate;

        // Class组件：执行componentDidMount/componentDidUpdate
        commitLifeCycles(fiber, current);
    }

    if (flags & Ref) {
        // 设置ref
        commitAttachRef(fiber);
    }

    nextEffect = fiber.sibling;
}
```

---

## 3. React Hooks原理与最佳实践

### 3.1 Hooks核心概念

```javascript
/**
 * React Hooks设计理念
 *
 * Hooks解决的问题：
 * 1. 类组件逻辑复用困难：HOC和Render Props会导致嵌套地狱
 * 2. 类组件复杂度高：生命周期逻辑分散在不同时机
 * 3. 类组件性能问题：this绑定、难以优化
 *
 * Hooks的优势：
 * 1. 逻辑复用：自定义Hook实现逻辑复用
 * 2. 关注点分离：相关逻辑放在一起
 * 3. 更好的性能：避免不必要的嵌套
 */

// Hooks使用规则
// 规则1：只在最顶层使用Hooks
// ❌ 错误：在条件语句中使用Hook
function Example() {
    const [count, setCount] = useState(0);
    if (count > 0) {
        const [name, setName] = useState('');  // 违反规则
    }
}

// ✅ 正确：将所有Hook调用放在组件顶部
function Example() {
    const [count, setCount] = useState(0);
    const [name, setName] = useState('');
    // ...
}

// 规则2：只在React函数组件中使用Hooks
// ❌ 错误：在普通函数中使用Hook
function useCustomHook() {
    const [data, setData] = useState(null);  // 违反规则
}

// ✅ 正确：自定义Hook以use开头
function useCustomHook() {
    const [data, setData] = useState(null);
    return data;
}
```

### 3.2 useState与useReducer

```javascript
/**
 * useState原理深度解析
 *
 * useState实现原理：
 * 1. 首次渲染：为当前Hook创建hook对象，加入链表
 * 2. 状态更新：创建update对象，加入队列
 * 3. 触发重渲染：计算新状态，返回给组件
 */

// useState简化实现
let firstWorkInProgressHook = null;  // 链表头
let workInProgressHook = null;       // 当前Hook

function useState(initialState) {
    // 查找是否有已存在的Hook
    let hook = workInProgressHook;

    if (hook === null) {
        // 首次渲染：创建新Hook
        hook = {
            memoizedState: initialState,  // 保存的状态
            queue: {                     // 更新队列
                pending: null
            },
            next: null                   // 指向下一个Hook
        };

        // 加入链表
        if (firstWorkInProgressHook === null) {
            firstWorkInProgressHook = hook;
        } else {
            workInProgressHook.next = hook;
        }
    }

    // 保存对当前Hook的引用
    let baseState = hook.memoizedState;

    // 处理更新队列
    if (hook.queue.pending !== null) {
        let firstUpdate = hook.queue.pending.next;

        do {
            const action = firstUpdate.action;
            baseState = typeof action === 'function'
                ? action(baseState)
                : action;
            firstUpdate = firstUpdate.next;
        } while (firstUpdate !== hook.queue.pending.next);

        // 清空队列
        hook.queue.pending = null;
    }

    // 更新状态
    hook.memoizedState = baseState;

    // 返回setter函数
    const setState = (action) => {
        const reducer = (state, action) =>
            typeof action === 'function' ? action(state) : action;

        // 创建update对象
        const update = {
            action: reducer,
            next: null
        };

        // 加入队列
        if (hook.queue.pending === null) {
            update.next = update;
        } else {
            update.next = hook.queue.pending.next;
            hook.queue.pending.next = update;
        }
        hook.queue.pending = update;

        // 触发更新
        scheduleWork();
    };

    workInProgressHook = hook.next;
    return [baseState, setState];
}

// useReducer实现
function useReducer(reducer, initialArg, init) {
    const initialState = init !== undefined
        ? init(initialArg)
        : initialArg;

    const [state, dispatch] = useState(initialState);

    const dispatchWithAction = (action) => {
        const nextState = reducer(state, action);
        // 复用useState的更新逻辑
        // ...
    };

    return [state, dispatchWithAction];
}

// 状态更新模式示例
function Counter() {
    const [count, setCount] = useState(0);

    // 函数式更新：基于之前的状态计算新状态
    const increment = () => {
        setCount(prevCount => prevCount + 1);
    };

    // 对象式更新：批量更新多个状态
    const updateMultiple = () => {
        setCount(prev => prev + 1);
        setName('new name');  // 会被批处理
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={increment}>+1</button>
        </div>
    );
}

// useReducer复杂状态管理示例
const initialState = {
    user: null,
    loading: false,
    error: null
};

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, user: action.payload };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
}

function UserProfile() {
    const [state, dispatch] = useReducer(reducer, initialState);

    const fetchUser = async (userId) => {
        dispatch({ type: 'FETCH_START' });
        try {
            const user = await fetchUserAPI(userId);
            dispatch({ type: 'FETCH_SUCCESS', payload: user });
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
        }
    };

    return (
        <div>
            {state.loading && <Loading />}
            {state.error && <Error message={state.error} />}
            {state.user && <UserCard user={state.user} />}
        </div>
    );
}
```

### 3.3 useEffect深度解析

```javascript
/**
 * useEffect执行时机
 *
 * React 18之前的执行顺序：
 * 1. render渲染
 * 2. DOM更新
 * 3. useEffect执行（异步）
 *
 * React 18之后的执行顺序：
 * 1. render渲染
 * 2. DOM更新
 * 3. Layout阶段（同步）
 * 4. useEffect执行（异步，可分批）
 */

// useEffect简化实现
function useEffect(create, deps) {
    const hook = getCurrentHook();

    // 比较依赖是否变化
    if (areHookInputsEqual(hook.memoizedState, [create, deps])) {
        return;
    }

    // 保存旧effect的清理函数
    if (hook.memoizedState !== null) {
        hook.memoizedState.destroy();
    }

    // 创建新effect
    const effect = {
        create,
        deps,
        destroy: create()
    };

    hook.memoizedState = effect;
}

// useLayoutEffect实现（同步执行）
function useLayoutEffect(create, deps) {
    // useLayoutEffect在Layout阶段同步执行
    // DOM更新后立即执行，浏览器不会绘制
    const hook = getCurrentHook();

    if (areHookInputsEqual(hook.memoizedState, [create, deps])) {
        return;
    }

    // 先执行旧effect的清理
    if (hook.memoizedState !== null) {
        hook.memoizedState.destroy();
    }

    // 创建新effect
    const effect = {
        create,
        deps,
        destroy: create()
    };

    hook.memoizedState = effect;
}

// 常见useEffect使用模式

// 模式1：组件挂载时执行一次
useEffect(() => {
    // 相当于componentDidMount
    const subscription = subscribeToData(id, data => {
        setData(data);
    });

    // 返回清理函数
    return () => {
        subscription.unsubscribe();
    };
}, []);  // 空依赖数组

// 模式2：依赖变化时执行
useEffect(() => {
    fetchData(userId)
        .then(setData)
        .catch(setError);
}, [userId]);  // userId变化时重新执行

// 模式3：条件执行effect
useEffect(() => {
    if (isOnline) {
        connect();
        return () => disconnect();
    }
}, [isOnline]);  // isOnline为truthy时才执行

// 模式4：使用ref避免闭包陷阱
function useInterval(callback, delay) {
    const savedCallback = useRef(callback);

    // 每次render后更新ref
    useLayoutEffect(() => {
        savedCallback.current = callback;
    });

    // 设置interval
    useLayoutEffect(() => {
        if (delay === null) return;

        const tick = () => {
            savedCallback.current();  // 使用最新版本的callback
        };

        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

// 模式5：async effect
useEffect(() => {
    let cancelled = false;

    async function fetchData() {
        const data = await api.getData();
        if (!cancelled) {
            setData(data);
        }
    }

    fetchData();

    return () => {
        cancelled = true;
    };
}, []);

// useEffect依赖优化
function Component({ userId }) {
    // ❌ 不好的做法：依赖整个对象
    const [config, setConfig] = useState({ page: 1, limit: 10 });
    useEffect(() => {
        fetchData(userId, config);  // 每次render config都是新对象
    }, [userId, config]);           // 导致effect频繁执行

    // ✅ 好的做法：使用useMemo或拆分依赖
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetchData(userId, { page, limit });
    }, [userId, page]);  // 只依赖变化的page

    // ✅ 更好的做法：使用useCallback
    const fetchConfig = useMemo(
        () => ({ page, limit }),
        [page, limit]
    );
    useEffect(() => {
        fetchData(userId, fetchConfig);
    }, [userId, fetchConfig]);
}
```

### 3.4 useRef与useCallback/useMemo

```javascript
/**
 * useRef使用场景
 *
 * useRef的用途：
 * 1. 访问DOM元素
 * 2. 保存可变值（不会触发重新渲染）
 * 3. 存储上一次的props/state
 */

// useRef实现
function useRef(initialValue) {
    const hook = getCurrentHook();
    if (hook.memoizedState === null) {
        hook.memoizedState = {
            current: initialValue
        };
    }
    return hook.memoizedState;
}

// useRef常见用法

// 1. 访问DOM
function TextInput() {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current.focus();  // 自动聚焦
    }, []);

    return (
        <input ref={inputRef} type="text" />
    );
}

// 2. 保存可变值
function Timer() {
    const [count, setCount] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCount(c => c + 1);
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, []);

    const stopTimer = () => {
        clearInterval(intervalRef.current);
    };

    return (
        <div>
            <span>{count}</span>
            <button onClick={stopTimer}>停止</button>
        </div>
    );
}

// 3. 存储上一次的props/state
function usePrevious(value) {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;  // render后更新ref
    }, [value]);

    return ref.current;  // 返回上一次的value
}

function Counter() {
    const [count, setCount] = useState(0);
    const previousCount = usePrevious(count);

    return (
        <div>
            <p>现在: {count}, 上次: {previousCount}</p>
            <button onClick={() => setCount(c => c + 1)}>+1</button>
        </div>
    );
}

// useCallback实现
function useCallback(callback, deps) {
    return useMemo(() => callback, deps);
}

// useMemo实现
function useMemo(create, deps) {
    const hook = getCurrentHook();

    if (hook.memoizedState !== null) {
        const prevDeps = hook.memoizedState[1];

        if (areHookInputsEqual(prevDeps, deps)) {
            return hook.memoizedState[0];
        }
    }

    const newValue = create();
    hook.memoizedState = [newValue, deps];
    return newValue;
}

// useCallback和useMemo使用场景

// useCallback：防止函数组件不必要的重新创建
function Parent({ id }) {
    const [count, setCount] = useState(0);

    // ❌ 每次render都创建新函数，导致Child不必要的重渲染
    const handleClick = () => {
        console.log(id);
    };
    <Child onClick={handleClick} />;

    // ✅ 使用useCallback，handleClick引用保持稳定
    const handleClick = useCallback(() => {
        console.log(id);
    }, [id]);
    <Child onClick={handleClick} />;
}

// useMemo：缓存计算结果
function ExpensiveList({ items, filter }) {
    // ❌ 每次render都重新计算
    const filteredItems = items.filter(item =>
        item.name.includes(filter)
    );

    // ✅ 使用useMemo，只有items或filter变化时才重新计算
    const filteredItems = useMemo(() =>
        items.filter(item => item.name.includes(filter)),
        [items, filter]
    );

    return filteredItems.map(item => <Item key={item.id} {...item} />);
}

// useMemo用于稳定对象引用
function Component({ userId }) {
    // ❌ 每次render都创建新对象，导致依赖它的useEffect频繁执行
    const config = { userId, timestamp: Date.now() };

    // ✅ 使用useMemo，只有userId变化时才创建新对象
    const config = useMemo(() => ({
        userId,
        timestamp: Date.now()
    }), [userId]);
}

// 性能优化示例：useMemo + useCallback组合
function ProductList({ category }) {
    const [search, setSearch] = useState('');

    // 缓存过滤函数
    const filterProducts = useCallback((products) => {
        return products.filter(p =>
            p.category === category &&
            p.name.includes(search)
        );
    }, [category, search]);

    // 缓存排序函数
    const sortProducts = useCallback((products) => {
        return [...products].sort((a, b) => b.price - a.price);
    }, []);

    // 缓存最终结果
    const displayedProducts = useMemo(() => {
        return sortProducts(filterProducts(allProducts));
    }, [allProducts, filterProducts, sortProducts]);

    return (
        <List
            products={displayedProducts}
            onSearch={setSearch}
        />
    );
}
```

### 3.5 useContext与useReducer组合

```javascript
/**
 * useContext深度解析
 *
 * Context工作原理：
 * 1. React.createContext创建Context对象
 * 2. Provider在组件树中提供值
 * 3. useContext读取最近的Provider的值
 * 4. Provider值变化时，消费组件重新渲染
 */

// createContext实现
function createContext(defaultValue) {
    const context = {
        Provider: Provider,
        Consumer: Consumer,
        _currentValue: defaultValue,
        _currentValue2: defaultValue
    };

    function Provider({ children, value }) {
        // 保存当前值
        context._currentValue = value;
        return children;
    }

    function Consumer({ children }) {
        // 读取当前值
        return children(context._currentValue);
    }

    return context;
}

// useContext实现
function useContext(Context) {
    const renderPhase = currentlyRenderingFiber;

    // 获取当前值
    let value = Context._currentValue;

    const hook = getCurrentHook();
    if (hook.memoizedState !== null) {
        const prevValue = hook.memoizedState;

        // 比较新旧值
        if (prevValue === value) {
            return value;
        }
    }

    // 保存新值
    hook.memoizedState = value;

    return value;
}

// Context使用模式

// 模式1：简单状态共享
const ThemeContext = createContext('light');

function App() {
    const [theme, setTheme] = useState('light');

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <Toolbar />
        </ThemeContext.Provider>
    );
}

function Toolbar() {
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            当前主题: {theme}
        </button>
    );
}

// 模式2：useReducer + Context组合
// 状态管理Context
const StateContext = createContext(null);
const DispatchContext = createContext(null);

// Provider组件
function StateProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

// 自定义Hook简化使用
function useStateValue() {
    const value = useContext(StateContext);
    if (value === null) {
        throw new Error('useStateValue必须在StateProvider内使用');
    }
    return value;
}

function useDispatch() {
    const dispatch = useContext(DispatchContext);
    if (dispatch === null) {
        throw new Error('useDispatch必须在StateProvider内使用');
    }
    return dispatch;
}

// 使用
function UserProfile() {
    const state = useStateValue();
    const dispatch = useDispatch();

    const updateUser = (name) => {
        dispatch({ type: 'UPDATE_NAME', payload: name });
    };

    return (
        <div>
            <p>用户名: {state.user.name}</p>
            <button onClick={() => updateUser('新名字')}>更新</button>
        </div>
    );
}

// 模式3：Context性能优化
// 问题：Context值变化时，所有消费组件都会重新渲染

// 优化1：拆分Context
const UserContext = createContext(null);
const ThemeContext = createContext(null);

// 使用两个独立的Provider
function App() {
    return (
        <UserContext.Provider value={user}>
            <ThemeContext.Provider value={theme}>
                <Component />
            </ThemeContext.Provider>
        </UserContext.Provider>
    );
}

// 优化2：使用useMemo缓存值
function AppProvider() {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('light');

    // 缓存context值，只在依赖变化时创建新对象
    const contextValue = useMemo(() => ({
        user,
        setUser,
        theme,
        setTheme
    }), [user, theme]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

// 优化3：子组件使用React.memo
const ExpensiveComponent = memo(function ExpensiveComponent() {
    // 这个组件只使用theme，不会因user变化而重渲染
    const { theme } = useContext(ThemeContext);
    return <div className={theme}>内容</div>;
});
```

### 3.6 自定义Hook设计模式

```javascript
/**
 * 自定义Hook最佳实践
 *
 * 原则：
 * 1. 以use开头
 * 2. 提取可复用逻辑
 * 3. 返回有意义的值
 * 4. 处理清理逻辑
 */

// 自定义Hook示例

// 1. 数据获取Hook
function useFetch(url, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                const json = await response.json();

                if (!cancelled) {
                    setData(json);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [url]);

    return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
    const { data: user, loading, error } = useFetch(
        `/api/users/${userId}`
    );

    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <Profile user={user} />;
}

// 2. 订阅Hook
function useSubscription(url, { enabled = true } = {}) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let ws;
        let reconnectTimeout;

        function connect() {
            ws = new WebSocket(url);

            ws.onopen = () => {
                setConnected(true);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                setMessages(prev => [...prev, message]);
            };

            ws.onclose = () => {
                setConnected(false);
                // 自动重连
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        }

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws) {
                ws.close();
            }
        };
    }, [url, enabled]);

    const sendMessage = useCallback((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }, []);

    return { messages, connected, sendMessage };
}

// 3. 本地存储Hook
function useLocalStorage(key, initialValue) {
    // 初始值：优先从localStorage读取，否则使用默认值
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 更新值：同时更新state和localStorage
    const setValue = useCallback((value) => {
        try {
            // 支持函数式更新
            const valueToStore = value instanceof Function
                ? value(storedValue)
                : value;

            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

// 4. 媒体查询Hook
function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);

        function handleChange(e) {
            setMatches(e.matches);
        }

        // 现代浏览器
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            // 旧版浏览器
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [query]);

    return matches;
}

// 使用
function ResponsiveComponent() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

    return (
        <div className={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}>
            {prefersDark ? <DarkModeUI /> : <LightModeUI />}
        </div>
    );
}

// 5. 异步操作状态Hook
function useAsync(asyncFn, dependencies = []) {
    const [state, setState] = useState({
        status: 'idle',  // idle | pending | success | error
        data: null,
        error: null
    });

    const callbackRef = useRef();
    callbackRef.current = asyncFn;

    useEffect(() => {
        if (!asyncFn) return;

        let cancelled = false;

        async function runAsync() {
            setState({ status: 'pending', data: null, error: null });

            try {
                const data = await callbackRef.current();
                if (!cancelled) {
                    setState({ status: 'success', data, error: null });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({ status: 'error', data: null, error });
                }
            }
        }

        runAsync();

        return () => {
            cancelled = true;
        };
    }, dependencies);

    return state;
}

// 6. 窗口尺寸Hook
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }

        window.addEventListener('resize', handleResize);

        // 立即获取初始尺寸
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}
```

---

## 4. React并发特性深度解析

### 4.1 React 18并发渲染原理

```javascript
/**
 * 并发渲染（Concurrent Rendering）核心概念
 *
 * 什么是并发渲染？
 * - React 18引入的新特性
 * - 允许多个状态更新同时进行
 * - 可以中断和恢复渲染工作
 * - 根据优先级调度更新
 *
 * 并发渲染的优势：
 * 1. 更好的用户体验（避免阻塞）
 * 2. 更智能的优先级调度
 * 3. 支持Streaming SSR和Suspense
 */

// 并发模式切换
// React 17（Legacy模式）
const root = ReactDOM.createRoot(container);
root.render(<App />);

// React 18（Concurrent模式）
const root = ReactDOM.createRoot(container);
root.render(<App />);
// 默认就是并发模式！

// 并发渲染的工作原理

/**
 * 时间切片（Time Slicing）
 *
 * 将渲染工作分成多个小单元
 * 每个单元执行完后检查是否需要让出主线程
 */

// 伪代码实现
function workLoopConcurrent() {
    while (workInProgress !== null) {
        // 检查是否需要让出主线程
        if (shouldYield()) {
            // 让出主线程，等待下一个空闲时间继续
            scheduleCallback(Yield, workLoopConcurrent);
            break;
        }

        // 执行一个工作单元
        workInProgress = performUnitOfWork(workInProgress);
    }
}

function shouldYield() {
    // 检查是否还有剩余时间
    return getCurrentLanePriority() === InputContinuousLane
        ? false
        : scheduler.timeRemaining() < 1;
}

/**
 * Lane优先级模型
 *
 * React使用Lane（车道）来表示不同的优先级
 * 使用位运算表示，可以同时存在多个优先级
 */

// Lane类型定义
const SyncLane = 0b0000000000000000000000000000001;           // 同步优先级：点击、输入
const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入：拖拽、滚动
const DefaultLane = 0b0000000000000000000000000010000;       // 默认优先级：数据获取
const TransitionLane = 0b0000000000000000000000001000000;    // 过渡优先级：UI更新
const IdleLane = 0b0000000000000000000001000000000;          // 空闲优先级：预加载

// 优先级判断
function getHighestPriorityLane(lanes) {
    if (lanes & SyncLane) return SyncLane;
    if (lanes & InputContinuousLane) return InputContinuousLane;
    if (lanes & DefaultLane) return DefaultLane;
    if (lanes & TransitionLane) return TransitionLane;
    if (lanes & IdleLane) return IdleLane;
    return NoLane;
}

// Lane合并
function mergeLanes(a, b) {
    return a | b;  // 位运算合并
}

// Lane包含判断
function includesLane(lanes, lane) {
    return (lanes & lane) !== 0;
}
```

### 4.2 startTransition与useTransition

```javascript
/**
 * startTransition
 *
 * 用于标记非紧急更新
 * 允许紧急更新（如用户输入）打断非紧急更新
 */

// startTransition实现
function startTransition(callback) {
    const prevPriority = getCurrentUpdatePriority();

    // 设置为过渡优先级
    setCurrentUpdatePriority(TransitionLane);

    try {
        callback();
    } finally {
        // 恢复之前的优先级
        setCurrentUpdatePriority(prevPriority);
    }
}

// startTransition使用场景

// 场景1：大量数据渲染
function SearchResults({ query }) {
    const [results, setResults] = useState([]);

    const handleSearch = (newQuery) => {
        startTransition(() => {
            // 这个更新被标记为非紧急
            // 即使需要时间，也不会阻塞用户输入
            setQuery(newQuery);
            setResults(search(newQuery));
        });
    };

    return (
        <div>
            <input onChange={e => handleSearch(e.target.value)} />
            <div>{results.map(r => <Result key={r.id} {...r} />)}</div>
        </div>
    );
}

// 场景2：切换Tab
function TabContainer() {
    const [activeTab, setActiveTab] = useState('home');
    const [content, setContent] = useState(null);

    const switchTab = (tab) => {
        startTransition(() => {
            setActiveTab(tab);
            setContent(renderTabContent(tab));
        });
    };

    return (
        <div>
            <Tabs active={activeTab} onChange={switchTab} />
            <Suspense fallback={<Loading />}>
                {content}
            </Suspense>
        </div>
    );
}

// useTransition Hook
function useTransition() {
    const [isPending, startTransition] = useState(false);

    const transition = (callback) => {
        startTransition(true);
        callback();
        // React自动在过渡完成后设置isPending为false
    };

    return [isPending, transition];
}

// useTransition使用示例
function ProfileRouter() {
    const [tab, setTab] = useState('posts');
    const [isPending, startTransition] = useTransition();

    const handleTabChange = (newTab) => {
        startTransition(() => {
            setTab(newTab);
        });
    };

    return (
        <div>
            <TabBar>
                <Tab
                    active={tab === 'posts'}
                    onClick={() => handleTabChange('posts')}
                >
                    帖子 {isPending && <Spinner />}
                </Tab>
                <Tab
                    active={tab === 'photos'}
                    onClick={() => handleTabChange('photos')}
                >
                    照片
                </Tab>
            </TabBar>
            <Content tab={tab} />
        </div>
    );
}

// isPending状态用于显示加载指示器
function UserSearch() {
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleChange = (e) => {
        startTransition(() => {
            setQuery(e.target.value);
        });
    };

    return (
        <div>
            <input value={query} onChange={handleChange} />
            {isPending && <LoadingSpinner />}
            <Results query={query} />
        </div>
    );
}

// startTransition的限制
function Example() {
    const [count, setCount] = useState(0);

    const handleClick = () => {
        startTransition(() => {
            setCount(c => c + 1);
            console.log('这个console在transition外部执行');
            // ⚠️ setCount是紧急更新，会打断startTransition
        });
    };

    return <button onClick={handleClick}>{count}</button>;
}

// 正确的做法：分离紧急和非紧急更新
function CorrectExample() {
    const [count, setCount] = useState(0);
    const [input, setInput] = useState('');

    const handleClick = () => {
        // 紧急更新：用户点击
        setCount(c => c + 1);
    };

    const handleInputChange = (e) => {
        // 非紧急更新：搜索过滤
        startTransition(() => {
            setInput(e.target.value);
        });
    };

    return (
        <div>
            <button onClick={handleClick}>{count}</button>
            <input onChange={handleInputChange} value={input} />
        </div>
    );
}
```

### 4.3 useDeferredValue

```javascript
/**
 * useDeferredValue
 *
 * 用于延迟更新次要UI
 * 返回一个值的"过期"版本，允许UI保持响应
 */

// useDeferredValue实现
function useDeferredValue<T>(value: T): T {
    const [deferredValue, setDeferredValue] = useState(value);

    useEffect(() => {
        startTransition(() => {
            setDeferredValue(value);
        });
    }, [value]);

    return deferredValue;
}

// useDeferredValue使用场景

// 场景1：搜索输入
function SearchInput() {
    const [query, setQuery] = useState('');
    // deferredQuery是延迟更新的版本
    const deferredQuery = useDeferredValue(query);

    // 即时响应输入
    // 搜索结果可能稍后更新
    return (
        <div>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索..."
            />
            <SearchResults query={deferredQuery} />
        </div>
    );
}

function SearchResults({ query }) {
    const results = useMemo(() => {
        // 复杂的搜索逻辑
        return expensiveSearch(query);
    }, [query]);

    // query变化时，results可能还没更新
    // UI不会卡顿
    return (
        <ul>
            {results.map(r => <li key={r.id}>{r.name}</li>)}
        </ul>
    );
}

// 场景2：列表高亮
function VirtualList({ items, highlight }) {
    const deferredHighlight = useDeferredValue(highlight);

    return (
        <div>
            {items.map(item => (
                <div
                    key={item.id}
                    className={item.id === deferredHighlight ? 'highlight' : ''}
                >
                    {item.content}
                </div>
            ))}
        </div>
    );
}

// useDeferredValue vs useTransition

// useDeferredValue：处理来自父组件的props
function Parent() {
    const [query, setQuery] = useState('');
    return <Child query={query} />;
}

function Child({ query }) {
    // useDeferredValue处理传入的query
    const deferredQuery = useDeferredValue(query);
    return <ExpensiveComponent query={deferredQuery} />;
}

// useTransition：处理组件内部的状态更新
function Search() {
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleChange = (e) => {
        startTransition(() => {
            setQuery(e.target.value);
        });
    };

    return (
        <div>
            <input value={query} onChange={handleChange} />
            {isPending ? <Spinner /> : <Results query={query} />}
        </div>
    );
}

// 什么时候用哪个？
// - 需要显示pending状态 → useTransition
// - 只需要延迟值，不需要pending → useDeferredValue
// - props变化导致重渲染 → useDeferredValue
// - 状态变化导致重渲染 → useTransition
```

### 4.4 Suspense与流式渲染

```javascript
/**
 * Suspense组件
 *
 * 用于在数据加载时显示fallback
 * 支持流式SSR（Streaming SSR）
 */

// Suspense实现原理
function Suspense({ children, fallback }) {
    const [showFallback, setShowFallback] = useState(false);

    // 使用错误边界机制
    // 当子组件抛出Promise时，捕获并显示fallback
    return showFallback ? fallback : children;
}

// Suspense使用示例
function App() {
    return (
        <Suspense fallback={<Loading />}>
            <UserProfile />
        </Suspense>
    );
}

function UserProfile() {
    // 数据获取Hook
    const user = useUser();

    // 当useUser()还在等待时
    // React会抛出Promise，Suspense捕获并显示Loading
    return <div>{user.name}</div>;
}

// Suspense与数据获取库集成
// React Query示例
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <React.Suspense fallback={<PageSkeleton />}>
                <Dashboard />
            </React.Suspense>
        </QueryClientProvider>
    );
}

// SWR + Suspense
function useSWR<Data>(key: string, fetcher: () => Promise<Data>) {
    const { data, error, isLoading } = useSWR(key, fetcher);

    if (isLoading) {
        // 抛出Promise触发Suspense
        throw fetchData(key);
    }

    return data;
}

// 多个Suspense边界
function App() {
    return (
        <div>
            <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar />
            </Suspense>
            <Suspense fallback={<FeedSkeleton />}>
                <Feed />
            </Suspense>
            <Suspense fallback={<RecommendationsSkeleton />}>
                <Recommendations />
            </Suspense>
        </div>
    );
}

// 流式SSR（Streaming SSR）
// server.js
function handler(req, res) {
    // 流式发送HTML
    res.write('<html><body>');

    // 并行发送各个部分
    const stream1 = renderToPipeableStream(<Sidebar />);
    stream1.pipe(res, { end: false });

    const stream2 = renderToPipeableStream(<MainContent />);
    stream2.pipe(res, { end: false });

    res.write('</body></html>');
    res.end();
}

// Next.js 13+ App Router中的Suspense
// app/page.tsx
import { Suspense } from 'react';

async function Dashboard() {
    // 并行数据获取
    const userData = await getUserData();
    const statsData = await getStatsData();

    return (
        <div>
            <UserInfo data={userData} />
            <Stats data={statsData} />
        </div>
    );
}

export default function Page() {
    return (
        <main>
            <h1>Dashboard</h1>
            <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
            </Suspense>
        </main>
    );
}

// use() Hook与Suspense（React 19）
function Profile({ userPromise }) {
    // use()会等待Promise，同时触发Suspense
    const user = use(userPromise);

    return <div>{user.name}</div>;
}

function App() {
    const userPromise = fetchUser();

    return (
        <Suspense fallback={<Loading />}>
            <Profile userPromise={userPromise} />
        </Suspense>
    );
}
```

### 4.5 自动批处理增强

```javascript
/**
 * React 18的自动批处理（Automatic Batching）
 *
 * 之前：只在React事件处理函数中批处理
 * 现在：在所有场景下都会批处理
 */

// React 17
function handleClick() {
    fetch('/api').then(() => {
        // 不在React事件中，不会批处理
        setCount(c => c + 1);
        setFlag(f => !f);  // 会触发两次渲染
    });
}

// React 18
function handleClick() {
    fetch('/api').then(() => {
        // 自动批处理，只触发一次渲染
        setCount(c => c + 1);
        setFlag(f => !f);
    });
}

// flushSync强制同步更新
import { flushSync } from 'react-dom';

function handleClick() {
    // flushSync中的更新会立即执行
    // 不参与批处理
    flushSync(() => {
        setCount(c => c + 1);
    });

    // 这次更新会触发新的渲染
    setFlag(f => !f);
}

// flushSync使用场景
function ImageGallery() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (image) => {
        // 确保状态同步更新
        flushSync(() => {
            setSelectedImage(image);
            setIsModalOpen(true);
        });

        // 现在modal已经打开，可以安全地聚焦
        document.getElementById('modal')?.focus();
    };

    return (
        <div>
            <Gallery images={images} onSelect={openModal} />
            {isModalOpen && <Modal image={selectedImage} />}
        </div>
    );
}

// 批处理边界（React 18+）
// 使用startTransition包裹的更新不会被其他更新打乱
function App() {
    const [count, setCount] = useState(0);
    const [filter, setFilter] = useState('');

    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>
                Count: {count}
            </button>

            <input
                onChange={e => startTransition(() => {
                    setFilter(e.target.value);
                })}
            />

            <ExpensiveList filter={filter} />
        </div>
    );
}
```

---

## 5. React性能优化终极指南

### 5.1 渲染优化基础

```javascript
/**
 * React渲染机制
 *
 * 触发渲染的时机：
 * 1. 组件状态变化（setState）
 * 2. 组件props变化
 * 3. 父组件重渲染
 * 4. Context值变化
 *
 * 避免不必要渲染的方法：
 * 1. React.memo - 缓存组件
 * 2. useMemo - 缓存计算结果
 * 3. useCallback - 缓存函数
 * 4. 状态提升优化 - 避免连锁反应
 */

// React.memo深入理解
// React.memo实现原理
function memo(Component, areEqual) {
    return function MemoizedComponent(props) {
        const ref = useRef();

        // 上一次渲染的props
        const prevProps = ref.current;

        // 比较props是否变化
        if (areHookInputsEqual(prevProps, props)) {
            return prevProps.renderedComponent;
        }

        // props变化，重新渲染
        const renderedComponent = Component(props);
        ref.current = {
            props,
            renderedComponent
        };

        return renderedComponent;
    };
}

// React.memo使用示例
// 基础用法
const MyComponent = memo(function MyComponent({ name, value }) {
    return (
        <div>
            <span>{name}</span>
            <span>{value}</span>
        </div>
    );
});

// 自定义比较函数
const MyComponent = memo(
    function MyComponent({ name, value, onChange }) {
        return (
            <div>
                <span>{name}</span>
                <input value={value} onChange={onChange} />
            </div>
        );
    },
    (prevProps, nextProps) => {
        // 返回true表示props相等，不需要重渲染
        return (
            prevProps.name === nextProps.name &&
            prevProps.value === nextProps.value
            // 忽略onChange的比较
        );
    }
);

// 常见优化场景
// 场景1：列表中的组件
function ItemList({ items, onItemClick }) {
    return (
        <ul>
            {items.map(item => (
                // 每个Item都用memo包裹
                // 只有item本身变化时才重渲染
                <MemoizedItem
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(item.id)}
                />
            ))}
        </ul>
    );
}

const MemoizedItem = memo(function Item({ item, onClick }) {
    return (
        <li onClick={onClick}>
            {item.name} - {item.price}
        </li>
    );
});

// 场景2：传递函数props
function Parent() {
    const [count, setCount] = useState(0);

    // ❌ 每次render都创建新函数，导致MemoizedButton重渲染
    const handleClick = () => {
        console.log('clicked');
    };

    // ✅ 使用useCallback
    const handleClick = useCallback(() => {
        console.log('clicked');
    }, []);

    return <MemoizedButton onClick={handleClick} />;
}

// 场景3：对象和数组props
function Parent() {
    const [count, setCount] = useState(0);

    // ❌ 每次render都创建新对象
    const style = { color: 'red', fontSize: 14 };
    const options = { threshold: 0.5 };

    return <MemoizedComponent style={style} options={options} />;

    // ✅ 使用useMemo
    const style = useMemo(() => ({ color: 'red', fontSize: 14 }), []);
    const options = useMemo(() => ({ threshold: 0.5 }), []);

    return <MemoizedComponent style={style} options={options} />;
}

// React.memo的陷阱
function Counter() {
    const [count, setCount] = useState(0);

    // ⚠️ 这里创建的对象每次render都是新引用
    const config = { incrementBy: 1 };

    return <MemoizedCounter count={count} config={config} />;
}

const MemoizedCounter = memo(Counter, (prev, next) => {
    // 永远返回false，因为config每次都是新对象
    return false;
});

// 正确做法
function Counter() {
    const [count, setCount] = useState(0);
    const [incrementBy, setIncrementBy] = useState(1);

    // 将config的值作为独立的prop传递
    return (
        <MemoizedCounter
            count={count}
            incrementBy={incrementBy}
        />
    );
}

const MemoizedCounter = memo(function Counter({ count, incrementBy }) {
    const config = useMemo(() => ({ incrementBy }), [incrementBy]);
    // ...
});
```

### 5.2 虚拟列表优化

```javascript
/**
 * 虚拟列表（Virtual List / Windowing）
 *
 * 只渲染可见区域的元素
 * 大幅减少DOM节点数量
 * 提升大数据列表的渲染性能
 */

// 虚拟列表核心原理
function VirtualList({ items, itemHeight, containerHeight, renderItem }) {
    const [scrollTop, setScrollTop] = useState(0);

    // 计算可见范围
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    // 渲染缓冲区（上下各多渲染几个item）
    const buffer = 5;
    const visibleStart = Math.max(0, startIndex - buffer);
    const visibleEnd = Math.min(items.length - 1, endIndex + buffer);

    // 可见的items
    const visibleItems = [];
    for (let i = visibleStart; i <= visibleEnd; i++) {
        visibleItems.push({
            index: i,
            item: items[i],
            style: {
                position: 'absolute',
                top: i * itemHeight,
                height: itemHeight
            }
        });
    }

    return (
        <div
            style={{ height: containerHeight, overflow: 'auto' }}
            onScroll={e => setScrollTop(e.target.scrollTop)}
        >
            {/* 占位元素，维持滚动条高度 */}
            <div style={{ height: items.length * itemHeight }}>
                {visibleItems.map(({ index, item, style }) => (
                    <div key={index} style={style}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    );
}

// 使用虚拟列表库（react-window）
import { FixedSizeList, VariableSizeList } from 'react-window';

// 固定高度列表
function FixedHeightList({ items }) {
    return (
        <FixedSizeList
            height={400}           // 容器高度
            width={300}            // 容器宽度
            itemCount={items.length}
            itemSize={50}          // 每项高度
            itemData={items}       // 传递给render的数据
        >
            {Row}
        </FixedSizeList>
    );
}

const Row = ({ index, style, data }) => {
    const item = data[index];
    return (
        <div style={style}>
            {item.name} - {item.description}
        </div>
    );
};

// 动态高度列表
function VariableHeightList({ items }) {
    const getItemSize = (index) => {
        // 根据内容计算高度
        return items[index].isExpanded ? 100 : 50;
    };

    const itemKey = (index) => items[index].id;

    return (
        <VariableSizeList
            height={400}
            width={300}
            itemCount={items.length}
            itemSize={getItemSize}
            itemKey={itemKey}
            itemData={items}
        >
            {VariableRow}
        </VariableSizeList>
    );
}

// 虚拟列表性能优化技巧

// 1. 使用key优化
const Row = memo(function Row({ index, style, data }) {
    return (
        <div style={style}>
            <MemoizedItem item={data[index]} />
        </div>
    );
});

// 2. 避免在render中创建新函数
const Row = memo(function Row({ index, style, data, onItemClick }) {
    const item = data[index];

    // 在组件内部定义handler
    const handleClick = useCallback(() => {
        onItemClick(item.id);
    }, [onItemClick, item.id]);

    return (
        <div style={style} onClick={handleClick}>
            {item.name}
        </div>
    );
});

// 3. 使用外部数据
// 不要在Row组件内部获取数据
const Row = memo(function Row({ index, style, data }) {
    // data已经包含了所有需要的数据
    const item = data[index];

    return <div style={style}>{item.name}</div>;
});
```

### 5.3 代码分割与懒加载

```javascript
/**
 * 代码分割（Code Splitting）
 *
 * 将代码分成多个chunk
 * 按需加载，减少首屏时间
 */

// React.lazy使用
const OtherComponent = React.lazy(() => import('./OtherComponent'));

// Suspense包裹
function MyComponent() {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <OtherComponent />
            </Suspense>
        </div>
    );
}

// 路由级别代码分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
    return (
        <Router>
            <Suspense fallback={<PageSkeleton />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

// 命名导出（解决默认导出的重命名问题）
// MyComponent.js
export const MyComponent = () => <div>Component</div>;
export const HelperComponent = () => <div>Helper</div>;

// 使用
const { MyComponent } = lazy(() => import('./MyComponent'));
const { HelperComponent } = lazy(() => import('./MyComponent'));

// 预加载
function ProductCard({ product }) {
    const [showDetails, setShowDetails] = useState(false);

    const ProductDetails = lazy(() => import('./ProductDetails'));

    return (
        <div>
            <h3>{product.name}</h3>
            <button onClick={() => setShowDetails(true)}>
                查看详情
            </button>

            {showDetails && (
                <Suspense fallback={<Loading />}>
                    <ProductDetails product={product} />
                </Suspense>
            )}
        </div>
    );
}

// 鼠标悬停预加载
const ProductDetails = lazy(() => import('./ProductDetails'));

function ProductCard({ product }) {
    const [showDetails, setShowDetails] = useState(false);

    const handleMouseEnter = () => {
        // 预加载
        import('./ProductDetails');
    };

    return (
        <div onMouseEnter={handleMouseEnter}>
            <h3>{product.name}</h3>
            <button onClick={() => setShowDetails(true)}>
                查看详情
            </button>
        </div>
    );
}

// React.lazy源码解析
function lazy(loader) {
    let promise = null;
    let exportedValue = null;

    return function LazyComponent(props) {
        // 首次加载
        if (exportedValue === null) {
            if (promise === null) {
                promise = loader()
                    .then(module => {
                        exportedValue = module.default;
                    });
            }

            // 抛出Promise触发Suspense
            throw promise;
        }

        return exportedValue(props);
    };
}

// 使用use进行懒加载（React 19）
function ImageGallery() {
    const [imageModule, setImageModule] = useState(null);

    const loadImage = () => {
        // 异步加载模块
        const modulePromise = import('./HeavyImage.js');
        setImageModule({ module: modulePromise });
    };

    return (
        <div>
            <button onClick={loadImage}>加载图片</button>
            {imageModule && (
                <Suspense fallback={<Loading />}>
                    <HeavyImage module={use(imageModule.module)} />
                </Suspense>
            )}
        </div>
    );
}
```

### 5.4 状态管理优化

```javascript
/**
 * 状态管理性能优化
 *
 * 目标：减少不必要的重渲染
 * 方法：拆分状态、选择器模式、范式化状态
 */

// 状态拆分原则
// ❌ 不好的做法：把所有状态放在一起
function BadExample() {
    const [state, setState] = useState({
        user: null,
        posts: [],
        comments: [],
        notifications: [],
        isLoading: false
    });

    // 当posts变化时，comments、notifications等也会重新渲染
}

// ✅ 好的做法：拆分独立的状态
function GoodExample() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 每个状态独立管理，互不影响
}

// Zustand选择器优化
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const useStore = create((set) => ({
    user: null,
    posts: [],
    settings: { theme: 'light', language: 'zh' }
}));

// ❌ 不好的选择器：返回整个对象
function Component() {
    const { user, settings } = useStore();  // 整个store订阅
    // settings变化会导致所有使用这个选择器的地方重渲染
}

// ✅ 好的选择器：使用useShallow
function Component() {
    const user = useStore(state => state.user);
    const settings = useStore(
        useShallow(state => state.settings)  // 浅比较
    );
}

// ✅ 更好的做法：分别获取需要的值
function Component() {
    const theme = useStore(state => state.settings.theme);
    const language = useStore(state => state.settings.language);
}

// Redux Toolkit优化
import { createSlice } from '@reduxjs/toolkit';

const postsSlice = createSlice({
    name: 'posts',
    initialState: { items: [], loading: false },
    reducers: {
        setPosts: (state, action) => {
            state.items = action.payload;
            state.loading = false;
        },
        addPost: (state, action) => {
            state.items.push(action.payload);
        }
    }
});

// 使用createSelector创建记忆化选择器
import { createSelector } from '@reduxjs/toolkit';

const selectPosts = state => state.posts.items;
const selectFilter = state => state.posts.filter;

// 创建记忆化选择器
const selectFilteredPosts = createSelector(
    [selectPosts, selectFilter],
    (posts, filter) => {
        // 只有posts或filter变化时才重新计算
        return posts.filter(post => post.title.includes(filter));
    }
);

function PostList() {
    // 只有filteredPosts变化时才重渲染
    const filteredPosts = useSelector(selectFilteredPosts);

    return (
        <div>
            {filteredPosts.map(post => (
                <PostItem key={post.id} post={post} />
            ))}
        </div>
    );
}

// 范式化状态
// ❌ 嵌套数据结构
const badState = {
    users: [
        { id: 1, name: 'Alice', posts: [1, 2] },
        { id: 2, name: 'Bob', posts: [3] }
    ],
    posts: [
        { id: 1, title: 'Post 1', authorId: 1 },
        { id: 2, title: 'Post 2', authorId: 1 },
        { id: 3, title: 'Post 3', authorId: 2 }
    ]
};

// ✅ 范式化数据结构
const normalizedState = {
    users: {
        byId: {
            1: { id: 1, name: 'Alice', postIds: [1, 2] },
            2: { id: 2, name: 'Bob', postIds: [3] }
        },
        allIds: [1, 2]
    },
    posts: {
        byId: {
            1: { id: 1, title: 'Post 1', authorId: 1 },
            2: { id: 2, title: 'Post 2', authorId: 1 },
            3: { id: 3, title: 'Post 3', authorId: 2 }
        },
        allIds: [1, 2, 3]
    }
};

// 范式化选择器
const selectUserById = (state, userId) =>
    state.users.byId[userId];

const selectPostsByUserId = (state, userId) => {
    const user = selectUserById(state, userId);
    if (!user) return [];
    return user.postIds.map(id => state.posts.byId[id]);
};
```

### 5.5 性能分析工具

```javascript
/**
 * React性能分析
 *
 * 工具：
 * 1. React DevTools Profiler
 * 2. Chrome DevTools Performance
 * 3. why-did-you-render
 */

// React DevTools Profiler使用

// 1. 记录渲染
// - 点击Record按钮
// - 与应用交互
// - 点击Stop按钮

// 2. 分析结果
// - Commit Chart：显示每次提交的时间和组件数
// - Flamegraph：显示组件树和渲染时间
// - Ranked：按渲染时间排序的组件列表

// why-did-you-render配置
import React from 'react';

if (process.env.NODE_ENV === 'development') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');

    whyDidYouRender(React, {
        // 追踪所有组件
        trackAllPureComponents: true,

        // 自定义追踪规则
        logOnDifferentValues: true,

        // 排除某些组件
        exclude: [
            /^SomeComponent$/,
            /^AnotherComponent$/,
        ],
    });
}

// 使用React Profiler组件
function ExpensiveComponent({ data }) {
    return (
        <Profiler
            id="ExpensiveComponent"
            onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
                console.log({
                    id,
                    phase,
                    actualDuration,     // 实际渲染时间
                    baseDuration,      // 如果没有缓存的渲染时间
                    startTime,
                    commitTime
                });

                // 如果渲染时间过长，记录警告
                if (actualDuration > baseDuration * 1.5) {
                    console.warn(`${id}渲染时间过长`);
                }
            }}
        >
            <div>{/* 组件内容 */}</div>
        </Profiler>
    );
}

// 使用Chrome DevTools Performance分析
// 1. 打开Performance面板
// 2. 选择"React measurements"选项
// 3. 录制用户操作
// 4. 分析火焰图

// 常见性能问题识别

// 问题1：大量组件重渲染
// 症状：Flamegraph中大片红色
// 解决：使用React.memo、useMemo、useCallback

// 问题2：大型列表渲染慢
// 症状：列表操作卡顿
// 解决：使用虚拟列表

// 问题3：状态更新连锁反应
// 症状：一次操作触发多次渲染
// 解决：拆分状态、使用useReducer集中管理

// 问题4：Context值频繁变化
// 症状：整个应用重渲染
// 解决：拆分Context、使用useMemo

// 性能优化检查清单
const performanceChecklist = {
    // 组件层面
    componentLevel: [
        '组件是否需要memo？',
        '是否正确使用useMemo/useCallback？',
        '是否有不必要的重渲染？',
        '列表项是否使用key？',
    ],

    // 数据获取层面
    dataFetchingLevel: [
        '是否使用SWR/React Query等库？',
        '是否有请求去重？',
        '是否有缓存？',
        '是否使用虚拟列表？',
    ],

    // 状态管理层面
    stateManagementLevel: [
        '状态是否按职责拆分？',
        '是否使用选择器模式？',
        '是否有范式化状态？',
        '是否避免派生状态？',
    ],

    // 代码分割层面
    codeSplittingLevel: [
        '是否按路由代码分割？',
        '是否按功能代码分割？',
        '是否使用预加载？',
        '动态导入是否正确使用？',
    ]
};
```

---

## 6. React设计模式与架构实战

### 6.1 组件设计模式

```javascript
/**
 * React组件设计模式
 *
 * 核心原则：
 * 1. 单一职责：每个组件只做一件事
 * 2. 开闭原则：对扩展开放，对修改关闭
 * 3. 依赖倒置：依赖抽象而非具体实现
 */

// 模式1：容器组件与展示组件分离
// 展示组件
function UserCard({ user, onFollow, onMessage }) {
    return (
        <div className="user-card">
            <Avatar src={user.avatar} />
            <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.bio}</p>
            </div>
            <div className="actions">
                <button onClick={onFollow}>
                    {user.isFollowing ? '取消关注' : '关注'}
                </button>
                <button onClick={onMessage}>发消息</button>
            </div>
        </div>
    );
}

// 容器组件
function UserCardContainer({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser(userId)
            .then(setUser)
            .finally(() => setLoading(false));
    }, [userId]);

    const handleFollow = async () => {
        await toggleFollow(userId);
        setUser(prev => ({
            ...prev,
            isFollowing: !prev.isFollowing
        }));
    };

    const handleMessage = () => {
        openMessageDialog(userId);
    };

    if (loading) return <UserCardSkeleton />;

    return (
        <UserCard
            user={user}
            onFollow={handleFollow}
            onMessage={handleMessage}
        />
    );
}

// 模式2：受控组件与非受控组件
// 受控组件
function ControlledInput({ value, onChange }) {
    return (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    );
}

// 非受控组件
function UncontrolledInput({ defaultValue, onChange }) {
    const inputRef = useRef();

    const handleChange = () => {
        if (onChange) {
            onChange(inputRef.current.value);
        }
    };

    return (
        <input
            ref={inputRef}
            defaultValue={defaultValue}
            onChange={handleChange}
        />
    );
}

// 组合使用
function SmartInput({ value, onChange }) {
    const [internalValue, setInternalValue] = useState(value);

    // 如果外部传入value，则是受控组件
    const isControlled = value !== undefined;

    const handleChange = (newValue) => {
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    return (
        <input
            value={isControlled ? value : internalValue}
            onChange={e => handleChange(e.target.value)}
        />
    );
}

// 模式3：复合组件模式
// 创建一个可组合的组件系统
function Tabs({ defaultIndex, onChange, children }) {
    const [activeIndex, setActiveIndex] = useState(defaultIndex || 0);

    const contextValue = {
        activeIndex,
        onSelect: (index) => {
            setActiveIndex(index);
            onChange?.(index);
        }
    };

    return (
        <TabsContext.Provider value={contextValue}>
            <div className="tabs">{children}</div>
        </TabsContext.Provider>
    );
}

const TabList = ({ children }) => (
    <div className="tab-list" role="tablist">
        {children}
    </div>
);

const Tab = ({ index, children }) => {
    const { activeIndex, onSelect } = useContext(TabsContext);
    const isActive = activeIndex === index;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(index)}
            className={isActive ? 'active' : ''}
        >
            {children}
        </button>
    );
};

const TabPanel = ({ index, children }) => {
    const { activeIndex } = useContext(TabsContext);

    if (activeIndex !== index) return null;

    return (
        <div role="tabpanel">
            {children}
        </div>
    );
};

// 使用
function App() {
    return (
        <Tabs onChange={index => console.log(index)}>
            <TabList>
                <Tab index={0}>标签1</Tab>
                <Tab index={1}>标签2</Tab>
                <Tab index={2}>标签3</Tab>
            </TabList>
            <TabPanel index={0}>内容1</TabPanel>
            <TabPanel index={1}>内容2</TabPanel>
            <TabPanel index={2}>内容3</TabPanel>
        </Tabs>
    );
}

// 模式4：Render Props模式
// 共享逻辑的可复用方式
function MouseTracker({ render }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return render(position);
}

// 使用
function App() {
    return (
        <MouseTracker
            render={({ x, y }) => (
                <div>
                    鼠标位置: ({x}, {y})
                </div>
            )}
        />
    );
}

// 模式5：HOC（高阶组件）模式
// 装饰器模式在React中的应用
function withAuthentication(Component) {
    return function AuthenticatedComponent(props) {
        const { user, isLoading } = useAuth();

        if (isLoading) {
            return <Loading />;
        }

        if (!user) {
            return <Navigate to="/login" />;
        }

        return <Component {...props} user={user} />;
    };
}

function withLogging(Component) {
    return function LoggedComponent(props) {
        useEffect(() => {
            console.log('Component mounted:', Component.name);
            return () => console.log('Component unmounted:', Component.name);
        }, []);

        return <Component {...props} />;
    };
}

// 使用
const AuthenticatedDashboard = withAuthentication(Dashboard);
const LoggedDashboard = withLogging(AuthenticatedDashboard);

// 组合HOC
const withFeatures = (features) => (Component) => {
    return function FeatureComponent(props) {
        const { user } = useAuth();
        const enabledFeatures = features.filter(f =>
            user.permissions.includes(f)
        );

        return <Component {...props} features={enabledFeatures} />;
    };
};

const enhance = compose(
    withAuthentication,
    withLogging,
    withFeatures(['edit', 'delete'])
);

const EnhancedComponent = enhance(Component);

// 模式6：反向继承（Mixin替代方案）
// 使用组合而非继承
function useIntersectionObserver(options) {
    const [ref, setRef] = useState(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(ref);

        return () => observer.disconnect();
    }, [ref, options]);

    return [setRef, isIntersecting];
}

function LazyImage({ src, placeholder, alt }) {
    const [ref, isIntersecting] = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '50px'
    });
    const [loaded, setLoaded] = useState(false);

    return (
        <div ref={ref}>
            {(!loaded || !isIntersecting) && placeholder}
            {isIntersecting && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setLoaded(true)}
                    style={{ display: loaded ? 'block' : 'none' }}
                />
            )}
        </div>
    );
}
```

### 6.2 状态架构模式

```javascript
/**
 * 状态管理架构设计
 *
 * 分层架构：
 * 1. UI层：组件内部状态
 * 2. 页面层：路由级状态
 * 3. 应用层：全局共享状态
 * 4. 服务层：外部数据
 */

// 分层状态管理示例

// 1. 组件内部状态（useState）
function Counter() {
    const [count, setCount] = useState(0);
    // 组件级私有状态
}

// 2. 页面级状态（Context + useReducer）
const PageContext = createContext(null);

function UserPage({ userId }) {
    const [state, dispatch] = useReducer(pageReducer, {
        activeTab: 'posts',
        filter: '',
        sortBy: 'date'
    });

    return (
        <PageContext.Provider value={{ state, dispatch }}>
            <UserHeader />
            <UserTabs />
            <UserContent />
        </PageContext.Provider>
    );
}

// 3. 应用级状态（Zustand/Redux）
// Zustand store
const useStore = create((set, get) => ({
    user: null,
    theme: 'light',
    notifications: [],

    // 同步action
    setUser: (user) => set({ user }),
    setTheme: (theme) => set({ theme }),

    // 异步action
    fetchUser: async (id) => {
        const user = await api.getUser(id);
        set({ user });
    },

    // 带参数的action
    addNotification: (notification) => {
        set(state => ({
            notifications: [...state.notifications, notification]
        }));
    }
}));

// 4. 服务层状态（SWR/React Query）
function useUser(userId) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/users/${userId}`,
        () => api.getUser(userId)
    );

    const updateUser = async (data) => {
        await api.updateUser(userId, data);
        mutate();  // 重新获取
    };

    return { user: data, error, isLoading, updateUser };
}

// 状态管理架构决策树
const stateManagementDecisionTree = {
    // 问题：这个状态需要共享吗？
    shared: {
        // 跨多少组件共享？
        crossComponent: {
            // 几个组件？
            few: '使用Context',
            many: '使用Zustand/Redux'
        },

        // 需要持久化吗？
        persistent: {
            // 是否需要离线支持？
            offline: '使用IndexedDB + Zustand persist',
            online: '使用Zustand persist'
        }
    },

    // 组件内部状态
    local: {
        // 复杂还是简单？
        complex: {
            // 需要多个相关状态？
            related: '使用useReducer',
            independent: '使用多个useState'
        },
        simple: '使用useState'
    }
};

// 状态规范化模式
// 使用不可变更新
const immutableUpdatePatterns = {
    // 添加元素
    addItem: (list, item) => [...list, item],

    // 删除元素
    removeItem: (list, id) => list.filter(item => item.id !== id),

    // 更新元素
    updateItem: (list, id, updates) =>
        list.map(item => item.id === id ? { ...item, ...updates } : item),

    // 嵌套更新
    updateNested: (state, path, updates) => {
        const [first, ...rest] = path;
        return {
            ...state,
            [first]: rest.length === 0
                ? { ...state[first], ...updates }
                : updateNested(state[first], rest, updates)
        };
    }
};

// 使用Immer进行不可变更新
import { produce } from 'immer';

const reducer = produce((draft, action) => {
    switch (action.type) {
        case 'ADD_ITEM':
            draft.items.push(action.payload);
            break;

        case 'UPDATE_ITEM':
            const index = draft.items.findIndex(i => i.id === action.id);
            if (index !== -1) {
                draft.items[index] = { ...draft.items[index], ...action.updates };
            }
            break;

        case 'DELETE_ITEM':
            draft.items = draft.items.filter(i => i.id !== action.id);
            break;
    }
});
```

### 6.3 错误边界与容错

```javascript
/**
 * 错误边界（Error Boundaries）
 *
 * 捕获子组件树的JavaScript错误
 * 显示备用UI，而非崩溃整个应用
 */

// 错误边界实现
class ErrorBoundary extends React.Component {
    state = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    static getDerivedStateFromError(error) {
        // 返回新状态以渲染备用UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // 记录错误日志
        console.error('ErrorBoundary caught:', error, errorInfo);

        this.setState({ errorInfo });

        // 可选：发送到错误追踪服务
        logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div>
                    <h1>出错了</h1>
                    <details>
                        <summary>错误详情</summary>
                        {this.state.error?.toString()}
                        <br />
                        {this.state.errorInfo?.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

// 使用错误边界
function App() {
    return (
        <ErrorBoundary>
            <MainContent />
        </ErrorBoundary>
    );
}

// 多个错误边界（隔离错误）
function App() {
    return (
        <div>
            <ErrorBoundary>
                <Sidebar />  {/* Sidebar出错不会影响主内容 */}
            </ErrorBoundary>

            <ErrorBoundary fallback={<MainError />}>
                <MainContent />  {/* 主内容出错显示专门的错误 */}
            </ErrorBoundary>

            <ErrorBoundary>
                <Footer />  {/* Footer出错不影响其他内容 */}
            </ErrorBoundary>
        </div>
    );
}

// 函数式错误边界（React 16+）
function ErrorBoundary({ children, fallback }) {
    const [error, setError] = useState(null);

    useEffect(() => {
        const errorHandler = (event) => {
            setError(event.error);
        };

        window.addEventListener('error', errorHandler);
        return () => window.removeEventListener('error', errorHandler);
    }, []);

    if (error) {
        return fallback || <DefaultErrorFallback error={error} />;
    }

    return children;
}

// 错误恢复
class RecoverableErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <p>加载失败</p>
                    <button onClick={this.handleRetry}>重试</button>
                </div>
            );
        }

        return this.props.children;
    }
}

// 异步错误处理
function AsyncComponent() {
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const data = await api.getData();
            // 处理数据
        } catch (err) {
            setError(err);
        }
    };

    if (error) {
        return (
            <div>
                <p>加载失败: {error.message}</p>
                <button onClick={() => setError(null)}>重试</button>
            </div>
        );
    }

    return <div>数据加载中...</div>;
}

// 全局错误处理
const GlobalErrorHandler = () => {
    useEffect(() => {
        const handleUnhandledRejection = (event) => {
            // 异步代码中的未处理错误
            logErrorToService(event.reason);
            event.preventDefault();
        };

        const handleError = (event) => {
            // 资源加载错误等
            logErrorToService(event.error);
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, []);

    return null;
};
```

### 6.4 组件库设计

```javascript
/**
 * 组件库架构设计
 *
 * 目录结构
 * components/
 * ├── Button/
 * │   ├── Button.tsx
 * │   ├── Button.test.tsx
 * │   ├── Button.stories.tsx
 * │   └── index.ts
 * ├── Input/
 * │   └── ...
 */

// Button组件设计示例
// Button.tsx
import React, { forwardRef, useMemo } from 'react';

// 类型定义
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

// 样式映射
const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600'
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
};

// 组件实现
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const classes = useMemo(() => {
            const classes = [
                baseClasses,
                variantStyles[variant],
                sizeStyles[size],
                fullWidth ? 'w-full' : '',
                className
            ].filter(Boolean).join(' ');

            return classes;
        }, [variant, size, fullWidth, className]);

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Spinner />}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

// 使用compound components模式（可选）
export function ButtonGroup({ children, ...props }) {
    return (
        <div className="inline-flex rounded-md shadow-sm" role="group" {...props}>
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return child;

                const isFirst = index === 0;
                const isLast = index === React.Children.count(children) - 1;

                return React.cloneElement(child, {
                    className: cn(
                        child.props.className,
                        isFirst && 'rounded-r-none',
                        isLast && 'rounded-l-none',
                        !isFirst && !isLast && 'rounded-none border-l-0'
                    )
                });
            })}
        </div>
    );
}

// 导出
export { Button };
export type { ButtonProps };

// 组件使用示例
function App() {
    return (
        <div>
            <Button variant="primary" size="md">
                主要按钮
            </Button>

            <Button variant="secondary" leftIcon={<SaveIcon />}>
                保存
            </Button>

            <Button isLoading>
                加载中...
            </Button>

            <ButtonGroup>
                <Button>左</Button>
                <Button>中</Button>
                <Button>右</Button>
            </ButtonGroup>
        </div>
    );
}

// Storybook Stories
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'danger']
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg']
        }
    }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: '主要按钮'
    }
};

export const WithLoading: Story = {
    args: {
        variant: 'primary',
        isLoading: true,
        children: '加载中'
    }
};
```

### 6.5 微前端架构

```javascript
/**
 * 微前端架构
 *
 * 将大型应用拆分成多个独立的小应用
 * 每个子应用可以独立开发、测试、部署
 */

// qiankun微前端配置示例

// 主应用
// main.js
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
    {
        name: 'react-app',        // 子应用名称
        entry: '//localhost:3001', // 子应用入口
        container: '#micro-container',  // 挂载点
        activeRule: '/react',     // 激活规则
        props: {
            shared: window.shared  // 传递共享数据
        }
    },
    {
        name: 'vue-app',
        entry: '//localhost:3002',
        container: '#micro-container',
        activeRule: '/vue',
        props: {
            shared: window.shared
        }
    }
], {
    beforeLoad: [
        app => {
            console.log('[主应用] before load', app.name);
            return Promise.resolve();
        }
    ],
    beforeMount: [
        app => {
            console.log('[主应用] before mount', app.name);
            return Promise.resolve();
        }
    ],
    afterUnmount: [
        app => {
            console.log('[主应用] after unmount', app.name);
            return Promise.resolve();
        }
    ]
});

start({
    prefetch: 'all',  // 预加载所有子应用
    sandbox: {
        strictStyleIsolation: true  // 样式隔离
    }
});

// 子应用（React）
// entry.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

let root;

/**
 * bootstrap - 初始化
 * 只在首次加载时调用一次
 */
export async function bootstrap() {
    console.log('[react-app] bootstraped');
}

/**
 * mount - 挂载
 * 每次进入应用时调用
 */
export async function mount(props) {
    console.log('[react-app] mount', props);

    root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

/**
 * unmount - 卸载
 * 每次离开应用时调用
 */
export async function unmount() {
    console.log('[react-app] unmount');

    if (root) {
        root.unmount();
    }
}

/**
 * update - 热更新
 * 可选实现
 */
export async function update(props) {
    console.log('[react-app] update', props);
}

// vite.config.js (子应用)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    base: '/react',  // 子应用的基础路径
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                // 资源命名
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        }
    }
});

// 状态共享（shared）
// main/shared.js
const shared = {
    user: null,
    store: {
        getState: () => ({}),
        subscribe: () => () => {},
        dispatch: () => {}
    },
    utils: {
        formatDate: (date) => new Date(date).toLocaleDateString(),
        request: (url, options) => fetch(url, options)
    }
};

window.shared = shared;

// 路由配置（主应用）
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MicroApp from './MicroApp';

function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/react">React子应用</Link>
                <Link to="/vue">Vue子应用</Link>
                <Link to="/about">主应用关于页</Link>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/react/*" element={
                    <MicroApp name="react-app" />
                } />
                <Route path="/vue/*" element={
                    <MicroApp name="vue-app" />
                } />
            </Routes>
        </BrowserRouter>
    );
}

// MicroApp组件封装
function MicroApp({ name }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // 加载子应用
        const loadMicroApp = async () => {
            const microApp = import('qiankun').then(({ loadMicroApp }) => {
                return loadMicroApp({
                    name,
                    container: containerRef.current,
                    props: {
                        shared: window.shared
                    }
                });
            });
        };

        const app = loadMicroApp();

        return () => {
            app.then(m => m.unmount());
        };
    }, [name]);

    return <div ref={containerRef} />;
}
```

---

## 参考资源

- [React官方文档](https://react.dev)
- [React Fiber架构](https://github.com/acdlite/react-fiber-architecture)
- [React Hooks API Reference](https://react.dev/reference/react)
- [React性能优化](https://react.dev/learn/optimizing-performance)
- [React设计模式](https://react.dev/learn/thinking-in-react)
- [qiankun微前端](https://qiankun.umijs.org/)

---

*本文档持续更新，最后更新于2026年3月*