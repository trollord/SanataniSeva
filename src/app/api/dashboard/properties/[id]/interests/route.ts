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

  // Verify that the current user is the owner of this property
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (property.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inquiries = await prisma.inquiry.findMany({
    where: { propertyId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      seeker: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inquiries });
}
