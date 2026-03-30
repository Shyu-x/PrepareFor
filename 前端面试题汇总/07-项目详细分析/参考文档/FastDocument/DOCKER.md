# ============================================================
# FastDocument Docker 部署最佳实践
# ============================================================

## 快速开始

### 开发环境

```bash
# 1. 启动基础服务（数据库、Redis、LiveKit）
docker-compose -f docker-compose.yml up -d postgres redis livekit

# 2. 启动开发服务（后端 + 前端热重载）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 生产环境

```bash
# 1. 复制并配置环境变量
cp .env.production.example .env.production
# 编辑 .env.production 填入实际值

# 2. 构建并启动所有服务
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

## 环境配置

### 端口映射

| 服务 | 内部端口 | 默认外部端口 | 说明 |
|------|---------|-------------|------|
| Frontend | 13000 | 13000 | Next.js 应用 |
| Backend | 5555 | 5555 | NestJS API |
| PostgreSQL | 5432 | 15432 | 数据库 |
| Redis | 6379 | 16379 | 缓存 |
| LiveKit WS | 7880 | 17880 | WebSocket |
| LiveKit TCP | 7881 | 17881 | TCP |
| LiveKit HTTP | 7882 | 17882 | HTTP |
| LiveKit UDP | 7888 | 17888 | UDP |
| Nginx | 80/443 | 80/443 | 反向代理 |

### 环境变量

创建 `.env.production` 文件：

```bash
# 数据库
POSTGRES_USER=fastdoc_prod
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=fastdoc_prod

# JWT
JWT_SECRET=your_very_secure_jwt_secret

# LiveKit
LIVEKIT_KEYS=your_key:your_secret
LIVEKIT_URL=wss://your-livekit-server.com

# CORS
CORS_ORIGIN=https://your-domain.com

# 后端 URL
BACKEND_URL=https://api.your-domain.com
```

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 启动并构建
docker-compose up -d --build

# 停止所有服务
docker-compose down

# 停止并删除卷（重置数据）
docker-compose down -v

# 重启指定服务
docker-compose restart backend

# 查看服务状态
docker-compose ps
```

### 日志管理

```bash
# 查看所有日志
docker-compose logs -f

# 查看指定服务日志
docker-compose logs -f backend

# 查看最近 100 行
docker-compose logs --tail=100 backend

# 导出日志
docker-compose logs backend > backend.log
```

### 备份与恢复

```bash
# 创建备份
./scripts/backup-restore.sh backup

# 列出备份
./scripts/backup-restore.sh list

# 恢复备份
./scripts/backup-restore.sh restore backups/backup_20240101_120000.tar.gz

# 清理旧备份
./scripts/backup-restore.sh clean --keep 5
```

### 滚动更新

```bash
# 更新所有服务
./scripts/rollout.sh

# 只更新后端
./scripts/rollout.sh backend

# 强制更新（跳过确认）
./scripts/rollout.sh --force frontend
```

### 健康检查

```bash
# 简单检查
./scripts/healthcheck.sh

# 详细检查
./scripts/healthcheck.sh --verbose

# 检查指定服务
./scripts/healthcheck.sh backend
```

## 性能优化

### 资源限制

在 `docker-compose.yml` 中已为每个服务配置了资源限制：

- CPU 和内存限制
- 保留资源（最低保障）

### 日志配置

每个服务使用 JSON 文件日志驱动：
- 最大文件大小：50-100MB
- 最大文件数：3-5 个

### 镜像优化

- 使用 Alpine 基础镜像
- 多阶段构建
- 非 root 用户运行
- 启用健康检查

## 安全建议

### 生产环境

1. **更改默认密码**
   - 数据库密码
   - JWT 密钥
   - LiveKit 密钥

2. **使用 SSL/TLS**
   - 配置 Nginx HTTPS
   - 使用 Let's Encrypt 或购买证书

3. **限制网络访问**
   - 只开放必要的端口
   - 使用防火墙规则

4. **定期更新**
   - 更新基础镜像
   - 更新依赖包

5. **监控和告警**
   - 设置资源告警
   - 配置日志聚合

### 环境隔离

- 开发、测试、生产使用不同配置
- 使用单独的网络
- 隔离数据卷

## 故障排查

### 常见问题

1. **服务无法启动**
   ```bash
   # 查看详细日志
   docker-compose logs service-name

   # 检查端口占用
   netstat -tlnp | grep port
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库健康状态
   docker-compose exec postgres pg_isready

   # 测试连接
   docker-compose exec postgres psql -U fastdoc_user -d fastdoc_db
   ```

3. **前端访问后端失败**
   ```bash
   # 检查网络连通性
   docker-compose exec frontend ping backend

   # 检查环境变量
   docker-compose exec frontend env | grep BACKEND
   ```

4. **LiveKit 连接失败**
   ```bash
   # 检查 LiveKit 状态
   docker-compose logs livekit

   # 测试 WebSocket 连接
   curl -v http://localhost:17880/health
   ```

### 调试模式

```bash
# 后端调试
docker-compose exec backend sh
# 然后在容器内运行 npm run start:dev

# 前端调试
docker-compose exec frontend sh
# 然后在容器内运行 npm run dev
```

## 备份策略

### 自动备份

使用 cron 定时执行备份：

```bash
# 每天凌晨 2 点执行备份
0 2 * * * /path/to/fastdocument/scripts/backup-restore.sh backup
```

### 备份内容

- PostgreSQL 数据库
- Redis 数据（RDB 快照）
- 环境配置文件

### 保留策略

- 开发环境：3 天
- 测试环境：7 天
- 生产环境：30 天

## 监控

### 关键指标

- 服务健康状态
- CPU 和内存使用
- 响应时间
- 错误率
- 连接数

### 日志聚合

推荐方案：
- 开发：Docker 日志
- 生产：Loki / ELK / CloudWatch

## 扩展

### 水平扩展

```bash
# 启动多个后端实例
docker-compose up -d --scale backend=3

# 需要配置负载均衡
```

### 垂直扩展

修改 `docker-compose.yml` 中的资源限制：
- CPU 核心数
- 内存大小
