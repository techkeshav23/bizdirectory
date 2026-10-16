# BizDirectory — Deploy Handoff (for the deploying agent/developer)

Everything needed to deploy BizDirectory to the client's Coolify server. Read top-to-bottom.

---

## 0. What this is
A B2B business directory (Next.js web + NestJS API + PostgreSQL + Redis), deployed as **one isolated Docker Compose stack** on a shared Coolify host.

- **Repo (public):** `https://github.com/techkeshav23/bizdirectory` · branch `main`
- **Compose file:** `docker-compose.coolify.yml` (repo root) — 4 services: `bizdir_db`, `bizdir_redis`, `bizdir_api`, `bizdir_web`
- Full reference: `DEPLOY_COOLIFY.md` in the repo.

## 1. Server access
- **Coolify dashboard:** `http://34.100.161.214:8000`
- Deploy **only** through Coolify (dashboard or API). **No SSH** to this host.

## 🚫 HARD RULES — do not break
- **Never touch** other apps on this host: `whatscamp_app`, `whatscamp_db`, `whatscamp_redis`, `store_postgres`, and CodeBlimp app `njrp1ianb3fenae70r0p4ela` (app.codeblimp.com). No redeploy/stop/env-change/delete on them.
- **Do not use `ssh m4u`** — third-party machine, not a deploy target.
- Do **not** bind host ports 80/443/8000 (Coolify proxy owns them). Our stack binds no host ports.
- This stack is fully isolated (own `bizdir_*` names, volume, network) — it cannot affect the apps above.

---

## 2. Deploy steps (Coolify dashboard)

**A. Create the resource — use the RIGHT entry point**
1. Coolify → Project `bizdirectory` → `production` → **+ New Resource → Public Repository** *(NOT "Docker Compose" directly — that only pastes YAML with no source to build from).*
2. Repository URL: `https://github.com/techkeshav23/bizdirectory` · Branch: `main`
3. **Build pack: Docker Compose** *(change from the default "Railpack").*
4. **Docker Compose Location:** `/docker-compose.coolify.yml` · Base directory: `/`
5. Create → confirm it loads 4 services (Api/Web/Db/Redis).

**B. Environment variables** (left sidebar → Environment Variables → paste all)
```
NEXT_PUBLIC_SITE_URL=<the bizdir_web domain from step C>
NEXT_PUBLIC_WA_COUNTRY_CODE=91
NEXT_PUBLIC_IMAGE_HOST=picsum.photos
POSTGRES_PASSWORD=<secret — ask Keshav privately>
JWT_ACCESS_SECRET=<secret — ask Keshav, or generate: openssl rand -base64 48>
JWT_REFRESH_SECRET=<secret — ask Keshav, or generate: openssl rand -base64 48>
REVALIDATE_SECRET=<secret — ask Keshav, or generate: openssl rand -base64 32>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<set a strong password>
SMS_PROVIDER=console
GSTIN_PROVIDER=mock
PAYMENTS_PROVIDER=mock
```
> ⚠️ **Secrets are NOT in this repo (it's public).** Real values are shared privately by Keshav (keshav@codeblimp.com / +91 9286374180), or generate fresh ones with the `openssl` commands shown. Mark each var **Build time + Runtime**.

**C. Domain** — must be on `bizdir_web`, not api
1. Domains (or the `bizdir_web` resource) → **Generate Domain** (sslip.io, port **3000**).
2. Copy the URL → set `NEXT_PUBLIC_SITE_URL` to it (step B) → Save.
3. If a domain got attached to `bizdir_api`, delete it — the API stays internal.

**D. Deploy** — top-right **Deploy** → watch **Deployment Logs** (first build ~5–9 min; two images build).

**E. Seed data (one-time, after a green deploy)**
`bizdir_api` resource → Terminal → `pnpm exec prisma db seed`
(Seeds categories, cities, plans, admin user, and 12 demo businesses. The API also runs `prisma migrate deploy` automatically on boot.)

**F. Verify** — open the `bizdir_web` domain. Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Dev OTP prints in `bizdir_api` logs (`SMS_PROVIDER=console`).

---

## 3. ⚠️ Known blocker from the last attempt + fix

Last deploy: **build succeeded**, but startup failed with:
> `dependency failed to start: container bizdir_db is unhealthy`

**Diagnosis:** Postgres (`bizdir_db`) exited on startup. The near-instant failure points to Postgres refusing to initialise — almost always an **empty `POSTGRES_PASSWORD`** reaching the container.

**Fix checklist (in order):**
1. **Confirm `POSTGRES_PASSWORD` is set** in Environment Variables with the value above and **Runtime = yes**. Then **Redeploy** (not just restart) so Coolify rewrites the env file.
2. Open **`bizdir_db` → Logs**. If you see *"Database is uninitialized and superuser password is not specified"* → it's the password env not reaching the container; re-add it and redeploy.
3. The compose healthchecks now include a `start_period` (DB 40s) so Postgres isn't marked unhealthy during first-boot initdb — pull latest `main` so this is included.
4. If the `bizdir_pgdata` volume was created half-initialised on a failed run, delete that volume (Storage/Danger Zone — **only the `bizdir_pgdata` volume**, nothing else) and redeploy clean.

---

## 4. After code changes
`git push origin main` → Coolify **Redeploy**. Coolify pulls `main` and rebuilds.

## 5. Recurring costs (client's own accounts)
Hosting/server, domain, object storage, SMS/OTP (MSG91 + DLT), GSTIN API, Razorpay — all billed to the client, not the developer.

## 6. Troubleshooting quick table
| Symptom | Fix |
|---|---|
| Build "repository not found" | Repo is public — re-check URL/branch; no GitHub connect needed |
| `bizdir_db is unhealthy` | §3 above (POSTGRES_PASSWORD + redeploy + check db logs) |
| 502 after deploy | Domain must point to `bizdir_web` port **3000** |
| Site loads but no data | Run the seed (step E); check `bizdir_api` logs for migrate errors |
| OTP not received | Dev mode prints OTP in `bizdir_api` logs; set `SMS_PROVIDER=msg91` for real SMS |
