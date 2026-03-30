# 文档总览与治理（Docs Index）

作者：Shyu  | 更新日期：2026-02-18

## 1. 目的
本文件用于统一管理 `docs/` 下的文档边界、优先级与更新流程，避免重复、冲突与过期。

## 2. 文档分层（唯一事实来源）
- 架构层（系统设计）
  - [backend-software-design.md](backend-software-design.md)：后端权威规则引擎与网关设计。
  - [frontend-software-design.md](frontend-software-design.md)：前端展示层、Socket 消费与 UI 架构。
- 规则层（业务规则映射）
  - [uno-rules-project-mapping.md](uno-rules-project-mapping.md)：UNO 规则与代码实现逐项映射。
- 规范层（开发与文档治理）
  - [documentation-governance.md](documentation-governance.md)：从 `GEMINI.md` 收敛的统一文档规范与流程。
- 特性层（迭代特性说明）
  - [online-reliability-features.md](online-reliability-features.md)：在线可靠性新特性（重连身份、会话保留窗口等）。
- 培训与教程层
  - [full-tech-stack-tutorial-video-playbook.md](full-tech-stack-tutorial-video-playbook.md)：技术栈学习/演示脚本。

## 3. 阅读顺序（建议）
1. [documentation-governance.md](documentation-governance.md)
2. [backend-software-design.md](backend-software-design.md)
3. [frontend-software-design.md](frontend-software-design.md)
4. [online-reliability-features.md](online-reliability-features.md)
5. [uno-rules-project-mapping.md](uno-rules-project-mapping.md)

## 4. 更新规则（强制）
- 代码行为变化后，必须同步更新“对应层”的文档。
- Socket 事件/负载变更，至少同步：
  - [backend-software-design.md](backend-software-design.md)
  - [frontend-software-design.md](frontend-software-design.md)
  - [online-reliability-features.md](online-reliability-features.md)（若属在线能力）
- 规则变化（UNO 玩法、判定边界）必须同步 [uno-rules-project-mapping.md](uno-rules-project-mapping.md)。
- 文档与注释统一简体中文，遵循 Google 风格说明结构（见治理文档）。

## 5. 反混乱约束
- 同一主题只允许一个“主文档”。
- 其他文档仅保留链接，不复制整段内容。
- 新增文档前，先检查本文件是否已有同主题主文档。
