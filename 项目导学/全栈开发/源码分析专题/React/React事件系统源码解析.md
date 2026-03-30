# React 事件系统源码解析

## 一、事件系统概述

### 1.1 React 事件系统的设计目标

React 16 之前采用原生事件绑定，v17+ 改为委托到 root。这种设计带来以下优势：

| 特性 | 描述 | 优势 |
|------|------|------|
| **事件委托** | 所有事件委托到 root | 减少内存占用，统一管理 |
| **自动绑定** | 自动绑定 this | 避免手动绑定 |
| **跨浏览器** | 统一事件接口 | 兼容各种浏览器 |
| **批量更新** | 事件处理函数中的 setState 自动批量 | 减少渲染次数 |

### 1.2 React 17 前后的变化

**React 16 及之前**：事件委托到 document
**React 17+**：事件委托到 root 容器

```
React 16：
┌─────────────────────────────────────────┐
│           document                      │
│  ┌───────────────────────────────────┐ │
│  │     onClick → 事件委托到这里       │ │
│  └───────────────────────────────────┘ │
│              ↑                         │
│         所有事件                        │
└─────────────────────────────────────────┘

React 17+：
┌─────────────────────────────────────────┐
│         #root                           │
│  ┌───────────────────────────────────┐ │
│  │     onClick → 事件委托到这里       │ │
│  └───────────────────────────────────┘ │
│              ↑                         │
│         所有事件                        │
└─────────────────────────────────────────┘
```

## 二、合成事件（SyntheticEvent）

### 2.1 SyntheticEvent 定义

SyntheticEvent 是 React 封装的跨浏览器原生事件对象：

```typescript
// packages/events/src/SyntheticEvent.js

function SyntheticEvent(
  reactName: string | null,
  onClickDispatch: Function,
  targetInst: Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget
) {
  // 事件名称（如 onClick）
  this.dispatchConfig = reactName;

  // 指向对应的 Fiber 节点
  this._targetInst = targetInst;

  // 原生事件对象
  this.nativeEvent = nativeEvent;

  // 原生事件目标
  this.target = nativeEventTarget;

  // 当前事件响应函数
  this.dispatchMarker = null;

  // 是否已阻止冒泡
  this._propaGated = false;

  // 事件池相关
  this._handlePropagationChanged = false;
}
```

### 2.2 事件池与性能

React 使用事件池来复用事件对象，减少 GC 压力：

```typescript
// packages/events/src/SyntheticEvent.js

// 事件池
const eventPool = [];

// 从池中获取或创建事件
function getPooledEvent(event): SyntheticEvent {
  if (eventPool.length > 0) {
    const instance = eventPool.pop();
    // 重置事件属性
    Object.assign(instance, event);
    instance._currentTarget = null;
    return instance;
  }
  return new SyntheticEvent(...);
}

// 释放事件回池
function releasePooledEvent(event): void {
  // 重置属性以便复用
  event.destructor?.();
  eventPool.push(event);
}
```

**事件池使用示例**：

```typescript
// 事件处理函数中
function handleClick(e) {
  // e 是从事件池中获取的

  console.log(e.type);  // 'click'

  // 事件处理完毕后，React 会将事件释放回池
}

// 事件不会被自动持久化
// 如果需要异步访问事件，使用 e.persist()
function handleClick(e) {
  e.persist();  // 从池中移除，可以安全地异步访问

  setTimeout(() => {
    console.log(e.type);  // 仍然可以访问
  }, 100);
}
```

### 2.3 SyntheticEvent 的接口

```typescript
// SyntheticEvent 提供的接口
interface SyntheticEvent {
  // 事件属性
  bubbles: boolean;           // 是否冒泡
  cancelable: boolean;       // 是否可取消
  currentTarget: EventTarget; // 当前事件目标
  defaultPrevented: boolean; // 是否调用了 preventDefault
  eventPhase: number;        // 事件阶段
  isTrusted: boolean;        // 是否是浏览器原生事件

  // 方法
  preventDefault(): void;     // 阻止默认行为
  stopPropagation(): void;    // 阻止冒泡
  persist(): void;           // 从事件池中移除

  // React 18 移除的方法
  isDefaultPrevented(): boolean;
  isPropagationStopped(): boolean;
}
```

## 三、事件委托到 root

### 3.1 事件委托机制

React 17 之前，所有事件被委托到 document；React 17+ 委托到 root 容器：

```typescript
// packages/react-dom/src/events/DOMPluginEventSystem.js

// 事件委托到 root
function listenToAllSupportedEvents(container) {
  // 获取所有支持的事件
  const allNativeEventToReactListener = getEventSettingsForBrowser();

  // 逐个绑定到 root
  for (const eventName of allNativeEventToReactListener) {
    const isCapturePhaseListener = ...;

    // 绑定事件监听
    trapEventForPluginEventSystem(
      container,
      eventName,
      isCapturePhaseListener
    );
  }
}

// 实际绑定函数
function trapEventForPluginEventSystem(
  container: Element,
  reactEventName: string,
  isCapturePhaseListener: boolean
) {
  // 获取原生事件名
  const nativeEventName = reactEventName.slice(2).toLowerCase();

  const listener = dispatchEvent.bind(null, reactEventName);

  // 绑定到容器
  if (isCapturePhaseListener) {
    container.addEventListener(nativeEventName, listener, true);
  } else {
    container.addEventListener(nativeEventName, listener, false);
  }
}
```

### 3.2 dispatchEvent 实现

```typescript
// packages/react-dom/src/events/ReactDOMEventListener.js

// 事件分发入口
function dispatchEvent(
  reactEventName: string,  // 如 'click'
  domEventName: string,     // 如 'click'
  targetInst: Fiber | null,
  nativeEvent: Event
) {
  // 获取本次更新的优先级
  const lane = requestUpdateLane();

  // 创建离散事件
  const syntheticEvent = createSyntheticEvent(
    reactEventName,
    getPluginModuleForEvent(domEventName),
    targetInst,
    nativeEvent
  );

  // 批量处理
  runEventsInBatch(
    dispatchEvents,
    noop // 无 flush
  );

  // 执行事件处理函数
  processDispatchQueue(syntheticEvent);
}
```

### 3.3 事件处理流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 事件处理流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户点击 → 浏览器触发事件                                          │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                           │
│  │  root.addEventListener          │                           │
│  │  ('click', dispatchEvent)        │                           │
│  └─────────────────────────────────┘                           │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                           │
│  │  dispatchEvent(reactEventName)   │                           │
│  │  - 创建 SyntheticEvent           │                           │
│  │  - 收集所有监听器                 │                           │
│  │  - 批量处理                       │                           │
│  └─────────────────────────────────┘                           │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                           │
│  │  traverseTwoPhase (冒泡阶段)    │                           │
│  │  - [capture] parent.onClick     │ ← 先执行捕获阶段          │
│  │  - [bubble] child.onClick       │ ← 再执行冒泡阶段          │
│  └─────────────────────────────────┘                           │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                           │
│  │  executeDispatches              │                           │
│  │  - 调用实际的事件处理函数         │                           │
│  │  - 传递合成事件对象               │                           │
│  └─────────────────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 四、批处理（Batch Updates）

### 4.1 自动批处理

React 18 实现了自动批处理，所有状态更新都会自动批量处理：

```typescript
// React 18 之前的批处理（需要使用 ReactDOM.unstable_batchedUpdates）
function handleClick() {
  // 不会批量，需要手动批处理
  ReactDOM.unstable_batchedUpdates(() => {
    setCount(c => c + 1);
    setName('new name');
  });
}

// React 18+ 的自动批处理
function handleClick() {
  // 自动批量，不需要手动处理
  setCount(c => c + 1);
  setName('new name');
  // 最终只会触发一次重新渲染
}
```

### 4.2 批处理实现

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

// 批量更新处理
function batchedUpdates(fn) {
  const prevExecutionContext = executionContext;

  // 设置批量更新上下文
  executionContext |= BatchedContext;

  try {
    return fn();
  } finally {
    executionContext = prevExecutionContext;

    // 如果退出到非批量上下文，执行更新
    if (executionContext === NoContext) {
      flushSyncCallbackQueue();
    }
  }
}

// 离散更新（如 click 事件）
function discreteUpdates(fn) {
  const prevExecutionContext = executionContext;

  // 设置离散更新上下文
  executionContext |= DiscreteEventContext;

  try {
    return fn();
  } finally {
    executionContext = prevExecutionContext;

    // 立即同步执行
    flushSyncCallbackQueue();
  }
}
```

### 4.3 不同场景下的批处理

| 场景 | React 17 | React 18+ |
|------|----------|-----------|
| 事件处理函数 | 自动批处理 | 自动批处理 |
| setTimeout | 不批处理 | 自动批处理 |
| Promise | 不批处理 | 自动批处理 |
| 原生事件 | 不批处理 | 自动批处理 |

## 五、事件插件系统

### 5.1 插件类型

React 事件系统使用插件架构：

```typescript
// packages/react-dom/src/events/DOMEventProperties.js

// 内置插件
const plugins = [
  SimpleEventPlugin,      // click, input, keydown 等
  EnterLeaveEventPlugin,   // mouseenter, mouseleave
  ChangeEventPlugin,       // onChange
  SelectEventPlugin,      // onSelect
  BeforeInputEventPlugin,  // onBeforeInput
  AnalyticsEventPlugin,    // 自定义事件
];

// 事件名到插件的映射
const eventPluginDispatch = {
  'click': SimpleEventPlugin,
  'mouseenter': EnterLeaveEventPlugin,
  'change': ChangeEventPlugin,
  // ...
};
```

### 5.2 SimpleEventPlugin

处理大多数简单事件：

```typescript
// packages/react-dom/src/events/SimpleEventPlugin.js

const SimpleEventPlugin = {
  eventTypes: {
    // 事件类型定义
    click: {
      phasedRegistrationNames: {
        bubbled: 'onClick',
        captured: 'onClickCapture',
      },
      dependencies: ['click'],
    },
    input: {
      phasedRegistrationNames: {
        bubbled: 'onInput',
        captured: 'onInputCapture',
      },
      dependencies: ['input'],
    },
    // ...
  },

  // 从原生事件提取合成事件
  extractEvents: function(
    eventName: string,
    targetInst: Fiber,
    nativeEvent: Event,
    nativeEventTarget: EventTarget
  ) {
    const EventConstructor = ...; // 根据事件选择事件构造函数

    const event = new EventConstructor(
      eventName,
      null,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );

    return event;
  },
};
```

### 5.3 ChangeEventPlugin

处理表单 change 事件：

```typescript
// packages/react-dom/src/events/ChangeEventPlugin.js

const ChangeEventPlugin = {
  eventTypes: ['change'],

  extractEvents: function(
    eventName,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    const { type, target } = getEventTarget(nativeEvent);

    const event = new SyntheticEvent(
      'onChange',
      null,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );

    // 获取新值和旧值
    const newValue = getValue(target);
    const oldValue = target._value || '';

    // 存储到事件对象
    event.target = target;

    return event;
  },
};
```

### 5.4 EnterLeaveEventPlugin

处理 mouseenter/mouseleave 事件：

```typescript
// packages/react-dom/src/events/EnterLeaveEventPlugin.js

const EnterLeaveEventPlugin = {
  eventTypes: ['mouseEnter', 'mouseLeave'],

  extractEvents: function(
    eventName,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    // mouseenter 不冒泡，用 relatedTarget 检测
    const { type, relatedTarget } = nativeEvent;

    if (type === 'mouseenter') {
      // 进入事件
      const from = relatedTarget;
      const to = nativeEventTarget;

      // 如果进入的是子元素，不触发
      if (isRelatedDOMEvent(from, to)) {
        return null;
      }

      return createSyntheticEvent('onMouseEnter', targetInst, nativeEvent);
    }

    if (type === 'mouseleave') {
      // 离开事件
      return createSyntheticEvent('onMouseLeave', targetInst, nativeEvent);
    }
  },
};
```

## 六、事件传播与处理

### 6.1 两阶段传播

React 事件分为**捕获阶段**和**冒泡阶段**：

```typescript
// packages/react-reconciler/src/ReactDOMEventEmitter.js

// 收集路径上的所有监听器
function accumulateEventDispatchQueue(events, dispatchQueue) {
  for (let i = 0; i < events.length; i++) {
    const { event, target } = events[i];

    // 收集路径上的监听器
    const path = getEventPath(target);
    const listeners = [];

    // 捕获阶段：从根到目标
    for (let j = path.length - 1; j >= 0; j--) {
      const node = path[j];
      const listeners = getListenersAtNode(node, event);

      for (const listener of listeners) {
        if (listener.capture) {
          listeners.unshift(listener);
        }
      }
    }

    // 冒泡阶段：从目标到根
    for (const node of path) {
      const listeners = getListenersAtNode(node, event);

      for (const listener of listeners) {
        if (!listener.capture) {
          listeners.push(listener);
        }
      }
    }
  }
}
```

### 6.2 dispatchQueue 处理顺序

```typescript
// packages/react-dom/src/events/ReactDOMEventEmitter.js

// 处理事件分发队列
function processDispatchQueue(dispatchQueue, event) {
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { instance, listener } = dispatchQueue[i];

    // 事件被停止传播
    if (event.isPropagationStopped()) {
      return;
    }

    // 调用监听器
    listener(event);
  }
}
```

### 6.3 阻止事件传播

```typescript
// 阻止冒泡
function handleClick(e) {
  e.stopPropagation();  // 阻止事件向上冒泡
}

// 阻止默认行为
function handleSubmit(e) {
  e.preventDefault();  // 阻止表单提交
}

// React 18 中推荐的方式
function handleClick(e) {
  e.stopPropagation();
}
```

## 七、事件与 Fiber 的关联

### 7.1 Fiber 节点存储事件监听

```typescript
// packages/react-reconciler/src/ReactFiberBeginWork.js

function diffProperties(
  updatePayload: Array<any>,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Element
) {
  let propKey;
  let styleName;
  let styleUpdates;

  for (propKey in newProps) {
    if (propKey === 'onClick') {
      // 特殊处理 onClick 等事件监听
      const onClick = newProps[propKey];

      // 将事件监听存储到 fiber.pendingProps
      // 后续在 commit 阶段绑定
      fiber.pendingProps = {
        ...fiber.pendingProps,
        onClick,
      };
    }
  }
}
```

### 7.2 commit 阶段绑定事件

```typescript
// packages/react-reconciler/src/ReactFiberCommitWork.new.js

function commitListenToPort(root) {
  // 获取 root 上的所有事件监听
  const reactEventListeners = root.memoizedProps;

  // 绑定到 DOM
  for (const eventName in reactEventListeners) {
    if (reactEventListeners.hasOwnProperty(eventName)) {
      const listener = reactEventListeners[eventName];

      // 绑定到 root 容器（不是各个节点）
      root.containerInfo.addEventListener(
        getNativeEventName(eventName),
        dispatchEvent,
        listener.capture
      );
    }
  }
}
```

## 八、常见事件处理模式

### 8.1 事件处理函数中的 this 绑定

```typescript
// 方式 1：使用箭头函数（推荐）
class MyComponent extends React.Component {
  handleClick = () => {
    console.log(this);  // 指向组件实例
  };

  render() {
    return <button onClick={this.handleClick}>点击</button>;
  }
}

// 方式 2：在 render 中绑定
class MyComponent extends React.Component {
  handleClick() {
    console.log(this);
  }

  render() {
    return <button onClick={this.handleClick.bind(this)}>点击</button>;
  }
}

// 方式 3：使用 public class fields 语法
class MyComponent extends React.Component {
  handleClick() {
    console.log(this);
  }

  render() {
    return <button onClick={() => this.handleClick()}>点击</button>;
  }
}
```

### 8.2 传递参数到事件处理函数

```typescript
// 方式 1：箭头函数包装
function MyComponent({ id }) {
  return (
    <button onClick={() => handleClick(id)}>
      删除 {id}
    </button>
  );
}

// 方式 2：bind 绑定参数
function MyComponent({ id }) {
  return (
    <button onClick={handleClick.bind(null, id)}>
      删除 {id}
    </button>
  );
}

// 方式 3：在事件对象中访问
function MyComponent({ id }) {
  return (
    <button
      onClick={(e) => {
        console.log(e.target.dataset.id);  // 通过 dataset 访问
      }}
      data-id={id}
    >
      删除
    </button>
  );
}
```

### 8.3 事件防抖与节流

```typescript
// 使用 useCallback + setTimeout 实现节流
function useThrottle(callback, delay) {
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback(
    (...args) => {
      if (!timeoutRef.current) {
        callback(...args);
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
        }, delay);
      }
    },
    [callback, delay]
  );

  return throttledCallback;
}

// 使用
function SearchComponent() {
  const handleSearch = useThrottle((query) => {
    fetch(`/api/search?q=${query}`);
  }, 300);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

## 九、总结

### 9.1 核心要点

1. **SyntheticEvent**：React 封装的跨浏览器事件对象
2. **事件委托**：所有事件委托到 root 容器
3. **插件系统**：通过插件处理不同类型的事件
4. **批处理**：React 18+ 自动批处理所有更新
5. **两阶段传播**：捕获阶段 + 冒泡阶段

### 9.2 后续章节预告

- **Scheduler 调度机制**：深入理解 lanes 模型和时间切片
- **React Server Components**：服务端组件的实现原理
