# Web安全完全指南

## 目录

1. [安全威胁概述](#1-安全威胁概述)
2. [XSS攻击防护](#2-xss攻击防护)
3. [CSRF攻击防护](#3-csrf攻击防护)
4. [SQL注入防护](#4-sql注入防护)
5. [认证与授权安全](#5-认证与授权安全)
6. [文件上传安全](#6-文件上传安全)
7. [敏感数据保护](#7-敏感数据保护)
8. [HTTPS配置](#8-https配置)

---

## 1. 安全威胁概述

### 1.1 OWASP Top 10

| 排名 | 威胁 | 描述 |
|------|------|------|
| 1 | **注入漏洞** | SQL注入、命令注入等 |
| 2 | **失效的访问控制** | 未授权访问 |
| 3 | **XML外部实体（XXE）** | XML解析漏洞 |
| 4 | **不安全的反序列化** | 反序列化漏洞 |
| 5 | **安全配置错误** | 默认配置不安全 |
| 6 | **使用过时的组件** | 使用有漏洞的库 |
| 7 | **识别和认证失败** | 身份验证缺陷 |
| 8 | **软件和数据完整性失效** | 数据篡改 |
| 9 | **安全日志不足** | 日志记录不当 |
| 10 | **服务端请求伪造（SSRF）** | 伪造服务器请求 |

### 1.2 Web应用安全层次

```
Web应用安全层次：

┌─────────────────────────────────────────────────────┐
│              应用层安全                          │
│  ┌───────────────────────────────────────────┐  │
│  │  输入验证、输出编码、访问控制        │  │
│  └───────────────────────────────────────────┘  │
│              │                                    │
│              ▼                                    │
│  ┌───────────────────────────────────────────┐  │
│  │             通信层安全                 │  │
│  │  HTTPS、TLS/SSL、加密传输              │  │
│  └───────────────────────────────────────────┘  │
│              │                                    │
│              ▼                                    │
│  ┌───────────────────────────────────────────┐  │
│  │             网络层安全                 │  │
│  │  防火墙、入侵检测、DDoS防护          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. XSS攻击防护

### 2.1 XSS攻击类型

```javascript
// 1. 存储型XSS（Stored XSS）
// 恶意数据存储在服务器，每次加载页面时执行
// 例如：用户评论、论坛帖子

// 攻击示例（恶意用户输入）
const maliciousInput = '<script>alert("XSS攻击")</script>';

// 不安全的存储
database.saveComment(maliciousInput);

// 渲染时执行XSS
app.get('/comments', (req, res) => {
    const comments = database.getAllComments();
    res.render('comments', { comments });  // 危险！
});

// 2. 反射型XSS（Reflected XSS）
// 恶意输入通过URL或表单提交，服务器反射回页面

// 攻击示例
// GET /search?q=<script>alert("XSS")</script>

app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send(`搜索结果：${query}`);  // 危险！
});

// 3. DOM型XSS（DOM-based XSS）
// 恶意数据修改DOM，攻击在客户端执行

// 攻击示例
const maliciousHash = '#<script>alert("XSS")</script>';
window.location.hash = maliciousHash;  // 某些浏览器会执行
```

### 2.2 XSS防护措施

```javascript
// 1. 输出编码（核心防护）
const escape = require('lodash/escape');  // 使用成熟的库

// 对所有用户输入进行HTML编码
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// 或使用现成库
const xss = require('xss');
const cleanHTML = xss(maliciousInput);

// 2. 内容安全策略（CSP）
// 设置HTTP响应头
app.use((req, res, next) => {
    // 只允许从同源加载脚本和样式
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self';"
    );
    next();
});

// 或在HTML中设置meta标签
/*
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
*/

// 3. 框架内置防护
// React自动转义
const userInput = '<script>alert("XSS")</script>';
function UserInput({ value }) {
    return <div>{value}</div>;  // React自动转义，安全
}

// Vue自动转义
<div>{{ userInput }}</div>  <!-- {{ }} 自动转义 -->

// 需要输出HTML时使用v-html（谨慎使用）
<div v-html="safeHTML"></div>  // 确保HTML是安全的

// 4. 输入验证
function validateInput(input) {
    // 白名单验证
    const allowedChars = /^[a-zA-Z0-9\s\-_.,?!]+$/;
    return allowedChars.test(input);
}

// 5. HttpOnly Cookie
// 防止JavaScript访问Cookie
app.use((req, res, next) => {
    res.cookie('sessionId', sessionId, {
        httpOnly: true,  // JavaScript无法读取
        secure: true,    // 仅HTTPS
        sameSite: 'strict'  // 防止CSRF
    });
    next();
});

// 6. 禁用危险的JavaScript功能
// 禁用eval
const unsafeCode = 'alert("XSS")';
// eval(unsafeCode);  // 绝对不要用！

// 使用Function构造函数（同样危险）
// new Function(unsafeCode)();  // 不要用！

// 动态创建脚本危险
// const script = document.createElement('script');
// script.innerHTML = unsafeCode;  // 不要用！
```

### 2.3 修复XSS漏洞的完整示例

```javascript
// 后端防护
const xss = require('xss');
const validator = require('validator');

class CommentService {
    async addComment(userId, content) {
        // 1. 输入验证
        if (!validator.isLength(content, 1, 1000)) {
            throw new Error('评论内容长度必须在1-1000字符之间');
        }

        // 2. 清理恶意HTML
        const sanitizedContent = xss(content);

        // 3. 保存到数据库
        return await database.saveComment({
            userId,
            content: sanitizedContent,
            createdAt: new Date()
        });
    }

    async getComments() {
        const comments = await database.getAllComments();

        // 4. 再次验证输出
        return comments.map(comment => ({
            ...comment,
            content: xss(comment.content)  // 双重保险
        }));
    }
}

// 前端防护（React）
function CommentList({ comments }) {
    return (
        <div className="comments">
            {comments.map((comment, index) => (
                <div key={index} className="comment">
                    <p>{comment.content}</p>
                    <p>作者：{comment.author}</p>
                    <p>时间：{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
}

// CSP配置
// next.config.js
module.exports = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https:",
                            "font-src 'self'",
                            "connect-src 'self'",
                            "frame-ancestors 'none'",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-src 'self'",
                            "manifest-src 'self'"
                        ].join('; ')
                    }
                ]
            }
        ];
    }
};
```

---

## 3. CSRF攻击防护

### 3.1 CSRF攻击原理

```javascript
// CSRF（Cross-Site Request Forgery）攻击流程：

/*
1. 用户登录银行网站，服务器返回Cookie
2. 用户访问恶意网站（同时持有银行Cookie）
3. 恶意网站包含隐藏表单或JavaScript，向银行网站发送请求
4. 浏览器自动携带Cookie，服务器认为是用户操作
5. 攻击成功（转账、修改密码等）
*/

// 攻击示例1：隐藏表单
// 恶意网站HTML
<html>
<body>
    <form action="https://bank.com/transfer" method="POST">
        <input type="hidden" name="to" value="attacker">
        <input type="hidden" name="amount" value="10000">
    </form>
    <script>
        document.forms[0].submit();  // 自动提交
    </script>
</body>
</html>

// 攻击示例2：JavaScript请求
// 恶意网站JavaScript
fetch('https://bank.com/transfer', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include',  // 包含Cookie
    body: JSON.stringify({
        to: 'attacker',
        amount: 10000
    })
});
```

### 3.2 CSRF防护措施

```javascript
// 1. CSRF Token（最常用方法）
const crypto = require('crypto');
const expressSession = require('express-session');

app.use(expressSession({
    secret: 'your-secret-key',
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    }
}));

// 生成CSRF Token
function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

// 中间件：为每个请求生成CSRF Token
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }

    // 将Token暴露给客户端
    res.locals.csrfToken = req.session.csrfToken;
    next();
});

// 验证CSRF Token
function validateCSRF(req, res, next) {
    const token = req.body.csrfToken || req.headers['x-csrf-token'];

    if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({
            error: 'CSRF验证失败',
            message: '无效的CSRF Token'
        });
    }

    // 验证后更新Token（防止重放）
    req.session.csrfToken = generateCSRFToken();
    next();
}

// 应用验证
app.post('/transfer', validateCSRF, (req, res) => {
    // 处理转账
});

// 前端使用（模板引擎）
/*
<form action="/transfer" method="POST">
    <input type="hidden" name="csrfToken" value="{{csrfToken}}">
    <input type="text" name="to">
    <input type="number" name="amount">
    <button type="submit">转账</button>
</form>
*/

// 前端使用（API）
const token = document.querySelector('meta[name="csrf-token"]').content;

fetch('/transfer', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
    },
    body: JSON.stringify({
        to: 'recipient',
        amount: 100
    })
});

// 2. SameSite Cookie属性
app.use((req, res, next) => {
    res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'  // 'strict', 'lax', 或 'none'
    });
    next();
});

// 3. 验证Referer和Origin头
function validateOrigin(req, res, next) {
    const allowedOrigins = [
        'https://yourdomain.com',
        'https://api.yourdomain.com'
    ];

    const origin = req.headers.origin || req.headers.referer;

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            error: '禁止的跨域请求',
            origin: origin
        });
    }

    next();
}

app.use(validateOrigin);

// 4. 双重提交Cookie
// 服务器生成两个Token，一个Cookie，一个隐藏字段
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        const token = generateCSRFToken();
        req.session.csrfToken = token;

        // 设置Cookie
        res.cookie('csrfToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
    }

    next();
});

// 验证双重Token
function validateDoubleToken(req, res, next) {
    const token = req.body.csrfToken;
    const cookieToken = req.cookies.csrfToken;

    if (!token || !cookieToken || token !== cookieToken) {
        return res.status(403).json({
            error: 'CSRF验证失败'
        });
    }

    next();
}
```

---

## 4. SQL注入防护

### 4.1 SQL注入攻击

```javascript
// 1. 基础SQL注入
// 危险代码
const username = req.body.username;  // "admin' OR '1'='1"
const password = req.body.password;

const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
// 实际执行的SQL：
// SELECT * FROM users WHERE username='admin' OR '1'='1' AND password='...'
// 结果：绕过密码验证

// 2. UNION注入
const productId = req.body.id;  // "1 UNION SELECT username, password FROM users"
const query = `SELECT name FROM products WHERE id=${productId}`;
// 泄漏用户名和密码

// 3. 盲注注入
const comment = req.body.comment;  // "'; DROP TABLE users; --"
const query = `INSERT INTO comments (content) VALUES ('${comment}')`;
// 删除users表
```

### 4.2 SQL注入防护措施

```javascript
// 1. 使用参数化查询（最重要）
const { Pool } = require('pg');
const pool = new Pool({ /* 配置 */ });

// ✅ 正确：参数化查询
async function getUser(username, password) {
    const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    const result = await pool.query(query, [username, password]);
    return result.rows[0];
}

// ❌ 错误：字符串拼接
async function getUserWrong(username, password) {
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const result = await pool.query(query);
    return result.rows[0];
}

// 2. 使用ORM
const { User } = require('./models');

// ✅ ORM自动参数化
async function getUser(username, password) {
    return await User.findOne({
        where: {
            username,
            password
        }
    });
}

// 3. 输入验证
function validateSqlInput(input) {
    // 拒除危险字符
    const dangerousPatterns = [
        /['";'"]/,      // 引号
        /--/,            // SQL注释
        /\bOR\b/i,       // OR操作
        /\bAND\b/i,      // AND操作
        /\bUNION\b/i,    // UNION操作
        /\bSELECT\b/i,   // SELECT
        /\bINSERT\b/i,   // INSERT
        /\bUPDATE\b/i,   // UPDATE
        /\bDELETE\b/i,   // DELETE
        /\bDROP\b/i      // DROP
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
}

// 4. 最小权限原则
// 应用使用有限权限的数据库用户
const pool = new Pool({
    user: 'app_user',      // 不是root！
    password: 'password',
    database: 'app_db',
    host: 'localhost',
    port: 5432,
    min: 2,
    max: 10
});

// 5. 输入白名单
const allowedColumns = ['id', 'name', 'email', 'createdAt'];

function validateColumn(column) {
    if (!allowedColumns.includes(column)) {
        throw new Error(`不允许的列：${column}`);
    }
    return column;
}

// 使用
const column = validateColumn(req.query.sortBy);
const query = `SELECT * FROM users ORDER BY ${column}`;

//`6. 使用存储过程（谨慎）
// 存储过程可以参数化，但要避免动态SQL
async function createUserSP(username, email) {
    const query = 'CALL create_user($1, $2)';
    await pool.query(query, [username, email]);
}
```

### 4.3 完整示例

```javascript
const { Pool } = require('pg');
const validator = require('validator');

class UserService {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            port: '5432'
        });
    }

    // 输入验证
    validateUsername(username) {
        // 长度验证
        if (!validator.isLength(username, 3, 30)) {
            throw new Error('用户名长度必须在3-30字符之间');
        }

        // 格式验证
        if (!validator.isAlphanumeric(username)) {
            throw new Error('用户名只能包含字母和数字');
        }

        return true;
    }

    validateEmail(email) {
        if (!validator.isEmail(email)) {
            throw new Error('无效的邮箱地址');
        }
        return true;
    }

    // 创建用户（参数化查询）
    async createUser(username, email, password) {
        // 验证输入
        this.validateUsername(username);
        this.validateEmail(email);

        // 密码哈希
        const passwordHash = await this.hashPassword(password);

        // 参数化查询
        const query = `
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, username, email, created_at
        `;

        try {
            const result = await this.pool.query(query, [
                username,
                email,
                passwordHash
            ]);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {  // 唯一约束
                throw new Error('用户名已存在');
            }
            throw error;
        }
    }

    // 查询用户（参数化查询）
    async findUser(username) {
        this.validateUsername(username);

        const query = 'SELECT id, username, email FROM users WHERE username = $1';
        const result = await this.pool.query(query, [username]);
        return result.rows[0];
    }

    // 验证密码（参数化查询）
    async verifyPassword(username, password) {
        this.validateUsername(username);

        const query = 'SELECT password_hash FROM users WHERE username = $1';
        const result = await this.pool.query(query, [username]);

        if (result.rows.length === 0) {
            return false;
        }

        const passwordHash = result.rows[0].password_hash;
        return await bcrypt.compare(password, passwordHash);
    }

    async hashPassword(password) {
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async searchUsers(filters) {
        // 验证排序字段
        const allowedColumns = ['username', 'email', 'created_at'];
        const orderBy = allowedColumns.includes(filters.orderBy)
            ? filters.orderBy
            : 'created_at';

        const orderDir = filters.orderDir === 'desc' ? 'DESC' : 'ASC';

        // 参数化查询
        const query = `
            SELECT id, username, email, created_at
            FROM users
            WHERE username ILIKE $1
               OR email ILIKE $2
            ORDER BY ${orderBy} ${orderDir}
            LIMIT $3 OFFSET $4
        `;

        const searchPattern = `%${filters.search || ''}%`;
        const result = await this.pool.query(query, [
            searchPattern,
            searchPattern,
            parseInt(filters.limit) || 10,
            parseInt(filters.offset) || 0
        ]);

        return result.rows;
    }
}
```

---

## 5. 认证与授权安全

### 5.1 密码安全

```javascript
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// 1. 密码哈希（永远不要存储明文密码）
async function hashPassword(password) {
    // ✅ 使用bcrypt（推荐）
    const salt = await bcrypt.genSalt(12);  // 12 rounds
    const hash = await bcrypt.hash(password, salt);
    return hash;

    // 或者使用简化的API
    const hash = await bcrypt.hash(password, 12);
    return hash;
}

// 2. 验证密码
async function verifyPassword(password, storedHash) {
    return await bcrypt.compare(password, storedHash);
}

// 使用
async function registerUser(username, password) {
    const passwordHash = await hashPassword(password);
    await database.saveUser({ username, passwordHash });
}

async function loginUser(username, password) {
    const user = await database.findUser(username);
    if (!user) {
        throw new Error('用户不存在');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        throw new Error('密码错误');
    }

    return user;
}

// 3. 密码强度要求
function validatePasswordStrength(password) {
    const errors = [];

    // 长度要求
    if (password.length < 8) {
        errors.push('密码长度至少8位');
    }

    // 复杂度要求
    if (!/[a-z]/.test(password)) {
        errors.push('必须包含小写字母');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('必须包含大写字母');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('必须包含数字');
    }

    if (!/[!@#$%^&*()_+\-=}\[\]{"}|:;"'<>,.?/]/.test(password)) {
        errors.push('必须包含特殊字符');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// 4. 密码重置
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

async function requestPasswordReset(email) {
    // 生成随机Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 设置过期时间（1小时）
    const expiresAt = new Date(Date.now() + 3600000);

    // 保存到数据库
    await database.saveResetToken({
        email,
        token: resetToken,
        expiresAt
    });

    // 发送邮件
    const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;

    await transporter.sendMail({
        from: 'noreply@yourdomain.com',
        to: email,
        subject: '密码重置',
        html: `<a href="${resetLink}">点击这里重置密码</a>`
    });
}

async function resetPassword(token, newPassword) {
    // 验证Token
    const tokenData = await database.getResetToken(token);

    if (!tokenData) {
        throw new Error('无效的重置Token');
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
        throw new Error('Token已过期');
    }

    // 更新密码
    const passwordHash = await hashPassword(newPassword);
    await database.updateUserPassword(tokenData.email, passwordHash);

    // 删除Token
    await database.deleteResetToken(token);
}
```

### 5.2 JWT安全

```javascript
const jwt = require('jsonwebtoken');

// 1. JWT配置
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET,  // 强环境变量
    expiresIn: '1h',               // 短期有效期
    algorithm: 'HS256'             // 推荐算法
};

// 2. 生成JWT
function generateToken(user) {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),  // 签发时间
        exp: Math.floor(Date.now() / 1000) + 3600  // 过期时间
    };

    const token = jwt.sign(payload, JWT_CONFIG.secret, {
        algorithm: JWT_CONFIG.algorithm
    });

    return token;
}

// 3. 验证JWT
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm]
        });

        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            if (error.message === 'jwt expired') {
                throw new Error('Token已过期');
            } else if (error.message === 'invalid signature') {
                throw new Error('无效的Token签名');
            }
        }
        throw new Error('Token验证失败');
    }
}

// 4. 刷新Token
function refreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret, {
            ignoreExpiration: true  // 忽略过期，生成新Token
        });

        // 生成新Token
        return generateToken({
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role
        });
    } catch (error) {
        throw new Error('Token刷新失败');
    }
}

// 5. JWT中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: '未提供认证Token'
        });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token无效或已过期',
            message: error.message
        });
    }
}

// 6. 角色检查
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: '未认证'
            });
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({
                error: '权限不足',
                required: role
            });
        }

        next();
    };
}

// 使用
app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
    // 管理员功能
});

app.post('/api/auth/login', async (req, { res }) => {
    const { username, password } = req.body;

    try {
        const user = await loginUser(username, password);
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({
            error: error.message
        });
    }
});
```

---

## 6. 文件上传安全

### 6.1 文件上传漏洞

```javascript
// 1. 路径遍历攻击
// 用户提交：filename = "../../etc/passwd"
const filename = req.body.filename;
const filePath = `/uploads/${filename}`;
fs.readFile(filePath, ...);  // 读取系统敏感文件

// 2. 文件类型伪装
// 用户上传malicious.exe，但声称是image.png
const extension = req.file.name.split('.').pop();
// 保存时直接使用扩展名

// 3. 大文件DoS攻击
// 用户上传超大文件，耗尽服务器资源

// 4. 命令注入
// 上传包含恶意代码的文件，服务器执行
```

### 6.2 文件上传安全措施

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 1. 文件类型验证
const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
];

const ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.pdf'
];

function isAllowedFileType(mimeType, filename) {
    // 验证MIME类型
    if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
        return false;
    }

    // 验证文件扩展名
    const extension = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return false;
    }

    return true;
}

// 2. 文件大小限制
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB

function isFileSizeValid(size) {
    return size <= MAX_FILE_SIZE;
}

// 3. 文件名清理
function sanitizeFilename(filename) {
    // 移除路径遍历字符
    const sanitized = filename.replace(/[^\w\s.-]/gi, '');

    // 添加随机前缀防止冲突
    const prefix = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${sanitized}`;
}

// 4. multer配置
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        // 验证文件类型
        if (!isAllowedFileType(file.mimetype, file.originalname)) {
            return cb(new Error('不允许的文件类型'), false);
        }

        // 验证文件大小
        if (!isFileSizeValid(file.size)) {
            return cb(new Error('文件大小超过限制'), false);
        }

        // 验证文件名
        file.originalname = sanitizeFilename(file.originalname);

        cb(null, true);
    }
});

// 5. 安全存储文件
async function saveFileSafely(file) {
    // 生成安全文件名
    const safeFilename = sanitizeFilename(file.originalname);
    const uploadPath = path.join(__dirname, 'uploads', safeFilename);

    // 确保在uploads目录内
    const resolvedPath = path.resolve(uploadPath);
    const uploadsDir = path.resolve(path.join(__dirname, 'uploads'));

    if (!resolvedPath.startsWith(uploadsDir)) {
        throw new Error('非法文件路径');
    }

    // 保存文件
    return new Promise((resolve, reject) => {
        file.mv(uploadPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    filename: safeFilename,
                    path: resolvedPath,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }
        });
    });
}

// 6. 病毒扫描（可选）
const { execSync } = require('child_process');

function scanVirus(filePath) {
    try {
        // 使用ClamAV扫描
        const result = execSync(`clamscan --no-summary ${filePath}`);

        if (result.stdout.includes('FOUND')) {
            throw new Error('检测到病毒');
        }

        return true;
    } catch (error) {
        console.error('病毒扫描失败', error);
        return false;  // 病毒扫描失败不应阻止上传
    }
}

// 7. 图片验证
const sharp = require('sharp');

async function validateImage(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();

        // 验证图片尺寸
        if (metadata.width > 5000 || metadata.height > 5000) {
            throw new Error('图片尺寸过大');
        }

        // 验证图片格式
        if (!['jpeg', 'png', 'gif', 'webp'].includes(metadata.format)) {
            throw new Error('不支持的图片格式');
        }

        return true;
    } catch (error) {
        throw new Error('图片验证失败');
    }
}

// 8. 完整上传处理
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: '未提供文件'
            });
        }

        // 病毒扫描（可选）
        await scanVirus(req.file.path);

        // 图片验证（如果是图片）
        if (req.file.mimetype.startsWith('image/')) {
            await validateImage(req.file.path);
        }

        // 安全存储
        const fileInfo = await saveFileSafely(req.file);

        // 保存到数据库
        const savedFile = await database.saveFile({
            ...fileInfo,
            uploadedBy: req.user.userId,
            uploadedAt: new Date()
        });

        res.json({
            message: '文件上传成功',
            file: savedFile
        });
    } catch (error) {
        // 删除临时文件
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }

        res.status(400).json({
            error: error.message
        });
    }
});
```

---

## 7. 敏感数据保护

### 7.1 敏感数据处理

```javascript
const crypto = require('crypto');

// 1. 环境变量（推荐）
// ✅ 正确：使用环境变量
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;

// ❌ 错误：硬编码敏感数据
const dbPassword = 'password123';
const apiKey = 'sk-1234567890';

// 2. 敏感数据加密
const ENCRYPTION_KEY = crypto.randomBytes(32);
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        ENCRYPTION_ALGORITHM,
        ENCRYPTION_KEY,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        data: encrypted.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

function decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        ENCRYPTION_KEY,
        Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData.data, 'hex')),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}

// 3. 日志脱敏
const { redact } = require('clean-redact');

function logSensitiveData(data) {
    // 脱敏敏感字段
    const sanitized = redact(data, {
        paths: ['password', 'token', 'apiKey'],
        replaceWith: '[REDACTED]'
    });

    console.log(sanitized);
}

// 使用
logSensitiveData({
    username: 'user',
    password: 'secret123',
    token: 'jwt-token-xyz',
    normalData: 'public data'
});

// 4. 错误信息脱敏
class SecurityError extends Error {
    constructor(message, sensitiveData = {}) {
        super(message);
        this.name = 'SecurityError';
        this.sensitiveData = sensitiveData;
    }

    toJSON() {
        return {
            error: this.message,
            code: 'SECURITY_ERROR'
        };
    }
}

// 5. 禁止在错误中泄露信息
app.use((error, req, res, next) => {
    // 生产环境不显示详细错误
    if (process.env.NODE_ENV === 'production') {
        console.error(error);
        return res.status(500).json({
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR'
        });
    }

    // 开发环境显示详细错误
    res.status(500).json({
        error: error.message,
        stack: error.stack
    });
});

// 6. 安全的比较（时序攻击防护）
function secureCompare(a, b) {
    // 使用crypto.timingSafeEqual进行恒定时间比较
    return crypto.timingSafeEqual(a, b);
}

// 7. API密钥安全
function validateApiKey(apiKey) {
    // 验证API密钥格式
    if (!/^sk-[a-zA-Z0-9]{32,}$/.test(apiKey)) {
        return false;
    }

    // 恒定时间比较（防止时序攻击）
    const validKeys = process.env.API_KEYS.split(',');
    return validKeys.some(key => secureCompare(key, apiKey));
}

app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || !validateApiKey(apiKey)) {
        return res.status(401).json({
            error: '无效的API密钥'
        });
    }

    next();
});
```

---

## 8. HTTPS配置

### 8.1 HTTPS配置

```javascript
// 1. Node.js HTTPS服务器
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem'),
    ca: fs.readFileSync('path/to/ca-bundle.crt'),
    requestCert: true,  // 要求客户端证书
    rejectUnauthorized: false,
    minVersion:  'TLSv1.2',
    ciphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
    ].join(':'),
    honorCipherOrder: true
};

const server = https.createServer(options, (req, res) => {
    res.writeHead(200);
    res.end('Secure content');
});

server.listen(443, () => {
    console.log('HTTPS服务器运行在443端口');
});

// 2. Express HTTPS配置（使用代理）
// 推荐使用Nginx或Apache作为反向代理
// 并处理SSL/TLS
```

### 8.2 Nginx HTTPS配置（推荐）

```nginx
# /etc/nginx/sites-available/your-site

# HTTP到HTTPS重定向
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书
    ssl_certificate /etc/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/yourdomain.com.key;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8;
    resolver_timeout 5s;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';" always;

    # 禁用服务器信息
    server_tokens off;

    # 限制请求大小
    client_max_body_size 10M;

    # 限制请求速率
    limit_req_zone 10m/s burst=20 nodelay;

    # 应用代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 安全检查清单

### 应用安全检查

- [ ] **输入验证**
  - [ ] 所有用户输入都经过验证
  - [ ] 使用白名单而非黑名单
  - [ ] 验证数据类型和格式
  - [ ] 限制输入长度

- [ ] **输出编码**
  - [ ] HTML上下文使用HTML编码
  - [ ] JavaScript上下文使用JS编码
  - [ ] URL上下文使用URL编码
  - [ ] JSON上下文使用JSON编码

- [ ] **SQL注入防护**
  - [ ] 使用参数化查询
  - [ ] 使用ORM
  - [ ] 验证排序字段
  - [ ] 使用有限权限数据库用户

- [ ] **XSS防护**
  - [ ] 设置CSP头
  - [ ] 使用HttpOnly Cookie
  - [ ] 对用户输出进行编码
  - [ ] 使用模板引擎自动转义

- [ ] **CSRF防护**
  - [ ] 使用CSRF Token
  - [ ] 验证Referer和Origin
  - [ ] 使用SameSite Cookie
  - [ ] 使用双重提交Cookie

- [ ] **认证与授权**
  - [ ] 使用强密码哈希（bcrypt）
  - [ ] JWT设置合理过期时间
  - [ ] 实施角色访问控制
  - [ ] 使用安全的密钥管理

- [ ] **文件上传**
  - [ ] 验证文件类型
  - [ ] 限制文件大小
  - [ ] 验证文件名
  - [ ] 扫描病毒（可选）

- [ ] **HTTPS/TLS**
  - [ ] 使用HTTPS
  - [ ] 配置正确的SSL/TLS
  - [ ] 使用强加密算法
  - [ ] 定期更新证书

---

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security.html)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

*本文档持续更新，最后更新于2026年3月*
