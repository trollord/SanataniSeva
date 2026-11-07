import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewsViewer from "@/components/newspaper/NewsViewerClient";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

const getEdition = cache(async (id: string) => {
  return prisma.newsletter.findUnique({
    where: { id, status: "PUBLISHED" },
    select: { id: true, title: true, date: true, pageCount: true },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const e = await getEdition(id);
  if (!e) return { title: "Not found" };
  return {
    title: `${e.title} - ${SITE_NAME}`,
    description: `Read the ${e.title} edition of the ${SITE_NAME} weekly newspaper.`,
    alternates: { canonical: `/newspaper/${e.id}` },
  };
}

export default async function EditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const edition = await getEdition(id);
  if (!edition) notFound();

  const dateStr = edition.date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#E8E8E8] pt-[60px]">

      {/* ── Viewer header bar ───────────────────────────────────────────── */}
      <div
        className="h-10 bg-[#1C0A00] border-b border-white/10
                   flex items-center justify-between px-4 sm:px-5 gap-3 min-w-0"
      >
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
          <span className="font-bold text-sm text-white leading-none tracking-tight">Sanatani</span>
          <span className="text-sm text-white/40 leading-none hidden sm:inline"> Community</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C8541A] ml-0.5 mb-px group-hover:scale-125 transition-transform" />
        </Link>

        {/* Edition date — only on desktop */}
        <span className="text-[11px] text-white/30 truncate min-w-0 hidden sm:block flex-1 text-center">
          {dateStr}
        </span>

        {/* View all editions */}
        <Link
          href="/newspaper"
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold
                     text-white/50 hover:text-white transition-colors"
        >
          <span className="hidden sm:inline">View All Editions</span>
          <span className="sm:hidden">All Editions</span>
          <span className="text-[#C8541A]">↗</span>
        </Link>
      </div>

      <NewsViewer
        id={edition.id}
        title={edition.title}
        pageCount={edition.pageCount}
        extraOffset={40}
      />
    </div>
  );
}
