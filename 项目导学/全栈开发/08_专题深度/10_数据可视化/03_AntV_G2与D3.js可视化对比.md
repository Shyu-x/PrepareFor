# AntV G2 与 D3.js 可视化对比

## 前言

在 Web 数据可视化领域，除了 ECharts 之外，还有两个非常流行的可视化库：AntV G2（由蚂蚁金服团队开发）和 D3.js（Data-Driven Documents，由 Mike Bostock 创建）。这三个库各有特色，适用于不同的场景。

本章将从实战角度对比分析 G2 和 D3.js 的特点、优劣势和使用场景，帮助你在实际项目中做出正确的技术选型决策。同时，我也会结合实际项目经验，给出具体的选择建议。

## 一、整体架构对比

### 1.1 设计理念对比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           可视化库设计理念对比                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │        ECharts          │  │        AntV G2          │                   │
│  │     图表封装方案         │  │      图形语法方案        │                   │
│  ├─────────────────────────┤  ├─────────────────────────┤                   │
│  │                         │  │                         │                   │
│  │  高层次抽象              │  │  低层次抽象              │                   │
│  │  预设图表类型            │  │  图形元素组合            │                   │
│  │  配置驱动                │  │  语法驱动                │                   │
│  │  开箱即用                │  │  灵活组合                │                   │
│  │                         │  │                         │                   │
│  │  ┌─────────────────┐    │  │  ┌─────────────────┐    │                   │
│  │  │  折线图 柱状图  │    │  │  │  interval rect  │    │                   │
│  │  │  饼图    散点图 │    │  │  │  line path point│    │                   │
│  │  │  雷达图 仪表盘  │    │  │  │  area  sector   │    │                   │
│  │  └─────────────────┘    │  │  └─────────────────┘    │                   │
│  │                         │  │                         │                   │
│  │  适合快速开发标准图表    │  │  适合自定义复杂可视化    │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                              D3.js                                  │   │
│  │                          数据驱动文档                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   最低层次抽象                                                          │   │
│  │   SVG 操作封装                                                          │   │
│  │   直接操作 DOM                                                          │   │
│  │   完全控制                                                             │   │
│  │                                                                       │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │  select      selectAll      append      remove              │   │   │
│  │   │  attr        style          datum        data                │   │   │
│  │   │  enter        exit          merge       join                │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │   适合：自定义可视化、地理可视化、复杂交互、科学可视化                    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念对比

| 维度 | ECharts | AntV G2 | D3.js |
|------|---------|---------|-------|
| **抽象层次** | 高 | 中 | 低 |
| **核心理念** | 配置驱动的图表库 | 图形语法理论 | 数据驱动文档 |
| **学习曲线** | 平缓 | 中等 | 陡峭 |
| **自定义能力** | 有限 | 强 | 极强 |
| **代码量** | 少 | 中等 | 多 |
| **社区生态** | 庞大（百度维护） | 活跃（蚂蚁维护） | 成熟（社区维护） |
| **文档质量** | 优秀 | 优秀 | 一般 |
| **维护状态** | 活跃 | 非常活跃 | 稳定 |
| **包大小** | ~300KB（完整） | ~200KB（G2） | ~90KB（核心） |
| **首屏渲染** | 快 | 快 | 较慢 |
| **动画支持** | 内置优秀 | 内置优秀 | 需手动实现 |

### 1.3 使用场景定位

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              使用场景定位                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              复杂度                                          │
│                                ▲                                            │
│                                │                                            │
│                   ┌────────────┼────────────┐                               │
│                   │            │            │                               │
│                   │    ┌──────┴──────┐     │                               │
│                   │    │             │     │                               │
│                   │    │     D3      │     │                               │
│                   │    │  (自定义/    │     │                               │
│                   │    │   复杂)      │     │                               │
│                   │    │             │     │                               │
│                   │    └──────┬──────┘     │                               │
│                   │           │            │                               │
│                   │    ┌──────┴──────┐     │                               │
│                   │    │             │     │                               │
│                   │    │     G2      │     │                               │
│                   │    │  (自定义/   │     │                               │
│                   │    │  中等复杂度)│     │                               │
│                   │    │             │     │                               │
│                   │    └──────┬──────┘     │                               │
│                   │           │            │                               │
│                   │    ┌──────┴──────┐     │                               │
│                   │    │             │     │                               │
│                   │    │   ECharts   │     │                               │
│                   │    │  (标准图表/ │     │                               │
│                   │    │   快速开发) │     │                               │
│                   │    │             │     │                               │
│                   │    └─────────────┘     │                               │
│                   │                        │                               │
│  ◄──────────────────────────────────────────────────────────────────────►   │
│                    低 ◄──────────────────────────► 高                      │
│                              灵活度                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 二、AntV G2 深度分析

### 2.1 G2 核心概念

G2 是基于图形语法（Grammar of Graphics）理论的可视化库。它的核心思想是将可视化拆解为独立的、可以自由组合的图形元素。

```typescript
/**
 * G2 核心概念
 *
 * G2 的设计基于 Leland Wilkinson 的图形语法理论
 * 将可视化拆解为以下核心概念：
 *
 * 1. Geometry（几何标记）- 数据的视觉展示形式
 * 2. Attribute（属性）- 数据的视觉通道映射
 * 3. Coordinate（坐标系）- 数据映射到的坐标系
 * 4. Scale（度量）- 数据到视觉通道的映射规则
 * 5. Axis（坐标轴）- 坐标轴和网格线
 * 6. Legend（图例）- 图例说明
 * 7. Tooltip（提示框）- 交互提示
 * 8. Annotation（标注）- 辅助标注
 */

import { Chart } from '@antv/g2';

/**
 * G2 最简单的示例
 * 创建一个柱状图
 */

// 步骤1：创建 Chart 实例
const chart = new Chart({
  container: 'container', // DOM 容器的 ID
  autoFit: true,          // 自动适应容器大小
  height: 400,            // 图表高度
});

// 步骤2：加载数据
// G2 支持多种数据格式
chart.data([
  { year: '2018', sales: 1000 },
  { year: '2019', sales: 1500 },
  { year: '2020', sales: 1800 },
  { year: '2021', sales: 2200 },
  { year: '2022', sales: 2800 },
  { year: '2023', sales: 3200 },
]);

// 步骤3：配置图形语法
// 创建一个 interval（柱状）几何标记
chart.interval().position('year*sales');

// 步骤4：渲染图表
chart.render();
```

### 2.2 G2 图形语法详解

```typescript
/**
 * G2 图形语法详解
 */

/**
 * 1. Geometry（几何标记）
 *
 * 几何标记定义了数据的视觉展示形式
 * G2 支持多种几何标记：
 *
 * - point：点，用于散点图
 * - line：线，用于折线图
 * - area：面积，用于面积图
 * - interval：柱状/条形，用于柱状图
 * - rect：矩形，用于热力图
 * - schema：蜡烛图，用于股票 K 线图
 * - polygon：多边形，用于地图/雷达图
 * - edge：边，用于关系图/流程图
 * - arc：弧线，用于饼图/环图
 * - force：力导向布局
 * - dendrogram：树形布局
 */

import { Chart } from '@antv/g2';

// 创建多种几何标记的示例
const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 300,
});

// 基础柱状图
chart.data([
  { category: '电子产品', sales: 1200 },
  { category: '服装', sales: 900 },
  { category: '食品', sales: 800 },
  { category: '图书', sales: 500 },
]);

// interval 几何标记创建柱状图
chart.interval().position('category*sales');

// 配色
chart.interval().color('category', ['#5470C6', '#91CC75', '#FAC858', '#EE6666']);

// 标签
chart.interval().label('sales', {
  style: {
    fill: '#333',
  },
  formatter: (text: string) => `${text} 万`,
});

chart.render();

/**
 * 2. Attribute（属性/视觉通道）
 *
 * 属性定义了数据值到视觉特征的映射
 * 主要包括：
 *
 * - position：位置，对应 x、y 坐标
 * - color：颜色，包含色相、亮度、饱和度
 * - size：大小，用于点的大小、线的粗细等
 * - shape：形状，用于点的形状、线的形状等
 * - opacity：透明度
 * - style：样式，用于几何标记的 CSS 样式
 */

const attributeChart = new Chart({
  container: 'attributeContainer',
  autoFit: true,
  height: 400,
});

attributeChart.data([
  { date: '1月', sales: 1200, profit: 300, category: 'A' },
  { date: '2月', sales: 1500, profit: 400, category: 'A' },
  { date: '3月', sales: 1800, profit: 500, category: 'B' },
  { date: '4月', sales: 2200, profit: 600, category: 'B' },
  { date: '5月', sales: 2800, profit: 800, category: 'C' },
  { date: '6月', sales: 3200, profit: 900, category: 'C' },
]);

// position 属性：x 和 y 轴的数据映射
attributeChart
  .interval()
  .position('date*sales'); // 映射 date 到 x 轴，sales 到 y 轴

// color 属性：根据 sales 值映射颜色
attributeChart
  .interval()
  .color('sales', '#white-#1890ff'); // 白色到蓝色的渐变

// 或者根据 category 分类映射颜色
attributeChart
  .interval()
  .color('category', ['#5470C6', '#91CC75', '#FAC858']);

// size 属性：设置柱体宽度
attributeChart
  .interval()
  .size(30); // 固定宽度

// 或者根据数据动态计算大小
attributeChart
  .point()
  .size('sales', [5, 20]); // sales 值映射到 5-20 像素的范围

// shape 属性：设置点的形状
attributeChart
  .point()
  .shape('category', ['circle', 'square', 'triangle']); // 不同类别使用不同形状

// style 属性：设置几何标记的样式
attributeChart
  .interval()
  .style({
    fill: '#1890ff',
    stroke: '#fff',
    lineWidth: 2,
    radius: [4, 4, 0, 0], // 柱体顶部圆角
  });

/**
 * 3. Scale（度量）
 *
 * 度用定义了数据值到视觉通道的映射规则
 * G2 会根据数据的类型自动推断合适的度量
 *
 * 类型包括：
 * - linear：连续数值
 * - cat：分类数据
 * - time：时间类型
 * - timeCat：时间分类
 * - log：对数
 * - pow：指数
 * - quantile：分位数
 * - identity：常量
 */

const scaleChart = new Chart({
  container: 'scaleContainer',
  autoFit: true,
  height: 400,
});

scaleChart.data([
  { date: '2024-01', value: 100 },
  { date: '2024-02', value: 300 },
  { date: '2024-03', value: 500 },
  { date: '2024-04', value: 1000 },
  { date: '2024-05', value: 3000 },
  { date: '2024-06', value: 10000 },
]);

// 默认情况下，G2 会自动推断度量类型
// 但我们可以手动配置
scaleChart.scale('value', {
  type: 'log', // 使用对数尺度，适合跨多个数量级的数据
  base: 10,    // 对数底数
  min: 1,      // 最小值
  max: 100000, // 最大值
  // 格式化标签
  formatter: (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return String(value);
  },
});

scaleChart.scale('date', {
  type: 'time', // 时间类型
  mask: 'MM月', // 显示格式
});

scaleChart
  .line()
  .position('date*value')
  .shape('hv'); // 水平垂直线（阶梯图）

/**
 * 4. Coordinate（坐标系）
 *
 * 坐标系定义了数据映射到的坐标系统
 * G2 支持多种坐标系：
 *
 * - cartesian：笛卡尔坐标系（默认）
 * - polar：极坐标系
 * - theta：饼图专用坐标系
 */

const polarChart = new Chart({
  container: 'polarContainer',
  autoFit: true,
  height: 400,
});

polarChart.data([
  { item: '直接访问', value: 335 },
  { item: '邮件营销', value: 310 },
  { item: '联盟广告', value: 234 },
  { item: '视频广告', value: 135 },
  { item: '搜索引擎', value: 548 },
]);

// 使用极坐标系
polarChart.coordinate('polar', {
  radius: 0.8, // 半径比例
  innerRadius: 0.4, // 内半径（创建环形图）
});

// interval 在极坐标系下变成玫瑰图
polarChart
  .interval()
  .position('item*value')
  .color('item')
  .style({
    stroke: '#fff',
    lineWidth: 2,
  });

// 添加标签
polarChart
  .annotation()
  .text({
    position: ['50%', '50%'],
    content: '总访问量',
    style: {
      fontSize: 14,
      fill: '#666',
    },
  });

/**
 * 5. 图形组合
 *
 * G2 的强大之处在于可以组合多个几何标记
 * 创建一个折线+柱状的组合图
 */

const comboChart = new Chart({
  container: 'comboContainer',
  autoFit: true,
  height: 400,
});

comboChart.data([
  { month: '1月', sales: 1200, orders: 800 },
  { month: '2月', sales: 1500, orders: 950 },
  { month: '3月', sales: 1800, orders: 1100 },
  { month: '4月', sales: 2200, orders: 1350 },
  { month: '5月', sales: 2800, orders: 1600 },
  { month: '6月', sales: 3200, orders: 1900 },
]);

// 第一层：柱状图
comboChart
  .interval()
  .position('month*sales')
  .color('sales', '#5470C6-#1890ff')
  .label('sales', {
    position: 'top',
    offsetY: 10,
    style: {
      fill: '#5470C6',
      fontSize: 12,
    },
  });

// 第二层：折线图
comboChart
  .line()
  .position('month*orders')
  .color('#EE6666')
  .size(3)
  .shape('smooth') // 平滑曲线
  .label('orders', {
    position: 'right',
    offsetX: 10,
    style: {
      fill: '#EE6666',
      fontSize: 12,
    },
  });

// 添加数据点
comboChart
  .point()
  .position('month*orders')
  .color('#EE6666')
  .size(5)
  .shape('circle')
  .style({
    stroke: '#fff',
    lineWidth: 2,
  });

comboChart.render();
```

### 2.3 G2 进阶用法

```typescript
/**
 * G2 进阶用法
 */

/**
 * 1. 自定义图形
 *
 * G2 允许我们注册自定义的图形
 */
import { Chart, registerShape } from '@antv/g2';

// 注册一个自定义的菱形
registerShape('point', 'diamond', {
  draw(cfg: any, container: any) {
    const size = cfg.size || 10;
    const p = [
      { x: 0, y: -size / 2 },
      { x: size / 2, y: 0 },
      { x: 0, y: size / 2 },
      { x: -size / 2, y: 0 },
    ];

    const path = [];
    p.forEach((point, index) => {
      if (index === 0) {
        path.push(['M', point.x, point.y]);
      } else {
        path.push(['L', point.x, point.y]);
      }
    });
    path.push(['Z']);

    const shape = container.addShape('path', {
      attrs: {
        path,
        fill: cfg.color || '#1890ff',
        cursor: 'pointer',
      },
      name: 'point',
      // 设置可以捕获点击事件
      capture: true,
    });

    return shape;
  },
});

// 使用自定义图形
const customShapeChart = new Chart({
  container: 'customShapeContainer',
  autoFit: true,
  height: 400,
});

customShapeChart.data([
  { x: 'A', y: 30 },
  { x: 'B', y: 50 },
  { x: 'C', y: 70 },
  { x: 'D', y: 45 },
]);

customShapeChart
  .point()
  .position('x*y')
  .shape('diamond') // 使用自定义的菱形
  .size('y', [20, 60]) // 大小映射
  .color('y', ['#5470C6', '#1890ff', '#69c0ff', '#bae7ff'])
  .label('y', {
    offsetY: -10,
    style: {
      fontSize: 12,
      fill: '#333',
    },
  });

customShapeChart.render();

/**
 * 2. 动画配置
 *
 * G2 提供了丰富的动画配置
 */
const animationChart = new Chart({
  container: 'animationContainer',
  autoFit: true,
  height: 400,
});

animationChart.data([
  { category: 'A', value: 30 },
  { category: 'B', value: 50 },
  { category: 'C', value: 70 },
  { category: 'D', value: 45 },
  { category: 'E', value: 60 },
]);

animationChart
  .interval()
  .position('category*value')
  .color('category')
  .label('value')
  .style({
    radius: [4, 4, 0, 0],
  })
  // 动画配置
  .animate({
    appear: {
      // 入场动画
      animation: 'wave-in', // 内置动画：'fade-in', 'slide-in-left', 'slide-in-right', 'zoom-in', 'zoom-out', 'fan-in', 'fan-out', 'wave-in'
      duration: 800,       // 动画时长
      easing: 'easeQuadOut', // 缓动函数
      delay: (data: any, index: number) => index * 100, // 延迟
    },
    enter: {
      // 数据更新时的入场动画
      animation: 'scale-in-y',
      duration: 400,
    },
    update: {
      // 更新动画
      animation: 'morphing', // 变形动画
      duration: 400,
    },
    leave: {
      // 离场动画
      animation: 'fade-out',
      duration: 300,
    },
  });

animationChart.render();

/**
 * 3. 交互配置
 *
 * G2 支持丰富的交互配置
 */
const interactionChart = new Chart({
  container: 'interactionContainer',
  autoFit: true,
  height: 400,
});

interactionChart.data([
  { year: '2018', sales: 1000 },
  { year: '2019', sales: 1500 },
  { year: '2020', sales: 1800 },
  { year: '2021', sales: 2200 },
  { year: '2022', sales: 2800 },
  { year: '2023', sales: 3200 },
]);

interactionChart
  .interval()
  .position('year*sales')
  .color('year')
  .label('sales')
  .style({
    cursor: 'pointer',
  });

// 配置交互
interactionChart.interaction('interval-highlight', {
  // 高亮样式
  highlightStyle: {
    fill: '#FF6A00',
    stroke: '#FF6A00',
  },
  // 取消高亮的交互
  unhighlight: true,
});

// 配置 tooltip
interactionChart.tooltip({
  showTitle: true,
  title: '年度销售数据',
  showMarkers: true, // 显示数据点标记
  shared: true,       // 合并多个 series 的 tooltip
  // 自定义 tooltip 内容
  itemTpl: '<li>{name}: {value}</li>',
  // tooltip 背景样式
  domStyles: {
    'g2-tooltip': {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#fff',
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
});

interactionChart.render();

/**
 * 4. 组件自定义
 *
 * G2 允许自定义坐标轴、图例等组件
 */
const componentChart = new Chart({
  container: 'componentContainer',
  autoFit: true,
  height: 400,
});

componentChart.data([
  { date: '2024-01', value: 1200 },
  { date: '2024-02', value: 1500 },
  { date: '2024-03', value: 1800 },
  { date: '2024-04', value: 2200 },
  { date: '2024-05', value: 2800 },
  { date: '2024-06', value: 3200 },
]);

componentChart
  .line()
  .position('date*value')
  .shape('smooth')
  .color('#1890ff')
  .point({
    size: 6,
    shape: 'circle',
    style: {
      stroke: '#fff',
      lineWidth: 2,
    },
  });

// 自定义坐标轴
componentChart.axis('date', {
  label: {
    rotate: 0,
    autoRotate: true,
    style: {
      fill: '#666',
      fontSize: 12,
    },
    formatter: (text: string) => text,
  },
  line: {
    style: {
      stroke: '#E0E0E0',
      lineWidth: 1,
    },
  },
  tickLine: {
    style: {
      stroke: '#E0E0E0',
      lineWidth: 1,
    },
    alignTick: true,
  },
  title: {
    text: '月份',
    style: {
      fill: '#333',
      fontSize: 14,
    },
  },
});

componentChart.axis('value', {
  label: {
    formatter: (text: string) => `${(Number(text) / 1000).toFixed(0)}k`,
    style: {
      fill: '#666',
      fontSize: 12,
    },
  },
  grid: {
    line: {
      style: {
        stroke: '#E8E8E8',
        lineDash: [4, 4],
      },
    },
  },
  title: {
    text: '销售额（万元）',
    style: {
      fill: '#333',
      fontSize: 14,
    },
  },
});

// 自定义图例
componentChart.legend('value', {
  position: 'top',
  itemName: {
    style: {
      fill: '#333',
      fontSize: 12,
    },
  },
  itemValue: {
    style: {
      fill: '#666',
      fontSize: 12,
    },
  },
  custom: true, // 自定义图例
  items: [
    { value: '销售额', name: '销售额', marker: { symbol: 'circle', style: { fill: '#1890ff' } } },
  ],
});

componentChart.render();
```

## 三、D3.js 深度分析

### 3.1 D3 核心概念

D3（Data-Driven Documents）是最低层次的可视化库，它本质上是 SVG 操作的一套工具集。

```typescript
/**
 * D3.js 核心概念
 *
 * D3 的核心思想是通过数据来驱动文档（SVG）的变化
 * 它提供了一套链式 API 来操作 DOM
 *
 * 核心模块：
 * 1. Selections - 选择集，操作 DOM 元素
 * 2. Data Joins - 数据绑定，将数据绑定到 DOM
 * 3. Scales - 度量，将数据映射到视觉通道
 * 4. Axes - 坐标轴
 * 5. Shapes - 图形辅助函数
 * 6. Transitions - 动画过渡
 */

import * as d3 from 'd3';

/**
 * D3 最基础的示例：绑定数据到 div
 */

// 选择 body
const body = d3.select('body');

// 绑定数据并创建 div
body
  .selectAll('div')           // 选择所有 div（初始为空）
  .data([10, 20, 30, 40, 50]) // 绑定数据
  .join('div')                // 创建/删除元素以匹配数据（enter/update/exit）
  .text((d) => d)            // 设置文本内容
  .style('width', (d) => `${d * 2}px`) // 设置样式
  .style('background', '#5470C6')
  .style('margin', '5px')
  .style('color', 'white')
  .style('text-align', 'center')
  .style('line-height', '30px');

/**
 * D3 选择集（Selections）
 *
 * D3 提供了两种选择器：
 * - d3.select() - 选择第一个匹配的元素
 * - d3.selectAll() - 选择所有匹配的元素
 */

// 选择 DOM
const svg = d3.select('#chart');
const container = d3.select('.container');

// 选择集方法（链式调用）
svg
  .selectAll('circle')      // 选择所有 circle 元素
  .attr('cx', 100)          // 设置属性
  .style('fill', 'red')     // 设置样式
  .classed('highlight', true) // 添加类名
  .on('click', (event) => {  // 绑定事件
    console.log('clicked');
  });

/**
 * D3 数据绑定（Data Joins）
 *
 * 数据绑定是 D3 的核心概念
 * 使用 join 方法处理 enter、update、exit 三种情况
 */

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 20 },
  { name: 'C', value: 30 },
];

// 绘制柱状图
const chart = d3.select('#barChart');

chart
  .selectAll('rect')          // 选择所有 rect 元素
  .data(data)                 // 绑定数据
  .join(
    // enter 选择：数据多，元素少，需要创建新元素
    (enter) => enter
      .append('rect')
      .attr('x', (_, i) => i * 35) // 使用索引计算 x 位置
      .attr('y', (d) => 200 - d.value * 5)
      .attr('width', 30)
      .attr('height', (d) => d.value * 5)
      .attr('fill', '#5470C6'),
    // update 选择：数据与元素数量匹配，更新现有元素
    (update) => update
      .attr('y', (d) => 200 - d.value * 5)
      .attr('height', (d) => d.value * 5),
    // exit 选择：元素多，数据少，删除多余元素
    (exit) => exit.remove()
  )
  .on('mouseover', function(event, d) {
    // 使用 this 获取当前元素
    d3.select(this).attr('fill', '#1890ff');
  })
  .on('mouseout', function(event, d) {
    d3.select(this).attr('fill', '#5470C6');
  });

/**
 * D3 度量（Scales）
 *
 * 度量将数据域映射到视觉范围
 */
const linearScale = d3.scaleLinear()
  .domain([0, 100])     // 数据域
  .range([0, 400]);     // 视觉范围

console.log(linearScale(0));   // 0
console.log(linearScale(50));  // 200
console.log(linearScale(100)); // 400

// 颜色比例尺
const colorScale = d3.scaleOrdinal()
  .domain(['A', 'B', 'C'])
  .range(['#5470C6', '#91CC75', '#FAC858']);

console.log(colorScale('A')); // #5470C6
console.log(colorScale('B')); // #91CC75

// 时间比例尺
const timeScale = d3.scaleTime()
  .domain([new Date(2024, 0, 1), new Date(2024, 11, 31)])
  .range([0, 500]);

// 对数比例尺
const logScale = d3.scaleLog()
  .domain([1, 100000])
  .range([0, 400]);

// 带分色的比例尺
const thresholdScale = d3.scaleThreshold()
  .domain([60, 80]) // 分界点
  .range(['red', 'yellow', 'green']); // 对应的颜色
```

### 3.2 D3 完整图表示例

```typescript
/**
 * D3 完整图表示例
 */

/**
 * 示例 1：带坐标轴的柱状图
 */

// 数据
const barData = [
  { category: '电子产品', sales: 1200 },
  { category: '服装', sales: 900 },
  { category: '食品', sales: 800 },
  { category: '图书', sales: 500 },
  { category: '家居', sales: 650 },
];

// SVG 尺寸
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 创建 SVG
const barSvg = d3
  .select('#barChartContainer')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// X 轴比例尺（带分组）
const xScale = d3
  .scaleBand()
  .domain(barData.map((d) => d.category))
  .range([0, width])
  .padding(0.2);

// Y 轴比例尺
const yScale = d3
  .scaleLinear()
  .domain([0, d3.max(barData, (d) => d.sales) * 1.1])
  .range([height, 0]);

// 添加 X 轴
barSvg
  .append('g')
  .attr('transform', `translate(0,${height})`)
  .call(d3.axisBottom(xScale))
  .selectAll('text')
  .attr('fill', '#666')
  .style('font-size', '12px');

// 添加 Y 轴
barSvg
  .append('g')
  .call(d3.axisLeft(yScale).tickFormat((d) => `${d}`))
  .selectAll('text')
  .attr('fill', '#666')
  .style('font-size', '12px');

// 添加 Y 轴标签
barSvg
  .append('text')
  .attr('transform', 'rotate(-90)')
  .attr('y', -margin.left + 15)
  .attr('x', -height / 2)
  .attr('text-anchor', 'middle')
  .attr('fill', '#333')
  .style('font-size', '14px')
  .text('销售额（万元）');

// 添加柱状图
barSvg
  .selectAll('rect')
  .data(barData)
  .join('rect')
  .attr('x', (d) => xScale(d.category)!)
  .attr('y', (d) => yScale(d.sales))
  .attr('width', xScale.bandwidth())
  .attr('height', (d) => height - yScale(d.sales))
  .attr('fill', '#5470C6')
  .attr('rx', 4) // 圆角
  .on('mouseover', function () {
    d3.select(this).attr('fill', '#1890ff');
  })
  .on('mouseout', function () {
    d3.select(this).attr('fill', '#5470C6');
  });

// 添加数值标签
barSvg
  .selectAll('.value-label')
  .data(barData)
  .join('text')
  .attr('class', 'value-label')
  .attr('x', (d) => xScale(d.category)! + xScale.bandwidth() / 2)
  .attr('y', (d) => yScale(d.sales) - 5)
  .attr('text-anchor', 'middle')
  .attr('fill', '#333')
  .style('font-size', '12px')
  .text((d) => d.sales);

/**
 * 示例 2：折线图
 */

const lineData = [
  { date: new Date(2024, 0, 1), value: 120 },
  { date: new Date(2024, 1, 1), value: 150 },
  { date: new Date(2024, 2, 1), value: 180 },
  { date: new Date(2024, 3, 1), value: 220 },
  { date: new Date(2024, 4, 1), value: 280 },
  { date: new Date(2024, 5, 1), value: 320 },
  { date: new Date(2024, 6, 1), value: 350 },
  { date: new Date(2024, 7, 1), value: 380 },
  { date: new Date(2024, 8, 1), value: 420 },
  { date: new Date(2024, 9, 1), value: 480 },
  { date: new Date(2024, 10, 1), value: 520 },
  { date: new Date(2024, 11, 1), value: 580 },
];

const lineMargin = { top: 40, right: 30, bottom: 50, left: 60 };
const lineWidth = 700 - lineMargin.left - lineMargin.right;
const lineHeight = 400 - lineMargin.top - lineMargin.bottom;

const lineSvg = d3
  .select('#lineChartContainer')
  .append('svg')
  .attr('width', lineWidth + lineMargin.left + lineMargin.right)
  .attr('height', lineHeight + lineMargin.top + lineMargin.bottom)
  .append('g')
  .attr('transform', `translate(${lineMargin.left},${lineMargin.top})`);

// X 轴比例尺（时间）
const xTimeScale = d3
  .scaleTime()
  .domain(d3.extent(lineData, (d) => d.date) as [Date, Date])
  .range([0, lineWidth]);

// Y 轴比例尺
const yLineScale = d3
  .scaleLinear()
  .domain([0, d3.max(lineData, (d) => d.value) * 1.1])
  .range([lineHeight, 0]);

// 添加 X 轴
lineSvg
  .append('g')
  .attr('transform', `translate(0,${lineHeight})`)
  .call(d3.axisBottom(xTimeScale).tickFormat(d3.timeFormat('%m月') as any))
  .selectAll('text')
  .attr('fill', '#666');

// 添加 Y 轴
lineSvg
  .append('g')
  .call(d3.axisLeft(yLineScale))
  .selectAll('text')
  .attr('fill', '#666');

// 添加网格线
lineSvg
  .append('g')
  .attr('class', 'grid')
  .call(
    d3
      .axisLeft(yLineScale)
      .tickSize(-lineWidth)
      .tickFormat(() => '')
  )
  .selectAll('line')
  .attr('stroke', '#E8E8E8')
  .attr('stroke-dasharray', '2,2');

lineSvg.selectAll('.grid .domain').remove();

// 折线生成器
const lineGenerator = d3
  .line<{ date: Date; value: number }>()
  .x((d) => xTimeScale(d.date))
  .y((d) => yLineScale(d.value))
  .curve(d3.curveMonotoneX); // 平滑曲线

// 添加路径
lineSvg
  .append('path')
  .datum(lineData)
  .attr('fill', 'none')
  .attr('stroke', '#5470C6')
  .attr('stroke-width', 3)
  .attr('d', lineGenerator);

// 添加数据点
lineSvg
  .selectAll('.data-point')
  .data(lineData)
  .join('circle')
  .attr('class', 'data-point')
  .attr('cx', (d) => xTimeScale(d.date))
  .attr('cy', (d) => yLineScale(d.value))
  .attr('r', 5)
  .attr('fill', '#5470C6')
  .attr('stroke', '#fff')
  .attr('stroke-width', 2)
  .style('cursor', 'pointer')
  .on('mouseover', function () {
    d3.select(this).attr('r', 8).attr('fill', '#1890ff');
  })
  .on('mouseout', function () {
    d3.select(this).attr('r', 5).attr('fill', '#5470C6');
  });

// 添加面积填充
const areaGenerator = d3
  .area<{ date: Date; value: number }>()
  .x((d) => xTimeScale(d.date))
  .y0(lineHeight)
  .y1((d) => yLineScale(d.value))
  .curve(d3.curveMonotoneX);

lineSvg
  .append('path')
  .datum(lineData)
  .attr('fill', 'rgba(84, 112, 198, 0.2)')
  .attr('d', areaGenerator);
```

### 3.3 D3 高级用法

```typescript
/**
 * D3 高级用法
 */

/**
 * 1. 力导向图
 */
const forceData = {
  nodes: [
    { id: 'A', group: 1 },
    { id: 'B', group: 1 },
    { id: 'C', group: 2 },
    { id: 'D', group: 2 },
    { id: 'E', group: 3 },
    { id: 'F', group: 3 },
  ],
  links: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'D' },
    { source: 'D', target: 'E' },
    { source: 'E', target: 'F' },
    { source: 'F', target: 'A' },
    { source: 'A', target: 'D' },
  ],
};

const forceMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const forceWidth = 600 - forceMargin.left - forceMargin.right;
const forceHeight = 500 - forceMargin.top - forceMargin.bottom;

// 创建 SVG
const forceSvg = d3
  .select('#forceChartContainer')
  .append('svg')
  .attr('width', forceWidth + forceMargin.left + forceMargin.right)
  .attr('height', forceHeight + forceMargin.top + forceMargin.bottom)
  .append('g')
  .attr('transform', `translate(${forceMargin.left},${forceMargin.top})`);

// 创建力模拟
const simulation = d3
  .forceSimulation(forceData.nodes as d3.SimulationNodeDatum[])
  .force(
    'link',
    d3
      .forceLink(forceData.links)
      .id((d: any) => d.id)
      .distance(100)
  )
  .force('charge', d3.forceManyBody().strength(-300)) // 节点间斥力
  .force('center', d3.forceCenter(forceWidth / 2, forceHeight / 2)) // 中心力
  .force('collision', d3.forceCollide().radius(30)); // 碰撞检测

// 绘制连线
const link = forceSvg
  .append('g')
  .selectAll('line')
  .data(forceData.links)
  .join('line')
  .attr('stroke', '#999')
  .attr('stroke-width', 2)
  .attr('stroke-opacity', 0.6);

// 绘制节点
const node = forceSvg
  .append('g')
  .selectAll('circle')
  .data(forceData.nodes)
  .join('circle')
  .attr('r', 20)
  .attr('fill', (d) => {
    const colors = ['#5470C6', '#91CC75', '#FAC858'];
    return colors[d.group - 1];
  })
  .attr('stroke', '#fff')
  .attr('stroke-width', 2)
  .style('cursor', 'pointer')
  .call(
    d3
      .drag<SVGCircleElement, any>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  );

// 添加标签
const label = forceSvg
  .append('g')
  .selectAll('text')
  .data(forceData.nodes)
  .join('text')
  .text((d) => d.id)
  .attr('font-size', 12)
  .attr('text-anchor', 'middle')
  .attr('dy', 4)
  .attr('pointer-events', 'none');

// 更新位置（模拟运行时）
simulation.on('tick', () => {
  link
    .attr('x1', (d: any) => d.source.x)
    .attr('y1', (d: any) => d.source.y)
    .attr('x2', (d: any) => d.target.x)
    .attr('y2', (d: any) => d.target.y);

  node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

  label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
});

// 拖拽函数
function dragstarted(event: any) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(event: any) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(event: any) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

/**
 * 2. 地图可视化
 */

// 假设已经加载了 GeoJSON 数据
// const geoData = await fetch('china.json').then(r => r.json());

const mapMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const mapWidth = 800 - mapMargin.left - mapMargin.right;
const mapHeight = 600 - mapMargin.top - mapMargin.bottom;

// 创建投影
const projection = d3
  .geoMercator()
  .center([105, 36]) // 中国中心
  .scale(600)
  .translate([mapWidth / 2, mapHeight / 2]);

// 创建路径生成器
const pathGenerator = d3.geoPath().projection(projection);

// 创建 SVG
const mapSvg = d3
  .select('#mapChartContainer')
  .append('svg')
  .attr('width', mapWidth + mapMargin.left + mapMargin.right)
  .attr('height', mapHeight + mapMargin.top + mapMargin.bottom)
  .append('g')
  .attr('transform', `translate(${mapMargin.left},${mapMargin.top})`);

// 绘制省份
// geoData 需要是 GeoJSON FeatureCollection
// mapSvg
//   .selectAll('path')
//   .data(geoData.features)
//   .join('path')
//   .attr('d', pathGenerator as any)
//   .attr('fill', '#E8F4F8')
//   .attr('stroke', '#fff')
//   .attr('stroke-width', 0.5)
//   .on('mouseover', function() {
//     d3.select(this).attr('fill', '#B8D4E8');
//   })
//   .on('mouseout', function() {
//     d3.select(this).attr('fill', '#E8F4F8');
//   });

// 添加散点（城市）
const cities = [
  { name: '北京', coords: [116.46, 39.92], value: 1800 },
  { name: '上海', coords: [121.48, 31.22], value: 1650 },
  { name: '广州', coords: [113.23, 23.16], value: 1500 },
];

mapSvg
  .selectAll('circle')
  .data(cities)
  .join('circle')
  .attr('cx', (d) => projection(d.coords)![0])
  .attr('cy', (d) => projection(d.coords)![1])
  .attr('r', (d) => Math.sqrt(d.value) / 5)
  .attr('fill', '#EE6666')
  .attr('stroke', '#fff')
  .attr('stroke-width', 2)
  .style('cursor', 'pointer')
  .on('mouseover', function () {
    d3.select(this).attr('fill', '#FF6A00');
  })
  .on('mouseout', function () {
    d3.select(this).attr('fill', '#EE6666');
  });

/**
 * 3. 自定义过渡动画
 */

const transitionSvg = d3.select('#transitionContainer').append('svg').attr('width', 600).attr('height', 400);

// 创建初始圆形
const circle = transitionSvg
  .append('circle')
  .attr('cx', 100)
  .attr('cy', 200)
  .attr('r', 30)
  .attr('fill', '#5470C6');

// 创建按钮来触发动画
d3.select('#animateButton').on('click', function () {
  // 链式过渡动画
  circle
    .transition() // 开始过渡
    .duration(1000) // 持续时间
    .ease(d3.easeCubicInOut) // 缓动函数
    .attr('cx', 500) // 移动到 x=500
    .attr('r', 60) // 半径变大
    .transition() // 继续下一个过渡
    .duration(1000)
    .attr('fill', '#EE6666') // 颜色变化
    .transition()
    .duration(1000)
    .attr('cy', 100) // 移动到 y=100
    .on('end', function () {
      // 动画结束后执行
      console.log('Animation completed');
    });
});
```

## 四、G2 与 D3 对比分析

### 4.1 代码复杂度对比

```typescript
/**
 * 相同图表的实现复杂度对比
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 任务：创建一个简单的柱状图
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 使用 ECharts 实现
 * 代码量：约 30 行
 * 复杂度：低
 */
const echartsBar = () => {
  const chart = echarts.init(document.getElementById('echartsBar'));

  const option = {
    xAxis: {
      type: 'category',
      data: ['A', 'B', 'C', 'D', 'E'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        type: 'bar',
        data: [30, 50, 70, 45, 60],
      },
    ],
  };

  chart.setOption(option);
};

/**
 * 使用 G2 实现
 * 代码量：约 25 行
 * 复杂度：低
 */
const g2Bar = () => {
  const chart = new Chart({
    container: 'g2Bar',
    autoFit: true,
    height: 400,
  });

  chart.data([
    { category: 'A', value: 30 },
    { category: 'B', value: 50 },
    { category: 'C', value: 70 },
    { category: 'D', value: 45 },
    { category: 'E', value: 60 },
  ]);

  chart.interval().position('category*value');

  chart.render();
};

/**
 * 使用 D3 实现
 * 代码量：约 80 行
 * 复杂度：中等
 */
const d3Bar = () => {
  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: 50 },
    { category: 'C', value: 70 },
    { category: 'D', value: 45 },
    { category: 'E', value: 60 },
  ];

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select('#d3Bar')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // X 轴比例尺
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.category))
    .range([0, width])
    .padding(0.2);

  // Y 轴比例尺
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) * 1.1])
    .range([height, 0]);

  // 添加 X 轴
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  // 添加 Y 轴
  svg.append('g').call(d3.axisLeft(yScale));

  // 添加柱状图
  svg
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d) => xScale(d.category)!)
    .attr('y', (d) => yScale(d.value))
    .attr('width', xScale.bandwidth())
    .attr('height', (d) => height - yScale(d.value))
    .attr('fill', '#5470C6');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 任务：创建一个自定义形状的图表
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 使用 ECharts 实现自定义图表
 * 需要创建自定义 symbol，或者完全自己绘制
 * 局限性较大
 */

/**
 * 使用 G2 实现自定义图表
 * 可以注册自定义 shape，灵活性较好
 * 代码量：中等
 */
const g2Custom = () => {
  // 注册自定义菱形
  registerShape('point', 'diamond', {
    draw(cfg, container) {
      const size = cfg.size || 10;
      const p = [
        { x: 0, y: -size / 2 },
        { x: size / 2, y: 0 },
        { x: 0, y: size / 2 },
        { x: -size / 2, y: 0 },
      ];

      const path = [];
      p.forEach((point, index) => {
        if (index === 0) {
          path.push(['M', point.x, point.y]);
        } else {
          path.push(['L', point.x, point.y]);
        }
      });
      path.push(['Z']);

      return container.addShape('path', {
        attrs: {
          path,
          fill: cfg.color,
        },
      });
    },
  });

  // 使用自定义形状
  const chart = new Chart({
    container: 'g2Custom',
    autoFit: true,
    height: 400,
  });

  chart.data([
    { x: 'A', y: 30, type: 'diamond' },
    { x: 'B', y: 50, type: 'diamond' },
    { x: 'C', y: 70, type: 'diamond' },
  ]);

  chart.point().position('x*y').shape('diamond').size('y', [20, 60]);

  chart.render();
};

/**
 * 使用 D3 实现自定义图表
 * 灵活性最高，可以完全控制 SVG 的每一个细节
 * 代码量：较多
 */
const d3Custom = () => {
  // D3 可以使用任何 SVG 元素和路径
  // 完全自定义实现
  const svg = d3.select('#d3Custom').append('svg').attr('width', 600).attr('height', 400);

  // 绘制菱形
  svg
    .append('path')
    .attr('d', 'M 300 100 L 350 200 L 300 300 L 250 200 Z')
    .attr('fill', '#5470C6')
    .attr('stroke', '#fff');
};
```

### 4.2 学习曲线对比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              学习曲线对比                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  学习难度                                                                    │
│     ▲                                                                      │
│     │                                                                    ╱  │
│     │                                                                  ╱    │
│     │                                                               ╱ D3     │
│     │                                                            ╱         │
│     │                                                        ╱             │
│     │                                                     ╱ G2              │
│     │                                                  ╱                    │
│     │                                             ╱                         │
│     │                                        ╱ ECharts                      │
│     │                                   ╱                                    │
│     │                              ╱                                          │
│     │                         ╱                                                 │
│     │                    ╱                                                      │
│     │               ╱                                                           │
│     │          ╱                                                                │
│     │     ╱                                                                     │
│     │                                                                        │
│     └──────────────────────────────────────────────────────────────────────►   │
│                          学习内容复杂度                                         │
│                                                                             │
│     ECharts：配置几个选项就能出图                                             │
│     G2    ：需要理解图形语法概念后才能有效使用                                  │
│     D3    ：需要深入理解 SVG、DOM、数据绑定机制                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           学习曲线各阶段对比                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【ECharts】                                                                │
│   第1天：能画出基本图表                                                       │
│   第3天：能画大部分常用图表                                                   │
│   第7天：熟练掌握所有配置项                                                   │
│   第14天：能够自定义主题和组件                                                │
│                                                                             │
│  【G2】                                                                     │
│   第1天：理解图形语法理念，画出基本图表                                        │
│   第3天：理解 Scale、Coordinate、Geometry                                    │
│   第7天：能够组合多种几何标记                                                 │
│   第14天：能够注册自定义 Shape，处理复杂交互                                   │
│   第30天：能够实现任何自定义可视化                                             │
│                                                                             │
│  【D3】                                                                     │
│   第1天：理解选择集和数据绑定                                                 │
│   第3天：理解 Scales 和 Axes                                                │
│   第7天：能画基本图表，理解 enter/update/exit                                │
│   第14天：理解过渡动画和交互                                                  │
│   第30天：能够实现标准图表                                                    │
│   第60天：能够实现自定义可视化                                                │
│   第90天：深入理解 SVG 特性，能够实现任何可视化                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 适用场景对比

| 场景 | ECharts | G2 | D3.js |
|------|---------|-----|-------|
| **快速开发标准仪表盘** | ✅ 最佳 | ⚠️ 可用 | ❌ 不推荐 |
| **企业级数据看板** | ✅ 最佳 | ⚠️ 可用 | ❌ 不推荐 |
| **简单数据展示** | ✅ 最佳 | ⚠️ 可用 | ❌ 不推荐 |
| **自定义可视化图表** | ⚠️ 受限 | ✅ 最佳 | ✅ 最佳 |
| **复杂交互图表** | ⚠️ 受限 | ✅ 最佳 | ✅ 最佳 |
| **地理可视化** | ✅ 支持地图 | ⚠️ 需要插件 | ✅ 最佳 |
| **关系网络图** | ⚠️ 支持力导图 | ⚠️ 支持有限 | ✅ 最佳 |
| **科学可视化** | ❌ 不适合 | ⚠️ 可用 | ✅ 最佳 |
| **金融 K 线图** | ✅ 支持 | ⚠️ 需要自定义 | ✅ 最佳 |
| **动画效果丰富的图表** | ✅ 内置丰富 | ✅ 内置丰富 | ⚠️ 需要手动实现 |
| **移动端图表** | ✅ 响应式好 | ⚠️ 可用 | ⚠️ 需要适配 |

## 五、技术选型建议

### 5.1 选择 ECharts 的场景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          选择 ECharts 的场景                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 时间紧迫，需要快速上线                                                   │
│     - ECharts 的配置式 API 可以让你在最短时间内完成图表                       │
│     - 丰富的示例和文档减少学习成本                                           │
│                                                                             │
│  2. 需要展示标准类型的图表                                                   │
│     - 折线图、柱状图、饼图、散点图、雷达图等                                  │
│     - 这些图表 ECharts 都有很好的支持                                        │
│                                                                             │
│  3. 数据仪表盘/数据大屏                                                      │
│     - ECharts 对大屏场景有很好的优化                                          │
│     - 支持主题定制、响应式                                                   │
│                                                                             │
│  4. 项目预算有限，无法投入太多人力                                           │
│     - ECharts 学习曲线平缓                                                   │
│     - 团队成员可以快速上手                                                   │
│                                                                             │
│  5. 需要良好的兼容性和稳定性                                                 │
│     - ECharts 有百度维护，更新稳定                                           │
│     - 社区庞大，问题容易找到解决方案                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**不选择 ECharts 的场景：**

- 需要高度自定义的图表外观
- 需要实现 ECharts 没有内置的图表类型
- 需要精细控制 SVG 元素

### 5.2 选择 G2 的场景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            选择 G2 的场景                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 需要一定程度的自定义但不想从零开始                                        │
│     - G2 的图形语法提供了很好的抽象                                          │
│     - 不需要处理底层的 SVG 细节                                              │
│                                                                             │
│  2. 需要创建独特的可视化效果                                                  │
│     - G2 支持注册自定义 Shape                                               │
│     - 可以组合多种几何标记实现复杂效果                                       │
│                                                                             │
│  3. 数据分析平台/BI 工具                                                    │
│     - 需要支持多种图表类型的动态切换                                        │
│     - G2 的架构更适合构建图表配置平台                                        │
│                                                                             │
│  4. 中等复杂度的可视化需求                                                   │
│     - 不像标准图表那么简单，也不像 D3 那样底层                                │
│     - G2 处于一个很好的中间位置                                              │
│                                                                             │
│  5. 蚂蚁生态内的项目                                                         │
│     - G2 与 Ant Design、egg 等蚂蚁系产品集成良好                             │
│     - 技术栈一致性更好                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**不选择 G2 的场景：**

- 需要极致自定义效果（D3 更适合）
- 项目只需要标准图表（ECharts 更简单）
- 团队对图形语法概念不熟悉

### 5.3 选择 D3.js 的场景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          选择 D3.js 的场景                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 高度自定义的可视化需求                                                   │
│     - D3 提供了最底层的 SVG 操作能力                                         │
│     - 可以实现任何你能想到的视觉效果                                         │
│                                                                             │
│  2. 独特的数据展示形式                                                       │
│     - 非标准图表类型                                                         │
│     - D3 是唯一的选择                                                        │
│                                                                             │
│  3. 地理信息系统 (GIS)                                                      │
│     - D3 对 GeoJSON/TopoJSON 支持非常好                                    │
│     - 可以创建复杂的地图可视化                                               │
│                                                                             │
│  4. 关系网络/图可视化                                                        │
│     - 力导向图、 Sankey 图等                                                │
│     - D3 提供了丰富的布局算法                                               │
│                                                                             │
│  5. 科学可视化                                                               │
│     - 需要精确控制每一个像素                                                 │
│     - D3 可以对接 WebGL 等底层 API                                           │
│                                                                             │
│  6. 学习和研究目的                                                           │
│     - D3 是学习数据可视化的最佳资源                                          │
│     - 深入理解可视化原理                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**不选择 D3.js 的场景：**

- 项目时间紧迫
- 只需要标准图表
- 团队成员 D3 经验不足

### 5.4 实际项目选型流程

```typescript
/**
 * 实际项目中的选型决策流程
 */

/**
 * 决策流程图
 *
 * 开始
 *   │
 *   ▼
 * ┌───────────────────────────────────────┐
 * │ 问题1：项目截止日期是什么时候？          │
 * └───────────────────────────────────────┘
 *   │
 *   ├── 紧迫 ───────────────────────────────► 选择 ECharts
 *   │
 *   ▼
 * ┌───────────────────────────────────────┐
 * │ 问题2：图表类型是否是 ECharts 内置支持的？│
 * └───────────────────────────────────────┘
 *   │
 *   ├── 是 ────────────────────────────────► 选择 ECharts
 *   │
 *   ▼
 * ┌───────────────────────────────────────┐
 * │ 问题3：需要多高的自定义程度？            │
 * └───────────────────────────────────────┘
 *   │
 *   ├── 标准定制（主题、颜色）─────────────► 选择 ECharts
 *   │
 *   ├── 中等定制（自定义形状、组合图表）────► 选择 G2
 *   │
 *   └── 高度定制（完全自定义）─────────────► 选择 D3.js
 *       │
 *       ▼
 * ┌───────────────────────────────────────┐
 * │ 问题4：团队对 D3 的熟悉程度？          │
 * └───────────────────────────────────────┘
 *   │
 *   ├── 熟悉 ─────────────────────────────► 选择 D3.js
 *   │
 *   └── 不熟悉 ───────────────────────────► 评估学习成本
 *       │
 *       ├── 可接受 ───────────────────────► 选择 D3.js
 *       │
 *       └── 不可接受 ────────────────────► 选择 G2
 *
 */

/**
 * 选型检查清单
 */

// 检查1：时间因素
const canFinishInTime = true; // 项目截止日期是否允许

// 检查2：图表类型
const isStandardChart = true; // 是否是标准图表类型
const standardChartTypes = [
  '折线图',
  '柱状图',
  '饼图',
  '散点图',
  '雷达图',
  '仪表盘',
  'K线图',
  '热力图',
  '地图',
  '组合图',
  '漏斗图',
  '桑基图',
];

// 检查3：自定义需求
const needCustomShape = false;      // 是否需要自定义图形
const needCustomLayout = false;      // 是否需要自定义布局
const needCustomInteraction = false; // 是否需要自定义交互

// 检查4：性能要求
const isLargeDataset = false;  // 数据量是否很大（>10000）
const needRealTimeUpdate = false; // 是否需要实时更新

// 检查5：团队因素
const teamExperience = {
  echarts: 3, // 1-5 分
  g2: 1,
  d3: 1,
};

// 决策函数
function makeSelection(): string {
  // 时间紧迫，选择 ECharts
  if (!canFinishInTime && isStandardChart) {
    return 'ECharts';
  }

  // 标准图表
  if (isStandardChart && !needCustomShape && !needCustomLayout) {
    return 'ECharts';
  }

  // 中等定制需求
  if (needCustomShape && !needCustomLayout && teamExperience.g2 >= teamExperience.d3) {
    return 'G2';
  }

  // 高度定制 + 团队有经验
  if (needCustomLayout && teamExperience.d3 >= 3) {
    return 'D3.js';
  }

  // 高度定制 + 团队无经验但愿意学习
  if (needCustomLayout && teamExperience.d3 < 3 && teamExperience.g2 >= 2) {
    return 'G2';
  }

  // 默认选择
  return 'ECharts';
}
```

### 5.5 混合使用策略

```typescript
/**
 * 在实际项目中，可以根据需求混合使用多个库
 */

/**
 * 场景：企业级数据平台
 *
 * - 数据看板/仪表盘：使用 ECharts（快速开发）
 * - 自定义分析图表：使用 G2（灵活性）
 * - 特殊可视化（如地理信息图）：使用 D3.js（完全控制）
 */

// 示例架构

interface ChartFactory {
  /**
   * 根据图表类型获取合适的库
   */
  static getChartLibrary(chartType: string): 'echarts' | 'g2' | 'd3' {
    const standardCharts = ['line', 'bar', 'pie', 'scatter', 'radar', 'gauge', 'funnel'];
    const customCharts = ['custom-shape', 'geo-map', 'network'];

    if (standardCharts.includes(chartType)) {
      return 'echarts';
    }

    if (customCharts.includes(chartType)) {
      return 'g2';
    }

    // 对于完全自定义的需求，使用 D3
    return 'd3';
  }
}

/**
 * 根据不同库的特点分配任务
 */

// ECharts 负责的部分
const echartsResponsibilities = [
  'KPI 卡片',
  '基础折线图/柱状图',
  '饼图/环形图',
  '简单数据看板',
  'Dashboard 首屏',
];

// G2 负责的部分
const g2Responsibilities = [
  '自定义组合图表',
  '业务定制图表',
  '数据探索组件',
  '图表配置器',
];

// D3 负责的部分
const d3Responsibilities = [
  '地理信息可视化',
  '复杂关系网络',
  '自定义动画效果',
  '科学数据展示',
];
```

## 六、总结与建议

### 6.1 对比总结

| 维度 | ECharts | G2 | D3.js |
|------|---------|-----|-------|
| **定位** | 图表封装方案 | 图形语法方案 | SVG 操作工具 |
| **核心理念** | 配置即图表 | 组合创造图表 | 数据驱动文档 |
| **上手难度** | ⭐ 简单 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 困难 |
| **开发效率** | ⭐⭐⭐⭐⭐ 极高 | ⭐⭐⭐ 中等 | ⭐⭐ 较低 |
| **灵活性** | ⭐⭐ 受限 | ⭐⭐⭐⭐ 较高 | ⭐⭐⭐⭐⭐ 极高 |
| **包大小** | ~300KB | ~200KB | ~90KB（核心） |
| **适合场景** | 标准图表、快速开发 | 中等定制、BI工具 | 高度定制、科研 |

### 6.2 最终建议

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              最终选型建议                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【绝大多数项目】→ 选择 ECharts                                              │
│                                                                             │
│   理由：                                                                    │
│   - 开发效率最高                                                             │
│   - 功能最完整（内置地图、主题等）                                           │
│   - 文档最完善，社区最活跃                                                    │
│   - 维护最稳定                                                              │
│                                                                             │
│  【有特殊定制需求但不想用 D3】→ 选择 G2                                      │
│                                                                             │
│   理由：                                                                    │
│   - 平衡了灵活性和开发效率                                                   │
│   - 图形语法理念强大                                                         │
│   - 适合构建可配置化图表系统                                                 │
│                                                                             │
│  【需要完全自定义的可视化】→ 选择 D3.js                                      │
│                                                                             │
│   理由：                                                                    │
│   - 提供最底层的控制能力                                                     │
│   - 可以实现任何可视化效果                                                    │
│   - 适合科研和专业可视化                                                     │
│                                                                             │
│  【大型项目/平台】→ 混合使用                                                 │
│                                                                             │
│   理由：                                                                    │
│   - 根据不同模块选择最合适的库                                               │
│   - 发挥各库的优势                                                          │
│   - 标准模块用 ECharts，特殊模块用 G2/D3                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 技术储备建议

```typescript
/**
 * 作为前端工程师，建议掌握的可视化技术栈
 */

/**
 * 第一梯队（必须掌握）：
 * - ECharts：应对 90% 的标准可视化需求
 * - 基本 SVG/CSS 知识：理解可视化原理
 */

/**
 * 第二梯队（推荐掌握）：
 * - G2：提升可视化定制能力
 * - Chart.js 或其他图表库：拓宽技术视野
 */

/**
 * 第三梯队（进阶）：
 * - D3.js：深入可视化原理
 * - Three.js / R3F：3D 可视化
 * - WebGL / GLSL：高性能可视化
 */

/**
 * 持续学习建议：
 *
 * 1. 关注 Apache ECharts 官方博客，了解新特性和最佳实践
 * 2. 阅读 G2 和 D3 的源码，提升架构设计能力
 * 3. 学习可视化设计原则（如《The Visual Display of Quantitative Information》）
 * 4. 参与开源可视化项目，贡献代码
 * 5. 关注可视化领域的学术研究（如 IEEE VIS）
 */
```

通过本章的学习，你应该对 G2 和 D3.js 有了深入的理解，能够根据项目需求做出正确的技术选型。记住，没有最好的库，只有最适合的库。
