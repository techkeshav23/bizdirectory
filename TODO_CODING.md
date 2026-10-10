# Phase 1 — Complete Coding TODO Checklist
## B2B Business Discovery & Directory Platform

Companion to [PHASE_1_PLAN.md](PHASE_1_PLAN.md). This is the tick-off build bible. Two tracks run in parallel: **Backend+Infra** and **Frontend+SEO**, joined by the shared monorepo and the `/api/revalidate` contract.

### ⚠️ Blocking client decisions (resolve or stub behind interface)
- [ ] ⚠️ ORM: **Prisma** (recommended, assumed below)
- [ ] ⚠️ SMS vendor (MSG91 / Fast2SMS / Twilio Verify) — affects `sms.service` adapter only
- [ ] ⚠️ GSTIN vendor (Sandbox.co.in / Surepass / Signzy / Cashfree) — affects `gstin` adapter only
- [ ] ⚠️ Moderation mode (instant-live vs admin-approved) — affects business default `status`
- [ ] ⚠️ Object storage (Cloudflare R2 assumed; S3-compatible) — adapter config only
- [ ] ⚠️ Reviews scope (minimal vs deferred) — confirm

---

# TRACK A — Backend + Infrastructure/DevOps

## A1. Monorepo + Scaffolding
- [ ] `git init`; `.gitignore` (node_modules, dist, .env, .turbo, coverage, .next, *.log)
- [ ] `.gitattributes` → `* text=auto eol=lf`, `*.sh text eol=lf` (Windows/WSL2 safety)
- [ ] Root `package.json` (private, `packageManager: pnpm@<pin>`, turbo scripts), `pnpm-workspace.yaml` (`apps/*`,`packages/*`), Volta pin
- [ ] `turbo.json` pipelines (build dependsOn ^build, lint, typecheck, test, dev persistent)
- [ ] Folders: `apps/api`, `apps/web`, `packages/types`, `packages/config`, `infra/`, `.github/workflows/`
- [ ] `packages/config`: `tsconfig.base.json`, eslint preset, prettier config
- [ ] `packages/types`: Zod init + barrel (Business, Product, enums, pagination DTOs — filled as modules land)
- [ ] Root `.env.example` (ALL vars: DATABASE_URL, REDIS_URL, JWT secrets+TTLs, OTP_TTL, throttle, SMS_*, GSTIN_*, R2/S3_*, SENTRY_DSN, REVALIDATE_WEBHOOK_URL+SECRET, admin seed, CORS_ORIGINS)
- [ ] README with WSL2/Windows dev notes
- **DoD:** `pnpm install` + `pnpm turbo run lint typecheck` pass; shared config/types importable

## A2. Local Dev Infra
- [ ] `infra/docker-compose.yml`: postgres:16 (volume, healthcheck pg_isready) + redis:7 (healthcheck ping), ports published for native dev
- [ ] `depends_on: service_healthy` wiring
- [ ] Root scripts: `infra:up`/`infra:down`/`infra:logs`
- [ ] Windows note: only PG+Redis in Docker, apps native via `pnpm dev`
- **DoD:** `pnpm infra:up` → healthy PG16 + Redis7 reachable from host

## A3. NestJS Bootstrap
- [ ] Scaffold `apps/api`; `config/env.schema.ts` (⚠️ Zod) + `ConfigModule.forRoot({isGlobal, validate})` fail-fast
- [ ] `main.ts`: helmet, CORS allowlist, cookie parser, `setGlobalPrefix('api')`
- [ ] Global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`
- [ ] `nestjs-pino` JSON logs + PII redaction (authorization, phone, otp, code, password) + request-id
- [ ] Swagger `/api/docs` (prod-gated); Terminus `GET /api/health` (DB+Redis); shutdown hooks
- **DoD:** api boots, `/health` 200, invalid env aborts, `/docs` renders

## A4. Database Layer (⚠️ Prisma)
- [ ] Prisma + `schema.prisma` (postgresql datasource, client generator, postgresqlExtensions)
- [ ] Migration `000_extensions`: pgcrypto, pg_trgm, unaccent, btree_gin
- [ ] Conventions: UUID PK `gen_random_uuid()`, timestamptz, `deleted_at` soft-delete, created/updated
- [ ] Enums: UserRole, UserStatus, OtpPurpose, BusinessStatus, GstinStatus, ReviewStatus, ContactEventType, LocationType, AuditAction
- [ ] Models: **users, admin_credentials, otp_codes, refresh_tokens, categories, locations, businesses, business_categories, business_hours, products, product_images, business_images, contact_events, reviews, subscription_plans, business_subscriptions, audit_logs** (all columns/relations per plan)
- [ ] Phase-2 hooks on businesses: `is_featured`, `is_sponsored`, `subscription_tier` (inert)
- [ ] Critical index migration: `GIN(search_vector)` (biz+products), `GIN(name gin_trgm_ops)`, composite `(primary_category_id, location_id)`, partial `WHERE status='active' AND deleted_at IS NULL`
- [ ] `search_vector` triggers: weighted name=A/category=B/description=C + unaccent, on INSERT/UPDATE
- [ ] `PrismaService`+`PrismaModule` (global), soft-delete middleware
- [ ] Seeds: categories tree, India locations (states/cities/pincodes), subscription_plans; ⚠️ admin bootstrap (argon2id, prod-gated)
- **DoD:** `migrate dev` clean from scratch; `generate` types; seeds populate; FTS triggers fill search_vector

## A5. common/ (Guards, Decorators, Filters, Throttler)
- [ ] Decorators: `@Public()`, `@Roles()`, `@CurrentUser()`
- [ ] Guards: `JwtAuthGuard` (global, respects @Public), `RolesGuard`, `BusinessOwnershipGuard` (admins bypass)
- [ ] `AllExceptionsFilter` (Prisma error mapping, no PII, Sentry hook), logging + transform interceptors
- [ ] `PaginationDto` (keyset cursor + offset fallback), mirror in packages/types
- [ ] `@nestjs/throttler` + Redis storage; named throttlers: default, otp(3/15min/phone), login, contact
- [ ] Register global APP_GUARDs
- **DoD:** @Public reachable; @Roles('admin') 403s non-admin; ownership blocks foreign edits; OTP 429 after 3

## A6. Auth Module
- [ ] JWT module (access 15m / refresh 30d from env); DTOs (OtpRequest, OtpVerify, AdminLogin, Refresh)
- [ ] `otp.service`: generate + hash (no plaintext) + Redis throttle + verify (attempts/expiry/lockout)
- [ ] ⚠️ `sms.service`: `SmsProvider` interface + adapter + dev console no-op (DLT sender for MSG91)
- [ ] `POST /auth/otp/request` (throttle→hashed OTP→BullMQ SMS→202, no phone-exists leak)
- [ ] `POST /auth/otp/verify` (verify→upsert user+consent→access JWT+rotating refresh→httpOnly cookies)
- [ ] `token.service`: sign access, refresh rotation + **reuse detection** (revoke chain)
- [ ] `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/admin/login` (argon2id, tight throttle), `GET /auth/me`
- [ ] Tests: otp hash/verify/expiry, token rotation/reuse, argon2id, happy-path integration (mock SMS)
- **DoD:** full OTP login; refresh rotates + reuse revokes chain; admin argon2id login; OTP never plaintext

## A7. Users Module
- [ ] `users.service` (findByPhone, upsertByPhone, updateProfile, soft-delete+export DPDP)
- [ ] `UpdateProfileDto` whitelist blocks role/status; `GET/PATCH/DELETE /users/me`
- [ ] Tests: whitelist strips role/status
- **DoD:** profile read/update; no role escalation; deletion soft+logged

## A8. Categories Module
- [ ] `categories.service` (tree, by-slug, flat) + Redis cache + invalidation on admin CRUD
- [ ] `GET /categories`, `GET /categories/:slug`, admin CRUD (guarded)
- **DoD:** tree from cache; admin edits bust cache; slugs unique

## A9. Locations Module
- [ ] `locations.service` (by type/parent/slug) + Redis cache; `GET /locations`, `GET /locations/:slug`
- **DoD:** seeded India dataset queryable; served from cache

## A10. Businesses Module
- [ ] `businesses.service`: create (⚠️ default status per moderation), update (ownership), get-by-slug (public active), owner list, submit-for-review, soft-delete
- [ ] Slug `{kebab-name}-{city}-{shortid}` + immutable publicId + **slugHistory** (301)
- [ ] M2M categories, business_hours, business_images sub-resources
- [ ] DTOs whitelist block status/is_featured/is_sponsored/rating/view_count/gstin_status
- [ ] Endpoints: `POST /businesses`, `PATCH /businesses/:id`, `GET /businesses/:slug`, `GET /businesses/me`, `POST /businesses/:id/submit`, `DELETE`
- [ ] View count via Redis counter (flush job); **trigger revalidation on mutations**
- **DoD:** owner-only edits; protected fields unsettable; slug+history; revalidation fired

## A11. GSTIN Service
- [ ] Local format + checksum validation (pure fn, unit-tested first)
- [ ] ⚠️ `GstinProvider` interface + adapter + dev mock
- [ ] Flow: local check → pending → BullMQ job → provider → store legal_name/address + verified/failed
- [ ] Cache results (Redis+DB); **non-blocking** (listing never gated, only badge); admin manual override + audit
- [ ] `POST /businesses/:id/gstin`, status GET
- [ ] Tests: checksum valid/invalid, caching, non-blocking, job→verified (mock)
- **DoD:** invalid rejected w/o provider call; pending→verified via job; cached; listing never blocked

## A12. Products Module
- [ ] `products.service` CRUD scoped to owned business, slug+history, image sub-resource
- [ ] DTOs (price/currency/unit optional); endpoints `POST/PATCH/DELETE /products`, `GET /businesses/:slug/products`, `GET /products/:slug`
- [ ] Ownership guard via parent; revalidation on mutations
- **DoD:** owner-only CRUD; search_vector auto; revalidation fired

## A13. Search Module
- [ ] `search.service` isolated (swap to Typesense/Meilisearch later)
- [ ] FTS weighted + unaccent (parameterized raw SQL), pg_trgm suggest, ranking (ts_rank+rating+featured−distance), keyset pagination, filters
- [ ] `GET /search`, `GET /search/suggest`; Redis cache hot queries
- [ ] Tests: query builder, ranking order, keyset cursor
- **DoD:** ranked keyset-paginated active results; fuzzy suggest; cached; swappable

## A14. Contact Module
- [ ] `contact.service`: record event + hash IP (no raw PII) + Redis lead counters
- [ ] `POST /contact/events` (@Public, sendBeacon-tolerant, tight throttle by IP)
- [ ] Tests: ip hashing, counter increment, persistence
- **DoD:** events persist w/ hashed IP, feed counters, throttled, sendBeacon works

## A15. Reviews Module (⚠️ minimal)
- [ ] `reviews.service`: create (unique biz+user), moderation, list approved, **rating denorm** (transactional)
- [ ] DTO whitelist (no client status); `POST /businesses/:id/reviews`, `GET /businesses/:slug/reviews`
- **DoD:** one per user/biz; rating denorm consistent; only approved public

## A16. Dashboard Module
- [ ] `dashboard.service`: owner analytics (leads from contact_events+Redis, views, by type/time) + customer (saved/recent)
- [ ] `GET /dashboard/owner`, `GET /dashboard/customer` (role+ownership guards)
- **DoD:** accurate owner lead/view counts scoped to own; customer saved/recent

## A17. Admin Module
- [ ] `admin.service`: moderate businesses (approve/reject/suspend), reviews, GSTIN override, category/location CRUD, user mgmt
- [ ] Every mutation writes **audit_logs** (actor, action, before/after, ip_hash)
- [ ] Endpoints `@Roles('admin')`; status change → revalidation; `GET /admin/audit-logs`
- **DoD:** moderation audited; approvals revalidate; admin-only

## A18. Subscriptions (placeholder)
- [ ] `subscriptions.service` read plans; `GET /subscriptions/plans`; hooks inert
- **DoD:** plans listable; no billing

## A19. Uploads Module
- [ ] ⚠️ `StorageProvider` interface + R2/S3 adapter; `POST /uploads/presign` (auth+ownership, content-type+size+key-prefix constraints)
- [ ] Never proxy bytes / never store on app volume; sharp re-encode decision
- **DoD:** scoped presigned URL; lands in R2; API never streams bytes

## A20. Jobs/Queues (BullMQ)
- [ ] Queues: SMS send, GSTIN verify, OTP cleanup (repeatable), view-count flush (repeatable), cache warm (repeatable), contact-counter aggregation
- [ ] Retry/backoff + DLQ + pino/Sentry on failure; single-process workers for MVP
- **DoD:** all queues w/ retry; repeatables scheduled; OTP cleanup + view flush verified

## A21. Redis Caching Layer
- [ ] ioredis wrapper, namespaced keys + TTL constants; cache categories/locations/profile/search/suggest + invalidation
- [ ] Rate-limit keys, OTP store, view/lead counters; stampede protection
- **DoD:** hot reads from Redis; mutations invalidate; Redis purely ephemeral

## A22. Security Hardening
- [ ] helmet+CSP, HSTS at edge, strict CORS, ValidationPipe whitelist, throttler on OTP/login/contact
- [ ] OTPs hashed/never-logged, JWT rotation+reuse, parameterized queries, CSRF on cookie routes
- [ ] pino PII redaction (phone masked), presigned uploads + content validation
- [ ] DPDP: consent+timestamp, minimization, deletion/export, encrypted backups; secrets via CI, Gitleaks
- **DoD:** each item test/manual-verified; no secrets/PII in logs or repo

## A23. ISR Revalidation Webhook Caller
- [ ] `revalidate.service`: `POST {REVALIDATE_WEBHOOK_URL}` + secret header + tags (`business:{id}`, `product:{id}`, `city:{slug}`, `category:{slug}`)
- [ ] Call on business create/approve/edit/suspend/delete + product create/edit/delete
- [ ] Resilient via BullMQ job (retry); no-op in dev if unset
- **DoD:** every indexable mutation fires secured retried revalidation; failures don't fail mutation

## A24. Dockerfiles & Prod Infra
- [ ] `apps/api/Dockerfile` multi-stage (deps→build+prisma generate→slim non-root runtime), `.dockerignore`
- [ ] `infra/docker-compose.prod.yml`: api+web+postgres+redis+Caddy on internal network, **DB/Redis NOT published**, volumes, restart, healthchecks
- [ ] `infra/Caddyfile`: auto LE, `/`→web:3000, `/api/*`→api:4000, security headers, Authenticated Origin Pull
- [ ] Migration-as-gated-pre-traffic step; ufw/SSH/Fail2ban provisioning notes
- **DoD:** prod compose runs api+web+caddy w/ private DB/Redis; TLS+routing work

## A25. CI (`ci.yml`)
- [ ] PR+push: pnpm install (cache)→lint→typecheck→test with **PG16+Redis7 service containers** (migrate+seed)→build
- [ ] Security gates: pnpm audit, **Trivy**, **Gitleaks**; fail on any; upload coverage
- **DoD:** CI runs against real PG+Redis w/ migrations; gates block merges

## A26. Deploy (`deploy.yml`)
- [ ] Build multi-stage images → **ghcr.io** (SHA tag); `production` env manual approval
- [ ] SSH deploy (`compose pull && up -d`); **migrate gated pre-traffic**; `/health` check; instant rollback to prior SHA
- **DoD:** SHA image deploys, migrates before traffic, health-checks, auto-rollback

## A27. Backups, Monitoring, Ops
- [ ] Nightly `pg_dump`→encrypt→R2/B2 (7 daily/4 weekly), monthly restore drill; Hetzner snapshots
- [ ] Sentry (PII-scrubbed beforeSend), Terminus health for UptimeRobot/BetterStack, pino→Docker (opt Loki), Cloudflare Analytics/WAF
- **DoD:** nightly encrypted backup in R2; Sentry scrubbed; health monitored; restore drilled

## A28. Testing (cross-cutting)
- [ ] Unit: GSTIN checksum, auth/guards, token rotation+reuse, search builder, slug+history, CRUD, rating denorm, ip hash
- [ ] Integration (test PG+Redis, mock GSTIN/SMS): register→verify→business→product→search→contact
- [ ] 3 E2E: owner onboarding, customer search→contact, admin verify/suspend; fixtures/factories; backup-restore drill
- **DoD:** unit+integration green in CI w/ mocked vendors; 3 E2E pass

**Backend build order:** A1→A2→A3→A4→A5 (E0) → A6→A7→A11→A19 (E1) → A8→A9→A10→A12 (E2) → A13 (E3) → A14→A16 (E4) → A15→A17→A18 → A20/A21/A23 woven in → A22 → A24→A25→A26→A27 → A28 continuous.

---

# TRACK B — Frontend + SEO (apps/web)

> `[SEO]` = SEO-critical. Paths relative to `apps/web/`.

## B1. apps/web Scaffolding
- [ ] Next.js 15 App Router + TS strict (`noUncheckedIndexedAccess`, `@/*`→`src/*`); app under `src/`
- [ ] Tailwind v4 (CSS-first `@theme` tokens in globals.css), Radix, lucide-react, cva, tailwind-merge + `cn()`
- [ ] next/font (Inter + Indic fallback) → CSS vars
- [ ] `@t3-oss/env-nextjs` `src/env.ts` (NEXT_PUBLIC_SITE_URL, API_INTERNAL_URL server-only, REVALIDATE_SECRET, WA country code, CDN host); import in next.config
- [ ] `next.config.ts`: images AVIF/WebP + remotePatterns (R2), typedRoutes, cacheHandler placeholder
- [ ] `[SEO]` root `layout.tsx` with `metadataBase` + title template + OG/twitter defaults
- [ ] `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`, `[SEO]` `manifest.ts` + icons
- **DoD:** dev boots, build passes strict, env fails-fast, metadataBase absolute URLs

## B2. Shared Types & Data-Fetch Infra
- [ ] Consume `@repo/types` (no redefining)
- [ ] `[SEO]` `src/lib/api.ts`: server fetch → API_INTERNAL_URL, Zod parse, `next:{revalidate,tags}`, **tag helpers** `tagBusiness/tagCity/tagCategory`, typed errors→notFound/redirect
- [ ] `src/lib/auth.ts`: read httpOnly cookie, `getSession()` (no JWT to client)
- [ ] `[SEO]` `src/middleware.ts`: cookie/role gate for (customer)/(business)/(admin)/(auth); matcher EXCLUDES public, _next, sitemap, robots
- [ ] `/api/proxy/[...path]/route.ts` (inject cookie, hide API host)
- [ ] `[SEO]` `/api/revalidate/route.ts` (verify REVALIDATE_SECRET, revalidateTag/Path) — engine for 100k pages
- [ ] `/api/track/route.ts` (sendBeacon → NestJS contact events, fast 204, no auth)
- [ ] `src/lib/constants.ts` route builders + noindex robots object
- **DoD:** typed tagged fetch; revalidate busts tag; track accepts beacon; middleware gates dashboards, leaves public untouched

## B3. UI Primitives (`components/ui/*`)
- [ ] Button, Input+Label+FieldError, Badge, Card, Sheet, Dialog, Tabs, OtpInput (6-digit paste/auto-advance), Skeleton/Spinner/Separator, Toast provider
- **DoD:** typed, Radix-accessible, themeable, `'use client'` only where needed

## B4. Directory & Layout Components
- [ ] directory: RatingStars, VerifiedBadge (only if gstin verified), BusinessCard, ProductCard, CategoryGrid, CityHero, `[SEO]` Breadcrumbs (visible + BreadcrumbList), FilterBar (client, searchParams), ContactButtons (client), `[SEO]` JsonLd component
- [ ] layout: PublicHeader, MobileNav bottom bar (client), `[SEO]` Footer (link clusters), dashboard shells
- **DoD:** Breadcrumbs+JsonLd reusable; VerifiedBadge honors GSTIN; FilterBar round-trips URL

## B5. Forms (`components/forms/*`)
- [ ] GstinField (client checksum + async verify shows legal_name), BusinessWizard (multi-step state machine), ProductForm (image upload presigned), Form wrapper (RHF+Zod), `useUpload` hook
- **DoD:** Zod client validation + server errors; GstinField shows returned legal name

## B6. Public SEO Pages `[SEO]` (each: generateMetadata + canonical + Breadcrumbs + JSON-LD)
- [ ] `/` home — ISR `revalidate=3600`; Organization+WebSite SearchAction JSON-LD
- [ ] `/category/[category]/[city]` — **ISR + generateStaticParams top ~500 + dynamicParams** (MONEY PAGES); tags category+city; title `{Category} in {City}`
- [ ] `/category/[category]` — ISR fully pre-rendered; city sub-links
- [ ] `/location/[city]` — ISR fully pre-rendered; **canonical cross-rule** (location/city/category → category/city)
- [ ] `/business/[slug]` — on-demand ISR (`generateStaticParams:[]`, dynamicParams), **slug 301 via slugHistory**, LocalBusiness JSON-LD, `opengraph-image.tsx`, VerifiedBadge, ContactButtons, products, hours
- [ ] `/product/[slug]` — on-demand ISR, slug 301, Product JSON-LD (offers), OG image
- [ ] `/search` — SSR `force-dynamic`, **`robots:{index:false,follow:true}`**, filters via searchParams, pagination
- **DoD:** rendering flags match plan; canonical+breadcrumbs+JSON-LD each; /search noindex; slug 301; owner edit refreshes via tag

## B7. SEO Infrastructure `[SEO]`
- [ ] `robots.ts` (disallow /search,/login,/register,/dashboard,/manage,/admin,/api; ref sitemap)
- [ ] `sitemap.ts` (index) → `sitemaps/[type]/[chunk]/route.ts` (**50k URLs/shard**, lastmod from API, ISR-cached)
- [ ] `src/lib/jsonld.ts` builders (localBusiness, product, breadcrumbList, organization, website)
- [ ] OG image system (shared og util); verify metadataBase + canonical → absolute
- **DoD:** robots/sitemap/shard valid; disallow blocks non-indexable; JSON-LD validates in Rich Results; OG renders

## B8. Redis-backed ISR Cache Handler `[SEO]`
- [ ] Custom `cacheHandler.js` (Redis get/set/revalidateTag); wire in next.config (`cacheMaxMemorySize:0`); dev fallback vs prod
- **DoD:** two web instances on shared Redis both serve freshly-revalidated HTML after one /api/revalidate

## B9. Auth Flow / OTP (`(auth)` group, noindex)
- [ ] `(auth)/layout.tsx` noindex; `login/page.tsx` (phone→OTP→httpOnly cookie→role redirect)
- [ ] `register/page.tsx` BusinessWizard (phone OTP → basics → GSTIN verify shows legal_name non-blocking → categories/location → submit pending)
- [ ] Cookie session set route/action; middleware redirect logged-in away from /login
- **DoD:** OTP login sets httpOnly cookie; wizard → pending_review + shows legal name; auth noindex

## B10. Contact Buttons & Tracking
- [ ] ContactButtons (client): `tel:` call, `wa.me/91…?text=` prefilled; **sendBeacon('/api/track')** non-blocking (NOT awaited fetch); number-reveal gating (fires view_phone); sendBeacon fallback (keepalive fetch)
- **DoD:** dialer/WhatsApp open; contact_events recorded despite navigation; reveal gates+logs

## B11. Dashboards (noindex + auth-guarded, TanStack Query via /api/proxy)
- [ ] Shared: QueryClientProvider, `useApi` hooks, per-layout noindex+role guard
- [ ] `(customer)/dashboard`: overview, saved (unsave), contacted/recent
- [ ] `(business)/manage`: KPIs, profile edit + image upload → **trigger revalidate** `[SEO]`, products CRUD → revalidate `[SEO]`, stats charts
- [ ] `(admin)/admin`: moderation queue approve/reject → **revalidate + sitemap** `[SEO]`, category CRUD → revalidate, users mgmt
- **DoD:** dashboards behind auth+noindex; owner edits refresh public pages; admin approve publishes+updates sitemap

## B12. Performance `[SEO]`
- [ ] next/image everywhere (AVIF/WebP, explicit dims kill CLS, priority only LCP), R2 CDN remotePatterns
- [ ] Server-Components-first JS budget; `@next/bundle-analyzer` in CI; `useReportWebVitals`; **Lighthouse CI budgets** gating PRs
- **DoD:** analyzer+Lighthouse CI gate PRs; LCP priority; all images dimensioned; minimal client JS; CDN images

## B13. Testing
- [ ] Component (primitives, BusinessCard, VerifiedBadge, ContactButtons mock sendBeacon); `[SEO]` JSON-LD builders + slug 301/canonical unit tests
- [ ] Playwright E2E: owner onboarding, customer search→contact (assert /api/track beacon), admin verify/suspend (assert revalidate)
- **DoD:** component+unit green; 3 Playwright flows pass headless; revalidate/track asserted via interception

**Frontend build order:** B1→B2→B3→B4→B5 → B6→B7→B8 (public+SEO) → B9 (auth) → B10 → B11 (dashboards) → B12 → B13.

---

## Shared contract between tracks
The **`/api/revalidate`** endpoint (B2) + its **caller** (A23) are the join: NestJS fires tagged revalidation on every indexable mutation → Next refreshes on-demand ISR pages across Redis-backed instances (B8). Keep tag names identical on both sides: `business:{id}`, `product:{id}`, `city:{slug}`, `category:{slug}`.

## Recommended parallelization
- **Week 1:** A1–A5 + B1–B2 (foundation both sides, shared types contract)
- Then backend races ahead on modules (A6–A19) while frontend builds primitives→public pages (B3–B8) against mocked/early API
- Join on auth (A6 ↔ B9), contact (A14 ↔ B10), revalidation (A23 ↔ B2/B8), dashboards (A16/A17 ↔ B11)
