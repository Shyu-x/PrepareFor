# Dockerfile for API Service
# 作者: Shyu

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY apps/api/package*.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY apps/api .

# 复制文档目录
COPY 前端面试题汇总 ../前端面试题汇总

# 暴露端口
EXPOSE 42123

# 启动命令
CMD ["npm", "run", "start:dev"]
