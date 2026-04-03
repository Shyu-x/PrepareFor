# useRef深度解析专业指南_2026

## 1. useRef概述

### 1.1 什么是useRef

`useRef`是React 16.8引入的核心Hook之一，它是一个用于创建可变引用对象的钩子函数。与传统的React状态管理不同，`useRef`创建的对象在组件的整个生命周期内保持引用一致性，且**修改ref.current不会触发组件重新渲染**。

```typescript
// useRef的基本定义
const refObject = useRef(initialValue);
```

### 1.2 useRef的核心特性

| 特性 | 说明 |
|------|------|
| **引用一致性** | 在组件的整个生命周期内，ref对象始终是同一个引用 |
| **持久化数据** | ref.current的值在多次渲染间保持不变 |
| **无渲染触发** | 修改ref.current不会触发组件重新渲染 |
| **可变性** | ref.current是可变的，可以随时修改 |
| **生命周期绑定** | ref对象的生命周期与组件实例绑定 |

### 1.3 useRef vs useState对比

```typescript
// useState：修改状态会触发重新渲染
const [count, setCount] = useState(0);
setCount(1); // 触发重新渲染

// useRef：修改ref.current不会触发重新渲染
const countRef = useRef(0);
countRef.current = 1; // 不触发重新渲染
```

### 1.4 useRef的设计哲学

`useRef`的设计体现了React的**"双轨制"**思想：

- **声明式渲染轨**：通过useState、useReducer管理状态，触发UI更新
- **命令式操作轨**：通过useRef管理可变引用，不触发UI更新

这种分离使得开发者可以精确控制哪些数据变化需要触发渲染，哪些只需要在内存中保持状态。

---

## 2. useRef基础用法

### 2.1 创建ref对象

```typescript
import { useRef } from 'react';

function MyComponent() {
  // 创建ref对象，初始值为null
  const myRef = useRef(null);
  
  // 创建ref对象，初始值为0
  const countRef = useRef(0);
  
  // 创建ref对象，初始值为对象
  const cacheRef = useRef({ data: null, timestamp: 0 });
  
  return <div>组件内容</div>;
}
```

### 2.2 访问和修改ref

```typescript
function Counter() {
  const countRef = useRef(0);
  
  const increment = () => {
    // 读取ref的值
    console.log('当前计数:', countRef.current);
    
    // 修改ref的值
    countRef.current += 1;
    console.log('更新后计数:', countRef.current);
  };
  
  return (
    <button onClick={increment}>
      点击次数: {countRef.current}
    </button>
  );
}
```

### 2.3 ref对象的结构

```typescript
// useRef返回的对象结构
interface RefObject<T> {
  current: T;
}

// 实际使用示例
const inputRef = useRef<HTMLInputElement>(null);

// 访问DOM元素
if (inputRef.current) {
  inputRef.current.focus(); // 安全地调用DOM方法
}
```

### 2.4 类组件中的ref对比

```typescript
// 类组件中的ref
class MyClassComponent extends React.Component {
  // 创建ref
  myRef = React.createRef<HTMLDivElement>();
  
  componentDidMount() {
    console.log(this.myRef.current); // 访问DOM元素
  }
  
  render() {
    return <div ref={this.myRef}>类组件ref</div>;
  }
}

// 函数组件中的ref
function MyFunctionComponent() {
  // 创建ref
  const myRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log(myRef.current); // 访问DOM元素
  }, []);
  
  return <div ref={myRef}>函数组件ref</div>;
}
```

---

## 3. useRef的内部机制

### 3.1 useRef的实现原理

React内部使用**Hook链表**来管理所有的Hook。useRef的实现非常简洁：

```typescript
// 简化的useRef实现原理
function useRef<T>(initialValue: T): { current: T } {
  // 创建hook对象
  const hook = createHook();
  
  // 初始化current值
  if (hook.memoizedState === null) {
    hook.memoizedState = {
      current: initialValue,
    };
  }
  
  return hook.memoizedState;
}
```

### 3.2 Hook链表结构

```
组件实例
  └── memoizedState (Hook链表)
      ├── Hook 1: useState
      ├── Hook 2: useRef
      │       └── memoizedState: { current: value }
      ├── Hook 3: useEffect
      └── Hook 4: useContext
```

### 3.3 渲染机制对比

```typescript
// useState的渲染机制
function useState(initialState) {
  const hook = createHook();
  
  // 每次setState都会标记组件为待更新
  const dispatch = dispatchSetState.bind(null, currentState);
  
  return [hook.memoizedState, dispatch];
}

// useRef的渲染机制
function useRef(initialValue) {
  const hook = createHook();
  
  // useRef不会触发更新，只是返回同一个对象
  return hook.memoizedState;
}
```

### 3.4 为什么useRef不触发渲染

React在调度更新时会检查Hook的类型：

```typescript
// React调度器伪代码
function scheduleUpdateOnFiber(fiber) {
  // 检查是否有状态变化
  if (fiber.pendingState !== null) {
    // 触发重新渲染
    performWork();
  }
}

// useRef不修改pendingState
function useRefUpdate() {
  // 只修改current值
  ref.current = newValue;
  // 不设置pendingState
  // 因此不会触发重新渲染
}
```

### 3.5 内存管理

```typescript
// useRef的内存特性
function Component() {
  const largeDataRef = useRef(new Array(1000000).fill(0));
  
  // 组件卸载时，ref对象会被垃圾回收
  // 但在组件生命周期内一直占用内存
  return <div>组件</div>;
}

// 最佳实践：及时清理大对象
useEffect(() => {
  return () => {
    largeDataRef.current = null; // 释放内存
  };
}, []);
```

---

## 4. useRef的五大使用场景

### 4.1 场景一：访问DOM元素

#### 4.1.1 基础DOM操作

```typescript
import { useRef, useEffect } from 'react';

function InputFocus() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 组件挂载后自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleClick = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };
  
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="点击按钮聚焦"
      />
      <button onClick={handleClick}>聚焦并选中</button>
    </div>
  );
}
```

#### 4.1.2 多DOM元素管理

```typescript
function MultipleInputs() {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // 添加ref到数组
  const setRef = (index: number) => (el: HTMLInputElement) => {
    inputRefs.current[index] = el;
  };
  
  // 聚焦第n个输入框
  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };
  
  return (
    <div>
      {[0, 1, 2].map(i => (
        <input
          key={i}
          ref={setRef(i)}
          placeholder={`输入框 ${i}`}
        />
      ))}
      <button onClick={() => focusInput(1)}>聚焦第二个输入框</button>
    </div>
  );
}
```

#### 4.1.3 DOM测量与操作

```typescript
function MeasureElement() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };
    
    // 初始测量
    updateDimensions();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  return (
    <div ref={containerRef} style={{ width: '50%', height: '200px', background: '#f0f0f0' }}>
      <p>容器宽度: {dimensions.width}px</p>
      <p>容器高度: {dimensions.height}px</p>
    </div>
  );
}
```

### 4.2 场景二：保存可变值（替代useState）

#### 4.2.1 计数器示例

```typescript
function CounterWithRef() {
  const countRef = useRef(0);
  const [displayCount, setDisplayCount] = useState(0);
  
  const increment = () => {
    countRef.current += 1;
    
    // 不立即更新UI，而是批量更新
    if (countRef.current % 10 === 0) {
      setDisplayCount(countRef.current);
    }
  };
  
  return (
    <div>
      <p>实际计数: {countRef.current}</p>
      <p>显示计数: {displayCount}</p>
      <button onClick={increment}>增加</button>
    </div>
  );
}
```

#### 4.2.2 防抖/节流值保存

```typescript
function DebouncedInput() {
  const valueRef = useRef<string>('');
  const [displayValue, setDisplayValue] = useState('');
  let debounceTimer: NodeJS.Timeout;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    valueRef.current = e.target.value;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setDisplayValue(valueRef.current);
    }, 300);
  };
  
  return (
    <div>
      <input
        type="text"
        onChange={handleChange}
        placeholder="输入内容（300ms防抖）"
      />
      <p>显示值: {displayValue}</p>
      <p>实际值: {valueRef.current}</p>
    </div>
  );
}
```

### 4.3 场景三：保存定时器ID

```typescript
function AutoRefresh() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 启动定时器
    timerRef.current = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
    
    // 清理定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
  
  const manualRefresh = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCount(0);
    timerRef.current = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);
  };
  
  return (
    <div>
      <p>自动刷新次数: {count}</p>
      <button onClick={manualRefresh}>手动重置</button>
    </div>
  );
}
```

### 4.4 场景四：保存回调函数引用

```typescript
function CallbackRefExample() {
  const callbackRef = useRef<() => void>(() => {
    console.log('初始回调');
  });
  
  const updateCallback = (newCallback: () => void) => {
    callbackRef.current = newCallback;
  };
  
  const executeCallback = () => {
    callbackRef.current();
  };
  
  return (
    <div>
      <button onClick={() => updateCallback(() => console.log('回调1'))}>
        设置回调1
      </button>
      <button onClick={() => updateCallback(() => console.log('回调2'))}>
        设置回调2
      </button>
      <button onClick={executeCallback}>执行回调</button>
    </div>
  );
}
```

### 4.5 场景五：保存任意可变数据

```typescript
function DataCache() {
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  const fetchData = async (key: string) => {
    // 检查缓存
    if (cacheRef.current.has(key)) {
      console.log('从缓存读取:', key);
      return cacheRef.current.get(key);
    }
    
    // 模拟API请求
    const data = { id: key, timestamp: Date.now() };
    cacheRef.current.set(key, data);
    console.log('从服务器获取:', key);
    return data;
  };
  
  const clearCache = () => {
    cacheRef.current.clear();
  };
  
  return (
    <div>
      <button onClick={() => fetchData('user1')}>获取用户1</button>
      <button onClick={() => fetchData('user1')}>再次获取用户1</button>
      <button onClick={clearCache}>清空缓存</button>
    </div>
  );
}
```

---

## 5. useRef与闭包

### 5.1 闭包问题的根源

```typescript
// 问题代码：闭包捕获了旧的state
function ProblematicComponent() {
  const [count, setCount] = useState(0);
  
  const logCount = () => {
    // 这里的count是闭包捕获的旧值
    setTimeout(() => {
      console.log('count:', count); // 总是输出0
    }, 1000);
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={logCount}>记录Count</button>
    </div>
  );
}
```

### 5.2 使用useRef解决闭包问题

```typescript
// 解决方案：使用ref保存最新值
function FixedComponent() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  // 同步ref和state
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  const logCount = () => {
    setTimeout(() => {
      console.log('count:', countRef.current); // 输出最新值
    }, 1000);
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={logCount}>记录Count</button>
    </div>
  );
}
```

### 5.3 事件处理器中的闭包

```typescript
// 问题：事件处理器捕获旧的ref值
function EventClosureProblem() {
  const [items, setItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const addItem = () => {
    // 这里的inputRef.current可能为null
    if (inputRef.current) {
      setItems(prev => [...prev, inputRef.current.value]);
      inputRef.current.value = '';
    }
  };
  
  return (
    <div>
      <input ref={inputRef} placeholder="输入内容" />
      <button onClick={addItem}>添加</button>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 5.4 异步操作中的ref使用

```typescript
function AsyncRefExample() {
  const [data, setData] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const result = await response.json();
    
    // 检查组件是否仍然挂载
    if (isMountedRef.current) {
      setData(result);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData}>获取数据</button>
      <p>{data}</p>
    </div>
  );
}
```

### 5.5 回调函数中的ref模式

```typescript
function CallbackWithRef() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  // 使用useCallback确保函数引用一致
  const incrementAndLog = useCallback(() => {
    setCount(prev => {
      countRef.current = prev + 1;
      return prev + 1;
    });
  }, []);
  
  const logDelayed = useCallback(() => {
    setTimeout(() => {
      console.log('延迟计数:', countRef.current);
    }, 1000);
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementAndLog}>增加并记录</button>
      <button onClick={logDelayed}>延迟记录</button>
    </div>
  );
}
```

---

## 6. useRef与性能优化

### 6.1 避免不必要的重新渲染

```typescript
// 低效版本：每次渲染都创建新对象
function InefficientComponent() {
  const [data, setData] = useState({ count: 0 });
  
  // 每次渲染都创建新对象，可能导致子组件不必要的渲染
  const config = { theme: 'dark', version: '1.0' };
  
  return <ChildComponent config={config} />;
}

// 高效版本：使用ref保存配置
function EfficientComponent() {
  const configRef = useRef({ theme: 'dark', version: '1.0' });
  
  // ref对象引用一致，避免子组件不必要的渲染
  return <ChildComponent config={configRef.current} />;
}
```

### 6.2 优化大型数据结构

```typescript
function LargeDataComponent() {
  // 使用ref保存大型数据
  const largeDataRef = useRef(() => {
    console.log('初始化大型数据');
    return new Array(10000).fill(0).map((_, i) => ({
      id: i,
      value: i * 2,
      nested: { data: new Array(100).fill(i) }
    }));
  })();
  
  const [displayIndex, setDisplayIndex] = useState(0);
  
  return (
    <div>
      <p>显示索引: {displayIndex}</p>
      <p>数据值: {largeDataRef.current[displayIndex]?.value}</p>
      <button onClick={() => setDisplayIndex(prev => Math.min(prev + 1, 9999))}>
        下一个
      </button>
    </div>
  );
}
```

### 6.3 优化事件处理器

```typescript
function OptimizedEvents() {
  const [items, setItems] = useState<string[]>([]);
  const itemsRef = useRef(items);
  
  // 同步ref和state
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  
  // 使用useCallback创建稳定的事件处理器
  const handleAdd = useCallback(() => {
    const newItem = `Item ${itemsRef.current.length + 1}`;
    setItems(prev => [...prev, newItem]);
  }, []);
  
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
      <button onClick={handleAdd}>添加项</button>
    </div>
  );
}
```

### 6.4 优化React.memo组件

```typescript
// 子组件使用React.memo
const MemoizedChild = React.memo(({ data, callback }: { 
  data: any; 
  callback: () => void 
}) => {
  console.log('子组件渲染');
  return <div>子组件</div>;
});

function ParentComponent() {
  const [count, setCount] = useState(0);
  
  // 使用ref保存callback，避免每次渲染都创建新函数
  const callbackRef = useRef(() => {
    console.log('回调执行');
  });
  
  // 使用ref保存data，避免每次渲染都创建新对象
  const dataRef = useRef({ value: 'constant' });
  
  return (
    <div>
      <MemoizedChild data={dataRef.current} callback={callbackRef.current} />
      <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>
    </div>
  );
}
```

### 6.5 性能对比测试

```typescript
function PerformanceComparison() {
  const [iterations, setIterations] = useState(1000);
  
  // 使用useState
  const testState = () => {
    const start = performance.now();
    const [count, setCount] = useState(0);
    
    for (let i = 0; i < iterations; i++) {
      setCount(c => c + 1);
    }
    
    return performance.now() - start;
  };
  
  // 使用useRef
  const testRef = () => {
    const countRef = useRef(0);
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      countRef.current += 1;
    }
    
    return performance.now() - start;
  };
  
  return (
    <div>
      <p>useState耗时: {testState().toFixed(3)}ms</p>
      <p>useRef耗时: {testRef().toFixed(3)}ms</p>
      <button onClick={() => setIterations(prev => prev * 10)}>增加迭代次数</button>
    </div>
  );
}
```

---

## 7. useRef与useImperativeHandle

### 7.1 useImperativeHandle基础

```typescript
import { useRef, useImperativeHandle, forwardRef } from 'react';

// 自定义输入组件
const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 自定义暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    // 暴露聚焦方法
    focus: () => {
      inputRef.current?.focus();
    },
    
    // 暴露选择文本方法
    select: () => {
      inputRef.current?.select();
    },
    
    // 暴露设置值方法
    setValue: (value: string) => {
      if (inputRef.current) {
        inputRef.current.value = value;
      }
    },
    
    // 暴露原生input元素
    getInputElement: () => inputRef.current
  }), []);
  
  return <input ref={inputRef} type="text" {...props} />;
});

function ParentComponent() {
  const customInputRef = useRef<{ 
    focus: () => void; 
    select: () => void; 
    setValue: (value: string) => void;
    getInputElement: () => HTMLInputElement | null;
  }>(null);
  
  return (
    <div>
      <CustomInput ref={customInputRef} placeholder="自定义输入框" />
      <button onClick={() => customInputRef.current?.focus()}>
        聚焦输入框
      </button>
      <button onClick={() => customInputRef.current?.select()}>
        选中文本
      </button>
      <button onClick={() => customInputRef.current?.setValue('Hello')}>
        设置值为Hello
      </button>
    </div>
  );
}
```

### 7.2 自定义组件API设计

```typescript
// 自定义模态框组件
interface ModalApi {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  setTitle: (title: string) => void;
}

const CustomModal = forwardRef<ModalApi, { children: React.ReactNode }>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('默认标题');
  const modalRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
    },
    
    close: () => {
      setIsOpen(false);
    },
    
    isOpen: () => {
      return isOpen;
    },
    
    setTitle: (newTitle: string) => {
      setTitle(newTitle);
    }
  }), [isOpen, title]);
  
  return (
    <>
      {isOpen && (
        <div ref={modalRef} className="modal-overlay">
          <div className="modal-content">
            <h2>{title}</h2>
            {props.children}
            <button onClick={() => setIsOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
});

function ParentComponent() {
  const modalRef = useRef<ModalApi>(null);
  
  return (
    <div>
      <button onClick={() => modalRef.current?.open()}>
        打开模态框
      </button>
      <button onClick={() => modalRef.current?.setTitle('新标题')}>
        修改标题
      </button>
      <CustomModal ref={modalRef}>
        <p>这是模态框内容</p>
      </CustomModal>
    </div>
  );
}
```

### 7.3 自定义Hook与useImperativeHandle

```typescript
// 自定义useDraggable Hook
function useDraggable(ref: React.RefObject<HTMLElement>) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  
  useImperativeHandle(ref, () => ({
    getPosition: () => position,
    
    setPosition: (newPos: { x: number; y: number }) => {
      setPosition(newPos);
    },
    
    reset: () => {
      setPosition({ x: 0, y: 0 });
    },
    
    enableDragging: () => {
      const element = ref.current;
      if (!element) return;
      
      const onMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        startPosRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      };
      
      const onMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        
        setPosition({
          x: e.clientX - startPosRef.current.x,
          y: e.clientY - startPosRef.current.y
        });
      };
      
      const onMouseUp = () => {
        isDraggingRef.current = false;
      };
      
      element.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      
      return () => {
        element.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }), [position]);
  
  return position;
}

function DraggableComponent() {
  const draggableRef = useRef<HTMLDivElement>(null);
  const position = useDraggable(draggableRef);
  
  return (
    <div
      ref={draggableRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 100,
        height: 100,
        background: 'blue',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      拖拽我
    </div>
  );
}
```

### 7.4 组合多个useImperativeHandle

```typescript
// 组合多个API
const ComplexComponent = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 第一个useImperativeHandle：输入相关API
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    select: () => inputRef.current?.select()
  }), []);
  
  // 第二个useImperativeHandle：定时器相关API
  useImperativeHandle(ref, () => ({
    startTimer: (callback: () => void, interval: number) => {
      timerRef.current = setInterval(callback, interval);
    },
    stopTimer: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }), []);
  
  return <input ref={inputRef} type="text" />;
});
```

---

## 8. useRef高级模式

### 8.1 自定义Hook封装useRef

```typescript
// 封装useRef的自定义Hook
function useSafeState<T>(initialValue: T) {
  const isMountedRef = useRef(true);
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const safeSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(newValue);
    }
  }, []);
  
  return [state, safeSetState] as const;
}

// 使用示例
function SafeStateComponent() {
  const [count, safeSetCount] = useSafeState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // 组件卸载后不会 setState
      safeSetCount(100);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <div>Count: {count}</div>;
}
```

### 8.2 usePrevious模式

```typescript
// 自定义usePrevious Hook
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// 使用示例
function PreviousValueComponent() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);
  
  return (
    <div>
      <p>当前值: {count}</p>
      <p>上一次值: {previousCount}</p>
      <button onClick={() => setCount(prev => prev + 1)}>增加</button>
    </div>
  );
}
```

### 8.3 useDebounce模式

```typescript
// 自定义useDebounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 使用ref优化的版本
function useDebounceWithRef<T>(value: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### 8.4 useThrottle模式

```typescript
// 自定义useThrottle Hook
function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecutedRef = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastExecutedRef.current >= delay) {
      setThrottledValue(value);
      lastExecutedRef.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecutedRef.current = Date.now();
      }, delay - (now - lastExecutedRef.current));
      
      return () => clearTimeout(timer);
    }
  }, [value, delay]);
  
  return throttledValue;
}
```

### 8.5 useInterval模式

```typescript
// 自定义useInterval Hook
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  
  // 保存最新的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => {
        savedCallback.current();
      }, delay);
      
      return () => clearInterval(id);
    }
  }, [delay]);
}
```

### 8.6 useAsync模式

```typescript
// 自定义useAsync Hook
type AsyncState<T> = {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: Error | null;
};

function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null
  });
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!immediate) return;
    
    setState(prev => ({ ...prev, status: 'pending', data: null, error: null }));
    
    asyncFunction()
      .then((data) => {
        if (isMountedRef.current) {
          setState({ status: 'success', data, error: null });
        }
      })
      .catch((error) => {
        if (isMountedRef.current) {
          setState({ status: 'error', data: null, error });
        }
      });
  }, [asyncFunction, immediate]);
  
  return state;
}
```

### 8.7 useClickOutside模式

```typescript
// 自定义useClickOutside Hook
function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  const savedHandler = useRef(handler);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      
      // 如果ref不存在或点击在元素内部，则不执行handler
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      
      savedHandler.current(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref]);
}

// 使用示例
function ClickOutsideComponent() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useClickOutside(menuRef, () => {
    setIsOpen(false);
  });
  
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>切换菜单</button>
      {isOpen && (
        <div ref={menuRef} style={{ border: '1px solid #ccc', padding: '10px' }}>
          菜单内容
        </div>
      )}
    </div>
  );
}
```

---

## 9. 经典面试题

### 9.1 基础概念题

**Q1: useRef和useState有什么区别？**

**A:** 
- **触发渲染**: useState修改状态会触发重新渲染，useRef修改current不会触发渲染
- **用途**: useState用于管理UI状态，useRef用于保存可变引用
- **生命周期**: 两者都在组件生命周期内保持值
- **性能**: useRef性能更好，因为不触发渲染

**Q2: 为什么修改useRef.current不会触发重新渲染？**

**A:** React的渲染机制基于状态变化。useRef返回的对象在组件生命周期内保持引用一致，React不会追踪ref.current的变化，因此不会触发调度更新。

**Q3: useRef可以用来保存什么类型的值？**

**A:** 任何类型的值：
- DOM元素引用
- 定时器ID
- 可变变量
- 回调函数引用
- 任意对象

### 9.2 代码输出题

**Q4: 以下代码的输出是什么？**

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  const refCount = useRef(0);
  
  const handleClick = () => {
    setCount(count + 1);
    refCount.current += 1;
    
    console.log('state:', count);
    console.log('ref:', refCount.current);
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

**A:** 
- 第一次点击：state: 0, ref: 1
- 第二次点击：state: 0, ref: 2
- 原因：setCount是异步的，console.log执行时count还是旧值

**Q5: 以下代码会有什么问题？**

```typescript
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  const increment = () => {
    setCount(count + 1);
    countRef.current = count + 1; // 问题：使用了旧的count值
  };
  
  return <button onClick={increment}>增加</button>;
}
```

**A:** 
- 问题：countRef.current使用了闭包捕获的旧count值
- 解决方案：使用setCount的回调形式

```typescript
const increment = () => {
  setCount(prev => {
    countRef.current = prev + 1;
    return prev + 1;
  });
};
```

**Q6: 以下代码的输出是什么？**

```typescript
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  const handleClick = () => {
    setCount(count + 1);
    console.log(countRef.current); // 输出什么？
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

**A:** 
- 输出：0
- 原因：setCount是异步的，useEffect在渲染后执行，handleClick中的countRef.current还是旧值

### 9.3 实战场景题

**Q7: 如何在事件处理器中获取最新的state值？**

**A:** 使用useRef保存最新值

```typescript
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  const handleClick = () => {
    // 这里可以获取到最新的count值
    console.log(countRef.current);
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
      <button onClick={handleClick}>记录Count</button>
    </div>
  );
}
```

**Q8: 如何避免组件卸载后 setState？**

**A:** 使用useRef标记组件挂载状态

```typescript
function Component() {
  const [data, setData] = useState(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const result = await response.json();
    
    if (isMountedRef.current) {
      setData(result);
    }
  };
  
  return <button onClick={fetchData}>获取数据</button>;
}
```

**Q9: 如何实现一个自定义的useDebounce Hook？**

**A:** 

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
```

**Q10: 如何实现一个自定义的useThrottle Hook？**

**A:**

```typescript
function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecutedRef = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastExecutedRef.current >= delay) {
      setThrottledValue(value);
      lastExecutedRef.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecutedRef.current = Date.now();
      }, delay - (now - lastExecutedRef.current));
      
      return () => clearTimeout(timer);
    }
  }, [value, delay]);
  
  return throttledValue;
}
```

### 9.4 进阶问题

**Q11: useRef的内存泄漏问题如何避免？**

**A:** 

```typescript
function Component() {
  const largeDataRef = useRef<LargeDataType | null>(null);
  
  useEffect(() => {
    // 初始化大对象
    largeDataRef.current = createLargeObject();
    
    // 清理函数
    return () => {
      if (largeDataRef.current) {
        // 释放资源
        largeDataRef.current = null;
      }
    };
  }, []);
  
  return <div>组件</div>;
}
```

**Q12: 如何测试使用了useRef的组件？**

**A:** 

```typescript
// 测试DOM操作
test('useRef聚焦输入框', () => {
  const { getByPlaceholderText, getByText } = render(<InputFocus />);
  const input = getByPlaceholderText('输入内容');
  
  // 验证初始状态
  expect(document.activeElement).not.toBe(input);
  
  // 点击按钮聚焦
  fireEvent.click(getByText('聚焦'));
  
  // 验证聚焦成功
  expect(document.activeElement).toBe(input);
});

// 测试ref值
test('useRef保存计数', () => {
  const { getByText } = render(<CounterWithRef />);
  
  const button = getByText('增加');
  fireEvent.click(button);
  fireEvent.click(button);
  
  // 验证显示的计数
  expect(getByText('显示计数: 0')).toBeInTheDocument();
});
```

---

## 10. 最佳实践

### 10.1 使用场景选择

```typescript
// ✅ 正确：使用useRef保存DOM引用
function InputComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  return <input ref={inputRef} />;
}

// ✅ 正确：使用useRef保存定时器ID
function TimerComponent() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    timerRef.current = setInterval(() => {
      console.log('定时执行');
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return <div>定时器</div>;
}

// ❌ 错误：使用useRef管理需要触发渲染的状态
function WrongUsage() {
  const countRef = useRef(0);
  
  // 这里应该使用useState
  return (
    <div>
      <p>{countRef.current}</p> {/* 不会更新 */}
      <button onClick={() => countRef.current++}>增加</button>
    </div>
  );
}
```

### 10.2 类型安全

```typescript
// 使用泛型确保类型安全
function TypedComponent() {
  // DOM元素ref
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 对象ref
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  // 函数ref
  const callbackRef = useRef<(value: string) => void>(() => {});
  
  // 可空ref
  const elementRef = useRef<HTMLDivElement | null>(null);
  
  // 使用时进行类型检查
  if (inputRef.current) {
    inputRef.current.focus(); // 类型安全
  }
  
  if (elementRef.current) {
    elementRef.current.classList.add('active'); // 类型安全
  }
}
```

### 10.3 性能优化

```typescript
// 优化1：避免在渲染期间创建新对象
function OptimizedComponent() {
  // ❌ 错误：每次渲染都创建新对象
  // const config = { theme: 'dark', version: '1.0' };
  
  // ✅ 正确：使用ref保存配置
  const configRef = useRef({ theme: 'dark', version: '1.0' });
  
  return <ChildComponent config={configRef.current} />;
}

// 优化2：使用useCallback配合useRef
function OptimizedCallback() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  // ✅ 正确：使用useCallback确保函数引用一致
  const logCount = useCallback(() => {
    console.log(countRef.current);
  }, []);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
      <button onClick={logCount}>记录</button>
    </div>
  );
}
```

### 10.4 错误处理

```typescript
// 安全地访问ref
function SafeRefAccess() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 方法1：使用可选链
  const focusInput1 = () => {
    inputRef.current?.focus();
  };
  
  // 方法2：使用条件判断
  const focusInput2 = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // 方法3：使用逻辑与
  const focusInput3 = () => {
    inputRef.current && inputRef.current.focus();
  };
  
  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput1}>聚焦1</button>
      <button onClick={focusInput2}>聚焦2</button>
      <button onClick={focusInput3}>聚焦3</button>
    </div>
  );
}
```

### 10.5 代码组织

```typescript
// 推荐的代码组织方式
function WellOrganizedComponent() {
  // 1. DOM引用
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 2. 定时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 3. 可变值引用
  const countRef = useRef(0);
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  // 4. 回调引用
  const callbackRef = useRef<() => void>(() => {});
  
  // 5. 挂载状态引用
  const isMountedRef = useRef(false);
  
  // 6. 生命周期管理
  useEffect(() => {
    isMountedRef.current = true;
    
    // 初始化逻辑
    inputRef.current?.focus();
    
    return () => {
      isMountedRef.current = false;
      
      // 清理逻辑
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // 清理ref
      inputRef.current = null;
      containerRef.current = null;
    };
  }, []);
  
  return (
    <div ref={containerRef}>
      <input ref={inputRef} />
    </div>
  );
}
```

### 10.6 测试最佳实践

```typescript
// 测试useRef组件
describe('useRef组件测试', () => {
  test('DOM引用正确', () => {
    const { getByPlaceholderText } = render(<InputFocus />);
    const input = getByPlaceholderText('输入内容');
    
    expect(input).toBeInTheDocument();
  });
  
  test('ref值正确更新', () => {
    const { getByText } = render(<CounterWithRef />);
    
    const button = getByText('增加');
    fireEvent.click(button);
    fireEvent.click(button);
    
    // 验证显示的值
    expect(getByText('显示计数: 0')).toBeInTheDocument();
  });
  
  test('定时器正确清理', () => {
    const { unmount } = render(<AutoRefresh />);
    
    // 卸载组件
    unmount();
    
    // 验证定时器被清理
    // 这里需要使用jest的定时器模拟
  });
});
```

---

## 11. useRef的未来

### 11.1 React未来版本的改进

**React 19的潜在改进方向：**

1. **自动ref追踪**：可能引入新的API自动追踪ref变化
2. **性能优化**：进一步优化useRef的内部实现
3. **类型推断**：改进TypeScript类型推断

### 11.2 替代方案探索

**Signals方案（React未来可能引入）：**

```typescript
// React Signals提案
import { signal, computed, effect } from '@react/signals';

// 创建信号
const count = signal(0);

// 计算属性
const doubled = computed(() => count.value * 2);

// 副作用
effect(() => {
  console.log('Count:', count.value);
  console.log('Doubled:', doubled.value);
});

// 更新信号
function increment() {
  count.value += 1;
}
```

**与useRef的对比：**

```typescript
// useRef方案
function useRefComponent() {
  const countRef = useRef(0);
  
  useEffect(() => {
    console.log('Count:', countRef.current);
  }, [countRef.current]);
  
  return <button onClick={() => countRef.current++}>增加</button>;
}

// Signals方案
function signalsComponent() {
  const count = signal(0);
  
  effect(() => {
    console.log('Count:', count.value);
  });
  
  return <button onClick={() => count.value++}>增加</button>;
}
```

### 11.3 最佳实践总结

```typescript
// useRef使用 checklist
function useRefChecklist() {
  // ✅ 使用useRef的场景
  const domRef = useRef<HTMLElement>(null); // DOM引用
  const timerRef = useRef<NodeJS.Timeout>(null); // 定时器
  const cacheRef = useRef<Map<string, any>>(new Map()); // 缓存
  const callbackRef = useRef<() => void>(() => {}); // 回调
  
  // ❌ 不使用useRef的场景
  // const stateRef = useRef(0); // 应该使用useState
  
  // ✅ 类型安全
  const safeRef = useRef<HTMLInputElement | null>(null);
  
  // ✅ 清理资源
  useEffect(() => {
    return () => {
      safeRef.current = null;
    };
  }, []);
  
  // ✅ 检查存在性
  if (safeRef.current) {
    safeRef.current.focus();
  }
  
  return <div ref={safeRef}>组件</div>;
}
```

### 11.4 学习路径建议

```markdown
# useRef学习路径

## 第一阶段：基础理解
1. 理解useRef的基本概念
2. 掌握useRef与useState的区别
3. 学习useRef的常见使用场景

## 第二阶段：深入原理
1. 理解useRef的内部机制
2. 学习React Hook的实现原理
3. 掌握闭包与useRef的关系

## 第三阶段：高级应用
1. 实现自定义Hook
2. 优化性能问题
3. 设计复杂的组件模式

## 第四阶段：最佳实践
1. 编写可测试的代码
2. 处理边界情况
3. 性能优化技巧
```

---

## 附录：完整示例代码

### 附录A：综合示例

```typescript
import React, { useRef, useState, useEffect, useCallback } from 'react';

// 综合示例：自定义输入组件
interface CustomInputProps {
  placeholder?: string;
  debounceDelay?: number;
  onChange?: (value: string) => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
  placeholder = '请输入内容',
  debounceDelay = 300,
  onChange
}) => {
  // DOM引用
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 可变值引用
  const valueRef = useRef('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  
  // 状态
  const [displayValue, setDisplayValue] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  // 回调引用
  const handleChangeCallback = useRef<(value: string) => void>(onChange);
  
  // 同步回调引用
  useEffect(() => {
    handleChangeCallback.current = onChange;
  }, [onChange]);
  
  // 组件挂载
  useEffect(() => {
    isMountedRef.current = true;
    
    // 自动聚焦
    inputRef.current?.focus();
    
    return () => {
      isMountedRef.current = false;
      
      // 清理定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // 处理输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 更新ref和状态
    valueRef.current = newValue;
    setCharCount(newValue.length);
    
    // 清除旧的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      setDisplayValue(newValue);
      
      // 调用回调
      if (handleChangeCallback.current) {
        handleChangeCallback.current(newValue);
      }
    }, debounceDelay);
  }, [debounceDelay]);
  
  // 聚焦方法
  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);
  
  // 清空方法
  const clear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      valueRef.current = '';
      setDisplayValue('');
      setCharCount(0);
    }
  }, []);
  
  // 暴露API
  useImperativeHandle(forwardRef, () => ({
    focus,
    clear,
    getValue: () => valueRef.current,
    getDisplayValue: () => displayValue
  }), [focus, clear, displayValue]);
  
  return (
    <div style={{ padding: '20px' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
      <div style={{ marginTop: '10px', color: '#666' }}>
        <span>字符数: {charCount}</span>
        <span style={{ marginLeft: '20px' }}>
          实际值: {valueRef.current}
        </span>
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={focus} style={{ marginRight: '10px' }}>
          聚焦
        </button>
        <button onClick={clear}>清空</button>
      </div>
    </div>
  );
};

// 使用示例
function App() {
  const inputRef = useRef<{ 
    focus: () => void; 
    clear: () => void; 
    getValue: () => string;
    getDisplayValue: () => string;
  }>(null);
  
  const handleInputChange = useCallback((value: string) => {
    console.log('输入值变化:', value);
  }, []);
  
  return (
    <div style={{ padding: '40px' }}>
      <h1>自定义输入组件</h1>
      <CustomInput 
        ref={inputRef}
        placeholder="请输入内容..."
        debounceDelay={500}
        onChange={handleInputChange}
      />
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => inputRef.current?.focus()}>
          聚焦输入框
        </button>
        <button onClick={() => inputRef.current?.clear()} style={{ marginLeft: '10px' }}>
          清空输入框
        </button>
        <button 
          onClick={() => console.log('当前值:', inputRef.current?.getValue())}
          style={{ marginLeft: '10px' }}
        >
          获取值
        </button>
      </div>
    </div>
  );
}

export default App;
```

### 附录B：性能测试代码

```typescript
import React, { useRef, useState, useEffect, useCallback } from 'react';

// 性能测试组件
function PerformanceTest() {
  const [iterations, setIterations] = useState(1000);
  const [useStateTime, setUseStateTime] = useState(0);
  const [useRefTime, setUseRefTime] = useState(0);
  
  // 测试useState性能
  const testUseState = useCallback(() => {
    const start = performance.now();
    
    let count = 0;
    for (let i = 0; i < iterations; i++) {
      // 模拟useState的更新
      count = count + 1;
    }
    
    const end = performance.now();
    setUseStateTime(end - start);
  }, [iterations]);
  
  // 测试useRef性能
  const testUseRef = useCallback(() => {
    const start = performance.now();
    
    const countRef = { current: 0 };
    for (let i = 0; i < iterations; i++) {
      countRef.current = countRef.current + 1;
    }
    
    const end = performance.now();
    setUseRefTime(end - start);
  }, [iterations]);
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>性能测试</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          迭代次数:
          <input
            type="number"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            style={{ marginLeft: '10px', width: '100px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>useState耗时:</strong> {useStateTime.toFixed(4)}ms
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>useRef耗时:</strong> {useRefTime.toFixed(4)}ms
      </div>
      <div>
        <button onClick={testUseState} style={{ marginRight: '10px' }}>
          测试useState
        </button>
        <button onClick={testUseRef}>
          测试useRef
        </button>
      </div>
    </div>
  );
}

export default PerformanceTest;
```

---

## 参考资料

1. [React官方文档 - useRef](https://react.dev/reference/react/useRef)
2. [React Hooks源码解析](https://github.com/facebook/react)
3. [useRef最佳实践](https://www.patterns.dev/react/useref)
4. [React性能优化指南](https://react.dev/learn/performance)

---

*本文档最后更新于 2026年3月16日*
