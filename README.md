# PrepareFor 前端面试题库系统

## 项目介绍

> 作者: Shyu
> 这是一个完整的前端面试题库系统，支持文档管理、搜索、主题切换等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, Ant Design 5 |
| 后端 | NestJS 10 |
| 状态管理 | Zustand 5 |
| 可视化 | ECharts |
| 部署 | Docker, Docker Compose |

## 快速开始

### 开发环境

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

访问 http://localhost:33980 (前端) 和 http://localhost:42123 (后端)

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问 http://localhost:3000

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| NODE_ENV | development | 运行环境 |
| API_PORT | 42123 | 后端端口 |
| WEB_PORT | 3000 | 前端端口 |

## 目录结构

```
prepare-for/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
├── docs/             # 文档
├── scripts/          # 脚本工具
├── docker-compose.yml
└── Dockerfile
```

## 版本信息

当前版本: 1.0.0

详见 [VERSION.md](VERSION.md)

## 许可证

MIT License - 作者: Shyu
