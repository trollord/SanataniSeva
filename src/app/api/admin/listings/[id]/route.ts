import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAmenities } from "@/lib/utils/formatters";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        listingType: true,
        status: true,
        building: true,
        flatNumber: true,
        address: true,
        locality: true,
        bedrooms: true,
        bathrooms: true,
        areaSqft: true,
        floor: true,
        totalFloors: true,
        furnished: true,
        amenities: true,
        price: true,
        deposit: true,
        createdAt: true,
        images: {
          select: { id: true, url: true, isPrimary: true },
          orderBy: { isPrimary: "desc" },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        inquiries: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            phone: true,
            createdAt: true,
            seeker: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Mask sensitive fields for non-admin roles
    const owner = isAdmin
      ? property.owner
      : { id: property.owner.id, name: property.owner.name, email: null, phone: null };

    return NextResponse.json({
      property: {
        ...property,
        flatNumber: isAdmin ? property.flatNumber : null,
        address: isAdmin ? property.address : null,
        owner,
        amenities: parseAmenities(property.amenities),
      },
      isAdmin,
    });
  } catch (err) {
    console.error("[GET /api/admin/listings/[id]]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
