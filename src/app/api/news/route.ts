import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@/lib/auth";

/**
 * Images must be ones we uploaded. The field used to accept a pasted URL, and
 * an admin should not be able to hotlink an arbitrary host into the feed.
 * Fails closed: with no bucket configured nothing is accepted, rather than
 * falling back to a prefix like "https://" that would match anything.
 */
const BUCKET_URL = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL;

export async function GET() {
  const items = await prisma.newsItem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, headline: true, body: true, category: true, publishedAt: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { headline, body, category, imageUrls, publishedAt } = await req.json();
  if (!headline?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "headline and body are required" }, { status: 400 });
  }

  const item = await prisma.newsItem.create({
    data: {
      headline: headline.trim(),
      body: body.trim(),
      category: category ?? "GENERAL",
      imageUrls: Array.isArray(imageUrls)
        ? imageUrls
            .filter((u: unknown): u is string => typeof u === "string")
            .map((u) => u.trim())
            .filter((u) => (BUCKET_URL ? u.startsWith(BUCKET_URL) : false))
            .slice(0, 6)
        : [],
      status: "PUBLISHED",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
