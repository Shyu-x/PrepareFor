# 分治算法（Divide and Conquer）

## 一、分治算法概述

### 1.1 什么是分治算法？

分治算法的核心思想是"**分而治之**"：

```
分：将原问题分解为若干个规模较小的相同子问题
治：递归地解决这些子问题
合：将子问题的解合并为原问题的解
```

### 1.2 分治算法的三个步骤

```typescript
/**
 * 分治算法的通用模板
 *
 * @param problem 原问题
 * @returns 原问题的解
 */
function divideAndConquer(problem: any): any {
  // 1. 基准情形（Base Case）
  // 当问题规模小到可以直接解决时，返回答案
  if (isSmall(problem)) {
    return solveDirectly(problem);
  }

  // 2. 分解（Divide）
  // 将问题分解为 k 个规模较小的相同子问题
  const subproblems = splitInto(problem);

  // 3. 递归解决（Conquer）
  // 递归求解每个子问题
  const subSolutions = subproblems.map((sub: any) =>
    divideAndConquer(sub)
  );

  // 4. 合并（Combine）
  // 将子问题的解合并为原问题的解
  return merge(subSolutions);
}
```

### 1.3 分治算法的适用条件

```
分治算法适用的三个必要条件：

1. 子问题相互独立
   ┌─────────────────────────────────┐
   │ 各子问题之间不包含公共的子子问题  │
   │ 否则动态规划更合适               │
   └─────────────────────────────────┘

2. 子问题与原问题结构相同
   ┌─────────────────────────────────┐
   │ 子问题可以使用相同的算法解决     │
   │ 这也是递归能够工作的原因         │
   └─────────────────────────────────┘

3. 子问题可以合并
   ┌─────────────────────────────────┐
   │ 合并操作用于将子问题的解组合      │
   │ 如果无法合并，分治就没有意义了   │
   └─────────────────────────────────┘
```

---

## 二、二分查找

### 2.1 问题描述

在**有序数组**中查找目标值，返回其索引或 -1。

### 2.2 算法原理

```
有序数组: [1, 3, 5, 7, 9, 11, 13, 15]
目标值: 7

第1轮：
  left=0, right=7, mid=3
  arr[mid] = 7 == 7, 找到目标！返回 3

有序数组: [1, 3, 5, 7, 9, 11, 13, 15]
目标值: 6

第1轮：
  left=0, right=7, mid=3
  arr[mid] = 7 > 6, 目标在左半边，right = mid - 1 = 2

第2轮：
  left=0, right=2, mid=1
  arr[mid] = 3 < 6, 目标在右半边，left = mid + 1 = 2

第3轮：
  left=2, right=2, mid=2
  arr[mid] = 5 < 6, 目标在右半边，left = mid + 1 = 3

第4轮：
  left=3 > right=2, 未找到，返回 -1
```

### 2.3 代码实现

```typescript
/**
 * 二分查找基础版
 *
 * 时间复杂度: O(log n)
 * 空间复杂度: O(1)
 *
 * @param sortedArr 有序数组（升序）
 * @param target 目标值
 * @returns 目标值的索引，未找到返回 -1
 */
function binarySearch(sortedArr: number[], target: number): number {
  let left = 0;
  let right = sortedArr.length - 1;

  // 循环条件：搜索区间不为空
  while (left <= right) {
    // 防止整数溢出的写法
    const mid = left + Math.floor((right - left) / 2);

    if (sortedArr[mid] === target) {
      return mid; // 找到目标，返回索引
    } else if (sortedArr[mid] < target) {
      // 目标在右半边，缩小左边界
      left = mid + 1;
    } else {
      // 目标在左半边，缩小右边界
      right = mid - 1;
    }
  }

  return -1; // 未找到
}

/**
 * 二分查找递归版
 */
function binarySearchRecursive(
  arr: number[],
  target: number,
  left: number,
  right: number
): number {
  // 基准情形：搜索区间为空
  if (left > right) {
    return -1;
  }

  const mid = left + Math.floor((right - left) / 2);

  if (arr[mid] === target) {
    return mid;
  } else if (arr[mid] < target) {
    // 在右半边递归查找
    return binarySearchRecursive(arr, target, mid + 1, right);
  } else {
    // 在左半边递归查找
    return binarySearchRecursive(arr, target, left, mid - 1);
  }
}

// 测试
const arr = [1, 3, 5, 7, 9, 11, 13, 15];
console.log(binarySearch(arr, 7));  // 输出: 3
console.log(binarySearch(arr, 6));  // 输出: -1
console.log(binarySearchRecursive(arr, 7, 0, arr.length - 1)); // 输出: 3
```

### 2.4 二分查找的变体

```typescript
/**
 * 二分查找变体总结
 */

/**
 * 变体1：查找左边界
 * 返回目标值第一次出现的索引
 */
function lowerBound(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length; // 注意：right 初始化为 length，不是 length-1

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] < target) {
      // 目标在右半边
      left = mid + 1;
    } else {
      // arr[mid] >= target，继续在左半边找
      right = mid;
    }
  }

  // 检查是否找到
  return left < arr.length && arr[left] === target ? left : -1;
}

/**
 * 变体2：查找右边界
 * 返回目标值最后一次出现的索引 + 1
 */
function upperBound(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] <= target) {
      // arr[mid] <= target，继续在右半边找
      left = mid + 1;
    } else {
      // arr[mid] > target，继续在左半边找
      right = mid;
    }
  }

  return left; // 返回第一个 > target 的位置
}

/**
 * 变体3：查找旋转排序数组的最小值
 * LeetCode 153. 寻找旋转排序数组中的最小值
 */
function findMin(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] > nums[right]) {
      // 最小值在右半边
      left = mid + 1;
    } else {
      // nums[mid] <= nums[right]，最小值在左半边或就是 mid
      right = mid;
    }
  }

  return nums[left];
}

/**
 * 变体4：搜索旋转排序数组
 * LeetCode 33. 搜索旋转排序数组
 */
function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // 判断哪半边是有序的
    if (nums[left] <= nums[mid]) {
      // 左半边有序
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1; // 目标在左半边
      } else {
        left = mid + 1;   // 目标在右半边
      }
    } else {
      // 右半边有序
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;   // 目标在右半边
      } else {
        right = mid - 1;  // 目标在左半边
      }
    }
  }

  return -1;
}

// 测试
console.log(lowerBound([1, 2, 2, 2, 3], 2));  // 输出: 2
console.log(upperBound([1, 2, 2, 2, 3], 2)); // 输出: 4
console.log(findMin([3, 4, 5, 1, 2]));        // 输出: 1
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 输出: 4
```

---

## 三、归并排序

### 3.1 算法原理

```
归并排序的递归过程：

原数组: [38, 27, 43, 3, 9, 82, 10]

第1层分：
  [38, 27, 43, 3]  |  [9, 82, 10]
       ↓ 分               ↓ 分
  [38, 27]  [43, 3]    [9, 82]  [10]
       ↓ 分               ↓ 分
  [38] [27] [43] [3]   [9] [82]  [10]
       ↓ 合               ↓ 合
  [27, 38]  [3, 43]    [9, 82]  [10]
       ↓                 ↓
      [3, 27, 38, 43]    [9, 10, 82]
              ↓ 合
      [3, 9, 10, 27, 38, 43, 82]

排序完成！
```

### 3.2 代码实现

```typescript
/**
 * 归并排序（分治算法经典应用）
 *
 * 时间复杂度: O(n log n)
 *   - 分：O(log n) 层
 *   - 合：每层 O(n)
 *   - 总计：O(n log n)
 *
 * 空间复杂度: O(n) - 需要额外的数组存储合并结果
 */
function mergeSort(arr: number[]): number[] {
  // 1. 基准情形：数组长度 <= 1，已经有序
  if (arr.length <= 1) {
    return arr;
  }

  // 2. 分：将数组从中间分成两半
  const mid = Math.floor(arr.length / 2);
  const leftHalf = arr.slice(0, mid);
  const rightHalf = arr.slice(mid);

  // 3. 治：递归排序左右两半
  const sortedLeft = mergeSort(leftHalf);
  const sortedRight = mergeSort(rightHalf);

  // 4. 合：合并两个有序数组
  return mergeTwoSortedArrays(sortedLeft, sortedRight);
}

/**
 * 合并两个有序数组
 *
 * @param left 左有序数组
 * @param right 右有序数组
 * @returns 合并后的有序数组
 */
function mergeTwoSortedArrays(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // 1. 比较两数组元素，按从小到大放入结果数组
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] <= right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  // 2. 将剩余元素直接加入结果数组
  // 下面的两个 while 只会执行其中一个
  while (leftIndex < left.length) {
    result.push(left[leftIndex]);
    leftIndex++;
  }

  while (rightIndex < right.length) {
    result.push(right[rightIndex]);
    rightIndex++;
  }

  return result;
}

// 测试
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));
// 输出: [3, 9, 10, 27, 38, 43, 82]
```

### 3.3 归并排序的优化

```typescript
/**
 * 归并排序（原地合并版本）
 * 减少空间开销，但代码更复杂
 */

/**
 * 归并排序求逆序对
 * LeetCode 剑指 Offer 51. 数组中的逆序对
 *
 * 思路：在合并过程中计算逆序对
 * - 当 left[i] > right[j] 时，
 * - left[i..end] 与 right[j] 构成逆序对
 * - 数量 = left 数组剩余元素个数
 */
function reversePairs(nums: number[]): number {
  let count = 0;
  const temp = new Array(nums.length).fill(0);

  /**
   * 归并排序 + 逆序对计数
   */
  function mergeSortCount(nums: number[], left: number, right: number): void {
    if (left >= right) return;

    const mid = left + Math.floor((right - left) / 2);

    // 递归排序左右两半
    mergeSortCount(nums, left, mid);
    mergeSortCount(nums, mid + 1, right);

    // 合并两个有序子数组
    merge(nums, left, mid, right);
  }

  function merge(nums: number[], left: number, mid: number, right: number): void {
    let i = left;      // 左数组指针
    let j = mid + 1;   // 右数组指针
    let k = left;      // 结果数组指针

    while (i <= mid && j <= right) {
      if (nums[i] <= nums[j]) {
        temp[k++] = nums[i++];
      } else {
        // nums[i] > nums[j]，构成逆序对
        // 因为 left...mid 是有序的，所以 nums[i..mid] 都与 nums[j] 构成逆序对
        count += mid - i + 1;
        temp[k++] = nums[j++];
      }
    }

    while (i <= mid) {
      temp[k++] = nums[i++];
    }

    while (j <= right) {
      temp[k++] = nums[j++];
    }

    // 将排序后的结果复制回原数组
    for (let p = left; p <= right; p++) {
      nums[p] = temp[p];
    }
  }

  if (nums.length === 0) return 0;
  mergeSortCount(nums, 0, nums.length - 1);
  return count;
}

// 测试
console.log(reversePairs([7, 5, 6, 4]));
// 输出: 5
// 解释：逆序对有 (7,5), (7,6), (7,4), (5,4), (6,4)
```

---

## 四、快速排序

### 4.1 算法原理

```
快速排序的分区过程：

原数组: [6, 3, 7, 2, 8, 1]
选择基准: 6（通常选第一个或最后一个）

分区过程（从小到大排序）：
  1. 从右边找到第一个小于 6 的数：1
     交换: [6, 3, 7, 2, 1, 8]

  2. 从左边找到第一个大于 6 的数：7
     交换: [1, 3, 7, 2, 6, 8]

  3. 继续从右边找：2
     交换: [1, 3, 2, 7, 6, 8]

  4. 从左边找：3
     交换: [1, 2, 3, 7, 6, 8]

  5. 基准归位：i == j
     最终: [1, 2, 3, 7, 6, 8]
          分界点 index = 2

递归排序左右两部分：
  [1, 2, 3] 和 [7, 6, 8]
```

### 4.2 代码实现

```typescript
/**
 * 快速排序（分治算法经典应用）
 *
 * 时间复杂度:
 *   - 最好/平均: O(n log n)
 *   - 最坏: O(n²)（数组已经有序）
 *
 * 空间复杂度: O(log n) - 递归栈深度
 */
function quickSort(arr: number[], left = 0, right = arr.length - 1): number[] {
  // 基准情形：子数组长度 <= 1
  if (left >= right) {
    return arr;
  }

  // 分区：返回基准元素的最终位置
  const pivotIndex = partition(arr, left, right);

  // 递归排序基准左右两边的子数组
  quickSort(arr, left, pivotIndex - 1);  // 左半部分
  quickSort(arr, pivotIndex + 1, right); // 右半部分

  return arr;
}

/**
 * 分区函数（单边循环法 / Lomuto 分区）
 *
 * @param arr 待分区数组
 * @param left 左边界
 * @param right 右边界（通常选最后一个元素作为基准）
 * @returns 基准元素的最终索引
 */
function partition(arr: number[], left: number, right: number): number {
  const pivot = arr[right]; // 选择最后一个元素作为基准
  let i = left;            // i 是小于基准区域的边界

  // 遍历 [left, right-1] 的元素
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      // arr[j] 小于基准，交换到左边
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  // 将基准元素放到中间位置
  [arr[i], arr[right]] = [arr[right], arr[i]];

  return i; // 返回基准元素的位置
}

/**
 * 分区函数（双边循环法 / Hoare 分区）
 * 效率通常更高
 */
function partitionHoare(arr: number[], left: number, right: number): number {
  const pivot = arr[left]; // 选择第一个元素作为基准
  let i = left - 1;
  let j = right + 1;

  while (true) {
    // 从左边找到第一个 >= 基准的元素
    do {
      i++;
    } while (arr[i] < pivot);

    // 从右边找到第一个 <= 基准的元素
    do {
      j--;
    } while (arr[j] > pivot);

    // 如果 i >= j，分区完成
    if (i >= j) {
      return j;
    }

    // 交换 arr[i] 和 arr[j]
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// 测试
console.log(quickSort([6, 3, 7, 2, 8, 1]));
// 输出: [1, 2, 3, 6, 7, 8]
```

### 4.3 快速排序的优化

```typescript
/**
 * 快速排序优化：随机基准 + 三数取中
 *
 * 问题：当数组接近有序时，最坏情况 O(n²)
 * 解决：随机选择基准，或使用三数取中法
 */
function quickSortOptimized(arr: number[]): number[] {
  function sort(left: number, right: number): void {
    if (left >= right) return;

    // 优化1：三数取中法选择基准
    const mid = left + Math.floor((right - left) / 2);

    // 让 arr[mid] 成为中间值，并放到 right-1 的位置
    if (arr[left] > arr[right]) {
      [arr[left], arr[right]] = [arr[right], arr[left]];
    }
    if (arr[mid] > arr[right]) {
      [arr[mid], arr[right]] = [arr[right], arr[mid]];
    }
    if (arr[left] > arr[mid]) {
      [arr[left], arr[mid]] = [arr[mid], arr[left]];
    }

    // 此时 arr[right] 是中间大小的元素
    const pivot = arr[right];

    // 分区（使用单边循环法）
    let i = left;
    for (let j = left; j < right; j++) {
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[right]] = [arr[right], arr[i]];

    // 递归排序
    sort(left, i - 1);
    sort(i + 1, right);
  }

  sort(0, arr.length - 1);
  return arr;
}

/**
 * 快速排序求第 K 大的元素
 * LeetCode 215. 数组中的第 K 个最大元素
 *
 * 利用快速排序的分区思想，平均 O(n) 可解决
 */
function findKthLargest(nums: number[], k: number): number {
  const target = nums.length - k; // 第 k 大 = 第 n-k+1 小

  function quickSelect(left: number, right: number): number {
    const pivot = arr[right];
    let i = left;

    for (let j = left; j < right; j++) {
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[right]] = [arr[right], arr[i]];

    if (i === target) {
      return arr[i];
    } else if (i < target) {
      return quickSelect(i + 1, right);
    } else {
      return quickSelect(left, i - 1);
    }
  }

  const arr = [...nums]; // 复制数组
  return quickSelect(0, arr.length - 1);
}

// 测试
console.log(findKthLargest([3, 2, 1, 5, 6, 4], 2)); // 输出: 5（第二大的数）
```

---

## 五、大整数乘法（Karatsuba 算法）

### 5.1 问题背景

传统乘法的时间复杂度是 O(n²)，当数字位数达到几千时，效率很低。Karatsuba 算法通过分治将乘法的时间复杂度降低到 O(n^log₂³) ≈ O(n^1.585)。

### 5.2 算法原理

```
Karatsuba 算法示例：计算 1234 × 5678

设 x = 1234, y = 5678
取 n = 4（较大者）

将 x 和 y 分解：
  x = a × 10² + b = 12 × 100 + 34   (a=12, b=34)
  y = c × 10² + d = 56 × 100 + 57   (c=56, d=57)

传统方法需要 4 次乘法：
  ac = 12 × 56 = 672
  bd = 34 × 57 = 1938
  ad = 12 × 57 = 684
  bc = 34 × 56 = 1904
  结果 = ac × 10⁴ + (ad+bc) × 10² + bd

Karatsuba 只需要 3 次乘法：
  1. z₀ = a × c = 12 × 56 = 672
  2. z₂ = b × d = 34 × 57 = 1938
  3. z₁ = (a+b) × (c+d) - z₀ - z₂
       = 46 × 113 - 672 - 1938
       = 5198 - 672 - 1938
       = 2588

  结果 = z₂ × 10⁴ + z₁ × 10² + z₀
       = 1938 × 10000 + 2588 × 100 + 672
       = 19380000 + 258800 + 672
       = 7004672 ✓
```

### 5.3 代码实现

```typescript
/**
 * Karatsuba 大整数乘法
 *
 * 时间复杂度: O(n^log₂³) ≈ O(n^1.585)
 * 空间复杂度: O(n)
 */
function karatsuba(x: string | number, y: string | number): number {
  // 转换为字符串，便于处理
  const s1 = String(x);
  const s2 = String(y);

  // 递归终止条件：数字很小（一位数相乘）
  if (s1.length === 1 || s2.length === 1) {
    return parseInt(s1) * parseInt(s2);
  }

  // 确保 s1 长度不小于 s2
  let a = s1;
  let b = s2;
  if (a.length < b.length) {
    [a, b] = [b, a];
  }

  const n = a.length;
  const half = Math.floor(n / 2);

  // 分解：a = a1 × 10^half + a0, b = b1 × 10^half + b0
  const a1 = a.slice(0, a.length - half);
  const a0 = a.slice(a.length - half);
  const b1 = b.slice(0, Math.max(0, b.length - half));
  const b0 = b.slice(Math.max(0, b.length - half));

  // Karatsuba 三步走
  const z0 = karatsuba(a0, b0);                           // a0 × b0
  const z2 = karatsuba(a1, b1);                           // a1 × b1
  const z1 = karatsuba(
    String(parseInt(a0) + parseInt(a1)),
    String(parseInt(b0) + parseInt(b1))
  ) - z2 - z0;                                             // (a0+a1)(b0+b1) - z2 - z0

  // 合并结果：z2 × 10^(2×half) + z1 × 10^half + z0
  const result = z2 * Math.pow(10, 2 * half) + z1 * Math.pow(10, half) + z0;

  return result;
}

// 测试
console.log(karatsuba(1234, 5678));    // 输出: 7004672
console.log(karatsuba(12345678, 87654321)); // 输出: 1082152022374638
console.log(1234 * 5678);              // 对比: 7004672
console.log(12345678 * 87654321);      // 对比: 1082152022374638
```

---

## 六、LeetCode 经典题目

### 6.1 半数元素（LeetCode 169）

```typescript
/**
 * LeetCode 169. 多数元素
 *
 * 问题：给定一个大小为 n 的数组，找出其中出现次数 > n/2 的元素
 *
 * 方法1：分治
 * - 如果一个数出现次数超过一半，那么它一定是中位数
 * - 分治递归，最后验证
 *
 * 方法2： Boyer-Moore 投票算法（更优，O(n)）
 */
function majorityElement(nums: number[]): number {
  /**
   * Boyer-Moore 投票算法
   * 核心思想：不同元素两两抵消，最后剩下的就是众数
   */
  let candidate = nums[0]; // 候选众数
  let count = 1;           // 计数器

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === candidate) {
      count++; // 当前元素等于候选，计数 +1
    } else {
      count--; // 当前元素不等于候选，计数 -1
      if (count === 0) {
        // 计数归零，更换候选
        candidate = nums[i];
        count = 1;
      }
    }
  }

  return candidate;
}

/**
 * 分治解法
 */
function majorityElementDivideConquer(nums: number[], left: number, right: number): number {
  // 基准情形：只有一个元素
  if (left === right) {
    return nums[left];
  }

  // 分：递归到左右两半
  const mid = left + Math.floor((right - left) / 2);
  const leftMajority = majorityElementDivideConquer(nums, left, mid);
  const rightMajority = majorityElementDivideConquer(nums, mid + 1, right);

  // 合：合并结果
  if (leftMajority === rightMajority) {
    return leftMajority;
  }

  // 否则统计两个候选的出现次数
  let leftCount = 0;
  let rightCount = 0;

  for (let i = left; i <= right; i++) {
    if (nums[i] === leftMajority) leftCount++;
    if (nums[i] === rightMajority) rightCount++;
  }

  return leftCount > rightCount ? leftMajority : rightMajority;
}

// 测试
console.log(majorityElement([3, 2, 3])); // 输出: 3
console.log(majorityElement([2, 2, 1, 1, 1, 2, 2])); // 输出: 2
```

### 6.2 最大子数组和（LeetCode 53）

```typescript
/**
 * LeetCode 53. 最大子数组和
 *
 * 问题：找出连续子数组的最大和
 *
 * 方法1：分治
 * - 考虑最大子数组在左半边、右半边、或跨中点
 * - 跨中点的情况需要特殊处理
 *
 * 方法2：贪心/Kadane算法（更优，O(n)）
 */
function maxSubArray(nums: number[]): number {
  /**
   * 分治解法
   *
   * 最大子数组只有三种情况：
   * 1. 完全在左半边
   * 2. 完全在右半边
   * 3. 跨越中点（包含左半边尾部 + 右半边头部）
   */
  function divideConquer(left: number, right: number): number {
    // 基准情形：只有一个元素
    if (left === right) {
      return nums[left];
    }

    const mid = left + Math.floor((right - left) / 2);

    // 1. 递归计算左半边的最大子数组和
    const leftMax = divideConquer(left, mid);

    // 2. 递归计算右半边的最大子数组和
    const rightMax = divideConquer(mid + 1, right);

    // 3. 计算跨越中点的最大子数组和
    // 以 mid 为中心，向左扩展的最大值
    let leftSum = 0;
    let leftPartMax = nums[mid];
    for (let i = mid; i >= left; i--) {
      leftSum += nums[i];
      leftPartMax = Math.max(leftPartMax, leftSum);
    }

    // 以 mid+1 为中心，向右扩展的最大值
    let rightSum = 0;
    let rightPartMax = nums[mid + 1];
    for (let i = mid + 1; i <= right; i++) {
      rightSum += nums[i];
      rightPartMax = Math.max(rightPartMax, rightSum);
    }

    const crossMax = leftPartMax + rightPartMax;

    // 返回三种情况的最大值
    return Math.max(leftMax, rightMax, crossMax);
  }

  return divideConquer(0, nums.length - 1);
}

/**
 * Kadane 算法（贪心）
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 */
function maxSubArrayKadane(nums: number[]): number {
  let maxSum = nums[0];      // 全局最大和
  let currentSum = nums[0];  // 以当前元素结尾的最大和

  for (let i = 1; i < nums.length; i++) {
    // 当前元素要么加入之前的子数组，要么重新开始
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

// 测试
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 输出: 6
console.log(maxSubArrayKadane([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 输出: 6
```

---

## 七、复杂度分析

| 算法 | 时间复杂度 | 空间复杂度 | 关键特征 |
|------|-----------|-----------|----------|
| 二分查找 | O(log n) | O(1) | 有序数据 |
| 归并排序 | O(n log n) | O(n) | 稳定排序 |
| 快速排序 | O(n log n) ~ O(n²) | O(log n) | 原址排序 |
| Karatsuba | O(n^log₂³) | O(n) | 大整数乘法 |
| 最大子数组 | O(n log n) | O(log n) | 分治求跨中点 |

---

## 八、本章小结

本章我们学习了分治算法：

1. **核心思想**：分而治之，将大问题分解为小问题，递归解决后合并
2. **三个必要条件**：
   - 子问题相互独立
   - 子问题与原问题结构相同
   - 子问题可合并

3. **经典应用**：
   - 二分查找：O(log n) 有序查找
   - 归并排序：稳定排序，O(n log n)
   - 快速排序：原地排序，O(n log n) 平均
   - Karatsuba：大整数乘法优化

4. **LeetCode 题目**：
   - 二分查找及其变体
   - 多数元素
   - 最大子数组和

5. **分治 vs 其他算法**：
   - 贪心：分治可能需要全局最优，分治只需子问题最优
   - 动态规划：分治的子问题不重复，DP 存在重叠子问题

---

**上一篇**：[02_贪心算法_Greedy.md](./02_贪心算法_Greedy.md)
**下一篇**：[04_动态规划_Dynamic_Programming.md](./04_动态规划_Dynamic_Programming.md)
