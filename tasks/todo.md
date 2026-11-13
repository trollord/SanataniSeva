# News section revamp

**Problem.** A post's body is clamped to three lines in a carousel with no way
through, so the registration link in the Dr Hema post — the whole reason it was
posted — is unreachable. Line breaks collapse into one run-on paragraph and URLs
render as dead text. Portrait flyers are cropped to a landscape hero, losing
their titles, and the headline sits on top of busy artwork.

## Tasks
- [x] `NewsBody` — preserve line breaks, linkify URLs and phone numbers
- [x] `/news/[id]` — own page per post: full poster, full text, live links
- [x] SEO + share metadata (OpenGraph image = the poster)
- [x] Replace the hero carousel with a featured card + grid, each linking out
- [x] Posters shown contained, never cropped through their own titles
- [x] Drafts 404 for the public, readable by an admin
- [x] Polish pass: empty states, spacing, content clearing the fixed navbar
- [x] Build, verify at three widths, commit

## Decisions
- A post gets a real URL (user's call), so it can be pasted into the estate
  WhatsApp group and indexed. A modal would have left it unshareable.
- Carousel replaced by a grid rather than restyled: with three or four posts
  nothing should be hidden behind a rotation, and auto-advance interrupts
  someone mid-read.
- Posters are `object-contain`, not `cover`. These are dense A4 flyers whose
  value is the text printed on them; cropping removes the title.

## Review

Every item above is done and checked in a running build.

**What changed**
- `src/components/news/NewsBody.tsx` — new. Keeps the line structure of a post
  pasted from WhatsApp and turns its URLs and phone numbers into live links.
  Splits on a token regex rather than replacing inside the text, so a phone
  number sitting inside a URL cannot match twice, and trailing punctuation is
  kept out of the href.
- `src/app/(public)/news/[id]/page.tsx` — new. The post's own page: poster at
  full size, body as written, OpenGraph image for WhatsApp previews. A draft
  404s for the public and renders for an admin behind a "only you can see this"
  banner.
- `src/components/newspaper/TodaysNewsFeed.tsx` — rewritten. The carousel is
  gone; a lead card and a grid now show every post at once, each linking to its
  page. Also dropped `framer-motion` and the client boundary from this file —
  it is a server component now.
- `src/app/sitemap.ts` — `/newspaper` and each published post added. Drafts are
  excluded.
- `MarketplaceGrid.tsx`, `ListingsContent.tsx` — an empty catalogue no longer
  claims "no match for your filters" when the visitor set no filters.

**Verified, not assumed**
- Clicked feed → post in a real browser: lands on `/news/<id>`, 37 line breaks
  preserved, and all three links live — the Instagram reel, the Art of Living
  registration URL, and `tel:+919833581950`. That registration link was the
  reachability bug this work existed to fix.
- Draft post: anonymous 404 with no headline in the body; signed in as ADMIN,
  200 with the draft banner. Draft absent from the sitemap.
- No horizontal overflow at 390, 820 or 1440px.
- `npm run build` compiles clean, 58/58 static pages.

**Left alone, deliberately**
- The floating navbar still passes over content on scroll. That is how the
  navbar behaves on every page, so changing it is a site-wide design decision
  rather than a news fix.

## Admin-managed community categories (proposed 2026-11-11, awaiting go-ahead)

Today the 24 categories are a fixed list in `src/lib/community.ts`; admin can only pick from it.

- [ ] Add `CommunityCategory` table (key, label, icon, active) + hand-written migration seeding the 24 existing rows
- [ ] `getCommunityCategories()` server helper (cached) replacing direct `COMMUNITY_CATEGORIES` reads
- [ ] Admin API: create / rename / deactivate a category (block delete while contacts use it)
- [ ] Admin UI: "Manage categories" dialog on /admin/community, plus "+ Add category" in the contact form dropdown
- [ ] Swap the four API validators, CSV tools, public directory, home page trade count to the DB list
- [ ] Icon picker limited to the icons already bundled; default icon for new categories
- [ ] Verify: add a category in admin, assign a contact, see it on /community and in CSV export

## Contact number on listing forms (2026-11-12)

Listings show the lister's account number (`User.phone`), which Google sign-in
never collects, so a listing could go live with no way to call about it.

- [x] Shared `ContactPhoneField` + `useAccountPhone()` (`src/components/ui/ContactPhoneField.tsx`),
      built on the registration `PhoneInput`; placeholder `9999999999`, helper
      line "Saved to your profile and used on all your listings."
- [x] Field added to all four listing forms: property new (beside the "Show my
      phone number publicly" toggle) and edit, marketplace item new and edit
      (`ItemForm`, beside its phone toggle). Required on the client.
- [x] Pre-fill: new forms read `GET /api/user/phone` (session has no phone);
      edit forms read the listing owner's/seller's phone from the existing
      dashboard GETs, so an admin editing sees and saves the owner's number.
- [x] Server: `saveContactPhone()` (`src/lib/contact-phone.ts`) in POST/PUT of
      `/api/properties` and `/api/items`. Validates with the registration rule
      (`validatePhone`, E.164 with country code), saves to the listing owner;
      400 if absent and the account has none.
- [x] Verified: tsc clean, eslint 0 errors on touched files, `/api/user/phone`
      401 unauthenticated, write routes 401 unauthenticated, form pages 307 to
      /login. No signed-in submit was made (production DB).
