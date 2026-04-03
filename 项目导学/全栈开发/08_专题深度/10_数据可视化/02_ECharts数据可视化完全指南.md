# ECharts数据可视化完全指南

## 前言

ECharts 是百度开源的一个使用 JavaScript 实现的开源可视化库，被广泛应用于数据可视化领域。它提供了丰富的图表类型、强大的交互能力和灵活的配置选项，能够帮助开发者快速构建出美观、专业的可视化大屏和数据分析界面。

从咱们的实际项目来看，WebEnv-OS 和 FastDocument 都可能需要集成图表展示功能。无论是展示系统监控数据、项目统计数据还是文档分析报表，ECharts 都是一个非常成熟的选择。本章将从实战角度出发，详细讲解 ECharts 的使用方法、配置技巧和性能优化策略。

## 一、ECharts 基础入门

### 1.1 ECharts 核心概念

在开始使用 ECharts 之前，我们需要先理解几个核心概念：

```
┌─────────────────────────────────────────────────────────────────┐
│                         ECharts 架构图                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                        实例 (Instance)                      │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │                    图表实例                          │  │ │
│  │  │  echarts.init(dom) -> EChartsInstance               │  │ │
│  │  │                                                      │  │ │
│  │  │  主要方法：                                           │  │ │
│  │  │  - setOption(): 设置图表配置                         │  │ │
│  │  │  - getOption(): 获取当前配置                         │  │ │
│  │  │  - resize(): 调整图表大小                            │  │ │
│  │  │  - dispose(): 销毁图表实例                           │  │ │
│  │  │  - on()/off(): 绑定/解绑事件                         │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      选项 (Option)                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │  series    │ │  xAxis     │ │  yAxis     │           │ │
│  │  │  数据系列   │ │  X轴配置   │ │  Y轴配置   │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │  tooltip   │ │  legend    │ │  grid      │           │ │
│  │  │  提示框    │ │  图例      │ │  绘图区域  │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    组件 (Component)                        │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │ │
│  │  │ title  │ │ legend │ │ grid   │ │ xAxis  │ │ yAxis  │     │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │ │
│  │  │ tooltip│ │ toolbox│ │ dataZoom│ │ visualMap│ │ graphic│     │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    系列 (Series)                           │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  line: 折线图      bar: 柱状图      pie: 饼图       │  │ │
│  │  │  scatter: 散点图   radar: 雷达图    gauge: 仪表盘   │  │ │
│  │  │  map: 地图         tree: 树图       sankey: 桑基图  │  │ │
│  │  │  graph: 关系图     funnel: 漏斗图   parallel: 平行坐标│  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 快速上手

先来看一个最简单的例子，感受一下 ECharts 的使用方式：

```typescript
/**
 * ECharts 快速入门示例
 *
 * 这个例子展示了使用 ECharts 的基本流程：
 * 1. 准备一个 DOM 容器
 * 2. 初始化 ECharts 实例
 * 3. 准备图表配置（option）
 * 4. 调用 setOption 方法渲染图表
 */

// 步骤1：准备一个具备宽高的 DOM 容器
// 通常我们会给一个 div 设置 width 和 height
// 注意：容器必须有明确的宽高，否则图表无法渲染
const chartContainer = document.getElementById('chart');
if (!chartContainer) {
  throw new Error('找不到图表容器');
}

// 步骤2：初始化 ECharts 实例
// echarts.init() 接收两个参数：
// - dom: 图表容器
// - theme: 可选，图表主题
// - renderer: 可选，渲染器类型 'canvas' | 'svg'
import * as echarts from 'echarts';

const chart = echarts.init(chartContainer, 'light', {
  renderer: 'canvas', // 推荐使用 canvas 渲染器，性能更好
});

// 步骤3：准备图表配置
// 这是最重要的部分，ECharts 的所有功能都通过 option 来配置
const option = {
  // 标题组件
  title: {
    text: '月度销售额统计', // 主标题文本
    subtext: '2024年度',   // 副标题文本
    left: 'center',        // 标题居中
  },

  // 图例组件
  legend: {
    data: ['销售额', '目标额'], // 图例数据，需要与 series 中的 name 对应
    top: 40,                     // 距离容器顶部的距离
  },

  // 提示框组件
  tooltip: {
    trigger: 'axis',        // 触发类型：'item' | 'axis' | 'none'
    axisPointer: {
      type: 'cross',        // 坐标轴指示器类型
    },
  },

  // X轴配置
  xAxis: {
    type: 'category',       // X轴类型：'category' | 'value' | 'time' | 'log'
    data: ['1月', '2月', '3月', '4月', '5月', '6月'], // X轴数据
    name: '月份',           // X轴名称
  },

  // Y轴配置
  yAxis: {
    type: 'value',
    name: '销售额（万元）',
    axisLabel: {
      formatter: '{value}', // Y轴标签格式化
    },
  },

  // 绘图区域网格
  grid: {
    left: '3%',   // grid 组件距离容器左侧的距离
    right: '4%',
    bottom: '3%',
    containLabel: true, // grid 区域是否包含坐标轴的刻度标签
  },

  // 数据系列
  series: [
    {
      name: '销售额',       // 系列名称，用于图例和提示框
      type: 'bar',         // 图表类型：'line', 'bar', 'pie' 等
      data: [120, 200, 150, 80, 70, 110], // 系列数据
      itemStyle: {
        color: '#5470C6',   // 系列颜色
      },
    },
    {
      name: '目标额',
      type: 'line',        // 折线图
      data: [100, 150, 120, 100, 90, 120],
      lineStyle: {
        color: '#EE6666',   // 线条颜色
        width: 2,           // 线条宽度
      },
      itemStyle: {
        color: '#EE6666',   // 数据点颜色
      },
    },
  ],
};

// 步骤4：设置图表配置并渲染
chart.setOption(option);

// 步骤5（可选）：响应窗口大小变化
// 当窗口大小改变时，图表需要调用 resize 方法重新适应
window.addEventListener('resize', () => {
  // 防抖处理：窗口大小变化时不要频繁调用 resize
  let timeout: number | null = null;
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = window.setTimeout(() => {
    chart.resize();
  }, 100);
});

// 步骤6（可选）：销毁图表实例
// 当不再需要图表时，应该调用 dispose 方法释放内存
// chart.dispose();
```

### 1.3 在 React 中使用 ECharts

在实际项目中，我们通常会在 React 组件中使用 ECharts。下面是一个完整的 React 组件封装示例：

```typescript
/**
 * ECharts React 组件封装
 *
 * 设计思路：
 * 1. 使用 useRef 保存 ECharts 实例
 * 2. 使用 useEffect 初始化和更新图表
 * 3. 组件卸载时销毁实例
 * 4. 支持响应窗口大小变化
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as echarts from 'echarts';

// ECharts 实例类型
type EChartsInstance = echarts.ECharts;

// ECharts React 组件 Props
interface EChartsReactProps {
  /** 图表配置 */
  option: echarts.EChartsCoreOption;
  /** 是否不响应窗口大小变化 */
  notMerge?: boolean;
  /** 是否在 setOption 后不移动容器 */
  notRefreshImmediately?: boolean;
  /** 是否懒加载（首次可见时才渲染） */
  lazyUpdate?: boolean;
  /** 样式 */
  style?: React.CSSProperties;
  /** class 名称 */
  className?: string;
  /** 主题名称 */
  theme?: string | object;
  /** 渲染器类型 */
  renderer?: 'canvas' | 'svg';
  /** 加载状态 */
  loading?: boolean;
  /** 加载动画配置 */
  loadingOptions?: echarts.EChartsLoadingOption;
  /** 回调 */
  onChartReady?: (instance: EChartsInstance) => void;
  /** 事件绑定 */
  onEvents?: Record<string, (params: unknown) => void>;
}

// ECharts React 组件 ref 类型
export interface EChartsReactHandle {
  /** 获取 ECharts 实例 */
  getEChartsInstance: () => EChartsInstance | undefined;
}

/**
 * ECharts React 组件
 *
 * 使用示例：
 * ```tsx
 * const chartRef = useRef<EChartsReactHandle>(null);
 *
 * <EChartsReact
 *   ref={chartRef}
 *   option={chartOption}
 *   style={{ width: '100%', height: '400px' }}
 *   onChartReady={(instance) => {
 *     console.log('图表已就绪', instance);
 *   }}
 * />
 * ```
 */
const EChartsReact = forwardRef<EChartsReactHandle, EChartsReactProps>(
  (
    {
      option,
      notMerge = false,
      notRefreshImmediately = false,
      lazyUpdate = true,
      style,
      className,
      theme,
      renderer = 'canvas',
      loading = false,
      loadingOptions,
      onChartReady,
      onEvents,
    },
    ref
  ) => {
    // 图表容器引用
    const containerRef = useRef<HTMLDivElement>(null);
    // ECharts 实例引用
    const chartRef = useRef<EChartsInstance | undefined>(undefined);
    // 初始化状态
    const [initialized, setInitialized] = useState(false);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      /**
       * 获取 ECharts 实例
       * 父组件可以通过这个方法获取实例并调用实例方法
       */
      getEChartsInstance: () => chartRef.current,
    }));

    // 初始化 ECharts 实例
    useEffect(() => {
      // 容器不存在则不初始化
      if (!containerRef.current) {
        return;
      }

      // 如果已存在实例，先销毁
      if (chartRef.current) {
        chartRef.current.dispose();
      }

      // 初始化新的实例
      const instance = echarts.init(
        containerRef.current,
        theme,
        {
          renderer,
          width: 'auto',  // 自动宽度
          height: 'auto', // 自动高度
        }
      );

      chartRef.current = instance;
      setInitialized(true);

      // 图表就绪回调
      if (onChartReady) {
        onChartReady(instance);
      }

      // 绑定事件
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, handler]) => {
          instance.on(eventName, handler);
        });
      }

      // 组件卸载时销毁实例
      return () => {
        // 解绑事件
        if (onEvents) {
          Object.entries(onEvents).forEach(([eventName, handler]) => {
            instance.off(eventName, handler);
          });
        }

        // 销毁实例
        instance.dispose();
        chartRef.current = undefined;
        setInitialized(false);
      };
    }, [theme, renderer, onChartReady, onEvents]);

    // 更新图表配置
    useEffect(() => {
      if (!chartRef.current || !initialized) {
        return;
      }

      // 使用 setOption 更新图表
      chartRef.current.setOption(option, {
        notMerge,                    // 是否不合并，默认 false，即合并
        notRefreshImmediately,       // 设置完选项后是否立即刷新画布
        lazyUpdate,                  // 设置完选项后是否延迟刷新
      });
    }, [option, notMerge, notRefreshImmediately, lazyUpdate, initialized]);

    // 处理加载状态
    useEffect(() => {
      if (!chartRef.current || !initialized) {
        return;
      }

      if (loading) {
        chartRef.current.showLoading('default', loadingOptions);
      } else {
        chartRef.current.hideLoading();
      }
    }, [loading, loadingOptions, initialized]);

    // 响应窗口大小变化
    useEffect(() => {
      if (!initialized) {
        return;
      }

      // 使用防抖处理 resize 事件
      let resizeTimer: number | null = null;

      const handleResize = () => {
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
        resizeTimer = window.setTimeout(() => {
          chartRef.current?.resize();
        }, 100);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
      };
    }, [initialized]);

    return (
      <div
        ref={containerRef}
        style={{
          width: style?.width || '100%',
          height: style?.height || '400px',
          ...style,
        }}
        className={className}
      />
    );
  }
);

EChartsReact.displayName = 'EChartsReact';

export default EChartsReact;
```

## 二、图表类型详解

ECharts 支持非常丰富的图表类型，下面我们逐一介绍每种图表的特点和使用场景。

### 2.1 折线图（Line Chart）

折线图是最常用的图表类型之一，用于展示数据随时间或类别变化的趋势。

```typescript
/**
 * 折线图配置示例
 */

// 基础折线图
const basicLineOption: echarts.EChartsCoreOption = {
  title: {
    text: '年度销售趋势',
    subtext: '折线图示例',
  },

  tooltip: {
    trigger: 'axis', // 鼠标悬停在轴上时显示提示框
    // 格式化提示框内容
    formatter: (params: unknown) => {
      const p = params as Array<{ name: string; seriesName: string; value: number; color: string }>;
      let result = `${p[0].name}<br/>`;
      p.forEach(item => {
        result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>${item.seriesName}: ${item.value}<br/>`;
      });
      return result;
    },
  },

  legend: {
    data: ['华东地区', '华南地区', '华北地区'],
    bottom: 0,
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%', // 给图例留出空间
    containLabel: true,
  },

  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    boundaryGap: false, // 让折线从坐标轴起点开始
  },

  yAxis: {
    type: 'value',
    name: '销售额（万元）',
    // Y轴分割线的样式
    splitLine: {
      lineStyle: {
        type: 'dashed', // 虚线
        color: '#E0E0E0',
      },
    },
  },

  series: [
    {
      name: '华东地区',
      type: 'line',
      data: [820, 932, 901, 1034, 1290, 1330, 1320, 1500, 1200, 1050, 950, 1100],
      // 平滑曲线
      smooth: true,
      // 线条样式
      lineStyle: {
        width: 3,
        color: '#5470C6',
      },
      // 数据点样式
      itemStyle: {
        color: '#5470C6',
      },
      // 区域填充样式
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(84, 112, 198, 0.5)' }, // 顶部颜色
          { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }, // 底部颜色
        ]),
      },
      // 标记点配置
      markPoint: {
        data: [
          { type: 'max', name: '最大值' },
          { type: 'min', name: '最小值' },
        ],
      },
      // 标注线配置
      markLine: {
        data: [
          { type: 'average', name: '平均值' },
        ],
      },
    },
    {
      name: '华南地区',
      type: 'line',
      data: [650, 750, 820, 900, 1100, 1250, 1300, 1150, 1050, 950, 850, 920],
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#91CC75',
      },
      itemStyle: {
        color: '#91CC75',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(145, 204, 117, 0.5)' },
          { offset: 1, color: 'rgba(145, 204, 117, 0.1)' },
        ]),
      },
    },
    {
      name: '华北地区',
      type: 'line',
      data: [520, 580, 620, 700, 850, 920, 980, 900, 820, 780, 700, 750],
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#FAC858',
      },
      itemStyle: {
        color: '#FAC858',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(250, 200, 88, 0.5)' },
          { offset: 1, color: 'rgba(250, 200, 88, 0.1)' },
        ]),
      },
    },
  ],
};

/**
 * 堆叠折线图
 * 用于展示部分与整体的关系
 */
const stackedLineOption: echarts.EChartsCoreOption = {
  title: {
    text: '用户留存分析',
    subtext: '堆叠面积图',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },

  legend: {
    data: ['新增用户', '活跃用户', '付费用户'],
    bottom: 0,
  },

  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    boundaryGap: false,
  },

  yAxis: {
    type: 'value',
    name: '用户数',
  },

  series: [
    {
      name: '新增用户',
      type: 'line',
      stack: 'Total', // 堆叠配置，相同 stack 值的会堆叠在一起
      data: [320, 302, 341, 374, 390, 450, 420],
      areaStyle: {},
      smooth: true,
    },
    {
      name: '活跃用户',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 201, 334, 390, 430, 520],
      areaStyle: {},
      smooth: true,
    },
    {
      name: '付费用户',
      type: 'line',
      stack: 'Total',
      data: [20, 32, 41, 64, 90, 130, 120],
      areaStyle: {},
      smooth: true,
    },
  ],
};

/**
 * 多 Y 轴折线图
 * 用于展示不同量级的数据
 */
const multiYAxisLineOption: echarts.EChartsCoreOption = {
  title: {
    text: '销售数据与转化率对比',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },

  legend: {
    data: ['销售额', '访客数', '转化率'],
    bottom: 0,
  },

  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },

  // 多个 Y 轴
  yAxis: [
    {
      type: 'value',
      name: '销售额（万元）',
      position: 'left',
    },
    {
      type: 'value',
      name: '访客数（人）',
      position: 'right',
      splitLine: {
        show: false, // 右侧 Y 轴不显示网格线
      },
    },
    {
      type: 'value',
      name: '转化率（%）',
      position: 'right',
      offset: 60, // 偏移，避免与第二个 Y 轴重叠
      max: 10,    // 设置最大值
      splitLine: {
        show: false,
      },
    },
  ],

  series: [
    {
      name: '销售额',
      type: 'line',
      data: [120, 200, 150, 80, 70, 110],
      yAxisIndex: 0, // 指定使用的 Y 轴索引
    },
    {
      name: '访客数',
      type: 'line',
      data: [1200, 2000, 1500, 800, 700, 1100],
      yAxisIndex: 1,
    },
    {
      name: '转化率',
      type: 'line',
      data: [5.2, 6.1, 4.8, 3.5, 4.2, 5.8],
      yAxisIndex: 2,
    },
  ],
};
```

### 2.2 柱状图（Bar Chart）

柱状图用于展示不同类别之间的数值比较，是最直观的比较图表。

```typescript
/**
 * 柱状图配置示例
 */

// 基础柱状图
const basicBarOption: echarts.EChartsCoreOption = {
  title: {
    text: '各省份销售额排名',
    subtext: '2024年度数据',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow', // 使用阴影指示器
    },
    // 格式化显示
    formatter: (params: unknown) => {
      const p = params as Array<{ name: string; value: number; seriesName: string; color: string }>;
      return `${p[0].name}<br/>销售额: ${p[0].value} 万元`;
    },
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },

  xAxis: {
    type: 'value',
    name: '销售额（万元）',
    axisLabel: {
      formatter: '{value}',
    },
  },

  yAxis: {
    type: 'category',
    data: ['广东', '江苏', '浙江', '山东', '河南', '四川', '湖北', '湖南'],
    // Y 轴名称位置
    nameLocation: 'middle',
    nameGap: 30,
  },

  series: [
    {
      name: '销售额',
      type: 'bar',
      data: [
        { value: 1500, itemStyle: { color: '#5470C6' } },
        { value: 1350, itemStyle: { color: '#5470C6' } },
        { value: 1200, itemStyle: { color: '#5470C6' } },
        { value: 1050, itemStyle: { color: '#5470C6' } },
        { value: 950, itemStyle: { color: '#5470C6' } },
        { value: 850, itemStyle: { color: '#5470C6' } },
        { value: 750, itemStyle: { color: '#5470C6' } },
        { value: 650, itemStyle: { color: '#5470C6' } },
      ],
      // 柱条样式
      itemStyle: {
        borderRadius: [0, 4, 4, 0], // 圆角，只在右边有圆角
        // 每个柱子的颜色不同可以使用回调函数
        // color: (params: { dataIndex: number }) => {
        //   const colorList = ['#5470C6', '#91CC75', '#FAC858', ...];
        //   return colorList[params.dataIndex % colorList.length];
        // },
      },
      // 柱宽
      barWidth: '60%',
      // 标签配置
      label: {
        show: true,
        position: 'right', // 标签显示在柱子右边
        formatter: '{c} 万',
        color: '#333',
      },
      // 背景柱配置
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)',
        borderRadius: [0, 4, 4, 0],
      },
    },
  ],
};

/**
 * 横向柱状图
 */
const horizontalBarOption: echarts.EChartsCoreOption = {
  title: {
    text: '员工绩效评分',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },

  grid: {
    left: '3%',
    right: '15%', // 给标签留出空间
    bottom: '3%',
    containLabel: true,
  },

  xAxis: {
    type: 'value',
    max: 10, // 最高分 10 分
  },

  yAxis: {
    type: 'category',
    data: ['张伟', '李娜', '王芳', '赵强', '陈明'],
  },

  series: [
    {
      name: '绩效评分',
      type: 'bar',
      data: [9.2, 8.5, 7.8, 8.8, 9.5],
      itemStyle: {
        // 使用渐变色
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#5470C6' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c} 分',
      },
    },
  ],
};

/**
 * 分组柱状图
 */
const groupedBarOption: echarts.EChartsCoreOption = {
  title: {
    text: '季度销售对比',
    subtext: '分组柱状图',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },

  legend: {
    data: ['电子产品', '服装', '食品'],
    bottom: 0,
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },

  xAxis: {
    type: 'category',
    data: ['Q1', 'Q2', 'Q3', 'Q4'],
  },

  yAxis: {
    type: 'value',
    name: '销售额（万元）',
  },

  series: [
    {
      name: '电子产品',
      type: 'bar',
      data: [320, 432, 501, 634],
      itemStyle: {
        color: '#5470C6',
      },
    },
    {
      name: '服装',
      type: 'bar',
      data: [120, 202, 181, 234],
      itemStyle: {
        color: '#91CC75',
      },
    },
    {
      name: '食品',
      type: 'bar',
      data: [220, 182, 231, 284],
      itemStyle: {
        color: '#FAC858',
      },
    },
  ],
};

/**
 * 堆叠柱状图
 */
const stackedBarOption: echarts.EChartsCoreOption = {
  title: {
    text: '电商平台市场份额',
    subtext: '堆叠柱状图',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },

  legend: {
    data: ['天猫', '京东', '拼多多', '其他'],
    bottom: 0,
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },

  xAxis: {
    type: 'category',
    data: ['2020', '2021', '2022', '2023', '2024'],
  },

  yAxis: {
    type: 'value',
    name: '市场份额（%）',
    max: 100,
  },

  series: [
    {
      name: '天猫',
      type: 'bar',
      stack: 'Total',
      data: [50, 48, 45, 42, 40],
      itemStyle: {
        color: '#FF6A00',
      },
    },
    {
      name: '京东',
      type: 'bar',
      stack: 'Total',
      data: [30, 28, 27, 26, 25],
      itemStyle: {
        color: '#E43C13',
      },
    },
    {
      name: '拼多多',
      type: 'bar',
      stack: 'Total',
      data: [10, 15, 20, 25, 28],
      itemStyle: {
        color: '#E43D6D',
      },
    },
    {
      name: '其他',
      type: 'bar',
      stack: 'Total',
      data: [10, 9, 8, 7, 7],
      itemStyle: {
        color: '#94A3B8',
      },
    },
  ],
};

/**
 * 瀑布图
 */
const waterfallOption: echarts.EChartsCoreOption = {
  title: {
    text: '利润变化分析',
    subtext: '瀑布图',
  },

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
    formatter: (params: unknown) => {
      const p = params as Array<{ seriesName: string; value: number; color: string }>;
      if (p[0].seriesName === 'placeholder') {
        return '';
      }
      return `${p[0].name}<br/>${p[0].seriesName}: ${p[0].value > 0 ? '+' : ''}${p[0].value}`;
    },
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },

  xAxis: {
    type: 'category',
    data: ['期初', '收入', '成本', '费用', '税收', '期末'],
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
  },

  yAxis: {
    type: 'value',
    name: '金额（万元）',
  },

  series: [
    {
      name: 'placeholder',
      type: 'bar',
      stack: 'Total',
      itemStyle: {
        borderColor: 'transparent',
        color: 'transparent',
      },
      emphasis: {
        itemStyle: {
          borderColor: 'transparent',
          color: 'transparent',
        },
      },
      data: [0, 500, 500, 300, 200, 200], // 用于占位，使柱子悬浮
    },
    {
      name: '正向值',
      type: 'bar',
      stack: 'Total',
      data: [500, 500, 0, 0, 0, 0], // 收入部分
      itemStyle: {
        color: '#91CC75',
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params: { value: number }) => params.value > 0 ? `+${params.value}` : '',
      },
    },
    {
      name: '负向值',
      type: 'bar',
      stack: 'Total',
      data: [0, 0, -200, -100, -50, 0], // 成本、费用、税收部分
      itemStyle: {
        color: '#EE6666',
      },
      label: {
        show: true,
        position: 'bottom',
        formatter: (params: { value: number }) => params.value < 0 ? `${params.value}` : '',
      },
    },
    {
      name: '期末',
      type: 'bar',
      data: [0, 0, 0, 0, 0, 150], // 期末余额
      itemStyle: {
        color: '#5470C6',
      },
      label: {
        show: true,
        position: 'top',
        formatter: '余额: {c}',
      },
    },
  ],
};
```

### 2.3 饼图（Pie Chart）

饼图用于展示各部分占总体的比例关系。

```typescript
/**
 * 饼图配置示例
 */

// 基础饼图
const basicPieOption: echarts.EChartsCoreOption = {
  title: {
    text: '用户来源分布',
    subtext: '饼图示例',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
    // 格式化显示：百分比和小数值
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },

  legend: {
    orient: 'vertical',   // 图例竖向排列
    left: 'left',
    top: 'center',
  },

  series: [
    {
      name: '用户来源',
      type: 'pie',
      radius: ['40%', '70%'], // 环形饼图，内半径 40%，外半径 70%
      center: ['60%', '50%'],  // 圆心位置
      avoidLabelOverlap: false, // 是否启用防止标签重叠策略
      itemStyle: {
        borderRadius: 10,     // 圆角
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        position: 'outside', // 标签位置：'outside' | 'inside' | 'center'
        formatter: '{b}: {d}%', // {b} 系列名称，{d} 百分比
      },
      emphasis: {
        // 强调样式（鼠标悬停时）
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      labelLine: {
        show: true,
        lineStyle: {
          color: '#999',
        },
      },
      data: [
        { value: 1048, name: '搜索引擎', itemStyle: { color: '#5470C6' } },
        { value: 735, name: '直接访问', itemStyle: { color: '#91CC75' } },
        { value: 580, name: '邮件营销', itemStyle: { color: '#FAC858' } },
        { value: 484, name: '联盟广告', itemStyle: { color: '#EE6666' } },
        { value: 300, name: '视频广告', itemStyle: { color: '#73C0DE' } },
      ],
    },
  ],
};

/**
 * 南丁格尔玫瑰图（ Nightingale Rose Chart）
 * 也叫鸡冠花图，用于展示分组数据的比例
 */
const roseChartOption: echarts.EChartsCoreOption = {
  title: {
    text: '各类商品销售占比',
    subtext: '南丁格尔玫瑰图',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },

  legend: {
    bottom: 0,
  },

  series: [
    {
      name: '商品类别',
      type: 'pie',
      radius: ['20%', '70%'], // 南丁格尔玫瑰图使用这种方式
      center: ['50%', '50%'],
      roseType: 'area', // 玫瑰类型：'radius'（半径）|'area'（面积）
      itemStyle: {
        borderRadius: 5,
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
      },
      data: [
        { value: 40, name: '服装' },
        { value: 38, name: '数码' },
        { value: 36, name: '食品' },
        { value: 32, name: '图书' },
        { value: 28, name: '家居' },
        { value: 26, name: '美妆' },
        { value: 22, name: '运动' },
        { value: 18, name: '其他' },
      ],
      // 每个扇区的颜色
      color: [
        '#5470C6',
        '#91CC75',
        '#FAC858',
        '#EE6666',
        '#73C0DE',
        '#3BA272',
        '#FC8452',
        '#9A60B4',
      ],
    },
  ],
};

/**
 * 多饼图
 */
const multiPieOption: echarts.EChartsCoreOption = {
  title: {
    text: '各部门费用构成',
    subtext: '多饼图',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },

  legend: {
    data: ['研发部', '市场部', '销售部', '人事部'],
    bottom: 0,
  },

  series: [
    {
      name: '研发部',
      type: 'pie',
      center: ['25%', '50%'],
      radius: '30%',
      label: {
        position: 'outside',
        formatter: '{b}: {d}%',
      },
      data: [
        { value: 45, name: '人力成本' },
        { value: 30, name: '设备采购' },
        { value: 15, name: '运营费用' },
        { value: 10, name: '培训费用' },
      ],
    },
    {
      name: '市场部',
      type: 'pie',
      center: ['50%', '50%'],
      radius: '30%',
      label: {
        position: 'outside',
        formatter: '{b}: {d}%',
      },
      data: [
        { value: 50, name: '广告投放' },
        { value: 25, name: '活动策划' },
        { value: 15, name: '市场调研' },
        { value: 10, name: '其他费用' },
      ],
    },
    {
      name: '销售部',
      type: 'pie',
      center: ['75%', '50%'],
      radius: '30%',
      label: {
        position: 'outside',
        formatter: '{b}: {d}%',
      },
      data: [
        { value: 60, name: '业务提成' },
        { value: 20, name: '差旅费用' },
        { value: 12, name: '客户维护' },
        { value: 8, name: '其他费用' },
      ],
    },
  ],
};
```

### 2.4 散点图（Scatter Chart）

散点图用于展示两个变量之间的关系，可以帮助发现数据的相关性和分布规律。

```typescript
/**
 * 散点图配置示例
 */

// 基础散点图
const basicScatterOption: echarts.EChartsCoreOption = {
  title: {
    text: '身高与体重的关系',
    subtext: '散点图示例',
  },

  tooltip: {
    trigger: 'item',
    formatter: (params: { value: number[] }) =>
      `身高: ${params.value[0]} cm<br/>体重: ${params.value[1]} kg`,
  },

  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },

  xAxis: {
    type: 'value',
    name: '身高（cm）',
    // X轴从 150 开始
    min: 150,
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  },

  yAxis: {
    type: 'value',
    name: '体重（kg）',
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  },

  series: [
    {
      name: '女生',
      type: 'scatter',
      symbolSize: 10, // 数据点大小
      data: [
        [155, 48], [158, 52], [160, 55], [162, 58], [164, 60], [166, 62],
        [168, 60], [170, 63], [172, 65], [174, 68], [176, 70],
      ],
      itemStyle: {
        color: '#EE6666',
      },
    },
    {
      name: '男生',
      type: 'scatter',
      symbolSize: 10,
      data: [
        [162, 55], [165, 60], [168, 65], [170, 68], [172, 70], [174, 72],
        [176, 75], [178, 78], [180, 80], [182, 82], [185, 85],
      ],
      itemStyle: {
        color: '#5470C6',
      },
    },
  ],
};

/**
 * 气泡图
 * 气泡大小表示第三个变量
 */
const bubbleChartOption: echarts.EChartsCoreOption = {
  title: {
    text: 'GDP 与人均寿命关系（气泡大小表示人口）',
    subtext: '气泡图示例',
  },

  tooltip: {
    trigger: 'item',
    formatter: (params: { value: number[]; name: string }) =>
      `${params.name}<br/>人均GDP: ${params.value[0]} 美元<br/>人均寿命: ${params.value[1]} 年<br/>人口: ${params.value[2] / 1000000} 百万`,
  },

  xAxis: {
    type: 'value',
    name: '人均GDP（美元）',
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  },

  yAxis: {
    type: 'value',
    name: '人均寿命（年）',
    min: 50, // 最低 50 岁
    splitLine: {
      lineStyle: {
        type: 'dashed',
      },
    },
  },

  series: [
    {
      type: 'scatter',
      symbolSize: (data: number[]) => {
        // 气泡大小根据第三个数据（人口）计算
        // 需要归一化到合理范围
        return Math.sqrt(data[2]) / 100;
      },
      data: [
        [1000, 60, 50000000],   // [GDP, 寿命, 人口]
        [5000, 70, 100000000],
        [10000, 75, 80000000],
        [20000, 78, 50000000],
        [30000, 80, 200000000],
        [40000, 82, 100000000],
        [50000, 85, 50000000],
      ],
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          // 根据数据索引返回不同颜色
          const colorList = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'];
          return colorList[params.dataIndex % colorList.length];
        },
      },
      // 气泡透明度
      emphasis: {
        label: {
          show: true,
          formatter: (params: { data: string[] }) => params.data[0],
          position: 'top',
        },
      },
    },
  ],
};

/**
 * 带涟漪特效的散点图
 */
const effectScatterOption: echarts.EChartsCoreOption = {
  title: {
    text: '全国主要城市空气质量',
    subtext: 'AQI 指数',
  },

  tooltip: {
    trigger: 'item',
    formatter: (params: { name: string; value: number[] }) =>
      `${params.name}<br/>AQI: ${params.value[2]}`,
  },

  geo: {
    // 需要配合地图组件使用
    // 先加载地图数据 echarts.registerMap('china', chinaMapData)
    map: 'china',
    roam: true, // 支持缩放和平移
    label: {
      show: true,
      color: '#fff',
      fontSize: 10,
    },
    itemStyle: {
      areaColor: '#1b1b1b',
      borderColor: '#404040',
    },
    emphasis: {
      label: {
        show: true,
        color: '#fff',
      },
      itemStyle: {
        areaColor: '#2a2a2a',
      },
    },
  },

  series: [
    {
      name: '城市 AQI',
      type: 'effectScatter', // 涟漪特效散点图
      coordinateSystem: 'geo', // 使用地理坐标系
      data: [
        { name: '北京', value: [116.46, 39.92, 200] },
        { name: '上海', value: [121.48, 31.22, 150] },
        { name: '广州', value: [113.23, 23.16, 120] },
        { name: '深圳', value: [114.07, 22.62, 90] },
        { name: '成都', value: [104.06, 30.67, 100] },
        { name: '西安', value: [108.95, 34.27, 180] },
      ],
      symbolSize: (val: number[]) => {
        // 根据 AQI 值确定气泡大小
        return val[2] / 20;
      },
      showEffectOn: 'emphasis', // 'render' | 'emphasis' 鼠标悬停时显示特效
      rippleEffect: {
        brushType: 'stroke', // 'fill' | 'stroke'
        scale: 3, // 波纹最大缩放比例
      },
      label: {
        show: true,
        position: 'right',
        formatter: (params: { name: string }) => params.name,
      },
      itemStyle: {
        color: (params: { value: number[] }) => {
          const aqi = params.value[2];
          if (aqi <= 50) return '#00E400'; // 优
          if (aqi <= 100) return '#FFFF00'; // 良
          if (aqi <= 150) return '#FF7E00'; // 轻度污染
          if (aqi <= 200) return '#FF0000'; // 中度污染
          if (aqi <= 300) return '#99004C'; // 重度污染
          return '#7E0023'; // 严重污染
        },
      },
    },
  ],
};
```

### 2.5 雷达图（Radar Chart）

雷达图用于展示多维数据，比较多个变量之间的关系。

```typescript
/**
 * 雷达图配置示例
 */

const radarOption: echarts.EChartsCoreOption = {
  title: {
    text: '员工能力评估',
    subtext: '雷达图示例',
  },

  tooltip: {
    trigger: 'item',
  },

  legend: {
    data: ['张三', '李四', '王五'],
    bottom: 0,
  },

  radar: {
    // 雷达图的指示器，用来指定坐标轴，可以有多个
    indicator: [
      { name: '沟通能力', max: 100 },
      { name: '技术能力', max: 100 },
      { name: '项目管理', max: 100 },
      { name: '创新能力', max: 100 },
      { name: '团队协作', max: 100 },
      { name: '执行能力', max: 100 },
    ],
    // 雷达图中心点
    center: ['50%', '55%'],
    // 半径
    radius: '65%',
    // 形状：'polygon'（多边形）|'circle'（圆形）
    shape: 'polygon',
    // 分割线配置
    splitLine: {
      lineStyle: {
        color: '#E0E0E0',
        type: 'dashed',
      },
    },
    // 分割区域配置
    splitArea: {
      areaStyle: {
        color: ['#F8F8F8', '#E8F4F8', '#F8F8F8', '#E8F4F8', '#F8F8F8', '#E8F4F8'],
      },
    },
    // 坐标轴线配置
    axisLine: {
      lineStyle: {
        color: '#E0E0E0',
      },
    },
    // 指示器名称配置
    name: {
      textStyle: {
        color: '#333',
        fontSize: 12,
      },
    },
  },

  series: [
    {
      name: '能力评估',
      type: 'radar',
      data: [
        {
          value: [85, 90, 75, 80, 88, 92],
          name: '张三',
          // 填充样式
          areaStyle: {
            color: 'rgba(84, 112, 198, 0.3)',
          },
          // 线条样式
          lineStyle: {
            color: '#5470C6',
            width: 2,
          },
          // 数据点样式
          itemStyle: {
            color: '#5470C6',
          },
          // 标签配置
          label: {
            show: true,
            formatter: (params: { value: number }) => params.value,
          },
        },
        {
          value: [78, 82, 90, 85, 76, 80],
          name: '李四',
          areaStyle: {
            color: 'rgba(145, 204, 117, 0.3)',
          },
          lineStyle: {
            color: '#91CC75',
            width: 2,
          },
          itemStyle: {
            color: '#91CC75',
          },
        },
        {
          value: [92, 75, 80, 90, 82, 78],
          name: '王五',
          areaStyle: {
            color: 'rgba(250, 200, 88, 0.3)',
          },
          lineStyle: {
            color: '#FAC858',
            width: 2,
          },
          itemStyle: {
            color: '#FAC858',
          },
        },
      ],
    },
  ],
};
```

### 2.6 仪表盘（Gauge Chart）

仪表盘用于展示单个指标的值，常用于进度监控、KPI 展示等场景。

```typescript
/**
 * 仪表盘配置示例
 */

const gaugeOption: echarts.EChartsCoreOption = {
  title: {
    text: 'CPU 使用率',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c}%',
  },

  series: [
    {
      name: 'CPU',
      type: 'gauge',
      center: ['50%', '60%'], // 仪表盘中心位置
      startAngle: 200, // 起始角度（度数）
      endAngle: -20,   // 结束角度
      min: 0,          // 最小值
      max: 100,        // 最大值
      splitNumber: 10, // 分割段数
      radius: '90%',   // 仪表盘半径

      // 指针配置
      itemStyle: {
        color: '#5470C6',
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', // 指针形状，可以是 SVG 路径
        length: '60%',  // 指针长度
        width: 8,       // 指针宽度
        offsetCenter: [0, '-10%'], // 指针偏移
        itemStyle: {
          color: '#5470C6',
        },
      },
      // 刻度线配置
      axisLine: {
        lineStyle: {
          width: 15, // 刻度线宽度
          // 使用颜色分段
          color: [
            [0.3, '#91CC75'], // 0-30% 绿色
            [0.7, '#FAC858'], // 30-70% 黄色
            [1, '#EE6666'],   // 70-100% 红色
          ],
        },
      },
      // 分割线配置
      splitLine: {
        length: 15, // 分割线长度
        lineStyle: {
          width: 2,
          color: '#999',
        },
      },
      // 刻度标签配置
      axisTick: {
        distance: -30, // 刻度标签距离刻度线的距离（负数表示在另一侧）
        length: 8,
        lineStyle: {
          color: '#999',
          width: 1,
        },
      },
      // 刻度名称配置
      axisLabel: {
        color: '#999',
        distance: 35, // 刻度标签距离圆心的距离
        formatter: (value: number) => {
          if (value === 0 || value === 100) {
            return value;
          }
          return '';
        },
      },
      // 详情配置（中心数值显示）
      detail: {
        valueAnimation: true, // 是否启用数值动画
        formatter: (value: number) => `{value}%`,
        color: '#333',
        fontSize: 24,
        offsetCenter: [0, '70%'], // 位置偏移
      },
      // 数据
      data: [
        {
          value: 65,
          name: 'CPU使用率',
          title: {
            color: '#333',
            offsetCenter: [0, '-40%'], // 标题位置
          },
        },
      ],
    },
  ],
};

/**
 * 多仪表盘组合
 */
const multiGaugeOption: echarts.EChartsCoreOption = {
  title: {
    text: '系统监控仪表盘',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
  },

  series: [
    {
      name: 'CPU',
      type: 'gauge',
      center: ['25%', '55%'],
      radius: '80%',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: '#5470C6',
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        fontSize: 16,
        offsetCenter: [0, '70%'],
      },
      data: [{ value: 65, name: 'CPU' }],
    },
    {
      name: '内存',
      type: 'gauge',
      center: ['50%', '55%'],
      radius: '80%',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: '#91CC75',
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        font Size: 16,
        offsetCenter: [0, '70%'],
      },
      data: [{ value: 45, name: '内存' }],
    },
    {
      name: '磁盘',
      type: 'gauge',
      center: ['75%', '55%'],
      radius: '80%',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: {
        color: '#FAC858',
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        fontSize: 16,
        offsetCenter: [0, '70%'],
      },
      data: [{ value: 78, name: '磁盘' }],
    },
  ],
};
```

## 三、数据集（Dataset）

数据集是 ECharts 4.0 引入的特性，它可以让我们在数据管理方面更加灵活，特别是在数据来源于不同表格、需要复用数据或者进行数据转换时非常有用。

### 3.1 为什么使用数据集

```typescript
/**
 * 使用数据集的好处
 *
 * 1. 数据与配置分离，便于管理
 * 2. 可以复用数据源
 * 3. 支持数据转换（encode、transform）
 * 4. 支持从外部加载数据
 */

// 传统方式：数据写在 series 中
const traditionalOption = {
  series: [
    {
      type: 'line',
      data: [
        [10, 20], [30, 40], [50, 60]
      ]
    }
  ]
};

// 使用数据集：数据与配置分离
const datasetOption = {
  dataset: {
    source: [
      [10, 20],
      [30, 40],
      [50, 60]
    ]
  },
  series: [
    {
      type: 'line',
      // 数据从 dataset 的 source 中获取
      // 通过 encode 指定如何映射
      encode: {
        x: 0, // 第一列映射到 x 轴
        y: 1  // 第二列映射到 y 轴
      }
    }
  ]
};
```

### 3.2 数据集详细配置

```typescript
/**
 * 数据集详细配置示例
 */

const datasetDetailOption: echarts.EChartsCoreOption = {
  title: {
    text: '数据集使用示例',
  },

  tooltip: {
    trigger: 'axis',
  },

  legend: {
    data: ['产品A', '产品B', '产品C'],
    bottom: 0,
  },

  // 数据集配置
  dataset: {
    // 数据源
    source: [
      // 日期     , 产品A, 产品B, 产品C
      ['2024-01', 120,  80,   65  ],
      ['2024-02', 135,  92,   78  ],
      ['2024-03', 148,  105,  82  ],
      ['2024-04', 152,  112,  90  ],
      ['2024-05', 168,  125,  95  ],
      ['2024-06', 175,  138,  102 ],
    ],

    // 数据维度定义（可选）
    dimensions: [
      'date',       // 维度 0：日期
      { name: 'productA', type: 'number' }, // 维度 1：产品A（显式指定类型）
      { name: 'productB', type: 'number' }, // 维度 2：产品B
      { name: 'productC', type: 'number' }, // 维度 3：产品C
    ],

    // 数据源 ID（用于多个 dataset 时的引用）
    id: 'mainDataset',
  },

  // 数据转换配置
  // transform: {
  //   type: 'filter',
  //   config: {
  //     dimension: 3,  // 按第4列过滤
  //     condition: { $gte: 80 } // 条件：大于等于80
  //   }
  // },

  xAxis: {
    type: 'category',
    // 可以从 dataset 中取数据
    data: {
      datasetId: 'mainDataset',
      dimension: 0, // 使用第一个维度作为 X 轴数据
    },
  },

  yAxis: {
    type: 'value',
  },

  series: [
    {
      name: '产品A',
      type: 'bar',
      // 使用 encode 指定数据映射
      encode: {
        x: 'date',      // 维度名也可以
        y: 'productA',
        tooltip: ['date', 'productA'],
      },
      // 或者直接指定维度索引
      // encode: {
      //   x: 0,
      //   y: 1,
      // },
    },
    {
      name: '产品B',
      type: 'bar',
      encode: {
        x: 0,
        y: 2,
      },
    },
    {
      name: '产品C',
      type: 'line',
      encode: {
        x: 0,
        y: 3,
      },
    },
  ],
};

/**
 * 多个数据集示例
 */
const multiDatasetOption: echarts.EChartsCoreOption = {
  title: {
    text: '多数据集示例',
  },

  tooltip: {
    trigger: 'axis',
  },

  legend: {
    data: ['销售额', '目标额', '完成率'],
    bottom: 0,
  },

  dataset: [
    {
      // 第一个数据集
      id: 'sales',
      source: [
        ['月份', '销售额', '目标额'],
        ['1月', 120, 100],
        ['2月', 135, 120],
        ['3月', 148, 140],
        ['4月', 152, 150],
        ['5月', 168, 160],
      ],
    },
    {
      // 第二个数据集
      id: 'completion',
      // 从 sales 数据集计算得出
      // transform: {
      //   type: 'ecStat:regression',
      //   config: {
      //     method: 'linear',
      //     dimensions: [0, 1]
      //   }
      // }
    },
  ],

  xAxis: {
    type: 'category',
    data: { datasetId: 'sales', dimension: 0 },
  },

  yAxis: [
    {
      type: 'value',
      name: '金额（万元）',
    },
    {
      type: 'value',
      name: '完成率（%）',
      max: 120,
    },
  ],

  series: [
    {
      name: '销售额',
      type: 'bar',
      datasetId: 'sales',
      encode: { x: 0, y: 1 },
    },
    {
      name: '目标额',
      type: 'bar',
      datasetId: 'sales',
      encode: { x: 0, y: 2 },
    },
    {
      name: '完成率',
      type: 'line',
      yAxisIndex: 1, // 使用第二个 Y 轴
      // 自定义计算完成率
      data: [
        ['1月', 120],
        ['2月', 112.5],
        ['3月', 105.7],
        ['4月', 101.3],
        ['5月', 105],
      ],
    },
  ],
};

/**
 * 数据转换示例
 * 使用 transform 进行数据处理
 */
const transformDatasetOption: echarts.EChartsCoreOption = {
  title: {
    text: '数据转换示例',
    subtext: '使用 transform 过滤数据',
  },

  dataset: [
    {
      id: 'rawData',
      source: [
        ['地区', '销售额', '利润'],
        ['华东', 1200, 300],
        ['华南', 800, 200],
        ['华北', 950, 250],
        ['西南', 600, 150],
        ['东北', 450, 120],
        ['西北', 380, 100],
        ['港澳', 200, 80],
      ],
    },
    {
      id: 'filteredData',
      fromDatasetId: 'rawData',
      // 数据转换：过滤利润大于150的数据
      transform: {
        type: 'filter',
        config: {
          dimension: 2, // 利润维度
          condition: (params: { value: number }) => params.value > 150,
        },
      },
    },
  ],

  tooltip: {
    trigger: 'axis',
  },

  xAxis: {
    type: 'category',
    data: { datasetId: 'filteredData', dimension: 0 },
  },

  yAxis: {
    type: 'value',
  },

  series: [
    {
      type: 'bar',
      datasetId: 'filteredData',
      encode: { x: 0, y: 1 },
      label: {
        show: true,
        position: 'top',
      },
    },
  ],
};
```

## 四、异步加载与数据动态更新

### 4.1 异步加载数据

在实际应用中，图表数据通常需要从服务器异步获取。下面介绍几种常见的异步加载方式：

```typescript
/**
 * 异步加载数据的方式
 *
 * 方式一：初始化时先显示空图表，然后异步获取数据后更新
 * 方式二：使用 showLoading 先显示加载动画，数据到达后更新
 * 方式三：懒加载，首次可见时才初始化和加载数据
 */

import * as echarts from 'echarts';

/**
 * 方式一：初始化后异步更新数据
 */
async function initChartWithAsyncData(): Promise<void> {
  // 准备容器
  const chartContainer = document.getElementById('chart');
  if (!chartContainer) return;

  // 初始化图表
  const chart = echarts.init(chartContainer);

  // 设置基础配置（不包含数据）
  const baseOption = {
    title: {
      text: '异步加载示例',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['销售额', '利润'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: [], // 初始为空
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '销售额',
        type: 'bar',
        data: [],
      },
      {
        name: '利润',
        type: 'line',
        data: [],
      },
    ],
  };

  // 先设置空数据渲染图表
  chart.setOption(baseOption);

  // 异步获取数据
  try {
    const data = await fetchChartData();

    // 更新图表数据
    chart.setOption({
      xAxis: {
        data: data.categories,
      },
      series: [
        {
          name: '销售额',
          data: data.sales,
        },
        {
          name: '利润',
          data: data.profits,
        },
      ],
    });
  } catch (error) {
    console.error('获取数据失败:', error);
    // 可以在这里显示错误提示
    chart.setOption({
      title: {
        text: '数据加载失败',
        subtext: '请稍后重试',
      },
    });
  }
}

/**
 * 模拟获取数据的函数
 * 实际项目中替换为真实的 API 调用
 */
async function fetchChartData(): Promise<{
  categories: string[];
  sales: number[];
  profits: number[];
}> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 返回模拟数据
  return {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    sales: [120, 135, 148, 152, 168, 175],
    profits: [30, 35, 40, 42, 48, 52],
  };
}

/**
 * 方式二：使用 Loading 动画
 */
function initChartWithLoading(): void {
  const chartContainer = document.getElementById('chart');
  if (!chartContainer) return;

  const chart = echarts.init(chartContainer);

  // 显示 loading 动画
  chart.showLoading({
    text: '拼命加载中...',
    color: '#5470C6',
    textColor: '#333',
    maskColor: 'rgba(255, 255, 255, 0.8)',
    zlevel: 0,
  });

  // 异步获取数据
  fetchChartData()
    .then(data => {
      // 隐藏 loading
      chart.hideLoading();

      // 设置图表配置
      chart.setOption({
        title: {
          text: '销售数据报表',
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['销售额', '利润'],
          bottom: 0,
        },
        xAxis: {
          type: 'category',
          data: data.categories,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '销售额',
            type: 'bar',
            data: data.sales,
          },
          {
            name: '利润',
            type: 'line',
            data: data.profits,
          },
        ],
      });
    })
    .catch(() => {
      chart.hideLoading();
      chart.setOption({
        title: {
          text: '加载失败',
        },
      });
    });
}

/**
 * 方式三：懒加载（首次可见时才加载）
 */
class LazyChartLoader {
  private chart: echarts.ECharts | null = null;
  private container: HTMLElement | null = null;
  private observer: IntersectionObserver | null = null;
  private hasLoaded: boolean = false;
  private pendingOption: echarts.EChartsCoreOption | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`找不到容器: ${containerId}`);
    }
    this.container = container;
    this.initObserver();
  }

  /**
   * 初始化 Intersection Observer
   * 用于检测元素是否进入可视区域
   */
  private initObserver(): void {
    if (!this.container) return;

    // 创建观察器
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // 当容器进入可视区域时加载图表
          if (entry.isIntersecting && !this.hasLoaded) {
            this.loadChart();
          }
        });
      },
      {
        root: null, // 使用视口作为根
        rootMargin: '0px',
        threshold: 0.1, // 10% 可见时触发
      }
    );

    // 开始观察
    this.observer.observe(this.container);
  }

  /**
   * 加载图表
   */
  private async loadChart(): Promise<void> {
    if (this.hasLoaded || !this.container) return;

    // 标记为已加载
    this.hasLoaded = true;

    // 初始化 ECharts 实例
    this.chart = echarts.init(this.container);

    // 显示 loading
    this.chart.showLoading();

    try {
      // 获取数据
      const data = await fetchChartData();

      // 合并配置并渲染
      const option: echarts.EChartsCoreOption = {
        title: {
          text: '懒加载图表',
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['销售额', '利润'],
          bottom: 0,
        },
        xAxis: {
          type: 'category',
          data: data.categories,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '销售额',
            type: 'bar',
            data: data.sales,
          },
          {
            name: '利润',
            type: 'line',
            data: data.profits,
          },
        ],
      };

      this.chart.setOption(option);

      // 如果之前有 pending 的更新，立即应用
      if (this.pendingOption) {
        this.chart.setOption(this.pendingOption);
        this.pendingOption = null;
      }
    } catch (error) {
      console.error('加载图表数据失败:', error);
      this.chart.setOption({
        title: {
          text: '数据加载失败',
        },
      });
    } finally {
      this.chart.hideLoading();
    }
  }

  /**
   * 更新图表配置（如果图表还未加载，先缓存）
   */
  updateOption(option: echarts.EChartsCoreOption): void {
    if (this.chart) {
      this.chart.setOption(option);
    } else {
      this.pendingOption = option;
    }
  }

  /**
   * 销毁图表
   */
  dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }
}

/**
 * 方式四：增量更新数据
 */
function incrementalUpdate(): void {
  const chartContainer = document.getElementById('chart');
  if (!chartContainer) return;

  const chart = echarts.init(chartContainer);

  // 初始配置
  chart.setOption({
    title: {
      text: '实时数据监控',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: [],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '实时数据',
        type: 'line',
        data: [],
        areaStyle: {},
      },
    ],
  });

  // 模拟实时数据更新
  let timeLabels: string[] = [];
  let dataValues: number[] = [];
  let index = 0;

  const updateInterval = setInterval(() => {
    // 模拟实时数据
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const value = Math.random() * 100;

    // 添加新数据
    timeLabels.push(timeLabel);
    dataValues.push(value);

    // 保持最近 20 个数据点
    if (timeLabels.length > 20) {
      timeLabels = timeLabels.slice(-20);
      dataValues = dataValues.slice(-20);
    }

    index++;

    // 增量更新数据
    // 使用 appendData 进行高效的数据追加
    chart.setOption({
      xAxis: {
        data: timeLabels,
      },
      series: [
        {
          data: dataValues,
        },
      ],
    });

    // 模拟 30 秒后停止
    if (index > 60) {
      clearInterval(updateInterval);
    }
  }, 500);
}
```

### 4.2 数据动态更新动画

```typescript
/**
 * 数据更新动画配置
 */

const animatedUpdateOption: echarts.EChartsCoreOption = {
  title: {
    text: '动态数据更新',
  },

  tooltip: {
    trigger: 'axis',
  },

  xAxis: {
    type: 'category',
    data: ['A', 'B', 'C', 'D', 'E'],
  },

  yAxis: {
    type: 'value',
  },

  series: [
    {
      name: '数据',
      type: 'bar',
      data: [10, 20, 30, 40, 50],

      // 柱状图动画配置
      animationDuration: 1000,        // 动画时长（毫秒）
      animationEasing: 'elasticOut',  // 缓动函数：'linear', 'quadraticIn', 'cubicIn', ...,
      animationDelay: (idx: number) => idx * 100, // 每个柱子的动画延迟

      // 动画更新配置
      animationDurationUpdate: 500,   // 数据更新时的动画时长
      animationEasingUpdate: 'cubicOut', // 数据更新时的缓动函数

      // 大数字动画
      animationThreshold: 100, // 超过此数据量会关闭动画

      // 标签动画
      label: {
        show: true,
        position: 'top',
        animationDuration: 1000,
        animationDelay: (idx: number) => idx * 100,
      },
    },

    {
      name: '折线',
      type: 'line',
      data: [15, 25, 35, 45, 55],

      // 线条动画
      animationDuration: 1500,
      animationEasing: 'bounceOut',

      // 数据点动画
      symbolSize: 10,
      itemStyle: {
        color: '#5470C6',
      },

      // 平滑动画效果
      smooth: true,

      // 面积填充动画
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(84, 112, 198, 0.5)' },
          { offset: 1, color: 'rgba(84, 112, 198, 0.1)' },
        ]),
      },
    },
  ],
};
```

## 五、地图绘制

ECharts 支持地图可视化，可以展示地理区域的数据分布。

### 5.1 中国地图

```typescript
/**
 * 中国地图配置示例
 */

// 首先需要注册地图数据
// 地图数据可以从 https://echarts.apache.org/zh/download-map.html 下载
// 或者使用 npm 包 echarts/map/js/china.js

// 注册中国地图（需要在初始化图表之前）
// echarts.registerMap('china', chinaMapData);

// 中国地图配置
const chinaMapOption: echarts.EChartsCoreOption = {
  title: {
    text: '全国销售分布',
    subtext: '各省销售额（万元）',
    left: 'center',
  },

  tooltip: {
    trigger: 'item',
    formatter: (params: { name: string; value: number }) =>
      `${params.name}<br/>销售额: ${params.value || 0} 万元`,
  },

  // 视觉映射组件
  visualMap: {
    min: 0,
    max: 2000,
    left: 'left',
    top: 'bottom',
    text: ['高', '低'],
    calculable: true,
    inRange: {
      color: ['#lightskyblue', '#FEE090', '#Fdae61', '#F46D43', '#D73027', '#A50026'],
    },
  },

  // 地理坐标系
  geo: {
    map: 'china',
    roam: true, // 是否开启鼠标缩放和平移漫游
    zoom: 1.2,   // 当前缩放级别
    center: [105, 36], // 中心点经纬度
    label: {
      show: false, // 是否显示省份名称
    },
    itemStyle: {
      areaColor: '#E8F4F8', // 各省背景色
      borderColor: '#fff',  // 边界颜色
      borderWidth: 1,
    },
    emphasis: {
      label: {
        show: true,
        color: '#333',
      },
      itemStyle: {
        areaColor: '#B8D4E8',
      },
    },
    select: {
      // 选中状态
      disabled: false,
      itemStyle: {
        areaColor: '#5470C6',
      },
    },
  },

  series: [
    {
      name: '销售额',
      type: 'map',
      geoIndex: 0, // 引用 geo 配置
      data: [
        { name: '北京', value: 1800 },
        { name: '上海', value: 1650 },
        { name: '广东', value: 1500 },
        { name: '江苏', value: 1200 },
        { name: '浙江', value: 1100 },
        { name: '山东', value: 950 },
        { name: '四川', value: 850 },
        { name: '河南', value: 800 },
        { name: '湖北', value: 750 },
        { name: '湖南', value: 700 },
        { name: '河北', value: 680 },
        { name: '福建', value: 650 },
        { name: '安徽', value: 600 },
        { name: '陕西', value: 550 },
        { name: '辽宁', value: 520 },
        { name: '江西', value: 480 },
        { name: '重庆', value: 450 },
        { name: '云南', value: 420 },
        { name: '广西', value: 400 },
        { name: '山西', value: 380 },
        { name: '贵州', value: 350 },
        { name: '吉林', value: 320 },
        { name: '黑龙江', value: 300 },
        { name: '内蒙古', value: 280 },
        { name: '新疆', value: 250 },
        { name: '甘肃', value: 220 },
        { name: '海南', value: 180 },
        { name: '宁夏', value: 150 },
        { name: '青海', value: 120 },
        { name: '西藏', value: 80 },
        { name: '天津', value: 650 },
      ],
    },
  ],
};

/**
 * 地图与散点图结合
 */
const mapWithScatterOption: echarts.EChartsCoreOption = {
  title: {
    text: '全国主要城市销售网络',
  },

  tooltip: {
    trigger: 'item',
  },

  geo: {
    map: 'china',
    roam: true,
    label: {
      show: false,
    },
    itemStyle: {
      areaColor: '#E8F4F8',
      borderColor: '#fff',
      borderWidth: 1,
    },
    emphasis: {
      label: {
        show: true,
      },
      itemStyle: {
        areaColor: '#B8D4E8',
      },
    },
  },

  series: [
    // 地图系列
    {
      name: '区域销售',
      type: 'map',
      geoIndex: 0,
      data: [
        { name: '北京', value: 1800 },
        { name: '上海', value: 1650 },
        { name: '广东', value: 1500 },
        // ... 其他省份
      ],
    },

    // 散点系列（涟漪效果）
    {
      name: '销售网点',
      type: 'effectScatter',
      coordinateSystem: 'geo', // 使用地理坐标系
      data: [
        { name: '北京', value: [116.46, 39.92, 1800] },
        { name: '上海', value: [121.48, 31.22, 1650] },
        { name: '广州', value: [113.23, 23.16, 1500] },
        { name: '深圳', value: [114.07, 22.62, 1200] },
        { name: '成都', value: [104.06, 30.67, 850] },
        { name: '西安', value: [108.95, 34.27, 550] },
        { name: '杭州', value: [120.19, 30.26, 1100] },
        { name: '南京', value: [118.78, 32.04, 900] },
        { name: '武汉', value: [114.31, 30.52, 750] },
        { name: '重庆', value: [106.55, 29.56, 450] },
      ],
      symbolSize: (val: number[]) => {
        // 根据值大小确定散点大小
        return Math.sqrt(val[2]) / 10;
      },
      showEffectOn: 'render', // 始终显示涟漪效果
      rippleEffect: {
        brushType: 'stroke',
        scale: 3,
      },
      label: {
        show: true,
        position: 'right',
        formatter: (params: { name: string }) => params.name,
      },
      itemStyle: {
        color: '#EE6666',
      },
      emphasis: {
        label: {
          show: true,
        },
      },
    },

    // 航线系列
    {
      name: '销售路线',
      type: 'lines',
      coordinateSystem: 'geo',
      zlevel: 2,
      large: true, // 优化大数据量绘制
      effect: {
        show: true,
        period: 6,    // 特效动画周期（秒）
        trailLength: 0.4, // 特效尾迹长度
        symbol: 'arrow',
        symbolSize: 5,
      },
      lineStyle: {
        color: '#5470C6',
        width: 2,
        opacity: 0.6,
        curveness: 0.2, // 曲率
      },
      data: [
        // 从总部到各分支机构的路线
        {
          coords: [
            [116.46, 39.92], // 北京
            [121.48, 31.22], // 上海
          ],
        },
        {
          coords: [
            [116.46, 39.92],
            [113.23, 23.16], // 广州
          ],
        },
        {
          coords: [
            [116.46, 39.92],
            [104.06, 30.67], // 成都
          ],
        },
      ],
    },
  ],
};
```

## 六、主题定制

ECharts 支持自定义主题，可以预设颜色、字体、样式等。

### 6.1 内置主题

ECharts 提供了几种内置主题：

```typescript
/**
 * ECharts 内置主题
 *
 * 'light' - 浅色主题（默认）
 * 'dark' - 深色主题
 * 'vintage' - 复古主题
 * 'wonderland' - 仙境主题
 * 'walden' - 瓦尔登主题
 * 'chalk' - 粉笔主题
 * 'infographic' - 信息图主题
 * 'macarons' - 马卡龙主题
 * 'roma' - 罗马主题
 * 'shine' - 发光主题
 * 'purple-passion' - 紫罗兰主题
 */

// 使用内置主题
const chart = echarts.init(dom, 'dark');

// 或者使用 JS 主题文件
// import 'echarts/theme/dark';
// const chart = echarts.init(dom, 'dark');
```

### 6.2 自定义主题

```typescript
/**
 * 自定义主题配置
 */

// 方式一：使用主题编辑器生成主题配置
// 访问 https://echarts.apache.org/zh/theme-builder.html 在线编辑

// 方式二：编程方式创建主题
const customTheme = {
  // 主题名称
  name: 'customTheme',

  // 颜色主题
  color: [
    '#5470C6', // 主色
    '#91CC75', // 辅色1
    '#FAC858', // 辅色2
    '#EE6666', // 辅色3
    '#73C0DE', // 辅色4
    '#3BA272', // 辅色5
    '#FC8452', // 辅色6
    '#9A60B4', // 辅色7
    '#EA7CCC', // 辅色8
  ],

  // 背景色
  backgroundColor: 'rgba(0, 0, 0, 0)',

  // 文字样式
  textStyle: {
    fontFamily: 'Microsoft YaHei, Arial, sans-serif',
    fontSize: 12,
    color: '#333',
  },

  // 标题组件
  title: {
    textStyle: {
      color: '#333',
      fontSize: 18,
      fontWeight: 'bold',
    },
    subtextStyle: {
      color: '#666',
      fontSize: 12,
    },
  },

  // 图例组件
  legend: {
    textStyle: {
      color: '#666',
    },
  },

  // 提示框组件
  tooltip: {
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderColor: '#333',
    textStyle: {
      color: '#fff',
    },
  },

  // 区域缩放组件
  dataZoom: {
    backgroundColor: '#f8f8f8',
    dataBackgroundColor: '#ddd',
    fillerColor: 'rgba(84, 112, 198, 0.2)',
    handleColor: '#5470C6',
    textStyle: {
      color: '#333',
    },
  },

  // 视觉映射组件
  visualMap: {
    textStyle: {
      color: '#333',
    },
  },

  // 工具栏组件
  toolbox: {
    iconStyle: {
      borderColor: '#666',
    },
    emphasis: {
      iconStyle: {
        borderColor: '#333',
      },
    },
  },

  // 标注
  markPoint: {
    label: {
      color: '#fff',
    },
    emphasis: {
      label: {
        color: '#fff',
      },
    },
  },
};

// 注册主题
echarts.registerTheme('customTheme', customTheme);

// 使用自定义主题
const chart = echarts.init(dom, 'customTheme');

/**
 * 大屏/数据看板主题示例
 * 针对数据大屏场景优化的深色主题
 */
const dashboardTheme = {
  name: 'dashboard',
  color: [
    '#00BFFF', // 蓝色
    '#00FF7F', // 绿色
    '#FFD700', // 金色
    '#FF6347', // 红色
    '#9370DB', // 紫色
    '#00CED1', // 青色
    '#FF69B4', // 粉色
    '#F0E68C', // 卡其色
  ],

  backgroundColor: '#0a1929', // 深蓝色背景

  textStyle: {
    fontFamily: 'Microsoft YaHei, Arial, sans-serif',
    fontSize: 14,
    color: '#B8C5D6',
  },

  title: {
    textStyle: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtextStyle: {
      color: '#7B9BBF',
      fontSize: 14,
    },
  },

  legend: {
    textStyle: {
      color: '#B8C5D6',
    },
  },

  tooltip: {
    backgroundColor: 'rgba(0, 20, 40, 0.9)',
    borderColor: '#00BFFF',
    textStyle: {
      color: '#ffffff',
    },
  },

  grid: {
    borderColor: '#1E3A5F',
  },

  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
    axisLabel: {
      color: '#7B9BBF',
    },
    splitLine: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
  },

  valueAxis: {
    axisLine: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
    axisLabel: {
      color: '#7B9BBF',
    },
    splitLine: {
      lineStyle: {
        color: '#1E3A5F',
      },
    },
  },

  // 数字显示（用于大屏 KPI 数字）
  graphic: {
    textStyle: {
      color: '#00BFFF',
    },
  },
};

echarts.registerTheme('dashboard', dashboardTheme);
```

## 七、性能优化

### 7.1 首屏性能优化

```typescript
/**
 * ECharts 首屏性能优化策略
 *
 * 1. 使用按需引入，减少包体积
 * 2. 延迟加载图表（懒加载）
 * 3. 减少初始数据量
 * 4. 使用 canvas 渲染器（性能更好）
 * 5. 关闭不必要的动画
 * 6. 使用 dataZoom 限制数据范围
 */

// 按需引入 ECharts 核心和需要的组件
// 这样可以大幅减少打包体积

import * as echarts from 'echarts/core';

// 引入需要的图表类型
import { BarChart, LineChart, PieChart, MapChart, ScatterChart, RadarChart } from 'echarts/charts';

// 引入需要的组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  GeoComponent,
} from 'echarts/components';

// 引入渲染器（canvas 或 svg）
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  ScatterChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  GeoComponent,
  CanvasRenderer,
]);

// 注册地图数据（按需引入）
// import chinaMapData from 'echarts/map/json/china.json';
// echarts.registerMap('china', chinaMapData);

/**
 * 性能优化配置示例
 */
const optimizedOption: echarts.EChartsCoreOption = {
  // 关闭不必要的动画
  animation: true, // 对于大屏场景，可以直接关闭
  animationThreshold: 2000, // 超过 2000 个数据点关闭动画

  // 性能相关配置
  progressive: 400,     // 启用渐进式渲染，一次渲染 400 个数据点
  progressiveThreshold: 3000, // 超过 3000 个数据点时启用

  // large 模式优化大数据量绘制
  series: [
    {
      type: 'scatter',
      large: true, // 大数据量模式
      largeThreshold: 1000, // 超过 1000 个点启用 large 模式

      // 对于折线图
      type: 'line',
      large: true,
      largeThreshold: 2000,

      // 采样配置
      sampling: 'lttb', // 最大值保持法采样，'lttb' | 'average' | 'max' | 'min' | 'sum'
    },
  ],
};

/**
 * 大屏首屏优化完整示例
 */
class OptimizedDashboardChart {
  private chart: echarts.ECharts | null = null;
  private container: HTMLElement | null = null;
  private option: echarts.EChartsCoreOption;
  private initialized: boolean = false;

  constructor(containerId: string, option: echarts.EChartsCoreOption) {
    this.container = document.getElementById(containerId);
    this.option = this.optimizeOption(option);
  }

  /**
   * 优化配置
   */
  private optimizeOption(option: echarts.EChartsCoreOption): echarts.EChartsCoreOption {
    return {
      ...option,

      // 关闭动画（数据大屏通常不需要动画）
      animation: false,

      // 设置渲染方式
      renderer: 'canvas',

      // 优化 prompt
      tooltip: {
        ...(option.tooltip as object || {}),
        appendToBody: true, // 添加到 body 避免层级问题
      },
    };
  }

  /**
   * 初始化图表（首次可见时）
   */
  init(): void {
    if (this.initialized || !this.container) return;

    this.chart = echarts.init(this.container, undefined, {
      renderer: 'canvas',
      width: 'auto',
      height: 'auto',
    });

    this.chart.setOption(this.option);
    this.initialized = true;

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * 窗口大小变化处理（防抖）
   */
  private handleResize = (): void => {
    if (!this.chart) return;

    let resizeTimer: number | null = null;
    if (resizeTimer) clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      this.chart?.resize();
    }, 100);
  };

  /**
   * 更新数据
   */
  updateData(data: unknown[]): void {
    if (!this.chart) return;

    // 只更新 series 的数据，不重新创建整个图表
    this.chart.setOption({
      series: [
        {
          data,
        },
      ],
    });
  }

  /**
   * 销毁图表
   */
  dispose(): void {
    window.removeEventListener('resize', this.handleResize);

    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }
}
```

### 7.2 运行时性能优化

```typescript
/**
 * 运行时性能优化技巧
 */

/**
 * 技巧一：使用 setOption 的第二个参数控制是否合并
 *
 * notMerge: true - 不合并，完全替换之前的配置
 * notMerge: false（默认）- 合并到现有配置中
 */

// 推荐：使用 notMerge: false（默认合并）只更新变化的部分
chart.setOption({
  series: [{ data: newData }],
});

// 不推荐：每次都完全替换（会导致完全重绘）
chart.setOption({
  // ... 完整配置
}, { notMerge: true });


/**
 * 技巧二：使用 appendData 追加数据（用于实时数据流）
 */
chart.setOption({
  series: [{
    type: 'line',
    data: [],
  }],
});

// 后续数据使用 appendData 追加（更高效）
chart.appendData({
  seriesIndex: 0,
  data: [1, 2, 3],
});


/**
 * 技巧三：使用 dispose 及时销毁不需要的图表
 */
if (someCondition) {
  // 销毁旧图表
  chart.dispose();

  // 创建新图表
  chart = echarts.init(container);
  chart.setOption(newOption);
}


/**
 * 技巧四：减少 tooltip 和 legend 的 trigger
 *
 * tooltip: { trigger: 'axis' } 比 trigger: 'item' 性能更好
 * 因为 axis 模式下所有数据点共享一个 tooltip DOM
 */


/**
 * 技巧五：对于地图、关系图等，使用 webgl 渲染器
 */
const chart = echarts.init(container, undefined, {
  renderer: 'webgl', // 使用 WebGL 渲染器，性能更高
});


/**
 * 技巧六：合理使用数据采样
 */
const sampledOption: echarts.EChartsCoreOption = {
  series: [{
    type: 'line',
    // 当数据点超过 5000 时启用采样
    sampling: 'lttb', // Largest-Triangle-Three-Buckets 算法
    data: hugeDataArray, // 假设有 100000 个数据点
  }],
};


/**
 * 技巧七：使用 Progressive 渐进式渲染
 */
const progressiveOption: echarts.EChartsCoreOption = {
  // 启用渐进式渲染
  progressive: 200, // 每次渲染 200 个数据点
  // 超过 10000 个数据点时启用渐进式渲染
  progressiveThreshold: 10000,
};
```

## 八、实战案例

### 8.1 数据大屏模板

```typescript
/**
 * 数据大屏完整示例
 */

function createDashboard(): void {
  const dashboardContainer = document.getElementById('dashboard');
  if (!dashboardContainer) return;

  // 使用大屏主题
  const chart = echarts.init(dashboardContainer, 'dashboard');

  // 大屏配置
  const option: echarts.EChartsCoreOption = {
    // 背景色
    backgroundColor: '#0a1929',

    // 标题
    title: {
      text: '智慧运营中心',
      subtext: '实时数据监控',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Microsoft YaHei',
      },
      subtextStyle: {
        color: '#7B9BBF',
        fontSize: 16,
      },
    },

    // 提示框
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 20, 40, 0.9)',
      borderColor: '#00BFFF',
      textStyle: {
        color: '#fff',
      },
    },

    // 图例
    legend: {
      data: ['销售额', '订单量', '访客数'],
      bottom: 20,
      textStyle: {
        color: '#B8C5D6',
      },
    },

    // 网格
    grid: [
      {
        left: '5%',
        top: '15%',
        width: '40%',
        height: '35%',
      },
      {
        right: '5%',
        top: '15%',
        width: '40%',
        height: '35%',
      },
      {
        left: '5%',
        top: '55%',
        width: '25%',
        height: '35%',
      },
      {
        left: '37%',
        top: '55%',
        width: '25%',
        height: '35%',
      },
      {
        right: '5%',
        top: '55%',
        width: '25%',
        height: '35%',
      },
    ],

    // X 轴
    xAxis: [
      {
        type: 'category',
        gridIndex: 0,
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#7B9BBF' },
      },
      {
        type: 'category',
        gridIndex: 1,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#7B9BBF' },
      },
    ],

    // Y 轴
    yAxis: [
      {
        type: 'value',
        gridIndex: 0,
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#7B9BBF' },
        splitLine: { lineStyle: { color: '#1E3A5F' } },
      },
      {
        type: 'value',
        gridIndex: 1,
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#7B9BBF' },
        splitLine: { lineStyle: { color: '#1E3A5F' } },
      },
    ],

    // 系列
    series: [
      // 销售额趋势（折线图）
      {
        name: '销售额',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: [820, 932, 901, 1034, 1290, 1330],
        smooth: true,
        lineStyle: {
          color: '#00BFFF',
          width: 3,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 191, 255, 0.5)' },
            { offset: 1, color: 'rgba(0, 191, 255, 0.1)' },
          ]),
        },
        itemStyle: {
          color: '#00BFFF',
        },
      },

      // 订单量趋势（柱状图）
      {
        name: '订单量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: [120, 200, 150, 80, 70, 110, 130],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00FF7F' },
            { offset: 1, color: '#00BFFF' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },

      // 环形饼图
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#B8C5D6',
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: '#7B9BBF',
          },
        },
        data: [
          { value: 335, name: '直接访问' },
          { value: 310, name: '邮件营销' },
          { value: 234, name: '联盟广告' },
          { value: 135, name: '视频广告' },
          { value: 1548, name: '搜索引擎' },
        ],
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },

      // 雷达图
      {
        type: 'radar',
        center: ['50%', '50%'],
        radius: '60%',
        indicator: [
          { name: '销售', max: 100 },
          { name: '服务', max: 100 },
          { name: '质量', max: 100 },
          { name: '物流', max: 100 },
          { name: '售后', max: 100 },
        ],
        data: [
          {
            value: [85, 90, 78, 92, 88],
            name: '综合评分',
            areaStyle: {
              color: 'rgba(0, 255, 127, 0.3)',
            },
            lineStyle: {
              color: '#00FF7F',
            },
            itemStyle: {
              color: '#00FF7F',
            },
          },
        ],
      },

      // 仪表盘
      {
        type: 'gauge',
        center: ['50%', '50%'],
        radius: '60%',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [0.3, '#00FF7F'],
              [0.7, '#00BFFF'],
              [1, '#FF6347'],
            ],
          },
        },
        detail: {
          formatter: '{value}%',
          color: '#fff',
          fontSize: 24,
        },
        data: [{ value: 78, name: '完成率' }],
      },
    ],
  };

  chart.setOption(option);

  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    chart.resize();
  });
}
```

## 九、总结

本章详细介绍了 ECharts 数据可视化的使用方法，主要涵盖以下内容：

### 9.1 核心概念

- **实例（Instance）**：通过 `echarts.init()` 创建的图表实例
- **选项（Option）**：包含图表所有配置的对象
- **组件（Component）**：如图例、坐标轴、提示框等
- **系列（Series）**：实际展示的数据系列

### 9.2 常用图表类型

- **折线图**：展示数据趋势
- **柱状图**：展示数据比较
- **饼图**：展示比例关系
- **散点图**：展示变量关系
- **雷达图**：展示多维数据
- **仪表盘**：展示单个指标
- **地图**：展示地理分布

### 9.3 进阶功能

- **数据集（Dataset）**：数据与配置分离
- **异步加载**：从服务器获取数据
- **数据转换**：过滤、聚合等操作
- **主题定制**：创建自定义主题
- **地图绘制**：支持中国地图和世界地图

### 9.4 性能优化

- 按需引入，减少包体积
- 懒加载，首次可见时渲染
- 使用 `notMerge` 控制配置合并
- 大数据量使用 `large` 模式
- 合理使用采样和渐进式渲染
- 及时销毁不需要的图表实例

通过本章的学习，你应该能够熟练使用 ECharts 创建各种类型的数据可视化图表，并能够根据实际需求进行性能优化和主题定制。在实际项目中，建议根据数据特点和使用场景选择合适的图表类型，并注意保持图表的简洁性和可读性。
