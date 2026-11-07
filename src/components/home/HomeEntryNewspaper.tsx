"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Riffle } from "@lucasmarkes/hairline/react";

/* ────────────────────────────────────────────────────────────────────────────
   ENTRY 05 — THE NEWSPAPER

   Closes the numbered index of what this portal is for. Ground is the warm
   #F0E9DF surface and the rhythm opens back up after the tight diptych above.

   Two things make this entry its own thing on the page:

   1. It opens with a masthead, not a label. Every other section runs
      label → heading; a newspaper puts its nameplate first, so the dark
      #1C0A00 plate sits above the section label. That inversion is deliberate.
      It is also the page's only inset dark panel on a light ground.
   2. Riffle is the one figure in the set the keyboard can drive, which is the
      right affordance on the one entry that is purely about reading — hence
      the caption names the arrow keys out loud.

   The newspaper table is empty today, so the empty state is the real state.
   It does not apologise: it teaches the reader about the bulletin strip that
   will run across the very top of this page the moment a notice is posted,
   and it lists the five standing sections an edition carries. No headline is
   ever fabricated and no "0 articles" counter is printed.
   ──────────────────────────────────────────────────────────────────────────── */

/* ── Shared page tokens. Copied verbatim into each home section so every file
      stays independently buildable with no cross-imports between siblings. ── */

const PF = "font-[family-name:var(--font-playfair)]";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

// T2 — outlined. Light grounds only.
const T2_LIGHT = `group inline-flex items-center gap-2 rounded-lg border border-[#1C1C1C] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] transition-colors duration-150 hover:bg-[#1C1C1C] hover:text-[#FAF8F5] ${FOCUS}`;

// T3 — text link. The ground-correct colour pair is appended at the call site.
const T3 = `group inline-flex items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${FOCUS}`;

// Riffle sits on #F0E9DF, so --hairline-plate is #F0E9DF. Without these vars
// the default strokes are all but invisible on the warm palette.
const PLATE_PAPER = {
  "--hairline-plate": "#F0E9DF",
  "--hairline-hi": "#C8541A",
  "--hairline-edge": "#1C1C1C",
  "--hairline-mid": "#9E6B3F",
  "--hairline-lo": "#EDE0CC",
  "--hairline-stroke": "1.2",
} as CSSProperties;

/* ── Local primitives ─────────────────────────────────────────────────────── */

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

/** The section's structural rule. Draws itself in from the left as you reach it. */
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

/**
 * Direct parent of a hairline figure. Carries the --hairline-* vars and sizes
 * the figure through max-width alone — figures fill their parent's width at a
 * 5:4 ratio, so a height here would only fight them.
 */
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

/** Every CTA on this page ends with exactly this glyph, and nothing else. */
function Arrow() {
  return (
    <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
      →
    </span>
  );
}

/* ── Props ────────────────────────────────────────────────────────────────── */

/* ── Section ──────────────────────────────────────────────────────────────── */

export default function HomeEntryNewspaper() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#F0E9DF] px-5 sm:px-8 lg:px-12"
      style={{ paddingTop: "clamp(68px,8.5vw,124px)", paddingBottom: "clamp(68px,8.5vw,124px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 lg:mb-16">
          <Rule color="#9E6B3F" />
        </div>

        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          {/* ── Copy column, cols 1–7 ───────────────────────────────────── */}
          <Reveal className="relative order-1 col-span-12 lg:col-span-7">
            {/* Decorative duplicate of the 05 already set in the section label. */}
            <span
              aria-hidden
              className={`${PF} pointer-events-none absolute bottom-[-1rem] right-[1rem] select-none font-bold leading-none`}
              style={{ color: "#EDE0CC", fontSize: "clamp(3.5rem,7vw,7rem)" }}
            >
              05
            </span>

            <div className="relative z-10">
              <SectionLabel tone="ink">ENTRY 05 · THE NEWSPAPER</SectionLabel>

              <h2
                className={`${PF} font-bold text-[#1C1C1C]`}
                style={{ fontSize: "clamp(1.8rem,3.1vw,2.8rem)", lineHeight: 1.06 }}
              >
                What happened on the estate,{" "}
                <em className="not-italic text-[#C8541A]">written down.</em>
              </h2>

              {/* Body is ink here: the muted body grey is 4.42:1 on this ground and fails. */}
              <p className="mt-6 max-w-[62ch] text-[16px] leading-[1.7] text-[#1C1C1C]">
                The estate newspaper carries notices, events, society announcements and the small
                local news that never makes a city paper. Published as full editions you can read
                page by page, with shorter notices posted as they come in.
              </p>

              {/* "Open the newspaper", never "read past editions" — the
                  archive may be just as empty as the front page. */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link href="/newspaper" className={T2_LIGHT}>
                  Open the newspaper
                  <Arrow />
                </Link>
                <Link href="/contact" className={`${T3} text-[#1C1C1C] hover:text-[#A8410F]`}>
                  Send us a notice
                  <Arrow />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ── Fig. 6, cols 9–12 ───────────────────────────────────────── */}
          <Reveal
            delay={0.08}
            className="order-2 col-span-12 lg:col-span-4 lg:col-start-9 lg:self-center"
          >
            <Plate vars={PLATE_PAPER} className="w-full max-w-[240px] lg:max-w-[280px]">
              <Riffle
                intensity={0.45}
                theme="light"
                label="A tray of editions. The arrow keys walk through them."
                className="w-full"
              />
            </Plate>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
