# Decor Joy Gurgaon — Operational Runbook

> **Last updated:** 2026-09-30 · Maintainer: Tech Lead / Owner

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Deploying to Staging](#2-deploying-to-staging)
3. [Deploying to Production](#3-deploying-to-production)
4. [Rolling Back a Deploy](#4-rolling-back-a-deploy)
5. [Rotating Secrets](#5-rotating-secrets)
6. [Database Backup & Restore Drill](#6-database-backup--restore-drill)
7. [Database Migrations](#7-database-migrations)
8. [Graceful Degradation Switches](#8-graceful-degradation-switches)
9. [Uptime Monitoring Setup](#9-uptime-monitoring-setup)
10. [Incident Response Checklist](#10-incident-response-checklist)
11. [Who to Call](#11-who-to-call)

---

## 1. Architecture Overview

```
Cloudflare CDN → Cloudflare Pages (React SPA)
                       ↓ API calls
Cloudflare → Node.js / Express (PM2 cluster, 2 workers)
                       ↓
              MongoDB Atlas (M10, auto-scaling)
              Redis (Upstash or self-hosted)
              BullMQ worker (separate PM2 process)
```

Key facts:
- **Money stored in paise (integer).** Rs.1 = 100 paise. Never floats.
- **IST (UTC+05:30)** for all date display. UTC in DB.
- **Server is source of truth.** Never trust client totals.

---

## 2. Deploying to Staging

Staging auto-deploys on every push to the `staging` branch via GitHub Actions.

```bash
# Merge feature branch to staging
git checkout staging
git merge feature/my-feature
git push origin staging
```

**GitHub Actions does:**
1. oxlint + npm audit --audit-level=high
2. Unit tests
3. npm run migrate:up on staging DB
4. PM2 rolling reload of staging server
5. 60-second health-check gate on /readyz
6. Client build + upload source maps to Sentry
7. Deploy to Cloudflare Pages (staging project)

**Check status:** https://github.com/your-org/decorjoy/actions

---

## 3. Deploying to Production

Production deploys are **manual** (workflow_dispatch) and require **owner approval**.

```
GitHub -> Actions -> "Deploy — Production" -> Run workflow
  inputs:
      sha: (leave blank for latest main, or paste specific SHA)
      reason: "Adds gallery manager and WhatsApp notifications"
```

**Sequence:**
1. Owner approves the GitHub environment gate
2. migrate:up runs on production DB (backward-compatible expand migrations)
3. PM2 rolling reload (zero-downtime): old workers stay alive until /readyz passes
4. Client built and deployed to Cloudflare Pages (production project)
5. Sentry release tagged and source maps uploaded

**Verify after deploy:**
```bash
curl https://api.decorjoygurgaon.com/readyz
# Expected:
# {"status":"ready","mongo":"connected","redis":"connected","uptime":42}
```

---

## 4. Rolling Back a Deploy

### Option A — One-command rollback (fastest)

SSH into the server and run:
```bash
cd /opt/decorjoy/server
git log --oneline -5         # Find the previous good SHA
git reset --hard <PREV_SHA>
npm ci --omit=dev
pm2 reload decorjoy-prod --update-env
curl http://localhost:5000/readyz
```

### Option B — GitHub Actions rollback

```
Actions -> "Deploy — Production" -> Run workflow
  sha: <PREV_SHA>
  reason: "Rollback to SHA abc1234 due to <issue>"
```

### Rollback DB Migration

```bash
cd /opt/decorjoy/server
npm run migrate:down          # Rolls back the last applied migration
```

> WARNING: Always run migrate:down BEFORE rolling back the application code
> if the migration removed fields that old code depends on.

---

## 5. Rotating Secrets

### JWT Secrets (causes all active sessions to expire)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in hosting env vars:
# JWT_ACCESS_SECRET=<new>
# JWT_REFRESH_SECRET=<new>

pm2 reload decorjoy-prod --update-env
```

### WhatsApp Access Token

```bash
# Meta Developer Portal -> App -> WhatsApp -> Accounts -> System Users
# Set WHATSAPP_ACCESS_TOKEN env var on server
pm2 reload decorjoy-prod --update-env
```

### MongoDB Atlas Password

1. Atlas -> Database Access -> Edit user -> Auto-generate password
2. Update MONGO_URI connection string in server env
3. pm2 reload decorjoy-prod --update-env
4. Verify: curl https://api.decorjoygurgaon.com/readyz

---

## 6. Database Backup & Restore Drill

### Atlas Continuous Backup (recommended)

Enable in: Atlas -> Cluster -> Backup -> Enable Continuous Cloud Backup
- Restore point: Any point in time within the last 7 days (M10+)
- Daily snapshots retained 7 days by default

### Manual Backup (on-demand)

```bash
mongodump \
  --uri="$MONGO_URI" \
  --db=decorjoy \
  --out=./backup-$(date +%Y%m%d-%H%M%S)

tar -czf backup-$(date +%Y%m%d).tar.gz ./backup-*/
```

### Restore Drill — Tested 2026-09-30

**Results (scratch cluster decorjoy-restore-test, M0 free tier):**
- Data size: ~12 MB (catalog + orders + submissions)
- mongorestore duration: **47 seconds**
- Verified: product counts matched, Settings document intact, order history correct
- Migrations ran cleanly on restored data: **8 seconds**

**Procedure:**

```bash
# Step 1: Create a scratch Atlas cluster (M0 is fine for drill)
# Atlas UI -> Create Cluster -> decorjoy-restore-test

# Step 2: Restore from snapshot
# Atlas -> Backup -> Restore -> Point-in-Time / Snapshot
# Target: decorjoy-restore-test

# Step 3: Verify (connect to scratch cluster):
mongosh "$SCRATCH_MONGO_URI" --eval "
  db = db.getSiblingDB('decorjoy');
  print('Products:', db.products.countDocuments());
  print('Submissions:', db.submissions.countDocuments());
  print('Settings:', db.settings.countDocuments());
"

# Step 4: Run migrations on scratch to verify forward compatibility:
MONGO_URI=$SCRATCH_MONGO_URI npm run migrate:up

# Step 5: Delete scratch cluster when satisfied
```

Run the restore drill at least **quarterly**. Update timings above after each drill.

---

## 7. Database Migrations

Uses `migrate-mongo` with **expand/contract** pattern:
- **Expand**: Add new fields/indexes (backward compatible)
- **Deploy** new code
- **Contract**: Remove old fields (only after all instances run new code)

```bash
cd server

npm run migrate:status   # Check which migrations are applied
npm run migrate:up       # Apply all pending migrations
npm run migrate:down     # Roll back the last migration
npm run migrate:create -- add_field_to_collection
```

Every PR that adds/removes MongoDB fields must include a migration.

---

## 8. Graceful Degradation Switches

Toggle from **Admin -> Settings -> Operational Switches** — no deploy needed. Takes effect within 60 seconds.

| Switch | Effect |
|--------|--------|
| Bookings Paused ON | Shows "temporarily paused" banner. WhatsApp link remains active for manual enquiries. |
| Maintenance Banner | Sticky amber bar on storefront. Leave blank to hide. |

**Automatic degradation (no action needed):**
- Redis down → Cache bypassed. Requests hit MongoDB directly. No user impact.
- MongoDB election → Retry with exponential backoff; returns 503 Retry-After: 10 if exhausted.

---

## 9. Uptime Monitoring Setup

### Better Stack / UptimeRobot — Three Monitors

| Monitor | URL | Type | Alert threshold |
|---------|-----|------|----------------|
| Homepage | https://decorjoygurgaon.com/ | HTTP | 2 failures in 2 min |
| API Readyz | https://api.decorjoygurgaon.com/readyz | HTTP (expect 200) | 1 failure |
| Synthetic shop | https://decorjoygurgaon.com/shop | Keyword (expect "Decor Joy") | 2 failures |

Alert channels: Owner phone (SMS + call) + decorjoygurgaon@gmail.com

### Better Stack setup

1. Sign up at https://betterstack.com/uptime
2. Add monitors above
3. Under On-call -> create escalation: SMS -> Email -> Call
4. Connect Slack/WhatsApp webhook if available

---

## 10. Incident Response Checklist

### P1 — Site completely down

- [ ] Check UptimeRobot / Better Stack alert details
- [ ] curl https://api.decorjoygurgaon.com/readyz — what does it say?
- [ ] SSH into server: pm2 list — is the process running?
- [ ] Check Mongo status in /readyz output
- [ ] Check Sentry for recent errors
- [ ] Rollback if recent deploy caused it (see section 4)

### P2 — Enquiry submissions not arriving

- [ ] POST /api/forms/:key/submissions — check server logs in Sentry
- [ ] Verify MongoDB is connected via /readyz
- [ ] Check WhatsApp notification logs (WHATSAPP_ACCESS_TOKEN configured?)

### P3 — Enquiry surge / capacity issue

- [ ] Admin → Settings → Check "Pause New Enquiries" → set banner message
- [ ] Process existing leads manually via WhatsApp
- [ ] Re-open once caught up

---

## 11. Who to Call

| Role | Contact |
|------|---------|
| Owner / Business (Tushar) | WhatsApp: +91-70157-67715 |
| Razorpay Support | +91-22-7100-7100 (24x7) |
| MongoDB Atlas Support | https://support.mongodb.com |
| Cloudflare Support | https://dash.cloudflare.com/support |
