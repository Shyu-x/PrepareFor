# Canvas 2D绑定上下文与绘图基础

## 写在前面的话

嗨，各位前端小伙伴们！今天我们来聊一聊Canvas 2D绘图这个看似古老但却超级实用的技术。别看它名字里带着"2D"，实际上在很多场景下，它比那些炫酷的3D渲染还要来得直接高效。

你有没有想过，为什么有些网页上的图表那么流畅？为什么有些在线白板工具可以实现毫秒级的绘制响应？答案很可能就藏在Canvas 2D这个"老古董"技术里。

在开始之前，让我先给你打个预防针：Canvas就像是你手里的一支画笔，它能干的事情远超你想象。但是，你得先学会怎么握这支笔——也就是怎么正确地获取和使用Canvas的绘图上下文。

## 一、Canvas到底是什么？

### 1.1 画布的本质

想象一下，Canvas就像是画家手里的一块画布。不过这块画布有点特殊——它是一块由像素组成的矩形区域，我们可以在上面画任何想要的东西。

从技术角度来说，Canvas是一个HTML5新增的元素标签，它的本职工作就是提供一个"画布"区域，让JavaScript可以在上面绘制图形。

```html
<!-- 最简单的Canvas创建方式 -->
<canvas id="myCanvas" width="800" height="600"></canvas>
```

看到了吗？这就是创建一个画布的全部代码。id是我们用来找到这块画布的"身份证"，width和height则决定了画布的大小。记住，这三个属性缺一不可！

不过，这里有个坑我得提醒你：Canvas元素本身只是一个"容器"，它本身并不会画画。真正负责画画的是藏在它里面的"画家"——也就是2D绑定上下文（2D Context）。

### 1.2 理解绑定上下文

好，现在我们知道了Canvas是一块画布。那问题来了：如果让你在真实的画布上画画，你需要什么？

你需要画家对吧？画家得先站在画布前，做好绘画的准备，然后才开始动笔。

Canvas的绑定上下文就是这么一个"画家"的角色。它是浏览器提供给我们的一个对象，专门负责在Canvas上执行绘图操作。

```javascript
// 获取Canvas元素
const canvas = document.getElementById('myCanvas');

// 获取2D绑定上下文——这就相当于请了一位画家
const ctx = canvas.getContext('2d');

// 现在我们就可以让这位"画家"开始工作了
ctx.fillStyle = 'red';  // 选择红色的颜料
ctx.fillRect(100, 100, 200, 200);  // 画一个红色矩形
```

上面的代码解释一下：首先我们找到了id为myCanvas的画布，然后请来了一位"2D画家"（getContext('2d')），最后我们告诉画家：用红色颜料画一个矩形。

getContext('2d')这个方法非常关键！如果没有调用它，你得到的canvas变量就只是一块空白的画布，什么也画不了。这是我见过的最常见的初学者错误。

### 1.3 坐标系：Canvas的地址系统

在继续之前，我们必须先搞清楚Canvas的坐标系。Canvas使用的是一种叫做"笛卡尔坐标系"的地址系统，但是它的y轴方向和数学里学的有点不一样。

让我给你解释一下：

```
Canvas坐标系（y轴向下为正）：

原点(0,0)在左上角
    → x轴向右增加
    ↓
    y轴向下增加


对比数学坐标系（y轴向上为正）：

    ↑ y轴向上增加
    |
    → x轴向右增加
原点(0,0)在左下角
```

这个差异非常重要！很多初学者在这个地方栽了跟头。比如你想画一个向上的三角形，在数学里是从下往上画，但在Canvas里，你得从上往下画。

```javascript
// 在Canvas里画一个三角形（顶点朝上）
ctx.beginPath();  // 开始一个新路径
ctx.moveTo(200, 100);  // 移动到顶点位置
ctx.lineTo(100, 300);  // 画到左下角
ctx.lineTo(300, 300);  // 画到右下角
ctx.closePath();  // 闭合路径（自动连接到起点）
ctx.fill();  // 填充颜色
```

## 二、路径绘制：Canvas的灵魂

### 2.1 什么是路径？

路径这个词听起来有点抽象。让我用一个生活化的比喻来解释：

想象你要用笔画一条曲线。你会怎么做？一般来说，你会先把笔尖放到纸上的某个点，然后移动手腕让笔滑动，最后抬起笔。这整个"笔尖移动的轨迹"，就是路径。

在Canvas里，路径就是这么个东西——一系列连起来的"笔触"。你可以用路径画直线、曲线、弧线，甚至是复杂的形状。

### 2.2 基础路径操作

Canvas提供了一套完整的路径API，让我们可以画出各种形状。让我一个个来介绍：

**beginPath()——开始一段新的旅程**

这个方法告诉Canvas：我要开始画新的东西了，之前画的不算。把它想象成你拿起画笔，准备开始一幅新画。

```javascript
// 每次画新图形之前，都应该调用beginPath
ctx.beginPath();  // 开始新路径
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 100, 100);  // 画一个蓝色矩形
```

**moveTo()——笔尖跳跃**

这个方法可以让你的"笔"移动到指定位置，但不会画出线条。就像你把笔尖提起来，移到新的位置再落下。

```javascript
ctx.beginPath();
ctx.moveTo(100, 100);  // 把笔移到(100,100)位置
ctx.lineTo(200, 200);  // 画线到(200,200)
ctx.lineTo(100, 200);  // 画线到(100,200)
ctx.stroke();  // 描边
```

**lineTo()——画出线条**

这个方法从当前位置画一条直线到指定位置。注意，如果你之前没有调用moveTo，那默认从原点(0,0)开始。

```javascript
ctx.beginPath();
ctx.moveTo(100, 100);  // 从(100,100)开始
ctx.lineTo(200, 100);  // 画一条水平线到(200,100)
ctx.lineTo(200, 200);  // 画一条垂直线到(200,200)
ctx.lineTo(100, 200);  // 画一条水平线到(100,200)
ctx.closePath();  // 闭合回起点
ctx.stroke();  // 描边显示线条
```

**closePath()——闭合路径**

这个方法会自动把终点和起点连接起来，形成一个封闭的形状。如果你画的是一个需要填充的图形，这个步骤是必须的。

```javascript
// 画一个三角形
ctx.beginPath();
ctx.moveTo(200, 50);   // 顶点
ctx.lineTo(100, 150);  // 左下角
ctx.lineTo(300, 150);  // 右下角
ctx.closePath();       // 自动闭合，形成三角形
ctx.fillStyle = 'orange';
ctx.fill();            // 填充
```

### 2.3 矩形与清除操作

Canvas提供了两种画矩形的方式，一种是一步到位的，另一种需要分步骤：

**fillRect()和strokeRect()——快捷方式**

```javascript
// 填充矩形（一步画好）
ctx.fillStyle = '#FF5733';
ctx.fillRect(x, y, width, height);

// 描边矩形（只有边框）
ctx.strokeStyle = '#33FF57';
ctx.strokeRect(x, y, width, height);

// 清除矩形区域（相当于"橡皮擦"）
ctx.clearRect(x, y, width, height);
```

**rect()——把矩形加入路径**

```javascript
ctx.beginPath();
ctx.rect(50, 50, 200, 100);  // 添加矩形到当前路径
ctx.fillStyle = 'purple';
ctx.fill();
```

### 2.4 弧线和曲线

**arc()——画圆弧**

这个方法用来画圆或者圆弧。想象一下用圆规画圆的感觉，你就知道arc是干什么的了。

```javascript
// arc(x, y, radius, startAngle, endAngle, counterclockwise)
// x, y: 圆心坐标
// radius: 半径
// startAngle, endAngle: 起始和结束角度（弧度）
// counterclockwise: 是否逆时针绘制

ctx.beginPath();
// 画一个完整的圆（从0到2π）
ctx.arc(200, 200, 100, 0, Math.PI * 2);
ctx.fillStyle = 'skyblue';
ctx.fill();

// 画一个半圆
ctx.beginPath();
ctx.arc(200, 400, 80, 0, Math.PI, false);
ctx.fillStyle = 'coral';
ctx.fill();

// 画一个扇形
ctx.beginPath();
ctx.moveTo(200, 300);  // 移到圆心
ctx.arc(200, 300, 80, 0, Math.PI * 1.5, false);
ctx.closePath();
ctx.fillStyle = 'gold';
ctx.fill();
```

角度和弧度的换算关系：360度 = 2π弧度，所以：
- 0度 = 0弧度
- 90度 = π/2弧度
- 180度 = π弧度
- 270度 = 3π/2弧度

**bezierCurveTo()——贝塞尔曲线**

贝塞尔曲线是Canvas里画曲线的主力军。它通过"控制点"来确定曲线的形状，是工业制图里常用的数学曲线。

```javascript
// bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
// cp1x, cp1y: 第一个控制点
// cp2x, cp2y: 第二个控制点
// x, y: 终点

ctx.beginPath();
ctx.moveTo(50, 200);  // 起点

// 画一条贝塞尔曲线
ctx.bezierCurveTo(
  100, 50,   // 控制点1（cp1）
  300, 350,  // 控制点2（cp2）
  350, 200   // 终点
);

ctx.strokeStyle = 'red';
ctx.stroke();
```

**quadraticCurveTo()——二次贝塞尔曲线**

这个是贝塞尔曲线的简化版，只有一个控制点：

```javascript
// quadraticCurveTo(cpx, cpy, x, y)
// cpx, cpy: 控制点
// x, y: 终点

ctx.beginPath();
ctx.moveTo(50, 200);
ctx.quadraticCurveTo(200, 0, 350, 200);  // 只有一个控制点
ctx.stroke();
```

## 三、样式填充：让图形更漂亮

### 3.1 颜色填充

Canvas支持多种颜色格式：

```javascript
// 1. 颜色名称（英文）
ctx.fillStyle = 'red';
ctx.fillStyle = 'skyblue';
ctx.fillStyle = 'coral';

// 2. 十六进制颜色（最常用）
ctx.fillStyle = '#FF5733';
ctx.fillStyle = '#333';        // 缩写形式，等同于#333333
ctx.fillStyle = '#RRGGBBAA';  // 带透明度的十六进制

// 3. RGB格式
ctx.fillStyle = 'rgb(255, 87, 51)';
ctx.fillStyle = 'rgb(100%, 50%, 20%)';  // 也可以用百分比

// 4. RGBA格式（带透明度）
ctx.fillStyle = 'rgba(255, 87, 51, 0.5)';  // 50%透明度

// 5. HSL格式（艺术设计专用）
ctx.fillStyle = 'hsl(12, 100%, 60%)';  // 色相、饱和度、亮度
```

### 3.2 渐变填充：让你的图形更有质感

渐变是Canvas里非常强大的功能，它可以让你创建从一种颜色平滑过渡到另一种颜色的效果。

**线性渐变（Linear Gradient）**

想象一下彩虹从地平线一端延伸到另一端，那就是线性渐变。

```javascript
// createLinearGradient(x1, y1, x2, y2)
// x1, y1: 渐变起点
// x2, y2: 渐变终点

// 水平渐变（从左到右）
const horizontalGradient = ctx.createLinearGradient(0, 0, 400, 0);
horizontalGradient.addColorStop(0, 'red');
horizontalGradient.addColorStop(0.5, 'yellow');
horizontalGradient.addColorStop(1, 'blue');

ctx.fillStyle = horizontalGradient;
ctx.fillRect(0, 0, 400, 200);

// 垂直渐变（从上到下）
const verticalGradient = ctx.createLinearGradient(0, 0, 0, 300);
verticalGradient.addColorStop(0, '#667eea');
verticalGradient.addColorStop(1, '#764ba2');

ctx.fillStyle = verticalGradient;
ctx.fillRect(0, 250, 400, 300);

// 对角线渐变
const diagonalGradient = ctx.createLinearGradient(0, 0, 400, 400);
diagonalGradient.addColorStop(0, '#11998e');
diagonalGradient.addColorStop(1, '#38ef7d');

ctx.fillStyle = diagonalGradient;
ctx.fillRect(0, 600, 400, 400);
```

**径向渐变（Radial Gradient）**

径向渐变就像是从一个中心点向外扩散的颜色变化，类似太阳光照射的效果。

```javascript
// createRadialGradient(x1, y1, r1, x2, y2, r2)
// x1, y1: 内圆中心
// r1: 内圆半径
// x2, y2: 外圆中心
// r2: 外圆半径

// 创建一个球形渐变效果
const radialGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 150);
radialGradient.addColorStop(0, '#ffffff');    // 中心是白色
radialGradient.addColorStop(0.3, '#ffff00');   // 过渡到黄色
radialGradient.addColorStop(0.6, '#ff8800');   // 过渡到橙色
radialGradient.addColorStop(1, '#ff0000');     // 边缘是红色

ctx.beginPath();
ctx.arc(200, 200, 150, 0, Math.PI * 2);
ctx.fillStyle = radialGradient;
ctx.fill();

// 制作一个发光的太阳效果
const sunGradient = ctx.createRadialGradient(300, 300, 30, 300, 300, 100);
sunGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
sunGradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.8)');
sunGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

ctx.beginPath();
ctx.arc(300, 300, 100, 0, Math.PI * 2);
ctx.fillStyle = sunGradient;
ctx.fill();
```

**多节点渐变的高级用法**

渐变不一定要从0到1，可以添加任意多个颜色停止点：

```javascript
// 创建具有多个颜色段的渐变（类似彩虹效果）
const multiStopGradient = ctx.createLinearGradient(0, 0, 800, 0);

// 从红色到橙色到黄色到绿色到蓝色到靛蓝到紫色
multiStopGradient.addColorStop(0, '#ff0000');     // 红
multiStopGradient.addColorStop(0.167, '#ff8000');  // 橙
multiStopGradient.addColorStop(0.333, '#ffff00');  // 黄
multiStopGradient.addColorStop(0.5, '#00ff00');    // 绿
multiStopGradient.addColorStop(0.667, '#0000ff');  // 蓝
multiStopGradient.addColorStop(0.833, '#4b0082');  // 靛蓝
multiStopGradient.addColorStop(1, '#8b00ff');       // 紫

ctx.fillStyle = multiStopGradient;
ctx.fillRect(0, 0, 800, 100);

// 创建"斑马线"渐变（交替颜色）
const stripeGradient = ctx.createLinearGradient(0, 0, 100, 0);
stripeGradient.addColorStop(0, 'black');
stripeGradient.addColorStop(0.5, 'black');
stripeGradient.addColorStop(0.5, 'white');
stripeGradient.addColorStop(1, 'white');

ctx.fillStyle = stripeGradient;
ctx.fillRect(0, 0, 100, 50);
```

### 3.3 描边样式

除了填充，我们还可以给图形添加各种描边效果：

```javascript
// 线宽
ctx.lineWidth = 10;  // 10像素宽的线条

// 线帽样式（butt、round、square）
ctx.lineCap = 'round';  // 圆角线帽

// 线条连接样式（miter、round、bevel）
ctx.lineJoin = 'round';  // 圆角连接

// 斜接限制（只有lineJoin为miter时有效）
ctx.miterLimit = 10;

// 设置描边颜色
ctx.strokeStyle = 'blue';
ctx.stroke();

// 虚线效果
ctx.setLineDash([10, 5]);  // 10像素实线，5像素间隔
ctx.lineDashOffset = 0;  // 虚线偏移量（用于动画）
ctx.strokeRect(50, 50, 200, 100);
```

### 3.4 阴影效果

Canvas可以为图形添加阴影，让它们看起来更有立体感：

```javascript
// 设置阴影
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';  // 阴影颜色
ctx.shadowBlur = 10;       // 模糊程度
ctx.shadowOffsetX = 5;    // X方向偏移
ctx.shadowOffsetY = 5;    // Y方向偏移

// 画一个带阴影的矩形
ctx.fillStyle = '#3498db';
ctx.fillRect(100, 100, 200, 100);

// 注意：阴影会应用到后续所有的绘制操作
// 如果不想让下一个图形也有阴影，需要重置
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
```

## 四、图像操作：Canvas的杀手级功能

### 4.1 绘制图像

Canvas最强大的功能之一就是可以绘制图像（img元素、Video元素、甚至其他Canvas）。

```javascript
// 创建图像对象
const img = new Image();
img.src = '/path/to/image.png';

// 等待图像加载完成
img.onload = () => {
  // 绘制完整图像
  ctx.drawImage(img, x, y);

  // 绘制缩放后的图像
  ctx.drawImage(img, x, y, width, height);

  // 绘制图像的指定区域（裁剪并缩放）
  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  // sx, sy: 源图像的起始坐标
  // sWidth, sHeight: 从源图像裁剪的宽高
  // dx, dy: 目标画布的起始坐标
  // dWidth, dHeight: 目标绘制的宽高
  ctx.drawImage(img, 50, 50, 200, 200, 0, 0, 100, 100);
};
```

### 4.2 图像处理技巧

Canvas可以对图像进行各种处理，比如灰度化、亮度调整、模糊等：

```javascript
// 获取图像像素数据
const imageData = ctx.getImageData(sx, sy, sw, sh);
// imageData.data 是一个Uint8ClampedArray数组
// 格式为 [R, G, B, A, R, G, B, A, ...] 每个像素4个值

// 灰度化处理
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  // 使用加权平均法计算灰度值
  const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  data[i] = gray;     // R
  data[i + 1] = gray; // G
  data[i + 2] = gray; // B
}

ctx.putImageData(imageData, 0, 0);  // 放回画布

// 亮度调整
function adjustBrightness(imageData, brightness) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + brightness));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
  }
  return imageData;
}

// 反色处理
function invertColors(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}
```

### 4.3 离屏Canvas：性能优化的秘诀

离屏Canvas是Canvas高级用法中最重要的概念之一。它允许你创建一个"看不见"的Canvas，在上面预先绘制一些内容，然后再一次性绘制到主Canvas上。

```javascript
// 创建一个离屏Canvas
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = 200;
offscreenCanvas.height = 200;
const offCtx = offscreenCanvas.getContext('2d');

// 在离屏Canvas上预先绘制一个复杂的图形
offCtx.fillStyle = 'red';
offCtx.beginPath();
offCtx.arc(100, 100, 80, 0, Math.PI * 2);
offCtx.fill();

offCtx.fillStyle = 'white';
offCtx.font = 'bold 60px Arial';
offCtx.textAlign = 'center';
offCtx.textBaseline = 'middle';
offCtx.fillText('Hi', 100, 100);

// 实际使用时，只需要把离屏Canvas当作图片绘制即可
ctx.drawImage(offscreenCanvas, 50, 50);

// 进阶：使用requestAnimationFrame进行优化
function drawFrame() {
  // 清除主画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制离屏Canvas（性能很高）
  ctx.drawImage(offscreenCanvas, frameX, frameY);

  requestAnimationFrame(drawFrame);
}
```

## 五、文本绘制

Canvas提供了强大的文本绘制功能：

```javascript
// 设置字体
ctx.font = 'bold 24px Arial';
ctx.font = 'italic 20px "Microsoft YaHei"';  // 中文需要用引号包裹字体名

// 文本对齐
ctx.textAlign = 'left';    // left, center, right
ctx.textBaseline = 'top';  // top, middle, bottom, alphabetic

// 填充文本
ctx.fillStyle = 'white';
ctx.fillText('Hello Canvas', 100, 100);

// 描边文本
ctx.strokeStyle = 'black';
ctx.lineWidth = 1;
ctx.strokeText('Hello Canvas', 100, 100);

// 测量文本宽度（用于居中等场景）
const textWidth = ctx.measureText('Hello').width;

// 文本换行处理
function wrapText(text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine !== '') {
    lines.push(currentLine);
  }

  return lines;
}
```

## 六、实际项目中的Canvas用法

### 6.1 WebEnv-OS项目中的Canvas应用

在WebEnv-OS这个项目中，Canvas 2D主要用于桌面壁纸渲染、图标绘制等场景。让我来解析一下实际的使用方式：

```typescript
// WebEnv-OS项目中的Canvas用法示例

// 1. 桌面壁纸生成器
function generateWallpaper(width: number, height: number, theme: WallpaperTheme): string {
  // 创建离屏Canvas用于生成壁纸
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 根据主题绘制不同的背景
  if (theme.type === 'gradient') {
    // 渐变壁纸
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    theme.colors.forEach((color, index) => {
      gradient.addColorStop(index / (theme.colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (theme.type === 'particle') {
    // 粒子效果壁纸（静态版本）
    ctx.fillStyle = theme.baseColor;
    ctx.fillRect(0, 0, width, height);

    // 绘制粒子
    theme.particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.opacity})`;
      ctx.fill();
    });
  }

  return canvas.toDataURL('image/png');
}

// 2. 窗口内容缓存（离屏渲染优化）
class WindowCache {
  private cache: Map<string, HTMLCanvasElement> = new Map();

  // 创建窗口内容的离屏Canvas缓存
  cacheWindow(windowId: string, content: RenderableContent) {
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = content.width;
    cacheCanvas.height = content.height;
    const ctx = cacheCanvas.getContext('2d')!;

    // 渲染内容到缓存
    this.renderContent(ctx, content);

    this.cache.set(windowId, cacheCanvas);
  }

  // 获取缓存的窗口内容
  getCachedWindow(windowId: string, x: number, y: number, ctx: CanvasRenderingContext2D) {
    const cacheCanvas = this.cache.get(windowId);
    if (cacheCanvas) {
      ctx.drawImage(cacheCanvas, x, y);
    }
  }

  private renderContent(ctx: CanvasRenderingContext2D, content: RenderableContent) {
    // 根据内容类型进行渲染
    content.elements.forEach(element => {
      switch (element.type) {
        case 'rect':
          ctx.fillStyle = element.color;
          ctx.fillRect(element.x, element.y, element.width, element.height);
          break;
        case 'text':
          ctx.font = `${element.fontSize}px ${element.fontFamily}`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x, element.y);
          break;
        case 'image':
          const img = new Image();
          img.src = element.src;
          ctx.drawImage(img, element.x, element.y, element.width, element.height);
          break;
      }
    });
  }
}

// 3. 实时绘图白板功能
class DrawingBoard {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;

      // 使用线条连接上一个点和当前点，实现流畅绘制
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });

    this.canvas.addEventListener('mouseout', () => {
      this.isDrawing = false;
    });
  }

  // 橡皮擦功能
  erase(x: number, y: number, radius: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  // 撤销功能（使用历史记录）
  private history: ImageData[] = [];

  saveState() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history.push(imageData);
  }

  undo() {
    if (this.history.length > 0) {
      const imageData = this.history.pop()!;
      this.ctx.putImageData(imageData, 0, 0);
    }
  }
}
```

### 6.2 图表绘制工具

Canvas在数据可视化领域也有广泛应用：

```javascript
// 一个简单的折线图绘制工具
class LineChart {
  constructor(canvas, data, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data;
    this.options = {
      padding: options.padding || 40,
      lineColor: options.lineColor || '#3498db',
      lineWidth: options.lineWidth || 2,
      showDot: options.showDot !== undefined ? options.showDot : true,
      dotRadius: options.dotRadius || 4,
      gridColor: options.gridColor || '#eee',
      animate: options.animate !== undefined ? options.animate : true,
    };
  }

  draw() {
    const { padding, lineColor, lineWidth, showDot, dotRadius, gridColor, animate } = this.options;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 计算绘图区域
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // 找出数据的最大值和最小值
    const maxValue = Math.max(...this.data.map(d => d.value));
    const minValue = Math.min(...this.data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    // 计算每个数据点的位置
    const points = this.data.map((d, i) => ({
      x: padding + (i / (this.data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((d.value - minValue) / valueRange) * chartHeight,
      value: d.value,
      label: d.label
    }));

    // 绘制网格线
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (i / gridLines) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // 绘制Y轴标签
      const value = maxValue - (i / gridLines) * valueRange;
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), padding - 10, y + 4);
    }

    // 绘制折线
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // 绘制数据点
    if (showDot) {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 绘制标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    points.forEach(point => {
      ctx.fillText(point.label, point.x, height - padding + 20);
    });
  }
}

// 使用示例
const canvas = document.getElementById('chart');
canvas.width = 600;
canvas.height = 400;

const chart = new LineChart(canvas, [
  { label: '1月', value: 30 },
  { label: '2月', value: 45 },
  { label: '3月', value: 35 },
  { label: '4月', value: 60 },
  { label: '5月', value: 55 },
  { label: '6月', value: 70 },
], {
  padding: 50,
  lineColor: '#e74c3c',
  showDot: true,
});

chart.draw();
```

## 七、Canvas性能优化技巧

### 7.1 避免每帧重新绘制静态内容

Canvas最大的性能问题就是频繁重绘。如果你的画面有很多静态元素，每次都全部重绘会非常消耗性能。

**优化方案：使用离屏Canvas缓存**

```javascript
// 不好的做法：每帧重绘所有内容
function badRender() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 重绘背景（静态）
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 重绘复杂图形（静态）
  drawComplexShape();

  // 只移动的元素
  ctx.fillStyle = 'red';
  ctx.fillRect(ballX, ballY, 20, 20);
}

// 优化做法：分离静态和动态内容
const backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = canvas.width;
backgroundCanvas.height = canvas.height;
const bgCtx = backgroundCanvas.getContext('2d');

// 只需要绘制一次背景
bgCtx.fillStyle = '#f0f0f0';
bgCtx.fillRect(0, 0, canvas.width, canvas.height);
drawComplexShape(bgCtx);

function goodRender() {
  // 只清除动态区域
  ctx.clearRect(dynamicArea.x, dynamicArea.y, dynamicArea.width, dynamicArea.height);

  // 先绘制缓存的背景
  ctx.drawImage(backgroundCanvas, 0, 0);

  // 只重绘动态元素
  ctx.fillStyle = 'red';
  ctx.fillRect(ballX, ballY, 20, 20);
}
```

### 7.2 使用requestAnimationFrame

```javascript
// 不好的做法：使用setInterval
setInterval(() => {
  update();
  render();
}, 16);

// 好的做法：使用requestAnimationFrame
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
```

### 7.3 减少状态切换

每次改变Canvas状态（如填充颜色、线宽等）都会有性能开销。

```javascript
// 不好的做法：频繁切换状态
for (let i = 0; i < 100; i++) {
  ctx.fillStyle = 'red';
  ctx.fillRect(i * 10, 0, 8, 100);
  ctx.fillStyle = 'blue';
  ctx.fillRect(i * 10 + 4, 0, 8, 100);
}

// 优化做法：批量相同状态的操作
ctx.fillStyle = 'red';
for (let i = 0; i < 100; i++) {
  ctx.fillRect(i * 10, 0, 8, 100);
}

ctx.fillStyle = 'blue';
for (let i = 0; i < 100; i++) {
  ctx.fillRect(i * 10 + 4, 0, 8, 100);
}
```

### 7.4 考虑使用WebGL

如果你的应用需要大量图形计算或者3D效果，考虑使用WebGL而不是Canvas 2D。WebGL直接调用GPU，性能会比Canvas 2D高出几个数量级。

## 八、常见问题与解决方案

### 8.1 Canvas模糊/高清屏问题

在高清屏（如Retina显示器）上，Canvas可能会显示模糊。解决方案是使用devicePixelRatio：

```javascript
function setupHighDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // CSS尺寸保持不变
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  return ctx;
}
```

### 8.2 Canvas跨域问题

当Canvas绘制来自其他域的图像时，会触发跨域限制，导致无法获取像素数据：

```javascript
// 设置图像的crossOrigin属性
const img = new Image();
img.crossOrigin = 'anonymous';  // 或者 'use-credentials'
img.src = 'https://other-domain.com/image.png';

img.onload = () => {
  ctx.drawImage(img, 0, 0);
  // 现在可以安全地获取像素数据了
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
};
```

### 8.3 Canvas内存泄漏

长时间运行的Canvas应用可能会遇到内存泄漏问题。以下是一些避免泄漏的建议：

```javascript
// 及时清理不再使用的Canvas
function destroyCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.remove();
}

// 清理事件监听器
const handleMouseMove = (e) => { /* ... */ };
canvas.addEventListener('mousemove', handleMouseMove);

// 移除时清理监听器
canvas.removeEventListener('mousemove', handleMouseMove);
```

## 九、总结

Canvas 2D是前端开发者必须掌握的一项基础技能。它简单易学，功能强大，应用场景广泛。从简单的图形绘制到复杂的数据可视化，再到游戏开发，Canvas都能发挥重要作用。

记住学习Canvas的几个要点：

1. **理解上下文**：getContext('2d')是Canvas绘图的起点
2. **掌握路径API**：beginPath、moveTo、lineTo、arc、bezierCurveTo等
3. **灵活运用样式**：颜色、渐变、阴影、描边
4. **善用离屏Canvas**：这是性能优化的关键
5. **注意坐标系**：Canvas的y轴向下为正，与数学坐标系相反
6. **使用requestAnimationFrame**：实现流畅的动画效果

好了，关于Canvas 2D的基础知识就介绍到这里。希望这篇文章能帮助你建立起对Canvas的全面认识。如果你想继续深入学习WebGL，可以阅读本专题的下一篇文章《WebGL渲染管线与着色器完全指南》。

祝你Coding愉快！
