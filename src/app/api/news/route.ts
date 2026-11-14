import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@/lib/auth";
import { parseNewsContent } from "@/lib/news";

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

  const json = await req.json();
  const parsed = parseNewsContent(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { publishedAt } = json;
  const item = await prisma.newsItem.create({
    data: {
      ...parsed.data,
      status: "PUBLISHED",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
