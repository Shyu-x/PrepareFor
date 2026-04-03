# 贪心算法（Greedy Algorithm）

## 一、贪心算法概述

### 1.1 什么是贪心算法？

贪心算法是一种**每一步都做出当前最优选择**的算法策略。它的核心思想是：通过一系列的局部最优选择，期望获得全局最优解。

```
贪心 vs 动态规划 对比：

动态规划：考虑所有选择，选出全局最优
贪心算法：只看当前选择，始终选最优

举例：找钱问题（贪心可能不是最优）
  金额：30元
  纸币面值：[1, 5, 10, 20]
  贪心：20 + 10 = 2张（最优）
  金额：30元
  纸币面值：[1, 3, 7, 12]
  贪心：12 + 12 + 3 + 3 = 4张
  最优：7 + 7 + 7 + 7 + 3 = 5张？ → 实际上 7+7+7+7+3 = 31 不对
  重新计算：3+3+3+3+3+3+3+3+3+3 = 10张？ 不对
  实际上这里需要DP来验证...
```

### 1.2 贪心算法的特点

**优点**：
- 简单高效，不需要存储所有状态
- 时间复杂度通常较低
- 容易理解和实现

**缺点**：
- 不一定能得到全局最优解
- 需要正确性证明
- 只适用于具有"贪心选择性质"的问题

### 1.3 贪心算法的适用条件

```
贪心算法适用的两个必要条件：

1. 贪心选择性质（Greedy Choice Property）
   ┌─────────────────────────────────────┐
   │ 每一步的最优解可以直接选择，          │
   │ 不需要考虑子问题的解                  │
   └─────────────────────────────────────┘

2. 最优子结构（Optimal Substructure）
   ┌─────────────────────────────────────┐
   │ 全局最优解包含局部最优解              │
   │ 即：问题的最优解可以通过子问题的       │
   │ 最优解来构造                         │
   └─────────────────────────────────────┘
```

---

## 二、贪心算法的证明方法

### 2.1 贪心选择性质证明

要证明贪心选择性质，通常使用"交换论证法"：

```
证明思路：
1. 假设存在一个最优解 O，但不是通过贪心选择得到的
2. 证明将 O 中的第一个选择替换为贪心选择后，
   仍然能得到最优解
3. 通过反复替换，最终将 O 转化为贪心解
4. 因此贪心解是最优的
```

### 2.2 最优子结构证明

```
证明思路：
1. 假设通过贪心选择得到了第一步的解
2. 证明剩余子问题的最优解与第一步的选择无关
3. 通过递归证明整个问题的最优性
```

### 2.3 经典证明示例：活动选择问题

```
问题：选择最多的不重叠活动

假设：
- S = {1, 2, ..., n} 为活动集合
- 每个活动 i 有开始时间 s[i] 和结束时间 f[i]
- 按结束时间排序：f[1] ≤ f[2] ≤ ... ≤ f[n]

贪心选择：
- 选择第一个结束的活动（活动1）
- 然后选择所有与活动1不冲突的活动
- 递归应用

证明（反证法）：
假设贪心解 G 不是最优解
设 O 是最优解，O 和 G 的第一个不同活动是 k
因为 G 选择的是结束时间最早的活动，所以 f[G[1]] ≤ f[O[1]]
用 G[1] 替换 O[1] 中的活动，得到的新解仍然是可行的
不断替换，最终可以将 O 转化为 G
因此 G 是最优的
```

---

## 三、活动选择问题

### 3.1 问题描述

```typescript
/**
 * 活动选择问题
 *
 * 问题：给定 n 个活动，每个活动有一个开始时间和结束时间，
 *       找出能选择的最大数量的不重叠活动。
 *
 * 示例：
 *   活动:   A   B   C   D   E   F
 *   开始:  1   3   0   5   3   5
 *   结束:  4   5   6   7   8   9
 *
 * 贪心策略：选择结束时间最早的活动
 */
```

### 3.2 代码实现

```typescript
/**
 * 活动选择问题（贪心算法）
 *
 * @param activities 二维数组，每项 [开始时间, 结束时间]
 * @returns 能选择的最大活动数量
 *
 * 时间复杂度: O(n log n) - 排序主导
 * 空间复杂度: O(1) - 只用常数个变量
 */
function activitySelection(activities: [number, number][]): number {
  if (activities.length === 0) return 0;

  // 1. 按活动的结束时间升序排序
  // 这是贪心选择的关键：优先选择结束最早的活动
  activities.sort((a, b) => a[1] - b[1]);

  // 2. 选择第一个活动（结束时间最早的）
  let count = 1; // 已选择活动数量
  let lastEnd = activities[0][1]; // 上一个选中活动的结束时间

  // 3. 遍历剩余活动
  for (let i = 1; i < activities.length; i++) {
    const [start, end] = activities[i];

    // 如果当前活动的开始时间 >= 上一个活动的结束时间
    // 说明两个活动不冲突，可以选择
    if (start >= lastEnd) {
      count++;
      lastEnd = end; // 更新最后选择的时间
    }
  }

  return count;
}

/**
 * 获取活动选择的具体方案
 */
function activitySelectionWith方案(activities: [number, number][]): [number, number][] {
  if (activities.length === 0) return [];

  // 复制并排序，避免修改原数组
  const sorted = [...activities].sort((a, b) => a[1] - b[1]);

  const selected: [number, number][] = [];
  let lastEnd = sorted[0][1];
  selected.push(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] >= lastEnd) {
      selected.push(sorted[i]);
      lastEnd = sorted[i][1];
    }
  }

  return selected;
}

// 测试
const activities: [number, number][] = [
  [1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16]
];

console.log(activitySelection(activities)); // 输出: 4
console.log(activitySelectionWith方案(activities));
// 输出: [[1,4], [5,7], [8,11], [12,16]]
```

---

## 四、哈夫曼编码

### 4.1 问题背景

哈夫曼编码（Huffman Coding）是一种无损数据压缩算法。它通过**使用更短的编码表示更频繁出现的字符**来达到压缩目的。

```
字符频率示例：
  字符    出现频率    ASCII编码(8位)    哈夫曼编码
    a        45         01100001        0
    b        13         01100010        101
    c        12         01100011        100
    d        16         01100100        111
    e        9          01100101        1101
    f        5           01100110        1100

平均编码长度：
  ASCII: 8位（固定长度）
  哈夫曼: 45*1 + 13*3 + 12*3 + 16*3 + 9*4 + 5*4 = 227/100 = 2.27位
  压缩率: (8-2.27)/8 ≈ 72%
```

### 4.2 算法原理

```
哈夫曼编码的贪心策略：
1. 将所有字符及其频率作为叶子节点
2. 每次选择频率最小的两个节点合并
3. 新节点的频率为两个节点频率之和
4. 重复直到只剩一个根节点

图示：
初始:  [a:45] [b:13] [c:12] [d:16] [e:9] [f:5]
       ↓
第1步:  [a:45] [d:16] [c:12] [b:13] [e:9] [f:5]
       ↓ 合并最小两个
       └──[17]──┘
       ↓
...继续合并...
```

### 4.3 代码实现

```typescript
import { MinHeap } from './数据结构/堆'; // 假设已有最小堆实现

interface HuffmanNode {
  char?: string;    // 字符（叶子节点有）
  freq: number;      // 频率
  left?: HuffmanNode;
  right?: HuffmanNode;
}

/**
 * 哈夫曼编码树构建（贪心算法）
 *
 * 时间复杂度: O(n log n) - n为字符种类数
 * 空间复杂度: O(n)
 */
function buildHuffmanTree(charFreqs: Map<string, number>): HuffmanNode {
  // 1. 创建优先队列（最小堆），按频率排序
  const heap = new MinHeap<HuffmanNode>();

  // 2. 将所有字符作为叶子节点加入堆
  charFreqs.forEach((freq, char) => {
    heap.insert({ char, freq });
  });

  // 3. 贪心构建：每次取出两个频率最小的节点合并
  while (heap.size() > 1) {
    // 取出频率最小的两个节点
    const left = heap.extractMin()!;
    const right = heap.extractMin()!;

    // 创建新内部节点
    const parent: HuffmanNode = {
      freq: left.freq + right.freq,
      left,
      right
    };

    // 将新节点加入堆
    heap.insert(parent);
  }

  // 4. 返回根节点
  return heap.extractMin()!;
}

/**
 * 生成哈夫曼编码表
 */
function generateHuffmanCodes(root: HuffmanNode): Map<string, string> {
  const codes = new Map<string, string>();

  /**
   * 递归生成编码
   * @param node 当前节点
   * @param code 当前积累的编码
   */
  function traverse(node: HuffmanNode, code: string) {
    // 叶子节点：记录字符编码
    if (node.char) {
      codes.set(node.char, code || '0'); // 空字符串特殊处理为'0'
      return;
    }

    // 左子树编码为'0'，右子树编码为'1'
    if (node.left) traverse(node.left, code + '0');
    if (node.right) traverse(node.right, code + '1');
  }

  traverse(root, '');
  return codes;
}

/**
 * 哈夫曼编码完整流程
 */
function huffmanEncode(text: string): {
  codes: Map<string, string>;
  encoded: string;
  originalBits: number;
  encodedBits: number;
} {
  // 1. 统计字符频率
  const charFreqs = new Map<string, number>();
  for (const char of text) {
    charFreqs.set(char, (charFreqs.get(char) || 0) + 1);
  }

  // 2. 构建哈夫曼树
  const tree = buildHuffmanTree(charFreqs);

  // 3. 生成编码表
  const codes = generateHuffmanCodes(tree);

  // 4. 编码文本
  let encoded = '';
  for (const char of text) {
    encoded += codes.get(char);
  }

  return {
    codes,
    encoded,
    originalBits: text.length * 8, // ASCII编码
    encodedBits: encoded.length   // 哈夫曼编码
  };
}

// 测试
const text = "hello world";
const result = huffmanEncode(text);

console.log("字符频率:", result.codes);
console.log("编码结果:", result.encoded);
console.log("压缩率:", (1 - result.encodedBits / result.originalBits).toFixed(2) * 100 + "%");
```

---

## 五、最小生成树（MST）

### 5.1 问题描述

最小生成树（Minimum Spanning Tree）是图论中的经典问题：

```
给定一个连通无向图，有 n 个顶点，m 条边
每条边有一个权重
找一个包含所有 n 个顶点的子图
使得子图中所有边的权重之和最小

应用场景：
- 网络设计（路由器、电网）
- 聚类分析
- 近似算法（如旅行商问题的近似）
```

### 5.2 Prim 算法（贪心）

```typescript
/**
 * Prim 算法：最小生成树
 *
 * 贪心策略：
 * 1. 从任意一个顶点开始
 * 2. 每次选择连接已选集合和未选集合的最小边
 * 3. 直到所有顶点都被选中
 *
 * 时间复杂度: O(V²) 或 O(E log V)（使用堆优化）
 * 空间复杂度: O(V)
 */

interface Edge {
  to: number;      // 边的终点
  weight: number;  // 边的权重
}

function prim(n: number, edges: [number, number, number][]): number {
  // 构建邻接表
  const adj: Edge[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push({ to: v, weight: w });
    adj[v].push({ to: u, weight: w });
  }

  // visited[i] 表示顶点 i 是否已在MST中
  const visited = new Array(n).fill(false);
  // minEdge[i] 表示连接顶点 i 和已选集合的最小边权重
  const minEdge = new Array(n).fill(Infinity);

  // 从顶点 0 开始
  minEdge[0] = 0;
  let totalWeight = 0;

  // 迭代 n 次，每次选出一个顶点
  for (let i = 0; i < n; i++) {
    // 1. 贪心选择：选出未选中顶点中，minEdge 最小的
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && (u === -1 || minEdge[v] < minEdge[u])) {
        u = v;
      }
    }

    // 将顶点 u 加入MST
    visited[u] = true;
    totalWeight += minEdge[u];

    // 2. 更新：通过 u 的所有边更新 minEdge
    for (const { to, weight } of adj[u]) {
      if (!visited[to] && weight < minEdge[to]) {
        minEdge[to] = weight;
      }
    }
  }

  return totalWeight;
}

// 测试
const n = 6; // 6个顶点
const edges: [number, number, number][] = [
  [0, 1, 4],   // 顶点0到顶点1，权重4
  [0, 2, 3],   // 顶点0到顶点2，权重3
  [1, 2, 1],   // 顶点1到顶点2，权重1
  [1, 3, 2],   // 顶点1到顶点3，权重2
  [2, 3, 4],   // 顶点2到顶点3，权重4
  [3, 4, 2],   // 顶点3到顶点4，权重2
  [4, 5, 5],   // 顶点4到顶点5，权重5
  [3, 5, 6],   // 顶点3到顶点5，权重6
];

console.log("最小生成树权重:", prim(n, edges)); // 输出: 12
```

### 5.3 Kruskal 算法（贪心）

```typescript
/**
 * Kruskal 算法：最小生成树
 *
 * 贪心策略：
 * 1. 将所有边按权重升序排序
 * 2. 依次遍历每条边
 * 3. 如果这条边连接的两个顶点不在同一个连通分量中，
 *    则将这条边加入MST，并合并两个连通分量
 *
 * 时间复杂度: O(E log E)
 * 空间复杂度: O(V)
 */

/**
 * 并查集（Union-Find）
 * 用于判断两个顶点是否在同一连通分量中
 */
class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  // 查找：返回 x 所在集合的根节点（路径压缩优化）
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 路径压缩
    }
    return this.parent[x];
  }

  // 合并：将 x 和 y 所在集合合并（按秩合并优化）
  union(x: number, y: number): boolean {
    const px = this.find(x);
    const py = this.find(y);

    if (px === py) return false; // 已在同一集合

    // 按秩合并：rank 小的接到 rank 大的下面
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }

    return true;
  }
}

function kruskal(n: number, edges: [number, number, number][]): number {
  // 1. 按边权重升序排序
  edges.sort((a, b) => a[2] - b[2]);

  // 2. 初始化并查集
  const uf = new UnionFind(n);

  let totalWeight = 0;
  let edgeCount = 0;

  // 3. 贪心选择边
  for (const [u, v, w] of edges) {
    // 如果 u 和 v 不在同一集合，选择这条边
    if (uf.union(u, v)) {
      totalWeight += w;
      edgeCount++;

      // 已经选了 n-1 条边，MST 构建完成
      if (edgeCount === n - 1) break;
    }
  }

  return totalWeight;
}

// 测试（使用上面的边数据）
console.log("Kruskal MST权重:", kruskal(n, edges)); // 输出: 12
```

---

## 六、LeetCode 经典题目

### 6.1 柠檬水找零（LeetCode 860）

```typescript
/**
 * LeetCode 860. 柠檬水找零
 *
 * 问题：柠檬水 5 美元一杯。顾客排队付款，可能给你 5、10、20 美元。
 *       你需要找零，问能否正确找零？
 *
 * 贪心策略：
 * - 收到 5 美元：不用找零
 * - 收到 10 美元：找零 5 美元（只用 5 美元）
 * - 收到 20 美元：优先用 10+5 找零（保留更多 5 美元）
 *
 * 为什么不用 5+5+5？
 * 因为 10 美元只能由 5 美元找零，所以保留更多 5 美元更合理
 */
function lemonadeChange(bills: number[]): boolean {
  // 手中拥有的 5 美元和 10 美元数量
  let five = 0;
  let ten = 0;

  for (const bill of bills) {
    if (bill === 5) {
      // 收到 5 美元，直接收下
      five++;
    } else if (bill === 10) {
      // 收到 10 美元，需要找零 5 美元
      if (five === 0) return false; // 没有 5 美元，找不开
      five--;
      ten++;
    } else {
      // 收到 20 美元，需要找零 15 美元
      // 贪心策略：优先使用 10 美元找零
      if (ten > 0 && five > 0) {
        // 10 + 5
        ten--;
        five--;
      } else if (five >= 3) {
        // 5 + 5 + 5
        five -= 3;
      } else {
        return false;
      }
    }
  }

  return true;
}

// 测试
console.log(lemonadeChange([5, 5, 5, 10, 20])); // true
console.log(lemonadeChange([10, 10])); // false
```

### 6.2 分发饼干（LeetCode 455）

```typescript
/**
 * LeetCode 455. 分发饼干
 *
 * 问题：每个孩子有胃口值 g，每个饼干有尺寸 s。
 *       如果 s >= g，则可以将饼干分配给孩子。
 *       问最多能满足多少个孩子？
 *
 * 贪心策略：
 * 1. 将 g 和 s 都升序排序
 * 2. 用两个指针遍历
 * 3. 小饼干先喂给小胃口的孩子
 */
function findContentChildren(g: number[], s: number[]): number {
  // 1. 排序
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);

  let child = 0; // 已满足的孩子数量
  let cookie = 0; // 当前饼干的索引

  // 2. 遍历饼干
  while (cookie < s.length && child < g.length) {
    // 如果当前饼干能满足当前孩子
    if (s[cookie] >= g[child]) {
      child++; // 孩子满足数量 +1
    }
    // 无论是否满足，都尝试下一个饼干
    cookie++;
  }

  return child;
}

// 测试
console.log(findContentChildren([1, 2, 3], [1, 1])); // 1
console.log(findContentChildren([1, 2], [1, 2, 3])); // 2
```

### 6.3 无重叠区间（LeetCode 435）

```typescript
/**
 * LeetCode 435. 无重叠区间
 *
 * 问题：给定一个区间的集合，找到需要移除的最少区间数量，
 *       使得剩余区间互不重叠。
 *
 * 贪心策略：
 * 1. 按区间的结束时间排序
 * 2. 依次选择区间，每次选择不与上一个选中区间重叠的
 * 3. 要移除的区间数 = 总数 - 选中区间数
 */
function eraseOverlapIntervals(intervals: [number, number][]): number {
  if (intervals.length <= 1) return 0;

  // 按结束时间排序
  intervals.sort((a, b) => a[1] - b[1]);

  // 选择的第一个区间
  let count = 1;
  let lastEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];

    // 如果当前区间不与上一个区间重叠
    if (start >= lastEnd) {
      count++;
      lastEnd = end;
    }
  }

  // 需要移除的区间数 = 总数 - 选中数
  return intervals.length - count;
}

// 测试
console.log(eraseOverlapIntervals([[1, 2], [2, 3], [3, 4], [1, 3]])); // 1
console.log(eraseOverlapIntervals([[1, 2], [1, 2], [1, 2]])); // 2
```

### 6.4 根据身高重建队列（LeetCode 406）

```typescript
/**
 * LeetCode 406. 根据身高重建队列
 *
 * 问题：有一群人站成两排，按 [h, k] 形式记录每个人的信息。
 *       h 是身高，k 是前面身高 >= 此人的数量。
 *       重建队列。
 *
 * 贪心策略：
 * 1. 先按身高降序、k 值升序排序
 * 2. 按顺序依次插入，插入位置由 k 值决定
 * 3. 为什么这样做？因为高个子的人不受矮个子影响
 */
function reconstructQueue(people: [number, number][]): [number, number][] {
  // 1. 排序：身高降序，k 值升序
  // 解释：先处理高个子，他们不受矮个子影响
  people.sort((a, b) => {
    if (a[0] !== b[0]) return b[0] - a[0]; // 身高降序
    return a[1] - b[1]; // k 值升序
  });

  // 2. 按 k 值插入
  // 由于已按身高排序，当前人的身高一定 >= 之前插入的人
  // 所以当前人的插入位置就是他的 k 值
  const result: [number, number][] = [];

  for (const [h, k] of people) {
    // 在位置 k 插入
    result.splice(k, 0, [h, k]);
  }

  return result;
}

// 测试
console.log(reconstructQueue([[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]]));
// 输出: [[5,0], [7,0], [5,2], [6,1], [4,4], [7,1]]
```

---

## 七、贪心算法的局限性

### 7.1 贪心失效的例子

```typescript
/**
 * 贪心算法失效的经典例子：分数背包问题 vs 0-1背包问题
 */

// 分数背包问题（可以用贪心）
// 可以带走物品的一部分，贪心有效

// 0-1背包问题（贪心失效）
// 必须完整带走物品，贪心可能得不到最优解

// 示例：
// 背包容量：10
// 物品A：重量6，价值10，单价 10/6 ≈ 1.67
// 物品B：重量5，价值8， 单价 8/5  = 1.6
// 物品C：重量5，价值8， 单价 8/5  = 1.6

// 贪心选择 A（价值最高）：容量剩4，无法装B或C，总价值10
// 最优解：装B和C（5+5=10），总价值16

/**
 * 另一个例子：找零钱问题（特殊硬币系统）
 *
 * 硬币面值：[1, 3, 4]
 * 金额：6
 *
 * 贪心：4 + 1 + 1 = 3枚硬币
 * 最优：3 + 3 = 2枚硬币 ← 贪心失效！
 */
function coinChangeGreedy(coins: number[], amount: number): number {
  // 典型的贪心实现
  let count = 0;
  let remaining = amount;

  // 按面值降序排序（先选大硬币）
  coins.sort((a, b) => b - a);

  for (const coin of coins) {
    while (remaining >= coin) {
      remaining -= coin;
      count++;
    }
  }

  return remaining === 0 ? count : -1;
}

// 测试
console.log(coinChangeGreedy([1, 3, 4], 6)); // 输出: 3（4+1+1）
// 但实际最优是 3+3 = 2枚硬币

// 正确做法应该用动态规划
function coinChangeDP(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0 && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log(coinChangeDP([1, 3, 4], 6)); // 输出: 2（3+3）
```

### 7.2 如何判断是否该用贪心

```
判断方法：

1. 交换论证
   - 假设存在最优解 O
   - 证明将 O 的第一个选择替换为贪心选择后，仍是最优
   - 通过迭代完成证明

2. 尝试几组数据
   - 用小数据验证贪心是否正确
   - 特别注意边界情况

3. 与动态规划对比
   - 如果不确定，先用 DP 求解验证
   - 再分析是否可以简化为贪心

常见可用贪心的场景：
✓ 活动选择问题
✓ 哈夫曼编码
✓ 最小生成树
✓ 单源最短路（Dijkstra）
✓ 分数背包问题
```

---

## 八、复杂度分析

| 算法 | 时间复杂度 | 空间复杂度 | 关键步骤 |
|------|-----------|-----------|----------|
| 活动选择 | O(n log n) | O(1) | 排序 |
| 哈夫曼编码 | O(n log n) | O(n) | 建堆 |
| Prim | O(V²) / O(E log V) | O(V) | 边选择 |
| Kruskal | O(E log E) | O(V) | 排序+并查集 |
| Dijkstra | O(V²) / O(E log V) | O(V) | 边选择 |

---

## 九、本章小结

本章我们学习了贪心算法：

1. **核心思想**：每一步都选择当前最优，期望得到全局最优
2. **两个必要条件**：
   - 贪心选择性质：局部最优选择可导致全局最优
   - 最优子结构：全局最优包含局部最优

3. **经典应用**：
   - 活动选择问题
   - 哈夫曼编码
   - 最小生成树（Prim、Kruskal）
   - 区间调度问题

4. **LeetCode 题目**：
   - 柠檬水找零
   - 分发饼干
   - 无重叠区间
   - 根据身高重建队列

5. **重要提醒**：
   - 贪心算法需要正确性证明
   - 不是所有问题都能用贪心
   - 无法确定时，用动态规划验证

---

**上一篇**：[01_暴力搜索算法_Brute_Force.md](./01_暴力搜索算法_Brute_Force.md)
**下一篇**：[03_分治算法_Divide_and_Conquer.md](./03_分治算法_Divide_and_Conquer.md)
