# WebEnvOS 快速启动指南

## 一分钟启动

### Windows 用户

1. 双击运行 `build.bat`
2. 等待构建完成（约 2-5 分钟）
3. 浏览器访问: http://localhost:2778

### Linux/Mac 用户

```bash
cd webenv-os
./start.sh
```

然后访问: http://localhost:2778

## 端口说明

所有服务使用 **2778** 这个冷门端口：

- **前端**: http://localhost:2778
- **桌面**: http://localhost:2778/desktop
- **IDE**: http://localhost:2778/ide
- **API**: http://localhost:2778/api/health

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    WebEnvOS Docker 架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Nginx (2778)                      │   │
│  │                 反向代理/统一入口                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │ 前端    │      │ 后端    │      │ Debian  │          │
│    │ 2778    │      │ 2778    │      │ 22/80   │          │
│    └─────────┘      └─────────┘      └─────────┘          │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  PostgreSQL │                          │
│                    │   5432      │                          │
│                    └─────────────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │    Redis    │                          │
│                    │   6379      │                          │
│                    └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 功能概览

### 🖥️ 桌面环境
- Windows 11 / GNOME / KDE Plasma / macOS 主题
- 窗口管理器
- 任务栏和 Dock
- 主题切换器

### 📁 文件管理器
- 文件列表（表格视图）
- 面包屑导航
- 文件搜索
- 新建文件/文件夹
- 文件上传/下载
- 文件预览/编辑

### 💻 终端
- 双模式：webenvos / debian
- 命令历史（↑↓键）
- 主题切换（Dark, Light, Monokai, Dracula）
- 字体大小调整
- 行号/时间戳显示

### 🎨 3D 可视化
- Three.js 3D 渲染
- 多种形状（立方体、球体、环面）
- 颜色选择、旋转速度控制
- 线框模式、播放/暂停

### 📝 文本编辑器
- 多标签页编辑
- 10 种语言支持
- 文件保存/另存为
- 查找和替换

### 🖼️ 图片查看器
- 图片上传（拖拽）
- 缩放（0.2x-3x）
- 旋转（-90°到+90°）
- 全屏模式

### 🧮 计算器
- 基本运算
- 科学计算（sin, cos, tan, sqrt, log 等）
- 历史记录

### ⏰ 时钟
- 数字时钟
- 模拟时钟
- 秒表
- 倒计时（带提示音）

### 🐳 Docker 管理器
- 容器管理
- 镜像管理
- 网络管理
- 卷管理

### 📦 应用管理器
- 应用列表
- 安装/卸载
- 应用详情

### 📊 任务管理器
- 进程监控
- 系统资源统计

### 📋 剪贴板管理器
- 剪贴板历史
- 复制/删除

### 🔔 通知系统
- 系统通知
- 通知历史

### 🛠️ 开发环境
- **Python**: 3.x + pip + venv
- **Node.js**: Node.js + npm
- **C/C++**: gcc, g++, make, cmake
- **Java**: OpenJDK
- **Go**: golang-go
- **Ruby**: ruby-full
- **PHP**: php, php-cli
- **Rust**: rustc, cargo
- **数据库工具**: sqlite3, mysql-client, postgresql-client
- **网络工具**: net-tools, iputils-ping, telnet, netcat
- **其他**: git, curl, wget, vim, nano, sudo, htop, tree

## 常用命令

### 查看日志

```bash
# Linux/Mac
./logs.sh

# Windows
# 使用 Docker Desktop 查看日志
```

### 停止服务

```bash
# Linux/Mac
./stop.sh

# Windows
stop.bat
```

### 重启服务

```bash
docker-compose restart
```

### 进入容器

```bash
# 进入前端容器
docker exec -it webenv-os-frontend /bin/sh

# 进入 Debian 容器
docker exec -it webenv-os-debian /bin/bash
```

### 查看容器状态

```bash
docker-compose ps
```

## 故障排除

### 端口被占用

如果端口被占用，修改 docker-compose.yml 中的端口映射：

```yaml
ports:
  - "2778:2778"  # 修改为其他端口，如 2780:2778
```

### 容器启动失败

查看日志：

```bash
docker-compose logs -f <service-name>
```

### 数据库连接失败

确保 PostgreSQL 容器已启动：

```bash
docker-compose ps postgres
```

### Debian 容器无法 SSH

检查 SSH 服务状态：

```bash
docker exec -it webenv-os-debian service ssh status
```

## 开发模式

### 启动开发模式 (不使用 Docker)

```bash
# 前端
cd webenv-os
npm run dev

# 后端
cd backend
npm run dev
```

### 使用 Docker 开发模式

```bash
# 修改 docker-compose.yml 中的环境变量
# NODE_ENV=development

# 重新启动
docker-compose up -d
```

## 数据持久化

所有数据都持久化存储在 Docker 卷中：

- **redis-data**: Redis 数据
- **postgres-data**: PostgreSQL 数据
- **./backend/data**: 后端数据
- **./data**: 前端数据
- **./debian-data**: Debian 用户数据
- **./debian-projects**: Debian 项目目录
- **./debian-cache**: Debian 缓存目录

## 更新服务

### 更新所有服务

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 更新单个服务

```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

## 备份和恢复

### 备份数据

```bash
# 备份 PostgreSQL
docker exec webenv-os-postgres pg_dump -U webenvos webenvos > backup.sql

# 备份 Redis
docker exec webenv-os-redis redis-cli SAVE
```

### 恢复数据

```bash
# 恢复 PostgreSQL
docker exec -i webenv-os-postgres psql -U webenvos webenvos < backup.sql
```

## 技术栈

### ✅ 前端技术栈

- Next.js 16.1.4 (App Router)
- Ant Design 6.2.1
- Tailwind CSS 4
- Three.js 0.160.1
- Zustand 5.0.10
- SWR 2.3.8
- TypeScript 5

### ✅ 后端技术栈

- Node.js 18
- Express 4.18.2
- PostgreSQL 15
- Redis 7
- WebSocket (ws 8.13.0)

### ✅ 基础设施

- Docker Compose 3.8
- Nginx Alpine
- Debian bookworm-slim

## 许可证

MIT License

## 支持

如有问题，请查看日志或提交 Issue。
