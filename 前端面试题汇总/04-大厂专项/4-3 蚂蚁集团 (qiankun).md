# 蚂蚁集团 专项面经

## 目录

- [一、蚂蚁集团业务介绍](#一蚂蚁集团业务介绍)
  - [1.1 蚂蚁背景与发展历程](#11-蚂蚁背景与发展历程)
  - [1.2 核心产品与业务生态](#12-核心产品与业务生态)
  - [1.3 技术特点与工程文化](#13-技术特点与工程文化)
- [二、前端技术重点](#二前端技术重点)
  - [2.1 微前端qiankun深入解析](#21-微前端qiankun深入解析)
  - [2.2 金融级前端架构](#22-金融级前端架构)
  - [2.3 安全与合规](#23-安全与合规)
- [三、面试高频问题](#三面试高频问题)
  - [3.1 技术问题汇总](#31-技术问题汇总)
  - [3.2 项目经验问题](#32-项目经验问题)
  - [3.3 算法题](#33-算法题)
- [四、代码示例与实战](#四代码示例与实战)
  - [4.1 qiankun微前端实战代码](#41-qiankun微前端实战代码)
  - [4.2 沙箱隔离实现](#42-沙箱隔离实现)
  - [4.3 状态管理与通信](#43-状态管理与通信)
  - [4.4 金融级安全实战](#44-金融级安全实战)

---

## 一、微前端 (qiankun)

### 1.1 qiankun核心概念

qiankun 是蚂蚁集团开源的微前端解决方案，基于 single-spa 进行二次开发，提供了更加完善的功能和更好的开发体验。

**qiankun 的核心优势：**
- 简单易用：学习成本低，API 简洁
- 技术栈无关：支持 React、Vue、Angular 等主流框架
- 资源加载：HTML Entry 方式加载子应用
- 沙箱隔离：JS 沙箱和样式隔离
- 父子通信：提供 props 和 globalState 两种通信方式

### 1.2 JS 沙箱实现

JS 沙箱实现：ProxySandbox (多例) vs SnapshotSandbox (快照)。

#### 1.2.1 SnapshotSandbox (快照沙箱)

快照沙箱是早期微前端方案中常用的沙箱实现方式，其核心思想是在子应用激活和卸载时记录和恢复全局状态。

**实现原理：**
1. 激活时：遍历 window 对象，将当前全局状态快照保存
2. 运行期间：记录所有对 window 的修改
3. 卸载时：将 window 恢复到激活前的状态

```javascript
// SnapshotSandbox 快照沙箱实现
class SnapshotSandbox {
  constructor(name) {
    this.name = name;
    this.proxy = window;
    this.modifyMap = new Map(); // 记录修改的全局变量
    this.snapshot = {}; // 全局状态快照
  }

  // 激活沙箱
  active() {
    // 记录当前全局状态快照
    this.snapshot = this.recorderWindowState();
    // 恢复之前保存的修改
    this.restoreWindowState();
  }

  // 卸载沙箱
  inactive() {
    // 记录当前修改
    this.modifyMap = this.recorderWindowDiff();
    // 恢复全局状态到快照状态
    this.recoverWindowState();
  }

  // 记录全局状态
  recorderWindowState() {
    const snapshot = {};
    for (const key in window) {
      try {
        snapshot[key] = window[key];
      } catch (e) {
        // 某些属性可能无法读取
      }
    }
    return snapshot;
  }

  // 记录差异（从激活到现在的修改）
  recorderWindowDiff() {
    const diff = {};
    for (const key in window) {
      try {
        if (window[key] !== this.snapshot[key]) {
          diff[key] = window[key];
        }
      } catch (e) {
        // 某些属性可能无法读取
      }
    }
    return diff;
  }

  // 恢复全局状态
  recoverWindowState() {
    for (const key in window) {
      try {
        // 遍历所有全局属性，恢复到快照状态
        if (!(key in this.snapshot)) {
          delete window[key];
        }
      } catch (e) {
        // 某些属性可能无法删除
      }
    }
    // 恢复快照中的值
    for (const key in this.snapshot) {
      try {
        window[key] = this.snapshot[key];
      } catch (e) {
        // 某些属性可能无法恢复
      }
    }
  }

  // 恢复之前保存的修改
  restoreWindowState() {
    for (const key in this.modifyMap) {
      try {
        window[key] = this.modifyMap[key];
      } catch (e) {
        // 某些属性可能无法恢复
      }
    }
  }
}

// 使用示例
const sandbox = new SnapshotSandbox('sub-app');

console.log('激活前 globalVar:', window.globalVar); // undefined
sandbox.active();
window.globalVar = 'Hello from sub-app';
console.log('激活后 globalVar:', window.globalVar); // 'Hello from sub-app'
sandbox.inactive();
console.log('卸载后 globalVar:', window.globalVar); // undefined (恢复到初始状态)
```

**快照沙箱的优缺点：**

| 优点 | 缺点 |
|------|------|
| 实现简单，易于理解 | 遍历 window 对象性能差 |
| 兼容性好 | 无法处理隐式全局变量 |
| 不需要额外依赖 | 内存占用大 |

#### 1.2.2 ProxySandbox (代理沙箱)

ProxySandbox 使用 JavaScript Proxy 代理 window 对象，创建一个完全独立的运行时环境，是 qiankun 默认推荐的沙箱方案。

**实现原理：**
1. 创建一个 Proxy 对象代理 window
2. 所有对全局变量的读写都通过 Proxy 拦截
3. 在 Proxy 内部维护一个独立的变量存储对象
4. 子应用只能访问自己作用域内的变量

```javascript
// ProxySandbox 代理沙箱实现
class ProxySandbox {
  constructor(name) {
    this.name = name;
    this.proxy = null;
    // 独立的变量存储
    this.sandboxStorage = new Map();
    // 记录沙箱激活状态
    this.active = false;
    // 记录全局对象
    this.globalObject = null;
  }

  // 初始化沙箱
  init() {
    // 创建 Proxy 代理 window
    this.proxy = new Proxy(this, {
      get: (target, prop) => {
        if (this.active) {
          // 如果在沙箱存储中存在，直接返回
          if (target.sandboxStorage.has(prop)) {
            return target.sandboxStorage.get(prop);
          }
        }
        // 否则从真实 window 获取
        return window[prop];
      },
      set: (target, prop, value) => {
        if (this.active) {
          // 在沙箱存储中设置值
          target.sandboxStorage.set(prop, value);
          return true;
        }
        // 如果沙箱未激活，设置到真实 window
        window[prop] = value;
        return true;
      },
      has: (target, prop) => {
        // 检查是否在沙箱存储中或真实 window 中
        return target.sandboxStorage.has(prop) || prop in window;
      },
      deleteProperty: (target, prop) => {
        // 从沙箱存储中删除
        if (target.sandboxStorage.has(prop)) {
          target.sandboxStorage.delete(prop);
          return true;
        }
        // 从真实 window 中删除
        return delete window[prop];
      },
      ownKeys: (target) => {
        // 返回沙箱存储的键和 window 的键的并集
        const sandboxKeys = Array.from(target.sandboxStorage.keys());
        const windowKeys = Object.keys(window).filter(
          key => {
            try {
              return key in window;
            } catch (e) {
              return false;
            }
          }
        );
        return [...new Set([...sandboxKeys, ...windowKeys])];
      },
      getOwnPropertyDescriptor: (target, prop) => {
        if (target.sandboxStorage.has(prop)) {
          return {
            configurable: true,
            enumerable: true,
            value: target.sandboxStorage.get(prop)
          };
        }
        if (prop in window) {
          return {
            configurable: true,
            enumerable: true,
            value: window[prop]
          };
        }
        return undefined;
      }
    });

    this.globalObject = this.proxy;
    return this.proxy;
  }

  // 激活沙箱
  active() {
    this.active = true;
    console.log(`[${this.name}] 沙箱已激活`);
  }

  // 卸载沙箱
  inactive() {
    this.active = false;
    // 清空沙箱存储
    this.sandboxStorage.clear();
    console.log(`[${this.name}] 沙箱已卸载`);
  }
}

// 改进版 ProxySandbox（更接近 qiankun 实现）
class LegacyProxySandbox {
  constructor(name) {
    this.name = name;
    this.proxy = null;
    this.sandboxStorage = {};
    this.type = 'legacy';
    this.isActive = false;
    this.initialized = false;

    this.init();
  }

  init() {
    const { sandboxStorage } = this;
    const proxy = new window.Proxy(sandboxStorage, {
      set: (target, prop, value) => {
        if (this.isActive) {
          target[prop] = value;
        }
        return true;
      },
      get: (target, prop) => {
        if (this.isActive) {
          // 优先从沙箱存储获取
          if (prop in target) {
            return target[prop];
          }
          // 否则从 window 获取（需要排除一些特殊属性）
          if (prop !== 'push' && prop !== 'pop' && prop !== 'shift') {
            return window[prop];
          }
        }
        return undefined;
      },
      has: (target, prop) => {
        return prop in target || prop in window;
      }
    });

    this.proxy = new window.Proxy((() => {}), {
      apply: (target, context, args) => {
        // 处理函数调用
      },
      get: (target, prop) => {
        if (sandboxStorage.hasOwnProperty(prop)) {
          return sandboxStorage[prop];
        }
        return window[prop];
      },
      set: (target, prop, value) => {
        if (this.isActive) {
          sandboxStorage[prop] = value;
        }
        return true;
      },
      deleteProperty: (target, prop) => {
        if (this.isActive) {
          delete sandboxStorage[prop];
        }
        return true;
      }
    });

    return this.proxy;
  }

  active() {
    this.isActive = true;
    this.initialized = true;
  }

  inactive() {
    this.isActive = false;
    this.sandboxStorage = {};
  }
}

// 使用示例
const sandbox = new ProxySandbox('sub-app-vue');
const proxy = sandbox.init();

console.log('激活前 globalVar:', proxy.globalVar); // undefined

sandbox.active();
proxy.globalVar = 'Hello from Vue sub-app';
proxy.console = 'sandbox console';
console.log('激活后 globalVar:', proxy.globalVar); // 'Hello from Vue sub-app'
console.log('沙箱存储:', sandbox.sandboxStorage); // { globalVar: 'Hello from Vue sub-app', console: 'sandbox console' }

// 注意：这里不会影响真实的 window.globalVar
console.log('真实 window.globalVar:', window.globalVar); // undefined

sandbox.inactive();
console.log('卸载后 globalVar:', proxy.globalVar); // undefined
```

**ProxySandbox 的优缺点：**

| 优点 | 缺点 |
|------|------|
| 性能更好，不需要遍历 window | 需要浏览器支持 Proxy |
| 真正的变量隔离 | 实现相对复杂 |
| 不会影响真实 window 对象 | 无法访问未在沙箱中定义的全局变量 |
| 支持多个子应用同时运行 | 需要处理特殊全局对象的访问 |

### 1.3 样式隔离方案

qiankun 提供了两种样式隔离方案：Scoped CSS 和 CSS Module。

#### 1.3.1 Shadow DOM 样式隔离

```javascript
// Shadow DOM 样式隔离实现
class ShadowDomSandbox {
  constructor(root, name) {
    this.root = root;
    this.name = name;
    this.shadow = null;
  }

  mount() {
    // 创建 Shadow DOM
    this.shadow = this.root.attachShadow({ mode: 'open' });

    // 创建样式容器
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .container {
        padding: 20px;
        background: #fff;
      }
      .title {
        color: #1890ff;
        font-size: 20px;
      }
    `;

    // 创建内容容器
    const contentElement = document.createElement('div');
    contentElement.className = 'container';
    contentElement.innerHTML = `
      <h1 class="title">${this.name} - Shadow DOM 隔离</h1>
      <p>样式与主应用完全隔离</p>
    `;

    // 添加到 Shadow DOM
    this.shadow.appendChild(styleElement);
    this.shadow.appendChild(contentElement);
  }

  unmount() {
    if (this.shadow) {
      this.shadow.innerHTML = '';
    }
  }
}

// 使用示例
const container = document.getElementById('app');
const shadowSandbox = new ShadowDomSandbox(container, '子应用');
shadowSandbox.mount();
```

#### 1.3.2 CSS Prefix 样式隔离

```javascript
// 通过给子应用添加特定前缀来实现样式隔离
class CSSPrefixSandbox {
  constructor(name) {
    this.name = name;
    this.prefix = `antd-mf-${name}-`;
    this.styleElements = [];
  }

  // 添加前缀到选择器
  processStyle(cssText) {
    // 替换类名选择器
    let processed = cssText.replace(
      /(\.[a-zA-Z_][\w-]*)/g,
      (match) => {
        // 排除已经带前缀的选择器
        if (match.startsWith(this.prefix)) {
          return match;
        }
        return `${this.prefix}${match.slice(1)}`;
      }
    );

    // 替换 ID 选择器
    processed = processed.replace(
      /(#[a-zA-Z_][\w-]*)/g,
      (match) => {
        if (match.startsWith(this.prefix)) {
          return match;
        }
        return `${this.prefix}${match.slice(1)}`;
      }
    );

    return processed;
  }

  // 注入处理后的样式
  mount(html) {
    // 处理 style 标签
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;

    while ((match = styleRegex.exec(html)) !== null) {
      const processedCSS = this.processStyle(match[1]);
      const styleElement = document.createElement('style');
      styleElement.textContent = processedCSS;
      document.head.appendChild(styleElement);
      this.styleElements.push(styleElement);
    }

    // 处理行内样式中的类名
    // 处理 class 属性
    html = html.replace(
      /class="([^"]*)"/g,
      (match, classNames) => {
        const processedClasses = classNames
          .split(' ')
          .map(cls => {
            if (cls.startsWith(this.prefix)) return cls;
            return `${this.prefix}${cls}`;
          })
          .join(' ');
        return `class="${processedClasses}"`;
      }
    );

    return html;
  }

  unmount() {
    // 移除所有注入的样式
    this.styleElements.forEach(style => style.remove());
    this.styleElements = [];
  }
}
```

### 1.4 qiankun 路由管理

```javascript
// qiankun 路由配置
// 主应用路由配置
import { registerMicroApps, start } from 'qiankun';

// 定义子应用配置
const apps = [
  {
    name: 'vue-sub-app',
    entry: '//localhost:8081',
    container: '#sub-app-container',
    activeRule: '/vue',
    props: {
      basename: '/vue',
      routerBase: '/vue'
    },
    loader: (loading) => {
      // 自定义 loading
    }
  },
  {
    name: 'react-sub-app',
    entry: '//localhost:8082',
    container: '#sub-app-container',
    activeRule: '/react',
    props: {
      basename: '/react',
      routerBase: '/react'
    }
  },
  {
    name: 'static-sub-app',
    entry: '//localhost:8083',
    container: '#sub-app-container',
    activeRule: '/static'
  }
];

// 注册子应用
registerMicroApps(apps, {
  // 全局加载回调
  beforeLoad: (app) => {
    console.log('before load:', app.name);
    return Promise.resolve();
  },
  beforeMount: (app) => {
    console.log('before mount:', app.name);
    return Promise.resolve();
  },
  afterMount: (app) => {
    console.log('after mount:', app.name);
    return Promise.resolve();
  },
  beforeUnmount: (app) => {
    console.log('before unmount:', app.name);
    return Promise.resolve();
  },
  afterUnmount: (app) => {
    console.log('after unmount:', app.name);
    return Promise.resolve();
  },
  // 加载失败回调
  loadError: (app, err) => {
    console.error('load error:', app.name, err);
  }
});

// 启动 qiankun
start({
  // 是否开启沙箱，默认为 true
  sandbox: true,
  // 开启严格样式隔离模式
  strictStyleIsolation: true,
  // 开启 experimentalStyleIsolation (CSS 前缀隔离)
  experimentalStyleIsolation: true,
  // 指定子应用加载资源时的 fetch 方法
  fetch: (url) => {
    return fetch(url).then(resp => resp.text());
  },
  // 自定义 Title
  getTemplate: (tpl) => {
    return tpl;
  },
  // 是否自动清除余量脚本
  autoCleanResource: true,
  // 预加载已加载的子应用
  prefetch: true,
  // 网络超时时间
  timeout: 30000,
  // 最大同时加载的子应用数量
  maxCacheNum: 10
});
```

### 1.5 父子应用通信

```javascript
// 方式一：通过 props 传递通信
// 主应用
import { registerMicroApps, start } from 'qiankun';

const actions = {
  onGlobalStateChange: (callback) => {
    // 全局状态变更监听
  },
  setGlobalState: (state) => {
    // 设置全局状态
  },
  clearGlobalState: () => {
    // 清除全局状态
  }
};

// 主应用创建通信实例
import { initGlobalState } from 'qiankun';

const state = {
  user: null,
  token: '',
  permissions: []
};

const { onGlobalStateChange, setGlobalState } = initGlobalState(state);

// 监听全局状态变化
onGlobalStateChange((state, prev) => {
  console.log('主应用: 状态变化', state, prev);
});

// 设置全局状态
setGlobalState({
  user: { name: '张三', id: 1 },
  token: 'abc123',
  permissions: ['read', 'write']
});

// 子应用接收 props
let lifecycle = {
  bootstrap: async (props) => {
    console.log('子应用接收到的 props:', props);
    const { container, onGlobalStateChange, setGlobalState } = props;

    // 监听主应用状态变化
    onGlobalStateChange((state, prev) => {
      console.log('子应用: 状态变化', state, prev);
    });
  },
  mount: async (props) => {
    // 使用主应用提供的方法通信
    props.setGlobalState({
      subAppReady: true
    });
  },
  unmount: async (props) => {
    // 清理工作
  }
};
```

---

## 二、中后台基建

### 2.1 Ant Design 组件封装

Ant Design 组件封装：受控与非受控状态的兼容逻辑。

#### 2.1.1 受控与非受控模式基础

```javascript
// 受控组件 vs 非受控组件
// 受控组件：组件状态由外部 props 控制
// 非受控组件：组件内部维护自己的状态

// 基础受控/非受控兼容组件
import React, { useState, useEffect, useRef } from 'react';

class BaseComponent extends React.Component {
  // 内部状态
  state = {
    value: null
  };

  // 判断是否为受控模式
  isControlled() {
    return this.props.value !== undefined;
  }

  // 获取当前值（受控优先）
  getValue() {
    if (this.isControlled()) {
      return this.props.value;
    }
    return this.state.value;
  }

  // 处理值变化
  handleChange(newValue) {
    // 如果是受控模式，只触发回调
    if (this.isControlled()) {
      if (this.props.onChange) {
        this.props.onChange(newValue);
      }
      return;
    }

    // 如果是非受控模式，更新内部状态
    this.setState({ value: newValue });
    if (this.props.onChange) {
      this.props.onChange(newValue);
    }
  }
}

// 函数组件版本
function useControlled(controlledValue, defaultValue) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  // 受控模式
  if (controlledValue !== undefined) {
    return [controlledValue, () => {}];
  }

  // 非受控模式
  return [uncontrolledValue, setUncontrolledValue];
}

// 使用示例
function CustomInput({ value, defaultValue, onChange }) {
  const [inputValue, setInputValue] = useControlled(value, defaultValue);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return <input value={inputValue} onChange={handleChange} />;
}
```

#### 2.1.2 Ant Design Select 组件封装

```javascript
// Ant Design Select 受控/非受控封装
import { Select } from 'antd';
import React, { useState, useEffect } from 'react';

function ControlledSelect({
  // 受控属性
  value,
  defaultValue,
  onChange,
  // 其他属性
  options = [],
  placeholder = '请选择',
  mode, // 'multiple' | 'tags'
  disabled = false,
  ...restProps
}) {
  // 内部状态
  const [internalValue, setInternalValue] = useState(defaultValue);

  // 判断是否为受控模式
  const isControlled = value !== undefined;

  // 同步外部值变化
  useEffect(() => {
    if (isControlled && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, isControlled]);

  // 处理选择变化
  const handleChange = (newValue, option) => {
    // 更新内部状态
    if (!isControlled) {
      setInternalValue(newValue);
    }

    // 触发回调
    if (onChange) {
      onChange(newValue, option);
    }
  };

  // 获取当前值
  const currentValue = isControlled ? value : internalValue;

  return (
    <Select
      value={currentValue}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      mode={mode}
      disabled={disabled}
      {...restProps}
    />
  );
}

// 使用示例
function App() {
  const [singleValue, setSingleValue] = useState(undefined);
  const [multipleValue, setMultipleValue] = useState([]);

  return (
    <div>
      <h3>单选受控模式</h3>
      <ControlledSelect
        value={singleValue}
        onChange={setSingleValue}
        options={[
          { label: '选项1', value: '1' },
          { label: '选项2', value: '2' },
          { label: '选项3', value: '3' }
        ]}
      />

      <h3>多选非受控模式</h3>
      <ControlledSelect
        defaultValue={[]}
        mode="multiple"
        options={[
          { label: '选项A', value: 'a' },
          { label: '选项B', value: 'b' },
          { label: '选项C', value: 'c' }
        ]}
      />

      <h3>受控+自定义渲染</h3>
      <ControlledSelect
        value={singleValue}
        onChange={setSingleValue}
        options={[
          { label: '苹果', value: 'apple', price: 5 },
          { label: '香蕉', value: 'banana', price: 3 },
          { label: '橙子', value: 'orange', price: 4 }
        ]}
        optionLabelProp="label"
        optionRender={(option) => (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{option.label}</span>
            <span style={{ color: '#999' }}>¥{option.price}</span>
          </div>
        )}
      />
    </div>
  );
}
```

#### 2.1.3 Ant Design Table 组件封装

```javascript
// Ant Design Table 受控/非受控封装
import { Table } from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

function ControlledTable({
  // 数据相关
  dataSource,
  defaultDataSource = [],
  columns = [],
  // 分页相关
  pagination,
  defaultPagination = false,
  onPaginationChange,
  // 选择相关
  rowSelection,
  selectedRowKeys,
  onSelectionChange,
  // 其他
  loading = false,
  rowKey = 'id',
  ...restProps
}) {
  // 内部状态
  const [internalDataSource, setInternalDataSource] = useState(defaultDataSource);
  const [internalPagination, setInternalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: defaultDataSource.length,
    ...defaultPagination
  });
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState([]);

  // 判断受控模式
  const isDataControlled = dataSource !== undefined;
  const isPaginationControlled = pagination !== undefined;
  const isSelectionControlled = selectedRowKeys !== undefined;

  // 处理分页变化
  const handleTableChange = useCallback((paginationConfig, filters, sorter) => {
    // 处理分页
    if (!isPaginationControlled) {
      setInternalPagination(paginationConfig);
    }

    // 触发外部回调
    onPaginationChange?.(paginationConfig, filters, sorter);
  }, [isPaginationControlled, onPaginationChange]);

  // 处理选择变化
  const handleSelectionChange = useCallback((selectedRowKeys, selectedRows) => {
    if (!isSelectionControlled) {
      setInternalSelectedRowKeys(selectedRowKeys);
    }
    onSelectionChange?.(selectedRowKeys, selectedRows);
  }, [isSelectionControlled, onSelectionChange]);

  // 获取当前值
  const currentDataSource = isDataControlled ? dataSource : internalDataSource;
  const currentPagination = isPaginationControlled ? pagination : internalPagination;
  const currentRowSelection = rowSelection === null ? undefined : {
    ...rowSelection,
    selectedRowKeys: isSelectionControlled ? selectedRowKeys : internalSelectedRowKeys,
    onChange: handleSelectionChange
  };

  // 处理 columns 中的 render
  const processedColumns = useMemo(() => {
    return columns.map(column => {
      if (column.render && column.actions) {
        // 添加默认的 actions 按钮
        return {
          ...column,
          render: (text, record, index) => {
            const actions = column.actions(record);
            return column.render(text, record, index, actions);
          }
        };
      }
      return column;
    });
  }, [columns]);

  return (
    <Table
      dataSource={currentDataSource}
      columns={processedColumns}
      pagination={currentPagination}
      rowSelection={currentRowSelection}
      loading={loading}
      rowKey={rowKey}
      onChange={handleTableChange}
      {...restProps}
    />
  );
}

// 高级封装：支持服务端分页
function SmartTable({
  // 服务端模式
  serverMode = false,
  fetchData,
  // 本地数据
  dataSource = [],
  // 分页配置
  defaultPageSize = 10,
  pageSizeOptions = ['10', '20', '50', '100'],
  // 其他配置
  ...tableProps
}) {
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0
  });
  const [data, setData] = useState(dataSource);

  // 加载数据
  const loadData = useCallback(async (pageConfig = pagination) => {
    if (!serverMode) return;

    setLoading(true);
    try {
      const result = await fetchData({
        current: pageConfig.current,
        pageSize: pageConfig.pageSize
      });
      setData(result.data);
      setPagination({
        ...pageConfig,
        total: result.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [serverMode, fetchData]);

  // 分页变化
  const handlePaginationChange = useCallback((page, pageSize) => {
    const newPagination = { ...pagination, current: page, pageSize };
    setPagination(newPagination);

    if (serverMode) {
      loadData(newPagination);
    }
  }, [pagination, serverMode, loadData]);

  return (
    <ControlledTable
      dataSource={serverMode ? data : dataSource}
      loading={loading}
      pagination={{
        ...pagination,
        pageSizeOptions,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: handlePaginationChange,
        onShowSizeChange: (current, size) => {
          handlePaginationChange(1, size);
        }
      }}
      {...tableProps}
    />
  );
}
```

#### 2.1.4 Ant Design Form 组件封装

```javascript
// Ant Design Form 高级封装
import { Form, Input, Select, DatePicker, Button } from 'antd';
import React, { useEffect, useCallback, useMemo } from 'react';

const { Item } = Form;
const { TextArea } = Input;

// 表单字段类型映射
const FIELD_TYPE_MAP = {
  input: Input,
  textarea: TextArea,
  select: Select,
  date: DatePicker,
  'date-range': DatePicker.RangePicker,
  number: Input.Number,
  password: Input.Password
};

// 动态表单组件
function DynamicForm({
  fields = [],
  initialValues = {},
  onValuesChange,
  onSubmit,
  formLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 }
  },
  rowProps = {
    gutter: 16
  },
  colProps = {
    span: 24
  }
}) {
  const [form] = Form.useForm();

  // 设置初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 处理值变化
  const handleValuesChange = useCallback((changedValues, allValues) => {
    onValuesChange?.(changedValues, allValues);
  }, [onValuesChange]);

  // 提交表单
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const values = await form.validateFields();
      onSubmit?.(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  }, [form, onSubmit]);

  // 重置表单
  const handleReset = useCallback(() => {
    form.resetFields();
    onValuesChange?.({}, initialValues);
  }, [form, initialValues, onValuesChange]);

  // 渲染单个字段
  const renderField = useCallback((field) => {
    const {
      name,
      label,
      type = 'input',
      rules = [],
      props = {},
      hidden = false,
      disabled = false,
      placeholder,
      options = [],
      customRender
    } = field;

    // 隐藏字段
    if (hidden) {
      return null;
    }

    // 自定义渲染
    if (customRender) {
      return (
        <Item
          key={name}
          name={name}
          label={label}
          rules={rules}
          {...formLayout}
        >
          {customRender({ field, form })}
        </Item>
      );
    }

    // 根据类型渲染不同组件
    const FieldComponent = FIELD_TYPE_MAP[type];

    if (!FieldComponent) {
      console.warn(`未知的字段类型: ${type}`);
      return null;
    }

    // Select 组件特殊处理
    if (type === 'select') {
      return (
        <Item
          key={name}
          name={name}
          label={label}
          rules={rules}
          {...formLayout}
        >
          <FieldComponent
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
            options={options}
            {...props}
          />
        </Item>
      );
    }

    // DateRange 特殊处理
    if (type === 'date-range') {
      return (
        <Item
          key={name}
          name={name}
          label={label}
          rules={rules}
          {...formLayout}
        >
          <FieldComponent
            placeholder={['开始日期', '结束日期']}
            disabled={disabled}
            {...props}
          />
        </Item>
      );
    }

    // 默认 Input 类型
    return (
      <Item
        key={name}
        name={name}
        label={label}
        rules={rules}
        {...formLayout}
      >
        <FieldComponent
          placeholder={placeholder || `请输入${label}`}
          disabled={disabled}
          {...props}
        />
      </Item>
    );
  }, [formLayout]);

  // 渲染字段行
  const renderFieldRow = useCallback((fieldRow) => {
    if (Array.isArray(fieldRow)) {
      return (
        <div key={fieldRow.map(f => f.name).join('-')} style={{ display: 'flex' }}>
          {fieldRow.map(field => (
            <div key={field.name} style={{ flex: 1 }}>
              {renderField(field)}
            </div>
          ))}
        </div>
      );
    }
    return renderField(fieldRow);
  }, [renderField]);

  return (
    <Form
      form={form}
      layout="horizontal"
      onValuesChange={handleValuesChange}
      {...formLayout}
    >
      <div {...rowProps}>
        {fields.map((fieldRow, index) => (
          <div key={index} {...colProps}>
            {renderFieldRow(fieldRow)}
          </div>
        ))}
      </div>

      <Item wrapperCol={{ offset: formLayout.labelCol.span, span: formLayout.wrapperCol.span }}>
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" onClick={handleSubmit} style={{ marginRight: 8 }}>
            提交
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </div>
      </Item>
    </Form>
  );
}

// 使用示例
function ExampleForm() {
  const fields = [
    [
      {
        name: 'username',
        label: '用户名',
        type: 'input',
        rules: [
          { required: true, message: '请输入用户名' },
          { min: 3, max: 20, message: '用户名长度为3-20个字符' }
        ]
      },
      {
        name: 'email',
        label: '邮箱',
        type: 'input',
        rules: [
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入正确的邮箱格式' }
        ]
      }
    ],
    [
      {
        name: 'role',
        label: '角色',
        type: 'select',
        rules: [{ required: true, message: '请选择角色' }],
        options: [
          { label: '管理员', value: 'admin' },
          { label: '普通用户', value: 'user' },
          { label: '访客', value: 'guest' }
        ]
      },
      {
        name: 'birthday',
        label: '生日',
        type: 'date'
      }
    ],
    {
      name: 'bio',
      label: '简介',
      type: 'textarea',
      props: {
        rows: 4,
        maxLength: 200,
        showCount: true
      }
    }
  ];

  const handleSubmit = (values) => {
    console.log('提交表单值:', values);
  };

  return <DynamicForm fields={fields} onSubmit={handleSubmit} />;
}
```

### 2.2 状态管理方案

#### 2.2.1 Redux 状态管理

```javascript
// Redux 完整配置
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { of } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';

// Action Types
const ActionTypes = {
  // 用户相关
  SET_USER: 'SET_USER',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',

  // 列表相关
  FETCH_LIST_REQUEST: 'FETCH_LIST_REQUEST',
  FETCH_LIST_SUCCESS: 'FETCH_LIST_SUCCESS',
  FETCH_LIST_FAILURE: 'FETCH_LIST_FAILURE',
  SET_LIST: 'SET_LIST',
  CLEAR_LIST: 'CLEAR_LIST',

  // UI相关
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Action Creators
export const UserActions = {
  setUser: (user) => ({
    type: ActionTypes.SET_USER,
    payload: user
  }),

  login: (credentials) => ({
    type: ActionTypes.LOGIN_REQUEST,
    payload: credentials
  }),

  loginSuccess: (user) => ({
    type: ActionTypes.LOGIN_SUCCESS,
    payload: user
  }),

  loginFailure: (error) => ({
    type: ActionTypes.LOGIN_FAILURE,
    payload: error
  }),

  logout: () => ({
    type: ActionTypes.LOGOUT
  })
};

export const ListActions = {
  fetchList: (params) => ({
    type: ActionTypes.FETCH_LIST_REQUEST,
    payload: params
  }),

  fetchListSuccess: (data) => ({
    type: ActionTypes.FETCH_LIST_SUCCESS,
    payload: data
  }),

  fetchListFailure: (error) => ({
    type: ActionTypes.FETCH_LIST_FAILURE,
    payload: error
  }),

  setList: (list) => ({
    type: ActionTypes.SET_LIST,
    payload: list
  }),

  clearList: () => ({
    type: ActionTypes.CLEAR_LIST
  })
};

export const UIActions = {
  setLoading: (loading) => ({
    type: ActionTypes.SET_LOADING,
    payload: loading
  }),

  setError: (error) => ({
    type: ActionTypes.SET_ERROR,
    payload: error
  }),

  clearError: () => ({
    type: ActionTypes.CLEAR_ERROR
  })
};

// Reducers
const initialUserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

function userReducer(state = initialUserState, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      };

    case ActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialUserState
      };

    default:
      return state;
  }
}

const initialListState = {
  items: [],
  total: 0,
  current: 1,
  pageSize: 10,
  loading: false,
  error: null
};

function listReducer(state = initialListState, action) {
  switch (action.type) {
    case ActionTypes.FETCH_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ActionTypes.FETCH_LIST_SUCCESS:
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        current: action.payload.current,
        pageSize: action.payload.pageSize,
        loading: false,
        error: null
      };

    case ActionTypes.FETCH_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case ActionTypes.SET_LIST:
      return {
        ...state,
        items: action.payload
      };

    case ActionTypes.CLEAR_LIST:
      return {
        ...initialListState
      };

    default:
      return state;
  }
}

const initialUIState = {
  loading: false,
  error: null
};

function uiReducer(state = initialUIState, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// Root Reducer
const rootReducer = combineReducers({
  user: userReducer,
  list: listReducer,
  ui: uiReducer
});

// Redux Observable Epics
const loginEpic = (action$) => action$.pipe(
  ofType(ActionTypes.LOGIN_REQUEST),
  mergeMap(({ payload }) =>
    // 模拟 API 调用
    of({
      user: { id: 1, name: payload.username, role: 'admin' },
      token: 'mock-token-12345'
    }).pipe(
      map(response => UserActions.loginSuccess(response)),
      catchError(error => of(UserActions.loginFailure(error.message)))
    )
  )
);

const fetchListEpic = (action$) => action$.pipe(
  ofType(ActionTypes.FETCH_LIST_REQUEST),
  mergeMap(({ payload }) =>
    // 模拟 API 调用
    of({
      items: [
        { id: 1, title: 'Item 1', status: 'active' },
        { id: 2, title: 'Item 2', status: 'inactive' }
      ],
      total: 2,
      current: payload.current || 1,
      pageSize: payload.pageSize || 10
    }).pipe(
      map(response => ListActions.fetchListSuccess(response)),
      catchError(error => of(ListActions.fetchListFailure(error.message)))
    )
  )
);

const rootEpic = combineEpics(loginEpic, fetchListEpic);

// Middleware
const logger = createLogger({
  collapsed: true,
  duration: true,
  diff: true
});

const epicMiddleware = createEpicMiddleware();

// Redux DevTools 配置
const composeEnhancers =
  (typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

// 创建 Store
export const store = createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(epicMiddleware, logger)
  )
);

// 运行 Epic
epicMiddleware.run(rootEpic);

// Selector
export const selectors = {
  getUser: (state) => state.user.user,
  getToken: (state) => state.user.token,
  isAuthenticated: (state) => state.user.isAuthenticated,
  getListItems: (state) => state.list.items,
  getListLoading: (state) => state.list.loading,
  getUIError: (state) => state.ui.error,
  getUILoading: (state) => state.ui.loading
};
```

#### 2.2.2 Zustand 状态管理

```javascript
// Zustand 状态管理
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// 基础 Store
const useStore = create(
  devtools(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      list: [],
      loading: false,
      error: null,

      // 用户相关 Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          // 模拟 API 调用
          const response = await new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                user: { id: 1, name: credentials.username, role: 'admin' },
                token: 'mock-token-' + Date.now()
              });
            }, 1000);
          });

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false
          });

          return response;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        list: []
      }),

      // 列表相关 Actions
      fetchList: async (params) => {
        set({ loading: true, error: null });
        try {
          // 模拟 API 调用
          const response = await new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                items: Array.from({ length: 10 }, (_, i) => ({
                  id: i + 1,
                  title: `Item ${i + 1}`,
                  status: i % 2 === 0 ? 'active' : 'inactive'
                })),
                total: 100,
                current: params.current || 1,
                pageSize: params.pageSize || 10
              });
            }, 500);
          });

          set({
            list: response.items,
            loading: false
          });

          return response;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      clearList: () => set({ list: [] }),

      // 通用 Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // 计算属性
      getActiveItems: () => get().list.filter(item => item.status === 'active'),
      getInactiveItems: () => get().list.filter(item => item.status === 'inactive')
    }),
    { name: 'app-store' }
  )
);

// 持久化 Store
const usePersistStore = create(
  persist(
    (set, get) => ({
      // 持久化状态
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // 持久化选项
      getVersion: () => 1
    }),
    {
      name: 'app-preferences',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language
      })
    }
  )
);

// 分块 Store（用于大型应用）
const createUserStore = () => create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null, token: null, isAuthenticated: false })
}));

const createUIStore = () => create((set) => ({
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

// 使用 React Hook
function UserProfile() {
  const { user, isAuthenticated, logout } = useStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    logout: state.logout
  }));

  if (!isAuthenticated) {
    return <div>请登录</div>;
  }

  return (
    <div>
      <h1>欢迎, {user?.name}</h1>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

---

## 三、蚂蚁集团业务介绍

### 3.1 蚂蚁背景与发展历程

蚂蚁集团是中国领先的数字支付提供商和数字金融科技平台，成立于2004年，最初作为阿里巴巴集团的支付宝业务。经过十几年的发展，蚂蚁集团已经成长为一个涵盖支付、信贷、理财、保险、信用等多个领域的综合性数字金融科技平台。

#### 3.1.1 发展历程

**2004-2012年：支付基础建设阶段**
- 2004年：支付宝成立，致力于解决电子商务交易中的信任问题
- 2005年：推出"全额赔付"服务，开创行业先河
- 2010年：推出手机支付客户端
- 2011年：获得央行支付牌照

**2013-2017年：金融科技拓展阶段**
- 2013年：推出余额宝，开启互联网理财时代
- 2014年：蚂蚁金服正式成立
- 2015年：推出花呗、借呗等消费信贷产品
- 2016年：推出芝麻信用
- 2017年：推出相互保（后改名相互宝）

**2018-至今：数字化升级阶段**
- 2018年：完成140亿美元Pre-IPO融资，成为全球最大单笔融资
- 2020年：蚂蚁集团宣布在科创板和港交所同步上市（后暂缓）
- 2021年：成立蚂蚁科技集团股份有限公司
- 2023年：完成回购，显示出公司持续发展的能力

#### 3.1.2 组织架构

蚂蚁集团的业务主要分为以下几个板块：

1. **数字支付业务**
   - 支付宝（中国）
   - Alipay+（跨境支付）

2. **数字金融业务**
   - 蚂蚁财富
   - 网商银行
   - 蚂蚁保险
   - 芝麻信用

3. **科技服务**
   - 蚂蚁链
   - OceanBase数据库
   - 蚂蚁金融云

### 3.2 核心产品与业务生态

#### 3.2.1 支付宝

支付宝是蚂蚁集团的核心产品，也是中国最大的第三方支付平台。

**核心功能：**
- 支付结算：扫码支付、NFC支付、人脸支付
- 资金管理：余额宝、定期理财、基金
- 生活服务：水电煤缴费、社保公积金、交通出行
- 商业服务：商家收款、会员管理、营销工具

**技术特点：**
- 高并发处理能力：支持每秒数十万笔交易
- 安全性：多因素认证、风险控制系统
- 稳定性：异地多活架构

#### 3.2.2 蚂蚁财富

蚂蚁财富是蚂蚁集团旗下的理财平台。

**核心产品：**
- 余额宝：货币基金理财
- 定期理财：固定期限理财产品
- 基金：股票型、债券型、混合型基金
- 黄金：黄金ETF投资

**技术特点：**
- 智能投顾：基于用户风险偏好的智能推荐
- 资产安全：资金同卡进出、多重验证
- 收益透明：实时显示收益走势

#### 3.2.3 芝麻信用

芝麻信用是蚂蚁集团旗下的信用评估系统。

**评分体系：**
- 信用评分：350-950分
- 评估维度：信用历史、行为偏好、履约能力、身份特质、人脉关系

**应用场景：**
- 信用免押金：共享单车、酒店、租赁
- 信用贷款：花呗、借呗额度评估
- 签证便利：部分国家签证便利

### 3.3 技术特点与工程文化

#### 3.3.1 技术架构特点

**1. 分布式架构**
- 微服务架构：将业务拆分为独立的服务单元
- 服务治理：服务注册、发现、熔断、限流
- 分布式事务：保证跨服务的数据一致性

**2. 高可用设计**
- 多活架构：多数据中心部署
- 容灾备份：数据实时备份
- 自动故障恢复：故障自动检测和切换

**3. 安全性要求**
- 金融级安全：符合金融行业安全标准
- 数据加密：传输加密、存储加密
- 身份认证：多因素认证、生物识别

#### 3.3.2 前端技术特点

**1. 统一的UI组件库**
- Ant Design：企业级React组件库
- Ant Design Mobile：移动端组件库
- AntV：数据可视化组件库

**2. 微前端实践**
- qiankun：蚂蚁开源的微前端解决方案
- 沙箱隔离：保证子应用之间的独立性
- 资源共享：主应用提供共享能力

**3. 工程化实践**
- 构建工具：Webpack、Vite
- CI/CD：自动化构建和部署
- 监控报警：性能监控和异常告警

#### 3.3.3 工程文化

**1. 技术驱动**
- 开源贡献：积极开源内部项目
- 技术分享：技术分享会、内部分享平台
- 技术创新：鼓励技术创新和实验

**2. 质量保障**
- 代码审查：严格的代码评审流程
- 自动化测试：单元测试、集成测试、E2E测试
- 监控告警：全面的系统监控

**3. 持续学习**
- 内部培训：技术培训、新人培训
- 外部交流：技术大会、社区活动
- 知识沉淀：技术文档、知识库

---

## 四、前端技术重点

### 4.1 微前端qiankun深入解析

#### 4.1.1 qiankun 核心原理

qiankun 的核心原理可以概括为"沙箱隔离 + 资源加载"。

```javascript
// qiankun 核心流程

// 1. 加载子应用资源
async function loadApp(appConfig) {
  const { name, entry, container } = appConfig;

  // 获取子应用 HTML
  const html = await fetch(entry).then(resp => resp.text());

  // 解析 HTML 获取脚本和样式
  const { scripts, styles } = parseHTML(html);

  // 加载脚本
  const scriptCodeList = await Promise.all(
    scripts.map(script => fetch(script.src || entry + script.src).then(resp => resp.text()))
  );

  // 执行脚本
  scriptCodeList.forEach(code => {
    // 在沙箱环境中执行
    sandbox.run(code);
  });

  // 加载样式
  styles.forEach(style => {
    const styleEl = document.createElement('style');
    styleEl.textContent = style.content;
    document.head.appendChild(styleEl);
  });

  // 渲染到容器
  const rootElement = container.querySelector('#root');
  rootElement.innerHTML = html;

  // 获取生命周期函数
  const bootstrap = window.__POWERED_BY_QIANKUN__ ? window.bootstrap : null;
  const mount = window.mount;
  const unmount = window.unmount;

  return { bootstrap, mount, unmount };
}

// 2. 沙箱机制
class SandBox {
  constructor() {
    this.snapshot = {};
    this.proxy = window;
    this.active = false;
  }

  active() {
    // 记录初始状态
    this.snapshot = {};
    for (const key in window) {
      this.snapshot[key] = window[key];
    }
    this.active = true;
  }

  inactive() {
    // 恢复初始状态
    for (const key in window) {
      if (window[key] !== this.snapshot[key]) {
        window[key] = this.snapshot[key];
      }
    }
    this.active = false;
  }
}
```

#### 4.1.2 qiankun 路由模式

```javascript
// qiankun 路由配置

// 方式一：基于 history 路由
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

// 主应用
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { render, h } from 'static/srcRenderer';

function MainApp() {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/about" component={About} />
        {/* 子应用路由 */}
        <Route path="/vue" component={() => <MicroApp name="vue-app" />} />
        <Route path="/react" component={() => <MicroApp name="react-app" />} />
      </Switch>
    </Router>
  );
}

// 方式二：基于 hash 路由
import { createHashHistory } from 'history';

const hashHistory = createHashHistory();

// 方式三：内存路由（适用于非浏览器环境）
import { createMemoryHistory } from 'history';

const memoryHistory = createMemoryHistory();

// 子应用路由配置
// 子应用需要使用 props 传递的 base 进行路由配置
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';

function SubApp({ base }) {
  const history = createBrowserHistory({ basename: base });

  return (
    <Router history={history}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/list" component={List} />
        <Route path="/detail/:id" component={Detail} />
      </Switch>
    </Router>
  );
}

// 导出生命周期函数
export async function bootstrap() {
  console.log('sub-app bootstrap');
}

export async function mount(props) {
  render(h(SubApp, { base: props.routerBase }), props.container);
}

export async function unmount(props) {
  // 清理工作
  ReactDOM.unmountComponentAtNode(props.container);
}
```

#### 4.1.3 qiankun 通信机制

```javascript
// qiankun 通信完整示例

// 主应用 - 状态管理
import { initGlobalState, MicroAppStateActions } from 'qiankun';

// 初始化全局状态
const initialState = {
  user: null,
  token: '',
  theme: 'light',
  language: 'zh-CN',
  permissions: []
};

const actions = initGlobalState(initialState);

// 监听状态变化
actions.onGlobalStateChange((state, prev) => {
  console.log('主应用状态变化:', state, prev);

  // 更新应用状态
  if (state.user !== prev.user) {
    updateUserState(state.user);
  }

  if (state.theme !== prev.theme) {
    updateTheme(state.theme);
  }
});

// 设置状态
actions.setGlobalState({
  user: { id: 1, name: '张三' },
  theme: 'dark'
});

// 获取当前状态
const currentState = actions.getGlobalState();

// 清理状态
actions.clearGlobalState();

// 子应用 - 接收状态
export async function bootstrap(props) {
  console.log('子应用启动，接收到的props:', props);
}

export async function mount(props) {
  const { container, onGlobalStateChange, setGlobalState, getGlobalState } = props;

  // 监听主应用状态变化
  onGlobalStateChange((state, prev) => {
    console.log('子应用接收状态变化:', state);

    // 更新子应用内部状态
    updateSubAppState(state);
  });

  // 可以主动修改主应用状态
  setGlobalState({
    subAppReady: true
  });

  // 获取当前状态
  const currentState = getGlobalState();

  renderApp(container);
}

// 高级通信示例：自定义通信通道
// 主应用
function createCustomChannel() {
  const callbacks = new Map();

  return {
    // 发送消息
    emit: (event, data) => {
      const callback = callbacks.get(event);
      if (callback) {
        callback(data);
      }
    },

    // 订阅消息
    on: (event, callback) => {
      callbacks.set(event, callback);
    },

    // 取消订阅
    off: (event) => {
      callbacks.delete(event);
    }
  };
}

const channel = createCustomChannel();

// 传递给子应用
registerMicroApps([
  {
    name: 'sub-app',
    entry: '//localhost:3001',
    container: '#container',
    props: {
      channel // 传递通信通道
    }
  }
]);
```

### 4.2 金融级前端架构

#### 4.2.1 金融级安全要求

```javascript
// 金融级安全实践

// 1. 敏感数据加密
class SecureStorage {
  constructor(encryptionKey) {
    this.key = encryptionKey;
  }

  // 加密数据
  encrypt(data) {
    const jsonStr = JSON.stringify(data);
    // 使用 AES 加密（实际使用需引入加密库）
    return this.encryptAES(jsonStr, this.key);
  }

  // 解密数据
  decrypt(encryptedData) {
    const jsonStr = this.decryptAES(encryptedData, this.key);
    return JSON.parse(jsonStr);
  }

  // 存储敏感数据
  setSecureItem(key, value) {
    const encrypted = this.encrypt(value);
    sessionStorage.setItem(key, encrypted);
  }

  // 获取敏感数据
  getSecureItem(key) {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  // 辅助方法
  encryptAES(text, key) {
    // 实际实现需要使用 crypto-js 或 webcrypto
    return btoa(text); // 简化示例
  }

  decryptAES(encrypted, key) {
    return atob(encrypted); // 简化示例
  }
}

// 2. 金融级表单验证
const FinancialValidators = {
  // 银行卡号验证（Luhn算法）
  validateBankCard(cardNumber) {
    const sanitized = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) {
      return { valid: false, message: '银行卡号格式不正确' };
    }

    // Luhn 验证
    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return {
      valid: sum % 10 === 0,
      message: sum % 10 === 0 ? '' : '银行卡号验证失败'
    };
  },

  // 身份证号验证
  validateIdCard(idCard) {
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!reg.test(idCard)) {
      return { valid: false, message: '身份证号格式不正确' };
    }

    // 验证校验位
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i], 10) * weights[i];
    }

    const checkCode = checkCodes[sum % 11];
    const isValid = checkCode === idCard[17].toUpperCase();

    return {
      valid: isValid,
      message: isValid ? '' : '身份证号校验失败'
    };
  },

  // 金额验证
  validateAmount(amount, options = {}) {
    const { min = 0.01, max = 999999999, precision = 2 } = options;

    const num = parseFloat(amount);

    if (isNaN(num)) {
      return { valid: false, message: '请输入有效金额' };
    }

    if (num < min) {
      return { valid: false, message: `金额不能低于${min}元` };
    }

    if (num > max) {
      return { valid: false, message: `金额不能超过${max}元` };
    }

    // 验证精度
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > precision) {
      return { valid: false, message: `金额最多保留${precision}位小数` };
    }

    return { valid: true, message: '' };
  },

  // 手机号验证
  validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return {
      valid: reg.test(phone),
      message: reg.test(phone) ? '' : '请输入正确的手机号'
    };
  },

  // 密码强度验证
  validatePassword(password) {
    const result = {
      valid: true,
      score: 0,
      message: '',
      suggestions: []
    };

    if (password.length < 8) {
      result.valid = false;
      result.message = '密码长度至少8位';
      result.suggestions.push('增加密码长度');
      return result;
    }

    // 评分
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (/[a-z]/.test(password)) result.score += 1;
    if (/[A-Z]/.test(password)) result.score += 1;
    if (/[0-9]/.test(password)) result.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 1;

    if (result.score < 3) {
      result.valid = false;
      result.message = '密码强度不足';
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      result.suggestions.push('添加大小写字母');
    }
    if (!/[0-9]/.test(password)) {
      result.suggestions.push('添加数字');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      result.suggestions.push('添加特殊字符');
    }

    return result;
  }
};

// 3. 交易安全验证
class TransactionSecurity {
  constructor() {
    this.maxAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30分钟
    this.attempts = new Map();
  }

  // 验证交易密码
  verifyTransactionPassword(password, storedHash) {
    const attempts = this.attempts.get('transaction') || 0;

    if (attempts >= this.maxAttempts) {
      const lockoutUntil = this.attempts.get('lockoutUntil');
      if (lockoutUntil && Date.now() < lockoutUntil) {
        return {
          success: false,
          message: '交易密码已锁定，请30分钟后再试'
        };
      }
    }

    const inputHash = this.hashPassword(password);
    const success = inputHash === storedHash;

    if (success) {
      this.attempts.delete('transaction');
    } else {
      const newAttempts = attempts + 1;
      this.attempts.set('transaction', newAttempts);

      if (newAttempts >= this.maxAttempts) {
        this.attempts.set('lockoutUntil', Date.now() + this.lockoutDuration);
        return {
          success: false,
          message: '交易密码错误次数过多，请30分钟后再试'
        };
      }

      return {
        success: false,
        message: `交易密码错误，剩余${this.maxAttempts - newAttempts}次尝试机会`
      };
    }

    return { success: true, message: '' };
  }

  hashPassword(password) {
    // 使用 SHA-256 哈希
    return btoa(password);
  }

  // 生成一次性验证码
  generateOTP(secret, timestamp) {
    // TOTP 算法简化实现
    const timeStep = Math.floor(timestamp / 30);
    const data = secret + timeStep;
    return this.hashPassword(data).substring(0, 6);
  }

  // 验证 OTP
  verifyOTP(secret, inputOtp) {
    const timestamp = Date.now();
    const otp1 = this.generateOTP(secret, timestamp);
    const otp2 = this.generateOTP(secret, timestamp - 30000); // 允许前一个30秒

    return inputOtp === otp1 || inputOtp === otp2;
  }
}
```

#### 4.2.2 高可用前端架构

```javascript
// 高可用前端架构

// 1. 请求重试机制
class RetryableRequest {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.retryCondition = options.retryCondition || this.defaultRetryCondition;
  }

  defaultRetryCondition(error) {
    // 网络错误、超时等可重试
    return error.code === 'NETWORK_ERROR' ||
           error.code === 'TIMEOUT' ||
           error.status === 503;
  }

  async fetchWithRetry(url, options = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw {
            status: response.status,
            message: response.statusText
          };
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        // 检查是否可重试
        if (attempt < this.maxRetries && this.retryCondition(error)) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 2. 降级处理
class DegradationHandler {
  constructor() {
    this.fallbacks = new Map();
    this.circuitState = new Map();
  }

  // 注册降级函数
  registerFallback(operation, fallback) {
    this.fallbacks.set(operation, fallback);
  }

  // 熔断器检查
  canExecute(operation) {
    const state = this.circuitState.get(operation);

    if (!state) return true;

    if (state.status === 'open') {
      // 检查是否超过熔断时间
      if (Date.now() > state.nextAttempt) {
        state.status = 'half-open';
        return true;
      }
      return false;
    }

    return true;
  }

  // 执行带降级的操作
  async execute(operation, primaryFn) {
    if (!this.canExecute(operation)) {
      const fallback = this.fallbacks.get(operation);
      if (fallback) {
        return fallback();
      }
      throw new Error('Service unavailable');
    }

    try {
      const result = await primaryFn();
      // 成功后重置熔断器
      this.circuitState.delete(operation);
      return result;
    } catch (error) {
      this.handleFailure(operation, error);
      throw error;
    }
  }

  handleFailure(operation, error) {
    const state = this.circuitState.get(operation) || {
      failures: 0,
      status: 'closed',
      nextAttempt: 0
    };

    state.failures += 1;

    if (state.failures >= 5) {
      state.status = 'open';
      state.nextAttempt = Date.now() + 60000; // 1分钟后重试
    }

    this.circuitState.set(operation, state);
  }
}

// 3. 多通道请求
class MultiChannelRequest {
  constructor() {
    this.channels = {
      primary: { url: '/api', priority: 1 },
      backup: { url: '/api-backup', priority: 2 },
      cdn: { url: '/api-cdn', priority: 3 }
    };
  }

  async request(path, options = {}) {
    const { timeout = 5000 } = options;

    // 创建所有通道的请求 Promise
    const requests = Object.entries(this.channels).map(async ([name, channel]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${channel.url}${path}`, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return { name, success: true, data: await response.json() };
      } catch (error) {
        return { name, success: false, error };
      }
    });

    // 竞态返回第一个成功的结果
    const results = await Promise.allSettled(requests);

    const successResult = results.find(r => r.status === 'fulfilled' && r.value.success);

    if (successResult) {
      return successResult.value.data;
    }

    throw new Error('All channels failed');
  }
}
```

### 4.3 安全与合规

#### 4.3.1 前端安全实践

```javascript
// 前端安全实践

// 1. XSS 防护
function sanitizeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, char => map[char]);
}

// React 中的 XSS 防护
function SafeComponent({ userInput }) {
  // 使用 dangerouslySetInnerHTML 时必须先净化
  const sanitized = sanitizeHTML(userInput);

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
}

// 2. CSRF 防护
class CSRFProtection {
  constructor() {
    this.token = '';
  }

  // 从 Cookie 获取 CSRF Token
  getTokenFromCookie() {
    const matches = document.cookie.match(/CSRF-TOKEN=([^;]+)/);
    if (matches) {
      this.token = decodeURIComponent(matches[1]);
    }
    return this.token;
  }

  // 发起带 CSRF 保护的请求
  async fetch(url, options = {}) {
    const token = this.getTokenFromCookie();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-TOKEN': token
      }
    });
  }
}

// 3. 内容安全策略
// 在 HTML 中设置 CSP
// <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;">

// 4. 敏感信息保护
class SensitiveDataProtection {
  // 脱敏手机号
  maskPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // 脱敏身份证号
  maskIdCard(idCard) {
    if (!idCard) return '';
    return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
  }

  // 脱敏银行卡号
  maskBankCard(cardNumber) {
    if (!cardNumber) return '';
    return cardNumber.replace(/(\d{4})\d+(\d{4})/, '$1********$2');
  }

  // 脱敏邮箱
  maskEmail(email) {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  // 防止敏感数据泄露到控制台
  secureLog(message, data) {
    // 在生产环境中禁用控制台输出
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // 过滤敏感字段
    const sensitiveFields = ['password', 'token', 'secret', 'cardNumber', 'idCard', 'phone'];
    const sanitized = this.filterSensitiveData(data, sensitiveFields);

    console.log(message, sanitized);
  }

  filterSensitiveData(data, sensitiveFields) {
    if (!data) return data;

    if (typeof data === 'string') {
      return sensitiveFields.some(field => data.toLowerCase().includes(field))
        ? '[FILTERED]'
        : data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item, sensitiveFields));
    }

    if (typeof data === 'object') {
      const result = {};
      for (const key in data) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[FILTERED]';
        } else {
          result[key] = this.filterSensitiveData(data[key], sensitiveFields);
        }
      }
      return result;
    }

    return data;
  }
}
```

#### 4.3.2 合规要求实现

```javascript
// 合规要求实现

// 1. 隐私数据合规
class PrivacyCompliance {
  constructor() {
    this.consentTypes = {
      necessary: '必要功能',
      analytics: '数据分析',
      marketing: '营销推广',
      thirdParty: '第三方共享'
    };
  }

  // 获取用户同意状态
  getConsent(type) {
    const consent = localStorage.getItem('user_consent');
    if (!consent) return false;

    const consentData = JSON.parse(consent);
    return consentData[type] || false;
  }

  // 设置用户同意
  setConsent(type, value) {
    const existing = localStorage.getItem('user_consent');
    const consentData = existing ? JSON.parse(existing) : {};

    consentData[type] = value;
    consentData.timestamp = Date.now();

    localStorage.setItem('user_consent', JSON.stringify(consentData));

    // 触发同意变更事件
    window.dispatchEvent(new CustomEvent('consentChange', {
      detail: { type, value }
    }));
  }

  // 检查是否可以收集数据
  canCollectData(type) {
    // 必要功能始终允许
    if (type === 'necessary') return true;

    // 检查用户是否同意
    return this.getConsent(type);
  }

  // 数据收集（带合规检查）
  collectData(type, data) {
    if (!this.canCollectData(type)) {
      console.warn(`未获得${this.consentTypes[type]}的同意，无法收集数据`);
      return false;
    }

    // 实际收集数据
    this.sendToAnalytics(data);
    return true;
  }

  sendToAnalytics(data) {
    // 发送到分析服务
  }
}

// 2. 审计日志
class AuditLogger {
  constructor(options = {
    endpoint: '/api/audit',
    batchSize: 10,
    flushInterval: 5000
  }) {
    this.endpoint = options.endpoint;
    this.batchSize = options.batchSize;
    this.flushInterval = options.flushInterval;
    this.logs = [];
    this.init();
  }

  init() {
    // 定时刷新日志
    setInterval(() => this.flush(), this.flushInterval);
  }

  // 记录操作日志
  log(operation, details = {}) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      operation,
      details,
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    // 达到批量大小时发送
    if (this.logs.length >= this.batchSize) {
      this.flush();
    }

    return logEntry;
  }

  // 刷新日志到服务器
  async flush() {
    if (this.logs.length === 0) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      // 失败时放回日志队列
      this.logs = [...logsToSend, ...this.logs];
      console.error('审计日志发送失败:', error);
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentUserId() {
    // 从当前会话获取用户ID
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.id || 'anonymous';
  }

  getClientIP() {
    // 实际实现需要服务端支持
    return '0.0.0.0';
  }
}

// 3. 数据生命周期管理
class DataLifecycleManager {
  constructor() {
    this.retentionPolicies = {
      session: { duration: 0, storage: 'session' },
      shortTerm: { duration: 24 * 60 * 60 * 1000, storage: 'local' }, // 24小时
      longTerm: { duration: 30 * 24 * 60 * 60 * 1000, storage: 'local' } // 30天
    };
  }

  // 存储数据（带生命周期）
  store(key, data, policy = 'shortTerm') {
    const policyConfig = this.retentionPolicies[policy];

    const storageData = {
      value: data,
      timestamp: Date.now(),
      policy,
      expiresAt: Date.now() + policyConfig.duration
    };

    if (policyConfig.storage === 'session') {
      sessionStorage.setItem(key, JSON.stringify(storageData));
    } else {
      localStorage.setItem(key, JSON.stringify(storageData));
    }
  }

  // 获取数据（自动检查过期）
  retrieve(key) {
    // 尝试从 sessionStorage 获取
    let data = sessionStorage.getItem(key);
    if (data) {
      return this.checkExpiration(JSON.parse(data));
    }

    // 尝试从 localStorage 获取
    data = localStorage.getItem(key);
    if (data) {
      return this.checkExpiration(JSON.parse(data));
    }

    return null;
  }

  // 检查并处理过期数据
  checkExpiration(storageData) {
    if (!storageData) return null;

    if (storageData.expiresAt && Date.now() > storageData.expiresAt) {
      // 数据已过期，清理
      this.remove(storageData.value);
      return null;
    }

    return storageData.value;
  }

  // 清理过期数据
  cleanExpired() {
    // 清理 localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.expiresAt && Date.now() > data.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // 非生命周期管理的数据，跳过
      }
    }
  }

  // 删除数据
  remove(key) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
```

---

## 五、面试高频问题

### 5.1 技术问题汇总

#### 5.1.1 微前端相关问题

**Q1: qiankun 的工作原理是什么？**

qiankun 的工作原理主要包括以下几个方面：

1. **应用注册**：通过 `registerMicroApps` 方法注册子应用，配置应用的名称、入口、激活规则等

2. **应用加载**：当路由匹配到子应用的激活规则时，qiankun 会：
   - 通过 fetch 获取子应用的 HTML
   - 解析 HTML 获取 CSS 和 JS 资源
   - 在沙箱环境中执行 JS 代码

3. **沙箱隔离**：
   - **JS 沙箱**：使用 Proxy 代理 window 对象，创建独立的执行环境
   - **CSS 隔离**：通过 Shadow DOM 或添加 CSS 前缀实现样式隔离

4. **生命周期管理**：
   - bootstrap：应用初始化
   - mount：应用挂载
   - unmount：应用卸载

5. **通信机制**：通过 props 和 globalState 进行父子应用通信

**Q2: qiankun 和 single-spa 有什么区别？**

| 特性 | single-spa | qiankun |
|------|-------------|---------|
| 定位 | 框架无关的微前端框架 | 基于 single-spa 的完整解决方案 |
| 样式隔离 | 不支持 | 支持（Shadow DOM/CSS 前缀） |
| JS 隔离 | 不支持 | 支持（沙箱机制） |
| 资源加载 | 手动配置 | 自动解析 HTML Entry |
| 学习成本 | 较高 | 较低 |
| 生态 | 较小 | 较大（Ant Design 生态） |

**Q3: qiankun 有什么局限性？**

1. **IE11 兼容性**：qiankun 使用 Proxy，不支持 IE11
2. **公共依赖**：子应用之间的公共依赖无法共享，会造成资源重复加载
3. **样式冲突**：尽管有隔离机制，但复杂场景下仍可能出现样式冲突
4. **路由限制**：子应用需要配置 basename，且路由需要特殊处理
5. **状态管理**：子应用之间的状态隔离，通信成本较高

**Q4: 如何实现子应用之间的通信？**

1. **通过主应用中转**：主应用维护共享状态，子应用通过 props 回调更新
2. **自定义事件**：使用 CustomEvent 或 EventEmitter
3. **共享状态库**：使用 Redux/Zustand 等状态管理库，创建一个共享的 Store
4. **postMessage**：适用于跨域或跨 iframe 的场景

**Q5: qiankun 如何处理样式隔离？**

1. **严格模式 (strictStyleIsolation)**：使用 Shadow DOM 包裹子应用容器
2. **实验模式 (experimentalStyleIsolation)**：通过给 CSS 选择器添加前缀实现隔离
3. **动态样式表**：在子应用卸载时移除对应的样式标签

#### 5.1.2 React 相关问题

**Q6: React 的虚拟 DOM 是什么？有什么优缺点？**

虚拟 DOM 是 React 维护的一个 JavaScript 对象树，用于描述真实 DOM 的结构。

优点：
- 减少直接 DOM 操作，提高性能
- 跨平台开发（React Native、React VR）
- 数据驱动视图更新

缺点：
- 首次渲染开销较大
- 内存占用较高

**Q7: React 的调和算法 (Reconciliation) 是什么？**

React 的调和算法是用于比较新旧虚拟 DOM 树差异的算法，主要特点：
- 使用 Diff 算法，复杂度从 O(n³) 优化到 O(n)
- 元素类型不同则完全替换
- 同级元素使用 key 进行匹配
- 支持自定义渲染逻辑

**Q8: React Hooks 的使用规则是什么？**

1. 只在 React 函数组件中调用 Hooks
2. 不要在循环、条件或嵌套函数中调用 Hooks
3. 使用 `useEffect` 处理副作用
4. 使用 `useCallback` 和 `useMemo` 优化性能
5. 遵循 Hooks 的调用顺序

**Q9: React 的状态管理方案有哪些？**

1. **React 内置**：
   - useState/useReducer：组件级状态
   - Context：跨组件状态共享

2. **外部状态管理**：
   - Redux：功能最完善，社区活跃
   - MobX：响应式编程，简洁易用
   - Zustand：轻量级，上手简单
   - Jotai：原子化状态管理

**Q10: React 性能优化有哪些方法？**

1. 使用 React.memo 缓存组件
2. 使用 useCallback/useMemo 缓存函数和计算结果
3. 使用 useReducer 处理复杂状态逻辑
4. 合理使用 key
5. 代码分割（React.lazy / Suspense）
6. 虚拟列表（react-window）

#### 5.1.3 Vue 相关问题

**Q11: Vue 3 的 Composition API 是什么？**

Composition API 是 Vue 3 引入的一套新的 API，用于组织和复用组件逻辑。

核心 API：
- ref：响应式引用
- reactive：响应式对象
- computed：计算属性
- watch/watchEffect：监听器
- onMounted/onUnmounted：生命周期钩子
- provide/inject：依赖注入

**Q12: Vue 的响应式原理是什么？**

Vue 2 使用 Object.defineProperty 劫持对象的 getter 和 setter。
Vue 3 使用 Proxy 代理整个对象。

响应式流程：
1. 组件渲染时收集依赖
2. 数据变化时触发 setter
3. 通知所有依赖更新
4. 触发组件重新渲染

**Q13: Vue 的 computed 和 watch 有什么区别？**

| 特性 | computed | watch |
|------|----------|-------|
| 用途 | 计算属性 | 侦听器 |
| 缓存 | 有缓存 | 无缓存 |
| 返回值 | 必须返回值 | 可不返回值 |
| 触发 | 依赖变化时 | 数据变化时 |
| 异步 | 不支持 | 支持 |

#### 5.1.4 TypeScript 相关问题

**Q14: TypeScript 的类型推断是什么？**

TypeScript 会根据变量的初始化值自动推断变量的类型。

```typescript
let x = 3; // 推断为 number
let y = 'hello'; // 推断为 string
let z = []; // 推断为 never[]
let obj = { a: 1 }; // 推断为 { a: number }
```

**Q15: TypeScript 的泛型是什么？**

泛型允许创建可复用的组件，能够支持多种类型而非单一类型。

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

// 泛型类
class Box<T> {
  content: T;
  constructor(content: T) {
    this.content = content;
  }
}
```

**Q16: TypeScript 的 utility types 有哪些？**

常用 Utility Types：
- Partial<T>：所有属性可选
- Required<T>：所有属性必需
- Readonly<T>：所有属性只读
- Pick<T, K>：选择部分属性
- Omit<T, K>：排除部分属性
- Record<K, T>：构造对象类型
- Exclude<T, U>：排除类型
- Extract<T, U>：提取类型

### 5.2 项目经验问题

#### 5.2.1 微前端迁移经验

**Q17: 你们是如何进行微前端迁移的？**

1. **前期评估**：
   - 分析现有应用架构和依赖关系
   - 评估业务边界，确定子应用拆分方案
   - 制定迁移计划，优先迁移独立业务

2. **技术选型**：
   - 选择 qiankun 作为微前端框架
   - 确定子应用技术栈和版本
   - 制定开发规范

3. **实施步骤**：
   - 主应用改造：集成 qiankun，配置路由
   - 子应用改造：导出生命周期函数，适配通信
   - 样式隔离：处理全局样式和组件样式冲突
   - 资源加载：优化子应用加载性能

4. **问题处理**：
   - 第三方依赖重复加载问题
   - 状态管理隔离问题
   - 跨域资源加载问题

5. **上线策略**：
   - 灰度发布，先切分少量流量
   - 监控异常，及时回滚

**Q18: 微前端迁移中遇到的最大挑战是什么？如何解决的？**

常见挑战和解决方案：

1. **样式冲突**
   - 解决：使用 CSS Module、SCSS Module，或开启 qiankun 的样式隔离

2. **状态管理混乱**
   - 解决：明确主应用和子应用的状态边界，使用独立的 Store

3. **加载性能**
   - 解决：预加载子应用、资源按需加载、CDN 优化

4. **开发体验**
   - 解决：配置开发模式的热更新，支持独立开发和联调

**Q19: 如何保证微前端的质量？**

1. **代码规范**：ESLint + Prettier + TypeScript
2. **自动化测试**：单元测试 + 集成测试 + E2E 测试
3. **CI/CD**：自动化构建、测试、部署
4. **监控告警**：性能监控、异常监控
5. **代码审查**：严格的 PR 审核流程

#### 5.2.2 性能优化经验

**Q20: 你做过哪些前端性能优化？**

1. **加载性能**：
   - 代码分割、Tree Shaking
   - 资源压缩（Gzip、Brotli）
   - CDN 加速
   - 预加载、预获取

2. **渲染性能**：
   - 虚拟列表
   - 减少重排重绘
   - 使用 CSS transform/opacity 动画
   - 节流防抖

3. **运行时性能**：
   - React.memo / useMemo / useCallback
   - 合理使用 key
   - 避免不必要的渲染

4. **网络优化**：
   - HTTP/2
   - 资源合并
   - 懒加载

**Q21: 如何定位前端性能问题？**

1. **使用 Chrome DevTools**：
   - Performance 面板：分析页面性能
   - Lighthouse：性能评分和改进建议
   - Network 面板：网络请求分析

2. **使用性能监控工具**：
   - Performance API
   - 埋点监控
   - 异常监控

3. **代码分析**：
   - 打包体积分析（webpack-bundle-analyzer）
   - 依赖分析

#### 5.2.3 团队协作经验

**Q22: 你如何进行代码评审？**

1. **评审前准备**：
   - 确保代码已经通过测试
   - 提供清晰的 PR 描述
   - 自检代码

2. **评审内容**：
   - 代码逻辑正确性
   - 代码规范和风格
   - 性能影响
   - 安全性
   - 可维护性

3. **评审反馈**：
   - 区分必须修改和建议修改
   - 提供具体的改进建议
   - 及时响应

**Q23: 你如何管理前端技术债？**

1. **识别技术债**：
   - 代码审查中发现的问题
   - 性能问题
   - 测试覆盖率

2. **管理策略**：
   - 记录技术债清单
   - 优先级排序
   - 定期偿还

3. **预防措施**：
   - 代码规范
   - 自动化测试
   - 代码审查

### 5.3 算法题

#### 5.3.1 数组与字符串算法

**Q24: 无重复字符的最长子串**

```javascript
/**
 * LeetCode 3. 无重复字符的最长子串
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // 使用滑动窗口 + Map
  const map = new Map();
  let maxLength = 0;
  let start = 0;

  for (let end = 0; end < s.length; end++) {
    // 如果当前字符已在窗口中，调整 start
    if (map.has(s[end]) && map.get(s[end]) >= start) {
      start = map.get(s[end]) + 1;
    }

    // 更新字符位置
    map.set(s[end], end);

    // 更新最大长度
    maxLength = Math.max(maxLength, end - start + 1);
  }

  return maxLength;
}

// 测试
console.log(lengthOfLongestSubstring('abcabcbb')); // 3
console.log(lengthOfLongestSubstring('bbbbb')); // 1
console.log(lengthOfLongestSubstring('pwwkew')); // 3

// 变体：返回最长子串
function lengthOfLongestSubstringWithString(s) {
  const map = new Map();
  let maxLength = 0;
  let start = 0;
  let resultStart = 0;

  for (let end = 0; end < s.length; end++) {
    if (map.has(s[end]) && map.get(s[end]) >= start) {
      start = map.get(s[end]) + 1;
    }

    map.set(s[end], end);

    if (end - start + 1 > maxLength) {
      maxLength = end - start + 1;
      resultStart = start;
    }
  }

  return {
    length: maxLength,
    substring: s.substring(resultStart, resultStart + maxLength)
  };
}
```

**Q25: 数组中出现次数超过一半的数字**

```javascript
/**
 * LeetCode 169. 多数元素
 * @param {number[]} nums
 * @return {number}
 */

// 方法一： Boyer-Moore 投票算法
function majorityElement(nums) {
  let count = 0;
  let candidate = null;

  for (const num of nums) {
    if (count === 0) {
      candidate = num;
    }
    count += (num === candidate) ? 1 : -1;
  }

  return candidate;
}

// 方法二：分治法
function majorityElementDivide(nums) {
  function mergeSort(left, right) {
    if (left === right) return nums[left];

    const mid = Math.floor((left + right) / 2);

    const leftMajor = mergeSort(left, mid);
    const rightMajor = mergeSort(mid + 1, right);

    if (leftMajor === rightMajor) return leftMajor;

    const leftCount = countInRange(nums, leftMajor, left, right);
    const rightCount = countInRange(nums, rightMajor, left, right);

    return leftCount > rightCount ? leftMajor : rightMajor;
  }

  function countInRange(num, val, left, right) {
    let count = 0;
    for (let i = left; i <= right; i++) {
      if (nums[i] === val) count++;
    }
    return count;
  }

  return mergeSort(0, nums.length - 1);
}

// 方法三：排序后取中位数
function majorityElementSort(nums) {
  nums.sort((a, b) => a - b);
  return nums[Math.floor(nums.length / 2)];
}

// 测试
console.log(majorityElement([3, 2, 3])); // 3
console.log(majorityElement([2, 2, 1, 1, 1, 2, 2])); // 2
```

**Q26: 螺旋矩阵**

```javascript
/**
 * LeetCode 54. 螺旋矩阵
 * @param {number[][]} matrix
 * @return {number[]}
 */
function spiralOrder(matrix) {
  if (!matrix || matrix.length === 0) return [];

  const result = [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    // 从左到右
    for (let i = left; i <= right; i++) {
      result.push(matrix[top][i]);
    }
    top++;

    // 从上到下
    for (let i = top; i <= bottom; i++) {
      result.push(matrix[i][right]);
    }
    right--;

    // 从右到左
    if (top <= bottom) {
      for (let i = right; i >= left; i--) {
        result.push(matrix[bottom][i]);
      }
      bottom--;
    }

    // 从下到上
    if (left <= right) {
      for (let i = bottom; i >= top; i--) {
        result.push(matrix[i][left]);
      }
      left++;
    }
  }

  return result;
}

// 测试
console.log(spiralOrder([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
])); // [1,2,3,6,9,8,7,4,5]

console.log(spiralOrder([
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12]
])); // [1,2,3,4,8,12,11,10,9,5,6,7]
```

#### 5.3.2 链表算法

**Q27: 两数相加**

```javascript
/**
 * LeetCode 2. 两数相加
 * Definition for singly-linked list.
 */
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
function addTwoNumbers(l1, l2) {
  const dummy = new ListNode(0);
  let current = dummy;
  let carry = 0;

  while (l1 || l2 || carry) {
    const sum = (l1?.val || 0) + (l2?.val || 0) + carry;
    carry = Math.floor(sum / 10);
    current.next = new ListNode(sum % 10);

    current = current.next;
    l1 = l1?.next;
    l2 = l2?.next;
  }

  return dummy.next;
}

// 辅助函数：数组转链表
function arrayToList(arr) {
  const dummy = new ListNode(0);
  let current = dummy;

  for (const val of arr) {
    current.next = new ListNode(val);
    current = current.next;
  }

  return dummy.next;
}

// 辅助函数：链表转数组
function listToArray(list) {
  const result = [];
  while (list) {
    result.push(list.val);
    list = list.next;
  }
  return result;
}

// 测试
const l1 = arrayToList([2, 4, 3]);
const l2 = arrayToList([5, 6, 4]);
console.log(listToArray(addTwoNumbers(l1, l1))); // [7, 0, 8]
```

**Q28: 反转链表**

```javascript
/**
 * LeetCode 206. 反转链表
 * @param {ListNode} head
 * @return {ListNode}
 */

// 方法一：迭代
function reverseList(head) {
  let prev = null;
  let current = head;

  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  return prev;
}

// 方法二：递归
function reverseListRecursive(head) {
  if (!head || !head.next) return head;

  const newHead = reverseListRecursive(head.next);
  head.next.next = head;
  head.next = null;

  return newHead;
}

// 方法三：双指针（更易理解）
function reverseListTwoPointers(head) {
  if (!head || !head.next) return head;

  let slow = head;
  let fast = head.next;
  slow.next = null;

  while (fast) {
    const next = fast.next;
    fast.next = slow;
    slow = fast;
    fast = next;
  }

  return slow;
}

// 测试
const list = arrayToList([1, 2, 3, 4, 5]);
const reversed = reverseList(list);
console.log(listToArray(reversed)); // [5, 4, 3, 2, 1]
```

**Q29: 环形链表检测**

```javascript
/**
 * LeetCode 141. 环形链表
 * @param {ListNode} head
 * @return {boolean}
 */

// 方法一：哈希表
function hasCycle(head) {
  const seen = new Set();

  while (head) {
    if (seen.has(head)) {
      return true;
    }
    seen.add(head);
    head = head.next;
  }

  return false;
}

// 方法二：快慢指针（Floyd 算法）
function hasCycleFloyd(head) {
  if (!head || !head.next) return false;

  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}

// 方法三：标记法（修改链表）
function hasCycleMark(head) {
  while (head) {
    if (head.val === 'visited') {
      return true;
    }
    head.val = 'visited';
    head = head.next;
  }

  return false;
}

// 找到环的入口点
function detectCycle(head) {
  if (!head || !head.next) return null;

  let slow = head;
  let fast = head;

  // 第一步：判断是否有环
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) break;
  }

  if (!fast || !fast.next) return null;

  // 第二步：找到环的入口
  slow = head;
  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next;
  }

  return slow;
}

// 测试
const listWithCycle = new ListNode(1);
listWithCycle.next = new ListNode(2);
listWithCycle.next.next = new ListNode(3);
listWithCycle.next.next.next = new ListNode(4);
listWithCycle.next.next.next.next = listWithCycle.next;

console.log(hasCycle(listWithCycle)); // true
console.log(detectCycle(listWithCycle).val); // 2
```

#### 5.3.3 树与图算法

**Q30: 二叉树的最大深度**

```javascript
/**
 * LeetCode 104. 二叉树的最大深度
 * Definition for a binary tree node.
 */
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// 方法一：递归（DFS）
function maxDepth(root) {
  if (!root) return 0;

  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  return Math.max(leftDepth, rightDepth) + 1;
}

// 方法二：迭代（层序遍历）
function maxDepthIterative(root) {
  if (!root) return 0;

  let depth = 0;
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;
    depth++;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return depth;
}

// 方法三：后序遍历（记录最大深度）
function maxDepthPostOrder(root) {
  let maxDepth = 0;

  function traverse(node, depth) {
    if (!node) {
      maxDepth = Math.max(maxDepth, depth);
      return;
    }

    traverse(node.left, depth + 1);
    traverse(node.right, depth + 1);
  }

  traverse(root, 0);
  return maxDepth;
}

// 测试
const tree = new TreeNode(1);
tree.left = new TreeNode(2);
tree.right = new TreeNode(3);
tree.left.left = new TreeNode(4);
tree.left.right = new TreeNode(5);

console.log(maxDepth(tree)); // 3
```

**Q31: 二叉树的层序遍历**

```javascript
/**
 * LeetCode 102. 二叉树的层序遍历
 * @param {TreeNode} root
 * @return {number[][]}
 */

// 方法一：基础层序遍历
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

// 方法二：记录层级的层序遍历
function levelOrderWithLevel(root) {
  if (!root) return [];

  const result = [];
  const queue = [{ node: root, level: 0 }];

  while (queue.length) {
    const { node, level } = queue.shift();

    if (!result[level]) {
      result[level] = [];
    }
    result[level].push(node.val);

    if (node.left) queue.push({ node: node.left, level: level + 1 });
    if (node.right) queue.push({ node: node.right, level: level + 1 });
  }

  return result;
}

// 方法三：锯齿形层序遍历（之字形）
function zigzagLevelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let isLeftToRight = true;

  while (queue.length) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      if (isLeftToRight) {
        currentLevel.push(node.val);
      } else {
        currentLevel.unshift(node.val);
      }

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
    isLeftToRight = !isLeftToRight;
  }

  return result;
}

// 测试
const tree = new TreeNode(1);
tree.left = new TreeNode(2);
tree.right = new TreeNode(3);
tree.left.left = new TreeNode(4);
tree.left.right = new TreeNode(5);

console.log(levelOrder(tree));
// [[1], [2, 3], [4, 5]]

console.log(zigzagLevelOrder(tree));
// [[1], [3, 2], [4, 5]]
```

**Q32: 验证二叉搜索树**

```javascript
/**
 * LeetCode 98. 验证二叉搜索树
 * @param {TreeNode} root
 * @return {boolean}
 */

// 方法一：中序遍历（ BST 中序遍历是有序的）
function isValidBST(root) {
  let prev = null;

  function inorder(node) {
    if (!node) return true;

    // 遍历左子树
    if (!inorder(node.left)) return false;

    // 检查当前节点
    if (prev !== null && node.val <= prev) {
      return false;
    }
    prev = node.val;

    // 遍历右子树
    return inorder(node.right);
  }

  return inorder(root);
}

// 方法二：递归（带上下界）
function isValidBSTRange(root) {
  function validate(node, min, max) {
    if (!node) return true;

    if (node.val <= min || node.val >= max) {
      return false;
    }

    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
  }

  return validate(root, -Infinity, Infinity);
}

// 方法三：迭代（中序遍历）
function isValidBSTIterative(root) {
  const stack = [];
  let prev = null;
  let current = root;

  while (current || stack.length) {
    while (current) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();

    if (prev !== null && current.val <= prev) {
      return false;
    }
    prev = current.val;

    current = current.right;
  }

  return true;
}

// 测试
const validBST = new TreeNode(2);
validBST.left = new TreeNode(1);
validBST.right = new TreeNode(3);

const invalidBST = new TreeNode(5);
invalidBST.left = new TreeNode(1);
invalidBST.right = new TreeNode(4);
invalidBST.right.left = new TreeNode(3);
invalidBST.right.right = new TreeNode(6);

console.log(isValidBST(validBST)); // true
console.log(isValidBST(invalidBST)); // false
```

#### 5.3.4 动态规划算法

**Q33: 最长公共子序列**

```javascript
/**
 * LeetCode 1143. 最长公共子序列
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */

// 方法一：二维动态规划
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;

  // dp[i][j] 表示 text1[0:i] 和 text2[0:j] 的最长公共子序列
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// 方法二：空间优化（一维数组）
function longestCommonSubsequenceOptimized(text1, text2) {
  const m = text1.length;
  const n = text2.length;

  // 确保 text1 是较短的字符串
  if (m < n) {
    [text1, text2] = [text2, text1];
    [m, n] = [n, m];
  }

  let dp = Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (text1[i - 1] === text2[j - 1]) {
        dp[j] = prev + 1;
      } else {
        dp[j] = Math.max(dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }

  return dp[n];
}

// 方法三：返回具体的子序列
function longestCommonSubsequenceWithString(text1, text2) {
  const m = text1.length;
  const n = text2.length;

  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯获取子序列
  let i = m, j = n;
  const result = [];

  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      result.unshift(text1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return {
    length: dp[m][n],
    sequence: result.join('')
  };
}

// 测试
console.log(longestCommonSubsequence('abcde', 'ace')); // 3
console.log(longestCommonSubsequence('abc', 'abc')); // 3
console.log(longestCommonSubsequence('abc', 'def')); // 0

console.log(longestCommonSubsequenceWithString('abcde', 'ace'));
// { length: 3, sequence: 'ace' }
```

**Q34: 零钱兑换**

```javascript
/**
 * LeetCode 322. 零钱兑换
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */

// 方法一：自顶向下（递归 + 记忆化）
function coinChangeTopDown(coins, amount) {
  const memo = new Map();

  function dp(remaining) {
    if (remaining === 0) return 0;
    if (remaining < 0) return -1;
    if (memo.has(remaining)) return memo.get(remaining);

    let minCount = Infinity;

    for (const coin of coins) {
      const count = dp(remaining - coin);
      if (count !== -1) {
        minCount = Math.min(minCount, count + 1);
      }
    }

    const result = minCount === Infinity ? -1 : minCount;
    memo.set(remaining, result);
    return result;
  }

  return dp(amount);
}

// 方法二：自底向上（动态规划）
function coinChangeBottomUp(coins, amount) {
  // dp[i] 表示凑成 i 需要的最小硬币数
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0 && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

// 方法三：完全背包（优化版）
function coinChangeOptimized(coins, amount) {
  // dp[i] 初始化为 amount + 1 表示不可达
  const dp = Array(amount + 1).fill(amount + 1);
  dp[0] = 0;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }

  return dp[amount] > amount ? -1 : dp[amount];
}

// 方法四：广度优先搜索
function coinChangeBFS(coins, amount) {
  if (amount === 0) return 0;

  const visited = new Set();
  const queue = [0];
  let level = 0;

  while (queue.length) {
    const size = queue.length;
    level++;

    for (let i = 0; i < size; i++) {
      const current = queue.shift();

      for (const coin of coins) {
        const next = current + coin;

        if (next === amount) return level;
        if (next < amount && !visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }

  return -1;
}

// 测试
console.log(coinChange([1, 2, 5], 11)); // 3 (11 = 5 + 5 + 1)
console.log(coinChange([2], 3)); // -1
console.log(coinChange([1], 0)); // 0
```

#### 5.3.5 排序与搜索算法

**Q35: 合并两个有序数组**

```javascript
/**
 * LeetCode 88. 合并两个有序数组
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 */
function merge(nums1, m, nums2, n) {
  // 从后往前遍历，避免元素移动
  let p1 = m - 1;
  let p2 = n - 1;
  let p = m + n - 1;

  while (p1 >= 0 && p2 >= 0) {
    if (nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      p1--;
    } else {
      nums1[p] = nums2[p2];
      p2--;
    }
    p--;
  }

  // 复制剩余的 nums2 元素
  while (p2 >= 0) {
    nums1[p] = nums2[p2];
    p2--;
    p--;
  }

  // 注意：nums1 中剩余的元素已经在正确位置
}

// 方法二：更易读的版本
function mergeReadable(nums1, m, nums2, n) {
  // 复制 nums1 的有效元素
  const left = nums1.slice(0, m);
  let i = 0, j = 0, k = 0;

  // 合并两个有序数组
  while (i < m && j < n) {
    if (left[i] <= nums2[j]) {
      nums1[k] = left[i];
      i++;
    } else {
      nums1[k] = nums2[j];
      j++;
    }
    k++;
  }

  // 复制剩余元素
  while (i < m) {
    nums1[k] = left[i];
    i++;
    k++;
  }

  while (j < n) {
    nums1[k] = nums2[j];
    j++;
    k++;
  }
}

// 测试
const nums1 = [1, 2, 3, 0, 0, 0];
merge(nums1, 3, [2, 5, 6], 3);
console.log(nums1); // [1, 2, 2, 3, 5, 6]
```

**Q36: 搜索旋转排序数组**

```javascript
/**
 * LeetCode 33. 搜索旋转排序数组
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */

// 方法一：二分查找
function search(nums, target) {
  if (!nums || nums.length === 0) return -1;

  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // 判断哪一半是有序的
    if (nums[left] <= nums[mid]) {
      // 左边是有序的
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // 右边是有序的
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}

// 方法二：更清晰的版本
function searchClear(nums, target) {
  if (nums.length === 0) return -1;

  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);

    if (nums[mid] >= nums[0]) {
      // 最小值在右半部分
      left = mid;
    } else {
      // 最小值在左半部分
      right = mid - 1;
    }
  }

  // 找到旋转点
  const rotatePoint = left + 1;

  // 确定搜索范围
  if (target >= nums[0]) {
    left = 0;
    right = rotatePoint - 1;
  } else {
    left = rotatePoint;
    right = nums.length - 1;
  }

  // 二分查找
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

// 方法三：暴力法（简单但效率低）
function searchBruteForce(nums, target) {
  return nums.indexOf(target);
}

// 测试
console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log(search([4, 5, 6, 7, 0, 1, 2], 3)); // -1
console.log(search([1], 0)); // -1
```

**Q37: 搜索插入位置**

```javascript
/**
 * LeetCode 35. 搜索插入位置
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */

// 方法一：标准二分查找
function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // left 就是插入位置
  return left;
}

// 方法二：使用 lower_bound 思想
function searchInsertLowerBound(nums, target) {
  let left = 0;
  let right = nums.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

// 方法三：更简洁的版本
function searchInsertSimple(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] >= target) {
      return i;
    }
  }
  return nums.length;
}

// 测试
console.log(searchInsert([1, 3, 5, 6], 5)); // 2
console.log(searchInsert([1, 3, 5, 6], 2)); // 1
console.log(searchInsert([1, 3, 5, 6], 7)); // 4
console.log(searchInsert([1, 3, 5, 6], 0)); // 0
```

---

## 六、代码示例与实战

### 6.1 qiankun微前端实战代码

#### 6.1.1 主应用完整配置

```javascript
// 主应用 - main.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Spin } from 'antd';
import { registerMicroApps, start, setDefaultMountApp } from 'qiankun';
import { initGlobalState } from 'qiankun';

// 导入页面组件
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// 全局样式
import './styles/global.css';

// 初始化全局状态
const initialState = {
  user: null,
  theme: 'light',
  language: 'zh-CN',
  permissions: []
};

const { onGlobalStateChange, setGlobalState, getGlobalState } = initGlobalState(initialState);

// 监听全局状态变化
onGlobalStateChange((state, prev) => {
  console.log('主应用: 全局状态变化', state, prev);

  // 处理状态变化
  if (state.theme !== prev.theme) {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
});

// 注册子应用
const microApps = [
  {
    name: 'vue-admin',
    entry: process.env.NODE_ENV === 'production'
      ? '//micro.example.com/vue-admin'
      : '//localhost:8081',
    container: '#micro-container',
    activeRule: '/vue-admin',
    props: {
      basename: '/vue-admin',
      routerBase: '/vue-admin',
      onGlobalStateChange,
      setGlobalState,
      getGlobalState
    },
    loader: (loading) => {
      // 自定义 loading 效果
      console.log('子应用加载状态:', loading);
    }
  },
  {
    name: 'react-admin',
    entry: process.env.NODE_ENV === 'production'
      ? '//micro.example.com/react-admin'
      : '//localhost:8082',
    container: '#micro-container',
    activeRule: '/react-admin',
    props: {
      basename: '/react-admin',
      routerBase: '/react-admin',
      onGlobalStateChange,
      setGlobalState,
      getGlobalState
    }
  },
  {
    name: 'static-app',
    entry: process.env.NODE_ENV === 'production'
      ? '//micro.example.com/static-app'
      : '//localhost:8083',
    container: '#micro-container',
    activeRule: '/static-app'
  }
];

// 注册微应用
registerMicroApps(microApps, {
  beforeLoad: (app) => {
    console.log('before load:', app.name);
    return Promise.resolve();
  },
  beforeMount: (app) => {
    console.log('before mount:', app.name);
    return Promise.resolve();
  },
  afterMount: (app) => {
    console.log('after mount:', app.name);
    return Promise.resolve();
  },
  beforeUnmount: (app) => {
    console.log('before unmount:', app.name);
    return Promise.resolve();
  },
  afterUnmount: (app) => {
    console.log('after unmount:', app.name);
    return Promise.resolve();
  },
  loadError: (app, err) => {
    console.error('子应用加载失败:', app.name, err);
  }
});

// 启动 qiankun
start({
  // 开启沙箱，默认为 true
  sandbox: true,
  // 开启严格样式隔离
  strictStyleIsolation: true,
  // 开启实验性样式隔离（CSS 前缀）
  experimentalStyleIsolation: false,
  // 自定义 fetch
  fetch: (url) => {
    return fetch(url).then(response => {
      return response;
    });
  },
  // 自定义 HTML 处理
  getTemplate: (tpl) => {
    return tpl;
  },
  // 自动清理资源
  autoCleanResource: true,
  // 预加载
  prefetch: 'all', // true | false | 'all' | ['vue-admin', 'react-admin']
  // 超时时间
  timeout: 30000,
  // 最大缓存数量
  maxCacheNum: 10
});

// 设置默认加载的子应用
setDefaultMountApp('/vue-admin');

// 主应用根组件
function App() {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // 监听 qiankun 内部事件
    const handleMicroLoad = () => setLoading(true);
    const handleMicroFinish = () => setLoading(false);

    window.addEventListener('qiankun:load', handleMicroLoad);
    window.addEventListener('qiankun:finish', handleMicroFinish);

    return () => {
      window.removeEventListener('qiankun:load', handleMicroLoad);
      window.removeEventListener('qiankun:finish', handleMicroFinish);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* 顶部导航 */}
        <header className="app-header">
          <div className="logo">蚂蚁微前端</div>
          <nav className="nav">
            <a href="/">首页</a>
            <a href="/dashboard">仪表盘</a>
            <a href="/vue-admin">Vue 管理台</a>
            <a href="/react-admin">React 管理台</a>
            <a href="/static-app">静态应用</a>
          </nav>
          <div className="user-info">
            <button
              onClick={() => {
                setGlobalState({
                  user: { name: '张三', id: 1 }
                });
              }}
            >
              模拟登录
            </button>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="app-main">
          <Spin spinning={loading}>
            <Switch>
              <Route path="/" exact component={Home} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/micro-container" />
              <Route component={NotFound} />
            </Switch>
          </Spin>
        </main>
      </div>
    </BrowserRouter>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

#### 6.1.2 子应用配置（Vue）

```javascript
// Vue 子应用 - main.js
import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import routes from './routes';
import store from './store';

// 导入全局样式
import './styles/main.css';

// 导入 qiankun 生命周期函数
import { render, h } from 'vue';

/**
 * 导出 qiankun 生命周期函数
 */

// 子应用初始化
export async function bootstrap() {
  console.log('[vue-admin] bootstrap');
}

// 子应用挂载
export async function mount(props) {
  console.log('[vue-admin] mount', props);

  const { container, onGlobalStateChange, setGlobalState, getGlobalState, routerBase } = props;

  // 创建 Vue 实例
  const app = new Vue({
    router: new VueRouter({
      mode: 'history',
      base: routerBase || window.__POWERED_BY_QIANKUN__ ? '/vue-admin' : '/',
      routes
    }),
    store,
    render: (renderProps) => h(App, renderProps)
  });

  // 将应用挂载到指定容器
  app.$mount(container ? container.querySelector('#app') : '#app');

  // 挂载完成后，可以进行一些操作
  // 如通知主应用子应用已挂载
  if (setGlobalState) {
    setGlobalState({
      subAppReady: true,
      subAppName: 'vue-admin'
    });
  }

  return app;
}

// 子应用卸载
export async function unmount(props) {
  console.log('[vue-admin] unmount', props);

  const { container } = props;

  // 清理工作
  if (this._instance) {
    this._instance.$destroy();
    this._instance.$el.innerHTML = '';
    this._instance = null;
  }

  // 清理全局状态监听
  // 如果有使用 onGlobalStateChange，需要在 unmount 时移除监听
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  // 开发环境独立运行
  render(h(App), '#app');
}
```

#### 6.1.3 子应用配置（React）

```javascript
// React 子应用 - index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from './App';
import './styles/index.css';

/**
 * 导出 qiankun 生命周期函数
 */

// 保存应用实例
let root;

/**
 * 子应用初始化
 * @param {Object} props 主应用传递的属性
 */
export async function bootstrap(props) {
  console.log('[react-admin] bootstrap', props);
}

/**
 * 子应用挂载
 * @param {Object} props 主应用传递的属性
 */
export async function mount(props) {
  console.log('[react-admin] mount', props);

  const {
    container,
    onGlobalStateChange,
    setGlobalState,
    getGlobalState,
    routerBase,
    basename
  } = props;

  // 创建根容器
  const rootContainer = container
    ? container.querySelector('#root')
    : document.getElementById('root');

  // 创建应用
  const AppWrapper = () => {
    const [state, setState] = React.useState({});

    React.useEffect(() => {
      // 监听全局状态变化
      if (onGlobalStateChange) {
        const unsubscribe = onGlobalStateChange((newState, prev) => {
          console.log('[react-admin] 状态变化', newState, prev);
          setState(newState);
        });

        return () => {
          unsubscribe();
        };
      }
    }, []);

    return (
      <BrowserRouter basename={basename || '/react-admin'}>
        <App
          {...props}
          globalState={state}
          setGlobalState={setGlobalState}
        />
      </BrowserRouter>
    );
  };

  // 渲染应用
  root = ReactDOM.createRoot(rootContainer);
  root.render(<AppWrapper />);

  // 通知主应用
  if (setGlobalState) {
    setGlobalState({
      subAppReady: true,
      subAppName: 'react-admin'
    });
  }
}

/**
 * 子应用卸载
 * @param {Object} props
 */
export async function unmount(props) {
  console.log('[react-admin] unmount', props);

  if (root) {
    root.unmount();
    root = null;
  }
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  const rootContainer = document.getElementById('root');
  ReactDOM.createRoot(rootContainer).render(
    <BrowserRouter basename="/react-admin">
      <App />
    </BrowserRouter>
  );
}
```

### 6.2 沙箱隔离实现

#### 6.2.1 完整沙箱实现

```javascript
// 完整沙箱实现 - Sandbox.js

/**
 * 沙箱基类
 */
class BaseSandbox {
  constructor(name) {
    this.name = name;
    this.active = false;
  }

  active() {
    throw new Error('子类必须实现 active 方法');
  }

  inactive() {
    throw new Error('子类必须实现 inactive 方法');
  }
}

/**
 * 快照沙箱
 * 适用于不支持 Proxy 的浏览器（IE11）
 */
class SnapshotSandbox extends BaseSandbox {
  constructor(name) {
    super(name);
    this.name = name;
    this.snapshot = {}; // window 快照
    this.modifyMap = new Map(); // 修改记录
  }

  active() {
    console.log(`[${this.name}] 快照沙箱激活`);
    // 记录当前 window 状态
    this.snapshot = this.recorderWindowState();
    this.active = true;
  }

  inactive() {
    console.log(`[${this.name}] 快照沙箱卸载`);
    // 记录修改
    this.modifyMap = this.recorderWindowDiff();
    // 恢复 window
    this.recoverWindowState();
    this.active = false;
  }

  recorderWindowState() {
    const snapshot = {};
    try {
      for (const key in window) {
        try {
          snapshot[key] = window[key];
        } catch (e) {
          // 忽略访问受限的属性
        }
      }
    } catch (e) {
      console.error('记录 window 状态失败', e);
    }
    return snapshot;
  }

  recorderWindowDiff() {
    const diff = {};
    try {
      for (const key in window) {
        try {
          if (window[key] !== this.snapshot[key]) {
            diff[key] = window[key];
          }
        } catch (e) {
          // 忽略访问受限的属性
        }
      }
    } catch (e) {
      console.error('记录 window 差异失败', e);
    }
    return diff;
  }

  recoverWindowState() {
    try {
      // 遍历当前 window，删除不在快照中的属性
      const currentKeys = Object.keys(window);
      const snapshotKeys = Object.keys(this.snapshot);

      for (const key of currentKeys) {
        if (!snapshotKeys.includes(key)) {
          try {
            delete window[key];
          } catch (e) {
            // 某些属性无法删除
          }
        }
      }

      // 恢复快照中的属性
      for (const key in this.snapshot) {
        try {
          window[key] = this.snapshot[key];
        } catch (e) {
          // 某些属性无法恢复
        }
      }
    } catch (e) {
      console.error('恢复 window 状态失败', e);
    }
  }
}

/**
 * 代理沙箱
 * 使用 Proxy 实现真正的变量隔离
 */
class ProxySandbox extends BaseSandbox {
  constructor(name) {
    super(name);
    this.name = name;
    this.proxy = null;
    this.sandboxStorage = new Map(); // 沙箱存储
    this.addedProperties = new Set(); // 新增属性
    this.modifiedProperties = new Map(); // 修改的属性（原始值）
    this.isRunning = false;
  }

  init() {
    // 创建 Proxy 代理
    this.proxy = new Proxy(window, {
      // 获取属性
      get: (target, prop) => {
        if (this.isRunning) {
          // 优先从沙箱存储获取
          if (this.sandboxStorage.has(prop)) {
            return this.sandboxStorage.get(prop);
          }
        }
        // 获取 window 上的属性
        return target[prop];
      },

      // 设置属性
      set: (target, prop, value) => {
        if (!this.isRunning) {
          return true;
        }

        // 记录原始值（仅记录一次）
        if (!this.modifiedProperties.has(prop) && target[prop] !== undefined) {
          this.modifiedProperties.set(prop, target[prop]);
        }

        // 设置到沙箱存储
        this.sandboxStorage.set(prop, value);
        this.addedProperties.add(prop);

        return true;
      },

      // has 操作
      has: (target, prop) => {
        return this.sandboxStorage.has(prop) || prop in target;
      },

      // 删除操作
      deleteProperty: (target, prop) => {
        if (this.sandboxStorage.has(prop)) {
          this.sandboxStorage.delete(prop);
          return true;
        }
        return false;
      },

      // 获取自有属性键
      ownKeys: (target) => {
        const sandboxKeys = Array.from(this.sandboxStorage.keys());
        const windowKeys = Object.keys(target);
        return [...new Set([...sandboxKeys, ...windowKeys])];
      },

      // 获取属性描述符
      getOwnPropertyDescriptor: (target, prop) => {
        if (this.sandboxStorage.has(prop)) {
          return {
            configurable: true,
            enumerable: true,
            value: this.sandboxStorage.get(prop)
          };
        }
        if (prop in target) {
          return {
            configurable: true,
            enumerable: true,
            value: target[prop]
          };
        }
        return undefined;
      }
    });

    return this.proxy;
  }

  active() {
    console.log(`[${this.name}] 代理沙箱激活`);
    this.isRunning = true;
    this.active = true;
  }

  inactive() {
    console.log(`[${this.name}] 代理沙箱卸载`);
    this.isRunning = false;
    this.active = false;

    // 清理沙箱存储
    this.sandboxStorage.clear();
    this.addedProperties.clear();
    this.modifiedProperties.clear();
  }
}

/**
 * legacy 沙箱（qiankun 使用的方式）
 */
class LegacySandbox extends BaseSandbox {
  constructor(name) {
    super(name);
    this.name = name;
    this.sandboxStorage = {};
    this.type = 'legacy';
    this.isActive = false;
    this.initialized = false;

    // 沙箱期间的全局变量
    this.injectedGlobals = new Set();

    this.init();
  }

  init() {
    const { sandboxStorage, injectedGlobals } = this;

    // 创建沙箱代理对象
    const proxy = new Proxy(
      () => {},
      {
        // 函数调用
        apply: (target, context, args) => {
          // 处理函数调用
        },

        // 获取属性
        get: (target, prop) => {
          if (sandboxStorage.hasOwnProperty(prop)) {
            return sandboxStorage[prop];
          }
          return window[prop];
        },

        // 设置属性
        set: (target, prop, value) => {
          if (this.isActive) {
            sandboxStorage[prop] = value;
            injectedGlobals.add(prop);
          }
          return true;
        },

        // 删除属性
        deleteProperty: (target, prop) => {
          if (this.isActive) {
            delete sandboxStorage[prop];
            injectedGlobals.delete(prop);
          }
          return true;
        },

        // has 操作
        has: (target, prop) => {
          return prop in sandboxStorage || prop in window;
        }
      }
    );

    this.proxy = proxy;
    return this.proxy;
  }

  active() {
    console.log(`[${this.name}] Legacy 沙箱激活`);
    this.isActive = true;
    this.initialized = true;
  }

  inactive() {
    console.log(`[${this.name}] Legacy 沙箱卸载`);
    this.isActive = false;

    // 清理沙箱存储
    // 注意：这里只清理沙箱期间新增的全局变量
    // 不清理修改过的全局变量
    for (const prop of injectedGlobals) {
      delete sandboxStorage[prop];
    }

    injectedGlobals.clear();
  }
}

// 沙箱管理器
class SandboxManager {
  constructor() {
    this.sandboxes = new Map();
    this.currentSandbox = null;
  }

  // 创建沙箱
  createSandbox(name, type = 'proxy') {
    let sandbox;

    switch (type) {
      case 'snapshot':
        sandbox = new SnapshotSandbox(name);
        break;
      case 'proxy':
        sandbox = new ProxySandbox(name);
        sandbox.init();
        break;
      case 'legacy':
        sandbox = new LegacySandbox(name);
        break;
      default:
        throw new Error(`未知的沙箱类型: ${type}`);
    }

    this.sandboxes.set(name, sandbox);
    return sandbox;
  }

  // 激活沙箱
  activeSandbox(name) {
    const sandbox = this.sandboxes.get(name);
    if (sandbox) {
      if (this.currentSandbox) {
        this.currentSandbox.inactive();
      }
      sandbox.active();
      this.currentSandbox = sandbox;
    }
    return sandbox?.proxy;
  }

  // 卸载沙箱
  inactiveSandbox(name) {
    const sandbox = this.sandboxes.get(name);
    if (sandbox) {
      sandbox.inactive();
      if (this.currentSandbox === sandbox) {
        this.currentSandbox = null;
      }
    }
  }

  // 清理所有沙箱
  clearAll() {
    for (const sandbox of this.sandboxes.values()) {
      sandbox.inactive();
    }
    this.sandboxes.clear();
    this.currentSandbox = null;
  }
}

// 导出
export {
  BaseSandbox,
  SnapshotSandbox,
  ProxySandbox,
  LegacySandbox,
  SandboxManager
};
```

### 6.3 状态管理与通信

#### 6.3.1 主应用状态管理

```javascript
// 状态管理 - store.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 应用状态 Store
const useAppStore = create(
  devtools(
    (set, get) => ({
      // ==================== 用户相关状态 ====================
      user: null,
      token: null,
      isAuthenticated: false,

      // 设置用户
      setUser: (user) => {
        set(
          {
            user,
            isAuthenticated: !!user,
            token: user?.token || get().token
          },
          false,
          'setUser'
        );
      },

      // 登录
      login: async (credentials) => {
        // 模拟 API 调用
        const response = await mockLogin(credentials);

        set(
          {
            user: response.user,
            token: response.token,
            isAuthenticated: true
          },
          false,
          'login'
        );

        return response;
      },

      // 登出
      logout: () => {
        set(
          {
            user: null,
            token: null,
            isAuthenticated: false
          },
          false,
          'logout'
        );
      },

      // ==================== 应用配置 ====================
      theme: 'light',
      language: 'zh-CN',
      collapsed: false,

      // 设置主题
      setTheme: (theme) => {
        set({ theme }, false, 'setTheme');
        document.documentElement.setAttribute('data-theme', theme);
      },

      // 设置语言
      setLanguage: (language) => {
        set({ language }, false, 'setLanguage');
      },

      // 切换侧边栏
      toggleCollapsed: () => {
        set((state) => ({ collapsed: !state.collapsed }), false, 'toggleCollapsed');
      },

      // ==================== 子应用状态 ====================
      subApps: [],
      activeSubApp: null,

      // 注册子应用
      registerSubApp: (subApp) => {
        set(
          (state) => ({
            subApps: [...state.subApps, subApp]
          }),
          false,
          'registerSubApp'
        );
      },

      // 设置活跃子应用
      setActiveSubApp: (name) => {
        set({ activeSubApp: name }, false, 'setActiveSubApp');
      },

      // ==================== 权限相关 ====================
      permissions: [],
      roles: [],

      // 设置权限
      setPermissions: (permissions) => {
        set({ permissions }, false, 'setPermissions');
      },

      // 检查权限
      hasPermission: (permission) => {
        return get().permissions.includes(permission);
      },

      // 检查是否有任意权限
      hasAnyPermission: (permissions) => {
        return permissions.some((p) => get().permissions.includes(p));
      },

      // ==================== UI 状态 ====================
      loading: false,
      error: null,

      // 设置加载状态
      setLoading: (loading) => {
        set({ loading }, false, 'setLoading');
      },

      // 设置错误
      setError: (error) => {
        set({ error }, false, 'setError');
      },

      // 清除错误
      clearError: () => {
        set({ error: null }, false, 'clearError');
      }
    }),
    { name: 'AppStore' }
  )
);

// 模拟登录函数
async function mockLogin(credentials) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          id: 1,
          name: credentials.username,
          email: `${credentials.username}@example.com`,
          avatar: 'https://via.placeholder.com/40',
          role: 'admin'
        },
        token: 'mock-token-' + Date.now(),
        permissions: ['read', 'write', 'delete', 'admin']
      });
    }, 500);
  });
}

export default useAppStore;
```

#### 6.3.2 跨子应用通信

```javascript
// 跨子应用通信 - bus.js

/**
 * 事件总线
 * 用于子应用之间的通信
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  // 监听事件
  on(event, callback, context) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push({ callback, context });
    return () => this.off(event, callback, context);
  }

  // 监听一次
  once(event, callback, context) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    this.onceEvents.get(event).push({ callback, context });
    return () => this.off(event, callback, context);
  }

  // 触发事件
  emit(event, ...args) {
    // 先执行 once 回调
    if (this.onceEvents.has(event)) {
      const onceCallbacks = this.onceEvents.get(event);
      onceCallbacks.forEach(({ callback, context }) => {
        callback.apply(context, args);
      });
      this.onceEvents.delete(event);
    }

    // 执行普通回调
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      callbacks.forEach(({ callback, context }) => {
        callback.apply(context, args);
      });
    }
  }

  // 移除事件监听
  off(event, callback, context) {
    if (!event) {
      // 移除所有事件
      this.events.clear();
      this.onceEvents.clear();
      return;
    }

    if (!callback) {
      // 移除事件的所有监听
      this.events.delete(event);
      this.onceEvents.delete(event);
      return;
    }

    // 移除指定的监听
    if (this.events.has(event)) {
      const callbacks = this.events.get(event).filter(
        (cb) => cb.callback !== callback || cb.context !== context
      );
      if (callbacks.length) {
        this.events.set(event, callbacks);
      } else {
        this.events.delete(event);
      }
    }

    // 同时清理 once
    if (this.onceEvents.has(event)) {
      const onceCallbacks = this.onceEvents.get(event).filter(
        (cb) => cb.callback !== callback || cb.context !== context
      );
      if (onceCallbacks.length) {
        this.onceEvents.set(event, onceCallbacks);
      } else {
        this.onceEvents.delete(event);
      }
    }
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

// 导出
export { eventBus, EventBus };

// 使用示例
/**
 * // 子应用 A
 * import { eventBus } from '主应用/eventBus';
 *
 * // 发送事件
 * eventBus.emit('user:login', { userId: 1, name: '张三' });
 *
 * // 监听事件
 * const unsubscribe = eventBus.on('user:login', (data) => {
 *   console.log('用户登录:', data);
 * });
 *
 * // 移除监听
 * unsubscribe();
 *
 * // 子应用 B
 * import { eventBus } from '主应用/eventBus';
 *
 * // 监听一次
 * eventBus.once('order:created', (order) => {
 *   console.log('新订单:', order);
 * });
 */
```

### 6.4 金融级安全实战

#### 6.4.1 完整的安全组件

```javascript
// 金融安全组件 - FinancialSecurity.js

/**
 * 金融级前端安全组件
 */

// 1. 安全存储
class SecureStorage {
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || this.generateKey();
    this.storageType = options.storageType || 'session'; // session | local
    this.prefix = options.prefix || 'fin_';
  }

  generateKey() {
    // 生成随机密钥
    return btoa(Date.now().toString() + Math.random().toString());
  }

  get storage() {
    return this.storageType === 'session' ? sessionStorage : localStorage;
  }

  // 加密数据
  encrypt(data) {
    const jsonStr = JSON.stringify(data);
    // 简化实现，实际应使用 crypto-js 或 webcrypto
    return btoa(encodeURIComponent(jsonStr));
  }

  // 解密数据
  decrypt(encrypted) {
    try {
      const jsonStr = decodeURIComponent(atob(encrypted));
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('解密失败', e);
      return null;
    }
  }

  // 安全存储
  set(key, value) {
    const encrypted = this.encrypt(value);
    const prefixedKey = this.prefix + key;
    this.storage.setItem(prefixedKey, encrypted);
  }

  // 安全读取
  get(key) {
    const prefixedKey = this.prefix + key;
    const encrypted = this.storage.getItem(prefixedKey);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  // 删除
  remove(key) {
    const prefixedKey = this.prefix + key;
    this.storage.removeItem(prefixedKey);
  }

  // 清空
  clear() {
    const keys = Object.keys(this.storage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }

  // 获取所有安全存储的键
  keys() {
    const keys = Object.keys(this.storage);
    return keys
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.replace(this.prefix, ''));
  }
}

// 2. 交易密码验证器
class TransactionPasswordValidator {
  constructor() {
    this.maxAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30分钟
    this.attempts = new Map();
    this.lockoutUntil = new Map();
  }

  // 验证交易密码
  verify(password, hashedPassword) {
    const key = 'transaction';
    const now = Date.now();

    // 检查是否锁定
    if (this.lockoutUntil.has(key)) {
      const lockout = this.lockoutUntil.get(key);
      if (now < lockout) {
        const remaining = Math.ceil((lockout - now) / 1000 / 60);
        return {
          success: false,
          locked: true,
          message: `交易密码已锁定，请${remaining}分钟后再试`
        };
      } else {
        // 解除锁定
        this.lockoutUntil.delete(key);
        this.attempts.delete(key);
      }
    }

    const attempts = this.attempts.get(key) || 0;

    // 验证密码
    const inputHash = this.hashPassword(password);
    const success = inputHash === hashedPassword;

    if (success) {
      // 验证成功，重置计数
      this.attempts.delete(key);
      return { success: true, message: '验证成功' };
    } else {
      // 验证失败
      const newAttempts = attempts + 1;
      this.attempts.set(key, newAttempts);

      if (newAttempts >= this.maxAttempts) {
        // 锁定账户
        this.lockoutUntil.set(key, now + this.lockoutDuration);
        return {
          success: false,
          locked: true,
          message: '交易密码错误次数过多，请30分钟后再试'
        };
      }

      const remaining = this.maxAttempts - newAttempts;
      return {
        success: false,
        locked: false,
        message: `交易密码错误，剩余${remaining}次尝试机会`
      };
    }
  }

  // 哈希密码（实际使用 crypto-js）
  hashPassword(password) {
    // SHA-256 简化实现
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // 重置验证器
  reset() {
    this.attempts.clear();
    this.lockoutUntil.clear();
  }
}

// 3. 敏感数据脱敏器
class DataMasker {
  // 脱敏手机号
  static maskPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // 脱敏身份证号
  static maskIdCard(idCard) {
    if (!idCard) return '';
    return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
  }

  // 脱敏银行卡号
  static maskBankCard(cardNumber) {
    if (!cardNumber) return '';
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  }

  // 脱敏邮箱
  static maskEmail(email) {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    return `${username.charAt(0)}***${username.charAt(username.length - 1)}@${domain}`;
  }

  // 脱敏姓名
  static maskName(name) {
    if (!name) return '';
    if (name.length <= 1) return name;
    if (name.length === 2) return name.charAt(0) + '*';
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
  }

  // 脱敏地址
  static maskAddress(address) {
    if (!address) return '';
    if (address.length <= 6) return address;
    return address.substring(0, 3) + '*'.repeat(address.length - 6) + address.substring(address.length - 3);
  }

  // 批量脱敏对象
  static maskObject(obj, fields) {
    if (!obj || !fields) return obj;

    const masked = { ...obj };

    for (const [field, type] of Object.entries(fields)) {
      if (!(field in masked)) continue;

      switch (type) {
        case 'phone':
          masked[field] = this.maskPhone(masked[field]);
          break;
        case 'idCard':
          masked[field] = this.maskIdCard(masked[field]);
          break;
        case 'bankCard':
          masked[field] = this.maskBankCard(masked[field]);
          break;
        case 'email':
          masked[field] = this.maskEmail(masked[field]);
          break;
        case 'name':
          masked[field] = this.maskName(masked[field]);
          break;
        case 'address':
          masked[field] = this.maskAddress(masked[field]);
          break;
        default:
          break;
      }
    }

    return masked;
  }
}

// 4. 金融表单验证器
class FinancialValidator {
  // 验证金额
  static validateAmount(value, options = {}) {
    const { min = 0.01, max = 999999999, precision = 2, required = true } = options;

    if (required && (value === null || value === undefined || value === '')) {
      return { valid: false, message: '请输入金额' };
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '请输入有效金额' };
    }

    if (num < min) {
      return { valid: false, message: `金额不能低于${min}元` };
    }

    if (num > max) {
      return { valid: false, message: `金额不能超过${max}元` };
    }

    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > precision) {
      return { valid: false, message: `金额最多保留${precision}位小数` };
    }

    return { valid: true, message: '' };
  }

  // 验证银行卡号（Luhn 算法）
  static validateBankCard(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(cleaned)) {
      return { valid: false, message: '银行卡号格式不正确' };
    }

    // Luhn 验证
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return {
      valid: sum % 10 === 0,
      message: sum % 10 === 0 ? '' : '银行卡号无效'
    };
  }

  // 验证身份证号
  static validateIdCard(idCard) {
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

    if (!reg.test(idCard)) {
      return { valid: false, message: '身份证号格式不正确' };
    }

    // 验证校验位
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i], 10) * weights[i];
    }

    const checkCode = checkCodes[sum % 11];
    const isValid = checkCode === idCard[17].toUpperCase();

    return {
      valid: isValid,
      message: isValid ? '' : '身份证号校验失败'
    };
  }

  // 验证密码强度
  static validatePassword(password) {
    const result = {
      valid: true,
      score: 0,
      level: 'weak',
      message: '',
      suggestions: []
    };

    if (password.length < 8) {
      result.valid = false;
      result.level = 'weak';
      result.message = '密码长度至少8位';
      result.suggestions.push('增加密码长度至8位以上');
      return result;
    }

    // 评分
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (/[a-z]/.test(password)) result.score += 1;
    if (/[A-Z]/.test(password)) result.score += 1;
    if (/[0-9]/.test(password)) result.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 1;

    // 评级
    if (result.score <= 2) {
      result.level = 'weak';
      result.valid = false;
      result.message = '密码强度较弱';
    } else if (result.score <= 4) {
      result.level = 'medium';
      result.valid = true;
      result.message = '密码强度中等';
    } else {
      result.level = 'strong';
      result.valid = true;
      result.message = '密码强度强';
    }

    // 建议
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      result.suggestions.push('添加大小写字母');
    }
    if (!/[0-9]/.test(password)) {
      result.suggestions.push('添加数字');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      result.suggestions.push('添加特殊字符');
    }

    return result;
  }
}

// 导出
export {
  SecureStorage,
  TransactionPasswordValidator,
  DataMasker,
  FinancialValidator
};
```

---

## 总结

本文档详细介绍了蚂蚁集团前端面试的各个方面，包括：

1. **微前端 qiankun**：沙箱实现（ProxySandbox vs SnapshotSandbox）、路由管理、父子通信、样式隔离
2. **中后台基建**：Ant Design 组件封装、受控与非受控模式、状态管理方案
3. **金融级前端**：安全存储、交易验证、数据脱敏、表单验证
4. **安全与合规**：隐私保护、审计日志、数据生命周期管理
5. **面试高频问题**：技术问题、项目经验、算法题
6. **丰富的代码示例**：包含完整的主应用配置、子应用配置、沙箱实现、状态管理、安全组件等

这些内容覆盖了蚂蚁集团前端开发的核心技术栈和面试重点，希望对您的面试准备有所帮助。

---

## 附录：常用链接

- [qiankun 官方文档](https://qiankun.umijs.org/)
- [Ant Design 官方文档](https://ant.design/)
- [React 官方文档](https://react.dev/)
- [Vue 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

---

*本文档持续更新中...*
