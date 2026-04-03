# 暴力搜索算法（Brute Force）

## 一、暴力搜索概述

暴力搜索（Brute Force Search）是最简单、最直接的算法设计方法。它的核心思想是：**枚举所有可能的情况，逐一检查找出正确答案**。

### 1.1 暴力搜索的特点

**优点**：
- 思想简单，容易理解和实现
- 不需要复杂的数学推导
- 可以作为其他算法的 baseline 和验证工具

**缺点**：
- 时间复杂度通常较高
- 对于大规模问题效率低下
- 但仍然是面试和竞赛中的重要基础

### 1.2 暴力搜索的适用场景

```
适用场景：
1. 解空间较小，可以穷举所有情况
2. 没有明显的数学规律可以利用
3. 作为其他算法的第一步（先实现、再优化）
4. 数据规模小，简单遍历即可
```

---

## 二、字符串匹配：BF算法

### 2.1 问题描述

在主串 `s` 中查找模式串 `p` 第一次出现的位置。

### 2.2 算法原理

BF算法的思想非常直接：
1. 从主串的第一个字符开始
2. 依次与模式串的每个字符比较
3. 如果匹配失败，则回溯到主串的下一个字符重新开始
4. 直到找到匹配或主串遍历完毕

### 2.3 算法步骤

```
主串: "A B A B A B A C A"
模式: "A B A C"

第1轮比较:
  A B A B A B A C A
  A B A C          ← 匹配失败，回溯

第2轮比较:
  A B A B A B A C A
    A B A C        ← 匹配失败，回溯

第3轮比较:
  A B A B A B A C A
      A B A C      ← 匹配成功！返回位置2
```

### 2.4 代码实现

```typescript
/**
 * 暴力搜索字符串匹配算法
 * @param s 主串（source string）
 * @param p 模式串（pattern string）
 * @returns 模式串在主串中第一次匹配的索引，未找到返回-1
 */
function bfMatch(s: string, p: string): number {
  const n = s.length; // 主串长度
  const m = p.length; // 模式串长度

  // 边界情况：模式串为空或长度大于主串
  if (m === 0) return 0;
  if (m > n) return -1;

  // i: 主串中当前比较的位置
  // j: 模式串中当前比较的位置
  for (let i = 0; i <= n - m; i++) { // 只需比较到 n-m 的位置
    let j = 0;

    // 逐字符比较
    while (j < m && s[i + j] === p[j]) {
      j++;
    }

    // 如果模式串全部匹配成功
    if (j === m) {
      return i; // 返回匹配开始的位置
    }
  }

  // 主串遍历完毕，未找到匹配
  return -1;
}

// 测试代码
console.log(bfMatch("ABABABACA", "ABAC")); // 输出: 2
console.log(bfMatch("Hello World", "World")); // 输出: 6
console.log(bfMatch("ABCDEF", "XYZ")); // 输出: -1
```

### 2.5 复杂度分析

```
时间复杂度: O(n × m)
  - n 为主串长度，m 为模式串长度
  - 最坏情况：主串和模式串不断匹配到最后一个字符才失败
  - 例如：s = "AAAA...A" (n个A)，p = "AAA...B" (m个A + 1个B)

空间复杂度: O(1)
  - 只需使用常数个变量
```

---

## 三、数组遍历：简单查找

### 3.1 顺序查找

```typescript
/**
 * 顺序查找：在数组中查找目标元素
 * @param arr 输入数组
 * @param target 目标值
 * @returns 目标值的索引，未找到返回-1
 */
function sequentialSearch<T>(arr: T[], target: T): number {
  // 遍历数组的每一个元素
  for (let i = 0; i < arr.length; i++) {
    // 逐个比较，相等则返回索引
    if (arr[i] === target) {
      return i;
    }
  }

  // 遍历完毕未找到，返回-1
  return -1;
}

/**
 * 顺序查找（返回所有匹配位置）
 */
function findAllIndices<T>(arr: T[], target: T): number[] {
  const indices: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      indices.push(i);
    }
  }

  return indices;
}

// 测试
console.log(sequentialSearch([1, 3, 5, 7, 9], 5)); // 输出: 2
console.log(findAllIndices([1, 2, 1, 3, 1], 1)); // 输出: [0, 2, 4]
```

### 3.2 最大值/最小值查找

```typescript
/**
 * 查找数组中的最大值
 */
function findMax(arr: number[]): number {
  if (arr.length === 0) {
    throw new Error("数组不能为空");
  }

  let max = arr[0]; // 假设第一个元素是最大值

  // 遍历剩余元素，逐个比较
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]; // 更新最大值
    }
  }

  return max;
}

/**
 * 查找数组中的最大和最小值（一次遍历完成）
 */
function findMaxAndMin(arr: number[]): { max: number; min: number } {
  if (arr.length === 0) {
    throw new Error("数组不能为空");
  }

  // 初始化最大值和最小值
  let max = arr[0];
  let min = arr[0];

  // 只需一次遍历，同时更新最大和最小值
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
    if (arr[i] < min) {
      min = arr[i];
    }
  }

  return { max, min };
}

// 测试
console.log(findMax([3, 1, 4, 1, 5, 9, 2, 6])); // 输出: 9
console.log(findMaxAndMin([3, 1, 4, 1, 5, 9, 2, 6])); // 输出: { max: 9, min: 1 }
```

---

## 四、暴力枚举问题

### 4.1 两数之和

**LeetCode 1. 两数之和**

```typescript
/**
 * 两数之和：给定数组和目标值，找出和为目标值的两个数的索引
 *
 * 思路：暴力枚举所有可能的配对
 * - 遍历数组中的每一个元素
 * - 对于每个元素，遍历它后面的所有元素
 * - 检查两者之和是否等于目标值
 *
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1)
 */
function twoSum(nums: number[], target: number): number[] {
  const n = nums.length;

  // 外层循环：遍历每一个元素作为第一个数
  for (let i = 0; i < n; i++) {
    // 内层循环：遍历i之后的元素作为第二个数
    for (let j = i + 1; j < n; j++) {
      // 检查两数之和是否等于目标值
      if (nums[i] + nums[j] === target) {
        return [i, j]; // 找到答案，返回两个索引
      }
    }
  }

  // 题目保证有解，这里不会执行到这里
  return [];
}

// 测试
console.log(twoSum([2, 7, 11, 15], 9)); // 输出: [0, 1] (2 + 7 = 9)
console.log(twoSum([3, 2, 4], 6)); // 输出: [1, 2] (2 + 4 = 6)
console.log(twoSum([3, 3], 6)); // 输出: [0, 1] (3 + 3 = 6)
```

### 4.2 三数之和

**LeetCode 15. 三数之和**

```typescript
/**
 * 三数之和：找出数组中所有和为零的三元组
 *
 * 思路：暴力枚举 + 双指针优化
 * 1. 先对数组排序
 * 2. 固定一个数，然后使用双指针找另外两个数
 * 3. 通过跳过重复元素避免重复三元组
 *
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1) 或 O(n)（取决于是否计入排序和结果的空间）
 */
function threeSum(nums: number[]): number[][] {
  const n = nums.length;
  const result: number[][] = [];

  // 边界情况：数组长度小于3
  if (n < 3) return result;

  // 1. 先对数组排序，便于后续跳过重复元素
  nums.sort((a, b) => a - b);

  // 2. 固定第一个数
  for (let i = 0; i < n - 2; i++) {
    // 剪枝：如果最小的数大于0，三数之和不可能为0
    if (nums[i] > 0) break;

    // 跳过重复元素，避免重复三元组
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    // 3. 双指针：left指向i右侧，right指向末尾
    let left = i + 1;
    let right = n - 1;

    // 4. 移动指针寻找和为-nums[i]的两个数
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        // 找到一个解
        result.push([nums[i], nums[left], nums[right]]);

        // 跳过重复元素
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        // 移动指针继续寻找
        left++;
        right--;
      } else if (sum < 0) {
        // sum小于0，说明需要更大的数，左指针右移
        left++;
      } else {
        // sum大于0，说明需要更小的数，右指针左移
        right--;
      }
    }
  }

  return result;
}

// 测试
console.log(threeSum([-1, 0, 1, 2, -1, -4]));
// 输出: [[-1, -1, 2], [-1, 0, 1]]
```

### 4.3 全排列

**LeetCode 46. 全排列**

```typescript
/**
 * 全排列：生成数组的所有可能排列
 *
 * 思路：回溯法（暴力搜索的升级版）
 * 1. 用path记录当前已选择的排列
 * 2. 用used数组标记哪些元素已被使用
 * 3. 当path长度等于数组长度时，得到一个完整排列
 * 4. 通过回溯尝试所有可能
 *
 * 时间复杂度: O(n! × n)
 * 空间复杂度: O(n)
 */
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = []; // 当前排列
  const used = new Array(nums.length).fill(false); // 标记元素是否已使用

  // 回溯函数
  function backtrack() {
    // 终止条件：当前排列长度等于数组长度
    if (path.length === nums.length) {
      // 保存当前排列的副本（因为path会继续变化）
      result.push([...path]);
      return;
    }

    // 遍历所有选择
    for (let i = 0; i < nums.length; i++) {
      // 如果当前元素已被使用，跳过
      if (used[i]) continue;

      // 做选择：添加到当前排列
      path.push(nums[i]);
      used[i] = true;

      // 递归进入下一层
      backtrack();

      // 撤销选择（回溯）
      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

// 测试
console.log(permute([1, 2, 3]));
// 输出: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]

/**
 * 全排列（含重复元素）
 * LeetCode 47. 全排列 II
 */
function permuteUnique(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used = new Array(nums.length).fill(false);

  // 先排序，便于跳过重复元素
  nums.sort((a, b) => a - b);

  function backtrack() {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      // 跳过已使用的元素
      if (used[i]) continue;

      // 剪枝：跳过同一层重复的元素
      // 关键：如果 nums[i] === nums[i-1] 且 nums[i-1] 未使用，
      // 说明同一层的相同元素已经被回溯完了，不需要再选
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

      path.push(nums[i]);
      used[i] = true;

      backtrack();

      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

console.log(permuteUnique([1, 1, 2]));
// 输出: [[1,1,2], [1,2,1], [2,1,1]]
```

---

## 五、暴力搜索的优化策略

### 5.1 剪枝优化

在暴力搜索过程中，如果能提前判断某个分支不可能产生有效解，就可以跳过该分支，这就是"剪枝"。

```typescript
/**
 * 回溯 + 剪枝：八皇后问题
 * LeetCode 51. N皇后
 *
 * 思路：
 * 1. 逐行放置皇后
 * 2. 检查放置位置是否合法（同行、同列、同对角线）
 * 3. 利用约束进行剪枝
 *
 * 时间复杂度: O(n!) 实际远小于 n!
 */
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  // 初始化棋盘，用 '.' 表示空位，'Q' 表示皇后
  const board = Array.from({ length: n }, () => '.'.repeat(n).split(''));

  // 列约束：colSet 记录已被占据的列
  const colSet = new Set<number>();
  // 正对角线约束：d1Set 记录主对角线 (row - col)
  const d1Set = new Set<number>();
  // 副对角线约束：d2Set 记录副对角线 (row + col)
  const d2Set = new Set<number>();

  /**
   * 回溯函数
   * @param row 当前处理的行号
   */
  function backtrack(row: number) {
    // 终止条件：所有行都处理完毕，找到一个解
    if (row === n) {
      // 将当前棋盘配置加入结果
      result.push(board.map(r => r.join('')));
      return;
    }

    // 遍历当前行的每一列
    for (let col = 0; col < n; col++) {
      // 计算当前格子的两个对角线标识
      const d1 = row - col; // 主对角线
      const d2 = row + col; // 副对角线

      // 剪枝：检查列和对角线是否已被占据
      if (colSet.has(col) || d1Set.has(d1) || d2Set.has(d2)) {
        continue; // 跳过不合法位置
      }

      // 放置皇后
      board[row][col] = 'Q';
      colSet.add(col);
      d1Set.add(d1);
      d2Set.add(d2);

      // 递归处理下一行
      backtrack(row + 1);

      // 撤销选择（回溯）
      board[row][col] = '.';
      colSet.delete(col);
      d1Set.delete(d1);
      d2Set.delete(d2);
    }
  }

  backtrack(0);
  return result;
}

// 测试
console.log(solveNQueens(4));
// 输出:
// [
//   [".Q..", "...Q", "Q...", "..Q."],
//   ["..Q.", "Q...", "...Q", ".Q.."]
// ]
```

### 5.2 预处理优化

对于字符串匹配问题，可以先对模式串进行预处理，减少比较次数。

```typescript
/**
 * 暴力匹配优化：先检查前缀
 */
function bfMatchOptimized(s: string, p: string): number {
  const n = s.length;
  const m = p.length;

  if (m === 0) return 0;
  if (m > n) return -1;

  // 先检查模式串第一个字符在主串中的所有位置
  const firstChar = p[0];
  const positions: number[] = [];

  for (let i = 0; i <= n - m; i++) {
    if (s[i] === firstChar) {
      positions.push(i);
    }
  }

  // 只在可能的位置开始匹配
  for (const i of positions) {
    let j = 0;
    while (j < m && s[i + j] === p[j]) {
      j++;
    }
    if (j === m) return i;
  }

  return -1;
}
```

---

## 六、复杂度分析方法

### 6.1 时间复杂度分析

暴力搜索的时间复杂度通常较高，常见的有：

| 复杂度 | 含义 | 典型问题 |
|--------|------|----------|
| O(n) | 线性遍历 | 顺序查找 |
| O(n²) | 双重循环 | 两数之和、三数之和 |
| O(n³) | 三重循环 | 暴力破解矩阵乘法 |
| O(n!) | 全排列 | 旅行商问题的暴力解 |
| O(2^n) | 子集枚举 | 求所有子集 |

### 6.2 空间复杂度分析

暴力搜索的空间复杂度通常来自：
- 递归栈深度（回溯算法）
- 辅助数组（如 used 数组）
- 结果存储空间

```typescript
// 空间复杂度示例

// O(1) - 只用常数个变量
function findMax(arr: number[]): number {
  let max = arr[0];
  for (const num of arr) {
    if (num > max) max = num;
  }
  return max;
}

// O(n) - 使用了长度为n的辅助数组
function permute(nums: number[]): number[][] {
  const used = new Array(nums.length).fill(false); // O(n) 空间
  // ...
}

// O(n) - 递归栈深度为n
function fibRecursive(n: number): number {
  if (n <= 1) return n;
  return fibRecursive(n - 1) + fibRecursive(n - 2); // 栈深度为n
}
```

---

## 七、LeetCode 练习题

### 简单难度
1. **LeetCode 1. 两数之和** - 基础枚举
2. **LeetCode 459. 重复的子字符串** - 字符串枚举
3. **LeetCode 704. 二分查找** - 有序数据的暴力搜索优化

### 中等难度
4. **LeetCode 15. 三数之和** - 排序 + 双指针
5. **LeetCode 46. 全排列** - 回溯入门
6. **LeetCode 47. 全排列 II** - 去重技巧
7. **LeetCode 17. 电话号码的字母组合** - 多叉树遍历

### 困难难度
8. **LeetCode 51. N皇后** - 回溯 + 剪枝
9. **LeetCode 37. 解数独** - 二维回溯
10. **LeetCode 679. 24点游戏** - 表达式枚举

---

## 八、暴力搜索的适用场景总结

```
适合使用暴力搜索的情况：
✓ 解空间规模较小（n < 20-30）
✓ 没有明显的数学规律可以利用
✓ 需要找出所有解或最优解
✓ 作为其他算法的 baseline
✓ 题目数据范围暗示需要枚举（如 n ≤ 100, 时间限制宽松）

需要优化的情况：
✗ n 达到 1000+，考虑 O(n²) 优化
✗ n 达到 10^5+，考虑 O(nlogn) 或 O(n) 算法
✗ 明显的单调性，考虑二分搜索
✗ 存在重叠子问题，考虑动态规划
```

---

## 九、本章小结

本章我们学习了暴力搜索算法：

1. **核心思想**：枚举所有可能性，逐一验证
2. **BF字符串匹配**：O(n×m) 的简单匹配算法
3. **数组遍历**：顺序查找、最大最小值
4. **全排列生成**：回溯法的典型应用
5. **剪枝优化**：通过约束条件减少搜索空间

暴力搜索虽然效率不是最优，但它是算法的基础，其他高级算法往往是在暴力搜索的基础上加上某种优化策略发展而来的。

---

**上一篇**：[00_算法范式总览.md](./00_算法范式总览.md)
**下一篇**：[02_贪心算法_Greedy.md](./02_贪心算法_Greedy.md)
