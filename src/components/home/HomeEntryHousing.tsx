"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Terrain } from "@lucasmarkes/hairline/react";

/* ───────────────────────────────────────────────────────────────────────────
   ENTRY 01 — HOUSING

   The page's dramatic peak and its only full ink band: the tallest section,
   the largest hairline figure, and the one place the live listing counts
   appear — inside a sentence, never as a counter.

   Shared tokens below are copied in verbatim on purpose. Each of the seven
   home components must build independently, with zero cross-imports between
   them.
   ─────────────────────────────────────────────────────────────────────────── */

const PF = "font-[family-name:var(--font-playfair)]";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

/* Small-type colour tiers. #C8541A and #9E6B3F only clear WCAG AA at display
   sizes, so every run of 11-16px type uses one of these instead. Measured
   ratios: #A8410F = 5.78 / 5.08 / 4.71 on #FAF8F5 / #F0E9DF / #EDE0CC;
   #7A4F2A = 6.65 / 5.85 / 5.42 on the same three; #E8762F = 5.73 on #1C1C1C
   and 6.46 on #1C0A00. #C8541A itself is kept for display-size emphasis and
   for the 32px rules, where 3:1 is the bar and it clears it. */

function SectionLabel({ children, tone }: { children: React.ReactNode; tone: "orange" | "ink" | "cream" }) {
  const text =
    tone === "orange" ? "text-[#A8410F]" : tone === "ink" ? "text-[#1C1C1C]" : "text-[#FAF8F5]";
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px w-8 shrink-0 bg-[#C8541A]" />
      <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${text}`}>{children}</span>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
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

// `vars` is always one of the seven PLATE_VARS objects, passed straight through.
function Plate({
  children,
  vars,
  className,
}: { children: React.ReactNode; vars: CSSProperties; className?: string }) {
  return (
    <div className={className} style={vars}>
      {children}
    </div>
  );
}

// --hairline-plate always equals the real background behind the figure (#1C1C1C here).
const PLATE_HOUSING = {
  "--hairline-plate": "#1C1C1C",
  "--hairline-hi": "#C8541A",
  "--hairline-edge": "#F0E9DF",
  "--hairline-mid": "#9E6B3F",
  "--hairline-lo": "rgba(240,233,223,0.18)",
  "--hairline-stroke": "1.0",
} as CSSProperties;

/* ─────────────────────────────────────────────────────────────────────────── */

export interface HomeEntryHousingProps {
  /** stats[0] — prisma.property.count({ where: { status: "ACTIVE" } }). Currently 7. */
  activeListings: number;
  /** stats[2] — prisma.user.count({ where: { role: "OWNER" } }). Currently 4. */
  owners: number;
}

/**
 * The register line is derived, never hardcoded, and the numbers only ever
 * appear inside a sentence — no counters, no metric tiles.
 */
function registerSentence(activeListings: number, owners: number): string {
  if (activeListings === 0) {
    return "The register is open and waiting for its first entry. If you own a flat here, yours can be the one.";
  }
  if (owners === 0) {
    return `On the register today: ${activeListings} ${activeListings === 1 ? "home" : "homes"}.`;
  }
  return `On the register today: ${activeListings} ${
    activeListings === 1 ? "home" : "homes"
  }, listed by ${owners} ${owners === 1 ? "owner" : "owners"}.`;
}

export default function HomeEntryHousing({ activeListings, owners }: HomeEntryHousingProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#1C1C1C] px-5 sm:px-8 lg:px-12"
      style={{ paddingTop: "clamp(80px,10vw,152px)", paddingBottom: "clamp(80px,10vw,152px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        {/* The section rules itself, then the content follows in behind. */}
        <div className="mb-14 lg:mb-20">
          <Rule color="rgba(240,233,223,0.22)" />
        </div>

        {/* items-end, not items-center: the two columns are very unequal in
            height, and centring the short one pooled ~200px of bare ink under
            both. Ending them together lets the band close on the CTA. */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-14 lg:gap-x-10">
          {/* Figure first, cols 1–5: the eye is led in from the left gutter. */}
          <Reveal className="order-1 col-span-12 lg:col-span-5">
            {/* The page's largest figure, and it owns a 5-of-12 column, so the
                plate is sized to fill most of it. Figures draw at 5:4 of their
                parent's width, so raising max-width scales cleanly. */}
            <Plate vars={PLATE_HOUSING} className="w-full max-w-[360px] lg:max-w-[480px]">
              <Terrain
                intensity={0.5}
                theme="dark"
                label="A model of the estate: towers rise where you point"
                className="w-full"
              />
            </Plate>
          </Reveal>

          {/* Copy, cols 7–12. */}
          <div className="relative order-2 col-span-12 lg:col-span-6 lg:col-start-7">
            {/* Decorative duplicate of the numeral already set in the section
                label. It used to sit at the column's top-left, where its
                strokes ran straight through the "ENTRY 01 · HOUSING" label at
                every width. Moved to the bottom-right — the corner Entries 04
                and 05 already use, and the one corner of this column that no
                text occupies. */}
            <span
              aria-hidden
              className={`${PF} pointer-events-none absolute bottom-[-1.5rem] right-[0.5rem] select-none font-bold leading-none`}
              style={{ color: "rgba(240,233,223,0.07)", fontSize: "clamp(3.5rem,7vw,7rem)" }}
            >
              01
            </span>

            <Reveal delay={0.06} className="relative z-10">
              <SectionLabel tone="cream">ENTRY 01 · HOUSING</SectionLabel>

              <h2
                className={`${PF} font-bold text-[#FAF8F5]`}
                style={{ fontSize: "clamp(1.9rem,3.4vw,3.1rem)", lineHeight: 1.05 }}
              >
                Find a house, and talk to the person who{" "}
                <em className="not-italic text-[#C8541A]">owns it.</em>
              </h2>

              {/* Light type on dark reads heavier, so leading is raised to 1.78. */}
              <p className="mt-6 max-w-[62ch] text-[16px] font-normal leading-[1.78] text-[#EDE0CC]">
                Every home on the register is put up by its owner, not by an agent acting for them.
                You see the asking price, the building, the floor and the terms — then you speak to
                the owner yourself. Rent or buy; the register carries both.
              </p>

              <div className="mt-8 h-px w-full max-w-[520px] bg-[rgba(240,233,223,0.14)]" />
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8762F]">
                  REGISTER
                </span>
                <p className="text-[15px] leading-[1.6] text-[#FAF8F5]">
                  {registerSentence(activeListings, owners)}
                </p>
              </div>

              <div className="mt-7 h-px w-full max-w-[520px] bg-[rgba(240,233,223,0.14)]" />
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#EDE0CC]">
                FREE TO BROWSE · FREE TO LIST
              </p>

              <div className="mt-9">
                <Link href="/listings" className={T1_DARK}>
                  Open the housing register
                  <span
                    aria-hidden
                    className="transition-transform duration-150 group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
