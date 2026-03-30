# 第2卷-框架生态

---

## 第2章 Vue框架

---

### 2.1 CompositionAPI

#### 2.1.1 setup函数

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

#### 2.1.1 setup函数详解

**setup 函数的执行时机**：

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    setup 执行时机                                 ┃
┃                                                                  ┃ 
┃  new Vue()                                                       ┃ 
┃       ┃                                                          ┃ 
┃       ▼                                                          ┃ 
┃  beforeCreate ━━▶ setup() ◀━━ 在这里执行                        ┃  
┃       ┃                                                          ┃ 
┃       ▼                                                          ┃ 
┃  created                                                         ┃ 
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

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

#### 2.1.2 setup中返回数据的方式

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

#### 2.2 生命周期钩子

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    Vue 3 生命周期                               ┃ 
┃                                                                  ┃
┃  创建阶段                                                       ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓┃ 
┃  ┃  setup()                                                    ┃┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛┃ 
┃                              ┃                                  ┃ 
┃                              ▼                                  ┃ 
┃  挂载阶段                                                       ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓┃ 
┃  ┃  onBeforeMount ━━▶ onMounted                               ┃┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛┃ 
┃                              ┃                                  ┃ 
┃                              ▼                                  ┃ 
┃  更新阶段                                                       ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓┃ 
┃  ┃  onBeforeUpdate ━━▶ onUpdated                              ┃┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛┃ 
┃                              ┃                                  ┃ 
┃                              ▼                                  ┃ 
┃  卸载阶段                                                       ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓┃ 
┃  ┃  onBeforeUnmount ━━▶ onUnmounted                           ┃┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛┃ 
┃                                                                  ┃
┃  Vue 2 vs Vue 3                                                ┃  
┃  beforeCreate  ━━▶ setup()                                      ┃ 
┃  created       ━━▶ setup()                                      ┃ 
┃  beforeMount   ━━▶ onBeforeMount                                ┃ 
┃  mounted       ━━▶ onMounted                                    ┃ 
┃  beforeUpdate  ━━▶ onBeforeUpdate                               ┃ 
┃  updated       ━━▶ onUpdated                                     ┃
┃  beforeDestroy ━━▶ onBeforeUnmount                              ┃ 
┃  destroyed    ━━▶ onUnmounted                                  ┃  
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

#### 2.2.1 生命周期钩子详解

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    Pinia vs Vuex                                ┃   
┃                                                                  ┃  
┃  Pinia 优势：                                                   ┃   
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃    
┃  ┃  1. 更简洁的 API                                          ┃   ┃  
┃  ┃     - 不需要 mutations                                     ┃   ┃ 
┃  ┃     - 自动类型推断                                         ┃   ┃ 
┃  ┃                                                             ┃   ┃
┃  ┃  2. 支持 Composition API                                   ┃   ┃ 
┃  ┃     - 可以使用 ref/reactive                                ┃   ┃ 
┃  ┃     - 更好的 TypeScript 支持                               ┃   ┃ 
┃  ┃                                                             ┃   ┃
┃  ┃  3. 模块化更简单                                            ┃   ┃
┃  ┃     - 每个 store 都是独立的                                 ┃   ┃
┃  ┃     - 不需要嵌套模块                                        ┃   ┃
┃  ┃                                                             ┃   ┃
┃  ┃  4. 无需手动刷新                                            ┃   ┃
┃  ┃     - 热更新时保持状态                                      ┃   ┃
┃  ┃                                                             ┃   ┃
┃  ┃  5. 更好的调试                                              ┃   ┃
┃  ┃     - 支持 Vue Devtools                                    ┃   ┃ 
┃  ┃                                                             ┃   ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┃    
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    Suspense 工作流程                             ┃
┃                                                                  ┃
┃  1. 初始渲染                                                     ┃
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃ 
┃  ┃  Suspense 显示 #fallback                                  ┃  ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    
┃                              ┃                                  ┃ 
┃                              ▼                                  ┃ 
┃  2. 异步依赖加载                                                ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃ 
┃  ┃  - 异步组件                                               ┃  ┃ 
┃  ┃  - async setup()                                         ┃  ┃  
┃  ┃  - 异步组件的顶层 await                                  ┃  ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    
┃                              ┃                                  ┃ 
┃                              ▼                                  ┃ 
┃  3. 渲染完成                                                    ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃ 
┃  ┃  Suspense 显示 #default                                  ┃  ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    异步组件优势                                   ┃
┃                                                                  ┃ 
┃  1. 代码分割                                                     ┃ 
┃     - 将不首屏渲染的代码分割成独立 chunk                        ┃  
┃     - 减少首屏加载时间                                           ┃ 
┃                                                                  ┃ 
┃  2. 按需加载                                                     ┃ 
┃     - 只有需要时才加载组件                                       ┃ 
┃     - 节省带宽和内存                                             ┃ 
┃                                                                  ┃ 
┃  3. 并行加载                                                     ┃ 
┃     - 多个异步组件可以并行加载                                  ┃  
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

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
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    路由守卫执行顺序                                ┃
┃                                                                  ┃  
┃  1. 导航触发                                                     ┃  
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  2. beforeRouteLeave (组件内)                                    ┃  
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  3. beforeEach (全局)                                           ┃   
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  4. beforeRouteUpdate (组件内)                                  ┃   
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  5. beforeEnter (路由独享)                                      ┃   
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  6. 解析异步路由组件                                             ┃  
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  7. beforeRouteEnter (组件内 - before)                          ┃   
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  8. 更新 DOM                                                     ┃  
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  9. afterEach (全局)                                            ┃   
┃       ┃                                                          ┃  
┃       ▼                                                          ┃  
┃  10. beforeRouteEnter (组件内 - next(vm))                       ┃   
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

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

