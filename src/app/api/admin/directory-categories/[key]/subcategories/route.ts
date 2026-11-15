import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { directoryLabel, revalidateDirectory } from "@/lib/directory-categories";

const createSchema = z.object({ label: directoryLabel });

/** Adds a subcategory at the end of its category's list. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { label } = parsed.data;

  const category = await prisma.directoryCategory.findUnique({
    where: { key },
    select: {
      label: true,
      subcategories: { select: { label: true, sortOrder: true } },
    },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // The CSV importer matches subcategories by label ignoring case; the
  // database's unique constraint is case-sensitive, so check here too.
  const lower = label.toLowerCase();
  if (category.subcategories.some((s) => s.label.toLowerCase() === lower)) {
    return NextResponse.json(
      { error: `${category.label} already has a subcategory called “${label}”.` },
      { status: 409 }
    );
  }
  const sortOrder = category.subcategories.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1;

  try {
    const sub = await prisma.directorySubcategory.create({
      data: { categoryKey: key, label, sortOrder },
      select: { id: true },
    });
    revalidateDirectory();
    return NextResponse.json({ id: sub.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `${category.label} already has a subcategory called “${label}”.` },
        { status: 409 }
      );
    }
    throw e;
  }
}
