# Dockerfile for PrepareFor - 前端面试题库系统
# 作者: Shyu
# 版本: 1.0.0

# ============================================
# 第一阶段: 构建后端
# ============================================
FROM node:20-alpine AS api-builder

# 设置工作目录
WORKDIR /app/api

# 复制依赖文件
COPY apps/api/package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY apps/api .

# 构建
RUN npm run build

# ============================================
# 第二阶段: 构建前端
# ============================================
FROM node:20-alpine AS web-builder

WORKDIR /app/web

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY apps/web/package*.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY apps/web .

# 构建
RUN pnpm build

# ============================================
# 第三阶段: 运行
# ============================================
FROM node:20-alpine AS runner

# 设置环境变量
ENV NODE_ENV=production \
    API_PORT=42123 \
    WEB_PORT=3000

# 安装 pnpm
RUN npm install -g pnpm

# 创建工作目录
WORKDIR /app

# 复制前端构建产物
COPY --from=web-builder /app/web/.next ./.next
COPY --from=web-builder /app/web/public ./public
COPY --from=web-builder /app/web/package.json ./package.json
COPY --from=web-builder /app/web/node_modules ./node_modules

# 复制后端
COPY --from=api-builder /app/api ./api
COPY --from=api-builder /app/api/node_modules ./api/node_modules

# 复制文档目录
COPY 前端面试题汇总 ./前端面试题汇总

# 安装前端依赖
RUN pnpm install

# 暴露端口
EXPOSE 3000 42123

# 启动命令
CMD ["sh", "-c", "cd api && npm run start:prod & npx next start -p 3000"]
