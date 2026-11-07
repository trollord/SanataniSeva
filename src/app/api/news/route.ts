import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

  const { headline, body, category, imageUrl, publishedAt } = await req.json();
  if (!headline?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "headline and body are required" }, { status: 400 });
  }

  const item = await prisma.newsItem.create({
    data: {
      headline: headline.trim(),
      body: body.trim(),
      category: category ?? "GENERAL",
      imageUrl: imageUrl?.trim() || null,
      status: "PUBLISHED",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
