# Jest单元测试实战

## 一、Jest概述

### 1.1 什么是Jest

Jest是Facebook开发的JavaScript测试框架，具有零配置、功能全面、性能优秀的特点。

**核心优势**：
- **零配置**：开箱即用，无需复杂配置
- **快照测试**：内置快照测试功能
- **并行执行**：多进程并行运行测试
- **内置Mock**：无需额外Mock库
- **代码覆盖率**：内置Istanbul覆盖率工具
- **优秀生态**：React、Vue、Angular官方推荐

### 1.2 安装与配置

```bash
# 安装Jest
npm install --save-dev jest @types/jest ts-jest

# 安装React测试库
npm install --save-dev @testing-library/react @testing-library/jest-dom

# 安装类型定义
npm install --save-dev @types/node
```

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 根目录
  rootDir: './src',
  
  // TypeScript支持
  preset: 'ts-jest',
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  
  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/../__mocks__/fileMock.ts'
  },
  
  // 忽略转换
  transformIgnorePatterns: [
    'node_modules/(?!(react-syntax-highlighter)/)'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.tsx',
    '!**/index.ts'
  ],
  
  // 测试文件匹配
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};

export default config;
```

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';

// 扩展Jest匹配器
expect.extend({
  // 自定义匹配器：检查是否为有效邮箱
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid email`
        : `expected ${received} to be a valid email`
    };
  }
});

// 全局Mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// 清理
afterEach(() => {
  jest.clearAllMocks();
});
```

---

## 二、Jest基础语法

### 2.1 测试结构

```typescript
// 基本测试结构
describe('测试套件名称', () => {
  // 测试前执行
  beforeAll(() => {
    console.log('所有测试开始前执行一次');
  });
  
  // 每个测试前执行
  beforeEach(() => {
    console.log('每个测试开始前执行');
  });
  
  // 测试用例
  it('应该正确计算加法', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('test和it等价', () => {
    expect(true).toBe(true);
  });
  
  // 跳过测试
  it.skip('跳过这个测试', () => {
    // 不会执行
  });
  
  // 仅运行此测试
  it.only('只运行这个测试', () => {
    // 只运行标记为only的测试
  });
  
  // 每个测试后执行
  afterEach(() => {
    console.log('每个测试后执行');
  });
  
  // 所有测试后执行
  afterAll(() => {
    console.log('所有测试后执行一次');
  });
});

// 嵌套describe
describe('外层', () => {
  describe('内层', () => {
    it('嵌套测试', () => {
      expect(true).toBe(true);
    });
  });
});
```

### 2.2 断言匹配器

```typescript
// 常用匹配器
describe('Jest匹配器', () => {
  // 相等性
  test('相等性匹配器', () => {
    // 严格相等
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    
    // 深度相等
    expect({ name: '张三' }).toEqual({ name: '张三' });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
    
    // 严格深度相等
    expect({ a: undefined }).toStrictEqual({ a: undefined });
  });

  // 真值判断
  test('真值匹配器', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect('hello').toBeDefined();
  });

  // 数字匹配器
  test('数字匹配器', () => {
    expect(5).toBeGreaterThan(3);
    expect(5).toBeGreaterThanOrEqual(5);
    expect(3).toBeLessThan(5);
    expect(3).toBeLessThanOrEqual(3);
    
    // 浮点数比较
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect(Math.PI).toBeCloseTo(3.14159, 4);
  });

  // 字符串匹配器
  test('字符串匹配器', () => {
    expect('Hello World').toMatch(/Hello/);
    expect('Hello World').toMatch('World');
    expect('Hello World').toContain('World');
  });

  // 数组匹配器
  test('数组匹配器', () => {
    const arr = [1, 2, 3, 'hello'];
    
    expect(arr).toContain(2);
    expect(arr).toContain('hello');
    expect(arr).toHaveLength(4);
    expect(arr).toContainEqual(1);
    
    // 检查所有元素
    expect([2, 4, 6]).toEqual(
      expect.arrayContaining([2, 4])
    );
  });

  // 对象匹配器
  test('对象匹配器', () => {
    const user = {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      profile: {
        age: 25,
        city: '北京'
      }
    };
    
    // 部分匹配
    expect(user).toMatchObject({
      name: '张三'
    });
    
    // 嵌套匹配
    expect(user).toMatchObject({
      profile: {
        city: '北京'
      }
    });
    
    // 包含属性
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('profile.age', 25);
  });

  // 异常匹配器
  test('异常匹配器', () => {
    const throwError = () => {
      throw new Error('出错了');
    };
    
    expect(throwError).toThrow();
    expect(throwError).toThrow(Error);
    expect(throwError).toThrow('出错了');
    expect(throwError).toThrow(/出错/);
  });

  // 异步匹配器
  test('异步匹配器', async () => {
    const promise = Promise.resolve('成功');
    
    await expect(promise).resolves.toBe('成功');
    await expect(Promise.reject('失败')).rejects.toBe('失败');
    await expect(Promise.reject(new Error('错误'))).rejects.toThrow('错误');
  });
});
```

### 2.3 否定匹配器

```typescript
describe('否定匹配器', () => {
  test('使用not否定', () => {
    expect(1 + 1).not.toBe(3);
    expect('hello').not.toContain('world');
    expect([1, 2, 3]).not.toContain(4);
    expect(null).not.toBeUndefined();
  });
});
```

---

## 三、Mock函数详解

### 3.1 创建Mock函数

```typescript
describe('Mock函数', () => {
  test('基本Mock函数', () => {
    // 创建Mock函数
    const mockFn = jest.fn();
    
    // 调用Mock函数
    mockFn('hello');
    mockFn('world');
    
    // 验证调用
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('hello');
    expect(mockFn).toHaveBeenLastCalledWith('world');
  });

  test('Mock返回值', () => {
    const mockFn = jest.fn();
    
    // 设置返回值
    mockFn.mockReturnValue(10);
    expect(mockFn()).toBe(10);
    
    // 设置连续返回值
    mockFn
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValue(3);
    
    expect(mockFn()).toBe(1);
    expect(mockFn()).toBe(2);
    expect(mockFn()).toBe(3);
    expect(mockFn()).toBe(3);
  });

  test('Mock实现', () => {
    const mockFn = jest.fn((a: number, b: number) => a + b);
    
    expect(mockFn(1, 2)).toBe(3);
    expect(mockFn).toHaveBeenCalledWith(1, 2);
    
    // 动态实现
    mockFn.mockImplementation((a: number, b: number) => a * b);
    expect(mockFn(2, 3)).toBe(6);
  });

  test('Mock异步函数', async () => {
    // Mock Promise
    const mockAsync = jest.fn()
      .mockResolvedValue('成功')
      .mockResolvedValueOnce('第一次成功');
    
    await expect(mockAsync()).resolves.toBe('第一次成功');
    await expect(mockAsync()).resolves.toBe('成功');
    
    // Mock Reject
    const mockReject = jest.fn()
      .mockRejectedValue(new Error('失败'));
    
    await expect(mockReject()).rejects.toThrow('失败');
  });

  test('Mock this上下文', () => {
    const obj = {
      name: '张三',
      greet: jest.fn(function(this: typeof obj) {
        return `Hello, ${this.name}`;
      })
    };
    
    expect(obj.greet()).toBe('Hello, 张三');
  });
});
```

### 3.2 Mock调用信息

```typescript
describe('Mock调用信息', () => {
  test('获取调用信息', () => {
    const mockFn = jest.fn();
    
    mockFn('first', 'call');
    mockFn('second', 'call');
    
    // 调用次数
    console.log(mockFn.mock.calls.length); // 2
    
    // 第一次调用的参数
    console.log(mockFn.mock.calls[0]); // ['first', 'call']
    
    // 最后一次调用的参数
    console.log(mockFn.mock.lastCall); // ['second', 'call']
    
    // 所有调用
    console.log(mockFn.mock.calls);
    // [['first', 'call'], ['second', 'call']]
    
    // 返回值
    mockFn.mockReturnValue('result');
    mockFn();
    console.log(mockFn.mock.results); // [{ type: 'return', value: 'result' }]
  });

  test('验证调用顺序', () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    
    mockFn1('first');
    mockFn2('second');
    mockFn1('third');
    
    // 验证调用顺序
    expect(mockFn1).toHaveBeenNthCalledWith(1, 'first');
    expect(mockFn2).toHaveBeenNthCalledWith(1, 'second');
    expect(mockFn1).toHaveBeenNthCalledWith(2, 'third');
  });
});
```

### 3.3 Spy函数

```typescript
describe('Spy函数', () => {
  test('spyOn基本用法', () => {
    const obj = {
      method: (x: number) => x * 2
    };
    
    // 创建Spy，保留原实现
    const spy = jest.spyOn(obj, 'method');
    
    expect(obj.method(5)).toBe(10);
    expect(spy).toHaveBeenCalledWith(5);
    
    // 恢复原实现
    spy.mockRestore();
  });

  test('spyOn Mock实现', () => {
    const obj = {
      method: (x: number) => x * 2
    };
    
    const spy = jest.spyOn(obj, 'method')
      .mockImplementation(x => x * 3);
    
    expect(obj.method(5)).toBe(15);
    
    spy.mockRestore();
  });

  test('spyOn getter/setter', () => {
    const obj = {
      _value: 0,
      get value() { return this._value; },
      set value(v) { this._value = v; }
    };
    
    const getterSpy = jest.spyOn(obj, 'value', 'get');
    const setterSpy = jest.spyOn(obj, 'value', 'set');
    
    obj.value = 10;
    expect(obj.value).toBe(10);
    
    expect(setterSpy).toHaveBeenCalledWith(10);
    expect(getterSpy).toHaveBeenCalled();
    
    getterSpy.mockRestore();
    setterSpy.mockRestore();
  });
});
```

---

## 四、模块Mock

### 4.1 整体Mock模块

```typescript
// __mocks__/axios.ts
export default {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
};
```

```typescript
// 测试文件
import axios from 'axios';
import { fetchUser } from './userService';

// Mock整个axios模块
jest.mock('axios');

describe('用户服务', () => {
  beforeEach(() => {
    // 重置Mock
    jest.clearAllMocks();
  });

  test('应该获取用户数据', async () => {
    const mockData = { id: 1, name: '张三' };
    (axios.get as jest.Mock).mockResolvedValue({ data: mockData });
    
    const result = await fetchUser(1);
    
    expect(axios.get).toHaveBeenCalledWith('/api/users/1');
    expect(result).toEqual(mockData);
  });

  test('应该处理错误', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('网络错误'));
    
    await expect(fetchUser(1)).rejects.toThrow('网络错误');
  });
});
```

### 4.2 部分Mock模块

```typescript
// utils/dateUtils.ts
export const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN');
};

export const parseDate = (str: string) => {
  return new Date(str);
};

// 测试文件
import * as dateUtils from './utils/dateUtils';

// 部分Mock
jest.mock('./utils/dateUtils', () => ({
  ...jest.requireActual('./utils/dateUtils'),
  formatDate: jest.fn()
}));

describe('日期工具', () => {
  test('formatDate被Mock，parseDate保留原实现', () => {
    (dateUtils.formatDate as jest.Mock).mockReturnValue('2024-01-01');
    
    expect(dateUtils.formatDate(new Date())).toBe('2024-01-01');
    expect(dateUtils.parseDate('2024-01-01')).toBeInstanceOf(Date);
  });
});
```

### 4.3 Mock Node.js模块

```typescript
// Mock fs模块
import fs from 'fs';

jest.mock('fs');

describe('文件操作', () => {
  test('读取文件', () => {
    const mockData = '文件内容';
    (fs.readFileSync as jest.Mock).mockReturnValue(mockData);
    
    const result = fs.readFileSync('test.txt', 'utf-8');
    
    expect(result).toBe(mockData);
    expect(fs.readFileSync).toHaveBeenCalledWith('test.txt', 'utf-8');
  });
});

// Mock path模块
import path from 'path';

jest.mock('path');

describe('路径操作', () => {
  test('路径拼接', () => {
    (path.join as jest.Mock).mockReturnValue('/a/b/c');
    
    expect(path.join('/a', 'b', 'c')).toBe('/a/b/c');
  });
});
```

### 4.4 Mock ES6类

```typescript
// SoundPlayer.ts
export class SoundPlayer {
  constructor() {
    // 初始化
  }
  
  playSoundFile(fileName: string) {
    // 播放音频
  }
}

// 测试文件
import { SoundPlayer } from './SoundPlayer';

// Mock类
jest.mock('./SoundPlayer');

describe('SoundPlayer', () => {
  test('应该调用playSoundFile', () => {
    const mockPlaySoundFile = jest.fn();
    (SoundPlayer as jest.Mock).mockImplementation(() => ({
      playSoundFile: mockPlaySoundFile
    }));
    
    const player = new SoundPlayer();
    player.playSoundFile('song.mp3');
    
    expect(mockPlaySoundFile).toHaveBeenCalledWith('song.mp3');
  });
});
```

---

## 五、快照测试

### 5.1 基本快照测试

```typescript
import { render } from '@testing-library/react';
import Button from './Button';

describe('Button快照测试', () => {
  test('默认按钮快照', () => {
    const { asFragment } = render(<Button>点击我</Button>);
    expect(asFragment()).toMatchSnapshot();
  });

  test('禁用按钮快照', () => {
    const { asFragment } = render(<Button disabled>禁用按钮</Button>);
    expect(asFragment()).toMatchSnapshot();
  });

  test('不同变体快照', () => {
    const { asFragment: primary } = render(<Button variant="primary">主要</Button>);
    const { asFragment: secondary } = render(<Button variant="secondary">次要</Button>);
    const { asFragment: danger } = render(<Button variant="danger">危险</Button>);
    
    expect(primary()).toMatchSnapshot('primary按钮');
    expect(secondary()).toMatchSnapshot('secondary按钮');
    expect(danger()).toMatchSnapshot('danger按钮');
  });
});
```

### 5.2 内联快照

```typescript
import { render } from '@testing-library/react';
import Card from './Card';

describe('Card内联快照', () => {
  test('Card组件快照', () => {
    const { asFragment } = render(
      <Card title="标题" description="描述内容" />
    );
    
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div class="card">
          <h2 class="card-title">标题</h2>
          <p class="card-description">描述内容</p>
        </div>
      </DocumentFragment>
    `);
  });
});
```

### 5.3 属性匹配器

```typescript
import { render } from '@testing-library/react';
import DynamicComponent from './DynamicComponent';

describe('动态组件快照', () => {
  test('忽略动态属性', () => {
    const { asFragment } = render(
      <DynamicComponent 
        id="dynamic-id"
        timestamp={Date.now()}
        random={Math.random()}
      />
    );
    
    expect(asFragment()).toMatchSnapshot({
      // 忽略动态值
      id: expect.any(String),
      timestamp: expect.any(Number),
      random: expect.any(Number)
    });
  });
});
```

### 5.4 快照最佳实践

```typescript
// ❌ 不好的做法：快照太大
test('整个页面快照', () => {
  const { asFragment } = render(<EntirePage />);
  expect(asFragment()).toMatchSnapshot(); // 太大，难以维护
});

// ✅ 好的做法：快照关键组件
test('关键组件快照', () => {
  const { asFragment } = render(<CriticalComponent />);
  expect(asFragment()).toMatchSnapshot();
});

// ✅ 使用内联快照便于审查
test('小型组件内联快照', () => {
  const { asFragment } = render(<SmallComponent />);
  expect(asFragment()).toMatchInlineSnapshot();
});

// ✅ 定期更新快照
// 运行: jest --updateSnapshot
// 或: jest -u
```

---

## 六、异步测试

### 6.1 Promise测试

```typescript
describe('Promise测试', () => {
  // async/await方式（推荐）
  test('async/await方式', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
  });

  // resolves/rejects方式
  test('resolves方式', async () => {
    await expect(fetchData()).resolves.toEqual({ id: 1 });
  });

  test('rejects方式', async () => {
    await expect(fetchError()).rejects.toThrow('错误');
  });

  // 传统then方式
  test('then方式', () => {
    return fetchData().then(data => {
      expect(data).toBeDefined();
    });
  });

  // 传统catch方式
  test('catch方式', () => {
    return fetchError().catch(error => {
      expect(error).toBeInstanceOf(Error);
    });
  });
});
```

### 6.2 回调测试

```typescript
describe('回调测试', () => {
  // 使用done参数
  test('使用done参数', (done) => {
    fetchDataCallback((data) => {
      expect(data).toBeDefined();
      done();
    });
  });

  // 错误回调
  test('错误回调', (done) => {
    fetchErrorCallback(
      (data) => {
        done.fail('不应该成功');
      },
      (error) => {
        expect(error).toBeDefined();
        done();
      }
    );
  });

  // 推荐方式：Promise包装
  test('Promise包装回调', async () => {
    const data = await new Promise((resolve, reject) => {
      fetchDataCallback(resolve, reject);
    });
    expect(data).toBeDefined();
  });
});
```

### 6.3 定时器测试

```typescript
describe('定时器测试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('setTimeout', () => {
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    
    // 时间未到
    expect(callback).not.toHaveBeenCalled();
    
    // 快进时间
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalled();
  });

  test('setInterval', () => {
    const callback = jest.fn();
    
    setInterval(callback, 1000);
    
    // 快进3.5秒
    jest.advanceTimersByTime(3500);
    
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test('runAllTimers', () => {
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    setTimeout(callback, 2000);
    setTimeout(callback, 3000);
    
    // 运行所有定时器
    jest.runAllTimers();
    
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test('runOnlyPendingTimers', () => {
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    
    // 运行待处理的定时器
    jest.runOnlyPendingTimers();
    
    expect(callback).toHaveBeenCalled();
  });

  test('异步定时器', async () => {
    const promise = new Promise(resolve => {
      setTimeout(() => resolve('完成'), 1000);
    });
    
    jest.advanceTimersByTime(1000);
    
    await expect(promise).resolves.toBe('完成');
  });
});
```

### 6.4 React异步测试

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AsyncComponent from './AsyncComponent';

describe('React异步组件', () => {
  test('等待元素出现', async () => {
    render(<AsyncComponent />);
    
    // 初始状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    
    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('数据已加载')).toBeInTheDocument();
    });
  });

  test('使用findBy（推荐）', async () => {
    render(<AsyncComponent />);
    
    // findBy自动等待
    const element = await screen.findByText('数据已加载');
    expect(element).toBeInTheDocument();
  });

  test('用户交互', async () => {
    const user = userEvent.setup();
    render(<AsyncComponent />);
    
    const button = screen.getByRole('button', { name: '加载数据' });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('数据已加载')).toBeInTheDocument();
    });
  });

  test('自定义等待选项', async () => {
    render(<AsyncComponent />);
    
    await waitFor(
      () => expect(screen.getByText('数据已加载')).toBeInTheDocument(),
      {
        timeout: 5000, // 超时时间
        interval: 50,  // 轮询间隔
        onTimeout: () => console.log('超时了')
      }
    );
  });
});
```

---

## 七、测试覆盖率

### 7.1 收集覆盖率

```bash
# 运行测试并收集覆盖率
jest --coverage

# 指定覆盖率报告格式
jest --coverage --coverageReporters=text --coverageReporters=html

# 只收集特定文件的覆盖率
jest --coverage --collectCoverageFrom='src/**/*.ts'
```

### 7.2 覆盖率配置

```typescript
// jest.config.ts
const config: Config = {
  // 开启覆盖率收集
  collectCoverage: true,
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage',
  
  // 报告格式
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  
  // 收集覆盖率的文件
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/**/__tests__/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // 特定文件阈值
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // 忽略覆盖率
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/__mocks__/'
  ]
};
```

### 7.3 覆盖率报告分析

```typescript
// 覆盖率报告示例
/*
-----------------------------|---------|----------|---------|---------|
File                         | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------|---------|----------|---------|---------|
All files                    |   85.71 |    78.26 |   88.89 |   85.71 |
 src/                        |   85.71 |    78.26 |   88.89 |   85.71 |
  utils.ts                   |   90.00 |    80.00 |  100.00 |   90.00 |
  api.ts                     |   75.00 |    66.67 |   75.00 |   75.00 |
-----------------------------|---------|----------|---------|---------|
*/

// 未覆盖代码示例
function validateUser(user: User): boolean {
  // ✅ 已覆盖
  if (!user) {
    return false;
  }
  
  // ✅ 已覆盖
  if (!user.email) {
    return false;
  }
  
  // ❌ 未覆盖分支
  if (user.email.includes('+')) {
    // 这个分支没有被测试覆盖
    return false;
  }
  
  // ❌ 未覆盖分支
  if (user.age < 0) {
    // 边界条件未测试
    return false;
  }
  
  // ✅ 已覆盖
  return true;
}

// 补充测试用例
describe('validateUser覆盖率补充', () => {
  test('邮箱包含+号应该返回false', () => {
    expect(validateUser({ email: 'test+alias@example.com' })).toBe(false);
  });
  
  test('年龄为负数应该返回false', () => {
    expect(validateUser({ email: 'test@example.com', age: -1 })).toBe(false);
  });
});
```

---

## 八、高级技巧

### 8.1 参数化测试

```typescript
// 使用test.each进行参数化测试
describe('参数化测试', () => {
  test.each([
    [1, 1, 2],
    [1, 2, 3],
    [2, 2, 4],
    [0, 0, 0],
    [-1, 1, 0]
  ])('add(%i, %i) = %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });

  // 对象参数
  test.each([
    { input: 'hello', expected: 'HELLO' },
    { input: 'World', expected: 'WORLD' },
    { input: '', expected: '' }
  ])('toUpperCase($input) = $expected', ({ input, expected }) => {
    expect(input.toUpperCase()).toBe(expected);
  });

  // 表格形式
  test.each`
    a    | b    | expected
    ${1} | ${1} | ${2}
    ${1} | ${2} | ${3}
    ${2} | ${2} | ${4}
  `('add($a, $b) = $expected', ({ a, b, expected }) => {
    expect(add(a, b)).toBe(expected);
  });

  // describe.each
  describe.each([
    ['add', add],
    ['subtract', subtract]
  ])('%s函数', (name, fn) => {
    test('应该返回数字', () => {
      expect(typeof fn(1, 2)).toBe('number');
    });
  });
});
```

### 8.2 条件测试

```typescript
describe('条件测试', () => {
  // 根据条件跳过测试
  const testIf = (condition: boolean) => condition ? test : test.skip;
  
  testIf(process.env.NODE_ENV === 'development')('只在开发环境运行', () => {
    // 开发环境测试
  });

  // 根据Node版本
  const nodeVersion = parseInt(process.version.slice(1));
  const testIfNode18 = nodeVersion >= 18 ? test : test.skip;
  
  testIfNode18('Node 18+特性测试', () => {
    // Node 18+特性
  });

  // 使用describe条件
  describe.skipIf(process.env.CI === 'true')('本地测试', () => {
    test('只在本地运行', () => {
      // 本地测试
    });
  });
});
```

### 8.3 测试上下文

```typescript
// 创建测试上下文
interface TestContext {
  user: User;
  service: UserService;
  mockApi: jest.Mock;
}

function createTestContext(): TestContext {
  const mockApi = jest.fn();
  const service = new UserService(mockApi);
  const user = { id: 1, name: '张三' };
  
  return { user, service, mockApi };
}

describe('UserService with context', () => {
  let ctx: TestContext;
  
  beforeEach(() => {
    ctx = createTestContext();
  });
  
  test('应该获取用户', async () => {
    ctx.mockApi.mockResolvedValue(ctx.user);
    
    const result = await ctx.service.getUser(1);
    
    expect(result).toEqual(ctx.user);
  });
});
```

### 8.4 自定义匹配器

```typescript
// 扩展Jest匹配器
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidDate(): R;
    }
  }
}

// 实现自定义匹配器
expect.extend({
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid email`
        : `expected ${received} to be a valid email`
    };
  },
  
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be within range ${floor} - ${ceiling}`
        : `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  },
  
  toBeValidDate(received: Date) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid date`
        : `expected ${received} to be a valid date`
    };
  }
});

// 使用自定义匹配器
describe('自定义匹配器', () => {
  test('邮箱验证', () => {
    expect('test@example.com').toBeValidEmail();
    expect('invalid-email').not.toBeValidEmail();
  });
  
  test('范围验证', () => {
    expect(5).toBeWithinRange(1, 10);
    expect(15).not.toBeWithinRange(1, 10);
  });
  
  test('日期验证', () => {
    expect(new Date()).toBeValidDate();
    expect(new Date('invalid')).not.toBeValidDate();
  });
});
```

---

## 九、面试高频问题

### 9.1 Jest基础问题

**Q1: Jest的测试执行流程是什么？**

**答案**：

Jest测试执行流程：

1. **初始化阶段**
   - 读取配置文件（jest.config.js）
   - 解析命令行参数
   - 设置测试环境（jsdom/node）

2. **收集阶段**
   - 扫描测试文件
   - 解析依赖关系
   - 构建依赖图

3. **执行阶段**
   - 并行运行测试（默认多进程）
   - 执行beforeAll钩子
   - 执行测试用例
   - 执行afterAll钩子

4. **报告阶段**
   - 收集测试结果
   - 生成覆盖率报告
   - 输出测试报告

```typescript
// 执行顺序示例
describe('执行顺序', () => {
  console.log('1. describe外部');
  
  beforeAll(() => console.log('2. beforeAll'));
  beforeEach(() => console.log('3. beforeEach'));
  
  test('测试1', () => console.log('4. test 1'));
  test('测试2', () => console.log('5. test 2'));
  
  afterEach(() => console.log('6. afterEach'));
  afterAll(() => console.log('7. afterAll'));
});

// 输出顺序：
// 1. describe外部
// 2. beforeAll
// 3. beforeEach
// 4. test 1
// 6. afterEach
// 3. beforeEach
// 5. test 2
// 6. afterEach
// 7. afterAll
```

---

**Q2: Jest如何实现模块隔离？**

**答案**：

Jest通过以下机制实现模块隔离：

```typescript
// 1. 每个测试文件独立模块缓存
// test1.test.ts
import { counter } from './counter';
test('test1', () => {
  counter.increment();
  expect(counter.value).toBe(1);
});

// test2.test.ts
import { counter } from './counter';
test('test2', () => {
  // counter.value是独立的，不受test1影响
  expect(counter.value).toBe(0);
});

// 2. 使用jest.resetModules()重置模块缓存
describe('模块隔离', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  
  test('测试1', () => {
    const { counter } = require('./counter');
    counter.increment();
    expect(counter.value).toBe(1);
  });
  
  test('测试2', () => {
    const { counter } = require('./counter');
    // 重新require，获得新实例
    expect(counter.value).toBe(0);
  });
});

// 3. 使用jest.isolateModules隔离
test('isolateModules', () => {
  jest.isolateModules(() => {
    const { counter } = require('./counter');
    counter.increment();
    expect(counter.value).toBe(1);
  });
  
  // 外部不受影响
  const { counter } = require('./counter');
  expect(counter.value).toBe(0);
});
```

---

**Q3: 如何测试私有方法？**

**答案**：

```typescript
// 方案1：通过公共方法间接测试（推荐）
class UserService {
  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  public createUser(email: string): User {
    if (!this.validateEmail(email)) {
      throw new Error('邮箱格式无效');
    }
    return { email };
  }
}

describe('UserService', () => {
  test('应该验证邮箱格式', () => {
    const service = new UserService();
    
    // 通过公共方法测试私有方法
    expect(() => service.createUser('invalid')).toThrow('邮箱格式无效');
    expect(() => service.createUser('valid@example.com')).not.toThrow();
  });
});

// 方案2：使用类型断言访问私有方法
describe('UserService私有方法', () => {
  test('validateEmail', () => {
    const service = new UserService();
    const anyService = service as any;
    
    expect(anyService.validateEmail('test@example.com')).toBe(true);
    expect(anyService.validateEmail('invalid')).toBe(false);
  });
});

// 方案3：使用Reflect
describe('UserService私有方法', () => {
  test('validateEmail', () => {
    const service = new UserService();
    
    const result = Reflect.apply(
      (service as any).validateEmail,
      service,
      ['test@example.com']
    );
    
    expect(result).toBe(true);
  });
});
```

---

### 9.2 Mock相关问题

**Q4: jest.fn()和jest.spyOn()的区别？**

**答案**：

| 特性 | jest.fn() | jest.spyOn() |
|------|-----------|--------------|
| 创建方式 | 创建新函数 | 包装现有函数 |
| 原实现 | 无原实现 | 保留原实现 |
| 适用场景 | Mock依赖 | 监控真实调用 |
| 恢复 | 无需恢复 | 需要mockRestore() |

```typescript
// jest.fn() - 创建新的Mock函数
describe('jest.fn()', () => {
  test('创建Mock函数', () => {
    const mockFn = jest.fn();
    
    mockFn('hello');
    
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith('hello');
  });
});

// jest.spyOn() - 监控现有函数
describe('jest.spyOn()', () => {
  test('监控并保留原实现', () => {
    const obj = {
      method: (x: number) => x * 2
    };
    
    const spy = jest.spyOn(obj, 'method');
    
    // 原实现仍然有效
    expect(obj.method(5)).toBe(10);
    expect(spy).toHaveBeenCalledWith(5);
    
    spy.mockRestore();
  });
  
  test('监控并替换实现', () => {
    const obj = {
      method: (x: number) => x * 2
    };
    
    const spy = jest.spyOn(obj, 'method')
      .mockImplementation(x => x * 3);
    
    expect(obj.method(5)).toBe(15);
    
    spy.mockRestore();
  });
});
```

---

**Q5: 如何Mock ES6模块的默认导出？**

**答案**：

```typescript
// utils.ts
export default function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN');
}

export function parseDate(str: string): Date {
  return new Date(str);
}

// 测试文件
// 方式1：Mock整个模块
import formatDate from './utils';
import * as utils from './utils';

jest.mock('./utils', () => ({
  __esModule: true,
  default: jest.fn(() => '2024-01-01'),
  parseDate: jest.fn(() => new Date('2024-01-01'))
}));

// 方式2：部分Mock
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  default: jest.fn()
}));

// 方式3：动态Mock
import formatDate from './utils';

jest.mock('./utils');

test('动态Mock默认导出', () => {
  (formatDate as jest.Mock).mockReturnValue('mocked date');
  
  expect(formatDate(new Date())).toBe('mocked date');
});
```

---

### 9.3 性能优化问题

**Q6: 如何优化Jest测试性能？**

**答案**：

```typescript
// 1. 并行配置
// jest.config.ts
const config: Config = {
  // 最大工作进程数
  maxWorkers: '50%',
  
  // 最小工作进程数
  minWorkers: 2,
  
  // 测试超时
  testTimeout: 10000,
  
  // 慢测试阈值
  slowTestThreshold: 5000
};

// 2. 优化Mock
// 使用jest.doMock代替jest.mock（延迟Mock）
beforeEach(() => {
  jest.resetModules();
  jest.doMock('./config', () => ({
    API_URL: 'http://test-api.com'
  }));
});

// 3. 减少不必要的setup
// 只在需要时执行setup
const setupDatabase = () => {
  // 数据库设置
};

describe('数据库测试', () => {
  let db: Database;
  
  // 懒初始化
  beforeAll(() => {
    db = setupDatabase();
  });
});

// 4. 使用浅渲染
import { shallow } from 'enzyme';
// 或
import { render } from '@testing-library/react';

// 5. 跳过慢测试
describe.skip('慢测试', () => {
  test('耗时测试', () => {
    // 跳过
  });
});

// 6. 使用--changedSince只运行变更相关的测试
// jest --changedSince=main
```

---

**Q7: 如何处理测试中的内存泄漏？**

**答案**：

```typescript
// 1. 清理定时器
describe('定时器测试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });
  
  test('定时器', () => {
    const timer = setInterval(() => {}, 1000);
    // 测试完成后自动清理
  });
});

// 2. 清理事件监听
describe('事件监听测试', () => {
  let cleanup: (() => void)[] = [];
  
  afterEach(() => {
    cleanup.forEach(fn => fn());
    cleanup = [];
  });
  
  test('事件监听', () => {
    const handler = () => {};
    window.addEventListener('resize', handler);
    cleanup.push(() => window.removeEventListener('resize', handler));
  });
});

// 3. 清理DOM
describe('DOM测试', () => {
  let container: HTMLDivElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
});

// 4. 清理Mock
describe('Mock测试', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
});

// 5. 使用--detectLeaks检测内存泄漏
// jest --detectLeaks
```

---

## 十、完整示例

### 10.1 工具函数测试

```typescript
// utils/format.ts
export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('金额必须是有效数字');
  }
  
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency
  });
  
  return formatter.format(amount);
}

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    throw new Error('无效的日期');
  }
  
  const tokens: Record<string, () => string> = {
    'YYYY': () => d.getFullYear().toString(),
    'MM': () => (d.getMonth() + 1).toString().padStart(2, '0'),
    'DD': () => d.getDate().toString().padStart(2, '0'),
    'HH': () => d.getHours().toString().padStart(2, '0'),
    'mm': () => d.getMinutes().toString().padStart(2, '0'),
    'ss': () => d.getSeconds().toString().padStart(2, '0')
  };
  
  let result = format;
  for (const [token, fn] of Object.entries(tokens)) {
    result = result.replace(token, fn());
  }
  
  return result;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// utils/format.test.ts
import { formatCurrency, formatDate, debounce } from './format';

describe('formatCurrency', () => {
  test.each([
    [1000, 'CNY', '¥1,000.00'],
    [1000, 'USD', '$1,000.00'],
    [0, 'CNY', '¥0.00'],
    [-100, 'CNY', '-¥100.00']
  ])('formatCurrency(%i, %s) = %s', (amount, currency, expected) => {
    expect(formatCurrency(amount, currency)).toBe(expected);
  });
  
  test('应该抛出错误当金额无效', () => {
    expect(() => formatCurrency(NaN)).toThrow('金额必须是有效数字');
    expect(() => formatCurrency('100' as any)).toThrow('金额必须是有效数字');
  });
});

describe('formatDate', () => {
  test('默认格式', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });
  
  test.each([
    ['YYYY-MM-DD', '2024-01-15'],
    ['YYYY/MM/DD', '2024/01/15'],
    ['YYYY-MM-DD HH:mm:ss', '2024-01-15 10:30:45'],
    ['MM月DD日', '01月15日']
  ])('格式 %s', (format, expected) => {
    const date = new Date('2024-01-15T10:30:45');
    expect(formatDate(date, format)).toBe(expected);
  });
  
  test('字符串日期', () => {
    expect(formatDate('2024-01-15')).toBe('2024-01-15');
  });
  
  test('无效日期应该抛出错误', () => {
    expect(() => formatDate('invalid')).toThrow('无效的日期');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('应该延迟执行', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    
    debouncedFn();
    expect(fn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  
  test('应该只执行最后一次', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    
    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');
    
    jest.advanceTimersByTime(100);
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });
});
```

### 10.2 React组件测试

```typescript
// components/UserCard.tsx
import React from 'react';

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(user.id);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="user-card" data-testid="user-card">
      <img 
        src={user.avatar || '/default-avatar.png'} 
        alt={user.name}
        className="avatar"
      />
      <h3 className="name">{user.name}</h3>
      <p className="email">{user.email}</p>
      
      <div className="actions">
        {onEdit && (
          <button 
            onClick={() => onEdit(user.id)}
            className="edit-btn"
          >
            编辑
          </button>
        )}
        {onDelete && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="delete-btn"
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        )}
      </div>
    </div>
  );
}

// components/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };
  
  test('应该渲染用户信息', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.avatar);
  });
  
  test('应该显示默认头像', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined };
    render(<UserCard user={userWithoutAvatar} />);
    
    expect(screen.getByRole('img')).toHaveAttribute('src', '/default-avatar.png');
  });
  
  test('应该调用onEdit', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    
    render(<UserCard user={mockUser} onEdit={onEdit} />);
    
    await user.click(screen.getByText('编辑'));
    
    expect(onEdit).toHaveBeenCalledWith(1);
  });
  
  test('应该调用onDelete', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(<UserCard user={mockUser} onDelete={onDelete} />);
    
    await user.click(screen.getByText('删除'));
    
    expect(onDelete).toHaveBeenCalledWith(1);
  });
  
  test('删除时应该显示加载状态', async () => {
    const onDelete = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    const user = userEvent.setup();
    
    render(<UserCard user={mockUser} onDelete={onDelete} />);
    
    const deleteBtn = screen.getByText('删除');
    await user.click(deleteBtn);
    
    expect(screen.getByText('删除中...')).toBeInTheDocument();
    expect(deleteBtn).toBeDisabled();
  });
  
  test('没有回调时不显示按钮', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
    expect(screen.queryByText('删除')).not.toBeInTheDocument();
  });
  
  test('快照测试', () => {
    const { asFragment } = render(
      <UserCard user={mockUser} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
```

---

## 十一、总结

Jest是前端测试的核心工具，掌握Jest对于前端开发至关重要。通过本文档，你应该掌握：

1. **Jest配置**：环境配置、TypeScript支持
2. **基础语法**：describe、test、expect、匹配器
3. **Mock技巧**：函数Mock、模块Mock、Spy
4. **快照测试**：组件快照、内联快照
5. **异步测试**：Promise、回调、定时器
6. **测试覆盖率**：配置、分析、优化
7. **高级技巧**：参数化测试、自定义匹配器

**下一步学习**：
- [React Testing Library](./React Testing Library.md)
- [E2E测试与Cypress](./E2E测试与Cypress.md)
- [测试驱动开发TDD](./测试驱动开发TDD.md)