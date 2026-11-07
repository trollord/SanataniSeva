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

  const { id: propertyId } = await params;
  const seekerId = session.user.id;

  // Find any inquiry for this seeker (any status)
  const inquiry = await prisma.inquiry.findUnique({
    where: { propertyId_seekerId: { propertyId, seekerId } },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Register interest first" }, { status: 403 });
  }

  // Fetch property with owner contact details
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      flatNumber: true,
      address: true,
      owner: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json({
    flatNumber: property.flatNumber,
    address: property.address,
    owner: property.owner,
  });
}
