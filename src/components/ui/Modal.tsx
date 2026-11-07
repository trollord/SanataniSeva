"use client";

import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  danger?: boolean;
  loading?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  danger = false,
  loading = false,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 px-5 pt-6 pb-8 sm:p-8 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle - mobile only */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#FF5F15] transition-colors p-1"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            {(subtitle || title || description) && (
              <div className="mb-6">
                {subtitle && (
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-2">
                    {subtitle}
                  </p>
                )}
                {title && (
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#FF5F15]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Custom content */}
            {children}

            {/* Confirm / Cancel buttons */}
            {onConfirm && (
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`w-full rounded-full gap-2 py-5 text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50 ${
                    danger
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white"
                  }`}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {confirmLabel ?? "Confirm"}
                </Button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors duration-200 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
