import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promotionFormSchema, toPromotionFields } from "@/lib/promotions";
import {
  checkPromotionCategory,
  revalidatePromotions,
  uniquePromotionSlug,
} from "@/lib/promotions-data";

/** Adds a promotion at the end of the list. Live straight away unless dated. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const [slug, last] = await Promise.all([
    uniquePromotionSlug(data.name),
    prisma.promotion.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } }),
  ]);

  try {
    const created = await prisma.promotion.create({
      data: { ...data, slug, sortOrder: (last?.sortOrder ?? -1) + 1 },
      select: { id: true, slug: true },
    });
    revalidatePromotions(created.slug);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // Two admins adding the same name at once: the slug is unique.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A promotion with that name was just added. Try again." },
        { status: 409 }
      );
    }
    throw e;
  }
}
