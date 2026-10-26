# BizDirectory — Audit Fix Checklist

Multi-agent senior audit (26 agents, 52 findings, 19 verified high/critical). Tracked by fix batch.

## 🔴 Critical
- [ ] **#1** New-user business registration always 403s (customer role can't POST /businesses → core funnel broken). `auth.service.ts`, `businesses.controller.ts`, `businesses.service.ts`

## Batch 1 — Unblock funnel & auth
- [ ] #1 registration 403 (allow `customer` on POST /businesses + keep in-service promotion)
- [ ] #4 No token refresh → sessions die ~15 min (proxy/getSession: on 401 call /auth/refresh, retry once)
- [ ] #5 Admin/owner routes not role-gated (add (dash)/admin/layout.tsx guard + owner guard)
- [ ] #6 Blocked/deleted users keep access + can re-login (JwtAuthGuard load user status; reject in verify/adminLogin/rotate)

## Batch 2 — Discovery correctness
- [ ] #2 Keyword+category search drops keyword (where.OR clobbered → use where.AND)
- [ ] #3 City free-text search returns 0 (slug-only match; add case-insensitive name OR slug combobox)
- [ ] #11 No pagination on public listings + wrong count label (wire cursor/load-more + real total)

## Batch 3 — Freshness & dashboard
- [ ] #7 ISR revalidation by id vs page tag by slug → public pages stale 24h (unify tags)
- [ ] #8 Mobile dashboard: no sign-out/theme (render UserMenu+ThemeToggle in mobile Sheet)
- [ ] #17 Business profile saves empty name (disable Save when !name.trim())
- [ ] #18 SEO page Save enabled on load failure → wipes settings (track loadFailed)

## Batch 4 — Dark-mode / brand consistency
- [ ] #9 Pricing "Most popular" card unreadable in dark (bg-forest text-paper)
- [ ] #10 Success chips use raw emerald, break in dark (use bg-success/10 text-success)
- [ ] #31 Orange PageHeader icon shadow on olive brand
- [ ] #32 Business hero logo ring hardcoded white
- [ ] #30 Three different WhatsApp greens (tokenize --whatsapp)
- [ ] #33 Inconsistent card shadows
- [ ] #29 "Leads" wording contradicts no-lead-routing model
- [ ] #27 SaveButton redirects to non-existent /business, loses URL
- [ ] #28 Phone hidden on desktop but direct on mobile (make consistent)

## Batch 5 — SEO compliance
- [ ] #12 Auto-SEO pages publish with 0 listings + sitemap cartesian flood (≥5 gate + counts)
- [ ] #16 Missing public pages: Explore, How-It-Works, Contact, Disclaimer
- [ ] #36 Admin SEO is single global title/desc, not per-page

## Batch 6 — Media & monetization
- [ ] #13 Media upload is a non-functional stub (real R2/S3 presign + file pickers)
- [ ] #38 No business gallery/logo/cover management
- [ ] #14 No subscription expiry/renewal (cron job + renewal)
- [ ] #35 No Razorpay webhook (activate only on client verify; mock fail-open footgun)
- [ ] #37 Seeded plans don't match brief tiers (899/999/1299 + 2499 sponsored)
- [ ] #34 Free-tier 3-product cap not enforced
- [ ] #15 No "one GSTIN per listing" uniqueness

## Batch 7 — Backend hardening & admin scale
- [ ] #21 Review-status query param unvalidated
- [ ] #22 contact/events writes for non-existent businesses
- [ ] #23 Reviews postable by phone-unverified users
- [ ] #24 Category/location/plan hard-delete 500 when referenced (handle P2003 → 409)
- [ ] #19 No pagination on admin lists (audit log loads all)
- [ ] #20 Admin can "Suspend" a draft/pending business
- [ ] #25 GSTIN verify UI mistypes response, no failure feedback

## Batch 8 — Low / cleanup
- [ ] Business-page + category/location legacy token migration
- [ ] Sitemap omits /pricing /privacy /terms
- [ ] Business view counter per-request UPDATE → Redis
- [ ] OTP console provider logs plaintext (prod guard)
- [ ] API validation errors collapse to "Validation failed" (flatten)
- [ ] next.config image host placeholder
- [ ] a11y labels (auth, SearchBar, OTP inputmode)
- [ ] Reviews admin bare "Loading…" → skeleton
- [ ] Finish admin Categories/Locations CRUD pages + nav (in progress)
