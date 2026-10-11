# Deploying BizDirectory to Coolify

Complete, self-contained deploy reference for the Coolify server at
`http://34.100.161.214:8000`. Keep this for every future deploy.

---

## ⛔ Server rules (read first)
- Deploy **only** through Coolify (dashboard or API). **There is NO SSH** to this host —
  do not try `ssh` / `scp` / `docker` on it.
- **Never touch** the CodeBlimp app `njrp1ianb3fenae70r0p4ela` (app.codeblimp.com): no
  redeploy, no env change, no stop, no delete. Leave every other existing resource alone.
- **Do not bind host ports 80 / 443 / 8000** — Coolify's proxy owns them. Expose the app's
  internal port and give it a domain instead.
- Auth header for API: `Authorization: Bearer <COOLIFY_TOKEN>`. **Never commit the token**
  or write it into a repo file. Rotate it after use (Coolify → Settings → API Tokens).
- `docker-compose.ip.yml` in this repo is the host-port variant — it does **NOT** apply to
  this SSH-less Coolify host. Use `docker-compose.coolify.yml`.

## What gets deployed (fully isolated)
A Docker Compose stack of 4 services — all prefixed `bizdir_`, with their own volume
(`bizdir_pgdata`) and network (`bizdir_net`), binding **no host ports**:
- `bizdir_db` (PostgreSQL 16) · `bizdir_redis` (Redis 7)
- `bizdir_api` (NestJS, runs `prisma migrate deploy` on boot) · `bizdir_web` (Next.js)

Nothing here collides with existing apps.

---

## Prerequisites
- Code pushed to a **public** Git repo (current: `https://github.com/techkeshav23/bizdirectory`, branch `main`).
- Strong random values ready for every secret. Generate with:
  ```bash
  openssl rand -base64 48   # for each JWT / revalidate secret
  openssl rand -base64 24   # for the DB password
  ```

---

## OPTION A — Dashboard (recommended)

**1. Project**
`http://34.100.161.214:8000` → **Projects → + Add** → name it (e.g. `bizdirectory`).

**2. Resource**
Open its **production** environment → **+ New Resource → Docker Compose**.
- Source: **Public Repository** → `https://github.com/<owner>/<repo>`
- Branch: `main`
- **Compose file path:** `docker-compose.coolify.yml`

**3. Environment Variables** (paste, with your real values)
```
NEXT_PUBLIC_SITE_URL=<set in step 4>
NEXT_PUBLIC_WA_COUNTRY_CODE=91
NEXT_PUBLIC_IMAGE_HOST=picsum.photos
POSTGRES_PASSWORD=<strong-random>
JWT_ACCESS_SECRET=<32+ char random>
JWT_REFRESH_SECRET=<32+ char random>
REVALIDATE_SECRET=<random>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-random>
SMS_PROVIDER=console
GSTIN_PROVIDER=mock
PAYMENTS_PROVIDER=mock
```

**4. Domain (no purchase needed)**
`bizdir_web` service → **Domains → Generate Domain** → Coolify issues a free IP-based URL
like `http://<id>.34.100.161.214.sslip.io` (internal port **3000**). Copy it, set
`NEXT_PUBLIC_SITE_URL` to **exactly** that URL, and save.
(Real domain later: add a DNS A-record → `34.100.161.214` and put it here instead.)

**5. Deploy**
Hit **Deploy** → watch the **Logs / Deployments** tab (first build ≈ 2–4 min, two images).

**6. Seed data (one-time)**
After a successful deploy: `bizdir_api` service → **Terminal/Command** →
```bash
pnpm exec prisma db seed
```
Seeds categories, cities, plans, the admin user, and 12 demo businesses.

**7. Verify**
Open the generated URL. Login at `/login` (dev OTP prints in `bizdir_api` logs while
`SMS_PROVIDER=console`). Admin at `/admin` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## OPTION B — API (if you prefer curl)
```bash
TOKEN='<COOLIFY_TOKEN>'; API=http://34.100.161.214:8000/api/v1
# 1) uuids (create project first if needed: POST $API/projects {"name":"bizdirectory"})
curl.exe -s -H "Authorization: Bearer $TOKEN" $API/servers
curl.exe -s -H "Authorization: Bearer $TOKEN" $API/projects
# 2) create the compose app from the repo (see Coolify docs for the compose endpoint/payload)
# 3) add env vars (one per call): POST $API/applications/<APP>/envs  {"key":"X","value":"Y"}
# 4) deploy + poll
curl.exe -s -X POST -H "Authorization: Bearer $TOKEN" "$API/deploy?uuid=<APP>&force=false"
curl.exe -s -H "Authorization: Bearer $TOKEN" $API/deployments/<DEPLOYMENT_UUID>
```
Windows/PowerShell: use `curl.exe` (not `curl`), and send JSON via `--data @file.json`.

---

## Redeploy after code changes
```bash
git add -A && git commit -m "..." && git push origin main
```
Then in Coolify hit **Redeploy** (or re-run the API deploy). Coolify pulls `main` and rebuilds.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `401` on API | Token wrong/rotated — get a fresh one. |
| `403` creating app | Token is deploy-only — create the app from the dashboard. |
| `404` on `/deploy` | Wrong uuid — use the **APP** uuid, not the project uuid. |
| Build log: "repository not found" | Repo is private — add a GitHub App / Deploy Key, or make it public. |
| `502 Bad Gateway` after deploy | Wrong exposed port — set `bizdir_web` port to **3000**. |
| SSL/domain not working | DNS not propagated, or Cloudflare proxy on — set DNS-only first. |
| Build out of memory | Next build is heavy — give the server more RAM or build during low load. |

## Going-live checklist
- [ ] Rotate the shared Coolify admin token
- [ ] `SMS_PROVIDER=msg91` (+ MSG91 keys) for real OTP
- [ ] `GSTIN_PROVIDER=surepass` (+ keys) for real GSTIN checks
- [ ] `PAYMENTS_PROVIDER=razorpay` (+ keys) for real payments
- [ ] Change `ADMIN_PASSWORD` from the seed default
- [ ] Wire object storage (R2) for real image uploads
- [ ] Point a real domain (optional) instead of the sslip.io URL
