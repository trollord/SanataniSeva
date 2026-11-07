"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

export interface TourStep {
  /** CSS selector(s) to spotlight; first visible match wins. Omit for a centered card. */
  target?: string;
  title: string;
  body: string;
}

function findVisible(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.getClientRects().length > 0 && el.offsetParent !== null) return el;
  }
  return null;
}

export default function GuidedTour({
  steps,
  storageKey,
  startDelay = 900,
}: {
  steps: TourStep[];
  storageKey: string;
  startDelay?: number;
}) {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Show once, shortly after first landing. If the site disclaimer hasn't been
  // acknowledged yet, wait for it so the two popups don't stack.
  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      t = setTimeout(() => setStep(0), startDelay);
    };
    if (localStorage.getItem("hh_disclaimer_ack")) {
      start();
    } else {
      window.addEventListener("hh:disclaimer-ack", start, { once: true });
    }
    return () => {
      window.removeEventListener("hh:disclaimer-ack", start);
      if (t) clearTimeout(t);
    };
  }, [storageKey, startDelay]);

  const measure = useCallback(() => {
    if (step === null) return;
    const selector = steps[step]?.target;
    const el = selector ? findVisible(selector) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step, steps]);

  // Position the spotlight whenever the step changes
  useEffect(() => {
    if (step === null) return;
    const selector = steps[step]?.target;
    const el = selector ? findVisible(selector) : null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      // Re-measure after the smooth scroll settles
      const t = setTimeout(measure, 350);
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, { passive: true });
      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure);
      };
    }
    setRect(null);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, steps, measure]);

  if (step === null) return null;

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  function finish() {
    localStorage.setItem(storageKey, "1");
    setStep(null);
  }

  // Popover placement relative to the spotlighted element
  const popoverStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: Math.min(
          rect.bottom + 14 + 260 > window.innerHeight && rect.top - 260 - 14 > 0
            ? rect.top - 260 - 14
            : rect.bottom + 14,
          window.innerHeight - 280
        ),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 360 - 16)),
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop / spotlight ring */}
      {rect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            border: "2px solid rgba(255,255,255,0.9)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}

      {/* Card */}
      <div
        style={popoverStyle}
        className="w-[calc(100vw-32px)] max-w-[360px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto"
      >
        <button
          onClick={finish}
          aria-label="Skip tour"
          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-900 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-2">
          {isFirst ? "Quick Tour" : `Step ${step} of ${steps.length - 1}`}
        </p>
        <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#FF5F15] mb-2">
          {current.title}
        </h3>
        <p className="text-[13px] text-zinc-500 leading-relaxed">{current.body}</p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-[#FF5F15]" : "w-1.5 bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-xs font-medium border border-zinc-200 text-zinc-600 hover:border-[#FF5F15] hover:text-zinc-900 px-4 py-2 rounded-full transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep(step + 1))}
              className="text-xs font-bold bg-[#FF5F15] text-white px-5 py-2 rounded-full hover:bg-[#E84A00] transition-colors"
            >
              {isFirst ? "Start tour" : isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
