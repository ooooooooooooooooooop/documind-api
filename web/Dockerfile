# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine AS base

# 1. 依赖安装阶段
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci

# 2. 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED 1

# 构建 Next.js 应用
RUN npm run build

# 3. 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 自动利用 output: 'standalone' 减少镜像体积
# 注意：需要在 next.config.ts 中开启 output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# 允许所有主机访问 (不仅是 localhost)
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
