import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { BLOG_POSTS } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, items] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    }),
    prisma.item.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const base = SITE_URL;

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/listings`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/marketplace`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/community`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    ...BLOG_POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...properties.map((p) => ({
      url: `${base}/listings/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...items.map((i) => ({
      url: `${base}/marketplace/${i.id}`,
      lastModified: i.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
