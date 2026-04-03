# React 19 组件设计模式深度指南

## 1. 概述：从函数组件到现代设计模式

在 React 19 时代，组件设计已经从简单的 UI 渲染演变为**可组合、可复用、可测试的业务逻辑单元**。本指南深入解析 2026 年主流的组件设计模式，涵盖 Compound Pattern、Headless Component、Render Props、Custom Hook 等模式的底层原理与实战应用。

### 1.1 组件设计的三个维度

| 维度 | 说明 | 2026 年最佳实践 |
|------|------|----------------|
| **职责分离** | 组件只负责单一功能 | 使用 Compound Pattern 分离关注点 |
| **逻辑复用** | 避免重复代码 | 使用 Custom Hook 抽取业务逻辑 |
| **样式解耦** | 组件与样式独立 | 使用 Headless Component + Tailwind CSS |

### 1.2 React 19 新特性对设计模式的影响

- **Server Components**：默认组件在服务端渲染，减少客户端 JS 体积
- **Automatic Batching**：自动批处理状态更新，提升性能
- **use** Hook：简化异步数据获取
- **Compiler**：AST 级别优化，自动进行代码分割

---

## 2. Compound Pattern（组合模式）

### 2.1 模式原理

Compound Pattern 通过 Context 将多个子组件组合成一个完整的 UI 单元，每个子组件只负责自己的职责，通过 Context 共享状态。

**核心优势**：
- 良好的语义化结构
- 灵活的组合方式
- 易于测试和维护

### 2.2 基础实现

```typescript
// components/Tabs/Tabs.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 创建 Context
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Tabs 容器组件
interface TabsProps {
  defaultValue?: string;
  children: ReactNode;
}

export function Tabs({ defaultValue = 'tab1', children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext.Provider>
  );
}

// TabList 组件
interface TabListProps {
  children: ReactNode;
}

export function TabList({ children }: TabListProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}

// TabItem 组件
interface TabItemProps {
  value: string;
  children: ReactNode;
}

export function TabItem({ value, children }: TabItemProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabItem 必须在 Tabs 内使用');
  }

  const isActive = context.activeTab === value;

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

// TabContent 组件
interface TabContentProps {
  value: string;
  children: ReactNode;
}

export function TabContent({ value, children }: TabContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabContent 必须在 Tabs 内使用');
  }

  if (context.activeTab !== value) {
    return null;
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
      {children}
    </div>
  );
}

// 使用示例
function App() {
  return (
    <Tabs defaultValue="profile">
      <TabList>
        <TabItem value="profile">个人资料</TabItem>
        <TabItem value="settings">设置</TabItem>
        <TabItem value="security">安全</TabItem>
      </TabList>
      <TabContent value="profile">
        <h3>个人资料</h3>
        <p>这里是个人资料内容</p>
      </TabContent>
      <TabContent value="settings">
        <h3>设置</h3>
        <p>这里是设置内容</p>
      </TabContent>
      <TabContent value="security">
        <h3>安全</h3>
        <p>这里是安全设置内容</p>
      </TabContent>
    </Tabs>
  );
}
```

### 2.3 进阶：支持键盘导航

```typescript
// components/Tabs/Tabs.tsx - 增强版
import { useEffect, useCallback } from 'react';

export function Tabs({ defaultValue = 'tab1', children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tabs = tabRefs.current.filter(Boolean) as HTMLButtonElement[];
    const currentIndex = tabs.findIndex(
      (tab) => tab.getAttribute('data-value') === activeTab
    );

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        setActiveTab(tabs[prevIndex].getAttribute('data-value')!);
        tabs[prevIndex].focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        setActiveTab(tabs[nextIndex].getAttribute('data-value')!);
        tabs[nextIndex].focus();
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext.Provider>
  );
}

// TabItem - 增强版
export function TabItem({ value, children }: TabItemProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabItem 必须在 Tabs 内使用');
  }

  const ref = useCallback((node: HTMLButtonElement) => {
    if (node) {
      const index = tabRefs.current.indexOf(null);
      if (index > -1) {
        tabRefs.current[index] = node;
      } else {
        tabRefs.current.push(node);
      }
    }
  }, []);

  const isActive = context.activeTab === value;

  return (
    <button
      ref={ref}
      data-value={value}
      onClick={() => context.setActiveTab(value)}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
```

---

## 3. Headless Component（无样式组件）

### 3.1 模式原理

Headless Component 将**逻辑与 UI 分离**，只提供行为逻辑，不包含任何样式。使用者可以根据自己的设计系统自由定制 UI。

**核心优势**：
- 完全的样式自由度
- 逻辑与 UI 解耦
- 易于测试和复用

### 3.2 基础实现

```typescript
// hooks/useToggle.ts
import { useState, useCallback } from 'react';

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    on: value,
    off: !value,
  };
}

// components/Toggle/Toggle.tsx
import { useToggle } from '@/hooks/useToggle';

interface ToggleProps {
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
  children: (state: {
    value: boolean;
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
  }) => ReactNode;
}

export function Toggle({ defaultValue = false, onChange, children }: ToggleProps) {
  const { value, toggle, setTrue, setFalse } = useToggle(defaultValue);

  const handleChange = useCallback(() => {
    toggle();
    onChange?.(value);
  }, [toggle, onChange, value]);

  return children({
    value,
    toggle: handleChange,
    setTrue: () => {
      setTrue();
      onChange?.(true);
    },
    setFalse: () => {
      setFalse();
      onChange?.(false);
    },
  });
}

// 使用示例：Switch 开关
function SwitchExample() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Toggle defaultValue={enabled} onChange={setEnabled}>
      {({ value, toggle }) => (
        <button
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}
    </Toggle>
  );
}

// 使用示例：复选框
function CheckboxExample() {
  return (
    <Toggle defaultValue={false}>
      {({ value, toggle }) => (
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={toggle}
            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
              value
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {value && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span>同意条款</span>
        </label>
      )}
    </Toggle>
  );
}
```

### 3.3 进阶：Autocomplete 组件

```typescript
// hooks/useAutocomplete.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface AutocompleteOption {
  id: string | number;
  label: string;
  value: string;
}

interface UseAutocompleteProps<T extends AutocompleteOption> {
  options: T[];
  onSelect?: (option: T) => void;
  debounce?: number;
}

export function useAutocomplete<T extends AutocompleteOption>({
  options,
  onSelect,
  debounce = 300,
}: UseAutocompleteProps<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 过滤选项
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  // 防抖查询
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, debounce);

    return () => clearTimeout(timer);
  }, [query, debounce]);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex]);

  // 选择选项
  const handleSelect = useCallback(
    (option: T) => {
      setQuery(option.label);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect?.(option);
    },
    [onSelect]
  );

  return {
    query,
    setQuery,
    isOpen,
    filteredOptions,
    highlightedIndex,
    handleKeyDown,
    handleSelect,
    containerRef,
  };
}

// components/Autocomplete/Autocomplete.tsx
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface AutocompleteProps<T extends AutocompleteOption> {
  options: T[];
  onSelect: (option: T) => void;
  placeholder?: string;
  children: (state: {
    query: string;
    isOpen: boolean;
    filteredOptions: T[];
    highlightedIndex: number;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleSelect: (option: T) => void;
    containerRef: React.RefObject<HTMLDivElement>;
  }) => ReactNode;
}

export function Autocomplete<T extends AutocompleteOption>({
  options,
  onSelect,
  placeholder = '搜索...',
  children,
}: AutocompleteProps<T>) {
  const state = useAutocomplete({ options, onSelect });

  return children({
    ...state,
    query: state.query,
    setQuery: state.setQuery,
    isOpen: state.isOpen,
    filteredOptions: state.filteredOptions,
    highlightedIndex: state.highlightedIndex,
    handleKeyDown: state.handleKeyDown,
    handleSelect: state.handleSelect,
    containerRef: state.containerRef,
  });
}

// 使用示例：国家选择器
const countries = [
  { id: 'cn', label: '中国', value: '+86' },
  { id: 'us', label: '美国', value: '+1' },
  { id: 'uk', label: '英国', value: '+44' },
  { id: 'jp', label: '日本', value: '+81' },
];

function CountrySelector() {
  const [selected, setSelected] = useState<typeof countries[0] | null>(null);

  return (
    <div className="w-64">
      <Autocomplete options={countries} onSelect={setSelected}>
        {({ query, isOpen, filteredOptions, handleKeyDown, handleSelect, containerRef }) => (
          <div ref={containerRef} className="relative">
            <input
              type="text"
              value={query}
              onChange={e => handleSelect({ id: '', label: e.target.value, value: '' } as any)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            
            {isOpen && filteredOptions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 cursor-pointer ${
                      index === highlightedIndex
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label} ({option.value})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Autocomplete>

      {selected && (
        <div className="mt-2 p-2 bg-blue-50 rounded dark:bg-blue-900/20">
          已选择: {selected.label} {selected.value}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Render Props 模式

### 4.1 模式原理

Render Props 是一种通过**函数类型的 prop** 来实现逻辑复用的设计模式。子组件接收一个函数作为 children，调用该函数并传入状态和方法，由父组件决定如何渲染。

**核心优势**：
- 灵活的渲染控制
- 逻辑与 UI 完全解耦
- 易于组合多个逻辑

### 4.2 基础实现

```typescript
// components/WindowDimensions.tsx
import { useState, useEffect } from 'react';

interface WindowDimensionsProps {
  children: (dimensions: {
    width: number;
    height: number;
  }) => ReactNode;
}

export function WindowDimensions({ children }: WindowDimensionsProps) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return children(dimensions);
}

// 使用示例
function ResponsiveLayout() {
  return (
    <WindowDimensions>
      {({ width, height }) => (
        <div>
          <h1>窗口尺寸</h1>
          <p>宽度: {width}px</p>
          <p>高度: {height}px</p>
          
          {width < 768 ? (
            <p>当前为移动端</p>
          ) : width < 1024 ? (
            <p>当前为平板端</p>
          ) : (
            <p>当前为桌面端</p>
          )}
        </div>
      )}
    </WindowDimensions>
  );
}
```

### 4.3 进阶：Form 组件

```typescript
// components/Form/Form.tsx
import { useState, useCallback, ReactNode } from 'react';

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface FormProps {
  initialValues?: Record<string, any>;
  validate?: (values: Record<string, any>) => Record<string, string>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  children: (state: FormState & {
    handleChange: (name: string, value: any) => void;
    handleSubmit: (e?: React.FormEvent) => void;
    resetForm: () => void;
  }) => ReactNode;
}

export function Form({
  initialValues = {},
  validate,
  onSubmit,
  children,
}: FormProps) {
  const [state, setState] = useState<FormState>({
    values: initialValues,
    errors: {},
    isValid: false,
    isSubmitting: false,
  });

  const handleChange = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
    }));
  }, []);

  const validateForm = useCallback((values: Record<string, any>) => {
    if (!validate) return {};
    return validate(values);
  }, [validate]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const errors = validateForm(state.values);
      const isValid = Object.keys(errors).length === 0;

      setState(prev => ({ ...prev, errors, isValid }));

      if (isValid && onSubmit) {
        setState(prev => ({ ...prev, isSubmitting: true }));
        try {
          await onSubmit(state.values);
        } finally {
          setState(prev => ({ ...prev, isSubmitting: false }));
        }
      }
    },
    [state.values, validateForm, onSubmit]
  );

  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      isValid: false,
      isSubmitting: false,
    });
  }, [initialValues]);

  return children({
    ...state,
    handleChange,
    handleSubmit,
    resetForm,
  });
}

// 使用示例
function RegistrationForm() {
  return (
    <Form
      initialValues={{ username: '', email: '', password: '' }}
      validate={values => {
        const errors: Record<string, string> = {};
        if (!values.username) errors.username = '用户名必填';
        if (!values.email) errors.email = '邮箱必填';
        else if (!/^\S+@\S+\.\S+$/.test(values.email))
          errors.email = '邮箱格式不正确';
        if (!values.password) errors.password = '密码必填';
        else if (values.password.length < 6)
          errors.password = '密码长度至少 6 位';
        return errors;
      }}
      onSubmit={async values => {
        // 模拟提交
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('提交数据:', values);
      }}
    >
      {({ values, errors, isValid, isSubmitting, handleChange, handleSubmit }) => (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">用户名</label>
            <input
              type="text"
              name="username"
              value={values.username}
              onChange={e => handleChange('username', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.username
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">邮箱</label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={e => handleChange('email', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">密码</label>
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={e => handleChange('password', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '提交中...' : '注册'}
          </button>
        </form>
      )}
    </Form>
  );
}
```

---

## 5. 自定义 Hook 模式

### 5.1 模式原理

Custom Hook 是 React 19 最强大的模式之一，通过**抽取业务逻辑**到可复用的函数中，实现逻辑复用和状态管理。

**核心优势**：
- 逻辑复用
- 状态共享
- 易于测试

### 5.2 基础实现

```typescript
// hooks/useLocalStorage.ts
import { useState, useCallback, useEffect } from 'react';

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('读取 localStorage 失败:', error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;

        setValue(valueToStore);

        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('写入 localStorage 失败:', error);
      }
    },
    [key, value]
  );

  const remove = useCallback(() => {
    window.localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return { value, setValue: setStoredValue, remove };
}

// 使用示例
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 5.3 进阶：useDebounce Hook

```typescript
// hooks/useDebounce.ts
import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// hooks/useDebounceCallback.ts
import { useRef, useEffect, useCallback } from 'react';

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}

// 使用示例：搜索框
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // 执行搜索
      console.log('搜索:', debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索..."
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    />
  );
}

// 使用示例：窗口大小
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleResize = useDebounceCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 100);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}
```

---

## 6. 组件设计最佳实践

### 6.1 Props 设计原则

```typescript
// ✅ 好的设计：明确的 Props 接口
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

// ❌ 不好的设计：any 类型
interface BadButtonProps {
  props: any; // 不知道有哪些 props
}

// ✅ 好的设计：使用 TypeScript 泛型
interface TableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  onRowClick?: (row: T) => void;
}

interface ColumnConfig<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}
```

### 6.2 组件命名规范

```typescript
// ✅ 好的命名
- Button
- Card
- Modal
- Tabs
- TabList
- TabItem
- TabContent

// ❌ 不好的命名
- Comp1
- MyComponent
- ComponentWithProps
```

### 6.3 错误处理

```typescript
// 使用 Error Boundary 捕获错误
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
          <h2 className="text-red-600 dark:text-red-400">出错了</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <UserProfile userId="123" />
</ErrorBoundary>;
```

---

## 7. 总结：2026 年组件设计趋势

| 趋势 | 说明 | 推荐模式 |
|------|------|---------|
| **组合优先** | 小组件组合成复杂 UI | Compound Pattern |
| **逻辑复用** | 抽取业务逻辑 | Custom Hook |
| **样式解耦** | 逻辑与 UI 分离 | Headless Component |
| **服务端渲染** | 减少客户端 JS | Server Components |
| **类型安全** | TypeScript 全面应用 | 泛型 + 严格模式 |

**最佳实践**：
1. 优先使用 Compound Pattern 组合组件
2. 使用 Custom Hook 抽取业务逻辑
3. Headless Component 实现样式解耦
4. Server Components 减少客户端 JS
5. TypeScript 泛型保证类型安全

---
*本文档持续更新，最后更新于 2026 年 3 月*
