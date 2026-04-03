# Vue3 虚拟 DOM 与渲染器源码深度分析

## 一、虚拟 DOM 概述

虚拟 DOM（Virtual DOM）是 Vue3 渲染系统的核心概念，它是一个 JavaScript 对象树，用于描述真实 DOM 的结构。Vue3 的虚拟 DOM 系统经过全新设计，使用 Proxy 进行性能优化，支持静态提升和高级缓存策略。

### 1.1 源码目录结构

Vue3 渲染系统源码位于 `packages/runtime-core/src/` 目录下：

```
packages/runtime-core/src/
├── h.ts                    # h 函数（创建 VNode）
├── createVNode.ts          # createVNode、createBaseVNode
├── VNode.ts                # VNode 类定义
├── renderer.ts             # 渲染器核心（mount、patch、update）
├── components.ts           # 组件相关（setupRenderEffect）
├── renderWatch.ts          # 渲染 watcher
├── directives.ts           # 指令系统
├── helpers/
│   └── renderSlot.ts       # 插槽渲染
├── vnode.ts                # VNode 类型导出
└── components/
    ├── KeepAlive.ts        # KeepAlive 组件
    ├── Transition.ts       # 过渡组件
    └── BaseTransition.ts   # 基础过渡
```

---

## 二、VNode 结构与类型

### 2.1 VNode 类定义

```typescript
// packages/runtime-core/src/VNode.ts 第 30-100 行
export class VNode {
  // 节点类型：如 'div', 'span', Component
  type: VNodeTypes

  // 根元素 DOM
  el: HostNode | null = null

  // VNode 的 key，用于 diff 优化
  key: VNodeKey | null

  // 节点数据（属性、样式、事件等）
  data: VNodeData | null

  // 子节点
  children: VNodeNormalizedChildren

  // 补丁标志
  patchFlag: PatchFlags | DynamicFlags

  // 形状标志
  shapeFlag: ShapeFlags

  // 过渡信息
  transition: TransitionHooks | null

  // 组件实例（组件 VNode 特有）
  component: ComponentInternalInstance | null

  // 指令
  directives: VNodeDirective[] | null

  // 插槽
  slots: Slots | null

  // 懒创建（Suspense）
  suspense: SuspenseBoundary | null

  // DOM 节点命名空间
  ns: string | null

  // 挂载位置信息
  anchor: HostNode | null
  target: HostNode | null
  targetAnchor: HostNode | null

  // 静态标记
  static: boolean

  // 编译生成
  isRootInsert: boolean
  isRootMount: boolean
  isOnce: boolean
  isContextual: boolean

  // 作用域插槽
  scopeId: string | null
  ssContext: unknown

  // 渲染函数
  elBefore: HostNode | null
  anchor: HostNode | null

  constructor(
    type: VNodeTypes,
    props: VNodeData | null,
    children: VNodeNormalizedChildren,
    component: ComponentInternalInstance | null,
    dirs: VNodeDirective[] | null
  ) {
    this.type = type
    this.props = props
    this.children = children
    this.component = component
    this.key = props?.key || null
    this.shapeFlag = getShapeFlag(type)
    this.patchFlag = props?.patchFlag || 0
    this.directives = dirs
  }
}
```

### 2.2 ShapeFlags 形状标志

ShapeFlags 使用二进制位运算表示 VNode 的多种类型，可以组合：

```typescript
// packages/shared/src/shapeFlags.ts
export const enum ShapeFlags {
  // 元素类型
  ELEMENT = 1,                      // 0000000000000001 = 1
  FUNCTIONAL_COMPONENT = 1 << 1,    // 0000000000000010 = 2
  STATEFUL_COMPONENT = 1 << 2,      // 0000000000000100 = 4
  TEXT_CHILDREN = 1 << 3,           // 0000000000001000 = 8
  ARRAY_CHILDREN = 1 << 4,         // 0000000000010000 = 16
  SLOTS_CHILDREN = 1 << 5,         // 0000000000100000 = 32
  TELEPORT = 1 << 6,                // 0000000001000000 = 64
  SUSPENSE = 1 << 7,               // 0000000010000000 = 128
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 6
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,   // 0000000100000000 = 256
  COMPONENT_KEPT_ALIVE = 1 << 9,          // 0000001000000000 = 512
}
```

**使用示例：**

```typescript
// 判断 VNode 是否为组件
if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
  // 处理组件
}

// 判断 VNode 是否有数组子节点
if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  // 处理数组子节点
}
```

### 2.3 PatchFlags 补丁标志

PatchFlags 用于标记需要更新的具体内容，优化 diff 过程：

```typescript
// packages/shared/src/patchFlags.ts
export const enum PatchFlags {
  // 文本节点
  TEXT = 1,                        // 0000000000000001 = 1

  // 元素需要完整 diff
  FULL = 2,                        // 0000000000000010 = 2

  // 只有 class 需要更新
  CLASS = 4,                       // 0000000000000100 = 4

  // 只有 style 需要更新
  STYLE = 8,                       // 0000000000001000 = 8

  // 只有 props 需要更新
  PROPS = 16,                      // 0000000000010000 = 16

  // 需要完整 diff（包含 key）
  KEYED_FRAGMENT = 32,             // 0000000000100000 = 32

  // 无 key 的 fragment
  UNKEYED_FRAGMENT = 64,           // 0000000001000000 = 64

  // 需要绑定事件
  BINDING = 32,                     // 0000000000100000 = 32

  // 动态节点
  DYNAMIC = 128,                    // 0000000010000000 = 128

  // DEV 用
  HYDRATE_EVENTS = 256,

  // 稳定 fragment
  STABLE_FRAGMENT = 512,

  // 事件监听器
  EVENT_LISTENERS = 1024,

  // 整个 props 需要更新
  FULL_PROPS = 2048,

  // 只有 children 需要更新
  CHILDREN = 4096,

  // 递归 hydration
  RECONCIILIATION = 8192,
}
```

### 2.4 VNode 类型分类

```typescript
// packages/runtime-core/src/vnode.ts 第 10-30 行
export type VNodeTypes =
  | string                        // 'div', 'span', 'p' 等 HTML 标签
  | VNode                         // 注释节点
  | Component                     // 组件
  | typeof Text                   // 文本节点
  | typeof Comment                // 注释节点
  | typeof Fragment               // Fragment
  | typeof Portal                 // Teleport（已废弃）
  | typeof Suspense              // Suspense
  | typeof Static                 // 静态节点
```

---

## 三、createVNode 创建虚拟节点

### 3.1 createVNode 函数

```typescript
// packages/runtime-core/src/createVNode.ts 第 50-120 行
/**
 * 创建 VNode
 */
export function createVNode(
  type: VNodeTypes,
  props: VNodeData | null = null,
  children: VNodeNormalizedChildren = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false,
  needFullChildrenNormalization = false
): VNode {
  // 1. 规范化 class（支持字符串、对象、数组）
  if (props) {
    props = guardProps(props)
  }

  // 2. 根据 type 确定 shapeFlag
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isTeleport(type)
      ? ShapeFlags.TELEPORT
      : isSuspense(type)
        ? ShapeFlags.SUSPENSE
        : isComponent(type)
          ? ShapeFlags.COMPONENT
          : 0

  // 3. 创建 VNode
  const vnode = new VNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag
  )

  // 4. 设置子节点类型
  if (children !== null) {
    // 处理子节点
    normalizeChildren(vnode, children)
  }

  // 5. 返回 VNode
  return vnode
}
```

### 3.2 normalizeChildren 规范化子节点

```typescript
// packages/runtime-core/src/createVNode.ts 第 130-180 行
export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  if (children === null) {
    // 无子节点
  } else if (isArray(children)) {
    // 数组子节点
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (isObject(children)) {
    // 插槽
    if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      type = ShapeFlags.SLOTS_CHILDREN
    }
  } else {
    // 文本子节点
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children as VNodeNormalizedChildren
  vnode.shapeFlag |= type
}
```

### 3.3 h 函数（快捷创建）

```typescript
// packages/runtime-core/src/h.ts 第 30-100 行
/**
 * h 函数是 createVNode 的语法糖
 * h('div', { class: 'container' }, 'Hello')
 * h('div', { class: 'container' }, [h('span'), h('span')])
 */
export function h(
  type: VNodeTypes,
  propsOrChildren?: VNodeData | VNodeNormalizedChildren,
  children?: VNodeNormalizedChildren
): VNode {
  // 1. 处理参数
  const l = arguments.length

  if (l === 2) {
    // h(type, props)
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // props 是对象，children 是空
      return createVNode(type, propsOrChildren)
    } else {
      // props 被忽略，propsOrChildren 是 children
      return createVNode(type, null, propsOrChildren)
    }
  } else if (l === 3) {
    // h(type, props, children)
    return createVNode(type, propsOrChildren, children)
  } else if (l === 4) {
    // h(type, props, children, patchFlag)
    return createVNode(type, propsOrChildren, children)
  }
}
```

---

## 四、patch 过程详解

### 4.1 渲染器入口

```typescript
// packages/runtime-core/src/renderer.ts 第 100-200 行
/**
 * 渲染函数
 * @param vnode 虚拟节点
 * @param container 挂载容器
 */
const render = (vnode: VNode | null, container: RendererElement) => {
  // 如果没有 vnode，执行 unmount
  if (vnode === null) {
    if (container._vnode) {
      unmount(container._vnode, container, instance, true)
    }
  } else {
    // 执行 patch
    patch(
      container._vnode,  // 旧 VNode
      vnode,              // 新 VNode
      container           // 容器
    )
  }

  // 记录当前 vnode
  container._vnode = vnode
}
```

### 4.2 patch 核心函数

```typescript
// packages/runtime-core/src/renderer.ts 第 300-450 行
/**
 * patch 函数的完整实现
 */
const patch: PatchFn = (
  n1,                      // 旧 VNode
  n2,                      // 新 VNode
  container,               // 容器
  anchor = null,           // 锚点
  parentComponent = null, // 父组件
  parentSuspense = null,
  namespace = undefined,
  slotScopeIds = null,
  optimized = false
) => {
  // 1. 如果新旧 VNode 相同，直接返回
  if (n1 === n2) {
    return
  }

  // 2. 标记为激活状态
  const { type, shapeFlag } = n2

  // 3. 根据 type 调用不同处理函数
  switch (type) {
    // 文本节点
    case Text:
      processText(n1, n2, container, anchor)
      break

    // 注释节点
    case Comment:
      processCommentNode(n1, n2, container, anchor)
      break

    // 静态节点
    case Static:
      processStatic(n1, n2, container, anchor, namespace)
      break

    // Fragment（片段）
    case Fragment:
      processFragment(
        n1, n2, container, anchor, parentComponent,
        parentSuspense, namespace, slotScopeIds, optimized
      )
      break

    default:
      // 普通元素或组件
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理 HTML/SVG 元素
        processElement(
          n1, n2, container, anchor, parentComponent,
          parentSuspense, namespace, slotScopeIds, optimized
        )
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 处理组件
        processComponent(
          n1, n2, container, anchor, parentComponent,
          parentSuspense, namespace, slotScopeIds, optimized
        )
      } else if (shapeFlag & ShapeFlags.TELEPORT) {
        // 处理 Teleport
        ;(type as typeof Teleport).process(
          n1, n2, container, anchor, parentComponent,
          parentSuspense, namespace, slotScopeIds, optimized,
          internals
        )
      } else if (shapeFlag & ShapeFlags.SUSPENSE) {
        // 处理 Suspense
        ;(type as typeof Suspense).process(
          n1, n2, container, anchor, parentComponent,
          parentSuspense, namespace, slotScopeIds, optimized,
          internals
        )
      }
  }
}
```

### 4.3 patchVNode 更新节点

```typescript
// packages/runtime-core/src/renderer.ts 第 500-600 行
/**
 * 更新 VNode
 */
const patchVNode: PatchFn = (
  n1,
  n2,
  container,
  anchor,
  parentComponent,
  parentSuspense,
  namespace,
  slotScopeIds,
  optimized
) => {
  // 1. 获取新旧节点
  const { el, patchFlag, dynamicProps } = n2

  // 2. 复制 el 引用
  n2.el = n1.el

  // 3. 处理子节点
  const { children } = n2

  // 4. 根据 patchFlag 优化更新
  if (n2.patchFlag > 0) {
    // 有优化标记，使用优化更新
    if (n2.patchFlag & PatchFlags.CLASS) {
      // 只更新 class
      patchClass(n1, n2)
    } else if (n2.patchFlag & PatchFlags.STYLE) {
      // 只更新 style
      patchStyle(n1, n2)
    } else if (n2.patchFlag & PatchFlags.PROPS) {
      // 只更新 props
      patchProps(n1, n2, anchor, parentComponent, namespace)
    } else if (n2.patchFlag & PatchFlags.TEXT) {
      // 只更新文本
      if (n1.children !== n2.children) {
        updateTextContent(n2.children as string)
      }
    }
  } else {
    // 无优化标记，执行完整 diff
    if (children) {
      patchChildren(
        n1.children,
        n2.children,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      )
    }
  }

  // 5. 处理指令
  if (n2.dirs) {
    invokeDirective(n2.dirs, n2, 'update', n1)
  }
}
```

### 4.4 patchChildren 更新子节点

```typescript
// packages/runtime-core/src/renderer.ts 第 600-750 行
/**
 * 更新子节点数组
 * 使用双端 diff 算法
 */
const patchChildren: PatchChildrenFn = (
  c1,        // 旧子节点数组
  c2,        // 新子节点数组
  container,
  anchor,
  parentComponent,
  parentSuspense,
  namespace,
  slotScopeIds,
  optimized
) => {
  // 1. 获取旧子节点长度
  const oldLength = c1.length
  const newLength = c2.length

  // 2. 双端指针
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldLength - 1
  let newEndIdx = newLength - 1

  // 3. 双端 diff
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    const oldVNode = c1[oldStartIdx]
    const newVNode = c2[newStartIdx]

    // 头部相同，直接 patch
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode, container, anchor, parentComponent)
      oldStartIdx++
      newStartIdx++
    } else {
      // 头部不同，检查尾部
      const oldVNode2 = c1[oldEndIdx]
      const newVNode2 = c2[newEndIdx]

      if (isSameVNodeType(oldVNode2, newVNode2)) {
        // 尾部相同
        patch(oldVNode2, newVNode2, container, anchor, parentComponent)
        oldEndIdx--
        newEndIdx--
      } else {
        // 头部尾部都不同，查找 old 中是否有 new 的 key
        const keyInOld = findIdxInOld(newVNode, c1, oldStartIdx, oldEndIdx)

        if (keyInOld === -1) {
          // 新节点，在 old 中不存在，创建
          patch(null, newVNode, container, anchor, parentComponent)
          newStartIdx++
        } else {
          // 旧节点移动到新位置
          const oldVNodeToMove = c1[keyInOld]

          if (isSameVNodeType(oldVNodeToMove, newVNode)) {
            // 移动到当前位置
            move(oldVNodeToMove, container, anchor)
            // 清除旧位置
            ;(c1 as any)[keyInOld] = undefined
            // patch 更新
            patch(oldVNodeToMove, newVNode, container, anchor, parentComponent)
          } else {
            // key 相同但 type 不同，创建新节点
            patch(null, newVNode, container, anchor, parentComponent)
          }
          newStartIdx++
        }
      }
    }
  }

  // 4. 处理剩余节点
  // 新的比旧的长，需要挂载剩余的新节点
  if (oldEndIdx < oldStartIdx) {
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      patch(null, c2[i], container, anchor, parentComponent)
    }
  }
  // 旧的比新的长，需要卸载剩余的旧节点
  else if (newEndIdx < newStartIdx) {
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      unmount(c1[i], container, parentComponent, true)
    }
  }
}
```

### 4.5 updateChildren 双端 diff 算法图解

```
旧子节点：[A, B, C, D]
新子节点：[A, C, B, E]

第一轮：oldStart=[A,C,B,E], newStart=[A,C,B,E]
旧头 A = 新头 A → patch(A, A)，指针后移
旧头 C ≠ 新头 C → 检查尾部
旧尾 E ≠ 新尾 D → 查找 C 在旧中位置

第二轮：oldStart=[C,B,D], newStart=[C,B,E]
旧头 C = 新头 C → patch(C, C)，指针后移
旧头 B = 新头 B → patch(B, B)，指针后移
新尾 E 在旧中不存在 → 创建并挂载 E

结果：[A, C, B, E]
```

---

## 五、组件挂载流程

### 5.1 mountComponent 挂载组件

```typescript
// packages/runtime-core/src/components.ts 第 200-350 行
/**
 * 挂载组件
 */
const mountComponent: MountComponentFn = (
  initialVNode,
  container,
  anchor,
  parentComponent,
  parentSuspense,
  namespace,
  optimized
) => {
  // 1. 创建组件实例
  const instance: ComponentInternalInstance = createComponentInstance(initialVNode)

  // 2. 设置父组件引用
  instance.parent = parentComponent

  // 3. 设置命名空间
  instance.vnode.appContext = getAppContext()

  // 4. 创建组件 effect，用于追踪响应式数据
  setupRenderEffect(
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    namespace,
    optimized
  )
}
```

### 5.2 createComponentInstance 创建实例

```typescript
// packages/runtime-core/src/components.ts 第 100-180 行
/**
 * 创建组件实例
 */
export function createComponentInstance(vnode: VNode): ComponentInternalInstance {
  // 1. 创建实例对象
  const instance: ComponentInternalInstance = {
    // 唯一 ID
    uid: uid++,

    // VNode 引用
    vnode,

    // 父组件
    parent: null,

    // 根节点
    appContext: null,

    // 类型
    type: vnode.type as Component,

    // 状态
    proxy: null,
    withProxy: null,

    // 数据
    data: {},
    props: {},
    attrs: {},
    emit: null,

    // 插槽
    slots: {},
    inheritedAttrs: {},

    // 生命周期
    beforeMount: [],
    mounted: [],
    beforeUpdate: [],
    updated: [],
    beforeUnmount: [],
    unmounted: [],

    // Effect Scope
    scope: new EffectScope(),

    // 解析结果
    setupState: {},
    setupContext: null,

    // 渲染相关
    render: null,
    renderCache: [],

    // 副作用
    update: null,
    effects: null,

    // provide/inject
    provides: null,
  }

  return instance
}
```

### 5.3 setupRenderEffect 创建渲染 Effect

```typescript
// packages/runtime-core/src/components.ts 第 400-550 行
/**
 * 创建渲染 Effect
 * 这是组件响应式更新的核心
 */
const setupRenderEffect: SetupRenderEffectFn = (
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  namespace,
  optimized
) => {
  // 1. 创建响应式 effect
  instance.update = new ReactiveEffect(
    () => {
      // componentUpdateFn 是实际渲染函数
      componentUpdateFn()
    },
    () => {
      // scheduler：更新被调度执行
      queueJob(instance.update)
    }
  )

  // 2. 组件更新函数
  const componentUpdateFn = () => {
    // 获取组件状态
    const { proxy, render, type, data, props, children } = instance

    // 3. 检查是否首次挂载
    if (!instance.isMounted) {
      // === 首次挂载 ===

      // 调用 beforeMount 钩子
      invokeArrayFns(instance.beforeMount)

      // 执行渲染函数，获得 VNode
      const subTree = render!.call(
        proxy,
        proxy,
        instance.renderCache
      )

      // 递归 patch 子树
      patch(
        null,                // 旧 VNode
        subTree,             // 新 VNode
        container,           // 容器
        anchor,              // 锚点
        instance,            // 父组件
        parentSuspense,
        namespace,
        optimized
      )

      // 标记已挂载
      instance.isMounted = true

      // 调用 mounted 钩子
      invokeArrayFns(instance.mounted)

    } else {
      // === 更新 ===

      // 调用 beforeUpdate 钩子
      invokeArrayFns(instance.beforeUpdate)

      // 重新执行渲染函数
      const nextTree = render.call(proxy, proxy, instance.renderCache)

      // patch 新旧子树
      patch(
        instance.subTree,    // 旧 VNode
        nextTree,            // 新 VNode
        container,
        anchor,
        instance,
        parentSuspense,
        namespace,
        optimized
      )

      // 更新子树引用
      instance.subTree = nextTree

      // 调用 updated 钩子
      invokeArrayFns(instance.updated)
    }
  }
}
```

### 5.4 updateComponent 更新组件

```typescript
// packages/runtime-core/src/components.ts 第 600-700 行
/**
 * 更新组件
 */
const updateComponent = (
  n1: VNode,
  n2: VNode,
  optimized: boolean
) => {
  // 1. 获取组件实例
  const instance = n2.component = n1.component

  // 2. 检查 props 是否变化
  if (shouldUpdateComponent(n1, n2, optimized)) {
    // 3. 获取新的 props
    const newProps = n2.props

    // 4. 更新 props
    updateProps(instance, newProps)

    // 5. 更新插槽
    updateSlots(instance, n2.children)
  }

  // 6. 标记需要重新渲染
  instance.update()
}
```

---

## 六、指令与插槽处理

### 6.1 指令系统

```typescript
// packages/runtime-core/src/directives.ts
export interface Directive {
  // 绑定时调用
  bind?: (
    el: HostNode,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVNode: VNode | null
  ) => void

  // 插入 DOM 时调用
  inserted?: (
    el: HostNode,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVNode: VNode | null
  ) => void

  // 更新时调用
  update?: (
    el: HostNode,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVNode: VNode | null
  ) => void

  // 解绑时调用
  unmounted?: (
    el: HostNode,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVNode: VNode | null
  ) => void
}

// 合并 vnode 中的指令
export function mergeDirectiveBinding(dir: DirectiveBinding): DirectiveBinding {
  return {
    ...dir,
    modifiers: { ...dir.modifiers }
  }
}
```

### 6.2 v-if、v-for、v-show 处理

```typescript
// packages/runtime-core/src/vnode.ts 第 200-300 行
/**
 * 处理 v-if
 * 实际上是条件渲染
 */
export function processIf(
  vnode: VNode,
  container: RendererElement,
  anchor: RendererNode,
  parentComponent: ComponentInternalInstance
) {
  // 1. 获取 v-if 的值
  const condition = vnode.props?.['v-if']

  // 2. 根据条件决定渲染哪个分支
  if (condition) {
    // 条件为 true，渲染当前节点
    mountChildren(vnode, container, anchor, parentComponent)
  } else {
    // 条件为 false，渲染 v-else 分支
    const elseBlock = vnode.children?.find(
      child => (child as VNode).type === Comment
    )
    if (elseBlock) {
      mountChildren(elseBlock, container, anchor, parentComponent)
    }
  }
}

/**
 * 处理 v-for
 * 实际上是循环渲染
 */
export function processFor(
  vnode: VNode,
  container: RendererElement,
  anchor: RendererNode,
  parentComponent: ComponentInternalInstance
) {
  // 1. 获取 v-for 的值
  const forParseResult = parseFor(vnode.props?.['v-for'])

  if (!forParseResult) {
    return
  }

  // 2. 获取要循环的数据
  const { source, value, key, index } = forParseResult
  const sourceData = resolveData(source)

  // 3. 为每个数据项创建 VNode
  const children = sourceData.map((item, i) => {
    // 替换 v-for 指令为普通属性
    const transformed = createVNode(
      vnode.type,
      {
        ...vnode.props,
        key: key ? item[key] : i,
      },
      vnode.children
    )

    // 处理循环变量
    return transformed
  })

  // 4. 挂载子节点
  for (const child of children) {
    mountChildren(child, container, anchor, parentComponent)
  }
}

/**
 * 处理 v-show
 * 实际上是切换元素的显示/隐藏
 */
export function processShow(
  vnode: VNode,
  container: RendererElement,
  show: boolean
) {
  if (show) {
    // 显示元素
    container.style.display = ''
  } else {
    // 隐藏元素
    container.style.display = 'none'
  }
}
```

### 6.3 插槽处理

```typescript
// packages/runtime-core/src/helpers/renderSlot.ts 第 30-100 行
/**
 * 渲染插槽
 */
export function renderSlot(
  slots: Slots,
  name: string,
  props: Record<string, unknown>,
  fallback?: () => VNode[]
): VNode | VNode[] {
  // 1. 获取对应名称的插槽
  const slot = slots[name]

  // 2. 如果插槽存在，执行并返回结果
  if (slot) {
    const normalized = normalizeSlot(slot, props)
    const result = normalized()

    // 3. 如果是组件渲染，返回虚拟节点数组
    if (isArray(result)) {
      return result
    }

    // 4. 否则创建 Fragment
    return createVNode(
      Fragment,
      null,
      result
    )
  }

  // 5. 如果不存在，使用 fallback
  return fallback ? fallback() : createVNode(Comment, null, [])
}

/**
 * 规范化插槽
 */
function normalizeSlot(
  slot: Slot | ((props: Record<string, unknown>) => VNode[]),
  props: Record<string, unknown>
): () => VNode[] {
  return isFunction(slot)
    ? () => slot(props)
    : slot
}
```

### 6.4 插槽更新机制

```typescript
// packages/runtime-core/src/components.ts 第 300-400 行
/**
 * 更新插槽
 */
function updateSlots(
  instance: ComponentInternalInstance,
  children: VNodeNormalizedChildren
) {
  const { slots } = instance

  // 1. 规范化子节点
  normalizeChildren(children, slots)

  // 2. 检查是否有变化的插槽
  for (const key in slots) {
    if (!isReservedPrefix(key)) {
      const slot = slots[key]

      // 3. 触发组件更新
      if (slot._c) {
        slot._c()
      }
    }
  }
}
```

---

## 七、渲染器优化策略

### 7.1 静态提升

编译时将静态内容提取到渲染函数外部，避免重复创建：

```typescript
// 优化前
function render() {
  return h('div', [
    h('span', '静态文本'),      // 每次渲染都创建
    h('span', dynamicValue)     // 动态文本
  ])
}

// 优化后
const staticNode = h('span', '静态文本')  // 提升到渲染函数外

function render() {
  return h('div', [
    staticNode,                   // 复用静态节点
    h('span', dynamicValue)
  ])
}
```

### 7.2 PatchFlag 优化

```typescript
// 优化前：class 变化时需要完整 diff
h('div', { class: 'container' })

// 优化后：标记只关心 class 变化
h('div', { class: 'container', patchFlag: PatchFlags.CLASS })
```

### 7.3 缓存 Event Handlers

```typescript
// 优化前
h('button', { onClick: () => handleClick(id) })

// 优化后：缓存处理函数
const cachedHandler = createCachedHandler(handleClick)
h('button', { onClick: cachedHandler })
```

---

## 八、完整渲染流程图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Vue3 渲染完整流程                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ 1. 模板编译阶段                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  template ──► AST ──► transform ──► codegen ──► render function         │
│                                                                          │
│  render 函数返回 VNode：                                                  │
│  function render() {                                                    │
│    return h('div', { class: 'app' }, [                                   │
│      h('h1', {}, 'Hello'),                                               │
│      h('p', {}, this.message)  // 响应式数据                               │
│    ])                                                                   │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. 渲染器入口                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  const vnode = createVNode(type, props, children)                        │
│       │                                                                 │
│       ▼                                                                 │
│  render(vnode, container)                                               │
│       │                                                                 │
│       ▼                                                                 │
│  patch(null, vnode, container)  // 首次挂载                             │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. Patch 过程                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  patch(n1, n2, container)                                               │
│       │                                                                 │
│       ├──► type === Text ─► processText()                               │
│       │                                                                 │
│       ├──► type === Comment ─► processCommentNode()                     │
│       │                                                                 │
│       ├──► type === Fragment ─► processFragment()                      │
│       │                                                                 │
│       ├──► shapeFlag & ELEMENT ─► processElement()                      │
│       │                                            │                     │
│       │                                            ▼                     │
│       │                                   ┌─────────────────────┐        │
│       │                                   │  patchVNode()       │        │
│       │                                   │  - patchChildren()  │        │
│       │                                   │  - patchProps()     │        │
│       │                                   └─────────────────────┘        │
│       │                                                                 │
│       └──► shapeFlag & COMPONENT ─► processComponent()                 │
│                                              │                           │
│                                              ▼                           │
│                                     ┌─────────────────────┐              │
│                                     │  mountComponent()   │              │
│                                     │  - createInstance() │              │
│                                     │  - setupRenderEffect()              │
│                                     │    └── new ReactiveEffect()         │
│                                     └─────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. 组件挂载                                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  mountComponent()                                                       │
│       │                                                                 │
│       ▼                                                                 │
│  createComponentInstance(vnode)                                         │
│       │                                                                 │
│       ▼                                                                 │
│  setupRenderEffect(instance)                                            │
│       │                                                                 │
│       ├──► 创建 ReactiveEffect                                           │
│       │                                                                 │
│       ├──► 执行 instance.render() 获取 subTree                          │
│       │                                                                 │
│       ├──► patch(null, subTree, container)                               │
│       │                                                                 │
│       └──► 递归渲染子节点                                                │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. 更新流程（响应式数据变化）                                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  state.message = 'new value'  // 触发 Proxy set                          │
│       │                                                                 │
│       ▼                                                                 │
│  trigger(target, 'SET', 'message')                                      │
│       │                                                                 │
│       ▼                                                                 │
│  targetMap.get(target).get('message').notify()                          │
│       │                                                                 │
│       ▼                                                                 │
│  effect.scheduler() 或 effect.update()                                   │
│       │                                                                 │
│       ▼                                                                 │
│  queueJob(instance.update)  // 批量更新                                  │
│       │                                                                 │
│       ▼                                                                 │
│  instance.update() 执行                                                   │
│       │                                                                 │
│       ▼                                                                 │
│  componentUpdateFn()                                                     │
│       │                                                                 │
│       ├──► render() 重新执行获取新 VNode                                  │
│       │                                                                 │
│       ├──► patch(oldSubTree, newSubTree, container)                     │
│       │                                                                 │
│       └──► 按需更新 DOM                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 九、源码文件索引

| 文件 | 职责 | 关键导出 |
|-----|------|---------|
| `VNode.ts` | VNode 类定义 | `VNode` |
| `createVNode.ts` | 创建 VNode | `createVNode`, `createBaseVNode`, `normalizeChildren` |
| `h.ts` | h 函数 | `h` |
| `vnode.ts` | VNode 类型 | `VNodeTypes`, `VNodeData` |
| `renderer.ts` | 渲染器核心 | `render`, `patch`, `patchVNode`, `patchChildren` |
| `components.ts` | 组件渲染 | `mountComponent`, `updateComponent`, `setupRenderEffect` |
| `directives.ts` | 指令系统 | `Directive`, `mergeDirectiveBinding` |
| `helpers/renderSlot.ts` | 插槽渲染 | `renderSlot` |
| `shared/shapeFlags.ts` | 形状标志 | `ShapeFlags` |
| `shared/patchFlags.ts` | 补丁标志 | `PatchFlags` |

---

## 十、面试要点

1. **Vue3 为何比 Vue2 快？**
   - Proxy 替代 Object.defineProperty，无 hack
   - PatchFlag 标记只更新变化的属性
   - 静态提升减少 VNode 创建
   - 事件处理函数缓存

2. **VNode 的作用？**
   - 抽象 DOM 描述
   - 跨平台能力
   - diff 算法基础

3. **双端 diff 算法的优势？**
   - 减少移动次数
   - 头部尾部对比快速处理常见场景
   - key 的作用：精确匹配节点

4. **ShapeFlags 的设计目的？**
   - 位运算高效判断类型
   - 组合判断（组件 = 有状态 | 函数式）
   - 减少 if-else

5. **组件更新为何高效？**
   - 响应式依赖追踪
   - 批量更新（queueJob）
   - subTree diff 局部更新
