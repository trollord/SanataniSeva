import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemBodySchema } from "@/lib/validations/item";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const item = await prisma.item.create({
      data: {
        ...rest,
        brand: brand || null,
        pickupArea: pickupArea || null,
        vehicleType:
          rest.category === "VEHICLES" && vehicleType ? vehicleType : null,
        yearPurchased: yearPurchased ?? null,
        sellerId: session.user.id,
        status: "ACTIVE",
        activatedAt: new Date(),
        images: {
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

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/items]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
