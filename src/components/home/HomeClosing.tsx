"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────────
   Shared home-page tokens.

   Every section of the home page carries this block verbatim. It is copied
   rather than extracted on purpose: the seven sections are built and edited
   independently and must have zero cross-imports between them. Do not
   paraphrase the values — the colour, motion and button systems only hold
   together because all seven files agree character for character.
   ────────────────────────────────────────────────────────────────────────── */

const PF = "font-[family-name:var(--font-playfair)]";

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

/* ──────────────────────────────────────────────────────────────────────────
   The five entries. Order and numbering follow the navbar and the masthead
   rail — keep all three in step. The route word is the page this entry opens.
   ────────────────────────────────────────────────────────────────────────── */

const ENTRIES: { n: string; name: string; route: string; href: string }[] = [
  { n: "01", name: "Phone numbers", route: "DIRECTORY", href: "/community" },
  { n: "02", name: "Buy & sell", route: "MARKETPLACE", href: "/marketplace" },
  { n: "03", name: "Pass it on", route: "MARKETPLACE", href: "/marketplace" },
  { n: "04", name: "Housing", route: "LISTINGS", href: "/listings" },
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
  "Sanatani Seva lists; it does not mediate. We do not employ or endorse the vendors in the directory, so check credentials before you hire anyone.",
  "Prices and condition notes on the marketplace are written by sellers. See the item in person before you pay for it.",
  "Directory entries marked as samples are placeholders, kept visible while we confirm real listings with residents one at a time.",
  "Browsing, listing and contacting anyone on this portal is free. There is no charge to residents at any point.",
];

const COLOPHON_HEADING = "text-[11px] font-bold uppercase tracking-[0.2em] text-[#1C1C1C]";

/**
 * The colophon: repeats all five entries as leader-dot links, names the
 * localities served, and sets every notice the product owes its readers.
 *
 * Renders no navbar and no footer; the layout supplies both, and the
 * layout's Footer follows the colophon.
 */
export default function HomeClosing() {
  return (
    <>
      {/* ═══════════════ THE COLOPHON — ground #FAF8F5 ═══════════════
          Tighter than the desk above, so the page decelerates rather than
          stopping. */}
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
              <p className={COLOPHON_HEADING}>THE FIVE SEVAS</p>
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
