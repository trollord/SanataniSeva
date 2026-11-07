"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Select with type-ahead, for lists long enough that scanning is a chore - the
 * category list alone is 22 entries.
 *
 * The panel is rendered through a portal and positioned from the trigger's
 * bounding box rather than absolutely inside the field: these live in a dialog
 * with `overflow-y-auto`, which would otherwise clip the panel at the dialog
 * edge. It follows that it has to close on scroll and resize, since a portalled
 * element cannot track a moving trigger.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchable,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Defaults on once the list is long enough to be worth filtering. */
  searchable?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const showSearch = searchable ?? options.length > 7;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Measure before paint so the panel never renders at the wrong spot first.
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation(); // don't let the dialog close too
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function reposition() {
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", reposition);
    // capture: catches scrolling of the dialog body, not just the window
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const i = options.findIndex((o) => o.value === value);
      setActiveIndex(i < 0 ? 0 : i);
      if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, options, value, showSearch]);

  function commit(v: string) {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) commit(opt.value);
    }
  }

  // Flip above the trigger when there is not enough room below.
  const panelMaxHeight = 288;
  const spaceBelow = rect ? window.innerHeight - rect.bottom - 8 : 0;
  const flip = rect ? spaceBelow < 200 && rect.top > spaceBelow : false;

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50 focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none"
      >
        <span className={selected ? "truncate" : "truncate text-gray-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            onKeyDown={onListKeyDown}
            style={{
              position: "fixed",
              left: rect.left,
              width: rect.width,
              ...(flip
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
              maxHeight: panelMaxHeight,
              zIndex: 90,
            }}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)]"
          >
            {showSearch && (
              <div className="relative shrink-0 border-b border-gray-100 p-2">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onListKeyDown}
                  placeholder="Search…"
                  aria-label="Search options"
                  className="w-full rounded-md bg-gray-50 py-2 pr-3 pl-8 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            )}

            <div className="overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-gray-400">
                  Nothing matches “{query}”
                </p>
              ) : (
                filtered.map((o, i) => {
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => commit(o.value)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                        i === activeIndex ? "bg-gray-50" : ""
                      } ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}
                    >
                      {/* Wraps rather than truncating - these labels are long */}
                      <span className="min-w-0 flex-1 leading-snug break-words">
                        {o.label}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[#FF5F15]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
