# Rent default, news image uploads

Three asks. One of them turns out to need no change.

## 1. Listings should default to Rent

Today, with no `?listingType=` in the URL:
- `api/properties/route.ts:69` applies no filter, so **both** rent and sale come back
- `FilterPanel.tsx:19` highlights **SALE** (`searchParams.get("listingType") || "SALE"`)
- `ListingsContent.tsx:96` labels the count "available for sale"

So the UI claims sale, the data is everything, and nothing says rent. Default
to RENT in all three, and send `listingType=RENT` on the fetch when the param
is absent so the copy and the results agree.

## 2. Community sort — already correct

`(public)/community/page.tsx:34` is already `orderBy: { createdAt: "desc" }`,
and `createdAt` **is** the date added. Verified against the live table: the two
helpline rows re-created at 14:36 sit above rows created at 14:22. The table
renders in query order - nothing re-sorts it - so a newly added contact does
land on top.

What probably looks wrong: all 250 imported rows were created within the same
six minutes, so their order is just reverse-import order and reads as arbitrary.

No change made. The open question is whether "recently added" should also mean
"recently edited" - that would be `updatedAt`, and is a one-line change if
wanted.

## 3. News: multiple images, drag and drop, S3

`NewsItem.imageUrl String?` holds one pasted URL. Replace with uploads.

- `imageUrl String?` -> `imageUrls String[]`, backfilled from the existing
  column, matching how `phones` was done
- New `ImageDropzone` component. `react-dropzone@15` is already a dependency and
  the upload flow already exists: `GET /api/upload` returns a presigned S3 URL,
  the browser PUTs the file, and `publicUrl` is stored. Same contract the
  marketplace and listing forms use, so no new S3 surface.
- Consumers to update: `api/news/route.ts`, `admin/news/CreateNewsForm.tsx`,
  `(public)/newspaper/page.tsx`, `components/newspaper/TodaysNewsFeed.tsx`

Constraints inherited from `/api/upload`: 2 MB per image, jpeg/png/webp/heic,
20 uploads per user per day, auth required.

## Tasks

- [x] Listings default to RENT - `DEFAULT_LISTING_TYPE` in `ListingsContent`,
      matching default in `FilterPanel`, injected into both fetches
- [x] Migration `20261108090000_news_item_image_urls`: `imageUrls text[]`,
      backfilled, `imageUrl` dropped; Prisma ledger baselined
- [x] `ImageDropzone` - drag and drop, instant previews, per-file errors,
      remove, 2 MB / 6 image caps
- [x] Wired into the news admin form, replacing the URL input
- [x] Display updated: `newspaper/page.tsx`, `TodaysNewsFeed`
- [x] `build:check` clean; verified in Chrome - Rent pill is default, dropzone
      renders, `/api/upload` returns a signed URL for the bucket
- [ ] Commit

## Review

Two changed, one did not need changing.

**Rent default** was three disagreeing defaults, not one: the API filtered
nothing, the filter pills highlighted SALE, and the result count said "available
for sale". All three now derive from `DEFAULT_LISTING_TYPE`, and the fetch sends
it explicitly so the copy and the results cannot drift apart again.

**News images** follow the `phones` precedent - a real `text[]`, backfilled,
old column dropped. The uploader reuses the existing presigned-URL flow, so
files go browser -> S3 without passing through the server and there is no new
upload surface.

Worth knowing:
- `/api/upload` writes every object under the `properties/` prefix regardless of
  what is being uploaded, so news images land there too. Harmless, but the
  prefix name is now a lie. Changing it means touching the shared route.
- The API only accepts URLs under `NEXT_PUBLIC_AWS_S3_BUCKET_URL`. It fails
  closed when that is unset - an earlier draft fell back to `"https://"`, which
  `startsWith` matches for any HTTPS URL, i.e. no check at all.
- Inherited caps: 2 MB per image, jpeg/png/webp/heic, 20 uploads per user per
  day, 6 images per news item.

**Community sort needed no change.** It was already `createdAt desc`, and
`createdAt` is the date added - verified against the live table. The 250
imported rows were all created within six minutes of each other, so their order
reads as arbitrary, which is probably what looked wrong. If "recently added"
should also surface "recently edited", that is `updatedAt` and a one-line
change.
