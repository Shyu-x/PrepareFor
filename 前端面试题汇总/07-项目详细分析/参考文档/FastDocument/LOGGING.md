# ============================================================
# FastDocument 日志聚合配置
# ============================================================
# 支持多种日志聚合方案:
# 1. Docker 默认日志驱动（已配置）
# 2. Loki 日志聚合
# 3. ELK Stack (Elasticsearch, Logstash, Kibana)
# ============================================================

# ============================================================
# 方案 1: 使用 Loki（轻量级日志聚合）
# ============================================================
# docker-compose logging 示例配置
# 将此配置添加到 docker-compose.yml 的 logging 部分
#
# services:
#   backend:
#     logging:
#       driver: "json-file"
#       options:
#         max-size: "100m"
#         max-file: "5"
#         # 可选：使用 loki 驱动
#         # driver: "loki"
#         # options:
#         #   loki-url: "http://loki:3100/loki/api/v1/push"
#         #   loki-batch-size: "400"
#         #   max-size: "50m"
#         #   max-file: "5"

# ============================================================
# 方案 2: 使用 ELK Stack
# ============================================================
# 需要单独的 docker-compose.elk.yml 文件

# ============================================================
# 方案 3: CloudWatch Logs (AWS)
# ============================================================
# services:
#   backend:
#     logging:
#       driver: "awslogs"
#       options:
#         awslogs-group: "/ecs/fastdocument"
#         awslogs-region: "us-east-1"
#         awslogs-stream-prefix: "backend"

# ============================================================
# 日志查看命令
# ============================================================
#
# # 查看所有服务日志
# docker-compose logs -f
#
# # 查看特定服务日志
# docker-compose logs -f backend
#
# # 查看最近 100 行日志
# docker-compose logs --tail=100 backend
#
# # 过滤错误日志
# docker-compose logs backend | grep -i error
#
# # 导出日志到文件
# docker-compose logs backend > backend.log
#
# # 使用 docker logs
# docker logs fastdoc-backend --tail=100 --follow
#
# # 使用 journald（系统日志）
# journalctl -u docker -f
#
# ============================================================
# 日志保留策略
# ============================================================
#
# 本地日志（docker-compose.yml 中已配置）:
# - max-size: 单个日志文件最大 50-100MB
# - max-file: 保留 3-5 个日志文件
#
# 建议的日志保留策略:
# - 开发环境: 保留 3 天
# - 测试环境: 保留 7 天
# - 生产环境: 保留 30 天（使用远程日志服务）
#
# ============================================================
# 生产环境日志最佳实践
# ============================================================
#
# 1. 使用结构化日志（JSON 格式）
# 2. 包含请求 ID 用于追踪
# 3. 设置合适的日志级别:
#    - DEBUG: 开发环境
#    - INFO: 生产环境正常操作
#    - WARN: 警告但不影响功能
#    - ERROR: 错误需要关注
# 4. 避免记录敏感信息（密码、令牌等）
# 5. 使用日志聚合服务进行长期存储和分析
#
# ============================================================

# 日志级别配置示例（后端）
# .env 中设置:
# FASTDOC_LOG_LEVEL=info
#
# 可选值: debug, info, warn, error, fatal

# 日志格式示例（JSON）
# {
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "level": "info",
#   "message": "Request processed",
#   "context": {
#     "method": "GET",
#     "path": "/api/documents",
#     "statusCode": 200,
#     "responseTime": 45,
#     "userId": "user123"
#   }
# }

# ============================================================
# Grafana + Loki 日志可视化（可选）
# ============================================================
# 1. 安装 Loki
# 2. 配置 Grafana 数据源
# 3. 创建日志查询面板
#
# Loki 查询示例:
# {container_name="fastdoc-backend"} |= "error"
# {container_name="fastdoc-frontend"} | json | level="error"
# {container_name="fastdoc-backend"} | json | responseTime > 1000
