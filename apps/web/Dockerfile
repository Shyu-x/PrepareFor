# Dockerfile for Web Service
# 作者: Shyu

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY apps/web/package*.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY apps/web .

# 复制静态资源
COPY apps/web/src ./src
COPY apps/web/public ./public

# 暴露端口
EXPOSE 33980

# 启动命令
CMD ["pnpm", "dev"]
