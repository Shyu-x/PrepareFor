# 动态规划（Dynamic Programming）

## 一、动态规划概述

### 1.1 什么是动态规划？

动态规划（DP）是一种**通过存储子问题的解来避免重复计算**的算法思想。它是解决具有**重叠子问题**和**最优子结构**的问题的最有效方法。

```
动态规划的核心价值：
┌────────────────────────────────────────────────────┐
│  暴力搜索: 指数级时间                               │
│           │                                        │
│           ▼                                        │
│    加入记忆化 ──────► 动态规划 (多项式级时间)        │
│                                                    │
│  例如: 斐波那契数列                                  │
│  - 暴力递归: O(2^n)                                │
│  - 记忆化递归: O(n)                                │
│  - 动态规划: O(n)                                   │
└────────────────────────────────────────────────────┘
```

### 1.2 动态规划的三个核心要素

```
1. 最优子结构（Optimal Substructure）
   ┌─────────────────────────────────────────────────┐
   │  全局最优解包含局部最优解                         │
   │  即：问题的最优解可以由子问题的最优解构造         │
   └─────────────────────────────────────────────────┘

2. 重叠子问题（Overlapping Subproblems）
   ┌─────────────────────────────────────────────────┐
   │  子问题会被多次求解                              │
   │  例如：斐波那契的 fib(3) 被计算多次              │
   └─────────────────────────────────────────────────┘

3. 无后效性（No Aftereffect）
   ┌─────────────────────────────────────────────────┐
   │  一旦某个状态被确定，后续决策不受之前决策影响     │
   │  即：当前状态只和之前的状态有关                  │
   └─────────────────────────────────────────────────┘
```

### 1.3 动态规划的解题步骤

```
动态规划解题四步法：

Step 1: 定义状态
  ┌─────────────────────────────────┐
  │ dp[i] 或 dp[i][j] 代表什么？    │
  └─────────────────────────────────┘

Step 2: 状态转移方程
  ┌─────────────────────────────────┐
  │ dp[i] = f(dp[0], dp[1], ..., dp[i-1])  │
  │ 如何从子问题得到当前问题？       │
  └─────────────────────────────────┘

Step 3: 初始化
  ┌─────────────────────────────────┐
  │ dp[0], dp[1] 等边界值是什么？   │
  └─────────────────────────────────┘

Step 4: 计算顺序
  ┌─────────────────────────────────┐
  │ 从小到大？从大到小？             │
  │ 确保计算时子问题已经求解        │
  └─────────────────────────────────┘
```

---

## 二、基础问题：斐波那契数列

### 2.1 问题描述

```
斐波那契数列：0, 1, 1, 2, 3, 5, 8, 13, 21, ...
F(0) = 0, F(1) = 1
F(n) = F(n-1) + F(n-2), n >= 2
```

### 2.2 多种解法对比

```typescript
/**
 * 解法1：暴力递归
 *
 * 时间复杂度: O(2^n) - 指数级
 * 空间复杂度: O(n) - 递归栈深度
 *
 * 问题：存在大量重复计算
 * 例如：fib(5) = fib(4) + fib(3)
 *           = (fib(3) + fib(2)) + (fib(2) + fib(1))
 *           = ...
 * fib(3) 被计算了 2 次，fib(2) 被计算了 3 次
 */
function fibRecursive(n: number): number {
  if (n <= 1) return n;
  return fibRecursive(n - 1) + fibRecursive(n - 2);
}

/**
 * 解法2：记忆化递归（自顶向下 DP）
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(n)
 *
 * 思路：用一个数组记录已计算过的 fib(i)
 * 每次递归前先查表，如果已计算则直接返回
 */
function fibMemoization(n: number, memo: number[] = []): number {
  if (n <= 1) return n;

  // 如果已经计算过，直接返回
  if (memo[n] !== undefined) {
    return memo[n];
  }

  // 递归计算并存储
  memo[n] = fibMemoization(n - 1, memo) + fibMemoization(n - 2, memo);
  return memo[n];
}

/**
 * 解法3：动态规划（自底向上）
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(n)
 *
 * 思路：从 fib(0), fib(1) 开始，逐步计算到 fib(n)
 */
function fibDP(n: number): number {
  if (n <= 1) return n;

  // dp[i] 表示第 i 个斐波那契数
  const dp: number[] = new Array(n + 1).fill(0);
  dp[1] = 1; // fib(1) = 1

  // 自底向上递推
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]; // 状态转移方程
  }

  return dp[n];
}

/**
 * 解法4：空间优化的动态规划
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 *
 * 思路：观察发现，计算 fib(i) 只需要 fib(i-1) 和 fib(i-2)
 * 所以不需要存储整个数组，只需两个变量
 */
function fibOptimized(n: number): number {
  if (n <= 1) return n;

  let prev = 0;  // fib(i-2)
  let curr = 1;  // fib(i-1)

  for (let i = 2; i <= n; i++) {
    const next = prev + curr; // fib(i)
    prev = curr;               // 更新 fib(i-2)
    curr = next;               // 更新 fib(i-1)
  }

  return curr;
}

// 测试
console.log(fibRecursive(10));        // 55
console.log(fibMemoization(10));      // 55
console.log(fibDP(10));               // 55
console.log(fibOptimized(10));       // 55
```

---

## 三、经典问题

### 3.1 爬楼梯问题

**LeetCode 70. 爬楼梯**

```typescript
/**
 * 问题：假设你正在爬楼梯。需要 n 阶你才能到达楼顶。
 *      每次你可以爬 1 或 2 个台阶。有多少种不同的方法？
 *
 * 分析：
 * - 爬到第 n 阶，要么从 n-1 阶爬 1 步，要么从 n-2 阶爬 2 步
 * - dp[n] = dp[n-1] + dp[n-2]
 * - 初始值：dp[0] = 1（一种方式：不动），dp[1] = 1，dp[2] = 2
 *
 * 这其实就是斐波那契数列！
 */
function climbStairs(n: number): number {
  if (n <= 2) return n;

  // dp[i] = 爬到第 i 阶的方法数
  const dp: number[] = new Array(n + 1).fill(0);
  dp[1] = 1; // 爬到第1阶有1种方法（只爬1步）
  dp[2] = 2; // 爬到第2阶有2种方法（1+1 或 2）

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

/**
 * 空间优化版本
 */
function climbStairsOptimized(n: number): number {
  if (n <= 2) return n;

  let prev = 1;  // dp[1]
  let curr = 2; // dp[2]

  for (let i = 3; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }

  return curr;
}

// 测试
console.log(climbStairs(2));  // 2：1+1 或 2
console.log(climbStairs(3));  // 3：1+1+1, 1+2, 2+1
console.log(climbStairs(5));  // 8
```

### 3.2 不同路径问题

**LeetCode 62. 不同路径**

```typescript
/**
 * 问题：一个机器人位于 m×n 网格的左上角。
 *      机器人每次只能向下或向右移动一步。
 *      问有多少条不同的路径？
 *
 * 分析：
 * - 到达 (i,j) 位置，只能从 (i-1,j) 或 (i,j-1) 过来
 * - dp[i][j] = dp[i-1][j] + dp[i][j-1]
 * - 边界：dp[i][0] = 1（只能从上面下来），dp[0][j] = 1（只能从左边过来）
 */
function uniquePaths(m: number, n: number): number {
  // dp[i][j] = 到达 (i,j) 的路径数
  const dp: number[][] = Array.from({ length: m }, () =>
    new Array(n).fill(0)
  );

  // 初始化边界
  // 第一行：只能从左边过来，每格只有1条路径
  for (let j = 0; j < n; j++) {
    dp[0][j] = 1;
  }

  // 第一列：只能从上面下来，每格只有1条路径
  for (let i = 0; i < m; i++) {
    dp[i][0] = 1;
  }

  // 填充其他位置
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
  }

  return dp[m - 1][n - 1];
}

/**
 * 空间优化：只用一行数组
 */
function uniquePathsOptimized(m: number, n: number): number {
  const dp: number[] = new Array(n).fill(1); // 初始化为1

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] = dp[j] + dp[j - 1]; // dp[j] 是上方格子的值，dp[j-1] 是左边格子的值
    }
  }

  return dp[n - 1];
}

/**
 * LeetCode 63. 不同路径 II（有障碍物）
 */
function uniquePathsWithObstacles(obstacleGrid: number[][]): number {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;
  const dp: number[][] = Array.from({ length: m }, () =>
    new Array(n).fill(0)
  );

  // 起点处理
  if (obstacleGrid[0][0] === 1) return 0;
  dp[0][0] = 1;

  // 第一行
  for (let j = 1; j < n; j++) {
    if (obstacleGrid[0][j] === 1) {
      dp[0][j] = 0; // 遇到障碍，路径数为0
    } else {
      dp[0][j] = dp[0][j - 1];
    }
  }

  // 第一列
  for (let i = 1; i < m; i++) {
    if (obstacleGrid[i][0] === 1) {
      dp[i][0] = 0;
    } else {
      dp[i][0] = dp[i - 1][0];
    }
  }

  // 填充其他位置
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (obstacleGrid[i][j] === 1) {
        dp[i][j] = 0; // 障碍物，路径数为0
      } else {
        dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
      }
    }
  }

  return dp[m - 1][n - 1];
}

// 测试
console.log(uniquePaths(3, 7));  // 28
console.log(uniquePaths(3, 2)); // 3
console.log(uniquePathsWithObstacles([
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
])); // 2
```

---

## 四、背包问题

### 4.1 0-1 背包问题

```typescript
/**
 * 0-1 背包问题
 *
 * 问题：有 n 件物品，每件物品的重量为 w[i]，价值为 v[i]。
 *       背包容量为 C。问如何选择物品使得总价值最大？
 *
 * 分析：
 * - 每件物品只能选 0 或 1 次（不能分割）
 * - dp[i][j] = 前 i 件物品放入容量为 j 的背包的最大价值
 * - 状态转移：
 *   - 如果不选第 i 件：dp[i][j] = dp[i-1][j]
 *   - 如果选第 i 件（前提：j >= w[i]）：dp[i][j] = dp[i-1][j-w[i]] + v[i]
 *   - 取两者的最大值
 *
 * 时间复杂度: O(n × C)
 * 空间复杂度: O(n × C) 或 O(C)
 */

/**
 * 0-1 背包 - 二维 DP 版本
 */
function knapsack01(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;

  // dp[i][j] = 前 i 件物品（0~i-1）放入容量为 j 的背包的最大价值
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  // 填充 dp 表
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= capacity; j++) {
      // 不选第 i 件物品
      dp[i][j] = dp[i - 1][j];

      // 如果选第 i 件物品（物品索引 i-1）
      if (j >= weights[i - 1]) {
        dp[i][j] = Math.max(
          dp[i][j],
          dp[i - 1][j - weights[i - 1]] + values[i - 1]
        );
      }
    }
  }

  return dp[n][capacity];
}

/**
 * 0-1 背包 - 空间优化版本（一维数组）
 *
 * 关键：内层循环要倒序遍历容量
 * 原因：如果正序遍历，会导致同一物品被多次选择
 */
function knapsack01Optimized(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    // 关键：倒序遍历，确保每件物品只被选一次
    // j 从 capacity 降到 weights[i]
    for (let j = capacity; j >= weights[i]; j--) {
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}

// 测试
console.log(knapsack01([2, 3, 4, 5], [3, 4, 5, 6], 5)); // 8（选物品2和3）
console.log(knapsack01Optimized([2, 3, 4, 5], [3, 4, 5, 6], 5)); // 8
```

### 4.2 完全背包问题

```typescript
/**
 * 完全背包问题
 *
 * 问题：每件物品有无限个，可以选择任意多次
 *
 * 状态转移：
 * dp[i][j] = max(dp[i-1][j], dp[i][j-w[i]] + v[i])
 *           不选第i件          选第i件（注意：用的是 dp[i] 不是 dp[i-1]）
 *
 * 关键区别：0-1背包内层循环倒序，完全背包内层循环正序
 */
function knapsackComplete(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    // 正序遍历：每件物品可以被选多次
    for (let j = weights[i]; j <= capacity; j++) {
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}

/**
 * LeetCode 322. 零钱兑换
 * 完全背包问题的变体
 */
function coinChange(coins: number[], amount: number): number {
  // dp[j] = 凑成金额 j 所需的最少硬币数
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // 凑成金额 0 需要 0 个硬币

  for (const coin of coins) {
    // 正序：每种硬币可以用多次
    for (let j = coin; j <= amount; j++) {
      dp[j] = Math.min(dp[j], dp[j - coin] + 1);
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

// 测试
console.log(coinChange([1, 2, 5], 11)); // 3 (5+5+1)
console.log(coinChange([2], 3));         // -1
console.log(coinChange([1], 0));        // 0
```

### 4.3 多重背包问题

```typescript
/**
 * 多重背包问题
 *
 * 问题：每件物品有数量限制，不能超过给定数量
 */
function knapsackMultiple(
  weights: number[],
  values: number[],
  counts: number[],
  capacity: number
): number {
  const n = weights.length;
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    // 第 i 件物品最多用 counts[i] 个
    for (let j = capacity; j >= weights[i]; j--) {
      // 对于容量 j，尝试放入 k 个第 i 件物品
      for (let k = 1; k <= counts[i] && j >= k * weights[i]; k++) {
        dp[j] = Math.max(dp[j], dp[j - k * weights[i]] + k * values[i]);
      }
    }
  }

  return dp[capacity];
}
```

---

## 五、最长公共子序列（LCS）

### 5.1 问题描述

```
字符串 "ABCD" 和 "ACDF" 的最长公共子序列：
- "ACD" (长度 3)
- "AD" (长度 3)
最长是 3
```

### 5.2 代码实现

```typescript
/**
 * LeetCode 1143. 最长公共子序列
 *
 * 问题：给定两个字符串 text1 和 text2，返回它们的最长公共子序列的长度
 *
 * 分析：
 * - dp[i][j] = text1[0..i-1] 和 text2[0..j-1] 的 LCS 长度
 * - 如果 text1[i-1] == text2[j-1]：dp[i][j] = dp[i-1][j-1] + 1
 * - 否则：dp[i][j] = max(dp[i-1][j], dp[i][j-1])
 *
 * 时间复杂度: O(m × n)
 * 空间复杂度: O(m × n) 或 O(min(m,n))
 */
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;

  // dp[i][j] = text1[0..i-1] 和 text2[0..j-1] 的 LCS 长度
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  // 填充 dp 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        // 最后一个字符相等，LCS = 前面的 LCS + 1
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        // 最后一个字符不等，取两种情况的最大值
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 空间优化版本
 */
function longestCommonSubsequenceOptimized(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;

  // 确保 text2 是较短的字符串（节省空间）
  if (m < n) {
    [text1, text2, m, n] = [text2, text1, n, m];
  }

  // dp[j] = 当前行 dp[i][j]
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev]; // 交换两行
    curr.fill(0); // 重置新行
  }

  return prev[n];
}

// 测试
console.log(longestCommonSubsequence("abcde", "ace")); // 3 ("ace")
console.log(longestCommonSubsequence("abc", "def"));  // 0
console.log(longestCommonSubsequence("abcba", "abcbcba")); // 5 ("abcba")
```

---

## 六、最长递增子序列（LIS）

### 6.1 问题描述

```
数组 [10, 9, 2, 5, 3, 7, 101, 18] 的最长递增子序列：
- [2, 3, 7, 101] (长度 4)
- [2, 3, 7, 18] (长度 4)
最长是 4
```

### 6.2 代码实现

```typescript
/**
 * LeetCode 300. 最长递增子序列
 *
 * 方法1：动态规划 O(n²)
 *
 * dp[i] = 以 nums[i] 结尾的最长递增子序列长度
 * dp[i] = max(dp[j] + 1), for all j < i and nums[j] < nums[i]
 */
function lengthOfLIS(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;

  const dp: number[] = new Array(n).fill(1); // 每个元素自己构成长度为1的子序列

  let maxLen = 1;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        // nums[i] 可以接在 nums[j] 后面
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }

  return maxLen;
}

/**
 * 方法2：二分查找优化 O(n log n)
 *
 * 核心思想：维护一个 tails 数组
 * tails[i] = 长度为 i+1 的递增子序列的最小结尾元素
 *
 * 例如：nums = [10, 9, 2, 5, 3, 7, 101, 18]
 *
 * 遍历过程：
 * 10: tails = [10]
 * 9:  tails = [9]          (替换 10)
 * 2:  tails = [2]          (替换 9)
 * 5:  tails = [2, 5]
 * 3:  tails = [2, 3]       (替换 5)
 * 7:  tails = [2, 3, 7]
 * 101: tails = [2, 3, 7, 101]
 * 18: tails = [2, 3, 7, 18] (替换 101)
 *
 * tails 长度 = 4，即最长递增子序列长度
 */
function lengthOfLISTail(nums: number[]): number {
  const tails: number[] = [];

  for (const num of nums) {
    // 找到第一个 >= num 的位置
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = left + Math.floor((right - left) / 2);
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // 如果 left 等于 tails 长度，说明 num 最大，直接追加
    if (left === tails.length) {
      tails.push(num);
    } else {
      // 否则替换 tails[left]
      tails[left] = num;
    }
  }

  return tails.length;
}

// 测试
console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]));     // 4
console.log(lengthOfLISTail([10, 9, 2, 5, 3, 7, 101, 18])); // 4
```

---

## 七、编辑距离

### 7.1 问题描述

```
将 "horse" 转换成 "ros" 的最少操作数：

horse -> ros (删除 h, e)
步骤：
1. horse -> rorse (插入 r)
2. rorse -> rose (删除 r)
3. rose -> ros (删除 e)

最少需要 3 步操作
```

### 7.2 代码实现

```typescript
/**
 * LeetCode 72. 编辑距离
 *
 * 问题：给你两个单词 word1 和 word2，
 *       请你计算将 word1 转换成 word2 需要的最少操作数
 *       操作：插入、删除、替换（各算1步）
 *
 * 分析：
 * dp[i][j] = word1[0..i-1] 转换成 word2[0..j-1] 的最少操作数
 *
 * 状态转移：
 * - 如果 word1[i-1] == word2[j-1]：dp[i][j] = dp[i-1][j-1]
 * - 否则，dp[i][j] = min(
 *     dp[i-1][j] + 1,    // 删除 word1[i-1]
 *     dp[i][j-1] + 1,    // 插入 word2[j-1]
 *     dp[i-1][j-1] + 1  // 替换
 *   )
 *
 * 时间复杂度: O(m × n)
 * 空间复杂度: O(m × n)
 */
function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;

  // dp[i][j] = word1[0..i-1] 和 word2[0..j-1] 的编辑距离
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    new Array(n + 1).fill(0)
  );

  // 初始化边界
  // word1 转换为空串，需要删除所有字符
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  // 空串转换为 word2，需要插入所有字符
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // 填充 dp 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        // 最后一个字符相同，不需要操作
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // 取三种操作的最小值 + 1
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 空间优化版本
 */
function minDistanceOptimized(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;

  // 确保用较短的字符串作为列
  if (m < n) {
    [word1, word2, m, n] = [word2, word1, n, m];
  }

  // prev[j] = dp[i-1][j]
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  // 初始化：空串 -> word2
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i; // word1[0..i-1] -> 空串
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(prev[j], curr[j - 1], prev[j - 1]) + 1;
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

// 测试
console.log(minDistance("horse", "ros"));    // 3
console.log(minDistance("intention", "execution")); // 5
```

---

## 八、股票买卖问题

### 8.1 问题系列概述

```
股票买卖问题（LeetCode 121-123, 188, 309）

最佳买卖股票时机系列：
- 121. 买卖股票的最佳时机（只能交易一次）
- 122. 买卖股票的最佳时机 II（可以交易无数次）
- 123. 买卖股票的最佳时机 III（最多交易两次）
- 188. 买卖股票的最佳时机 IV（最多交易 k 次）
- 309. 最佳买卖股票时机含冷冻期（交易后隔天才能买）
```

### 8.2 代码实现

```typescript
/**
 * LeetCode 121. 买卖股票的最佳时机（只能交易一次）
 *
 * 分析：
 * - 记录最低价格和最大利润
 * - 遍历数组，对于每天的 prices[i]：
 *   - 更新最低价格
 *   - 计算在最低价格买入、今天卖出的利润
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 */
function maxProfit(prices: number[]): number {
  if (prices.length === 0) return 0;

  let minPrice = prices[0];  // 到目前为止的最低价格
  let maxProfit = 0;         // 最大利润

  for (let i = 1; i < prices.length; i++) {
    // 更新最低价格
    minPrice = Math.min(minPrice, prices[i]);

    // 计算今天卖出的利润
    maxProfit = Math.max(maxProfit, prices[i] - minPrice);
  }

  return maxProfit;
}

/**
 * LeetCode 122. 买卖股票的最佳时机 II（可以交易无数次）
 *
 * 分析：贪心解法
 * 只要今天价格比昨天高，就昨天买今天卖
 */
function maxProfitII(prices: number[]): number {
  let profit = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      profit += prices[i] - prices[i - 1];
    }
  }

  return profit;
}

/**
 * DP 解法（更通用，可扩展）
 *
 * dp[i][0] = 第 i 天持有股票的最大现金
 * dp[i][1] = 第 i 天不持有股票且不在冷冻期的最大现金
 * dp[i][2] = 第 i 天处于冷冻期的最大现金
 */
function maxProfitIIDP(prices: number[]): number {
  if (prices.length === 0) return 0;

  const n = prices.length;
  // dp[天数][状态]
  // 0: 持有股票
  // 1: 不持有股票且不在冷冻期
  // 2: 处于冷冻期
  const dp: number[][] = Array.from({ length: n }, () => [0, 0, 0]);

  dp[0][0] = -prices[0]; // 第0天买入股票
  dp[0][1] = 0;          // 第0天什么都没做
  dp[0][2] = 0;          // 第0天不可能在冷冻期

  for (let i = 1; i < n; i++) {
    dp[i][0] = Math.max(dp[i - 1][0], dp[i - 1][1] - prices[i]);
    dp[i][1] = Math.max(dp[i - 1][1], dp[i - 1][2]);
    dp[i][2] = dp[i - 1][0] + prices[i]; // 今天卖出股票
  }

  return Math.max(dp[n - 1][1], dp[n - 1][2]);
}

/**
 * LeetCode 123. 买卖股票的最佳时机 III（最多交易两次）
 *
 * 限制：最多只能进行两次交易
 *
 * 分析：
 * 四种状态：
 * - buy1: 第一次买入后的最大现金
 * - sell1: 第一次卖出后的最大现金
 * - buy2: 第二次买入后的最大现金
 * - sell2: 第二次卖出后的最大现金
 */
function maxProfitIII(prices: number[]): number {
  if (prices.length === 0) return 0;

  let buy1 = -prices[0];  // 第一次买入后
  let sell1 = 0;          // 第一次卖出后
  let buy2 = -prices[0]; // 第二次买入后
  let sell2 = 0;          // 第二次卖出后

  for (let i = 1; i < prices.length; i++) {
    // 第一次买入：之前买入 或 今天买入
    buy1 = Math.max(buy1, -prices[i]);

    // 第一次卖出：之前卖出 或 今天卖出
    sell1 = Math.max(sell1, buy1 + prices[i]);

    // 第二次买入：之前买入 或 今天买入（用第一次卖出的现金）
    buy2 = Math.max(buy2, sell1 - prices[i]);

    // 第二次卖出：之前卖出 或 今天卖出
    sell2 = Math.max(sell2, buy2 + prices[i]);
  }

  return sell2;
}

/**
 * LeetCode 188. 买卖股票的最佳时机 IV（最多交易 k 次）
 */
function maxProfitIV(k: number, prices: number[]): number {
  if (prices.length === 0 || k === 0) return 0;

  // 如果 k >= n/2，就变成无限交易
  if (k >= prices.length / 2) {
    let profit = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        profit += prices[i] - prices[i - 1];
      }
    }
    return profit;
  }

  // DP: buy[j] = 第 j 次买入后的最大现金, sell[j] = 第 j 次卖出后的最大现金
  const buy = new Array(k).fill(-prices[0]);
  const sell = new Array(k).fill(0);

  for (let i = 1; i < prices.length; i++) {
    buy[0] = Math.max(buy[0], -prices[i]);
    sell[0] = Math.max(sell[0], buy[0] + prices[i]);

    for (let j = 1; j < k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - prices[i]);
      sell[j] = Math.max(sell[j], buy[j] + prices[i]);
    }
  }

  return sell[k - 1];
}

// 测试
console.log(maxProfit([7, 1, 5, 3, 6, 4]));      // 5 (低买高卖)
console.log(maxProfitII([7, 1, 5, 3, 6, 4]));    // 7 (多次交易)
console.log(maxProfitIII([3, 3, 5, 0, 0, 3, 1, 4])); // 6
console.log(maxProfitIV(2, [2, 4, 1]));           // 2
```

---

## 九、DP 优化技巧

### 9.1 状态压缩

```typescript
/**
 * 状态压缩：将二维 DP 数组压缩为一维
 *
 * 适用条件：
 * - dp[i][j] 只和 dp[i-1][*] 有关
 * - 即计算第 i 行时，只需要第 i-1 行的数据
 *
 * 示例：0-1 背包问题
 */
function knapsack01SpaceOptimized(weights: number[], values: number[], capacity: number): number {
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < weights.length; i++) {
    // 关键：内层循环倒序，防止同一物品被多次选择
    for (let j = capacity; j >= weights[i]; j--) {
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}

/**
 * 示例：LCS 空间优化
 */
function longestCommonSubsequenceSpaceOptimized(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;

  // 确保 m <= n，减少空间
  if (m > n) {
    [text1, text2, m, n] = [text2, text1, n, m];
  }

  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return prev[n];
}
```

### 9.2 滚动数组

```typescript
/**
 * 滚动数组：将二维数组的两行或两列反复使用
 *
 * 示例：不同路径问题
 */
function uniquePathsRolling(m: number, n: number): number {
  // 只保留当前行和下一行
  let prev = new Array(n).fill(1);
  let curr = new Array(n).fill(1);

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      curr[j] = prev[j] + curr[j - 1];
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n - 1];
}
```

---

## 十、复杂度分析

| 问题 | 时间复杂度 | 空间复杂度 | 备注 |
|------|-----------|-----------|------|
| 斐波那契 | O(n) | O(1) | 空间可优化 |
| 爬楼梯 | O(n) | O(1) | 同斐波那契 |
| 0-1 背包 | O(n×C) | O(C) | 空间可优化 |
| 完全背包 | O(n×C) | O(C) | 内层正序 |
| LCS | O(m×n) | O(min(m,n)) | 可空间优化 |
| LIS | O(n²) / O(n log n) | O(n) / O(1) | 二分优化 |
| 编辑距离 | O(m×n) | O(min(m,n)) | 可空间优化 |
| 股票买卖 | O(n) / O(n×k) | O(k) | k=交易次数 |

---

## 十一、LeetCode 练习题

### 入门级
1. **LeetCode 70. 爬楼梯** - 斐波那契
2. **LeetCode 509. 斐波那契数** - 基础 DP
3. **LeetCode 746. 使用最小花费爬楼梯** - 简单 DP

### 基础级
4. **LeetCode 62. 不同路径** - 二维 DP
5. **LeetCode 63. 不同路径 II** - 有障碍物
6. **LeetCode 300. 最长递增子序列** - LIS
7. **LeetCode 322. 零钱兑换** - 完全背包
8. **LeetCode 1143. 最长公共子序列** - LCS

### 进阶级
9. **LeetCode 72. 编辑距离** - 字符串 DP
10. **LeetCode 123. 买卖股票的最佳时机 III** - 多状态 DP
11. **LeetCode 188. 买卖股票的最佳时机 IV** - K 次交易
12. **LeetCode 279. 完全平方数** - 完全背包变形

### 困难级
13. **LeetCode 10. 正则表达式匹配** - 复杂字符串 DP
14. **LeetCode 72. 编辑距离** - 多状态
15. **LeetCode 312. 戳气球** - 区间 DP

---

## 十二、本章小结

本章我们系统学习了动态规划：

1. **核心思想**：存储子问题解避免重复计算，将指数级问题降为多项式级

2. **解题四步法**：
   - 定义状态（dp 数组的含义）
   - 状态转移方程（如何从子问题得到当前问题）
   - 初始化（边界值）
   - 计算顺序

3. **经典问题**：
   - 斐波那契数列、爬楼梯
   - 0-1 背包、完全背包
   - LCS、LIS
   - 编辑距离
   - 股票买卖系列

4. **优化技巧**：
   - 空间压缩（一维数组代替二维）
   - 滚动数组
   - 二分查找优化（如 LIS）

5. **关键提醒**：
   - 不是所有问题都能用 DP
   - DP 的关键是找到正确的状态定义
   - 空间优化时注意内层循环方向（0-1背包倒序，完全背包正序）

---

**上一篇**：[03_分治算法_Divide_and_Conquer.md](./03_分制算法_Divide_and_Conquer.md)
**下一篇**：[05_回溯算法_Backtracking.md](./05_回溯算法_Backtracking.md)
