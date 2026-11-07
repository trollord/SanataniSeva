"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import {
  usePlacesAutocomplete,
  PlacePrediction,
  SelectedPlace,
} from "@/hooks/usePlacesAutocomplete";

interface Props {
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
}

function HighlightedText({
  text,
  matches,
}: {
  text: string;
  matches: Array<{ startOffset: number; endOffset: number }>;
}) {
  if (!matches.length) return <span>{text}</span>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach(({ startOffset, endOffset }, i) => {
    if (startOffset > cursor)
      parts.push(<span key={`pre-${i}`}>{text.slice(cursor, startOffset)}</span>);
    parts.push(
      <span key={`m-${i}`} className="font-semibold text-[#FF5F15]">
        {text.slice(startOffset, endOffset)}
      </span>
    );
    cursor = endOffset;
  });

  if (cursor < text.length)
    parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return <>{parts}</>;
}

export default function LocationInput({
  onSelect,
  placeholder = "Search address or landmark…",
}: Props) {
  const {
    query,
    predictions,
    loading,
    error,
    handleQueryChange,
    selectPrediction,
    clearPredictions,
    setQuery,
  } = usePlacesAutocomplete();

  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isOpen = open && (loading || !!error || predictions.length > 0 || (query.length >= 3 && !loading));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleQueryChange(e.target.value);
    setActiveIdx(-1);
    setOpen(true);
  }

  function handleClear() {
    setQuery("");
    clearPredictions();
    setOpen(false);
    inputRef.current?.focus();
  }

  async function handleSelect(prediction: PlacePrediction) {
    setOpen(false);
    setActiveIdx(-1);
    const place = await selectPrediction(prediction);
    if (place) onSelect(place);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || !predictions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => (predictions.length > 0 || query.length >= 3) && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#f2f4f4] border-none rounded-lg pl-10 pr-9 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : query ? (
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden max-h-60 overflow-y-auto"
        >
          {/* Loading skeleton */}
          {loading && predictions.length === 0 && (
            <li className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Searching…
            </li>
          )}

          {/* Error */}
          {error && (
            <li className="px-4 py-3 text-sm text-red-500">{error}</li>
          )}

          {/* No results */}
          {!loading && !error && query.length >= 3 && predictions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">No results found</li>
          )}

          {/* Predictions */}
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                i === activeIdx ? "bg-[#f5f5f5]" : "hover:bg-[#f5f5f5]"
              } ${i > 0 ? "border-t border-gray-50" : ""}`}
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  <HighlightedText text={p.mainText} matches={p.matches} />
                </p>
                {p.secondaryText && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.secondaryText}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
