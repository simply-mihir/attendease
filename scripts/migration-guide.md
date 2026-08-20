# AttendEase: Complete Neon → Supabase Migration Guide

> **Goal:** Get your app back online with ALL history preserved, without ongoing costs.
>
> **Time required:** ~15 minutes
>
> **Prerequisites:** Terminal with `psql` and `pg_dump` installed
> - **Mac:** `brew install postgresql` (or `brew install libpq && brew link --force libpq`)
> - **Ubuntu/WSL:** `sudo apt install postgresql-client`

---

## PHASE 1 — Create Supabase Project (3 min)

### Step 1.1: Sign up
1. Go to **https://supabase.com/dashboard**
2. Sign in with GitHub (or email)

### Step 1.2: Create a new project
1. Click **"New Project"**
2. Fill in:
   - **Organization:** select your org (or create one)
   - **Project name:** `attendease`
   - **Database password:** click "Generate a password" → **copy and save this password somewhere safe** (you'll need it multiple times)
   - **Region:** pick the closest to your users (e.g. `South Asia (Mumbai)` for Indian users)
3. Click **"Create new project"**
4. Wait ~2 minutes for provisioning to complete

### Step 1.3: Get your connection strings
1. Once the project is ready, click **"Connect"** (top right of project dashboard)
2. You'll see connection strings. You need TWO:

**A) Session Pooler (for your app — port 5432):**
```
postgresql://postgres.XXXX:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```
→ Replace `[YOUR-PASSWORD]` with the password you saved above.
→ This is your new `DATABASE_URL` for Vercel.

**B) Direct connection (for migration/prisma push — port 5432):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.XXXX.supabase.co:5432/postgres
```
→ Also replace `[YOUR-PASSWORD]`.

> **Tip:** You can find these anytime in **Settings → Database → Connection string**

---

## PHASE 2 — Push Schema to Supabase (2 min)

Open your terminal in the `attendease` project folder and run:

```bash
# Set the Supabase direct connection URL
export DATABASE_URL="postgresql://postgres.XXXX:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Push schema (creates all tables, indexes, constraints)
npx prisma db push
```

You should see output like:
```
🚀  Your database is now in sync with your Prisma schema.
```

> **If you get an SSL error**, append `?sslmode=require` to the URL.

---

## PHASE 3 — Temporarily Upgrade Neon & Export Data (5 min)

### Step 3.1: Upgrade Neon to unblock compute
1. Go to **https://console.neon.tech**
2. Click on your organization name (top-left breadcrumb)
3. Click **"Billing"** in the left sidebar
4. Click **"Change plan"**
5. Select **"Launch"** plan → add your card → confirm
6. Your compute is now unblocked immediately

> **Cost:** Launch plan is pure pay-per-use ($0.106/CU-hour). A quick pg_dump takes seconds = fractions of a cent. You'll downgrade right after.

### Step 3.2: Get your Neon connection string
1. Go to your **attendease** project in Neon Console
2. Click **"Connect"** button on the dashboard
3. Make sure **"Pooled connection"** is **unchecked**
4. Copy the connection string. It looks like:
```
postgresql://neondb_owner:XXXXXXX@ep-xxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Step 3.3: Export all data from Neon
Run in your terminal:

```bash
# Set the Neon connection string
export OLD_DB_URL="postgresql://neondb_owner:XXXXXXX@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"

# Export everything (schema + data)
pg_dump "$OLD_DB_URL" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  > neon_full_dump.sql
```

Wait for it to complete. Check the file:
```bash
ls -lh neon_full_dump.sql
# Should be a few hundred KB to a few MB
```

> **If pg_dump hangs or times out:** Your Neon compute may need a moment to wake up. Wait 10 seconds and retry.

### Step 3.4: Import data into Supabase

```bash
# Set the Supabase connection URL (same one from Phase 2)
export NEW_DB_URL="postgresql://postgres.XXXX:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Import everything
psql -d "$NEW_DB_URL" -f neon_full_dump.sql
```

You'll see some notices/warnings — that's normal (things like `NOTICE: table "X" does not exist, skipping`). As long as there are no `ERROR` lines for your main tables, you're good.

### Step 3.5: Verify the data migrated

```bash
# Check key tables have data
psql -d "$NEW_DB_URL" -c 'SELECT COUNT(*) AS users FROM "User";'
psql -d "$NEW_DB_URL" -c 'SELECT COUNT(*) AS records FROM "AttendanceRecord";'
psql -d "$NEW_DB_URL" -c 'SELECT COUNT(*) AS subjects FROM "Subject";'
```

All counts should match what you had in production. If they show data, your history is safe.

---

## PHASE 4 — Update Vercel & Redeploy (2 min)

### Step 4.1: Update environment variable
1. Go to **https://vercel.com** → your `attendease` project
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL` → click the three dots → **Edit**
4. Replace the old Neon URL with your **Supabase Session Pooler URL:**
```
postgresql://postgres.XXXX:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```
5. Make sure it's set for **Production**, **Preview**, and **Development**
6. Click **Save**

### Step 4.2: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment → click **⋯** → **Redeploy**
3. Wait for deployment to complete (~1-2 min)

### Step 4.3: Test your app
1. Open your app URL
2. Log in and check:
   - Dashboard loads with your data
   - Subjects show correct attendance percentages
   - Analytics heatmap shows history
   - Calendar shows past attendance records

---

## PHASE 5 — Downgrade Neon & Clean Up (2 min)

### Step 5.1: Downgrade Neon to free
1. Go to **https://console.neon.tech**
2. Click your org name → **Billing**
3. Click **"Change plan"** → select **"Free"** → confirm
4. If prompted to remove resources exceeding free limits, proceed

### Step 5.2: (Optional) Delete the Neon project
Since your data is now in Supabase, you can delete the Neon project:
1. Go to your **attendease** project in Neon
2. **Settings** → **Delete project**
3. Confirm deletion

> **Important:** Only delete AFTER you've verified all data is in Supabase (Phase 4, Step 4.3)

### Step 5.3: Clean up local files
```bash
rm neon_full_dump.sql
```

---

## PHASE 6 — Prevent Supabase from Pausing (1 min)

Supabase free projects pause after **7 days of inactivity**. Your app already has a keep-alive endpoint that prevents this. Just make sure your external cron (cron-job.org or similar) is still hitting:

```
https://your-app.vercel.app/api/keep-alive?token=YOUR_TOKEN
```

This single ping keeps Supabase active. No changes needed if it's already set up.

---

## Quick Reference

| What | Value |
|------|-------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Neon Console | https://console.neon.tech |
| Vercel Dashboard | https://vercel.com/dashboard |
| App DATABASE_URL | Supabase Session Pooler URL (port 5432) |
| Prisma migrations | Use Supabase Direct URL |
| Keep-alive cron | Every 5 min to `/api/keep-alive` |

---

## Troubleshooting

**"password authentication failed"**
→ You forgot to replace `[YOUR-PASSWORD]` in the connection string.

**"relation does not exist" after import**
→ Run `npx prisma db push` again with the Supabase URL to recreate schema.

**psql import shows ERROR on some tables**
→ Run `npx prisma db push` BEFORE importing (Phase 2), so schema exists first. Then re-run the import with `--data-only` flag:
```bash
pg_dump "$OLD_DB_URL" --no-owner --no-privileges --data-only > neon_data_only.sql
psql -d "$NEW_DB_URL" -f neon_data_only.sql
```

**App shows empty dashboard after migration**
→ Check Vercel env vars are updated AND you redeployed. Old deployments still use old env vars.

**Supabase project paused**
→ Go to Supabase dashboard → click "Restore". Then ensure your keep-alive cron is running.

**pg_dump not found**
→ Install PostgreSQL client tools:
- Mac: `brew install libpq && brew link --force libpq`
- Ubuntu: `sudo apt-get install postgresql-client`
- Windows: Install from https://www.postgresql.org/download/windows/
