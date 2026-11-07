import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "REJECTED", "PENDING"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, notes } = (await req.json()) as { status: AllowedStatus; notes?: string };

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, status: true, activatedAt: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const timestamps =
    status === "ACTIVE"
      ? { activatedAt: property.activatedAt ?? new Date(), closedAt: null }
      : status === "INACTIVE" && property.status === "ACTIVE"
      ? { closedAt: new Date() }
      : {};

  await prisma.$transaction([
    prisma.property.update({ where: { id }, data: { status, ...timestamps } }),
    prisma.adminVerification.create({
      data: {
        propertyId: id,
        adminId: session.user.id,
        action: `STATUS_${status}`,
        notes: notes ?? `Status changed ${property.status} → ${status} from admin panel`,
      },
    }),
  ]);

  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);

  return NextResponse.json({ success: true, status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Hard delete - clean up relations without cascade first
  await prisma.inquiry.deleteMany({ where: { propertyId: id } });
  await prisma.adminVerification.deleteMany({ where: { propertyId: id } });
  await prisma.priceHistory.deleteMany({ where: { propertyId: id } });
  await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
  await prisma.property.delete({ where: { id } });

  revalidatePath("/listings");

  return NextResponse.json({ deleted: true });
}
