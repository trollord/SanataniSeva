"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";

/* ─── Context ─────────────────────────────────────────────────────────────── */

type ContextType = [boolean, React.Dispatch<React.SetStateAction<boolean>>];
const MouseEnterContext = createContext<ContextType | undefined>(undefined);

function useMouseEnter(): ContextType {
  const ctx = useContext(MouseEnterContext);
  if (!ctx) throw new Error("useMouseEnter must be inside CardContainer");
  return ctx;
}

/* ─── CardContainer ───────────────────────────────────────────────────────── */

export function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Disable 3-D tilt on touch devices (phones / tablets)
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch || !containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 20;
    const y = (e.clientY - top - height / 2) / 20;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  function handleMouseLeave() {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={containerClassName}
        style={{ perspective: isTouch ? "none" : "1000px" }}
      >
        <div
          ref={containerRef}
          onMouseEnter={() => setIsMouseEntered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={className}
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.15s ease",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

/* ─── CardBody ────────────────────────────────────────────────────────────── */

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
    >
      {children}
    </div>
  );
}

/* ─── CardItem ────────────────────────────────────────────────────────────── */
// Always renders a <div>. No dynamic tag / no index signature - avoids the
// webpack module-resolution error caused by the [key: string]: unknown pattern.

export function CardItem({
  children,
  className,
  translateZ = 0,
  translateX = 0,
  translateY = 0,
}: {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
  translateX?: number;
  translateY?: number;
}) {
  const [isMouseEntered] = useMouseEnter();

  return (
    <div
      className={className}
      style={{
        transition: "transform 0.25s ease",
        transform: isMouseEntered
          ? `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px)`
          : "translateX(0px) translateY(0px) translateZ(0px)",
      }}
    >
      {children}
    </div>
  );
}
