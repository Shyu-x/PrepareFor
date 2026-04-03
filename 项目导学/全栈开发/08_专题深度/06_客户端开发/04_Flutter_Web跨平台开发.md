# Flutter Web跨平台开发完全指南

## 前言：Flutter Web是什么

Flutter是Google开源的跨平台UI工具包，最初设计用于移动端（iOS和Android），后来扩展到Web、桌面甚至嵌入式系统。Flutter Web是Flutter的Web平台实现，它将Flutter代码编译为Web标准技术（HTML、CSS、JavaScript），可以运行在任何现代浏览器上。

**Flutter Web的核心特点：**
- 一次编写，多平台运行（Web、移动端、桌面）
- 使用Skia图形引擎进行高性能渲染
- 丰富的Widget体系，媲美原生体验
- 热重载支持，快速迭代开发
- 与Flutter移动端共享大部分代码

**Flutter Web的局限性：**
- 包体积较大（包含Flutter运行时）
- 不支持某些平台特定的原生功能
- 在低端设备上性能可能不如预期
- SEO支持有限（需要SSR处理）

本文将深入讲解Flutter Web的渲染原理、Widget体系、原生集成和性能优化。

---

## 一、渲染架构详解

### 1.1 Flutter Web渲染原理

Flutter Web有两种主要的渲染模式：CanvasKit渲染和HTML渲染。不同的渲染模式适用于不同的场景。

```
Flutter Web 渲染架构对比：

┌─────────────────────────────────────────────────────────────┐
│                    CanvasKit 渲染模式                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Flutter Engine                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Skia      │  │   WebGL     │  │   Canvas    │   │  │
│  │  │  (CPU)      │──│  (GPU)      │──│  2D API     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │       │                │                              │  │
│  │       ▼                ▼                              │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │          CanvasKit WASM/Skwasm               │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   <canvas> 元素                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    HTML 渲染模式                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Flutter Engine                      │  │
│  │  ┌─────────────┐  ┌─────────────┐                    │  │
│  │  │   Flutter   │──│   HTML     │                    │  │
│  │  │   Engine    │  │  Renderer  │                    │  │
│  │  └─────────────┘  └─────────────┘                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      DOM 元素组合 (div, span, p 等原生HTML标签)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**CanvasKit渲染器特点：**
- 使用WebAssembly编译的Skia引擎
- 渲染质量高，图形效果丰富
- 支持复杂的图形变换和动画
- 包体积较大（约2MB+）
- 适合游戏、图形密集型应用

**HTML渲染器特点：**
- 使用原生HTML/CSS渲染
- 包体积小（约500KB）
- SEO友好（生成可读的DOM结构）
- 渲染性能略低
- 适合内容展示型应用

```dart
// 在Flutter项目中选择渲染器
// web/renderer.json 或通过--dart-define指定

// 方式1：通过命令行参数指定
// flutter run -d chrome --web-renderer canvaskit

// 方式2：在代码中动态检测
import 'dart:html' as html;
import 'package:flutter/foundation.dart' show kIsWeb;

enum WebRenderer {
  html,
  canvaskit,
  auto,
}

WebRenderer getEffectiveRenderer(WebRenderer? preferred) {
  if (preferred == WebRenderer.auto) {
    // 自动选择：移动端用html，桌面端用canvaskit
    return html.window.navigator.userAgent.contains('Mobile')
        ? WebRenderer.html
        : WebRenderer.canvaskit;
  }
  return preferred ?? WebRenderer.html;
}
```

### 1.2 Flutter架构概述

Flutter采用分层架构，核心是Engine层，上面是Framework层。

```
Flutter 架构分层：

┌─────────────────────────────────────────────────────────────┐
│                        应用层 (Widgets)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Button    │  │   ListView  │  │   TextField │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │            ┌─────────────┐                           │  │
│  │            │   Material   │  Cupertino  等设计系统     │  │
│  │            └─────────────┘                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    框架层 (Framework)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Stateful  │  │   Render   │  │   Gesture    │   │  │
│  │  │   Widget    │  │   Object   │  │   System     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Layout    │  │   Painting  │  │   Animation │   │  │
│  │  │   System    │  │   System    │  │   System     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Engine (引擎层)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │    Skia     │  │   Dart VM   │  │   Text      │   │  │
│  │  │  Graphics   │  │   Runtime   │  │   Engine    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  平台嵌入层 (Platform Embedder)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Android   │  │     iOS     │  │    Web      │   │  │
│  │  │  Embedder   │  │  Embedder   │  │  Embedder   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、Widget体系详解

### 2.1 Widget概念

在Flutter中，一切皆Widget。Widget是描述UI如何展示的不可变描述对象。

```dart
// Flutter的Widget是声明式的，类似于React的组件
// 最重要的概念：Widget是immutable（不可变的）

import 'package:flutter/material.dart';

// 基础Widget示例
class BasicWidgetsDemo extends StatelessWidget {
  const BasicWidgetsDemo({super.key});

  @override
  Widget build(BuildContext context) {
    // build方法返回一个Widget树
    // MaterialApp是Material Design风格的根Widget
    return MaterialApp(
      title: 'Flutter Web 示例',
      theme: ThemeData(
        // 主题配置
        primarySwatch: Colors.blue,
        useMaterial3: true,  // 使用Material 3设计语言
      ),
      home: const HomePage(),
    );
  }
}

// 页面Widget
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Scaffold提供了Material Design的页面结构
      appBar: AppBar(
        title: const Text('首页'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: const Center(
        child: Text('Hello Flutter Web!'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          print('按钮点击');
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

### 2.2 核心Widget详解

```dart
import 'package:flutter/material.dart';

// Flutter Web常用Widget详解
class CoreWidgetsDemo extends StatelessWidget {
  const CoreWidgetsDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('核心Widget演示')),
        body: SingleChildScrollView(
          // SingleChildScrollView提供滚动能力
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              // ========== 1. Container ==========
              // 容器Widget，可以设置尺寸、背景、边框、padding等
              Text('1. Container 容器组件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              _ContainerDemo(),

              SizedBox(height: 24),

              // ========== 2. Row & Column ==========
              // Row是水平布局，Column是垂直布局
              Text('2. Row & Column 布局组件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              _RowColumnDemo(),

              SizedBox(height: 24),

              // ========== 3. Expanded & Flexible ==========
              // 用于分配剩余空间的Widget
              Text('3. Expanded & Flexible 弹性布局', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              _ExpandedDemo(),

              SizedBox(height: 24),

              // ========== 4. Stack & Positioned ==========
              // 层叠布局
              Text('4. Stack 层叠布局', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              _StackDemo(),

              SizedBox(height: 24),

              // ========== 5. ListView ==========
              // 可滚动列表
              Text('5. ListView 列表', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              _ListViewDemo(),
            ],
          ),
        ),
      ),
    );
  }
}

// Container演示
class _ContainerDemo extends StatelessWidget {
  const _ContainerDemo();

  @override
  Widget build(BuildContext context) {
    return Container(
      // 宽高设置
      width: 200,
      height: 100,
      // 内边距
      padding: const EdgeInsets.all(16),
      // 外边距
      margin: const EdgeInsets.symmetric(vertical: 8),
      // 装饰（背景色、边框、圆角、阴影）
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),  // 圆角
        border: Border.all(color: Colors.blue, width: 2),  // 边框
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      // 子元素对齐方式
      alignment: Alignment.center,
      child: const Text('Container示例'),
    );
  }
}

// Row & Column演示
class _RowColumnDemo extends StatelessWidget {
  const _RowColumnDemo();

  @override
  Widget build(BuildContext context) {
    return Column(
      // MainAxisAlignment控制主轴方向的对齐
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      // CrossAxisAlignment控制交叉轴方向的对齐
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Row示例
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: const [
            Icon(Icons.home, color: Colors.blue),
            Icon(Icons.search, color: Colors.green),
            Icon(Icons.settings, color: Colors.orange),
          ],
        ),
        const SizedBox(height: 16),
        // Column示例
        Container(
          height: 100,
          color: Colors.grey.shade200,
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('第一行'),
              Text('第二行'),
              Text('第三行'),
            ],
          ),
        ),
      ],
    );
  }
}

// Expanded & Flexible演示
class _ExpandedDemo extends StatelessWidget {
  const _ExpandedDemo();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      color: Colors.grey.shade200,
      child: Row(
        children: [
          // 固定宽度组件
          Container(
            width: 80,
            color: Colors.red,
            alignment: Alignment.center,
            child: const Text('固定80'),
          ),
          // Expanded：占据所有剩余空间
          Expanded(
            flex: 2,  // flex表示权重比例
            child: Container(
              color: Colors.green,
              alignment: Alignment.center,
              child: const Text('Expanded 2份'),
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              color: Colors.blue,
              alignment: Alignment.center,
              child: const Text('Expanded 1份'),
            ),
          ),
        ],
      ),
    );
  }
}

// Stack层叠布局演示
class _StackDemo extends StatelessWidget {
  const _StackDemo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150,
      child: Stack(
        children: [
          // 底层：背景
          Container(
            width: 200,
            height: 120,
            color: Colors.blue,
          ),
          // 中层：图片
          Positioned(
            left: 16,
            top: 16,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
          // 顶层：文字
          const Positioned(
            left: 90,
            top: 30,
            child: Text(
              '叠加内容',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
          ),
        ],
      ),
    );
  }
}

// ListView演示
class _ListViewDemo extends StatelessWidget {
  const _ListViewDemo();

  @override
  Widget build(BuildContext context) {
    // 方式1：ListView.builder（推荐，用于大数据量）
    return SizedBox(
      height: 150,
      child: ListView.builder(
        // itemCount指定列表项数量
        itemCount: 20,
        // itemBuilder生成每个列表项
        itemBuilder: (context, index) {
          return ListTile(
            // leading：左侧图标
            leading: CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              child: Text('${index + 1}'),
            ),
            // title：主标题
            title: Text('列表项 ${index + 1}'),
            // subtitle：副标题
            subtitle: const Text('这是副标题'),
            // trailing：右侧内容
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            // onTap点击事件
            onTap: () {
              print('点击了第${index + 1}项');
            },
          );
        },
      ),
    );
  }
}
```

### 2.3 有状态Widget

Flutter中有两种Widget：StatelessWidget（无状态）和StatefulWidget（有状态）。

```dart
import 'package:flutter/material.dart';

// StatefulWidget示例：计数器
class CounterApp extends StatefulWidget {
  const CounterApp({super.key});

  @override
  State<CounterApp> createState() => _CounterAppState();
}

class _CounterAppState extends State<CounterApp> {
  // 定义状态变量
  int _counter = 0;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('计数器应用'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 显示计数
            Text(
              '计数: $_counter',
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            // 异步操作示例
            if (_isLoading)
              const CircularProgressIndicator()
            else
              ElevatedButton(
                onPressed: _incrementCounter,
                child: const Text('增加计数'),
              ),
          ],
        ),
      ),
    );
  }

  // 增加计数的方法
  void _incrementCounter() async {
    // 显示加载状态
    setState(() {
      _isLoading = true;
    });

    // 模拟异步操作
    await Future.delayed(const Duration(seconds: 1));

    // 更新状态（触发UI重建）
    setState(() {
      _counter++;
      _isLoading = false;
    });
  }
}

// 更好的方式：使用setState的完整回调
class CounterAppBetter extends StatefulWidget {
  const CounterAppBetter({super.key});

  @override
  State<CounterAppBetter> createState() => _CounterAppBetterState();
}

class _CounterAppBetterState extends State<CounterAppBetter> {
  int _counter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('计数器')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 减少按钮
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  iconSize: 48,
                  onPressed: () {
                    setState(() {
                      _counter--;
                    });
                  },
                ),
                const SizedBox(width: 20),
                // 增加按钮
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  iconSize: 48,
                  color: Colors.blue,
                  onPressed: () {
                    setState(() {
                      _counter++;
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
            // 重置按钮
            TextButton(
              onPressed: () {
                setState(() {
                  _counter = 0;
                });
              },
              child: const Text('重置'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 2.4 Material Design 3组件

Flutter内置了Material Design 3组件库，提供了丰富的UI组件。

```dart
import 'package:flutter/material.dart';

class MaterialComponentsDemo extends StatelessWidget {
  const MaterialComponentsDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        // Material 3颜色主题
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Material 3 组件演示'),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ===== 按钮组件 =====
            const Text('按钮组件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // ElevatedButton：凸起按钮
            ElevatedButton(
              onPressed: () {},
              child: const Text('ElevatedButton'),
            ),
            const SizedBox(height: 8),

            // FilledButton：填充按钮
            FilledButton(
              onPressed: () {},
              child: const Text('FilledButton'),
            ),
            const SizedBox(height: 8),

            // OutlinedButton：描边按钮
            OutlinedButton(
              onPressed: () {},
              child: const Text('OutlinedButton'),
            ),
            const SizedBox(height: 8),

            // TextButton：文本按钮
            TextButton(
              onPressed: () {},
              child: const Text('TextButton'),
            ),
            const SizedBox(height: 8),

            // IconButton：图标按钮
            IconButton(
              icon: const Icon(Icons.thumb_up),
              onPressed: () {},
            ),

            const Divider(height: 32),

            // ===== 输入组件 =====
            const Text('输入组件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // TextField：单行文本输入
            TextField(
              decoration: const InputDecoration(
                labelText: '用户名',
                hintText: '请输入用户名',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) {
                print('输入: $value');
              },
            ),
            const SizedBox(height: 12),

            // TextField：多行文本输入
            TextField(
              decoration: const InputDecoration(
                labelText: '描述',
                hintText: '请输入描述',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,  // 最大行数
            ),
            const SizedBox(height: 12),

            // TextField：密码输入
            TextField(
              decoration: const InputDecoration(
                labelText: '密码',
                prefixIcon: Icon(Icons.lock),
                border: OutlineInputBorder(),
              ),
              obscureText: true,  // 隐藏文字
            ),

            const Divider(height: 32),

            // ===== 卡片组件 =====
            const Text('卡片组件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Card(
              // elevation：阴影深度
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '卡片标题',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text('这是卡片的内容区域，可以包含任意的Flutter组件。'),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () {},
                          child: const Text('取消'),
                        ),
                        FilledButton(
                          onPressed: () {},
                          child: const Text('确认'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const Divider(height: 32),

            // ===== 对话框 =====
            const Text('对话框', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // AlertDialog
            ElevatedButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('确认'),
                    content: const Text('确定要执行此操作吗？'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('取消'),
                      ),
                      FilledButton(
                        onPressed: () {
                          Navigator.pop(context);
                          print('确认操作');
                        },
                        child: const Text('确定'),
                      ),
                    ],
                  ),
                );
              },
              child: const Text('显示AlertDialog'),
            ),
            const SizedBox(height: 8),

            // BottomSheet：底部弹出面板
            ElevatedButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  builder: (context) => Container(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          '底部弹出面板',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        const Text('这是一个从底部弹出的面板，常用于展示更多操作选项。'),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('关闭'),
                        ),
                      ],
                    ),
                  ),
                );
              },
              child: const Text('显示BottomSheet'),
            ),

            const Divider(height: 32),

            // ===== Chip组件 =====
            const Text('Chip组件（标签）', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Wrap(
              // Wrap允许chips换行
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: const Text('Flutter'),
                  avatar: const Icon(Icons.flutter_dash, size: 18),
                ),
                Chip(
                  label: const Text('Dart'),
                  avatar: const Icon(Icons.code, size: 18),
                ),
                Chip(
                  label: const Text('Web'),
                  onDeleted: () {
                    print('删除Web');
                  },
                ),
                const Chip(
                  label: Text('可选择'),
                  selected: true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 三、响应式布局

### 3.1 LayoutBuilder与响应式设计

Flutter Web需要处理各种屏幕尺寸，需要使用响应式布局技术。

```dart
import 'package:flutter/material.dart';

// 响应式布局示例
class ResponsiveLayoutDemo extends StatelessWidget {
  const ResponsiveLayoutDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('响应式布局'),
      ),
      body: LayoutBuilder(
        // LayoutBuilder可以获取父容器的约束
        builder: (context, constraints) {
          // 根据宽度判断布局方式
          if (constraints.maxWidth < 600) {
            // 手机布局：单列
            return _MobileLayout();
          } else if (constraints.maxWidth < 900) {
            // 平板布局：两列
            return _TabletLayout();
          } else {
            // 桌面布局：三列
            return _DesktopLayout();
          }
        },
      ),
    );
  }
}

// 手机布局
class _MobileLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildCard('手机模式', '单列布局，适合窄屏幕'),
        _buildCard('宽度 < 600px', '自动切换到移动端布局'),
        _buildCard('堆叠显示', '所有内容垂直排列'),
      ],
    );
  }
}

// 平板布局
class _TabletLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // 左侧边栏
          Container(
            width: 200,
            color: Colors.grey.shade200,
            padding: const EdgeInsets.all(16),
            child: const Text(
              '侧边栏',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 16),
          // 右侧内容
          Expanded(
            child: Column(
              children: [
                _buildCard('平板模式', '两列布局'),
                _buildCard('宽度 600-900px', '侧边栏 + 内容区'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 桌面布局
class _DesktopLayout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // 左侧边栏
          Container(
            width: 200,
            color: Colors.blue.shade100,
            padding: const EdgeInsets.all(16),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '导航',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 12),
                Text('• 首页'),
                Text('• 关于'),
                Text('• 联系'),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // 主内容区
          Expanded(
            flex: 2,
            child: Column(
              children: [
                _buildCard('桌面模式', '三列布局'),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // 右侧边栏
          Container(
            width: 200,
            color: Colors.green.shade100,
            padding: const EdgeInsets.all(16),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '信息',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 12),
                Text('宽度 > 900px'),
                Text('三列布局'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 辅助函数：创建卡片
Widget _buildCard(String title, String subtitle) {
  return Card(
    margin: const EdgeInsets.only(bottom: 12),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: Colors.grey.shade600)),
        ],
      ),
    ),
  );
}
```

### 3.2 自定义响应式工具类

```dart
import 'package:flutter/material.dart';

// 响应式断点定义
class Breakpoints {
  // 移动端
  static const double mobile = 600;
  // 平板
  static const double tablet = 900;
  // 桌面
  static const double desktop = 1200;
}

// 屏幕尺寸辅助函数
class ScreenUtils {
  // 获取当前屏幕类型
  static ScreenType getScreenType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width < Breakpoints.mobile) {
      return ScreenType.mobile;
    } else if (width < Breakpoints.tablet) {
      return ScreenType.tablet;
    } else {
      return ScreenType.desktop;
    }
  }

  // 是否是移动端
  static bool isMobile(BuildContext context) {
    return getScreenType(context) == ScreenType.mobile;
  }

  // 是否是平板
  static bool isTablet(BuildContext context) {
    return getScreenType(context) == ScreenType.tablet;
  }

  // 是否是桌面
  static bool isDesktop(BuildContext context) {
    return getScreenType(context) == ScreenType.desktop;
  }

  // 获取屏幕宽度
  static double getWidth(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  // 获取屏幕高度
  static double getHeight(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }
}

enum ScreenType { mobile, tablet, desktop }

// 响应式Builder Widget
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, ScreenType screenType) builder;

  const ResponsiveBuilder({super.key, required this.builder});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenType = ScreenUtils.getScreenType(context);
        return builder(context, screenType);
      },
    );
  }
}

// 使用示例
class ResponsivePage extends StatelessWidget {
  const ResponsivePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('响应式页面')),
      body: ResponsiveBuilder(
        builder: (context, screenType) {
          switch (screenType) {
            case ScreenType.mobile:
              return _MobileView();
            case ScreenType.tablet:
              return _TabletView();
            case ScreenType.desktop:
              return _DesktopView();
          }
        },
      ),
    );
  }
}

class _MobileView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('移动端视图'));
  }
}

class _TabletView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('平板视图'));
  }
}

class _DesktopView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('桌面视图'));
  }
}
```

---

## 四、原生集成与Web API

### 4.1 Web API访问

Flutter Web可以访问标准的Web API，如Web Storage、Geolocation等。

```dart
import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter/foundation.dart' show kIsWeb;

// Web Storage使用
class WebStorageDemo extends StatelessWidget {
  const WebStorageDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Web存储')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // LocalStorage
            ElevatedButton(
              onPressed: () => _saveToLocalStorage(),
              child: const Text('保存到LocalStorage'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => _readFromLocalStorage(),
              child: const Text('读取LocalStorage'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => _clearLocalStorage(),
              child: const Text('清除LocalStorage'),
            ),
            const SizedBox(height: 24),
            // SessionStorage
            ElevatedButton(
              onPressed: () => _saveToSessionStorage(),
              child: const Text('保存到SessionStorage'),
            ),
          ],
        ),
      ),
    );
  }

  void _saveToLocalStorage() {
    if (kIsWeb) {
      // 使用dart:html访问LocalStorage
      html.window.localStorage['key'] = 'value';
      html.window.localStorage['user'] = '{"name":"张三"}';
      print('已保存到LocalStorage');
    }
  }

  void _readFromLocalStorage() {
    if (kIsWeb) {
      final value = html.window.localStorage['key'];
      final userJson = html.window.localStorage['user'];
      print('读取到: $value, $userJson');
    }
  }

  void _clearLocalStorage() {
    if (kIsWeb) {
      html.window.localStorage.clear();
      print('已清除LocalStorage');
    }
  }

  void _saveToSessionStorage() {
    if (kIsWeb) {
      html.window.sessionStorage['session'] = 'data';
      print('已保存到SessionStorage');
    }
  }
}

// Geolocation使用
class GeolocationDemo extends StatefulWidget {
  const GeolocationDemo({super.key});

  @override
  State<GeolocationDemo> createState() => _GeolocationDemoState();
}

class _GeolocationDemoState extends State<GeolocationDemo> {
  String _locationInfo = '点击按钮获取位置';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('地理位置')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_locationInfo),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _getLocation,
              child: const Text('获取位置'),
            ),
          ],
        ),
      ),
    );
  }

  void _getLocation() {
    if (!kIsWeb) {
      setState(() {
        _locationInfo = '非Web环境';
      });
      return;
    }

    // 检查浏览器是否支持Geolocation
    if (html.window.navigator.geolocation != null) {
      // 请求位置权限
      html.window.navigator.geolocation!.getCurrentPosition(
        // 成功回调
        (position) {
          setState(() {
            _locationInfo = '纬度: ${position.coords!.latitude}\n'
                '经度: ${position.coords!.longitude}';
          });
        },
        // 错误回调
        (error) {
          setState(() {
            _locationInfo = '获取位置失败: ${error.message}';
          });
        },
        // 选项
        {'enableHighAccuracy': true, 'timeout': 5000},
      );
    } else {
      setState(() {
        _locationInfo = '浏览器不支持地理位置';
      });
    }
  }
}

// 使用dart:js_interop（新版Flutter推荐方式）
import 'dart:js_interop';

class JSDartInteropDemo extends StatelessWidget {
  const JSDartInteropDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('JS互操作')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _callJSFunction(),
          child: const Text('调用JavaScript函数'),
        ),
      ),
    );
  }

  void _callJSFunction() {
    if (kIsWeb) {
      // 使用JS互操作调用JavaScript
      final result = js.context.callMethod('eval', ['1 + 2'.toJS].toJS);
      print('JS返回结果: $result');
    }
  }
}
```

### 4.2 条件导入

Flutter Web需要处理平台特定代码时，可以使用条件导入。

```dart
// platform_utils.dart
// 条件导入：根据平台导入不同的实现

import 'platform_utils_stub.dart'
    if (dart.library.html) 'platform_utils_web.dart'
    if (dart.library.io) 'platform_utils_native.dart';

// 平台无关的接口
abstract class PlatformUtils {
  String getPlatformName();
  bool supportsCamera();
  Future<void> share(String text);
}

// Web实现
// platform_utils_web.dart
import 'dart:html' as html;
import 'platform_utils.dart';

class PlatformUtilsImpl implements PlatformUtils {
  @override
  String getPlatformName() => 'Web';

  @override
  bool supportsCamera() => true;

  @override
  Future<void> share(String text) async {
    // Web分享API（如果支持）
    if (html.window.navigator.share != null) {
      await html.window.navigator.share!({'text': text});
    } else {
      // 降级：复制到剪贴板
      await html.window.navigator.clipboard.writeText(text);
    }
  }
}

// 原生实现（移动端/桌面）
// platform_utils_native.dart
import 'platform_utils.dart';
// import 'package:flutter/services.dart';

class PlatformUtilsImpl implements PlatformUtils {
  @override
  String getPlatformName() => 'Native';

  @override
  bool supportsCamera() => true;

  @override
  Future<void> share(String text) async {
    // 使用share_plus插件
    // await Share.share(text);
  }
}

// 存根实现
// platform_utils_stub.dart
import 'platform_utils.dart';

PlatformUtilsImpl createPlatformUtils() => throw UnsupportedError(
    'Cannot create PlatformUtilsImpl without dart:html or dart:io');
```

---

## 五、路由与导航

### 5.1 GoRouter路由

GoRouter是Flutter官方推荐的路由解决方案，支持声明式路由。

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// 定义路由配置
final GoRouter router = GoRouter(
  // 初始路由
  initialLocation: '/',
  // 路由列表
  routes: [
    // 首页
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomePage(),
    ),
    // 详情页（带参数）
    GoRoute(
      path: '/product/:id',
      name: 'product',
      builder: (context, state) {
        // 获取路由参数
        final productId = state.pathParameters['id'];
        return ProductPage(productId: productId!);
      },
    ),
    // 用户页面
    GoRoute(
      path: '/user/:userId',
      name: 'user',
      builder: (context, state) {
        final userId = state.pathParameters['userId'];
        return UserPage(userId: userId!);
      },
      routes: [
        // 用户子路由
        GoRoute(
          path: 'posts',
          name: 'user-posts',
          builder: (context, state) {
            final userId = state.pathParameters['userId'];
            return UserPostsPage(userId: userId!);
          },
        ),
      ],
    ),
    // 重定向示例
    GoRoute(
      path: '/old-path',
      redirect: (context, state) => '/new-path',
    ),
  ],
  // 错误处理
  errorBuilder: (context, state) => ErrorPage(error: state.error),
);

// 页面组件
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('首页')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('产品1'),
            onTap: () => context.push('/product/1'),
          ),
          ListTile(
            title: const Text('产品2'),
            onTap: () => context.push('/product/2'),
          ),
          ListTile(
            title: const Text('用户页面'),
            onTap: () => context.push('/user/123'),
          ),
        ],
      ),
    );
  }
}

class ProductPage extends StatelessWidget {
  final String productId;

  const ProductPage({super.key, required this.productId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('产品 $productId')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('产品ID: $productId'),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => context.pop(),  // 返回上一页
              child: const Text('返回'),
            ),
          ],
        ),
      ),
    );
  }
}

class UserPage extends StatelessWidget {
  final String userId;

  const UserPage({super.key, required this.userId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('用户 $userId')),
      body: Column(
        children: [
          Text('用户ID: $userId'),
          ElevatedButton(
            onPressed: () => context.push('/user/$userId/posts'),
            child: const Text('查看用户帖子'),
          ),
        ],
      ),
    );
  }
}

class UserPostsPage extends StatelessWidget {
  final String userId;

  const UserPostsPage({super.key, required this.userId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('$userId 的帖子')),
      body: const Center(child: Text('帖子列表')),
    );
  }
}

class ErrorPage extends StatelessWidget {
  final GoRouterError? error;

  const ErrorPage({super.key, this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('错误')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('页面未找到', style: TextStyle(fontSize: 24)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('返回首页'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 六、性能优化

### 6.1 Web性能优化策略

```dart
import 'package:flutter/material.dart';

// 性能优化示例

// 1. 避免不必要的重建
class OptimizedListItem extends StatelessWidget {
  final String title;
  final VoidCallback onTap;

  const OptimizedListItem({
    super.key,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title),
      onTap: onTap,
    );
  }
}

// 2. 使用const构造函数
class ConstWidgetDemo extends StatelessWidget {
  // 尽可能使用const
  static const double _padding = 16.0;
  static const Color _backgroundColor = Colors.blue;

  const ConstWidgetDemo({super.key});

  @override
  Widget build(BuildContext context) {
    // const可以减少widget树的重建
    return Container(
      padding: const EdgeInsets.all(_padding),  // const
      color: _backgroundColor,  // const
      child: const Text('这是一个常量组件'),
    );
  }
}

// 3. 合理使用RepaintBoundary
class RepaintBoundaryDemo extends StatelessWidget {
  const RepaintBoundaryDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 静态内容使用RepaintBoundary隔离
        const RepaintBoundary(
          child: Text('这段文字很少变化'),
        ),
        // 动态内容
        AnimatedCounter(),
      ],
    );
  }
}

// 4. 懒加载视图
class LazyLoadDemo extends StatelessWidget {
  const LazyLoadDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      // 限制列表项高度以提高性能
      itemExtent: 50,  // 固定高度列表，禁用动态测量
      itemCount: 1000,
      itemBuilder: (context, index) {
        return ListTile(title: Text('Item $index'));
      },
    );
  }
}

// 5. 使用CachedNetworkImage优化图片加载
// 在pubspec.yaml中添加依赖
// cached_network_image: ^3.3.0
// 然后在代码中使用

// 6. 合理的状态管理策略
class EfficientStateManagement extends StatefulWidget {
  const EfficientStateManagement({super.key});

  @override
  State<EfficientStateManagement> createState() => _EfficientStateManagementState();
}

class _EfficientStateManagementState extends State<EfficientStateManagement> {
  int _counter = 0;

  @override
  Widget build(BuildContext context) {
    // 只更新需要更新的部分
    return Column(
      children: [
        // 只有counter变化时重建
        Text('计数: $_counter'),
        // 使用Builder隔离重建范围
        Builder(
          builder: (context) {
            // 这个Button的父组件变化时不会导致Button重建
            return ElevatedButton(
              onPressed: () {
                setState(() {
                  _counter++;
                });
              },
              child: const Text('增加'),
            );
          },
        ),
      ],
    );
  }
}
```

### 6.2 构建优化

```yaml
# pubspec.yaml - Flutter Web构建配置

dependencies:
  flutter:
    sdk: flutter

  # web优化相关依赖
  cached_network_image: ^3.3.0
  flutter_cache_manager: ^3.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

# web特定配置
flutter:
  uses-material-design: true

  # 资源文件
  assets:
    - assets/images/
    - assets/data/

  # 字体（用于减小包体积）
  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700
```

```bash
# Flutter Web构建命令

# 开发模式运行
flutter run -d chrome

# 指定CanvasKit渲染器
flutter run -d chrome --web-renderer canvaskit

# 指定HTML渲染器
flutter run -d chrome --web-renderer html

# 生产构建（自动选择最佳渲染器）
flutter build web

# 指定渲染器构建
flutter build web --web-renderer canvaskit
flutter build web --web-renderer html

# 开启tree-shaking优化
flutter build web --pprofile

# 查看构建大小分析
flutter build web --release
# 分析会在 build/web/index.html 同目录生成
```

---

## 七、打包与部署

### 7.1 构建输出结构

```
build/web/
├── index.html          # Web入口HTML
├── main.dart.js        # 编译后的Dart代码
├── flutter.js          # Flutter Web运行时
├── flutter_worker.js   # Service Worker（如果启用）
├── assets/             # 静态资源
│   ├── fonts/         # 字体文件
│   └── images/         # 图片资源
├── canvaskit/          # CanvasKit渲染器（如使用）
│   └── skwasm.wasm
└── version.json        # Flutter版本信息
```

### 7.2 部署配置

```html
<!-- build/web/index.html - 自定义配置 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Flutter Web应用描述">
  <meta name="theme-color" content="#2196F3">

  <!-- 预连接优化 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">

  <title>Flutter Web应用</title>

  <!-- PWA相关 -->
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/Icon-192.png">

  <style>
    /* 加载指示器样式 */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <!-- 加载指示器 -->
  <div class="loading" id="loading">
    <flutter></flutter>
  </div>

  <script>
    // Flutter Web加载完成后移除加载指示器
    window.addEventListener('flutter-first-frame', function() {
      var loading = document.getElementById('loading');
      if (loading) {
        loading.remove();
      }
    });
  </script>

  <!-- Flutter SDK -->
  <script src="flutter.js" defer></script>
</body>
</html>
```

```json
// build/web/manifest.json - PWA配置
{
  "name": "Flutter Web应用",
  "short_name": "FlutterApp",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "description": "基于Flutter Web的应用",
  "icons": [
    {
      "src": "icons/Icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/Icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 总结

Flutter Web是一个强大的跨平台Web开发框架，具有以下特点：

**核心优势：**
- 一次编写，多平台运行（Web、iOS、Android、桌面）
- 丰富的Widget体系和Material Design 3支持
- 高性能的Skia图形引擎（CanvasKit模式）
- 良好的热重载和开发体验
- 与Flutter移动端共享大量代码

**适用场景：**
- 需要同时支持Web和移动端的应用
- 对UI一致性和美观度有较高要求
- 复杂交互和动画需求
- 快速原型开发和迭代

**需要注意：**
- 包体积相对较大（特别是CanvasKit模式）
- SEO需要额外处理（SSR）
- 部分Web API需要条件导入
- 在低端设备上性能可能不如原生Web

Flutter Web正在快速发展，Google对其投入持续增加，未来有望成为跨平台Web开发的重要选择。
