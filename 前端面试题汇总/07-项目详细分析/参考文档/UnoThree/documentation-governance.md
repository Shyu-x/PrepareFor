# 文档治理规范（整合 GEMINI.md）

作者：Shyu  | 更新日期：2026-02-18

## 1. 范围
本规范整合 `GEMINI.md` 中的文档与协作要求，作为 `docs/` 的统一治理标准。

## 2. 语言与风格
- 统一使用简体中文（专有名词可保留英文）。
- 代码注释与设计文档遵循 Google 风格结构：
  - 功能概述
  - Args
  - Returns
  - Raises（如有）
  - Side Effects（如有）

## 3. 文档与代码一致性
- 任何代码行为变更必须同步更新文档，不允许“代码先变、文档滞后”。
- Socket/状态结构变更必须保证前后端契约一致：
  - `backend/src/game/types.ts`
  - `frontend/src/types/game.ts`

## 4. 开发闭环（强制）
1. 开发前先阅读 `docs/` 相关文档。
2. 在 `develop` 分支开发并验证。
3. 完成后更新文档并记录新增特性。
4. 合并前执行受影响模块 lint / test。

## 5. 配置规范
- 端口使用环境变量，禁止硬编码。
- 后端默认 `BACKEND_PORT=19191`，监听 `0.0.0.0`。
- 前端默认 `FRONTEND_PORT=11451`。

## 6. 文档分工
- 架构设计：`backend-software-design.md` / `frontend-software-design.md`
- 规则映射：`uno-rules-project-mapping.md`
- 在线能力特性：`online-reliability-features.md`
- 总入口：`README.md`

## 7. PR 自检清单
- 是否更新了相关文档？
- 是否满足 Google 文档规范结构？
- 是否明确了输入/输出契约与错误语义？
- 是否执行并记录受影响 lint/test？
