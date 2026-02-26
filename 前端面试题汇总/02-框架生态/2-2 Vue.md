# Vue 3 核心原理与实战面试题库

---

## 一、响应式原理

### 1.1 Vue 3 响应式系统深度拆解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vue 3 响应式原理                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 初始化 (Proxy)                                              │
│     ┌───────────────────────────────────────────────────────┐   │
│  │  reactive(obj) ──▶ new Proxy(obj, handlers)           │   │
│  └───────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│  2. 依赖收集 (Track)                                           │
│     ┌───────────────────────────────────────────────────────┐   │
│  │  get: activeEffect 存入 targetMap                       │   │
│  │  targetMap (WeakMap)                                    │   │
│  │    └─ depsMap (Map)                                    │   │
│  │         └─ dep (Set)                                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                              │                                 │
│                              ▼                                 │
│  3. 触发更新 (Trigger)                                         │
│     ┌───────────────────────────────────────────────────────┐   │
│  │  set: 找到对应的 dep，执行所有 effect                   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Vue 2 vs Vue 3 响应式对比**：

| 特性 | Vue 2 (Object.defineProperty) | Vue 3 (Proxy) |
| :--- | :--- | :--- |
| **原理** | 拦截对象属性的 getter/setter | 代理整个对象 |
| **对象新增** | 需使用 Vue.set | 自动监听 |
| **数组操作** | 需重写数组方法 | 可直接监听 |
| **性能** | 递归，消耗大 | 代理，性能更好 |
| **支持** | IE11+ | 现代浏览器 |

### 1.1.1 响应式系统核心概念详解

**响应式系统的三要素**：

1. **响应式对象（Reactive Object）**：使用 Proxy 包装后的对象，当属性被访问或修改时能够自动触发相应操作。

2. **依赖收集（Dependency Tracking）**：在组件渲染过程中，追踪哪些响应式数据被使用，建立数据与组件之间的关联关系。

3. **触发更新（Trigger）**：当响应式数据发生变化时，能够准确找到依赖该数据的组件并触发重新渲染。

**Vue 3 响应式系统的架构图**：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Vue 3 响应式系统架构                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐             │
│  │   组件渲染   │ ──▶  │   依赖收集   │ ──▶  │   触发更新   │             │
│  └─────────────┘      └─────────────┘      └─────────────┘             │
│        │                    │                    │                     │
│        ▼                    ▼                    ▼                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐             │
│  │   Proxy     │      │   targetMap │      │   effects   │             │
│  │  拦截读写    │      │   依赖存储   │      │   副作用队列 │             │
│  └─────────────┘      └─────────────┘      └─────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.1.2 完整响应式实现代码

**自定义简易版响应式系统**：

```javascript
// 完整响应式系统实现

// 全局变量存储当前活跃的 effect
let activeEffect = null;

// 存储所有响应式对象的依赖关系
// targetMap 结构: WeakMap<Object, Map<string, Set<Function>>>
const targetMap = new WeakMap();

/**
 * 收集依赖
 * @param {Object} target 目标对象
 * @param {string} key 属性名
 */
function track(target, key) {
  if (!activeEffect) return;

  // 获取目标对象的 depsMap
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 获取属性名的 dep
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // 将 activeEffect 存入 dep
  dep.add(activeEffect);
}

/**
 * 触发更新
 * @param {Object} target 目标对象
 * @param {string} key 属性名
 * @param {*} newValue 新值
 */
function trigger(target, key, newValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    // 执行所有依赖的 effect
    dep.forEach(effect => {
      effect();
    });
  }
}

/**
 * 创建响应式对象
 * @param {Object} target 目标对象
 * @returns {Proxy}
 */
function reactive(target) {
  const handlers = {
    // 拦截读取操作
    get(target, key, receiver) {
      // 进行依赖收集
      track(target, key);
      // 返回属性值
      const result = Reflect.get(target, key, receiver);
      // 如果是对象，递归创建响应式
      if (result && typeof result === 'object') {
        return reactive(result);
      }
      return result;
    },

    // 拦截写入操作
    set(target, key, value, receiver) {
      const oldValue = target[key];
      // 设置属性值
      const result = Reflect.set(target, key, value, receiver);

      // 只有当值发生变化时才触发更新
      if (oldValue !== value) {
        // 触发更新
        trigger(target, key, value);
      }

      return result;
    },

    // 拦截删除操作
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      if (result) {
        trigger(target, key);
      }
      return result;
    }
  };

  return new Proxy(target, handlers);
}

/**
 * 创建副作用函数
 * @param {Function} fn 副作用函数
 * @returns {Function}
 */
function effect(fn) {
  activeEffect = fn;
  // 立即执行一次，进行依赖收集
  fn();
  activeEffect = null;
}

// 使用示例
const state = reactive({
  count: 0,
  user: {
    name: 'Tom',
    age: 18
  }
});

effect(() => {
  console.log('count changed:', state.count);
});

effect(() => {
  console.log('user name:', state.user.name);
});

// 触发更新
state.count = 1; // 输出: count changed: 1
state.user.name = 'Jerry'; // 输出: user name: Jerry
```

### 1.1.3 响应式原理面试追问

**面试官可能追问的问题**：

**Q1: 为什么 Vue 3 选择使用 Proxy 而不是 Object.defineProperty？**

参考答案：

1. **Object.defineProperty 的局限性**：
   - 只能监听单个属性，无法监听整个对象
   - 需要遍历对象的每个属性进行监听
   - 无法监听数组的变化（需要重写数组方法）
   - 删除或新增属性无法监听（需要使用 Vue.set/delete）
   - 对属性的添加/删除操作无法监听

2. **Proxy 的优势**：
   - 可以监听整个对象，包括属性的添加和删除
   - 不需要遍历对象属性，性能更好
   - 支持数组的拦截
   - 有 13 种拦截方法，更全面
   - 返回的是一个新对象，可以保持对原对象的引用

3. **Proxy 的缺点**：
   - 不支持 IE 浏览器
   - 需要创建代理对象，有一定的内存开销

**Q2: Vue 3 的响应式系统是如何处理嵌套对象的？**

参考答案：

Vue 3 使用了懒加载的响应式转换。当访问一个嵌套对象时，只有在访问时才会将其转换为响应式对象。这通过在 get 捕获器中递归调用 reactive() 实现：

```javascript
get(target, key, receiver) {
  track(target, key);
  const result = Reflect.get(target, key, receiver);
  // 懒加载：只有访问对象时才递归转换
  if (result && typeof result === 'object') {
    return reactive(result);
  }
  return result;
}
```

这种方式的优势：
- 避免不必要的性能开销
- 只有实际使用的对象才会被转换为响应式
- 减少了内存占用

**Q3: Vue 3 的响应式系统如何处理循环引用？**

参考答案：

Vue 3 使用了 WeakMap 来存储响应式对象的映射关系。WeakMap 的特点是：
- 键必须是对象
- 键是弱引用的，可以被垃圾回收
- 不支持遍历

这意味着如果一个响应式对象不再被其他地方引用，它可以被垃圾回收，响应式系统不会阻止这种回收。

---

### 1.2 ref 与 reactive

**参考答案：**

```javascript
// ref - 基础类型响应式
import { ref, isRef } from 'vue';

const count = ref(0);
console.log(count.value);  // 0
count.value++;             // 修改值

// ref 原理
// ref(value) -> { value: value }
// 访问/修改通过 .value

// reactive - 对象响应式
import { reactive, isReactive } from 'vue';

const state = reactive({
  name: 'Tom',
  age: 18
});
console.log(state.name);  // Tom
state.age = 20;           // 修改值

// reactive 限制
// 1. 只对对象类型有效
// 2. 替换整个对象会丢失响应性
const state = reactive({});
state = reactive({ name: 'Tom' });  // 失去响应式

// toRefs - 保持响应式
import { reactive, toRefs } from 'vue';

const state = reactive({
  name: 'Tom',
  age: 18
});
const { name, age } = toRefs(state);
// name 仍然是响应式的

// toRaw - 转为原始对象
import { reactive, toRaw } from 'vue';

const state = reactive({ name: 'Tom' });
const raw = toRaw(state);  // 原始对象
```

### 1.2.1 ref 深入理解

**ref 的实现原理**：

```javascript
// ref 简易实现
class RefImpl {
  constructor(value) {
    // 如果是对象，使用 reactive 包装
    this._value = isObject(value) ? reactive(value) : value;
  }

  get value() {
    // 依赖收集
    track(this, 'value');
    return this._value;
  }

  set value(newValue) {
    // 只有值发生变化时才更新
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      // 触发更新
      trigger(this, 'value');
    }
  }
}

function ref(value) {
  return new RefImpl(value);
}

// 辅助函数
function isObject(val) {
  return val !== null && typeof val === 'object';
}

function hasChanged(newValue, oldValue) {
  return newValue !== oldValue;
}
```

**ref 与 reactive 的选择**：

| 场景 | 推荐 | 原因 |
| :--- | :--- | :--- |
| 基础类型 (string, number, boolean) | ref | reactive 不支持基础类型 |
| 对象类型 | reactive | 更直观，访问无需 .value |
| 数组 | reactive | 更简洁 |
| 函数 | ref | 需要保持响应性 |
| 模板中使用的响应式数据 | 两者皆可 | ref 在模板中会自动解包 |

**ref 的自动解包**：

```javascript
// 模板中的自动解包
const count = ref(0);
const state = reactive({ count });

// 模板中可以直接使用 {{ count }} 而非 {{ count.value }}
// 但在 script 中需要使用 count.value

// 数组中的自动解包
const arr = ref([1, 2, 3]);
// arr.value.push(4) // 正确

// 嵌套在 reactive 中自动解包
const state = reactive({
  count: ref(0) // 自动解包
});
console.log(state.count); // 0，无需 .value
```

### 1.2.2 reactive 深入理解

**reactive 的限制和注意事项**：

```javascript
// 1. 不能替换整个对象
const state = reactive({ name: 'Tom' });
// 错误做法 - 失去响应性
state = reactive({ name: 'Jerry' });
// 正确做法 - 修改属性
Object.assign(state, { name: 'Jerry' });

// 2. 对 reactive 的解构会失去响应性
const state = reactive({ name: 'Tom', age: 18 });
// 解构后失去响应性
const { name, age } = state;
// 正确做法 - 使用 toRefs
const { name, age } = toRefs(state);
// 或者
const name = toRef(state, 'name');

// 3. reactive 数组问题
const list = reactive([]);
// 可以通过索引修改
list[0] = 1; // 响应式
// 可以使用数组方法
list.push(1); // 响应式

// 4. 响应式判断
import { reactive, isReactive, isProxy, isRef } from 'vue';

const state = reactive({ name: 'Tom' });
const count = ref(0);

console.log(isReactive(state)); // true
console.log(isReactive(count)); // false
console.log(isProxy(state));    // true
console.log(isRef(count));     // true
```

### 1.2.3 toRefs 与 toRef

**实现原理和使用场景**：

```javascript
// toRef - 为响应式对象的某个属性创建 ref
import { reactive, toRef } from 'vue';

const state = reactive({
  name: 'Tom',
  age: 18
});

// 为 name 属性创建 ref
const nameRef = toRef(state, 'name');
// 修改 ref 会影响原始对象
nameRef.value = 'Jerry';
console.log(state.name); // Jerry

// 修改原始对象也会影响 ref
state.name = 'Tom';
console.log(nameRef.value); // Tom

// toRefs - 为响应式对象的所有属性创建 ref
import { reactive, toRefs } from 'vue';

const state = reactive({
  name: 'Tom',
  age: 18
});

// 转换为多个 ref
const { name, age } = toRefs(state);

// 使用场景：解构返回响应式数据
function useUser() {
  const state = reactive({
    name: 'Tom',
    age: 18,
    gender: 'male'
  });

  // 返回解构后的响应式数据
  return toRefs(state);
}

const { name, age, gender } = useUser();
// name, age, gender 都是响应式的 ref
```

---

### 1.3 computed 与 watch

**参考答案：**

```javascript
// computed - 计算属性
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// 只读计算属性
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// 可写计算属性
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split(' ');
  }
});

// watch - 监听
import { ref, watch } from 'vue';

const count = ref(0);

// 监听单个 ref
watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`);
});

// 监听多个 ref
watch([count, firstName], ([newCount, newName], [oldCount, oldName]) => {
  console.log('changed');
});

// 监听 reactive
const state = reactive({ count: 0, name: 'Tom' });
watch(state, (newVal, oldVal) => {
  console.log('state changed');
}, { deep: true });

// watchEffect - 立即执行
import { watchEffect } from 'vue';

watchEffect(() => {
  console.log(`count is: ${count.value}`);
  // 立即执行，依赖变化时再次执行
});
```

### 1.3.1 computed 深入理解

**computed 的实现原理**：

```javascript
// computed 简易实现
class ComputedImpl {
  constructor(getter, setter) {
    this._getter = getter;
    this._setter = setter;
    this._value = undefined;
    this._dirty = true; // 标记是否需要重新计算
    this._effect = null;
  }

  get value() {
    // 依赖收集
    if (activeEffect) {
      this._effect = activeEffect;
    }

    // 如果是响应式数据的依赖，执行依赖收集
    if (activeEffect) {
      track(this, 'value');
    }

    // 如果是脏的，重新计算
    if (this._dirty) {
      this._value = this._getter();
      this._dirty = false;
    }

    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}

function computed(getter, setter) {
  return new ComputedImpl(getter, setter);
}
```

**computed 的特性**：

```javascript
import { ref, computed } from 'vue';

// 1. 计算属性会缓存结果
const count = ref(0);
const double = computed(() => {
  console.log('computing...');
  return count.value * 2;
});

console.log(double.value); // computing... 2
console.log(double.value); // 不再计算，直接返回缓存

// 2. 依赖变化时才重新计算
count.value = 1;
console.log(double.value); // computing... 2

// 3. 只读 vs 可写
// 只读
const readOnly = computed(() => count.value * 2);

// 可写
const writable = computed({
  get: () => count.value * 2,
  set: (val) => {
    count.value = val / 2;
  }
});

writable.value = 20; // count 变为 10

// 4. 计算属性可以引用其他计算属性
const count = ref(0);
const double = computed(() => count.value * 2);
const quadruple = computed(() => double.value * 2);
```

### 1.3.2 watch 深入理解

**watch 的配置选项**：

```javascript
import { ref, reactive, watch } from 'vue';

// 1. immediate - 立即执行
const count = ref(0);
watch(count, (newVal, oldVal) => {
  console.log('count changed');
}, { immediate: true }); // 立即执行，oldVal 为 undefined

// 2. deep - 深度监听
const state = reactive({
  user: {
    name: 'Tom',
    address: {
      city: 'Beijing'
    }
  }
});

// 深度监听
watch(state, (newVal, oldVal) => {
  console.log('state changed');
}, { deep: true });

// 监听单个属性
watch(() => state.user.name, (newVal, oldVal) => {
  console.log('name changed');
});

// 3. flush - 回调时机
// 'pre' - 组件更新前（默认）
// 'post' - 组件更新后
// 'sync' - 同步执行

watch(count, () => {
  console.log('count changed');
}, { flush: 'post' }); // 在 DOM 更新后执行

// 4. once - 只执行一次
watch(count, () => {
  console.log('count changed');
}, { once: true });
```

**watchEffect vs watch**：

```javascript
import { ref, watch, watchEffect } from 'vue';

const count = ref(0);
const name = ref('Tom');

// watch - 懒执行
// 1. 第一次不执行
// 2. 显式指定依赖
watch(count, () => {
  console.log('count changed');
});

// watchEffect - 立即执行
// 1. 立即执行一次
// 2. 自动收集依赖
watchEffect(() => {
  console.log('count is:', count.value);
});

// 对比
watchEffect(() => {
  // 自动收集所有响应式依赖
  console.log(name.value, count.value);
});

watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  // 需要显式指定监听哪些数据
  console.log('changed');
});
```

**watch 清理副作用**：

```javascript
import { ref, watch } from 'vue';

const count = ref(0);

// 清理副作用
watch(count, (newVal, oldVal, onCleanup) => {
  // 创建取消令牌
  let cancelled = false;

  // 异步操作
  fetch(`/api/count/${newVal}`)
    .then(response => response.json())
    .then(data => {
      if (!cancelled) {
        console.log('data:', data);
      }
    });

  // 清理函数
  onCleanup(() => {
    cancelled = true;
  });
});
```

---

## 二、Composition API

### 2.1 setup 函数

**参考答案：**

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  setup(props, context) {
    // props: 组件接收的 props（响应式）
    console.log(props.name);

    // context: 非响应式的上下文对象
    // {
    //   attrs: 组件属性
    //   slots: 插槽
    //   emit: 触发事件
    //   expose: 暴露组件实例
    // }

    const count = ref(0);

    // 生命周期钩子
    onMounted(() => {
      console.log('mounted');
    });

    onUnmounted(() => {
      console.log('unmounted');
    });

    // 返回值会暴露给模板
    return {
      count
    };
  }
};
```

### 2.1.1 setup 函数详解

**setup 函数的执行时机**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    setup 执行时机                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  new Vue()                                                       │
│       │                                                          │
│       ▼                                                          │
│  beforeCreate ──▶ setup() ◀── 在这里执行                        │
│       │                                                          │
│       ▼                                                          │
│  created                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**setup 函数的参数**：

```javascript
export default {
  props: {
    name: String,
    age: {
      type: Number,
      default: 18
    }
  },

  // setup 接收两个参数
  setup(props, context) {
    // 1. props - 响应式的 props 对象
    //    - 包含父组件传入的所有 props
    //    - 是响应式的，会随父组件变化而变化
    console.log(props.name);
    console.log(props.age);

    // 2. context - 非响应式的上下文对象
    //    - attrs: 组件属性（包含非 prop 的属性）
    //    - slots: 插槽对象
    //    - emit: 触发事件的函数
    //    - expose: 暴露给父组件的属性

    // attrs - 包含非 prop 的属性
    console.log(context.attrs);
    // 等价于 Vue 2 的 this.$attrs

    // slots - 插槽
    console.log(context.slots.default);
    // 等价于 Vue 2 的 this.$slots

    // emit - 触发事件
    context.emit('update', { name: 'Tom' });
    // 等价于 Vue 2 的 this.$emit('update', ...)

    // expose - 暴露属性给父组件
    context.expose({
      someMethod() {
        console.log('method');
      }
    });

    return {
      // 返回的属性和方法可以在模板中使用
    };
  }
};
```

**setup 中使用 this**：

```javascript
export default {
  setup(props, context) {
    // setup 中没有 this
    // 如果需要访问组件实例，使用 getCurrentInstance

    import { getCurrentInstance } from 'vue';

    const { proxy } = getCurrentInstance();

    // proxy 等价于 Vue 2 中的 this
    // proxy.$emit()
    // proxy.$refs

    return {};
  }
};
```

### 2.1.2 setup 中返回数据的方式

```javascript
import { ref, reactive, computed } from 'vue';

export default {
  setup() {
    // 1. 返回普通对象 - 可以在模板中使用
    const count = ref(0);
    const increment = () => count.value++;

    return {
      count,
      increment
    };

    // 2. 返回函数
    return () => {
      // 返回渲染函数
      return h('div', count.value);
    };

    // 3. 不返回任何东西 - 用于 setup 只执行逻辑
    // 如注册全局事件、初始化第三方库等
    import { onMounted } from 'vue';

    onMounted(() => {
      console.log('mounted');
    });

    // 不需要 return
  }
};
```

---

### 2.2 生命周期钩子

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vue 3 生命周期                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  创建阶段                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  setup()                                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  挂载阶段                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  onBeforeMount ──▶ onMounted                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  更新阶段                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  onBeforeUpdate ──▶ onUpdated                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  卸载阶段                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  onBeforeUnmount ──▶ onUnmounted                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Vue 2 vs Vue 3                                                │
│  beforeCreate  ──▶ setup()                                      │
│  created       ──▶ setup()                                      │
│  beforeMount   ──▶ onBeforeMount                                │
│  mounted       ──▶ onMounted                                    │
│  beforeUpdate  ──▶ onBeforeUpdate                               │
│  updated       ──▶ onUpdated                                     │
│  beforeDestroy ──▶ onBeforeUnmount                              │
│  destroyed    ──▶ onUnmounted                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2.1 生命周期钩子详解

**所有生命周期钩子**：

```javascript
import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated
} from 'vue';

export default {
  // 1. 组件挂载之前
  onBeforeMount(() => {
    console.log('beforeMount');
    // 此时 DOM 还未创建
    // 可以访问 props、data，但无法访问 DOM
  }),

  // 2. 组件挂载完成
  onMounted(() => {
    console.log('mounted');
    // DOM 已创建
    // 可以访问 this.$el、this.$refs
    // 适合：初始化第三方库、添加事件监听、发送请求
  }),

  // 3. 组件更新之前
  onBeforeUpdate(() => {
    console.log('beforeUpdate');
    // 数据已更新，但 DOM 还未更新
    // 适合：在 DOM 更新前保存状态
  }),

  // 4. 组件更新完成
  onUpdated(() => {
    console.log('updated');
    // DOM 已更新
    // 适合：操作更新后的 DOM
  }),

  // 5. 组件卸载之前
  onBeforeUnmount(() => {
    console.log('beforeUnmount');
    // 组件仍然可用
    // 适合：清理定时器、移除事件监听
  }),

  // 6. 组件卸载完成
  onUnmounted(() => {
    console.log('unmounted');
    // 组件已被销毁
    // 适合：清理所有副作用
  }),

  // 7. 错误捕获
  onErrorCaptured((err, instance, info) => {
    console.error('errorCaptured:', err);
    // 返回 false 可以阻止错误传播
    return false;
  }),

  // 8. 渲染跟踪（调试用）
  onRenderTracked(({ key, target, type, effect }) => {
    console.log('render tracked:', key);
  }),

  // 9. 渲染触发（调试用）
  onRenderTriggered(({ key, target, type, effect }) => {
    console.log('render triggered:', key);
  })
};
```

**keep-alive 相关的生命周期**：

```javascript
import { onActivated, onDeactivated } from 'vue';

// 当组件被缓存时，会触发 onUnmounted 和 onDeactivated
// 当组件从缓存中恢复时，会触发 onActivated

export default {
  // 组件首次挂载
  onMounted(() => {
    console.log('mounted');
  }),

  // 组件被激活（从缓存中恢复）
  onActivated(() => {
    console.log('activated');
    // 适合：刷新数据、重置状态
  }),

  // 组件被缓存
  onDeactivated(() => {
    console.log('deactivated');
    // 适合：暂停定时器、保存状态
  }),

  // 组件被销毁
  onUnmounted(() => {
    console.log('unmounted');
  })
};
```

**使用示例：结合定时器**：

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    let timer = null;

    onMounted(() => {
      // 启动定时器
      timer = setInterval(() => {
        count.value++;
      }, 1000);
    });

    onUnmounted(() => {
      // 清理定时器，防止内存泄漏
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });

    return { count };
  }
};
```

---

### 2.3 依赖注入 provide/inject

**参考答案：**

```javascript
// 父组件
import { provide, ref } from 'vue';

export default {
  setup() {
    const theme = ref('dark');
    const updateTheme = (newTheme) => {
      theme.value = newTheme;
    };

    provide('theme', theme);
    provide('updateTheme', updateTheme);
  }
};

// 子组件
import { inject } from 'vue';

export default {
  setup() {
    const theme = inject('theme');
    const updateTheme = inject('updateTheme');

    return { theme, updateTheme };
  }
};
```

### 2.3.1 provide/inject 深入理解

**provide/inject 原理**：

```javascript
// provide 实现原理
function provide(key, value) {
  // 获取当前组件实例
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    // 将值存储到组件实例的 provides 上
    currentInstance.provides[key] = value;
  }
}

// inject 实现原理
function inject(key, defaultValue) {
  // 获取当前组件实例
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    // 从父组件的 provides 中获取值
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    }
  }

  // 返回默认值
  return defaultValue;
}
```

**provide/inject 高级用法**：

```javascript
// 1. 传递响应式数据
import { provide, reactive, ref, computed } from 'vue';

// 父组件
export default {
  setup() {
    // 传递 ref
    const count = ref(0);
    provide('count', count);

    // 传递 reactive
    const state = reactive({
      name: 'Tom',
      age: 18
    });
    provide('state', state);

    // 传递 computed
    const doubleCount = computed(() => count.value * 2);
    provide('doubleCount', doubleCount);

    return {};
  }
};

// 子组件
import { inject, computed } from 'vue';

export default {
  setup() {
    const count = inject('count');
    const state = inject('state');
    const doubleCount = inject('doubleCount');

    // 可以直接修改，响应式会传递
    const increment = () => count.value++;

    return { count, state, doubleCount, increment };
  }
};
```

**2. 使用 symbol 作为 key**：

```javascript
// 使用 Symbol 避免命名冲突
const themeKey = Symbol('theme');
const userKey = Symbol('user');

// 父组件
import { provide, reactive } from 'vue';

export default {
  setup() {
    const theme = reactive({
      color: 'dark',
      fontSize: 14
    });

    provide(themeKey, theme);

    return {};
  }
};

// 子组件
import { inject } from 'vue';

export default {
  setup() {
    const theme = inject(themeKey);
    return { theme };
  }
};
```

**3. 设置默认值**：

```javascript
// 子组件
import { inject } from 'vue';

export default {
  setup() {
    // 使用 ref 作为默认值
    const theme = inject('theme', ref('light'));

    // 使用工厂函数设置默认值
    const user = inject('user', () => ({
      name: 'Guest',
      age: 18
    }));

    return { theme, user };
  }
};
```

**4. 改写 props 为 provide**：

```javascript
// 父组件
export default {
  props: {
    name: String,
    age: Number
  },

  setup(props) {
    import { provide, toRefs } from 'vue';

    // 使用 toRefs 保持响应性
    const { name, age } = toRefs(props);

    provide('name', name);
    provide('age', age);

    return {};
  }
};
```

---

## 三、组件通信

### 3.1 组件通信方式

**参考答案：**

| 方式 | 说明 |
| :--- | :--- |
| **Props / Emit** | 父子组件通信 |
| **Provide / Inject** | 祖先与后代通信 |
| **EventBus** | 任意组件通信（ mitt） |
| **Vuex / Pinia** | 全局状态管理 |
| **$attrs** | 透传 props |
| **$refs** | 获取组件实例 |

```javascript
// Props
defineProps({
  title: String,
  count: {
    type: Number,
    default: 0
  }
});

// Emit
const emit = defineEmits(['update', 'delete']);
emit('update', payload);

// $attrs
// 父组件
<Child name="Tom" age="18" />

// Child 组件
// 未声明的 props 会通过 $attrs 传递
// 可通过 v-bind="$attrs" 透传
```

### 3.1.1 props 详解

**props 定义方式**：

```javascript
// 1. 数组方式（不推荐）
defineProps(['name', 'age', 'email']);

// 2. 对象方式（完整配置）
defineProps({
  // 基础类型
  name: String,

  // 多个基础类型
  age: Number,

  // 带默认值
  count: {
    type: Number,
    default: 0
  },

  // 带验证函数
  email: {
    type: String,
    validator(value) {
      // 自定义验证逻辑
      return value.includes('@');
    }
  },

  // 带 required
  id: {
    type: [Number, String],
    required: true
  },

  // 对象类型的默认值（需要使用工厂函数）
  user: {
    type: Object,
    default() {
      return { name: 'Tom', age: 18 };
    }
  },

  // 数组类型的默认值
  roles: {
    type: Array,
    default() {
      return [];
    }
  }
});

// 3. 使用类型定义（TypeScript）
interface User {
  name: string;
  age: number;
}

defineProps<{
  name: string;
  age?: number;
  user: User;
}>();

// 4. 使用 withDefaults（TypeScript）
interface Props {
  name: string;
  age?: number;
}

const props = withDefaults(defineProps<Props>(), {
  age: 18
});
```

**props 验证**：

```javascript
defineProps({
  // 类型检查
  name: String,
  age: Number,
  isActive: Boolean,
  callback: Function,
  items: Array,
  user: Object,

  // 多个允许的类型
  value: [String, Number],

  // 必填
  id: {
    type: [String, Number],
    required: true
  },

  // 默认值
  count: {
    type: Number,
    default: 0
  },

  // 自定义验证
  email: {
    type: String,
    validator(value) {
      // 必须是有效的邮箱格式
      return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
    }
  },

  // 多个验证条件
  age: {
    type: Number,
    validator(value) {
      if (value < 0 || value > 150) {
        console.warn('年龄必须在 0-150 之间');
        return false;
      }
      return true;
    }
  }
});
```

### 3.1.2 emit 详解

**emit 定义方式**：

```javascript
// 1. 数组方式
const emit = defineEmits(['update', 'delete', 'click']);

// 使用
emit('update', { name: 'Tom' });
emit('delete', 1);
emit('click');

// 2. 对象方式（带类型检查）
const emit = defineEmits({
  update: (payload) => {
    // 验证 payload
    return typeof payload.name === 'string';
  },
  delete: (id) => {
    return typeof id === 'number';
  },
  click: null // 不验证
});

// 使用
emit('update', { name: 'Tom' });
emit('delete', 1);
emit('click');

// 3. TypeScript 类型定义
const emit = defineEmits<{
  (e: 'update', payload: { name: string }): void;
  (e: 'delete', id: number): void;
  (e: 'click', event: MouseEvent): void;
}>();

// 使用
emit('update', { name: 'Tom' });
emit('delete', 1);
emit('click', new MouseEvent('click'));
```

**emit 与 v-model**：

```javascript
// 父组件
<ChildComponent v-model="value" />

// 等价于
<ChildComponent :modelValue="value" @update:modelValue="value = $event" />

// 子组件
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

function onInput(value) {
  emit('update:modelValue', value);
}

// 多个 v-model
// 父组件
<ChildComponent v-model:name="name" v-model:age="age" />

// 子组件
const props = defineProps(['name', 'age']);
const emit = defineEmits(['update:name', 'update:age']);

function updateName(value) {
  emit('update:name', value);
}

function updateAge(value) {
  emit('update:age', value);
}
```

### 3.1.3 $attrs 详解

**$attrs 的使用**：

```javascript
// 父组件
<ChildComponent
  class="custom-class"
  style="color: red"
  data-id="123"
  name="Tom"
  age="18"
/>

// Child 组件
export default {
  // 只接收 name，age 会通过 $attrs 传递
  props: {
    name: String
  },

  setup(props, context) {
    // $attrs 包含所有非 props 的属性
    console.log(context.attrs);
    // { class: 'custom-class', style: 'color: red', data-id: '123', age: '18' }

    // 透传 attrs
    // <GrandChild v-bind="$attrs" />

    return {};
  }
};
```

**inheritAttrs**：

```javascript
// 控制是否将 attrs 应用到根元素
export default {
  props: {
    name: String
  },

  // 默认 true，会将 attrs 应用到根元素
  inheritAttrs: false,

  setup(props, context) {
    // 可以手动控制 attrs 的应用
    return {
      // 只将某些 attrs 应用到特定元素
      customAttrs: {
        class: context.attrs.class,
        'data-id': context.attrs['data-id']
      }
    };
  }
};
```

```html
<!-- 模板中使用 -->
<div class="wrapper" v-bind="customAttrs">
  {{ name }}
</div>
```

---

### 3.2 Vuex 状态管理

**参考答案：**

```javascript
// 1. 安装 Vuex
// npm install vuex@4

// 2. 创建 store
import { createStore } from 'vuex';

export default createStore({
  // 状态
  state: {
    count: 0,
    user: null
  },

  // 类似于 computed
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user,
    // 接受 getter 作为第二个参数
    greeting: (state, getters) => {
      return getters.isLoggedIn ? `Hello, ${state.user.name}` : 'Please login';
    }
  },

  // 修改状态（必须是同步）
  mutations: {
    increment(state) {
      state.count++;
    },
    setUser(state, user) {
      state.user = user;
    },
    setCount(state, count) {
      state.count = count;
    }
  },

  // 提交 mutations（可以是异步）
  actions: {
    async login({ commit }, credentials) {
      try {
        const user = await api.login(credentials);
        commit('setUser', user);
        return user;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  },

  // 模块
  modules: {
    user: {
      namespaced: true,
      state: () => ({
        profile: null
      }),
      getters: {
        profile: (state) => state.profile
      },
      mutations: {
        setProfile(state, profile) {
          state.profile = profile;
        }
      },
      actions: {
        async fetchProfile({ commit }) {
          const profile = await api.getProfile();
          commit('setProfile', profile);
        }
      }
    }
  }
});
```

### 3.2.1 Vuex 在组件中的使用

**在组件中使用 Vuex**：

```javascript
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';

export default {
  computed: {
    // 映射单个 state
    ...mapState(['count', 'user']),
    // 映射带命名空间的 state
    ...mapState('user', ['profile']),
    // 映射带别名的 state
    ...mapState({
      myCount: 'count',
      currentUser: 'user'
    }),

    // 映射 getters
    ...mapGetters(['doubleCount', 'isLoggedIn']),
    ...mapGetters('user', ['profile'])
  },

  methods: {
    // 映射 mutations
    ...mapMutations(['increment', 'setUser']),
    ...mapMutations({
      add: 'increment'
    }),

    // 映射 actions
    ...mapActions(['login', 'incrementAsync']),
    ...mapActions({
      loginAction: 'login'
    })
  }
};
```

**使用 Composition API 访问 Vuex**：

```javascript
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();

    // 访问 state
    const count = computed(() => store.state.count);
    const user = computed(() => store.state.user);

    // 访问 getters
    const doubleCount = computed(() => store.getters.doubleCount);
    const isLoggedIn = computed(() => store.getters.isLoggedIn);

    // 提交 mutations
    function increment() {
      store.commit('increment');
    }

    function setUser(user) {
      store.commit('setUser', user);
    }

    // 分发 actions
    async function login(credentials) {
      await store.dispatch('login', credentials);
    }

    return {
      count,
      user,
      doubleCount,
      isLoggedIn,
      increment,
      setUser,
      login
    };
  }
};
```

**Vuex 模块化**：

```javascript
// stores/modules/user.js
export default {
  namespaced: true,

  state: () => ({
    profile: null,
    token: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.profile?.name
  },

  mutations: {
    setProfile(state, profile) {
      state.profile = profile;
    },
    setToken(state, token) {
      state.token = token;
    },
    logout(state) {
      state.profile = null;
      state.token = null;
    }
  },

  actions: {
    async login({ commit }, credentials) {
      const response = await api.login(credentials);
      commit('setToken', response.token);
      commit('setProfile', response.user);
      return response;
    },
    async logout({ commit }) {
      await api.logout();
      commit('logout');
    }
  }
};

// stores/modules/cart.js
export default {
  namespaced: true,

  state: () => ({
    items: [],
    checkoutStatus: null
  }),

  getters: {
    totalPrice: (state) => {
      return state.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);
    },
    itemCount: (state) => state.items.length
  },

  mutations: {
    addItem(state, item) {
      const existing = state.items.find(i => i.id === item.id);
      if (existing) {
        existing.quantity++;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
    },
    removeItem(state, itemId) {
      const index = state.items.findIndex(i => i.id === itemId);
      if (index > -1) {
        state.items.splice(index, 1);
      }
    },
    clearCart(state) {
      state.items = [];
    }
  },

  actions: {
    checkout({ commit, state }) {
      return api.checkout(state.items)
        .then(() => {
          commit('clearCart');
          return true;
        })
        .catch(error => {
          commit('setCheckoutStatus', error.message);
          throw error;
        });
    }
  }
};

// store/index.js
import { createStore } from 'vuex';
import user from './modules/user';
import cart from './modules/cart';

export default createStore({
  modules: {
    user,
    cart
  },

  // 根级别的 state
  state: () => ({
    loading: false
  }),

  // 根级别的 getters
  getters: {
    loading: (state) => state.loading
  }
});
```

---

### 3.3 Pinia 状态管理

**参考答案：**

```javascript
// 创建 store
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0,
    name: 'Tom'
  }),

  // 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
    // 访问其他 getter
    doublePlusOne() {
      return this.doubleCount + 1;
    }
  },

  // 方法
  actions: {
    increment() {
      this.count++;
    },
    async fetchData() {
      const res = await fetch('/api/data');
      const data = await res.json();
      return data;
    }
  }
});

// 使用
import { useCounterStore } from '@/stores/counter';

export default {
  setup() {
    const store = useCounterStore();

    // 访问状态
    console.log(store.count);

    // 修改状态
    store.increment();

    // 解构（保持响应式）
    const { count } = storeToRefs(store);

    return { store, count };
  }
};
```

### 3.3.1 Pinia 深入理解

**Pinia 的优势**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pinia vs Vuex                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pinia 优势：                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. 更简洁的 API                                          │   │
│  │     - 不需要 mutations                                     │   │
│  │     - 自动类型推断                                         │   │
│  │                                                             │   │
│  │  2. 支持 Composition API                                   │   │
│  │     - 可以使用 ref/reactive                                │   │
│  │     - 更好的 TypeScript 支持                               │   │
│  │                                                             │   │
│  │  3. 模块化更简单                                            │   │
│  │     - 每个 store 都是独立的                                 │   │
│  │     - 不需要嵌套模块                                        │   │
│  │                                                             │   │
│  │  4. 无需手动刷新                                            │   │
│  │     - 热更新时保持状态                                      │   │
│  │                                                             │   │
│  │  5. 更好的调试                                              │   │
│  │     - 支持 Vue Devtools                                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pinia Store 的多种定义方式**：

```javascript
// 1. 选项式 API（类似 Vuex）
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isLoggedIn: false
  }),

  getters: {
    username: (state) => state.user?.name || 'Guest',
    isVIP: (state) => state.user?.vip || false
  },

  actions: {
    async login(credentials) {
      try {
        const user = await api.login(credentials);
        this.user = user;
        this.isLoggedIn = true;
        return user;
      } catch (error) {
        throw error;
      }
    },

    logout() {
      this.user = null;
      this.isLoggedIn = false;
    }
  }
});

// 2. Setup 函数式（类似 Composition API）
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null);
  const isLoggedIn = ref(false);

  // 计算属性
  const username = computed(() => user.value?.name || 'Guest');
  const isVIP = computed(() => user.value?.vip || false);

  // 方法
  async function login(credentials) {
    try {
      const userData = await api.login(credentials);
      user.value = userData;
      isLoggedIn.value = true;
      return userData;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    user.value = null;
    isLoggedIn.value = false;
  }

  return {
    user,
    isLoggedIn,
    username,
    isVIP,
    login,
    logout
  };
});
```

**Pinia 持久化**：

```javascript
// 使用 pinia-plugin-persistedstate 插件
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 在 store 中启用持久化
export const useUserStore = defineStore('user', () => {
  const token = ref('');
  const user = ref(null);

  return { token, user };
}, {
  persist: true // 启用持久化
});

// 自定义持久化配置
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark');
  const language = ref('zh-CN');

  return { theme, language };
}, {
  persist: {
    key: 'my-app-settings',
    storage: localStorage,
    paths: ['theme'] // 只持久化 theme
  }
});
```

**Pinia 与 TypeScript**：

```javascript
// 类型定义
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isLoggedIn: false
  }),

  getters: {
    username: (state): string => state.user?.name || 'Guest'
  },

  actions: {
    async login(credentials: { email: string; password: string }): Promise<User> {
      const user = await api.login(credentials);
      this.user = user;
      this.isLoggedIn = true;
      return user;
    }
  }
});

// 使用时自动推断类型
const store = useUserStore();
store.user?.name; // string | undefined
store.login; // (credentials: { email: string; password: string }) => Promise<User>
```

---

## 四、Vue 3 新特性

### 4.1 Teleport 瞬移

**参考答案：**

```javascript
// Teleport - 将组件渲染到指定 DOM 位置
<template>
  <button @click="show = true">Open Modal</button>

  <Teleport to="body">
    <div v-if="show" class="modal">
      <div class="content">
        <p>Modal Content</p>
        <button @click="show = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>

<style>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}
</style>
```

### 4.1.1 Teleport 深入理解

**Teleport 的多种用法**：

```javascript
// 1. 传送到 body
<Teleport to="body">
  <div class="modal">Modal Content</div>
</Teleport>

// 2. 传送到指定选择器
<Teleport to="#modal-container">
  <div class="modal">Modal Content</div>
</Teleport>

// 3. 传送到 DOM 元素
<Teleport :to="modalContainer">
  <div class="modal">Modal Content</div>
</Teleport>

// 4. 传送到多个目标（禁用）
<Teleport to="body" :disabled="false">
  <div class="modal">Modal Content</div>
</Teleport>
```

**Teleport 实战示例**：

```javascript
// Modal 组件
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <header>
          <slot name="title">Default Title</slot>
          <button class="close-btn" @click="close">×</button>
        </header>
        <main>
          <slot></slot>
        </main>
        <footer>
          <slot name="footer">
            <button @click="close">Close</button>
          </slot>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  max-width: 90%;
}

.close-btn {
  float: right;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
```

```javascript
// 使用 Modal
<template>
  <button @click="showModal = true">Open Modal</button>

  <Modal v-model="showModal">
    <template #title>Confirm</template>
    <p>Are you sure to delete this item?</p>
    <template #footer>
      <button @click="confirm">Confirm</button>
      <button @click="showModal = false">Cancel</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';

const showModal = ref(false);

function confirm() {
  // 删除逻辑
  showModal.value = false;
}
</script>
```

**Teleport 与 CSS 样式**：

```javascript
// 注意事项：Teleport 不会改变 CSS 作用域
// 样式仍然受组件作用域影响

// 解决方案1：使用 :global
<style>
:global(.modal-overlay) {
  /* 全局样式 */
}
</style>

// 解决方案2：在 Teleport 外部定义样式
<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}
</style>

<Teleport to="body">
  <div class="modal-overlay">...</div>
</Teleport>
```

---

### 4.2 Suspense 异步组件

**参考答案：**

```javascript
// 异步组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue')
);

// 带 loading 和 error
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./AsyncComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
});

// 使用 Suspense
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <Loading />
  </template>
</Suspense>
```

### 4.2.1 Suspense 深入理解

**Suspense 的工作原理**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Suspense 工作流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 初始渲染                                                     │
│     ┌────────────────────────────────────────────────────────┐  │
│  │  Suspense 显示 #fallback                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  2. 异步依赖加载                                                │
│     ┌────────────────────────────────────────────────────────┐  │
│  │  - 异步组件                                               │  │
│  │  - async setup()                                         │  │
│  │  - 异步组件的顶层 await                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  3. 渲染完成                                                    │
│     ┌────────────────────────────────────────────────────────┐  │
│  │  Suspense 显示 #default                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**defineAsyncComponent 完整配置**：

```javascript
import { defineAsyncComponent } from 'vue';
import Loading from './Loading.vue';
import Error from './Error.vue';

// 完整配置
const AsyncComponent = defineAsyncComponent({
  // 异步组件加载函数
  loader: async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    return import('./AsyncComponent.vue');
  },

  // 加载时显示的组件
  loadingComponent: Loading,

  // 加载失败时显示的组件
  errorComponent: Error,

  // 展示 loadingComponent 前的延迟（默认 200ms）
  delay: 200,

  // 超时时间（默认 Infinity）
  timeout: 3000,

  // 是否承诺组件可挂起（默认 true）
  suspensible: true,

  // 加载错误后是否重试
  onError(error, retry, fail, attempts) {
    // 错误处理逻辑
    if (attempts < 3) {
      retry();
    } else {
      fail();
    }
  }
});
```

**Suspense 嵌套使用**：

```javascript
// 父组件
<Suspense>
  <template #default>
    <ParentComponent />
  </template>
  <template #fallback>
    <LoadingSkeleton />
  </template>
</Suspense>

// ParentComponent.vue
<template>
  <div>
    <h1>Parent</h1>
    <Suspense>
      <template #default>
        <ChildComponent />
      </template>
      <template #fallback>
        <ChildLoading />
      </template>
    </Suspense>
  </div>
</template>
```

**async setup 与 Suspense**：

```javascript
// 使用 async setup
export default {
  async setup() {
    // 在 setup 中使用 await
    const user = await fetchUser();
    const posts = await fetchPosts();

    return { user, posts };
  }
};

// 或者在组件中使用 async 组件
const UserProfile = defineAsyncComponent(async () => {
  const user = await fetchUser();
  return {
    setup() {
      return { user };
    }
  };
});
```

---

### 4.3 Fragments

**参考答案：**

```javascript
// Vue 3 支持多根节点组件
<template>
  <div class="header">Header</div>
  <div class="content">Content</div>
  <div class="footer">Footer</div>
</template>

// Vue 2 需要单一根节点
<template>
  <div>
    <div class="header">Header</div>
    <div class="content">Content</div>
    <div class="footer">Footer</div>
  </div>
</template>
```

### 4.3.1 Fragments 深入理解

**Fragments 的优势**：

```javascript
// 1. 减少不必要的 DOM 层级
// Vue 2
// <div>
//   <header></header>
//   <main></main>
//   <footer></footer>
// </div>

// Vue 3
// <header></header>
// <main></main>
// <footer></footer>

// 2. 更好的 CSS 样式控制
<template>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</template>

<style scoped>
li {
  color: red;
}
</style>
```

**带 key 的 Fragments**：

```javascript
// 需要使用 key 来标记每个元素
<template>
  <template v-for="item in items" :key="item.id">
    <div>{{ item.title }}</div>
    <p>{{ item.description }}</p>
  </template>
</template>
```

**Fragments 与 v-for**：

```javascript
// 动态渲染多个元素
<template>
  <h1 v-for="header in headers" :key="header.id">
    {{ header.text }}
  </h1>
</template>

<script setup>
const headers = [
  { id: 1, text: 'Header 1' },
  { id: 2, text: 'Header 2' },
  { id: 3, text: 'Header 3' }
];
</script>
```

---

## 五、性能优化

### 5.1 Vue 性能优化策略

**参考答案：**

```javascript
// 1. v-show vs v-if
// v-if: 条件为 false 不渲染（切换成本高）
// v-show: 始终渲染，通过 display 切换（初始化成本高）

// 2. v-for 使用 key
// 保持节点可复用
<div v-for="item in items" :key="item.id">

// 3. 列表虚拟滚动
// vue-virtual-scroller

// 4. 组件懒加载
const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue')
);

// 5. 减少响应式对象
// 不需要响应式的数据不要放在 data/reactive 中

// 6. computed 缓存
// 依赖不变时使用缓存

// 7. keep-alive 缓存组件
<keep-alive :include="['ComponentA']">
  <ComponentA />
</keep-alive>
```

### 5.1.1 渲染优化

**v-show vs v-if 选择**：

| 场景 | 推荐 | 原因 |
| :--- | :--- | :--- |
| 切换频率低 | v-if | 不渲染，初始成本低 |
| 切换频率高 | v-show | 始终渲染，切换成本低 |
| 权限控制 | v-if | 条件不满足不渲染 |
| 动态显示/隐藏 | v-show | 需要保持状态 |

```javascript
// v-if 适合权限控制
<div v-if="user.isAdmin">
  <AdminPanel />
</div>

// v-show 适合频繁切换
<div v-show="isModalVisible">
  <Modal />
</div>
```

**减少不必要的渲染**：

```javascript
// 1. 合理使用 computed
const firstName = ref('John');
const lastName = ref('Doe');

// 好：使用 computed
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// 不好：每次渲染都重新计算
const fullName = ref('');
watch([firstName, lastName], () => {
  fullName.value = `${firstName.value} ${lastName.value}`;
});

// 2. 使用 shallowRef / markRaw
import { shallowRef, markRaw } from 'vue';

// shallowRef 只触发顶层响应式
const state = shallowRef({
  deep: { nested: 'value' }
});
state.value.deep.nested = 'newValue'; // 不会触发更新

// markRaw 标记非响应式
const obj = markRaw({ deep: { nested: 'value' } });
// 修改 obj 不会触发更新
```

**v-for 优化**：

```javascript
// 1. 使用唯一的 key
// 好
<div v-for="item in items" :key="item.id">

// 不好 - 使用索引作为 key
<div v-for="(item, index) in items" :key="index">

// 2. 避免在 v-for 中使用 v-if
// 不好
<div v-for="item in items" v-if="item.visible" :key="item.id">

// 好 - 使用 computed 过滤
const visibleItems = computed(() => {
  return items.filter(item => item.visible);
});
<div v-for="item in visibleItems" :key="item.id">

// 3. 使用虚拟列表
// vue-virtual-scroller, vue-virtual-scroll-list
```

### 5.1.2 异步组件

**异步组件的优势**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    异步组件优势                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 代码分割                                                     │
│     - 将不首屏渲染的代码分割成独立 chunk                        │
│     - 减少首屏加载时间                                           │
│                                                                  │
│  2. 按需加载                                                     │
│     - 只有需要时才加载组件                                       │
│     - 节省带宽和内存                                             │
│                                                                  │
│  3. 并行加载                                                     │
│     - 多个异步组件可以并行加载                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**异步组件的使用**：

```javascript
// 1. 基础用法
const AsyncModal = defineAsyncComponent(() =>
  import('./Modal.vue')
);

// 2. 带配置
const AsyncModal = defineAsyncComponent({
  loader: () => import('./Modal.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorMessage,
  delay: 200,
  timeout: 5000
});

// 3. Suspense 配合
<Suspense>
  <template #default>
    <AsyncModal />
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
```

**路由懒加载**：

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// 路由懒加载
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/User.vue'),
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/UserProfile.vue')
      },
      {
        path: 'settings',
        name: 'UserSettings',
        component: () => import('../views/UserSettings.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
```

**预加载**：

```javascript
// 使用 webpackChunkName 命名 chunk
const AsyncModal = defineAsyncComponent(() =>
  import(/* webpackChunkName: "modal" */ './Modal.vue')
);

// 预加载下一个路由
import { preloadRoute } from 'vue-router';

// 路由元信息中标记需要预加载的路由
const routes = [
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue'),
    children: [
      {
        path: ':id',
        name: 'ProductDetail',
        component: () => import('../views/ProductDetail.vue')
      }
    ]
  }
];
```

### 5.1.3 keep-alive 缓存

**keep-alive 的使用**：

```javascript
// 1. 基本用法
<keep-alive>
  <ComponentA />
</keep-alive>

// 2. 缓存指定组件
<keep-alive :include="['Home', 'About']">
  <router-view />
</keep-alive>

// 3. 排除组件
<keep-alive :exclude="['Login']">
  <router-view />
</keep-alive>

// 4. 最大缓存数
<keep-alive :max="10">
  <component :is="currentComponent" />
</keep-alive>
```

**生命周期变化**：

```javascript
// 被缓存的组件
export default {
  // 首次渲染
  mounted() {
    console.log('mounted');
  },

  // 被缓存时触发
  onActivated() {
    console.log('activated - 从缓存中恢复');
    // 适合：刷新数据、重置定时器
  },

  // 被缓存时触发
  onDeactivated() {
    console.log('deactivated - 进入缓存');
    // 适合：保存状态、清理资源
  },

  // 被销毁时触发
  onUnmounted() {
    console.log('unmounted - 真正销毁');
  }
};
```

---

## 六、Vue Router

### 6.1 路由守卫

**参考答案：**

```javascript
// 全局守卫
const router = createRouter({ ... });

// 前置守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

// 后置守卫
router.afterEach((to, from) => {
  // 滚动行为
  window.scrollTo(0, 0);
});

// 组件内守卫
export default {
  beforeRouteEnter(to, from, next) {
    // 组件创建前调用
    next(vm => {
      // vm 是组件实例
    });
  },
  beforeRouteUpdate(to, from, next) {
    // 路由参数变化时调用
    next();
  },
  beforeRouteLeave(to, from, next) {
    // 离开组件时调用
    next();
  }
};
```

### 6.1.1 路由守卫详解

**守卫执行顺序**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    路由守卫执行顺序                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 导航触发                                                     │
│       │                                                          │
│       ▼                                                          │
│  2. beforeRouteLeave (组件内)                                    │
│       │                                                          │
│       ▼                                                          │
│  3. beforeEach (全局)                                           │
│       │                                                          │
│       ▼                                                          │
│  4. beforeRouteUpdate (组件内)                                  │
│       │                                                          │
│       ▼                                                          │
│  5. beforeEnter (路由独享)                                      │
│       │                                                          │
│       ▼                                                          │
│  6. 解析异步路由组件                                             │
│       │                                                          │
│       ▼                                                          │
│  7. beforeRouteEnter (组件内 - before)                          │
│       │                                                          │
│       ▼                                                          │
│  8. 更新 DOM                                                     │
│       │                                                          │
│       ▼                                                          │
│  9. afterEach (全局)                                            │
│       │                                                          │
│       ▼                                                          │
│  10. beforeRouteEnter (组件内 - next(vm))                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**完整的路由守卫示例**：

```javascript
import { createRouter, createWebHistory } from 'vue-router';

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresRole: 'admin' },
    beforeEnter: (to, from, next) => {
      // 路由独享守卫
      next();
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 记录访问历史
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  history.push({ path: from.path, time: Date.now() });
  localStorage.setItem('history', JSON.stringify(history));

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    // 检查角色权限
    if (to.meta.requiresRole) {
      const userRole = localStorage.getItem('role');
      if (userRole !== to.meta.requiresRole) {
        next({ name: 'Forbidden' });
        return;
      }
    }
  }

  // 检查访客专用页面
  if (to.meta.requiresGuest) {
    const token = localStorage.getItem('token');
    if (token) {
      next({ name: 'Dashboard' });
      return;
    }
  }

  next();
});

// 全局解析守卫
router.beforeResolve(async (to, from, next) => {
  // 加载必要的异步数据
  if (to.meta.loadData) {
    await loadPageData(to.name);
  }
  next();
});

// 全局后置钩子
router.afterEach((to, from) => {
  // 设置页面标题
  document.title = to.meta.title || 'My App';

  // 发送页面访问统计
  if (to.meta.analytics) {
    sendAnalytics({
      page: to.fullPath,
      title: to.meta.title
    });
  }

  // 滚动到顶部
  window.scrollTo(0, 0);
});

// 路由变化错误处理
router.onError((error) => {
  console.error('路由错误:', error);
  // 跳转到错误页面
  router.push({ name: 'Error', params: { error: error.message } });
});
```

**组件内守卫详解**：

```javascript
export default {
  // 1. beforeRouteEnter - 路由进入前
  // 此时组件实例还未创建，不能访问 this
  beforeRouteEnter(to, from, next) {
    // 可以通过 next(vm) 回调访问组件实例
    next(vm => {
      // vm 是组件实例
      vm.$data.loaded = true;
    });
  },

  // 2. beforeRouteUpdate - 路由更新时
  // 路由参数变化，组件被复用时调用
  beforeRouteUpdate(to, from, next) {
    // 可以访问 this
    console.log(this.$route.params.id);
    // 更新数据
    this.loadData(to.params.id);
    next();
  },

  // 3. beforeRouteLeave - 路由离开前
  // 离开当前路由时调用
  beforeRouteLeave(to, from, next) {
    // 提示用户保存未保存的更改
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('您有未保存的更改，确定要离开吗？');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  }
};
```

---

### 6.2 路由模式

**参考答案：**

```javascript
// 1. Hash 模式
// URL 带 # 号，兼容性好
const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
});

// 2. History 模式
// URL 美观，需要服务器配置
const router = createRouter({
  history: createWebHistory(),
  routes: [...]
});

// 服务器配置示例 (Nginx)
// location / {
//   try_files $uri $uri/ /index.html;
// }
```

### 6.2.1 路由模式详解

**Hash vs History 对比**：

| 特性 | Hash 模式 | History 模式 |
| :--- | :--- | :--- |
| URL 格式 | #/user | /user |
| 兼容性 | IE8+ | IE10+ |
| 服务器配置 | 不需要 | 需要 |
| 刷新重定向 | 不需要 | 需要 |
| SEO | 较差 | 较好 |

**History 模式服务器配置**：

```javascript
// Node.js / Express
const express = require('express');
const history = require('connect-history-api-fallback');
const app = express();

app.use(history());
app.use(express.static('dist'));

app.listen(3000);

// Nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

// Apache (.htaccess)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**路由元信息**：

```javascript
// 定义路由元信息
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin',
      title: '管理后台',
      keepAlive: true,
      analytics: true
    }
  }
];

// 使用元信息
router.beforeEach((to, from, next) => {
  // 访问 meta
  if (to.meta.requiresAuth) {
    // 检查权限
  }

  // 设置页面标题
  document.title = to.meta.title || '默认标题';

  next();
});
```

**路由参数和查询**：

```javascript
// 路由定义
const routes = [
  {
    path: '/user/:id',
    name: 'User',
    component: User
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  }
];

// 在组件中使用
export default {
  setup() {
    const route = useRoute();

    // 路由参数
    const userId = computed(() => route.params.id);

    // 查询参数
    const query = computed(() => route.query);

    // 完整路径
    const path = route.path;

    // 完整查询字符串
    const fullPath = route.fullPath;

    return { userId, query, path, fullPath };
  }
};

// 编程式导航
function navigate() {
  // 跳转
  router.push('/user/1');

  // 带查询参数
  router.push({ path: '/search', query: { q: 'keyword' });

  // 带命名路由
  router.push({ name: 'User', params: { id: 1 } });

  // 替换当前记录
  router.replace('/user/2');

  // 前进/后退
  router.go(-1);
  router.go(1);
}
```

---

## 七、原理面试题

### 7.1 Vue 响应式原理

**参考答案：**

```javascript
// Vue 2 响应式原理
function defineReactive(obj, key, val) {
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 依赖收集
      if (Dep.target) {
        dep.depend();
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      // 通知更新
      dep.notify();
    }
  });
}

// Vue 3 响应式原理
function reactive(target) {
  const handlers = {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      Reflect.set(target, key, value, receiver);
      trigger(target, key);
    }
  };

  return new Proxy(target, handlers);
}
```

### 7.1.1 响应式原理面试详解

**Vue 2 响应式原理**：

```javascript
// 完整的 Vue 2 响应式实现

// 1. Observer - 监听数据对象
class Observer {
  constructor(data) {
    if (Array.isArray(data)) {
      // 数组处理
      this.observeArray(data);
    } else {
      // 对象处理
      this.walk(data);
    }
  }

  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key]);
    });
  }

  observeArray(arr) {
    arr.forEach(item => {
      observe(item);
    });
  }
}

// 2. defineProperty - 定义响应式属性
function defineReactive(obj, key, val) {
  // 递归监听子属性
  const childDep = observe(val);

  const dep = new Dep();

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 依赖收集
      if (Dep.target) {
        dep.depend();

        // 处理数组
        if (childDep) {
          childDep.dep.depend();
        }
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;

      // 设置新值
      val = newVal;

      // 监听新值
      observe(newVal);

      // 通知更新
      dep.notify();
    }
  });
}

// 3. Dep - 依赖管理
class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  removeSub(sub) {
    const index = this.subs.indexOf(sub);
    if (index > -1) {
      this.subs.splice(index, 1);
    }
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

// 4. Watcher - 观察者
class Watcher {
  constructor(vm, expOrFn, callback) {
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.callback = callback;
    this.deps = [];
    this.newDeps = [];
    this.value = this.get();
  }

  get() {
    Dep.target = this;
    const value = this.expOrFn();
    Dep.target = null;
    return value;
  }

  addDep(dep) {
    if (!this.deps.includes(dep)) {
      this.deps.push(dep);
      dep.addSub(this);
    }
  }

  update() {
    const newValue = this.get();
    if (newValue !== this.value) {
      this.callback(newValue, this.value);
      this.value = newValue;
    }
  }

  teardown() {
    this.deps.forEach(dep => {
      dep.removeSub(this);
    });
  }
}

// 5. observe - 创建 Observer
function observe(value) {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  if (value.__ob__) {
    return value.__ob__;
  }

  return new Observer(value);
}
```

**Vue 3 响应式原理**：

```javascript
// 完整的 Vue 3 响应式实现

// 全局变量
let activeEffect = null;
const targetMap = new WeakMap();

// 1. track - 依赖收集
function track(target, key) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  dep.add(activeEffect);
}

// 2. trigger - 触发更新
function trigger(target, key, newValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect());
  }
}

// 3. reactive - 创建响应式对象
function reactive(target) {
  const handlers = {
    get(target, key, receiver) {
      track(target, key);
      const result = Reflect.get(target, key, receiver);

      // 懒加载：递归转换嵌套对象
      if (result && typeof result === 'object') {
        return reactive(result);
      }
      return result;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);

      if (oldValue !== value) {
        trigger(target, key, value);
      }
      return result;
    },

    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      if (result) {
        trigger(target, key);
      }
      return result;
    }
  };

  return new Proxy(target, handlers);
}

// 4. effect - 副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

// 5. ref 实现
class RefImpl {
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value;
  }

  get value() {
    track(this, 'value');
    return this._value;
  }

  set value(newValue) {
    if (newValue !== this._value) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      trigger(this, 'value');
    }
  }
}

function ref(value) {
  return new RefImpl(value);
}

// 6. computed 实现
class ComputedImpl {
  constructor(getter) {
    this._getter = getter;
    this._value = undefined;
    this._dirty = true;

    effect(() => {
      this._value = this._getter();
      this._dirty = false;
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this._getter();
      this._dirty = false;
    }
    track(this, 'value');
    return this._value;
  }
}

function computed(getter) {
  return new ComputedImpl(getter);
}
```

### 7.2 Vue 模板编译

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vue 模板编译流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  模板 ──▶ AST ──▶ 优化 ──▶ 代码生成                             │
│                                                                  │
│  1. 解析 (parse)                                               │
│     模板字符串 ──▶ AST（抽象语法树）                            │
│                                                                  │
│  2. 优化 (optimize)                                            │
│     标记静态节点                                                │
│     - 纯文本节点                                                │
│     - 无绑定表达式                                              │
│                                                                  │
│  3. 代码生成 (generate)                                         │
│     AST ──▶ render 函数                                        │
│     - _c('div', ...) 创建元素                                  │
│     - _v() 创建文本                                            │
│     - _s() 字符串化                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2.1 模板编译详解

**模板编译流程**：

```javascript
// 完整的模板编译流程

// 1. parse - 解析模板生成 AST
function parse(template) {
  // 词法分析
  const tokens = tokenize(template);

  // 语法分析
  const ast = parseTokens(tokens);

  return ast;
}

// 2. optimize - 优化 AST
function optimize(ast) {
  // 标记静态节点
  markStatic(ast);

  // 标记静态根节点
  markStaticRoots(ast);

  return ast;
}

// 3. generate - 生成代码
function generate(ast) {
  // 生成代码字符串
  const code = genElement(ast);

  return {
    render: `function render() { return ${code} }`
  };
}

// 完整编译函数
function compile(template) {
  // 解析
  const ast = parse(template);

  // 优化
  optimize(ast);

  // 代码生成
  const code = generate(ast);

  return code;
}
```

**AST 节点类型**：

```javascript
// AST 节点结构
const astNode = {
  // 元素节点
  type: 'Element',
  tag: 'div',
  attrs: [
    { name: 'class', value: 'container' },
    { name: '@click', value: 'handleClick' }
  ],
  children: [
    // 子节点
  ],

  // 文本节点
  type: 'Text',
  content: 'Hello World',

  // 插值节点
  type: 'Interpolation',
  expression: 'name',
  value: '{{ name }}'
};
```

**编译优化**：

```javascript
// 静态节点标记
function markStatic(node) {
  node.static = false;

  // 文本节点是静态的
  if (node.type === 'Text') {
    node.static = true;
  }

  // 没有绑定的元素
  if (node.type === 'Element' && !hasDynamicBinding(node)) {
    // 没有动态绑定的是静态的
    node.static = true;
  }

  // 递归处理子节点
  if (node.children) {
    node.children.forEach(child => {
      markStatic(child);
    });
  }
}

// 静态根节点优化
function markStaticRoots(node) {
  if (node.static && node.children && node.children.length > 0) {
    node.staticRoot = true;
  }

  if (node.children) {
    node.children.forEach(child => {
      markStaticRoots(child);
    });
  }
}

// 生成代码
function genElement(node) {
  if (node.tag === 'div') {
    return `_c('div', { class: 'container' }, [${node.children.map(gen).join(',')}])`;
  }
}
```

---

### 7.3 Virtual DOM 与 Diff

**参考答案：**

```javascript
// 1. patch - 对比新旧 VNode
function patch(oldVnode, newVnode) {
  // 相同节点
  if (sameVnode(oldVnode, newVnode)) {
    patchVnode(oldVnode, newVnode);
  } else {
    // 不同节点，替换
    const oldElm = oldVnode.elm;
    const newElm = createElement(newVnode);
    oldElm.parentNode.replaceChild(newElm, oldElm);
  }
}

// 2. patchVnode - 对比子节点
function patchVnode(oldVnode, newVnode) {
  if (oldVnode === newVnode) return;

  // 更新文本
  if (oldVnode.text && !newVnode.children) {
    oldVnode.elm.nodeValue = newVnode.text;
  }

  // 更新子节点
  if (oldVnode.children && newVnode.children) {
    updateChildren(oldVnode.children, newVnode.children);
  }
}

// 3. updateChildren - diff 核心
function updateChildren(oldChildren, newChildren) {
  // 双端对比算法
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldChildren.length - 1;
  let newEndIdx = newChildren.length - 1;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 省略详细对比逻辑...
  }
}
```

### 7.3.1 Virtual DOM 详解

**VNode 结构**：

```javascript
// 虚拟节点结构
const vnode = {
  // 元素类型
  type: 'Element', // 'Element' | 'Text' | 'Comment'

  // 标签名
  tag: 'div',

  // 属性
  props: {
    class: 'container',
    id: 'app',
    onClick: handleClick
  },

  // 子节点
  children: [
    // 文本节点
    { type: 'Text', content: 'Hello' },
    // 元素节点
    { type: 'Element', tag: 'span', ... }
  ],

  // DOM 元素
  elm: null,

  // 唯一标识（用于 diff）
  key: 'key',

  // 文本内容
  text: null
};
```

**完整 Diff 算法**：

```javascript
// 完整的 Diff 算法实现

function updateChildren(parentElm, oldChildren, newChildren) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldChildren.length - 1;
  let newEndIdx = newChildren.length - 1;

  let oldStartVnode = oldChildren[0];
  let oldEndVnode = oldChildren[oldEndIdx];
  let newStartVnode = newChildren[0];
  let newEndVnode = newChildren[newEndIdx];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 1. 头头对比
    if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldChildren[++oldStartIdx];
      newStartVnode = newChildren[++newStartIdx];
    }
    // 2. 尾尾对比
    else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldChildren[--oldEndIdx];
      newEndVnode = newChildren[--newEndIdx];
    }
    // 3. 头尾对比
    else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode);
      // 移动节点
      parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
      oldStartVnode = oldChildren[++oldStartIdx];
      newEndVnode = newChildren[--newEndIdx];
    }
    // 4. 尾头对比
    else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode);
      parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldChildren[--oldEndIdx];
      newStartVnode = newChildren[++newStartIdx];
    }
    // 5. 暴力对比
    else {
      // 使用 key 查找匹配
      const oldIdxByKey = findIdxInOld(oldStartVnode, oldChildren);

      if (oldIdxByKey > -1) {
        const oldVnodeByKey = oldChildren[oldIdxByKey];
        if (sameVnode(oldStartVnode, oldVnodeByKey)) {
          patchVnode(oldVnodeByKey, newStartVnode);
          oldChildren[oldIdxByKey] = undefined;
          parentElm.insertBefore(oldVnodeByKey.elm, oldStartVnode.elm);
        }
      } else {
        // 新建节点
        const newElm = createElement(newStartVnode);
        parentElm.insertBefore(newElm, oldStartVnode.elm);
      }

      newStartVnode = newChildren[++newStartIdx];
    }
  }

  // 处理剩余节点
  if (newStartIdx <= newEndIdx) {
    // 新增节点
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      const newElm = createElement(newChildren[i]);
      parentElm.appendChild(newElm);
    }
  }

  if (oldStartIdx <= oldEndIdx) {
    // 删除旧节点
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      if (oldChildren[i]) {
        parentElm.removeChild(oldChildren[i].elm);
      }
    }
  }
}

// 判断是否是相同节点
function sameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
}
```

**Vue 3 的静态提升**：

```javascript
// Vue 2
// 每次渲染都重新创建 VNode
render() {
  return _c('div', [
    _c('span', { staticClass: 'icon' }),
    _v(this.message)
  ]);
}

// Vue 3
// 静态内容只创建一次
const _hoisted_1 = _c('span', { staticClass: 'icon' });

render() {
  return _c('div', [
    _hoisted_1,
    _v(this.message)
  ]);
}
```

---

### 7.4 nextTick 原理

**参考答案：**

```javascript
// nextTick 使用微任务队列
let callbacks = [];
let pending = false;

function nextTick(cb) {
  callbacks.push(cb);

  if (!pending) {
    pending = true;
    // 使用 Promise.then 或 MutationObserver
    Promise.resolve().then(flushCallbacks);
  }
}

function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  copies.forEach(cb => cb());
}

// 使用场景
// 1. DOM 更新后获取最新 DOM
async function updateAndGetDom() {
  item.show = true;
  await nextTick();
  console.log(item.$el); // 获取最新 DOM
}

// 2. 组件更新后执行逻辑
this.name = 'Tom';
this.$nextTick(() => {
  // DOM 已更新
});
```

### 7.4.1 nextTick 详解

**nextTick 实现原理**：

```javascript
// 完整的 nextTick 实现

let callbacks = [];
let pending = false;
let currentFlushPromise = null;

function nextTick(cb) {
  const _resolve = cb;

  // 将回调函数添加到队列
  callbacks.push(() => {
    if (cb) {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    }
  });

  // 如果没有正在执行的回调，创建一个新的微任务
  if (!pending) {
    pending = true;

    // 使用 Promise 实现微任务
    currentFlushPromise = Promise.resolve().then(flushCallbacks);
  }

  // 如果没有传入回调，返回 Promise
  if (!cb) {
    return new Promise(resolve => {
      callbacks.push(resolve);
    });
  }
}

function flushCallbacks() {
  pending = false;

  // 复制并清空 callbacks
  const copies = callbacks.slice(0);
  callbacks.length = 0;

  // 依次执行回调
  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// 宏任务降级处理
if (typeof Promise !== 'undefined') {
  const p = Promise.resolve();
  // 使用 Promise.then
} else if (typeof MutationObserver !== 'undefined') {
  let counter = 1;
  const observer = new MutationObserver(flushCallbacks);
  const textNode = document.createTextNode(String(counter));
  observer.observe(textNode, { characterData: true });
  // 使用 MutationObserver
} else {
  // 降级到 setTimeout
  setTimeout(flushCallbacks, 0);
}
```

**nextTick 使用场景**：

```javascript
// 1. 获取更新后的 DOM
async function updateAndGetDOM() {
  const data = { message: 'Updated' };

  // 触发更新
  this.message = data.message;

  // 等待 DOM 更新
  await nextTick();

  // 获取更新后的 DOM
  console.log(this.$refs.content.offsetHeight);
}

// 2. 等待多个状态更新
async function updateMultiple() {
  // 批量更新
  this.name = 'Tom';
  this.age = 18;
  this.address = 'Beijing';

  // 等待所有更新完成
  await nextTick();

  // 此时 DOM 已完成更新
  console.log('All updates completed');
}

// 3. 在 watch 中使用
watch: {
  value(newVal) {
    this.$nextTick(() => {
      // DOM 已更新
    });
  }
}

// 4. 在 updated 生命周期中使用
updated() {
  // 已经是更新后的状态
  this.$nextTick(() => {
    // 可以在此处进行 DOM 操作
  });
}
```

---

## 八、Vue 2 vs Vue 3 对比

### 8.1 主要区别

**参考答案：**

| 特性 | Vue 2 | Vue 3 |
| :--- | :--- | :--- |
| 响应式 | Object.defineProperty | Proxy |
| 生命周期 | created/mounted | setup + onMounted |
| 组件通信 | props/$emit | props + emits |
| 状态管理 | Vuex | Pinia |
| 模板 | 单根节点 | 多根节点 |
| TypeScript | 有限支持 | 原生支持 |
| 打包 | 较大 | 更小 |
| Composition API | 无 | 有 |
| 性能 | 中等 | 更好 |

### 8.1.1 Vue 3 性能提升详解

**性能优化对比**：

```javascript
// Vue 2 vs Vue 3 性能对比

// 1. 响应式系统
// Vue 2: 递归遍历所有属性
function reactive(obj) {
  Object.keys(obj).forEach(key => {
    defineReactive(obj, key, obj[key]);
  });
  return obj;
}

// Vue 3: 使用 Proxy，自动代理
function reactive(obj) {
  return new Proxy(obj, handlers);
}

// 2. 静态提升
// Vue 2: 每次渲染都重新创建静态节点
render(h) {
  return h('div', [
    h('span', 'static'), // 每次都创建
    h('span', this.msg)  // 动态
  ]);
}

// Vue 3: 静态节点只创建一次
const hoist1 = h('span', 'static');
render() {
  return h('div', [hoist1, this.msg]);
}

// 3. Patch 标志
// Vue 2: 完整 diff
// Vue 3: 使用标志，只对比动态部分

// 4. 块结构
// Vue 3: 跳过静态节点
```

**性能测试示例**：

```javascript
// 创建 10000 条数据的列表
const items = ref(Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` })));

// Vue 2 渲染时间: ~50ms
// Vue 3 渲染时间: ~10ms
```

---

### 8.2 选项式 API vs Composition API

**参考答案：**

```javascript
// Vue 2 - 选项式 API
export default {
  data() {
    return { count: 0 };
  },
  computed: {
    double() {
      return this.count * 2;
    }
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  mounted() {
    console.log('mounted');
  }
};

// Vue 3 - Composition API
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const double = computed(() => count.value * 2);

    function increment() {
      count.value++;
    }

    onMounted(() => {
      console.log('mounted');
    });

    return { count, double, increment };
  }
};
```

### 8.2.1 Composition API 优势

**Composition API 的优势**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Composition API 优势                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 更好的逻辑复用                                               │
│     ┌─────────────────────────────────────────────────────┐     │
│  │  - 提取复用逻辑为函数                                   │     │
│  │  - 组合多个函数                                         │     │
│  │  - 避免 mixin 的命名冲突和来源不明                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  2. 更好的代码组织                                               │
│     ┌─────────────────────────────────────────────────────┐     │
│  │  - 相关代码放在一起                                     │     │
│  │  - 易于阅读和维护                                       │     │
│  │  - 减少滚动查找                                         │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  3. 更好的 TypeScript 支持                                       │
│     ┌─────────────────────────────────────────────────────┐     │
│  │  - 完整的类型推断                                       │     │
│  │  - 类型安全                                             │     │
│  │  - IDE 支持                                             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  4. 更小的打包体积                                               │
│     ┌─────────────────────────────────────────────────────┐     │
│  │  - Tree-shaking 支持                                    │     │
│  │  - 只引入使用的 API                                     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**逻辑复用示例**：

```javascript
// Vue 2 - Mixin 方式（有问题）
const mouseMixin = {
  data() {
    return {
      x: 0,
      y: 0
    };
  },
  mounted() {
    window.addEventListener('mousemove', this.handleMouseMove);
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
  },
  methods: {
    handleMouseMove(e) {
      this.x = e.clientX;
      this.y = e.clientY;
    }
  }
};

export default {
  mixins: [mouseMixin]
  // 问题：
  // 1. 来源不明确
  // 2. 命名冲突
  // 3. 隐式依赖
};

// Vue 3 - Composables 方式（更好）
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0);
  const y = ref(0);

  function update(e) {
    x.value = e.clientX;
    y.value = e.clientY;
  }

  onMounted(() => {
    window.addEventListener('mousemove', update);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });

  return { x, y };
}

// 使用
import { useMouse } from './composables/useMouse';

export default {
  setup() {
    const { x, y } = useMouse();
    return { x, y };
  }
};
```

**组合多个 Composables**：

```javascript
// 组合多个 composables
import { useMouse } from './composables/useMouse';
import { useLocalStorage } from './composables/useLocalStorage';
import { useFetch } from './composables/useFetch';

export default {
  setup() {
    // 组合多个 composables
    const { x, y } = useMouse();
    const theme = useLocalStorage('theme', 'dark');
    const { data, loading, error } = useFetch('/api/user');

    return {
      x,
      y,
      theme,
      data,
      loading,
      error
    };
  }
};
```

---

## 九、Vue 生态工具

### 9.1 Vite 使用

**参考答案：**

```javascript
// Vite 项目创建
npm create vite@latest my-vue-app -- --template vue

// Vite 配置
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
});
```

### 9.1.1 Vite 深入理解

**Vite 原理**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vite 工作原理                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  开发环境 (ESM + Native ESM)                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. 浏览器直接请求模块                                    │   │
│  │  2. Vite 拦截请求                                        │   │
│  │  3. 按需编译返回                                         │   │
│  │  4. 浏览器加载模块                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  生产环境 (Rollup)                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. 构建时打包                                            │   │
│  │  2. 代码分割                                              │   │
│  │  3. 压缩优化                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  优势：                                                          │
│  - 启动快（无需打包）                                            │
│  - 热更新快（基于 ESM）                                         │
│  - 生产优化（Rollup）                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Vite 配置详解**：

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// 环境变量
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://cdn.example.com'
  : '/api';

export default defineConfig({
  // Vue 插件
  plugins: [vue()],

  // 基础路径
  base: '/',

  // 全局变量
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __API_BASE_URL__: JSON.stringify(baseUrl)
  },

  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },

  // CSS 配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },

  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils': ['lodash', 'axios']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },

  // 依赖优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
    exclude: ['vue-demi']
  }
});
```

**Vite 插件**：

```javascript
// 自定义 Vite 插件
export function myPlugin() {
  return {
    name: 'my-plugin',

    // 解析 ID
    resolveId(id) {
      if (id === 'virtual:my-plugin') {
        return id;
      }
    },

    // 加载模块
    load(id) {
      if (id === 'virtual:my-plugin') {
        return `export const message = 'Hello from plugin';`;
      }
    },

    // 转换代码
    transform(code, id) {
      if (id.endsWith('.vue')) {
        // 添加代码
        return code + '\nconsole.log("transformed");';
      }
    },

    // 生成资源
    generateBundle(options, bundle) {
      // 自定义 bundle
    }
  };
}

// 使用插件
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { myPlugin } from './plugins/myPlugin';

export default defineConfig({
  plugins: [vue(), myPlugin()]
});
```

---

### 9.2 VueUse 工具库

**参考答案：**

```javascript
import {
  useMouse,
  useWindowSize,
  useLocalStorage,
  useDebounceFn,
  useFetch
} from '@vueuse/core';

// 鼠标位置
const { x, y } = useMouse();

// 窗口尺寸
const { width, height } = useWindowSize();

// 本地存储
const storage = useLocalStorage('my-key', { name: 'Tom' });

// 防抖
const debouncedFn = useDebounceFn(() => {
  console.log('debounced');
}, 500);

// 数据请求
const { data, loading, error } = useFetch('/api/user');
```

### 9.2.1 VueUse 常用函数

**响应式工具**：

```javascript
import {
  useRef,
  useComputed,
  useWatch,
  useTransition,
  useTransitionState
} from '@vueuse/core';

// useRef - 创建 ref
const count = useRef(0);
// 自动解包
count.value++;

// useComputed - 创建计算属性
const doubled = useComputed(() => count.value * 2);

// useWatch - 监听
useWatch(count, (newVal) => {
  console.log('count changed:', newVal);
});
```

**DOM 工具**：

```javascript
import {
  useElementSize,
  useElementHover,
  useElementBounding,
  useClipboard,
  useFullscreen,
  useMediaQuery
} from '@vueuse/core';

// 元素尺寸
const { width, height } = useElementSize(ref);

// 元素悬停
const isHovered = useElementHover(el);

// 元素边界
const { top, right, bottom, left } = useElementBounding(el);

// 剪贴板
const { copy, pasted } = useClipboard();

// 全屏
const { isSupported, isFullscreen, toggle } = useFullscreen();

// 媒体查询
const isMobile = useMediaQuery('(max-width: 768px)');
```

**异步工具**：

```javascript
import {
  useAsync,
  useAxios,
  useFetch,
  useTimeout,
  useInterval,
  useNow,
  useDebounceFn,
  useThrottleFn
} from '@vueuse/core';

// useFetch
const { data, isFinished } = useFetch('/api/data');

// useTimeout
const { ready, start, stop } = useTimeout(2000, { controls: true });

// useInterval
const { counter, pause, resume } = useInterval(1000);

// useNow - 当前时间
const now = useNow();
const formatted = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss');

// 防抖函数
const debouncedFn = useDebounceFn(() => {
  console.log('debounced');
}, 300);

// 节流函数
const throttledFn = useThrottleFn(() => {
  console.log('throttled');
}, 300);
```

**传感器工具**：

```javascript
import {
  useGeolocation,
  useDeviceMotion,
  useDeviceOrientation,
  useBattery,
  useNetwork,
  useOnline
} from '@vueuse/core';

// 地理位置
const { coordinates, error, resume, pause } = useGeolocation();

// 设备运动
const { acceleration, rotationRate, interval } = useDeviceMotion();

// 电池状态
const { charging, level, chargingTime, dischargingTime } = useBattery();

// 网络状态
const { isOnline, downlink, effectiveType, saveData } = useNetwork();

// 在线状态
const isOnline = useOnline();
```

---

## 十、高级面试题

### 10.1 Vue 组件设计模式

**函数式组件**：

```javascript
// 函数式组件 - 无状态
const FunctionalComponent = (props, context) => {
  return h('div', { class: 'functional' }, props.message);
};

FunctionalComponent.props = {
  message: String
};

// 使用
<FunctionalComponent message="Hello" />;
```

**高阶组件**：

```javascript
// withLoading 高阶组件
function withLoading(Component) {
  return {
    data() {
      return {
        isLoading: false
      };
    },
    methods: {
      async loadData() {
        this.isLoading = true;
        try {
          await this.$refs.target.load();
        } finally {
          this.isLoading = false;
        }
      }
    },
    template: `
      <div>
        <div v-if="isLoading" class="loading">Loading...</div>
        <Component ref="target" v-bind="$attrs" />
      </div>
    `
  };
}

// 使用
const EnhancedComponent = withLoading(DataComponent);
```

**Render Props**：

```javascript
// MouseTracker 组件
export default {
  data() {
    return { x: 0, y: 0 };
  },
  methods: {
    handleMouseMove(e) {
      this.x = e.clientX;
      this.y = e.clientY;
    }
  },
  template: `
    <div @mousemove="handleMouseMove">
      <slot :x="x" :y="y" />
    </div>
  `;
};

// 使用
<MouseTracker v-slot="{ x, y }">
  <p>Mouse position: {{ x }}, {{ y }}</p>
</MouseTracker>
```

### 10.2 Vue 状态管理最佳实践

**Store 设计模式**：

```javascript
// 模块化 Store
// stores/user.js
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null);
  const token = ref(null);
  const preferences = ref({});

  // Getter
  const isLoggedIn = computed(() => !!token.value);
  const username = computed(() => user.value?.name);

  // Actions
  async function login(credentials) {
    const response = await api.login(credentials);
    token.value = response.token;
    user.value = response.user;
    await loadPreferences();
  }

  async function loadPreferences() {
    const prefs = await api.getPreferences();
    preferences.value = prefs;
  }

  function logout() {
    token.value = null;
    user.value = null;
  }

  return {
    user,
    token,
    preferences,
    isLoggedIn,
    username,
    login,
    logout,
    loadPreferences
  };
});

// stores/cart.js
export const useCartStore = defineStore('cart', () => {
  const items = ref([]);
  const loading = ref(false);

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  async function addItem(product, quantity = 1) {
    const existing = items.value.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ ...product, quantity });
    }
  }

  function removeItem(productId) {
    const index = items.value.findIndex(i => i.id === productId);
    if (index > -1) {
      items.value.splice(index, 1);
    }
  }

  async function checkout() {
    loading.value = true;
    try {
      await api.checkout(items.value);
      items.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    totalPrice,
    itemCount,
    addItem,
    removeItem,
    checkout
  };
});
```

### 10.3 Vue 性能调优实战

**大型列表优化**：

```javascript
// 使用虚拟滚动
// vue-virtual-scroller
<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="item">
      {{ item.name }}
    </div>
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
})));
</script>

<style scoped>
.scroller {
  height: 500px;
}

.item {
  height: 50px;
}
</style>
```

**图片懒加载**：

```javascript
// 使用 v-lazy
<template>
  <img v-lazy="imageSrc" />
</template>

<script setup>
const imageSrc = ref('https://example.com/image.jpg');
</script>

// 自定义指令
const lazy = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value;
          observer.unobserve(el);
        }
      });
    });

    observer.observe(el);
  }
};
```

**大数据表格优化**：

```javascript
// 使用表格虚拟滚动
<template>
  <div class="table-container">
    <div class="table-header">
      <div class="th" v-for="col in columns" :key="col.key">
        {{ col.label }}
      </div>
    </div>
    <div class="table-body" :style="{ height: tableHeight + 'px' }">
      <div
        class="table-row-wrapper"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="row in visibleRows"
          :key="row.id"
          class="table-row"
        >
          <div class="td" v-for="col in columns" :key="col.key">
            {{ row[col.key] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: Array,
  columns: Array,
  itemHeight: 40,
  tableHeight: 400
});

const scrollTop = ref(0);

const offsetY = computed(() => {
  const startIndex = Math.floor(scrollTop.value / props.itemHeight);
  return startIndex * props.itemHeight;
});

const visibleRows = computed(() => {
  const startIndex = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(props.tableHeight / props.itemHeight) + 2;
  return props.data.slice(startIndex, startIndex + visibleCount);
});

function onScroll(e) {
  scrollTop.value = e.target.scrollTop;
}
</script>
```

### 10.4 Vue 单元测试

**组件测试**：

```javascript
// Counter.spec.js
import { mount } from '@vue/test-utils';
import Counter from './Counter.vue';

describe('Counter', () => {
  it('renders correctly', () => {
    const wrapper = mount(Counter);
    expect(wrapper.text()).toContain('Count: 0');
  });

  it('increments count', async () => {
    const wrapper = mount(Counter);

    await wrapper.find('button.increment').trigger('click');

    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.text()).toContain('Count: 1');
  });

  it('emits increment event', async () => {
    const wrapper = mount(Counter);

    await wrapper.find('button.increment').trigger('click');

    expect(wrapper.emitted('increment')).toBeTruthy();
    expect(wrapper.emitted('increment')[0]).toEqual([1]);
  });
});

// 使用 Vue Test Utils
import { createTestingPinia } from '@pinia/testing';

describe('Store', () => {
  it('uses store', () => {
    const wrapper = mount(Component, {
      global: {
        plugins: [createTestingPinia()]
      }
    });

    const store = useStore();
    expect(store.count).toBe(0);
  });
});
```

### 10.5 Vue TypeScript 最佳实践

**类型定义**：

```javascript
// types/vue.d.ts
import 'vue';

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: typeof import('@/api').default;
    $store: typeof import('@/store').default;
  }

  interface ComponentCustomOptions {
    beforeRouteEnter?(to: Route, from: Route, next: (to?: any) => void): void;
  }
}

// types/component.d.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Props {
  user: User;
  isLoading?: boolean;
}

// 使用
import type { PropType } from 'vue';

defineProps({
  user: {
    type: Object as PropType<User>,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});
```

---

## 十一、实战项目结构

### 11.1 目录结构最佳实践

```
src/
├── assets/                 # 静态资源
│   ├── images/
│   ├── styles/
│   └── fonts/
├── components/             # 公共组件
│   ├── common/
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Modal.vue
│   └── business/
│       ├── UserCard.vue
│       └── ProductCard.vue
├── composables/            # 组合式函数
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useMouse.ts
├── directives/             # 自定义指令
│   ├── v-permission.ts
│   └── v-lazy.ts
├── hooks/                  # 生命周期钩子
├── layouts/                # 布局组件
│   ├── Default.vue
│   └── Admin.vue
├── router/                 # 路由配置
│   ├── index.ts
│   ├── routes.ts
│   └── guards.ts
├── services/               # API 服务
│   ├── api.ts
│   ├── user.ts
│   └── product.ts
├── stores/                 # 状态管理
│   ├── user.ts
│   ├── cart.ts
│   └── index.ts
├── types/                  # TypeScript 类型
│   ├── user.d.ts
│   └── product.d.ts
├── utils/                  # 工具函数
│   ├── format.ts
│   ├── validate.ts
│   └── request.ts
├── views/                  # 页面组件
│   ├── Home.vue
│   ├── About.vue
│   └── user/
│       ├── UserList.vue
│       └── UserDetail.vue
├── App.vue
└── main.ts
```

### 11.2 项目配置示例

**ESLint 配置**：

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
```

**Prettier 配置**：

```javascript
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "none",
  "arrowParens": "always"
}
```

---

> 资料整理自 2025 字节跳动、阿里巴巴、拼多多面试
