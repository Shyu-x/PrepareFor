# 第2卷-框架生态

---

## 第2章 Vue框架

---

### 1.1 Vue3响应式系统深度拆解

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    Vue 3 响应式原理                              ┃
┃                                                                  ┃
┃  1. 初始化 (Proxy)                                              ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃ 
┃  ┃  reactive(obj) ━━▶ new Proxy(obj, handlers)           ┃   ┃    
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┃    
┃                              ┃                                 ┃  
┃                              ▼                                 ┃  
┃  2. 依赖收集 (Track)                                           ┃  
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃ 
┃  ┃  get: activeEffect 存入 targetMap                       ┃   ┃  
┃  ┃  targetMap (WeakMap)                                    ┃   ┃  
┃  ┃    ┗━ depsMap (Map)                                    ┃   ┃   
┃  ┃         ┗━ dep (Set)                                    ┃   ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┃    
┃                              ┃                                 ┃  
┃                              ▼                                 ┃  
┃  3. 触发更新 (Trigger)                                         ┃  
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃ 
┃  ┃  set: 找到对应的 dep，执行所有 effect                   ┃   ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┃    
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                         Vue 3 响应式系统架构                              ┃
┃                                                                          ┃ 
┃  ┏━━━━━━━━━━━━━┓      ┏━━━━━━━━━━━━━┓      ┏━━━━━━━━━━━━━┓             ┃   
┃  ┃   组件渲染   ┃ ━━▶  ┃   依赖收集   ┃ ━━▶  ┃   触发更新   ┃             ┃
┃  ┗━━━━━━━━━━━━━┛      ┗━━━━━━━━━━━━━┛      ┗━━━━━━━━━━━━━┛             ┃   
┃        ┃                    ┃                    ┃                     ┃   
┃        ▼                    ▼                    ▼                     ┃   
┃  ┏━━━━━━━━━━━━━┓      ┏━━━━━━━━━━━━━┓      ┏━━━━━━━━━━━━━┓             ┃   
┃  ┃   Proxy     ┃      ┃   targetMap ┃      ┃   effects   ┃             ┃   
┃  ┃  拦截读写    ┃      ┃   依赖存储   ┃      ┃   副作用队列 ┃             ┃
┃  ┗━━━━━━━━━━━━━┛      ┗━━━━━━━━━━━━━┛      ┗━━━━━━━━━━━━━┛             ┃   
┃                                                                          ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

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

