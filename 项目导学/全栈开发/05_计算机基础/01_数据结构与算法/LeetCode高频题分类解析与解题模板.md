# LeetCode 高频题分类解析与解题模板 (2026版)

## 1. 概述：刷题的正确姿势

在算法面试中，"刷多少题"不是关键，"刷透多少题"才是。大厂面试的算法题往往有固定的套路和解题模板。本指南将 2026 年高频题型进行分类归纳，提炼每种题型的通用解法模板。

---

## 2. 数组与字符串

### 2.1 双指针模板

**适用场景**：有序数组、链表、有序字符串

```javascript
/**
 * 双指针模板：有序数组的两数之和
 * @param {number[]} nums - 有序数组
 * @param {number} target - 目标值
 * @return {number[]} - 索引对
 *
 * 模板要点：
 * 1. left 从 0 开始，right 从末尾开始
 * 2. 根据 sum 与 target 的大小关系移动指针
 * 3. 时间复杂度 O(n)，空间复杂度 O(1)
 */
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      // 太小，左指针右移
      left++;
    } else {
      // 太大，右指针左移
      right--;
    }
  }

  return [];
}

/**
 * 三数之和（去重）
 * 核心：先固定一个数，再用双指针找另外两个
 */
function threeSum(nums) {
  const result = [];
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    // 去重：跳过相同的第一个数
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // 去重：跳过相同的 left 和 right
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```

### 2.2 滑动窗口模板

**适用场景**：子串/子数组问题，最值查找

```javascript
/**
 * 最小覆盖子串
 * 模板要点：
 * 1. right 扩张窗口
 * 2. 满足条件时，left 收缩窗口
 * 3. 维护全局最优解
 *
 * @param {string} s - 主字符串
 * @param {string} t - 目标字符串
 * @return {string} - 最小覆盖子串
 */
function minWindow(s, t) {
  // 统计目标字符串中字符出现次数
  const need = new Map();
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }

  // 窗口中满足条件的字符数
  let valid = 0;
  const window = new Map();

  // 双指针
  let left = 0;
  let right = 0;
  let start = 0;
  let minLen = Infinity;

  while (right < s.length) {
    const char = s[right];
    right++;

    // 扩展窗口
    if (need.has(char)) {
      window.set(char, (window.get(char) || 0) + 1);
      if (window.get(char) === need.get(char)) {
        valid++;
      }
    }

    // 收缩窗口：当满足所有字符时
    while (valid === need.size) {
      // 更新最小覆盖子串
      if (right - left < minLen) {
        start = left;
        minLen = right - left;
      }

      const leftChar = s[left];
      left++;

      // 收缩前先记录结果
      if (need.has(leftChar)) {
        if (window.get(leftChar) === need.get(leftChar)) {
          valid--;
        }
        window.set(leftChar, window.get(leftChar) - 1);
      }
    }
  }

  return minLen === Infinity ? '' : s.substring(start, start + minLen);
}

/**
 * 最长无重复子串
 */
function lengthOfLongestSubstring(s) {
  const window = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    // 收缩窗口直到没有重复
    while (window.has(s[right])) {
      window.delete(s[left]);
      left++;
    }

    window.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
```

### 2.3 前缀和模板

**适用场景**：连续子数组求和，范围查询

```javascript
/**
 * 连续子数组和等于 k 的个数
 * 模板要点：前缀和 + 哈希表
 *
 * @param {number[]} nums - 输入数组
 * @param {number} k - 目标值
 * @return {number} - 满足条件的子数组个数
 */
function subarraySum(nums, k) {
  // 前缀和 -> 出现次数
  const prefixSumCount = new Map();
  prefixSumCount.set(0, 1); // 前缀和为 0 出现 1 次

  let prefixSum = 0;
  let count = 0;

  for (const num of nums) {
    prefixSum += num;

    // 查找 prefixSum - k 是否存在
    if (prefixSumCount.has(prefixSum - k)) {
      count += prefixSumCount.get(prefixSum - k);
    }

    // 记录当前前缀和
    prefixSumCount.set(prefixSum, (prefixSumCount.get(prefixSum) || 0) + 1);
  }

  return count;
}
```

---

## 3. 链表

### 3.1 快慢指针模板

```javascript
/**
 * 快慢指针找链表中点
 * 模板要点：
 * 1. fast 每次走两步，slow 每次走一步
 * 2. 当 fast 到末尾，slow 就在中点
 */
function middleNode(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}

/**
 * 环形链表检测（返回入环节点）
 */
function detectCycle(head) {
  let slow = head;
  let fast = head;

  // 第一阶段：检测是否有环
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // 第二阶段：找入环节点
      // 数学证明：相遇点到入环点 = 头节点到入环点
      slow = head;
      while (slow !== fast) {
        slow = slow.next;
        fast = fast.next;
      }
      return slow;
    }
  }

  return null;
}

/**
 * 链表反转（迭代版）
 * 模板要点：
 * 1. prev、curr、next 三个指针
 * 2. curr.next = prev 实现反转
 * 3. 移动 prev 和 curr
 */
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    const next = curr.next; // 保存下一个节点
    curr.next = prev;       // 反转指针
    prev = curr;            // prev 前移
    curr = next;            // curr 前移
  }

  return prev; // prev 是新头节点
}

/**
 * K 个一组反转链表
 */
function reverseKGroup(head, k) {
  if (!head || k === 1) return head;

  // 哑节点简化边界处理
  const dummy = new ListNode(0);
  dummy.next = head;

  let prev = dummy;
  let end = dummy;

  while (end.next) {
    // 移动 end 到第 k 个节点
    for (let i = 0; i < k && end; i++) {
      end = end.next;
    }

    if (!end) break; // 不足 k 个

    const start = prev.next;
    const nextStart = end.next;

    // 切断链表
    end.next = null;

    // 反转这一段
    prev.next = reverseList(start);

    // 连接剩余部分
    start.next = nextStart;

    // 移动 prev 和 end
    prev = start;
    end = prev;
  }

  return dummy.next;
}
```

### 3.2 合并有序链表模板

```javascript
/**
 * 合并两个有序链表
 * 模板要点：
 * 1. 使用哑节点简化操作
 * 2. 比较两个链表头部，取较小者
 * 3. 剩余部分直接连接
 */
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  // 连接剩余部分
  curr.next = l1 || l2;

  return dummy.next;
}

/**
 * 合并 K 个有序链表（堆排序优化）
 */
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  // 最小堆
  const heap = new MinHeap();

  // 初始化：每个链表的头节点入堆
  lists.forEach((list, index) => {
    if (list) {
      heap.insert({ val: list.val, index, node: list });
    }
  });

  const dummy = new ListNode(0);
  let curr = dummy;

  while (heap.size() > 0) {
    const { val, index, node } = heap.extractMin();
    curr.next = node;
    curr = curr.next;

    // 下一个节点入堆
    if (node.next) {
      heap.insert({ val: node.next.val, index, node: node.next });
    }
  }

  return dummy.next;
}
```

---

## 4. 栈与队列

### 4.1 单调栈模板

```javascript
/**
 * 下一个更大元素
 * 模板要点：
 * 1. 维护一个单调递减栈
 * 2. 栈中存索引
 * 3. 遇到更大元素时，弹出并更新结果
 */
function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // 存索引

  for (let i = 0; i < nums.length; i++) {
    // 单调递减栈：栈顶元素 < 当前元素时，弹出
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      const index = stack.pop();
      result[index] = nums[i];
    }
    stack.push(i);
  }

  return result;
}

/**
 * 柱状图中最大矩形
 * 核心：对于每个柱子，向左向右找第一个比它矮的位置
 */
function largestRectangleArea(heights) {
  let maxArea = 0;
  const stack = []; // 存索引，保持递增

  // 末尾加 0，强制清空栈
  for (let i = 0; i <= heights.length; i++) {
    const height = i === heights.length ? 0 : heights[i];

    while (stack.length && heights[stack[stack.length - 1]] > height) {
      const h = heights[stack.pop()];
      const w = stack.length ? i - stack[stack.length - 1] - 1 : i;
      maxArea = Math.max(maxArea, h * w);
    }

    stack.push(i);
  }

  return maxArea;
}

/**
 * 接雨水
 */
function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }

  return water;
}
```

### 4.2 括号匹配扩展

```javascript
/**
 * 有效的括号字符串
 * 核心：维护左括号的上界和下界
 */
function isValid(s) {
  let leftMin = 0; // 左括号最小可能数
  let leftMax = 0; // 左括号最大可能数

  for (const char of s) {
    if (char === '(') {
      leftMin++;
      leftMax++;
    } else if (char === ')') {
      leftMin--;
      leftMax--;
    } else { // '*'
      leftMin--; // 看作 ')'
      leftMax++; // 看作 '('
    }

    // 最小可能数不能为负
    leftMin = Math.max(leftMin, 0);

    // 最大可能数如果变负，无效
    if (leftMax < 0) return false;
  }

  return leftMin === 0;
}
```

---

## 5. 树与图

### 5.1 二叉树遍历模板

```javascript
/**
 * 二叉树层序遍历（队列实现）
 * 模板要点：
 * 1. 使用队列存储当前层节点
 * 2. 记录当前层节点数
 * 3. 逐层处理
 */
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length) {
    const level = [];
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}

/**
 * 二叉树右视图
 */
function rightSideView(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      // 每层最后一个节点
      if (i === levelSize - 1) {
        result.push(node.val);
      }

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}

/**
 * 验证二叉搜索树
 * 模板要点：中序遍历是有序的
 */
function isValidBST(root) {
  let prev = -Infinity;

  function inOrder(node) {
    if (!node) return true;

    // 左子树
    if (!inOrder(node.left)) return false;

    // 当前节点：必须大于前一个节点
    if (node.val <= prev) return false;
    prev = node.val;

    // 右子树
    return inOrder(node.right);
  }

  return inOrder(root);
}

/**
 * 二叉树直径（任意两个节点的最长路径）
 */
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function depth(node) {
    if (!node) return 0;

    const left = depth(node.left);
    const right = depth(node.right);

    // 更新直径：左深度 + 右深度
    maxDiameter = Math.max(maxDiameter, left + right);

    return Math.max(left, right) + 1;
  }

  depth(root);
  return maxDiameter;
}
```

### 5.2 图的遍历模板

```javascript
/**
 * 岛屿数量（DFS 版）
 */
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }

    grid[r][c] = '0'; // 标记已访问

    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}

/**
 * 课程表（检测环 - 拓扑排序）
 */
function canFinish(numCourses, prerequisites) {
  const graph = new Map();
  const inDegree = new Array(numCourses).fill(0);

  // 构建图
  for (const [course, prereq] of prerequisites) {
    if (!graph.has(prereq)) graph.set(prereq, []);
    graph.get(prereq).push(course);
    inDegree[course]++;
  }

  // 入度为 0 的课程入队
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let completed = 0;

  while (queue.length) {
    const course = queue.shift();
    completed++;

    // 邻居课程入度减 1
    for (const neighbor of graph.get(course) || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return completed === numCourses;
}
```

---

## 6. 动态规划

### 6.1 DP 模板套路

```javascript
/**
 * 动态规划通用模板
 * 1. 确定状态定义
 * 2. 确定状态转移方程
 * 3. 确定初始化
 * 4. 确定遍历顺序
 */

/**
 * 爬楼梯（斐波那契）
 * 状态定义：dp[i] 表示到达第 i 阶的方法数
 * 转移方程：dp[i] = dp[i-1] + dp[i-2]
 */
function climbStairs(n) {
  if (n <= 2) return n;

  let dp = [0, 1, 2];

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// 空间优化
function climbStairsOptimized(n) {
  if (n <= 2) return n;

  let prev1 = 2;
  let prev2 = 1;

  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

/**
 * 打家劫舍
 * 状态定义：dp[i] 表示前 i 间房屋能偷窃的最高金额
 * 转移方程：dp[i] = max(dp[i-1], dp[i-2] + nums[i])
 */
function rob(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = 0; // dp[i-2]
  let prev1 = nums[0]; // dp[i-1]

  for (let i = 1; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

/**
 * 最长递增子序列
 */
function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;

  // dp[i] 表示以 nums[i] 结尾的最长递增子序列长度
  const dp = new Array(nums.length).fill(1);
  let maxLen = 1;

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }

  return maxLen;
}

/**
 * 背包问题模板（0-1 背包）
 */
function knapsack(weights, values, capacity) {
  const n = weights.length;
  // dp[i][w] 表示前 i 个物品，容量为 w 的最大价值
  const dp = new Array(n + 1).fill(0).map(() =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][capacity];
}

// 空间优化版
function knapsackOptimized(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < weights.length; i++) {
    // 必须倒序遍历，防止重复选择
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }

  return dp[capacity];
}
```

---

## 7. 回溯与 DFS

### 7.1 回溯模板

```javascript
/**
 * 全排列
 * 模板要点：
 * 1. 维护当前路径
 * 2. 选择列表（排除已使用）
 * 3. 做选择 -> 递归 -> 撤销选择
 */
function permute(nums) {
  const result = [];

  function backtrack(path, used) {
    // 终止条件：路径长度等于数组长度
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      // 跳过已使用的元素
      if (used[i]) continue;

      // 做选择
      path.push(nums[i]);
      used[i] = true;

      // 递归
      backtrack(path, used);

      // 撤销选择
      path.pop();
      used[i] = false;
    }
  }

  backtrack([], new Array(nums.length).fill(false));
  return result;
}

/**
 * 子集
 */
function subsets(nums) {
  const result = [];

  function backtrack(start, path) {
    result.push([...path]);

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * 组合总和
 */
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(start, path, sum) {
    if (sum > target) return;
    if (sum === target) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, path, sum + candidates[i]); // 允许重复使用
      path.pop();
    }
  }

  backtrack(0, [], 0);
  return result;
}

/**
 * N 皇后
 */
function solveNQueens(n) {
  const result = [];

  // 棋盘：-1 表示未放皇后
  const board = new Array(n).fill(0).map(() => new Array(n).fill(-1));

  // 检查放置是否合法
  function isValid(row, col) {
    // 检查列
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 1) return false;
    }

    // 检查左上对角线
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 1) return false;
    }

    // 检查右上对角线
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 1) return false;
    }

    return true;
  }

  function backtrack(row) {
    if (row === n) {
      // 转换为字符串形式
      const solution = board.map(row =>
        row.map(cell => cell === 1 ? 'Q' : '.').join('')
      );
      result.push(solution);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row][col] = 1;
        backtrack(row + 1);
        board[row][col] = -1;
      }
    }
  }

  backtrack(0);
  return result;
}
```

---

## 8. 高级数据结构

### 8.1 并查集模板

```javascript
/**
 * 并查集（Union-Find）
 * 核心操作：find（找根）、union（合并）
 * 优化：路径压缩 + 按秩合并
 */
class UnionFind {
  constructor(n) {
    this.parent = new Array(n).fill(0).map((_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;
  }

  // 查找根节点（路径压缩）
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  // 合并（按秩合并）
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.count--;
    return true;
  }

  // 判断是否连通
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

/**
 * 使用并查集解决朋友圈问题
 */
function findCircleNum(isConnected) {
  const n = isConnected.length;
  const uf = new UnionFind(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isConnected[i][j]) {
        uf.union(i, j);
      }
    }
  }

  return uf.count;
}
```

### 8.2 LRU 缓存

```javascript
/**
 * LRU 缓存（使用 Map 的有序性）
 * Map 保持插入顺序，get 时删除再插入即可实现 O(1)
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // 移到最近使用（删除再插入）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的（Map 第一个）
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

/**
 * 手写 LinkedHashMap 实现 LRU
 */
class LRUCacheManual {
  constructor(capacity) {
    this.capacity = capacity;
    // 双向链表
    this.head = new Node(0, 0); // 哑节点
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.map = new Map();
  }

  // 辅助方法：移除节点
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // 辅助方法：添加到头部
  addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;

    const node = this.map.get(key);
    this.remove(node);
    this.addToHead(node);

    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this.remove(node);
      this.addToHead(node);
    } else {
      const node = new Node(key, value);
      this.map.set(key, node);
      this.addToHead(node);

      if (this.map.size > this.capacity) {
        const removed = this.tail.prev;
        this.remove(removed);
        this.map.delete(removed.key);
      }
    }
  }
}
```

---

## 9. 复杂度分析速查表

### 9.1 各数据结构操作复杂度

| 数据结构 | 访问 | 搜索 | 插入 | 删除 |
|----------|------|------|------|------|
| 数组 | O(1) | O(n) | O(n) | O(n) |
| 链表 | O(n) | O(n) | O(1) | O(1) |
| 哈希表 | - | O(1) | O(1) | O(1) |
| BST | O(log n) | O(log n) | O(log n) | O(log n) |
| 堆 | O(1) | O(n) | O(log n) | O(log n) |
| 栈/队列 | O(n) | O(n) | O(1) | O(1) |

### 9.2 排序算法复杂度

| 算法 | 平均 | 最坏 | 空间 | 稳定 |
|------|------|------|------|------|
| 冒泡 | O(n²) | O(n²) | O(1) | 稳定 |
| 选择 | O(n²) | O(n²) | O(1) | 不稳定 |
| 插入 | O(n²) | O(n²) | O(1) | 稳定 |
| 归并 | O(n log n) | O(n log n) | O(n) | 稳定 |
| 快排 | O(n log n) | O(n²) | O(log n) | 不稳定 |
| 堆排 | O(n log n) | O(n log n) | O(1) | 不稳定 |

---

## 10. 面试高频题型总结

### Top 10 高频题型

1. **双指针**：两数之和、三数之和、回文串判断
2. **滑动窗口**：最小覆盖子串、无重复最长子串
3. **二分查找**：搜索旋转数组、寻找峰值
4. **回溯**：全排列、子集、组合、N皇后
5. **动态规划**：爬楼梯、打家劫舍、股票买卖
6. **链表**：反转、合并、环检测
7. **二叉树**：遍历、BST验证、路径总和
8. **堆**：Top K、中位数、K个有序链表合并
9. **并查集**：朋友圈、岛屿数量
10. **单调栈**：下一个更大元素、柱状图最大矩形

### 面试话术模板

当被问到算法题时，按以下步骤回答：

```
1. 澄清问题（2分钟）
   - "请问可以假设输入是...吗？"
   - "返回值是索引还是值？"
   - "如果有空输入/边界情况如何处理？"

2. 暴力解法（2分钟）
   - 先说出最容易想到的解法
   - 分析时间/空间复杂度
   - 表明需要优化

3. 优化思路（5分钟）
   - "观察到这个问题的特点是..."
   - "可以利用...数据结构/算法来优化"
   - "时间复杂度可以从 O(n²) 优化到 O(n log n)"

4. 代码实现（10分钟）
   - 边写边解释
   - 注意边界条件
   - 保持代码整洁

5. 测试验证（2分钟）
   - "测试一下：空数组、单个元素、全部相同..."
   - "时间复杂度是...，空间复杂度是..."
```

---

*本文档持续更新，最后更新于 2026 年 3 月*
