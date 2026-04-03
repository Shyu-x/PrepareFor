# React工程化、测试与性能调优完全指南（2026年最新版）

> **本文档全面深入解析React工程化、测试和性能调优：从Vite/Webpack构建工具对比、TypeScript集成、ESLint配置、Jest测试、React Testing Library、性能分析工具到React 19新特性**

---

## 目录

1. [React工程化概述](#1-react工程化概述)
   - [1.1 工程化的重要性](#11-工程化的重要性)
   - [1.2 2026年技术栈推荐](#12-2026年技术栈推荐)
   - [1.3 工程化最佳实践](#13-工程化最佳实践)
2. [构建工具深度对比](#2-构建工具深度对比)
   - [2.1 Webpack深度解析](#21-webpack深度解析)
   - [2.2 Vite深度解析](#22-vite深度解析)
   - [2.3 Rspack深度解析](#23-rspack深度解析)
   - [2.4 Turbopack深度解析](#24-turbopack深度解析)
   - [2.5 构建工具选型指南](#25-构建工具选型指南)
3. [TypeScript集成](#3-typescript集成)
   - [3.1 TypeScript配置](#31-typescript配置)
   - [3.2 React TypeScript最佳实践](#32-react-typescript最佳实践)
   - [3.3 类型推断与泛型](#33-类型推断与泛型)
   - [3.4 高级类型技巧](#34-高级类型技巧)
4. [代码质量工具](#4-代码质量工具)
   - [4.1 ESLint配置](#41-eslint配置)
   - [4.2 Prettier配置](#42-prettier配置)
   - [4.3 Husky与lint-staged](#43-husky与lint-staged)
   - [4.4 代码规范最佳实践](#44-代码规范最佳实践)
5. [React测试完整指南](#5-react测试完整指南)
   - [5.1 Jest配置](#51-jest配置)
   - [5.2 React Testing Library](#52-react-testing-library)
   - [5.3 组件测试](#53-组件测试)
   - [5.4 Hook测试](#54-hook测试)
   - [5.5 E2E测试](#55-e2e测试)
6. [React性能调优](#6-react性能调优)
   - [6.1 React.memo](#61-reactmemo)
   - [6.2 useMemo](#62-usememo)
   - [6.3 useCallback](#63-usecallback)
   - [6.4 虚拟列表](#64-虚拟列表)
   - [6.5 懒加载与代码分割](#65-懒加载与代码分割)
   - [6.6 性能分析工具](#66-性能分析工具)
   - [6.7 Core Web Vitals](#67-core-web-vitals)
7. [React 19新特性](#7-react-19新特性)
   - [7.1 Server Components](#71-server-components)
   - [7.2 Server Actions](#72-server-actions)
   - [7.3 React Compiler](#73-react-compiler)
   - [7.4 新的Hooks](#74-新的hooks)
8. [CI/CD集成](#8-cicd集成)
   - [8.1 GitHub Actions](#81-github-actions)
   - [8.2 GitLab CI](#82-gitlab-ci)
   - [8.3 自动化测试](#83-自动化测试)
   - [8.4 自动化部署](#84-自动化部署)
9. [工程化最佳实践](#9-工程化最佳实践)
   - [9.1 项目结构](#91-项目结构)
   - [9.2 环境变量管理](#92-环境变量管理)
   - [9.3 代码组织](#93-代码组织)
   - [9.4 文档与注释](#94-文档与注释)
10. [常见问题与解决方案](#10-常见问题与解决方案)
    - [10.1 构建问题](#101-构建问题)
    - [10.2 测试问题](#102-测试问题)
    - [10.3 性能问题](#103-性能问题)
    - [10.4 类型问题](#104-类型问题)

---

## 1. React工程化概述

### 1.1 工程化的重要性

**工程化的核心价值**：

```javascript
// ❌ 没有工程化的项目
// - 代码混乱，难以维护
// - 测试覆盖率低
// - 构建速度慢
// - 代码质量无法保证
// - 部署流程复杂

// ✅ 有工程化的项目
// - 代码规范统一
// - 自动化测试覆盖
// - 快速构建和部署
// - 代码质量可监控
// - 持续集成和交付
```

**2026年React工程化栈**：

```javascript
// 核心技术栈
{
  "构建工具": "Vite 8 + Rolldown",
  "语言": "TypeScript 5.8",
  "代码质量": "ESLint 9 + Prettier 3",
  "测试": "Jest 29 + React Testing Library 14",
  "E2E": "Playwright 1.40",
  "状态管理": "Zustand 5 + React Context",
  "路由": "React Router 6 + Next.js 16",
  "UI框架": "Ant Design 6 + Tailwind CSS 4"
}
```

### 1.2 2026年技术栈推荐

**构建工具推荐**：

```javascript
// Vite 8 (Rolldown) - 现代Web应用首选
{
  "name": "Vite",
  "version": "8.x",
  "language": "JavaScript",
  "core": "Rolldown",
  "冷启动": "1.2s",
  "热更新": "毫秒级",
  "优势": "原生ESM，按需编译"
}

// Webpack 5 - 巨型项目迁移
{
  "name": "Webpack",
  "version": "5.x",
  "language": "JavaScript",
  "core": "Module Federation",
  "冷启动": "45s",
  "热更新": "5s+",
  "优势": "生态丰富，插件强大"
}

// Rspack - Webpack替代
{
  "name": "Rspack",
  "version": "1.x",
  "language": "Rust",
  "core": "Rust-based",
  "冷启动": "1.5s",
  "热更新": "毫秒级",
  "优势": "兼容Webpack，性能优秀"
}

// Turbopack - Next.js原生
{
  "name": "Turbopack",
  "version": "2.x",
  "language": "Rust",
  "core": "Next.js",
  "冷启动": "0.8s",
  "热更新": "20ms",
  "优势": "Next.js原生，极速构建"
}
```

**2026年技术栈对比**：

| 维度 | Vite 8 (Rolldown) | Webpack | Rspack | Next.js (Turbopack) |
|------|-------------------|---------|--------|---------------------|
| **核心语言** | JavaScript | JavaScript | Rust | Rust |
| **冷启动** | 1.2s | 45s | 1.5s | 0.8s |
| **热更新** | 毫秒级 | 5s+ | 毫秒级 | 20ms |
| **生产构建** | 8s | 120s | 5s | 6s |
| **插件生态** | 继承Rollup | 最丰富 | 兼容Webpack | 专用生态 |
| **首选场景** | 现代Web应用 | 巨型项目迁移 | Webpack替换 | SSR应用 |

### 1.3 工程化最佳实践

**工程化最佳实践**：

```javascript
// 1. 代码规范
// - 使用ESLint和Prettier
// - 配置Git钩子（Husky + lint-staged）
// - 统一代码风格

// 2. 类型安全
// - 使用TypeScript严格模式
// - 定义清晰的类型
// - 避免any类型

// 3. 测试覆盖
// - 单元测试覆盖率80%+
// - 组件测试用户视角
// - E2E测试核心流程

// 4. 性能优化
// - 构建时间优化
// - 运行时性能优化
// - Core Web Vitals监控

// 5. CI/CD
// - 自动化测试
// - 自动化部署
// - 环境隔离
```

---

## 2. 构建工具深度对比

### 2.1 Webpack深度解析

**Webpack核心概念**：

```javascript
// Webpack配置示例
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // 入口
  entry: './src/index.tsx',
  
  // 输出
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  
  // 模块
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  
  // 插件
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  
  // 优化
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },
  
  // 开发服务器
  devServer: {
    port: 3000,
    hot: true,
  },
};
```

**Webpack性能优化**：

```javascript
// 1. 持久化缓存
cache: {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
},

// 2. 代码分割
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
},

// 3. Tree Shaking
mode: 'production',
optimization: {
  usedExports: true,
},

// 4. 压缩优化
optimization: {
  minimizer: [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    }),
  ],
},

// 5. 插件优化
plugins: [
  new CleanWebpackPlugin(),
  new HardSourceWebpackPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  new CompressionPlugin({
    algorithm: 'brotli',
    threshold: 10240,
  }),
];
```

### 2.2 Vite深度解析

**Vite核心原理**：

```javascript
// Vite开发环境不打包，直接使用浏览器原生ESM
// 1. 启动轻量级静态服务器（200ms内）
// 2. 按需编译：只在浏览器请求时即时编译
// 3. 使用esbuild/Rolldown预构建node_modules
// 4. HMR与项目总模块数无关

// Vite配置示例
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // React插件支持
    plugins: [react()],
    
    // 环境配置
    envPrefix: ['VITE_', 'APP_'],
    envDir: 'envs',
    
    // 路径别名
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    // 构建优化
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['antd', '@ant-design/icons'],
          },
        },
      },
    },
    
    // 开发服务器配置
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
```

**Vite性能优势**：

```javascript
// Vite vs Webpack性能对比
const performanceData = {
  "冷启动": {
    "Vite": "1.2s",
    "Webpack": "45s",
    "提升": "37.5倍"
  },
  "热更新": {
    "Vite": "毫秒级",
    "Webpack": "5s+",
    "提升": "5000倍"
  },
  "生产构建": {
    "Vite": "8s",
    "Webpack": "120s",
    "提升": "15倍"
  }
};

// Vite按需编译原理
// 1. 浏览器请求 /src/main.ts
// 2. Vite拦截请求
// 3. 使用esbuild转译TypeScript
// 4. 返回转译后的JavaScript
// 5. 浏览器直接执行

// 优势：只编译需要的模块
// 劣势：生产构建需要打包
```

### 2.3 Rspack深度解析

**Rspack核心特性**：

```javascript
// Rspack配置示例
const { RspackPlugin } = require('@rspack/core');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 入口
  entry: './src/index.tsx',
  
  // 输出
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  
  // 模块
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  // 插件
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  
  // 优化
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  
  // Rspack特定配置
  experiments: {
    rspackFuture: {
      bundler: 'rspack',
    },
  },
};
```

**Rspack性能对比**：

```javascript
// Rspack vs Webpack vs Vite性能对比
const performanceComparison = {
  "冷启动": {
    "Rspack": "1.5s",
    "Webpack": "45s",
    "Vite": "1.2s",
    "说明": "Rspack接近Vite性能"
  },
  "热更新": {
    "Rspack": "毫秒级",
    "Webpack": "5s+",
    "Vite": "毫秒级",
    "说明": "Rspack和Vite都很快"
  },
  "生产构建": {
    "Rspack": "5s",
    "Webpack": "120s",
    "Vite": "8s",
    "说明": "Rspack性能最优"
  }
};
```

### 2.4 Turbopack深度解析

**Turbopack核心特性**：

```javascript
// Turbopack配置示例（Next.js）
// Next.js 16默认使用Turbopack

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack配置
  experimental: {
    turbopack: true,
  },
  
  // 环境变量
  env: {
    API_URL: process.env.API_URL,
  },
  
  // 重写
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3001/:path*',
    },
  ],
};

// Turbopack性能
const turbopackPerformance = {
  "冷启动": "0.8s",
  "热更新": "20ms",
  "生产构建": "6s",
  "优势": "Next.js原生，极速构建"
};
```

### 2.5 构建工具选型指南

**选型决策树**：

```javascript
// 选型决策树
function selectBuildTool(projectType, teamSize, performanceNeeds) {
  if (projectType === 'SSR' || projectType === 'SaaS') {
    return 'Next.js (Turbopack)';
  }
  
  if (teamSize > 50 || performanceNeeds === 'extreme') {
    return 'Rspack';
  }
  
  if (projectType === 'modern' || teamSize < 10) {
    return 'Vite';
  }
  
  if (legacySupport) {
    return 'Webpack';
  }
  
  return 'Vite';
}

// 选型建议
const recommendations = {
  "小型项目": {
    "推荐": "Vite",
    "原因": "快速启动，简单配置"
  },
  "中型项目": {
    "推荐": "Vite",
    "原因": "性能优秀，生态丰富"
  },
  "大型项目": {
    "推荐": "Rspack",
    "原因": "性能最优，兼容Webpack"
  },
  "SSR项目": {
    "推荐": "Next.js (Turbopack)",
    "原因": "原生支持，极速构建"
  },
  "迁移项目": {
    "推荐": "Webpack",
    "原因": "生态丰富，插件强大"
  }
};
```

---

## 3. TypeScript集成

### 3.1 TypeScript配置

**TypeScript配置**：

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

**TypeScript配置说明**：

```javascript
// 核心配置说明
{
  "target": "ES2020", // 编译目标
  "lib": ["DOM", "DOM.Iterable", "ES2020"], // 库文件
  "strict": true, // 严格模式
  "esModuleInterop": true, // ES模块互操作
  "jsx": "react-jsx", // JSX转换
  "moduleResolution": "bundler", // 模块解析
  "paths": { "@/*": ["src/*"] } // 路径别名
}
```

### 3.2 React TypeScript最佳实践

**React TypeScript最佳实践**：

```typescript
// 1. 组件Props类型
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// 2. State类型
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const [user, setUser] = useState<User | null>(null);

// 3. Form类型
interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const [formData, setFormData] = useState<LoginForm>({
  email: '',
  password: '',
  rememberMe: false,
});

// 4. API返回类型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (id: string): Promise<ApiResponse<UserResponse>> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

### 3.3 类型推断与泛型

**类型推断**：

```typescript
// 1. 自动类型推断
const count = 0; // 推断为 number
const name = 'John'; // 推断为 string
const user = { id: '1', name: 'John' }; // 推断为 { id: string, name: string }

// 2. 函数返回类型推断
function add(a: number, b: number) {
  return a + b; // 推断返回 number
}

// 3. 条件类型推断
function getValue<T>(value: T | null): T | null {
  return value;
}

const result = getValue('hello'); // 推断为 string | null
```

**泛型**：

```typescript
// 1. 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

const result1 = identity<string>('hello');
const result2 = identity<number>(42);

// 2. 泛型接口
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: string;
  name: string;
}

const userResponse: ApiResponse<User> = {
  data: { id: '1', name: 'John' },
  status: 200,
  message: 'Success',
};

// 3. 泛型类
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);

const stringStack = new Stack<string>();
stringStack.push('hello');
stringStack.push('world');
```

### 3.4 高级类型技巧

**高级类型**：

```typescript
// 1. 条件类型
type IsString<T> = T extends string ? true : false;
type A = IsString<string>; // true
type B = IsString<number>; // false

// 2. 分配条件类型
type Flatten<T> = T extends any[] ? T[number] : T;
type A = Flatten<string[]>; // string
type B = Flatten<number>; // number

// 3. 映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type User = {
  id: string;
  name: string;
};

type ReadonlyUser = Readonly<User>;
// ReadonlyUser = {
//   readonly id: string;
//   readonly name: string;
// }

// 4. 工具类型
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

// Partial - 使所有属性可选
type PartialUser = Partial<User>;
// { id?: string, name?: string, email?: string, age?: number }

// Required - 使所有属性必填
type RequiredUser = Required<User>;
// { id: string, name: string, email: string, age: number }

// Pick - 选择属性
type UserBasic = Pick<User, 'id' | 'name'>;
// { id: string, name: string }

// Omit - 排除属性
type UserNoEmail = Omit<User, 'email'>;
// { id: string, name: string, age?: number }

// 5. 自定义工具类型
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

type DeepReadonlyUser = DeepReadonly<User>;
// {
//   readonly id: string;
//   readonly name: string;
//   readonly email: string;
//   readonly age?: DeepReadonly<number>;
// }

// 6. 函数重载
function formatString(value: string): string;
function formatNumber(value: number): string;
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toString();
}

const result1 = formatString('hello'); // string
const result2 = formatNumber(42); // string
```

---

## 4. 代码质量工具

### 4.1 ESLint配置

**ESLint配置**：

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx']
    }]
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  }
};
```

**ESLint规则说明**：

```javascript
// 核心规则说明
{
  "react-hooks/rules-of-hooks": "error", // Hooks规则
  "react-hooks/exhaustive-deps": "warn", // 依赖检查
  "@typescript-eslint/no-unused-vars": "error", // 未使用变量
  "import/no-extraneous-dependencies": "error" // 依赖检查
}
```

### 4.2 Prettier配置

**Prettier配置**：

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "bracketSameLine": false,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "vueIndentScriptAndStyle": false
}
```

### 4.3 Husky与lint-staged

**Husky配置**：

```bash
# 安装
npm install -D husky lint-staged

# 初始化
npx husky init

# 添加pre-commit钩子
echo "npm run lint-staged" > .husky/pre-commit
```

**lint-staged配置**：

```json
// package.json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,scss,json}\"",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "prettier --write"
    ],
    "*.json": [
      "prettier --write"
    ]
  }
}
```

### 4.4 代码规范最佳实践

**代码规范最佳实践**：

```typescript
// 1. 命名规范
// 变量和函数：camelCase
const userName = 'John';
function getUserInfo() {}

// 组件：PascalCase
const UserInfo = () => {};
const Button = () => {};

// 常量：UPPER_SNAKE_CASE
const API_URL = 'https://api.example.com';
const MAX_RETRY = 3;

// 2. 文件命名
// 组件文件：PascalCase.tsx
// Hook文件：usePascalCase.ts
// 工具文件：camelCase.ts
// 类型文件：types.ts 或 index.ts

// 3. 导入顺序
// 1. React
// 2. 第三方库
// 3. 内部模块
// 4. 类型定义
// 5. 样式

import React, { useState, useEffect } from 'react';
import { Button, Input } from 'antd';
import { formatDate } from '@/utils/date';
import type { User } from '@/types/user';

// 4. 注释规范
// 函数注释
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
function getUserInfo(userId: string): Promise<User> {
  return fetch(`/api/users/${userId}`).then(res => res.json());
}

// 5. 错误处理
// 使用try-catch
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
}
```

---

## 5. React测试完整指南

### 5.1 Jest配置

**Jest配置**：

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  rootDir: './src',
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/../__mocks__/fileMock.ts'
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(react-syntax-highlighter)/)'
  ],
  
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
  
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};

export default config;
```

### 5.2 React Testing Library

**React Testing Library配置**：

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// 每次测试后清理
afterEach(() => {
  cleanup();
});
```

**React Testing Library使用**：

```typescript
// 测试示例
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('LoginForm', () => {
  test('应该正确渲染表单', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  test('应该验证必填字段', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.click(screen.getByRole('button', { name: /登录/i }));
    
    expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument();
    expect(screen.getByText(/请输入密码/i)).toBeInTheDocument();
  });

  test('应该成功提交表单', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn();
    render(<LoginForm onSubmit={mockLogin} />);
    
    await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com');
    await user.type(screen.getByLabelText(/密码/i), 'password123');
    await user.click(screen.getByRole('button', { name: /登录/i }));
    
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### 5.3 组件测试

**组件测试示例**：

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button组件', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });

  it('应该响应点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击我</Button>);
    
    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('禁用状态不应响应点击', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>点击我</Button>);
    
    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### 5.4 Hook测试

**Hook测试示例**：

```typescript
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../hooks/useCounter';

describe('useCounter', () => {
  test('初始值', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  test('增加', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  test('减少', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });
});
```

### 5.5 E2E测试

**Cypress配置**：

```javascript
// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});
```

**Cypress测试示例**：

```javascript
// cypress/e2e/user-login.cy.js
describe('用户登录流程', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('应该显示登录表单', () => {
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('应该成功登录', () => {
    cy.get('input[name="email"]').type('zhangsan@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.contains('欢迎，张三').should('be.visible');
    cy.url().should('include', '/dashboard');
  });
});
```

**Playwright配置**：

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

**Playwright测试示例**：

```javascript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('用户登录', () => {
  test('应该成功登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'zhangsan@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('欢迎，张三');
  });
});
```

---

## 6. React性能调优

### 6.1 React.memo

**React.memo使用**：

```typescript
// 使用React.memo避免不必要的重渲染
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onSelect: (id: string) => void;
}

const UserCard = React.memo(function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div onClick={() => onSelect(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.user.id === nextProps.user.id &&
         prevProps.user.name === nextProps.user.name;
});
```

### 6.2 useMemo

**useMemo使用**：

```typescript
// 缓存计算结果
function UserList({ users, filter }: { users: User[]; filter: string }) {
  // ❌ 每次渲染都重新计算
  // const filteredUsers = users.filter(user =>
  //   user.name.toLowerCase().includes(filter.toLowerCase())
  // );

  // ✅ 只在依赖变化时重新计算
  const filteredUsers = useMemo(() => {
    console.log('过滤用户列表');
    return users.filter(user =>
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  return (
    <ul>
      {filteredUsers.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 6.3 useCallback

**useCallback使用**：

```typescript
// 缓存回调函数
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log('点击');
  // };

  // ✅ 只在依赖变化时创建新函数
  const handleClick = useCallback(() => {
    console.log('点击');
  }, []);

  const handleSelect = useCallback((id: string) => {
    console.log('选中:', id);
  }, []);

  return <Child onClick={handleClick} onSelect={handleSelect} />;
}
```

### 6.4 虚拟列表

**虚拟列表实现**：

```typescript
// 使用react-window实现虚拟列表
import { FixedSizeList } from 'react-window';

interface Item {
  id: string;
  name: string;
}

function VirtualList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 或者使用自定义实现
function VirtualizedList({ items, itemHeight = 50 }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollTop, clientHeight } = containerRef.current;
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(clientHeight / itemHeight);

      setVisibleRange({
        start: Math.max(0, start - 5),
        end: start + visibleCount + 5
      });
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [itemHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      style={{
        height: '600px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                height: itemHeight,
                lineHeight: `${itemHeight}px`,
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 6.5 懒加载与代码分割

**懒加载与代码分割**：

```typescript
// React.lazy和Suspense
import { lazy, Suspense } from 'react';

// 懒加载组件
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}

// 路由级别代码分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Product = lazy(() => import('./pages/Product'));

// 预加载组件
const preloadDashboard = () => import('./pages/Dashboard');

function Home() {
  return (
    <Link
      to="/dashboard"
      onMouseEnter={preloadDashboard}
    >
      仪表盘
    </Link>
  );
}
```

### 6.6 性能分析工具

**性能分析工具使用**：

```typescript
// React DevTools Profiler
// 1. 在开发环境启用 profiler
<React.Profiler id="App" onRender={onRenderCallback}>
  <App />
</React.Profiler>

// 性能回调函数
function onRenderCallback(
  id, // 发生提交的组件的"id"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新实际花费的时间
  baseDuration, // 估算的渲染时间
  startTime, // 本次更新开始的时间
  commitTime, // 本次提交完成的时间
  interactions // 本次更新相关的交互
) {
  console.log(`${id}渲染耗时: ${actualDuration}ms`);
}

// 使用useProfiler自定义Hook
function useProfiler(id: string) {
  const onRenderCallback = useCallback(
    (id, phase, actualDuration) => {
      if (actualDuration > 1000) {
        console.warn(`${id} 渲染时间过长: ${actualDuration}ms`);
      }
    },
    []
  );

  return <React.Profiler id={id} onRender={onRenderCallback} />;
}
```

### 6.7 Core Web Vitals

**Core Web Vitals指标**：

```typescript
// 使用web-vitals收集性能指标
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
  });

  navigator.sendBeacon('/analytics', body);
}

// 注册性能指标收集
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// LCP优化策略
function ImageWithPlaceholder({ src, alt, width, height }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div style={{ width, height, backgroundColor: '#f0f0f0' }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="eager" // LCP图片不使用懒加载
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />
    </div>
  );
}

// CLS优化：避免布局偏移
function OptimizedLayout() {
  return (
    <div>
      {/* 预留空间避免布局偏移 */}
      <div style={{ height: '400px' }}>
        <img src="/hero.jpg" alt="Hero" loading="eager" />
      </div>
      
      {/* 使用font-display: swap避免字体跳动 */}
      <style>{`
        @font-face {
          font-family: 'Inter';
          src: url('/fonts/inter.woff2') format('woff2');
          font-display: swap;
        }
      `}</style>
    </div>
  );
}
```

---

## 7. React 19新特性

### 7.1 Server Components

**Server Components使用**：

```typescript
// Server Component（默认）
// app/products/page.tsx
import { db } from '@/lib/db';

// Server Component：默认在服务器上执行
async function ProductList() {
  // ✅ 可以直接访问数据库
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Client Component（'use client'）
// components/ProductCard.tsx
'use client';

import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);

  return (
    <div onClick={() => setLiked(!liked)}>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span>{liked ? '❤️' : '🤍'}</span>
    </div>
  );
}
```

### 7.2 Server Actions

**Server Actions使用**：

```typescript
// app/actions/user.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Server Action：处理用户注册
export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const user = await db.users.create({
    data: { email, password, name },
  });

  revalidatePath('/users');

  return { success: true, user };
}

// Server Action：处理用户登录
export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await db.users.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return { success: false, error: '邮箱或密码错误' };
  }

  return { success: true, user };
}

// Server Action：处理用户更新
export async function updateUser(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const user = await db.users.update({
    where: { id: userId },
    data: { name, email },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);

  return { success: true, user };
}
```

### 7.3 React Compiler

**React Compiler使用**：

```typescript
// React Compiler自动记忆化
// 编译前（开发者写法）
function UserProfile({ user }) {
  let title = "Guest";
  if (user.isAdmin) {
    title = user.name.toUpperCase();
  }
  return <h1>{title}</h1>;
}

// 编译后（Compiler自动生成）
import { c as _c } from "react/compiler-runtime";

function UserProfile({ user }) {
  const $ = _c(2); // Compiler注入的缓存数组

  let title;
  if (user.isAdmin) {
    title = user.name.toUpperCase();
  } else {
    title = "Guest";
  }

  let t0;
  if ($[0] !== title) {
    t0 = <h1>{title}</h1>;
    $[0] = title;
    $[1] = t0;
  } else {
    t0 = $[1]; // 缓存命中！
  }

  return t0;
}
```

### 7.4 新的Hooks

**新的Hooks使用**：

```typescript
// use() Hook
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// useActionState表单处理
function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);
  return (
    <form action={formAction}>
      <input name="title" />
      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建文章'}
      </button>
    </form>
  );
}

// useOptimistic乐观更新
function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, id: 'temp-' + Date.now(), pending: true }]
  );
  
  async function handleSubmit(formData) {
    const title = formData.get('title');
    addOptimisticTodo({ title, completed: false });
    await addTodo(title);
  }
}
```

---

## 8. CI/CD集成

### 8.1 GitHub Actions

**GitHub Actions配置**：

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
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
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Run Tests
        run: npm test -- --coverage
        
      - name: Build
        run: npm run build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build
          path: dist
          
      - name: Deploy to production
        run: |
          # 部署脚本
          echo "Deploying to production..."
```

### 8.2 GitLab CI

**GitLab CI配置**：

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run lint
    - npm test -- --coverage
  artifacts:
    paths:
      - coverage/
    expire_in: 1 week

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 month

deploy:
  stage: deploy
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run deploy
  only:
    - main
```

### 8.3 自动化测试

**自动化测试策略**：

```javascript
// 测试策略
const testStrategy = {
  "单元测试": {
    "覆盖率": "80%+",
    "工具": "Jest + React Testing Library",
    "频率": "每次提交"
  },
  "组件测试": {
    "覆盖率": "100%",
    "工具": "React Testing Library",
    "频率": "每次提交"
  },
  "E2E测试": {
    "覆盖率": "核心流程",
    "工具": "Playwright",
    "频率": "每次合并"
  },
  "性能测试": {
    "工具": "Lighthouse",
    "频率": "每次发布"
  }
};
```

### 8.4 自动化部署

**自动化部署策略**：

```javascript
// 部署策略
const deployStrategy = {
  "开发环境": {
    "触发": "push to develop",
    "方式": "自动部署",
    "验证": "自动化测试"
  },
  "预发布环境": {
    "触发": "pull request to main",
    "方式": "自动部署",
    "验证": "自动化测试 + 手动测试"
  },
  "生产环境": {
    "触发": "merge to main",
    "方式": "蓝绿部署",
    "验证": "自动化测试 + 性能测试"
  }
};
```

---

## 9. 工程化最佳实践

### 9.1 项目结构

**项目结构**：

```javascript
// 项目结构
project/
├── src/                    # 源代码
│   ├── components/         # 公共组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Layout/
│   ├── pages/             # 页面组件
│   │   ├── Home/
│   │   ├── About/
│   │   └── Dashboard/
│   ├── hooks/             # 自定义Hooks
│   │   ├── useCounter.ts
│   │   ├── useDebounce.ts
│   │   └── useFetch.ts
│   ├── utils/             # 工具函数
│   │   ├── api.ts
│   │   ├── date.ts
│   │   └── validation.ts
│   ├── types/             # 类型定义
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── contexts/          # Context
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── styles/            # 样式
│   │   ├── global.css
│   │   └── variables.css
│   ├── assets/            # 静态资源
│   │   ├── images/
│   │   └── icons/
│   └── App.tsx
├── public/                 # 公共资源
│   ├── index.html
│   └── favicon.ico
├── tests/                  # 测试文件
│   ├── unit/
│   ├── component/
│   └── e2e/
├── docs/                   # 文档
│   ├── api.md
│   └── architecture.md
├── .eslintrc.cjs
├── .prettierrc
├── jest.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 9.2 环境变量管理

**环境变量管理**：

```javascript
// 环境变量管理
// 1. 创建环境变量文件
// .env.development
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=MyApp
VITE_DEBUG=true

// .env.production
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyApp
VITE_DEBUG=false

// 2. 在代码中使用
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// 3. 类型定义
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 9.3 代码组织

**代码组织最佳实践**：

```typescript
// 1. 组件组织
// 按功能组织
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx
│   ├── Input.test.tsx
│   ├── Input.stories.tsx
│   └── index.ts

// 2. Hook组织
// 按功能组织
hooks/
├── useCounter.ts
├── useDebounce.ts
├── useFetch.ts
└── index.ts

// 3. 工具函数组织
// 按功能组织
utils/
├── api.ts
├── date.ts
├── validation.ts
└── index.ts

// 4. 类型定义组织
// 按功能组织
types/
├── user.ts
├── api.ts
└── index.ts
```

### 9.4 文档与注释

**文档与注释最佳实践**：

```typescript
// 1. 组件文档
/**
 * 按钮组件
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   点击我
 * </Button>
 * ```
 * 
 * @param variant - 按钮样式
 * @param size - 按钮大小
 * @param onClick - 点击事件
 * @param disabled - 是否禁用
 * @param children - 按钮内容
 */
const Button: React.FC<ButtonProps> = ({ ... }) => {
  // ...
};

// 2. 函数文档
/**
 * 获取用户信息
 * 
 * @param userId - 用户ID
 * @returns 用户信息
 * @throws {Error} 当用户不存在时抛出错误
 */
async function getUserInfo(userId: string): Promise<User> {
  // ...
}

// 3. 类型文档
/**
 * 用户接口
 * 
 * @property id - 用户ID
 * @property name - 用户名
 * @property email - 邮箱
 * @property avatar - 头像URL
 */
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// 4. 模块文档
/**
 * @module utils/api
 * @description API工具函数
 * 
 * @example
 * ```tsx
 * import { fetchUser, fetchPosts } from '@/utils/api';
 * 
 * const user = await fetchUser('1');
 * const posts = await fetchPosts();
 * ```
 */
```

---

## 10. 常见问题与解决方案

### 10.1 构建问题

**构建问题解决方案**：

```javascript
// 1. 构建速度慢
// 解决方案：
// - 使用Vite替代Webpack
// - 启用持久化缓存
// - 优化代码分割
// - 使用多线程压缩

// 2. 热更新慢
// 解决方案：
// - 使用Vite
// - 减少热更新模块数量
// - 使用HMR优化插件

// 3. 生产构建体积大
// 解决方案：
// - 启用Tree Shaking
// - 代码分割
// - 压缩优化
// - 图片优化
```

### 10.2 测试问题

**测试问题解决方案**：

```javascript
// 1. 测试覆盖率低
// 解决方案：
// - 增加单元测试
// - 增加组件测试
// - 增加E2E测试
// - 使用覆盖率报告

// 2. 测试运行慢
// 解决方案：
// - 并行运行测试
// - 使用内存文件系统
// - 优化测试环境

// 3. 测试不稳定
// 解决方案：
// - 使用act包装异步操作
// - 使用waitFor等待状态更新
// - 使用mock减少外部依赖
```

### 10.3 性能问题

**性能问题解决方案**：

```javascript
// 1. 首屏加载慢
// 解决方案：
// - 代码分割
// - 懒加载
// - 预加载
// - 优化图片

// 2. 运行时性能差
// 解决方案：
// - React.memo
// - useMemo
// - useCallback
// - 虚拟列表

// 3. Core Web Vitals不达标
// 解决方案：
// - 优化LCP
// - 优化CLS
// - 优化FID
// - 使用性能监控
```

### 10.4 类型问题

**类型问题解决方案**：

```typescript
// 1. 类型推断不准确
// 解决方案：
// - 明确类型注解
// - 使用泛型
// - 使用类型守卫

// 2. 类型冲突
// 解决方案：
// - 使用命名空间
// - 使用模块
// - 使用类型别名

// 3. 类型定义缺失
// 解决方案：
// - 创建类型定义
// - 使用declare
// - 使用类型断言
```

---

## 总结

本文档全面深入解析了React工程化、测试和性能调优，包括：

1. **React工程化概述**：工程化的重要性、2026年技术栈推荐、工程化最佳实践
2. **构建工具深度对比**：Webpack、Vite、Rspack、Turbopack深度解析
3. **TypeScript集成**：TypeScript配置、React TypeScript最佳实践、类型推断与泛型、高级类型技巧
4. **代码质量工具**：ESLint配置、Prettier配置、Husky与lint-staged、代码规范最佳实践
5. **React测试完整指南**：Jest配置、React Testing Library、组件测试、Hook测试、E2E测试
6. **React性能调优**：React.memo、useMemo、useCallback、虚拟列表、懒加载与代码分割、性能分析工具、Core Web Vitals
7. **React 19新特性**：Server Components、Server Actions、React Compiler、新的Hooks
8. **CI/CD集成**：GitHub Actions、GitLab CI、自动化测试、自动化部署
9. **工程化最佳实践**：项目结构、环境变量管理、代码组织、文档与注释
10. **常见问题与解决方案**：构建问题、测试问题、性能问题、类型问题

这些内容可以帮助你更好地理解和应用React工程化、测试和性能调优，掌握React的核心知识点。