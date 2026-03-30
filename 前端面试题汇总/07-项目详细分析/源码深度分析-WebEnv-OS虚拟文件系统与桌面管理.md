# 源码深度分析 - WebEnv-OS虚拟文件系统与桌面管理

## 一、文档概述

本文档深入分析 WebEnv-OS 项目的虚拟文件系统（ZenFS + IndexedDB）、桌面管理系统（WindowManager、Dock、Taskbar）、IDE布局系统、终端集成等核心实现。

---

## 二、ZenFS 虚拟文件系统

### 2.1 ZenFS 架构

ZenFS 是一个基于 IndexedDB 的浏览器文件系统实现，允许 Web 应用程序在浏览器中创建持久化的虚拟文件系统。

```typescript
// 核心依赖
import { configure, fs } from '@zenfs/core';
import { IndexedDB } from '@zenfs/dom';

// 配置 ZenFS
export async function initVFS() {
  // 挂载 IndexedDB 后端到根目录
  await configure({
    mounts: {
      '/': IndexedDB,
    },
  });

  // 验证挂载
  const testFile = '/.test';
  await fs.promises.writeFile(testFile, 'test');
  await fs.promises.unlink(testFile);

  console.log('[VFS] ZenFS initialized successfully');
}

// 获取文件系统实例
export { fs as vfs };
```

### 2.2 VFS 核心操作

#### 2.2.1 文件读取

```typescript
/**
 * 读取文件内容
 * @param path - 文件路径
 * @returns 文件内容字符串
 */
export async function readFile(path: string): Promise<string> {
  try {
    const content = await vfs.promises.readFile(path, 'utf-8');
    return content;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    throw error;
  }
}
```

#### 2.2.2 文件写入

```typescript
/**
 * 写入文件内容
 * @param path - 文件路径
 * @param content - 文件内容
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    // 确保父目录存在
    const dir = path.split('/').slice(0, -1).join('/') || '/';
    await ensureDirectory(dir);

    // 写入文件
    await vfs.promises.writeFile(path, content, 'utf-8');
  } catch (error) {
    console.error('[VFS] Write error:', error);
    throw error;
  }
}

/**
 * 确保目录存在
 * @param dir - 目录路径
 */
async function ensureDirectory(dir: string): Promise<void> {
  try {
    await vfs.promises.mkdir(dir, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}
```

#### 2.2.3 目录列表

```typescript
/**
 * 读取目录内容
 * @param path - 目录路径
 * @returns 目录条目列表
 */
export async function readdir(path: string): Promise<VFSEntry[]> {
  try {
    const entries = await vfs.promises.readdir(path, { withFileTypes: true });

    return await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        const stats = await vfs.promises.stat(fullPath);

        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          size: stats.size,
          mtime: stats.mtime,
          atime: stats.atime,
          ctime: stats.ctime,
        };
      })
    );
  } catch (error) {
    console.error('[VFS] Readdir error:', error);
    throw error;
  }
}

/**
 * VFS 条目接口
 */
export interface VFSEntry {
  name: string;              // 文件/目录名
  path: string;              // 完整路径
  isDirectory: boolean;      // 是否为目录
  isFile: boolean;           // 是否为文件
  size: number;              // 文件大小（字节）
  mtime: Date;               // 修改时间
  atime: Date;               // 访问时间
  ctime: Date;               // 创建时间
}
```

#### 2.2.4 文件/目录删除

```typescript
/**
 * 删除文件或目录
 * @param path - 文件/目录路径
 * @param recursive - 是否递归删除目录
 */
export async function remove(path: string, recursive: boolean = false): Promise<void> {
  try {
    const stats = await vfs.promises.stat(path);

    if (stats.isDirectory()) {
      if (recursive) {
        await vfs.promises.rm(path, { recursive: true, force: true });
      } else {
        // 检查目录是否为空
        const entries = await vfs.promises.readdir(path);
        if (entries.length > 0) {
          throw new Error(`Directory not empty: ${path}`);
        }
        await vfs.promises.rmdir(path);
      }
    } else {
      await vfs.promises.unlink(path);
    }
  } catch (error) {
    console.error('[VFS] Remove error:', error);
    throw error;
  }
}
```

#### 2.2.5 文件/目录移动

```typescript
/**
 * 移动或重命名文件/目录
 * @param oldPath - 源路径
 * @param newPath - 目标路径
 */
export async function rename(oldPath: string, newPath: string): Promise<void> {
  try {
    // 确保目标目录存在
    const newDir = newPath.split('/').slice(0, -1).join('/') || '/';
    await ensureDirectory(newDir);

    await vfs.promises.rename(oldPath, newPath);
  } catch (error) {
    console.error('[VFS] Rename error:', error);
    throw error;
  }
}
```

#### 2.2.6 文件/目录复制

```typescript
/**
 * 复制文件或目录
 * @param srcPath - 源路径
 * @param destPath - 目标路径
 */
export async function copy(srcPath: string, destPath: string): Promise<void> {
  try {
    const stats = await vfs.promises.stat(srcPath);

    // 确保目标目录存在
    const destDir = destPath.split('/').slice(0, -1).join('/') || '/';
    await ensureDirectory(destDir);

    if (stats.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await vfs.promises.copyFile(srcPath, destPath);
    }
  } catch (error) {
    console.error('[VFS] Copy error:', error);
    throw error;
  }
}

/**
 * 递归复制目录
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await vfs.promises.mkdir(dest, { recursive: true });
  const entries = await vfs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = src === '/' ? `/${entry.name}` : `${src}/${entry.name}`;
    const destPath = dest === '/' ? `/${entry.name}` : `${dest}/${entry.name}`;

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await vfs.promises.copyFile(srcPath, destPath);
    }
  }
}
```

#### 2.2.7 文件统计信息

```typescript
/**
 * 获取文件统计信息
 * @param path - 文件路径
 * @returns 文件统计信息
 */
export async function stat(path: string): Promise<VFSStats> {
  try {
    const stats = await vfs.promises.stat(path);
    return {
      size: stats.size,
      mtime: stats.mtime,
      atime: stats.atime,
      ctime: stats.ctime,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      isSymbolicLink: stats.isSymbolicLink(),
    };
  } catch (error) {
    console.error('[VFS] Stat error:', error);
    throw error;
  }
}

/**
 * VFS 统计信息接口
 */
export interface VFSStats {
  size: number;              // 文件大小
  mtime: Date;               // 修改时间
  atime: Date;               // 访问时间
  ctime: Date;               // 创建时间
  mode: number;              // 权限模式
  uid: number;               // 用户 ID
  gid: number;               // 组 ID
  isDirectory: boolean;      // 是否为目录
  isFile: boolean;           // 是否为文件
  isSymbolicLink: boolean;   // 是否为符号链接
}
```

### 2.3 VFS 状态管理

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * VFS 状态管理
 */
interface VFSState {
  // 当前工作目录
  cwd: string;

  // 文件系统已初始化
  initialized: boolean;

  // 方法
  setCWD: (cwd: string) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useVFSStore = create<VFSState>()(
  persist(
    (set) => ({
      cwd: '/',
      initialized: false,

      setCWD: (cwd) => set({ cwd }),
      setInitialized: (initialized) => set({ initialized }),
    }),
    {
      name: 'webenv-vfs-store',
      partialize: (state) => ({
        cwd: state.cwd,
      }),
    }
  )
);
```

### 2.4 VFS 路径工具

```typescript
/**
 * 路径工具类
 */
export class VFSPath {
  /**
   * 标准化路径
   * @param path - 输入路径
   * @returns 标准化后的路径
   */
  static normalize(path: string): string {
    // 移除末尾斜杠（根目录除外）
    path = path.replace(/\/+$/, '/');
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // 移除重复斜杠
    path = path.replace(/\/+/g, '/');

    // 处理 .. 和 .
    const parts = path.split('/').filter((part, index) => {
      if (part === '' && index > 0) return false;
      if (part === '.') return false;
      if (part === '..') return true;
      return true;
    });

    // 处理 ..
    const result: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        if (result.length > 0) {
          result.pop();
        }
      } else {
        result.push(part);
      }
    }

    return result.length === 0 ? '/' : `/${result.join('/')}`;
  }

  /**
   * 解析路径为目录和文件名
   * @param path - 输入路径
   * @returns [目录, 文件名]
   */
  static parse(path: string): [string, string] {
    const normalized = this.normalize(path);
    const lastSlash = normalized.lastIndexOf('/');
    const dir = normalized.slice(0, lastSlash) || '/';
    const name = normalized.slice(lastSlash + 1);
    return [dir, name];
  }

  /**
   * 连接路径
   * @param paths - 路径段
   * @returns 连接后的路径
   */
  static join(...paths: string[]): string {
    return this.normalize(paths.join('/'));
  }

  /**
   * 获取相对路径
   * @param from - 源路径
   * @param to - 目标路径
   * @returns 相对路径
   */
  static relative(from: string, to: string): string {
    const normalizedFrom = this.normalize(from);
    const normalizedTo = this.normalize(to);

    if (normalizedFrom === normalizedTo) {
      return '.';
    }

    const fromParts = normalizedFrom.split('/').filter(Boolean);
    const toParts = normalizedTo.split('/').filter(Boolean);

    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
      i++;
    }

    const upLevels = fromParts.length - i;
    const downPath = toParts.slice(i).join('/');

    return upLevels === 0
      ? downPath || '.'
      : `${'../'.repeat(upLevels)}${downPath}`;
  }

  /**
   * 检查路径是否为绝对路径
   * @param path - 输入路径
   * @returns 是否为绝对路径
   */
  static isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }

  /**
   * 转换为绝对路径
   * @param path - 输入路径
   * @param cwd - 当前工作目录
   * @returns 绝对路径
   */
  static resolve(path: string, cwd: string = '/'): string {
    if (this.isAbsolute(path)) {
      return this.normalize(path);
    }
    return this.normalize(`${cwd}/${path}`);
  }
}
```

---

## 三、桌面管理系统

### 3.1 窗口管理器 (WindowManager)

#### 3.1.1 窗口状态定义

```typescript
/**
 * 窗口状态接口
 */
export interface WindowState {
  id: string;                // 窗口唯一 ID
  title: string;             // 窗口标题
  app: string;               // 应用程序标识
  x: number;                 // X 坐标
  y: number;                 // Y 坐标
  width: number;             // 宽度
  height: number;            // 高度
  zIndex: number;            // Z 轴层级
  isMinimized: boolean;      // 是否最小化
  isMaximized: boolean;      // 是否最大化
  isFullscreen: boolean;     // 是否全屏
  isResizable: boolean;      // 是否可调整大小
  isDraggable: boolean;      // 是否可拖动
  isFocused: boolean;        // 是否聚焦
  content: React.ReactNode;  // 窗口内容
}

/**
 * 窗口配置接口
 */
export interface WindowConfig {
  id?: string;               // 窗口 ID（可选，自动生成）
  title: string;             // 窗口标题
  app: string;               // 应用程序标识
  x?: number;                // X 坐标（可选，默认居中）
  y?: number;                // Y 坐标（可选，默认居中）
  width?: number;            // 宽度（可选，默认 800）
  height?: number;           // 高度（可选，默认 600）
  isResizable?: boolean;     // 是否可调整大小（默认 true）
  isDraggable?: boolean;     // 是否可拖动（默认 true）
  content: React.ReactNode;  // 窗口内容
}
```

#### 3.1.2 WindowManager 状态管理

```typescript
/**
 * WindowManager 状态管理
 */
interface WindowManagerState {
  // 窗口列表
  windows: WindowState[];

  // 最高 Z 轴层级
  maxZIndex: number;

  // 方法
  openWindow: (config: WindowConfig) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  getFocusedWindow: () => WindowState | null;
}

export const useWindowManagerStore = create<WindowManagerState>()((set, get) => ({
  windows: [],
  maxZIndex: 100,

  openWindow: (config) => {
    const id = config.id || `window-${Date.now()}`;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 默认居中位置
    const x = config.x ?? (screenWidth - (config.width ?? 800)) / 2;
    const y = config.y ?? (screenHeight - (config.height ?? 600)) / 2;

    // 计算 Z 轴层级
    const maxZIndex = get().maxZIndex;

    const newWindow: WindowState = {
      id,
      title: config.title,
      app: config.app,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: config.width ?? 800,
      height: config.height ?? 600,
      zIndex: maxZIndex + 1,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isResizable: config.isResizable ?? true,
      isDraggable: config.isDraggable ?? true,
      isFocused: true,
      content: config.content,
    };

    set((state) => ({
      windows: [...state.windows.map(w => ({ ...w, isFocused: false })), newWindow],
      maxZIndex: maxZIndex + 1,
    }));

    return id;
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter(w => w.id !== id),
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      ),
    }));
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? {
          ...w,
          isMaximized: true,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        } : w
      ),
    }));
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? {
          ...w,
          isMinimized: false,
          isMaximized: false,
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        } : w
      ),
    }));
  },

  toggleFullscreen: (id) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? {
          ...w,
          isFullscreen: !w.isFullscreen,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        } : w
      ),
    }));
  },

  focusWindow: (id) => {
    set((state) => {
      const maxZIndex = Math.max(...state.windows.map(w => w.zIndex));
      return {
        windows: state.windows.map(w =>
          w.id === id
            ? { ...w, isFocused: true, zIndex: maxZIndex + 1 }
            : { ...w, isFocused: false }
        ),
        maxZIndex: maxZIndex + 1,
      };
    });
  },

  updateWindowPosition: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    }));
  },

  updateWindowSize: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    }));
  },

  getFocusedWindow: () => {
    return get().windows.find(w => w.isFocused) ?? null;
  },
}));
```

#### 3.1.3 Window 组件

```typescript
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useWindowManagerStore } from '../store/useWindowManagerStore';
import { Resizable } from 're-resizable';

interface WindowProps {
  windowState: WindowState;
}

/**
 * 窗口组件
 */
export default function Window({ windowState }: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    toggleFullscreen,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowManagerStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // 拖动状态
  const x = useMotionValue(windowState.x);
  const y = useMotionValue(windowState.y);
  const initialPosition = useRef({ x: windowState.x, y: windowState.y });

  // 聚焦处理
  const handleMouseDown = useCallback(() => {
    if (!windowState.isFocused) {
      focusWindow(windowState.id);
    }
  }, [windowState.id, windowState.isFocused, focusWindow]);

  // 拖动处理
  const handleDragStart = useCallback((_: MouseEvent, info: PanInfo) => {
    if (!windowState.isDraggable || windowState.isMaximized || windowState.isFullscreen) {
      return;
    }
    setIsDragging(true);
    initialPosition.current = { x: windowState.x, y: windowState.y };
  }, [windowState.isDraggable, windowState.isMaximized, windowState.isFullscreen, windowState.x, windowState.y]);

  const handleDrag = useCallback((_: MouseEvent, info: PanInfo) => {
    if (!isDragging) return;

    const newX = initialPosition.current.x + info.offset.x;
    const newY = initialPosition.current.y + info.offset.y;

    x.set(newX);
    y.set(newY);
  }, [isDragging, x, y]);

  const handleDragEnd = useCallback((_: MouseEvent, info: PanInfo) => {
    if (!isDragging) return;

    const newX = initialPosition.current.x + info.offset.x;
    const newY = initialPosition.current.y + info.offset.y;

    updateWindowPosition(windowState.id, newX, newY);
    setIsDragging(false);
  }, [isDragging, windowState.id, updateWindowPosition]);

  // 调整大小处理
  const handleResize = useCallback((e: MouseEvent, direction: string, ref: HTMLElement, delta: { width: number; height: number }) => {
    if (!windowState.isResizable || windowState.isMaximized || windowState.isFullscreen) {
      return;
    }

    const newWidth = windowState.width + delta.width;
    const newHeight = windowState.height + delta.height;

    updateWindowSize(windowState.id, newWidth, newHeight);
  }, [windowState.isResizable, windowState.isMaximized, windowState.isFullscreen, windowState.width, windowState.height, windowState.id, updateWindowSize]);

  // 双击标题栏最大化/还原
  const handleTitleBarDoubleClick = useCallback(() => {
    if (windowState.isMaximized) {
      restoreWindow(windowState.id);
    } else {
      maximizeWindow(windowState.id);
    }
  }, [windowState.isMaximized, windowState.id, maximizeWindow, restoreWindow]);

  // 窗口内容
  const windowContent = windowState.isMinimized ? null : (
    <motion.div
      ref={windowRef}
      className={`window ${windowState.isFocused ? 'focused' : ''}`}
      style={{
        x,
        y,
        width: windowState.width,
        height: windowState.height,
        zIndex: windowState.zIndex,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag={windowState.isDraggable && !windowState.isMaximized && !windowState.isFullscreen}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
    >
      {/* 标题栏 */}
      <div
        className="window-titlebar"
        onDoubleClick={handleTitleBarDoubleClick}
      >
        <div className="window-titlebar-left">
          <span className="window-title">{windowState.title}</span>
        </div>
        <div className="window-titlebar-right">
          <button
            className="window-button minimize"
            onClick={() => minimizeWindow(windowState.id)}
            title="最小化"
          >
            <MinimizeOutlined />
          </button>
          <button
            className="window-button maximize"
            onClick={() =>
              windowState.isMaximized
                ? restoreWindow(windowState.id)
                : maximizeWindow(windowState.id)
            }
            title={windowState.isMaximized ? '还原' : '最大化'}
          >
            {windowState.isMaximized ? <CropOutlined /> : <BorderOutlined />}
          </button>
          <button
            className="window-button close"
            onClick={() => closeWindow(windowState.id)}
            title="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* 窗口内容 */}
      <div className="window-content">
        {windowState.content}
      </div>
    </motion.div>
  );

  return windowContent;
}
```

### 3.2 Dock 栏

#### 3.2.1 Dock 状态管理

```typescript
/**
 * Dock 应用图标接口
 */
export interface DockIcon {
  id: string;                 // 应用标识
  name: string;               // 应用名称
  icon: React.ReactNode;      // 应用图标
  isOpen: boolean;            // 是否已打开
  windowIds: string[];        // 关联的窗口 ID 列表
}

/**
 * Dock 状态管理
 */
interface DockState {
  // 应用图标列表
  icons: DockIcon[];

  // 方法
  addIcon: (icon: DockIcon) => void;
  removeIcon: (id: string) => void;
  openApp: (id: string) => void;
  closeApp: (id: string) => void;
  toggleApp: (id: string) => void;
  getIcon: (id: string) => DockIcon | undefined;
}

export const useDockStore = create<DockState>()((set, get) => ({
  icons: [],

  addIcon: (icon) => {
    set((state) => {
      const existing = state.icons.find(i => i.id === icon.id);
      if (existing) {
        return {
          icons: state.icons.map(i =>
            i.id === icon.id ? { ...i, icon: icon.icon } : i
          ),
        };
      }
      return {
        icons: [...state.icons, { ...icon, isOpen: false, windowIds: [] }],
      };
    });
  },

  removeIcon: (id) => {
    set((state) => ({
      icons: state.icons.filter(i => i.id !== id),
    }));
  },

  openApp: (id) => {
    const icon = get().icons.find(i => i.id === id);
    if (!icon) return;

    // 打开应用
    set((state) => ({
      icons: state.icons.map(i =>
        i.id === id ? { ...i, isOpen: true } : i
      ),
    }));
  },

  closeApp: (id) => {
    set((state) => ({
      icons: state.icons.map(i =>
        i.id === id ? { ...i, isOpen: false, windowIds: [] } : i
      ),
    }));
  },

  toggleApp: (id) => {
    const icon = get().icons.find(i => i.id === id);
    if (!icon) return;

    if (icon.isOpen) {
      // 如果已打开，聚焦第一个窗口
      if (icon.windowIds.length > 0) {
        const windowManager = useWindowManagerStore.getState();
        windowManager.focusWindow(icon.windowIds[0]);
      }
    } else {
      // 打开应用
      set((state) => ({
        icons: state.icons.map(i =>
          i.id === id ? { ...i, isOpen: true } : i
        ),
      }));
    }
  },

  getIcon: (id) => {
    return get().icons.find(i => i.id === id);
  },
}));
```

#### 3.2.2 Dock 组件

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useDockStore } from '../store/useDockStore';
import { useWindowManagerStore } from '../store/useWindowManagerStore';

/**
 * Dock 组件
 */
export default function Dock() {
  const { icons } = useDockStore();
  const { windows } = useWindowManagerStore();

  return (
    <div className="dock">
      <AnimatePresence>
        {icons.map((icon) => {
          // 检查应用是否有打开的窗口
          const hasOpenWindows = windows.some(w => w.app === icon.id);
          const isAppOpen = icon.isOpen || hasOpenWindows;

          return (
            <motion.div
              key={icon.id}
              className="dock-icon-wrapper"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className={`dock-icon ${isAppOpen ? 'open' : ''}`}
                onClick={() => {
                  const dockStore = useDockStore.getState();
                  dockStore.toggleApp(icon.id);
                }}
              >
                {icon.icon}
                {isAppOpen && (
                  <div className="dock-indicator" />
                )}
              </div>
              <div className="dock-tooltip">
                {icon.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

### 3.3 任务栏

#### 3.3.1 任务栏状态管理

```typescript
/**
 * 任务栏状态管理
 */
interface TaskbarState {
  // 任务栏可见性
  isVisible: boolean;

  // 时钟显示格式
  clockFormat: '12h' | '24h';

  // 方法
  toggleVisibility: () => void;
  setClockFormat: (format: '12h' | '24h') => void;
}

export const useTaskbarStore = create<TaskbarState>()((set) => ({
  isVisible: true,
  clockFormat: '24h',

  toggleVisibility: () => {
    set((state) => ({ isVisible: !state.isVisible }));
  },

  setClockFormat: (format) => {
    set({ clockFormat: format });
  },
}));
```

#### 3.3.2 Taskbar 组件

```typescript
import { useState, useEffect } from 'react';
import { useTaskbarStore } from '../store/useTaskbarStore';
import { useWindowManagerStore } from '../store/useWindowManagerStore';

/**
 * 任务栏组件
 */
export default function Taskbar() {
  const { isVisible, clockFormat } = useTaskbarStore();
  const { windows } = useWindowManagerStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时钟
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化时间
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    if (clockFormat === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const twelveHours = hours % 12 || 12;
      return `${twelveHours}:${minutes}:${seconds} ${ampm}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
    }
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  if (!isVisible) return null;

  return (
    <div className="taskbar">
      {/* 开始按钮 */}
      <div className="taskbar-start">
        <button className="start-button">
          <WindowsOutlined />
          <span>开始</span>
        </button>
      </div>

      {/* 任务列表 */}
      <div className="taskbar-tasks">
        {windows.map((window) => (
          <div
            key={window.id}
            className={`taskbar-task ${window.isFocused ? 'focused' : ''} ${window.isMinimized ? 'minimized' : ''}`}
            onClick={() => {
              const windowManager = useWindowManagerStore.getState();
              if (window.isMinimized) {
                windowManager.restoreWindow(window.id);
              } else if (!window.isFocused) {
                windowManager.focusWindow(window.id);
              } else {
                windowManager.minimizeWindow(window.id);
              }
            }}
          >
            <span className="task-icon">
              {getAppIcon(window.app)}
            </span>
            <span className="task-title">{window.title}</span>
          </div>
        ))}
      </div>

      {/* 系统托盘 */}
      <div className="taskbar-tray">
        <div className="tray-icon">
          <WifiOutlined />
        </div>
        <div className="tray-icon">
          <SoundOutlined />
        </div>
        <div className="tray-icon">
          <BatteryOutlined />
        </div>
        <div className="tray-clock">
          <div className="clock-time">{formatTime(currentTime)}</div>
          <div className="clock-date">{formatDate(currentTime)}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 获取应用图标
 */
function getAppIcon(app: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'terminal': <TerminalOutlined />,
    'file-manager': <FolderOpenOutlined />,
    'docker': <AppstoreOutlined />,
    'claude-code': <RobotOutlined />,
    'resource-monitor': <DashboardOutlined />,
    'ide': <CodeOutlined />,
  };

  return iconMap[app] || <AppstoreOutlined />;
}
```

---

## 四、IDE 布局系统

### 4.1 IDE 状态管理

```typescript
/**
 * IDE 状态管理
 */
interface IDEState {
  // 侧边栏宽度
  sidebarWidth: number;

  // 活动面板（左）
  activePanel: 'explorer' | 'search' | 'git' | 'extensions' | null;

  // 面板可见性（左）
  isPanelVisible: boolean;

  // 底部面板高度
  bottomPanelHeight: number;

  // 活动面板（底）
  activeBottomPanel: 'terminal' | 'output' | 'problems' | 'debug-console' | null;

  // 底部面板可见性
  isBottomPanelVisible: boolean;

  // 方法
  setActivePanel: (panel: 'explorer' | 'search' | 'git' | 'extensions' | null) => void;
  togglePanel: () => void;
  setSidebarWidth: (width: number) => void;
  setActiveBottomPanel: (panel: 'terminal' | 'output' | 'problems' | 'debug-console' | null) => void;
  toggleBottomPanel: () => void;
  setBottomPanelHeight: (height: number) => void;
}

export const useIDEStore = create<IDEState>()((set) => ({
  sidebarWidth: 250,
  activePanel: 'explorer',
  isPanelVisible: true,
  bottomPanelHeight: 200,
  activeBottomPanel: 'terminal',
  isBottomPanelVisible: true,

  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel }),
  toggleBottomPanel: () => set((state) => ({ isBottomPanelVisible: !state.isBottomPanelVisible })),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
}));
```

### 4.2 IDE 布局组件

```typescript
import { Resizable } from 're-resizable';
import { useIDEStore } from '../store/useIDEStore';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import EditorPane from './EditorPane';
import BottomPanel from './BottomPanel';

/**
 * IDE 布局组件
 */
export default function IDELayout() {
  const {
    sidebarWidth,
    activePanel,
    isPanelVisible,
    bottomPanelHeight,
    activeBottomPanel,
    isBottomPanelVisible,
    setSidebarWidth,
    setBottomPanelHeight,
  } = useIDEStore();

  return (
    <div className="ide-layout">
      {/* 活动栏（最左侧） */}
      <ActivityBar />

      {/* 侧边栏（可调整宽度） */}
      {isPanelVisible && (
        <Resizable
          size={{ width: sidebarWidth }}
          minWidth={150}
          maxWidth={500}
          handleStyles={{ right: { width: '4px' } }}
          handleComponent={{ right: <div className="resizer" /> }}
          onResizeStop={(e, direction, ref, d) => {
            setSidebarWidth(ref.offsetWidth);
          }}
        >
          <Sidebar activePanel={activePanel} />
        </Resizable>
      )}

      {/* 主编辑区域 */}
      <div className="ide-main">
        {/* 编辑器面板 */}
        <div className="ide-editor">
          <EditorPane />
        </div>

        {/* 底部面板（可调整高度） */}
        {isBottomPanelVisible && (
          <Resizable
            size={{ height: bottomPanelHeight }}
            minHeight={100}
            maxHeight={500}
            handleStyles={{ top: { height: '4px' } }}
            handleComponent={{ top: <div className="resizer" /> }}
            onResizeStop={(e, direction, ref, d) => {
              setBottomPanelHeight(ref.offsetHeight);
            }}
          >
            <BottomPanel activePanel={activeBottomPanel} />
          </Resizable>
        )}
      </div>
    </div>
  );
}
```

### 4.3 活动栏组件

```typescript
import { useIDEStore } from '../store/useIDEStore';
import {
  FileOutlined,
  SearchOutlined,
  GitlabOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';

/**
 * 活动栏组件（最左侧图标栏）
 */
export default function ActivityBar() {
  const { activePanel, setActivePanel } = useIDEStore();

  const panels = [
    { id: 'explorer', icon: <FileOutlined />, label: '资源管理器' },
    { id: 'search', icon: <SearchOutlined />, label: '搜索' },
    { id: 'git', icon: <GitlabOutlined />, label: '源代码管理' },
    { id: 'extensions', icon: <AppstoreOutlined />, label: '扩展' },
    { id: 'settings', icon: <SettingOutlined />, label: '设置' },
  ];

  return (
    <div className="activity-bar">
      {panels.map((panel) => (
        <button
          key={panel.id}
          className={`activity-bar-icon ${activePanel === panel.id ? 'active' : ''}`}
          onClick={() => setActivePanel(panel.id as any)}
          title={panel.label}
        >
          {panel.icon}
        </button>
      ))}
    </div>
  );
}
```

### 4.4 侧边栏组件

```typescript
import { useIDEStore } from '../store/useIDEStore';
import { useVFSStore } from '../store/useVFSStore';
import { readdir, VFSPath } from '../lib/vfs';
import { useState, useEffect } from 'react';
import {
  FolderOutlined,
  FileOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';

/**
 * 侧边栏组件
 */
export default function Sidebar({ activePanel }: { activePanel: string | null }) {
  const { cwd } = useVFSStore();

  if (!activePanel) return null;

  switch (activePanel) {
    case 'explorer':
      return <ExplorerPanel cwd={cwd} />;
    case 'search':
      return <SearchPanel />;
    case 'git':
      return <GitPanel />;
    case 'extensions':
      return <ExtensionsPanel />;
    case 'settings':
      return <SettingsPanel />;
    default:
      return null;
  }
}

/**
 * 资源管理器面板
 */
function ExplorerPanel({ cwd }: { cwd: string }) {
  const [entries, setEntries] = useState<VFSEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDirectory(cwd);
  }, [cwd]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const dirEntries = await readdir(path);
      setEntries(dirEntries);
    } catch (error) {
      console.error('[Explorer] Load directory error:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-panel explorer-panel">
      <div className="sidebar-panel-header">
        <h3>资源管理器</h3>
      </div>
      <div className="sidebar-panel-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="file-tree">
            {entries.map((entry) => (
              <FileTreeItem
                key={entry.path}
                entry={entry}
                level={0}
                onDoubleClick={() => loadDirectory(entry.path)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 文件树项组件
 */
function FileTreeItem({ entry, level, onDoubleClick }: {
  entry: VFSEntry;
  level: number;
  onDoubleClick: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`file-tree-item ${entry.isDirectory ? 'directory' : 'file'}`}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onDoubleClick={onDoubleClick}
    >
      <div className="file-tree-item-content">
        {entry.isDirectory ? (
          <span
            className="expand-icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
          </span>
        ) : (
          <span className="expand-icon" />
        )}
        <span className="file-icon">
          {entry.isDirectory ? <FolderOutlined /> : <FileOutlined />}
        </span>
        <span className="file-name">{entry.name}</span>
      </div>
    </div>
  );
}

/**
 * 搜索面板
 */
function SearchPanel() {
  return (
    <div className="sidebar-panel search-panel">
      <div className="sidebar-panel-header">
        <h3>搜索</h3>
      </div>
      <div className="sidebar-panel-content">
        <input type="text" placeholder="搜索文件..." />
      </div>
    </div>
  );
}

/**
 * Git 面板
 */
function GitPanel() {
  return (
    <div className="sidebar-panel git-panel">
      <div className="sidebar-panel-header">
        <h3>源代码管理</h3>
      </div>
      <div className="sidebar-panel-content">
        <p>暂无 Git 仓库</p>
      </div>
    </div>
  );
}

/**
 * 扩展面板
 */
function ExtensionsPanel() {
  return (
    <div className="sidebar-panel extensions-panel">
      <div className="sidebar-panel-header">
        <h3>扩展</h3>
      </div>
      <div className="sidebar-panel-content">
        <p>暂无扩展</p>
      </div>
    </div>
  );
}

/**
 * 设置面板
 */
function SettingsPanel() {
  return (
    <div className="sidebar-panel settings-panel">
      <div className="sidebar-panel-header">
        <h3>设置</h3>
      </div>
      <div className="sidebar-panel-content">
        <p>暂无设置</p>
      </div>
    </div>
  );
}
```

---

## 五、终端集成系统

### 5.1 终端状态管理

```typescript
/**
 * 终端配置接口
 */
export interface TerminalConfig {
  id?: string;                // 终端 ID（可选，自动生成）
  title: string;             // 终端标题
  cwd?: string;              // 工作目录（可选，默认 /）
  rows?: number;             // 行数（可选，默认 24）
  cols?: number;             // 列数（可选，默认 80）
  fontSize?: number;         // 字体大小（可选，默认 14）
  fontFamily?: string;       // 字体（可选，默认 monospace）
  theme?: 'light' | 'dark';  // 主题（可选，默认 dark）
}

/**
 * 终端实例接口
 */
export interface TerminalInstance {
  id: string;                // 终端 ID
  title: string;             // 终端标题
  cwd: string;               // 工作目录
  rows: number;              // 行数
  cols: number;              // 列数
  fontSize: number;          // 字体大小
  fontFamily: string;        // 字体
  theme: 'light' | 'dark';   // 主题
  isFocused: boolean;        // 是否聚焦
}

/**
 * 终端状态管理
 */
interface TerminalState {
  // 终端实例列表
  terminals: TerminalInstance[];

  // 方法
  openTerminal: (config: TerminalConfig) => string;
  closeTerminal: (id: string) => void;
  focusTerminal: (id: string) => void;
  updateTerminalCWD: (id: string, cwd: string) => void;
  getFocusedTerminal: () => TerminalInstance | null;
}

export const useTerminalStore = create<TerminalState>()((set, get) => ({
  terminals: [],

  openTerminal: (config) => {
    const id = config.id || `terminal-${Date.now()}`;
    const newTerminal: TerminalInstance = {
      id,
      title: config.title,
      cwd: config.cwd ?? '/',
      rows: config.rows ?? 24,
      cols: config.cols ?? 80,
      fontSize: config.fontSize ?? 14,
      fontFamily: config.fontFamily ?? 'monospace',
      theme: config.theme ?? 'dark',
      isFocused: true,
    };

    set((state) => ({
      terminals: [...state.terminals.map(t => ({ ...t, isFocused: false })), newTerminal],
    }));

    return id;
  },

  closeTerminal: (id) => {
    set((state) => ({
      terminals: state.terminals.filter(t => t.id !== id),
    }));
  },

  focusTerminal: (id) => {
    set((state) => ({
      terminals: state.terminals.map(t =>
        t.id === id ? { ...t, isFocused: true } : { ...t, isFocused: false }
      ),
    }));
  },

  updateTerminalCWD: (id, cwd) => {
    set((state) => ({
      terminals: state.terminals.map(t =>
        t.id === id ? { ...t, cwd } : t
      ),
    }));
  },

  getFocusedTerminal: () => {
    return get().terminals.find(t => t.isFocused) ?? null;
  },
}));
```

### 5.2 终端组件

```typescript
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import { FitAddon } from '@xterm/addon-fit';
import { useTerminalStore } from '../store/useTerminalStore';
import { useIDEStore } from '../store/useIDEStore';
import { io, Socket } from 'socket.io-client';

/**
 * 终端组件
 */
export default function TerminalPanel({ terminalId }: { terminalId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);

  const terminal = useTerminalStore(state =>
    state.terminals.find(t => t.id === terminalId)
  );

  // 初始化终端
  useEffect(() => {
    if (!terminalRef.current || !terminal) return;

    // 创建 xterm 实例
    const xterm = new Terminal({
      rows: terminal.rows,
      cols: terminal.cols,
      fontSize: terminal.fontSize,
      fontFamily: terminal.fontFamily,
      theme: terminal.theme === 'dark' ? {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      } : {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        cursorAccent: '#ffffff',
        selection: '#add6ff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    });

    // 添加 WebGL 插件
    try {
      const webglAddon = new WebglAddon();
      xterm.loadAddon(webglAddon);
    } catch (error) {
      console.warn('[Terminal] WebGL addon not available:', error);
    }

    // 添加 Fit 插件
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    fitAddon.fit();

    // 渲染到 DOM
    xterm.open(terminalRef.current);
    xterm.focus();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // 连接到 WebSocket
    const socket = io('ws://localhost:1126', {
      path: '/terminal',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Terminal] Connected to WebSocket');
      setConnected(true);

      // 发送终端配置
      socket.emit('terminal:create', {
        id: terminalId,
        cwd: terminal.cwd,
        rows: terminal.rows,
        cols: terminal.cols,
      });
    });

    socket.on('disconnect', () => {
      console.log('[Terminal] Disconnected from WebSocket');
      setConnected(false);
    });

    socket.on(`terminal:${terminalId}:output`, (data: string) => {
      xterm.write(data);
    });

    // 监听用户输入
    xterm.onData((data) => {
      if (connected) {
        socket.emit('terminal:input', {
          id: terminalId,
          data,
        });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [terminalId, terminal]);

  // 调整大小
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <h3>{terminal?.title}</h3>
        {!connected && <span className="status disconnected">未连接</span>}
        {connected && <span className="status connected">已连接</span>}
      </div>
      <div
        ref={terminalRef}
        className="terminal-content"
        onClick={() => {
          if (xtermRef.current) {
            xtermRef.current.focus();
          }
        }}
      />
    </div>
  );
}
```

### 5.3 底部面板组件

```typescript
import { useIDEStore } from '../store/useIDEStore';
import { Tabs } from 'antd';
import TerminalPanel from './TerminalPanel';

/**
 * 底部面板组件
 */
export default function BottomPanel({ activePanel }: { activePanel: string | null }) {
  const { setActiveBottomPanel } = useIDEStore();

  const tabs = [
    { key: 'terminal', label: '终端', icon: <TerminalOutlined /> },
    { key: 'output', label: '输出', icon: <ReadOutlined /> },
    { key: 'problems', label: '问题', icon: <ExclamationCircleOutlined /> },
    { key: 'debug-console', label: '调试控制台', icon: <BugOutlined /> },
  ];

  return (
    <div className="bottom-panel">
      <Tabs
        activeKey={activePanel ?? undefined}
        onChange={(key) => setActiveBottomPanel(key as any)}
        type="editable-card"
        hideAdd
        items={tabs}
      />
      <div className="bottom-panel-content">
        {activePanel === 'terminal' && (
          <TerminalPanel terminalId="default-terminal" />
        )}
        {activePanel === 'output' && (
          <div className="output-panel">
            <p>暂无输出</p>
          </div>
        )}
        {activePanel === 'problems' && (
          <div className="problems-panel">
            <p>暂无问题</p>
          </div>
        )}
        {activePanel === 'debug-console' && (
          <div className="debug-console-panel">
            <p>暂无调试输出</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 六、 Monaco Editor 集成

### 6.1 Monaco Editor 组件

```typescript
import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useVFSStore } from '../store/useVFSStore';
import { readFile, writeFile } from '../lib/vfs';

/**
 * Monaco Editor 组件
 */
export default function EditorPane() {
  const { cwd } = useVFSStore();
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // 加载文件内容
  const loadFile = async (path: string) => {
    setLoading(true);
    try {
      const fileContent = await readFile(path);
      setContent(fileContent);
      setCurrentFile(path);
    } catch (error) {
      console.error('[Editor] Load file error:', error);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  // 保存文件内容
  const saveFile = async () => {
    if (!currentFile) return;

    try {
      await writeFile(currentFile, content);
    } catch (error) {
      console.error('[Editor] Save file error:', error);
    }
  };

  // 自动保存（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentFile) {
        saveFile();
      }
    }, 1000); // 1 秒防抖

    return () => clearTimeout(timer);
  }, [content, currentFile]);

  return (
    <div className="editor-pane">
      {loading ? (
        <div className="loading">加载中...</div>
      ) : currentFile ? (
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={content}
          onChange={(value) => setContent(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
          }}
        />
      ) : (
        <div className="empty-editor">
          <p>打开一个文件开始编辑</p>
        </div>
      )}
    </div>
  );
}
```

---

## 七、总结

WebEnv-OS 虚拟文件系统与桌面管理系统是一个功能完整的 Web 操作系统实现，具有以下特点：

1. **ZenFS 虚拟文件系统**：基于 IndexedDB 的持久化文件系统，支持完整的文件系统操作（读、写、删除、移动、复制）
2. **窗口管理系统**：支持窗口创建、关闭、最小化、最大化、全屏、拖动、调整大小等功能
3. **Dock 栏系统**：应用图标管理，支持应用打开/关闭状态显示
4. **任务栏系统**：任务列表显示，支持时钟显示、系统托盘
5. **IDE 布局系统**：VS Code 风格的 IDE 布局，支持活动栏、侧边栏、编辑器面板、底部面板
6. **终端集成**：基于 xterm.js 的终端模拟器，支持 WebSocket 实时通信
7. **Monaco Editor 集成**：VS Code 的编辑器核心，支持语法高亮、自动补全等功能

---

*文档版本: 1.0*
*最后更新: 2026-03-11*