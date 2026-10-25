FROM node:22-alpine

# Cài đặt openssl cho Prisma Query Engine trên Alpine Linux
RUN apk add --no-cache openssl && mkdir -p /app && chown -R node:node /app

WORKDIR /app

# Chuyển sang user không phải root (node) ngay từ đầu
USER node

# Sao chép file quản lý dependency và Prisma schema trước để tận dụng Docker layer cache
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/

# Cài đặt dependencies và khởi tạo Prisma Client
RUN npm ci && npx prisma generate

# Sao chép mã nguồn ứng dụng
COPY --chown=node:node src ./src/

EXPOSE 3001

# Kiểm tra trạng thái Readiness thực tế (bao gồm kết nối PostgreSQL)
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://127.0.0.1:${PORT:-3001}/api/health/ready || exit 1

# Khi khởi động: tự động chạy migration, seed dữ liệu nền (idempotent) và bật HTTP server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
