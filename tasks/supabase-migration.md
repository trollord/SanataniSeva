# Move the app onto the Supabase `SanataniSeva` database

Fresh Supabase project `jbdtwgjvsqojcplhsfck` (0 tables, 0 migrations). The app
currently points at a local Postgres named `hiranandani-homes` (pre-rebrand) via
Prisma. Goal: create the schema on Supabase, start real migration history, and
repoint the app.

## Context

- 19 Prisma models; no `prisma/migrations/` has ever existed (`db push` only).
- No `supabase-js` anywhere in `src/` — Supabase is used purely as hosted
  Postgres behind Prisma + NextAuth's Prisma adapter.
- `postgres` role has `rolbypassrls = true`; `anon` / `authenticated` do not.

## Tasks

- [x] `prisma/migrations/0_init/migration.sql` — baseline DDL generated with
      `prisma migrate diff --from-empty` (19 tables, 21 indexes, 16 FKs)
- [x] `prisma/migrations/migration_lock.toml` — provider = postgresql
- [x] Apply `0_init` to Supabase
- [x] Second migration: `enable_rls` — `alter table ... enable row level
      security` on all 19 tables, no policies. Verified 19/19 `relrowsecurity`.
- [x] `prisma/schema.prisma` — add `directUrl = env("DIRECT_URL")`;
      `prisma validate` passes
- [x] `.env.example` — documented pooled `DATABASE_URL` (6543) + `DIRECT_URL`
      (5432); `.env` staged with `<PASSWORD>`/`<REGION>` markers
- [x] `.env` — real credentials in. Region `ap-northeast-1` was not guessed: the
      direct host `db.<ref>.supabase.co` confirmed the password first, then a
      Supavisor tenant probe across 8 candidate pooler hosts found the one that
      resolves `postgres.<ref>` (the other 7 return `ENOTFOUND tenant/user`).
- [x] Baseline Prisma's ledger: `migrate resolve --applied` for both migrations
      → `prisma migrate status` reports "Database schema is up to date!"
- [x] Verify: both pooler ports reachable; count/create/include/delete round trip
      through `src/lib/prisma.ts`; `next build` exit 0 with 0 Prisma errors
      (down from 2)
- [ ] Admin account: `npx tsx scripts/create-admin.ts <email> <password>`
      — waiting on the email to use
- [ ] Vercel: set `DATABASE_URL` + `DIRECT_URL` in project env (user action)

## Seeding decision

Real admin only — no `prisma/seed.ts` / `seed-items.ts` run. Those create demo
properties and an `admin@sanataniseva.com` account with the hardcoded password
`admin123`, which must not exist on the production DB.

Checked: neither seed touches `BusRoute`, `BusSchedule`, `BusException`, or
`CommunityContact` — there is no reference-data seed in the repo at all. That
content is entered through `/admin/bus-timings` and `/admin/community`, so
`/community` and the bus-timings component will render empty until someone adds
rows. Nothing to migrate from the old local DB since this is a fresh start.

## Decisions

- **RLS on, zero policies.** Supabase exposes `public` through PostgREST; with
  RLS enabled and no policies, `anon` sees nothing. Prisma connects as
  `postgres` (BYPASSRLS) so app queries are untouched. Deny-by-default costs
  nothing here because no client ever talks to PostgREST.
- **Transaction pooler (6543) for the app**, session pooler (5432) as
  `DIRECT_URL`. Next.js on Vercel is serverless — direct connections exhaust the
  pool; the pooler also sidesteps the IPv6-only direct host. `pgbouncer=true`
  disables named prepared statements, which transaction pooling cannot support.
- **Migrations over `db push`.** Fresh DB is the moment to start history.

## Pre-existing infrastructure found on the project

An event trigger `ensure_rls` (owner `postgres`) calls
`public.rls_auto_enable()` on `ddl_command_end` and enables RLS on every new
table in `public`. Not created by this work and left in place — it means the 19
tables already had RLS before the `enable_rls` migration ran, making that
migration a no-op here (`enable row level security` is idempotent). It is still
worth keeping: the trigger is project-side infrastructure that no other
environment has.

Its function was `SECURITY DEFINER` with `EXECUTE` granted to `anon` /
`authenticated` (Supabase's default privileges on new functions), so the linter
flagged it as callable via `/rest/v1/rpc/rls_auto_enable`. Revoked in a
Supabase-side migration (`revoke_public_execute_on_rls_auto_enable`), kept out
of `prisma/migrations/` deliberately — the function does not exist on a plain
local Postgres, and neither do the `anon`/`authenticated` roles, so a REVOKE
there would break `prisma migrate deploy` everywhere else.

## Caveat to carry forward

Prisma does not model RLS. On Supabase the `ensure_rls` trigger covers new
tables, but anywhere else a future `prisma migrate dev` creates a table with RLS
*off*. Add an `enable row level security` line to each new migration that
creates a table rather than relying on the trigger.

## Review

The app is on Supabase. Schema, RLS, migration history, and connectivity are all
verified rather than assumed — a green `next build` proves nothing about the DB
here, because `await auth()` in the root layout (`src/app/layout.tsx:64`) forces
every route to render on demand, so no page ever queries Postgres at build time.

Two things left for a human decision, both cheapest to act on now:

1. **The `postgres` password is weak** — a dictionary word identical to the
   project name, i.e. the first thing anyone would try. It is the
   superuser-equivalent credential for the production DB on a publicly
   reachable host. It lives in exactly two places (`.env`, and Vercel once
   set), so rotating it to a generated string costs one dashboard reset plus
   one edit. (Deliberately not written out here — this file is committed.)
2. **The project is in `ap-northeast-1` (Tokyo); the users are in Thane.**
   Expect roughly 100–150 ms extra round trip per query, and Prisma issues
   several per page. `ap-south-1` (Mumbai) is the natural home. A project's
   region cannot be changed in place — it means a new project and repointing —
   which is near-free while the DB holds zero rows and expensive later.
