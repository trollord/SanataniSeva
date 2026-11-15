import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { directoryLabel, revalidateDirectory } from "@/lib/directory-categories";
import { sameLabel, slugifyCategoryKey } from "@/lib/directory";
import { DEFAULT_DIRECTORY_ICON, DIRECTORY_ICON_NAMES } from "@/lib/directory-icons";

const createSchema = z.object({
  label: directoryLabel,
  icon: z.enum(DIRECTORY_ICON_NAMES).default(DEFAULT_DIRECTORY_ICON),
});

/** Adds a category at the end of the list. */
export async function POST(req: NextRequest) {
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
  const { label, icon } = parsed.data;

  const existing = await prisma.directoryCategory.findMany({
    select: { key: true, label: true, sortOrder: true },
  });
  // The CSV importer resolves categories by label, ignoring case, so two that
  // differ only in case would make a sheet ambiguous.
  if (existing.some((c) => sameLabel(c.label, label))) {
    return NextResponse.json(
      { error: `There is already a category called “${label}”.` },
      { status: 409 }
    );
  }

  const key = slugifyCategoryKey(label, existing.map((c) => c.key));
  const sortOrder = existing.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

  try {
    await prisma.directoryCategory.create({ data: { key, label, icon, sortOrder } });
  } catch (e) {
    // Two admins adding the same name at once: the key is the primary key.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "That category was just added. Refresh and try again." }, { status: 409 });
    }
    throw e;
  }

  revalidateDirectory();
  return NextResponse.json({ key }, { status: 201 });
}
