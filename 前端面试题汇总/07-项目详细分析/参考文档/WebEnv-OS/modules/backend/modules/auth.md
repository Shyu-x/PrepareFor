# 认证模块 (Auth)

## 核心功能
- 提供用户注册与登录。
- 签发 JWT (JSON Web Token) 用于后续请求授权。
- 提供 `AuthGuard` 守卫保护私有 API。

## 技术实现
- **加密**: 使用 `bcryptjs` 进行密码哈希。
- **策略**: 基于 `passport-jwt` 的认证策略。

## 主要接口
- `POST /api/auth/register`: 注册新账号。
- `POST /api/auth/login`: 登录并获取 token。
- `GET /api/auth/profile`: 获取当前用户信息。
