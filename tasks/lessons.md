# Lessons

## App shells must own the viewport, not grow with their nav
*2026-11-10 — admin sidebar*

`AdminShell` used `min-h-screen flex` with the sidebar as a normal flex child.
Every nav link added height to the **document**, so once the list reached 11
items the page scrolled and the "Back to site" footer sat below the fold.

A shell with a persistent sidebar should be exactly one viewport tall and let
only the content column scroll:

- root: `h-dvh flex overflow-hidden` (`h-dvh`, not `h-screen` — `100vh`
  overshoots on mobile where the URL bar is counted)
- nav: `flex-1 min-h-0 overflow-y-auto` so the nav, not the page, scrolls
- content: `flex-1 min-h-0 overflow-auto`

`min-h-0` matters on every flex child that scrolls: a flex item defaults to
`min-height: auto`, which refuses to shrink below its content and quietly
defeats `overflow-auto`.

Check before shipping: does anything rely on the *document* scrolling
(`window.scrollTo`, `scrollIntoView`, `sticky` positioned against the page)?
Those break when the scroll container moves inward.

`DashboardSidebar` already solved this with `fixed h-screen overflow-y-auto`;
the admin shell had simply never been given the same treatment.
