"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Hub } from "@lucasmarkes/hairline/react";
import ListPropertyCTA from "@/components/property/ListPropertyCTA";

/* ──────────────────────────────────────────────────────────────────────────
   Shared home-page tokens.

   Every section of the home page carries this block verbatim. It is copied
   rather than extracted on purpose: the seven sections are built and edited
   independently and must have zero cross-imports between them. Do not
   paraphrase the values — the colour, motion and button systems only hold
   together because all seven files agree character for character.
   ────────────────────────────────────────────────────────────────────────── */

const PF = "font-[family-name:var(--font-playfair)]";

/** 32px orange rule + 11px uppercase label. The rule stays orange on every
    ground; only the label text changes to keep contrast. */
/* Small-type colour tiers. #C8541A and #9E6B3F only clear WCAG AA at display
   sizes, so every run of 11-16px type uses one of these instead. Measured
   ratios: #A8410F = 5.78 / 5.08 / 4.71 on #FAF8F5 / #F0E9DF / #EDE0CC;
   #7A4F2A = 6.65 / 5.85 / 5.42 on the same three; #E8762F = 5.73 on #1C1C1C
   and 6.46 on #1C0A00. #C8541A itself is kept for display-size emphasis and
   for the 32px rules, where 3:1 is the bar and it clears it. */

function SectionLabel({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "orange" | "ink" | "cream";
}) {
  const text =
    tone === "orange" ? "text-[#A8410F]" : tone === "ink" ? "text-[#1C1C1C]" : "text-[#FAF8F5]";
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px w-8 shrink-0 bg-[#C8541A]" />
      <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${text}`}>{children}</span>
    </div>
  );
}

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

/** Section-level entrance: opacity + a 10px rise. Never used per row. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0.2 : 0.48, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** The structural 1px rule that heads each section. It draws in from the
    left, which is what makes reading down the page feel like a gazette
    being ruled and set. Under reduced motion it is simply already there. */
function Rule({ color }: { color: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="h-px w-full origin-left"
      style={{ backgroundColor: color }}
      initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
      whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
      viewport={{ once: true, amount: 0.9 }}
      transition={{ duration: reduce ? 0.2 : 0.6, ease: EASE }}
    />
  );
}

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

// T1 — solid cream. Dark grounds only.
const T1_DARK = `group inline-flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] transition-colors duration-150 hover:bg-[#EDE0CC] ${FOCUS}`;

// T3 — text link, dark-ground pair appended. The desk's second action takes
// this tier so the band reads solid-then-link like every other section: two
// solid buttons side by side flattened the hierarchy the rest of the page
// keeps. T2_LIGHT is deliberately absent (no light ground in this file) and
// `@typescript-eslint/no-unused-vars` is an error here, so it is not declared.
const T3 = `group inline-flex items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${FOCUS}`;
const T3_DARK = `${T3} text-[#EDE0CC] hover:text-[#FAF8F5]`;

/** Must be the DIRECT parent of a hairline figure: the --hairline-* vars are
    inherited, and sibling plates on this page deliberately disagree. */
function Plate({
  children,
  vars,
  className,
}: {
  children: React.ReactNode;
  vars: CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={vars}>
      {children}
    </div>
  );
}

/* The desk plate is the one full ink inversion on the page — cream lit,
   orange silhouette — which is how the back cover announces itself.
   --hairline-plate must always equal the real background behind the figure. */
const PLATE_DESK = {
  "--hairline-plate": "#1C0A00",
  "--hairline-hi": "#FAF8F5",
  "--hairline-edge": "#C8541A",
  "--hairline-mid": "#9E6B3F",
  // NOT #1C1C1C: that is within a hair of the plate colour, so every stroke
  // meant to recede disappeared outright and the figure read as half-drawn.
  "--hairline-lo": "rgba(250,248,245,0.16)",
  // The darkest ground on the page needs the heaviest stroke, not the lightest.
  "--hairline-stroke": "1.3",
} as CSSProperties;

/* ──────────────────────────────────────────────────────────────────────────
   The five entries. Canonical order and numbering — never reorder,
   never renumber. The route word is the page this entry opens.
   ────────────────────────────────────────────────────────────────────────── */

const ENTRIES: { n: string; name: string; route: string; href: string }[] = [
  { n: "01", name: "Housing", route: "LISTINGS", href: "/listings" },
  { n: "02", name: "Phone numbers", route: "DIRECTORY", href: "/community" },
  { n: "03", name: "Buy & sell", route: "MARKETPLACE", href: "/marketplace" },
  { n: "04", name: "Pass it on", route: "MARKETPLACE", href: "/marketplace" },
  { n: "05", name: "The newspaper", route: "NEWSPAPER", href: "/newspaper" },
];

const LOCALITIES = [
  "Hiranandani Estate",
  "Hiranandani Meadows",
  "Rodas Enclave",
  "One Hiranandani Park",
];

/* The honesty ledger. Wording is fixed: do not condense, merge, reorder
   or soften these four. */
const NOTICES = [
  "Sanatani Community lists; it does not mediate. We do not employ or endorse the vendors in the directory, so check credentials before you hire anyone.",
  "Prices and condition notes on the marketplace are written by sellers. See the item in person before you pay for it.",
  "Directory entries marked as samples are placeholders, kept visible while we confirm real listings with residents one at a time.",
  "Browsing, listing and contacting anyone on this portal is free. There is no charge to residents at any point.",
];

const COLOPHON_HEADING = "text-[11px] font-bold uppercase tracking-[0.2em] text-[#1C1C1C]";

/**
 * The back cover and the colophon.
 *
 * Two sections in one file because they are one gesture: the dark desk panel
 * closes the numbering the masthead opened — it is Line 0, the fallback for
 * everything the five entries do not cover, and the only owner-listing path
 * on the page — and the cream colophon immediately below decelerates out of
 * it, repeating all five entries as leader-dot links, naming the localities
 * served, and setting every notice the product owes its readers.
 *
 * Renders no navbar and no footer; the layout supplies both, and the
 * layout's Footer follows the colophon.
 */
export default function HomeClosing() {
  return (
    <>
      {/* ═══════════════ THE DESK — ground #1C0A00 ═══════════════
          The same panel colour the community and marketplace pages already
          use for their closing blocks. A borrowed pattern, not a new one. */}
      <section
        className="w-full bg-[#1C0A00] px-5 sm:px-8 lg:px-12"
        style={{ paddingTop: "clamp(72px,9vw,132px)", paddingBottom: "clamp(72px,9vw,132px)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-14 lg:mb-18">
            <Rule color="rgba(240,233,223,0.22)" />
          </div>

          {/* items-end: the copy column runs far longer than the figure, and
              centring the short one left ~400px of bare ground under the CTAs. */}
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-12 lg:gap-x-10">
            {/* Copy — 7 of 12. */}
            <Reveal className="order-1 col-span-12 lg:col-span-7">
              <SectionLabel tone="cream">LINE 0 &middot; ASK THE DESK</SectionLabel>

              <h2
                className={`${PF} font-bold text-[#FAF8F5]`}
                style={{ fontSize: "clamp(1.9rem,3.5vw,3.1rem)", lineHeight: 1.04 }}
              >
                Still can&rsquo;t find it?{" "}
                <em className="not-italic text-[#C8541A]">Ask a neighbour.</em>
              </h2>

              {/* Weight 400 and line-height 1.78 exactly: light type on a dark
                  ground reads heavier and must not be set at 500. */}
              <p className="mt-6 max-w-[62ch] text-[16px] font-normal leading-[1.78] text-[#EDE0CC]">
                Five entries do not cover everything. If the number you need is not in the
                directory, if you know a trade that should be listed, if the newspaper got something
                wrong, or if you own a flat here and want it on the register — write in. A person
                reads it.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/contact" className={T1_DARK}>
                  Write to the desk
                  <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
                    →
                  </span>
                </Link>
                {/* Kept for its routing (anonymous → /register, resident →
                    become-owner modal, owner → /dashboard/new) but restyled
                    onto this page's T3 tier. It used to render a second solid
                    white pill with sentence-case orange type next to the one
                    above, which read as two different design systems touching
                    at the page's final conversion point. The className prop
                    replaces only the surface; no other caller is affected. */}
                <ListPropertyCTA className={T3_DARK}>
                  List your property
                  <span
                    aria-hidden
                    className="transition-transform duration-150 group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </ListPropertyCTA>
              </div>
            </Reveal>

            {/* Fig. 7 — 4 of 12, starting at column 9. Highest intensity on
                the page: the desk leans in.

                Hub, not Query. Query draws a handful of nodes — at 280px on
                the page's darkest ground it rendered as a faint ellipse and a
                circle, decoration rather than a figure. Hub draws a dense hub
                with eight tiles on dashed links, which is also the truer
                picture of what Line 0 is: one desk, every errand coming in. */}
            <Reveal delay={0.08} className="order-2 col-span-12 lg:col-span-4 lg:col-start-9">
              <Plate vars={PLATE_DESK} className="w-full max-w-[260px] lg:max-w-[320px]">
                <Hub
                  intensity={0.7}
                  theme="dark"
                  label="One desk, with every errand on the estate linked back to it"
                  className="w-full"
                />
              </Plate>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ THE COLOPHON — ground #FAF8F5 ═══════════════
          Tighter than the desk above, so the page decelerates rather than
          stopping. The id and scroll-mt are required: the "not an agency"
          column further up anchors here. */}
      <section
        id="colophon"
        className="w-full scroll-mt-24 bg-[#FAF8F5] px-5 sm:px-8 lg:px-12"
        style={{ paddingTop: "clamp(48px,6vw,80px)", paddingBottom: "clamp(48px,6vw,80px)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12">
            <Rule color="#9E6B3F" />
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            {/* ── Column 1 (4/12): the five entries, as leader-dot rows.
                   The bottom-of-page CTA set, and the one place on the page
                   the leader-dot idiom appears. ── */}
            <Reveal className="col-span-12 lg:col-span-4">
              <p className={COLOPHON_HEADING}>THE FIVE ENTRIES</p>
              <ol className="mt-5">
                {ENTRIES.map((entry) => (
                  <li key={entry.n}>
                    <Link
                      href={entry.href}
                      className={`group grid grid-cols-[auto_1fr] items-baseline gap-x-3 border-t border-[#EDE5D8] py-2.5 ${FOCUS}`}
                    >
                      <span className="text-[11px] font-bold tracking-[0.2em] text-[#A8410F]">
                        {entry.n}
                      </span>
                      <span className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3">
                        <span className="text-[14px] font-medium text-[#1C1C1C]">{entry.name}</span>
                        {/* The dotted leader. Hidden below 420px or the row
                            wraps into nonsense. */}
                        <span
                          aria-hidden
                          className="hidden h-0 self-end border-b border-dotted border-[#9E6B3F] transition-colors duration-150 group-hover:border-[#C8541A] min-[420px]:block"
                        />
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B] transition-transform duration-150 group-hover:translate-x-[3px]">
                          {entry.route}
                          <span aria-hidden>→</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Reveal>

            {/* ── Column 2 (3/12): where this serves. ── */}
            <Reveal delay={0.05} className="col-span-12 lg:col-span-3">
              <p className={COLOPHON_HEADING}>WHERE THIS SERVES</p>
              <ul className="mt-5">
                {LOCALITIES.map((locality) => (
                  <li
                    key={locality}
                    className="border-t border-[#EDE5D8] py-2.5 text-[14px] text-[#1C1C1C] first:border-t-0"
                  >
                    {locality}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] text-[#6B6B6B]">All in Thane.</p>
            </Reveal>

            {/* ── Column 3 (5/12): the notices. ── */}
            <Reveal delay={0.1} className="col-span-12 lg:col-span-5">
              <p className={COLOPHON_HEADING}>NOTICES</p>
              <div className="mt-5 space-y-3">
                {NOTICES.map((notice) => (
                  <p
                    key={notice}
                    className="max-w-[60ch] text-[12.5px] leading-[1.75] text-[#6B6B6B]"
                  >
                    {notice}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Sign-off. Static hairline, never animated. */}
          <div className="mt-12 h-px w-full bg-[#EDE5D8]" />
          <p className="mt-6 text-[12px] text-[#6B6B6B]">
            <span className={PF}>Hiranandani Estate, Thane.</span> Run for the residents of the
            estate.
          </p>
        </div>
      </section>
    </>
  );
}
