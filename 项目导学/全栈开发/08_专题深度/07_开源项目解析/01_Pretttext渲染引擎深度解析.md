# Pretext 渲染引擎深度解析

## 一、项目概述

### 1.1 项目定位

Pretext 是由 Chris оховатт (chenglou) 开发的一个高性能多行文本测量与布局库，其核心目标是**在不触碰 DOM 的情况下完成文本高度计算**，从而避免触发浏览器 layout reflow（布局重排），这是一项在 Web UI 优化中极其昂贵的操作。

**核心解决的问题：**

传统 DOM 测量方法（如 `getBoundingClientRect`、`offsetHeight`）会强制触发同步布局重排。当多个组件独立测量文本时，每次测量都会触发整个文档的重新布局，在 500 个文本块的场景下可能造成每帧 30ms+ 的性能损耗。

**Pretext 的解决方案：**

采用两阶段测量架构——`prepare()` 执行一次性文本分析和 Canvas 测量，`layout()` 仅通过纯算术运算计算行数和高度，完全绕过 DOM 操作。

### 1.2 项目基本信息

| 指标 | 数值 |
|------|------|
| GitHub Stars | 32,262 |
| Forks | 1,683 |
| 主要语言 | TypeScript (558KB) + HTML (63KB) |
| NPM 包 | @chenglou/pretext |
| 设计渊源 | Sebastian Markbage 的 text-layout |

### 1.3 核心 API 概览

```typescript
import { prepare, layout } from '@chenglou/pretext'

// 第一阶段：准备文本（一次性操作）
const prepared = prepare('AGI 春天到了. 시작했다', '16px Inter')

// 第二阶段：布局计算（热路径，纯算术）
const { height, lineCount } = layout(prepared, textWidth, 20)
```

**性能基准（500 文本批处理）：**

- `prepare()` 耗时约 19ms
- `layout()` 耗时约 0.09ms（仅 0.0002ms/文本）

---

## 二、架构设计深度解析

### 2.1 两阶段架构原理

Pretext 的核心架构遵循"预处理 + 热路径计算"的经典性能优化模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                         prepare() 阶段                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ 文本规范化    │→ │ 词元分割      │→ │ Canvas 宽度测量      │   │
│  │ (Whitespace) │  │ (Intl.Seg.)  │  │ (measureText)        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  输出：PreparedText（包含 widths[]、kinds[]、breakableWidths[]） │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         layout() 阶段                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 纯算术运算遍历 cached widths[]                            │   │
│  │ - 累加宽度判断换行位置                                     │   │
│  │ - 计算总行数和高度                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  输出：{ height: number, lineCount: number }                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责划分

| 模块 | 文件 | 职责 |
|------|------|------|
| **analysis.ts** | 文本分析层 | 规范化、分词、合并、国际化处理 |
| **measurement.ts** | 测量层 | Canvas 测量、字形分割、Emoji 校正 |
| **layout.ts** | 布局层 | 公共 API、内存布局、类型导出 |
| **line-break.ts** | 断行引擎 | 高效断行算法实现 |
| **bidi.ts** | 双向文本 | RTL 语言支持（阿拉伯文、希伯来文） |

---

## 三、文本分析层（analysis.ts）深度解析

### 3.1 文本规范化

```typescript
// 分析模块核心类型定义
export type SegmentBreakKind =
  | 'text'           // 普通文本
  | 'space'          // 可折叠空格
  | 'preserved-space' // 保留空格（pre-wrap 模式）
  | 'tab'            // 制表符
  | 'glue'           // 粘性字符（不换行空格）
  | 'zero-width-break' // 零宽断开
  | 'soft-hyphen'    // 软连字符
  | 'hard-break'     // 硬换行

export type MergedSegmentation = {
  len: number
  texts: string[]        // 文本片段数组
  isWordLike: boolean[]   // 是否为单词
  kinds: SegmentBreakKind[] // 断行类型
  starts: number[]        // 起始位置
}
```

**规范化策略：**

```typescript
// 普通模式：折叠多个空格/制表符/换行为单个空格
const collapsibleWhitespaceRunRe = /[ \t\n\r\f]+/g
const needsWhitespaceNormalizationRe = /[\t\n\r\f]| {2,}|^ | $/

export function normalizeWhitespaceNormal(text: string): string {
  if (!needsWhitespaceNormalizationRe.test(text)) return text

  let normalized = text.replace(collapsibleWhitespaceRunRe, ' ')
  // 去除首尾空格
  if (normalized.charCodeAt(0) === 0x20) {
    normalized = normalized.slice(1)
  }
  if (normalized.length > 0 && normalized.charCodeAt(normalized.length - 1) === 0x20) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}
```

### 3.2 词元分割（Segmentation）

Pretext 使用 `Intl.Segmenter` 进行智能分词，这是现代浏览器内置的国际化文本分割 API：

```typescript
let sharedWordSegmenter: Intl.Segmenter | null = null

function getSharedWordSegmenter(): Intl.Segmenter {
  if (sharedWordSegmenter === null) {
    // 使用 word 粒度分割，支持 CJK 字符
    sharedWordSegmenter = new Intl.Segmenter(segmenterLocale, { granularity: 'word' })
  }
  return sharedWordSegmenter
}

// 对每个词元进行字符类型分类
function splitSegmentByBreakKind(
  segment: string,
  isWordLike: boolean,
  start: number,
  whiteSpaceProfile: WhiteSpaceProfile,
): SegmentationPiece[] {
  // 将字符按断行类型分段
  // 例如 "hello," 会被分割为 "hello" (text) 和 "," (left-sticky-punctuation)
}
```

**关键设计决策：**

1. **CJK 字符处理**：中日韩字符按字分割，而非按词分割，以支持精确的换行位置控制
2. **标点合并**：将标点符号与前一个文本合并测量（如 "better." 作为整体），匹配 CSS 行为
3. **粘性标点**：识别左粘性标点（如 "("）和右粘性标点（如 "."），优化断行决策

### 3.3 国际化支持

```typescript
// CJK 字符 Unicode 范围检测
export function isCJK(s: string): boolean {
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    // CJK Unified Ideographs: 0x4E00 - 0x9FFF
    // CJK Extension A: 0x3400 - 0x4DBF
    // Hiragana: 0x3040 - 0x309F
    // Katakana: 0x30A0 - 0x30FF
    // Hangul: 0xAC00 - 0xD7AF
    if ((c >= 0x4E00 && c <= 0x9FFF) || ...) {
      return true
    }
  }
  return false
}

// 避头尾字符（Japanese Kinsoku）
export const kinsokuStart = new Set([
  '\uFF0C', // ，
  '\uFF0E', // ．
  '\u3001', // 、
  '\u3002', // 。
  // ... 更多字符
])

export const kinsokuEnd = new Set([
  '"', '(', '[', '{',
  '"', ''', '«', '‹',
  // ... 更多字符
])
```

**特殊规则处理：**

```typescript
// URL 合并：将 "https://" 和 "www." 开头的文本作为整体
function mergeUrlLikeRuns(segmentation: MergedSegmentation): MergedSegmentation {
  for (let i = 0; i < segmentation.len; i++) {
    if (kinds[i] !== 'text' || !isUrlLikeRunStart(segmentation, i)) continue
    // 合并 URL 相关片段
    const mergedParts = [texts[i]!]
    let j = i + 1
    while (j < segmentation.len && !isTextRunBoundary(kinds[j]!)) {
      mergedParts.push(texts[j]!)
      j++
    }
    texts[i] = joinTextParts(mergedParts)
  }
}

// 数字连字：合并 "2023-01-15" 为整体处理
function mergeNumericRuns(segmentation: MergedSegmentation): MergedSegmentation {
  // ...
}
```

---

## 四、测量层（measurement.ts）深度解析

### 4.1 Canvas 测量原理

```typescript
// 获取测量用的 Canvas 上下文
export function getMeasureContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  if (measureContext !== null) return measureContext

  // 优先使用 OffscreenCanvas（无头环境）
  if (typeof OffscreenCanvas !== 'undefined') {
    measureContext = new OffscreenCanvas(1, 1).getContext('2d')!
    return measureContext
  }

  // 回退到 DOM Canvas
  if (typeof document !== 'undefined') {
    measureContext = document.createElement('canvas').getContext('2d')!
    return measureContext
  }

  throw new Error('Text measurement requires OffscreenCanvas or a DOM canvas context.')
}
```

### 4.2 测量缓存机制

```typescript
// 多级缓存架构
const segmentMetricCaches = new Map<string, Map<string, SegmentMetrics>>()
//                    ↑ 按字体分组的缓存
//                         ↑ 按文本内容分组的指标

export function getSegmentMetrics(seg: string, cache: Map<string, SegmentMetrics>): SegmentMetrics {
  let metrics = cache.get(seg)
  if (metrics === undefined) {
    const ctx = getMeasureContext()
    metrics = {
      width: ctx.measureText(seg).width,  // Canvas 测量
      containsCJK: isCJK(seg),              // 缓存 CJK 标记
    }
    cache.set(seg, metrics)
  }
  return metrics
}
```

**缓存策略：**

1. **字体级别缓存**：不同字体独立缓存
2. **文本内容缓存**：相同文本不重复测量
3. **字形宽度缓存**：长单词的单个字形宽度预计算

### 4.3 Emoji 校正机制

```typescript
// 问题：Chrome/Firefox 的 Canvas 对 Emoji 的测量宽度比 DOM 大
// 解决方案：自动检测并校正

function getEmojiCorrection(font: string, fontSize: number): number {
  const ctx = getMeasureContext()
  ctx.font = font
  const canvasW = ctx.measureText('\u{1F600}').width  // Canvas 测量值

  if (canvasW > fontSize + 0.5 && typeof document !== 'undefined') {
    // DOM 实际渲染宽度
    const span = document.createElement('span')
    span.style.font = font
    span.style.display = 'inline-block'
    span.textContent = '\u{1F600}'
    document.body.appendChild(span)
    const domW = span.getBoundingClientRect().width
    document.body.removeChild(span)

    if (canvasW - domW > 0.5) {
      return canvasW - domW  // 校正值
    }
  }
  return 0
}

// 应用校正
export function getCorrectedSegmentWidth(
  seg: string,
  metrics: SegmentMetrics,
  emojiCorrection: number
): number {
  if (emojiCorrection === 0) return metrics.width
  return metrics.width - getEmojiCount(seg, metrics) * emojiCorrection
}
```

**设计亮点：**

- 仅在需要时执行一次 DOM 读取（按字体/字号）
- 自动检测 Safari（不需要校正）
- 校正值与字体无关（固定 inflation factor）

---

## 五、断行引擎（line-break.ts）深度解析

### 5.1 核心数据结构

```typescript
export type PreparedLineBreakData = {
  widths: number[]              // 每段的测量宽度
  lineEndFitAdvances: number[]  // 行尾fit宽度（空格为0）
  lineEndPaintAdvances: number[] // 行尾paint宽度
  kinds: SegmentBreakKind[]     // 断行类型
  simpleLineWalkFastPath: boolean // 是否启用快速路径
  breakableWidths: (number[] | null)[] // 可断点处的字形宽度
  breakablePrefixWidths: (number[] | null)[] // 字形前缀宽度
  discretionaryHyphenWidth: number // 软连字符宽度
  tabStopAdvance: number        // Tab 宽度
  chunks: PreparedLineChunk[]   // 硬断行分块
}

export type InternalLayoutLine = {
  startSegmentIndex: number      // 起始段索引
  startGraphemeIndex: number    // 起始字形索引
  endSegmentIndex: number        // 结束段索引
  endGraphemeIndex: number       // 结束字形索引
  width: number                  // 行宽度
}
```

### 5.2 断行决策规则

```typescript
// 判断某段之后是否可以断开
function canBreakAfter(kind: SegmentBreakKind): boolean {
  return (
    kind === 'space' ||
    kind === 'preserved-space' ||
    kind === 'tab' ||
    kind === 'zero-width-break' ||
    kind === 'soft-hyphen'
  )
}

// 获取 Tab 符的提前量
function getTabAdvance(lineWidth: number, tabStopAdvance: number): number {
  if (tabStopAdvance <= 0) return 0
  const remainder = lineWidth % tabStopAdvance
  if (Math.abs(remainder) <= 1e-6) return tabStopAdvance
  return tabStopAdvance - remainder
}
```

### 5.3 高效行数统计

这是 pretext 性能极致的关键——**纯算术运算**：

```typescript
// layout.ts 中的热路径实现
export function layout(prepared: PreparedText, maxWidth: number, lineHeight: number): LayoutResult {
  // 核心：纯算术运算，无 DOM 调用
  const lineCount = countPreparedLines(getInternalPrepared(prepared), maxWidth)
  return { lineCount, height: lineCount * lineHeight }
}

// line-break.ts 中的计数实现
export function countPreparedLines(
  prepared: PreparedLineBreakData,
  maxWidth: number
): number {
  if (prepared.widths.length === 0) return 0

  if (prepared.simpleLineWalkFastPath) {
    // 快速路径：无硬断行、无特殊断行需求
    return countPreparedLinesFast(prepared.widths, prepared.lineEndFitAdvances, maxWidth)
  }

  // 标准路径：处理复杂情况
  return countPreparedLinesGeneral(prepared, maxWidth)
}
```

**快速路径核心算法：**

```typescript
function countPreparedLinesFast(
  widths: number[],
  lineEndFitAdvances: number[],
  maxWidth: number
): number {
  let lineCount = 1
  let currentLineWidth = 0

  for (let i = 0; i < widths.length; i++) {
    const w = widths[i]!
    const fitAdvance = lineEndFitAdvances[i]!

    if (currentLineWidth + fitAdvance > maxWidth) {
      // 需要换行
      lineCount++
      currentLineWidth = w
    } else {
      currentLineWidth += w
    }
  }

  return lineCount
}
```

### 5.4 溢出换行处理

```typescript
// 处理 overflow-wrap: break-word 场景
function getBreakableAdvance(
  graphemeWidths: number[],
  graphemePrefixWidths: number[] | null,
  graphemeIndex: number,
  preferPrefixWidths: boolean,
): number {
  if (!preferPrefixWidths || graphemePrefixWidths === null) {
    return graphemeWidths[graphemeIndex]!
  }
  // 使用前缀宽度（在某些浏览器策略下更准确）
  return graphemePrefixWidths[graphemeIndex]!
}

// 在单词内部寻找断点
function findBreakPointInWord(
  wordWidths: number[],
  remainingWidth: number
): { breakIndex: number, consumedWidth: number } {
  let accumulated = 0
  for (let i = 0; i < wordWidths.length; i++) {
    accumulated += wordWidths[i]!
    if (accumulated > remainingWidth) {
      return { breakIndex: i, consumedWidth: accumulated }
    }
  }
  return { breakIndex: wordWidths.length, consumedWidth: accumulated }
}
```

---

## 六、双向文本支持（bidi.ts）深度解析

### 6.1 Bidi 算法概述

Pretext 实现了简化的 Unicode Bidi 算法（Unicode Bidirectional Algorithm），用于处理混合 LTR（从左到右）和 RTL（从右到左）的文本，如阿拉伯文、希伯来文与英文/数字混合的场景。

```typescript
// 字符类型分类
type BidiType = 'L' | 'R' | 'AL' | 'AN' | 'EN' | 'ES' | 'ET' | 'CS' |
                'ON' | 'BN' | 'B' | 'S' | 'WS' | 'NSM'

// L: Left-to-Right (英文)
// R: Right-to-Left (希伯来文)
// AL: Arabic Letter (阿拉伯文)
// EN: European Number (欧洲数字)
// AN: Arabic Number (阿拉伯数字)
```

### 6.2 层级计算

```typescript
// 计算每个字符的嵌入层级
function computeBidiLevels(str: string): Int8Array | null {
  const types: BidiType[] = new Array(len)

  // W1-W7: 规范化字符类型
  let lastType: BidiType = sor
  for (let i = 0; i < len; i++) {
    if (types[i] === 'NSM') types[i] = lastType
    else lastType = types[i]!
  }

  // N1-N2: 隐式级别计算
  for (let i = 0; i < len; i++) {
    if ((levels[i]! & 1) === 0) {
      if (types[i] === 'R') levels[i]++
      else if (types[i] === 'AN' || types[i] === 'EN') levels[i]! += 2
    } else if (types[i] === 'L' || types[i] === 'AN' || types[i] === 'EN') {
      levels[i]!++
    }
  }

  return levels
}
```

---

## 七、React 渲染优化原理

### 7.1 核心问题：DOM 测量触发 Layout Reflow

在 React 应用中，常见的一个性能问题是**组件独立测量文本高度**时造成的性能损耗：

```typescript
// 问题代码：每次渲染都测量
function TextComponent({ text, width }) {
  const ref = useRef()

  useLayoutEffect(() => {
    // getBoundingClientRect 触发 Layout Reflow！
    const height = ref.current.getBoundingClientRect().height
    setHeight(height)
  }, [text, width])

  return <div ref={ref}>{text}</div>
}
```

### 7.2 Pretext 解决方案

```typescript
// 解决方案：两阶段测量
function TextComponent({ text, width, lineHeight }) {
  const preparedRef = useRef(null)

  // 首次渲染或文本变化时准备
  useEffect(() => {
    preparedRef.current = prepare(text, `${lineHeight}px Inter`)
  }, [text, lineHeight])

  // 尺寸变化时仅执行算术运算
  const height = useMemo(() => {
    if (!preparedRef.current) return 0
    return layout(preparedRef.current, width, lineHeight).height
  }, [width, lineHeight])

  return <div style={{ height }}>{text}</div>
}
```

### 7.3 性能对比

| 方法 | 500 文本测量耗时 | DOM 调用 |
|------|------------------|----------|
| 传统 DOM | ~30ms/帧 | 每次测量 |
| Pretext prepare | ~19ms (一次性) | 仅初始化时 |
| Pretext layout | ~0.09ms | **零 DOM 调用** |

### 7.4 虚拟列表集成

```typescript
// 虚拟列表中使用 Pretext 计算行高
function VirtualizedList({ items, width, rowHeight }) {
  const preparedItems = useMemo(() => {
    return items.map(item => prepare(item.text, '16px Inter'))
  }, [items])

  const getItemHeight = useCallback((index) => {
    return layout(preparedItems[index], width, rowHeight).height
  }, [preparedItems, width, rowHeight])

  // 虚拟滚动实现...
}
```

---

## 八、高效 Diff 算法思想

### 8.1 与传统 Diff 算法的对比

Pretext 的"diff"思想体现在**增量更新**而非全量重算：

```typescript
// 传统方案：文本变化 → 重新测量 DOM
element.textContent = newText
const height = element.getBoundingClientRect().height  // 昂贵！

// Pretext 方案：文本变化 → 重新 prepare；尺寸变化 → 仅 layout
const prepared = prepare(newText, font)  // 文本变化时
const { height } = layout(prepared, newWidth, lineHeight)  // 尺寸变化时
```

### 8.2 缓存失效策略

```typescript
// 分析缓存清理
export function clearAnalysisCaches(): void {
  sharedWordSegmenter = null
}

// 测量缓存清理
export function clearMeasurementCaches(): void {
  segmentMetricCaches.clear()
  emojiCorrectionCache.clear()
  sharedGraphemeSegmenter = null
}

// 完整缓存清理
export function clearCache(): void {
  clearAnalysisCaches()
  sharedGraphemeSegmenter = null
  sharedLineTextCaches = new WeakMap<PreparedTextWithSegments, Map<number, string[]>>()
  clearMeasurementCaches()
}
```

### 8.3 增量字形分割

```typescript
// 字形分割缓存
let sharedGraphemeSegmenter: Intl.Segmenter | null = null
let sharedLineTextCaches = new WeakMap<PreparedTextWithSegments, Map<number, string[]>>()

function getSharedGraphemeSegmenter(): Intl.Segmenter {
  if (sharedGraphemeSegmenter === null) {
    sharedGraphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  }
  return sharedGraphemeSegmenter
}
```

---

## 九、实际应用场景

### 9.1 虚拟滚动/遮挡剔除

```typescript
// 计算可见区域的文本高度
function calculateVisibleTextHeight(items, startIndex, endIndex, containerHeight) {
  let totalHeight = 0

  for (let i = startIndex; i < endIndex; i++) {
    const prepared = preparedItems[i]
    totalHeight += layout(prepared, containerWidth, lineHeight).height
  }

  return totalHeight
}
```

### 9.2 Masonry 布局

```typescript
// 多列瀑布流布局
function masonryLayout(items, columnWidth, gap) {
  const columns = Array(columnCount).fill(0)

  for (const item of items) {
    // 找到最短的列
    const shortestColumn = columns.indexOf(Math.min(...columns))
    const height = layout(item.prepared, columnWidth, lineHeight).height

    columns[shortestColumn] += height + gap
  }

  return { columns, totalHeight: Math.max(...columns) }
}
```

### 9.3 滚动位置锚定

```typescript
// 防止内容加载时的布局抖动
function preventLayoutShift({ oldPrepared, newPrepared, maxWidth, lineHeight }) {
  const oldHeight = layout(oldPrepared, maxWidth, lineHeight).height
  const newHeight = layout(newPrepared, maxWidth, lineHeight).height

  // 返回高度差，用于调整滚动位置
  return newHeight - oldHeight
}
```

### 9.4 Canvas/SVG 渲染

```typescript
// 自定义文本渲染
function renderTextToCanvas(ctx, prepared, x, y, maxWidth, lineHeight) {
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight)

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].text, x, y + i * lineHeight)
  }
}
```

---

## 十、架构设计思想总结

### 10.1 核心原则

1. **延迟计算（Lazy Evaluation）**：昂贵操作（文本分析、Canvas 测量）仅执行一次，结果缓存复用
2. **热路径优化（Hot Path Optimization）**：布局计算设计为纯算术运算，无任何 DOM 调用
3. **国际化优先（i18n First）**：使用 `Intl.Segmenter` 原生 API 处理全球所有语言
4. **降级策略（Graceful Degradation）**：支持 OffscreenCanvas 和传统 Canvas 自动切换

### 10.2 设计模式

| 模式 | 应用 |
|------|------|
| **两阶段处理** | prepare() → layout() |
| **记忆化（Memoization）** | 缓存测量结果 |
| **享元（Flyweight）** | 共享分词器和测量上下文 |
| **命令查询分离（CQS）** | 分析与测量分离 |

### 10.3 性能优化技巧

```typescript
// 1. 避免对象创建于循环中
// 错误：for 循环内创建对象
for (let i = 0; i < 1000; i++) {
  result.push({ width: widths[i], index: i })
}

// 正确：预分配或使用数组方法
const result = new Array(length)
for (let i = 0; i < length; i++) {
  result[i] = widths[i]
}

// 2. 使用 TypedArray 存储数值数据
const segLevels = new Int8Array(segStarts.length)

// 3. 避免闭包捕获
const widths = prepared.widths  // 提前捕获引用
for (const w of widths) { ... }
```

---

## 十一、关键技术点清单

| 技术点 | 位置 | 说明 |
|--------|------|------|
| Intl.Segmenter | analysis.ts | 浏览器原生分词 API |
| Canvas measureText | measurement.ts | 文本宽度测量 |
| Emoji 校正 | measurement.ts | 跨浏览器兼容 |
| 零宽字符处理 | analysis.ts | ZWSP、软连字符 |
| CJK 断行规则 | analysis.ts | 避头尾字符 |
| RTL 支持 | bidi.ts | 双向文本算法 |
| 标点粘性规则 | analysis.ts | 左/右粘性标点合并 |
| Tab 宽度计算 | line-break.ts | 制表符宽度 |
| 快速路径 | line-break.ts | 无特殊断行时的优化 |
| 字形缓存 | layout.ts | Grapheme 分割缓存 |

---

## 十二、总结

Pretext 是一个**工程化程度极高**的文本布局库，它通过：

1. **两阶段架构**将昂贵的 DOM 操作与快速的算术运算分离
2. **多级缓存机制**最大化复用测量结果
3. **原生 API 集成**（Intl.Segmenter、OffscreenCanvas）减少 polyfill 负担
4. **精确的国际化支持**覆盖全球所有主要语言
5. **极致的性能优化**实现 0.0002ms/文本的布局计算

这个项目的设计思想不仅适用于文本布局场景，更可以推广到任何需要**测量→计算→渲染**分离的场景，是前端性能优化的优秀范例。

---

*文档版本：v1.0*
*分析日期：2026-04-02*
*源码版本：pretext main branch*
*参考资源：https://github.com/chenglou/pretext