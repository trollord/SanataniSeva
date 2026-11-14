import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseNewsContent } from "@/lib/news";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session;
}

/**
 * Replaces a post's content from the edit dialog. publishedAt and status are
 * deliberately not taken from the body: the feed is ordered by publishedAt, so
 * correcting a typo must not move a post, and status has its own toggle below.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = parseNewsContent(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const item = await prisma.newsItem.update({ where: { id }, data: parsed.data });
    // The article and the index are ISR (5 min / 1 h); an edit is usually a
    // correction, so it should not wait that long. The home slider has its own
    // 60s unstable_cache and is left to expire.
    revalidatePath("/newspaper");
    revalidatePath(`/news/${id}`);
    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = await req.json();
  const item = await prisma.newsItem.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.newsItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
