# ---- Build context MUST be the repo root ----
FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /app
COPY . .
# Install ONLY the web subgraph (web + @app/types + their deps) — skips api's deps.
# Halves build-time disk/footprint on constrained build servers.
RUN pnpm install --frozen-lockfile --filter "@app/web..."
# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WA_COUNTRY_CODE=91
ARG NEXT_PUBLIC_IMAGE_HOST
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WA_COUNTRY_CODE=$NEXT_PUBLIC_WA_COUNTRY_CODE \
    NEXT_PUBLIC_IMAGE_HOST=$NEXT_PUBLIC_IMAGE_HOST \
    NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm --filter @app/types build && pnpm --filter @app/web build

FROM node:22-slim AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
