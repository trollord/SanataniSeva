# Community directory — single-screen redesign

**Goal.** `/community` fits one viewport. No document scroll; the table scrolls
inside itself. Paging resets the table to the top. Categories move to a left
rail with multi-select and a clear control.

**Why the chrome had to go.** Hero (200px) + tabs (84) + search (54) + 25
wrapping pills (190) + count row (76) + pager (60) + disclaimer (104) + page
padding (224) ≈ 990px of furniture before a single row — more than a laptop
viewport. Adding `overflow` to the table alone would not have fixed it.

## Tasks
- [x] Route group `(fullscreen)` — navbar, no footer; move `community/` into it
- [x] Page shell: `h-dvh` flex column at `lg+`, normal document flow below
- [x] `CommunityHero` — compact variant (drop the duplicated eyebrow)
- [x] `CommunityTabs` — panels stretch instead of stacking
- [x] `CommunityDirectory` — left rail, multi-select, sticky head, inner scroll
- [x] Reset table scroll on page change and on filter change
- [x] `BusTimings` — scrolls inside the same shell
- [x] `loading.tsx` — match the new layout so nothing shifts on swap
- [x] Build, verify, commit

## Decisions
- Footer hidden here (user's call) — `/community` is an app screen, not a
  document. Disclaimer survives as a compact line inside the shell.
- Multi-select categories: empty set means "All". Facet counts respect the
  search box and locality, so a visible count is never a dead end.
- Full-height shell applies at `lg+` only. A phone cannot show rail, chrome
  and table at once; below `lg` the rail becomes the existing pill row and the
  page scrolls normally.

## Review

Done. `/community` is one viewport from `md` up; phones keep document scroll.

Measured with puppeteer at three widths:

| width | horizontal overflow | page scroll | table |
|---|---|---|---|
| 390 (phone) | none | 3291px — by design | 348px in a 348px box |
| 820 (tablet) | none | none | fits |
| 1440 (laptop) | none | none | 1472px of rows in a 560px box |

Behaviour: paging resets the table to the top (scrollTop 400 → 0); two ticked
categories return their union (61 + 31 = 92 shown); both stay ticked; the bus
panel is `display:none` when inactive rather than merely `hidden`.

### Two bugs found while building this
- Every flex ancestor of the table needed `min-w-0`. Without it `min-width:auto`
  let the 640px table widen the whole page, and `html{overflow-x:clip}` in
  globals.css hid the symptom by cropping rather than scrolling — the page
  looked merely "cut off" on a phone.
- `hidden` on a tab panel loses to a `flex` class: equal specificity, and
  preflight loses on source order. The inactive panel was still laid out.
  Fixed with `[&[hidden]]:hidden`.

### Not done
- The table's `min-w-[640px]` still applies from `md` up, so a narrow tablet in
  portrait scrolls the table sideways rather than dropping a column. Dropping
  the Category column earlier would avoid it.
