"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { Search, Heart, KeyRound } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Browse & Find",
    desc: "Explore verified properties with high-resolution imagery and accurate descriptions.",
  },
  {
    icon: Heart,
    title: "Register Interest - Free",
    desc: "Save your favorites and notify owners without paying a single rupee upfront.",
  },
  {
    icon: KeyRound,
    title: "Visit & Move In",
    desc: "Schedule a viewing directly with the owner and finalise your dream home.",
  },
];

// Off-screen-right starting offset (px) shared by all steps.
const X_OFFSET = 480;

// Progress sub-ranges (within the pinned 0→1 scroll sweep) for each beat.
const PHASE = {
  line: [0.06, 0.28] as [number, number],
  step0: { x: [0.28, 0.46] as [number, number], opacity: [0.28, 0.4] as [number, number] },
  step1: { x: [0.52, 0.7] as [number, number], opacity: [0.52, 0.64] as [number, number] },
  step2: { x: [0.74, 0.92] as [number, number], opacity: [0.74, 0.86] as [number, number] },
};

function Step({
  icon: Icon,
  title,
  desc,
  x,
  opacity,
  scale,
}: {
  icon: typeof Search;
  title: string;
  desc: string;
  x: MotionValue<number>;
  opacity: MotionValue<number>;
  scale?: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{ x, opacity, scale, willChange: "transform" }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-[#FAF8F5] flex items-center justify-center mb-5 sm:mb-8 shadow-sm">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-[#0B0B0C]" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[#0B0B0C] mb-3 sm:mb-4">{title}</h3>
        <p className="text-sm sm:text-base text-[#5a6061] max-w-xs leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function PinnedProcessSection() {
  const pinWrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: pinWrapperRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.6,
    restDelta: 0.0008,
  });

  const lineScaleX = useTransform(smoothProgress, PHASE.line, [0, 1]);

  const step0X = useTransform(smoothProgress, PHASE.step0.x, [X_OFFSET, 0]);
  const step0Opacity = useTransform(smoothProgress, PHASE.step0.opacity, [0, 1]);
  // Scale peaks at fully-visible moment (opacity end), then settles to 1 on arrival
  const step0Scale = useTransform(
    smoothProgress,
    [PHASE.step0.x[0], PHASE.step0.opacity[1], PHASE.step0.x[1]],
    [1, 1.15, 1]
  );

  const step1X = useTransform(smoothProgress, PHASE.step1.x, [X_OFFSET, 0]);
  const step1Opacity = useTransform(smoothProgress, PHASE.step1.opacity, [0, 1]);
  const step1Scale = useTransform(
    smoothProgress,
    [PHASE.step1.x[0], PHASE.step1.opacity[1], PHASE.step1.x[1]],
    [1, 1.15, 1]
  );

  const step2X = useTransform(smoothProgress, PHASE.step2.x, [X_OFFSET, 0]);
  const step2Opacity = useTransform(smoothProgress, PHASE.step2.opacity, [0, 1]);
  const step2Scale = useTransform(
    smoothProgress,
    [PHASE.step2.x[0], PHASE.step2.opacity[1], PHASE.step2.x[1]],
    [1, 1.15, 1]
  );

  return (
    <div ref={pinWrapperRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center px-5 sm:px-8">
        <div className="max-w-[1440px] w-full mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tighter text-[#0B0B0C] mb-12 sm:mb-20">
            Simple Process
          </h2>

          <div className="grid grid-cols-3 gap-12 relative">
            {/* Horizontal connector line - draws in from the right */}
            <div className="absolute top-10 left-[16.67%] w-[66.67%] h-px bg-[#dde4e5] z-0">
              <motion.div
                className="w-full h-full bg-[#FF5F15]"
                style={{ scaleX: lineScaleX, originX: 1, willChange: "transform" }}
              />
            </div>

            <Step {...STEPS[0]} x={step0X} opacity={step0Opacity} scale={step0Scale} />
            <Step {...STEPS[1]} x={step1X} opacity={step1Opacity} scale={step1Scale} />
            <Step {...STEPS[2]} x={step2X} opacity={step2Opacity} scale={step2Scale} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const iconVariants: Variants = {
    hidden: { scale: 0.4, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 18,
        mass: 0.8,
        delay: i === 0 ? 0.1 : i === 1 ? 0.5 : 0.9,
      },
    }),
  };

  const contentVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
        delay: i === 0 ? 0.25 : i === 1 ? 0.65 : 1.05,
      },
    }),
  };

  return (
    <div className="py-16 px-5 max-w-[1440px] mx-auto">
      <h2 className="text-center text-3xl font-bold tracking-tighter text-[#0B0B0C] mb-12">
        Simple Process
      </h2>

      <div ref={containerRef} className="grid grid-cols-1 gap-10">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="relative flex flex-col items-center text-center">
            <motion.div
              custom={i}
              variants={iconVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="w-16 h-16 rounded-full bg-white border-4 border-[#FAF8F5] flex items-center justify-center mb-5 shadow-sm"
            >
              <Icon className="h-6 w-6 text-[#0B0B0C]" strokeWidth={1.5} />
            </motion.div>

            <motion.div
              custom={i}
              variants={contentVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <h3 className="text-lg font-bold text-[#0B0B0C] mb-3">{title}</h3>
              <p className="text-sm text-[#5a6061] max-w-xs leading-relaxed">{desc}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcessSection() {
  return (
    <section>
      <div className="hidden md:block">
        <PinnedProcessSection />
      </div>
      <div className="md:hidden">
        <MobileProcessSection />
      </div>
    </section>
  );
}
