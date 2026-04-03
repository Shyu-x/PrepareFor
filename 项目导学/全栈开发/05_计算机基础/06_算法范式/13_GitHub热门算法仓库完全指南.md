# GitHub 热门算法仓库完全指南

> 本文档整理了 GitHub 上最受欢迎的算法与数据结构相关开源项目，涵盖 Python、Java、JavaScript、C++、Go、Rust 等多种编程语言。每个仓库都包含详细的介绍、功能分析、代码示例以及适用场景，帮助开发者快速找到适合自己的学习资源。

---

## 一、仓库总览

| 排名 | 项目名称 | 编程语言 | Star 数 | 主要特点 |
|:---:|----------|:--------:|--------:|----------|
| 1 | TheAlgorithms/Python | Python | 219,250+ | Python 算法全面实现 |
| 2 | labuladong/fucking-algorithm | Markdown | 133,166+ | LeetCode 解题思路 |
| 3 | TheAlgorithms/Java | Java | 65,312+ | Java 算法全面实现 |
| 4 | TheAlgorithms/JavaScript | JavaScript | 34,083+ | JavaScript 算法实现 |
| 5 | donnemartin/interactive-coding-challenges | Python | 31,295+ | 交互式编程挑战 |
| 6 | TheAlgorithms/Rust | Rust | 25,622+ | Rust 算法全面实现 |
| 7 | TheAlgorithms/C | C | 21,866+ | C 语言算法实现 |
| 8 | keon/algorithms | Python | 25,412+ | Python 最小示例 |
| 9 | jwasham/computer-science-flash-cards | HTML | 8,971+ | CS 知识闪卡 |
| 10 | mandliya/algorithms_and_data_structures | C++ | 6,123+ | C++ 算法与数据结构 |
| 11 | teivah/algodeck | HTML | 5,812+ | 算法与系统设计闪卡 |
| 12 | xtaci/algorithms | C++ | 5,443+ | 高性能 C++ 算法 |
| 13 | arnauddri/algorithms | Go | 1,856+ | Go 语言算法实现 |
| 14 | justcoding121/advanced-algorithms | C# | 1,376+ | C# 高级算法 |
| 15 | imteekay/algorithms | C++ | 574+ | 算法与计算机科学学习 |

---

## 二、明星项目详细介绍

### 2.1 TheAlgorithms/Python

**项目信息**
- GitHub 地址：https://github.com/TheAlgorithms/Python
- 编程语言：Python
- Star 数：219,250+
- 许可证：MIT

**项目介绍**

TheAlgorithms/Python 是 GitHub 上最受欢迎的算法仓库，汇集了几乎所有常用算法的 Python 实现。该项目采用模块化组织，每个算法独立文件，注释清晰，适合初学者学习参考。仓库持续更新，维护活跃，是 Python 开发者提升算法能力的首选资源。

**主要功能**

1. **排序算法**：包含冒泡排序、选择排序、插入排序、归并排序、快速排序、堆排序、希尔排序、计数排序、桶排序、基数排序等十余种排序算法的完整实现
2. **搜索算法**：二分查找、插值查找、指数查找、广度优先搜索（BFS）、深度优先搜索（DFS）等
3. **数据结构**：链表、栈、队列、树、堆、图、哈希表等常用数据结构的实现
4. **动态规划**：背包问题、最长公共子序列、最长递增子序列、编辑距离等经典问题
5. **字符串算法**：字符串匹配（KMP、Boyer-Moore）、回文检测、最长公共前缀等
6. **数学算法**：质数检测、最大公约数、矩阵运算、概率计算、随机算法等
7. **机器学习算法**：线性回归、逻辑回归、决策树、K近邻、K-means 聚类等

**代码示例**

```python
# 快速排序实现（摘自 TheAlgorithms/Python/sorts/quick_sort.py）
"""
快速排序算法实现
时间复杂度：平均 O(n log n)，最坏 O(n²)
空间复杂度：O(log n)
稳定性：不稳定
"""

from typing import List


def quick_sort(collection: List[int]) -> List[int]:
    """
    对输入列表进行快速排序

    参数：
        collection: 待排序的整数列表

    返回：
        排序后的新列表

    示例：
        >>> quick_sort([3, 1, 4, 1, 5, 9, 2, 6])
        [1, 1, 2, 3, 4, 5, 6, 9]
    """
    # 如果列表长度小于等于1，直接返回（基本情况）
    if len(collection) <= 1:
        return collection

    # 选择基准元素（这里选择中间元素）
    pivot = collection[len(collection) // 2]

    # 将元素分为三部分：小于基准、等于基准、大于基准
    left = [x for x in collection if x < pivot]      # 小于基准的部分
    middle = [x for x in collection if x == pivot]   # 等于基准的部分
    right = [x for x in collection if x > pivot]    # 大于基准的部分

    # 递归排序左右两部分，然后合并
    return quick_sort(left) + middle + quick_sort(right)


def quick_sort_in_place(collection: List[int]) -> List[int]:
    """
    原地快速排序实现（节省内存）

    参数：
        collection: 待排序的整数列表

    返回：
        排序后的列表（原地修改）
    """
    def partition(low: int, high: int) -> int:
        """
        分区函数：选择基准并将数组分为两部分
        """
        # 选择最右边的元素作为基准
        pivot = collection[high]
        # i 是小于基准元素的最后位置
        i = low - 1

        for j in range(low, high):
            # 如果当前元素小于等于基准
            if collection[j] <= pivot:
                # 将其交换到左边
                i += 1
                collection[i], collection[j] = collection[j], collection[i]

        # 将基准元素放到正确位置
        collection[i + 1], collection[high] = collection[high], collection[i + 1]
        return i + 1

    def quick_sort_recursive(low: int, high: int) -> None:
        """
        递归执行快速排序
        """
        if low < high:
            # 获取分区位置
            pivot_index = partition(low, high)
            # 递归排序左右两部分
            quick_sort_recursive(low, pivot_index - 1)
            quick_sort_recursive(pivot_index + 1, high)

    quick_sort_recursive(0, len(collection) - 1)
    return collection
```

```python
# 二分查找实现（摘自 TheAlgorithms/Python/searches/binary_search.py）
"""
二分查找算法实现
时间复杂度：O(log n)
空间复杂度：O(1)（迭代版本）
"""

from typing import List, Optional


def binary_search_iterative(sorted_collection: List[int], item: int) -> Optional[int]:
    """
    迭代版本的二分查找

    参数：
        sorted_collection: 已排序的整数列表（必须有序）
        item: 要查找的元素

    返回：
        元素的索引，如果未找到则返回 None

    示例：
        >>> binary_search_iterative([1, 2, 3, 4, 5], 3)
        2
        >>> binary_search_iterative([1, 2, 3, 4, 5], 6) is None
        True
    """
    # 初始化搜索范围
    left = 0
    right = len(sorted_collection) - 1

    while left <= right:
        # 计算中间位置（避免整数溢出）
        mid = left + (right - left) // 2

        if sorted_collection[mid] == item:
            return mid  # 找到目标，返回索引
        elif sorted_collection[mid] < item:
            left = mid + 1  # 目标在右半部分
        else:
            right = mid - 1  # 目标在左半部分

    return None  # 未找到目标


def binary_search_recursive(
    sorted_collection: List[int],
    item: int,
    left: int = 0,
    right: Optional[int] = None
) -> Optional[int]:
    """
    递归版本的二分查找

    参数：
        sorted_collection: 已排序的整数列表
        item: 要查找的元素
        left: 搜索范围的左边界
        right: 搜索范围的右边界

    返回：
        元素的索引，如果未找到则返回 None
    """
    if right is None:
        right = len(sorted_collection) - 1

    # 基本情况：搜索范围为空
    if left > right:
        return None

    # 计算中间位置
    mid = left + (right - left) // 2

    if sorted_collection[mid] == item:
        return mid
    elif sorted_collection[mid] < item:
        return binary_search_recursive(sorted_collection, item, mid + 1, right)
    else:
        return binary_search_recursive(sorted_collection, item, left, mid - 1)
```

**适用场景**

- Python 开发者算法入门与进阶学习
- 面试前算法题快速查阅与复习
- 作为数据结构和算法课程的补充材料
- 刷 LeetCode 时查找参考实现

**优缺点分析**

| 优点 | 缺点 |
|------|------|
| 覆盖范围极广，包含数百个算法实现 | 部分实现为了通用性牺牲了性能 |
| 代码注释详细，配有使用示例 | Python 实现不适合作为高性能场景参考 |
| 目录结构清晰，易于按主题查找 | 缺少一些高级算法的高级变体 |
| 持续更新，维护活跃 | 对于完整的学习路径支持不足 |

---

### 2.2 labuladong/fucking-algorithm

**项目信息**
- GitHub 地址：https://github.com/labuladong/fucking-algorithm
- 编程语言：Markdown（算法教程）
- Star 数：133,166+
- 许可证： GPL-3.0

**项目介绍**

labuladong/fucking-algorithm（简称「labuladong」）是由技术博主 labuladong 创建的算法学习仓库，以独特的「框架思维」著称。该项目不是简单地罗列算法实现，而是注重讲解算法思维和解题模板，帮助读者举一反三，真正理解问题的本质。它将算法题按照解题思路进行分类，提出了「回溯框架」「动态规划框架」「二分框架」等系统性方法。

**主要功能**

1. **算法思维框架**：系统性地讲解各类算法的核心思维，如回溯、动态规划、贪心、分治等
2. **解题模板**：提供可直接套用的解题代码模板，提高解题效率
3. **高频题型分类**：将 LeetCode 题目按照解题方法分类，便于针对性练习
4. **思维导图**：为每个章节提供可视化思维导图，帮助理清思路
5. **图解说明**：复杂的算法过程配有详细的图解说明

**核心框架介绍**

**动态规划框架：**

```
动态规划的核心是「状态」和「选择」

1. 确定问题的「状态」
   - 哪些变量可以唯一确定当前局面

2. 确定「选择」
   - 每个状态有哪些选择
   - 选择会导致状态如何变化

3. 明确 base case 和最终状态

4. 实现状态转移方程
```

```python
"""
动态规划解题模板（摘自 labuladong/fucking-algorithm）

核心思想：将原问题分解为子问题，通过子问题的最优解推导原问题的最优解

关键步骤：
1. 确定状态（什么是dp[i]或dp[i][j]）
2. 确定选择（如何从子问题推导当前问题）
3. 确定base case
4. 确定遍历顺序
"""

# 示例：背包问题的通用模板
def knapsack_problem():
    """
    0-1 背包问题模板

    问题定义：
    - 背包容量为 W
    - n 件物品，每件物品重量为 wt[i]，价值为 val[i]
    - 求能装入背包的最大价值
    """
    def dp(w, i):
        """
        定义：dp(w, i) 表示从第 i 件物品开始选择，背包容量为 w 时的最大价值

        状态转移：
        - 不选第 i 件物品：dp(w, i+1)
        - 选第 i 件物品：val[i] + dp(w - wt[i], i+1)
        - 取两者最大值
        """
        if w <= 0 or i >= n:
            return 0

        # 备忘录避免重复计算
        if memo[w][i] != -1:
            return memo[w][i]

        # 不选第 i 件物品
        result = dp(w, i + 1)

        # 选第 i 件物品（如果能装下）
        if w >= wt[i]:
            result = max(result, val[i] + dp(w - wt[i], i + 1))

        memo[w][i] = result
        return result

    # 初始化备忘录
    n = len(wt)
    W = target_capacity
    memo = [[-1] * (n + 1) for _ in range(W + 1)]

    return dp(W, 0)


# 示例：最长递增子序列（LIS）
def length_of_lIS(nums):
    """
    LeetCode 300. 最长递增子序列

    给你一个整数数组 nums，找到其中最长严格递增子序列的长度。

    示例：
    输入：nums = [10, 9, 2, 5, 3, 7, 101, 18]
    输出：4
    解释：最长递增子序列是 [2, 3, 7, 101]，长度为 4

    解题思路：
    - dp[i] 表示以 nums[i] 结尾的最长递增子序列长度
    - 对于每个 i，遍历所有 j < i，如果 nums[j] < nums[i]，则 dp[i] = max(dp[i], dp[j] + 1)
    """
    if not nums:
        return 0

    n = len(nums)
    # dp[i] 表示以 nums[i] 结尾的最长递增子序列长度
    dp = [1] * n

    # 枚举所有可能的子序列结尾
    for i in range(n):
        # 枚举 i 之前的所有元素
        for j in range(i):
            if nums[j] < nums[i]:
                # 如果 nums[j] < nums[i]，则可以将 nums[i] 接在 nums[j] 后面
                dp[i] = max(dp[i], dp[j] + 1)

    # 返回最大长度
    return max(dp)


# 二分查找优化版本
def length_of_LIS_binary_search(nums):
    """
    使用二分查找优化的 LIS 算法
    时间复杂度：O(n log n)

    核心思想：维护一个有序数组 tails
    tails[i] 表示长度为 i+1 的递增子序列的最小结尾元素
    """
    import bisect

    tails = []

    for num in nums:
        # 找到 num 应该插入的位置
        pos = bisect.bisect_left(tails, num)

        if pos == len(tails):
            # num 比所有元素都大，扩展 tails
            tails.append(num)
        else:
            # 替换 tails[pos]，保持长度为 pos+1 的递增子序列的最小结尾元素
            tails[pos] = num

    return len(tails)
```

**回溯算法框架：**

```python
"""
回溯算法解题模板（摘自 labuladong/fucking-algorithm）

回溯算法的核心是「选择」和「撤销选择」

伪代码框架：
result = []
def backtrack(路径, 选择列表):
    if 满足结束条件:
        result.add(路径)
        return

    for 选择 in 选择列表:
        做选择
        backtrack(路径, 新的选择列表)
        撤销选择
"""

# 示例：全排列问题
def permute(nums):
    """
    LeetCode 46. 全排列

    给定一个不含重复数字的数组 nums，返回其所有可能的全排列。
    你可以按任意顺序返回答案。

    示例：
    输入：nums = [1,2,3]
    输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
    """
    result = []

    def backtrack(path, used):
        """
        path: 当前已经选择的排列
        used: 标记哪些元素已经被使用
        """
        # 终止条件：路径长度等于 nums 长度
        if len(path) == len(nums):
            result.append(path.copy())  # 添加路径的副本
            return

        # 选择列表：所有未使用的元素
        for i in range(len(nums)):
            if used[i]:
                continue  # 跳过已使用的元素

            # 做选择
            used[i] = True
            path.append(nums[i])

            # 进入下一层决策树
            backtrack(path, used)

            # 撤销选择
            path.pop()
            used[i] = False

    backtrack([], [False] * len(nums))
    return result


# 示例：子集问题
def subsets(nums):
    """
    LeetCode 78. 子集

    给你一个整数数组 nums，数组中的元素互不相同。
    返回该数组所有可能的子集（幂集）。
    解集不能包含重复的子集。

    示例：
    输入：nums = [1,2,3]
    输出：[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
    """
    result = []

    def backtrack(start, path):
        """
        start: 从哪个索引开始选择（避免重复）
        path: 当前路径
        """
        # 每个节点都是一个子集
        result.append(path.copy())

        # 选择列表：从 start 到末尾的元素
        for i in range(start, len(nums)):
            # 做选择
            path.append(nums[i])

            # 进入下一层
            backtrack(i + 1, path)

            # 撤销选择
            path.pop()

    backtrack(0, [])
    return result
```

**适用场景**

- 系统学习算法思维，建立完整知识体系
- LeetCode 刷题思路指导
- 面试前突击算法高频题型
- 建立「解题框架」思维，避免题海战术

**优缺点分析**

| 优点 | 缺点 |
|------|------|
| 强调「框架思维」，帮助建立系统性解题思路 | 部分解题模板过于死板，需要灵活变通 |
| 将算法题分类整理，便于针对性突破 | 偏向面试导向，对工程实践指导不足 |
| 图解清晰，讲解深入浅出 | 一些题解可能存在逻辑跳跃 |
| 强调「为什么」而非「怎么做」 | 需要有一定基础才能更好理解 |

---

### 2.3 TheAlgorithms/Java

**项目信息**
- GitHub 地址：https://github.com/TheAlgorithms/Java
- 编程语言：Java
- Star 数：65,312+
- 许可证：MIT

**项目介绍**

TheAlgorithms/Java 是 Java 版本的算法仓库，与 Python 版本一样覆盖了广泛的算法和数据结构。该项目采用标准的 Java 命名规范和编码风格，代码质量高，适合 Java 开发者学习参考。所有实现都包含详细的文档注释和复杂度分析。

**主要功能**

1. **基础算法**：排序、搜索、字符串处理
2. **数据结构**：链表、栈、队列、树、图、哈希表
3. **设计模式**：常用设计模式的算法应用
4. **并发算法**：Java 并发包中的算法实现
5. **加密算法**：常见加密算法的 Java 实现
6. **机器学习算法**：常用 ML 算法的 Java 实现

**代码示例**

```java
// 快速排序实现（摘自 TheAlgorithms/Java/Sorts/QuickSort.java）
package com.thealgorithms.Sorts;

import java.util.Random;

/**
 * 快速排序算法实现
 *
 * 时间复杂度：
 * - 最好：O(n log n)
 * - 平均：O(n log n)
 * - 最坏：O(n²)
 *
 * 空间复杂度：O(log n)
 * 稳定性：不稳定
 */
public class QuickSort {

    /**
     * 公开的快速排序接口
     *
     * @param array 待排序数组
     * @return 排序后的数组
     */
    public int[] quickSort(int[] array) {
        if (array == null || array.length == 0) {
            return array;
        }
        // 避免使用额外内存的原地排序
        quickSort(array, 0, array.length - 1);
        return array;
    }

    /**
     * 递归执行快速排序
     *
     * @param arr   待排序数组
     * @param low   低位索引
     * @param high  高位索引
     */
    private void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            // 获取分区点
            int pivotIndex = partition(arr, low, high);

            // 递归排序左半部分
            quickSort(arr, low, pivotIndex - 1);

            // 递归排序右半部分
            quickSort(arr, pivotIndex + 1, high);
        }
    }

    /**
     * 分区操作
     * 选择最后一个元素作为基准，将数组分为两部分
     *
     * @param arr   待分区数组
     * @param low   低位索引
     * @param high  高位索引
     * @return 基准元素的最终位置
     */
    private int partition(int[] arr, int low, int high) {
        // 选择基准元素（这里选择最后一个元素）
        int pivot = arr[high];

        // i 是小于基准元素的最后位置
        int i = low - 1;

        for (int j = low; j < high; j++) {
            // 如果当前元素小于等于基准
            if (arr[j] <= pivot) {
                // 将其交换到左边
                i++;
                swap(arr, i, j);
            }
        }

        // 将基准元素放到正确位置
        swap(arr, i + 1, high);

        return i + 1;
    }

    /**
     * 交换数组中两个元素的位置
     */
    private void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}
```

```java
// 二叉搜索树实现（摘自 TheAlgorithms/Java/Datastructures/BinarySearchTree.java）
package com.thealgorithms.Datastructures;

/**
 * 二叉搜索树（BST）实现
 *
 * 二叉搜索树的性质：
 * - 左子树的所有节点值均小于根节点值
 * - 右子树的所有节点值均大于根节点值
 * - 左右子树也分别是二叉搜索树
 *
 * 时间复杂度：
 * - 搜索、插入、删除：平均 O(log n)，最坏 O(n)（退化为链表时）
 */
public class BinarySearchTree {

    // 树节点定义
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;

        TreeNode(int val) {
            this.val = val;
            this.left = null;
            this.right = null;
        }
    }

    private TreeNode root;

    public BinarySearchTree() {
        this.root = null;
    }

    /**
     * 插入一个新值到 BST 中
     *
     * @param val 要插入的值
     */
    public void insert(int val) {
        root = insertRec(root, val);
    }

    private TreeNode insertRec(TreeNode node, int val) {
        // 基本情况：找到插入位置
        if (node == null) {
            return new TreeNode(val);
        }

        // 如果值小于当前节点，插入到左子树
        if (val < node.val) {
            node.left = insertRec(node.left, val);
        }
        // 如果值大于当前节点，插入到右子树
        else if (val > node.val) {
            node.right = insertRec(node.right, val);
        }
        // 如果值相等，不进行插入（避免重复）

        return node;
    }

    /**
     * 在 BST 中搜索指定值
     *
     * @param val 要搜索的值
     * @return 如果找到返回 true，否则返回 false
     */
    public boolean search(int val) {
        return searchRec(root, val);
    }

    private boolean searchRec(TreeNode node, int val) {
        // 基本情况：节点为空或找到目标
        if (node == null) {
            return false;
        }
        if (node.val == val) {
            return true;
        }

        // 根据值的大小决定搜索方向
        if (val < node.val) {
            return searchRec(node.left, val);
        } else {
            return searchRec(node.right, val);
        }
    }

    /**
     * 中序遍历 BST（按升序输出）
     */
    public void inorderTraversal() {
        inorderRec(root);
        System.out.println();
    }

    private void inorderRec(TreeNode node) {
        if (node != null) {
            inorderRec(node.left);
            System.out.print(node.val + " ");
            inorderRec(node.right);
        }
    }

    /**
     * 删除 BST 中的指定值
     */
    public void delete(int val) {
        root = deleteRec(root, val);
    }

    private TreeNode deleteRec(TreeNode node, int val) {
        // 基本情况：节点为空
        if (node == null) {
            return null;
        }

        // 在左子树中删除
        if (val < node.val) {
            node.left = deleteRec(node.left, val);
        }
        // 在右子树中删除
        else if (val > node.val) {
            node.right = deleteRec(node.right, val);
        }
        // 找到要删除的节点
        else {
            // 情况1：叶子节点，直接删除
            if (node.left == null && node.right == null) {
                return null;
            }
            // 情况2：只有一个子节点，用子节点替换
            if (node.left == null) {
                return node.right;
            }
            if (node.right == null) {
                return node.left;
            }
            // 情况3：有两个子节点，用后继节点替换
            TreeNode successor = findMin(node.right);
            node.val = successor.val;
            node.right = deleteRec(node.right, successor.val);
        }

        return node;
    }

    // 找到最小节点（最左叶子节点）
    private TreeNode findMin(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

**适用场景**

- Java 开发者算法学习与面试准备
- 作为 CS 数据结构课程的补充材料
- 了解设计模式在算法中的应用
- Java 工程项目的算法参考实现

---

### 2.4 TheAlgorithms/JavaScript

**项目信息**
- GitHub 地址：https://github.com/TheAlgorithms/JavaScript
- 编程语言：JavaScript
- Star 数：34,083+
- 许可证：MIT

**项目介绍**

TheAlgorithms/JavaScript 是专门针对 JavaScript/Node.js 开发者的算法仓库。随着 Node.js 的普及，前端和后端开发者都需要掌握算法能力，该仓库提供了完整的 JavaScript 版本算法实现，特别适合 JavaScript 开发者入门算法学习。所有实现都遵循 JavaScript 的现代语法（ES6+），代码简洁易懂。

**主要功能**

1. **基础算法**：各种排序算法、搜索算法的 JavaScript 实现
2. **数据结构**：链表、栈、队列、树、图等 JavaScript 版本
3. **动态规划**：经典 DP 问题的 JavaScript 解法
4. **机器学习**：基础 ML 算法的 JavaScript 实现
5. **加密算法**：常用加密算法的 JavaScript 实现
6. **Node.js 工具**：适合后端场景的算法工具

**代码示例**

```javascript
// 归并排序实现（摘自 TheAlgorithms/JavaScript/src/Sorts/MergeSort.js）
/**
 * 归并排序算法实现
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(n)
 * 稳定性：稳定
 *
 * 核心思想：分治法
 * 1. 将数组分成两半
 * 2. 递归地对每半进行排序
 * 3. 合并两个有序半部分
 */

/**
 * 归并排序主函数
 * @param {number[]} array - 待排序数组
 * @returns {number[]} 排序后的数组
 */
function mergeSort(array) {
    // 基本情况：数组长度小于等于1时无需排序
    if (array.length <= 1) {
        return array;
    }

    // 计算中间索引
    const middle = Math.floor(array.length / 2);

    // 分割数组为两半
    const left = array.slice(0, middle);
    const right = array.slice(middle);

    // 递归排序并合并
    return merge(mergeSort(left), mergeSort(right));
}

/**
 * 合并两个有序数组
 * @param {number[]} left - 左有序数组
 * @param {number[]} right - 右有序数组
 * @returns {number[]} 合并后的有序数组
 */
function merge(left, right) {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    // 比较两个数组的元素，按顺序放入结果数组
    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] <= right[rightIndex]) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    // 处理剩余元素
    // left 和 right 中必然只有一个有剩余元素
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// 原地归并排序版本（节省空间）
function mergeSortInPlace(array, left = 0, right = array.length - 1) {
    if (left < right) {
        const middle = Math.floor((left + right) / 2);

        // 递归排序左半部分
        mergeSortInPlace(array, left, middle);

        // 递归排序右半部分
        mergeSortInPlace(array, middle + 1, right);

        // 合并
        mergeInPlace(array, left, middle, right);
    }

    return array;
}

function mergeInPlace(array, left, middle, right) {
    const leftArray = array.slice(left, middle + 1);
    const rightArray = array.slice(middle + 1, right + 1);

    let i = 0, j = 0, k = left;

    while (i < leftArray.length && j < rightArray.length) {
        if (leftArray[i] <= rightArray[j]) {
            array[k] = leftArray[i];
            i++;
        } else {
            array[k] = rightArray[j];
            j++;
        }
        k++;
    }

    // 处理剩余元素
    while (i < leftArray.length) {
        array[k] = leftArray[i];
        i++;
        k++;
    }

    while (j < rightArray.length) {
        array[k] = rightArray[j];
        j++;
        k++;
    }
}

module.exports = { mergeSort, mergeSortInPlace };
```

```javascript
// 图的广度优先搜索实现（摘自 TheAlgorithms/JavaScript/src/Graphs/BFS.js）
/**
 * 图的广度优先搜索（BFS）实现
 *
 * BFS 核心思想：
 * 1. 使用队列来管理待访问节点
 * 2. 按层次顺序访问节点
 * 3. 先访问所有邻居节点，再访问邻居的邻居
 *
 * 时间复杂度：O(V + E)，V 是顶点数，E 是边数
 * 空间复杂度：O(V)
 */

/**
 * BFS 算法实现
 * @param {Map<string, string[]>} graph - 邻接表表示的图
 * @param {string} startNode - 起始节点
 * @returns {string[]} 访问顺序
 */
function breadthFirstSearch(graph, startNode) {
    // 结果数组：记录访问顺序
    const visited = [];

    // 队列：管理待访问节点
    const queue = [startNode];

    // 集合：记录已访问节点（避免重复访问）
    const visitedNodes = new Set();
    visitedNodes.add(startNode);

    while (queue.length > 0) {
        // 取出队列头部节点
        const currentNode = queue.shift();

        // 访问当前节点
        visited.push(currentNode);

        // 获取当前节点的所有邻居
        const neighbors = graph.get(currentNode) || [];

        for (const neighbor of neighbors) {
            // 如果邻居未被访问，加入队列
            if (!visitedNodes.has(neighbor)) {
                visitedNodes.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return visited;
}

/**
 * BFS 最短路径查找
 * @param {Map<string, string[]>} graph - 邻接表表示的图
 * @param {string} startNode - 起始节点
 * @param {string} targetNode - 目标节点
 * @returns {string[] | null} 从起点到终点的最短路径，如果不存在则返回 null
 */
function bfsShortestPath(graph, startNode, targetNode) {
    if (startNode === targetNode) {
        return [startNode];
    }

    // 队列：存储 [节点, 路径] 对
    const queue = [[startNode, [startNode]]];
    const visitedNodes = new Set([startNode]);

    while (queue.length > 0) {
        const [currentNode, path] = queue.shift();

        const neighbors = graph.get(currentNode) || [];

        for (const neighbor of neighbors) {
            // 找到目标节点
            if (neighbor === targetNode) {
                return [...path, neighbor];
            }

            // 如果未访问，加入队列
            if (!visitedNodes.has(neighbor)) {
                visitedNodes.add(neighbor);
                queue.push([neighbor, [...path, neighbor]]);
            }
        }
    }

    // 不存在路径
    return null;
}

/**
 * BFS 检查图是否连通
 * @param {Map<string, string[]>} graph - 邻接表表示的图
 * @returns {boolean} 如果图是连通的返回 true，否则返回 false
 */
function isGraphConnected(graph) {
    const nodes = Array.from(graph.keys());

    if (nodes.length === 0) {
        return true;
    }

    // 从第一个节点开始 BFS
    const visited = breadthFirstSearch(graph, nodes[0]);

    // 检查是否所有节点都被访问
    return visited.length === nodes.length;
}

module.exports = {
    breadthFirstSearch,
    bfsShortestPath,
    isGraphConnected
};
```

**适用场景**

- JavaScript/Node.js 开发者算法入门
- 前端开发者面试准备
- 了解现代 JavaScript 语法在算法中的应用
- 全栈开发者后端算法参考

---

### 2.5 TheAlgorithms/Rust

**项目信息**
- GitHub 地址：https://github.com/TheAlgorithms/Rust
- 编程语言：Rust
- Star 数：25,622+
- 许可证：MIT

**项目介绍**

TheAlgorithms/Rust 是 Rust 版本的算法仓库。Rust 以其内存安全性和高性能著称，特别适合系统编程和嵌入式开发。该仓库展示了如何用 Rust 实现各类算法，充分利用了 Rust 的所有权系统、泛型、 trait 等高级特性。对于想学习 Rust 或需要在 Rust 项目中使用算法的开发者来说是极好的资源。

**主要功能**

1. **排序算法**：Rust 风格实现的各类排序算法
2. **数据结构**：链表、栈、队列、树、图等
3. **密码学算法**：Rust 实现的高性能加密算法
4. **机器学习**：基础 ML 算法的 Rust 实现
5. **并发算法**：利用 Rust 并发特性的算法实现

**代码示例**

```rust
// 堆排序实现（摘自 TheAlgorithms/Rust/src/sorting/heap_sort.rs）
/**
 * 堆排序算法实现
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(1)
 * 稳定性：不稳定
 *
 * 堆排序的核心思想：
 * 1. 将数组构建为最大堆
 * 2. 反复提取最大元素（堆顶）并重新调整堆
 */

/// 原地堆排序函数
pub fn heap_sort<T: Ord>(array: &mut [T]) {
    let len = array.len();

    if len <= 1 {
        return;
    }

    // 第一步：构建最大堆（从最后一个非叶子节点开始）
    // 对于索引 i，其左子节点为 2*i+1，右子节点为 2*i+2
    // 最后一个非叶子节点的索引为 (len - 1) / 2
    for start in (0..= (len - 1) / 2).rev() {
        sift_down(array, start, len - 1);
    }

    // 第二步：反复提取最大元素并重新调整堆
    for end in (1..len).rev() {
        // 将堆顶（最大元素）与最后一个元素交换
        array.swap(0, end);
        // 重新调整堆（堆大小减1）
        sift_down(array, 0, end - 1);
    }
}

/// 将指定节点向下调整为最大堆
///
/// # 参数说明
/// - array: 待排序数组
/// - start: 要调整的节点索引
/// - end: 堆的最后一个有效索引
fn sift_down<T: Ord>(array: &mut [T], mut start: usize, mut end: usize) {
    // 计算左子节点索引
    let mut child = 2 * start + 1;

    while child <= end {
        // 如果右子节点存在且大于左子节点，选择右子节点
        if child + 1 <= end && array[child] < array[child + 1] {
            child += 1;
        }

        // 如果当前节点已经满足堆性质，停止调整
        if array[start] >= array[child] {
            return;
        }

        // 交换父子节点的值
        array.swap(start, child);

        // 继续向下调整
        start = child;
        child = 2 * start + 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heap_sort() {
        let mut arr = vec![64, 34, 25, 12, 22, 11, 90];
        heap_sort(&mut arr);
        assert_eq!(arr, vec![11, 12, 22, 25, 34, 64, 90]);
    }

    #[test]
    fn test_heap_sort_empty() {
        let mut arr: Vec<i32> = vec![];
        heap_sort(&mut arr);
        assert_eq!(arr, vec![]);
    }

    #[test]
    fn test_heap_sort_already_sorted() {
        let mut arr = vec![1, 2, 3, 4, 5];
        heap_sort(&mut arr);
        assert_eq!(arr, vec![1, 2, 3, 4, 5]);
    }
}
```

**适用场景**

- Rust 开发者算法学习与实践
- 系统编程中的高效算法实现参考
- 嵌入式开发场景的算法实现
- 学习 Rust 高级特性的范例代码

---

### 2.6 TheAlgorithms/C

**项目信息**
- GitHub 地址：https://github.com/TheAlgorithms/C
- 编程语言：C
- Star 数：21,866+
- 许可证：MIT

**项目介绍**

TheAlgorithms/C 是 C 语言版本的算法仓库。C 语言是计算机科学的「通用语言」，许多操作系统和底层软件都用 C 开发。该仓库展示了如何用 C 语言实现各类经典算法，是理解算法底层原理的优秀资源。通过学习 C 版本的算法实现，可以深入理解算法的核心思想，因为没有高级语言的高级抽象干扰。

**主要功能**

1. **基础算法**：排序、搜索、字符串处理等
2. **数据结构**：链表、栈、队列、树、图等
3. **算法范式**：分治、动态规划、贪心、回溯等
4. **数论算法**：质数、模运算、最大公约数等
5. **密码学**：基础加密算法的 C 语言实现
6. **并发**：C 语言多线程算法实现

**代码示例**

```c
// 归并排序实现（摘自 TheAlgorithms/Sorting/MergeSort.c）
/**
 * 归并排序算法实现
 *
 * 时间复杂度：O(n log n)
 * 空间复杂度：O(n)
 * 稳定性：稳定
 *
 * 算法步骤：
 * 1. 分割：将数组递归地分成两半，直到子数组只包含一个元素
 * 2. 合并：将两个有序子数组合并为一个有序数组
 */

/**
 * 合并两个有序数组
 *
 * @param array  原始数组
 * @param left   左半部分的起始索引
 * @param middle 左半部分的结束索引
 * @param right  右半部分的结束索引
 */
void merge(int array[], int left, int middle, int right) {
    int i, j, k;

    // 计算两个子数组的长度
    int leftSize = middle - left + 1;
    int rightSize = right - middle;

    // 创建临时数组
    int *leftArray = (int *)malloc(leftSize * sizeof(int));
    int *rightArray = (int *)malloc(rightSize * sizeof(int));

    // 复制数据到临时数组
    for (i = 0; i < leftSize; i++) {
        leftArray[i] = array[left + i];
    }
    for (j = 0; j < rightSize; j++) {
        rightArray[j] = array[middle + 1 + j];
    }

    // 合并两个临时数组回原数组
    i = 0;      // 左数组的初始索引
    j = 0;      // 右数组的初始索引
    k = left;   // 合并后数组的初始索引

    while (i < leftSize && j < rightSize) {
        if (leftArray[i] <= rightArray[j]) {
            array[k] = leftArray[i];
            i++;
        } else {
            array[k] = rightArray[j];
            j++;
        }
        k++;
    }

    // 复制左数组剩余的元素
    while (i < leftSize) {
        array[k] = leftArray[i];
        i++;
        k++;
    }

    // 复制右数组剩余的元素
    while (j < rightSize) {
        array[k] = rightArray[j];
        j++;
        k++;
    }

    // 释放临时数组内存
    free(leftArray);
    free(rightArray);
}

/**
 * 递归执行归并排序
 *
 * @param array 待排序数组
 * @param left  排序范围的起始索引
 * @param right 排序范围的结束索引
 */
void mergeSort(int array[], int left, int right) {
    // 基本情况：子数组包含至少两个元素
    if (left < right) {
        // 防止 left + right 溢出的写法
        int middle = left + (right - left) / 2;

        // 递归排序左半部分
        mergeSort(array, left, middle);

        // 递归排序右半部分
        mergeSort(array, middle + 1, right);

        // 合并两部分
        merge(array, left, middle, right);
    }
}

/**
 * 归并排序的包装函数
 *
 * @param array 待排序数组
 * @param size  数组大小
 */
void merge_sort(int array[], int size) {
    if (array == NULL || size <= 0) {
        return;
    }
    mergeSort(array, 0, size - 1);
}
```

**适用场景**

- C 语言开发者算法学习
- 理解算法底层原理
- 嵌入式开发场景
- 数据结构和算法课程教学

---

### 2.7 keon/algorithms

**项目信息**
- GitHub 地址：https://github.com/keon/algorithms
- 编程语言：Python
- Star 数：25,412+
- 许可证：MIT

**项目介绍**

keon/algorithms 是一个专注于「最小示例」的 Python 算法仓库。与 TheAlgorithms/Python 的全面覆盖不同，该项目强调简洁、清晰的实现，每个算法都力求用最少的代码表达核心思想。代码简洁易懂，适合初学者理解算法原理，是入门算法学习的优秀起步资源。

**主要功能**

1. **简洁实现**：每个算法都用最少的代码实现
2. **覆盖核心**：包含面试中最常考的算法类型
3. **详细注释**：关键步骤都有清晰的注释说明
4. **单元测试**：每个算法都配有测试用例

**代码示例**

```python
# 动态规划 - 爬楼梯问题（摘自 keon/algorithms/dp/coin_change.py）
"""
爬楼梯问题（最小花费版本）

问题描述：
给定一个楼梯，总共有 n 级台阶。每次爬到上一级时，可以选择爬 1 级或 2 级台阶。
每级台阶有一定的成本 cost[i]，求到达第 n 级台阶的最小成本。

思路：
- dp[i] 表示到达第 i 级台阶的最小成本
- dp[i] = min(dp[i-1], dp[i-2]) + cost[i]
- 最终答案是 min(dp[n-1], dp[n-2])（最后一步可以是 1 级或 2 级）
"""
from typing import List


def min_cost_climbing_stairs(cost: List[int]) -> int:
    """
    计算爬楼梯的最小成本

    参数：
        cost: 每个台阶的成本列表

    返回：
        到达顶部的最小成本

    示例：
        >>> min_cost_climbing_stairs([10, 15, 20])
        15
        >>> min_cost_climbing_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])
        6
    """
    n = len(cost)

    if n == 0:
        return 0
    if n == 1:
        return cost[0]

    # dp[i] 表示到达第 i 级台阶的最小成本
    # 由于只依赖前两个状态，可以优化空间到 O(1)
    dp = [0] * n

    # 初始化：可以选择从第 0 或第 1 级台阶开始
    dp[0] = cost[0]
    dp[1] = cost[1]

    # 递推计算
    for i in range(2, n):
        dp[i] = min(dp[i-1], dp[i-2]) + cost[i]

    # 返回最后一步的最小成本
    return min(dp[n-1], dp[n-2])


# 空间优化版本
def min_cost_climbing_stairs_optimized(cost: List[int]) -> int:
    """
    空间优化版本，只使用 O(1) 额外空间
    """
    n = len(cost)

    if n == 0:
        return 0
    if n == 1:
        return cost[0]

    # 只保留最后两个状态
    prev2 = cost[0]  # dp[i-2]
    prev1 = cost[1]  # dp[i-1]

    for i in range(2, n):
        current = min(prev1, prev2) + cost[i]
        prev2 = prev1
        prev1 = current

    return min(prev1, prev2)
```

```python
# 图算法 - 最短路径（摘自 keon/algorithms/graph/dijkstra.py）
"""
Dijkstra 最短路径算法

算法思想：
1. 使用贪心策略，从起点开始逐步扩展最短路径
2. 维护一个距离表，记录从起点到各点的当前最短距离
3. 每次选择距离最小的未访问节点进行处理
4. 更新该节点邻居的距离（如果经过该节点更近）

时间复杂度：O((V + E) log V)，使用优先队列时
空间复杂度：O(V)
"""
import heapq
from collections import defaultdict


def dijkstra(graph, start):
    """
    Dijkstra 最短路径算法

    参数：
        graph: 邻接表表示的图，格式为 {节点: [(邻居, 权重), ...]}
        start: 起始节点

    返回：
        distances: 从起点到各节点的最短距离字典

    示例：
        >>> graph = {
        ...     'A': [('B', 1), ('C', 4)],
        ...     'B': [('A', 1), ('C', 2), ('D', 5)],
        ...     'C': [('A', 4), ('B', 2), ('D', 1)],
        ...     'D': [('B', 5), ('C', 1)]
        ... }
        >>> dijkstra(graph, 'A')
        {'A': 0, 'B': 1, 'C': 3, 'D': 4}
    """
    # 距离表，存储从起点到各点的当前最短距离
    distances = {node: float('inf') for node in graph}
    distances[start] = 0

    # 优先队列：[距离, 节点]
    # heapq 是小根堆，自动按距离排序
    pq = [(0, start)]

    # 已访问节点集合
    visited = set()

    while pq:
        # 取出距离最小的节点
        current_dist, current_node = heapq.heappop(pq)

        # 如果已访问，跳过
        if current_node in visited:
            continue

        # 标记为已访问
        visited.add(current_node)

        # 更新邻居节点的距离
        for neighbor, weight in graph[current_node]:
            if neighbor not in visited:
                new_dist = current_dist + weight

                # 如果发现更短的路径，更新距离表并加入队列
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    heapq.heappush(pq, (new_dist, neighbor))

    return distances
```

**适用场景**

- Python 开发者算法入门
- 面试前快速复习核心算法
- 想找简洁代码示例的开发者
- 作为其他复杂实现的参考起点

---

### 2.8 donnemartin/interactive-coding-challenges

**项目信息**
- GitHub 地址：https://github.com/donnemartin/interactive-coding-challenges
- 编程语言：Python
- Star 数：31,295+
- 许可证：MIT

**项目介绍**

donnemartin/interactive-coding-challenges 是一个交互式编程挑战仓库，包含 120+ 道算法和数据结构相关的面试题目。该项目不仅提供题目描述，还包含了详细的解题分析、复杂度分析以及测试用例。特别值得一提的是，项目还包含了 Anki 闪卡，对抗遗忘曲线设计，非常适合面试准备。

**主要功能**

1. **120+ 面试题目**：涵盖各大公司常见面试题型
2. **多种语言支持**：Python、SQL 以及系统设计题目
3. **Anki 闪卡**：配合间隔重复算法，高效记忆解题思路
4. **代码测试**：每个题目都配有完整的测试用例
5. **时间空间复杂度分析**：每道题都标注了复杂度分析

**代码示例**

```python
# 链表相关挑战（摘自 donnemartin/interactive-coding-challenges）
"""
链表反转问题

LeetCode 206. 反转链表

给你单链表的头节点 head，请你反转链表，并返回反转后的链表。

示例：
输入：head = [1,2,3,4,5]
输出：[5,4,3,2,1]

思路1：迭代法
- 使用三个指针：prev、curr、next_node
- 逐个节点反转链表方向
- 时间复杂度：O(n)
- 空间复杂度：O(1)

思路2：递归法
- 将链表反转问题分解为：反转头节点之后的链表 + 处理头节点
- 时间复杂度：O(n)
- 空间复杂度：O(n)（递归栈）
"""


# Definition for singly-linked list
class ListNode:
    """链表节点定义"""
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class ReverseLinkedList:
    """链表反转实现"""

    @staticmethod
    def reverse_iterative(head: ListNode) -> ListNode:
        """
        迭代版本：反转链表

        使用三个指针逐个节点反转链表方向

        时间复杂度：O(n)
        空间复杂度：O(1)
        """
        prev = None      # 前一个节点，初始为 None
        curr = head      # 当前节点

        while curr:
            next_node = curr.next   # 保存下一个节点
            curr.next = prev        # 反转当前节点的指向
            prev = curr             # prev 前移
            curr = next_node        # curr 前移

        return prev  # 新的头节点

    @staticmethod
    def reverse_recursive(head: ListNode) -> ListNode:
        """
        递归版本：反转链表

        递归思想：
        1. 基本情况：空链表或只有一个节点，直接返回
        2. 递归反转 head 之后的链表
        3. 将 head 放到反转后链表的末尾

        时间复杂度：O(n)
        空间复杂度：O(n)
        """
        # 基本情况：空链表或只有一个节点
        if not head or not head.next:
            return head

        # 递归反转剩余链表，返回反转后的头节点
        new_head = ReverseLinkedList.reverse_recursive(head.next)

        # 将当前节点放到反转后链表的末尾
        head.next.next = head
        head.next = None

        return new_head


class TestReverseLinkedList:
    """测试用例"""

    @staticmethod
    def create_linked_list(values: list) -> ListNode:
        """从列表创建链表"""
        if not values:
            return None
        head = ListNode(values[0])
        curr = head
        for val in values[1:]:
            curr.next = ListNode(val)
            curr = curr.next
        return head

    @staticmethod
    def linked_list_to_list(head: ListNode) -> list:
        """将链表转换为列表"""
        result = []
        while head:
            result.append(head.val)
            head = head.next
        return result

    def test_reverse_iterative(self):
        """测试迭代版本"""
        values = [1, 2, 3, 4, 5]
        head = self.create_linked_list(values)
        reversed_head = ReverseLinkedList.reverse_iterative(head)
        result = self.linked_list_to_list(reversed_head)
        assert result == [5, 4, 3, 2, 1]
        print("迭代版本测试通过！")

    def test_reverse_recursive(self):
        """测试递归版本"""
        values = [1, 2, 3, 4, 5]
        head = self.create_linked_list(values)
        reversed_head = ReverseLinkedList.reverse_recursive(head)
        result = self.linked_list_to_list(reversed_head)
        assert result == [5, 4, 3, 2, 1]
        print("递归版本测试通过！")
```

**适用场景**

- 面试前算法题强化训练
- 系统性复习算法和数据结构
- 使用 Anki 闪卡进行长期记忆
- 模拟面试环境进行练习

---

### 2.9 mandliya/algorithms_and_data_structures

**项目信息**
- GitHub 地址：https://github.com/mandliya/algorithms_and_data_structures
- 编程语言：C++
- Star 数：6,123+
- 许可证：MIT

**项目介绍**

mandliya/algorithms_and_data_structures 是一个专注于 C++ 实现的算法和数据结构仓库，包含了 180+ 道算法和数据结构问题。每个实现都附带了详细的问题分析、解决方案讨论以及测试用例。C++ 是面试中的主流语言之一，该仓库是准备技术面试的绝佳资源。

**主要功能**

1. **180+ 题目**：涵盖各类算法和数据结构问题
2. **详细解析**：每个问题都有详细的分析和解法讨论
3. **C++ 实现**：使用现代 C++（C++11/14）编写
4. **测试用例**：每个实现都有完整的测试覆盖
5. **Makefile**：包含构建和测试的配置

**代码示例**

```cpp
// 字符串最长无重复子串（摘自 mandliya/algorithms_andDataStructures）
/**
 * LeetCode 3. 无重复字符的最长子串
 *
 * 问题描述：
 * 给定一个字符串 s，请你找出其中不含有重复字符的最长子串的长度。
 *
 * 示例：
 * 输入: "abcabcbb"
 * 输出: 3
 * 解释: 因为无重复字符的最长子串是 "abc"，长度为 3
 *
 * 思路：滑动窗口 + 哈希表
 * - 使用左右指针维护一个滑动窗口
 * - 使用哈希表记录每个字符最后出现的位置
 * - 右指针扩展窗口，左指针收缩窗口确保无重复
 *
 * 时间复杂度：O(n)
 * 空间复杂度：O(min(m, n))，其中 m 是字符集大小
 */

#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>

class LongestSubstring {
public:
    /**
     * 计算无重复字符的最长子串长度
     *
     * @param s 输入字符串
     * @return 最长子串的长度
     */
    static int lengthOfLongestSubstring(const std::string& s) {
        // 边界情况处理
        if (s.empty()) {
            return 0;
        }

        if (s.length() == 1) {
            return 1;
        }

        // 哈希表：存储字符上一次出现的位置
        // key: 字符, value: 字符最后出现的位置（从0开始）
        std::unordered_map<char, int> charIndex;

        // 滑动窗口的左边界
        int left = 0;

        // 最长长度初始化为1（至少有一个字符）
        int maxLength = 1;

        // 遍历字符串，右边界逐渐扩展
        for (int right = 0; right < s.length(); ++right) {
            char current = s[right];

            // 如果当前字符在窗口中已存在
            // 需要移动左边界到该字符上一次出现位置的下一个
            if (charIndex.find(current) != charIndex.end()) {
                // 取最大值确保左边界不会回退
                // 场景："abba"，当处理第二个 'b' 时，
                // charIndex['b'] = 1，如果不取最大值，left 会回退到 2
                left = std::max(left, charIndex[current] + 1);
            }

            // 更新字符最后出现的位置
            charIndex[current] = right;

            // 更新最大长度
            // right - left + 1 是当前窗口的大小
            maxLength = std::max(maxLength, right - left + 1);
        }

        return maxLength;
    }

    /**
     * 双指针版本（不使用哈希表）
     * 时间复杂度：O(n^2)
     * 空间复杂度：O(1)
     * 仅适用于字符集较小的情况
     */
    static int lengthOfLongestSubstringBrute(const std::string& s) {
        int n = s.length();
        int maxLength = 0;

        for (int left = 0; left < n; ++left) {
            std::unordered_set<char> seen;
            int right = left;

            while (right < n && seen.find(s[right]) == seen.end()) {
                seen.insert(s[right]);
                ++right;
            }

            maxLength = std::max(maxLength, right - left);
        }

        return maxLength;
    }
};

// 测试代码
int main() {
    // 测试用例
    std::string test1 = "abcabcbb";
    std::string test2 = "bbbbb";
    std::string test3 = "pwwkew";
    std::string test4 = "";
    std::string test5 = " ";
    std::string test6 = "abba";

    std::cout << "Test 1: " << LongestSubstring::lengthOfLongestSubstring(test1)
              << " (expected: 3)" << std::endl;
    std::cout << "Test 2: " << LongestSubstring::lengthOfLongestSubstring(test2)
              << " (expected: 1)" << std::endl;
    std::cout << "Test 3: " << LongestSubstring::lengthOfLongestSubstring(test3)
              << " (expected: 3)" << std::endl;
    std::cout << "Test 4: " << LongestSubstring::lengthOfLongestSubstring(test4)
              << " (expected: 0)" << std::endl;
    std::cout << "Test 5: " << LongestSubstring::lengthOfLongestSubstring(test5)
              << " (expected: 1)" << std::endl;
    std::cout << "Test 6: " << LongestSubstring::lengthOfLongestSubstring(test6)
              << " (expected: 2)" << std::endl;

    return 0;
}
```

**适用场景**

- C++ 开发者面试准备
- 系统学习数据结构和算法
- 作为 ACM 竞赛的练习资源
- 补充课堂学习的不足

---

### 2.10 xtaci/algorithms

**项目信息**
- GitHub 地址：https://github.com/xtaci/algorithms
- 编程语言：C++
- Star 数：5,443+
- 许可证：MIT

**项目介绍**

xtaci/algorithms 是一个专注于高性能算法实现的 C++ 仓库。与教学性质的仓库不同，该仓库中的算法实现更加注重性能和实用性，很多实现可以直接应用于生产环境。仓库中还包含了一些高级算法和数据结构，如 B-Tree、红黑树、跳表等，适合有一定基础的开发者深入学习。

**主要功能**

1. **高性能实现**：注重算法的时间效率和空间效率
2. **高级数据结构**：B-Tree、红黑树、跳表等
3. **实用工具**：常用算法工具的高效实现
4. **边界优化**：处理各种边界情况和整数溢出

**代码示例**

```cpp
// 并查集实现（摘自 xtaci/algorithms）
/**
 * 并查集（Union-Find）数据结构
 *
 * 并查集是一种树形的数据结构，用于处理不交集的合并和查询
 *
 * 主要操作：
 * - find(x): 查找元素 x 所属集合的代表元素
 * - union(x, y): 合并 x 和 y 所属的集合
 *
 * 优化策略：
 * 1. 路径压缩（Path Compression）：在 find 时将路径上的所有节点直接指向根节点
 * 2. 按秩合并（Union by Rank）：合并时将较浅的树合并到较深的树上
 *
 * 时间复杂度：
 * - 近乎 O(1)（实际是反阿克曼函数 Amortized）
 */

#include <vector>
#include <numeric>

class UnionFind {
private:
    std::vector<int> parent;  // 父节点数组
    std::vector<int> rank;    // 秩（树的深度上界）

public:
    /**
     * 构造函数：初始化 n 个独立的元素
     * 每个元素都是自己的父节点（一个单独的集合）
     */
    UnionFind(int n) : parent(n), rank(n, 0) {
        // 初始化：每个元素的父节点是自身
        std::iota(parent.begin(), parent.end(), 0);
    }

    /**
     * 查找操作：找到 x 所属集合的代表元素
     *
     * 路径压缩：在查找过程中，将路径上的所有节点直接指向根节点
     * 这大大减少了后续查找的时间
     */
    int find(int x) {
        if (parent[x] != x) {
            // 递归查找父节点，并进行路径压缩
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    /**
     * 合并操作：将 x 和 y 所属的集合合并
     *
     * 按秩合并：将较浅的树合并到较深的树上
     * 这有助于保持树的平衡，减少后续 find 操作的时间
     */
    void unite(int x, int y) {
        // 找到各自的根节点
        int rootX = find(x);
        int rootY = find(y);

        // 如果已经在同一个集合中，不需要合并
        if (rootX == rootY) {
            return;
        }

        // 按秩合并：将较浅的树合并到较深的树上
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            // 秩相同，合并后秩增加 1
            parent[rootY] = rootX;
            rank[rootX]++;
        }
    }

    /**
     * 判断两个元素是否在同一个集合中
     */
    bool same(int x, int y) {
        return find(x) == find(y);
    }
};

/**
 * 并查集的典型应用场景：
 *
 * 1. 社交网络中的朋友圈问题
 *    - 判断两个人是否在同一个朋友圈
 *    - 合并两个人的朋友圈
 *
 * 2. 图的连通分量
 *    - 判断两个节点是否连通
 *    - 添加边后合并连通分量
 *
 * 3. Kruskal 最小生成树算法
 *    - 合并已选择的边两端的集合
 *    - 检测是否形成环
 */
```

**适用场景**

- 需要高性能算法实现的 C++ 开发者
- 学习高级数据结构的参考
- 生产环境中的算法实现参考
- ACM 竞赛和算法比赛准备

---

### 2.11 arnauddri/algorithms

**项目信息**
- GitHub 地址：https://github.com/arnauddri/algorithms
- 编程语言：Go
- Star 数：1,856+
- 许可证：MIT

**项目介绍**

arnauddri/algorithms 是一个使用 Go 语言实现算法和数据结构的仓库。Go 语言以其简洁性和高性能著称，特别适合云原生和并发编程。该仓库展示了如何用 Go 的风格实现经典算法，代码简洁优雅，适合学习 Go 语言的同时掌握算法知识。

**主要功能**

1. **基础算法**：排序、搜索等经典算法
2. **数据结构**：链表、栈、队列、树、图等
3. **Go 风格**：遵循 Go 语言的惯用写法
4. **简洁实现**：每个实现都力求简洁易懂

**代码示例**

```go
// 图的深度优先搜索实现（摘自 arnauddri/algorithms）
package algorithms

/**
 * 图的深度优先搜索（DFS）实现
 *
 * DFS 核心思想：
 * 1. 沿着一条路径尽可能深入
 * 2. 遇到死胡同时回溯
 * 3. 继续搜索其他路径
 *
 * 时间复杂度：O(V + E)，V 是顶点数，E 是边数
 * 空间复杂度：O(V)
 */

// 图的邻接表表示
type Graph map[string][]string

// DFS 递归实现
func DFS(g Graph, start string) []string {
    // 结果切片：记录访问顺序
    var result []string

    // 已访问节点集合
    visited := make(map[string]bool)

    // 递归辅助函数
    var dfsHelper func(node string)
    dfsHelper = func(node string) {
        // 标记为已访问
        visited[node] = true

        // 访问当前节点
        result = append(result, node)

        // 递归访问所有邻居节点
        for _, neighbor := range g[node] {
            if !visited[neighbor] {
                dfsHelper(neighbor)
            }
        }
    }

    // 从起始节点开始 DFS
    dfsHelper(start)

    return result
}

// DFS 迭代实现（使用栈）
func DFSIterative(g Graph, start string) []string {
    var result []string
    visited := make(map[string]bool)

    // 使用切片模拟栈
    stack := []string{start}

    for len(stack) > 0 {
        // 弹出栈顶元素
        node := stack[len(stack)-1]
        stack = stack[:len(stack)-1]

        // 如果已访问，跳过
        if visited[node] {
            continue
        }

        // 标记为已访问
        visited[node] = true

        // 访问当前节点
        result = append(result, node)

        // 将所有未访问的邻居压入栈
        // 注意：由于是栈，后面的邻居会先被处理
        for i := len(g[node]) - 1; i >= 0; i-- {
            neighbor := g[node][i]
            if !visited[neighbor] {
                stack = append(stack, neighbor)
            }
        }
    }

    return result
}

// 拓扑排序（使用 DFS）
func TopologicalSort(g Graph) ([]string, bool) {
    var result []string
    visited := make(map[string]bool)
    inStack := make(map[string]bool) // 用于检测环

    var dfsHelper func(node string) bool
    dfsHelper = func(node string) bool {
        visited[node] = true
        inStack[node] = true

        for _, neighbor := range g[node] {
            if !visited[neighbor] {
                // 如果邻居未访问，继续 DFS
                if !dfsHelper(neighbor) {
                    return false // 检测到环
                }
            } else if inStack[neighbor] {
                // 如果邻居在当前递归栈中，说明存在环
                return false
            }
        }

        // 完成当前节点的访问，从递归栈中移除
        inStack[node] = false

        // 将节点添加到结果的前面（后序遍历的逆序）
        result = append([]string{node}, result...)

        return true
    }

    // 遍历所有节点
    for node := range g {
        if !visited[node] {
            if !dfsHelper(node) {
                return nil, false // 存在环，无法进行拓扑排序
            }
        }
    }

    return result, true
}
```

**适用场景**

- Go 开发者算法学习
- 云原生服务中的算法实现参考
- 并发算法学习
- 学习 Go 语言的算法应用

---

### 2.12 justcoding121/advanced-algorithms

**项目信息**
- GitHub 地址：https://github.com/justcoding121/advanced-algorithms
- 编程语言：C#
- Star 数：1,376+
- 许可证：MIT

**项目介绍**

justcoding121/advanced-algorithms 是一个使用 C# 实现高级算法的仓库，包含 100+ 种算法和数据结构的泛型实现。该仓库的特点是使用 C# 的高级特性，如泛型、LINQ、并发集合等，实现方式符合 .NET 生态系统的最佳实践。

**主要功能**

1. **泛型实现**：所有算法都支持任意数据类型
2. **高级特性**：充分利用 C# 的高级语言特性
3. **性能优化**：考虑了 .NET 运行时的性能特点
4. **完整测试**：每个算法都有详细的单元测试

**代码示例**

```csharp
// 动态规划 - 背包问题（摘自 justcoding121/advanced-algorithms）
using System;
using System.Collections.Generic;

namespace Advanced.Algorithms.DataStructures
{
    /// <summary>
    /// 0-1 背包问题求解器
    ///
    /// 问题描述：
    /// 有 n 件物品，每件物品 i 有重量 w[i] 和价值 v[i]。
    /// 有一个容量为 W 的背包。
    /// 求在不超过背包容量的情况下，使装入物品的价值最大。
    ///
    /// 思路：动态规划
    /// - dp[i, w] 表示考虑前 i 件物品，背包容量为 w 时的最大价值
    /// - 对于第 i 件物品，有两种选择：放或不放
    /// - dp[i, w] = max(dp[i-1, w], dp[i-1, w-w[i]] + v[i])（如果 w >= w[i]）
    /// - dp[i, w] = dp[i-1, w]（如果 w < w[i]）
    /// </summary>
    public class KnapsackProblem
    {
        /// <summary>
        /// 求解 0-1 背包问题的最大价值
        /// </summary>
        /// <param name="weights">物品重量数组</param>
        /// <param name="values">物品价值数组</param>
        /// <param name="capacity">背包容量</param>
        /// <returns>最大价值</returns>
        public static int Solve(int[] weights, int[] values, int capacity)
        {
            int n = weights.Length;

            // 边界情况处理
            if (n == 0 || capacity <= 0)
                return 0;

            // dp[i, w] 表示考虑前 i 件物品，背包容量为 w 时的最大价值
            // 可以优化空间到 O(capacity)，因为 dp[i] 只依赖 dp[i-1]
            int[,] dp = new int[n + 1, capacity + 1];

            // 初始化第一行（只有一个物品时）
            for (int w = 0; w <= capacity; w++)
            {
                if (w >= weights[0])
                    dp[1, w] = values[0];
                else
                    dp[1, w] = 0;
            }

            // 填充 dp 表
            for (int i = 2; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    // 不放第 i 件物品
                    int exclude = dp[i - 1, w];

                    // 放第 i 件物品（如果能装下）
                    int include = 0;
                    if (w >= weights[i - 1])
                    {
                        include = dp[i - 1, w - weights[i - 1]] + values[i - 1];
                    }

                    // 取两种选择的最大值
                    dp[i, w] = Math.Max(exclude, include);
                }
            }

            return dp[n, capacity];
        }

        /// <summary>
        /// 空间优化版本
        /// 只使用一维数组
        /// </summary>
        public static int SolveOptimized(int[] weights, int[] values, int capacity)
        {
            int n = weights.Length;

            if (n == 0 || capacity <= 0)
                return 0;

            // 一维 dp 数组
            // 注意：需要从右向左遍历，避免重复使用同一物品
            int[] dp = new int[capacity + 1];

            for (int i = 0; i < n; i++)
            {
                // 从右向左遍历，确保每个物品只被使用一次
                for (int w = capacity; w >= weights[i]; w--)
                {
                    dp[w] = Math.Max(dp[w], dp[w - weights[i]] + values[i]);
                }
            }

            return dp[capacity];
        }

        /// <summary>
        /// 获取最优解的具体选择
        /// </summary>
        public static List<int> GetSolution(int[] weights, int[] values, int capacity)
        {
            int n = weights.Length;
            var selected = new List<int>();

            if (n == 0 || capacity <= 0)
                return selected;

            // 使用二维数组记录选择过程
            bool[,] dp = new bool[n + 1, capacity + 1];
            int[,] value = new int[n + 1, capacity + 1];

            for (int i = 1; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    // 不放第 i 件物品
                    value[i, w] = value[i - 1, w];

                    // 放第 i 件物品
                    if (w >= weights[i - 1])
                    {
                        int newValue = value[i - 1, w - weights[i - 1]] + values[i - 1];
                        if (newValue > value[i, w])
                        {
                            value[i, w] = newValue;
                            dp[i, w] = true;
                        }
                    }
                }
            }

            // 回溯找出选择的物品
            int w = capacity;
            for (int i = n; i >= 1; i--)
            {
                if (dp[i, w])
                {
                    selected.Add(i - 1);
                    w -= weights[i - 1];
                }
            }

            return selected;
        }
    }
}
```

**适用场景**

- C#/.NET 开发者算法学习
- 游戏开发中的算法实现参考
- .NET 生态系统中的算法应用
- 微软技术栈开发者的参考资源

---

## 三、综合对比分析

### 3.1 按编程语言选择

| 语言 | 推荐仓库 | Star 总数 | 适合人群 |
|------|----------|-----------|----------|
| Python | TheAlgorithms/Python / keon/algorithms | 244,662+ | AI/ML 开发者、数据科学家、Web 开发者 |
| JavaScript | TheAlgorithms/JavaScript | 34,083+ | 前端/全栈开发者、Node.js 开发者 |
| Java | TheAlgorithms/Java | 65,312+ | Android 开发者、企业级应用开发者 |
| C++ | xtaci/algorithms / mandliya/algorithms | 11,566+ | 系统程序员、游戏开发者、竞赛选手 |
| C | TheAlgorithms/C | 21,866+ | 嵌入式开发者、系统级开发者 |
| Go | arnauddri/algorithms | 1,856+ | 云原生开发者、DevOps、服务器开发 |
| Rust | TheAlgorithms/Rust | 25,622+ | 系统程序员、安全敏感型应用 |
| C# | justcoding121/advanced-algorithms | 1,376+ | .NET 开发者、游戏开发（Unity） |

### 3.2 按学习目的选择

| 目的 | 推荐仓库 | 理由 |
|------|----------|------|
| 面试准备 | labuladong/fucking-algorithm + TheAlgorithms/JavaScript | 前者提供思路框架，后者提供语言实现 |
| 深入理解原理 | TheAlgorithms/C + labuladong/fucking-algorithm | C 语言无高级抽象，适合理解底层原理 |
| 快速查阅参考 | TheAlgorithms/Python + keon/algorithms | 代码简洁，示例丰富，易于查找 |
| 系统性学习 | donnemartin/interactive-coding-challenges | 包含题目、测试、闪卡，学习体系完整 |
| 工程应用 | xtaci/algorithms | 高性能实现，适合直接用于生产 |
| 多语言学习 | TheAlgorithms 系列（多语言版本） | 同一算法多种语言实现，便于对比 |

### 3.3 按学习阶段选择

| 阶段 | 推荐仓库 | 说明 |
|------|----------|------|
| 入门级 | keon/algorithms、TheAlgorithms/JavaScript | 代码简洁，注释详细，适合零基础 |
| 初级 | TheAlgorithms/Python、jwasham/computer-science-flash-cards | 覆盖全面，配有记忆卡片 |
| 中级 | labuladong/fucking-algorithm、donnemartin/interactive-coding-challenges | 强调思路和框架，适合巩固提高 |
| 高级 | xtaci/algorithms、justcoding121/advanced-algorithms | 高级数据结构和优化技巧 |

---

## 四、算法学习路线建议

### 4.1 零基础入门路线

```
第一阶段：基础概念（1-2周）
├── 阅读：jwasham/computer-science-flash-cards（CS 基础概念）
├── 学习：基础数据结构（数组、链表、栈、队列）
└── 练习：keon/algorithms 中的基础题目

第二阶段：基础算法（2-3周）
├── 排序算法：冒泡、选择、插入、归并、快速
├── 搜索算法：二分查找
├── 字符串基础：字符串操作
└── 参考：TheAlgorithms/Python

第三阶段：进阶数据结构（2-3周）
├── 树：二叉树、二叉搜索树、堆
├── 图：图的表示、BFS、DFS
├── 哈希表：哈希函数、冲突解决
└── 参考：TheAlgorithms/JavaScript

第四阶段：算法范式（3-4周）
├── 动态规划：背包、LIS、LCS、编辑距离
├── 回溯算法：全排列、子集、N皇后
├── 贪心算法：区间调度、Huffman 编码
└── 参考：labuladong/fucking-algorithm
```

### 4.2 面试冲刺路线

```
目标人群：已有基础，需要面试前的集中突破

第1周：高频题型
├── 数组：双指针、滑动窗口
├── 链表：反转、合并、检测环
├── 树：遍历、路径相关
└── 工具：donnemartin/interactive-coding-challenges

第2周：核心算法范式
├── 动态规划：经典 DP 问题模式
├── 回溯：组合、排列、切割
├── BFS/DFS：岛屿问题、拓扑排序
└── 工具：labuladong/fucking-algorithm

第3周：高级与扩展
├── 图论：最短路径、最小生成树
├── 并查集：朋友圈、岛屿数量
├── 高级数据结构：线段树、Trie
└── 工具：xtaci/algorithms

第4周：模拟与总结
├── 按类别刷题
├── 复习薄弱环节
├── 总结解题模板
└── 工具：Anki 闪卡记忆
```

---

## 五、各仓库优缺点总结

### 5.1 TheAlgorithms 系列（Python/Java/JavaScript/Rust/C）

**优点**
- 覆盖范围极广，算法种类齐全
- 代码注释详细，配有使用示例
- 目录结构清晰，易于查找
- 多语言版本，适合学习不同语言的实现风格
- 持续更新，维护活跃

**缺点**
- 部分实现为了通用性牺牲了性能
- 缺少深入的算法思路讲解
- 对于完整的学习路径支持不足
- 不适合作为高性能生产代码的直接参考

### 5.2 labuladong/fucking-algorithm

**优点**
- 强调「框架思维」，帮助建立系统性解题思路
- 将算法题分类整理，便于针对性突破
- 图解清晰，讲解深入浅出
- 强调「为什么」而非「怎么做」

**缺点**
- 部分解题模板过于死板，需要灵活变通
- 偏向面试导向，对工程实践指导不足
- 需要有一定基础才能更好理解
- 仅提供思路，没有完整代码实现

### 5.3 donnemartin/interactive-coding-challenges

**优点**
- 120+ 面试题目，系统性练习
- 配有测试用例，可即时验证
- 包含 Anki 闪卡，对抗遗忘
- 提供复杂度分析

**缺点**
- 部分题目只有简单描述，缺少详细解释
- Python 为主，其他语言支持有限
- 代码风格偏向教学，不够工程化

### 5.4 xtaci/algorithms

**优点**
- 高性能实现，可用于生产环境
- 包含高级数据结构和算法
- 优化充分，考虑了各种边界情况
- C++ 现代语法（11/14/17）

**缺点**
- 缺少详细的思路讲解
- 不适合零基础学习
- 代码复杂度较高
- 部分实现缺少注释

---

## 六、面试高频算法清单

以下是根据 GitHub 仓库和面试经验整理的高频算法清单，建议重点掌握：

### 6.1 必须熟练（出现频率 > 80%）

| 类别 | 算法 | 推荐仓库 |
|------|------|----------|
| 排序 | 快速排序、归并排序、堆排序 | TheAlgorithms/* |
| 搜索 | 二分查找及其变体 | TheAlgorithms/* |
| 链表 | 反转链表、合并链表 | TheAlgorithms/JavaScript |
| 树 | 二叉树遍历（递归+迭代） | TheAlgorithms/Java |
| 字符串 | 滑动窗口、字符串匹配 | keon/algorithms |
| 动态规划 | 背包问题、LIS、LCS | labuladong/fucking-algorithm |

### 6.2 建议掌握（出现频率 50-80%）

| 类别 | 算法 | 推荐仓库 |
|------|------|----------|
| 图 | BFS、DFS、最短路径（Dijkstra） | TheAlgorithms/JavaScript |
| 回溯 | 全排列、子集、N皇后 | labuladong/fucking-algorithm |
| 栈/队列 | 单调栈、优先队列 | keon/algorithms |
| 哈希 | 哈希表设计、冲突解决 | TheAlgorithms/Java |
| 并查集 | 朋友圈问题、岛屿数量 | xtaci/algorithms |
| 贪心 | 区间调度、Huffman 编码 | labuladong/fucking-algorithm |

### 6.3 加分项（出现频率 30-50%）

| 类别 | 算法 | 推荐仓库 |
|------|------|----------|
| 高级数据结构 | 线段树、Trie、树状数组 | xtaci/algorithms |
| 图论 | 拓扑排序、最小生成树 | arnauddri/algorithms |
| 字符串 | AC 自动机、后缀数组 | mandliya/algorithms |
| 数学 | 质数判定、模运算、概率期望 | TheAlgorithms/Python |

---

## 七、附加资源

### 7.1 相关 GitHub 仓库推荐

| 仓库 | 描述 | Star 数 |
|------|------|---------|
| kamyu104/LeetCode | LeetCode 题解 | 30,000+ |
| jobs/LeetCode-Company-Question | 各大公司面试题汇总 | 10,000+ |
| CyC2018/CS-Notes | CS 学习笔记 | 150,000+ |
| noir2442/system-design-primer | 系统设计学习 | 80,000+ |

### 7.2 在线刷题平台推荐

| 平台 | 特点 | 适合人群 |
|------|------|----------|
| LeetCode | 题库全面，面试真题多 | 面试准备首选 |
| HackerRank | 题目分类清晰，竞赛功能 | 竞赛、练习 |
| Codeforces | 竞赛为主，题目难度高 | 算法竞赛选手 |
| AtCoder | 竞赛题质量高 | 日本竞赛圈 |
| 牛客网 | 国内面试真题多 | 国内offer 目标 |

---

## 八、总结

本指南整理了 GitHub 上最受欢迎的 15 个算法与数据结构相关开源仓库，涵盖了 Python、Java、JavaScript、C++、Go、Rust、C、C# 等多种编程语言。无论你是零基础入门还是面试冲刺，都能在这些仓库中找到适合自己的学习资源。

**关键建议**
1. **选择适合自己语言的仓库**：优先选择你主要使用的编程语言
2. **配合理论学习**：不要只刷题，要理解算法背后的原理
3. **多动手实践**：光看不做是不够的，要自己实现一遍
4. **建立知识体系**：使用 labuladong 的「框架思维」建立系统性认知
5. **定期复习**：使用 Anki 闪卡等工具对抗遗忘

祝各位学习顺利，面试成功！

---

> 最后更新：2026 年 4 月
> 数据来源：GitHub API（Star 数为截至更新时的数据）
