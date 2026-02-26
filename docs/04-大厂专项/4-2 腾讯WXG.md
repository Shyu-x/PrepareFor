# 腾讯 WXG (微信事业群) 笔试代码实战

---

## 一、异步任务链式调度 (HardMan)
**题目**：微信内部经典面试题。实现一个 `HardMan` 函数。

```javascript
// 实现目标:
// HardMan("jack") 
// -> I am jack
// HardMan("jack").rest(10).learn("computer") 
// -> I am jack -> (Wait 10s) -> Start learning after 10 seconds -> I am learning computer

function HardMan(name) {
  const queue = [];
  
  const next = () => {
    const task = queue.shift();
    if (task) task();
  };

  queue.push(() => {
    console.log(`I am ${name}`);
    next();
  });

  const obj = {
    rest(time) {
      // 注意: rest 需要插入到当前队列的前面还是后面取决于执行顺序
      // 这里实现为按顺序执行
      queue.push(() => {
        setTimeout(() => {
          console.log(`Start learning after ${time} seconds`);
          next();
        }, time * 1000);
      });
      return obj;
    },
    learn(subject) {
      queue.push(() => {
        console.log(`I am learning ${subject}`);
        next();
      });
      return obj;
    },
    // 支持 restFirst 这种插队操作 (WXG 变种题)
    restFirst(time) {
      queue.unshift(() => {
        setTimeout(() => {
          console.log(`Wait first for ${time}s`);
          next();
        }, time * 1000);
      });
      return obj;
    }
  };

  // 关键: 利用事件循环，在同步代码执行完后再开始执行队列
  setTimeout(next, 0);
  
  return obj;
}
```

---

## 二、DOM 节点深度与广度遍历
**题目**：给定一个 DOM 根节点，找到所有包含指定文本的节点。

```javascript
// BFS 广度优先搜索
function findNodesByText(root, searchText) {
  const queue = [root];
  const result = [];
  while (queue.length) {
    const node = queue.shift();
    if (node.textContent.includes(searchText) && node.children.length === 0) {
      result.push(node);
    }
    queue.push(...node.children);
  }
  return result;
}
```
