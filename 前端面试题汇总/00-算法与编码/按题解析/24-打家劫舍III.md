# 24 打家劫舍III

二叉树版本

## 24.1 打家劫舍 III（LeetCode 337）

```javascript
function rob(root) {
    function dfs(node) {
        if (!node) return [0, 0];  // [不偷，偷]

        const left = dfs(node.left);
        const right = dfs(node.right);

        // 不偷当前节点：取子节点的最大值
        const notRob = Math.max(left[0], left[1]) +
                       Math.max(right[0], right[1]);

        // 偷当前节点：子节点不能偷
        const rob = node.val + left[0] + right[0];

        return [notRob, rob];
    }

    return Math.max(...dfs(root));
}
```

---

## 24.2 思路分析

- 每个节点有两种状态：偷或不偷
- 如果不偷当前节点，可以偷左右子树
- 如果偷当前节点，不能偷左右子树
- 返回 [不偷能获得的最大值，偷能获得的最大值]
