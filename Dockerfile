# Stage 1: Build Frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY web/ ./
RUN bun run build

# Stage 2: Production Runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile || bun install --production

COPY src/ ./src
COPY tsconfig.json ./
COPY --from=frontend-builder /app/web/dist ./web/dist

RUN mkdir -p /app/data

VOLUME /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/vpn.db

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
