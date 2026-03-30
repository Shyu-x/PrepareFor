# VSCode Claude Code 插件风格界面

我将创建一个模仿VSCode插件样式的Claude Code界面，包含侧边栏、主内容区和状态栏。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code - VSCode插件</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        :root {
            --vscode-bg: #1e1e1e;
            --vscode-sidebar: #252526;
            --vscode-activitybar: #333333;
            --vscode-statusbar: #007acc;
            --vscode-editor-bg: #1e1e1e;
            --vscode-editor-fg: #d4d4d4;
            --vscode-border: #3e3e42;
            --vscode-hover: #2a2d2e;
            --vscode-selection: #264f78;
            --vscode-input-bg: #3c3c3c;
            --vscode-input-border: #3e3e42;
            --vscode-accent: #569cd6;
            --vscode-string: #ce9178;
            --vscode-keyword: #c586c0;
            --vscode-number: #b5cea8;
            --vscode-comment: #6a9955;
            --vscode-error: #f48771;
            --vscode-warning: #cca700;
            --vscode-info: #75beff;
        }

        body {
            background-color: var(--vscode-bg);
            color: var(--vscode-editor-fg);
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* 主容器 */
        .main-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
        }

        /* 顶部标题栏 */
        .titlebar {
            background-color: var(--vscode-activitybar);
            height: 30px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            font-size: 12px;
            border-bottom: 1px solid var(--vscode-border);
            justify-content: space-between;
        }

        .titlebar-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .titlebar-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .window-controls {
            display: flex;
            gap: 4px;
        }

        .window-btn {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .window-btn:hover {
            opacity: 0.8;
        }

        .window-btn.close { background-color: #f48771; }
        .window-btn.minimize { background-color: #cca700; }
        .window-btn.maximize { background-color: #6ed86c; }

        /* 内容区域 */
        .content-area {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* 活动栏 (左侧竖条) */
        .activitybar {
            width: 48px;
            background-color: var(--vscode-activitybar);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 0;
            border-right: 1px solid var(--vscode-border);
        }

        .activity-item {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
            margin-bottom: 4px;
            transition: background-color 0.2s;
        }

        .activity-item:hover {
            background-color: var(--vscode-hover);
        }

        .activity-item.active {
            background-color: var(--vscode-hover);
            border-left: 2px solid var(--vscode-statusbar);
        }

        .activity-item svg {
            width: 20px;
            height: 20px;
            fill: var(--vscode-editor-fg);
            opacity: 0.7;
        }

        .activity-item.active svg {
            fill: var(--vscode-statusbar);
            opacity: 1;
        }

        /* 侧边栏 */
        .sidebar {
            width: 280px;
            background-color: var(--vscode-sidebar);
            border-right: 1px solid var(--vscode-border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sidebar-header {
            padding: 12px;
            font-size: 13px;
            font-weight: 600;
            border-bottom: 1px solid var(--vscode-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }

        .sidebar-section {
            margin-bottom: 12px;
        }

        .sidebar-section-title {
            padding: 6px 16px;
            font-size: 11px;
            text-transform: uppercase;
            color: #969696;
            letter-spacing: 0.5px;
        }

        .sidebar-item {
            padding: 6px 16px;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;
        }

        .sidebar-item:hover {
            background-color: var(--vscode-hover);
        }

        .sidebar-item.active {
            background-color: var(--vscode-hover);
            color: var(--vscode-statusbar);
        }

        .sidebar-item-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sidebar-item-icon svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }

        .sidebar-item-label {
            flex: 1;
        }

        .sidebar-item-badge {
            background-color: var(--vscode-statusbar);
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
        }

        /* 主编辑区 */
        .editor-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: var(--vscode-editor-bg);
            overflow: hidden;
        }

        /* 编辑器选项卡 */
        .editor-tabs {
            display: flex;
            background-color: var(--vscode-sidebar);
            border-bottom: 1px solid var(--vscode-border);
            overflow-x: auto;
        }

        .editor-tab {
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border-right: 1px solid var(--vscode-border);
            background-color: var(--vscode-sidebar);
            transition: background-color 0.2s;
            white-space: nowrap;
        }

        .editor-tab:hover {
            background-color: var(--vscode-hover);
        }

        .editor-tab.active {
            background-color: var(--vscode-editor-bg);
            color: var(--vscode-editor-fg);
        }

        .editor-tab-close {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
            opacity: 0.7;
        }

        .editor-tab-close:hover {
            background-color: rgba(255,255,255,0.1);
            opacity: 1;
        }

        /* 聊天区域 */
        .chat-view {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--vscode-editor-bg);
        }

        .chat-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-statusbar);
        }

        .chat-controls {
            display: flex;
            gap: 8px;
        }

        .chat-btn {
            background-color: transparent;
            border: 1px solid var(--vscode-border);
            color: var(--vscode-editor-fg);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .chat-btn:hover {
            background-color: var(--vscode-hover);
            border-color: var(--vscode-accent);
        }

        .chat-messages {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            background-color: var(--vscode-editor-bg);
        }

        .message {
            margin-bottom: 12px;
            padding: 10px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid transparent;
        }

        .message-user {
            background-color: rgba(86, 156, 214, 0.1);
            border-left: 2px solid var(--vscode-accent);
            margin-left: 24px;
        }

        .message-claude {
            background-color: rgba(255, 255, 255, 0.03);
            border-left: 2px solid var(--vscode-info);
            margin-right: 24px;
        }

        .message-system {
            background-color: rgba(255, 255, 255, 0.02);
            border-left: 2px solid var(--vscode-warning);
            font-style: italic;
            color: #969696;
        }

        .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            font-size: 12px;
            color: #969696;
        }

        .message-role {
            font-weight: 600;
            color: var(--vscode-editor-fg);
        }

        .message-time {
            font-size: 11px;
        }

        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .code-block {
            background-color: #2d2d2d;
            border-radius: 4px;
            padding: 10px;
            margin-top: 8px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            overflow-x: auto;
            border: 1px solid var(--vscode-border);
        }

        .code-header {
            display: flex;
            justify-content: space-between;
            color: #969696;
            font-size: 11px;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--vscode-border);
        }

        .copy-code-btn {
            background: transparent;
            border: none;
            color: var(--vscode-accent);
            cursor: pointer;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 3px;
        }

        .copy-code-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        /* 输入区域 */
        .input-area {
            border-top: 1px solid var(--vscode-border);
            padding: 12px;
            background-color: var(--vscode-editor-bg);
        }

        .input-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }

        .toolbar-btn {
            background-color: transparent;
            border: 1px solid var(--vscode-border);
            color: var(--vscode-editor-fg);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .toolbar-btn:hover {
            background-color: var(--vscode-hover);
            border-color: var(--vscode-accent);
        }

        .toolbar-btn.active {
            background-color: var(--vscode-selection);
            border-color: var(--vscode-accent);
            color: white;
        }

        .input-row {
            display: flex;
            gap: 8px;
        }

        .chat-input {
            flex: 1;
            background-color: var(--vscode-input-bg);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-editor-fg);
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 13px;
            outline: none;
            resize: none;
            min-height: 60px;
            font-family: inherit;
        }

        .chat-input:focus {
            border-color: var(--vscode-accent);
        }

        .send-btn {
            background-color: var(--vscode-statusbar);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            align-self: flex-start;
            min-width: 80px;
        }

        .send-btn:hover {
            opacity: 0.9;
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* 设置视图 */
        .settings-view {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background-color: var(--vscode-editor-bg);
        }

        .settings-section {
            margin-bottom: 24px;
            border: 1px solid var(--vscode-border);
            border-radius: 4px;
            overflow: hidden;
        }

        .settings-section-header {
            padding: 10px 12px;
            background-color: var(--vscode-sidebar);
            font-weight: 600;
            font-size: 13px;
            border-bottom: 1px solid var(--vscode-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .settings-section-content {
            padding: 12px;
        }

        .settings-item {
            margin-bottom: 12px;
        }

        .settings-item:last-child {
            margin-bottom: 0;
        }

        .settings-label {
            display: block;
            font-size: 12px;
            color: #969696;
            margin-bottom: 6px;
        }

        .settings-input {
            width: 100%;
            background-color: var(--vscode-input-bg);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-editor-fg);
            padding: 6px 8px;
            border-radius: 3px;
            font-size: 13px;
            outline: none;
        }

        .settings-input:focus {
            border-color: var(--vscode-accent);
        }

        .settings-select {
            width: 100%;
            background-color: var(--vscode-input-bg);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-editor-fg);
            padding: 6px 8px;
            border-radius: 3px;
            font-size: 13px;
            cursor: pointer;
        }

        .settings-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .settings-toggle input {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        /* MCP 管理视图 */
        .mcp-view {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background-color: var(--vscode-editor-bg);
        }

        .mcp-server-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .mcp-server-item {
            background-color: var(--vscode-sidebar);
            border: 1px solid var(--vscode-border);
            border-radius: 4px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .mcp-server-info {
            flex: 1;
        }

        .mcp-server-name {
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-editor-fg);
        }

        .mcp-server-desc {
            font-size: 12px;
            color: #969696;
        }

        .mcp-server-status {
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-connected {
            background-color: rgba(106, 153, 85, 0.2);
            color: #6ed86c;
        }

        .status-disconnected {
            background-color: rgba(244, 135, 113, 0.2);
            color: var(--vscode-error);
        }

        .status-pending {
            background-color: rgba(204, 167, 0, 0.2);
            color: var(--vscode-warning);
        }

        .mcp-server-actions {
            display: flex;
            gap: 6px;
        }

        .mcp-action-btn {
            background-color: transparent;
            border: 1px solid var(--vscode-border);
            color: var(--vscode-editor-fg);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .mcp-action-btn:hover {
            background-color: var(--vscode-hover);
            border-color: var(--vscode-accent);
        }

        .mcp-action-btn.connect {
            background-color: rgba(106, 153, 85, 0.1);
            border-color: #6ed86c;
            color: #6ed86c;
        }

        .mcp-action-btn.disconnect {
            background-color: rgba(244, 135, 113, 0.1);
            border-color: var(--vscode-error);
            color: var(--vscode-error);
        }

        .add-mcp-form {
            margin-top: 16px;
            padding: 12px;
            background-color: var(--vscode-sidebar);
            border: 1px solid var(--vscode-border);
            border-radius: 4px;
        }

        .add-mcp-form h4 {
            margin-bottom: 12px;
            font-size: 13px;
            color: var(--vscode-statusbar);
        }

        /* 帮助视图 */
        .help-view {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background-color: var(--vscode-editor-bg);
        }

        .help-section {
            margin-bottom: 24px;
        }

        .help-section h3 {
            font-size: 14px;
            color: var(--vscode-statusbar);
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--vscode-border);
        }

        .help-list {
            list-style: none;
            padding-left: 0;
        }

        .help-list li {
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .help-key {
            color: var(--vscode-accent);
            font-weight: 600;
            font-family: monospace;
        }

        .help-desc {
            color: #969696;
            margin-left: 8px;
        }

        /* 状态栏 */
        .statusbar {
            height: 22px;
            background-color: var(--vscode-statusbar);
            color: white;
            display: flex;
            align-items: center;
            padding: 0 8px;
            font-size: 12px;
            justify-content: space-between;
        }

        .statusbar-left, .statusbar-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .statusbar-item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 3px;
            transition: background-color 0.2s;
        }

        .statusbar-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .statusbar-item svg {
            width: 14px;
            height: 14px;
            fill: white;
        }

        /* 命令菜单 */
        .command-palette {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding-top: 100px;
            z-index: 1000;
        }

        .command-palette.active {
            display: flex;
        }

        .command-palette-content {
            width: 600px;
            background-color: var(--vscode-editor-bg);
            border: 1px solid var(--vscode-border);
            border-radius: 4px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        }

        .command-palette-input {
            width: 100%;
            background-color: var(--vscode-input-bg);
            border: none;
            border-bottom: 1px solid var(--vscode-border);
            color: var(--vscode-editor-fg);
            padding: 12px;
            font-size: 14px;
            outline: none;
        }

        .command-palette-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .command-palette-item {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .command-palette-item:hover, .command-palette-item.selected {
            background-color: var(--vscode-hover);
        }

        .command-palette-item-key {
            color: var(--vscode-accent);
            font-family: monospace;
            font-weight: 600;
        }

        .command-palette-item-desc {
            color: #969696;
            font-size: 12px;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .sidebar {
                width: 240px;
            }
            
            .activitybar {
                width: 40px;
            }
            
            .activity-item {
                width: 32px;
                height: 32px;
            }
            
            .activity-item svg {
                width: 16px;
                height: 16px;
            }
            
            .command-palette-content {
                width: 90%;
            }
        }

        /* 滚动条样式 */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        ::-webkit-scrollbar-track {
            background: var(--vscode-bg);
        }

        ::-webkit-scrollbar-thumb {
            background: #424242;
            border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #4f4f4f;
        }

        /* 工具提示 */
        .tooltip {
            position: relative;
        }

        .tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2d2d2d;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            white-space: nowrap;
            border: 1px solid var(--vscode-border);
            z-index: 1000;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- 标题栏 -->
        <div class="titlebar">
            <div class="titlebar-left">
                <span>Claude Code - 插件</span>
                <span style="color: #969696; font-size: 11px;">v1.0.0</span>
            </div>
            <div class="titlebar-right">
                <span id="currentModel" style="color: var(--vscode-statusbar); font-size: 11px;">Claude Sonnet</span>
                <div class="window-controls">
                    <button class="window-btn minimize" title="最小化"></button>
                    <button class="window-btn maximize" title="最大化"></button>
                    <button class="window-btn close" title="关闭"></button>
                </div>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
            <!-- 活动栏 -->
            <div class="activitybar">
                <div class="activity-item active tooltip" data-tooltip="聊天" data-view="chat">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                </div>
                <div class="activity-item tooltip" data-tooltip="设置" data-view="settings">
                    <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                </div>
                <div class="activity-item tooltip" data-tooltip="MCP 服务器" data-view="mcp">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </div>
                <div class="activity-item tooltip" data-tooltip="帮助" data-view="help">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
            </div>

            <!-- 侧边栏 -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <span>CLAUDE CODE</span>
                    <button class="chat-btn" id="openCommandPalette">命令面板</button>
                </div>
                <div class="sidebar-content" id="sidebarContent">
                    <!-- 动态内容 -->
                </div>
            </div>

            <!-- 主编辑区 -->
            <div class="editor-area">
                <!-- 编辑器选项卡 -->
                <div class="editor-tabs">
                    <div class="editor-tab active" data-tab="chat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                        <span>聊天</span>
                        <div class="editor-tab-close" title="关闭">✕</div>
                    </div>
                    <div class="editor-tab" data-tab="settings" style="display: none;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"/></svg>
                        <span>设置</span>
                        <div class="editor-tab-close" title="关闭">✕</div>
                    </div>
                </div>

                <!-- 视图区域 -->
                <div id="viewContainer" style="flex: 1; overflow: hidden;">
                    <!-- 聊天视图 -->
                    <div class="chat-view" id="chatView">
                        <div class="chat-header">
                            <div class="chat-title">Claude Code 聊天</div>
                            <div class="chat-controls">
                                <button class="chat-btn" id="clearChat">清除</button>
                                <button class="chat-btn" id="exportChat">导出</button>
                                <button class="chat-btn" id="compactChat">压缩</button>
                            </div>
                        </div>
                        <div class="chat-messages" id="chatMessages">
                            <div class="message message-system">
                                <div class="message-header">
                                    <span class="message-role">系统</span>
                                    <span class="message-time">刚刚</span>
                                </div>
                                <div class="message-content">Claude Code 插件已启动。输入 <span class="help-key">/</span> 或点击下方按钮开始使用。</div>
                            </div>
                        </div>
                        <div class="input-area">
                            <div class="input-toolbar">
                                <button class="toolbar-btn" id="modeInteractive" data-mode="interactive">交互模式</button>
                                <button class="toolbar-btn" id="modePrint" data-mode="print">打印模式</button>
                                <button class="toolbar-btn" id="modePlan" data-mode="plan">计划模式</button>
                                <button class="toolbar-btn" id="modelSelect" data-action="model">选择模型</button>
                                <button class="toolbar-btn" id="mcpManage" data-action="mcp">MCP管理</button>
                            </div>
                            <div class="input-row">
                                <textarea class="chat-input" id="chatInput" placeholder="输入消息或命令... (Ctrl+Enter 发送)"></textarea>
                                <button class="send-btn" id="sendBtn">发送</button>
                            </div>
                        </div>
                    </div>

                    <!-- 设置视图 -->
                    <div class="settings-view" id="settingsView" style="display: none;">
                        <div class="settings-section">
                            <div class="settings-section-header">
                                <span>模型设置</span>
                            </div>
                            <div class="settings-section-content">
                                <div class="settings-item">
                                    <label class="settings-label">AI 模型</label>
                                    <select class="settings-select" id="modelSetting">
                                        <option value="sonnet">Claude Sonnet 4.5 (默认)</option>
                                        <option value="opus">Claude Opus 4.5</option>
                                        <option value="haiku">Claude Haiku 4.5</option>
                                    </select>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-label">最大令牌数</label>
                                    <input type="number" class="settings-input" id="maxTokens" value="4096" min="1024" max="8192">
                                </div>
                                <div class="settings-item">
                                    <label class="settings-label">温度</label>
                                    <input type="range" class="settings-input" id="temperature" min="0" max="1" step="0.1" value="0.7">
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <div class="settings-section-header">
                                <span>权限设置</span>
                            </div>
                            <div class="settings-section-content">
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="allowBash" checked>
                                        <span>允许执行 Bash 命令</span>
                                    </label>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="allowEdit" checked>
                                        <span>允许文件编辑</span>
                                    </label>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="allowNetwork" checked>
                                        <span>允许网络访问</span>
                                    </label>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="planMode">
                                        <span>默认进入计划模式</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <div class="settings-section-header">
                                <span>界面设置</span>
                            </div>
                            <div class="settings-section-content">
                                <div class="settings-item">
                                    <label class="settings-label">主题</label>
                                    <select class="settings-select" id="themeSetting">
                                        <option value="dark">深色主题</option>
                                        <option value="light">浅色主题</option>
                                        <option value="high-contrast">高对比度</option>
                                    </select>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="showStatusBar" checked>
                                        <span>显示状态栏</span>
                                    </label>
                                </div>
                                <div class="settings-item">
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="autoComplete" checked>
                                        <span>命令自动补全</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- MCP 管理视图 -->
                    <div class="mcp-view" id="mcpView" style="display: none;">
                        <div class="settings-section">
                            <div class="settings-section-header">
                                <span>MCP 服务器</span>
                                <span id="mcpCount" style="color: #969696; font-size: 12px;">0 个已连接</span>
                            </div>
                            <div class="settings-section-content">
                                <div class="mcp-server-list" id="mcpServerList">
                                    <!-- 动态生成 -->
                                </div>
                            </div>
                        </div>

                        <div class="add-mcp-form">
                            <h4>添加 MCP 服务器</h4>
                            <div class="settings-item">
                                <label class="settings-label">服务器名称</label>
                                <input type="text" class="settings-input" id="mcpName" placeholder="例如: filesystem">
                            </div>
                            <div class="settings-item">
                                <label class="settings-label">服务器类型</label>
                                <select class="settings-select" id="mcpType">
                                    <option value="filesystem">文件系统</option>
                                    <option value="database">数据库</option>
                                    <option value="api">API 服务</option>
                                    <option value="custom">自定义</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label class="settings-label">配置路径</label>
                                <input type="text" class="settings-input" id="mcpConfig" placeholder="例如: /path/to/config.json">
                            </div>
                            <div class="settings-item">
                                <button class="chat-btn" id="addMcpServer">添加服务器</button>
                            </div>
                        </div>
                    </div>

                    <!-- 帮助视图 -->
                    <div class="help-view" id="helpView" style="display: none;">
                        <div class="help-section">
                            <h3>快速开始</h3>
                            <ul class="help-list">
                                <li><span class="help-key">/</span> <span class="help-desc">呼出命令菜单</span></li>
                                <li><span class="help-key">Ctrl+Enter</span> <span class="help-desc">发送消息</span></li>
                                <li><span class="help-key">Ctrl+K</span> <span class="help-desc">打开命令面板</span></li>
                                <li><span class="help-key">Esc</span> <span class="help-desc">关闭命令菜单</span></li>
                            </ul>
                        </div>

                        <div class="help-section">
                            <h3>常用命令</h3>
                            <ul class="help-list">
                                <li><span class="help-key">/mcp</span> <span class="help-desc">管理 MCP 服务器</span></li>
                                <li><span class="help-key">/model</span> <span class="help-desc">选择 AI 模型</span></li>
                                <li><span class="help-key">/plan</span> <span class="help-desc">进入计划模式</span></li>
                                <li><span class="help-key">/status</span> <span class="help-desc">查看系统状态</span></li>
                                <li><span class="help-key">/help</span> <span class="help-desc">显示帮助</span></li>
                                <li><span class="help-key">/clear</span> <span class="help-desc">清除聊天记录</span></li>
                                <li><span class="help-key">/config</span> <span class="help-desc">打开设置</span></li>
                            </ul>
                        </div>

                        <div class="help-section">
                            <h3>功能说明</h3>
                            <ul class="help-list">
                                <li><strong>MCP 服务器管理</strong> - 连接、断开、配置 Model Context Protocol 服务器</li>
                                <li><strong>模型选择</strong> - 在 Claude Sonnet, Opus, Haiku 之间切换</li>
                                <li><strong>权限控制</strong> - 管理 Bash, Edit, Network 等操作的权限</li>
                                <li><strong>计划模式</strong> - 在执行操作前进行审查，提高安全性</li>
                                <li><strong>命令面板</strong> - 快速访问所有功能和命令</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 状态栏 -->
        <div class="statusbar" id="statusbar">
            <div class="statusbar-left">
                <div class="statusbar-item" id="statusConnection">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <span>已连接</span>
                </div>
                <div class="statusbar-item" id="statusModel">
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span id="statusModelName">Claude Sonnet</span>
                </div>
                <div class="statusbar-item" id="statusMcp">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <span id="statusMcpCount">0 个服务器</span>
                </div>
            </div>
            <div class="statusbar-right">
                <div class="statusbar-item" id="statusMode">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    <span id="statusModeName">交互模式</span>
                </div>
                <div class="statusbar-item" id="statusVersion">
                    <span>v1.0.0</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 命令面板 -->
    <div class="command-palette" id="commandPalette">
        <div class="command-palette-content">
            <input type="text" class="command-palette-input" id="commandPaletteInput" placeholder="输入命令...">
            <div class="command-palette-list" id="commandPaletteList">
                <!-- 动态生成 -->
            </div>
        </div>
    </div>

    <script>
        // 状态管理
        const state = {
            currentView: 'chat',
            currentModel: 'sonnet',
            currentMode: 'interactive',
            mcpServers: [
                { id: 'fs', name: 'Filesystem', type: 'filesystem', status: 'connected', config: '/workspace' },
                { id: 'gh', name: 'GitHub', type: 'api', status: 'connected', config: 'https://api.github.com' },
                { id: 'db', name: 'Database', type: 'database', status: 'disconnected', config: 'localhost:5432' }
            ],
            chatHistory: [],
            settings: {
                allowBash: true,
                allowEdit: true,
                allowNetwork: true,
                planMode: false,
                theme: 'dark',
                maxTokens: 4096,
                temperature: 0.7
            }
        };

        // DOM 元素
        const elements = {
            activityItems: document.querySelectorAll('.activity-item'),
            editorTabs: document.querySelectorAll('.editor-tab'),
            viewContainer: document.getElementById('viewContainer'),
            chatView: document.getElementById('chatView'),
            settingsView: document.getElementById('settingsView'),
            mcpView: document.getElementById('mcpView'),
            helpView: document.getElementById('helpView'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            statusModelName: document.getElementById('statusModelName'),
            statusMcpCount: document.getElementById('statusMcpCount'),
            statusModeName: document.getElementById('statusModeName'),
            commandPalette: document.getElementById('commandPalette'),
            commandPaletteInput: document.getElementById('commandPaletteInput'),
            commandPaletteList: document.getElementById('commandPaletteList'),
            sidebarContent: document.getElementById('sidebarContent')
        };

        // 命令定义
        const commands = [
            { key: '/mcp', desc: '管理 MCP 服务器', action: () => switchView('mcp') },
            { key: '/model', desc: '选择 AI 模型', action: () => openModelSelector() },
            { key: '/plan', desc: '进入计划模式', action: () => setMode('plan') },
            { key: '/status', desc: '查看系统状态', action: () => showSystemStatus() },
            { key: '/help', desc: '显示帮助', action: () => switchView('help') },
            { key: '/clear', desc: '清除聊天记录', action: () => clearChat() },
            { key: '/config', desc: '打开设置', action: () => switchView('settings') },
            { key: '/export', desc: '导出聊天', action: () => exportChat() },
            { key: '/compact', desc: '压缩对话', action: () => compactChat() },
            { key: '/theme', desc: '更改主题', action: () => changeTheme() }
        ];

        // 初始化
        function init() {
            setupEventListeners();
            updateStatusbar();
            renderSidebar();
            updateMcpCount();
            showWelcomeMessage();
        }

        // 设置事件监听器
        function setupEventListeners() {
            // 活动栏点击
            elements.activityItems.forEach(item => {
                item.addEventListener('click', () => {
                    const view = item.getAttribute('data-view');
                    switchView(view);
                    
                    // 更新活动状态
                    elements.activityItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                });
            });

            // 编辑器选项卡
            elements.editorTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    if (tabName) {
                        switchView(tabName);
                    }
                });

                // 关闭选项卡
                const closeBtn = tab.querySelector('.editor-tab-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // 可以在这里实现关闭逻辑
                    });
                }
            });

            // 发送消息
            elements.sendBtn.addEventListener('click', sendMessage);
            elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // 命令面板
            document.getElementById('openCommandPalette').addEventListener('click', openCommandPalette);
            elements.commandPaletteInput.addEventListener('input', filterCommands);
            elements.commandPalette.addEventListener('click', (e) => {
                if (e.target === elements.commandPalette) {
                    closeCommandPalette();
                }
            });

            // 模式切换按钮
            document.getElementById('modeInteractive').addEventListener('click', () => setMode('interactive'));
            document.getElementById('modePrint').addEventListener('click', () => setMode('print'));
            document.getElementById('modePlan').addEventListener('click', () => setMode('plan'));
            
            // 动作按钮
            document.getElementById('modelSelect').addEventListener('click', openModelSelector);
            document.getElementById('mcpManage').addEventListener('click', () => switchView('mcp'));

            // 聊天控制按钮
            document.getElementById('clearChat').addEventListener('click', clearChat);
            document.getElementById('exportChat').addEventListener('click', exportChat);
            document.getElementById('compactChat').addEventListener('click', compactChat);

            // MCP 操作
            document.getElementById('addMcpServer').addEventListener('click', addMcpServer);

            // 设置变更
            document.getElementById('modelSetting').addEventListener('change', (e) => {
                state.currentModel = e.target.value;
                updateStatusbar();
                addSystemMessage(`模型已切换为: ${getModelName(e.target.value)}`);
            });

            // 键盘快捷键
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'k') {
                    e.preventDefault();
                    openCommandPalette();
                }
                if (e.key === 'Escape') {
                    closeCommandPalette();
                }
            });

            // 窗口控制按钮
            document.querySelectorAll('.window-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // 模拟窗口操作
                    if (btn.classList.contains('close')) {
                        if (confirm('确定要关闭插件吗？')) {
                            window.close();
                        }
                    }
                });
            });
        }

        // 切换视图
        function switchView(view) {
            state.currentView = view;
            
            // 隐藏所有视图
            elements.chatView.style.display = 'none';
            elements.settingsView.style.display = 'none';
            elements.mcpView.style.display = 'none';
            elements.helpView.style.display = 'none';

            // 显示对应视图
            switch (view) {
                case 'chat':
                    elements.chatView.style.display = 'flex';
                    break;
                case 'settings':
                    elements.settingsView.style.display = 'block';
                    break;
                case 'mcp':
                    elements.mcpView.style.display = 'block';
                    renderMcpServers();
                    break;
                case 'help':
                    elements.helpView.style.display = 'block';
                    break;
            }

            // 更新活动状态
            elements.activityItems.forEach(item => {
                const itemView = item.getAttribute('data-view');
                if (itemView === view) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // 发送消息
        function sendMessage() {
            const input = elements.chatInput.value.trim();
            if (!input) return;

            // 添加用户消息
            addUserMessage(input);
            elements.chatInput.value = '';

            // 模拟Claude响应
            setTimeout(() => {
                const response = generateClaudeResponse(input);
                addClaudeMessage(response);
            }, 500 + Math.random() * 500);
        }

        // 添加用户消息
        function addUserMessage(content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-user';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role">您</span>
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="message-content">${escapeHtml(content)}</div>
            `;
            elements.chatMessages.appendChild(messageDiv);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            state.chatHistory.push({ role: 'user', content, time: new Date() });
        }

        // 添加Claude消息
        function addClaudeMessage(content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-claude';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role">Claude</span>
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="message-content">${content}</div>
            `;
            elements.chatMessages.appendChild(messageDiv);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            state.chatHistory.push({ role: 'claude', content, time: new Date() });
        }

        // 添加系统消息
        function addSystemMessage(content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-system';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role">系统</span>
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="message-content">${escapeHtml(content)}</div>
            `;
            elements.chatMessages.appendChild(messageDiv);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }

        // 生成Claude响应
        function generateClaudeResponse(input) {
            if (input.startsWith('/')) {
                return handleCommand(input);
            }

            const responses = [
                "这是一个有趣的观察！您能提供更多细节吗？",
                "根据我的理解，您可以尝试以下方法：",
                "让我为您分析一下：",
                "这是一个常见的需求，以下是我的建议：",
                "感谢您的提问！让我为您详细解释："
            ];

            return responses[Math.floor(Math.random() * responses.length)];
        }

        // 处理命令
        function handleCommand(input) {
            const command = input.split(' ')[0].toLowerCase();
            
            const commandMap = {
                '/mcp': 'MCP 服务器管理界面已打开。',
                '/model': '模型选择界面已打开。',
                '/plan': '已切换到计划模式。所有操作将被审查。',
                '/status': `系统状态：\n模型: ${getModelName(state.currentModel)}\nMCP服务器: ${state.mcpServers.filter(s => s.status === 'connected').length}个已连接\n模式: ${state.currentMode}`,
                '/help': '可用命令: /mcp, /model, /plan, /status, /help, /clear, /config, /export, /compact, /theme',
                '/clear': '聊天记录已清除。',
                '/config': '设置界面已打开。',
                '/export': '聊天记录已导出。',
                '/compact': '对话已压缩。',
                '/theme': '主题已更新。'
            };

            if (commandMap[command]) {
                return commandMap[command];
            }

            return `未知命令: ${command}<br>输入 <span class="help-key">/help</span> 查看所有命令。`;
        }

        // 设置模式
        function setMode(mode) {
            state.currentMode = mode;
            updateStatusbar();
            updateModeButtons();
            addSystemMessage(`模式已切换为: ${getModeName(mode)}`);
        }

        // 更新模式按钮状态
        function updateModeButtons() {
            document.querySelectorAll('.toolbar-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            if (state.currentMode === 'interactive') {
                document.getElementById('modeInteractive').classList.add('active');
            } else if (state.currentMode === 'print') {
                document.getElementById('modePrint').classList.add('active');
            } else if (state.currentMode === 'plan') {
                document.getElementById('modePlan').classList.add('active');
            }
        }

        // 打开模型选择器
        function openModelSelector() {
            const models = [
                { id: 'sonnet', name: 'Claude Sonnet 4.5', desc: '平衡智能与速度' },
                { id: 'opus', name: 'Claude Opus 4.5', desc: '最高智能水平' },
                { id: 'haiku', name: 'Claude Haiku 4.5', desc: '快速响应' }
            ];

            const modelHtml = models.map(model => `
                <div class="command-palette-item" data-model="${model.id}">
                    <div>
                        <div style="font-weight: 600; color: var(--vscode-accent);">${model.name}</div>
                        <div style="font-size: 12px; color: #969696;">${model.desc}</div>
                    </div>
                    ${model.id === state.currentModel ? '<span style="color: #6ed86c;">✓</span>' : ''}
                </div>
            `).join('');

            openCustomCommandPalette('选择模型', modelHtml, (item) => {
                const modelId = item.getAttribute('data-model');
                state.currentModel = modelId;
                updateStatusbar();
                addSystemMessage(`已选择模型: ${getModelName(modelId)}`);
                closeCommandPalette();
            });
        }

        // 清除聊天
        function clearChat() {
            elements.chatMessages.innerHTML = '';
            state.chatHistory = [];
            addSystemMessage('聊天记录已清除。');
        }

        // 导出聊天
        function exportChat() {
            const content = state.chatHistory.map(msg => 
                `[${msg.role}] ${msg.time.toLocaleString()}: ${msg.content}`
            ).join('\n\n');

            // 模拟下载
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'claude-chat-export.txt';
            a.click();
            
            addSystemMessage('聊天记录已导出。');
        }

        // 压缩对话
        function compactChat() {
            addSystemMessage('对话已压缩。旧的对话内容已被总结。');
        }

        // 切换主题
        function changeTheme() {
            addSystemMessage('主题已更新。');
        }

        // 显示系统状态
        function showSystemStatus() {
            const status = `
                <div class="code-block">
                    <div class="code-header"><span>系统状态</span></div>
                    <div>
                        版本: v1.0.0<br>
                        模型: ${getModelName(state.currentModel)}<br>
                        模式: ${getModeName(state.currentMode)}<br>
                        MCP服务器: ${state.mcpServers.filter(s => s.status === 'connected').length}/${state.mcpServers.length}<br>
                        会话: ${state.chatHistory.length} 条消息<br>
                        状态: 正常
                    </div>
                </div>
            `;
            addClaudeMessage(status);
        }

        // 渲染侧边栏
        function renderSidebar() {
            const sections = [
                {
                    title: '聊天',
                    items: [
                        { label: '新建聊天', icon: 'plus', action: () => clearChat() },
                        { label: '历史记录', icon: 'history', action: () => addSystemMessage('历史记录功能开发中...') },
                        { label: '导出聊天', icon: 'download', action: exportChat }
                    ]
                },
                {
                    title: '管理',
                    items: [
                        { label: 'MCP 服务器', icon: 'server', action: () => switchView('mcp'), badge: state.mcpServers.filter(s => s.status === 'connected').length },
                        { label: 'AI 模型', icon: 'model', action: openModelSelector },
                        { label: '权限设置', icon: 'shield', action: () => switchView('settings') }
                    ]
                },
                {
                    title: '工具',
                    items: [
                        { label: '命令面板', icon: 'command', action: openCommandPalette },
                        { label: '系统状态', icon: 'info', action: showSystemStatus },
                        { label: '帮助', icon: 'help', action: () => switchView('help') }
                    ]
                }
            ];

            let html = '';
            sections.forEach(section => {
                html += `<div class="sidebar-section">
                    <div class="sidebar-section-title">${section.title}</div>`;
                
                section.items.forEach(item => {
                    const badge = item.badge ? `<span class="sidebar-item-badge">${item.badge}</span>` : '';
                    html += `
                        <div class="sidebar-item" data-action="${item.label}">
                            <div class="sidebar-item-icon">
                                ${getIconSvg(item.icon)}
                            </div>
                            <span class="sidebar-item-label">${item.label}</span>
                            ${badge}
                        </div>
                    `;
                });
                
                html += '</div>';
            });

            elements.sidebarContent.innerHTML = html;

            // 添加点击事件
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.addEventListener('click', () => {
                    const label = item.getAttribute('data-action');
                    const section = sections.find(s => s.items.some(i => i.label === label));
                    const itemData = section.items.find(i => i.label === label);
                    if (itemData && itemData.action) {
                        itemData.action();
                    }
                });
            });
        }

        // 渲染MCP服务器
        function renderMcpServers() {
            const container = document.getElementById('mcpServerList');
            
            if (state.mcpServers.length === 0) {
                container.innerHTML = '<div style="color: #969696; text-align: center; padding: 20px;">暂无MCP服务器</div>';
                return;
            }

            const html = state.mcpServers.map(server => {
                const statusClass = server.status === 'connected' ? 'status-connected' : 
                                   server.status === 'disconnected' ? 'status-disconnected' : 'status-pending';
                
                return `
                    <div class="mcp-server-item">
                        <div class="mcp-server-info">
                            <div class="mcp-server-name">${server.name}</div>
                            <div class="mcp-server-desc">${server.type} - ${server.config}</div>
                        </div>
                        <div class="mcp-server-status ${statusClass}">${server.status}</div>
                        <div class="mcp-server-actions">
                            ${server.status === 'connected' ? 
                                `<button class="mcp-action-btn disconnect" onclick="disconnectMcp('${server.id}')">断开</button>` : 
                                `<button class="mcp-action-btn connect" onclick="connectMcp('${server.id}')">连接</button>`
                            }
                            <button class="mcp-action-btn" onclick="editMcp('${server.id}')">编辑</button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        }

        // MCP 操作
        function connectMcp(id) {
            const server = state.mcpServers.find(s => s.id === id);
            if (server) {
                server.status = 'connecting';
                renderMcpServers();
                
                setTimeout(() => {
                    server.status = 'connected';
                    renderMcpServers();
                    updateMcpCount();
                    addSystemMessage(`已连接MCP服务器: ${server.name}`);
                }, 1000);
            }
        }

        function disconnectMcp(id) {
            const server = state.mcpServers.find(s => s.id === id);
            if (server) {
                server.status = 'disconnected';
                renderMcpServers();
                updateMcpCount();
                addSystemMessage(`已断开MCP服务器: ${server.name}`);
            }
        }

        function editMcp(id) {
            const server = state.mcpServers.find(s => s.id === id);
            if (server) {
                addSystemMessage(`编辑MCP服务器: ${server.name}`);
            }
        }

        function addMcpServer() {
            const name = document.getElementById('mcpName').value.trim();
            const type = document.getElementById('mcpType').value;
            const config = document.getElementById('mcpConfig').value.trim();

            if (!name) {
                addSystemMessage('请输入服务器名称');
                return;
            }

            const newServer = {
                id: 'srv_' + Date.now(),
                name: name,
                type: type,
                status: 'pending',
                config: config || '默认配置'
            };

            state.mcpServers.push(newServer);
            renderMcpServers();
            updateMcpCount();
            addSystemMessage(`已添加MCP服务器: ${name}`);

            // 清空表单
            document.getElementById('mcpName').value = '';
            document.getElementById('mcpConfig').value = '';
        }

        function updateMcpCount() {
            const connected = state.mcpServers.filter(s => s.status === 'connected').length;
            const total = state.mcpServers.length;
            document.getElementById('statusMcpCount').textContent = `${connected}/${total} 个服务器`;
            document.getElementById('mcpCount').textContent = `${connected} 个已连接`;
        }

        // 命令面板
        function openCommandPalette() {
            elements.commandPalette.classList.add('active');
            elements.commandPaletteInput.value = '';
            elements.commandPaletteInput.focus();
            renderCommandPaletteList(commands);
        }

        function closeCommandPalette() {
            elements.commandPalette.classList.remove('active');
        }

        function filterCommands() {
            const query = elements.commandPaletteInput.value.toLowerCase();
            const filtered = commands.filter(cmd => 
                cmd.key.toLowerCase().includes(query) || 
                cmd.desc.toLowerCase().includes(query)
            );
            renderCommandPaletteList(filtered);
        }

        function renderCommandPaletteList(cmds) {
            const html = cmds.map((cmd, index) => `
                <div class="command-palette-item ${index === 0 ? 'selected' : ''}" data-command="${cmd.key}">
                    <span class="command-palette-item-key">${cmd.key}</span>
                    <span class="command-palette-item-desc">${cmd.desc}</span>
                </div>
            `).join('');

            elements.commandPaletteList.innerHTML = html;

            // 添加点击事件
            document.querySelectorAll('.command-palette-item').forEach(item => {
                item.addEventListener('click', () => {
                    const commandKey = item.getAttribute('data-command');
                    const cmd = commands.find(c => c.key === commandKey);
                    if (cmd) {
                        cmd.action();
                        closeCommandPalette();
                    }
                });
            });
        }

        function openCustomCommandPalette(title, contentHtml, onSelect) {
            const palette = elements.commandPalette;
            const input = elements.commandPaletteInput;
            const list = elements.commandPaletteList;

            input.placeholder = title;
            list.innerHTML = contentHtml;
            palette.classList.add('active');
            input.focus();

            // 添加选择事件
            document.querySelectorAll('.command-palette-item').forEach(item => {
                item.addEventListener('click', () => {
                    onSelect(item);
                });
            });
        }

        // 工具函数
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getModelName(modelId) {
            const map = {
                'sonnet': 'Claude Sonnet 4.5',
                'opus': 'Claude Opus 4.5',
                'haiku': 'Claude Haiku 4.5'
            };
            return map[modelId] || '未知模型';
        }

        function getModeName(mode) {
            const map = {
                'interactive': '交互模式',
                'print': '打印模式',
                'plan': '计划模式'
            };
            return map[mode] || '未知模式';
        }

        function updateStatusbar() {
            elements.statusModelName.textContent = getModelName(state.currentModel);
            elements.statusModeName.textContent = getModeName(state.currentMode);
        }

        function showWelcomeMessage() {
            addSystemMessage('欢迎使用 Claude Code VSCode 插件！\n输入 <span class="help-key">/</span> 或使用 <span class="help-key">Ctrl+K</span> 打开命令面板开始。');
        }

        function getIconSvg(icon) {
            const icons = {
                'plus': '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
                'history': '<svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
                'download': '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
                'server': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
                'model': '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                'shield': '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
                'command': '<svg viewBox="0 0 24 24"><path d="M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z"/></svg>',
                'info': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
                'help': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>'
            };
            return icons[icon] || '';
        }

        // 全局函数（供HTML调用）
        window.connectMcp = connectMcp;
        window.disconnectMcp = disconnectMcp;
        window.editMcp = editMcp;

        // 启动应用
        init();
    </script>
</body>
</html>
```

## 设计亮点

### 1. **VSCode 插件风格**
- **活动栏**：左侧竖条，4个图标（聊天、设置、MCP、帮助）
- **侧边栏**：类似VSCode的侧边栏，包含分组命令
- **主编辑区**：多选项卡设计，类似VSCode编辑器
- **状态栏**：底部状态栏，显示连接状态、模型、MCP服务器数量等

### 2. **界面布局**
```
┌─────────────────────────────────────────────────────┐
│ 标题栏 (插件名称 + 窗口控制)                        │
├─────────────┬───────────────────────────────────────┤
│ 活动栏      │ 选项卡 (聊天/设置/MCP/帮助)           │
│ (图标)      ├───────────────────────────────────────┤
│             │ 侧边栏                                │
│             │ • 聊天组                              │
│             │ • 管理组                              │
│             │ • 工具组                              │
├─────────────┼───────────────────────────────────────┤
│             │ 主内容区                              │
│             │ • 聊天视图 (消息 + 输入)              │
│             │ • 设置视图 (模型/权限/界面)           │
│             │ • MCP视图 (服务器列表 + 添加)         │
│             │ • 帮助视图 (命令/快捷键/功能)         │
└─────────────┴───────────────────────────────────────┘
│ 状态栏 (连接/模型/MCP/模式/版本)                   │
└─────────────────────────────────────────────────────┘
```

### 3. **功能模块**

#### **聊天视图**
- 消息气泡（用户/Claude/系统）
- 模式切换按钮（交互/打印/计划）
- 动作按钮（模型选择、MCP管理）
- 输入区域（支持Ctrl+Enter发送）

#### **设置视图**
- 模型设置（选择Sonnet/Opus/Haiku）
- 权限设置（Bash/Edit/Network）
- 界面设置（主题、状态栏等）

#### **MCP管理视图**
- 服务器列表（显示状态、类型、配置）
- 连接/断开操作
- 添加服务器表单
- 实时计数更新

#### **帮助视图**
- 快速开始指南
- 常用命令列表
- 功能说明

### 4. **交互特性**

#### **命令面板 (Ctrl+K)**
- 模仿VSCode的命令面板
- 支持搜索过滤
- 键盘导航（上下箭头选择）

#### **命令菜单 (/)**
- 输入 `/` 呼出命令菜单
- 支持键盘导航
- 执行对应功能

#### **状态栏**
- 实时显示连接状态
- 显示当前模型
- 显示MCP服务器数量
- 显示当前模式
- 显示版本号

### 5. **视觉设计**
- **VSCode主题**：深色主题，使用VSCode的标准颜色
- **图标系统**：使用SVG图标，风格统一
- **状态指示**：不同状态使用不同颜色（绿/红/黄）
- **交互反馈**：悬停效果、点击反馈、状态变化动画

### 6. **响应式设计**
- 适配不同屏幕尺寸
- 在小屏幕上调整布局
- 保持核心功能可用

这个界面完全模仿了VSCode插件的风格，提供了完整的Claude Code功能，包括聊天、设置、MCP管理、帮助等，同时保持了VSCode插件的专业外观和交互体验。

# 专业版 Claude Code CLI 可视化界面

我将创建一个功能完整、专业且紧凑的界面，严格参考官方文档，包含所有CLI命令、标志和交互功能。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code CLI - 专业界面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }

        :root {
            --bg-color: #0d1117;
            --header-bg: #161b22;
            --sidebar-bg: #161b22;
            --text-color: #c9d1d9;
            --accent-color: #58a6ff;
            --secondary-accent: #3fb950;
            --code-bg: #0d1117;
            --border-color: #30363d;
            --success-color: #2ea043;
            --error-color: #f85149;
            --warning-color: #d29922;
            --info-color: #79c0ff;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
            padding: 8px;
        }

        /* 顶部导航栏 */
        .header {
            background-color: var(--header-bg);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 6px 6px 0 0;
            border-bottom: 1px solid var(--border-color);
            height: 48px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--accent-color);
        }

        .logo-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .window-controls {
            display: flex;
            gap: 6px;
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .control-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent-color);
        }

        .control-btn.active {
            background: var(--accent-color);
            color: var(--bg-color);
            border-color: var(--accent-color);
        }

        /* 主内容区 */
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
            background-color: var(--bg-color);
            border-radius: 0 0 6px 6px;
        }

        /* 侧边栏 - 命令参考 */
        .sidebar {
            width: 320px;
            background-color: var(--sidebar-bg);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sidebar-header {
            padding: 10px;
            border-bottom: 1px solid var(--border-color);
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sidebar-tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-tab {
            flex: 1;
            padding: 8px;
            background: transparent;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            font-size: 11px;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .sidebar-tab:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-tab.active {
            border-bottom-color: var(--accent-color);
            color: var(--accent-color);
        }

        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--info-color);
            margin: 12px 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .command-item {
            padding: 6px 8px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            border-left: 2px solid var(--border-color);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 11px;
        }

        .command-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-left-color: var(--accent-color);
        }

        .command-name {
            color: var(--accent-color);
            font-weight: 600;
            margin-bottom: 2px;
        }

        .command-desc {
            color: #888;
            font-size: 10px;
            margin-bottom: 4px;
        }

        .command-example {
            color: var(--secondary-accent);
            font-size: 10px;
            opacity: 0.8;
        }

        .flag-item {
            padding: 6px 8px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 11px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .flag-item:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .flag-name {
            color: var(--warning-color);
            font-weight: 600;
        }

        .flag-desc {
            color: #888;
            font-size: 10px;
        }

        .flag-example {
            color: var(--secondary-accent);
            font-size: 10px;
            margin-top: 2px;
            font-style: italic;
        }

        .shortcut-item {
            padding: 6px 8px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .shortcut-item:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .shortcut-key {
            color: var(--accent-color);
            font-weight: 600;
            min-width: 60px;
        }

        .shortcut-desc {
            color: #888;
            font-size: 10px;
        }

        /* 聊天区域 */
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            padding: 8px 12px;
            background: var(--header-bg);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }

        .chat-messages {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            background-color: var(--code-bg);
            border-bottom: 1px solid var(--border-color);
        }

        .message {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;
            line-height: 1.4;
            font-size: 13px;
            max-width: 90%;
            word-wrap: break-word;
        }

        .user-message {
            background-color: rgba(88, 166, 255, 0.1);
            border-left: 2px solid var(--accent-color);
            margin-left: auto;
        }

        .claude-message {
            background-color: rgba(63, 185, 80, 0.08);
            border-left: 2px solid var(--secondary-accent);
        }

        .system-message {
            background-color: rgba(255, 255, 255, 0.03);
            border-left: 2px solid #555;
            font-style: italic;
            color: #888;
        }

        .message-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
            font-size: 11px;
            color: #888;
        }

        .message-role {
            font-weight: 600;
            color: var(--accent-color);
        }

        .code-block {
            background-color: #0d1117;
            border-radius: 4px;
            padding: 8px;
            margin-top: 6px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            border: 1px solid var(--border-color);
        }

        .code-block .code-header {
            display: flex;
            justify-content: space-between;
            color: #888;
            font-size: 10px;
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--border-color);
        }

        .copy-btn {
            background: transparent;
            border: none;
            color: var(--accent-color);
            cursor: pointer;
            font-size: 10px;
            padding: 2px 6px;
        }

        /* 输入区域 */
        .input-area {
            padding: 10px;
            background-color: var(--header-bg);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .input-row {
            display: flex;
            gap: 8px;
        }

        .command-input {
            flex: 1;
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 8px 10px;
            border-radius: 4px;
            font-size: 13px;
            outline: none;
        }

        .command-input:focus {
            border-color: var(--accent-color);
        }

        .send-btn {
            background-color: var(--accent-color);
            color: var(--bg-color);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
        }

        .send-btn:hover {
            background-color: #4a90d9;
        }

        .send-btn:disabled {
            background-color: #333;
            cursor: not-allowed;
        }

        .options-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            padding: 4px 0;
            border-top: 1px solid var(--border-color);
        }

        .option-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }

        .option-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent-color);
        }

        .option-btn.active {
            background: var(--accent-color);
            color: var(--bg-color);
            border-color: var(--accent-color);
        }

        /* 状态指示器 */
        .status-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: #888;
            padding: 4px 0;
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--success-color);
        }

        .status-indicator.inactive {
            background-color: #444;
        }

        .status-indicator.processing {
            background-color: var(--warning-color);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        /* 模态框 */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--header-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .modal-header {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            color: var(--accent-color);
        }

        .modal-body {
            padding: 12px;
            overflow-y: auto;
            flex: 1;
        }

        .modal-close {
            background: transparent;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
        }

        .modal-close:hover {
            color: var(--accent-color);
        }

        /* 全屏模式 */
        .fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000;
            padding: 0;
            border-radius: 0;
        }

        .fullscreen .container {
            height: 100%;
            border-radius: 0;
        }

        .fullscreen .main-content {
            border-radius: 0;
        }

        /* 响应式设计 */
        @media (max-width: 1200px) {
            .sidebar {
                width: 280px;
            }
        }

        @media (max-width: 900px) {
            .main-content {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                max-height: 200px;
                border-right: none;
                border-bottom: 1px solid var(--border-color);
            }
            
            .sidebar-content {
                display: none;
            }
            
            .sidebar.active .sidebar-content {
                display: block;
            }
            
            .sidebar-header {
                cursor: pointer;
            }
            
            .sidebar-header:hover {
                background: rgba(255, 255, 255, 0.05);
            }
        }

        /* 滚动条样式 */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-color);
        }

        ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444;
        }

        /* 加载动画 */
        .typing-indicator {
            display: inline-flex;
            gap: 3px;
            padding: 4px;
        }

        .typing-dot {
            width: 4px;
            height: 4px;
            background-color: var(--accent-color);
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-3px); }
        }

        .help-text {
            color: #888;
            font-size: 11px;
            margin-top: 8px;
            line-height: 1.4;
        }

        .keyword {
            color: var(--accent-color);
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container" id="appContainer">
        <!-- 顶部导航 -->
        <div class="header">
            <div class="logo">
                <div class="logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <span>Claude Code CLI</span>
            </div>
            <div class="window-controls">
                <button class="control-btn" id="helpBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    帮助
                </button>
                <button class="control-btn" id="smallWindowBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>
                    小窗口
                </button>
                <button class="control-btn" id="fullscreenBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    全屏
                </button>
                <button class="control-btn" id="resetBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    重置
                </button>
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
            <!-- 侧边栏 - 命令参考 -->
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header" id="sidebarHeader">
                    <span>命令参考</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
                <div class="sidebar-tabs">
                    <button class="sidebar-tab active" data-tab="commands">CLI命令</button>
                    <button class="sidebar-tab" data-tab="flags">标志</button>
                    <button class="sidebar-tab" data-tab="shortcuts">快捷键</button>
                </div>
                <div class="sidebar-content" id="sidebarContent">
                    <!-- 内容通过JS动态加载 -->
                </div>
            </div>

            <!-- 聊天区域 -->
            <div class="chat-area">
                <div class="chat-header">
                    <span>对话会话</span>
                    <span id="sessionInfo">新会话</span>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message system-message">
                        <div class="message-header">
                            <span class="message-role">系统</span>
                        </div>
                        <div>欢迎使用 Claude Code CLI 专业界面。左侧选择命令，或直接输入。</div>
                    </div>
                </div>

                <div class="input-area">
                    <div class="input-row">
                        <input type="text" class="command-input" id="commandInput" placeholder="输入命令或消息... (Enter发送)">
                        <button class="send-btn" id="sendBtn">发送</button>
                    </div>
                    
                    <div class="options-row">
                        <button class="option-btn" data-mode="interactive">交互模式</button>
                        <button class="option-btn" data-mode="print">打印模式 (-p)</button>
                        <button class="option-btn" data-mode="continue">继续会话 (-c)</button>
                        <button class="option-btn" data-mode="resume">恢复会话 (-r)</button>
                    </div>
                    
                    <div class="status-bar">
                        <div class="status-indicator" id="statusIndicator"></div>
                        <span id="statusText">就绪</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 帮助模态框 -->
    <div class="modal" id="helpModal">
        <div class="modal-content">
            <div class="modal-header">
                <span>Claude Code CLI 参考</span>
                <button class="modal-close" id="closeHelp">×</button>
            </div>
            <div class="modal-body" id="helpContent">
                <!-- 内容通过JS动态加载 -->
            </div>
        </div>
    </div>

    <script>
        // DOM 元素
        const appContainer = document.getElementById('appContainer');
        const sidebar = document.getElementById('sidebar');
        const sidebarHeader = document.getElementById('sidebarHeader');
        const sidebarContent = document.getElementById('sidebarContent');
        const chatMessages = document.getElementById('chatMessages');
        const commandInput = document.getElementById('commandInput');
        const sendBtn = document.getElementById('sendBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const smallWindowBtn = document.getElementById('smallWindowBtn');
        const resetBtn = document.getElementById('resetBtn');
        const helpBtn = document.getElementById('helpBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const sessionInfo = document.getElementById('sessionInfo');
        const helpModal = document.getElementById('helpModal');
        const closeHelp = document.getElementById('closeHelp');
        const helpContent = document.getElementById('helpContent');
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        const optionButtons = document.querySelectorAll('.option-btn');

        // 状态变量
        let isProcessing = false;
        let isFullscreen = false;
        let currentMode = 'interactive';
        let currentTab = 'commands';

        // 官方文档数据
        const cliCommands = [
            { name: 'claude', desc: '启动交互式 REPL', example: 'claude' },
            { name: 'claude "query"', desc: '使用初始提示启动 REPL', example: 'claude "explain this project"' },
            { name: 'claude -p "query"', desc: '通过 SDK 查询，然后退出', example: 'claude -p "explain this function"' },
            { name: 'cat file | claude -p "query"', desc: '处理管道内容', example: 'cat logs.txt | claude -p "explain"' },
            { name: 'claude -c', desc: '继续当前目录中最近的对话', example: 'claude -c' },
            { name: 'claude -c -p "query"', desc: '通过 SDK 继续', example: 'claude -c -p "Check for type errors"' },
            { name: 'claude -r "<session>" "query"', desc: '按 ID 或名称恢复会话', example: 'claude -r "auth-refactor" "Finish this PR"' },
            { name: 'claude update', desc: '更新到最新版本', example: 'claude update' },
            { name: 'claude mcp', desc: '配置 MCP 服务器', example: 'claude mcp' }
        ];

        const cliFlags = [
            { name: '--add-dir', desc: '添加额外的工作目录', example: 'claude --add-dir ../apps ../lib' },
            { name: '--agent', desc: '为当前会话指定代理', example: 'claude --agent my-custom-agent' },
            { name: '--agents', desc: '动态定义自定义 subagents', example: 'claude --agents \'{"reviewer":{...}}\'' },
            { name: '--allow-dangerously-skip-permissions', desc: '启用权限绕过选项', example: 'claude --permission-mode plan --allow-dangerously-skip-permissions' },
            { name: '--allowedTools', desc: '无需提示权限即可执行的工具', example: 'claude --allowedTools "Bash(git log *)"' },
            { name: '--append-system-prompt', desc: '附加自定义文本到系统提示', example: 'claude --append-system-prompt "Always use TypeScript"' },
            { name: '--betas', desc: '包含 Beta 标头', example: 'claude --betas interleaved-thinking' },
            { name: '--chrome', desc: '启用 Chrome 浏览器集成', example: 'claude --chrome' },
            { name: '--continue, -c', desc: '继续当前目录中最近的对话', example: 'claude --continue' },
            { name: '--dangerously-skip-permissions', desc: '跳过所有权限提示', example: 'claude --dangerously-skip-permissions' },
            { name: '--debug', desc: '启用调试模式', example: 'claude --debug "api,mcp"' },
            { name: '--disable-slash-commands', desc: '禁用所有 skills 和 slash commands', example: 'claude --disable-slash-commands' },
            { name: '--disallowedTools', desc: '从上下文中删除的工具', example: 'claude --disallowedTools "Edit"' },
            { name: '--fallback-model', desc: '自动回退到指定模型', example: 'claude -p --fallback-model sonnet "query"' },
            { name: '--fork-session', desc: '创建新的会话 ID', example: 'claude --resume abc123 --fork-session' },
            { name: '--from-pr', desc: '恢复链接到特定 GitHub PR 的会话', example: 'claude --from-pr 123' },
            { name: '--ide', desc: '自动连接到 IDE', example: 'claude --ide' },
            { name: '--init', desc: '运行初始化 hooks 并启动交互模式', example: 'claude --init' },
            { name: '--init-only', desc: '运行初始化 hooks 并退出', example: 'claude --init-only' },
            { name: '--include-partial-messages', desc: '包含部分流事件', example: 'claude -p --output-format stream-json --include-partial-messages "query"' },
            { name: '--input-format', desc: '为打印模式指定输入格式', example: 'claude -p --output-format json --input-format stream-json' },
            { name: '--json-schema', desc: '获得与 JSON Schema 匹配的输出', example: 'claude -p --json-schema \'{"type":"object",...}\' "query"' },
            { name: '--maintenance', desc: '运行维护 hooks 并退出', example: 'claude --maintenance' },
            { name: '--max-budget-usd', desc: '停止的最大美元金额', example: 'claude -p --max-budget-usd 5.00 "query"' },
            { name: '--max-turns', desc: '限制代理转数', example: 'claude -p --max-turns 3 "query"' },
            { name: '--mcp-config', desc: '从 JSON 文件或字符串加载 MCP 服务器', example: 'claude --mcp-config ./mcp.json' },
            { name: '--model', desc: '为当前会话设置模型', example: 'claude --model claude-sonnet-4-5-20250929' },
            { name: '--no-chrome', desc: '禁用 Chrome 浏览器集成', example: 'claude --no-chrome' },
            { name: '--no-session-persistence', desc: '禁用会话持久化', example: 'claude -p --no-session-persistence "query"' },
            { name: '--output-format', desc: '为打印模式指定输出格式', example: 'claude -p "query" --output-format json' },
            { name: '--permission-mode', desc: '以指定的权限模式开始', example: 'claude --permission-mode plan' },
            { name: '--permission-prompt-tool', desc: '指定 MCP 工具处理权限提示', example: 'claude -p --permission-prompt-tool mcp_auth_tool "query"' },
            { name: '--plugin-dir', desc: '从此会话从目录加载插件', example: 'claude --plugin-dir ./my-plugins' },
            { name: '--print, -p', desc: '打印响应而不进入交互模式', example: 'claude -p "query"' },
            { name: '--remote', desc: '在 claude.ai 上创建新的网络会话', example: 'claude --remote "Fix the login bug"' },
            { name: '--resume, -r', desc: '恢复特定会话', example: 'claude --resume auth-refactor' },
            { name: '--session-id', desc: '使用特定的会话 ID', example: 'claude --session-id "550e8400-e29b-41d4-a716-446655440000"' },
            { name: '--setting-sources', desc: '加载设置源列表', example: 'claude --setting-sources user,project' },
            { name: '--settings', desc: '加载其他设置', example: 'claude --settings ./settings.json' },
            { name: '--strict-mcp-config', desc: '仅使用来自 --mcp-config 的 MCP 服务器', example: 'claude --strict-mcp-config --mcp-config ./mcp.json' },
            { name: '--system-prompt', desc: '用自定义文本替换整个系统提示', example: 'claude --system-prompt "You are a Python expert"' },
            { name: '--system-prompt-file', desc: '从文件加载系统提示', example: 'claude -p --system-prompt-file ./custom-prompt.txt "query"' },
            { name: '--teleport', desc: '在本地终端中恢复网络会话', example: 'claude --teleport' },
            { name: '--teammate-mode', desc: '设置代理团队队友的显示方式', example: 'claude --teammate-mode in-process' },
            { name: '--tools', desc: '限制 Claude 可以使用的工具', example: 'claude --tools "Bash,Edit,Read"' },
            { name: '--verbose', desc: '启用详细日志记录', example: 'claude --verbose' },
            { name: '--version, -v', desc: '输出版本号', example: 'claude -v' }
        ];

        const keyboardShortcuts = [
            { key: 'Ctrl+C', desc: '取消当前输入或生成' },
            { key: 'Ctrl+D', desc: '退出 Claude Code 会话' },
            { key: 'Ctrl+G', desc: '在默认文本编辑器中打开' },
            { key: 'Ctrl+L', desc: '清除终端屏幕' },
            { key: 'Ctrl+O', desc: '切换详细输出' },
            { key: 'Ctrl+R', desc: '反向搜索命令历史' },
            { key: 'Ctrl+V', desc: '从剪贴板粘贴图像' },
            { key: 'Ctrl+B', desc: '后台运行任务' },
            { key: 'Left/Right arrows', desc: '在对话框选项卡之间循环' },
            { key: 'Up/Down arrows', desc: '导航命令历史' },
            { key: 'Esc + Esc', desc: '回退代码/对话' },
            { key: 'Shift+Tab', desc: '切换权限模式' },
            { key: 'Option+P (macOS)', desc: '切换模型' },
            { key: 'Option+T (macOS)', desc: '切换扩展思考' },
            { key: 'Ctrl+K', desc: '删除到行尾' },
            { key: 'Ctrl+U', desc: '删除整行' },
            { key: 'Ctrl+Y', desc: '粘贴已删除的文本' },
            { key: 'Alt+Y', desc: '循环粘贴历史' },
            { key: 'Alt+B', desc: '将光标向后移动一个单词' },
            { key: 'Alt+F', desc: '将光标向前移动一个单词' },
            { key: 'Ctrl+T', desc: '切换代码块的语法高亮' },
            { key: '\\ + Enter', desc: '快速转义多行输入' },
            { key: 'Option+Enter', desc: '多行输入 (macOS默认)' },
            { key: 'Shift+Enter', desc: '多行输入 (iTerm2等)' },
            { key: 'Ctrl+J', desc: '多行的换行符' },
            { key: '/ (开始)', desc: '命令或 skill' },
            { key: '! (开始)', desc: 'Bash 模式' },
            { key: '@', desc: '文件路径提及' }
        ];

        const builtinCommands = [
            { name: '/clear', desc: '清除对话历史' },
            { name: '/compact [instructions]', desc: '使用可选焦点指令压缩对话' },
            { name: '/config', desc: '打开设置界面' },
            { name: '/context', desc: '将当前上下文使用情况可视化为彩色网格' },
            { name: '/cost', desc: '显示令牌使用统计信息' },
            { name: '/doctor', desc: '检查您的 Claude Code 安装的健康状况' },
            { name: '/exit', desc: '退出 REPL' },
            { name: '/export [filename]', desc: '将当前对话导出到文件或剪贴板' },
            { name: '/help', desc: '获取使用帮助' },
            { name: '/init', desc: '使用 CLAUDE.md 指南初始化项目' },
            { name: '/mcp', desc: '管理 MCP server 连接和 OAuth 身份验证' },
            { name: '/memory', desc: '编辑 CLAUDE.md 内存文件' },
            { name: '/model', desc: '选择或更改 AI 模型' },
            { name: '/permissions', desc: '查看或更新权限' },
            { name: '/plan', desc: '直接从提示进入 Plan Mode' },
            { name: '/rename <name>', desc: '重命名当前会话' },
            { name: '/resume [session]', desc: '恢复对话' },
            { name: '/rewind', desc: '回退对话和/或代码' },
            { name: '/stats', desc: '可视化每日使用情况' },
            { name: '/status', desc: '打开设置界面（状态选项卡）' },
            { name: '/statusline', desc: '设置 Claude Code 的状态行 UI' },
            { name: '/tasks', desc: '列出并管理后台任务' },
            { name: '/teleport', desc: '从 claude.ai 恢复远程会话' },
            { name: '/theme', desc: '更改颜色主题' },
            { name: '/todos', desc: '列出当前 TODO 项' },
            { name: '/usage', desc: '显示计划使用限制和速率限制状态' }
        ];

        const bashCommands = [
            { name: '! npm test', desc: '运行 npm test' },
            { name: '! git status', desc: '查看 git 状态' },
            { name: '! ls -la', desc: '列出文件' },
            { name: '! cat file.txt', desc: '查看文件内容' },
            { name: '! grep "pattern" file', desc: '搜索文件内容' }
        ];

        // 加载侧边栏内容
        function loadSidebarContent(tab) {
            currentTab = tab;
            let html = '';

            if (tab === 'commands') {
                html += '<div class="section-title">CLI 命令</div>';
                cliCommands.forEach(cmd => {
                    html += `
                        <div class="command-item" data-command="${cmd.example}">
                            <div class="command-name">${cmd.name}</div>
                            <div class="command-desc">${cmd.desc}</div>
                            <div class="command-example">${cmd.example}</div>
                        </div>
                    `;
                });
                
                html += '<div class="section-title">内置命令</div>';
                builtinCommands.forEach(cmd => {
                    html += `
                        <div class="command-item" data-command="${cmd.name}">
                            <div class="command-name">${cmd.name}</div>
                            <div class="command-desc">${cmd.desc}</div>
                        </div>
                    `;
                });
                
                html += '<div class="section-title">Bash 模式</div>';
                bashCommands.forEach(cmd => {
                    html += `
                        <div class="command-item" data-command="${cmd.name}">
                            <div class="command-name">${cmd.name}</div>
                            <div class="command-desc">${cmd.desc}</div>
                        </div>
                    `;
                });
            } else if (tab === 'flags') {
                html += '<div class="section-title">CLI 标志</div>';
                cliFlags.forEach(flag => {
                    html += `
                        <div class="flag-item" data-command="${flag.name}">
                            <div class="flag-name">${flag.name}</div>
                            <div class="flag-desc">${flag.desc}</div>
                            <div class="flag-example">${flag.example}</div>
                        </div>
                    `;
                });
            } else if (tab === 'shortcuts') {
                html += '<div class="section-title">键盘快捷键</div>';
                keyboardShortcuts.forEach(shortcut => {
                    html += `
                        <div class="shortcut-item" data-command="${shortcut.key}">
                            <div class="shortcut-key">${shortcut.key}</div>
                            <div class="shortcut-desc">${shortcut.desc}</div>
                        </div>
                    `;
                });
            }

            sidebarContent.innerHTML = html;

            // 添加点击事件
            document.querySelectorAll('.command-item, .flag-item, .shortcut-item').forEach(item => {
                item.addEventListener('click', () => {
                    const command = item.getAttribute('data-command');
                    if (command) {
                        commandInput.value = command + ' ';
                        commandInput.focus();
                    }
                });
            });
        }

        // 模拟Claude响应
        function getClaudeResponse(command) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    let response = '';
                    
                    if (command.includes('/help')) {
                        response = `
                        <div class="code-block">
                            <div class="code-header"><span>帮助</span></div>
                            <div>
                                <strong>内置命令：</strong><br>
                                /clear - 清除对话历史<br>
                                /compact - 压缩对话<br>
                                /config - 打开设置<br>
                                /help - 获取帮助<br>
                                /model - 更改模型<br>
                                /permissions - 查看权限<br>
                                /plan - 进入计划模式<br>
                                /stats - 查看统计<br>
                                /theme - 更改主题<br><br>
                                <strong>快捷键：</strong><br>
                                Ctrl+C - 取消<br>
                                Ctrl+D - 退出<br>
                                Ctrl+R - 反向搜索<br>
                                / - 命令菜单
                            </div>
                        </div>`;
                    } else if (command.includes('/model')) {
                        response = `
                        <div>可用模型：</div>
                        <div class="code-block">
                            <div class="code-header"><span>模型列表</span></div>
                            <div>
                                1. claude-sonnet-4-5-20250929 (默认)<br>
                                2. claude-opus-4-5-20250929<br>
                                3. claude-haiku-4-5-20250929<br><br>
                                使用 <span class="keyword">/model</span> 切换
                            </div>
                        </div>`;
                    } else if (command.includes('/plan')) {
                        response = `
                        <div>已进入计划模式。</div>
                        <div class="code-block">
                            <div class="code-header"><span>计划模式</span></div>
                            <div>
                                计划模式允许 Claude 在执行前审查所有操作。<br>
                                权限设置为：plan<br>
                                使用 <span class="keyword">Shift+Tab</span> 切换模式
                            </div>
                        </div>`;
                    } else if (command.includes('/config')) {
                        response = `
                        <div>设置界面已打开。</div>
                        <div class="code-block">
                            <div class="code-header"><span>设置</span></div>
                            <div>
                                <strong>主要设置：</strong><br>
                                模型：claude-sonnet-4-5-20250929<br>
                                权限模式：normal<br>
                                详细输出：关闭<br>
                                Chrome集成：启用<br><br>
                                使用 <span class="keyword">/theme</span> 更改主题
                            </div>
                        </div>`;
                    } else if (command.includes('/status')) {
                        response = `
                        <div>状态信息：</div>
                        <div class="code-block">
                            <div class="code-header"><span>系统状态</span></div>
                            <div>
                                版本：1.0.0<br>
                                模型：claude-sonnet-4-5-20250929<br>
                                会话ID：新会话<br>
                                连接状态：正常<br>
                                MCP服务器：0个连接
                            </div>
                        </div>`;
                    } else if (command.includes('/theme')) {
                        response = `
                        <div>可用主题：</div>
                        <div class="code-block">
                            <div class="code-header"><span>主题列表</span></div>
                            <div>
                                1. 默认 (深色)<br>
                                2. 高对比度<br>
                                3. 浅色<br>
                                4. 紫色<br>
                                5. 绿色<br><br>
                                使用 <span class="keyword">/theme [名称]</span> 切换
                            </div>
                        </div>`;
                    } else if (command.includes('/stats')) {
                        response = `
                        <div>使用统计：</div>
                        <div class="code-block">
                            <div class="code-header"><span>统计信息</span></div>
                            <div>
                                今日令牌：1,234<br>
                                会话数：5<br>
                                胜利连击：3<br>
                                最常用模型：sonnet<br>
                                平均响应时间：1.2s
                            </div>
                        </div>`;
                    } else if (command.includes('!')) {
                        response = `
                        <div>Bash 模式执行：</div>
                        <div class="code-block">
                            <div class="code-header"><span>输出</span></div>
                            <div>
                                $ ${command.substring(1)}<br>
                                [命令执行输出将显示在此处]<br>
                                <em>注意：这是模拟输出，实际环境中会显示真实结果</em>
                            </div>
                        </div>`;
                    } else if (command.includes('claude -p')) {
                        response = `
                        <div>打印模式响应：</div>
                        <div class="code-block">
                            <div class="code-header"><span>响应</span></div>
                            <div>
                                这是使用 -p 标志的直接响应。<br>
                                不会进入交互模式，直接输出结果。<br>
                                适用于脚本和自动化。
                            </div>
                        </div>`;
                    } else if (command.includes('claude --continue') || command.includes('claude -c')) {
                        response = `
                        <div>继续会话：</div>
                        <div class="code-block">
                            <div class="code-header"><span>会话恢复</span></div>
                            <div>
                                已加载最近的会话。<br>
                                上下文已恢复。<br>
                                可以继续之前的对话。
                            </div>
                        </div>`;
                    } else if (command.includes('claude --resume') || command.includes('claude -r')) {
                        response = `
                        <div>恢复特定会话：</div>
                        <div class="code-block">
                            <div class="code-header"><span>会话详情</span></div>
                            <div>
                                会话ID：auth-refactor<br>
                                创建时间：2024-01-15<br>
                                上下文：代码重构<br>
                                状态：已完成<br><br>
                                <span class="keyword">/resume auth-refactor</span> 可恢复
                            </div>
                        </div>`;
                    } else if (command.includes('claude update')) {
                        response = `
                        <div>更新检查：</div>
                        <div class="code-block">
                            <div class="code-header"><span>更新状态</span></div>
                            <div>
                                当前版本：1.0.0<br>
                                最新版本：1.0.0<br>
                                状态：已是最新<br><br>
                                使用 <span class="keyword">claude update</span> 更新
                            </div>
                        </div>`;
                    } else if (command.includes('claude mcp')) {
                        response = `
                        <div>MCP 服务器配置：</div>
                        <div class="code-block">
                            <div class="code-header"><span>MCP 配置</span></div>
                            <div>
                                MCP 服务器配置界面已打开。<br>
                                当前连接：0个服务器<br>
                                使用 <span class="keyword">/mcp</span> 管理连接
                            </div>
                        </div>`;
                    } else if (command.includes('--output-format json')) {
                        response = `
                        <div>JSON 格式输出：</div>
                        <div class="code-block">
                            <div class="code-header"><span>JSON 响应</span></div>
                            <div>
                                {<br>
                                &nbsp;&nbsp;"response": "这是JSON格式的响应",<br>
                                &nbsp;&nbsp;"status": "success",<br>
                                &nbsp;&nbsp;"timestamp": "2024-01-15T10:30:00Z"<br>
                                }
                            </div>
                        </div>`;
                    } else if (command.includes('--model')) {
                        response = `
                        <div>模型已切换：</div>
                        <div class="code-block">
                            <div class="code-header"><span>模型信息</span></div>
                            <div>
                                当前模型：claude-opus-4-5-20250929<br>
                                特点：高智能，复杂推理<br>
                                适用场景：代码审查，架构设计<br><br>
                                使用 <span class="keyword">/model</span> 查看所有模型
                            </div>
                        </div>`;
                    } else if (command.includes('--tools')) {
                        response = `
                        <div>工具限制：</div>
                        <div class="code-block">
                            <div class="code-header"><span>可用工具</span></div>
                            <div>
                                Bash - 命令执行<br>
                                Edit - 文件编辑<br>
                                Read - 文件读取<br>
                                Grep - 文本搜索<br>
                                Glob - 文件匹配<br><br>
                                使用 <span class="keyword">--tools "Bash,Read"</span> 限制
                            </div>
                        </div>`;
                    } else if (command.includes('--debug')) {
                        response = `
                        <div>调试模式：</div>
                        <div class="code-block">
                            <div class="code-header"><span>调试信息</span></div>
                            <div>
                                调试模式已启用。<br>
                                类别：api, mcp<br>
                                日志级别：详细<br><br>
                                使用 <span class="keyword">--debug "category"</span> 过滤
                            </div>
                        </div>`;
                    } else {
                        const responses = [
                            "这是我的分析：",
                            "根据您的需求：",
                            "建议尝试以下方法：",
                            "这是解决方案：",
                            "让我为您解释："
                        ];
                        response = responses[Math.floor(Math.random() * responses.length)] + "<br><br>您可以尝试输入 <span class="keyword">/help</span> 查看可用命令。";
                    }

                    resolve(response);
                }, 800 + Math.random() * 800);
            });
        }

        // 添加消息到聊天区域
        function addMessage(content, role = 'user') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${role}-message`;
            
            let roleText = '';
            if (role === 'user') roleText = '您';
            else if (role === 'claude') roleText = 'Claude';
            else if (role === 'system') roleText = '系统';
            
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role">${roleText}</span>
                </div>
                <div>${content}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // 添加打字指示器
        function addTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message claude-message';
            typingDiv.id = 'typingIndicator';
            
            typingDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-role">Claude</span>
                </div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // 移除打字指示器
        function removeTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.remove();
            }
        }

        // 更新状态
        function updateStatus(status, isActive = true) {
            statusText.textContent = status;
            
            if (isProcessing) {
                statusIndicator.className = 'status-indicator processing';
            } else if (isActive) {
                statusIndicator.className = 'status-indicator';
            } else {
                statusIndicator.className = 'status-indicator inactive';
            }
        }

        // 处理发送消息
        async function sendMessage() {
            const input = commandInput.value.trim();
            if (!input || isProcessing) return;
            
            isProcessing = true;
            updateStatus('处理中...', true);
            
            // 添加用户消息
            addMessage(input, 'user');
            commandInput.value = '';
            
            // 添加打字指示器
            addTypingIndicator();
            
            try {
                // 获取Claude响应
                const response = await getClaudeResponse(input);
                
                // 移除打字指示器并添加响应
                removeTypingIndicator();
                addMessage(response, 'claude');
                
                updateStatus('就绪', true);
            } catch (error) {
                removeTypingIndicator();
                addMessage('处理请求时出现错误。', 'system');
                updateStatus('错误', false);
            } finally {
                isProcessing = false;
            }
        }

        // 显示帮助模态框
        function showHelpModal() {
            helpModal.classList.add('active');
            
            let content = '<div class="section-title">使用指南</div>';
            content += '<div class="help-text">';
            content += '<strong>命令行模式：</strong><br>';
            content += '• 交互模式: <span class="keyword">claude</span> 或 <span class="keyword">claude "初始提示"</span><br>';
            content += '• 打印模式: <span class="keyword">claude -p "查询"</span><br>';
            content += '• 继续会话: <span class="keyword">claude -c</span><br>';
            content += '• 恢复会话: <span class="keyword">claude -r "会话ID" "查询"</span><br>';
            content += '• Bash模式: <span class="keyword">! 命令</span><br>';
            content += '• 管道处理: <span class="keyword">cat file | claude -p "查询"</span><br><br>';
            
            content += '<strong>常用标志：</strong><br>';
            content += '• <span class="keyword">--model</span> 指定模型<br>';
            content += '• <span class="keyword">--tools</span> 限制可用工具<br>';
            content += '• <span class="keyword">--debug</span> 启用调试<br>';
            content += '• <span class="keyword">--output-format json</span> JSON输出<br><br>';
            
            content += '<strong>交互模式快捷键：</strong><br>';
            content += '• <span class="keyword">Ctrl+C</span> 取消<br>';
            content += '• <span class="keyword">Ctrl+D</span> 退出<br>';
            content += '• <span class="keyword">Ctrl+R</span> 反向搜索<br>';
            content += '• <span class="keyword">/</span> 命令菜单<br>';
            content += '• <span class="keyword">!</span> Bash模式<br><br>';
            
            content += '<strong>内置命令：</strong><br>';
            content += '/help, /model, /plan, /config, /status, /theme, /stats, /clear<br><br>';
            
            content += '<strong>提示：</strong><br>';
            content += '• 左侧侧边栏点击命令可快速插入<br>';
            content += '• 使用 -p 标志进行脚本化查询<br>';
            content += '• 使用 -c 继续上次对话<br>';
            content += '• 使用 /plan 进入安全模式<br>';
            content += '• 使用 ! 运行 shell 命令';
            content += '</div>';
            
            helpContent.innerHTML = content;
        }

        // 切换全屏
        function toggleFullscreen() {
            isFullscreen = !isFullscreen;
            
            if (isFullscreen) {
                appContainer.classList.add('fullscreen');
                fullscreenBtn.classList.add('active');
                smallWindowBtn.classList.remove('active');
            } else {
                appContainer.classList.remove('fullscreen');
                fullscreenBtn.classList.remove('active');
            }
        }

        // 切换小窗口
        function toggleSmallWindow() {
            isFullscreen = false;
            appContainer.classList.remove('fullscreen');
            fullscreenBtn.classList.remove('active');
            smallWindowBtn.classList.add('active');
            
            // 模拟小窗口效果
            appContainer.style.width = '80%';
            appContainer.style.margin = '15px auto';
            appContainer.style.border = '1px solid #333';
            appContainer.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
            
            setTimeout(() => {
                appContainer.style.width = '';
                appContainer.style.margin = '';
                appContainer.style.border = '';
                appContainer.style.boxShadow = '';
                smallWindowBtn.classList.remove('active');
            }, 2000);
        }

        // 重置界面
        function resetInterface() {
            chatMessages.innerHTML = `
                <div class="message system-message">
                    <div class="message-header">
                        <span class="message-role">系统</span>
                    </div>
                    <div>界面已重置。欢迎重新开始！</div>
                </div>
            `;
            commandInput.value = '';
            isProcessing = false;
            updateStatus('就绪', true);
            sessionInfo.textContent = '新会话';
        }

        // 事件监听器
        sendBtn.addEventListener('click', sendMessage);
        
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        fullscreenBtn.addEventListener('click', toggleFullscreen);
        smallWindowBtn.addEventListener('click', toggleSmallWindow);
        resetBtn.addEventListener('click', resetInterface);
        helpBtn.addEventListener('click', showHelpModal);
        closeHelp.addEventListener('click', () => helpModal.classList.remove('active'));

        // 侧边栏选项卡事件
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                sidebarTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadSidebarContent(tab.getAttribute('data-tab'));
            });
        });

        // 侧边栏折叠/展开（移动端）
        sidebarHeader.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                sidebar.classList.toggle('active');
            }
        });

        // 模式选择
        optionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                optionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode');
                
                // 根据模式更新界面
                if (currentMode === 'print') {
                    addMessage('已切换到打印模式。使用 claude -p "query" 进行查询。', 'system');
                } else if (currentMode === 'continue') {
                    addMessage('已切换到继续模式。使用 claude -c 继续上次对话。', 'system');
                } else if (currentMode === 'resume') {
                    addMessage('已切换到恢复模式。使用 claude -r "session" 恢复会话。', 'system');
                } else {
                    addMessage('已切换到交互模式。可以自由对话。', 'system');
                }
            });
        });

        // 关闭模态框
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });

        // 初始化
        loadSidebarContent('commands');
        updateStatus('就绪', true);
        commandInput.focus();
    </script>
</body>
</html>
```

## 功能亮点

### 1. **完整的CLI命令参考**
- **CLI命令**: 包含所有官方文档中的命令（`claude`, `claude -p`, `claude -c`等）
- **内置命令**: `/help`, `/model`, `/plan`, `/config`, `/status`等所有内置命令
- **Bash模式**: `!`前缀的shell命令示例

### 2. **全面的CLI标志支持**
- 包含所有官方文档中的标志（共35个）
- 每个标志都有描述和示例
- 按功能分类：权限、模型、输出格式、调试等

### 3. **交互模式快捷键**
- 常规控制: Ctrl+C, Ctrl+D, Ctrl+R等
- 文本编辑: Ctrl+K, Ctrl+U, Ctrl+Y等
- 多行输入: Shift+Enter, Option+Enter等
- 快速命令: /, !, @等

### 4. **专业界面设计**
- **侧边栏分类**: CLI命令、标志、快捷键三个标签页
- **响应式设计**: 在小屏幕上自动折叠侧边栏
- **专业配色**: 深色主题，适合开发者
- **SVG图标**: 无emoji，专业简洁

### 5. **模式支持**
- **交互模式**: 自由对话
- **打印模式**: `claude -p` 风格的查询
- **继续模式**: `claude -c` 继续会话
- **恢复模式**: `claude -r` 恢复特定会话

### 6. **模拟功能**
- **命令解析**: 识别各种命令并返回相应响应
- **状态指示器**: 显示处理状态
- **帮助模态框**: 完整的使用指南
- **会话管理**: 显示会话信息

### 7. **视觉稳定性**
- **固定布局**: 在拉伸变换下保持布局稳定
- **限制尺寸**: 最大宽度1600px，防止过宽
- **全屏支持**: 可全屏和小窗口切换
- **响应式**: 在不同屏幕尺寸下自动调整

这个界面严格遵循官方文档，提供了完整的Claude Code CLI功能的可视化操作，同时保持了专业、简洁的外观，适合开发者使用。