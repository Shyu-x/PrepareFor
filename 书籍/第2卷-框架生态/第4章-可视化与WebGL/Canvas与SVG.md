# 第2卷-框架生态

---

## 第4章 可视化与WebGL

---

### 3.1 Canvas2DAPI

#### 3.1.1 Canvas基础

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

┣━━ 比较
┃   ┣━━ 类别少 → 柱状图
┃   ┣━━ 类别多 → 条形图
┃   ┗━━ 时间序列 → 折线图
┃
┣━━ 分布
┃   ┣━━ 单变量 → 直方图
┃   ┣━━ 双变量 → 散点图
┃   ┗━━ 多变量 → 气泡图
┃
┣━━ 构成
┃   ┣━━ 部分到整体 → 饼图/环形图
┃   ┣━━ 随时间变化 → 堆叠面积图
┃   ┗━━ 占比比较 → 堆叠柱状图
┃
┣━━ 趋势
┃   ┣━━ 单系列 → 折线图
┃   ┣━━ 多系列 → 多线折线图
┃   ┗━━ 增长率 → 面积图
┃
┗━━ 关系
    ┣━━ 两变量 → 散点图
    ┗━━ 网络关系 → 关系图/力导向图
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

