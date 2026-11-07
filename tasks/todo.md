# Community: phone arrays, admin CRUD, table layout

Prior plans: `tasks/supabase-migration.md`, `tasks/community-import.md`.

Four asks:
1. Contacts can hold **multiple numbers** — store as an array, not one string.
2. Cards **without a number must not render** on the public page.
3. Public `/community` becomes a **dense table with search + pagination** — 250
   cards of scrolling is poor UX.
4. **Admin panel** gets a full-record **edit popup** and an **add single record**
   button, alongside the existing CSV import/export. Editing is admin-only and
   lives in `/admin/community`, not on the public page.

## Why this is wide

`phone` is a scalar today and is read in 9 places. Changing it to `phones
String[]` (native Postgres `text[]`, not a JSON string — these are queried and
displayed, unlike `tags`) touches:

| file | change |
|---|---|
| `prisma/schema.prisma` | `phone String` -> `phones String[]` |
| migration | add `phones`, backfill from `phone` + the `Alt:` numbers parked in `notes`, drop `phone` |
| `src/lib/community.ts` | both interfaces + `toDisplayContact` |
| `(public)/community/page.tsx` | select, and drop contacts with no number |
| `CommunityDirectory.tsx` | table layout, pagination, render N numbers |
| `api/community/contacts` | GET select, POST zod |
| `api/admin/community/[id]` | PATCH currently only takes status/notes/verified — widen to the whole record |
| `api/admin/community/bulk` | row schema |
| `api/admin/community/export` | CSV column |
| `CommunityCSVTools.tsx` | `phone` -> `phones`, pipe-separated like `tags` |
| `AddContactModal.tsx` | repeatable number inputs |
| `scripts/import-community-contacts.ts` | write the array directly instead of `Alt:` notes |

## Decisions

**`String[]`, not a JSON string.** `tags` uses JSON-in-TEXT, but phones are
displayed, dialled and searched; a real `text[]` keeps them queryable and avoids
parse-on-every-render. Postgres handles it natively and Prisma maps it cleanly.

**The 30 `Alt:` numbers move out of `notes` into the array.** The importer
parked second numbers in free text because the column could not hold them. The
migration parses them back out and strips the fragment, so no number is stranded
in prose.

**No-number rows were already invisible** — the 7 phone-less contacts went in as
PENDING and the page filters on ACTIVE. The explicit empty-array filter is
defence in depth, so a future ACTIVE row with no number cannot render a card
with nothing to call.

**Table keeps the existing search and category filters** — they work and the
rework is layout only. Adding pagination at 25/page also fixes the RSC payload
size flagged earlier.

## Tasks

- [x] Migration: `phones text[]`, backfill, strip `Alt:` from notes, drop `phone`
      — 250 rows: 213 one number, **30 multiple**, 7 none, 0 `Alt:` left in
      prose, 0 empty strings in arrays
- [x] `schema.prisma` + client regenerated; `migrate status` clean
- [x] `lib/community.ts` types and mapper
- [x] Importer writes `phones` (dry-run reparses the sheet unchanged)
- [x] Public page: selects `phones`, drops numberless rows
- [x] `CommunityDirectory`: table + 25/page pager + multi-number rendering
- [x] API routes: public GET/POST, admin PATCH (full record), new admin POST,
      bulk, export
- [x] Admin: edit dialog (full record), add-record button, pagination at 50
- [x] CSV tools: `phones` column, pipe-separated like `tags`
- [x] `next build` exit 0 (69 routes); verified against the live DB
- [ ] Commit

## Review

238 ACTIVE contacts render, all with at least one number, 30 of them with
several. 10 pages at 25 per page instead of one 250-row scroll.

Worth carrying forward:

1. **`Dialog` here is Base UI, not Radix.** `DialogTrigger asChild` does not
   compile — Base UI takes a `render={<Button/>}` prop. The dialog state is
   controlled anyway, so the trigger is now a plain button calling
   `setOpen(true)`; simpler and avoids the mismatch entirely.
2. **Admin pagination was a prerequisite, not a nicety.** The table capped at
   `take: 200` against 250 rows, so ~50 contacts could not be reached at all —
   "admin can edit any record" was not achievable without it.
3. **PATCH refuses to publish a contact with no number.** The public page drops
   numberless rows, so marking one ACTIVE would have silently produced a record
   that exists but never appears. It now returns a reason instead.
4. The public quick-add still takes a single number and posts `[phone]`; the
   repeatable inputs live in the admin dialog where bulk curation happens.
