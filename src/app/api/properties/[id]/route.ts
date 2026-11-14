import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createPropertySchema, propertyImageSchema } from "@/lib/validations/property";
import { PROPERTY_IMAGE_ORDER } from "@/lib/media-order";
import { stringifyAmenities } from "@/lib/utils/formatters";
import { saveContactPhone } from "@/lib/contact-phone";

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
      coveredParking: true,
      uncoveredParking: true,
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
        orderBy: PROPERTY_IMAGE_ORDER,
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

  // Optional so a caller that only edits details leaves the photos alone
  let images: z.infer<typeof propertyImageSchema>[] | undefined;
  if (body.images !== undefined) {
    const parsedImages = z.array(propertyImageSchema).max(30).safeParse(body.images);
    if (!parsedImages.success) {
      return NextResponse.json({ error: "Invalid photos" }, { status: 400 });
    }
    images = parsedImages.data;
  }

  // The number belongs to the listing's owner, also when an admin is editing
  const phoneError = await saveContactPhone(property.ownerId, body.contactPhone);
  if (phoneError) {
    return NextResponse.json({ error: phoneError }, { status: 400 });
  }

  const { price, deposit, lockInMonths, amenities, ...rest } = parsed.data;

  const updateProperty = prisma.property.update({
    where: { id },
    data: {
      ...rest,
      price,
      deposit: deposit ?? null,
      lockInMonths: lockInMonths && lockInMonths > 0 ? lockInMonths : null,
      coveredParking: rest.coveredParking ?? null,
      uncoveredParking: rest.uncoveredParking ?? null,
      amenities: stringifyAmenities(amenities ?? []),
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  let updated;
  if (images) {
    // There is no position column, so the photos are rewritten in the order
    // sent, 1 ms apart: readers sort by createdAt (PROPERTY_IMAGE_ORDER). At
    // most one primary survives, whatever the client flagged.
    const base = Date.now();
    const primary = images.findIndex((img) => img.isPrimary);
    [updated] = await prisma.$transaction([
      updateProperty,
      prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
      prisma.propertyImage.createMany({
        data: images.map((img, i) => ({
          propertyId: id,
          url: img.url,
          s3Key: img.s3Key,
          isPrimary: i === primary,
          createdAt: new Date(base + i),
        })),
      }),
    ]);
  } else {
    updated = await updateProperty;
  }

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
