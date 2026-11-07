"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface CardData {
  label: string;
  title: string;
  description: string;
}

interface StackedCardsProps {
  cards: CardData[];
}

const CARD_STEP = 500;
const DEAD_ZONE = 400;
const CARD_H = 580;
const SLIDE_DIST = CARD_H + 40;

// Depth-compressed stack settings
const STAIRCASE_TOP = 20;
const DEPTH_SCALE = 0.08;
const DARKEN_PER_DEPTH = 0.25;

// Easing: makes scroll feel snappy - resists in the middle, snaps at the end
function easeOutBack(x: number): number {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

const CARD_COLORS = [
  "#C8541A",
  "#1C0A00",
  "#C8541A",
  "#1C0A00",
  "#C8541A",
];

export default function StackedCards({ cards }: StackedCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrolled = -container.getBoundingClientRect().top;
    const max = CARD_STEP * (cards.length - 1);

    if (scrolled <= 0) setProgress(0);
    else if (scrolled >= max) setProgress(cards.length - 1);
    else setProgress(scrolled / CARD_STEP);
  }, [cards.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollHeight = CARD_STEP * (cards.length - 1) + DEAD_ZONE + CARD_H;
  const activeIndex = Math.floor(Math.min(progress, cards.length - 1));

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${scrollHeight}px` }}
    >
      {/* perspective wrapper - removed overflow:hidden so staircase peeks are visible */}
      <div
        className="sticky top-32 w-full"
        style={{
          height: `${CARD_H}px`,
          perspective: "1200px",
          perspectiveOrigin: "50% 30%",
        }}
      >
        {cards.map((card, i) => {
          const isEven = i % 2 === 0;

          // t: raw linear 0→1, tE: eased for snappy feel
          const tRaw = i === 0 ? 1 : Math.max(0, Math.min(1, progress - (i - 1)));
          const t = tRaw;
          const tE = i === 0 ? 1 : easeOutBack(tRaw);

          // --- Incoming card (uses eased value for snappy motion) ---
          const slideY = (1 - tE) * SLIDE_DIST;
          const rotateX = (1 - tE) * 6;
          const entryScale = 0.94 + tE * 0.06;

          // --- Buried cards: depth-compressed stack ---
          const isStacked = t >= 1 && i < activeIndex;
          const depth = isStacked ? (activeIndex - i) : 0;

          // Each buried card: shifts up by staircase amount, scales down, pushes back in Z
          const stackTopOffset = depth * STAIRCASE_TOP;
          const stackScale = 1 - depth * DEPTH_SCALE;
          const stackZ = -depth * 30;

          // Darken overlay intensity for buried cards
          const darkenOpacity = isStacked
            ? Math.min(0.8, depth * DARKEN_PER_DEPTH)
            : 0;

          const opacity = i === 0 ? 1 : Math.min(1, t * 2.5);

          // Top-casting shadow: subtle upward shadow onto the card below
          const isIncoming = t > 0 && t < 1;
          const topShadow = (i > 0 && (isIncoming || t >= 1))
            ? `0 -8px 20px rgba(0,0,0,0.35)`
            : "none";

          // Bottom ambient shadow - lighter
          const bottomShadow = isStacked
            ? `0 ${4 + depth * 2}px ${10 + depth * 4}px rgba(0,0,0,${0.15 + depth * 0.05})`
            : i === activeIndex
              ? "0 8px 24px rgba(0,0,0,0.3)"
              : "0 4px 12px rgba(0,0,0,0.2)";

          return (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                top: isStacked ? `${-stackTopOffset}px` : 0,
                bottom: isStacked ? `${stackTopOffset}px` : 0,
                height: isStacked ? undefined : "100%",
                opacity,
                transform: isStacked
                  ? `translateZ(${stackZ}px) scale(${stackScale})`
                  : `translateY(${slideY}px) rotateX(${rotateX}deg) scale(${entryScale})`,
                transformOrigin: "50% 0%",
                transformStyle: "preserve-3d",
                zIndex: i,
                willChange: "transform, opacity",
              }}
            >
              <div
                className="w-full h-full rounded-xl p-10 sm:p-12 flex flex-col justify-end overflow-hidden relative"
                style={{
                  background: CARD_COLORS[i] ?? (isEven ? "#C8541A" : "#1C0A00"),
                  boxShadow: `${topShadow}${topShadow !== "none" ? ", " : ""}${bottomShadow}`,
                }}
              >
                {/* Top edge highlight - 1px light catch on card edge */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                  }}
                />

                {/* Darken overlay for buried cards */}
                {darkenOpacity > 0 && (
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ background: `rgba(0,0,0,${darkenOpacity})` }}
                  />
                )}

                {/* Card number watermark */}
                <div className="absolute top-8 right-10 pointer-events-none">
                  <span
                    className="text-8xl font-black leading-none"
                    style={{
                      color: isEven
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative z-10">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3 block"
                    style={{
                      color: isEven
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {card.label}
                  </span>
                  <h3 className="text-white text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-tight whitespace-pre-line">
                    {card.title}
                  </h3>
                  <div
                    className="h-px w-16 mb-5"
                    style={{
                      background: isEven
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.18)",
                    }}
                  />
                  <p
                    className="leading-relaxed text-sm max-w-sm"
                    style={{
                      color: isEven
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Progress dots */}
                <div className="absolute bottom-8 right-10 flex gap-1.5">
                  {cards.map((_, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          j <= activeIndex
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
