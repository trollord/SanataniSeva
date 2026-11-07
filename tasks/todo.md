# Community Directory Page

Add a public `/community` page: a searchable directory of vendors, shopkeepers,
service providers, carpenters etc. serving Hiranandani Estate. Static dummy data
for now — no DB, no API.

## Tasks

- [x] `src/lib/community.ts` — 14 categories + 30 dummy contact records
- [x] `src/components/community/CommunityDirectory.tsx` — client search + category filter + cards
- [x] `src/app/(public)/community/page.tsx` — server page (metadata, header, stats, CTA)
- [x] Wire into `Navbar` nav items
- [x] Wire into `Footer` Company column
- [x] Add `/community` to `sitemap.ts`
- [x] Verify: `next build` passes + page renders with working search

## Design constraints (from CLAUDE.md)

- Reuse existing tokens only: `#1A1A1A`, `#0B0B0C`, `#F5F5F5`, `#EBEBEB`, white
  cards, `border-gray-200`, `rounded-2xl`, Playfair for headings, zinc text scale.
- No new colors or components. Match `/blog` + `/listings` page rhythm
  (`pt-24 sm:pt-32`, max-width container, pill chips, hover shadow on cards).

## Review

**Shipped**

- `/community` — public page under the existing `(public)` route group, so it
  inherits Navbar + Footer automatically. No middleware change needed.
- 30 dummy contacts across 14 categories (carpenter, plumber, electrician,
  AC/appliance, painter, cleaning/pest, grocery, tiffin/bakery, health/pharmacy,
  salon, laundry/tailor, movers, tutors, pets/garden) in 4 estate localities.
- Search matches across name, contact person, trade, category label, locality,
  address, phone and tags. Multi-term AND (`"ac gas"` → CoolCare only).
- Filters: category pills with live counts + locality dropdown, both composable
  with the search box. "Clear filters" appears only when something is applied.
- Each card: category icon, verified badge, rating/reviews/since, address,
  hours, "ask for" person, tag chips, `tel:` call button and a WhatsApp deep
  link built with the existing `whatsAppContactUrl()` helper.
- Data lives in `src/lib/community.ts` and renders server-side, so every contact
  is in the initial HTML (indexable). Swapping in a Prisma model later only
  touches that one module.

**Verification**

- `npx tsc --noEmit` — clean
- `npx next lint` on the three new files — clean
- `npm run build` — succeeds; `/community` at 13 kB / 109 kB first load
- `curl /community` — HTTP 200, all 30 listings + 30 `tel:` links in SSR HTML,
  `wa.me/9190000100xx` links correct, `/community` link present 3× (desktop nav,
  mobile nav, footer)
- Filter logic exercised against the dataset: 10 query/category/locality cases
  all returned the expected rows, incl. the empty state

**Notes / follow-ups**

- Phone numbers are placeholders (`+91 90000 100xx`) and the page carries a
  visible notice saying so. Replace before this goes to real users.
- No DB model yet — intentionally static per the brief.
- A "submit a vendor" flow is stubbed to `/how-it-works`; wire it to a real
  form when the backend exists.
