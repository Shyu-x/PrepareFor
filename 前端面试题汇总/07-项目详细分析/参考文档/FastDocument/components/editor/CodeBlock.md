# CodeBlock 组件

## 概述

CodeBlock(代码块)组件用于在文档中展示代码片段。支持语法高亮、行号显示、代码复制、语言选择等功能。该组件使用 Prism.js 或 highlight.js 进行语法高亮显示。

## Props 接口

```typescript
interface CodeBlockProps {
  // 代码内容
  code: string;
  language?: string;

  // 编辑配置
  editable?: boolean;
  onChange?: (code: string) => void;

  // 显示配置
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showLanguageSelector?: boolean;
  maxHeight?: number | string;

  // 主题配置
  theme?: 'light' | 'dark' | 'auto';

  // 样式
  className?: string;
  style?: React.CSSProperties;
}
```

## 内部状态

```typescript
interface CodeBlockState {
  code: string;
  language: string;
  isEditing: boolean;
  copied: boolean;
  isHovered: boolean;
  selectedLines: number[];  // 选中的行
}
```

## 支持的语言

```typescript
const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', aliases: ['js'] },
  { id: 'typescript', name: 'TypeScript', aliases: ['ts'] },
  { id: 'python', name: 'Python', aliases: ['py'] },
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#', aliases: ['cs'] },
  { id: 'cpp', name: 'C++', aliases: ['c++', 'c'] },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'ruby', name: 'Ruby', aliases: ['rb'] },
  { id: 'php', name: 'PHP' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin', aliases: ['kt'] },
  { id: 'sql', name: 'SQL' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'scss', name: 'SCSS' },
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML', aliases: ['yml'] },
  { id: 'markdown', name: 'Markdown', aliases: ['md'] },
  { id: 'bash', name: 'Bash', aliases: ['sh', 'shell', 'zsh'] },
  { id: 'powershell', name: 'PowerShell', aliases: ['ps1'] },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'graphql', name: 'GraphQL', aliases: ['gql'] },
];
```

## 核心逻辑实现

### 1. 语法高亮

```typescript
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
// ... 其他语言

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'javascript',
  theme = 'dark',
}) => {
  const codeRef = useRef<HTMLElement>(null);

  // 语法高亮
  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[language] || Prism.languages.plaintext;
    return Prism.highlight(code, grammar, language);
  }, [code, language]);

  return (
    <pre className={`code-block theme-${theme}`}>
      <code
        ref={codeRef}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
};
```

### 2. 行号显示

```typescript
const CodeBlockWithLineNumbers: React.FC<CodeBlockProps> = ({
  code,
  showLineNumbers = true,
}) => {
  const lines = code.split('\n');

  return (
    <pre className="code-block with-line-numbers">
      <div className="line-numbers">
        {lines.map((_, index) => (
          <span key={index} className="line-number">
            {index + 1}
          </span>
        ))}
      </div>
      <code>
        {lines.map((line, index) => (
          <div key={index} className="code-line">
            {line || ' '}
          </div>
        ))}
      </code>
    </pre>
  );
};
```

### 3. 代码复制功能

```typescript
const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button
      className={`copy-button ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <CheckIcon size={14} />
          <span>已复制</span>
        </>
      ) : (
        <>
          <CopyIcon size={14} />
          <span>复制</span>
        </>
      )}
    </button>
  );
};
```

### 4. 可编辑模式

```typescript
const EditableCodeBlock: React.FC<CodeBlockProps> = ({
  code: initialCode,
  editable = true,
  onChange,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 同步滚动
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = e.currentTarget.nextSibling as HTMLElement;
    if (pre) {
      pre.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="editable-code-block">
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            onChange?.(e.target.value);
          }}
          onScroll={handleScroll}
          className="code-textarea"
          spellCheck={false}
        />
      ) : (
        <CodeBlock code={code} />
      )}

      <div className="code-block-actions">
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? '完成' : '编辑'}
        </button>
      </div>
    </div>
  );
};
```

## 样式实现

```scss
.code-block {
  position: relative;
  border-radius: 12px;
  overflow: hidden;

  &.theme-dark {
    background: #1e1e1e;
    color: #d4d4d4;

    .line-number {
      color: #6e7681;
      border-right: 1px solid #30363d;
    }
  }

  &.theme-light {
    background: #f6f8fa;
    color: #24292f;

    .line-number {
      color: #8b949e;
      border-right: 1px solid #d0d7de;
    }
  }

  pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 14px;
    line-height: 1.6;
  }

  // 语法高亮颜色
  .token {
    &.comment { color: #6a9955; }
    &.string { color: #ce9178; }
    &.keyword { color: #569cd6; }
    &.function { color: #dcdcaa; }
    &.number { color: #b5cea8; }
    &.operator { color: #d4d4d4; }
    &.class { color: #4ec9b0; }
    &.variable { color: #9cdcfe; }
  }
}
```

## 性能优化点

### 1. 代码高亮缓存

```typescript
// 使用 WeakMap 缓存高亮结果
const highlightCache = new WeakMap<CodeBlockProps, string>();

const getHighlightedCode = (code: string, language: string): string => {
  const key = { code, language };
  const cached = highlightCache.get(key);
  if (cached) return cached;

  const result = Prism.highlight(code, Prism.languages[language], language);
  highlightCache.set(key, result);
  return result;
};
```

### 2. 防抖更新

```typescript
const debouncedOnChange = useMemo(
  () => debounce((code: string) => {
    onChange?.(code);
  }, 500),
  [onChange]
);
```

### 3. 只渲染可见行

```typescript
// 对于超长代码,只渲染可见区域
const VisibleCodeBlock: React.FC<CodeBlockProps> = ({
  code,
  maxHeight = 400,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });

  // 根据滚动位置更新可见范围
  const handleScroll = useCallback((scrollTop: number) => {
    const LINE_HEIGHT = 22;
    const start = Math.floor(scrollTop / LINE_HEIGHT);
    setVisibleRange({
      start: Math.max(0, start - 5),
      end: start + Math.ceil(maxHeight / LINE_HEIGHT) + 5,
    });
  }, [maxHeight]);

  // 只渲染可见行
  const visibleLines = useMemo(() => {
    return code.split('\n').slice(visibleRange.start, visibleRange.end);
  }, [code, visibleRange]);

  return (
    <div onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}>
      {/* 代码渲染 */}
    </div>
  );
};
```

## 使用示例

### 基本用法

```tsx
import { CodeBlock } from '@/components/CodeBlock';

function Article() {
  return (
    <CodeBlock
      code={`function hello(name) {
  console.log(\`Hello, \${name}!\`);
}`}
      language="javascript"
      showLineNumbers={true}
      showCopyButton={true}
    />
  );
}
```

### 可编辑代码块

```tsx
<CodeBlock
  code="// 在此编写代码"
  language="typescript"
  editable={true}
  onChange={(newCode) => console.log(newCode)}
/>
```

### 深色主题

```tsx
<CodeBlock
  code={pythonCode}
  language="python"
  theme="dark"
  maxHeight={300}
  showLanguageSelector={true}
/>
```
