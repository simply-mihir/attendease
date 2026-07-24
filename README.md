# AttendEase — Smart Attendance Tracker

Track your class attendance, prevent shortages, get smart reminders, and never fall below the minimum threshold again.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create database & tables
npx prisma db push

# 4. Seed demo data
npx tsx prisma/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- **Email:** demo@attendease.app
- **Password:** password123

## Features

- **Dashboard** — Today's classes, quick mark buttons, overall stats, danger alerts
- **Subject Management** — Add subjects with schedules, color-coded cards, archive/restore
- **Attendance Tracking** — Mark present/absent/late, bulk marking, edit history with audit log
- **Bunk Calculator** — Know exactly how many classes you can skip or need to recover
- **Analytics** — Bar charts, pie charts, GitHub-style attendance heatmap
- **What-If Simulator** — See how skipping or attending classes affects your percentage
- **Calendar** — Week and month views with color-coded status dots
- **Notifications Settings** — WhatsApp, alarm, push, and quiet hours configuration
- **Semester Management** — Create and switch between semesters
- **CSV Export** — Download attendance records for any subject
- **Streaks & Achievements** — Track consecutive attendance streaks and earn badges
- **Responsive Design** — Works on desktop and mobile with collapsible sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | Prisma ORM + SQLite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | JWT (access + refresh tokens) + bcrypt |
| State | Zustand |
| Validation | Zod |

## Project Structure

```
attendease/
├── prisma/
│   ├── schema.prisma          # 11 models
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── globals.css        # Theme variables
│   │   ├── (auth)/            # Login, Register
│   │   ├── (app)/             # Protected pages
│   │   │   ├── dashboard/
│   │   │   ├── subjects/      # List, New, [id] detail
│   │   │   ├── calendar/
│   │   │   ├── analytics/
│   │   │   ├── simulator/
│   │   │   ├── settings/      # Hub, Notifications, Semesters
│   │   │   └── export/
│   │   └── api/v1/            # 16 REST API route files
│   ├── lib/
│   │   ├── auth.ts            # JWT + bcrypt helpers
│   │   ├── db.ts              # Prisma singleton
│   │   ├── attendance-calc.ts # Bunk calculator formulas
│   │   └── validations/       # Zod schemas
│   ├── hooks/useApi.ts        # Fetch wrapper with auth
│   └── store/authStore.ts     # Zustand auth store
├── .env                       # Config (SQLite, JWT secrets)
└── package.json
```

## Switching to PostgreSQL

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
2. In `.env`, set `DATABASE_URL` to your PostgreSQL connection string
3. Run `npx prisma db push`

## License

MIT
