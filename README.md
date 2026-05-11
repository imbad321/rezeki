# Meridian

A production-quality CFO platform for venture-backed startups. Covers financial dashboards, a secure document vault, investor/cap table reporting, and budget vs. actuals analysis.

Built with Next.js App Router, Prisma (SQLite dev / PostgreSQL prod), UploadThing, Recharts, and Tailwind CSS.

---

## Prerequisites

- Node.js 18+
- An [UploadThing](https://uploadthing.com) account (free tier is fine)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your UploadThing credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
UPLOADTHING_TOKEN="your_uploadthing_token_here"
```

Get your token from the [UploadThing dashboard](https://uploadthing.com/dashboard) under **API Keys**.

### 3. Set up the database

Push the Prisma schema to SQLite:

```bash
npx prisma db push
```

### 4. Seed demo data

This inserts "Meridian AI" — a fictional Series A SaaS startup with 12 months of MRR, 5 investors, 3 funding rounds, 6 departments with budget data, and 10 placeholder documents.

```bash
npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the dashboard automatically.

---

## Features

| Route | Description |
|-------|-------------|
| `/dashboard` | KPI cards (MRR, ARR, burn, runway, cash) + trend charts |
| `/documents` | Secure document vault — upload, filter by category, delete |
| `/investors` | Cap table, funding round timeline, investor directory |
| `/budget` | Department budget vs. actuals table + stacked bar chart |

---

## Document Uploads

Uploads are powered by UploadThing. Three upload endpoints are configured:

| Category | Accepted types | Max size |
|----------|---------------|---------|
| Financial Model | `.xlsx`, `.xls` | 16 MB (5 files) |
| Board Deck | `.pdf`, `.pptx` | 32 MB (3 files) |
| Investor Update | `.pdf` | 16 MB (10 files) |

Files are stored on UploadThing's CDN. Delete removes the file from both CDN and database.

The 10 seed documents have placeholder file keys (`seed-doc-*`) — deleting them removes the DB record without calling the CDN.

---

## Database

### Development (SQLite)

The default setup uses SQLite at `./dev.db`. No additional configuration needed.

### Production (PostgreSQL)

1. Update `DATABASE_URL` in your production environment:

```env
DATABASE_URL="postgresql://user:password@host:5432/meridian"
```

2. Update `prisma/schema.prisma` — change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update the Prisma client adapter in `src/lib/prisma.ts` and `prisma/seed.ts` — replace the `better-sqlite3` adapter with `@prisma/adapter-pg` (or remove the adapter entirely if using Prisma's default PostgreSQL driver):

```bash
npm install @prisma/adapter-pg pg
```

```ts
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const db = new PrismaClient({ adapter })
```

4. Run migrations:

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Type checking

```bash
npx tsc --noEmit
```

Should produce zero errors.

---

## Useful commands

```bash
npx prisma studio        # Browse the database in a UI
npx prisma db push       # Sync schema changes to dev DB (no migration file)
npx prisma migrate dev   # Create a migration file (use for production-bound changes)
npm run build            # Production build
```
