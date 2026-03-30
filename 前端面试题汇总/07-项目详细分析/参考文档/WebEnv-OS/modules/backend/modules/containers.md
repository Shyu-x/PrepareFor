# 容器编排逻辑 (Containers)

该功能目前整合在 `TerminalModule` 中，负责底层资源映射。

## 映射机制
- **卷挂载**: `host/workspaces/{id}` -> `/workspace` (容器内)。
- **网络**: 每个工作区默认分配至 `webenv-net-{id}` 网桥，实现环境隔离。
- **限制**: 支持在 DTO 中定义 `cpuShares` 与 `memoryMb` 进行资源硬隔离。

## 默认镜像
- `debian:bookworm` (LTS 版本，确保稳定)。
