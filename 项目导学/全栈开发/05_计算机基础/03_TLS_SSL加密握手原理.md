# TLS/SSL 加密握手原理

> 前言：想象你正在给远方的朋友寄一封情书。你当然不希望邮递员、快递公司、或者任何中途截获这封信的人能够看到内容。你会怎么做？可能用信封封好，可能用锁锁住信封，甚至可能用只有你和朋友才能理解的暗语写信。TLS 就是互联网世界中的"信封+锁+暗语"，确保你的数据只有正确的收件人才能看到。

## 一、加密基础知识

### 1.1 为什么需要加密？

**明文传输的问题**：

```javascript
/**
 * 明文 HTTP 的风险
 */

// 场景：用户在咖啡厅使用公共 WiFi 访问银行网站
const plaintextRisks = {
  scenario: `
    1. 用户输入: https://bank.com/login
    2. 用户提交: username=zhangsan&password=123456

    问题：
    - 同一网络的攻击者可以截获所有数据包
    - 用户名和密码完全暴露
    - Cookie 可以被窃取
    - 攻击者可以修改请求内容
  `,

  attackExample: `
    # 攻击者使用 Wireshark 抓包
    # 同一个 WiFi 网络下，可以直接看到：

    POST /login HTTP/1.1
    Host: bank.com
    Content-Type: application/x-www-form-urlencoded

    username=zhangsan&password=123456

    # 攻击者直接拿到了用户名和密码！
  `,

  consequence: `
    后果：
    1. 用户密码泄露
    2. 账户资金被盗
    3. 个人隐私暴露
    4. 可能遭遇中间人攻击（修改请求/响应）
  `,
};

// 解决方案
const solution = `
  使用 HTTPS = HTTP + TLS

  加密后传输的内容：
  攻击者看到的是：
  加密内容: gibberish_#$@%&*(

  只有正确的接收方才能解密
`;
```

### 1.2 对称加密：同一个钥匙

**类比理解**：

```
对称加密 = 用同一把钥匙锁门和开门

┌─────────────────────────────────────────────────────────────┐
│  发送方                                            接收方     │
│                                                             │
│    原文件: "Hello"                                          │
│         │                                                   │
│         ▼ 加密（用钥匙A）                                    │
│    加密后: "#$%&*("                                          │
│         │                                                   │
│         ├───────────────────────────┤                       │
│         │                           │                       │
│         │  （网络传输，可能被截获）   │                       │
│         │                           │                       │
│         ├───────────────────────────┤                       │
│         │                           │                       │
│         ▼ 解密（用同一把钥匙A）      ▼                       │
│    "Hello"                                                  │
│                                                             │
│  钥匙A = 12345678（同一把钥匙）                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**代码实现**：

```javascript
/**
 * 对称加密详解
 *
 * 特点：
 * - 加密和解密使用同一个密钥
 * - 优点：速度快，计算量小
 * - 缺点：密钥传输困难（如何安全传递密钥？）
 */

const crypto = require('crypto');

// AES 对称加密示例（AES-128-CBC）
const symmetricEncryption = {
  // 加密函数
  encrypt: (plaintext, key) => {
    // AES-128 使用 16 字节密钥
    // AES-256 使用 32 字节密钥
    const iv = crypto.randomBytes(16);  // 初始化向量

    const cipher = crypto.createCipheriv(
      'aes-128-cbc',    // 算法
      Buffer.from(key), // 密钥（16字节）
      iv                // 初始化向量
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),      // 需要传输给接收方
      encryptedData: encrypted,
    };
  },

  // 解密函数
  decrypt: (encryptedData, key, iv) => {
    const decipher = crypto.createDecipheriv(
      'aes-128-cbc',
      Buffer.from(key),
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },
};

// 测试
const key = '0123456789abcdef';  // 16字节密钥
const plaintext = 'Hello, 这是一段加密内容！';

console.log('原文:', plaintext);

const encrypted = symmetricEncryption.encrypt(plaintext, key);
console.log('加密后:', encrypted);

const decrypted = symmetricEncryption.decrypt(
  encrypted.encryptedData,
  key,
  encrypted.iv
);
console.log('解密后:', decrypted);

// 对称加密的密钥配送问题
const keyDistributionProblem = `
  对称加密的最大问题：密钥如何安全传递？

  场景：
  1. 客户端要给服务器发送加密数据
  2. 需要一个密钥
  3. 但密钥本身怎么传输？

  如果密钥被截获，加密就毫无意义！

  解决方案：
  1. 线下交换密钥（不现实）
  2. 非对称加密（解决密钥传输问题）
`;
```

### 1.3 非对称加密：公钥与私钥

**类比理解**：

```
非对称加密 = 信箱 + 钥匙

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   服务器生成一对钥匙：                                       │
│   - 公钥（Public Key）：像信箱口，大家都可以往里投信           │
│   - 私钥（Private Key）：像信箱钥匙，只有服务器自己有         │
│                                                             │
│   ┌─────────────┐                                          │
│   │    信箱      │                                          │
│   │             │                                          │
│   │   投信口     │ ◄── 公钥（公开，谁都可以用）               │
│   │   (只能投)   │                                          │
│   │             │                                          │
│   │   取信口     │ ◄── 私钥（只有服务器能开）                 │
│   │   (只能取)   │                                          │
│   └─────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

发送过程：
1. 客户端获取服务器的公钥
2. 用公钥加密数据
3. 只有服务器的私钥能解密
```

**代码实现**：

```javascript
/**
 * 非对称加密详解
 *
 * 常用算法：RSA, ECC（椭圆曲线加密）
 *
 * RSA 原理：
 * - 基于大数分解的困难性
 * - 很难将一个很大的数分解成两个质数
 *
 * 典型应用：
 * - 密钥交换（传递对称密钥）
 * - 数字签名（验证身份）
 */

const crypto = require('crypto');

// RSA 密钥对生成
const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,  // 密钥长度，越长越安全但越慢
    publicKeyEncoding: {
      type: 'spki',       // 公钥格式
      format: 'pem',      // PEM 格式（Base64 编码）
    },
    privateKeyEncoding: {
      type: 'pkcs8',      // 私钥格式
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
};

const { publicKey, privateKey } = generateKeyPair();

console.log('公钥:', publicKey.substring(0, 50) + '...');
console.log('私钥:', privateKey.substring(0, 50) + '...');

// 使用公钥加密
const encryptWithPublicKey = (plaintext) => {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(plaintext, 'utf8')
  );

  return encrypted.toString('base64');
};

// 使用私钥解密
const decryptWithPrivateKey = (encrypted) => {
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encrypted, 'base64')
  );

  return decrypted.toString('utf8');
};

// 测试
const message = 'Hello, 这是一条机密信息！';

console.log('\n=== RSA 加密测试 ===');
console.log('原文:', message);

const encryptedMessage = encryptWithPublicKey(message);
console.log('加密后:', encryptedMessage.substring(0, 50) + '...');

const decryptedMessage = decryptWithPrivateKey(encryptedMessage);
console.log('解密后:', decryptedMessage);

// RSA 签名（私钥签名，公钥验证）
const { generateKeyPairSync } = crypto;

const signData = () => {
  // 生成签名用的密钥对（与加密密钥对不同）
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const data = '这是一份需要签名的文件';

  // 1. 对数据计算哈希
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  // 2. 用私钥签名（对哈希进行加密）
  const sign = crypto.sign('sha256', Buffer.from(data), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });

  console.log('数据:', data);
  console.log('哈希:', hash);
  console.log('签名:', sign.toString('base64').substring(0, 50) + '...');

  // 3. 验证签名
  const isValid = crypto.verify(
    'sha256',
    Buffer.from(data),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    sign
  );

  console.log('签名验证:', isValid ? '有效 ✓' : '无效 ✗');

  // 4. 篡改数据后再验证
  const tamperedData = '这是一份被篡改的文件';
  const isValidTampered = crypto.verify(
    'sha256',
    Buffer.from(tamperedData),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    sign
  );

  console.log('篡改后验证:', isValidTampered ? '有效（不应该）' : '无效（正确）');
};

signData();

// 对称加密 vs 非对称加密
const comparison = `
┌─────────────────────────────────────────────────────────────────┐
│                    对称加密 vs 非对称加密对比                    │
├────────────────────┬────────────────────┬──────────────────────┤
│        特性        │      对称加密       │      非对称加密        │
├────────────────────┼────────────────────┼──────────────────────┤
│ 密钥数量           │     一个（共享）     │      两个（公钥+私钥） │
│ 加密速度           │      快 10-100倍    │         慢           │
│ 适用场景           │    大量数据加密     │      密钥交换/签名    │
│ 密钥传输           │      困难           │       相对安全        │
│ 典型算法           │   AES, DES, 3DES   │    RSA, ECC, ECDH    │
└────────────────────┴────────────────────┴──────────────────────┘

实际应用：HTTPS 同时使用两者
- 非对称加密：传递对称加密的密钥（解决密钥配送问题）
- 对称加密：加密实际传输的数据（速度快）
`;
```

### 1.4 混合加密：取长补短

```javascript
/**
 * 混合加密方案
 *
 * 思路：结合两种加密方式的优点
 *
 * 1. 使用非对称加密传递对称密钥（解决配送问题）
 * 2. 使用对称加密加密实际数据（速度快）
 */

const hybridEncryption = {
  // 场景：客户端与服务器的安全通信
  scenario: `
    1. 服务器生成非对称密钥对（公钥+私钥）
    2. 服务器把公钥给客户端（公钥可以公开）
    3. 客户端生成一个对称密钥（session key）
    4. 客户端用公钥加密对称密钥，发送给服务器
    5. 服务器用私钥解密，得到对称密钥
    6. 双方用对称密钥加密数据进行通信
  `,

  // 实际代码实现
  implementation: `
    // 模拟 HTTPS 的密钥交换过程

    // 1. 服务器准备
    const serverKeyPair = generateRSAKeyPair();
    const serverPublicKey = serverKeyPair.publicKey;

    // 2. 客户端生成会话密钥
    const sessionKey = crypto.randomBytes(32);  // 32字节 AES-256 密钥

    // 3. 客户端用服务器公钥加密会话密钥
    const encryptedSessionKey = crypto.publicEncrypt(
      {
        key: serverPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      sessionKey
    );

    // 4. 服务器用私钥解密，得到会话密钥
    const decryptedSessionKey = crypto.privateDecrypt(
      {
        key: serverKeyPair.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedSessionKey
    );

    // 5. 验证密钥一致
    console.log('密钥交换成功:', sessionKey.equals(decryptedSessionKey));

    // 6. 后续使用对称加密通信
    // ... 使用 sessionKey 加密数据 ...
  `,

  // 安全性分析
  securityAnalysis: `
    Q: 如果攻击者截获了公钥加密的会话密钥，能解密吗？
    A: 不能。只有服务器的私钥能解密。

    Q: 如果攻击者截获了加密的数据，能解密吗？
    A: 不能。因为用的是对称加密，攻击者不知道会话密钥。

    Q: 攻击者能伪造数据吗？
    A: 不能。需要会话密钥才能加密/解密数据。
  `,
};
```

## 二、数字证书与 CA 机构

### 2.1 为什么要数字证书？

**问题：中间人攻击**：

```javascript
/**
 * 中间人攻击（Man-in-the-Middle Attack）
 *
 * 即使使用非对称加密，如果不验证公钥的真实性
 * 仍然可能被攻击
 */

const mitmAttack = {
  scenario: `
    攻击场景：

    1. 攻击者准备一个自己的密钥对
    2. 截获服务器发给客户端的公钥
    3. 把自己的公钥发给客户端（冒充服务器）
    4. 客户端用攻击者的公钥加密数据
    5. 攻击者用自己的私钥解密（拿到数据）
    6. 攻击者用服务器的公钥加密数据，发给服务器

    结果：攻击者能看到所有通信内容！

    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    │   客户端                    攻击者                   服务器     │
    │      │                        │                      │       │
    │      │──── 获取公钥 ──────────▶│───── 转发公钥 ──────▶│       │
    │      │                        │                      │       │
    │      │    （收到攻击者的公钥）  │                      │       │
    │      │                        │                      │       │
    │      │──── 加密数据 ──────────▶│                      │       │
    │      │    （用攻击者公钥加密）  │                      │       │
    │      │                        │──── 解密 ────────────▶│       │
    │      │                        │──── 转发 ────────────▶│       │
    │      │◀────── 响应 ────────────│◀────── 响应 ─────────│       │
    │                                                     │
    └─────────────────────────────────────────────────────┘
  `,

  rootCause: `
    根本原因：
    客户端无法确认收到的公钥是否真的是服务器的！

    需要一个机制验证：
    "这个公钥确实属于服务器，而不是攻击者"
  `,
};

// 解决方案：数字证书
const certificateSolution = `
  数字证书 = 服务器身份 + 公钥 + 数字签名

  证书由 CA（Certificate Authority，证书颁发机构）颁发
  CA 就像是网络世界的"公证处"

  类比：
  - 身份证：由政府颁发，证明"这个人是张三"
  - 数字证书：由 CA 颁发，证明"这个公钥属于 example.com"
`;
```

### 2.2 数字证书结构

```javascript
/**
 * X.509 数字证书结构
 *
 * X.509 是国际标准的证书格式
 * 广泛用于 TLS/SSL、代码签名、邮件加密等
 */

const certificateStructure = {
  // 证书内容（明文部分）
  tbsCertificate: `
    版本 (Version)
    - v1, v2, v3
    - TLS 证书通常是 v3

    序列号 (Serial Number)
    - CA 分配的唯一编号
    - 用于撤销证书等操作

    签名算法 (Signature Algorithm)
    - 使用的签名算法，如 SHA256withRSA

    颁发者 (Issuer)
    - 颁发证书的 CA 信息
    - 如：DigiCert Inc, US

    有效期 (Validity)
    - Not Before: 生效时间
    - Not After: 过期时间

    主题 (Subject)
    - 证书持有者的信息
    - 如：*.example.com

    公钥信息 (Subject Public Key Info)
    - 公钥
    - 公钥算法
  `,

  // CA 的签名（密文部分）
  signatureAlgorithm: `
    签名算法
    - CA 使用什么算法签名
    - 如：SHA256withRSA
  `,

  signatureValue: `
    CA 的数字签名
    - CA 对 TBSCertificate 的签名
    - 任何人都可以用 CA 公钥验证
  `,

  // 实际证书示例
  realCertificate: `
    Certificate:
        Data:
            Version: v3
            Serial Number: 04:00:00:00:00:00:00:00:0D:...
            Signature Algorithm: SHA256withRSA
            Issuer:
                Country: US
                Organization: DigiCert Inc
            Validity:
                Not Before: Jan  1 00:00:00 2025 GMT
                Not After:  Jan  1 00:00:00 2026 GMT
            Subject:
                CN: *.example.com
                O: Example Inc
            Subject Public Key Info:
                Public Key Algorithm: RSA
                RSA Public Key:
                    Modulus: (2048 bit)
                    Exponent: 65537
            X509v3 Extensions:
                ...
    Signature Algorithm: SHA256withRSA
    Signature Value: 00:A1:B2:C3:D4:E5:...
  `,
};

// 解析证书
const parseCertificate = `
  // 使用 Node.js 解析证书
  const https = require('https');
  const crypto = require('crypto');

  // 获取 example.com 的证书
  const socket = new crypto.TLSSocket();

  // 实际项目中可以用下面命令查看证书信息
  // openssl s_client -connect example.com:443 -showcerts

  // 查看证书内容的命令
  // openssl x509 -in certificate.crt -text -noout

  /**
   * 证书验证流程
   *
   * 1. 浏览器收到服务器证书
   * 2. 检查证书是否过期
   * 3. 检查证书的域名是否匹配
   * 4. 检查证书颁发者是否可信
   * 5. 验证证书的签名（用 CA 公钥解密签名，对比哈希）
   * 6. 检查证书是否在撤销列表中（CRL/OCSP）
   */
`;
```

### 2.3 CA 机构与证书链

```javascript
/**
 * CA（Certificate Authority）机构
 *
 * CA 是受信任的证书颁发机构
 * 浏览器/操作系统内置了受信任 CA 的根证书
 */

const caHierarchy = {
  // CA 层级结构
  levels: `
    根 CA（Root CA）
    │
    ├── 中间 CA 1（Intermediate CA）
    │   └── 服务器证书 A
    │
    └── 中间 CA 2（Intermediate CA）
        ├── 服务器证书 B
        └── 服务器证书 C
  `,

  // 根证书
  rootCertificate: `
    根证书特点：
    1. 自签名（用自己的私钥签自己的公钥）
    2. 预装在浏览器/操作系统中
    3. 数量有限（约 200 个）

    知名根 CA：
    - DigiCert
    - GlobalSign
    - Comodo
    - Let's Encrypt（免费）
  `,

  // 中间证书
  intermediateCertificate: `
    为什么需要中间 CA？

    1. 根证书太重要，不能随便用
       - 每次签发都增加根密钥泄露风险

    2. 分离权限
       - 给不同的中间 CA 不同的权限
       - 可以吊销某个中间 CA 而不影响其他

    3. 历史上曾发生根 CA 被攻击的事件
       - 需要能够及时吊销
  `,

  // 证书链
  certificateChain: `
    证书链验证过程：

    1. 服务器发送自己的证书 + 中间证书
    2. 浏览器用中间证书验证服务器证书
    3. 浏览器用根证书验证中间证书
    4. 根证书在本地验证

    ┌─────────────────────────────────────┐
    │          根证书（本地信任）          │
    │  Issuer: Root CA                    │
    │  Subject: Root CA                   │
    │  公钥: Root CA 公钥                 │
    └────────────────┬────────────────────┘
                     │ 验证
                     ▼
    ┌─────────────────────────────────────┐
    │         中间证书（服务器提供）        │
    │  Issuer: Root CA                    │
    │  Subject: Intermediate CA           │
    │  签名: Root CA 签名                   │
    └────────────────┬────────────────────┘
                     │ 验证
                     ▼
    ┌─────────────────────────────────────┐
    │         服务器证书（服务器提供）       │
    │  Issuer: Intermediate CA            │
    │  Subject: *.example.com              │
    │  公钥: example.com 公钥               │
    │  签名: Intermediate CA 签名          │
    └─────────────────────────────────────┘
  `,
};

// 证书链验证代码
const chainVerification = `
  // Node.js 自动验证证书链
  const https = require('https');

  // Node.js 会自动：
  // 1. 获取服务器证书
  // 2. 检查证书链
  // 3. 验证每个证书的签名
  // 4. 检查有效期
  // 5. 检查域名匹配

  https.get('https://example.com', (res) => {
    console.log('证书验证通过');
  }).on('error', (err) => {
    console.error('证书错误:', err.message);
  });

  // 查看证书链命令
  // openssl s_client -connect example.com:443 -showcerts
`;
```

### 2.4 证书类型

```javascript
/**
 * 不同类型的证书
 */

const certificateTypes = {
  // 1. 域名验证证书（DV）
  dvCertificate: `
    验证级别：只需证明你控制这个域名

    验证方式：
    - 邮箱验证：给域名管理员邮箱发验证邮件
    - DNS 验证：在 DNS 中添加一条记录
    - HTTP 验证：在网站特定路径放验证文件

    颁发时间：几分钟到几小时
    价格：免费（Let's Encrypt）或 $5-50/年
    浏览器地址栏：显示锁图标，无公司信息

    适用：个人网站、博客、不涉及交易的网站
  `,

  // 2. 组织验证证书（OV）
  ovCertificate: `
    验证级别：验证域名 + 验证组织身份

    验证方式：
    - 域名验证（同 DV）
    - 组织验证：验证公司合法存在
      · 营业执照
      · 电话验证
      · 第三方数据库验证

    颁发时间：1-5 天
    价格：$50-200/年
    浏览器地址栏：显示锁图标 + 公司名称（部分浏览器）

    适用：企业官网、电商平台
  `,

  // 3. 扩展验证证书（EV）
  evCertificate: `
    验证级别：最高，需要通过 CA 的严格审核

    验证方式：
    - 域名验证
    - 组织验证（更严格）
    - 物理存在验证
    - 联系方式验证
    - 签名授权验证

    颁发时间：1-7 天
    价格：$100-500/年
    浏览器地址栏：显示绿色公司名称

    适用：银行、金融、大型电商

    注意：Chrome 75+ 不再显示 EV 绿色公司名
  `,

  // 4. 通配符证书
  wildcardCertificate: `
    域名：*.example.com
    适用子域：无限制数量的子域
    如：
    - blog.example.com
    - api.example.com
    - cdn.example.com

    优点：一个证书覆盖所有子域
    缺点：不覆盖二级域名（如 example.com）
  `,

  // 证书类型对比
  comparison: `
  ┌────────────────────────────────────────────────────────────────┐
  │  类型   │  验证内容      │  颁发时间   │   价格    │   适用场景    │
  ├─────────┼───────────────┼─────────────┼──────────┼──────────────┤
  │   DV    │   域名控制     │  分钟-小时  │  免费-$50 │  个人/测试    │
  │   OV    │ 域名+组织     │   1-5天    │  $50-$200│  企业网站     │
  │   EV    │  严格审核      │   1-7天    │ $100-$500│  金融/银行    │
  │ 通配符  │  域名+子域     │   1-3天    │  $50-$300│  多子域网站   │
  └─────────┴───────────────┴─────────────┴──────────┴──────────────┘
  `,
};

// Let's Encrypt 免费证书
const letsEncrypt = `
  // 使用 Certbot 获取 Let's Encrypt 证书

  // 1. 安装 Certbot
  // apt install certbot python3-certbot-nginx

  // 2. 获取证书（nginx 插件）
  // certbot --nginx -d example.com -d www.example.com

  // 3. 自动续期
  // Let's Encrypt 证书有效期 90 天
  // Certbot 自动添加 cron 任务续期

  // 4. 手动续期测试
  // certbot renew --dry-run
`;
```

## 三、TLS 握手详解

### 3.1 TLS 版本历史

```javascript
/**
 * TLS 版本演进
 */

const tlsVersions = {
  // SSL → TLS 的演进
  history: `
    SSL 1.0: 从未公开发布（1994）
    SSL 2.0: 1995，已废弃（有安全漏洞）
    SSL 3.0: 1996，已废弃（POODLE 攻击）
    TLS 1.0: 1999，升级自 SSL 3.0（少量安全问题）
    TLS 1.1: 2006，已废弃（增加 CBC 攻击防护）
    TLS 1.2: 2008，目前主流
    TLS 1.3: 2018，最新版本，更快更安全
  `,

  // 各版本对比
  comparison: `
    TLS 1.2 vs TLS 1.3:

    TLS 1.2:
    - 需要 2-RTT 握手
    - 支持不安全的加密算法（3DES, RC4）
    - 支持 RSA 密钥交换（有前向保密风险）
    - 支持 SHA-1 签名

    TLS 1.3:
    - 只需要 1-RTT（首次）或 0-RTT（再次）
    - 移除不安全的算法
    - 必须使用前向保密（ECDHE）
    - 移除 SHA-1
    - 简化握手过程
  `,

  // 浏览器支持
  browserSupport: `
    TLS 1.3 支持情况（2024年）:
    - Chrome 70+
    - Firefox 63+
    - Safari 14+
    - Edge 79+

    主流网站 TLS 版本分布:
    - TLS 1.3: ~50%
    - TLS 1.2: ~50%
    - TLS 1.1/1.0: < 1%
  `,
};
```

### 3.2 TLS 1.2 握手过程

```javascript
/**
 * TLS 1.2 握手详解
 *
 * TLS 握手的目的：
 * 1. 验证服务器身份（通过证书）
 * 2. 商定加密算法
 * 3. 交换密钥
 * 4. 建立安全通道
 */

const tls12Handshake = {
  // 完整握手流程
  fullHandshake: `
    ┌─────────────────────────────────────────────────────────────────┐
    │                      TLS 1.2 握手过程                             │
    │                                                                 │
    │  客户端                                                    服务器   │
    │    │                                                          │   │
    │    │  1. ClientHello (支持的TLS版本, 加密算法, 随机数)           │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │  2. ServerHello (选择的TLS版本, 加密算法, 随机数)            │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  3. Certificate (服务器证书链)                              │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  4. ServerKeyExchange (DH参数, 签名)                       │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  5. ServerHelloDone                                       │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  6. ClientKeyExchange (DH客户端参数)                      │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │  7. ChangeCipherSpec (客户端准备完成)                       │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │  8. Finished (加密的握手消息摘要)                          │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │  9. ChangeCipherSpec (服务器准备完成)                       │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  10. Finished (加密的握手消息摘要)                         │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │══════════ 加密通信开始 ══════════                          │   │
    │    │◀─────────────────── HTTP 响应 ────────────────────────────▶│   │
    │    │                                                          │   │
    └─────────────────────────────────────────────────────────────────┘

    总耗时：2-RTT（Round Trip Time）
    每次 ClientHello/ServerHello 算 0.5-RTT，网络传输 1-RTT
  `,

  // 各阶段详解
  clientHello: `
    ClientHello 包含：

    1. TLS 版本
       - 客户端支持的最高 TLS 版本
       - 如：TLS 1.3, TLS 1.2

    2. 客户端随机数（Client Random）
       - 32 字节随机数
       - 用于后续密钥生成
       - 必须唯一且不可预测

    3. Session ID
       - 用于会话恢复
       - 如果有之前会话的 ID，可以快速恢复

    4. 加密套件（Cipher Suites）
       - 客户端支持的加密算法列表
       - 按优先级排序
       - 如：
         TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
         ↓         ↓        ↓      ↓      ↓
        密钥交换  签名算法   对称加密  模式   哈希算法

    5. 压缩方法
       - 通常是 null（压缩已被废弃）

    6. 扩展
       - SNI (Server Name Indication)
       - ALPN (Application-Layer Protocol Negotiation)
       - ...
  `,

  serverHello: `
    ServerHello 响应：

    1. 选择的 TLS 版本
       - 通常是客户端支持的最高版本

    2. 服务器随机数（Server Random）
       - 32 字节随机数
       - 与客户端随机数结合生成密钥

    3. Session ID
       - 如果可以恢复，发送相同的 ID
       - 否则发送新的 ID

    4. 选择的加密套件
       - 从客户端列表中选择
       - 通常是最强的那个

    5. 选择的压缩方法
       - 通常是 null
  `,

  certificate: `
    服务器证书：

    发送服务器证书链：
    1. 服务器证书
    2. 中间证书（如果有）

    不发送根证书（根证书在客户端本地）

    证书验证：
    1. 检查证书是否过期
    2. 检查域名是否匹配
    3. 验证证书链
    4. 检查证书是否被吊销
  `,

  serverKeyExchange: `
    DH/ECDH 密钥交换参数：

    如果使用 RSA 密钥交换：
    - 不需要此消息
    - 客户端直接用服务器公钥加密 pre-master secret

    如果使用 ECDHE 密钥交换：
    - 服务器发送 DH 参数
    - 服务器用私钥签名这些参数
    - 客户端验证签名
  `,

  clientKeyExchange: `
    客户端密钥交换：

    RSA 密钥交换：
    - 客户端生成 pre-master secret (48字节)
    - 用服务器公钥加密
    - 发送给服务器

    ECDHE 密钥交换：
    - 客户端生成自己的 DH 参数
    - 发送给服务器
    - 双方各自计算 pre-master secret
  `,

  // 密钥计算
  keyDerivation: `
    Pre-master secret → Master secret → Key material

    1. Pre-master secret
       RSA: 客户端随机生成
       ECDHE: 双方各自计算得到（相同的值）

    2. Master secret (48字节)
       master_secret = PRF(
         pre_master_secret,
         "master secret",
         ClientRandom + ServerRandom
       )

    3. Key material (密钥材料)
       - client_write_MAC_key
       - server_write_MAC_key
       - client_write_key (对称加密密钥)
       - server_write_key (对称加密密钥)
       - client_write_IV ( CBC 模式的初始化向量)
       - server_write_IV
  `,

  // Finished 消息
  finishedMessage: `
    Finished 消息：

    1. 包含之前所有握手消息的摘要
    2. 用协商好的密钥加密
    3. 双方验证解密后的摘要是否正确

    验证内容：
    - 握手过程没有被篡改
    - 密钥协商成功
  `,
};

// 代码模拟 TLS 握手
const tlsHandshakeSimulation = `
  // 模拟 TLS 1.2 RSA 密钥交换

  // 1. 客户端准备
  const clientRandom = crypto.randomBytes(32);
  console.log('客户端随机数:', clientRandom.toString('hex').substring(0, 16) + '...');

  // 2. 服务器准备
  const serverRandom = crypto.randomBytes(32);
  const { publicKey: serverPublicKey, privateKey: serverPrivateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  console.log('服务器随机数:', serverRandom.toString('hex').substring(0, 16) + '...');

  // 3. 服务器发送证书，客户端验证（省略）
  console.log('证书验证通过');

  // 4. 客户端生成 pre-master secret
  const preMasterSecret = crypto.randomBytes(48);
  console.log('Pre-master secret:', preMasterSecret.toString('hex').substring(0, 16) + '...');

  // 5. 客户端用服务器公钥加密 pre-master secret
  const encryptedPreMaster = crypto.publicEncrypt(
    {
      key: serverPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    preMasterSecret
  );
  console.log('加密的 Pre-master secret:', encryptedPreMaster.toString('hex').substring(0, 16) + '...');

  // 6. 服务器用私钥解密
  const decryptedPreMaster = crypto.privateDecrypt(
    {
      key: serverPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedPreMaster
  );
  console.log('解密 Pre-master secret:', decryptedPreMaster.toString('hex').substring(0, 16) + '...');

  // 7. 双方计算 master secret
  const masterSecret = crypto.createPRP('sha256')
    .update(preMasterSecret)
    .update('master secret')
    .update(Buffer.concat([clientRandom, serverRandom]))
    .digest();
  console.log('Master secret:', masterSecret.toString('hex').substring(0, 16) + '...');

  // 8. 验证成功
  console.log('Pre-master secret 匹配:', preMasterSecret.equals(decryptedPreMaster));
`;
```

### 3.3 TLS 1.3 握手过程

```javascript
/**
 * TLS 1.3 握手详解
 *
 * TLS 1.3 的主要改进：
 * 1. 1-RTT 握手（首次），0-RTT（再次连接）
 * 2. 移除不安全的加密算法
 * 3. 必须使用前向保密（PFS）
 * 4. 更简单的握手流程
 */

const tls13Handshake = {
  // TLS 1.3 握手流程
  handshake: `
    ┌─────────────────────────────────────────────────────────────────┐
    │                      TLS 1.3 握手过程                             │
    │                                                                 │
    │  客户端                                                    服务器   │
    │    │                                                          │   │
    │    │  1. ClientHello (支持的TLS版本, 加密算法, 客户端DH参数)     │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │  2. ServerHello (选择的TLS版本, 服务器DH参数)              │   │
    │    │    + Certificate (服务器证书)                            │   │
    │    │    + CertificateVerify (签名)                             │   │
    │    │    + Finished (加密的握手消息摘要)                          │   │
    │    │◀──────────────────────────────────────────────────────────│   │
    │    │                                                          │   │
    │    │  3. Finished (加密的握手消息摘要)                           │   │
    │    │──────────────────────────────────────────────────────────▶│   │
    │    │                                                          │   │
    │    │══════════ 加密通信开始 ══════════                          │   │
    │    │◀─────────────────── HTTP 响应 ────────────────────────────▶│   │
    │    │                                                          │   │
    └─────────────────────────────────────────────────────────────────┘

    总耗时：1-RTT（比 TLS 1.2 减少一半）
  `,

  // 与 TLS 1.2 的关键差异
  differences: `
    差异1：加密算法减少
    TLS 1.2 支持 30+ 加密套件
    TLS 1.3 只支持 5 个：
    - TLS_AES_128_GCM_SHA256
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_CCM_SHA256
    - TLS_AES_128_CCM_8_SHA256

    差异2：握手并行化
    TLS 1.2: ServerHello → Certificate → ServerHelloDone
    TLS 1.3: ServerHello + Certificate + Finished（一起发）

    差异3：密钥交换方式
    TLS 1.2: RSA 或 DH/ECDH
    TLS 1.3: 只支持 ECDHE（必须前向保密）

    差异4：握手开始就加密
    TLS 1.2: 前 5 个消息是明文
    TLS 1.3: 从 ServerHello 开始就加密
  `,

  // 0-RTT 快速恢复
  zeroRtt: `
    0-RTT 握手（再次连接时）：

    原理：客户端缓存之前会话的信息
    可以直接发送加密数据！

    ┌─────────────────────────────────────────────────────┐
    │  客户端                                              │
    │    │                                               │
    │    │  ClientHello + Early Data (加密)               │
    │    │───────────────────────────────────────────────▶│
    │    │                                               │
    │    │  ServerHello + Finished + 响应 (加密)          │
    │    │◀──────────────────────────────────────────────│
    │    │                                               │
    │    │════════ 加密通信 ════════                     │
    └─────────────────────────────────────────────────────┘

    总耗时：0-RTT

    但是！
    0-RTT 有重放攻击风险
    不适合敏感操作（如支付）
  `,

  // 前向保密（PFS）
  forwardSecrecy: `
    什么是前向保密？

    如果有人记录了加密的流量，后来拿到了服务器的私钥
    没有前向保密：可以解密所有流量
    有前向保密：只能解密当时的流量

    TLS 1.3 强制使用 ECDHE
    ECDHE 的特点：
    - 每次会话使用不同的临时 DH 密钥
    - 服务器私钥泄露不会影响之前的会话
  `,
};

// TLS 1.3 ECDHE 密钥交换详解
const ecdheKeyExchange = `
  // ECDHE 原理

  // 1. 双方同意使用一条曲线（如 secp256r1）
  // 2. 双方各生成一个随机数作为私钥
  // 3. 用私钥和曲线上的基点计算公钥
  // 4. 交换公钥
  // 5. 用对方的公钥和自己的私钥计算共享密钥

  // 数学原理
  // (a*G) * b = (b*G) * a = a*b*G

  // 实际例子
  // 私钥 a = 123, 公钥 A = a*G = 123 * G
  // 私钥 b = 456, 公钥 B = b*G = 456 * G
  //
  // 共享密钥 = a * B = 123 * (456 * G)
  //          = b * A = 456 * (123 * G)
  //          = 123 * 456 * G

  // 窃听者只知道 A 和 B，无法计算出共享密钥

  // ECDHE P-256 曲线示例
  const curve = 'prime256v1';  // 也叫 secp256r1

  // 生成密钥对
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: curve,
  });

  console.log('EC 私钥:', privateKey.export({ type: 'sec1' }).toString('hex').substring(0, 16) + '...');
  console.log('EC 公钥:', publicKey.export({ type: 'spki' }).toString('hex').substring(0, 16) + '...');
`;
```

### 3.4 实际握手代码解析

```javascript
/**
 * 实际项目中的 TLS 配置
 */

// Node.js HTTPS 服务器配置
const nodejsTlsConfig = `
  const https = require('https');
  const fs = require('fs');

  const options = {
    // 证书配置
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt'),
    ca: fs.readFileSync('/path/to/ca_bundle.crt'),  // 中间证书

    // TLS 版本（禁用不安全的版本）
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',

    // 加密套件
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
    ].join(':'),

    // 优先使用服务器指定的加密套件
    honorCipherOrder: true,

    // HSTS (HTTP Strict Transport Security)
    hsts: {
      maxAge: 31536000,  // 1年
      includeSubDomains: true,
    },

    // 会话复用
    sessionTimeout: 86400,  // 24小时
  };

  const server = https.createServer(options, (req, res) => {
    res.end('Hello, HTTPS!');
  });

  server.listen(443);
`;

// Nginx TLS 配置
const nginxTlsConfig = `
  server {
      listen 443 ssl http2;
      server_name example.com;

      # 证书配置
      ssl_certificate /path/to/certificate.crt;
      ssl_certificate_key /path/to/private.key;
      ssl_trusted_certificate /path/to/ca_bundle.crt;

      # TLS 版本
      ssl_protocols TLSv1.2 TLSv1.3;

      # 加密套件（TLS 1.3）
      ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;

      # 服务器优先
      ssl_prefer_server_ciphers on;

      # 会话缓存
      ssl_session_cache shared:SSL:10m;
      ssl_session_timeout 1d;

      # OCSP Stapling
      ssl_stapling on;
      ssl_stapling_verify on;
      resolver 8.8.8.8;

      # 安全头
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
      add_header X-Frame-Options DENY;
      add_header X-Content-Type-Options nosniff;
  }
`;

// 查看 TLS 连接信息
const checkTlsConnection = `
  # 使用 openssl 查看 TLS 信息
  openssl s_client -connect example.com:443 -tls1_3

  # 查看证书信息
  openssl s_client -connect example.com:443 -showcerts

  # 查看支持的 TLS 版本
  openssl s_client -connect example.com:443 -tls1_2

  # 在线工具
  # https://www.ssllabs.com/ssltest/  - 测试 SSL 配置
  # https://www.sslchecker.com/       - 检查证书链
`;
```

## 四、HTTPS 原理与实战

### 4.1 HTTPS 工作原理

```javascript
/**
 * HTTPS = HTTP + TLS
 *
 * HTTPS 在 HTTP 和 TCP 之间增加了一层 TLS
 * 数据在 TLS 层加密后，再交给 TCP 传输
 */

const https原理 = {
  // 协议栈对比
  compared: `
    HTTP:
    ┌────────────┐
    │    HTTP    │
    ├────────────┤
    │    TCP     │
    ├────────────┤
    │     IP     │
    └────────────┘

    HTTPS:
    ┌────────────┐
    │    HTTP    │
    ├────────────┤
    │    TLS     │  ← 新增的加密层
    ├────────────┤
    │    TCP     │
    ├────────────┤
    │     IP     │
    └────────────┘
  `,

  // HTTPS 请求过程
  requestProcess: `
    1. 浏览器解析 URL，发现是 https://
    2. 浏览器连接服务器的 443 端口
    3. TLS 握手（验证证书，协商密钥）
    4. 握手完成后，用协商的密钥加密 HTTP 请求
    5. 服务器用相同密钥解密，处理请求
    6. 服务器用相同密钥加密 HTTP 响应
    7. 浏览器解密响应，渲染页面
  `,

  // 加密的范围
  encryptedContent: `
    HTTPS 加密的内容：
    ✓ HTTP 请求行
    ✓ HTTP 请求头
    ✓ HTTP 请求体
    ✓ HTTP 响应头
    ✓ HTTP 响应体

    HTTPS 不加密的内容：
    ✗ 目标 IP 地址（需要知道路由）
    ✗ 目标端口（443 是默认的）
    ✗ DNS 查询（可能使用 DoH/DoT 加密）
    ✗ TLS 握手的前部分（ClientHello 是明文的）
  `,

  // HTTPS 的局限
  limitations: `
    HTTPS 不保护：
    1. 访问的域名（DNS 查询可能泄露）
    2. 数据大小（可以估计请求/响应大小）
    3. 访问时间（可以分析流量模式）
    4. TCP 元数据（窗口大小等）

    进一步保护可以使用：
    - VPN
    - Tor
    - DNS over HTTPS (DoH)
    - 洋葱服务
  `,
};
```

### 4.2 证书申请与部署

```javascript
/**
 * 证书申请完整流程
 */

// 方式1：Let's Encrypt 免费证书
const letsEncrypt = {
  // 使用 Certbot
  steps: `
    1. 安装 Certbot
       # Ubuntu/Debian
       sudo apt update
       sudo apt install certbot python3-certbot-nginx

    2. 停止 nginx（如果运行中）
       sudo systemctl stop nginx

    3. 获取证书（standalone 模式）
       sudo certbot certonly --standalone -d example.com -d www.example.com

    4. 按照提示输入邮箱，选择同意条款

    5. 证书保存位置
       /etc/letsencrypt/live/example.com/
       ├── fullchain.pem  (证书 + 中间证书)
       ├── privkey.pem    (私钥)
       └── cert.pem       (证书)

    6. 配置自动续期
       sudo certbot renew --dry-run
  `,

  // Nginx 配置
  nginxConfig: `
    server {
        listen 443 ssl;
        server_name example.com;

        ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

        # 安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name example.com;
        return 301 https://$host$request_uri;
    }
  `,
};

// 方式2：商业证书（以 DigiCert 为例）
const commercialCert = {
  steps: `
    1. 在 DigiCert 官网购买证书
       - 选择证书类型（DV/OV/EV）
       - 选择保护域名

    2. 生成 CSR (Certificate Signing Request)
       openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr

       内容包含：
       - 国家代码
       - 省份
       - 城市
       - 公司名称
       - 域名

    3. 提交 CSR 给 DigiCert

    4. DigiCert 验证域名所有权
       - 管理员邮箱验证
       - DNS 验证
       - 文件验证

    5. 下载证书
       - 证书文件 (.crt)
       - 中间证书 (DigiCertCA.crt)

    6. 部署到服务器
  `,

  // CSR 生成示例
  csrGeneration: `
    # 生成 CSR
    openssl req -new -newkey rsa:2048 -nodes \
        -keyout example.com.key \
        -out example.com.csr \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Example Inc/OU=IT/CN=*.example.com"

    # 查看 CSR 内容
    openssl req -in example.com.csr -noout -text

    # 验证私钥匹配
    openssl x509 -in example.com.crt -noout -modulus | md5sum
    openssl rsa -in example.com.key -noout -modulus | md5sum
    # 两个 md5sum 结果应该相同
  `,
};

// 方式3：自签名证书（仅用于开发）
const selfSignedCert = {
  // 生成自签名证书
  generate: `
    # 生成私钥和证书（一行命令）
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout localhost.key \
        -out localhost.crt \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Development/CN=localhost"

    # 查看证书
    openssl x509 -in localhost.crt -text -noout
  `,

  // Node.js 开发服务器
  nodejsDevServer: `
    const https = require('https');
    const fs = require('fs');
    const express = require('express');

    const app = express();

    // 使用自签名证书
    const options = {
      key: fs.readFileSync('localhost.key'),
      cert: fs.readFileSync('localhost.crt'),
    };

    https.createServer(options, app).listen(3000);

    // 访问时浏览器会报警
    // 需要手动信任证书
  `,
};
```

### 4.3 HTTPS 安全配置

```javascript
/**
 * HTTPS 安全配置清单
 */

// 1. 禁用不安全的 TLS 版本
const disableInsecureTls = `
  # 错误配置（允许 SSLv3）
  ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;

  # 正确配置（只允许 TLS 1.2 和 1.3）
  ssl_protocols TLSv1.2 TLSv1.3;

  # POODLE 攻击利用 SSLv3
  # BEAST 攻击利用 TLS 1.0
`;

// 2. 配置安全的加密套件
const secureCiphers = `
  # 推荐配置（TLS 1.2+）
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

  # TLS 1.3 专用（无法配置）
  # TLS_AES_256_GCM_SHA384
  # TLS_CHACHA20_POLY1305_SHA256
  # TLS_AES_128_GCM_SHA256

  # Nginx 配置
  ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers on;
`;

// 3. HSTS (HTTP Strict Transport Security)
const hsts = `
  # 强制使用 HTTPS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # 参数说明：
  # max-age=31536000: 浏览器缓存 1 年
  # includeSubDomains: 子域名也必须使用 HTTPS
  # preload: 申请加入 HSTS preload list

  # 警告：
  # - 设置前确保所有子域名都支持 HTTPS
  # - 一旦设置，强制生效，无法轻易撤销
`;

// 4. OCSP Stapling
const ocspStapling = `
  # 服务器主动获取 OCSP 响应
  # 在 TLS 握手时发送给客户端
  # 避免客户端额外查询 CA

  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 8.8.8.8 8.8.4.4 valid=300s;
  resolver_timeout 5s;
`;

// 5. 安全相关的响应头
const securityHeaders = `
  # 防止点击劫持
  add_header X-Frame-Options "DENY" always;

  # 防止 MIME 类型嗅探
  add_header X-Content-Type-Options "nosniff" always;

  # XSS 过滤器
  add_header X-XSS-Protection "1; mode=block" always;

  # 引用来源策略
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # 权限策略
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
`;

// 6. 使用 Let's Encrypt 配置示例
const fullNginxConfig = `
  server {
      listen 443 ssl http2;
      server_name example.com www.example.com;

      # 证书
      ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

      # TLS 配置
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
      ssl_prefer_server_ciphers on;
      ssl_session_cache shared:SSL:10m;
      ssl_session_timeout 1d;

      # OCSP Stapling
      ssl_stapling on;
      ssl_stapling_verify on;
      resolver 8.8.8.8;

      # 安全头
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
      add_header X-Frame-Options "DENY" always;
      add_header X-Content-Type-Options "nosniff" always;

      # 网站配置
      root /var/www/html;
      index index.html;

      location / {
          try_files $uri $uri/ =404;
      }
  }

  # HTTP 重定向
  server {
      listen 80;
      server_name example.com www.example.com;
      return 301 https://$host$request_uri;
  }
`;
```

### 4.4 证书验证与调试

```javascript
/**
 * 常见 HTTPS 问题排查
 */

// 问题1：证书链不完整
const incompleteChain = {
  symptom: '浏览器显示"证书链不完整"或"无效证书链"',
  cause: '服务器没有发送中间证书',
  solution: `
    # 检查证书链
    openssl s_client -connect example.com:443 -showcerts

    # 如果只看到一个证书，缺少中间证书
    # 需要在 nginx/apache 配置中添加中间证书

    # Nginx 配置（把中间证书追加到证书文件后面）
    cat server.crt intermediate.crt > fullchain.crt
    ssl_certificate /path/to/fullchain.crt;
  `,
};

// 问题2：证书过期
const expiredCert = {
  symptom: '浏览器显示"证书已过期"',
  cause: 'Let's Encrypt 证书 90 天过期，商业证书 1-2 年',
  solution: `
    # 检查证书有效期
    openssl x509 -in certificate.crt -noout -dates

    # Let's Encrypt 自动续期
    certbot renew

    # 添加 cron 任务
    0 0 * * * /usr/bin/certbot renew --quiet
  `,
};

// 问题3：域名不匹配
const domainMismatch = {
  symptom: '浏览器显示"此连接不是私密连接"或"证书无效"',
  cause: '证书绑定的域名与访问的域名不一致',
  solution: `
    # 检查证书支持的域名
    openssl x509 -in certificate.crt -noout -subject

    # 如果是 *.example.com
    # 可以访问 www.example.com，但不能访问 example.com
    # 需要通配符证书或 SAN 证书
  `,
};

// 问题4：自签名证书
const selfSignedIssue = {
  symptom: '浏览器显示"连接不安全"或"无效证书"',
  cause: '证书不是受信任 CA 签发的',
  solution: `
    # 方案1：购买受信任证书
    # Let's Encrypt（免费）或商业证书

    # 方案2：如果是开发环境，让浏览器信任自签名证书
    # Chrome: 设置 → 高级 → 管理证书 → 导入

    # 方案3：使用 mkcert 工具（自动配置本地信任）
    # brew install mkcert
    # mkcert -install
    # mkcert localhost
  `,
};

// 问题5：混合内容
const mixedContent = {
  symptom: '浏览器显示"混合内容"警告',
  cause: 'HTTPS 页面加载了 HTTP 资源（图片/CSS/JS）',
  solution: `
    # 检查控制台错误
    # Console 中会显示哪些资源是 HTTP 的

    # 修复方法
    # 1. 把所有 HTTP 资源改为 HTTPS
    <img src="https://cdn.example.com/image.png">

    # 2. 或使用协议相对 URL
    <img src="//cdn.example.com/image.png">

    # 3. 升级到 HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
  `,
};

// 常用调试命令
const debugCommands = `
  # 查看完整握手过程
  openssl s_client -connect example.com:443 -debug

  # 查看 TLS 版本
  openssl s_client -connect example.com:443 -tls1_2
  openssl s_client -connect example.com:443 -tls1_3

  # 查看证书详情
  openssl s_client -connect example.com:443 -showcerts | openssl x509 -text

  # 检查 OCSP Stapling
  openssl s_client -connect example.com:443 -status

  # 测试配置安全性（在线工具）
  # https://www.ssllabs.com/ssltest/
`;
```

## 五、实际应用场景

### 5.1 WebSocket over TLS

```javascript
/**
 * WSS (WebSocket Secure)
 *
 * WebSocket 可以在 TLS 上运行
 * 就像 HTTP over TLS = HTTPS
 * WebSocket over TLS = WSS
 */

const wssSetup = {
  // Node.js WSS 服务器
  nodejsServer: `
    const https = require('https');
    const fs = require('fs');
    const { WebSocketServer } = require('ws');

    // HTTPS 服务器
    const server = https.createServer({
      key: fs.readFileSync('/path/to/key.pem'),
      cert: fs.readFileSync('/path/to/cert.pem'),
    });

    // WebSocket 服务器
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      console.log('客户端连接');

      ws.on('message', (message) => {
        console.log('收到消息:', message.toString());
        ws.send('收到: ' + message.toString());
      });

      ws.on('close', () => {
        console.log('客户端断开');
      });
    });

    server.listen(8443);
  `,

  // 前端连接
  frontend: `
    // WSS URL
    const ws = new WebSocket('wss://example.com/socket');

    ws.onopen = () => {
      console.log('连接成功');
      ws.send('Hello');
    };

    ws.onmessage = (event) => {
      console.log('收到:', event.data);
    };

    ws.onerror = (error) => {
      console.error('错误:', error);
    };

    ws.onclose = () => {
      console.log('连接关闭');
    };
  `,

  // 为什么用 WSS 而不是 WS？
  whyWss: `
    WS (WebSocket):
    - 明文传输
    - 容易被中间人攻击
    - 不验证服务器身份

    WSS (WebSocket Secure):
    - 加密传输
    - 验证服务器身份
    - 防止中间人攻击
    - 生产环境必须使用
  `,
};
```

### 5.2 HTTP/2 over TLS

```javascript
/**
 * HTTP/2 over TLS
 *
 * HTTP/2 可以在 TLS 上运行
 * 现代浏览器只支持 HTTP/2 over TLS（h2）
 */

const http2Tls = {
  // 要求
  requirements: `
    1. TLS 1.2 或更高版本
    2. 支持 ALPN (Application-Layer Protocol Negotiation)
    3. 浏览器要求 TLS 握手时协商 h2 协议
  `,

  // Nginx 配置
  nginxConfig: `
    server {
        listen 443 ssl http2;
        server_name example.com;

        ssl_certificate /path/to/cert.pem;
        ssl_certificate_key /path/to/key.pem;

        # 必须的加密套件（HTTP/2 要求）
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # ALPN 协商（自动）
        # nginx 会告诉浏览器支持 h2
    }
  `,

  // Node.js HTTP/2
  nodejsHttp2: `
    const http2 = require('http2');
    const https = require('https');
    const fs = require('fs');

    const server = https.createServer({
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    });

    // HTTP/2 支持
    server.on('stream', (stream, headers) => {
      // HTTP/2 多路复用
      stream.respond({
        'content-type': 'text/html',
        ':status': 200,
      });
      stream.end('<h1>Hello HTTP/2!</h1>');
    });

    server.listen(443);
  `,

  // 验证 HTTP/2
  verify: `
    # Chrome DevTools
    # Network 面板 → Protocol 列显示 h2

    # 命令行验证
    curl -I --http2 https://example.com

    # 在线检查
    # https://tools.keycdn.com/http2-test
  `,
};
```

### 5.3 API 认证与签名

```javascript
/**
 * 使用 TLS + 签名进行 API 认证
 */

const apiAuthentication = {
  // 方案：使用 HMAC 签名
  hmacSignature: `
    原理：
    1. 客户端和服务器共享一个密钥
    2. 客户端用密钥对请求签名
    3. 服务器验证签名

    签名内容：
    - 请求方法
    - 请求路径
    - 时间戳
    - 请求体哈希
  `,

  // 实现
  implementation: `
    // 签名函数
    const crypto = require('crypto');

    function signRequest(method, path, body, secret, timestamp) {
      // 签名内容
      const message = method + path + timestamp + (body || '');

      // HMAC-SHA256 签名
      const signature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

      return signature;
    }

    // 客户端
    const secret = 'shared_secret_key';
    const timestamp = Date.now().toString();
    const body = JSON.stringify({ name: 'test' });
    const signature = signRequest('POST', '/api/users', body, secret, timestamp);

    // 发送请求
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: body,
    });

    // 服务器验证
    function verifySignature(req, secret) {
      const timestamp = req.headers['x-timestamp'];
      const signature = req.headers['x-signature'];

      // 检查时间戳（5分钟内有效）
      if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
        return false; // 请求过期
      }

      // 重新计算签名
      const expectedSignature = signRequest(
        req.method,
        req.path,
        req.body,
        secret,
        timestamp
      );

      // 恒定时间比较（防止时序攻击）
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    }
  `,

  // Token 认证（配合 HTTPS 使用）
  tokenAuth: `
    // 流程：
    // 1. 用户登录，服务器返回 JWT
    // 2. 客户端在后续请求中携带 Token
    // 3. 服务器验证 Token

    // 请求头
    Authorization: Bearer <jwt_token>

    // JWT 结构
    // header.payload.signature
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  `,
};
```

### 5.4 实际 HTTPS 性能优化

```javascript
/**
 * HTTPS 性能优化
 */

const httpsOptimization = {
  // 1. TLS 会话复用
  sessionResumption: `
    原理：
    首次握手后缓存会话信息
    再次连接时跳过握手，直接通信

    方式1：Session ID
    - 服务器保存 Session ID 和密钥材料
    - 客户端保存 Session ID
    - 缺点：需要服务器端存储，不适合分布式

    方式2：Session Ticket
    - 服务器用密钥加密会话信息，发送给客户端
    - 客户端存储加密的 ticket
    - 适合分布式部署
  `,

  // 2. OCSP Stapling
  ocspStapling: `
    传统流程：
    1. 浏览器验证证书
    2. 浏览器查询 CA 的 OCSP 服务器
    3. CA 返回证书状态
    4. 浏览器继续

    问题：增加一次网络请求（延迟）

    OCSP Stapling：
    1. 服务器定期查询 CA 的 OCSP 服务器
    2. 服务器在 TLS 握手时发送 OCSP 响应
    3. 浏览器直接验证
    4. 减少一次网络请求
  `,

  // 3. 使用 HTTP/2 或 HTTP/3
  http2http3: `
    HTTPS 的一个问题是握手延迟
    使用 HTTP/2 或 HTTP/3 可以：
    1. 多路复用减少连接数
    2. 头部压缩减少数据传输
    3. HTTP/3 的 0-RTT 快速恢复
  `,

  // 4. 证书链优化
  certificateChainOptimization: `
    1. 确保服务器发送完整的证书链
    2. 中间证书越少越好
    3. 使用 Let's Encrypt（只有 1 个中间证书）

    # 验证证书链
    openssl s_client -connect example.com:443 -showcerts

    # 检查叶子证书 → 中间证书 → 根证书
  `,

  // 5. 启用 TLS 1.3
  enableTls13: `
    TLS 1.3 比 1.2 更快：
    - 1-RTT vs 2-RTT
    - 更简单的握手
    - 更少的加密算法协商

    配置：
    ssl_protocols TLSv1.2 TLSv1.3;
  `,

  // 完整优化配置
  fullOptimization: `
    # Nginx 优化配置
    server {
        listen 443 ssl;

        # 证书
        ssl_certificate /path/to/fullchain.pem;
        ssl_certificate_key /path/to/key.pem;

        # TLS 版本
        ssl_protocols TLSv1.2 TLSv1.3;

        # 会话复用
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets on;

        # OCSP Stapling
        ssl_stapling on;
        ssl_stapling_verify on;

        # 加密套件
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers on;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000" always;
    }
  `,
};
```

## 六、常见问题与总结

### 6.1 TLS/SSL 常见问题

```javascript
/**
 * TLS 常见问题
 */

// Q1: HTTPS 会明显影响性能吗？
const performanceImpact = `
  延迟增加：
  - TLS 1.2: 增加 ~30ms
  - TLS 1.3: 增加 ~5ms

  CPU 开销：
  - 现代 CPU 有 AES 指令集，硬件加速
  - 额外开销 < 2%

  带宽增加：
  - 证书和握手消息增加少量数据
  - 通常 < 10KB

  结论：
  - 性能影响很小（毫秒级）
  - 安全收益远大于性能损失
  - 2018 年 Chrome 把所有 HTTP 站点标记为"不安全"
`;

// Q2: 为什么需要前向保密（PFS）？
const whyPfs = `
  没有前向保密：
  - 攻击者记录所有加密流量
  - 某天拿到服务器私钥
  - 可以解密所有历史流量

  有前向保密：
  - 即使拿到服务器私钥
  - 也只能解密之后的流量
  - 历史流量仍然安全

  TLS 1.3 强制使用 ECDHE（提供前向保密）
`;

// Q3: 自签名证书能用吗？
const selfSignedCertUsage = `
  生产环境：
  - 必须使用受信任 CA 签发的证书
  - Let's Encrypt 是免费选择

  开发环境：
  - 可以使用自签名证书
  - 需要手动信任
  - 使用 mkcert 工具可以简化

  内网环境：
  - 可以搭建私有 CA
  - 在内网机器上安装根证书
`;

// Q4: 证书过期了会怎样？
const expiredCertEffect = `
  浏览器行为：
  - 显示"证书已过期"警告
  - 大多数用户会停止访问
  - 可能被搜索引擎降低排名

  业务影响：
  - 用户流失
  - 信任度下降
  - 可能影响 SEO

  预防措施：
  - 设置证书过期提醒
  - 使用 Let's Encrypt 自动续期
  - 证书管理系统
`;
```

### 6.2 核心概念总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    TLS/SSL 核心概念总结                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  对称加密：                                                       │
│  - 加密和解密用同一把钥匙                                        │
│  - 速度快，适合大量数据                                          │
│  - 密钥配送是问题                                                │
│                                                                 │
│  非对称加密：                                                     │
│  - 公钥加密，私钥解密                                            │
│  - 速度慢，适合密钥交换                                          │
│  - 私钥保密，公钥公开                                            │
│                                                                 │
│  混合加密：                                                       │
│  - 非对称加密传递对称密钥                                        │
│  - 对称加密加密实际数据                                          │
│  - 取长补短                                                      │
│                                                                 │
│  数字证书：                                                       │
│  - 证明公钥属于某个域名                                          │
│  - 由 CA 机构签发                                                │
│  - 浏览器内置受信任 CA 的根证书                                  │
│                                                                 │
│  TLS 握手：                                                       │
│  - 验证服务器身份                                                │
│  - 协商加密算法                                                  │
│  - 交换加密密钥                                                  │
│  - TLS 1.2: 2-RTT                                               │
│  - TLS 1.3: 1-RTT 或 0-RTT                                     │
│                                                                 │
│  HTTPS = HTTP + TLS                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 HTTPS 部署检查清单

```javascript
/**
 * HTTPS 部署检查清单
 */

const deploymentChecklist = {
  // 证书检查
  certificate: [
    '✓ 证书在有效期内',
    '✓ 证书域名与网站匹配',
    '✓ 证书链完整（包含中间证书）',
    '✓ 使用受信任 CA 的证书',
  ],

  // TLS 配置检查
  tlsConfig: [
    '✓ 禁用 SSLv3, TLS 1.0, TLS 1.1',
    '✓ 只启用 TLS 1.2 和 TLS 1.3',
    '✓ 使用安全的加密套件',
    '✓ 启用前向保密',
  ],

  // 性能优化
  performance: [
    '✓ 启用 TLS 会话复用',
    '✓ 启用 OCSP Stapling',
    '✓ 使用 HTTP/2',
    '✓ 考虑使用 TLS 1.3',
  ],

  // 安全头
  securityHeaders: [
    '✓ HSTS 头已设置',
    '✓ X-Frame-Options 已设置',
    '✓ X-Content-Type-Options 已设置',
  ],

  // 混合内容
  mixedContent: [
    '✓ 所有资源使用 HTTPS',
    '✓ 外部 CDN 使用 HTTPS',
    '✓ 无 HTTP 引用',
  ],

  // 自动化
  automation: [
    '✓ 设置证书过期监控',
    '✓ 启用自动续期',
    '✓ 定期更新 TLS 配置',
  ],
};

// 在线检测工具
const onlineTools = `
  # SSL Labs 评分
  https://www.ssllabs.com/ssltest/

  # HTTP 安全头检测
  https://securityheaders.com/

  # 证书透明度日志检查
  https://crt.sh/

  # TLS 1.3 测试
  https://tls13.ulfheim.net/
`;
```

---

> 下篇预告：《DNS/CDN/负载均衡全链路》—— DNS 解析流程、CDN 原理与加速、Anycast 与 GSLB 全局负载均衡，以及如何构建高可用的全球服务。