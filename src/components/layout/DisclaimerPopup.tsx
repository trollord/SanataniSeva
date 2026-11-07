"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

const STORAGE_KEY = "hh_disclaimer_ack";
/** Fired on acknowledgement so other first-visit UI (tours) can start after it. */
export const DISCLAIMER_ACK_EVENT = "hh:disclaimer-ack";

export default function DisclaimerPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  if (!open) return null;

  function acknowledge() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(DISCLAIMER_ACK_EVENT));
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl px-6 pt-7 pb-8 sm:p-8 m-0 sm:m-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase">
            Independent Platform Notice
          </p>
        </div>

        <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-[#FF5F15] mb-3">
          Before you continue
        </h2>

        <p className="text-[13px] text-gray-500 leading-relaxed">
          Sanatani Community (hiranandaniproperties.in) is an <b>independent property listing
          platform</b> for homes located in the Hiranandani Estate locality of
          Thane. We are <b>not affiliated with, endorsed by, or connected to
          the Hiranandani Group</b> or any of its companies. The name
          &ldquo;Hiranandani&rdquo; is used solely to describe the locality in
          which the listed properties are situated.
        </p>

        <p className="text-[12px] text-gray-400 mt-3">
          See our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-[#FF5F15]">
            Terms &amp; Conditions
          </Link>{" "}
          for details.
        </p>

        <button
          onClick={acknowledge}
          className="w-full mt-6 py-3 bg-[#FF5F15] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#FF5F15]/90 transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
