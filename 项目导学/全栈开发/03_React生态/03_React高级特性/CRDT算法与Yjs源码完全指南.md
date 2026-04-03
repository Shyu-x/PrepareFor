# CRDT算法与Yjs源码完全指南

## 概述

本文档深入解析CRDT（Conflict-free Replicated Data Type，无冲突复制数据类型）算法的数学基础，以及Yjs这一业界最成熟的CRDT实现库的内部原理与实战应用。

**CRDT版本信息**（项目实际使用）：
- Yjs: ^13.6.29
- y-websocket: ^2.0.4
- y-indexeddb: ^9.0.12
- @hocuspocus/provider: ^3.4.4

**文档字数**：约20000字
**代码示例**：30+个完整示例

---

## 一、协同编辑背景与问题

### 1.1 传统OT算法的困境

**OT（Operational Transformation，操作转换）** 是Google Docs早期使用的协同算法。OT的核心思想是将本地操作转换为服务器认可的"标准操作"，再广播给其他客户端。

```typescript
// OT操作示例：用户A和用户B同时编辑"Hello"文本
// 假设初始文本为 "Hello"

// 用户A：在位置0插入 "X"，变为 "XHello"
// 用户B：在位置5插入 "Y"，变为 "HelloY"

// OT服务器需要"转换"操作：
// A的操作是 insert(0, "X")
// B的操作是 insert(5, "Y")
// 由于A在B之前执行，B的插入位置需要调整为 insert(6, "Y")

// 问题：
// 1. 如果服务器处理顺序不同，结果可能不一致
// 2. 转换逻辑复杂，边界情况众多
// 3. 无法离线操作，一旦断线就需要重新同步
```

**OT的核心问题**：

| 问题 | 描述 | 影响 |
|------|------|------|
| **服务器瓶颈** | 所有操作必须经过服务器转换 | 难以横向扩展 |
| **转换复杂性** | n个客户端需要O(n²)的转换复杂度 | 难以维护 |
| **离线不支持** | 断线后需要重新同步 | 用户体验差 |
| **正确性证明难** | OT的正确性长期存在争议 | 线上曾出现数据不一致 |

### 1.2 CRDT的诞生

**CRDT（Conflict-free Replicated Data Type）** 由Marc Shapiro等人于2011年提出，是一种数学上证明可以解决分布式一致性的数据结构。

**CRDT的核心理念**：
- **去中心化**：不需要中央服务器协调
- **最终一致**：所有副本最终会收敛到相同状态
- **离线优先**：支持离线操作，网络恢复后自动同步

```
传统OT架构：
[客户端A] ---操作---> [服务器] ---转换后操作---> [客户端B]
                        ↑
[客户端C] ---------------|

CRDT架构：
[客户端A] <---广播差异---> [客户端B]
    ↑                          ↑
    └───────广播差异────────────┘
```

### 1.3 为什么选择Yjs

**Yjs**是目前最成熟的JavaScript/TypeScript CRDT实现，被众多知名项目采用：

| 项目 | 用途 |
|------|------|
| **FastDocument** | 文档协作编辑器 |
| **WebEnv-OS** | 代码编辑器协作 |
| **Notion** | 文档编辑（曾用） |
| **Liveblocks** | 实时协作SDK |
| **BlockSuite** | AFFiNE编辑器核心 |

**Yjs的优势**：

```typescript
// 1. 丰富的共享数据类型
import * as Y from 'yjs';

// 文档类型
const doc = new Y.Doc();           // 文档容器
const text = doc.getText('content');     // 共享文本
const array = doc.getArray('items');     // 共享数组
const map = doc.getMap('meta');           // 共享Map

// 2. 优秀的性能
// Yjs使用高效的CRDT算法实现，支持数万人同时编辑

// 3. 完善的生态系统
// y-websocket: WebSocket同步
// y-indexeddb: 离线持久化
// @hocuspocus/provider: 商业级协作服务器
// y-monaco: Monaco编辑器集成
// @tiptap/extension-collaboration: Tiptap编辑器集成
```

---

## 二、CRDT数学基础

### 2.1 Join半格理论（Join-Semilattice）

**半格**是CRDT的数学基础。简单理解，半格是一种偏序集合，其中任意两个元素都有一个唯一的**上确界（Join）**。

```typescript
/**
 * Join半格的数学定义：
 * 对于集合S和偏序关系≤，如果对于任意x,y∈S：
 * 1. x ≤ join(x,y)  （可交换）
 * 2. y ≤ join(x,y)  （可交换）
 * 3. 如果x≤z且y≤z，则join(x,y) ≤ z  （最小上界）
 */

// 例：集合版本的半格
// {1,2,3} 中，join(1,2) = 3

// Yjs中的半格应用：
// 每个客户端维护一个"版本向量"，合并时取每个维度的最大值
interface VersionVector {
  [clientId: number]: number;
}

function mergeVersionVectors(v1: VersionVector, v2: VersionVector): VersionVector {
  const result: VersionVector = { ...v1 };
  for (const [clientId, clock] of Object.entries(v2)) {
    result[clientId] = Math.max(result[clientId] || 0, clock);
  }
  return result;
}

// 示例：
const v1 = { A: 1, B: 2 };
const v2 = { A: 2, B: 1 };
const merged = mergeVersionVectors(v1, v2);
// merged = { A: 2, B: 2 }
// 两个版本向量最终会收敛到相同的状态
```

### 2.2 可交换性（Commutative）

**可交换性**意味着操作的执行顺序不影响最终结果。

```typescript
/**
 * 如果 opA ∘ opB = opB ∘ opA（最终结果相同）
 * 则这两个操作是可交换的
 */

// 例子：向量时钟合并
// opA: { A: 1, B: 0 }
// opB: { A: 0, B: 1 }
// 无论先应用哪个，最终都是 { A: 1, B: 1 }

// Yjs中的文本插入操作
// 插入操作只需要指定位置和内容，不依赖执行顺序
class YText {
  insert(index: number, content: string, attributes?: object) {
    // 插入操作可以任意顺序执行
    // 最终文本内容都是一致的
  }
}
```

### 2.3 幂等性（Idempotent）

**幂等性**意味着重复应用同一操作不会改变结果。

```typescript
/**
 * idempotent: f(f(x)) = f(x)
 * 重复应用同一操作得到相同结果
 */

// 例子：Set（集合）的并集操作
// {1,2} ∪ {2,3} = {1,2,3}
// {1,2,3} ∪ {2,3} = {1,2,3}  （重复应用结果相同）

// Yjs中的删除操作
class YArray<T> {
  delete(index: number, length: number) {
    // 删除已经删除的内容是安全的
    // 重复删除不会报错
  }
}

// G-Counter的实现
class GCounter {
  private state: { [nodeId: number]: number } = {};

  increment(nodeId: number) {
    this.state[nodeId] = (this.state[nodeId] || 0) + 1;
  }

  merge(other: { [nodeId: number]: number }) {
    // 取每个节点的最大值
    for (const [id, value] of Object.entries(other)) {
      this.state[id] = Math.max(this.state[id] || 0, value);
    }
  }

  get value(): number {
    return Object.values(this.state).reduce((sum, v) => sum + v, 0);
  }
}

// 使用示例
const counter1 = new GCounter();
counter1.increment('A'); // state: { A: 1 }
counter1.increment('A'); // state: { A: 2 }

const counter2 = new GCounter();
counter2.increment('B'); // state: { B: 1 }
counter2.increment('B'); // state: { B: 2 }
counter2.increment('B'); // state: { B: 3 }

counter1.merge(counter2.state);
// counter1.state = { A: 2, B: 3 }
// counter1.value = 5
```

### 2.4 结合性（Associative）

**结合性**意味着操作的分组不影响结果。

```typescript
/**
 * associative: (a ∘ b) ∘ c = a ∘ (b ∘ c)
 */

// 例子：多个G-Counter合并
const counter1 = new GCounter();
counter1.increment('A');

const counter2 = new GCounter();
counter2.increment('B');

const counter3 = new GCounter();
counter3.increment('C');

const merged1 = new GCounter();
merged1.merge(counter1.state);
merged1.merge(counter2.state);
merged1.merge(counter3.state);

const merged2 = new GCounter();
merged2.merge({ ...counter1.state, ...counter2.state, ...counter3.state });

// merged1.value === merged2.value
// 无论怎样分组，最终结果一致
```

### 2.5 CRDT三大特性总结

```
┌─────────────────────────────────────────────────────────────┐
│                      CRDT 三大特性                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   可交换性 (Commutative)     f(a,b) = f(b,a)                │
│         ↓                                                       │
│   幂等性 (Idempotent)       f(f(x)) = f(x)                   │
│         ↓                                                       │
│   结合性 (Associative)     f(f(a,b),c) = f(a,f(b,c))        │
│                                                             │
│   满足以上三个特性 → 最终一致性                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、基础CRDT数据结构

### 3.1 G-Counter（只增计数器）

**G-Counter**（Grow-only Counter）是一种只能递增的计数器。每个节点维护自己的计数器，合并时取各节点的最大值。

```typescript
/**
 * G-Counter 算法原理
 *
 * 1. 每个节点有一个本地计数器 Pi
 * 2. increment(nodeId) 使 Pi[nodeId]++
 * 3. value = sum(Pi)
 * 4. merge(other) = max(Pi[nodeId], other[nodeId]) for all nodes
 */

// 完整实现
class GCounter {
  // 状态：每个节点一个计数器
  private state: Map<number, number> = new Map();

  /**
   * 增加指定节点的计数器
   */
  increment(nodeId: number): void {
    const current = this.state.get(nodeId) || 0;
    this.state.set(nodeId, current + 1);
  }

  /**
   * 获取当前计数值（所有节点之和）
   */
  get value(): number {
    let sum = 0;
    for (const count of this.state.values()) {
      sum += count;
    }
    return sum;
  }

  /**
   * 合并另一个节点的状态
   * 数学原理：取每个节点的最大值
   */
  merge(other: Map<number, number>): void {
    for (const [nodeId, count] of other.entries()) {
      const current = this.state.get(nodeId) || 0;
      this.state.set(nodeId, Math.max(current, count));
    }
  }

  /**
   * 获取每个节点的详细计数
   */
  toJSON(): object {
    return Object.fromEntries(this.state);
  }
}

// 使用示例
const counter = new GCounter();

counter.increment(1); // 节点1: +1
counter.increment(1); // 节点1: +1
counter.increment(2); // 节点2: +1
counter.increment(2); // 节点2: +1
counter.increment(2); // 节点2: +1

console.log(counter.value); // 5

// 模拟网络分区后的合并
const counterA = new GCounter();
counterA.increment(1);
counterA.increment(1);

const counterB = new GCounter();
counterB.increment(2);
counterB.increment(2);
counterB.increment(2);

console.log('A:', counterA.value); // 2
console.log('B:', counterB.value); // 3

// 合并
counterA.merge(counterB.state);
console.log('After merge:', counterA.value); // 5
```

### 3.2 PN-Counter（增减计数器）

**PN-Counter**（Positive-Negative Counter）支持递增和递减操作。它由两个G-Counter组成：P（正数）和N（负数）。

```typescript
/**
 * PN-Counter 算法原理
 *
 * 1. 维护两个G-Counter：P（增）和N（减）
 * 2. increment(nodeId) → P.increment(nodeId)
 * 3. decrement(nodeId) → N.increment(nodeId)
 * 4. value = P.value - N.value
 * 5. merge时分别merge P和N
 */

// 完整实现
class PNCounter {
  private p: Map<number, number> = new Map(); // 正计数器
  private n: Map<number, number> = new Map(); // 负计数器

  /**
   * 递增指定节点的计数器
   */
  increment(nodeId: number, amount: number = 1): void {
    for (let i = 0; i < amount; i++) {
      const current = this.p.get(nodeId) || 0;
      this.p.set(nodeId, current + 1);
    }
  }

  /**
   * 递减指定节点的计数器
   */
  decrement(nodeId: number, amount: number = 1): void {
    for (let i = 0; i < amount; i++) {
      const current = this.n.get(nodeId) || 0;
      this.n.set(nodeId, current + 1);
    }
  }

  /**
   * 获取当前值 = 正数之和 - 负数之和
   */
  get value(): number {
    const pSum = Array.from(this.p.values()).reduce((sum, v) => sum + v, 0);
    const nSum = Array.from(this.n.values()).reduce((sum, v) => sum + v, 0);
    return pSum - nSum;
  }

  /**
   * 合并两个PN-Counter
   * 分别合并P和N的G-Counter
   */
  merge(otherP: Map<number, number>, otherN: Map<number, number>): void {
    // 合并P
    for (const [nodeId, count] of otherP.entries()) {
      const current = this.p.get(nodeId) || 0;
      this.p.set(nodeId, Math.max(current, count));
    }
    // 合并N
    for (const [nodeId, count] of otherN.entries()) {
      const current = this.n.get(nodeId) || 0;
      this.n.set(nodeId, Math.max(current, count));
    }
  }
}

// 使用示例
const counter = new PNCounter();

counter.increment(1, 5); // 节点1: +5
counter.increment(2, 3); // 节点2: +3
counter.decrement(1, 2); // 节点1: -2

console.log(counter.value); // 5 + 3 - 2 = 6

// 分布式合并示例
const counterA = new PNCounter();
counterA.increment(1, 10);
counterA.decrement(2, 3);

const counterB = new PNCounter();
counterB.increment(1, 2);
counterB.increment(3, 5);
counterB.decrement(1, 1);

console.log('A value:', counterA.value); // 10 - 3 = 7
console.log('B value:', counterB.value); // (2-1) + 5 = 6

// 模拟合并（实际上Yjs会处理）
counterA.merge(counterB.p, counterB.n);
console.log('After merge:', counterA.value); // 10 + 2 - 3 - 1 + 5 = 13
```

### 3.3 LWW-Register（最后写入胜出）

**LWW-Register**（Last-Writer-Wins Register）使用时间戳或版本向量来决定哪个值优先。

```typescript
/**
 * LWW-Register 算法原理
 *
 * 1. 每个值附带一个时间戳或版本号
 * 2. merge时，比较时间戳，较大的胜出
 * 3. 相同时间戳时，使用节点ID作为tie-breaker
 */

// LWW-Register 实现
interface LWWEntry<T> {
  value: T;
  timestamp: number;
  nodeId: number; // 用于时间戳相同时的决胜
}

class LWWRegister<T> {
  private state: LWWEntry<T> | null = null;

  /**
   * 设置值（使用当前时间戳）
   */
  set(value: T, timestamp?: number, nodeId?: number): void {
    const ts = timestamp || Date.now();
    const nid = nodeId || Math.random();
    this.state = { value, timestamp: ts, nodeId: nid };
  }

  /**
   * 获取当前值
   */
  get(): T | undefined {
    return this.state?.value;
  }

  /**
   * 合并：时间戳大的胜出
   */
  merge(other: LWWEntry<T>): void {
    if (!this.state) {
      this.state = other;
      return;
    }

    // 比较时间戳
    if (
      other.timestamp > this.state.timestamp ||
      (other.timestamp === this.state.timestamp && other.nodeId > this.state.nodeId)
    ) {
      this.state = other;
    }
  }

  /**
   * 获取完整状态（用于调试）
   */
  toJSON(): LWWEntry<T> | null {
    return this.state;
  }
}

// 使用示例
const register = new LWWRegister<string>();

// 模拟三个节点的并发写入
const nodeA = { timestamp: 1000, nodeId: 1 };
const nodeB = { timestamp: 2000, nodeId: 2 };
const nodeC = { timestamp: 2000, nodeId: 3 };

register.set('Hello from A', nodeA.timestamp, nodeA.nodeId);
console.log('After A writes:', register.get()); // "Hello from A"

register.merge({ value: 'Hello from B', timestamp: nodeB.timestamp, nodeId: nodeB.nodeId });
console.log('After B writes:', register.get()); // "Hello from B" (timestamp更大)

// 时间戳相同时，nodeId大的胜出
register.merge({ value: 'Hello from C', timestamp: nodeC.timestamp, nodeId: nodeC.nodeId });
console.log('After C writes:', register.get()); // "Hello from C" (timestamp相同但nodeId更大)

// 实际应用：文档标题的协同编辑
class DocumentTitle {
  private register = new LWWRegister<string>();

  update(title: string): void {
    this.register.set(title);
  }

  getTitle(): string {
    return this.register.get() || 'Untitled';
  }

  merge(other: LWWEntry<string>): void {
    this.register.merge(other);
  }
}
```

### 3.4 OR-Set（可移除集合）

**OR-Set**（Observed-Remove Set）是一种支持添加和移除操作的集合。

```typescript
/**
 * OR-Set 算法原理
 *
 * 1. 每个元素有一个唯一的tag
 * 2. add(element) → 添加 (element, uniqueTag)
 * 3. remove(element) → 标记该element的所有tag为"removed"
 * 4. query → 返回所有未被移除的(element, tags)
 * 5. merge → 合并所有tags，取差集
 */

// OR-Set 实现
interface ORSetEntry<T> {
  tags: Set<string>; // 所有添加过的tag
  removed: Set<string>; // 已移除的tag
}

class ORSet<T> {
  private state: Map<T, ORSetEntry<T>> = new Map();

  /**
   * 添加元素（使用唯一标签）
   */
  add(element: T): string {
    const tag = `${element}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!this.state.has(element)) {
      this.state.set(element, { tags: new Set(), removed: new Set() });
    }

    const entry = this.state.get(element)!;
    entry.tags.add(tag);

    return tag;
  }

  /**
   * 移除元素（标记为已删除）
   */
  remove(element: T, tag?: string): void {
    const entry = this.state.get(element);
    if (!entry) return;

    if (tag) {
      // 移除特定tag
      entry.removed.add(tag);
    } else {
      // 移除所有tag（全部标记为删除）
      for (const t of entry.tags) {
        entry.removed.add(t);
      }
    }
  }

  /**
   * 查询：返回所有未被移除的元素
   */
  query(): T[] {
    const result: T[] = [];
    for (const [element, entry] of this.state.entries()) {
      // 找出未被移除的tag
      const aliveTags = new Set([...entry.tags].filter(t => !entry.removed.has(t)));
      if (aliveTags.size > 0) {
        result.push(element);
      }
    }
    return result;
  }

  /**
   * 合并两个OR-Set
   * union of tags, union of removed
   */
  merge(other: Map<T, ORSetEntry<T>>): void {
    for (const [element, otherEntry] of other.entries()) {
      if (!this.state.has(element)) {
        this.state.set(element, {
          tags: new Set(otherEntry.tags),
          removed: new Set(otherEntry.removed)
        });
      } else {
        const entry = this.state.get(element)!;
        // 合并tags（取并集）
        for (const tag of otherEntry.tags) {
          entry.tags.add(tag);
        }
        // 合并removed（取并集）
        for (const tag of otherEntry.removed) {
          entry.removed.add(tag);
        }
      }
    }
  }

  /**
   * 获取元素的详细信息
   */
  getElementInfo(element: T): { alive: boolean; tags: string[] } | null {
    const entry = this.state.get(element);
    if (!entry) return null;

    const aliveTags = new Set([...entry.tags].filter(t => !entry.removed.has(t)));
    return {
      alive: aliveTags.size > 0,
      tags: Array.from(entry.tags)
    };
  }
}

// 使用示例
const set = new ORSet<string>();

// 添加元素
const tag1 = set.add('Apple');
const tag2 = set.add('Banana');
const tag3 = set.add('Cherry');

console.log('After add:', set.query()); // ['Apple', 'Banana', 'Cherry']

// 移除元素
set.remove('Banana');
console.log('After remove Banana:', set.query()); // ['Apple', 'Cherry']

// 重新添加Banana（会创建新的tag）
const tag4 = set.add('Banana');
console.log('After re-add Banana:', set.query()); // ['Apple', 'Cherry', 'Banana']

// 分布式合并场景
const setA = new ORSet<string>();
setA.add('X');
setA.add('Y');
setA.remove('X');

const setB = new ORSet<string>();
setB.add('Y');
setB.add('Z');
setB.remove('Y');

const setAClone = new ORSet<string>();
setAClone.add('X');
setAClone.add('Y');

const setBClone = new ORSet<string>();
setBClone.add('Y');
setBClone.add('Z');
setBClone.remove('Y');

// 模拟合并
setAClone.merge(setB.state);
console.log('After merge:', setAClone.query()); // ['Z']
```

---

## 四、Yjs核心原理

### 4.1 Y.Doc文档容器

**Y.Doc**是Yjs的核心文档容器，类似于一个本地数据库，管理所有的共享数据类型。

```typescript
/**
 * Y.Doc 核心概念
 *
 * Y.Doc是Yjs的根对象，类似一个容器仓库
 * - 每个Y.Doc有一个唯一的clientID
 * - Y.Doc管理多种共享数据类型：Y.Text, Y.Array, Y.Map, Y.XmlFragment
 * - 所有操作都通过Y.Doc进行，保证事务性
 */

import * as Y from 'yjs';

// 创建新文档
const doc = new Y.Doc();

// 获取唯一的客户端ID（基于随机数生成）
console.log('ClientID:', doc.clientID); // 一个唯一的数字

// 获取或创建共享类型
const text = doc.getText('content');       // 共享文本
const array = doc.getArray('items');       // 共享数组
const map = doc.getMap('meta');            // 共享Map
const xmlFragment = doc.getXmlFragment('xml'); // XML片段

// 使用事务进行原子操作
doc.transact(() => {
  text.insert(0, 'Hello');
  array.insert(0, ['World']);
  map.set('author', '张三');
});

// 监听文档变化
doc.on('update', (update: Uint8Array, origin: any) => {
  console.log('Document updated, size:', update.length);
  // update 是增量更新，使用 Y.encodeStateAsUpdate 可以获取完整状态
});

// 销毁文档
doc.destroy();
```

### 4.2 Y.Text共享文本

**Y.Text**是Yjs的文本类型，支持字符级别的精确操作和协同编辑。

```typescript
/**
 * Y.Text 核心原理
 *
 * Y.Text内部使用一种称为"rope text"的数据结构
 * - 文本被分成多个片段存储
 * - 每个片段有唯一的位置标识
 * - 插入/删除操作通过位置标识而非绝对位置
 */

// 基本操作
const doc = new Y.Doc();
const text = doc.getText('content');

// 插入文本
text.insert(0, 'Hello');  // 在位置0插入
text.insert(5, ' World');  // 在位置5插入
console.log(text.toString()); // "Hello World"

// 删除文本
text.delete(0, 5);  // 删除位置0-4的5个字符
console.log(text.toString()); // " World"

// 替换文本（先删后插）
text.delete(0, text.length);
text.insert(0, 'New Content');
console.log(text.toString()); // "New Content"

// 格式化文本（保留属性）
text.insert(0, 'Bold Text', { bold: true });
console.log(text.getAttributes(0)); // { bold: true }

// 监听变化
text.observe((event) => {
  console.log('Changes:', event.delta);
  // delta 包含操作详情
});

// 使用事务
doc.transact(() => {
  text.delete(0, text.length);
  text.insert(0, 'Transactional content');
});

// Yjs与实际项目结合示例（来自 tiptap-collab.ts）
/**
 * Tiptap 编辑器协作服务
 * 使用 Yjs 实现无冲突的实时协作编辑
 */
import { Editor } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

// 创建 Yjs 文档
const ydoc = new Y.Doc();

// 连接到 Hocuspocus 协作服务器
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: 'document-id',
  document: ydoc,
});

// 配置 Tiptap 协作扩展
const editor = new Editor({
  element: document.querySelector('#editor')!,
  extensions: [
    Collaboration.configure({
      document: ydoc,
    }),
  ],
});
```

### 4.3 Y.Array共享数组

**Y.Array**是Yjs的数组类型，支持任意JavaScript对象的共享。

```typescript
/**
 * Y.Array 核心原理
 *
 * Y.Array内部使用一种基于序列CRDT的实现
 * - 每个元素有唯一的位置ID
 * - 插入/删除操作通过位置ID而非索引
 * - 支持任意深度嵌套结构
 */

const doc = new Y.Doc();
const array = doc.getArray('items');

// 插入元素
array.insert(0, ['apple', 'banana']);  // 在开头插入
array.insert(2, ['cherry']);            // 在索引2插入
console.log(array.toArray()); // ['apple', 'banana', 'cherry']

// 追加元素
array.push(['date']);  // 追加到末尾
console.log(array.toArray()); // ['apple', 'banana', 'cherry', 'date']

// 删除元素
array.delete(1, 1);  // 删除索引1开始的1个元素
console.log(array.toArray()); // ['apple', 'cherry', 'date']

// 移动元素
const item = array.get(0);  // 获取元素
array.delete(0, 1);          // 删除原位置
array.insert(2, [item]);    // 插入新位置

// 监听变化
array.observe((event) => {
  console.log('Array changed:');
  console.log('  Delta:', event.delta);
  console.log('  Target:', event.target === array);
});

// 深度嵌套操作
const nestedArray = doc.getArray('nested');
nestedArray.insert(0, [
  { type: 'paragraph', content: 'Hello' },
  { type: 'paragraph', content: 'World' },
]);

// 项目实战：在documentStore中的使用
// 来自 FastDocument frontend/src/store/documentStore.ts
/**
 * Yjs 协作方法
 */
connectYjs: async (docId: string) => {
  // 获取Yjs文档实例
  const ydoc = yjsManager.getCurrentDoc();
  if (!ydoc) return;

  // 获取块数组
  const blocksArray = ydoc.getArray('blocks');

  // 监听块变化
  blocksArray.observe((event) => {
    // 将Yjs变化同步到React状态
    get().syncFromYjs();
  });
},

// 添加块
addBlock: (type: Block["type"], afterId?: string) => {
  const blocks = getBlocksArray();
  if (!blocks) return;

  const newBlock = { id: generateId(), type, content: '' };

  if (!afterId) {
    blocks.push([newBlock]);
  } else {
    const index = blocks.toArray().findIndex(b => b.id === afterId);
    blocks.insert(index + 1, [newBlock]);
  }
},
```

### 4.4 Y.Map共享Map

**Y.Map**是Yjs的键值存储，类似于普通JavaScript对象。

```typescript
/**
 * Y.Map 核心原理
 *
 * Y.Map内部使用一种称为"Yrs Map"的CRDT实现
 * - 每个键值对有唯一的版本号
 * - 合并时取最新版本的值
 * - 支持任意类型的值
 */

const doc = new Y.Doc();
const map = doc.getMap('meta');

// 设置值
map.set('title', 'My Document');
map.set('author', { name: '张三', id: 1 });
map.set('count', 42);
console.log(map.toJSON());
// { title: 'My Document', author: { name: '张三', id: 1 }, count: 42 }

// 获取值
console.log(map.get('title')); // 'My Document'
console.log(map.has('author')); // true

// 删除值
map.delete('count');
console.log(map.has('count')); // false

// 遍历
map.forEach((value, key) => {
  console.log(`${key}:`, value);
});

// 监听变化
map.observe((event) => {
  console.log('Keys changed:', event.keysChanged);
  console.log('Transaction:', event.transaction);
});

// 项目实战：在WebEnv-OS中的使用
// 来自 collaborationService.ts
class CollaborationService {
  getMap(name: string): Y.Map<any> | null {
    return this.doc?.getMap(name) || null;
  }

  // 用于共享用户信息
  updateUserInfo(user: CollaborationUser) {
    const map = this.getMap('users');
    if (map) {
      map.set(user.id, {
        name: user.name,
        color: user.color,
        cursor: user.cursor,
      });
    }
  }
}

// 获取在线用户
getUsers(): CollaborationUser[] {
  const map = this.getMap('users');
  if (!map) return [];

  const users: CollaborationUser[] = [];
  map.forEach((value) => {
    users.push(value as CollaborationUser);
  });
  return users;
}
```

### 4.5 Y.XmlFragment与嵌套结构

**Y.XmlFragment**用于存储XML/JSON混合的嵌套结构，如富文本编辑器内容。

```typescript
/**
 * Y.XmlFragment 用于复杂嵌套结构
 *
 * 在Yjs中，Y.XmlFragment是存储结构化文档的核心类型
 * - 类似DOM树的结构
 * - 每个节点可以是元素、文本或属性
 * - 支持任意深度的嵌套
 */

const doc = new Y.Doc();
const fragment = doc.getXmlFragment('content');

// Yjs提供了XmlElement和XmlText来处理XML结构
const XmlElement = Y.XmlElement;
const XmlText = Y.XmlText;

// 创建XML元素
const paragraph = new XmlElement('paragraph');
paragraph.addAttribute('style', 'heading');

// 添加文本子节点
const text = new XmlText();
text.insert(0, 'Hello World', { bold: true });
paragraph.insert(0, [text]);

// 添加到fragment
fragment.insert(0, [paragraph]);

// 监听变化
fragment.observe((event) => {
  console.log('XML changed:', event.target);
});

// 实际应用：Tiptap编辑器的内容存储
// Tiptap使用Prosemirror模型，Yjs负责CRDT同步
/**
 * Collaboration extension 配置
 */
Collaboration.configure({
  document: ydoc,
  field: 'content', // 对应 XmlFragment 的名称
})

// 监听协作光标
CollaborationCursor.configure({
  provider: hocuspocusProvider,
  user: {
    name: 'User Name',
    color: '#ff0000',
  },
})
```

---

## 五、Yjs内部实现

### 5.1 GC垃圾回收机制

Yjs使用垃圾回收来清理不再需要的旧版本数据。

```typescript
/**
 * Yjs GC（垃圾回收）原理
 *
 * 1. Yjs维护一个"删除日志"（DeleteLog）
 * 2. 当元素被删除时，只标记为删除，不立即删除
 * 3. GC时，根据版本历史判断是否可以真正删除
 * 4. 所有客户端都确认不需要旧数据后，才清理
 */

// 开启/关闭GC
const doc = new Y.Doc({
  gc: true, // 默认开启
});

// 当GC关闭时，已删除的元素会保留在状态中
// 这在需要"撤销删除"功能时很有用

// 项目实战：离线支持
// y-indexeddb 会存储完整状态，包括已删除的内容
import { IndexeddbPersistence } from 'y-indexeddb';

const persistence = new IndexeddbPersistence('document-id', doc);

persistence.on('synced', () => {
  console.log('从IndexedDB加载完成');
  // 此时本地副本包含所有历史状态
});

// 何时需要关闭GC
// - 实现"文档历史"功能
// - 需要撤销删除操作
// - 审计/合规要求保留所有版本
```

### 5.2 持久化与状态导出

Yjs支持将状态导出为二进制格式，便于持久化和传输。

```typescript
/**
 * Yjs 状态持久化
 *
 * Yjs提供多种编码/解码函数：
 * - Y.encodeStateAsUpdate: 获取增量更新
 * - Y.encodeStateVector: 获取状态向量
 * - Y.applyUpdate: 应用更新
 * - Y.mergeUpdates: 合并多个更新
 */

const doc = new Y.Doc();
const text = doc.getText('content');

// 添加内容
text.insert(0, 'Hello');

// 编码状态
const stateAsUpdate = Y.encodeStateAsUpdate(doc);
console.log('State as update (bytes):', stateAsUpdate);

// 状态向量（用于同步）
const stateVector = Y.encodeStateVector(doc);
console.log('State vector:', stateVector);

// 创建新文档并应用更新
const doc2 = new Y.Doc();
Y.applyUpdate(doc2, stateAsUpdate);
console.log('Doc2 content:', doc2.getText('content').toString());

// 合并多个更新
const update1 = Y.encodeStateAsUpdate(doc);
doc.getText('content').insert(5, ' World');
const update2 = Y.encodeStateAsUpdate(doc);

const merged = Y.mergeUpdates([update1, update2]);

const doc3 = new Y.Doc();
Y.applyUpdate(doc3, merged);
console.log('Doc3 content:', doc3.getText('content').toString());

// 项目实战：保存到服务器
// 来自 tiptap-collab.ts
async function saveToServer(docId: string) {
  const ydoc = yjsManager.getCurrentDoc();
  if (!ydoc) return;

  const state = Y.encodeStateAsUpdate(ydoc);
  const base64 = btoa(String.fromCharCode(...state));

  await fetch(`/api/documents/${docId}`, {
    method: 'PUT',
    body: JSON.stringify({ crdtState: base64 }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// 从服务器加载
async function loadFromServer(docId: string) {
  const response = await fetch(`/api/documents/${docId}`);
  const { crdtState } = await response.json();

  const binary = Uint8Array.from(atob(crdtState), c => c.charCodeAt(0));
  Y.applyUpdate(ydoc, binary);
}
```

### 5.3 WebsocketProvider远程同步

Yjs通过Provider实现网络同步，WebsocketProvider是最常用的实现。

```typescript
/**
 * WebsocketProvider 原理
 *
 * 1. 建立WebSocket连接
 * 2. 交换状态向量（State Vector）
 * 3. 交换增量更新（Delta）
 * 4. 实时同步所有更新
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 创建文档
const doc = new Y.Doc();
const text = doc.getText('content');

// 创建Provider
const provider = new WebsocketProvider(
  'ws://localhost:1234', // 服务器地址
  'room-name',           // 房间名
  doc,                    // Yjs文档
  { connect: true }       // 选项
);

// 监听连接状态
provider.on('status', (event: { status: string }) => {
  console.log('Connection status:', event.status);
  // 'connecting', 'connected', 'disconnected'
});

// 监听同步状态
provider.on('sync', (isSynced: boolean) => {
  console.log('Sync status:', isSynced);
  // true 表示已同步完成
});

// Awareness：用户状态同步
const awareness = provider.awareness;

// 设置本地用户信息
awareness.setLocalState({
  user: {
    id: 'user-1',
    name: '张三',
    color: '#ff0000',
  },
  cursor: {
    anchor: 10,
    head: 15,
  },
});

// 监听其他用户状态变化
awareness.on('change', () => {
  const states = awareness.getStates();
  states.forEach((state, clientId) => {
    if (clientId !== awareness.clientID) {
      console.log('User:', state.user);
      console.log('Cursor:', state.cursor);
    }
  });
});

// 断开连接
provider.disconnect();
provider.destroy();

// 项目实战：完整的协作连接
// 来自 webenv-os/src/lib/collaboration/yjs-provider.ts
export function createYjsProvider(options: YjsProviderOptions) {
  const { serverUrl, roomId, user } = options;

  // 创建Yjs文档
  const doc = new Y.Doc();
  const yText = doc.getText('content');

  // 创建WebSocket Provider
  const provider = new WebsocketProvider(
    serverUrl,
    `webenv-collab-${roomId}`,
    doc,
    { connect: true }
  );

  // 设置用户Awareness
  const awareness = provider.awareness;
  awareness.setLocalState({
    user: {
      id: user.id,
      name: user.name,
      color: user.color,
    },
  });

  // 监听连接状态
  provider.on('status', ({ status }) => {
    options.onConnectionChange?.(status);
  });

  // 监听同步完成
  provider.on('sync', (isSynced: boolean) => {
    if (isSynced) {
      options.onSync?.();
    }
  });

  // 监听文本变化
  yText.observe((event) => {
    options.onTextChange?.(yText.toString());
  });

  // 监听Awareness变化
  awareness.on('change', () => {
    const states = awareness.getStates();
    states.forEach((state, clientId) => {
      if (clientId !== awareness.clientID) {
        options.onUserJoin?.(state.user);
      }
    });
  });

  return {
    doc,
    yText,
    provider,
    awareness,

    // 更新文本
    insertText: (index: number, content: string) => {
      yText.insert(index, content);
    },

    // 删除文本
    deleteText: (index: number, length: number) => {
      yText.delete(index, length);
    },

    // 更新光标
    updateCursor: (cursor: { line: number; column: number }) => {
      const current = awareness.getLocalState();
      awareness.setLocalState({ ...current, cursor });
    },

    // 销毁
    destroy: () => {
      provider.disconnect();
      provider.destroy();
      doc.destroy();
    },
  };
}
```

### 5.4 增量更新与Diff算法

Yjs的核心优势之一是高效的增量更新机制。

```typescript
/**
 * Yjs 增量更新原理
 *
 * 传统方式：每次修改发送完整文档
 * Yjs方式：只发送操作差异（Delta）
 *
 * 核心数据结构：
 * - StateVector：记录每个客户端的版本号
 * - Update：包含一系列操作（insert/delete）
 */

// 示例：模拟增量同步
const doc = new Y.Doc();
const text = doc.getText('content');

// 第一次同步
text.insert(0, 'Hello');
const update1 = Y.encodeStateAsUpdate(doc);

console.log('Update 1 length:', update1.length);

// 第二次修改（不需要发送完整内容）
text.insert(5, ' World');
const update2 = Y.encodeStateAsUpdate(doc);

console.log('Update 2 length:', update2.length);
// update2只包含insert(5, ' World')的信息

// 在接收端应用增量更新
const doc2 = new Y.Doc();
Y.applyUpdate(doc2, update1);
Y.applyUpdate(doc2, update2);

console.log('Doc2 content:', doc2.getText('content').toString());
// "Hello World"

// 状态向量交换（用于确定需要同步哪些数据）
const docA = new Y.Doc();
docA.getText('content').insert(0, 'A');
docA.getText('content').insert(1, 'B');

const docB = new Y.Doc();
docB.getText('content').insert(0, 'X');

// 获取各自的状态向量
const vectorA = Y.encodeStateVector(docA);
const vectorB = Y.encodeStateVector(docB);

// 计算差异
const updateFromAtoB = Y.encodeStateAsUpdate(docA, vectorB);
console.log('Updates from A that B needs:', updateFromAtoB.length);

// Yjs自动处理这一切
// 只需要调用 sync 或 observe 就够了
```

---

## 六、实际应用场景

### 6.1 文档编辑器集成（Tiptap）

```typescript
/**
 * Tiptap + Yjs 协作编辑配置
 * 来自 FastDocument frontend/src/components/TiptapEditor.tsx
 */

import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

interface TiptapEditorProps {
  docId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
}

// 创建带协作功能的编辑器
function createCollabEditor({ docId, user }: TiptapEditorProps) {
  // 创建Yjs文档
  const ydoc = new Y.Doc();

  // 创建Hocuspocus Provider（商业级协作服务器）
  const provider = new HocuspocusProvider({
    url: 'wss://collab.example.com',
    name: docId,
    document: ydoc,
    token: getAuthToken(),
  });

  // 配置编辑器
  const editor = new Editor({
    extensions: [
      StarterKit,
      // 协作核心扩展
      Collaboration.configure({
        document: ydoc,
        field: 'content', // 对应Y.XmlFragment
      }),
      // 光标显示扩展
      CollaborationCursor.configure({
        provider,
        user: {
          name: user.name,
          color: user.color,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg',
      },
    },
  });

  // 监听在线用户
  provider.awareness.on('change', () => {
    const states = provider.awareness.getStates();
    const users = Array.from(states.values())
      .filter(state => state.user)
      .map(state => state.user);
    console.log('Online users:', users);
  });

  return editor;
}
```

### 6.2 Monaco代码编辑器集成

```typescript
/**
 * Monaco + Yjs 代码协作
 * 来自 WebEnv webenv-os/src/lib/collaboration/collaborationService.ts
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

class CollaborationService {
  private doc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private monacoBinding: MonacoBinding | null = null;

  /**
   * 连接代码协作房间
   */
  async joinCodeRoom(
    roomId: string,
    user: { id: string; name: string; color: string },
    editor: monaco.editor.IStandaloneCodeEditor
  ) {
    // 创建Yjs文档
    this.doc = new Y.Doc();

    // 创建WebSocket Provider
    this.provider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      this.doc
    );

    // 获取共享文本
    const yText = this.doc.getText('code');

    // 绑定Monaco编辑器
    this.monacoBinding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      this.provider.awareness
    );

    // 设置用户信息
    this.provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color,
      id: user.id,
    });

    // 监听同步状态
    this.provider.on('sync', (isSynced: boolean) => {
      console.log('Code synced:', isSynced);
    });
  }

  /**
   * 断开协作
   */
  leaveRoom() {
    this.monacoBinding?.destroy();
    this.provider?.disconnect();
    this.doc?.destroy();
  }
}
```

### 6.3 白板协同

```typescript
/**
 * 基于Yjs的简易白板协同
 */

import * as Y from 'yjs';

// 白板元素类型
interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
}

class Whiteboard {
  private doc: Y.Doc;
  private shapes: Y.Array<Shape>;

  constructor() {
    this.doc = new Y.Doc();
    this.shapes = this.doc.getArray('shapes');
  }

  /**
   * 添加图形
   */
  addShape(shape: Omit<Shape, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.shapes.push([{ ...shape, id }]);
  }

  /**
   * 移动图形
   */
  moveShape(id: string, x: number, y: number) {
    const index = this.shapes.toArray().findIndex(s => s.id === id);
    if (index >= 0) {
      const shape = this.shapes.get(index);
      this.shapes.delete(index, 1);
      this.shapes.insert(index, [{ ...shape, x, y }]);
    }
  }

  /**
   * 删除图形
   */
  removeShape(id: string) {
    const index = this.shapes.toArray().findIndex(s => s.id === id);
    if (index >= 0) {
      this.shapes.delete(index, 1);
    }
  }

  /**
   * 监听变化
   */
  onShapesChange(callback: (shapes: Shape[]) => void) {
    this.shapes.observe(() => {
      callback(this.shapes.toArray());
    });
  }
}

// 使用
const board = new Whiteboard();
board.addShape({ type: 'rect', x: 0, y: 0, width: 100, height: 100, color: 'red' });
board.onShapesChange((shapes) => {
  console.log('Current shapes:', shapes);
});
```

### 6.4 实战：构建基于Yjs的协同应用

```typescript
/**
 * 完整协同应用示例
 * 从零构建一个支持多人实时协作的记事本
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

// 用户信息
interface User {
  id: string;
  name: string;
  color: string;
}

// 协同记事本类
class CollaborativeNotepad {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private content: Y.Text;
  private users: Y.Map<User>;
  private callbacks: Set<() => void> = new Set();

  constructor() {
    this.doc = new Y.Doc();
    this.content = this.doc.getText('content');
    this.users = this.doc.getMap('users');
  }

  /**
   * 连接协作服务器
   */
  async connect(roomId: string, user: User) {
    // 1. 本地持久化（离线支持）
    this.persistence = new IndexeddbPersistence(`notepad-${roomId}`, this.doc);

    await new Promise<void>((resolve) => {
      this.persistence!.once('synced', () => resolve());
      setTimeout(resolve, 3000); // 超时保护
    });

    // 2. WebSocket连接
    this.provider = new WebsocketProvider(
      'ws://localhost:1234',
      `notepad-${roomId}`,
      this.doc
    );

    // 3. 设置用户Awareness
    this.provider.awareness.setLocalState({ user });

    // 4. 监听连接状态
    this.provider.on('status', ({ status }) => {
      console.log('Connection status:', status);
    });

    // 5. 监听同步完成
    this.provider.on('sync', (isSynced) => {
      if (isSynced) {
        this.notify();
      }
    });

    // 6. 监听内容变化
    this.content.observe(() => {
      this.notify();
    });

    // 7. 监听用户变化
    this.provider.awareness.on('change', () => {
      this.notify();
    });

    return this;
  }

  /**
   * 插入文本
   */
  insert(index: number, text: string) {
    this.content.insert(index, text);
  }

  /**
   * 删除文本
   */
  delete(index: number, length: number) {
    this.content.delete(index, length);
  }

  /**
   * 获取内容
   */
  getText(): string {
    return this.content.toString();
  }

  /**
   * 获取在线用户
   */
  getOnlineUsers(): User[] {
    if (!this.provider) return [];

    const users: User[] = [];
    this.provider.awareness.getStates().forEach((state) => {
      if (state.user) {
        users.push(state.user as User);
      }
    });
    return users;
  }

  /**
   * 订阅变化
   */
  subscribe(callback: () => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * 通知所有订阅者
   */
  private notify() {
    this.callbacks.forEach(cb => cb());
  }

  /**
   * 导出状态
   */
  exportState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  /**
   * 导入状态
   */
  importState(state: Uint8Array) {
    Y.applyUpdate(this.doc, state);
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.provider?.disconnect();
    this.persistence?.destroy();
    this.doc.destroy();
  }
}

// 使用示例
async function main() {
  // 创建记事本
  const notepad = new CollaborativeNotepad();

  // 连接
  await notepad.connect('room-123', {
    id: 'user-1',
    name: '张三',
    color: '#ff0000',
  });

  // 监听变化
  notepad.subscribe(() => {
    console.log('Content:', notepad.getText());
    console.log('Users:', notepad.getOnlineUsers());
  });

  // 编辑
  notepad.insert(0, 'Hello, ');
  notepad.insert(7, 'World!');

  // 模拟另一个用户
  setTimeout(() => {
    console.log('Another user sees:', notepad.getText());
  }, 1000);

  // 离线测试
  notepad.disconnect();
  notepad.connect('room-123', {
    id: 'user-2',
    name: '李四',
    color: '#00ff00',
  });
}
```

---

## 七、与OT算法对比

### 7.1 OT的局限性

```typescript
/**
 * OT（Operational Transformation）的核心问题
 */

// 问题1：服务器必须知道所有操作类型
// 假设有3种操作：insert, delete, retain
type Op =
  | { type: 'insert'; pos: number; str: string }
  | { type: 'delete'; pos: number; len: number }
  | { type: 'retain'; len: number };

// 问题2：转换函数复杂度高
// 需要为每种操作对编写转换函数
function transform(opA: Op, opB: Op): Op {
  // OT需要处理大量边界情况
  // 例如：
  // - insert vs insert
  // - insert vs delete
  // - delete vs delete
  // - retain vs any
}

// 问题3：难以正确性证明
// Google Docs曾多次出现协同编辑不一致问题

// 问题4：无法离线
// OT依赖服务器进行操作转换
```

### 7.2 CRDT的优势

```typescript
/**
 * CRDT相比OT的优势
 */

// 1. 去中心化
// 不需要中央服务器进行协调
const doc = new Y.Doc();
const provider1 = new WebsocketProvider('ws://server1', 'room', doc);
const provider2 = new WebsocketProvider('ws://server2', 'room', doc);
// 两个provider可以直接同步

// 2. 离线优先
// 可以在没有网络的情况下继续编辑
const persistence = new IndexeddbPersistence('doc-id', doc);
doc.getText('content').insert(0, 'Offline edit');
// 网络恢复后自动同步

// 3. 简单的一致性保证
// 只需要merge操作
doc.transact(() => {
  doc.getText('content').insert(0, 'A');
  doc.getText('content').insert(1, 'B');
});
// merge是自动的，不需要手动处理

// 4. 易于理解
// 数学性质简单明了：可交换、幂等、结合
```

### 7.3 选型建议

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| **简单文本编辑** | Yjs | 轻量级，易于集成 |
| **复杂富文本** | Yjs + Tiptap/ProseMirror | 成熟生态 |
| **代码编辑器** | Yjs + Monaco | Monaco官方支持 |
| **实时画板/白板** | Yjs + 自定义渲染 | 需要细粒度同步 |
| **小型项目（<10人）** | y-websocket | 简单部署 |
| **大型项目（>100人）** | Hocuspocus / Liveblocks | 商业级支持 |
| **需要审计日志** | 关闭GC，存储完整历史 | 合规要求 |
| **纯本地应用** | Yjs + IndexedDB | 完全离线 |

### 7.4 没有银弹：我的思考

```typescript
/**
 * CRDT vs OT：没有完美的解决方案
 */

// CRDT的缺点
// 1. 内存占用较高（需要保留删除历史）
const doc = new Y.Doc();
// 如果编辑一个大文档，CRDT状态可能比实际内容大几倍

// 2. 首次同步较慢
// 需要交换完整状态向量

// 3. 不支持"锁"机制
// 无法实现"编辑锁定"
// 如果两个用户同时编辑同一段代码，可能产生语义冲突

// 4. 某些操作难以用CRDT建模
// 例如：移动操作 vs 复制操作的语义差异

// 实际项目中的权衡
class CollaborativeEditor {
  // 对于代码编辑器，我们选择Yjs
  // 因为：
  // - 代码编辑器的语义相对简单
  // - 需要支持离线编辑
  // - 社区支持好

  // 对于需要强一致性的场景（如金融数据）
  // 可能需要考虑其他方案
  // - Operational Transformation with central coordination
  // - Raft consensus algorithm
  // - Saga pattern for distributed transactions
}

// 最佳实践
// 1. 根据业务需求选择合适的算法
// 2. 不要过度设计
// 3. 保持简单
// 4. 测试边界情况
```

---

## 八、附录：Yjs API速查表

### 8.1 核心API

```typescript
import * as Y from 'yjs';

// 文档操作
const doc = new Y.Doc();
doc.clientID;              // 获取客户端ID
doc.getText(name);         // 获取或创建共享文本
doc.getArray(name);        // 获取或创建共享数组
doc.getMap(name);          // 获取或创建共享Map
doc.getXmlFragment(name);  // 获取或创建XML片段
doc.transact(() => {});    // 执行事务
doc.on('update', fn);     // 监听更新
doc.destroy();             // 销毁文档

// 共享文本
const text = doc.getText('content');
text.insert(0, 'hello');           // 插入
text.delete(0, 5);                // 删除
text.toString();                  // 获取文本
text.observe((event) => {});     // 监听变化

// 共享数组
const array = doc.getArray('items');
array.insert(0, [1, 2, 3]);       // 插入
array.delete(0, 1);              // 删除
array.push([4]);                  // 追加
array.get(0);                    // 获取元素
array.length;                     // 数组长度
array.toArray();                  // 转为普通数组

// 共享Map
const map = doc.getMap('meta');
map.set('key', 'value');         // 设置
map.get('key');                  // 获取
map.delete('key');               // 删除
map.has('key');                  // 检查存在
map.forEach((v, k) => {});       // 遍历
```

### 8.2 Provider API

```typescript
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { HocuspocusProvider } from '@hocuspocus/provider';

// WebsocketProvider
const provider = new WebsocketProvider(url, room, doc);
provider.on('status', ({ status }) => {});  // 连接状态
provider.on('sync', (isSynced) => {});     // 同步状态
provider.awareness.setLocalState({});      // 设置本地状态
provider.awareness.getStates();             // 获取所有状态
provider.disconnect();                       // 断开连接

// IndexeddbPersistence
const persistence = new IndexeddbPersistence(room, doc);
persistence.on('synced', () => {});  // 同步完成
persistence.destroy();               // 销毁

// HocuspocusProvider
const provider = new HocuspocusProvider({
  url: 'wss://example.com',
  name: 'document-id',
  document: doc,
  token: 'auth-token',
});
```

### 8.3 编码API

```typescript
import * as Y from 'yjs';

// 状态编码
Y.encodeStateAsUpdate(doc);           // 获取完整更新
Y.encodeStateVector(doc);             // 获取状态向量
Y.applyUpdate(doc, update);           // 应用更新
Y.mergeUpdates([update1, update2]);    // 合并更新
Y.encodeStateAsUpdate(doc, vector);   // 获取增量更新
```

---

## 九、总结

本文档深入分析了CRDT算法的数学基础和Yjs的实现原理。CRDT通过可交换性、幂等性和结合性三大特性，实现了无需中央协调的分布式一致性。Yjs作为目前最成熟的JavaScript CRDT实现，被广泛应用于各类协同编辑场景。

**关键要点**：

1. **CRDT的数学基础** - Join半格理论是CRDT的数学核心，操作必须满足可交换、幂等、结合三大特性

2. **基础数据结构** - G-Counter、PN-Counter、LWW-Register、OR-Set等构成了复杂CRDT的基石

3. **Yjs核心类型** - Y.Doc、Y.Text、Y.Array、Y.Map、Y.XmlFragment各有用途，共同支持复杂的协同场景

4. **实际应用** - Tiptap、Monaco等编辑器都有成熟的Yjs集成方案

5. **没有银弹** - CRDT和OT各有优劣，需要根据业务场景选择合适的方案

---

**相关文档**：

- [实时协作技术详解](./实时协作技术详解.md)
- [Zustand状态管理](./Zustand状态管理.md)
- [Next.js深度分析](../05_Next.js/Next.js深度分析.md)

**版本信息**：

- Yjs: ^13.6.29
- y-websocket: ^2.0.4
- y-indexeddb: ^9.0.12
- @hocuspocus/provider: ^3.4.4
- y-monaco: ^0.1.6
- @tiptap/extension-collaboration: ^2.11.5
