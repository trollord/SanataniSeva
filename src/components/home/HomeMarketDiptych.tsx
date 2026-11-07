"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Slow } from "@lucasmarkes/hairline/react";

/**
 * Entries 03 and 04 of the home page, set as one band.
 *
 * Buying second-hand and passing something on both end at /marketplace, so the
 * page says so out loud: one chapter, two directions, unequal columns. The left
 * panel (58fr, cream, hairline border) is the main entry; the right panel
 * (42fr, deeper warm surface, no border) is its companion note, one type step
 * smaller throughout.
 *
 * Both panels run in the page's own grammar — label, heading, figure, body,
 * CTA — so the reader always knows what a figure is a figure OF before they
 * look at it. What holds the diptych together is the inking, not the ordering:
 * PLATE_BUY is orange-forward, PLATE_PASSON is ink-forward, the way a
 * two-colour press alternates. Each var object must sit on its own <Plate>,
 * never on a shared ancestor, or the reversal is lost.
 *
 * Neither panel is stretched to match the other's height. They are a main
 * entry and a companion note, and forcing the shorter one to the taller one's
 * height only buys an empty middle.
 *
 * The marketplace is empty today, which is why the empty state is the louder
 * composition: with no inventory the belt figure is drawn larger
 * and the empty wire basket IS the empty state. Nothing is invented to fill it —
 * the six category chips teach what belongs here without faking a single lot.
 */

/* ──────────────────────────── shared tokens ──────────────────────────── */

const PF = "font-[family-name:var(--font-playfair)]";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

/** T2 — outlined. Light grounds only. */
const T2_LIGHT = `group inline-flex items-center gap-2 rounded-lg border border-[#1C1C1C] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] transition-colors duration-150 hover:bg-[#1C1C1C] hover:text-[#FAF8F5] ${FOCUS}`;

/** T3 — text link, with the light-ground colour pair appended. */
const T3 = `group inline-flex items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${FOCUS}`;
const T3_LIGHT = `${T3} text-[#1C1C1C] hover:text-[#A8410F]`;

const ITEM_CATEGORY_LABEL: Record<string, string> = {
  HOME_FURNITURE: "Home Furniture",
  OFFICE_FURNITURE: "Office Furniture",
  ELECTRONICS: "Electrical & Electronics",
  COMPUTERS: "Computers",
  VEHICLES: "Vehicles",
  OTHERS: "Others",
};

/** Entry 03 — behind it: #FAF8F5. Orange-forward inking. */
const PLATE_BUY = {
  "--hairline-plate": "#FAF8F5",
  "--hairline-hi": "#1C0A00",
  "--hairline-edge": "#C8541A",
  "--hairline-mid": "#9E6B3F",
  "--hairline-lo": "#EDE5D8",
  "--hairline-stroke": "1.15",
} as CSSProperties;

/* ─────────────────────── local presentation pieces ─────────────────────── */

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

/**
 * Carries one PLATE_* var object and must be the DIRECT parent of its figure.
 * Figures fill their parent's width at 5:4, so size is controlled here with
 * max-w-[NNNpx] and never with a height.
 */
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

/* ──────────────────────────────── props ──────────────────────────────── */

interface MarketItemImage {
  url: string;
  isPrimary: boolean;
}

interface MarketItem {
  id: string;
  title: string;
  /** Prisma Float. */
  price: number;
  /** HOME_FURNITURE | OFFICE_FURNITURE | ELECTRONICS | COMPUTERS | VEHICLES | OTHERS */
  category: string;
  /** At most one, already ordered isPrimary desc. May be an empty array. */
  images: MarketItemImage[];
}

interface HomeMarketDiptychProps {
  /** Up to 2 live items. Currently an empty array. */
  items: MarketItem[];
}

export default function HomeMarketDiptych({ items }: HomeMarketDiptychProps) {
  const hasItems = items.length > 0;

  return (
    <section
      className="w-full bg-[#FAF8F5] px-5 sm:px-8 lg:px-12"
      style={{ paddingTop: "clamp(56px,7vw,100px)", paddingBottom: "clamp(56px,7vw,100px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 lg:mb-16">
          <Rule color="#9E6B3F" />
        </div>

        {/* 58 / 42 — unequal by design: a main entry and its companion note. */}
        <div className="grid gap-5 lg:grid-cols-[58fr_42fr]">

          {/* ══ ENTRY 03 · BUY & SELL ══ */}
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#FAF8F5] p-6 sm:p-9">
              <span
                aria-hidden
                className={`${PF} pointer-events-none absolute top-[-1rem] right-[0.5rem] select-none font-bold leading-none`}
                style={{ color: "#EDE0CC", fontSize: "clamp(3.5rem,7vw,7rem)" }}
              >
                03
              </span>

              <div className="relative z-10">
                <SectionLabel tone="orange">ENTRY 03 · BUY &amp; SELL</SectionLabel>

                {/* h2, not h3: entries 01-05 are peers in the document outline.
                    There is no section-level heading above this band, so an h3
                    here would read to a screen reader as a subsection of Entry
                    02. The type size is unchanged — only the level. */}
                <h2
                  className={`${PF} font-bold text-[#1C1C1C]`}
                  style={{ fontSize: "clamp(1.6rem,2.6vw,2.3rem)", lineHeight: 1.08 }}
                >
                  Sell it to someone who lives{" "}
                  <em className="not-italic text-[#C8541A]">four minutes away.</em>
                </h2>

                {/* Goods moving from one owner to the next — the figure states
                    what the marketplace does. It grows when there is no
                    inventory, so the panel is never thin. */}
                <div className="mt-8">
                  <Plate
                    vars={PLATE_BUY}
                    className={hasItems ? "w-full max-w-[240px]" : "w-full max-w-[420px]"}
                  >
                    <Slow
                      intensity={0.6}
                      theme="light"
                      label="Crates riding a belt from one side to the other"
                      className="w-full"
                    />
                  </Plate>
                </div>

                <p className="mt-8 max-w-[58ch] text-[15px] leading-[1.7] text-[#6B6B6B]">
                  A desk, a cycle, a fridge, a phone. Listing it here puts it in front of the people
                  most likely to want it and least likely to need it couriered. You set the price,
                  you meet in the lobby, you hand it over.
                </p>

                <div className="mt-7">
                  {hasItems ? (
                    <>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8410F]">
                        LATEST LOTS
                      </p>
                      {/* Catalogue slips, not cards: one ruled row per lot. Below
                          420px the price drops onto its own line under the trade. */}
                      <ul className="mt-2">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="grid grid-cols-[48px_1fr] items-center gap-x-4 gap-y-0 border-t border-[#EDE5D8] py-4 first:border-t-0 min-[420px]:grid-cols-[56px_1fr_auto]"
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-md bg-[#F0E9DF] min-[420px]:h-14 min-[420px]:w-14">
                              {item.images[0]?.url ? (
                                // Item image hosts are not all in next.config.js
                                // remotePatterns, so next/image would throw at runtime.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.images[0].url}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>

                            <div>
                              <p className="text-[15px] font-semibold leading-[1.35] text-[#1C1C1C]">
                                {item.title}
                              </p>
                              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6B6B]">
                                {ITEM_CATEGORY_LABEL[item.category] ?? "Others"}
                              </p>
                            </div>

                            <p
                              className={`${PF} col-start-2 mt-2 text-[18px] font-bold text-[#1C1C1C] min-[420px]:col-start-3 min-[420px]:row-start-1 min-[420px]:mt-0`}
                            >
                              {`₹${item.price.toLocaleString("en-IN")}`}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#9E6B3F] p-6">
                      <p className="text-[15px] font-bold text-[#1C1C1C]">
                        Nothing is listed this week.
                      </p>
                      <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.7] text-[#6B6B6B]">
                        The first lot sets the tone. Furniture, electronics, a cycle, white goods, a
                        cot nobody needs any more — if it still works, somebody on this estate is
                        looking for it.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {Object.values(ITEM_CATEGORY_LABEL).map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-[#F0E9DF] px-3 py-1.5 text-[12px] text-[#1C1C1C]"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* The empty state asks for the thing it actually needs, so the
                    tiers swap: listing leads, browsing follows. */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  {hasItems ? (
                    <>
                      <Link href="/marketplace" className={T2_LIGHT}>
                        Browse the marketplace
                        <span
                          aria-hidden
                          className="transition-transform duration-150 group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                      <Link href="/dashboard/items/new" className={T3_LIGHT}>
                        List something of yours
                        <span
                          aria-hidden
                          className="transition-transform duration-150 group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard/items/new" className={T2_LIGHT}>
                        List the first item
                        <span
                          aria-hidden
                          className="transition-transform duration-150 group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                      <Link href="/marketplace" className={T3_LIGHT}>
                        Browse the marketplace
                        <span
                          aria-hidden
                          className="transition-transform duration-150 group-hover:translate-x-[3px]"
                        >
                          →
                        </span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* ══ ENTRY 04 · PASS IT ON ══
              Deeper surface, no border — the ground separates it on its own. */}
          <Reveal delay={0.08}>
            {/* h-full so the pair reads as one spread. The earlier version let
                this panel end at its own content height, which was right while
                a figure anchored its foot — without one it stopped halfway down
                the left panel and the diptych read as a gap, not a composition. */}
            <div className="relative h-full overflow-hidden rounded-2xl bg-[#F0E9DF] p-6 sm:p-9">
              <span
                aria-hidden
                className={`${PF} pointer-events-none absolute top-[-1rem] right-[0.5rem] select-none font-bold leading-none`}
                style={{ color: "#EDE0CC", fontSize: "clamp(3.5rem,7vw,7rem)" }}
              >
                04
              </span>

              <div className="relative z-10">
                <SectionLabel tone="ink">ENTRY 04 · PASS IT ON</SectionLabel>

                {/* h2 for the same outline reason as Entry 03: all five
                    entries are peers. The type step down is what marks this as
                    the companion note, not the heading level. */}
                <h2
                  className={`${PF} font-bold text-[#1C1C1C]`}
                  style={{ fontSize: "clamp(1.4rem,2.2vw,1.95rem)", lineHeight: 1.1 }}
                >
                  Or just <em className="not-italic text-[#C8541A]">pass it on.</em>
                </h2>

                {/* Narrower measure and tighter leading than the left panel:
                    line-height tracks line length. #6B6B6B fails on #F0E9DF. */}
                <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[#1C1C1C]">
                  Not everything needs a price. If the cot has been outgrown, the books are read and
                  the kettle works perfectly well, put it on the same marketplace and name whatever
                  figure feels right. Someone two buildings away is furnishing a first flat.
                </p>

                <div className="mt-6 h-px w-full bg-[#EDE5D8]" />
                <p className="mt-4 text-[12px] italic leading-[1.6] text-[#1C1C1C]">
                  Same place as Entry 03 — the marketplace listing form does both.
                </p>

                <div className="mt-7">
                  <Link href="/marketplace" className={T2_LIGHT}>
                    Open the marketplace
                    <span
                      aria-hidden
                      className="transition-transform duration-150 group-hover:translate-x-[3px]"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
