# ---- Build context MUST be the repo root ----
FROM node:22-slim AS builder
RUN corepack enable
# Native build deps for argon2 / prisma engines
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
# Install ONLY the api subgraph (api + @app/types + their deps) — skips web's deps.
# Halves build-time disk/footprint on constrained build servers.
RUN pnpm install --frozen-lockfile --filter "@app/api..."
RUN pnpm --filter @app/types build \
  && pnpm --filter @app/api exec prisma generate \
  && pnpm --filter @app/api build

FROM node:22-slim AS runner
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/api
EXPOSE 4000
# Apply migrations, then start. Fails fast if DB is unreachable.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
