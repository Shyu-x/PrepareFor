# WebEnv-OS 生产环境 Docker 部署配置

## 环境要求
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ 磁盘空间

## 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/your-org/webenv-os.git
cd webenv-os

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 5. 停止服务
docker-compose -f docker-compose.prod.yml down
```

## 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 11451 | Next.js 应用 |
| 后端 | 18888 | NestJS API |
| 数据库 | 15433 | PostgreSQL |

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (可选)                          │
│                    端口: 80, 443                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Frontend    │   │    Backend    │   │  PostgreSQL   │
│  (Next.js)   │   │   (NestJS)   │   │   (15-alpine) │
│  端口: 8125  │   │  端口: 1126  │   │  端口: 5432   │
└───────────────┘   └───────────────┘   └───────────────┘
```

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| NODE_ENV | production | 运行环境 |
| PORT | 8125 | 前端端口 |
| API_PORT | 1126 | 后端端口 |
| DB_HOST | postgres | 数据库主机 |
| DB_PORT | 5432 | 数据库端口 |
| DB_USER | webenvos | 数据库用户 |
| DB_PASS | webenvos | 数据库密码 |
| DB_NAME | webenvos | 数据库名称 |
| JWT_SECRET | random | JWT 密钥 |
| CORS_ORIGIN | * | 跨域配置 |

## 数据持久化

所有数据存储在 Docker volumes 中：

- `webenv-postgres` - PostgreSQL 数据
- `webenv-workspace` - 工作区文件
- `webenv-logs` - 日志文件

## 健康检查

每个服务都配置了健康检查：

```bash
# 检查前端健康状态
curl http://localhost:11451/api/health

# 检查后端健康状态
curl http://localhost:18888/api/health

# 检查数据库
docker exec webenv-postgres pg_isready -U webenvos
```

## 备份与恢复

### 备份
```bash
# 备份数据库
docker exec webenv-postgres pg_dump -U webenvos webenvos > backup.sql

# 备份工作区
docker run --rm -v webenv-workspace:/data -v $(pwd):/backup alpine tar czf /backup/workspace.tar.gz /data
```

### 恢复
```bash
# 恢复数据库
docker exec -i webenv-postgres psql -U webenvos webenvos < backup.sql

# 恢复工作区
docker run --rm -v webenv-workspace:/data -v $(pwd):/backup alpine tar xzf /backup/workspace.tar.gz -C /
```

## SSL/HTTPS 配置

使用 Nginx 反向代理时，添加 SSL 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:11451;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:18888;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:18888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 资源限制

生产环境建议配置资源限制：

```yaml
services:
  webenv-frontend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  webenv-backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 监控

建议使用以下监控方案：

1. **Docker Stats** - 基础监控
2. **Prometheus + Grafana** - 详细指标
3. **Loki** - 日志聚合

## 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   docker-compose -f docker-compose.prod.yml logs <service-name>
   ```

2. **数据库连接失败**
   ```bash
   docker exec webenv-postgres psql -U webenvos -c "SELECT 1"
   ```

3. **端口冲突**
   ```bash
   netstat -tlnp | grep -E '11451|18888|15433'
   ```

4. **磁盘空间不足**
   ```bash
   docker system df
   docker system prune -a
   ```
