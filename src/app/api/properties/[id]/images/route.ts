import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderedPropertyImageRows } from "@/lib/media-order";

type ImageBody = { url?: unknown; s3Key?: unknown; isPrimary?: unknown } | null;

const MAX_BATCH = 30; // same cap PUT /api/properties/[id] puts on a photo set

// The single-photo body's check (a url and an s3Key), applied to each photo
function isValidImage(img: ImageBody): img is { url: string; s3Key: string; isPrimary?: unknown } {
  return typeof img?.url === "string" && !!img.url && typeof img.s3Key === "string" && !!img.s3Key;
}

/**
 * Attaches photos to a listing. Takes either one photo ({ url, s3Key,
 * isPrimary }) or a whole set in order ({ images: [...] }) - the new-listing
 * form sends the set in one request rather than one request per photo.
 */
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

  const body = await req.json();

  if (Array.isArray(body?.images)) {
    const images: ImageBody[] = body.images;
    if (images.length === 0 || images.length > MAX_BATCH || !images.every(isValidImage)) {
      return NextResponse.json(
        { error: `1-${MAX_BATCH} photos, each with a url and s3Key, are required` },
        { status: 400 }
      );
    }

    // Rows are stamped 1 ms apart in the order sent, which is what
    // PROPERTY_IMAGE_ORDER reads back; at most one of them is primary.
    const rows = orderedPropertyImageRows(
      images.map((img) => ({ url: img.url, s3Key: img.s3Key, isPrimary: img.isPrimary === true }))
    );
    const create = prisma.propertyImage.createManyAndReturn({
      data: rows.map((row) => ({ propertyId: id, ...row })),
      select: { id: true, url: true, s3Key: true, isPrimary: true },
    });

    // A new primary displaces any existing one, as for a single photo
    const saved = rows.some((row) => row.isPrimary)
      ? (
          await prisma.$transaction([
            prisma.propertyImage.updateMany({
              where: { propertyId: id, isPrimary: true },
              data: { isPrimary: false },
            }),
            create,
          ])
        )[1]
      : await create;

    return NextResponse.json({ images: saved }, { status: 201 });
  }

  const { url, s3Key, isPrimary } = body;

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
