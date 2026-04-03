# React Native 深入实战完全指南

## 前言

React Native 这个框架的出现，彻底改变了移动开发的格局。想象一下，你以前要做一个 iOS 应用，得学 Objective-C 或 Swift；要做 Android 应用，得学 Java 或 Kotlin。两套完全不同的技术栈，两拨完全不同的工程师，沟通成本高得吓人。React Native 的出现，就像是在两座孤岛之间建了一座桥——你只需要写一份 JavaScript 代码，就能同时跑在 iOS 和 Android 上。当然，这座桥有时候也会堵车（性能问题），有时候路不太平整（兼容性问题），但总体来说，它让移动开发变得前所未有的高效。

本指南将带你深入 React Native 的世界，从最基础的原生模块开发，到最前沿的新架构 Fabric，再到生产环境中不可或缺的闪屏页、热更新和监控体系。准备好了吗？让我们开始这场技术之旅。

---

## 第一章：React Native 核心原理

### 1.1 框架架构概述

React Native 的架构设计非常巧妙，它不是简单地把 Web 页面包装成 App，而是重新定义了一套渲染模式。让我用盖房子来打个比方：

**传统 Native 开发**就像是请了一支专业的建筑队，你告诉工头要什么样的房子，他就派相应的人去施工。 iOS 有 iOS 的施工队，Android 有 Android 的施工队，两边各自用各自的材料和方法。

**React Native 开发**则像是请了一个翻译团队。你用 JavaScript 描述你想要什么样的房子（声明式 UI），翻译团队会把这个需求翻译成各自本地语言，告诉 iOS 和 Android 的施工队该怎么执行。这样你只需要和一个团队沟通，效率大大提高。

React Native 的架构经历了三个阶段的演进：

**第一阶段：Bridge 架构（Legacy）**

这是 React Native 最早期的架构，也是很多老项目还在使用的。它的核心是一个叫做 Bridge（桥）的双向通信通道。JavaScript 端和 Native 端各自运行在独立的线程上，通过 JSON 消息进行通信。

```
┌─────────────────┐     JSON      ┌─────────────────┐
│   JavaScript    │ ←───────────→ │     Bridge      │
│    Thread       │   异步序列化   │   (C++ Core)    │
└─────────────────┘               └─────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ↓                    ↓                    ↓
            ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
            │   iOS Native   │    │ Android Native│    │   其他平台     │
            │    Modules     │    │    Modules     │    │   Modules      │
            └───────────────┘    └───────────────┘    └───────────────┘
```

Bridge 的工作方式是：JavaScript 线程和 Native 线程各自维护一个消息队列，当一边有数据需要传递时，就把数据序列化成 JSON 格式，发送到 Bridge，Bridge 再把这个 JSON 反序列化后传给另一边的消息队列。这听起来很合理，但实际上存在几个严重的问题：

1. **异步阻塞**：每次通信都需要经过 JSON 序列化和反序列化，这个过程是同步的，会阻塞 UI 线程
2. **额外开销**：JSON 序列化本身就有性能开销，特别是在传递大量数据时
3. **Batch 效率低**：消息是批量传递的，不能实时响应

**第二阶段：TurboModules 和 Fabric（New Architecture）**

为了解决 Bridge 的性能问题，React Native 0.68 开始引入了新架构，核心是三个关键组件：Fabric Renderer、TubroModules 和 CodeGen。

Fabric 是新的渲染引擎，它允许在 UI 线程上同步调用 JavaScript 代码，而不是像以前那样通过 Bridge 异步通信。这就像是给两座岛之间建了一条高速公路，而不是普通的桥梁。

TurboModules 则是对原生模块系统的重新设计。在 Legacy 架构中，原生模块需要在应用启动时就全部初始化，这不仅浪费时间，还占用内存。在 TurboModules 架构中，原生模块是按需加载的，就像云服务的理念一样——你需要什么，才加载什么。

CodeGen 是代码生成工具，它会根据 JavaScript 端的类型定义，自动生成 Native 端的类型安全代码。这意味着你不再需要在两端手动维护重复的类型定义，也不容易出现类型不匹配的问题。

**第三阶段：Bridgeless 模式（RN 0.78+）**

从 React Native 0.78 开始，新架构成为默认选项，Bridge 模式被标记为废弃。这个阶段的核心特点是 JavaScript 和 Native 之间的通信不再依赖 Bridge，而是直接通过 JSI（JavaScript Interface）进行。

### 1.2 核心模块解析

理解 React Native 的核心模块，对于深入掌握这个框架至关重要。让我们逐一拆解：

**Shadow Tree（影子树）**

在 React Native 中，你写的 JSX 组件最终会生成一个 Shadow Tree（影子树）。这个名字听起来很神秘，但其实概念很简单：Shadow Tree 是 UI 组件在 JavaScript 世界的抽象表示，它和 Native 世界的真实视图是一一对应的。

为什么叫"影子"呢？因为它不是真实的视图，只是真实视图的"影子"或"倒影"。当你在 JSX 中写一个 `<View>` 时，React Native 会在内存中创建一个对应的 Shadow Node（影子节点），这个节点包含了你想要渲染的样式信息。然后 Native 端会读取这个 Shadow Tree，根据 Shadow Node 的信息来创建和布局真实的视图。

Shadow Tree 的存在使得跨平台的布局计算成为可能。Facebook 的工程师们设计了一套叫做 Yoga 的布局引擎，它能够根据 Shadow Node 中的 flexbox 布局信息，计算出每个视图在屏幕上的精确位置。由于 Yoga 是用 C++ 写的，可以在所有平台上复用，这就保证了 iOS 和 Android 上的布局完全一致。

**Layout Animation（布局动画）**

React Native 内置了一套布局动画系统，它可以在布局属性（位置、尺寸）发生变化时，自动计算出一个平滑的过渡动画。这个系统的工作原理是：当某个组件的布局发生变化时，React Native 会计算出旧布局和新布局之间的差异，然后生成一组插值动画。

```javascript
// React Native 布局动画示例
import { LayoutAnimation, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 启动布局动画配置
LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

export default function LayoutAnimationDemo() {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* 点击后容器高度会平滑过渡 */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // 关键：下次渲染时自动应用布局动画
          setExpanded(!expanded);
        }}
      >
        <Text style={styles.buttonText}>
          {expanded ? '收起' : '展开'}
        </Text>
      </TouchableOpacity>

      <View style={[styles.content, expanded && styles.contentExpanded]}>
        <Text style={styles.contentText}>
          这是一段会自动展开和收起的内容
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },
  button: {
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    marginHorizontal: 20,
    marginTop: 20,
    height: 0,  // 初始高度为0
    overflow: 'hidden',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  contentExpanded: {
    height: 200,  // 展开后高度
  },
  contentText: {
    padding: 20,
    fontSize: 14,
    color: '#333',
  },
});
```

LayoutAnimation 的神奇之处在于：你只需要调用 `configureNext`，然后改变组件的布局，剩下的动画计算全部由框架自动完成。框架会测量前一次布局和当前布局的差异，然后生成一个平滑的过渡动画。这个过程完全在 Native 端执行，所以性能非常好。

### 1.3 通信机制详解

React Native 中 JavaScript 和 Native 之间的通信是整个框架最核心的部分。让我深入剖析这个通信机制的工作原理。

**Legacy Bridge 通信**

在 Legacy 架构中，通信是通过一个叫做 Bridge 的模块完成的。Bridge 本质上是一个消息队列系统，JavaScript 端和 Native 端各自维护一个队列，通过事件循环进行异步通信。

```javascript
// JavaScript 端：调用 Native 模块
import { NativeModules } from 'react-native';

// NativeModules 是 JavaScript 端访问原生模块的入口
// 假设我们有一个原生模块叫 CustomCamera
const { CustomCamera } = NativeModules;

// 调用原生方法
async function takePhoto() {
  try {
    // 这看起来像是普通的异步函数调用
    // 但实际上这个调用会经过 Bridge 传递到 Native 端
    const result = await CustomCamera.takePicture({
      quality: 0.8,
      width: 1920,
      height: 1080,
    });
    return result.uri;
  } catch (error) {
    console.error('拍照失败:', error.message);
    throw error;
  }
}

// 监听原生事件
import { NativeEventEmitter } from 'react-native';

const eventEmitter = new NativeEventEmitter(CustomCamera);

const subscription = eventEmitter.addListener(
  'onPhotoTaken',  // 事件名称
  (event) => {
    // 当原生端触发这个事件时，这个回调函数会被调用
    console.log('收到照片:', event.uri);
  }
);

// 组件卸载时记得取消订阅，防止内存泄漏
// 这是非常重要但经常被忽视的一个点
useEffect(() => {
  return () => {
    subscription.remove();
  };
}, []);
```

在 Native 端（iOS/Objective-C 示例），对应的实现是这样的：

```objectivec
// CustomCamera.m
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// RCTBridgeModule 协议是所有原生模块必须实现的
// 它定义了模块在 Bridge 中的基本行为
@interface CustomCamera : NSObject <RCTBridgeModule>

@property (nonatomic, strong) RCTEventEmitter *eventEmitter;

@end

@implementation CustomCamera

// 这个方法是必须的，用于注册模块
// React Native 会根据这个方法的返回值来唯一标识这个模块
+ (BOOL)requiresMainQueueSetup {
  // 返回 YES 表示这个模块需要在主线程初始化
  // 大部分需要操作 UI 的模块都应该返回 YES
  return YES;
}

// 暴露给 JavaScript 的方法必须用 RCT_EXPORT_METHOD 包装
// 方法名会直接作为 JavaScript 端调用的名称
RCT_EXPORT_METHOD(takePicture:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // 这里的代码运行在 Native 端
  // 可以调用任何 iOS SDK 的 API
  UIImagePickerController *picker = [[UIImagePickerController alloc] init];
  picker.sourceType = UIImagePickerControllerSourceTypeCamera;
  picker.allowsEditing = NO;

  // 在主线程上显示相机界面
  dispatch_async(dispatch_get_main_queue(), ^{
    // 捕获 self 以便在回调中使用
    __weak typeof(self) weakSelf = self;

    picker.completionHandler = ^(UIImagePickerController *picker,
                                  NSDictionary *info,
                                  NSError *error) {
      __strong typeof(weakSelf) strongSelf = weakSelf;

      if (error) {
        // 发生错误时调用 reject
        reject(@"CAMERA_ERROR", error.localizedDescription, error);
        return;
      }

      // 成功时调用 resolve
      // 返回给 JavaScript 的数据必须是 JSON 兼容的类型
      NSString *imagePath = info[UIImagePickerControllerImageURL];
      resolve(@{
        @"uri": imagePath ?: @"",
        @"width": @1920,
        @"height": @1080,
        @"timestamp": @([[NSDate date] timeIntervalSince1970])
      });
    };

    [[self topViewController] presentViewController:picker animated:YES completion:nil];
  });
}

// 发送事件到 JavaScript
- (void)sendEventWithName:(NSString *)name body:(id)body {
  // 通过事件发射器发送事件
  // JavaScript 端通过 addListener 注册的回调会被调用
  [self.eventEmitter sendEventWithName:name body:body];
}

@end
```

Legacy Bridge 的通信流程是这样的：

1. JavaScript 端调用 `CustomCamera.takePicture()`
2. React Native 将方法名和参数打包成 JSON
3. JSON 数据通过 Bridge 传递到 Native 端
4. Native 端接收并解析 JSON
5. Native 端执行实际操作（这里打开了相机）
6. 操作完成后，结果被序列化成 JSON
7. JSON 通过 Bridge 传回 JavaScript 端
8. JavaScript 端接收到结果，调用 Promise 的 resolve 或 reject

整个过程看起来很复杂，实际上也确实复杂。每次通信都需要序列化和反序列化，而且这个过程是异步的，所以会有明显的延迟。这就是为什么 Legacy Bridge 的性能一直被诟病。

**新架构 JSI 通信**

新架构引入了 JSI（JavaScript Interface），它允许 JavaScript 直接调用 C++ 的函数对象，而不需要通过 Bridge 进行 JSON 序列化。

```javascript
// 新架构下的模块调用方式看起来是一样的
// 但底层实现完全不同
import { NativeModules } from 'react-native';

const { CustomCamera } = NativeModules;

// 调用原生方法
async function takePhoto() {
  // 在新架构下，这会直接调用 Native 函数
  // 不再需要 JSON 序列化和异步等待
  const result = await CustomCamera.takePicture({
    quality: 0.8,
    width: 1920,
    height: 1080,
  });
  return result.uri;
}
```

JSI 的核心思想是把 Native 函数"暴露"为一个 JavaScript 可以直接调用的函数对象。在 Legacy 架构中，JavaScript 调用 Native 需要经过 Bridge 这个"中介"，而在新架构中，JavaScript 可以直接"看到"Native 函数。

这种设计有几个关键优势：

首先，**同步调用成为可能**。在 Legacy 架构中，由于 Bridge 的异步性质，JavaScript 调用 Native 必须是异步的。在新架构中，如果 Native 函数被标记为同步，JavaScript 可以同步调用它，这对于某些需要立即返回结果的场景非常有用。

其次，**类型安全**。通过 CodeGen，JavaScript 端的类型定义可以自动生成 Native 端的类型声明，编译时就能发现类型不匹配的问题，而不是等到运行时才发现。

第三，**性能提升**。没有了 JSON 序列化和反序列化的开销，通信速度大幅提升。根据 Facebook 的测试，新架构下 JavaScript 和 Native 之间的通信速度可以提升数倍。

---

## 第二章：原生模块开发

### 2.1 原生模块基础

原生模块是 React Native 扩展能力的重要来源。当 JavaScript 做不到或者做不好的事情时，原生模块就是我们的救星。什么场景需要原生模块呢？比如访问 iOS 的 HealthKit、调用相机的某些高级功能、使用特定硬件的 SDK、或者需要极致性能的图像处理等。

让我从一个实际的例子开始：创建一个图片处理原生模块，它可以在 Native 端对图片进行压缩和裁剪，避免在 JavaScript 端处理大图片时的卡顿。

**创建原生模块的基本步骤：**

1. 在 iOS 原生代码中创建模块类
2. 实现 RCTBridgeModule 协议
3. 用 RCT_EXPORT_METHOD 暴露方法
4. 在 JavaScript 端导入和使用

```javascript
// JavaScript 端：定义原生模块的类型
// 这在新架构下会由 CodeGen 自动生成，这里展示手动定义的版本
import { NativeModules, Platform } from 'react-native';

// 定义原生模块的接口类型
// TypeScript 会检查我们调用的是否符合这个接口
interface ImageProcessorInterface {
  // 压缩图片
  compressImage(
    uri: string,
    quality: number,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<CompressedImageResult>;

  // 裁剪图片
  cropImage(
    uri: string,
    cropArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): Promise<CroppedImageResult>;

  // 获取图片信息（同步方法）
  getImageInfo(uri: string): Promise<ImageInfo>;
}

// 定义返回结果的类型
interface CompressedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number;  // 文件大小（字节）
}

interface CroppedImageResult {
  uri: string;
  width: number;
  height: number;
}

interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  orientation?: number;
}

// 获取原生模块实例
// NativeModules 包含了所有注册的原生模块
// 模块名必须和 Native 端注册的名称完全一致
const { ImageProcessor } = NativeModules;

// 创建具有类型安全的封装
export const imageProcessor: ImageProcessorInterface = {
  async compressImage(uri, quality, options = {}) {
    // 参数验证
    if (quality < 0 || quality > 1) {
      throw new Error('质量参数必须在 0 到 1 之间');
    }

    if (options.maxWidth !== undefined && options.maxWidth <= 0) {
      throw new Error('最大宽度必须大于 0');
    }

    try {
      // 调用原生方法
      // 如果原生端抛出异常，这里会捕获到
      const result = await ImageProcessor.compressImage(
        uri,
        quality,
        {
          maxWidth: options.maxWidth ?? 0,
          maxHeight: options.maxHeight ?? 0,
          format: options.format ?? 'jpeg',
        }
      );
      return result;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  },

  async cropImage(uri, cropArea) {
    // 验证裁剪区域
    const { x, y, width, height } = cropArea;
    if (width <= 0 || height <= 0) {
      throw new Error('裁剪区域宽高必须大于 0');
    }
    if (x < 0 || y < 0) {
      throw new Error('裁剪区域坐标不能为负');
    }

    return await ImageProcessor.cropImage(uri, cropArea);
  },

  async getImageInfo(uri) {
    return await ImageProcessor.getImageInfo(uri);
  },
};

// 使用示例
async function processUserAvatar() {
  try {
    // 第一步：获取原图信息
    const originalInfo = await imageProcessor.getImageInfo(
      'file:///storage/photos/avatar_original.jpg'
    );
    console.log('原图尺寸:', originalInfo.width, 'x', originalInfo.height);

    // 第二步：压缩并缩小到最大 200x200
    const compressed = await imageProcessor.compressImage(
      'file:///storage/photos/avatar_original.jpg',
      0.8,  // 80% 质量
      {
        maxWidth: 200,
        maxHeight: 200,
        format: 'jpeg',
      }
    );
    console.log('压缩后尺寸:', compressed.width, 'x', compressed.height);
    console.log('文件大小:', (compressed.size / 1024).toFixed(2), 'KB');

    return compressed.uri;
  } catch (error) {
    console.error('处理头像失败:', error);
    return null;
  }
}
```

iOS 端的实现（使用 Swift）：

```swift
// ImageProcessor.swift
// Swift 是 iOS 开发的主流语言，React Native 完全支持 Swift 编写的原生模块
import Foundation
import UIKit
import React

// @objc 注解使这个类可以被 Objective-C 运行时识别
// 这是 React Native 能够发现和加载模块的必要条件
@objc(ImageProcessor)
class ImageProcessor: NSObject {

  // 静态常量，用于模块注册
  // React Native 会根据这个名称来查找这个模块
  static var moduleName: String = "ImageProcessor"

  // 暴露给 JavaScript 的方法
  // 所有用 @objc 暴露的方法必须符合 React Native 支持的参数类型
  @objc
  func compressImage(
    _ uri: String,
    quality: Double,
    options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // 后台队列处理，避免阻塞主线程
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // 解析参数
        guard let image = self.loadImage(from: uri) else {
          reject("LOAD_ERROR", "无法加载图片", nil)
          return
        }

        // 解析压缩选项
        let maxWidth = (options["maxWidth"] as? Int) ?? 0
        let maxHeight = (options["maxHeight"] as? Int) ?? 0
        let format = (options["format"] as? String) ?? "jpeg"

        // 按比例缩放图片
        let resizedImage: UIImage
        if maxWidth > 0 || maxHeight > 0 {
          resizedImage = self.resizeImage(
            image,
            maxWidth: CGFloat(maxWidth),
            maxHeight: CGFloat(maxHeight)
          )
        } else {
          resizedImage = image
        }

        // 压缩图片
        let compressionQuality = CGFloat(quality)
        let compressedData: Data?

        switch format {
        case "png":
          compressedData = resizedImage.pngData()
        case "webp":
          if #available(iOS 14.0, *) {
            compressedData = resizedImage.pngData() // iOS 原生不支持 webp，转为 png
          } else {
            compressedData = resizedImage.jpegData(compressionQuality: compressionQuality)
          }
        default: // jpeg
          compressedData = resizedImage.jpegData(compressionQuality: compressionQuality)
        }

        guard let data = compressedData else {
          reject("COMPRESS_ERROR", "图片压缩失败", nil)
          return
        }

        // 保存到临时文件
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = UUID().uuidString + "." + format
        let tempURL = tempDir.appendingPathComponent(fileName)

        try data.write(to: tempURL)

        // 在主线程回调 JavaScript
        DispatchQueue.main.async {
          resolve([
            "uri": tempURL.absoluteString,
            "width": Int(resizedImage.size.width),
            "height": Int(resizedImage.size.height),
            "size": data.count
          ])
        }
      } catch {
        DispatchQueue.main.async {
          reject("PROCESS_ERROR", error.localizedDescription, error)
        }
      }
    }
  }

  // 裁剪图片方法
  @objc
  func cropImage(
    _ uri: String,
    cropArea: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        guard let image = self.loadImage(from: uri) else {
          reject("LOAD_ERROR", "无法加载图片", nil)
          return
        }

        // 解析裁剪区域
        guard let x = cropArea["x"] as? Int,
              let y = cropArea["y"] as? Int,
              let width = cropArea["width"] as? Int,
              let height = cropArea["height"] as? Int else {
          reject("PARAM_ERROR", "裁剪区域参数无效", nil)
          return
        }

        // 计算裁剪区域（注意 UIKit 的坐标系统）
        let cropRect = CGRect(
          x: CGFloat(x),
          y: CGFloat(y),
          width: CGFloat(width),
          height: CGFloat(height)
        )

        // 执行裁剪
        guard let cgImage = image.cgImage?.cropping(to: cropRect) else {
          reject("CROP_ERROR", "裁剪失败", nil)
          return
        }

        let croppedImage = UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)

        // 保存裁剪后的图片
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = UUID().uuidString + ".jpg"
        let tempURL = tempDir.appendingPathComponent(fileName)

        guard let data = croppedImage.jpegData(compressionQuality: 0.9) else {
          reject("SAVE_ERROR", "保存裁剪图片失败", nil)
          return
        }

        try data.write(to: tempURL)

        DispatchQueue.main.async {
          resolve([
            "uri": tempURL.absoluteString,
            "width": width,
            "height": height
          ])
        }
      } catch {
        DispatchQueue.main.async {
          reject("PROCESS_ERROR", error.localizedDescription, error)
        }
      }
    }
  }

  // 获取图片信息（这个方法可以是同步的，这里演示异步实现）
  @objc
  func getImageInfo(
    _ uri: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      guard let image = self.loadImage(from: uri) else {
        reject("LOAD_ERROR", "无法加载图片", nil)
        return
      }

      guard let data = image.jpegData(compressionQuality: 1.0) ??
                       image.pngData() else {
        reject("FORMAT_ERROR", "无法读取图片数据", nil)
        return
      }

      DispatchQueue.main.async {
        resolve([
          "width": Int(image.size.width),
          "height": Int(image.size.height),
          "format": image.jpegData(compressionQuality: 1.0) != nil ? "jpeg" : "png",
          "size": data.count,
          "orientation": image.imageOrientation.rawValue
        ])
      }
    }
  }

  // MARK: - 私有辅助方法

  // 从 URI 加载图片
  private func loadImage(from uri: String) -> UIImage? {
    // 处理 file:// 协议
    if uri.hasPrefix("file://") {
      let path = String(uri.dropFirst(7)) // 去掉 "file://"
      return UIImage(contentsOfFile: path)
    }

    // 处理 http:// 和 https:// 协议
    if let url = URL(string: uri),
       let data = try? Data(contentsOf: url),
       let image = UIImage(data: data) {
      return image
    }

    // 处理其他路径
    return UIImage(contentsOfFile: uri)
  }

  // 按比例缩放图片
  private func resizeImage(_ image: UIImage, maxWidth: CGFloat, maxHeight: CGFloat) -> UIImage {
    let originalSize = image.size

    // 如果没有设置最大尺寸限制，返回原图
    if maxWidth <= 0 && maxHeight <= 0 {
      return image
    }

    var newWidth = originalSize.width
    var newHeight = originalSize.height

    // 计算缩放比例
    if maxWidth > 0 && originalSize.width > maxWidth {
      let ratio = maxWidth / originalSize.width
      newWidth = maxWidth
      newHeight = originalSize.height * ratio
    }

    if maxHeight > 0 && newHeight > maxHeight {
      let ratio = maxHeight / newHeight
      newHeight = maxHeight
      newWidth = newWidth * ratio
    }

    // 创建新的画布并绘制缩放后的图片
    let newSize = CGSize(width: newWidth, height: newHeight)
    UIGraphicsBeginImageContextWithOptions(newSize, false, image.scale)

    image.draw(in: CGRect(origin: .zero, size: newSize))

    let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return resizedImage ?? image
  }
}

// MARK: - React Native 模块注册

// 这是 React Native 0.78 之前的方式
// 从 0.78 开始，推荐使用 TurboModules
extension ImageProcessor: RCTBridgeModule {
  // React Native 会调用这个方法来获取模块实例
  static func moduleName() -> String! {
    return moduleName
  }

  // 是否需要在主线程上初始化
  static func requiresMainQueueSetup() -> Bool {
    // 返回 false 表示可以在后台线程初始化
    // 如果模块需要操作 UI，应该返回 true
    return false
  }
}
```

```objectivec
// ImageProcessor.m
// 这个文件用于将 Swift 模块暴露给 React Native
// Objective-C 是 React Native 原生端的官方语言
// Swift 模块需要通过 Objective-C 桥接文件来暴露

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// 使用宏定义来声明模块
// __attribute__((objc_subclassing_restricted)) 确保这个类不能被进一步子类化
// 这是 React Native 模块的基本要求
@interface RCT_EXTERN_MODULE(ImageProcessor, NSObject)

// 声明暴露给 JavaScript 的方法
// 方法签名必须和 Swift 实现中的方法签名一致
RCT_EXTERN_METHOD(compressImage:(NSString *)uri
                  quality:(double)quality
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cropImage:(NSString *)uri
                  cropArea:(NSDictionary *)cropArea
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getImageInfo:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// 支持后台队列的模块
+ (BOOL)requiresMainQueueSetup
{
  // 返回 NO 表示模块不需要在主线程初始化
  // 这样可以加快应用启动速度
  return NO;
}

@end
```

### 2.2 原生 UI 组件

有时候标准的 React Native 组件不能满足我们的需求，我们需要创建自己的原生 UI 组件。比如一个特殊的轮播图组件、一个高性能的图表组件、或者一个需要精细控制的手势交互组件。

创建原生 UI 组件需要三个步骤：编写 Native 端视图、管理 JavaScript 端封装、处理事件和属性传递。

让我创建一个高性能的原生轮播图组件作为例子：

```javascript
// JavaScript 端：封装原生轮播图组件
// 使用 React 的 ref 来获取原生组件的引用
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  requireNativeComponent,
  ViewStyle,
  ImageStyle,
  FlatList,
  Dimensions,
} from 'react-native';

// 获取原生组件
// React Native 会自动将原生组件暴露给 JavaScript
// 组件名称是 "RCTCarousel"（C++ 端的名称）
const NativeCarousel = requireNativeComponent('RCTCarousel');

// 定义属性类型接口
// 这些属性会传递给原生组件
interface CarouselProps {
  // 图片数据源
  images: Array<{
    uri: string;
    title?: string;
  }>;

  // 是否自动播放
  autoPlay?: boolean;

  // 自动播放间隔（毫秒）
  autoPlayInterval?: number;

  // 是否显示分页指示器
  showPagination?: boolean;

  // 分页指示器样式
  paginationStyle?: ViewStyle;

  // 当前页码（受控）
  currentPage?: number;

  // 默认显示的页码（非受控）
  defaultPage?: number;

  // 切换页面时的回调
  onPageChange?: (page: number) => void;

  // 点击图片时的回调
  onImagePress?: (index: number) => void;

  // 组件样式
  style?: ViewStyle;

  // 图片样式
  imageStyle?: ImageStyle;
}

// 定义事件类型
interface NativeCarouselEvent {
  nativeEvent: {
    currentPage: number;
    previousPage: number;
  };
}

// 轮播图组件
export default function Carousel({
  images = [],
  autoPlay = false,
  autoPlayInterval = 3000,
  showPagination = true,
  paginationStyle = {},
  currentPage: controlledCurrentPage,
  defaultPage = 0,
  onPageChange,
  onImagePress,
  style = {},
  imageStyle = {},
}: CarouselProps) {
  // 用于非受控模式下的页码管理
  const [internalCurrentPage, setInternalCurrentPage] = useState(defaultPage);

  // 当前页码（受控优先）
  const currentPage = controlledCurrentPage ?? internalCurrentPage;

  // 自动播放计时器
  useEffect(() => {
    if (!autoPlay || images.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setInternalCurrentPage((prev) => {
        const nextPage = (prev + 1) % images.length;
        onPageChange?.(nextPage);
        return nextPage;
      });
    }, autoPlayInterval);

    return () => {
      clearInterval(timer);
    };
  }, [autoPlay, autoPlayInterval, images.length, onPageChange]);

  // 处理原生组件触发的页面切换事件
  const handlePageChange = (event: NativeCarouselEvent) => {
    const { currentPage: newPage, previousPage } = event.nativeEvent;

    setInternalCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  // 处理图片点击
  const handleImagePress = (index: number) => {
    onImagePress?.(index);
  };

  // 如果没有图片，返回空视图
  if (images.length === 0) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      {/* 原生轮播图组件 */}
      {/* 所有的图片数据和配置都通过 props 传递 */}
      <NativeCarousel
        style={styles.carousel}
        images={images.map((img) => img.uri)}
        pageCount={images.length}
        currentPage={currentPage}
        autoPlay={autoPlay}
        autoPlayInterval={autoPlayInterval}
        showPagination={showPagination}
        onPageChange={handlePageChange}
        onImagePress={(event: { nativeEvent: { index: number } }) => {
          handleImagePress(event.nativeEvent.index);
        }}
      />

      {/* 自定义分页指示器（叠在原生组件上） */}
      {showPagination && images.length > 1 && (
        <View style={[styles.paginationContainer, paginationStyle]}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  carousel: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
```

iOS 原生实现（使用 UIKit）：

```objectivec
// RCTCarouselView.h
// 原生轮播图视图的头文件
// 使用 UIKit 实现高性能的轮播功能

#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>

// UICollectionView 用于实现高性能的轮播
// 它会自动回收不可见的单元格，确保内存使用稳定
@interface RCTCarouselView : UIView

// React Native 属性
@property (nonatomic, copy) RCTDirectEventBlock onPageChange;
@property (nonatomic, copy) RCTDirectEventBlock onImagePress;
@property (nonatomic, assign) NSInteger currentPage;
@property (nonatomic, assign) BOOL showPagination;
@property (nonatomic, assign) BOOL autoPlay;
@property (nonatomic, assign) NSTimeInterval autoPlayInterval;

// 设置图片数据
- (void)setImages:(NSArray<NSString *> *)images;

@end
```

```objectivec
// RCTCarouselView.m
// 原生轮播图视图的实现

#import "RCTCarouselView.h"

@interface RCTCarouselView () <UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout>

// 集合视图用于展示图片
@property (nonatomic, strong) UICollectionView *collectionView;

// 图片数据
@property (nonatomic, strong) NSArray<NSString *> *images;

// 自动播放计时器
@property (nonatomic, strong) NSTimer *autoPlayTimer;

// 当前显示的页码
@property (nonatomic, assign) NSInteger currentIndex;

// 分页指示器
@property (nonatomic, strong) UIPageControl *pageControl;

// 布局对象
@property (nonatomic, strong) UICollectionViewFlowLayout *flowLayout;

@end

@implementation RCTCarouselView

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self setupViews];
  }
  return self;
}

- (void)setupViews {
  // 创建流式布局
  // 这种布局非常适合轮播图，因为它支持水平滚动和分页
  self.flowLayout = [[UICollectionViewFlowLayout alloc] init];
  self.flowLayout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
  self.flowLayout.minimumLineSpacing = 0;
  self.flowLayout.minimumInteritemSpacing = 0;

  // 创建集合视图
  // UICollectionView 是 iOS 的高性能列表视图
  // 它会自动复用单元格，确保即使有大量图片也不会占用过多内存
  self.collectionView = [[UICollectionView alloc] initWithFrame:CGRectZero
                                             collectionViewLayout:self.flowLayout];
  self.collectionView.backgroundColor = [UIColor clearColor];
  self.collectionView.delegate = self;
  self.collectionView.dataSource = self;
  self.collectionView.pagingEnabled = YES;  // 启用分页滚动
  self.collectionView.showsHorizontalScrollIndicator = NO;
  self.collectionView.bounces = YES;

  // 注册单元格类
  // 必须先注册才能使用
  [self.collectionView registerClass:[UICollectionViewCell class]
          forCellWithReuseIdentifier:@"CarouselCell"];

  [self addSubview:self.collectionView];

  // 创建分页指示器
  self.pageControl = [[UIPageControl alloc] init];
  self.pageControl.currentPageIndicatorTintColor = [UIColor whiteColor];
  self.pageControl.pageIndicatorTintColor = [UIColor colorWithWhite:1.0 alpha:0.5];
  [self addSubview:self.pageControl];
}

- (void)layoutSubviews {
  [super layoutSubviews];

  // 更新集合视图的尺寸
  self.collectionView.frame = self.bounds;

  // 更新布局的尺寸
  self.flowLayout.itemSize = self.bounds.size;

  // 更新分页指示器的位置
  self.pageControl.frame = CGRectMake(0,
                                        CGRectGetMaxY(self.bounds) - 30,
                                        CGRectGetWidth(self.bounds),
                                        20);
}

#pragma mark - 属性设置

- (void)setImages:(NSArray<NSString *> *)images {
  _images = images ?: @[];
  self.pageControl.numberOfPages = _images.count;
  [self.collectionView reloadData];
}

- (void)setCurrentPage:(NSInteger)currentPage {
  _currentPage = currentPage;
  self.pageControl.currentPage = currentPage;

  // 如果当前显示的页码和传入的不同，执行滚动
  if (currentPage < self.images.count && currentPage != self.currentIndex) {
    NSIndexPath *indexPath = [NSIndexPath indexPathForItem:currentPage inSection:0];
    [self.collectionView scrollToItemAtIndexPath:indexPath
                               atScrollPosition:UICollectionViewScrollPositionCenteredHorizontally
                                       animated:YES];
    self.currentIndex = currentPage;
  }
}

- (void)setShowPagination:(BOOL)showPagination {
  _showPagination = showPagination;
  self.pageControl.hidden = !showPagination;
}

- (void)setAutoPlay:(BOOL)autoPlay {
  _autoPlay = autoPlay;

  // 停止之前的计时器
  [self.autoPlayTimer invalidate];

  if (autoPlay && self.images.count > 1) {
    // 启动新的计时器
    __weak typeof(self) weakSelf = self;
    self.autoPlayTimer = [NSTimer scheduledTimerWithTimeInterval:self.autoPlayInterval > 0 ? self.autoPlayInterval / 1000.0 : 3.0
                                                         repeats:YES
                                                           block:^(NSTimer *timer) {
      [weakSelf scrollToNextPage];
    }];
  }
}

- (void)scrollToNextPage {
  if (self.images.count <= 1) return;

  NSInteger nextPage = (self.currentIndex + 1) % self.images.count;
  [self scrollToPage:nextPage];
}

- (void)scrollToPage:(NSInteger)page {
  if (page < 0 || page >= self.images.count) return;

  NSIndexPath *indexPath = [NSIndexPath indexPathForItem:page inSection:0];
  [self.collectionView scrollToItemAtIndexPath:indexPath
                             atScrollPosition:UICollectionViewScrollPositionCenteredHorizontally
                                     animated:YES];
}

#pragma mark - UICollectionViewDataSource

- (NSInteger)collectionView:(UICollectionView *)collectionView
     numberOfItemsInSection:(NSInteger)section {
  return self.images.count;
}

- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView
                  cellForItemAtIndexPath:(NSIndexPath *)indexPath {
  UICollectionViewCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"CarouselCell"
                                                                         forIndexPath:indexPath];

  // 清除之前的图片视图
  for (UIView *subview in cell.contentView.subviews) {
    [subview removeFromSuperview];
  }

  // 创建图片视图
  UIImageView *imageView = [[UIImageView alloc] initWithFrame:cell.contentView.bounds];
  imageView.contentMode = UIViewContentModeScaleAspectFill;
  imageView.clipsToBounds = YES;
  imageView.backgroundColor = [UIColor colorWithWhite:0.95 alpha:1.0];

  // 加载图片
  NSString *imageUri = self.images[indexPath.item];
  if ([imageUri hasPrefix:@"http://"] || [imageUri hasPrefix:@"https://"]) {
    // 异步加载网络图片
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      NSData *imageData = [NSData dataWithContentsOfURL:[NSURL URLWithString:imageUri]];
      UIImage *image = [UIImage imageWithData:imageData];
      dispatch_async(dispatch_get_main_queue(), ^{
        imageView.image = image;
      });
    });
  } else {
    // 加载本地图片
    imageView.image = [UIImage imageNamed:imageUri];
  }

  [cell.contentView addSubview:imageView];

  return cell;
}

#pragma mark - UICollectionViewDelegate

- (void)collectionView:(UICollectionView *)collectionView
       willDisplayCell:(UICollectionViewCell *)cell
     forItemAtIndexPath:(NSIndexPath *)indexPath {
  // 单元格将要显示
}

- (void)collectionView:(UICollectionView *)collectionView
  didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
  // 点击图片
  if (self.onImagePress) {
    self.onImagePress(@{@"index": @(indexPath.item)});
  }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
  // 计算当前页码
  CGFloat pageWidth = scrollView.frame.size.width;
  NSInteger currentPage = (NSInteger)(scrollView.contentOffset.x / pageWidth + 0.5);

  if (currentPage != self.currentIndex) {
    NSInteger previousIndex = self.currentIndex;
    self.currentIndex = currentPage;
    self.pageControl.currentPage = currentPage;

    // 通知 JavaScript
    if (self.onPageChange) {
      self.onPageChange(@{
        @"currentPage": @(currentPage),
        @"previousPage": @(previousIndex)
      });
    }
  }
}

- (void)dealloc {
  // 清理计时器
  [self.autoPlayTimer invalidate];

  // 清理代理
  self.collectionView.delegate = nil;
  self.collectionView.dataSource = nil;
}

@end
```

```objectivec
// RCTCarouselViewManager.h
// 视图管理器的头文件
// 视图管理器负责创建和管理原生视图，并将它们暴露给 React Native

#import <React/RCTViewManager.h>

@interface RCTCarouselViewManager : RCTViewManager

@end
```

```objectivec
// RCTCarouselViewManager.m
// 视图管理器的实现
// 每个原生 UI 组件都需要一个对应的 ViewManager

#import "RCTCarouselViewManager.h"
#import "RCTCarouselView.h"

@implementation RCTCarouselViewManager

// 指定在哪个线程上执行视图的更新
// 通常返回主线程，因为 UI 操作必须在主线程执行
- (UIView *)view {
  // 创建并返回原生视图实例
  // React Native 会自动管理视图的生命周期
  return [[RCTCarouselView alloc] init];
}

// 将 JavaScript 端的属性名映射到原生视图的属性名
// 这个方法是可选的，如果不实现，React Native 会自动进行名称转换
// 例如：currentPage -> currentPage（保持不变）
// 例如：autoPlayInterval -> autoPlayInterval（保持不变）
- (NSArray<NSString *> *)customDirectEventTypes {
  // 注册自定义事件
  // 这些事件会在事件触发时被发送到 JavaScript
  return @[
    @"onPageChange",
    @"onImagePress"
  ];
}

// 属性类型验证（可选但推荐实现）
// 可以指定属性的类型，帮助 React Native 进行类型检查
- (RCTPropType)propTypeForPropName:(NSString *)propName {
  if ([propName isEqualToString:@"autoPlay"]) {
    return RCTPropTypeBoolean;
  }
  if ([propName isEqualToString:@"autoPlayInterval"]) {
    return RCTPropTypeDouble;
  }
  if ([propName isEqualToString:@"currentPage"]) {
    return RCTPropTypeInteger;
  }
  if ([propName isEqualToString:@"images"]) {
    return RCTPropTypeArray;
  }
  if ([propName isEqualToString:@"showPagination"]) {
    return RCTPropTypeBoolean;
  }

  return [super propTypeForPropName:propName];
}

@end
```

### 2.3 原生事件与回调

原生模块和组件不仅需要响应 JavaScript 的调用，有时候还需要主动向 JavaScript 发送事件。比如地理位置更新、网络状态变化、推送通知到达等场景。

让我实现一个地理位置监控的原生模块，它会在位置变化时主动通知 JavaScript：

```javascript
// JavaScript 端：地理位置监控模块
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { useEffect, useState } from 'react';

const { LocationTracker } = NativeModules;

// 创建事件发射器
// 事件发射器允许我们监听原生端发送的事件
const locationEmitter = new NativeEventEmitter(LocationTracker);

// 位置数据接口
interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number;
  heading: number;
  timestamp: number;
}

// 配置选项接口
interface TrackingOptions {
  // 位置精度
  accuracy?: 'high' | 'balanced' | 'low';

  // 最小距离变化（米）才触发更新
  distanceFilter?: number;

  // 最小时间间隔（毫秒）才触发更新
  timeInterval?: number;

  // 是否显示系统位置指示器
  showsBackgroundLocationIndicator?: boolean;
}

// 位置追踪 Hook
export function useLocationTracking(options: TrackingOptions = {}) {
  // 当前位置
  const [location, setLocation] = useState<LocationData | null>(null);

  // 位置列表（用于轨迹记录）
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 追踪状态
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // 创建位置更新监听器
    // 当原生端调用 sendEvent 时，这个监听器会被触发
    const locationSubscription = locationEmitter.addListener(
      'onLocationUpdate',  // 事件名称，必须和原生端一致
      (event: LocationData) => {
        // 更新当前位置
        setLocation(event);
        // 添加到历史记录
        setLocationHistory((prev) => [...prev, event]);
        // 清除之前的错误
        setError(null);
      }
    );

    // 创建错误监听器
    const errorSubscription = locationEmitter.addListener(
      'onLocationError',
      (event: { code: string; message: string }) => {
        setError(event.message);
      }
    );

    // 启动追踪
    startTracking(options);

    return () => {
      // 组件卸载时清理
      locationSubscription.remove();
      errorSubscription.remove();
      stopTracking();
    };
  }, []);

  // 启动追踪
  const startTracking = async (opts: TrackingOptions = {}) => {
    try {
      // 请求权限
      const hasPermission = await LocationTracker.requestPermission();
      if (!hasPermission) {
        setError('位置权限被拒绝');
        return;
      }

      // 启动追踪
      await LocationTracker.startTracking({
        accuracy: opts.accuracy ?? 'balanced',
        distanceFilter: opts.distanceFilter ?? 10,
        timeInterval: opts.timeInterval ?? 5000,
        showsBackgroundLocationIndicator: opts.showsBackgroundLocationIndicator ?? false,
      });

      setIsTracking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动追踪失败');
    }
  };

  // 停止追踪
  const stopTracking = async () => {
    try {
      await LocationTracker.stopTracking();
      setIsTracking(false);
    } catch (err) {
      console.error('停止追踪失败:', err);
    }
  };

  // 清空历史记录
  const clearHistory = () => {
    setLocationHistory([]);
  };

  return {
    // 当前最新位置
    location,
    // 位置历史
    locationHistory,
    // 错误信息
    error,
    // 是否正在追踪
    isTracking,
    // 控制函数
    startTracking,
    stopTracking,
    clearHistory,
  };
}

// 独立函数调用方式
export async function requestLocationPermission(): Promise<boolean> {
  return await LocationTracker.requestPermission();
}

export async function getCurrentLocation(): Promise<LocationData> {
  return await LocationTracker.getCurrentPosition();
}

// 使用示例
function LocationTrackerDemo() {
  const {
    location,
    locationHistory,
    error,
    isTracking,
    startTracking,
    stopTracking,
  } = useLocationTracking({
    accuracy: 'high',
    distanceFilter: 5,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>位置追踪演示</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {location && (
        <View style={styles.currentLocation}>
          <Text style={styles.label}>当前位置</Text>
          <Text>纬度: {location.latitude.toFixed(6)}</Text>
          <Text>经度: {location.longitude.toFixed(6)}</Text>
          <Text>精度: {location.accuracy.toFixed(1)}米</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={isTracking ? '停止追踪' : '开始追踪'}
          onPress={() => (isTracking ? stopTracking() : startTracking())}
        />
      </View>

      <Text style={styles.historyLabel}>
        历史记录 ({locationHistory.length} 条)
      </Text>

      <FlatList
        data={locationHistory.slice(-10).reverse()}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.historyItem}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: '#c00',
  },
  currentLocation: {
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  historyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    padding: 5,
    fontSize: 12,
    color: '#666',
  },
});
```

iOS 原生实现：

```objectivec
// LocationTracker.h
// 位置追踪模块的头文件
// 使用 CoreLocation 框架实现地理位置追踪

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// 实现 RCTEventEmitter 以支持发送事件到 JavaScript
@interface LocationTracker : RCTEventEmitter <CLLocationManagerDelegate>

@end
```

```objectivec
// LocationTracker.m
// 位置追踪模块的实现

#import "LocationTracker.h"

@interface LocationTracker ()

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, assign) BOOL isTracking;

@end

@implementation LocationTracker

// React Native 0.78 之前注册模块的方式
+ (BOOL)requiresMainQueueSetup {
  // 需要在主线程初始化，因为 CLLocationManager 需要在主线程创建
  return YES;
}

RCT_EXPORT_MODULE(LocationTracker);

// 初始化位置管理器
- (instancetype)init {
  self = [super init];
  if (self) {
    // 创建位置管理器
    // 注意：CLLocationManager 必须在主线程创建
    self.locationManager = [[CLLocationManager alloc] init];
    self.locationManager.delegate = self;

    // 设置默认属性
    self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
    self.locationManager.distanceFilter = 10;  // 移动 10 米后才更新

    self.hasListeners = NO;
    self.isTracking = NO;
  }
  return self;
}

#pragma mark - React Native 事件发射器支持

// 开始监听事件
// React Native 会在 JavaScript 端调用 addListener 时调用这个方法
- (void)startObserving {
  self.hasListeners = YES;
}

// 停止监听事件
// JavaScript 端调用 remove 时调用这个方法
- (void)stopObserving {
  self.hasListeners = NO;
}

// 支持的事件类型
- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"onLocationUpdate",   // 位置更新事件
    @"onLocationError",    // 错误事件
    @"onAuthorizationChange" // 权限变更事件
  ];
}

#pragma mark - 公开方法

// 请求位置权限
RCT_EXPORT_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (status == kCLAuthorizationStatusNotDetermined) {
    // 权限未确定，请求权限
    // 注意：这个方法是异步的，结果会通过代理回调
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.locationManager requestWhenInUseAuthorization];
    });

    // 简单地返回 YES，实际权限状态通过事件通知
    resolve(@(YES));
  } else if (status == kCLAuthorizationStatusAuthorizedWhenInUse ||
             status == kCLAuthorizationStatusAuthorizedAlways) {
    // 已经有权限
    resolve(@(YES));
  } else {
    // 权限被拒绝
    resolve(@(NO));
  }
}

// 获取当前位置（一次性）
RCT_EXPORT_METHOD(getCurrentPosition:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (status != kCLAuthorizationStatusAuthorizedWhenInUse &&
      status != kCLAuthorizationStatusAuthorizedAlways) {
    reject(@"PERMISSION_DENIED", @"位置权限被拒绝", nil);
    return;
  }

  // 设置代理并请求单次位置更新
  self.locationManager.delegate = self;

  // 存储解决和拒绝回调以便在代理方法中使用
  // 注意：这是简化的实现，生产环境应该使用更安全的方式
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.locationManager requestLocation];
  });

  // 使用超时机制
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    reject(@"TIMEOUT", @"获取位置超时", nil);
  });
}

// 开始追踪
RCT_EXPORT_METHOD(startTracking:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (status != kCLAuthorizationStatusAuthorizedWhenInUse &&
      status != kCLAuthorizationStatusAuthorizedAlways) {
    reject(@"PERMISSION_DENIED", @"位置权限被拒绝", nil);
    return;
  }

  // 解析选项
  NSString *accuracy = options[@"accuracy"];
  if ([accuracy isEqualToString:@"high"]) {
    self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
  } else if ([accuracy isEqualToString:@"low"]) {
    self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters;
  } else {
    // 默认 balanced
    self.locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters;
  }

  // 距离过滤
  NSNumber *distanceFilter = options[@"distanceFilter"];
  if (distanceFilter) {
    self.locationManager.distanceFilter = distanceFilter.doubleValue;
  }

  // 时间间隔（iOS 不直接支持按时间间隔更新，需要额外处理）
  NSNumber *timeInterval = options[@"timeInterval"];
  if (timeInterval) {
    // iOS 位置更新的时间间隔取决于系统
    // 这里仅作记录
  }

  // 后台位置指示器
  NSNumber *showsIndicator = options[@"showsBackgroundLocationIndicator"];
  if (showsIndicator && showsIndicator.boolValue) {
    if (@available(iOS 11.0, *)) {
      self.locationManager.showsBackgroundLocationIndicator = YES;
    }
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // 开始位置更新
    [self.locationManager startUpdatingLocation];
    self.isTracking = YES;
    resolve(@(YES));
  });
}

// 停止追踪
RCT_EXPORT_METHOD(stopTracking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.locationManager stopUpdatingLocation];
    self.isTracking = NO;
    resolve(@(YES));
  });
}

#pragma mark - CLLocationManagerDelegate

// 位置更新回调
- (void)locationManager:(CLLocationManager *)manager
    didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  CLLocation *location = locations.lastObject;
  if (!location) return;

  // 构建位置数据字典
  // 注意：返回的数据必须是 JSON 兼容的类型
  NSDictionary *locationData = @{
    @"latitude": @(location.coordinate.latitude),
    @"longitude": @(location.coordinate.longitude),
    @"altitude": location.altitude > 0 ? @(location.altitude) : @(NSNull.null),
    @"accuracy": @(location.horizontalAccuracy),
    @"speed": @(location.speed >= 0 ? location.speed : 0),
    @"heading": @(location.course >= 0 ? location.course : 0),
    @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000)
  };

  // 只有在有监听器时才发送事件
  // 这可以避免不必要的事件处理和内存泄漏
  if (self.hasListeners) {
    [self sendEventWithName:@"onLocationUpdate" body:locationData];
  }
}

// 定位失败回调
- (void)locationManager:(CLLocationManager *)manager
       didFailWithError:(NSError *)error
{
  // 错误码到错误消息的映射
  NSString *errorMessage;
  switch (error.code) {
    case kCLErrorLocationUnknown:
      errorMessage = @"无法获取位置信息";
      break;
    case kCLErrorDenied:
      errorMessage = @"位置服务被禁用";
      break;
    case kCLErrorNetwork:
      errorMessage = @"网络错误导致定位失败";
      break;
    default:
      errorMessage = error.localizedDescription;
  }

  if (self.hasListeners) {
    [self sendEventWithName:@"onLocationError" body:@{
      @"code": @(error.code),
      @"message": errorMessage
    }];
  }
}

// 权限变更回调
- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager
{
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  NSString *statusString;
  switch (status) {
    case kCLAuthorizationStatusNotDetermined:
      statusString = @"not_determined";
      break;
    case kCLAuthorizationStatusRestricted:
      statusString = @"restricted";
      break;
    case kCLAuthorizationStatusDenied:
      statusString = @"denied";
      break;
    case kCLAuthorizationStatusAuthorizedAlways:
      statusString = @"authorized_always";
      break;
    case kCLAuthorizationStatusAuthorizedWhenInUse:
      statusString = @"authorized_when_in_use";
      break;
    default:
      statusString = @"unknown";
  }

  if (self.hasListeners) {
    [self sendEventWithName:@"onAuthorizationChange" body:@{
      @"status": statusString
    }];
  }
}

@end
```

---

## 第三章：Bridge 优化与性能提升

### 3.1 Legacy Bridge 的性能瓶颈

虽然新架构已经在逐步普及，但了解 Legacy Bridge 的性能瓶颈仍然很重要，因为很多项目还在使用老架构，而且理解这些问题能帮助我们更好地理解新架构的优势。

Bridge 通信的核心问题在于它是一个"翻译"过程。JavaScript 引擎和 Native 端各自运行在独立的线程上，它们不能直接通信，必须通过 Bridge 进行消息传递。每次传递数据时，都需要经过以下步骤：

1. **序列化**：将 JavaScript 对象转换为 JSON 字符串
2. **跨线程传递**：将 JSON 字符串从 JS 线程传递到 Native 线程
3. **反序列化**：将 JSON 字符串转换回 Native 对象

这个过程看起来简单，但实际上存在几个严重的性能问题：

**同步阻塞问题**。在 Legacy 架构中，Bridge 的读写操作是同步的。当 JavaScript 调用 Native 方法时，必须等待 Native 方法执行完成并返回结果。如果 Native 方法执行时间较长，整个 JavaScript 线程就会被阻塞，用户界面会变得卡顿。

**批量传递问题**。Bridge 不是实时传递每条消息，而是将多条消息打包成一批进行传递。这虽然提高了传输效率，但也会导致消息的延迟。如果你更新了一个组件的位置信息，期望立刻看到动画效果，但实际上动画可能被延迟到下一批消息传递时才执行。

**类型转换开销**。JavaScript 是动态类型语言，而 Objective-C 和 Java 是静态类型语言。在 Bridge 中传递数据时，需要进行大量的类型检查和转换。比如一个简单的数字，在 JavaScript 端可能是一个 number 类型，经过 Bridge 时需要转换成 NSNumber 或 java.lang.Double，再转回 number 类型。这个转换过程是有性能开销的。

```javascript
// 让我们通过一个具体的例子来理解 Bridge 的性能问题
// 这是一个常见的场景：在地图上显示大量标注点

import { NativeModules } from 'react-native';
import { useState, useEffect } from 'react';

const { MapModule } = NativeModules;

// 不推荐的写法：每次状态更新都触发 Native 调用
function BadMapExample() {
  const [annotations, setAnnotations] = useState([]);

  // 模拟添加标注点
  const addAnnotation = (annotation) => {
    // 每次添加都会触发 Bridge 通信
    // 如果有 1000 个标注点，就会触发 1000 次 Bridge 调用
    setAnnotations((prev) => [...prev, annotation]);

    // 这看起来像是普通的 React 状态更新
    // 但实际上如果 MapModule.updateAnnotations 是一个 Native 方法
    // 那么每次都会触发 Bridge 通信
    MapModule.addAnnotation(annotation);
  };

  // ...
}

// 推荐的写法：批量更新
function GoodMapExample() {
  const [annotations, setAnnotations] = useState([]);

  // 使用批量更新
  // 收集所有的添加操作，最后一次性调用 Native
  const addAnnotationsBatch = (newAnnotations) => {
    // 先更新 React 状态
    setAnnotations((prev) => [...prev, ...newAnnotations]);

    // 然后一次性传递所有新标注给 Native
    // 只触发一次 Bridge 调用
    MapModule.setAnnotations([...annotations, ...newAnnotations]);
  };

  // 或者使用防抖优化
  const debouncedUpdate = useMemo(() => {
    let timeoutId;
    return (newAnnotations) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAnnotations(newAnnotations);
        MapModule.setAnnotations(newAnnotations);
      }, 100);  // 100ms 防抖
    };
  }, [annotations]);

  // ...
}
```

### 3.2 新架构性能优化

新架构（JSI + Fabric + TurboModules）解决了 Legacy Bridge 的大部分性能问题。让我详细解释新架构是如何工作的，以及如何在开发中充分利用它的优势。

**TurboModules 的懒加载机制**

在 Legacy 架构中，所有原生模块都会在应用启动时初始化，即使它们永远不会被使用。这不仅拖慢了启动速度，还浪费了内存。在 TurboModules 架构中，原生模块是按需加载的——只有当 JavaScript 端首次调用某个模块时，该模块才会被初始化。

```javascript
// 新架构下的原生模块调用
// 模块是懒加载的，只有首次调用时才会初始化

import { NativeModules } from 'react-native';

// 这个调用不会立即初始化模块
// 只有当代码真正执行到这里时，模块才会被加载
const { HeavyNativeModule } = NativeModules;

// 即使应用中有多个地方引用了这个模块
// 模块也只会被初始化一次
async function loadData() {
  // 第一次调用时，React Native 会：
  // 1. 检查模块是否已加载
  // 2. 如果未加载，触发模块初始化
  // 3. 执行实际的方法调用
  const result = await HeavyNativeModule.loadData();
  return result;
}
```

**JSI 的直接调用**

JSI 允许 JavaScript 直接持有 Native 函数的引用，而不需要通过 Bridge"询问"。这就像是从打电话（Bridge）变成了对讲机（直接呼叫）。

```javascript
// 新架构下，我们可以获取原生函数的直接引用
// 这消除了 Bridge 的中间层开销

import { TurboModuleRegistry } from 'react-native';

// 获取原生模块的接口
// 这个接口在编译时就已经确定了类型
const nativeLogger = TurboModuleRegistry.getEnforcing('NativeLogger');

// 调用原生日志方法
// 在新架构下，这会直接调用 C++ 层的函数
// 不需要 JSON 序列化，也不需要跨线程通信
function logMessage(message) {
  // 直接调用，没有中间层
  nativeLogger.log(message);
}
```

**Fabric 的同步渲染**

Fabric 是新架构的渲染引擎，它允许在 UI 线程上直接执行某些操作，而不需要像 Legacy 架构那样等待 JS 线程。

```javascript
// Fabric 下的布局动画
// 动画可以在 UI 线程上直接执行，不需要经过 JS 线程

import { View, StyleSheet, Animated } from 'react-native';

function FabricAnimationDemo() {
  const translateX = new Animated.Value(0);

  const animate = () => {
    // 在 Legacy 架构中，这个动画需要:
    // 1. JS 线程计算每一帧的位置
    // 2. 通过 Bridge 发送到 Native 端
    // 3. Native 端应用新的位置到视图
    //
    // 在 Fabric 架构中:
    // 1. JS 线程计算动画的目标值
    // 2. 动画参数通过 JSI 直接传递给 UI 线程
    // 3. UI 线程独立执行动画，不需要 JS 线程持续参与

    Animated.spring(translateX, {
      toValue: 200,
      friction: 7,
      tension: 40,
      useNativeDriver: true,  // 关键：启用原生驱动
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.box,
          { transform: [{ translateX }] },
        ]}
      />
      <Button title="动画" onPress={animate} />
    </View>
  );
}
```

### 3.3 性能优化实战技巧

无论使用新架构还是 Legacy 架构，以下优化技巧都能帮助提升 React Native 应用的性能：

**列表渲染优化**

React Native 的 FlatList 组件在渲染大量数据时，如果不进行优化，很容易出现卡顿。以下是几个关键的优化技巧：

```javascript
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { memo, useCallback } from 'react';

// 使用 React.memo 优化列表项组件
// memo 会比较 props，只有 props 发生变化时才重新渲染
const ListItem = memo(function ListItem({ item, onPress, index }) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  // 返回 true 表示不需要重新渲染
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.onPress === nextProps.onPress
  );
});

// 优化的 FlatList 使用方式
function OptimizedFlatList({ data, onItemPress }) {
  // 使用 getItemLayout 可以跳过 item 的尺寸测量
  // 这对于固定高度的列表项特别有效
  const getItemLayout = useCallback((data, index) => ({
    // 每个 item 的长度（高度或宽度，取决于滚动方向）
    length: 80,
    // item 的起始位置
    offset: 80 * index,
    // item 的索引
    index,
  }), []);

  // 使用 keyExtractor 明确指定列表项的唯一标识
  // 这帮助 React 高效地识别哪些项目发生了变化
  const keyExtractor = useCallback((item) => item.id, []);

  // 使用 ItemSeparatorComponent 而不是手动在 item 中添加分隔线
  // 这样可以避免不必要的重新渲染
  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // 使用箭头函数或 useCallback 包装 renderItem
  // 避免每次渲染都创建新的函数引用
  const renderItem = useCallback(({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      onPress={onItemPress}
    />
  ), [onItemPress]);

  // 配置初始渲染的窗口大小
  // 默认值是 21，这里减小到 10 可以加快首次渲染速度
  const initialNumToRender = 10;

  // 配置最多渲染的列表项数量
  // 超过这个数量的项会被回收利用
  const maxToRenderPerBatch = 10;

  // 配置更新前允许渲染的最大数量
  // 设置较小的值可以在快速滚动时减少渲染负担
  const windowSize = 5;

  // 是否移除不可见的项
  // 对于内存敏感的应用，可以减少内存占用
  const removeClippedSubviews = true;

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={renderSeparator}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      // 调试用，生产环境应该关闭
      debug={false}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    height: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
});
```

**图片优化**

图片通常是应用中最大的资源，不正确的图片使用方式会导致严重的性能问题：

```javascript
import { Image, View, StyleSheet } from 'react-native';
import { useState } from 'react';

// 使用适当尺寸的图片
// 永远不要加载比显示尺寸大的图片
function OptimizedImage({ uri, width, height }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Image
      // source 可以是网络 URL、本地路径或 require() 引用的静态资源
      source={{ uri }}

      // 设置明确的尺寸，避免 Image 组件在加载时重新计算布局
      style={[styles.image, { width, height }]}

      // 调整图片的填充方式
      // cover: 保持比例，填满容器（可能裁剪）
      // contain: 保持比例，全部显示在容器内（可能有空白）
      // stretch: 不保持比例，填充容器
      resizeMode="cover"

      // 渐进式加载
      // 对于网络图片，可以先显示一个模糊的缩略图
      progressiveRenderingEnabled={true}

      // 默认占位图
      defaultSource={require('./placeholder.png')}

      // 错误处理
      onError={(e) => {
        console.error('图片加载失败:', e.nativeEvent.error);
        setImageError(true);
      }}
    />
  );
}

// 缓存图片尺寸
// 如果知道图片的固定尺寸，可以避免测量过程
function CachedSizeImage({ uri }) {
  // 假设所有图片都是 200x200
  // React Native 可以直接使用这个尺寸，不需要测量图片
  return (
    <Image
      source={{ uri }}
      style={{ width: 200, height: 200 }}
      // 告诉 React Native 这是一个固定尺寸的图片
      loadingIndicatorSource={null}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f0f0f0',  // 占位背景色
  },
});
```

---

## 第四章：Fabric 新架构

### 4.1 Fabric 架构原理

Fabric 是 React Native 新架构的核心组成部分，它是一个全新的渲染引擎。理解 Fabric 的工作原理，对于深入掌握 React Native 至关重要。

传统的 React Native（Legacy 架构）使用的是"推送"模式：当 JS 端的状态发生变化时，会通过 Bridge 发送一条消息到 Native 端，Native 端接收到消息后再更新视图。这种模式的缺点是：每次状态变化都需要跨线程通信，而且消息是批量处理的，不能实时响应。

Fabric 使用的是"同步"模式：JavaScript 线程和 UI 线程可以直接通信，某些操作甚至可以在 UI 线程上同步执行，不需要等待 JS 线程。

```javascript
// Fabric 下的事件处理
// 事件可以在 UI 线程上直接处理，不需要经过 JS 线程

import { Pressable, Text, StyleSheet } from 'react-native';

function FabricPressDemo() {
  return (
    // Fabric 下的 Pressable 可以直接在 UI 线程上处理按压状态
    // 不需要等待 JS 线程的响应
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={() => {
        // 这个回调仍然在 JS 线程执行
        console.log('按钮被点击');
      }}
      // Fabric 支持的新属性：在 UI 线程上执行的回调
      // 这对于需要即时响应的交互非常有用
      onPressIn={() => {
        // 立即执行，不需要等待 JS
        console.log('按下');
      }}
    >
      <Text style={styles.text}>点击我</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: '#0056b3',
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

### 4.2 并发渲染

React 18 引入了并发特性，Fabric 提供了相应的支持。并发渲染允许 React 中断、暂停和恢复渲染工作，从而提供更好的用户体验。

```javascript
import { Suspense, useState, useTransition } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';

// useTransition 用于标记非紧急更新
// 有这个 Hook，React 可以优先处理紧急更新（如用户输入）
function ConcurrentRenderingDemo() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = (text) => {
    // setQuery 是紧急更新，会立即反映到输入框
    setQuery(text);

    // setResults 是非紧急更新
    // React 会延迟处理它，以便优先响应用户输入
    startTransition(() => {
      const searchResults = performSearch(text);
      setResults(searchResults);
    });
  };

  return (
    <View>
      {/* 输入框会立即响应，即使搜索结果还在加载中 */}
      <TextInput
        value={query}
        onChangeText={search}
        style={styles.input}
        placeholder="搜索..."
      />

      {/* 搜索结果使用 Suspense 来处理加载状态 */}
      <Suspense
        fallback={
          <ActivityIndicator size="large" color="#007AFF" />
        }
      >
        {/* results 的更新被包裹在 startTransition 中 */}
        {/* 这意味着 React 可以中断这个更新来响应其他输入 */}
        <FlatList
          data={results}
          renderItem={({ item }) => <SearchResult item={item} />}
          keyExtractor={(item) => item.id}
        />
      </Suspense>
    </View>
  );
}

// 用于显示搜索结果
function SearchResult({ item }) {
  return (
    <View style={styles.result}>
      <Text style={styles.resultTitle}>{item.title}</Text>
      <Text style={styles.resultDescription}>{item.description}</Text>
    </View>
  );
}
```

---

## 第五章：闪屏页、热更新与监控

### 5.1 闪屏页设计

闪屏页（Splash Screen）是用户看到的第一印象。一个设计良好的闪屏页不仅能提升品牌形象，还能在应用加载时提供更好的用户体验。

在 React Native 中实现闪屏页，需要分别在 iOS 和 Android 平台上进行原生配置：

**iOS 闪屏页配置**

```objectivec
// iOS 闪屏页主要通过 LaunchScreen.storyboard 配置
// 路径：ios/YourApp/LaunchScreen.storyboard

/*
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina6_1" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!-- View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="splash_logo" translatesAutoresizingMaskIntoConstraints="NO" id="logo">
                                <rect key="frame" x="157" y="398" width="100" height="100"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="100" id="width"/>
                                    <constraint firstAttribute="height" constant="100" id="height"/>
                                </constraints>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" red="0.96" green="0.96" blue="0.96" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="logo" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="centerX"/>
                            <constraint firstItem="logo" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="centerY"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="52" y="374"/>
        </scene>
    </scenes>
</document>
*/
```

**JavaScript 端的闪屏页管理**

```javascript
// JavaScript 端管理闪屏页的显示和隐藏
import { StatusBar, View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// 保持闪屏页可见，直到我们准备好为止
// Expo 的 SplashScreen API
SplashScreen.preventAutoHideAsync().catch(() => {
  // 忽略错误，某些平台可能不支持
});

// 自定义闪屏页组件
function CustomSplashScreen({ onReady }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 执行初始化操作
    const prepare = async () => {
      try {
        // 模拟初始化延迟
        // 实际应用中，这里应该做真正的初始化工作
        await performInitialLoading();

        // 短暂延迟以显示闪屏页
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('初始化失败:', error);
      } finally {
        // 隐藏原生闪屏页
        await SplashScreen.hideAsync();

        // 播放退出动画
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,  // 轻微放大
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 动画完成后通知父组件
          onReady?.();
        });
      }
    };

    prepare();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>App</Text>
        </View>
      </View>

      {/* 加载指示器 */}
      <View style={styles.loadingContainer}>
        <LoadingIndicator />
        <Text style={styles.loadingText}>正在加载...</Text>
      </View>
    </Animated.View>
  );
}

// 加载指示器组件
function LoadingIndicator() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.indicator,
        { transform: [{ rotate: spin }] },
      ]}
    />
  );
}

// 模拟初始加载
async function performInitialLoading() {
  // 1. 加载用户配置
  await loadUserConfig();

  // 2. 初始化状态管理
  await initializeStores();

  // 3. 预加载关键资源
  await preloadAssets();

  // 4. 建立网络连接
  await establishNetworkConnection();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  logoContainer: {
    marginBottom: 100,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});
```

### 5.2 热更新实战

热更新（Hot Reload / Hot Update）是 React Native 应用的重要特性，它允许我们在不重新发布应用的情况下更新 JavaScript 代码。CodePush 是微软提供的一个热更新服务，广泛应用于 React Native 项目。

```javascript
// 热更新实现 - 使用 code-push
import { Alert, Linking, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CodePush from 'react-native-code-push';
import { useState, useEffect, useCallback } from 'react';

// CodePush 配置
// 通常放在 App 入口文件中
const codePushOptions = {
  // 检查更新的频率
  // MANUAL: 手动检查
  // ON_APP_START: 应用启动时检查
  // ON_APP_RESUME: 应用从后台恢复时检查
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,

  // 安装模式
  // IMMEDIATE: 下载完成后立即安装并重启
  // ON_NEXT_RESTART: 下次应用启动时安装
  // ON_NEXT_RESUME: 下次应用从后台恢复时安装
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,

  // 背景下载配置
  // 在 Wi-Fi 环境下后台下载更新
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,

  // 更新对话框配置
  updateDialog: {
    // 是否显示更新标题
    title: '发现新版本',
    // 更新描述
    message: '新版本包含性能优化和新的功能',
    // 确认按钮文字
    confirmLabel: '立即更新',
    // 取消按钮文字
    cancelLabel: '稍后',
    // 是否强制更新（强制更新时隐藏取消按钮）
    mandatoryContinueButtonLabel: '立即更新',
    mandatoryUpdateMessage: '这是一个重要更新，需要立即安装',
  },
};

// 应用主组件
function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  // 检查并安装更新
  const syncUpdate = useCallback(async () => {
    try {
      setSyncStatus('checking');

      // 检查更新
      const update = await CodePush.checkForUpdate();

      if (!update) {
        setSyncStatus('up-to-date');
        console.log('应用已是最新版本');
        return;
      }

      setUpdateInfo({
        version: update.appVersion,
        description: update.description,
        size: Math.round(update.packageSize / 1024 / 1024),  // 转换为 MB
      });

      // 显示更新对话框
      // CodePush 会自动显示配置的对话框
      setSyncStatus('available');

    } catch (error) {
      console.error('检查更新失败:', error);
      setSyncStatus('error');
    }
  }, []);

  // 下载并安装更新
  const downloadAndInstall = useCallback(async () => {
    try {
      setSyncStatus('downloading');

      // 开始同步
      // sync() 会自动处理下载、安装和重启
      await CodePush.sync(
        codePushOptions,
        // 下载进度回调
        (progress) => {
          const received = Math.round(progress.receivedBytes / 1024);
          const total = Math.round(progress.totalBytes / 1024);
          const percent = Math.round((received / total) * 100);
          setProgress(percent);
        },
        // 同步状态回调
        (status) => {
          switch (status) {
            case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
              setSyncStatus('checking');
              break;
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
              setSyncStatus('downloading');
              break;
            case CodePush.SyncStatus.INSTALLING_UPDATE:
              setSyncStatus('installing');
              break;
            case CodePush.SyncStatus.UPDATE_INSTALLED:
              setSyncStatus('installed');
              break;
            case CodePush.SyncStatus.UP_TO_DATE:
              setSyncStatus('up-to-date');
              break;
            case CodePush.SyncStatus.ERROR:
              setSyncStatus('error');
              break;
          }
        }
      );

    } catch (error) {
      console.error('更新失败:', error);
      setSyncStatus('error');
    }
  }, []);

  // 应用启动时检查更新
  useEffect(() => {
    syncUpdate();
  }, [syncUpdate]);

  // 渲染更新状态
  const renderUpdateStatus = () => {
    switch (syncStatus) {
      case 'checking':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>正在检查更新...</Text>
          </View>
        );

      case 'available':
        return (
          <View style={styles.updateCard}>
            <Text style={styles.updateTitle}>发现新版本</Text>
            <Text style={styles.updateInfo}>
              版本: {updateInfo?.version}
            </Text>
            <Text style={styles.updateInfo}>
              大小: {updateInfo?.size} MB
            </Text>
            <Text style={styles.updateDescription}>
              {updateInfo?.description}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSyncStatus('idle')}
              >
                <Text style={styles.cancelButtonText}>稍后</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={downloadAndInstall}
              >
                <Text style={styles.updateButtonText}>立即更新</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'downloading':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              正在下载更新... {progress}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        );

      case 'installing':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>正在安装更新...</Text>
          </View>
        );

      case 'installed':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.successText}>更新已安装，即将重启应用</Text>
          </View>
        );

      case 'up-to-date':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.successText}>应用已是最新版本</Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>更新失败，请稍后重试</Text>
            <TouchableOpacity onPress={syncUpdate}>
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderUpdateStatus()}
    </View>
  );
}

// 使用 CodePush HOC 包装组件
// 这样组件会自动接收 codePushProps
const AppWithCodePush = CodePush(codePushOptions)(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  statusContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  successText: {
    fontSize: 16,
    color: '#34C759',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  retryText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 10,
  },
  updateCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  updateInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  updateDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
});

export default AppWithCodePush;
```

### 5.3 性能监控与崩溃报告

生产环境的应用需要持续监控性能指标和崩溃报告。React Native 项目可以使用多种监控服务，如 Sentry、Bugly 等。

```javascript
// 完整的性能监控与崩溃报告实现
import { PerformanceObserver, getCLS, getFID, getLCP, getFCP, getTTFB } from 'react-native';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useState, useEffect, useCallback } from 'react';

// 初始化 Sentry
// 应该在应用启动时尽早初始化
Sentry.init({
  // DSN 是 Sentry 项目的唯一标识
  dsn: 'YOUR_SENTRY_DSN',

  // 是否开启调试模式
  // 调试模式下会打印详细的日志
  debug: __DEV__,

  // 环境
  environment: __DEV__ ? 'development' : 'production',

  // 发布版本
  // 通常使用应用的版本号
  release: `${getAppVersion()}+${getBuildNumber()}`,

  // 采样的百分比 (0.0-1.0)
  // 生产环境可以设置较低的值以减少数据量
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,

  // 是否记录自动收集的性能跟踪
  // Enable Automatic Instrumentation for performance monitoring
  enableAutoNativeFrames: true,

  // 是否记录应用的启动时间
  // 这对于分析应用启动性能非常重要
  enableStartupTimeTracking: true,

  // 是否记录应用从后台恢复的时间
  enableBackgroundGeestures: true,

  // 自定义过滤器
  // 可以根据需要过滤某些类型的事件
  beforeSend: (event, hint) => {
    // 过滤某些类型的错误
    const exception = hint?.originalException;
    if (exception?.message?.includes('某某特定错误')) {
      return null;  // 返回 null 表示不发送这个事件
    }
    return event;
  },
});

// 性能指标收集
function PerformanceMonitor({ children }) {
  const [metrics, setMetrics] = useState({
    CLS: 0,      // 累积布局偏移
    LCP: 0,      // 最大内容绘制
    FID: 0,      // 首次输入延迟
    FCP: 0,      // 首次内容绘制
    TTFB: 0,     // 首个字节的时间
  });

  useEffect(() => {
    // 观察 Web Vitals
    // 这些指标是 Google 定义的衡量用户体验的核心指标

    // CLS - Cumulative Layout Shift
    // 衡量视觉稳定性
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 只记录没有最近用户输入的布局偏移
        if (!entry.hadRecentInput) {
          const cls = entry.value;
          console.log('CLS:', cls);
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `CLS: ${cls}`,
            data: { value: cls },
          });
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // LCP - Largest Contentful Paint
    // 衡量加载性能
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `LCP: ${lastEntry.startTime}`,
        data: { value: lastEntry.startTime },
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // FID - First Input Delay
    // 衡量交互响应性
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `FID: ${entry.processingStart - entry.startTime}`,
          data: {
            delay: entry.processingStart - entry.startTime,
          },
        });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // 清理
    return () => {
      clsObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      {children}

      {/* 开发模式下显示性能指标 */}
      {__DEV__ && (
        <PerformanceOverlay metrics={metrics} />
      )}
    </View>
  );
}

// 性能指标悬浮窗（仅开发模式）
function PerformanceOverlay({ metrics }) {
  const [visible, setVisible] = useState(__DEV__);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayHeader}
        onPress={() => setVisible(false)}
      >
        <Text style={styles.overlayTitle}>性能指标</Text>
      </TouchableOpacity>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>CLS:</Text>
        <Text style={styles.metricValue}>{metrics.CLS.toFixed(4)}</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>LCP:</Text>
        <Text style={styles.metricValue}>{metrics.LCP.toFixed(0)}ms</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>FID:</Text>
        <Text style={styles.metricValue}>{metrics.FID.toFixed(0)}ms</Text>
      </View>
    </View>
  );
}

// 错误边界组件
// 捕获子组件的 JavaScript 错误
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // 当子组件发生错误时调用
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 组件发生错误时调用
  componentDidCatch(error, errorInfo) {
    // 发送错误报告到 Sentry
    Sentry.withScope((scope) => {
      // 添加额外的上下文信息
      scope.setExtras(errorInfo);

      // 记录错误日志
      Sentry.captureException(error);
    });

    console.error('错误被 ErrorBoundary 捕获:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>应用出现了一些问题</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// 网络状态监控
function NetworkMonitor() {
  useEffect(() => {
    const handleConnectionChange = (connectionInfo) => {
      console.log('网络状态变化:', connectionInfo);

      // 添加面包屑到 Sentry
      Sentry.addBreadcrumb({
        category: 'network',
        message: `网络类型: ${connectionInfo.type}`,
        data: {
          type: connectionInfo.type,
          effectiveType: connectionInfo.effectiveType,
        },
      });

      // 如果是弱网络环境，显示提示
      if (connectionInfo.effectiveType === '2g' ||
          connectionInfo.effectiveType === 'slow-2g') {
        Alert.alert(
          '网络缓慢',
          '当前网络连接较慢，部分功能可能受影响',
          [{ text: '知道了' }]
        );
      }
    };

    // NetInfo 是一个第三方库，用于获取网络状态
    // 这里假设已经安装和配置
    // NetInfo.addEventListener('connectionChange', handleConnectionChange);

    return () => {
      // NetInfo.removeEventListener('connectionChange', handleConnectionChange);
    };
  }, []);

  return null;
}

// 使用 Sentry 包装组件
// 这样组件中的错误会被 Sentry 自动捕获
const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
  onError: (error, errorInfo) => {
    // 自定义错误处理逻辑
    console.error('Sentry 捕获的错误:', error, errorInfo);
  },
});

// 错误降级组件
function ErrorFallback({ error, resetError }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>抱歉，出现了一些问题</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={resetError}
      >
        <Text style={styles.retryButtonText}>重试</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
  },
  overlayHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingBottom: 4,
  },
  overlayTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  metricValue: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export {
  PerformanceMonitor,
  ErrorBoundary,
  NetworkMonitor,
  SentryApp as default,
};
```

---

## 结语

React Native 是一个功能强大且不断进化的框架。从最初的 Bridge 架构到如今的新架构，每一次更新都在解决前一代的痛点。掌握原生模块开发、理解 Fabric 和 JSI 的工作原理、熟练运用热更新和监控工具，这些都是成为 React Native 高级开发者必经之路。

记住，最好的技术方案不是最复杂的，而是最适合你项目需求的。在实际开发中，要根据项目的具体情况选择合适的技术方案，不断优化用户体验和性能。

祝你在 React Native 的世界里玩得开心！
