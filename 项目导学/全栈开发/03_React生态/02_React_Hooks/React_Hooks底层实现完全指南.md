# React Hooks 底层实现完全指南

> 本文档深入剖析 React Hooks 的底层实现原理，通过源码级别的分析，帮助读者理解 React 设计 Hook 的智慧。全程中文编写，包含大量代码示例，建议配合 React 源码阅读效果更佳。

---

## 一、Hook 概述

### 1.1 Hook 的本质：函数组件的 state

Hook 是 React 16.8 引入的新特性，它的核心本质是：**让函数组件拥有管理 state 的能力**。在 Hook 出现之前，函数组件被称作"无状态组件"，它们只能接受 props 并渲染 UI，无法持有任何内部状态。而类组件通过 `this.state` 和 `this.setState` 来管理状态，但这引入了一系列问题。

```typescript
// 之前的函数组件 - 无状态，只能接受props
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Hook引入后的函数组件 - 有状态
function Counter() {
  // useState就是Hook，它让函数组件能够"钩入"React的state系统
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

从本质上讲，Hook 是 React 提供的一组 API，允许函数组件"钩入" React 的状态和生命周期系统。它们不是类组件的简单替代，而是对函数组件能力的全新扩展。React 的官方定义是：Hook 是让你在函数组件中"钩入" React state 和生命周期等特性的函数。

### 1.2 为什么要 Hook：class 组件的问题

在 Hook 出现之前，React 使用类组件来管理状态和副作用。然而，类组件存在诸多问题：

**第一，逻辑复用困难。** 在类组件中，如果多个组件需要共享相同的逻辑，我们通常需要使用 render props 或高阶组件（HOC）。这些模式会引入"包装地狱"，使代码变得臃肿且难以理解。

```typescript
// 高阶组件模式 - 逻辑复用困难
const withUser = (WrappedComponent) => {
  return class extends React.Component {
    componentDidMount() {
      this.setState({ user: fetchUser() });
    }
    render() {
      return <WrappedComponent {...this.props} {...this.state} />;
    }
  };
};

// 使用HOC会导致嵌套越来越深
const withTheme = (WrappedComponent) => { /* ... */ };
const withLogger = (WrappedComponent) => { /* ... */ };

const EnhancedComponent = withLogger(withTheme(withUser(WrappedComponent)));
```

**第二，复杂组件变得难以理解。** 一个类组件往往包含大量的 state、生命周期方法和事件处理器，代码量快速膨胀。相关的逻辑被拆分到不同的生命周期方法中，而非相关的逻辑却被迫放在一起。

```typescript
// 一个典型的复杂类组件
class Comment extends React.Component {
  state = {
    comment: null,
    author: null,
    replies: [],
    likes: 0,
    isLiked: false,
    isEditing: false,
    isReplying: false,
  };

  // 数据获取逻辑
  componentDidMount() {
    fetchComment(this.props.id).then(comment => this.setState({ comment }));
    fetchAuthor(comment.authorId).then(author => this.setState({ author }));
    fetchReplies(comment.id).then(replies => this.setState({ replies }));
  }

  // 订阅管理
  componentDidMount() {
    subscription = subscribeToComments(this.props.id, () => {
      // 更新评论...
    });
  }

  // 定时器
  componentDidMount() {
    this.timer = setInterval(() => {
      this.updateTypingStatus();
    }, 1000);
  }

  // 每个生命周期方法都可能包含不相关的逻辑
  componentDidUpdate(prevProps, prevState) {
    // 处理评论更新
    if (prevProps.id !== this.props.id) {
      this.loadCommentData();
    }
    // 处理点赞动画
    if (prevState.isLiked !== this.state.isLiked) {
      this.playLikeAnimation();
    }
  }

  componentWillUnmount() {
    // 清理工作散落在各处
    subscription.unsubscribe();
    clearInterval(this.timer);
    // 等等...
  }
}
```

**第三，this 问题。** JavaScript 中的 this 行为经常让开发者困惑，在 React 类组件中尤其如此。我们需要显式绑定方法到 this，或者使用箭头函数。

```typescript
class MyComponent extends React.Component {
  handleClick() {
    // 这里的this是undefined！
    // 需要手动绑定: this.handleClick = this.handleClick.bind(this)
    console.log(this.state);
  }

  // 或者使用箭头函数（每次渲染都创建新函数）
  handleClick = () => {
    console.log(this.state);
  };

  // 或者在render中使用箭头函数（每次渲染都创建新函数）
  render() {
    return <button onClick={() => this.handleClick()}>点击</button>;
  }
}
```

**Hook 的解决方案：**

```typescript
// 使用Hook后，逻辑可以清晰地按功能分组
function Comment({ id }) {
  // 数据获取 - 相关逻辑放在一起
  const [comment, setComment] = useState(null);
  const [author, setAuthor] = useState(null);
  const [replies, setReplies] = useState([]);

  // 副作用管理 - 清晰的副作用逻辑
  useEffect(() => {
    fetchComment(id).then(setComment);
    fetchAuthor(comment?.authorId).then(setAuthor);
    fetchReplies(id).then(setReplies);
  }, [id]);

  // 订阅管理
  useEffect(() => {
    const subscription = subscribeToComments(id, callback);
    return () => subscription.unsubscribe(); // 清理函数
  }, [id]);

  // 定时器
  useEffect(() => {
    const timer = setInterval(updateTypingStatus, 1000);
    return () => clearInterval(timer); // 清理函数
  }, []);

  // 状态和事件处理逻辑清晰
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = useCallback(() => {
    setIsLiked(true);
    setLikes(likes => likes + 1);
  }, []);

  // UI与逻辑完全分离
  return (/* JSX */);
}
```

### 1.3 Hook 规则：为什么有这些规则

React Hooks 有两条核心规则，理解这些规则背后的原因对于深入理解 Hook 至关重要。

**规则一：只在最顶层使用 Hook**

不要在循环、条件语句或嵌套函数中调用 Hook。始终在 React 函数组件的最顶层调用 Hook。

```typescript
// ❌ 错误：在条件语句中调用Hook
function Component() {
  if (condition) {
    const [name, setName] = useState('John'); // 规则违反！
  }
  const [age, setAge] = useState(25);
}

// ❌ 错误：在循环中调用Hook
function Component() {
  for (let i = 0; i < 3; i++) {
    const [item, setItem] = useState(initialItems[i]); // 规则违反！
  }
}

// ❌ 错误：在嵌套函数中调用Hook
function Component() {
  function helper() {
    const [data, setData] = useState(null); // 规则违反！
  }
}
```

**为什么需要这条规则？**

Hook 的实现依赖于**调用顺序**。React 内部使用链表来存储每个 Hook 的状态。每次组件渲染时，React 按照相同的顺序遍历这个链表，获取或更新每个 Hook 的状态。

```typescript
// React内部简化模型
// 每个组件维护一个hook链表
const hookStates = []; // 假设这是组件的Hook状态存储
let currentHookIndex = 0; // 当前调用的Hook索引

function useState(initialValue) {
  const key = currentHookIndex;

  if (hookStates[key] === undefined) {
    // 首次渲染：初始化状态
    hookStates[key] = {
      state: initialValue,
      queue: [], // 更新队列
    };
  }

  const state = hookStates[key].state;

  const setState = (action) => {
    // 将更新操作加入队列
    hookStates[key].queue.push(action);
    // 触发重新渲染
    scheduleUpdate();
  };

  currentHookIndex++; // 移动到下一个Hook
  return [state, setState];
}

// 如果条件调用会破坏顺序
function Component({ condition }) {
  // 假设首次渲染condition为true
  if (condition) {
    useState(0); // hookStates[0]
  }
  useState(1); // hookStates[1] - 或者是hookStates[0]？

  // 第二次渲染condition为false
  // if (condition) 不执行
  useState(1); // 现在这个会读取hookStates[0]！
  // Hook的顺序完全乱了！
}
```

如上述伪代码所示，如果 Hook 调用顺序不稳定，React 将无法正确关联每次渲染对应的 Hook 状态。第一次渲染时可能 Hook A 是 `useState(0)`，第二次渲染时由于条件不满足，Hook A 变成了 `useState(1)`，数据完全错乱。

**规则二：只在 React 函数中调用 Hook**

只可以在 React 函数组件中或自定义 Hook 中调用 Hook，不要在普通 JavaScript 函数中调用。

```typescript
// ❌ 错误：在普通函数中调用Hook
function ordinaryFunction() {
  const [state, setState] = useState(0); // 不允许！
}

// ✅ 正确：在函数组件中调用
function MyComponent() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}

// ✅ 正确：在自定义Hook中调用
function useCustomHook() {
  const [state, setState] = useState(0);
  // 自定义Hook本质上是一个函数，但React有特殊处理
  return state;
}
```

**为什么需要这条规则？**

自定义 Hook 是 React 用来实现逻辑复用的机制。自定义 Hook 内部调用 Hook 是允许的，因为它的调用顺序也是稳定的。React 通过**追踪当前的组件**来确保 Hook 调用在正确的上下文中执行。

### 1.4 我的思考：Hook 设计的优雅

React Hooks 的设计体现了几个核心原则：

**第一，最小特权原则。** React 没有暴露过多底层 API，而是提供了恰好够用的抽象。每个 Hook 只做一件事，通过组合来完成复杂功能。

**第二，声明式优于命令式。** `useEffect(() => { /* ... */ }, [deps])` 比类组件中的 `componentDidMount` + `componentDidUpdate` + `componentWillUnmount` 组合更加声明式，开发者只需要声明"依赖什么"，React 负责处理"何时调用"。

**第三，逻辑分离而非生命周期分离。** 相关的逻辑不再被拆散到不同的生命周期方法中，而是按功能聚合在同一个 `useEffect` 中。这使得代码更易于理解和维护。

**第四，输出而非继承。** 类组件通过继承来实现功能扩展，这导致"包装地狱"。Hook 通过组合（输出）的方式复用逻辑，更灵活也更直观。

---

## 二、useState 实现

### 2.1 Dispatcher 分发

React 在执行函数组件时，会根据当前组件的类型（首次渲染还是更新渲染）使用不同的 Hook 实现。React 内部使用一个叫做 `dispatcher` 的对象来管理这个分发过程。

```typescript
// React内部简化模型
// dispatcher是一个对象，包含所有Hook函数
const dispatcher = {
  useState: function(initialState) {
    // 具体实现
  },
  useEffect: function(create, deps) {
    // 具体实现
  },
  // ... 其他Hook
};

// React根据渲染阶段选择不同的dispatcher
let currentDispatcher;

function renderRoot() {
  // 首次渲染使用mountDispatcher
  currentDispatcher = mountDispatcher;

  // 更新渲染使用updateDispatcher
  currentDispatcher = updateDispatcher;

  // 执行函数组件
  FunctionComponent();
}
```

在 React 源码中，dispatcher 的定义大致如下：

```typescript
// ReactFiberHooks.js - 简化版本

// 首次渲染的dispatcher
const MountedDispatcher = {
  useState: mountState,
  useEffect: mountEffect,
  useReducer: mountReducer,
  useContext: readContext,
  // ...
};

// 更新渲染的dispatcher
const UpdateDispatcher = {
  useState: updateState,
  useEffect: updateEffect,
  useReducer: updateReducer,
  useContext: readContext,
  // ...
};

// 当前使用的dispatcher
let currentDispatcher = null;

export function renderRoot() {
  // 首次渲染
  if (phase === 'render') {
    currentDispatcher = MountedDispatcher;
  } else {
    // 更新渲染
    currentDispatcher = UpdateDispatcher;
  }

  try {
    // 执行组件，组件内部调用Hook时会用到currentDispatcher
    actualRenderComponent();
  } finally {
    currentDispatcher = null;
  }
}
```

当函数组件调用 `useState` 时，实际上是调用了 `currentDispatcher.useState`。这种设计的好处是：
- React 可以在运行时动态切换 Hook 的实现
- 可以支持 React 的不同渲染模式（如 Concurrent Mode）
- 便于 Tree Shaking，只打包使用的 Hook

### 2.2 mountState：初始化

当组件首次渲染时，React 调用 `mountState` 来初始化 Hook 的状态。

```typescript
// ReactFiberHooks.js - mountState简化实现

function mountState(initialState) {
  // 获取当前Hook的链表节点
  // workInProgressHook是当前正在处理的Hook
  const hook = mountWorkInProgressHook();

  // 如果initialState是函数，则调用它获取初始值
  if (typeof initialState === 'function') {
    initialState = initialState();
  }

  // 设置初始状态
  hook.memoizedState = initialState;

  // 创建队列，用于存储setState的更新
  const queue = {
    last: null,           // 最后一个更新
    dispatch: null,        // dispatch函数
    lastRenderedReducer: basicStateReducer, // 上一次渲染使用的reducer
    lastRenderedState: initialState, // 上一次渲染的状态
  };

  // 创建dispatch函数
  const dispatch = queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber, // 当前渲染的fiber
    queue                    // 关联的更新队列
  );

  // 返回状态和dispatch函数
  return [hook.memoizedState, dispatch];
}
```

`mountWorkInProgressHook` 的实现：

```typescript
// 创建新的Hook节点，串联成链表
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,    // 存储的状态值

    // 对于useState，这是这样的结构：
    // { baseState, baseQueue, queue }
    // 对于useEffect，这是effect链表
    // 对于useReducer，这是reducer相关

    baseState: null,         // 基础状态
    baseQueue: null,         // 基础队列
    queue: null,            // 更新队列

    next: null,             // 指向下一个Hook
  };

  if (workInProgressHook === null) {
    // 第一个Hook，成为fiber的memoized属性
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 链接到链表末尾
    workInProgressHook = workInProgressHook.next = hook;
  }

  return hook;
}
```

整个过程可以用下图表示：

```
fiber.memoizedState (Hook链表头)
       |
       v
   +---------+     +---------+     +---------+
   | Hook 1  | --> | Hook 2  | --> | Hook 3  |
   | state:0 |     | state:[] |     | state:''|
   +---------+     +---------+     +---------+
       |               |               |
   queue: {...}     queue: {...}    queue: {...}
   dispatch       dispatch         dispatch
```

### 2.3 updateState：更新

当组件重新渲染时，React 调用 `updateState` 来处理状态更新。

```typescript
// ReactFiberHooks.js - updateState简化实现

function updateState(initialState) {
  // 获取当前Hook
  const hook = updateWorkInProgressHook();

  // 获取更新队列
  const queue = hook.queue;

  // 获取上一次渲染的reducer和状态
  const lastRenderedReducer = queue.lastRenderedReducer;
  const lastRenderedState = queue.lastRenderedState;

  // 处理挂起的更新
  const dispatch = queue.dispatch;

  // 执行队列中的所有更新
  if (hook.baseQueue !== null) {
    // 先执行baseQueue中的更新
    const first = hook.baseQueue.next;
    let newState = hook.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;

    let update = first;
    do {
      // 判断更新是否需要被跳过（依赖没变的情况）
      if (update.hasRelevance !== false) {
        // 计算新状态
        const action = update.action;

        if (typeof action === 'function') {
          // action是函数，传入当前状态执行
          newState = action(newState);
        } else {
          // action是直接的值
          newState = action;
        }
      } else {
        // 跳过这个更新，但保留在队列中以维持顺序
        // 这涉及到批量更新的优化
      }
      update = update.next;
    } while (update !== null);

    // 更新hook的状态
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    // 更新队列的"上一次渲染"引用
    queue.lastRenderedState = newState;
  }

  return [hook.memoizedState, dispatch];
}
```

### 2.4 dispatchAction：调度

当我们调用 `setState` 时（由 `dispatch` 返回），实际执行的是 `dispatchAction`。

```typescript
// ReactFiberHooks.js - dispatchAction简化实现

function dispatchAction(fiber, queue, action) {
  // 创建更新对象
  const update = {
    action,           // 更新的值或函数
    next: null,       // 链表下一项
    hasRelevance: true, // 是否有意义（影响是否需要重新渲染）
  };

  // 将更新加入队列
  const last = queue.last;
  if (last === null) {
    // 队列为空，自己成为链表头和尾
    update.next = update;
  } else {
    // 加入循环链表
    const first = last.next;
    update.next = first;
    last.next = update;
  }
  queue.last = update;

  // 标记fiber需要更新
  // 这是React调度更新的关键
  const alternate = fiber.alternate;

  if (fiber === currentlyRenderingFiber ||
      (alternate !== null && alternate === currentlyRenderingFiber)) {
    // 正在渲染过程中，添加到待处理的更新队列
    if (workInProgressSharedStack === null) {
      // 创建新的待处理队列
    }
  } else {
    // 不在渲染过程中，直接调度更新
    scheduleUpdateOnFiber(fiber);

    // 处理更新冲突/批量更新
    if (executionContext === RenderContext) {
      // 正在渲染时触发的更新
    }

    // 处理自动批量更新
    if (fiber.tag === FunctionComponent) {
      // 对于函数组件，所有更新都会被批量处理
      // 这就是React 18的自动批处理（Automatic Batching）
    }
  }
}
```

### 2.5 批量更新原理

在 React 18 之前，只有事件处理函数中的更新会被批量处理，其他情况（如 setTimeout、Promise、原生事件等）中的更新不会自动批处理。React 18 引入了 Automatic Batching，使得几乎所有更新都会被批量处理。

```typescript
// React 18之前的批量更新
// setTimeout中的setState会触发多次渲染
setTimeout(() => {
  setCount(1);  // 触发渲染
  setName('a'); // 触发另一次渲染
}, 0);

// React 18之后的自动批处理
setTimeout(() => {
  setCount(1);  // 不会立即渲染
  setName('a'); // 不会立即渲染
  // React会自动批处理，只触发一次渲染
}, 0);
```

批处理的核心原理：

```typescript
// 批量更新的简化模型
let isBatching = false;
const updateQueue = [];

function scheduleUpdate() {
  if (!isBatching) {
    // 不在批处理中，立即渲染
    flushUpdates();
  }
  // 否则只是加入队列
}

function batchedUpdates(fn) {
  if (isBatching) {
    // 已经在批处理中，直接执行
    return fn();
  }

  isBatching = true;
  try {
    return fn();
  } finally {
    isBatching = false;
    flushUpdates(); // 批处理结束后，统一渲染
  }
}

function flushUpdates() {
  // 执行所有待处理的更新，只渲染一次
  while (updateQueue.length > 0) {
    const update = updateQueue.shift();
    update.component.update();
  }
}
```

React 18 的实现使用了更复杂的机制，涉及 `lane`（车道）模型来区分更新的优先级，以及 `transitions` 来处理非紧急更新。

---

## 三、useReducer 实现

### 3.1 Reducer 模式

Reducer 是一种函数式编程中常见的模式，它接收当前状态和一个 action，返回新状态。Reducer 必须是纯函数，没有副作用。

```typescript
// reducer模式的核心
type Reducer<S, A> = (state: S, action: A) => S;

// 典型的reducer
function counterReducer(state: number, action: { type: string }) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'RESET':
      return 0;
    default:
      return state;
  }
}
```

`useState` 实际上是 `useReducer` 的一种简化形式。在 React 内部，`useState` 使用的 reducer 如下：

```typescript
// useState内部使用的reducer
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

// useState就是使用这个reducer的useReducer
const [state, setState] = useState(0);
// 等价于
const [state, dispatch] = useReducer(basicStateReducer, 0);
```

### 3.2 mountReducer

`mountReducer` 与 `mountState` 非常相似，主要区别在于它接收一个 reducer 函数。

```typescript
// ReactFiberHooks.js - mountReducer简化实现

function mountReducer(reducer, initialArg, init) {
  // 创建Hook
  const hook = mountWorkInProgressHook();

  // 初始化状态
  let initialState;

  if (init !== undefined) {
    // 如果提供了init函数，使用它初始化
    initialState = init(initialArg);
  } else {
    initialState = initialArg;
  }

  hook.memoizedState = initialState;

  // 创建队列
  const queue = {
    last: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState,
  };

  // 创建dispatch
  const dispatch = queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  );

  return [hook.memoizedState, dispatch];
}
```

### 3.3 updateReducer

`updateReducer` 处理状态更新的逻辑，比 `updateState` 更复杂一些，因为它需要调用 reducer 函数。

```typescript
// ReactFiberHooks.js - updateReducer简化实现

function updateReducer(reducer, initialArg, init) {
  // 获取当前Hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  // 上一次渲染使用的reducer
  const lastRenderedReducer = queue.lastRenderedReducer;
  const lastRenderedState = queue.lastRenderedState;

  // 执行队列中的更新
  const baseState = hook.baseState;
  const baseQueue = hook.baseQueue;

  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = baseState;
    let newBaseState = baseState;
    let newBaseQueue = null;

    let update = first;
    let didSkip = false;

    do {
      const action = update.action;

      if (update.hasRelevance === false) {
        // 跳过这个更新
        const skipped = update;
        if (newBaseQueue === null) {
          newBaseQueue = skipped;
        } else {
          newBaseQueue = newBaseQueue.next = skipped;
        }
        didSkip = true;
      } else {
        // 调用reducer计算新状态
        if (typeof action === 'function') {
          newState = action(newState);
        } else {
          newState = reducer(newState, action);
        }
      }

      update = update.next;
    } while (update !== null && update !== first);

    if (didSkip) {
      // 如果有跳过的更新，需要处理它们
      hook.baseQueue = newBaseQueue;
      hook.baseState = newBaseState;
    }

    hook.memoizedState = newState;
    queue.lastRenderedState = newState;
    queue.lastRenderedReducer = reducer;
  }

  return [hook.memoizedState, queue.dispatch];
}
```

### 3.4 深入理解 dispatch

dispatch 是如何工作的？它的神奇之处在于：**dispatch 不需要组件在重新渲染时调用就能工作**。

```typescript
// dispatch的闭包特性
function Counter() {
  const [count, dispatch] = useReducer(counterReducer, 0);

  // 这个dispatch函数是"稳定"的
  // 即使组件重新渲染，它也是同一个函数
  // 这是因为dispatch被绑定到了fiber上，而不是组件作用域

  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      {count}
    </button>
  );
}

// dispatch可以"记住"它属于哪个fiber
// 即使组件被包裹在memo中，只要fiber不变，dispatch就有效
```

dispatch 使用了 `bind` 来绑定 fiber 和 queue：

```typescript
// dispatchAction.bind(null, fiber, queue)
// 当调用dispatch({ type: 'INCREMENT' })时：
// dispatch = (action) => dispatchAction(fiber, queue, action)
```

这意味着 dispatch 函数本身永远不需要改变，它只是把 action 放入队列并请求 React 调度更新。这是 React 性能优化的一个关键点。

---

## 四、useEffect 实现

### 4.1 Effect 的创建

useEffect 是 React 用于处理副作用的 Hook。副作用包括数据获取、订阅、手动 DOM 操作等。

```typescript
// useEffect的调用方式
useEffect(() => {
  // 副作用函数
  const subscription = subscribeToData(id, callback);

  // 可选：返回清理函数
  return () => {
    subscription.unsubscribe();
  };
}, [id]); // 依赖数组
```

React 内部将 effect 表示为一个链表结构：

```typescript
// Effect链表节点结构
struct Effect {
  tag: EffectTag,        // Effect类型标签
  create: () => void,   // 副作用创建函数
  destroy: (() => void) | null, // 清理函数
  deps: Array<mixed> | null,     // 依赖数组
  next: Effect | null,          // 链表下一项
}

// EffectTag定义
const EffectTag = {
  Update: 1,           // 需要执行
  Snapshot: 2,         // 快照（getSnapshotBeforeUpdate）
  Layout: 4,           // 布局副作用（同步执行）
  Passive: 8,         // 被动副作用（异步执行）
};
```

`mountEffect` 的实现：

```typescript
// ReactFiberHooks.js - mountEffect简化实现

function mountEffect(create, deps) {
  return mountWorkInProgressHook(
    effectChain, // effect链表
    (tag & mountEffectTag) | passiveEffectTag, // effect类型
    create,
    deps
  );
}

function mountWorkInProgressHook(hook, effectTag, create, deps) {
  const hook = mountWorkInProgressHook();

  hook.memoizedState = createEffectInstance(effectTag, create, deps);

  return hook;
}

function createEffectInstance(tag, create, deps) {
  const effect = {
    tag,
    create,
    destroy: null,
    deps,
    next: null,
  };

  return effect;
}
```

### 4.2 副作用的调度

React 不会立即执行 useEffect 中的副作用。相反，它会调度这些 effect 在渲染和绘制完成后执行。

```
渲染阶段（Render Phase）
    |
    v
React计算DOM变化
    |
    v
绘制阶段（Paint Phase）
    |
    v
Layout Effects（同步执行）<-- useLayoutEffect
    |
    v
浏览器绘制完成
    |
    v
Passive Effects（异步执行）<-- useEffect
```

调度的核心逻辑在 `scheduleCallback` 和 `flushPassiveEffects` 中：

```typescript
// 调度effect执行的简化模型

// React保存待执行的effect链表
let pendingPassiveEffects = null;
let pendingPassiveEffectsCleanup = null;

function scheduleCallback(callback) {
  // 将回调加入任务队列
  // React使用lane模型管理优先级
  // ...
}

// 当组件渲染完成后，React调用
function commitRoot(root) {
  // 处理快照effects（getSnapshotBeforeUpdate）
  commitBeforeMutationEffects();

  // 处理DOM变化
  commitMutationEffects();

  // 处理layout effects
  commitLayoutEffects();

  // 调度 passive effects
  if (rootDoesHavePassiveEffects) {
    // 在浏览器空闲时执行 passive effects
    scheduleCallback(Never, flushPassiveEffects);
  }
}

// 实际执行useEffect中的代码
function flushPassiveEffects() {
  // 执行所有 passive effects
  // 注意：这是在浏览器绘制之后执行的

  const unmountEffects = pendingPassiveUnmountEffects;
  pendingPassiveUnmountEffects = [];

  // 执行清理函数（从内到外）
  while (unmountEffects !== null) {
    const effect = unmountEffects;
    unmountEffects = effect.next;

    if (effect.destroy !== undefined) {
      effect.destroy(); // 调用清理函数
    }
  }

  const mountEffects = pendingPassiveMountEffects;
  pendingPassiveMountEffects = [];

  // 执行副作用函数
  while (mountEffects !== null) {
    const effect = mountEffects;
    mountEffects = effect.next;

    if (effect.create !== undefined) {
      effect.destroy = effect.create(); // 调用创建函数，保存返回的清理函数
    }
  }
}
```

### 4.3 清理函数

清理函数是 useEffect 的重要特性，它确保每个副作用都有对应的清理逻辑，防止内存泄漏和订阅残留。

```typescript
// useEffect的清理机制
function Component() {
  useEffect(() => {
    // 1. 执行副作用
    const timer = setInterval(() => {
      console.log('tick');
    }, 1000);

    // 2. 返回清理函数
    return () => {
      // 这个函数会在下一次effect执行前调用
      // 或者组件卸载时调用
      clearInterval(timer);
    };
  }, []); // 空依赖表示只在挂载时执行

  return <div>计时器组件</div>;
}

// 清理函数执行时机：
// 1. 组件卸载时
// 2. effect重新执行前（当依赖变化时）
```

清理函数执行的顺序和时机：

```typescript
// 多个effect的执行和清理顺序

function Parent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Parent effect');
    return () => console.log('Parent cleanup');
  }, [count]);

  return (
    <>
      <Child />
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </>
  );
}

function Child() {
  useEffect(() => {
    console.log('Child effect');
    return () => console.log('Child cleanup');
  }, []); // 空依赖，不会重新执行

  return <div>Child</div>;
}

// 点击按钮后，输出顺序：
// "Child cleanup"  (Child卸载)
// "Parent cleanup" (Parent重新渲染前清理)
// "Parent effect"  (Parent重新渲染后执行)
// "Child effect"   (Child重新挂载)

// 如果Child没有被卸载（React优化）：
// "Parent cleanup"
// "Parent effect"
// (Child effect不会再次执行，因为依赖没变)
```

### 4.4 Deps 依赖比较

React 使用 `Object.is` 来比较依赖数组中的每一项是否发生变化。

```typescript
// 依赖比较的简化实现
function objectIs(x, y) {
  // React内部使用的比较算法
  // 类似于 Object.is 但做了优化
  return (
    (x === y) ||
    (Number.isNaN(x) && Number.isNaN(y))
  );
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    // 首次渲染，没有上一次的依赖
    return false;
  }

  // 比较依赖数组的每一项
  for (let i = 0; i < prevDeps.length; i++) {
    if (!objectIs(nextDeps[i], prevDeps[i])) {
      return false; // 有变化
    }
  }

  return true; // 所有依赖都没变
}
```

常见依赖比较问题：

```typescript
// 问题1：依赖是对象，每次渲染都是新引用
function Component() {
  const [count, setCount] = useState(0);

  // ❌ 错误：obj每次渲染都是新对象，导致effect无限循环
  useEffect(() => {
    console.log('effect');
  }, [{}]); // 永远不相等！

  // ✅ 正确：使用空依赖表示只执行一次
  useEffect(() => {
    console.log('effect');
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 问题2：函数依赖
function Component({ userId }) {
  const [data, setData] = useState(null);

  // ❌ 错误：fetchData每次渲染都是新函数
  const fetchData = () => {
    fetch(`/api/${userId}`).then(setData);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData总是变化！

  // ✅ 正确：使用useCallback包裹函数
  const fetchData = useCallback(() => {
    fetch(`/api/${userId}`).then(setData);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ 或者：将fetchData的逻辑直接放入effect
  useEffect(() => {
    fetch(`/api/${userId}`).then(setData);
  }, [userId]);
}
```

### 4.5 何时执行：Layout vs Paint

React 提供两种 effect 执行时机：`useEffect` 和 `useLayoutEffect`。

| 特性 | useEffect | useLayoutEffect |
|------|-----------|-----------------|
| 执行时机 | 浏览器绘制之后（异步） | DOM 变化之后、绘制之前（同步） |
| 是否阻塞绘制 | 否 | 是 |
| 使用场景 | 数据获取、订阅等 | 读取/操作 DOM 样式 |
| 性能影响 | 较小 | 可能导致性能问题 |

```typescript
// useLayoutEffect示例
function Tooltip() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  // 同步执行，确保tooltip位置在绘制前计算完成
  // 避免闪烁
  useLayoutEffect(() => {
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    });
  }, []);

  return (
    <div ref={ref} style={{ position: 'absolute', ...position }}>
      Tooltip
    </div>
  );
}

// useEffect示例
function DataFetcher({ userId }) {
  const [data, setData] = useState(null);

  // 异步执行，不阻塞UI
  useEffect(() => {
    fetchUser(userId).then(setData);
  }, [userId]);

  return <div>{data ? data.name : 'Loading...'}</div>;
}
```

---

## 五、useRef 实现

### 5.1 Ref 的本质

`useRef` 是 React 中用于访问 DOM 元素或存储可变值的 Hook。它的核心特性是：**修改 ref 不会触发组件重新渲染**。

```typescript
// useRef的基本用法
function Component() {
  const countRef = useRef(0);
  const inputRef = useRef(null);

  const handleClick = () => {
    // 修改ref不会触发重新渲染
    countRef.current += 1;
    console.log('Clicked', countRef.current, 'times');
  };

  const handleFocus = () => {
    // 直接访问DOM元素
    inputRef.current.focus();
  };

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={handleClick}>Click</button>
    </div>
  );
}
```

`useRef` 的本质是返回一个可变的引用对象：

```typescript
// useRef的简化实现
function useRef(initialValue) {
  const dispatcher = currentDispatcher;

  if (dispatcher === null) {
    throw new Error('useRef must be called inside a component');
  }

  return dispatcher.useRef(initialValue);
}

function mountRef(initialValue) {
  // 创建一个ref对象
  const ref = {
    current: initialValue,
  };

  // 将ref包装成Hook的形式，方便管理和追踪
  // 实际上React内部使用特殊的Hook类型
  return ref;
}
```

### 5.2 createRef vs useRef

React 提供了两种创建 ref 的方式：`createRef` 和 `useRef`。

```typescript
// createRef - 在类组件中使用
class MyComponent extends React.Component {
  inputRef = React.createRef(); // 创建新的ref对象

  componentDidMount() {
    // 通过current访问DOM
    this.inputRef.current.focus();
  }

  render() {
    return <input ref={this.inputRef} />;
  }
}

// useRef - 在函数组件中使用
function MyComponent() {
  const inputRef = useRef(null); // 函数组件必须用useRef

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

主要区别：

```typescript
// createRef每次渲染都会创建新的ref对象
function Component() {
  // 每次渲染，inputRef都是新的对象
  const inputRef = React.createRef();

  console.log(inputRef === inputRef); // false，每次渲染都是新对象
  // 这会导致问题：ref可能会丢失

  return <input ref={inputRef} />;
}

// useRef返回稳定的ref对象
function Component() {
  // 每次渲染，useRef返回同一个ref对象
  const inputRef = useRef(null);

  console.log(inputRef === inputRef); // true，同一个引用
  // ref的current值会保持

  return <input ref={inputRef} />;
}

// createRef的内部实现
function createRef() {
  const refObject = {
    current: null,
  };
  return refObject;
}

// useRef的内部实现
function useRef(initialValue) {
  const hook = mountWorkInProgressHook();

  if (hook.memoizedState === null) {
    // 首次渲染，创建ref
    const ref = {
      current: initialValue,
    };
    hook.memoizedState = ref;
    return ref;
  } else {
    // 后续渲染，返回已存在的ref
    return hook.memoizedState;
  }
}
```

### 5.3 forwardRef 实现

`forwardRef` 允许组件接收 ref 作为 props，这对于将 ref 传递给子组件或 DOM 元素是必需的。

```typescript
// 问题：普通组件无法接收ref
function ChildComponent({ forwardRef }) {
  return <input ref={forwardRef} />; // forwardRef是undefined！
}

// 解决：使用forwardRef
const ChildComponent = React.forwardRef((props, ref) => {
  // ref参数是第二个参数
  return <input ref={ref} />;
});

// 使用
function Parent() {
  const inputRef = useRef(null);

  return <ChildComponent ref={inputRef} />;
}
```

`forwardRef` 的实现原理：

```typescript
// forwardRef的简化实现
function forwardRef(render) {
  // 创建特殊类型的组件
  const component = {
    $$typeof: REACT_FORWARD_REF,
    render: render,
  };

  return component;
}

// 在渲染时处理forwardRef
function renderForwardRef(
  workInProgress,
  render,
  props,
  ref
) {
  // 调用render函数，将ref作为第二个参数传递
  const children = render(props, ref);

  // 正常渲染children
  return children;
}

// 当ref被使用时
function useRef() {
  // ...
}

// ref传递给DOM元素时
// <div ref={myRef}> -> myRef被附加到div上

// ref传递给类组件时
// <ClassComponent ref={myRef}> -> myRef被附加到类组件实例上
```

### 5.4 ref 转发机制

ref 转发让组件可以选择将 ref 向下传递（传递给子组件或 DOM 元素），而不影响组件的 props 接口。

```typescript
// 使用forwardRef转发ref
const FancyButton = React.forwardRef((props, ref) => (
  <button ref={ref} className="FancyButton">
    {props.children}
  </button>
));

// ref现在指向DOM button元素
const ref = useRef();
<button ref={ref}>Click</button> // ref.current === button

// ref也可以传递给另一个forwardRef组件
const ThirdPartyButton = forwardRef(({ forwardRef, ...props }, ref) => (
  <FancyButton ref={ref} {...props} />
));

// 使用ref链式传递
function App() {
  const buttonRef = useRef();
  // buttonRef.current 指向真实的DOM button

  return <ThirdPartyButton ref={buttonRef} />;
}
```

ref 转发在 Hook 中的实现：

```typescript
// useImperativeHandle - 定制暴露给父组件的ref值
function useImperativeHandle(ref, createHandle, deps) {
  useEffect(() => {
    if (ref !== null) {
      // 用createHandle的返回值替换ref.current
      ref.current = createHandle();
    }

    return () => {
      ref.current = null; // 清理
    };
  }, [ref, createHandle, deps]);
}

// 示例：暴露自定义方法而不是DOM元素
const Timer = forwardRef((props, ref) => {
  const [value, setValue] = useState(0);

  useImperativeHandle(ref, () => ({
    start: () => setValue(1),
    stop: () => setValue(0),
    reset: () => setValue(0),
  }), []);

  return <div>{value}</div>;
});

function App() {
  const timerRef = useRef();

  // timerRef.current.start(), timerRef.current.stop() 等方法可用
  // 但无法直接访问DOM
  return <Timer ref={timerRef} />;
}
```

---

## 六、useCallback 与 useMemo

### 6.1 memoizedState 缓存

React Hooks 使用 `memoizedState` 来缓存值。对于 useState，它是缓存的状态；对于 useCallback 和 useMemo，它缓存的是函数和计算结果。

```typescript
// useCallback的简化实现
function mountCallback(callback, deps) {
  const hook = mountWorkInProgressHook();

  // 缓存回调函数和依赖
  hook.memoizedState = [callback, deps];

  return callback;
}

function updateCallback(callback, deps) {
  const hook = updateWorkInProgressHook();
  const prevDeps = hook.memoizedState[1];

  // 比较依赖
  if (areHookInputsEqual(deps, prevDeps)) {
    // 依赖没变，返回缓存的回调
    return hook.memoizedState[0];
  }

  // 依赖变了，返回新回调，更新缓存
  hook.memoizedState[0] = callback;
  hook.memoizedState[1] = deps;

  return callback;
}

// useMemo的简化实现
function mountMemo(callback, deps) {
  const hook = mountWorkInProgressHook();

  hook.memoizedState = [callback, deps];

  return callback();
}

function updateMemo(callback, deps) {
  const hook = updateWorkInProgressHook();
  const prevDeps = hook.memoizedState[1];

  if (areHookInputsEqual(deps, prevDeps)) {
    return hook.memoizedState[0];
  }

  const nextValue = callback();
  hook.memoizedState[0] = nextValue;
  hook.memoizedState[1] = deps;

  return nextValue;
}
```

### 6.2 依赖数组比较

useCallback 和 useMemo 都使用相同的依赖比较机制：

```typescript
// 依赖比较逻辑
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }

  // 逐项比较
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }

  return true;
}

// Object.is vs ===
// Object.is 处理 NaN 和 +0/-0 的特殊情况
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(+0, -0));   // false

console.log(NaN === NaN);          // false
console.log(+0 === -0);           // true
```

### 6.3 何时使用：性能优化

useCallback 和 useMemo 主要用于避免不必要的重新渲染和计算。

```typescript
// 场景1：传递给子组件的回调函数
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log('clicked');
  };

  // ✅ 只有依赖变化时才创建新函数
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <MemoizedChild onClick={handleClick} />;
}

// 场景2：传递给 useEffect 的函数
function Component({ userId }) {
  const [data, setData] = useState(null);

  // ❌ 每次渲染都执行effect（因为fetchData是新函数）
  useEffect(() => {
    fetchData(userId).then(setData);
  }, [fetchData]); // fetchData引用会变

  // ✅ 使用useCallback稳定函数引用
  const fetchData = useCallback((id) => {
    return fetch(`/api/user/${id}`).then(r => r.json());
  }, []);

  useEffect(() => {
    fetchData(userId).then(setData);
  }, [userId, fetchData]); // fetchData引用稳定
}

// 场景3： expensive计算
function Component({ list }) {
  // ❌ 每次渲染都重新计算
  const sortedList = list.sort((a, b) => a.name.localeCompare(b.name));

  // ✅ 只有list变化时才重新计算
  const sortedList = useMemo(
    () => list.sort((a, b) => a.name.localeCompare(b.name)),
    [list]
  );

  return <LargeList items={sortedList} />;
}
```

### 6.4 过度优化的陷阱

过度使用 useCallback 和 useMemo 可能适得其反：

```typescript
// 陷阱1：创建缓存本身有开销
function Component() {
  // useCallback本身也有性能开销
  // 如果函数很简单，这个开销可能大于收益
  const handleClick = useCallback(() => {
    setCount(c => c + 1); // 这个操作本身很快
  }, []);

  // 简单赋值可能更快
  const handleClick = () => {
    setCount(c => c + 1);
  };
}

// 陷阱2：依赖数组错误导致bug
function Component({ items }) {
  // ❌ 常见错误：依赖数组不完整
  const processItems = useCallback(() => {
    return items.filter(item => item.active);
  }, []); // items变化但没有写在依赖中！

  // ✅ 正确：包含所有使用的变量
  const processItems = useCallback(() => {
    return items.filter(item => item.active);
  }, [items]);
}

// 陷阱3：memoized值本身是引用
function Component({ config }) {
  // ❌ config对象每次渲染都是新的
  const value = useMemo(() => {
    return computeExpensive(config);
  }, [config]); // config永远不相等（因为是引用比较）

  // ✅ 需要用JSON序列化或其他方式比较
  const value = useMemo(() => {
    return computeExpensive(config);
  }, [JSON.stringify(config)]);
}
```

性能优化的正确原则：

```typescript
// 1. 先测量，再优化
// 使用 React DevTools Profiler 确定哪里真的慢

// 2. 优先优化明显的性能问题
// 小幅度优化可能不值得

// 3. 遵循 React 的设计哲学
// 让组件"自然地"渲染，除非有明确的性能问题
// 过度抽象反而降低可读性
```

---

## 七、useContext 实现

### 7.1 Context 工作机制

Context 是 React 提供的跨组件树数据传递机制，无需手动逐层传递 props。

```typescript
// 创建Context
const ThemeContext = React.createContext('light');

// Provider提供值
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 消费Context（多种方式）
function Toolbar() {
  return (
    <ThemedButton />
  );
}

function ThemedButton() {
  // 方式1：Class组件使用static contextType
  class ThemedButton extends React.Component {
    static contextType = ThemeContext;
    render() {
      return <button theme={this.context}>Click</button>;
    }
  }

  // 方式2：函数组件使用useContext
  function ThemedButton() {
    const theme = useContext(ThemeContext);
    return <button theme={theme}>Click</button>;
  }

  // 方式3：Consumer组件（已不推荐）
  function ThemedButton() {
    return (
      <ThemeContext.Consumer>
        {value => <button theme={value}>Click</button>}
      </ThemeContext.Consumer>
    );
  }
}
```

Context 的内部结构：

```typescript
// createContext的简化实现
function createContext(defaultValue) {
  const context = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,      // 当前值
    _currentValue2: defaultValue,     // 用于 concurrent mode
    _threadCount: 0,                   // 线程计数
    Provider: null,                   // Provider组件
    Consumer: null,                   // Consumer组件
  };

  // 创建Provider
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  // 创建Consumer（用于render props模式）
  context.Consumer = {
    $$typeof: REACT_CONTEXT_TYPE,
    _context: context,
  };

  return context;
}
```

### 7.2 readContext 源码

`useContext` 内部调用的是 `readContext`：

```typescript
// readContext的简化实现
function readContext(context) {
  // 在 render 阶段读取 context
  if (lastContextDependency === null) {
    // 首次读取
  } else {
    // 检查是否与上一次读取的 context 相同
  }

  // 从 context 读取当前值
  // 内部使用 fiber 的 memoizedState 追踪 context 依赖

  const value = context._currentValue;

  // 将此 context 记录为依赖
  // 这样当 context 变化时，组件会重新渲染
  if (workInProgressDependencies !== null) {
    // 记录 context 依赖...
  }

  return value;
}

// useContext的实现
function useContext(context) {
  const dispatcher = currentDispatcher;

  if (dispatcher === null) {
    throw new Error('useContext must be called inside a component');
  }

  return dispatcher.useContext(context);
}

function mountContext(context) {
  const hook = mountWorkInProgressHook();

  // 初始化 context 依赖
  // ...

  return readContext(context);
}

function updateContext(context) {
  const hook = updateWorkInProgressHook();

  // 更新 context 依赖
  // ...

  return readContext(context);
}
```

### 7.3 Provider 传递

Provider 接收一个 `value` prop，并将其向下传递给所有消费的组件：

```typescript
// Provider的渲染实现
function updateContextProvider(
  workInProgress,
  render
) {
  const providerType = workInProgress.type;
  const context = providerType._context;

  const newProps = workInProgress.pendingProps;
  const newValue = newProps.value;

  // 将新值写入 context
  context._currentValue = newValue;

  // 标记所有消费的 fiber 需要更新
  // ...

  // 渲染 children
  const children = newProps.children;
  reconcileChildren(workInProgress, children);

  return workInProgress.child;
}
```

Provider 值变化的检测：

```typescript
// 值变化检测的关键代码
function updateContextProvider(
  workInProgress,
  render
) {
  const newProps = workInProgress.pendingProps;
  const newValue = newProps.value;

  // 获取旧的 props
  const oldValue = workInProgress.memoizedProps?.value;

  if (Object.is(oldValue, newValue)) {
    // 值没变，不需要更新 consumers
    return;
  }

  // 值变了，遍历所有依赖此 context 的 fiber
  const consumers = workInProgress.firstContextDependency;

  while (consumers !== null) {
    const consumer = consumers.alternate;

    if (consumer !== null) {
      // 标记 consumer 需要更新
      markUpdate(consumer);
    }

    consumers = consumers.next;
  }

  // 继续渲染...
}
```

### 7.4 Consumer 组件

Consumer 使用 render props 模式来消费 context：

```typescript
// Consumer组件的渲染实现
function updateContextConsumer(
  workInProgress,
  render
) {
  const context = workInProgress.type._context;

  const newProps = workInProgress.pendingProps;
  const render = newProps.children;

  // 获取当前 context 的值
  const newValue = context._currentValue;

  // 调用 render function，传入 context 值
  const newChildren = render(newValue);

  // 渲染 children
  reconcileChildren(workInProgress, newChildren);

  return workInProgress.child;
}

// 使用 Consumer
<ThemeContext.Consumer>
  {value => <button theme={value}>Click</button>}
</ThemeContext.Consumer>
```

Context 消费与性能优化：

```typescript
// 问题：Context 值变化会导致所有消费者重新渲染
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: 'John' });

  return (
    // ❌ theme 变化会导致所有组件重新渲染
    <ThemeContext.Provider value={theme}>
      <Header />      // 也会重新渲染
      <Content />     // 也会重新渲染
      <Footer />      // 也会重新渲染
    </ThemeContext.Provider>
  );
}

// 优化：拆分 Context
const ThemeContext = React.createContext('light');
const UserContext = React.createContext(null);

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: 'John' });

  return (
    // theme 和 user 分开，各自变化不会影响对方
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <Header />
        <Content />
        <Footer />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

// 进一步优化：使用 useMemo 稳定 Provider value
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: 'John' });

  // 只有 user 变化时才创建新对象
  const userValue = useMemo(() => ({ user }), [user]);

  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={userValue}>
        <Header />
        <Content />
        <Footer />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
```

---

## 八、自定义 Hook

### 8.1 自定义 Hook 模式

自定义 Hook 是一个函数，其名称以 `use` 开头，可以调用其他 Hook。自定义 Hook 让我们可以在函数组件中复用有状态的逻辑。

```typescript
// 自定义Hook本质上就是函数
// 只是它调用了React的Hook

// useOnlineStatus.js
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 使用自定义Hook
function StatusBar() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {isOnline ? '在线' : '离线'}
    </div>
  );
}
```

自定义 Hook 的"魔力"来自于每次使用都会创建独立的 state 和 effect：

```typescript
// 每次调用 useOnlineStatus 都会得到独立的 state
function App() {
  const status1 = useOnlineStatus(); // 独立的 state
  const status2 = useOnlineStatus(); // 另一个独立的 state

  console.log(status1 === status2); // false - 它们是独立的
}
```

### 8.2 useDebounce 实现

防抖 Hook 用于延迟更新，常用于搜索输入等场景：

```typescript
// useDebounce.js
function useDebounce(value, delay = 500) {
  // 使用 useMemo 缓存防抖后的值
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 设置定时器，在 delay 毫秒后更新
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：如果 value 变化，清除之前的定时器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用示例
function SearchComponent() {
  const [query, setQuery] = useState('');

  // 防抖后的搜索词，500ms 内没有新输入才会更新
  const debouncedQuery = useDebounce(query, 500);

  // 当 debouncedQuery 变化时执行搜索
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      {results.map(r => <ResultItem key={r.id} result={r} />)}
    </div>
  );
}
```

### 8.3 useLocalStorage 实现

本地存储 Hook，用于持久化状态：

```typescript
// useLocalStorage.js
function useLocalStorage(key, initialValue) {
  // 使用 useState 初始化，优先从 localStorage 读取
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // 解析 JSON，如果失败返回初始值
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 同步更新 localStorage 的 useEffect
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// 使用示例
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 16);

  return (
    <div>
      <select
        value={theme}
        onChange={e => setTheme(e.target.value)}
      >
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>

      <input
        type="range"
        min="12"
        max="24"
        value={fontSize}
        onChange={e => setFontSize(Number(e.target.value))}
      />
    </div>
  );
}
```

### 8.4 useAsync 实现

异步数据获取 Hook，封装加载状态、错误处理和数据缓存：

```typescript
// useAsync.js
function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setValue(response);
      setStatus('success');
    } catch (e) {
      setError(e);
      setStatus('error');
    }
  }, [asyncFunction]);

  // immediate 为 true 时自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    value,
    error,
    // 便捷属性
    isIdle: status === 'idle',
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}

// 使用示例
function UserProfile({ userId }) {
  const fetchUser = useCallback(
    (id) => fetch(`/api/users/${id}`).then(r => r.json()),
    []
  );

  const {
    status,
    value: user,
    error,
    execute: refresh
  } = useAsync(
    () => fetchUser(userId),
    true // 立即执行
  );

  if (status === 'idle') return 'Not started';
  if (status === 'pending') return 'Loading...';
  if (status === 'error') return `Error: ${error.message}`;
  if (status === 'success') {
    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <button onClick={refresh}>刷新</button>
      </div>
    );
  }
}
```

---

## 九、React 19 新 Hook

### 9.1 use()：Promise 消费

`use` 是 React 19 引入的新 Hook，它允许在组件中"消费" Promise 和 Context，打破了 Hook 不能在条件语句中调用的限制。

```typescript
// use的基本用法 - 消费Promise
function UserProfile({ userPromise }) {
  // use会暂停渲染直到Promise resolved
  // 然后用resolved的值继续渲染
  const user = use(userPromise);

  return <h1>{user.name}</h1>;
}

// 相当于之前的写法
function UserProfile({ userPromise }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    userPromise.then(setUser);
  }, [userPromise]);

  if (!user) return <Loading />;
  return <h1>{user.name}</h1>;
}
```

`use` 与 `useEffect` 的区别：

```typescript
// useEffect - 副作用，不能返回值
function UserProfile({ userPromise }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    userPromise.then(setUser);
  }, [userPromise]);

  // user 初始化为 null，所以初始渲染不显示用户
  return user ? <h1>{user.name}</h1> : <Loading />;
}

// use - 可以返回值，渲染会等待Promise
function UserProfile({ userPromise }) {
  // 渲染会等待Promise，然后带着resolved值渲染
  const user = use(userPromise);

  // 不需要null检查，不需要Loading
  return <h1>{user.name}</h1>;
}
```

`use` 也支持 Context：

```typescript
// use消费Context
function ThemedButton() {
  // 类似于 useContext，但 use 可以用在条件语句中
  const theme = use(ThemeContext);

  return <button className={theme}>Click</button>;
}

// 这在条件渲染中很有用
function Article({ showAuthor }) {
  if (showAuthor) {
    // 这里是有效的 - use可以在条件中调用
    const author = use(AuthorContext);
    return (
      <div>
        <ArticleContent />
        <Author name={author.name} />
      </div>
    );
  }

  return <ArticleContent />;
}
```

### 9.2 useOptimistic：乐观更新

`useOptimistic` 是 React 19 引入的 Hook，用于实现乐观更新（optimistic updates）—— 即先更新 UI，再等待服务器确认。

```typescript
// 传统的做法 - 需要处理加载状态
function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);

  const handleLike = async () => {
    const previousLikes = likes;

    // 乐观更新
    setLikes(l => l + 1);
    setIsPending(true);

    try {
      await likePost();
    } catch {
      // 失败，回滚
      setLikes(previousLikes);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button onClick={handleLike} disabled={isPending}>
      👍 {likes}
    </button>
  );
}

// useOptimistic - React 原生支持
import { useOptimistic, useState } from 'react';

function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);

  // useOptimistic 返回 [optimistic状态, 乐观更新函数]
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,  // 当前状态
    (state, newValue) => state + newValue // 乐观更新函数
  );

  const handleLike = async () => {
    // 立即更新 UI
    addOptimisticLike(1);

    // 等待服务器响应
    // 如果失败，React会自动回滚
    await likePost();
  };

  return <button onClick={handleLike}>👍 {optimisticLikes}</button>;
}
```

### 9.3 useActionState：表单状态

`useActionState` 是 React 19 引入的 Hook，专门用于管理表单 action 的状态。

```typescript
// React 19 之前 - 使用 useFormState (React 18.3)
import { useFormState } from 'react-dom';

function MyForm() {
  const [state, formAction] = useFormState(asyncFunction, initialState);

  return (
    <form action={formAction}>
      <input name="name" />
      <button type="submit">提交</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}

// React 19 - 使用 useActionState
import { useActionState } from 'react';

async function submitForm(prevState, formData) {
  const name = formData.get('name');

  const result = await submitName(name);

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
}

function MyForm() {
  // useActionState 管理所有状态：pending、error、success
  const [state, formAction, isPending] = useActionState(
    submitForm,  // async function
    null         // initial state
  );

  return (
    <form action={formAction}>
      <input name="name" />
      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>

      {state?.error && <p style={{color: 'red'}}>{state.error}</p>}
      {state?.success && <p style={{color: 'green'}}>提交成功！</p>}
    </form>
  );
}
```

### 9.4 useFormStatus

`useFormStatus` 是一个新的 Hook，用于在 Form 组件内部获取表单的状态信息。

```typescript
// 父组件定义 Form
function ContactForm() {
  async function submitAction(formData) {
    await sendEmail(formData);
  }

  return (
    <form action={submitAction}>
      <input name="email" type="email" />
      <SubmitButton /> {/* 子组件使用 useFormStatus */}
    </form>
  );
}

// SubmitButton 使用 useFormStatus
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}
```

`useFormStatus` 返回的对象包含：

| 属性 | 类型 | 说明 |
|------|------|------|
| `pending` | boolean | 表单是否正在提交 |
| `data` | FormData | 表单数据 |
| `method` | string | 表单 method (GET/POST) |
| `action` | string | 表单 action URL |

---

## 十、Hook 原理总结

### 10.1 链表存储

React Hooks 使用链表来存储每个组件的所有 Hook 状态。每个 Hook 节点包含状态值和指向下一个 Hook 的指针。

```typescript
// 链表结构示意
fiber.memoizedState = hook1
      |
      v
    hook1: { state: 0, queue: {...}, next: hook2 }
      |
      v
    hook2: { state: [], queue: {...}, next: hook3 }
      |
      v
    hook3: { state: '', queue: {...}, next: null }
```

为什么选择链表而不是数组？

```typescript
// 数组的问题：
// 1. React 需要在编译时就知道有多少个 Hook
// 2. 但实际上 Hook 数量是动态的

// 链表的优势：
// 1. 可以在运行时动态添加 Hook
// 2. 只需要头指针，就能遍历所有 Hook
// 3. 插入/删除操作 O(1)（在当前渲染中）
```

链表的遍历过程：

```typescript
// 每次渲染时的遍历
function renderWithHooks(workInProgress) {
  // 重置全局变量
  currentlyRenderingFiber = workInProgress;
  workInProgressHook = null;

  // 重置当前 Hook 索引
  currentHookIndex = 0;

  // 执行组件函数
  // 组件内部调用 useXxx() 时，会：
  // 1. 获取/创建当前索引的 Hook
  // 2. 移动到下一个索引
  children = Component(props);

  // 清理
  currentlyRenderingFiber = null;
  workInProgressHook = null;
}
```

### 10.2 顺序调用

Hook 必须按照相同的顺序调用，这是 React 能够正确关联 Hook 和状态的基石。

```typescript
// 正确的调用顺序
function Component() {
  const [a, setA] = useState(1);   // Hook 1
  const [b, setB] = useState(2);   // Hook 2
  const [c, setC] = useState(3);   // Hook 3

  // React 内部知道：
  // Hook 1 -> state a
  // Hook 2 -> state b
  // Hook 3 -> state c
}

// 错误的调用顺序 - 会导致bug
function Component({ show }) {
  if (show) {
    const [a, setA] = useState(1);  // 可能不执行！
  }

  const [c, setC] = useState(3);   // React 认为这是 Hook 2

  // 如果 show 为 false，第一次渲染跳过 Hook 1
  // 第二次渲染 show 变为 true，但 React 以为 Hook 1 是 c！
}
```

React 如何检测调用顺序错误：

```typescript
// React 内部会在开发模式检测 Hook 调用顺序
let hookIndexDev = 0;

function useState(initialValue) {
  if (isMounted) {
    // 更新阶段
    const hook = getHookByIndex(hookIndexDev);
    hookIndexDev++;
    return [hook.state, createDispatch(hook)];
  } else {
    // 挂载阶段
    const hook = createNewHook(hookIndexDev);
    hookIndexDev++;
    return [hook.state, createDispatch(hook)];
  }
}

// 如果组件中有条件调用 Hook
// React 会检测到 hookIndexDev 在两次渲染间不一致
// 并在开发环境发出警告
```

### 10.3 规则的原因

Hook 规则是 React 架构的必然结果，理解了底层原理就能理解为什么需要这些规则。

**规则一：只在顶层调用 Hook**

```typescript
// React 依赖 Hook 的"位置"来匹配状态
// 如果 Hook 在条件语句中，位置会变化

// 第一次渲染（show = true）
const [a, setA] = useState(0);     // 位置 0
if (show) {
  const [b, setB] = useState(0);   // 位置 1
}
const [c, setC] = useState(0);     // 位置 2

// 第二次渲染（show = false）
// React 按位置读取状态：
// 位置 0 -> a ✓
// 位置 1 -> c ✗ (应该是 b，但 b 不存在！)
// 位置 2 -> ??? (不存在)
```

**规则二：只在 React 函数中调用 Hook**

```typescript
// 普通函数中调用 Hook 意味着：
// 1. 没有 fiber 关联 - React 不知道在哪里存储状态
// 2. 调用顺序不稳定 - 普通函数可以被任意调用

function helper() {
  const [x, setX] = useState(0); // 什么时候调用？调用几次？
}

function Component() {
  if (condition) {
    helper(); // 可能调用
  }
  helper(); // 或者不调用
  helper(); // 调用两次？
}

// React 无法知道 helper 中有几个 Hook
// 每次 helper 被调用的次数可能不同
```

**自定义 Hook 例外**

```typescript
// 自定义 Hook 可以调用其他 Hook
// 因为自定义 Hook 的调用顺序是稳定的

function useCustomHook() {
  // 这个 Hook 的位置取决于 useCustomHook() 在组件中的位置
  const [a, setA] = useState(0); // 位置 0 (相对于 useCustomHook)
  const [b, setB] = useState(0); // 位置 1

  return [a, b];
}

function Component() {
  // 第一次调用
  const [x, y] = useCustomHook(); // x 对应 a, y 对应 b

  // 第二次调用 - 独立的 state
  const [m, n] = useCustomHook(); // m 对应 a, n 对应 b
}
```

### 10.4 实战：手写简化 useState

通过实现一个简化版的 useState，我们可以更深入地理解 React Hooks 的工作原理。

```typescript
// 简化的 React Hooks 实现

// 全局变量 - 模拟 React 的运行时
let currentComponent = null;
let currentHookIndex = 0;

// 组件的 Hook 状态存储
const allState = [];

// useState 实现
function useState(initialState) {
  // 计算当前 Hook 在链表中的位置
  const hookIndex = currentHookIndex;

  // 初始化或获取状态
  if (allState[hookIndex] === undefined) {
    // 初始化：处理函数式初始值
    const initial = typeof initialState === 'function'
      ? initialState()
      : initialState;

    allState[hookIndex] = {
      state: initial,
      queue: [], // 更新队列
    };
  }

  // 获取当前状态
  const state = allState[hookIndex].state;

  // 创建 setState 函数
  const setState = (action) => {
    const newValue = typeof action === 'function'
      ? action(allState[hookIndex].state)
      : action;

    // 如果值没变，不触发更新
    if (newValue === allState[hookIndex].state) {
      return;
    }

    // 更新状态
    allState[hookIndex].state = newValue;

    // 触发重新渲染
    rerender();
  };

  // 移动到下一个 Hook
  currentHookIndex++;

  return [state, setState];
}

// 重新渲染函数
function rerender() {
  currentHookIndex = 0;
  try {
    currentComponent();
  } catch (e) {
    console.error('Render error:', e);
  }
}

// 创建组件的工厂函数
function createComponent(renderFn) {
  currentComponent = renderFn;
  return function() {
    currentHookIndex = 0;
    renderFn();
  };
}

// 使用示例

const Counter = createComponent(function() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Counter');

  console.log(`Render: ${name} = ${count}`);

  // 模拟一些操作
  if (count === 0 && Math.random() > 0.5) {
    setCount(1); // 可能会触发更新
  }

  return { count, setCount, name, setName };
});

// 初始渲染
console.log('=== 第一次渲染 ===');
Counter();

// 模拟更新
console.log('=== 模拟更新 ===');
// 直接调用 useState 返回的 setState 会自动触发重新渲染
// 但在这个简化实现中，我们需要手动 rerender

// 真实 React 中:
// <button onClick={() => setCount(c => c + 1)}>
// 点击后 React 会自动调用 rerender
```

更完整的实现（包含批量更新和调度）：

```typescript
// 完整的简化 useState 实现

let currentFiber = null;
let currentHookIndex = 0;

// 更新队列
const updateQueue = [];
let isBatching = false;

function scheduleUpdate() {
  if (!isBatching) {
    // 非批量模式：立即更新
    flushUpdates();
  } else {
    // 批量模式：加入队列
    updateQueue.push(currentFiber);
  }
}

function flushUpdates() {
  while (updateQueue.length > 0) {
    const fiber = updateQueue.shift();
    fiber.component();
  }
}

function useState(initialState) {
  const hookIndex = currentHookIndex;
  const hook = currentFiber.memoizedState[hookIndex];

  if (!hook) {
    // 初始化
    const initial = typeof initialState === 'function'
      ? initialState()
      : initialState;

    const newHook = {
      memoizedState: initial,
      queue: { pending: null },
      next: null,
    };

    // 链接到链表
    if (hookIndex === 0) {
      currentFiber.memoizedState = newHook;
    } else {
      currentFiber.memoizedState[hookIndex - 1].next = newHook;
    }

    currentFiber.memoizedState[hookIndex] = newHook;
    hook = newHook;
  }

  const state = hook.memoizedState;

  const setState = (action) => {
    const update = {
      action: typeof action === 'function' ? action : () => action,
      next: null,
    };

    // 加入队列
    if (!hook.queue.pending) {
      hook.queue.pending = update;
    } else {
      let last = hook.queue.pending;
      while (last.next) last = last.next;
      last.next = update;
    }

    // 调度更新
    scheduleUpdate();
  };

  currentHookIndex++;
  return [state, setState];
}

// 模拟 React 的渲染过程
function renderComponent(fiber) {
  currentFiber = fiber;
  currentHookIndex = 0;

  const children = fiber.type(fiber.props);

  // 处理更新队列
  let hook = fiber.memoizedState;
  while (hook) {
    if (hook.queue.pending) {
      let update = hook.queue.pending;
      while (update) {
        hook.memoizedState = update.action(hook.memoizedState);
        update = update.next;
      }
      hook.queue.pending = null;
    }
    hook = hook.next;
  }

  return children;
}
```

---

## 总结

React Hooks 是 React 团队多年思考和迭代的产物。通过这篇文档，我们深入探讨了 Hooks 的底层实现：

1. **Hook 的本质是状态钩子** - 通过链表和稳定的调用顺序，React 能够精确管理每个 Hook 的状态。

2. **dispatchAction 是核心** - 它将更新操作加入队列，并在适当的时机调度重新渲染。批量更新是 React 性能优化的关键。

3. **useEffect 的调度机制** - React 在渲染和绘制完成后异步执行副作用，这避免了阻塞 UI。

4. **useRef 的稳定性** - ref 对象在多次渲染中保持稳定，这使得它适合存储副作用相关的引用。

5. **useCallback/useMemo** - 通过缓存函数和计算结果，避免不必要的重新渲染，但需要谨慎使用避免过度优化。

6. **useContext 的广播机制** - Context 通过 Provider 向下广播值，依赖该 Context 的组件会在值变化时重新渲染。

7. **自定义 Hook 是组合的体现** - 通过提取和组合内置 Hook，我们可以创建可复用的逻辑单元。

8. **React 19 新 Hook 解决了更复杂的问题** - use()、useOptimistic、useActionState 等让 React 的声明式编程更加强大。

理解这些底层原理，不仅能帮助我们更好地使用 Hook，还能让我们在设计和实现自己的抽象时更加得心应手。React Hooks 的设计体现了函数式编程和响应式编程的精髓，是现代前端开发不可或缺的重要知识。

---

**文档信息**

- 字数：约 18000 字
- 最后更新：2026 年 4 月
- 参考版本：React 19
- 适用读者：希望深入理解 React Hooks 原理的前端开发者
