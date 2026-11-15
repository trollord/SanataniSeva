import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { directoryLabel, revalidateDirectory } from "@/lib/directory-categories";
import { moveStep, orderWrites, sameLabel } from "@/lib/directory";

const patchSchema = z
  .object({
    label: directoryLabel,
    move: z.enum(["up", "down"]),
  })
  .partial()
  .strict();

type Params = { params: Promise<{ key: string; id: string }> };

/** Rename, or move one step within its category. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { key, id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { label, move } = parsed.data;
  if (label === undefined && move === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Siblings in display order; also proves the subcategory is in this category.
  const siblings = await prisma.directorySubcategory.findMany({
    where: { categoryKey: key },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true, sortOrder: true },
  });
  const index = siblings.findIndex((s) => s.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (label !== undefined && siblings.some((s) => s.id !== id && sameLabel(s.label, label))) {
    return NextResponse.json(
      { error: `This category already has a subcategory called “${label}”.` },
      { status: 409 }
    );
  }

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (move) {
    const moved = moveStep(siblings, index, move);
    if (!moved) {
      return NextResponse.json(
        { error: move === "up" ? "Already at the top" : "Already at the bottom" },
        { status: 400 }
      );
    }
    for (const { item, sortOrder } of orderWrites(moved)) {
      writes.push(prisma.directorySubcategory.update({ where: { id: item.id }, data: { sortOrder } }));
    }
  }
  if (label !== undefined) {
    writes.push(prisma.directorySubcategory.update({ where: { id }, data: { label } }));
  }
  await prisma.$transaction(writes);

  revalidateDirectory();
  return NextResponse.json({ ok: true });
}

/**
 * Deletes the subcategory. Its contacts stay in the category and simply lose
 * the subcategory (the foreign key is ON DELETE SET NULL); the admin page has
 * already said how many.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { key, id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.directorySubcategory.findFirst({
    where: { id, categoryKey: key },
    select: { _count: { select: { contacts: true } } },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.directorySubcategory.delete({ where: { id } });

  revalidateDirectory();
  return NextResponse.json({ ok: true, unassigned: sub._count.contacts });
}
