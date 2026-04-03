# AJAX设计模式与异步编程

## 前言：从"排队等餐"到"叫号系统"

想象你去一家很火的餐厅吃饭。

**老式做法（同步阻塞）**：你站在收银台前，一直等着，直到拿到你的餐才能离开。后面排队的人都得等你。如果前面的人点的东西需要做很久，大家就一起干等着。

**AJAX的做法（异步非阻塞）**：你拿到一个号码，可以去座位上玩手机了。厨师做完会叫号，你听到号码再去取餐。后面的人也能继续排队点餐，大家互不耽误。

这就是AJAX（Asynchronous JavaScript and XML）的核心思想——**不等，先去干别的事**。

本章我们将学习AJAX的设计模式，包括Promise的基础、回调地狱的解决方案、以及async/await的优雅异步编程。

---

## 第一部分：为什么需要异步？

### 1.1 同步vs异步：两种不同的等待方式

```javascript
// 同步代码：一步一步执行，必须等前一个完成才能执行下一个
// 想象成：洗衣服 -> 晾衣服 -> 收衣服 -> 叠衣服（必须按顺序）

console.log('第一步：把衣服放进洗衣机');
console.log('第二步：等洗衣机洗完（需要30分钟）');
console.log('第三步：把衣服晾起来');
console.log('第四步：收衣服');
console.log('第五步：叠衣服');

// 问题：如果洗衣服的时候你想去打游戏？没门！得等着

// ========== 异步代码：发起任务后可以先去做别的事 ==========
// 想象成：把衣服扔进洗衣机，然后去打游戏，洗衣机洗好了会通知你

console.log('第一步：把衣服放进洗衣机');

// 异步：发起请求，不等待结果，继续往下走
setTimeout(() => {
  console.log('洗衣机洗好了！'); // 这个是后面才执行的
}, 3000); // 假设洗衣服要3秒

console.log('第二步：去打游戏'); // 这行会立即执行，不会等洗衣机
console.log('第三步：看了一会儿电视');
console.log('第四步：又刷了一会儿手机');

// 输出顺序：
// 第一步：把衣服放进洗衣机
// 第二步：去打游戏
// 第三步：看了一会儿电视
// 第四步：又刷了一会儿手机
// （等待3秒后）
// 洗衣机洗好了！
```

### 1.2 AJAX的异步场景

在Web开发中，网络请求是最典型的异步场景：

```javascript
// 同步请求（千万别这么做！）
// 浏览器会被卡住，用户体验极差
function syncRequest() {
  console.log('开始请求...');
  const result = blockingNetworkCall(); // 这个会卡住浏览器3秒
  console.log('收到响应:', result);
  return result;
}

// 异步请求（正确做法）
// 用户可以继续操作，收到响应后回调通知我们
function asyncRequest() {
  console.log('开始请求...');

  // 发起异步请求
  fetch('/api/data').then(response => {
    console.log('收到响应:', response); // 这个在收到数据后才会执行
  });

  console.log('请求已发出去了，我去干别的！'); // 这行会立即执行
}
```

---

## 第二部分：回调函数：异步编程的起点

### 2.1 回调函数基础

**回调函数**就像"留个纸条"：你告诉服务员，如果我点的菜好了，就打这个电话通知我。

```javascript
/**
 * 模拟一个异步的数据请求
 * @param {number} id 要获取的用户ID
 * @param {Function} callback 回调函数，当数据准备好时调用
 */
function getUserById(id, callback) {
  // 模拟网络延迟（1秒后返回数据）
  setTimeout(() => {
    const user = {
      id: id,
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com'
    };

    // 调用回调函数，把数据传回去
    callback(null, user); // 第一个参数是错误，第二个是数据（Node.js风格）
  }, 1000);
}

// 使用回调函数
console.log('开始获取用户...');

getUserById(123, (error, user) => {
  if (error) {
    console.error('出错了:', error);
    return;
  }

  console.log('收到用户数据:', user);
});

console.log('我去干别的事...');

// 输出顺序：
// 开始获取用户...
// 我去干别的事...
// （等待1秒）
// 收到用户数据: {id: 123, name: "张三", age: 25, email: "zhangsan@example.com"}
```

### 2.2 回调函数的错误处理

回调函数有多种错误处理模式：

```javascript
// 模式1：Node.js风格（错误优先的回调）
// 这是Node.js社区最常用的模式
function readFile(filename, callback) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      callback(err, null); // 错误在前
      return;
    }
    callback(null, data); // 成功时错误为null
  });
}

readFile('package.json', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 模式2：只传递错误
function fetchData(url, onSuccess, onError) {
  fetch(url)
    .then(response => onSuccess(response))
    .catch(error => onError(error));
}

fetchData(
  '/api/users',
  (data) => console.log('成功:', data),      // 成功回调
  (error) => console.error('失败:', error)   // 错误回调
);

// 模式3：只有一个回调，通过参数判断成功/失败
function getUser(id, callback) {
  if (!id) {
    callback({ message: 'ID不能为空' }, null);
    return;
  }

  // 模拟成功
  callback(null, { id, name: '张三' });
}

getUser(123, (error, user) => {
  if (error) {
    console.error('错误:', error.message);
    return;
  }
  console.log('用户:', user);
});
```

### 2.3 回调地狱：回调嵌套的灾难

当有多个异步操作需要按顺序执行时，回调函数会变成这样：

```javascript
// ❌ 回调地狱：代码像过山车一样，嵌套层数越来越多

// 场景：获取用户 -> 获取用户的文章 -> 获取文章的评论
getUserById(123, (error1, user) => {
  if (error1) {
    console.error('获取用户失败:', error1);
    return;
  }
  console.log('用户:', user);

  getUserPosts(user.id, (error2, posts) => {
    if (error2) {
      console.error('获取文章失败:', error2);
      return;
    }
    console.log('文章列表:', posts);

    if (posts.length === 0) {
      console.log('用户没有文章');
      return;
    }

    getPostComments(posts[0].id, (error3, comments) => {
      if (error3) {
        console.error('获取评论失败:', error3);
        return;
      }
      console.log('文章评论:', comments);

      // 等等，还要获取评论的作者信息？
      getCommentAuthors(comments, (error4, authors) => {
        if (error4) {
          console.error('获取作者失败:', error4);
          return;
        }
        console.log('评论作者:', authors);

        // 还要获取每个作者的头像URL？
        // ...
        // 这代码没法看了！！！
      });
    });
  });
});

// 问题：
// 1. 代码嵌套层数多，难以阅读
// 2. 错误处理要重复很多遍
// 3. 很难进行错误追踪和调试
// 4. 无法使用try/catch
// 5. 代码耦合严重，修改一个地方可能影响其他地方
```

---

## 第三部分：Promise：异步编程的救星

### 3.1 Promise是什么？

**Promise（承诺）**就像点餐时拿到的"取餐叫号器"：

- 你下了订单，拿到了一个叫号器（Promise对象）
- 你不用站在柜台前等着，可以去干别的事
- 当食物准备好时，叫号器会震动/响铃通知你
- 你可以拿着叫号器去取餐（处理成功结果）
- 如果出了问题（比如食材用完了），叫号器会显示错误（处理失败结果）

```javascript
// Promise的三种状态
// 1. Pending（等待中）：初始状态，就像刚下完订单
// 2. Fulfilled（已成功）：食物做好了，可以去取了
// 3. Rejected（已失败）：出问题了，订单取消了

// 创建一个Promise
const promise = new Promise((resolve, reject) => {
  // executor函数：立即执行，通常在这里做异步操作

  console.log('Promise创建了，开始执行异步任务...');

  // 模拟异步操作（1秒后完成）
  setTimeout(() => {
    const success = true; // 模拟是否成功

    if (success) {
      // 成功：调用resolve，传入结果
      resolve({ id: 1, name: '张三' });
    } else {
      // 失败：调用reject，传入错误原因
      reject(new Error('网络错误'));
    }
  }, 1000);
});

// 使用Promise
console.log('拿到了叫号器，可以去干别的了...');

promise
  .then(result => {
    // 处理成功结果
    console.log('食物好了！', result);
  })
  .catch(error => {
    // 处理错误
    console.error('出问题了:', error);
  });

console.log('继续玩游戏...');

// 输出顺序：
// Promise创建了，开始执行异步任务...
// 拿到了叫号器，可以去干别的了...
// 继续玩游戏...
// （等待1秒）
// 食物好了！ {id: 1, name: "张三"}
```

### 3.2 Promise的静态方法

```javascript
// ========== Promise.resolve() / Promise.reject() ==========
// 快速创建一个已成功的/已失败的Promise

const successPromise = Promise.resolve('操作成功');
// 等同于
const successPromise2 = new Promise(resolve => resolve('操作成功'));

const errorPromise = Promise.reject(new Error('操作失败'));
// 等同于
const errorPromise2 = new Promise((resolve, reject) => reject(new Error('操作失败')));

// 用途：把一个值转成Promise
function getUser(id) {
  if (id < 0) {
    // 返回一个失败的Promise
    return Promise.reject(new Error('ID不能为负数'));
  }

  // 返回一个成功的Promise
  return Promise.resolve({ id, name: '用户' + id });
}

// ========== Promise.all() - 等待所有Promise都完成 ==========
// 想象成：点了多个菜，要等所有菜都做好了才能一起上桌

const promise1 = fetch('/api/user');
const promise2 = fetch('/api/config');
const promise3 = fetch('/api/permissions');

Promise.all([promise1, promise2, promise3])
  .then(([user, config, permissions]) => {
    // 三个请求都成功了
    console.log('用户:', user);
    console.log('配置:', config);
    console.log('权限:', permissions);
    return initializeApp(user, config, permissions);
  })
  .catch(error => {
    // 任何一个请求失败都会进入这里
    console.error('初始化失败:', error);
  });

// ========== Promise.allSettled() - 不管成功失败，等所有Promise都结束 ==========
// 想象成：每个菜不管做没做成功，最终都会从厨房出来

const promises = [
  fetch('/api/user'),
  fetch('/api/nonexistent'), // 这个会失败
  fetch('/api/config')
];

Promise.allSettled(promises).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`请求${index}成功:`, result.value);
    } else {
      console.log(`请求${index}失败:`, result.reason);
    }
  });
});

// ========== Promise.race() - 返回最先完成的那个Promise ==========
// 想象成：多个渠道同时抢答，谁先答上来就用谁的

const timeoutPromise = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error('请求超时')), 5000);
});

const requestPromise = fetch('/api/some-data');

Promise.race([requestPromise, timeoutPromise])
  .then(result => console.log('收到响应:', result))
  .catch(error => console.error('失败了:', error));

// ========== Promise.any() - 返回第一个成功的Promise ==========
// 忽略失败的，只要有任何一个成功就返回

const promises2 = [
  fetch('/api/cdn-1/data'),
  fetch('/api/cdn-2/data'),
  fetch('/api/cdn-3/data')
];

Promise.any(promises2)
  .then(result => console.log('最快的成功了:', result))
  .catch(error => console.error('全都失败了:', error));
```

### 3.3 用Promise解决回调地狱

```javascript
// ✅ 用Promise重构：告别回调地狱，代码变平了

// 定义三个异步函数，返回Promise
function getUserById(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: '张三', age: 25 });
      } else {
        reject(new Error('用户ID无效'));
      }
    }, 500);
  });
}

function getUserPosts(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([
        { id: 1, title: '第一篇文章', userId },
        { id: 2, title: '第二篇文章', userId }
      ]);
    }, 500);
  });
}

function getPostComments(postId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([
        { id: 1, content: '写得好！', postId },
        { id: 2, content: '学到了', postId }
      ]);
    }, 500);
  });
}

// 按顺序执行：像读故事一样从上往下看
getUserById(123)
  .then(user => {
    console.log('获取到用户:', user);
    return getUserPosts(user.id); // 返回Promise，继续链式调用
  })
  .then(posts => {
    console.log('获取到文章:', posts);
    return getPostComments(posts[0].id); // 返回Promise，继续链式调用
  })
  .then(comments => {
    console.log('获取到评论:', comments);
    // 最后一个then，不需要再返回Promise了
  })
  .catch(error => {
    // 任何一个步骤出错都会被捕获
    console.error('出错了:', error);
  })
  .finally(() => {
    // 不管成功还是失败，都会执行这个
    console.log('流程结束');
  });

// 代码结构：
// - 从左到右阅读，像阅读同步代码一样
// - 嵌套层级变浅了
// - 错误处理只需要一个catch
```

---

## 第四部分：async/await：让异步代码看起来像同步

### 4.1 async/await基础

**async/await**是Promise的语法糖，它让异步代码看起来像同步代码。就像：
- **Promise**：打电话时要一直说"等一下...等一下...好了好了"
- **async/await**：约好了明天10点见面，到时候直接去就行，不用一直打电话确认

```javascript
// ========== async函数 ==========
// async关键字让一个函数返回Promise

async function getUser(id) {
  // 函数内部可以使用await
  return { id, name: '张三' }; // 自动包装成Promise
}

// 等同于
function getUser2(id) {
  return Promise.resolve({ id, name: '张三' });
}

// 使用async函数
getUser(1).then(user => console.log(user));

// ========== await关键字 ==========
// await等待一个Promise完成，并返回它的结果

async function fetchUser() {
  // await会等待这个Promise完成，才继续往下执行
  const response = await fetch('/api/user/1');
  const user = await response.json();
  return user;
}

// 传统的Promise写法
function fetchUserOld() {
  return fetch('/api/user/1')
    .then(response => response.json());
}

// ========== async/await的威力 ==========

// 传统Promise写法
function getUserWithPostsAndComments(userId) {
  return getUserById(userId)
    .then(user => {
      console.log('用户:', user);
      return getUserPosts(user.id);
    })
    .then(posts => {
      console.log('文章:', posts);
      return getPostComments(posts[0].id);
    })
    .then(comments => {
      console.log('评论:', comments);
      return comments;
    })
    .catch(error => {
      console.error('错误:', error);
    });
}

// async/await写法 - 像读同步代码一样
async function getUserWithPostsAndCommentsAsync(userId) {
  try {
    // Step 1: 获取用户
    const user = await getUserById(userId);
    console.log('用户:', user);

    // Step 2: 获取用户的文章
    const posts = await getUserPosts(user.id);
    console.log('文章:', posts);

    // Step 3: 获取第一篇文章的评论
    const comments = await getPostComments(posts[0].id);
    console.log('评论:', comments);

    return comments;
  } catch (error) {
    // 错误处理像同步代码一样直观
    console.error('错误:', error);
    throw error;
  }
}

// 调用async函数
getUserWithPostsAndCommentsAsync(123);
```

### 4.2 await的并发执行

注意：连续的await是**串行执行**的，如果它们之间没有依赖，应该并发执行：

```javascript
// ❌ 错误：串行执行，浪费时间
async function loadDataWrong() {
  const start = Date.now();

  // 这三个请求没有依赖关系，但被串行执行了
  const user = await getUser(1);     // 等待1秒
  const config = await getConfig();   // 再等1秒
  const stats = await getStats();     // 再等1秒
  // 总共3秒

  console.log(`耗时: ${Date.now() - start}ms`);
}

// ✅ 正确：并发执行，同时开始
async function loadDataCorrect() {
  const start = Date.now();

  // 同时发起三个请求
  const [user, config, stats] = await Promise.all([
    getUser(1),
    getConfig(),
    getStats()
  ]);
  // 总共1秒

  console.log(`耗时: ${Date.now() - start}ms`);
  return { user, config, stats };
}

// 另一个常见的错误场景
async function getUserDashboard(userId) {
  const user = await getUser(userId);

  // ❌ 错误：profile和settings都依赖user，但被串行执行
  const profile = await getUserProfile(userId);
  const settings = await getUserSettings(userId);

  // ✅ 正确：它们都只依赖userId，可以并行
  const [profile, settings] = await Promise.all([
    getUserProfile(userId),
    getUserSettings(userId)
  ]);

  return { user, profile, settings };
}
```

### 4.3 async/await的错误处理

```javascript
// ========== try/catch：最推荐的写法 ==========

async function fetchUserData(userId) {
  try {
    // 可能失败的代码放这里
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      // 服务器返回错误状态码
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const user = await response.json();
    return user;

  } catch (error) {
    // 捕获fetch错误、网络错误、JSON解析错误、业务逻辑错误
    console.error('获取用户数据失败:', error);

    if (error.message.includes('404')) {
      return null; // 用户不存在
    }

    throw error; // 重新抛出，让调用者处理
  }
}

// ========== Promise的.catch()和async/await配合 ==========

// 方式1：调用者处理错误
async function main() {
  try {
    const user = await fetchUserData(123);
    console.log('用户:', user);
  } catch (error) {
    console.error('处理错误:', error);
  }
}

// 方式2：被调用的函数自己处理
async function fetchUserDataSafe(userId) {
  const response = await fetch(`/api/users/${userId}`)
    .catch(error => {
      console.error('网络错误:', error);
      return null; // 返回null表示请求失败
    });

  if (!response || !response.ok) {
    return null;
  }

  return response.json();
}

// ========== 多个await的错误处理 ==========

async function complexOperation() {
  let user, posts, comments;

  try {
    user = await getUser(1);
  } catch (error) {
    console.error('获取用户失败:', error);
    user = { name: '匿名用户', id: 0 }; // 使用默认值
  }

  try {
    posts = await getUserPosts(user.id);
  } catch (error) {
    console.error('获取文章失败:', error);
    posts = []; // 使用默认值
  }

  try {
    comments = await getPostComments(posts[0]?.id || 0);
  } catch (error) {
    console.error('获取评论失败:', error);
    comments = [];
  }

  return { user, posts, comments };
}
```

---

## 第五部分：实际项目中的AJAX封装

### 5.1 基于Promise的AJAX工具函数

```javascript
/**
 * 实际项目中的AJAX封装
 * 把XHR包装成Promise形式，方便使用async/await
 */

/**
 * 发送HTTP请求的核心函数
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function ajax(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      headers = {},
      data = null,
      timeout = 30000,
      withCredentials = false
    } = options;

    // 1. 创建XHR对象
    const xhr = new XMLHttpRequest();

    // 2. 打开连接
    xhr.open(method, url, true);

    // 3. 设置超时
    xhr.timeout = timeout;

    // 4. 设置跨域cookie
    xhr.withCredentials = withCredentials;

    // 5. 设置请求头
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 6. 设置响应类型
    xhr.responseType = 'json';

    // 7. 监听事件
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 成功
        resolve({
          data: xhr.response,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders())
        });
      } else {
        // 服务器错误
        reject(createError(xhr, 'Server Error'));
      }
    };

    xhr.onerror = function() {
      reject(createError(xhr, 'Network Error'));
    };

    xhr.ontimeout = function() {
      reject(createError(xhr, 'Timeout'));
    };

    xhr.onabort = function() {
      reject(createError(xhr, 'Aborted'));
    };

    // 8. 发送数据
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        // FormData不需要设置Content-Type
        xhr.send(data);
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      }
    } else {
      xhr.send();
    }
  });
}

/**
 * 创建错误对象
 */
function createError(xhr, type) {
  return {
    type,
    message: `${type}: ${xhr.status || 'No response'}`,
    status: xhr.status,
    statusText: xhr.statusText,
    response: xhr.response
  };
}

/**
 * 解析响应头
 */
function parseHeaders(headerString) {
  const headers = {};
  if (!headerString) return headers;

  headerString.trim().split('\r\n').forEach(line => {
    const [key, ...valueParts] = line.split(': ');
    headers[key.toLowerCase()] = valueParts.join(': ');
  });

  return headers;
}

// ========== 便捷方法 ==========

const http = {
  get(url, options = {}) {
    return ajax({ url, method: 'GET', ...options });
  },

  post(url, data, options = {}) {
    return ajax({ url, method: 'POST', data, ...options });
  },

  put(url, data, options = {}) {
    return ajax({ url, method: 'PUT', data, ...options });
  },

  patch(url, data, options = {}) {
    return ajax({ url, method: 'PATCH', data, ...options });
  },

  delete(url, options = {}) {
    return ajax({ url, method: 'DELETE', ...options });
  }
};
```

### 5.2 API模块化封装

```javascript
/**
 * 实际项目中的API模块化封装
 * 每个业务模块有自己的API接口
 */

// ========== 用户模块API ==========
const userApi = {
  /**
   * 获取用户信息
   * @param {number} userId 用户ID
   */
  async getUser(userId) {
    const response = await http.get(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * 获取当前登录用户
   */
  async getCurrentUser() {
    const response = await http.get('/api/users/me');
    return response.data;
  },

  /**
   * 更新用户信息
   * @param {number} userId 用户ID
   * @param {Object} userData 要更新的数据
   */
  async updateUser(userId, userData) {
    const response = await http.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  /**
   * 上传用户头像
   * @param {number} userId 用户ID
   * @param {File} file 头像文件
   * @param {Function} onProgress 上传进度回调
   */
  async uploadAvatar(userId, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', `/api/users/${userId}/avatar`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));

      const formData = new FormData();
      formData.append('avatar', file);

      xhr.send(formData);
    });
  },

  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  async login(username, password) {
    const response = await http.post('/api/auth/login', {
      username,
      password
    });
    return response.data;
  },

  /**
   * 用户登出
   */
  async logout() {
    const response = await http.post('/api/auth/logout');
    return response.data;
  }
};

// ========== 文档模块API ==========
const documentApi = {
  /**
   * 获取文档列表
   * @param {Object} params 查询参数
   */
  async getDocuments(params = {}) {
    const response = await http.get('/api/documents', { params });
    return response.data;
  },

  /**
   * 获取单个文档
   * @param {string} docId 文档ID
   */
  async getDocument(docId) {
    const response = await http.get(`/api/documents/${docId}`);
    return response.data;
  },

  /**
   * 创建文档
   * @param {Object} docData 文档数据
   */
  async createDocument(docData) {
    const response = await http.post('/api/documents', docData);
    return response.data;
  },

  /**
   * 更新文档
   * @param {string} docId 文档ID
   * @param {Object} docData 文档数据
   */
  async updateDocument(docId, docData) {
    const response = await http.put(`/api/documents/${docId}`, docData);
    return response.data;
  },

  /**
   * 删除文档
   * @param {string} docId 文档ID
   */
  async deleteDocument(docId) {
    const response = await http.delete(`/api/documents/${docId}`);
    return response.data;
  },

  /**
   * 分享文档
   * @param {string} docId 文档ID
   * @param {Object} shareOptions 分享选项
   */
  async shareDocument(docId, shareOptions) {
    const response = await http.post(`/api/documents/${docId}/share`, shareOptions);
    return response.data;
  }
};

// ========== 项目模块API ==========
const projectApi = {
  /**
   * 获取项目列表
   */
  async getProjects() {
    const response = await http.get('/api/projects');
    return response.data;
  },

  /**
   * 获取项目详情
   * @param {string} projectId 项目ID
   */
  async getProject(projectId) {
    const response = await http.get(`/api/projects/${projectId}`);
    return response.data;
  },

  /**
   * 创建项目
   * @param {Object} projectData 项目数据
   */
  async createProject(projectData) {
    const response = await http.post('/api/projects', projectData);
    return response.data;
  },

  /**
   * 更新项目
   * @param {string} projectId 项目ID
   * @param {Object} projectData 项目数据
   */
  async updateProject(projectId, projectData) {
    const response = await http.put(`/api/projects/${projectId}`, projectData);
    return response.data;
  },

  /**
   * 删除项目
   * @param {string} projectId 项目ID
   */
  async deleteProject(projectId) {
    const response = await http.delete(`/api/projects/${projectId}`);
    return response.data;
  },

  /**
   * 获取项目成员
   * @param {string} projectId 项目ID
   */
  async getProjectMembers(projectId) {
    const response = await http.get(`/api/projects/${projectId}/members`);
    return response.data;
  },

  /**
   * 添加项目成员
   * @param {string} projectId 项目ID
   * @param {string} userId 用户ID
   * @param {string} role 角色
   */
  async addProjectMember(projectId, userId, role = 'member') {
    const response = await http.post(`/api/projects/${projectId}/members`, {
      userId,
      role
    });
    return response.data;
  }
};
```

### 5.3 实际业务场景示例

```javascript
/**
 * 实际业务场景：用户登录并获取完整信息
 */

// 场景：用户登录 -> 获取用户信息 -> 获取权限 -> 获取最近项目
async function initializeAppAfterLogin() {
  try {
    // Step 1: 登录
    const loginResult = await userApi.login('username', 'password');
    console.log('登录成功:', loginResult);

    // 保存token
    localStorage.setItem('token', loginResult.token);

    // Step 2: 获取用户信息
    const user = await userApi.getCurrentUser();
    console.log('用户信息:', user);

    // Step 3: 获取权限（可以并发，因为不依赖前面的结果）
    const [permissions, recentProjects] = await Promise.all([
      http.get('/api/permissions'),
      http.get('/api/projects/recent')
    ]);

    console.log('权限:', permissions.data);
    console.log('最近项目:', recentProjects.data);

    // Step 4: 组装完整用户数据
    const userData = {
      ...user,
      permissions: permissions.data,
      recentProjects: recentProjects.data
    };

    return userData;

  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  }
}

/**
 * 实际业务场景：批量导入用户
 */
async function importUsers(userList) {
  const results = {
    success: [],
    failed: []
  };

  // 使用Promise.all并发处理，但限制并发数
  const batchSize = 5; // 每批5个

  for (let i = 0; i < userList.length; i += batchSize) {
    const batch = userList.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(userData => userApi.createUser(userData))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.success.push(result.value);
      } else {
        results.failed.push({
          userData: batch[index],
          error: result.reason
        });
      }
    });

    console.log(`处理进度: ${Math.min(i + batchSize, userList.length)}/${userList.length}`);
  }

  return results;
}

/**
 * 实际业务场景：搜索并过滤
 */
async function searchDocuments(query, filters = {}) {
  try {
    // 构建查询参数
    const params = {
      q: query, // 搜索关键词
      ...filters
    };

    // 发起搜索请求
    const response = await http.get('/api/documents/search', { params });

    // 对返回结果进行前端过滤
    let results = response.data.documents || [];

    // 如果有分类过滤
    if (filters.category) {
      results = results.filter(doc => doc.category === filters.category);
    }

    // 如果有日期范围过滤
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      results = results.filter(doc => {
        const created = new Date(doc.createdAt);
        return created >= start && created <= end;
      });
    }

    // 排序
    if (filters.sortBy) {
      results.sort((a, b) => {
        if (filters.sortOrder === 'desc') {
          return b[filters.sortBy] - a[filters.sortBy];
        }
        return a[filters.sortBy] - b[filters.sortBy];
      });
    }

    return {
      total: response.data.total,
      documents: results,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20
    };

  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }
}
```

---

## 第六部分：常见问题与最佳实践

### 6.1 Promise的常见错误

```javascript
// ❌ 错误1：忘记return Promise
async function wrong() {
  getUser(1).then(user => {
    console.log(user); // 只打印了，但没有返回
  });
  return 'done'; // 这会立即返回，user还没拿到
}

// ✅ 正确
async function correct() {
  const user = await getUser(1);
  console.log(user);
  return 'done';
}

// ❌ 错误2：在非async函数中使用await
function wrong2() {
  const user = await getUser(1); // 语法错误！
}

// ✅ 正确：外层函数也要是async
async function correct2() {
  const user = await getUser(1);
  return user;
}

// ❌ 错误3：吞掉了错误
async function wrong3() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    // 什么都没做，错误消失了
  }
}

// ✅ 正确：至少要记录或重新抛出
async function correct3() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('操作失败:', error);
    throw error;
  }
}

// ❌ 错误4：串行执行可以并行的await
async function wrong4() {
  const a = await getA(); // 等待1秒
  const b = await getB(); // 再等1秒
  const c = await getC(); // 再等1秒
  // 总共3秒
}

// ✅ 正确：使用Promise.all并发
async function correct4() {
  const [a, b, c] = await Promise.all([getA(), getB(), getC()]);
  // 总共1秒
}
```

### 6.2 性能优化技巧

```javascript
// ========== 技巧1：缓存Promise避免重复请求 ==========

// 创建一个缓存用的Map
const promiseCache = new Map();

async function getUserWithCache(userId) {
  // 如果已经有这个用户的Promise，直接返回
  if (promiseCache.has(userId)) {
    console.log('命中缓存:', userId);
    return promiseCache.get(userId);
  }

  // 创建新的Promise并存入缓存
  const promise = getUser(userId).finally(() => {
    // 数据拿到后，可以选择清除缓存（可选）
    // promiseCache.delete(userId);
  });

  promiseCache.set(userId, promise);
  return promise;
}

// ========== 技巧2：请求取消（使用AbortController）==========
// 这在用户频繁切换选项时很有用

function createCancellableFetch(url) {
  const controller = new AbortController();

  const promise = fetch(url, {
    signal: controller.signal
  }).then(response => response.json());

  return {
    promise,
    cancel: () => controller.abort()
  };
}

// 使用
async function search(query) {
  // 取消之前的请求
  if (currentSearch) {
    currentSearch.cancel();
  }

  currentSearch = createCancellableFetch(`/api/search?q=${query}`);

  try {
    const results = await currentSearch.promise;
    console.log('搜索结果:', results);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('请求被取消了');
    } else {
      throw error;
    }
  }
}

// ========== 技巧3：请求重试 ==========

async function fetchWithRetry(url, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = () => true
  } = options;

  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
      console.log(`第${i + 1}次尝试失败，${retryDelay}ms后重试...`);

      if (i < maxRetries - 1 && retryCondition(error)) {
        await sleep(retryDelay);
        retryDelay *= 2; // 指数退避
      }
    }
  }

  throw lastError;
}

// 辅助函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用
const data = await fetchWithRetry('/api/data', {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => error.message.includes('network')
});
```

### 6.3 内存泄漏防护

```javascript
// ========== 常见内存泄漏场景 ==========

// ❌ 场景1：未清理的定时器
function startPolling() {
  setInterval(async () => {
    const data = await fetchData();
    updateUI(data);
  }, 5000);
  // 组件卸载时没有clearInterval，导致内存泄漏
}

// ✅ 正确做法：保存定时器ID，清理时清除
let pollingTimer = null;

function startPolling() {
  pollingTimer = setInterval(async () => {
    const data = await fetchData();
    updateUI(data);
  }, 5000);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// React useEffect cleanup
useEffect(() => {
  startPolling();
  return () => stopPolling(); // 组件卸载时清理
}, []);

// ❌ 场景2：未取消的请求
function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
    // 组件卸载时请求可能还在进行，导致内存泄漏
  }, []);

  // ...
}

// ✅ 正确做法：使用AbortController取消请求
function ComponentFixed() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => controller.abort(); // 组件卸载时取消请求
  }, []);

  // ...
}
```

---

## 总结：AJAX设计模式的核心思想

1. **回调函数**：最初的异步解决方案，但容易导致回调地狱
2. **Promise**：让异步代码更可读，支持链式调用和错误处理
3. **async/await**：Promise的语法糖，让异步代码看起来像同步代码

**最佳实践**：
- 优先使用async/await，代码更易读
- 注意await的并发问题，没有依赖的请求要并行
- 做好错误处理，使用try/catch或.catch()
- 注意内存泄漏，及时清理定时器和取消请求
- 使用Promise.all等静态方法处理并发场景

---

## 附录：Promise/A+规范要点

Promise/A+是一个社区规范，定义了Promise的标准行为：

1. **三种状态**：pending、fulfilled、rejected，只能从pending转换到其他状态，且不可逆
2. **then方法**：必须返回一个Promise，支持链式调用
3. **错误处理**：同步错误应该被捕获并转换为reject
4. **Promise解决过程**：确定一个Promise的值，并递归处理

---

**作者**：WebEnv-OS 教学组
**最后更新**：2026年4月
