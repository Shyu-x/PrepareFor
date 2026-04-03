# WebGPU下一代图形标准

## 开篇：为什么我们需要WebGPU？

各位前端小伙伴们好！今天我们来聊一个非常前沿的话题——WebGPU。

在开始之前，让我问你一个问题：如果你现在要开发一个需要大量计算的3D应用，比如实时光线追踪、大规模粒子模拟、或者机器学习推理，你会发现WebGL有点力不从心。

这就像是：你想建一栋摩天大楼，但WebGL只给了你一些简单的工具。虽然理论上你可以用这些工具堆出摩天大楼，但效率和难度都是噩梦级别的。

WebGPU就是来解决这个问题的。它是新一代的Web图形API，提供了更现代、更强大的GPU访问能力。

让我用一个生活化的比喻来解释：
- WebGL就像是一辆小轿车，能带你从A点到B点，但速度有限
- WebGPU就像是一辆F1赛车，同样都是"车"，但性能差距是数量级的

## 一、WebGPU是什么？

### 1.1 历史背景

WebGPU的诞生有其深刻的历史原因。让我来介绍一下：

**WebGL的辉煌与局限**

WebGL基于OpenGL ES，在2010年代初期，它是Web图形的绝对王者。无论是3D游戏、数据可视化还是WebAR/WebVR，WebGL都是底层支撑。

但是，WebGL的设计太过老旧了。它基于OpenGL ES 2.0，那是一个2007年发布的API，距今已经快20年了！GPU技术在这20年里发生了翻天覆地的变化，但WebGL却没有跟上时代的步伐。

**Metal、Vulkan、DirectX 12的崛起**

与此同时，桌面和移动图形API在飞速进化：
- Apple推出了Metal（2014年）
- Khronos Group推出了Vulkan（2016年）
- Microsoft推出了DirectX 12（2015年）

这些新API都针对现代GPU架构进行了优化，提供了更低的开销、更强的功能和更好的性能。

**WebGPU的诞生**

WebGPU就是"GPU版本的Web标准"。它由W3C的GPU for the Web社区组开发，目标是提供一个跨平台的、现代的GPU API，让Web开发者能够充分利用GPU的能力。

```javascript
// WebGPU vs WebGL对比

// WebGL（基于OpenGL ES）
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');
// 着色器使用GLSL ES（一种特殊的GLSL变体）
const vertexShader = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

// WebGPU（现代化的设计）
const canvas = document.getElementById('canvas');
const context = await navigator.gpu.requestAdapter();
// 着色器使用WGSL（WebGPU Shading Language，Rust风格）
const shaderCode = `
  @vertex
  fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 3>(
      vec2<f32>(0.0, 0.5),
      vec2<f32>(-0.5, -0.5),
      vec2<f32>(0.5, -0.5)
    );
    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  }
`;
```

### 1.2 WebGPU的设计理念

WebGPU的设计有几个核心理念，这些也是它与WebGL最大的区别：

**1. 显式控制（Explicit Control）**

WebGL做了很多"自动优化"，比如自动管理资源、自动同步状态。这虽然简化了编程，但也带来了性能开销和不确定性。

WebGPU采用"显式控制"模式：开发者需要明确告诉GPU要做什么，包括：
- 显式创建和管理资源
- 显式同步和屏障（Barriers）
- 显式编码命令

```javascript
// WebGPU的显式控制示例

// 1. 显式创建Buffer
const buffer = device.createBuffer({
  size: 1024,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// 2. 显式提交命令
commandEncoder.copyBufferToBuffer(
  stagingBuffer /* 源 */,
  0 /* 源偏移 */,
  buffer /* 目标 */,
  0 /* 目标偏移 */,
  256 /* 大小 */
);

// 3. 显式提交队列
device.queue.submit([commandEncoder.finish()]);
```

**2. 统一内存架构（Unified Memory）**

在某些平台上，WebGPU支持CPU和GPU共享内存。这意味着数据不需要在CPU和GPU之间来回拷贝，大大减少了数据传输开销。

```javascript
// WebGPU可以创建可映射的Buffer
const buffer = device.createBuffer({
  size: 1024,
  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
});

// 显式映射Buffer到CPU内存
await buffer.mapAsync(GPUMapMode.READ);
const data = buffer.getMappedRange();

// 使用数据...
// 然后取消映射
buffer.unmap();
```

**3. 计算着色器（Compute Shaders）**

这是WebGPU最革命性的功能之一！计算着色器允许开发者直接使用GPU进行通用计算，而不仅仅是图形渲染。

```javascript
// 计算着色器 - 用于非图形计算的着色器
const computeShader = `
  @group(0) @binding(0) var<storage, read_write> data: array<f32>;

  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index < 1000u) {
      data[index] = data[index] * 2.0;  // 简单示例：每个元素翻倍
    }
  }
`;
```

## 二、WebGPU vs WebGL：核心差异

### 2.1 架构对比

```
WebGL架构（隐式渲染）：
┌─────────────────────────────────────────────┐
│                 JavaScript                   │
├─────────────────────────────────────────────┤
│                  WebGL                       │
│  ┌─────────────────────────────────────────┐│
│  │         隐式渲染状态机                    ││
│  │  - 状态绑定                               ││
│  │  - 目标绑定                               ││
│  │  - 自动同步                               ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│                   GPU                        │
└─────────────────────────────────────────────┘

WebGPU架构（显式渲染）：
┌─────────────────────────────────────────────┐
│                 JavaScript                   │
├─────────────────────────────────────────────┤
│               WebGPU API                     │
│  ┌──────────────┬──────────────┬────────────┐ │
│  │   Device     │   Queue      │  Commands  │ │
│  │  (资源管理)   │  (命令提交)   │  (编码器)   │ │
│  └──────────────┴──────────────┴────────────┘ │
├─────────────────────────────────────────────┤
│                   GPU                        │
└─────────────────────────────────────────────┘
```

### 2.2 API对比

让我详细对比一下两者的API设计：

```javascript
// ==================== WebGL ====================

// 创建上下文
const gl = canvas.getContext('webgl');

// 创建着色器程序
function createProgram(gl, vsSource, fsSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vsSource);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fsSource);
  gl.compileShader(fs);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  return program;
}

// 使用程序
gl.useProgram(program);

// 设置uniform
const uLocation = gl.getUniformLocation(program, 'uColor');
gl.uniform4f(uLocation, 1.0, 0.0, 0.0, 1.0);

// 绑定缓冲区
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

// 设置顶点属性
const aPosition = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

// 绘制
gl.drawArrays(gl.TRIANGLES, 0, vertexCount);


// ==================== WebGPU ====================

// 请求Adapter和Device
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// 创建Shader Module
const shaderModule = device.createShaderModule({
  code: shaderCode,
});

// 创建渲染管线
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: shaderModule,
    entryPoint: 'main',
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'main',
    targets: [{
      format: navigator.gpu.getPreferredCanvasFormat(),
    }],
  },
  primitive: {
    topology: 'triangle-list',
  },
});

// 创建Buffer
const vertexBuffer = device.createBuffer({
  size: vertexData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// 写入数据
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

// 创建命令编码器
const commandEncoder = device.createCommandEncoder();
const passEncoder = commandEncoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    loadOp: 'clear',
    storeOp: 'store',
  }],
});

// 设置渲染管线
passEncoder.setPipeline(pipeline);

// 设置顶点缓冲区
passEncoder.setVertexBuffer(0, vertexBuffer);

// 绘制
passEncoder.draw(3);

// 结束渲染通道
passEncoder.end();

// 提交命令
device.queue.submit([commandEncoder.finish()]);
```

### 2.3 性能对比

WebGPU相比WebGL的性能提升主要来自以下几个方面：

```
性能提升来源：

1. 减少API开销
   WebGL: 每帧数百次API调用
   WebGPU: 批量提交，减少调用次数

2. 更低的CPU开销
   WebGL: 状态机需要大量检查和验证
   WebGPU: 显式设计，验证在创建时完成

3. 更好的并行性
   WebGL: 命令串行执行
   WebGPU: 支持多个命令编码器并行工作

4. 计算着色器
   WebGL: 只能做图形渲染
   WebGPU: 可以用GPU做通用计算

5. 统一内存（部分平台）
   WebGL: CPU和GPU内存需要拷贝
   WebGPU: 某些平台支持共享内存
```

## 三、WGSL：WebGPU的着色语言

### 3.1 WGSL简介

WGSL（WebGPU Shading Language）是WebGPU专用的着色器语言。它的设计灵感来自Rust和SPIR-V，注重安全性和可读性。

WGSL vs GLSL（WebGL使用的着色语言）:

```glsl
// GLSL (WebGL)
attribute vec3 position;
uniform mat4 modelViewProjection;
varying vec3 vColor;

void main() {
  gl_Position = modelViewProjection * vec4(position, 1.0);
  vColor = position * 0.5 + 0.5;
}
```

```wgsl
// WGSL (WebGPU)
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
}

@vertex
fn main(
  @location(0) position: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 1.0);
  output.color = position * 0.5 + 0.5;
  return output;
}
```

### 3.2 WGSL基础语法

```wgsl
// ============ 变量声明 ============

// 类型推断
var x = 5;              // i32
var y = 5.0;            // f32
var z = true;           // bool

// 显式类型
var count: i32 = 10;
var scale: f32 = 2.5;
var flag: bool = true;

// 常量（编译时确定）
const PI: f32 = 3.14159;
const WORLD_SIZE = 100;

// ============ 数据类型 ============

// 标量类型
var int: i32 = 42;
var uint: u32 = 42u;
var float: f32 = 3.14;
var boolean: bool = true;

// 向量类型（最多4个元素）
var vec2i: vec2<i32> = vec2<i32>(1, 2);
var vec3f: vec3<f32> = vec3<f32>(1.0, 2.0, 3.0);
var vec4b: vec4<bool> = vec4<bool>(true, false, true, false);

// 矩阵类型
var mat2f: mat2x2<f32> = mat2x2<f32>(1.0, 0.0, 0.0, 1.0);
var mat4f: mat4x4<f32> = mat4x4<f32>(
  1.0, 0.0, 0.0, 0.0,  // 第一列
  0.0, 1.0, 0.0, 0.0,  // 第二列
  0.0, 0.0, 1.0, 0.0,  // 第三列
  0.0, 0.0, 0.0, 1.0   // 第四列
);

// ============ 函数 ============

fn add(a: i32, b: i32) -> i32 {
  return a + b;
}

// 函数重载（不同参数类型）
fn add(a: f32, b: f32) -> f32 {
  return a + b;
}

// ============ 控制流 ============

fn fibonacci(n: i32) -> i32 {
  if (n <= 0) {
    return 0;
  } else if (n == 1) {
    return 1;
  } else {
    var a = 0;
    var b = 1;
    var result = 0;
    for (var i = 2; i <= n; i = i + 1) {
      result = a + b;
      a = b;
      b = result;
    }
    return result;
  }
}

// ============ 数组和结构 ============

// 数组
var scores: array<f32, 10> = array<f32, 10>();
var dynamic: array<f32> = array<f32>(1.0, 2.0, 3.0);

// 结构体
struct Vertex {
  position: vec3<f32>;
  color: vec3<f32>;
};

struct Uniforms {
  modelViewProjection: mat4x4<f32>;
  time: f32;
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;
```

### 3.3 WGSL的装饰器（Attributes）

WGSL使用装饰器来标记各种语义，这与GLSL的关键字方式有所不同：

```wgsl
// ============ 顶点着色器装饰器 ============

@vertex           // 标记这是顶点着色器函数
fn main(
  @location(0) position: vec3<f32>,    // 输入：顶点位置（location 0）
  @location(1) normal: vec3<f32>,       // 输入：法线（location 1）
  @location(2) uv: vec2<f32>,           // 输入：UV坐标（location 2）
  @builtin(vertex_index) vi: u32,       // 内置：顶点索引
  @builtin(instance_index) ii: u32,     // 内置：实例索引
) -> @builtin(position) vec4<f32> {    // 输出：裁剪空间位置
  return vec4<f32>(position, 1.0);
}

// ============ 片段着色器装饰器 ============

@fragment          // 标记这是片段着色器函数
fn main(
  @location(0) color: vec4<f32>,        // 输入：插值后的颜色
  @builtin(frag_coord) fc: vec4<f32>,   // 内置：像素坐标
  @builtin(front_facing) ff: bool,      // 内置：是否正面
) -> @location(0) vec4<f32> {          // 输出：颜色到location 0
  return color;
}

// ============ 计算着色器装饰器 ============

@compute           // 标记这是计算着色器
@workgroup_size(64)  // 设置workgroup大小为64
fn main(
  @builtin(global_invocation_id) gid: vec3<u32>,  // 全局调用ID
  @builtin(local_invocation_id) lid: vec3<u32>,    // 本地调用ID
  @builtin(num_workgroups) nwg: vec3<u32>,         // workgroup数量
) {
  let index = gid.x;
  // 计算逻辑...
}

// ============ 资源和绑定装饰器 ============

@group(0) @binding(0) var<uniform> uniforms: Uniforms;     // uniform buffer
@group(0) @binding(1) var<storage, read> data: Buffer;      // 只读storage buffer
@group(0) @binding(2) var<storage, read_write> output: Buffer;  // 可读写storage buffer
@group(0) @binding(3) var texture: texture_2d<f32>;          // 纹理
@group(0) @binding(4) var sampler: sampler;                 // 采样器
```

### 3.4 WGSL内置函数

WGSL提供了丰富的内置函数：

```wgsl
// ============ 数值函数 ============

abs(x)           // 绝对值
ceil(x)          // 向上取整
floor(x)         // 向下取整
round(x)         // 四舍五入
trunc(x)         // 取整数部分
fract(x)         // 取小数部分

min(a, b)        // 最小值
max(a, b)        // 最大值
clamp(x, min, max)  // 限制在[min, max]

sign(x)          // 符号（-1, 0, 1）
degrees(x)       // 弧度转角度
radians(x)       // 角度转弧度

sqrt(x)          // 平方根
inversesqrt(x)   // 平方根倒数
pow(base, exp)    // 指数

// ============ 三角函数 ============

sin(x)           // 正弦
cos(x)           // 余弦
tan(x)           // 正切
asin(x)          // 反正弦
acos(x)          // 反余弦
atan(x)          // 反正切
atan2(y, x)      // 二参数反正切

// ============ 向量和矩阵函数 ============

dot(a, b)        // 点积
cross(a, b)      // 叉积
length(x)        // 向量长度
normalize(x)     // 归一化
distance(a, b)    // 两点距离
faceforward(n, i, ng)  // 面朝方向
reflect(v, n)    // 反射
refract(v, n, eta)  // 折射

// ============ 纹理函数 ============

textureSample(t, s, coords)           // 采样纹理
textureSampleLevel(t, s, coords, level)  // 指定MIP级别采样
textureLoad(t, coords, level)         // 直接加载纹理像素
textureDimensions(t, level)          // 获取纹理尺寸
textureNumLevels(t)                   // 获取MIP级别数量

// ============ 比较函数 ============

select(consequent, antecedent, condition)
// 如果condition为true，返回consequent，否则返回antecedent
// 类似于 condition ? consequent : antecedent
```

## 四、WebGPU渲染管线

### 4.1 渲染管线架构

WebGPU的渲染管线比WebGL更加显式和灵活：

```
WebGPU渲染管线：

┌─────────────────────────────────────────────────────────────┐
│                    GPUDevice                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  RenderPipeline                           │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │ │
│  │  │  Vertex     │───→│  Rasterizer │───→│   Fragment   │  │ │
│  │  │  Shader     │    │             │    │   Shader     │  │ │
│  │  └─────────────┘    └─────────────┘    └──────────────┘  │ │
│  │        ↑                                       ↓        │ │
│  │        │                               ┌──────────────┐  │ │
│  │        └───────────────────────────────│   Outputs    │  │ │
│  │                                        └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              ↑                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   PipelineLayout                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │  BindGroup0 │ │ BindGroup1  │ │ BindGroup2  │       │ │
│  │  │  @group(0)  │ │  @group(1)   │ │  @group(2)  │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    GPUCommands                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  CommandEncoder                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │ setPipeline │ │setVertexBuffer│ setBindGroup │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  │  ┌─────────────┐ ┌─────────────┐                       │ │
│  │  │ draw/drawIndexed │ end() │                       │ │
│  │  └─────────────┘ └─────────────┘                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 创建完整的渲染管线

让我展示一个完整的WebGPU渲染程序：

```javascript
// 完整的WebGPU渲染程序

async function initWebGPU() {
  // 1. 获取GPU适配器
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',  // 请求高性能GPU
  });

  if (!adapter) {
    throw new Error('WebGPU不可用');
  }

  // 2. 获取GPU设备
  const device = await adapter.requestDevice({
    requiredLimits: {},  // 可以指定特定的资源限制
  });

  // 3. 获取Canvas和Context
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();

  // 4. 配置Canvas
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
  });

  // 5. 编写着色器代码（WGSL）
  const shaderCode = `
    // 顶点着色器
    @vertex
    fn vertexMain(
      @location(0) position: vec3<f32>,
      @location(1) color: vec3<f32>,
    ) -> @builtin(position) vec4<f32> {
      return vec4<f32>(position, 1.0);
    }

    // 片段着色器
    @fragment
    fn fragmentMain(
      @location(0) color: vec3<f32>,
    ) -> @location(0) vec4<f32> {
      return vec4<f32>(color, 1.0);
    }
  `;

  // 6. 创建Shader Module
  const shaderModule = device.createShaderModule({
    code: shaderCode,
    label: 'main shader',
  });

  // 7. 创建渲染管线
  const pipeline = device.createRenderPipeline({
    layout: 'auto',  // 让WebGPU自动生成布局
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        {
          arrayStride: 6 * 4,  // 每个顶点6个float（位置3个+颜色3个）
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },   // position
            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' }, // color
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',  // 三角形图元
      cullMode: 'back',            // 背面剔除
    },
  });

  // 8. 准备顶点数据
  const vertices = new Float32Array([
    // position (x, y, z),    color (r, g, b)
     0.0,  0.5, 0.0,   1.0, 0.0, 0.0,  // 顶点1：红
    -0.5, -0.5, 0.0,   0.0, 1.0, 0.0,  // 顶点2：绿
     0.5, -0.5, 0.0,   0.0, 0.0, 1.0,  // 顶点3：蓝
  ]);

  // 9. 创建顶点Buffer
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // 10. 写入数据
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // 11. 创建命令编码器
  const commandEncoder = device.createCommandEncoder();

  // 12. 开始渲染通道
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },  // 清除颜色
      loadOp: 'clear',   // 加载操作：清除
      storeOp: 'store',  // 存储操作：保存
    }],
  });

  // 13. 设置渲染管线
  passEncoder.setPipeline(pipeline);

  // 14. 设置顶点缓冲区
  passEncoder.setVertexBuffer(0, vertexBuffer);

  // 15. 绘制
  passEncoder.draw(3);  // 3个顶点

  // 16. 结束渲染通道
  passEncoder.end();

  // 17. 提交命令
  const commands = commandEncoder.finish();
  device.queue.submit([commands]);

  // 18. 渲染循环
  function render() {
    // 在实际应用中，这里应该用requestAnimationFrame
    // 并处理Uniforms、纹理等动态数据
    requestAnimationFrame(render);
  }

  // 开始渲染
  requestAnimationFrame(render);
}
```

## 五、计算着色器：GPU通用计算

### 5.1 什么是计算着色器？

计算着色器（Compute Shader）是WebGPU最革命性的功能。它允许开发者直接使用GPU进行通用计算，而不仅仅是图形渲染。

```wgsl
// 简单的计算着色器示例：向量加法

@group(0) @binding(0) var<storage, read> inputA: array<f32>;
@group(0) @binding(1) var<storage, read> inputB: array<f32>;
@group(0) @binding(2) var<storage, read_write> output: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let index = gid.x;
  output[index] = inputA[index] + inputB[index];
}
```

### 5.2 计算着色器的实际应用

**应用1：粒子物理模拟**

```wgsl
// 粒子物理模拟计算着色器

struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  mass: f32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> simParams: SimulationParams;

struct SimulationParams {
  deltaTime: f32,
  gravity: f32,
  damping: f32,
};

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let index = gid.x;
  var p = particles[index];

  // 应用重力
  p.velocity.y = p.velocity.y - simParams.gravity * simParams.deltaTime;

  // 更新位置
  p.position = p.position + p.velocity * simParams.deltaTime;

  // 应用阻尼
  p.velocity = p.velocity * simParams.damping;

  // 地面碰撞
  if (p.position.y < 0.0) {
    p.position.y = 0.0;
    p.velocity.y = -p.velocity.y * 0.8;  // 反弹
  }

  // 写入结果
  particles[index] = p;
}
```

**应用2：图像处理**

```wgsl
// 卷积图像处理计算着色器

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> kernelSize: u32;

@compute @workgroup_size(16, 16)
fn main(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(texture_size) texSize: vec2<u32>
) {
  let coord = vec2<i32>(gid.xy);

  // 卷积核（边缘检测）
  var result = vec4<f32>(0.0);

  let kernel = array<vec3<f32>, 9>(
    vec3<f32>(-1.0, -1.0, -1.0),
    vec3<f32>( 0.0,  0.0,  0.0),
    vec3<f32>( 1.0,  1.0,  1.0),
  );

  // 应用卷积
  for (var ky = 0; ky < 3; ky = ky + 1) {
    for (var kx = 0; kx < 3; kx = kx + 1) {
      let offset = vec2<i32>(kx - 1, ky - 1);
      let sampleCoord = coord + offset;
      let c = textureLoad(inputTexture, sampleCoord, 0);
      let weight = kernel[ky * 3 + kx];
      result = result + vec4<f32>(weight.x, weight.y, weight.z, 0.0) * c;
    }
  }

  // 写入结果
  textureStore(outputTexture, coord, result);
}
```

### 5.3 JavaScript端的计算着色器调用

```javascript
// 在JavaScript中调用计算着色器

async function runComputeShader() {
  // 1. 准备输入数据
  const inputA = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const inputB = new Float32Array([8, 7, 6, 5, 4, 3, 2, 1]);
  const output = new Float32Array(8);

  // 2. 创建Buffer
  const bufferA = device.createBuffer({
    size: inputA.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const bufferB = device.createBuffer({
    size: inputB.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const bufferOutput = device.createBuffer({
    size: output.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  // 3. 写入输入数据
  device.queue.writeBuffer(bufferA, 0, inputA);
  device.queue.writeBuffer(bufferB, 0, inputB);

  // 4. 创建Bind Group
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: bufferA } },
      { binding: 1, resource: { buffer: bufferB } },
      { binding: 2, resource: { buffer: bufferOutput } },
    ],
  });

  // 5. 创建命令编码器
  const commandEncoder = device.createCommandEncoder();

  // 6. 开始计算通道
  const computePass = commandEncoder.beginComputePass();

  // 7. 设置管道和Bind Group
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, bindGroup);

  // 8. 分发计算
  // workgroup_size是64，所以dispatch的workgroups数量 = ceil(8 / 64) = 1
  computePass.dispatchWorkgroups(1);

  // 9. 结束计算
  computePass.end();

  // 10. 提交命令
  device.queue.submit([commandEncoder.finish()]);

  // 11. 读取结果（需要等待GPU完成）
  await device.queue.onSubmittedWorkDone();

  // 12. 映射输出Buffer并读取
  await bufferOutput.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(bufferOutput.getMappedRange());
  console.log('结果:', result);

  bufferOutput.unmap();
}
```

## 六、WebGPU与Three.js

### 6.1 Three.js的WebGPU渲染器

Three.js已经在实验性地支持WebGPU后端。你可以通过以下方式启用：

```javascript
import { WebGPURenderer } from 'three/addons/renderers/WebGPURenderer.js';
import { Scene } from 'three';
import { PerspectiveCamera } from 'three';

// 创建场景
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 创建WebGPU渲染器
const renderer = new WebGPURenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建几何体和材质
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  // 使用WebGPU渲染器渲染
  renderer.render(scene, camera);
}

animate();
```

### 6.2 R3F对WebGPU的支持

React Three Fiber也在逐步支持WebGPU后端：

```tsx
import { Canvas } from '@react-three/fiber';
import { WebGPUenderer } from '@react-three/drei';

// 使用WebGPU作为后端
function App() {
  return (
    <Canvas
      renderer={(canvas) => new WebGPUenderer({ canvas })}
    >
      <Scene />
    </Canvas>
  );
}
```

## 七、WebGPU的现状和未来

### 7.1 浏览器支持情况

截至2024年，WebGPU的支持情况如下：

```
WebGPU支持进度：

Chrome/Edge: ✅ 已支持（Chrome 113+）
Firefox:     🔄 实验性支持（需要开启标志）
Safari:      🔄 实验性支持（Safari 17+）
Node.js:     ✅ 已支持（通过webgpu-native）

移动端：
Android Chrome: ✅ 已支持
iOS Safari:    🔄 实验性支持
```

### 7.2 WebGPU vs Vulkan/Metal/DirectX

WebGPU与底层原生API的对比：

```
API能力对比：

功能              | WebGPU | Vulkan | Metal | D3D12 |
-----------------|--------|--------|-------|-------|
渲染管线         |   ✅   |   ✅   |   ✅  |   ✅  |
计算着色器       |   ✅   |   ✅   |   ✅  |   ✅  |
光线追踪         |   🔄   |   ✅   |   ✅  |   ✅  |
Mesh Shader      |   ❌   |   ✅   |   ✅  |   ✅  |
Tensor计算       |   🔄   |   ✅   |   ✅  |   ✅  |
异步计算         |   ✅   |   ✅   |   ✅  |   ✅  |
分离式渲染       |   ✅   |   ✅   |   ✅  |   ✅  |

🔄 = 正在开发中
```

### 7.3 WebGPU的优势和挑战

**优势**：

1. **跨平台**：一次编写，到处运行（浏览器、桌面、移动端）
2. **现代化设计**：借鉴了Vulkan/Metal/D3D12的最佳实践
3. **更好的性能**：显著低于WebGL的CPU开销
4. **计算着色器**：让GPU通用计算成为可能
5. **更好的安全性**：WGSL的设计比GLSL更安全

**挑战**：

1. **学习曲线**：相比WebGL，WebGPU的API更复杂
2. **兼容性**：旧设备不支持
3. **调试工具**：还不够成熟
4. **生态系统**：相关库和工具还在发展中

## 八、性能优化与最佳实践

### 8.1 Bind Group优化

Bind Group是WebGPU中管理资源的核心机制，优化Bind Group的使用可以显著提升性能：

```javascript
// ❌ 不好的做法：频繁切换Bind Group
function badExample() {
  for (let i = 0; i < objects.length; i++) {
    passEncoder.setBindGroup(0, bindGroupUniforms);
    passEncoder.setBindGroup(1, bindGroupMaterial);
    passEncoder.setBindGroup(2, bindGroupObject);
    // 绘制...
  }
}

// ✅ 好的做法：按Bind Group分组绘制
function goodExample() {
  // 先绘制所有使用相同Uniform的对象
  passEncoder.setBindGroup(0, bindGroupUniforms);

  // 按材质分组
  for (let i = 0; i < objectsByMaterial.length; i++) {
    passEncoder.setBindGroup(1, bindGroupMaterial[i]);
    for (let j = 0; j < objects.length; j++) {
      passEncoder.setBindGroup(2, bindGroupObject[j]);
      // 绘制...
    }
  }
}
```

### 8.2 命令编码优化

```javascript
// ❌ 不好的做法：频繁创建和提交命令
function badExample() {
  for (let i = 0; i < 1000; i++) {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({...});
    pass.draw(3);
    pass.end();
    device.queue.submit([encoder.finish()]);  // 每帧提交1000次！
  }
}

// ✅ 好的做法：批量命令，一次提交
function goodExample() {
  const encoder = device.createCommandEncoder();

  // 开始多个渲染通道
  for (let i = 0; i < 1000; i++) {
    const pass = encoder.beginRenderPass({...});
    pass.draw(3);
    pass.end();
  }

  // 一次性提交所有命令
  device.queue.submit([encoder.finish()]);
}
```

### 8.3 内存管理

```javascript
// 1. 正确释放Buffer和Texture
function createTemporaryBuffer(device, size) {
  const buffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  // 使用完毕后销毁
  // buffer.destroy();  // 立即销毁
  // 或者依赖垃圾回收

  return buffer;
}

// 2. 使用Staging Buffer进行CPU-GPU数据传输
function efficientDataTransfer(device, data, destBuffer) {
  // 创建临时staging buffer
  const stagingBuffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
  });

  // 映射并写入数据
  await stagingBuffer.mapAsync(GPUMapMode.WRITE);
  new Float32Array(stagingBuffer.getMappedRange()).set(data);
  stagingBuffer.unmap();

  // 复制到目标buffer
  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(stagingBuffer, 0, destBuffer, 0, data.byteLength);
  device.queue.submit([encoder.finish()]);
}

// 3. 纹理压缩（减少内存带宽）
const textureFormat = 'bc1-rgba-unorm';  // DXT1压缩格式
// 或者使用'bc7-rgba-unorm'获取更好的质量
```

### 8.4 多线程优化

```javascript
// WebGPU支持多线程创建命令
// 但需要注意同步问题

// Worker线程中准备命令
class RenderThread {
  constructor(device) {
    this.device = device;
    this.commandEncoder = device.createCommandEncoder();
  }

  prepareDrawCalls() {
    // 在Worker线程中编码命令
    const pass = this.commandEncoder.beginRenderPass({...});
    pass.setPipeline(this.pipeline);
    pass.draw(3);
    pass.end();
  }

  getCommandBuffer() {
    return this.commandEncoder.finish();
  }
}

// 主线程只负责提交
const thread = new RenderThread(device);
thread.prepareDrawCalls();
const commands = thread.getCommandBuffer();
device.queue.submit([commands]);
```

## 九、总结与展望

好了，关于WebGPU的介绍就到这里。让我来总结一下今天学到的核心内容：

1. **WebGPU是下一代Web图形API**：它借鉴了Vulkan/Metal/D3D12的设计，比WebGL更现代、更强大。

2. **显式控制是核心理念**：开发者需要明确管理资源、命令和同步，不再有WebGL的"自动魔法"。

3. **WGSL是WebGPU的着色语言**：它的设计借鉴了Rust，注重安全性和可读性。

4. **计算着色器是革命性功能**：允许直接使用GPU进行通用计算，开启了Web高性能计算的大门。

5. **性能提升显著**：更低的CPU开销、更少的API调用、更好的并行性。

6. **生态系统正在发展中**：浏览器支持在逐步完善，相关工具和库还在发展中。

### 未来展望

WebGPU的未来非常光明：

1. **光线追踪支持**：硬件加速光线追踪将在未来版本中支持
2. **Mesh Shader**：更高效的网格处理
3. **Tensor计算**：GPU + AI的深度整合
4. **更好的开发者工具**：调试和性能分析工具将逐步完善

### 学习路径建议

如果你想学习WebGPU：

1. **先掌握WebGL基础**：理解GPU编程的基本概念
2. **学习WGSL语法**：熟悉WebGPU的着色语言
3. **理解显式渲染理念**：区别于WebGL的状态机模式
4. **实践计算着色器**：这是WebGPU独有的强大功能
5. **关注生态系统发展**：跟进浏览器支持和工具完善

虽然WebGPU现在还算"年轻"，但它代表着Web图形处理的未来。现在开始学习，你将走在技术前沿！

祝你在WebGPU的世界里探索愉快！
