# CSP Content-Security-Policy 演进史：从白名单到 Level 3 的 Trusted Types 革命 (2026版)

## 1. 起源：XSS 的猖獗与 CSP Level 1/2 的失败

### 1.1 背景：注入攻击的原罪
在 Web 2.0 时代，跨站脚本攻击 (XSS) 是最令开发者头疼的安全漏洞。攻击者通过在评论区、URL 参数中注入恶意的 `<script>` 标签，诱使其他用户的浏览器执行这些脚本，从而窃取 Cookie 或冒充用户进行操作。

### 1.2 CSP 的初心与“白名单 (Allowlist)”陷阱
为了防止未知脚本的执行，W3C 推出了 **Content Security Policy (CSP)**。早期的 CSP (Level 1/2) 核心思想是**建立白名单**。
- **机制**：开发者在 HTTP 响应头中声明 `script-src 'self' https://trusted-cdn.com`。这意味着浏览器只会执行来自同源和特定 CDN 的脚本。
- **为什么它失败了？**：
  1. **运维噩梦**：现代前端项目动辄引入几十个第三方 SDK（如 Google Analytics, Sentry），白名单越来越长，极难维护。
  2. **安全绕过 (Bypass)**：白名单只限制了“域名”。如果 `https://trusted-cdn.com` 上存在一个有缺陷的 JSONP 接口，或者提供了一个老旧的 AngularJS 库，攻击者依然可以利用这些受信任域名上的合法资源，构造出 XSS 攻击（即所谓的 "Gadget" 绕过）。

---

## 2. 发展：CSP Level 3 的 `strict-dynamic` 与 Nonce 机制

为了彻底解决白名单被绕过的痛点，Google 在 2016 年主导推出了 CSP Level 3，并在 2026 年成为现代大厂的**标配底线 (Strict CSP)**。

### 2.1 放弃域名，拥抱随机数 (Nonce)
在 Strict CSP 中，我们不再信任任何具体的域名（连 `'self'` 都不用）。
- **机制**：服务器在每次响应页面时，动态生成一个高强度的随机字符串（**Nonce**）。这个 Nonce 同时出现在 CSP Header 和合法的 `<script>` 标签中。

**HTTP 响应头：**
```http
Content-Security-Policy: script-src 'nonce-r4nd0m';
```
**HTML：**
```html
<!-- ✅ 会被执行，因为暗号对上了 -->
<script nonce="r4nd0m" src="/main.js"></script>

<!-- ❌ 攻击者注入的脚本，会被浏览器直接拦截，因为他不知道这一次的随机暗号是什么 -->
<script src="http://evil.com/xss.js"></script>
```

### 2.2 `strict-dynamic` 的级联信任
- **痛点**：现代应用中，`main.js` 经常会动态创建新的 script 标签（比如按需懒加载的 chunk）。由于这些动态生成的标签没有 nonce，它们会被拦截。
- **解法**：加入 `'strict-dynamic'` 指令。它告诉浏览器：**如果一个脚本因为 nonce 而被信任，那么它通过 `document.createElement('script')` 动态加载的其他脚本，也应该自动被信任。** 这种“信任传递”完美契合了 Webpack/Vite 的模块懒加载机制。

---

## 3. 2026 终极形态：Trusted Types (可信类型)

有了 Strict CSP，黑客无法再向页面注入 `<script>`。但是，如果黑客注入的是 `"<img src=x onerror=alert(1)>"`，并且你的代码恰好执行了 `document.body.innerHTML = payload`，XSS 依然会发生。这就是**基于 DOM 的 XSS (DOM XSS)**。

在 2026 年，**Trusted Types** 成为了所有主流浏览器（包括 Safari）的基础支持，它是防御 DOM XSS 的终极武器。

### 3.1 核心机制：锁死危险的“接收槽 (Sinks)”
开启 Trusted Types 后，浏览器底层会对所有能引发代码执行的 DOM API（如 `innerHTML`, `document.write`, `eval`）进行**类型强制检查**。

**配置 CSP 开启：**
```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types myPolicy dompurify;
```

**发生了什么？**
一旦开启，浏览器**绝对拒绝**接受纯字符串（String）赋值给这些属性。

```javascript
// ❌ 浏览器直接抛出 TypeError 崩溃，彻底免疫 DOM XSS
document.getElementById('target').innerHTML = "<img src=x onerror=...>";
```

### 3.2 如何合法修改 DOM？(策略清洗)
开发者必须通过事先注册的、经过安全团队审核的**安全策略 (Policy)**，将字符串“洗白”成一个特殊的 `TrustedHTML` 对象，浏览器才会放行。

```javascript
// 1. 注册安全策略（通常结合 DOMPurify 净化库）
const policy = window.trustedTypes.createPolicy('myPolicy', {
  createHTML: (input) => DOMPurify.sanitize(input) // 在这里剔除 onerror 等恶意属性
});

// 2. 将洗白后的安全对象赋值给 DOM
const safeObj = policy.createHTML(userInput);
document.getElementById('target').innerHTML = safeObj; // ✅ 浏览器放行
```

---

## 4. 纵向与横向拓展：2026 架构实战

### 4.1 Next.js 16 与 Nonce 的结合
在 SSR 架构下，给每一页生成不同的 Nonce 并在渲染时注入是一个挑战。
在 Next.js 的 App Router 中，我们通常使用 **Middleware** 拦截请求。
1. Middleware 生成 `crypto.randomUUID()` 作为 nonce。
2. 将 nonce 注入到 Request Header。
3. Next.js 会自动读取该 Header，并将 nonce 追加到所有框架生成的 `<script>` 标签上。

### 4.2 报告机制 (Report-To)
永远不要一开始就在生产环境强行拦截。2026 年的标准做法是使用 `Content-Security-Policy-Report-Only` 头。当发生违规（比如遗漏了某个旧库的 eval 调用）时，浏览器不会拦截，而是会在后台静默向你的监控服务器发送 JSON 报告。当报错趋近于 0 时，再切换为真正的拦截模式。

---

## 5. 面试高频问题

**Q1：为什么在现代 CSP 中，强烈建议移除 `unsafe-inline`？如果我必须使用内联事件 (`onclick`) 怎么办？**
**答：** `'unsafe-inline'` 是 XSS 能够执行的最大帮凶，它允许直接在 HTML 中写 `<script>` 或 `onclick`。在 Strict CSP 中，我们强制要求外部脚本引用。如果由于历史遗留问题，部分内联事件无法立即移除，2026 年的浏览器提供了 **`unsafe-hashes`** 指令：你可以预先计算这段内联 JS 的 SHA-256 哈希值并写入 CSP，浏览器只允许哈希值匹配的内联代码执行，从而兼顾了安全与兼容性。

**Q2：如果我用了 React，还需要 Trusted Types 吗？**
**答：** 需要。虽然 React 的 JSX 默认会自动转义字符串，免疫绝大部分 XSS，但依然存在几个致命漏洞：
1. 开发者滥用 `dangerouslySetInnerHTML`。
2. 将用户输入绑定到 `href` 属性并使用了 `javascript:` 伪协议。
开启 Trusted Types 可以从浏览器内核层面直接兜底，防止这类由于开发者疏忽导致的 React 逃逸漏洞。

---
*参考资料: W3C Web Application Security Working Group, web.dev CSP Guide*
*本文档由 Gemini CLI 持续维护，最后更新于 2026 年 3 月*