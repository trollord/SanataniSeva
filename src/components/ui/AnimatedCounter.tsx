"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
  label: string;
  dark?: boolean;
}

export default function AnimatedCounter({
  end,
  suffix = "",
  duration = 1600,
  label,
  dark = false,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <div ref={ref}>
      <div className={`text-3xl sm:text-4xl font-black tracking-tighter mb-1 ${dark ? "text-white" : "text-[#FF5F15]"}`}>
        {count}{suffix}
      </div>
      <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${dark ? "text-white/45" : "text-[#5a6061]"}`}>
        {label}
      </div>
    </div>
  );
}
