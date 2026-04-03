# Vue3 响应式系统源码深度分析

## 一、响应式系统概述

Vue3 的响应式系统是整个框架的核心模块之一，负责追踪状态变化并自动更新视图。与 Vue2 使用的 `Object.defineProperty` 不同，Vue3 基于 JavaScript 的 `Proxy` 代理机制实现数据劫持，提供了更强大、更全面的响应式能力。

### 1.1 源码目录结构

Vue3 响应式系统的源码位于 `packages/reactivity/src/` 目录下：

```
packages/reactivity/src/
├── reactivity.ts          # reactive、readonly、shallowReactive 入口
├── ref.ts                # ref、computed、watch 入口
├── baseHandlers.ts       # Proxy 的 handler 实现（reactive 对象）
├── collectionHandlers.ts # Proxy 的 handler 实现（Map、Set、WeakMap、WeakSet）
├── dep.ts                # 依赖收集器（Dep、TrackOpBit）
├── effect.ts             # effect、watchEffect、scheduler
├── computed.ts           # computed 实现
└── watch.ts              # watch、watchEffect 实现
```

### 1.2 核心类型定义

响应式系统的核心类型定义在 `packages/reactivity/src/index.ts`：

```typescript
// 响应式对象的标记接口
export interface Target {
  [ReactiveMarker]?: boolean
}

// 响应式符号
const reactiveMarker = Symbol('v3.0 reactive marker')
```

---

## 二、Proxy 代理机制

### 2.1 Proxy 基础概念

Proxy 是 ES6 引入的元编程特性，允许创建一个代理对象，拦截并自定义对象的基本操作。Vue3 利用这一特性实现数据劫持。

**核心拦截方法：**

| 拦截方法 | 作用 | Vue3 应用 |
|---------|------|----------|
| `get` | 拦截属性读取 | 依赖收集（track） |
| `set` | 拦截属性设置 | 触发更新（trigger） |
| `deleteProperty` | 拦截属性删除 | 触发更新 |
| `has` | 拦截 `in` 操作符 | 依赖收集 |
| `ownKeys` | 拦截 `Object.keys()` | 遍历收集 |

### 2.2 baseHandlers.ts 源码解析

`baseHandlers.ts` 文件（`packages/reactivity/src/baseHandlers.ts`）定义了 reactive 对象的 Proxy 处理器：

#### 2.2.1 get 拦截器（依赖收集）

```typescript
// packages/reactivity/src/baseHandlers.ts 第 50-120 行
const get = /* @__PURE__ */ createGetter()

function createGetter(
  isReadonly = false,
  shallow = false
) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    // 1. 使用 Reflect.get 获取原始值
    const res = Reflect.get(target, key, receiver)

    // 2. 如果是 Symbol 类型且是内置 Symbol，处理特殊逻辑
    if (isSymbol(key) && builtinOps[key]) {
      return res
    }

    // 3. 浅响应式直接返回
    if (shallow) {
      !isReadonly && track(target, TrackOpTypes.GET, key)
      return res
    }

    // 4. 如果是 ref 类型，获取其内部值
    if (isRef(res)) {
      // 如果目标是 reactive 对象，ref 不需要自动解包
      if (targetIsAlwaysTopLevel) {
        return res
      }
      // 否则返回 ref 的值（自动解包）
      return res.value
    }

    // 5. 递归深层响应式，确保嵌套对象也是响应式的
    if (isObject(res)) {
      return isReadonly
        ? // 只读属性递归只读代理
          readonly(res)
        : // 响应式属性递归响应式代理
          reactive(res)
    }

    // 6. 收集依赖到当前激活的 effect
    !isReadonly && track(target, TrackOpTypes.GET, key)

    return res
  }
}
```

**设计原理：**
- `Reflect.get` 确保正确访问原型链上的属性
- 嵌套对象自动包装成响应式，实现深层响应式
- ref 类型自动解包（当在 reactive 中访问时）
- `track` 函数将当前激活的 effect 与 target.key 关联

#### 2.2.2 set 拦截器（触发更新）

```typescript
// packages/reactivity/src/baseHandlers.ts 第 130-180 行
const set = /* @__PURE__ */ createSetter()

function createSetter(
  isReadonly = false,
  shallow = false
) {
  return function set(
    target: Target,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    // 1. 保存旧值
    const oldValue = target[key]

    // 2. 判断是新增还是修改
    if (!isReadonly) {
      // shallow 模式下不比较
      if (!shallow) {
        // 比较新值和旧值
        if (!isSymbol(key) && builtinOps[key]) {
          // 某些内置操作如数组长度修改，不进行旧值比较
        } else if (wasNonArray && isArray(target)) {
          // 数组设置索引时，标记为新增
        }
      }
    }

    // 3. 设置新值
    const result = Reflect.set(target, key, value, receiver)

    // 4. 如果目标对象不是原型链上的对象，才触发更新
    if (target === toRaw(receiver)) {
      // 触发依赖更新
      if (!shallow) {
        // 比较新值和旧值，只有不同时才触发
        if (oldValue !== value && (oldValue === oldValue || value === value)) {
          trigger(target, TriggerOpTypes.SET, key, value, oldValue)
        }
      } else {
        // 浅响应式直接触发
        trigger(target, TriggerOpTypes.SET, key, value)
      }
    }

    return result
  }
}
```

**设计原理：**
- `Reflect.set` 返回是否设置成功
- 通过 `target === toRaw(receiver)` 判断是否是原型链上的设置
- 使用 `oldValue !== value` 比较避免无意义更新
- NaN 比较处理（`oldValue === oldValue` 用于检测 NaN）

#### 2.2.3 deleteProperty 拦截器

```typescript
// packages/reactivity/src/baseHandlers.ts 第 190-220 行
const deleteProperty = /* @__PURE__ */ function deleteProperty(
  target: Target,
  key: string | symbol
): boolean {
  // 1. 检查属性是否存在
  const hadKey = hasOwn(target, key)

  // 2. 使用 Reflect.deleteProperty 删除属性
  const result = Reflect.deleteProperty(target, key)

  // 3. 如果删除成功且属性曾存在，触发更新
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, undefined)
  }

  return result
}
```

#### 2.2.4 has 拦截器（in 操作符）

```typescript
// packages/reactivity/src/baseHandlers.ts 第 230-250 行
const has = /* @__PURE__ */ function has(
  target: Target,
  key: string | symbol
): boolean {
  // 收集 'in' 操作符的依赖
  track(target, TrackOpTypes.HAS, key)
  return Reflect.has(target, key)
}
```

### 2.3 完整 Handler 对象

```typescript
// packages/reactivity/src/baseHandlers.ts 第 290-320 行
export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}

export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
  deleteProperty: readonlyDeleteProperty,
  has: readonlyHas,
  ownKeys: readonlyOwnKeys
}

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
  deleteProperty: shallowDeleteProperty,
  has: shallowHas,
  ownKeys: shallowOwnKeys
}
```

---

## 三、reactive 与 ref 实现

### 3.1 createReactiveObject 核心函数

```typescript
// packages/reactivity/src/reactivity.ts 第 80-130 行
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<object>,
  collectionHandlers: ProxyHandler<object>,
  proxyMap: WeakMap<object, object>
) {
  // 1. 校验目标对象，不能是 non-object 类型
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }

  // 2. 如果目标对象已经被代理，直接返回已有代理
  // 这确保了 reactive(reactive(obj)) === reactive(obj)
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 3. 创建代理对象
  const proxy = new Proxy(
    target,
    // 根据目标类型选择不同的 handlers
    // Map、Set、WeakMap、WeakSet 使用 collectionHandlers
    // 普通对象使用 baseHandlers
    isCollectionType(target)
      ? collectionHandlers
      : baseHandlers
  )

  // 4. 缓存到 WeakMap
  proxyMap.set(target, proxy)

  return proxy
}
```

**设计原理：**
- `WeakMap` 确保没有强引用时垃圾回收正常工作
- 相同 target 多次调用 `reactive` 返回相同代理
- 根据目标类型选择不同 handler（集合类型 vs 普通对象）

### 3.2 reactive 函数入口

```typescript
// packages/reactivity/src/reactivity.ts 第 150-170 行
/**
 * 创建一个响应式代理
 * reactive(obj) 返回一个深度响应式代理
 */
export function reactive<T extends object>(target: T): T {
  // 如果已经在只读模式下，返回只读版本
  if (isReadonly(target)) {
    return target
  }

  return createReactiveObject(
    target,
    false,                      // isReadonly = false
    mutableHandlers,            // 普通对象处理器
    collectionHandlers,         // 集合对象处理器
    reactiveMap                 // 缓存 Map
  )
}
```

### 3.3 ref 实现原理

ref 用于包装基本类型数据，通过定义 `get value` 和 `set value` 实现响应式：

```typescript
// packages/reactivity/src/ref.ts 第 30-80 行
export class RefImpl<T> {
  // 存储实际值
  private _value: T

  // 存储原始值（用于比较）
  private _rawValue: T

  // 依赖收集器
  public dep: Dep | undefined

  // 标记是否是只读
  public readonly __v_isRef = true

  constructor(value: T, public readonly __v_isShallow: boolean = false) {
    // 浅 ref 直接存储原始值
    // 深层 ref 存储 reactive 包装后的值
    this._rawValue = value
    this._value = __v_isShallow ? value : toReactive(value)
  }

  // get 拦截：访问 ref 的 value 时触发依赖收集
  get value() {
    // 收集依赖到当前激活的 effect
    trackRefValue(this)
    // 返回值
    return this._value
  }

  // set 拦截：设置 ref 的 value 时触发更新
  set value(newValue: T) {
    // 如果是浅 ref 或者值真的改变了
    const useValue = this.__v_isShallow
      ? newValue
      : toRaw(newValue)

    if (hasChanged(newValue, this._rawValue)) {
      // 更新原始值
      this._rawValue = newValue
      // 更新响应式值
      this._value = this.__v_isShallow ? newValue : toReactive(newValue)
      // 触发依赖更新
      triggerRefValue(this, newValue)
    }
  }
}
```

**ref 与 reactive 的区别：**

| 特性 | ref | reactive |
|-----|-----|----------|
| 适用类型 | 基本类型 + 对象 | 仅对象 |
| 访问方式 | `.value` | 直接属性访问 |
| 数组支持 | ref包裹的对象数组元素不解包 | 完全响应式 |
| 解包机制 | 模板中自动解包 | 自动解包 |

### 3.4 reactiveCollections（Map、Set、WeakMap、WeakSet）

Vue3 对集合类型使用特殊的处理器：

```typescript
// packages/reactivity/src/collectionHandlers.ts 第 30-100 行
export const collectionHandlers: ProxyHandler<CollectionTypes> = {
  get(target: CollectionTypes, key: symbol | string, receiver: ProxyHandler[any]) {
    // 1. 拦截 get 方法，返回增强后的方法
    if (key === 'size') {
      // 遍历集合触发依赖收集
      track(target, TrackOpTypes.ITERATE, ITERATION_KEY)
      return Reflect.get(target, key, receiver)
    }

    // 2. 拦截修改集合的方法（这些方法会触发更新）
    const method = collectionMethods[key]
    if (method) {
      return function (...args) {
        // 执行原始方法
        const result = method.apply(target, args)
        // 触发更新
        trigger(target, TriggerOpTypes.ADD, ITERATION_KEY)
        return result
      }
    }

    return Reflect.get(target, key, receiver)
  }
}
```

---

## 四、effect 与依赖收集

### 4.1 依赖收集核心概念

Vue3 的依赖收集采用「订阅-发布」模式：

```
响应式数据 (target)
    ├── key1 → Dep (依赖集合)
    │           └── [effect1, effect2, ...]
    ├── key2 → Dep
    │           └── [effect3, ...]
    └── ...
```

### 4.2 Dep 依赖收集器

```typescript
// packages/reactivity/src/dep.ts 第 10-60 行
export class Dep {
  // 存储所有依赖当前属性的 effect
  public const seeps = new Set<EffectCore>()

  // 版本号，用于判断是否需要更新
  public version = 0

  // 递归追踪深度
  public targetStack: (ReactiveEffect | undefined)[] = []

  constructor() {}

  // 添加依赖
  public addSub(sub: EffectCore) {
    this.subs.add(sub)
  }

  // 移除依赖
  public deleteSub(sub: EffectCore) {
    this.subs.delete(sub)
  }

  // 通知所有依赖更新
  public notify() {
    // 遍历所有依赖，调用其 update 方法
    this.subs.forEach((effect) => effect.update())
  }
}
```

### 4.3 track 依赖追踪

```typescript
// packages/reactivity/src/effect.ts 第 180-220 行
/**
 * 收集依赖
 * 当访问响应式对象的属性时调用
 */
export function track(
  target: object,
  type: TrackOpTypes,
  key: unknown
) {
  // 1. 获取当前激活的 effect
  let activeEffect = effectStack[effectStack.length - 1]

  if (activeEffect) {
    // 2. 如果是 GET 操作，建立关联
    if (type === TrackOpTypes.GET) {
      // 获取或创建 key 对应的 Dep
      let depsMap = targetMap.get(target)
      if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
      }

      let dep = depsMap.get(key)
      if (!dep) {
        depsMap.set(key, (dep = new Dep()))
      }

      // 3. 建立 activeEffect 到 dep 的关联
      trackEffect(activeEffect, dep)
    }
  }
}

/**
 * 建立 effect 和 dep 的双向关联
 */
export function trackEffect(
  effect: EffectCore,
  dep: Dep
) {
  // 将 dep 添加到 effect 的 deps 数组
  if (dep.addSub(effect)) {
    // 将 effect 添加到 dep 的 subs 数组
    effect.deps.push(dep)
  }
}
```

**全局依赖存储结构：**

```typescript
// packages/reactivity/src/effect.ts 第 10-20 行
// targetMap: WeakMap<object, Map<key, Dep>>
// 存储所有响应式对象的依赖映射
const targetMap = new WeakMap<object, Map<unknown, Dep>>()

// 效果栈，用于支持嵌套 effect
const effectStack: ReactiveEffect[] = []
```

### 4.4 trigger 触发更新

```typescript
// packages/reactivity/src/effect.ts 第 230-280 行
/**
 * 触发更新
 * 当响应式属性被修改时调用
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown
) {
  // 1. 获取目标对象的所有依赖
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  // 2. 获取对应 key 的 dep
  const dep = depsMap.get(key)
  if (dep) {
    // 触发更新
    triggerEffects(dep)
  }

  // 3. 特殊处理：数组长度变化
  if (type === TriggerOpTypes.ADD && isArray(target)) {
    // 当数组添加元素时，长度依赖也需要更新
    const lengthDep = depsMap.get('length')
    if (lengthDep) {
      triggerEffects(lengthDep)
    }
  }

  // 4. 特殊处理：清空数组
  if (key === 'length' && isArray(target)) {
    // 数组长度变小时，比长度大的索引对应的依赖需要更新
    depsMap.forEach((dep, k) => {
      if (k !== 'length' && Number(k) >= newValue) {
        triggerEffects(dep)
      }
    })
  }
}

/**
 * 触发 effect 更新
 */
export function triggerEffects(dep: Dep) {
  // 遍历所有依赖的 effect
  for (const effect of dep.subs) {
    // 如果有 scheduler，调用 scheduler
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      // 否则直接调用 update
      effect.update()
    }
  }
}
```

### 4.5 effect 函数实现

```typescript
// packages/reactivity/src/effect.ts 第 80-150 行
export class ReactiveEffect<T = any> {
  // 依赖列表
  deps: Dep[] = []

  // 是否处于激活状态
  public active = true

  // 递归深度
  public score = 0

  constructor(
    public fn: () => T,           // 副作用函数
    public scheduler: (() => void) | null = null,  // 调度器
    scope?: EffectScope
  ) {
    // 记录创建时的 effect scope
    if (scope && scope !== currentEffectScope) {
      // 将当前 effect 加入 scope
    }
  }

  // 执行副作用函数
  public run() {
    // 1. 如果不是激活状态，直接执行 fn
    if (!this.active) {
      return this.fn()
    }

    // 2. 将当前 effect 压入栈
    effectStack.push(this)

    // 3. 记录上一个 activeEffect
    const prevActiveEffect = currentEffect

    try {
      // 4. 设置为当前激活的 effect
      currentEffect = this

      // 5. 执行 fn，期间访问响应式属性会触发 track
      return this.fn()
    } finally {
      // 6. 恢复上一个 effect
      currentEffect = prevActiveEffect

      // 7. 弹出栈
      effectStack.pop()
    }
  }

  // 停止 effect
  public stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}

/**
 * 创建 effect
 */
export function effect<T = any>(
  fn: () => T,
  options?: EffectOptions
): ReactiveEffect<T> {
  // 创建 effect
  const effect = new ReactiveEffect(fn, options?.scheduler)

  // 立即执行一次（收集依赖）
  if (!options?.lazy) {
    effect.run()
  }

  return effect
}
```

---

## 五、computed 原理

### 5.1 ComputedRefImpl 类

```typescript
// packages/reactivity/src/computed.ts 第 30-100 行
export class ComputedRefImpl<T> {
  // 内部 effect，用于追踪依赖
  private effect: ReactiveEffect<T>

  // 缓存的值
  private _value!: T

  // 标记是否为脏（需要重新计算）
  public _dirty = true

  // 缓存的版本号
  private version = 0

  // 依赖的 dep
  public dep: Dep

  constructor(
    private getter: ComputedGetter<T>,
    private setter: ComputedSetter<T>,
    public readonly __v_isRef = true
  ) {
    // 创建 effect，lazy 为 true（不立即执行）
    // scheduler 设为 () => this._dirty = true（标记为脏）
    this.effect = new ReactiveEffect(getter, () => {
      // 当响应式依赖变化时，标记为脏
      if (!this._dirty) {
        this._dirty = true
        // 通知依赖这个 computed 的 effect 更新
        triggerRefValue(this)
      }
    })

    // 初始化 dep
    this.dep = new Dep()
  }

  // 读取 value 时触发
  get value() {
    // 1. 标记需要追踪
    trackRefValue(this)

    // 2. 如果是脏值，重新计算
    if (this._dirty) {
      this._dirty = false
      // 执行 effect.run() 会调用 getter，并收集依赖
      this._value = this.effect.run()!
      this.version = this.effect.version
    }

    return this._value
  }

  // 设置 value 时触发
  set value(newValue: T) {
    this.setter(newValue)
  }
}
```

### 5.2 computed 函数

```typescript
// packages/reactivity/src/computed.ts 第 110-150 行
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebugOptions
): ComputedRef<T> {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  // 1. 处理参数
  if (isFunction(getterOrOptions)) {
    // 只传入 getter
    getter = getterOrOptions
    setter = () => {
      console.warn('Write operation failed: computed value is readonly')
    }
  } else {
    // 传入 getter 和 setter
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  // 2. 创建 ComputedRefImpl 实例
  return new ComputedRefImpl(getter, setter)
}
```

### 5.3 DirtyFlag 工作机制

```
初始状态：
┌─────────────────────────────────────────────────────────┐
│  _dirty = true                                          │
│  _value = undefined                                      │
└─────────────────────────────────────────────────────────┘
           │
           ▼ 首次访问 value
┌─────────────────────────────────────────────────────────┐
│  执行 effect.run()                                       │
│  getter() 被调用，收集响应式依赖                          │
│  _dirty = false                                          │
│  _value = 计算结果                                        │
└─────────────────────────────────────────────────────────┘
           │
           ▼ 响应式依赖变化（触发 scheduler）
┌─────────────────────────────────────────────────────────┐
│  _dirty = true  （标记为脏）                              │
└─────────────────────────────────────────────────────────┘
           │
           ▼ 下次访问 value
┌─────────────────────────────────────────────────────────┐
│  重新执行 effect.run()                                   │
│  获得新值                                                │
│  _dirty = false                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 六、watch 与 watchEffect 实现

### 6.1 watch 实现原理

watch 用于监听特定数据源并在变化时执行回调：

```typescript
// packages/reactivity/src/watch.ts 第 80-150 行
/**
 * watch 实现
 * @param source 监听的数据源
 * @param cb 回调函数
 * @param options 配置选项
 */
export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options?: WatchOptions
): WatchHandle {
  // 1. 获取原始值
  const rawGetter = isFunction(source)
    ? source
    : () => traverse(source)

  // 2. 创建 effect 用于追踪
  const effect = new ReactiveEffect(rawGetter, () => {
    // scheduler：当依赖变化时触发
    if (job) {
      // 使用 queueJob 将回调放入队列，等待执行
      queueJob(job)
    }
  })

  // 3. 定义 job（实际执行回调的函数）
  const job = () => {
    // 重新执行 getter 获取新值
    const newValue = effect.run()
    // 获取旧值
    const oldValue = oldValueGetter ? oldValueGetter() : undefined

    // 调用回调
    cb(newValue, oldValue)

    // 更新旧值
    oldValueGetter = () => newValue
  }

  // 4. 立即执行一次（如果配置了 immediate）
  if (options?.immediate) {
    job()
  } else {
    // 记录初始旧值
    oldValueGetter = () => effect.run()
  }
}
```

### 6.2 watchEffect 实现原理

watchEffect 更简单，自动收集依赖：

```typescript
// packages/reactivity/src/watch.ts 第 180-220 行
/**
 * watchEffect 实现
 * @param effect 副作用函数
 */
export function watchEffect(
  effect: WatchEffect,
  options?: WatchOptionsBase
): WatchHandle {
  // 1. 创建 effect，自动收集依赖
  const ReactiveEffect = new ReactiveEffect(effect, () => {
    // scheduler：依赖变化时将 job 放入队列
    if (sync) {
      // 同步模式
      effect()
    } else {
      queueJob(job)
    }
  })

  // 2. 定义 job
  const job = () => {
    ReactiveEffect.run()
  }

  // 3. 立即执行一次（自动收集依赖）
  if (!options?.lazy) {
    ReactiveEffect.run()
  }

  // 4. 返回停止函数
  return () => {
    ReactiveEffect.stop()
  }
}
```

### 6.3 traverse 深层遍历

```typescript
// packages/reactivity/src/watch.ts 第 30-50 行
/**
 * 深层遍历数据源，确保所有嵌套响应式属性都被追踪
 */
function traverse(
  value: unknown,
  seen?: Set<unknown>
): unknown {
  // 1. 如果是原始值或非响应式对象，直接返回
  if (!isObject(value) || (value as any)[ReactiveMarker]) {
    return value
  }

  // 2. 防止循环引用
  if (seen) {
    if (seen.has(value)) {
      return value
    }
    seen.add(value)
  }

  // 3. 递归遍历响应式对象的所有属性
  for (const key in value) {
    traverse(value[key], seen)
  }

  return value
}
```

### 6.4 配置选项

```typescript
// packages/reactivity/src/watch.ts 第 10-25 行
export interface WatchOptions {
  /** 是否立即执行（默认 false） */
  immediate?: boolean
  /** 是否深度监听（默认 true） */
  deep?: boolean
  /** 同步执行（默认 false） */
  sync?: boolean
  /** 回调时机 */
  flush?: 'pre' | 'post' | 'sync'
  /** 错误处理 */
  onError?: (error: unknown) => void
}
```

---

## 七、完整响应式流程图

```
┌──────────────────────────────────────────────────────────────────────┐
│                          响应式系统完整流程                            │
└──────────────────────────────────────────────────────────────────────┘

1. 创建响应式对象
┌────────────────────────────────────────────────────────────────────┐
│  reactive(obj)                                                      │
│       │                                                              │
│       ▼                                                              │
│  createReactiveObject(target, false, mutableHandlers, ...)         │
│       │                                                              │
│       ▼                                                              │
│  new Proxy(target, handlers)  ──────►  缓存到 reactiveMap            │
│       │                                                              │
│       ▼                                                              │
│  返回代理对象 proxy                                                   │
└────────────────────────────────────────────────────────────────────┘

2. effect 执行与依赖收集
┌────────────────────────────────────────────────────────────────────┐
│  effect(() => {                                                     │
│    console.log(state.count)  // 访问响应式属性                        │
│  })                                                                 │
│       │                                                              │
│       ▼                                                              │
│  new ReactiveEffect(fn)                                              │
│       │                                                              │
│       ▼                                                              │
│  effect.run() ─► fn() 执行                                           │
│       │                                                              │
│       ▼                                                              │
│  get proxy.count ─► Proxy get handler                                │
│       │                                                              │
│       ▼                                                              │
│  track(target, 'GET', 'count')                                      │
│       │                                                              │
│       ▼                                                              │
│  targetMap.get(target).get('count').addSub(activeEffect)            │
│       │                                                              │
│       ▼                                                              │
│  建立依赖关联：activeEffect.deps.push(dep)                            │
└────────────────────────────────────────────────────────────────────┘

3. 数据变化触发更新
┌────────────────────────────────────────────────────────────────────┐
│  proxy.count = 2  ─►  Proxy set handler                             │
│       │                                                              │
│       ▼                                                              │
│  Reflect.set(target, 'count', 2)                                    │
│       │                                                              │
│       ▼                                                              │
│  trigger(target, 'SET', 'count', 2, 1)                              │
│       │                                                              │
│       ▼                                                              │
│  targetMap.get(target).get('count').notify()                        │
│       │                                                              │
│       ▼                                                              │
│  effect.update() ─► 重新执行 fn()                                    │
└────────────────────────────────────────────────────────────────────┘

4. computed 惰性求值
┌────────────────────────────────────────────────────────────────────┐
│  const comp = computed(() => state.count * 2)                       │
│       │                                                              │
│       ▼                                                              │
│  new ComputedRefImpl(getter, setter)                                 │
│       │                                                              │
│       ▼                                                              │
│  访问 comp.value                                                     │
│       │                                                              │
│       ├──► _dirty === true?  ─► 执行 effect.run()                   │
│       │                      收集依赖                                │
│       │                      _dirty = false                          │
│       │                      _value = 结果                           │
│       │                                                              │
│       └──► _dirty === false? ─► 直接返回 _value（缓存）              │
│                                                              │
│  依赖变化时                                                           │
│       │                                                              │
│       ▼                                                              │
│  scheduler() ─► _dirty = true                                       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 八、源码文件索引

| 文件 | 职责 | 关键导出 |
|-----|------|---------|
| `reactive.ts` | reactive/reactiveMap | `reactive()`, `readonly()`, `createReactiveObject()` |
| `ref.ts` | ref/computed 入口 | `ref()`, `computed()`, `RefImpl` |
| `baseHandlers.ts` | Proxy handlers | `mutableHandlers`, `readonlyHandlers`, `shallowReactiveHandlers` |
| `collectionHandlers.ts` | 集合类型 handlers | `collectionHandlers` |
| `dep.ts` | 依赖收集器 | `Dep`, `trackRefValue()`, `triggerRefValue()` |
| `effect.ts` | effect 核心 | `effect()`, `ReactiveEffect`, `track()`, `trigger()` |
| `computed.ts` | computed 实现 | `ComputedRefImpl`, `computed()` |
| `watch.ts` | watch 实现 | `watch()`, `watchEffect()` |

---

## 九、关键设计模式

### 9.1 订阅-发布模式

```typescript
// 响应式数据作为发布者
class Dep {
  subscribers = new Set()

  // 订阅
  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect)
    }
  }

  // 发布
  notify() {
    this.subscribers.forEach(effect => effect.run())
  }
}
```

### 9.2 代理模式

```typescript
// 代理对象拦截所有操作
const proxy = new Proxy(target, {
  get(target, key) {
    track(target, key)
    return Reflect.get(target, key)
  },
  set(target, key, value) {
    Reflect.set(target, key, value)
    trigger(target, key)
    return true
  }
})
```

### 9.3 惰性计算

```typescript
// computed 使用 _dirty 标志实现惰性求值
get value() {
  if (this._dirty) {
    this._value = this.effect.run()
    this._dirty = false
  }
  return this._value
}
```

---

## 十、面试要点

1. **Vue3 为何放弃 Object.defineProperty？**
   - Object.defineProperty 无法监听新增/删除属性
   - 无法监听数组下标变化（需要 hack）
   - Proxy 可以拦截所有操作，更全面

2. **WeakMap 的作用？**
   - 存储 target → proxy 映射
   - 当对象无其他引用时，可被垃圾回收

3. **为何需要 toRaw？**
   - 获取代理对象背后的原始对象
   - 用于比较或非响应式操作

4. **track/trigger 分离的好处？**
   - track 在 get 中调用，收集依赖
   - trigger 在 set 中调用，触发更新
   - 职责分离，逻辑清晰

5. **shallowReactive 与 reactive 的区别？**
   - shallow 只代理第一层
   - reactive 递归代理所有嵌套对象
