# 技术规格说明书：文件系统重构 (ZenFS)

> **版本**: 1.0
> **状态**: 待实现 (Draft)
> **目标**: 将现有的简单 IndexedDB 封装替换为符合 POSIX 标准的 ZenFS 文件系统，为 WebContainers 和 Git 提供底层支持。

## 1. 背景与动机

当前的 `LocalFileSystem.ts` 是一个简易的键值对存储封装，存在以下核心缺陷：
1.  **非标准接口**: 不支持 `stream`, `chmod`, `symlink` 等标准 POSIX 操作。
2.  **性能瓶颈**: 读取大文件时需一次性加载到内存，缺乏流式处理。
3.  **扩展性差**: 无法轻易挂载外部存储 (如用户本地磁盘或 S3)。

引入 **ZenFS** (BrowserFS 的现代继任者) 可以解决上述问题，提供一个模块化、高性能的文件系统层。

## 2. 架构设计

### 2.1 挂载策略 (Mount Configuration)

系统启动时，将初始化 ZenFS 并挂载以下后端：

| 路径 | 后端类型 | 描述 | 用途 |
| :--- | :--- | :--- | :--- |
| `/` | `IndexedDB` | 持久化存储 | 存储用户项目文件、配置 |
| `/tmp` | `InMemory` | 内存存储 | 临时文件、缓存、WebContainer 临时数据 |
| `/mnt/local` | `FileSystemAccess` | 本地文件系统 | (可选) 挂载用户真实磁盘目录 |
| `/mnt/iso` | `IsoFS` | 只读 ISO 镜像 | (可选) 挂载 Linux 发行版镜像或资源包 |

### 2.2 接口适配层 (Adapter Layer)

为了保持上层应用 (如 `GitService`, `Editor`) 的兼容性，需封装一层适配器。

```typescript
// src/lib/fs/fs.ts (示例)
import { fs } from '@zenfs/core';

export const webFs = {
  readFile: fs.promises.readFile,
  writeFile: fs.promises.writeFile,
  // ... 封装并导出标准 Promise 接口
  
  // 扩展方法
  mountLocal: async () => { /* 挂载本地目录逻辑 */ }
};
```

## 3. 详细实施步骤

### 3.1 依赖安装
```bash
npm install @zenfs/core @zenfs/dom @zenfs/indexeddb
```

### 3.2 核心模块实现 (`src/lib/fs/`)

1.  **`configure.ts`**:
    *   初始化 ZenFS 上下文。
    *   注册 `IndexedDB` 和 `InMemory` 后端。
    *   执行挂载操作。

2.  **`hooks/useFileSystem.ts` 重构**:
    *   废弃原有的 `SWR` 逻辑（或仅用于元数据缓存）。
    *   改为直接调用 ZenFS 的 API 获取目录列表和文件内容。
    *   增加 `useFileStream` 用于大文件读取。

3.  **Git 适配器更新 (`src/lib/git/GitAdapter.ts`)**:
    *   由于 ZenFS 原生支持 Node.js `fs` 接口，`GitAdapter` 可以大幅简化，甚至直接透传 ZenFS 的 `fs` 对象给 `isomorphic-git`。

### 3.3 数据迁移 (Migration)
*   **挑战**: 现有的 `LocalFileSystem` 数据存储在名为 `webenv-os-db` 的 IndexedDB 中，结构为自定义对象。
*   **方案**: 编写一个一次性迁移脚本 (`MigrationService`)。
    *   在 ZenFS 初始化前，检查旧数据库。
    *   如果存在，读取所有文件内容。
    *   使用 ZenFS API 写入新路径 `/`。
    *   标记旧数据为“已迁移”或删除。

## 4. 接口定义 (API Specification)

```typescript
interface IFileSystemService {
  // 初始化
  init(): Promise<void>;
  
  // 基础操作 (透传 ZenFS)
  readFile(path: string, options?: any): Promise<Uint8Array | string>;
  writeFile(path: string, data: any): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<Stats>;
  
  // 高级操作
  mountExternal(type: 'disk' | 'cloud', handle?: any): Promise<void>;
  createReadStream(path: string): ReadableStream;
}
```

## 5. 风险评估

*   **Buffer 兼容性**: ZenFS 深度依赖 Node.js `Buffer`。在浏览器端需确保 Polyfill (`buffer` 包) 正确加载。
*   **性能开销**: 相比裸操作 IndexedDB，ZenFS 增加了 POSIX 逻辑层，可能会有微小的性能损耗，但换取了通用性。

## 6. 下一步
完成本规格书评审后，将进入编码阶段，优先创建 `src/lib/fs` 目录并替换 `src/lib/storage/LocalFileSystem.ts`。
