import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import NewsBody from "@/components/news/NewsBody";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 300;

const CATEGORY_LABEL: Record<string, string> = {
  EVENTS: "Events",
  COMMUNITY: "Community",
  ANNOUNCEMENTS: "Announcements",
  SPORTS: "Sports",
  GENERAL: "General",
};

const getItem = cache(async (id: string) =>
  prisma.newsItem.findUnique({
    where: { id },
    select: {
      id: true,
      headline: true,
      body: true,
      category: true,
      imageUrls: true,
      publishedAt: true,
      status: true,
    },
  })
);

/** Drafts are visible to an admin so a post can be checked before it goes out. */
async function getVisibleItem(id: string) {
  const item = await getItem(id);
  if (!item) return null;
  if (item.status !== "PUBLISHED") {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return null;
  }
  return item;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item || item.status !== "PUBLISHED") return { title: "Not found" };

  // The body is pasted from WhatsApp and opens with decorative lines, so take
  // the first line with real words in it for the preview text.
  const summary =
    item.body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.replace(/[^\p{L}\p{N}]/gu, "").length > 25) ?? item.body;

  return {
    title: `${item.headline} - ${SITE_NAME}`,
    description: summary.slice(0, 160),
    alternates: { canonical: `/news/${item.id}` },
    openGraph: {
      title: item.headline,
      description: summary.slice(0, 200),
      type: "article",
      publishedTime: item.publishedAt.toISOString(),
      images: item.imageUrls.length ? [{ url: item.imageUrls[0] }] : undefined,
    },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getVisibleItem(id);
  if (!item) notFound();

  const dateStr = item.publishedAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="pt-[100px] pb-20 px-5 sm:px-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/newspaper"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Latest News
        </Link>

        {item.status !== "PUBLISHED" && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Draft — only you can see this. Publish it from the admin panel.
          </p>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="mt-5 sm:mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-full border border-[#FDDCC8] bg-[#FFF3EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8541A]">
              {CATEGORY_LABEL[item.category] ?? item.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.15] tracking-tight text-[#0B0B0C]">
            {item.headline}
          </h1>
        </header>

        {/* ── Poster + text ───────────────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:items-start">
          {item.imageUrls.length > 0 && (
            <div className="lg:sticky lg:top-24">
              {/* Contained, never cropped: these are dense flyers whose value is
                  the text printed on them. */}
              <div className="overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#F7F3EC] p-2">
                <Image
                  src={item.imageUrls[0]}
                  alt={item.headline}
                  width={840}
                  height={1190}
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="h-auto w-full rounded-xl object-contain"
                  priority
                />
              </div>

              {item.imageUrls.length > 1 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {item.imageUrls.slice(1).map((url, i) => (
                    <div
                      key={url}
                      className="overflow-hidden rounded-xl border border-[#EDE5D8] bg-[#F7F3EC] p-1.5"
                    >
                      <Image
                        src={url}
                        alt={`${item.headline} — image ${i + 2}`}
                        width={280}
                        height={396}
                        sizes="160px"
                        className="h-auto w-full rounded-lg object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="min-w-0">
            <NewsBody text={item.body} />
          </div>
        </div>

        <div className="mt-14 border-t border-[#EDE5D8] pt-6">
          <Link
            href="/newspaper"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8541A] hover:underline underline-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All community news
          </Link>
        </div>
      </div>
    </article>
  );
}
