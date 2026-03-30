# 第1卷-基础核心

## 第1章 HTML与CSS

### 1.1 CSS 选择器优先级与计算规则

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    CSS 选择器优先级权重                          ┃
┃  !important    ━━━━▶  无穷大（最高优先级）                       ┃
┃  内联样式      ━━━━▶  1000                                      ┃ 
┃  ID 选择器     ━━━━▶  100                                       ┃ 
┃  类/属性/伪类  ━━━━▶  10                                         ┃
┃  元素/伪元素   ━━━━▶  1                                          ┃
┃  通配符/组合   ━━━━▶  0                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**计算示例**：

```css
/* 优先级: 0-1-0-1 = 101 */
#nav .list-item { }

/* 优先级: 0-0-2-0 = 20 */
:hover .active { }

/* 优先级: 0-0-1-2 = 12 */
div ul li { }

/* 优先级: 0-1-0-1 = 101 */
#app .card:hover { }
```

**重要规则**：
- `!important` 优先级最高，慎用
- 相同优先级时，后定义的样式覆盖先定义的
- 组合选择器（逗号分隔）分别计算权重
- `:not()` 内部选择器参与权重计算
- `*` 通配符不增加权重

---

### 1.2 CSS 盒模型深度理解

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                        CSS 盒模型                                ┃
┃                                                                  ┃
┃    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           ┃  
┃    ┃                 margin (外边距)                 ┃           ┃
┃    ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃           ┃  
┃    ┃  ┃            border (边框)                  ┃  ┃           ┃
┃    ┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃  ┃           ┃  
┃    ┃  ┃  ┃         padding (内边距)           ┃  ┃  ┃           ┃ 
┃    ┃  ┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃  ┃  ┃           ┃    
┃    ┃  ┃  ┃  ┃                           ┃  ┃  ┃  ┃           ┃    
┃    ┃  ┃  ┃  ┃     content (内容区)       ┃  ┃  ┃  ┃           ┃   
┃    ┃  ┃  ┃  ┃                           ┃  ┃  ┃  ┃           ┃    
┃    ┃  ┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃  ┃  ┃           ┃    
┃    ┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃  ┃           ┃  
┃    ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃           ┃  
┃    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           ┃  
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**两种盒模型**：

| 盒模型 | 设置方式 | width 包含内容 |
| :--- | :--- | :--- |
| **content-box**（默认） | `box-sizing: content-box` | 仅内容区域 |
| **border-box** | `box-sizing: border-box` | content + padding + border |

**实际宽度计算**：
- `content-box`：`width` = 内容宽度，总宽度 = width + padding + border + margin
- `border-box`：`width` = 内容 + padding + border，总宽度 = width + margin

**建议**：全局使用 `box-sizing: border-box`，避免 padding/border 导致的布局问题。

---

### 1.3 BFC（块级格式化上下文）深度理解

**参考答案：**

**BFC 定义**：
BFC 是 CSS 渲染模型的一部分，是页面中一个独立的渲染区域，容器内的元素不会影响外部元素。

**触发 BFC 的方式**：
```css
/* 1. 根元素 */
html { }

/* 2. float 不为 none */
float: left | right;

/* 3. position 不为 static/relative */
position: absolute | fixed;

/* 4. display 为 inline-block、table-cell、flex、grid 等 */
display: inline-block | flex | grid | table-cell;

/* 5. overflow 不为 visible */
overflow: auto | hidden | scroll;

/* 6. fieldset 元素 */
```

**BFC 特性**：
1. 内部的 Box 垂直方向依次排列
2. Box 垂直方向的距离由 margin 决定，**同一 BFC 中相邻 Box 的 margin 会重叠**
3. BFC 区域不会与 float 元素重叠
4. 计算 BFC 高度时，浮动元素也参与计算

**应用场景**：

```css
/* 1. 清除浮动 */
.parent {
  overflow: hidden; /* 触发 BFC */
}

/* 2. 防止 margin 重叠 */
.box1, .box2 {
  margin-bottom: 20px;
}
.container {
  overflow: hidden; /* 创建独立 BFC，阻止 margin 重叠 */
}

/* 3. 自适应两栏布局 */
.left {
  float: left;
  width: 200px;
}
.right {
  overflow: hidden; /* 触发 BFC，不与 left 重叠 */
}
```

---

### 1.4 Flexbox 布局完全指南

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                      Flexbox 轴向系统                           ┃ 
┃                                                                  ┃
┃                    主轴 (Main Axis)                             ┃ 
┃                    ◀━━━━━━━━━━━━━━━━━▶                         ┃  
┃                                                                  ┃
┃   ┏━━━━━━━━━┓ ┏━━━━━━━━━┓ ┏━━━━━━━━━┓ ┏━━━━━━━━━┓             ┃   
┃   ┃  Item   ┃ ┃  Item   ┃ ┃  Item   ┃ ┃  Item   ┃             ┃   
┃   ┗━━━━━━━━━┛ ┗━━━━━━━━━┛ ┗━━━━━━━━━┛ ┗━━━━━━━━━┛             ┃   
┃                                                                  ┃
┃                    ┃                                            ┃ 
┃                    ┃ 交叉轴 (Cross Axis)                        ┃ 
┃                    ┃                                            ┃ 
┃                    ▼                                            ┃ 
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**容器属性**：

| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `display` | `flex` / `inline-flex` | 开启 Flex 布局 |
| `flex-direction` | `row` / `column` / `row-reverse` / `column-reverse` | 主轴方向 |
| `flex-wrap` | `nowrap` / `wrap` / `wrap-reverse` | 是否换行 |
| `justify-content` | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 主轴对齐 |
| `align-items` | `stretch` / `flex-start` / `flex-end` / `center` / `baseline` | 交叉轴对齐（单行） |
| `align-content` | `stretch` / `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 交叉轴对齐（多行） |
| `gap` | `10px` / `1rem` | 项目间距 |

**项目属性**：

| 属性 | 说明 |
| :--- | :--- |
| `flex-grow` | 放大比例，默认 0 |
| `flex-shrink` | 缩小比例，默认 1 |
| `flex-basis` | 基础宽度，auto |
| `flex` | 简写：`flex-grow flex-shrink flex-basis` |
| `align-self` | 覆盖容器的 align-items |
| `order` | 排列顺序，数值越小越靠前 |

**flex 速记**：
- `flex: 1` = `flex: 1 1 0%`（等分剩余空间）
- `flex: auto` = `flex: 1 1 auto`
- `flex: none` = `flex: 0 0 auto`
- `flex: 0 auto` = `flex: 0 1 auto`

---

### 1.5 Grid 布局完全指南

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                      Grid 网格系统                               ┃
┃                                                                  ┃
┃         ┏━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┓                         ┃ 
┃         ┃  Area 1 ┃  Area 2 ┃  Area 3 ┃  ← row 1                ┃ 
┃         ┃ (1,1)   ┃ (1,2)   ┃ (1,3)   ┃                         ┃ 
┃         ┣━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━┫                         ┃ 
┃         ┃  Area 4 ┃  Area 5 ┃  Area 6 ┃  ← row 2                ┃ 
┃         ┃ (2,1)   ┃ (2,2)   ┃ (2,3)   ┃                         ┃ 
┃         ┗━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┛                         ┃ 
┃            ↑          ↑          ↑                             ┃  
┃          col 1      col 2      col 3                            ┃ 
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**容器属性**：

```css
.container {
  /* 定义行列 */
  grid-template-columns: 100px 1fr 2fr;  /* 3 列：固定 + 自适应 + 2倍 */
  grid-template-rows: 50px auto 100px;  /* 3 行 */

  /* 命名区域 */
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";

  /* 简写 */
  gap: 20px;        /* grid-gap */
  row-gap: 10px;
  column-gap: 20px;

  /* 对齐 */
  justify-items: start | end | center | stretch;
  align-items: start | end | center | stretch;
  place-items: center center;  /* 简写 */

  /* 整网格对齐 */
  justify-content: start | end | center | stretch | space-between | space-around | space-evenly;
  align-content: start | end | center | stretch | space-between | space-around | space-evenly;
}
```

**项目属性**：

```css
.item {
  /* 定位 */
  grid-column: 1 / 3;    /* 跨 2 列 */
  grid-row: 1 / 2;       /* 跨 1 行 */
  grid-area: header;     /* 命名区域 */

  /* 简写 */
  grid-column: span 2;   /* 跨 2 列 */

  /* 对齐（覆盖容器） */
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
}
```

**fr 单位**：
- `1fr` = 1 份可用空间
- `repeat(3, 1fr)` = 3 等分
- `repeat(auto-fill, 100px)` = 自动填充列
- `minmax(100px, 1fr)` = 最小 100px，最大等分

---

### 1.6 层叠上下文（Stacking Context）深度理解

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    层叠顺序（从低到高）                          ┃
┃                                                                  ┃
┃  1. background / border        背景/边框（最低）                ┃ 
┃     (负 z-index)               负 z-index                       ┃ 
┃                                                                  ┃
┃  2. block boxes                块级盒子                          ┃
┃     float                      浮动元素                          ┃
┃     inline boxes               行内盒子                          ┃
┃                                                                  ┃
┃  3. z-index: 0                 z-index: 0 / auto                ┃ 
┃                                                                  ┃
┃  4. inline boxes               行内元素（含 inline-block）       ┃
┃                                                                  ┃
┃  5. position: fixed            固定定位                          ┃
┃                                                                  ┃
┃  6. z-index: auto / 1+         正 z-index（最高）               ┃ 
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**层叠上下文触发条件**：
1. 根元素 `<html>`
2. `position` 不为 `static` + `z-index` 不为 `auto`
3. `position: fixed`
4. `z-index` 不为 `auto` 的 flex 子项
5. `opacity` < 1
6. `transform` 不为 `none`
7. `filter` 不为 `none`
8. `isolation: isolate`
9. `will-change` 指定上述属性
10. `-webkit-overflow-scrolling: touch`

**重要特性**：
- 层叠上下文可以嵌套
- 子元素的层叠顺序相对于父元素
- 同一个层叠上下文内按层叠顺序比较
- 不同层叠上下文间无法通过 z-index 比较

---

### 1.7 清除浮动的方法

**参考答案：**

**问题**：浮动元素脱离文档流，导致父元素高度塌陷。

**解决方案**：

```css
/* 1. 父元素 overflow: hidden（触发 BFC） */
.parent {
  overflow: hidden;
}

/* 2. 父元素添加 ::after 伪元素 */
.parent::after {
  content: "";
  display: block;
  clear: both;
}

/* 3. 父元素添加额外空元素 */
<div class="parent">
  <div class="float-left"></div>
  <div class="float-right"></div>
  <div class="clear"></div>
</div>
.clear {
  clear: both;
}

/* 4. 父元素 float（不推荐） */
.parent {
  float: left;
}

/* 5. 父元素 display: flow-root（现代方案） */
.parent {
  display: flow-root;  /* 触发 BFC，无副作用 */
}
```

---

### 1.8 居中布局方案汇总

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                        各种居中方案                              ┃
┃                                                                  ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓          ┃  
┃   ┃                   水平居中                        ┃          ┃
┃   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫          ┃  
┃   ┃  1. margin: 0 auto;          (块级元素)          ┃          ┃ 
┃   ┃  2. text-align: center;      (行内/文字)        ┃          ┃  
┃   ┃  3. flex: justify-content: center;              ┃          ┃  
┃   ┃  4. grid: place-items: center;                  ┃          ┃  
┃   ┃  5. absolute + transform                         ┃          ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛          ┃  
┃                                                                  ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓          ┃  
┃   ┃                   垂直居中                        ┃          ┃
┃   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫          ┃  
┃   ┃  1. line-height = height     (单行文字)          ┃          ┃ 
┃   ┃  2. flex: align-items: center;                  ┃          ┃  
┃   ┃  3. grid: place-items: center;                  ┃          ┃  
┃   ┃  4. absolute + transform                         ┃          ┃ 
┃   ┃  5. table-cell + vertical-align                 ┃          ┃  
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛          ┃  
┃                                                                  ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓          ┃  
┃   ┃                 完全居中 (水平和垂直)             ┃          ┃
┃   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫          ┃  
┃   ┃  1. flex + justify-content + align-items       ┃          ┃   
┃   ┃  2. grid + place-items: center                  ┃          ┃  
┃   ┃  3. absolute + transform (translate -50%)       ┃          ┃  
┃   ┃  4. absolute + margin: auto                      ┃          ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛          ┃  
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**代码示例**：

```css
/* Flex 方案（推荐） */
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Grid 方案（最简） */
.parent {
  display: grid;
  place-items: center;
}

/* Absolute + Transform（已知宽高） */
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Absolute + Margin（已知宽高） */
.child {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
}
```

---

### 1.9 重绘（Repaint）与重排（Reflow）

**参考答案：**

| 概念 | 定义 | 触发条件 |
| :--- | :--- | :--- |
| **重排（Reflow）** | 重新计算元素的几何属性（位置、尺寸） | 页面布局变化 |
| **重绘（Repaint）** | 重新绘制元素的外观（颜色、背景） | 外观变化但布局不变 |

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    重排 vs 重绘                                 ┃ 
┃                                                                  ┃
┃  重排（Reflow） ━━┳━━ 几何属性变化                               ┃
┃     (严重)        ┣━━ 盒子模型变化                               ┃
┃                   ┣━━ 增删 DOM 节点                              ┃
┃                   ┣━━ 元素尺寸/位置变化                          ┃
┃                   ┗━━ font-size, padding, margin, width...      ┃ 
┃                                                                  ┃
┃  重绘（Repaint） ━━┳━━ 外观变化                                  ┃
┃     (较轻)        ┣━━ 颜色/背景变化                              ┃
┃                   ┣━━ visibility, outline, border-color...     ┃  
┃                   ┗━━ 不影响布局的属性                          ┃ 
┃                                                                  ┃
┃  优化 ━━━━━━━━━━►  使用 transform, opacity（触发合成）          ┃ 
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**避免重排的方法**：

```javascript
// 不好：每次循环都触发重排
for (let i = 0; i < 100; i++) {
  element.style.top = i + 'px';  // 触发重排
}

// 更好：使用 transform
element.style.transform = `translateY(${i * 100}px)`;  // 触发合成

// 更好：缓存布局信息
const width = element.offsetWidth;  // 缓存
element.style.width = width + 'px';
```

---

### 1.10 CSS 动画与性能优化

**参考答案：**

**动画性能黄金法则**：
- 动画属性分为三档：**合成器线程** > 布局 > 绘制

| 动画属性 | 线程 | 性能 |
| :--- | :--- | :--- |
| `transform` | 合成器 | 最佳 |
| `opacity` | 合成器 | 最佳 |
| `filter` | 合成器 | 良好 |
| `will-change` | 提示合成 | 优化 |
| `width`, `height` | 布局 | 较差 |
| `background-color` | 绘制 | 一般 |
| `color` | 绘制 | 一般 |

**最佳实践**：

```css
/* 使用 transform 和 opacity */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* 避免使用动画属性 */
.element {
  width: 100px;      /* 触发重排 */
  left: 100px;       /* 触发重排 */
  top: 100px;        /* 触发重排 */
  margin: 10px;      /* 触发重排 */
  padding: 10px;     /* 触发重排 */
  background: red;   /* 触发重绘 */
}
```

**will-change 优化**：

```css
.element {
  /* 提前告知浏览器即将变化 */
  will-change: transform, opacity;
}

/* 动画结束后移除，避免内存浪费 */
.element {
  will-change: auto;
}
```

---

### 1.11 CSS 渲染与合成层底层原理

**参考答案：**

#### 1.11.1 CSS 样式计算过程 (Style Calculation)

**选择器匹配过程**：
1. **遍历 DOM 树**：从根节点遍历每个元素
2. **收集适用规则**：为每个元素收集匹配的 CSS 规则
3. **计算优先级**：根据选择器类型计算特异性
4. **层叠处理**：应用层叠算法确定最终样式

```javascript
// 简化选择器匹配流程
function matchRule(element, rules) {
  const matchedRules = [];
  for (const rule of rules) {
    if (matchSelector(element, rule.selector)) {
      matchedRules.push(rule);
    }
  }
  return sortBySpecificity(matchedRules);
}
```

**优先级计算详细**：
- `id` 选择器：`#nav` = 100
- 类/属性/伪类：`.active` = 10
- 元素/伪元素：`div` = 1
- 通配符/组合符：`*`, `>`, `+`, `~` = 0

```css
/* 优先级: 0-1-1-1 = 111 */
ul li .item { color: blue; }

/* 优先级: 0-1-0-1 = 101 */
#nav .item { color: red; }  /* 胜出 */

/* !important 最高优先级 */
.item { color: green !important; }
```

**规则树 (Rule Tree) 缓存机制**：
- Blink/WebKit 使用**规则树**缓存选择器匹配结果
- 避免重复计算相同样式组合
- 样式共享：相同计算样式的元素共享同一样式对象

#### 1.11.2 渲染层 vs 图形层

**何时创建独立合成层**：
- 3D transform: `transform: translate3d(0,0,0)`
- video、canvas 元素
- 动画使用 `will-change`
- CSS 滤镜：`filter: blur(5px)`
- 节点具有 CSS 动画/过渡

```css
/* 创建合成层 */
.layer {
  transform: translateZ(0);
  will-change: transform;
}
```
