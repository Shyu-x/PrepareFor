# Axios 源码解析与实战应用

## 前言：Axios为什么这么火？

如果说XHR是"老式固定电话"，fetch是"智能手机"，那么Axios就是"智能手机+贴心的助理服务"。

智能手机（fetch）虽然比固定电话（XHR）好用了很多，但你还是要自己：
- 记住每个联系人的号码（URL）
- 自己处理通话中的各种异常情况
- 手动整理通话记录

而Axios就像一个贴心的助理，它帮你：
- 统一管理所有联系人的号码（API封装）
- 自动处理各种突发情况（错误处理）
- 整理通话记录并分类（响应拦截器）
- 帮你接电话转接给你（请求/响应转换）

本章我们就来深入了解Axios的设计哲学、核心原理，以及在实际项目中的最佳实践。

---

## 第一部分：Axios vs XHR vs Fetch

### 1.1 三种请求方式的对比

```javascript
// ========== XHR（老式固定电话）==========
// 需要手动管理一切，API混乱

const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/users', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
    console.log(data);
  }
};
xhr.send();

// ========== Fetch（智能手机）==========
// 比XHR好用，但还有些不便

fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 注意：fetch不抛网络错误，只有超时或断网才reject
// fetch不自动携带cookie
// fetch不支持请求取消（要用AbortController）

// ========== Axios（智能手机+助理）==========
// 更高级的抽象，使用更方便

// 基本用法
axios.get('/api/users')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// 自动JSON转换
// 自动错误处理
// 支持请求/响应拦截器
// 支持请求取消
// 支持超时设置
// 支持防止CSRF
```

### 1.2 为什么项目里推荐用Axios？

在我们WebEnv-OS和FastDocument项目中，Axios是首选的HTTP客户端，原因如下：

| 特性 | Axios | Fetch |
|-----|-------|-------|
| JSON自动转换 | ✅ | ❌ 需要手动.json() |
| 请求/响应拦截器 | ✅ | ❌ |
| 请求取消 | ✅ CancellationToken | ❌ AbortController（不友好） |
| 自动CSR F防护 | ✅ | ❌ |
| 进度监控 | ✅ | 有限 |
| 浏览器兼容性 | ✅ | 需要polyfill |
| 测试支持 | ✅（Mock请求） | ❌ |
| 默认配置 | ✅ | ❌ |

---

## 第二部分：Axios的核心API

### 2.1 基本用法

```javascript
// ========== 各种HTTP方法 ==========

// GET请求 - 获取数据
axios.get('/api/users')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// 带参数
axios.get('/api/users', {
  params: { page: 1, pageSize: 10 }
});

// POST请求 - 提交数据
axios.post('/api/users', {
  name: '张三',
  email: 'zhangsan@example.com'
});

// PUT请求 - 更新数据（全量）
axios.put('/api/users/123', {
  name: '张三',
  email: 'zhangsan@example.com',
  age: 26
});

// PATCH请求 - 更新数据（部分）
axios.patch('/api/users/123', {
  age: 26
});

// DELETE请求 - 删除数据
axios.delete('/api/users/123');

// ========== 响应对象结构 ==========
axios.get('/api/users/1').then(response => {
  // data: 服务器返回的数据（自动JSON转换后）
  console.log(response.data);

  // status: HTTP状态码
  console.log(response.status); // 200

  // statusText: 状态文字
  console.log(response.statusText); // "OK"

  // headers: 响应头
  console.log(response.headers['content-type']); // "application/json"

  // config: 请求配置（包含原始配置信息）
  console.log(response.config);

  // request: XMLHttpRequest对象
  console.log(response.request);
});
```

### 2.2 请求配置

```javascript
// axios发送请求时的完整配置
const response = await axios({
  method: 'post',           // 请求方法
  url: '/api/users',        // 请求地址
  baseURL: 'https://api.example.com', // 基础URL
  transformRequest: [       // 请求数据转换器（发送前）
    function(data, headers) {
      // 可以在这里修改data或headers
      return JSON.stringify(data);
    }
  ],
  transformResponse: [      // 响应数据转换器（收到后）
    function(data) {
      // 可以在这里修改data
      return JSON.parse(data);
    }
  ],
  headers: {                // 自定义请求头
    'X-Custom-Header': 'custom-value'
  },
  params: {                 // URL查询参数（自动拼接到URL）
    page: 1,
    pageSize: 10
  },
  paramsSerializer: {        // 参数序列化函数
    serialize: (params) => $.param(params) // jQuery方式
  },
  data: {                   // 请求体数据
    name: '张三'
  },
  timeout: 5000,            // 超时时间（毫秒），默认0表示不超时
  withCredentials: false,   // 是否跨域携带cookie
  responseType: 'json',     // 响应类型: json, text, blob, document, arraybuffer
  responseEncoding: 'utf8',  // 响应编码
  xsrfCookieName: 'XSRF-TOKEN', // CSRF token的cookie名称
  xsrfHeaderName: 'X-XSRF-TOKEN', // CSRF token的header名称
  onUploadProgress: (progressEvent) => { // 上传进度回调
    console.log('上传进度:', progressEvent.loaded / progressEvent.total);
  },
  onDownloadProgress: (progressEvent) => { // 下载进度回调
    console.log('下载进度:', progressEvent.loaded / progressEvent.total);
  },
  maxContentLength: 2000000, // 响应内容最大长度
  validateStatus: (status) => { // 自定义状态码判断
    return status >= 200 && status < 300; // 默认逻辑
  },
  maxRedirects: 5,          // 最大重定向次数
  proxy: {                  // 代理配置
    host: '127.0.0.1',
    port: 9000,
    auth: {
      username: 'user',
      password: 'pass'
    }
  },
  cancelToken: new axios.CancelToken(cancel => { // 取消令牌
    // 可以通过调用cancel()取消请求
  })
});
```

---

## 第三部分：Axios拦截器详解

### 3.1 拦截器是什么？

**拦截器**就像一个邮件分拣中心：
- **请求拦截器**：信件寄出前，可以在分拣中心检查、修改、甚至拦截（比如验证用户身份）
- **响应拦截器**：信件收到后，可以在分拣中心检查、修改、甚至拦截再退回（比如token过期）

```javascript
// ========== 请求拦截器 ==========
// 请求发送之前，对请求进行最后的"检查"和"修改"

// 添加一个请求拦截器
const requestInterceptor = axios.interceptors.request.use(
  (config) => {
    // 在请求发送之前做什么
    console.log('请求拦截器：即将发送请求', config.url);

    // 常见的修改：
    // 1. 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. 添加时间戳防止缓存
    config.params = {
      ...config.params,
      _t: Date.now()
    };

    // 3. 显示loading
    showLoading();

    return config; // 重要：必须返回config，否则请求不会发送
  },
  (error) => {
    // 请求错误时的处理
    console.error('请求拦截器：错误', error);
    hideLoading();
    return Promise.reject(error);
  }
);

// ========== 响应拦截器 ==========
// 响应收到之后，对响应进行"检查"和"处理"

// 添加一个响应拦截器
const responseInterceptor = axios.interceptors.response.use(
  (response) => {
    // 对响应数据做什么
    console.log('响应拦截器：收到响应', response.config.url);

    // 隐藏loading
    hideLoading();

    // 可以在这里对数据进行处理
    // 比如把响应结构简化
    return response.data; // 直接返回data，调用者就不需要response.data了
  },
  (error) => {
    // 响应错误时的处理
    console.error('响应拦截器：错误', error);
    hideLoading();

    // 常见错误处理：
    // 1. 401错误 - token过期，需要重新登录
    if (error.response?.status === 401) {
      alert('登录已过期，请重新登录');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // 2. 403错误 - 没有权限
    if (error.response?.status === 403) {
      alert('您没有权限执行此操作');
    }

    // 3. 404错误 - 资源不存在
    if (error.response?.status === 404) {
      alert('请求的资源不存在');
    }

    // 4. 500错误 - 服务器错误
    if (error.response?.status >= 500) {
      alert('服务器开小差了，请稍后再试');
    }

    return Promise.reject(error);
  }
);

// ========== 移除拦截器 ==========
// 有时候需要移除拦截器（比如退出登录时）

// 移除单个拦截器
axios.interceptors.request.eject(requestInterceptor);
axios.interceptors.response.eject(responseInterceptor);

// 移除所有拦截器
axios.interceptors.request.clear();
axios.interceptors.response.clear();
```

### 3.2 拦截器在项目中的实际应用

```javascript
/**
 * 实际项目：完整的Axios实例配置
 */

import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  // 基础URL
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.webenv-os.com',

  // 超时时间
  timeout: 30000,

  // 默认请求头
  headers: {
    'Content-Type': 'application/json'
  }
});

// ========== 请求拦截器 ==========
apiClient.interceptors.request.use(
  (config) => {
    // 获取token
    const token = localStorage.getItem('webenv_token');

    // 如果有token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 开发环境下添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 请求: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// ========== 响应拦截器 ==========
apiClient.interceptors.response.use(
  // 成功回调
  (response) => {
    // 开发环境打印响应
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ 响应: ${response.config.url}`, response.data);
    }

    // 统一处理成功响应
    // 假设后端返回格式是 { code: 0, data: {...}, message: '' }
    const res = response.data;

    if (res.code !== 0) {
      // 业务错误
      console.warn('业务错误:', res.message);
      return Promise.reject(new Error(res.message || '未知错误'));
    }

    return res.data; // 直接返回data部分
  },
  // 错误回调
  async (error) => {
    // 开发环境打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ 响应错误: ${error.config?.url}`, error);
    }

    // 处理错误
    const originalRequest = error.config;

    // 情况1：网络错误
    if (!error.response) {
      console.error('网络错误，请检查您的网络连接');
      return Promise.reject(new Error('网络错误'));
    }

    // 情况2：服务器返回错误状态码
    const { status, data } = error.response;

    switch (status) {
      case 400:
        // 参数错误
        return Promise.reject(new Error(data.message || '参数错误'));

      case 401:
        // Token过期，需要刷新token
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // 尝试刷新token
            const newToken = await refreshToken();
            localStorage.setItem('webenv_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // 重试原请求
            return apiClient(originalRequest);
          } catch (refreshError) {
            // 刷新token失败，跳转登录
            localStorage.removeItem('webenv_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        break;

      case 403:
        // 没有权限
        return Promise.reject(new Error('没有权限'));

      case 404:
        // 资源不存在
        return Promise.reject(new Error('资源不存在'));

      case 500:
        // 服务器错误
        return Promise.reject(new Error('服务器错误'));

      default:
        return Promise.reject(new Error(data.message || '请求失败'));
    }

    return Promise.reject(error);
  }
);

// 导出配置好的axios实例
export default apiClient;
```

---

## 第四部分：Axios取消请求

### 4.1 取消请求的使用场景

取消请求在以下场景特别有用：
- 用户快速切换Tab或搜索关键词
- 表单提交后用户又点击了取消
- 组件卸载时还有进行中的请求

```javascript
// ========== 方式1：CancelToken（传统方式，已废弃但仍可用）==========
// 创建一个取消令牌
const cancelToken = axios.CancelToken;
const source = cancelToken.source();

// 发送请求时传入cancel token
axios.get('/api/users', {
  cancelToken: source.token
}).then(response => {
  console.log(response.data);
}).catch(error => {
  if (axios.isCancel(error)) {
    console.log('请求被取消了', error.message);
  } else {
    console.error('其他错误', error);
  }
});

// 取消请求
source.cancel('用户取消了操作');

// ========== 方式2：AbortController（推荐，现代API）==========
// 创建一个AbortController
const controller = new AbortController();

// 发送请求时传入signal
axios.get('/api/users', {
  signal: controller.signal
}).then(response => {
  console.log(response.data);
}).catch(error => {
  if (axios.isCancel(error)) {
    console.log('请求被取消了', error.message);
  } else {
    console.error('其他错误', error);
  }
});

// 取消请求
controller.abort('用户取消了操作');

// ========== 实际项目示例：搜索防抖 ==========
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 保存当前请求的AbortController
let currentSearchController = null;

/**
 * 搜索用户
 * 当用户快速输入时，会取消之前的请求，只保留最后一次
 */
async function searchUsers(keyword) {
  // 取消之前的请求
  if (currentSearchController) {
    currentSearchController.abort('取消旧请求');
  }

  // 创建新的AbortController
  currentSearchController = new AbortController();

  try {
    const response = await apiClient.get('/users/search', {
      params: { keyword },
      signal: currentSearchController.signal
    });

    console.log('搜索结果:', response.data);
    return response.data;

  } catch (error) {
    if (axios.isCancel(error)) {
      // 忽略取消错误
      console.log('搜索被取消');
    } else {
      console.error('搜索失败:', error);
      throw error;
    }
  } finally {
    // 清空引用
    currentSearchController = null;
  }
}

// 使用防抖
let debounceTimer = null;
function debouncedSearch(keyword) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    searchUsers(keyword);
  }, 300);
}
```

### 4.2 在React组件中使用取消请求

```javascript
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * 带取消功能的Hook
 * 用于在组件中发起数据请求，并在组件卸载时自动取消
 */
function useCancellableRequest() {
  // 使用useRef保存AbortController
  const abortControllerRef = useRef(null);

  // 发起请求的函数
  const sendRequest = async (config) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios({
        ...config,
        signal: abortControllerRef.current.signal
      });

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('请求被取消');
        return null;
      }
      throw error;
    }
  };

  // 取消当前请求
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 组件卸载时自动取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { sendRequest, cancelRequest };
}

// ========== 使用示例 ==========
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { sendRequest } = useCancellableRequest();

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);

      try {
        const data = await sendRequest({
          method: 'GET',
          url: `/api/users/${userId}`
        });

        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // 组件卸载或userId变化时，会自动取消之前的请求
  }, [userId, sendRequest]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!user) return <div>没有数据</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

---

## 第五部分：Axios批量请求

### 5.1 一次性发送多个请求

```javascript
// ========== axios.all - 并行处理多个请求 ==========
// 想象成：同时拨打多个电话，都接通后一起处理

// 定义两个请求
const getUserPromise = axios.get('/api/users/1');
const getConfigPromise = axios.get('/api/config');
const getPermissionsPromise = axios.get('/api/permissions');

// 同时发送这三个请求
const [user, config, permissions] = await axios.all([
  getUserPromise,
  getConfigPromise,
  getPermissionsPromise
]);

console.log('用户:', user.data);
console.log('配置:', config.data);
console.log('权限:', permissions.data);

// ========== Promise.all的增强版本 ==========
// axios.spread - 将结果数组展开为多个参数

axios.all([
  axios.get('/api/users/1'),
  axios.get('/api/config')
]).then(axios.spread((user, config) => {
  // user是第一个请求的响应
  // config是第二个请求的响应
  console.log('用户:', user.data);
  console.log('配置:', config.data);
}));

// ========== 实际应用场景 ==========

// 场景1：页面初始化时并行获取所有数据
async function initializeDashboard() {
  try {
    // 同时获取多个数据源
    const [user, projects, notifications, recentActivity] = await axios.all([
      axios.get('/api/users/me'),
      axios.get('/api/projects'),
      axios.get('/api/notifications'),
      axios.get('/api/activity/recent')
    ]);

    return {
      user: user.data,
      projects: projects.data,
      notifications: notifications.data,
      recentActivity: recentActivity.data
    };

  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  }
}

// 场景2：批量导入用户
async function batchImportUsers(userList) {
  // 创建所有请求
  const requests = userList.map(userData =>
    axios.post('/api/users', userData)
  );

  // 使用Promise.allSettled处理，即使部分失败也不影响其他
  const results = await axios.allSettled(requests);

  // 统计成功和失败
  const success = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success.push(result.value.data);
    } else {
      failed.push({
        userData: userList[index],
        error: result.reason.message
      });
    }
  });

  return { success, failed };
}

// 场景3：批量更新用户状态
async function batchUpdateStatus(userIds, newStatus) {
  const requests = userIds.map(userId =>
    axios.patch(`/api/users/${userId}`, { status: newStatus })
  );

  try {
    const results = await axios.all(requests);
    return {
      success: true,
      updated: results.map(r => r.data)
    };
  } catch (error) {
    // Promise.all会在任何一个失败时整体失败
    console.error('批量更新失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 5.2 请求池管理

```javascript
/**
 * 请求池管理：限制并发请求数量
 * 避免一次发太多请求导致浏览器卡顿或服务器压力过大
 */

class RequestPool {
  constructor(concurrency = 5) {
    this.concurrency = concurrency; // 最大并发数
    this.running = 0;              // 当前运行中的请求数
    this.queue = [];               // 等待队列
  }

  /**
   * 添加请求到池中
   * @param {Function} requestFn 返回Promise的函数
   * @returns {Promise}
   */
  add(requestFn) {
    return new Promise((resolve, reject) => {
      // 把请求和它的resolve/reject放入队列
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  /**
   * 处理队列
   */
  process() {
    // 如果队列为空或已达到并发上限，返回
    if (this.queue.length === 0 || this.running >= this.concurrency) {
      return;
    }

    // 取出一个请求
    const { requestFn, resolve, reject } = this.queue.shift();

    // 当前运行数+1
    this.running++;

    // 执行请求
    requestFn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        // 请求完成后，运行数-1，继续处理队列
        this.running--;
        this.process();
      });
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue.forEach(({ reject }) => {
      reject(new Error('请求池已清空'));
    });
    this.queue = [];
  }
}

// ========== 使用示例 ==========

// 创建一个最多同时5个请求的请求池
const requestPool = new RequestPool(5);

// 模拟发送请求的函数
function createRequest(id) {
  return axios.get(`/api/item/${id}`);
}

// 批量添加请求到池中
async function batchRequest(itemIds) {
  const promises = itemIds.map(id => requestPool.add(() => createRequest(id)));

  const results = await Promise.all(promises);
  return results.map(r => r.data);
}

// 假设有100个请求
const itemIds = Array.from({ length: 100 }, (_, i) => i + 1);
const results = await batchRequest(itemIds);
console.log('完成:', results.length, '个请求');
```

---

## 第六部分：Axios实例与配置

### 6.1 创建Axios实例

```javascript
// ========== 为什么需要创建实例？ ==========
// 想象成：不同的"名片"对应不同的联系人

// 默认实例（用于公共API）
const defaultClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

// 用户相关的API（需要登录token）
const authClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});
authClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 文件上传的API（超时时间更长）
const uploadClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 60000, // 上传可能需要更长时间
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// 内部API（不需要baseURL）
const internalClient = axios.create({
  timeout: 5000
});

// 导出
export { defaultClient, authClient, uploadClient, internalClient };

// ========== 在项目中的实际使用 ==========

// 创建API模块
const api = {
  // 用户相关
  user: {
    getProfile: (id) => authClient.get(`/users/${id}`),
    updateProfile: (id, data) => authClient.put(`/users/${id}`, data),
    uploadAvatar: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return uploadClient.post('/users/avatar', formData);
    }
  },

  // 文档相关
  document: {
    list: (params) => defaultClient.get('/documents', { params }),
    get: (id) => defaultClient.get(`/documents/${id}`),
    create: (data) => authClient.post('/documents', data),
    update: (id, data) => authClient.put(`/documents/${id}`, data),
    delete: (id) => authClient.delete(`/documents/${id}`)
  },

  // 项目相关
  project: {
    list: () => defaultClient.get('/projects'),
    get: (id) => defaultClient.get(`/projects/${id}`),
    create: (data) => authClient.post('/projects', data),
    members: {
      list: (projectId) => defaultClient.get(`/projects/${projectId}/members`),
      add: (projectId, userId) => authClient.post(`/projects/${projectId}/members`, { userId }),
      remove: (projectId, userId) => authClient.delete(`/projects/${projectId}/members/${userId}`)
    }
  }
};

// 使用
const users = await api.user.getProfile(123);
const docs = await api.document.list({ page: 1, pageSize: 20 });
```

### 6.2 默认配置

```javascript
// ========== 全局默认配置 ==========
// 设置后所有axios请求都会使用这些默认配置

axios.defaults.baseURL = 'https://api.example.com';
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');

// ========== 实例默认配置 ==========
// 只影响特定实例

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 可以随时修改实例的默认配置
apiClient.defaults.headers.common['Authorization'] = 'Bearer token';

// ========== 请求级配置 ==========
// 最高优先级，会覆盖默认配置

axios.get('/api/user', {
  timeout: 5000, // 这个请求5秒超时，而不是默认的10秒
  headers: { 'X-Custom': 'value' } // 额外的请求头
});
```

---

## 第七部分：Axios错误处理详解

### 7.1 错误类型判断

```javascript
// axios.isAxiosError - 判断是否是Axios错误
axios.get('/api/user')
  .catch(error => {
    if (axios.isAxiosError(error)) {
      // 这是一个Axios错误（请求已发出但服务器返回错误）
      console.error('Axios错误:', error.message);

      if (error.response) {
        // 服务器响应了，但状态码不是2xx
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        console.error('没有收到响应');
      } else {
        // 请求配置出错
        console.error('请求配置错误:', error.message);
      }
    } else {
      // 可能是原生JavaScript错误
      console.error('其他错误:', error);
    }
  });

// ========== 自定义错误类 ==========

class ApiError extends Error {
  constructor(message, code, status, data) {
    super(message);
    this.name = 'ApiError';
    this.code = code;     // 业务错误码
    this.status = status; // HTTP状态码
    this.data = data;     // 响应数据
  }
}

// 包装响应错误
function handleApiError(error) {
  if (error.response) {
    // 服务器返回错误
    const { status, data } = error.response;

    switch (status) {
      case 400:
        throw new ApiError(data.message || '参数错误', data.code, status, data);
      case 401:
        throw new ApiError('未授权', data.code, status, data);
      case 403:
        throw new ApiError('禁止访问', data.code, status, data);
      case 404:
        throw new ApiError('资源不存在', data.code, status, data);
      case 500:
        throw new ApiError('服务器错误', data.code, status, data);
      default:
        throw new ApiError('未知错误', data.code, status, data);
    }
  } else if (error.request) {
    // 没有收到响应
    throw new ApiError('网络错误', 'NETWORK_ERROR', 0, null);
  } else {
    // 请求配置错误
    throw new ApiError(error.message, 'CONFIG_ERROR', 0, null);
  }
}
```

### 7.2 统一的错误处理

```javascript
/**
 * 实际项目：统一的错误处理和提示
 */

import axios from 'axios';
import { message, notification } from 'ant-design-vue'; // UI组件库

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// 错误处理函数
const handleError = (error) => {
  // 网络错误
  if (!error.response) {
    notification.error({
      message: '网络错误',
      description: '请检查您的网络连接后重试'
    });
    return Promise.reject(error);
  }

  const { status, data } = error.response;

  // 业务错误
  if (data && data.code !== undefined && data.code !== 0) {
    notification.error({
      message: '操作失败',
      description: data.message || '未知错误'
    });
    return Promise.reject(error);
  }

  // HTTP错误
  switch (status) {
    case 400:
      notification.warning({
        message: '请求参数错误',
        description: data.message || '请检查输入是否正确'
      });
      break;

    case 401:
      notification.warning({
        message: '登录已过期',
        description: '请重新登录'
      });
      // 跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;

    case 403:
      notification.warning({
        message: '权限不足',
        description: '您没有权限执行此操作'
      });
      break;

    case 404:
      notification.warning({
        message: '未找到',
        description: data.message || '请求的资源不存在'
      });
      break;

    case 500:
      notification.error({
        message: '服务器错误',
        description: '服务器开小差了，请稍后再试'
      });
      break;

    default:
      notification.error({
        message: '请求失败',
        description: data.message || `错误码: ${status}`
      });
  }

  return Promise.reject(error);
};

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  handleError
);

// 使用示例
async function fetchUser(id) {
  const data = await apiClient.get(`/users/${id}`);
  return data;
}

// 使用时不需要再处理错误（已经在拦截器里处理了）
// 如果需要特殊处理，可以在调用时用try/catch
try {
  const user = await fetchUser(123);
  console.log(user);
} catch (error) {
  // 这里处理拦截器没有处理的错误
  console.error('特殊处理:', error);
}
```

---

## 第八部分：Axios源码核心解读

### 8.1 Axios的核心结构

虽然Axios源码比较复杂，但核心原理可以用下面的简化代码来理解：

```javascript
/**
 * 简化版的Axios实现
 * 帮助理解Axios的核心工作原理
 */

class Axios {
  constructor() {
    // 拦截器
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }

  /**
   * 发送请求的核心方法
   */
  async request(config) {
    // 1. 合并默认配置和传入的配置
    config = mergeConfig(this.defaults, config);

    // 2. 设置拦截器链
    const chain = [];

    // 先放入请求拦截器（后添加的先执行）
    this.interceptors.request.forEach(interceptor => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    // 放入核心请求方法
    chain.push(this.dispatchRequest.bind(this), null);

    // 最后放入响应拦截器（先添加的先执行）
    this.interceptors.response.forEach(interceptor => {
      chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    // 3. 创建一个Promise，从chain第一个开始执行
    let promise = Promise.resolve(config);

    // 4. 依次执行chain中的函数
    while (chain.length > 0) {
      const fulfilled = chain.shift();
      const rejected = chain.shift();
      promise = promise.then(fulfilled, rejected);
    }

    return promise;
  }

  /**
   * 执行实际的请求
   */
  async dispatchRequest(config) {
    // 适配不同的请求方式（XHR或HTTP）
    // 这里简化处理，只展示XHR方式
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(config.method, config.url, true);

      // 设置请求头
      Object.keys(config.headers).forEach(key => {
        xhr.setRequestHeader(key, config.headers[key]);
      });

      // 设置超时
      xhr.timeout = config.timeout;

      // 监听状态变化
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data: JSON.parse(xhr.responseText),
              status: xhr.status,
              statusText: xhr.statusText,
              headers: parseHeaders(xhr.getAllResponseHeaders()),
              config: config
            });
          } else {
            reject(createError(xhr, config));
          }
        }
      };

      // 错误处理
      xhr.onerror = () => reject(createError(xhr, config));

      // 发送请求
      xhr.send(config.data);
    });
  }
}

/**
 * 拦截器管理器
 */
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(fulfilled, rejected) {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1; // 返回拦截器ID
  }

  eject(id) {
    this.handlers[id] = null;
  }

  forEach(fn) {
    this.handlers.forEach(handler => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}
```

### 8.2 请求/响应转换器

```javascript
/**
 * Axios的转换器机制
 * 可以在请求发送前和响应收到后转换数据
 */

// 请求转换器示例
const apiClient = axios.create({
  // 请求数据转换器 - 发送前调用
  transformRequest: [
    function(data, headers) {
      // 如果data是普通对象，转成JSON字符串
      if (data && typeof data === 'object' && !(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        return JSON.stringify(data);
      }
      return data;
    }
  ],

  // 响应数据转换器 - 收到后调用
  transformResponse: [
    function(data) {
      // 如果响应是字符串，尝试转成JSON
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    }
  ]
);

// ========== 多转换器链 ==========
// 可以添加多个转换器，按顺序执行

const apiClient = axios.create({
  transformRequest: [
    // 第一个转换器
    function(data) {
      console.log('转换1:', data);
      return data;
    },
    // 第二个转换器
    function(data) {
      console.log('转换2:', data);
      return data;
    },
    // 第三个转换器（最终转换）
    function(data) {
      console.log('最终转换:', data);
      return JSON.stringify(data);
    }
  ]
});
```

---

## 第九部分：Axios最佳实践

### 9.1 项目结构组织

```javascript
/**
 * 实际项目：Axios的目录结构
 */

// 文件：/utils/http/index.js
// axios实例和默认配置

import axios from 'axios';
import { message } from 'ant-design-vue';

// 创建默认实例
const http = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 开发环境打印
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  response => {
    // 业务错误处理（假设后端返回 { code, data, message }）
    const res = response.data;

    if (res.code && res.code !== 0) {
      message.error(res.message || '操作失败');
      return Promise.reject(new Error(res.message || 'Error'));
    }

    return response.data;
  },
  error => {
    // HTTP错误处理
    const status = error.response?.status;

    if (status === 401) {
      message.error('登录已过期');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (status === 403) {
      message.error('没有权限');
    } else if (status === 404) {
      message.error('资源不存在');
    } else if (status >= 500) {
      message.error('服务器错误');
    } else if (!error.response) {
      message.error('网络错误');
    }

    return Promise.reject(error);
  }
);

export default http;
```

```javascript
// 文件：/api/modules/user.js
// 用户相关API

import http from '@/utils/http';

export const userApi = {
  // 获取用户信息
  getUser: (id) => http.get(`/users/${id}`),

  // 获取当前用户
  getCurrentUser: () => http.get('/users/me'),

  // 更新用户
  updateUser: (id, data) => http.put(`/users/${id}`, data),

  // 上传头像
  uploadAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return http.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress?.(percent);
        }
      }
    });
  },

  // 批量获取用户
  getUsers: (ids) => http.post('/users/batch', { ids })
};
```

```javascript
// 文件：/api/modules/document.js
// 文档相关API

import http from '@/utils/http';

export const documentApi = {
  // 获取文档列表
  getDocuments: (params) => http.get('/documents', { params }),

  // 获取单个文档
  getDocument: (id) => http.get(`/documents/${id}`),

  // 创建文档
  createDocument: (data) => http.post('/documents', data),

  // 更新文档
  updateDocument: (id, data) => http.patch(`/documents/${id}`, data),

  // 删除文档
  deleteDocument: (id) => http.delete(`/documents/${id}`),

  // 分享文档
  shareDocument: (id, options) => http.post(`/documents/${id}/share`, options)
};
```

```javascript
// 文件：/api/index.js
// API统一导出

export { userApi } from './modules/user';
export { documentApi } from './modules/document';
// ... 其他模块
```

### 9.2 常用配置模板

```javascript
// ========== 标准API调用模板 ==========

import axios from 'axios';

// 1. 创建实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. 请求拦截器
api.interceptors.request.use(config => {
  // 添加token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    // 统一错误处理
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ========== 文件上传模板 ==========

async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percent);
      }
    }
  });
}

// ========== 下载文件模板 ==========

async function downloadFile(url, filename) {
  const response = await api.get(url, {
    responseType: 'blob'
  });

  // 创建下载链接
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // 清理
  window.URL.revokeObjectURL(link.href);
}

// ========== 重试机制模板 ==========

async function fetchWithRetry(url, options = {}) {
  const { retries = 3, delay = 1000 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      return await api.get(url);
    } catch (error) {
      if (i === retries - 1) throw error;

      console.log(`重试 ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}
```

---

## 总结：Axios使用指南

1. **拦截器是Axios的灵魂**：善用请求/响应拦截器来处理通用逻辑
2. **创建实例管理不同场景**：用户API、文件上传、内部接口用不同实例
3. **统一错误处理**：在响应拦截器中处理错误，避免每个调用都要try/catch
4. **善用取消请求**：用户切换页面时要取消进行中的请求
5. **注意并发控制**：大量请求时使用请求池控制并发数

---

**作者**：WebEnv-OS 教学组
**最后更新**：2026年4月
