// Original home page preserved in home-v2/page.tsx
// Temporarily pointing / to home-v2.
//
// `dynamic` is declared here rather than re-exported from home-v2: Next 16
// parses route segment config statically at compile time and rejects a
// re-export it cannot follow.
export const dynamic = "force-dynamic";
export { default } from "./home-v2/page";
