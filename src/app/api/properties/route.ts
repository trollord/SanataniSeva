import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPropertySchema } from "@/lib/validations/property";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import { stringifyAmenities } from "@/lib/utils/formatters";
import { revalidatePath } from "next/cache";

const PAGE_SIZE = 12;

// Sensitive fields never returned in public listing responses
const PUBLIC_PROPERTY_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  listingType: true,
  status: true,
  building: true,
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
  rentNegotiable: true,
  lockInMonths: true,
  lockInNegotiable: true,
  availableFrom: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  // flatNumber intentionally excluded
  images: {
    select: { id: true, url: true, isPrimary: true },
    orderBy: { isPrimary: "desc" as const },
    take: 1,
  },
  owner: {
    select: { id: true, name: true, image: true },
    // phone/email intentionally excluded
  },
  _count: { select: { inquiries: true } },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const listingType = searchParams.get("listingType");
  const locality = searchParams.get("locality");
  const bedrooms = searchParams.get("bedrooms");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const furnished = searchParams.get("furnished");
  const sort = searchParams.get("sort");
  const availability = searchParams.get("availability"); // "now" | "30d"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = Math.min(50, Math.max(1, parseInt(searchParams.get("take") ?? String(PAGE_SIZE))));
  const skip = searchParams.has("skip") ? Math.max(0, parseInt(searchParams.get("skip")!)) : (page - 1) * take;

  const where = {
    status: "ACTIVE" as const,
    ...(type && { type: type as never }),
    ...(listingType && { listingType: listingType as never }),
    ...(locality && { locality }),
    ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
    ...(furnished && { furnished: furnished as never }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
    // Availability: unspecified (null) listings always match. ISO date strings
    // compare correctly as strings; "IMMEDIATE" is matched explicitly.
    ...((availability === "now" || availability === "30d") && {
      OR: [
        { availableFrom: null },
        { availableFrom: "IMMEDIATE" },
        {
          availableFrom: {
            lte: new Date(Date.now() + (availability === "30d" ? 30 : 0) * 86_400_000)
              .toISOString()
              .slice(0, 10),
          },
        },
      ],
    }),
  };

  const orderBy =
    sort === "price_asc" ? { price: "asc" as const } :
    sort === "price_desc" ? { price: "desc" as const } :
    sort === "area_desc" ? { areaSqft: "desc" as const } :
    { createdAt: "desc" as const };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: PUBLIC_PROPERTY_SELECT,
      orderBy,
      skip,
      take,
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json(
    { properties, total, page, totalPages: Math.ceil(total / PAGE_SIZE) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues ?? [];
      return NextResponse.json({ error: issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    // Validate locality is within Hiranandani Estate
    if (!HIRANANDANI_LOCALITIES.includes(parsed.data.locality as never)) {
      return NextResponse.json(
        { error: "Property must be within Hiranandani Estate" },
        { status: 400 }
      );
    }

    const { price, deposit, lockInMonths, ...rest } = parsed.data;

    const property = await prisma.property.create({
      data: {
        ...rest,
        price,
        deposit: deposit ?? null,
        lockInMonths: lockInMonths && lockInMonths > 0 ? lockInMonths : null,
        ownerId: session.user.id,
        // Admin listings skip the review queue - the admin is the reviewer
        status: session.user.role === "ADMIN" ? "ACTIVE" : "PENDING",
        ...(session.user.role === "ADMIN" && { activatedAt: new Date() }),
        amenities: stringifyAmenities(rest.amenities ?? []),
      },
      select: { id: true, status: true },
    });

    // Seed initial price history
    await prisma.priceHistory.create({
      data: { propertyId: property.id, price, source: "LISTING" },
    });

    // Grow the location index from listing data (best effort)
    try {
      const locAddress = `${rest.address}, ${rest.locality}`;
      await prisma.location.upsert({
        where: { name_address: { name: rest.building, address: locAddress } },
        update: { latitude: rest.latitude, longitude: rest.longitude },
        create: {
          name: rest.building,
          address: locAddress,
          locality: rest.locality,
          latitude: rest.latitude,
          longitude: rest.longitude,
        },
      });
    } catch {}

    // Admin listings go live immediately - refresh the public pages
    if (property.status === "ACTIVE") {
      revalidatePath("/listings");
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/properties]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
