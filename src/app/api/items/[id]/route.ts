import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemBodySchema } from "@/lib/validations/item";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.item.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (existing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = itemBodySchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? [];
      return NextResponse.json(
        { error: issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { images, yearPurchased, vehicleType, brand, pickupArea, ...rest } =
      parsed.data;
    const item = await prisma.item.update({
      where: { id },
      data: {
        ...rest,
        brand: brand || null,
        pickupArea: pickupArea || null,
        vehicleType:
          rest.category === "VEHICLES" && vehicleType ? vehicleType : null,
        yearPurchased: yearPurchased ?? null,
        status: "ACTIVE",
        activatedAt: new Date(),
        images: {
          deleteMany: {},
          create: images.map((img) => ({
            url: img.url,
            s3Key: img.s3Key,
            isPrimary: img.isPrimary,
          })),
        },
      },
      select: { id: true, status: true },
    });

    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${id}`);
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[PUT /api/items/:id]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.item.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (existing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.item.update({ where: { id }, data: { status: "SOLD" } });
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.item.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (existing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cascade handles ItemImage; ItemInquiry rows remain (archived for the seeker).
  await prisma.item.delete({ where: { id } });

  revalidatePath("/marketplace");
  return NextResponse.json({ ok: true });
}
