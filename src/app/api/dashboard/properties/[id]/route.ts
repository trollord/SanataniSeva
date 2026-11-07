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

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      listingType: true,
      status: true,
      address: true,
      building: true,
      flatNumber: true,
      locality: true,
      latitude: true,
      longitude: true,
      bedrooms: true,
      bathrooms: true,
      areaSqft: true,
      floor: true,
      totalFloors: true,
      furnished: true,
      amenities: true,
      price: true,
      deposit: true,
      rentNegotiable: true,
      lockInMonths: true,
      availableFrom: true,
      lockInNegotiable: true,
      ownerId: true,
      images: {
        select: { id: true, url: true, s3Key: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (property.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ property });
}
