# 鸿蒙 HarmonyOS 开发完全指南

## 前言

华为的鸿蒙操作系统（HarmonyOS）是近年来中国技术圈最热门的话题之一。不同于安卓和 iOS，鸿蒙从设计之初就是一个面向全场景的分布式操作系统。它的目标不仅仅是手机，而是要打通手机、平板、手表、电视、汽车、智能家居等所有设备。

对于开发者来说，鸿蒙提供了一套全新的开发框架——ArkTS（Ark TypeScript）。如果你熟悉 TypeScript 或 JavaScript，学习 ArkTS 会相对轻松。但鸿蒙的架构思想和开发模式与传统的移动开发有较大差异，需要我们从根本上理解它的设计理念。

让我用一个生活化的比喻来解释鸿蒙的核心理念：传统操作系统像是一栋独立的大楼，每套设备都是一栋独立的大楼，它们之间只能通过外部道路（网络）连接。而鸿蒙想要做的是，把所有设备变成一栋大楼的不同房间，它们内部就是连通的，你可以自由穿梭在不同房间之间，而不需要走出大楼再进去。

这种"超级设备"的概念，就是鸿蒙的核心魅力所在。

---

## 第一章：ArkTS 语言基础

### 1.1 ArkTS 与 TypeScript 的关系

ArkTS 是鸿蒙生态推荐的应用开发语言。它基于 TypeScript 的语法，并在其基础上增加了一些静态类型检查和鸿蒙特有的能力。

你可以把 ArkTS 理解为 TypeScript 的一个超集——它继承了 TypeScript 的所有特性，比如类型系统、装饰器、接口等，同时又加入了自己的扩展。

```typescript
// ArkTS 基础语法演示
// 让我们通过对比来理解 ArkTS 的特点

// 1. 基本类型声明
// ArkTS 使用 let/const 进行变量声明，类似 TypeScript
let name: string = '张三';
let age: number = 25;
let isStudent: boolean = false;

// 多类型联合声明
let mixedValue: string | number = 'hello';
mixedValue = 123;  // 也可以是数字

// 2. 函数声明
// ArkTS 支持箭头函数、默认参数、可选参数等
function greet(name: string, greeting: string = '你好'): string {
  return `${greeting}, ${name}!`;
}

// 带可选参数的函数
function introduce(name: string, age?: number): string {
  if (age !== undefined) {
    return `我是${name}，今年${age}岁`;
  }
  return `我是${name}`;
}

// 3. 接口和类型别名
// 接口用于定义对象的结构
interface User {
  name: string;
  age: number;
  email?: string;  // 可选属性
  readonly id: number;  // 只读属性
}

// 类型别名
type Point = {
  x: number;
  y: number;
};

// 使用接口
const user: User = {
  name: '李四',
  age: 30,
  id: 1,  // 只读，创建后不可修改
};

// 4. 泛型
// 泛型让代码更加灵活，同时保持类型安全
function identity<T>(value: T): T {
  return value;
}

const num = identity<number>(42);
const str = identity('hello');  // 类型会被自动推断

// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

class StringContainer implements Container<string> {
  value: string = '';

  getValue(): string {
    return this.value;
  }
}

// 5. 枚举
// 枚举用于定义一组命名的常量
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

function log(message: string, level: LogLevel): void {
  console.log(`[${level}] ${message}`);
}

log('这是一条信息', LogLevel.INFO);

// 6. 空安全
// ArkTS 强制进行空检查，避免空指针异常
let nullableString: string | null = null;

// 安全取值操作符
let length: number = nullableString?.length ?? 0;

// 显式检查
if (nullableString !== null) {
  console.log(nullableString.length);
}
```

### 1.2 ArkUI 声明式开发

ArkUI 是鸿蒙的 UI 开发框架，它采用了声明式的开发范式。声明式 UI 的核心思想是：你只需要描述"UI 应该是什么样子"，而不需要关心"如何实现这个 UI"。

```typescript
// ArkUI 声明式开发示例
// 这是一个完整的 ArkUI 页面

// 导入 ArkUI 的基础组件
import promptAction from '@ohos.promptAction';
import router from '@ohos.router';

// @Component 是 ArkTS 的装饰器，表示这是一个 UI 组件
// 这是声明式 UI 的核心概念
@Component
struct MyComponent {
  // @State 装饰器表示组件内部的状态
  // 当状态变化时，UI 会自动更新
  @State message: string = 'Hello, HarmonyOS!';
  @State count: number = 0;
  @State isLoading: boolean = false;
  @State inputText: string = '';

  // 私有成员变量（不触发 UI 更新）
  private title: string = '我的应用';

  build() {
    // build() 方法返回 UI 结构
    // Column 是垂直布局容器
    Column() {
      // 顶部标题
      Text(this.title)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 20 });

      // 消息显示
      Text(this.message)
        .fontSize(18)
        .fontColor('#333333')
        .margin({ bottom: 10 });

      // 计数器显示
      Text(`计数: ${this.count}`)
        .fontSize(20)
        .fontColor('#007AFF')
        .margin({ bottom: 20 });

      // 按钮区域
      Row() {
        // 减少按钮
        Button('-')
          .width(60)
          .height(60)
          .fontSize(24)
          .backgroundColor('#E0E0E0')
          .fontColor('#333')
          .onClick(() => {
            this.count--;
          });

        // 增加按钮
        Button('+')
          .width(60)
          .height(60)
          .fontSize(24)
          .backgroundColor('#007AFF')
          .fontColor('#FFF')
          .onClick(() => {
            this.count++;
          })
          .margin({ left: 20 });
      }
      .margin({ bottom: 30 });

      // 输入框
      TextInput({ placeholder: '请输入文字' })
        .width('100%')
        .height(50)
        .backgroundColor('#F5F5F5')
        .borderRadius(8)
        .onChange((value: string) => {
          this.inputText = value;
        });

      // 显示输入内容
      if (this.inputText !== '') {
        Text(`你输入了: ${this.inputText}`)
          .fontSize(14)
          .fontColor('#666')
          .margin({ top: 10 });
      }

      // 加载状态指示器
      if (this.isLoading) {
        LoadingProgress()
          .width(40)
          .height(40)
          .margin({ top: 20 });
      }

      // 提交按钮
      Button('提交')
        .width('80%')
        .height(50)
        .fontSize(18)
        .backgroundColor('#34C759')
        .fontColor('#FFF')
        .onClick(() => {
          this.submitForm();
        })
        .margin({ top: 30 });
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Start)
    .alignItems(HorizontalAlign.Center);
  }

  // 组件的方法
  submitForm(): void {
    if (this.inputText.trim() === '') {
      // 使用 promptAction 显示提示
      promptAction.showToast({
        message: '请输入内容',
        duration: 2000
      });
      return;
    }

    this.isLoading = true;

    // 模拟异步操作
    setTimeout(() => {
      this.isLoading = false;
      promptAction.showToast({
        message: `已提交: ${this.inputText}`,
        duration: 2000
      });
    }, 1000);
  }
}

// 页面入口
@Entry
@Component
struct Index {
  build() {
    MyComponent();
  }
}
```

### 1.3 装饰器详解

ArkTS 的装饰器系统是其声明式开发范式的核心。装饰器以 `@` 符号开头，用于标记类、方法、属性等，赋予它们特殊的行为和能力。

```typescript
// ArkTS 装饰器系统详解

// ============================================
// @Component - 定义 UI 组件
// ============================================
// @Component 装饰器标记一个类为 UI 组件
// 被装饰的类必须实现 build() 方法
// build() 方法返回组件的 UI 结构

@Component
struct UserCard {
  @State name: string = '张三';
  @State avatarUrl: string = '';

  build() {
    Row() {
      Image(this.avatarUrl)
        .width(50)
        .height(50)
        .borderRadius(25);

      Column() {
        Text(this.name)
          .fontSize(16)
          .fontWeight(FontWeight.Bold);
      }
      .margin({ left: 12 });
    }
  }
}

// ============================================
// @Entry - 定义页面入口
// ============================================
// @Entry 装饰器标记组件为页面的入口
// 一个应用可以有多个 Entry 组件
// 通常用于页面的根组件

@Entry
@Component
struct MainPage {
  @State message: string = '主页面';

  build() {
    Column() {
      Text(this.message);
    }
  }
}

// ============================================
// @State - 组件内部状态
// ============================================
// @State 装饰器用于定义组件的内部状态
// 当状态变化时，组件会自动重新渲染
// 状态变化只会影响当前组件，不会影响父组件或子组件

@Component
struct Counter {
  @State count: number = 0;

  build() {
    Column() {
      Text(`计数: ${this.count}`);

      Button('增加')
        .onClick(() => {
          this.count++;  // 修改状态，触发重新渲染
        });
    }
  }
}

// ============================================
// @Prop - 父组件传入属性（单向）
// ============================================
// @Prop 用于接收父组件传入的属性
// 数据流向是单向的：父组件 -> 子组件
// 当父组件的属性变化时，子组件会同步更新
// 但子组件对属性的修改不会影响父组件

@Component
struct ChildComponent {
  @Prop title: string;  // 接收父组件传入的 title
  @Prop count: number;

  build() {
    Column() {
      Text(`标题: ${this.title}`);
      Text(`计数: ${this.count}`);

      Button('子组件增加')
        .onClick(() => {
          // 这个修改不会影响父组件
          // this.count++;  // 编译错误！
        });
    }
  }
}

@Component
struct ParentComponent {
  @State parentCount: number = 0;

  build() {
    Column() {
      // 传入属性给子组件
      ChildComponent({
        title: '子组件',
        count: this.parentCount
      });

      Button('父组件增加')
        .onClick(() => {
          this.parentCount++;
        });
    }
  }
}

// ============================================
// @Link - 双向数据绑定
// ============================================
// @Link 用于创建父子组件之间的双向数据绑定
// 子组件可以直接修改传入的属性
// 修改会同步到父组件，父组件的变化也会同步到子组件

@Component
struct LinkedChild {
  @Link count: number;  // 使用 @Link 装饰器

  build() {
    Column() {
      Text(`计数: ${this.count}`);

      Button('子组件增加')
        .onClick(() => {
          // 这个修改会影响父组件
          this.count++;
        });
    }
  }
}

@Component
struct LinkedParent {
  @State parentCount: number = 0;

  build() {
    Column() {
      Text(`父组件计数: ${this.parentCount}`);

      // 使用 $ 符号传递 @Link 属性
      LinkedChild({ count: $parentCount });
    }
  }
}

// ============================================
// @Observed 和 @ObjectLink - 对象观测
// ============================================
// @Observed 装饰器标记类，启用对对象属性的深度观测
// @ObjectLink 用于链接被 @Observed 标记的对象

@Observed
class UserInfo {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

@Component
struct ObservedChild {
  @ObjectLink userInfo: UserInfo;

  build() {
    Column() {
      Text(`姓名: ${this.userInfo.name}`);
      Text(`年龄: ${this.userInfo.age}`);

      Button('生日蛋糕')
        .onClick(() => {
          this.userInfo.age++;
        });
    }
  }
}

@Component
struct ObservedParent {
  @State userInfo: UserInfo = new UserInfo('小明', 18);

  build() {
    Column() {
      ObservedChild({ userInfo: this.userInfo });

      Button('父组件修改')
        .onClick(() => {
          this.userInfo.age++;
        });
    }
  }
}

// ============================================
// @StorageLink 和 @LocalStorageLink - 持久化存储
// ============================================
// @StorageLink 链接到 AppStorage 的属性
// @LocalStorageLink 链接到 LocalStorage 的属性
// 数据变化会自动保存到存储，同时 UI 会自动更新

// AppStorage 是应用级别的单例存储
AppStorage.setOrCreate('username', '张三');

@Component
struct StorageDemo {
  @StorageLink('username') username: string = '';

  build() {
    Column() {
      Text(`用户名: ${this.username}`);

      Button('修改用户名')
        .onClick(() => {
          this.username = '李四';  // 会自动保存到 AppStorage
        });
    }
  }
}

// ============================================
// @Preview - 预览配置
// ============================================
// @Preview 装饰器用于配置预览器选项
// 可以在 DevEco Studio 中预览组件效果

@Preview({
  title: '用户卡片',
  width: 300,
  height: 400
})
@Component
struct PreviewDemo {
  @State name: string = '测试用户';

  build() {
    Column() {
      Text(this.name);
    }
  }
}
```

---

## 第二章：Stage 模型

### 2.1 Stage 模型概述

在 HarmonyOS 中，Stage 模型是其核心的应用架构模型。它定义了应用的组织方式、资源管理和生命周期。

传统的 Android 应用模型是「Activity + Service + BroadcastReceiver + ContentProvider」四大组件，而在鸿蒙中，这些被重新组织为「Stage + Ability + Extension」的新体系。

你可以把 Stage 模型理解为一个剧院的后台管理系统：

- **Stage** 是舞台，同一时间可以有多个人在这个舞台上表演
- **Ability** 是演员，每个 Ability 都是一个独立的表演单元
- **Window** 是舞台上的灯光布景，控制着 UI 的显示
- **AbilityStage** 是演员的经纪人，管理着同一类演员

### 2.2 Ability 开发

Ability 是鸿蒙应用的基本组成单元，类似于 Android 中的 Activity。它是应用与用户交互的窗口，也是系统调度应用资源的最小单位。

```typescript
// 鸿蒙 Ability 开发示例

// 导入必要的模块
import UIAbility from '@ohos.app.ability.UIAbility';
import Window from '@ohos.window';
import Want from '@ohos.app.ability.Want';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';

// UIAbility 是 UI 能力的基础类
// 每个 Ability 对应一个独立的页面或功能模块
export default class MyUIAbility extends UIAbility {
  // 存储窗口对象引用
  private windowStage: Window.WindowStage | null = null;

  // onCreate - Ability 创建时调用
  // 用于初始化操作，如设置全局数据、注册广播监听等
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    console.info('Ability onCreate');

    // 获取启动参数
    // launchParam.launchReason 表示启动原因
    // launchParam.lastExitReason 表示上次退出原因
    console.info(`启动原因: ${launchParam.launchReason}`);
  }

  // onDestroy - Ability 销毁时调用
  // 用于释放资源、取消注册等清理工作
  onDestroy(): void {
    console.info('Ability onDestroy');

    // 清理资源
    this.cleanup();
  }

  // onWindowStageCreate - 窗口创建时调用
  // 这里加载 Ability 的 UI 内容
  // windowStage 是窗口管理器，可以加载页面
  onWindowStageCreate(windowStage: Window.WindowStage): void {
    console.info('Ability onWindowStageCreate');

    // 保存窗口引用
    this.windowStage = windowStage;

    // 设置页面内容
    // 这是加载 ArkUI 页面的地方
    windowStage.setMainWindowContent('pages/Index');

    // 或者加载自定义组件
    // windowStage.setMainWindowContentPath('ets/components/MainPage.ets');
  }

  // onWindowStageDestroy - 窗口销毁时调用
  // 窗口关闭时调用，用于清理 UI 相关资源
  onWindowStageDestroy(): void {
    console.info('Ability onWindowStageDestroy');

    // 清理窗口相关资源
    this.windowStage = null;
  }

  // onForeground - Ability 进入前台时调用
  // 应用从后台切换到前台时触发
  onForeground(): void {
    console.info('Ability onForeground');

    // 恢复在后台暂停的操作
    this.resumeTask();
  }

  // onBackground - Ability 进入后台时调用
  // 应用切换到后台时触发
  onBackground(): void {
    console.info('Ability onBackground');

    // 暂停正在进行的操作，如动画、音视频等
    this.pauseTask();
  }

  // onNewWant - 当 Ability 被重用时调用
  // 如果 Ability 没有销毁，系统会复用它并传入新的 want
  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    console.info('Ability onNewWant');

    // 处理新的启动意图
    this.handleNewWant(want);
  }

  // 辅助方法：清理资源
  private cleanup(): void {
    // 取消注册的监听器
    // 释放持有的资源
  }

  // 辅助方法：恢复任务
  private resumeTask(): void {
    // 恢复动画
    // 重新开始计时器
  }

  // 辅助方法：暂停任务
  private pauseTask(): void {
    // 暂停动画
    // 暂停计时器
  }

  // 辅助方法：处理新的启动意图
  private handleNewWant(want: Want): void {
    // 从 want 中获取参数
    const params = want.parameters;
    if (params) {
      const action = params['action'] as string;
      // 根据 action 执行不同操作
    }
  }
}
```

### 2.3 UIAbility 页面跳转

页面跳转是应用开发中最常见的场景之一。在鸿蒙中，页面跳转通过 router 模块实现。

```typescript
// 页面跳转示例

// 导入 router 模块
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

// 定义页面路径
// 页面路径需要在 module.json5 中配置
const INDEX_PAGE = 'pages/Index';
const DETAIL_PAGE = 'pages/Detail';
const PROFILE_PAGE = 'pages/Profile';

// 页面跳转示例
@Component
struct NavigationDemo {
  @State userId: string = '12345';

  build() {
    Column() {
      Text('导航示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold);

      Button('跳转到详情页')
        .onClick(() => {
          // 基本跳转
          router.pushUrl({
            url: DETAIL_PAGE,
            params: {
              // 传递参数
              id: this.userId,
              from: 'home'
            }
          });
        });

      Button('替换当前页')
        .onClick(() => {
          // replaceUrl 会替换当前页面
          // 用户按返回键时，不会返回到当前页面
          router.replaceUrl({
            url: DETAIL_PAGE,
            params: {
              id: this.userId
            }
          });
        });

      Button('返回上一页')
        .onClick(() => {
          // 返回上一页
          router.back();
        });

      Button('返回到指定页')
        .onClick(() => {
          // 返回到指定页面
          // 可以指定要返回的页面路由
          router.back({
            url: INDEX_PAGE
          });
        });

      Button('弹窗式跳转')
        .onClick(() => {
          // 某些场景下，跳转可能失败（如页面栈已满）
          // 返回值表示是否成功
        });

      Button('获取路由信息')
        .onClick(() => {
          // 获取当前路由信息
          const options = router.getState();
          console.info(`当前页面: ${options.url}`);
          console.info(`页面数量: ${options.index}`);
        });
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}

// ============================================
// 接收页面参数的示例
// ============================================

// 在目标页面中接收参数
@Entry
@Component
struct DetailPage {
  // 使用 @State 存储接收到的参数
  @State orderId: string = '';
  @State fromPage: string = '';

  // 页面即将显示时获取参数
  aboutToAppear(): void {
    // 从路由参数中获取数据
    const params = router.getParams() as Record<string, string>;
    if (params) {
      this.orderId = params['id'] || '';
      this.fromPage = params['from'] || '';
    }
  }

  build() {
    Column() {
      Text(`订单ID: ${this.orderId}`)
        .fontSize(18);

      Text(`来源页面: ${this.fromPage}`)
        .fontSize(14)
        .fontColor('#666');

      Button('返回')
        .onClick(() => {
          router.back();
        });
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}

// ============================================
// 路由拦截器示例
// ============================================

// 导入路由拦截相关模块
import { router } from '@kit.ArkUI';

// 路由拦截器可以用于权限验证等场景
// 在应用启动时设置全局拦截器

// router.setInterceptor((options) => {
//   // 在路由跳转前执行
//   const isLoggedIn = checkUserLogin();
//
//   if (!isLoggedIn && options.url !== 'pages/Login') {
//     // 未登录，跳转到登录页
//     router.pushUrl({ url: 'pages/Login' });
//     return false;  // 阻止原始跳转
//   }
//
//   return true;  // 允许跳转
// });
```

---

## 第三章：分布式应用开发

### 3.1 分布式概念与理念

鸿蒙的分布式能力是其最核心的特性之一。简单来说，分布式能力就是让多个设备能够协同工作，像一个整体一样。

传统的应用开发中，每个应用只运行在一个设备上。如果你想让手机和手表协同工作，需要通过蓝牙或网络传输数据，然后在两端分别处理。而鸿蒙的分布式能力，则允许你像调用本地能力一样调用远程设备的能力。

举一个生活化的例子：你想在家里的智能电视上观看手机拍摄的视频。传统方式需要：
1. 把视频从手机传输到电视（可能需要数据线或 AirPlay）
2. 在电视上打开视频播放应用
3. 如果电视上没有这个应用，还需要先安装

而有了鸿蒙的分布式能力，你可以：
1. 直接在手机上打开视频，然后"投屏"到电视
2. 视频解码、播放控制都在手机上进行，电视只是作为一个显示器
3. 你可以用手机控制播放进度、调整音量

更进一步，如果你想让手表控制电视播放，你可以把手表作为一个遥控器，把手机上的视频推到电视上。这就是"设备虚拟化"的概念——手表不需要真的成为一个遥控器，它只需要能够"借用"手机的遥控能力即可。

### 3.2 分布式数据管理

鸿蒙提供了分布式数据管理能力，让应用可以在多个设备间同步数据。

```typescript
// 分布式数据管理示例

// 导入分布式数据模块
import distributedData from '@ohos.data.distributedData';
importdistributedKVStore from '@ohos.data.distributedKVStore';

// ============================================
// 分布式键值存储
// ============================================

// 定义数据存储管理器
class DistributedDataManager {
  // KVStore 是分布式键值存储的实例
  private kvStore: distributedKVStore.KVStore | null = null;

  // 存储实例 ID
  private storeId: string = 'shared_data';

  // 初始化分布式存储
  async initialize(): Promise<void> {
    // 配置存储选项
    const options: distributedKVStore.Options = {
      createIfMissing: true,  // 如果不存在则创建
      encrypt: false,  // 是否加密存储
      backup: true,  // 是否支持备份
      autoSync: true,  // 是否自动同步
      // 分布式数据schema
      schema: {
        // 定义数据结构
        // 允许的字段类型
      }
    };

    try {
      // 获取分布式键值存储管理器
      const kvManager = await distributedKVStore.createKVManager({
        context: getContext(this),
        bundleName: 'com.example.app'
      });

      // 获取或创建存储实例
      this.kvStore = await kvManager.getKVStore(
        this.storeId,
        options
      );

      console.info('分布式存储初始化成功');

      // 添加数据变更监听
      this.setupDataObserver();

    } catch (error) {
      console.error('分布式存储初始化失败:', error);
    }
  }

  // 设置数据变更监听
  private setupDataObserver(): void {
    if (!this.kvStore) return;

    // 监听所有数据变更
    this.kvStore.on('dataChange', distributedKVStore.SubscribeType.SUBSCRIBE_TYPE_ALL,
      (data) => {
        console.info('数据变更:', JSON.stringify(data));

        // 处理变更通知
        this.handleDataChange(data);
      }
    );
  }

  // 处理数据变更
  private handleDataChange(data: distributedKVStore.ChangeNotification): void {
    // 获取变更的数据
    const insertEntries = data.insertEntries;
    const updateEntries = data.updateEntries;
    const deleteEntries = data.deleteEntries;

    // 处理新增数据
    insertEntries.forEach(entry => {
      console.info(`新增: ${entry.key} = ${entry.value.value}`);
    });

    // 处理更新数据
    updateEntries.forEach(entry => {
      console.info(`更新: ${entry.key} = ${entry.value.value}`);
    });

    // 处理删除数据
    deleteEntries.forEach(entry => {
      console.info(`删除: ${entry.key}`);
    });
  }

  // 写入数据
  async put(key: string, value: string): Promise<void> {
    if (!this.kvStore) {
      throw new Error('存储未初始化');
    }

    await this.kvStore.put(key, value);
    console.info(`数据写入成功: ${key} = ${value}`);
  }

  // 读取数据
  async get(key: string): Promise<string | null> {
    if (!this.kvStore) {
      throw new Error('存储未初始化');
    }

    const value = await this.kvStore.get(key);
    return value as string | null;
  }

  // 删除数据
  async delete(key: string): Promise<void> {
    if (!this.kvStore) {
      throw new Error('存储未初始化');
    }

    await this.kvStore.delete(key);
    console.info(`数据删除成功: ${key}`);
  }

  // 查询数据
  async query(predicate: distributedKVStore.DataPredicate): Promise<distributedKVStore.Entry[]> {
    if (!this.kvStore) {
      throw new Error('存储未初始化');
    }

    const result = await this.kvStore.query(predicate);
    return result.getAllEntries();
  }

  // 同步数据到其他设备
  async sync(deviceList: string[]): Promise<void> {
    if (!this.kvStore) {
      throw new Error('存储未初始化');
    }

    // 指定要同步的设备和键值
    const syncOptions: distributedKVStore.SyncOptions = {
      syncMode: distributedKVStore.SyncMode.PUSH_PULL,  // 推拉结合模式
      devices: deviceList
    };

    await this.kvStore.sync(syncOptions);
    console.info('数据同步成功');
  }

  // 关闭存储
  async close(): Promise<void> {
    if (this.kvStore) {
      await this.kvStore.close();
      this.kvStore = null;
      console.info('分布式存储已关闭');
    }
  }
}

// ============================================
// 分布式对象
// ============================================

// 分布式对象用于在设备间共享复杂对象

import distributedObject from '@ohos.data.distributedObject';

// 创建分布式对象管理器
class DistributedObjectManager {
  private sessionId: string = '';
  private userObject: distributedObject.Session | null = null;

  // 创建或加入分布式会话
  async createSession(deviceId: string): Promise<void> {
    // 生成会话 ID
    this.sessionId = `session_${Date.now()}`;

    // 创建分布式对象
    // 这里使用 OHOS 提供的 Session 类
    this.userObject = new distributedObject.Session(
      this.sessionId,
      getContext(this)
    );

    // 加入会话的设备
    const devices = [deviceId];

    console.info(`创建分布式会话: ${this.sessionId}`);
  }

  // 设置对象数据
  setUserData(data: {
    name: string;
    age: number;
    isOnline: boolean;
  }): void {
    if (!this.userObject) {
      throw new Error('会话未创建');
    }

    // 设置分布式对象的属性
    // 这些属性会自动同步到会话中的其他设备
    this.userObject.set('name', data.name);
    this.userObject.set('age', data.age);
    this.userObject.set('isOnline', data.isOnline);

    console.info('用户数据已更新:', JSON.stringify(data));
  }

  // 获取对象数据
  getUserData(): { name: string; age: number; isOnline: boolean } | null {
    if (!this.userObject) {
      return null;
    }

    return {
      name: this.userObject.get('name') as string,
      age: this.userObject.get('age') as number,
      isOnline: this.userObject.get('isOnline') as boolean
    };
  }

  // 注册数据变更监听
  onDataChange(callback: (data: any) => void): void {
    if (!this.userObject) {
      return;
    }

    // 监听数据变更
    this.userObject.on('change', (sessionId, changeType, results) => {
      console.info(`数据变更通知: ${sessionId}, ${changeType}`);
      callback(results);
    });
  }

  // 退出会话
  quitSession(): void {
    if (this.userObject) {
      this.userObject.release();
      this.userObject = null;
      console.info('已退出分布式会话');
    }
  }
}
```

### 3.3 跨设备迁移

跨设备迁移是鸿蒙的一个特色功能，允许将一个设备上的任务无缝迁移到另一个设备上。

```typescript
// 跨设备迁移示例

// 导入跨设备迁移相关模块
import UIAbility from '@ohos.app.ability.UIAbility';
import Want from '@ohos.app.ability.Want';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';
import ContinuationManager from '@ohos.app.continuation.ContinuationManager';

// 迁移能力接口
interface IContinuationAbility {
  // 开始迁移
  startMigration(deviceId: string): Promise<void>;

  // 完成迁移
  completeMigration(): void;

  // 取消迁移
  cancelMigration(): void;
}

// 迁移能力实现
class ContinuationService implements IContinuationAbility {
  private continuationManager: ContinuationManager | null = null;
  private isMigrating: boolean = false;

  async startMigration(deviceId: string): Promise<void> {
    if (this.isMigrating) {
      console.warn('迁移正在进行中');
      return;
    }

    try {
      this.isMigrating = true;

      // 创建迁移请求
      // 选择要迁移的 Ability
      const want: Want = {
        bundleName: 'com.example.app',
        abilityName: 'MainAbility'
      };

      // 设置迁移选项
      const options: AbilityConstant.ContinuationwantInfo = {
        // 目标设备 ID
        targetDevice: deviceId,
        // 是否自动启动目标设备上的 Ability
        flg: AbilityConstant.ContinuationFailureFlags.EMPTY,
        // 迁移模式
        version: 1
      };

      // 获取迁移管理器
      this.continuationManager = await ContinuationManager.getContinuationManager();

      // 注册迁移回调
      this.continuationManager.registerContinuationCallback((err, data) => {
        if (err) {
          console.error('迁移失败:', err);
          this.isMigrating = false;
          return;
        }

        console.info('迁移成功:', data);
        this.completeMigration();
      });

      // 开始迁移
      await this.continuationManager.startContinuation(want, options);

    } catch (error) {
      console.error('启动迁移失败:', error);
      this.isMigrating = false;
      throw error;
    }
  }

  completeMigration(): void {
    console.info('迁移完成');
    this.isMigrating = false;
  }

  cancelMigration(): void {
    if (this.continuationManager) {
      this.continuationManager.cancelContinuation();
    }
    this.isMigrating = false;
  }
}

// ============================================
// Ability 中的迁移处理
// ============================================

// 在 UIAbility 中处理迁移
class MigratableAbility extends UIAbility {
  // 是否正在迁移
  private is迁移中: boolean = false;

  // 开始迁移回调
  onStartContinuation(): boolean {
    console.info('开始迁移回调');

    // 返回 true 表示允许迁移
    // 返回 false 表示拒绝迁移
    return true;
  }

  // 迁移数据序列化的回调
  // 在这个方法中，你要把需要迁移的数据返回
  onSaveData(saveData: AbilityConstant.ContinuationWant): boolean {
    console.info('保存迁移数据');

    // 填充要迁移的数据
    // 这些数据会被发送到目标设备
    saveData.data = {
      // 应用状态
      currentPage: 'home',
      userId: '12345',
      scrollPosition: 0,
      formData: {
        name: '张三',
        selectedItems: ['item1', 'item2']
      },
      // 其他需要迁移的状态
    };

    return true;  // 返回 true 表示数据保存成功
  }

  // 目标设备数据恢复的回调
  onRestoreData(restoreData: AbilityConstant.ContinuationWant): void {
    console.info('恢复迁移数据');

    // 从 restoreData 中获取迁移来的数据
    const appState = restoreData.data;
    if (appState) {
      // 恢复应用状态
      this.restoreAppState(appState);
    }
  }

  // 迁移完成的回调
  onCompleteContinuation(code: number): void {
    console.info(`迁移完成，代码: ${code}`);

    this.is迁移中 = false;

    if (code === 0) {
      // 迁移成功，可以关闭源设备上的 Ability
      this.terminateSelf();
    } else {
      // 迁移失败，提示用户
      console.error(`迁移失败，错误码: ${code}`);
    }
  }

  // 迁移失败的回调
  onFailedContinuation(code: number): void {
    console.error(`迁移失败，错误码: ${code}`);
    this.is迁移中 = false;
  }

  // 恢复应用状态
  private restoreAppState(state: any): void {
    // 根据迁移来的数据恢复 UI 状态
    // 确保用户在目标设备上看到的内容与源设备一致
  }
}
```

---

## 第四章：FA 与 PA 组件

### 4.1 FA 模型概述

FA（Feature Ability）是鸿蒙早期版本使用的Ability模型，主要面向手机、平板等轻量级设备。FA 基于Page模板，每个页面都是一个独立的Ability。

在 FA 模型中，应用由多个 Page Ability 组成，每个 Page Ability 对应一个 UI 页面。用户通过在不同 Page Ability 之间切换来实现与应用交互。

FA 的特点是简单直接，每个页面都是独立的 Ability，生命周期与页面紧密相关。但随着设备类型增多，FA 模型在处理复杂场景时显得不够灵活。

### 4.2 PA 组件详解

PA（Particle Ability）是面向后台运行和跨设备协同的能力组件。相比 FA，PA 不直接与用户交互，而是提供服务。

PA 有三种类型：

**Data Ability**：用于管理结构化数据，类似 Android 的 Content Provider。可以提供数据库、文件等数据的访问接口。

**Service Ability**：用于后台任务处理，可以在应用退出后继续运行。类似于 Android 的 Service。

**Extension Ability**：用于扩展系统能力，如快捷方式、支付、输入法等。

```typescript
// ============================================
// Data Ability - 数据能力
// ============================================

// Data Ability 用于对外提供数据访问接口
// 它通过 Uri 来标识数据资源

import DataAbilityHelper from '@ohos.data.dataAbility';
import rdb from '@ohos.data.rdb';

// 定义数据能力
class MyDataAbility {
  // 数据能力名称
  private abilityName: string = 'MyDataAbility';

  // 表名
  private tableName: string = 'users';

  // RDB 数据库存储实例
  private rdbStore: rdb.RdbStore | null = null;

  // 初始化数据库
  async initDatabase(): Promise<void> {
    // 数据库配置
    const config: rdb.StoreConfig = {
      name: 'myapp.db',  // 数据库文件名
      securityLevel: rdb.SecurityLevel.S1  // 安全级别
    };

    // 创建或打开数据库
    this.rdbStore = await rdb.getRdbStore('database_config', config);

    // 创建表
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        email TEXT
      )
    `;

    await this.rdbStore.executeSql(createTableSql);
    console.info('数据库初始化成功');
  }

  // 插入数据
  async insert(uri: string, value: Record<string, number | string>): Promise<number> {
    if (!this.rdbStore) {
      throw new Error('数据库未初始化');
    }

    const rowId = await this.rdbStore.insert(this.tableName, value);
    console.info(`插入数据成功，ID: ${rowId}`);
    return rowId;
  }

  // 查询数据
  async query(
    uri: string,
    predicates: rdb.RdbPredicates
  ): Promise<Array<string>> {
    if (!this.rdbStore) {
      throw new Error('数据库未初始化');
    }

    const resultSet = await this.rdbStore.query(
      this.tableName,
      predicates
    );

    // 处理查询结果
    const results: Array<string> = [];
    while (resultSet.goToNextRow()) {
      results.push(resultSet.toString());
    }

    resultSet.close();
    return results;
  }

  // 更新数据
  async update(
    uri: string,
    value: Record<string, number | string>,
    predicates: rdb.RdbPredicates
  ): Promise<number> {
    if (!this.rdbStore) {
      throw new Error('数据库未初始化');
    }

    const affectedRows = await this.rdbStore.update(
      this.tableName,
      value,
      predicates
    );

    console.info(`更新了 ${affectedRows} 行数据`);
    return affectedRows;
  }

  // 删除数据
  async delete(uri: string, predicates: rdb.RdbPredicates): Promise<number> {
    if (!this.rdbStore) {
      throw new Error('数据库未初始化');
    }

    const deletedRows = await this.rdbStore.delete(
      this.tableName,
      predicates
    );

    console.info(`删除了 ${deletedRows} 行数据`);
    return deletedRows;
  }

  // 获取数据能力 Helper
  getDataAbilityHelper(context: any): DataAbilityHelper {
    return DataAbilityHelper.create(context);
  }
}

// ============================================
// Service Ability - 服务能力
// ============================================

// Service Ability 用于后台任务处理
// 它没有 UI，在后台运行

import ServiceAbility from '@ohos.app.ability.ServiceAbility';
import Want from '@ohos.app.ability.Want';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';

// 服务能力类
class MyServiceAbility extends ServiceAbility {
  // 服务启动时调用
  onStart(want: Want, startId: number): void {
    console.info(`服务启动，startId: ${startId}`);

    // 初始化服务资源
    this.initialize();
  }

  // 服务连接时调用
  onCommand(want: Want, startId: number, restart: boolean): void {
    console.info(`服务命令，startId: ${startId}, restart: ${restart}`);

    // 处理服务命令
    this.handleCommand(want);
  }

  // 服务连接到 Ability
  onConnect(want: Want): void {
    console.info('服务已连接');

    // 返回一个 RemoteObject 用于跨进程通信
    return {
      // 实现 IRemoteBroker 接口
      queryInterface: (interfaceId: number) => {
        return null;
      },
      sendRequest: (code: number, data: any, reply: any) => {
        // 处理请求
        return 0;
      }
    };
  }

  // 服务断开连接时调用
  onDisconnect(want: Want): void {
    console.info('服务已断开');
  }

  // 服务销毁时调用
  onStop(): void {
    console.info('服务停止');

    // 清理资源
    this.cleanup();
  }

  // 初始化服务
  private initialize(): void {
    // 初始化数据库连接
    // 初始化网络连接
    // 启动后台任务
  }

  // 处理服务命令
  private handleCommand(want: Want): void {
    // 从 want 中获取命令参数
    const command = want.action;
    const params = want.parameters;

    console.info(`处理命令: ${command}`);
  }

  // 清理资源
  private cleanup(): void {
    // 关闭数据库连接
    // 取消网络请求
    // 保存状态
  }
}

// ============================================
// Extension Ability - 扩展能力
// ============================================

// Extension Ability 用于扩展系统能力
// 常见的 Extension 类型包括：
// - FormExtension: 卡片服务
// - InputMethodExtension: 输入法
// - WallpaperExtension: 壁纸服务
// - BackupExtension: 备份恢复

// 以 FormExtension（卡片服务）为例
import FormExtensionAbility from '@ohos.app.ability.FormExtensionAbility';
import formBindingData from '@ohos.app.form.formBindingData';

// 卡片扩展能力
class MyFormExtension extends FormExtensionAbility {
  // 添加卡片时调用
  onAddForm(want: Want): formBindingData.FormBindingData {
    console.info('添加卡片');

    // 创建卡片数据
    const formData = {
      title: '待办事项',
      items: [
        { text: '项目一', completed: false },
        { text: '项目二', completed: true }
      ]
    };

    return formBindingData.createFormBindingData(formData);
  }

  // 卡片销毁时调用
  onRemoveForm(formId: string): void {
    console.info(`移除卡片: ${formId}`);

    // 清理卡片相关资源
  }

  // 更新卡片数据时调用
  onUpdateForm(formId: string): void {
    console.info(`更新卡片: ${formId}`);

    // 获取最新数据并返回
    return formBindingData.createFormBindingData({
      title: '待办事项（已更新）',
      items: []
    });
  }

  // 卡片可见性变化时调用
  onFormVisibilityChange(formIds: Array<string>): void {
    console.info(`卡片可见性变化: ${JSON.stringify(formIds)}`);
  }

  // 获取卡片信息
  onCastToNormalForm(formId: string): void {
    console.info(`临时卡片转正常: ${formId}`);
  }

  // 更新卡片事件
  onTriggerEvent(formId: string, message: string): void {
    console.info(`卡片事件: ${formId}, ${message}`);
  }
}
```

---

## 第五章：综合实战

### 5.1 完整项目结构

一个标准 HarmonyOS 应用的项目结构如下：

```
entry/
├── src/
│   └── main/
│       ├── ets/
│       │   ├── entryability/
│       │   │   └── EntryAbility.ets      # 应用入口Ability
│       │   │
│       │   ├── pages/
│       │   │   ├── Index.ets              # 首页
│       │   │   ├── Detail.ets              # 详情页
│       │   │   └── Settings.ets            # 设置页
│       │   │
│       │   ├── components/
│       │   │   ├── UserCard.ets            # 用户卡片组件
│       │   │   ├── ProductList.ets         # 商品列表组件
│       │   │   └── LoadingView.ets         # 加载组件
│       │   │
│       │   ├── services/
│       │   │   ├── AuthService.ets         # 认证服务
│       │   │   ├── NetworkService.ets      # 网络服务
│       │   │   └── StorageService.ets     # 存储服务
│       │   │
│       │   ├── models/
│       │   │   ├── UserModel.ets           # 用户模型
│       │   │   └── ProductModel.ets        # 产品模型
│       │   │
│       │   ├── utils/
│       │   │   ├── Logger.ets              # 日志工具
│       │   │   ├── HttpClient.ets          # HTTP客户端
│       │   │   └── Constants.ets           # 常量定义
│       │   │
│       │   └── resources/
│       │       ├── base/
│       │       │   ├── element/            # 资源元素
│       │       │   ├── media/              # 媒体资源
│       │       │   └── string/              # 字符串资源
│       │       └── zh_CN/                  # 中文资源
│       │
│       ├── module.json5                   # 模块配置
│       └── resources.index                 # 资源索引
│
├── build-profile.json5                    # 构建配置
└── hvigorfile.ts                          # HVigor构建脚本
```

### 5.2 完整页面示例

```typescript
// ============================================
// 完整页面示例：商品详情页
// ============================================

// 导入必要的模块
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import image from '@ohos.multimedia.image';

// 页面入口Ability
import UIAbility from '@ohos.app.ability.UIAbility';
import Window from '@ohos.window';

// ============================================
// 数据模型
// ============================================

// 商品数据模型
class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  specs: Map<string, string>;

  constructor(data: Partial<Product>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.originalPrice = data.originalPrice || 0;
    this.images = data.images || [];
    this.rating = data.rating || 0;
    this.reviewCount = data.reviewCount || 0;
    this.stock = data.stock || 0;
    this.specs = data.specs || new Map();
  }

  // 获取折扣比例
  getDiscount(): number {
    if (this.originalPrice <= 0) return 0;
    return Math.round((1 - this.price / this.originalPrice) * 100);
  }

  // 是否在促销
  isOnSale(): boolean {
    return this.price < this.originalPrice;
  }
}

// 购物车项数据模型
class CartItem {
  product: Product;
  quantity: number;
  selectedSpec: Map<string, string>;

  constructor(product: Product, quantity: number = 1) {
    this.product = product;
    this.quantity = quantity;
    this.selectedSpec = new Map();
  }

  // 计算小计
  getSubtotal(): number {
    return this.product.price * this.quantity;
  }
}

// ============================================
// 商品详情页面组件
// ============================================

@Entry
@Component
struct ProductDetailPage {
  // 页面状态
  @State product: Product | null = null;
  @State selectedImageIndex: number = 0;
  @State quantity: number = 1;
  @State isLoading: boolean = true;
  @State isAddingToCart: boolean = false;
  @State selectedSpecs: Map<string, string> = new Map();
  @State showSpecSheet: boolean = false;

  // 本地存储
  private storage = LocalStorage.getShared();

  // 生命周期：页面即将显示
  aboutToAppear(): void {
    // 获取路由参数
    const params = router.getParams() as Record<string, string>;
    if (params && params.productId) {
      this.loadProductDetail(params.productId);
    }
  }

  // 加载商品详情
  async loadProductDetail(productId: string): Promise<void> {
    this.isLoading = true;

    try {
      // 模拟网络请求
      // 实际应用中，应该调用真实 API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模拟数据
      this.product = new Product({
        id: productId,
        name: '华为 Mate 60 Pro 智能手机',
        description: '华为旗舰手机，搭载麒麟9000S芯片，支持卫星通话，全焦段超清影像。',
        price: 6999,
        originalPrice: 7999,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
        rating: 4.8,
        reviewCount: 12580,
        stock: 50,
        specs: new Map([
          ['颜色', '雅丹黑'],
          ['存储', '256GB'],
          ['RAM', '12GB']
        ])
      });

      // 初始化默认规格
      this.product.specs.forEach((value, key) => {
        this.selectedSpecs.set(key, value);
      });

    } catch (error) {
      console.error('加载商品详情失败:', error);
      promptAction.showToast({
        message: '加载失败，请重试',
        duration: 2000
      });
    } finally {
      this.isLoading = false;
    }
  }

  // 添加到购物车
  async addToCart(): Promise<void> {
    if (!this.product) return;

    if (this.product.stock <= 0) {
      promptAction.showToast({
        message: '商品已售罄',
        duration: 2000
      });
      return;
    }

    this.isAddingToCart = true;

    try {
      // 模拟添加到购物车
      await new Promise(resolve => setTimeout(resolve, 500));

      promptAction.showToast({
        message: '已添加到购物车',
        duration: 2000
      });

      // 可以导航到购物车页面
      // router.pushUrl({ url: 'pages/Cart' });

    } catch (error) {
      console.error('添加购物车失败:', error);
      promptAction.showToast({
        message: '添加失败，请重试',
        duration: 2000
      });
    } finally {
      this.isAddingToCart = false;
    }
  }

  // 立即购买
  async buyNow(): Promise<void> {
    if (!this.product) return;

    if (this.product.stock <= 0) {
      promptAction.showToast({
        message: '商品已售罄',
        duration: 2000
      });
      return;
    }

    // 创建订单并跳转到结算页面
    promptAction.showToast({
      message: '正在跳转到结算页面...',
      duration: 1500
    });

    setTimeout(() => {
      router.pushUrl({
        url: 'pages/Checkout',
        params: {
          productId: this.product!.id,
          quantity: this.quantity.toString()
        }
      });
    }, 1500);
  }

  // 选择规格
  selectSpec(specName: string, value: string): void {
    this.selectedSpecs.set(specName, value);
  }

  // 获取星级评分组件
  @Builder
  buildRatingStars(rating: number) {
    Row() {
      ForEach([1, 2, 3, 4, 5], (index: number) => {
        Image(
          index <= Math.floor(rating)
            ? 'common/icons/star_filled.png'
            : index - 0.5 <= rating
              ? 'common/icons/star_half.png'
              : 'common/icons/star_empty.png'
        )
          .width(16)
          .height(16);
      });

      Text(`${rating}`)
        .fontSize(14)
        .fontColor('#FF6600')
        .margin({ left: 4 });

      Text(`(${this.product?.reviewCount || 0}条评价)`)
        .fontSize(12)
        .fontColor('#999999')
        .margin({ left: 8 });
    }
  }

  build() {
    Stack() {
      if (this.isLoading) {
        // 加载状态
        Column() {
          LoadingProgress()
            .width(48)
            .height(48);

          Text('加载中...')
            .fontSize(14)
            .fontColor('#999999')
            .margin({ top: 16 });
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center);

      } else if (this.product) {
        Column() {
          // 主内容区
          Column() {
            // 滚动区域
            Scroll() {
              Column() {
                // 商品图片轮播
                Swiper() {
                  ForEach(this.product.images, (imageUrl: string, index: number) => {
                    Image(imageUrl)
                      .width('100%')
                      .height(300)
                      .objectFit(ImageFit.Contain)
                      .backgroundColor('#F5F5F5');
                  });
                }
                .index(this.selectedImageIndex)
                .autoPlay(true)
                .interval(3000)
                .indicator(
                  new DotIndicator()
                    .selectedColor('#FF6600')
                    .color('#CCCCCC')
                )
                .loop(true)
                .width('100%')
                .height(300);

                // 商品信息区域
                Column() {
                  // 价格区域
                  Row() {
                    Text('¥')
                      .fontSize(16)
                      .fontColor('#FF6600')
                      .fontWeight(FontWeight.Bold);

                    Text(this.product.price.toString())
                      .fontSize(32)
                      .fontColor('#FF6600')
                      .fontWeight(FontWeight.Bold);

                    if (this.product.isOnSale()) {
                      Text(`¥${this.product.originalPrice}`)
                        .fontSize(14)
                        .fontColor('#999999')
                        .decoration({ type: TextDecorationType.LineThrough })
                        .margin({ left: 12 });

                      Text(`${this.product.getDiscount()}折`)
                        .fontSize(12)
                        .fontColor('#FFFFFF')
                        .backgroundColor('#FF6600')
                        .borderRadius(4)
                        .padding({ left: 6, right: 6, top: 2, bottom: 2 })
                        .margin({ left: 8 });
                    }
                  }
                  .width('100%')
                  .alignItems(VerticalAlign.Bottom);

                  // 商品名称
                  Text(this.product.name)
                    .fontSize(18)
                    .fontWeight(FontWeight.Medium)
                    .margin({ top: 12 });

                  // 评分
                  this.buildRatingStars(this.product.rating)
                    .margin({ top: 8 });

                  // 描述
                  Text(this.product.description)
                    .fontSize(14)
                    .fontColor('#666666')
                    .margin({ top: 12 })
                    .lineHeight(22);

                  // 规格选择
                  Column() {
                    ForEach(Array.from(this.product.specs.entries()), (entry: [string, string]) => {
                      Row() {
                        Text(entry[0])
                          .fontSize(14)
                          .fontColor('#999999');

                        Blank();

                        Text(entry[1])
                          .fontSize(14)
                          .fontColor('#333333');

                        Image('common/icons/arrow_right.png')
                          .width(16)
                          .height(16)
                          .margin({ left: 8 });
                      }
                      .width('100%')
                      .padding({ top: 12, bottom: 12 })
                      .onClick(() => {
                        this.showSpecSheet = true;
                      });
                    });
                  }
                  .margin({ top: 16 })
                  .padding({ left: 16, right: 16 })
                  .backgroundColor('#F8F8F8')
                  .borderRadius(8);

                  // 配送信息
                  Row() {
                    Image('common/icons/location.png')
                      .width(16)
                      .height(16);

                    Text('广东深圳  预计2-3天送达')
                      .fontSize(12)
                      .fontColor('#666666')
                      .margin({ left: 4 });

                    Blank();

                    Text('运费: ¥0')
                      .fontSize(12)
                      .fontColor('#666666');
                  }
                  .width('100%')
                  .margin({ top: 16 });
                }
                .padding(16);
              }
              .width('100%');
            }
            .layoutWeight(1)  // 占据剩余空间
            .align(Alignment.Top)
            .edgeEffect(EdgeEffect.Spring);  // 弹性效果

            // 底部操作栏
            Row() {
              // 收藏按钮
              Column() {
                Image('common/icons/favorite.png')
                  .width(24)
                  .height(24);

                Text('收藏')
                  .fontSize(10)
                  .fontColor('#666666');
              }
              .width(60);

              // 客服按钮
              Column() {
                Image('common/icons/service.png')
                  .width(24)
                  .height(24);

                Text('客服')
                  .fontSize(10)
                  .fontColor('#666666');
              }
              .width(60);

              // 购物车按钮
              Column() {
                Badge({
                  count: 3,
                  style: { badgeSize: 14, badgeColor: '#FF6600' },
                  position: BadgePosition.RightTop
                }) {
                  Image('common/icons/cart.png')
                    .width(24)
                    .height(24);
                }

                Text('购物车')
                  .fontSize(10)
                  .fontColor('#666666');
              }
              .width(60);

              // 加入购物车按钮
              Button('加入购物车')
                .width(140)
                .height(44)
                .fontSize(16)
                .fontColor('#FFFFFF')
                .backgroundColor('#FF6600')
                .borderRadius({ topLeft: 22, bottomLeft: 22 })
                .onClick(() => {
                  this.addToCart();
                });

              // 立即购买按钮
              Button('立即购买')
                .width(140)
                .height(44)
                .fontSize(16)
                .fontColor('#FFFFFF')
                .backgroundColor('#E60012')
                .borderRadius({ topRight: 22, bottomRight: 22 })
                .onClick(() => {
                  this.buyNow();
                });
            }
            .width('100%')
            .height(64)
            .padding({ left: 16 })
            .backgroundColor('#FFFFFF')
            .alignItems(VerticalAlign.Center);
          }
          .width('100%')
          .height('100%');
        }

      } else {
        // 空状态
        Column() {
          Image('common/icons/empty.png')
            .width(120)
            .height(120);

          Text('商品不存在')
            .fontSize(16)
            .fontColor('#999999')
            .margin({ top: 16 });

          Button('返回首页')
            .margin({ top: 24 })
            .onClick(() => {
              router.back();
            });
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center);
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F5F5F5');
  }
}
```

---

## 结语

鸿蒙 HarmonyOS 代表了华为在操作系统领域的雄心壮志。它的分布式架构、统一开发范式和对多设备的支持，代表了未来操作系统发展的一个重要方向。

对于开发者而言，鸿蒙带来了新的机遇：

1. **全场景开发能力**：一次开发，多端部署，大大提高了开发效率
2. **分布式带来的创新空间**：新的应用形态和交互方式等待着我们去探索
3. **生态红利**：随着鸿蒙设备的普及，开发者将有更多的用户群体

当然，鸿蒙生态还在快速发展中，很多 API 和开发工具还在不断完善。作为开发者，我们需要持续学习和实践，才能跟上这个生态的发展步伐。

ArkTS 的声明式开发范式、Stage 模型的应用架构、分布式能力带来的创新空间——这些都是值得深入探索的方向。

希望本指南能帮助你开启鸿蒙开发之旅。记住，最好的学习方式是动手实践。从创建一个简单的页面开始，逐步深入到分布式能力的应用，你会发现鸿蒙开发的乐趣所在。

祝你在鸿蒙的世界里探索愉快！
