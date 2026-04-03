# Vue3与React19对比完全指南

## 前言

2026年，前端框架生态已经进入了一个全新的时代。Vue3经过四年多的发展，已经成为成熟稳定的选择；而React19携带着Server Components、Actions等革命性特性正式登场，彻底改变了React应用的开发范式。作为全栈开发者，理解这两个主流框架的差异不仅是面试必备，更是项目技术选型的关键依据。

本指南将从响应式原理、组件模型、状态管理、性能对比、开发体验等多个维度，对Vue3和React19进行全方位、深层次的对比分析。我们不仅会探讨表面的API差异，更会深入剖析两者背后的设计哲学和架构思维，帮助读者在更高的视角理解框架选择的本质。

---

## 一、框架概览与设计哲学

### 1.1 Vue3新特性全面解析

Vue3是Evan You主导的Vue.js框架的全新major版本，于2020年9月正式发布，经过四年多的打磨，已经被广泛应用于企业级开发中。Vue3的核心设计目标是在保持Vue核心哲学（渐进式、易学易用）的同时，解决Vue2在大型应用中遇到的架构性挑战。

#### Composition API：组合式API的革命

Vue3引入的Composition API是自Vue诞生以来最重大的架构变革。在Vue2中，我们使用选项式API（Options API）来组织组件逻辑：data选项存放响应式数据，methods选项存放方法，computed存放计算属性，watch存放侦听器。这种方式在小规模组件中清晰直观，但随着组件复杂度增加，相关逻辑可能被拆散到多个选项中，导致维护困难，这就是所谓的"逻辑组织困境"。

```typescript
// Vue2 选项式API - 逻辑分散示例
export default {
  data() {
    return {
      // 用户相关数据
      user: null,
      userLoading: false,

      // 文档相关数据
      documents: [],
      currentDoc: null,

      // 评论相关数据
      comments: [],
      commentLoading: false,
    };
  },

  methods: {
    // 用户相关方法
    async fetchUser() { /* ... */ },

    // 文档相关方法
    async fetchDocuments() { /* ... */ },
    async updateDocument() { /* ... */ },

    // 评论相关方法
    async fetchComments() { /* ... */ },
    async addComment() { /* ... */ },
  },

  watch: {
    // 分散的watcher
    user: { handler: 'fetchDocuments' },
    currentDoc: { handler: 'fetchComments' },
  },

  computed: {
    // 分散的计算属性
    filteredDocuments() { /* ... */ },
    sortedComments() { /* ... */ },
  },
};
```

Composition API通过`setup()`函数和一系列新Hook（如`ref`、`reactive`、`computed`、`watch`等）来解决这个问题。开发者可以将相关的逻辑组织到同一个函数中，形成"组合式函数"（Composables），实现真正的关注点分离。

```typescript
// Vue3 组合式API - 逻辑内聚示例
// composables/useUser.ts - 用户相关逻辑组合
import { ref, computed } from 'vue';

export function useUser() {
  const user = ref(null);
  const userLoading = ref(false);
  const isLoggedIn = computed(() => user.value !== null);

  async function fetchUser(userId: string) {
    userLoading.value = true;
    try {
      const response = await fetch(`/api/users/${userId}`);
      user.value = await response.json();
    } finally {
      userLoading.value = false;
    }
  }

  return { user, userLoading, isLoggedIn, fetchUser };
}

// composables/useDocuments.ts - 文档相关逻辑组合
import { ref, computed } from 'vue';

export function useDocuments(user: Ref<User | null>) {
  const documents = ref<Document[]>([]);
  const currentDoc = ref<Document | null>(null);

  // 自动监听user变化，当user变化时重新获取文档
  watch(user, async () => {
    if (user.value) {
      documents.value = await fetchDocumentsByUser(user.value.id);
    }
  });

  const filteredDocuments = computed(() =>
    documents.value.filter(doc => doc.isPublished)
  );

  return { documents, currentDoc, filteredDocuments };
}

// 组件中使用：逻辑清晰、功能内聚
export default {
  setup() {
    // 每个组合式函数管理自己的状态和方法
    const { user, userLoading, isLoggedIn, fetchUser } = useUser();
    const { documents, currentDoc, filteredDocuments } = useDocuments(user);
    const { comments, fetchComments, addComment } = useComments(currentDoc);

    return {
      user, userLoading, isLoggedIn,
      documents, currentDoc, filteredDocuments,
      comments,
    };
  },
};
```

这种设计带来了几个关键优势：第一，逻辑复用变得极为简单，多个组件可以共享同一个组合式函数；第二，相关逻辑一目了然，代码可读性大幅提升；第三，TypeScript支持更加自然，类型推断更加准确。

#### Script Setup：编译时语法糖

`<script setup>`是Vue3.2引入的编译时语法糖，进一步简化了组件编写方式。在`<script setup>`中，顶层代码直接在setup函数作用域内执行，无需显式返回所有需要暴露给模板的变量和方法。

```vue
<!-- UserProfile.vue -->
<script setup lang="ts">
// 引入的组件无需注册，直接使用
import { ref, computed, onMounted } from 'vue';
import UserAvatar from './UserAvatar.vue';
import UserStats from './UserStats.vue';

// 响应式状态 - 直接创建即可
const name = ref('张三');
const age = ref(28);
const loading = ref(false);

// 计算属性 - 直接定义即可
const displayName = computed(() => `${name.value} (${age.value}岁)`);

// 方法 - 直接定义即可
function updateUser() {
  loading.value = true;
  fetchUserApi().then(user => {
    name.value = user.name;
    age.value = user.age;
  }).finally(() => {
    loading.value = false;
  });
}

// 生命周期钩子 - 直接使用
onMounted(() => {
  loadUserData();
});

// defineProps 和 defineEmits - 编译器宏，无需导入
const props = defineProps<{
  userId: string;
  showDetails?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', user: User): void;
  (e: 'delete', userId: string): void;
}>();

// 暴露给父组件的属性和方法
defineExpose({
  updateUser,
  reset: () => {
    name.value = '';
    age.value = 0;
  },
});
</script>

<template>
  <div class="user-profile">
    <UserAvatar :name="name" />
    <h2>{{ displayName }}</h2>
    <UserStats v-if="props.showDetails" :user="{ name, age }" />
    <button @click="updateUser" :disabled="loading">
      {{ loading ? '加载中...' : '更新资料' }}
    </button>
  </div>
</template>
```

编译器会将`<script setup>`中的代码转换成标准的`setup()`函数形式。这意味着我们写的是声明式语法，但运行的是高效的标准代码。`<script setup>`还带来了显著的性能提升：由于编译器可以静态分析模板中使用的变量，未使用的变量会被tree-shaking掉。

#### Suspense：优雅的异步组件处理

Vue3的Suspense组件为异步组件提供了原生的等待解决方案。在Suspense出现之前，处理异步组件需要使用`v-if`配合`isLoading`状态，或者使用`<keep-alive>`配合`activated`钩子。Suspense让这个过程变得声明式且简洁。

```vue
<!-- AsyncUserProfile.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

// 方式一：异步import，自动创建异步组件
const UserProfile = defineAsyncComponent(() => import('./UserProfile.vue'));

// 方式二：带加载控制的高级异步组件
const UserProfileAdvanced = defineAsyncComponent({
  // 异步加载函数
  loader: async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await import('./UserProfile.vue');
  },

  // 加载过程中显示的组件
  loadingComponent: LoadingSpinner,

  // 加载失败显示的组件
  errorComponent: ErrorBoundary,

  // 加载延迟，默认200ms，防止闪烁
  delay: 200,

  // 超时时间
  timeout: 3000,
});
</script>

<template>
  <div class="profile-container">
    <!-- Suspense 处理异步组件的加载状态 -->
    <Suspense>
      <!-- 主要内容：异步组件 -->
      <template #default>
        <UserProfile user-id="123" />
      </template>

      <!-- 加载中显示的内容 -->
      <template #fallback>
        <div class="loading">
          <LoadingSpinner />
          <p>正在加载用户资料...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

Suspense的工作原理依赖于Vue的异步组件加载机制和模板中的两个插槽：`#default`插槽包含异步组件本身，`#fallback`插槽包含加载完成前显示的内容。Vue会在异步组件解析完成前显示fallback内容，解析完成后自动切换到default内容。

#### Vue3的其他重要特性

**Teleport（传送门）**：允许将子组件渲染到DOM树的任意位置，非常适合实现模态框、全局通知等需要突破组件层级的UI。

```vue
<template>
  <button @click="showModal = true">打开模态框</button>

  <!-- Teleport 将模态框传送到 body 位置 -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>模态框标题</h3>
        <p>这是一个通过 Teleport 传送到 body 的模态框</p>
        <button @click="showModal = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>
```

**Fragments（片段）**：Vue3允许组件有多个根节点，结束了Vue2中必须有一个根元素的烦恼。

```vue
<!-- Vue3 多根节点组件 -->
<template>
  <!-- 无需包装元素 -->
  <header>导航栏</header>
  <main>主内容</main>
  <footer>页脚</footer>
</template>
```

**更好的TypeScript支持**：Vue3从设计之初就考虑了TypeScript的支持，整个源码使用TypeScript重写，配合`defineProps`、`defineEmits`、`defineExpose`等编译器宏，类型推断既准确又方便。

### 1.2 React19新特性全面解析

React19是React生态史上最具颠覆性的版本之一。它不仅带来了性能优化，更从根本上重新思考了React应用的架构模式。React19的核心设计理念是"让开发者更专注于应用逻辑，而不是样板代码"。

#### Server Components：服务端组件的革命

React19最引人注目的特性是Server Components（服务端组件）。在传统的React应用中，所有组件都在客户端执行，即使用户看到的内容是静态的，浏览器也需要下载、解析、执行JavaScript才能渲染。Server Components打破了这一范式，允许组件在服务端执行并直接发送HTML给客户端。

```tsx
// app/users/page.tsx - Next.js App Router中的服务端组件
import { db } from '@/lib/database';

// 这是一个服务端组件 - 直接访问数据库，无需API
async function UsersPage() {
  // 直接在服务端查询数据库
  const users = await db.query('SELECT * FROM users ORDER BY created_at DESC');

  return (
    <div className="users-page">
      <h1>用户列表</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <UserCard user={user} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// 客户端组件 - 处理交互
'use client';

import { useState } from 'react';

function UserCard({ user }: { user: User }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
      {/* 按钮有交互，需要客户端JavaScript */}
      <button onClick={() => setIsFollowing(!isFollowing)}>
        {isFollowing ? '取消关注' : '关注'}
      </button>
    </div>
  );
}
```

Server Components的工作原理是：服务端组件的代码永远不会发送到客户端，它们在服务器上执行，直接从数据源（数据库、文件系统）获取数据，生成HTML后发送给浏览器。这意味着：

- **零客户端JavaScript**：服务端组件不增加bundle体积
- **直接数据获取**：不再需要useEffect + fetch的瀑布流
- **完整的服务端能力**：可以访问文件系统、数据库直连等
- **更好的SEO**：搜索引擎直接抓取到完整的HTML内容

服务端组件和客户端组件可以共存：通过`"use client"`声明的组件会在客户端执行，而没有声明的组件默认在服务端执行。服务端组件可以导入客户端组件，但客户端组件不能导入服务端组件（可以通过props传递服务端组件渲染的结果）。

#### Actions：表单处理的革新

React19引入了Actions，彻底改变了表单处理的方式。在React19之前，表单提交需要手动管理状态、处理loading状态、处理错误情况。Actions将这些样板代码全部消灭。

```tsx
// app/contact/page.tsx
import { action, useActionState, useFormStatus } from 'react';
import { redirect } from 'next/navigation';

// 服务端Action - 在服务端执行
async function submitContact(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  // 验证
  if (!name || !email || !message) {
    return { error: '所有字段都是必填的' };
  }

  // 提交到数据库
  await db.contact.create({
    data: { name, email, message }
  });

  // 重定向到成功页面
  redirect('/contact/success');
}

// 客户端组件 - 使用Action
function ContactForm() {
  // useActionState 管理Action的状态
  const [state, formAction, isPending] = useActionState(submitContact, null);

  if (state?.error) {
    return <ErrorMessage message={state.error} />;
  }

  return (
    <form action={formAction}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      <textarea name="message" placeholder="留言内容" required />

      <SubmitButton isPending={isPending} />
    </form>
  );
}

// 提交按钮组件 - 展示pending状态
function SubmitButton({ isPending }: { isPending: boolean }) {
  const { pending } = useFormStatus();
  const displayPending = isPending ?? pending;

  return (
    <button type="submit" disabled={displayPending}>
      {displayPending ? '提交中...' : '提交留言'}
    </button>
  );
}
```

Actions的核心优势在于：表单提交变成声明式的，开发者只需定义提交逻辑，React自动处理loading状态、错误处理、乐观更新等。`useActionState`会记住上一个action的返回值，自动传递给你，非常适合处理表单验证错误等场景。

#### use()：超越Hook限制的利器

React19引入的`use()`是一个革命性的API，它允许在组件中"消费"Promise或Context，打破了Hook必须在组件顶层调用的限制。

```tsx
import { use } from 'react';

// 消费Promise - 直接获取异步数据
function UserProfile({ userPromise }) {
  // use() 直接获取 Promise 的结果
  // 组件会suspend直到Promise resolve
  const user = use(userPromise);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 消费Context - 不需要Provider包裹
function ThemedButton() {
  // use() 可以直接在组件中使用Context
  // 而不需要 useContext() 的必须在组件顶层调用的限制
  const theme = use(ThemeContext);

  return (
    <button className={theme.button}>
      按钮
    </button>
  );
}

// 组合使用：带缓存的Promise消费
function RecommendedUsers({ userId }) {
  // use() 会记住已解析的Promise
  // 多次调用不会导致重复请求
  const recommendations = use(
    fetch(`/api/users/${userId}/recommendations`).then(r => r.json())
  );

  return (
    <ul>
      {recommendations.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

`use()`的核心价值在于它的灵活性：它可以在条件语句、循环中使用，而传统的Hook必须在组件顶层调用。这为代码组织带来了更大的自由度。同时，`use()`在Promise场景下会自动处理spending状态，配合`<Suspense>`可以优雅地处理异步加载。

#### useOptimistic：乐观更新的简化和`useTransition`的进阶

React19大幅改进了`useOptimistic`，使其成为乐观更新的首选方案：

```tsx
import { useOptimistic, useState, useTransition } from 'react';

function CommentsSection({ comments, postId }) {
  const [commentsList, setCommentsList] = useState(comments);

  // useOptimistic 专门用于乐观更新
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    commentsList,
    // reducer：如何根据action更新乐观状态
    (currentComments, newComment) => [
      ...currentComments,
      { ...newComment, pending: true }
    ]
  );

  async function submitComment(formData: FormData) {
    const comment = {
      id: crypto.randomUUID(),
      text: formData.get('comment'),
      author: '当前用户',
      createdAt: new Date().toISOString(),
    };

    // 立即更新UI（乐观更新）
    addOptimisticComment(comment);

    // 发送到服务器
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      // 如果失败，React会自动回滚
      throw new Error('评论提交失败');
    }
  }

  return (
    <div>
      {optimisticComments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
      <CommentForm action={submitComment} />
    </div>
  );
}
```

`useOptimistic`会自动处理状态同步：当action开始时，乐观状态立即更新；当action完成时，React自动用实际结果替换乐观状态；如果action失败，React自动回滚。这种模式特别适合评论、点赞、编辑等需要即时反馈的场景。

### 1.3 两者设计哲学对比

Vue3和React19虽然都是组件化UI框架，但它们的核心理念存在根本性差异，这些差异决定了它们各自的适用场景。

**响应式设计哲学**：Vue选择了"响应式驱动"的思路，通过Proxy代理对象自动追踪依赖，开发者编写的是声明式的响应式代码，框架自动管理数据变化。React选择了"状态驱动渲染"的思路，状态变化触发整个组件树重新渲染，通过虚拟DOM的diff算法计算最小更新。Vue的响应式更加"魔法"，上手即用但原理隐晦；React的方式更加显式，原理清晰但需要更多手动优化。

**组件设计哲学**：Vue强调"渐进式增强"，组件既可以是简单的数据展示，也可以是复杂的交互单元，`<script setup>`语法让组件代码极度简洁。React强调"纯函数哲学"，组件是输入props输出UI的函数，useEffect等Hook让副作用管理变得显式可追踪。

**生态整合哲学**：Vue的官方团队提供了完整的官方解决方案（Vue Router、Pinia、Vue I18n等），这些工具与Vue核心深度整合，版本同步更新。React的生态更加分散，React Router、状态管理方案等都是社区提供，虽然灵活但需要开发者自己做技术选型。

**版本演进哲学**：Vue3是一次性架构升级，通过Composition API、Script Setup等特性从根本上改变了开发方式。React19则是渐进式演进，通过Server Components、Actions等特性逐步扩展能力边界，同时保持向后兼容。

### 1.4 团队与生态背景

Vue.js由Evan You创建，核心团队分布在世界各地，主要由中国开发者贡献者组成。Vue在中国拥有极大的影响力，被阿里巴巴、字节跳动、滴滴等大厂广泛使用。Vue的文档质量享誉业界，被公认为最易入门的前端框架之一。Vue3的生态已经相当成熟，Nuxt3（Vue的Meta-framework）、Vitest（Vue官方推荐的测试工具）、Volar（Vue官方VSCode插件）等工具构成了完整的开发生态。

React由Facebook（现Meta）创建并维护，核心团队实力雄厚，版本迭代稳定。React的生态极其庞大，NPM上有超过100万个React包，几乎任何你能想到的功能都有现成解决方案。React的社区非常活跃，Conf大会、React.dev文档等都是优质的学习资源。React的跨端方案（React Native）也是其重要优势。

---

## 二、响应式原理对比

### 2.1 Vue3响应式系统深度解析

Vue3的响应式系统是其最具特色的核心能力，也是Vue与React最本质的区别所在。Vue3使用JavaScript的Proxy特性，在数据对象外层创建代理，通过拦截对象操作来实现响应式追踪。

#### Proxy响应式原理解析

Vue3的响应式系统基于ES6的Proxy实现。Proxy可以拦截对象的基本操作（get、set、deleteProperty、has等），Vue3正是利用这些拦截器来实现依赖追踪。

```typescript
// Vue3 响应式系统的简化实现
function reactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    // 拦截读取操作
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);

      // 如果读取的是对象，递归创建响应式
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }

      // 依赖收集：记录当前活跃的effect
      track(target, key);

      return result;
    },

    // 拦截写入操作
    set(target, key, value, receiver) {
      const oldValue = target[key];

      // 设置新值
      const result = Reflect.set(target, key, value, receiver);

      // 只有值真的发生变化才触发更新
      if (oldValue !== value) {
        // 触发更新：通知所有依赖的effect
        trigger(target, key, value, oldValue);
      }

      return result;
    },

    // 拦截删除操作
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const result = Reflect.deleteProperty(target, key);

      if (result && hadKey) {
        // 触发删除相关的更新
        trigger(target, key, undefined, target[key]);
      }

      return result;
    },
  });
}

// 依赖追踪：effect存储区
const targetMap = new WeakMap<Object, Map<string, Set<ReactiveEffect>>>();
const activeEffect = null;

function track(target, key) {
  if (activeEffect) {
    // 获取target的依赖Map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }

    // 获取key的依赖Set
    let deps = depsMap.get(key);
    if (!deps) {
      deps = new Set();
      depsMap.set(key, deps);
    }

    // 记录依赖
    deps.add(activeEffect);
  }
}

function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (!deps) return;

  // 遍历所有依赖的effect并执行
  deps.forEach(effect => {
    effect.run();
  });
}
```

这套响应式系统的精妙之处在于：

- **自动依赖追踪**：当组件渲染时访问响应式数据，Vue自动记录这个组件依赖了哪些数据
- **精准更新**：当某个数据变化时，只通知依赖这个数据的组件更新，不相关组件不受影响
- **嵌套对象响应式**：访问嵌套对象时自动创建深层响应式，无需手动`Vue.set()`

#### ref与reactive：两种响应式创建方式

Vue3提供了两种创建响应式数据的方式：`ref`和`reactive`。

```typescript
import { ref, reactive, computed, watch } from 'vue';

// ref：用于基本类型，创建包含.value的响应式引用
const count = ref(0);
console.log(count.value); // 0
count.value++;
console.log(count.value); // 1

// ref自动解包：模板中访问ref变量时，Vue自动解包
// <template>{{ count }}</template> 等同于 {{ count.value }}

// ref用于对象：内部调用reactive
const user = ref({ name: '张三', age: 28 });
user.value.name = '李四'; // 响应式更新

// reactive：用于对象，创建深层响应式代理
const state = reactive({
  count: 0,
  user: { name: '张三' },
  items: [1, 2, 3],
});

state.count++;
state.user.name = '李四'; // 嵌套对象也是响应式的
state.items.push(4); // 数组操作也是响应式的

// computed：计算属性，基于响应式数据自动计算
const firstName = ref('张');
const lastName = ref('三');

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

console.log(fullName.value); // '张 三'
firstName.value = '李';
console.log(fullName.value); // '李 三'

// watch：侦听器，响应式数据变化时执行回调
watch(count, (newValue, oldValue) => {
  console.log(`count从${oldValue}变为${newValue}`);
}, { immediate: true });

// watchEffect：立即执行的侦听器
watchEffect(() => {
  // 回调函数中访问的响应式数据自动被追踪
  console.log(`count是${count.value}`);
});
```

#### computed与watch：计算属性与侦听器

Vue3的计算属性和侦听器提供了两种不同的数据变化处理模式。

```typescript
import { ref, computed, watch, watchEffect } from 'vue';

// 计算属性：适合派生数据，基于响应式数据自动计算
const basePrice = ref(100);
const taxRate = ref(0.13);
const discount = ref(0.1);

const finalPrice = computed(() => {
  // basePrice变化会自动重新计算
  // taxRate变化会自动重新计算
  // discount变化会自动重新计算
  const price = basePrice.value * (1 - discount.value);
  return price * (1 + taxRate.value);
});

// 计算属性可以包含复杂逻辑
const orderSummary = computed(() => {
  const items = cart.items;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate.value;
  const shipping = subtotal > 100 ? 0 : 10;

  return {
    itemCount,
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
  };
});

// 侦听器：适合执行副作用，响应数据变化时执行异步操作
const query = ref('');
const results = ref([]);

// watch：侦听单个数据源
watch(query, async (newQuery, oldQuery) => {
  if (!newQuery) {
    results.value = [];
    return;
  }

  // 防抖：等待用户停止输入1秒后才搜索
  const response = await fetch(`/api/search?q=${encodeURIComponent(newQuery)}`);
  results.value = await response.json();
}, {
  debounce: 1000, // 需要使用额外的库或配置
});

// watchEffect：侦听所有访问到的响应式数据
watchEffect(async () => {
  // 立即执行，访问query时自动建立依赖
  console.log(`开始搜索: ${query.value}`);

  if (query.value) {
    // 这里的fetchResults会自动追踪query.value变化
    const response = await fetch(`/api/search?q=${encodeURIComponent(query.value)}`);
    results.value = await response.json();
  }
});

// 侦听多个数据源
watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log(`姓名从${oldFirst} ${oldLast}变为${newFirst} ${newLast}`);
  updateFullName();
});
```

### 2.2 React响应式系统深度解析

React的响应式系统与Vue有本质区别。React使用"状态驱动渲染"的模型：状态变化触发组件重新渲染，React通过虚拟DOM的diff算法计算最小变更。

#### State与useState：状态管理的基石

```tsx
import { useState, useCallback, useMemo } from 'react';

// useState：React状态管理的基础Hook
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={() => setCount(c => c - 1)}>减少</button>
    </div>
  );
}

// 复杂状态：使用useState管理对象或数组
function UserProfile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      notifications: true,
    },
  });

  // 不可变更新：永远不直接修改状态
  const updateName = (newName: string) => {
    setUser(prev => ({
      ...prev,
      name: newName,
    }));
  };

  const updatePreference = (key: string, value: any) => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  return (
    <div>
      <input
        value={user.name}
        onChange={e => updateName(e.target.value)}
      />
      <button onClick={() => updatePreference('theme', 'dark')}>
        切换主题
      </button>
    </div>
  );
}

// 状态批量更新：React18的自动批处理
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 之前的React会触发3次渲染
    // React18+ 自动批处理，只触发1次渲染
    await login(username, password);

    setIsLoading(false);
  };
}
```

#### useEffect与副作用管理

`useEffect`是React处理副作用的主要Hook，它在组件渲染后执行，用于处理数据获取、订阅、手动DOM操作等。

```tsx
import { useState, useEffect, useRef } from 'react';

function DocumentEditor({ documentId }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 基础用法：组件挂载后执行
  useEffect(() => {
    // 组件首次渲染后执行
    const document = fetchDocument(documentId);
    setContent(document.content);
    setLastSaved(document.updatedAt);
  }, [documentId]); // 依赖数组：documentId变化时重新执行

  // 数据获取：带清理函数
  useEffect(() => {
    let ignore = false; // 防止异步竞态条件

    async function loadData() {
      const response = await fetch(`/api/documents/${documentId}`);
      const data = await response.json();

      // 检查组件是否仍然挂载
      if (!ignore) {
        setContent(data.content);
      }
    }

    loadData();

    // 清理函数：组件卸载或重新执行前调用
    return () => {
      ignore = true;
    };
  }, [documentId]);

  // 订阅模式：配合事件监听
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveDocument();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]); // content作为依赖确保最新内容被保存

  // 定时器：使用ref保持引用稳定
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      autoSave();
    }, 30000); // 每30秒自动保存

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [content]);
}
```

#### useReducer：复杂状态管理的利器

当状态逻辑复杂时，`useReducer`比多个`useState`更易管理：

```tsx
import { useReducer, useCallback } from 'react';

// reducer函数：状态更新逻辑集中管理
type State = {
  documents: Document[];
  currentDocId: string | null;
  loading: boolean;
  error: string | null;
  undoStack: State[];
  redoStack: State[];
};

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Document[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SELECT_DOCUMENT'; payload: string }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; changes: Partial<Document> } }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function documentReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        documents: action.payload,
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'SELECT_DOCUMENT':
      return {
        ...state,
        currentDocId: action.payload,
      };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.id
            ? { ...doc, ...action.payload.changes, updatedAt: new Date() }
            : doc
        ),
        undoStack: [...state.undoStack, state],
        redoStack: [],
      };

    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        undoStack: [...state.undoStack, state],
        redoStack: [],
      };

    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      return {
        ...previousState,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state],
      };

    case 'REDO':
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      return {
        ...nextState,
        undoStack: [...state.undoStack, state],
        redoStack: state.redoStack.slice(0, -1),
      };

    default:
      return state;
  }
}

// 使用reducer的组件
function DocumentManager() {
  const [state, dispatch] = useReducer(documentReducer, {
    documents: [],
    currentDocId: null,
    loading: false,
    error: null,
    undoStack: [],
    redoStack: [],
  });

  const loadDocuments = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const docs = await fetchDocuments();
      dispatch({ type: 'LOAD_SUCCESS', payload: docs });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', payload: error.message });
    }
  }, []);

  const updateDocument = useCallback((id: string, changes: Partial<Document>) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, changes } });
  }, []);

  return (
    <div>
      {state.loading && <LoadingSpinner />}
      {state.error && <ErrorMessage error={state.error} />}
      <DocumentList documents={state.documents} onSelect={id => dispatch({ type: 'SELECT_DOCUMENT', payload: id })} />
      <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.undoStack.length === 0}>撤销</button>
      <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.redoStack.length === 0}>重做</button>
    </div>
  );
}
```

### 2.3 细粒度响应式 vs 虚拟DOM

Vue3和React代表了两种截然不同的响应式思路，理解这个本质区别对框架选择至关重要。

#### Vue3的细粒度响应式

Vue3的响应式系统以"数据劫持"为核心。当我们定义一个响应式对象时，Vue会在数据周围创建Proxy代理，任何对这个数据的访问和修改都会被拦截。

```typescript
// Vue3 细粒度响应式的实际工作流程
const data = reactive({
  user: {
    name: '张三',
    age: 28,
  },
  items: ['a', 'b', 'c'],
});

// 组件A依赖 user.name
// 组件B依赖 user.age
// 组件C依赖 items.length

// 当执行 data.user.name = '李四' 时
// Vue3精确知道只有组件A需要更新
// 组件B和组件C完全不受影响

// 这就是"细粒度响应式"的核心优势
```

**优势**：

- 更新精准：只更新实际使用的数据的组件
- 无需virtual DOM diff：直接知道需要更新的位置
- 对复杂嵌套对象友好：深层属性变化也能精准追踪

**代价**：

- 需要包装响应式对象，Proxy有轻微性能开销
- 对象属性添加/删除需要特殊处理（使用ref而非reactive）
- 响应式系统的原理对新手来说不够直观

#### React的虚拟DOM diff

React选择了不同的思路：组件状态变化时，整个组件子树重新渲染，React通过virtual DOM diff算法计算实际DOM变化。

```tsx
// React 的渲染流程
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      {/* 当count变化时，这个组件会重新渲染 */}
      <ExpensiveChild />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}
```

在React中，当`count`变化时，`ExpensiveChild`组件也会重新渲染（除非使用`React.memo`优化）。React会生成新的virtual DOM，与旧的virtual DOM进行diff比较，计算出最小变更后应用到真实DOM。

**React18的自动批处理**：React18之前，只有事件处理函数中的状态更新会被批处理，异步回调中的状态更新不会。React18的所有状态更新都会被自动批处理，减少不必要的渲染。

**React18的并发特性**：React18引入的并发渲染允许React中断、恢复、并行渲染多个更新，通过`useTransition`、`useDeferredValue`等API，React可以优先处理用户交互相关的更新，延迟不紧急的更新。

```tsx
import { useState, useTransition, useDeferredValue } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // 使用useTransition标记低优先级更新
  const handleSearch = (newQuery: string) => {
    startTransition(() => {
      // 这个更新被标记为低优先级
      // React会优先处理用户输入等高优先级更新
      setQuery(newQuery);
    });
  };

  // useDeferredValue：延迟非紧急值的更新
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="搜索..."
      />
      {isPending ? (
        <LoadingSpinner />
      ) : (
        // results基于deferredQuery，可能稍微延迟更新
        <SearchResultsList results={getResults(deferredQuery)} />
      )}
    </div>
  );
}
```

### 2.4 依赖追踪 vs diff算法

这是两种响应式范式的核心区别。

| 对比维度 | Vue3依赖追踪 | React diff算法 |
|---------|-------------|----------------|
| 更新触发 | 自动追踪，精准依赖 | 状态变化触发整树渲染 |
| 更新粒度 | 组件级或元素级 | 组件级 |
| 计算开销 | 追踪开销小，更新直接 | diff计算有开销 |
| 开发体验 | 隐式自动，需理解原理 | 显式控制，需手动优化 |
| 列表渲染 | 手动:key辅助追踪 | 自动diff |
| 内存占用 | Proxy对象开销 | Virtual DOM内存开销 |

```typescript
// Vue3：开发者不需要关心"什么时候更新"
const count = ref(0);

watchEffect(() => {
  // Vue自动追踪：count变化时这个函数会重新执行
  console.log(`count是${count.value}`);
});

// React：开发者需要决定"状态怎么组织"
const [count, setCount] = useState(0);

// 开发者需要用useEffect"订阅"count变化
useEffect(() => {
  console.log(`count是${count}`);
}, [count]); // 手动声明依赖

// 或者用useMemo避免不必要的重新计算
const doubled = useMemo(() => count * 2, [count]);
```

### 2.5 性能对比与优化策略

#### Vue3性能优化策略

Vue3的响应式系统本身就保证了高效的更新，但仍有优化空间。

```typescript
// 1. 使用shallowRef避免深层响应式开销
import { ref, shallowRef } from 'vue';

// 大数据量列表使用shallowRef，只追踪.value的替换
const largeList = shallowRef([]);

function loadData() {
  // 替换整个数组，而不是push
  largeList.value = await fetchLargeData();
}

// 2. 使用computed缓存昂贵计算
const processedData = computed(() => {
  // 只有当相关依赖变化时才重新计算
  return expensiveOperation(data.value);
});

// 3. 使用watchEffect配合debounce处理频繁更新
import { watchEffect } from 'vue';
import debounce from 'lodash/debounce';

watchEffect(() => {
  // 自动防抖，避免频繁请求
  searchAPI(searchQuery.value);
}, {
  debounce: 300,
});

// 4. v-memo：条件性跳过组件更新
const Item = defineComponent({
  props: ['id', 'name', 'selected'],
  setup(props) {
    // 只有当id或selected变化时才重新渲染
    // name变化时跳过渲染
    v-memo="[props.id, props.selected]";
  },
});
```

#### React性能优化策略

React需要更多手动优化，但优化手段也更灵活。

```tsx
import { useState, useCallback, useMemo, memo, useRef } from 'react';

// 1. React.memo：避免不必要的重渲染
const ExpensiveList = memo(function ExpensiveList({ items, onSelect }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// 2. useCallback：稳定函数引用
function Parent() {
  const [count, setCount] = useState(0);

  // 不用useCallback：每次渲染都是新函数
  // const handleSelect = (id) => console.log(id);

  // 使用useCallback：引用保持稳定
  const handleSelect = useCallback((id: string) => {
    console.log('selected:', id);
  }, []); // 空依赖：函数永远不变

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <>
      <ExpensiveList items={items} onSelect={handleSelect} />
      <button onClick={handleClick}>计数: {count}</button>
    </>
  );
}

// 3. useMemo：缓存昂贵计算结果
function DataTable({ data, filter }) {
  // 只有data或filter变化时才重新计算
  const filteredData = useMemo(() => {
    console.log('计算过滤...'); // 观察时机
    return data.filter(item =>
      item.name.includes(filter)
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  return <Table data={sortedData} />;
}

// 4. 状态位置优化：减少不必要的重渲染
function GrandParent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {/* 如果Button不需要count，应该把count状态下移 */}
      <ButtonWithCount count={count} />
    </div>
  );
}

// 更好的设计：状态应该放在需要它的组件最近公共祖先
function BetterParent() {
  return (
    <div>
      {/* count状态在这里，与使用它的子组件放在一起 */}
      <Counter />
      {/* 这里不需要count，不会因为count变化而重渲染 */}
      <StaticContent />
    </div>
  );
}
```

---

## 三、组件模型对比

### 3.1 Vue3组件：选项式 vs 组合式

Vue3允许在选项式API和组合式API之间无缝切换，两种方式可以共存于同一个组件中。

```vue
<!-- 混合使用选项式和组合式 -->
<script lang="ts">
export default {
  name: 'MixedComponent',

  // 选项式：定义组件的选项
  props: {
    title: String,
    initialCount: {
      type: Number,
      default: 0,
    },
  },

  emits: ['update', 'delete'],

  // 选项式data
  data() {
    return {
      count: this.initialCount,
      localTitle: this.title,
    };
  },

  // 组合式：使用<script setup>或setup()函数
  // 这段代码与选项式代码可以访问相同的数据
  setup(props, { emit }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const isEditing = ref(false);

    const displayCount = computed(() => count.value * 2);

    function handleIncrement() {
      count.value++;
      emit('update', count.value);
    }

    function handleDelete() {
      emit('delete', props.title);
    }

    // 返回的值会与data()返回的合并
    return {
      inputRef,
      isEditing,
      displayCount,
      handleIncrement,
      handleDelete,
    };
  },
};
</script>
```

### 3.2 React19组件：函数组件 + Hooks

React19的组件模型完全基于函数，类组件已不再是推荐写法。

```tsx
import { useState, useCallback, useRef, useEffect } from 'react';

// React函数组件
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  // 状态声明
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 回调函数使用useCallback稳定引用
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleFollow = useCallback(() => {
    setIsFollowing(prev => !prev);
    // 触发父组件回调
    onEdit?.({ ...user, isFollowing: !isFollowing });
  }, [user, onEdit, isFollowing]);

  // 副作用
  useEffect(() => {
    if (isExpanded && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isExpanded]);

  // JSX返回
  return (
    <div className={`user-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="card-header" onClick={handleToggleExpand}>
        <img src={user.avatar} alt={user.name} className="avatar" />
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.bio}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="card-body">
          <input
            ref={editInputRef}
            defaultValue={user.name}
            onBlur={e => onEdit?.({ ...user, name: e.target.value })}
          />
          <div className="stats">
            <span>粉丝: {user.followers}</span>
            <span>关注: {user.following}</span>
          </div>
        </div>
      )}

      <button onClick={handleFollow}>
        {isFollowing ? '取消关注' : '关注'}
      </button>

      <button onClick={() => onDelete?.(user.id)}>
        删除
      </button>
    </div>
  );
}
```

### 3.3 生命周期对比

Vue3和React的生命周期概念有所不同，但核心思想是一致的：组件从创建到销毁的过程管理。

| Vue2/Vue3选项式 | Vue3组合式 | React (class) | React (Hooks) |
|-----------------|-----------|---------------|---------------|
| beforeCreate | setup() | constructor | - |
| created | setup() | - | useState初始化 |
| beforeMount | onBeforeMount | componentWillMount | - |
| mounted | onMounted | componentDidMount | useEffect(() => {}, []) |
| beforeUpdate | onBeforeUpdate | componentWillUpdate | useEffect(() => {}, [deps]) |
| updated | onUpdated | componentDidUpdate | useEffect(() => {}, [deps]) |
| beforeUnmount | onBeforeUnmount | componentWillUnmount | useEffect cleanup |
| unmounted | onUnmounted | componentDidUnmount | cleanup function |

```vue
<!-- Vue3 组合式生命周期 -->
<script setup lang="ts">
import {
  onMounted,
  onUpdated,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onUnmounted,
  ref
} from 'vue';

const count = ref(0);

onBeforeMount(() => {
  // 组件挂载前调用
  console.log('组件即将挂载');
});

onMounted(() => {
  // 组件挂载后调用，等同于Vue2的mounted
  console.log('组件已挂载，DOM可用');

  // 适合：DOM操作、数据获取、订阅
  const element = document.querySelector('.my-element');
});

onBeforeUpdate(() => {
  // 组件更新前调用
  console.log('组件即将更新');
});

onUpdated(() => {
  // 组件更新后调用
  console.log('组件已更新');
});

onBeforeUnmount(() => {
  // 组件卸载前调用
  console.log('组件即将卸载');
});

onUnmounted(() => {
  // 组件卸载后调用
  console.log('组件已卸载');

  // 适合：清理定时器、取消订阅、销毁DOM监听
});
</script>
```

```tsx
// React Hooks生命周期
import { useState, useEffect } from 'react';

function LifecycleDemo() {
  const [count, setCount] = useState(0);

  // 相当于componentDidMount + componentDidUpdate
  // 每次渲染都会执行
  useEffect(() => {
    console.log('组件渲染了');
    // 返回清理函数
    return () => {
      console.log('清理上一次渲染');
    };
  }); // 无依赖数组：每次渲染都执行

  // 相当于componentDidMount
  useEffect(() => {
    console.log('组件首次挂载');

    return () => {
      console.log('组件卸载时清理');
    };
  }, []); // 空依赖：只在首次挂载时执行

  // 相当于componentDidUpdate
  useEffect(() => {
    if (count > 0) {
      console.log(`count更新了，现在是${count}`);
    }
  }, [count]); // 依赖count：count变化时执行

  // 组合多个依赖
  useEffect(() => {
    console.log('count或name变化时执行');
  }, [count, name]);
}
```

### 3.4 插槽与Props.Children

Vue和React在内容分发（content projection）方面有不同的设计哲学。

#### Vue的插槽系统

Vue提供了功能完整的插槽系统，包括默认插槽、具名插槽、作用域插槽。

```vue
<!-- Vue 插槽示例 -->
<!-- Components/Card.vue -->
<template>
  <div class="card">
    <div class="card-header">
      <!-- 具名插槽 -->
      <slot name="header">
        <h3>默认标题</h3>
      </slot>
    </div>

    <div class="card-body">
      <!-- 默认插槽（无名插槽） -->
      <slot>
        <p>默认内容</p>
      </slot>
    </div>

    <div class="card-footer">
      <!-- 作用域插槽：传递数据给父组件 -->
      <slot name="footer" :user="currentUser" :isLoggedIn="isLoggedIn">
        <button>默认按钮</button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const currentUser = ref({ name: '张三', avatar: '/avatars/zhangsan.jpg' });
const isLoggedIn = ref(true);
</script>

<!-- 使用组件 -->
<Card>
  <!-- 具名插槽 -->
  <template #header>
    <h2>用户资料</h2>
  </template>

  <!-- 默认插槽内容 -->
  <div class="user-content">
    <p>这是用户的主要内容区域</p>
  </div>

  <!-- 作用域插槽：接收子组件传递的数据 -->
  <template #footer="{ user, isLoggedIn }">
    <div v-if="isLoggedIn">
      <img :src="user.avatar" />
      <span>{{ user.name }}</span>
      <button>编辑资料</button>
    </div>
    <button v-else @click="goToLogin">登录</button>
  </template>
</Card>
```

#### React的Props.Children

React使用props.children实现内容分发，方式更加灵活但不如Vue的插槽系统功能丰富。

```tsx
// React props.children示例
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div className={`card ${className || ''}`}>
      {children}
    </div>
  );
}

// 使用
<Card className="user-card">
  <h2>用户资料</h2>
  <p>这是卡片内容</p>
</Card>

// 插槽模式：传入命名props
interface ModalProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Modal({ header, children, footer }: ModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">{header}</div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// 使用
<Modal
  header={<h2>确认删除</h2>}
  footer={
    <>
      <button onClick={onCancel}>取消</button>
      <button onClick={onConfirm}>确认</button>
    </>
  }
>
  <p>确定要删除这个项目吗？</p>
</Modal>
```

React19引入了新的模式，可以通过`use()`消费Promise和Context来创建更灵活的"插槽"模式：

```tsx
// React19：更灵活的插槽模式
function AsyncContent({ contentPromise }) {
  const content = use(contentPromise);
  return <div>{content}</div>;
}

function DataTable({ dataPromise }) {
  const { headers, rows } = use(dataPromise);

  return (
    <table>
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id}>
            {Object.values(row).map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3.5 实战：同一个组件用两种框架实现

让我们实现一个实际的项目组件：带评论功能的文档阅读器。

```vue
<!-- Vue3实现：DocumentReader.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import CommentList from './CommentList.vue';
import CommentForm from './CommentForm.vue';
import type { Document, Comment, User } from '@/types';

interface Props {
  documentId: string;
  currentUser: User | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'share', doc: Document): void;
}>();

// 响应式状态
const document = ref<Document | null>(null);
const comments = ref<Comment[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const replyTo = ref<Comment | null>(null);

// 计算属性
const sortedComments = computed(() =>
  [...comments.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
);

const commentsCount = computed(() => comments.value.length);

const canComment = computed(() => props.currentUser !== null);

// 方法
async function loadDocument() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/documents/${props.documentId}`);
    if (!response.ok) throw new Error('加载文档失败');

    document.value = await response.json();

    // 同时加载评论
    const commentsResponse = await fetch(`/api/documents/${props.documentId}/comments`);
    if (commentsResponse.ok) {
      comments.value = await commentsResponse.json();
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误';
  } finally {
    isLoading.value = false;
  }
}

async function submitComment(content: string) {
  if (!props.currentUser) return;

  const newComment: Comment = {
    id: crypto.randomUUID(),
    documentId: props.documentId,
    author: props.currentUser,
    content,
    createdAt: new Date().toISOString(),
    parentId: replyTo.value?.id || null,
  };

  // 乐观更新
  comments.value.unshift(newComment);
  replyTo.value = null;

  try {
    const response = await fetch(`/api/documents/${props.documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(newComment),
    });

    if (!response.ok) throw new Error('发送评论失败');
  } catch (e) {
    // 回滚
    comments.value = comments.value.filter(c => c.id !== newComment.id);
    error.value = '评论发送失败';
  }
}

function handleReply(comment: Comment) {
  replyTo.value = comment;
}

function cancelReply() {
  replyTo.value = null;
}

// 监听documentId变化，重新加载
watch(() => props.documentId, loadDocument);

// 生命周期
onMounted(() => {
  loadDocument();
});
</script>

<template>
  <div class="document-reader">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      <Spinner />
      <span>正在加载文档...</span>
    </div>

    <!-- 错误状态 -->
    <ErrorBanner v-if="error" :message="error" @dismiss="error = null" />

    <!-- 文档内容 -->
    <article v-if="document" class="document-content">
      <header class="document-header">
        <h1>{{ document.title }}</h1>
        <div class="document-meta">
          <Avatar :user="document.author" />
          <span>{{ document.author.name }}</span>
          <span>发布于 {{ formatDate(document.createdAt) }}</span>
        </div>
      </header>

      <!-- 使用v-html渲染富文本内容 -->
      <div class="document-body" v-html="document.content" />

      <!-- 分享按钮 -->
      <button @click="emit('share', document)" class="share-btn">
        分享文档
      </button>
    </article>

    <!-- 评论区域 -->
    <section class="comments-section">
      <h2>评论 ({{ commentsCount }})</h2>

      <!-- 评论表单 -->
      <CommentForm
        v-if="canComment"
        :reply-to="replyTo"
        @submit="submitComment"
        @cancel="cancelReply"
      />
      <p v-else class="login-prompt">
        请登录后发表评论
      </p>

      <!-- 评论列表 -->
      <CommentList
        :comments="sortedComments"
        :current-user="currentUser"
        @reply="handleReply"
      />
    </section>
  </div>
</template>

<style scoped>
.document-reader {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.document-header h1 {
  font-size: 2rem;
  margin-bottom: 16px;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  margin-bottom: 24px;
}

.document-body {
  line-height: 1.8;
  margin-bottom: 32px;
}

.share-btn {
  margin-bottom: 48px;
}

.comments-section {
  border-top: 1px solid #eee;
  padding-top: 24px;
}

.comments-section h2 {
  margin-bottom: 24px;
}
</style>
```

```tsx
// React19实现：DocumentReader.tsx
import { useState, useEffect, useCallback, use } from 'react';
import { Avatar } from '@/components/Avatar';
import { Spinner } from '@/components/Spinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import type { Document, Comment, User } from '@/types';

interface DocumentReaderProps {
  documentId: string;
  currentUser: User | null;
  onShare: (doc: Document) => void;
}

interface DocumentState {
  document: Document | null;
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

export function DocumentReader({ documentId, currentUser, onShare }: DocumentReaderProps) {
  const [state, setState] = useState<DocumentState>({
    document: null,
    comments: [],
    isLoading: false,
    error: null,
  });
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  // 计算属性
  const sortedComments = useMemo(() =>
    [...state.comments].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [state.comments]
  );

  const commentsCount = useMemo(() =>
    state.comments.length,
    [state.comments]
  );

  const canComment = useMemo(() =>
    currentUser !== null,
    [currentUser]
  );

  // 加载文档数据
  const loadDocument = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [docResponse, commentsResponse] = await Promise.all([
        fetch(`/api/documents/${documentId}`),
        fetch(`/api/documents/${documentId}/comments`),
      ]);

      if (!docResponse.ok) throw new Error('加载文档失败');

      const doc = await docResponse.json();
      const comments = commentsResponse.ok ? await commentsResponse.json() : [];

      setState({
        document: doc,
        comments,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : '未知错误',
      }));
    }
  }, [documentId]);

  // 提交评论
  const submitComment = useCallback(async (content: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      documentId,
      author: currentUser,
      content,
      createdAt: new Date().toISOString(),
      parentId: replyTo?.id || null,
    };

    // 乐观更新
    setState(prev => ({
      ...prev,
      comments: [newComment, ...prev.comments],
    }));
    setReplyTo(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        body: JSON.stringify(newComment),
      });

      if (!response.ok) throw new Error('发送评论失败');
    } catch (e) {
      // 回滚
      setState(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== newComment.id),
        error: '评论发送失败',
      }));
    }
  }, [documentId, currentUser, replyTo]);

  // 监听documentId变化
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // 渲染
  if (state.isLoading) {
    return (
      <div className="document-reader loading">
        <Spinner />
        <span>正在加载文档...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <ErrorBanner
        message={state.error}
        onDismiss={() => setState(prev => ({ ...prev, error: null }))}
      />
    );
  }

  if (!state.document) {
    return <div className="document-reader">文档不存在</div>;
  }

  return (
    <div className="document-reader">
      <article className="document-content">
        <header className="document-header">
          <h1>{state.document.title}</h1>
          <div className="document-meta">
            <Avatar user={state.document.author} />
            <span>{state.document.author.name}</span>
            <span>发布于 {formatDate(state.document.createdAt)}</span>
          </div>
        </header>

        <div
          className="document-body"
          dangerouslySetInnerHTML={{ __html: state.document.content }}
        />

        <button onClick={() => onShare(state.document!)} className="share-btn">
          分享文档
        </button>
      </article>

      <section className="comments-section">
        <h2>评论 ({commentsCount})</h2>

        {canComment ? (
          <CommentForm
            replyTo={replyTo}
            onSubmit={submitComment}
            onCancel={() => setReplyTo(null)}
          />
        ) : (
          <p className="login-prompt">请登录后发表评论</p>
        )}

        <CommentList
          comments={sortedComments}
          currentUser={currentUser}
          onReply={setReplyTo}
        />
      </section>
    </div>
  );
}
```

---

## 四、状态管理对比

### 4.1 Pinia vs Zustand

Pinia和Zustand分别是Vue3和React最流行的状态管理库，它们都以极简的API和出色的TypeScript支持著称。

#### Pinia：Vue3的官方推荐

Pinia最初是作为Vuex的替代品开发的，后来成为Vue3的官方推荐状态管理库。Pinia的设计理念是简化Vuex的复杂概念，同时提供更好的TypeScript支持和更直观的API。

```typescript
// stores/userStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => user.value !== null);
  const userName = computed(() => user.value?.name || '游客');

  // Actions
  async function login(credentials: { email: string; password: string }) {
    loading.value = true;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('登录失败');

      const data = await response.json();
      user.value = data.user;
      token.value = data.token;

      // 持久化到localStorage
      localStorage.setItem('token', data.token);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '登录失败' };
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    loading.value = true;
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!response.ok) {
        localStorage.removeItem('token');
        return;
      }

      user.value = await response.json();
      token.value = storedToken;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  function updateProfile(updates: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...updates };
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    // 计算属性
    isLoggedIn,
    userName,
    // Actions
    login,
    fetchCurrentUser,
    logout,
    updateProfile,
  };
});
```

Pinia的优势在于它与Vue3的深度整合：

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

// 使用storeToRefs保持响应式
const { user, isLoggedIn, loading } = storeToRefs(userStore);

// 方法直接解构使用
const { login, logout } = userStore;

async function handleLogin(formData: FormData) {
  const result = await login({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (result.success) {
    router.push('/dashboard');
  }
}
</script>

<template>
  <div>
    <div v-if="isLoggedIn">
      <p>欢迎，{{ user?.name }}</p>
      <button @click="logout">退出</button>
    </div>
    <div v-else>
      <LoginForm @submit="handleLogin" />
    </div>
  </div>
</template>
```

#### Zustand：React的轻量状态管理

Zustand的API设计哲学与Pinia非常相似，但针对React的特性做了适配。Zustand使用hook模式，不需要Provider包裹，在任何组件中都可以直接使用。

```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  fetchCurrentUser: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      loading: false,

      // Actions
      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });

          if (!response.ok) throw new Error('登录失败');

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            loading: false,
          });

          return { success: true };
        } catch (error) {
          set({ loading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : '登录失败'
          };
        }
      },

      fetchCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ loading: true });
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            set({ token: null, user: null });
            return;
          }

          set({ user: await response.json(), loading: false });
        } catch {
          set({ loading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'user-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }), // 只持久化部分状态
    }
  )
);
```

```tsx
// 组件中使用
import { useUserStore } from '@/stores/userStore';
import { shallow } from 'zustand/shallow';

function UserProfile() {
  // 选择性订阅，避免不必要重渲染
  const { user, isLoggedIn } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      isLoggedIn: state.user !== null,
    }))
  );

  const { updateProfile, logout } = useUserStore();

  const handleUpdate = async (updates: Partial<User>) => {
    await updateProfile(updates);
  };

  return (
    <div>
      {isLoggedIn ? (
        <>
          <h2>{user?.name}</h2>
          <button onClick={logout}>退出</button>
        </>
      ) : (
        <p>请登录</p>
      )}
    </div>
  );
}
```

#### Pinia与Zustand核心对比

| 特性 | Pinia | Zustand |
|------|-------|---------|
| 框架 | Vue3 | React |
| API风格 | Setup Store（组合式）| Hook Store |
| 状态访问 | storeToRefs保持响应式 | 直接解构或选择器 |
| TypeScript | 原生支持 | 原生支持 |
| DevTools | Vue DevTools | Zustand DevTools |
| 持久化 | 需插件 | 内置persist中间件 |
| 体积 | ~1KB | ~1KB |

### 4.2 Vuex vs Redux

虽然Pinia和Zustand是更现代的选择，但Vuex和Redux在大型应用中仍有广泛使用。

#### Vuex：Vue2/3的经典状态管理

Vuex是Vue2时代的官方推荐，采用集中式状态管理，所有状态存储在一个单一的store中，通过mutations同步修改状态，actions处理异步操作。

```typescript
// Vuex store
import { createStore } from 'vuex';

interface State {
  user: User | null;
  documents: Document[];
  loading: boolean;
}

export default createStore<State>({
  // 状态
  state: (): State => ({
    user: null,
    documents: [],
    loading: false,
  }),

  // 同步修改状态
  mutations: {
    SET_USER(state, user: User | null) {
      state.user = user;
    },
    SET_DOCUMENTS(state, documents: Document[]) {
      state.documents = documents;
    },
    ADD_DOCUMENT(state, document: Document) {
      state.documents.unshift(document);
    },
    UPDATE_DOCUMENT(state, payload: { id: string; changes: Partial<Document> }) {
      const index = state.documents.findIndex(d => d.id === payload.id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...payload.changes };
      }
    },
    DELETE_DOCUMENT(state, id: string) {
      state.documents = state.documents.filter(d => d.id !== id);
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading;
    },
  },

  // 异步操作
  actions: {
    async fetchDocuments({ commit }) {
      commit('SET_LOADING', true);
      try {
        const response = await fetch('/api/documents');
        const documents = await response.json();
        commit('SET_DOCUMENTS', documents);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async createDocument({ commit }, data: CreateDocumentData) {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const document = await response.json();
      commit('ADD_DOCUMENT', document);
      return document;
    },

    async updateDocument({ commit }, payload: { id: string; changes: Partial<Document> }) {
      await fetch(`/api/documents/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload.changes),
      });
      commit('UPDATE_DOCUMENT', payload);
    },
  },

  // 计算属性
  getters: {
    publishedDocuments: (state) =>
      state.documents.filter(d => d.isPublished),

    documentsCount: (state) =>
      state.documents.length,

    getDocumentById: (state) => (id: string) =>
      state.documents.find(d => d.id === id),
  },
});
```

#### Redux Toolkit：React的标准状态管理

Redux Toolkit (RTK) 是Redux的现代化封装，大大简化了Redux的样板代码。

```typescript
// store/documentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface DocumentsState {
  items: Document[];
  currentDocId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  items: [],
  currentDocId: null,
  loading: false,
  error: null,
};

// 异步thunk
export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('获取文档失败');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取文档失败');
    }
  }
);

export const createDocument = createAsyncThunk(
  'documents/create',
  async (data: CreateDocumentData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('创建文档失败');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '创建失败');
    }
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // 同步reducer
    setCurrentDoc: (state, action: PayloadAction<string | null>) => {
      state.currentDocId = action.payload;
    },

    updateDocument: (state, action: PayloadAction<{ id: string; changes: Partial<Document> }>) => {
      const index = state.items.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
      }
    },

    deleteDocument: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(d => d.id !== action.payload);
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchDocuments
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createDocument
      .addCase(createDocument.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { setCurrentDoc, updateDocument, deleteDocument, clearError } = documentsSlice.actions;

// Selectors
export const selectAllDocuments = (state: RootState) => state.documents.items;
export const selectPublishedDocuments = (state: RootState) =>
  state.documents.items.filter(d => d.isPublished);
export const selectCurrentDocument = (state: RootState) =>
  state.documents.items.find(d => d.id === state.documents.currentDocId);

export default documentsSlice.reducer;
```

```tsx
// 组件中使用Redux Toolkit
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import {
  fetchDocuments,
  createDocument,
  deleteDocument,
  selectPublishedDocuments,
} from '@/store/documentsSlice';

function DocumentList() {
  const dispatch = useDispatch<AppDispatch>();
  const documents = useSelector(selectPublishedDocuments);
  const { loading, error } = useSelector((state: RootState) => state.documents);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const handleCreate = async (data: CreateDocumentData) => {
    await dispatch(createDocument(data));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteDocument(id));
  };

  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={() => handleDelete(doc.id)}
        />
      ))}
    </div>
  );
}
```

### 4.3 Context vs Provide/Inject

两者都是跨层级传递数据的方案，但实现和使用方式有所不同。

#### Vue3的Provide/Inject

```vue
<!-- ThemeProvider.vue -->
<script setup lang="ts">
import { provide, ref, computed } from 'vue';

const theme = ref<'light' | 'dark'>('light');

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

const isDark = computed(() => theme.value === 'dark');

// 提供给所有后代组件
provide('theme', {
  theme,
  isDark,
  toggleTheme,
});

// 或使用symbol作为key避免冲突
import { InjectionKey } from 'vue';

interface Theme {
  theme: Ref<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  toggleTheme: () => void;
}

const ThemeKey: InjectionKey<Theme> = Symbol('theme');

provide(ThemeKey, {
  theme,
  isDark,
  toggleTheme,
});
</script>

<template>
  <slot />
</template>

<!-- ThemedButton.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { ThemeKey } from './ThemeProvider.vue';

const { theme, isDark, toggleTheme } = inject(ThemeKey);

const buttonClass = computed(() => ({
  'theme-btn': true,
  'dark': isDark.value,
}));
</script>

<template>
  <button :class="buttonClass" @click="toggleTheme">
    当前主题: {{ theme }}
  </button>
</template>
```

#### React的Context

```tsx
// ThemeContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface Theme {
  theme: 'light' | 'dark';
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme必须在ThemeProvider内使用');
  }
  return context;
}

// ThemedButton.tsx
function ThemedButton() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-btn ${isDark ? 'dark' : ''}`}
      onClick={toggleTheme}
    >
      当前主题: {theme}
    </button>
  );
}
```

### 4.4 实战：状态管理方案对比

| 场景 | Vue3推荐方案 | React19推荐方案 |
|------|-------------|----------------|
| 简单全局状态 | Provide/Inject | Context + useContext |
| 中等复杂度状态 | Pinia | Zustand |
| 复杂大型应用 | Pinia + 模块化 | Redux Toolkit |
| 服务端数据缓存 | Pinia + SWR插件 | SWR / React Query |
| 表单状态 | VeeValidate | React Hook Form + Zod |
| URL状态 | Vue Router | React Router |

---

## 五、路由对比

### 5.1 Vue Router vs React Router

两个路由库在设计理念和API风格上差异明显。

#### Vue Router 4

Vue Router 4是Vue3的官方路由管理器，深度集成Vue的响应式系统。

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    // 路由元信息
    meta: { requiresAuth: false, title: '首页' },
  },
  {
    path: '/documents/:id',
    name: 'document-detail',
    component: () => import('@/views/DocumentDetail.vue'),
    props: true, // 将params作为props传递给组件
    meta: { requiresAuth: true },
  },
  {
    path: '/user/:username',
    component: () => import('@/views/UserProfile.vue'),
    children: [
      {
        path: '', // /user/:username
        name: 'user-profile',
        component: () => import('@/views/UserProfileMain.vue'),
      },
      {
        path: 'settings', // /user/:username/settings
        name: 'user-settings',
        component: () => import('@/views/UserSettings.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    // 捕获所有路由，用于404
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 路由切换时滚动行为
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash };
    }
    return { top: 0 };
  },
});

// 导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = checkAuth();

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

router.afterEach((to) => {
  // 更新页面标题
  document.title = to.meta.title
    ? `${to.meta.title} - MyApp`
    : 'MyApp';
});

export default router;
```

```vue
<!-- 组件中使用Vue Router -->
<script setup lang="ts">
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

// 获取路由参数
const documentId = computed(() => route.params.id as string);

// 获取查询参数
const tab = computed(() => route.query.tab as string);

// 编程式导航
function goToDocument(id: string) {
  router.push({
    name: 'document-detail',
    params: { id },
    query: { tab: 'comments' },
  });
}

// 替换当前记录
function replaceToHome() {
  router.replace('/');
}

// 带hash跳转
function scrollToTop() {
  router.push({ path: '/', hash: '#top' });
}

// 监听路由变化
import { watch } from 'vue';
watch(() => route.params.id, (newId) => {
  loadDocument(newId);
});

// 组件内守卫
onBeforeRouteLeave((to, from) => {
  // 离开组件前确认
  const answer = window.confirm('有未保存的更改，确定离开？');
  return answer;
});
</script>

<template>
  <div class="document-detail">
    <h1>文档ID: {{ documentId }}</h1>
    <p>当前标签: {{ tab }}</p>
    <button @click="goToDocument('123')">查看文档123</button>
    <button @click="router.back()">返回</button>
  </div>
</template>
```

#### React Router 6/7

React Router在v6版本进行了重大改革，API更加简洁。React Router 7（也叫Remix v3）进一步整合了loader/action模式。

```tsx
// router.tsx (React Router 7)
import { createBrowserRouter, redirect } from 'react-router';
import type { RouteObject } from 'react-router';

// 布局组件
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// 路由配置
const routes: RouteObject[] = [
  {
    path: '/',
    name: 'home',
    lazy: () => import('./views/Home'),
  },
  {
    path: '/documents/:id',
    name: 'document-detail',
    lazy: () => import('./views/DocumentDetail'),
    loader: async ({ params }) => {
      // 服务端数据预加载
      const response = await fetch(`/api/documents/${params.id}`);
      if (!response.ok) throw new Response('Not Found', { status: 404 });
      return { document: await response.json() };
    },
    action: async ({ request, params }) => {
      // 表单提交处理
      const formData = await request.formData();
      const intent = formData.get('intent');

      if (intent === 'delete') {
        await deleteDocument(params.id);
        return redirect('/documents');
      }

      return updateDocument(params.id, Object.fromEntries(formData));
    },
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'settings', element: <DashboardSettings /> },
        ],
      },
    ],
  },
  {
    path: '/user/:username',
    children: [
      {
        index: true,
        element: <UserProfile />,
        loader: async ({ params }) => {
          const user = await fetchUser(params.username);
          if (!user) throw new Response('Not Found', { status: 404 });
          return { user };
        },
      },
      {
        path: 'settings',
        element: <UserSettings />,
        loader: () => {
          // 检查用户是否有权限访问设置
          return { hasPermission: true };
        },
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
```

```tsx
// React Router 7 组件中使用
import {
  useLoaderData,
  useParams,
  useSearchParams,
  useNavigate,
  useNavigation,
  Link,
  Form,
  Outlet,
} from 'react-router';
import { useEffect } from 'react';

function DocumentDetail() {
  // loader返回的数据
  const { document } = useLoaderData<typeof loader>();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const tab = searchParams.get('tab') || 'content';
  const isLoading = navigation.state === 'loading';

  // 导航
  function goToDocument(id: string) {
    navigate(`/documents/${id}?tab=comments`);
  }

  // 使用Form组件处理提交
  function DocumentActions() {
    return (
      <Form method="post">
        <input type="hidden" name="id" value={document.id} />
        <button type="submit" name="intent" value="delete">删除</button>
      </Form>
    );
  }

  return (
    <div className="document-detail">
      <h1>{document.title}</h1>
      {isLoading && <LoadingSpinner />}

      {/* Tab导航 */}
      <div className="tabs">
        <Link to={`?tab=content`}>内容</Link>
        <Link to={`?tab=comments`}>评论</Link>
      </div>

      {tab === 'content' && <DocumentContent content={document.content} />}
      {tab === 'comments' && <Comments documentId={document.id} />}

      <DocumentActions />
    </div>
  );
}
```

### 5.2 路由守卫 vs Loader/Action

这是两种路由模式的核心区别。

```typescript
// Vue Router：使用导航守卫
router.beforeEach(async (to, from) => {
  // 验证用户权限
  if (to.meta.requiresAuth) {
    try {
      await checkAuth();
      return true;
    } catch {
      return {
        name: 'login',
        query: { redirect: to.fullPath }
      };
    }
  }
  return true;
});

// React Router 7：使用loader进行权限验证
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/documents/:id/edit',
];

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);

  if (protectedRoutes.some(route =>
    url.pathname.match(new RegExp('^' + route.replace(':id', '\\w+') + '$'))
  )) {
    try {
      const user = await getCurrentUser(request);
      return { user };
    } catch {
      throw redirect('/login');
    }
  }

  return { user: null };
}
```

### 5.3 懒加载实现

#### Vue Router的懒加载

```typescript
// 直接在路由配置中懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue'),
  },
  {
    path: '/documents',
    // 带loading的懒加载
    component: () => ({
      component: import('./views/Documents.vue'),
      loading: LoadingSpinner,
      delay: 200,
      timeout: 3000,
    }),
  },
];

// 使用defineAsyncComponent
import { defineAsyncComponent } from 'vue';

const Documents = defineAsyncComponent(() => import('./views/Documents.vue'));
```

#### React Router的懒加载

```tsx
// React.lazy + Suspense
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./views/Dashboard'));
const Documents = lazy(() => import('./views/Documents'));

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard />
        </Suspense>
      } />
    </Routes>
  );
}

// React Router 7的lazy
const routes = [
  {
    path: '/dashboard',
    lazy: () => import('./views/Dashboard'),
  },
];
```

---

## 六、性能对比

### 6.1 首屏渲染对比

首屏渲染性能是用户体验的关键指标。Vue3和React在这方面有不同的优化策略。

#### Vue3的首屏渲染优化

Vue3在首屏渲染方面的优势来自于其细粒度的响应式系统。当组件首次渲染时，Vue只需要执行一次响应式Proxy的创建，之后对数据的访问都是直接读取。

```typescript
// Vue3首屏渲染流程
// 1. 创建响应式Proxy（一次性开销）
const state = reactive({ count: 0 });

// 2. 模板编译成渲染函数
// 编译后的代码类似：
// function render(ctx) {
//   return h('div', ctx.count);
// }

// 3. 渲染函数执行，生成真实DOM
// Vue的模板编译器会优化静态内容，只追踪动态绑定
```

Vue3的模板编译器（Vue Compiler）会分析模板，识别静态内容和动态绑定。静态内容只创建一次，动态内容会建立响应式依赖。这使得Vue3的首屏渲染非常高效。

#### React的首屏渲染优化

React的首屏渲染需要创建完整的虚拟DOM树，然后通过React DOM将虚拟DOM转换成真实DOM。这个过程涉及JavaScript执行和DOM API调用。

```tsx
// React首屏渲染流程
// 1. 执行组件函数，生成虚拟DOM
function App() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

// 2. 虚拟DOM通过React DOM创建真实DOM
// 3. 浏览器Layout和Paint
```

React18的并发特性可以"延迟"不紧急的工作，让首屏更快地可见：

```tsx
import { useState, useTransition } from 'react';

// React18: 使用useTransition标记低优先级渲染
function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // 输入框更新是高优先级
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  // 搜索结果渲染是低优先级
  function handleSearch(newQuery: string) {
    startTransition(() => {
      setResults(performSearch(newQuery));
    });
  }
}
```

### 6.2 更新性能对比

更新性能指的是数据变化后，UI更新到最终状态的速度。

#### Vue3的更新机制

Vue3的更新是"精确打击"模式：当一个响应式数据变化时，只有直接依赖这个数据的组件/元素会更新。

```vue
<template>
  <div>
    <!-- count变化只更新这个文本节点 -->
    <p>{{ count }}</p>

    <!-- items变化只更新这个列表 -->
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

Vue3的编译器会为模板生成高效的更新代码。绑定表达式会被编译成类似` ctx.count `的代码，Vue3知道哪些数据被哪些模板使用，当数据变化时直接更新对应的DOM节点。

#### React的更新机制

React的更新是"整树重渲染 + diff"模式：当状态变化时，整个组件子树会重新渲染，然后通过虚拟DOM diff算法计算最小更新。

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      {/* count变化时，ExpensiveChild也会重渲染 */}
      <ExpensiveChild />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}

// 优化：React.memo + useCallback
const ExpensiveChild = memo(function ExpensiveChild() {
  return <div>...</div>;
});
```

React18的批处理（Automatic Batching）减少了不必要的渲染：

```tsx
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading'); // React 18会批处理这个更新

    await login(username, password);

    // React 18之前，这里会触发额外渲染
    // React 18+ 会批处理所有状态更新
    setStatus('success'); // 或者 setStatus('error')
  }
}
```

### 6.3 包体积对比

| 包 | Vue3 (压缩后) | React19 (压缩后) |
|----|--------------|------------------|
| 核心框架 | ~22KB | ~45KB |
| 路由 | ~14KB | ~13KB (react-router-dom) |
| 状态管理 | ~3KB (Pinia) | ~3KB (Zustand) |
| HTTP客户端 | ~12KB (axios) | ~13KB (ky/fetch) |
| **总计(基础)** | ~51KB | ~74KB |

Vue3的核心包体积更小，这主要是因为Vue3重写了内部实现，移除了一些React认为必要的特性。但两者在实际项目中的bundle体积差异并不显著，因为现代应用还会包含UI库、工具库等更大的依赖。

### 6.4 生产环境性能实测

根据2026年初的第三方性能测试数据（来源：js-framework-benchmark）：

| 指标 | Vue3 | React19 | 差异 |
|------|------|---------|------|
| 初始渲染时间 | 85ms | 92ms | Vue快7% |
| 增量更新（1000项） | 12ms | 15ms | Vue快20% |
| 内存占用（空闲） | 45MB | 52MB | Vue省13% |
| 内存占用（活跃） | 78MB | 85MB | Vue省8% |
| 列表滚动fps | 58fps | 57fps | 相当 |

这些数据仅供参考，实际性能取决于代码质量和优化程度。

---

## 七、开发体验对比

### 7.1 TypeScript支持

两者对TypeScript的支持都已非常成熟。

#### Vue3的TypeScript支持

Vue3从设计之初就考虑了TypeScript，官方类型定义非常完整。

```typescript
// Vue3 + TypeScript 完整类型示例
import { defineComponent, ref, reactive, computed, PropType } from 'vue';

// 定义组件props的类型
interface User {
  id: string;
  name: string;
  email: string;
  roles: ('admin' | 'editor' | 'viewer')[];
  profile?: {
    avatar: string;
    bio: string;
  };
}

// 定义组件
const UserCard = defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    onUpdate: {
      type: Function as PropType<(user: User) => void>,
      default: null,
    },
  },

  emits: ['click', 'edit'],

  setup(props, { emit, expose }) {
    // 响应式类型推断
    const count = ref(0); // Ref<number>
    const userState = reactive({
      user: props.user,
      isEditing: false,
    });

    // 计算属性类型自动推断
    const displayName = computed(() =>
      userState.user.profile?.bio || userState.user.name
    );

    // 方法定义
    function handleEdit() {
      userState.isEditing = true;
      emit('edit', props.user);
    }

    function handleSave() {
      userState.isEditing = false;
      emit('update', userState.user);
    }

    // 暴露给父组件
    expose({
      reset: () => {
        userState.user = props.user;
        userState.isEditing = false;
      },
    });

    return {
      count,
      userState,
      displayName,
      handleEdit,
      handleSave,
    };
  },
});
```

`<script setup>`语法的TypeScript支持更加简洁：

```vue
<script setup lang="ts">
// 编译器宏，无需导入
defineProps<{
  user: User;
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', user: User): void;
  (e: 'edit', user: User): void;
}>();

// ref类型自动推断
const count = ref(0);
const user = ref<User | null>(null);
const items = ref<Set<string>>(new Set());

// computed类型自动推断
const doubled = computed(() => count.value * 2);
const userName = computed(() => user.value?.name || '');
</script>
```

#### React19的TypeScript支持

React19的TypeScript支持同样出色，类型定义非常精确。

```tsx
// React19 + TypeScript 完整类型示例
import { useState, useCallback, useMemo, memo, type FC, type ReactNode } from 'react';

// 定义props和state的类型
interface UserCardProps {
  user: User;
  editable?: boolean;
  onClick?: (user: User) => void;
  onUpdate?: (user: User) => void;
  children?: ReactNode;
}

interface UserCardState {
  isEditing: boolean;
  editForm: {
    name: string;
    email: string;
  };
}

// 使用泛型保证类型安全
function UserCard({
  user,
  editable = false,
  onClick,
  onUpdate,
  children
}: UserCardProps) {
  const [state, setState] = useState<UserCardState>({
    isEditing: false,
    editForm: {
      name: user.name,
      email: user.email,
    },
  });

  // useCallback的泛型参数确保类型安全
  const handleEdit = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: true }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate?.({
      ...user,
      name: state.editForm.name,
      email: state.editForm.email,
    });
    setState(prev => ({ ...prev, isEditing: false }));
  }, [user, state.editForm, onUpdate]);

  // useMemo确保类型
  const displayInfo = useMemo(() => ({
    name: user.profile?.bio || user.name,
    initials: user.name.slice(0, 2).toUpperCase(),
  }), [user]);

  return (
    <div className="user-card" onClick={() => onClick?.(user)}>
      <div className="avatar">{displayInfo.initials}</div>
      {state.isEditing ? (
        <form onSubmit={handleSave}>
          <input
            value={state.editForm.name}
            onChange={e => setState(prev => ({
              ...prev,
              editForm: { ...prev.editForm, name: e.target.value },
            }))}
          />
          <input
            value={state.editForm.email}
            onChange={e => setState(prev => ({
              ...prev,
              editForm: { ...prev.editForm, email: e.target.value },
            }))}
          />
          <button type="submit">保存</button>
        </form>
      ) : (
        <>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          {editable && <button onClick={handleEdit}>编辑</button>}
        </>
      )}
      {children}
    </div>
  );
}

// 使用memo优化重渲染
export default memo(UserCard, (prev, next) => {
  // 自定义比较函数
  return prev.user.id === next.user.id &&
         prev.editable === next.editable;
});
```

### 7.2 DevTools对比

#### Vue DevTools

Vue DevTools是Vue官方提供的浏览器开发工具，提供了组件树检查、响应式状态追踪、性能分析等功能。

```vue
<script setup>
// Vue DevTools可以直观地看到：
// 1. 组件层级树
// 2. 每个组件的props、data、computed
// 3. 响应式依赖追踪（点击一个数据可以看到哪些组件依赖它）
// 4. 时间旅行调试（Vuex/Pinia）

const count = ref(0);
const user = reactive({ name: '张三' });

// DevTools中可以看到这个computed依赖了哪些响应式数据
const doubled = computed(() => count.value * 2);

// 可以追踪count变化时，哪些组件会重新渲染
</script>
```

#### React DevTools

React DevTools是React官方提供的开发工具，提供了组件树检查、Profiler、性能分析等功能。

```tsx
// React DevTools可以直观地看到：
// 1. 组件层级树
// 2. 每个组件的props、state、hooks
// 3. React Profiler's火焰图
// 4. 组件渲染次数和原因

function Counter() {
  const [count, setCount] = useState(0);

  // Profiler可以记录这个组件的渲染原因
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

### 7.3 SSR支持：Nuxt vs Next.js

Nuxt（Vue）和Next.js（React）是两个最流行的Meta-framework，它们都支持SSR、SSG、ISR等渲染模式。

#### Nuxt 3

Nuxt3是Vue3的Meta-framework，提供了自动导入、文件路由、SSR/SSG支持等特性。

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@nuxtjs/google-fonts',
  ],

  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { name: 'description', content: 'A Nuxt 3 application' }
      ],
    },
  },

  routeRules: {
    // SSR模式
    '/': { ssr: true },
    // 静态生成
    '/blog/**': { prerender: true },
    // ISR（增量静态再生成）
    '/products/**': { isr: 3600 },
    // SPA模式
    '/app/**': { ssr: false },
  },
});
```

```vue
<!-- pages/documents/[id].vue -->
<script setup lang="ts">
// Nuxt3的useRoute自动类型化
const route = useRoute();
const id = computed(() => route.params.id as string);

// useFetch自动处理数据获取和缓存
const { data: document, pending, error } = await useFetch(
  () => `/api/documents/${id.value}`,
  {
    watch: [id], // 响应式监听
    default: () => null,
  }
);

// SEO元信息
useSeoMeta({
  title: () => document.value?.title || '文档',
  ogTitle: () => document.value?.title,
  description: () => document.value?.excerpt,
});
</script>

<template>
  <div>
    <div v-if="pending">加载中...</div>
    <div v-else-if="error">加载失败</div>
    <article v-else-if="document">
      <h1>{{ document.title }}</h1>
      <div v-html="document.content" />
    </article>
  </div>
</template>
```

#### Next.js 14/15 (App Router)

Next.js是React的Meta-framework，React19的Server Components在Next.js App Router中得到完整支持。

```tsx
// app/documents/[id]/page.tsx
import { notFound } from 'next/navigation';
import { cache } from 'react';

// 缓存数据获取
const getDocument = cache(async (id: string) => {
  const response = await fetch(`${process.env.API_URL}/documents/${id}`);
  if (!response.ok) return null;
  return response.json();
});

// 服务端组件（默认）
export async function generateMetadata({ params }: { params: { id: string } }) {
  const document = await getDocument(params.id);

  if (!document) {
    return { title: '文档未找到' };
  }

  return {
    title: `${document.title} - FastDocument`,
    description: document.excerpt,
    openGraph: {
      title: document.title,
      images: [document.thumbnail],
    },
  };
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const document = await getDocument(params.id);

  if (!document) {
    notFound();
  }

  return (
    <article>
      <h1>{document.title}</h1>
      {/* 客户端组件作为子节点 */}
      <DocumentActions documentId={document.id} />
      <div dangerouslySetInnerHTML={{ __html: document.content }} />
    </article>
  );
}

// 客户端组件
'use client';

import { useState } from 'react';

function DocumentActions({ documentId }: { documentId: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '已赞' : '点赞'}
    </button>
  );
}
```

### 7.4 学习曲线对比

| 阶段 | Vue3 | React19 |
|------|------|---------|
| 入门门槛 | 低（文档友好） | 中等（概念较多） |
| 基础掌握 | 2-4周 | 3-6周 |
| 进阶精通 | 2-3月 | 3-6月 |
| 概念深度 | 需要理解响应式原理 | 需要理解渲染机制 |

**Vue3的优势**：

- 渐进式的API设计，从简单到复杂
- 中文文档质量极高，社区活跃
- 单文件组件格式对新手友好
- 响应式系统的"魔法"减少了样板代码

**React19的优势**：

- 生态极其庞大，学习资源丰富
- 社区多样性带来的最佳实践
- Server Components带来的新范式
- 跨平台能力（React Native）

---

## 八、选型建议

### 8.1 何时选择Vue3

Vue3是更"亲和"的选择，特别适合以下场景：

#### 中小型项目

对于功能相对单一、团队规模较小的项目，Vue3的开发效率优势明显。其响应式系统让开发者无需关心"什么时候更新"的问题，可以专注于业务逻辑。

```vue
<!-- 一个简单的TODO应用，用Vue3实现 -->
<script setup lang="ts">
import { ref, computed } from 'vue';

const todos = ref<Todo[]>([]);
const newTodo = ref('');

const completedCount = computed(() =>
  todos.value.filter(t => t.completed).length
);

function addTodo() {
  if (!newTodo.value.trim()) return;

  todos.value.push({
    id: Date.now(),
    text: newTodo.value,
    completed: false,
  });
  newTodo.value = '';
}

function removeTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id);
}
</script>

<template>
  <div class="todo-app">
    <h1>我的TODO</h1>
    <div class="add-todo">
      <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加新任务" />
      <button @click="addTodo">添加</button>
    </div>
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" v-model="todo.completed" />
        <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
    <p>已完成：{{ completedCount }} / {{ todos.length }}</p>
  </div>
</template>
```

#### 团队背景

如果团队成员主要来自中国，Vue3可能是更好的选择：

- 中文文档极其详细，易于学习
- 中国的Vue开发者社区非常活跃
- 大厂（如阿里巴巴、字节跳动）有大量Vue实践经验可供参考

#### 快速开发需求

时间紧迫的项目，Vue3的开发速度优势明显：

- 单文件组件格式直观易理解
- Composition API让代码复用简单高效
- Vite的快速刷新提升开发体验

#### 渐进式增强场景

如果你的项目需要从简单的页面逐步演变成复杂的应用，Vue3的渐进式架构完美匹配：

- 可以在现有页面中嵌入Vue组件
- 可以逐步将页面迁移到Vue
- 可以在Vue2和Vue3之间平滑过渡（通过迁移工具）

### 8.2 何时选择React19

React19是更"强大"的选择，特别适合以下场景：

#### 大型复杂应用

对于企业级大型应用，React的显式状态管理和虚拟DOM diff提供了更好的可预测性和可维护性。

```tsx
// 一个复杂的数据分析仪表盘，React实现
function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  // 数据获取
  const { data: metrics, isLoading } = useSWR(
    ['/api/analytics/metrics', dateRange],
    ([url, range]) => fetchAnalytics(url, range),
    { refreshInterval: 60000 }
  );

  // 计算图表数据
  const chartData = useMemo(() => {
    if (!metrics) return [];
    return processForChart(metrics.timeSeries);
  }, [metrics]);

  // 交互处理
  const handleZoom = useCallback((range: DateRange) => {
    startTransition(() => {
      setDateRange(range);
    });
  }, []);

  return (
    <DashboardLayout>
      <DateRangePicker
        value={dateRange}
        onChange={handleZoom}
      />

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsGrid metrics={metrics?.summary} />
      </Suspense>

      <Chart
        data={chartData}
        isLoading={isLoading}
      />
    </DashboardLayout>
  );
}
```

#### 跨平台开发需求

如果需要同时开发Web、移动端、PC端应用，React生态的跨平台方案（React Native、React Native Windows、React Native macOS）提供了最佳的开发体验。

#### 需要Server Components

如果你的应用需要大量的服务端数据获取和SEO优化，React19的Server Components配合Next.js可以提供最佳体验。

#### 团队技术栈统一

如果团队已经在使用React（比如使用React Native开发过移动端），选择React19可以保持技术栈统一，降低学习成本。

### 8.3 迁移成本分析

#### Vue2迁移到Vue3

迁移成本：**中等**

- Composition API可以逐步引入
- 官方提供了迁移工具（vue-migration-helper）
- 大部分Vue2代码在Vue3中仍然有效
- 需要学习Proxy响应式系统的差异
- 需要重写某些使用了Vue2特定API的代码

```typescript
// Vue2 到 Vue3 的典型迁移
// Vue2
export default {
  data() {
    return {
      count: 0,
    };
  },
  methods: {
    increment() {
      this.count++;
    },
  },
  computed: {
    doubled() {
      return this.count * 2;
    },
  },
};

// Vue3
export default {
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);

    function increment() {
      count.value++;
    }

    return { count, doubled, increment };
  },
};
```

#### React16/17迁移到React19

迁移成本：**较低**

- React19保持了向后兼容
- 新的API（如use()）是可选的
- Server Components需要新的思维方式
- 需要处理新的弃用警告

```tsx
// React 16/17 到 React 19 的典型迁移
// React 17
class UserProfile extends React.Component {
  state = { user: null };

  componentDidMount() {
    fetchUser(this.props.userId)
      .then(user => this.setState({ user }));
  }

  render() {
    return <div>{this.state.user?.name}</div>;
  }
}

// React 19
function UserProfile({ userId }) {
  // use()可以直接消费Promise
  const user = use(fetchUser(userId));
  return <div>{user.name}</div>;
}

// 或者使用Server Component（React 19 + Next.js）
async function UserProfile({ userId }) {
  const user = await fetchUser(userId);
  return <div>{user.name}</div>;
}
```

#### Vue3迁移到React19

迁移成本：**较高**

- 需要重新学习React的状态管理方式
- 组件模型完全不同（指令 vs JSX）
- 路由系统需要重新学习
- 状态管理库需要重新选择

#### React迁移到Vue3

迁移成本：**较高**

- 同样的重新学习成本
- JSX vs 模板语法需要适应
- 响应式系统vs状态驱动渲染的思维转换

### 8.4 最终选型决策树

```
开始
  │
  ├─ 是否是中小型项目？
  │    ├─ 是 → Vue3更适合
  │    └─ 否 → 继续判断
  │
  ├─ 是否需要跨平台开发（移动端/桌面端）？
  │    ├─ 是 → React更适合
  │    └─ 否 → 继续判断
  │
  ├─ 团队主要背景是？
  │    ├─ Vue社区 → Vue3更适合
  │    └─ React社区 → React更适合
  │
  ├─ 是否需要Server Components？
  │    ├─ 是 → React19 + Next.js
  │    └─ 否 → 继续判断
  │
  ├─ 项目时间紧迫吗？
  │    ├─ 是 → Vue3更适合（学习曲线更平缓）
  │    └─ 否 → 两者都可以，根据其他因素选择
  │
  └─ 结束
```

---

## 九、总结

Vue3和React19都是出色的前端框架，选择哪一个都不太可能"选错"。两者在过去几年里相互学习，差距越来越小：

- Vue3引入了Composition API，向React的函数式编程靠拢
- React引入了Hooks，向Vue的声明式响应式靠拢
- 两者都在向服务端渲染、编译器优化方向发展

作为2026年的全栈开发者，建议：

1. **两个框架都应该掌握**：这不仅能拓宽技术视野，还能在不同项目中有更多选择
2. **根据具体场景选择**：没有"最好"的框架，只有"最适合"的框架
3. **关注框架背后的思想**：理解响应式原理、组件模型、状态管理等核心概念，比学会某个API更重要
4. **持续学习**：前端框架演进迅速，保持对新技术的好奇心和学习的主动性

记住，框架只是工具，真正的核心是解决用户问题和创造价值的能力。掌握了核心概念后，切换框架的成本会比想象中低得多。

---

## 附录：快速对比表

| 维度 | Vue3 | React19 |
|------|------|---------|
| **核心团队** | Evan You + 社区 | Meta + 社区 |
| **首个版本** | 2014 | 2013 |
| **当前版本** | 3.5.x | 19.x |
| **响应式** | Proxy自动追踪 | setState触发重渲染 |
| **组件格式** | SFC（.vue）| JSX/TSX |
| **状态管理** | Pinia / Vuex | Zustand / Redux Toolkit |
| **路由** | Vue Router 4 | React Router 6/7 |
| **SSR框架** | Nuxt 3 | Next.js 14/15 |
| **学习曲线** | 较平缓 | 较陡峭 |
| **TypeScript** | 原生支持 | 原生支持 |
| **包体积** | ~22KB | ~45KB |
| **生态规模** | 中等 | 庞大 |

---

*本指南最后更新于2026年4月。随着框架版本的迭代，部分内容可能会过时，建议读者关注官方文档获取最新信息。*
