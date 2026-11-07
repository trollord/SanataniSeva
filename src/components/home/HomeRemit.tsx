"use client";

import { motion, useReducedMotion } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────────────
   Shared home-page tokens. Copied verbatim into each of the seven home
   components on purpose: every file stays independently buildable with zero
   cross-imports between siblings.
   ──────────────────────────────────────────────────────────────────────────── */

const PF = "font-[family-name:var(--font-playfair)]";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

// T3 — text link. Append the ground-correct colour pair.
const T3 = `group inline-flex items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${FOCUS}`;

/** 32px orange rule + 11px bold uppercase label. The rule is always #C8541A;
 *  only the label text changes with the ground. */
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

/** Section-level entrance: opacity + a 10px rise. Collapses to a plain fade
 *  under prefers-reduced-motion, and never leaves anything stuck at 0. */
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

/** A structural 1px rule that draws itself in from the left — the page's one
 *  signature move: reading down it looks like the gazette being ruled and set. */
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

/* ──────────────────────────────────────────────────────────────────────────── */

/**
 * The terms of reference, stated before anything is asked of the reader: who
 * the portal is for and that it is not an agency.
 *
 * Deliberately the tightest band on the page so it reads as a preamble rather
 * than a section, and the only band bracketed by a rule top *and* bottom.
 * The two columns run 7 / 5 of twelve rather than an even split, so the band
 * still reads as composed rather than halved.
 *
 * Body copy here is #1C1C1C, not the muted grey used on the cream grounds:
 * that grey measures 4.42:1 on this #F0E9DF ground and fails AA. Hierarchy
 * comes from size and measure instead.
 */
export default function HomeRemit() {
  return (
    <section
      className="w-full bg-[#F0E9DF] px-5 sm:px-8 lg:px-12"
      style={{ paddingTop: "clamp(40px,5vw,64px)", paddingBottom: "clamp(40px,5vw,64px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <Rule color="#9E6B3F" />

        {/* Heading is held to 22ch and left-aligned, leaving a wide empty field
            to its right above the columns. That emptiness is the composition —
            do not fill it. */}
        <Reveal className="mt-10">
          <SectionLabel tone="ink">WHO THIS IS FOR</SectionLabel>
          <h2
            className={`${PF} max-w-[22ch] font-bold text-[#1C1C1C]`}
            style={{ fontSize: "clamp(1.6rem,2.8vw,2.4rem)", lineHeight: 1.08 }}
          >
            Stated plainly, before anything is asked of you.
          </h2>
        </Reveal>

        {/* 1px verticals between the columns are the only separation: no cards,
            no boxes, no tints, no icons. Below lg they drop away entirely and
            whitespace alone separates the stacked cells. */}
        <Reveal delay={0.06} className="mt-12">
          <dl className="grid grid-cols-12 gap-y-9 lg:gap-y-0">
            <div className="col-span-12 lg:col-span-7 lg:pr-12">
              <dt className="text-[15px] font-bold leading-[1.4] text-[#1C1C1C]">
                Residents, and people trying to become residents.
              </dt>
              <dd className="mt-3 max-w-[44ch] text-[15px] leading-[1.7] text-[#1C1C1C]">
                If you live in Hiranandani Estate, Hiranandani Meadows, Rodas Enclave or One
                Hiranandani Park — or you are trying to move into one of them — this is built for
                you. Owners, tenants, people still looking, and the trades who serve the estate.
              </dd>
            </div>

            <div className="col-span-12 lg:col-span-5 lg:border-l lg:border-[#EDE5D8] lg:pl-12">
              <dt className="text-[15px] font-bold leading-[1.4] text-[#1C1C1C]">
                Not an agency.
              </dt>
              <dd className="mt-3 max-w-[44ch] text-[15px] leading-[1.7] text-[#1C1C1C]">
                Nobody here negotiates on your behalf, and nobody takes a percentage of your rent
                or your sale price. The portal puts you in front of the other person and then gets
                out of the way.
                {/* Same-page fragment, so a plain <a> and not next/link. */}
                <span className="mt-4 block">
                  <a href="#colophon" className={`${T3} text-[#1C1C1C] hover:text-[#A8410F]`}>
                    Full notices at the foot of this page
                    <span
                      aria-hidden
                      className="transition-transform duration-150 group-hover:translate-x-[3px]"
                    >
                      →
                    </span>
                  </a>
                </span>
              </dd>
            </div>

          </dl>
        </Reveal>

        <div className="mt-12">
          <Rule color="#9E6B3F" />
        </div>
      </div>
    </section>
  );
}
