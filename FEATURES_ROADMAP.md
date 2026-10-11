# BizDirectory — Feature Roadmap (learning from whatscamp)

whatscamp is a Vue 3 WhatsApp SaaS; BizDirectory is a React/Next B2B directory. The
transferable value is whatscamp's **generic SaaS infrastructure + UX patterns**, NOT its
WhatsApp/telephony core (~half its ~70 screens are WABA/VoIP — ignore those). Produced by
multi-agent analysis + adversarial review.

## 1. Decision table — whatscamp capability → our decision

| Capability | Decision | Why | Effort |
|---|---|---|---|
| shadcn component kit (table, dialog, select, tabs, badge, card, input, form, skeleton, command, toast) | **ADOPT** (shadcn/ui React) | We have 1 primitive; biggest consistency win | M |
| DataTable (typed, loading/empty/sort/pagination) | **ADOPT** (React + TanStack Table) | Admin + listings are `<div>` stacks today | M |
| PageHeader / DetailPageLayout | **ADOPT** | Makes a multi-module app feel like one product | S |
| Crud/Confirm/Delete/UnsavedChanges dialogs | **ADOPT** | Kills per-page dialog drift; safe deletes | S |
| EmptyState / ErrorState (designed, retry/CTA) | **ADOPT** | We ship raw "Nothing here."/"Loading…" | S |
| Audit log UI (list + per-record diff timeline + MetadataPanel) | **ADOPT** | We **already log** audit events — just no UI | M |
| Advanced analytics + charts (date-range + widgets) | **ADAPT** | Swap agent metrics for leads/views/conversion (needs a time-series endpoint first) | M |
| Import/Export CSV (column config, template, dedupe, partial-error) | **ADAPT** | Bulk listing/product/category mgmt | M |
| Notifications + toast layer | **ADAPT** | We have no toasts at all; wire enquiry/review/moderation events | S–M |
| Saved searches / lists | **ADAPT** | Buyer saved searches + seller saved leads | S |
| i18n / Hindi | **ADAPT** (`next-intl`) | India B2B needs Hindi/regional — but it's a routing/sitemap decision, commit early or defer (not mid-rank) | M (broad) |
| Shared inbox / chat → **ENQUIRY INBOX** | **ADAPT** — strategic win, **phased** | Capture the "direct contact" lead on-platform instead of losing it to call/WhatsApp | see below |
| Roles & permissions matrix | **DEFER** | We have one `isAdmin` bit; build the matrix only when a 2nd admin role actually ships | M |
| Canned responses / contacts+tags (seller CRM) | **ADAPT** (later) | Only meaningful once the inbox exists | S–M |
| Agent transfers / SLA / round-robin team assignment | **APPENDIX** | Assumes multi-agent teams — contradicts "one owner = one business" | — |
| API keys / webhooks / chatbot-AI / SSO / multi-tenancy | **APPENDIX / SKIP** | No current demand; WhatsApp-SaaS organs | — |
| WhatsApp WABA, HSM templates, Flows, telephony/IVR, call logs, broadcast campaigns, Meta insights | **SKIP** | We only need `wa.me` deep link (already have it) | — |
| Dark mode + token system | **ADOPT the mechanism, SKIP the emerald theme** | Keep our warm brand; port `next-themes` pattern | S |

## 2. Prioritized roadmap

### 🟢 Quick wins (1–3 weeks) — foundation + visible polish
Everything depends on a real component layer; low-effort, high-consistency.
1. shadcn/ui primitives mapped onto our warm tokens
2. PageHeader + DetailPageLayout + EmptyState/ErrorState
3. DataTable + PaginationControls + SearchInput (replace admin/listings div-stacks)
4. Toast layer (sonner) across save/review/contact/moderation
5. Standard dialogs + skeleton loading states
6. **SEO/perf for public routes** (`next/image`, JSON-LD, `loading.tsx`) — pulled forward; this is a directory's actual job

### 🟡 High-value (1–2 months) — differentiators + admin maturity
7. **Async Enquiry Capture (inbox v1)** — form → stored lead → email/notification to seller → seller replies via a simple **non-realtime** thread. Captures the on-platform-lead value at **S/M** effort. *(Full realtime inbox is a separate quarter — see #12, not here.)*
8. **Audit log UI** — surface events we already store (admin list + diff timeline + created/updated-by)
9. **Analytics with charts** — date-range + widgets over leads/views/conversion/sponsored-ROI (build the time-series endpoint first)
10. **Import/Export CSV** — bulk listing/product/category
11. **Notification preferences + saved searches**

### 🔵 Big bets (quarter+) — only after inbox proves engagement + paying sellers exist
12. **Realtime Enquiry Inbox v2** — WebSocket/SSE, unread state, internal notes, canned responses, + the moderation/spam/abuse obligations that come with being a messaging platform
13. **i18n / Hindi (+ regional)** — `next-intl`, locale routing, `hreflang`, per-locale sitemaps (architecture decision — commit early if wanted)

### 📦 Appendix (someday / only on real demand)
Roles×actions permission matrix · API keys + programmatic access · enquiry routing / SLA / team assignment · seller auto-responder + AI knowledge base · webhooks · SSO · multi-tenancy.

## 3. "Can we build features like this?" — honest answer

**Yes — none of the valuable features are blocked by the framework.**

- **Patterns transfer, code doesn't.** DataTable contracts, PageHeader prop shapes, permission models, audit-diff timelines, CSV import flows, enquiry-thread models are framework-agnostic. We re-implement in React; we don't port `.vue` files.
- **Both use shadcn.** shadcn-vue is a deliberate port of shadcn/ui — component philosophy, CVA variants, and Tailwind classes are nearly identical, so most primitives have a 1:1 `npx shadcn add` React twin. We're installing the React twin of what whatscamp already has, not inventing a design system.
- **Mechanical conversions:** Vue `v-model`/`defineModel` → React controlled props; Pinia → TanStack Query/Zustand (net-new for us — we currently use raw fetch, so *decide* this, there are no stores to "convert"); router guards → Next middleware + layout; `<Transition>` → framer-motion; `useColorMode` → `next-themes`.
- **Not 1:1:** `EmptyState`/`StatCard`/`tag-badge` compose from primitives; Vue `toast` → React `sonner`; `pin-input` → `input-otp`.

**Effort realism (don't let "we have it in Vue" imply it's free):**
- Quick wins are genuinely weeks-scale (shadcn installs + thin wrappers on our warm tokens).
- The **enquiry inbox is a real feature build, not a port** — realtime needs a messaging data model, WS/SSE transport (Pusher/Ably or self-hosted), unread state, notification delivery, and spam/abuse moderation. **Start with the async v1** (S/M) to capture the lead value; budget realtime v2 as its own quarter.
- i18n is low-complexity but **broad-surface** (translate every string); commit early or defer — don't mid-rank.
- **Half of whatscamp is WhatsApp/telephony — don't scope from its view count.**

**Bottom line:** our warm editorial brand is an **asset worth keeping** — extend it into a real component layer (see [ENTERPRISE_REDESIGN.md](ENTERPRISE_REDESIGN.md)) rather than copying whatscamp's theme. Infra features (tables, dialogs, audit UI, analytics, CSV) are low-risk weeks-scale work. The biggest strategic win *and* biggest honest effort is the **on-platform enquiry inbox** — do it in two phases (async first, realtime later).
