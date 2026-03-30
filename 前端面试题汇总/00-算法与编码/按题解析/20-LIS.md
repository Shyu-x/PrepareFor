# 20 最长递增子序列

## 20.1 最长递增子序列（LeetCode 300）

```javascript
// O(n^2) 解法
function lengthOfLIS(nums) {
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

// O(n log n) 解法 - 二分优化
function lengthOfLISBinary(nums) {
    const piles = [];

    for (const num of nums) {
        let left = 0, right = piles.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (piles[mid] < num) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        if (left === piles.length) {
            piles.push(num);
        } else {
            piles[left] = num;
        }
    }
    return piles.length;
}
```

---

## 20.2 递增子序列（LeetCode 491）

```javascript
function findSubsequences(nums) {
    const result = new Set();
    const path = [];

    function backtrack(start) {
        if (path.length >= 2) {
            result.add(path.join(','));
        }

        const used = new Set();
        for (let i = start; i < nums.length; i++) {
            if (used.has(nums[i])) continue;
            if (path.length && nums[i] < path[path.length - 1]) continue;

            used.add(nums[i]);
            path.push(nums[i]);
            backtrack(i + 1);
            path.pop();
        }
    }
    backtrack(0);
    return Array.from(result).map(s => s.split(',').map(Number));
}
```

---

## 20.3 俄罗斯套娃信封（LeetCode 354）

```javascript
function maxEnvelopes(envelopes) {
    envelopes.sort((a, b) => {
        if (a[0] === b[0]) return b[1] - a[1];
        return a[0] - b[0];
    });

    const piles = [];
    for (const [w, h] of envelopes) {
        let left = 0, right = piles.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (piles[mid] < h) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        if (left === piles.length) {
            piles.push(h);
        } else {
            piles[left] = h;
        }
    }
    return piles.length;
}
```
