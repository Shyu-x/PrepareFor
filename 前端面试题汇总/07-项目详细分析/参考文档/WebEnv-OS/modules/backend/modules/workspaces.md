# 工作区模块 (Workspaces)

## 核心功能
- 管理用户定义的工作区配置。
- 支持工作区的 CRUD 操作。
- 处理工作区的导入与导出 (JSON)。

## 依赖关系
- 关联 `TerminalModule`：用于启动工作区对应的物理容器。
- 关联 `TypeORM`：存储配置信息至 PostgreSQL。

## 主要接口
- `GET /api/workspaces`: 获取列表。
- `POST /api/workspaces`: 创建。
- `POST /api/workspaces/:id/duplicate`: 快速复制。
- `GET /api/workspaces/stats`: 资源占用统计。
