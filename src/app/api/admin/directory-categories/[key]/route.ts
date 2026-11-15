import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { directoryLabel, revalidateDirectory } from "@/lib/directory-categories";
import { categoryDeleteBlocker, moveStep, orderWrites, sameLabel } from "@/lib/directory";
import { DIRECTORY_ICON_NAMES } from "@/lib/directory-icons";

/**
 * Rename, change icon, or move one step. The key is not editable: contacts
 * store it, so it stays fixed for the life of the category.
 */
const patchSchema = z
  .object({
    label: directoryLabel,
    icon: z.enum(DIRECTORY_ICON_NAMES),
    move: z.enum(["up", "down"]),
  })
  .partial()
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
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
  const { label, icon, move } = parsed.data;
  if (label === undefined && icon === undefined && move === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const all = await prisma.directoryCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { key: true, label: true, sortOrder: true },
  });
  const index = all.findIndex((c) => c.key === key);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (label !== undefined && all.some((c) => c.key !== key && sameLabel(c.label, label))) {
    return NextResponse.json(
      { error: `There is already a category called “${label}”.` },
      { status: 409 }
    );
  }

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (move) {
    const moved = moveStep(all, index, move);
    if (!moved) {
      return NextResponse.json(
        { error: move === "up" ? "Already at the top" : "Already at the bottom" },
        { status: 400 }
      );
    }
    for (const { item, sortOrder } of orderWrites(moved)) {
      writes.push(prisma.directoryCategory.update({ where: { key: item.key }, data: { sortOrder } }));
    }
  }
  if (label !== undefined || icon !== undefined) {
    writes.push(prisma.directoryCategory.update({ where: { key }, data: { label, icon } }));
  }
  await prisma.$transaction(writes);

  revalidateDirectory();
  return NextResponse.json({ ok: true });
}

/** Only an empty category can go: no contacts, no subcategories. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = await prisma.directoryCategory.findUnique({
    where: { key },
    select: { label: true, _count: { select: { contacts: true, subcategories: true } } },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = categoryDeleteBlocker(category.label, category._count.contacts, category._count.subcategories);
  if (blocker) return NextResponse.json({ error: blocker }, { status: 409 });

  try {
    await prisma.directoryCategory.delete({ where: { key } });
  } catch (e) {
    // A contact or subcategory added since the count above: the foreign keys
    // refuse the delete, which is the rule, so say so rather than 500.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: `${category.label} is in use again. Refresh to see what was added.` },
        { status: 409 }
      );
    }
    throw e;
  }

  revalidateDirectory();
  return NextResponse.json({ ok: true });
}

