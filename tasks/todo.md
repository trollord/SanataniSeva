# Pagination everywhere, searchable community table

## 1. Pagination at 25

One shared module, `components/admin/TablePager.tsx`, rather than eight copies:
`PAGE_SIZE`, `resolvePage()` (clamps a stale `?page=`), a link-based
`TablePager` for server-rendered tables, and `ClientPager` + `paginate()` for
the two tables whose rows live in component state.

| table | before | after |
|---|---|---|
| admin/community | 50/page | 25/page |
| admin/listings | `take: 50`, no pager | 25/page |
| admin/items | `take: 100`, no pager | 25/page |
| admin/news | `take: 100`, no pager | 25/page |
| admin/newsletter | unbounded | 25/page |
| admin/users (client) | unbounded | 25/page |
| dashboard/inquiries | unbounded | 25/page |
| dashboard listings (client) | unbounded | 25/page |
| public community directory | already 25 | unchanged |

Pager links carry the page's existing query string, so status tabs and the
search term survive paging. Not paginated, deliberately: `admin/analytics`
(a fixed top-8 summary), the listing detail page, and the CSV preview table -
none are browsable record lists.

## 2. Community search across all columns

A `searchText` column, `GENERATED ALWAYS ... STORED`, concatenating name,
contact person, service, category, locality, address, tags and phones - the
phones twice, as written and digits-only, so `9820886428` finds a number stored
as `98208 86428`.

**Why generated rather than an OR of eight ILIKEs:** a single column can carry a
single index. With `pg_trgm` + GIN, `LIKE '%term%'` is an index scan - confirmed
with EXPLAIN:

    Bitmap Heap Scan on "CommunityContact"
      ->  Bitmap Index Scan on "CommunityContact_searchText_trgm_idx"
            Index Cond: ("searchText" ~~ '%9876999%')
    Execution Time: 0.221 ms

A leading wildcard cannot use a B-tree, so the OR form would seq-scan every row
eight times per keystroke. Generated also means it can never drift from the row.

`array_to_string()` is only STABLE and is rejected in a generated expression, so
phones are listed by subscript, 1..5, matching the cap the API enforces.

Search lives in the URL (`?q=`), debounced 300ms, and resets to page 1.

## Note for later

`searchText` is in the Prisma model so filtering is typed, but the DB owns it.
`prisma migrate dev` would try to recreate it as a plain column - migrations for
this table stay hand-written. Flagged in the schema comment.

## Review

Verified against live data, not just compiled:
- Typing `9820886428` (no spaces) returned the two contacts stored as
  `98208 86428`, and the URL became shareable
- `Showing 1–25 of 250`, `Page 1 of 10`, Previous disabled on page 1
- admin/users, the client-paged table, shows `Showing 1–4 of 4` with both its
  mobile and desktop renderers on the same slice
