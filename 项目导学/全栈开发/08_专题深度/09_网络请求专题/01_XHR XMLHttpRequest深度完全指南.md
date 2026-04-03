# XHR XMLHttpRequest 深度完全指南

## 前言：让我们聊聊"老式电话"

想象一下，在上个世纪90年代，如果你想给朋友发一条消息，你需要拿起老式电话听筒，拨通对方的号码，然后对着话筒说："喂，我要找张三。"对方接听后，你们才能开始对话。如果对方不在，你得一直等着，直到他回来才能继续通话。

**XMLHttpRequest（简称XHR）就是这个"老式电话"**。

它诞生于1999年，是微软在IE5中首次引入的技术，后来被其他浏览器纷纷效仿，最终成为Web异步通信的基石。虽然现在看来它又老又笨重，但在那个年代，这可是革命性的发明——它让网页可以在不刷新整体的情况下，从服务器获取一小块数据。

本章我们将深入剖析这个"老式电话"的工作原理、状态机、各种事件、以及在现代项目中的正确打开方式。

---

## 第一部分：XHR到底是什么？

### 1.1 XHR的定义与历史背景

**XMLHttpRequest**是一种浏览器内置的API，它允许JavaScript在**不刷新整个页面的情况下**，向服务器发起HTTP请求并获取响应数据。

名字里的"XML"其实是个历史遗留——当年设计这个API的时候，XML正火得不行，所以名字就这么定了。但实际上，XHR完全不挑食，JSON、HTML、纯文本、图片、二进制……什么格式都能handle。

```javascript
// 最简单的XHR请求示例
// 想象成：拿起电话 -> 拨号 -> 等待接通 -> 通话 -> 挂断

// 1. 创建XHR对象（拿起电话）
const xhr = new XMLHttpRequest();

// 2. 初始化请求参数（拨号码）
xhr.open('GET', 'https://api.example.com/users', true);

// 3. 发送请求（按下拨号键）
xhr.send();

// 4. 监听响应（等待对方说话）
xhr.onreadystatechange = function() {
  // 当状态发生变化时，这个函数就会被调用
  if (xhr.readyState === 4 && xhr.status === 200) {
    // readyState 4 表示"通话结束，数据已就绪"
    // status 200 表示"对方说OK"
    console.log('收到数据：', xhr.responseText);
  }
};
```

### 1.2 为什么要深入理解XHR？

你可能会问："现在都什么年代了，谁还直接用XHR啊？axios、fetch不香吗？"

好问题！让我告诉你为什么还要学这个"老古董"：

1. **面试必备**：不管你用多高级的工具，底层原理永远是你和普通程序员的分水岭
2. **排查问题**：当axios或fetch出问题的时候，你需要知道往哪里debug
3. **兼容性好**：某些老旧环境可能只有XHR能用
4. **理解演进**：了解XHR，你才能理解为什么fetch会出现，为什么axios要那样设计

---

## 第二部分：XHR的状态机

### 2.1 readyState：通话进行到哪一步了？

XHR对象有一个`readyState`属性，它像一个进度条，告诉我们请求进行到哪一步了。这个属性有5个值（0到4），只能往前跳，不能往后走：

| readyState值 | 状态名称 | 通俗解释 |
|-------------|---------|---------|
| 0 | UNSENT | 电话还没拿起来（初始状态） |
| 1 | OPENED | 电话拿起来了，号码也拨了（open()已调用） |
| 2 | HEADERS_RECEIVED | 对方接电话了，我们能听到"喂"（响应头已接收） |
| 3 | LOADING | 对方正在说话，我们断断续续听到内容（正在下载数据） |
| 4 | DONE | 对方说完了，通话结束（请求完成） |

```javascript
// 形象地展示readyState的变化过程
const xhr = new XMLHttpRequest();

console.log('初始状态:', xhr.readyState); // 0: 还没拿起电话

xhr.open('GET', '/api/data', true);
console.log('open()调用后:', xhr.readyState); // 1: 电话拿起，号码拨出

xhr.send();

// 我们可以监听readystatechange事件来看状态变化
xhr.onreadystatechange = function() {
  switch(xhr.readyState) {
    case 0:
      console.log('电话还没拿起来...');
      break;
    case 1:
      console.log('正在拨号码...');
      break;
    case 2:
      console.log('对方接听了！我们能知道服务器说要返回什么数据了');
      // 这时候xhr.status和xhr.getAllResponseHeaders()就能用了
      console.log('状态码:', xhr.status);
      break;
    case 3:
      console.log('对方正在说话...');
      // 这时候我们可能已经能拿到部分数据了
      console.log('目前收到的内容:', xhr.responseText.substring(0, 100));
      break;
    case 4:
      console.log('通话结束！完整数据已收到');
      console.log('最终数据:', xhr.responseText);
      break;
  }
};
```

### 2.2 HTTP状态码：服务器的"方言"

光电话通了还不够，服务器会用**状态码**来告诉我们请求的结果。XHR的`status`属性就是这个状态码：

```javascript
// 常见HTTP状态码分类
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    const status = xhr.status;

    // 2xx - 成功系列
    if (status >= 200 && status < 300) {
      console.log('🎉 服务器说：一切正常，数据在里面');
    }

    // 3xx - 重定向系列
    if (status >= 300 && status < 400) {
      console.log('🔄 服务器说：你找错人了，去找另一个地址吧');
      console.log('新地址在这里:', xhr.getResponseHeader('Location'));
    }

    // 4xx - 客户端错误系列
    if (status === 400) {
      console.log('❌ 服务器说：你的请求有问题（语法错误）');
    }
    if (status === 401) {
      console.log('🔒 服务器说：你没登录，先去登录');
    }
    if (status === 403) {
      console.log('🚫 服务器说：你登录了但没权限');
    }
    if (status === 404) {
      console.log('😢 服务器说：你找的东西不存在');
    }

    // 5xx - 服务器错误系列
    if (status >= 500) {
      console.log('💥 服务器说：我这边出问题了，不是你的错');
    }
  }
};
```

**实际项目中常见的状态码场景**：

```javascript
// 在实际项目中的状态码处理示例
function handleXHRResponse(xhr) {
  // 确保请求完成
  if (xhr.readyState !== 4) return;

  // 根据状态码做不同处理
  switch (xhr.status) {
    case 200:
      // 成功，直接解析JSON
      return JSON.parse(xhr.responseText);

    case 201:
      // 创建成功（比如注册用户、发布文章）
      return JSON.parse(xhr.responseText);

    case 204:
      // 删除成功，没有返回内容
      return null;

    case 301:
    case 302:
      // 重定向
      const newUrl = xhr.getResponseHeader('Location');
      console.log('页面将重定向到:', newUrl);
      window.location.href = newUrl;
      break;

    case 400:
      // 请求参数错误
      const errorMsg = JSON.parse(xhr.responseText).message || '请求参数错误';
      throw new Error(errorMsg);

    case 401:
      // 未授权，跳转登录
      alert('登录已过期，请重新登录');
      window.location.href = '/login';
      break;

    case 403:
      alert('您没有权限访问该资源');
      break;

    case 404:
      alert('请求的资源不存在');
      break;

    case 500:
    case 502:
    case 503:
      alert('服务器开小差了，请稍后再试');
      break;

    default:
      console.log('未知状态码:', xhr.status);
  }
}
```

---

## 第三部分：XHR的事件系统

### 3.1 onreadystatechange：最常用的事件

这是XHR最核心的事件，当`readyState`发生变化时就会触发。在早期没有其他事件的时候，大家都用这个。

```javascript
// 最经典的写法
const xhr = new XMLHttpRequest();

xhr.open('GET', '/api/user/profile', true);

// 注意：open()调用之后、send()调用之前设置监听器
// 这样能确保我们不会错过任何状态变化
xhr.onreadystatechange = function() {
  // readyState 4 表示请求完成
  if (xhr.readyState === 4) {
    // status 200 表示成功
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      console.log('用户信息:', data);
    } else {
      console.error('请求失败，状态码:', xhr.status);
    }
  }
};

xhr.send();
```

### 3.2 onload、onerror、onabort：现代事件三剑客

现代浏览器（IE10+）支持更语义化的事件：

```javascript
// 现代写法：使用专门的回调
const xhr = new XMLHttpRequest();

xhr.open('GET', '/api/data', true);

// 请求成功完成（相当于 readyState===4 && status 2xx）
xhr.onload = function() {
  if (xhr.status >= 200 && xhr.status < 300) {
    console.log('成功:', JSON.parse(xhr.responseText));
  } else {
    console.error('服务器返回错误:', xhr.status, xhr.statusText);
  }
};

// 请求失败（网络断开、CORS错误等）
xhr.onerror = function() {
  console.error('网络错误，无法连接到服务器');
};

// 请求被取消（调用了xhr.abort()）
xhr.onabort = function() {
  console.log('请求被取消了');
};

// 请求超时（设置了timeout且超时）
xhr.ontimeout = function() {
  console.error('请求超时了');
};

xhr.send();
```

### 3.3 进度事件：监控上传下载进度

XHR还支持进度事件，这在上传文件、下载大文件时特别有用：

```javascript
// 模拟一个文件上传功能，实时显示进度
function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 配置POST请求，发送到文件上传接口
    xhr.open('POST', '/api/upload', true);

    // ========== 下载进度（服务器返回数据时）==========
    xhr.onprogress = function(event) {
      if (event.lengthComputable) {
        // event.loaded: 已接收的字节数
        // event.total: 总字节数
        const percent = Math.round((event.loaded / event.total) * 100);
        console.log(`下载进度: ${percent}%`);
        updateProgressBar(percent);
      }
    };

    // ========== 上传进度（发送数据时）==========
    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        console.log(`上传进度: ${percent}%`);
        updateUploadProgress(percent);
      }
    };

    // 上传完成
    xhr.upload.onload = function() {
      console.log('上传完成，等待服务器处理...');
    };

    // 请求完成（无论成功还是失败）
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`上传失败: ${xhr.status}`));
      }
    };

    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };

    // 创建FormData并添加文件
    const formData = new FormData();
    formData.append('file', file);

    // 发送请求
    xhr.send(formData);
  });
}

// 使用示例
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await uploadFile(file);
    console.log('上传成功:', result);
  } catch (error) {
    console.error('上传失败:', error);
  }
});
```

### 3.4 超时处理

```javascript
// 设置请求超时时间（单位：毫秒）
const xhr = new XMLHttpRequest();

xhr.open('GET', '/api/slow-request', true);

// 设置5秒超时
xhr.timeout = 5000;

xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      console.log('收到数据:', xhr.responseText);
    } else {
      console.error('请求失败:', xhr.status);
    }
  }
};

// 超时回调
xhr.ontimeout = function() {
  console.error('请求超时了！服务器响应太慢');
  // 可以在这里做重试逻辑
};

xhr.send();
```

---

## 第四部分：XHR的方法与属性

### 4.1 核心方法

```javascript
const xhr = new XMLHttpRequest();

// 【open()】初始化请求
// method: GET、POST、PUT、DELETE等
// url: 请求地址
// async: 是否异步（通常true）
xhr.open('POST', '/api/users', true);

// 【setRequestHeader()】设置请求头
// 必须在open()之后、send()之前调用
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Authorization', 'Bearer your-token-here');
xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

// 【send()】发送请求
// 请求体数据（GET请求通常传null）
xhr.send(JSON.stringify({ name: '张三', age: 25 }));

// 【abort()】取消请求
// 想象成：通话中突然挂断电话
xhr.abort();

// 【getResponseHeader()】获取指定的响应头
const contentType = xhr.getResponseHeader('Content-Type');
const server = xhr.getResponseHeader('X-Server');

// 【getAllResponseHeaders()】获取所有响应头
// 返回的是原始字符串，需要解析
const allHeaders = xhr.getAllResponseHeaders();
console.log(allHeaders);
// 输出类似：
// content-type: application/json; charset=utf-8
// x-powered-by: Express
// date: Thu, 01 Apr 2026 12:00:00 GMT
```

### 4.2 常用属性

```javascript
const xhr = new XMLHttpRequest();

xhr.open('GET', '/api/data', true);
xhr.send();

// 【responseText】响应体（字符串形式）
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    // 拿到的数据是字符串
    const text = xhr.responseText;
    console.log('响应文本:', text);
  }
};

// 【responseXML】响应体（XML DOM形式）
// 如果服务器返回的是XML，这个属性就有用
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const xml = xhr.responseXML;
    const name = xml.querySelector('name').textContent;
    console.log('XML中的name:', name);
  }
};

// 【responseType】指定响应类型
// 可选值: '' (默认文本), 'text', 'document', 'json', 'blob', 'arraybuffer'
xhr.responseType = 'json'; // 自动把响应转成JS对象

xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    // 不需要再手动JSON.parse了！
    console.log('自动解析的JSON:', xhr.response);
  }
};

// 【status】HTTP状态码
console.log(xhr.status); // 200, 404, 500等

// 【statusText】状态码的文字描述
console.log(xhr.statusText); // "OK", "Not Found", "Internal Server Error"

// 【timeout】超时时间（毫秒）
xhr.timeout = 10000;

// 【withCredentials】是否携带跨域 cookie
// 设为true时，浏览器会在跨域请求中携带cookies
xhr.withCredentials = true;
```

---

## 第五部分：GET和POST请求

### 5.1 GET请求：获取数据

GET请求像是"查询"，用于从服务器获取数据。参数会拼接在URL里。

```javascript
// 简单的GET请求
function getUserInfo(userId) {
  const xhr = new XMLHttpRequest();

  // 直接在URL里拼接参数
  xhr.open('GET', `/api/users/${userId}`, true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const user = JSON.parse(xhr.responseText);
      console.log('用户信息:', user);
    }
  };

  xhr.send();
}

// 带查询参数的GET请求
function searchUsers(keyword, page, pageSize) {
  const xhr = new XMLHttpRequest();

  // 构建查询字符串
  const params = new URLSearchParams({
    keyword: keyword,
    page: page,
    pageSize: pageSize
  });

  xhr.open('GET', `/api/users/search?${params.toString()}`, true);

  xhr.onload = function() {
    if (xhr.status === 200) {
      const result = JSON.parse(xhr.responseText);
      console.log('搜索结果:', result);
    }
  };

  xhr.send();
}

// 使用示例
getUserInfo(123);
searchUsers('张三', 1, 10);
```

### 5.2 POST请求：提交数据

POST请求像是"寄信"，用于向服务器提交数据。参数放在请求体里。

```javascript
// 简单的POST请求（提交JSON数据）
function createUser(userData) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', '/api/users', true);

  // 重要：设置Content-Type告诉服务器我们发送的是JSON
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function() {
    if (xhr.status === 201) { // 201表示"创建成功"
      const newUser = JSON.parse(xhr.responseText);
      console.log('创建的用户:', newUser);
    }
  };

  // 发送JSON数据
  xhr.send(JSON.stringify(userData));
}

// 使用示例
createUser({
  name: '李四',
  email: 'lisi@example.com',
  age: 28
});

// ========== 表单提交（application/x-www-form-urlencoded）==========
function submitLoginForm(username, password) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', '/api/login', true);

  // 设置传统的表单编码格式
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  xhr.onload = function() {
    if (xhr.status === 200) {
      const result = JSON.parse(xhr.responseText);
      console.log('登录结果:', result);
    }
  };

  // 格式：key1=value1&key2=value2
  xhr.send(`username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
}

// ========== 文件上传（multipart/form-data）==========
function uploadAvatar(file) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', '/api/upload/avatar', true);

  // multipart/form-data 不需要手动设置Content-Type
  // 浏览器会自动设置，并生成分界符
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

  xhr.onload = function() {
    if (xhr.status === 200) {
      console.log('上传成功:', xhr.responseText);
    }
  };

  // 使用FormData可以自动处理multipart格式
  const formData = new FormData();
  formData.append('avatar', file);

  xhr.send(formData);
}
```

---

## 第六部分：实际项目中的XHR封装

### 6.1 为什么要封装XHR？

直接用原生XHR写请求，就像每次打电话都要手动拨号码一样，效率太低：

```javascript
// ❌ 每次请求都要写一堆重复代码
const xhr1 = new XMLHttpRequest();
xhr1.open('GET', '/api/users/1', true);
xhr1.onload = function() { /* ... */ };
xhr1.send();

const xhr2 = new XMLHttpRequest();
xhr2.open('GET', '/api/users/2', true);
xhr2.onload = function() { /* ... */ };
xhr2.send();

// 封装后：简洁、复用、易维护
getUser(1).then(user => console.log(user));
getUser(2).then(user => console.log(user));
```

### 6.2 Promise化XHR

让我们把XHR包装成Promise，这样就能用async/await了：

```javascript
/**
 * XHR请求封装工具
 * 把"老式电话"包装成更现代的Promise形式
 */

/**
 * 发送XHR请求的核心函数
 * @param {Object} options 配置选项
 * @returns {Promise} 返回包含响应数据的Promise
 */
function xhrRequest(options) {
  // 返回一个新的Promise
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',      // HTTP方法，默认为GET
      url = '',            // 请求地址
      data = null,        // 请求体数据
      headers = {},        // 自定义请求头
      timeout = 30000,     // 超时时间，默认30秒
      withCredentials = false // 是否携带cookie
    } = options;

    // 1. 创建XHR对象
    const xhr = new XMLHttpRequest();

    // 2. 初始化请求
    xhr.open(method, url, true);

    // 3. 设置超时
    xhr.timeout = timeout;

    // 4. 设置跨域携带cookie
    xhr.withCredentials = withCredentials;

    // 5. 设置请求头
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });

    // 6. 设置响应类型（自动JSON解析）
    // 先判断是否已经设置了Content-Type
    if (!headers['Content-Type'] && !headers['content-type']) {
      // 默认使用JSON
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    // 7. 绑定事件处理
    xhr.onload = function() {
      // 请求完成
      if (xhr.status >= 200 && xhr.status < 300) {
        // 成功：尝试解析JSON
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            data: response,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: parseHeaders(xhr.getAllResponseHeaders())
          });
        } catch (e) {
          // 响应不是JSON，直接返回文本
          resolve({
            data: xhr.responseText,
            status: xhr.status,
            statusText: xhr.statusText
          });
        }
      } else {
        // 服务器返回错误状态码
        reject({
          message: `请求失败: ${xhr.status} ${xhr.statusText}`,
          status: xhr.status,
          statusText: xhr.statusText,
          data: xhr.responseText
        });
      }
    };

    // 网络错误（断网、CORS等）
    xhr.onerror = function() {
      reject({
        message: '网络错误，请检查您的网络连接',
        status: 0,
        statusText: 'Network Error'
      });
    };

    // 超时错误
    xhr.ontimeout = function() {
      reject({
        message: `请求超时（${timeout}ms）`,
        status: 0,
        statusText: 'Timeout'
      });
    };

    // 请求被取消
    xhr.onabort = function() {
      reject({
        message: '请求已被取消',
        status: 0,
        statusText: 'Aborted'
      });
    };

    // 8. 发送请求
    if (data !== null) {
      // 如果是GET请求，把data拼接到URL上
      if (method === 'GET') {
        const queryString = new URLSearchParams(data).toString();
        xhr.open(method, url + (url.includes('?') ? '&' : '?') + queryString, true);
        xhr.send(null);
      } else {
        // POST请求，发送JSON数据
        xhr.send(JSON.stringify(data));
      }
    } else {
      xhr.send(null);
    }
  });
}

/**
 * 解析响应头字符串为对象
 * @param {string} headerString 原始响应头字符串
 * @returns {Object} 解析后的响应头对象
 */
function parseHeaders(headerString) {
  const headers = {};
  if (!headerString) return headers;

  headerString.trim().split('\r\n').forEach(line => {
    const parts = line.split(': ');
    const key = parts.shift();
    const value = parts.join(': ');
    headers[key.toLowerCase()] = value;
  });

  return headers;
}

// ========== 便捷的HTTP方法封装 ==========

/**
 * 发送GET请求
 * @param {string} url 请求地址
 * @param {Object} params 查询参数
 * @param {Object} options 其他选项
 * @returns {Promise}
 */
function xhrGet(url, params = {}, options = {}) {
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  return xhrRequest({ method: 'GET', url, ...options });
}

/**
 * 发送POST请求
 * @param {string} url 请求地址
 * @param {Object} data 请求体数据
 * @param {Object} options 其他选项
 * @returns {Promise}
 */
function xhrPost(url, data, options = {}) {
  return xhrRequest({ method: 'POST', url, data, ...options });
}

/**
 * 发送PUT请求
 */
function xhrPut(url, data, options = {}) {
  return xhrRequest({ method: 'PUT', url, data, ...options });
}

/**
 * 发送DELETE请求
 */
function xhrDelete(url, options = {}) {
  return xhrRequest({ method: 'DELETE', url, ...options });
}

// ========== 在项目中的实际使用示例 ==========

// 1. 获取用户列表
async function fetchUsers() {
  try {
    const response = await xhrGet('/api/users', { page: 1, pageSize: 20 });
    console.log('用户列表:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

// 2. 创建新用户
async function createUser(userData) {
  try {
    const response = await xhrPost('/api/users', userData);
    console.log('创建用户成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 3. 更新用户头像（带文件上传）
function uploadAvatar(userId, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `/api/users/${userId}/avatar`, true);

    // 上传进度回调
    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`上传失败: ${xhr.status}`));
      }
    };

    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };

    const formData = new FormData();
    formData.append('avatar', file);

    xhr.send(formData);
  });
}
```

---

## 第七部分：XHR的局限性与兼容性问题

### 7.1 XHR的缺点

```javascript
// ❌ XHR的这些缺点催生了fetch和axios

// 1. API设计不友好 - 太多回调，嵌套噩梦
xhr.open('GET', '/api/user', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      const user = JSON.parse(xhr.responseText);
      // 然后继续嵌套...
    }
  }
};

// 2. 不支持文件上传进度精确百分比（可以用onprogress但不够精细）
// 3. 不能取消请求（虽然有abort()但不够语义化）
// 4. 不能设置请求超时（需要自己用setTimeout配合）
// 5. 不会自动处理JSON（需要手动parse）
// 6. 错误处理混乱（onerror在很多情况下不触发）
```

### 7.2 兼容性问题处理

```javascript
/**
 * 创建XHR对象的兼容函数
 * 解决老版本IE不支持XMLHttpRequest的问题
 */
function createXHR() {
  // 现代浏览器
  if (typeof XMLHttpRequest !== 'undefined') {
    return new XMLHttpRequest();
  }

  // IE6及更老版本 - 使用ActiveXObject
  const versions = [
    'MSXML2.XmlHttp.6.0',
    'MSXML2.XmlHttp.5.0',
    'MSXML2.XmlHttp.4.0',
    'MSXML2.XmlHttp.3.0',
    'MSXML2.XmlHttp.2.0',
    'Microsoft.XmlHttp'
  ];

  let xhr;
  for (let i = 0; i < versions.length; i++) {
    try {
      xhr = new ActiveXObject(versions[i]);
      break;
    } catch (e) {
      // 继续尝试下一个版本
    }
  }

  if (xhr) {
    return xhr;
  } else {
    throw new Error('您的浏览器不支持Ajax');
  }
}

// 使用兼容函数
function ajaxRequest(options) {
  const xhr = createXHR(); // 使用兼容的XHR创建方式

  // ... 后续逻辑不变
}
```

### 7.3 常见坑及解决方案

```javascript
// ========== 坑1：中文编码问题 ==========
// 如果不编码中文，特殊字符可能导致请求失败
function encodeParams(params) {
  const encoded = {};
  for (const key in params) {
    // 使用encodeURIComponent确保中文被正确编码
    encoded[key] = encodeURIComponent(params[key]);
  }
  return encoded;
}

// 使用
const params = { name: '张三', city: '北京' };
const encoded = encodeParams(params);
// 结果: { name: '%E5%BC%A0%E4%B8%89', city: '%E5%8C%97%E4%BA%AC' }

// ========== 坑2：JSON.parse报错 ==========
// 服务器返回空字符串或非JSON时，parse会报错
xhr.onload = function() {
  if (xhr.status === 200 && xhr.responseText) {
    try {
      const data = JSON.parse(xhr.responseText);
      console.log(data);
    } catch (e) {
      // 降级处理：当作纯文本
      console.log(xhr.responseText);
    }
  }
};

// ========== 坑3：CORS预检请求 ==========
// 发送跨域请求时，复杂请求会先发OPTIONS预检
// 如果服务器没正确配置，会导致请求失败

// 解决方案：确保服务器正确响应OPTIONS请求
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Authorization', 'Bearer token');
// 这会触发预检请求

// ========== 坑4：请求被缓存 ==========
// GET请求可能被浏览器缓存，返回旧数据

// 解决方案1：加时间戳
const url = '/api/users?' + Date.now();

// 解决方案2：设置Cache-Control
xhr.setRequestHeader('Cache-Control', 'no-cache');

// ========== 坑5：并发请求竞态条件 ==========
// 多个请求按顺序发送，但可能按乱序返回

// 场景：先搜索A，返回慢；再搜索B，返回快
// 结果：可能先用A的结果更新UI

// 解决方案：为每个请求生成唯一ID
let requestId = 0;
function createRequest() {
  const currentId = ++requestId;

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // 检查是否是最新请求
      if (currentId === requestId) {
        // 这是最新请求，更新UI
        updateUI(xhr.responseText);
      } else {
        // 这是一个旧请求，忽略
        console.log('忽略过期响应:', currentId);
      }
    }
  };
}
```

---

## 第八部分：XHR在现代项目中的残留使用

### 8.1 什么时候还在用原生XHR？

虽然axios和fetch已经很普及了，但在某些场景下原生XHR还有用武之地：

```javascript
// 1. 需要精确控制上传/下载进度
function uploadWithProgress(file) {
  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      // 精确的进度百分比，可以做进度条
      updateProgressBar(percent);
    }
  };

  xhr.open('POST', '/api/upload');
  xhr.send(file);
}

// 2. 需要发送二进制数据（如websocket握手扩展）
function sendBinaryData(data) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/binary');
  xhr.send(data); // 直接发送ArrayBuffer
}

// 3. 需要支持非常老旧的浏览器
// 但这种情况越来越少见了
```

### 8.2 XHR与fetch的对比

| 特性 | XHR | Fetch |
|-----|-----|-------|
| API风格 | 事件回调 | Promise |
| 取消请求 | abort() | AbortController |
| 超时控制 | timeout属性 | signal + timeout |
| JSON自动解析 | 需手动parse | 需手动parse |
| 文件上传进度 | 支持 | 不支持（Streams除外） |
| 请求取消 | 可行 | 原生支持 |
| 错误处理 | 混乱 | 只在网络错误时reject |
|  cookies | withCredentials | mode: 'include' |
| 兼容性 | 更好 | 需要polyfill |

---

## 总结：XHR的地位与意义

XHR就像互联网通信领域的"老式电话"：

- **优点**：稳定、兼容性好、支持进度监控
- **缺点**：API设计落后、回调地狱、不支持取消请求

虽然现在我们很少直接使用XHR了，但它是现代所有网络请求方案的基础。理解XHR的工作原理，能帮助我们更好地理解fetch为什么那样设计，axios为什么要封装成这样。

下一章我们将讨论AJAX的设计模式，看看如何用Promise和async/await来优雅地处理异步请求。

---

## 附录：XHR完整API速查表

```javascript
// 创建XHR
const xhr = new XMLHttpRequest();

// 初始化请求
xhr.open(method, url, async, username, password);

// 设置请求头
xhr.setRequestHeader(header, value);

// 设置超时
xhr.timeout = 30000;

// 设置响应类型
xhr.responseType = 'json'; // '' | 'text' | 'document' | 'json' | 'blob' | 'arraybuffer'

// 发送请求
xhr.send(body);

// 取消请求
xhr.abort();

// 事件
xhr.onreadystatechange = () => {};  // 状态变化
xhr.onload = () => {};               // 请求完成
xhr.onerror = () => {};              // 网络错误
xhr.onabort = () => {};              // 请求取消
xhr.ontimeout = () => {};            // 超时
xhr.onprogress = () => {};           // 下载进度
xhr.upload.onprogress = () => {};    // 上传进度

// 属性
xhr.readyState;       // 0-4的状态码
xhr.status;           // HTTP状态码
xhr.statusText;       // 状态码文字
xhr.responseText;     // 响应体（字符串）
xhr.responseXML;      // 响应体（XML）
xhr.response;         // 响应体（根据responseType自动类型化）
xhr.responseURL;      // 响应URL
xhr.timeout;          // 超时时间
xhr.withCredentials;  // 是否跨域携带cookie

// 方法
xhr.getResponseHeader(name);     // 获取指定响应头
xhr.getAllResponseHeaders();     // 获取所有响应头
xhr.upload;                      // 上传相关的XMLHttpRequestUpload对象
```

---

**作者**：WebEnv-OS 教学组
**最后更新**：2026年4月
