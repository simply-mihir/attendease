# AttendEase — Smart Attendance Tracker

A production-ready, full-stack attendance tracking app for students with glassmorphic UI, WhatsApp reminders, push notifications, Google/GitHub OAuth, and real-time analytics.

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, and OAuth credentials

# 3. Generate Prisma client + push schema to database
npx prisma generate
npx prisma db push

# 4. Seed demo data
npx tsx prisma/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — demo login: **demo@attendease.app** / **password123**

## Production Deployment (Vercel)

### 1. Database — Neon PostgreSQL (free)

1. Create account at [neon.tech](https://neon.tech)
2. Create a project → copy the connection string
3. Set `DATABASE_URL` in Vercel environment variables

### 2. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 3. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New
2. Set callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
3. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### 4. Twilio WhatsApp

1. Create account at [twilio.com](https://twilio.com)
2. Set up WhatsApp sandbox (Messaging → Try it out → Send a WhatsApp message)
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
4. For production: apply for Twilio WhatsApp Business number

### 5. Push Notifications

```bash
npx web-push generate-vapid-keys
```

Set both `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL`, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same as VAPID_PUBLIC_KEY)

### 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in Vercel dashboard. The `vercel.json` configures cron jobs for:
- Pre-class reminders (every 5 min)
- Daily morning brief (6-10 AM, Mon-Sat)
- Weekly report (Sunday 10 AM)

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char string |
| `NEXTAUTH_URL` | Your app URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same as VAPID_PUBLIC_KEY |
| `CRON_SECRET` | Secret for cron job auth |

## Features

- **Dashboard** — Today's classes with quick mark, stats cards, danger alerts
- **Subject Management** — Color-coded subjects, schedules, archive/restore
- **Attendance Tracking** — Present/absent/late, bulk marking, audit log
- **Bunk Calculator** — How many classes you can skip or need to recover
- **Analytics** — Recharts bar/pie charts, GitHub-style heatmap
- **What-If Simulator** — See impact of skipping/attending classes
- **Calendar** — Week and month views with status dots
- **WhatsApp Reminders** — Pre-class, danger alerts, daily brief, weekly report
- **Push Notifications** — Browser push via Web Push API
- **Alarm System** — Sound alerts with configurable timing
- **Google/GitHub OAuth** — One-click social login
- **Semester Management** — Multiple semesters with switch
- **CSV Export** — Download attendance records
- **Streaks & Achievements** — Gamification badges
- **PWA** — Installable, works offline
- **Glassmorphic UI** — Dark theme with frosted glass, vibrant gradients

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (Google, GitHub, Credentials) |
| Styling | Tailwind CSS v4, Glassmorphic design |
| Charts | Recharts |
| WhatsApp | Twilio API |
| Push | Web Push (VAPID) |
| Deployment | Vercel (with Cron Jobs) |
| PWA | Service Worker + Web App Manifest |

## License

MIT
