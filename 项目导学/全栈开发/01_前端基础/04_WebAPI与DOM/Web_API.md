# Web API核心知识

## 一、概述

Web API是浏览器提供的JavaScript接口，用于与Web页面、系统和网络进行交互。2026年，Web API已经扩展到包括WebGPU、WebNN等前沿技术，使Web应用具备原生应用的能力。

**核心API分类**：
- **DOM API**：文档对象模型操作
- **Fetch API**：网络请求
- **Canvas API**：图形渲染
- **WebSockets**：实时通信
- **Web Storage**：本地存储
- **Web Components**：组件化开发

---

## 二、核心概念

### 2.1 DOM API

DOM（Document Object Model）是HTML和XML文档的编程接口。

**核心概念**：
- **Document**：文档对象
- **Element**：元素对象
- **Node**：节点对象
- **Event**：事件对象

**常用方法**：
| 方法 | 说明 | 示例 |
|------|------|------|
| `getElementById` | 通过ID获取元素 | `document.getElementById('myId')` |
| `querySelector` | CSS选择器获取元素 | `document.querySelector('.myClass')` |
| `createElement` | 创建元素 | `document.createElement('div')` |
| `appendChild` | 添加子节点 | `parent.appendChild(child)` |
| `addEventListener` | 添加事件监听 | `element.addEventListener('click', handler)` |

### 2.2 Fetch API

Fetch API用于发起网络请求，替代XMLHttpRequest。

**核心概念**：
- `fetch()`：发起请求
- `Response`：响应对象
- `Request`：请求对象
- `Headers`：请求/响应头

**常用方法**：
| 方法 | 说明 | 示例 |
|------|------|------|
| `fetch()` | 发起请求 | `fetch('/api/data')` |
| `response.json()` | 解析JSON | `response.json()` |
| `response.text()` | 解析文本 | `response.text()` |
| `response.blob()` | 解析二进制 | `response.blob()` |

### 2.3 Canvas API

Canvas API用于在网页上绘制图形。

**核心概念**：
- `Canvas`：画布元素
- `Context`：绘图上下文
- `Path`：路径
- `Shape`：形状

**常用方法**：
| 方法 | 说明 | 示例 |
|------|------|------|
| `getContext()` | 获取上下文 | `canvas.getContext('2d')` |
| `fillRect()` | 填充矩形 | `ctx.fillRect(0, 0, 100, 100)` |
| `strokeRect()` | 描边矩形 | `ctx.strokeRect(0, 0, 100, 100)` |
| `beginPath()` | 开始路径 | `ctx.beginPath()` |
| `arc()` | 绘制圆弧 | `ctx.arc(x, y, radius, startAngle, endAngle)` |

### 2.4 WebSockets

WebSockets提供全双工通信通道。

**核心概念**：
- `WebSocket`：WebSocket对象
- `onopen`：连接打开事件
- `onmessage`：消息接收事件
- `onclose`：连接关闭事件
- `send()`：发送消息

**常用方法**：
| 方法 | 说明 | 示例 |
|------|------|------|
| `new WebSocket()` | 创建连接 | `new WebSocket('ws://localhost:8080')` |
| `send()` | 发送消息 | `socket.send('Hello')` |
| `close()` | 关闭连接 | `socket.close()` |

### 2.5 Web Storage

本地存储解决方案。

**核心概念**：
- `localStorage`：永久存储
- `sessionStorage`：会话存储
- `IndexedDB`：数据库存储

**常用方法**：
| 方法 | 说明 | 示例 |
|------|------|------|
| `setItem()` | 设置项 | `localStorage.setItem('key', 'value')` |
| `getItem()` | 获取项 | `localStorage.getItem('key')` |
| `removeItem()` | 删除项 | `localStorage.removeItem('key')` |
| `clear()` | 清空存储 | `localStorage.clear()` |

---

## 三、代码示例

### 3.1 DOM操作示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOM操作示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }
    
    .dom-example {
      margin-bottom: 40px;
    }
    
    .dom-example h3 {
      margin-bottom: 20px;
      color: #34495e;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-danger:hover {
      background: #c0392b;
    }
    
    .btn-success {
      background: #2ecc71;
    }
    
    .btn-success:hover {
      background: #27ae60;
    }
    
    .output {
      margin-top: 20px;
      padding: 20px;
      background: #ecf0f1;
      border-radius: 8px;
      min-height: 100px;
    }
    
    .output p {
      margin-bottom: 10px;
      color: #666;
    }
    
    .item {
      padding: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .item:hover {
      background: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>DOM操作示例</h2>
    
    <!-- 示例1：元素选择 -->
    <div class="dom-example">
      <h3>示例1：元素选择</h3>
      <button class="btn" id="getElementByIdBtn">getElementById</button>
      <button class="btn" id="querySelectorBtn">querySelector</button>
      <button class="btn" id="querySelectorAllBtn">querySelectorAll</button>
      
      <div id="targetElement" class="output">
        <p>点击按钮选择元素</p>
      </div>
    </div>
    
    <!-- 示例2：元素创建与添加 -->
    <div class="dom-example">
      <h3>示例2：元素创建与添加</h3>
      <button class="btn" id="createElementBtn">创建新元素</button>
      <button class="btn" id="appendChildBtn">添加到列表</button>
      <button class="btn" id="insertBeforeBtn">插入到指定位置</button>
      <button class="btn btn-danger" id="removeElementBtn">删除元素</button>
      
      <div id="listContainer" class="output">
        <div class="item">项目 1</div>
        <div class="item">项目 2</div>
        <div class="item">项目 3</div>
      </div>
    </div>
    
    <!-- 示例3：属性操作 -->
    <div class="dom-example">
      <h3>示例3：属性操作</h3>
      <button class="btn" id="getAttributeBtn">获取属性</button>
      <button class="btn" id="setAttributeBtn">设置属性</button>
      <button class="btn" id="classListBtn">切换类名</button>
      
      <div id="attributeElement" class="output">
        <p id="textElement">这是一个段落</p>
      </div>
    </div>
    
    <!-- 示例4：事件处理 -->
    <div class="dom-example">
      <h3>示例4：事件处理</h3>
      <button class="btn" id="addEventListenerBtn">添加事件监听</button>
      <button class="btn" id="removeEventListenerBtn">移除事件监听</button>
      <button class="btn" id="eventPropagationBtn">事件冒泡示例</button>
      
      <div id="eventContainer" class="output">
        <p>点击按钮查看事件处理效果</p>
      </div>
    </div>
    
    <!-- 示例5：表单操作 -->
    <div class="dom-example">
      <h3>示例5：表单操作</h3>
      <button class="btn" id="formSerializeBtn">序列化表单</button>
      <button class="btn" id="formResetBtn">重置表单</button>
      
      <form id="demoForm" class="output">
        <div style="margin-bottom: 15px;">
          <label for="username">用户名:</label>
          <input type="text" id="username" name="username" value="john_doe">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="email">邮箱:</label>
          <input type="email" id="email" name="email" value="john@example.com">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="age">年龄:</label>
          <input type="number" id="age" name="age" value="25">
        </div>
        <div style="margin-bottom: 15px;">
          <label for="hobby">爱好:</label>
          <select id="hobby" name="hobby">
            <option value="reading">阅读</option>
            <option value="music">音乐</option>
            <option value="sports">运动</option>
          </select>
        </div>
        <div style="margin-bottom: 15px;">
          <label>
            <input type="checkbox" name="terms" checked> 同意条款
          </label>
        </div>
      </form>
    </div>
    
    <!-- 示例6：DOM遍历 -->
    <div class="dom-example">
      <h3>示例6：DOM遍历</h3>
      <button class="btn" id="parentBtn">获取父元素</button>
      <button class="btn" id="childrenBtn">获取子元素</button>
      <button class="btn" id="siblingsBtn">获取兄弟元素</button>
      
      <div id="navigation" class="output">
        <ul>
          <li>首页</li>
          <li class="active">产品</li>
          <li>服务</li>
          <li>关于</li>
        </ul>
      </div>
    </div>
  </div>

  <script>
    // 示例1：元素选择
    const targetElement = document.getElementById('targetElement');
    
    document.getElementById('getElementByIdBtn').addEventListener('click', () => {
      const element = document.getElementById('targetElement');
      targetElement.innerHTML = `<p>找到元素: <code>${element.tagName}</code></p>`;
    });
    
    document.getElementById('querySelectorBtn').addEventListener('click', () => {
      const element = document.querySelector('.output');
      targetElement.innerHTML = `<p>找到元素: <code>${element.tagName}</code> (class="output")</p>`;
    });
    
    document.getElementById('querySelectorAllBtn').addEventListener('click', () => {
      const elements = document.querySelectorAll('.output');
      targetElement.innerHTML = `<p>找到 ${elements.length} 个元素</p>`;
    });
    
    // 示例2：元素创建与添加
    const listContainer = document.getElementById('listContainer');
    let itemCounter = 3;
    
    document.getElementById('createElementBtn').addEventListener('click', () => {
      itemCounter++;
      const newItem = document.createElement('div');
      newItem.className = 'item';
      newItem.textContent = `项目 ${itemCounter}`;
      newItem.id = `item${itemCounter}`;
      newItem.dataset.timestamp = new Date().toISOString();
      
      // 添加自定义属性
      newItem.setAttribute('data-custom', 'custom-value');
      
      targetElement.innerHTML = `<p>创建了新元素: <code>&lt;div id="item${itemCounter}"&gt;</code></p>`;
    });
    
    document.getElementById('appendChildBtn').addEventListener('click', () => {
      itemCounter++;
      const newItem = document.createElement('div');
      newItem.className = 'item';
      newItem.textContent = `项目 ${itemCounter}`;
      
      listContainer.appendChild(newItem);
      targetElement.innerHTML = `<p>添加了项目 ${itemCounter} 到列表末尾</p>`;
    });
    
    document.getElementById('insertBeforeBtn').addEventListener('click', () => {
      itemCounter++;
      const newItem = document.createElement('div');
      newItem.className = 'item';
      newItem.textContent = `项目 ${itemCounter}`;
      
      const firstItem = listContainer.querySelector('.item');
      if (firstItem) {
        listContainer.insertBefore(newItem, firstItem);
        targetElement.innerHTML = `<p>插入了项目 ${itemCounter} 到列表开头</p>`;
      }
    });
    
    document.getElementById('removeElementBtn').addEventListener('click', () => {
      const items = listContainer.querySelectorAll('.item');
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        listContainer.removeChild(lastItem);
        targetElement.innerHTML = `<p>删除了最后一个项目</p>`;
      } else {
        targetElement.innerHTML = `<p>列表为空，无法删除</p>`;
      }
    });
    
    // 示例3：属性操作
    const attributeElement = document.getElementById('attributeElement');
    const textElement = document.getElementById('textElement');
    
    document.getElementById('getAttributeBtn').addEventListener('click', () => {
      const id = textElement.getAttribute('id');
      const className = textElement.getAttribute('class');
      const customAttr = textElement.getAttribute('data-custom');
      
      targetElement.innerHTML = `
        <p>元素属性:</p>
        <ul>
          <li>id: <code>${id}</code></li>
          <li>class: <code>${className}</code></li>
          <li>data-custom: <code>${customAttr || '不存在'}</code></li>
        </ul>
      `;
    });
    
    document.getElementById('setAttributeBtn').addEventListener('click', () => {
      textElement.setAttribute('data-custom', 'custom-value');
      textElement.setAttribute('data-timestamp', new Date().toISOString());
      
      targetElement.innerHTML = `
        <p>已设置自定义属性:</p>
        <ul>
          <li>data-custom: <code>custom-value</code></li>
          <li>data-timestamp: <code>${new Date().toISOString()}</code></li>
        </ul>
      `;
    });
    
    document.getElementById('classListBtn').addEventListener('click', () => {
      textElement.classList.toggle('active');
      textElement.classList.add('highlight');
      
      targetElement.innerHTML = `
        <p>类名操作:</p>
        <ul>
          <li>toggle active: <code>${textElement.classList.contains('active') ? '已添加' : '已移除'}</code></li>
          <li>add highlight: <code>已添加</code></li>
          <li>classList: <code>[${Array.from(textElement.classList).join(', ')}]</code></li>
        </ul>
      `;
    });
    
    // 示例4：事件处理
    const eventContainer = document.getElementById('eventContainer');
    
    document.getElementById('addEventListenerBtn').addEventListener('click', () => {
      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = '点击我';
      
      button.addEventListener('click', (e) => {
        targetElement.innerHTML = `
          <p>事件对象:</p>
          <ul>
            <li>事件类型: <code>${e.type}</code></li>
            <li>目标元素: <code>${e.target.tagName}</code></li>
            <li>时间戳: <code>${e.timeStamp}</code></li>
          </ul>
        `;
      });
      
      eventContainer.appendChild(button);
      targetElement.innerHTML = `<p>添加了点击事件监听</p>`;
    });
    
    document.getElementById('removeEventListenerBtn').addEventListener('click', () => {
      const buttons = eventContainer.querySelectorAll('button');
      if (buttons.length > 0) {
        const button = buttons[buttons.length - 1];
        button.remove();
        targetElement.innerHTML = `<p>移除了最后一个按钮</p>`;
      }
    });
    
    document.getElementById('eventPropagationBtn').addEventListener('click', () => {
      const outerDiv = document.createElement('div');
      outerDiv.style.padding = '20px';
      outerDiv.style.backgroundColor = '#e74c3c';
      outerDiv.style.color = 'white';
      outerDiv.textContent = '外层容器';
      
      const innerDiv = document.createElement('div');
      innerDiv.style.padding = '20px';
      innerDiv.style.backgroundColor = '#3498db';
      innerDiv.style.color = 'white';
      innerDiv.textContent = '内层容器';
      
      outerDiv.addEventListener('click', () => {
        targetElement.innerHTML = `<p>外层容器被点击</p>`;
      });
      
      innerDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        targetElement.innerHTML = `<p>内层容器被点击 (事件已阻止冒泡)</p>`;
      });
      
      innerDiv.addEventListener('click', (e) => {
        targetElement.innerHTML = `<p>内层容器被点击 (事件冒泡)</p>`;
      }, { capture: true }); // 捕获阶段
      
      outerDiv.appendChild(innerDiv);
      eventContainer.appendChild(outerDiv);
      targetElement.innerHTML = `<p>添加了事件冒泡示例</p>`;
    });
    
    // 示例5：表单操作
    const demoForm = document.getElementById('demoForm');
    
    document.getElementById('formSerializeBtn').addEventListener('click', (e) => {
      e.preventDefault();
      
      const formData = new FormData(demoForm);
      const data = {};
      
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      
      targetElement.innerHTML = `
        <p>表单数据:</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
    });
    
    document.getElementById('formResetBtn').addEventListener('click', (e) => {
      e.preventDefault();
      demoForm.reset();
      targetElement.innerHTML = `<p>表单已重置</p>`;
    });
    
    // 示例6：DOM遍历
    const navigation = document.getElementById('navigation');
    
    document.getElementById('parentBtn').addEventListener('click', () => {
      const li = navigation.querySelector('li');
      const parent = li.parentElement;
      
      targetElement.innerHTML = `
        <p>父元素:</p>
        <ul>
          <li>标签名: <code>${parent.tagName}</code></li>
          <li>类名: <code>${parent.className}</code></li>
        </ul>
      `;
    });
    
    document.getElementById('childrenBtn').addEventListener('click', () => {
      const ul = navigation.querySelector('ul');
      const children = ul.children;
      
      targetElement.innerHTML = `
        <p>子元素:</p>
        <ul>
          <li>数量: <code>${children.length}</code></li>
          <li>元素: <code>[${Array.from(children).map(el => el.tagName).join(', ')}]</code></li>
        </ul>
      `;
    });
    
    document.getElementById('siblingsBtn').addEventListener('click', () => {
      const activeLi = navigation.querySelector('.active');
      const parent = activeLi.parentElement;
      const children = Array.from(parent.children);
      const index = children.indexOf(activeLi);
      
      const prev = index > 0 ? children[index - 1] : null;
      const next = index < children.length - 1 ? children[index + 1] : null;
      
      targetElement.innerHTML = `
        <p>兄弟元素:</p>
        <ul>
          <li>当前: <code>${activeLi.textContent}</code></li>
          <li>上一个: <code>${prev ? prev.textContent : '无'}</code></li>
          <li>下一个: <code>${next ? next.textContent : '无'}</code></li>
        </ul>
      `;
    });
  </script>
</body>
</html>
```

### 3.2 Fetch API示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fetch API示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }
    
    .fetch-example {
      margin-bottom: 40px;
    }
    
    .fetch-example h3 {
      margin-bottom: 20px;
      color: #34495e;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-success {
      background: #2ecc71;
    }
    
    .output {
      margin-top: 20px;
      padding: 20px;
      background: #ecf0f1;
      border-radius: 8px;
      min-height: 100px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .output pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 12px;
    }
    
    .loading {
      color: #3498db;
    }
    
    .error {
      color: #e74c3c;
    }
    
    .success {
      color: #2ecc71;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Fetch API示例</h2>
    
    <!-- 示例1：基本GET请求 -->
    <div class="fetch-example">
      <h3>示例1：基本GET请求</h3>
      <button class="btn" id="getJsonBtn">获取JSON数据</button>
      <button class="btn" id="getTextBtn">获取文本数据</button>
      
      <div id="getOutput" class="output">
        <p>点击按钮发起GET请求</p>
      </div>
    </div>
    
    <!-- 示例2：POST请求 -->
    <div class="fetch-example">
      <h3>示例2：POST请求</h3>
      <button class="btn" id="postJsonBtn">发送JSON数据</button>
      <button class="btn" id="postFormDataBtn">发送表单数据</button>
      
      <div id="postOutput" class="output">
        <p>点击按钮发起POST请求</p>
      </div>
    </div>
    
    <!-- 示例3：错误处理 -->
    <div class="fetch-example">
      <h3>示例3：错误处理</h3>
      <button class="btn" id="errorHandlingBtn">错误处理示例</button>
      <button class="btn" id="timeoutBtn">超时处理示例</button>
      
      <div id="errorOutput" class="output">
        <p>点击按钮查看错误处理</p>
      </div>
    </div>
    
    <!-- 示例4：请求头 -->
    <div class="fetch-example">
      <h3>示例4：请求头操作</h3>
      <button class="btn" id="headersBtn">查看响应头</button>
      <button class="btn" id="customHeadersBtn">自定义请求头</button>
      
      <div id="headersOutput" class="output">
        <p>点击按钮查看请求头</p>
      </div>
    </div>
    
    <!-- 示例5：并行请求 -->
    <div class="fetch-example">
      <h3>示例5：并行请求</h3>
      <button class="btn" id="parallelBtn">并行请求示例</button>
      <button class="btn" id="raceBtn">竞速请求示例</button>
      
      <div id="parallelOutput" class="output">
        <p>点击按钮查看并行请求</p>
      </div>
    </div>
    
    <!-- 示例6：文件上传 -->
    <div class="fetch-example">
      <h3>示例6：文件上传</h3>
      <input type="file" id="fileInput" style="margin-bottom: 10px;">
      <button class="btn" id="uploadBtn">上传文件</button>
      
      <div id="uploadOutput" class="output">
        <p>选择文件并点击上传</p>
      </div>
    </div>
  </div>

  <script>
    // 示例1：基本GET请求
    const getOutput = document.getElementById('getOutput');
    
    document.getElementById('getJsonBtn').addEventListener('click', async () => {
      getOutput.innerHTML = '<p class="loading">正在加载...</p>';
      
      try {
        // 使用JSONPlaceholder测试API
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        getOutput.innerHTML = `
          <p class="success">请求成功!</p>
          <p><strong>标题:</strong> ${data.title}</p>
          <p><strong>内容:</strong> ${data.body}</p>
          <p><strong>用户ID:</strong> ${data.userId}</p>
          <p><strong>状态码:</strong> ${response.status}</p>
          <p><strong>状态文本:</strong> ${response.statusText}</p>
        `;
      } catch (error) {
        getOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    document.getElementById('getTextBtn').addEventListener('click', async () => {
      getOutput.innerHTML = '<p class="loading">正在加载...</p>';
      
      try {
        // 使用Text-File测试API
        const response = await fetch('https://text-file-1234567890abcdef.vercel.app/api/text');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        getOutput.innerHTML = `
          <p class="success">请求成功!</p>
          <p><strong>响应内容:</strong></p>
          <pre>${text.substring(0, 200)}${text.length > 200 ? '...' : ''}</pre>
          <p><strong>响应类型:</strong> ${response.type}</p>
          <p><strong>响应URL:</strong> ${response.url}</p>
        `;
      } catch (error) {
        getOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    // 示例2：POST请求
    const postOutput = document.getElementById('postOutput');
    
    document.getElementById('postJsonBtn').addEventListener('click', async () => {
      postOutput.innerHTML = '<p class="loading">正在发送...</p>';
      
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: '测试文章',
            body: '这是通过Fetch API发送的测试数据',
            userId: 1
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        postOutput.innerHTML = `
          <p class="success">请求成功!</p>
          <p><strong>创建的ID:</strong> ${data.id}</p>
          <p><strong>标题:</strong> ${data.title}</p>
          <p><strong>内容:</strong> ${data.body}</p>
          <p><strong>用户ID:</strong> ${data.userId}</p>
        `;
      } catch (error) {
        postOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    document.getElementById('postFormDataBtn').addEventListener('click', async () => {
      postOutput.innerHTML = '<p class="loading">正在发送...</p>';
      
      try {
        const formData = new FormData();
        formData.append('name', 'John Doe');
        formData.append('email', 'john@example.com');
        formData.append('message', '这是一条测试消息');
        
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        postOutput.innerHTML = `
          <p class="success">请求成功!</p>
          <p><strong>创建的ID:</strong> ${data.id}</p>
          <p><strong>标题:</strong> ${data.title}</p>
          <p><strong>内容:</strong> ${data.body}</p>
        `;
      } catch (error) {
        postOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    // 示例3：错误处理
    const errorOutput = document.getElementById('errorOutput');
    
    document.getElementById('errorHandlingBtn').addEventListener('click', async () => {
      errorOutput.innerHTML = '<p class="loading">正在测试...</p>';
      
      try {
        // 测试404错误
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/999999');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        errorOutput.innerHTML = `<p class="success">请求成功: ${JSON.stringify(data)}</p>`;
      } catch (error) {
        if (error instanceof TypeError) {
          errorOutput.innerHTML = `<p class="error">网络错误: ${error.message}</p>`;
        } else if (error.message.includes('404')) {
          errorOutput.innerHTML = `<p class="error">资源未找到 (404): ${error.message}</p>`;
        } else {
          errorOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
        }
      }
    });
    
    document.getElementById('timeoutBtn').addEventListener('click', async () => {
      errorOutput.innerHTML = '<p class="loading">正在测试超时...</p>';
      
      try {
        // 使用AbortController实现超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        errorOutput.innerHTML = `<p class="success">请求成功: ${data.title}</p>`;
      } catch (error) {
        if (error.name === 'AbortError') {
          errorOutput.innerHTML = `<p class="error">请求超时</p>`;
        } else {
          errorOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
        }
      }
    });
    
    // 示例4：请求头
    const headersOutput = document.getElementById('headersOutput');
    
    document.getElementById('headersBtn').addEventListener('click', async () => {
      headersOutput.innerHTML = '<p class="loading">正在获取...</p>';
      
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let headersText = '<p><strong>响应头:</strong></p><ul>';
        response.headers.forEach((value, key) => {
          headersText += `<li><strong>${key}:</strong> ${value}</li>`;
        });
        headersText += '</ul>';
        
        headersOutput.innerHTML = headersText;
      } catch (error) {
        headersOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    document.getElementById('customHeadersBtn').addEventListener('click', async () => {
      headersOutput.innerHTML = '<p class="loading">正在发送...</p>';
      
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'Custom Value',
            'X-Request-ID': Date.now().toString()
          },
          body: JSON.stringify({
            title: '测试文章',
            body: '包含自定义请求头',
            userId: 1
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        headersOutput.innerHTML = `
          <p class="success">请求成功!</p>
          <p><strong>响应数据:</strong></p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
      } catch (error) {
        headersOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    // 示例5：并行请求
    const parallelOutput = document.getElementById('parallelOutput');
    
    document.getElementById('parallelBtn').addEventListener('click', async () => {
      parallelOutput.innerHTML = '<p class="loading">正在并行请求...</p>';
      
      try {
        const promises = [
          fetch('https://jsonplaceholder.typicode.com/posts/1'),
          fetch('https://jsonplaceholder.typicode.com/posts/2'),
          fetch('https://jsonplaceholder.typicode.com/posts/3')
        ];
        
        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(r => r.json()));
        
        parallelOutput.innerHTML = `
          <p class="success">所有请求成功!</p>
          <p><strong>获取了 ${data.length} 条数据:</strong></p>
          <ul>
            ${data.map(item => `<li><strong>${item.title}</strong> (ID: ${item.id})</li>`).join('')}
          </ul>
        `;
      } catch (error) {
        parallelOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    document.getElementById('raceBtn').addEventListener('click', async () => {
      parallelOutput.innerHTML = '<p class="loading">正在竞速请求...</p>';
      
      try {
        const promises = [
          new Promise(resolve => setTimeout(() => resolve('Fast'), 100)),
          new Promise(resolve => setTimeout(() => resolve('Medium'), 500)),
          new Promise(resolve => setTimeout(() => resolve('Slow'), 1000))
        ];
        
        const result = await Promise.race(promises);
        parallelOutput.innerHTML = `<p class="success">竞速结果: ${result}</p>`;
      } catch (error) {
        parallelOutput.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
      }
    });
    
    // 示例6：文件上传
    const uploadOutput = document.getElementById('uploadOutput');
    const fileInput = document.getElementById('fileInput');
    
    document.getElementById('uploadBtn').addEventListener('click', async () => {
      const file = fileInput.files[0];
      
      if (!file) {
        uploadOutput.innerHTML = '<p class="error">请选择文件</p>';
        return;
      }
      
      uploadOutput.innerHTML = '<p class="loading">正在上传...</p>';
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('size', file.size);
        formData.append('type', file.type);
        
        // 使用Mock API进行测试
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        uploadOutput.innerHTML = `
          <p class="success">文件上传成功!</p>
          <p><strong>文件名:</strong> ${file.name}</p>
          <p><strong>文件大小:</strong> ${file.size} bytes</p>
          <p><strong>文件类型:</strong> ${file.type || 'unknown'}</p>
          <p><strong>响应ID:</strong> ${data.id}</p>
        `;
      } catch (error) {
        uploadOutput.innerHTML = `<p class="error">上传失败: ${error.message}</p>`;
      }
    });
  </script>
</body>
</html>
```

### 3.3 Canvas API示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas API示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }
    
    .canvas-example {
      margin-bottom: 40px;
    }
    
    .canvas-example h3 {
      margin-bottom: 20px;
      color: #34495e;
    }
    
    .canvas-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .canvas-wrapper {
      flex: 1;
      min-width: 300px;
      text-align: center;
    }
    
    .canvas-wrapper canvas {
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-success {
      background: #2ecc71;
    }
    
    .output {
      margin-top: 20px;
      padding: 20px;
      background: #ecf0f1;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Canvas API示例</h2>
    
    <!-- 示例1：基本图形 -->
    <div class="canvas-example">
      <h3>示例1：基本图形绘制</h3>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas id="basicCanvas" width="400" height="300"></canvas>
          <div style="margin-top: 10px;">
            <button class="btn" id="drawRectBtn">绘制矩形</button>
            <button class="btn" id="drawCircleBtn">绘制圆形</button>
            <button class="btn" id="drawLineBtn">绘制线条</button>
            <button class="btn btn-danger" id="clearCanvasBtn">清空画布</button>
          </div>
        </div>
      </div>
      <div id="basicOutput" class="output">
        <p>点击按钮绘制基本图形</p>
      </div>
    </div>
    
    <!-- 示例2：颜色与样式 -->
    <div class="canvas-example">
      <h3>示例2：颜色与样式</h3>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas id="styleCanvas" width="400" height="300"></canvas>
          <div style="margin-top: 10px;">
            <button class="btn" id="fillStyleBtn">填充样式</button>
            <button class="btn" id="strokeStyleBtn">描边样式</button>
            <button class="btn" id="gradientBtn">渐变效果</button>
            <button class="btn" id="shadowBtn">阴影效果</button>
          </div>
        </div>
      </div>
      <div id="styleOutput" class="output">
        <p>点击按钮查看样式效果</p>
      </div>
    </div>
    
    <!-- 示例3：文本绘制 -->
    <div class="canvas-example">
      <h3>示例3：文本绘制</h3>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas id="textCanvas" width="400" height="300"></canvas>
          <div style="margin-top: 10px;">
            <button class="btn" id="drawTextBtn">绘制文本</button>
            <button class="btn" id="measureTextBtn">测量文本</button>
            <button class="btn" id="textAlignBtn">文本对齐</button>
          </div>
        </div>
      </div>
      <div id="textOutput" class="output">
        <p>点击按钮查看文本效果</p>
      </div>
    </div>
    
    <!-- 示例4：图像处理 -->
    <div class="canvas-example">
      <h3>示例4：图像处理</h3>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas id="imageCanvas" width="400" height="300"></canvas>
          <div style="margin-top: 10px;">
            <button class="btn" id="drawImageBtn">绘制图片</button>
            <button class="btn" id="imageFilterBtn">图像滤镜</button>
            <button class="btn" id="pixelDataBtn">像素数据</button>
          </div>
        </div>
      </div>
      <div id="imageOutput" class="output">
        <p>点击按钮查看图像效果</p>
      </div>
    </div>
    
    <!-- 示例5：动画 -->
    <div class="canvas-example">
      <h3>示例5：动画效果</h3>
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas id="animationCanvas" width="400" height="300"></canvas>
          <div style="margin-top: 10px;">
            <button class="btn" id="startAnimationBtn">开始动画</button>
            <button class="btn" id="stopAnimationBtn">停止动画</button>
            <button class="btn" id="resetAnimationBtn">重置动画</button>
          </div>
        </div>
      </div>
      <div id="animationOutput" class="output">
        <p>点击按钮控制动画</p>
      </div>
    </div>
  </div>

  <script>
    // 示例1：基本图形绘制
    const basicCanvas = document.getElementById('basicCanvas');
    const basicCtx = basicCanvas.getContext('2d');
    const basicOutput = document.getElementById('basicOutput');
    
    document.getElementById('drawRectBtn').addEventListener('click', () => {
      basicCtx.clearRect(0, 0, basicCanvas.width, basicCanvas.height);
      
      // 绘制矩形
      basicCtx.fillStyle = '#3498db';
      basicCtx.fillRect(50, 50, 200, 100);
      
      basicCtx.strokeStyle = '#e74c3c';
      basicCtx.lineWidth = 3;
      basicCtx.strokeRect(100, 100, 200, 100);
      
      basicOutput.innerHTML = '<p>已绘制矩形</p>';
    });
    
    document.getElementById('drawCircleBtn').addEventListener('click', () => {
      basicCtx.clearRect(0, 0, basicCanvas.width, basicCanvas.height);
      
      // 绘制圆形
      basicCtx.beginPath();
      basicCtx.arc(200, 150, 80, 0, Math.PI * 2);
      basicCtx.fillStyle = '#2ecc71';
      basicCtx.fill();
      
      basicCtx.strokeStyle = '#9b59b6';
      basicCtx.lineWidth = 5;
      basicCtx.stroke();
      
      basicOutput.innerHTML = '<p>已绘制圆形</p>';
    });
    
    document.getElementById('drawLineBtn').addEventListener('click', () => {
      basicCtx.clearRect(0, 0, basicCanvas.width, basicCanvas.height);
      
      // 绘制线条
      basicCtx.beginPath();
      basicCtx.moveTo(50, 50);
      basicCtx.lineTo(350, 50);
      basicCtx.strokeStyle = '#3498db';
      basicCtx.lineWidth = 2;
      basicCtx.stroke();
      
      basicCtx.beginPath();
      basicCtx.moveTo(50, 150);
      basicCtx.lineTo(350, 150);
      basicCtx.strokeStyle = '#e74c3c';
      basicCtx.lineWidth = 4;
      basicCtx.stroke();
      
      basicCtx.beginPath();
      basicCtx.moveTo(50, 250);
      basicCtx.lineTo(350, 250);
      basicCtx.strokeStyle = '#2ecc71';
      basicCtx.lineWidth = 6;
      basicCtx.stroke();
      
      basicOutput.innerHTML = '<p>已绘制线条</p>';
    });
    
    document.getElementById('clearCanvasBtn').addEventListener('click', () => {
      basicCtx.clearRect(0, 0, basicCanvas.width, basicCanvas.height);
      basicOutput.innerHTML = '<p>画布已清空</p>';
    });
    
    // 示例2：颜色与样式
    const styleCanvas = document.getElementById('styleCanvas');
    const styleCtx = styleCanvas.getContext('2d');
    const styleOutput = document.getElementById('styleOutput');
    
    document.getElementById('fillStyleBtn').addEventListener('click', () => {
      styleCtx.clearRect(0, 0, styleCanvas.width, styleCanvas.height);
      
      // 不同填充样式
      styleCtx.fillStyle = '#3498db';
      styleCtx.fillRect(50, 50, 100, 100);
      
      styleCtx.fillStyle = 'rgba(231, 76, 60, 0.5)';
      styleCtx.fillRect(200, 50, 100, 100);
      
      styleCtx.fillStyle = '#2ecc71';
      styleCtx.fillRect(50, 200, 100, 100);
      
      styleOutput.innerHTML = '<p>已绘制不同填充样式的矩形</p>';
    });
    
    document.getElementById('strokeStyleBtn').addEventListener('click', () => {
      styleCtx.clearRect(0, 0, styleCanvas.width, styleCanvas.height);
      
      // 不同描边样式
      styleCtx.strokeStyle = '#3498db';
      styleCtx.lineWidth = 2;
      styleCtx.strokeRect(50, 50, 100, 100);
      
      styleCtx.strokeStyle = '#e74c3c';
      styleCtx.lineWidth = 5;
      styleCtx.strokeRect(200, 50, 100, 100);
      
      styleCtx.strokeStyle = '#2ecc71';
      styleCtx.lineWidth = 10;
      styleCtx.strokeRect(50, 200, 100, 100);
      
      styleOutput.innerHTML = '<p>已绘制不同描边样式的矩形</p>';
    });
    
    document.getElementById('gradientBtn').addEventListener('click', () => {
      styleCtx.clearRect(0, 0, styleCanvas.width, styleCanvas.height);
      
      // 线性渐变
      const linearGradient = styleCtx.createLinearGradient(0, 0, 400, 0);
      linearGradient.addColorStop(0, '#3498db');
      linearGradient.addColorStop(0.5, '#9b59b6');
      linearGradient.addColorStop(1, '#e74c3c');
      
      styleCtx.fillStyle = linearGradient;
      styleCtx.fillRect(50, 50, 300, 100);
      
      // 径向渐变
      const radialGradient = styleCtx.createRadialGradient(200, 200, 20, 200, 200, 100);
      radialGradient.addColorStop(0, '#2ecc71');
      radialGradient.addColorStop(1, '#1abc9c');
      
      styleCtx.fillStyle = radialGradient;
      styleCtx.beginPath();
      styleCtx.arc(200, 200, 80, 0, Math.PI * 2);
      styleCtx.fill();
      
      styleOutput.innerHTML = '<p>已绘制渐变效果</p>';
    });
    
    document.getElementById('shadowBtn').addEventListener('click', () => {
      styleCtx.clearRect(0, 0, styleCanvas.width, styleCanvas.height);
      
      // 设置阴影
      styleCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      styleCtx.shadowBlur = 10;
      styleCtx.shadowOffsetX = 5;
      styleCtx.shadowOffsetY = 5;
      
      styleCtx.fillStyle = '#3498db';
      styleCtx.fillRect(100, 100, 100, 100);
      
      styleCtx.fillStyle = '#e74c3c';
      styleCtx.fillRect(200, 100, 100, 100);
      
      // 重置阴影
      styleCtx.shadowColor = 'transparent';
      styleCtx.shadowBlur = 0;
      styleCtx.shadowOffsetX = 0;
      styleCtx.shadowOffsetY = 0;
      
      styleOutput.innerHTML = '<p>已绘制阴影效果</p>';
    });
    
    // 示例3：文本绘制
    const textCanvas = document.getElementById('textCanvas');
    const textCtx = textCanvas.getContext('2d');
    const textOutput = document.getElementById('textOutput');
    
    document.getElementById('drawTextBtn').addEventListener('click', () => {
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      
      // 设置字体
      textCtx.font = '30px Arial';
      textCtx.fillStyle = '#3498db';
      
      // 绘制文本
      textCtx.fillText('Hello Canvas', 50, 100);
      textCtx.strokeText('Hello Canvas', 50, 200);
      
      textOutput.innerHTML = '<p>已绘制文本</p>';
    });
    
    document.getElementById('measureTextBtn').addEventListener('click', () => {
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      
      // 测量文本宽度
      const text = 'Hello Canvas';
      textCtx.font = '30px Arial';
      const metrics = textCtx.measureText(text);
      
      textCtx.fillText(text, 50, 100);
      
      // 绘制测量线
      textCtx.strokeStyle = '#e74c3c';
      textCtx.beginPath();
      textCtx.moveTo(50, 100);
      textCtx.lineTo(50 + metrics.width, 100);
      textCtx.stroke();
      
      textOutput.innerHTML = `
        <p>文本宽度: ${metrics.width.toFixed(2)}px</p>
        <p>文本高度: 30px</p>
      `;
    });
    
    document.getElementById('textAlignBtn').addEventListener('click', () => {
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      
      // 设置对齐方式
      textCtx.font = '20px Arial';
      textCtx.fillStyle = '#3498db';
      
      // 不同对齐方式
      textCtx.textAlign = 'left';
      textCtx.fillText('Left', 50, 50);
      
      textCtx.textAlign = 'center';
      textCtx.fillText('Center', 200, 100);
      
      textCtx.textAlign = 'right';
      textCtx.fillText('Right', 350, 150);
      
      // 绘制参考线
      textCtx.strokeStyle = '#ddd';
      textCtx.beginPath();
      textCtx.moveTo(50, 0);
      textCtx.lineTo(50, 300);
      textCtx.moveTo(200, 0);
      textCtx.lineTo(200, 300);
      textCtx.moveTo(350, 0);
      textCtx.lineTo(350, 300);
      textCtx.stroke();
      
      textOutput.innerHTML = '<p>已绘制不同对齐方式的文本</p>';
    });
    
    // 示例4：图像处理
    const imageCanvas = document.getElementById('imageCanvas');
    const imageCtx = imageCanvas.getContext('2d');
    const imageOutput = document.getElementById('imageOutput');
    
    document.getElementById('drawImageBtn').addEventListener('click', () => {
      imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      
      // 创建图片对象
      const img = new Image();
      img.src = 'https://picsum.photos/200/200';
      
      img.onload = () => {
        // 绘制图片
        imageCtx.drawImage(img, 100, 50, 200, 200);
        
        // 绘制图片的一部分
        imageCtx.drawImage(img, 50, 50, 100, 100, 50, 200, 100, 100);
        
        imageOutput.innerHTML = '<p>已绘制图片</p>';
      };
    });
    
    document.getElementById('imageFilterBtn').addEventListener('click', () => {
      imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      
      // 创建图片对象
      const img = new Image();
      img.src = 'https://picsum.photos/300/200';
      
      img.onload = () => {
        // 绘制原始图片
        imageCtx.drawImage(img, 50, 50);
        
        // 应用滤镜
        imageCtx.filter = 'grayscale(100%)';
        imageCtx.drawImage(img, 400, 50);
        
        imageCtx.filter = 'sepia(100%)';
        imageCtx.drawImage(img, 50, 300);
        
        imageCtx.filter = 'none';
        imageOutput.innerHTML = '<p>已应用图像滤镜</p>';
      };
    });
    
    document.getElementById('pixelDataBtn').addEventListener('click', () => {
      imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      
      // 创建渐变
      const gradient = imageCtx.createLinearGradient(0, 0, 400, 0);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(0.5, 'green');
      gradient.addColorStop(1, 'blue');
      
      imageCtx.fillStyle = gradient;
      imageCtx.fillRect(50, 50, 300, 200);
      
      // 获取像素数据
      const imageData = imageCtx.getImageData(50, 50, 300, 200);
      const data = imageData.data;
      
      // 修改像素数据（反转颜色）
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
      }
      
      // 放回像素数据
      imageCtx.putImageData(imageData, 50, 300);
      
      imageOutput.innerHTML = '<p>已处理像素数据</p>';
    });
    
    // 示例5：动画效果
    const animationCanvas = document.getElementById('animationCanvas');
    const animationCtx = animationCanvas.getContext('2d');
    const animationOutput = document.getElementById('animationOutput');
    
    let animationId = null;
    let x = 50;
    let y = 150;
    let dx = 2;
    let dy = 2;
    
    function animate() {
      animationCtx.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
      
      // 绘制球
      animationCtx.beginPath();
      animationCtx.arc(x, y, 30, 0, Math.PI * 2);
      animationCtx.fillStyle = '#3498db';
      animationCtx.fill();
      
      // 更新位置
      x += dx;
      y += dy;
      
      // 边界检测
      if (x + 30 > animationCanvas.width || x - 30 < 0) {
        dx = -dx;
      }
      
      if (y + 30 > animationCanvas.height || y - 30 < 0) {
        dy = -dy;
      }
      
      animationId = requestAnimationFrame(animate);
    }
    
    document.getElementById('startAnimationBtn').addEventListener('click', () => {
      if (!animationId) {
        animate();
        animationOutput.innerHTML = '<p>动画已启动</p>';
      }
    });
    
    document.getElementById('stopAnimationBtn').addEventListener('click', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        animationOutput.innerHTML = '<p>动画已停止</p>';
      }
    });
    
    document.getElementById('resetAnimationBtn').addEventListener('click', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      x = 50;
      y = 150;
      dx = 2;
      dy = 2;
      
      animationCtx.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
      animationOutput.innerHTML = '<p>动画已重置</p>';
    });
  </script>
</body>
</html>
```

### 3.4 WebSockets示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSockets示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
    }
    
    .websocket-example {
      margin-bottom: 40px;
    }
    
    .websocket-example h3 {
      margin-bottom: 20px;
      color: #34495e;
    }
    
    .connection-panel {
      padding: 20px;
      background: #ecf0f1;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .connection-panel h4 {
      margin-bottom: 15px;
      color: #2c3e50;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-success {
      background: #2ecc71;
    }
    
    .btn-warning {
      background: #f39c12;
    }
    
    .status {
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    
    .status.connected {
      background: #d5f5e3;
      color: #27ae60;
    }
    
    .status.disconnected {
      background: #fadbd8;
      color: #e74c3c;
    }
    
    .status.connecting {
      background: #fcf3cf;
      color: #f39c12;
    }
    
    .message-log {
      padding: 20px;
      background: #2c3e50;
      border-radius: 8px;
      color: white;
      height: 400px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 14px;
    }
    
    .message-log .message {
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
    }
    
    .message-log .sent {
      background: #3498db;
    }
    
    .message-log .received {
      background: #2ecc71;
    }
    
    .message-log .system {
      background: #9b59b6;
    }
    
    .input-panel {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .input-panel input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .input-panel input:focus {
      outline: none;
      border-color: #3498db;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    
    .stat-item {
      padding: 15px;
      background: #ecf0f1;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-item .value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
    }
    
    .stat-item .label {
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>WebSockets示例</h2>
    
    <!-- 连接面板 -->
    <div class="connection-panel">
      <h4>连接设置</h4>
      <div id="status" class="status disconnected">未连接</div>
      
      <div style="margin-bottom: 15px;">
        <label for="wsUrl">WebSocket URL:</label>
        <input type="text" id="wsUrl" value="wss://echo.websocket.org" style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 6px;">
      </div>
      
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-success" id="connectBtn">连接</button>
        <button class="btn btn-danger" id="disconnectBtn" disabled>断开</button>
        <button class="btn btn-warning" id="pingBtn" disabled>Ping</button>
      </div>
    </div>
    
    <!-- 消息日志 -->
    <div class="message-log" id="messageLog">
      <div class="message system">等待连接...</div>
    </div>
    
    <!-- 输入面板 -->
    <div class="input-panel">
      <input type="text" id="messageInput" placeholder="输入消息..." disabled>
      <button class="btn" id="sendBtn" disabled>发送</button>
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <div class="stat-item">
        <div class="value" id="sentCount">0</div>
        <div class="label">发送消息</div>
      </div>
      <div class="stat-item">
        <div class="value" id="receivedCount">0</div>
        <div class="label">接收消息</div>
      </div>
      <div class="stat-item">
        <div class="value" id="messageSize">0</div>
        <div class="label">消息大小</div>
      </div>
    </div>
  </div>

  <script>
    // WebSocket连接
    let socket = null;
    let sentCount = 0;
    let receivedCount = 0;
    
    // DOM元素
    const statusEl = document.getElementById('status');
    const wsUrlInput = document.getElementById('wsUrl');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const pingBtn = document.getElementById('pingBtn');
    const messageLog = document.getElementById('messageLog');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const sentCountEl = document.getElementById('sentCount');
    const receivedCountEl = document.getElementById('receivedCount');
    const messageSizeEl = document.getElementById('messageSize');
    
    // 添加消息到日志
    function addMessage(text, type = 'system') {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${type}`;
      
      const timestamp = new Date().toLocaleTimeString();
      messageDiv.textContent = `[${timestamp}] ${text}`;
      
      messageLog.appendChild(messageDiv);
      messageLog.scrollTop = messageLog.scrollHeight;
    }
    
    // 更新状态
    function updateStatus(text, className) {
      statusEl.textContent = text;
      statusEl.className = `status ${className}`;
    }
    
    // 更新统计
    function updateStats() {
      sentCountEl.textContent = sentCount;
      receivedCountEl.textContent = receivedCount;
    }
    
    // 连接WebSocket
    connectBtn.addEventListener('click', () => {
      const url = wsUrlInput.value.trim();
      
      if (!url) {
        addMessage('请输入WebSocket URL', 'system');
        return;
      }
      
      updateStatus('连接中...', 'connecting');
      
      try {
        socket = new WebSocket(url);
        
        // 连接成功
        socket.onopen = () => {
          updateStatus('已连接', 'connected');
          connectBtn.disabled = true;
          disconnectBtn.disabled = false;
          pingBtn.disabled = false;
          messageInput.disabled = false;
          sendBtn.disabled = false;
          
          addMessage(`已连接到 ${url}`, 'system');
        };
        
        // 连接错误
        socket.onerror = (error) => {
          updateStatus('连接错误', 'disconnected');
          addMessage(`连接错误: ${error.message}`, 'system');
        };
        
        // 连接关闭
        socket.onclose = (event) => {
          updateStatus('已断开', 'disconnected');
          connectBtn.disabled = false;
          disconnectBtn.disabled = true;
          pingBtn.disabled = true;
          messageInput.disabled = true;
          sendBtn.disabled = true;
          
          addMessage(`连接已关闭: ${event.reason || '正常关闭'}`, 'system');
        };
        
        // 接收消息
        socket.onmessage = (event) => {
          receivedCount++;
          updateStats();
          
          let message = event.data;
          
          // 如果是二进制数据
          if (event.data instanceof Blob) {
            message = `[二进制数据, 大小: ${event.data.size} bytes]`;
          }
          
          addMessage(`收到: ${message}`, 'received');
          messageSizeEl.textContent = message.length;
        };
        
      } catch (error) {
        updateStatus('连接失败', 'disconnected');
        addMessage(`连接失败: ${error.message}`, 'system');
      }
    });
    
    // 断开连接
    disconnectBtn.addEventListener('click', () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    });
    
    // 发送消息
    sendBtn.addEventListener('click', () => {
      const message = messageInput.value.trim();
      
      if (!message) {
        addMessage('请输入消息', 'system');
        return;
      }
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(message);
          sentCount++;
          updateStats();
          
          addMessage(`发送: ${message}`, 'sent');
          messageInput.value = '';
          messageSizeEl.textContent = message.length;
        } catch (error) {
          addMessage(`发送失败: ${error.message}`, 'system');
        }
      } else {
        addMessage('连接未打开', 'system');
      }
    });
    
    // 回车发送消息
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
    
    // Ping服务器
    pingBtn.addEventListener('click', () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const pingMessage = `Ping ${Date.now()}`;
        socket.send(pingMessage);
        sentCount++;
        updateStats();
        
        addMessage(`发送: ${pingMessage}`, 'sent');
      } else {
        addMessage('连接未打开', 'system');
      }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl+Enter 发送消息
      if (e.ctrlKey && e.key === 'Enter') {
        sendBtn.click();
      }
    });
    
    // 页面卸载时关闭连接
    window.addEventListener('beforeunload', () => {
      if (socket) {
        socket.close();
      }
    });
  </script>
</body>
</html>
```

---

## 四、最佳实践

### 4.1 DOM操作最佳实践

1. **减少DOM操作次数**：批量操作DOM
2. **使用DocumentFragment**：减少重排重绘
3. **事件委托**：使用事件委托减少事件监听器
4. **选择器优化**：使用ID选择器而非复杂选择器

### 4.2 Fetch API最佳实践

1. **错误处理**：始终处理网络错误和HTTP错误
2. **超时控制**：为请求设置超时
3. **取消请求**：使用AbortController取消请求
4. **请求重试**：实现请求重试机制

### 4.3 Canvas API最佳实践

1. **性能优化**：使用requestAnimationFrame
2. **缓存图像**：缓存复杂图像
3. **减少重绘**：批量绘制操作
4. **离屏Canvas**：使用离屏Canvas预渲染

### 4.4 WebSockets最佳实践

1. **连接管理**：实现连接重连机制
2. **消息确认**：实现消息确认机制
3. **心跳检测**：定期发送心跳消息
4. **错误处理**：处理各种错误情况

---

## 五、常见问题

### 5.1 DOM操作性能问题

**问题**：DOM操作导致页面卡顿？

**解决方案**：
- 批量操作DOM
- 使用DocumentFragment
- 使用requestAnimationFrame
- 减少重排重绘

### 5.2 Fetch API错误处理

**问题**：如何正确处理Fetch API的错误？

**解决方案**：
- 检查response.ok
- 使用try-catch处理网络错误
- 实现超时控制
- 添加重试机制

### 5.3 Canvas性能优化

**问题**：Canvas绘制性能不佳？

**解决方案**：
- 使用requestAnimationFrame
- 减少状态切换
- 缓存复杂图像
- 使用离屏Canvas

---

## 六、实战练习

### 6.1 练习1：实现Todo应用

**任务**：使用DOM API实现一个Todo应用，包含：
- 添加Todo
- 删除Todo
- 标记完成
- 过滤显示

### 6.2 练习2：实现图片画廊

**任务**：使用Canvas API实现图片画廊，包含：
- 图片预览
- 图片裁剪
- 图片滤镜
- 图片保存

### 6.3 练习3：实现实时聊天

**任务**：使用WebSockets实现实时聊天，包含：
- 连接管理
- 消息发送
- 消息接收
- 在线用户列表

---

## 七、总结

Web API是Web开发的核心，掌握其核心知识至关重要：

1. **DOM API**：页面操作的基础
2. **Fetch API**：网络请求的标准
3. **Canvas API**：图形渲染的强大工具
4. **WebSockets**：实时通信的解决方案

掌握这些知识，为构建现代Web应用打下坚实基础。

---

## 八、深入原理分析

### 8.1 DOM操作性能优化原理

DOM操作是Web应用中最常见的性能瓶颈之一，理解其原理对优化至关重要：

```
DOM操作性能问题原因：

浏览器渲染管线：
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ JavaScript    │ → │ Style        │ → │ Layout        │ → │ Paint        │ → │ Composite │
│ (DOM修改)     │   │ (样式计算)    │   │ (布局计算)    │   │ (重绘)        │         │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘

问题：每次DOM修改都可能触发重排(Layout)和重绘(Paint)，非常昂贵。

优化策略：
1. 批量DOM操作
2. 使用文档片段（DocumentFragment）
3. 缓存DOM查询结果
4. 使用CSS类名批量修改样式
5. 使用transform/opacity进行动画
```

**批量DOM操作**：

```javascript
// ❌ 低效：每次都触发重排
function badUpdate(items) {
  const container = document.getElementById('container');
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    container.appendChild(div); // 每次append都触发重排
  });
}

// ✅ 高效：使用DocumentFragment批量添加
function goodUpdate(items) {
  const container = document.getElementById('container');
  const fragment = document.createDocumentFragment(); // 不触发重排

  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    fragment.appendChild(div); // 添加到片段，不影响DOM树
  });

  container.appendChild(fragment); // 一次性添加到DOM，只触发一次重排
}

// ✅ 更高效：完全离线构建后一次性插入
function bestUpdate(items) {
  const container = document.getElementById('container');

  // 克隆节点，离线操作
  const clone = container.cloneNode(true);

  // 在克隆节点上批量操作（完全不触发重排）
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    clone.appendChild(div);
  });

  // 一次性替换
  container.parentNode.replaceChild(clone, container);
}

// ✅ 最优雅：使用innerHTML批量构建（针对大量动态内容）
function htmlUpdate(items) {
  const container = document.getElementById('container');
  container.innerHTML = items.map(item =>
    `<div>${item.name}</div>`
  ).join('');
}
```

### 8.2 事件循环与requestAnimationFrame

**requestAnimationFrame的原理**：

```javascript
// requestAnimationFrame vs setTimeout/setInterval

// ❌ setInterval不稳定：浏览器后台可能降速
setInterval(() => {
  updateAnimation(); // 可能跳帧
}, 16.67); // 理想60fps，但实际不稳定

// ✅ requestAnimationFrame：与浏览器刷新率同步
function animate() {
  updateAnimation(); // 每帧执行一次，与屏幕刷新同步
  requestAnimationFrame(animate); // 继续下一帧
}
requestAnimationFrame(animate);

// ✅ 使用requestAnimationFrame暂停/恢复动画
class AnimationController {
  constructor(callback) {
    this.callback = callback;
    this.isRunning = false;
    this.frameId = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  tick = () => {
    if (!this.isRunning) return;
    this.callback();
    this.frameId = requestAnimationFrame(this.tick);
  }
}

// ✅ 精准计时：记录时间戳
let lastTime = 0;
function preciseAnimation(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime; // 帧间隔（毫秒）

  // 基于时间的动画（不依赖帧率）
  const speed = 100; // 像素/秒
  element.style.transform = `translateX(${element.dataset.x + speed * deltaTime / 1000}px)`;

  lastTime = timestamp;
  requestAnimationFrame(preciseAnimation);
}
```

### 8.3 Fetch API底层机制与拦截器实现

```javascript
// Fetch API的底层流程

/*
1. 创建Request对象
2. 浏览器检查Service Worker/缓存
3. 发送HTTP请求
4. 接收Response流
5. 通过TransformStream处理（如解压）
6. 返回Promise<Response>
*/

// 实现Fetch拦截器（类似Axios拦截器）
class FetchInterceptor {
  constructor() {
    this.requestQueue = [];
    this.responseQueue = [];
  }

  // 请求拦截器
  static async requestInterceptor(config) {
    // 添加认证Token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 添加请求ID（用于链路追踪）
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // 请求日志
    console.log(`[Request] ${config.method} ${config.url}`, config);

    return config;
  }

  // 响应拦截器
  static responseInterceptor(response, config) {
    console.log(`[Response] ${response.status} ${config.url}`);

    if (!response.ok) {
      // 处理HTTP错误
      switch (response.status) {
        case 401:
          // Token过期，刷新Token
          return refreshToken().then(() =>
            fetch(config.url, config) // 重试原请求
          );
        case 403:
          throw new Error('没有权限访问该资源');
        case 404:
          throw new Error('请求的资源不存在');
        case 500:
          throw new Error('服务器内部错误');
      }
    }

    return response;
  }
}

// 封装fetch（带拦截器）
async function interceptedFetch(url, options = {}) {
  // 准备配置
  let config = {
    url,
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body,
    ...options
  };

  // 请求拦截
  config = await FetchInterceptor.requestInterceptor(config);

  // 发送请求
  const response = await fetch(url, {
    method: config.method,
    headers: config.headers,
    body: config.body,
    credentials: 'include', // 包含Cookie
    cache: options.cache || 'default'
  });

  // 响应拦截
  const processedResponse = await FetchInterceptor.responseInterceptor(response, config);

  return processedResponse;
}

// 使用示例
async function fetchUsers() {
  const response = await interceptedFetch('/api/users', {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

### 8.4 MutationObserver与DOM变化监听

MutationObserver是监听DOM变化的现代API，比旧的Mutation Events高效得多：

```javascript
// MutationObserver监听DOM变化
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    console.log('变化类型:', mutation.type);
    console.log('变化的属性:', mutation.attributeName);
    console.log('旧值:', mutation.oldValue);
    console.log('新增节点:', mutation.addedNodes);
    console.log('删除节点:', mutation.removedNodes);
  });
});

// 配置观察选项
const config = {
  childList: true,     // 监听子节点增删
  subtree: true,       // 监听子树（包括后代）
  attributes: true,     // 监听属性变化
  attributeOldValue: true, // 记录属性旧值
  attributeFilter: ['class', 'data-id'], // 只监听特定属性
  characterData: true,  // 监听文本变化
  characterDataOldValue: true // 记录文本旧值
};

// 开始观察
observer.observe(document.getElementById('target'), config);

// 停止观察
observer.disconnect();

// 实战：自动保存编辑器内容
class AutoSaveManager {
  constructor(element, saveUrl, options = {}) {
    this.element = element;
    this.saveUrl = saveUrl;
    this.debounceTimer = null;
    this.lastSavedContent = element.innerHTML;
    this.saveInterval = options.saveInterval || 3000;

    // 创建观察器
    this.observer = new MutationObserver(() => {
      this.scheduleSave();
    });

    // 配置：监听内容变化
    this.observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 定时保存
    this.intervalId = setInterval(() => this.save(), this.saveInterval);
  }

  scheduleSave() {
    // 防抖：500ms后尝试保存
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.save(), 500);
  }

  async save() {
    const content = this.element.innerHTML;

    // 内容未变化，跳过
    if (content === this.lastSavedContent) return;

    try {
      await fetch(this.saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, timestamp: Date.now() })
      });

      this.lastSavedContent = content;
      console.log('自动保存成功');
    } catch (error) {
      console.error('自动保存失败', error);
    }
  }

  destroy() {
    this.observer.disconnect();
    clearTimeout(this.debounceTimer);
    clearInterval(this.intervalId);
  }
}
```

### 8.5 Intersection Observer与懒加载

IntersectionObserver是实现懒加载的现代API，不需要滚动监听和throttle：

```javascript
// 懒加载图片
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src; // 使用data-src存储真实URL

      // 创建新Image加载
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = src;
        img.classList.remove('lazy');
        img.classList.add('loaded');
      };
      tempImg.src = src;

      // 停止观察此图片
      observer.unobserve(img);
    }
  });
}, {
  root: null, // 使用视口
  rootMargin: '50px 0px', // 提前50px开始加载
  threshold: 0.01 // 1%可见即触发
});

// 观察所有懒加载图片
document.querySelectorAll('.lazy').forEach(img => {
  imageObserver.observe(img);
});

// 无限滚动（加载更多）
const sentinel = document.getElementById('sentinel');
const scrollObserver = new IntersectionObserver(async (entries) => {
  const entry = entries[0];
  if (entry.isIntersecting && !this.loading) {
    await this.loadMoreItems();
  }
}, { rootMargin: '200px' });

scrollObserver.observe(sentinel);

// 曝光埋点
function track曝光(element, eventName) {
  const exposureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // 元素50%以上可见时触发
        track(eventName, {
          element: entry.target.dataset.trackId,
          exposureTime: Date.now()
        });
        exposureObserver.unobserve(entry.target); // 只触发一次
      }
    });
  }, { threshold: 0.5 });

  exposureObserver.observe(element);
}
```

---

## 九、常见面试题详解

### 9.1 DOM事件流（捕获、目标、冒泡）的工作原理

**参考答案**：

```
DOM事件流三阶段：

1. 捕获阶段（Capture Phase）- 从根元素向下传播
   window → document → html → body → ... → 目标元素

2. 目标阶段（Target Phase）- 事件到达目标元素
   事件在目标元素上触发

3. 冒泡阶段（Bubble Phase）- 从目标元素向上传播
   目标元素 → ... → body → html → document → window

addEventListener第三个参数：
- false（默认）：冒泡阶段处理
- true：捕获阶段处理
```

```javascript
// 事件流示例
const parent = document.getElementById('parent');
const child = document.getElementById('child');

function handler(event) {
  console.log(`${event.currentTarget.id} - ${event.eventPhase === 1 ? '捕获' : event.eventPhase === 2 ? '目标' : '冒泡'}`);
}

// 捕获阶段监听（先触发）
parent.addEventListener('click', handler, true);
child.addEventListener('click', handler, true);

// 目标阶段监听（取决于注册顺序）
child.addEventListener('click', handler, true);

// 冒泡阶段监听（后触发）
child.addEventListener('click', handler, false);
parent.addEventListener('click', handler, false);

// 阻止事件传播
child.addEventListener('click', e => {
  e.stopPropagation(); // 阻止向父元素传播
  e.stopImmediatePropagation(); // 阻止同元素其他监听器
});

// 阻止默认行为
link.addEventListener('click', e => {
  e.preventDefault(); // 阻止默认行为（如跳转）
});

// 事件委托：利用冒泡机制
document.querySelector('ul').addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    handleLiClick(e.target);
  }
});
```

### 9.2 Fetch API与XMLHttpRequest的区别

**参考答案**：

| 特性 | Fetch API | XMLHttpRequest |
|------|-----------|----------------|
| **API风格** | Promise-based，简洁 | 事件回调，繁琐 |
| **跨域请求** | 需要CORS配置 | 需要CORS配置 |
| **Cookie处理** | 需要设置credentials | 自动发送 |
| **超时控制** | 需要AbortController | 支持timeout属性 |
| **进度监控** | 需要Response.body.getReader() | 有progress事件 |
| **错误处理** | 4xx/5xx不reject | 只有网络错误reject |
| **流处理** | 原生支持流 | 需第三方库 |
| **中止请求** | AbortController | abort() |

```javascript
// Fetch vs XHR 详细对比

// XHR：进度监控
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.upload.onprogress = e => {
  console.log(`上传进度: ${e.loaded / e.total * 100}%`);
};
xhr.onprogress = e => {
  console.log(`下载进度: ${e.loaded / e.total * 100}%`);
};
xhr.send();

// Fetch + AbortController：超时控制
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch('/api/data', { signal: controller.signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('请求超时');
    }
  })
  .finally(() => clearTimeout(timeoutId));

// Fetch：进度流读取
const response = await fetch('/api/large-data');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  console.log('收到数据块:', chunk);
}

// Fetch：4xx/5xx不reject，需要手动处理
const res = await fetch('/api/not-found');
if (!res.ok) {
  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}
```

### 9.3 Web Workers通信机制与实战

**参考答案**：

```javascript
// 主线程与Worker通信

// 1. 基本消息传递
const worker = new Worker('worker.js');

// 发送消息
worker.postMessage({ type: 'task', data: [1, 2, 3] });

// 接收消息
worker.onmessage = event => {
  console.log('收到Worker消息:', event.data);
};

// Worker脚本 (worker.js)
self.onmessage = event => {
  const { type, data } = event.data;

  if (type === 'task') {
    const result = data.map(x => x * 2);
    self.postMessage({ type: 'result', result });
  }
};

// 2. Transferable对象（零拷贝，性能更高）
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage({ buffer }, [buffer]); // 所有权转移，发送后buffer失效

// 3. 共享Worker（同一来源的所有页面共享）
const sharedWorker = new SharedWorker('shared-worker.js');
sharedWorker.port.start();
sharedWorker.port.postMessage({ type: 'register', tabId: 'tab-1' });

// shared-worker.js
const connections = new Map();

self.onconnect = event => {
  const port = event.ports[0];
  connections.set('tab-1', port);

  port.onmessage = e => {
    // 广播给所有连接
    connections.forEach(p => p.postMessage(e.data));
  };

  port.start();
};

// 4. 模拟Service Worker缓存策略
class SWCacheManager {
  constructor() {
    this.cacheName = 'api-cache-v1';
  }

  async get(url) {
    if ('caches' in window) {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(url);
      if (cached) {
        const data = await cached.json();
        const age = Date.now() - new Date(cached.headers.get('date')).getTime();
        // 缓存有效期5分钟
        if (age < 5 * 60 * 1000) return data;
      }
    }
    return null;
  }

  async set(url, data) {
    if ('caches' in window) {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString()
        }
      });
      await cache.put(url, response);
    }
  }
}
```

### 9.4 本地存储安全最佳实践

**参考答案**：

```javascript
// ❌ 不安全：直接存储敏感信息
localStorage.setItem('token', 'your-secret-token');
localStorage.setItem('password', 'user-password');

// ✅ 安全做法1：使用HttpOnly Cookie存储Token（服务器设置）
// Cookie由浏览器自动随请求发送，无法通过JS访问

// ✅ 安全做法2：使用SessionStorage（标签页关闭后自动清除）
sessionStorage.setItem('tempData', JSON.stringify(data));

// ✅ 安全做法3：加密后存储（使用Web Crypto API）
async function encryptAndStore(key, data) {
  // 生成随机IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 从密钥材料生成密钥
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode('password'), 'PBKDF2', false, ['deriveKey']
  );

  const keyObj = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: iv, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 加密数据
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyObj,
    encoder.encode(JSON.stringify(data))
  );

  // 存储加密后的数据（iv需要一起存储以便解密）
  localStorage.setItem(key, JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  }));
}

// ✅ 安全做法4：使用SessionStorage + 内存缓存
const memoryCache = new Map();

function secureStore(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
  memoryCache.set(key, value);
}

function secureGet(key) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  const stored = sessionStorage.getItem(key);
  if (stored) {
    const value = JSON.parse(stored);
    memoryCache.set(key, value);
    return value;
  }
  return null;
}

// ✅ 安全做法5：敏感数据使用后立即清除
function processSensitiveData(data) {
  const result = analyze(data);
  // 处理完成后立即清除
  data = null;
  return result;
}
```

### 9.5 History API与SPA路由实现

**参考答案**：

```javascript
// History API核心方法
history.pushState(state, title, url);   // 栈顶添加记录，不刷新页面
history.replaceState(state, title, url); // 替换当前记录，不刷新页面
history.back();    // 后退
history.forward(); // 前进
history.go(-2);   // 跳转到相对于当前位置的页面

// 监听浏览器前进/后退
window.addEventListener('popstate', event => {
  console.log('状态:', event.state);
  console.log('当前路径:', location.pathname);
  renderRoute(location.pathname);
});

// 简单SPA路由实现
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    // 监听浏览器前进/后退
    window.addEventListener('popstate', () => this.handleRoute());

    // 拦截链接点击
    document.addEventListener('click', e => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
  }

  // 注册路由
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  // 导航到指定路径
  navigate(path, replace = false) {
    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
    this.handleRoute();
  }

  // 处理当前路由
  handleRoute() {
    const path = location.pathname;

    // 匹配路由
    for (const [routePath, handler] of this.routes) {
      const match = this.matchRoute(routePath, path);
      if (match) {
        this.currentRoute = { path, params: match.params };
        handler(match.params);
        return;
      }
    }

    // 404处理
    this.routes.get('*')?.({ path });
  }

  // 路由匹配（支持参数如 /users/:id）
  matchRoute(routePath, actualPath) {
    const routeParts = routePath.split('/').filter(Boolean);
    const pathParts = actualPath.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) return null;

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        // 动态参数
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        // 静态路径不匹配
        return null;
      }
    }

    return { params };
  }

  // 初始化路由
  init() {
    this.handleRoute();
  }
}

// 使用示例
const router = new Router();

router.addRoute('/', () => renderHome());
router.addRoute('/users', () => renderUserList());
router.addRoute('/users/:id', ({ id }) => renderUserDetail(id));
router.addRoute('/posts/:postId/comments/:commentId', params =>
  renderComment(params.postId, params.commentId)
);
router.addRoute('*', () => render404());

router.init();
```

---

## 十、扩展知识：2026年前沿Web API

### 10.1 WebGPU（新一代图形API）

WebGPU是WebGL的继任者，提供更现代的GPU计算能力：

```javascript
// WebGPU基础使用（需要HTTPS或localhost）
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU不可用');
  }

  // 请求GPU适配器
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('无法获取GPU适配器');
  }

  // 请求GPU设备
  const device = await adapter.requestDevice();

  // 创建着色器模块（WGSL - WebGPU着色器语言）
  const shaderModule = device.createShaderModule({
    code: `
      @group(0) @binding(0) var<uniform> offset: vec4f;

      @vertex
      fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        var positions = array<vec2f, 6>(
          vec2f(-0.5, -0.5),
          vec2f( 0.5, -0.5),
          vec2f(-0.5,  0.5),
          vec2f(-0.5,  0.5),
          vec2f( 0.5, -0.5),
          vec2f( 0.5,  0.5)
        );
        return vec4f(positions[vertexIndex] + offset.xy, 0.0, 1.0);
      }

      @fragment
      fn fragmentMain() -> @location(0) vec4f {
        return vec4f(1.0, 0.5, 0.2, 1.0);
      }
    `
  });

  // 创建渲染管道
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain'
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
    }
  });

  // 渲染循环
  function render() {
    // 获取画布上下文
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store'
      }]
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(6);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(render);
  }

  render();
}
```

### 10.2 WebCodecs API（音视频编解码）

```javascript
// WebCodecs用于高性能音视频处理
async function decodeVideoFrame(videoData) {
  const decoder = new VideoDecoder({
    output(frame) {
      // 处理解码后的帧
      canvas.drawImage(frame, 0, 0);
      frame.close(); // 释放帧资源
    },
    error(e) {
      console.error('解码错误:', e);
    }
  });

  // 配置解码器
  decoder.configure({
    codec: 'avc1.64001e', // H.264 High Profile
    codedWidth: 1920,
    codedHeight: 1080
  });

  // 解码
  decoder.decode(new EncodedVideoChunk({
    type: 'key', // 关键帧
    timestamp: 0,
    data: videoData
  }));

  await decoder.flush();
  decoder.close();
}

// 编码视频帧
async function encodeFrame(frame) {
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      // 处理编码后的数据块
      console.log('编码完成:', chunk.type, chunk.timestamp);
    },
    error(e) {
      console.error('编码错误:', e);
    }
  });

  encoder.configure({
    codec: 'avc1.64001e',
    width: frame.displayWidth,
    height: frame.displayHeight,
    bitrate: 2_000_000,
    framerate: 30
  });

  encoder.encode(frame, { keyFrame: true });
  await encoder.flush();
}
```

### 10.3 File System Access API（文件系统访问）

```javascript
// File System Access API允许网页读写用户本地文件
async function openAndEditFile() {
  // 打开文件
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      { description: '文本文件', accept: { 'text/plain': ['.txt'] } },
      { description: '所有文件', accept: {} }
    ],
    multiple: false
  });

  // 读取文件内容
  const file = await fileHandle.getFile();
  const content = await file.text();

  // 编辑并保存
  const writable = await fileHandle.createWritable();
  await writable.write('修改后的内容' + content);
  await writable.close();
}

// 保存文件（另存为）
async function saveFileAs(content) {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'document.txt',
    types: [
      { description: '文本文件', accept: { 'text/plain': ['.txt'] } }
    ]
  });

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

// 读写文件夹
async function readDirectory() {
  const dirHandle = await window.showDirectoryPicker();

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      console.log(`文件: ${entry.name} (${file.size} bytes)`);
    } else if (entry.kind === 'directory') {
      console.log(`目录: ${entry.name}/`);
    }
  }
}
```

---

## 十一、企业级Web API工程实践

### 11.1 模块化API封装

```javascript
// api/index.js - API统一封装
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // 添加请求拦截器
  useRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  // 添加响应拦截器
  useResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  // 核心请求方法
  async request(path, options = {}) {
    let config = {
      url: this.baseURL + path,
      ...options
    };

    // 执行请求拦截器
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    try {
      const response = await fetch(config.url, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      });

      // 执行响应拦截器
      let processedResponse = response;
      for (const interceptor of this.interceptors.response) {
        processedResponse = await interceptor(processedResponse, config);
      }

      return processedResponse;
    } catch (error) {
      throw new APIError(error.message, config.url);
    }
  }

  // RESTful方法封装
  get(path, params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(path + query, { method: 'GET' });
  }

  post(path, data) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(path, data) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

// API错误类
class APIError extends Error {
  constructor(message, url) {
    super(message);
    this.name = 'APIError';
    this.url = url;
    this.timestamp = Date.now();
  }
}

// 创建API实例
const api = new APIClient('https://api.example.com');

// 配置拦截器
api.useRequestInterceptor(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log(`[API] ${config.method} ${config.url}`);
  return config;
});

api.useResponseInterceptor(async (response, config) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(error.message || '请求失败', config.url);
  }
  return response.json();
});

// 导出各模块API
export const userAPI = {
  list: (params) => api.get('/users', params),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const postAPI = {
  list: (params) => api.get('/posts', params),
  get: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  comment: (id, data) => api.post(`/posts/${id}/comments`, data)
};
```

---

*参考资料: MDN Web Docs, W3C标准, Web API规范*
*本文档最后更新于 2026年3月*
