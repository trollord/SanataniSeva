import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPropertySchema } from "@/lib/validations/property";
import { stringifyAmenities } from "@/lib/utils/formatters";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      listingType: true,
      status: true,
      building: true,
      address: true,
      locality: true,
      bedrooms: true,
      bathrooms: true,
      areaSqft: true,
      floor: true,
      totalFloors: true,
      furnished: true,
      availableFrom: true,
      amenities: true,
      price: true,
      deposit: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      // flatNumber intentionally excluded from public detail
      images: {
        select: { id: true, url: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
      priceHistory: {
        select: { price: true, recordedAt: true, source: true },
        orderBy: { recordedAt: "asc" },
      },
      owner: {
        select: { id: true, name: true, image: true },
        // phone/email excluded - only returned after payment
      },
      _count: { select: { inquiries: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json({ property });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true, status: true, price: true },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canEdit =
    property.ownerId === session.user.id ||
    ["ADMIN"].includes(session.user.role);

  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return NextResponse.json({ error: issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { price, deposit, lockInMonths, amenities, ...rest } = parsed.data;

  const updated = await prisma.property.update({
    where: { id },
    data: {
      ...rest,
      price,
      deposit: deposit ?? null,
      lockInMonths: lockInMonths && lockInMonths > 0 ? lockInMonths : null,
      amenities: stringifyAmenities(amenities ?? []),
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  if (price !== property.price) {
    await prisma.priceHistory.create({
      data: { propertyId: id, price, source: "LISTING" },
    });
  }

  return NextResponse.json({ property: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true, status: true },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin: hard delete immediately (clean up related records first)
  if (session.user.role === "ADMIN") {
    await prisma.inquiry.deleteMany({ where: { propertyId: id } });
    await prisma.adminVerification.deleteMany({ where: { propertyId: id } });
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }

  // Owner: must own the property
  if (property.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (property.status === "DELETE_REQUESTED") {
    return NextResponse.json({ error: "Deletion already requested" }, { status: 409 });
  }

  // Owner cannot delete directly - submit a request for admin approval
  await prisma.property.update({
    where: { id },
    data: { status: "DELETE_REQUESTED" },
  });

  return NextResponse.json({ requested: true });
}
