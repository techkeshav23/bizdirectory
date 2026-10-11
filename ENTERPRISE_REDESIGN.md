# BizDirectory — Enterprise Redesign Plan

Learnings from **whatscamp** (a Vue 3 enterprise WhatsApp SaaS), applied to our
**Next.js App Router + Tailwind v4 + React** directory. Produced by a multi-agent
analysis of whatscamp's design system + our current app, then adversarially reviewed.

## Core thesis
whatscamp's polish comes from **rigor, not its palette**. We adopt the rigor
(HSL token system, shadcn/ui, dark mode, a real dashboard shell, DataTable, CRUD
dialogs) but **keep our warm editorial identity** (paper/ink/marigold + Fraunces).
A true-black Linear/Vercel look would erase our differentiation. So: **warm
editorial marketing + rigorous dashboards, one shared token system.**

> Note: whatscamp's "violet" accent is defined but never wired — its real accent is
> emerald. "Adopt whatscamp" = adopt *one saturated accent on a restrained neutral
> scale, as HSL with a light/dark pair* — which our marigold already is.

---

## 1. Design tokens (Tailwind v4, shadcn-v4 convention)

**Corrected approach** (the review caught a real bug): do NOT store bare HSL triplets
and re-wrap them in `hsl()` inside `@theme inline` — that's the fragile v3 pattern and
breaks `/alpha` + gradients on v4. Instead store **full color values** in `:root`/`.dark`
and pass them through in `@theme`.

```css
/* globals.css */
@import 'tailwindcss';
@custom-variant dark (&:is(.dark *));   /* standard v4 — not a :where() carry-over */

:root {
  /* Light = our warm paper/ink identity, as full hsl() colors */
  --background: hsl(40 50% 95%);
  --background-2: hsl(39 44% 90%);
  --foreground: hsl(40 19% 10%);
  --card: hsl(40 56% 97%);
  --card-foreground: hsl(40 19% 10%);
  --popover: hsl(40 56% 98%);
  --popover-foreground: hsl(40 19% 10%);
  --primary: hsl(24 88% 44%);           /* marigold #d1570e */
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(39 44% 90%);
  --secondary-foreground: hsl(40 19% 10%);
  --muted: hsl(39 40% 92%);
  --muted-foreground: hsl(35 14% 38%);  /* darkened for AA contrast (review #14) */
  --accent: hsl(39 44% 90%);
  --accent-foreground: hsl(40 19% 10%);
  --forest: hsl(168 52% 17%);
  --success: hsl(160 80% 27%);
  --warning: hsl(38 92% 45%);
  --destructive: hsl(0 72% 46%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(39 41% 84%);
  --input: hsl(39 41% 84%);
  --ring: hsl(24 88% 44%);
  --radius: 0.75rem;
  --glass-bg: hsl(40 19% 10% / 0.02);
  --glass-border: hsl(40 19% 10% / 0.06);
}

.dark {
  /* WARM espresso dark — never true black; marigold stays the accent */
  --background: hsl(36 16% 7%);
  --background-2: hsl(36 14% 10%);
  --foreground: hsl(40 40% 94%);
  --card: hsl(36 15% 9%);
  --card-foreground: hsl(40 40% 94%);
  --popover: hsl(36 15% 11%);
  --popover-foreground: hsl(40 40% 94%);
  --primary: hsl(24 90% 52%);
  --primary-foreground: hsl(36 16% 7%);
  --secondary: hsl(36 12% 13%);
  --secondary-foreground: hsl(40 30% 88%);
  --muted: hsl(36 12% 14%);
  --muted-foreground: hsl(38 10% 62%);
  --accent: hsl(36 12% 14%);
  --accent-foreground: hsl(40 40% 94%);
  --forest: hsl(168 36% 30%);
  --success: hsl(158 64% 45%);
  --warning: hsl(38 92% 56%);
  --destructive: hsl(0 62% 52%);
  --border: hsl(36 10% 17%);
  --input: hsl(36 10% 17%);
  --ring: hsl(24 90% 52%);
  --glass-bg: hsl(0 0% 100% / 0.03);
  --glass-border: hsl(0 0% 100% / 0.07);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-forest: var(--forest);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

- **Default is LIGHT** (opposite of whatscamp's dark-first) — our public/SEO first paint must be the warm brand.
- **Keep legacy named tokens** (`--color-brand-500`, `--color-ink`, `--color-paper`, `--color-line`, `--color-forest`) during migration so existing marketing markup keeps working. Migration risk: anything still on `bg-paper` is a hard light patch if dark extends to marketing — migrate page-by-page.
- **Dark-mode seams to fix** (review #8): `::selection`, the body radial gradient, and `.grain` are baked light — add dark variants.
- **Acceptance test for this phase:** a throwaway component using `bg-background`, `bg-primary/50`, `bg-card/80 backdrop-blur`, toggled under `.dark` — prove `/alpha` + glass render before building on it.

---

## 2. shadcn/ui (React) — the component layer we lack
We have exactly **one** primitive (`Button`); everything else is inline. shadcn/ui is
copy-in React source that reads the CSS vars above → inherits our warm palette for free.

`npx shadcn@latest init` (style `new-york`, CSS variables yes, `@/lib/utils` cn exists), then add **only what Phases 2–4 consume**:
```
npx shadcn@latest add table dialog alert-dialog dropdown-menu select tabs sonner \
  badge card input textarea label form avatar skeleton sheet command popover \
  separator tooltip scroll-area pagination breadcrumb
```
Add the rest on demand (copy-in = zero cost to defer). **Compose ourselves** (no React
registry equiv): `EmptyState`, `ErrorState`, `StatCard`, `tag-badge`.

---

## 3. Dark mode — `next-themes`
`<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>`
in root layout; `<html suppressHydrationWarning>`. Handles FOUC. A 3-way `ThemeToggle`
(Sun/Moon/Monitor) in the dashboard user menu. Use Tailwind v4's standard `.dark` variant
(do NOT hand-roll a `:where()` variant — review #6).

---

## 4. App shell — real dashboard console for `(dash)`
`app/(dash)/layout.tsx`: collapsible **Sidebar** (persist collapse to localStorage) +
slim **Topbar** (⌘K trigger, ThemeToggle, UserMenu) + scrollable `<main>` + mounted
**CommandPalette** (cmdk) + sonner `<Toaster>` + skip link.

- **Data-driven nav** (`components/dash/navigation.ts`) with role gating. Sections:
  Overview · My Business (Listings, Leads, Reviews, Analytics) · Account (Billing, Settings) · Admin (role-gated: Moderation, Businesses, Categories, Users, Audit).
- Active state via `usePathname()` + marigold left-indicator bar.
- **⚠️ Prerequisite (review #3, #17):** there is currently **no client-readable session/role** — `middleware.ts` only checks cookie presence and admin is inferred from a caught error. Before the sidebar can role-filter, add a **`/me` fetch in a server layout** (or decode the JWT) exposing `{ userId, role, isAdmin }`. **This is Phase 0 work**, not assumed.

---

## 5. Shared primitives (`components/shared/`) — the consistency multiplier
Port whatscamp's `shared/*` **prop shapes and states, never its Vue reactivity** (no
`defineModel`/`v-model`/`emit` — React controlled `value`/`onChange` only; review #1):

1. **PageHeader** — title + gradient icon tile + breadcrumbs/description + actions slot. *Build first.*
2. **DataTable&lt;T&gt;** — shadcn `table` + **TanStack Table**; baked-in **skeleton / EmptyState / data** states, header-click sort, client+server pagination, responsive column hiding. Pair with **PaginationControls** + **SearchInput**. *The centerpiece.*
3. **CrudFormDialog** — one modal for create+edit (`isEditing` flips title/label, `isSubmitting` spinner).
4. **ConfirmDialog / DeleteConfirmDialog** — on `alert-dialog`; destructive variant auto-builds the "delete X, cannot be undone" copy.
5. **EmptyState / ErrorState** — designed, with CTA / Retry.
6. **Toasts** — sonner; replace every inline success/error string.
7. **Skeletons** — `CardSkeleton`, `TableSkeleton`, `StatSkeleton`, `ListingGridSkeleton`; wire into per-route `loading.tsx`.
8. **StatCard** — dedupes the `Stat` copy-pasted in manage & admin. **Do NOT hard-require `trend`/`sparkline`** — no time-series endpoint exists yet (review #2).

**Dedup wins:** single StatCard, single WhatsApp button (kill `ContactButtons` vs `Button.whatsapp` divergence), single input focus-ring/error treatment.

---

## 6. Page-by-page direction
**Marketing — keep the editorial look, only upgrade primitives (zero hero regression):**
- `/` — leave hero/category/CTA; category cards → `Card` (keep grain/lift/numbers), chips → `Badge`.
- `/search` — add filter rail (`select`/`slider`/`switch`) → mobile `sheet`; grid + `ListingGridSkeleton` + `EmptyState`.
- `/business/[slug]` — `tabs` (About/Reviews/Hours/Products); `avatar`/`aspect-ratio` via **`next/image`** (kill raw `<img>`); reviews → `form` + sonner.
- category/location/product — same filterable grid + breadcrumb + skeletons.
- `/pricing` — `Card` tiers (featured = marigold ring + "Popular" badge) + `accordion` FAQ.
- auth — centered `Card` + `form` + zod + sonner + `input-otp` (only if OTP verify UI confirmed).

**Dashboards — where "enterprise" is won:**
- `/manage` (owner listings) → **DataTable** (Business/Category/Status/Views/Leads/Updated + row `dropdown-menu`) + SearchInput + PaginationControls + PageHeader("Add listing" → CrudFormDialog) + TableSkeleton + EmptyState.
- `/manage/[id]` → DetailPageLayout: `tabs` (Details/Media/Hours/Products/SEO) each a `form`; sidebar MetadataPanel + publish Card + DeleteConfirmDialog + UnsavedChangesDialog + sonner.
- `/admin` (moderation) → **showcase**: DataTable + status `tabs` + bulk approve/reject + ConfirmDialog + optimistic update + sonner. (Replace the silent mutate-then-reload.)
- `/dashboard` → **this is the CUSTOMER "Saved businesses" page** (review #2) — redesign as a saved-grid, NOT owner analytics. Owner analytics lives under `/manage/analytics` (needs a time-series endpoint first).
- Fix the **"error == not authorized" anti-pattern** (review #16) once `/me` exists: gate on real role, show ErrorState for real failures.
- Replace off-palette `slate-*`/`bg-white` leaks in admin/dashboard (review #21); add a lint/grep guard against them in new code.

---

## 7. SEO + a11y workstream — PULLED FORWARD (review #13, #14, #20)
We are an SEO-first directory — ~all traffic/revenue intent is on public pages. So this is **Phase 1–2, not cleanup**:
- `next/image` for all logos/photos (LCP), per-entity **JSON-LD** (`LocalBusiness`, `BreadcrumbList`, `AggregateRating`, `Product`) verified in Rich Results.
- Per-route `loading.tsx` (skeleton) + `error.tsx` (ErrorState) — App Router gives these nearly free.
- a11y baseline: Radix dialogs give focus-trap/restore (free), verify dark focus-ring contrast, `prefers-reduced-motion` for `animate-rise`/transitions, AA contrast on muted-foreground (bumped above).

---

## 8. Phased sequence (max impact, least risk)
- **Phase 0 — Foundations (½–1 day):** token rewrite (§1) + `@theme` validation test; **add `/me` session+role server layout** (unblocks the shell). No visual change.
- **Phase 1 — shadcn init + Button (1 day):** add priority set; replace `Button` **preserving `href`→`<Link>` and the pill `rounded-full` as a variant** (review #19 — not a drop-in). Pull `next/image`+JSON-LD for public routes forward.
- **Phase 2 — Shell + dark mode (2–3 days): HIGHEST VISUAL IMPACT.** Sidebar+Topbar+⌘K+next-themes+Toaster. Reframes the whole product instantly.
- **Phase 3 — Shared primitives (2–3 days):** PageHeader, DataTable(+TanStack), Pagination, SearchInput, EmptyState/ErrorState, dialogs, skeletons, StatCard. Wire `loading.tsx`/`error.tsx` as they land.
- **Phase 4 — Rebuild dashboards (3–4 days):** `/admin` first (showcase), then `/manage` + `/manage/[id]`, then `/dashboard` + customer saved.
- **Phase 5 — Marketing primitive upgrade (2 days):** filter rails, tabs, forms, pricing — zero hero regression.
- **Phase 6 — Cleanup (1–2 days):** deprecate legacy tokens page-by-page, icon-system pass, page transitions, ImportExport CSV, audit timeline.

**Decide now:** adopt **TanStack Query** in Phase 3 (pairs with DataTable server pagination) or keep raw `clientApi` fetch — there are no Pinia stores to "convert"; this is net-new infra, so choose explicitly (review #4).

**Guardrails:** warm identity stays (marigold, paper/ink, Fraunces, grain); dark = warm espresso, never black; default light; hero untouchable; every list→DataTable, every form→CrudFormDialog, every destructive action→DeleteConfirmDialog, every async→sonner, every loading→skeleton, every empty/error→EmptyState/ErrorState.
