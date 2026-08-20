# Kuku Farm

[![CI](https://github.com/hinn254/kuku-farm/actions/workflows/ci.yml/badge.svg)](https://github.com/hinn254/kuku-farm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)

**Multi-tenant poultry operations platform** — track flocks, eggs, expenses, and invoices, then sell produce on a per-farm branded storefront with Paystack checkout.

Built as a full-stack product: tenancy, RBAC, money movement, and a public shop in one Next.js codebase.

---

## Why this exists

Small and mid-size poultry farms juggle ops spreadsheets and ad-hoc WhatsApp sales. Kuku Farm collapses that into:

1. **Farm ops** — cages, flocks (with stage history), daily egg logs, expenses, internal sales, invoices
2. **Commerce** — publish a themed shop, manage catalog/stock, take Paystack payments, fulfill orders
3. **Multi-farm tenancy** — one Clerk user can own/staff multiple farms with an active-farm cookie context

---

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    Farmer[Farmer / staff UI /app]
    Buyer[Public shop /shop/slug]
  end

  subgraph next [Next.js App Router]
    Proxy[proxy.ts · Clerk middleware]
    Actions[Server Actions · farm + checkout]
    Webhook[Paystack webhook API]
    RSC[Server Components · farm-scoped queries]
  end

  subgraph data [Data]
    PG[(PostgreSQL · Drizzle schema)]
    Uploads[public/uploads · local files]
  end

  subgraph external [External]
    Clerk[Clerk auth]
    Paystack[Paystack]
  end

  Farmer --> Proxy --> RSC
  Farmer --> Actions
  Buyer --> RSC
  Buyer --> Actions
  Actions --> PG
  Actions --> Paystack
  Webhook --> PG
  RSC --> PG
  Actions --> Uploads
  Proxy --> Clerk
```

### Design choices worth noticing

| Concern | Approach |
|--------|----------|
| **Tenancy** | Every write path takes `farmId` and goes through `requireFarmAccess` (owner/staff roles) |
| **Active farm** | HttpOnly cookie selects context; switcher revalidates `/app` |
| **Mutations** | Server Actions + `ActionForm` toast feedback (success + redirect-safe errors) |
| **Payments** | Per-farm Paystack keys; initialize on checkout; webhook marks orders paid and adjusts stock |
| **Schema** | Drizzle enums + indexed FKs; SQL migrations in `drizzle/` (not push-only) |
| **Auth boundary** | Clerk in `proxy.ts` when configured; resource checks live in actions/layouts, not “middleware only” |
| **Storefront** | Theme row per farm (layout, fonts, colors, CSS); shop routes are public by slug |

---

## Product surface

### Farm app (`/app`)

- Dashboard, flocks + stage timeline, cages + access logs
- Egg collections, expenses (optional receipt upload), sales
- Invoices with line items + print view
- Store catalog, storefront theme, Paystack keys
- Orders fulfillment, members (owner invites by existing Clerk email)

### Public shop (`/shop/[slug]`)

- Branded storefront, product detail, cart
- Checkout → Paystack redirect
- Buyer order lookup by email

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS 4** · **shadcn/ui**
- **PostgreSQL** · **Drizzle ORM** (typed schema + migrations)
- **Clerk** authentication
- **Paystack** payments (per-farm credentials)
- **Sonner** toasts for mutation feedback

---

## Quick start

### Prerequisites

- Node.js 20+
- Docker (recommended) **or** local PostgreSQL
- Clerk application ([dashboard.clerk.com](https://dashboard.clerk.com))

### 1. Clone & install

```bash
git clone https://github.com/hinn254/kuku-farm.git
cd kuku-farm
npm install
```

### 2. Database

```bash
docker compose up -d
# or: createdb kuku_farm  (then adjust DATABASE_URL)
```

### 3. Environment

```bash
cp .env.example .env.local
```

Fill real Clerk keys (placeholder keys are rejected at runtime). Default DB URL matches Docker Compose:

```env
DATABASE_URL=postgresql://kuku:kuku@localhost:5432/kuku_farm
```

### 4. Migrate, seed, run

```bash
npm run db:migrate
npm run db:seed    # demo shop → /shop/green-valley
npm run dev
```

Sign up → `/onboarding` creates a farm → manage under `/app` → publish under **Store**.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate SQL migration from schema diff |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Drop public schema + remigrate (dev) |
| `npm run db:seed` | Demo farm + catalog |
| `npm run db:studio` | Drizzle Studio |
| `npm run commit-and-tag` | Bump version, commit, annotated tag |

Schema workflow:

```bash
# edit db/schema.ts
npm run db:generate
npm run db:migrate
```

---

## Releases

Releases are **semver tags** that also bump `package.json`.

```bash
# working tree must be clean
npm run commit-and-tag -- 0.2.0
npm run commit-and-tag -- 0.2.0 "Storefront polish" --push
```

Pushing `v*` runs [`.github/workflows/release.yml`](.github/workflows/release.yml) and opens a GitHub Release with generated notes.

CI on `main` / PRs: lint → typecheck → build ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

---

## Repository layout

```text
app/
  actions/          # Server Actions (farm ops + checkout)
  api/paystack/     # Payment webhooks
  app/              # Authenticated farm UI
  shop/             # Public storefront
  onboarding/       # First / additional farm creation
components/
  forms/            # ActionForm, editors, invoice lines
  shop/             # Cart context + checkout UI
db/                 # Schema, migrate, seed, reset
drizzle/            # Checked-in SQL migrations
lib/                # Auth, farm context, Paystack, uploads
scripts/            # commit-and-tag release helper
```

---

## Paystack

Owners set **public + secret** keys under **Store**, publish the shop, then buyers pay at `/shop/[slug]/cart`.

Configure Paystack’s webhook to:

`POST https://<your-domain>/api/paystack/webhook`

Use a tunnel (e.g. ngrok) in local development.

---

## Security notes

- Farm-scoped authorization on mutations — not UI-only gates
- Paystack secrets are per-farm; treat DB access accordingly
- Local `public/uploads` is fine for demos; use object storage before horizontal scale
- See [SECURITY.md](SECURITY.md) for private vulnerability reporting

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

Issue templates and PR checklist live under [`.github/`](.github/).

---

## Roadmap ideas (great first contributions)

- Object storage for uploads (Vercel Blob / R2 / S3)
- Paystack webhook signature verification hardening tests
- Dashboard analytics (egg yield, feed cost vs sales)
- Email/WhatsApp order notifications
- Soft-delete + audit trail for financial records

---

## License

[MIT](LICENSE) © hinn254
