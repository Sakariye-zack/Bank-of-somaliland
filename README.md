# Bank of Somaliland Website — Monorepo

Real, functional implementation per the specs in `../website documentation` and `../website brand`:
`project-overview.md`, `product-requirement-document.md`, `roadmap.md` (Phase 1–4 scope),
`Database_API_Auth_Specification.md` (DB DDL / API contracts / auth), `brand-guidelines.md`.

## Structure

```
apps/api      Express + TypeScript API (auth, public routes, admin routes, audit log)
apps/public   Public site (React + TS + Vite) — homepage, institutions register, publications, press, about, contact
apps/admin    Admin panel (React + TS + Vite) — login, dashboard, rate entry, institutions mgmt, users, audit log
packages/shared-types  TypeScript types shared across all three apps
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (a `docker-compose.yml` is provided if you have Docker; otherwise point
  `DATABASE_URL` at any local Postgres instance)

## First-time setup

```bash
npm install

# Point apps/api/.env at your Postgres instance (copy from .env.example)
cp apps/api/.env.example apps/api/.env
# then edit DATABASE_URL, and generate real JWT secrets (32+ random bytes each):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run migrate   # applies apps/api/migrations/*.sql in order
npm run seed       # seeds sample admin users, rates, institutions, press, publications
```

Seeded admin logins (dev password for all: `ChangeMe123!`):

| Email | Role |
|---|---|
| super.admin@bankofsomaliland.so | super_admin |
| content.editor@bankofsomaliland.so | content_editor |
| supervision.officer@bankofsomaliland.so | supervision_data_officer |
| rate.officer@bankofsomaliland.so | exchange_rate_officer |

**Change these before any non-local deployment.**

## Running

```bash
npm run dev:api      # http://localhost:4000
npm run dev:public   # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

Each app also has its own `.env.example` (`apps/public`, `apps/admin`) for `VITE_API_BASE_URL`
if the API isn't on `localhost:4000`.

## What's real here vs. what's still a mockup

- **Real**: Postgres schema (from the spec DDL), JWT auth with rotating refresh tokens, every
  `requireRole()` check enforced server-side (verified — see role-enforcement test below),
  non-optional audit logging on institution/rate writes, the public site's data all comes from
  the live API (no hardcoded numbers).
- **Cosmetic only**: the admin sidebar hides nav links by role for UX — this is *not* the
  security boundary, per `Database_API_Auth_Specification.md` Section 3.3's explicit warning
  about the original mockup. The actual boundary is `requireRole()` in `apps/api/src/middleware`.
- **Not yet built** (per `roadmap.md` phasing): Somali/Arabic translations and RTL layout
  (the `fallback_used` mechanism is implemented and works, just has no SO/AR content yet),
  PDF upload-to-Spaces flow for publications/laws (publications currently store a `file_url`
  you provide directly), board members / careers / tenders pages.

## Verifying server-side role enforcement

```bash
# Log in as exchange_rate_officer, then try an institutions write (should 403):
TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rate.officer@bankofsomaliland.so","password":"ChangeMe123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).access_token))")

curl -s -X PUT http://localhost:4000/v1/admin/institutions/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"revoked"}'
# → {"error":{"code":"FORBIDDEN", ...}}
```

## Open items carried over from the specs (not resolved by this build)

See `../website documentation/project-overview.md` Section 6 — real About/Governance/Laws
content, translation resourcing for Somali/Arabic, and an Incident Response Plan owner are
still open on the Bank's side and unaffected by any code here.
