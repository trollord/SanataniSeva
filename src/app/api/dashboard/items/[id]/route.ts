import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      vehicleType: true,
      condition: true,
      brand: true,
      yearPurchased: true,
      price: true,
      priceNegotiable: true,
      pickupLocality: true,
      pickupArea: true,
      status: true,
      sellerId: true,
      images: {
        select: { id: true, url: true, s3Key: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ item });
}
