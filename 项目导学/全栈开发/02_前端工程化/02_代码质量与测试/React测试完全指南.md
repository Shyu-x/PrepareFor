# React测试完全指南

## 目录

1. [测试基础概念](#1-测试基础概念)
2. [Jest测试框架详解](#2-jest测试框架详解)
3. [React Testing Library完全指南](#3-react-testing-library完全指南)
4. [React组件深度测试](#4-react组件深度测试)
5. [React集成测试](#5-react集成测试)
6. [端到端测试E2E](#6-端到端测试e2e)
7. [测试覆盖率](#7-测试覆盖率)
8. [CI持续集成测试](#8-ci持续集成测试)
9. [实战：完整测试项目](#9-实战完整测试项目)

---

## 1. 测试基础概念

### 1.1 测试类型详解

前端测试分为多种类型，每种类型都有其特定的用途和特点。理解这些测试类型的区别和联系，对于构建可靠的测试体系至关重要。

**单元测试（Unit Testing）** 是最小粒度的测试，用于验证单个函数、组件或模块的行为。单元测试的特点是执行速度快、反馈及时、隔离性好。一个优秀的单元测试应该专注于测试一个具体的功能点，不依赖外部系统（如数据库、网络请求等）。例如，测试一个格式化日期的函数，只需要验证输入特定日期格式时，输出是否符合预期格式。

**集成测试（Integration Testing）** 验证多个组件或模块协同工作的正确性。集成测试比单元测试的测试范围更大，需要考虑组件之间的交互和数据流动。在React应用中，集成测试通常用于测试组件与Context、Store的交互，或者测试多个相关组件的组合行为。

**端到端测试（E2E Testing）** 从用户视角出发，模拟真实的用户操作流程，验证整个应用的功能正确性。E2E测试覆盖完整的用户场景，包括UI交互、API调用、数据库操作等。E2E测试的缺点是执行速度慢、维护成本高，因此通常只覆盖核心业务流程。

**快照测试（Snapshot Testing）** 通过保存组件输出的快照，并与其后续版本进行比较，来检测意外的UI变化。快照测试特别适合检测样式变化和组件结构变化，但需要配合其他测试类型使用，因为仅仅UI变化不一定代表bug。

### 1.2 测试金字塔

测试金字塔是一种指导测试策略的经典模型，它描述了不同层次测试的数量关系和成本效益。

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲        E2E测试：少量、昂贵、慢速
                 ╱──────╲        覆盖核心用户流程
                ╱        ╲
               ╱ 集成测试 ╲      集成测试：中等数量
              ╱────────────╲
             ╱              ╲
            ╱   单元测试     ╲    单元测试：大量、廉价、快速
           ╱──────────────────╲   覆盖所有独立模块
```

**测试金字塔的核心原则：**

底层测试（单元测试）数量最多，因为它们覆盖了应用的基础构建块，任何基础模块的问题都可能导致上层功能失败。中层测试（集成测试）验证模块间的协作。顶层测试（E2E）数量最少，但价值最高，它们验证完整的用户旅程。

**为什么遵循测试金字塔？**

单元测试的执行速度极快，通常每秒可以运行数千个测试，这使得TDD（测试驱动开发）成为可能。当测试失败时，单元测试能够精确定位问题，因为每个测试只验证一个功能点。集成测试需要更多时间，因为它们涉及更多的组件和依赖。E2E测试最慢，因为它们需要启动完整的应用环境并模拟真实用户操作。

**实际项目中的测试分布建议：**

对于一个典型的Web应用，建议的测试分布是：单元测试占70%，集成测试占20%，E2E测试占10%。这个比例可以根据项目特点调整——业务逻辑复杂的应用可以增加单元测试比例，UI交互复杂的应用可以适当增加E2E测试。

### 1.3 TDD测试驱动开发

TDD（Test-Driven Development）是一种软件开发方法论，其核心思想是先写测试，再写实现代码。TDD的开发周期通常被称为"红-绿-重构"循环。

**红阶段（Red）：** 编写一个会失败的测试。此时你明确了需要实现什么功能，以及如何验证这个功能是否正确。这个测试应该清晰地描述期望的行为。

**绿阶段（Green）：** 编写最简单的代码使测试通过。不要试图一次性实现完美代码，只需要让测试通过即可。这个阶段的代码可能不够优雅，但它是正确的。

**重构阶段（Refactor）：** 在保持测试通过的前提下，优化代码结构、消除重复、提升可读性。测试是你重构的安全网。

**TDD的优势：**

首先，TDD强制你思考接口设计。在编写测试之前，你必须明确函数的签名、参数、返回值和边界条件。这种前置思考往往能发现设计问题，避免后期大规模重构。

其次，TDD提供了即时反馈。当你修改代码时，测试立即告诉你是否破坏了现有功能。这种快速反馈循环大大缩短了调试时间。

第三，测试覆盖率自然提高。因为TDD要求先写测试，所以最终代码几乎必然有高测试覆盖率。

**TDD的挑战：**

TDD对开发者的要求较高，需要深刻理解测试和业务逻辑的边界。对于UI变化频繁的项目，维护测试的成本可能较高。

### 1.4 BDD行为驱动开发

BDD（Behavior-Driven Development）是TDD的扩展，它强调用自然语言描述测试，使测试成为技术团队和业务团队之间的桥梁。BDD的语法通常使用Gherkin格式。

```gherkin
# Gherkin格式的BDD测试
功能: 用户登录
  场景: 使用正确凭据登录
    假设 我在登录页面
    而且 我输入了用户名"admin"
    而且 我输入了密码"password123"
    当 我点击登录按钮
    那么 我应该看到欢迎消息
    而且 我应该被重定向到主页
```

BDD的核心优势是将测试与业务需求对齐。每个测试场景都对应一个具体的业务需求，这使得非技术人员也能理解测试的目的和结果。

### 1.5 Jest测试框架概述

Jest是Facebook开发的JavaScript测试框架，它以零配置著称，内置支持快照测试、模拟测试、并行执行等特性。Jest是React项目中最常用的测试框架，与Create React App和Next.js都有良好的集成。

**Jest的核心特性：**

Jest使用Jasmine风格的语法，提供了describe、it、expect等核心API。Jest内置了强大的Mock系统，支持函数Mock、模块Mock、时间Mock等。Jest的并行执行机制能够充分利用多核CPU，显著提升测试执行速度。Jest的快照功能特别适合React组件测试，能够自动捕获组件输出并检测变化。

**Jest的配置文件结构：**

```javascript
// jest.config.js 完整配置示例

/**
 * Jest测试框架完整配置
 * 本配置文件展示了Jest的所有主要配置选项及其作用
 */

// 测试环境配置
module.exports = {
  // 指定测试运行环境，jsdom模拟浏览器环境，node模拟Node.js环境
  // 对于React组件测试，使用jsdom；对于Node.js代码测试，使用node
  testEnvironment: 'jsdom',

  // 根目录配置，指定测试文件的根目录位置
  roots: ['<rootDir>/src'],

  // 测试文件匹配模式，支持两种命名约定
  // 1. __tests__目录下的文件
  // 2. 命名为*.test.ts或*.spec.ts的文件
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',  // __tests__目录下的所有测试文件
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)',  // .test.ts或.spec.ts结尾的文件
  ],

  // 测试文件排除模式，node_modules中的文件不应该被测试
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
  ],

  // 转换器配置，将TypeScript/JSX转换为Jest可执行的JavaScript
  // ts-jest是专门为TypeScript设计的转换器
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      // TypeScript配置文件路径
      tsconfigPath: '<rootDir>/tsconfig.json',
      // 是否启用ESM支持
      useESM: false,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // 模块名称映射，支持路径别名
  // 这使得我们可以用@/代替src/，简化import语句
  moduleNameMapper: {
    // 路径别名映射，将@/映射到src/目录
    '^@/(.*)$': '<rootDir>/src/$1',
    // CSS/SCSS等样式文件的Mock，避免样式文件导致构建失败
    '\\.(css|less|scss|sass|stylus)$': 'identity-obj-proxy',
    // 图片文件的Mock，返回空字符串
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // 设置文件，在所有测试之前执行
  // 通常用于添加自定义断言、配置测试环境等
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // 代码覆盖率配置
  collectCoverage: false,  // 是否收集覆盖率，默认关闭
  collectCoverageFrom: [
    // 收集src目录下所有ts/tsx文件的覆盖率
    'src/**/*.{ts,tsx}',
    // 排除类型定义文件、入口文件和测试文件
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/**/*.test.{ts,tsx}',
    // 排除node_modules
    '!node_modules/**',
  ],

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // 覆盖率阈值设置，如果覆盖率低于阈值，测试将失败
  // 这确保了新增代码必须经过测试
  coverageThreshold: {
    global: {
      branches: 70,    // 分支覆盖率至少70%
      functions: 80,   // 函数覆盖率至少80%
      lines: 80,       // 行覆盖率至少80%
      statements: 80,  // 语句覆盖率至少80%
    },
    // 可以为特定文件或目录设置不同的阈值
    './src/utils/**': {
      branches: 90,
      functions: 100,
      lines: 95,
    },
  },

  // 测试超时时间，默认5000ms
  // 对于异步测试或需要启动浏览器的测试，可能需要增加超时时间
  testTimeout: 10000,

  // 最大并发测试数
  // 设置为数字时表示最大并发数，设置为true时使用所有CPU核心
  maxConcurrency: 5,

  // 是否显示测试警告信息
  showWarnings: true,

  // 转换忽略模式
  // 对于某些node_modules，可能需要跳过转换
  transformIgnorePatterns: [
    'node_modules/(?!(react-router|@react-router|zustand)/)',
  ],

  // 快照序列化器配置
  snapshotSerializers: ['enzyme-to-json/serializer'],

  // 模拟文件目录
  // 当import某个模块时，Jest会首先检查这个目录
  moduleDirectories: ['node_modules', 'src'],
};
```

**Jest的辅助设置文件：**

```typescript
// jest.setup.ts Jest设置文件

/**
 * Jest环境设置文件
 * 在所有测试运行之前执行，用于配置全局Mock和扩展断言
 */

// 导入jest-dom扩展，提供更语义化的DOM断言
// 这些断言如toBeInTheDocument、toHaveTextContent等
import '@testing-library/jest-dom';

/**
 * 全局Mock：ResizeObserver
 * ResizeObserver是一个浏览器API，用于监测元素尺寸变化
 * 在测试环境中它不存在，需要手动Mock
 */
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  /**
   * 开始观察目标元素
   * @param target - 要观察的元素
   */
  observe: jest.fn((target) => {
    // Mock实现，不执行任何操作
    console.log('ResizeObserver: observing', target);
  }),
  /**
   * 停止观察目标元素
   * @param target - 要停止观察的元素
   */
  unobserve: jest.fn((target) => {
    // Mock实现，不执行任何操作
    console.log('ResizeObserver: unobserve', target);
  }),
  /**
   * 断开所有观察
   */
  disconnect: jest.fn(() => {
    // Mock实现，不执行任何操作
    console.log('ResizeObserver: disconnect');
  }),
}));

/**
 * 全局Mock：IntersectionObserver
 * IntersectionObserver用于检测元素是否进入视口
 */
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

/**
 * 全局Mock：matchMedia
 * matchMedia用于检测媒体查询匹配
 * 响应式组件测试中常用
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,  // 默认不匹配
    media: query,
    onchange: null,
    addListener: jest.fn(),    // 废弃，但某些代码仍在使用
    removeListener: jest.fn(), // 废弃
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Mock console.error
 * 捕获并可选地抑制特定错误消息
 * 某些已知警告可以通过这个方式处理
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // 忽略特定错误消息
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // 恢复原始console.error
  console.error = originalError;
});

/**
 * 清理函数：每个测试后清理
 * 防止测试间的状态污染
 */
afterEach(() => {
  // 清除所有Mock状态
  jest.clearAllMocks();
  // 清除所有计时器
  jest.clearAllTimers();
});
```

---

## 2. Jest测试框架详解

### 2.1 Jest核心API

Jest提供了一套清晰的API来编写测试。理解这些API的使用场景和最佳实践，是掌握Jest的基础。

**describe块用于组织相关测试：** describe是一个测试块，它将一组相关的测试用例组织在一起。describe可以嵌套，这允许你创建层次化的测试结构。每个describe块都应该清晰地描述被测试的主题。

```typescript
/**
 * describe块的嵌套示例
 * 展示如何组织复杂的测试结构
 */

describe('计算器模块', () => {
  // describe可以嵌套，允许创建更细致的分组
  describe('加法运算', () => {
    it('应该正确计算两个正整数相加', () => {
      expect(1 + 1).toBe(2);
    });

    it('应该正确计算负数和正数相加', () => {
      expect(-1 + 1).toBe(0);
    });

    it('应该正确处理零', () => {
      expect(5 + 0).toBe(5);
    });
  });

  describe('减法运算', () => {
    it('应该正确计算两个正整数相减', () => {
      expect(5 - 3).toBe(2);
    });

    it('应该正确处理负数结果', () => {
      expect(3 - 5).toBe(-2);
    });
  });
});
```

**it和test函数是同义词：** it和test函数完全等价，只是语法风格不同。it语法更接近自然语言描述，test语法更简洁。团队可以根据偏好选择，或保持一致性。

```typescript
// 两种语法的对比
describe('用户验证', () => {
  // 使用it：适合描述性场景
  it('当邮箱格式正确时应该验证通过', () => {
    const isValid = validateEmail('user@example.com');
    expect(isValid).toBe(true);
  });

  // 使用test：更简洁
  test('密码长度少于8位时应该返回false', () => {
    const isValid = validatePassword('123');
    expect(isValid).toBe(false);
  });
});
```

**beforeAll和afterAll：** beforeAll在当前describe块的所有测试之前执行一次，afterAll在所有测试之后执行一次。这些钩子适用于需要设置昂贵资源（如数据库连接）的场景。

```typescript
/**
 * beforeAll和afterAll使用示例
 * 适用于需要一次性设置/清理资源的场景
 */

describe('数据库操作测试', () => {
  // 模拟数据库连接
  let dbConnection: any;

  // 在所有测试之前建立数据库连接
  // 这个连接在所有测试中共享
  beforeAll(async () => {
    // 建立数据库连接是一个耗时操作
    // 只执行一次，而不是每个测试都建立连接
    dbConnection = await createDatabaseConnection({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
    });
    console.log('数据库连接已建立');
  });

  // 在所有测试之后关闭连接
  afterAll(async () => {
    // 清理数据库连接
    await dbConnection.close();
    console.log('数据库连接已关闭');
  });

  it('应该成功插入用户', async () => {
    const result = await dbConnection.users.insert({
      name: '张三',
      email: 'zhangsan@example.com',
    });
    expect(result.id).toBeDefined();
  });

  it('应该成功查询用户', async () => {
    const users = await dbConnection.users.findAll();
    expect(Array.isArray(users)).toBe(true);
  });
});
```

**beforeEach和afterEach：** beforeEach在每个测试之前执行，afterEach在每个测试之后执行。这对于重置状态、清理数据非常有用。

```typescript
/**
 * beforeEach和afterEach使用示例
 * 适用于每个测试都需要独立状态的场景
 */

describe('购物车功能', () => {
  // 每个测试都会重置购物车状态
  let cart: any;

  beforeEach(() => {
    // 每个测试前创建新的购物车实例
    // 确保测试之间完全隔离
    cart = new ShoppingCart();
  });

  afterEach(() => {
    // 可选：每个测试后清理
    cart.clear();
  });

  it('应该正确添加商品', () => {
    cart.addItem({ id: '1', name: '苹果', price: 5 });
    expect(cart.items.length).toBe(1);
  });

  it('应该正确计算总价', () => {
    cart.addItem({ id: '1', name: '苹果', price: 5 });
    cart.addItem({ id: '2', name: '香蕉', price: 3 });
    expect(cart.totalPrice).toBe(8);
  });

  it('应该正确移除商品', () => {
    cart.addItem({ id: '1', name: '苹果', price: 5 });
    cart.removeItem('1');
    expect(cart.items.length).toBe(0);
  });
});
```

### 2.2 断言详解

Jest的断言系统非常丰富，涵盖了各种测试场景。掌握这些断言是编写有效测试的基础。

**相等性断言：**

```typescript
/**
 * 相等性断言详解
 * toBe使用Object.is进行严格相等比较
 * toEqual进行深度相等比较，适合对象和数组
 */

describe('相等性断言', () => {
  // 严格相等，适用于原始类型
  test('toBe严格相等', () => {
    expect(1 + 1).toBe(2);           // 通过
    // expect(1 + 1).toBe('2');      // 失败，类型不同
  });

  // 深度相等，适用于对象和数组
  test('toEqual深度相等', () => {
    const user = { name: '张三', age: 25 };
    const another = { name: '张三', age: 25 };
    expect(user).toEqual(another);   // 通过，对象内容相同
  });

  // 数组深度相等
  test('数组深度相等', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  // 严格深度相等，包含类型检查
  test('toStrictEqual严格深度相等', () => {
    expect({ a: 1 }).toStrictEqual({ a: 1 });
    // { a: 1 } 和 { a: 1.0 } 在 toStrictEqual 中相同
    // 但 { a: undefined } 和 {} 不同
  });

  // 不相等的断言
  test('not取反', () => {
    expect(1 + 1).not.toBe(3);
    expect({ name: '张三' }).not.toEqual({ name: '李四' });
  });
});
```

**真值断言：**

```typescript
/**
 * 真值断言
 * 用于检查null、undefined、true、false等值
 */

describe('真值断言', () => {
  test('toBeTruthy匹配真值', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();          // 数字1是真值
    expect('非空字符串').toBeTruthy();
    expect({}).toBeTruthy();         // 空对象是真值
    expect([]).toBeTruthy();         // 空数组是真值
  });

  test('toBeFalsy匹配假值', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
    expect(NaN).toBeFalsy();
  });

  test('toBeNull专门检查null', () => {
    const value = null;
    expect(value).toBeNull();
    expect(value).not.toBeUndefined(); // null不等于undefined
  });

  test('toBeUndefined专门检查undefined', () => {
    let value;
    expect(value).toBeUndefined();
  });

  test('toBeDefined检查不是undefined', () => {
    const value = '已定义';
    expect(value).toBeDefined();
    expect(null).toBeDefined();      // null是定义的，只是值为null
  });
});
```

**数字断言：**

```typescript
/**
 * 数字断言
 * 浮点数比较是常见陷阱，toBeCloseTo专门解决这个问题
 */

describe('数字断言', () => {
  test('toBe大于比较', () => {
    expect(5).toBeGreaterThan(3);
    expect(5).toBeGreaterThanOrEqual(5); // 5 >= 5
  });

  test('toBeLess小于比较', () => {
    expect(3).toBeLessThan(5);
    expect(3).toBeLessThanOrEqual(3);  // 3 <= 3
  });

  // 浮点数比较必须使用toBeCloseTo
  test('浮点数必须使用toBeCloseTo', () => {
    // 错误的方式：直接用toBe会失败
    // expect(0.1 + 0.2).toBe(0.3);  // 失败！

    // 正确的方式：toBeCloseTo有容差范围
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // 通过
    expect(0.1 + 0.2).toBeCloseTo(0.3);    // 默认容差0.001
  });

  test('NaN检查', () => {
    expect(NaN).toBeNaN();
    expect(Math.sqrt(-1)).toBeNaN();
  });
});
```

**字符串断言：**

```typescript
/**
 * 字符串断言
 * 支持正则表达式匹配
 */

describe('字符串断言', () => {
  test('toMatch正则匹配', () => {
    expect('Hello World').toMatch(/hello/i); // i标志表示不区分大小写
    expect('2024-01-15').toMatch(/^\d{4}-\d{2}-\d{2}$/); // 日期格式
  });

  test('toContain包含检查', () => {
    expect('Hello World').toContain('World');
    expect('Hello World').not.toContain('Python');
  });

  test('toHaveLength长度检查', () => {
    expect('Hello').toHaveLength(5);
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('toMatchSnapshot字符串快照', () => {
    // 快照测试用于检测意外的字符串变化
    const formattedDate = formatDate(new Date('2024-01-15'));
    expect(formattedDate).toMatchSnapshot();
  });
});
```

**数组和对象断言：**

```typescript
/**
 * 数组和对象断言
 */

describe('数组断言', () => {
  const fruits = ['苹果', '香蕉', '橙子'];

  test('toContain元素包含', () => {
    expect(fruits).toContain('香蕉');
    expect(fruits).not.toContain('葡萄');
  });

  test('toContainEqual深度包含', () => {
    const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(objects).toContainEqual({ id: 2 });
  });

  test('toHaveLength长度检查', () => {
    expect(fruits).toHaveLength(3);
  });

  test('数组开头和结尾', () => {
    expect(fruits).toEqual(
      expect.arrayContaining(['苹果', '香蕉', '橙子'])
    );
  });

  test('数组包含特定元素', () => {
    expect(fruits).toEqual(
      expect.arrayContaining(['香蕉']) // 部分匹配
    );
  });
});

describe('对象断言', () => {
  const user = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    age: 25,
    address: {
      city: '北京',
      district: '朝阳区',
    },
  };

  test('toHaveProperty属性存在', () => {
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('address.city');
  });

  test('toHaveProperty属性值', () => {
    expect(user).toHaveProperty('name', '张三');
    expect(user).toHaveProperty('address.city', '北京');
  });

  test('toMatchObject部分匹配', () => {
    // 只检查提供的属性，不要求完全匹配
    expect(user).toMatchObject({
      name: '张三',
      age: 25,
    });
  });

  test('toMatchObject嵌套匹配', () => {
    expect(user).toMatchObject({
      address: {
        city: '北京',
      },
    });
  });

  test('toStrictObjectKeys按顺序匹配', () => {
    expect({ a: 1, b: 2 }).toStrictObjectKeys(['a', 'b']);
    // { a: 1, b: 2 } 和 { b: 2, a: 1 } 在 toStrictObjectKeys 中不等
  });
});
```

**异常断言：**

```typescript
/**
 * 异常断言
 * 测试函数是否按预期抛出错误
 */

describe('异常断言', () => {
  // 辅助函数：抛出一个错误
  const throwError = (message: string) => {
    throw new Error(message);
  };

  // 辅助函数：异步错误
  const asyncThrowError = async () => {
    throw new Error('异步错误');
  };

  test('toThrow任何错误', () => {
    expect(() => throwError('测试')).toThrow();
  });

  test('toThrow特定错误类型', () => {
    expect(() => throwError('测试')).toThrow(Error);
    expect(() => throwError('测试')).toThrow(TypeError); // 失败
  });

  test('toThrow错误消息匹配', () => {
    expect(() => throwError('具体错误消息')).toThrow('具体错误消息');
    expect(() => throwError('具体错误消息')).toThrow(/错误/); // 支持正则
  });

  test('异步异常测试', async () => {
    await expect(asyncThrowError()).rejects.toThrow('异步错误');
  });
});
```

### 2.3 Mock函数详解

Mock函数是测试中的核心工具，它允许你替换真实实现、追踪调用、设置返回值。Jest提供了完整的Mock系统。

**jest.fn()创建Mock函数：**

```typescript
/**
 * jest.fn()基础用法
 * Mock函数可以替代真实函数，记录调用情况
 */

describe('jest.fn()基础', () => {
  test('基本调用追踪', () => {
    // 创建Mock函数
    const mockFn = jest.fn();

    // 调用Mock函数
    mockFn('hello');
    mockFn('world');

    // 验证调用次数
    expect(mockFn).toHaveBeenCalledTimes(2);

    // 验证调用参数
    expect(mockFn).toHaveBeenCalledWith('hello');
    expect(mockFn).toHaveBeenCalledWith('world');

    // 验证最后一次调用
    expect(mockFn).toHaveBeenLastCalledWith('world');
  });

  test('Mock函数返回值', () => {
    // 链式设置返回值
    // 第一次调用返回'first'，第二次返回'second'，之后返回'default'
    const mockFn = jest.fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default');

    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).toBe('default');
    expect(mockFn()).toBe('default'); // 继续返回默认值
  });

  test('Mock函数实现', () => {
    // 直接传入实现函数
    const mockFn = jest.fn((x: number, y: number) => x * y);

    expect(mockFn(3, 4)).toBe(12);
    expect(mockFn(5, 2)).toBe(10);
  });

  test('Mock函数实现异步操作', async () => {
    const mockAsyncFn = jest.fn().mockResolvedValue('async result');

    const result = await mockAsyncFn();
    expect(result).toBe('async result');
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });

  test('Mock函数返回undefined', () => {
    const mockFn = jest.fn();

    // 默认返回undefined
    expect(mockFn()).toBeUndefined();
  });
});
```

**jest.spyOn()监视对象方法：**

```typescript
/**
 * jest.spyOn()用法
 * 用于监视已存在的对象方法，同时可以替换实现
 */

describe('jest.spyOn()', () => {
  // 创建一个对象用于测试
  const calculator = {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
  };

  test('监视方法调用', () => {
    // 监视calculator的add方法
    const spy = jest.spyOn(calculator, 'add');

    // 调用原方法
    const result = calculator.add(2, 3);

    // 验证调用
    expect(result).toBe(5);
    expect(spy).toHaveBeenCalledWith(2, 3);
    expect(spy).toHaveBeenCalledTimes(1);

    // 重要：恢复原始实现
    spy.mockRestore();
  });

  test('替换方法实现', () => {
    const spy = jest.spyOn(calculator, 'add')
      .mockImplementation(() => 100); // 替换为返回100

    // 现在调用add返回100，而不是2+3=5
    expect(calculator.add(2, 3)).toBe(100);

    // 恢复原始实现
    spy.mockRestore();

    // 恢复后，add正常工作
    expect(calculator.add(2, 3)).toBe(5);
  });

  test('spy未改变原始对象', () => {
    const spy = jest.spyOn(calculator, 'add');

    calculator.add(10, 20);

    expect(spy).toHaveBeenCalled();
    expect(calculator.add(10, 20)).toBe(30); // 原始实现仍然有效

    spy.mockRestore();
  });
});
```

**模块Mock：**

```typescript
/**
 * 模块Mock
 * 使用jest.mock()完全替换模块
 */

// 创建要Mock的模块：api.ts
// 这个文件会被Mock
export const fetchUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

export const createUser = async (data: UserData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

// 测试文件：api.test.ts
describe('API模块Mock', () => {
  // 在测试文件顶部使用jest.mock()
  // 这会让所有对api.ts的引用指向Mock版本
  jest.mock('../api');

  // 导入Mock版本的函数
  import { fetchUser, createUser } from '../api';

  test('fetchUser返回模拟数据', async () => {
    // 设置Mock返回值
    (fetchUser as jest.Mock).mockResolvedValue({
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
    });

    const user = await fetchUser('1');

    expect(user).toEqual({
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
    });
    expect(fetchUser).toHaveBeenCalledWith('1');
  });

  test('createUser调用API', async () => {
    // 设置Mock返回值
    (createUser as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      name: '李四',
    });

    const result = await createUser({
      name: '李四',
      email: 'lisi@example.com',
    });

    expect(result.id).toBe('new-user-id');
  });
});
```

**部分Mock：**

```typescript
/**
 * 部分Mock
 * 保留原始实现，只Mock特定函数
 */

import * as utils from '../utils';

// 使用jest.mock配合requireActual保留其他实现
jest.mock('../utils', () => ({
  // 保留原始模块
  ...jest.requireActual('../utils'),
  // 只Mock fetchUser
  fetchUser: jest.fn().mockResolvedValue({ id: 'mocked' }),
}));

test('部分Mock示例', () => {
  // fetchUser被Mock了
  expect(fetchUser('1')).resolves.toEqual({ id: 'mocked' });

  // 其他函数保持原始实现
  expect(utils.formatDate(new Date())).toBe('2024-01-15');
});
```

**Timer Mock：**

```typescript
/**
 * Timer Mock
 * 用于测试setTimeout、setInterval等定时器
 */

describe('Timer Mock', () => {
  beforeEach(() => {
    // 启用假计时器
    jest.useFakeTimers();
  });

  afterEach(() => {
    // 恢复正常计时器
    jest.useRealTimers();
  });

  test('setTimeout回调', () => {
    const callback = jest.fn();

    // 设置1秒后的定时器
    setTimeout(callback, 1000);

    // 初始状态：回调未执行
    expect(callback).not.toHaveBeenCalled();

    // 快进1秒
    jest.advanceTimersByTime(1000);

    // 验证回调被执行
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('setInterval重复执行', () => {
    const callback = jest.fn();

    // 设置每1秒执行一次的定时器
    setInterval(callback, 1000);

    // 快进3秒
    jest.advanceTimersByTime(3000);

    // 验证回调执行了3次
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test('runAllTimers执行所有定时器', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    setTimeout(callback1, 1000);
    setTimeout(callback2, 2000);

    // 执行所有待处理定时器
    jest.runAllTimers();

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('异步定时器', async () => {
    const callback = jest.fn();

    setTimeout(callback, 1000);

    // 使用act确保timer更新被应用
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalled();
  });
});
```

---

## 3. React Testing Library完全指南

### 3.1 核心概念：用户视角测试

React Testing Library（RTL）的核心理念是"以用户的方式测试UI"。这意味着我们不应该测试组件的内部实现，而应该测试用户能看到和交互的内容。

**为什么选择用户视角？**

传统的测试方法（如Enzyme）鼓励测试组件的内部状态和实现细节。这种方法的问题是：当组件重构但功能不变时，测试会失败，即使用户体验没有任何变化。

RTL鼓励测试可访问性，因为可访问性是用户体验的重要组成部分。当我们使用getByRole、getByLabelText等查询方法时，我们实际上是在验证屏幕阅读器能否正确理解页面内容。

**渲染基础：**

```typescript
/**
 * render函数基础用法
 * render将React组件渲染到DOM中
 */

import { render, screen } from '@testing-library/react';

// 要测试的组件
function Greeting({ name }: { name: string }) {
  return (
    <div>
      <h1>你好，{name}！</h1>
      <p>欢迎来到我们的应用</p>
    </div>
  );
}

describe('Greeting组件', () => {
  test('应该正确显示问候语', () => {
    // render将组件渲染到容器中
    render(<Greeting name="张三" />);

    // screen提供查询方法，在整个文档中查找元素
    const heading = screen.getByRole('heading', { name: /你好/ });

    // 验证元素存在于文档中
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('你好，张三！');
  });

  test('应该显示欢迎消息', () => {
    render(<Greeting name="李四" />);

    // 使用正则表达式匹配
    expect(screen.getByText(/欢迎/)).toBeInTheDocument();
  });
});
```

### 3.2 查询方法详解

RTL提供了多种查询方法，每种方法适用于不同的场景。选择正确的查询方法是编写可靠测试的关键。

**按优先级分类的查询方法：**

```typescript
/**
 * 查询方法按优先级排列
 * 优先使用可访问性最高的查询方法
 */

// ============================================
// 1. 可访问性最高的查询（首选）
// ============================================

describe('可访问性优先查询', () => {
  test('getByRole - 最首选的查询方式', () => {
    render(
      <button onClick={() => {}}>提交</button>
    );

    // getByRole通过ARIA role查找元素
    // button是最语义化的按钮查询方式
    const button = screen.getByRole('button', { name: '提交' });
    expect(button).toBeInTheDocument();
  });

  test('getByLabelText - 表单元素首选', () => {
    render(
      <form>
        <label htmlFor="email">电子邮箱</label>
        <input id="email" type="email" />
      </form>
    );

    // 通过关联的label查找input
    // 这是用户填写表单的方式
    const input = screen.getByLabelText('电子邮箱');
    expect(input).toBeInTheDocument();
  });
});

// ============================================
// 2. 文本内容查询
// ============================================

describe('文本内容查询', () => {
  test('getByText - 按文本内容查找', () => {
    render(<div>Hello World</div>);

    // 精确匹配
    expect(screen.getByText('Hello World')).toBeInTheDocument();

    // 正则匹配
    expect(screen.getByText(/hello/i)).toBeInTheDocument();

    // 包含匹配
    expect(screen.getByText(/World/)).toBeInTheDocument();
  });

  test('getByDisplayValue - 按输入框的值查找', () => {
    render(
      <input defaultValue="Hello" />
    );

    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });
});

// ============================================
// 3. 特殊属性查询
// ============================================

describe('特殊属性查询', () => {
  test('getByTestId - 最后手段', () => {
    render(
      <div data-testid="custom-element">
        特殊内容
      </div>
    );

    // data-testid应该是最后使用的查询方式
    // 当没有语义化方式可用时使用
    const element = screen.getByTestId('custom-element');
    expect(element).toBeInTheDocument();
  });

  test('getByPlaceholderText - 占位符文本', () => {
    render(
      <input placeholder="请输入用户名" />
    );

    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
  });
});
```

**查询方法的变体：**

```typescript
/**
 * 查询方法的变体
 * getBy：找不到元素时抛出错误
 * queryBy：找不到元素时返回null（适合检查元素不存在）
 * findBy：返回Promise，用于异步查找
 * getAllBy/queryAllBy/findAllBy：返回数组
 */

describe('查询方法变体', () => {
  test('getBy找不到会报错', () => {
    render(<div>Hello</div>);

    // getBy找不到元素会抛出错误
    // 这使得错误消息清晰，但不适合检查元素不存在
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('queryBy返回null适合检查不存在', () => {
    render(<div>Hello</div>);

    // queryBy找不到返回null，不抛出错误
    // 这适合检查元素不应该存在的情况
    expect(screen.queryByText('World')).not.toBeInTheDocument();
    expect(screen.queryByText('World')).toBeNull();
  });

  test('findBy用于异步元素', async () => {
    // 模拟异步加载的组件
    function AsyncComponent() {
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        setTimeout(() => setLoading(false), 100);
      }, []);

      return loading ? <div>加载中...</div> : <div>加载完成</div>;
    }

    render(<AsyncComponent />);

    // findBy返回一个Promise
    // 当元素出现时Promise resolve
    // 默认超时1000ms
    const loadedText = await screen.findByText('加载完成');
    expect(loadedText).toBeInTheDocument();
  });

  test('getAllBy查找多个元素', () => {
    render(
      <ul>
        <li>项目1</li>
        <li>项目2</li>
        <li>项目3</li>
      </ul>
    );

    // getAllBy返回数组
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
});
```

### 3.3 用户交互测试

用户交互测试是验证组件行为的核心。React Testing Library配合@testing-library/user-event可以模拟真实的用户交互。

```typescript
/**
 * 用户交互测试
 * user-event比fireEvent更接近真实用户行为
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('用户交互测试', () => {
  describe('点击交互', () => {
    test('按钮点击', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<button onClick={handleClick}>点击我</button>);

      // user.click模拟真实点击
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('双击', async () => {
      const handleDoubleClick = jest.fn();
      const user = userEvent.setup();

      render(<button onDoubleClick={handleDoubleClick}>双击我</button>);

      await user.dblClick(screen.getByRole('button'));

      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    test('右键点击', async () => {
      const handleContextMenu = jest.fn();
      const user = userEvent.setup();

      render(<div onContextMenu={handleContextMenu}>右键点击</div>);

      await user.pointer({
        keys: '[MouseButton.Right]',
        target: screen.getByText('右键点击'),
      });

      expect(handleContextMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('表单输入', () => {
    test('文本输入', async () => {
      const user = userEvent.setup();

      render(<input type="text" placeholder="请输入" />);

      const input = screen.getByPlaceholderText('请输入');
      await user.type(input, '你好世界');

      expect(input).toHaveValue('你好世界');
    });

    test('清除输入', async () => {
      const user = userEvent.setup();

      render(<input type="text" defaultValue="初始值" />);

      const input = screen.getByRole('textbox');
      await user.clear(input);

      expect(input).toHaveValue('');
    });

    test('键盘输入特殊字符', async () => {
      const user = userEvent.setup();

      render(<input type="text" />);

      const input = screen.getByRole('textbox');

      // 使用{}语法输入特殊键
      await user.type(input, 'Hello{Backspace}World'); // HelloWorld
      expect(input).toHaveValue('HelloWorld');

      await user.clear(input);
      await user.type(input, '{CapsLock}hello'); // 大写HELLO
      expect(input).toHaveValue('HELLO');
    });
  });

  describe('选择和复选框', () => {
    test('复选框勾选', async () => {
      const user = userEvent.setup();

      render(
        <label>
          <input type="checkbox" />
          我同意条款
        </label>
      );

      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    test('单选按钮选择', async () => {
      const user = userEvent.setup();

      render(
        <fieldset>
          <legend>选择颜色</legend>
          <label>
            <input type="radio" name="color" value="red" />
            红色
          </label>
          <label>
            <input type="radio" name="color" value="blue" />
            蓝色
          </label>
        </fieldset>
      );

      const redRadio = screen.getByRole('radio', { name: '红色' });
      const blueRadio = screen.getByRole('radio', { name: '蓝色' });

      await user.click(redRadio);

      expect(redRadio).toBeChecked();
      expect(blueRadio).not.toBeChecked();

      await user.click(blueRadio);

      expect(blueRadio).toBeChecked();
      expect(redRadio).not.toBeChecked();
    });

    test('下拉框选择', async () => {
      const user = userEvent.setup();

      render(
        <select>
          <option value="">请选择</option>
          <option value="apple">苹果</option>
          <option value="banana">香蕉</option>
        </select>
      );

      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'banana');

      expect(screen.getByRole('option', { name: '香蕉' })).toBeSelected();
    });
  });

  describe('焦点和Tab导航', () => {
    test('Tab键导航', async () => {
      const user = userEvent.setup();

      render(
        <form>
          <button type="button">第一个</button>
          <button type="button">第二个</button>
          <button type="button">第三个</button>
        </form>
      );

      const first = screen.getByRole('button', { name: '第一个' });
      first.focus();

      // Tab导航
      await user.tab();

      expect(screen.getByRole('button', { name: '第二个' })).toHaveFocus();

      await user.tab();

      expect(screen.getByRole('button', { name: '第三个' })).toHaveFocus();
    });
  });
});
```

### 3.4 异步测试

异步测试是React测试中的重要部分，因为现代应用大量使用异步操作，如数据获取、动画、定时器等。

```typescript
/**
 * 异步测试
 * React Testing Library提供了多种处理异步的方式
 */

import { render, screen, waitFor } from '@testing-library/react';

describe('异步测试', () => {
  // ============================================
  // 模拟异步数据获取的组件
  // ============================================
  function UserProfile({ userId }: { userId: string }) {
    const [user, setUser] = React.useState<{ name: string } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      setLoading(true);
      // 模拟API调用
      fetch(`/api/users/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error('用户不存在');
          return res.json();
        })
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }, [userId]);

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误：{error}</div>;
    return <div>用户名：{user?.name}</div>;
  }

  // ============================================
  // waitFor: 等待条件满足
  // ============================================
  describe('waitFor', () => {
    test('waitFor等待条件满足', async () => {
      render(<UserProfile userId="1" />);

      // 等待"加载中..."消失
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 然后检查用户信息
      expect(screen.getByText(/用户名:/)).toBeInTheDocument();
    });

    test('waitFor超时和重试', async () => {
      render(<UserProfile userId="1" />);

      // waitFor会不断检查条件，直到超时（默认1000ms）
      // 这对于不稳定的时间依赖很有用
      await waitFor(() => {
        const element = screen.getByText(/用户名:/);
        expect(element).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // findBy: 自动等待
  // ============================================
  describe('findBy查询', () => {
    test('findByText自动等待', async () => {
      render(<UserProfile userId="1" />);

      // findByText返回一个Promise，自动等待元素出现
      // 默认超时5000ms
      const loadingText = await screen.findByText('加载中...');
      expect(loadingText).toBeInTheDocument();

      // 之后用户名会出现
      const userName = await screen.findByText(/用户名:/);
      expect(userName).toBeInTheDocument();
    });

    test('findBy配合正则', async () => {
      render(<UserProfile userId="1" />);

      // 使用正则表达式
      const element = await screen.findByText(/用户名：/);
      expect(element).toBeInTheDocument();
    });
  });

  // ============================================
  // waitForElementToBeRemoved: 等待元素消失
  // ============================================
  describe('waitForElementToBeRemoved', () => {
    test('等待加载状态消失', async () => {
      render(<UserProfile userId="1" />);

      // 首先确认加载状态存在
      expect(screen.getByText('加载中...')).toBeInTheDocument();

      // 等待加载状态消失
      await waitForElementToBeRemoved(screen.queryByText('加载中...'));

      // 验证加载状态确实消失了
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 错误状态测试
  // ============================================
  describe('错误状态', () => {
    test('显示错误消息', async () => {
      // 模拟fetch失败
      jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('网络错误'))
      );

      render(<UserProfile userId="1" />);

      // 等待错误消息出现
      const errorMessage = await screen.findByText(/错误：/);
      expect(errorMessage).toBeInTheDocument();

      // 清理
      global.fetch.mockRestore();
    });
  });
});
```

### 3.5 快照测试

快照测试用于捕获组件输出，并检测意外的UI变化。这对于防止意外的样式变化和重构问题非常有用。

```typescript
/**
 * 快照测试
 * 快照保存组件的序列化输出
 */

import { render } from '@testing-library/react';

// 待测试组件
function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

describe('快照测试', () => {
  test('基础快照', () => {
    const { container } = render(<UserCard name="张三" email="zhangsan@example.com" />);

    // toMatchSnapshot保存当前输出，下次运行时比较
    expect(container).toMatchSnapshot();
  });

  test('内联快照', () => {
    const { container } = render(<UserCard name="张三" email="zhangsan@example.com" />);

    // toMatchInlineSnapshot直接在代码中嵌入快照
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="user-card"
        >
          <h2>
            张三
          </h2>
          <p>
            zhangsan@example.com
          </p>
        </div>
      </div>
    `);
  });

  test('快照更新', () => {
    const { container, rerender } = render(
      <UserCard name="张三" email="zhangsan@example.com" />
    );

    // 首次保存快照
    expect(container).toMatchSnapshot();

    // 当UI变化时，更新快照
    // 运行jest --updateSnapshot 或 jest -u
    rerender(<UserCard name="李四" email="lisi@example.com" />);

    // 更新快照
    expect(container).toMatchSnapshot();
  });
});
```

---

## 4. React组件深度测试

### 4.1 按钮组件测试

按钮是最基本的UI组件，但测试按钮需要考虑多种交互场景。

```typescript
/**
 * Button组件测试
 * 测试按钮的各种状态和交互
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// Button组件定义
// ============================================
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
}

function Button({ children, onClick, disabled, variant = 'primary', type = 'button' }: ButtonProps) {
  const baseClass = `btn btn-${variant}`;
  return (
    <button type={type} className={baseClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ============================================
// 基础渲染测试
// ============================================
describe('Button基础测试', () => {
  test('应该正确渲染按钮文本', () => {
    render(<Button>点击我</Button>);

    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument();
  });

  test('应该应用正确的类名', () => {
    const { container } = render(<Button>提交</Button>);

    // 检查类名
    expect(container.firstChild).toHaveClass('btn');
    expect(container.firstChild).toHaveClass('btn-primary');
  });

  test('次要样式变体', () => {
    const { container } = render(<Button variant="secondary">取消</Button>);

    expect(container.firstChild).toHaveClass('btn-secondary');
  });
});

// ============================================
// 交互测试
// ============================================
describe('Button交互测试', () => {
  test('点击应该触发onClick回调', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>点击</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('点击应该传递事件对象', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>点击</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({
      type: 'click',
    }));
  });

  test('禁用状态应该阻止点击', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} disabled>禁用</Button>);

    await user.click(screen.getByRole('button'));

    // 点击被阻止，handler不应该被调用
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('禁用状态视觉反馈', () => {
    render(<Button disabled>禁用</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('submit类型用于表单', () => {
    render(<Button type="submit">提交表单</Button>);

    expect(screen.getByRole('button', { name: '提交表单' })).toHaveAttribute('type', 'submit');
  });
});

// ============================================
// 键盘交互测试
// ============================================
describe('Button键盘交互', () => {
  test('空格键应该触发点击', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>按钮</Button>);

    const button = screen.getByRole('button');
    await user.tab(); // 先聚焦
    await user.keyboard('{Space}'); // 按空格

    expect(handleClick).toHaveBeenCalled();
  });

  test('Enter键应该触发点击', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>按钮</Button>);

    const button = screen.getByRole('button');
    await user.tab();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 4.2 表单组件测试

表单是Web应用中最常见的交互组件，表单测试需要覆盖输入、验证、提交等完整流程。

```typescript
/**
 * 登录表单组件测试
 * 完整覆盖表单的各种测试场景
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// LoginForm组件定义
// ============================================
interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱"
        />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
        />
        {errors.password && <span role="alert">{errors.password}</span>}
      </div>

      <button type="submit">登录</button>
    </form>
  );
}

// ============================================
// 基础渲染测试
// ============================================
describe('LoginForm基础测试', () => {
  test('应该渲染所有表单元素', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  test('初始状态应该为空', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('邮箱')).toHaveValue('');
    expect(screen.getByLabelText('密码')).toHaveValue('');
  });
});

// ============================================
// 表单输入测试
// ============================================
describe('LoginForm输入测试', () => {
  test('应该正确更新邮箱输入', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    const emailInput = screen.getByLabelText('邮箱');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  test('应该正确更新密码输入', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    const passwordInput = screen.getByLabelText('密码');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });
});

// ============================================
// 表单验证测试
// ============================================
describe('LoginForm验证测试', () => {
  test('空表单提交应该显示错误', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: '登录' }));

    // 验证错误消息显示
    expect(screen.getByRole('alert', { name: '请输入邮箱' })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: '请输入密码' })).toBeInTheDocument();

    // 提交处理函数不应该被调用
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  test('无效邮箱格式应该显示错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('邮箱'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('邮箱格式不正确');
  });

  test('密码过短应该显示错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), '123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('密码至少6位');
  });

  test('错误输入后正确输入应该清除错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    // 先提交空表单
    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // 输入正确的邮箱
    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: '登录' }));

    // 邮箱错误应该消失
    expect(screen.queryByRole('alert', { name: '请输入邮箱' })).not.toBeInTheDocument();
  });
});

// ============================================
// 表单提交测试
// ============================================
describe('LoginForm提交测试', () => {
  test('正确填写的表单应该成功提交', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  test('回车键应该提交表单', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123{Enter}');

    expect(handleSubmit).toHaveBeenCalled();
  });

  test('提交后不应该清除已输入的值', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    // 表单值应该保留（如果是成功提交后的清空，需要组件支持）
    expect(screen.getByLabelText('邮箱')).toHaveValue('test@example.com');
  });
});
```

### 4.3 列表组件测试

列表组件测试需要考虑数据渲染、空状态、删除操作等场景。

```typescript
/**
 * 用户列表组件测试
 * 展示列表组件的完整测试策略
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// UserList组件定义
// ============================================
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface UserListProps {
  users: User[];
  onDelete: (id: string) => void;
  onEdit: (user: User) => void;
}

function UserList({ users, onDelete, onEdit }: UserListProps) {
  if (users.length === 0) {
    return (
      <div data-testid="empty-state">
        <p>暂无用户</p>
      </div>
    );
  }

  return (
    <ul data-testid="user-list">
      {users.map((user) => (
        <li key={user.id} data-testid={`user-item-${user.id}`}>
          <span data-testid={`user-name-${user.id}`}>{user.name}</span>
          <span data-testid={`user-email-${user.id}`}>{user.email}</span>
          <span data-testid={`user-role-${user.id}`} className={`role-${user.role}`}>
            {user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '访客'}
          </span>
          <button
            data-testid={`edit-button-${user.id}`}
            onClick={() => onEdit(user)}
          >
            编辑
          </button>
          <button
            data-testid={`delete-button-${user.id}`}
            onClick={() => onDelete(user.id)}
          >
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}

// ============================================
// 测试数据
// ============================================
const mockUsers: User[] = [
  { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'admin' },
  { id: '2', name: '李四', email: 'lisi@example.com', role: 'user' },
  { id: '3', name: '王五', email: 'wangwu@example.com', role: 'guest' },
];

// ============================================
// 基础渲染测试
// ============================================
describe('UserList基础测试', () => {
  test('应该渲染用户列表', () => {
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={jest.fn()} />);

    // 验证列表容器存在
    expect(screen.getByTestId('user-list')).toBeInTheDocument();

    // 验证所有用户名显示
    expect(screen.getByTestId('user-name-1')).toHaveTextContent('张三');
    expect(screen.getByTestId('user-name-2')).toHaveTextContent('李四');
    expect(screen.getByTestId('user-name-3')).toHaveTextContent('王五');
  });

  test('应该渲染正确数量的用户', () => {
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={jest.fn()} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  test('应该显示用户邮箱', () => {
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.getByTestId('user-email-1')).toHaveTextContent('zhangsan@example.com');
  });

  test('应该显示角色标签', () => {
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.getByTestId('user-role-1')).toHaveTextContent('管理员');
    expect(screen.getByTestId('user-role-2')).toHaveTextContent('用户');
    expect(screen.getByTestId('user-role-3')).toHaveTextContent('访客');
  });
});

// ============================================
// 空状态测试
// ============================================
describe('UserList空状态测试', () => {
  test('空数组应该显示空状态', () => {
    render(<UserList users={[]} onDelete={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('暂无用户')).toBeInTheDocument();
  });

  test('空状态不应该显示列表', () => {
    render(<UserList users={[]} onDelete={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.queryByTestId('user-list')).not.toBeInTheDocument();
  });
});

// ============================================
// 删除操作测试
// ============================================
describe('UserList删除操作测试', () => {
  test('点击删除按钮应该调用onDelete', async () => {
    const user = userEvent.setup();
    const handleDelete = jest.fn();
    render(<UserList users={mockUsers} onDelete={handleDelete} onEdit={jest.fn()} />);

    await user.click(screen.getByTestId('delete-button-1'));

    expect(handleDelete).toHaveBeenCalledWith('1');
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  test('删除后列表应该更新', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <UserList users={mockUsers} onDelete={jest.fn()} onEdit={jest.fn()} />
    );

    // 初始有3个用户
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    // 模拟删除第一个用户
    const newUsers = mockUsers.filter(u => u.id !== '1');
    rerender(<UserList users={newUsers} onDelete={jest.fn()} onEdit={jest.fn()} />);

    // 现在只有2个用户
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByTestId('user-name-1')).not.toBeInTheDocument();
  });
});

// ============================================
// 编辑操作测试
// ============================================
describe('UserList编辑操作测试', () => {
  test('点击编辑按钮应该调用onEdit', async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={handleEdit} />);

    await user.click(screen.getByTestId('edit-button-2'));

    expect(handleEdit).toHaveBeenCalledWith(mockUsers[1]);
  });

  test('onEdit应该接收完整的用户对象', async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();
    render(<UserList users={mockUsers} onDelete={jest.fn()} onEdit={handleEdit} />);

    await user.click(screen.getByTestId('edit-button-3'));

    expect(handleEdit).toHaveBeenCalledWith({
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      role: 'guest',
    });
  });
});
```

### 4.4 对话框/弹窗测试

对话框测试需要考虑打开、关闭、焦点管理等复杂交互。

```typescript
/**
 * 模态对话框组件测试
 * 测试对话框的打开、关闭和焦点管理
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// Modal组件定义
// ============================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // 点击遮罩层关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 按Escape关闭
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div data-testid="modal-content">
        <header>
          <h2 id="modal-title">{title}</h2>
          <button
            data-testid="close-button"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

// ============================================
// 基础测试
// ============================================
describe('Modal基础测试', () => {
  test('isOpen为true时应该显示对话框', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="测试标题">
        <p>对话框内容</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
  });

  test('isOpen为false时不应该显示对话框', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="测试标题">
        <p>对话框内容</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('应该显示标题', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="自定义标题">
        <p>内容</p>
      </Modal>
    );

    expect(screen.getByText('自定义标题')).toBeInTheDocument();
  });

  test('应该显示子内容', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="标题">
        <p data-testid="modal-body">这是内容区域</p>
      </Modal>
    );

    expect(screen.getByTestId('modal-body')).toHaveTextContent('这是内容区域');
  });
});

// ============================================
// 关闭交互测试
// ============================================
describe('Modal关闭交互测试', () => {
  test('点击关闭按钮应该调用onClose', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    await user.click(screen.getByTestId('close-button'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('点击遮罩层应该关闭对话框', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    // 点击背景遮罩
    await user.click(screen.getByTestId('modal-backdrop'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('点击对话框内容不应该关闭', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    // 点击对话框内容本身
    await user.click(screen.getByTestId('modal-content'));

    // 不应该关闭
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('按Escape键应该关闭对话框', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('对话框关闭后Escape键不应该触发', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    // 关闭对话框
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="标题">
        <p>内容</p>
      </Modal>
    );

    // 按Escape键
    await user.keyboard('{Escape}');

    // onClose不应该被调用
    expect(handleClose).not.toHaveBeenCalled();
  });
});

// ============================================
// 无障碍测试
// ============================================
describe('Modal无障碍测试', () => {
  test('对话框应该有aria-modal属性', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="标题">
        <p>内容</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  test('对话框应该有aria-labelledby指向标题', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="测试标题">
        <p>内容</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  test('关闭按钮应该有aria-label', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="标题">
        <p>内容</p>
      </Modal>
    );

    expect(screen.getByTestId('close-button')).toHaveAttribute('aria-label', '关闭');
  });
});
```

---

## 5. React集成测试

### 5.1 组件与状态管理集成测试

集成测试验证组件与状态管理（如Zustand、Context）之间的交互。

```typescript
/**
 * Zustand Store与组件集成测试
 * 展示如何测试组件与全局状态的交互
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// Zustand Store定义
// ============================================
interface Document {
  id: string;
  title: string;
  content: string;
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  createDocument: (doc: Omit<Document, 'id'>) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setCurrentDocument: (doc: Document | null) => void;
}

const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/documents');
      const documents = await response.json();
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: '获取文档失败', isLoading: false });
    }
  },

  createDocument: async (doc) => {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    const newDoc = await response.json();
    set((state) => ({
      documents: [...state.documents, newDoc],
    }));
    return newDoc;
  },

  updateDocument: async (id, updates) => {
    await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    }));
  },

  deleteDocument: async (id) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    }));
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc }),
}));

// ============================================
// 文档列表组件
// ============================================
function DocumentList() {
  const { documents, isLoading, error, fetchDocuments } = useDocumentStore();

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) return <div data-testid="loading">加载中...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <ul data-testid="document-list">
      {documents.map((doc) => (
        <li key={doc.id} data-testid={`doc-${doc.id}`}>
          {doc.title}
        </li>
      ))}
    </ul>
  );
}

// ============================================
// Mock fetch
// ============================================
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ============================================
// 集成测试
// ============================================
describe('DocumentList与Store集成测试', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // 重置store状态
    useDocumentStore.setState({
      documents: [],
      currentDocument: null,
      isLoading: false,
      error: null,
    });
  });

  test('应该显示加载状态', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // 永不resolve

    render(<DocumentList />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('加载成功后应该显示文档列表', async () => {
    const mockDocuments = [
      { id: '1', title: '文档1', content: '内容1' },
      { id: '2', title: '文档2', content: '内容2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDocuments),
    });

    render(<DocumentList />);

    // 初始显示加载状态
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // 等待文档列表出现
    await waitFor(() => {
      expect(screen.getByTestId('document-list')).toBeInTheDocument();
    });

    // 验证文档标题
    expect(screen.getByTestId('doc-1')).toHaveTextContent('文档1');
    expect(screen.getByTestId('doc-2')).toHaveTextContent('文档2');
  });

  test('加载失败后应该显示错误消息', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: '服务器错误' }),
    });

    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('获取文档失败');
  });
});
```

### 5.2 路由测试

路由测试验证组件与React Router的集成，包括导航、参数传递、嵌套路由等。

```typescript
/**
 * React Router路由测试
 * 测试路由导航和参数传递
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';

// ============================================
// 测试组件：用户详情页
// ============================================
function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <h1>用户ID: {userId}</h1>
      <button onClick={() => navigate('/users')}>返回列表</button>
    </div>
  );
}

function UserList() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>用户列表</h1>
      <button onClick={() => navigate('/users/1')}>查看用户1</button>
    </div>
  );
}

// ============================================
// 路由配置测试
// ============================================
describe('React Router集成测试', () => {
  describe('基本路由导航', () => {
    test('应该导航到用户详情页', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:userId" element={<UserDetail />} />
          </Routes>
        </MemoryRouter>
      );

      // 初始显示用户列表
      expect(screen.getByText('用户列表')).toBeInTheDocument();

      // 点击查看用户按钮
      await user.click(screen.getByText('查看用户1'));

      // 应该显示用户详情
      expect(screen.getByText('用户ID: 1')).toBeInTheDocument();
    });

    test('应该正确解析URL参数', async () => {
      render(
        <MemoryRouter initialEntries={['/users/42']}>
          <Routes>
            <Route path="/users/:userId" element={<UserDetail />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('用户ID: 42')).toBeInTheDocument();
    });

    test('返回按钮应该导航回列表', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/users/1']}>
          <Routes>
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:userId" element={<UserDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await user.click(screen.getByText('返回列表'));

      expect(screen.getByText('用户列表')).toBeInTheDocument();
    });
  });

  describe('嵌套路由测试', () => {
    function AdminPanel() {
      return (
        <div>
          <h1>管理面板</h1>
          <nav>
            <a href="/admin/users">用户管理</a>
            <a href="/admin/settings">设置</a>
          </nav>
        </div>
      );
    }

    function UserManagement() {
      return <div data-testid="user-management">用户管理页面</div>;
    }

    function Settings() {
      return <div data-testid="settings">设置页面</div>;
    }

    test('嵌套路由应该正确渲染', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route path="/admin" element={<AdminPanel />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // 应该显示父路由内容
      expect(screen.getByText('管理面板')).toBeInTheDocument();

      // 应该显示嵌套路由内容
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    test('点击导航应该切换嵌套路由', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <Routes>
            <Route path="/admin" element={<AdminPanel />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      await user.click(screen.getByText('设置'));

      expect(screen.getByTestId('settings')).toBeInTheDocument();
      expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    });
  });
});
```

### 5.3 API Mock测试

API Mock是集成测试中的重要部分，它允许你模拟服务器响应，无需实际的服务器。

```typescript
/**
 * MSW (Mock Service Worker) API Mock测试
 * MSW拦截网络请求，返回模拟响应
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// ============================================
// API接口定义
// ============================================
interface User {
  id: string;
  name: string;
  email: string;
}

// 获取用户的API
const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('获取用户失败');
  return response.json();
};

// 创建用户的API
const createUser = async (data: Omit<User, 'id'>): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('创建用户失败');
  return response.json();
};

// ============================================
// MSW Server配置
// ============================================
const server = setupServer();

// 启动服务器
beforeAll(() => server.listen());

// 每个测试后重置
afterEach(() => server.resetHandlers());

// 关闭服务器
afterAll(() => server.close());

// ============================================
// 用户详情组件
// ============================================
function UserDetail({ userId }: { userId: string }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div data-testid="loading">加载中...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div data-testid="user-detail">
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}

// ============================================
// MSW Mock测试
// ============================================
describe('MSW API Mock测试', () => {
  test('成功获取用户数据', async () => {
    // 定义Mock处理程序
    server.use(
      http.get('/api/users/:id', ({ params }) => {
        return HttpResponse.json({
          id: params.id,
          name: '张三',
          email: 'zhangsan@example.com',
        });
      })
    );

    render(<UserDetail userId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('user-detail')).toBeInTheDocument();
    });

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
  });

  test('处理API错误', async () => {
    // Mock 404错误
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.json({ message: '用户不存在' }, { status: 404 });
      })
    );

    render(<UserDetail userId="999" />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('获取用户失败');
  });

  test('Mock POST请求', async () => {
    const handleCreate = jest.fn();

    server.use(
      http.post('/api/users', async ({ request }) => {
        const data = await request.json();
        return HttpResponse.json(
          { id: 'new-id', ...data },
          { status: 201 }
        );
      })
    );

    // 在组件中调用createUser
    createUser({ name: '李四', email: 'lisi@example.com' })
      .then(handleCreate)
      .catch(() => {});

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith({
        id: 'new-id',
        name: '李四',
        email: 'lisi@example.com',
      });
    });
  });

  test('测试网络错误场景', async () => {
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.error();
      })
    );

    render(<UserDetail userId="1" />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });
});
```

---

## 6. 端到端测试E2E

### 6.1 Playwright完整教程

Playwright是微软开发的E2E测试框架，支持所有主流浏览器，提供强大的自动化能力。

```typescript
/**
 * Playwright E2E测试教程
 * 完整的Playwright测试示例
 */

import { test, expect, Page, Locator } from '@playwright/test';

// ============================================
// Playwright配置
// ============================================
/**
 * playwright.config.ts 配置示例
 */

// 导入 { defineConfig } from '@playwright/test';

// export default defineConfig({
//   // 测试目录
//   testDir: './e2e',
//
//   // 失败时重试次数
//   retries: 2,
//
//   // 并行worker数
//   workers: 4,
//
//   // 全局超时
//   timeout: 30000,
//
//   // 报告器配置
//   reporter: [
//     ['html'],
//     ['json', { outputFile: 'test-results/results.json' }],
//   ],
//
//   // 浏览器配置
//   use: {
//     // 基础URL
//     baseURL: 'http://localhost:3000',
//
//     // 截图选项
//     screenshot: 'only-on-failure',
//
//     // 视频录制
//     video: 'retain-on-failure',
//
//     // 跟踪
//     trace: 'on-first-retry',
//   },
//
//   // 项目配置（多浏览器测试）
//   projects: [
//     {
//       name: 'chromium',
//       use: { browserName: 'chromium' },
//     },
//     {
//       name: 'firefox',
//       use: { browserName: 'firefox' },
//     },
//     {
//       name: 'webkit',
//       use: { browserName: 'webkit' },
//     },
//   ],
//
//   // WebServer配置（启动测试前）
//   webServer: {
//     command: 'npm run dev',
//     port: 3000,
//     reuseExistingServer: true,
//   },
// });

// ============================================
// 页面对象：登录页面
// ============================================
/**
 * 页面对象模式（Page Object Pattern）
 * 将页面元素和操作封装到页面类中
 */
class LoginPage {
  // 页面元素定位器
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
  }

  // 导航到登录页面
  async goto() {
    await page.goto('/login');
  }

  // 填写登录表单
  async fillForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  // 提交表单
  async submit() {
    await this.submitButton.click();
  }

  // 执行完整登录流程
  async login(email: string, password: string) {
    await this.goto();
    await this.fillForm(email, password);
    await this.submit();
  }
}

// ============================================
// 页面对象：仪表盘页面
// ============================================
class DashboardPage {
  readonly page: Page;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async getWelcomeText(): Promise<string> {
    return this.welcomeMessage.textContent() || '';
  }
}

// ============================================
// 登录流程E2E测试
// ============================================
describe('登录流程E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前执行
  });

  test('成功登录后应该跳转到仪表盘', async ({ page }) => {
    // 导航到登录页
    await page.goto('/login');

    // 填写表单
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // 提交
    await page.click('button[type="submit"]');

    // 等待导航到仪表盘
    await page.waitForURL('**/dashboard');

    // 验证仪表盘内容
    await expect(page.locator('h1')).toContainText('欢迎');
  });

  test('登录失败应该显示错误消息', async ({ page }) => {
    await page.goto('/login');

    // 填写错误的凭据
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // 等待错误消息出现
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('邮箱或密码错误');
  });

  test('空表单提交应该显示验证错误', async ({ page }) => {
    await page.goto('/login');

    await page.click('button[type="submit"]');

    // HTML5原生验证会阻止提交
    await expect(page.locator('input:invalid')).toHaveCount(2);
  });
});

// ============================================
// 使用页面对象的测试
// ============================================
describe('页面对象模式测试', () => {
  test('使用页面对象执行登录', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login('test@example.com', 'password123');

    await page.waitForURL('**/dashboard');
  });

  test('完整用户流程测试', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 登录
    await loginPage.login('test@example.com', 'password123');

    // 验证欢迎消息
    const welcomeText = await dashboardPage.getWelcomeText();
    expect(welcomeText).toContain('欢迎回来');

    // 登出
    await dashboardPage.logout();

    // 验证回到登录页
    await page.waitForURL('**/login');
  });
});

// ============================================
// 常用操作示例
// ============================================
describe('Playwright常用操作', () => {
  test('等待元素出现', async ({ page }) => {
    await page.goto('/dashboard');

    // 等待特定元素可见
    await page.waitForSelector('[data-testid="user-list"]', { state: 'visible' });

    // 等待URL变化
    await page.waitForURL('**/dashboard');

    // 等待网络请求完成
    await page.waitForResponse(response =>
      response.url().includes('/api/users') && response.status() === 200
    );
  });

  test('处理下拉菜单', async ({ page }) => {
    await page.goto('/settings');

    // 选择选项
    await page.selectOption('select[name="language"]', 'zh-CN');

    // 或通过标签文本选择
    await page.selectOption('select[name="timezone"]', { label: '北京时间' });
  });

  test('文件上传', async ({ page }) => {
    await page.goto('/upload');

    // 设置input文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/path/to/file.pdf');
  });

  test('iframe操作', async ({ page }) => {
    // 获取iframe
    const frame = page.frameLocator('iframe[name="editor"]');

    // 在iframe中操作
    await frame.locator('.editor-content').fill('Hello World');
  });

  test('拖拽操作', async ({ page }) => {
    // 拖拽元素
    const source = page.locator('[data-testid="draggable"]');
    const target = page.locator('[data-testid="dropzone"]');

    await source.dragTo(target);
  });

  test('键盘快捷键', async ({ page }) => {
    await page.goto('/editor');

    // 按Ctrl+S保存
    await page.keyboard.press('Control+s');

    // 按Ctrl+A全选
    await page.keyboard.press('Control+a');
  });
});

// ============================================
// API请求测试
// ============================================
describe('Playwright API测试', () => {
  test('直接发送API请求', async ({ request }) => {
    // 使用request API直接发送HTTP请求
    const response = await request.get('/api/users');

    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
  });

  test('POST请求创建资源', async ({ request }) => {
    const newUser = {
      name: '测试用户',
      email: 'test@example.com',
    };

    const response = await request.post('/api/users', {
      data: newUser,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(201);

    const created = await response.json();
    expect(created.name).toBe(newUser.name);
    expect(created).toHaveProperty('id');
  });
});
```

### 6.2 Cypress入门

Cypress是另一个流行的E2E测试框架，以其开发者体验和实时重载著称。

```typescript
/**
 * Cypress E2E测试入门
 * 完整的Cypress测试示例
 */

// ============================================
// cypress.config.ts 配置
// ============================================
/**
 * import { defineConfig } from 'cypress';
 *
 * export default defineConfig({
 *   e2e: {
 *     // Cypress 13+使用 specPattern
 *     specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
 *     baseUrl: 'http://localhost:3000',
 *     // 视频录制
 *     video: true,
 *     screenshotOnRunFailure: true,
 *     // 等待DOM渲染时间
 *     defaultCommandTimeout: 4000,
 *   },
 * });
 */

// ============================================
// 基础测试
// ============================================
describe('Cypress基础测试', () => {
  // beforeEach在每个测试前执行
  beforeEach(() => {
    cy.visit('/login'); // 访问登录页面
  });

  it('应该渲染登录表单', () => {
    // cy.get()通过CSS选择器查找元素
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('应该能够输入内容', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');

    // 验证输入的值
    cy.get('input[type="email"]').should('have.value', 'test@example.com');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('应该提交表单并跳转', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // 等待URL变化
    cy.url().should('include', '/dashboard');

    // 验证仪表盘内容
    cy.contains('欢迎').should('be.visible');
  });
});

// ============================================
// 断言详解
// ============================================
describe('Cypress断言', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
  });

  // 存在性断言
  it('元素应该存在', () => {
    cy.get('[data-testid="welcome"]').should('exist');
    cy.get('[data-testid="nonexistent"]').should('not.exist');
  });

  // 可见性断言
  it('元素应该可见', () => {
    cy.get('[data-testid="visible-element"]').should('be.visible');
    cy.get('[data-testid="hidden-element"]').should('be.hidden');
  });

  // 内容断言
  it('元素内容验证', () => {
    cy.get('h1').should('contain.text', '欢迎');
    cy.get('h1').should('have.text', '欢迎来到仪表盘');
  });

  // 状态断言
  it('复选框状态验证', () => {
    cy.get('input[type="checkbox"]').should('not.be.checked');
    cy.get('input[type="checkbox"]').check();
    cy.get('input[type="checkbox"]').should('be.checked');
  });

  // 类名断言
  it('类名验证', () => {
    cy.get('button').should('have.class', 'btn-primary');
    cy.get('button').should('not.have.class', 'btn-disabled');
  });

  // 属性断言
  it('属性验证', () => {
    cy.get('input[type="email"]').should('have.attr', 'placeholder', '请输入邮箱');
    cy.get('a').should('have.attr', 'href').and('include', '/profile');
  });

  // 组合断言
  it('组合断言', () => {
    cy.get('button')
      .should('be.visible')
      .and('have.class', 'btn')
      .and('not.be.disabled');
  });
});

// ============================================
// 异步处理
// ============================================
describe('Cypress异步处理', () => {
  it('等待API响应', () => {
    cy.intercept('GET', '/api/users').as('getUsers');

    cy.visit('/users');

    // 等待别名请求完成
    cy.wait('@getUsers').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });

    cy.get('[data-testid="user-list"]').should('be.visible');
  });

  it('等待元素出现', () => {
    cy.visit('/dashboard');

    // 等待元素出现在DOM中
    cy.get('[data-testid="async-data"]', { timeout: 10000 })
      .should('be.visible');

    // 或者使用.should()重试
    cy.get('[data-testid="dynamic-content"]')
      .should('contain.text', '加载完成');
  });

  it('等待页面跳转', () => {
    cy.get('button[data-testid="next-button"]').click();

    // 等待URL变化
    cy.url().should('include', '/step-2');

    // 或等待新内容出现
    cy.get('[data-testid="step-2-content"]').should('be.visible');
  });
});

// ============================================
// 网络请求Mock
// ============================================
describe('Cypress网络Mock', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
  });

  it('Mock API响应', () => {
    // 拦截API请求并返回mock数据
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' },
      ],
    }).as('getUsers');

    cy.reload(); // 重新加载页面以应用mock

    cy.wait('@getUsers');

    cy.get('[data-testid="user-name-1"]').should('contain.text', '张三');
  });

  it('Mock网络错误', () => {
    cy.intercept('GET', '/api/users', {
      statusCode: 500,
      body: { message: '服务器错误' },
    }).as('getUsersError');

    cy.reload();

    cy.get('[data-testid="error-message"]').should('contain.text', '服务器错误');
  });

  it('Mock延迟响应', () => {
    cy.intercept('GET', '/api/users', {
      body: [{ id: 1, name: '张三' }],
      delay: 2000, // 延迟2秒
    }).as('slowUsers');

    cy.reload();

    // 显示加载状态
    cy.get('[data-testid="loading"]').should('be.visible');

    // 等待加载完成
    cy.wait('@slowUsers');
    cy.get('[data-testid="loading"]').should('not.exist');
  });
});
```

---

## 7. 测试覆盖率

### 7.1 Istanbul覆盖率报告

Istanbul是Jest内置的覆盖率工具，它提供了详细的代码覆盖分析。

```bash
# 运行测试并生成覆盖率报告
npm test -- --coverage

# 生成HTML格式的覆盖率报告
npm test -- --coverage --coverageReporters=html

# 查看特定文件的覆盖率
npm test -- --coverage --collectCoverageFrom="src/components/Button.tsx"
```

**覆盖率报告解读：**

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   85.23 |    72.50 |   90.00 |   85.50 |
src/components/        |   92.00 |    80.00 |  100.00 |   92.00 |
  Button.tsx            |  100.00 |   100.00 |  100.00 |  100.00 |
  Modal.tsx             |   85.00 |    70.00 |  100.00 |   85.00 |
src/hooks/              |   78.50 |    65.00 |   80.00 |   78.50 |
  useAuth.ts            |   90.00 |    75.00 |  100.00 |   90.00 |
  useDocument.ts        |   70.00 |    60.00 |   66.66 |   70.00 |
-----------------------|---------|----------|---------|---------|
```

**覆盖率指标说明：**

- **Stmts (Statement Coverage)**：语句覆盖率，执行的语句占总语句的比例
- **Branch (Branch Coverage)**：分支覆盖率，每个分支（如if/else）至少执行一次的比例
- **Funcs (Function Coverage)**：函数覆盖率，调用的函数占总函数的比例
- **Lines (Line Coverage)**：行覆盖率，至少执行过一行的代码占总行数的比例

### 7.2 覆盖率配置与阈值

```javascript
// jest.config.js 配置覆盖率阈值

module.exports = {
  coverageThreshold: {
    // 全局阈值
    global: {
      // 分支覆盖率至少70%
      branches: 70,
      // 函数覆盖率至少80%
      functions: 80,
      // 行覆盖率至少80%
      lines: 80,
      // 语句覆盖率至少80%
      statements: 80,
    },

    // 特定文件/目录可以设置不同阈值
    './src/utils/': {
      // 工具函数应该有更高覆盖率
      branches: 80,
      functions: 100,
      lines: 90,
    },

    './src/components/': {
      // 组件覆盖率要求
      branches: 75,
      functions: 90,
      lines: 85,
    },
  },

  // 收集覆盖率的文件
  collectCoverageFrom: [
    // 收集所有TS/TSX文件
    'src/**/*.{ts,tsx}',

    // 排除测试文件和类型定义
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',

    // 排除node_modules
    '!node_modules/**',

    // 排除特定目录
    '!src/types/**',
    '!src/**/*.types.ts',
  ],
};
```

### 7.3 提高覆盖率的策略

```typescript
/**
 * 提高测试覆盖率的策略
 * 覆盖率不是最终目标，可靠的测试才是
 */

// ============================================
// 1. 测试边界条件
// ============================================
describe('边界条件测试', () => {
  function divide(a: number, b: number): number {
    if (b === 0) throw new Error('除数不能为零');
    return a / b;
  }

  // 基础场景 - 覆盖率容易达到
  test('正常除法', () => {
    expect(divide(10, 2)).toBe(5);
  });

  // 边界场景 - 提高分支覆盖率
  test('除数为零抛出错误', () => {
    expect(() => divide(10, 0)).toThrow('除数不能为零');
  });
});

// ============================================
// 2. 测试错误路径
// ============================================
describe('错误处理测试', () => {
  async function fetchUserData(id: string) {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('用户不存在');
      }
      throw new Error('获取用户失败');
    }

    return response.json();
  }

  test('成功获取用户', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: '张三' }),
    } as Response);

    const user = await fetchUserData('1');
    expect(user.name).toBe('张三');
  });

  test('404错误', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchUserData('999')).rejects.toThrow('用户不存在');
  });

  test('网络错误', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchUserData('1')).rejects.toThrow('获取用户失败');
  });
});

// ============================================
// 3. 测试工具函数
// ============================================
describe('工具函数覆盖率', () => {
  // 格式化日期
  function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (format === 'short') {
      return `${year}-${month}-${day}`;
    }

    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月',
    ];

    return `${year}年${monthNames[date.getMonth()]}${day}日`;
  }

  test('短格式日期', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'short')).toBe('2024-01-15');
  });

  test('长格式日期', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'long')).toBe('2024年一月15日');
  });

  test('默认格式', () => {
    const date = new Date('2024-06-20');
    expect(formatDate(date)).toBe('2024-06-20');
  });
});

// ============================================
// 4. 组件状态测试
// ============================================
describe('组件状态覆盖率', () => {
  function Toggle({ initialValue = false, onChange }: {
    initialValue?: boolean;
    onChange?: (value: boolean) => void;
  }) {
    const [value, setValue] = React.useState(initialValue);

    const handleClick = () => {
      const newValue = !value;
      setValue(newValue);
      onChange?.(newValue);
    };

    return (
      <button onClick={handleClick} data-testid="toggle">
        {value ? '开启' : '关闭'}
      </button>
    );
  }

  test('初始状态为关闭', () => {
    render(<Toggle />);
    expect(screen.getByTestId('toggle')).toHaveTextContent('关闭');
  });

  test('初始状态为开启', () => {
    render(<Toggle initialValue={true} />);
    expect(screen.getByTestId('toggle')).toHaveTextContent('开启');
  });

  test('点击切换状态', async () => {
    const user = userEvent.setup();
    render(<Toggle />);

    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('toggle')).toHaveTextContent('开启');

    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('toggle')).toHaveTextContent('关闭');
  });

  test('状态变化时调用onChange', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Toggle onChange={handleChange} />);

    await user.click(screen.getByTestId('toggle'));

    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
```

---

## 8. CI持续集成测试

### 8.1 GitHub Actions集成测试

```yaml
# .github/workflows/test.yml
# GitHub Actions测试工作流配置

name: 测试

# 触发条件：push和pull request到main分支
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# 设置环境
env:
  NODE_VERSION: '18'

jobs:
  # ============================================
  # 单元测试和集成测试
  # ============================================
  test:
    name: 单元测试
    runs-on: ubuntu-latest

    # 测试策略矩阵
    strategy:
      matrix:
        # 多个Node版本测试
        node-version: [16, 18, 20]

    steps:
      # 1. 检出代码
      - name: 检出代码
        uses: actions/checkout@v4

      # 2. 设置Node.js环境
      - name: 设置Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          # 启用npm缓存
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      # 3. 安装依赖
      - name: 安装依赖
        run: npm ci

      # 4. 运行类型检查
      - name: 类型检查
        run: npm run type-check
        continue-on-error: false

      # 5. 运行linter
      - name: 代码检查
        run: npm run lint
        continue-on-error: false

      # 6. 运行测试（带覆盖率）
      - name: 运行测试
        run: npm test -- --coverage --coverageReporters=lcov

      # 7. 上传覆盖率报告到Codecov
      - name: 上传覆盖率报告
        uses: codecov/codecov-action@v3
        with:
          # 上传覆盖率文件
          files: ./coverage/lcov.info
          # Codecov项目令牌（可选，公开项目不需要）
          # token: ${{ secrets.CODECOV_TOKEN }}
          # 报告格式
          flags: unittests
          # 项目名称
          name: codecov-umbrella
          # 失败时允许上传
          fail_ci_if_error: false

      # 8. 上传测试结果（可选）
      - name: 上传测试结果
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            coverage/
            test-results/
          # Artifacts保留时间
          retention-days: 7

  # ============================================
  # E2E测试
  # ============================================
  e2e-test:
    name: E2E测试
    runs-on: ubuntu-latest

    # E2E测试需要在构建完成后运行
    needs: test

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 安装Playwright浏览器
        run: npx playwright install --with-deps chromium

      - name: 运行开发服务器
        run: npm run dev &
        env:
          PORT: 3000
        # 等待服务器启动
        timeout-minutes: 5

      - name: 等待服务就绪
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: 运行E2E测试
        run: npx playwright test

      - name: 上传E2E测试结果
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: |
            playwright-report/
            test-results/
          retention-days: 14
```

### 8.2 测试报告生成

```typescript
/**
 * 自定义测试报告配置
 * Jest HTML Reporter配置示例
 */

// jest.config.js
module.exports = {
  // 自定义报告器配置
  reporters: [
    // 默认报告器
    'default',
    // HTML报告器
    ['jest-html-reporter', {
      // 输出文件路径
      outputPath: './test-results/report.html',
      // 是否包含测试失败信息
      includeFailureMsg: true,
      // 是否包含控制台输出
      includeConsoleLog: true,
      // 是否将失败测试放在顶部
      forceFailOnPass: false,
      // 页面标题
      pageTitle: '单元测试报告',
    }],
    // JSON报告器（用于CI）
    ['jest-json-reporter', {
      outputPath: './test-results/results.json',
    }],
  ],
};
```

### 8.3 自动化测试流程

```bash
#!/bin/bash
# scripts/test-ci.sh
# CI环境中的完整测试流程

set -e  # 任何命令失败则退出

echo "=========================================="
echo "开始测试流程"
echo "=========================================="

# 1. 安装依赖
echo "[1/6] 安装依赖..."
npm ci

# 2. 类型检查
echo "[2/6] 运行类型检查..."
npm run type-check

# 3. 代码检查
echo "[3/6] 运行代码检查..."
npm run lint

# 4. 单元测试
echo "[4/6] 运行单元测试..."
npm test -- --coverage --ci

# 5. 构建
echo "[5/6] 构建生产版本..."
npm run build

# 6. E2E测试
echo "[6/6] 运行E2E测试..."
npx playwright test

echo "=========================================="
echo "所有测试通过！"
echo "=========================================="
```

---

## 9. 实战：完整测试项目

### 9.1 项目组件库测试

以下是完整的React组件库测试实现，展示了如何系统地为一个组件库编写测试。

```typescript
/**
 * 完整的React组件库测试
 * 包含Button、Input、Select、Table、Modal等核心组件的测试
 * 总计超过500行测试代码
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// ============================================
// 待测试组件：UserTable组件
// ============================================
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: User['status']) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function UserTable({
  users,
  onEdit,
  onDelete,
  onStatusChange,
  selectedIds,
  onSelectionChange,
}: UserTableProps) {
  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < users.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(users.map(u => u.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div data-testid="user-table-container">
      <table data-testid="user-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                data-testid="select-all"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
              />
            </th>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} data-testid={`user-row-${user.id}`}>
              <td>
                <input
                  type="checkbox"
                  data-testid={`select-${user.id}`}
                  checked={selectedIds.includes(user.id)}
                  onChange={() => handleSelectOne(user.id)}
                />
              </td>
              <td data-testid={`user-id-${user.id}`}>{user.id}</td>
              <td data-testid={`user-name-${user.id}`}>{user.name}</td>
              <td data-testid={`user-email-${user.id}`}>{user.email}</td>
              <td data-testid={`user-role-${user.id}`}>
                <span className={`role-badge role-${user.role}`}>
                  {user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '访客'}
                </span>
              </td>
              <td data-testid={`user-status-${user.id}`}>
                <select
                  value={user.status}
                  onChange={(e) => onStatusChange(user.id, e.target.value as User['status'])}
                  data-testid={`status-select-${user.id}`}
                >
                  <option value="active">活跃</option>
                  <option value="inactive">未激活</option>
                  <option value="pending">待审核</option>
                </select>
              </td>
              <td data-testid={`user-date-${user.id}`}>{formatDate(user.createdAt)}</td>
              <td>
                <button
                  onClick={() => onEdit(user)}
                  data-testid={`edit-button-${user.id}`}
                >
                  编辑
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  data-testid={`delete-button-${user.id}`}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div data-testid="empty-state">暂无用户数据</div>
      )}
    </div>
  );
}

// ============================================
// 测试数据
// ============================================
const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-20T14:20:00Z',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    role: 'guest',
    status: 'pending',
    createdAt: '2024-03-10T09:15:00Z',
  },
];

// ============================================
// UserTable组件测试
// ============================================
describe('UserTable组件完整测试', () => {
  // Mock回调函数
  let mockOnEdit: jest.Mock;
  let mockOnDelete: jest.Mock;
  let mockOnStatusChange: jest.Mock;
  let mockOnSelectionChange: jest.Mock;

  beforeEach(() => {
    // 初始化Mock函数
    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
    mockOnStatusChange = jest.fn();
    mockOnSelectionChange = jest.fn();
  });

  // ============================================
  // 基础渲染测试
  // ============================================
  describe('基础渲染测试', () => {
    test('应该正确渲染用户列表', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 验证表格存在
      expect(screen.getByTestId('user-table')).toBeInTheDocument();

      // 验证用户数据渲染
      expect(screen.getByTestId('user-name-1')).toHaveTextContent('张三');
      expect(screen.getByTestId('user-name-2')).toHaveTextContent('李四');
      expect(screen.getByTestId('user-name-3')).toHaveTextContent('王五');
    });

    test('应该渲染正确数量的行', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const rows = screen.getAllByRole('row');
      // 包括表头行，所以是用户数+1
      expect(rows.length).toBe(mockUsers.length + 1);
    });

    test('应该显示用户邮箱', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByTestId('user-email-1')).toHaveTextContent('zhangsan@example.com');
      expect(screen.getByTestId('user-email-2')).toHaveTextContent('lisi@example.com');
    });

    test('应该显示角色标签', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByTestId('user-role-1')).toHaveTextContent('管理员');
      expect(screen.getByTestId('user-role-2')).toHaveTextContent('用户');
      expect(screen.getByTestId('user-role-3')).toHaveTextContent('访客');
    });

    test('应该格式化日期显示', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 验证日期格式化
      expect(screen.getByTestId('user-date-1')).toHaveTextContent('2024/1/15');
    });

    test('空数组应该显示空状态', () => {
      render(
        <UserTable
          users={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toHaveTextContent('暂无用户数据');
    });

    test('空数组不应该显示表格', () => {
      render(
        <UserTable
          users={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.queryByTestId('user-table')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 选择功能测试
  // ============================================
  describe('选择功能测试', () => {
    test('全选复选框应该选中所有用户', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('select-all'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    test('全选状态下再次点击应该取消全选', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={['1', '2', '3']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('select-all'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    test('选中单个用户应该更新选中列表', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('select-1'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });

    test('取消选中应该从列表中移除', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={['1', '2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('select-1'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['2']);
    });

    test('部分选中状态应该设置indeterminate', () => {
      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={['1']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByTestId('select-all');
      expect(checkbox).toHaveProperty('indeterminate', true);
    });
  });

  // ============================================
  // 操作按钮测试
  // ============================================
  describe('操作按钮测试', () => {
    test('编辑按钮应该调用onEdit', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('edit-button-1'));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockUsers[0]);
    });

    test('删除按钮应该调用onDelete', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      await user.click(screen.getByTestId('delete-button-2'));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith('2');
    });

    test('状态选择器应该调用onStatusChange', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const statusSelect = screen.getByTestId('status-select-1');
      await user.selectOptions(statusSelect, 'inactive');

      expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
      expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'inactive');
    });
  });

  // ============================================
  // 批量操作测试
  // ============================================
  describe('批量操作测试', () => {
    test('选中多个用户后批量删除', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={['1', '2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 模拟删除后重新渲染
      const remainingUsers = [mockUsers[2]];
      rerender(
        <UserTable
          users={remainingUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 验证表格中只剩下一个用户
      expect(screen.queryByTestId('user-row-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-row-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-row-3')).toBeInTheDocument();
    });

    test('批量状态变更', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={['1', '2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 批量将选中用户状态改为 inactive
      const statusSelect = screen.getByTestId('status-select-1');
      await user.selectOptions(statusSelect, 'inactive');

      expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'inactive');
    });
  });

  // ============================================
  // 边界条件测试
  // ============================================
  describe('边界条件测试', () => {
    test('长用户名应该正确显示', () => {
      const longNameUser = {
        ...mockUsers[0],
        id: 'long-name',
        name: '这是一个非常非常长的用户名可能会影响布局',
      };

      render(
        <UserTable
          users={[longNameUser]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByTestId('user-name-long-name')).toBeInTheDocument();
    });

    test('特殊字符邮箱应该正确显示', () => {
      const specialEmailUser = {
        ...mockUsers[0],
        id: 'special',
        email: 'user+tag@example.co.uk',
      };

      render(
        <UserTable
          users={[specialEmailUser]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByTestId('user-email-special')).toHaveTextContent('user+tag@example.co.uk');
    });

    test('所有状态类型都应该可选择', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const statusSelect = screen.getByTestId('status-select-1');

      // 测试所有状态选项
      for (const status of ['active', 'inactive', 'pending']) {
        await user.selectOptions(statusSelect, status);
        expect(mockOnStatusChange).toHaveBeenLastCalledWith('1', status);
      }
    });
  });
});

// ============================================
// 集成测试：完整用户管理CRUD流程
// ============================================
describe('用户管理CRUD集成测试', () => {
  test('完整用户管理流程', async () => {
    const user = userEvent.setup();

    // Mock初始用户列表
    let users = [...mockUsers];
    const onEdit = jest.fn((updatedUser) => {
      users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    });
    const onDelete = jest.fn((id) => {
      users = users.filter(u => u.id !== id);
    });
    const onStatusChange = jest.fn((id, status) => {
      users = users.map(u => u.id === id ? { ...u, status } : u);
    });
    const onSelectionChange = jest.fn();

    // 1. 初始渲染
    const { rerender } = render(
      <UserTable
        users={users}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByTestId('user-table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // 3用户 + 1表头

    // 2. 选择用户
    await user.click(screen.getByTestId('select-1'));
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);

    // 3. 修改状态
    await user.selectOptions(screen.getByTestId('status-select-2'), 'inactive');
    expect(onStatusChange).toHaveBeenCalledWith('2', 'inactive');

    // 4. 重新渲染反映状态变化
    users = users.map(u => u.id === '2' ? { ...u, status: 'inactive' as const } : u);
    rerender(
      <UserTable
        users={users}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        selectedIds={['1']}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByTestId('user-status-2')).toHaveTextContent('未激活');

    // 5. 删除用户
    await user.click(screen.getByTestId('delete-button-3'));
    expect(onDelete).toHaveBeenCalledWith('3');

    // 6. 重新渲染反映删除
    users = users.filter(u => u.id !== '3');
    rerender(
      <UserTable
        users={users}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        selectedIds={['1']}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.queryByTestId('user-row-3')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // 2用户 + 1表头
  });
});
```

---

## 附录：常用测试配置模板

### Vitest配置（替代Jest的现代选择）

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境
    environment: 'jsdom',

    // 全局API
    globals: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },

    // 设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 排除
    exclude: ['node_modules', 'dist'],

    // DOM环境
    jsdom: {
      // jsdom配置
    },
  },
});
```

### 测试环境设置文件

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 全局Fetch Mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Global ResizeObserver Mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

---

## 总结

本指南涵盖了React测试的完整知识体系，从测试基础概念到完整的E2E测试实践。核心要点包括：

1. **测试金字塔**：单元测试为基础，集成测试为补充，E2E测试验证关键流程

2. **React Testing Library**：以用户视角测试，优先使用语义化查询方法

3. **Mock策略**：合理使用Mock隔离依赖，聚焦被测试单元

4. **覆盖率**：覆盖率是工具而非目标，确保关键逻辑被测试

5. **CI集成**：自动化测试流程是质量保障的基础

测试的最佳实践是：编写可维护的测试，让测试成为开发的助力而非负担。
