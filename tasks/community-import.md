# Community directory: drop static data, import the real contact list

Two halves. (1) The directory fell back to a 525-line hardcoded dataset whenever
the DB was empty — removed, so the page is DB-only. (2) Imported the 250-row
"Supplier Contact Nos..xlsx" ("Customer Master List") into `CommunityContact`.

Prior plan (Supabase migration) preserved at `tasks/supabase-migration.md`.

## What the page already did

`src/app/(public)/community/page.tsx:37` already queried Prisma for
`status: "ACTIVE"`. The static data was the *fallback* inside
`CommunityDirectory.tsx:82`, plus two derived exports — so this was a removal
job, not a rewrite.

Static-data consumers, all of them:
- `CommunityDirectory.tsx` — `COMMUNITY_CONTACTS` fallback, `COMMUNITY_LOCALITIES` filter
- `home-v2/page.tsx` — `CATEGORY_COUNTS` and `COMMUNITY_CONTACTS.length`

Every other importer (`admin/community`, `CommunityCSVTools`, `AddContactModal`,
`api/admin/community/bulk`) only takes `COMMUNITY_CATEGORIES`, which stayed.

## Spreadsheet analysis

250 data rows, 8 real columns (the sheet claims 16374 — the rest are phantom).
`Sr. No | Category | Sub Category | Customer | Plot No. | Area | Contact Person | Phone No.`

Data quality found:
- 51 raw categories with typos and overlaps (Hospital/Hopspital,
  Finance/Financial, Returent→Restaurant, Liabrary→Library, Courrier→Courier,
  Genrator→Generator) and rows filed under the wrong heading — a pest-control
  vendor under Health, five carpenters under Furniture
- 85 distinct `Area` values, mostly building names inside the estate; 66 blank
- 38 rows with no Sub Category, 16 no Customer name, 171 no Plot No., 128 no
  Contact Person, 7 no phone at all
- 30 rows carry two numbers split by `/`; 5 have 9-digit (truncated) mobiles;
  7 are legitimately short national helplines (100/101/102/103/104/108/14567)

## Decisions

**Categories — merged 51 → 20 populated keys**, all 250 rows placed, nothing
dropped. Existing keys reused where they fit so current data and UI keep
working; `grocery` and `laundry` remain at 0 as valid future categories.

| key | label | rows | merged from |
|---|---|---|---|
| health | Health & Pharmacy | 58 | Health, Hospital, Hopspital, Chemist, Medical |
| tuition | Schools & Tuitions | 24 | Education, School |
| food | Food, Restaurants & Hotels | 20 | Food, Returent, Hotel, Club |
| property | Property & Brokers | 17 | Property |
| emergency | Emergency & Helplines | 17 | Emegency Contact No, Help line, Blood Bank |
| carpenter | Carpenters & Interiors | 15 | Furniture, Interior, Art |
| automobile | Automobile | 12 | Automobile |
| salon | Salon & Spa | 12 | Beauty, Spa |
| classes | Classes & Hobbies | 10 | Music, Dance, Yoga, Liabrary, Marshal Art, Poilet Training, Fitness |
| cleaning | Cleaning & Pest | 9 | Pest Control, Cleaning, Health/Pest control |
| religious | Temples & Trusts | 9 | Religious Trust, Temple, Shop/Spirtual |
| finance | Banks & Finance | 9 | Bank, Finance, Financial |
| appliance | AC, Appliances & Equipment | 8 | AC, Home Appliances, Lift, Generator, Solar |
| professional | Professional Services | 8 | Liasioning, IT, Marketing, Industry |
| electrician | Electricians | 6 | Electrician, Electrical Shop |
| pets | Pets & Garden | 6 | Pet, Service/Garden |
| movers | Movers & Courier | 3 | Courrier, Service/Tempo Local |
| plumber | Plumbers | 3 | Plumber |
| painter | Painters & Repairs | 2 | Civil Work Repairing, Service/Water Proofing |
| shopping | Shops & Retail | 2 | Jewelers, Sports |

Seven new icons registered in `CommunityDirectory.ICONS` (an explicit record,
not a dynamic lookup, so an unregistered name renders nothing):
property→Building2, automobile→Car, emergency→Siren, religious→Flame,
finance→Landmark, professional→Briefcase, classes→Palette.

**Locality — normalized to the existing 6.** Estate buildings →
"Hiranandani Estate" with building + Plot No. in `address`; Meadows / Rodas /
One Hiranandani Park map to their real locality values; genuine outside areas
(Mulund, Powai, Andheri, Patlipada, Manpada, Vartak Nagar, Kolshet, Ovala,
Boriwali, Thane) and blanks → "Others", area preserved in `address`.
`HIRANANDANI_LOCALITIES` is shared with property listing forms and was left
untouched. Result: 124 Hiranandani Estate, 114 Others, 8 Meadows, 3 Rodas, 1
One Hiranandani Park. Because the raw Area always lands in `address`, the
bucketing loses no information.

**Service line rewritten where the sub-category read badly.** It is the
description under the name, so "Blum / New" and "Decotham / Articles" became
"Furniture" and "Sports Goods". Where a row had no business name the
sub-category became the name and the category describes it, so "Police" reads
"Police / Emergency Contact" rather than "Police / Police", and
"for Ladies" became "Women's Helpline".

**Nothing discarded.** 12 rows that cannot be published safely went in as
`status: "PENDING"` — invisible publicly, editable in `/admin/community`:
7 with no phone number at all, 5 whose number has only 9 digits (would
misdial). `verified: false` on everything: the field means "physically verified
by the Sanatani Seva team", which has not happened. `tags` carries the original
category and sub-category so search still hits the sheet's own wording.

**The spreadsheet is not vendored into the repo** — 250 real phone numbers;
committing it, or a JSON copy, would put PII in git history permanently. The
importer takes the path as an argument and the DB is the only store.

## Tasks

- [x] `src/lib/community.ts` — 22-key taxonomy; deleted `COMMUNITY_CONTACTS`,
      `COMMUNITY_LOCALITIES`, `CATEGORY_COUNTS` (640 → 110 lines)
- [x] `CommunityDirectory.tsx` — static fallback gone, locality list derived
      from the contacts actually returned, 7 new icons registered
- [x] `home-v2/page.tsx` — real counts via `groupBy`, real total
- [x] `community/page.tsx` — "sample entries" notice replaced with an always-on
      disclaimer (the "does not employ or endorse" line should never have
      depended on whether data was seeded)
- [x] `scripts/import-community-contacts.ts` — idempotent, prints a full report
- [x] Imported: 250 rows, 238 ACTIVE, 12 PENDING, 20 categories
- [x] Re-run proves idempotency: "Wrote 0 new, updated 250"
- [x] Integration check: 0 unknown categories, 0 unparseable tags, 0 blank
      name/phone/service, every icon used is registered
- [x] `next build` exit 0
- [ ] Commit

## Review

The directory is DB-backed with no bundled dataset anywhere, and the real
contact list is live.

Two things worth carrying forward:

1. **The importer's match key includes the name.** Changing a naming rule in the
   script (rather than in the sheet) makes the old row unmatchable and inserts a
   second copy — which happened on the helpline rename and left 2 orphans that
   had to be deleted by hand. Phone alone cannot be the key: some vendors
   genuinely share a number (Local Tempo and Garden Maintenance both use
   97025 12575). Documented in the script header.
2. **`next build` type-checks `scripts/`.** `VALID_KEYS` inferred the literal
   union from the `as const` taxonomy and rejected arbitrary sheet strings, so
   the build failed until it was widened to `Set<string>`. Worth remembering
   before adding more one-off scripts.

Not verified through a running server: a `next start` could not be used because
the dev server on port 3000 keeps overwriting `.next` with a development build.
The data path was verified directly instead — the page's exact query, through
the app's own Prisma client and `toDisplayContact`.
