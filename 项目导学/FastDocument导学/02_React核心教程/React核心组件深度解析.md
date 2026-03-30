# React 核心组件深度解析

## 一、组件架构概览

### 1.1 组件分层结构

FastDocument 项目采用分层组件架构，清晰分离不同职责的组件：

```
components/
├── 页面级组件 (Page Level)          # 整个页面级别的组件
│   ├── Dashboard.tsx                   # 仪表盘/文档列表
│   ├── Editor.tsx                      # 文档编辑器
│   ├── VideoConference.tsx               # 视频会议
│   ├── KnowledgeBaseView.tsx              # 知识库视图
│   └── ProjectView.tsx                  # 项目视图
│
├── 编辑器核心 (Editor Core)           # 编辑器核心功能
│   ├── VirtualEditor.tsx                # 虚拟编辑器（高性能渲染）
│   ├── BubbleMenu.tsx                    # 气泡菜单
│   ├── BlockTransformMenu.tsx             # 块类型转换菜单
│   └── Annotation.tsx                    # 注解组件
│
├── 块组件 (Block Components)         # 原子化块组件
│   ├── TextBlock.tsx                     # 文本块
│   ├── TodoBlock.tsx                     # 待办事项块
│   ├── CodeBlock.tsx                     # 代码块
│   ├── TableBlock.tsx                     # 表格块
│   ├── ImageBlock.tsx                     # 图片块
│   └── CalloutBlock.tsx                   # 提示框块
│
├── 布局组件 (Layout Components)      # 布局相关组件
│   ├── Sidebar.tsx                       # 侧边栏
│   ├── Header.tsx                        # 顶部导航
│   ├── UnifiedLayout.tsx                 # 统一布局
│   └── MeetingLayout.tsx                 # 会议布局
│
├── 面板组件 (Panel Components)        # 各种面板组件
│   ├── CommentPanel.tsx                   # 评论面板
│   ├── ParticipantPanel.tsx               # 参与者面板
│   ├── NotificationPanel.tsx              # 通知面板
│   ├── VersionHistoryPanel.tsx             # 版本历史面板
│   └── DocumentOutline.tsx                # 文档大纲
│
├── 项目管理 (Project Management)       # 项目管理相关组件
│   ├── KanbanBoard.tsx                   # 看板视图
│   ├── GanttChart.tsx                    # 甘特图
│   ├── CalendarView.tsx                   # 日历视图
│   └── TaskCard.tsx                      # 任务卡片
│
├── 协作组件 (Collaboration)          # 实时协作组件
│   ├── ChatDrawer.tsx                     # 聊天抽屉
│   ├── ChatPanel.tsx                      # 聊天面板
│   └── MeetingControlBar.tsx              # 会议控制栏
│
├── 分享组件 (Sharing)                 # 分享相关组件
│   ├── ShareDialog.tsx                    # 分享对话框
│   └── KnowledgeShareModal.tsx             # 知识库分享弹窗
│
├── 平台适配 (Platform Adaptation)     # 移动端/平板适配
│   ├── mobile/                           # 移动端组件
│   │   └── BottomNav.tsx                 # 底部导航
│   └── tablet/                           # 平板端组件
│
└── 工具组件 (Utility Components)      # 工具类组件
    ├── ThemeProvider.tsx                  # 主题提供者
    ├── DeviceSelector.tsx                  # 设备选择器
    └── NetworkIndicator.tsx               # 网络指示器
```

---

## 二、核心组件解析

### 2.1 Dashboard 组件详解

**文件路径**：`src/components/Dashboard.tsx`

**组件描述**：文档仪表盘/文档列表，负责显示所有文档、收藏文档、回收站文档，提供创建、搜索、分类管理等功能。

#### 2.1.1 组件代码分析

```typescript
"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Clock,
  Layout,
  Star,
  ChevronRight,
  PlusCircle,
  Shapes,
  Trash2,
  RefreshCcw,
  MoreVertical,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentStore } from "@/store/documentStore";
import { getTemplatesByCategory, templateCategories } from "@/data/templates";
import { useTheme } from "@/components/ThemeProvider";
import { Dropdown, Modal, message } from "antd";

/**
 * 极简文档中心
 * 聚焦于"新建"与"分类管理"
 */
export const Dashboard: React.FC<{
  category?: string;              // 当前分类：all | starred | trash
  onCreateDoc: () => void;       // 创建文档回调
  onOpenDoc: (id: string) => void; // 打开文档回调
  onCreateFromTemplate?: (template: string) => void; // 从模板创建回调
  onImportFile?: () => void;     // 导入文件回调
}> = ({
  category = "all",              // 默认显示所有文档
  onCreateDoc,
  onOpenDoc,
  onCreateFromTemplate,
  onImportFile,
}) => {
  // 主题状态
  const { isMounted, theme } = useTheme();
  const [docs, setDocs] = useState<any[]>([]);         // 当前分类的文档列表
  const [allDocs, setAllDocs] = useState<any[]>([]);    // 所有文档（用于收藏/回收站）
  const [loading, setLoading] = useState(true);           // 加载状态
  const [showTemplateModal, setShowTemplateModal] = useState(false); // 模板弹窗显示
  const [showSelectDocModal, setShowSelectDocModal] = useState(false); // 文档选择弹窗
  const [selectDocType, setSelectDocType] = useState<'starred' | 'trash'>('starred'); // 选择文档类型
  const [selectedCategory, setSelectedCategory] = useState("all"); // 选中的分类
  const [searchKeyword, setSearchKeyword] = useState(""); // 搜索关键词
  const [selectDocSearch, setSelectDocSearch] = useState(""); // 文档选择弹窗搜索

  // 从 Store 获取方法
  const { fetchDocumentsByCategory, fetchDocuments, toggleStar, moveToTrash, restoreFromTrash, permanentlyDelete } = useDocumentStore();

  const isDark = isMounted && theme.isDark;

  // 加载当前分类的文档
  const loadDocs = async () => {
    setLoading(true);
    const data = await fetchDocumentsByCategory(category as any);
    setDocs(data);
    setLoading(false);
  };

  // 加载所有文档（用于收藏/回收站）
  const loadAllDocs = async () => {
    const allData = await fetchDocuments();
    setAllDocs(allData);
  };

  // 打开文档选择弹窗
  const handleOpenSelectDocModal = async (type: 'starred' | 'trash') => {
    setSelectDocType(type);
    await loadAllDocs(); // 加载所有文档
    setShowSelectDocModal(true);
  };

  // 添加到收藏
  const handleAddToStarred = async (docId: string) => {
    await toggleStar(docId);
    message.success("已添加到收藏夹");
    loadDocs(); // 重新加载文档列表
  };

  // 移动到回收站
  const handleAddToTrash = async (docId: string) => {
    await moveToTrash(docId);
    message.success("已移至回收站");
    loadDocs();
  };

  // 初始化加载文档
  useEffect(() => {
    loadDocs();
  }, [category]);

  // 切换收藏状态
  const handleToggleStar = async (id: string) => {
    await toggleStar(id);
    loadDocs();
  };

  // 处理文档操作
  const handleAction = async (action: string, id: string) => {
    if (action === "trash") await moveToTrash(id);
    if (action === "restore") await restoreFromTrash(id);
    if (action === "delete") {
      Modal.confirm({
        title: "确定永久删除该文档吗？",
        content: "此操作不可恢复",
        onOk: async () => {
          await permanentlyDelete(id);
          message.success("已永久删除");
          loadDocs();
        },
      });
    }
  };

  // 渲染文档卡片
  const renderDocCard = (doc: any) => {
    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={`doc-card ${isDark ? 'dark' : 'light'}`}
        onClick={() => onOpenDoc(doc.id)}
      >
        <div className="doc-card-header">
          <div className="doc-icon">
            <Layout size={24} />
          </div>
          <div className="doc-actions">
            <Dropdown
              menu={{
                items: [
                  { key: 'star', label: '收藏', icon: <Star size={14} /> },
                  { key: 'trash', label: '移至回收站', icon: <Trash2 size={14} /> },
                ]
              }}
              trigger={['click']}
            >
              <MoreVertical size={16} className="action-icon" />
            </Dropdown>
          </div>
        </div>
        <div className="doc-title">{doc.title}</div>
        <div className="doc-meta">
          <Clock size={12} />
          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`dashboard ${isDark ? 'dark' : 'light'}`}>
      {/* 顶部操作栏 */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="dashboard-title">
            {category === 'all' && '全部文档'}
            {category === 'starred' && '收藏文档'}
            {category === 'trash' && '回收站'}
          </h2>
          <div className="category-tabs">
            {templateCategories.map(cat => (
              <button
                key={cat.id}
                className={`tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <X size={16} onClick={() => setSearchKeyword('')} />
            )}
          </div>
          <button
            className="btn-primary"
            onClick={onCreateDoc}
          >
            <Plus size={16} />
            新建文档
          </button>
        </div>
      </div>

      {/* 文档列表 */}
      <div className="docs-grid">
        <AnimatePresence mode="popLayout">
          {loading ? (
            // 加载状态
            [...Array(6)].map((_, i) => (
              <div key={i} className="doc-card skeleton">
                <div className="skeleton-title" />
                <div className="skeleton-meta" />
              </div>
            ))
          ) : (
            // 实际文档
            docs
              .filter(doc => !searchKeyword || doc.title.toLowerCase().includes(searchKeyword.toLowerCase()))
              .map(renderDocCard)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
```

#### 2.1.2 关键特性

1. **分类管理**
   - 支持三种分类：全部文档 (`all`)、收藏文档 (`starred`)、回收站 (`trash`)
   - 通过 URL 参数或状态切换分类
   - 自动过滤和显示对应分类的文档

2. **搜索功能**
   - 实时搜索，输入时立即过滤文档列表
   - 支持文档标题模糊搜索
   - 提供清除搜索按钮

3. **文档操作**
   - 快速操作：收藏、移至回收站
   - 下拉菜单：支持更多操作
   - 永久删除：需要二次确认

4. **动画效果**
   - 使用 Framer Motion 实现卡片加载动画
   - 使用 AnimatePresence 实现添加/删除动画
   - 骨架屏：加载时显示骨架屏

5. **状态管理**
   - 使用 Zustand Store 获取文档数据和操作方法
   - 本地状态管理 UI 状态（弹窗、搜索、加载等）

---

### 2.2 Editor 组件详解

**文件路径**：`src/components/Editor.tsx`

**组件描述**：文档编辑器核心组件，提供完整的文档编辑功能，包括工具栏、块编辑、格式化、导入导出等。

#### 2.2.1 组件代码分析

```typescript
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useDocumentStore, Block } from "@/store/documentStore";
import { socketClient } from "@/lib/socket";
import { exportDocument, importDocument } from "@/lib/export";
import { useTheme } from "@/components/ThemeProvider";
import { DocumentMenuBar } from "@/components/DocumentMenuBar";
import { DocumentOutline } from "@/components/DocumentOutline";
import { BubbleMenu } from "@/components/BubbleMenu";
import { VirtualEditor } from "@/components/VirtualEditor";
import { Checkbox, Typography, Tooltip, Dropdown, MenuProps, message } from "antd";
import {
  GripVertical,
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Info,
  Plus,
  Trash,
  Minus,
  Code,
  X,
  Image,
  Table,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  MessageSquare,
  MoreHorizontal,
  Download,
  Upload,
  FileText,
  FileCode,
  FileImage,
  File,
  Brain,
  GitBranch,
  Calculator,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { ChatDrawer } from "@/components/ChatDrawer";
import { CommentPanel } from "@/components/CommentPanel";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ImageBlock } from "@/components/ImageBlock";
import { CodeBlock } from "@/components/CodeBlock";
import { TableBlock } from "@/components/TableBlock";
import { TodoBlock } from "@/components/TodoBlock";
import { CalloutBlock } from "@/components/CalloutBlock";

const { Title } = Typography;

// --- Helper Functions ---

/**
 * 处理文本格式化
 * 使用 document.execCommand（虽然已废弃，但项目仍在使用）
 */
const handleFormat = (format: string) => {
  const selection = window.getSelection();
  if (!selection || selection.toString().length === 0) {
    return;
  }

  switch (format) {
    case 'bold': document.execCommand('bold', false); break;
    case 'italic': document.execCommand('italic', false); break;
    case 'underline': document.execCommand('underline', false); break;
    case 'strikethrough': document.execCommand('strikeThrough', false); break;
    case 'highlight': document.execCommand('hiliteColor', false, '#fef08a'); break;
    case 'alignLeft': document.execCommand('justifyLeft', false); break;
    case 'alignCenter': document.execCommand('justifyCenter', false); break;
    case 'alignRight': document.execCommand('justifyRight', false); break;
    case 'code': document.execCommand('formatBlock', false, 'PRE'); break;
    case 'link':
      const url = prompt('Enter link URL:');
      if (url) document.execCommand('createLink', false, url);
      break;
    case 'comment':
      message.info("批注功能：请使用侧边栏或浮动菜单");
      break;
    default: break;
  }
};

// --- Components ---

/**
 * 编辑器工具栏
 * 提供格式化、块插入、导入导出等功能
 */
const EditorToolbar: React.FC = () => {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const { addBlock, title, setTitle, setBlocks } = useDocumentStore();
  const { isMounted, theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = isMounted && theme.isDark;

  // 块类型菜单
  const blockTypeMenuItems: MenuProps['items'] = [
    { key: 'text', label: '文本', icon: <Type size={14} /> },
    { key: 'h1', label: '标题 1', icon: <Heading1 size={14} /> },
    { key: 'h2', label: '标题 2', icon: <Heading2 size={14} /> },
    { key: 'h3', label: '标题 3', icon: <Heading3 size={14} /> },
    { key: 'todo', label: '待办事项', icon: <CheckSquare size={14} /> },
    { key: 'divider', label: '分隔线', icon: <Minus size={14} /> },
    { key: 'code', label: '代码块', icon: <Code size={14} /> },
    { type: 'divider' },
    { key: 'image', label: '图片', icon: <Image size={14} /> },
    { key: 'table', label: '表格', icon: <Table size={14} /> },
  ];

  // 处理添加块
  const handleAddBlock = (key: string) => {
    addBlock(key as Block['type']);
    setShowBlockMenu(false);
  };

  // 处理导出
  const handleExport = () => {
    exportDocument();
  };

  // 处理导入
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const content = await importDocument(file);
        if (content) {
          // 解析导入内容为块
          const blocks = parseImportContent(content);
          setBlocks(blocks);
          message.success("导入成功");
        }
      } catch (error) {
        message.error("导入失败");
      }
    }
  };

  return (
    <div className={`editor-toolbar ${isDark ? 'dark' : 'light'}`}>
      {/* 块类型下拉菜单 */}
      <Dropdown
        menu={{
          items: blockTypeMenuItems,
          onClick: ({ key }) => handleAddBlock(key as string),
        }}
        trigger={['click']}
      >
        <button className="toolbar-btn">
          <Plus size={16} />
          添加块
          <ChevronDown size={14} />
        </button>
      </Dropdown>

      {/* 文本格式化工具 */}
      <div className="toolbar-divider" />
      <Tooltip title="加粗 (Ctrl+B)">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('bold')}
        >
          <Bold size={16} />
        </button>
      </Tooltip>
      <Tooltip title="斜体 (Ctrl+I)">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('italic')}
        >
          <Italic size={16} />
        </button>
      </Tooltip>
      <Tooltip title="下划线 (Ctrl+U)">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('underline')}
        >
          <Underline size={16} />
        </button>
      </Tooltip>
      <Tooltip title="删除线 (Ctrl+Shift+X)">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('strikethrough')}
        >
          <Strikethrough size={16} />
        </button>
      </Tooltip>

      {/* 对齐工具 */}
      <div className="toolbar-divider" />
      <Tooltip title="左对齐">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('alignLeft')}
        >
          <AlignLeft size={16} />
        </button>
      </Tooltip>
      <Tooltip title="居中对齐">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('alignCenter')}
        >
          <AlignCenter size={16} />
        </button>
      </Tooltip>
      <Tooltip title="右对齐">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('alignRight')}
        >
          <AlignRight size={16} />
        </button>
      </Tooltip>

      {/* 其他工具 */}
      <div className="toolbar-divider" />
      <Tooltip title="代码块">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('code')}
        >
          <Code size={16} />
        </button>
      </Tooltip>
      <Tooltip title="高亮">
        <button
          className="toolbar-btn"
          onClick={() => handleFormat('highlight')}
        >
          <Highlighter size={16} />
        </button>
      </Tooltip>

      {/* 导入导出 */}
      <div className="toolbar-divider" />
      <Tooltip title="导入文件">
        <button
          className="toolbar-btn"
          onClick={handleImport}
        >
          <Upload size={16} />
        </button>
      </Tooltip>
      <Tooltip title="导出文件">
        <button
          className="toolbar-btn"
          onClick={handleExport}
        >
          <Download size={16} />
        </button>
      </Tooltip>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.doc,.docx,.pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

/**
 * 主编辑器组件
 * 负责文档的整体编辑体验
 */
export default function Editor() {
  const { id: docId, title, blocks, updateTitle, setBlocks, selectedBlockId } = useDocumentStore();
  const { isMounted, theme } = useTheme();
  const [showOutline, setShowOutline] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isDark = isMounted && theme.isDark;

  // 监听快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B：加粗
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleFormat('bold');
      }
      // Ctrl/Cmd + I：斜体
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        handleFormat('italic');
      }
      // Ctrl/Cmd + U：下划线
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleFormat('underline');
      }
      // Ctrl/Cmd + Z：撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDocumentStore.getState().undo();
      }
      // Ctrl/Cmd + Shift + Z：重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        useDocumentStore.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`editor-container ${isDark ? 'dark' : 'light'}`}>
      {/* 顶部菜单栏 */}
      <DocumentMenuBar />

      <div className="editor-content">
        {/* 左侧：编辑器 */}
        <div className="editor-main">
          {/* 工具栏 */}
          <EditorToolbar />

          {/* 虚拟编辑器 */}
          <VirtualEditor />
        </div>

        {/* 右侧：侧边栏 */}
        {showOutline && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="editor-sidebar"
          >
            <DocumentOutline />
          </motion.div>
        )}

        {showComments && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="editor-sidebar"
          >
            <CommentPanel />
          </motion.div>
        )}
      </div>

      {/* 底部：聊天抽屉 */}
      {showChat && (
        <motion.div
          initial={{ y: 500 }}
          animate={{ y: 0 }}
          exit={{ y: 500 }}
          className="editor-chat"
        >
          <ChatDrawer />
        </motion.div>
      )}
    </div>
  );
}
```

#### 2.2.2 关键特性

1. **工具栏功能**
   - 文本格式化：加粗、斜体、下划线、删除线
   - 对齐方式：左对齐、居中、右对齐
   - 其他工具：代码块、高亮
   - 导入导出：支持多种格式

2. **快捷键支持**
   - `Ctrl/Cmd + B`：加粗
   - `Ctrl/Cmd + I`：斜体
   - `Ctrl/Cmd + U`：下划线
   - `Ctrl/Cmd + Z`：撤销
   - `Ctrl/Cmd + Shift + Z` 或 `Ctrl/Cmd + Y`：重做

3. **侧边栏管理**
   - 文档大纲：显示文档结构
   - 评论面板：查看和管理评论
   - 可折叠显示

4. **实时聊天**
   - 底部抽屉式聊天窗口
   - 支持实时协作聊天

5. **状态管理**
   - 通过 Zustand Store 管理文档状态
   - 实时同步到服务器

---

### 2.3 VirtualEditor 组件详解

**文件路径**：`src/components/VirtualEditor.tsx`

**组件描述**：虚拟编辑器，用于高性能渲染大量文档块，采用虚拟滚动和 memo 优化。

#### 2.3.1 核心代码片段

```typescript
"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from "react";
import { useDocumentStore, Block } from "@/store/documentStore";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence, Reorder } from "framer-motion";

// 性能监控
interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  blockCount: number;
}

/**
 * 块渲染器 - 使用 memo 避免不必要的重渲染
 */
const BlockRenderer = memo<{ block: Block; index: number }>(({ block, index }) => {
  const {
    id: docId,
    updateBlock,
    removeBlock,
    addBlock,
    transformBlock,
    setFocusedBlockId,
    setSelectedBlockId
  } = useDocumentStore();
  const { isMounted, theme } = useTheme();
  const isDark = isMounted && theme.isDark;
  const inputRef = useRef<HTMLDivElement>(null);

  // 斜杠命令菜单
  const slashCommands = [
    { key: "text", label: "文本", icon: <Type size={14} />, desc: "普通文本段落" },
    { key: "h1", label: "标题 1", icon: <Heading1 size={14} />, desc: "大标题" },
    { key: "h2", label: "标题 2", icon: <Heading2 size={14} />, desc: "中标题" },
    { key: "h3", label: "标题 3", icon: <Heading3 size={14} />, desc: "小标题" },
    { key: "todo", label: "待办事项", icon: <CheckSquare size={14} />, desc: "带复选框的任务列表" },
    { key: "callout", label: "提示框", icon: <Info size={14} />, desc: "突出显示的提示信息" },
    { key: "code", label: "代码块", icon: <Code size={14} />, desc: "代码片段" },
    { key: "divider", label: "分隔线", icon: <Minus size={14} />, desc: "视觉分隔线" },
    { key: "image", label: "图片", icon: <Image size={14} />, desc: "上传或嵌入图片" },
    { key: "table", label: "表格", icon: <Table size={14} />, desc: "数据表格" },
  ];

  // 同步 content 到 input
  useEffect(() => {
    if (inputRef.current && inputRef.current.innerText !== block.content) {
      inputRef.current.innerText = block.content;
    }
  }, [block.content]);

  // Markdown 触发器
  const checkMarkdownTrigger = (content: string) => {
    const patterns: Record<string, Block['type']> = {
      '# ': 'h1',
      '## ': 'h2',
      '### ': 'h3',
      '- [': 'todo',
      '> ': 'callout',
      '```': 'code',
      '---': 'divider',
    };

    for (const [pattern, type] of Object.entries(patterns)) {
      if (content.startsWith(pattern)) {
        transformBlock(block.id, type);
        updateBlock(block.id, content.slice(pattern.length));
        break;
      }
    }
  };

  // 处理输入
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerText || "";
    updateBlock(block.id, content);

    // 检查 Markdown 触发器
    if (content.length <= 5) {
      checkMarkdownTrigger(content);
    }
  }, [block.id, updateBlock, transformBlock]);

  // 处理焦点
  const handleFocus = useCallback(() => {
    setFocusedBlockId(block.id);
    setSelectedBlockId(block.id);
  }, [block.id, setFocusedBlockId, setSelectedBlockId]);

  // 处理按键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter：创建新块
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('text', block.id);
    }
    // Backspace：删除空块
    if (e.key === 'Backspace' && !block.content) {
      e.preventDefault();
      removeBlock(block.id);
    }
    // Tab：缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: 实现缩进逻辑
    }
  }, [block.id, block.content, addBlock, removeBlock]);

  // 渲染块内容
  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <div
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="text-block"
            data-block-id={block.id}
          />
        );
      case 'h1':
        return (
          <h1
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="h1-block"
            data-block-id={block.id}
          />
        );
      case 'h2':
        return (
          <h2
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="h2-block"
            data-block-id={block.id}
          />
        );
      case 'h3':
        return (
          <h3
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="h3-block"
            data-block-id={block.id}
          />
        );
      case 'todo':
        return (
          <div className="todo-block" data-block-id={block.id}>
            <Checkbox
              checked={block.properties?.checked || false}
              onChange={(checked) => {
                updateBlock(block.id, block.content, { ...block.properties, checked });
              }}
            />
            <div
              ref={inputRef}
              contentEditable
              onInput={handleInput}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className="todo-content"
            />
          </div>
        );
      case 'code':
        return <CodeBlock block={block} onUpdate={handleInput} onRemove={() => removeBlock(block.id)} />;
      case 'image':
        return <ImageBlock block={block} onUpdate={handleInput} onRemove={() => removeBlock(block.id)} />;
      case 'table':
        return <TableBlock block={block} onUpdate={handleInput} onRemove={() => removeBlock(block.id)} />;
      case 'callout':
        return <CalloutBlock block={block} onUpdate={handleInput} onRemove={() => removeBlock(block.id)} />;
      default:
        return (
          <div
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="default-block"
            data-block-id={block.id}
          />
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`block-wrapper ${isDark ? 'dark' : 'light'}`}
      data-block-id={block.id}
    >
      <div className="block-content">
        {/* 拖拽手柄 */}
        <div className="block-drag-handle">
          <GripVertical size={12} />
        </div>

        {/* 块内容 */}
        {renderBlockContent()}
      </div>
    </motion.div>
  );
});

export default function VirtualEditor() {
  const { blocks } = useDocumentStore();
  const [visibleBlocks, setVisibleBlocks] = useState<Block[]>([]);
  const [renderMetrics, setRenderMetrics] = useState<PerformanceMetrics>({ renderTime: 0, fps: 0, blockCount: 0 });

  // 虚拟滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const blockHeight = 80; // 假设每个块平均高度 80px

    const startIndex = Math.floor(scrollTop / blockHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(viewportHeight / blockHeight) + 5,
      blocks.length
    );

    setVisibleBlocks(blocks.slice(startIndex, endIndex));
  }, [blocks]);

  // 初始渲染
  useEffect(() => {
    setVisibleBlocks(blocks.slice(0, 20));
  }, [blocks]);

  // 处理拖拽重排序
  const handleReorder = useCallback((newOrder: string[]) => {
    const newBlocks = newOrder.map(id => blocks.find(b => b.id === id)!).filter(Boolean);
    useDocumentStore.getState().setBlocks(newBlocks);
  }, [blocks]);

  return (
    <div className="virtual-editor-container" onScroll={handleScroll}>
      <AnimatePresence mode="popLayout">
        <Reorder.Group axis="y" values={blocks.map(b => b.id)} onReorder={handleReorder}>
          {visibleBlocks.map((block, index) => (
            <Reorder.Item key={block.id} value={block.id}>
              <BlockRenderer block={block} index={index} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </AnimatePresence>
    </div>
  );
}
```

#### 2.3.2 性能优化特性

1. **虚拟滚动**
   - 只渲染可见区域内的块
   - 滚动时动态计算可见块范围
   - 大大减少 DOM 节点数量

2. **React.memo**
   - BlockRenderer 使用 memo 避免不必要的重渲染
   - 只在 block.id 和 content 变化时重新渲染

3. **useCallback/useMemo**
   - 事件处理函数使用 useCallback 缓存
   - 计算结果使用 useMemo 缓存

4. **Framer Motion layout**
   - 自动计算布局变化动画
   - 避免手动计算位置

---

## 三、组件设计模式

### 3.1 原子化设计模式

FastDocument 采用原子化设计理念，每个文档由多个独立的"块"组成：

```typescript
interface Block {
  id: string;                    // 唯一标识符
  type: BlockType;                // 块类型
  content: string;                // 块内容
  properties?: BlockProperties;     // 块属性
  order?: number;                  // 排序
}

type BlockType = "text" | "h1" | "h2" | "h3" | "todo" | "callout" | "divider" | "code" | "image" | "table" | "mindmap" | "flowchart" | "math" | "quote";
```

**优势：**
- 每个块独立管理，易于操作
- 支持拖拽排序
- 支持类型转换
- 易于扩展新的块类型

### 3.2 组合模式

大组件由多个小组件组合而成：

```typescript
// Editor 组件组合
<Editor>
  <DocumentMenuBar />      {/* 菜单栏 */}
  <EditorToolbar />       {/* 工具栏 */}
  <VirtualEditor />       {/* 虚拟编辑器 */}
  <DocumentOutline />     {/* 文档大纲 */}
  <CommentPanel />        {/* 评论面板 */}
  <ChatDrawer />         {/* 聊天抽屉 */}
</Editor>
```

### 3.3 容器-展示模式

```
Container Component（容器组件）
├── 数据获取
├── 状态管理
└── 事件处理

Presentation Component（展示组件）
├── UI 渲染
└── 样式处理
```

### 3.4 受控/非受控组件

- **受控组件**：状态由父组件控制
  - 示例：TodoBlock 的复选框状态

- **非受控组件**：自己管理状态
  - 示例：CodeBlock 内部的编辑状态

---

## 四、性能优化技巧

### 4.1 组件级优化

1. **使用 React.memo**
   - 避免不必要的重渲染
   - 适用场景：纯展示组件、props 频繁变化

2. **使用 useCallback**
   - 缓存事件处理函数
   - 避免子组件因函数引用变化而重渲染

3. **使用 useMemo**
   - 缓存计算结果
   - 适用场景：复杂计算、大数据过滤

4. **虚拟滚动**
   - 只渲染可见区域的项
   - 适用场景：长列表、大量数据

### 4.2 状态优化

1. **Zustand 选择器**
   ```typescript
   // ❌ 不推荐：订阅整个 store
   const store = useDocumentStore();

   // ✅ 推荐：只订阅需要的状态
   const { blocks, updateBlock } = useDocumentStore(state => ({
     blocks: state.blocks,
     updateBlock: state.updateBlock
   }));
   ```

2. **状态拆分**
   - 将大状态拆分为多个小状态
   - 每个状态只管理相关的数据

3. **避免不必要的状态**
   - 能从 props 派生的数据不要放入 state
   - 能从其他 state 计算的数据不要重复存储

---

## 五、最佳实践

### 5.1 组件命名

- 使用 PascalCase 命名组件
- 组件文件使用 PascalCase.tsx
- 工具函数使用 camelCase

### 5.2 Props 类型定义

```typescript
// ✅ 推荐：使用 interface 或 type 定义 Props
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  // ...
};

// ❌ 不推荐：内联定义 Props
const MyComponent: React.FC<{
  title: string;
  onAction: () => void;
}> = ({ title, onAction }) => {
  // ...
};
```

### 5.3 事件处理

```typescript
// ✅ 推荐：使用 useCallback
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);

// ❌ 不推荐：直接定义函数
const handleClick = () => {
  console.log('Clicked');
};
```

### 5.4 条件渲染

```typescript
// ✅ 推荐：使用早期返回
if (!user) {
  return <div>请登录</div>;
}

return <div>{user.name}</div>;

// ❌ 不推荐：嵌套三元表达式
<div>
  {user ? <div>{user.name}</div> : <div>请登录</div>}
</div>
```

---

## 六、调试技巧

### 6.1 React DevTools

1. 安装 React DevTools 浏览器扩展
2. 使用 Profiler 分析组件渲染性能
3. 查看组件树和状态

### 6.2 console.log 调试

```typescript
// 在组件中添加调试日志
console.log('Component rendered', { block, index });
```

### 6.3 性能监控

```typescript
// 使用 Performance API
const start = performance.now();
// 执行操作
const end = performance.now();
console.log('Operation took', end - start, 'ms');
```

---

## 七、扩展阅读

- [React 官方文档](https://react.dev/)
- [Next.js 文档](https://nextjs.org/docs)
- [Framer Motion 文档](https://www.framer.com/motion)
- [Zustand 文档](https://zustand.docs.pmnd.rs/)
- [Ant Design 文档](https://ant.design/docs/react/introduce)
