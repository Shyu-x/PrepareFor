# 分支限界算法（Branch and Bound）

## 一、分支限界算法概述

### 1.1 什么是分支限界算法？

分支限界算法（Branch and Bound）是一种用于**求解组合优化问题**的算法策略。它通过系统地搜索解空间树，并利用**上界/下界**来"剪枝"不必要的搜索分支，从而提高效率。

```
分支限界 vs 回溯 对比：

回溯算法：
- 用于求解所有解或最优解
- 深度优先搜索
- 通过约束进行剪枝
- 不计算界限值

分支限界算法：
- 只用于求解最优解
- 广度优先搜索（或最佳优先搜索）
- 通过界限（bound）进行剪枝
- 计算目标函数的上界或下界
```

### 1.2 核心概念

```
1. 分支（Branching）：
   ┌────────────────────────────────────────┐
   │ 将问题分解为子问题，逐层分解            │
   │ 类似决策树的展开                        │
   └────────────────────────────────────────┘

2. 限界（Bounding）：
   ┌────────────────────────────────────────┐
   │ 计算子问题解的上界或下界                │
   │ 用于判断该分支是否能产生更优解          │
   └────────────────────────────────────────┘

3. 剪枝（Pruning）：
   ┌────────────────────────────────────────┐
   │ 如果某个分支的界限不优于当前最优解，     │
   │ 则放弃该分支（剪枝）                    │
   └────────────────────────────────────────┘

4. 队列（Queue）：
   ┌────────────────────────────────────────┐
   │ 存储待处理的子问题节点                  │
   │ 通常用优先队列按界限值排序              │
   └────────────────────────────────────────┘
```

### 1.3 算法框架

```typescript
/**
 * 分支限界算法通用框架
 *
 * @param problem 初始问题
 * @returns 最优解
 */
function branchAndBound(problem): Solution {
  // 1. 初始化
  const bestSolution = initialSolution(); // 当前最优解
  const queue = new PriorityQueue(); // 活节点优先队列

  // 2. 将根节点加入队列
  queue.push(createNode(problem, null, null));

  // 3. 主循环
  while (!queue.isEmpty()) {
    // 取出具有最佳界限的节点（最佳优先）
    const node = queue.pop();

    // 4. 限界检查
    if (node.bound >= value(bestSolution)) {
      continue; // 剪枝：不可能产生更优解
    }

    // 5. 分支：对当前节点进行分支
    for (const child of branch(node)) {
      // 6. 计算界限
      child.bound = bound(child);

      // 7. 检查是否是可行解
      if (isFeasible(child)) {
        // 如果是完整解，更新最优解
        if (value(child) < value(bestSolution)) {
          bestSolution = child;
        }
      }

      // 8. 剪枝：只有界限优于当前最优解才加入队列
      if (child.bound < value(bestSolution)) {
        queue.push(child);
      }
    }
  }

  return bestSolution;
}
```

---

## 二、分支限界的搜索策略

### 2.1 FIFO 搜索（队列式分支限界）

```typescript
/**
 * FIFO 队列式分支限界
 *
 * 特点：
 * - 使用普通队列（FIFO）
 * - 按节点加入顺序扩展
 * - 类似广度优先搜索
 *
 * 应用：0-1 背包问题的队列式求解
 */
function knapsackFIFO(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;

  // 按单位价值排序（用于计算上界）
  const items: { w: number; v: number; ratio: number }[] = weights.map((w, i) => ({
    w,
    v: values[i],
    ratio: values[i] / w
  })).sort((a, b) => b.ratio - a.ratio);

  interface Node {
    level: number;      // 当前层数
    weight: number;      // 当前总重量
    value: number;       // 当前总价值
    bound: number;       // 价值上界
    promise: number;     // 路径收益（用于排序）
  }

  const queue: Node[] = [];
  let maxValue = 0;

  // 根节点
  queue.push({ level: 0, weight: 0, value: 0, bound: 0, promise: 0 });

  while (queue.length > 0) {
    // 取出节点（队首）
    const node = queue.shift()!;

    // 限界检查
    if (node.bound <= maxValue) continue;

    // 分支：尝试包含下一个物品
    const nextLevel = node.level + 1;

    if (nextLevel <= n) {
      const item = items[nextLevel - 1];

      // 左分支：包含该物品
      if (node.weight + item.w <= capacity) {
        const newValue = node.value + item.v;
        maxValue = Math.max(maxValue, newValue);
        queue.push({
          level: nextLevel,
          weight: node.weight + item.w,
          value: newValue,
          bound: calculateBound(nextLevel, node.weight + item.w, newValue),
          promise: newValue
        });
      }

      // 右分支：不包含该物品
      queue.push({
        level: nextLevel,
        weight: node.weight,
        value: node.value,
        bound: calculateBound(nextLevel, node.weight, node.value),
        promise: node.value
      });
    }
  }

  return maxValue;
}

/**
 * 计算价值上界（贪心近似）
 */
function calculateBound(level: number, weight: number, value: number): number {
  // 使用分数背包的贪心策略计算上界
  // 这里简化处理，实际应该用 items 数组
  return value + (capacity - weight) * maxRatio;
}
```

### 2.2 LIFO 搜索（栈式分支限界）

```typescript
/**
 * LIFO 栈式分支限界
 *
 * 特点：
 * - 使用栈（LIFO）
 * - 深度优先搜索
 * - 节省内存
 */
function knapsackLIFO(
  weights: number[],
  values: number[],
  capacity: number
): number {
  // 栈实现，与 FIFO 类似，只是用数组模拟栈
  const stack: Node[] = [];
  let maxValue = 0;

  // 根节点入栈
  stack.push({ level: 0, weight: 0, value: 0, bound: 0, promise: 0 });

  while (stack.length > 0) {
    // 取出节点（栈顶）
    const node = stack.pop()!;

    if (node.bound <= maxValue) continue;

    const nextLevel = node.level + 1;

    if (nextLevel <= n) {
      const item = items[nextLevel - 1];

      // 左分支：包含物品
      if (node.weight + item.w <= capacity) {
        maxValue = Math.max(maxValue, node.value + item.v);
      }

      // 右分支：不包含物品
      // ...
    }
  }

  return maxValue;
}
```

### 2.3 优先队列式搜索（最佳优先）

```typescript
/**
 * 最佳优先分支限界
 *
 * 特点：
 * - 使用优先队列（按界限值排序）
 * - 优先扩展"最有希望"的节点
 * - 最常用
 *
 * 应用：0-1 背包、旅行商问题
 */
class PriorityNode implements Comparable<PriorityNode> {
  level: number;
  weight: number;
  value: number;
  bound: number;

  constructor(level: number, weight: number, value: number, bound: number) {
    this.level = level;
    this.weight = weight;
    this.value = value;
    this.bound = bound;
  }

  compareTo(other: PriorityNode): number {
    // 按 bound 值降序排列（界值大的先扩展）
    return other.bound - this.bound;
  }
}

function knapsackBestFirst(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;

  // 按价值/重量比排序
  const items = weights.map((w, i) => ({
    w,
    v: values[i],
    ratio: values[i] / w
  })).sort((a, b) => b.ratio - a.ratio);

  const maxValue = 0;

  // 优先队列
  const pq = new MinPriorityQueue(); // 实际用最大堆

  // 根节点入队
  pq.enqueue(new PriorityNode(0, 0, 0, calculateUpperBound(0, 0)));

  while (!pq.isEmpty()) {
    const node = pq.dequeue()!;

    // 剪枝
    if (node.bound <= maxValue) continue;

    const nextLevel = node.level + 1;

    if (nextLevel <= n) {
      const item = items[nextLevel - 1];

      // 左分支：包含物品
      const leftWeight = node.weight + item.w;
      if (leftWeight <= capacity) {
        const leftValue = node.value + item.v;
        maxValue = Math.max(maxValue, leftValue);
        pq.enqueue(new PriorityNode(
          nextLevel,
          leftWeight,
          leftValue,
          calculateUpperBound(nextLevel, leftWeight)
        ));
      }

      // 右分支：不包含物品
      pq.enqueue(new PriorityNode(
        nextLevel,
        node.weight,
        node.value,
        calculateUpperBound(nextLevel, node.weight)
      ));
    }
  }

  return maxValue;
}

/**
 * 计算上界（分数背包贪心）
 */
function calculateUpperBound(level: number, weight: number): number {
  let bound = currentValue;
  let remainingWeight = capacity - weight;

  // 从当前层开始，贪心地装入单位价值最高的物品
  for (let i = level; i < n && remainingWeight > 0; i++) {
    if (items[i].w <= remainingWeight) {
      bound += items[i].v;
      remainingWeight -= items[i].w;
    } else {
      bound += items[i].ratio * remainingWeight;
      break;
    }
  }

  return bound;
}
```

---

## 三、0-1 背包问题

### 3.1 问题分析

```
0-1 背包问题：
- n 件物品，重量 w[i]，价值 v[i]
- 背包容量 C
- 每件物品只能选 0 或 1 次
- 求能装入的最大价值

分支限界解法：
- 搜索解空间树
- 左分支：包含物品 i
- 右分支：不包含物品 i
- 用上界剪枝
```

### 3.2 完整代码实现

```typescript
/**
 * 0-1 背包问题 - 分支限界算法
 *
 * 思路：
 * 1. 按单位价值排序，用贪心计算上界
 * 2. 搜索解空间树
 * 3. 用上界剪枝
 *
 * 时间复杂度: O(2^n) 最坏情况，但剪枝大大减少搜索
 * 空间复杂度: O(n)
 */

/**
 * 物品类
 */
interface Item {
  weight: number;
  value: number;
  ratio: number;
}

/**
 * 节点类
 */
class KKNode {
  level: number;         // 当前层（处理到第几个物品）
  weight: number;         // 当前总重量
  value: number;         // 当前总价值
  bound: number;         // 该节点的价值上界
  promise: number;       // 路径收益

  constructor(level: number, weight: number, value: number, bound: number) {
    this.level = level;
    this.weight = weight;
    this.value = value;
    this.bound = bound;
    this.promise = value;
  }
}

/**
 * 0-1 背包分支限界算法
 */
function knapsackBranchBound(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;

  // 1. 按价值/重量比排序
  const items: Item[] = weights.map((w, i) => ({
    weight: w,
    value: values[i],
    ratio: values[i] / w
  })).sort((a, b) => b.ratio - a.ratio);

  let maxValue = 0; // 当前最优价值

  // 2. 初始化优先队列
  const pq: KKNode[] = [];

  // 3. 添加根节点
  const rootBound = calculateBound(0, 0, 0);
  pq.push(new KKNode(0, 0, 0, rootBound));

  // 4. 主循环
  while (pq.length > 0) {
    // 取出 bound 值最大的节点（最佳优先）
    const node = pq.pop()!;

    // 5. 剪枝：上界小于等于当前最大价值，不可能产生更优解
    if (node.bound <= maxValue) continue;

    const nextLevel = node.level + 1;

    // 6. 分支
    if (nextLevel <= n) {
      const item = items[nextLevel - 1];

      // 左分支：包含物品
      const leftWeight = node.weight + item.weight;
      if (leftWeight <= capacity) {
        const leftValue = node.value + item.value;
        maxValue = Math.max(maxValue, leftValue);
        pq.push(new KKNode(
          nextLevel,
          leftWeight,
          leftValue,
          calculateBound(nextLevel, leftWeight, leftValue)
        ));
      }

      // 右分支：不包含物品
      const rightBound = calculateBound(nextLevel, node.weight, node.value);
      if (rightBound > maxValue) {
        pq.push(new KKNode(
          nextLevel,
          node.weight,
          node.value,
          rightBound
        ));
      }
    }
  }

  return maxValue;
}

/**
 * 计算上界
 * 使用分数背包的贪心策略
 *
 * @param level 当前层
 * @param weight 当前总重量
 * @param value 当前总价值
 */
function calculateBound(level: number, weight: number, value: number): number {
  if (weight >= capacity) return 0;

  let bound = value; // 下界 = 当前价值
  let remainingWeight = capacity - weight;

  // 贪心地添加剩余物品
  for (let i = level; i < n && remainingWeight > 0; i++) {
    if (items[i].weight <= remainingWeight) {
      bound += items[i].value;
      remainingWeight -= items[i].weight;
    } else {
      // 部分装入
      bound += items[i].ratio * remainingWeight;
      break;
    }
  }

  return bound;
}

// 测试
const weights = [10, 20, 30];
const values = [60, 100, 120];
const capacity = 50;

console.log(knapsackBranchBound(weights, values, capacity));
// 输出: 220 (物品1和物品3，10+30=40, 60+120=180？ 不，应该是 20+30=50, 100+120=220)
```

---

## 四、旅行商问题（TSP）

### 4.1 问题描述

```
旅行商问题（TSP - Traveling Salesman Problem）：
- 给定 n 个城市及其两两之间的距离
- 从某城市出发，访问所有城市恰好一次后返回起点
- 求最短路径

这是经典的 NP-hard 问题
分支限界是最优解的常用算法
```

### 4.2 代码实现

```typescript
/**
 * 旅行商问题 - 分支限界算法
 *
 * 思路：
 * 1. 使用邻接矩阵表示城市间距离
 * 2. 节点存储：当前路径、当前城市、当前路径长度、下界
 * 3. 搜索解空间树，用下界剪枝
 */

/**
 * 计算路径下界
 * 下界 = 已走路径长度 + 从当前城市出发的最短两个出边的平均值 × 剩余城市数
 */
function tspBranchAndBound(dist: number[][]): number {
  const n = dist.length;
  let minTourCost = Infinity;

  interface TS_Node {
    level: number;           // 当前层数
    path: number[];          // 当前路径
    visited: boolean[];     // 已访问城市
    currentCity: number;     // 当前所在城市
    cost: number;            // 当前路径长度
    bound: number;           // 下界
  }

  // 优先队列（按 bound 升序）
  const pq = new MinPriorityQueue();

  // 初始化：从城市 0 出发
  const rootVisited = new Array(n).fill(false);
  rootVisited[0] = true;
  pq.enqueue({
    level: 0,
    path: [0],
    visited: rootVisited,
    currentCity: 0,
    cost: 0,
    bound: calculateTSPBound(rootVisited, 0, 0, dist)
  });

  while (!pq.isEmpty()) {
    const node = pq.dequeue()!;

    // 剪枝
    if (node.bound >= minTourCost) continue;

    // 终止条件：已访问所有城市
    if (node.level === n - 1) {
      // 返回起点的距离
      const returnCost = dist[node.currentCity][0];
      if (returnCost !== Infinity) {
        minTourCost = Math.min(minTourCost, node.cost + returnCost);
      }
      continue;
    }

    // 分支：尝试下一个未访问的城市
    for (let nextCity = 1; nextCity < n; nextCity++) {
      if (!node.visited[nextCity] && dist[node.currentCity][nextCity] !== Infinity) {
        const newVisited = [...node.visited];
        newVisited[nextCity] = true;

        const newCost = node.cost + dist[node.currentCity][nextCity];

        // 剪枝：如果当前成本已经超过最优解
        if (newCost >= minTourCost) continue;

        const newBound = calculateTSPBound(newVisited, nextCity, newCost, dist);

        // 剪枝
        if (newBound >= minTourCost) continue;

        pq.enqueue({
          level: node.level + 1,
          path: [...node.path, nextCity],
          visited: newVisited,
          currentCity: nextCity,
          cost: newCost,
          bound: newBound
        });
      }
    }
  }

  return minTourCost;
}

/**
 * 计算 TSP 节点的代价下界
 *
 * 下界计算方法：
 * 1. 对于已访问城市，计算从当前城市出发的最小出边
 * 2. 对于未访问城市，计算进出的最小出边各一个
 * 3. 下界 = 当前路径长度 + 上述最小出边之和
 */
function calculateTSPBound(
  visited: boolean[],
  currentCity: number,
  currentCost: number,
  dist: number[][]
): number {
  const n = dist.length;
  let bound = currentCost;

  // 1. 加上从当前城市出发的最小边
  let minOut = Infinity;
  for (let j = 0; j < n; j++) {
    if (!visited[j] && dist[currentCity][j] < minOut) {
      minOut = dist[currentCity][j];
    }
  }
  if (minOut !== Infinity) bound += minOut;

  // 2. 对于每个未访问城市，加上进出的最小边各一个
  for (let i = 1; i < n; i++) {
    if (!visited[i]) {
      let minIn = Infinity;
      let minOut = Infinity;

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          if (visited[j]) {
            minOut = Math.min(minOut, dist[j][i]);
          } else {
            minIn = Math.min(minIn, dist[i][j]);
            minOut = Math.min(minOut, dist[j][i]);
          }
        }
      }

      if (minIn !== Infinity && minOut !== Infinity) {
        bound += minIn + minOut;
      }
    }
  }

  return bound;
}

// 测试
const tspDist = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0]
];

console.log(tspBranchAndBound(tspDist));
// 输出: 80 (路径: 0 -> 1 -> 3 -> 2 -> 0, 距离: 10+25+30+15=80)
```

---

## 五、优先队列的实现

### 5.1 简单优先队列

```typescript
/**
 * 最小优先队列（基于数组实现）
 * 实际上应该用二叉堆，这里简化实现
 */
class MinPriorityQueue<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.comparator = comparator;
  }

  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parent]) >= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < this.heap.length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < this.heap.length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}
```

---

## 六、分支限界 vs 回溯

### 6.1 对比总结

```
特征           │ 分支限界           │ 回溯
─────────────────────────────────────────────────────
搜索策略       │ 广度优先/最佳优先   │ 深度优先
目标           │ 求最优解           │ 求所有解或最优解
剪枝依据       │ 上界/下界          │ 约束条件
解空间         │ 只搜索最优解路径    │ 搜索整个解空间树
应用场景       │ 组合优化问题       │ 组合优化、枚举问题
数据结构       │ 队列/优先队列      │ 栈（递归）
内存使用       │ 可能较大           │ 较小（递归栈）
```

### 6.2 适用场景选择

```
适合用分支限界的问题：
✓ 需要找最优解
✓ 解空间大，但界限计算有效
✓ 问题是离散优化问题
✓ 界限可以显著剪枝

适合用回溯的问题：
✓ 需要找所有解
✓ 问题适合深度优先遍历
✓ 约束条件可以剪枝
✓ 递归实现简单直观
```

---

## 七、复杂度分析

### 7.1 时间复杂度

```
分支限界的时间复杂度取决于剪枝效果：

最好情况：O(最优解路径长度 × 分支因子)
  - 大量剪枝，只搜索必要的节点

最坏情况：O(2^n) 或 O(n!)
  - 无法有效剪枝，退化为穷举

平均情况：介于两者之间，取决于界限函数的质量
```

### 7.2 空间复杂度

```
分支限界算法的空间复杂度：

O(搜索树的最大宽度 × 节点信息大小)
  - 优先队列可能存储大量节点
  - 每个节点包含：层数、路径、界限等

优化方法：
- 及时释放不可能产生更优解的节点
- 使用更好的界限函数减少入队节点
```

---

## 八、LeetCode 练习题

### 中等难度
1. **LeetCode 279. 完全平方数** - 最小数量问题
2. **LeetCode 1301. 最大的以 1 结尾的路径数** - 路径搜索

### 困难难度
3. **LeetCode 1235. 规划兼职工作** - 贪心 + 二分
4. **LeetCode 174. 地下城游戏** - 动态规划 + 回溯
5. **LeetCode 1723. 完成所有工作的最短时间** - 分支限界

---

## 九、本章小结

本章我们系统学习了分支限界算法：

1. **核心思想**：搜索解空间树 + 界限剪枝

2. **三种搜索策略**：
   - FIFO 队列式：广度优先
   - LIFO 栈式：深度优先
   - 最佳优先：用优先队列

3. **关键步骤**：
   - 分支：将问题分解为子问题
   - 限界：计算子问题的上界或下界
   - 剪枝：界限不优则跳过

4. **经典应用**：
   - 0-1 背包问题
   - 旅行商问题（TSP）

5. **与回溯的区别**：
   - 回溯求所有解，分支限界求最优解
   - 回溯用约束剪枝，分支限界用界限剪枝
   - 分支限界通常用队列/优先队列，回溯用栈/递归

---

**上一篇**：[05_回溯算法_Backtracking.md](./05_回溯算法_Backtracking.md)
**下一篇**：[07_二分搜索与三分搜索.md](./07_二分搜索与三分搜索.md)
