# Canvas绑定与数据可视化完全指南

## 概述

Canvas（画布）是HTML5提供的强大绘图技术，它允许开发者通过JavaScript在网页上绘制图形、创建动画、处理图像以及实现数据可视化。与传统的DOM操作和SVG相比，Canvas提供了更底层的绘图能力，特别适合高性能需求的应用场景。本指南将从零开始，深入讲解Canvas绑定的核心技术，以及如何利用ECharts、Chart.js、D3.js等主流库实现专业级数据可视化。

现代Web应用中，数据可视化扮演着越来越重要的角色。从简单的图表到复杂的数据大屏，从实时监控到地理信息展示，Canvas和相关可视化库为我们提供了丰富的工具集。掌握这些技术，将使你能够创建出既美观又高效的数据展示应用。

---

## 第一部分：Canvas绑定基础

### 1.1 Canvas与SVG、DOM的对比分析

在Web前端开发中，我们有多种方式进行图形绘制和可视化呈现。理解它们之间的差异，有助于我们在实际项目中做出正确的技术选择。

**DOM绘图的局限性**：纯DOM操作适合简单的静态页面元素，如创建div、span等容器元素。DOM元素的渲染需要浏览器维护大量的对象模型，每个元素都会产生大量的DOM节点，当数量达到数千甚至更多时，页面的渲染性能会急剧下降。DOM元素默认支持事件处理和CSS样式定制，但在绘制复杂图形时需要大量的HTML元素堆叠，既不高效也不精确。

**SVG的矢量优势**：SVG（可缩放矢量图形）是一种基于XML的矢量图形描述语言。与DOM类似，SVG也是DOM树的一部分，每个图形元素都是独立的DOM节点。这意味着SVG元素可以直接绑定事件处理器，支持CSS样式和动画。SVG的每个图形都是矢量格式，可以无损缩放而不失真，非常适合图标和简单图形的绘制。然而，SVG的致命缺点是当图形复杂时，DOM节点数量会爆炸式增长，导致严重的性能问题。SVG适合处理数百到数千个图形元素，但当需要绘制数万甚至更多元素时，性能会变得不可接受。

**Canvas的高性能之道**：Canvas是基于像素的位图绘图技术，它使用HTML的canvas元素作为绘图容器，通过JavaScript的2D或WebGL上下文进行绘图。Canvas的核心理念是"一次性绘制"，它不像DOM或SVG那样维护图形对象的树形结构。Canvas在绘制完成后，像素数据就固定在画布上，不再消耗额外的内存来维护图形对象。这使得Canvas特别适合处理大量图形元素的场景，如游戏粒子系统、数据可视化中的散点图、实时数据流绘制等。

| 特性 | DOM | SVG | Canvas |
|------|-----|-----|--------|
| **渲染方式** | 矢量/DOM树 | 矢量/DOM树 | 位图/像素 |
| **图形对象** | 元素节点 | 元素节点 | 无对象维护 |
| **缩放质量** | 受CSS影响 | 无损缩放 | 可能有锯齿 |
| **事件绑定** | 原生支持 | 原生支持 | 需手动计算 |
| **适合元素数量** | <1000 | <5000 | 无限制 |
| **内存占用** | 高 | 中 | 低 |
| **适用场景** | 静态页面 | 简单图形、图标 | 游戏、图表、动画 |

### 1.2 Canvas元素与2D绘图上下文

Canvas的使用从创建一个HTML canvas元素开始。与普通HTML元素不同，canvas是一个画布容器，其本身不绘制任何内容，我们需要在JavaScript中获取其绘图上下文才能进行绑制。

```html
<!-- 最基本的Canvas元素 -->
<canvas id="myCanvas" width="800" height="600"></canvas>

<!-- 推荐：同时指定元素尺寸和绘图区域尺寸 -->
<canvas id="myCanvas2"
        width="800"
        height="600"
        style="width: 800px; height: 600px;">
</canvas>
```

在实际项目中，我们强烈建议同时设置canvas元素的width和height属性（绘图区域尺寸）以及CSS样式中的width和height（显示尺寸）。如果不匹配，Canvas可能会出现拉伸或压缩。理想情况下，这两个尺寸应该保持一致，以避免缩放带来的画质损失。

获取Canvas的2D绘图上下文是进行绑制的第一步。context对象提供了丰富的绑制API，我们可以将它理解为一块画布上的所有绑制工具。下面的代码展示了如何正确获取Canvas上下文并设置绑制基础属性：

```javascript
// 获取Canvas元素和绑制上下文
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d'); // 获取2D上下文，这是最常用的绑制模式

// 设置绑制基础样式
ctx.fillStyle = '#FF5733';      // 设置填充颜色
ctx.strokeStyle = '#33FF57';     // 设置描边颜色
ctx.lineWidth = 2;               // 设置线条宽度
ctx.font = '16px Arial';        // 设置字体
ctx.textAlign = 'center';       // 设置文本对齐方式

// 设置抗锯齿（默认开启）
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high'; // 可选：low, medium, high
```

理解Canvas的坐标系非常重要。Canvas使用标准的笛卡尔坐标系，原点(0, 0)位于画布的左上角，X轴向右延伸，Y轴向下延伸。这与数学中常见的坐标系有所不同，需要特别注意。在后续的坐标变换中，我们将学习如何移动坐标系原点，实现各种绑制效果。

Canvas的一个关键概念是路径（Path）。路径是一系列由直线和曲线组成的图形边界。要绘制复杂的图形，我们需要先创建路径，然后对其进行填充或描边。路径的创建使用beginPath方法开始，使用closePath方法结束（如果需要闭合路径）。以下代码展示了绑制基本图形的完整流程：

```javascript
// 创建完整的Canvas绘图流程
function drawBasicShapes() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 清空画布（可选背景色）
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制矩形：填充方式
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(50, 50, 200, 100); // x, y, width, height

    // 绘制矩形：描边方式
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 3;
    ctx.strokeRect(300, 50, 200, 100);

    // 绘制矩形：清除区域（相当于遮罩）
    ctx.clearRect(100, 75, 100, 50);

    // 绘制圆形：先创建路径，再填充
    ctx.beginPath();
    ctx.arc(150, 250, 80, 0, Math.PI * 2); // 圆心x, 圆心y, 半径, 起始角, 结束角
    ctx.fillStyle = '#2ECC71';
    ctx.fill();

    // 绘制弧线
    ctx.beginPath();
    ctx.arc(400, 250, 80, 0, Math.PI, false); // 半圆
    ctx.strokeStyle = '#9B59B6';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 绘制直线
    ctx.beginPath();
    ctx.moveTo(550, 150); // 移动到起点
    ctx.lineTo(650, 250); // 画线到终点
    ctx.lineTo(550, 350); // 继续画线
    ctx.closePath();      // 闭合路径
    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 3;
    ctx.stroke();
}
```

### 1.3 绑定API详解：线、矩形、圆形、文本、图片

Canvas提供了丰富的绑制API，本节将详细讲解各种绑定方法的使用技巧和注意事项。

**线条绑制**是Canvas中最基础的操作之一。通过lineTo方法可以绘制直线，而通过设置lineCap和lineJoin属性可以控制线条端点和连接处的样式。lineCap有三个可选值：butt（平头，默认）、round（圆头）和square（方头）。lineJoin有三个可选值：miter（尖角，默认）、round（圆角）和bevel（斜角）。合理使用这些属性可以使绑制的线条更加美观。

```javascript
// 线条绑制详解
function drawLines() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 清空画布
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 基础线条
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(200, 50);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 线条端点样式（lineCap）
    const lineCaps = ['butt', 'round', 'square'];
    const startY = 100;

    lineCaps.forEach((cap, index) => {
        ctx.beginPath();
        ctx.lineCap = cap;
        ctx.moveTo(50, startY + index * 40);
        ctx.lineTo(200, startY + index * 40);
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 10;
        ctx.stroke();

        // 标注线条类型
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`lineCap: ${cap}`, 220, startY + index * 40 + 4);
    });

    // 线条连接样式（lineJoin）
    const lineJoins = ['miter', 'round', 'bevel'];
    const startX = 350;

    lineJoins.forEach((join, index) => {
        ctx.beginPath();
        ctx.lineJoin = join;
        ctx.moveTo(startX, 100 + index * 60);
        ctx.lineTo(startX + 80, 150 + index * 60);
        ctx.lineTo(startX + 160, 100 + index * 60);
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 15;
        ctx.stroke();

        // 标注连接类型
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`lineJoin: ${join}`, startX + 180, 130 + index * 60);
    });

    // 虚线绑制
    ctx.beginPath();
    ctx.setLineDash([10, 5]); // 设置虚线模式：10像素实线，5像素间隔
    ctx.moveTo(50, 350);
    ctx.lineTo(250, 350);
    ctx.strokeStyle = '#9B59B6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 还原为实线
    ctx.setLineDash([]);
}
```

**矩形绑制**是日常开发中最常用的操作之一。Canvas提供了三种矩形绑制方法：fillRect用于绘制填充矩形，strokeRect用于绘制矩形边框，clearRect用于清除指定区域。这三个方法都是直接绑制，无需像圆形那样先创建路径。如果需要同时绘制填充和边框，建议先fillRect再strokeRect，这样描边会紧贴填充区域的外边缘。

```javascript
// 矩形绑制详解
function drawRectangles() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 圆角矩形绑制（Canvas原生不支持，需要通过路径实现）
    function drawRoundedRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 绘制圆角矩形
    drawRoundedRect(50, 50, 150, 80, 15);
    ctx.fillStyle = '#3498DB';
    ctx.fill();

    // 渐变填充矩形
    const gradient = ctx.createLinearGradient(250, 50, 400, 130);
    gradient.addColorStop(0, '#3498DB');
    gradient.addColorStop(0.5, '#8E44AD');
    gradient.addColorStop(1, '#E74C3C');

    ctx.fillStyle = gradient;
    ctx.fillRect(250, 50, 150, 80);

    // 带阴影的矩形
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(450, 50, 150, 80);

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 半透明矩形
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    ctx.fillRect(50, 170, 150, 80);
}
```

**圆形和弧线绑制**是Canvas绑制中的难点。arc方法是绑制圆弧的核心，它接受圆心坐标、半径、起始角度、结束角度和是否逆时针绑制这五个参数。需要特别注意的是，Canvas中的角度使用的是弧度制，而非角度制。弧度与角度的转换公式是：弧度 = 角度 × (Math.PI / 180)。一个完整的圆是2π弧度。

```javascript
// 圆形和弧线绑制详解
function drawCircles() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 完整的圆
    ctx.beginPath();
    ctx.arc(100, 100, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#3498DB';
    ctx.fill();

    // 绘制内嵌文字
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('圆形', 100, 100);

    // 弧线绑制
    const arcPositions = [
        { x: 250, startAngle: 0, endAngle: Math.PI / 2, label: '第一象限' },
        { x: 400, startAngle: Math.PI / 2, endAngle: Math.PI, label: '第二象限' },
        { x: 550, startAngle: Math.PI, endAngle: Math.PI * 1.5, label: '第三象限' },
    ];

    arcPositions.forEach((arc) => {
        ctx.beginPath();
        ctx.arc(arc.x, 100, 60, arc.startAngle, arc.endAngle);
        ctx.lineTo(arc.x, 100); // 连接到圆心，形成扇形
        ctx.closePath();
        ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(arc.label, arc.x, 140);
    });

    // 贝塞尔曲线绑制
    ctx.beginPath();
    ctx.moveTo(50, 250);
    // 二次贝塞尔曲线：只有一个控制点
    ctx.quadraticCurveTo(150, 150, 250, 250);
    ctx.strokeStyle = '#9B59B6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(300, 250);
    // 三次贝塞尔曲线：有两个控制点
    ctx.bezierCurveTo(350, 150, 450, 350, 550, 250);
    ctx.strokeStyle = '#2ECC71';
    ctx.stroke();
}
```

**文本绑制**在数据可视化中扮演着重要角色，无论是坐标轴标签、图例说明还是数据标注，都需要使用文本绑制功能。Canvas提供了fillText和strokeText两个方法分别用于填充文本和描边文本，同时可以通过measureText方法获取文本的宽度，用于精确布局。

```javascript
// 文本绑制详解
function drawText() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 基础文本绑制
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.fillText('基础文本绑制', 50, 50);

    // 文本对齐方式
    ctx.font = '16px Arial';
    const alignOptions = ['left', 'center', 'right'];
    const alignLabels = ['左对齐', '居中', '右对齐'];
    const baseY = 100;

    alignOptions.forEach((align, index) => {
        ctx.textAlign = align;
        const x = 300; // 所有文本的参考x坐标

        // 绘制参考线
        ctx.strokeStyle = '#DDD';
        ctx.beginPath();
        ctx.moveTo(x, baseY + index * 40 - 20);
        ctx.lineTo(x, baseY + index * 40 + 10);
        ctx.stroke();

        ctx.fillStyle = '#3498DB';
        ctx.fillText(alignLabels[index], x, baseY + index * 40);
    });

    // 文本垂直对齐
    ctx.textAlign = 'left';
    const baselineOptions = ['top', 'middle', 'bottom', 'alphabetic'];
    const baselineLabels = ['顶部对齐', '垂直居中', '底部对齐', '字母基线'];
    const baseX = 50;

    baselineOptions.forEach((baseline, index) => {
        ctx.textBaseline = baseline;
        const y = 250 + index * 40;

        // 绘制参考线
        ctx.strokeStyle = '#DDD';
        ctx.beginPath();
        ctx.moveTo(baseX, y);
        ctx.lineTo(baseX + 200, y);
        ctx.stroke();

        ctx.fillStyle = '#E74C3C';
        ctx.fillText(baselineLabels[index], baseX, y);
    });

    // 获取文本宽度
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const text = '测量这段文字的宽度';
    ctx.font = '18px Arial';
    const metrics = ctx.measureText(text);
    console.log(`文本宽度: ${metrics.width}`);

    // 自动换行文本绑制
    function drawWrappedText(text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    ctx.fillStyle = '#333';
    drawWrappedText('这是一段很长的文本，需要自动换行显示以适应有限的宽度约束。', 50, 420, 300, 24);
}
```

**图片绑制**是Canvas的重要功能之一，它允许我们在画布上绘制图片、视频帧甚至其他Canvas元素。drawImage方法非常灵活，它有三种调用方式：只指定目标位置（缩放到指定尺寸）、指定目标位置和尺寸（拉伸或缩小）、以及指定源区域和目标区域（裁剪）。图片加载是异步操作，需要特别注意。

```javascript
// 图片绑制详解
function drawImages() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 创建图片对象
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 设置跨域属性，避免污染 Canvas

    img.onload = function() {
        // 方式一：只指定绘制位置，图片保持原始尺寸
        ctx.drawImage(img, 50, 50);

        // 方式二：指定绘制位置和尺寸（可拉伸/缩放）
        ctx.drawImage(img, 250, 50, 200, 150);

        // 方式三：指定源区域和目标区域（裁剪并缩放）
        // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // sx, sy: 源图像的起始坐标
        // sWidth, sHeight: 源图像的裁剪区域尺寸
        // dx, dy: 目标画布的起始坐标
        // dWidth, dHeight: 目标绘制区域的尺寸
        ctx.drawImage(img, 0, 0, 100, 100, 500, 50, 150, 150);

        // 绘制图片边框
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 2;
        ctx.strokeRect(500, 50, 150, 150);
    };

    img.onerror = function() {
        console.error('图片加载失败');
        // 加载失败时绘制占位符
        ctx.fillStyle = '#EEE';
        ctx.fillRect(50, 50, 200, 200);
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('图片加载失败', 150, 130);
    };

    img.src = 'https://via.placeholder.com/400x300';

    // 绘制背景图案（可平铺）
    function createPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const patternCtx = patternCanvas.getContext('2d');

        // 创建简单的格子图案
        patternCtx.fillStyle = '#F0F0F0';
        patternCtx.fillRect(0, 0, 20, 20);
        patternCtx.fillStyle = '#E0E0E0';
        patternCtx.fillRect(0, 0, 10, 10);
        patternCtx.fillRect(10, 10, 10, 10);

        return ctx.createPattern(patternCanvas, 'repeat');
    }

    // 使用图案填充
    ctx.fillStyle = createPattern();
    ctx.fillRect(50, 280, 300, 200);
}
```

### 1.4 坐标变换：translate、rotate、scale

Canvas的坐标变换是一套强大的功能，它允许我们对整个绑制上下文进行平移、旋转、缩放等操作。理解坐标变换对于创建复杂图形和动画至关重要。需要特别注意的是，坐标变换是累加的，如果我们需要在变换后恢复原始状态，应该使用save和restore方法。

**平移变换（translate）**是最基础的坐标变换，它将坐标系的原点移动到指定位置。在绑制重复元素时，平移变换特别有用。例如，如果我们需要在画布的多个位置绑制相同的图形，可以先将原点移动到目标位置，然后绑制，绑制完成后再移动回原位置。

```javascript
// 坐标变换详解：平移、旋转、缩放
function drawWithTransforms() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 保存初始状态
    ctx.save();

    // 1. 平移变换（translate）
    // 将坐标系原点从(0,0)移动到(100, 100)
    ctx.translate(100, 100);

    ctx.fillStyle = '#3498DB';
    ctx.fillRect(0, 0, 100, 60); // 现在(0,0)实际上在画布的(100,100)位置

    ctx.restore(); // 恢复到初始状态

    // 2. 旋转变换（rotate）
    // 旋转是以当前坐标系原点为中心的顺时针旋转
    ctx.save();
    ctx.translate(300, 100);
    ctx.rotate(Math.PI / 6); // 旋转30度（Math.PI = 180度）

    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(-50, -30, 100, 60); // 绑制一个相对于新原点的矩形
    ctx.restore();

    // 3. 缩放变换（scale）
    // scale接收两个参数：x方向的缩放比例和y方向的缩放比例
    ctx.save();
    ctx.translate(500, 100);
    ctx.scale(1.5, 0.8); // x方向放大1.5倍，y方向缩小到0.8倍

    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(-50, -30, 100, 60); // 实际显示的尺寸会被缩放变换影响
    ctx.restore();

    // 4. 综合变换：绘制旋转的星形
    function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
        ctx.save();
        ctx.translate(cx, cy);

        let rot = Math.PI / 2 * 3; // 起始角度（稍微偏移，使星形向上）
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes; // 每个角的弧度

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius); // 从第一个顶点开始

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius); // 回到第一个顶点
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.restore();
    }

    // 绘制多颗旋转的星星
    const colors = ['#F1C40F', '#E74C3C', '#9B59B6', '#1ABC9C', '#3498DB'];
    for (let i = 0; i < 5; i++) {
        drawStar(
            100 + i * 80, // x坐标
            350,           // y坐标
            5,             // 顶点数
            30,            // 外圆半径
            15,            // 内圆半径
            colors[i]      // 颜色
        );
    }

    // 5. 矩阵变换（transform）
    // transform允许我们直接操作变换矩阵
    // transform(a, b, c, d, e, f)
    // a: 水平缩放
    // b: 水平倾斜
    // c: 垂直倾斜
    // d: 垂直缩放
    // e: 水平平移
    // f: 垂直平移
    ctx.save();
    ctx.transform(1, 0.2, 0, 1, 500, 300); // 应用斜切变换
    ctx.fillStyle = '#E67E22';
    ctx.fillRect(0, 0, 100, 60);
    ctx.restore();
}
```

**坐标变换的实际应用**非常广泛。在游戏开发中，我们可以利用旋转变换来实现飞船或子弹的方向调整；在数据可视化中，我们可以利用平移和旋转变换来绑制带角度的坐标轴标签；在图形编辑软件中，缩放变换是实现缩放功能的基础。

```javascript
// 坐标变换的实战应用：绘制饼图
function drawPieChart() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 饼图数据
    const data = [
        { label: '直接访问', value: 335, color: '#3498DB' },
        { label: '搜索引擎', value: 310, color: '#E74C3C' },
        { label: '社交媒体', value: 234, color: '#2ECC71' },
        { label: '推荐链接', value: 135, color: '#F39C12' },
        { label: '广告推广', value: 1548, color: '#9B59B6' },
    ];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    // 计算总值
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // 计算每个扇形的起始和结束角度
    let currentAngle = -Math.PI / 2; // 从12点钟方向开始

    data.forEach((item) => {
        const sliceAngle = (item.value / total) * Math.PI * 2;

        // 保存状态
        ctx.save();

        // 移动坐标系到圆心
        ctx.translate(centerX, centerY);

        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();

        // 绘制标签连线
        const midAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius + 30;
        const labelX = Math.cos(midAngle) * labelRadius;
        const labelY = Math.sin(midAngle) * labelRadius;

        ctx.beginPath();
        ctx.moveTo(Math.cos(midAngle) * radius, Math.sin(midAngle) * radius);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制标签文字
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${item.label} (${item.value})`, labelX, labelY);

        // 恢复状态
        ctx.restore();

        // 更新角度
        currentAngle += sliceAngle;
    });
}
```

### 1.5 离屏Canvas与双缓冲

离屏Canvas（Offscreen Canvas）是一个不在页面上显示的Canvas元素，我们可以在它上面预先绘制内容，然后一次性将结果绘制到主Canvas上。这种技术可以显著提高绑制性能，特别是在需要重复绘制复杂图形的场景中。双缓冲则是利用离屏Canvas来解决闪烁问题的一种技术，它先在后台缓冲区绑制，完成后再一次性显示到屏幕上。

**离屏Canvas的基本用法**很简单。首先创建一个Canvas元素或通过JavaScript动态创建一个Canvas元素，然后在上面获取绘图上下文进行绘制。绘制完成后，使用drawImage方法将离屏Canvas的内容绘制到主Canvas上。

```javascript
// 离屏Canvas与双缓冲技术
function setupOffscreenCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // 方法一：创建DOM离屏Canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 200;
    offscreenCanvas.height = 200;
    const offCtx = offscreenCanvas.getContext('2d');

    // 在离屏Canvas上绘制复杂图形
    function drawComplexShape(context) {
        // 绘制一个复杂的图案（作为示例）
        context.fillStyle = '#3498DB';
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const x = i * 20;
                const y = j * 20;
                const size = Math.random() * 15 + 5;
                context.fillRect(x, y, size, size);
            }
        }
    }

    drawComplexShape(offCtx);

    // 方法二：使用transferToImageBitmap实现高速位图传输
    // 这种方式在某些浏览器中可以获得更好的性能
    let imageBitmap;
    offCtx.transferToImageBitmap().then((bitmap) => {
        imageBitmap = bitmap;
    });

    // 将离屏Canvas绘制到主Canvas
    ctx.drawImage(offscreenCanvas, 50, 50);

    // 方法三：绘制离屏Canvas的局部区域
    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(offscreenCanvas, 50, 50, 100, 100, 300, 50, 100, 100);
}
```

**双缓冲技术的实现**是离屏Canvas的重要应用场景。在传统的Canvas绑制中，如果每一帧的绑制过程较长，用户可能会看到绑制的中间过程，导致画面闪烁。双缓冲通过先在后台Canvas上完成所有绑制，然后一次性将结果复制到前台Canvas来解决这个问题。

```javascript
// 双缓冲实现：解决动画闪烁问题
class DoubleBufferedRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 创建后台缓冲区
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCanvas.width = this.canvas.width;
        this.bufferCanvas.height = this.canvas.height;
        this.bufferCtx = this.bufferCanvas.getContext('2d');

        this.isReady = false;
    }

    // 在后台缓冲区绘制
    drawToBuffer(drawFunction) {
        // 调用绘制函数，传入后台上下文字符
        drawFunction(this.bufferCtx);

        // 标记缓冲区已准备好
        this.isReady = true;
    }

    // 将缓冲区内容刷新到前台
    flush() {
        if (this.isReady) {
            // 使用drawImage进行高速复制
            this.ctx.drawImage(this.bufferCanvas, 0, 0);
            this.isReady = false;
        }
    }

    // 清空缓冲区
    clearBuffer() {
        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
    }

    // 清空前台画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 使用双缓冲渲染器进行动画绑制
function animateWithDoubleBuffer() {
    const renderer = new DoubleBufferedRenderer('myCanvas');

    // 动画粒子数组
    const particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 5 + 2,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        });
    }

    // 动画循环
    function animate() {
        // 在缓冲区中绘制
        renderer.drawToBuffer((ctx) => {
            // 清空缓冲区
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, 800, 600);

            // 更新和绑制粒子
            particles.forEach((p) => {
                // 更新位置
                p.x += p.vx;
                p.y += p.vy;

                // 边界检测
                if (p.x < 0 || p.x > 800) p.vx *= -1;
                if (p.y < 0 || p.y > 600) p.vy *= -1;

                // 绘制粒子
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
        });

        // 刷新到前台
        renderer.flush();

        // 继续下一帧
        requestAnimationFrame(animate);
    }

    animate();
}
```

现代浏览器还支持OffscreenCanvas API，这是一种worker线程版本的Canvas。它允许在Web Worker中进行绑制操作，然后将绑制结果传输到主线程。这对于计算密集型的可视化任务特别有用，可以避免阻塞主线程。OffscreenCanvas的基本用法与传统Canvas类似，主要区别在于它的创建方式和上下文获取方式。

---

## 第二部分：动画与交互

### 2.1 requestAnimationFrame动画循环

requestAnimationFrame是现代浏览器提供的用于动画绑制的API，它告诉浏览器希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数来更新动画。相对于setInterval或setTimeout，requestAnimationFrame有以下几个优势：它与浏览器的刷新频率同步（通常是60fps），当页面处于后台或不可见时会自动暂停以节省资源，而且浏览器可以自动优化多个动画的合并。

```javascript
// requestAnimationFrame动画基础
class Animation基础 {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.lastTime = 0;
        this.animationId = null;

        // 动画状态
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 3, // 水平速度
            vy: 2, // 垂直速度
            radius: 20,
            color: '#3498DB',
        };
    }

    // 绘制函数：每一帧都会调用
    draw() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // 半透明覆盖实现拖尾效果
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新位置
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // 边界检测
        if (this.ball.x - this.ball.radius < 0 ||
            this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.vx *= -1;
        }
        if (this.ball.y - this.ball.radius < 0 ||
            this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.vy *= -1;
        }

        // 绘制球体
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fill();
    }

    // 动画循环核心
    animate(currentTime) {
        if (!this.isRunning) return;

        // 计算时间间隔（用于基于时间的动画）
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 执行绘制
        this.draw();

        // 递归调用requestAnimationFrame
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    // 开始动画
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    // 停止动画
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
```

在实际开发中，我们经常需要基于时间进行动画计算，以确保动画速度与帧率无关。下面的代码展示了一个更完善的动画系统，它支持基于时间戳的精确动画控制：

```javascript
// 基于时间的精确动画系统
class PreciseAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.startTime = 0;
        this.isRunning = false;

        // 多个动画对象
        this.objects = [];
    }

    // 添加动画对象
    addObject(obj) {
        this.objects.push({
            x: obj.x || 0,
            y: obj.y || 0,
            targetX: obj.targetX || 0,
            targetY: obj.targetY || 0,
            speed: obj.speed || 100, // 像素每秒
            radius: obj.radius || 10,
            color: obj.color || '#3498DB',
        });
    }

    // 线性插值
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // 绘制所有对象
    draw(elapsedTime) {
        // 清空画布
        this.ctx.fillStyle = '#FAFAFA';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.objects.forEach((obj) => {
            // 计算当前位置（基于时间）
            const duration = Math.sqrt(
                Math.pow(obj.targetX - obj.x, 2) +
                Math.pow(obj.targetY - obj.y, 2)
            ) / obj.speed * 1000; // 持续时间（毫秒）

            const t = Math.min(elapsedTime / duration, 1); // 0到1的进度

            // 使用缓动函数
            const easeT = this.easeInOutQuad(t);

            const currentX = this.lerp(obj.x, obj.targetX, easeT);
            const currentY = this.lerp(obj.y, obj.targetY, easeT);

            // 绘制
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, obj.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = obj.color;
            this.ctx.fill();

            // 绘制目标点标记
            this.ctx.beginPath();
            this.ctx.arc(obj.targetX, obj.targetY, 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = obj.color;
            this.ctx.stroke();
        });
    }

    // 缓动函数：二次方缓入缓出
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // 动画循环
    animate(timestamp) {
        if (!this.isRunning) return;

        // 计算已过时间
        const elapsedTime = timestamp - this.startTime;

        // 绘制
        this.draw(elapsedTime);

        // 继续下一帧
        requestAnimationFrame((time) => this.animate(time));
    }

    start() {
        this.isRunning = true;
        this.startTime = performance.now();
        requestAnimationFrame((time) => this.animate(time));
    }

    stop() {
        this.isRunning = false;
    }
}
```

### 2.2 碰撞检测：矩形、圆形、点与图形碰撞

碰撞检测是游戏开发和交互式应用中不可或缺的技术。根据图形的形状和检测精度的要求，我们需要选择合适的碰撞检测算法。

**矩形碰撞检测**是最简单的碰撞检测形式，也称为AABB（Axis-Aligned Bounding Box，轴对齐边界框）碰撞检测。这种方法假设物体的边界框与坐标轴平行，因此只需要比较两个矩形的边界坐标即可。

```javascript
// 矩形碰撞检测
class RectangleCollision {
    // AABB矩形碰撞检测
    // 这种方法假设矩形与坐标轴平行（没有旋转）
    static checkRectRect(rect1, rect2) {
        // rect格式: { x, y, width, height }
        // x, y是矩形左上角的坐标
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // 点是否在矩形内
    static checkPointRect(point, rect) {
        return (
            point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.y >= rect.y &&
            point.y <= rect.y + rect.height
        );
    }

    // 旋转矩形碰撞检测（OBB）
    // 使用分离轴定理（SAT）进行碰撞检测
    static checkOBBOBB(rect1, rect2) {
        // rect格式: { cx, cy, width, height, angle }
        // cx, cy是矩形中心坐标，angle是旋转角度（弧度）

        const corners1 = this.getRotatedCorners(rect1);
        const corners2 = this.getRotatedCorners(rect2);

        // 检查所有可能的分离轴
        const axes = [
            this.getNormal(corners1[0], corners1[1]),
            this.getNormal(corners1[1], corners1[2]),
            this.getNormal(corners2[0], corners2[1]),
            this.getNormal(corners2[1], corners2[2]),
        ];

        for (const axis of axes) {
            const projection1 = this.projectPolygon(corners1, axis);
            const projection2 = this.projectPolygon(corners2, axis);

            // 如果投影不重叠，则没有碰撞
            if (projection1.max < projection2.min || projection2.max < projection1.min) {
                return false;
            }
        }

        return true; // 所有轴都不分离，存在碰撞
    }

    // 获取旋转矩形的四个角点
    static getRotatedCorners(rect) {
        const cos = Math.cos(rect.angle);
        const sin = Math.sin(rect.angle);
        const hw = rect.width / 2;
        const hh = rect.height / 2;

        return [
            { x: rect.cx + cos * -hw - sin * -hh, y: rect.cy + sin * -hw + cos * -hh },
            { x: rect.cx + cos * hw - sin * -hh, y: rect.cy + sin * hw + cos * -hh },
            { x: rect.cx + cos * hw - sin * hh, y: rect.cy + sin * hw + cos * hh },
            { x: rect.cx + cos * -hw - sin * hh, y: rect.cy + sin * -hw + cos * hh },
        ];
    }

    // 获取边的法向量
    static getNormal(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        return { x: -dy / len, y: dx / len };
    }

    // 将多边形投影到轴上
    static projectPolygon(corners, axis) {
        let min = Infinity;
        let max = -Infinity;

        for (const corner of corners) {
            const projection = corner.x * axis.x + corner.y * axis.y;
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }

        return { min, max };
    }
}
```

**圆形碰撞检测**基于两个圆的圆心距离与半径之和的比较。如果圆心距离小于半径之和，则两个圆相交。这种检测方法计算简单，效率很高。

```javascript
// 圆形碰撞检测
class CircleCollision {
    // 两圆碰撞检测
    static checkCircleCircle(circle1, circle2) {
        // circle格式: { x, y, radius }
        const dx = circle2.x - circle1.x;
        const dy = circle2.y - circle1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < circle1.radius + circle2.radius;
    }

    // 点到圆心的距离
    static distanceToCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 点是否在圆内（包括边界）
    static checkPointCircle(point, circle) {
        return this.distanceToCircle(point, circle) <= circle.radius;
    }

    // 圆与矩形碰撞检测
    static checkCircleRect(circle, rect) {
        // 找到矩形上离圆心最近的点
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // 计算距离
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < circle.radius;
    }

    // 碰撞响应：计算碰撞后反弹速度
    static resolveCollision(circle1, circle2) {
        const dx = circle2.x - circle1.x;
        const dy = circle2.y - circle1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // 避免除零

        // 碰撞法向量
        const nx = dx / distance;
        const ny = dy / distance;

        // 相对速度
        const dvx = circle1.vx - circle2.vx;
        const dvy = circle1.vy - circle2.vy;

        // 相对速度在碰撞法向量上的投影
        const dvn = dvx * nx + dvy * ny;

        // 如果物体正在分离，不处理
        if (dvn > 0) return;

        // 假设质量相等，计算冲量
        const impulse = dvn;

        // 应用冲量
        circle1.vx -= impulse * nx;
        circle1.vy -= impulse * ny;
        circle2.vx += impulse * nx;
        circle2.vy += impulse * ny;

        // 分离重叠的物体
        const overlap = circle1.radius + circle2.radius - distance;
        if (overlap > 0) {
            circle1.x -= overlap / 2 * nx;
            circle1.y -= overlap / 2 * ny;
            circle2.x += overlap / 2 * nx;
            circle2.y += overlap / 2 * ny;
        }
    }
}
```

**更复杂的碰撞检测**包括多边形碰撞、光线投射碰撞等。光线投射碰撞特别适用于点击检测，它通过从点击点向场景发射一条光线，然后检测这条光线与各个图形的交点，来确定被点击的对象。

```javascript
// 光线投射碰撞检测（用于精确的点击检测）
class RaycastCollision {
    // 点到线段的最近点
    static closestPointOnSegment(point, segStart, segEnd) {
        const dx = segEnd.x - segStart.x;
        const dy = segEnd.y - segStart.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            // 线段是一个点
            return { x: segStart.x, y: segStart.y };
        }

        // 计算投影比例t
        let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t)); // 限制在线段范围内

        return {
            x: segStart.x + t * dx,
            y: segStart.y + t * dy,
        };
    }

    // 点到线段的距离
    static distanceToSegment(point, segStart, segEnd) {
        const closest = this.closestPointOnSegment(point, segStart, segEnd);
        const dx = point.x - closest.x;
        const dy = point.y - closest.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 点是否靠近线段（在指定阈值内）
    static isNearSegment(point, segStart, segEnd, threshold) {
        return this.distanceToSegment(point, segStart, segEnd) <= threshold;
    }

    // 光线与圆相交检测
    static rayCircleIntersect(rayOrigin, rayDirection, circle) {
        // rayOrigin: 光线起点 {x, y}
        // rayDirection: 光线方向（归一化）{x, y}
        // circle: 圆 {x, y, radius}

        const oc = {
            x: rayOrigin.x - circle.x,
            y: rayOrigin.y - circle.y,
        };

        const a = rayDirection.x * rayDirection.x + rayDirection.y * rayDirection.y;
        const b = 2 * (oc.x * rayDirection.x + oc.y * rayDirection.y);
        const c = oc.x * oc.x + oc.y * oc.y - circle.radius * circle.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return null; // 没有交点
        }

        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        // 返回最近的交点
        if (t1 > 0) {
            return {
                x: rayOrigin.x + t1 * rayDirection.x,
                y: rayOrigin.y + t1 * rayDirection.y,
                t: t1,
            };
        } else if (t2 > 0) {
            return {
                x: rayOrigin.x + t2 * rayDirection.x,
                y: rayOrigin.y + t2 * rayDirection.y,
                t: t2,
            };
        }

        return null; // 光线在圆内但没有向前的交点
    }

    // 点是否在多边形内（射线投射法）
    static isPointInPolygon(point, polygon) {
        // polygon: 多边形顶点数组 [{x, y}, ...]
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }
}
```

### 2.3 鼠标事件处理：点击、悬停、拖拽

Canvas本身不提供图形对象的事件绑定，我们需要手动处理鼠标事件并通过碰撞检测来确定是哪个图形被操作。以下是一个完整的事件处理系统：

```javascript
// Canvas鼠标事件处理系统
class CanvasEventHandler {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 事件回调
        this.onClick = null;
        this.onMouseMove = null;
        this.onMouseDown = null;
        this.onMouseUp = null;
        this.onDragStart = null;
        this.onDrag = null;
        this.onDragEnd = null;

        // 拖拽状态
        this.isDragging = false;
        this.dragTarget = null;
        this.lastMousePos = { x: 0, y: 0 };

        // 鼠标位置
        this.mousePos = { x: 0, y: 0 };

        // 绑制对象列表
        this.objects = [];

        // 初始化事件监听
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 获取鼠标在Canvas上的相对位置
        const getMousePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        };

        // 点击事件
        this.canvas.addEventListener('click', (e) => {
            const pos = getMousePos(e);
            const target = this.findObjectAtPoint(pos);

            if (target && this.onClick) {
                this.onClick(target, pos);
            }
        });

        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const pos = getMousePos(e);
            const prevPos = this.mousePos;
            this.mousePos = pos;

            // 检测悬停
            const target = this.findObjectAtPoint(pos);
            this.canvas.style.cursor = target ? 'pointer' : 'default';

            if (this.onMouseMove) {
                this.onMouseMove(target, pos, prevPos);
            }

            // 处理拖拽
            if (this.isDragging && this.dragTarget) {
                const dx = pos.x - this.lastMousePos.x;
                const dy = pos.y - this.lastMousePos.y;

                if (this.onDrag) {
                    this.onDrag(this.dragTarget, dx, dy, pos);
                }

                this.lastMousePos = pos;
            }
        });

        // 鼠标按下事件
        this.canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            const target = this.findObjectAtPoint(pos);

            if (target) {
                this.isDragging = true;
                this.dragTarget = target;
                this.lastMousePos = pos;

                if (this.onDragStart) {
                    this.onDragStart(target, pos);
                }
            }

            if (this.onMouseDown) {
                this.onMouseDown(target, pos);
            }
        });

        // 鼠标释放事件
        this.canvas.addEventListener('mouseup', (e) => {
            const pos = getMousePos(e);

            if (this.isDragging && this.onDragEnd) {
                this.onDragEnd(this.dragTarget, pos);
            }

            this.isDragging = false;
            this.dragTarget = null;

            if (this.onMouseUp) {
                this.onMouseUp(pos);
            }
        });

        // 鼠标离开Canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.dragTarget = null;
        });
    }

    // 查找指定位置的图形对象
    findObjectAtPoint(point) {
        // 逆序遍历（后添加的在上面）
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];

            if (obj.type === 'circle') {
                if (CircleCollision.checkPointCircle(point, obj)) {
                    return obj;
                }
            } else if (obj.type === 'rect') {
                if (RectangleCollision.checkPointRect(point, obj)) {
                    return obj;
                }
            }
        }

        return null;
    }

    // 添加可交互对象
    addObject(obj) {
        this.objects.push(obj);
    }

    // 清空所有对象
    clearObjects() {
        this.objects = [];
    }
}
```

### 2.4 触摸事件：touchstart、touchmove、touchend

触摸事件是移动端开发中必不可少的部分。Canvas的触摸事件处理与鼠标事件类似，但有几个关键区别：触摸事件使用touches数组（因为可能有多点触控），每个触摸点都有自己的标识符，以及需要阻止默认行为来避免页面滚动。

```javascript
// Canvas触摸事件处理
class TouchEventHandler {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 触摸状态
        this.activeTouches = new Map(); // touchIdentifier -> position
        this.isMultiTouch = false;

        // 回调函数
        this.onTouchStart = null;
        this.onTouchMove = null;
        this.onTouchEnd = null;
        this.onPinch = null; // 双指缩放

        // 初始化触摸事件监听
        this.initTouchListeners();
    }

    // 获取触摸点在Canvas上的位置
    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
        };
    }

    // 初始化触摸事件监听
    initTouchListeners() {
        // 触摸开始
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 阻止默认行为（防止滚动）

            const touches = Array.from(e.changedTouches);
            this.isMultiTouch = touches.length > 1;

            touches.forEach((touch) => {
                const pos = this.getTouchPos(touch);
                this.activeTouches.set(touch.identifier, pos);

                if (this.onTouchStart) {
                    this.onTouchStart(touch.identifier, pos, this.activeTouches);
                }
            });

            // 如果是双指，触发缩放回调
            if (this.isMultiTouch && this.onPinch) {
                const touchList = Array.from(this.activeTouches.values());
                const initialDistance = this.getDistance(touchList[0], touchList[1]);
                this.lastPinchDistance = initialDistance;
            }
        }, { passive: false });

        // 触摸移动
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            const touches = Array.from(e.changedTouches);

            touches.forEach((touch) => {
                if (this.activeTouches.has(touch.identifier)) {
                    const pos = this.getTouchPos(touch);
                    const prevPos = this.activeTouches.get(touch.identifier);
                    this.activeTouches.set(touch.identifier, pos);

                    if (this.onTouchMove) {
                        this.onTouchMove(touch.identifier, pos, prevPos);
                    }
                }
            });

            // 处理双指缩放
            if (this.isMultiTouch && this.onPinch) {
                const touchList = Array.from(this.activeTouches.values());
                if (touchList.length >= 2) {
                    const currentDistance = this.getDistance(touchList[0], touchList[1]);
                    const scale = currentDistance / this.lastPinchDistance;
                    this.lastPinchDistance = currentDistance;
                    this.onPinch(scale, touchList);
                }
            }
        }, { passive: false });

        // 触摸结束
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();

            const touches = Array.from(e.changedTouches);

            touches.forEach((touch) => {
                if (this.activeTouches.has(touch.identifier)) {
                    const pos = this.activeTouches.get(touch.identifier);
                    this.activeTouches.delete(touch.identifier);

                    if (this.onTouchEnd) {
                        this.onTouchEnd(touch.identifier, pos);
                    }
                }
            });

            this.isMultiTouch = this.activeTouches.size > 1;
        }, { passive: false });

        // 触摸取消（通常由于系统中断）
        this.canvas.addEventListener('touchcancel', (e) => {
            this.activeTouches.clear();
            this.isMultiTouch = false;
        });
    }

    // 计算两点之间的距离
    getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 计算两点的中点
    getMidpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        };
    }
}
```

### 2.5 实战：实现一个完整的Canvas小游戏

现在我们将综合运用前面学到的知识，创建一个完整的Canvas小游戏——一个带有粒子效果、碰撞检测和交互功能的小游戏。

```javascript
// Canvas小游戏：弹跳球收集游戏
class BounceBallGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 游戏状态
        this.isRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        // 游戏对象
        this.player = null;
        this.balls = [];
        this.particles = [];
        this.stars = [];

        // 物理参数
        this.gravity = 0.3;
        this.friction = 0.99;

        // 事件处理
        this.eventHandler = null;

        // 初始化
        this.init();
    }

    init() {
        // 初始化玩家（底部挡板）
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40,
            width: 120,
            height: 20,
            speed: 8,
            color: '#3498DB',
        };

        // 初始化事件处理
        this.initControls();

        // 初始化粒子效果
        this.initParticles();

        // 生成星星
        this.generateStars();
    }

    // 初始化控制
    initControls() {
        const keys = {};

        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        // 更新控制逻辑
        this.updateControls = () => {
            if (keys['ArrowLeft'] || keys['a']) {
                this.player.x -= this.player.speed;
            }
            if (keys['ArrowRight'] || keys['d']) {
                this.player.x += this.player.speed;
            }

            // 限制在画布范围内
            this.player.x = Math.max(
                this.player.width / 2,
                Math.min(this.canvas.width - this.player.width / 2, this.player.x)
            );
        };
    }

    // 初始化粒子效果
    initParticles() {
        this.particles = [];
    }

    // 创建爆炸粒子
    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 5 + 2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 1,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01,
            });
        }
    }

    // 更新粒子
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // 轻微重力
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 绘制粒子
    drawParticles() {
        this.particles.forEach((p) => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
            this.ctx.fill();
        });
    }

    // 生成背景星星
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.01,
            });
        }
    }

    // 绘制背景星星
    drawStars() {
        this.stars.forEach((star) => {
            star.twinkle += star.speed;
            const alpha = (Math.sin(star.twinkle) + 1) / 2 * 0.5 + 0.5;

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        });
    }

    // 生成弹球
    spawnBall() {
        const colors = ['#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
        this.balls.push({
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: 50,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 2 + 1,
            radius: Math.random() * 10 + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }

    // 更新游戏对象
    update() {
        // 更新玩家
        this.updateControls();

        // 更新弹球
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // 应用重力
            ball.vy += this.gravity;

            // 应用摩擦力
            ball.vx *= this.friction;
            ball.vy *= this.friction;

            // 更新位置
            ball.x += ball.vx;
            ball.y += ball.vy;

            // 边界碰撞检测
            // 左右边界
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                ball.vx *= -1;
                ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
                this.createExplosion(ball.x, ball.y, ball.color, 5);
            }

            // 顶部边界
            if (ball.y - ball.radius < 0) {
                ball.vy *= -1;
                ball.y = ball.radius;
                this.createExplosion(ball.x, ball.y, ball.color, 5);
            }

            // 底部边界（失去生命）
            if (ball.y + ball.radius > this.canvas.height) {
                this.lives--;
                this.balls.splice(i, 1);
                this.createExplosion(ball.x, this.canvas.height, '#E74C3C', 30);

                if (this.lives <= 0) {
                    this.gameOver();
                }
                continue;
            }

            // 与玩家碰撞检测
            if (this.checkBallPlayerCollision(ball)) {
                // 根据击中位置调整反弹角度
                const hitPos = (ball.x - this.player.x) / (this.player.width / 2);
                ball.vx = hitPos * 8; // 偏左向左弹，偏右向右弹
                ball.vy = -Math.abs(ball.vy) * 1.1; // 反转并加速

                // 确保最小反弹速度
                ball.vy = Math.min(ball.vy, -5);

                this.score += 10;
                this.createExplosion(ball.x, ball.y, ball.color, 15);
            }
        }

        // 更新粒子
        this.updateParticles();

        // 根据等级增加球的生成
        if (this.balls.length < 3 + this.level && Math.random() < 0.01) {
            this.spawnBall();
        }
    }

    // 检测球与玩家的碰撞
    checkBallPlayerCollision(ball) {
        // 简化的矩形碰撞检测
        const playerLeft = this.player.x - this.player.width / 2;
        const playerRight = this.player.x + this.player.width / 2;
        const playerTop = this.player.y - this.player.height / 2;

        return (
            ball.x + ball.radius > playerLeft &&
            ball.x - ball.radius < playerRight &&
            ball.y + ball.radius > playerTop &&
            ball.y - ball.radius < this.player.y + this.player.height / 2 &&
            ball.vy > 0 // 向下运动时才会碰撞
        );
    }

    // 绘制玩家
    drawPlayer() {
        const p = this.player;

        // 绘制挡板主体
        this.ctx.beginPath();
        this.ctx.roundRect(
            p.x - p.width / 2,
            p.y - p.height / 2,
            p.width,
            p.height,
            10
        );
        this.ctx.fillStyle = p.color;
        this.ctx.fill();

        // 绘制挡板高光效果
        const gradient = this.ctx.createLinearGradient(
            p.x - p.width / 2,
            p.y - p.height / 2,
            p.x - p.width / 2,
            p.y + p.height / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.beginPath();
        this.ctx.roundRect(
            p.x - p.width / 2,
            p.y - p.height / 2,
            p.width,
            p.height,
            10
        );
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    // 绘制弹球
    drawBalls() {
        this.balls.forEach((ball) => {
            // 绘制阴影
            this.ctx.beginPath();
            this.ctx.ellipse(
                ball.x + 3,
                this.canvas.height - 10,
                ball.radius * 0.8,
                ball.radius * 0.2,
                0,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fill();

            // 绘制球体
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ball.color;
            this.ctx.fill();

            // 绘制高光
            this.ctx.beginPath();
            this.ctx.arc(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.3,
                ball.radius * 0.3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
        });
    }

    // 绘制UI
    drawUI() {
        // 分数
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`分数: ${this.score}`, 20, 40);

        // 生命值
        this.ctx.fillText(`生命: ${'❤️'.repeat(this.lives)}`, 20, 70);

        // 等级
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`等级: ${this.level}`, this.canvas.width - 20, 40);
    }

    // 绘制游戏
    draw() {
        // 清空画布（带渐变背景）
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0F0C29');
        gradient.addColorStop(0.5, '#302B63');
        gradient.addColorStop(1, '#24243E');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景星星
        this.drawStars();

        // 绘制粒子
        this.drawParticles();

        // 绘制弹球
        this.drawBalls();

        // 绘制玩家
        this.drawPlayer();

        // 绘制UI
        this.drawUI();
    }

    // 游戏主循环
    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    // 开始游戏
    start() {
        this.isRunning = true;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.balls = [];
        this.particles = [];

        // 初始生成几个球
        for (let i = 0; i < 3; i++) {
            this.spawnBall();
        }

        this.gameLoop();
    }

    // 结束游戏
    gameOver() {
        this.isRunning = false;
        alert(`游戏结束！最终得分：${this.score}`);
    }

    // 暂停游戏
    pause() {
        this.isRunning = false;
    }

    // 继续游戏
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }
}
```

---

## 第三部分：数据可视化

### 3.1 ECharts完整教程：折线图、柱状图、饼图、散点图

ECharts是百度开源的数据可视化库，它提供了丰富的图表类型和强大的交互能力。ECharts5在性能和功能上都有显著提升，支持更精细的动画控制和更好的响应式设计。

```html
<!-- ECharts基础使用 -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ECharts基础教程</title>
    <!-- 引入ECharts -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        /* 确保图表容器有明确的宽高 */
        .chart-container {
            width: 100%;
            height: 400px;
        }
    </style>
</head>
<body>
    <div id="main" class="chart-container"></div>

    <script>
        // 初始化ECharts实例
        // echarts.init接收DOM元素和可选的主题配置
        const chartDom = document.getElementById('main');
        const myChart = echarts.init(chartDom, null, { renderer: 'canvas' });

        // 图表配置项
        const option = {
            // 标题配置
            title: {
                text: '2024年销售额统计',        // 主标题文本
                subtext: '月度数据展示',          // 副标题文本
                left: 'center',                   // 标题水平位置
                textStyle: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#333'
                },
                subtextStyle: {
                    fontSize: 14,
                    color: '#666'
                }
            },

            // 图例配置
            legend: {
                data: ['销售额', '去年同期'],     // 图例数据，与series中的name对应
                top: 60,                          // 图例距离顶部的距离
                textStyle: {
                    fontSize: 14
                }
            },

            // 提示框配置
            tooltip: {
                trigger: 'axis',                  // 触发类型：axis表示坐标轴触发
                axisPointer: {
                    type: 'cross'                 // 十字丝指示器
                },
                // 格式化提示框内容
                formatter: function(params) {
                    let result = params[0].name + '<br/>';
                    params.forEach(item => {
                        result += item.marker + item.seriesName + ': ' +
                                  item.value.toLocaleString() + '万元<br/>';
                    });
                    return result;
                }
            },

            // 工具栏配置
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'        // 数据区域缩放
                    },
                    restore: {},                  // 重置
                    saveAsImage: {}               // 导出图片
                }
            },

            // X轴配置
            xAxis: {
                type: 'category',                 // 坐标轴类型：类目轴
                data: ['1月', '2月', '3月', '4月', '5月', '6月',
                       '7月', '8月', '9月', '10月', '11月', '12月'],
                name: '月份',                     // 轴名称
                nameLocation: 'end',              // 轴名称位置
                nameTextStyle: {
                    fontSize: 14
                },
                axisLine: {
                    lineStyle: {
                        color: '#999'
                    }
                },
                axisLabel: {
                    color: '#666',
                    rotate: 0                     // 标签旋转角度
                }
            },

            // Y轴配置
            yAxis: {
                type: 'value',                    // 数值轴
                name: '销售额（万元）',
                nameTextStyle: {
                    fontSize: 14
                },
                axisLabel: {
                    formatter: '{value}'
                },
                splitLine: {
                    lineStyle: {
                        type: 'dashed',            // 分割线类型：虚线
                        color: '#E5E5E5'
                    }
                }
            },

            // 数据区域缩放配置
            dataZoom: [
                {
                    type: 'inside',               // 内置型数据区域缩放
                    start: 0,                     // 初始开始位置（百分比）
                    end: 100                      // 初始结束位置（百分比）
                },
                {
                    type: 'slider',               // 滑动条型数据区域缩放
                    show: true,
                    height: 30,
                    bottom: 10
                }
            ],

            // 图表系列配置
            series: [
                {
                    name: '销售额',               // 系列名称，用于图例
                    type: 'line',                 // 图表类型：折线图
                    data: [120, 200, 150, 80, 70, 110, 130,
                           190, 230, 280, 320, 450],
                    smooth: true,                 // 平滑曲线
                    symbol: 'circle',             // 数据点标记类型
                    symbolSize: 8,                // 数据点标记大小
                    lineStyle: {
                        width: 3,                  // 线条宽度
                        color: '#3498DB'           // 线条颜色
                    },
                    itemStyle: {
                        color: '#3498DB'           // 数据点颜色
                    },
                    areaStyle: {                  // 区域填充样式
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,            // 渐变起点到终点
                            [
                                { offset: 0, color: 'rgba(52, 152, 219, 0.5)' },
                                { offset: 1, color: 'rgba(52, 152, 219, 0.1)' }
                            ]
                        )
                    },
                    // 高亮样式
                    emphasis: {
                        focus: 'series',
                        itemStyle: {
                            borderWidth: 2,
                            borderColor: '#FFF',
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    }
                },
                {
                    name: '去年同期',
                    type: 'line',
                    data: [100, 180, 130, 70, 60, 90, 110,
                           160, 200, 250, 290, 400],
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: {
                        width: 2,
                        type: 'dashed',           // 虚线
                        color: '#95A5A6'
                    },
                    itemStyle: {
                        color: '#95A5A6'
                    }
                }
            ],

            // 动画配置
            animationDuration: 2000,              // 初始动画时长
            animationEasing: 'cubicOut',          // 缓动函数
            animationDurationUpdate: 500          // 数据更新时动画时长
        };

        // 使用刚指定的配置项和数据显示图表
        myChart.setOption(option);

        // 响应窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();                     // 调整图表尺寸
        });

        // 清理资源
        // window.addEventListener('beforeunload', function() {
        //     myChart.dispose();
        // });
    </script>
</body>
</html>
```

**柱状图的配置**与折线图类似，主要区别在于series中的type为bar。柱状图支持多种布局模式，包括垂直柱状图、水平柱状图、堆叠柱状图、分组柱状图等。

```javascript
// ECharts柱状图完整配置
function createBarChart() {
    const chartDom = document.getElementById('barChart');
    const myChart = echarts.init(chartDom);

    const option = {
        title: {
            text: '各地区季度销售额',
            subtext: '数据来源：公司内部统计',
            left: 'center'
        },

        legend: {
            data: ['华东地区', '华南地区', '华北地区', '西南地区'],
            top: 50,
            selected: {
                '西南地区': false  // 初始隐藏西南地区
            }
        },

        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'      // 阴影指示器，更适合柱状图
            },
            // 格式化函数
            formatter: function(params) {
                const axisValue = params[0].name;
                let total = 0;
                let result = `<strong>${axisValue}</strong><br/>`;

                params.forEach(param => {
                    if (param.value) {
                        total += param.value;
                        result += `${param.marker} ${param.seriesName}: ${param.value.toLocaleString()}万<br/>`;
                    }
                });

                result += `<strong>总计: ${total.toLocaleString()}万</strong>`;
                return result;
            }
        },

        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '100',
            containLabel: true  // 包含刻度标签
        },

        xAxis: {
            type: 'category',
            data: ['第一季度', '第二季度', '第三季度', '第四季度'],
            axisLine: {
                lineStyle: {
                    color: '#DC143C'
                }
            },
            axisLabel: {
                fontSize: 14,
                color: '#333'
            }
        },

        yAxis: {
            type: 'value',
            name: '销售额（万元）',
            nameTextStyle: {
                fontSize: 14,
                color: '#333'
            },
            axisLabel: {
                formatter: function(value) {
                    if (value >= 10000) {
                        return (value / 10000) + '亿';
                    }
                    return value;
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#EEE',
                    type: 'dashed'
                }
            }
        },

        series: [
            {
                name: '华东地区',
                type: 'bar',
                stack: '总量',           // 堆叠柱状图
                data: [3200, 4500, 3800, 5200],
                barWidth: '20%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#3498DB' },
                        { offset: 1, color: '#2980B9' }
                    ]),
                    borderRadius: [4, 4, 0, 0]  // 柱子上方圆角
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#5DADE2' },
                            { offset: 1, color: '#3498DB' }
                        ])
                    }
                },
                // 标签配置
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{c}',
                    color: '#FFF',
                    fontSize: 12
                }
            },
            {
                name: '华南地区',
                type: 'bar',
                stack: '总量',
                data: [2800, 3200, 4100, 4800],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#2ECC71' },
                        { offset: 1, color: '#27AE60' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{c}'
                }
            },
            {
                name: '华北地区',
                type: 'bar',
                stack: '总量',
                data: [2200, 2800, 3200, 3900],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#E74C3C' },
                        { offset: 1, color: '#C0392B' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{c}'
                }
            },
            {
                name: '西南地区',
                type: 'bar',
                stack: '总量',
                data: [1500, 1900, 2100, 2800],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#F39C12' },
                        { offset: 1, color: '#D68910' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                label: {
                    show: true,
                    position: 'inside',
                    formatter: '{c}'
                }
            }
        ],

        // 数据区域缩放
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            }
        ]
    };

    myChart.setOption(option);

    // 窗口调整时自适应
    window.addEventListener('resize', () => {
        myChart.resize();
    });
}
```

**饼图**是展示数据占比的利器，ECharts提供了丰富的饼图类型，包括普通饼图、环形饼图、南丁格尔玫瑰图等。

```javascript
// ECharts饼图完整配置
function createPieChart() {
    const chartDom = document.getElementById('pieChart');
    const myChart = echarts.init(chartDom);

    const option = {
        title: {
            text: '2024年市场份额分布',
            subtext: '按产品类别统计',
            left: 'center',
            top: 10
        },

        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },

        legend: {
            orient: 'vertical',          // 图例垂直排列
            left: 'left',
            top: 'center',
            itemWidth: 14,
            itemHeight: 14,
            textStyle: {
                fontSize: 14
            },
            formatter: function(name) {
                // 获取对应数据值
                const data = option.series[0].data;
                const item = data.find(d => d.name === name);
                return name + '  ' + item.value + '%';
            }
        },

        toolbox: {
            right: 20,
            feature: {
                saveAsImage: {
                    name: '市场份额分布图'
                },
                dataView: {}
            }
        },

        series: [
            {
                name: '市场份额',
                type: 'pie',
                radius: ['40%', '70%'],  // 环形饼图，内半径40%，外半径70%
                center: ['55%', '50%'],   // 图表中心位置

                // 饼图文本标签配置
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}\n{d}%',
                    color: '#333',
                    fontSize: 12
                },
                // 标签连接线配置
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 10,
                    lineStyle: {
                        color: '#CCC',
                        width: 1,
                        type: 'solid'
                    }
                },

                // 高亮样式
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        formatter: '{b}\n{d}%'
                    }
                },

                data: [
                    {
                        value: 35,
                        name: '电子产品',
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#3498DB' },
                                    { offset: 1, color: '#2980B9' }
                                ]
                            }
                        }
                    },
                    {
                        value: 25,
                        name: '家居用品',
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#2ECC71' },
                                    { offset: 1, color: '#27AE60' }
                                ]
                            }
                        }
                    },
                    {
                        value: 18,
                        name: '服装鞋帽',
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#E74C3C' },
                                    { offset: 1, color: '#C0392B' }
                                ]
                            }
                        }
                    },
                    {
                        value: 12,
                        name: '食品饮料',
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#F39C12' },
                                    { offset: 1, color: '#D68910' }
                                ]
                            }
                        }
                    },
                    {
                        value: 10,
                        name: '其他品类',
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 1, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#9B59B6' },
                                    { offset: 1, color: '#8E44AD' }
                                ]
                            }
                        }
                    }
                ],

                // 动画配置
                animationType: 'expansion',   // 动画类型：扩展
                animationDuration: 1000,
                animationEasing: 'cubicOut',
                animationDelay: function(idx) {
                    return idx * 100;          // 每个扇形的动画延迟
                }
            }
        ],

        // 动态特效
        graphic: [
            {
                type: 'group',
                left: 'center',
                top: 'middle',
                children: [
                    {
                        type: 'text',
                        style: {
                            text: '总销售额',
                            textAlign: 'center',
                            fill: '#999',
                            fontSize: 14
                        },
                        left: '55%',
                        top: '45%'
                    },
                    {
                        type: 'text',
                        style: {
                            text: '¥12.8亿',
                            textAlign: 'center',
                            fill: '#333',
                            fontSize: 24,
                            fontWeight: 'bold'
                        },
                        left: '55%',
                        top: '52%'
                    }
                ]
            }
        ]
    };

    myChart.setOption(option);

    // 点击事件处理
    myChart.on('click', function(params) {
        console.log('点击了:', params.name, params.value);
    });

    // 窗口调整
    window.addEventListener('resize', () => {
        myChart.resize();
    });
}
```

**散点图**是探索变量之间关系的有力工具，ECharts的散点图支持气泡图、带有拟合线的散点图等多种形式。

```javascript
// ECharts散点图完整配置
function createScatterChart() {
    const chartDom = document.getElementById('scatterChart');
    const myChart = echarts.init(chartDom);

    // 生成模拟数据：身高体重关系
    const generateData = () => {
        const data = [];
        for (let i = 0; i < 100; i++) {
            const height = 160 + Math.random() * 40; // 身高160-200cm
            // 体重与身高有一定相关性，加上随机噪声
            const weight = (height - 100) + (Math.random() - 0.5) * 20;
            data.push([height, weight]);
        }
        return data;
    };

    const option = {
        title: {
            text: '身高与体重关系分布',
            subtext: '样本数：100人',
            left: 'center'
        },

        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return `身高: ${params.value[0].toFixed(1)} cm<br/>体重: ${params.value[1].toFixed(1)} kg`;
            },
            axisPointer: {
                type: 'cross'
            }
        },

        grid: {
            left: '10%',
            right: '10%',
            bottom: '15%',
            top: '15%'
        },

        xAxis: {
            type: 'value',
            name: '身高 (cm)',
            nameLocation: 'center',
            nameGap: 30,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            min: 155,
            max: 205,
            axisLabel: {
                formatter: '{value}'
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#EEE'
                }
            }
        },

        yAxis: {
            type: 'value',
            name: '体重 (kg)',
            nameLocation: 'center',
            nameGap: 40,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            min: 45,
            max: 95,
            axisLabel: {
                formatter: '{value}'
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#EEE'
                }
            }
        },

        series: [
            {
                name: '样本点',
                type: 'scatter',
                symbolSize: 15,
                data: generateData(),

                itemStyle: {
                    color: function(params) {
                        // 根据体重设置颜色
                        const weight = params.value[1];
                        if (weight < 60) return '#2ECC71';      // 偏瘦：绿色
                        if (weight < 75) return '#3498DB';      // 正常：蓝色
                        return '#E74C3C';                       // 偏重：红色
                    },
                    shadowBlur: 5,
                    shadowColor: 'rgba(0, 0, 0, 0.2)'
                },

                emphasis: {
                    scale: 1.5,  // 放大1.5倍
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(0, 0, 0, 0.4)'
                    }
                }
            },

            // 添加平均线
            {
                name: '平均身高线',
                type: 'line',
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: {
                        color: '#95A5A6',
                        type: 'dashed',
                        width: 2
                    },
                    data: [
                        {
                            type: 'average',
                            name: '平均身高',
                            xAxis: 180 // 平均身高约180cm
                        }
                    ],
                    label: {
                        formatter: '平均身高: 180cm',
                        position: 'end'
                    }
                }
            },

            {
                name: '平均体重线',
                type: 'line',
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: {
                        color: '#95A5A6',
                        type: 'dashed',
                        width: 2
                    },
                    data: [
                        {
                            type: 'average',
                            name: '平均体重',
                            yAxis: 70 // 平均体重约70kg
                        }
                    ],
                    label: {
                        formatter: '平均体重: 70kg',
                        position: 'end'
                    }
                }
            }
        ],

        // 缩放
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: 0,
                start: 0,
                end: 100
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                start: 0,
                end: 100
            }
        ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', () => {
        myChart.resize();
    });
}
```

### 3.2 Chart.js入门

Chart.js是一个轻量级的数据可视化库，它以简洁的API和优雅的动画效果著称。相比ECharts，Chart.js更加轻量，适合需要简单图表的场景。Chart.js的最新版本支持响应式设计、自动动画和丰富的自定义选项。

```html
<!-- Chart.js基础使用 -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chart.js基础教程</title>
    <!-- 引入Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        .chart-wrapper {
            position: relative;
            height: 400px;
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="chart-wrapper">
        <canvas id="myChart"></canvas>
    </div>

    <script>
        // 获取Canvas上下文
        const ctx = document.getElementById('myChart').getContext('2d');

        // 创建图表
        const myChart = new Chart(ctx, {
            type: 'bar',  // 图表类型
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                    label: '# of Votes',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,           // 响应式
                maintainAspectRatio: false, // 不保持宽高比
                plugins: {
                    title: {
                        display: true,
                        text: 'Basic Bar Chart',
                        font: {
                            size: 18
                        }
                    },
                    legend: {
                        display: false       // 隐藏图例
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return 'Votes: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
```

Chart.js的配置选项非常丰富，下面的示例展示了更复杂的配置，包括混合图表类型、数据集更新动画等。

```javascript
// Chart.js完整配置示例：混合图表
function createMixedChart() {
    const ctx = document.getElementById('mixedChart').getContext('2d');

    // 注册必要的组件（如果是模块化环境）
    // Chart.js 3.x之后需要手动注册组件
    // import { Chart, registerables } from 'chart.js';
    // Chart.register(...registerables);

    const mixedChart = new Chart(ctx, {
        type: 'bar',  // 基础类型
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [
                {
                    // 柱状图：销售额
                    type: 'bar',
                    label: '销售额（万元）',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    order: 2  // 绘制顺序，数字越大越在下层
                },
                {
                    // 折线图：增长率
                    type: 'line',
                    label: '增长率（%）',
                    data: [12, 15, 18, 10, 12, 14],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,        // 曲线张力，0为直线
                    fill: true,           // 填充曲线下方区域
                    yAxisID: 'y1',        // 使用的Y轴ID
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',        // 交互模式：在所有数据点间共享提示
                intersect: false,     // 不需要精确点击
            },
            plugins: {
                title: {
                    display: true,
                    text: '销售数据概览',
                    font: {
                        size: 20,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,  // 使用点样式
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false  // 隐藏X轴网格线
                    }
                },
                y: {
                    type: 'linear',   // Y轴类型
                    display: true,
                    position: 'left', // 左侧显示
                    title: {
                        display: true,
                        text: '销售额（万元）'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',   // 第二个Y轴
                    display: true,
                    position: 'right',// 右侧显示
                    title: {
                        display: true,
                        text: '增长率（%）'
                    },
                    grid: {
                        drawOnChartArea: false  // 不在图表区域绘制网格
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },

            // 动画配置
            animation: {
                duration: 1000,
                easing: 'EaseOutQuart'
            }
        }
    });

    // 模拟数据更新
    setInterval(() => {
        // 更新数据集
        mixedChart.data.datasets[0].data = mixedChart.data.datasets[0].data.map(
            v => v + Math.floor(Math.random() * 10) - 5
        );
        mixedChart.data.datasets[1].data = mixedChart.data.datasets[1].data.map(
            v => Math.max(5, Math.min(25, v + (Math.random() - 0.5) * 4))
        );

        // 带动画更新
        mixedChart.update('active');
    }, 3000);

    return mixedChart;
}
```

### 3.3 D3.js数据绑定基础

D3.js（Data-Driven Documents）是一个强大的数据可视化库，它通过将数据绑定到DOM元素上来创建动态图表。与其他图表库不同，D3.js不是一个"图表库"，而是一个"绑定库"——它提供了创建任何你想要的可视化的底层能力。

```javascript
// D3.js数据绑定基础
// D3.js的核心概念是将数据绑定到DOM元素上，然后根据数据操作这些元素

// 引入D3.js（通常通过npm install d3或CDN引入）
// import * as d3 from 'd3';

function d3BasicExample() {
    // 选择DOM元素
    const container = d3.select('#d3-container');

    // 创建SVG画布
    const svg = container.append('svg')
        .attr('width', 600)
        .attr('height', 400)
        .style('background', '#f8f9fa');

    // 绑定数据到圆形元素
    const data = [
        { x: 100, y: 100, r: 30, color: '#3498DB' },
        { x: 200, y: 150, r: 20, color: '#2ECC71' },
        { x: 300, y: 120, r: 25, color: '#E74C3C' },
        { x: 400, y: 180, r: 35, color: '#F39C12' },
        { x: 500, y: 140, r: 28, color: '#9B59B6' },
    ];

    // 数据绑定的三种方式：enter, update, exit

    // 1. Enter：数据多于元素时
    svg.selectAll('circle')
        .data(data)
        .enter()                          // 返回新的数据点（没有对应元素的）
        .append('circle')
        .attr('cx', d => d.x)            // d是当前数据点
        .attr('cy', d => d.y)
        .attr('r', d => d.r)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
            // 鼠标悬停效果
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1)
                .attr('r', d.r * 1.2);
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.8)
                .attr('r', d.r);
        });

    // 2. Update + Enter模式（更常见）
    const data2 = [
        { x: 150, y: 250, r: 22, color: '#1ABC9C' },
        { x: 250, y: 300, r: 18, color: '#34495E' },
        { x: 350, y: 280, r: 28, color: '#E67E22' },
    ];

    // 选择所有circle元素并绑定新数据
    const circles = svg.selectAll('circle')
        .data(data2);

    // Enter: 新数据创建新元素
    circles.enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 0)  // 从0开始
        .attr('fill', d => d.color)
        .transition()
        .duration(500)
        .attr('r', d => d.r);

    // Exit: 多余的元素移除
    circles.exit()
        .transition()
        .duration(500)
        .attr('r', 0)
        .remove();

    // 3. 完整的数据更新模式（适用于动态数据）
    function updateChart(newData) {
        // 数据join
        const circles = svg.selectAll('circle')
            .data(newData, d => d.x + '-' + d.y); // 使用key函数

        // Enter
        circles.enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', d => d.color)
            .merge(circles)  // 合并enter和update
            .transition()
            .duration(750)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r)
            .attr('fill', d => d.color);

        // Exit
        circles.exit()
            .transition()
            .duration(500)
            .attr('r', 0)
            .remove();
    }
}
```

D3.js的 scales（比例尺）是数据可视化的核心概念之一，它们将数据域映射到视觉范围。

```javascript
// D3.js比例尺与坐标轴
function d3ScalesAndAxes() {
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    const svg = d3.select('#d3-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // 数据
    const data = [
        { date: new Date('2024-01-01'), value: 30 },
        { date: new Date('2024-02-01'), value: 45 },
        { date: new Date('2024-03-01'), value: 35 },
        { date: new Date('2024-04-01'), value: 60 },
        { date: new Date('2024-05-01'), value: 55 },
        { date: new Date('2024-06-01'), value: 75 },
    ];

    // 1. 线性比例尺：数值到像素
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date)) // 数据范围
        .range([margin.left, width - margin.right]); // 像素范围

    // 2. 线性比例尺
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1]) // 留10%空间
        .range([height - margin.bottom, margin.top]);   // Y轴反向（SVG Y轴向下）

    // 3. 带颜色的序数比例尺
    const colorScale = d3.scaleOrdinal()
        .domain(['A', 'B', 'C', 'D'])
        .range(['#3498DB', '#2ECC71', '#E74C3C', '#F39C12']);

    // 4. 带颜色的量化比例尺
    const binColorScale = d3.scaleQuantize()
        .domain([0, 100])
        .range(['#FFCDD2', '#F8BBD9', '#E1BEE7', '#D1C4E9', '#C5CAE9']);

    // 绘制坐标轴
    // X轴
    const xAxis = d3.axisBottom(xScale)
        .ticks(6)                           // 刻度数量
        .tickFormat(d3.timeFormat('%Y年%m月')); // 格式化

    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Y轴
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d + '万');

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yAxis);

    // 绘制折线
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX); // 平滑曲线

    // 添加路径
    const path = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#3498DB')
        .attr('stroke-width', 3)
        .attr('d', line);

    // 添加数据点
    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 0)
        .attr('fill', '#3498DB')
        .attr('stroke', '#FFF')
        .attr('stroke-width', 2)
        .transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .attr('r', 6);

    // 动画：路径绘制效果
    const totalLength = path.node().getTotalLength();

    path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
}
```

### 3.4 地图可视化：echartsgeo、leaflet

地图可视化是数据可视化中的重要分支，它允许我们在地理空间上展示数据分布。ECharts内置了地图功能，而Leaflet则是专业的地理信息系统库。

```javascript
// ECharts地图可视化
function createEChartsMap() {
    const chartDom = document.getElementById('mapChart');
    const myChart = echarts.init(chartDom);

    // 注册地图（需要先加载地图数据）
    // echarts.registerMap('china', chinaGeoJSON);

    const option = {
        title: {
            text: '全国销售分布',
            subtext: '各省销售额热力图',
            left: 'center'
        },

        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data) {
                    return `${params.name}<br/>销售额: ${params.value}万元`;
                }
                return params.name;
            }
        },

        visualMap: {
            min: 0,
            max: 10000,
            left: 'left',
            top: 'bottom',
            text: ['高', '低'],
            calculable: true,
            inRange: {
                color: ['#50a3ba', '#eac736', '#d94e5d'] // 蓝-黄-红渐变
            }
        },

        series: [
            {
                name: '销售额',
                type: 'map',
                map: 'china',  // 注册的地图名称
                roam: true,    // 开启缩放和平移
                scaleLimit: {
                    min: 0.8,
                    max: 3
                },
                label: {
                    show: false  // 默认不显示省份名称
                },
                emphasis: {
                    label: {
                        show: true,
                        color: '#FFF'
                    },
                    itemStyle: {
                        areaColor: '#B8860B'
                    }
                },
                data: [
                    { name: '北京', value: 8500 },
                    { name: '上海', value: 7800 },
                    { name: '广东', value: 9200 },
                    { name: '浙江', value: 6500 },
                    { name: '江苏', value: 7200 },
                    { name: '四川', value: 4500 },
                    { name: '湖北', value: 3800 },
                    { name: '陕西', value: 3200 },
                    { name: '福建', value: 4100 },
                    { name: '山东', value: 5800 },
                    { name: '河南', value: 4200 },
                    { name: '河北', value: 3600 },
                    { name: '湖南', value: 3900 },
                    { name: '安徽', value: 3400 },
                    { name: '辽宁', value: 4100 },
                    { name: '重庆', value: 3200 },
                    { name: '云南', value: 2800 },
                    { name: '贵州', value: 2400 },
                    { name: '广西', value: 3100 },
                    { name: '海南', value: 1500 },
                    { name: '天津', value: 4200 },
                    { name: '山西', value: 2900 },
                    { name: '江西', value: 2700 },
                    { name: '内蒙古', value: 2500 },
                    { name: '新疆', value: 2200 },
                    { name: '甘肃', value: 1900 },
                    { name: '青海', value: 1200 },
                    { name: '西藏', value: 800 },
                    { name: '宁夏', value: 1100 },
                    { name: '黑龙江', value: 3000 },
                    { name: '吉林', value: 2800 },
                    { name: '台湾', value: 5500 },
                    { name: '香港', value: 4500 },
                    { name: '澳门', value: 2200 }
                ]
            }
        ]
    };

    myChart.setOption(option);

    // 点击省份事件
    myChart.on('click', function(params) {
        console.log('点击了:', params.name, params.value);
    });

    window.addEventListener('resize', () => {
        myChart.resize();
    });
}
```

Leaflet是另一个流行的开源地图库，它专注于交互式地图的展示。

```html
<!-- Leaflet地图基础使用 -->
<!DOCTYPE html>
<html>
<head>
    <title>Leaflet地图示例</title>
    <!-- 引入Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #map {
            height: 500px;
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <!-- 引入Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // 初始化地图
        // 第一个参数是容器ID，第二个参数是选项
        const map = L.map('map', {
            center: [39.9042, 116.4074], // 北京市中心
            zoom: 12,                      // 缩放级别
            zoomControl: true,             // 显示缩放控件
            attributionControl: true       // 显示属性控件
        });

        // 添加底图图层
        // OpenStreetMap免费开源的底图服务
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // 添加标记
        const marker = L.marker([39.9042, 116.4074])
            .addTo(map)
            .bindPopup('<b>北京市</b><br>中国首都')
            .openPopup();

        // 添加圆形区域
        L.circle([39.9042, 116.4074], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 5000  // 半径（米）
        }).addTo(map)
          .bindPopup('5公里半径范围');

        // 添加多边形
        L.polygon([
            [39.90, 116.40],
            [39.92, 116.42],
            [39.91, 116.44],
            [39.89, 116.41]
        ], {
            color: 'blue',
            fillColor: '#3498db',
            fillOpacity: 0.3
        }).addTo(map)
          .bindPopup('这是一个多边形区域');

        // 添加弹出窗口
        const popup = L.popup()
            .setLatLng([39.9142, 116.4174])
            .setContent('这是一个弹出窗口')
            .openOn(map);

        // 点击地图事件
        map.on('click', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent(`坐标: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
                .openOn(map);
        });
    </script>
</body>
</html>
```

### 3.5 实时数据可视化：WebSocket数据绑定

实时数据可视化是现代监控仪表盘的核心需求。WebSocket提供了全双工通信能力，允许服务器主动向客户端推送数据。结合ECharts等可视化库，我们可以实现实时更新的数据图表。

```javascript
// 实时数据可视化：WebSocket + ECharts
class RealTimeChart {
    constructor(canvasId, wsUrl) {
        this.chartDom = document.getElementById(canvasId);
        this.myChart = echarts.init(this.chartDom);
        this.wsUrl = wsUrl;
        this.ws = null;
        this.dataHistory = [];
        this.maxHistoryLength = 50; // 保留的历史数据点数量

        // 初始化图表配置
        this.initOption();

        // 窗口调整事件
        window.addEventListener('resize', () => {
            this.myChart.resize();
        });
    }

    // 初始化图表配置
    initOption() {
        this.option = {
            title: {
                text: '实时监控数据',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    const time = params[0].axisValue;
                    let result = `${time}<br/>`;
                    params.forEach(param => {
                        result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(2)}<br/>`;
                    });
                    return result;
                }
            },
            legend: {
                data: ['CPU使用率', '内存使用率', '网络带宽'],
                top: 30
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: []
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLabel: {
                    formatter: '{value}%'
                }
            },
            series: [
                {
                    name: 'CPU使用率',
                    type: 'line',
                    smooth: true,
                    data: [],
                    lineStyle: {
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(52, 152, 219, 0.5)' },
                            { offset: 1, color: 'rgba(52, 152, 219, 0.1)' }
                        ])
                    }
                },
                {
                    name: '内存使用率',
                    type: 'line',
                    smooth: true,
                    data: [],
                    lineStyle: {
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(46, 204, 113, 0.5)' },
                            { offset: 1, color: 'rgba(46, 204, 113, 0.1)' }
                        ])
                    }
                },
                {
                    name: '网络带宽',
                    type: 'line',
                    smooth: true,
                    data: [],
                    lineStyle: {
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(155, 89, 182, 0.5)' },
                            { offset: 1, color: 'rgba(155, 89, 182, 0.1)' }
                        ])
                    }
                }
            ],
            animation: true,
            animationDuration: 300,
            animationEasing: 'cubicOut'
        };

        this.myChart.setOption(this.option);
    }

    // 连接WebSocket
    connect() {
        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket连接已建立');
                this.updateStatus('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleData(data);
                } catch (e) {
                    console.error('数据解析失败:', e);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
                this.updateStatus('error');
            };

            this.ws.onclose = () => {
                console.log('WebSocket连接已关闭');
                this.updateStatus('closed');
                // 尝试重新连接
                setTimeout(() => this.connect(), 3000);
            };
        } catch (e) {
            console.error('WebSocket连接失败:', e);
            this.updateStatus('error');
        }
    }

    // 处理接收到的数据
    handleData(data) {
        // data格式: { timestamp: '2024-01-01 12:00:00', cpu: 45.2, memory: 62.1, network: 35.8 }
        const time = data.timestamp || new Date().toLocaleTimeString();

        // 添加数据到历史记录
        this.dataHistory.push({
            time: time,
            cpu: data.cpu,
            memory: data.memory,
            network: data.network
        });

        // 限制历史数据长度
        if (this.dataHistory.length > this.maxHistoryLength) {
            this.dataHistory.shift();
        }

        // 更新图表
        this.updateChart();
    }

    // 更新图表
    updateChart() {
        const times = this.dataHistory.map(d => d.time);
        const cpuData = this.dataHistory.map(d => d.cpu);
        const memoryData = this.dataHistory.map(d => d.memory);
        const networkData = this.dataHistory.map(d => d.network);

        this.myChart.setOption({
            xAxis: {
                data: times
            },
            series: [
                { data: cpuData },
                { data: memoryData },
                { data: networkData }
            ]
        });
    }

    // 更新连接状态显示
    updateStatus(status) {
        const statusMap = {
            'connected': { text: '已连接', color: 'green' },
            'error': { text: '连接错误', color: 'red' },
            'closed': { text: '连接已关闭', color: 'gray' }
        };

        const info = statusMap[status] || { text: '未知状态', color: 'black' };
        console.log(`连接状态: ${info.text}`);
    }

    // 断开连接
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 销毁图表
    dispose() {
        this.disconnect();
        if (this.myChart) {
            this.myChart.dispose();
            this.myChart = null;
        }
    }
}

// 使用示例
// const chart = new RealTimeChart('main', 'ws://localhost:8080/data');
// chart.connect();
```

---

## 第四部分：图表最佳实践

### 4.1 图表选型指南

选择合适的图表类型是数据可视化的第一步。不同的图表适用于不同的数据关系和展示目的。以下是常见图表类型的适用场景分析。

**比较关系**：当需要展示不同类别之间的数值比较时，柱状图是最直观的选择。对于少量类别的比较，垂直柱状图效果最好；当类别名称较长时，水平柱状图更为合适。堆叠柱状图适合展示整体和部分的关系。分组柱状图则适合同时展示多个维度的比较。

**趋势关系**：展示数据随时间变化的趋势时，折线图是最佳选择。如果需要同时展示多个数据系列，可以使用多线折线图。面积图在折线图的基础上增加了区域填充，能够更好地强调数据的累积效果。对于时间序列数据，K线图（蜡烛图）是专业金融分析的首选。

**构成关系**：展示整体与部分的关系时，饼图是最传统的选择。当部分数量较多时（超过7个），环形饼图或南丁格尔玫瑰图更为合适。堆叠柱状图也是展示构成关系的有效方式。

**分布关系**：展示数据的分布情况时，直方图是最基本的工具。箱线图能够展示数据的中位数、四分位数和异常值。密度图则能够展示数据的概率密度分布。散点图适合展示两个变量之间的关系分布。

**关系关系**：展示数据之间的关系时，散点图是基础工具。当需要展示多个维度的关系时，气泡图（在散点图基础上增加气泡大小维度）是很好的选择。热力图适合展示矩阵形式的数据关系。

| 图表类型 | 最佳用途 | 不适合的场景 |
|---------|---------|-------------|
| 柱状图 | 类别比较、排名展示 | 时间趋势（用折线图）、构成比例（用饼图） |
| 折线图 | 时间序列趋势、连续变化 | 类别比较、不连续数据 |
| 饼图 | 简单构成关系（少于7个部分） | 多部分比较、负值、多个数据系列 |
| 散点图 | 两个变量的相关性、多维度分布 | 单变量分布、类别标签过多 |
| 面积图 | 累积趋势、强调量级 | 对比不相交的数据系列 |
| 箱线图 | 统计分布、异常值检测 | 精确数值展示、少量数据 |

### 4.2 数据可视化设计原则

良好的数据可视化设计应当遵循以下原则，这些原则能够帮助我们创建既美观又易于理解的可视化作品。

**数据墨水比原则**：Edward Tufte提出的"数据墨水比"概念强调，图表中用于表示数据的"墨水"应该占据总墨水的最大比例。这意味着我们应该消除所有不必要的装饰性元素，如过于花哨的背景、不必要的网格线、过于复杂的3D效果等。一个优秀的可视化作品应该让数据成为视觉焦点，而非被繁杂的装饰所掩盖。

**减少视觉干扰**：每一项视觉元素都应该有其存在的理由。如果一个元素不能帮助用户理解数据，就应该考虑移除它。例如，当数据点足够密集时，坐标轴的刻度线就可以简化；如果图表的主要信息是趋势而非精确数值，网格线就可以变淡或完全移除。

**色彩使用的科学性**：色彩是数据可视化中最重要的视觉变量之一，但也是最容易滥用元素。首先，应该选择适合色盲用户的调色板，避免使用红绿对比（最常见的色盲类型是红绿色盲）。其次，使用的颜色数量应该控制在合理范围内（通常不超过7种），因为更多的颜色会增加认知负担。在连续数据的可视化中，应该使用单色渐变或双极渐变（从一种颜色通过中间色过渡到另一种颜色），而非任意颜色的随机组合。

```javascript
// 科学的调色板生成
function generateColorPalette() {
    // 基础调色板：色盲友好的蓝色系
    const bluePalette = [
        '#08519C', '#3182BD', '#6BAED6', '#9ECAE1', '#C6DBEF'
    ];

    // 红色系（避免与绿色的直接对比）
    const redPalette = [
        '#67000D', '#A50F15', '#CB181D', '#EF3B2C', '#FB6A4A'
    ];

    // 综合调色板：适合分类数据
    const categoricalPalette = [
        '#4E79A7', // 蓝灰
        '#F28E2B', // 橙色
        '#E15759', // 红色
        '#76B7B2', // 青色
        '#59A14F', // 绿色
        '#EDC948', // 黄色
        '#B07AA1', // 紫色
        '#FF9DA7', // 粉色
    ];

    // 连续调色板：单色渐变
    const sequentialPalette = d3.scaleSequential(
        d3.interpolateBlues
    );

    // 双极调色板：中间值为中性色
    const divergingPalette = d3.scaleDiverging(
        d3.interpolateRdBu
    );

    return {
        blue: bluePalette,
        red: redPalette,
        categorical: categoricalPalette,
        sequential: sequentialPalette,
        diverging: divergingPalette
    };
}
```

**保持视觉一致性**：在一个仪表盘或报告中的多个图表应该保持视觉一致性，包括色彩方案、字体、图表尺寸、图例位置等。这有助于用户在不同图表之间建立视觉关联，降低理解成本。

### 4.3 响应式图表

现代Web应用需要在各种屏幕尺寸上良好展示，图表的响应式设计因此变得至关重要。响应式图表能够在不同尺寸的容器中自动调整大小和布局，确保数据的可读性。

```javascript
// ECharts响应式配置
function createResponsiveChart() {
    const container = document.getElementById('chart-container');
    const myChart = echarts.init(container);

    // 基础配置
    const baseOption = {
        title: {
            text: '销售数据',
            textStyle: {
                fontSize: 'auto' // 占位符，实际由resize处理
            }
        },
        series: [...]
    };

    // 响应式配置选项
    const responsiveOption = {
        // 大屏幕：完整显示
        [EChartsSourceType.BROWSER]: {
            width: container.clientWidth,
            height: container.clientHeight,
        },
        // 平板：简化图例
        [EChartsSourceType.BROWSER]: {
            legend: {
                show: true,
                orient: 'horizontal'
            }
        }
    };

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            myChart.resize({
                width: width,
                height: height
            });
        }
    });

    resizeObserver.observe(container);

    // 清理
    return () => {
        resizeObserver.disconnect();
        myChart.dispose();
    };
}
```

Chart.js提供了内置的响应式支持，只需要确保容器有正确的尺寸即可：

```javascript
// Chart.js响应式配置
const config = {
    type: 'bar',
    data: data,
    options: {
        responsive: true,           // 启用响应式
        maintainAspectRatio: false, // 不保持宽高比
        plugins: {
            legend: {
                position: 'bottom', // 小屏幕时图例放底部
                labels: {
                    boxWidth: 12,    // 小屏幕时缩小图例标记
                    padding: 10
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 90,  // 小屏幕时允许标签旋转
                    autoSkip: true,   // 自动跳过部分标签
                    maxTicksLimit: 10
                }
            }
        }
    }
};
```

### 4.4 性能优化：大数据量渲染

当数据量达到数万甚至更多时，图表的渲染性能会成为关键问题。以下是处理大数据量可视化的常用优化策略。

**数据抽样**：当数据点远超像素数量时，显示所有数据点是没有意义的。可以采用LTTB（ Largest Triangle Three Buckets）算法或简单的等间隔抽样来减少数据点数量，同时保持数据的基本形态。

```javascript
// LTTB数据抽样算法
function largestTriangleThreeBuckets(data, threshold) {
    if (threshold >= data.length || threshold <= 2) {
        return data;
    }

    const sampled = [];
    const bucketSize = (data.length - 2) / (threshold - 2);

    let a = 0; // 第一个点
    sampled.push(data[a]);

    for (let i = 0; i < threshold - 2; i++) {
        // 计算当前桶的范围
        const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
        const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);

        // 计算下一个桶的平均点
        const nextBucketStart = Math.floor((i + 2) * bucketSize) + 1;
        const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length);

        let avgX = 0;
        let avgY = 0;
        let avgCount = 0;

        for (let j = nextBucketStart; j < nextBucketEnd; j++) {
            avgX += data[j][0];
            avgY += data[j][1];
            avgCount++;
        }

        avgX /= avgCount;
        avgY /= avgCount;

        // 在当前桶中找到形成最大三角形的点
        const currentBucketStart = Math.floor(i * bucketSize) + 1;
        const currentBucketEnd = Math.floor((i + 1) * bucketSize) + 1;

        let maxArea = -1;
        let maxAreaIndex = currentBucketStart;

        const pointA = data[a];

        for (let j = currentBucketStart; j < currentBucketEnd; j++) {
            const area = Math.abs(
                (pointA[0] - avgX) * (data[j][1] - pointA[1]) -
                (pointA[0] - data[j][0]) * (avgY - pointA[1])
            );

            if (area > maxArea) {
                maxArea = area;
                maxAreaIndex = j;
            }
        }

        sampled.push(data[maxAreaIndex]);
        a = maxAreaIndex;
    }

    sampled.push(data[data.length - 1]); // 最后一个点
    return sampled;
}
```

**渐进渲染**：对于超大数据集，可以采用渐进渲染策略。先加载和显示一小部分数据让用户快速看到结果，然后在后台加载剩余数据。ECharts的dataZoom组件就是这种策略的典型应用。

**Web Worker计算**：复杂的数据处理（如聚合、排序、统计分析）应该在Web Worker中进行，避免阻塞主线程和影响用户交互。

**Canvas渲染**：对于超大数据量的散点图或折线图，可以考虑使用Canvas替代SVG进行渲染，因为Canvas的渲染性能远高于SVG。ECharts 5缺省使用Canvas渲染器，对于大数据量场景性能更好。

```javascript
// 大数据量渲染配置
const largeDataOption = {
    // 启用大数据模式
    large: true,
    largeThreshold: 1000,  // 超过1000个数据点时启用大数据模式

    // 采样配置
    sampling: 'lttb',       // 使用LTTB采样算法
    samplingThreshold: 500, // 采样后的数据点数量

    // 渐进加载配置
    progressive: 2000,      // 每帧渲染2000个数据点
    progressiveThreshold: 4000,
    progressiveChangeStance: 500,

    // 绑定配置
    bindbindBindEvents: false, // 关闭绑定事件以提升性能
    bindbindZoom: true
};
```

---

## 第五部分：实战项目

### 5.1 使用ECharts实现数据大屏

数据大屏是企业级可视化中常见的需求，它要求在一个大屏幕上展示多个关联的图表，提供全面的数据概览。以下是一个综合数据大屏的实现方案。

```javascript
// 数据大屏完整实现
class DataDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = {};
        this.data = {};

        // 初始化
        this.init();
    }

    init() {
        // 创建布局结构
        this.createLayout();

        // 初始化各个图表
        this.initCharts();

        // 模拟数据更新
        this.startDataUpdate();
    }

    // 创建大屏布局
    createLayout() {
        this.container.innerHTML = `
            <div class="dashboard-header">
                <h1>企业运营数据大屏</h1>
                <div class="header-info">
                    <span id="current-time"></span>
                    <span id="update-info"></span>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="row">
                    <div class="col-3">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>今日销售额</h3>
                            </div>
                            <div class="card-body">
                                <div class="big-number" id="total-sales">¥0</div>
                                <div class="compare-info">
                                    <span class="up">↑ 12.5%</span>
                                    <span>较昨日</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>今日订单量</h3>
                            </div>
                            <div class="card-body">
                                <div class="big-number" id="total-orders">0</div>
                                <div class="compare-info">
                                    <span class="up">↑ 8.3%</span>
                                    <span>较昨日</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>活跃用户</h3>
                            </div>
                            <div class="card-body">
                                <div class="big-number" id="active-users">0</div>
                                <div class="compare-info">
                                    <span class="down">↓ 3.2%</span>
                                    <span>较昨日</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>转化率</h3>
                            </div>
                            <div class="card-body">
                                <div class="big-number" id="conversion-rate">0%</div>
                                <div class="compare-info">
                                    <span class="up">↑ 1.8%</span>
                                    <span>较昨日</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-8">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>销售趋势</h3>
                            </div>
                            <div class="card-body">
                                <div id="sales-trend-chart" style="height: 300px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>销售分布</h3>
                            </div>
                            <div class="card-body">
                                <div id="sales-distribution-chart" style="height: 300px;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-6">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>实时订单</h3>
                            </div>
                            <div class="card-body">
                                <div id="realtime-orders-chart" style="height: 280px;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3>区域销售排名</h3>
                            </div>
                            <div class="card-body">
                                <div id="region-rank-chart" style="height: 280px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 更新时间显示
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    // 更新时钟
    updateTime() {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // 初始化所有图表
    initCharts() {
        // 销售趋势图
        this.charts.salesTrend = echarts.init(
            document.getElementById('sales-trend-chart')
        );
        this.charts.salesTrend.setOption(this.getSalesTrendOption());

        // 销售分布饼图
        this.charts.salesDistribution = echarts.init(
            document.getElementById('sales-distribution-chart')
        );
        this.charts.salesDistribution.setOption(this.getSalesDistributionOption());

        // 实时订单图
        this.charts.realtimeOrders = echarts.init(
            document.getElementById('realtime-orders-chart')
        );
        this.charts.realtimeOrders.setOption(this.getRealtimeOrdersOption());

        // 区域排名图
        this.charts.regionRank = echarts.init(
            document.getElementById('region-rank-chart')
        );
        this.charts.regionRank.setOption(this.getRegionRankOption());

        // 响应窗口变化
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                chart.resize();
            });
        });
    }

    // 销售趋势图配置
    getSalesTrendOption() {
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: ['销售额', '订单量'],
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                top: '10%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: this.generateTimeLabels(24)
            },
            yAxis: [
                {
                    type: 'value',
                    name: '销售额（万元）',
                    position: 'left',
                    axisLabel: {
                        formatter: '{value}'
                    }
                },
                {
                    type: 'value',
                    name: '订单量',
                    position: 'right',
                    axisLabel: {
                        formatter: '{value}'
                    }
                }
            ],
            series: [
                {
                    name: '销售额',
                    type: 'line',
                    smooth: true,
                    data: this.generateRandomData(24, 50, 200),
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(52, 152, 219, 0.5)' },
                            { offset: 1, color: 'rgba(52, 152, 219, 0.1)' }
                        ])
                    }
                },
                {
                    name: '订单量',
                    type: 'line',
                    smooth: true,
                    yAxisIndex: 1,
                    data: this.generateRandomData(24, 100, 500)
                }
            ]
        };
    }

    // 销售分布饼图配置
    getSalesDistributionOption() {
        return {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}万 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: {
                    fontSize: 12
                }
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['40%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 5,
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
                            fontSize: 16,
                            fontWeight: 'bold'
                        }
                    },
                    data: [
                        { value: 335, name: '电子产品', itemStyle: { color: '#3498DB' } },
                        { value: 234, name: '服装鞋帽', itemStyle: { color: '#2ECC71' } },
                        { value: 154, name: '食品饮料', itemStyle: { color: '#E74C3C' } },
                        { value: 135, name: '家居用品', itemStyle: { color: '#F39C12' } },
                        { value: 148, name: '其他', itemStyle: { color: '#9B59B6' } }
                    ]
                }
            ]
        };
    }

    // 实时订单图配置
    getRealtimeOrdersOption() {
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push({
                value: [
                    i,
                    Math.random() * 100
                ]
            });
        }

        return {
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    return `时间: ${params[0].value[0]}分钟前<br/>订单数: ${params[0].value[1].toFixed(0)}`;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 20,
                axisLabel: {
                    formatter: function(value) {
                        return value === 0 ? '现在' : `-${value}分钟`;
                    }
                }
            },
            yAxis: {
                type: 'value',
                min: 0,
                axisLabel: {
                    formatter: '{value}'
                }
            },
            series: [
                {
                    type: 'bar',
                    data: data.map(d => ({
                        value: d.value,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#3498DB' },
                                { offset: 1, color: '#85C1E9' }
                            ])
                        }
                    })),
                    barWidth: '60%'
                }
            ]
        };
    }

    // 区域排名配置
    getRegionRankOption() {
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '8%',
                bottom: '3%',
                top: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value}万'
                }
            },
            yAxis: {
                type: 'category',
                data: ['西南', '华中', '东北', '华北', '华南', '华东'],
                axisLabel: {
                    fontSize: 12
                }
            },
            series: [
                {
                    type: 'bar',
                    data: [320, 452, 580, 690, 780, 920],
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#2980B9' },
                            { offset: 1, color: '#3498DB' }
                        ]),
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{c}万',
                        fontSize: 12
                    }
                }
            ]
        };
    }

    // 生成时间标签
    generateTimeLabels(count) {
        const labels = [];
        for (let i = count - 1; i >= 0; i--) {
            const hour = (24 - i) % 24;
            labels.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return labels;
    }

    // 生成随机数据
    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min) + min));
        }
        return data;
    }

    // 更新数字显示
    updateNumber(id, value, prefix = '', suffix = '') {
        const el = document.getElementById(id);
        if (el) {
            // 动画过渡效果
            const currentValue = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
            const targetValue = typeof value === 'number' ? value : parseFloat(value) || 0;

            const duration = 500;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 缓动函数
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const displayValue = currentValue + (targetValue - currentValue) * easeProgress;

                el.textContent = prefix + displayValue.toLocaleString() + suffix;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }

    // 模拟数据更新
    startDataUpdate() {
        setInterval(() => {
            // 更新关键数字
            this.updateNumber('total-sales', Math.random() * 500000 + 100000, '¥');
            this.updateNumber('total-orders', Math.floor(Math.random() * 5000 + 10000));
            this.updateNumber('active-users', Math.floor(Math.random() * 50000 + 80000));
            this.updateNumber('conversion-rate', Math.random() * 5 + 3, '', '%');

            // 更新图表数据
            const updateInfoEl = document.getElementById('update-info');
            if (updateInfoEl) {
                updateInfoEl.textContent = `最后更新: ${new Date().toLocaleTimeString()}`;
            }

            // 更新趋势图
            const trendOption = this.charts.salesTrend.getOption();
            trendOption.series[0].data.shift();
            trendOption.series[0].data.push(Math.floor(Math.random() * 200 + 50));
            trendOption.series[1].data.shift();
            trendOption.series[1].data.push(Math.floor(Math.random() * 500 + 100));
            this.charts.salesTrend.setOption(trendOption);

            // 更新实时订单图
            const realtimeOption = this.charts.realtimeOrders.getOption();
            realtimeOption.series[0].data.shift();
            realtimeOption.series[0].data.push({
                value: [0, Math.random() * 100],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#2980B9' },
                        { offset: 1, color: '#3498DB' }
                    ])
                }
            });
            // 更新X轴数据
            realtimeOption.xAxis.data = realtimeOption.xAxis.data.map(v => v + 1);
            this.charts.realtimeOrders.setOption(realtimeOption, true);

        }, 3000);
    }

    // 销毁大屏
    dispose() {
        Object.values(this.charts).forEach(chart => {
            chart.dispose();
        });
    }
}
```

### 5.2 实现一个实时更新的股票K线图

K线图（蜡烛图）是金融数据可视化的核心图表类型，它能够同时展示开盘价、收盘价、最高价和最低价四个关键数据点。以下是使用ECharts实现的专业K线图。

```javascript
// K线图完整实现
class StockKLineChart {
    constructor(containerId, stockCode) {
        this.containerId = containerId;
        this.stockCode = stockCode;
        this.chart = null;
        this.currentMA5 = [];
        this.currentMA10 = [];
        this.currentMA20 = [];

        this.init();
    }

    init() {
        this.chart = echarts.init(document.getElementById(this.containerId));

        // 生成模拟K线数据
        const data = this.generateKLineData();

        // 计算均线
        this.calculateMA(data, 5, this.currentMA5);
        this.calculateMA(data, 10, this.currentMA10);
        this.calculateMA(data, 20, this.currentMA20);

        const option = this.createOption(data);
        this.chart.setOption(option);

        // 响应窗口变化
        window.addEventListener('resize', () => {
            this.chart.resize();
        });

        // 模拟实时更新
        this.startRealTimeUpdate();
    }

    // 生成K线数据
    generateKLineData() {
        const data = [];
        let basePrice = 100;
        const today = new Date();

        for (let i = 60; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // 随机生成涨跌
            const change = (Math.random() - 0.48) * 5;
            const open = basePrice;
            const close = basePrice + change;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            const volume = Math.floor(Math.random() * 10000000 + 5000000);

            data.push({
                date: this.formatDate(date),
                open: open.toFixed(2),
                close: close.toFixed(2),
                high: high.toFixed(2),
                low: low.toFixed(2),
                volume: volume
            });

            basePrice = close;
        }

        return data;
    }

    // 计算移动平均线
    calculateMA(data, period, resultArray) {
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                resultArray.push('-');
                continue;
            }

            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += parseFloat(data[i - j].close);
            }
            resultArray.push((sum / period).toFixed(2));
        }
    }

    // 创建K线图配置
    createOption(data) {
        const dates = data.map(d => d.date);
        const candleData = data.map(d => [d.open, d.close, d.low, d.high]);
        const volumes = data.map(d => d.volume);

        return {
            title: {
                text: `${this.stockCode} 股票走势`,
                left: 'center',
                textStyle: {
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },

            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                },
                formatter: function(params) {
                    const dataIndex = params[0].dataIndex;
                    const klineData = data[dataIndex];

                    let result = `<strong>${klineData.date}</strong><br/>`;
                    result += `开盘: <span style="color:#333">${klineData.open}</span><br/>`;
                    result += `收盘: <span style="color:${parseFloat(klineData.close) >= parseFloat(klineData.open) ? '#E74C3C' : '#2ECC71'}">${klineData.close}</span><br/>`;
                    result += `最低: <span style="color:#3498DB">${klineData.low}</span><br/>`;
                    result += `最高: <span style="color:#E74C3C">${klineData.high}</span><br/>`;
                    result += `成交量: ${(parseInt(klineData.volume) / 10000).toFixed(0)}万`;

                    return result;
                }
            },

            legend: {
                data: ['K线', 'MA5', 'MA10', 'MA20', '成交量'],
                selected: {
                    '成交量': false  // 默认隐藏成交量
                },
                top: 40
            },

            grid: [
                {
                    left: '10%',
                    right: '8%',
                    top: '15%',
                    height: '50%'
                },
                {
                    left: '10%',
                    right: '8%',
                    top: '68%',
                    height: '20%'
                }
            ],

            xAxis: [
                {
                    type: 'category',
                    data: dates,
                    gridIndex: 0,
                    axisLine: {
                        lineStyle: {
                            color: '#DDD'
                        }
                    },
                    axisLabel: {
                        show: true,
                        fontSize: 10
                    },
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                {
                    type: 'category',
                    data: dates,
                    gridIndex: 1,
                    axisLine: {
                        lineStyle: {
                            color: '#DDD'
                        }
                    },
                    axisLabel: {
                        show: false
                    },
                    axisTick: {
                        alignWithLabel: true
                    }
                }
            ],

            yAxis: [
                {
                    type: 'value',
                    gridIndex: 0,
                    scale: true,
                    splitNumber: 5,
                    axisLine: {
                        show: false
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#EEE',
                            type: 'dashed'
                        }
                    },
                    axisLabel: {
                        formatter: function(value) {
                            return value.toFixed(0);
                        }
                    }
                },
                {
                    type: 'value',
                    gridIndex: 1,
                    scale: true,
                    splitNumber: 3,
                    axisLine: {
                        show: false
                    },
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        formatter: function(value) {
                            return (value / 10000).toFixed(0) + '万';
                        }
                    }
                }
            ],

            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 60,
                    end: 100
                },
                {
                    type: 'slider',
                    xAxisIndex: [0, 1],
                    bottom: 5,
                    height: 20,
                    start: 60,
                    end: 100
                }
            ],

            series: [
                {
                    name: 'K线',
                    type: 'candlestick',
                    data: candleData,
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    itemStyle: {
                        color: '#E74C3C',      // 上涨颜色
                        color0: '#2ECC71',    // 下跌颜色
                        borderColor: '#E74C3C',
                        borderColor0: '#2ECC71'
                    }
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: this.currentMA5,
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        color: '#9B59B6',
                        width: 1
                    }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: this.currentMA10,
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        color: '#3498DB',
                        width: 1
                    }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: this.currentMA20,
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        color: '#F39C12',
                        width: 1
                    }
                },
                {
                    name: '成交量',
                    type: 'bar',
                    data: volumes,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    itemStyle: {
                        color: function(params) {
                            const dataIndex = params.dataIndex;
                            const kline = data[dataIndex];
                            return parseFloat(kline.close) >= parseFloat(kline.open)
                                ? '#E74C3C'
                                : '#2ECC71';
                        }
                    }
                }
            ]
        };
    }

    // 格式化日期
    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // 模拟实时数据更新
    startRealTimeUpdate() {
        setInterval(() => {
            const option = this.chart.getOption();

            // 获取最后一个数据点
            const lastIndex = option.series[0].data.length - 1;
            let lastCandle = option.series[0].data[lastIndex];

            // 模拟价格波动
            const change = (Math.random() - 0.48) * 2;
            const newClose = parseFloat(lastCandle[1]) + change;
            const newHigh = Math.max(parseFloat(lastCandle[2]), newClose, parseFloat(lastCandle[0]));
            const newLow = Math.min(parseFloat(lastCandle[3]), newClose, parseFloat(lastCandle[0]));

            // 更新K线数据
            option.series[0].data[lastIndex] = [
                lastCandle[0],
                newClose.toFixed(2),
                newLow.toFixed(2),
                newHigh.toFixed(2)
            ];

            // 更新均线
            const closePrices = option.series[0].data.map(d => parseFloat(d[1]));
            this.updateMA(closePrices, 5, option.series[1].data);
            this.updateMA(closePrices, 10, option.series[2].data);
            this.updateMA(closePrices, 20, option.series[3].data);

            // 更新成交量
            option.series[4].data[lastIndex] = Math.floor(Math.random() * 5000000 + 3000000);

            this.chart.setOption(option);

        }, 3000);
    }

    // 更新均线数据
    updateMA(closePrices, period, maData) {
        if (closePrices.length < period) return;

        let sum = 0;
        for (let i = closePrices.length - period; i < closePrices.length; i++) {
            sum += closePrices[i];
        }
        maData[closePrices.length - 1] = (sum / period).toFixed(2);
    }

    // 销毁图表
    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}
```

### 5.3 Canvas实现粒子动画背景

粒子动画是现代Web设计中常见的视觉效果，常用于背景装饰、数据可视化等场景。以下是一个高性能的粒子动画系统：

```javascript
// 粒子动画系统
class ParticleAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mousePos = { x: null, y: null };
        this.isRunning = false;

        // 配置参数
        this.config = {
            particleCount: 100,      // 粒子数量
            particleColor: '#3498DB', // 粒子颜色
            lineColor: '#3498DB',     // 连接线颜色
            particleRadius: 2,         // 粒子半径
            connectionDistance: 150,  // 连接距离
            mouseInfluenceDistance: 200, // 鼠标影响距离
            particleSpeed: 0.5,        // 粒子速度
            enableMouseEffect: true,   // 启用鼠标效果
            enableColorshift: true    // 启用颜色渐变
        };

        // 初始化
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
    }

    // 调整画布尺寸
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // 创建粒子
    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.particleSpeed,
                vy: (Math.random() - 0.5) * this.config.particleSpeed,
                radius: Math.random() * this.config.particleRadius + 1,
                hue: Math.random() * 60 + 200, // 蓝色范围 (200-260)
                alpha: Math.random() * 0.5 + 0.5
            });
        }
    }

    // 绑定事件
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mousePos.x = null;
            this.mousePos.y = null;
        });

        // 触摸支持
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.mousePos.x = e.touches[0].clientX;
                this.mousePos.y = e.touches[0].clientY;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.mousePos.x = null;
            this.mousePos.y = null;
        });
    }

    // 更新粒子
    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 更新位置
            p.x += p.vx;
            p.y += p.vy;

            // 边界检测（反弹）
            if (p.x < 0 || p.x > this.canvas.width) {
                p.vx *= -1;
                p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            }

            if (p.y < 0 || p.y > this.canvas.height) {
                p.vy *= -1;
                p.y = Math.max(0, Math.min(this.canvas.height, p.y));
            }

            // 鼠标影响
            if (this.config.enableMouseEffect && this.mousePos.x !== null) {
                const dx = this.mousePos.x - p.x;
                const dy = this.mousePos.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.mouseInfluenceDistance) {
                    const force = (this.config.mouseInfluenceDistance - distance) / this.config.mouseInfluenceDistance;
                    const angle = Math.atan2(dy, dx);

                    p.vx -= Math.cos(angle) * force * 0.2;
                    p.vy -= Math.sin(angle) * force * 0.2;

                    // 限制最大速度
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > this.config.particleSpeed * 3) {
                        p.vx = (p.vx / speed) * this.config.particleSpeed * 3;
                        p.vy = (p.vy / speed) * this.config.particleSpeed * 3;
                    }
                }
            }

            // 颜色变化
            if (this.config.enableColorshift) {
                p.hue = (p.hue + 0.1) % 360;
            }
        }
    }

    // 绘制粒子
    drawParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

            if (this.config.enableColorshift) {
                this.ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`;
            } else {
                this.ctx.fillStyle = this.config.particleColor;
            }

            this.ctx.fill();
        }
    }

    // 绘制连接线
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    const opacity = 1 - (distance / this.config.connectionDistance);

                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);

                    if (this.config.enableColorshift) {
                        this.ctx.strokeStyle = `hsla(${200}, 70%, 60%, ${opacity * 0.3})`;
                    } else {
                        this.ctx.strokeStyle = `rgba(52, 152, 219, ${opacity * 0.3})`;
                    }

                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    // 主动画循环
    animate() {
        if (!this.isRunning) return;

        // 清空画布（带渐变背景效果）
        this.ctx.fillStyle = 'rgba(17, 17, 19, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制
        this.updateParticles();
        this.drawConnections();
        this.drawParticles();

        requestAnimationFrame(() => this.animate());
    }

    // 启动动画
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // 设置初始背景
        this.ctx.fillStyle = 'rgba(17, 17, 19, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.animate();
    }

    // 停止动画
    stop() {
        this.isRunning = false;
    }

    // 更新配置
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }

    // 添加粒子
    addParticle(x, y) {
        this.particles.push({
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * this.config.particleSpeed,
            vy: (Math.random() - 0.5) * this.config.particleSpeed,
            radius: Math.random() * this.config.particleRadius + 1,
            hue: Math.random() * 60 + 200,
            alpha: Math.random() * 0.5 + 0.5
        });
    }

    // 销毁
    dispose() {
        this.stop();
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
```

---

## 第六部分：高级可视化

### 6.1 WebGL基础：Three.js

Three.js是WebGL的高级封装库，它大大简化了3D图形的创建过程。虽然Three.js的完整教程需要大量篇幅，但了解其核心概念对于数据可视化开发者来说非常重要。

```javascript
// Three.js基础示例：3D散点图
function createThreeJSScatterPlot() {
    // 场景、相机、渲染器
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(
        75,                                     // 视野角度
        window.innerWidth / window.innerHeight, // 宽高比
        0.1,                                    // 近裁切面
        1000                                    // 远裁切面
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper(30);
    scene.add(axesHelper);

    // 生成3D散点数据
    const pointCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);

    for (let i = 0; i < pointCount; i++) {
        const i3 = i * 3;

        // 随机位置（球形分布）
        const radius = Math.random() * 20 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // 颜色（基于高度）
        const height = positions[i3 + 1];
        const normalizedHeight = (height + 20) / 40;

        if (normalizedHeight > 0.5) {
            colors[i3] = 0.2 + (normalizedHeight - 0.5);
            colors[i3 + 1] = 0.8;
            colors[i3 + 2] = 0.4;
        } else {
            colors[i3] = 0.3;
            colors[i3 + 1] = 0.5 + normalizedHeight;
            colors[i3 + 2] = 0.9;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 创建点材质
    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    // 创建点云
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // 鼠标交互控制
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        points.rotation.y += deltaX * 0.01;
        points.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 窗口大小调整
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);

        // 自动旋转
        if (!isDragging) {
            points.rotation.y += 0.002;
        }

        renderer.render(scene, camera);
    }

    animate();

    return { scene, camera, renderer, points };
}
```

### 6.2 关系图谱：Graphin

Graphin是基于G6的关系图谱可视化库，专门用于展示实体之间的关系网络。它提供了丰富的交互功能和美观的默认样式，是构建知识图谱、社交网络分析等应用的理想选择。

```javascript
// Graphin关系图谱示例
function createRelationGraph() {
    const container = document.getElementById('graphin-container');

    const graphin = new Graphin({
        container,
        width: 800,
        height: 600,
        // 主题配置
        theme: {
            primaryColor: '#3498DB'
        }
    });

    // 节点数据
    const nodes = [
        { id: 'user1', data: { label: '张三', type: 'person' } },
        { id: 'user2', data: { label: '李四', type: 'person' } },
        { id: 'user3', data: { label: '王五', type: 'person' } },
        { id: 'company1', data: { label: '阿里巴巴', type: 'company' } },
        { id: 'company2', data: { label: '腾讯', type: 'company' } },
        { id: 'product1', data: { label: '淘宝', type: 'product' } },
        { id: 'product2', data: { label: '微信', type: 'product' } },
    ];

    // 边数据
    const edges = [
        { source: 'user1', target: 'company1', data: { relation: '创始人' } },
        { source: 'user2', target: 'company1', data: { relation: 'CEO' } },
        { source: 'user3', target: 'company2', data: { relation: 'CTO' } },
        { source: 'user1', target: 'product1', data: { relation: '产品经理' } },
        { source: 'user2', target: 'product1', data: { relation: '开发者' } },
        { source: 'user3', target: 'product2', data: { relation: '开发者' } },
        { source: 'company1', target: 'product1', data: { relation: '旗下产品' } },
        { source: 'company2', target: 'product2', data: { relation: '旗下产品' } },
    ];

    // 渲染数据
    graphin.read({ nodes, edges });

    // 配置布局
    graphin.update({
        layout: {
            type: 'force',
            preventOverlap: true,
            nodeSize: 40,
            nodeSpacing: 20,
            linkDistance: 150,
            nodeStrength: -800,
            edgeStrength: 0.3,
            collideStrength: 0.8,
            alpha: 0.3,
            alphaDecay: 0.02
        }
    });

    // 节点样式定制
    graphin.node((node) => {
        const typeStyles = {
            person: { color: '#3498DB', size: 30 },
            company: { color: '#E74C3C', size: 50 },
            product: { color: '#2ECC71', size: 40 }
        };

        const style = typeStyles[node.data.type] || typeStyles.person;

        return {
            style: {
                label: {
                    value: node.data.label,
                    fill: '#FFF',
                    fontSize: 12
                },
                body: {
                    fill: style.color,
                    stroke: style.color,
                    size: style.size
                },
                icon: {
                    value: node.data.type === 'person' ? '\uf007' :
                           node.data.type === 'company' ? '\uf0f2' : '\uf0e7',
                    fill: '#FFF'
                }
            }
        };
    });

    // 边样式定制
    graphin.edge((edge) => {
        return {
            style: {
                label: {
                    value: edge.data.relation,
                    fill: '#999',
                    fontSize: 10
                },
                line: {
                    stroke: '#BDC3C7',
                    lineWidth: 1.5,
                    opacity: 0.6
                }
            }
        };
    });

    // 交互行为
    graphin.behaviors({
        drag: true,       // 拖拽节点
        zoom: true,       // 缩放画布
        dragCanvas: true  // 拖拽画布
    });

    return graphin;
}
```

---

## 总结

本指南全面介绍了Canvas绑定与数据可视化的核心技术。从Canvas的基础绑制API到动画与交互实现，从ECharts、Chart.js、D3.js等主流可视化库的使用到大型数据可视化项目的构建，我们涵盖了Web前端数据可视化的方方面面。

关键要点回顾：

**Canvas基础**方面，我们学习了Canvas元素的创建、2D上下文的获取、各种图形绑制API（线、矩形、圆形、文本、图片）以及坐标变换技术。离屏Canvas和双缓冲技术是提升渲染性能的重要手段。

**动画与交互**方面，requestAnimationFrame是实现流畅动画的核心API。碰撞检测算法（矩形、圆形、点与图形）是游戏开发和交互式应用的基础。鼠标事件和触摸事件的正确处理对于移动端支持至关重要。

**数据可视化库**方面，ECharts提供了最完整的图表类型和强大的配置能力，适合企业级应用；Chart.js轻量且易用，适合简单图表需求；D3.js提供了最大的灵活性，适合需要自定义可视化的场景。

**最佳实践**方面，选择合适的图表类型、遵循可视化设计原则、实现响应式布局、处理大数据量渲染是创建优秀可视化作品的关键。

通过本指南的学习，你应该能够独立创建各类数据可视化应用，从简单的图表展示到复杂的数据大屏系统。建议在学习过程中多动手实践，逐步深入理解各个知识点，最终形成自己的可视化技术体系。

