# Zustand 中间件系统详解

> 本文深入解析 Zustand 的中间件系统，包括 persist、devtools、immer 等内置中间件的原理及自定义中间件的编写方法。

## 一、中间件系统概述

### 1.1 中间件类型定义

```typescript
// zustand/src/types.ts

/**
 * Middleware 中间件类型签名
 *
 * 中间件是一个高阶函数：
 * 1. 接收一个 StateCreator（原始 creator）
 * 2. 返回一个新的 StateCreator（增强版）
 *
 * @param creator - 原始的状态创建器
 * @param muidcs - 展开参数（用于类型推断）
 * @param ms - 中间件参数
 */
type Middleware = <
  T extends StateCreator<any>,
  Mps extends [any] = [],
  Mpa extends [any] = []
>(
  creator: T,
  muidcs: Mps,
  ms: Mpa
) => T;
```

### 1.2 中间件执行流程

```typescript
// 中间件组合流程
// middlewares.reduceRight 从右到左组合

// applyMiddleware([devtools, persist, immer], creator)
// 执行顺序：immer -> persist -> devtools -> creator

/**
 * 中间件执行示意
 */
const combinedCreator = (
  set, get, api
) => {
  // 1. devtools 层
  const loggedSet = (partial, replace) => {
    console.log('Action dispatched');
    return originalSet(partial, replace);
  };

  // 2. persist 层
  const persistedSet = (partial, replace) => {
    const newState = typeof partial === 'function'
      ? partial(currentState)
      : partial;
    localStorage.setItem('store', JSON.stringify(newState));
    return loggedSet(partial, replace);
  };

  // 3. immer 层
  const immerSet = (partial, replace) => {
    // immer 的 produce 函数包装
    const draftState = currentState;
    const nextState = typeof partial === 'function'
      ? produce(draftState, partial)
      : partial;
    return persistedSet(nextState, replace);
  };

  // 4. 原始 creator
  return creator(immerSet, get, api);
};
```

## 二、persist 中间件

### 2.1 persist 中间件概述

| 特性 | 说明 |
|------|------|
| **作用** | 将状态持久化到 localStorage/sessionStorage |
| **存储位置** | 可配置为 localStorage、sessionStorage 或自定义存储 |
| **恢复时机** | store 初始化时自动恢复 |
| **部分持久化** | 支持 partialize 选择性持久化字段 |

### 2.2 persist 核心实现

```typescript
// zustand/src/middleware/persist.ts

/**
 * Persist 中间件配置项
 */
interface PersistOptions<T> {
  /** 存储键名 */
  name: string;

  /** 存储引擎（默认 localStorage） */
  storage?: Storage;

  /** 自定义存储（如 sessionStorage、IndexedDB）*/
  getStorage?: () => Storage;

  /** 从存储恢复状态时的处理 */
  deserialize?: (str: string) => T;

  /** 存储状态时的处理 */
  serialize?: (state: T) => string;

  /** 只持久化部分状态 */
  partialize?: (state: T) => Partial<T>;

  /** 恢复前合并 */
  merge?: (persisted: Partial<T>, current: T) => T;

  /** 版本号，用于数据迁移 */
  version?: number;

  /** 迁移函数 */
  migrate?: (persisted: any, version: number) => T;

  /** 是否在键盘快捷键触发时保存 */
  saveOnKeyboardShortcut?: string | null;

  /** 订阅存储变化的回调 */
  onRehydrateStorage?: (state: T) => (() => void) | void;
}

/**
 * persist 中间件实现
 */
function persist<T extends StateCreator<any>>(
  creator: T,
  config: PersistOptions<InferFromCreator<T>>
): T {
  const {
    name,                    // 存储键名
    storage,                 // 存储引擎
    getStorage = () => localStorage,  // 默认使用 localStorage
    serialize = JSON.stringify,       // 默认使用 JSON 序列化
    deserialize = JSON.parse,         // 默认使用 JSON 反序列化
    partialize,              // 选择性持久化
    merge = Object.assign,   // 默认使用 Object.assign 合并
    version = 0,              // 默认版本 0
    migrate,                 // 迁移函数
    onRehydrateStorage,      // 恢复完成回调
  } = config;

  // 恢复状态的核心逻辑
  const rehydrate = (): Partial<InferFromCreator<T>> | null => {
    const currentStorage = getStorage();

    try {
      // 从存储中读取数据
      const storedState = currentStorage.getItem(name);

      if (storedState === null) {
        return null;  // 没有存储数据
      }

      // 反序列化
      const parsedState = deserialize(storedState);

      // 版本检查和迁移
      if (parsedState && typeof parsedState === 'object') {
        if (typeof parsedState._version === 'number') {
          if (parsedState._version !== version) {
            // 版本不匹配，执行迁移
            if (migrate) {
              return migrate(parsedState, parsedState._version);
            }
          }
        } else if (migrate) {
          // 没有版本信息，视为旧版本，执行迁移
          return migrate(parsedState, 0);
        }
      }

      return parsedState;
    } catch (error) {
      // 存储读取失败，忽略错误
      console.warn('Failed to parse stored state:', error);
      return null;
    }
  };

  // 返回增强版的 creator
  return (set, get, api) => {
    // 1. 从存储恢复状态
    const restoredState = rehydrate();

    // 2. 创建原始 store
    const initialState = restoredState
      ? creator(
          // 包装 set 函数，支持持久化
          (partial, replace) => {
            set((state) => {
              // 如果部分持久化，只取需要的字段
              const serialized = partialize
                ? partialize(state)
                : state;
              return serialized;
            }, replace);
          },
          get,
          api
        )
      : creator(set, get, api);

    // 3. 合并恢复的状态
    const state = restoredState
      ? merge(restoredState, initialState)
      : initialState;

    // 4. 初始化状态（用于首次渲染）
    set(state, true);

    // 5. 返回包装后的 creator
    return {
      ...initialState,
      // 添加持久化相关方法
      // ...
    } as T;
  };
}
```

### 2.3 persist 完整使用示例

```typescript
// 基本用法
const useStore = create(
  persist(
    (set) => ({
      count: 0,
      user: null,
    }),
    {
      name: 'my-app-storage',  // localStorage key
    }
  )
);

// 高级配置
const useStore = create(
  persist(
    (set) => ({
      // 状态
      user: null,
      preferences: { theme: 'light', language: 'en' },
      drafts: [],
    }),
    {
      name: 'app-storage',

      // 使用 sessionStorage
      getStorage: () => sessionStorage,

      // 只持久化部分字段
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
        // 排除 drafts
      }),

      // 版本管理
      version: 1,

      // 数据迁移
      migrate: (persistedState, version) => {
        if (version === 0) {
          // 从 v0 迁移
          return {
            ...persistedState,
            preferences: {
              ...persistedState.preferences,
              // 添加新字段默认值
              newField: 'default',
            },
          };
        }
        return persistedState;
      },

      // 恢复完成回调
      onRehydrateStorage: (state) => {
        console.log('State recovered from storage');
        return () => console.log('Cleanup');  // 返回清理函数
      },
    }
  )
);
```

## 三、devtools 中间件

### 3.1 devtools 中间件概述

| 特性 | 说明 |
|------|------|
| **作用** | 集成 Redux DevTools，支持状态回溯和调试 |
| **支持环境** | 仅浏览器扩展模式 |
| **Action 记录** | 自动记录所有 setState 调用 |
| **时间旅行** | 支持撤销/重做操作 |

### 3.2 devtools 核心实现

```typescript
// zustand/src/middleware/devtools.ts

/**
 * DevTools 中间件配置项
 */
interface DevtoolsOptions {
  /** 在 DevTools 中的名称 */
  name?: string;

  /** 是否启用（生产环境自动禁用） */
  enabled?: boolean;

  /** Action 类型 */
  actionNameProperty?: string;

  /** 状态更新之前触发 */
  onStateChange?: (state: any) => void;

  /** 实时追踪状态 */
  trace?: boolean;

  /** 状态变化时暂停 */
  pauseWhereas?: (action: any) => boolean;
}

/**
 * devtools 中间件实现
 */
function devtools<T extends StateCreator<any>>(
  creator: T,
  options: DevtoolsOptions
): T {
  const {
    name = 'Zustand',       // 默认名称
    enabled = true,         // 默认启用
    actionNameProperty,     // Action 名称属性
    onStateChange,          // 状态变化回调
    trace = false,          // 是否追踪调用栈
    pauseWhereas,           // 暂停条件
  } = options || {};

  // 获取 Redux DevTools 扩展
  const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  // 如果没有安装扩展或未启用，返回原始 creator
  if (!enabled || !devtools) {
    return creator;
  }

  // 连接 DevTools
  const connection = devtools.connect({ name });

  // 包装 set 函数
  return (set, get, api) => {
    // 原始 set 函数
    const originalSet = set;

    // 包装后的 set 函数
    const wrappedSet: typeof set = (partial, replace) => {
      // 获取下一个状态
      const nextState = typeof partial === 'function'
        ? partial(get())
        : partial;

      // 如果有暂停条件且满足，跳过
      if (pauseWhereas && pauseWhereas({ type: `${name}/SET` })) {
        return;
      }

      // 调用原始 set
      originalSet(partial, replace);

      // 通知 DevTools
      connection.send(
        // Action 名称
        actionNameProperty || `${name}/SET`,
        // 发送完整状态
        get()
      );
    };

    // 调用原始 creator，返回结果
    const result = creator(wrappedSet, get, api);

    // 订阅状态变化（用于 onStateChange 回调）
    if (onStateChange) {
      api.subscribe((state) => {
        onStateChange(state);
      });
    }

    // 发送初始状态
    connection.send('INIT', get());

    return result;
  };
}
```

### 3.3 devtools 使用示例

```typescript
// 基本用法
const useStore = create(
  devtools(
    (set) => ({
      count: 0,
    }),
    { name: 'Counter Store' }
  )
);

// 追踪调用栈（生产环境禁用）
const useStore = create(
  devtools(
    (set) => ({
      data: [],
      fetch: async () => {
        const response = await fetch('/api/data');
        set({ data: await response.json() });
      },
    }),
    {
      name: 'Data Store',
      trace: process.env.NODE_ENV !== 'production',
    }
  )
);

// 自定义 Action
const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'Counter',
      actionNameProperty: 'increment',  // 自定义 Action 名称
    }
  )
);
```

## 四、immer 中间件

### 4.1 immer 中间件概述

| 特性 | 说明 |
|------|------|
| **作用** | 支持 "草稿式" 状态更新，简化不可变数据操作 |
| **原理** | 使用 Proxy 拦截状态修改，自动处理不可变性 |
| **优点** | 代码更直观，无需手动展开嵌套对象 |
| **注意** | Immer 本身是一个独立库，Zustand 只是集成 |

### 4.2 immer 核心实现

```typescript
// zustand/src/middleware/immer.ts

/**
 * 使用 Immer 的 create 函数
 * 直接修改 draft，自动产生不可变结果
 */
import { produce, Draft } from 'immer';

/**
 * Immer 中间件配置项
 */
interface ImmerOptions {
  /** 是否启用 Immer */
  enabled?: boolean;
  /** 自动冻结 */
  autoFreeze?: boolean;
  /** Immer 配置 */
  onSetup?: (draft: any) => void;
}

/**
 * immer 中间件实现
 */
function immer<T extends StateCreator<any>>(
  creator: T,
  options: ImmerOptions = {}
): T {
  const { enabled = true } = options;

  // 如果禁用，直接返回原始 creator
  if (!enabled) {
    return creator;
  }

  // 返回包装后的 creator
  return (set, get, api) => {
    // 包装 set 函数
    // Immer 的 produce 函数会自动处理不可变性
    const wrappedSet: typeof set = (updater, replace) => {
      // 判断 updater 是否是函数
      if (typeof updater === 'function') {
        // 使用 Immer 的 produce 处理函数式更新
        const producer = produce(updater as any);
        set(producer, replace);
      } else {
        // 对象式更新直接设置
        set(updater, replace);
      }
    };

    // 调用原始 creator
    return creator(wrappedSet, get, api);
  };
}

/**
 * 使用 Immer 的示例
 *
 * 注意：set 函数接收的是一个 "草稿" (draft)
 * 在草稿上的所有修改都会被 Immer 自动转换为不可变更新
 */
const useStore = create(
  immer((set) => ({
    // 状态
    user: {
      name: 'Alice',
      age: 30,
    },
    items: ['apple', 'banana'],

    // 方法
    // ❌ 传统写法：需要手动展开
    updateUser: (name: string) => set((state) => ({
      ...state,
      user: { ...state.user, name },
    })),

    // ✅ Immer 写法：直接修改
    // updateUser: (name: string) => set((draft) => {
    //   draft.user.name = name;
    // }),
  }))
);
```

### 4.3 immer 使用示例

```typescript
// 导入 Immer 中间件
import { immer } from 'zustand/middleware/immer';

// 嵌套对象更新
const useStore = create(
  immer((set) => ({
    user: {
      profile: {
        name: '',
        address: {
          city: '',
          zip: '',
        },
      },
    },

    // 深层嵌套更新 - 传统方式很繁琐
    // updateCity: (city) => set((state) => ({
    //   ...state,
    //   user: {
    //     ...state.user,
    //     profile: {
    //       ...state.user.profile,
    //       address: {
    //         ...state.user.profile.address,
    //         city,
    //       },
    //     },
    //   },
    // })),

    // Immer 方式 - 直接修改
    updateCity: (city) => set((draft) => {
      draft.user.profile.address.city = city;
    }),
  }))
);

// 数组操作
const useStore = create(
  immer((set) => ({
    items: [],

    // 添加元素
    addItem: (item) => set((draft) => {
      draft.items.push(item);
    }),

    // 删除元素
    removeItem: (index) => set((draft) => {
      draft.items.splice(index, 1);
    }),

    // 更新元素
    updateItem: (index, item) => set((draft) => {
      draft.items[index] = item;
    }),
  }))
);
```

## 五、自定义中间件

### 5.1 中间件模板

```typescript
/**
 * 自定义中间件模板
 *
 * 中间件是一个高阶函数：
 * 1. 接收原始 creator
 * 2. 返回新的 creator
 */
const myMiddleware = (creator) => (set, get, api) => {
  // 1. 在调用原始 creator 之前可以做预处理
  console.log('Store is being created');

  // 2. 调用原始 creator 获取初始状态
  const initialState = creator(set, get, api);

  // 3. 在原始状态基础上添加新功能
  const enhancedState = {
    ...initialState,
    // 添加新属性或方法
    _createdAt: Date.now(),
    _version: '1.0.0',
  };

  // 4. 返回增强后的状态
  return enhancedState;
};

// 使用自定义中间件
const useStore = create(myMiddleware((set, get) => ({
  count: 0,
})));
```

### 5.2 完整中间件示例：日志中间件

```typescript
/**
 * Logger 中间件 - 记录所有状态变化
 */
const loggerMiddleware = (config) => (set, get, api) => {
  // 原始 set 函数
  const originalSet = set;

  // 包装 set 函数
  const loggedSet = (
    partial: any,
    replace?: boolean
  ) => {
    const prevState = get();

    // 获取下一个状态
    const nextState = typeof partial === 'function'
      ? partial(prevState)
      : partial;

    // 格式化 Action 名称
    const actionName = typeof partial === 'function'
      ? partial.toString().slice(0, 50)
      : Object.keys(partial)[0] || 'unknown';

    // 打印日志
    console.group(`[Zustand] ${actionName}`);
    console.log('Previous:', prevState);
    console.log('Next:', nextState);
    console.log('Changed keys:', getChangedKeys(prevState, nextState));
    console.groupEnd();

    // 调用原始 set
    originalSet(partial, replace);
  };

  // 调用原始 creator，返回结果
  const result = config(loggedSet, get, api);

  return result;
};

// 辅助函数：获取变化的键
function getChangedKeys(prev: any, next: any): string[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  return Array.from(keys).filter((key) => !Object.is(prev[key], next[key]));
}

// 使用
const useStore = create(
  loggerMiddleware((set) => ({
    count: 0,
    user: null,
  }))
);
```

### 5.3 完整中间件示例：限时状态

```typescript
/**
 * Expire 中间件 - 状态自动过期
 */
const expireMiddleware = (config) => (set, get, api) => {
  // 过期时间映射
  const expirationMap = new Map<string, number>();

  // 原始 set 函数
  const originalSet = set;

  // 包装 set 函数
  const expiringSet = (
    partial: any,
    replace?: boolean,
    // 自定义选项：过期时间（毫秒）
    expiresIn?: number
  ) => {
    // 如果指定了过期时间
    if (expiresIn !== undefined) {
      // 生成唯一键
      const key = `expire_${Date.now()}_${Math.random()}`;
      const expireTime = Date.now() + expiresIn;

      // 保存过期时间
      expirationMap.set(key, expireTime);

      // 设置定时器
      setTimeout(() => {
        // 检查是否过期
        if (expirationMap.get(key) === expireTime) {
          // 状态仍然存在，清除它
          set((state) => {
            const newState = { ...state };
            delete newState[key.replace('expire_', '')];
            return newState;
          });
          expirationMap.delete(key);
        }
      }, expiresIn);
    }

    // 调用原始 set
    originalSet(partial, replace);
  };

  // 调用原始 creator
  return config(expiringSet, get, api);
};

// 使用
const useStore = create(
  expireMiddleware((set) => ({
    // 临时数据，5秒后自动清除
    tempData: null,
    setTempData: (data) => set({ tempData: data }, undefined, 5000),
  }))
);
```

### 5.4 中间件组合顺序

```typescript
// 中间件从右到左执行
// applyMiddleware(creator, [m1, m2, m3])
// 等价于：m1(m2(m3(creator)))

/**
 * 常见组合顺序
 */

// 1. devtools 在最外层，记录所有 Action
const useStore = create(
  devtools(
    persist(
      immer(
        (set) => ({ ... }),
        { name: 'store' }
      )
    )
  )
);

// 2. 自定义中间件放在最外层
const useStore = create(
  loggerMiddleware(
    devtools(
      persist(
        (set) => ({ ... }),
        { name: 'store' }
      )
    )
  )
);

// 3. 多层中间件
const useStore = create(
  loggerMiddleware(
    devtools(
      persist(
        immer(
          (set) => ({ ... }),
        ),
        { name: 'store' }
      )
    )
  )
);
```

## 六、中间件进阶

### 6.1 访问原始 Store API

```typescript
/**
 * 中间件可以访问 Store API
 * api 对象包含：getState, setState, subscribe, destroy
 */
const accessApiMiddleware = (creator) => (set, get, api) => {
  // getState: 获取当前状态
  const currentState = get();

  // setState: 设置状态
  api.setState({ newField: 'value' });

  // subscribe: 订阅状态变化
  const unsubscribe = api.subscribe((state, prev) => {
    console.log('State changed:', state);
  });

  // destroy: 销毁 store
  api.destroy();

  return creator(set, get, api);
};
```

### 6.2 中间件参数

```typescript
/**
 * 带参数的中间件工厂函数
 */
const createTimingMiddleware = (options: {
  log?: boolean;
  prefix?: string;
}) => {
  const { log = false, prefix = '[Store]' } = options;

  return (creator) => (set, get, api) => {
    if (log) {
      const originalSet = set;
      set = (...args) => {
        console.log(`${prefix} set called`);
        return originalSet(...args);
      };
    }

    return creator(set, get, api);
  };
};

// 使用
const useStore = create(
  createTimingMiddleware({ log: true, prefix: '[Counter]' })(
    (set) => ({ count: 0 })
  )
);
```

## 七、面试要点

| 问题 | 答案要点 |
|------|----------|
| Zustand 中间件系统的原理？ | 高阶函数，包装原始 creator，返回增强版 creator |
| persist 中间件如何实现持久化？ | 使用 localStorage/sessionStorage，在初始化时恢复状态 |
| persist 的 partialize 作用？ | 选择性持久化，只保存需要的字段，减少存储开销 |
| devtools 中间件如何工作？ | 连接到 Redux DevTools Extension，发送状态和 Action |
| immer 中间件的优点？ | 代码更直观，无需手动展开嵌套对象 |
| 中间件执行顺序？ | 从右到左，最后添加的中间件最外层 |
| 如何自定义中间件？ | 创建 `(creator) => (set, get, api) => { ... }` 形式的高阶函数 |
| 中间件如何访问 Store API？ | 通过 creator 的第三个参数 `api` 访问 |
