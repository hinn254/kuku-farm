# Security Policy

## Supported versions

Security fixes are applied on the latest `main` release tags (`v*`).

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Email **bennyhinnotieno@gmail.com** with:

- A short description of the issue
- Steps to reproduce (PoC if available)
- Impact assessment (auth bypass, payment tampering, data leak, etc.)

You should receive an acknowledgement within a few days. Please give time for a fix before public disclosure.

## Sensitive areas in this codebase

Treat these carefully in PRs and deployments:

- Per-farm **Paystack** secret keys stored on the farm record
- Clerk session cookies and webhook authenticity for Paystack
- Farm membership authorization in server actions (`requireFarmAccess`)
- Local uploads under `public/uploads` (not for production object storage as-is)

## Production hardening checklist

- Use managed Postgres with TLS
- Store secrets in your host’s secret manager (Vercel/env), never in git
- Point Paystack webhooks at HTTPS and verify signatures
- Replace local disk uploads with object storage (S3/R2/Blob) before multi-instance deploy
