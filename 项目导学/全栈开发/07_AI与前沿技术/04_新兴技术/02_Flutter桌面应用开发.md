# Flutter 桌面应用开发完全指南

## 前言：Flutter 是什么？

想象一下，你要开一家连锁餐厅。每家餐厅都要有相同的菜品、服务和装修风格。传统做法是每开一家新店都要重新装修一次（开发多套原生应用）。

Flutter 的出现就像引入了"标准化模块"：你只需要设计一次厨房和服务流程，就可以快速复制到全国各地，而且品质完全一致。

Flutter 是 Google 推出的跨平台 UI 框架，可以用**一套代码**同时运行在 iOS、Android、Web、 Windows、macOS、Linux 等平台上。它的目标是让开发者能够"一次编写，到处运行"。

### Flutter 的核心特点

| 特点 | 说明 | 优势 |
|------|------|------|
| 跨平台 | 一套代码，多端运行 | 减少开发成本 |
| 原生性能 | 直接编译为原生机器码 | 无需解释执行 |
| 热重载 | 修改代码即时预览 | 开发效率高 |
| 丰富的组件库 | Material/Cupertino 组件 | UI 美观一致 |
| Skia 渲染 | 自带高性能 2D 图形引擎 | 统一的视觉效果 |

## 一、Flutter 桌面版架构深度解析

### 1.1 Flutter 架构概览

Flutter 的架构分为三层：

```
┌─────────────────────────────────────────────────┐
│                   Flutter 应用层                │
│            （你的代码：Widget 树）               │
├─────────────────────────────────────────────────┤
│                  Flutter Framework              │
│   Widget(组件) │ Rendering(渲染) │ Animation(动画) │
├─────────────────────────────────────────────────┤
│                    Engine 层                     │
│   Skia图形引擎 │ Dart运行时 │ 文本渲染 │ 异步事件  │
├─────────────────────────────────────────────────┤
│                  Shell 层                        │
│   平台通道(Platform Channels) │ 嵌入层(Embedder)  │
├─────────────────────────────────────────────────┤
│                Windows/macOS/Linux               │
│              (原生操作系统和硬件)                │
└─────────────────────────────────────────────────┘
```

**工作原理解释**：
- **你的代码**：使用 Dart 语言编写，构建 Widget 树
- **Framework**：处理 UI 逻辑、布局、渲染
- **Engine**：核心渲染引擎（Skia），Dart 运行时
- **Shell/Embedder**：连接原生系统和 Flutter 的桥梁

### 1.2 Skia 图形引擎：Flutter 的秘密武器

Skia 是 Google 的 2D 图形库，Flutter 使用它来实现跨平台的一致渲染效果。

**为什么 Skia 这么重要？**

传统跨平台框架的痛点：

```
其他框架：
iOS → CoreGraphics → 原生 UI
Android → Canvas → 原生 UI
Windows → GDI/DirectX → 原生 UI
↓
不同平台渲染不一致！

Flutter + Skia：
所有平台 → Skia → 统一渲染
↓
视觉效果完全一致！
```

**Skia 的核心能力：**

| 能力 | 说明 | 应用场景 |
|------|------|----------|
| 矢量渲染 | 抗锯齿矢量图形 | 图标、按钮、图表 |
| 位图渲染 | 图像缩放、旋转 | 图片处理 |
| 文本渲染 | 高级排版、字距调整 | 富文本阅读 |
| 硬件加速 | GPU 加速渲染 | 动画、游戏 |
| 路径操作 | 复杂的形状和裁剪 | 自定义图形 |

### 1.3 Platform Channel：Dart 与原生的桥梁

Dart 代码和原生代码（Swift/Kotlin/C++）通过 Platform Channel 进行通信。

```
┌─────────────────┐          异步消息           ┌─────────────────┐
│     Dart 端     │ ←────────────────────────→ │    原生端        │
│                 │                             │                 │
│  MethodChannel  │     JSON 编码的消息         │  Swift/Kotlin   │
│  Future<*> result│                            │  onMethodCall   │
│      ↓          │                             │       ↓         │
│  codec.encode() │ ──────────────────────────→│  codec.decode() │
└─────────────────┘                             └─────────────────┘
```

**使用场景**：
- 调用系统 API（如获取电池电量、摄像头权限）
- 使用原生 SDK（如第三方支付、推送服务）
- 访问特定平台硬件（如串口通信、蓝牙）

## 二、环境配置与项目创建

### 2.1 Windows 桌面开发环境配置

**前置要求：**

```bash
# 1. 安装 Git（用于版本控制）
# 下载地址：https://git-scm.com/download/win

# 2. 安装 Visual Studio Build Tools
# 下载地址：https://visualstudio.microsoft.com/downloads/
# 选择 "C++ 桌面开发" workload

# 3. 安装 CMake（某些原生插件需要）
# 下载地址：https://cmake.org/download/
```

**安装 Flutter SDK：**

```bash
# 方法一：从官网下载
# 1. 下载 flutter_windows_xxx_stable.zip
# 2. 解压到合适的位置（如 D:\flutter）
# 3. 添加到系统 PATH

# 方法二：使用 git 克隆
git clone https://github.com/flutter/flutter.git -b stable

# 验证安装
flutter --version
```

**启用 Windows 桌面支持：**

```powershell
# 启用 Windows 桌面开发
flutter config --enable-windows-desktop

# 检查配置
flutter doctor

# 运行 flutter doctor 应该看到：
# [✓] Windows 10/11 Development Kit
# [✓] Visual Studio - develop Windows apps
```

### 2.2 macOS 桌面开发环境配置

**前置要求：**

```bash
# 1. 安装 Xcode（从 App Store）
# 2. 安装 CocoaPods（包管理器）
sudo gem install cocoapods

# 3. 配置 Xcode 命令行工具
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**安装 Flutter：**

```bash
# 克隆 Flutter
git clone https://github.com/flutter/flutter.git -b stable

# 配置 PATH（添加到 ~/.zshrc 或 ~/.bash_profile）
export PATH="$PATH:/Users/xxx/flutter/bin"

# 启用 macOS 桌面支持
flutter config --enable-macos-desktop

# 检查开发环境
flutter doctor
```

### 2.3 Linux 桌面开发环境配置

**在 Ubuntu/Debian 上：**

```bash
# 安装依赖
sudo apt update
sudo apt install clang cmake ninja-build pkg-config
sudo apt install libgtk-3-dev liblzma-dev libstdc++-12-dev

# 安装 Flutter
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:$HOME/flutter/bin"

# 启用 Linux 桌面支持
flutter config --enable-linux-desktop

# 检查环境
flutter doctor
```

### 2.4 创建桌面项目

```bash
# 创建新项目（指定平台）
flutter create --platforms=windows,macos,linux my_desktop_app

# 进入项目目录
cd my_desktop_app

# 运行应用（开发模式，热重载可用）
flutter run -d windows   # Windows
flutter run -d macos    # macOS
flutter run -d linux     # Linux

# 或者使用指定设备
flutter devices         # 查看可用设备
flutter run -d <device-id>
```

**项目结构：**

```
my_desktop_app/
├── lib/
│   ├── main.dart        # 应用入口
│   ├── app.dart         # 应用主组件
│   └── ...              # 其他 Dart 代码
├── windows/             # Windows 原生代码
│   ├── CMakeLists.txt
│   ├── runner/
│   │   ├── main.cpp     # Windows 入口
│   │   └── my_desktop_app.cpp  # 原生窗口代码
│   └── my_desktop_app.sln
├── macos/               # macOS 原生代码
│   ├── Runner/
│   │   ├── main.swift   # macOS 入口
│   │   └── AppDelegate.swift
├── linux/               # Linux 原生代码
│   ├── my_desktop_app/
│   │   ├── main.cc      # Linux 入口
│   │   └── my_desktop_app.cc
└── pubspec.yaml         # 项目依赖配置
```

## 三、Dart 语言核心概念

### 3.1 Dart vs JavaScript：核心差异

如果你熟悉 JavaScript，学习 Dart 会很快，但要注意一些关键区别：

**1. 类型系统：Dart 是静态类型**

```dart
// Dart：变量类型是固定的
String name = '张三';    // ✅ 正确
name = 123;              // ❌ 编译错误！

// JavaScript：变量类型可以改变
let name = '张三';       // string
name = 123;              // 合法，但容易出错
```

**2. 空安全：Dart 有严格的空检查**

```dart
// Dart：默认不可为空
String name = '张三';    // 不能是 null
String? nullableName;    // 添加 ? 表示可以为 null

// 使用前必须检查
void greet(String? name) {
    if (name != null) {
        print('Hello, $name'); // 编译器知道这里 name 不为空
    }
}

// JavaScript：可以随意为 null
function greet(name) {
    console.log('Hello, ' + name); // name 可能是 undefined
}
```

**3. 面向对象：Dart 的类系统更纯粹**

```dart
// 所有变量都是对象（包括函数）
int count = 10;  // int 是 Dart 内置类的实例

// 类定义
class Person {
    // 构造函数
    Person(this.name, this.age);

    // 命名构造函数
    Person.guest() : name = '匿名', age = 0;

    // 实例变量
    String name;
    int age;

    // 方法
    void introduce() {
        print('我是 $name，今年 $age 岁');
    }
}

// 使用
void main() {
    var person = Person('李四', 25);
    person.introduce();

    var guest = Person.guest();
    guest.introduce();
}
```

### 3.2 Dart 异步编程

Dart 使用 `Future` 和 `async/await` 进行异步编程，和 JavaScript 非常相似：

```dart
// 模拟异步操作（类似 JavaScript 的 Promise）
Future<String> fetchUserData() async {
    // 模拟网络延迟
    await Future.delayed(Duration(seconds: 2));
    return '用户数据：张三，28岁';
}

// 使用 async/await
Future<void> loadData() async {
    print('开始加载...');

    try {
        final data = await fetchUserData();
        print(data);
    } catch (e) {
        print('加载失败: $e');
    } finally {
        print('加载完成');
    }
}

// 并行执行多个异步任务
Future<void> loadAllData() async {
    // 同时发起多个请求（类似 Promise.all）
    final results = await Future.wait([
        fetchUserData(),
        fetchUserData(),
        fetchUserData(),
    ]);

    for (final result in results) {
        print(result);
    }
}
```

### 3.3 Dart 与 Flutter 的通信

在 Flutter 中，Dart 和原生代码通过 MethodChannel 进行通信：

**Dart 端（调用原生方法）：**

```dart
import 'package:flutter/services.dart';

class PlatformService {
    // 创建通道（通道名称要唯一）
    static const platform = MethodChannel('com.example.app/platform');

    // 调用原生方法
    static Future<String?> getBatteryLevel() async {
        try {
            // 调用原生平台的 getBatteryLevel 方法
            final result = await platform.invokeMethod<String>('getBatteryLevel');
            return result;
        } on PlatformException catch (e) {
            print('获取电池电量失败: ${e.message}');
            return null;
        }
    }

    // 调用原生方法（带参数）
    static Future<bool> showNativeDialog(String title, String message) async {
        try {
            final result = await platform.invokeMethod<bool>(
                'showDialog',
                {'title': title, 'message': message}
            );
            return result ?? false;
        } on PlatformException catch (e) {
            print('显示对话框失败: ${e.message}');
            return false;
        }
    }
}
```

**Windows 端（C++ 实现）：**

```cpp
// windows/runner/main.cpp

#include <flutter/flutter_window.h>
#include <flutter/method_channel.h>
#include <flutter/dart_project.h>
#include <windows.h>

int APIENTRY wWinMain(
    _In_ HINSTANCE instance,
    _In_opt_ HINSTANCE prev,
    _In_ wchar_t* cmd_line,
    _In_ int show_cmd
) {
    // ... 窗口初始化代码 ...

    // 获取 Flutter 引擎
    auto flutter_controller = flutter::FlutterWindowController(instance);
    // ... 初始化代码 ...

    // 创建平台通道
    auto channel = flutter::MethodChannel(
        flutter_controller.Engine(),  // Flutter 引擎
        "com.example.app/platform"     // 通道名称（必须和 Dart 端一致）
    );

    // 设置方法处理器
    channel.SetMethodHandler([](
        const flutter::MethodCall<>& call,
        auto result
    ) {
        // 根据方法名处理不同的请求
        if (call.MethodName() == "getBatteryLevel") {
            // 获取电池电量
            // Windows 上需要调用 Battery API
            result->Success("85%");  // 返回结果
        }
        else if (call.MethodName() == "showDialog") {
            // 显示对话框
            auto args = call.arguments();
            // 解析参数并显示对话框
            result->Success(true);  // 返回结果
        }
        else {
            result->NotImplemented();  // 方法未实现
        }
    });

    // 运行应用
    // ...
}
```

## 四、Flutter 桌面应用实战

### 4.1 桌面应用特有的 UI 设计

桌面应用和移动应用有很大的不同，需要考虑：

| 方面 | 移动应用 | 桌面应用 |
|------|----------|----------|
| 屏幕大小 | 较小，固定 | 较大，可调整 |
| 输入方式 | 触摸为主 | 鼠标+键盘 |
| 窗口控制 | 无 | 最小化、最大化、关闭 |
| 系统菜单 | 底部导航 | 顶部菜单栏 |
| 右键菜单 | 少用 | 常用 |
| 窗口布局 | 单窗口 | 多窗口可能 |

### 4.2 创建 Windows/macOS/Linux 通用布局

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
    runApp(const MyDesktopApp());
}

class MyDesktopApp extends StatelessWidget {
    const MyDesktopApp({super.key});

    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            title: '桌面应用示例',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
                useMaterial3: true,
            ),
            home: const MainLayout(),
        );
    }
}

/// 主布局组件（适配桌面）
class MainLayout extends StatelessWidget {
    const MainLayout({super.key});

    @override
    Widget build(BuildContext context) {
        return Scaffold(
            // 顶部应用栏（类似原生窗口标题栏）
            appBar: AppBar(
                title: const Text('我的桌面应用'),
                backgroundColor: Theme.of(context).colorScheme.inversePrimary,
                // 窗口控制按钮（Windows/Linux）
                actions: [
                    // 最小化按钮
                    IconButton(
                        icon: const Icon(Icons.minimize),
                        onPressed: () => _minimizeWindow(),
                        tooltip: '最小化',
                    ),
                    // 最大化按钮
                    IconButton(
                        icon: const Icon(Icons.crop_square),
                        onPressed: () => _maximizeWindow(),
                        tooltip: '最大化',
                    ),
                    // 关闭按钮
                    IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => _closeWindow(),
                        tooltip: '关闭',
                    ),
                ],
            ),
            // 侧边栏 + 内容区的经典桌面布局
            body: Row(
                children: [
                    // 侧边导航栏
                    NavigationRail(
                        selectedIndex: 0,
                        onDestinationSelected: (index) {
                            // 处理导航切换
                        },
                        labelType: NavigationRailLabelType.all,
                        leading: const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Icon(Icons.apps, size: 32),
                        ),
                        destinations: const [
                            NavigationRailDestination(
                                icon: Icon(Icons.home_outlined),
                                selectedIcon: Icon(Icons.home),
                                label: Text('首页'),
                            ),
                            NavigationRailDestination(
                                icon: Icon(Icons.folder_outlined),
                                selectedIcon: Icon(Icons.folder),
                                label: Text('文件'),
                            ),
                            NavigationRailDestination(
                                icon: Icon(Icons.settings_outlined),
                                selectedIcon: Icon(Icons.settings),
                                label: Text('设置'),
                            ),
                        ],
                    ),
                    // 分隔线
                    const VerticalDivider(thickness: 1, width: 1),
                    // 主内容区
                    Expanded(
                        child: _buildContentArea(),
                    ),
                ],
            ),
        );
    }

    Widget _buildContentArea() {
        // 根据屏幕宽度自适应布局
        return LayoutBuilder(
            builder: (context, constraints) {
                if (constraints.maxWidth > 800) {
                    // 宽屏：显示详细信息面板
                    return Row(
                        children: [
                            // 主列表
                            Expanded(
                                flex: 2,
                                child: _buildMainList(),
                            ),
                            // 详情面板
                            Expanded(
                                flex: 3,
                                child: _buildDetailPanel(),
                            ),
                        ],
                    );
                } else {
                    // 窄屏：只显示列表
                    return _buildMainList();
                }
            },
        );
    }

    Widget _buildMainList() {
        return ListView.builder(
            itemCount: 20,
            itemBuilder: (context, index) {
                return ListTile(
                    leading: CircleAvatar(
                        child: Text('${index + 1}'),
                    ),
                    title: Text('项目 ${index + 1}'),
                    subtitle: Text('这是第 ${index + 1} 个项目的描述'),
                    selected: index == 0,
                    onTap: () {
                        // 选中处理
                    },
                );
            },
        );
    }

    Widget _buildDetailPanel() {
        return const Center(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    Icon(Icons.description, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text(
                        '选择一个项目查看详情',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                ],
            ),
        );
    }

    // 窗口控制方法（通过 Platform Channel 调用原生代码）
    void _minimizeWindow() {
        // TODO: 调用原生代码实现最小化
    }

    void _maximizeWindow() {
        // TODO: 调用原生代码实现最大化
    }

    void _closeWindow() {
        // TODO: 调用原生代码实现关闭
    }
}
```

### 4.3 键盘快捷键处理

桌面应用的一个重要特性是支持键盘快捷键：

```dart
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

class KeyboardShortcutsDemo extends StatelessWidget {
    const KeyboardShortcutsDemo({super.key});

    @override
    Widget build(BuildContext context) {
        return Shortcuts(
            // 定义快捷键
            shortcuts: <ShortcutActivator, Intent>{
                // Ctrl + N：新建
                LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyN):
                    const NewDocumentIntent(),
                // Ctrl + S：保存
                LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyS):
                    const SaveDocumentIntent(),
                // Ctrl + Q：退出
                LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyQ):
                    const QuitApplicationIntent(),
                // Ctrl + Z：撤销
                LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyZ):
                    const UndoIntent(),
                // Ctrl + Shift + Z：重做
                LogicalKeySet(
                    LogicalKeyboardKey.control,
                    LogicalKeyboardKey.shift,
                    LogicalKeyboardKey.keyZ,
                ): const RedoIntent(),
                // F11：全屏切换
                const SingleActivator(LogicalKeyboardKey.f11):
                    const ToggleFullScreenIntent(),
            },
            child: Actions(
                actions: <Type, Action<Intent>>{
                    NewDocumentIntent: CallbackAction<NewDocumentIntent>(
                        onInvoke: (intent) => _handleNewDocument(),
                    ),
                    SaveDocumentIntent: CallbackAction<SaveDocumentIntent>(
                        onInvoke: (intent) => _handleSaveDocument(),
                    ),
                    QuitApplicationIntent: CallbackAction<QuitApplicationIntent>(
                        onInvoke: (intent) => _handleQuit(),
                    ),
                    UndoIntent: CallbackAction<UndoIntent>(
                        onInvoke: (intent) => _handleUndo(),
                    ),
                    RedoIntent: CallbackAction<RedoIntent>(
                        onInvoke: (intent) => _handleRedo(),
                    ),
                    ToggleFullScreenIntent: CallbackAction<ToggleFullScreenIntent>(
                        onInvoke: (intent) => _handleToggleFullScreen(),
                    ),
                },
                child: Focus(
                    autofocus: true,
                    child: Scaffold(
                        appBar: AppBar(
                            title: const Text('键盘快捷键演示'),
                        ),
                        body: Center(
                            child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                    _buildShortcutHint('Ctrl + N', '新建文档'),
                                    _buildShortcutHint('Ctrl + S', '保存'),
                                    _buildShortcutHint('Ctrl + Z', '撤销'),
                                    _buildShortcutHint('Ctrl + Shift + Z', '重做'),
                                    _buildShortcutHint('Ctrl + Q', '退出'),
                                    _buildShortcutHint('F11', '切换全屏'),
                                ],
                            ),
                        ),
                    ),
                ),
            ),
        );
    }

    Widget _buildShortcutHint(String shortcut, String action) {
        return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                        ),
                        decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                            shortcut,
                            style: const TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                            ),
                        ),
                    ),
                    const SizedBox(width: 16),
                    Text(action),
                ],
            ),
        );
    }

    void _handleNewDocument() {
        debugPrint('新建文档');
    }

    void _handleSaveDocument() {
        debugPrint('保存文档');
    }

    void _handleQuit() {
        debugPrint('退出应用');
        // 可以调用 SystemNavigator.pop() 或退出程序
    }

    void _handleUndo() {
        debugPrint('撤销');
    }

    void _handleRedo() {
        debugPrint('重做');
    }

    void _handleToggleFullScreen() {
        debugPrint('切换全屏');
    }
}

// 定义 Intent（意图）
class NewDocumentIntent extends Intent {
    const NewDocumentIntent();
}

class SaveDocumentIntent extends Intent {
    const SaveDocumentIntent();
}

class QuitApplicationIntent extends Intent {
    const QuitApplicationIntent();
}

class UndoIntent extends Intent {
    const UndoIntent();
}

class RedoIntent extends Intent {
    const RedoIntent();
}

class ToggleFullScreenIntent extends Intent {
    const ToggleFullScreenIntent();
}
```

### 4.4 菜单栏和右键菜单

**创建原生风格菜单栏：**

```dart
import 'package:flutter/material.dart';

class MenuBarDemo extends StatelessWidget {
    const MenuBarDemo({super.key});

    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            title: '菜单栏演示',
            home: Scaffold(
                appBar: AppBar(
                    title: const Text('原生菜单栏'),
                    // 使用 MenuBar widget（Flutter 3.22+）
                    actions: [
                        PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert),
                            itemBuilder: (context) => [
                                const PopupMenuItem(
                                    value: 'settings',
                                    child: ListTile(
                                        leading: Icon(Icons.settings),
                                        title: Text('设置'),
                                        dense: true,
                                    ),
                                ),
                                const PopupMenuDivider(),
                                const PopupMenuItem(
                                    value: 'about',
                                    child: ListTile(
                                        leading: Icon(Icons.info_outline),
                                        title: Text('关于'),
                                        dense: true,
                                    ),
                                ),
                            ],
                            onSelected: (value) {
                                switch (value) {
                                    case 'settings':
                                        _showSettingsDialog(context);
                                        break;
                                    case 'about':
                                        _showAboutDialog(context);
                                        break;
                                }
                            },
                        ),
                    ],
                ),
                body: const Center(
                    child: Text('右键点击查看上下文菜单'),
                ),
            ),
        );
    }

    void _showSettingsDialog(BuildContext context) {
        showDialog(
            context: context,
            builder: (context) => AlertDialog(
                title: const Text('设置'),
                content: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                        TextField(
                            decoration: InputDecoration(
                                labelText: '用户名',
                                hintText: '请输入用户名',
                            ),
                        ),
                        SizedBox(height: 16),
                        TextField(
                            obscureText: true,
                            decoration: InputDecoration(
                                labelText: '密码',
                                hintText: '请输入密码',
                            ),
                        ),
                    ],
                ),
                actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('取消'),
                    ),
                    FilledButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('确定'),
                    ),
                ],
            ),
        );
    }

    void _showAboutDialog(BuildContext context) {
        showAboutDialog(
            context: context,
            applicationName: '桌面应用示例',
            applicationVersion: '1.0.0',
            applicationIcon: const Icon(Icons.apps, size: 48),
            children: [
                const Text('这是一个 Flutter 桌面应用开发演示。'),
                const SizedBox(height: 16),
                const Text('支持 Windows、macOS 和 Linux。'),
            ],
        );
    }
}
```

**右键上下文菜单：**

```dart
class ContextMenuDemo extends StatelessWidget {
    const ContextMenuDemo({super.key});

    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            home: Scaffold(
                appBar: AppBar(title: const Text('右键菜单演示')),
                body: Center(
                    child: GestureDetector(
                        // 右键点击
                        onSecondaryTapDown: (details) {
                            _showContextMenu(context, details.globalPosition);
                        },
                        child: Container(
                            width: 200,
                            height: 200,
                            color: Colors.blue[100],
                            child: const Center(
                                child: Text('右键点击我'),
                            ),
                        ),
                    ),
                ),
            ),
        );
    }

    void _showContextMenu(BuildContext context, Offset position) {
        showMenu(
            context: context,
            position: RelativeRect.fromLTRB(
                position.dx,
                position.dy,
                position.dx,
                position.dy,
            ),
            items: [
                PopupMenuItem(
                    child: const ListTile(
                        leading: Icon(Icons.copy),
                        title: Text('复制'),
                        dense: true,
                    ),
                    onTap: () {
                        debugPrint('复制');
                    },
                ),
                PopupMenuItem(
                    child: const ListTile(
                        leading: Icon(Icons.cut),
                        title: Text('剪切'),
                        dense: true,
                    ),
                    onTap: () {
                        debugPrint('剪切');
                    },
                ),
                PopupMenuItem(
                    child: const ListTile(
                        leading: Icon(Icons.paste),
                        title: Text('粘贴'),
                        dense: true,
                    ),
                    onTap: () {
                        debugPrint('粘贴');
                    },
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                    child: const ListTile(
                        leading: Icon(Icons.delete),
                        title: Text('删除'),
                        dense: true,
                    ),
                    onTap: () {
                        debugPrint('删除');
                    },
                ),
            ],
        );
    }
}
```

## 五、插件系统与原生集成

### 5.1 Flutter 插件架构

Flutter 的插件是一种封装了 Platform Channel 的包，用于访问原生平台的功能：

```
┌─────────────────────────────────────────────┐
│              Flutter 应用层                  │
│         （使用 pub 包中的插件）              │
├─────────────────────────────────────────────┤
│              Plugin Package                 │
│   pubspec.yaml → 声明依赖 → 原生实现         │
├─────────────────────────────────────────────┤
│         Platform Channel 通信层              │
├─────────────────────────────────────────────┤
│            Windows/macOS/Linux               │
│              原生代码实现                    │
└─────────────────────────────────────────────┘
```

### 5.2 常用桌面插件

**文件对话框：**

```yaml
# pubspec.yaml
dependencies:
    file_picker: ^8.0.0  # 文件选择对话框
    # 或者 native_file_picker（更现代）
```

```dart
import 'package:file_picker/file_picker.dart';

Future<void> pickFile() async {
    // 选择单个文件
    final result = await FilePicker.platform.pickFiles();

    if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        print('选择的文件: ${file.name}');
        print('路径: ${file.path}');
        print('大小: ${file.size} bytes');
    }
}

Future<void> pickMultipleFiles() async {
    // 选择多个文件
    final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
    );

    if (result != null) {
        for (final file in result.files) {
            print('文件: ${file.name}');
        }
    }
}

Future<void> pickDirectory() async {
    // 选择文件夹
    final result = await FilePicker.platform.getDirectoryPath();

    if (result != null) {
        print('选择的文件夹: $result');
    }
}
```

**系统窗口控制：**

```dart
// 使用 window_manager 插件
// pubspec.yaml
// dependencies:
//     window_manager: ^0.3.8

import 'package:window_manager/window_manager.dart';

class WindowController {
    // 初始化窗口管理器
    static Future<void> init() async {
        await windowManager.ensureInitialized();

        const windowOptions = WindowOptions(
            size: Size(1280, 720),
            minimumSize: Size(800, 600),
            center: true,
            backgroundColor: Colors.transparent,
            skipTaskbar: false,
            titleBarStyle: TitleBarStyle.hidden,  // 隐藏原生标题栏
            title: '我的桌面应用',
        );

        await windowManager.waitUntilReadyToShow(windowOptions, () async {
            await windowManager.show();
            await windowManager.focus();
        });
    }

    // 窗口控制
    static Future<void> minimize() async {
        await windowManager.minimize();
    }

    static Future<void> maximize() async {
        if (await windowManager.isMaximized()) {
            await windowManager.unmaximize();
        } else {
            await windowManager.maximize();
        }
    }

    static Future<void> close() async {
        await windowManager.close();
    }

    // 全屏切换
    static Future<void> toggleFullScreen() async {
        await windowManager.setFullScreen(!await windowManager.isFullScreen());
    }

    // 始终置顶
    static Future<void> setAlwaysOnTop(bool value) async {
        await windowManager.setAlwaysOnTop(value);
    }
}
```

**系统托盘：**

```dart
// 使用 system_tray 插件
// pubspec.yaml
// dependencies:
//     system_tray: ^2.0.3

import 'package:system_tray/system_tray.dart';

class SystemTrayManager {
    final SystemTray _systemTray = SystemTray();
    final Menu _menu = Menu();

    Future<void> init() async {
        // 初始化系统托盘图标
        await _systemTray.initSystemTray(
            title: '我的应用',
            iconPath: 'assets/app_icon.png',
            toolTip: 'Flutter 桌面应用',
        );

        // 创建右键菜单
        await _menu.buildFrom([
            MenuItemLabel(
                label: '显示窗口',
                onClicked: (menuItem) => _showWindow(),
            ),
            MenuSeparator(),
            MenuItemLabel(
                label: '设置',
                onClicked: (menuItem) => _openSettings(),
            ),
            MenuItemLabel(
                label: '关于',
                onClicked: (menuItem) => _showAbout(),
            ),
            MenuSeparator(),
            MenuItemLabel(
                label: '退出',
                onClicked: (menuItem) => _exitApp(),
            ),
        ]);

        // 设置托盘菜单
        await _systemTray.setContextMenu(_menu);

        // 处理托盘点击事件
        _systemTray.registerSystemTrayEventHandler((eventName) {
            if (eventName == kSystemTrayEventClick) {
                _systemTray.popUpContextMenu();
            } else if (eventName == kSystemTrayEventRightClick) {
                _systemTray.popUpContextMenu();
            }
        });
    }

    void _showWindow() {
        // 显示主窗口
        // 实现代码...
    }

    void _openSettings() {
        // 打开设置窗口
    }

    void _showAbout() {
        // 显示关于对话框
    }

    void _exitApp() {
        // 退出应用
    }
}
```

### 5.3 自定义插件开发

如果现有插件不能满足需求，可以自己开发插件：

**1. 创建插件项目：**

```bash
# 创建插件包
flutter create --org com.example --platforms=windows,macos,linux my_plugin

# 项目结构
my_plugin/
├── lib/
│   └── my_plugin.dart      # Dart 端 API
├── windows/
│   └── my_plugin.cpp        # Windows 原生实现
├── macos/
│   └── MyPlugin.swift        # macOS 原生实现
├── linux/
│   └── my_plugin.cc          # Linux 原生实现
├── pubspec.yaml
└── README.md
```

**2. Dart 端实现：**

```dart
// lib/my_plugin.dart

import 'package:flutter/services.dart';

/// 插件主类
class MyPlugin {
    /// 平台通道
    static const MethodChannel _channel = MethodChannel('com.example/my_plugin');

    /// 获取插件版本
    static Future<String?> getVersion() async {
        try {
            final result = await _channel.invokeMethod<String>('getVersion');
            return result;
        } on PlatformException catch (e) {
            print('获取版本失败: ${e.message}');
            return null;
        }
    }

    /// 执行原生功能
    static Future<bool> doSomething(String input) async {
        try {
            final result = await _channel.invokeMethod<bool>(
                'doSomething',
                {'input': input},
            );
            return result ?? false;
        } on PlatformException catch (e) {
            print('执行失败: ${e.message}');
            return false;
        }
    }

    /// 获取原生数据
    static Future<Map<String, dynamic>?> getNativeData() async {
        try {
            final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
                'getNativeData',
            );
            return result?.cast<String, dynamic>();
        } on PlatformException catch (e) {
            print('获取数据失败: ${e.message}');
            return null;
        }
    }

    /// 流式数据接收（原生 -> Dart）
    static Stream<String> get nativeStream {
        // 创建 EventChannel 用于持续接收数据
        const eventChannel = EventChannel('com.example/my_plugin/stream');
        return eventChannel
            .receiveBroadcastStream()
            .map((event) => event as String);
    }
}
```

**3. Windows 原生实现（C++）：**

```cpp
// windows/my_plugin.cpp

#include <flutter/plugin_registrar.h>
#include <flutter/method_channel.h>
#include <flutter/plugin_registrar_windows.h>

namespace my_plugin {

    // 插件类
    class MyPlugin : public flutter::PluginBase {
    public:
        // 注册插件
        static void RegisterWithRegistrar(
            flutter::PluginRegistrarWindows* registrar
        );

        // 处理方法调用
        void HandleMethodCall(
            const flutter::MethodCall<>& call,
            std::shared_ptr<flutter::MethodResult<>> result
        );

    private:
        // 通道
        flutter::BinaryMessenger* messenger_;
    };

    void MyPlugin::RegisterWithRegistrar(
        flutter::PluginRegistrarWindows* registrar
    ) {
        // 创建方法通道
        auto channel = std::make_unique<flutter::MethodChannel>(
            registrar->messenger(),
            "com.example/my_plugin",
            // 使用标准方法编解码器
            &flutter::StandardMethodCodec::GetInstance()
        );

        // 创建插件实例
        auto plugin = std::make_unique<MyPlugin>();
        plugin->messenger_ = registrar->messenger();

        // 设置方法处理器
        channel->SetMethodCallHandler(
            [plugin = plugin.get()](
                const auto& call,
                auto result
            ) {
                plugin->HandleMethodCall(call, std::move(result));
            }
        );

        // 注册插件
        registrar->AddPlugin(std::move(plugin));
    }

    void MyPlugin::HandleMethodCall(
        const flutter::MethodCall<>& call,
        std::shared_ptr<flutter::MethodResult<>> result
    ) {
        if (call.MethodName() == "getVersion") {
            // 返回插件版本
            result->Success("1.0.0");
        }
        else if (call.MethodName() == "doSomething") {
            // 获取参数
            auto args = call.arguments();
            if (args && args->IsMap()) {
                auto input = args->Map()["input"]->AsString();
                // 处理逻辑...
                result->Success(true);
            } else {
                result->Error("INVALID_ARGUMENT", "参数格式错误");
            }
        }
        else if (call.MethodName() == "getNativeData") {
            // 返回复杂数据
            flutter::EncodableMap map;
            map[flutter::EncodableValue("key1")] = flutter::EncodableValue("value1");
            map[flutter::EncodableValue("key2")] = flutter::EncodableValue(42);
            result->Success(flutter::EncodableValue(map));
        }
        else {
            result->NotImplemented();
        }
    }

} // namespace my_plugin

// 插件注册宏
void MyPluginRegisterWithRegistrar(
    FlutterDesktopPluginRegistrar* registrar
) {
    my_plugin::MyPlugin::RegisterWithRegistrar(
        flutter::PluginRegistrarManager::GetInstance()
            ->GetRegistrar<flutter::PluginRegistrarWindows>(registrar)
    );
}
```

## 六、状态管理与数据流

### 6.1 常见的桌面应用状态管理模式

| 模式 | 适用场景 | Flutter 实现 |
|------|----------|--------------|
| setState | 简单局部状态 | StatefulWidget |
| Provider | 中小型应用 | ChangeNotifier |
| Riverpod | 中大型应用 | @riverpod 注解 |
| Bloc | 复杂状态/事件流 | flutter_bloc 包 |
| GetX | 快速开发 | GetX 框架 |

### 6.2 使用 Riverpod 实现响应式状态管理

Riverpod 是 Flutter 生态中最流行的状态管理方案之一：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ============ 定义状态 ============

/// 用户信息状态类
class UserState {
    final String name;
    final int age;
    final bool isLoading;
    final String? error;

    const UserState({
        this.name = '',
        this.age = 0,
        this.isLoading = false,
        this.error,
    });

    UserState copyWith({
        String? name,
        int? age,
        bool? isLoading,
        String? error,
    }) {
        return UserState(
            name: name ?? this.name,
            age: age ?? this.age,
            isLoading: isLoading ?? this.isLoading,
            error: error,
        );
    }
}

// ============ 定义 Provider ============

/// NotifierProvider：用于管理可变状态
final userProvider = NotifierProvider<UserNotifier, UserState>(() {
    return UserNotifier();
});

/// 状态管理类
class UserNotifier extends Notifier<UserState> {
    @override
    UserState build() {
        // 初始化状态
        return const UserState();
    }

    // 加载用户数据
    Future<void> loadUser(String userId) async {
        state = state.copyWith(isLoading: true, error: null);

        try {
            // 模拟网络请求
            await Future.delayed(const Duration(seconds: 1));

            // 更新状态
            state = state.copyWith(
                name: '张三',
                age: 28,
                isLoading: false,
            );
        } catch (e) {
            state = state.copyWith(
                isLoading: false,
                error: e.toString(),
            );
        }
    }

    // 更新用户名
    void updateName(String name) {
        state = state.copyWith(name: name);
    }

    // 更新年龄
    void updateAge(int age) {
        state = state.copyWith(age: age);
    }

    // 重置状态
    void reset() {
        state = const UserState();
    }
}

// ============ 模拟应用场景 ============

/// 应用主组件
class RiverpodDemoApp extends StatelessWidget {
    const RiverpodDemoApp({super.key});

    @override
    Widget build(BuildContext context) {
        return ProviderScope(
            child: MaterialApp(
                title: 'Riverpod 演示',
                theme: ThemeData(
                    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
                    useMaterial3: true,
                ),
                home: const UserProfilePage(),
            ),
        );
    }
}

/// 用户资料页面
class UserProfilePage extends ConsumerWidget {
    const UserProfilePage({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
        // 获取状态
        final userState = ref.watch(userProvider);

        return Scaffold(
            appBar: AppBar(
                title: const Text('用户资料'),
                backgroundColor: Theme.of(context).colorScheme.inversePrimary,
                actions: [
                    IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: () {
                            // 刷新数据
                            ref.read(userProvider.notifier).loadUser('123');
                        },
                    ),
                ],
            ),
            body: userState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : userState.error != null
                    ? Center(
                        child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                                const Icon(
                                    Icons.error_outline,
                                    size: 64,
                                    color: Colors.red,
                                ),
                                const SizedBox(height: 16),
                                Text('错误: ${userState.error}'),
                                const SizedBox(height: 16),
                                FilledButton(
                                    onPressed: () {
                                        ref.read(userProvider.notifier).loadUser('123');
                                    },
                                    child: const Text('重试'),
                                ),
                            ],
                        ),
                    )
                    : _buildUserContent(context, ref, userState),
            floatingActionButton: FloatingActionButton(
                onPressed: () {
                    ref.read(userProvider.notifier).reset();
                },
                child: const Icon(Icons.refresh),
            ),
        );
    }

    Widget _buildUserContent(
        BuildContext context,
        WidgetRef ref,
        UserState userState,
    ) {
        return Center(
            child: Card(
                margin: const EdgeInsets.all(32),
                child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                            // 用户头像
                            CircleAvatar(
                                radius: 48,
                                backgroundColor: Theme.of(context)
                                    .colorScheme
                                    .primaryContainer,
                                child: Text(
                                    userState.name.isNotEmpty
                                        ? userState.name[0]
                                        : '?',
                                    style: const TextStyle(fontSize: 36),
                                ),
                            ),
                            const SizedBox(height: 24),

                            // 用户名
                            Text(
                                userState.name.isNotEmpty
                                    ? userState.name
                                    : '未登录',
                                style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            const SizedBox(height: 8),

                            // 年龄
                            Text(
                                userState.age > 0
                                    ? '${userState.age} 岁'
                                    : '年龄未知',
                                style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 32),

                            // 编辑按钮
                            Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                    OutlinedButton.icon(
                                        onPressed: () {
                                            _showEditDialog(
                                                context,
                                                ref,
                                                userState,
                                            );
                                        },
                                        icon: const Icon(Icons.edit),
                                        label: const Text('编辑资料'),
                                    ),
                                    const SizedBox(width: 16),
                                    FilledButton.icon(
                                        onPressed: () {
                                            ref
                                                .read(userProvider.notifier)
                                                .loadUser('456');
                                        },
                                        icon: const Icon(Icons.refresh),
                                        label: const Text('加载其他用户'),
                                    ),
                                ],
                            ),
                        ],
                    ),
                ),
            ),
        );
    }

    void _showEditDialog(
        BuildContext context,
        WidgetRef ref,
        UserState userState,
    ) {
        final nameController = TextEditingController(text: userState.name);
        final ageController = TextEditingController(
            text: userState.age > 0 ? userState.age.toString() : '',
        );

        showDialog(
            context: context,
            builder: (context) => AlertDialog(
                title: const Text('编辑资料'),
                content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                        TextField(
                            controller: nameController,
                            decoration: const InputDecoration(
                                labelText: '用户名',
                            ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                            controller: ageController,
                            decoration: const InputDecoration(
                                labelText: '年龄',
                            ),
                            keyboardType: TextInputType.number,
                        ),
                    ],
                ),
                actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('取消'),
                    ),
                    FilledButton(
                        onPressed: () {
                            // 更新状态
                            ref.read(userProvider.notifier).updateName(
                                    nameController.text,
                                );
                            ref.read(userProvider.notifier).updateAge(
                                    int.tryParse(ageController.text) ?? 0,
                                );
                            Navigator.pop(context);
                        },
                        child: const Text('保存'),
                    ),
                ],
            ),
        );
    }
}
```

## 七、打包与发布

### 7.1 Windows 打包

**配置应用元数据：**

```yaml
# pubspec.yaml
# ... existing config ...

# Windows 特定配置
flutter:
    # ... existing config ...

    # Windows 桌面配置
    windows:
        # 应用 ID（用于系统识别）
        application-id: "com.example.myapp"
        # 显示器 DPI 缩放支持
        enable-dpi-overscaling: true
        # 窗口宽度和高度
        default-width: 1280
        default-height: 720
```

**生成安装包：**

```bash
# 开发模式运行
flutter run -d windows

# Release 构建（优化过的二进制）
flutter build windows --release

# 构建产物在 build/windows/runner/Release/ 目录
# 包含 .exe 文件和所有依赖

# 创建一个独立的安装包（需要第三方工具）
# 推荐使用 Inno Setup 或 WiX Toolset
```

**Inno Setup 安装脚本示例：**

```iss
[Setup]
AppName=我的桌面应用
AppVersion=1.0.0
DefaultDirName={autopf}\我的桌面应用
DefaultGroupName=我的桌面应用
OutputDir=installer
OutputBaseFilename=my_desktop_app_setup

[Files]
Source: "build\windows\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\我的桌面应用"; Filename: "{app}\my_desktop_app.exe"
Name: "{commondesktop}\我的桌面应用"; Filename: "{app}\my_desktop_app.exe"
```

### 7.2 macOS 打包

**配置应用信息：**

```xml
<!-- macos/Runner/Info.plist -->
<key>CFBundleName</key>
<string>My Desktop App</string>
<key>CFBundleDisplayName</key>
<string>我的桌面应用</string>
<key>CFBundleIdentifier</key>
<string>com.example.myapp</string>
<key>CFBundleVersion</key>
<string>1.0.0</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundlePackageType</key>
<string>APPL</string>
<key>LSMinimumSystemVersion</key>
<string>10.14</string>
<key>NSHighResolutionCapable</key>
<true/>
```

**构建和打包：**

```bash
# 开发模式运行
flutter run -d macos

# Release 构建
flutter build macos --release

# 构建产物在 build/macos/Build/Products/Release/ 目录

# 创建 .app 包
# 默认情况下，flutter build macos --release 已经生成了 .app

# 创建 .dmg 安装包（需要创建 dmg 工具）
# 推荐使用 create-dmg 或 electron-builder
```

### 7.3 Linux 打包

**构建：**

```bash
# 开发模式运行
flutter run -d linux

# Release 构建
flutter build linux --release

# 构建产物在 build/linux/x64/release/bundle/ 目录
# 包含可执行文件和依赖库
```

**打包为 AppImage 或 DEB：**

```bash
# 安装打包工具
sudo apt install appimagekit

# 创建 AppImage（需要额外配置）

# 或创建 DEB 包
# 在 debian/ 目录下创建 control 文件
```

## 八、常见问题与解决方案

### 8.1 性能问题

**问题：Flutter 桌面应用比原生应用慢？**

这通常是优化不足导致的：

```dart
// ❌ 低效：每次重建整个列表
ListView.builder(
    itemBuilder: (context, index) {
        return ComplexWidget(  // 这个组件会频繁重建
            data: items[index],
        );
    },
)

// ✅ 高效：使用 const 组件 + 缓存
ListView.builder(
    itemBuilder: (context, index) {
        return const CacheableComplexWidget(  // 使用 const
            // ...
        );
    },
)

// 或者使用 RepaintBoundary 限制重绘区域
ListView.builder(
    itemBuilder: (context, index) {
        return RepaintBoundary(  // 独立的绘制层
            child: ComplexWidget(
                data: items[index],
            ),
        );
    },
)
```

### 8.2 窗口控制问题

**问题：无法自定义窗口标题栏？**

```dart
// 使用 window_manager 插件
import 'package:window_manager/window_manager.dart';

void main() async {
    WidgetsFlutterBinding.ensureInitialized();

    // 初始化窗口管理器
    await windowManager.ensureInitialized();

    // 配置窗口
    const windowOptions = WindowOptions(
        size: Size(1280, 720),
        center: true,
        // 隐藏原生标题栏
        titleBarStyle: TitleBarStyle.hidden,
    );

    await windowManager.waitUntilReadyToShow(windowOptions, () async {
        await windowManager.show();
        await windowManager.focus();
    });

    runApp(const MyApp());
}
```

### 8.3 中文输入问题

**问题：Linux 上中文输入不显示候选框？**

这是 Flutter Linux 的已知问题，可以通过以下方式缓解：

1. 确保系统安装了正确的输入法（fcitx 或 ibus）
2. 更新到最新的 Flutter SDK
3. 使用 `gtk_IM_context` 相关的系统配置

## 九、总结与学习路径

### Flutter 桌面开发学习路线

```
第一阶段：入门（1-2周）
├── Dart 语言基础
├── Flutter Widget 体系
├── 布局组件（Row、Column、Stack 等）
└── 创建第一个桌面应用

第二阶段：进阶（2-4周）
├── 状态管理（Provider/Riverpod）
├── Platform Channel
├── 桌面特有组件（NavigationRail、MenuBar 等）
└── 插件开发

第三阶段：实战（4-8周）
├── 完整项目开发
├── 性能优化
├── 打包发布
└── 多平台适配
```

### 关键技术点

| 技术 | 重要程度 | 学习难度 |
|------|----------|----------|
| Dart 语言 | 核心 | 中 |
| Flutter Widget | 核心 | 低 |
| Platform Channel | 进阶 | 高 |
| 状态管理 | 核心 | 中 |
| 窗口管理 | 桌面特有 | 中 |
| Skia 渲染 | 引擎层 | 高 |

### 推荐资源

- [Flutter 官方文档](https://docs.flutter.dev/)
- [Flutter Desktop 文档](https://docs.flutter.dev/desktop)
- [Dart 语言教程](https://dart.dev/guides)
- [pub.dev](https://pub.dev) - Flutter 插件仓库
