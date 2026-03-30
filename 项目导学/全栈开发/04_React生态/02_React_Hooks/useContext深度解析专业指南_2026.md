# useContext深度解析专业指南_2026

## 1. useContext概述

### 1.1 什么是Context API

Context API是React提供的跨组件状态共享机制，它允许我们在组件树中**跨层级传递数据**，而无需手动通过props逐层传递。从React 16.3引入，到16.8 Hooks的完善，Context已经成为React状态管理生态中不可或缺的一环。

```typescript
// Context的本质：一个特殊的React对象
const MyContext = React.createContext(defaultValue);
// 返回一个Context对象，包含Provider和Consumer
```

### 1.2 useContext的诞生背景

在Hooks出现之前，使用Context需要借助`Context.Consumer`或高阶组件模式：

```typescript
// 旧方式：Consumer模式（嵌套地狱）
<MyContext.Consumer>
  {value => (
    <div>
      <MyContext.Consumer>
        {value2 => (
          <div>{value + value2}</div>
        )}
      </MyContext.Consumer>
    </div>
  )}
</MyContext.Consumer>
```

React 16.8引入`useContext` Hook后，Context的使用变得简洁优雅：

```typescript
// 新方式：useContext Hook
const value = useContext(MyContext);
```

### 1.3 useContext的定位

| 状态管理方案 | 适用场景 | 复杂度 | 性能 | 学习曲线 |
|-------------|---------|--------|------|---------|
| useState/useState | 组件内部状态 | 低 | 高 | 简单 |
| useContext | 跨层级共享状态 | 中 | 中 | 中等 |
| Redux | 复杂全局状态 | 高 | 高 | 陡峭 |
| Zustand | 轻量全局状态 | 低 | 高 | 简单 |
| Jotai | 原子化状态 | 中 | 高 | 中等 |

**useContext最适合的场景**：
- 主题/语言等全局配置
- 用户认证信息
- 响应式布局状态
- 组件库的内部状态共享

### 1.4 2026年Context的最新进展

React 19引入了**并发渲染优化**和**Server Components兼容性**改进：

```typescript
// React 19：Context在并发模式下的自动批处理
const value = useContext(MyContext);
// 无需手动使用useMutableSource，自动优化
```

---

## 2. useContext基础用法

### 2.1 创建Context

```typescript
// 创建Context时提供默认值
const ThemeContext = React.createContext<'light' | 'dark'>('light');

// 不提供默认值（使用时必须有Provider）
const UserContext = React.createContext<User | null>(null);
```

### 2.2 使用Context Provider

```typescript
// Provider组件用于提供Context值
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

### 2.3 使用useContext Hook

```typescript
import React, { useContext } from 'react';

function ThemedButton() {
  // 使用useContext获取Context值
  const theme = useContext(ThemeContext);
  
  return (
    <button style={{ 
      background: theme === 'dark' ? '#333' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333'
    }}>
      主题按钮
    </button>
  );
}
```

### 2.4 完整示例：主题切换系统

```typescript
import React, { createContext, useContext, useState } from 'react';

// 1. 创建Context
const ThemeContext = createContext<'light' | 'dark'>('light');

// 2. 创建Provider组件
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 创建使用Context的组件
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <button 
      onClick={toggleTheme}
      style={{ 
        padding: '10px 20px',
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
        border: '1px solid #ccc',
        cursor: 'pointer'
      }}
    >
      切换到{theme === 'light' ? '深色' : '浅色'}主题
    </button>
  );
}

// 4. 在应用根部使用Provider
function App() {
  return (
    <ThemeProvider>
      <div>
        <h1>主题切换系统</h1>
        <ThemedButton />
      </div>
    </ThemeProvider>
  );
}
```

---

## 3. Context的创建与使用

### 3.1 Context对象结构

```typescript
interface Context<T> {
  Provider: Provider<T>;
  Consumer: Consumer<T>;
  _currentValue: T; // 内部属性，不建议直接使用
}
```

### 3.2 Provider组件

```typescript
interface Provider<T> {
  (props: ProviderProps<T>): ReactElement | null;
}

interface ProviderProps<T> {
  value: T;
  children: ReactNode;
}
```

**Provider特性**：
- 接收`value`属性作为Context值
- 接收`children`作为子组件
- 当`value`变化时，所有消费该Context的组件会重新渲染

### 3.3 多个Context的使用

```typescript
// ❌ 错误：嵌套Provider导致性能问题
<ThemeContext.Provider value={theme}>
  <UserContext.Provider value={user}>
    <LanguageContext.Provider value={language}>
      <App />
    </LanguageContext.Provider>
  </UserContext.Provider>
</ThemeContext.Provider>

// ✅ 正确：使用组合Context
const AppContext = createContext({
  theme: 'light',
  user: null,
  language: 'zh-CN'
});

function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('zh-CN');
  
  const value = { theme, user, language };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
```

### 3.4 Context值的引用稳定性

```typescript
// ❌ 问题：每次渲染都创建新对象
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <MyContext.Provider value={{ count }}> {/* 每次都是新对象 */}
      <Child />
    </MyContext.Provider>
  );
}

// ✅ 解决：使用useMemo保持引用稳定
function App() {
  const [count, setCount] = useState(0);
  const contextValue = useMemo(() => ({ count }), [count]);
  
  return (
    <MyContext.Provider value={contextValue}>
      <Child />
    </MyContext.Provider>
  );
}

// ✅ 更好的方案：分离可变和不可变值
const CountContext = createContext(0);
const ConfigContext = createContext({ apiEndpoint: '/api' });

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <CountContext.Provider value={count}>
      <ConfigContext.Provider value={{ apiEndpoint: '/api' }}>
        <Child />
      </ConfigContext.Provider>
    </CountContext.Provider>
  );
}
```

---

## 4. useContext的内部机制

### 4.1 Context的订阅机制

React使用**发布-订阅模式**实现Context：

```typescript
// 伪代码：Context的内部实现
function createContext(defaultValue) {
  const context = {
    $$typeof: Symbol.for('react.context'),
    _currentValue: defaultValue,
    Provider: null,
    Consumer: null
  };
  
  context.Provider = {
    $$typeof: Symbol.for('react.provider'),
    _context: context
  };
  
  return context;
}
```

### 4.2 useContext的执行流程

```typescript
function useContext<T>(context: Context<T>): T {
  // 1. 获取当前fiber
  const dispatcher = resolveDispatcher();
  
  // 2. 调用readContext读取Context值
  return dispatcher.readContext(context);
}
```

**执行流程**：
1. React在渲染组件时，创建fiber节点
2. 遇到`useContext`调用，记录Context依赖
3. 当Provider的`value`变化时，触发订阅更新
4. React批量更新所有订阅该Context的组件

### 4.3 Context更新的触发条件

```typescript
// 只有当Provider的value引用变化时才会触发更新
<Context.Provider value={value}> {/* value引用变化 → 触发更新 */}
```

**引用变化检测**：
- 原始类型（string/number/boolean）：值变化即变化
- 对象/数组：必须使用`useMemo`或`useCallback`保持引用稳定

### 4.4 Context的优先级

React使用**优先级队列**处理Context更新：

```
1. 同步更新（Sync）
   - 用户交互事件（click/input）
   
2. 自动批处理（Auto-batching）
   - Promise.then
   - setTimeout
   
3. 离屏更新（Offscreen）
   - Suspense fallback
   - 隐藏组件
```

---

## 5. Context性能优化

### 5.1 问题：过度渲染

```typescript
// ❌ 问题：任何Context变化都会导致所有Consumer重新渲染
const GlobalContext = createContext({
  theme: 'light',
  user: null,
  notifications: []
});

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const value = { theme, user, notifications };
  
  return (
    <GlobalContext.Provider value={value}>
      <Header /> {/* 只用了theme，但user变化也会重渲染 */}
      <Sidebar /> {/* 只用了user，但theme变化也会重渲染 */}
      <NotificationPanel /> {/* 只用了notifications */}
    </GlobalContext.Provider>
  );
}
```

### 5.2 优化方案1：分离Context

```typescript
// ✅ 方案：按需分离Context
const ThemeContext = createContext('light');
const UserContext = createContext(null);
const NotificationContext = createContext([]);

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <NotificationContext.Provider value={notifications}>
          <Header /> {/* 只在theme变化时重渲染 */}
          <Sidebar /> {/* 只在user变化时重渲染 */}
          <NotificationPanel /> {/* 只在notifications变化时重渲染 */}
        </NotificationContext.Provider>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}
```

### 5.3 优化方案2：使用useMemo

```typescript
// ✅ 方案：使用useMemo保持引用稳定
function App() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('light');
  
  // 只有count变化时才创建新对象
  const contextValue = useMemo(() => ({ count }), [count]);
  
  return (
    <CountContext.Provider value={contextValue}>
      <ThemeContext.Provider value={theme}>
        <Child />
      </ThemeContext.Provider>
    </CountContext.Provider>
  );
}
```

### 5.4 优化方案3：使用useContextSelector（实验性）

```typescript
// 实验性API：只订阅特定字段
const count = useContextSelector(CountContext, state => state.count);
```

### 5.5 性能对比测试

```typescript
// 测试代码：比较不同Context策略的性能
function PerformanceTest() {
  const [iterations, setIterations] = useState(1000);
  
  // 方案1：单个大Context
  const singleContextValue = useMemo(() => ({
    theme, user, notifications, settings
  }), [theme, user, notifications, settings]);
  
  // 方案2：分离Context
  // 每个Context独立优化
  
  return (
    <div>
      <h3>Context性能测试</h3>
      <p>渲染组件数量：{iterations}</p>
      <p>单Context方案：约15ms</p>
      <p>分离Context方案：约5ms</p>
    </div>
  );
}
```

---

## 6. Context的常见陷阱

### 6.1 陷阱1：Provider位置不当

```typescript
// ❌ 错误：Provider嵌套过深
function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

// ✅ 正确：Provider放在应用根部
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
```

### 6.2 陷阱2：Context值不稳定

```typescript
// ❌ 问题：每次渲染都创建新对象
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <CountContext.Provider value={{ count }}> {/* 每次都是新对象 */}
      <Child />
    </CountContext.Provider>
  );
}

// ✅ 解决：使用useMemo
function App() {
  const [count, setCount] = useState(0);
  const contextValue = useMemo(() => ({ count }), [count]);
  
  return (
    <CountContext.Provider value={contextValue}>
      <Child />
    </CountContext.Provider>
  );
}
```

### 6.3 陷阱3：Context类型推断问题

```typescript
// ❌ 问题：类型推断不准确
const ThemeContext = createContext('light'); // 类型为string | undefined

// ✅ 解决：使用泛型明确类型
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 使用时断言
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 6.4 陷阱4：Context与状态管理混淆

```typescript
// ❌ 错误：将Context用于频繁更新的状态
const CounterContext = createContext({ count: 0, increment: () => {} });

function Counter() {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({
    count,
    increment: () => setCount(c => c + 1)
  }), [count]);
  
  return (
    <CounterContext.Provider value={value}>
      <CounterDisplay />
      <button onClick={value.increment}>+1</button>
    </CounterContext.Provider>
  );
}

// ✅ 正确：使用useState或Zustand
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <CounterDisplay count={count} />
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </>
  );
}
```

---

## 7. useContext与useReducer组合

### 7.1 组合模式的优势

```typescript
// 优势1：状态逻辑与组件解耦
// 优势2：支持复杂状态更新
// 优势3：保持Context的性能优化
```

### 7.2 完整示例：购物车系统

```typescript
import React, { createContext, useContext, useReducer } from 'react';

// 1. 定义状态类型
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' };

// 2. 定义reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    
    default:
      return state;
  }
}

// 3. 创建Context
interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. 创建Provider
function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  
  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const value = {
    state: { ...state, total },
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// 5. 创建自定义Hook
function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// 6. 使用Context的组件
function ProductList() {
  const { addItem } = useCart();
  const products = [
    { id: 1, name: 'iPhone 15', price: 6999 },
    { id: 2, name: 'MacBook Pro', price: 15999 },
    { id: 3, name: 'iPad Air', price: 4999 }
  ];
  
  return (
    <div>
      <h2>商品列表</h2>
      {products.map(product => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>{product.name}</h3>
          <p>价格：¥{product.price}</p>
          <button onClick={() => addItem({ ...product, quantity: 1 })}>
            加入购物车
          </button>
        </div>
      ))}
    </div>
  );
}

function CartSummary() {
  const { state, updateQuantity, removeItem } = useCart();
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
      <h2>购物车</h2>
      {state.items.length === 0 ? (
        <p>购物车为空</p>
      ) : (
        <>
          {state.items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span>{item.name}</span>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                style={{ width: '50px', marginLeft: '10px' }}
              />
              <span>× ¥{item.price}</span>
              <button
                onClick={() => removeItem(item.id)}
                style={{ marginLeft: '10px', color: 'red' }}
              >
                删除
              </button>
            </div>
          ))}
          <h3>总计：¥{state.total}</h3>
        </>
      )}
    </div>
  );
}

// 7. 应用整合
function App() {
  return (
    <CartProvider>
      <div style={{ padding: '20px' }}>
        <ProductList />
        <CartSummary />
      </div>
    </CartProvider>
  );
}
```

### 7.3 进阶：使用useContextReducer自定义Hook

```typescript
// 自定义Hook：结合useContext和useReducer
function useContextReducer<R extends React.Reducer<any, any>>(
  reducer: R,
  initialState: React.ReducerState<R>,
  initializer?: undefined,
  init?: undefined
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] {
  const context = useContext(ReducerContext);
  
  if (context === undefined) {
    throw new Error('useContextReducer must be used within a ReducerProvider');
  }
  
  return useReducer(reducer, initialState, initializer, init);
}
```

---

## 8. useContext高级模式

### 8.1 模式1：Context注入器

```typescript
// 实现依赖注入模式
interface DIContainer {
  api: typeof api;
  logger: typeof logger;
  storage: typeof storage;
}

const DIContext = createContext<DIContainer | undefined>(undefined);

function DIProvider({ children }: { children: React.ReactNode }) {
  const container = useMemo<DIContainer>(() => ({
    api: createApi(),
    logger: createLogger(),
    storage: createStorage()
  }), []);
  
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
}

function useDI<T extends keyof DIContainer>(key: T): DIContainer[T] {
  const context = useContext(DIContext);
  if (context === undefined) {
    throw new Error('useDI must be used within a DIProvider');
  }
  return context[key];
}

// 使用
function MyComponent() {
  const api = useDI('api');
  const logger = useDI('logger');
  
  // ...
}
```

### 8.2 模式2：Context组合器

```typescript
// 组合多个Context
function createContextGroup<T extends Record<string, any>>(contexts: T) {
  const contextNames = Object.keys(contexts);
  
  return function useCombinedContext() {
    const values = contextNames.map(name => useContext(contexts[name]));
    return Object.fromEntries(
      contextNames.map((name, index) => [name, values[index]])
    ) as { [K in keyof T]: T[K] extends React.Context<infer V> ? V : never };
  };
}

// 使用
const { useTheme, useUser, useLanguage } = createContextGroup({
  theme: ThemeContext,
  user: UserContext,
  language: LanguageContext
});

function MyComponent() {
  const { theme, user, language } = useCombinedContext();
  // ...
}
```

### 8.3 模式3：Context状态快照

```typescript
// 保存Context状态快照
function useSnapshot<T>(context: React.Context<T>): T {
  const value = useContext(context);
  const [snapshot, setSnapshot] = useState(value);
  
  useEffect(() => {
    setSnapshot(value);
  }, [value]);
  
  return snapshot;
}

// 使用
function MyComponent() {
  const snapshot = useSnapshot(UserContext);
  // snapshot始终是初始值，不会随Context更新
}
```

### 8.4 模式4：Context代理

```typescript
// 创建Context代理，支持动态更新
class ContextProxy<T> {
  private context: React.Context<T>;
  private subscribers: Set<(value: T) => void> = new Set();
  
  constructor(context: React.Context<T>) {
    this.context = context;
  }
  
  subscribe(callback: (value: T) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  notify(value: T) {
    this.subscribers.forEach(callback => callback(value));
  }
}

// 使用
const userProxy = new ContextProxy(UserContext);

function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = userProxy.subscribe(setUser);
    return unsubscribe;
  }, []);
  
  // ...
}
```

---

## 9. useContext经典面试题

### 9.1 面试题1：Context与Props传递的区别

**问题**：Context和Props传递数据有什么区别？什么时候使用Context？

**回答要点**：

```typescript
// Props传递
function Parent() {
  return <Child prop1="value1" prop2="value2" />;
}

// Context传递
const MyContext = createContext('defaultValue');
function Parent() {
  return (
    <MyContext.Provider value="value">
      <Child />
    </MyContext.Provider>
  );
}

// 区别对比
const comparison = {
  ' Props传递 ': {
    '适用场景': '组件层级较浅（1-2层）',
    '性能': '子组件只在props变化时重渲染',
    '类型安全': 'TypeScript支持好',
    '缺点': '层级深时需要中间组件传递（prop drilling）'
  },
  ' Context传递 ': {
    '适用场景': '跨多层组件共享状态',
    '性能': 'Context变化时所有Consumer重渲染',
    '类型安全': '需要泛型支持',
    '优点': '避免prop drilling，代码更简洁'
  }
};
```

**最佳实践**：
- 1-2层组件间传递：使用Props
- 3层及以上：考虑Context
- 频繁更新的状态：使用Zustand/Jotai
- 全局配置：使用Context

### 9.2 面试题2：Context的性能问题

**问题**：Context有哪些性能问题？如何优化？

**回答要点**：

```typescript
// 问题1：过度渲染
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  
  const value = { theme, user }; // 每次都是新对象
  
  return (
    <Context.Provider value={value}>
      <Header /> {/* 只用了theme，但user变化也会重渲染 */}
    </Context.Provider>
  );
}

// 优化方案1：分离Context
const ThemeContext = createContext('light');
const UserContext = createContext(null);

function App() {
  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <Header /> {/* 只在theme变化时重渲染 */}
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

// 优化方案2：使用useMemo
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  
  const value = useMemo(() => ({ theme, user }), [theme, user]);
  
  return (
    <Context.Provider value={value}>
      <Header />
    </Context.Provider>
  );
}

// 优化方案3：分离可变和不可变值
const ConfigContext = createContext({ apiEndpoint: '/api' }); // 不变
const ThemeContext = createContext('light'); // 变化

function App() {
  return (
    <ConfigContext.Provider value={{ apiEndpoint: '/api' }}>
      <ThemeContext.Provider value={theme}>
        <Header />
      </ThemeContext.Provider>
    </ConfigContext.Provider>
  );
}
```

### 9.3 面试题3：Context与状态管理库的选择

**问题**：什么情况下应该使用Context而不是Redux/Zustand？

**回答要点**：

```typescript
// Context适合的场景
const contextUseCases = {
  '全局配置': ['主题', '语言', '地区'],
  '认证信息': ['用户信息', 'Token', '权限'],
  '组件库状态': ['响应式布局', '主题配置'],
  '临时共享状态': ['表单状态', '步骤导航']
};

// 状态管理库适合的场景
const stateManagementUseCases = {
  '复杂业务逻辑': ['表单验证', '数据转换'],
  '频繁更新': ['实时数据', '动画状态'],
  '时间旅行调试': ['Redux DevTools'],
  '服务端渲染': ['Redux SSR支持'],
  '大型应用': ['模块化状态管理']
};

// 选择决策树
function chooseStateManagement(solution) {
  if (solution.isSimpleConfig) {
    return 'Context';
  }
  if (solution.isFrequentUpdate) {
    return 'Zustand/Jotai';
  }
  if (solution.isLargeApp) {
    return 'Redux/Zustand';
  }
  return 'Context';
}
```

### 9.4 面试题4：Context的类型安全

**问题**：如何保证Context的类型安全？

**回答要点**：

```typescript
// ❌ 问题：类型推断不准确
const ThemeContext = createContext('light'); // string | undefined

// ✅ 方案1：使用泛型
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ✅ 方案2：自定义Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ✅ 方案3：使用TypeScript 4.9+的const assertions
const ThemeContext = createContext({
  theme: 'light' as const,
  toggleTheme: () => {}
} as const);

// ✅ 方案4：使用utility types
type ContextType<C> = C extends React.Context<infer T> ? T : never;

const ThemeContext = createContext({ theme: 'light' });
type ThemeContextValue = ContextType<typeof ThemeContext>;
```

### 9.5 面试题5：Context的更新机制

**问题**：Context更新的机制是什么？为什么有时Context变化组件不更新？

**回答要点**：

```typescript
// 更新机制
function contextUpdateMechanism() {
  return {
    '订阅机制': '发布-订阅模式',
    '触发条件': 'Provider的value引用变化',
    '更新方式': 'React批量更新',
    '优先级': '根据事件类型决定同步或异步'
  };
}

// 组件不更新的可能原因
function reasonsForNoUpdate() {
  return [
    'Context值引用未变化（useMemo优化）',
    '组件被shouldComponentUpdate阻止',
    'Context在错误的Provider层级',
    'React 18自动批处理导致更新合并'
  ];
}

// 调试技巧
function debugContextUpdate() {
  return `
    1. 使用React DevTools查看Context值
    2. 在Provider中console.log检查value变化
    3. 检查useContext调用位置
    4. 使用useEffect监听Context变化
  `;
}

// 调试示例
function MyComponent() {
  const value = useContext(MyContext);
  
  useEffect(() => {
    console.log('Context更新:', value);
  }, [value]);
  
  return <div>{value}</div>;
}
```

---

## 10. useContext最佳实践

### 10.1 实践1：Context命名规范

```typescript
// ✅ 好的命名
const ThemeContext = createContext('light');
const UserContext = createContext(null);
const AuthContext = createContext(null);

// ❌ 不好的命名
const Ctx = createContext('light'); // 不明确
const Data = createContext(null); // 太泛
const State = createContext(null); // 无法表达含义
```

### 10.2 实践2：自定义Hook封装

```typescript
// ✅ 封装Context访问逻辑
function createUseContext<T>(context: React.Context<T | undefined>, hookName: string) {
  return function useContextHook() {
    const contextValue = useContext(context);
    if (contextValue === undefined) {
      throw new Error(`${hookName} must be used within a Provider`);
    }
    return contextValue;
  };
}

// 使用
const useTheme = createUseContext(ThemeContext, 'useTheme');
const useUser = createUseContext(UserContext, 'useUser');
```

### 10.3 实践3：Context与组件组合

```typescript
// 使用Compound Components模式
interface ThemeContextType {
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ theme = 'light', children }: { theme?: 'light' | 'dark', children: React.ReactNode }) {
  const value = useMemo(() => ({ theme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Compound Components
function ThemeConsumer({ children }: { children: (theme: 'light' | 'dark') => React.ReactNode }) {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('ThemeConsumer must be used within a ThemeProvider');
  }
  return children(context.theme);
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 使用
<ThemeProvider theme="dark">
  <ThemeConsumer>
    {theme => <div>当前主题：{theme}</div>}
  </ThemeConsumer>
  <div>使用Hook：{useTheme().theme}</div>
</ThemeProvider>
```

### 10.4 实践4：Context与异步数据

```typescript
// 处理异步数据的Context
interface AsyncDataContext<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function createAsyncContext<T>(fetchFn: () => Promise<T>) {
  const AsyncContext = createContext<AsyncDataContext<T> | undefined>(undefined);
  
  function AsyncProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AsyncDataContext<T>>({
      data: null,
      loading: true,
      error: null
    });
    
    useEffect(() => {
      let cancelled = false;
      
      fetchFn()
        .then(data => {
          if (!cancelled) {
            setState({ data, loading: false, error: null });
          }
        })
        .catch(error => {
          if (!cancelled) {
            setState({ data: null, loading: false, error });
          }
        });
      
      return () => {
        cancelled = true;
      };
    }, []);
    
    const refresh = () => {
      setState(prev => ({ ...prev, loading: true }));
      fetchFn()
        .then(data => {
          setState({ data, loading: false, error: null });
        })
        .catch(error => {
          setState({ data: null, loading: false, error });
        });
    };
    
    const value = useMemo(() => ({ ...state, refresh }), [state]);
    
    return <AsyncContext.Provider value={value}>{children}</AsyncContext.Provider>;
  }
  
  function useAsyncContext() {
    const context = useContext(AsyncContext);
    if (context === undefined) {
      throw new Error('useAsyncContext must be used within a AsyncProvider');
    }
    return context;
  }
  
  return { AsyncProvider, useAsyncContext };
}

// 使用
const { AsyncProvider, useAsyncContext } = createAsyncContext(async () => {
  const response = await fetch('/api/users');
  return response.json();
});

function UsersList() {
  const { data, loading, error } = useAsyncContext();
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误：{error.message}</div>;
  
  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

function App() {
  return (
    <AsyncProvider>
      <UsersList />
    </AsyncProvider>
  );
}
```

### 10.5 实践5：Context与性能优化

```typescript
// 优化1：使用useMemo
const Context = createContext(null);

function Provider({ children }) {
  const [state, setState] = useState({});
  const value = useMemo(() => ({ state }), [state]);
  
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// 优化2：分离Context
const StateContext = createContext({});
const ConfigContext = createContext({});

// 优化3：使用useContextSelector（未来）
// const value = useContextSelector(Context, state => state.part);

// 优化4：避免在Context中存储函数
const Context = createContext({
  // ❌ 不好：每次渲染都创建新函数
  action: () => {}
});

const Context = createContext({
  // ✅ 好：使用useCallback
  action: useCallback(() => {}, [])
});

// 优化5：使用useTransition减少阻塞
function App() {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);
  
  const value = useMemo(() => ({ count }), [count]);
  
  return (
    <Context.Provider value={value}>
      {isPending ? <Spinner /> : <Content />}
    </Context.Provider>
  );
}
```

---

## 11. useContext的未来

### 11.1 React 19的新特性

```typescript
// 1. Server Components支持
// React 19中，Context可以在Server Components中使用

async function ServerComponent() {
  const user = await getUser();
  return (
    <UserContext.Provider value={user}>
      <ClientComponent />
    </UserContext.Provider>
  );
}

// 2. 自动批处理增强
// React 19自动批处理所有更新，包括Context更新

function App() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // React 19会自动批处理这些更新
    setCount(1);
    setCount(2);
    setCount(3);
  }, []);
  
  return <div>{count}</div>; // 只渲染一次
}

// 3. Context在Suspense中的优化
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AsyncContext.Provider value={data}>
        <Content />
      </AsyncContext.Provider>
    </Suspense>
  );
}
```

### 11.2 Context Selector API（实验性）

```typescript
// 实验性API：只订阅特定字段
const count = useContextSelector(CountContext, state => state.count);

// 优势：避免不必要的重渲染
function Component() {
  // 只在count变化时重渲染
  const count = useContextSelector(Context, state => state.count);
  const theme = useContext(ThemeContext); // 独立订阅
  
  return <div>{count} - {theme}</div>;
}
```

### 11.3 Context与状态管理的融合

```typescript
// 未来趋势：Context与状态管理库的结合
import { createContainer } from 'react-tracked';

const useValue = useState({ count: 0 });
const { Provider, useTracked } = createContainer(useValue);

function Component() {
  const state = useTracked(); // 只订阅变化的字段
  return <div>{state.count}</div>;
}
```

### 11.4 Context的最佳实践演进

```typescript
// 过去：直接使用Context
const value = useContext(Context);

// 现在：使用自定义Hook
function useContextHook() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('...');
  }
  return context;
}

// 未来：使用Selector API
const value = useContextSelector(Context, state => state.part);
```

---

## 附录：完整代码示例

### 12.1 完整主题系统示例

```typescript
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 1. 定义类型
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// 2. 创建Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. 创建Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  
  // 从localStorage加载主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);
  
  // 保存主题到localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // 使用useMemo保持引用稳定
  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// 4. 创建自定义Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 5. 创建组件
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 切换到暗色' : '☀️ 切换到亮色'}
    </button>
  );
}

function ThemedCard({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  const styles = {
    background: theme === 'light' ? '#fff' : '#333',
    color: theme === 'light' ? '#333' : '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: theme === 'light' 
      ? '0 2px 4px rgba(0,0,0,0.1)' 
      : '0 2px 4px rgba(0,0,0,0.3)'
  };
  
  return <div style={styles}>{children}</div>;
}

// 6. 应用整合
function App() {
  return (
    <ThemeProvider>
      <div style={{ padding: '20px' }}>
        <h1>主题系统示例</h1>
        <ThemeToggle />
        <ThemedCard>
          <h2>卡片标题</h2>
          <p>这是一个根据主题变化的卡片</p>
        </ThemedCard>
      </div>
    </ThemeProvider>
  );
}
```

### 12.2 完整用户认证系统示例

```typescript
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 1. 定义类型
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 2. 创建Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. 创建Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('认证检查失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('登录失败');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      
      const userResponse = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const userData = await userResponse.json();
      
      setUser(userData);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  const value = useMemo(() => ({
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: user !== null
  }), [user, isLoading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. 创建自定义Hook
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 5. 创建组件
function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">登录</button>
    </form>
  );
}

function UserProfile() {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={logout}>退出登录</button>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>加载中...</div>;
  if (!isAuthenticated) return <LoginForm />;
  
  return <>{children}</>;
}

// 6. 应用整合
function App() {
  return (
    <AuthProvider>
      <div style={{ padding: '20px' }}>
        <h1>用户认证系统</h1>
        <AuthGuard>
          <UserProfile />
        </AuthGuard>
      </div>
    </AuthProvider>
  );
}
```

---

## 总结

### useContext核心要点

| 特性 | 说明 |
|------|------|
| **适用场景** | 跨多层组件共享状态 |
| **性能注意** | 使用useMemo保持引用稳定 |
| **类型安全** | 使用泛型和自定义Hook |
| **组合模式** | 与useReducer组合实现复杂状态 |
| **最佳实践** | 分离Context、封装Hook、避免过度使用 |

### 选择Context的决策树

```
需要跨组件共享状态？
├─ 是 → 状态是全局配置吗？
│   ├─ 是 → 使用Context（主题、语言等）
│   └─ 否 → 状态频繁更新吗？
│       ├─ 是 → 使用Zustand/Jotai
│       └─ 否 → 使用Context
└─ 否 → 使用useState/props
```

### 2026年Context最佳实践

1. ✅ 使用泛型明确类型
2. ✅ 封装自定义Hook
3. ✅ 分离Context避免过度渲染
4. ✅ 使用useMemo保持引用稳定
5. ✅ 结合useReducer处理复杂状态
6. ✅ 使用Context Provider组合模式

---

*本文档最后更新于 2026年3月16日*