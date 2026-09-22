# URL Shortener (private)

A minimal, single-admin URL shortener built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL** and **Prisma**. Deployable to Vercel.

You are the only admin. Log in, paste a long URL, choose a short code (or leave it empty for an automatic one), and share `https://yourdomain.com/code` with anyone. Links are stored permanently in PostgreSQL.

## Features

- Single admin login (`ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` with bcrypt)
- Secure, signed, expiring session cookie (`SESSION_SECRET`)
- Server-side auth on every page and API route
- Login rate limiting
- CSRF protection for all mutations (SameSite cookie + JSON + Origin check)
- Short code auto-generation (`a, b, ..., z, A, ..., 9, aa, ab, ...`)
- Custom short codes (`a-z`, `A-Z`, `0-9`, `-`, `_`)
- Reserved slug protection (`admin`, `login`, `logout`, `api`, `_next`, ...)
- Permanent storage in PostgreSQL (no SQLite, no LocalStorage, no JSON files)
- Enable / disable / delete links
- Temporary (307) redirects
- `Link unavailable` page for disabled links, `404` for missing slugs

## Tech stack

| Concern    | Choice                                  |
| ---------- | --------------------------------------- |
| Framework  | Next.js 16 (App Router, React, TypeScript) |
| Styling    | Tailwind CSS                           |
| Database   | PostgreSQL                             |
| ORM        | Prisma                                 |
| Auth       | iron-session (signed/encrypted cookie)  |
| Password   | bcrypt (bcryptjs)                       |

## Requirements

- Node.js 18+ or Bun
- PostgreSQL (local for development, hosted such as Vercel Postgres / Neon / Supabase for production)

## Setup (local development)

### 1. Install dependencies

```bash
bun install        # or: npm install
```

### 2. Create the environment file

```bash
cp .env.example .env.local
```

Fill in the values (see below).

### 3. Environment variables

| Variable             | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string. For Vercel/serverless append `?connection_limit=1`. |
| `ADMIN_USERNAME`     | The single admin username.                                                  |
| `ADMIN_PASSWORD_HASH`| bcrypt hash of the admin password (never the plain password).               |
| `SESSION_SECRET`     | Secret for signing/encrypting session cookies (must be **≥ 32 characters**). |

Never commit real values. `.env*` files are git-ignored (`.env.example` is kept).

#### Generate `ADMIN_PASSWORD_HASH`

```bash
bun scripts/hash-password.cjs
# or: node scripts/hash-password.cjs
```

You are prompted for the password (input is hidden). Copy the printed `ADMIN_PASSWORD_HASH=...` into your env file.

> **Turbopack `$` expansion (local dev/build):** a raw bcrypt hash (`$2b$12$...`) is
> mangled when loaded from `.env.local`, because Next.js/Turbopack expands `$`
> and parses the file more than once. Escape every `$` as `\\$` so local
> development and `next build`/`next start` work correctly:
>
> ```bash
> # .env.local
> ADMIN_PASSWORD_HASH=\\$2b\\$12\\$<rest-of-your-hash>
> ```
>
> On **Vercel** you do NOT escape: paste the raw hash (with `$`) into the
> dashboard. Vercel injects env values directly and does not parse `.env` files.

#### Generate `SESSION_SECRET`

```bash
openssl rand -base64 48
```

### 4. Set up PostgreSQL and run migrations

Make sure PostgreSQL is running, then point `DATABASE_URL` at it. Create the database if needed:

```bash
bunx prisma migrate dev --name init
```

This creates the `ShortLink` table locally.

### 5. Run locally

```bash
bun run dev
# or: npm run dev
```

Open http://localhost:3000, log in with your admin credentials, and create links.

### 6. Type check, lint and production build

```bash
bun run typecheck
bun run lint
bun run build
```

## Prisma migrations in production

- Migrations are stored in `prisma/migrations/` and committed to git.
- **Never run `prisma migrate reset` (or any destructive migration) automatically on deploy.**
- To apply pending migrations safely in production, run:

```bash
bunx prisma migrate deploy
```

or add the npm script:

```bash
bun run db:deploy
```

This only applies migration files that have not been applied yet — it never resets or drops data.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add a PostgreSQL provider (e.g. Vercel Postgres / Neon / Supabase) and add these environment variables in the Vercel dashboard:
   - `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?connection_limit=1`
   - `ADMIN_USERNAME=...`
   - `ADMIN_PASSWORD_HASH=...`
   - `SESSION_SECRET=...`
3. Before or right after the first deploy, apply the schema once:

   ```bash
   bunx prisma migrate deploy        # from your machine, against the production DATABASE_URL
   ```

   Do not run migrations as part of every deployment; run them once, outside of the deploy, in a safe window.

4. Vercel automatically runs `prisma generate` (postinstall) and `next build`. All app data lives in PostgreSQL — nothing is stored on the filesystem.
5. In the Vercel dashboard you can connect your custom domain. Short URLs will automatically use your current domain (`https://yourdomain.com/code`) — no domain is hard-coded in the project.

## How it works

### Authentication

- Single admin, credentials come only from environment variables. No registration, no user system.
- Passwords are verified with bcrypt against `ADMIN_PASSWORD_HASH`.
- On success an iron-session cookie is set: `HttpOnly`, `Secure` in production, `SameSite=Lax`, 7-day expiry, signed + encrypted with `SESSION_SECRET`.
- Login is rate-limited (5 attempts per 5 minutes per IP).
- Every admin page and every admin API route re-verifies the session on the server.

### Storing links

- Links live in the `ShortLink` PostgreSQL table via Prisma.
- `slug` has a unique constraint. Concurrency-safe: on conflicts the unique constraint rejects duplicates and the generator retries with the next candidate.

### Redirect

- `https://yourdomain.com/<slug>` looks the slug up in PostgreSQL.
- If found and active → temporary (307) redirect to the destination (no login needed).
- If disabled → `Link unavailable` page. If missing → `404`.

## Database schema

`ShortLink` (Prisma):

| Column          | Type      | Notes                        |
| --------------- | --------- | ---------------------------- |
| `id`            | String    | cuid (primary key)           |
| `slug`          | String    | unique, max 64 chars         |
| `destinationUrl`| String    | text                         |
| `isActive`      | Boolean   | default `true`               |
| `createdAt`     | DateTime  | default `now()`              |
| `updatedAt`     | DateTime  | set on update                |

## Project structure

```
prisma/                  # schema + migrations
scripts/hash-password.cjs# generates ADMIN_PASSWORD_HASH
src/lib/                 # prisma client, auth, rate limit, csrf, slugs, validation
src/app/                 # app router (login `/`, admin `/admin`, redirect `/[slug]`, api)
  api/login, api/logout  # auth endpoints
  api/links              # list + create
  api/links/[id]         # enable/disable + delete
.env.example             # variable names only (no real values)
```

## GitHub

The repository is meant to be **private**. Before each push, run `git status` and review the staged files to confirm no secrets, credentials, password hashes or session secrets are included (`.env*` are ignored; `src/generated/` and `.next/` too).

## Final report / what to do next

After deploying, connect your custom domain in the Vercel dashboard. Optionally, keep `prisma migrate deploy` as a manual step you run once after each schema change (never automated destructively).