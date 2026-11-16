import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveStep, orderWrites } from "@/lib/directory";
import { droppedKeys, promotionFormSchema, toPromotionFields } from "@/lib/promotions";
import {
  checkPromotionCategory,
  deletePromotionObjects,
  revalidatePromotions,
} from "@/lib/promotions-data";

type Params = { params: Promise<{ id: string }> };

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

/**
 * Replaces a promotion's content from the edit dialog. The slug is not
 * touched - it is fixed at create so shared links survive a rename - and
 * neither are sortOrder and hidden, which have their own controls below.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = promotionFormSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = toPromotionFields(parsed.data);

  const categoryError = await checkPromotionCategory(data.categoryKey);
  if (categoryError) return NextResponse.json({ error: categoryError }, { status: 400 });

  const before = await prisma.promotion.findUnique({
    where: { id },
    select: { logoKey: true, imageKeys: true },
  });
  if (!before) return notFound();

  let updated: { id: string; slug: string };
  try {
    updated = await prisma.promotion.update({ where: { id }, data, select: { id: true, slug: true } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return notFound();
    throw e;
  }

  // Only after the row stops pointing at them.
  await deletePromotionObjects(
    droppedKeys([before.logoKey, ...before.imageKeys], [data.logoKey, ...data.imageKeys])
  );
  revalidatePromotions(updated.slug);
  return NextResponse.json(updated);
}

/** Hide / show, or move one step in the display order. */
const patchSchema = z
  .object({
    hidden: z.boolean(),
    move: z.enum(["up", "down"]),
  })
  .partial()
  .strict();

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { hidden, move } = parsed.data;
  if (hidden === undefined && move === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Same order the admin list shows, so "up" means what the admin saw.
  const all = await prisma.promotion.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, slug: true, sortOrder: true },
  });
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return notFound();

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
      writes.push(prisma.promotion.update({ where: { id: item.id }, data: { sortOrder } }));
    }
  }
  if (hidden !== undefined) {
    writes.push(prisma.promotion.update({ where: { id }, data: { hidden } }));
  }
  await prisma.$transaction(writes);

  revalidatePromotions(all[index].slug);
  return NextResponse.json({ ok: true });
}

/** Deletes the promotion, then its logo and photos from S3. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  let deleted: { slug: string; logoKey: string | null; imageKeys: string[] };
  try {
    deleted = await prisma.promotion.delete({
      where: { id },
      select: { slug: true, logoKey: true, imageKeys: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return notFound();
    throw e;
  }

  await deletePromotionObjects(droppedKeys([deleted.logoKey, ...deleted.imageKeys], []));
  revalidatePromotions(deleted.slug);
  return NextResponse.json({ ok: true });
}
