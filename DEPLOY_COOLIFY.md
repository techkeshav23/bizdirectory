# Deploying BizDirectory to Coolify (safely, on a shared VM)

This VM already hosts **live production apps**. This guide deploys BizDirectory as a
**completely isolated** new application so those apps are never touched.

## 🚫 Never touch these (existing live resources)
- Apps/containers: `whatscamp_app`, `whatscamp_db`, `whatscamp_redis`, `store_postgres`
- CodeBlimp app UUID: `njrp1ianb3fenae70r0p4ela` (https://app.codeblimp.com)

BizDirectory creates **its own** `bizdir_db`, `bizdir_redis`, `bizdir_api`, `bizdir_web`,
its own volume (`bizdir_pgdata`) and its own network (`bizdir_net`). It binds **no host
ports** (Coolify's proxy handles the domain), so there is zero port collision risk.

> **This host has NO SSH.** Deploy ONLY through the Coolify dashboard/API at
> `http://34.100.161.214:8000`. Do not try ssh/scp/docker on the host.
> `docker-compose.ip.yml` (host-port variant) does NOT apply here — ignore it.
> Never touch CodeBlimp (`njrp1ianb3fenae70r0p4ela`). Don't bind host ports 80/443/8000.

## 🔑 Before you start
1. **Rotate the admin API token** that was shared in chat: Coolify → Settings → API Tokens → delete it. Create a fresh one only if needed.
2. Prefer a **scoped token** or your own dashboard login over the full-access admin token.
3. Pick a **new subdomain** for this app (e.g. `bizdirectory.yourdomain.com`). Do **not** reuse `app.codeblimp.com`.

## 1. Push the code to a Git repo
Coolify deploys from Git. From the project root:
```bash
git add -A
git commit -m "BizDirectory: deployable"
git branch -M main
git remote add origin <your-new-empty-repo-url>
git push -u origin main
```
Use a **new** repo (public, or connect Coolify's GitHub app for a private one).

## 2. Create the app in Coolify
1. Coolify dashboard → your Project → **+ New Resource** → **Docker Compose** (from a Git repository).
2. Select your repo + `main` branch.
3. Set **Compose file path** to: `docker-compose.coolify.yml`
4. Coolify will detect the services (`bizdir_db`, `bizdir_redis`, `bizdir_api`, `bizdir_web`).

## 3. Set environment variables
In the resource's **Environment Variables**, add everything from
[.env.production.example](.env.production.example) with real values:
- `NEXT_PUBLIC_SITE_URL` = your new subdomain (https://…)
- `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REVALIDATE_SECRET` — strong random (`openssl rand -base64 48`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Providers stay `console` / `mock` until you wire MSG91 / Surepass / Razorpay.

## 4. Domain (no domain purchase needed)
On the **`bizdir_web`** service → Domains → **Generate Domain**. Coolify creates a free
IP-based URL like `http://<random>.34.100.161.214.sslip.io` (port **3000**). Use that.
Then set `NEXT_PUBLIC_SITE_URL` (Step 3) to **exactly** that URL and redeploy once.
(Prefer a real domain later? Add a DNS A-record → `34.100.161.214` and set it here.)

## 5. Deploy
Hit **Deploy**. Coolify builds both images and starts the stack. On first boot the API
container runs `prisma migrate deploy` automatically (creates tables).

## 6. Seed base + demo data (one-time)
After the first successful deploy, open a terminal into the **bizdir_api** container
(Coolify → the service → Terminal) and run:
```bash
pnpm exec prisma db seed
```
This seeds categories, cities, plans, the admin user, and 12 demo businesses.

## 7. Verify
- `https://<your-subdomain>/` — homepage with demo businesses
- `https://<your-subdomain>/api/health` is internal only; check via the web app instead
- Log in at `/login` (OTP prints in the `bizdir_api` logs while `SMS_PROVIDER=console`)
- Admin at `/admin` using `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Going live checklist
- [ ] Rotate the shared admin token
- [ ] Set `SMS_PROVIDER=msg91` (+ MSG91 keys) for real OTP
- [ ] Set `GSTIN_PROVIDER=surepass` (+ keys) for real GSTIN checks
- [ ] Set `PAYMENTS_PROVIDER=razorpay` (+ keys) for real payments
- [ ] Change `ADMIN_PASSWORD` from the seed default
- [ ] Configure object storage (R2) for real image uploads

## Rollback
Coolify keeps previous deployments — use **Redeploy** of a prior commit if needed.
BizDirectory is isolated, so a rollback here cannot affect the other apps.
