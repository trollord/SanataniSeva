import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the property belongs to this user (or they're admin)
  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (property.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { url, s3Key, isPrimary } = await req.json();

  if (!url || !s3Key) {
    return NextResponse.json({ error: "url and s3Key are required" }, { status: 400 });
  }

  // If this image is primary, unset any existing primary first
  if (isPrimary) {
    await prisma.propertyImage.updateMany({
      where: { propertyId: id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.propertyImage.create({
    data: { propertyId: id, url, s3Key, isPrimary: isPrimary ?? false },
    select: { id: true, url: true, s3Key: true, isPrimary: true },
  });

  return NextResponse.json({ image }, { status: 201 });
}
