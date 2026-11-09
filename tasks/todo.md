# Phone numbers: validate, split, format

Numbers were stored however the spreadsheet happened to write them - "9867856939",
"98678 56939", "022 2536 6401", "100". Now parsed, validated and stored in one
canonical form, with the dialling code separated from the local number.

## The numbering plan

Confirmed against the DoT/TRAI plan and corroborated by the data:
- Every Indian number is exactly 10 digits once +91 and the trunk "0" are removed
- Mobile: 10 digits beginning 6, 7, 8 or 9 -> `+91 98765 43210`
- Landline: STD + subscriber = 10 digits. Metro STD codes are two digits
  (Delhi 11, Mumbai 22, Pune 20, Kolkata 33, Hyderabad 40, Chennai 44,
  Ahmedabad 79, Bengaluru 80), others three or four. Dialled domestically with
  a leading 0 -> `022 2597 2040`
- Toll-free begins 1800 -> `1800 229 944`
- **Emergency and helpline short codes are 3-5 digits and take no prefix at
  all** - 100, 101, 102, 108, 112, 14567. They must never be rewritten as +91,
  which is exactly what a naive "prepend the country code" rule would do.

## What changed

`src/lib/phone.ts` - one parser used by the form, all three APIs, the CSV
importer and the normalisation script, so nothing can disagree about what a
valid number is. Returns `{ extension, number, kind, display, e164, valid,
reason }`.

- Admin dialog: a dialling-code select plus a number field, per number
- All three APIs validate through the same parser and store the canonical form,
  reporting the specific reason ("…has 9 digits") rather than a generic error
- CSV gains `extension` and `number` columns, pipe-separated and index-aligned
  for multiple numbers; a legacy single `phones` column is still accepted
- WhatsApp is now offered only for mobiles - wa.me on a landline, a toll-free
  line or `100` is a dead link

## The data

250 contacts, 273 numbers. 216 contacts reformatted.

| kind | count | stored as |
|---|---|---|
| mobile | 243 | `+91 98765 43210` |
| landline | 16 | `022 2597 2040` |
| short code | 8 | `100` |
| toll-free | 1 | `1800 229 944` |
| unformatted | 5 | left exactly as found |

Those 5 are 9-digit numbers - a digit was lost before this project existed.
They were **not** guessed at or padded: a directory showing a confidently
formatted wrong number is worse than one showing the original. All 5 are
already PENDING, so they are invisible publicly and listed in the admin panel
for repair.

Three numbers were stored as bare 10-digit landlines and are now
`022 3504 7727`, `022 6855 6855` and `020 2714 6668`. The last is a Pune code
on the estate post office - mechanically correct from the digits, but worth a
human check.

## Review

Verified rather than assumed: the parser was run over every real shape in the
table before any row was touched, and the rendered page was checked for all
four `tel:` forms - `tel:+91…`, `tel:0…`, `tel:1800…`, and a bare `tel:NNN`
for short codes. WhatsApp links produce `wa.me/919867856939`, not a doubled 91.

Environment note: `.next/dev/types/` keeps acquiring `"… 2.ts"` conflict copies,
the signature of iCloud Drive syncing `~/Desktop`. One of them broke
typechecking with a duplicate identifier. tsconfig now excludes `**/* 2.ts`.
Worth turning off Desktop sync for this folder.
