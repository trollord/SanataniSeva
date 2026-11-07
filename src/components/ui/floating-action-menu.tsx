"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  className?: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  direction?: "up" | "down";
};

const FloatingActionMenu = ({
  options,
  className,
  trigger,
  isOpen: controlledOpen,
  onToggle,
  direction = "up",
}: FloatingActionMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleMenu = onToggle || (() => setInternalOpen(!internalOpen));

  const triggerRef = useRef<HTMLDivElement>(null);
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
                initial={{ opacity: 0, x: 10, y: direction === "down" ? -10 : 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, y: direction === "down" ? -10 : 10, filter: "blur(10px)" }}
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
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                    >
                      <Button
                        onClick={option.onClick}
                        className="flex items-center gap-2.5 px-5 py-2.5 text-[0.9rem] rounded-[10px] border-none"
                        style={{
                          background: "#2a2a2a",
                          color: "#d4d4d4",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        {option.Icon}
                        <span>{option.label}</span>
                      </Button>
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
