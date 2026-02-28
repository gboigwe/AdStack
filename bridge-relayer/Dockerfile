FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

FROM node:18-alpine

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
