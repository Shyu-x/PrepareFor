# 回溯算法（Backtracking）

## 一、回溯算法概述

### 1.1 什么是回溯算法？

回溯算法是一种**通过尝试和回退来系统地搜索解空间**的算法策略。它是深度优先搜索（DFS）的一种应用，通过"走不通就回退"的方式找出所有可能的解。

```
回溯算法的核心思想：

            初始状态
               │
        ┌──────┴──────┐
        ▼             ▼
      选择A          选择B
        │             │
     ┌──┴──┐        ┌─┴─┐
     ▼     ▼        ▼   ▼
   成功  失败      成功  失败
     │     │        │   │
     └─────┴────────┴───┘
            │
         回退到上一状态
```

### 1.2 回溯算法的特点

**优点**：
- 可以找出所有解
- 不需要存储所有状态
- 适合组合优化问题

**缺点**：
- 时间复杂度通常很高
- 剪枝不好可能导致指数级

### 1.3 回溯与递归的关系

```
回溯 = 递归 + 状态恢复

回溯函数模板：

function backtrack(路径, 选择列表) {
  if (满足结束条件) {
    结果.add(路径);
    return;
  }

  for (选择 in 选择列表) {
    做选择;
    backtrack(新路径, 新选择列表);
    撤销选择;  // 关键：回退到之前的状态
  }
}
```

---

## 二、决策树与解空间

### 2.1 概念解释

```
问题：数组 [1, 2, 3] 的全排列

决策树：
                    []
           ┌─────────┼─────────┐
           │         │         │
          [1]       [2]       [3]
         / │ \     / │ \     / │ \
        /  │  \   /  │  \   /  │  \
      ...  ... ...  ... ...  ... ...

每一条从根到叶子的路径 = 一个完整排列
叶子节点 = 决策完成

解空间大小 = n! （对于 n 个元素的全排列）
```

### 2.2 剪枝的概念

```
剪枝：在搜索过程中，提前判断某个分支不可能产生有效解，跳过该分支

示例：八皇后问题

第1行放置位置: 8种可能
第2行放置位置: 最理想8种，但受第1行影响
第3行放置位置: 更少，...


通过约束检查（同行、同列、同对角线）可以大幅减少搜索空间

未剪枝：8^8 = 16,777,216 种可能
剪枝后：只有 92 种解
```

---

## 三、全排列问题

### 3.1 问题分析

```
输入: [1, 2, 3]
输出: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]

决策过程：
1. 第一个位置：可以是 1, 2, 3
2. 第二个位置：是剩余未使用的数
3. 第三个位置：是最后剩下的数

我们需要记录：
- 当前已选择的排列 (path)
- 哪些元素已被使用 (used)
```

### 3.2 代码实现

```typescript
/**
 * LeetCode 46. 全排列
 *
 * 问题：给定一个不含重复数字的数组，返回其所有可能的全排列
 *
 * 思路：回溯算法
 * - path: 当前已选择的排列
 * - used[i]: 数字 i 是否已被使用
 *
 * 时间复杂度: O(n! × n)
 *   - n! 个排列
 *   - 每个排列需要 O(n) 复制到结果中
 * 空间复杂度: O(n) - 递归栈深度 + used 数组
 */
function permute(nums: number[]): number[][] {
  const result: number[][] = [];  // 存储所有排列
  const path: number[] = [];       // 当前排列
  const used = new Array(nums.length).fill(false); // 标记已使用的元素

  /**
   * 回溯函数
   * @param path 当前已选择的排列
   */
  function backtrack() {
    // 终止条件：排列长度等于数组长度，说明找到完整排列
    if (path.length === nums.length) {
      result.push([...path]); // 复制当前排列到结果中
      return;
    }

    // 遍历所有选择
    for (let i = 0; i < nums.length; i++) {
      // 如果当前数字已被使用，跳过
      if (used[i]) continue;

      // 做选择
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

/**
 * 全排列（带剪枝优化）
 * LeetCode 47. 全排列 II - 数组可能包含重复元素
 */
function permuteUnique(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used = new Array(nums.length).fill(false);

  // 关键：排序以便于剪枝
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
      // 关键：如果 nums[i] === nums[i-1] 且 nums[i-1] 未使用
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

// 测试
console.log(permute([1, 2, 3]));
// 输出: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]

console.log(permuteUnique([1, 1, 2]));
// 输出: [[1,1,2], [1,2,1], [2,1,1]]
```

---

## 四、组合问题

### 4.1 问题分析

```
问题：给定两个整数 n 和 k，返回 [1, n] 中所有可能的 k 个数的组合

示例：
输入: n = 4, k = 2
输出:
[
  [1,2], [1,3], [1,4],
  [2,3], [2,4],
  [3,4]
]

特点：
- 组合不考虑顺序，[1,2] 和 [2,1] 是同一个组合
- 这意味着我们需要一个起始位置 start 来避免重复
```

### 4.2 代码实现

```typescript
/**
 * LeetCode 77. 组合
 *
 * 问题：给定 n 和 k，返回 [1, n] 中所有可能的 k 个数的组合
 *
 * 思路：回溯算法
 * - 组合问题是选元素，与排列不同
 * - 需要 start 参数控制起始位置，避免重复
 * - 还需要 remaining 参数控制还需要选多少个
 *
 * 时间复杂度: O(C(n,k) × k)
 */
function combine(n: number, k: number): number[][] {
  const result: number[][] = [];

  /**
   * 回溯函数
   * @param start 起始数字
   * @param path 当前组合
   */
  function backtrack(start: number, path: number[]) {
    // 终止条件：组合长度等于 k
    if (path.length === k) {
      result.push([...path]);
      return;
    }

    // 优化：计算还剩多少个数字可以选
    // 如果从 start 到 n 的数字不够 k - path.length 个，则剪枝
    for (let i = start; i <= n; i++) {
      // 做选择
      path.push(i);

      // 递归：下一轮从 i+1 开始（避免重复使用元素）
      backtrack(i + 1, path);

      // 撤销选择
      path.pop();
    }
  }

  backtrack(1, []);
  return result;
}

/**
 * 组合总和
 * LeetCode 39. 组合总和（数组中的元素可以重复使用）
 */
function combinationSum(candidates: number[], target: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];

  // 排序以便剪枝
  candidates.sort((a, b) => a - b);

  function backtrack(start: number, remaining: number) {
    // 终止条件：剩余和为0，找到一个解
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    // 遍历选择
    for (let i = start; i < candidates.length; i++) {
      // 剪枝：如果当前数字大于剩余和，跳过
      if (candidates[i] > remaining) break;

      path.push(candidates[i]);

      // 关键：可以从同一数字继续选（因为可以重复使用）
      backtrack(i, remaining - candidates[i]);

      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}

/**
 * LeetCode 40. 组合总和 II（数组中的每个数字只能用一次）
 */
function combinationSum2(candidates: number[], target: number): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  candidates.sort((a, b) => a - b);

  function backtrack(start: number, remaining: number) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      // 剪枝：跳过重复元素（同层不能重复）
      if (i > start && candidates[i] === candidates[i - 1]) continue;

      // 剪枝：跳过大于目标值的元素
      if (candidates[i] > remaining) break;

      path.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]); // i+1，因为不能重复使用
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}

// 测试
console.log(combine(4, 2));
// 输出: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]

console.log(combinationSum([2, 3, 5], 8));
// 输出: [[2,2,2,2], [2,3,3], [3,5]]

console.log(combinationSum2([10, 1, 2, 7, 6, 1, 5], 8));
// 输出: [[1,1,6], [1,2,5], [1,7], [2,6]]
```

---

## 五、八皇后问题

### 5.1 问题描述

```
八皇后问题：
- 在 8×8 的棋盘上放置 8 个皇后
- 使得任意两个皇后不在同一行、同一列、或同一对角线上
- 共有 92 个解

变体：N 皇后（LeetCode 51）
- 在 N×N 的棋盘上放置 N 个皇后
```

### 5.2 代码实现

```typescript
/**
 * LeetCode 51. N 皇后
 *
 * 问题：n × n 的棋盘上放置 n 个皇后，使得任意两个皇后互不攻击
 *       返回所有可能的解
 *
 * 约束条件：
 * - 同一行：每行只能放一个皇后
 * - 同一列：colSet 记录已放置皇后的列
 * - 同一主对角线：row - col = 常数 (d1Set)
 * - 同一副对角线：row + col = 常数 (d2Set)
 *
 * 时间复杂度: O(n!) 实际远小于 n! 因为剪枝
 * 空间复杂度: O(n)
 */
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];

  // 初始化空棋盘
  const board: string[][] = Array.from({ length: n }, () =>
    '.'.repeat(n).split('')
  );

  // 记录列、主对角线、副对角线是否有皇后
  const cols = new Set<number>();
  const d1 = new Set<number>(); // row - col
  const d2 = new Set<number>(); // row + col

  /**
   * 回溯函数
   * @param row 当前处理的行号
   */
  function backtrack(row: number) {
    // 终止条件：所有行都处理完毕，找到一个解
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }

    // 遍历当前行的每一列
    for (let col = 0; col < n; col++) {
      // 计算两个对角线的标识
      const diag1 = row - col;
      const diag2 = row + col;

      // 剪枝：检查列和对角线是否已被占据
      if (cols.has(col) || d1.has(diag1) || d2.has(diag2)) {
        continue;
      }

      // 放置皇后
      board[row][col] = 'Q';
      cols.add(col);
      d1.add(diag1);
      d2.add(diag2);

      // 递归处理下一行
      backtrack(row + 1);

      // 撤销选择（回溯）
      board[row][col] = '.';
      cols.delete(col);
      d1.delete(diag1);
      d2.delete(diag2);
    }
  }

  backtrack(0);
  return result;
}

/**
 * LeetCode 52. N皇后 II
 * 只返回解的数量，不返回具体棋盘
 */
function totalNQueens(n: number): number {
  let count = 0;

  const cols = new Set<number>();
  const d1 = new Set<number>();
  const d2 = new Set<number>();

  function backtrack(row: number) {
    if (row === n) {
      count++;
      return;
    }

    for (let col = 0; col < n; col++) {
      const diag1 = row - col;
      const diag2 = row + col;

      if (cols.has(col) || d1.has(diag1) || d2.has(diag2)) {
        continue;
      }

      cols.add(col);
      d1.add(diag1);
      d2.add(diag2);

      backtrack(row + 1);

      cols.delete(col);
      d1.delete(diag1);
      d2.delete(diag2);
    }
  }

  backtrack(0);
  return count;
}

// 测试
console.log(solveNQueens(4));
// 输出:
// [
//   [".Q..", "...Q", "Q...", "..Q."],
//   ["..Q.", "Q...", "...Q", ".Q.."]
// ]

console.log(totalNQueens(8)); // 输出: 92
```

---

## 六、括号生成问题

### 6.1 问题描述

```
LeetCode 22. 括号生成

问题：生成 n 对括号的所有有效组合

有效括号组合的定义：
- 左括号必须以正确顺序闭合
- 每个右括号必须有对应的左括号

示例：
n = 3 的所有有效组合：
"((()))", "(()())", "(())()", "()(())", "()()()"
```

### 6.2 代码实现

```typescript
/**
 * 括号生成
 *
 * 思路：回溯算法
 * - left: 已使用的左括号数
 * - right: 已使用的右括号数
 * - valid: left >= right（任何时候右括号数不能超过左括号数）
 * - complete: left === right === n
 *
 * 时间复杂度: O(4^n / sqrt(n)) - 卡特兰数
 * 空间复杂度: O(n)
 */
function generateParenthesis(n: number): string[] {
  const result: string[] = [];

  /**
   * 回溯函数
   * @param path 当前括号串
   * @param left 已使用的左括号数
   * @param right 已使用的右括号数
   */
  function backtrack(path: string, left: number, right: number) {
    // 终止条件：括号串长度达到 2n
    if (path.length === 2 * n) {
      result.push(path);
      return;
    }

    // 选择左括号：如果左括号数 < n，可以添加左括号
    if (left < n) {
      backtrack(path + '(', left + 1, right);
    }

    // 选择右括号：如果右括号数 < 左括号数，可以添加右括号
    // 关键：右括号不能多于左括号，否则无效
    if (right < left) {
      backtrack(path + ')', left, right + 1);
    }
  }

  backtrack('', 0, 0);
  return result;
}

/**
 * 优化版本：剪枝策略
 */
function generateParenthesisOptimized(n: number): string[] {
  const result: string[] = [];

  function backtrack(path: string, left: number, right: number) {
    // 剪枝：如果左右括号数都已达到 n，添加到结果
    if (left === n && right === n) {
      result.push(path);
      return;
    }

    // 剪枝：左括号数不能超过 n
    if (left < n) {
      backtrack(path + '(', left + 1, right);
    }

    // 剪枝：右括号数不能超过左括号数，且不能超过 n
    if (right < left && right < n) {
      backtrack(path + ')', left, right + 1);
    }
  }

  backtrack('', 0, 0);
  return result;
}

// 测试
console.log(generateParenthesis(3));
// 输出: ["((()))", "(()())", "(())()", "()(())", "()()()"]

console.log(generateParenthesis(1));
// 输出: ["()"]
```

---

## 七、数独求解

### 7.1 问题描述

```
LeetCode 37. 解数独

问题：
- 9×9 网格，部分格子已填入数字（1-9）
- 需要填入数字使每行、每列、每个 3×3 子宫格都包含 1-9

约束条件：
- 每行 1-9 不能重复
- 每列 1-9 不能重复
- 每个 3×3 子宫格 1-9 不能重复
```

### 7.2 代码实现

```typescript
/**
 * 解数独
 *
 * 思路：回溯算法
 * - 遍历每一个空格
 * - 尝试填入 1-9，检查有效性
 * - 如果都填满，解决问题
 *
 * 时间复杂度: O(9^m) 其中 m 是空格数量，最坏情况 m = 81
 * 空间复杂度: O(81) 递归栈
 */
function solveSudoku(board: char[][]): void {
  const rows = new Array(9).fill(0).map(() => new Set<number>());
  const cols = new Array(9).fill(0).map(() => new Set<number>());
  const boxes = new Array(9).fill(0).map(() => new Set<number>());
  const emptyCells: [number, number][] = [];

  // 初始化：记录已使用的数字
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === '.') {
        emptyCells.push([i, j]);
      } else {
        const num = parseInt(board[i][j]);
        rows[i].add(num);
        cols[j].add(num);
        boxes[Math.floor(i / 3) * 3 + Math.floor(j / 3)].add(num);
      }
    }
  }

  /**
   * 获取子宫格的索引
   */
  function getBoxIndex(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  /**
   * 检查在 (row, col) 位置放置 num 是否有效
   */
  function isValid(row: number, col: number, num: number): boolean {
    return (
      !rows[row].has(num) &&
      !cols[col].has(num) &&
      !boxes[getBoxIndex(row, col)].has(num)
    );
  }

  /**
   * 回溯函数
   * @param index 当前处理的空格索引
   * @returns 是否找到解
   */
  function backtrack(index: number): boolean {
    // 终止条件：所有空格都填满
    if (index === emptyCells.length) {
      return true;
    }

    const [row, col] = emptyCells[index];

    for (let num = 1; num <= 9; num++) {
      if (isValid(row, col, num)) {
        // 放置数字
        board[row][col] = String(num) as char;
        rows[row].add(num);
        cols[col].add(num);
        boxes[getBoxIndex(row, col)].add(num);

        // 递归尝试下一个空格
        if (backtrack(index + 1)) {
          return true;
        }

        // 撤销选择
        board[row][col] = '.';
        rows[row].delete(num);
        cols[col].delete(num);
        boxes[getBoxIndex(row, col)].delete(num);
      }
    }

    // 所有数字都尝试过，无法解决
    return false;
  }

  backtrack(0);
}

/**
 * 更简洁的实现：使用位运算优化
 */
function solveSudokuBit(board: char[][]): void {
  // rowMask[i] 表示第 i 行已使用的数字（用位掩码表示）
  const rowMask: number[] = new Array(9).fill(0);
  const colMask: number[] = new Array(9).fill(0);
  const boxMask: number[] = new Array(9).fill(0);
  const emptyCells: number[] = []; // 存储空格位置，编码为 row * 9 + col

  // 初始化
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === '.') {
        emptyCells.push(i * 9 + j);
      } else {
        const bit = 1 << parseInt(board[i][j]);
        rowMask[i] |= bit;
        colMask[j] |= bit;
        boxMask[Math.floor(i / 3) * 3 + Math.floor(j / 3)] |= bit;
      }
    }
  }

  /**
   * 获取 box 索引
   */
  function getBoxIdx(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  /**
   * 深度优先搜索填数独
   */
  function dfs(index: number): boolean {
    if (index === emptyCells.length) {
      return true; // 所有空格都填满
    }

    const cell = emptyCells[index];
    const row = Math.floor(cell / 9);
    const col = cell % 9;
    const box = getBoxIdx(row, col);

    // 可填入的数字（1-9，对应位 1-9）
    let bits = ~(rowMask[row] | colMask[col] | boxMask[box]) & 0x1FF;

    while (bits !== 0) {
      const bit = bits & -bits; // 取得最后一个 1
      bits -= bit; // 移除这个 1

      const num = MathcounZeros(bit) + 1; // 位索引转数字

      // 填入数字
      board[row][col] = String(num) as char;
      rowMask[row] |= bit;
      colMask[col] |= bit;
      boxMask[box] |= bit;

      // 递归
      if (dfs(index + 1)) {
        return true;
      }

      // 撤销
      board[row][col] = '.';
      rowMask[row] &= ~bit;
      colMask[col] &= ~bit;
      boxMask[box] &= ~bit;
    }

    return false;
  }

  function MathcounZeros(n: number): number {
    let count = 0;
    while (n !== 0) {
      n &= n - 1;
      count++;
    }
    return count;
  }

  dfs(0);
}

// 辅助函数：计算一个数二进制表示中末尾0的个数
function countTrailingZeros(n: number): number {
  return (n & -n) ? 0 : 1;
}
```

---

## 八、岛屿问题

### 8.1 问题描述

```
LeetCode 200. 岛屿数量

问题：
- 1 表示陆地，0 表示水域
- 找出网格中岛屿的数量
- 岛屿定义：由陆地连接而成（水平或垂直方向）

示例：
输入:
11110
11010
11000
00000
输出: 1
```

### 8.2 代码实现

```typescript
/**
 * 岛屿数量（DFS/回溯）
 *
 * 思路：
 * 1. 遍历每一个格子
 * 2. 如果是岛屿（值为 '1'），从该格子开始 DFS
 * 3. DFS 将该岛屿的所有格子标记为已访问（置为 '0'）
 * 4. 继续遍历，重复上述过程
 *
 * 时间复杂度: O(m × n)
 * 空间复杂度: O(m × n) - 递归栈
 */
function numIslands(grid: char[][]): number {
  if (grid.length === 0 || grid[0].length === 0) return 0;

  const m = grid.length;
  const n = grid[0].length;
  let count = 0;

  /**
   * DFS：将 (i, j) 及其相邻的岛屿格子全部标记为已访问
   */
  function dfs(i: number, j: number) {
    // 边界检查
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === '0') {
      return;
    }

    // 标记为已访问
    grid[i][j] = '0';

    // 递归访问上下左右四个方向
    dfs(i - 1, j); // 上
    dfs(i + 1, j); // 下
    dfs(i, j - 1); // 左
    dfs(i, j + 1); // 右
  }

  // 遍历每一个格子
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++; // 发现新岛屿
        dfs(i, j); // 标记该岛屿的所有格子
      }
    }
  }

  return count;
}

/**
 * 岛屿问题变体：LeetCode 695. 岛屿的最大面积
 */
function maxAreaOfIsland(grid: number[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  let maxArea = 0;

  function dfs(i: number, j: number): number {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0) {
      return 0;
    }

    // 标记为已访问
    grid[i][j] = 0;

    // 计算当前岛屿面积（包含自己和四个方向的岛屿）
    return 1 +
      dfs(i - 1, j) +
      dfs(i + 1, j) +
      dfs(i, j - 1) +
      dfs(i, j + 1);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) {
        const area = dfs(i, j);
        maxArea = Math.max(maxArea, area);
      }
    }
  }

  return maxArea;
}

/**
 * 岛屿问题变体：LeetCode 694. 不同的岛屿数量
 */
function numDistinctIslands(grid: number[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  const seen = new Set<string>();

  function dfs(i: number, j: number, shape: string, dir: string) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0) {
      return;
    }

    // 标记为已访问
    grid[i][j] = 0;

    // 记录移动方向
    shape += dir;

    // 递归访问四个方向
    dfs(i - 1, j, shape, 'U'); // 上
    dfs(i + 1, j, shape, 'D'); // 下
    dfs(i, j - 1, shape, 'L'); // 左
    dfs(i, j + 1, shape, 'R'); // 右

    // 记录岛屿的完成标记
    shape += '_';
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) {
        const shape = '';
        dfs(i, j, shape, 'O'); // O 表示起点
        seen.add(shape);
      }
    }
  }

  return seen.size;
}

// 测试
console.log(numIslands([
  ['1', '1', '1', '1', '0'],
  ['1', '1', '0', '1', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '0', '0', '0']
])); // 输出: 1

console.log(maxAreaOfIsland([
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 1, 1, 0, 1, 0, 0, 0, 0, 0]
])); // 输出: 6
```

---

## 九、复杂度分析与优化

### 9.1 复杂度分析

```typescript
/**
 * 回溯算法复杂度分析
 *
 * 时间复杂度：
 * - 全排列：O(n! × n) - n! 个排列，每个排列 O(n) 复制
 * - 组合：O(C(n,k) × k) - C(n,k) 个组合，每个组合 O(k) 复制
 * - 八皇后：O(n!) - 理论上，最坏情况
 *
 * 空间复杂度：
 * - O(n) - 递归栈深度 + used 数组
 *
 * 解空间大小：
 * - 排列：n!
 * - 组合：C(n, k)
 * - 子集：2^n
 */
```

### 9.2 剪枝优化策略

```typescript
/**
 * 剪枝策略总结
 *
 * 1. 约束剪枝
 *    - 利用问题的约束条件提前判断
 *    - 例如：括号生成中 right < left
 *
 * 2. 排序剪枝
 *    - 对数组排序，使相同元素相邻
 *    - 跳过同层重复元素
 *    - 例如：全排列 II
 *
 * 3. 边界剪枝
 *    - 提前判断无法找到解的情况
 *    - 例如：组合总和 when candidates[i] > remaining
 *
 * 4. 访问标记剪枝
 *    - 使用 used/visited 数组标记已访问
 *    - 避免重复使用元素
 */
```

---

## 十、LeetCode 练习题

### 入门级
1. **LeetCode 46. 全排列** - 基础回溯
2. **LeetCode 77. 组合** - 组合问题
3. **LeetCode 22. 括号生成** - 括号问题

### 基础级
4. **LeetCode 47. 全排列 II** - 去重
5. **LeetCode 39. 组合总和** - 可重复使用元素
6. **LeetCode 40. 组合总和 II** - 元素只能用一次
7. **LeetCode 78. 子集** - 生成所有子集

### 进阶级
8. **LeetCode 51. N皇后** - 经典问题
9. **LeetCode 52. N皇后 II** - 只求数量
10. **LeetCode 37. 解数独** - 复杂约束
11. **LeetCode 200. 岛屿数量** - DFS 变体

### 困难级
12. **LeetCode 37. 解数独** - 二维回溯
13. **LeetCode 691. 贴纸拼词** - 状态压缩 + 回溯
14. **LeetCode 679. 24点游戏** - 表达式回溯

---

## 十一、本章小结

本章我们系统学习了回溯算法：

1. **核心思想**：通过尝试和回退系统地搜索解空间

2. **算法模板**：
   ```typescript
   function backtrack(路径, 选择列表) {
     if (满足结束条件) {
       结果.add(路径);
       return;
     }

     for (选择 in 选择列表) {
       做选择;
       backtrack(新路径, 新选择列表);
       撤销选择;  // 关键：回溯
     }
   }
   ```

3. **经典问题**：
   - 全排列与组合
   - 八皇后问题
   - 括号生成
   - 数独求解
   - 岛屿问题

4. **剪枝优化**：
   - 约束剪枝
   - 排序剪枝
   - 边界剪枝
   - 访问标记剪枝

5. **与递归的区别**：
   - 递归不保存状态，回溯需要状态恢复
   - 回溯 = 递归 + 撤销选择

---

**上一篇**：[04_动态规划_Dynamic_Programming.md](./04_动态规划_Dynamic_Programming.md)
**下一篇**：[06_分支限界算法_Branch_and_Bound.md](./06_分支限界算法_Branch_and_Bound.md)
