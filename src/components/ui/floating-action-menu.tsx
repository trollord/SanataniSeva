"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An option either navigates (`href`) or runs an action (`onClick`). Use
 * `href` for pages: it renders a real link, so the page's loading screen is
 * prefetched and shows the instant it is pressed. A router.push from onClick
 * left the old page on screen, apparently dead, until the server had rendered
 * the whole new one.
 */
type MenuOption = {
  label: string;
  Icon?: React.ReactNode;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

const OPTION_CLASS = "flex items-center gap-2.5 px-5 py-2.5 text-[0.9rem] rounded-[10px] border-none";
const OPTION_STYLE: React.CSSProperties = {
  background: "#2a2a2a",
  color: "#d4d4d4",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
};

/** Swaps the option's icon for a spinner while its navigation is pending. */
function LinkOptionIcon({ icon }: { icon?: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" /> : <>{icon}</>;
}

type FloatingActionMenuProps = {
  options: MenuOption[];
  className?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  /**
   * Called on a press outside the trigger and the menu, on Escape and on
   * navigation. The menu is portalled to <body>, so a caller's own
   * outside-click check cannot see it: pressing an option used to count as
   * "outside" and close the menu before the click landed.
   */
  onClose?: () => void;
  direction?: "up" | "down";
};

const FloatingActionMenu = ({
  options,
  className,
  trigger,
  isOpen: controlledOpen,
  onToggle,
  onClose,
  direction = "up",
}: FloatingActionMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleMenu = onToggle || (() => setInternalOpen(!internalOpen));
  const close = onClose ?? (() => setInternalOpen(false));
  // Read through a ref so the listeners below are not re-added every render
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Warm the pages as soon as the menu opens, so the loading screen is ready
  // before the pointer reaches an option.
  const hrefs = options.flatMap((o) => (o.href ? [o.href] : [])).join("|");
  useEffect(() => {
    if (isOpen && hrefs) hrefs.split("|").forEach((h) => router.prefetch(h));
  }, [isOpen, hrefs, router]);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const rightOffset = window.innerWidth - rect.right;
    if (direction === "down") {
      setPos({ top: rect.bottom + 8, right: rightOffset });
    } else {
      setPos({ top: rect.top - 8, right: rightOffset });
    }
  }, [direction]);

  useEffect(() => {
    if (isOpen) {
      updatePos();
      window.addEventListener("scroll", updatePos, { passive: true });
      window.addEventListener("resize", updatePos, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [isOpen, updatePos]);

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      closeRef.current();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // A menu left open across a client-side navigation would float over the
  // next page, invisible once its exit started but still taking clicks.
  useEffect(() => {
    closeRef.current();
  }, [pathname]);

  return (
    <div className={cn("relative", className)} ref={triggerRef}>
      {trigger ? (
        <div onClick={toggleMenu}>{trigger}</div>
      ) : (
        <Button
          onClick={toggleMenu}
          className="w-10 h-10 rounded-full bg-[#ffffff20] hover:bg-[#ffffff35] shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <Plus className="w-6 h-6" />
          </motion.div>
        </Button>
      )}

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, x: 10, y: direction === "down" ? -10 : 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)", pointerEvents: "auto" }}
                // Fade in place, and stop taking clicks the moment it starts
                // closing: the old slide-away moved an option out from under
                // a press, so the click never fired, and the half-faded panel
                // kept swallowing clicks on whatever sat beneath it.
                exit={{ opacity: 0, filter: "blur(10px)", pointerEvents: "none", transition: { duration: 0.15 } }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.15,
                }}
                className="fixed z-[9999]"
                style={{
                  top: direction === "down" ? `${pos.top}px` : undefined,
                  bottom: direction === "up" ? `${window.innerHeight - pos.top}px` : undefined,
                  right: `${pos.right}px`,
                }}
              >
                <div className="flex flex-col items-end gap-2">
                  {options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                    >
                      {option.href ? (
                        <Link
                          href={option.href}
                          // The menu closes itself when the route changes; on
                          // the page it already points to there is no change.
                          onClick={() => option.href === pathname && closeRef.current()}
                          className={cn(buttonVariants(), OPTION_CLASS)}
                          style={OPTION_STYLE}
                        >
                          <LinkOptionIcon icon={option.Icon} />
                          <span>{option.label}</span>
                        </Link>
                      ) : (
                        <Button onClick={option.onClick} className={OPTION_CLASS} style={OPTION_STYLE}>
                          {option.Icon}
                          <span>{option.label}</span>
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default FloatingActionMenu;
