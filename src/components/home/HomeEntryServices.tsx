"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/* ── Shared page tokens ──────────────────────────────────────────────────────
   Copied verbatim from the home-page token block. Each home section is
   independently buildable: no cross-imports between the seven components. */

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

// T2 — outlined. Light grounds only. Housing owns the entry sequence's only
// solid button, so this entry takes the outlined tier.
const T2_LIGHT = `group inline-flex items-center gap-2 rounded-lg border border-[#1C1C1C] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] transition-colors duration-150 hover:bg-[#1C1C1C] hover:text-[#FAF8F5] ${FOCUS}`;

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Trade {
  /** Display label, e.g. "Carpenters". From COMMUNITY_CATEGORIES[].label. */
  label: string;
  /** Listings in that trade. From CATEGORY_COUNTS[key]. Always >= 1 today. */
  count: number;
}

interface HomeEntryServicesProps {
  /** All trades with a non-zero count, in the order COMMUNITY_CATEGORIES defines them. Computed in page.tsx. */
  trades: Trade[];
  /** COMMUNITY_CONTACTS.length. Currently 30. */
  totalContacts: number;
}

/**
 * ENTRY 02 — phone numbers for local services and trusted vendors.
 *
 * The densest section on the page: a real two-column reference table of every
 * indexed trade with live counts, because that is what a directory is. Ground
 * is #EDE0CC, used exactly once on the page, here. Body copy is #1C1C1C: the
 * muted body grey only clears AA on the cream ground, not on this one (4.09:1).
 *
 * The figure sits on the LEFT over a light ground with the copy pushed into a
 * 7-column field starting at column 6. Housing put its figure left over a dark
 * ground; that alternation is what stops the five entries reading as a card grid.
 *
 * No watermark numeral here: the watermark colour IS this section's ground, and
 * no substitute exists in the token set. The section label carries the number.
 */
export default function HomeEntryServices({ trades, totalContacts }: HomeEntryServicesProps) {
  const hasTrades = trades.length > 0;
  const reduce = useReducedMotion();

  return (
    <section
      className="relative w-full overflow-hidden bg-[#EDE0CC] px-5 sm:px-8 lg:px-12"
      style={{ paddingTop: "clamp(64px,8vw,116px)", paddingBottom: "clamp(64px,8vw,116px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 lg:mb-18">
          <Rule color="#9E6B3F" />
        </div>

        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          {/* Figure — cols 1-4. Four sample rows from the live trades prop slide
              in staggered, previewing what the directory looks like inside. */}
          {hasTrades && (
            <div className="order-1 col-span-12 lg:col-span-4">
              <motion.div
                className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#D4C9B8] bg-[#F0E9DF] lg:max-w-[320px]"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.6 }}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: reduce ? 0 : 0.11 } },
                }}
              >
                {/* Card header */}
                <motion.div
                  className="flex items-center gap-2.5 border-b border-[#D4C9B8] px-5 py-4"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
                  }}
                >
                  <div className="h-px w-5 shrink-0 bg-[#C8541A]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A8410F]">
                    Directory preview
                  </span>
                </motion.div>

                {/* Trade rows */}
                {trades.slice(0, 4).map((trade) => (
                  <motion.div
                    key={trade.label}
                    aria-hidden
                    className="flex items-center justify-between border-b border-[#D4C9B8] px-5 py-3.5"
                    variants={{
                      hidden: reduce ? { opacity: 0 } : { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0, transition: { duration: reduce ? 0.2 : 0.36, ease: EASE } },
                    }}
                  >
                    <span className="text-[13px] font-bold text-[#1C1C1C]">{trade.label}</span>
                    <span className="ml-3 shrink-0 rounded-full bg-[#EDE0CC] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#7A4F2A]">
                      {trade.count}
                    </span>
                  </motion.div>
                ))}

                {/* Card footer */}
                <motion.div
                  className="px-5 py-3.5"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
                  }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A4F2A]">
                    +{trades.length - 4} more trades
                  </span>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Copy + trade index — cols 6-12 (full-width if no trades yet) */}
          <Reveal delay={0.06} className={`order-2 col-span-12 ${hasTrades ? "lg:col-span-7 lg:col-start-6" : ""}`}>
            <SectionLabel tone="ink">ENTRY 02 · PHONE NUMBERS</SectionLabel>

            <h2
              className={`${PF} font-bold text-[#1C1C1C]`}
              style={{ fontSize: "clamp(1.8rem,3.1vw,2.8rem)", lineHeight: 1.06 }}
            >
              The number you were about to ask the{" "}
              <em className="not-italic text-[#C8541A]">building group for.</em>
            </h2>

            <p className="mt-6 max-w-[64ch] text-[16px] leading-[1.7] text-[#1C1C1C]">
              A carpenter who has worked in these towers. A plumber who knows which stack is which.
              The chemist that still answers after nine. The directory keeps their name, their trade,
              their hours and their phone number in one place, so you are not scrolling back through
              a group chat at the worst possible moment.
            </p>

            {/* What the directory is, stated in a sentence. The full trade index
                lives on /community — repeating it here only delayed the click. */}
            {hasTrades && (
              <p className="mt-8 max-w-[62ch] text-[15px] leading-[1.7] text-[#1C1C1C]">
                {totalContacts} contacts across {trades.length} trades — carpenters, plumbers,
                electricians, tiffin services, tutors and the rest. We list people; we do not
                employ or endorse them, so check credentials before you hire anyone.
              </p>
            )}

            <div className="mt-8">
              <Link href="/community" className={T2_LIGHT}>
                Open the directory
                <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
