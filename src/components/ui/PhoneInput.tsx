"use client";

import { useState } from "react";
import { COUNTRY_CODES, splitPhone } from "@/lib/validations/phone";

/**
 * Country code + number input. `value` is the full E.164 number
 * ("+919876543210") or "" when the number part is empty.
 */
export default function PhoneInput({
  value,
  onChange,
  error = false,
  id,
  autoFocus = false,
  placeholder = "98765 43210",
}: {
  value: string;
  onChange: (full: string) => void;
  error?: boolean;
  id?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const parsed = value ? splitPhone(value) : null;
  const [code, setCode] = useState(parsed?.code ?? "+91");
  const national = parsed?.national ?? "";

  function emit(nextCode: string, nextNational: string) {
    onChange(nextNational ? `${nextCode}${nextNational}` : "");
  }

  const borderCls = error
    ? "border-red-400 focus-within:border-red-500"
    : "border-gray-200 focus-within:border-[#FF5F15]/40";

  return (
    <div className={`flex w-full border bg-white rounded-lg overflow-hidden transition-colors ${borderCls}`}>
      <select
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          emit(e.target.value, national);
        }}
        aria-label="Country code"
        className="bg-[#f7f8f8] border-r border-gray-200 px-2 py-3 text-sm text-[#FF5F15] focus:outline-none cursor-pointer shrink-0"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={national}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => emit(code, e.target.value.replace(/\D/g, "").slice(0, 15))}
        className="flex-1 min-w-0 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}
