# DNS/CDN/负载均衡全链路

> 前言：想象你要去一家连锁餐厅吃饭。你打开地图搜索"最近的 XXX 餐厅"，地图会自动找到离你最近、人流量最少、评价最好的那家分店帮你导航。DNS 就是互联网的"地图导航系统"，CDN 是"最近的餐厅分店"，负载均衡器就是那个帮你选择最优分店的智能系统。

## 一、DNS 深度解析

### 1.1 DNS 是什么？

**DNS（Domain Name System，域名系统）** 是互联网的电话簿，负责将人类可读的域名（如 `www.example.com`）转换为机器可读的 IP 地址（如 `93.184.216.34`）。

**类比理解**：

```
没有 DNS：
- 你要记住朋友的身份证号才能打电话
- "喂，你是 110.120.119.114 吗？"

有 DNS：
- 你直接说"帮我转张三"
- DNS 帮你查到号码，帮你接通
```

```javascript
/**
 * DNS 的作用
 */

// 域名 vs IP 地址
const domainVsIp = {
  humanReadable: `
    域名：www.example.com
    - 好记：比一串数字好记多了
    - 有意义：可以看出网站类型和公司

    IP 地址：93.184.216.34
    - 纯数字，不直观
    - 对人类不友好
  `,

  // DNS 的核心功能
  coreFunction: `
    DNS 的主要功能：
    1. 域名解析 - 把域名转成 IP
    2. 负载分配 - 根据策略返回不同 IP
    3. 邮件路由 - MX 记录指定邮件服务器
    4. 服务发现 - SRV 记录指定服务位置
  `,

  // 域名结构
  domainStructure: `
    www.example.com

    ├── 后缀/顶级域（TLD）：.com
    │   - 常见：.com, .org, .net, .cn
    │   - 国家：.us, .uk, .jp, .cn
    │
    ├── 二级域：example
    │   - 这是你注册的名字
    │   - 在 .com 下必须是唯一的
    │
    └── 子域/三级域：www
        - 可以自己定义的子域名
        - 可以有很多个：blog.example.com, api.example.com

    完整域名 = 子域 + 二级域 + 顶级域
    FQDN (Fully Qualified Domain Name) = www.example.com.
    最后的点是根域，FQDN 必须包含
  `,
};
```

### 1.2 DNS 查询流程

```javascript
/**
 * DNS 查询的完整流程
 *
 * 想象你在图书馆找一本书：
 * 1. 先问前台图书管理员
 * 2. 管理员不知道，去查索引卡片
 * 3. 索引卡片告诉你书在哪个书架
 * 4. 管理员去书架找书
 * 5. 把书拿给你
 */

const dnsQueryFlow = {
  // 完整查询流程
  fullFlow: `
    用户输入 www.example.com

    ┌─────────────────────────────────────────────────────────────────┐
    │                      DNS 查询流程                                │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                  │
    │  1. 浏览器缓存                                                    │
    │     浏览器检查缓存，有没有 www.example.com 的记录                 │
    │     有 → 直接返回 IP                                             │
    │     无 → 继续下一步                                             │
    │                                                                  │
    │  2. 系统缓存                                                      │
    │     检查操作系统的 DNS 缓存和 hosts 文件                          │
    │     有 → 直接返回 IP                                             │
    │     无 → 继续下一步                                             │
    │                                                                  │
    │  3. 本地 DNS 服务器（Resolver）                                   │
    │     通常是 ISP（宽带运营商）或公司网络的 DNS 服务器               │
    │     这是"递归查询"的开始                                         │
    │                                                                  │
    │  4. 根域名服务器（Root Server）                                   │
    │     本地 DNS 向根服务器查询 .com 域的地址                         │
    │     根服务器返回 .com TLD 服务器地址                              │
    │                                                                  │
    │  5. TLD 服务器（.com TLD）                                        │
    │     本地 DNS 向 .com TLD 服务器查询 example.com                   │
    │     TLD 服务器返回 example.com 的 DNS 服务器地址                  │
    │                                                                  │
    │  6. 权威 DNS 服务器（Authoritative Server）                       │
    │     本地 DNS 向 example.com 的 DNS 服务器查询 www.example.com     │
    │     得到具体的 IP 地址                                            │
    │                                                                  │
    │  7. 返回结果                                                     │
    │     本地 DNS 返回 IP 给浏览器                                     │
    │     同时缓存结果（TTL 时间）                                      │
    │                                                                  │
    └─────────────────────────────────────────────────────────────────┘
  `,

  // 两种查询类型
  queryTypes: {
    recursive: `
      递归查询：
      - 客户端 → 本地 DNS → 其他 DNS服务器
      - 本地 DNS 负责"跑腿"，直到拿到结果
      - 客户端只需要等待最终答案

      就像：
      你告诉前台"我要找《javascript高级程序设计》"
      前台帮你查索引、查书架、拿书，最后把书给你
    `,

    iterative: `
      迭代查询：
      - DNS 服务器之间互相查询
      - 每个服务器告诉你"下一步去哪找"

      就像：
      你问图书管理员
      管理员说"编程书在3楼"
      你去3楼问另一个管理员
      他说"javascript书在东区"
      你去东区找
    `,
  },

  // 实际查询示例
  actualQuery: `
    # 使用 dig 命令查看 DNS 查询过程
    dig www.example.com +trace

    # 各阶段返回的服务器
    # .                       518400  IN  NS  a.root-servers.net.
    # com.                    518400  IN  NS  a.gtld-servers.net.
    # example.com.           172800  IN  NS  a.iana-servers.net.
    # www.example.com.        86400   IN  A   93.184.216.34

    # TTL: Time To Live，缓存时间（秒）
  `,
};

// DNS 缓存机制
const dnsCaching = {
  // 多层缓存
  layers: `
    缓存层级（从近到远）：
    1. 浏览器 DNS 缓存
       - Chrome: about://net-internals/#dns 查看
       - TTL 通常很短（几十秒）

    2. 操作系统 DNS 缓存
       - Windows: ipconfig /displaydns
       - macOS: sudo killall -HUP mDNSResponder
       - TTL 由 DNS 服务器返回

    3. 本地 DNS 服务器缓存
       - ISP 的 DNS 服务器
       - 公司网络的 DNS 服务器
       - 缓存时间可以很长（几分钟到几小时）

    4. 递归 DNS 服务器
       - 不严格说是缓存
       - 但会缓存查询结果
  `,

  // TTL 值
  ttl: `
    TTL (Time To Live)：
    - DNS 记录的缓存时间
    - 单位：秒
    - 常见值：
      * 3600 (1小时)
      * 86400 (1天)
      * 604800 (1周)

    TTL 设置策略：
    - 短期 TTL (300秒)：
      用于频繁变更的服务
      变更后快速生效

    - 长期 TTL (86400+)：
      用于稳定的静态资源
      减少 DNS 查询压力

    - 动态 TTL：
      故障转移时自动降低 TTL
      平时用长 TTL，故障时快速切换
  `,
};
```

### 1.3 DNS 记录类型

```javascript
/**
 * DNS 记录类型详解
 */

const dnsRecordTypes = {
  // A 记录
  A: `
    A (Address) 记录：
    - 最常用的记录类型
    - 将域名指向 IPv4 地址

    示例：
    www.example.com.    3600    IN    A    93.184.216.34

    字段解释：
    - 域名：www.example.com.
    - TTL：3600 秒
    - CLASS：IN (Internet)
    - 类型：A
    - 值：93.184.216.34
  `,

  // AAAA 记录
  AAAA: `
    AAAA 记录：
    - 将域名指向 IPv6 地址
    - 用于支持 IPv6 的网络

    示例：
    www.example.com.    3600    IN    AAAA    2606:2800:220:1::248a:1893
  `,

  // CNAME 记录
  CNAME: `
    CNAME (Canonical Name) 记录：
    - 创建域名的别名
    - 指向另一个域名

    示例：
    blog.example.com.    3600    IN    CNAME    example.com.

    用途：
    - 把 blog.example.com 指向 www.example.com
    - 把 cdn.example.com 指向 CDN 域名
    - 多个子域名指向同一个服务
  `,

  // MX 记录
  MX: `
    MX (Mail Exchange) 记录：
    - 指定邮件服务器
    - 邮件发送优先级

    示例：
    example.com.    3600    IN    MX    10    mail.example.com.
    example.com.    3600    IN    MX    20    mail2.example.com.

    字段解释：
    - 优先级：10, 20（数字越小优先级越高）
    - 邮件服务器：mail.example.com.

    注意事项：
    - MX 记录应该指向域名，不应该直接指向 IP
    - 需要有 A 记录指向邮件服务器的 IP
  `,

  // NS 记录
  NS: `
    NS (Name Server) 记录：
    - 指定域名的 DNS 服务器
    - 告诉其他服务器去哪查询这个域名

    示例：
    example.com.    172800    IN    NS    a.iana-servers.net.
    example.com.    172800    IN    NS    b.iana-servers.net.

    用途：
    - 注册域名时设置
    - 告诉域名注册商使用哪个 DNS 服务器
  `,

  // TXT 记录
  TXT: `
    TXT 记录：
    - 存放任意文本信息
    - 常用于验证和防垃圾邮件

    示例1：SPF 邮件验证
    example.com.    3600    IN    TXT    "v=spf1 include:_spf.example.com ~all"

    示例2：DKIM 邮件签名
    selector._domainkey.example.com.    3600    IN    TXT    "v=DKIM1; k=rsa; p=MIGfMA..."

    示例3：Google 站点验证
    google-site-verification    3600    IN    TXT    "google-site-verification=xxx"

    示例4：DMARC 策略
    _dmarc.example.com.    3600    IN    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
  `,

  // SOA 记录
  SOA: `
    SOA (Start of Authority) 记录：
    - 标记权威 DNS 服务器
    - 包含域名管理的基本信息

    示例：
    example.com.    3600    IN    SOA    ns1.example.com. admin.example.com. (
                      2025010101    ; Serial (版本号)
                      7200          ; Refresh (刷新时间)
                      3600          ; Retry (重试时间)
                      1209600       ; Expire (过期时间)
                      3600 )        ; Minimum TTL (最小 TTL)
  `,

  // SRV 记录
  SRV: `
    SRV (Service) 记录：
    - 指定服务的位置
    - 格式：服务.协议.域名

    示例：
    _sip._tcp.example.com.    3600    IN    SRV    10    60    5060    sip.example.com.

    字段解释：
    - 服务：_sip
    - 协议：_tcp
    - 优先级：10
    - 权重：60
    - 端口：5060
    - 目标主机：sip.example.com.

    用途：
    - VoIP 电话服务
    - 即时通讯服务
    - LDAP 目录服务
  `,
};

// DNS 记录类型速查表
const recordTypeCheatsheet = `
  ┌────────────────────────────────────────────────────────────────┐
  │                    DNS 记录类型速查表                           │
  ├──────┬────────────────────────────────────────────────────────┤
  │ 类型  │                      说明                               │
  ├──────┼────────────────────────────────────────────────────────┤
  │  A   │  域名 → IPv4 地址                                      │
  │  AAAA │  域名 → IPv6 地址                                     │
  │  CNAME│  域名别名                                             │
  │  MX   │  邮件服务器                                           │
  │  NS   │  DNS 服务器                                           │
  │  TXT  │  文本信息（验证、SPF等）                               │
  │  SOA  │  权威信息                                             │
  │  SRV  │  服务位置                                             │
  │  PTR  │  IP → 域名（反向解析）                                 │
  └──────┴────────────────────────────────────────────────────────┘
`;
```

### 1.4 DNS 解析的实现

```javascript
/**
 * 实际项目中的 DNS 查询
 */

// Node.js DNS 查询
const nodejsDns = `
  const dns = require('dns');
  const dnsPromises = dns.promises;

  // 1. 解析域名
  dns.resolve4('www.example.com', (err, addresses) => {
    if (err) {
      console.error('解析失败:', err);
      return;
    }
    console.log('IP 地址:', addresses);
    // ['93.184.216.34']
  });

  // 2. 异步/等待版本
  async function resolveDomain() {
    try {
      const addresses = await dnsPromises.resolve4('www.example.com');
      console.log('IP 地址:', addresses);
    } catch (err) {
      console.error('解析失败:', err);
    }
  }

  // 3. 获取多种记录
  async function getDnsRecords() {
    const [A, AAAA, MX, TXT] = await Promise.all([
      dnsPromises.resolve4('www.example.com'),
      dnsPromises.resolve6('www.example.com'),
      dnsPromises.resolveMx('example.com'),
      dnsPromises.resolveTxt('example.com'),
    ]);

    console.log('A 记录:', A);
    console.log('AAAA 记录:', AAAA);
    console.log('MX 记录:', MX);
    console.log('TXT 记录:', TXT);
  }

  // 4. 反向解析（IP → 域名）
  dns.reverse('93.184.216.34', (err, hostnames) => {
    if (err) {
      console.error('反向解析失败:', err);
      return;
    }
    console.log('主机名:', hostnames);
  });

  // 5. 自定义 DNS 服务器
  dns.resolve4('www.example.com', {
    server: { host: '8.8.8.8', port: 53 }  // Google DNS
  }, (err, addresses) => {
    console.log('使用 Google DNS 解析:', addresses);
  });
`;

// 前端使用 DNS
const browserDns = `
  // 现代浏览器支持 DNS-over-HTTPS (DoH)
  // Chrome 97+ 支持

  // 使用 fetch 进行 DNS 查询（通过 DoH）
  async function dnsOverHttps() {
    const response = await fetch('https://dns.google/resolve?name=www.example.com&type=A', {
      headers: {
        'Accept': 'application/dns-json'
      }
    });

    const data = await response.json();
    console.log('DNS 结果:', data.Answer);

    // 返回格式：
    // {
    //   Status: 0,
    //   Answer: [
    //     { name: 'www.example.com', type: 1, TTL: 3600, data: '93.184.216.34' }
    //   ]
    // }
  }

  // 使用 DNS-over-TLS (DoT)
  // 需要使用第三方库，如 dns-proxy-agent
`;

// DNS 负载均衡的实现
const dnsLoadBalancing = `
  // DNS 可以实现简单的负载均衡
  // 通过返回不同的 IP 地址

  // 方式1：轮询（Round Robin）
  // DNS 服务器轮换返回不同的 IP
  // A 记录: 1.2.3.4, 1.2.3.5, 1.2.3.6

  // 方式2：基于地理位置
  // 返回离用户最近的服务器 IP
  // 需要 DNS 服务器支持 GeoDNS

  // 实际实现（Node.js）
  const servers = [
    { ip: '1.2.3.4', location: '华北' },
    { ip: '1.2.3.5', location: '华东' },
    { ip: '1.2.3.6', location: '华南' },
  ];

  let currentIndex = 0;

  function getNextServer() {
    const server = servers[currentIndex];
    currentIndex = (currentIndex + 1) % servers.length;
    return server;
  }

  // DNS 服务商提供的地理路由功能
  // AWS Route 53、Cloudflare、Dyn 等都支持
`;
```

### 1.5 DNS 安全问题

```javascript
/**
 * DNS 安全问题与解决方案
 */

const dnsSecurityIssues = {
  // DNS 污染
  dnsPoisoning: `
    DNS 污染（DNS Poisoning）：
    - 攻击者向 DNS 缓存服务器注入错误的记录
    - 用户访问正确域名，却被导向恶意网站

    攻击原理：
    1. 攻击者向 DNS 服务器发送大量查询
    2. 同时注入伪造的 DNS 响应
    3. DNS 服务器的缓存被污染
    4. 用户访问时被导向错误地址

    防范措施：
    - 使用 DNSSEC 验证响应
    - 限制 DNS 服务器只接受可信来源的响应
  `,

  // DNS 劫持
  dnsHijacking: `
    DNS 劫持（DNS Hijacking）：
    - 攻击者修改用户的 DNS 设置
    - 通常通过恶意软件或路由器漏洞

    攻击场景：
    1. 恶意软件修改本地 DNS 设置
    2. 路由器固件漏洞被利用
    3. ISP 主动劫持（广告注入）

    防范措施：
    - 定期检查 DNS 设置
    - 使用可信的 DNS 服务器
    - 启用 DNS over HTTPS (DoH)
  `,

  // DNS 隧道
  dnsTunneling: `
    DNS 隧道（DNS Tunneling）：
    - 利用 DNS 协议传输其他数据
    - 绕过网络防火墙

    原理：
    1. 将数据编码到 DNS 查询的子域名中
    2. DNS 服务器返回编码的响应
    3. 双向建立隧道

    用途：
    - 绕过网络限制
    - 隐蔽数据传输（恶意软件常用）
  `,

  // 缓存投毒攻击
  cachePoisoningAttack: `
    缓存投毒（Cache Poisoning）：
    - 类似 DNS 污染
    - 针对特定 DNS 缓存服务器

    Kaminsky 攻击：
    1. 攻击者查询一个不存在的域名
    2. 服务器向权威服务器查询
    3. 攻击者快速发送伪造响应
    4. 注入恶意记录到缓存中

    防范：
    - 随机化 DNS 事务 ID
    - 使用 DNSSEC
  `,
};

// DNSSEC 详解
const dnssec = {
  description: `
    DNSSEC (DNS Security Extensions)：
    - 为 DNS 添加数字签名
    - 验证 DNS 响应的真实性
  `,

  // 工作原理
  howItWorks: `
    DNSSEC 使用公钥加密：

    1. 权威 DNS 服务器对自己的记录签名
       - 使用私钥签名
       - 签名结果作为 RRSIG 记录

    2. 父域名服务器为子域名的 DNSKEY 签名
       - 建立信任链
       - 根域名是信任锚点

    3. 验证过程：
       - 获取公钥
       - 验证签名
       - 确认记录未被篡改
  `,

  // DNS 记录类型（DNSSEC 新增）
  newRecordTypes: `
    DNSKEY：保存公钥
    RRSIG：保存签名
    DS：委托签名（Delegation Signer）
    NSEC/NSEC3：证明不存在记录
  `,

  // DNSSEC 配置
  configuration: `
    # BIND 配置 DNSSEC
    options {
      dnssec-enable yes;
      dnssec-validation yes;
    };

    # 签署域名
    dnssec-keygen -a RSASHA256 -b 2048 -n ZONE example.com
    dnssec-signzone -A -3 $(head -c 100 /dev/random | base64) -o example.com -k Kexample.com.+008.+12345 zonefile
  `,

  // DNSSEC 的局限性
  limitations: `
    DNSSEC 不加密：
    - 只是签名，不加密内容
    - 不能防止窃听

    部署复杂性：
    - 需要域名注册商和 DNS 服务商支持
    - 配置复杂，容易出错
    - 签名验证消耗资源

    验证需要端到端支持：
    - 递归 DNS 服务器必须验证
    - 客户端也需要验证
  `,
};

// DNS over HTTPS (DoH)
const doh = {
  description: `
    DoH (DNS over HTTPS)：
    - 通过 HTTPS 协议发送 DNS 查询
    - 加密 DNS 流量
    - 防止中间人攻击和窃听
  `,

  // DoH 服务器
  servers: `
    公共 DoH 服务器：

    Google:
    https://dns.google/dns-query
    https://8.8.8.8/dns-query

    Cloudflare:
    https://cloudflare-dns.com/dns-query
    https://1.1.1.1/dns-query

    Quad9:
    https://dns.quad9.net/dns-query
  `,

  // 浏览器配置
  browserConfig: `
    # Chrome 设置 DoH
    # 设置 → 安全 → 使用安全 DNS
    # 选择自定义 DNS 提供商

    # Firefox 设置 DoH
    # 设置 → 高级 → 网络 → 连接设置
    # 选择"启用基于 HTTPS 的 DNS"
  `,

  // Node.js 使用 DoH
  nodejsDoh: `
    const https = require('https');

    async function queryDoH(domain, dohServer) {
      const url = \`\${dohServer}?name=\${domain}&type=A\`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });

      const data = await response.json();

      if (data.Status === 0) {
        console.log('IP:', data.Answer?.[0]?.data);
      } else {
        console.log('DNS 查询失败, Status:', data.Status);
      }
    }

    queryDoH('www.example.com', 'https://dns.google/dns-query');
  `,
};

// DNS over TLS (DoT)
const dot = {
  description: `
    DoT (DNS over TLS)：
    - 通过 TLS 协议发送 DNS 查询
    - 与 DoH 类似，但使用专用端口 853
  `,

  // DoT 服务器
  servers: `
    Google:
    8.8.8.8
    8.8.4.4

    Cloudflare:
    1.1.1.1
    1.0.0.1

    Quad9:
    9.9.9.9
  `,

  // Node.js 使用 DoT
  nodejsDot: `
    // Node.js 原生不支持 DoT
    // 需要使用第三方库，如 tls-client

    // 简化示例
    const tls = require('tls');
    const dns = require('dns');

    const options = {
      host: '1.1.1.1',
      port: 853,
    };

    const socket = tls.connect(options, () => {
      // 发送 DNS 查询
      // 使用 DNS over TLS 协议
    });
  `,
};
```

## 二、CDN 深度解析

### 2.1 CDN 是什么？

**CDN（Content Delivery Network，内容分发网络）** 是一种分布式网络服务，通过在全球部署边缘服务器，将内容缓存到离用户最近的地方，加速内容访问。

**类比理解**：

```
没有 CDN：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   用户（北京）───────► 服务器（美国）                           │
│       │                      ▲                                  │
│       │                      │                                  │
│       │    跨太平洋，延迟高   │                                  │
│       │                      │                                  │
│       │◄─────────────────────                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

有 CDN：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   用户（北京）───────► CDN 边缘节点（上海）                     │
│       │                      │                                  │
│       │                      ▼                                  │
│       │              CDN 缓存命中 ← 缓存服务器（美国）          │
│       │                      │                                  │
│       │◄─────────────────────                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

优势：
1. 物理距离近，延迟低
2. 减少骨干网流量
3. 减轻源站压力
4. 提供 DDoS 防护
```

```javascript
/**
 * CDN 的核心功能
 */

const cdnCoreFunctions = {
  // 1. 内容缓存
  contentCaching: `
    CDN 的核心功能：
    - 将静态资源缓存到边缘节点
    - 用户访问时从最近的边缘节点获取
    - 减少跨区域流量

    缓存内容类型：
    - 静态资源：图片、CSS、JS、字体、视频
    - 动态内容：可缓存的 API 响应

    缓存策略：
    - Cache-Control 头控制
    - 边缘 TTL / 浏览器 TTL
    - 缓存刷新机制
  `,

  // 2. 边缘计算
  edgeComputing: `
    现代 CDN 不只是缓存，还提供边缘计算：

    1. Serverless@Edge
       - 在边缘节点运行无服务器函数
       - 例：Cloudflare Workers, AWS Lambda@Edge

    2. 请求路由
       - A/B 测试
       - 重定向
       - 请求改写

    3. 安全防护
       - DDoS 缓解
       - WAF (Web Application Firewall)
       - Bot 检测
  `,

  // 3. 全球负载均衡
  globalLoadBalancing: `
    CDN 提供全局流量管理：
    - 智能 DNS 解析
    - 基于地理位置的路由
    - 健康检查和故障转移
    - 实时监控和告警
  `,

  // 4. SSL/TLS 终端
  sslTermination: `
    CDN 处理 HTTPS：
    - 客户端 ↔ CDN：HTTPS
    - CDN ↔ 源站：HTTP 或 HTTPS

    好处：
    - 减少源站的 TLS 握手压力
    - 统一管理证书
    - 支持 HTTP/2 和 HTTP/3
  `,
};
```

### 2.2 CDN 工作原理

```javascript
/**
 * CDN 工作流程详解
 */

const cdnWorkflow = {
  // 首次请求流程
  firstRequest: `
    用户首次访问 www.example.com

    ┌─────────────────────────────────────────────────────────────────┐
    │                     CDN 首次请求流程                             │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                  │
    │  1. 用户请求 www.example.com                                     │
    │                                                                  │
    │  2. DNS 解析                                                     │
    │     www.example.com → CDN 分配的域名                            │
    │     例如：www.example.com.cdnstatic.com                          │
    │                                                                  │
    │  3. CDN 的 DNS 服务器进行智能解析                                │
    │     - 根据用户 IP 确定地理位置                                   │
    │     - 选择最近的边缘节点                                         │
    │     - 返回该节点的 IP                                            │
    │                                                                  │
    │  4. 请求路由到边缘节点                                           │
    │                                                                  │
    │  5. 边缘节点检查缓存                                             │
    │     - 缓存未命中                                                 │
    │     - 向源站请求内容                                             │
    │                                                                  │
    │  6. 源站返回内容给边缘节点                                       │
    │                                                                  │
    │  7. 边缘节点缓存内容                                             │
    │                                                                  │
    │  8. 边缘节点返回内容给用户                                       │
    │                                                                  │
    └─────────────────────────────────────────────────────────────────┘
  `,

  // 后续请求流程
  subsequentRequests: `
    用户再次访问 www.example.com

    ┌─────────────────────────────────────────────────────────────────┐
    │                    CDN 缓存命中流程                              │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                  │
    │  1. 用户请求 www.example.com                                     │
    │                                                                  │
    │  2. DNS 解析到最近的边缘节点                                     │
    │                                                                  │
    │  3. 边缘节点检查缓存                                             │
    │     - 缓存命中！                                                 │
    │                                                                  │
    │  4. 直接返回缓存内容                                             │
    │                                                                  │
    │  速度：毫秒级响应                                                │
    │  源站压力：零                                                    │
    │                                                                  │
    └─────────────────────────────────────────────────────────────────┘
  `,

  // 缓存失效流程
  cacheInvalidation: `
    内容更新时如何刷新 CDN 缓存？

    方式1：TTL 过期
    - 等待缓存自然过期
    - 根据 Cache-Control 设置的 TTL 决定时间

    方式2：主动刷新
    - API 调用让 CDN 刷新指定 URL
    - 刷新整个目录
    - 刷新所有缓存（慎用）

    方式3：版本化 URL
    - CSS: style.v2.css
    - JS: app.a1b2c3d4.js
    - 改变 URL = 强制获取新内容

    CDN 刷新 API 示例（Cloudflare）：
    POST /zones/{zone}/cache/purge

    {
      "files": [
        "https://example.com/images/img.jpg"
      ]
    }
  `,
};

// CDN 缓存策略
const cdnCachingStrategy = {
  // 缓存判断流程
  cacheDecision: `
    CDN 节点如何判断是否缓存？

    1. 请求方法
       - 通常只缓存 GET 请求
       - 不缓存 POST、PUT 等

    2. 响应状态码
       - 200 OK：缓存
       - 404 Not Found：可缓存
       - 301/302 重定向：可缓存
       - 其他：不缓存

    3. Cache-Control 头
       - Cache-Control: public → 可缓存
       - Cache-Control: private → 不缓存
       - Cache-Control: no-cache → 每次验证
       - Cache-Control: no-store → 不缓存

    4. 其他头部
       - Set-Cookie：不缓存
       - Vary：基于指定头部缓存多个版本
  `,

  // 缓存时间设置
  cacheDuration: `
    不同类型资源的缓存时间建议：

    静态资源（图片/CSS/JS）：
    Cache-Control: public, max-age=31536000, immutable

    HTML 页面：
    Cache-Control: no-cache
    或
    Cache-Control: public, max-age=0, must-revalidate

    API 响应：
    Cache-Control: no-cache
    或
    Cache-Control: private, max-age=600

    用户个性化内容：
    Cache-Control: private, no-store
  `,

  // Vary 头的作用
  varyHeader: `
    Vary 头指定缓存的变体：

    示例：基于 Accept-Encoding 缓存
    Vary: Accept-Encoding

    CDN 会缓存：
    - gzip 版本
    - brotli 版本
    - 未压缩版本

    示例：基于 User-Agent 缓存
    Vary: User-Agent

    移动版和桌面版可以分别缓存

    注意：Vary 会增加缓存数量
    可能导致缓存命中率下降
  `,
};
```

### 2.3 CDN 关键配置

```javascript
/**
 * CDN 配置详解
 */

// 1. 源站配置
const originConfig = {
  // 源站设置
  origin: `
    指定 CDN 的回源地址：

    方式1：IP 回源
    origin: 1.2.3.4:8080

    方式2：域名回源
    origin: origin.example.com

    方式3：多个源站（负载均衡）
    origin: [
      { host: 'origin1.example.com', weight: 70 },
      { host: 'origin2.example.com', weight: 30 },
    ]
  `,

  // 回源协议
  originProtocol: `
    回源协议设置：

    HTTPS 回源：
    - 客户端 → CDN：HTTPS
    - CDN → 源站：HTTPS
    - 推荐，最安全

    HTTP 回源：
    - 客户端 → CDN：HTTPS
    - CDN → 源站：HTTP
    - 源站不需要证书，但有安全风险

    协议跟随：
    - 客户端用什么协议，CDN 就用什么协议回源
  `,

  // 回源 HOST 头
  originHostHeader: `
    回源时 Host 头：

    如果 CDN 访问多个站点，需要指定 Host 头：
    Origin Host Header: www.example.com

    这样源站才能正确识别是哪个站点
  `,
};

// 2. 缓存规则配置
const cacheRulesConfig = {
  // 路径匹配规则
  pathRules: `
    缓存规则基于 URL 路径：

    示例：
    /static/*              → 缓存 1 年
    /api/*                 → 不缓存
    /images/*.jpg          → 缓存 30 天
    /page/*.html           → 缓存 10 分钟
  `,

  // 实际配置示例（Cloudflare）
  cloudflareRules: `
    // Page Rules 配置
    // 规则 1：静态资源长期缓存
    If: www.example.com/static/*
    Then:
    - Cache Level: Cache Everything
    - Edge Cache TTL: 1 month
    - Browser Cache TTL: 1 year

    // 规则 2：API 不缓存
    If: www.example.com/api/*
    Then:
    - Cache Level: Bypass
    - Disable Cache

    // 规则 3：HTML 短期缓存
    If: www.example.com/*.html
    Then:
    - Edge Cache TTL: 1 hour
    - Browser Cache TTL: 10 minutes
  `,

  // Nginx 配置
  nginxCache: `
    proxy_cache_path /data/nginx/cache levels=1:2 keys_zone=my_cache:10m;

    server {
        location /static/ {
            proxy_cache my_cache;
            proxy_cache_valid 200 30d;
            proxy_cache_valid 404 10m;
            add_header X-Cache-Status $upstream_cache_status;

            proxy_pass http://origin_server;
        }

        location /api/ {
            proxy_cache off;
            proxy_pass http://origin_server;
        }
    }

    # 缓存状态头
    # X-Cache-Status: HIT (命中)
    # X-Cache-Status: MISS (未命中)
    # X-Cache-Status: EXPIRED (已过期)
  `,
};

// 3. HTTPS 配置
const cdnHttpsConfig = {
  // CDN HTTPS 配置
  cdnHttps: `
    CDN 提供免费 HTTPS 证书：

    方式1：共享证书
    - CDN 为所有客户共享一个证书
    - 例：*.cdn.cloudflare.com
    - 客户无需单独证书

    方式2：自定义证书
    - 上传自己的证书到 CDN
    - 使用自己的域名
    - 例：www.example.com

    方式3：自动 HTTPS
    - CDN 自动申请和续期证书
    - Let's Encrypt 或 CDN 自有 CA
  `,

  // 证书类型
  certTypes: `
    CDN 支持的证书类型：

    1. 共享证书（Shared）
       - 免费
       - 通配符 *.example.com
       - 不支持裸域名

    2. 专用证书（Dedicated）
       - 付费
       - 自定义域名
       - 更好的兼容性

    3. 高级证书（Premium）
       - 企业级
       - 包括 EV 证书
       - 安全担保
  `,
};

// 4. CDN 服务商对比
const cdnProviders = {
  comparison: `
    主要 CDN 服务商对比：

    ┌─────────────┬────────────┬────────────┬──────────────────────┐
    │   服务商     │   节点数   │   特点      │        价格          │
    ├─────────────┼────────────┼────────────┼──────────────────────┤
    │ Cloudflare  │  200+     │  免费版强大  │ 免费 ~ $200/月       │
    │ AWS CloudFront│ 200+     │  AWS 集成   │ 按流量计费          │
    │ Akamai      │  365,000+ │  最大最老   │ 企业定价            │
    │ Fastly      │  60+      │  实时推送   │ 按请求计费          │
    │ 阿里云 CDN   │  2,800+   │  中国节点多  │ 按流量计费          │
    │ 腾讯云 CDN   │  1,500+   │  中国节点多  │ 按流量计费          │
    └─────────────┴────────────┴────────────┴──────────────────────┘
  `,
};
```

### 2.4 CDN 实战配置

```javascript
/**
 * 实际项目中的 CDN 配置
 */

// 1. 静态资源 CDN
const staticAssetCdn = `
  // 方式1：使用公共 CDN
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>

  // 公共 CDN：
  // - jsDelivr (jsdelivr.com)
  // - unpkg (unpkg.com)
  // - cdnjs (cdnjs.cloudflare.com)

  // 优点：
  // - 开箱即用
  // - 全球分布式
  // - 免费

  // 缺点：
  // - 不支持私有定制
  // - 不适合企业内网
  // - 可能有隐私问题
`;

// 2. 自建 CDN 回源配置
const selfBuiltCdn = `
  // 使用 Nginx 作为 CDN 节点

  upstream origin {
      server origin.example.com:8080;
  }

  server {
      listen 80;
      server_name cdn.example.com;

      # 缓存配置
      proxy_cache_path /data/cdn levels=1:2
          keys_zone=cdn_cache:10m
          max_size=10g
          inactive=60m;

      location / {
          # 回源设置
          proxy_pass http://origin;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;

          # 缓存设置
          proxy_cache cdn_cache;
          proxy_cache_valid 200 30d;
          proxy_cache_valid 404 1m;

          # 缓存控制
          add_header X-Cache-Status $upstream_cache_status;
      }
  }
`;

// 3. 前端资源版本化
const assetVersioning = `
  <!-- 不推荐：每次更新都可能是旧缓存 -->
  <script src="/app.js"></script>

  <!-- 推荐：使用内容哈希 -->
  <script src="/app.a1b2c3d4.js"></script>

  <!-- webpack 配置输出哈希 -->
  // webpack.config.js
  module.exports = {
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
    }
  };

  <!-- 输出示例 -->
  // main.a1b2c3d4.js
  // vendor.e5f6g7h8.js

  <!-- 好处： -->
  <!-- 1. 更新文件，哈希变化，强制获取新版本 -->
  <!-- 2. 未更新的文件，继续使用缓存 -->
  <!-- 3. 缓存效率最大化 -->
`;

// 4. CDN 与前端框架集成
const frameworkIntegration = {
  // Next.js 配置
  nextjsCdn: `
    // next.config.js
    module.exports = {
      // 静态资源使用 CDN
      assetPrefix: 'https://cdn.example.com',

      // 开启压缩
      compress: true,

      // 响应头
      async headers() {
        return [
          {
            source: '/:path*',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
              },
            ],
          },
        ];
      },
    };
  `,

  // Vue/React 配置
  vueCdn: `
    // vue.config.js
    module.exports = {
      publicPath: 'https://cdn.example.com/',
    };

    // 构建后上传到 CDN
    // npm run build
    // 上传 dist/ 到 CDN
    // 或者使用 CI/CD 自动同步
  `,
};

// 5. CDN 预热
const cdnPrewarm = {
  description: `
    CDN 预热（Prewarm）：
    - 在正式发布前，将内容推送到边缘节点
    - 确保所有用户都能快速访问
  `,

  // 预热方法
  methods: `
    方法1：API 触发
    POST /zones/{zone}/cache/purge

    方法2：CDN 控制台
    - 手动输入 URL 列表
    - 上传 URL 列表文件

    方法3：自动化脚本
    node cdn-prewarm.js

    const cdnApi = require('./cdn-api');

    const urls = [
      'https://example.com/index.html',
      'https://example.com/static/app.a1b2c3d4.js',
      'https://example.com/static/style.e5f6g7h8.css',
    ];

    for (const url of urls) {
      await cdnApi.purge(url);
      console.log('已预热:', url);
    }
  `,
};

// 6. 灰度发布
const canaryDeployment = {
  description: `
    CDN 支持灰度发布：

    1. 基于 Cookie/Header 切流
       - 新版本只给特定用户群

    2. 基于 URL 参数
       - ?v=2 访问新版本

    3. 基于地理位置
       - 某些地区先上线

    4. 基于流量百分比
       - 10% 流量先切新版本
  `,

  // 配置示例
  example: `
    // Cloudflare Workers 实现灰度
    addEventListener('fetch', event => {
      const url = new URL(event.request.url);

      // 10% 流量走新版本
      if (Math.random() < 0.1) {
        url.hostname = 'new.example.com';
      }

      event.respondWith(fetch(url));
    });
  `,
};
```

## 三、负载均衡深度解析

### 3.1 负载均衡是什么？

**负载均衡（Load Balancing）** 是一种将网络流量分配到多个服务器的技术，确保没有单台服务器过载，同时提高整体系统的可用性和响应速度。

**类比理解**：

```
没有负载均衡：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         用户请求 ───────────────────────────────────────────►   │
│                     │                                          │
│                     ▼                                          │
│              ┌─────────────┐                                   │
│              │   服务器A    │  ← 10000 请求/秒                 │
│              │   (过载!)    │                                   │
│              └─────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

有负载均衡：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         用户请求 ───────────────────────────────────────────►   │
│                     │                                          │
│                     ▼                                          │
│            ┌───────────────┐                                   │
│            │  负载均衡器    │                                   │
│            └───────┬───────┘                                   │
│                    │                                            │
│        ┌───────────┼───────────┐                               │
│        ▼           ▼           ▼                                │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                         │
│   │ 服务器A  │ │ 服务器B  │ │ 服务器C  │                        │
│   │ 3000/s  │ │ 3500/s  │ │ 3500/s  │                        │
│   └─────────┘ └─────────┘ └─────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
/**
 * 负载均衡的核心功能
 */

const loadBalancingCore = {
  // 核心功能
  coreFunctions: `
    1. 流量分发
       - 将请求均匀分配到多台服务器
       - 提高整体处理能力

    2. 健康检查
       - 实时监控服务器状态
       - 自动剔除故障服务器
       - 自动恢复上线服务器

    3. 高可用
       - 消除单点故障
       - 故障自动转移
       - 提供冗余

    4. 扩展性
       - 动态添加/移除服务器
       - 应对流量峰值
  `,

  // 负载均衡层级
  layers: `
    网络模型中的负载均衡层级：

    四层负载均衡（L4）
    - 基于 IP + 端口
    - 如：Nginx TCP/UDP 负载均衡
    - 不解析具体内容

    七层负载均衡（L7）
    - 基于应用层协议
    - 如：Nginx HTTP 负载均衡
    - 可以基于 URL、Cookie、Header

    对比：
    ┌──────────────────────────────────────────────────────────┐
    │    L4 (传输层)      │      L7 (应用层)                     │
    ├──────────────────────────────────────────────────────────┤
    │ 速度快 (仅网络)    │   速度稍慢 (需解析内容)              │
    │ 功能有限           │   功能丰富                           │
    │ 基于 IP:Port       │   基于 URL/Header/Cookie            │
    │ 简单分发           │   智能路由                            │
    └──────────────────────────────────────────────────────────┘
  `,
};
```

### 3.2 负载均衡算法

```javascript
/**
 * 常见负载均衡算法
 */

// 1. 轮询（Round Robin）
const roundRobin = `
  最简单的算法：
  - 顺序循环分配请求
  - 每个服务器轮流处理

  示例：
  请求1 → 服务器A
  请求2 → 服务器B
  请求3 → 服务器C
  请求4 → 服务器A
  请求5 → 服务器B
  ...

  适用场景：
  - 服务器配置相同
  - 请求处理能力相近

  配置示例（Nginx）：
  upstream backend {
      server 192.168.1.10:8080;
      server 192.168.1.11:8080;
      server 192.168.1.12:8080;
  }

  server {
      location / {
          proxy_pass http://backend;
      }
  }
`;

// 2. 加权轮询（Weighted Round Robin）
const weightedRoundRobin = `
  根据服务器能力分配权重：

  服务器A: weight=5 (处理 50% 请求)
  服务器B: weight=3 (处理 30% 请求)
  服务器C: weight=2 (处理 20% 请求)

  示例：
  AAAAABBBCC

  适用场景：
  - 服务器配置不同
  - 新旧服务器混用
  - 云服务器弹性配置

  配置示例（Nginx）：
  upstream backend {
      server 192.168.1.10:8080 weight=5;
      server 192.168.1.11:8080 weight=3;
      server 192.168.1.12:8080 weight=2;
  }
`;

// 3. IP 哈希（IP Hash）
const ipHash = `
  根据客户端 IP 计算哈希值：

  hash = hash_func(client_ip) % server_count

  同一 IP 的请求总是发送到同一服务器

  优点：
  - 会话保持（Session Affinity）
  - 用户状态保持在同一服务器

  缺点：
  - 服务器变更时可能丢失会话
  - 不够均衡（某些 IP 请求多）

  配置示例（Nginx）：
  upstream backend {
      ip_hash;
      server 192.168.1.10:8080;
      server 192.168.1.11:8080;
      server 192.168.1.12:8080;
  }
`;

// 4. 最少连接（Least Connections）
const leastConnections = `
  将请求发送到当前连接数最少的服务器：

  服务器A: 100 连接
  服务器B: 50 连接  ← 选这个
  服务器C: 80 连接

  适用场景：
  - 请求处理时间差异大
  - 长连接场景
  - WebSocket 连接

  配置示例（Nginx）：
  upstream backend {
      least_conn;
      server 192.168.1.10:8080;
      server 192.168.1.11:8080;
      server 192.168.1.12:8080;
  }
`;

// 5. 加权最少连接（Weighted Least Connections）
const weightedLeastConnections = `
  结合连接数和权重：

  effective_load = active_connections / weight

  选择 effective_load 最小的服务器

  适用场景：
  - 服务器配置不同
  - 长短连接混合
`;

// 6. 随机（Random）
const random = `
  随机选择服务器：

  Two Random Choices 算法：
  1. 随机选择 2 台服务器
  2. 选择连接数较少的那个

  优点：
  - 实现简单
  - 效果接近最优
  - 适合分布式系统

  Nginx 实现：
  upstream backend {
      least_conn;  # 先用最少连接
      server ...;
  }
`;

// 7. 最短响应时间（Least Response Time）
const leastResponseTime = `
  选择响应时间最短的服务器：

  综合考虑：
  - 活跃连接数
  - 平均响应时间

  选择：(active_connections * avg_response_time) 最小的

  适用场景：
  - 对延迟敏感的应用
  - 需要优化用户体验

  通常是商业负载均衡器的功能
`;

// 算法对比
const algorithmComparison = `
  ┌────────────────────────────────────────────────────────────────┐
  │                     负载均衡算法对比                            │
  ├─────────────┬──────────────┬───────────────────────────────────┤
  │    算法      │   复杂度      │           适用场景                │
  ├─────────────┼──────────────┼───────────────────────────────────┤
  │  轮询       │    O(1)      │  服务器配置相同                    │
  │  加权轮询    │    O(1)      │  服务器配置不同                    │
  │  IP 哈希    │    O(1)      │  需要会话保持                      │
  │  最少连接   │    O(n)      │  长连接场景                        │
  │  随机       │    O(1)      │  简单场景                          │
  │  最短响应   │    O(n)      │  延迟敏感应用                      │
  └─────────────┴──────────────┴───────────────────────────────────┘
`;
```

### 3.3 负载均衡健康检查

```javascript
/**
 * 健康检查机制
 */

const healthCheck = {
  // 健康检查类型
  types: `
    被动健康检查：
    - 监控请求响应
    - 发现失败就标记为不健康
    - 可能需要多次失败才剔除

    主动健康检查：
    - 定期发送探测请求
    - 主动检测服务器状态
    - 更及时发现问题
  `,

  // HTTP 健康检查
  httpHealthCheck: `
    HTTP 健康检查：

    检测方式：
    - GET /health 或 /healthz
    - 检查响应状态码（2xx = 健康）

    检查内容：
    - 应用层是否正常
    - 数据库连接
    - 缓存连接

    配置示例（Nginx）：
    upstream backend {
        server 192.168.1.10:8080;
        server 192.168.1.11:8080;

        check interval=3000 rise=2 fall=3 timeout=1000 type=http;
        check_http_send "GET /health HTTP/1.0\\r\\n\\r\\n";
        check_http_expect_alive http_2xx;
    }
  `,

  // TCP 健康检查
  tcpHealthCheck: `
    TCP 健康检查：

    检测方式：
    - 尝试建立 TCP 连接
    - 能连接 = 健康

    适用场景：
    - 非 HTTP 协议
    - SMTP、Redis、MySQL 等
  `,

  // 健康检查频率
  checkInterval: `
    健康检查配置：

    interval: 检查间隔（毫秒）
    rise: 连续成功次数（转为健康）
    fall: 连续失败次数（转为不健康）
    timeout: 超时时间（毫秒）

    示例：
    interval=5000 rise=2 fall=3

    含义：
    - 每 5 秒检查一次
    - 连续 2 次成功 = 健康
    - 连续 3 次失败 = 不健康
  `,

  // 健康检查端点实现
  healthEndpoint: `
    // Express.js 健康检查端点
    app.get('/health', async (req, res) => {
      try {
        // 检查数据库
        await db.query('SELECT 1');

        // 检查 Redis
        await redis.ping();

        // 检查内存使用
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
          return res.status(503).json({
            status: 'unhealthy',
            reason: 'Memory usage too high',
          });
        }

        res.json({
          status: 'healthy',
          uptime: process.uptime(),
          memory: memUsage,
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
        });
      }
    });
  `,
};

// 故障转移
const failover = {
  // 自动故障转移
  automaticFailover: `
    故障检测和转移流程：

    1. 服务器A 发生故障
    2. 健康检查失败
    3. 负载均衡器标记服务器A 为不健康
    4. 请求不再发送到服务器A
    5. 请求自动分发到其他服务器

    用户体验：
    - 无感知，或只感知短暂延迟
    - 故障服务器被快速隔离
  `,

  // 主动/被动故障转移
  activePassive: `
    主动-被动模式：
    ┌─────────────────────────────────────────────────────────┐
    │                                                          │
    │    负载均衡器                                             │
    │        │                                                 │
    │   ┌────┴────┐                                           │
    │   │         │                                            │
    │   ▼         ▼                                            │
    │ 主服务器    备份服务器                                    │
    │ (active)   (passive)                                    │
    │                                              │
    │ 主服务器故障时                                             │
    │ 负载均衡器自动切换到备份服务器                             │
    │                                                          │
    └─────────────────────────────────────────────────────────┘
  `,
};
```

### 3.4 负载均衡实战配置

```javascript
/**
 * 实际项目中的负载均衡配置
 */

// 1. Nginx HTTP 负载均衡
const nginxHttpLb = `
  upstream backend {
      # 轮询（默认）
      server 192.168.1.10:8080;
      server 192.168.1.11:8080;
      server 192.168.1.12:8080;

      # 保持连接
      keepalive 32;
  }

  server {
      listen 80;
      server_name example.com;

      location / {
          proxy_pass http://backend;

          # 请求头设置
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;

          # 超时设置
          proxy_connect_timeout 5s;
          proxy_read_timeout 30s;
          proxy_send_timeout 10s;

          # 缓冲设置
          proxy_buffering on;
          proxy_buffer_size 4k;
          proxy_buffers 8 4k;
      }
  }
`;

// 2. Nginx TCP/UDP 负载均衡
const nginxTcpLb = `
  stream {
      upstream ssh_servers {
          server 192.168.1.10:22;
          server 192.168.1.11:22;
      }

      upstream mysql_servers {
          least_conn;
          server 192.168.1.20:3306;
          server 192.168.1.21:3306;
      }

      server {
          listen 2222;
          proxy_pass ssh_servers;
      }

      server {
          listen 3306;
          proxy_pass mysql_servers;
          proxy_connect_timeout 1s;
      }
  }
`;

// 3. Docker Swarm 负载均衡
const dockerSwarmLb = `
  # Docker Swarm 内置负载均衡

  # 创建服务
  docker service create \
    --name web \
    --replicas 3 \
    --publish 8080:80 \
    nginx

  # Docker Swarm 的路由网格（Routing Mesh）：
  # - 请求分发到任意副本
  # - 支持容器故障自动转移
  # - 基于 IPVS 实现
`;

// 4. Kubernetes Service 负载均衡
const k8sLb = `
  # Kubernetes Service 示例
  apiVersion: v1
  kind: Service
  metadata:
    name: web-service
  spec:
    type: LoadBalancer
    selector:
      app: web
    ports:
      - protocol: TCP
        port: 80
        targetPort: 8080

  # Kubernetes 负载均衡类型：
  # ClusterIP: 仅集群内部访问
  # NodePort: 通过节点端口访问
  # LoadBalancer: 云厂商负载均衡器
  # ExternalName: 外部服务别名
`;

// 5. 云厂商负载均衡
const cloudLb = {
  // AWS ALB (Application Load Balancer)
  awsAlb: `
    # AWS ALB 配置
    # 基于路径的路由
    # 支持 HTTP/HTTPS

    监听器规则：
    - 路径 /api/* → Target Group API
    - 路径 /static/* → Target Group Static
    - 默认 → Target Group Default
  `,

  // AWS NLB (Network Load Balancer)
  awsNlb: `
    # NLB 配置
    # 基于 IP + Port
    # 性能更高

    适用场景：
    - TCP/UDP 高性能
    - 游戏服务器
    - 金融交易
  `,

  // 阿里云 SLB
  aliSlb: `
    # 阿里云服务器负载均衡

    # 四层负载均衡
    - TCP/UDP
    - 支持会话保持
    - 连接耗尽配置

    # 七层负载均衡
    - HTTP/HTTPS
    - 基于 URL 转发
    - 证书管理
  `,
};

// 6. 负载均衡器高可用
const lbHighAvailability = {
  // 主备模式
  activePassive: `
    ┌─────────────────────────────────────────────────────┐
    │                                                      │
    │    虚拟 IP (VIP)                                     │
    │    192.168.1.100                                    │
    │                                                      │
    │         ▲                                             │
    │         │  监控                                      │
    │         │                                             │
    │    ┌────┴────┐                                        │
    │    │         │                                         │
    │    ▼         ▼                                         │
    │  主 LB     备 LB                                       │
    │  (活动)    ( standby)                                  │
    │                                                      │
    └─────────────────────────────────────────────────────┘

    故障转移：
    - Keepalived + VRRP 协议
    - 主 LB 故障时，VIP 漂移到备 LB
    - 切换时间：秒级
  `,

  // 双活模式
  activeActive: `
    ┌─────────────────────────────────────────────────────┐
    │                                                      │
    │    DNS 轮询                                         │
    │    lb1.example.com → 192.168.1.101                   │
    │    lb2.example.com → 192.168.1.102                   │
    │                                                      │
    │         ▲                     ▲                      │
    │         │                     │                      │
    │    ┌────┴────┐           ┌────┴────┐                │
    │    │  LB 1   │           │  LB 2   │                │
    │    └────┬────┘           └────┬────┘                │
    │         │                     │                      │
    └─────────┴─────────────────────┴──────────────────────┘
  `,
};
```

## 四、GSLB 全局负载均衡

### 4.1 GSLB 是什么？

**GSLB（Global Server Load Balancing，全局服务器负载均衡）** 是一种在地理分布的多个数据中心之间进行流量分配的技术。

**类比理解**：

```
没有 GSLB：
- 北京用户 → 美国服务器（慢）
- 上海用户 → 美国服务器（慢）

有 GSLB：
- 北京用户 → 北京数据中心（快）
- 上海用户 → 上海数据中心（快）
```

```javascript
/**
 * GSLB 的核心功能
 */

const gslbCoreFunctions = {
  // 核心能力
  capabilities: `
    1. 地理路由
       - 根据用户地理位置分配服务器
       - 选择最近的数据中心

    2. 健康检查
       - 多数据中心健康检查
       - 全局故障检测

    3. 故障转移
       - 主站点故障时切换到备份站点
       - 自动恢复

    4. 负载均衡
       - 数据中心间的负载分配
       - 基于权重的流量分配

    5. 持久性
       - 同一用户路由到同一数据中心
  `,

  // 与本地 LB 的区别
  vsLocalLb: `
    ┌────────────────────────────────────────────────────────────────┐
    │                本地负载均衡 vs 全局负载均衡                    │
    ├──────────────────────┬───────────────────────────────────────────┤
    │    本地负载均衡       │         全局负载均衡                     │
    ├──────────────────────┼───────────────────────────────────────────┤
    │ 同数据中心内         │ 跨数据中心/跨地区                        │
    │ 基于服务器健康       │ 基于数据中心健康                          │
    │ 分配到具体服务器     │ 分配到具体数据中心                        │
    │ Nginx/HAProxy        │ DNS/GSLB/Anycast                         │
    └──────────────────────┴───────────────────────────────────────────┘
  `,
};
```

### 4.2 GSLB 工作原理

```javascript
/**
 * GSLB 实现方式
 */

// 1. DNS 基础上的 GSLB
const dnsBasedGslb = `
  基于 DNS 的 GSLB：

  原理：
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  用户 ──► DNS ──► GSLB DNS ──► 返回最优 IP                        │
  │                          │                                        │
  │                    根据用户 IP                                    │
  │                    确定地理位置                                   │
  │                    检查数据中心健康                               │
  │                    返回最优数据中心 IP                             │
  │                                                                   │
  └─────────────────────────────────────────────────────────────────┘

  实现方式：

  1. 智能 DNS 解析
     - GSLB DNS 服务器分析用户来源
     - 返回距离用户最近的服务器 IP

  2. GSLB 设备
     - F5 Big-IP GTM
     - Citrix NetScaler
     - 阿里云 GSLB

  3. CDN GSLB
     - Cloudflare
     - AWS Route 53
     - 阿里云 DNS
`;

// 2. Anycast GSLB
const anycastGslb = `
  Anycast 原理：

  多个数据中心使用相同的 IP 地址
  互联网路由自动选择最近的路径

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │         北京用户                                                  │
  │              │                                                   │
  │              ▼                                                   │
  │    ┌──────────────────┐                                         │
  │    │   路由表         │                                         │
  │    │ AS12345          │                                         │
  │    │ 目标: 1.2.3.4    │                                         │
  │    │ 路径: 北京 → 北京 │  ← 选择这条                             │
  │    │ 路径: 北京 → 上海 │                                         │
  │    └──────────────────┘                                         │
  │                                                                   │
  │                                                                   │
  │         上海用户                                                  │
  │              │                                                   │
  │              ▼                                                   │
  │    ┌──────────────────┐                                         │
  │    │   路由表         │                                         │
  │    │ AS12345          │                                         │
  │    │ 目标: 1.2.3.4    │                                         │
  │    │ 路径: 上海 → 上海 │  ← 选择这条                             │
  │    │ 路径: 上海 → 北京 │                                         │
  │    └──────────────────┘                                         │
  │                                                                   │
  └─────────────────────────────────────────────────────────────────┘

  特点：
  - 不需要 DNS 解析
  - 依赖 BGP 路由协议
  - 自动就近访问
  - DDoS 防护（流量分散）

  典型应用：
  - DNS 根服务器
  - CDN 服务
  - Cloudflare
`;

// 3. 基于测量的 GSLB
const measurementBasedGslb = `
  基于实时测量的 GSLB：

  定期探测各数据中心：
  - 延迟
  - 丢包率
  - 可用性

  选择最优路径返回给用户

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │              GSLB 控制器                                          │
  │                  │                                               │
  │       ┌──────────┼──────────┐                                    │
  │       │          │          │                                     │
  │       ▼          ▼          ▼                                     │
  │    北京 DC    上海 DC    广州 DC                                   │
  │                                                                   │
  │    延迟:5ms   延迟:50ms  延迟:80ms                                │
  │    丢包:0%   丢包:1%    丢包:2%                                   │
  │                                                                   │
  │    返回给北京用户: 北京 DC IP                                     │
  │                                                                   │
  └─────────────────────────────────────────────────────────────────┘
`;

// GSLB 健康检查
const gslbHealthCheck = `
  GSLB 健康检查：

  检查内容：
  1. 数据中心网络可达
  2. 应用层服务正常
  3. 数据库可连接
  4. 证书有效

  检查方式：
  - HTTP/HTTPS 请求
  - TCP 连接
  - Ping/ICMP

  检查频率：
  - 正常：每 30 秒
  - 故障期间：每 5 秒

  故障判定：
  - 连续 3 次失败 = 故障
  - 连续 3 次成功 = 恢复
`;
```

### 4.3 GSLB 配置示例

```javascript
/**
 * 实际 GSLB 配置
 */

// AWS Route 53 GSLB
const route53Gslb = `
  // AWS Route 53 配置

  // 1. 创建健康检查
  aws route53 create-health-check --caller-reference 2025-01-01 \
    --health-check-config "{
      \"type\": \"HTTPS\",
      \"fullyQualifiedDomainName\": \"www.example.com\",
      \"port\": 443,
      \"resourcePath\": \"/health\",
      \"requestInterval\": 10,
      \"failureThreshold\": 3
    }"

  // 2. 创建记录集（带健康检查）
  aws route53 change-resource-record-sets --hosted-zone-id Z1234567890ABC \
    --change-batch "{
      \"changes\": [
        {
          \"action\": \"CREATE\",
          \"resourceRecordSet\": {
            \"name\": \"www.example.com\",
            \"type\": \"A\",
            \"setIdentifier\": \"us-east\",
            \"weight\": 100,
            \"healthCheckId\": \"abc123\",
            \"resourceRecords\": [
              {\"value\": \"1.2.3.4\"}
            ]
          }
        },
        {
          \"action\": \"CREATE\",
          \"resourceRecordSet\": {
            \"name\": \"www.example.com\",
            \"type\": \"A\",
            \"setIdentifier\": \"eu-west\",
            \"weight\": 0,
            \"healthCheckId\": \"def456\",
            \"resourceRecords\": [
              {\"value\": \"5.6.7.8\"}
            ]
          }
        }
      ]
    }"

  // 3. 地理路由配置
  aws route53 change-resource-record-sets --hosted-zone-id Z1234567890ABC \
    --change-batch "{
      \"changes\": [
        {
          \"action\": \"CREATE\",
          \"resourceRecordSet\": {
            \"name\": \"www.example.com\",
            \"type\": \"A\",
            \"geoLocation\": {\"continentCode\": \"EU\"},
            \"resourceRecords\": [
              {\"value\": \"5.6.7.8\"}
            ]
          }
        },
        {
          \"action\": \"CREATE\",
          \"resourceRecordSet\": {
            \"name\": \"www.example.com\",
            \"type\": \"A\",
            \"geoLocation\": {\"countryCode\": \"US\"},
            \"resourceRecords\": [
              {\"value\": \"1.2.3.4\"}
            ]
          }
        }
      ]
    }"
`;

// 阿里云 GSLB
const aliyunGslb = `
  // 阿里云 GSLB 配置

  // 创建应用型负载均衡
  aliyun slb CreateLoadBalancer \
    --loadBalancerName my-gslb \
    --loadBalancerSpec slb.s1.small \
    --region cn-beijing

  // 添加后端服务器组
  aliyun slb AddVServerGroupBackendServers \
    --loadBalancerId lb-123456 \
    --vServerGroupId vsg-123456 \
    --backendServers "[{'ServerId':'i-abc123','Weight':100},{'ServerId':'i-def456','Weight':100}]"

  // 配置健康检查
  aliyun slb SetHealthCheck \
    --loadBalancerId lb-123456 \
    --healthCheckTimeout 5 \
    --healthCheckInterval 2 \
    --healthCheckDomain www.example.com \
    --healthCheckURI /health

  // 配置访问控制
  aliyun slb SetLoadBalancerAclStatus \
    --loadBalancerId lb-123456 \
    --aclStatus on
`;

// Cloudflare GSLB
const cloudflareGslb = `
  // Cloudflare Traffic Router 配置

  // 1. 启用 Load Balancing
  // 在 Cloudflare 控制台启用 Load Balancing 功能

  // 2. 创建健康检查
  // Health Checks → Create

  // 3. 添加 Origin Pool
  // Pools → Create Pool

  // Pool: 北京 DC
  {
    "name": "beijing-pool",
    "origins": [
      {
        "address": "1.2.3.4",
        "enabled": true,
        "name": "beijing-origin-1"
      }
    ],
    "check_regions": ["APAC"],
    "monitor": "https-healthcheck"
  }

  // Pool: 上海 DC
  {
    "name": "shanghai-pool",
    "origins": [
      {
        "address": "5.6.7.8",
        "enabled": true,
        "name": "shanghai-origin-1"
      }
    ],
    "check_regions": ["APAC"],
    "monitor": "https-healthcheck"
  }

  // 4. 创建 Traffic Route
  // 使用地理位置和健康状态路由
  {
    "rules": [
      {
        "condition": "country == 'CN'",
        "pool": "beijing-pool"
      },
      {
        "condition": "country == 'HK'",
        "pool": "shanghai-pool"
      }
    ]
  }
`;
```

## 五、实战应用场景

### 5.1 高可用架构设计

```javascript
/**
 * 典型高可用架构
 */

// 三层架构 + 多层负载均衡
const threeTierArchitecture = `
  ┌─────────────────────────────────────────────────────────────────┐
  │                      用户请求                                     │
  │                                                                   │
  │                          ▼                                       │
  │                    ┌───────────┐                                │
  │                    │   GSLB    │ ← 全球负载均衡                  │
  │                    │  (DNS)    │   按地理位置分流                 │
  │                    └─────┬─────┘                                │
  │                          │                                       │
  │         ┌─────────────────┼─────────────────┐                   │
  │         ▼                 ▼                 ▼                   │
  │    ┌─────────┐       ┌─────────┐       ┌─────────┐              │
  │    │ CDN Edge│       │ CDN Edge│       │ CDN Edge│              │
  │    │ (北京)  │       │ (上海)  │       │ (广州)  │              │
  │    └────┬────┘       └────┬────┘       └────┬────┘              │
  │         │                 │                 │                   │
  │         └─────────────────┼─────────────────┘                   │
  │                           ▼                                       │
  │                    ┌───────────┐                                │
  │                    │   L4/L7   │ ← 本地负载均衡                   │
  │                    │  (Nginx)  │   健康检查                        │
  │                    └─────┬─────┘                                │
  │                          │                                       │
  │         ┌─────────────────┼─────────────────┐                   │
  │         ▼                 ▼                 ▼                   │
  │    ┌─────────┐       ┌─────────┐       ┌─────────┐              │
  │    │App Srv 1│       │App Srv 2│       │App Srv 3│              │
  │    │  (Node) │       │  (Node) │       │  (Node) │              │
  │    └────┬────┘       └────┬────┘       └────┬────┘              │
  │         │                 │                 │                   │
  │         └─────────────────┼─────────────────┘                   │
  │                           ▼                                       │
  │                    ┌───────────┐                                │
  │                    │ Database  │ ← 主从复制                      │
  │                    │  Cluster  │   自动故障转移                  │
  │                    └───────────┘                                │
  │                                                                   │
  └─────────────────────────────────────────────────────────────────┘
`;

// 核心组件说明
const componentDescription = {
  gslb: `
    GSLB (全局负载均衡):
    - AWS Route 53 / Cloudflare / 阿里云 DNS
    - 按地理位置分流
    - 故障转移
  `,

  cdn: `
    CDN (内容分发):
    - Cloudflare / AWS CloudFront / 阿里云 CDN
    - 静态资源缓存
    - DDoS 防护
  `,

  localLb: `
    本地负载均衡:
    - Nginx / HAProxy
    - L4/L7 负载均衡
    - 健康检查
  `,

  appServer: `
    应用服务器:
    - 无状态设计
    - 多副本部署
    - 自动扩缩容
  `,

  database: `
    数据库:
    - 主从复制
    - 自动故障转移
    - 读写分离
  `,
};

// 故障场景处理
const failureHandling = {
  // 场景1：单个应用服务器故障
  appServerFailure: `
    处理流程：

    1. Nginx 健康检查发现服务器2 无响应
    2. Nginx 自动剔除服务器2
    3. 请求分发到服务器1 和服务器3
    4. 发送告警通知运维
    5. 运维排查/修复服务器2
    6. 服务器2 恢复后自动加入

    用户影响：无（自动恢复）
  `,

  // 场景2：整个数据中心故障
  datacenterFailure: `
    处理流程：

    1. GSLB 健康检查发现北京 DC 不可用
    2. GSLB DNS 停止返回北京 DC IP
    3. 北京用户请求自动路由到上海 DC
    4. CDN 回源自动切换到上海 DC
    5. 发送告警通知值班人员
    6. 运维排查北京 DC 问题
    7. 北京 DC 恢复后，流量逐渐切回

    用户影响：短暂延迟，可能 1-5 秒
  `,

  // 场景3：数据库故障
  databaseFailure: `
    处理流程：

    1. 主库故障检测
    2. 自动提升从库为主库
    3. 应用服务器切换连接字符串
    4. 数据同步恢复
    5. 旧主库恢复后自动转为从库

    注意事项：
    - 需要配置自动重连
    - 做好数据一致性检查
    - 定期演练故障转移

    用户影响：可能丢失几秒的数据
  `,
};
```

### 5.2 全球加速方案

```javascript
/**
 * 全球加速实战
 */

// 方案1：CDN + GSLB
const cdnGslbSolution = `
  适合场景：
  - 静态资源为主
  - 用户分布全球
  - 对延迟要求高

  架构：
  1. CDN 缓存静态资源
  2. GSLB 按地理位置选择入口
  3. 就近接入 CDN 节点
  4. CDN 回源到最近的源站

  效果：
  - 静态资源：全球一致的低延迟
  - 动态请求：自动路由到最近源站
`;

// 方案2：专线 + Anycast
const专线AnycastSolution = `
  适合场景：
  - 动态请求为主
  - 对延迟敏感
  - 有海外业务需求

  架构：
  1. 国内使用专线
  2. 海外使用 Anycast IP
  3. BGP 路由自动就近接入

  效果：
  - 最佳网络路径
  - 抗 DDoS 能力
  - 成本较高
`;

// 方案3：SD-WAN
const sdWanSolution = `
  适合场景：
  - 多分支机构
  - 混合云架构
  - 需要统一网络管理

  架构：
  1. 各站点部署 SD-WAN 设备
  2. 流量自动选择最优路径
  3. 支持多种接入方式（Internet/4G/专线）
`;
```

### 5.3 容灾设计

```javascript
/**
 * 容灾设计要点
 */

// 1. 同城双活
const同城双活 = `
  同一城市两个数据中心：

  ┌────────────────────────────────────────────────────────────┐
  │                                                               │
  │    城市A数据中心              城市B数据中心                   │
  │    ┌─────────┐                ┌─────────┐                   │
  │    │  DC A   │◄──────────────►│  DC B   │                   │
  │    └────┬────┘     专线        └────┬────┘                   │
  │         │                           │                        │
  │         │    同步复制               │                        │
  │         └───────────────────────────┘                        │
  │                                                               │
  │    延迟：通常 < 5ms                                           │
  │    RPO: ≈ 0 (同步复制，数据零丢失)                            │
  │    RTO: 分钟级                                                │
  │                                                               │
  └────────────────────────────────────────────────────────────┘
`;

// 2. 两地三中心
const 两地三中心 = `
  ┌────────────────────────────────────────────────────────────┐
  │                                                               │
  │    城市A                                城市B                 │
  │                                                               │
  │    ┌─────────┐    同步复制    ┌─────────┐                  │
  │    │  主中心  │◄──────────────►│  同城备  │                  │
  │    │         │                │         │                  │
  │    └────┬────┘                └────┬────┘                  │
  │         │                           │                        │
  │         │                           │ 异步复制               │
  │         │    ┌───────────────────────┘                        │
  │         │    │                                                │
  │         │    ▼                                                │
  │         │ ┌─────────┐                                        │
  │         │ │ 异地备  │                                        │
  │         │ │ (冷备)  │                                        │
  │         │ └─────────┘                                        │
  │                                                               │
  │    RPO: 分钟级（异步）                                         │
  │    RTO: 小时级（需要数据恢复）                                  │
  │                                                               │
  └────────────────────────────────────────────────────────────┘
`;

// 3. 多云架构
const multiCloudArchitecture = `
  ┌────────────────────────────────────────────────────────────┐
  │                                                               │
  │    AWS                    阿里云                              │
  │    ┌─────────┐          ┌─────────┐                         │
  │    │   VPC   │◄─────────►│   VPC   │                        │
  │    └────┬────┘  VPN/专线  └────┬────┘                        │
  │         │                      │                              │
  │         │    数据同步          │                              │
  │         └──────────────────────┘                              │
  │                                                               │
  │    RPO: 分钟级                                                │
  │    RTO: 分钟级                                                │
  │    优势: 避免单一云厂商故障                                    │
  │                                                               │
  └────────────────────────────────────────────────────────────┘
`;

// RPO / RTO 解释
const rpoRto = `
  RPO (Recovery Point Objective):
  - 最大可接受的数据丢失时间
  - 决定备份频率

  RTO (Recovery Time Objective):
  - 最大可接受的系统中断时间
  - 决定恢复策略

  常见组合：
  ┌──────────────────────────────────────────────────────────┐
  │   方案       │     RPO      │      RTO                   │
  ├──────────────┼──────────────┼────────────────────────────┤
  │ 冷备         │    天级      │      天级                    │
  │ 温备         │    小时级    │      小时级                  │
  │ 热备         │    分钟级    │      分钟级                  │
  │ 双活         │    秒级      │      接近零                  │
  └──────────────────────────────────────────────────────────┘
`;
```

## 六、常见问题与总结

### 6.1 常见问题

```javascript
/**
 * DNS/CDN/负载均衡常见问题
 */

// DNS 问题
const dnsProblems = {
  q1: 'DNS 解析延迟高怎么办？',
  a1: `
    1. 使用更快的 DNS 服务商
       - Google DNS (8.8.8.8)
       - Cloudflare DNS (1.1.1.1)

    2. 启用 DNS 缓存
       - 浏览器缓存
       - 操作系统缓存
       - 本地 DNS 服务器缓存

    3. 使用 DNS over HTTPS (DoH)
       - 加密 DNS 查询
       - 避免 DNS 劫持
  `,

  q2: 'DNS 缓存失效慢怎么办？',
  a2: `
    1. 降低 TTL 值
       - 变更前设置为 300 秒
       - 变更后恢复正常

    2. 使用灰度发布
       - 先让少量用户访问新 IP
       - 确认无误后再全量

    3. 强制刷新
       - 清除本地 DNS 缓存
       - Windows: ipconfig /flushdns
  `,
};

// CDN 问题
const cdnProblems = {
  q1: 'CDN 缓存如何保证内容一致？',
  a1: `
    1. 版本化 URL
       - style.v2.css
       - app.a1b2c3d4.js

    2. 主动刷新
       - CDN 提供刷新 API
       - 发布时自动刷新

    3. 缓存时间设置合理
       - 不常更新：长缓存
       - 可能更新：短缓存 + 验证
  `,

  q2: 'CDN 回源导致源站压力大？',
  a2: `
    1. 提高缓存命中率
       - 合理设置缓存规则
       - 减少 query string 差异

    2. 限制回源带宽
       - CDN 限速
       - 源站限流

    3. 使用预热
       - 提前将热门内容推送到 CDN
  `,
};

// 负载均衡问题
const lbProblems = {
  q1: '会话保持失效怎么办？',
  a1: `
    1. 检查 Cookie 设置
       - 确保 Cookie 正确写入
       - 检查 Cookie 域名和路径

    2. 检查负载均衡算法
       - 使用 IP Hash 或 Cookie Hash
       - 确保一致性哈希正确

    3. 考虑分布式会话
       - Redis 存储会话
       - 应用层无状态设计
  `,

  q2: '如何避免负载不均？',
  a2: `
    1. 使用最少连接算法
       - 适合长连接场景

    2. 调整服务器权重
       - 根据服务器能力分配

    3. 检查服务器健康
       - 某台服务器可能有问题
       - 导致请求堆积
  `,
};
```

### 6.2 核心概念总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS/CDN/负载均衡核心概念                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DNS (域名系统):                                                 │
│  - 域名 → IP 地址转换                                            │
│  - 递归查询 vs 迭代查询                                          │
│  - 多层缓存：浏览器 → 操作系统 → 本地 DNS → 权威 DNS            │
│  - 记录类型：A, AAAA, CNAME, MX, TXT, NS                        │
│                                                                  │
│  CDN (内容分发网络):                                             │
│  - 边缘节点缓存                                                  │
│  - 就近访问                                                      │
│  - 缓存策略：Cache-Control, TTL                                  │
│  - 回源优化                                                      │
│                                                                  │
│  负载均衡:                                                       │
│  - L4 (传输层) vs L7 (应用层)                                    │
│  - 算法：轮询、加权、最少连接、IP Hash                            │
│  - 健康检查：主动 vs 被动                                        │
│                                                                  │
│  GSLB (全局负载均衡):                                            │
│  - 跨数据中心分流                                                │
│  - 基于地理位置                                                  │
│  - Anycast IP                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 最佳实践清单

```javascript
/**
 * DNS/CDN/负载均衡最佳实践
 */

const bestPractices = {
  dns: [
    '设置合理的 TTL（变更前降低，变更后恢复）',
    '使用 DNSSEC 保护 DNS 安全',
    '配置多个 DNS 服务器（主从）',
    '监控 DNS 解析延迟和可用性',
    '使用 DNS over HTTPS (DoH) 保护隐私',
  ],

  cdn: [
    '静态资源使用 CDN 加速',
    '设置长期缓存 + 版本化 URL',
    '配置合适的缓存规则',
    '启用 Gzip/Brotli 压缩',
    '使用 HTTPS',
    '配置浏览器缓存',
  ],

  loadBalancing: [
    '启用健康检查',
    '设置合理的超时时间',
    '配置会话保持（如果需要）',
    '使用合适的负载均衡算法',
    '监控后端服务器状态',
    '配置告警机制',
  ],

  gslb: [
    '配置多数据中心容灾',
    '定期演练故障转移',
    '设置合理的健康检查',
    '配置合理的流量权重',
    '监控全局流量分布',
  ],
};
```

---

> 下篇预告：《WebSocket 与 Socket.io 实战》—— WebSocket 握手原理、心跳机制、断线重连、房间管理，以及 Socket.io 的实际应用场景和最佳实践。