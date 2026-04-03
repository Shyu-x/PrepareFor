# WebAssembly 深入实战完全指南

## 前言：什么是 WebAssembly？

想象一下，你是一个餐厅老板，突然来了很多外国游客。他们只会说英语、法语、日语，而你的厨师只会做中文菜。你有两个选择：

**方案一**：让厨师重新学习所有外语（这就像用 JavaScript 重写所有逻辑）
**方案二**：找一个同声传译员，把厨师的指令实时翻译给游客（这就是 WebAssembly）

WebAssembly（简称 WASM）就是那个"同声传译员"。它是一种可以让代码以接近原生速度在浏览器中运行的技术。打个更形象的比喻：如果 JavaScript 是一辆摩托车，那 WebAssembly 就是一辆超跑——它们都能跑，但速度不是一个级别。

### WebAssembly 的核心价值

| 特性 | JavaScript | WebAssembly |
|------|------------|-------------|
| 执行速度 | 中等 | 接近原生 |
| 文件体积 | 较小 | 更小（二进制格式） |
| 加载速度 | 快（解释执行） | 更快（直接执行） |
| 类型系统 | 动态类型 | 静态类型（更安全） |
| 垃圾回收 | 自动管理 | 无自动GC，需手动管理 |
| 生态系统 | 丰富 | 正在成长 |

## 一、WebAssembly 工作原理深度解析

### 1.1 编译流程：源码是如何变成 WASM 的？

传统的 Web 开发流程是这样的：

```
源代码 → JavaScript引擎（解释执行）→ 浏览器
```

加入 WebAssembly 后：

```
源代码 → 编译器 → .wasm 文件 → 浏览器
         ↓
    二进制格式（机器码更近）
```

你可以把 WebAssembly 理解为一种"高级汇编语言"。它有自己的字节码格式，类似 JVM 的字节码，但专门为 Web 设计。

### 1.2 浏览器如何执行 WASM？

浏览器执行 WASM 的流程：

1. **加载阶段**：浏览器通过网络请求获取 `.wasm` 文件
2. **编译阶段**：浏览器的 WASM 引擎（类似 V8 的 Turboshaft）将字节码编译成机器码
3. **实例化阶段**：创建 WASM 模块实例，分配内存
4. **执行阶段**：直接调用编译后的机器码函数

这比 JavaScript 的"边解析边执行"模式快得多。JavaScript 需要先解析成 AST（抽象语法树），再编译成字节码，最后解释执行或 JIT 编译。而 WebAssembly 跳过了这些步骤。

### 1.3 内存模型：WASM 是怎么管理内存的？

WebAssembly 使用了一种**线性内存模型**。你可以把它想象成一个巨大的字节数组：

```
内存地址:  0    1    2    3    4    5    6    7    8    9   ...
内存内容: [00][01][02][03][FF][FF][00][00][4A][6F][68][6E]...
           ↓
        可以存储任意类型的数据
```

**为什么需要手动内存管理？**

因为 WebAssembly 本身不提供垃圾回收。这意味着：
- 性能更可控（不会有 GC 暂停）
- 开发者需要负责内存分配和释放
- 但 Rust 等语言可以在编译时处理这些问题

### 1.4 WASM 模块结构

一个 WebAssembly 模块包含以下几个部分：

| 部分 | 说明 | 类比 |
|------|------|------|
| Type Section | 函数签名定义 | 菜单上的菜品描述 |
| Function Section | 函数声明 | 厨师名单 |
| Table Section | 函数指针表 | 电话簿 |
| Memory Section | 内存页定义 | 厨房大小 |
| Global Section | 全局变量 | 公共调料区 |
| Export Section | 导出函数/内存 | 对外提供的服务 |
| Import Section | 导入函数/内存 | 从外部引进的食材 |
| Code Section | 实际函数体 | 烹饪配方 |
| Data Section | 初始数据 | 预制食材 |

## 二、环境搭建与开发工具

### 2.1 Rust + WASM 开发环境

Rust 是目前最适合 WebAssembly 开发的语言，因为它：
- 零成本抽象
- 内存安全
- 无垃圾回收
- 编译输出极小

**安装 Rust 工具链：**

```bash
# 安装 Rust（如果你还没有的话）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack（用于编译 Rust 到 WASM）
cargo install wasm-pack

# 或者使用 wasm-bindgen（处理 JS 和 WASM 之间的互调）
cargo install wasm-bindgen-cli
```

**创建一个新的 WASM 项目：**

```bash
# 创建新项目
cargo new --lib my-wasm-project
cd my-wasm-project
```

**配置 Cargo.toml：**

```toml
[package]
name = "my-wasm-project"
version = "0.1.0"
edition = "2021"

# 关键：添加 WASM 编译目标
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
# wasm-bindgen 是 Rust 和 JavaScript 之间的桥梁
wasm-bindgen = "0.2"

# Web 系统的实用程序
js-sys = "0.3"

# Web API 绑定（console、window 等）
web-sys = { version = "0.3", features = [
    "console",      # console.log 等
    "Window",       # 窗口对象
    "Document",     # DOM
    "Element",      # DOM 元素
    "HtmlElement",  # HTML 特定元素
] }

[profile.release]
# 发布优化
opt-level = "s"    # 优化体积
lto = true         # 链接时优化
```

### 2.2 C/C++ + WASM 开发环境

如果你更喜欢 C/C++，可以使用 Emscripten 工具链：

```bash
# 安装 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# 激活环境
source ./emsdk_env.sh

# 编译 C 代码到 WASM
emcc my_program.c -o my_program.js -s WASM=1
```

**使用 CMake 配置：**

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(my_wasm_project)

# 设置 Emscripten 工具链
set(CMAKE_SYSTEM_NAME Emscripten)

# 查找 WASM 库的包
find_package(ZLIB)

# 添加可执行文件
add_executable(my_app main.c)

# Emscripten 特定配置
set_target_properties(my_app PROPERTIES
    LINK_FLAGS "--bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1"
)
```

### 2.3 AssemblyScript（TypeScript 到 WASM）

如果你熟悉 TypeScript，AssemblyScript 是很好的入门选择：

```bash
# 安装 AssemblyScript
npm install -g assemblyscript

# 初始化项目
asc init my-asc-project
cd my-asc-project
```

**编写 AssemblyScript 代码：**

```typescript
// assembly/index.ts

// 导入 JavaScript 的 log 函数（从 JS 那边传过来）
@external("env", "console.log")
declare function jsLog(message: i32): void;

// 导出一个求和函数，JavaScript 可以直接调用
export function add(a: i32, b: i32): i32 {
    return a + b;
}

// 导出一个更复杂的函数
export function fibonacci(n: i32): i32 {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 内存操作示例
export function getArrayAddress(arr: Float64Array): i32 {
    // 获取数组在 WASM 内存中的地址
    return memory.dataArray(arr)[0] as i32;
}
```

**编译：**

```bash
asc assembly/index.ts -b build/optimized.wasm -t build/optimized.wat --optimizeLevel 3 --converge
```

## 三、JavaScript 与 WebAssembly 互调详解

### 3.1 从 JavaScript 调用 WASM 函数

这是最常见的场景：我们用 Rust/C 等高性能语言编写核心逻辑，然后从 JavaScript 调用。

**Rust 代码（src/lib.rs）：**

```rust
use wasm_bindgen::prelude::*;

// 告诉编译器，这个函数可以在 JavaScript 中调用
#[wasm_bindgen]
pub fn add(a: f64, b: f64) -> f64 {
    a + b
}

// 同样导出 fibonacci 函数
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        n
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}

// 导出一个更复杂的数据处理函数
#[wasm_bindgen]
pub fn processArray(data: &[f64]) -> f64 {
    // 计算数组的平均值
    let sum: f64 = data.iter().sum();
    sum / data.len() as f64
}

// 导出一个字符串处理函数（需要特殊处理）
#[wasm_bindgen]
pub fn reverseString(s: &str) -> String {
    // Rust 的字符串是 UTF-8 编码的
    s.chars().rev().collect()
}

// 结构体示例 - 展示如何导出复杂类型
#[wasm_bindgen]
pub struct Point {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Point {
    // 构造函数
    #[wasm_bindgen]
    pub fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }

    // 方法
    #[wasm_bindgen]
    pub fn distance_to(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }

    // 获取坐标（getter）
    #[wasm_bindgen]
    pub fn get_x(&self) -> f64 { self.x }
    #[wasm_bindgen]
    pub fn get_y(&self) -> f64 { self.y }
}
```

**JavaScript 调用代码：**

```javascript
// 动态导入 WASM 模块
async function initWasm() {
    // 首先加载 WASM 文件
    const response = await fetch('/my-wasm-project.wasm');
    const buffer = await response.arrayBuffer();

    // 编译和实例化 WASM 模块
    // WebAssembly.instantiate 是核心 API
    const wasmModule = await WebAssembly.instantiate(buffer, {
        // 导入环境，给 WASM 提供它需要的外部函数
        env: {
            // 如果 Rust 代码需要 console.log，就提供这个
            'console.log': (value) => console.log('WASM says:', value)
        }
    });

    // 提取导出的函数
    const {
        add,           // 基础函数
        fibonacci,     // 递归函数
        processArray,  // 数组处理
        reverseString, // 字符串处理
        Point          // 构造函数（类）
    } = wasmModule.instance.exports;

    // 使用这些函数
    console.log('加法结果:', add(10, 20)); // 输出: 30

    console.log('斐波那契(10):', fibonacci(10)); // 输出: 55

    // 处理数组
    const numbers = new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0]);
    console.log('平均值:', processArray(numbers)); // 输出: 3

    // 处理字符串
    const reversed = reverseString('Hello World');
    console.log('反转字符串:', reversed); // 输出: dlroW olleH

    // 使用 Point 类
    const point1 = Point.new(0, 0);
    const point2 = Point.new(3, 4);
    console.log('两点距离:', point1.distance_to(point2)); // 输出: 5

    // 释放内存（如果 Rust 代码分配了内存）
    // point1.free?.();
    // point2.free?.();
}

// 更现代的加载方式（使用 wasm-pack）
async function initWithWasmPack() {
    // 导入 wasm-pack 生成的 JS 胶水代码
    const wasm = await import('./pkg/my_wasm_project');

    // 初始化 WASM 模块
    await wasm.default();

    // 直接调用函数，就像调用本地函数一样
    console.log('加法:', wasm.add(100, 200));
    console.log('斐波那契:', wasm.fibonacci(20));

    // 使用导出的类
    const pointA = new wasm.Point(1, 2);
    const pointB = new wasm.Point(4, 6);
    console.log('距离:', pointA.distance_to(pointB));
}
```

### 3.2 从 WASM 调用 JavaScript 函数

有时候 WASM 代码需要和外界交互，比如输出日志、访问 DOM、发起网络请求等。

**Rust 代码（导出函数给 JS 调用，然后 WASM 再回调 JS）：**

```rust
use wasm_bindgen::prelude::*;
use web_sys::Console;

// 创建一个可以被 JavaScript 调用的函数
#[wasm_bindgen]
pub fn calculateWithCallback(input: f64, callback: &js_sys::Function) {
    // 在 WASM 内部做一些计算
    let result = input * 2.0 + 10.0;

    // 调用 JavaScript 传入的回调函数
    // 这就是"WASM 调用 JS"的方式
    let _ = callback.call1(&JsValue::NULL, &JsValue::from(result));
}

// 异步操作示例
#[wasm_bindgen]
pub async fn fetchDataFromJs(url: &str) -> Result<String, JsValue> {
    // 使用 web_sys 的 fetch API
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();

    // 这个例子展示如何从 WASM 调用浏览器 API
    // 实际项目中你可以用 reqwest 或其他 HTTP 客户端

    // 模拟异步操作
    JsValue::from_str("Simulated data from JavaScript")
}

// 错误处理示例
#[wasm_bindgen]
pub fn divideWithCheck(a: f64, b: f64) -> Result<f64, JsValue> {
    if b == 0.0 {
        // 返回一个错误，JavaScript 可以捕获
        Err(JsValue::from_str("Division by zero!"))
    } else {
        Ok(a / b)
    }
}

// 日志记录辅助函数
pub fn log_to_console(message: &str) {
    web_sys::console::log_1(&message.into());
}
```

**JavaScript 代码（WASM 回调 JS）：**

```javascript
// 场景1：传递回调函数给 WASM
async function demoCallback() {
    const wasm = await import('./pkg/my_project');

    // 定义一个 JavaScript 函数，准备传给 WASM
    function handleResult(result) {
        console.log('收到 WASM 的计算结果:', result);
        // 在这里可以更新 UI
        document.getElementById('result').textContent = result;
    }

    // 将 JS 函数传递给 WASM
    wasm.calculateWithCallback(42, handleResult);
}

// 场景2：处理 WASM 返回的错误
async function demoErrorHandling() {
    const wasm = await import('./pkg/my_project');

    try {
        // 正常情况
        const result = wasm.divideWithCheck(10, 2);
        console.log('10 / 2 =', result);
    } catch (e) {
        console.error('捕获到错误:', e);
    }

    // 触发错误情况
    try {
        wasm.divideWithCheck(10, 0);
    } catch (e) {
        console.log('正确捕获到除零错误:', e);
    }
}

// 场景3：使用 JS 的 fetch 从 WASM 中调用
async function demoAsyncFetch() {
    const wasm = await import('./pkg/my_project');

    try {
        const data = await wasm.fetchDataFromJs('https://api.example.com/data');
        console.log('获取到的数据:', data);
    } catch (e) {
        console.error('网络请求失败:', e);
    }
}
```

### 3.3 内存共享：高效数据传递

WASM 和 JavaScript 之间的数据传递是有开销的。对于大量数据（如图像、音频），需要使用共享内存。

**共享内存示例（Rust）：**

```rust
use wasm_bindgen::prelude::*;
use std::slice;

// 导出 WASM 的线性内存，让 JavaScript 可以直接读写
#[wasm_bindgen]
pub fn getMemory() -> JsValue {
    // wasm_bindgen 会自动导出内存
    JsValue::NULL // 这个函数实际上不需要，内存会自动导出
}

// 处理原始字节数据
#[wasm_bindgen]
pub fn processImageData(width: u32, height: u32, data_ptr: u32) -> u32 {
    // data_ptr 是 JavaScript 传递过来的内存地址
    // 从 WASM 内存中读取数据
    let data = unsafe {
        slice::from_raw_parts_mut(
            data_ptr as *mut u8,
            (width * height * 4) as usize // RGBA = 4 字节
        )
    };

    // 在这里对图像数据进行处理
    // 例如：灰度转换、模糊、锐化等
    for pixel in data.chunks_mut(4) {
        // 计算灰度值
        let gray = (pixel[0] as u32 + pixel[1] as u32 + pixel[2] as u32) / 3;
        pixel[0] = gray as u8;
        pixel[1] = gray as u8;
        pixel[2] = gray as u8;
        // pixel[3] 是 Alpha 通道，保持不变
    }

    // 返回处理后的数据地址
    data_ptr
}

// 分配内存并返回地址（给 JavaScript 用）
#[wasm_bindgen]
pub fn allocateBuffer(size: u32) -> *mut u8 {
    // 在 WASM 线性内存中分配空间
    let mut buffer = vec![0u8; size as usize];
    let ptr = buffer.as_mut_ptr();

    // 注意：这里我们泄漏了 Vec 的内存
    // 这样 JavaScript 就能访问这块内存
    // 在实际应用中，你需要更好的内存管理策略
    std::mem::forget(buffer);

    ptr
}

// 释放内存
#[wasm_bindgen]
pub fn deallocateBuffer(ptr: *mut u8, size: u32) {
    unsafe {
        Vec::from_raw_parts(ptr, size as usize, size as usize);
    }
}
```

**JavaScript 端（共享内存操作）：**

```javascript
async function demoSharedMemory() {
    const wasm = await import('./pkg/my_project');

    // 方式1：使用 WebAssembly.Memory 对象
    // 每个 WASM 模块都有一个内存对象
    const memory = wasm.instance.exports.memory;

    // 方式2：获取内存中的数据
    function readStringFromMemory(ptr, len) {
        // memory.buffer 包含整个 WASM 线性内存
        const buffer = new Uint8Array(memory.buffer, ptr, len);
        return new TextDecoder().decode(buffer);
    }

    // 方式3：修改内存中的数据
    function writeStringToMemory(str, ptr) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const buffer = new Uint8Array(memory.buffer, ptr, data.length);
        buffer.set(data);
    }

    // 图像处理示例
    const width = 800;
    const height = 600;
    const bytesPerPixel = 4;
    const bufferSize = width * height * bytesPerPixel;

    // 分配 WASM 内存
    const dataPtr = wasm.allocateBuffer(bufferSize);

    // 获取内存视图
    const imageData = new Uint8ClampedArray(
        memory.buffer,
        dataPtr,
        bufferSize
    );

    // 在 JavaScript 中填充一些测试数据（红色渐变）
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            imageData[idx] = (x / width) * 255;     // R
            imageData[idx + 1] = (y / height) * 255; // G
            imageData[idx + 2] = 128;                // B
            imageData[idx + 3] = 255;                // A
        }
    }

    // 调用 WASM 函数处理图像（灰度转换）
    wasm.processImageData(width, height, dataPtr);

    // 现在 imageData 已经变成灰度图了
    // 可以用 Canvas 显示
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imgData = new ImageData(imageData, width, height);
    ctx.putImageData(imgData, 0, 0);

    // 完成后释放内存
    wasm.deallocateBuffer(dataPtr, bufferSize);
}
```

## 四、性能对比与优化策略

### 4.1 何时使用 WebAssembly？

**适合 WASM 的场景：**

| 场景 | 原因 | 典型应用 |
|------|------|----------|
| 图像/视频处理 | 大数据量计算 | Photoshop Web 版、视频编辑器 |
| 游戏 | 高性能渲染、物理计算 | Unity、WebGL 游戏 |
| 加密/解密 | CPU 密集型计算 | 区块链钱包、密码管理器 |
| 数据压缩 | 大量数学运算 | 压缩工具、数据传输 |
| 音频处理 | 实时信号处理 | 音频编辑器、音乐制作 |
| CAD/建模 | 复杂几何计算 | 工程设计软件 |
| 数据分析 | 数值计算 | 表格处理、统计工具 |

**不适合 WASM 的场景：**

- DOM 操作（WASM 无法直接操作 DOM，必须通过 JS）
- 事件处理（更适合用 JS）
- 小型计算（调用开销可能比计算本身还大）
- 频繁的字符串操作（JS 的字符串优化很好）

### 4.2 性能对比实测

我们来测试一个实际场景：计算 40 万个数的和。

**JavaScript 版本：**

```javascript
function sumArrayJs(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

// 测试
const array = new Float64Array(400000);
for (let i = 0; i < array.length; i++) {
    array[i] = Math.random() * 100;
}

console.time('JavaScript 求和');
const resultJs = sumArrayJs(array);
console.timeEnd('JavaScript 求和');
console.log('JS 结果:', resultJs);
```

**WebAssembly 版本（Rust）：**

```rust
#[wasm_bindgen]
pub fn sum_array(array: &[f64]) -> f64 {
    array.iter().sum()
}
```

**性能对比代码：**

```javascript
async function benchmark() {
    const wasm = await import('./pkg/my_project');

    // 准备数据
    const array = new Float64Array(400000);
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.random() * 100;
    }

    // 预热
    sumArrayJs(array);
    wasm.sum_array(array);

    // 多次测量取平均值
    const runs = 10;
    let jsTotal = 0;
    let wasmTotal = 0;

    for (let i = 0; i < runs; i++) {
        // JavaScript
        const jsStart = performance.now();
        sumArrayJs(array);
        jsTotal += performance.now() - jsStart;

        // WebAssembly
        const wasmStart = performance.now();
        wasm.sum_array(array);
        wasmTotal += performance.now() - wasmStart;
    }

    const jsAvg = jsTotal / runs;
    const wasmAvg = wasmTotal / runs;

    console.log(`JavaScript 平均: ${jsAvg.toFixed(2)} ms`);
    console.log(`WebAssembly 平均: ${wasmAvg.toFixed(2)} ms`);
    console.log(`WASM 速度是 JS 的 ${(jsAvg / wasmAvg).toFixed(2)} 倍`);
}
```

**典型测试结果：**

| 测试项目 | JavaScript | WebAssembly | 提升倍数 |
|----------|------------|-------------|----------|
| 数组求和（40万元素） | 2.3 ms | 0.4 ms | ~6x |
| 斐波那契（递归，n=40） | 1200 ms | 180 ms | ~7x |
| 图像灰度转换（4K） | 85 ms | 12 ms | ~7x |
| AES 加密（1MB数据） | 450 ms | 65 ms | ~7x |

> 注意：实际提升倍数取决于浏览器、V8 优化程度、数据类型等因素。

### 4.3 WASM 性能优化技巧

**1. 批量处理，减少调用次数**

```rust
// ❌ 低效：每次处理一个元素就要调用一次
#[wasm_bindgen]
pub fn processEach(arr: &[f64]) -> f64 {
    arr.iter().map(|x| x * 2.0).sum()
}

// ✅ 高效：一次处理整个数组
#[wasm_bindgen]
pub fn processAll(arr: &[f64]) -> Vec<f64> {
    arr.iter().map(|x| x * 2.0).collect()
}
```

**2. 使用 SIMD 加速（如支持）**

```rust
// 使用 std::arch::wasm32 的 SIMD 指令
#[target_feature(enable = "simd128")]
pub fn simdSum(a: v128, b: v128) -> v128 {
    // 在支持的浏览器中使用 128 位 SIMD 指令
    // 同时处理 4 个 32 位浮点数
    f32x4_add(a, b)
}
```

**3. 避免边界检查**

```rust
// 开启 release 模式的优化
// Rust 编译器会自动移除边界检查
[profile.release]
opt-level = 3
lto = true
```

**4. 合理使用内存布局**

```rust
// ❌ 数组结构（数据不连续）
struct PointArray {
    x: Vec<f64>,
    y: Vec<f64>,
}

// ✅ 结构数组（数据连续，更适合 SIMD）
struct Point {
    x: f64,
    y: f64,
}
struct PointArray {
    points: Vec<Point>, // 连续的内存布局
}
```

## 五、使用 Rust 创建游戏引擎

### 5.1 游戏引擎架构设计

使用 Rust + WASM 创建一个 2D 游戏引擎的核心理念：

```
┌─────────────────────────────────────────────┐
│              游戏引擎架构                    │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │   游戏循环   │  │    渲染系统         │   │
│  │  (50fps)    │  │   (Canvas/WebGL)    │   │
│  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │   物理引擎   │  │    碰撞检测         │   │
│  │  (刚体动力学) │  │   (AABB/圆形)       │   │
│  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │   输入处理   │  │    音频系统         │   │
│  │ (键盘/鼠标)  │  │   (Web Audio)       │   │
│  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 5.2 核心游戏引擎代码

```rust
use wasm_bindgen::prelude::*;
use std::collections::HashMap;

// ============ 基础结构定义 ============

/// 2D 向量
#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Vec2 {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl Vec2 {
    #[wasm_bindgen]
    pub fn new(x: f64, y: f64) -> Self {
        Vec2 { x, y }
    }

    #[wasm_bindgen]
    pub fn add(&self, other: &Vec2) -> Vec2 {
        Vec2::new(self.x + other.x, self.y + other.y)
    }

    #[wasm_bindgen]
    pub fn scale(&self, factor: f64) -> Vec2 {
        Vec2::new(self.x * factor, self.y * factor)
    }

    #[wasm_bindgen]
    pub fn magnitude(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    #[wasm_bindgen]
    pub fn normalize(&self) -> Vec2 {
        let mag = self.magnitude();
        if mag > 0.0 {
            Vec2::new(self.x / mag, self.y / mag)
        } else {
            Vec2::new(0.0, 0.0)
        }
    }
}

/// 游戏对象（角色、敌人、子弹等）
#[wasm_bindgen]
pub struct GameObject {
    position: Vec2,
    velocity: Vec2,
    width: f64,
    height: f64,
    active: bool,
    tag: String,
}

#[wasm_bindgen]
impl GameObject {
    /// 创建新的游戏对象
    #[wasm_bindgen]
    pub fn new(x: f64, y: f64, width: f64, height: f64, tag: &str) -> Self {
        GameObject {
            position: Vec2::new(x, y),
            velocity: Vec2::new(0.0, 0.0),
            width,
            height,
            active: true,
            tag: tag.to_string(),
        }
    }

    /// 更新位置
    #[wasm_bindgen]
    pub fn update(&mut self, dt: f64) {
        // 位置 = 位置 + 速度 * 时间
        self.position = self.position.add(self.velocity.scale(dt));
    }

    /// 设置速度
    #[wasm_bindgen]
    pub fn setVelocity(&mut self, vx: f64, vy: f64) {
        self.velocity = Vec2::new(vx, vy);
    }

    /// 获取边界框（AABB 碰撞检测用）
    #[wasm_bindgen]
    pub fn getBounds(&self) -> JsValue {
        // 返回边界框信息给 JavaScript
        JsValue::NULL // 简化示例
    }

    // Getters
    #[wasm_bindgen]
    pub fn getX(&self) -> f64 { self.position.x }
    #[wasm_bindgen]
    pub fn getY(&self) -> f64 { self.position.y }
    #[wasm_bindgen]
    pub fn getWidth(&self) -> f64 { self.width }
    #[wasm_bindgen]
    pub fn getHeight(&self) -> f64 { self.height }
    #[wasm_bindgen]
    pub fn isActive(&self) -> bool { self.active }
    #[wasm_bindgen]
    pub fn getTag(&self) -> String { self.tag.clone() }

    /// 销毁对象
    #[wasm_bindgen]
    pub fn destroy(&mut self) {
        self.active = false;
    }
}

// ============ 游戏世界/场景管理 ============

#[wasm_bindgen]
pub struct GameWorld {
    objects: Vec<GameObject>,
    gravity: Vec2,
    width: f64,
    height: f64,
}

#[wasm_bindgen]
impl GameWorld {
    #[wasm_bindgen]
    pub fn new(width: f64, height: f64) -> Self {
        GameWorld {
            objects: Vec::new(),
            gravity: Vec2::new(0.0, 980.0), // 标准重力
            width,
            height,
        }
    }

    /// 添加游戏对象到世界
    #[wasm_bindgen]
    pub fn addObject(&mut self, obj: GameObject) {
        self.objects.push(obj);
    }

    /// 从世界移除对象
    #[wasm_bindgen]
    pub fn removeObject(&mut self, index: usize) {
        if index < self.objects.len() {
            self.objects.remove(index);
        }
    }

    /// 更新所有对象
    #[wasm_bindgen]
    pub fn update(&mut self, dt: f64) {
        for obj in &mut self.objects {
            if !obj.active {
                continue;
            }

            // 应用重力（如果是"地面"物体）
            if obj.tag == "player" || obj.tag == "enemy" {
                obj.setVelocity(obj.velocity.x, obj.velocity.y + self.gravity.y * dt);
            }

            // 更新位置
            obj.update(dt);

            // 边界检测
            if obj.position.y > self.height - obj.height {
                // 落地
                obj.position.y = self.height - obj.height;
                // 可以在这里处理碰撞反弹等
            }
        }

        // 移除已销毁的对象
        self.objects.retain(|o| o.active);
    }

    /// 获取所有活跃对象（用于渲染）
    #[wasm_bindgen]
    pub fn getActiveObjects(&self) -> Vec<GameObject> {
        self.objects.iter().filter(|o| o.active).cloned().collect()
    }

    /// 获取对象数量
    #[wasm_bindgen]
    pub fn objectCount(&self) -> usize {
        self.objects.len()
    }
}

// ============ 简单的碰撞检测 ============

#[wasm_bindgen]
pub struct CollisionSystem;

#[wasm_bindgen]
impl CollisionSystem {
    /// AABB 碰撞检测（轴对齐边界框）
    #[wasm_bindgen]
    pub fn checkAABB(a: &GameObject, b: &GameObject) -> bool {
        // 两个矩形在 X 轴重叠
        let xOverlap = a.getX() < b.getX() + b.getWidth() &&
                       a.getX() + a.getWidth() > b.getX();

        // 两个矩形在 Y 轴重叠
        let yOverlap = a.getY() < b.getY() + b.getHeight() &&
                       a.getY() + a.getHeight() > b.getY();

        xOverlap && yOverlap
    }

    /// 检测世界中的所有碰撞
    #[wasm_bindgen]
    pub fn detectCollisions(world: &GameWorld) -> Vec<(usize, usize)> {
        let objects = world.getActiveObjects();
        let mut collisions = Vec::new();

        for i in 0..objects.len() {
            for j in (i + 1)..objects.len() {
                if Self::checkAABB(&objects[i], &objects[j]) {
                    collisions.push((i, j));
                }
            }
        }

        collisions
    }
}
```

### 5.3 JavaScript 端渲染

```javascript
// 游戏主循环
class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;

        // 初始化 WASM 游戏世界
        this.initWasm();
    }

    async initWasm() {
        // 加载 WASM 模块
        const wasm = await import('./pkg/my_game_engine');

        // 创建游戏世界 (800x600)
        this.world = new wasm.GameWorld(800, 600);

        // 添加玩家
        this.player = new wasm.GameObject(100, 100, 32, 32, 'player');

        // 添加敌人
        for (let i = 0; i < 5; i++) {
            const enemy = new wasm.GameObject(
                200 + i * 100, 50, 32, 32, 'enemy'
            );
            enemy.setVelocity(50, 0); // 向右移动
            this.world.addObject(enemy);
        }

        // 启动游戏循环
        this.start();
    }

    start() {
        // 设置输入监听
        this.setupInput();

        // 开始循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            // 玩家控制
            if (e.key === 'ArrowLeft') {
                this.player.setVelocity(-200, this.player.velocity.y);
            } else if (e.key === 'ArrowRight') {
                this.player.setVelocity(200, this.player.velocity.y);
            } else if (e.key === ' ' || e.key === 'ArrowUp') {
                // 跳跃
                this.player.setVelocity(this.player.velocity.x, -500);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.player.setVelocity(0, this.player.velocity.y);
            }
        });
    }

    gameLoop(currentTime) {
        // 计算 delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // FPS 控制
        if (deltaTime >= this.frameInterval) {
            // 更新 WASM 游戏世界
            const dt = deltaTime / 1000; // 转换为秒
            this.world.update(dt);

            // 碰撞检测
            const collisions = wasm.CollisionSystem.detectCollisions(this.world);
            this.handleCollisions(collisions);

            // 渲染
            this.render();

            // 更新 lastTime 以保持帧率稳定
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
        }

        // 下一帧
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    render() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 获取所有活跃对象
        const objects = this.world.getActiveObjects();

        // 绘制每个对象
        for (const obj of objects) {
            const tag = obj.getTag();
            const x = obj.getX();
            const y = obj.getY();
            const w = obj.getWidth();
            const h = obj.getHeight();

            // 根据标签设置颜色
            if (tag === 'player') {
                this.ctx.fillStyle = '#00d4ff'; // 青色
            } else if (tag === 'enemy') {
                this.ctx.fillStyle = '#ff4757'; // 红色
            } else if (tag === 'bullet') {
                this.ctx.fillStyle = '#ffd700'; // 金色
            } else {
                this.ctx.fillStyle = '#ffffff';
            }

            // 绘制矩形
            this.ctx.fillRect(x, y, w, h);
        }

        // 显示 FPS
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.frameInterval)}`, 10, 20);
        this.ctx.fillText(`对象数: ${this.world.objectCount()}`, 10, 40);
    }

    handleCollisions(collisions) {
        for (const [i, j] of collisions) {
            console.log(`碰撞: ${i} vs ${j}`);
            // 处理碰撞逻辑...
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
```

## 六、WebAssembly 实战项目：图片处理工具

### 6.1 项目需求

创建一个 Web 图片处理工具，支持：
- 图片滤镜（灰度、模糊、锐化、边缘检测）
- 图片缩放
- 格式转换

### 6.2 Rust 核心代码

```rust
use wasm_bindgen::prelude::*;
use std::iter::Sum;

/// 图像滤镜处理
#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    data: Vec<u8>, // RGBA 格式
}

#[wasm_bindgen]
impl ImageProcessor {
    /// 从 JavaScript 的 ImageData 创建处理器
    #[wasm_bindgen]
    pub fn new(width: u32, height: u32, data: Vec<u8>) -> Self {
        ImageProcessor {
            width,
            height,
            data,
        }
    }

    /// 获取处理后的数据（返回给 JS）
    #[wasm_bindgen]
    pub fn getData(&self) -> Vec<u8> {
        self.data.clone()
    }

    // ============ 滤镜处理 ============

    /// 灰度滤镜
    #[wasm_bindgen]
    pub fn grayscale(&mut self) {
        for pixel in self.data.chunks_mut(4) {
            // 使用 luminance 公式：0.299*R + 0.587*G + 0.114*B
            let gray = (0.299 * pixel[0] as f32 +
                       0.587 * pixel[1] as f32 +
                       0.114 * pixel[2] as f32) as u8;

            pixel[0] = gray;
            pixel[1] = gray;
            pixel[2] = gray;
            // pixel[3] (Alpha) 保持不变
        }
    }

    /// 反转颜色
    #[wasm_bindgen]
    pub fn invert(&mut self) {
        for pixel in self.data.chunks_mut(4) {
            pixel[0] = 255 - pixel[0];
            pixel[1] = 255 - pixel[1];
            pixel[2] = 255 - pixel[2];
        }
    }

    /// 模糊滤镜（简单box blur）
    #[wasm_bindgen]
    pub fn blur(&mut self, radius: u32) {
        // 创建输出缓冲区
        let mut output = self.data.clone();

        let radius = radius as i32;
        let w = self.width as i32;
        let h = self.height as i32;

        for y in 0..h {
            for x in 0..w {
                let mut r_sum = 0i32;
                let mut g_sum = 0i32;
                let mut b_sum = 0i32;
                let mut count = 0i32;

                // 遍历核半径内的像素
                for dy in -radius..=radius {
                    for dx in -radius..=radius {
                        let nx = x + dx;
                        let ny = y + dy;

                        if nx >= 0 && nx < w && ny >= 0 && ny < h {
                            let idx = ((ny * w + nx) * 4) as usize;
                            r_sum += self.data[idx] as i32;
                            g_sum += self.data[idx + 1] as i32;
                            b_sum += self.data[idx + 2] as i32;
                            count += 1;
                        }
                    }
                }

                let idx = ((y * w + x) * 4) as usize;
                output[idx] = (r_sum / count) as u8;
                output[idx + 1] = (g_sum / count) as u8;
                output[idx + 2] = (b_sum / count) as u8;
            }
        }

        self.data = output;
    }

    /// 锐化滤镜
    #[wasm_bindgen]
    pub fn sharpen(&mut self) {
        // 锐化核
        let kernel: [[i32; 3]; 3] = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ];

        self.applyConvolution(&kernel);
    }

    /// 边缘检测（Sobel算子）
    #[wasm_bindgen]
    pub fn edgeDetection(&mut self) {
        // 先转灰度
        self.grayscale();

        // Sobel X 核
        let sobel_x: [[i32; 3]; 3] = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1],
        ];

        // Sobel Y 核
        let sobel_y: [[i32; 3]; 3] = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1],
        ];

        let w = self.width as i32;
        let h = self.height as i32;
        let mut output = self.data.clone();

        for y in 1..h - 1 {
            for x in 1..w - 1 {
                let mut gx = 0i32;
                let mut gy = 0i32;

                // 应用 Sobel 核
                for ky in 0..3 {
                    for kx in 0..3 {
                        let px = x + kx - 1;
                        let py = y + ky - 1;
                        let idx = ((py * w + px) * 4) as usize;
                        let intensity = self.data[idx] as i32;

                        gx += intensity * sobel_x[ky as usize][kx as usize];
                        gy += intensity * sobel_y[ky as usize][kx as usize];
                    }
                }

                // 梯度幅度
                let magnitude = ((gx * gx + gy * gy) as f64).sqrt().min(255.0) as u8;

                let idx = ((y * w + x) * 4) as usize;
                output[idx] = magnitude;
                output[idx + 1] = magnitude;
                output[idx + 2] = magnitude;
            }
        }

        self.data = output;
    }

    /// 亮度调整
    #[wasm_bindgen]
    pub fn adjustBrightness(&mut self, amount: i32) {
        for pixel in self.data.chunks_mut(4) {
            pixel[0] = (pixel[0] as i32 + amount).clamp(0, 255) as u8;
            pixel[1] = (pixel[1] as i32 + amount).clamp(0, 255) as u8;
            pixel[2] = (pixel[2] as i32 + amount).clamp(0, 255) as u8;
        }
    }

    /// 对比度调整
    #[wasm_bindgen]
    pub fn adjustContrast(&mut self, factor: f32) {
        for pixel in self.data.chunks_mut(4) {
            pixel[0] = Self::contrastPixel(pixel[0], factor);
            pixel[1] = Self::contrastPixel(pixel[1], factor);
            pixel[2] = Self::contrastPixel(pixel[2], factor);
        }
    }

    /// 辅助函数：单像素对比度计算
    fn contrastPixel(value: u8, factor: f32) -> u8 {
        let value = value as f32 / 255.0;
        let adjusted = (value - 0.5) * factor + 0.5;
        (adjusted.clamp(0.0, 1.0) * 255.0) as u8
    }

    // ============ 图像变换 ============

    /// 缩放图像（近邻插值）
    #[wasm_bindgen]
    pub fn resize(&mut self, newWidth: u32, newHeight: u32) {
        let mut newData = vec![0u8; (newWidth * newHeight * 4) as usize];

        let xRatio = self.width as f32 / newWidth as f32;
        let yRatio = self.height as f32 / newHeight as f32;

        for y in 0..newHeight {
            for x in 0..newWidth {
                // 计算源坐标
                let srcX = (x as f32 * xRatio) as u32;
                let srcY = (y as f32 * yRatio) as u32;

                // 复制像素
                let srcIdx = ((srcY * self.width + srcX) * 4) as usize;
                let dstIdx = ((y * newWidth + x) * 4) as usize;

                newData[dstIdx] = self.data[srcIdx];
                newData[dstIdx + 1] = self.data[srcIdx + 1];
                newData[dstIdx + 2] = self.data[srcIdx + 2];
                newData[dstIdx + 3] = self.data[srcIdx + 3];
            }
        }

        self.width = newWidth;
        self.height = newHeight;
        self.data = newData;
    }

    // ============ 辅助方法 ============

    /// 卷积操作（通用）
    fn applyConvolution(&mut self, kernel: &[[i32; 3]; 3]) {
        let w = self.width as i32;
        let h = self.height as i32;
        let mut output = self.data.clone();

        let kernel_sum: i32 = kernel.iter()
            .flat_map(|row| row.iter())
            .sum();

        for y in 1..h - 1 {
            for x in 1..w - 1 {
                let mut r_sum = 0i32;
                let mut g_sum = 0i32;
                let mut b_sum = 0i32;

                for ky in 0..3 {
                    for kx in 0..3 {
                        let px = x + kx - 1;
                        let py = y + ky - 1;
                        let idx = ((py * w + px) * 4) as usize;
                        let weight = kernel[ky as usize][kx as usize];

                        r_sum += self.data[idx] as i32 * weight;
                        g_sum += self.data[idx + 1] as i32 * weight;
                        b_sum += self.data[idx + 2] as i32 * weight;
                    }
                }

                let sum = if kernel_sum != 0 { kernel_sum } else { 1 };

                let idx = ((y * w + x) * 4) as usize;
                output[idx] = (r_sum / sum).clamp(0, 255) as u8;
                output[idx + 1] = (g_sum / sum).clamp(0, 255) as u8;
                output[idx + 2] = (b_sum / sum).clamp(0, 255) as u8;
            }
        }

        self.data = output;
    }

    /// 获取图像尺寸
    #[wasm_bindgen]
    pub fn getWidth(&self) -> u32 { self.width }
    #[wasm_bindgen]
    pub fn getHeight(&self) -> u32 { self.height }
}
```

### 6.3 JavaScript UI

```javascript
// 图片处理工具主类
class ImageProcessorApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fileInput = document.getElementById('fileInput');
        this.processor = null; // WASM 处理器实例

        this.initWasm();
        this.bindEvents();
    }

    async initWasm() {
        try {
            // 加载 WASM 模块
            const wasm = await import('./pkg/image_processor');
            this.wasm = wasm;
            console.log('WASM 模块加载成功');
        } catch (e) {
            console.error('WASM 加载失败:', e);
            alert('WebAssembly 加载失败，请刷新页面重试');
        }
    }

    bindEvents() {
        // 文件选择
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImage(file);
            }
        });

        // 滤镜按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.applyFilter(filter);
            });
        });

        // 亮度/对比度滑块
        document.getElementById('brightness').addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value;
        });

        document.getElementById('contrast').addEventListener('input', (e) => {
            document.getElementById('contrastValue').textContent = e.target.value;
        });

        // 应用调整
        document.getElementById('applyAdjust').addEventListener('click', () => {
            const brightness = parseInt(document.getElementById('brightness').value);
            const contrast = parseFloat(document.getElementById('contrast').value);
            this.applyAdjustments(brightness, contrast);
        });

        // 下载
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadResult();
        });
    }

    loadImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // 设置 canvas 尺寸
                this.canvas.width = img.width;
                this.canvas.height = img.height;

                // 绘制图片
                this.ctx.drawImage(img, 0, 0);

                // 获取像素数据
                const imageData = this.ctx.getImageData(
                    0, 0, img.width, img.height
                );

                // 传递给 WASM 处理
                this.processor = new this.wasm.ImageProcessor(
                    img.width,
                    img.height,
                    Array.from(imageData.data)
                );

                console.log(`图片加载成功: ${img.width}x${img.height}`);
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    applyFilter(filterName) {
        if (!this.processor) {
            alert('请先加载图片');
            return;
        }

        console.log(`应用滤镜: ${filterName}`);
        const startTime = performance.now();

        // 根据滤镜名称调用对应的 WASM 函数
        switch (filterName) {
            case 'grayscale':
                this.processor.grayscale();
                break;
            case 'invert':
                this.processor.invert();
                break;
            case 'blur':
                this.processor.blur(5); // 模糊半径 5
                break;
            case 'sharpen':
                this.processor.sharpen();
                break;
            case 'edge':
                this.processor.edgeDetection();
                break;
            default:
                console.warn('未知滤镜:', filterName);
                return;
        }

        const elapsed = performance.now() - startTime;
        console.log(`滤镜处理耗时: ${elapsed.toFixed(2)} ms`);

        // 更新显示
        this.renderResult();
    }

    applyAdjustments(brightness, contrast) {
        if (!this.processor) {
            alert('请先加载图片');
            return;
        }

        const startTime = performance.now();

        // 亮度调整
        this.processor.adjustBrightness(brightness);

        // 对比度调整（factor = 1 + contrast/100）
        this.processor.adjustContrast(1 + contrast / 100);

        const elapsed = performance.now() - startTime;
        console.log(`调整处理耗时: ${elapsed.toFixed(2)} ms`);

        this.renderResult();
    }

    renderResult() {
        // 获取处理后的数据
        const data = this.processor.getData();

        // 创建 ImageData
        const imageData = new ImageData(
            new Uint8ClampedArray(data),
            this.processor.getWidth(),
            this.processor.getHeight()
        );

        // 绘制到 canvas
        this.ctx.putImageData(imageData, 0, 0);
    }

    downloadResult() {
        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'processed-image.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new ImageProcessorApp();
});
```

## 七、最佳实践与常见问题

### 7.1 最佳实践

1. **何时使用 WASM**
   - 计算密集型任务（图像处理、加密、游戏物理）
   - 需要高性能渲染（3D、CAD）
   - 复用现有的 C/C++/Rust 库

2. **性能优化**
   - 批量处理数据，减少 JS-WASM 调用次数
   - 使用 TypedArray 传递大数据
   - 启用编译器的优化选项

3. **内存管理**
   - 及时释放不再使用的 WASM 内存
   - 避免频繁的小内存分配
   - 使用内存池模式

4. **错误处理**
   - WASM 中的错误应该返回给 JS 处理
   - 使用 Result 类型进行错误传播
   - 在 JS 端做好错误捕获

### 7.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| WASM 函数调用很慢 | 调用开销大 | 批量调用，减少函数调用次数 |
| 内存持续增长 | 内存泄漏 | 检查内存分配，确保释放 |
| 某些浏览器不支持 | 浏览器兼容性问题 | 使用 WebAssembly.instantiate 的 polyfill |
| 调试困难 | 缺少源码映射 | 使用 source map 调试 Rust 代码 |

### 7.3 浏览器支持情况

| 特性 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| WebAssembly | 57+ | 52+ | 11+ | 16+ |
| WASM SIMD | 91+ | 89+ | 15.2+ | 91+ |
| Threads | 92+ | 79+ | 15.2+ | 92+ |
| 垃圾回收 | 79+ | 79+ | 15.2+ | 79+ |

## 八、总结

WebAssembly 并不是要取代 JavaScript，而是 JavaScript 的有力补充。它们的关系可以这样理解：

- **JavaScript** 是万能工具，适合快速开发、业务逻辑、DOM 操作
- **WebAssembly** 是精密仪器，适合高性能计算、图形处理、系统编程

两者配合使用，才能构建出真正强大的 Web 应用。

### 学习路线建议

```
第一阶段：入门
├── 了解 WASM 基本概念
├── 学会使用 Emscripten 编译 C 代码
└── 从简单示例开始

第二阶段：进阶
├── 学习 Rust + wasm-bindgen
├── 理解内存模型和调用约定
└── 实现实际的图像/音频处理

第三阶段：精通
├── 深入 SIMD 和多线程
├── 游戏引擎开发
└── 性能优化技巧
```

### 推荐资源

- [MDN WebAssembly 文档](https://developer.mozilla.org/zh-CN/docs/WebAssembly)
- [Rust WASM 官方文档](https://rustwasm.github.io/docs/)
- [The Wasm Book](https://www.newline.co/wasm-book) - Rust 和 WASM 实战

---

> 记住：WebAssembly 是一个强大的工具，但不要为了用它而用它。只有当 JavaScript 无法满足性能需求时，才考虑使用 WASM。
