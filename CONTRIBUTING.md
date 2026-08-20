# Contributing to Kuku Farm

Thanks for helping improve a multi-tenant farm ops + storefront app. Small, focused PRs are easiest to review.

## Development setup

1. Fork and clone the repo
2. Start Postgres (`docker compose up -d` or local `createdb`)
3. `cp .env.example .env.local` and add Clerk keys
4. `npm install && npm run db:migrate && npm run db:seed`
5. `npm run dev`

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm run build
```

## Commit style

Use Conventional Commits when possible:

- `feat:` new capability
- `fix:` bug fix
- `docs:` documentation only
- `chore:` tooling, deps, CI
- `refactor:` internal cleanup with no behavior change

## Pull requests

- Describe **why** the change exists, not only what you touched
- Link related issues
- Include screenshots for UI changes
- Keep secrets out of commits (`.env.local`, Paystack keys, Clerk secrets)

## Releases

Maintainers cut releases with:

```bash
npm run commit-and-tag -- 0.2.0
# or with a message and push:
npm run commit-and-tag -- 0.2.0 "Ship storefront polish" --push
```

Pushing a `v*` tag triggers the GitHub Release workflow.
