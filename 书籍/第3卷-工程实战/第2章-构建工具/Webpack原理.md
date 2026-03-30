# 第3卷-工程实战

## 第2章 构建工具

### 2.1 Webpack核心原理

#### 2.1.1 工作流程

Webpack 的核心工作流程可以分为以下几个阶段：

```
输入 → 依赖分析 → 模块处理 → 代码生成 → 输出
  ↓
[模块解析] → [AST 分析] → [依赖图谱] → [打包合并]
```

**详细流程：**

1. **配置解析（Configuration）**
   - 读取 webpack.config.js 配置文件
   - 合并命令行参数
   - 验证配置合法性

2. **依赖构建（Dependency Management）**
   - 入口文件分析
   - 递归解析 import/require 语句
   - 构建完整的依赖图谱

3. **模块加载（Module Loading）**
   - 根据文件类型选择合适的 Loader
   - 对模块进行转换处理
   - 处理各类资源文件

4. **代码分割（Code Splitting）**
   - 分析代码结构
   - 识别公共依赖
   - 生成多个 chunk

5. **资源优化（Optimization）**
   - Tree Shaking 消除死代码
   - 代码压缩与混淆
   - 生成 Source Map

6. **输出生成（Emission）**
   - 根据 chunk 生成最终文件
   - 写入文件系统

#### 2.1.2 核心类与 API

```javascript
// webpack.config.js 完整示例
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    // 入口配置
    entry: {
      main: './src/index.js',
      vendor: './src/vendor.js'
    },

    // 输出配置
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction
        ? '[name].[contenthash].js'
        : '[name].js',
      chunkFilename: isProduction
        ? '[name].[contenthash].chunk.js'
        : '[name].chunk.js',
      clean: true
    },

    // 模块解析配置
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components')
      }
    },

    // 模块规则配置
    module: {
      rules: [
        // JavaScript/TypeScript
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  }
                }]
              ]
            }
          }
        },

        // CSS 处理
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },

        // 图片资源
        {
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024
            }
          }
        }
      ]
    },

    // 插件配置
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html'
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css'
      })
    ].filter(Boolean),

    // 优化配置
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin(),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10
          }
        }
      }
    },

    // 开发服务器配置
    devServer: {
      static: './dist',
      hot: true,
      port: 3000
    },

    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map'
  };
};
```

#### 2.1.3 Webpack 核心概念详解

**1. Entry（入口）**

入口是 Webpack 构建的起点：

```javascript
// 单一入口
entry: './src/index.js'

// 对象形式（多入口）
entry: {
  main: './src/index.js',
  admin: './src/admin.js'
}

// 动态入口
entry: () => new Promise(resolve => {
  if (process.env.ENTRY === 'admin') {
    resolve({ admin: './src/admin.js' });
  } else {
    resolve({ main: './src/index.js' });
  }
})
```

**2. Output（输出）**

输出配置告诉 Webpack 将打包后的文件放在哪里：

```javascript
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name].[contenthash].js',
  // 占位符说明：
  // [name] - chunk 名称
  // [id] - chunk id
  // [hash] - 构建 hash
  // [contenthash] - 内容 hash
  // [chunkhash] - chunk hash
}
```

**3. Loader（加载器）**

Loader 用于处理非 JavaScript 文件：

```javascript
// 常用 Loader
module: {
  rules: [
    // babel-loader - 转译 ES6+
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: 'babel-loader'
    },

    // ts-loader - TypeScript 支持
    {
      test: /\.ts$/,
      use: 'ts-loader'
    },

    // css-loader - 处理 CSS import
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }
  ]
}
```

**4. Plugin（插件）**

插件用于执行更广泛的任务：

```javascript
// 常用插件
plugins: [
  // 自动生成 HTML
  new HtmlWebpackPlugin({
    template: './src/index.html'
  }),

  // 提取 CSS
  new MiniCssExtractPlugin({
    filename: '[name].css'
  })
]
```

### 2.2 Webpack 高级特性

#### 2.2.1 模块联邦（Module Federation）

模块联邦是 Webpack 5 最重要的特性之一，它允许多个独立构建的应用共享代码：

```javascript
// 主机应用 - host/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        app1: 'app1@http://localhost:3001/remoteEntry.js'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ]
};

// 在应用中使用远程模块
import React from 'react';
const RemoteButton = React.lazy(() => import('app1/Button'));
```

```javascript
// 远程应用 - remote/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app1',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ]
};
```

#### 2.2.2 持久化缓存

```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    compression: 'gzip',
    hashAlgorithm: 'sha256',
    ttl: 604800000
  }
};
```

#### 2.2.3 资源模块

```javascript
module.exports = {
  module: {
    rules: [
      // asset/resource - 生成单独的文件
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: {
          filename: 'icons/[name].[hash:8][ext]'
        }
      },

      // asset/inline - 生成 Base64 内联
      {
        test: /\.svg$/,
        type: 'asset/inline'
      },

      // asset - 自动选择
      {
        test: /\.(png|jpg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024
          }
        }
      }
    ]
  }
};
```

#### 2.2.4 热模块替换（HMR）

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    hot: true
  }
};

// 检查模块是否支持 HMR
if (module.hot) {
  // 接受模块更新
  module.hot.accept('./logger', function() {
    const logger = require('./logger');
    console.log('模块已更新:', logger);
  });

  // 拒绝模块更新（回退到完全刷新）
  module.hot.decline('./logger');
}
```

### 2.3 Webpack 性能优化

#### 2.3.1 构建速度优化

```javascript
// 优化策略

// 1. 使用 cache
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },

  // 2. 并行处理
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          cacheCompression: false
        }
      }
    }]
  },

  // 3. 排除 node_modules
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      include: path.resolve(__dirname, 'src')
    }]
  },

  // 4. 使用 thread-loader 进行多进程处理
  module: {
    rules: [{
      test: /\.js$/,
      use: [
        {
          loader: 'thread-loader',
          options: { workers: 4 }
        },
        'babel-loader'
      ]
    }]
  }
};
```

#### 2.3.2 输出体积优化

```javascript
module.exports = {
  optimization: {
    // Tree Shaking
    usedExports: true,

    // 标记副作用
    sideEffects: true,

    // 压缩
    minimize: true,

    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },

    // 运行时分离
    runtimeChunk: 'single',

    // 模块 ID 优化
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  }
};
```

---

*本章节完*
