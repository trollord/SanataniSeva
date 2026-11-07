"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Settle } from "@lucasmarkes/hairline/react";

/* ------------------------------------------------------------------ tokens */
/* Copied verbatim from the shared home-page token addendum. Each of the seven
   home sections carries its own copy on purpose: no cross-imports between
   them, so any one file can be built or replaced on its own. */

const PF = "font-[family-name:var(--font-playfair)]";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

// T1 — solid ink. Light grounds only. ONE per section at most.
const T1_LIGHT = `group inline-flex items-center gap-2 rounded-lg bg-[#1C1C1C] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-[#FAF8F5] transition-colors duration-150 hover:bg-[#1C0A00] ${FOCUS}`;

// T3 — text link. The ground-correct colour pair is appended at the call site.
const T3 = `group inline-flex items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${FOCUS}`;

/* Fig. 1 sits on the #FAF8F5 overlap card, so --hairline-plate is that cream. */
const PLATE_MASTHEAD = {
  "--hairline-plate": "#FAF8F5",
  "--hairline-hi": "#C8541A",
  "--hairline-edge": "#1C1C1C",
  "--hairline-mid": "#9E6B3F",
  "--hairline-lo": "#EDE5D8",
  "--hairline-stroke": "1.25",
} as CSSProperties;

/* ------------------------------------------------------- shared primitives */

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

/** A structural 1px rule that draws itself in from the left as it comes into view. */
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

/** The direct parent of a hairline figure: it owns the figure's ink and its width. */
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

/* ----------------------------------------------------------------- content */

/**
 * The rail: the five uses of the portal, as five working links, above the fold.
 * Order is canonical and must never be reordered or renumbered.
 */
const RAIL: { n: string; name: string; errand: string; href: string }[] = [
  { n: "01", name: "Find a home", errand: "Rent or buy, direct from the owner", href: "/listings" },
  {
    n: "02",
    name: "Get a phone number",
    errand: "Local services and trusted vendors",
    href: "/community",
  },
  {
    n: "03",
    name: "Buy something used",
    errand: "Second-hand, from a neighbour",
    href: "/marketplace",
  },
  {
    n: "04",
    name: "Pass something on",
    errand: "Resell it, or hand it to someone who needs it",
    href: "/marketplace",
  },
  { n: "05", name: "Read the paper", errand: "Estate news, notices and events", href: "/newspaper" },
];

/* --------------------------------------------------------------- component */

export interface HomeMastheadProps {
  /** True when NewsBannerStrip rendered above this section. Controls the top padding only. */
  hasNews: boolean;
}

export default function HomeMasthead({ hasNews }: HomeMastheadProps) {
  const reduce = useReducedMotion();

  /**
   * Load choreography. This section is above the fold, so it uses
   * initial/animate rather than whileInView: issue line, heading, standfirst,
   * actions, then the rail — the whole thing settled inside 800ms.
   */
  const load = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.2 : 0.48, delay: reduce ? 0 : delay, ease: EASE },
  });

  return (
    <section
      className="w-full bg-[#FAF8F5] px-5 sm:px-8 lg:px-12"
      style={{
        // NewsBannerStrip hard-codes mt-[60px] to clear the fixed navbar. When
        // it is absent this section has to clear those 60px itself.
        paddingTop: hasNews ? "clamp(56px,7vw,88px)" : "calc(60px + clamp(56px,7vw,88px))",
        paddingBottom: "clamp(56px,7vw,88px)",
      }}
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Row 0 — the issue line, and the rule that sets the page. */}
        <motion.div {...load(0)}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1C1C1C]">
            SANATANI COMMUNITY · HIRANANDANI ESTATE, THANE · RESIDENT HELP DESK
          </p>
        </motion.div>
        <div className="mt-4">
          <Rule color="#9E6B3F" />
        </div>

        {/* Rows 1 and 2 — the statement, the one photograph of the estate, and
            the rail. They share one grid so that `order` can put the rail
            ABOVE the photograph on small screens: the photo is atmosphere, the
            rail is the product, and on a phone the rail must not sit two
            screens down. On lg the visual order is unchanged — copy 7 / photo
            5 on the first row, rail full-width on the second. */}
        <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-12 lg:mt-14 lg:gap-x-10">
          <div className="order-1 col-span-12 lg:col-span-7">
            <motion.div {...load(0.06)}>
              <SectionLabel tone="orange">WHAT THIS PORTAL IS FOR</SectionLabel>
              <h1
                className={`${PF} font-bold text-[#1C1C1C]`}
                style={{
                  fontSize: "clamp(2.5rem,6.2vw,4.9rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.02em",
                }}
              >
                {/* A JSX string expression, not literal JSX text: it keeps the
                    apostrophe as the exact character the copy deck specifies
                    while staying clear of react/no-unescaped-entities. */}
                {"The estate's help desk, "}
                {/* not-italic: Playfair's italic at this weight is too mannered
                    here, so the colour alone carries the emphasis. */}
                <em className="not-italic text-[#C8541A]">set out in five entries.</em>
              </h1>
            </motion.div>

            <motion.div {...load(0.12)}>
              <p className="mt-7 max-w-[58ch] text-[17px] leading-[1.65] text-[#6B6B6B]">
                Sanatani Community is a neighbourhood portal run for Hiranandani Estate, Thane — and
                for Hiranandani Meadows, Rodas Enclave and One Hiranandani Park beside it. It does
                five things, and no more. Start with whichever one brought you here.
              </p>
            </motion.div>

            <motion.div {...load(0.18)} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/listings" className={T1_LIGHT}>
                Find a home
                <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
                  →
                </span>
              </Link>
              <Link href="/contact" className={`${T3} text-[#1C1C1C] hover:text-[#A8410F]`}>
                Ask a neighbour
                <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
                  →
                </span>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="order-3 col-span-12 lg:order-2 lg:col-span-5"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 1.02 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: reduce ? 0.2 : 0.48,
              delay: reduce ? 0 : 0.1,
              ease: EASE,
              scale: { duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : 0.1, ease: EASE },
            }}
          >
            {/* The positioning context is the PHOTOGRAPH, not the column. The
                Fig. 1 card is anchored inside the image's own box, so it can
                break left over the copy without ever reaching the caption that
                follows the image in the flow. */}
            <div className="relative">
              <Image
                src="/images/hiranandanilol.jpeg"
                alt="Hiranandani Estate, Thane"
                width={1200}
                height={1500}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-[4/5] w-full rounded-2xl object-cover"
                priority
              />

              {/* The grid break: Fig. 1 breaks out of the column and over the
                  copy. lg only — on small screens the rail is the hero. */}
              <div className="absolute bottom-6 -left-14 z-10 hidden w-[232px] rounded-xl border border-[#EDE5D8] bg-[#FAF8F5] p-4 lg:block">
                <Plate vars={PLATE_MASTHEAD}>
                  <Settle
                    intensity={0.62}
                    play
                    theme="light"
                    label="Twelve scattered tiles sliding into one ordered hub"
                    className="w-full"
                  />
                </Plate>
              </div>
            </div>

            <p className={`${PF} mt-3 text-[13px] italic text-[#7A4F2A]`}>
              Hiranandani Estate, Thane — the one neighbourhood this portal covers.
            </p>
          </motion.div>
          {/* Row 2 — the rail. Deliberately unequal: housing takes two columns
              of six, so this never reads as a five-up card grid. It animates as
              one group, because the simultaneity of the five uses is the point.
              order-2 on small screens puts it directly under the standfirst. */}
          <motion.div
            {...load(0.26)}
            className="order-2 col-span-12 lg:order-3 lg:mt-10"
          >
            <nav
              aria-label="What this portal is for"
              className="overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#F0E9DF]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                {RAIL.map((cell, i) => (
                  <Link
                    key={cell.n}
                    href={cell.href}
                    /* Five equal cells. An earlier version gave cell 01 a
                       double-width span, which left the other four cramped
                       enough to wrap their titles onto two lines while 01 sat
                       on one — the row read as misaligned rather than
                       composed. Equal columns plus a flex column per cell
                       (arrow pushed down with mt-auto) puts every title, every
                       line of copy and every arrow on a shared baseline. */
                    className={`group relative flex flex-col transition-colors duration-150 hover:bg-[#EDE0CC] active:bg-[#EDE0CC] ${FOCUS} px-5 py-5 lg:px-6 lg:py-7 ${
                      /* Dividers follow the axis the cells stack on: a top
                         rule while stacked, a left rule once they sit in a
                         row. At sm the grid is 2-up, so column 1 of each pair
                         keeps its top rule and loses the left one. */
                      i > 0 ? "border-t border-[#EDE5D8] lg:border-t-0 lg:border-l lg:border-[#EDE5D8]" : ""
                    } ${i > 0 ? "sm:border-l sm:border-[#EDE5D8]" : ""} ${
                      i === 1 ? "sm:border-t-0 lg:border-t-0" : ""
                    }`}
                  >
                    <span className="block text-[12px] font-bold tabular-nums text-[#7A4F2A] transition-colors duration-150 group-hover:text-[#A8410F] group-active:text-[#A8410F]">
                      {cell.n}
                    </span>
                    <span
                      className={`${PF} mt-2 block font-bold text-[#1C1C1C]`}
                      style={{ fontSize: "clamp(1.05rem,1.35vw,1.25rem)", lineHeight: 1.2 }}
                    >
                      {cell.name}
                    </span>
                    <span className="mt-2 block text-[13px] leading-[1.5] text-[#1C1C1C]">
                      {cell.errand}
                    </span>
                    <span
                      aria-hidden
                      className="mt-auto block pt-5 text-[14px] text-[#7A4F2A] transition-transform duration-150 group-hover:translate-x-[4px] group-hover:text-[#A8410F] group-active:translate-x-[4px] group-active:text-[#A8410F]"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </nav>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
