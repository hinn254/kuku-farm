# Kuku Farm

Multi-farm chicken tracker and customizable produce storefront with Paystack checkout.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn
- **Local PostgreSQL** + Drizzle ORM
- Clerk auth (owner / staff roles)
- Local file uploads under `public/uploads`
- Paystack payments (per-farm keys)

## Setup

1. Ensure Postgres is running and create the DB if needed:

```bash
createdb kuku_farm
```

2. Copy env and fill Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com):

```bash
cp .env.example .env.local
```

Default `DATABASE_URL` in `.env.example` targets local Postgres:

```
DATABASE_URL=postgresql://USER@localhost:5432/kuku_farm
```

3. Install and migrate:

```bash
npm install
npm run db:migrate
npm run db:seed   # optional demo shop at /shop/green-valley
```

4. Run the app:

```bash
npm run dev
```

Sign up → create a farm at `/onboarding` → manage ops under `/app` → publish the shop under **Store**.

## Database migrations

Schema lives in [`db/schema.ts`](db/schema.ts). SQL migrations are generated into [`drizzle/`](drizzle/).

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Create a new migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Drop public schema and re-run all migrations (dev) |
| `npm run db:seed` | Seed demo farm + products |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:push` | Push schema without a migration file (prototyping only) |

Workflow when you change the schema:

```bash
npm run db:generate
npm run db:migrate
```

## Paystack

In **Store** (owner): set public + secret keys, publish the shop, then buyers pay at `/shop/[slug]/cart`.

Webhook endpoint: `POST /api/paystack/webhook` (point Paystack to your tunnel/public URL in production).

