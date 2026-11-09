"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

/**
 * App confirmation dialog, replacing window.confirm().
 *
 * The native dialog is unstyled, says "www.sanataniseva.com says", blocks the
 * whole browser thread, and cannot be themed. This renders the same Modal the
 * rest of the app uses.
 *
 * Promise-based so it drops straight into the call shape the native API had:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete this?" }))) return;
 */

export interface ConfirmOptions {
  title: string;
  /** Explains the consequence - say if it cannot be undone. */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for destructive actions. */
  danger?: boolean;
}

type Resolver = (confirmed: boolean) => void;

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  /** Any close path must settle the promise, or the caller awaits forever. */
  const settle = useCallback((confirmed: boolean) => {
    setOpen(false);
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        onClose={() => settle(false)}
        title={options?.title ?? ""}
        description={options?.description}
        confirmLabel={options?.confirmLabel ?? "Confirm"}
        cancelLabel={options?.cancelLabel ?? "Cancel"}
        danger={options?.danger}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider> (mounted in the root layout)");
  }
  return ctx;
}
