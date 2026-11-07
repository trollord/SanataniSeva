# One dropdown, one popup

The admin contact dialog exposed that the app has three dropdown
implementations and two popup implementations. Converge on one of each.

## Audit

**Popups** — `ui/Modal` is already the house design (Playfair title, `#FF5F15`,
rounded-2xl, bottom-sheet on mobile with a drag handle) and 6 files use it:
`InterestModal`, `BecomeOwnerModal`, `ItemInterestModal`, `WhatsAppShare`,
`DashboardListings`, `admin/listings/[id]`.

The outliers are the ones to convert:
- `admin/community/ContactFormDialog` — Base UI `ui/dialog` (mine)
- `dashboard/new/page.tsx` — Base UI `ui/dialog`
- `community/AddContactModal` — hand-rolled `fixed inset-0`

Not converted, deliberately — these are not form popups and share nothing with
the dialog pattern: `PropertyGallery` (lightbox), `Navbar` /
`MobileFilterToggle` / `AdminShell` / `ui/sheet` (nav drawers), `GuidedTour`
(coach marks), `DisclaimerPopup` (full-bleed first-visit notice).

**Dropdowns** — 18 files across three implementations:
- Base UI `ui/select` (7): `dashboard/new`, `dashboard/listings/[id]/edit`,
  `ContactForm`, `SearchBar`, `ItemForm`, `MarketplaceGrid`, `AddContactModal`
- native `<select>` (11): `ListingActions`, `CreateNewsForm`, `admin/users`,
  `ItemAdminActions`, `CommunityAdminActions`, `dashboard/new`, `PhoneInput`,
  `ListingsContent`, `NewspaperIndex`, `FilterPanel`, `CommunityDirectory`
- `SearchableSelect` (1, new)

## Decisions

**One component, two shapes.** `SearchableSelect` gains a `variant`: `default`
(rounded-lg, grey border — forms and admin) and `pill` (rounded-full,
`#e4e9ea` — the public filter bars, where it sits beside a pill search box).
Forcing one shape would break whichever context it was not designed for;
CLAUDE.md says match the surrounding pattern, so the component is shared and
the shape follows its neighbours.

**Search appears only when it earns its place** — default is on above 7
options. A 3-item status picker gets no search box.

**`ui/Modal` grows a `size` and a `footer` slot** rather than the form dialog
keeping its own chrome. That is what makes the admin dialog look like the rest
of the app instead of like Base UI's default.

**`PhoneInput`'s country selector stays as-is.** It is a flag + dial-code combo
widget, not a value picker, and routing it through a generic select would lose
the flag column.

## Tasks

- [x] `SearchableSelect`: `variant` (default | pill), `size` (sm | md),
      `disabled`, `invalid`, `leadingIcon`, hidden input for `name`
- [x] `ui/Modal`: `size` (sm | lg) and a `footer` slot that switches the panel
      to fixed header / scrolling body / fixed footer. Existing six callers
      untouched — the new layout only engages when `footer` is passed.
- [x] 3 popups converted: `ContactFormDialog`, `AddContactModal`,
      `dashboard/new` skip-photos confirm
- [x] 11 native `<select>` converted directly
- [x] 17 Base UI `Select` blocks converted *without touching their files* —
      `ui/select.tsx` is now a shim over `SearchableSelect`
- [x] `next build` exit 0 (69 routes, same 4 pre-existing warnings)
- [x] Verified in Chrome: community pill filter, marketplace condition filter
      (shim path), admin edit dialog
- [ ] Commit

## Review

Every dropdown in the app is now one component and every form popup is one
shell.

The leverage was in `ui/select.tsx`. Rewriting 17 `<Select><SelectTrigger>…`
blocks by hand across 7 files would have been slow and easy to get wrong, so
that module became a compatibility shim instead: `Select` walks its children,
reads the placeholder off `SelectValue` and the options off the `SelectItem`s,
and renders `SearchableSelect`. The descriptor components return null and are
never mounted. Every call site kept its own trigger classes — several use `!`
utilities for sizing, which still win — so nothing had to change in those files
and nothing about their layout moved.

Shapes, not uniformity: `variant="pill"` for the public filter bars, where the
control sits beside a rounded-full search box, and the default rounded-lg
elsewhere. One shape everywhere would have looked wrong in whichever context it
was not designed for.

Deliberately left alone, because they are not dropdowns or form popups:
`PropertyGallery` (lightbox), `Navbar` / `MobileFilterToggle` / `AdminShell` /
`ui/sheet` (nav drawers), `GuidedTour` (coach marks), `DisclaimerPopup`
(first-visit notice), and `PhoneInput`'s country picker, which is a flag +
dial-code widget rather than a value list.

One visual change worth flagging: the newspaper archive's month/year filters
used that page's editorial palette (`#E5DDD4` border, `#C8541A` focus). They now
use the shared control, so they look like the rest of the app rather than like
the newspaper page.
