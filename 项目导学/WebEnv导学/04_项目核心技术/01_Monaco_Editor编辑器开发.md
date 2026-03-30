# Monaco Editor 编辑器开发教程

## 目录

1. [Monaco Editor 是什么？](#1-monaco-editor-是什么)
2. [基础集成和使用](#2-基础集成和使用)
3. [配置选项详解](#3-配置选项详解)
4. [主题设置](#4-主题设置)
5. [语言支持](#5-语言支持)
6. [编辑器事件](#6-编辑器事件)
7. [与 React 集成](#7-与-react-集成)
8. [高级功能](#8-高级功能)
9. [项目中的实际使用示例](#9-项目中的实际使用示例)

---

## 1. Monaco Editor 是什么？

### 1.1 简介

**Monaco Editor** 是微软开源的代码编辑器内核，它是 **VS Code** 的核心编辑组件。Monaco Editor 提供了强大的代码编辑功能，包括：

- 语法高亮
- 代码补全
- 错误诊断
- 代码折叠
- 多光标编辑
- 查找和替换
- 宏定义预览
- 迷你地图

```bash
# 安装 Monaco Editor
npm install monaco-editor@4.7.0
```

### 1.2 核心特性

| 特性 | 说明 |
|------|------|
| 语法高亮 | 支持 70+ 编程语言 |
| 智能补全 | IntelliSense 代码补全 |
| 错误提示 | 实时语法错误检测 |
| 主题定制 | 支持亮色/暗色主题 |
| 键盘快捷键 | VS Code 风格快捷键 |

---

## 2. 基础集成和使用

### 2.1 基础 HTML 集成

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Monaco Editor 示例</title>
    <style>
        #editor {
            width: 800px;
            height: 600px;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div id="editor"></div>

    <!-- 引入 Monaco Editor -->
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@4.7.0/min/vs/loader.js"></script>
    <script>
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@4.7.0/min/vs' }});

        require(['vs/editor/editor.main'], function() {
            // 创建编辑器实例
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: '// 在这里编写你的代码\nconsole.log("Hello Monaco!");',
                language: 'javascript',
                theme: 'vs-dark'
            });
        });
    </script>
</body>
</html>
```

### 2.2 NPM 项目中使用

```bash
# 安装依赖
npm install monaco-editor
```

```javascript
// 初始化 Monaco Editor
import * as monaco from 'monaco-editor';

// 创建编辑器实例
const editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: '// 欢迎使用 Monaco Editor\n',
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true
});
```

---

## 3. 配置选项详解

### 3.1 核心配置项

```javascript
const editor = monaco.editor.create(container, {
    // ===== 基础配置 =====
    value: '代码内容',                    // 初始代码
    language: 'javascript',              // 语言模式
    theme: 'vs-dark',                    // 主题 (vs, vs-dark, hc-black)

    // ===== 编辑器行为 =====
    readOnly: false,                     // 是否只读
    minimap: { enabled: true },          // 显示迷你地图
    lineNumbers: 'on',                   // 行号显示 ('on', 'off', 'relative')
    wordWrap: 'off',                     // 自动换行 ('on', 'off', 'wordWrapColumn', 'bounded')
    fontSize: 14,                        // 字体大小
    fontFamily: 'Consolas, "Courier New", monospace',  // 字体
    tabSize: 4,                          // Tab 缩进大小
    insertSpaces: true,                  // 使用空格替代 Tab

    // ===== 光标配置 =====
    cursorBlinking: 'blink',             // 光标闪烁 ('blink', 'smooth', 'phase', 'expand', 'solid')
    cursorStyle: 'line',                 // 光标样式 ('line', 'block', 'underline')
    cursorWidth: 2,                      // 光标宽度
    renderLineHighlight: 'all',         // 行高亮 ('none', 'gutter', 'line', 'all')

    // ===== 滚动配置 =====
    scrollBeyondLastLine: false,          // 允许滚动到最后一行之后
    smoothScrolling: true,               // 平滑滚动
    mouseWheelZoom: true,                // 鼠标滚轮缩放

    // ===== 格式配置 =====
    formatOnPaste: true,                 // 粘贴时格式化
    formatOnType: true,                  // 输入时格式化
    autoClosingBrackets: 'always',       // 自动闭合括号
    autoClosingQuotes: 'always',          // 自动闭合引号

    // ===== bracketed paste mode =====
    // 自动调整缩进
    autoIndent: 'full',                  // 自动缩进 ('none', 'keep', 'full')

    // ===== 折叠配置 =====
    folding: true,                        // 启用代码折叠
    foldingHighlight: true,              // 折叠区域高亮
    showFoldingControls: 'mouseover'     // 折叠按钮显示 ('always', 'mouseover')
});
```

### 3.2 完整配置示例

```javascript
const editorConfig = {
    // 基础设置
    language: 'typescript',
    theme: 'vs-dark',
    value: getInitialCode(),

    // 视觉设置
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "'Fira Code', 'Consolas', monospace",
    fontLigatures: true,                 // 启用字体连字
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',   // 平滑光标动画
    smoothScrolling: true,

    // 缩进设置
    tabSize: 2,
    insertSpaces: true,
    autoIndent: 'full',

    // bracketed paste mode
    bracketPairColorization: { enabled: true },  // 括号配对着色

    // 渲染设置
    minimap: {
        enabled: true,
        scale: 1,
        showSlider: 'mouseover'
    },
    renderLineHighlight: 'all',
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    rulers: [80, 120],                   // 显示标尺线

    // 滚动设置
    scrollBeyondLastLine: false,
    scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        useShadows: false
    },

    // 代码补全
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    snippetSuggestions: 'top',

    // 折叠
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',

    // 括号匹配
    matchBrackets: 'always',

    // 性能
    automaticLayout: true,
    maxTokenizationLineLength: 10000
};

const editor = monaco.editor.create(
    document.getElementById('editor-container'),
    editorConfig
);
```

---

## 4. 主题设置

### 4.1 内置主题

```javascript
// 使用内置主题
monaco.editor.setTheme('vs');        // 亮色主题
monaco.editor.setTheme('vs-dark');   // 暗色主题
monaco.editor.setTheme('hc-black');  // 高对比度主题
```

### 4.2 自定义主题

```javascript
// 定义自定义主题
monaco.editor.defineTheme('my-theme', {
    base: 'vs-dark',                  // 基于的主题
    inherit: true,                    // 继承基础主题的规则
    rules: [
        { token: 'comment', foreground: '6272a8', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'f8f8f2' }
    ],
    colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#44475a',
        'editor.selectionBackground': '#44475a',
        'editorCursor.foreground': '#f8f8f0',
        'editorWhitespace.foreground': '#3b3a32',
        'editorIndentGuide.background': '#3b3a32',
        'editor.selectionHighlightBackground': '#44475a50'
    }
});

// 使用自定义主题
monaco.editor.setTheme('my-theme');
```

### 4.3 动态主题切换

```javascript
// 主题切换组件
class ThemeSwitcher {
    constructor(editor) {
        this.editor = editor;
        this.currentTheme = 'vs-dark';
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'vs-dark' ? 'vs' : 'vs-dark';
        monaco.editor.setTheme(this.currentTheme);
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        monaco.editor.setTheme(themeName);
    }
}

// 使用
const themeSwitcher = new ThemeSwitcher(editor);
document.getElementById('theme-toggle').addEventListener('click', () => {
    themeSwitcher.toggle();
});
```

---

## 5. 语言支持

### 5.1 设置语言

```javascript
// 方式一：创建时指定语言
const editor = monaco.editor.create(container, {
    value: 'const x = 1;',
    language: 'javascript'
});

// 方式二：动态更改语言
monaco.editor.setModelLanguage(editor.getModel(), 'typescript');
```

### 5.2 支持的语言列表

Monaco Editor 支持 70+ 种语言，包括：

```javascript
const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp',
    'cpp', 'c', 'go', 'rust', 'ruby', 'php', 'swift',
    'kotlin', 'scala', 'html', 'css', 'scss', 'less',
    'json', 'xml', 'yaml', 'markdown', 'sql', 'shell',
    'powershell', 'dockerfile', 'graphql', 'plaintext'
];

// 设置语言
supportedLanguages.forEach(lang => {
    monaco.editor.setModelLanguage(model, lang);
});
```

### 5.3 自定义语言定义

```javascript
// 注册自定义语言
monaco.languages.register({ id: 'myLanguage' });

// 定义词法规则
monaco.languages.setMonarchTokensProvider('myLanguage', {
    tokenizer: {
        root: [
            [/\[error.*/, 'custom-error'],
            [/\[notice.*/, 'custom-notice'],
            [/\[info.*/, 'custom-info'],
            [/\[[a-zA-Z 0-9:]+\]/, 'custom-date'],
            [/<>/, 'custom-tag'],
            [/".*?"/, 'string'],
            [/\d+/, 'number'],
            [/[a-z_]\w*/, 'keyword']
        ]
    }
});

// 定义主题
monaco.editor.defineTheme('myLanguageTheme', {
    base: 'vs',
    inherit: false,
    rules: [
        { token: 'custom-error', foreground: 'ff0000', fontStyle: 'bold' },
        { token: 'custom-notice', foreground: 'FFA500' },
        { token: 'custom-info', foreground: '00ff00' },
        { token: 'custom-date', foreground: '008800' },
        { token: 'custom-tag', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'keyword', foreground: '0000FF' }
    ]
});
```

---

## 6. 编辑器事件

### 6.1 常用事件监听

```javascript
const editor = monaco.editor.create(container, {
    value: '// 示例代码',
    language: 'javascript'
});

// ===== 内容变化事件 =====
editor.onDidChangeModelContent((e) => {
    const content = editor.getValue();
    console.log('内容变化:', e.changes);
    console.log('当前内容:', content);

    // e.changes 包含所有变更
    e.changes.forEach(change => {
        console.log(`位置: ${change.rangeOffset},
                    文本: "${change.text}"`);
    });
});

// ===== 光标位置变化 =====
editor.onDidChangeCursorPosition((e) => {
    console.log('行:', e.position.lineNumber);
    console.log('列:', e.position.column);
});

// ===== 选区变化 =====
editor.onDidChangeCursorSelection((e) => {
    console.log('选区:', e.selection);
    console.log('选区开始:', e.selection.getStartPosition());
    console.log('选区结束:', e.selection.getEndPosition());
});

// ===== 内容滚动 =====
editor.onDidScrollChange((e) => {
    console.log('滚动位置:', e.scrollTop, e.scrollLeft);
});

// ===== 失去焦点 =====
editor.onDidBlurEditorWidget(() => {
    console.log('编辑器失去焦点');
});

// ===== 获得焦点 =====
editor.onDidFocusEditorWidget(() => {
    console.log('编辑器获得焦点');
});

// ===== 键入事件 =====
editor.onDidType((text) => {
    console.log('用户输入:', text);
});

// ===== 键盘快捷键事件 =====
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    console.log('保存快捷键触发');
    saveContent();
});
```

### 6.2 事件对象详解

```javascript
// onDidChangeModelContent 事件对象
editor.onDidChangeModelContent((event) => {
    // event.changes: 变更数组
    event.changes.forEach(change => {
        // change.range: 变更范围 {startLineNumber, startColumn, endLineNumber, endColumn}
        // change.rangeOffset: 变更起始位置（字符偏移）
        // change.rangeLength: 变更范围长度
        // change.text: 插入/替换的文本
    });

    // event.isFlush: 是否是刷新操作
    // event.versionId: 版本号
});

// onDidChangeCursorPosition 事件对象
editor.onDidChangeCursorPosition((event) => {
    // event.position: 当前光标位置 {lineNumber, column}
    // event.positionLineNumber: 行号
    // event.positionColumn: 列号
    // event.reason: 变化原因 (键盘、鼠标、编程)
});
```

---

## 7. 与 React 集成

### 7.1 使用 @monaco-editor/react

```bash
# 安装 React 封装库
npm install @monaco-editor/react
```

```jsx
import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = () => {
    const editorRef = useRef(null);

    // 编辑器挂载完成回调
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // 设置主题
        monaco.editor.defineTheme('custom-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e'
            }
        });
        monaco.editor.setTheme('custom-theme');

        // 获取焦点
        editor.focus();
    };

    // 内容变化回调
    const handleEditorChange = (value) => {
        console.log('当前内容:', value);
    };

    return (
        <div style={{ height: '500px' }}>
            <Editor
                height="100%"
                defaultLanguage="javascript"
                defaultValue="// 欢迎使用 Monaco Editor"
                theme="vs-dark"
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                }}
            />
        </div>
    );
};

export default CodeEditor;
```

### 7.2 完整 React 组件示例

```jsx
import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({
    initialCode = '',
    language = 'javascript',
    onSave,
    readOnly = false
}) => {
    const [code, setCode] = useState(initialCode);
    const [theme, setTheme] = useState('vs-dark');
    const editorRef = useRef(null);

    // 编辑器挂载回调
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;

        // 添加自定义命令
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (onSave) onSave(code);
        });

        // 配置 TypeScript 编译器选项
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            jsx: monaco.languages.typescript.JsxEmit.React
        });
    }, [onSave, code]);

    // 代码变化回调
    const handleEditorChange = useCallback((value) => {
        setCode(value || '');
    }, []);

    // 切换主题
    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'vs-dark' ? 'vs' : 'vs-dark');
    }, []);

    // 获取编辑器内容
    const getValue = useCallback(() => {
        return editorRef.current?.getValue() || '';
    }, []);

    // 设置编辑器内容
    const setValue = useCallback((newCode) => {
        editorRef.current?.setValue(newCode);
        setCode(newCode);
    }, []);

    // 格式化代码
    const formatCode = useCallback(() => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    }, []);

    return (
        <div className="code-editor">
            <div className="editor-toolbar">
                <button onClick={toggleTheme}>切换主题</button>
                <button onClick={formatCode}>格式化</button>
                <button onClick={() => onSave?.(code)}>保存</button>
            </div>
            <div className="editor-container" style={{ height: '500px' }}>
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    theme={theme}
                    onMount={handleEditorDidMount}
                    onChange={handleEditorChange}
                    options={{
                        readOnly,
                        minimap: { enabled: true },
                        fontSize: 14,
                        fontFamily: "'Fira Code', monospace",
                        fontLigatures: true,
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
```

---

## 8. 高级功能

### 8.1 代码补全 (Completions)

```javascript
// 注册代码补全提供者
monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };

        const suggestions = [
            {
                label: 'console.log',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'console.log(${1:message});$0',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: '输出日志到控制台',
                range
            },
            {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: '创建函数',
                range
            },
            {
                label: 'asyncFunction',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'async function ${1:name}(${2:params}) {\n\tconst result = await $3;\n\t$0\n\treturn result;\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: '创建异步函数',
                range
            },
            {
                label: 'useState',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'const [${1:state}, set${1:state}] = useState(${2:initialValue});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'React useState Hook',
                range
            }
        ];

        return { suggestions };
    }
});
```

### 8.2 错误诊断 (Diagnostics)

```javascript
// 注册诊断提供者
monaco.languages.registerDiagnosticsProvider('javascript', {
    provideDiagnostics: (model, severity) => {
        const markers = [];
        const content = model.getValue();

        // 示例：检测 console.log
        const consoleRegex = /console\.(log|debug|info|warn|error)\(/g;
        let match;

        while ((match = consoleRegex.exec(content)) !== null) {
            const startPos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);

            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
                message: '建议移除生产环境中的 console 语句',
                source: 'custom-linter'
            });
        }

        // 示例：检测未使用的变量
        // ... 更多诊断逻辑

        return markers;
    }
});

// 手动添加标记
monaco.editor.setModelMarkers(model, 'owner', [
    {
        severity: monaco.MarkerSeverity.Error,
        message: '语法错误: 缺少分号',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
    }
]);
```

### 8.3 代码折叠

```javascript
// 启用/禁用代码折叠
editor.updateOptions({
    folding: true,
    foldingStrategy: 'indentation' // 或 'brace'
});

// 注册折叠 provider
monaco.languages.registerFoldingRangeProvider('javascript', {
    provideFoldingRanges: (model, context, token) => {
        const ranges = [];
        const content = model.getValue();
        const lines = content.split('\n');

        // 简单示例：基于缩进的折叠
        let stack = [];

        lines.forEach((line, index) => {
            const indent = line.match(/^(\s*)/)[1].length;

            // 找到闭合的大括号
            if (line.includes('}')) {
                while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
                    const open = stack.pop();
                    if (open.indent < indent) {
                        ranges.push({
                            startLineNumber: open.line + 1,
                            endLineNumber: index + 1,
                            kind: monaco.languages.FoldingRangeKind.Region
                        });
                    }
                }
            }

            // 找到开始的大括号
            if (line.includes('{') && !line.includes('}')) {
                stack.push({ line: index, indent });
            }
        });

        return ranges;
    }
});
```

### 8.4 悬停提示 (Hover)

```javascript
// 注册悬停提示
monaco.languages.registerHoverProvider('javascript', {
    provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);

        if (!word) return null;

        // 示例：为特定关键字提供提示
        const hoverContent = {
            value: ''
        };

        if (word.word === 'console') {
            hoverContent.value = '**console** - 用于输出调试信息\n\n' +
                '- console.log() - 普通日志\n' +
                '- console.error() - 错误信息\n' +
                '- console.warn() - 警告信息';
        } else if (word.word === 'useState') {
            hoverContent.value = '**useState** - React Hook\n\n' +
                '用于在函数组件中添加状态。\n\n```jsx\n' +
                'const [state, setState] = useState(initialValue);\n```';
        }

        if (hoverContent.value) {
            return {
                range: new monaco.Range(
                    position.lineNumber,
                    word.startColumn,
                    position.lineNumber,
                    word.endColumn
                ),
                contents: [hoverContent]
            };
        }

        return null;
    }
});
```

### 8.5 跳转定义 (Goto Definition)

```javascript
// 注册定义跳转
monaco.languages.registerDefinitionProvider('javascript', {
    provideDefinition: (model, position) => {
        const word = model.getWordAtPosition(position);

        if (!word) return null;

        // 示例：根据单词查找定义位置
        const definitions = findDefinitions(word.word);

        return definitions.map(def => ({
            uri: model.uri,
            range: new monaco.Range(
                def.line, def.column,
                def.line, def.column
            )
        }));
    }
});

// 示例：查找定义
function findDefinitions(symbolName) {
    // 从符号表或 AST 中查找定义位置
    return [
        { line: 10, column: 5, file: 'source.js' }
    ];
}
```

---

## 9. 项目中的实际使用示例

### 9.1 在线代码编辑器场景

```jsx
// 项目中的实际代码编辑器组件
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button, Select, Space, message } from 'antd';

const CodeEditor = () => {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// 编写你的代码\n');
    const [theme, setTheme] = useState('vs-dark');
    const [isRunning, setIsRunning] = useState(false);
    const editorRef = useRef(null);

    const languages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' }
    ];

    // 编辑器挂载
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // 自定义主题
        monaco.editor.defineTheme('project-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'keyword', foreground: 'C586C0' },
                { token: 'string', foreground: 'CE9178' }
            ],
            colors: {
                'editor.background': '#1E1E1E'
            }
        });

        // 添加自定义补全
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: () => ({
                suggestions: [
                    {
                        label: 'log',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'console.log($1);',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: '输出日志'
                    },
                    {
                        label: 'async',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'async function ${1:name}() {\n\tawait $2\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: '异步函数'
                    }
                ]
            })
        });

        // 聚焦编辑器
        editor.focus();
    };

    // 运行代码
    const runCode = async () => {
        setIsRunning(true);
        try {
            // 模拟代码执行
            const result = await executeCode(code, language);
            message.success('代码执行完成');
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsRunning(false);
        }
    };

    // 保存代码
    const saveCode = () => {
        localStorage.setItem('saved-code', code);
        message.success('代码已保存');
    };

    // 格式化代码
    const formatCode = () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    };

    return (
        <div className="code-editor-container">
            <div className="editor-toolbar">
                <Space>
                    <Select
                        value={language}
                        onChange={setLanguage}
                        options={languages}
                        style={{ width: 120 }}
                    />
                    <Select
                        value={theme}
                        onChange={setTheme}
                        options={[
                            { value: 'vs', label: 'Light' },
                            { value: 'vs-dark', label: 'Dark' }
                        ]}
                        style={{ width: 100 }}
                    />
                    <Button onClick={formatCode}>格式化</Button>
                    <Button onClick={saveCode}>保存</Button>
                    <Button
                        type="primary"
                        onClick={runCode}
                        loading={isRunning}
                    >
                        运行
                    </Button>
                </Space>
            </div>
            <div className="editor-wrapper" style={{ height: 'calc(100vh - 120px)' }}>
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    theme={theme}
                    onMount={handleEditorDidMount}
                    onChange={(value) => setCode(value || '')}
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        fontFamily: "'Fira Code', Consolas, monospace",
                        fontLigatures: true,
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true,
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
```

### 9.2 多文件编辑器标签页

```jsx
// 多文件标签页编辑器
import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, Button, message } from 'antd';

const MultiFileEditor = ({ files = [] }) => {
    const [activeFile, setActiveFile] = useState(files[0]?.name);
    const [fileContents, setFileContents] = useState(
        files.reduce((acc, file) => ({ ...acc, [file.name]: file.content }), {})
    );
    const editorRef = useRef(null);

    // 获取当前文件内容
    const currentContent = fileContents[activeFile] || '';

    // 获取当前文件语言
    const getLanguage = (filename) => {
        const ext = filename.split('.').pop();
        const langMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown'
        };
        return langMap[ext] || 'plaintext';
    };

    // 内容变化处理
    const handleEditorChange = useCallback((value) => {
        setFileContents(prev => ({
            ...prev,
            [activeFile]: value || ''
        }));
    }, [activeFile]);

    // 编辑器挂载
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
    }, []);

    // 切换文件
    const handleTabChange = (key) => {
        setActiveFile(key);
    };

    // 保存当前文件
    const handleSave = useCallback(() => {
        // 保存逻辑
        message.success(`已保存 ${activeFile}`);
    }, [activeFile]);

    return (
        <div className="multi-file-editor">
            <Tabs
                activeKey={activeFile}
                onChange={handleTabChange}
                items={files.map(file => ({
                    key: file.name,
                    label: (
                        <span>
                            {file.name}
                            <Button
                                type="text"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // 关闭文件
                                }}
                            >
                                ×
                            </Button>
                        </span>
                    )
                }))}
            />
            <Editor
                height="calc(100% - 40px)"
                language={getLanguage(activeFile)}
                value={currentContent}
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                }}
            />
        </div>
    );
};

export default MultiFileEditor;
```

### 9.3 协作编辑场景

```javascript
// 与 Yjs 集成的协作编辑
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';

const CollaborativeEditor = ({ roomId }) => {
    const [editor, setEditor] = useState(null);
    const [monaco, setMonaco] = useState(null);
    const ydocRef = useRef(null);
    const bindingRef = useRef(null);

    // 初始化 Yjs 文档
    useEffect(() => {
        ydocRef.current = new Y.Doc();

        // 连接到 WebSocket Provider
        // const provider = new WebsocketProvider(
        //     'ws://localhost:1234',
        //     roomId,
        //     ydocRef.current
        // );

        return () => {
            bindingRef.current?.destroy();
            // provider?.destroy();
            ydocRef.current?.destroy();
        };
    }, [roomId]);

    // 编辑器挂载后绑定 Yjs
    const handleEditorDidMount = (editor, monaco) => {
        setEditor(editor);
        setMonaco(monaco);

        if (ydocRef.current) {
            const ytext = ydocRef.current.getText('monaco');

            // 创建 Monaco 与 Yjs 的绑定
            bindingRef.current = new MonacoBinding(
                ytext,
                editor.getModel(),
                new Set([editor]),
                monaco.editor.WireConfiguration
            );
        }
    };

    return (
        <Editor
            defaultLanguage="javascript"
            onMount={handleEditorDidMount}
            options={{
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: true }
            }}
        />
    );
};

export default CollaborativeEditor;
```

---

## 10. Monaco Editor 源码实现深度解析

### 10.1 Web Worker 架构

Monaco Editor 为了保证编辑器在处理复杂任务时不阻塞主线程，采用了 Web Worker 架构将耗时操作转移到后台线程执行。

```
┌─────────────────────────────────────────────────────────────────┐
│                 Monaco Editor Web Worker 架构                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   主线程 (Main Thread)                                         │
│   ┌─────────────────────────────────────────────────┐          │
│   │  UI 渲染                                           │          │
│   │  用户输入处理                                       │          │
│   │  文本模型管理                                       │          │
│   └────────────────────┬────────────────────────────┘          │
│                        │                                           │
│                        ▼                                           │
│   ┌─────────────────────────────────────────────────┐          │
│   │              消息通信 (postMessage)               │          │
│   └────────────────────┬────────────────────────────┘          │
│                        │                                           │
├────────────────────────┼────────────────────────────────────────┤
│                        │                                           │
│                        ▼                                           │
│   Worker 线程 (Background Thread)                              │
│   ┌─────────────────────────────────────────────────┐          │
│   │  语言服务 Worker                                    │          │
│   │  - 文本分析和解析                                  │          │
│   │  - 语法高亮计算                                    │          │
│   │  - 代码补全建议                                    │          │
│   │  - 错误诊断                                        │          │
│   └─────────────────────────────────────────────────┘          │
│   ┌─────────────────────────────────────────────────┐          │
│   │  本地化 Worker (nls)                              │          │
│   │  - 国际化字符串处理                                │          │
│   │  - 多语言支持                                      │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Worker 配置实现

在项目中使用 Web Worker 需要正确配置：

```javascript
// vite.config.js 配置
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    monacoEditorPlugin.default({
      // 自定义 Workers
      workers: [
        {
          // JSON 语言服务
          label: 'json',
          entry: 'monaco-editor/esm/vs/language/json/json.worker'
        },
        {
          // CSS/SCSS/Less 语言服务
          label: 'css',
          entry: 'monaco-editor/esm/vs/language/css/css.worker'
        },
        {
          // HTML 语言服务
          label: 'html',
          entry: 'monaco-editor/esm/vs/language/html/html.worker'
        },
        {
          // TypeScript/JavaScript 语言服务
          label: 'typescript',
          entry: 'monaco-editor/esm/vs/language/typescript/ts.worker'
        },
        {
          // 编辑器核心 Worker
          label: 'editorWorker',
          entry: 'monaco-editor/esm/vs/editor/editor.worker'
        }
      ]
    })
  ]
});
```

### 10.3 Monaco Editor 核心模块

```typescript
// Monaco Editor 核心模块结构

// 1. 编辑器核心
import { editor } from 'monaco-editor';

// 创建编辑器实例
const editorInstance = editor.create(container, options);

// 2. 语言服务
import { languages } from 'monaco-editor';

// 注册语言
languages.register({ id: 'myLanguage' });
languages.setMonarchTokensProvider('myLanguage', tokenizer);

// 3. 主题系统
import { editor as monacoEditor } from 'monaco-editor';

// 定义主题
monacoEditor.defineTheme('myTheme', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {}
});
```

### 10.4 编辑器模型架构

```typescript
// Monaco Editor 模型层次结构

// 1. ITextModel - 文本模型
interface ITextModel {
  // 获取文本内容
  getValue(): string;

  // 获取指定行
  getLineContent(lineNumber: number): string;

  // 获取单词
  getWordAtPosition(position: IPosition): IWordAtPosition;

  // 获取装饰线（用于高亮错误等）
  getDecorations(options?: IModelDecorationOptions): IModelDecoration[];
}

// 2. IEditOperation - 编辑操作
interface IEditOperation {
  range: IRange;
  text: string;
}

// 应用编辑
model.applyEdits([
  {
    range: new Range(1, 1, 1, 1),
    text: '// 新增代码\n'
  }
]);

// 3. IPosition - 位置
interface IPosition {
  lineNumber: number;  // 行号
  column: number;      // 列号
}

// 4. IRange - 范围
interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}
```

### 10.5 语言服务扩展

```typescript
// 自定义语言服务实现

// 1. 注册自定义语言
monaco.languages.register({ id: 'customLang' });

// 2. 定义词法分析器
monaco.languages.setMonarchTokensProvider('customLang', {
  tokenizer: {
    root: [
      // 关键字
      [/function|return|if|else/, 'keyword'],
      // 字符串
      [/"[^"]*"/, 'string'],
      // 数字
      [/\d+/, 'number'],
      // 注释
      [/\/\/.*$/, 'comment'],
      // 标识符
      [/[a-zA-Z_]\w*/, 'identifier']
    ]
  }
});

// 3. 注册自动补全提供者
monaco.languages.registerCompletionItemProvider('customLang', {
  provideCompletionItems: (model, position) => {
    const suggestions = [
      {
        label: 'hello',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'function hello() {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '输出 hello'
      }
    ];

    return { suggestions };
  }
});
```

### 10.6 性能优化技巧

```typescript
// Monaco Editor 性能优化

// 1. 禁用不必要的功能
const editor = monaco.editor.create(container, {
  // 禁用迷你地图（大型文件）
  minimap: { enabled: false },

  // 禁用代码折叠
  folding: false,

  // 禁用渲染空白字符
  renderWhitespace: 'none',

  // 禁用渲染控制字符
  renderControlCharacters: false,

  // 禁用快速建议
  quickSuggestions: false,

  // 限制渲染频率
  renderingOnlyFirstLine: false
});

// 2. 使用模型池管理多个编辑器
const models = new Map<string, ITextModel>();

function getOrCreateModel(uri: Uri): ITextModel {
  let model = models.get(uri.toString());

  if (!model) {
    model = monaco.editor.createModel(
      content,
      language,
      uri
    );
    models.set(uri.toString(), model);
  }

  return model;
}

// 3. 大文件处理策略
function handleLargeFile(content: string) {
  // 分块加载
  const CHUNK_SIZE = 10000;
  if (content.length > CHUNK_SIZE) {
    // 初始只显示部分内容
    const initialContent = content.substring(0, CHUNK_SIZE);
    const remainingContent = content.substring(CHUNK_SIZE);

    // 在用户滚动时逐步加载
    editor.onDidScrollChange((e) => {
      if (e.scrollTopChanged) {
        // 动态加载更多内容
      }
    });
  }
}

// 4. 事件节流
editor.onDidChangeModelContent(
  debounce((e) => {
    // 处理内容变化
    handleContentChange(e);
  }, 300)
);
```

---

## 总结

Monaco Editor 是一个功能强大的代码编辑器，提供了 VS Code 级别的编辑体验。通过本教程，你应该能够：

1. **基础使用**：创建和配置 Monaco Editor 实例
2. **主题定制**：创建自定义主题和动态切换
3. **语言支持**：配置多种编程语言和高亮
4. **事件处理**：监听和处理编辑器事件
5. **React 集成**：在 React 项目中使用 Monaco
6. **高级功能**：实现代码补全、错误诊断、悬停提示等
7. **项目实践**：构建实际的代码编辑功能

在 WebEnv 项目中，Monaco Editor 用于实现浏览器端的代码编辑功能，支持多种语言语法高亮、智能代码补全、错误提示等特性，为用户提供接近本地 IDE 的编辑体验。

---

## 参考资源

- [Monaco Editor 官方文档](https://microsoft.github.io/monaco-editor/)
- [@monaco-editor/react 文档](https://github.com/suren-atoyan/monaco-react)
- [Monaco Editor NPM 包](https://www.npmjs.com/package/monaco-editor)
