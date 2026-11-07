"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { NewsViewerProps } from "./NewsViewer";

// react-pdf pulls in pdfjs-dist, which is browser-only and throws if it is
// evaluated during SSR. The reader page is a Server Component — where
// `ssr: false` isn't allowed — so the client-only boundary lives here.
// Only the *type* is imported above, so NewsViewer stays out of the server bundle.
const NewsViewer = dynamic(() => import("./NewsViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-white/20">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

/** Mirrors NAVBAR_H in NewsViewer so the placeholder reserves the same height. */
const NAVBAR_H = 60;

export default function NewsViewerClient(props: NewsViewerProps) {
  return (
    <div
      className="bg-[#1C1C1C]"
      style={{ height: `calc(100dvh - ${NAVBAR_H + (props.extraOffset ?? 0)}px)` }}
    >
      <NewsViewer {...props} />
    </div>
  );
}
