# BizDirectory — B2B Business Discovery & Directory Platform

An IndiaMART/Justdial-style B2B directory with **direct customer-to-business contact** (call + WhatsApp, no lead reselling). Phase 1 MVP.

Monorepo: **Next.js** (web) + **NestJS** (api) + **PostgreSQL** + **Redis**, managed with **pnpm workspaces + Turborepo**.

## Structure

```
apps/
  api/            NestJS backend (REST API, Prisma, Redis, auth, GSTIN, search)
  web/            Next.js App Router frontend (SSR/ISR SEO pages, dashboards)
packages/
  types/          Shared Zod schemas + TypeScript types + cache-tag helpers
  config/         Shared tsconfig
infra/
  docker-compose.yml   Local Postgres + Redis
```

## Prerequisites
- Node 20+ and pnpm 10+
- Docker Desktop (for Postgres + Redis) — or point `DATABASE_URL`/`REDIS_URL` at your own instances

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create your env file
cp .env.example .env     # (Windows: copy .env.example .env)

# 3. Start Postgres + Redis
pnpm infra:up

# 4. Run DB migrations + seed (categories, cities, plans, admin user)
pnpm db:migrate          # first run: name the migration e.g. "init"
pnpm db:seed

# 5. Run both apps (Turborepo runs api + web together)
pnpm dev
```

- Web:  http://localhost:3000
- API:  http://localhost:4000/api
- API docs (Swagger): http://localhost:4000/api/docs

## Default credentials (from seed)
- **Admin login** (at `/login` → admin flow via API, or POST `/api/auth/admin/login`): `admin@bizdir.local` / `ChangeMe!123`
- **Customer/Owner login**: any phone number — in dev the **OTP is printed in the API server logs** (SMS_PROVIDER=console).

## Key flows to try
1. **List a business**: `/register` → phone OTP → business details → GSTIN (mock verifies any valid-format GSTIN) → submit.
2. **Admin approve**: log in as admin → `/admin` → approve the pending business (→ becomes publicly visible).
3. **Discover + contact**: `/` → search / browse category → open a business → "Show phone" / WhatsApp (fires a tracked contact event).
4. **Owner dashboard**: `/manage` → see lead counts (calls/WhatsApp/views).

## Useful scripts
| Command | What |
|---------|------|
| `pnpm dev` | Run api + web (Turbo) |
| `pnpm build` | Build everything |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm infra:up` / `infra:down` | Start/stop Postgres + Redis |
| `pnpm db:migrate` | Prisma migrate (dev) |
| `pnpm db:seed` | Seed base data |
| `pnpm --filter @app/api db:studio` | Prisma Studio |

## Configuration notes (all behind env, swappable)
- **SMS**: `SMS_PROVIDER=console` (dev) or `msg91` (set `MSG91_*`).
- **GSTIN**: `GSTIN_PROVIDER=mock` (dev) or `surepass` (set `GSTIN_API_*`).
- **Storage**: `STORAGE_PROVIDER=r2` — presign endpoint returns keys; wire R2/S3 creds to enable real uploads.
- **ISR revalidation**: the API calls `REVALIDATE_WEBHOOK_URL` with `REVALIDATE_SECRET` on business/product changes → Next refreshes the affected ISR pages via cache tags.

## Architecture docs
- `PHASE_1_PLAN.md` — full architecture plan (backend, frontend/SEO, infra, delivery roadmap)
- `TODO_CODING.md` — granular build checklist

## Status
### Phase 1 (MVP) ✅
- Backend: auth (OTP + JWT rotation + admin), businesses, GSTIN verify, products, categories, locations, search, contact tracking, reviews, dashboards, admin moderation + audit logs, uploads (presign), Redis caching, ISR revalidation webhook.
- Frontend: SEO pages (home ISR, category, category×city, location, business, product on-demand ISR), search (SSR, noindex), sitemap + robots + JSON-LD, OTP login, business registration wizard, customer/owner/admin dashboards.

### Phase 2 (Monetization) ✅
- **Subscriptions + payments** via Razorpay (`PAYMENTS_PROVIDER=mock` for local, `razorpay` with keys in prod): checkout → signature verify → activate.
- **Plan entitlements**: Gold → featured + sponsored placement (floats up in search ranking); Silver → verified/analytics tier.
- **Sponsored/Featured badges** on listing cards; public `/pricing` page; in-dashboard upgrade flow (mock auto-activates; real opens Razorpay checkout).

Both apps pass `typecheck` and `build`.

## Deferred to later phases (hooks already in place)
Full-text `tsvector` search → Typesense, sharded sitemaps for 100k+ URLs, BullMQ job queues, real object-storage upload signing, WhatsApp Business API, Razorpay webhooks for auto-renewal/expiry.
