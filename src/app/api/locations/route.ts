import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Records index activity from the address search:
// - { id }                                → bump hit counter of a local result
// - { name, address, lat, lng, placeId } → save a place chosen via Google
//   fallback so future searches resolve locally (placeId storage is permitted
//   indefinitely by Google's ToS; the coordinates are user-confirmed listing
//   data)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  if (typeof body?.id === "string") {
    await prisma.location
      .update({ where: { id: body.id }, data: { hits: { increment: 1 } } })
      .catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const { name, address, lat, lng, placeId } = body ?? {};
  if (
    typeof name !== "string" || !name.trim() ||
    typeof address !== "string" ||
    typeof lat !== "number" || typeof lng !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = {
    name: name.trim().slice(0, 200),
    address: address.trim().slice(0, 300),
    latitude: lat,
    longitude: lng,
    hits: 1,
    ...(typeof placeId === "string" && placeId ? { placeId } : {}),
  };

  try {
    if (data.placeId) {
      await prisma.location.upsert({
        where: { placeId: data.placeId },
        update: { hits: { increment: 1 }, latitude: lat, longitude: lng },
        create: data,
      });
    } else {
      await prisma.location.upsert({
        where: { name_address: { name: data.name, address: data.address } },
        update: { hits: { increment: 1 } },
        create: data,
      });
    }
  } catch {
    // Unique races are harmless - the index is best-effort
  }

  return NextResponse.json({ ok: true });
}
