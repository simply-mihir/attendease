<div align="center">
  <h1> AttendEase — Smart Attendance Tracker</h1>
  <p>
    <b>A production-grade, full-stack attendance tracking platform with real-time analytics, automated Telegram/Push notifications, and predictive simulation capabilities.</b>
  </p>
  <p>
    <a href="https://attendease-c7wl.vercel.app">
      <img src="https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-Restricted-red?style=for-the-badge" alt="License">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black" alt="Neon">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/NextAuth.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="NextAuth">
    <img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=flat-square&logo=google&logoColor=white" alt="Google">
    <img src="https://img.shields.io/badge/GitHub_OAuth-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub">
    <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=react&logoColor=white" alt="Zustand">
    <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=react&logoColor=white" alt="Recharts">
    <img src="https://img.shields.io/badge/Telegram_API-2CA5E0?style=flat-square&logo=telegram&logoColor=white" alt="Telegram">
    <img src="https://img.shields.io/badge/Resend-000000?style=flat-square&logo=maildotru&logoColor=white" alt="Resend">
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
    <img src="https://img.shields.io/badge/Web_Push_API-5A0FC8?style=flat-square&logo=googlechrome&logoColor=white" alt="Web Push">
    <img src="https://img.shields.io/badge/OpenRouter_AI-000000?style=flat-square&logo=openai&logoColor=white" alt="OpenRouter">
    <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod">
    <img src="https://img.shields.io/badge/SWR-000000?style=flat-square&logo=vercel&logoColor=white" alt="SWR">
  </p>
</div>

---

**AttendEase** is an enterprise-grade academic tracker built around three architectural pillars:

1.  **Monolithic Next.js Architecture** for seamless server-side rendering and strict end-to-end type safety.
2.  **Serverless Cron Jobs** for automated, background dispatching of daily briefs and pre-class alerts.
3.  **Comprehensive Predictive Analytics** utilizing a "What-If" simulator to project the impact of future attendance deficits.

The service is highly scalable, fully containerized, and surfaces a sophisticated dark-mode glassmorphic user interface.

---

## Table of Contents

1. [Key Features](#1-key-features)
2. [System Architecture](#2-system-architecture)
3. [Flow Diagrams](#3-flow-diagrams)
   - 3.1 [User Interaction Workflow](#31-user-interaction-workflow)
   - 3.2 [Background Notification Pipeline](#32-background-notification-pipeline)
4. [Database Schema](#4-database-schema)
5. [Quick Start — Local Development](#5-quick-start--local-development)
6. [Project Structure](#6-project-structure)
7. [Environment Configuration](#7-environment-configuration)
8. [Production Deployment Guide](#8-production-deployment-guide)
9. [License](#9-license)

---

## 1. Key Features

### Core capabilities
-  **Centralized Dashboard** — A comprehensive daily overview displaying scheduled classes and immediate actionable modules (Quick Mark).
-  **Subject Administration** — Support for color-coded subject categorization, complex recurring schedules, and archival/restoration processes.
-  **Semester Management** — Multi-semester tracking, allowing users to transition between academic terms seamlessly while retaining historical data.
-  **Precision Tracking** — Options to mark attendance states as Present, Absent, or Late, paired with a robust audit log to track historical modifications.
-  **Interactive Calendar** — Dedicated week and month views with color-coded status dots for at-a-glance historical attendance tracking.
-  **Data Import Engine** — Seamlessly import academic schedules and attendance history from Excel (`.xlsx`) or CSV files directly into the database.
-  **Gamification System** — Tracks attendance streaks, renders dynamic progress bars, and uses shimmer animations to encourage consistent attendance.
-  **AI Chatbot Assistant** — Integrated NLP-driven chatbot allowing natural language operations (e.g., "mark all present", "cancel my 9 AM class") powered by LLM models via OpenRouter.

### Engineering depth
-  **Predictive Modeling (Simulator)** — A "what-if" computational engine that allows users to project the statistical impact of attending or missing future scheduled classes.
-  **Deficit Calculator** — Computes exact thresholds for maximum permissible absences or the required consecutive classes needed to recover from a deficit.
-  **Telegram Integration** — Leverages the Telegram Bot API to deliver zero-cost, unlimited pre-class alerts, attendance danger warnings, and comprehensive weekly reports directly to the user's device.
-  **Native Browser Push** — Utilizes the Web Push API (VAPID) to send native, OS-level notifications to desktop and mobile clients.
-  **Progressive Web Application (PWA)** — Fully installable on iOS and Android devices, supporting offline capabilities and aggressive caching via Service Workers.

---

## 2. System Architecture

```mermaid
graph TB
    subgraph Client[" Client Layer"]
        Browser["Browser / PWA<br/>(Next.js + Tailwind)"]
    end

    subgraph Server[" Core Server"]
        NextAPI["Next.js App Router<br/>(API Routes & SSR)"]
        Cron["Vercel Cron Jobs<br/>(Background Scheduler)"]
    end

    subgraph Data[" Data Layer"]
        Prisma["Prisma ORM"]
        Postgres[("PostgreSQL<br/>Relational Database")]
    end

    subgraph External[" External APIs"]
        Telegram["Telegram Bot API<br/>(Real-time Alerts)"]
        WebPush["Web Push VAPID<br/>(Browser Notifications)"]
        Resend["Resend API<br/>(Email Dispatch)"]
        OAuth["NextAuth<br/>(Google / GitHub)"]
    end

    Browser -- "HTTPS / API Calls" --> NextAPI
    Browser -- "Authentication" --> OAuth
    
    NextAPI -- "ORM Queries" --> Prisma
    Prisma <--> Postgres
    Cron -- "Triggers /api/cron/*" --> NextAPI

    NextAPI -- "Message Dispatch" --> Telegram
    NextAPI -- "Push Protocol" --> WebPush
    NextAPI -- "Email Dispatch" --> Resend

    classDef client fill:#f3f4f6,stroke:#374151,stroke-width:2px,color:#0a0a0a
    classDef server fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#0a0a0a
    classDef data fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#0a0a0a
    classDef external fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#0a0a0a
    
    class Browser client
    class NextAPI,Cron server
    class Prisma,Postgres data
    class Telegram,WebPush,Resend,OAuth external
```

---

## 3. Flow Diagrams

### 3.1 User Interaction Workflow

Decision tree mapping the primary user journey from authentication to analytics.

```mermaid
flowchart TD
    Start([ Application Entry]) --> Login[Authenticate via OAuth]

    Login --> HasSem{Active Semester<br/>Exists?}

    HasSem -- False --> CreateSem[Initialize Semester Profile]
    CreateSem --> AddSub[Register Subjects & Schedules]
    
    HasSem -- True --> Dash[Access Primary Dashboard]
    AddSub --> Dash
    
    Dash --> Mark{Scheduled Class<br/>Today?}
    Mark -- True --> QuickMark[Execute Quick Mark Action]
    QuickMark --> Calc[Recalculate Thresholds and Statistics]
    Calc --> End([End Session])
    
    Mark -- False --> ViewAnalytics[Review Analytics and Heatmaps]
    ViewAnalytics --> End

    classDef terminal fill:#111827,stroke:#374151,stroke-width:2px,color:#ffffff
    classDef process fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#ffffff
    classDef decision fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff
    
    class Start,End terminal
    class Login,CreateSem,AddSub,Dash,QuickMark,Calc,ViewAnalytics process
    class HasSem,Mark decision
```

### 3.2 Background Notification Pipeline

Asynchronous alert distribution utilizing serverless cron execution.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Serverless Cron
    participant API as Next.js API
    participant DB as PostgreSQL
    participant User as End-User Devices

    loop Rapid Polling (5-Minute Intervals)
        Cron->>API: HTTP GET /api/cron/notifications
        API->>DB: Query schedules executing within T-15 minutes
        DB-->>API: Return schedule payload
        
        alt Payload contains actionable schedules
            API->>DB: Validate historical notification dispatch records
            API->>User: Transmit "Upcoming Class" payload via Telegram/Push
            API->>DB: Insert dispatch record into audit log
        end
    end

    loop Daily Operations (Morning Batch)
        Cron->>API: HTTP GET /api/cron/notifications?type=daily
        API->>DB: Query aggregate daily schedule for active users
        API->>User: Transmit Daily Briefing Report
    end
```

---

## 4. Database Schema

### Table: `User` (dimension)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `cuid` | PK |
| `email` | `varchar` | Unique |
| `telegramChatId` | `varchar` | Used for bot integration |
| `timezone` | `varchar` | Default `Asia/Kolkata` |

### Table: `Subject` (dimension)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `cuid` | PK |
| `minAttendancePct`| `float` | Used for calculating danger thresholds (e.g. 75.0) |
| `currentPercentage`| `float` | Cached current attendance percentage |
| `totalPresent` | `integer` | Aggregated cache of present classes |

### Table: `Schedule` (dimension)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `cuid` | PK |
| `dayOfWeek` | `integer` | 0-6 representation |
| `startTime` | `varchar` | Standardized format (HH:MM) |

### Table: `AttendanceRecord` (fact)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `cuid` | PK |
| `date` | `DateTime` | `db.Date` |
| `status` | `varchar` | Present, Absent, Late |
| `source` | `varchar` | e.g. "manual", "quick-mark" |

---

## 5. Quick Start — Local Development

```bash
# 1. Resolve package dependencies
npm install

# 2. Provision environment configuration
cp .env.example .env
# Ensure all variables are properly populated

# 3. Synchronize database schema and generate ORM client
npx prisma generate
npx prisma db push

# 4. Populate database with local testing fixtures
npx tsx prisma/seed.ts

# 5. Initialize local development server
npm run dev
```

The application will bind to `localhost:3000`.

---

## 6. Project Structure

```text
attendease/
├── prisma/                       # Database schema and seed files
├── public/                       # Static assets, Service Worker, Web Manifest
├── scripts/                      # Isolated utility, database, and debugging scripts
│   ├── automation/               
│   ├── database/                 
│   ├── debugging/                
│   ├── fixes/                    
│   ├── snapshots/                
│   └── testing/                  
├── src/                          # Next.js Application Root
│   ├── app/                      # App Router (Pages, API Routes, Layouts)
│   ├── components/               # React Components (UI, Forms, Charts)
│   ├── hooks/                    # Custom React Hooks
│   ├── lib/                      # Core logic, Prisma client, Server utilities
│   └── store/                    # Global state management
├── .env                          # Environment variables
├── next.config.mjs               # Next.js configuration
├── package.json                  # NPM manifest
├── prisma.config.ts              # Prisma CLI configuration
└── vercel.json                   # Vercel deployment and cron job configuration
```

---

## 7. Environment Configuration

Define the following within your `.env` file:

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Fully qualified PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Cryptographically secure 32+ character string |
| `NEXTAUTH_URL` | Canonical application URL |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret from Google Cloud Console |
| `GITHUB_CLIENT_ID` | OAuth Client ID from GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret from GitHub Developer Settings |
| `TELEGRAM_BOT_TOKEN` | Bot authorization token generated via BotFather |
| `TELEGRAM_BOT_USERNAME` | Registered Telegram bot handle |
| `RESEND_API_KEY` | API Key generated from Resend Dashboard |
| `FROM_EMAIL` | Verified sender email address |
| `VAPID_PUBLIC_KEY` | Public key for Web Push Protocol generation |
| `VAPID_PRIVATE_KEY` | Private key for Web Push Protocol generation |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client-exposed Web Push public key |
| `CRON_SECRET` | Shared secret for cron job authentication |

---

## 8. Production Deployment Guide

Deploying AttendEase requires provisioning PostgreSQL and configuring Vercel.

1. **Database Provisioning**: Instantiate a PostgreSQL database (e.g., Neon, Supabase). Obtain the connection string and assign it to `DATABASE_URL`.
2. **Push Protocol Keys**: Generate VAPID keys for browser notifications:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. **Deployment**:
   ```bash
   npm i -g vercel
   vercel
   ```
4. **Environment Synchronization**: Ensure all variables listed in section 7 are applied within your Vercel project settings. The included `vercel.json` will automatically configure the background cron jobs.

---

## 9. License

**Copyright (c) 2026. All Rights Reserved.**

This software and associated documentation files (the "Software") are proprietary and confidential. 

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is **strictly prohibited** without prior written permission from the repository owner. 

Any person or organization wishing to make changes, fork, deploy, or publish this software must obtain explicit, written authorization from the copyright holder.
