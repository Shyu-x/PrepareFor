# React Native移动开发完全指南

## 前言：React Native是什么

React Native是Facebook（现Meta）开源的跨平台移动应用开发框架，允许开发者使用JavaScript和React编写原生移动应用。与传统的WebView混合应用不同，React Native使用原生组件渲染，而非HTML元素。

**React Native的核心优势：**
- 一次编写，同时运行在iOS和Android平台
- 使用React生态，Web开发者学习成本低
- 性能接近原生应用
- 丰富的组件库和社区支持
- 热重载和快速迭代能力

**React Native的局限性：**
- 需要编写部分原生代码处理平台特定功能
- 某些复杂动画和手势处理不如原生流畅
- 第三方库的兼容性问题
- 包体积相对较大

本文将深入讲解React Native的开发、组件、通信机制、热更新和平台差异处理。

---

## 一、核心概念解析

### 1.1 React Native与React的区别

很多从Web开发转向移动开发的React开发者经常混淆React和React Native。实际上，它们的核心思想相同（组件化、声明式UI、数据驱动），但实现完全不同。

```
React Web vs React Native 架构对比：

┌─────────────────────────────────────────────────────────────┐
│                        React (Web)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    React DOM                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │  │
│  │  │ <div>   │  │ <span>  │  │ <input> │  ← HTML元素   │  │
│  │  └─────────┘  └─────────┘  └─────────┘               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    React Native (Mobile)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 原生平台 (Native Platform)              │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │  │
│  │  │ UIView  │  │ UIText  │  │ UIText  │  ← iOS原生   │  │
│  │  │(iOS)   │  │ Field   │  │ Input   │               │  │
│  │  └─────────┘  └─────────┘  └─────────┘               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │  │
│  │  │  View   │  │ TextView│  │ Text   │  ← Android原生│  │
│  │  │(Android)│  │        │  │        │               │  │
│  │  └─────────┘  └─────────┘  └─────────┘               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 工作原理

React Native的核心工作原理可以概括为：JavaScript代码通过Bridge与原生平台通信，原生平台负责渲染UI组件。

```
React Native 工作流程：

┌─────────────────────────────────────────────────────────────┐
│                      JavaScript 层                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  React 组件树                         │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐           │  │
│  │  │ <View>  │ →  │ <Text>  │ →  │<Button> │           │  │
│  │  └────┬────┘    └─────────┘    └─────────┘           │  │
│  │       │                                              │  │
│  │       ▼                                              │  │
│  │  ┌─────────┐                                         │  │
│  │  │ Virtual DOM（虚拟DOM）                             │  │
│  │  └────┬────┘                                         │  │
│  └───────┼─────────────────────────────────────────────┘  │
│          │                                                  │
│          ▼ 批量更新、差异化计算                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                      Bridge (桥接)                    │  │
│  │  ┌────────────────┐    ┌────────────────┐             │  │
│  │  │  JSON序列化    │ →  │  异步消息传递   │             │  │
│  │  │  (JSI新架构)   │    │  (Legacy Bridge)│             │  │
│  │  └────────────────┘    └────────────────┘             │  │
│  └──────────────────────────────────────────────────────┘  │
│          │                                                  │
│          ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   原生平台层                          │  │
│  │  ┌─────────────┐    ┌─────────────┐                  │  │
│  │  │   iOS        │    │   Android   │                  │  │
│  │  │ UIView/View  │    │  View/Text  │                  │  │
│  │  └─────────────┘    └─────────────┘                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**关键点说明：**
1. JavaScript层维护组件的Virtual DOM
2. React计算Virtual DOM的差异（diff）
3. 通过Bridge发送更新指令到原生平台
4. 原生平台根据指令创建/更新UI组件
5. 所有通信都是异步的，这是性能瓶颈之一

---

## 二、原生组件详解

### 2.1 核心组件

React Native提供了丰富的原生组件，这些组件直接映射到iOS的UIKit和Android的View系统。

```jsx
// App.js - React Native基础组件示例
import React, { useState } from 'react';
import {
  View,           // 容器组件，对应iOS的UIView，Android的View
  Text,           // 文本组件，对应iOS的UILabel，Android的TextView
  TextInput,      // 文本输入，对应iOS的UITextField，Android的EditText
  ScrollView,     // 可滚动容器
  FlatList,       // 高性能列表组件
  TouchableOpacity,  // 可点击容器
  TouchableHighlight, // 按压高亮反馈
  Image,          // 图片组件
  StyleSheet,     // 样式定义
  SafeAreaView,   // 安全区域处理
  StatusBar,      // 状态栏控制
  ActivityIndicator,  // 加载指示器
  Switch,         // 开关组件
  Modal,          // 模态框
} from 'react-native';

// 基础组件使用示例
function BasicComponents() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    // SafeAreaView处理刘海屏等安全区域
    <SafeAreaView style={styles.container}>
      {/* StatusBar控制状态栏样式 */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* View是最基础的容器组件，类似div */}
      <View style={styles.header}>
        {/* Text显示文本内容 */}
        <Text style={styles.title}>React Native 示例</Text>
        <Text style={styles.subtitle}>基础组件演示</Text>
      </View>

      {/* ScrollView提供滚动能力 */}
      <ScrollView style={styles.content}>
        {/* TextInput文本输入 */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>文本输入：</Text>
          <TextInput
            style={styles.input}
            // value controlled component（受控组件）
            value={inputText}
            // onChangeText当文本变化时调用
            onChangeText={(text) => setInputText(text)}
            // placeholder显示占位文字
            placeholder="请输入内容..."
            // 自动首字母大写
            autoCapitalize="sentences"
            // 自动纠正
            autoCorrect={true}
            // 键盘类型
            keyboardType="default"
            // 是否安全输入（密码场景）
            secureTextEntry={false}
          />
        </View>

        {/* TouchableOpacity提供点击反馈 */}
        <TouchableOpacity
          style={styles.button}
          // onPress处理点击事件
          onPress={() => {
            console.log('按钮被点击，输入的内容是:', inputText);
            Alert.alert('提示', `你输入了: ${inputText}`);
          }}
          // activeOpacity控制按下时的透明度
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>点击提交</Text>
        </TouchableOpacity>

        {/* Switch开关组件 */}
        <View style={styles.switchContainer}>
          <Text style={styles.label}>开关控制：</Text>
          <Switch
            // value控制开关状态
            value={isEnabled}
            // onValueChange当状态变化时调用
            onValueChange={(value) => setIsEnabled(value)}
            // trackColor控制轨道颜色
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            // thumbColor控制圆形按钮颜色
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            // iOS专用：ios_backgroundColor
            ios_backgroundColor="#3e2e2e"
          />
        </View>

        {/* Image图片组件 */}
        <View style={styles.imageContainer}>
          <Text style={styles.label}>图片显示：</Text>
          <Image
            // source指定图片源
            source={{
              // 网络图片需要指定尺寸
              uri: 'https://reactnative.dev/docs/assets/p_cat1.png',
              width: 200,
              height: 200,
            }}
            // 加载中显示占位
            defaultSource={require('./assets/placeholder.png')}
            // 调整图片内容模式
            resizeMode="cover" // 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
          />
        </View>

        {/* ActivityIndicator加载指示器 */}
        {isLoading && (
          <ActivityIndicator
            size="large"    // 'small' | 'large'
            color="#00d4ff"  // iOS蓝色
            // Android专属属性
            // size="large"
            // color="#00BCD4"
          />
        )}

        {/* Modal模态框 */}
        <Modal
          // visible控制显示/隐藏
          visible={false}
          // animationType动画类型
          animationType="slide"  // 'none' | 'slide' | 'fade'
          // transparent背景透明
          transparent={true}
          // onRequestCloseAndroid返回键处理
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>模态框</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.buttonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// 定义样式（类似CSS）
const styles = StyleSheet.create({
  container: {
    flex: 1,  // flex:1占满父容器
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,      // 字号
    fontWeight: 'bold', // 粗体
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    // 边框样式
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#007AFF',  // iOS蓝色
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',      // 水平居中
    justifyContent: 'center',   // 垂直居中
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',    // 水平布局
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',  // 半透明黑色
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
```

### 2.2 列表组件

React Native中处理列表有两个主要组件：ScrollView和FlatList。对于大数据量列表，强烈建议使用FlatList，因为它支持虚拟化（只渲染可见项）。

```jsx
// ListComponents.js - 列表组件详解
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

// 模拟数据
const MOCK_DATA = Array.from({ length: 1000 }, (_, index) => ({
  id: index.toString(),
  title: `标题 ${index + 1}`,
  content: `这是第 ${index + 1} 条数据的详细内容。`,
  timestamp: Date.now() - index * 100000,
}));

// FlatList高效列表组件
function FlatListExample() {
  const [data, setData] = useState(MOCK_DATA.slice(0, 20));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // 渲染单个列表项
  // keyExtractor用于指定item的唯一标识
  const renderItem = useCallback(({ item, index }) => (
    <ListItem
      item={item}
      onPress={() => console.log('点击了:', item.id)}
      isEven={index % 2 === 0}
    />
  ), []);  // 依赖数组为空，因为item是外部传入的

  // 列表keyExtractor
  const keyExtractor = useCallback((item) => item.id, []);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 模拟刷新请求
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(MOCK_DATA.slice(0, 20));
    setPage(1);
    setRefreshing(false);
  }, []);

  // 上拉加载更多
  const onEndReached = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    // 模拟加载更多
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPage = page + 1;
    const newData = MOCK_DATA.slice(0, newPage * 20);
    setData(newData);
    setPage(newPage);
    setLoading(false);
  }, [loading, page]);

  // 列表底部渲染（加载更多指示器）
  const ListFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>加载中...</Text>
      </View>
    );
  }, [loading]);

  return (
    <FlatList
      // data是要渲染的数据数组
      data={data}
      // renderItem渲染每个列表项
      renderItem={renderItem}
      // keyExtractor指定唯一key
      keyExtractor={keyExtractor}
      // ItemSeparatorComponent项之间的分隔组件
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // ListHeaderComponent列表头组件
      ListHeaderComponent={<Text style={styles.header}>列表头</Text>}
      // ListFooterComponent列表尾组件
      ListFooterComponent={ListFooter}
      // onEndReachedThreshold触底加载阈值（0-1）
      onEndReachedThreshold={0.3}
      // onEndReached触底回调
      onEndReached={onEndReached}
      // RefreshControl下拉刷新
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          // iOS专属
          tintColor="#007AFF"
          // Android专属
          colors={['#007AFF']}
        />
      }
      // 性能优化相关
      // initialNumToRender初始渲染数量
      initialNumToRender={10}
      // maxToRenderPerBatch每次最多渲染数量
      maxToRenderPerBatch={10}
      // windowSize渲染窗口大小
      windowSize={10}
      // removeClippedSubviews对离屏项目进行裁剪（Android性能优化）
      removeClippedSubviews={true}
      // getItemLayout固定高度时优化（避免测量）
      getItemLayout={(data, index) => ({
        length: 80,    // 每项高度
        offset: 80 * index,  // 偏移量
        index,
      })}
    />
  );
}

// 单个列表项组件
function ListItem({ item, onPress, isEven }) {
  const date = new Date(item.timestamp);
  const timeStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

  return (
    <TouchableOpacity
      style={[styles.item, isEven ? styles.itemEven : null]}
      onPress={onPress}
      // activeOpacity按压时透明度
      activeOpacity={0.7}
      // underlayColor按压时背景色（仅TouchHighlight有效）
      underlayColor="#f0f0f0"
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemContent} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      <View style={styles.itemMeta}>
        <Text style={styles.timeText}>{timeStr}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 15,
  },
  item: {
    flexDirection: 'row',      // 水平布局
    padding: 15,
    backgroundColor: '#ffffff',
    minHeight: 80,
    alignItems: 'center',
  },
  itemEven: {
    backgroundColor: '#fafafa',
  },
  itemContent: {
    flex: 1,                  // 占据剩余空间
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  itemContent: {
    fontSize: 14,
    color: '#666666',
  },
  itemMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  arrow: {
    fontSize: 20,
    color: '#cccccc',
    marginTop: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  footerText: {
    marginLeft: 10,
    color: '#666666',
  },
});
```

---

## 三、Bridge通信机制

### 3.1 传统Bridge架构（Legacy Bridge）

React Native 0.7x之前使用JavaScriptCore作为JavaScript引擎，通过异步JSON消息与原生平台通信。

```
Legacy Bridge通信流程：

JavaScript端                         原生端
     │                                    │
     │  NativeModules.xxxMethod(params)   │
     │ ─────────────────────────────────►│
     │         JSON序列化                 │
     │                                    │ native code
     │◄──────────────────────────────────│
     │         JSON反序列化                │
     │                                    │
     │  callback(result)                 │
```

```javascript
// JavaScript端调用原生模块
// MyNativeModule.js
import { NativeModules, Platform } from 'react-native';

// 获取原生模块
const { MyNativeModule } = NativeModules;

// 调用原生方法
async function callNativeMethod() {
  try {
    // 调用原生模块的方法，返回Promise
    const result = await MyNativeModule.processData('hello');
    console.log('原生方法返回:', result);
  } catch (error) {
    console.error('调用失败:', error);
  }
}

// 回调方式调用（Legacy方式）
function callNativeWithCallback() {
  MyNativeModule.processDataWithCallback('hello', (error, result) => {
    if (error) {
      console.error('错误:', error);
    } else {
      console.log('结果:', result);
    }
  });
}

// 原生模块使用示例（iOS + Android）
export { callNativeMethod, callNativeWithCallback };
```

```objc
// iOS原生模块实现
// MyNativeModule.m
#import <React/RCTBridgeModule.h>

// RCTBridgeModule协议必须实现
@interface MyNativeModule : NSObject <RCTBridgeModule>
@end

@implementation MyNativeModule

// 注册模块，React Native会根据这个方法名找到模块
RCT_EXPORT_MODULE(MyNativeModule);

// 导出方法供JavaScript调用
// RCT_EXPORT_METHOD将方法导出到JavaScript
RCT_EXPORT_METHOD(processData:(NSString *)input
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // 在主线程之外执行耗时操作
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        // 处理数据
        NSString *result = [input stringByAppendingString:@" - processed"];

        // 返回结果（需要在主线程回调）
        dispatch_async(dispatch_get_main_queue(), ^{
            resolve(result);
        });
    });
}

// 回调方式的方法（不推荐）
RCT_EXPORT_METHOD(processDataWithCallback:(NSString *)input
                  callback:(RCTResponseSenderBlock)callback)
{
    NSString *result = [input stringByAppendingString:@" - processed"];
    // callback(error, result)
    callback(@[[NSNull null], result]);
}

@end
```

```java
// Android原生模块实现
// MyNativeModule.java
package com.mymodule;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;

public class MyNativeModule extends ReactContextBaseJavaModule {

    public MyNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    // 返回模块名称，JavaScript通过这个名称访问
    @Override
    @NonNull
    public String getName() {
        return "MyNativeModule";
    }

    // 导出Promise方式的方法
    @ReactMethod
    public void processData(String input, Promise promise) {
        try {
            // 处理数据
            String result = input + " - processed";
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("PROCESS_ERROR", "处理失败", e);
        }
    }

    // 导出回调方式的方法（不推荐）
    @ReactMethod
    public void processDataWithCallback(String input, Callback callback) {
        String result = input + " - processed";
        callback.invoke(null, result);
    }
}
```

### 3.2 新架构JSI（JavaScript Interface）

React Native 0.7x引入的新架构使用JSI替代传统Bridge，实现同步、直接的JavaScript与原生通信。

```
JSI vs Legacy Bridge 对比：

Legacy Bridge:                    JSI:
┌─────────┐    JSON     ┌─────────┐
│   JS    │ ◄─────────► │  Bridge  │ ◄── 异步、序列化开销
└─────────┘             └─────────┘

┌─────────┐    C++      ┌─────────┐
│   JS    │ ◄─────────► │ Native  │ ◄── 同步、无序列化
└─────────┘             └─────────┘
```

```javascript
// 使用JSI（新架构）的调用方式
// 由于JSI是同步的，可以直接调用原生方法
import { SomeNativeModule } from 'react-native-nativemodule';

// 同步调用（JSI方式）
const result = SomeNativeModule.getDeviceId(); // 直接返回结果

// 对于不支持JSI的模块，回退到Promise方式
async function callNative() {
  const result = await SomeNativeModule.asyncMethod();
}
```

### 3.3 自定义事件发射

原生模块可以向JavaScript发送事件，JavaScript订阅这些事件。

```javascript
// JavaScript订阅原生事件
// EventEmitter.js
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { useEffect, useState } from 'react';

// 获取原生模块和事件发射器
const { LocationModule } = NativeModules;
// iOS需要通过NativeEventEmitter创建事件发射器
// Android可以直接使用
const eventEmitter = Platform.OS === 'ios'
  ? new NativeEventEmitter(LocationModule)
  : LocationModule;

// 订阅事件的Hook
function useLocationUpdates() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // 订阅位置更新事件
    const subscription = eventEmitter.addListener(
      'onLocationUpdate',  // 事件名称
      (event) => {
        // event包含原生传来的数据
        console.log('收到位置更新:', event);
        setLocation({
          latitude: event.latitude,
          longitude: event.longitude,
          accuracy: event.accuracy,
        });
      }
    );

    // 组件卸载时取消订阅
    return () => {
      subscription.remove();
    };
  }, []);

  return location;
}

// 使用
function LocationScreen() {
  const location = useLocationUpdates();

  return (
    <View>
      <Text>纬度: {location?.latitude}</Text>
      <Text>经度: {location?.longitude}</Text>
    </View>
  );
}
```

```objc
// iOS发送事件到JavaScript
// LocationModule.m
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface LocationModule : RCTEventEmitter <RCTBridgeModule>
@end

@implementation LocationModule {
    // 标记是否还有订阅者
    BOOL hasListeners;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

// 必须实现这个方法，声明支持的事件
- (NSArray<NSString *> *)supportedEvents {
    return @[@"onLocationUpdate", @"onLocationError"];
}

// 有订阅者时调用
- (void)startObserving {
    hasListeners = YES;
}

// 订阅者取消时调用
- (void)stopObserving {
    hasListeners = NO;
}

// 发送事件
- (void)sendLocationUpdate:(NSDictionary *)location {
    // 只有在有订阅者时才发送
    if (hasListeners) {
        [self sendEventWithName:@"onLocationUpdate" body:location];
    }
}

@end
```

---

## 四、热更新与发布

### 4.1 React Native热更新方案

React Native原生不支持Web式的热更新，需要借助CodePush、Expo或自定义方案实现。

**主流热更新方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| CodePush | 微软维护，功能完善 | 仅支持JS bundle | React Native |
| Expo | 功能丰富，无需原生开发 | 受限于Expo生态 | 新项目 |
| CodePush + CodePushPlus | 国内优化，支持增量更新 | 需要自建服务 | 国内应用 |

### 4.2 CodePush集成

```bash
# 安装CodePush CLI
npm install -g code-push-cli

# 注册CodePush账号
code-push register

# 登录
code-push login

# 添加App（iOS和Android分开）
code-push app add MyApp-iOS ios react-native
code-push app add MyApp-Android android react-native
```

```bash
# 在项目中安装CodePush SDK
npm install react-native-code-push --save

# iOS额外步骤：运行pod install
cd ios && pod install
```

```javascript
// App.js - CodePush集成
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import CodePush from 'react-native-code-push';

// CodePush配置选项
const codePushOptions = {
  // 检查更新的频率
  // 'ON_APP_START': 每次app启动时检查（推荐）
  // 'ON_APP_RESUME': app从后台恢复时检查
  // 'MANUAL': 手动检查
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,

  // 安装模式
  // 'IMMEDIATE': 下载完成后立即安装并重启
  // 'ON_NEXT_RESTART': 下次启动时安装
  installMode: CodePush.InstallMode.IMMEDIATE,

  // 强制更新（用户必须更新才能继续）
  // mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,

  // 部署密钥（从CodePush服务器获取）
  deploymentKey: Platform.select({
    ios: 'YOUR_IOS_DEPLOYMENT_KEY',
    android: 'YOUR_ANDROID_DEPLOYMENT_KEY',
  }),
};

// 检测更新的函数
async function checkForUpdate() {
  try {
    const update = await CodePush.checkForUpdate();

    if (update) {
      console.log('发现新版本:', update.label);
      console.log('版本描述:', update.description);

      // 如果是强制更新
      if (update.isMandatory) {
        console.log('这是一个强制更新');
      }

      // 下载更新
      await update.download((progress) => {
        console.log(`下载进度: ${progress.receivedBytes}/${progress.totalBytes}`);
      });

      console.log('下载完成，准备安装');
      // 安装更新
      await update.install(CodePush.InstallMode.IMMEDIATE);
    } else {
      console.log('已是最新版本');
    }
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}

// 监听更新事件
CodePush.notifyAppReady(); // 告诉CodePush应用已准备好（更新安装后重启时调用）

// App根组件
function App() {
  const [syncStatus, setSyncStatus] = useState('检查更新...');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    // 使用CodePush包装组件
    // 包装后的组件会自动处理更新检查和安装
  }, []);

  return (
    <View style={styles.container}>
      <Text>React Native热更新演示</Text>
      <Text>状态: {syncStatus}</Text>
    </View>
  );
}

// 使用CodePush高阶组件包装
// 这个包装会自动处理整个更新流程
export default CodePush(codePushOptions)(App);
```

### 4.3 自定义热更新实现

```javascript
// 热更新管理器
// HotUpdateManager.js
import { NativeModules, Platform } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_URL = 'https://your-cdn.com/updates';
const BUNDLE_FILE = 'bundle.js';

const useUpdateStore = create((set, get) => ({
  // 更新状态
  status: 'idle',  // 'idle' | 'checking' | 'downloading' | 'ready' | 'error'
  progress: 0,
  error: null,
  newVersion: null,

  // 检查更新
  checkForUpdate: async () => {
    set({ status: 'checking', error: null });

    try {
      // 1. 获取当前版本
      const currentVersion = get().bundleVersion;

      // 2. 从服务器获取最新版本信息
      const response = await fetch(`${UPDATE_URL}/manifest.json`);
      const manifest = await response.json();

      // 3. 比较版本
      if (manifest.version > currentVersion) {
        set({
          status: 'available',
          newVersion: manifest,
        });
        return manifest;
      } else {
        set({ status: 'idle' });
        return null;
      }
    } catch (error) {
      set({ status: 'error', error: error.message });
      throw error;
    }
  },

  // 下载更新
  downloadUpdate: async (onProgress) => {
    set({ status: 'downloading', progress: 0 });

    try {
      const { newVersion } = get();

      // 1. 下载JS Bundle
      const bundlePath = `${UPDATE_URL}/${newVersion.bundleFile}`;
      const response = await fetch(bundlePath);

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 2. 读取响应体并追踪进度
      const reader = response.body.getReader();
      const contentLength = parseInt(response.headers.get('Content-Length'), 10);
      let receivedLength = 0;
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength && onProgress) {
          const progress = receivedLength / contentLength;
          set({ progress });
          onProgress(progress);
        }
      }

      // 3. 合并chunks并转换为Blob
      const blob = new Blob(chunks);

      // 4. 保存到本地存储
      await AsyncStorage.setItem(BUNDLE_FILE, await blob.text());
      await AsyncStorage.setItem('updateVersion', newVersion.version);

      set({ status: 'ready' });
      return true;
    } catch (error) {
      set({ status: 'error', error: error.message });
      throw error;
    }
  },

  // 安装更新
  installUpdate: () => {
    const { status } = get();
    if (status !== 'ready') {
      throw new Error('没有可用的更新');
    }

    // 重启应用（由原生代码实现）
    NativeModules.HotUpdateManager.restartApp();
  },
}));

export default useUpdateStore;
```

---

## 五、平台差异处理

### 5.1 平台检测

React Native应用经常需要在iOS和Android之间进行差异化处理。

```javascript
// 平台检测基础方法
import { Platform, PlatformIOSStatic } from 'react-native';

// Platform.OS返回当前平台
console.log(Platform.OS); // 'ios' | 'android'
console.log(Platform.Version); // 系统版本，如 iOS: '14.0' Android: '29'

// Platform.select根据平台选择值
const value = Platform.select({
  ios: '这是iOS',
  android: '这是Android',
  default: '其他平台',
});

// Platform.isPad检测是否是iPad
const isIPad = Platform.isPad;

// 封装自定义Hook进行平台检测
import { usePlatform } from './hooks/usePlatform';

function MyComponent() {
  const { isIOS, isAndroid, platformVersion } = usePlatform();

  return (
    <View>
      <Text>平台: {isIOS ? 'iOS' : 'Android'}</Text>
      <Text>版本: {platformVersion}</Text>
    </View>
  );
}
```

### 5.2 平台特定组件

```javascript
// components/Button.js
// 根据平台渲染不同组件
import React from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  Platform,
  Text,
  StyleSheet,
} from 'react-native';

// iOS使用TouchableOpacity，Android使用TouchableHighlight
function Button({ title, onPress, style }) {
  // 平台检测
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, style]}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableHighlight
        onPress={onPress}
        style={[styles.button, style]}
        // Android专属：按压时的背景色
        underlayColor="#0066cc"
      >
        <Text style={styles.text}>{title}</Text>
      </TouchableHighlight>
    );
  }
}

// 或者使用Platform.select进行平台选择
function PlatformButton({ title, onPress, style }) {
  const Component = Platform.select({
    ios: TouchableOpacity,
    android: TouchableHighlight,
    default: TouchableOpacity,
  });

  const activeOpacity = Platform.select({
    ios: 0.7,
    android: undefined,
  });

  return (
    <Component
      onPress={onPress}
      style={style}
      activeOpacity={activeOpacity}
      underlayColor="#0066cc"
    >
      <Text style={styles.text}>{title}</Text>
    </Component>
  );
}
```

### 5.3 平台特定样式

```javascript
// styles/buttonStyles.js
import { Platform, StyleSheet } from 'react-native';

// 使用Platform.select处理平台差异
const buttonStyles = StyleSheet.create({
  button: {
    // 通用样式
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',

    // iOS特定样式
    ...Platform.select({
      ios: {
        backgroundColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      // Android特定样式
      android: {
        backgroundColor: '#2196F3',
        elevation: 4,  // Android阴影
      },
    }),
  },

  text: {
    fontSize: 16,
    fontWeight: '600',

    // 平台特定的字体
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
});

// 使用Platform.Color处理颜色差异
// 如果需要根据平台返回不同颜色值
function getButtonColor() {
  return Platform.select({
    ios: '#007AFF',
    android: '#2196F3',
  });
}
```

### 5.4 平台特定文件

React Native会自动根据平台加载特定后缀的文件。

```
# 文件命名约定
Button.js              # 通用实现
Button.ios.js           # iOS特定实现
Button.android.js       # Android特定实现

# 使用方式完全相同
import Button from './Button';  // 自动加载正确版本
```

```javascript
// Button.ios.js - iOS实现
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// iOS可能需要额外的Apple风格设计
export default function Button({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      // iOS特有的属性
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,  // iOS通常使用更大的圆角
  },
  text: {
    color: '#ffffff',
    fontFamily: 'System',
  },
});
```

```javascript
// Button.android.js - Android实现
import React from 'react';
import { TouchableNativeFeedback, Text, View, StyleSheet } from 'react-native';

export default function Button({ title, onPress }) {
  return (
    <TouchableNativeFeedback
      onPress={onPress}
      // Android特有的波纹效果
      background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
      useForeground={true}
    >
      <View style={styles.button}>
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableNativeFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,  // Android通常使用较小的圆角
    elevation: 2,     // Android阴影
  },
  text: {
    color: '#ffffff',
    fontFamily: 'Roboto',
  },
});
```

### 5.5 设备检测与适配

```javascript
// utils/deviceUtils.js
import { Dimensions, Platform, PixelRatio } from 'react-native';

// 获取屏幕尺寸
const { width, height } = Dimensions.get('window');

// 获取屏幕像素密度
const pixelRatio = PixelRatio.get();

// 根据像素密度调整尺寸
function normalize(size) {
  // 根据平台调整设计稿的基准
  const standard = Platform.OS === 'ios' ? 375 : 360;
  const scale = width / standard;

  // 四舍五入到最近的像素
  return Math.round(size * scale);
}

// 检测是否为刘海屏（iPhone X及更新）
function isNotchDevice() {
  // iOS检测
  if (Platform.OS === 'ios') {
    // iPhone X, XS, XS Max, 11 Pro Max等
    const modelsWithNotch = ['iPhone10,3', 'iPhone10,6', 'iPhone11,2', 'iPhone11,4', 'iPhone11,6', 'iPhone11,8'];
    // 更简单的方式：检测SafeAreaView的实际padding
    // 可以使用 react-native-safe-area-context
  }

  // Android检测（刘海屏）
  if (Platform.OS === 'android') {
    // Android P (9.0)及以上版本可以通过windowInsets获取
    const windowManager = NativeModules.WindowManager;
    if (windowManager?.hasNotch) {
      return true;
    }
  }

  return false;
}

// 检测设备类型
function getDeviceType() {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;

  // 通常认为宽高比大于1.6的为手机
  if (aspectRatio > 1.6) {
    return 'phone';
  } else {
    return 'tablet';
  }
}

// 获取状态栏高度
function getStatusBarHeight() {
  if (Platform.OS === 'ios') {
    // iOS根据机型判断
    // iPhone X及更新有更大的状态栏
    return 44; // 简化判断，实际需要更复杂的逻辑
  } else {
    // Android通常可以通过StatusBar组件获取
    return 24;
  }
}

// 获取导航栏高度
function getNavigationBarHeight() {
  if (Platform.OS === 'ios') {
    return 44;
  } else {
    // Android导航栏高度
    return 56;
  }
}

export {
  width,
  height,
  pixelRatio,
  normalize,
  isNotchDevice,
  getDeviceType,
  getStatusBarHeight,
  getNavigationBarHeight,
};
```

---

## 六、导航与路由

### 6.1 React Navigation核心

React Navigation是React Native最流行的导航解决方案。

```bash
# 安装React Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 安装依赖
npm install react-native-screens react-native-safe-area-context
```

```javascript
// App.js - React Navigation配置
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

// 导入页面组件
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import DetailScreen from './screens/DetailScreen';

// 创建导航器实例
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 底部Tab导航器
function TabNavigator() {
  return (
    <Tab.Navigator
      // Tab栏配置
      screenOptions={{
        // 默认显示的Tab图标
        tabBarIcon: ({ focused, color, size }) => {
          return <Text style={{ color, fontSize: size }}>{focused ? '●' : '○'}</Text>;
        },
        // Tab栏样式
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        // 是否显示Tab栏
        tabBarVisible: true,
      }}
    >
      {/* 首页Tab */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarLabel: '首页',
        }}
      />
      {/* 个人中心Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarLabel: '我的',
        }}
      />
      {/* 设置Tab */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '设置',
          tabBarLabel: '设置',
        }}
      />
    </Tab.Navigator>
  );
}

// 根堆栈导航器
function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // 全局屏幕选项
        screenOptions={{
          // 头部样式
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#007AFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Tab导航器作为首页 */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        {/* 详情页 */}
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            title: '详情页',
            // 页面跳转动画
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <AppNavigator />;
}
```

### 6.2 页面间数据传递

```javascript
// 导航页面：HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

function HomeScreen() {
  const navigation = useNavigation();

  // 1. 通过params传递数据（最常用）
  function navigateToDetail(item) {
    navigation.navigate('Detail', {
      // 传递参数
      itemId: item.id,
      itemTitle: item.title,
      itemData: item,  // 可以传递整个对象
    });
  }

  // 2. 通过route.params获取数据（在目标页面）
  // DetailScreen中使用 useRoute().params 获取

  // 3. 使用回调函数（适合需要返回数据的场景）
  function navigateWithCallback() {
    navigation.navigate('Detail', {
      // 设置回调函数名称
      onSelect: (selectedItem) => {
        console.log('选中了:', selectedItem);
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigateToDetail({ id: 1, title: '示例项目' })}
      >
        <Text style={styles.buttonText}>跳转详情页</Text>
      </TouchableOpacity>
    </View>
  );
}

// 详情页面：DetailScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

function DetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // 获取传递的参数
  const { itemId, itemTitle, itemData, onSelect } = route.params;

  // 也可以使用回调
  function handleSelect() {
    if (onSelect) {
      onSelect(itemData);
    }
    // 返回上一页
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
      <Text>ID: {itemId}</Text>
      <Text>标题: {itemTitle}</Text>
      <Text>数据: {JSON.stringify(itemData)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
```

---

## 七、状态管理

### 7.1 Zustand在React Native中的应用

```javascript
// stores/userStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 使用persist中间件实现数据持久化
const useUserStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,            // 用户信息
      token: null,           // 登录令牌
      isLoading: false,      // 加载状态
      error: null,           // 错误信息

      // Actions
      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      // 异步登录
      login: async (username, password) => {
        set({ isLoading: true, error: null });

        try {
          // 模拟API请求
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            throw new Error('登录失败');
          }

          const data = await response.json();

          // 更新状态
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },

      // 登出
      logout: () => set({
        user: null,
        token: null,
        error: null,
      }),

      // 更新用户信息
      updateProfile: (updates) => {
        const { user } = get();
        set({
          user: { ...user, ...updates },
        });
      },
    }),
    {
      // 持久化配置
      name: 'user-storage',              // 存储键名
      storage: createJSONStorage(() => AsyncStorage),  // 使用AsyncStorage
      partialize: (state) => ({
        // 只持久化这些字段
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useUserStore;
```

```javascript
// 在组件中使用
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import useUserStore from './stores/userStore';

function LoginScreen() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  // 从store获取状态和actions
  const { login, isLoading, error } = useUserStore();

  async function handleLogin() {
    const result = await login(username, password);
    if (result.success) {
      // 登录成功，跳转
      console.log('登录成功');
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="用户名"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="密码"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '登录中...' : '登录'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 总结

本文深入讲解了React Native移动开发的各个方面：

1. **核心概念**：React Native与React的区别和工作原理
2. **原生组件**：View、Text、FlatList等核心组件的使用
3. **Bridge通信**：Legacy Bridge和JSI新架构的原理和实现
4. **热更新**：CodePush和自定义热更新方案
5. **平台差异处理**：Platform检测、平台特定组件和样式
6. **导航与路由**：React Navigation的配置和数据传递
7. **状态管理**：Zustand在React Native中的应用

React Native是一个成熟、稳定的跨平台移动开发框架，特别适合：
- 已有React/Web技术栈的团队
- 需要快速开发iOS和Android双平台应用
- 对性能要求不是特别极致的应用

通过合理的架构设计和最佳实践，可以构建出体验接近原生的移动应用。
