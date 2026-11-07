import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import NewspaperIndex, { type EditionMeta } from "@/components/newspaper/NewspaperIndex";
import { type NewsItemMeta } from "@/components/newspaper/TodaysNewsFeed";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Newspaper - Hiranandani Estate Weekly",
  description: "Read the latest weekly newspaper for Hiranandani Estate residents.",
  alternates: { canonical: "/newspaper" },
};

function toMeta(e: { id: string; title: string; date: Date; pageCount: number }): EditionMeta {
  return {
    id: e.id,
    title: e.title,
    dateStr: e.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    year: e.date.getFullYear(),
    month: e.date.getMonth() + 1,
    pageCount: e.pageCount,
  };
}

function toNewsItemMeta(n: {
  id: string;
  headline: string;
  body: string;
  category: string;
  imageUrl: string | null;
  publishedAt: Date;
}): NewsItemMeta {
  return {
    id: n.id,
    headline: n.headline,
    body: n.body,
    category: n.category,
    imageUrl: n.imageUrl,
    publishedAt: n.publishedAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default async function NewspaperIndexPage() {
  const [editions, rawNews] = await Promise.all([
    prisma.newsletter.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { date: "desc" },
      select: { id: true, title: true, date: true, pageCount: true },
    }),
    prisma.newsItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, headline: true, body: true, category: true, imageUrl: true, publishedAt: true },
    }),
  ]);

  const past      = editions.map(toMeta);
  const newsItems = rawNews.map(toNewsItemMeta);

  return (
    <div className="pt-[60px] min-h-screen">
      <NewspaperIndex past={past} newsItems={newsItems} />
    </div>
  );
}
