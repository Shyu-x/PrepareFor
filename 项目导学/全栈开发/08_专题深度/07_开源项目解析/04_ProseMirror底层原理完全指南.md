# ProseMirror底层原理完全指南

## 一、ProseMirror概述

### 1.1 项目起源与背景

ProseMirror是由知名开发者Marijn Haverbeke（也是CodeMirror的作者）创建的下一代富文本编辑库。Marijn Haverbeke在编辑器开发领域拥有丰富的经验，ProseMirror是他的心血之作，凝聚了他多年在编辑器开发领域的思考和实践。

ProseMirror的设计目标是创建一个"**可编程的富文本编辑器**"，它不是简单地提供一个现成的编辑器，而是提供一套构建编辑器所需的基础设施和API，让开发者可以根据需求构建完全定制化的编辑体验。

### 1.2 核心技术特性

| 特性 | 描述 |
|------|------|
| **Schema驱动的文档模型** | 文档结构由Schema定义，确保数据的一致性和有效性 |
| **不可变状态** | 编辑器状态是不可变的，所有变更通过事务处理 |
| **撤销/重做系统** | 内置基于事务历史的撤销重做机制 |
| **协作编辑基础** | 提供协作编辑所需的基础架构 |
| **多平台支持** | 基于DOM但抽象了平台差异 |
| **模块化设计** | 核心与功能模块分离，便于扩展 |

### 1.3 ProseMirror与Tiptap的关系

```
┌──────────────────────────────────────────────┐
│              应用层 (Tiptap)                  │
│  Extension机制 | 命令系统 | React/Vue集成     │
├──────────────────────────────────────────────┤
│              编辑器层 (ProseMirror)           │
│  EditorState | EditorView | DOMSerializer    │
├──────────────────────────────────────────────┤
│              文档层 (ProseMirror)             │
│  Schema | Node | Mark | Fragment             │
├──────────────────────────────────────────────┤
│              事务层 (ProseMirror)             │
│  Transaction | Step | Mapping                │
├──────────────────────────────────────────────┤
│              DOM层 (浏览器原生)               │
│  DOM | Selection | InputRules                │
└──────────────────────────────────────────────┘
```

---

## 二、文档模型（Document Model）

### 2.1 文档树结构

ProseMirror的文档是一个嵌套的树形结构，由节点（Node）和标记（Mark）组成。

```
doc
├── block_node (如 paragraph, heading)
│   ├── text "Hello "  (文本节点)
│   ├── inline_node    (如 strong - 标记)
│   │   └── text "World"
│   └── text "!"
└── block_node
    └── ...
```

#### 2.1.1 节点类型

ProseMirror定义了两种主要的节点类型：

**块级节点（Block Nodes）**：占据文档中的独立区域，如段落、标题、列表等。

```javascript
// 段落节点结构示例
{
  type: "paragraph",
  content: [
    { type: "text", text: "这是一段文本" },
    { type: "text", text: "，包含" },
    { type: "text", marks: [{ type: "strong", attrs: {} }], text: "加粗" },
    { type: "text", text: "内容" }
  ]
}
```

**内联节点（Inline Nodes）**：嵌入在文本流中的节点，如链接、图片等。

```javascript
// 内联节点示例
{
  type: "paragraph",
  content: [
    { type: "text", text: "点击" },
    { type: "inline", marks: [{ type: "link", attrs: { href: "https://example.com" } }], content: [{ type: "text", text: "这里" }] },
    { type: "text", text: "访问链接" }
  ]
}
```

### 2.2 Fragment

Fragment是ProseMirror中用于表示节点列表的数据结构。它是一个不可变的序列容器，用于存储和管理子节点。

```javascript
// Fragment的创建和使用
const fragment = Fragment.from([
  schema.nodes.paragraph.create(null, [
    schema.text("Hello"),
    schema.text(" World")
  ])
]);

// 访问Fragment内容
fragment.forEach(node => {
  console.log(node.type.name);
});

// Fragment切片
const slice = fragment.slice(0, 1);
```

### 2.3 Mark

Mark用于表示文本的附加属性或格式，如加粗、斜体、链接等。与块级节点不同，Mark不会改变文档结构，而是应用于文本内容。

```javascript
// 创建带Mark的文本
const markedText = schema.text("加粗文本", [
  schema.marks.strong.create()
]);

// 创建带多个Mark的文本
const multiMarkedText = schema.text("链接加粗文本", [
  schema.marks.strong.create(),
  schema.marks.link.create({ href: "https://example.com" })
]);
```

---

## 三、Schema系统

### 3.1 Schema的定义

Schema是ProseMirror中最核心的概念之一，它定义了文档的合法结构。Schema规定了：

1. **允许的节点类型**：文档中可以包含哪些类型的节点
2. **节点属性**：每个节点类型有哪些属性（attrs）
3. **节点关系**：哪些节点可以作为其他节点的子节点
4. **Mark定义**：有哪些可用的标记类型

```javascript
// 定义一个简单的Schema
const mySchema = new Schema({
  nodes: {
    // 文档根节点
    doc: { content: "block+" },

    // 段落节点
    paragraph: {
      group: "block",
      content: "inline*",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0]
    },

    // 标题节点
    heading: {
      group: "block",
      content: "inline*",
      attrs: { level: { default: 1 } },
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } }
      ],
      toDOM: (node) => ["h" + node.attrs.level, 0]
    },

    // 文本节点（必须）
    text: { group: "inline" },

    // 硬换行
    hard_break: {
      group: "inline",
      inline: true,
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM: () => ["br"]
    }
  },

  marks: {
    // 粗体
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b", getStyle: (dom) => dom.style.fontWeight != "normal" && "bold" },
        { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }
      ],
      toDOM: () => ["strong", 0]
    },

    // 斜体
    em: {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style=italic" }
      ],
      toDOM: () => ["em", 0]
    },

    // 链接
    link: {
      attrs: {
        href: {},
        title: { default: null }
      },
      inclusive: false,
      parseDOM: [{
        tag: "a[href]",
        getAttrs: (dom) => ({
          href: dom.getAttribute("href"),
          title: dom.getAttribute("title")
        })
      }],
      toDOM: (mark) => ["a", { href: mark.attrs.href, title: mark.attrs.title }, 0]
    }
  }
});
```

### 3.2 内容表达式（Content Expressions）

Schema使用简洁的内容表达式来定义节点之间的关系：

| 表达式 | 含义 |
|--------|------|
| `"block"` | 任意一个块级节点 |
| `"inline"` | 任意一个内联节点 |
| `"text"` | 文本节点 |
| `"block+"` | 一个或多个块级节点 |
| `"block*"` | 零个或多个块级节点 |
| `"block?"` | 零个或一个块级节点 |
| `"(p | h1 | h2)"` | p、h1或h2之一 |
| `"paragraph heading"` | 必须同时包含paragraph和heading |
| `"(p | h1)+"` | 一个或多个p或h1 |

```javascript
// 复杂的内容表达式示例
const blogPostSchema = new Schema({
  nodes: {
    doc: { content: "title block+" },

    title: {
      group: "block",
      content: "text*",
      toDOM: () => ["h1", { class: "post-title" }, 0]
    },

    paragraph: {
      group: "block",
      content: "inline*",
      toDOM: () => ["p", 0]
    },

    blockquote: {
      group: "block",
      content: "block+",
      defining: true, // 定义性节点，影响选区
      toDOM: () => ["blockquote", 0]
    },

    image: {
      group: "block",
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null }
      },
      atom: true, // 原子性节点，不可再分
      toDOM: (node) => ["img", {
        src: node.attrs.src,
        alt: node.attrs.alt,
        title: node.attrs.title
      }]
    },

    text: { group: "inline" }
  }
});
```

### 3.3 Schema的验证

ProseMirror的Schema不仅仅用于定义文档结构，还提供了强大的验证功能：

```javascript
// 创建带验证的文档
try {
  const doc = mySchema.node("doc", null, [
    mySchema.node("paragraph", null, [
      mySchema.text("Hello")
    ]),
    mySchema.node("paragraph", null, [
      mySchema.text("World")
    ])
  ]);
} catch (e) {
  console.error("文档结构无效:", e.message);
}

// 直接验证
const result = mySchema.node("doc").check({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Hello" }] }
  ]
});

if (result instanceof Error) {
  console.error("验证失败:", result.message);
}
```

---

## 四、事务与步骤（Transaction & Step）

### 4.1 不可变状态模型

ProseMirror的核心设计原则之一是**不可变性**。编辑器状态（EditorState）一旦创建就不能被修改，任何对状态的改变都必须通过创建一个新的状态来实现。

```
EditorState ──Transaction──> new EditorState
     │                           │
     │ (旧状态保持不变)           │ (新状态包含变更)
     ▼                           ▼
  [不可变]                    [不可变]
```

### 4.2 Transaction

Transaction（事务）是描述状态变更的对象。每个事务包含：

1. **Steps（步骤）**：描述具体的变更操作
2. **Mapping（映射）**：记录变更前后的位置映射
3. **元数据**：如是否可撤销、是否是选择变更等

```javascript
// 创建事务
const tr = editorState.tr;

// 执行各种操作
tr.insertText("Hello World", 10);           // 在位置10插入文本
tr.delete(5, 10);                            // 删除位置5-10的内容
tr.setBlockType(0, 5, schema.nodes.heading, { level: 1 }); // 设置为标题

// 添加Mark
tr.addMark(0, 10, schema.marks.strong.create());

// 设置选区
tr.setSelection(new TextSelection(tr.doc.resolve(5)));

// 设置metadata
tr.setMeta("addToHistory", false);  // 不加入历史记录
tr.setMeta("scrollIntoView", true);

// 应用事务
const newState = editorState.apply(tr);
```

### 4.3 Step（步骤）

Step是事务中的最小变更单位。ProseMirror定义了多种内置Step类型：

#### 4.3.1 ReplaceStep

用于替换文档中的一个区间：

```javascript
// 位置5-10的内容替换为新内容
const step = new ReplaceStep(5, 10, Fragment.from([
  schema.nodes.paragraph.create(null, [schema.text("新内容")])
]), 0, 0, true);
```

#### 4.3.2 ReplaceAroundStep

用于替换一个节点及其周围内容：

```javascript
// 替换包括节点边缘的区域
const step = new ReplaceAroundStep(5, 10, 7, 8, Fragment.from([...]), 0, true);
```

#### 4.3.3 AddMarkStep / RemoveMarkStep

用于添加或移除Mark：

```javascript
// 在位置0-10添加strong mark
const addMarkStep = new AddMarkStep(0, 10, schema.marks.strong.create());

// 移除位置0-10的strong mark
const removeMarkStep = new RemoveMarkStep(0, 10, schema.marks.strong.create());
```

### 4.4 自定义Step

开发者可以创建自己的Step类型来实现复杂的变更操作：

```javascript
// 定义自定义Step
class UppercaseStep {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  // 获取此步骤apply后的结果文档
  apply(doc) {
    const target = doc.slice(this.from, this.to);
    let result = "";
    target.forEach(node => {
      if (node.isText) {
        result += node.text.toUpperCase();
      } else {
        result += node.toString();
      }
    });

    const tr = doc.tr.replaceWith(this.from, this.to, schema.text(result));
    return tr.doc;
  }

  // 获取此步骤的反向步骤（用于撤销）
  getMap() {
    return new PosMap([new MappingEntry(this.from, this.to, 0)]);
  }

  // 合并两个连续的步骤
  merge(other) {
    if (!(other instanceof UppercaseStep)) return null;
    if (this.from !== other.from || this.to !== other.to) return null;
    return new UppercaseStep(this.from, this.to);
  }

  // JSON序列化
  toJSON() {
    return {
      type: "uppercase",
      from: this.from,
      to: this.to
    };
  }

  // 从JSON反序列化
  static fromJSON(schema, json) {
    return new UppercaseStep(json.from, json.to);
  }
}

// 注册Step
Step.divisions["uppercase"] = UppercaseStep;
```

### 4.5 Mapping

Mapping用于跟踪文档位置在变更前后的对应关系。当一个文档经历多次变更后，Mapping可以帮助我们正确地将旧位置映射到新位置。

```javascript
// 创建Mapping
const mapping = new Mapping([
  new MappingEntry(0, 10, 5),  // 原始0-10映射到新5-15
  new MappingEntry(15, 20, 3)  // 原始15-20映射到新18-23
]);

// 映射一个位置
const newPos = mapping.map(5);  // 返回15

// 映射一个范围
const [from, to] = mapping.mapRange(0, 10);

// 获取映射的步数
const steps = mapping.steps.length;

// 迭代映射
mapping.forEach((oldStart, oldEnd, newStart, newEnd) => {
  console.log(`映射 ${oldStart}-${oldEnd} 到 ${newStart}-${newEnd}`);
});
```

---

## 五、选区系统（Selection）

### 5.1 选区类型

ProseMirror支持多种选区类型：

| 类型 | 描述 |
|------|------|
| `TextSelection` | 文本选区，从一个位置到另一个位置 |
| `NodeSelection` | 节点选区，选中整个节点 |
| `AllSelection` | 全选 |
| `GapCursor` | 空隙光标，表示两个块之间的空位 |

### 5.2 创建选区

```javascript
// 创建文本选区：从位置5到位置10
const selection = new TextSelection(doc.resolve(5), doc.resolve(10));

// 创建折叠选区（光标）：在位置5
const collapsed = new TextSelection(doc.resolve(5));

// 创建节点选区：选中位置5处的节点
const nodeSelection = new NodeSelection(doc.resolve(5));

// 创建从开头到位置10的选区
const fromStart = Selection.atStart(doc);

  // 创建从位置0到末尾的选区
const toEnd = Selection.atEnd(doc);

// 设置到编辑器状态
const tr = state.tr.setSelection(selection);
const newState = state.apply(tr);
```

### 5.3 选区与事务

选区变更也是通过事务来完成的：

```javascript
// 获取当前选区
const currentSelection = editorState.selection;

// 基于当前位置创建新选区
const newSelection = TextSelection.create(
  editorState.doc,
  currentSelection.from + 5,
  currentSelection.to + 5
);

// 通过事务设置选区
const tr = editorState.tr.setSelection(newSelection);
const newState = editorState.apply(tr);
```

---

## 六、视图系统（View）

### 6.1 EditorView

EditorView是ProseMirror与DOM交互的桥梁。它负责：

1. **渲染文档**：将文档模型渲染为DOM
2. **处理输入**：将用户输入转换为事务
3. **管理选区**：同步DOM选区与ProseMirror选区
4. **分发事件**：将DOM事件传递给相应的处理函数

```javascript
const view = new EditorView(document.querySelector("#editor"), {
  state: editorState,

  // 处理DOM事件
  dispatchTransaction(tr) {
    // 应用事务到状态
    const newState = view.state.apply(tr);
    // 更新视图
    view.updateState(newState);
  },

  // 自定义节点渲染
  nodeViews: {
    myCustomNode(node, view, getPos) {
      const dom = document.createElement("div");
      dom.className = "custom-node";

      // 创建编辑区域
      const contentDOM = document.createElement("div");
      dom.appendChild(contentDOM);

      return {
        dom,
        contentDOM,
        update(node) {
          // 更新节点内容
          if (node.type !== node.type) return false;
          return true;
        },
        selectNode() {
          dom.classList.add("selected");
        },
        deselectNode() {
          dom.classList.remove("selected");
        },
        setSelection(anchor, head) {
          // 设置DOM选区
        }
      };
    }
  },

  // 属性传递
  attributeRules: {
    "data-custom": (node) => node.attrs["data-custom"]
  },

  // decorations（装饰器）
  decorations(state) {
    // 返回一组decorations用于高亮等效果
  }
});
```

### 6.2 事务分发（dispatchTransaction）

`dispatchTransaction`是EditorView中最重要的回调之一。当用户执行任何编辑操作时，都会触发这个函数：

```javascript
const view = new EditorView(document.querySelector("#editor"), {
  state: initialState,

  dispatchTransaction(tr) {
    // 1. 获取新的状态
    const newState = this.state.apply(tr);

    // 2. 更新视图状态
    this.updateState(newState);

    // 3. 可以在这里执行副作用
    if (tr.docChanged) {
      console.log("文档已变更");
      // 发送更新到服务器等
    }

    if (tr.selectionSet) {
      console.log("选区已变更");
      // 处理选区变更
    }
  }
});
```

### 6.3 DOM序列化与解析

#### 6.3.1 DOMParser

DOMParser负责将HTML字符串解析为ProseMirror文档：

```javascript
// 从HTML字符串解析
const parser = DOMParser.fromSchema(schema);
const doc = parser.parse("<p>Hello <strong>World</strong></p>");

// 从DOM元素解析
const element = document.querySelector(".editor-content");
const doc = parser.parse(element);

// 带选项的解析
const doc = parser.parse(element, {
  preserveWhitespace: "full",  // 保留空白字符
  findWrapping: (node) => {    // 查找包装节点
    return ["div", { class: "wrapper" }];
  },
  topNode: schema.nodes.doc   // 顶层节点类型
});
```

#### 6.3.2 DOMSerializer

DOMSerializer负责将ProseMirror文档序列化为DOM：

```javascript
// 创建序列化器
const serializer = DOMSerializer.fromSchema(schema);

// 序列化整个文档为DOM
const fragment = serializer.serializeFragment(doc.content);

// 序列化片段
const div = document.createElement("div");
serializer.serializeFragment(doc.content, { document: window.document }, div);

// 序列化节点
const nodeDOM = serializer.serializeNode(node);
```

---

## 七、命令系统（Commands）

### 7.1 命令模式

ProseMirror使用命令模式来处理编辑操作。每个命令是一个函数，接收编辑状态和分发行，返回布尔值表示是否成功执行。

```javascript
// 基础命令签名
function command(state, dispatch) {
  // state: EditorState - 当前编辑器状态
  // dispatch: (tr: Transaction) => void - 分发事务的函数

  if (dispatch) {
    // 执行实际操作并分发事务
    const tr = state.tr.insertText("Hello");
    dispatch(tr);
  }

  return true; // 返回true表示命令已执行，false表示命令不适用
}
```

### 7.2 内置命令

ProseMirror提供了一系列内置命令：

```javascript
// 插入文本
insertText(text, from, to)

// 删除选区
deleteSelection()

// 替换选区
replaceSelection(content)

// 设置节点类型
setBlockType(type, attrs, marks, from, to)

// 切换Mark
toggleMark(mark)

// 折叠选区
collapseSelection()

// 选区到文档开头/结尾
selectAll()
```

### 7.3 命令链

命令可以通过链式调用组合使用：

```javascript
// 在chain()中组合多个命令
editor.view.dispatch(
  editor.state.tr
    .insertText("Hello ")
    .setBlockType(schema.nodes.heading, { level: 1 })
    .addMark(schema.marks.strong.create())
);
```

### 7.4 键盘快捷键

通过`keymap`插件绑定键盘快捷键：

```javascript
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

// 定义快捷键映射
const keymapPlugin = keymap({
  "Mod-b": toggleMark(schema.marks.strong),      // Ctrl/Cmd + B
  "Mod-i": toggleMark(schema.marks.em),           // Ctrl/Cmd + I
  "Mod-`": toggleMark(schema.marks.code),         // Ctrl/Cmd + `
  "Enter": splitBlock,                             // Enter键
  "Shift-Enter": exitCode,                         // Shift+Enter
  "Mod-Enter": exitList,                          // Ctrl/Cmd + Enter
  "Backspace": deleteSelection,                   // 退格键
  "Mod-z": undo,                                  // Ctrl/Cmd + Z
  "Mod-y": redo,                                  // Ctrl/Cmd + Y
  "Mod-Shift-z": redo,                            // Ctrl/Cmd + Shift + Z
  "ArrowLeft": leftArrow,                         // 左箭头
  "ArrowRight": rightArrow,                       // 右箭头
  // 更多快捷键...
});

// 结合基础快捷键
const plugin = keymap({
  ...baseKeymap,
  "Mod-b": toggleMark(schema.marks.strong),
  "Mod-i": toggleMark(schema.marks.em),
});
```

---

## 八、插件系统（Plugins）

### 8.1 插件架构

ProseMirror的插件系统是其扩展性的核心。每个插件可以：

1. **拦截事件**：在事件到达默认处理程序之前处理
2. **修改状态**：在事务应用前后执行逻辑
3. **添加装饰**：为文档添加视觉元素
4. **管理额外状态**：存储插件特有的状态

```javascript
import { Plugin, PluginKey } from "prosemirror-state";

// 定义插件key（用于标识和获取插件状态）
const myPluginKey = new PluginKey("myPlugin");

// 创建插件
const myPlugin = new Plugin({
  key: myPluginKey,

  // 插件属性（会被合并到EditorState）
  props: {
    // 处理DOM事件
    handleDOMEvents: {
      click(view, event) {
        console.log("点击了:", event.target);
        return false; // 返回false表示不阻止默认行为
      },
      keydown(view, event) {
        if (event.key === "Escape") {
          console.log("按下了Escape键");
          return true; // 返回true表示阻止默认行为
        }
        return false;
      }
    },

    // 自定义装饰器
    decorations(state) {
      // 返回一组decorations
      return DecorationSet.create(state.doc, [
        Decoration.inline(0, 10, { class: "highlight" })
      ]);
    },

    // 可拖拽处理
    handleDrop(view, state, slice, moved) {
      // 处理拖拽
      return false;
    },

    // 可拖拽文本处理
    handleTextDrop(view, state, text, moved) {
      return false;
    },

    // 粘贴处理
    handlePaste(view, state, slice, dataTransfer) {
      return false;
    }
  },

  // 插件状态初始化
  state: {
    init(config, instance) {
      return {
        clickCount: 0,
        lastClickTime: 0
      };
    },

    // 应用事务时更新插件状态
    apply(tr, value, oldState, newState) {
      // 检查是否需要更新插件状态
      if (tr.docChanged) {
        return {
          clickCount: value.clickCount,
          lastClickTime: value.lastClickTime
        };
      }
      return value;
    }
  },

  // 过滤事务
  filterTransaction(tr, state) {
    // 可以根据条件拒绝某些事务
    if (tr.getMeta("blocked")) {
      return false;
    }
    return true;
  }
});
```

### 8.2 插件状态

插件可以通过`EditorState.plugins`访问：

```javascript
// 获取插件状态
const pluginState = myPluginKey.getState(editorState);

// 检查插件是否存在
const plugin = editorState.plugins.find(p => p.key === myPluginKey);
```

### 8.3 内置插件

ProseMirror提供了一些重要的内置插件：

#### 8.3.1 历史记录插件

```javascript
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

// 绑定快捷键
const historyKeymap = keymap({
  "Mod-z": undo,
  "Mod-y": redo,
  "Mod-Shift-z": redo
});

// 使用
const view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: myDoc,
    plugins: [
      historyKeymap,
      history()
    ]
  }),

  dispatchTransaction(tr) {
    const newState = view.state.apply(tr);
    view.updateState(newState);
  }
});
```

#### 8.3.2 输入规则插件

```javascript
import { inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis } from "prosemirror-inputrules";

// 创建输入规则
const myInputRule = wrappingInputRule(
  /^\s*>\s$/,                    // 正则表达式
  schema.nodes.blockquote         // 转换为的节点类型
);

// 创建文本块输入规则
const headingRule = textblockTypeInputRule(
  /^#\s$/,
  schema.nodes.heading,
  { level: 1 }
);

// 组合输入规则
const myInputRules = inputRules({
  rules: [
    ...smartQuotes,
    ellipsis,
    emDash,
    myInputRule,
    headingRule
  ]
});
```

#### 8.3.3 快捷键插件

```javascript
import { keymap, baseKeymap } from "prosemirror-keymap";

// 基础快捷键（退格删除、空格处理等）
const baseKeys = baseKeymap;

// 自定义快捷键
const myKeymap = keymap({
  "Mod-b": toggleMark(schema.marks.strong),
  "Mod-i": toggleMark(schema.marks.em),
  "Mod-`": toggleMark(schema.marks.code),
  "Enter": (state, dispatch) => {
    // 自定义Enter键行为
    return false; // 返回false使用默认行为
  }
});

// 组合快捷键
const combinedKeymap = keymap({
  ...baseKeys,
  ...myKeymap.props
});
```

---

## 九、协作编辑支持

### 9.1 协作基础

ProseMirror本身不包含协作功能，但提供了协作所需的基础设施。协作编辑通常基于**CRDT**（无冲突复制数据类型）或**OT**（操作转换）算法实现。

### 9.2 协作插件接口

ProseMirror定义了一套协作插件接口：

```javascript
// 协作状态字段
const collabField = new PluginField({
  key: collabKey,

  // 初始状态
  init(value) {
    return {
      version: 0,
      unconfirmed: []
    };
  },

  // 应用事务时
  apply(tr, value, oldState, newState) {
    if (!tr.docChanged) return value;

    return {
      version: value.version + 1,
      unconfirmed: [
        ...value.unconfirmed,
        { step: tr.steps[0], version: value.version }
      ]
    };
  }
});
```

### 9.3 Y.js集成

实际应用中，ProseMirror通常与Y.js结合使用：

```javascript
import * as Y from "yjs";
import { ProseMirrorYjsBinding } from "y-prosemirror";

// 创建Y.js文档
const ydoc = new Y.Doc();

// 创建ProseMirror文档
const state = EditorState.create({
  schema: mySchema,
  doc: ProseMirrorNode.fromDOM(mySchema, document.querySelector(".content"))
});

// 创建绑定
const binding = new ProseMirrorYjsBinding(ydoc.getXmlFragment("content"), state);
```

---

## 十、装饰器系统（Decorations）

### 10.1 装饰器类型

Decorations用于在文档上添加可视化的标记或元素，而不影响文档结构：

| 类型 | 描述 |
|------|------|
| `Decoration.inline` | 内联装饰（不影响布局） |
| `Decoration.widget` | 小部件装饰（插入到文档中） |
| `Decoration.node` | 节点装饰（包裹节点） |

### 10.2 使用装饰器

```javascript
import { Decoration, DecorationSet } from "prosemirror-view";

// 创建装饰集
const decorations = DecorationSet.create(doc, [
  // 内联装饰 - 高亮
  Decoration.inline(10, 20, {
    class: "highlight",
    style: "background-color: yellow"
  }),

  // Widget装饰 - 在位置30插入一个小部件
  Decoration.widget(30, () => {
    const btn = document.createElement("button");
    btn.textContent = "Click me";
    btn.onclick = () => console.log("Clicked");
    return btn;
  }, { side: 1 }),

  // 节点装饰 - 为特定节点添加样式
  Decoration.node(0, 10, {
    class: "article-header",
    "data-author": "John Doe"
  })
]);

// 通过插件添加装饰
const decorationPlugin = new Plugin({
  props: {
    decorations(state) {
      return this.getState(state) || DecorationSet.empty;
    }
  },

  state: {
    init() {
      return DecorationSet.empty;
    },

    apply(tr, value, oldState, newState) {
      // 根据状态变化更新装饰
      return DecorationSet.create(newState.doc, []);
    }
  }
});
```

### 10.3 实际应用场景

```javascript
// 1. 拼写检查高亮
const spellCheckPlugin = new Plugin({
  props: {
    decorations(state) {
      const checked = checkSpelling(state.doc);
      const decos = [];

      for (const misspelling of checked) {
        decos.push(
          Decoration.inline(
            misspelling.from,
            misspelling.to,
            { class: "misspelled" }
          )
        );
      }

      return DecorationSet.create(state.doc, decos);
    }
  }
});

// 2. @提及高亮
const mentionPlugin = new Plugin({
  props: {
    decorations(state) {
      const decos = [];
      const mentionRegex = /@(\w+)/g;
      let match;

      while ((match = mentionRegex.exec(state.doc.textContent))) {
        const from = match.index;
        const to = from + match[0].length;
        decos.push(
          Decoration.inline(from, to, {
            class: "mention",
            "data-user": match[1]
          })
        );
      }

      return DecorationSet.create(state.doc, decos);
    }
  }
});

// 3. 占位符
const placeholderPlugin = new Plugin({
  props: {
    decorations(state) {
      if (
        state.doc.childCount === 1 &&
        state.doc.firstChild.isTextblock &&
        state.doc.firstChild.content.size === 0
      ) {
        return DecorationSet.create(state.doc, [
          Decoration.node(0, 1, {
            "data-placeholder": "输入内容..."
          })
        ]);
      }
      return DecorationSet.empty;
    }
  }
});
```

---

## 十一、实战：构建一个简单的编辑器

### 11.1 完整示例

```javascript
// 1. 定义Schema
const mySchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0]
    },
    heading: {
      group: "block",
      content: "inline*",
      attrs: { level: { default: 1 } },
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } }
      ],
      toDOM: (node) => ["h" + node.attrs.level, 0]
    },
    text: { group: "inline" },
    hard_break: {
      group: "inline",
      inline: true,
      parseDOM: [{ tag: "br" }],
      toDOM: () => ["br"]
    }
  },
  marks: {
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b" }
      ],
      toDOM: () => ["strong", 0]
    },
    em: {
      parseDOM: [
        { tag: "em" },
        { tag: "i" }
      ],
      toDOM: () => ["em", 0]
    }
  }
});

// 2. 创建初始文档
const initialDoc = mySchema.node("doc", null, [
  mySchema.node("heading", { level: 1 }, [mySchema.text("欢迎使用ProseMirror")]),
  mySchema.node("paragraph", null, [
    mySchema.text("这是一个"),
    mySchema.text("示例", [mySchema.marks.strong.create()]),
    mySchema.text("编辑器")
  ])
]);

// 3. 创建编辑器状态
const initialState = EditorState.create({
  doc: initialDoc,
  schema: mySchema,
  plugins: [
    history(),
    keymap({
      "Mod-z": undo,
      "Mod-y": redo,
      "Mod-b": toggleMark(mySchema.marks.strong),
      "Mod-i": toggleMark(mySchema.marks.em)
    }),
    keymap(baseKeymap)
  ]
});

// 4. 创建编辑器视图
const view = new EditorView(document.querySelector("#editor"), {
  state: initialState,

  dispatchTransaction(tr) {
    const newState = view.state.apply(tr);
    view.updateState(newState);

    // 可选：将变更同步到服务器
    if (tr.docChanged) {
      const json = newState.doc.toJSON();
      console.log("文档变更:", JSON.stringify(json, null, 2));
    }
  },

  // 5. 自定义节点渲染
  nodeViews: {}
});

// 6. 工具栏交互
document.querySelector("#bold-btn").addEventListener("click", () => {
  toggleMark(mySchema.marks.strong)(view.state, view.dispatch);
});

document.querySelector("#italic-btn").addEventListener("click", () => {
  toggleMark(mySchema.marks.em)(view.state, view.dispatch);
});

document.querySelector("#undo-btn").addEventListener("click", () => {
  undo(view.state, view.dispatch);
});

document.querySelector("#redo-btn").addEventListener("click", () => {
  redo(view.state, view.dispatch);
});
```

### 11.2 HTML模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProseMirror编辑器示例</title>
  <style>
    #editor {
      border: 1px solid #ccc;
      padding: 20px;
      min-height: 300px;
    }

    #editor p {
      margin: 0.5em 0;
    }

    #editor h1 {
      font-size: 1.8em;
      margin: 0.8em 0 0.4em;
    }

    #editor strong {
      font-weight: bold;
    }

    #editor em {
      font-style: italic;
    }

    .toolbar {
      margin-bottom: 10px;
    }

    .toolbar button {
      padding: 5px 10px;
      margin-right: 5px;
      cursor: pointer;
    }

    .ProseMirror-focused {
      outline: 2px solid #3b82f6;
    }
  </style>
</head>
<body>
  <h1>ProseMirror 富文本编辑器</h1>

  <div class="toolbar">
    <button id="bold-btn"><strong>B</strong></button>
    <button id="italic-btn"><em>I</em></button>
    <button id="undo-btn">撤销</button>
    <button id="redo-btn">重做</button>
  </div>

  <div id="editor"></div>

  <script type="module">
    // 初始化编辑器
    // ... (见上面的JavaScript代码)
  </script>
</body>
</html>
```

---

## 十二、性能优化

### 12.1 减少重渲染

ProseMirror的DOM更新已经高度优化，但在大型文档中仍需注意：

1. **合并频繁的小变更**：使用防抖或节流
2. **避免频繁的状态创建**：尽量复用对象
3. **使用虚拟列表**：对于超长文档，只渲染可见部分

```javascript
// 示例：节流更新
import { throttle } from "lodash-es";

const throttledUpdate = throttle((view) => {
  const json = view.state.doc.toJSON();
  saveToServer(json);
}, 1000);

view.dom.addEventListener("input", () => {
  throttledUpdate(view);
});
```

### 12.2 大文档优化

```javascript
// 使用懒加载的节点视图
const lazyNodeViewPlugin = new Plugin({
  props: {
    nodeViews: {
      largeImage(node, view, getPos) {
        // 只在节点可见时创建完整视图
        const dom = document.createElement("div");
        dom.className = "large-image-placeholder";

        const realView = createHeavyView(node, dom);

        return {
          dom,
          update(node) { return node.eq(this.node) },
          destroy() { realView.destroy(); }
        };
      }
    }
  }
});
```

---

## 十三、面试高频问题

### Q1: ProseMirror的核心设计原则是什么？

**答**：ProseMirror的核心设计原则包括：
1. **不可变性**：状态一旦创建不可修改，所有变更通过事务生成新状态
2. **Schema驱动**：文档结构由Schema严格定义
3. **事务抽象**：所有变更都抽象为Transaction，便于追踪和撤销
4. **插件化架构**：核心功能最小化，扩展通过插件实现
5. **DOM解耦**：通过抽象层将DOM操作与核心逻辑分离

### Q2: ProseMirror如何保证文档的一致性？

**答**：ProseMirror通过多层机制保证文档一致性：
1. **Schema验证**：任何变更在应用前都会经过Schema验证
2. **事务原子性**：一个事务中的多个Step要么全部成功，要么全部失败
3. **不可变状态**：旧状态保持不变，可以随时回滚
4. **Mapping追踪**：记录每次变更的位置映射，支持复杂的撤销/重做

### Q3: ProseMirror与传统contentEditable的区别？

**答**：传统contentEditable的缺陷：
- 浏览器实现不一致
- HTML结构难以控制
- 选区API复杂且不可靠
- 数据模型不清晰

ProseMirror的优势：
- 明确的数据模型（Schema + 文档树）
- 统一的状态管理（不可变状态）
- 可预测的行为（事务 + 命令）
- 完全可控的渲染（DOMSerializer）

### Q4: Step在ProseMirror中扮演什么角色？

**答**：Step是ProseMirror中最小的变更单位：
1. **描述性**：Step只描述"做什么"，不包含执行逻辑
2. **可组合**：多个Step可以组合成一个Transaction
3. **可逆**：每个Step都知道如何撤销自己
4. **可映射**：Step包含位置映射信息
5. **可序列化**：Step可以序列化为JSON进行传输或存储

### Q5: 如何在ProseMirror中实现自定义功能？

**答**：实现自定义功能的主要方式：
1. **自定义Schema节点/Mark**：定义新的内容结构
2. **自定义Step**：封装复杂的变更操作
3. **自定义插件**：拦截事件、添加装饰、管理状态
4. **自定义NodeView**：完全控制节点的渲染和交互
5. **自定义命令**：组合现有操作为高级命令

### Q6: ProseMirror的协作编辑支持是如何实现的？

**答**：ProseMirror本身不包含协作功能，但提供了必要的基础设施：
1. **Transaction的steps属性**：包含所有变更的步骤，可以序列化传输
2. **Plugin系统**：可以存储和同步协作状态
3. **Mapping**：用于将远程变更映射到本地文档
4. **Selection**：支持远程光标显示

实际应用中，通常与Y.js等CRDT库结合使用，通过Plugin将Y.js的变更同步到ProseMirror文档。

---

## 十四、总结

ProseMirror作为现代富文本编辑器的底层引擎，其设计蕴含了丰富的软件工程智慧：

1. **不可变架构**：借鉴函数式编程思想，状态不可变，变更通过事务生成新状态
2. **Schema驱动**：严格的数据模型定义，保证文档结构的一致性
3. **Step抽象**：将复杂变更分解为可组合、可逆的最小单元
4. **插件化设计**：核心最小化，功能通过插件扩展
5. **DOM解耦**：清晰的抽象层，便于测试和替换渲染实现

理解ProseMirror的底层原理，不仅能帮助我们更好地使用Tiptap等上层框架，还能提升对编辑器架构设计的整体认知。在富文本编辑器这个看似简单实则复杂的领域，ProseMirror提供了一套优雅而强大的解决方案。

---

*本文档由Claude研究员编写，最后更新于2026年4月*
