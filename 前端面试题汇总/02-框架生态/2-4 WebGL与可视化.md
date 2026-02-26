# WebGL 与可视化技术全面指南 (2025 前端面试必备)

> 这是一份关于 WebGL、Three.js、数据可视化技术的全面面试指南，涵盖了从底层图形学原理到上层应用开发的完整知识体系。适合准备前端开发岗位面试的开发者阅读，也适合希望深入了解前端可视化技术的同学参考。
> **作者：前端面试题汇总项目组** - 致力于为前端开发者提供最全面、最实用的面试准备资料。
> **更新日期：2026-02-24**

---

## 第一章 WebGL 核心技术

### 1.1 WebGL 渲染管线详解

#### 1.1.1 渲染管线的整体架构

WebGL（Web Graphics Library）是一种在浏览器中实现硬件加速图形渲染的 JavaScript API。它基于 OpenGL ES 2.0/3.0 标准，允许开发者直接与 GPU 通信，实现高性能的 2D 和 3D 图形渲染。理解 WebGL 渲染管线是掌握图形编程的基础，也是面试中经常考察的重点内容。

WebGL 渲染管线是一个复杂的数据处理流程，它将 JavaScript 中的几何数据转换为屏幕上可见的像素。这个过程涉及多个阶段，每个阶段都有其特定的功能和优化点。掌握这些知识不仅能帮助我们编写更高效的代码，还能让我们在遇到性能问题时快速定位瓶颈。

渲染管线的主要阶段包括：顶点着色器、图元组装、光栅化、片元着色器、测试与混合。每一个阶段都可以进行一定程度的自定义，这正是 WebGL 强大灵活性的来源。接下来我们将详细分析每个阶段的作用和实现原理。

**渲染管线的完整流程图：**

```
JavaScript 数据
    │
    ▼
┌─────────────────────────────┐
│     顶点数据 (Vertex Data)    │
│  位置、法线、纹理坐标、颜色    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│     顶点着色器 (Vertex Shader) │
│  坐标变换、法线变换、属性传递   │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   图元组装 (Primitive Assembly) │
│   点、线、三角形的组装         │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   光栅化 (Rasterization)    │
│   将图元转换为片元           │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  片元着色器 (Fragment Shader) │
│   颜色计算、纹理采样、光照    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│   测试与混合 (Tests & Blend) │
│  深度测试、模板测试、混合     │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│      帧缓冲区 (Framebuffer)   │
│        最终显示输出           │
└─────────────────────────────┘
```

#### 1.1.2 顶点着色器 (Vertex Shader) 详解

顶点着色器是渲染管线的第一个可编程阶段，它处理每一个顶点数据。顶点着色器的主要职责包括：

1. **坐标变换**：将模型空间的顶点坐标转换到裁剪空间，这是通过模型矩阵、视图矩阵和投影矩阵的级联变换实现的。

2. **法线变换**：对于需要光照计算的物体，需要对法线进行变换。注意法线变换应该使用模型矩阵的逆转置矩阵，以确保在非均匀缩放时法线仍然正确。

3. **数据传递**：将需要传递给片元着色器的数据（如纹理坐标、颜色、雾因子等）进行插值传递。

**顶点着色器的典型实现：**

```glsl
// 顶点着色器示例
attribute vec3 aPosition;      // 顶点位置
attribute vec3 aNormal;        // 顶点法线
attribute vec2 aTexCoord;     // 纹理坐标

uniform mat4 uModelMatrix;    // 模型矩阵
uniform mat4 uViewMatrix;     // 视图矩阵
uniform mat4 uProjectionMatrix; // 投影矩阵
uniform mat3 uNormalMatrix;  // 法线矩阵

varying vec3 vNormal;         // 传递给片元着色器的法线
varying vec2 vTexCoord;      // 传递给片元着色器的纹理坐标
varying vec3 vPosition;       // 传递给片元着色器的世界坐标

void main() {
    // 计算世界坐标
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    vPosition = worldPosition.xyz;

    // 变换法线到世界空间
    vNormal = normalize(uNormalMatrix * aNormal);

    // 传递纹理坐标
    vTexCoord = aTexCoord;

    // 计算最终裁剪空间位置
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    // 设置点的大小（对于点图元）
    gl_PointSize = 5.0;
}
```

在 JavaScript 中，我们需要创建和编译着色器程序：

```javascript
// 创建着色器程序的完整流程
function createShader(gl, type, source) {
    // 创建着色器对象
    const shader = gl.createShader(type);

    // 设置着色器源码
    gl.shaderSource(shader, source);

    // 编译着色器
    gl.compileShader(shader);

    // 检查编译是否成功
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Shader compile error:', error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    // 创建程序对象
    const program = gl.createProgram();

    // 附加顶点着色器
    gl.attachShader(program, vertexShader);

    // 附加片元着色器
    gl.attachShader(program, fragmentShader);

    // 链接程序
    gl.linkProgram(program);

    // 检查链接是否成功
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        console.error('Program link error:', error);
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

// 使用示例
const vertexShaderSource = `
    attribute vec3 aPosition;
    uniform mat4 uMVP;
    void main() {
        gl_Position = uMVP * vec4(aPosition, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
        gl_FragColor = uColor;
    }
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
```

#### 1.1.3 图元组装 (Primitive Assembly)

图元组装阶段将变换后的顶点按照指定的图元类型组装成基本的几何元素。WebGL 支持以下几种图元类型：

| 图元类型 | 描述 | 顶点数量 |
|---------|------|----------|
| gl.POINTS | 点 | 1 |
| gl.LINES | 线段 | 2 |
| gl.LINE_STRIP | 连续线段 | 2+ |
| gl.LINE_LOOP | 闭合线环 | 3+ |
| gl.TRIANGLES | 三角形 | 3 |
| gl.TRIANGLE_STRIP | 三角形带 | 3+ |
| gl.TRIANGLE_FAN | 三角形扇 | 3+ |

**不同图元类型的应用场景：**

```javascript
// 设置图元类型
gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

// 对于索引绘制
gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_SHORT, 0);

// 绘制多个独立的图元
gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
```

#### 1.1.4 光栅化 (Rasterization)

光栅化是将图元转换为片元（Fragment）的过程。在这个过程中，系统会确定哪些像素被图元覆盖，并对每个片元进行属性插值。

光栅化过程中会进行以下计算：

1. **视锥体裁剪**：剔除在视锥体外的图元
2. **视口变换**：将裁剪空间坐标转换为窗口坐标
3. **属性插值**：根据片元与顶点的位置关系插值计算属性值

```javascript
// 设置视口
gl.viewport(0, 0, canvas.width, canvas.height);

// 启用/禁用裁剪测试
gl.enable(gl.SCISSOR_TEST);
gl.scissor(x, y, width, height);
```

#### 1.1.5 片元着色器 (Fragment Shader) 详解

片元着色器是渲染管线的最后一个可编程阶段，它处理每个像素的最终颜色计算。片元着色器的主要职责包括：

1. **纹理采样**：从纹理中获取颜色值
2. **颜色计算**：根据光照模型计算表面颜色
3. **雾效计算**：根据距离计算雾的颜色混合
4. **透明度处理**：计算片元的 alpha 值

**片元着色器的典型实现：**

```glsl
// 片元着色器示例 - 包含纹理采样和简单光照
precision highp float;

varying vec3 vNormal;      // 从顶点着色器传来的法线
varying vec2 vTexCoord;    // 从顶点着色器传来的纹理坐标
varying vec3 vPosition;    // 从顶点着色器传来的世界坐标

uniform sampler2D uTexture;  // 纹理采样器
uniform vec3 uLightPosition; // 光源位置
uniform vec3 uLightColor;    // 光源颜色
uniform vec3 uAmbientColor;  // 环境光颜色

void main() {
    // 获取纹理颜色
    vec4 texColor = texture2D(uTexture, vTexCoord);

    // 计算法线
    vec3 normal = normalize(vNormal);

    // 计算光线方向
    vec3 lightDir = normalize(uLightPosition - vPosition);

    // 计算漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;

    // 组合最终颜色（环境光 + 漫反射）
    vec3 finalColor = texColor.rgb * (uAmbientColor + diffuse);

    // 输出最终颜色
    gl_FragColor = vec4(finalColor, texColor.a);
}
```

#### 1.1.6 测试与混合 (Tests & Blending)

在片元着色器之后，WebGL 会执行一系列测试来确定片元是否应该被绘制到帧缓冲区：

1. **剪切测试 (Scissor Test)**：检查片元是否在指定的矩形区域内
2. **模板测试 (Stencil Test)**：使用模板缓冲区进行更复杂的遮挡计算
3. **深度测试 (Depth Test)**：比较片元的深度值与深度缓冲区中的值
4. **混合 (Blending)**：将片元颜色与帧缓冲区中已有颜色混合

**测试与混合的配置：**

```javascript
// 启用深度测试
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);  // 设置深度比较函数

// 启用混合
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// 启用模板测试
gl.enable(gl.STENCIL_TEST);
gl.stencilFunc(gl.EQUAL, 1, 0xFF);
gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

// 启用剪切测试
gl.enable(gl.SCISSOR_TEST);
gl.scissor(0, 0, 800, 600);

// 清除缓冲区
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
```

### 1.2 坐标系与变换矩阵

#### 1.2.1 WebGL 中的坐标系系统

WebGL 使用多个坐标系来描述三维场景，理解这些坐标系及其转换关系是掌握 3D 图形编程的关键。

**WebGL 坐标系详解：**

1. **模型空间 (Model Space)**：物体的本地坐标系，原点通常位于物体的几何中心，轴向与物体自身对齐。

2. **世界空间 (World Space)**：场景中所有物体共享的全局坐标系，用于描述物体在场景中的绝对位置和朝向。

3. **视图空间 (View Space)**：以相机为原点的坐标系，相机的位置是坐标原点，相机的前方是 -Z 轴方向。

4. **裁剪空间 (Clip Space)**：经过投影变换后的空间，用于进行裁剪计算。

5. **归一化设备坐标 (NDC)**：将裁剪空间坐标除以 w 分量后得到，范围在 -1 到 1 之间。

6. **屏幕空间 (Screen Space)**：最终映射到 Canvas 像素的坐标系，原点在 Canvas 左上角。

**坐标系转换流程：**

```
模型空间 ──(模型矩阵)──> 世界空间 ──(视图矩阵)──> 视图空间
                                           │
                                           ▼(投影矩阵)
                                    裁剪空间 ──(透视除法)──> NDC
                                                        │
                                                        ▼(视口变换)
                                                  屏幕空间
```

#### 1.2.2 变换矩阵详解

**模型矩阵 (Model Matrix)**：用于将顶点从模型空间变换到世界空间，实现物体的平移、旋转和缩放。

```javascript
// 创建基本变换矩阵
const modelMatrix = new Float32Array(16);

// 单位矩阵
function identity(out) {
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
}

// 平移矩阵
function translate(out, v) {
    const x = v[0], y = v[1], z = v[2];
    out[12] = out[0] * x + out[4] * y + out[8] * z + out[12];
    out[13] = out[1] * x + out[5] * y + out[9] * z + out[13];
    out[14] = out[2] * x + out[6] * y + out[10] * z + out[14];
    out[15] = out[3] * x + out[7] * y + out[11] * z + out[15];
    return out;
}

// 缩放矩阵
function scale(out, v) {
    out[0] *= v[0]; out[4] *= v[1]; out[8] *= v[2];
    out[1] *= v[0]; out[5] *= v[1]; out[9] *= v[2];
    out[2] *= v[0]; out[6] *= v[1]; out[10] *= v[2];
    out[3] *= v[0]; out[7] *= v[1]; out[11] *= v[2];
    return out;
}

// 旋转矩阵 - 绕 X 轴
function rotateX(out, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7];
    const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11];
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
}

// 旋转矩阵 - 绕 Y 轴
function rotateY(out, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3];
    const a20 = out[8], a21 = out[9], a22 = out[10], a23 = out[11];
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
}

// 旋转矩阵 - 绕 Z 轴
function rotateZ(out, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const a00 = out[0], a01 = out[1], a02 = out[2], a03 = out[3];
    const a10 = out[4], a11 = out[5], a12 = out[6], a13 = out[7];
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
}

// 四元数旋转变换
function fromQuat(out, q) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, yx = y * x2, yy = y * y2;
    const zx = z * x2, zy = z * y2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - (xx + zz);
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}
```

**视图矩阵 (View Matrix)**：用于将世界空间转换为视图空间，模拟相机的位置和朝向。

```javascript
// 创建视图矩阵
function lookAt(out, eye, center, up) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    const eyex = eye[0], eyey = eye[1], eyez = eye[2];
    const upx = up[0], upy = up[1], upz = up[2];
    const centerx = center[0], centery = center[1], centerz = center[2];

    // 计算前方向向量
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    // 归一化
    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len; z1 *= len; z2 *= len;

    // 计算右方向向量
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0; x1 = 0; x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len; x1 *= len; x2 *= len;
    }

    // 计算上方向向量
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0; y1 = 0; y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len; y1 *= len; y2 *= len;
    }

    // 构建视图矩阵
    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
}

// 使用示例：创建相机
const eye = [0, 2, 5];    // 相机位置
const center = [0, 0, 0]; // 观察点
const up = [0, 1, 0];     // 上方向
const viewMatrix = new Float32Array(16);
lookAt(viewMatrix, eye, center, up);
```

**投影矩阵 (Projection Matrix)**：定义视锥体并将视图空间坐标转换为裁剪空间坐标。

```javascript
// 透视投影矩阵
function perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
}

// 正交投影矩阵
function ortho(out, left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
}

// 使用示例
const fovy = 45 * Math.PI / 180; // 视野角度
const aspect = canvas.width / canvas.height;
const near = 0.1;
const far = 1000;
const projectionMatrix = new Float32Array(16);
perspective(projectionMatrix, fovy, aspect, near, far);
```

#### 1.2.3 矩阵运算的组合

在实际的渲染中，我们需要将多个变换组合成一个矩阵：

```javascript
// 矩阵乘法
function multiply(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
}

// 计算组合变换矩阵 (MVP = Projection * View * Model)
const mvpMatrix = new Float32Array(16);
multiply(mvpMatrix, projectionMatrix, viewMatrix); // 先乘 View
multiply(mvpMatrix, mvpMatrix, modelMatrix);       // 再乘 Model

// 计算法线矩阵
function normalFromMat4(out, a) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return null;
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[9] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[10] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    return out;
}
```

### 1.3 着色器 (Shader) 深入理解

#### 1.3.1 GLSL 基础语法

GLSL (OpenGL Shading Language) 是用于编写着色器的 C 风格语言。理解 GLSL 的语法和特性对于编写高效的着色器至关重要。

**GLSL 数据类型：**

```glsl
// 标量类型
float f = 1.0;      // 浮点数
int i = 1;          // 整数
bool b = true;      // 布尔值

// 向量类型
vec2 v2 = vec2(1.0, 2.0);       // 2D 向量
vec3 v3 = vec3(1.0, 2.0, 3.0);  // 3D 向量
vec4 v4 = vec4(1.0, 2.0, 3.0, 4.0); // 4D 向量

// 矩阵类型
mat2 m2 = mat2(1.0, 0.0, 0.0, 1.0);  // 2x2 矩阵
mat3 m3 = mat3(1.0);                  // 3x3 单位矩阵
mat4 m4 = mat4(1.0);                  // 4x4 单位矩阵

// 采样器类型
sampler2D tex;   // 2D 纹理
samplerCube cubemap; // 立方体贴图
sampler3D volume;    // 3D 纹理
```

**向量操作：**

```glsl
vec3 a = vec3(1.0, 2.0, 3.0);
vec3 b = vec3(4.0, 5.0, 6.0);

// 算术运算
vec3 c = a + b;  // 加法: (5.0, 7.0, 9.0)
vec3 d = a - b;  // 减法: (-3.0, -3.0, -3.0)
vec3 e = a * b;  // 乘法: (4.0, 10.0, 18.0)
vec3 f = a / b;  // 除法: (0.25, 0.4, 0.5)

// 缩放
vec3 g = a * 2.0;  // (2.0, 4.0, 6.0)

// 点积
float dotProduct = dot(a, b);  // 1*4 + 2*5 + 3*6 = 32

// 叉积
vec3 crossProduct = cross(a, b);  // 计算法向量

// 长度
float len = length(a);  // sqrt(1 + 4 + 9) = sqrt(14)

// 归一化
vec3 normalized = normalize(a);

// 距离
float dist = distance(a, b);

// 混合
vec3 mixed = mix(a, b, 0.5);  // 线性插值: (2.5, 3.5, 4.5)

// 阶跃函数
vec3 stepped = step(0.5, a);  // (1.0, 1.0, 1.0) 因为都大于 0.5

// 平滑过渡
vec3 smoothed = smoothstep(0.0, 1.0, a);
```

**矩阵操作：**

```glsl
mat4 modelMatrix = mat4(1.0);
mat4 viewMatrix = mat4(1.0);
mat4 projectionMatrix = mat4(1.0);

// 矩阵乘法
mat4 mvp = projectionMatrix * viewMatrix * modelMatrix;

// 向量与矩阵相乘
vec4 transformed = mvp * vec4(1.0, 0.0, 0.0, 1.0);

// 矩阵构造
mat4 m = mat4(
    1.0, 0.0, 0.0, 0.0,  // 列 1
    0.0, 1.0, 0.0, 0.0,  // 列 2
    0.0, 0.0, 1.0, 0.0,  // 列 3
    0.0, 0.0, 0.0, 1.0   // 列 4
);

// 获取矩阵元素
float element = m[2][1];  // 获取第 3 列第 2 行的元素
```

#### 1.3.2 顶点着色器进阶

**使用实例属性的顶点着色器：**

```glsl
// 实例化渲染的顶点着色器
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

attribute vec3 aInstancePosition;  // 实例位置
attribute vec4 aInstanceRotation;  // 实例旋转（四元数）
attribute vec3 aInstanceScale;     // 实例缩放

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vPosition;

// 四元数乘法
vec4 multiplyQuat(vec4 a, vec4 b) {
    return vec4(
        a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
        a.w * b.w - dot(a.xyz, b.xyz)
    );
}

// 四元数旋转向量
vec3 rotateByQuat(vec3 v, vec4 q) {
    return v + 2.0 * cross(q.xyz, q.xyz * dot(v, q.xyz) + q.w * v);
}

void main() {
    // 应用实例变换
    vec3 transformedPosition = aPosition * aInstanceScale;
    transformedPosition = rotateByQuat(transformedPosition, aInstanceRotation);
    transformedPosition += aInstancePosition;

    vec3 transformedNormal = rotateByQuat(aNormal, aInstanceRotation);

    // 计算世界坐标
    vec4 worldPosition = uModelMatrix * vec4(transformedPosition, 1.0);
    vPosition = worldPosition.xyz;

    // 变换法线
    vNormal = normalize(uNormalMatrix * transformedNormal);

    // 传递纹理坐标
    vTexCoord = aTexCoord;

    // 计算裁剪空间位置
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

#### 1.3.3 片元着色器进阶

**PBR (Physically Based Rendering) 材质着色器：**

```glsl
precision highp float;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;

uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uLightIntensity;

uniform vec3 uAlbedo;
uniform float uMetallic;
uniform float uRoughness;
uniform float uAO;
uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalMap;
uniform sampler2D uMetallicMap;
uniform sampler2D uRoughnessMap;

const float PI = 3.14159265359;

// 菲涅尔近似
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 法线分布函数 (GGX/Trowbridge-Reitz)
float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

// 几何遮蔽函数 (Schlick-GGX)
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

void main() {
    // 从纹理获取参数
    vec3 albedo = texture2D(uAlbedoMap, vTexCoord).rgb;
    albedo = pow(albedo, vec3(2.2)); // 从 sRGB 转换到线性空间
    float metallic = texture2D(uMetallicMap, vTexCoord).r;
    float roughness = texture2D(uRoughnessMap, vTexCoord).r;

    // 合并用户提供的参数和纹理参数
    albedo *= uAlbedo;
    metallic = mix(metallic, uMetallic, 0.0); // 简化处理

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPosition - vPosition);
    vec3 L = normalize(uLightPosition - vPosition);
    vec3 H = normalize(V + L);

    // 计算基础反射率
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // Cook-Torrance BRDF
    float NDF = distributionGGX(N, H, roughness);
    float G = geometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * albedo / PI + specular) * uLightColor * uLightIntensity * NdotL;

    // 环境光
    vec3 ambient = vec3(0.03) * albedo * uAO;

    vec3 color = ambient + Lo;

    // HDR 色调映射
    color = color / (color + vec3(1.0));

    // Gamma 校正
    color = pow(color, vec3(1.0/2.2));

    gl_FragColor = vec4(color, 1.0);
}
```

**后处理效果着色器：**

```glsl
// 泛光 (Bloom) 后处理 - 提取高光部分
precision highp float;

uniform sampler2D uTexture;
uniform float uThreshold;

varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);

    // 计算亮度
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    // 提取高亮部分
    if (brightness > uThreshold) {
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(0.0);
    }
}
```

```glsl
// 泛光 (Bloom) 后处理 - 高斯模糊
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uDirection;
uniform vec2 uResolution;

varying vec2 vTexCoord;

// 9x9 高斯核
const float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec2 texelSize = 1.0 / uResolution;
    vec3 result = texture2D(uTexture, vTexCoord).rgb * weights[0];

    for (int i = 1; i < 5; i++) {
        vec2 offset = texelSize * float(i) * uDirection;
        result += texture2D(uTexture, vTexCoord + offset).rgb * weights[i];
        result += texture2D(uTexture, vTexCoord - offset).rgb * weights[i];
    }

    gl_FragColor = vec4(result, 1.0);
}
```

```glsl
// 泛光 (Bloom) 后处理 - 混合
precision highp float;

uniform sampler2D uSceneTexture;
uniform sampler2D uBloomTexture;
uniform float uBloomStrength;

varying vec2 vTexCoord;

void main() {
    vec3 sceneColor = texture2D(uSceneTexture, vTexCoord).rgb;
    vec3 bloomColor = texture2D(uBloomTexture, vTexCoord).rgb;

    vec3 result = sceneColor + bloomColor * uBloomStrength;

    gl_FragColor = vec4(result, 1.0);
}
```

### 1.4 纹理与材质

#### 1.4.1 纹理基础

纹理是映射到 3D 物体表面的图像，用于增加视觉细节。在 WebGL 中，纹理是通过纹理单元（Texture Unit）绑定到着色器的。

**创建和配置纹理：**

```javascript
// 创建纹理
const texture = gl.createTexture();

// 绑定纹理
gl.bindTexture(gl.TEXTURE_2D, texture);

// 设置纹理参数
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

// 设置纹理图像
gl.texImage2D(
    gl.TEXTURE_2D,      // 目标
    0,                  // Mipmap 级别
    gl.RGBA,            // 内部格式
    gl.RGBA,            // 源格式
    gl.UNSIGNED_BYTE,   // 数据类型
    image               // 图像数据
);

// 生成 Mipmap
gl.generateMipmap(gl.TEXTURE_2D);

// 使用 Anisotropic Filtering (各向异性过滤)
const ext = gl.getExtension('EXT_texture_filter_anisotropic');
if (ext) {
    const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
}
```

#### 1.4.2 纹理类型

**2D 纹理：** 最常用的纹理类型

```javascript
// 加载 2D 纹理
function loadTexture(gl, url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            resolve(texture);
        };
        image.onerror = reject;
        image.src = url;
    });
}
```

**立方体贴图 (Cubemap)：** 用于环境映射

```javascript
// 加载立方体贴图
function loadCubemap(gl, urls) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faces = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    let loaded = 0;
    faces.forEach((face, i) => {
        const image = new Image();
        image.onload = () => {
            gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            loaded++;
            if (loaded === 6) {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = urls[i];
    });

    return texture;
}

// 立方体贴图着色器
const cubemapVertexShader = `
    attribute vec3 aPosition;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    varying vec3 vDirection;

    void main() {
        vDirection = aPosition;
        vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
        gl_Position = pos.xyww; // 确保深度为 1.0
    }
`;

const cubemapFragmentShader = `
    precision highp float;
    varying vec3 vDirection;
    uniform samplerCube uTexture;

    void main() {
        vec3 direction = normalize(vDirection);
        vec4 color = textureCube(uTexture, direction);
        gl_FragColor = color;
    }
`;
```

**3D 纹理：** 用于体积渲染

```javascript
// 创建 3D 纹理
const texture3D = gl.createTexture();
gl.bindTexture(gl.TEXTURE_3D, texture3D);

gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

// 填充 3D 纹理数据
gl.texImage3D(
    gl.TEXTURE_3D,
    0,
    gl.R8,
    width,
    height,
    depth,
    0,
    gl.RED,
    gl.UNSIGNED_BYTE,
    dataArray
);
```

#### 1.4.3 纹理采样器

```javascript
// 创建纹理采样器
const sampler = gl.createSampler();

// 设置采样器参数
gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, gl.REPEAT);
gl.samplerParameterf(sampler, gl.TEXTURE_LOD_BIAS, 0.0);
gl.samplerParameterf(sampler, gl.TEXTURE_MIN_LOD, -1000);
gl.samplerParameterf(sampler, gl.TEXTURE_MAX_LOD, 1000);

// 绑定采样器到纹理单元
gl.bindSampler(0, sampler);
```

#### 1.4.4 纹理动画与程序化纹理

**程序化生成的纹理：**

```javascript
// 程序化生成棋盘格纹理
function createCheckerboardTexture(gl, size = 256) {
    const data = new Uint8Array(size * size * 4);
    const checkerSize = size / 8;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const isWhite = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
            const value = isWhite ? 255 : 0;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = 255;   // A
        }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

// 程序化生成噪声纹理
function createNoiseTexture(gl, size = 256) {
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
        const value = Math.random() * 255;
        data[i * 4] = value;
        data[i * 4 + 1] = value;
        data[i * 4 + 2] = value;
        data[i * 4 + 3] = 255;
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}
```

### 1.5 WebGL 性能优化

#### 1.5.1 Draw Call 优化

Draw Call 是 CPU 向 GPU 发送的渲染命令，每次 Draw Call 都有一定的开销。优化 Draw Call 是提升 WebGL 性能的关键。

**实例化渲染 (Instanced Rendering)：**

```javascript
// 创建实例化网格
const instanceCount = 1000;
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 创建 InstancedMesh
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

// 设置每个实例的变换矩阵
const dummy = new THREE.Object3D();
for (let i = 0; i < instanceCount; i++) {
    dummy.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
    );
    dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    dummy.scale.setScalar(Math.random() * 2 + 0.5);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
```

**几何体合并：**

```javascript
// 使用 BufferGeometryUtils 合并几何体
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const geometries = [];
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

for (let i = 0; i < 1000; i++) {
    const clonedGeometry = boxGeometry.clone();
    clonedGeometry.translate(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
    );
    geometries.push(clonedGeometry);
}

const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);
```

#### 1.5.2 内存优化

```javascript
// 几何体优化
function optimizeGeometry(geometry) {
    // 合并重复的顶点
    geometry.mergeVertices();

    // 计算包围盒
    geometry.computeBoundingBox();

    // 计算包围球
    geometry.computeBoundingSphere();

    return geometry;
}

// 纹理优化
function optimizeTexture(texture) {
    // 设置合适的 anisotropy
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 使用压缩纹理（如果可用）
    if (renderer.extensions.get('WEBGL_compressed_texture_astc')) {
        texture.format = THREE.CompressedTexture;
    }

    // 禁用不需要的 mipmap
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;

    return texture;
}

// 及时释放资源
function disposeObject(obj) {
    if (obj.geometry) {
        obj.geometry.dispose();
    }
    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
        } else {
            obj.material.dispose();
        }
    }
    if (obj.texture) {
        obj.texture.dispose();
    }
}

// 场景清理
function disposeScene(scene) {
    scene.traverse((object) => {
        if (object.isMesh) {
            disposeObject(object);
        }
    });
}
```

#### 1.5.3 着色器优化

```glsl
// 避免不必要的计算
void main() {
    // 不好：在片元着色器中进行昂贵的计算
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);

    // 好：在顶点着色器中计算好，传递给片元着色器
    vec3 normal = vNormal;
    vec3 lightDir = vLightDir;
}

// 减少纹理采样
void main() {
    // 不好：多次采样同一纹理
    vec4 color1 = texture2D(uTexture, vTexCoord);
    vec4 color2 = texture2D(uTexture, vTexCoord + vec2(0.1, 0.0));

    // 好：采样一次，多次使用
    vec4 color = texture2D(uTexture, vTexCoord);
    // 使用 color.r, color.g, color.b, color.a
}

// 使用合适的精度
precision highp float; // 顶点着色器使用高精度
precision mediump float; // 片元着色器可以使用中等精度

// 避免分支
void main() {
    // 不好：使用 if 语句
    if (uUseTexture) {
        gl_FragColor = texture2D(uTexture, vTexCoord);
    } else {
        gl_FragColor = uColor;
    }

    // 好：使用 mix 函数
    vec4 texColor = texture2D(uTexture, vTexCoord);
    gl_FragColor = mix(uColor, texColor, uUseTexture);
}
```

#### 1.5.4 帧率优化策略

```javascript
// 动态调整质量
class AdaptiveQuality {
    constructor(renderer, targetFPS = 60) {
        this.renderer = renderer;
        this.targetFPS = targetFPS;
        this.frameTimeHistory = [];
        this.historySize = 60;
    }

    update(deltaTime) {
        this.frameTimeHistory.push(deltaTime);
        if (this.frameTimeHistory.length > this.historySize) {
            this.frameTimeHistory.shift();
        }

        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
        const currentFPS = 1000 / avgFrameTime;

        if (currentFPS < this.targetFPS * 0.8) {
            this.decreaseQuality();
        } else if (currentFPS > this.targetFPS * 1.2) {
            this.increaseQuality();
        }
    }

    decreaseQuality() {
        // 降低渲染质量
        this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.25));
    }

    increaseQuality() {
        // 提高渲染质量
        const maxRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(Math.min(maxRatio, this.renderer.getPixelRatio() + 0.25));
    }
}

// 使用
const adaptiveQuality = new AdaptiveQuality(renderer);

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    adaptiveQuality.update(deltaTime);
    renderer.render(scene, camera);
}
```

---

## 第二章 Three.js 核心概念

### 2.1 Three.js 基础架构

#### 2.1.1 场景、相机、渲染器

Three.js 是最流行的 WebGL 库，它封装了底层的 WebGL API，提供了更易用的 3D 开发接口。

**创建基础 Three.js 场景：**

```javascript
import * as THREE from 'three';

// 1. 创建场景
const scene = new THREE.Scene();

// 设置场景背景
scene.background = new THREE.Color(0x1a1a2e);

// 添加雾效
scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);

// 2. 创建相机
const camera = new THREE.PerspectiveCamera(
    75,                                          // 视野角度
    window.innerWidth / window.innerHeight,      // 宽高比
    0.1,                                         // 近裁剪面
    1000                                         // 远裁剪面
);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// 3. 创建渲染器
const renderer = new THREE.WebGLRenderer({
    antialias: true,           // 抗锯齿
    alpha: true,              // 透明背景
    powerPreference: 'high-performance', // 高性能模式
    stencil: false,           // 禁用模板缓冲
    depth: true                // 启用深度缓冲
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;  // 开启阴影
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; // SRGB 色彩空间
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

document.body.appendChild(renderer.domElement);

// 4. 添加内容
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. 动画循环
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// 6. 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### 2.1.2 相机类型详解

**透视相机 (PerspectiveCamera)：**

```javascript
// 透视相机 - 模拟人眼效果，有近大远小
const perspectiveCamera = new THREE.PerspectiveCamera(
    fov,      // 视野角度（度）
    aspect,   // 宽高比
    near,     // 近裁剪面
    far       // 远裁剪面
);

// 设置相机位置和朝向
perspectiveCamera.position.set(0, 5, 10);
perspectiveCamera.lookAt(0, 0, 0);

// 轨道控制器 - 允许用户旋转相机
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const controls = new OrbitControls(perspectiveCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.minDistance = 2;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2; // 限制垂直角度

// 更新控制器
function animate() {
    controls.update();
    renderer.render(scene, perspectiveCamera);
}
```

**正交相机 (OrthographicCamera)：**

```javascript
// 正交相机 - 没有透视变形，适合 2D UI 或技术制图
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 10;
const orthoCamera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    1000
);
orthoCamera.position.set(0, 0, 10);
orthoCamera.lookAt(0, 0, 0);
```

**立体相机 (StereoCamera)：**

```javascript
// 立体相机 - 用于 VR 或 3D 眼镜
import { StereoCamera } from 'three/addons/cameras/StereoCamera.js';

const stereoCamera = new StereoCamera();
stereoCamera.position.set(0, 0, 5);
stereoCamera.zoom = 0.5;

// 设置左右相机
stereoCamera.left.camera.position.set(-0.5, 0, 5);
stereoCamera.right.camera.position.set(0.5, 0, 5);

// 渲染立体视图
function renderStereo() {
    stereoCamera.update(renderer);
    renderer.render(scene, stereoCamera.left.camera);
    renderer.render(scene, stereoCamera.right.camera);
}
```

#### 2.1.3 渲染器类型

**WebGLRenderer：**

```javascript
const renderer = new THREE.WebGLRenderer({
    canvas: null,              // 可选：指定 canvas 元素
    context: null,             // 可选：指定 WebGL 上下文
    antialias: false,          // 抗锯齿
    alpha: false,              // 背景透明度
    depth: true,               // 深度缓冲
    stencil: false,           // 模板缓冲
    antialias: false,         // 抗锯齿
    powerPreference: 'default', // 性能偏好: 'default' | 'high-performance' | 'low-power'
    preserveDrawingBuffer: false, // 保留绘制缓冲
    precision: 'highp',       // 精度: 'highp' | 'mediump' | 'lowp'
    logarithmicDepthBuffer: false, // 对数深度缓冲
});

// 渲染方法
renderer.render(scene, camera);
renderer.render(scene, camera, renderTarget); // 渲染到渲染目标

// 获取渲染器信息
const info = renderer.info;
console.log('Triangles:', info.render.triangles);
console.log('Draw calls:', info.render.calls);
console.log('Textures:', info.memory.textures);
console.log('Geometries:', info.memory.geometries);
```

**WebGLRenderTarget：**

```javascript
// 创建渲染目标（用于后处理或反射）
const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,  // 宽度
    window.innerHeight, // 高度
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        samples: 4  // MSAA 采样数
    }
);

// 渲染到纹理
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null);

// 读取渲染结果
const buffer = new Uint8Array(window.innerWidth * window.innerHeight * 4);
renderer.readRenderTargetPixels(renderTarget, 0, 0, window.innerWidth, window.innerHeight, buffer);
```

### 2.2 光照系统

#### 2.2.1 光源类型

**环境光 (AmbientLight)：**

```javascript
// 环境光 - 均匀照亮所有物体
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // 颜色, 强度
scene.add(ambientLight);
```

**平行光 (DirectionalLight)：**

```javascript
// 平行光 - 类似太阳光，光线平行
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;

// 阴影配置
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.0001;

scene.add(directionalLight);
```

**点光源 (PointLight)：**

```javascript
// 点光源 - 从一个点向各个方向发光
const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 5, 0);
pointLight.decay = 2; // 衰减系数
pointLight.castShadow = true;
scene.add(pointLight);

// 添加光源辅助
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5);
scene.add(pointLightHelper);
```

**聚光灯 (SpotLight)：**

```javascript
// 聚光灯 - 锥形光束
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(5, 10, 5);
spotLight.target.position.set(0, 0, 0);
spotLight.angle = Math.PI / 6;  // 角度
spotLight.penumbra = 0.3;        // 半影
spotLight.decay = 2;             // 衰减
spotLight.distance = 50;         // 最大距离
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;

scene.add(spotLight);
scene.add(spotLight.target);

// 聚光灯辅助
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);
```

**半球光 (HemisphereLight)：**

```javascript
// 半球光 - 模拟天空和地面的反射光
const hemisphereLight = new THREE.HemisphereLight(
    0xffffbb,  // 天空颜色
    0x080820,  // 地面颜色
    0.5        // 强度
);
scene.add(hemisphereLight);
```

#### 2.2.2 光照模型

**Lambert (漫反射) 模型：**

```javascript
// 使用 MeshLambertMaterial
const lambertMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    emissive: 0x000000
});
```

**Phong (镜面反射) 模型：**

```javascript
// 使用 MeshPhongMaterial
const phongMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x000000,
    specular: 0x111111,  // 镜面反射颜色
    shininess: 30        // 光泽度
});
```

**Standard (PBR) 模型：**

```javascript
// 使用 MeshStandardMaterial - 基于物理的渲染
const standardMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,    // 金属度：0 = 非金属，1 = 金属
    roughness: 0.5,   // 粗糙度：0 = 光滑，1 = 粗糙
    emissive: 0x000000,
    emissiveIntensity: 1,
    normalMap: null,   // 法线贴图
    displacementMap: null, // 位移贴图
    aoMap: null,       // 环境光遮蔽贴图
    lightMap: null,    // 光照贴图
    envMap: null,      // 环境贴图
});
```

**Physical (高级 PBR) 模型：**

```javascript
// 使用 MeshPhysicalMaterial - 更高级的 PBR
const physicalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5,
    transmission: 0,     // 透光率（玻璃效果）
    thickness: 0,        // 厚度
    ior: 1.5,           // 折射率
    clearcoat: 0,        // 清漆层
    clearcoatRoughness: 0,
    reflectivity: 0.5,  // 反射率
    iridescence: 0,     // 虹彩效果
    iridescenceIOR: 1.3,
    sheen: 0,           // 织物光泽
    sheenColor: 0x000000,
});
```

### 2.3 材质系统

#### 2.3.1 材质类型对比

| 材质类型 | 性能 | 特性 | 适用场景 |
|---------|------|------|---------|
| MeshBasicMaterial | 最快 | 无光照，颜色纯 | UI、线条、不需要光照 |
| MeshLambertMaterial | 快 | 简单漫反射 | 性能敏感的基本渲染 |
| MeshPhongMaterial | 中 | 镜面反射 | 需要光泽的表面 |
| MeshStandardMaterial | 中 | PBR 金属/粗糙度 | 真实感渲染 |
| MeshPhysicalMaterial | 慢 | 高级 PBR 效果 | 玻璃、透明材质 |

#### 2.3.2 材质属性详解

```javascript
// 基础属性
const material = new THREE.MeshStandardMaterial({
    // 颜色
    color: 0xff0000,           // 基础颜色
    emissive: 0x000000,       // 自发光颜色
    emissiveIntensity: 1,      // 自发光强度

    // PBR 属性
    metalness: 0.5,           // 金属度 (0-1)
    roughness: 0.5,           // 粗糙度 (0-1)

    // 透明度
    transparent: false,        // 开启透明
    opacity: 1,               // 不透明度 (0-1)
    depthWrite: true,         // 深度写入
    side: THREE.FrontSide,   // 渲染面：FrontSide/BackSide/DoubleSide

    // 纹理贴图
    map: null,                // 基础纹理
    lightMap: null,           // 光照贴图
    aoMap: null,             // 环境光遮蔽贴图
    emissiveMap: null,       // 自发光贴图
    bumpMap: null,           // 凹凸贴图
    normalMap: null,         // 法线贴图
    displacementMap: null,   // 位移贴图
    roughnessMap: null,       // 粗糙度贴图
    metalnessMap: null,      // 金属度贴图
    envMap: null,            // 环境贴图

    // 纹理偏移和重复
    mapOffset: new THREE.Vector2(0, 0),
    mapRepeat: new THREE.Vector2(1, 1),
});

// 线框模式
material.wireframe = false;

// 顶点颜色
material.vertexColors = false;

// 雾效
material.fog = true;
```

### 2.4 几何体系统

#### 2.4.1 内置几何体

```javascript
// 基础几何体
const box = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
const sphere = new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
const plane = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
const circle = new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength);
const cone = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments, openEnded);
const cylinder = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
const torus = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
const torusKnot = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
const ring = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
const shape = new THREE.ShapeGeometry(shape);
const text = new THREE.TextGeometry(text, font, size, depth, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments);

// 参数化几何体
const geometry = new THREE.BufferGeometry();
const positions = [];
for (let i = 0; i < 1000; i++) {
    positions.push(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    );
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
```

#### 2.4.2 自定义几何体

```javascript
// 创建自定义 BufferGeometry
function createCustomGeometry() {
    const geometry = new THREE.BufferGeometry();

    // 定义顶点位置
    const vertices = new Float32Array([
        // 第一个三角形
        0, 0, 0,
        1, 0, 0,
        0.5, 1, 0,
        // 第二个三角形
        0.5, 1, 0,
        1, 0, 0,
        1, 1, 0
    ]);

    // 定义法线
    const normals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ]);

    // 定义纹理坐标
    const uvs = new Float32Array([
        0, 0,
        1, 0,
        0.5, 1,
        0.5, 1,
        1, 0,
        1, 1
    ]);

    // 设置属性
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    return geometry;
}

// 使用索引几何体
function createIndexedGeometry() {
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0.5, 1, 0
    ]);

    const indices = new Uint16Array([
        0, 1, 2
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    return geometry;
}
```

### 2.5 动画系统

#### 2.5.1 基础动画

```javascript
// 使用 requestAnimationFrame
function animate() {
    requestAnimationFrame(animate);

    // 更新物体
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // 渲染
    renderer.render(scene, camera);
}

// 使用 Clock
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();  // 帧间隔时间（秒）
    const elapsed = clock.getElapsedTime(); // 总运行时间

    cube.rotation.x += delta * 1; // 每秒旋转 1 弧度
    cube.position.y = Math.sin(elapsed * 2) * 0.5; // 上下浮动

    renderer.render(scene, camera);
}
```

#### 2.5.2 补间动画

```javascript
// 使用 TWEEN.js 进行补间动画
import TWEEN from '@tweenjs/tween.js';

// 位置补间
const positionTween = new TWEEN.Tween(cube.position)
    .to({ x: 5, y: 0, z: 0 }, 1000) // 目标位置，持续时间
    .easing(TWEEN.Easing.Quadratic.Out) // 缓动函数
    .delay(0) // 延迟
    .repeat(Infinity) // 重复次数
    .yoyo(true) // 来回播放
    .onUpdate(() => {
        // 每帧更新回调
    })
    .onComplete(() => {
        // 完成的回调
    })
    .start();

// 颜色补间
const colorTween = new TWEEN.Tween(material.color)
    .to({ r: 1, g: 0, b: 0 }, 1000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

// 在动画循环中更新 TWEEN
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
```

#### 2.5.3 关键帧动画

```javascript
import { AnimationClip, AnimationMixer } from 'three';

// 创建动画
function createAnimation() {
    // 创建位置关键帧
    const positionKF = new THREE.VectorKeyframeTrack(
        '.position',
        [0, 1, 2],  // 时间点
        [0, 0, 0, 0, 5, 0, 0, 0, 0] // 值
    );

    // 创建旋转关键帧
    const rotationKF = new THREE.QuaternionKeyframeTrack(
        '.quaternion',
        [0, 1, 2],
        [0, 0, 0, 1, 0, 0, 0.707, 0.707, 0, 0, 0, 1]
    );

    // 创建缩放关键帧
    const scaleKF = new THREE.VectorKeyframeTrack(
        '.scale',
        [0, 1, 2],
        [1, 1, 1, 2, 2, 2, 1, 1, 1]
    );

    // 创建动画片段
    const clip = new AnimationClip('action', 2, [positionKF, rotationKF, scaleKF]);

    return clip;
}

// 使用动画混合器
const mixer = new THREE.AnimationMixer(cube);
const clip = createAnimation();
const action = mixer.clipAction(clip);
action.play();

// 在动画循环中更新混合器
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer.update(delta);
    renderer.render(scene, camera);
}
```

#### 2.5.4 粒子动画系统

```javascript
// 创建粒子系统
function createParticleSystem() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        colors[i * 3] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();

        sizes[i] = Math.random() * 5 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    return particles;
}

// 粒子动画
function animateParticles(particles, time) {
    const positions = particles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + positions[i]) * 0.01;
    }

    particles.geometry.attributes.position.needsUpdate = true;
}
```

### 2.6 控制器与交互

#### 2.6.1 常用控制器

```javascript
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// 轨道控制器
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enableZoom = true;
orbitControls.minDistance = 1;
orbitControls.maxDistance = 100;
orbitControls.enableRotate = true;
orbitControls.enablePan = true;
orbitControls.maxPolarAngle = Math.PI;

// 第一人称控制器
const fpControls = new FirstPersonControls(camera, renderer.domElement);
fpControls.movementSpeed = 10;
fpControls.lookSpeed = 0.1;
fpControls.lookVertical = true;

// 飞行控制器
const flyControls = new FlyControls(camera, renderer.domElement);
flyControls.movementSpeed = 10;
flyControls.rollSpeed = Math.PI / 6;
flyControls.autoForward = false;

// 指针锁定控制器（用于 FPS 游戏）
const pointerLockControls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => {
    pointerLockControls.lock();
});

// 拖拽控制器
const draggableObjects = [cube];
const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
dragControls.addEventListener('dragstart', (event) => {
    controls.enabled = false;
    event.object.material.emissive.set(0xaaaaaa);
});
dragControls.addEventListener('dragend', (event) => {
    controls.enabled = true;
    event.object.material.emissive.set(0x000000);
});

// 变换控制器
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.attach(cube);
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
});
```

#### 2.6.2 射线检测

```javascript
import { Raycaster } from 'three';

const raycaster = new Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // 归一化鼠标坐标
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 设置射线
    raycaster.setFromCamera(mouse, camera);

    // 检测相交
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        console.log('Clicked on:', intersect.object);
        console.log('Point:', intersect.point);
        console.log('Face:', intersect.face);
        console.log('Distance:', intersect.distance);
    }
}

window.addEventListener('click', onMouseClick);

// 持续检测（用于悬停效果）
function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    // 处理相交结果
}
```

### 2.7 Three.js 性能优化

#### 2.7.1 渲染优化

```javascript
// 使用 BufferGeometry
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 禁用自动更新
cube.matrixAutoUpdate = false;
cube.updateMatrix();

// 使用共享几何体和材质
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
const sharedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// 创建多个使用相同几何体和材质的网格
for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(sharedGeometry, sharedMaterial);
    mesh.position.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
    scene.add(mesh);
}

// 视锥体剔除
mesh.frustumCulled = true;

// LOD (Level of Detail)
import { LOD } from 'three';

const lod = new LOD();

// 高细节
const highDetailGeo = new THREE.BoxGeometry(1, 1, 1);
const highDetailMesh = new THREE.Mesh(highDetailGeo, material);
lod.addLevel(highDetailMesh, 0);

// 中细节
const mediumDetailGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const mediumDetailMesh = new THREE.Mesh(mediumDetailGeo, material);
lod.addLevel(mediumDetailMesh, 10);

// 低细节
const lowDetailGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
const lowDetailMesh = new THREE.Mesh(lowDetailGeo, material);
lod.addLevel(lowDetailMesh, 20);

scene.add(lod);
```

#### 2.7.2 资源加载优化

```javascript
// 使用 Draco 压缩
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('model.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
});

// 纹理压缩
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
ktx2Loader.detectSupport(renderer);

// 使用加载管理器
import { LoadingManager } from 'three';

const manager = new LoadingManager();

manager.onStart = (url, loaded, total) => {
    console.log('Started:', url, loaded, total);
};

manager.onProgress = (url, loaded, total) => {
    console.log('Progress:', url, loaded, total);
    const progress = (loaded / total * 100).toFixed(0) + '%';
    updateProgressBar(progress);
};

manager.onError = (url) => {
    console.log('Error:', url);
};

manager.onLoad = () => {
    console.log('All loaded');
    hideLoadingScreen();
};

const gltfLoader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);
```

#### 2.7.3 场景图优化

```javascript
// 对象池
class ObjectPool {
    constructor(createFn, initialSize = 10) {
        this.createFn = createFn;
        this.pool = [];
        this.active = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);
        }
    }
}

// 使用对象池
const cubePool = new ObjectPool(() => {
    return new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
}, 20);

const cube1 = cubePool.get();
scene.add(cube1);

cubePool.release(cube1);
scene.remove(cube1);

// 场景分割
class SpatialPartition {
    constructor(cellSize = 10) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    getKey(x, y, z) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        return `${cx},${cy},${cz}`;
    }

    insert(object) {
        const key = this.getKey(object.position.x, object.position.y, object.position.z);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(object);
    }

    query(x, y, z) {
        const key = this.getKey(x, y, z);
        return this.cells.get(key) || [];
    }
}
```

---

## 第三章 Canvas 与 SVG

### 3.1 Canvas 2D API

#### 3.1.1 Canvas 基础

```html
<canvas id="myCanvas" width="800" height="600"></canvas>

<script>
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 获取或创建 WebGL 上下文
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
</script>
```

#### 3.1.2 基本图形绘制

```javascript
// 矩形
ctx.fillStyle = 'red';
ctx.fillRect(x, y, width, height);  // 填充矩形
ctx.strokeRect(x, y, width, height); // 描边矩形
ctx.clearRect(x, y, width, height); // 清除矩形区域

// 路径
ctx.beginPath();           // 开始路径
ctx.moveTo(x, y);          // 移动到点
ctx.lineTo(x, y);          // 直线到点
ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise); // 圆弧
ctx.quadraticCurveTo(cp1x, cp1y, x, y); // 二次贝塞尔曲线
ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y); // 三次贝塞尔曲线
ctx.closePath();           // 关闭路径

ctx.fill();                // 填充路径
ctx.stroke();              // 描边路径

// 圆形
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = 'blue';
ctx.fill();

// 线条
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(200, 200);
ctx.strokeStyle = 'green';
ctx.lineWidth = 2;
ctx.stroke();

// 文本
ctx.font = '24px Arial';
ctx.fillStyle = 'black';
ctx.fillText('Hello World', 50, 50);
ctx.strokeText('Hello World', 50, 50);

// 图像
const img = new Image();
img.onload = () => {
    ctx.drawImage(img, 0, 0, 200, 200);
    // 裁剪绘制
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
};
img.src = 'image.png';
```

#### 3.1.3 变换与样式

```javascript
// 变换矩阵
ctx.save();             // 保存当前状态
ctx.restore();          // 恢复之前保存的状态

// 平移
ctx.translate(x, y);

// 旋转
ctx.rotate(angle);

// 缩放
ctx.scale(sx, sy);

// 自定义变换
ctx.setTransform(a, b, c, d, e, f);
// a: 水平缩放
// b: 垂直倾斜
// c: 水平倾斜
// d: 垂直缩放
// e: 水平平移
// f: 垂直平移

// 清除变换
ctx.setTransform(1, 0, 0, 1, 0, 0);

// 样式
ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
ctx.strokeStyle = '#ff0000';
ctx.lineWidth = 2;
ctx.lineCap = 'butt'; // 'butt', 'round', 'square'
ctx.lineJoin = 'miter'; // 'miter', 'round', 'bevel'
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;

// 渐变
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, 'red');
gradient.addColorStop(1, 'blue');
ctx.fillStyle = gradient;

// 径向渐变
const radialGradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
radialGradient.addColorStop(0, 'red');
radialGradient.addColorStop(1, 'blue');
ctx.fillStyle = radialGradient;

// 图案
const pattern = ctx.createPattern(image, 'repeat');
ctx.fillStyle = pattern;
```

#### 3.1.4 像素操作

```javascript
// 获取像素数据
const imageData = ctx.getImageData(x, y, width, height);
const data = imageData.data; // Uint8ClampedArray

// 修改像素
for (let i = 0; i < data.length; i += 4) {
    // R, G, B, A
    data[i] = 255 - data[i];     // 反转红色
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
    // data[i + 3] 是透明度，保持不变
}

// 放回画布
ctx.putImageData(imageData, x, y);

// 创建 ImageData
const newImageData = ctx.createImageData(width, height);
const newData = newImageData.data;

// 从数组创建 ImageData
const arr = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
const imageDataFromArr = new ImageData(arr, 2, 1);
```

#### 3.1.5 动画与性能

```javascript
// 基础动画循环
function animate() {
    requestAnimationFrame(animate);
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 绘制
    draw();
}

animate();

// 离屏 Canvas
const offscreen = document.createElement('canvas');
offscreen.width = canvas.width;
offscreen.height = canvas.height;
const offCtx = offscreen.getContext('2d');

// 在离屏 Canvas 上绘制
offCtx.drawImage(...);

// 将离屏内容绘制到主 Canvas
ctx.drawImage(offscreen, 0, 0);

// 使用 ImageBitmap
async function createOptimizedImage(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    return imageBitmap;
}

// 使用 ImageBitmap 绘制
ctx.drawImage(imageBitmap, 0, 0);
```

### 3.2 SVG 基础

#### 3.2.1 SVG 元素

```xml
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <!-- 矩形 -->
    <rect x="10" y="10" width="100" height="50" fill="red" stroke="black" stroke-width="2"/>

    <!-- 圆形 -->
    <circle cx="100" cy="100" r="50" fill="blue"/>

    <!-- 椭圆 -->
    <ellipse cx="200" cy="100" rx="80" ry="40" fill="green"/>

    <!-- 直线 -->
    <line x1="0" y1="0" x2="200" y2="200" stroke="black" stroke-width="2"/>

    <!-- 折线 -->
    <polyline points="0,0 50,50 100,25 150,75" fill="none" stroke="black"/>

    <!-- 多边形 -->
    <polygon points="100,10 40,198 190,78 10,78 160,198" fill="lime" stroke="purple"/>

    <!-- 路径 -->
    <path d="M 10 10 L 100 10 L 100 100 Z" fill="red"/>

    <!-- 文本 -->
    <text x="50" y="50" font-family="Arial" font-size="24" fill="black">Hello</text>

    <!-- 组 -->
    <g transform="translate(100, 100)">
        <rect x="0" y="0" width="50" height="50" fill="blue"/>
    </g>
</svg>
```

#### 3.2.2 SVG 变换

```xml
<svg width="400" height="400">
    <!-- 平移 -->
    <rect x="0" y="0" width="50" height="50" fill="red">
        <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="100 100"
            dur="1s"
            fill="freeze"/>
    </rect>

    <!-- 旋转 -->
    <rect x="100" y="100" width="50" height="50" fill="blue" transform="rotate(45, 125, 125)"/>

    <!-- 缩放 -->
    <rect x="200" y="200" width="50" height="50" fill="green" transform="scale(2)"/>

    <!-- 组合变换 -->
    <rect x="300" y="300" width="50" height="50" fill="purple" transform="translate(100, 100) rotate(45) scale(1.5)"/>
</svg>
```

#### 3.2.3 SVG 滤镜与效果

```xml
<svg width="400" height="400">
    <defs>
        <!-- 模糊滤镜 -->
        <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5"/>
        </filter>

        <!-- 阴影滤镜 -->
        <filter id="shadow">
            <feDropShadow dx="3" dy="3" stdDeviation="3" flood-opacity="0.5"/>
        </filter>

        <!-- 渐变 -->
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1"/>
            <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1"/>
        </linearGradient>
    </defs>

    <rect x="10" y="10" width="100" height="100" fill="url(#grad1)" filter="url(#blur)"/>
    <rect x="120" y="10" width="100" height="100" fill="url(#grad1)" filter="url(#shadow)"/>
</svg>
```

#### 3.2.4 JavaScript 操作 SVG

```javascript
// 创建 SVG 元素
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', '400');
svg.setAttribute('height', '400');
document.body.appendChild(svg);

// 创建矩形
const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
rect.setAttribute('x', '10');
rect.setAttribute('y', '10');
rect.setAttribute('width', '100');
rect.setAttribute('height', '100');
rect.setAttribute('fill', 'red');
svg.appendChild(rect);

// 添加事件
rect.addEventListener('click', (e) => {
    console.log('Clicked:', e.target);
});

// 使用 D3.js 操作 SVG
import * as d3 from 'd3';

const svg = d3.select('#svg-container')
    .append('svg')
    .attr('width', 400)
    .attr('height', 400);

svg.append('rect')
    .attr('x', 10)
    .attr('y', 10)
    .attr('width', 100)
    .attr('height', 100)
    .attr('fill', 'blue')
    .on('click', function() {
        d3.select(this).attr('fill', 'red');
    });
```

### 3.3 Canvas 与 SVG 对比

#### 3.3.1 特性对比

| 特性 | Canvas | SVG |
|------|--------|-----|
| 类型 | 位图 | 矢量图 |
| DOM | 无独立元素 | 每个图形是 DOM 元素 |
| 事件处理 | 需要手动实现 | 内置事件支持 |
| 性能（大量对象） | 较差 | 较好 |
| 性能（频繁重绘） | 较好 | 较差 |
| 内存占用 | 较小 | 较大 |
| 图像质量 | 有锯齿，放大失真 | 矢量清晰 |
| 适用场景 | 游戏、图像处理、数据可视化（大量元素） | 图标、图表、UI 组件 |

#### 3.3.2 选择建议

```javascript
// 使用 Canvas 的场景
function shouldUseCanvas(elementCount, interaction) {
    // 大量元素需要频繁重绘
    if (elementCount > 1000 && interaction === 'frequent') {
        return 'Canvas';
    }

    // 需要像素级操作
    if (interaction === 'pixel') {
        return 'Canvas';
    }

    // 游戏开发
    if (interaction === 'game') {
        return 'Canvas';
    }

    return 'SVG';
}

// 使用 SVG 的场景
function shouldUseSVG(elementCount, interaction) {
    // 少量元素，需要交互
    if (elementCount < 1000 && interaction === 'event') {
        return 'SVG';
    }

    // 需要高图像质量
    if (interaction === 'quality') {
        return 'SVG';
    }

    // 需要 SEO 友好
    if (interaction === 'seo') {
        return 'SVG';
    }

    return 'Canvas';
}
```

---

## 第四章 图表库

### 4.1 ECharts 使用详解

#### 4.1.1 ECharts 基础

```html
<!-- 引入 ECharts -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>

<!-- 创建容器 -->
<div id="chart" style="width: 600px; height: 400px;"></div>

<script>
    // 初始化
    const chart = echarts.init(document.getElementById('chart'));

    // 配置
    const option = {
        title: {
            text: '销售数据',
            subtext: '2024年',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['销量', '利润'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '销量',
                type: 'bar',
                data: [150, 230, 224, 218, 135, 147],
                itemStyle: {
                    color: '#5470C6'
                }
            },
            {
                name: '利润',
                type: 'line',
                data: [22, 18, 19, 23, 29, 33],
                itemStyle: {
                    color: '#91CC75'
                }
            }
        ]
    };

    // 设置配置
    chart.setOption(option);

    // 响应式调整
    window.addEventListener('resize', () => {
        chart.resize();
    });
</script>
```

#### 4.1.2 常用图表类型

**折线图：**

```javascript
const lineOption = {
    title: { text: '折线图' },
    tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}'
    },
    xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        name: '数据',
        type: 'line',
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        smooth: true,  // 平滑曲线
        areaStyle: {  // 区域填充
            color: 'rgba(84, 112, 198, 0.3)'
        },
        itemStyle: {
            color: '#5470C6'
        },
        lineStyle: {
            width: 3
        },
        markPoint: {
            data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
            ]
        },
        markLine: {
            data: [
                { type: 'average', name: '平均值' }
            ]
        }
    }]
};
```

**柱状图：**

```javascript
const barOption = {
    title: { text: '柱状图' },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
    },
    xAxis: {
        type: 'category',
        data: ['一月', '二月', '三月', '四月', '五月', '六月']
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        name: '销量',
        type: 'bar',
        data: [150, 230, 224, 218, 135, 147],
        barWidth: '50%',
        itemStyle: {
            borderRadius: [5, 5, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
            ])
        },
        emphasis: {
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#2378f7' },
                    { offset: 0.7, color: '#2378f7' },
                    { offset: 1, color: '#83bff6' }
                ])
            }
        }
    }]
};
```

**饼图：**

```javascript
const pieOption = {
    title: { text: '饼图', left: 'center' },
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 'left'
    },
    series: [{
        name: '访问来源',
        type: 'pie',
        radius: ['40%', '70%'], // 环形饼图
        avoidLabelOverlap: false,
        itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
        },
        label: {
            show: false,
            position: 'center'
        },
        emphasis: {
            label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
            }
        },
        labelLine: {
            show: false
        },
        data: [
            { value: 1048, name: '搜索引擎' },
            { value: 735, name: '直接访问' },
            { value: 580, name: '邮件营销' },
            { value: 484, name: '联盟广告' },
            { value: 300, name: '视频广告' }
        ]
    }]
};
```

**散点图：**

```javascript
const scatterOption = {
    title: { text: '散点图' },
    xAxis: {},
    yAxis: {},
    series: [{
        type: 'scatter',
        symbolSize: 20,
        data: [
            [10.0, 8.04],
            [8.07, 6.95],
            [13.0, 7.58],
            [9.05, 8.81],
            [11.0, 8.33],
            [14.0, 9.96],
            [6.10, 7.24],
            [4.13, 4.26],
            [12.0, 10.84],
            [7.08, 4.82],
            [5.02, 5.68]
        ],
        itemStyle: {
            color: '#5470C6',
            borderColor: '#fff',
            borderWidth: 2
        },
        emphasis: {
            itemStyle: {
                color: '#91CC75',
                borderColor: '#fff',
                borderWidth: 4,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    }]
};
```

**K线图：**

```javascript
const candlestickOption = {
    title: { text: 'K线图' },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
    },
    xAxis: {
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
    },
    yAxis: {},
    series: [{
        type: 'candlestick',
        data: [
            [20, 34, 10, 38],  // [open, close, low, high]
            [40, 35, 30, 55],
            [50, 45, 40, 60],
            [38, 30, 25, 42],
            [35, 40, 32, 45]
        ],
        itemStyle: {
            color: '#ef232a',     // 上涨颜色
            color0: '#14b143',   // 下跌颜色
            borderColor: '#ef232a',
            borderColor0: '#14b143'
        }
    }]
};
```

**关系图：**

```javascript
const graphOption = {
    title: { text: '关系图' },
    tooltip: {},
    series: [{
        type: 'graph',
        layout: 'force',
        data: [
            { name: '节点1', value: 10 },
            { name: '节点2', value: 20 },
            { name: '节点3', value: 15 },
            { name: '节点4', value: 25 }
        ],
        links: [
            { source: '节点1', target: '节点2' },
            { source: '节点2', target: '节点3' },
            { source: '节点3', target: '节点4' },
            { source: '节点4', target: '节点1' }
        ],
        roam: true,
        label: {
            show: true,
            position: 'right'
        },
        force: {
            repulsion: 100,
            edgeLength: 50
        },
        lineStyle: {
            color: '#5470C6',
            width: 2,
            curveness: 0.1
        }
    }]
};
```

#### 4.1.3 地图可视化

```javascript
// 加载地图数据
fetch('china.json')
    .then(response => response.json())
    .then(geoJson => {
        echarts.registerMap('china', geoJson);

        const mapOption = {
            title: { text: '中国地图' },
            tooltip: {
                trigger: 'item',
                formatter: '{b}<br/>销量: {c}'
            },
            visualMap: {
                min: 0,
                max: 500,
                left: 'left',
                top: 'bottom',
                text: ['高', '低'],
                calculable: true,
                inRange: {
                    color: ['#f0f9ff', '#a3d5ff', '#6eb2ff', '#3b8cff', '#0048b3']
                }
            },
            series: [{
                name: '销量',
                type: 'map',
                map: 'china',
                roam: true,
                label: {
                    show: true
                },
                data: [
                    { name: '北京', value: 350 },
                    { name: '上海', value: 420 },
                    { name: '广东', value: 480 },
                    { name: '浙江', value: 320 },
                    { name: '江苏', value: 290 }
                ]
            }]
        };

        chart.setOption(mapOption);
    });
```

#### 4.1.4 高级特性

**数据缩放：**

```javascript
const option = {
    // ...
    dataZoom: [
        {
            type: 'slider',
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 50
        },
        {
            type: 'slider',
            show: true,
            yAxisIndex: [0],
            left: 'right',
            start: 0,
            end: 50
        },
        {
            type: 'inside',
            xAxisIndex: [0],
            start: 0,
            end: 50
        }
    ]
};
```

**多图表联动：**

```javascript
const chart1 = echarts.init(document.getElementById('chart1'));
const chart2 = echarts.init(document.getElementById('chart2'));

chart1.on('updateAxisPointer', function (event) {
    const xAxisInfo = event.axesInfo[0];
    if (xAxisInfo) {
        const dimension = xAxisInfo.value + 1;
        chart2.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            name: xAxisInfo.value
        });
    }
});

chart1.on('mouseout', function () {
    chart2.dispatchAction({
        type: 'downplay',
        seriesIndex: 0
    });
});
```

### 4.2 D3.js 核心

#### 4.2.1 D3 基础

```javascript
import * as d3 from 'd3';

// 选择元素
const svg = d3.select('#container')
    .append('svg')
    .attr('width', 600)
    .attr('height', 400);

// 添加元素
svg.append('rect')
    .attr('x', 10)
    .attr('y', 10)
    .attr('width', 100)
    .attr('height', 50)
    .attr('fill', 'steelblue');

// 绑定数据
const data = [10, 30, 50, 70, 90];

svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => i * 60 + 30)
    .attr('cy', 100)
    .attr('r', d => d / 2)
    .attr('fill', 'steelblue');

// 使用数据集
const dataset = [
    { name: 'A', value: 30 },
    { name: 'B', value: 80 },
    { name: 'C', value: 45 },
    { name: 'D', value: 60 },
    { name: 'E', value: 20 }
];

svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('x', (d, i) => i * 70 + 10)
    .attr('y', (d) => 200 - d.value)
    .attr('width', 50)
    .attr('height', d => d.value)
    .attr('fill', 'steelblue')
    .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', 'orange');
    })
    .on('mouseout', function(event, d) {
        d3.select(this).attr('fill', 'steelblue');
    });
```

#### 4.2.2 比例尺

```javascript
// 线性比例尺
const linearScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 500]);

console.log(linearScale(0));    // 0
console.log(linearScale(50));   // 250
console.log(linearScale(100)); // 500

// 带范围限制的比例尺
const clampedScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 500])
    .clamp(true);

console.log(clampedScale(-10)); // 0
console.log(clampedScale(150)); // 500

// 序数比例尺
const ordinalScale = d3.scaleOrdinal()
    .domain(['A', 'B', 'C', 'D'])
    .range(['red', 'blue', 'green', 'orange']);

console.log(ordinalScale('A')); // 'red'
console.log(ordinalScale('C')); // 'green'

// 带宽离散比例尺
const bandScale = d3.scaleBand()
    .domain(['A', 'B', 'C', 'D'])
    .range([0, 400])
    .padding(0.1);

console.log(bandScale('A')); // 0
console.log(bandScale.bandwidth()); // 90

// 时间比例尺
const timeScale = d3.scaleTime()
    .domain([new Date(2024, 0, 1), new Date(2024, 11, 31)])
    .range([0, 500]);

console.log(timeScale(new Date(2024, 0, 1))); // 0
console.log(timeScale(new Date(2024, 6, 1))); // ~258
```

#### 4.2.3 轴

```javascript
const svg = d3.select('svg');

// X 轴
const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([50, 550]);

const xAxis = d3.axisBottom(xScale);

svg.append('g')
    .attr('transform', 'translate(0, 300)')
    .call(xAxis);

// 自定义轴样式
const customXAxis = d3.axisBottom(xScale)
    .ticks(10)
    .tickFormat(d => d + '%')
    .tickSize(10)
    .tickPadding(5);

// Y 轴
const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([300, 50]);

const yAxis = d3.axisLeft(yScale);

svg.append('g')
    .attr('transform', 'translate(50, 0)')
    .call(yAxis)
    .selectAll('text')
    .attr('font-size', '12px')
    .attr('fill', '#333');
```

#### 4.2.4 数据转换

```javascript
// 堆叠数据
const data = [
    { year: '2020', apples: 30, bananas: 20, cherries: 10 },
    { year: '2021', apples: 25, bananas: 25, cherries: 15 },
    { year: '2022', apples: 35, bananas: 15, cherries: 20 }
];

const stack = d3.stack()
    .keys(['apples', 'bananas', 'cherries']);

const stackedData = stack(data);

console.log(stackedData);
// [
//   [[0, 30], [0, 25], [0, 35]],    // apples
//   [[30, 50], [25, 50], [35, 50]], // bananas
//   [[50, 60], [50, 65], [50, 70]]  // cherries
// ]

// 分组数据
const groupedData = d3.group(data, d => d.year);
console.log(groupedData);
// Map {
//   '2020' => [{ year: '2020', apples: 30, bananas: 20, cherries: 10 }],
//   '2021' => [...],
//   '2022' => [...]
// }

// 嵌套数据
const nestedData = d3.nest()
    .key(d => d.year)
    .entries(data);

// 聚合数据
const rollupData = d3.rollup(data, v => v.length, d => d.year);

// 排序
const sortedData = [...data].sort((a, b) => b.apples - a.apples);

// 比例计算
const pie = d3.pie()
    .value(d => d.value);

const pieData = pie(dataset);
console.log(pieData);
// [{ data: {...}, value: 30, startAngle: 0, endAngle: 1.88, ... }, ...]

// 弧生成器
const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(100);

console.log(arc(pieData[0])); // path string
```

#### 4.2.5 完整示例：力导向图

```javascript
const width = 800;
const height = 600;

const svg = d3.select('#container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const data = {
    nodes: [
        { id: 'A', group: 1 },
        { id: 'B', group: 1 },
        { id: 'C', group: 2 },
        { id: 'D', group: 2 },
        { id: 'E', group: 3 },
        { id: 'F', group: 3 }
    ],
    links: [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' },
        { source: 'E', target: 'F' },
        { source: 'F', target: 'A' }
    ]
};

const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30));

const link = svg.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('stroke-width', 2);

const node = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('r', 15)
    .attr('fill', d => d3.schemeCategory10[d.group])
    .call(drag(simulation));

node.append('title')
    .text(d => d.id);

simulation.on('tick', () => {
    link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
});

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}
```

### 4.3 数据可视化最佳实践

#### 4.3.1 图表选择指南

```
数据可视化图表选择:

├── 比较
│   ├── 类别少 → 柱状图
│   ├── 类别多 → 条形图
│   └── 时间序列 → 折线图
│
├── 分布
│   ├── 单变量 → 直方图
│   ├── 双变量 → 散点图
│   └── 多变量 → 气泡图
│
├── 构成
│   ├── 部分到整体 → 饼图/环形图
│   ├── 随时间变化 → 堆叠面积图
│   └── 占比比较 → 堆叠柱状图
│
├── 趋势
│   ├── 单系列 → 折线图
│   ├── 多系列 → 多线折线图
│   └── 增长率 → 面积图
│
└── 关系
    ├── 两变量 → 散点图
    └── 网络关系 → 关系图/力导向图
```

#### 4.3.2 性能优化

```javascript
// 虚拟滚动 - 处理大数据集
class VirtualScroll {
    constructor(container, itemHeight, data) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.data = data;
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight);
        this.scrollTop = 0;

        this.render();

        container.addEventListener('scroll', () => {
            this.scrollTop = container.scrollTop;
            this.render();
        });
    }

    render() {
        const start = Math.floor(this.scrollTop / this.itemHeight);
        const visibleData = this.data.slice(
            Math.max(0, start - 5),
            Math.min(this.data.length, start + this.visibleCount + 5)
        );

        // 渲染可见数据
    }
}

// 使用 Canvas 渲染大量数据点
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function renderPoints(data, scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'steelblue';

    data.forEach(point => {
        const x = scale.x(point.x);
        const y = scale.y(point.y);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}
```

#### 4.3.3 响应式设计

```javascript
// 创建响应式图表
function createResponsiveChart(container, data) {
    const chart = echarts.init(container);

    const option = {
        // ... 图表配置
    };

    chart.setOption(option);

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
        chart.resize();
    });

    resizeObserver.observe(container);

    return chart;
}

// 断点响应
function getOption(width) {
    if (width < 480) {
        return {
            // 移动端配置
            legend: { show: false },
            tooltip: { show: false }
        };
    } else if (width < 768) {
        return {
            // 平板配置
            legend: { position: 'bottom' }
        };
    } else {
        return {
            // 桌面配置
            legend: { position: 'top' }
        };
    }
}
```

---

## 第五章 WebGL 高级应用

### 5.1 后期处理效果

#### 5.1.1 EffectComposer

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 创建后期处理合成器
const composer = new EffectComposer(renderer);

// 添加渲染通道
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 添加泛光效果
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // 强度
    0.4,  // 半径
    0.85  // 阈值
);
composer.addPass(bloomPass);

// 自定义着色器通道
const customShader = {
    uniforms: {
        tDiffuse: { value: null },
        uVignette: { value: 0.4 },
        uSepia: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uVignette;
        uniform float uSepia;
        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // 暗角效果
            vec2 uv = vUv * (1.0 - vUv.yx);
            float vignette = uv.x * uv.y * 15.0;
            vignette = pow(vignette, uVignette);
            color.rgb *= vignette;

            // 复古效果
            if (uSepia > 0.0) {
                vec3 sepia = vec3(
                    dot(color.rgb, vec3(0.393, 0.769, 0.189)),
                    dot(color.rgb, vec3(0.349, 0.686, 0.168)),
                    dot(color.rgb, vec3(0.272, 0.534, 0.131))
                );
                color.rgb = mix(color.rgb, sepia, uSepia);
            }

            gl_FragColor = color;
        }
    `
};

const customPass = new ShaderPass(customShader);
composer.addPass(customPass);

// 在渲染循环中使用
function animate() {
    requestAnimationFrame(animate);
    composer.render();
}
```

#### 5.1.2 常用后期效果

**景深效果 (Depth of Field)：**

```javascript
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

const bokehPass = new BokehPass(scene, camera, {
    focus: 1.0,
    aperture: 0.025,
    maxblur: 0.01
});
composer.addPass(bokehPass);

// 动态调整焦点
bokehPass.uniforms['focus'].value = focusDistance;
```

**抗锯齿 (FXAA)：**

```javascript
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const fxaaPass = new ShaderPass(FXAAShader);
const pixelRatio = renderer.getPixelRatio();
fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
composer.addPass(fxaaPass);
```

**色彩校正：**

```javascript
const colorCorrectionShader = {
    uniforms: {
        tDiffuse: { value: null },
        uBrightness: { value: 0.0 },
        uContrast: { value: 1.0 },
        uSaturation: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uSaturation;
        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // 亮度
            color.rgb += uBrightness;

            // 对比度
            color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

            // 饱和度
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(gray), color.rgb, uSaturation);

            gl_FragColor = color;
        }
    `
};
```

### 5.2 阴影系统

#### 5.2.1 阴影配置

```javascript
// 渲染器启用阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 光源投射阴影
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;

// 阴影质量配置
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.normalBias = 0.02;

// 物体投射和接收阴影
cube.castShadow = true;
cube.receiveShadow = true;

// 平面接收阴影
plane.receiveShadow = true;
```

#### 5.2.2 阴影优化

```javascript
// 使用阴影级联 (Cascaded Shadow Maps)
import { CascadedShadowMap } from 'three';

renderer.shadowMap.type = THREE.CascadedShadowMap;

// 使用法线贴图替代高分辨率阴影
const material = new THREE.MeshStandardMaterial({
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(1, 1)
});
```

### 5.3 环境贴图与反射

#### 5.3.1 环境贴图加载

```javascript
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// 加载 HDR 环境贴图
new RGBELoader().load('environment.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = texture;
    scene.environment = texture;
});

// 使用 CubeTextureLoader 加载立方体贴图
const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeMap = cubeTextureLoader.load([
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg'
]);
scene.background = cubeMap;
scene.environment = cubeMap;
```

#### 5.3.2 实时反射

```javascript
// 使用 CubeCamera 创建实时反射
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
scene.add(cubeCamera);

// 创建反射材质
const mirrorMaterial = new THREE.MeshStandardMaterial({
    envMap: cubeRenderTarget.texture,
    metalness: 1,
    roughness: 0
});

mirrorObject.material = mirrorMaterial;

// 更新反射
function updateReflection() {
    mirrorObject.visible = false;
    cubeCamera.position.copy(mirrorObject.position);
    cubeCamera.update(renderer, scene);
    mirrorObject.visible = true;
}
```

### 5.4 物理模拟

#### 5.4.1 简单物理模拟

```javascript
// 简单的重力模拟
class PhysicsObject {
    constructor(mesh) {
        this.mesh = mesh;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.mass = 1;
    }

    applyForce(force) {
        this.acceleration.add(force.clone().divideScalar(this.mass));
    }

    update(deltaTime) {
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.acceleration.set(0, 0, 0);
    }
}

// 使用
const gravity = new THREE.Vector3(0, -9.8, 0);
const physicsObject = new PhysicsObject(cube);

function animate() {
    physicsObject.applyForce(gravity);
    physicsObject.update(0.016);
    renderer.render(scene, camera);
}
```

#### 5.4.2 碰撞检测

```javascript
// 简单的球体碰撞检测
function checkSphereCollision(sphere1, sphere2) {
    const distance = sphere1.position.distanceTo(sphere2.position);
    const minDistance = sphere1.geometry.parameters.radius + sphere2.geometry.parameters.radius;

    return distance < minDistance;
}

// 边界碰撞
function checkBoundaryCollision(object, bounds) {
    if (object.position.x > bounds.maxX) {
        object.position.x = bounds.maxX;
        object.velocity.x *= -1;
    }
    if (object.position.x < bounds.minX) {
        object.position.x = bounds.minX;
        object.velocity.x *= -1;
    }
    // ... 其他方向
}
```

---

## 第六章 实战项目示例

### 6.1 3D 产品展示器

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

class ProductViewer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, 3);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;

        this.loadEnvironment();
        this.setupLights();
        this.loadProduct('model.glb');

        window.addEventListener('resize', () => this.onResize());
    }

    async loadEnvironment() {
        const rgbeLoader = new RGBELoader();
        try {
            const texture = await rgbeLoader.loadAsync('environment.hdr');
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.environment = texture;
            this.scene.background = new THREE.Color(0xf5f5f5);
        } catch (error) {
            console.warn('Failed to load HDR, using fallback');
            this.scene.background = new THREE.Color(0xf5f5f5);
        }
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);
    }

    async loadProduct(url) {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync(url);
            this.product = gltf.scene;
            this.product.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.product);
            this.centerProduct();
        } catch (error) {
            console.error('Failed to load product:', error);
            this.createPlaceholder();
        }
    }

    centerProduct() {
        if (!this.product) return;

        const box = new THREE.Box3().setFromObject(this.product);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.product.position.sub(center);
        this.product.position.y += size.y / 2;

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        cameraZ *= 2.5;
        this.camera.position.set(0, size.y / 2, cameraZ);
        this.controls.target.set(0, size.y / 2, 0);
    }

    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.product = new THREE.Mesh(geometry, material);
        this.scene.add(this.product);
        this.centerProduct();
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        const animate = () => {
            requestAnimationFrame(() => this.start());
            this.render();
        };
        animate();
    }
}

// 使用
const viewer = new ProductViewer(document.getElementById('product-viewer'));
viewer.start();
```

### 6.2 数据可视化大屏

```javascript
import * as echarts from 'echarts';

class DataDashboard {
    constructor(container) {
        this.charts = new Map();
        this.initCharts(container);
        this.startAutoRefresh();
    }

    initCharts(container) {
        // 销售趋势图
        this.createChart('sales-trend', {
            title: { text: '销售趋势', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: this.getTimeData() },
            yAxis: { type: 'value' },
            series: [{
                type: 'line',
                data: this.getSalesData(),
                smooth: true,
                areaStyle: { opacity: 0.3 }
            }]
        });

        // 地区分布图
        this.createChart('region-distribution', {
            title: { text: '地区分布', left: 'center' },
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: this.getRegionData()
            }]
        });

        // 产品排名
        this.createChart('product-ranking', {
            title: { text: '产品排名', left: 'center' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: ['产品E', '产品D', '产品C', '产品B', '产品A'] },
            series: [{
                type: 'bar',
                data: [120, 200, 150, 300, 250],
                itemStyle: { borderRadius: [0, 4, 4, 0] }
            }]
        });

        // 实时数据
        this.createChart('realtime-data', {
            title: { text: '实时数据', left: 'center' },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            series: [{
                type: 'line',
                showSymbol: false,
                data: []
            }]
        });
    }

    createChart(id, option) {
        const container = document.getElementById(id);
        if (!container) return;

        const chart = echarts.init(container);
        chart.setOption(option);
        this.charts.set(id, chart);
    }

    getTimeData() {
        const data = [];
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push(date.toLocaleDateString());
        }
        return data;
    }

    getSalesData() {
        return Array.from({ length: 31 }, () => Math.floor(Math.random() * 5000) + 1000);
    }

    getRegionData() {
        return [
            { value: 335, name: '华东' },
            { value: 234, name: '华南' },
            { value: 154, name: '华北' },
            { value: 135, name: '西南' },
            { value: 98, name: '东北' }
        ];
    }

    startAutoRefresh() {
        setInterval(() => {
            this.updateRealtimeData();
        }, 1000);
    }

    updateRealtimeData() {
        const chart = this.charts.get('realtime-data');
        if (!chart) return;

        const now = new Date();
        const value = Math.random() * 100;

        const option = chart.getOption();
        const seriesData = option.series[0].data;
        seriesData.push({ name: now.toString(), value: [now, value] });

        if (seriesData.length > 60) {
            seriesData.shift();
        }

        chart.setOption({
            series: [{ data: seriesData }]
        });
    }

    resize() {
        this.charts.forEach(chart => chart.resize());
    }
}

// 使用
const dashboard = new DataDashboard(document.getElementById('dashboard'));
window.addEventListener('resize', () => dashboard.resize());
```

---

## 总结

本文档详细介绍了 WebGL 与可视化技术的核心知识点，涵盖了：

1. **WebGL 核心知识**：渲染管线、着色器编程、坐标系变换、纹理系统、性能优化
2. **Three.js 框架**：场景图、相机、光照、材质、动画系统
3. **Canvas 与 SVG**：2D 绘图 API、SVG 基础、对比与选择
4. **图表库**：ECharts 配置、D3.js 核心、数据可视化最佳实践
5. **高级应用**：后期处理、阴影系统、物理模拟
6. **实战项目**：产品展示器、数据可视化大屏

这些知识点是前端开发者在可视化领域面试和工作中必备的核心能力。建议读者结合实际项目进行深入学习和实践。

---

> 持续更新中... 如果您发现文档中有任何错误或需要补充的内容，欢迎提交 Issue 或 Pull Request。
