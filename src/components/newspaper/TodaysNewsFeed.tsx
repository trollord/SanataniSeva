import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calendar, Newspaper } from "lucide-react";

export interface NewsItemMeta {
  id: string;
  headline: string;
  body: string;
  category: string;
  imageUrls?: string[];
  publishedAt: string;
}

const CATEGORY: Record<string, { label: string; chip: string }> = {
  EVENTS:        { label: "Events",        chip: "bg-[#FFF3EC] text-[#C8541A] border-[#FDDCC8]" },
  COMMUNITY:     { label: "Community",     chip: "bg-green-50  text-green-700 border-green-200" },
  ANNOUNCEMENTS: { label: "Announcements", chip: "bg-amber-50  text-amber-700 border-amber-200" },
  SPORTS:        { label: "Sports",        chip: "bg-blue-50   text-blue-700  border-blue-200"  },
  GENERAL:       { label: "General",       chip: "bg-white     text-gray-600  border-gray-200"  },
};

/**
 * Builds a preview from a post pasted out of WhatsApp.
 *
 * Such a post is a stack of short lines rather than prose, and the lines
 * carrying a link exist only to hold that link - surfacing one as the preview
 * shows the reader a bare URL. So links are dropped here (they are live on the
 * post page) and what remains is joined back into a readable run.
 */
function excerpt(body: string, max = 180): string {
  const text = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/https?:\/\/|www\./i.test(l))
    .join(" · ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function Chip({ category }: { category: string }) {
  const meta = CATEGORY[category] ?? CATEGORY.GENERAL;
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${meta.chip}`}
    >
      {meta.label}
    </span>
  );
}

/**
 * Community news.
 *
 * Previously an auto-advancing carousel that cropped portrait flyers into a
 * landscape hero and clamped the body to three lines with nowhere to go. Now
 * every post is on the page at once and every card opens its own page, so
 * nothing is hidden behind a rotation and nothing is unreachable.
 */
export default function TodaysNewsFeed({ items }: { items: NewsItemMeta[] }) {
  if (items.length === 0) {
    return (
      <section>
        <SectionHeading />
        <div className="mt-6 rounded-2xl border border-[#EDE5D8] bg-white px-6 py-16 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-[#D8CDBE]" />
          <p className="text-sm font-semibold text-[#1C1C1C]">No news posted yet.</p>
          <p className="mt-1 text-xs text-[#8A8178]">
            Community updates and event notices will appear here.
          </p>
        </div>
      </section>
    );
  }

  const [lead, ...rest] = items;

  return (
    <section>
      <SectionHeading />

      {/* ── Lead story ──────────────────────────────────────────────────── */}
      <Link
        href={`/news/${lead.id}`}
        className="group mt-6 grid overflow-hidden rounded-2xl border border-[#EDE5D8] bg-white transition-shadow hover:shadow-[0_2px_20px_rgba(28,10,0,0.07)] sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
      >
        <div className="flex items-center justify-center bg-[#F7F3EC] p-4 sm:p-5">
          {lead.imageUrls?.[0] ? (
            <Image
              src={lead.imageUrls[0]}
              alt={lead.headline}
              width={600}
              height={850}
              sizes="(max-width: 640px) 100vw, 300px"
              className="h-auto max-h-[380px] w-auto max-w-full rounded-lg object-contain"
              priority
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-lg bg-[#EDE5D8]">
              <Newspaper className="h-8 w-8 text-[#B8AC9B]" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Chip category={lead.category} />
            <span className="inline-flex items-center gap-1.5 text-xs text-[#8A8178]">
              <Calendar className="h-3.5 w-3.5" />
              {lead.publishedAt}
            </span>
          </div>

          <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight tracking-tight text-[#1C1C1C] sm:text-[32px]">
            {lead.headline}
          </h3>

          <p className="mt-3 text-[15px] leading-relaxed text-[#6B6B6B] line-clamp-3">
            {excerpt(lead.body, 220)}
          </p>

          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8541A]">
            Read full post
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>

      {/* ── The rest ──────────────────────────────────────────────────────
          Column count follows the post count, so two posts fill the row
          rather than leaving a third slot conspicuously empty. */}
      {rest.length > 0 && (
        <div
          className={`mt-4 grid gap-4 ${
            rest.length === 1
              ? "sm:grid-cols-1"
              : rest.length === 2
                ? "sm:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {rest.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#EDE5D8] bg-white transition-shadow hover:shadow-[0_2px_16px_rgba(28,10,0,0.06)]"
            >
              <div className="flex h-44 items-center justify-center bg-[#F7F3EC] p-3">
                {item.imageUrls?.[0] ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt={item.headline}
                    width={400}
                    height={566}
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="h-full w-auto max-w-full rounded-md object-contain"
                  />
                ) : (
                  <Newspaper className="h-7 w-7 text-[#B8AC9B]" />
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <Chip category={item.category} />
                  <span className="text-[11px] text-[#8A8178]">{item.publishedAt}</span>
                </div>

                <h4 className="mt-2.5 font-semibold leading-snug tracking-tight text-[#1C1C1C] line-clamp-2">
                  {item.headline}
                </h4>

                <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6B6B] line-clamp-2">
                  {excerpt(item.body, 120)}
                </p>

                <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#C8541A]">
                  Read more
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeading() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C8541A]" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8541A]">
          Today&apos;s News
        </h2>
      </div>
      <p className="ml-[18px] text-xs text-[#9E6B3F]">Community events &amp; highlights</p>
    </div>
  );
}
