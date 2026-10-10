# Phase 1 (MVP) — Master Plan
## B2B Business Discovery & Directory Platform (IndiaMART/Justdial-style, direct customer↔business contact)

**Stack:** Next.js (App Router) · NestJS (TypeScript) · PostgreSQL + Redis · Cloudflare · Docker on a single VPS
**Timeline:** ~8 weeks (6–10 adjustable) · **Budget band:** ₹1.2L–₹2.5L
**Principle:** Ship the full *discovery → contact* loop. Leave clean hooks for Phase 2 (monetization) & Phase 3 (scale) — build neither now.

This document consolidates 4 parallel planning tracks:
1. [Backend & Database](#1-backend--database) · 2. [Frontend & SEO](#2-frontend--seo) · 3. [Infra, DevOps & Security](#3-infrastructure-devops--security) · 4. [Delivery Roadmap](#4-delivery-roadmap)

---

## Monorepo layout (shared across all tracks)

```
repo-root/
  apps/
    web/            # Next.js (App Router)
    api/            # NestJS
  packages/
    types/          # shared Zod schemas + TS types (Business, Product, DTOs)
    config/         # shared eslint, tsconfig, prettier
  infra/
    docker-compose.yml / docker-compose.prod.yml / Caddyfile
  .github/workflows/  # ci.yml + deploy.yml
```
Tooling: **pnpm workspaces + Turborepo**. Shared types live in `packages/types` (Zod) so frontend/backend never drift. Handover = "one repo".

---

## 1. Backend & Database

### NestJS module structure
One module per bounded context under `apps/api/src/modules/`: `auth`, `users`, `businesses` (+ `gstin.service`), `products`, `categories`, `locations`, `search`, `contact`, `reviews`, `dashboard`, `admin`, `subscriptions` (placeholder), `uploads`. Plus `common/` (guards, decorators, filters, global ValidationPipe, pino logger, throttler), `config/` (Zod env validation), `database/` (entities/migrations/seeds), `jobs/` (BullMQ queues).

### PostgreSQL schema (core tables)
Conventions: UUID PKs (`pgcrypto`), `timestamptz` timestamps, soft-delete via `deleted_at`. Extensions: `pgcrypto`, `pg_trgm`, `unaccent`, `btree_gin`.

- **users** — phone (E.164, unique, OTP login identity), email, full_name, role enum(`customer`/`business_owner`/`admin`), status, is_phone_verified.
- **admin_credentials** — separate email+password (argon2id) so hashing stays out of the OTP flow.
- **otp_codes** — phone, code_hash (never plaintext), purpose, attempts, expires_at (~5min), consumed_at. Live throttle state in Redis.
- **refresh_tokens** — user_id, token_hash, expires_at, revoked_at (rotation + reuse detection).
- **categories** — self-referential tree (parent_id, slug unique, optional `ltree` path).
- **locations** — type(`state`/`city`/`area`), parent_id, slug, pincode, lat/lng. Seed from public India dataset.
- **businesses** — owner_id, name, slug (unique), description, primary_category_id, location_id, address, contact_phone, whatsapp_number, logo/cover, gstin, gstin_status enum, legal_name, status enum(`draft`/`pending_review`/`active`/`suspended`/`rejected`), is_featured (Phase-2 hook), rating_avg/count, view_count, **search_vector tsvector**.
- **business_categories** (M2M), **business_hours**, **products** (+ search_vector), **product_images**/**business_images**.
- **contact_events** — business_id, user_id (nullable), type(`call`/`whatsapp`/`view_phone`/…), source, ip_hash, created_at. Feeds owner lead analytics; partition by month at scale.
- **reviews** — rating 1–5, status (moderated), unique(business_id,user_id). **subscription_plans** + **business_subscriptions** (placeholder, future-proofs schema). **audit_logs**.

Critical indexes: `GIN(search_vector)`, `GIN(name gin_trgm_ops)`, composite `(primary_category_id, location_id)`, partial `WHERE status='active' AND deleted_at IS NULL`.

### Auth & authorization
OTP flow: `POST /auth/otp/request` → Redis rate-limit (3/15min/phone) + hashed code + BullMQ SMS send → `POST /auth/otp/verify` → upsert user + access JWT (15min) + rotating refresh (30d, hashed). Admin = email+password+argon2id. Guards: `JwtAuthGuard` (global + `@Public()`), `RolesGuard` + `@Roles()`, `BusinessOwnershipGuard`.

### GSTIN verification
Provider-agnostic `GstinProvider` interface (adapters: Sandbox.co.in / Surepass / Signzy / Cashfree). Flow: local format+checksum check → status `pending` → BullMQ job → provider call → store legal_name/address + `verified`. Cache results (Redis + DB) to avoid re-billing. **Non-blocking**: unverified businesses still list; only the "verified badge" is gated. Admin manual override fallback.

### Search (Phase 1 → upgrade)
Postgres FTS (`tsvector`, weighted name=A/category=B/description=C) + `pg_trgm` fuzzy autocomplete + `unaccent`. Ranking: `ts_rank + rating + featured − distance`. Keyset pagination. Isolated behind `SearchService` → drop-in swap to **Typesense/Meilisearch** later.

### Security basics
helmet, strict CORS allowlist, global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`, `@nestjs/throttler` (Redis-backed, tight on OTP/login/contact), hashed OTPs, JWT rotation+reuse-detection, parameterized queries only, DTO whitelisting (block client-set `role`/`status`/`is_featured`), presigned uploads, Joi/Zod env validation, pino logs with PII redaction.

**Recommend confirming first:** ORM (Prisma vs TypeORM — Prisma + raw SQL for FTS recommended), SMS vendor, GSTIN vendor.

---

## 2. Frontend & SEO

### Rendering strategy (the core of SEO-at-scale)
Rule: *indexable → SSG/ISR cached HTML; personalized → client/SSR.*

| Route | Strategy |
|---|---|
| `/` | ISR `revalidate=3600` |
| `/business/[slug]` | **On-demand ISR** — `generateStaticParams: []`, `dynamicParams:true`; owner edit → `revalidateTag('business:'+id)` |
| `/product/[slug]` | Same on-demand ISR |
| `/category/[category]/[city]` | **ISR**, pre-render top ~500 combos, long tail lazy — *the money/ranking pages* |
| `/category/[category]`, `/location/[city]` | ISR, fully pre-render (bounded sets) |
| `/search` | SSR, **noindex,follow** (avoids thin/duplicate index bloat) |
| login / register / all dashboards | SSR/client, **noindex**, auth-guarded |

**On-demand revalidation (critical for 100k pages):** tag every fetch (`business:id`, `city:slug`, `category:slug`); NestJS calls a secured Next route `POST /api/revalidate` on any create/approve/edit/delete → `revalidateTag`. No time-based rebuilds, no redeploys. Self-hosted ISR needs a **Redis-backed cache handler** for multi-instance correctness.

### Route structure
App Router **route groups**: `(marketing)` public SEO layout; `(auth)`/`(customer)`/`(business)`/`(admin)` noindex + guarded. Clean URLs (groups don't appear in path). Middleware does fast cookie/role gate.

### SEO plan
- Metadata API + `generateMetadata()` per dynamic page; title formulas per entity type.
- **Canonical** on every page; `/location/[city]/[category]` canonicals to `/category/[category]/[city]` (one canonical ordering); paginated pages self-canonical (not → page 1).
- **JSON-LD**: `LocalBusiness`, `Product` (offers), `BreadcrumbList`, `Organization`+`WebSite` SearchAction.
- **Sharded sitemaps**: `sitemap.ts` = index → `sitemaps/[type]/[chunk]/route.ts` (50k URLs/shard, `lastmod` from API), ISR-cached. `robots.ts` disallows search/auth/dashboards/api.
- OG images via `next/og` (rich WhatsApp share previews — big in India).

### Slugs
`/business/{kebab-name}-{city}-{shortid}`, `/product/{kebab}-{shortid}` (shortid from stable publicId, not sequential). Store canonical slug + immutable publicId; renamed slug → **301** via slugHistory to protect SEO equity.

### Stack details
Next.js 15 + **Tailwind v4 + Radix** (tiny mobile bundles — avoid MUI). Server Components by default; `'use client'` only on interactive leaves (FilterBar, ContactButtons, OtpInput). httpOnly cookie session (never localStorage JWT). Dashboards use TanStack Query via a `/api/proxy/*` route (hides API host, forwards cookie). Forms: React Hook Form + Zod.

### Contact buttons
Call = `tel:+91…`; WhatsApp = `wa.me/91…?text=<prefilled enquiry>`. Tracking via `navigator.sendBeacon('/api/track', …)` → NestJS `POST /contact/events` — **sendBeacon guarantees flush as page unloads to dialer/WhatsApp** (don't use awaited fetch). Feeds owner stats.

### Performance
`next/image` (AVIF/WebP, explicit dims, priority only on LCP), ISR-cached TTFB, server-components-first JS budget, bundle-analyzer in CI, CWV monitoring + Lighthouse CI budgets. Images on object storage/CDN.

---

## 3. Infrastructure, DevOps & Security

### Local dev
Docker Compose with postgres:16 + redis:7 + api + web. On Windows: run **only Postgres+Redis in Docker**, apps native via `pnpm dev` (fast HMR); use WSL2 backend, keep repo in WSL filesystem, `.gitattributes eol=lf`, pnpm + Volta. Env validated at boot (NestJS Zod, Next `@t3-oss/env-nextjs`).

### Hosting — **primary recommendation: single Hetzner VPS (CPX21, ~₹750/mo) + Docker Compose, behind Cloudflare free**
Reasons: cheap (huge budget headroom), 100% ownership/no lock-in, maps 1:1 onto managed services later (no rewrite). India latency handled by Cloudflare edge caching of SEO pages; if dynamic latency complains → switch to **DigitalOcean Bangalore / AWS Mumbai** (same compose). Managed-DB alt: Neon/Supabase free — but self-hosted PG is cheaper/faster for MVP.

### Deployment architecture
Cloudflare (DNS/CDN/WAF/DDoS/SSL, Full-Strict + Authenticated Origin Pull) → **Caddy** reverse proxy (auto Let's Encrypt; `/`→web, `/api/*`→api) → web(:3000) + api(:4000) + postgres + redis on an **internal Docker network** (DB/Redis never published). ufw allows only 22/80/443; SSH key-only + Fail2ban.

### CI/CD (GitHub Actions)
`ci.yml`: install → lint/typecheck → test (PG+Redis service containers, run migrations) → build → security gates (`pnpm audit`, **Trivy**, **Gitleaks**). `deploy.yml`: build multi-stage images → **ghcr.io** (SHA tag) → SSH deploy (`compose pull && up -d`) with migrations as gated pre-traffic step + `/health` check + instant rollback to prior SHA. `production` environment with manual approval.

### DB ops
Prisma/TypeORM migrations (versioned, `migrate deploy` in prod, expand-then-contract). Nightly `pg_dump` → **Cloudflare R2/Backblaze B2** (encrypted, 7 daily/4 weekly, **monthly restore test**) + Hetzner volume snapshots. Add **PgBouncer** when multi-replica. Redis = ephemeral (OTP/rate-limit/cache).

### Security + DPDP (India)
HTTPS/HSTS, firewall, Cloudflare WAF + rate limiting (outer) + `@nestjs/throttler` (inner, tight on OTP/SMS cost endpoints), helmet/CSP, CSRF on cookie auth, CORS allowlist, image re-encode (sharp), admin panel behind Cloudflare Access/allowlist. **DPDP Act 2023**: data minimization, no OTP/phone in logs (mask `+91XXXXXX1234`), consent+timestamp at signup, gate contact-reveal (anti-scraping), encrypted backups, account deletion/export path, breach detection, reputable vendor DPAs.

### Monitoring (all free tier)
Sentry (errors, PII-scrubbed), UptimeRobot/BetterStack (ping web + `/api/health`), pino JSON logs → Docker (optionally Grafana Loki), Terminus `/health`, Cloudflare Analytics.

### Scaling path (no rewrite)
Vertical bump → split Postgres to managed (Mumbai) → PgBouncer + read replicas (read-heavy directory) → horizontal api/web replicas (stateless, Redis-backed) → **Typesense/Meilisearch** for search → **R2 object storage + image CDN (do this even in MVP — never store images on app volume)** → BullMQ queues → partitioning. Cost: MVP ~₹900–1,800 → growth ₹6k–20k.

### Third-party (India)
SMS/OTP: **MSG91** (needs TRAI DLT registration) / Fast2SMS / Twilio Verify. GSTIN: Signzy/Surepass/Sandbox/Cashfree. WhatsApp: click-to-chat now → Business API (AiSensy/Interakt/Gupshup/Wati) later. Storage: **Cloudflare R2** (zero egress). Payments (Phase 2): Razorpay.

---

## 4. Delivery Roadmap

### Epics
E0 Foundation & DevOps · E1 Identity & Onboarding (GSTIN) · E2 Profiles & Products · E3 Search & Browse · E4 Direct Contact · E5 Dashboards · E6 Admin · E7 SEO · E8 Security/Launch · **E9 Data Seeding (cold-start)**.
> E0 unblocks everyone; E9 decides whether the launched directory is actually usable. Both commonly under-scoped.

### Build order (critical path)
`E0 → E1 → E2 → E3 → E4 → launch`. E7 designed-in from E2 (slugs/SSR), E8 cross-cutting, E9 needs E6 import but seed *sourcing* starts Week 1.

### Week-by-week (~8 weeks)
| Week | Focus | Demoable |
|---|---|---|
| W1 | E0 + GSTIN spike + seed sourcing | Repo, schema, auth on staging; health-check; GSTIN feasibility confirmed |
| W2 | E1 onboarding + Redis/CI | Owner registers, logs in, starts GSTIN verify |
| W3 | E2 profiles + image upload | Owner creates profile; public page renders (slug URL) |
| W4 | E2 products + public page | Catalog managed; public page w/ products + verified badge |
| W5 | E3 search & browse | **Full discovery loop: search → profile** (key internal demo) |
| W6 | E4 contact + E5 owner dashboard | Call/WhatsApp work + events logged + owner lead counts |
| W7 | E6 admin + E7 SEO + customer dashboard | Verify/suspend, category CRUD, SSR+sitemap, save/recent |
| W8 | E9 seeding + E8 hardening + launch | Directory seeded, rate-limit/backups/monitoring, **go-live** |

6-week compress: merge W3/W4 & W6/W7. 10-week: add QA/bugfix + soft-launch week.

### MVP cut-line
**IN:** registration+login+GSTIN (non-blocking), profiles+products+images, category/location search+filters, call/WhatsApp+event logging, owner dashboard + minimal customer dashboard, basic admin, SEO (SSR/JSON-LD/sitemap), security/backups/monitoring/CI, seeded data.
**DEFERRED (with hooks):** monetization/subscriptions/sponsored (nullable `subscription_tier`/`is_sponsored` columns now), reviews/Q&A, in-app messaging/RFQ (`contact_events` already captures lead signal), advanced/geo search, mobile apps, i18n, multi-user-per-business, number masking.

### Testing (right-sized)
Unit (GSTIN validation, auth/guards, search builder, slug, CRUD) · integration (register→verify→profile→product→search→contact against test PG, mock GSTIN) · 3 high-value E2E (owner onboarding, customer search→contact, admin verify/suspend) · manual checklist + one backup-restore drill. Skip exhaustive matrices/load tests (Phase 3).

### Client milestone/payment split
M1 Foundation (W1) **20%** · M2 Onboarding+Profiles (W3-4) **25%** · M3 Discovery+Contact full loop (W6) **25%** · M4 Admin+SEO+Seeding (W7-8) **20%** · M5 Launch+Handover **10%**. Bundle ~2-week post-launch warranty.

### Open questions for Shabaan (confirm at kickoff)
1. GSTIN vendor/budget — mandatory to publish or optional-with-badge?
2. Auth — phone OTP (paid SMS) vs email, or both?
3. Launch scope — which city + categories first? Seed target count?
4. Who sources seed data (client list vs we compile)?
5. Moderation — businesses go live instantly or admin-approved?
6. Hosting preference/account ownership?
7. Branding/Figma, or basic design pass (adds scope)?
8. Contact-event logging acceptable (privacy/consent)?
9. Domain + Terms/Privacy content owner?
10. Where in ₹1.2L–2.5L band → maps to seed volume, design polish, paid APIs, admin depth.

---

## Immediate next steps
1. Confirm the open questions above (esp. GSTIN vendor, auth method, launch city) — these shape W1.
2. Lock decisions: **Prisma vs TypeORM**, SMS vendor, GSTIN vendor.
3. `git init` + scaffold the monorepo (`apps/web`, `apps/api`, `packages/types`, `infra/`, CI).
4. Run the W1 GSTIN API spike early — it's the #1 delivery risk.
