# 端到端测试深度指南

## 目录

1. [E2E测试概述](#1-e2e测试概述)
2. [Playwright快速入门](#2-playwright快速入门)
3. [页面对象模式](#3-页面对象模式)
4. [Playwright常用API详解](#4-playwright常用api详解)
5. [CI集成配置](#5-ci集成配置)
6. [最佳实践](#6-最佳实践)
7. [实战：完整测试用例](#7-实战完整测试用例)

---

## 1. E2E测试概述

### 1.1 什么是端到端测试

端到端测试（End-to-End Testing，简称E2E测试）是一种测试方法，通过模拟真实用户行为，从头到尾完整测试整个应用程序的流程。

**与单元测试的区别：**

| 对比维度 | 单元测试 | E2E测试 |
|---------|----------|---------|
| **测试范围** | 单个函数/模块 | 整个应用流程 |
| **测试环境** | 隔离的Mock环境 | 真实浏览器环境 |
| **执行速度** | 快（毫秒级） | 慢（秒级） |
| **维护成本** | 低 | 高 |
| **覆盖率** | 高（每个单元） | 低（主流程） |
| **测试数量** | 多 | 少 |

### 1.2 E2E测试工具对比

| 工具 | 驱动 | 语言 | 特点 | 适用场景 |
|------|------|------|------|----------|
| **Playwright** | Chromium/Firefox/WebKit | JS/TS | 跨浏览器、自动等待 | 现代Web应用 |
| **Cypress** | Chromium | JS/TS | 易于上手、时travel调试 | 单页应用 |
| **Selenium** | 多浏览器 | 多语言 | 历史悠久、生态丰富 | 传统Web应用 |
| **Puppeteer** | Chromium | JS/TS | Google维护、控制精细 | Chrome特定功能 |

### 1.3 Playwright的优势

```
┌──────────────────────────────────────────────────────────────┐
│                    Playwright 核心优势                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ 跨浏览器支持                                               │
│     支持 Chromium、Firefox、WebKit 三大浏览器引擎             │
│                                                               │
│  ✅ 自动化等待                                                 │
│     自动等待元素出现，无需手动sleep                            │
│                                                               │
│  ✅ 强大的定位器                                               │
│     支持文本、CSS选择器、XPath、Role等多种定位方式            │
│                                                               │
│  ✅ 并行测试                                                  │
│     天然支持多浏览器并行执行                                   │
│                                                               │
│  ✅ 网络拦截                                                  │
│     方便Mock接口、模拟各种网络场景                            │
│                                                               │
│  ✅ 追踪录制                                                  │
│     内置trace viewer，记录每一步操作                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Playwright快速入门

### 2.1 项目配置

```bash
# 安装Playwright
npm install -D @playwright/test

# 安装浏览器驱动
npx playwright install chromium    # Chromium（推荐）
npx playwright install firefox     # Firefox
npx playwright install webkit     # WebKit（Safari内核）

# 安装所有浏览器
npx playwright install            # 所有浏览器
npx playwright install --with-deps  # 包含系统依赖
```

### 2.2 Playwright配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    // 测试目录
    testDir: './tests',
    // 测试文件模式
    testMatch: '**/*.spec.ts',
    // 忽略的文件
    testIgnore: ['**/*.ignore.spec.ts'],
    // 最大并行数
    fullyParallel: true,
    // 失败时重试次数
    retries: process.env.CI ? 2 : 0,
    // 工作线程数
    workers: process.env.CI ? 1 : undefined,
    // 报告器
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['junit', { outputFile: 'playwright-report/results.xml' }]
    ],

    // 全局超时
    timeout: 30000,

    // 使用全局设置
    use: {
        // 基础URL
        baseURL: 'http://localhost:3000',
        // 跟踪文件
        trace: 'on-first-retry', // 'on' | 'off' | 'retain-on-failure'
        screenshot: 'only-on-failure', // 'on' | 'off' | 'only-on-failure'
        video: 'retain-on-failure', // 'on' | 'off' | 'retain-on-failure'
        // 导航超时
        actionTimeout: 10000,
        navigationTimeout: 30000,
        // 是否运行在headless模式
        headless: true
    },

    // 项目配置（多浏览器）
    projects: [
        // 配置1：Chromium
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        },
        // 配置2：Firefox
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox']
            }
        },
        // 配置3：WebKit（Safari）
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari']
            }
        },
        // 配置4：移动端模拟
        {
            name: 'Mobile Chrome',
            use: {
                ...devices['Pixel 5']
            }
        },
        {
            name: 'Mobile Safari',
            use: {
                ...devices['iPhone 12']
            }
        }
    ],

    // Web服务器配置（测试前自动启动）
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    }
});
```

### 2.3 第一个测试用例

```typescript
// tests/demo.spec.ts
import { test, expect } from '@playwright/test';

// 示例：登录流程测试
test.describe('登录功能', () => {
    test.beforeEach(async ({ page }) => {
        // 每个测试前访问登录页
        await page.goto('/login');
    });

    test('成功登录', async ({ page }) => {
        // 填写表单
        await page.getByLabel('用户名').fill('admin');
        await page.getByLabel('密码').fill('password123');

        // 点击登录按钮
        await page.getByRole('button', { name: '登录' }).click();

        // 等待跳转到首页
        await expect(page).toHaveURL('/dashboard');

        // 验证登录成功
        await expect(page.getByText('欢迎回来')).toBeVisible();
    });

    test('密码错误显示错误提示', async ({ page }) => {
        await page.getByLabel('用户名').fill('admin');
        await page.getByLabel('密码').fill('wrongpassword');

        await page.getByRole('button', { name: '登录' }).click();

        // 验证错误提示
        await expect(page.getByText('用户名或密码错误')).toBeVisible();
    });

    test('空表单提交显示验证错误', async ({ page }) => {
        await page.getByRole('button', { name: '登录' }).click();

        // 验证HTML5原生验证
        await expect(page.getByLabel('用户名')).toHaveErrorMessage('请填写此字段');
    });
});
```

### 2.4 运行测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/login.spec.ts

# 运行特定测试（按名称）
npx playwright test --grep "成功登录"

# 在UI模式下运行（浏览器中可视化）
npx playwright test --ui

# 在特定浏览器运行
npx playwright test --project=chromium

# 调试模式
npx playwright test --debug

# 生成测试报告
npx playwright show-report
```

---

## 3. 页面对象模式

### 3.1 为什么使用页面对象模式

页面对象模式（Page Object Pattern）是一种将页面元素和操作封装为对象的测试设计模式：

```
┌─────────────────────────────────────────────────────────────┐
│                   页面对象模式的优势                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📦 封装性                                                   │
│     将页面元素定位器封装在对象中，对外隐藏实现细节            │
│                                                              │
│  🔄 可维护性                                                 │
│     页面变化时只需修改页面对象，无需修改测试用例              │
│                                                              │
│  📖 可读性                                                   │
│     测试用例更像业务语言，易于理解                           │
│                                                              │
│  🔒 复用性                                                   │
│     多个测试可以复用同一个页面对象                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 页面对象基础结构

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * 登录页面对象
 * 封装登录页面的元素定位和操作方法
 */
export class LoginPage {
    // === 页面元素（私有属性）===
    private readonly page: Page;
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly submitButton: Locator;
    private readonly errorMessage: Locator;
    private readonly rememberMeCheckbox: Locator;

    constructor(page: Page) {
        this.page = page;
        // 初始化元素定位器
        this.usernameInput = page.getByLabel('用户名');
        this.passwordInput = page.getByLabel('密码');
        this.submitButton = page.getByRole('button', { name: '登录' });
        this.errorMessage = page.locator('.error-message');
        this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    }

    // === 页面导航 ===
    async goto() {
        await this.page.goto('/login');
        await expect(this.submitButton).toBeVisible();
    }

    // === 页面操作 ===
    async login(username: string, password: string, rememberMe = false) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);

        if (rememberMe) {
            await this.rememberMeCheckbox.check();
        }

        await this.submitButton.click();
    }

    // === 辅助方法 ===
    async expectErrorMessage(text: string) {
        await expect(this.errorMessage).toContainText(text);
    }

    async expectToBeRedirectedTo(url: string) {
        await expect(this.page).toHaveURL(new RegExp(url));
    }

    async expectSubmitButtonDisabled() {
        await expect(this.submitButton).toBeDisabled();
    }

    async expectSubmitButtonEnabled() {
        await expect(this.submitButton).toBeEnabled();
    }

    // === 状态检查 ===
    async isPasswordVisible() {
        return this.passwordInput.isVisible();
    }
}
```

### 3.3 使用页面对象

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('登录功能', () => {
    test('成功登录并跳转首页', async ({ page }) => {
        // 创建页面对象
        const loginPage = new LoginPage(page);

        // 导航到登录页
        await loginPage.goto();

        // 执行登录
        await loginPage.login('admin', 'password123');

        // 验证跳转
        await loginPage.expectToBeRedirectedTo('/dashboard');
    });

    test('记住我选项正常工作', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // 勾选记住我
        await loginPage.login('admin', 'password123', true);

        // 验证
        await loginPage.expectToBeRedirectedTo('/dashboard');
    });

    test('错误密码显示错误提示', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login('admin', 'wrongpassword');

        await loginPage.expectErrorMessage('用户名或密码错误');
    });
});
```

### 3.4 复合页面对象

```typescript
// tests/pages/DashboardPage.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * 仪表盘页面对象
 */
export class DashboardPage {
    private readonly page: Page;
    private readonly sidebar: Locator;
    private readonly userMenu: Locator;
    private readonly logoutButton: Locator;
    private readonly welcomeMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.sidebar = page.locator('.sidebar');
        this.userMenu = page.getByRole('button', { name: /用户菜单/ });
        this.logoutButton = page.getByRole('menuitem', { name: '退出登录' });
        this.welcomeMessage = page.locator('.welcome-message');
    }

    async goto() {
        await this.page.goto('/dashboard');
    }

    async expectWelcomeMessage(name: string) {
        await expect(this.welcomeMessage).toContainText(`欢迎, ${name}`);
    }

    async logout() {
        await this.userMenu.click();
        await this.logoutButton.click();
    }

    async expectLoggedOut() {
        await expect(this.page).toHaveURL(/\/login/);
    }
}
```

```typescript
// tests/e2e/用户流程.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test('完整用户登录流程', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 1. 登录
    await loginPage.goto();
    await loginPage.login('张三', 'password123');

    // 2. 验证跳转
    await dashboardPage.expectWelcomeMessage('张三');

    // 3. 退出登录
    await dashboardPage.logout();

    // 4. 验证已退出
    await dashboardPage.expectLoggedOut();
});
```

---

## 4. Playwright常用API详解

### 4.1 元素定位器

```typescript
import { test, locator } from '@playwright/test';

test('元素定位器示例', async ({ page }) => {
    // === 文本定位 ===
    await page.getByText('提交');                    // 按文本内容
    await page.getByText('提交', { exact: true });  // 精确匹配
    await page.getByText(/^\d+$/);                   // 正则表达式

    // === 角色定位（推荐）===
    await page.getByRole('button', { name: '提交' });
    await page.getByRole('link', { name: '了解更多' });
    await page.getByRole('heading', { level: 1 });
    await page.getByRole('textbox', { name: '用户名' });
    await page.getByRole('checkbox', { checked: true });
    await page.getByRole('alert');

    // === Label定位 ===
    await page.getByLabel('用户名');
    await page.getByLabel('记住密码', { exact: false });

    // === Placeholder定位 ===
    await page.getByPlaceholder('请输入用户名');

    // === Alt文本定位（图片）===
    await page.getByAltText('用户头像');

    // === Title属性定位 ===
    await page.getByTitle('删除');

    // === 测试ID定位 ===
    await page.getByTestId('submit-button');

    // === CSS选择器 ===
    await page.locator('.container .btn-primary');
    await page.locator('#login-form');
    await page.locator('div[class*="error"]');

    // === XPath ===
    await page.locator('xpath=//button[contains(text(),"提交")]');
    await page.locator('//form[@id="login"]//button');

    // === 组合定位 ===
    await page.getByRole('form', { name: '登录表单' })
        .getByLabel('用户名');

    // === 多个元素 ===
    const items = page.locator('.list-item');
    await expect(items).toHaveCount(5);

    // 遍历操作
    for (const item of await items.all()) {
        await item.click();
    }

    // === 过滤 ===
    const buttons = page.getByRole('button');
    const enabledButton = buttons.filter({ hasNot: page.locator('[disabled]') });
    await enabledButton.first().click();
});
```

### 4.2 交互操作

```typescript
test('交互操作示例', async ({ page }) => {
    // === 点击 ===
    await page.click('#button');
    await page.click('#button', { button: 'right' }); // 右键
    await page.click('#button', { clickCount: 2 });  // 双击
    await page.dblclick('#button');                   // 简写双击

    // === 输入 ===
    await page.fill('#input', 'hello');      // 填充（清空后输入）
    await page.type('#input', 'hello');       // 逐字符输入（模拟打字）
    await page.press('#input', 'Enter');      // 按键

    // 输入组合键
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.press('Meta+k');
    await page.keyboard.down('Shift');
    await page.keyboard.up('Shift');

    // === 悬停 ===
    await page.hover('#menu');
    await page.hover('#menu', { position: { x: 10, y: 10 } });

    // === 拖拽 ===
    await page.dragAndDrop('#source', '#target');

    // 或手动拖拽
    const source = page.locator('#source');
    const target = page.locator('#target');
    await source.dragTo(target);

    // === 下拉选择 ===
    await page.selectOption('#country', 'China');
    await page.selectOption('#country', { label: '中国' });
    await page.selectOption('#country', { value: 'CN' });
    await page.selectOption('#countries', ['CN', 'US', 'JP']); // 多选

    // === 文件上传 ===
    await page.setInputFiles('#upload', 'path/to/file.pdf');
    await page.setInputFiles('#upload', ['file1.pdf', 'file2.pdf']);
    await page.setInputFiles('#upload', ''); // 清空

    // === Checkbox / Radio ===
    await page.check('#agree');
    await page.uncheck('#newsletter');
    await page.check('input[name="gender"][value="male"]');

    // === 滚动 ===
    await page.locator('#footer').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // === 聚焦/失焦 ===
    await page.focus('#input');
    await page.locator('#input').focus();
    await page.locator('#input').blur();

    // === 清除 ===
    await page.locator('#input').clear();
});
```

### 4.3 断言API

```typescript
test('断言示例', async ({ page }) => {
    // === 可见性 ===
    await expect(page.locator('#success')).toBeVisible();
    await expect(page.locator('#hidden')).toBeHidden();
    await expect(page.locator('#loading')).toBeAttached(); // 存在于DOM

    // === 内容 ===
    await expect(page.locator('#title')).toHaveText('标题');
    await expect(page.locator('#title')).toContainText('标');
    await expect(page.locator('#list')).toHaveCount(5);
    await expect(page.locator('#items')).toHaveText([
        'Item 1',
        'Item 2',
        'Item 3'
    ]);

    // === 表单值 ===
    await expect(page.locator('#input')).toHaveValue('hello');
    await expect(page.locator('#textarea')).toHaveValue('多行\n文本');

    // === 复选框 ===
    await expect(page.locator('#agree')).toBeChecked();
    await expect(page.locator('#disagree')).not.toBeChecked();

    // === 选择框 ===
    await expect(page.locator('#country')).toHaveValue('CN');

    // === URL ===
    await expect(page).toHaveURL('https://example.com');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveURL(url => url.pathname === '/dashboard');

    // === 标题 ===
    await expect(page).toHaveTitle('首页');
    await expect(page).toHaveTitle(/首页 - .*/);

    // === 样式 ===
    await expect(page.locator('#error')).toHaveCSS('color', 'rgb(255, 0, 0)');

    // === 属性 ===
    await expect(page.locator('#link')).toHaveAttribute('href', 'https://example.com');
    await expect(page.locator('#input')).toHaveAttribute('required');

    // === 禁用状态 ===
    await expect(page.locator('#submit')).toBeEnabled();
    await expect(page.locator('#disabled')).toBeDisabled();
    await expect(page.locator('#readonly')).toHaveAttribute('readonly');

    // === 超时 ===
    await expect(page.locator('#dynamic')).toBeVisible({ timeout: 10000 });

    // === 否定断言 ===
    await expect(page.locator('#error')).not.toBeVisible();
    await expect(page.locator('#title')).not.toHaveText('错误标题');
});
```

### 4.4 网络拦截与Mock

```typescript
test('网络拦截示例', async ({ page }) => {
    // === Mock API响应 ===
    await page.route('**/api/users', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 1, name: '张三' },
                { id: 2, name: '李四' }
            ])
        });
    });

    // === Mock GraphQL ===
    await page.route('**/graphql', route => {
        if (route.request().postDataJSON().operationName === 'GetUser') {
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    data: { user: { id: '1', name: 'Mocked User' } }
                })
            });
        } else {
            route.continue();
        }
    });

    // === 模拟错误 ===
    await page.route('**/api/protected', route => {
        route.abort('failed');  // 网络错误
        // 或
        route.fulfill({ status: 401 });
    });

    // === 修改响应 ===
    await page.route('**/api/products', async route => {
        const response = await route.fetch();
        const json = await response.json();

        // 修改响应数据
        json.products.forEach((p: any) => {
            p.price = p.price * 0.8; // 打8折
        });

        route.fulfill({
            response,
            body: JSON.stringify(json)
        });
    });

    // === 延迟响应 ===
    await page.route('**/api/slow', route => {
        route.fulfill({
            status: 200,
            body: JSON.stringify({ message: 'delayed' }),
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    });

    // 等待请求完成
    const responsePromise = page.waitForResponse('**/api/data');
    await page.click('#load-data');
    const response = await responsePromise;
    expect(response.status()).toBe(200);
});
```

### 4.5 等待与超时

```typescript
test('等待示例', async ({ page }) => {
    // === 自动等待 ===
    // Playwright自动等待元素可见、可点击后再操作
    await page.click('#dynamic-button');

    // === 显式等待 ===
    await page.waitForSelector('#loaded', { state: 'visible' });
    await page.waitForSelector('#loaded', { state: 'hidden' });
    await page.waitForSelector('#loaded', { state: 'attached' });

    // === 等待URL变化 ===
    await page.waitForURL('**/success');

    // === 等待导航 ===
    await page.waitForNavigation({
        url: '**/dashboard',
        waitUntil: 'networkidle' // 'load' | 'domcontentloaded' | 'networkidle'
    });

    // === 等待请求 ===
    const request = await page.waitForRequest('**/api/data');
    expect(request.url()).toContain('/api/data');

    // === 等待响应 ===
    const response = await page.waitForResponse('**/api/users');
    expect(response.status()).toBe(200);

    // === 等待函数 ===
    await page.waitForFunction(() => {
        return document.querySelector('#counter')?.textContent === '10';
    });

    // === 等待时间 ===
    await page.waitForTimeout(1000);

    // === 自定义条件 ===
    await page.waitFor(async () => {
        const count = await page.locator('.item').count();
        return count >= 5;
    });
});
```

---

## 5. CI集成配置

### 5.1 GitHub Actions配置

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

jobs:
    e2e:
        timeout-minutes: 30
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci

            - name: Install Playwright browsers
              run: npx playwright install --with-deps chromium

            - name: Build application
              run: npm run build

            - name: Run Playwright tests
              run: npx playwright test
              env:
                  CI: true

            - name: Upload test results
              uses: actions/upload-artifact@v4
              if: always()
              with:
                  name: playwright-report
                  path: playwright-report/
                  retention-days: 30

            - name: Upload test results (JUnit XML)
              uses: actions/upload-artifact@v4
              if: always()
              with:
                  name: playwright-results
                  path: playwright-report/results.xml

            - name: Upload screenshots on failure
              uses: actions/upload-artifact@v4
              if: failure()
              with:
                  name: playwright-screenshots
                  path: test-results/
                  retention-days: 7
```

### 5.2 GitLab CI配置

```yaml
# .gitlab-ci.yml
stages:
    - test

e2e:
    stage: test
    image: mcr.microsoft.com/playwright:v1.40.0
    services:
        - docker:dind
    before_script:
        - npm ci
        - npx playwright install --with-deps chromium
    script:
        - npm run build
        - npx playwright test --reporter=junit --output=results.xml
    artifacts:
        when: always
        reports:
            junit: results.xml
        paths:
            - playwright-report/
            - test-results/
    variables:
        GIT_DEPTH: 0
    timeout: 30m
```

### 5.3 Jenkins配置

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0'
            args '-u root:root'
        }
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('E2E Tests') {
            steps {
                script {
                    def testResults = 'playwright-report/results.xml'
                    try {
                        sh 'npx playwright test --reporter=junit'
                    } finally {
                        junit testResults
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'playwright-report',
                            reportFiles: 'index.html',
                            reportName: 'Playwright Report'
                        ])
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true
        }
    }
}
```

---

## 6. 最佳实践

### 6.1 测试结构最佳实践

```typescript
// tests/example.spec.ts
import { test, expect, Page } from '@playwright/test';

/**
 * 测试文件组织规范
 *
 * 1. 使用 describe 组织相关测试
 * 2. 使用 beforeEach 准备测试数据
 * 3. 测试名称应清晰描述预期行为
 * 4. 每个测试应独立运行
 */

// === 全局Fixture ===
test.beforeAll(async ({ browser }) => {
    // 全局初始化
});

test.afterAll(async () => {
    // 全局清理
});

// === 测试组 ===
test.describe('用户管理模块', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        // 每个测试前创建新页面（确保隔离）
        const context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterEach(async () => {
        // 测试后清理
        await page.close();
    });

    test('创建用户成功', async () => {
        // 测试代码
    });
});

// === 参数化测试 ===
test.describe('参数化测试', () => {
    const testCases = [
        { input: 'a', expected: 'A' },
        { input: 'b', expected: 'B' },
        { input: 'c', expected: 'C' }
    ];

    for (const { input, expected } of testCases) {
        test(`转换为大写: ${input} -> ${expected}`, async ({ page }) => {
            await page.goto('/uppercase');
            await page.getByLabel('输入').fill(input);
            await page.getByRole('button', { name: '转换' }).click();
            await expect(page.getByLabel('输出')).toHaveValue(expected);
        });
    }
});
```

### 6.2 可靠性最佳实践

```typescript
test('可靠的测试实践', async ({ page }) => {
    // === 使用稳定的定位器 ===
    // 推荐：角色定位器
    await page.getByRole('button', { name: '提交' });

    // 不推荐：CSS类名（可能变化）
    await page.click('.btn-submit');

    // === 使用 expect 等待条件 ===
    // 推荐：自动等待
    await expect(page.getByText('保存成功')).toBeVisible({ timeout: 10000 });

    // 不推荐：固定等待
    await page.waitForTimeout(5000);

    // === 使用网络idle等待 ===
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // === 使用数据测试属性 ===
    // HTML中添加 data-testid 属性
    // <button data-testid="submit-btn">提交</button>
    await page.getByTestId('submit-btn').click();

    // === 处理弹窗 ===
    // 监听弹窗
    page.on('dialog', async dialog => {
        await dialog.accept(); // 或 dialog.dismiss()
    });
    await page.click('#trigger-alert');

    // === 处理iframe ===
    const frame = page.frameLocator('#editor-frame');
    await frame.getByText('新文本').click();
});
```

### 6.3 可维护性最佳实践

```typescript
// === 1. 使用常量定义选择器 ===
const Selectors = {
    login: {
        username: 'input[name="username"]',
        password: 'input[name="password"]',
        submit: 'button[type="submit"]'
    },
    dashboard: {
        userName: '.user-name',
        logout: 'button:has-text("退出")'
    }
} as const;

test('登录测试', async ({ page }) => {
    await page.fill(Selectors.login.username, 'admin');
    await page.fill(Selectors.login.password, 'password');
    await page.click(Selectors.login.submit);
});

// === 2. 使用环境变量 ===
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test('导航测试', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
});

// === 3. 分离测试数据 ===
// tests/fixtures/users.json
{
    "validUsers": [
        { "username": "admin", "password": "admin123" },
        { "username": "user", "password": "user123" }
    ],
    "invalidUsers": [
        { "username": "admin", "password": "wrong" },
        { "username": "", "password": "" }
    ]
}

// tests/e2e/auth.spec.ts
import users from '../fixtures/users.json';

test('使用测试数据登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', users.validUsers[0].username);
    await page.fill('[name="password"]', users.validUsers[0].password);
});
```

### 6.4 调试最佳实践

```typescript
// === 1. 使用trace viewer ===
// 在测试中添加
await page.context().tracing.start({
    screenshots: true,
    snapshots: true
});

// 执行测试步骤
await page.click('#button');

// 停止trace并保存
await page.context().tracing.stop();

// === 2. 截图 ===
// 测试失败时自动截图（配置中已设置）
// 手动截图
await page.screenshot({ path: 'debug.png', fullPage: true });

// === 3. 录制视频 ===
// 配置中设置
// video: 'retain-on-failure'

// === 4. 控制台日志 ===
test('调试测试', async ({ page }) => {
    // 监听控制台消息
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console error:', msg.text());
        }
    });

    // 监听网络请求
    page.on('request', request => {
        console.log('Request:', request.url());
    });

    page.on('response', response => {
        console.log('Response:', response.url(), response.status());
    });

    // 执行测试
    await page.click('#button');
});

// === 5. 调试模式 ===
// 使用 page.pause() 进入调试模式
test('调试测试', async ({ page }) => {
    await page.goto('/');
    await page.pause(); // 暂停并进入debug模式
    // 可以使用 playwright inspect 命令检查元素
});
```

---

## 7. 实战：完整测试用例

### 7.1 完整E2E测试示例

```typescript
// tests/e2e/complete-flow.spec.ts
import { test, expect, Page, request } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UserManagementPage } from '../pages/UserManagementPage';

test.describe.serial('用户管理完整流程', () => {
    let page: Page;
    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;
    let userManagementPage: UserManagementPage;

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext({
            // 模拟不同设备
            viewport: { width: 1920, height: 1080 },
            // 模拟地理位置
            geolocation: { latitude: 39.9042, longitude: 116.4074 },
            // 模拟权限
            permissions: ['geolocation']
        });
        page = await context.newPage();

        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        userManagementPage = new UserManagementPage(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('完整CRUD用户流程', async () => {
        // ====== 1. 登录 ======
        await loginPage.goto();
        await loginPage.login('admin', 'admin123');

        await dashboardPage.expectWelcomeMessage('管理员');
        console.log('✓ 登录成功');

        // ====== 2. 导航到用户管理 ======
        await page.click('text=用户管理');
        await expect(page).toHaveURL(/\/users/);
        console.log('✓ 导航到用户管理页');

        // ====== 3. 创建用户 ======
        await userManagementPage.clickCreateButton();
        await userManagementPage.fillUserForm({
            name: '新用户',
            email: 'newuser@example.com',
            role: 'editor'
        });
        await userManagementPage.submitForm();

        // 验证成功提示
        await expect(page.getByText('用户创建成功')).toBeVisible({ timeout: 5000 });
        console.log('✓ 用户创建成功');

        // ====== 4. 搜索用户 ======
        await userManagementPage.searchUsers('新用户');
        await expect(userManagementPage.getUserRow('新用户')).toBeVisible();
        console.log('✓ 搜索功能正常');

        // ====== 5. 编辑用户 ======
        await userManagementPage.clickEditButton('新用户');
        await userManagementPage.fillUserForm({
            name: '更新后的用户',
            email: 'updated@example.com',
            role: 'admin'
        });
        await userManagementPage.submitForm();

        await expect(page.getByText('用户更新成功')).toBeVisible();
        console.log('✓ 用户编辑成功');

        // ====== 6. 删除用户 ======
        await userManagementPage.clickDeleteButton('更新后的用户');

        // 处理确认弹窗
        page.on('dialog', dialog => dialog.accept());

        await expect(page.getByText('用户删除成功')).toBeVisible();
        console.log('✓ 用户删除成功');

        // ====== 7. 登出 ======
        await dashboardPage.logout();
        await dashboardPage.expectLoggedOut();
        console.log('✓ 登出成功');
    });

    test('无权限用户无法访问管理页面', async () => {
        await loginPage.goto();
        await loginPage.login('regularuser', 'password123');

        // 普通用户不应该看到用户管理入口
        await expect(page.getByText('用户管理')).not.toBeVisible();

        // 直接访问应该被拒绝
        await page.goto('/users');
        await expect(page.getByText('403')).toBeVisible();
    });

    test('表单验证测试', async ({ page }) => {
        await loginPage.goto();
        await loginPage.login('admin', 'admin123');

        await page.click('text=用户管理');
        await userManagementPage.clickCreateButton();

        // 提交空表单
        await userManagementPage.submitForm();

        // 验证验证错误
        await expect(page.getByText('姓名不能为空')).toBeVisible();
        await expect(page.getByText('邮箱不能为空')).toBeVisible();

        // 填写无效邮箱
        await userManagementPage.fillUserForm({
            name: 'Test',
            email: 'invalid-email'
        });
        await userManagementPage.submitForm();

        await expect(page.getByText('邮箱格式不正确')).toBeVisible();
    });

    test('数据表格排序和筛选', async ({ page }) => {
        await loginPage.goto();
        await loginPage.login('admin', 'admin123');
        await page.click('text=用户管理');

        // 测试排序
        await userManagementPage.clickColumnHeader('姓名');
        await userManagementPage.clickColumnHeader('姓名');

        // 测试筛选
        await userManagementPage.filterByRole('管理员');
        const rows = await userManagementPage.getAllUserRows();
        for (const row of rows) {
            const role = await row.locator('.role-badge').textContent();
            expect(role).toBe('管理员');
        }
    });
});
```

### 7.2 性能测试示例

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('性能测试', () => {
    test('首页加载时间', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/', { waitUntil: 'networkidle' });

        const loadTime = Date.now() - startTime;
        console.log(`页面加载时间: ${loadTime}ms`);

        // 页面加载时间应该小于3秒
        expect(loadTime).toBeLessThan(3000);
    });

    test('关键元素可见时间', async ({ page }) => {
        await page.goto('/');

        // 测量关键元素加载时间
        const startTime = Date.now();
        await expect(page.getByRole('main')).toBeVisible();
        const mainVisibleTime = Date.now() - startTime;

        await expect(page.getByRole('navigation')).toBeVisible();
        const navVisibleTime = Date.now() - startTime;

        console.log(`主内容可见: ${mainVisibleTime}ms`);
        console.log(`导航可见: ${navVisibleTime}ms`);

        expect(mainVisibleTime).toBeLessThan(2000);
    });

    test('页面资源数量', async ({ page }) => {
        const resources: string[] = [];

        page.on('response', response => {
            if (response.status() === 200) {
                resources.push(response.url());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        console.log(`总资源数: ${resources.length}`);

        // 页面资源数量应该合理
        expect(resources.length).toBeLessThan(50);
    });

    test('Largest Contentful Paint (LCP)', async ({ page }) => {
        await page.goto('/');

        // 获取LCP指标
        const lcp = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry.startTime);
                }).observe({ type: 'largest-contentful-paint', buffered: true });

                // 超时处理
                setTimeout(() => resolve(0), 5000);
            });
        });

        console.log(`LCP: ${lcp}ms`);

        // LCP应该小于2.5秒
        expect(lcp).toBeLessThan(2500);
    });
});
```
